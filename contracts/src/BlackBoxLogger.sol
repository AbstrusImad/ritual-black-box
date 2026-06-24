// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBlackBoxLogger} from "./IBlackBoxLogger.sol";

/// @title BlackBoxLogger
/// @notice Drop-in mixin that gives any Ritual contract a complete, structured
///         flight-recorder event surface. Inherit it and call the internal
///         `_log*` helpers at the right points in your async lifecycle.
///
/// @dev INTEGRATION (the short version)
///      1. `contract MyAgent is BlackBoxLogger { ... }`
///      2. In your constructor: `_logBoot(owner, "v1");`
///      3. Before an async precompile call: `_logAsyncRequested(corrId, precompile, "LLM", ttl);`
///      4. In your callback (after `require(msg.sender == ASYNC_DELIVERY)`):
///         `_logCallback(corrId);`
///      5. On state writes: `_logMemory(slot, oldV, newV);`
///
///      This contract holds NO funds and has NO privileged powers. It only
///      emits events. That is deliberate: a logger should never be able to
///      change the behavior of the contract it instruments.
abstract contract BlackBoxLogger is IBlackBoxLogger {
    /// @dev AsyncDelivery proxy is `msg.sender` for ALL long-running callbacks
    ///      on Ritual Chain. Callback validation MUST compare against this.
    address internal constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    /// @dev Core Ritual system contracts, surfaced here for convenience so
    ///      instrumented contracts and the Black Box tool agree on addresses.
    address internal constant RITUAL_WALLET = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address internal constant ASYNC_JOB_TRACKER = 0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5;
    address internal constant SCHEDULER = 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;

    /// @dev Tracks correlationIds we have requested but not yet seen settled.
    ///      Lets a contract self-detect "async job with no continuation".
    mapping(bytes32 => bool) internal _pendingCorrelation;
    mapping(bytes32 => uint256) internal _requestBlockOf;

    // ---------------------------------------------------------------------
    // Boot & funding
    // ---------------------------------------------------------------------

    function _logBoot(address owner, bytes32 version) internal {
        emit AgentBooted(address(this), owner, version, block.timestamp);
    }

    function _logWalletChecked(uint256 balance, uint256 lockUntilBlock, uint256 required) internal {
        bool ok = balance >= required;
        emit RitualWalletChecked(address(this), balance, lockUntilBlock, ok);
        if (!ok) {
            emit BudgetLow(balance, required, block.timestamp);
        }
    }

    // ---------------------------------------------------------------------
    // Async jobs
    // ---------------------------------------------------------------------

    /// @dev Call this on the line BEFORE you invoke the async precompile so the
    ///      forensic timeline shows intent even if the precompile call reverts.
    function _logAsyncRequested(bytes32 correlationId, address precompile, bytes32 jobKind, uint256 ttl) internal {
        _pendingCorrelation[correlationId] = true;
        _requestBlockOf[correlationId] = block.number;
        emit AsyncJobRequested(correlationId, precompile, jobKind, ttl, block.number);
    }

    function _logAsyncCompleted(bytes32 correlationId, bool success) internal {
        _pendingCorrelation[correlationId] = false;
        emit AsyncJobCompleted(correlationId, success, block.number);
    }

    // ---------------------------------------------------------------------
    // Callbacks
    // ---------------------------------------------------------------------

    /// @notice Validate + log a callback in one call.
    /// @dev Returns false (and emits CallbackRejected) instead of reverting so
    ///      the caller can decide how to handle a bad delivery. The Black Box
    ///      tool reads both the success and rejection events.
    function _validateAndLogCallback(bytes32 correlationId) internal returns (bool) {
        if (msg.sender != ASYNC_DELIVERY) {
            emit CallbackRejected(correlationId, msg.sender, "sender is not AsyncDelivery");
            return false;
        }
        if (!_pendingCorrelation[correlationId]) {
            // Unknown id => either a replay, a spoof, or a request we never logged.
            emit CallbackRejected(correlationId, msg.sender, "unknown or already-settled correlationId");
            return false;
        }
        _pendingCorrelation[correlationId] = false;
        emit CallbackReceived(correlationId, msg.sender, block.number);
        return true;
    }

    function _logCallbackRejected(bytes32 correlationId, string memory reason) internal {
        emit CallbackRejected(correlationId, msg.sender, reason);
    }

    // ---------------------------------------------------------------------
    // State & scheduler
    // ---------------------------------------------------------------------

    function _logMemory(bytes32 slot, bytes32 previousValue, bytes32 newValue) internal {
        emit MemoryUpdated(slot, previousValue, newValue, block.timestamp);
    }

    function _logSchedulerWake(uint256 executionIndex) internal {
        emit SchedulerWake(executionIndex, block.number);
    }

    // ---------------------------------------------------------------------
    // Failure & recovery
    // ---------------------------------------------------------------------

    function _logFailure(bytes32 correlationId, uint8 severity, string memory code, string memory detail) internal {
        emit FailureDetected(correlationId, severity, code, detail);
    }

    function _logRecovery(bytes32 correlationId, string memory strategy, bool success) internal {
        emit RecoveryAttempted(correlationId, strategy, success);
    }

    function _logPaused(bytes32 correlationId, string memory reason) internal {
        emit WorkflowPaused(correlationId, reason, block.timestamp);
    }

    function _logResumed(bytes32 correlationId) internal {
        emit WorkflowResumed(correlationId, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /// @notice Deterministic correlationId helper. Mixing in block.number keeps
    ///         ids unique across repeated calls with the same nonce.
    function _newCorrelationId(uint256 nonce) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), nonce, block.number, block.timestamp));
    }

    function isCorrelationPending(bytes32 correlationId) external view returns (bool) {
        return _pendingCorrelation[correlationId];
    }
}
