import { formatEther, decodeEventLog, type Log, type Abi } from 'viem';
import { getPublicClient, SYSTEM_CONTRACTS, PRECOMPILES } from './ritual';
import { BLACKBOX_LOGGER_ABI } from './blackboxAbi';
import { DEMO_SCENARIOS } from './demoData';
import type {
  ContractAnalysis,
  TimelineEvent,
  SignalNode,
  SignalEdge,
  FailureFinding,
  Recommendation,
  EventCategory,
  SignalStatus,
  RiskScore,
} from '@/types';

// ============================================================================
// The forensic engine.
//   - Demo Mode: returns hand-authored scenarios.
//   - RPC Mode: reads public on-chain data (bytecode, balance, logs) and
//     reconstructs what it honestly can, decoding BlackBoxLogger events when
//     present and degrading to inference / "missing evidence" otherwise.
// ============================================================================

export type EngineMode = 'demo' | 'rpc';

const ASYNC_BLOCK_LOOKBACK = 50_000n; // how far back to scan logs
const MAX_TIMELINE_EVENTS = 800; // cap rendered events; keeps high-volume contracts responsive

/** Map a BlackBoxLogger event name to a timeline category + status. */
function classify(eventName: string): { category: EventCategory; status: SignalStatus } {
  switch (eventName) {
    case 'AgentBooted':
      return { category: 'deploy', status: 'success' };
    case 'RitualWalletChecked':
      return { category: 'wallet', status: 'success' };
    case 'BudgetLow':
      return { category: 'wallet', status: 'warning' };
    case 'SchedulerWake':
      return { category: 'scheduler', status: 'info' };
    case 'AsyncJobRequested':
      return { category: 'async', status: 'info' };
    case 'AsyncJobCompleted':
      return { category: 'async', status: 'success' };
    case 'CallbackReceived':
      return { category: 'callback', status: 'success' };
    case 'CallbackRejected':
      return { category: 'callback', status: 'failure' };
    case 'MemoryUpdated':
      return { category: 'memory', status: 'success' };
    case 'FailureDetected':
      return { category: 'failure', status: 'failure' };
    case 'RecoveryAttempted':
      return { category: 'failure', status: 'warning' };
    case 'WorkflowPaused':
      return { category: 'failure', status: 'warning' };
    case 'WorkflowResumed':
      return { category: 'failure', status: 'info' };
    default:
      return { category: 'unknown', status: 'unknown' };
  }
}

function humanSummary(eventName: string, args: Record<string, unknown>): string {
  switch (eventName) {
    case 'AgentBooted':
      return `Agent declared itself online (version ${String(args.version ?? '')}).`;
    case 'RitualWalletChecked':
      return `RitualWallet checked — ${args.sufficient ? 'sufficient' : 'INSUFFICIENT'} balance.`;
    case 'BudgetLow':
      return 'RitualWallet balance fell below the next job cost.';
    case 'SchedulerWake':
      return `Scheduler woke the agent (execution #${String(args.executionIndex ?? '?')}).`;
    case 'AsyncJobRequested':
      return `Async job requested on precompile ${String(args.precompile ?? '')}.`;
    case 'AsyncJobCompleted':
      return `Async job ${args.success ? 'completed' : 'reported failure'}.`;
    case 'CallbackReceived':
      return 'Callback received and verified from AsyncDelivery.';
    case 'CallbackRejected':
      return `Callback REJECTED: ${String(args.reason ?? '')}.`;
    case 'MemoryUpdated':
      return 'Agent updated its internal memory/state.';
    case 'FailureDetected':
      return `Failure detected: ${String(args.code ?? '')} — ${String(args.detail ?? '')}.`;
    case 'RecoveryAttempted':
      return `Recovery attempted (${args.success ? 'succeeded' : 'failed'}).`;
    case 'WorkflowPaused':
      return `Workflow paused: ${String(args.reason ?? '')}.`;
    case 'WorkflowResumed':
      return 'Workflow resumed.';
    default:
      return 'Unrecognized event.';
  }
}

function stringifyArgs(args: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (args && typeof args === 'object') {
    for (const [k, v] of Object.entries(args as Record<string, unknown>)) {
      if (typeof v === 'bigint') out[k] = v.toString();
      else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
      else out[k] = String(v);
    }
  }
  return out;
}

