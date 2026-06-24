import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionTitle, Panel, CopyButton } from '@/components/ui/primitives';
import {
  HARNESS_INSTALLS,
  SKILL_GITHUB_URL,
  SKILL_REPO_URL,
  SKILL_ACTIVATION_LINE,
  SKILL_EVENTS_TABLE,
} from '@/lib/skillContent';

export function SkillPage() {
  const [harness, setHarness] = useState(HARNESS_INSTALLS[0].id);
  const active = HARNESS_INSTALLS.find((h) => h.id === harness)!;

  return (
    <div>
      <SectionTitle
        eyebrow="AI Integration Skill"
        title="Install the skill in your AI"
        sub="Don't copy code by hand. Install the BlackBox skill into your AI agent (Claude, Cursor, Codex, Gemini…) and it will instrument your Ritual contract with the logging kit for you. The skill teaches integration only — diagnosis stays here, in the Black Box app."
      />

      {/* honesty band */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="text-ritual-green">◇ What the skill does</div>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Teaches your AI to emit the 13 BlackBoxLogger events correctly, so your contract earns a
            <span className="text-ritual-green"> verified</span> reconstruction here — not a guess.
          </p>
        </Panel>
        <Panel className="p-5">
          <div className="text-gray-300">⊘ What it does not do</div>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            It does not diagnose or audit. To understand what a deployed contract did, analyze its address here in the
            Black Box app.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Harness selector */}
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">1 · Pick your agent</div>
          <div className="space-y-1.5">
            {HARNESS_INSTALLS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHarness(h.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  harness === h.id
                    ? 'border-ritual-green/50 bg-ritual-green/10 text-ritual-green'
                    : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          <a
            href={SKILL_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-lg border border-gray-800 px-3 py-2.5 text-center text-sm text-gray-300 transition-colors hover:border-ritual-green/40 hover:text-ritual-green"
          >
            View skill on GitHub ↗
          </a>
        </div>

        {/* Install commands */}
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">
              2 · Run the install commands for {active.name}
            </div>
            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                <span className="font-mono text-sm text-gray-200">{active.name} · install</span>
                <CopyButton text={active.command} label="Copy commands" />
              </div>
              <pre className="overflow-auto p-4 font-mono text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">
                {active.command}
              </pre>
            </Panel>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">{active.note}</p>
          </div>

          {/* Activation line */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">3 · Tell your agent</div>
            <Panel className="flex items-center justify-between gap-3 p-4">
              <code className="font-mono text-xs leading-relaxed text-ritual-green">"{SKILL_ACTIVATION_LINE}"</code>
              <CopyButton text={SKILL_ACTIVATION_LINE} label="Copy" />
            </Panel>
          </div>

          {/* Verify */}
          <Panel className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-gray-500">4 · Verify</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              After your AI instruments and you deploy, paste the contract address in{' '}
              <span className="text-ritual-green">RPC Mode</span> on the Analyze Chamber. If the events were emitted
              correctly, they decode as <span className="text-ritual-green">verified</span>.
            </p>
          </Panel>
        </div>
      </div>

      {/* Events quick table */}
      <div className="mt-8">
        <h3 className="mb-3 font-display text-lg text-gray-200">The 13 events your AI will emit</h3>
        <Panel className="overflow-hidden">
          <div className="grid gap-px bg-gray-900/60 sm:grid-cols-2 lg:grid-cols-3">
            {SKILL_EVENTS_TABLE.map((e, i) => (
              <motion.div
                key={e.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="bg-ritual-elevated/60 px-4 py-3"
              >
                <div className="font-mono text-[13px] text-ritual-green">{e.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">{e.when}</div>
              </motion.div>
            ))}
          </div>
        </Panel>
        <p className="mt-3 text-xs text-gray-500">
          Full skill source: <a href={SKILL_REPO_URL} target="_blank" rel="noreferrer" className="text-ritual-green hover:underline">{SKILL_REPO_URL}</a>
        </p>
      </div>
    </div>
  );
}
