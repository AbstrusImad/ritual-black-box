import type {
  ContractAnalysis,
  TimelineEvent,
  SignalNode,
  SignalEdge,
  FailureFinding,
  Recommendation,
} from '@/types';
import { SYSTEM_CONTRACTS } from './ritual';

// ============================================================================
// Demo Mode data — realistic, hand-authored forensic stories.
// "Sigil Agent Alpha" is the flagship demo: a scheduler-driven agent whose
// first cycle succeeds and whose second cycle runs out of budget and times out.
// ============================================================================

const SUBJECT = '0x5191A0Fe9b1aE2C8c2f0d8b1Fb3aE7C0d4E1f2A3';
const USER = '0x9F4b3C2d1E0a8B7c6D5e4F3a2B1c0D9e8F7a6B5c';

function ev(e: TimelineEventDraft, i: number): TimelineEvent {
  return { id: e.id ?? `sigil-${i}`, ...e } as TimelineEvent;
}

type TimelineEventDraft = Omit<TimelineEvent, 'id'> & { id?: string };

const BASE_TS = 1_750_000_000; // arbitrary stable base
const BASE_BLOCK = 4_200_000;

const sigilTimeline: TimelineEventDraft[] = [
  {
    timestamp: BASE_TS,
    blockNumber: BASE_BLOCK,
    txHash: '0xa1d3...deploy',
    category: 'deploy',
    status: 'success',
    title: 'Contract deployed',
    summary: 'Sigil Agent Alpha was deployed and emitted AgentBooted.',
    detail:
      'The contract emitted AgentBooted(agent, owner, version="ExampleRitualAgent.v1"). This is a verified signal: the agent declared its identity on-chain.',
    confidence: 'verified',
    relatedAddress: SUBJECT,
    nodeId: 'subject',
    data: { owner: USER, version: 'ExampleRitualAgent.v1' },
  },
  {
    timestamp: BASE_TS + 120,
    blockNumber: BASE_BLOCK + 340,
    txHash: '0xb2e4...fund',
    category: 'wallet',
    status: 'success',
    title: 'RitualWallet funded',
    summary: 'Owner deposited fees into RitualWallet with a long lock.',
    detail:
      'RitualWalletChecked(balance=0.50 RITUAL, lockUntil=4,300,000, sufficient=true). Async precompile fees are paid from RitualWallet, not gas.',
    confidence: 'verified',
    relatedAddress: SYSTEM_CONTRACTS.RITUAL_WALLET,
    nodeId: 'ritual-wallet',
    data: { balance: '0.50 RITUAL', lockUntilBlock: 4_300_000, sufficient: true },
  },
  {
    timestamp: BASE_TS + 600,
    blockNumber: BASE_BLOCK + 1700,
    txHash: '0xc3f5...wake1',
    category: 'scheduler',
    status: 'info',
    title: 'Scheduler wake detected',
    summary: 'First scheduled wake fired (executionIndex 0).',
    detail:
      'SchedulerWake(executionIndex=0). The Scheduler system contract (0x56e7…8B) called the agent back. epoch advanced 0 → 1.',
    confidence: 'verified',
    relatedAddress: SYSTEM_CONTRACTS.SCHEDULER,
    nodeId: 'scheduler',
    data: { executionIndex: 0 },
  },
  {
    timestamp: BASE_TS + 605,
    blockNumber: BASE_BLOCK + 1701,
    txHash: '0xc3f5...req1',
    category: 'async',
    status: 'info',
    title: 'Async job requested',
    summary: 'Agent requested an LLM job (correlationId 0x7c…01).',
    detail:
      'AsyncJobRequested(correlationId=0x7c…01, precompile=0x0802 LLM, ttl=200). A short-running async precompile was invoked. One async call per transaction is allowed.',
    confidence: 'verified',
    correlationId: '0x7c01',
    relatedAddress: '0x0000000000000000000000000000000000000802',
    nodeId: 'precompile-llm',
    data: { precompile: '0x0802 (LLM)', ttl: 200 },
  },
  {
    timestamp: BASE_TS + 640,
    blockNumber: BASE_BLOCK + 1709,
    txHash: '0xd4a6...cb1',
    category: 'callback',
    status: 'success',
    title: 'Callback received',
    summary: 'AsyncDelivery delivered the result; sender verified.',
    detail:
      'CallbackReceived(correlationId=0x7c…01, deliveredBy=0x5A16…39F6). The callback came from the AsyncDelivery proxy and matched a pending correlationId — a clean, verifiable round trip.',
    confidence: 'verified',
    correlationId: '0x7c01',
    relatedAddress: SYSTEM_CONTRACTS.ASYNC_DELIVERY,
    nodeId: 'callback-router',
  },
  {
    timestamp: BASE_TS + 642,
    blockNumber: BASE_BLOCK + 1709,
    txHash: '0xd4a6...mem1',
    category: 'memory',
    status: 'success',
    title: 'Memory updated',
    summary: 'Agent wrote the result into its lastResult slot.',
    detail: 'MemoryUpdated(slot=keccak("lastResult"), prev=0x00, new=0x2a). State mutation logged after a verified callback.',
    confidence: 'verified',
    nodeId: 'memory',
    data: { slot: 'lastResult', newValue: '0x2a' },
  },
  {
    timestamp: BASE_TS + 3600,
    blockNumber: BASE_BLOCK + 10_300,
    txHash: '0xe5b7...wake2',
    category: 'scheduler',
    status: 'info',
    title: 'Second scheduler wake',
    summary: 'Second scheduled wake fired (executionIndex 1).',
    detail: 'SchedulerWake(executionIndex=1). epoch advanced 1 → 2. The cosmic clock keeps ticking.',
    confidence: 'verified',
    relatedAddress: SYSTEM_CONTRACTS.SCHEDULER,
    nodeId: 'scheduler',
    data: { executionIndex: 1 },
  },
  {
    timestamp: BASE_TS + 3602,
    blockNumber: BASE_BLOCK + 10_301,
    txHash: '0xe5b7...low',
    category: 'wallet',
    status: 'warning',
    title: 'Budget low',
    summary: 'RitualWallet balance fell below the next job cost.',
    detail:
      'BudgetLow(balance=0.004 RITUAL, required=0.02 RITUAL). The agent honestly reported it cannot afford the next async job. This is a warning, not yet a failure.',
    confidence: 'verified',
    relatedAddress: SYSTEM_CONTRACTS.RITUAL_WALLET,
    nodeId: 'ritual-wallet',
    data: { balance: '0.004 RITUAL', required: '0.02 RITUAL' },
  },
  {
    timestamp: BASE_TS + 3605,
    blockNumber: BASE_BLOCK + 10_302,
    txHash: '0xe5b7...req2',
    category: 'async',
    status: 'warning',
    title: 'Async job requested (underfunded)',
    summary: 'Agent requested a second LLM job despite low budget.',
    detail:
      'AsyncJobRequested(correlationId=0x7c…02, precompile=0x0802 LLM, ttl=200). The request was emitted, but with insufficient RitualWallet balance the commitment may never settle.',
    confidence: 'verified',
    correlationId: '0x7c02',
    relatedAddress: '0x0000000000000000000000000000000000000802',
    nodeId: 'precompile-llm',
    data: { precompile: '0x0802 (LLM)', ttl: 200 },
  },
  {
    timestamp: BASE_TS + 3960,
    blockNumber: BASE_BLOCK + 10_502,
    txHash: '—',
    category: 'failure',
    status: 'failure',
    title: 'No callback after async request',
    summary: 'No CallbackReceived for 0x7c…02 within the TTL window.',
    detail:
      'After ~200 blocks no CallbackReceived(0x7c…02) and no AsyncJobCompleted(0x7c…02) appeared. The job most likely failed to settle (underfunded) or the executor never delivered. There is no automatic retry on Ritual.',
    confidence: 'inferred',
    correlationId: '0x7c02',
    nodeId: 'subject',
  },
];

