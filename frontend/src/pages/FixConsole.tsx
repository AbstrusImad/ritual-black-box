import { motion } from 'framer-motion';
import { SectionTitle, Panel, CopyButton, EmptyState } from '@/components/ui/primitives';
import { NoAnalysis } from '@/components/NoAnalysis';
import { useStore } from '@/store/useStore';
import type { Recommendation, Difficulty, Impact } from '@/types';

const diffColor: Record<Difficulty, string> = {
  trivial: 'text-ritual-green',
  easy: 'text-ritual-lime',
  moderate: 'text-ritual-gold',
  involved: 'text-orange-400',
};
const impactColor: Record<Impact, string> = {
  low: 'text-gray-400',
  medium: 'text-ritual-gold',
  high: 'text-ritual-green',
};

export function FixConsole() {
  const current = useStore((s) => s.current);
  if (!current) return <NoAnalysis area="The Fix Console" />;

  const recs = current.recommendations;

  return (
    <div>
      <SectionTitle
        eyebrow="Fix Console"
        title="What to do next"
        sub="Not just errors — concrete actions. Each recommendation explains why it matters, the risk of ignoring it, the effort involved, and a copy-ready Solidity pattern when one applies."
      />

      {recs.length === 0 ? (
        <EmptyState icon="⚙" title="No recommendations" body="No actionable improvements were derived from the current analysis." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recs.map((r, i) => (
            <RecCard key={r.id} r={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecCard({ r, index }: { r: Recommendation; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Panel className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base text-gray-100">{r.title}</h3>
          <span className="shrink-0 rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase text-gray-500">{r.category}</span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          <span className="text-gray-500">Why: </span>
          {r.why}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ritual-gold/80">
          <span className="text-gray-500">Risk if ignored: </span>
          {r.risk}
        </p>

        <div className="mt-3 flex gap-4 text-xs">
          <span>
            <span className="text-gray-600">difficulty </span>
            <span className={diffColor[r.difficulty]}>{r.difficulty}</span>
          </span>
          <span>
            <span className="text-gray-600">impact </span>
            <span className={impactColor[r.impact]}>{r.impact}</span>
          </span>
        </div>

        {r.eventExample && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Suggested event</span>
              <CopyButton text={r.eventExample} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-black/60 p-2.5 font-mono text-[11px] text-ritual-green/90">
              {r.eventExample}
            </pre>
          </div>
        )}

        {r.codeExample && (
          <div className="mt-auto pt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Pattern</span>
              <CopyButton text={r.codeExample} />
            </div>
            <pre className="max-h-60 overflow-auto rounded-lg border border-gray-800 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-gray-300">
              {r.codeExample}
            </pre>
          </div>
        )}
      </Panel>
    </motion.div>
  );
}
