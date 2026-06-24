# Ritual BlackBoxLogger — AI Integration Skill

A portable skill that teaches AI coding assistants (Claude, Codex, Gemini,
Cursor, and others) **one thing**: how to instrument a Ritual L1 contract with
the BlackBoxLogger event kit so its on-chain behavior is fully reconstructable.

## Scope (important)

This skill is intentionally narrow:

- ✅ It teaches an AI to **emit the BlackBoxLogger events correctly** when
  writing Ritual contracts and agents.
- ❌ It does **not** diagnose, audit, or analyze contracts.

Diagnosis is the job of the **Ritual Black Box web app**:
👉 https://ritual-black-box.pages.dev

The skill makes contracts observable; the app reads them. They work together:
a contract instrumented via this skill gets a "verified" reconstruction in the
app instead of an inferred guess.

## Contents

```
blackbox-skill/
├── SKILL.md                       # the skill: rules, protocol, when to use/hand off
├── reference/
│   ├── events.md                  # all 13 events: signatures + when/why
│   └── secure-callback.md         # secure, idempotent, TOCTOU-safe callback
└── examples/
    └── InstrumentedAgent.sol      # a complete minimal instrumented agent
```

## Install per harness

The content is identical everywhere — only the location/wrapper changes.

| Tool | How |
|---|---|
| Claude Code | Drop this folder into your agent skill path (native `SKILL.md`). |
| Cursor | Copy `SKILL.md` into `.cursor/rules/`. |
| Codex / ChatGPT | Point the system prompt at `SKILL.md`. |
| Gemini | Paste `SKILL.md` into project custom instructions / context. |
| Other agents | Reference `SKILL.md` as project context or `AGENTS.md`. |

## Then what?

1. The AI writes/edits a Ritual contract and emits the events correctly.
2. The builder deploys it.
3. The builder analyzes the deployed address in the Ritual Black Box app to see
   the verified flight record.