const sigilNodes: SignalNode[] = [
  { id: 'subject', kind: 'subject', label: 'Sigil Agent Alpha', address: SUBJECT, x: 0.5, y: 0.5, status: 'warning' },
  { id: 'user-wallet', kind: 'user-wallet', label: 'Owner', address: USER, x: 0.18, y: 0.22, status: 'success' },
  { id: 'ritual-wallet', kind: 'ritual-wallet', label: 'RitualWallet', address: SYSTEM_CONTRACTS.RITUAL_WALLET, x: 0.82, y: 0.26, status: 'warning' },
  { id: 'scheduler', kind: 'scheduler', label: 'Scheduler', address: SYSTEM_CONTRACTS.SCHEDULER, x: 0.2, y: 0.78, status: 'info' },
  { id: 'callback-router', kind: 'callback-router', label: 'AsyncDelivery', address: SYSTEM_CONTRACTS.ASYNC_DELIVERY, x: 0.82, y: 0.74, status: 'success' },
  { id: 'precompile-llm', kind: 'precompile', label: 'LLM 0x0802', address: '0x0000000000000000000000000000000000000802', x: 0.5, y: 0.12, status: 'failure' },
  { id: 'memory', kind: 'memory', label: 'Agent Memory', x: 0.5, y: 0.9, status: 'success' },
];

