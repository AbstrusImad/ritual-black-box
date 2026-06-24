// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BlackBoxLogger} from "./BlackBoxLogger.sol";

/// @title ExampleCallbackWorkflow
/// @notice A conceptual async request/callback workflow showing the SECURE
///         pattern the Ritual Black Box recommends in its Fix Console:
///
///         request(correlationId) ──▶ async precompile ──▶ ...later...
///         AsyncDelivery ──▶ onResult(correlationId)  [verified + idempotent]
///
/// @dev This is the "good" reference the tool points builders toward. It
///      demonstrates every recommendation the Fix Console can emit:
///        - emit an event when creating an async job
///        - emit an event when receiving a callback
///        - validate msg.sender == AsyncDelivery
///        - idempotent callbacks (no double processing)
///        - correlationId to connect request and callback
///        - a timeout / escape hatch so user actions never gate on async state
///        - explicit TOCTOU acknowledgement
contract ExampleCallbackWorkflow is BlackBoxLogger {
    address public owner;

    /// @dev Per-request state machine.
    enum Status {
        None,
        Requested,
        Fulfilled,
        Failed,
        Expired
    }

    struct Job {
        Status status;
        uint256 requestBlock;
        uint256 snapshotValue; // value captured at request time (TOCTOU guard)
        uint256 resultValue;
    }

    mapping(bytes32 => Job) public jobs;

    /// @dev Escape hatch: if no callback within this many blocks, the job can
    ///      be expired by anyone so it never blocks the contract forever.
    uint256 public constant PENDING_TTL = 500;

    /// @dev Shared world state the workflow reads/writes. Used to show TOCTOU.
    uint256 public worldValue;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _logBoot(owner, "ExampleCallbackWorkflow.v1");
    }

    function setWorldValue(uint256 v) external onlyOwner {
        worldValue = v;
    }

    /// @notice Begin an async workflow step.
    function request() external onlyOwner returns (bytes32 correlationId) {
        correlationId = _newCorrelationId(uint256(uint160(msg.sender)) + worldValue);

        jobs[correlationId] = Job({
            status: Status.Requested,
            requestBlock: block.number,
            snapshotValue: worldValue, // snapshot for later comparison
            resultValue: 0
        });

        // Emit intent BEFORE the precompile call.
        _logAsyncRequested(correlationId, address(0x0805), "LONG_HTTP", PENDING_TTL);

        // RITUAL INTEGRATION POINT (stub): invoke long-running precompile here.
        // The settled task id would normally be stored alongside the job.
    }

    /// @notice Verified, idempotent callback.
    /// @dev AsyncDelivery (0x5A16...39F6) is msg.sender for long-running results.
    function onResult(bytes32 correlationId, uint256 resultValue) external {
        // 1) Authenticate the delivery + log it.
        if (!_validateAndLogCallback(correlationId)) {
            return;
        }

        Job storage job = jobs[correlationId];

        // 2) Idempotency: never process the same job twice.
        if (job.status != Status.Requested) {
            _logCallbackRejected(correlationId, "job not in Requested state");
            return;
        }

        // 3) TOCTOU: the world may have moved. Do not silently trust the snapshot.
        if (job.snapshotValue != worldValue) {
            _logFailure(correlationId, 2, "TOCTOU", "worldValue changed before callback");
            // We still record the result but flag the divergence for the builder.
        }

        // 4) Check-Effects: update state, then log.
        job.status = Status.Fulfilled;
        job.resultValue = resultValue;
        _logAsyncCompleted(correlationId, true);
    }

    /// @notice Escape hatch. Anyone can expire a stuck job after the TTL so the
    ///         workflow never deadlocks waiting for a callback that never comes.
    function expireIfStuck(bytes32 correlationId) external {
        Job storage job = jobs[correlationId];
        require(job.status == Status.Requested, "not pending");
        require(block.number > job.requestBlock + PENDING_TTL, "ttl not reached");

        job.status = Status.Expired;
        _logFailure(correlationId, 1, "TIMEOUT", "no callback before PENDING_TTL");
        _logPaused(correlationId, "auto-expired by escape hatch");
    }

    receive() external payable {}
}
