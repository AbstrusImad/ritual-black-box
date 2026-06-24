// ============================================================================
// Content for the /app/skill page — the AI Integration Skill.
// Model: installation COMMANDS the builder gives their AI agent (like the
// Ritual skills quick-start), NOT copy-pasting a prompt by hand.
// The skill teaches integration only. Diagnosis stays in this app.
// ============================================================================

export const SKILL_REPO_URL = 'https://github.com/AbstrusImad/ritual-black-box';
export const SKILL_GITHUB_URL =
  'https://github.com/AbstrusImad/ritual-black-box/tree/main/blackbox-skill';

/** The one line the user tells their agent after installing. */
export const SKILL_ACTIVATION_LINE =
  'Read the file blackbox-skill/SKILL.md and follow its instructions to instrument my contract with BlackBoxLogger.';

export interface HarnessInstall {
  id: string;
  name: string;
  /** Shell commands to place the skill where the agent can read it. */
  command: string;
  /** What to tell the agent after install. */
  note: string;
}

export const HARNESS_INSTALLS: HarnessInstall[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: `# Clone into your Claude skills path
git clone https://github.com/AbstrusImad/ritual-black-box.git
cp -r ritual-black-box/blackbox-skill ~/.claude/skills/ritual-blackbox

# Then tell Claude:
# "Read blackbox-skill/SKILL.md and follow it to instrument my contract."`,
    note: 'Claude Code reads the native SKILL.md format automatically once it is in the skills path.',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    command: `# From your project root
git clone https://github.com/AbstrusImad/ritual-black-box.git .tmp-bbx
mkdir -p .cursor/rules
cp .tmp-bbx/blackbox-skill/SKILL.md .cursor/rules/ritual-blackbox.md
rm -rf .tmp-bbx

# Cursor loads .cursor/rules/* automatically as agent rules.`,
    note: 'Set the rule to "Always" or "Auto" in Cursor so the agent applies it when writing Ritual contracts.',
  },
  {
    id: 'codex',
    name: 'Codex / ChatGPT',
    command: `# Add the skill to your repo so Codex sees it as context
git clone https://github.com/AbstrusImad/ritual-black-box.git
cp ritual-black-box/blackbox-skill/SKILL.md ./AGENTS.md

# Codex reads AGENTS.md / system context at the repo root.`,
    note: 'Or point the Codex system prompt directly at blackbox-skill/SKILL.md.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    command: `# Clone and reference the skill in your Gemini project context
git clone https://github.com/AbstrusImad/ritual-black-box.git
cp ritual-black-box/blackbox-skill/SKILL.md ./GEMINI.md

# Add GEMINI.md to the project's custom instructions / context.`,
    note: 'Gemini uses the file as project context; keep it in the repo root for discovery.',
  },
  {
    id: 'other',
    name: 'Other agents',
    command: `git clone https://github.com/AbstrusImad/ritual-black-box.git

# Reference this file as project context or an AGENTS.md:
#   ritual-black-box/blackbox-skill/SKILL.md`,
    note: 'Any agent that can read a markdown context/instructions file can use the skill.',
  },
];

export const SKILL_EVENTS_TABLE = [
  { name: 'AgentBooted', when: 'Constructor / first boot' },
  { name: 'RitualWalletChecked', when: 'After reading wallet balance' },
  { name: 'AsyncJobRequested', when: 'BEFORE every async precompile call' },
  { name: 'AsyncJobCompleted', when: 'When settlement is observed' },
  { name: 'CallbackReceived', when: 'Inside a verified callback' },
  { name: 'CallbackRejected', when: 'When a callback fails validation' },
  { name: 'MemoryUpdated', when: 'After mutating state' },
  { name: 'SchedulerWake', when: 'Start of a scheduled wake' },
  { name: 'BudgetLow', when: 'RitualWallet funds run low' },
  { name: 'FailureDetected', when: 'Agent detects a failure' },
  { name: 'RecoveryAttempted', when: 'On recovery attempts' },
  { name: 'WorkflowPaused', when: 'Pausing a workflow' },
  { name: 'WorkflowResumed', when: 'Resuming a workflow' },
];
