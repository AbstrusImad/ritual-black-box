# Secure Callback Pattern

The callback shape every instrumented Ritual contract should use. Four rules,
in order. This makes the difference between a "verified" reconstruction and a
corruptible contract.

> This is about WRITING a safe callback. To check whether a deployed contract's
> callbacks behaved correctly, analyze it in the Ritual Black Box app.

```solidity
address constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

mapping(bytes32 => bool) public fulfilled;
mapping(bytes32 => uint256) public snapshotAtRequest;

function onResult(bytes32 corrId, uint256 value) external {
    // 1. AUTH — on Ritual, msg.sender in a callback is AsyncDelivery, not the user.
    require(msg.sender == ASYNC_DELIVERY, "only async delivery");

    // 2. IDEMPOTENT — a delivery can be replayed; never process twice.
    require(!fulfilled[corrId], "already fulfilled");
    fulfilled[corrId] = true;

    // 3. TOCTOU — minutes/hours can pass before the callback. Do not assume the
    //    world is unchanged. Snapshot at request time, re-check here.
    if (snapshotAtRequest[corrId] != currentWorldValue()) {
        emit FailureDetected(corrId, 1, "TOCTOU", "state changed before callback");
    }

    // 4. EFFECTS THEN LOG — apply, then record the verified round trip.
    _apply(value);
    emit CallbackReceived(corrId, msg.sender, block.number);
}
```

## Escape hatch (callbacks are not guaranteed)

If the executor fails or the TTL expires, the callback never fires. Never let
user actions deadlock on async state.

```solidity
uint256 public constant PENDING_TTL = 500;
mapping(bytes32 => uint256) public requestBlock;

function expireIfStuck(bytes32 corrId) external {
    require(!fulfilled[corrId], "already fulfilled");
    require(block.number > requestBlock[corrId] + PENDING_TTL, "ttl not reached");
    emit FailureDetected(corrId, 1, "TIMEOUT", "no callback before PENDING_TTL");
    emit WorkflowPaused(corrId, "auto-expired", block.timestamp);
}
```

## Why each rule exists

- **Auth:** without it, anyone can call your callback with fake data.
- **Idempotent:** a replayed delivery could double-spend or double-process.
- **TOCTOU:** the request and callback are separated in time; stale assumptions
  cause subtle bugs.
- **Escape hatch:** prevents permanently stuck contracts.