const sigilEdges: SignalEdge[] = [
  { id: 'e1', from: 'user-wallet', to: 'subject', kind: 'ownership', status: 'success', label: 'owner', active: false },
  { id: 'e2', from: 'subject', to: 'ritual-wallet', kind: 'funding', status: 'warning', label: 'deposit', active: true },
  { id: 'e3', from: 'scheduler', to: 'subject', kind: 'scheduler-wake', status: 'info', label: 'wake x2', active: true },
  { id: 'e4', from: 'subject', to: 'precompile-llm', kind: 'transaction', status: 'failure', label: 'async req x2', active: true },
  { id: 'e5', from: 'callback-router', to: 'subject', kind: 'callback', status: 'success', label: 'deliver x1', active: true },
  { id: 'e6', from: 'subject', to: 'memory', kind: 'memory-update', status: 'success', label: 'write', active: false },
];

const sigilFailures: FailureFinding[] = [
  {
    id: 'f1',
    title: 'Async job with no visible callback',
    severity: 'high',
    confidence: 'inferred',
    explanation:
      'A second async LLM request (0x7c…02) was emitted, but no callback or completion event followed within the TTL window. The workflow appears to stall on its second cycle.',
    evidence: [
      'AsyncJobRequested(0x7c…02) at block 4,210,302',
      'No CallbackReceived(0x7c…02) within +200 blocks',
      'No AsyncJobCompleted(0x7c…02)',
    ],
    possibleCause:
      'RitualWallet balance (0.004) was below the required job cost (0.02), so the commitment likely never settled. Alternatively the executor failed or the TTL expired.',
    recommendationId: 'r-budget',
    correlationId: '0x7c02',
  },
  {
    id: 'f2',
    title: 'Budget exhaustion before request',
    severity: 'medium',
    confidence: 'verified',
    explanation:
      'The agent emitted BudgetLow immediately before issuing its second async request. It proceeded anyway instead of pausing the workflow.',
    evidence: ['BudgetLow(balance=0.004, required=0.02) at block 4,210,301'],
    possibleCause: 'No budget gate before creating async jobs.',
    recommendationId: 'r-budget',
  },
  {
    id: 'f3',
    title: 'Possible TOCTOU exposure on epoch',
    severity: 'low',
    confidence: 'uncertain',
    explanation:
      'The agent reads epoch at request time and again in the callback. If a scheduler wake lands between request and delivery, the callback could act on a changed world. The demo contract flags this, but the pattern is worth auditing.',
    evidence: ['epochAtRequest captured per correlationId', 'Two scheduler wakes observed in the window'],
    possibleCause: 'State assumed constant across async boundary.',
    recommendationId: 'r-toctou',
  },
];

