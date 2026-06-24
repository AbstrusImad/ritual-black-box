// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BlackBoxRegistry} from "../src/BlackBoxRegistry.sol";
import {ExampleRitualAgent} from "../src/ExampleRitualAgent.sol";
import {ExampleCallbackWorkflow} from "../src/ExampleCallbackWorkflow.sol";

contract BlackBoxTest is Test {
    address constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    // Local copies for vm.expectEmit (events cannot be emitted via interface name).
    event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason);
    event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail);

    BlackBoxRegistry registry;
    ExampleRitualAgent agent;
    ExampleCallbackWorkflow workflow;

    function setUp() public {
        registry = new BlackBoxRegistry();
        agent = new ExampleRitualAgent();
        workflow = new ExampleCallbackWorkflow();
    }

    // ----- Registry -----

    function test_registerAndRead() public {
        registry.register(address(agent), "v1", "Sigil Agent Alpha", "agent");
        assertTrue(registry.isRegistered(address(agent)));
        assertEq(registry.totalRegistered(), 1);

        BlackBoxRegistry.Registration memory reg = registry.getRegistration(address(agent));
        assertEq(reg.registrar, address(this));
        assertEq(reg.label, "Sigil Agent Alpha");
        assertTrue(reg.active);
    }

    function test_onlyRegistrarCanUpdate() public {
        registry.register(address(agent), "v1", "A", "agent");
        vm.prank(address(0xBEEF));
        vm.expectRevert(BlackBoxRegistry.NotRegistrar.selector);
        registry.update(address(agent), "v2", "B", false);
    }

    function test_cannotDoubleRegister() public {
        registry.register(address(agent), "v1", "A", "agent");
        vm.expectRevert(BlackBoxRegistry.AlreadyRegistered.selector);
        registry.register(address(agent), "v1", "A", "agent");
    }

    // ----- Callback security -----

    function test_callbackRejectedFromNonDelivery() public {
        bytes32 corr = _requestWorkflowJob();

        // Wrong sender => rejected, not processed.
        vm.prank(address(0xdead));
        vm.expectEmit(true, true, false, true);
        emit CallbackRejected(corr, address(0xdead), "sender is not AsyncDelivery");
        workflow.onResult(corr, 42);

        (ExampleCallbackWorkflow.Status status,,,) = workflow.jobs(corr);
        assertEq(uint8(status), uint8(ExampleCallbackWorkflow.Status.Requested));
    }

    function test_callbackAcceptedFromDelivery() public {
        bytes32 corr = _requestWorkflowJob();

        vm.prank(ASYNC_DELIVERY);
        workflow.onResult(corr, 99);

        (ExampleCallbackWorkflow.Status status,,, uint256 result) = workflow.jobs(corr);
        assertEq(uint8(status), uint8(ExampleCallbackWorkflow.Status.Fulfilled));
        assertEq(result, 99);
    }

    function test_callbackIsIdempotent() public {
        bytes32 corr = _requestWorkflowJob();

        vm.prank(ASYNC_DELIVERY);
        workflow.onResult(corr, 99);

        // Second delivery: correlationId no longer pending => rejected by logger.
        vm.prank(ASYNC_DELIVERY);
        workflow.onResult(corr, 1234);

        (,,, uint256 result) = workflow.jobs(corr);
        assertEq(result, 99); // unchanged
    }

    function test_toctouFlaggedWhenWorldChanges() public {
        bytes32 corr = _requestWorkflowJob();

        // World moves between request and callback.
        workflow.setWorldValue(777);

        vm.prank(ASYNC_DELIVERY);
        vm.expectEmit(true, false, false, true);
        emit FailureDetected(corr, 2, "TOCTOU", "worldValue changed before callback");
        workflow.onResult(corr, 5);
    }

    function test_escapeHatchExpiresStuckJob() public {
        bytes32 corr = _requestWorkflowJob();

        vm.expectRevert("ttl not reached");
        workflow.expireIfStuck(corr);

        vm.roll(block.number + workflow.PENDING_TTL() + 1);
        workflow.expireIfStuck(corr);

        (ExampleCallbackWorkflow.Status status,,,) = workflow.jobs(corr);
        assertEq(uint8(status), uint8(ExampleCallbackWorkflow.Status.Expired));
    }

    // ----- Agent lifecycle -----

    function test_agentSchedulerWakeBumpsEpoch() public {
        uint256 before = agent.epoch();
        agent.onSchedulerWake(1);
        assertEq(agent.epoch(), before + 1);
    }

    // ----- helpers -----

    function _requestWorkflowJob() internal returns (bytes32) {
        vm.recordLogs();
        bytes32 corr = workflow.request();
        return corr;
    }
}
