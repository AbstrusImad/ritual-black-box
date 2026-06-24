// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A complete minimal example of a Ritual agent instrumented with the
// BlackBoxLogger kit. Copy the BlackBoxLogger + IBlackBoxLogger sources from
// the Ritual Black Box repo's /contracts/src into your project, then follow
// this shape.
//
// This file shows ONLY how to emit the events correctly. To understand what a
// deployed agent actually did, analyze its address in the Ritual Black Box app:
// https://ritual-black-box.pages.dev

import {BlackBoxLogger} from "./BlackBoxLogger.sol";

contract InstrumentedAgent is BlackBoxLogger {
    address public owner;
    uint256 public lastResult;
    uint256 public worldValue; // shared state used to demonstrate the TOCTOU guard
    uint256 private _nonce;

    bytes32 internal constant SLOT_RESULT = keccak256("lastResult");

    mapping(bytes32 => bool) public fulfilled;
    mapping(bytes32 => uint256) public requestBlock;
    mapping(bytes32 => uint256) public snapshotAtRequest;

    uint256 public constant PENDING_TTL = 500;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // (2) boot
        _logBoot(owner, "InstrumentedAgent.v1");
    }

    function setWorldValue(uint256 v) external onlyOwner {
        worldValue = v;
    }

    /// Begin an async step. Emits intent BEFORE the precompile call.
    function requestWork() external onlyOwner returns (bytes32 corrId) {
        corrId = _newCorrelationId(_nonce++);
        requestBlock[corrId] = block.number;
        snapshotAtRequest[corrId] = worldValue;

        // (3) the single most important event — opens the correlationId.
        _logAsyncRequested(corrId, address(0x0802), "LLM", 200);

        // RITUAL INTEGRATION POINT: invoke the async precompile here
        // (see the ritual-dapp-llm / ritual-dapp-agents skills for the call).
    }

    /// Verified, idempotent, TOCTOU-aware callback. AsyncDelivery is msg.sender.
    function onResult(bytes32 corrId, uint256 value) external {
        // (4) validate sender + correlationId, and log it. Returns false if bad.
        if (!_validateAndLogCallback(corrId)) {
            return; // rejection already logged; never process untrusted data
        }
        require(!fulfilled[corrId], "already fulfilled");
        fulfilled[corrId] = true;

        // TOCTOU guard
        if (snapshotAtRequest[corrId] != worldValue) {
            _logFailure(corrId, 1, "TOCTOU", "worldValue changed before callback");
        }

        // (5) effects + state log
        uint256 prev = lastResult;
        lastResult = value;
        _logMemory(SLOT_RESULT, bytes32(prev), bytes32(value));
        _logAsyncCompleted(corrId, true);
    }

    /// Escape hatch — callbacks are not guaranteed.
    function expireIfStuck(bytes32 corrId) external {
        require(!fulfilled[corrId], "already fulfilled");
        require(block.number > requestBlock[corrId] + PENDING_TTL, "ttl not reached");
        _logFailure(corrId, 1, "TIMEOUT", "no callback before PENDING_TTL");
        _logPaused(corrId, "auto-expired by escape hatch");
    }

    receive() external payable {}
}