const sharedRecommendations: Recommendation[] = [
  {
    id: 'r-budget',
    title: 'Add a budget check before creating async jobs',
    why: 'Async precompile fees are paid from RitualWallet. If the balance is below the job cost, the commitment never settles and the callback never fires — silently.',
    risk: 'Stalled workflows that look "stuck" with no on-chain error. Hard to debug after the fact.',
    difficulty: 'easy',
    impact: 'high',
    category: 'wallet',
    eventExample: 'event BudgetLow(uint256 balance, uint256 required, uint256 timestamp);',
    codeExample: `uint256 bal = IRitualWallet(RITUAL_WALLET).balanceOf(address(this));
if (bal < requiredJobCost) {
    emit BudgetLow(bal, requiredJobCost, block.timestamp);
    _logPaused(correlationId, "insufficient budget");
    return; // do NOT issue the async request
}`,
  },
  {
    id: 'r-correlation',
    title: 'Use a correlationId to link request and callback',
    why: 'Without a stable id, the forensic engine (and your own contract) cannot prove a given callback belongs to a given request. Findings get downgraded to "inferred".',
    risk: 'Spoofed or mismatched callbacks can be processed as if legitimate.',
    difficulty: 'easy',
    impact: 'high',
    category: 'callback',
    eventExample:
      'event AsyncJobRequested(bytes32 indexed correlationId, address indexed precompile, bytes32 indexed jobKind, uint256 ttl, uint256 requestBlock);',
    codeExample: `bytes32 corrId = keccak256(abi.encodePacked(address(this), nonce++, block.number));
emit AsyncJobRequested(corrId, precompile, "LLM", ttl, block.number);
// ...later, in the callback...
require(_pendingCorrelation[corrId], "unknown correlationId");`,
  },
  {
    id: 'r-callback-auth',
    title: 'Validate msg.sender in every callback',
    why: 'All long-running async callbacks are delivered by AsyncDelivery (0x5A16…39F6). On Ritual, msg.sender in a callback is NOT the user.',
    risk: 'Anyone could call your callback with fake data and corrupt state.',
    difficulty: 'trivial',
    impact: 'high',
    category: 'callback',
    codeExample: `address constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;
modifier onlyAsyncDelivery() {
    require(msg.sender == ASYNC_DELIVERY, "only async delivery");
    _;
}`,
  },
  {
    id: 'r-toctou',
    title: 'Do not assume state is constant across the async boundary',
    why: 'Minutes or hours can pass between a request and its callback. The world can change. Snapshot the values you depend on and re-check them on delivery.',
    risk: 'Time-of-check/time-of-use bugs: the callback acts on stale assumptions.',
    difficulty: 'moderate',
    impact: 'medium',
    category: 'memory',
    codeExample: `// at request time
epochAtRequest[corrId] = epoch;
// at callback time
if (epochAtRequest[corrId] != epoch) {
    emit FailureDetected(corrId, 1, "TOCTOU", "epoch changed");
}`,
  },
  {
    id: 'r-events',
    title: 'Emit events at every lifecycle step (install BlackBoxLogger)',
    why: 'The Black Box can only reconstruct what was emitted. Contracts that emit clear, structured events get verified reconstructions instead of guesses.',
    risk: 'Your contract becomes a literal black box: no one, including you, can tell what it did.',
    difficulty: 'easy',
    impact: 'high',
    category: 'general',
  },
  {
    id: 'r-timeout',
    title: 'Add a timeout / escape hatch for stuck async state',
    why: 'Async callbacks are not guaranteed. If the executor fails or the TTL expires, the callback never fires. Never gate user actions on async state forever.',
    risk: 'Permanently stuck contracts that can never make progress.',
    difficulty: 'easy',
    impact: 'high',
    category: 'failure',
    codeExample: `uint256 constant PENDING_TTL = 500;
function expireIfStuck(bytes32 corrId) external {
    require(block.number > requestBlock[corrId] + PENDING_TTL, "ttl not reached");
    // mark expired, unblock the workflow
}`,
  },
];

