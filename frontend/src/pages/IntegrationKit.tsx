import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle, Panel, CopyButton } from '@/components/ui/primitives';
import { SNIPPETS, RECOMMENDED_EVENTS } from '@/lib/integrationKit';

export function IntegrationKit() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const snippet = SNIPPETS.find((s) => s.id === active)!;

  return (
    <div>
      <SectionTitle
        eyebrow="BlackBox Integration Kit"
        title="Make your contract analyzable"
        sub="BlackBoxLogger is optional. The recorder analyzes any public contract — but contracts that emit these structured events get verified reconstructions instead of guesses. Copy what you need."
      />

      <Panel className="mb-6 p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl text-ritual-green">◇</span>
          <div>
            <h3 className="font-display text-base text-gray-100">Why emit events?</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              On Ritual, async work spans many blocks and callbacks arrive from AsyncDelivery, not the user. Without
              structured events, even you can't tell what your agent did. BlackBoxLogger gives the recorder a
              stable vocabulary keyed by a <span className="text-ritual-pink">correlationId</span> that links each
              request to its eventual callback.
            </p>
          </div>
        </div>
      </Panel>

      {/* AI Skill banner — links to the dedicated skill page */}
      <Link to="/app/skill" className="mb-6 block">
        <div className="group flex items-center justify-between gap-4 rounded-xl border border-ritual-green/30 bg-gradient-to-r from-ritual-green/10 to-transparent p-5 transition-all hover:border-ritual-green/60 hover:shadow-glow-green">
          <div className="flex items-center gap-4">
            <span className="text-2xl text-ritual-green">✦</span>
            <div>
              <div className="font-display text-base text-gray-100">Don't want to copy code by hand?</div>
              <p className="mt-0.5 text-sm text-gray-400">
                Give the AI Integration Skill to Claude, Cursor, Codex or Gemini and let it emit the events for you.
              </p>
            </div>
          </div>
          <span className="shrink-0 font-medium text-ritual-green transition-transform group-hover:translate-x-1">
            Open AI Skill →
          </span>
        </div>
      </Link>

      {/* Quick start: 4 plain steps */}
      <Panel className="mb-6 p-5">
        <h3 className="mb-4 font-display text-base text-gray-100">Quick start — 4 steps</h3>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: '1', t: 'Inherit the mixin', d: 'contract MyAgent is BlackBoxLogger { … } and call _logBoot in the constructor.' },
            { n: '2', t: 'Log intent first', d: 'Emit AsyncJobRequested with a fresh correlationId BEFORE every async precompile call.' },
            { n: '3', t: 'Guard the callback', d: 'Call _validateAndLogCallback first — it checks AsyncDelivery + the correlationId.' },
            { n: '4', t: 'Re-analyze', d: 'Paste your address in RPC Mode. Events now decode as "verified".' },
          ].map((s) => (
            <li key={s.n} className="rounded-lg border border-gray-800 bg-black/30 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-ritual-green/50 font-mono text-xs text-ritual-green">
                {s.n}
              </div>
              <div className="mt-2 text-sm font-medium text-gray-200">{s.t}</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* snippet selector */}
        <div className="space-y-1.5">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                active === s.id
                  ? 'border-ritual-green/50 bg-ritual-green/10 text-ritual-green'
                  : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <div className="font-mono text-[13px]">{s.title}</div>
            </button>
          ))}
        </div>

        {/* code viewer */}
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <div className="font-mono text-sm text-gray-200">{snippet.title}</div>
              <div className="text-xs text-gray-500">{snippet.description}</div>
            </div>
            <CopyButton text={snippet.code} label="Copy code" />
          </div>

          {snippet.steps && (
            <div className="border-b border-gray-800 bg-black/30 px-4 py-3">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-ritual-green/70">How to use it</div>
              <ul className="space-y-1.5">
                {snippet.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-400">
                    <span className="mt-0.5 text-ritual-green">›</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <pre className="max-h-[520px] overflow-auto p-4 font-mono text-[12px] leading-relaxed text-gray-300">
            <code>{snippet.code}</code>
          </pre>
        </Panel>
      </div>

      {/* recommended events table */}
      <div className="mt-8">
        <h3 className="mb-3 font-display text-lg text-gray-200">Recommended events</h3>
        <Panel className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Emit when</th>
                <th className="px-4 py-3">Why it matters</th>
                <th className="px-4 py-3 text-right">Copy</th>
              </tr>
            </thead>
            <tbody>
              {RECOMMENDED_EVENTS.map((e) => (
                <tr key={e.name} className="border-b border-gray-900/60 align-top last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-[13px] text-ritual-green">{e.name}</td>
                  <td className="px-4 py-3 text-gray-400">{e.when}</td>
                  <td className="px-4 py-3 text-xs leading-relaxed text-gray-500">{e.why}</td>
                  <td className="px-4 py-3 text-right">
                    <CopyButton text={e.signature} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <p className="mt-3 text-xs italic text-gray-600">
          Full Solidity sources live in the project's <span className="font-mono">/contracts/src</span> folder:
          BlackBoxLogger.sol, IBlackBoxLogger.sol, BlackBoxRegistry.sol, and two runnable examples.
        </p>
      </div>
    </div>
  );
}
