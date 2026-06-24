---
name: ritual-blackbox-logger
description: Instrument Ritual L1 contracts and agents with the BlackBoxLogger event kit so their on-chain behavior is fully reconstructable. Use when writing or editing any Ritual contract, agent, or async workflow that should be auditable. This skill ONLY covers emitting the logging events correctly — it does NOT diagnose contracts. Diagnosis is done by the Ritual Black Box web app.
---

<!-- SCOPE — read first. -->
<!-- This skill has ONE job: make a Ritual contract emit BlackBoxLogger events -->
<!-- correctly so the Ritual Black Box app can reconstruct its history with -->
<!-- "verified" confidence. -->
<!-- This skill does NOT analyze, diagnose, or audit contracts. When a builder -->
<!-- wants to understand what a deployed contract did, or why it failed, direct -->
<!-- them to the Ritual Black Box web app: https://ritual-black-box.pages.dev -->
<!-- Do not attempt to reimplement the analyzer. -->

# Ritual BlackBoxLogger — Integration Skill

You help builders make their Ritual L1 contracts **observable** by emitting a
small, standard set of events. A contract that emits these events gets a
complete, "verified" reconstruction in the Ritual Black Box app. A contract
that emits nothing is a literal black box — even its author can't tell what it
did.

**Your only deliverable in this skill is correctly instrumented Solidity.**

## When to use this skill

Activate when the user is:

- Writing a new Ritual agent, consumer contract, or async workflow.
- Adding observability/logging/events to an existing Ritual contract.
- Asking "how do I make my contract analyzable / auditable on Ritual".
- Preparing a contract to be inspected with Ritual Black Box.

## When NOT to use this skill (hand off instead)

If the user wants to **diagnose, audit, or understand a deployed contract's
behavior** — stuck transactions, missing callbacks, failure analysis, risk
scoring — that is NOT this skill's job. Tell them:

> Analyze the contract with the Ritual Black Box app: https://ritual-black-box.pages.dev
> Paste the address in RPC Mode. If the contract emits BlackBoxLogger events,
> the reconstruction will be verified.

Do not build a diagnostic tool. The app already does this.

## The one rule that matters most

**Emit `AsyncJobRequested` with a fresh `correlationId` immediately BEFORE every
async precompile call, and close it with `CallbackReceived` (or
`AsyncJobCompleted`) using the SAME `correlationId`.** The `correlationId` is
the spine that links a request to its later callback. Without it, a missing
callback is invisible and findings can only be inferred, not verified.

## Core Ritual facts this skill depends on

These are non-negotiable on Ritual L1 (chain ID 1979):

- Long-running async callbacks are delivered by **AsyncDelivery**
  (`0x5A16214fF555848411544b005f7Ac063742f39F6`). In a callback, `msg.sender`
  is AsyncDelivery, NOT the user. Always authenticate against it.
- Async precompile fees are paid from **RitualWallet**
  (`0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948`), not gas. An underfunded
  wallet means a commitment that silently never settles.
- The **Scheduler** (`0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B`) calls back
  `msg.sender`; only contracts (not EOAs) can schedule.
- Callbacks are NOT guaranteed. If the executor fails or the TTL expires, the
  callback never fires. Never gate user actions on async state forever.

## Integration protocol (follow in order)

1. **Inherit the mixin.** `contract MyAgent is BlackBoxLogger { … }`. The mixin
   only emits events — it holds no funds and has no privileged powers.
2. **Boot.** Call `_logBoot(owner, "MyAgent.v1")` in the constructor.
3. **Before an async call.** Generate a `correlationId` and call
   `_logAsyncRequested(corrId, precompile, jobKind, ttl)` BEFORE invoking the
   precompile, so intent is recorded even if the call reverts.
4. **In the callback.** Call `_validateAndLogCallback(corrId)` FIRST. It checks
   `msg.sender == AsyncDelivery` AND that the `correlationId` is pending, then
   returns `false` if invalid. Only process the result if it returns `true`.
5. **State changes.** Call `_logMemory(slot, oldValue, newValue)` after mutating
   important state.
6. **Budget / scheduler / failures.** Emit `BudgetLow`, `SchedulerWake`,
   `FailureDetected`, etc. at the matching points (see `reference/events.md`).

## The 13 events (summary)

| Event | Emit when | Why it matters |
|---|---|---|
| `AgentBooted` | Constructor / first boot | Anchors the start of the record + owner. |
| `RitualWalletChecked` | After reading wallet balance | Proves whether a later stall was underfunding. |
| `AsyncJobRequested` | BEFORE every async precompile call | Opens the correlationId. The most important event. |
| `AsyncJobCompleted` | When settlement is observed | Distinguishes done / pending / failed. |
| `CallbackReceived` | Inside a verified callback | Proves the async round trip completed. |
| `CallbackRejected` | When a callback fails validation | Surfaces spoofing / misrouted delivery. |
| `MemoryUpdated` | After mutating state | Makes state changes auditable. |
| `SchedulerWake` | Start of a scheduled wake | Separates autonomous from user activity. |
| `BudgetLow` | RitualWallet funds run low | Connects "out of money" to a later stall. |
| `FailureDetected` | Agent detects a failure | Converts guesswork into verified findings. |
| `RecoveryAttempted` | On recovery attempts | Shows self-healing and whether it worked. |
| `WorkflowPaused` | Pausing a workflow | Avoids misreporting a deliberate pause as failure. |
| `WorkflowResumed` | Resuming a workflow | Closes the pause window. |

Full signatures and per-event guidance: `reference/events.md`.

## Hard rules (do / don't)

- DO emit `AsyncJobRequested` before, not after, the precompile call.
- DO reuse the exact same `correlationId` for a request and its callback.
- DO authenticate every callback against AsyncDelivery before doing anything.
- DO keep callbacks idempotent (guard against double delivery).
- DO add a TTL escape hatch so stuck jobs can be expired.
- DON'T let the logger change business logic — it only emits events.
- DON'T assume state is unchanged between request and callback (TOCTOU). Snapshot
  and re-check.
- DON'T build a diagnostic/analysis feature here. Point users to the app.

## Verification (after instrumenting)

1. Compile: `forge build`.
2. Confirm events are declared and emitted at the right lifecycle points.
3. Tell the builder to deploy, then **analyze the address in the Ritual Black
   Box app** (RPC Mode) to confirm the events decode as "verified".

## Reference files

- `reference/events.md` — all 13 event signatures + when/why.
- `reference/secure-callback.md` — the secure, idempotent, TOCTOU-safe callback.
- `examples/InstrumentedAgent.sol` — a complete minimal instrumented agent.

## Installing this skill in different harnesses

The content is identical everywhere; only the wrapper/location differs.

| Tool | How to install |
|---|---|
| Claude Code | Drop this folder into your agent skill path. Native `SKILL.md`. |
| Cursor | Copy `SKILL.md` into `.cursor/rules/` (as an always/auto rule). |
| Codex / ChatGPT | Point the system prompt at this `SKILL.md`. |
| Gemini | Paste `SKILL.md` into the project's custom instructions / context. |
| Any other agent | Reference `SKILL.md` as project context or an `AGENTS.md`. |