export const SIGIL_AGENT_ALPHA: ContractAnalysis = {
  id: 'demo-sigil',
  createdAt: Date.now(),
  mode: 'demo',
  chainId: 1979,
  identity: {
    address: SUBJECT,
    isContract: true,
    hasBytecode: true,
    balanceWei: '4000000000000000',
    balanceFormatted: '0.004 RITUAL',
    firstSeenBlock: BASE_BLOCK,
    lastSeenBlock: BASE_BLOCK + 10_502,
    txCount: 7,
    eventCount: 12,
    classification: 'Scheduler-driven Ritual agent (BlackBoxLogger v1)',
    usesBlackBoxLogger: true,
    abiProvided: true,
  },
  timeline: sigilTimeline.map(ev),
  nodes: sigilNodes,
  edges: sigilEdges,
  failures: sigilFailures,
  recommendations: sharedRecommendations,
  patterns: [
    { id: 'p1', name: 'Scheduler-driven loop', confidence: 'verified', description: 'Recurring SchedulerWake events drive the agent.' },
    { id: 'p2', name: 'Short-running async (LLM)', confidence: 'verified', description: 'Uses the LLM precompile 0x0802 per cycle.' },
    { id: 'p3', name: 'Budget exhaustion', confidence: 'verified', description: 'BudgetLow precedes a stalled second cycle.' },
    { id: 'p4', name: 'Missing-callback stall', confidence: 'inferred', description: 'Second request has no observed callback.' },
  ],
  risk: {
    value: 64,
    basis: 'strong',
    label: 'Elevated risk',
    factors: [
      'A stalled async cycle with no callback (high severity)',
      'Budget exhausted before issuing a new job',
      'Strong evidence: contract emits BlackBoxLogger events',
    ],
  },
  missingEvidence: [
    {
      what: 'Final outcome of correlationId 0x7c…02',
      whyItMatters: 'We see the request but no settlement or callback. We cannot prove whether the job failed or simply was never delivered.',
      howToFix: 'Emit AsyncJobCompleted(correlationId, success) when the agent observes settlement, and FailureDetected on timeout.',
    },
  ],
  narrative:
    'Sigil Agent Alpha booted cleanly, was funded through RitualWallet, and ran one healthy cycle: the Scheduler woke it, it requested an LLM job, AsyncDelivery returned a verified callback, and it wrote the result to memory. On its second wake the wallet was nearly empty — the agent emitted BudgetLow but issued the async request anyway. No callback followed within the TTL. The most likely story is that the underfunded commitment never settled. This is inference, not proof: the contract did not emit a completion or failure event for that correlationId, so the final outcome is unknown.',
};

// --- A second, healthy demo for contrast ---

const HEALTHY_SUBJECT = '0x77a2B3c4D5e6F7081920A1b2C3d4E5f60718293A';

export const HEALTHY_WORKFLOW: ContractAnalysis = {
  id: 'demo-healthy',
  createdAt: Date.now(),
  mode: 'demo',
  chainId: 1979,
  identity: {
    address: HEALTHY_SUBJECT,
    isContract: true,
    hasBytecode: true,
    balanceWei: '500000000000000000',
    balanceFormatted: '0.50 RITUAL',
    firstSeenBlock: BASE_BLOCK,
    lastSeenBlock: BASE_BLOCK + 2000,
    txCount: 5,
    eventCount: 8,
    classification: 'Callback workflow (BlackBoxLogger v1)',
    usesBlackBoxLogger: true,
    abiProvided: true,
  },
  timeline: [
    sigilTimeline[0],
    sigilTimeline[1],
    sigilTimeline[3],
    sigilTimeline[4],
    sigilTimeline[5],
  ].map((e, i) => ev({ ...e, status: 'success' }, i)),
  nodes: sigilNodes.map((n) => ({ ...n, status: 'success' as const })),
  edges: sigilEdges.map((e) => ({ ...e, status: 'success' as const })),
  failures: [],
  recommendations: sharedRecommendations.slice(1, 4),
  patterns: [
    { id: 'p1', name: 'Clean request/callback round trip', confidence: 'verified', description: 'Every request has a matching verified callback.' },
  ],
  risk: {
    value: 12,
    basis: 'strong',
    label: 'Healthy',
    factors: ['All callbacks verified from AsyncDelivery', 'No stalled jobs', 'Budget sufficient throughout'],
  },
  missingEvidence: [],
  narrative:
    'This workflow is a clean reference. Every async request has a matching callback delivered by AsyncDelivery and verified against a correlationId. State updates are logged after each delivery. There are no stalled jobs and the budget stayed sufficient. This is what a healthy Ritual async flow looks like on the recorder.',
};

