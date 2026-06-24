// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BlackBoxRegistry} from "../src/BlackBoxRegistry.sol";
import {ExampleRitualAgent} from "../src/ExampleRitualAgent.sol";
import {ExampleCallbackWorkflow} from "../src/ExampleCallbackWorkflow.sol";

/// @notice Deploys the Ritual Black Box integration kit to Ritual Chain (1979).
///         Registry + two reference contracts, then self-registers them so the
///         Black Box tool can discover them immediately.
contract DeployScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        BlackBoxRegistry registry = new BlackBoxRegistry();
        console.log("BlackBoxRegistry:", address(registry));

        ExampleRitualAgent agent = new ExampleRitualAgent();
        console.log("ExampleRitualAgent:", address(agent));

        ExampleCallbackWorkflow workflow = new ExampleCallbackWorkflow();
        console.log("ExampleCallbackWorkflow:", address(workflow));

        registry.register(address(agent), "v1", "Sigil Agent Alpha", "agent");
        registry.register(address(workflow), "v1", "Callback Workflow Demo", "workflow");

        vm.stopBroadcast();
    }
}
