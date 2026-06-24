// ============================================================================
// BlackBox Integration Kit — copyable code snippets surfaced in the UI.
// These mirror the on-chain contracts in /contracts/src so builders can paste
// them directly into their own Ritual projects.
// ============================================================================

export interface CodeSnippet {
  id: string;
  title: string;
  language: 'solidity';
  description: string;
  /** Step-by-step guidance shown above the code. */
  steps?: string[];
  code: string;
}

export const RECOMMENDED_EVENTS: { name: string; signature: string; when: string; why: string }[] = [
  { name: 'AgentBooted', signature: 'event AgentBooted(address indexed agent, address indexed owner, bytes32 version, uint256 timestamp);', when: 'Once, when the agent comes online.', why: 'Anchors the start of the flight record and declares who owns the agent. Without it, the recorder cannot tell when the contract began operating or who controls it.' },
  { name: 'RitualWalletChecked', signature: 'event RitualWalletChecked(address indexed agent, uint256 balance, uint256 lockUntilBlock, bool sufficient);', when: 'After reading RitualWallet balance.', why: 'Async fees come from RitualWallet, not gas. Logging the balance lets the recorder prove whether a later stall was caused by underfunding.' },
  { name: 'AsyncJobRequested', signature: 'event AsyncJobRequested(bytes32 indexed correlationId, address indexed precompile, bytes32 indexed jobKind, uint256 ttl, uint256 requestBlock);', when: 'Immediately BEFORE an async precompile call.', why: 'This is the single most important event. It records intent and opens a correlationId that the callback will close. Without it, a missing callback is invisible.' },
  { name: 'AsyncJobCompleted', signature: 'event AsyncJobCompleted(bytes32 indexed correlationId, bool success, uint256 settleBlock);', when: 'When settlement is observed.', why: 'Closes the loop opened by AsyncJobRequested. Lets the recorder distinguish "finished successfully" from "still pending" from "failed".' },
  { name: 'CallbackReceived', signature: 'event CallbackReceived(bytes32 indexed correlationId, address indexed deliveredBy, uint256 deliveredBlock);', when: 'Inside a verified callback.', why: 'Proves the async round trip actually completed and that the result was delivered by AsyncDelivery. Turns an "inferred" success into a "verified" one.' },
  { name: 'CallbackRejected', signature: 'event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason);', when: 'When a callback fails validation.', why: 'Surfaces spoofing attempts or misrouted deliveries. A rejected callback is a security signal the recorder flags immediately.' },
  { name: 'MemoryUpdated', signature: 'event MemoryUpdated(bytes32 indexed slot, bytes32 previousValue, bytes32 newValue, uint256 timestamp);', when: 'After mutating state.', why: 'Makes state changes auditable. Lets the recorder show what the agent actually changed and when, instead of guessing from balances.' },
  { name: 'SchedulerWake', signature: 'event SchedulerWake(uint256 indexed executionIndex, uint256 wakeBlock);', when: 'At the start of a scheduler-driven wake.', why: 'Distinguishes autonomous (scheduled) activity from user-triggered activity. Without it, recurring agent behavior looks like random transactions.' },
  { name: 'BudgetLow', signature: 'event BudgetLow(uint256 balance, uint256 required, uint256 timestamp);', when: 'When RitualWallet funds run low.', why: 'Early-warning signal. Lets the recorder connect "ran out of money" to a later stalled job — the most common silent failure on Ritual.' },
  { name: 'FailureDetected', signature: 'event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail);', when: 'When the agent detects a failure.', why: 'Self-reported failures are gold for forensics. They convert guesswork into verified findings with a severity the recorder can rank.' },
  { name: 'RecoveryAttempted', signature: 'event RecoveryAttempted(bytes32 indexed correlationId, string strategy, bool success);', when: 'On recovery attempts.', why: 'Shows the agent tried to self-heal and whether it worked — context that separates a transient hiccup from a real outage.' },
  { name: 'WorkflowPaused', signature: 'event WorkflowPaused(bytes32 indexed correlationId, string reason, uint256 timestamp);', when: 'When pausing a workflow.', why: 'Explains intentional stops so the recorder does not misreport a deliberate pause as a failure.' },
  { name: 'WorkflowResumed', signature: 'event WorkflowResumed(bytes32 indexed correlationId, uint256 timestamp);', when: 'When resuming a workflow.', why: 'Pairs with WorkflowPaused to show the agent came back online, closing the pause window in the timeline.' },
];

