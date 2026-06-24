import { parseAbi } from 'viem';

// ============================================================================
// BlackBoxLogger event surface — the schema the forensic engine decodes with
// the highest confidence. Contracts that emit these events get "verified"
// reconstructions; contracts that don't fall back to inference.
// ============================================================================

export const BLACKBOX_LOGGER_ABI = parseAbi([
  'event AgentBooted(address indexed agent, address indexed owner, bytes32 version, uint256 timestamp)',
  'event RitualWalletChecked(address indexed agent, uint256 balance, uint256 lockUntilBlock, bool sufficient)',
  'event AsyncJobRequested(bytes32 indexed correlationId, address indexed precompile, bytes32 indexed jobKind, uint256 ttl, uint256 requestBlock)',
  'event AsyncJobCompleted(bytes32 indexed correlationId, bool success, uint256 settleBlock)',
  'event CallbackReceived(bytes32 indexed correlationId, address indexed deliveredBy, uint256 deliveredBlock)',
  'event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason)',
  'event MemoryUpdated(bytes32 indexed slot, bytes32 previousValue, bytes32 newValue, uint256 timestamp)',
  'event SchedulerWake(uint256 indexed executionIndex, uint256 wakeBlock)',
  'event BudgetLow(uint256 balance, uint256 required, uint256 timestamp)',
  'event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail)',
  'event RecoveryAttempted(bytes32 indexed correlationId, string strategy, bool success)',
  'event WorkflowPaused(bytes32 indexed correlationId, string reason, uint256 timestamp)',
  'event WorkflowResumed(bytes32 indexed correlationId, uint256 timestamp)',
]);

/** AsyncJobTracker system events — readable on any contract that touches async. */
export const ASYNC_JOB_TRACKER_ABI = parseAbi([
  'event JobAdded(address indexed executor, bytes32 indexed jobId, address indexed precompileAddress, uint256 commitBlock, bytes precompileInput, address senderAddress, bytes32 previousBlockHash, uint256 previousBlockNumber, uint256 previousBlockTimestamp, uint256 ttl, uint256 createdAt)',
  'event Phase1Settled(bytes32 indexed jobId, address indexed executor, uint256 settledBlock)',
  'event ResultDelivered(bytes32 indexed jobId, address indexed target, bool success)',
  'event JobRemoved(address indexed executor, bytes32 indexed jobId, bool indexed completed)',
]);

export const RITUAL_WALLET_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function lockUntil(address account) view returns (uint256)',
]);
