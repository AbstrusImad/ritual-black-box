```
██████╗ ██╗      █████╗  ██████╗██╗  ██╗    ██████╗  ██████╗ ██╗  ██╗
██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝    ██╔══██╗██╔═══██╗╚██╗██╔╝
██████╔╝██║     ███████║██║     █████╔╝     ██████╔╝██║   ██║ ╚███╔╝
██╔══██╗██║     ██╔══██║██║     ██╔═██╗     ██╔══██╗██║   ██║ ██╔██╗
██████╔╝███████╗██║  ██║╚██████╗██║  ██╗    ██████╔╝╚██████╔╝██╔╝ ██╗
╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
```

# Ritual Black Box

**A forensic flight recorder for Ritual-native agents and async workflows.**

Paste a contract or agent address from Ritual L1. The Black Box reconstructs its
public on-chain story — events, callbacks, scheduler wakes, failures, and risks —
and tells you, honestly, what it *cannot* know.

> Built for Ritual L1 testnet · chain ID **1979** · powered by the
> [Ritual dApp Skills](https://skills.ritualfoundation.org/).

**🔗 Live app:** https://ritual-black-box.pages.dev

---

## What is inside the Black Box?

When an aircraft goes down, investigators don't guess — they pull the flight
recorder and read what actually happened. Ritual Black Box does the same for
contracts and agents on Ritual L1. It reads only public on-chain evidence and
reconstructs a chronological record of behavior. It never invents data the
contract never emitted.

The tool is split into seven instruments:

| Instrument | What it does |
|---|---|
| **Analyze Chamber** | Insert a "signal" (an address). The box opens with a holographic scan and identifies the subject. |
| **Agent Flight Recorder** | A living timeline of every detectable action, with a plain-language *Narrative Mode*. |
| **Failure Autopsy** | Pulls apart broken flows — reverts, missing callbacks, stalled async jobs — with severity + confidence. |
| **Signal Map** | A node graph of everything the contract touched: RitualWallet, Scheduler, AsyncDelivery, precompiles. |
| **Fix Console** | Concrete, copy-ready recommendations — not just "errors." |
| **BlackBox Integration Kit** | `BlackBoxLogger.sol` and friends, so your contract emits a clean flight record. |
| **Evidence Vault** | Save analyses locally, compare two runs, export JSON/Markdown, attach notes. |

---

## Why Ritual agents need flight recorders

Ritual Chain breaks Ethereum's assumptions in ways that make debugging hard:

- **Async work spans many blocks.** A request and its result can be minutes or
  hours apart. A single transaction receipt does *not* tell the whole story.
- **Callbacks come from `AsyncDelivery` (`0x5A16…39F6`), not the user.** If you
  read `msg.sender` in a callback expecting the caller, you're wrong.
- **Fees are paid from RitualWallet, not gas.** An underfunded wallet means a
  commitment that *silently never settles* — no revert, no error, just a stall.
- **There is no automatic retry.** If the TTL expires, the callback never fires.

A contract that doesn't emit clear events becomes a literal black box: even its
author can't tell what it did. This tool reconstructs what it can — and tells you
what it can't.

---

## How the forensic engine works

The engine runs in three modes:

1. **Demo Mode** — hand-authored, realistic scenarios (e.g. *Sigil Agent Alpha*,
   a scheduler-driven agent that runs out of budget mid-flight). No chain needed.
2. **RPC Mode** — reads live public data from Ritual L1: bytecode, balance, logs.
   It decodes `BlackBoxLogger` events with full confidence and degrades honestly
   when it can't.
3. **Enhanced Mode** — you provide an ABI to decode otherwise-unknown events.

Every finding carries a **confidence label**, because honesty is the whole point:

| Label | Meaning |
|---|---|
| `Verified` | Decoded directly from an on-chain log / receipt. |
| `Decoded` | Decoded using a provided ABI. |
| `Inferred` | Pattern-matched, **not proven**. |
| `Uncertain` | Weak signal, may be wrong. |
| `Missing` | We know we **don't** know this — it was never emitted. |

---

## What the app *can* know

- Whether an address holds contract bytecode, and its balance.
- Events the contract emitted (verified), and `BlackBoxLogger` lifecycle events
  decoded into a structured timeline.
- Async requests that have **no observed callback** (a strong stall signal).
- Budget warnings, scheduler wakes, memory updates, and explicit failures.
- A risk score — always annotated with whether it rests on *strong*, *partial*,
  or *insufficient* evidence.

## What the app *cannot* know

- Private internal logic that was never emitted on-chain.
- The contents of an async result that was never logged.
- Why something failed, when the contract emitted no failure event (it will say
  *inferred* and stop there).
- Anything about a contract that emits no events — it will tell you so, and point
  you at the Integration Kit instead of fabricating a story.

---

## BlackBoxLogger integration

`BlackBoxLogger` is **optional**. The recorder analyzes any public contract. But
contracts that emit its events get *verified* reconstructions instead of guesses.

```solidity
import {BlackBoxLogger} from "./BlackBoxLogger.sol";

contract MyAgent is BlackBoxLogger {
    constructor() { _logBoot(msg.sender, "MyAgent.v1"); }

    function doWork() external {
        bytes32 corrId = keccak256(abi.encodePacked(address(this), block.number));
        _logAsyncRequested(corrId, address(0x0802), "LLM", 200); // emit intent FIRST
        // ...invoke the async precompile...
    }

    function onResult(bytes32 corrId, bytes calldata result) external {
        if (!_validateAndLogCallback(corrId)) return; // verifies AsyncDelivery + correlationId
        // safe to process result
    }
}
```

The `correlationId` is the spine of the design: it links a request to its later
callback, so deliveries can't be spoofed and the recorder can *prove* the round
trip instead of inferring it.

Full sources live in [`contracts/src`](./contracts/src):
`IBlackBoxLogger.sol`, `BlackBoxLogger.sol`, `BlackBoxRegistry.sol`,
`ExampleRitualAgent.sol`, `ExampleCallbackWorkflow.sol`.

---

## Ritual concepts used

| Concept | Where it shows up |
|---|---|
| **RitualWallet** (`0x532F…3948`) | Core energy node; budget checks & `BudgetLow` signals. |
| **Scheduler** (`0x56e7…D58B`) | "Cosmic clock" wakes that drive recurring agent cycles. |
| **AsyncDelivery** (`0x5A16…39F6`) | Callback router; the recorder verifies callbacks against it. |
| **AsyncJobTracker** (`0xC069…AEF5`) | Source of `JobAdded` / `Phase1Settled` / `ResultDelivered`. |
| **Precompiles** (`0x0801` HTTP, `0x0802` LLM, `0x080C`/`0x0820` agents, …) | Async request targets in the timeline & map. |
| **9-state async lifecycle** | Drives status visuals and stall detection. |
| **TOCTOU across the async boundary** | Flagged as a risk; the example contracts guard against it. |

---

## Demo mode

No funded wallet? Open the **Analyze Chamber** and pick a demo subject:

- **Sigil Agent Alpha** — boots, funds, runs one clean cycle, then runs out of
  budget and stalls on its second async request.
- **Healthy workflow** — a clean request/callback round trip.
- **Silent contract** — a contract too quiet to analyze (shows the honesty path).

---

## Running it

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build
```

Optional: copy `.env.example` to `.env` to override the RPC endpoint.

### Contracts

```bash
cd contracts
forge install foundry-rs/forge-std --no-git   # if lib/ is missing
forge build
forge test -vv                                 # 9 tests, callback security + TOCTOU + escape hatch
```

Deploy to Ritual L1 (testnet):

```bash
cp .env.example .env   # add a TESTNET PRIVATE_KEY
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RITUAL_RPC_URL --broadcast -vvvv
```

---

## Future real Ritual integrations

- Swap the demo/RPC reader for a finalized indexer (AsyncJobTracker event stream)
  for full request↔settlement reconciliation.
- Live executor availability checks via `TEEServiceRegistry`.
- On-chain `BlackBoxRegistry` discovery so the tool can list instrumented agents.
- Replace the precompile-call stubs in the example contracts with real
  `0x0802` / `0x080C` invocations once executors are funded on your target net.

---

## Safety & testnet notes

- Everything targets **Ritual L1 testnet (1979)**. RITUAL has no real value.
- The contracts hold no funds and have no privileged powers beyond emitting events.
- The app makes **no outbound calls** except read-only JSON-RPC to Ritual.
- Analyses are stored **locally** (localStorage) — nothing leaves your machine.
- The recorder reports only public on-chain evidence. Findings marked *inferred*
  or *uncertain* are not proven. It will not pretend to know more than it does.

---

_Ritual Black Box is a diagnostic tool, not an oracle. It reads the box. It
doesn't make one up._
