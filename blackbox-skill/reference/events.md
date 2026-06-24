# BlackBoxLogger — Event Reference

The complete event surface. Implement via the `BlackBoxLogger` mixin (preferred)
or declare `IBlackBoxLogger` directly. Emit each event at the point described.

> Reminder: this is about EMITTING events. To analyze a deployed contract, use
> the Ritual Black Box app (https://ritual-black-box.pages.dev), not this file.

## Lifecycle: boot & funding

```solidity
event AgentBooted(address indexed agent, address indexed owner, bytes32 version, uint256 timestamp);
```
Emit once, in the constructor or first boot. Anchors the start of the flight
record and declares the owner.

```solidity
event RitualWalletChecked(address indexed agent, uint256 balance, uint256 lockUntilBlock, bool sufficient);
```
Emit after reading RitualWallet balance. Lets the recorder prove whether a later
stall was caused by underfunding.

## Lifecycle: async jobs (the spine)

```solidity
event AsyncJobRequested(bytes32 indexed correlationId, address indexed precompile, bytes32 indexed jobKind, uint256 ttl, uint256 requestBlock);
```
Emit IMMEDIATELY BEFORE invoking an async precompile. `correlationId` opens the
loop that the callback closes. `jobKind` is a free tag (e.g. "LLM", "LONG_HTTP").
This is the single most important event — without it, a missing callback is
invisible.

```solidity
event AsyncJobCompleted(bytes32 indexed correlationId, bool success, uint256 settleBlock);
```
Emit when the agent observes settlement. Distinguishes "finished" from "still
pending" from "failed".

## Lifecycle: callbacks (from AsyncDelivery)

```solidity
event CallbackReceived(bytes32 indexed correlationId, address indexed deliveredBy, uint256 deliveredBlock);
```
Emit inside a verified callback (after confirming `msg.sender == AsyncDelivery`
and the correlationId is pending). Proves the async round trip completed.

```solidity
event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason);
```
Emit when a callback fails validation (wrong sender, unknown/duplicate id).
Surfaces spoofing attempts or misrouted deliveries.

## Lifecycle: state & scheduler

```solidity
event MemoryUpdated(bytes32 indexed slot, bytes32 previousValue, bytes32 newValue, uint256 timestamp);
```
Emit after mutating important state. Makes state changes auditable.

```solidity
event SchedulerWake(uint256 indexed executionIndex, uint256 wakeBlock);
```
Emit at the start of a Scheduler-driven wake. Separates autonomous activity from
user-triggered activity.

```solidity
event BudgetLow(uint256 balance, uint256 required, uint256 timestamp);
```
Emit when RitualWallet funds fall below the next job cost. Early-warning signal
that connects "ran out of money" to a later stalled job.

## Lifecycle: failure & recovery

```solidity
event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail);
```
Emit when the agent detects a failure. `severity`: 0=low, 1=medium, 2=high,
3=critical. Self-reported failures become verified findings.

```solidity
event RecoveryAttempted(bytes32 indexed correlationId, string strategy, bool success);
```
Emit on recovery attempts. Shows the agent tried to self-heal and whether it
worked.

```solidity
event WorkflowPaused(bytes32 indexed correlationId, string reason, uint256 timestamp);
event WorkflowResumed(bytes32 indexed correlationId, uint256 timestamp);
```
Emit when intentionally pausing/resuming a workflow, so a deliberate stop is not
misreported as a failure.
