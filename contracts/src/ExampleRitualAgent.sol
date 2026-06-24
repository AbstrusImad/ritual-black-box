// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BlackBoxLogger} from "./BlackBoxLogger.sol";

/// @notice Minimal Scheduler interface (see ritual-dapp-contracts skill).
///         The Scheduler always calls back msg.sender; there is no target param.
interface IScheduler {
    function schedule(bytes memory data, uint32 gas, uint32 numCalls, uint32 frequency)
        external
        returns (uint256 callId);
    function cancel(uint256 callId) external;
}

/// @notice Minimal RitualWallet interface (see ritual-dapp-wallet skill).
interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function balanceOf(address account) external view returns (uint256);
    function lockUntil(address account) external view returns (uint256);
}

/// @title ExampleRitualAgent
/// @notice A reference agent that emits a COMPLETE BlackBox flight-record over
///         its lifecycle: boot -> fund -> scheduler wake -> async request ->
///         callback -> memory update -> failure -> recovery.
///
/// @dev This contract is a teaching example for the Ritual Black Box tool. It
///      shows EXACTLY where real Ritual primitives plug in, marked with
///      `RITUAL INTEGRATION POINT`. The async precompile call itself is left as
///      a documented stub so the example compiles and deploys on testnet
///      without funded executors, while still emitting a faithful event story.
///
///      SECURITY NOTES baked into this example:
///      - Callbacks are authenticated against AsyncDelivery (via the logger).
///      - correlationId links request <-> callback so deliveries can't be spoofed.
///      - State is NOT assumed constant between request and callback (TOCTOU):
///        we re-read `epoch` inside the callback and emit a failure if it moved.
contract ExampleRitualAgent is BlackBoxLogger {
    address public owner;
    uint256 public epoch;          // bumped each scheduler wake
    uint256 public lastResult;     // last value written by a callback
    uint256 private _nonce;

    bytes32 internal constant SLOT_EPOCH = keccak256("epoch");
    bytes32 internal constant SLOT_RESULT = keccak256("lastResult");

    // correlationId => epoch captured at request time (TOCTOU guard)
    mapping(bytes32 => uint256) public epochAtRequest;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // RITUAL INTEGRATION POINT: agent comes online.
        _logBoot(owner, "ExampleRitualAgent.v1");
    }

    /// @notice Deposit fees into RitualWallet for the SIGNING EOA.
    /// @dev RITUAL INTEGRATION POINT: async precompile fees are paid from
    ///      RitualWallet, not gas. Lock must cover commit_block + ttl. For dev
    ///      use a generous lock (e.g. 100_000 blocks).
    function fund(uint256 lockDuration, uint256 expectedJobCost) external payable onlyOwner {
        IRitualWallet wallet = IRitualWallet(RITUAL_WALLET);
        wallet.deposit{value: msg.value}(lockDuration);

        uint256 bal = wallet.balanceOf(address(this));
        uint256 lockBlk = wallet.lockUntil(address(this));
        _logWalletChecked(bal, lockBlk, expectedJobCost);
    }

    /// @notice Register this agent for recurring Scheduler wakes.
    /// @dev RITUAL INTEGRATION POINT: only contracts may call Scheduler.schedule.
    ///      The callback is always to msg.sender (this contract) => onSchedulerWake.
    function startSchedule(uint32 gas, uint32 numCalls, uint32 frequency)
        external
        onlyOwner
        returns (uint256 callId)
    {
        bytes memory data = abi.encodeWithSelector(this.onSchedulerWake.selector, uint256(0));
        callId = IScheduler(SCHEDULER).schedule(data, gas, numCalls, frequency);
    }

    /// @notice Scheduler-driven wake. The first uint256 arg is overwritten with
    ///         the real executionIndex by the Scheduler at execution time.
    /// @dev RITUAL INTEGRATION POINT: this is the "cosmic clock" tick.
    function onSchedulerWake(uint256 executionIndex) external {
        // In production, gate this to the Scheduler system sender.
        _logSchedulerWake(executionIndex);

        uint256 prev = epoch;
        epoch = prev + 1;
        _logMemory(SLOT_EPOCH, bytes32(prev), bytes32(epoch));

        _requestWork();
    }

    /// @notice Owner can also manually trigger a work request (demo/testing).
    function triggerWork() external onlyOwner {
        _requestWork();
    }

    /// @dev Emits the request event, then would invoke an async precompile.
    function _requestWork() internal {
        bytes32 corrId = _newCorrelationId(_nonce++);
        epochAtRequest[corrId] = epoch;

        // RITUAL INTEGRATION POINT: log intent BEFORE the precompile call.
        // jobKind is a free-form tag the Black Box uses for grouping.
        _logAsyncRequested(corrId, address(0x0802), "LLM", 200);

        // RITUAL INTEGRATION POINT (stub): here you would encode and call the
        // LLM (0x0802) or a long-running precompile. On a funded testnet with
        // live executors, replace this stub with the real precompile call from
        // the ritual-dapp-llm / ritual-dapp-agents skill. The callback below
        // (onAgentResult) is what AsyncDelivery will invoke for long-running
        // precompiles.
        //
        // (bool ok, bytes memory raw) = address(0x0802).call(encodedRequest);
    }

    /// @notice Long-running async callback. AsyncDelivery is msg.sender.
    /// @dev RITUAL INTEGRATION POINT: callback security lives here.
    function onAgentResult(bytes32 correlationId, uint256 resultValue) external {
        // Validate sender + known correlationId, and log the outcome.
        if (!_validateAndLogCallback(correlationId)) {
            return; // rejection already logged; do not process untrusted data
        }

        // TOCTOU GUARD: the world may have changed since we made the request.
        // Never assume epoch is the same. If it moved, flag it honestly.
        if (epochAtRequest[correlationId] != epoch) {
            _logFailure(
                correlationId,
                1, // medium
                "TOCTOU",
                "epoch changed between request and callback"
            );
        }

        uint256 prev = lastResult;
        lastResult = resultValue;
        _logMemory(SLOT_RESULT, bytes32(prev), bytes32(resultValue));
        _logAsyncCompleted(correlationId, true);
    }

    /// @notice Demo helper: simulate detecting and recovering from a failure.
    function reportFailure(bytes32 correlationId, uint8 severity, string calldata code, string calldata detail)
        external
        onlyOwner
    {
        _logFailure(correlationId, severity, code, detail);
    }

    function attemptRecovery(bytes32 correlationId, string calldata strategy, bool success) external onlyOwner {
        _logRecovery(correlationId, strategy, success);
    }

    receive() external payable {}
}