export const SNIPPETS: CodeSnippet[] = [
  {
    id: 'interface',
    title: 'IBlackBoxLogger.sol',
    language: 'solidity',
    description: 'The canonical event interface. Implement or inherit it so the Black Box decodes your contract with full confidence.',
    steps: [
      'This file only declares events — no logic. It is the shared "vocabulary" the Black Box decodes against.',
      'You normally do NOT import this directly; inherit the BlackBoxLogger mixin (next tab), which already implements it.',
      'Use it standalone only if you want to emit events manually without the helper functions.',
    ],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBlackBoxLogger {
    event AgentBooted(address indexed agent, address indexed owner, bytes32 version, uint256 timestamp);
    event RitualWalletChecked(address indexed agent, uint256 balance, uint256 lockUntilBlock, bool sufficient);
    event AsyncJobRequested(bytes32 indexed correlationId, address indexed precompile, bytes32 indexed jobKind, uint256 ttl, uint256 requestBlock);
    event AsyncJobCompleted(bytes32 indexed correlationId, bool success, uint256 settleBlock);
    event CallbackReceived(bytes32 indexed correlationId, address indexed deliveredBy, uint256 deliveredBlock);
    event CallbackRejected(bytes32 indexed correlationId, address indexed caller, string reason);
    event MemoryUpdated(bytes32 indexed slot, bytes32 previousValue, bytes32 newValue, uint256 timestamp);
    event SchedulerWake(uint256 indexed executionIndex, uint256 wakeBlock);
    event BudgetLow(uint256 balance, uint256 required, uint256 timestamp);
    event FailureDetected(bytes32 indexed correlationId, uint8 severity, string code, string detail);
    event RecoveryAttempted(bytes32 indexed correlationId, string strategy, bool success);
    event WorkflowPaused(bytes32 indexed correlationId, string reason, uint256 timestamp);
    event WorkflowResumed(bytes32 indexed correlationId, uint256 timestamp);
}`,
  },
  {
    id: 'mixin',
    title: 'BlackBoxLogger.sol (mixin)',
    language: 'solidity',
    description: 'Inherit this abstract contract and call the internal _log* helpers. It emits events only — no funds, no privileged powers.',
    steps: [
      'Step 1 — Save this file next to your contract and inherit it: contract MyAgent is BlackBoxLogger { … }.',
      'Step 2 — It is safe by design: it holds no funds and has no owner powers. It can never change your contract\u2019s behavior, only record it.',
      'Step 3 — Call the internal helpers (_logBoot, _logAsyncRequested, _validateAndLogCallback, _logMemory) at the matching points in your lifecycle.',
      'Step 4 — The built-in _pendingCorrelation mapping tracks open requests so callbacks can be validated automatically.',
    ],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBlackBoxLogger} from "./IBlackBoxLogger.sol";

abstract contract BlackBoxLogger is IBlackBoxLogger {
    address internal constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;
    address internal constant RITUAL_WALLET  = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address internal constant SCHEDULER      = 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;

    mapping(bytes32 => bool) internal _pendingCorrelation;

    function _logBoot(address owner, bytes32 version) internal {
        emit AgentBooted(address(this), owner, version, block.timestamp);
    }

    function _logAsyncRequested(bytes32 corrId, address precompile, bytes32 kind, uint256 ttl) internal {
        _pendingCorrelation[corrId] = true;
        emit AsyncJobRequested(corrId, precompile, kind, ttl, block.number);
    }

    function _validateAndLogCallback(bytes32 corrId) internal returns (bool) {
        if (msg.sender != ASYNC_DELIVERY) {
            emit CallbackRejected(corrId, msg.sender, "sender is not AsyncDelivery");
            return false;
        }
        if (!_pendingCorrelation[corrId]) {
            emit CallbackRejected(corrId, msg.sender, "unknown or already-settled correlationId");
            return false;
        }
        _pendingCorrelation[corrId] = false;
        emit CallbackReceived(corrId, msg.sender, block.number);
        return true;
    }

    function _logMemory(bytes32 slot, bytes32 prev, bytes32 next) internal {
        emit MemoryUpdated(slot, prev, next, block.timestamp);
    }
}`,
  },
  {
    id: 'integration',
    title: 'Integrate into an existing contract',
    language: 'solidity',
    description: 'Add structured logging to a contract you already have. Note the correlationId spine and the callback authentication.',
    steps: [
      'Step 1 — Inherit BlackBoxLogger and call _logBoot in your constructor so the recorder knows when the agent started.',
      'Step 2 — Generate a correlationId per async request and emit AsyncJobRequested BEFORE the precompile call (intent is logged even if the call reverts).',
      'Step 3 — In your callback, call _validateAndLogCallback first: it checks msg.sender == AsyncDelivery AND the correlationId, then returns false if invalid.',
      'Step 4 — Only process the result after that check passes. This is what upgrades your analysis from "inferred" to "verified".',
    ],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BlackBoxLogger} from "./BlackBoxLogger.sol";

contract MyAgent is BlackBoxLogger {
    uint256 private _nonce;

    constructor() {
        _logBoot(msg.sender, "MyAgent.v1");
    }

    function doWork() external {
        bytes32 corrId = keccak256(abi.encodePacked(address(this), _nonce++, block.number));

        // 1) Emit intent BEFORE the precompile call.
        _logAsyncRequested(corrId, address(0x0802), "LLM", 200);

        // 2) ...invoke the async precompile here (see ritual-dapp-llm)...
    }

    // 3) Authenticated, idempotent callback.
    function onResult(bytes32 corrId, bytes calldata result) external {
        if (!_validateAndLogCallback(corrId)) return; // rejection already logged
        // safe to process 'result' now
    }
}`,
  },
  {
    id: 'safe-callback',
    title: 'Secure callback pattern',
    language: 'solidity',
    description: 'The callback shape the Black Box recommends: verify sender, check correlationId, stay idempotent, guard against TOCTOU.',
    steps: [
      'Why it matters — on Ritual, callbacks arrive from AsyncDelivery, not the user. msg.sender is NOT who you think.',
      'Rule 1 (auth) — require(msg.sender == ASYNC_DELIVERY). Without this, anyone can call your callback with fake data.',
      'Rule 2 (idempotent) — guard with a fulfilled[corrId] flag so a replayed delivery cannot double-process.',
      'Rule 3 (TOCTOU) — minutes/hours can pass before the callback. Snapshot what you depend on and re-check it, never assume the world is unchanged.',
    ],
    code: `address constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

mapping(bytes32 => bool) public fulfilled;
mapping(bytes32 => uint256) public snapshotAtRequest;

function onResult(bytes32 corrId, uint256 value) external {
    require(msg.sender == ASYNC_DELIVERY, "only async delivery");  // 1. auth
    require(!fulfilled[corrId], "already fulfilled");               // 2. idempotent
    fulfilled[corrId] = true;

    // 3. TOCTOU guard: do not assume the world is unchanged.
    if (snapshotAtRequest[corrId] != currentWorldValue()) {
        emit FailureDetected(corrId, 1, "TOCTOU", "state changed before callback");
    }

    // 4. effects, then interactions (CEI)
    _apply(value);
    emit CallbackReceived(corrId, msg.sender, block.number);
}`,
  },
  {
    id: 'async-correlation',
    title: 'Async workflow with correlationId + timeout',
    language: 'solidity',
    description: 'A full request/callback workflow with an escape hatch so user actions never deadlock on a callback that never arrives.',
    steps: [
      'Why it matters — Ritual callbacks are NOT guaranteed. If the executor fails or the TTL expires, the callback never fires.',
      'Step 1 — Store requestBlock[corrId] when you make the request so you can measure how long it has been pending.',
      'Step 2 — Define a PENDING_TTL window after which a job is considered stuck.',
      'Step 3 — Expose expireIfStuck() so anyone can unblock a dead job. Never gate user actions on async state forever.',
    ],
    code: `uint256 public constant PENDING_TTL = 500;
mapping(bytes32 => uint256) public requestBlock;

function request() external returns (bytes32 corrId) {
    corrId = keccak256(abi.encodePacked(address(this), block.number, msg.sender));
    requestBlock[corrId] = block.number;
    _logAsyncRequested(corrId, address(0x0805), "LONG_HTTP", PENDING_TTL);
    // ...invoke long-running precompile...
}

// Escape hatch: anyone can expire a stuck job after the TTL.
function expireIfStuck(bytes32 corrId) external {
    require(block.number > requestBlock[corrId] + PENDING_TTL, "ttl not reached");
    emit FailureDetected(corrId, 1, "TIMEOUT", "no callback before PENDING_TTL");
    emit WorkflowPaused(corrId, "auto-expired", block.timestamp);
}`,
  },
];
