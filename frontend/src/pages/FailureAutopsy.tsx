import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SectionTitle, Panel, SeverityChip, ConfidenceChip, EmptyState } from '@/components/ui/primitives';
import { NoAnalysis } from '@/components/NoAnalysis';
import { useStore } from '@/store/useStore';
import type { FailureFinding } from '@/types';

export function FailureAutopsy() {
  const current = useStore((s) => s.current);
  const [open, setOpen] = useState<string | null>(null);

  if (!current) return <NoAnalysis area="The Failure Autopsy" />;

  const findings = current.failures;

  return (
    <div>
      <SectionTitle
        eyebrow="Failure Autopsy"
        title="Open the wreck"
        sub="The recorder pulls apart the broken pieces of the flow. Each finding carries a severity, a confidence label, the on-chain evidence behind it, and a likely cause. Inference is always marked as inference."
      />

      {findings.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No failures detected"
          body="The recorder found no failed transactions, missing callbacks, or broken async flows in the scanned window. Absence of evidence is not proof of correctness — only what could be observed is reported."
        />
      ) : (
        <div className="space-y-4">
          {findings.map((f, i) => (
            <FailureCard key={f.id} f={f} index={i} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
          ))}
        </div>
      )}

      {current.missingEvidence.length > 0 && (
        <Panel className="mt-8 p-6">
          <div className="mb-3 flex items-center gap-2 text-gray-400">
            <span>⊘</span>
            <span className="text-sm font-medium uppercase tracking-wider">What the box cannot know</span>
          </div>
          <div className="space-y-3">
            {current.missingEvidence.map((m, i) => (
              <div key={i} className="rounded-lg border border-gray-800 bg-black/30 p-3">
                <div className="text-sm text-gray-300">{m.what}</div>
                <p className="mt-1 text-xs text-gray-500">{m.whyItMatters}</p>
                {m.howToFix && <p className="mt-1 text-xs text-ritual-green/70">→ {m.howToFix}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function FailureCard({
  f,
  index,
  open,
  onToggle,
}: {
  f: FailureFinding;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const glow = f.severity === 'critical' || f.severity === 'high' ? 'red' : undefined;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <Panel className="overflow-hidden" glow={glow}>
        <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 p-5 text-left">
          <div className="flex items-center gap-3">
            {/* crack/glitch marker */}
            <span className={`text-xl ${f.severity === 'low' ? 'text-gray-500' : 'text-ritual-red animate-flicker'}`}>
              {open ? '◉' : '⚠'}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-100">{f.title}</span>
                <SeverityChip severity={f.severity} />
                <ConfidenceChip level={f.confidence} />
              </div>
              <p className="mt-1 text-sm text-gray-400">{f.explanation}</p>
            </div>
          </div>
          <span className="shrink-0 text-gray-600">{open ? '−' : '+'}</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-800"
            >
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[11px] uppercase tracking-wider text-gray-500">On-chain evidence</div>
                  <ul className="space-y-1">
                    {f.evidence.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-xs text-gray-400">
                        <span className="text-ritual-green">›</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] uppercase tracking-wider text-gray-500">Possible cause</div>
                  <p className="text-sm text-gray-300">{f.possibleCause}</p>
                  {f.correlationId && (
                    <p className="mt-2 font-mono text-[11px] text-ritual-pink/70">correlationId: {f.correlationId}</p>
                  )}
                  {f.recommendationId && (
                    <Link to="/app/fix" className="mt-3 inline-block text-xs text-ritual-green hover:underline">
                      See recommendation in Fix Console →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>
    </motion.div>
  );
}
