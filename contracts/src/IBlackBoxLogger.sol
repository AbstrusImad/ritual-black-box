// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IBlackBoxLogger
/// @notice Canonical event surface that Ritual-native agents and async
///         workflows can emit so the Ritual Black Box forensic tool can
///         reconstruct a complete, honest history of on-chain behavior.
///
/// @dev WHY THIS EXISTS
///      Ritual Black Box reconstructs the *public* story of a contract from
///      on-chain data: logs, receipts, balances, callback deliveries. The
///      richer and more structured the events a contract emits, the higher
///      the confidence of the reconstruction. Contracts that emit nothing
///      can only be analyzed by inference. This interface defines a stable,
///      indexed event vocabulary that maps 1:1 to the Ritual async lifecycle
///      (request -> commitment -> settlement -> callback delivery).
///
///      `correlationId` is the spine of the whole design. It links an async
///      request to its (possibly much later) callback. Without it, the Black
///      Box cannot prove that a given callback belongs to a given request and
///      must downgrade the finding to "inferred".
interface IBlackBoxLogger {
    // ---------------------------------------------------------------------
    // Lifecycle: boot & funding
    // ---------------------------------------------------------------------

    /// @notice Emitted once when an agent comes online / is wired up.
    event AgentBooted(address indexed agent, address indexed owner, bytes32 version, uint256 timestamp);

    /// @notice Emitted after the contract reads its RitualWallet balance.
    /// @param sufficient Whether the balance covers the next planned async job.
    event RitualWalletChecked(address indexed agent, uint256 balance, uint256 lockUntilBlock, bool sufficient);

    // ---------------------------------------------------------------------
    // Lifecycle: async jobs (the core of Ritual forensics)
    // ---------------------------------------------------------------------

    /// @notice Emitted immediately BEFORE invoking an async precompile.
    /// @param correlationId Caller-generated id linking request <-> callback.
    /// @param precompile The precompile address being invoked (e.g. 0x0801).
    /// @param ttl Max blocks allowed for settlement / delivery.
    event AsyncJobRequested(
        bytes32 indexed correlationId,
        address indexed precompile,
        bytes32 indexed jobKind,
        uint256 ttl,
        uint256 requestBlock
    );

    /// @notice Emitted when the agent observes a job has settled (phase 1).
    event AsyncJobCompleted(bytes32 indexed correlationId, bool success, uint256 settleBlock);

    // ---------------------------------------------------------------------
    // Lifecycle: callbacks (delivered by AsyncDelivery)
    // ---------------------------------------------------------------------

    /// @notice Emitted inside a verified callback (msg.sender == AsyncDelivery).
    event CallbackReceived(bytes32 indexed correlationId, address indexed deliveredBy, uint256 deliveredBlock);

    /// @notice Emitted when a callback was received but REJECTED by validation.
    /// @param reason Human-readable rejection reason (e.g. "bad sender", "unknown id").
    event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason);

    // ---------------------------------------------------------------------
    // Lifecycle: state & scheduler
    // ---------------------------------------------------------------------

    /// @notice Emitted after the agent mutates its own memory/state.
    event MemoryUpdated(bytes32 indexed slot, bytes32 previousValue, bytes32 newValue, uint256 timestamp);

    /// @notice Emitted at the start of a Scheduler-driven wake cycle.
    event SchedulerWake(uint256 indexed executionIndex, uint256 wakeBlock);

    /// @notice Emitted when RitualWallet funds are running low.
    event BudgetLow(uint256 balance, uint256 required, uint256 timestamp);

    // ---------------------------------------------------------------------
    // Lifecycle: failure & recovery
    // ---------------------------------------------------------------------

    /// @notice Emitted when the agent detects a failure in its own flow.
    /// @param severity 0=low, 1=medium, 2=high, 3=critical.
    event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail);

    /// @notice Emitted when the agent attempts to recover from a failure.
    event RecoveryAttempted(bytes32 indexed correlationId, string strategy, bool success);

    /// @notice Emitted when a workflow is paused (e.g. budget, repeated failure).
    event WorkflowPaused(bytes32 indexed correlationId, string reason, uint256 timestamp);

    /// @notice Emitted when a paused workflow resumes.
    event WorkflowResumed(bytes32 indexed correlationId, uint256 timestamp);
}