/** Parse a user-supplied ABI (full JSON artifact or a bare ABI array). */
export function parseUserAbi(text?: string): Abi | null {
  if (!text || !text.trim()) return null;
  try {
    const parsed = JSON.parse(text);
    // Accept either a raw ABI array or a Hardhat/Foundry artifact { abi: [...] }.
    const abi = Array.isArray(parsed) ? parsed : parsed.abi;
    if (Array.isArray(abi) && abi.length > 0) return abi as Abi;
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to decode a log. First against the BlackBoxLogger schema (verified),
 * then against a user-provided ABI (decoded). Returns null on miss.
 */
function tryDecode(
  log: Log,
  userAbi: Abi | null,
): { name: string; args: Record<string, unknown>; source: 'logger' | 'abi' } | null {
  try {
    const decoded = decodeEventLog({ abi: BLACKBOX_LOGGER_ABI, data: log.data, topics: log.topics });
    return { name: String(decoded.eventName), args: (decoded.args ?? {}) as Record<string, unknown>, source: 'logger' };
  } catch {
    /* fall through to user ABI */
  }
  if (userAbi) {
    try {
      const decoded = decodeEventLog({ abi: userAbi, data: log.data, topics: log.topics });
      return { name: String(decoded.eventName), args: (decoded.args ?? {}) as Record<string, unknown>, source: 'abi' };
    } catch {
      /* unknown */
    }
  }
  return null;
}

/** Build a Signal Map from a reconstructed timeline + identity. */
function buildGraph(address: string, timeline: TimelineEvent[]): { nodes: SignalNode[]; edges: SignalEdge[] } {
  const nodes: SignalNode[] = [
    { id: 'subject', kind: 'subject', label: 'Subject contract', address, x: 0.5, y: 0.5, status: 'info' },
  ];
  const edges: SignalEdge[] = [];
  const seen = new Set<string>(['subject']);

  const ensure = (node: SignalNode) => {
    if (!seen.has(node.id)) {
      nodes.push(node);
      seen.add(node.id);
    }
  };

  const hasCat = (c: EventCategory) => timeline.some((t) => t.category === c);

  if (hasCat('wallet')) {
    ensure({ id: 'ritual-wallet', kind: 'ritual-wallet', label: 'RitualWallet', address: SYSTEM_CONTRACTS.RITUAL_WALLET, x: 0.82, y: 0.26, status: 'info' });
    edges.push({ id: 'g-wallet', from: 'subject', to: 'ritual-wallet', kind: 'funding', status: 'info', label: 'fees', active: true });
  }
  if (hasCat('scheduler')) {
    ensure({ id: 'scheduler', kind: 'scheduler', label: 'Scheduler', address: SYSTEM_CONTRACTS.SCHEDULER, x: 0.2, y: 0.78, status: 'info' });
    edges.push({ id: 'g-sched', from: 'scheduler', to: 'subject', kind: 'scheduler-wake', status: 'info', label: 'wake', active: true });
  }
  if (hasCat('async')) {
    ensure({ id: 'precompile', kind: 'precompile', label: 'Async precompile', x: 0.5, y: 0.12, status: 'info' });
    edges.push({ id: 'g-async', from: 'subject', to: 'precompile', kind: 'transaction', status: 'info', label: 'async req', active: true });
  }
  if (hasCat('callback')) {
    ensure({ id: 'callback-router', kind: 'callback-router', label: 'AsyncDelivery', address: SYSTEM_CONTRACTS.ASYNC_DELIVERY, x: 0.82, y: 0.74, status: 'success' });
    edges.push({ id: 'g-cb', from: 'callback-router', to: 'subject', kind: 'callback', status: 'success', label: 'deliver', active: true });
  }
  if (hasCat('memory')) {
    ensure({ id: 'memory', kind: 'memory', label: 'Agent Memory', x: 0.5, y: 0.9, status: 'success' });
    edges.push({ id: 'g-mem', from: 'subject', to: 'memory', kind: 'memory-update', status: 'success', label: 'write', active: false });
  }

  return { nodes, edges };
}

/** Detect missing-callback stalls: a request with no following callback/completion. */
function detectFailures(timeline: TimelineEvent[]): FailureFinding[] {
  const failures: FailureFinding[] = [];

  // Explicit failure / rejection events
  timeline
    .filter((t) => t.category === 'failure' || (t.category === 'callback' && t.status === 'failure'))
    .forEach((t, i) => {
      failures.push({
        id: `df-${i}`,
        title: t.title,
        severity: t.status === 'failure' ? 'high' : 'medium',
        confidence: t.confidence,
        explanation: t.detail ?? t.summary,
        evidence: [`${t.title} at block ${t.blockNumber}`],
        possibleCause: 'See event detail.',
        correlationId: t.correlationId,
        txHash: t.txHash,
      });
    });

  // Requests without callbacks
  const requested = timeline.filter((t) => t.category === 'async' && t.title.toLowerCase().includes('request'));
  for (const req of requested) {
    if (!req.correlationId) continue;
    const settled = timeline.some(
      (t) =>
        t.correlationId === req.correlationId &&
        (t.category === 'callback' || (t.category === 'async' && t.title.toLowerCase().includes('complet'))),
    );
    if (!settled) {
      failures.push({
        id: `stall-${req.correlationId}`,
        title: 'Async job with no visible callback',
        severity: 'high',
        confidence: 'inferred',
        explanation:
          'An async request was emitted but no matching callback or completion event followed. The job may have failed to settle, the executor may not have delivered, or the TTL expired. There is no automatic retry on Ritual.',
        evidence: [`AsyncJobRequested(${req.correlationId}) at block ${req.blockNumber}`, 'No matching CallbackReceived / AsyncJobCompleted'],
        possibleCause: 'Underfunded RitualWallet, executor failure, or TTL expiry.',
        recommendationId: 'r-budget',
        correlationId: req.correlationId,
      });
    }
  }

  return failures;
}

function computeRisk(timeline: TimelineEvent[], failures: FailureFinding[], hasLogger: boolean, eventCount: number): RiskScore {
  if (eventCount <= 1) {
    return {
      value: 0,
      basis: 'insufficient',
      label: 'Insufficient evidence',
      factors: ['Contract emits too few events to assess risk'],
    };
  }
  let score = 0;
  const factors: string[] = [];
  for (const f of failures) {
    const w = f.severity === 'critical' ? 40 : f.severity === 'high' ? 25 : f.severity === 'medium' ? 12 : 5;
    score += w;
    factors.push(`${f.title} (${f.severity})`);
  }
  if (timeline.some((t) => t.category === 'wallet' && t.status === 'warning')) {
    score += 8;
    factors.push('Budget warning observed');
  }
  score = Math.min(100, score);
  const basis = hasLogger ? 'strong' : failures.length > 0 ? 'partial' : 'partial';
  const label = score >= 70 ? 'High risk' : score >= 40 ? 'Elevated risk' : score >= 15 ? 'Moderate risk' : 'Healthy';
  if (factors.length === 0) factors.push('No failure signals detected in the scanned window');
  return { value: score, basis, label, factors };
}

const GENERIC_RECS: Recommendation[] = [
  {
    id: 'r-events',
    title: 'Emit lifecycle events (install BlackBoxLogger)',
    why: 'The Black Box can only reconstruct what was emitted on-chain. Structured events turn guesses into verified findings.',
    risk: 'Your contract becomes unanalyzable — a literal black box.',
    difficulty: 'easy',
    impact: 'high',
    category: 'general',
  },
  {
    id: 'r-callback-auth',
    title: 'Validate msg.sender in callbacks',
    why: 'Long-running async callbacks come from AsyncDelivery (0x5A16…39F6), not the user.',
    risk: 'Spoofed callbacks can corrupt state.',
    difficulty: 'trivial',
    impact: 'high',
    category: 'callback',
    codeExample: `require(msg.sender == 0x5A16214fF555848411544b005f7Ac063742f39F6, "only async delivery");`,
  },
  {
    id: 'r-budget',
    title: 'Check RitualWallet budget before async calls',
    why: 'Async fees are paid from RitualWallet; underfunded commitments never settle.',
    risk: 'Silent stalls with no on-chain error.',
    difficulty: 'easy',
    impact: 'high',
    category: 'wallet',
  },
];

/**
 * Reconstruct a ContractAnalysis from real on-chain data via RPC.
 * This is intentionally conservative: it only claims what it can decode.
 */
export async function analyzeViaRpc(address: string, userAbi: Abi | null = null): Promise<ContractAnalysis> {
  const client = getPublicClient();

  const [bytecode, balance, latestBlock] = await Promise.all([
    client.getCode({ address: address as `0x${string}` }),
    client.getBalance({ address: address as `0x${string}` }),
    client.getBlockNumber(),
  ]);

  const hasBytecode = !!bytecode && bytecode !== '0x';
  const fromBlock = latestBlock > ASYNC_BLOCK_LOOKBACK ? latestBlock - ASYNC_BLOCK_LOOKBACK : 0n;

  let logs: Log[] = [];
  try {
    logs = await client.getLogs({
      address: address as `0x${string}`,
      fromBlock,
      toBlock: latestBlock,
    });
  } catch {
    // Some RPCs cap the range; degrade gracefully to no logs.
    logs = [];
  }

  const totalLogs = logs.length;
  // Keep the most RECENT events (logs come back oldest-first), and cap how many
  // we materialize into timeline objects so the UI stays responsive on
  // high-volume contracts (e.g. busy ERC-20s with tens of thousands of logs).
  const capped = totalLogs > MAX_TIMELINE_EVENTS ? logs.slice(-MAX_TIMELINE_EVENTS) : logs;

  const timeline: TimelineEvent[] = [];
  let loggerCount = 0;
  let abiDecodedCount = 0;
  let unknownCount = 0;

  for (const log of capped) {
    const decoded = tryDecode(log, userAbi);
    const blockNumber = Number(log.blockNumber ?? 0n);
    const txHash = log.transactionHash ?? '0x';
    if (decoded) {
      const fromAbi = decoded.source === 'abi';
      if (fromAbi) abiDecodedCount++;
      else loggerCount++;
      const { category, status } = fromAbi ? { category: 'unknown' as EventCategory, status: 'info' as SignalStatus } : classify(decoded.name);
      const args = stringifyArgs(decoded.args);
      timeline.push({
        id: `${txHash}-${log.logIndex}`,
        timestamp: 0,
        blockNumber,
        txHash,
        category,
        status,
        title: decoded.name.replace(/([A-Z])/g, ' $1').trim(),
        summary: fromAbi
          ? `Decoded "${decoded.name}" using the provided ABI.`
          : humanSummary(decoded.name, decoded.args),
        detail: `${fromAbi ? 'Decoded via imported ABI' : 'Decoded BlackBoxLogger event'} ${decoded.name}. ${JSON.stringify(args)}`,
        confidence: fromAbi ? 'decoded' : 'verified',
        correlationId: typeof args.correlationId === 'string' ? args.correlationId : undefined,
        relatedAddress: typeof args.precompile === 'string' ? args.precompile : undefined,
        data: args,
      });
    } else {
      unknownCount++;
      timeline.push({
        id: `${txHash}-${log.logIndex}`,
        timestamp: 0,
        blockNumber,
        txHash,
        category: 'unknown',
        status: 'unknown',
        title: 'Unknown event',
        summary: 'An event was emitted but could not be decoded without an ABI.',
        detail: `topic0=${log.topics[0] ?? '—'}, topics=${log.topics.length}. Provide an ABI (Enhanced Mode) to decode this.`,
        confidence: 'missing',
        data: { topic0: log.topics[0] ?? '—', topicCount: log.topics.length },
      });
    }
  }

  timeline.sort((a, b) => a.blockNumber - b.blockNumber);

  const hasLogger = loggerCount > 0;
  const eventCount = totalLogs;
  const { nodes, edges } = buildGraph(address, timeline);
  const failures = detectFailures(timeline);
  const risk = computeRisk(timeline, failures, hasLogger, eventCount);

  const missingEvidence = [];
  if (totalLogs > MAX_TIMELINE_EVENTS) {
    missingEvidence.push({
      what: `${(totalLogs - MAX_TIMELINE_EVENTS).toLocaleString()} older events not shown`,
      whyItMatters: `This contract emitted ${totalLogs.toLocaleString()} events in the scanned window. For performance, only the ${MAX_TIMELINE_EVENTS} most recent are reconstructed.`,
      howToFix: 'Narrow the analysis to a specific contract/agent with fewer events, or filter the timeline.',
    });
  }
  if (!hasBytecode) {
    missingEvidence.push({
      what: 'Contract bytecode',
      whyItMatters: 'No code at this address — it is an EOA or an undeployed/destroyed contract. There is no contract behavior to reconstruct.',
    });
  }
  if (unknownCount > 0) {
    missingEvidence.push({
      what: `${unknownCount} undecodable event(s)`,
      whyItMatters: 'These events have no known signature. Their meaning is unknown without an ABI.',
      howToFix: 'Import the contract ABI in Enhanced Mode to decode them.',
    });
  }
  if (!hasLogger && hasBytecode) {
    missingEvidence.push({
      what: 'Structured lifecycle events',
      whyItMatters: 'This contract does not emit BlackBoxLogger events, so async requests, callbacks, and state changes are largely invisible.',
      howToFix: 'Integrate BlackBoxLogger.sol (see the Integration Kit).',
    });
  }

  const narrative = buildNarrative(hasBytecode, hasLogger, eventCount, failures.length, abiDecodedCount);

  return {
    id: `rpc-${address.toLowerCase()}-${Date.now()}`,
    createdAt: Date.now(),
    mode: userAbi ? 'enhanced' : 'rpc',
    chainId: 1979,
    identity: {
      address,
      isContract: hasBytecode,
      hasBytecode,
      balanceWei: balance.toString(),
      balanceFormatted: `${formatEther(balance)} RITUAL`,
      lastSeenBlock: Number(latestBlock),
      eventCount,
      classification: hasBytecode
        ? hasLogger
          ? 'Ritual contract (BlackBoxLogger detected)'
          : 'Contract (no BlackBoxLogger events)'
        : 'EOA or no code at address',
      usesBlackBoxLogger: hasLogger,
      abiProvided: !!userAbi,
    },
    timeline,
    nodes,
    edges,
    failures,
    recommendations: hasLogger ? GENERIC_RECS.filter((r) => r.id !== 'r-events') : GENERIC_RECS,
    patterns: [],
    risk,
    missingEvidence,
    narrative,
  };
}

function buildNarrative(
  hasBytecode: boolean,
  hasLogger: boolean,
  eventCount: number,
  failureCount: number,
  abiDecodedCount = 0,
): string {
  if (!hasBytecode) {
    return 'There is no contract code at this address. It is either a regular wallet (EOA) or a contract that was never deployed or has been destroyed. The Black Box has nothing to reconstruct here.';
  }
  if (eventCount === 0) {
    return 'A contract exists at this address, but it emitted no events in the scanned window. The Black Box cannot reconstruct a behavioral story from on-chain data alone. Integrate BlackBoxLogger.sol to make it analyzable.';
  }
  if (!hasLogger) {
    if (abiDecodedCount > 0) {
      return `This contract does not emit BlackBoxLogger events, but ${abiDecodedCount} event(s) were decoded using the ABI you provided (Enhanced Mode). These are labeled "decoded" rather than "verified" against the Ritual lifecycle schema.`;
    }
    return `This contract emitted ${eventCount} event(s) in the scanned window, but none match the BlackBoxLogger schema, so the reconstruction is limited. Import an ABI in Enhanced Mode, or integrate BlackBoxLogger.sol for a verified flight record.`;
  }
  return `Reconstructed ${eventCount} on-chain event(s) for this contract, decoding its BlackBoxLogger lifecycle${
    abiDecodedCount > 0 ? ` (plus ${abiDecodedCount} decoded via your ABI)` : ''
  }. ${
    failureCount > 0
      ? `${failureCount} potential issue(s) were detected — see the Failure Autopsy.`
      : 'No failure signals were detected in the scanned window.'
  }`;
}

/** Top-level analyze entry point used by the UI. */
export async function analyze(address: string, mode: EngineMode, abiText?: string): Promise<ContractAnalysis> {
  const key = address.toLowerCase();
  if (mode === 'demo') {
    // Known demo address => exact scenario; otherwise default to a generated "silent" view.
    const scenario = DEMO_SCENARIOS[key];
    if (scenario) return { ...scenario, createdAt: Date.now() };
    // Unknown address in demo mode: synthesize a "silent" analysis for that address.
    return {
      ...DEMO_SCENARIOS[Object.keys(DEMO_SCENARIOS)[2]],
      id: `demo-silent-${key}`,
      createdAt: Date.now(),
      identity: { ...DEMO_SCENARIOS[Object.keys(DEMO_SCENARIOS)[2]].identity, address },
    };
  }
  return analyzeViaRpc(address, parseUserAbi(abiText));
}

export function precompileName(addr?: string): string {
  if (!addr) return 'precompile';
  const p = PRECOMPILES[addr.toLowerCase()];
  return p ? `${p.name} (${p.address})` : addr;
}