// --- A "silent" contract that emits almost nothing ---

const SILENT_SUBJECT = '0x0000abc1230000def4560000111122223333aBcD';

export const SILENT_CONTRACT: ContractAnalysis = {
  id: 'demo-silent',
  createdAt: Date.now(),
  mode: 'demo',
  chainId: 1979,
  identity: {
    address: SILENT_SUBJECT,
    isContract: true,
    hasBytecode: true,
    balanceWei: '0',
    balanceFormatted: '0 RITUAL',
    eventCount: 1,
    classification: 'Unknown contract (no BlackBoxLogger, few events)',
    usesBlackBoxLogger: false,
    abiProvided: false,
  },
  timeline: [
    ev(
      {
        timestamp: BASE_TS,
        blockNumber: BASE_BLOCK,
        txHash: '0x000…deploy',
        category: 'deploy',
        status: 'unknown',
        title: 'Contract deployed',
        summary: 'Bytecode exists at this address, but almost no events were emitted.',
        detail:
          'We can confirm a contract lives here, but it emits no recognizable lifecycle events. The forensic engine cannot reconstruct a meaningful story from on-chain data alone.',
        confidence: 'verified',
        relatedAddress: SILENT_SUBJECT,
        nodeId: 'subject',
      },
      0,
    ),
  ],
  nodes: [{ id: 'subject', kind: 'subject', label: 'Unknown contract', address: SILENT_SUBJECT, x: 0.5, y: 0.5, status: 'unknown' }],
  edges: [],
  failures: [],
  recommendations: [sharedRecommendations[4], sharedRecommendations[1]],
  patterns: [],
  risk: {
    value: 0,
    basis: 'insufficient',
    label: 'Insufficient evidence',
    factors: ['Contract emits too few events to assess risk', 'No BlackBoxLogger integration detected'],
  },
  missingEvidence: [
    {
      what: 'Essentially the entire behavioral history',
      whyItMatters: 'This contract does not emit lifecycle events, so its async activity, callbacks, and state changes are invisible on-chain.',
      howToFix: 'Integrate BlackBoxLogger.sol and emit events at each lifecycle step to make the contract analyzable.',
    },
  ],
  narrative:
    'There is a contract at this address, but it is quiet. It emits too few events to reconstruct a story. The Black Box will not invent one. To make this contract analyzable, integrate BlackBoxLogger.sol so it emits clear events for boot, async requests, callbacks, memory updates, and failures.',
};

export const DEMO_SCENARIOS: Record<string, ContractAnalysis> = {
  [SIGIL_AGENT_ALPHA.identity.address.toLowerCase()]: SIGIL_AGENT_ALPHA,
  [HEALTHY_WORKFLOW.identity.address.toLowerCase()]: HEALTHY_WORKFLOW,
  [SILENT_CONTRACT.identity.address.toLowerCase()]: SILENT_CONTRACT,
};

export const DEMO_LIST = [
  { analysis: SIGIL_AGENT_ALPHA, tagline: 'Scheduler agent that runs out of budget mid-flight' },
  { analysis: HEALTHY_WORKFLOW, tagline: 'A clean request/callback round trip' },
  { analysis: SILENT_CONTRACT, tagline: 'A contract too quiet to analyze' },
];

export const DEFAULT_DEMO = SIGIL_AGENT_ALPHA;
