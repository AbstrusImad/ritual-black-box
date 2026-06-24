// ============================================================================
// Ritual Black Box — core domain types
// ============================================================================
// These types describe what the forensic engine can reconstruct from public
// on-chain data, and crucially, how *confident* it is about each finding.
// Honesty is a first-class concern: every signal carries a confidence label.
// ============================================================================

/** How the app obtained the data feeding an analysis. */
export type AnalysisMode = 'demo' | 'rpc' | 'enhanced';

/** Epistemic status of any finding. The app never pretends to know more than it does. */
export type ConfidenceLevel =
  | 'verified' // decoded directly from an on-chain log/receipt
  | 'decoded' // decoded with a provided/known ABI
  | 'inferred' // pattern-matched, not directly proven
  | 'uncertain' // weak signal, may be wrong
  | 'missing'; // we know we DON'T know this

/** Visual/semantic status used across timeline + map. */
export type SignalStatus = 'success' | 'warning' | 'failure' | 'unknown' | 'info';

/** High-level evidence labels surfaced in the report. */
export type EvidenceLabel =
  | 'Verified Signal'
  | 'Decoded Event'
  | 'Inferred Pattern'
  | 'Missing Evidence'
  | 'Unknown Behavior'
  | 'Potential Risk'
  | 'Critical Finding';

export type EventCategory =
  | 'deploy'
  | 'wallet'
  | 'scheduler'
  | 'async'
  | 'callback'
  | 'memory'
  | 'failure'
  | 'ownership'
  | 'unknown';

export interface TimelineEvent {
  id: string;
  timestamp: number; // unix seconds
  blockNumber: number;
  txHash: string;
  category: EventCategory;
  status: SignalStatus;
  /** Short machine-ish title, e.g. "Async job requested". */
  title: string;
  /** One-line human explanation. */
  summary: string;
  /** Longer technical narrative for expand/collapse. */
  detail?: string;
  confidence: ConfidenceLevel;
  /** Optional contract/wallet this event relates to. */
  relatedAddress?: string;
  /** Links request <-> callback when present. */
  correlationId?: string;
  /** Raw decoded fields for the inspector. */
  data?: Record<string, string | number | boolean>;
  /** Maps to a node in the Signal Map. */
  nodeId?: string;
}

export type NodeKind =
  | 'subject' // the analyzed contract/agent
  | 'user-wallet'
  | 'ritual-wallet'
  | 'callback-router'
  | 'scheduler'
  | 'memory'
  | 'external-contract'
  | 'precompile';

export interface SignalNode {
  id: string;
  kind: NodeKind;
  label: string;
  address?: string;
  /** Layout hint, normalized 0..1. */
  x: number;
  y: number;
  status: SignalStatus;
  /** Free-form detail for the inspector. */
  meta?: Record<string, string | number>;
}

export type EdgeKind =
  | 'transaction'
  | 'event'
  | 'callback'
  | 'funding'
  | 'ownership'
  | 'scheduler-wake'
  | 'memory-update'
  | 'unknown';

export interface SignalEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  status: SignalStatus;
  label?: string;
  /** Whether to animate a packet traveling along this edge. */
  active?: boolean;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface FailureFinding {
  id: string;
  title: string;
  severity: Severity;
  confidence: ConfidenceLevel;
  /** Plain-language explanation. */
  explanation: string;
  /** What on-chain evidence supports this. */
  evidence: string[];
  /** Best-guess root cause. */
  possibleCause: string;
  /** What to do about it. */
  recommendationId?: string;
  /** Related correlationId / tx. */
  correlationId?: string;
  txHash?: string;
}

export type Difficulty = 'trivial' | 'easy' | 'moderate' | 'involved';
export type Impact = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  title: string;
  /** Why it matters. */
  why: string;
  /** Risk if ignored. */
  risk: string;
  difficulty: Difficulty;
  impact: Impact;
  /** Optional Solidity snippet illustrating the fix. */
  codeExample?: string;
  /** Optional event signature suggestion. */
  eventExample?: string;
  category: EventCategory | 'general';
}

export interface RiskScore {
  /** 0..100, higher = riskier. */
  value: number;
  /** Honesty about the basis of the score. */
  basis: 'strong' | 'partial' | 'insufficient';
  label: string; // e.g. "Elevated risk"
  /** Bullet rationale. */
  factors: string[];
}

export interface MissingEvidenceItem {
  what: string;
  whyItMatters: string;
  howToFix?: string;
}

export interface ContractIdentity {
  address: string;
  isContract: boolean;
  hasBytecode: boolean;
  balanceWei: string;
  balanceFormatted: string;
  firstSeenBlock?: number;
  lastSeenBlock?: number;
  txCount?: number;
  eventCount: number;
  /** Heuristic classification. */
  classification: string;
  usesBlackBoxLogger: boolean;
  abiProvided: boolean;
}

export interface DetectedPattern {
  id: string;
  name: string;
  confidence: ConfidenceLevel;
  description: string;
}

export interface ContractAnalysis {
  id: string;
  createdAt: number;
  mode: AnalysisMode;
  chainId: number;
  identity: ContractIdentity;
  timeline: TimelineEvent[];
  nodes: SignalNode[];
  edges: SignalEdge[];
  failures: FailureFinding[];
  recommendations: Recommendation[];
  patterns: DetectedPattern[];
  risk: RiskScore;
  missingEvidence: MissingEvidenceItem[];
  /** Narrative-mode plain English summary. */
  narrative: string;
  /** Saved label/notes (Evidence Vault). */
  label?: string;
  notes?: string;
  starredEventIds?: string[];
}

/** A scan step shown during the cinematic analysis sequence. */
export interface ScanStep {
  key: string;
  label: string;
}

/** Decoded vs unknown log distinction used by the RPC layer. */
export interface DecodedLog {
  kind: 'decoded';
  eventName: string;
  blockNumber: number;
  txHash: string;
  args: Record<string, string | number | boolean>;
}

export interface UnknownLog {
  kind: 'unknown';
  topic0: string;
  blockNumber: number;
  txHash: string;
  topicCount: number;
}

export type AnyLog = DecodedLog | UnknownLog;
