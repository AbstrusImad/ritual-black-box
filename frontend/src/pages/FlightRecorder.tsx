import { memo, useEffect, useMemo, useState } from 'react';
import {
  SectionTitle,
  Panel,
  ConfidenceChip,
  Button,
  statusColor,
  statusDot,
  statusIcon,
  CopyButton,
} from '@/components/ui/primitives';
import { InspectorPanel } from '@/components/InspectorPanel';
import { NoAnalysis } from '@/components/NoAnalysis';
import { useStore } from '@/store/useStore';
import { explorerTx, shortAddr } from '@/lib/ritual';
import type { TimelineEvent, EventCategory } from '@/types';

const FILTERS: { key: EventCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All signals' },
  { key: 'deploy', label: 'Deploy' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'scheduler', label: 'Scheduler' },
  { key: 'async', label: 'Async' },
  { key: 'callback', label: 'Callback' },
  { key: 'memory', label: 'Memory' },
  { key: 'failure', label: 'Failure' },
  { key: 'unknown', label: 'Unknown' },
];

const PAGE_SIZE = 60;

export function FlightRecorder() {
  const current = useStore((s) => s.current);
  const toggleStar = useStore((s) => s.toggleStar);
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [narrative, setNarrative] = useState(false);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!current) return [];
    const q = search.trim().toLowerCase();
    return current.timeline.filter((e) => {
      if (filter !== 'all' && e.category !== filter) return false;
      if (q) {
        return (
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.txHash.toLowerCase().includes(q) ||
          (e.correlationId ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [current, filter, search]);

  // Reset the paging window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, search, current?.id]);

  const starredIds = current?.starredEventIds;
  const starred = useMemo(() => new Set(starredIds ?? []), [starredIds]);

  if (!current) return <NoAnalysis area="The Flight Recorder" />;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div>
      <SectionTitle
        eyebrow="Agent Flight Recorder"
        title="Reconstructed history"
        sub="Every detectable on-chain action, in order, like an aircraft's flight recorder. Toggle Narrative Mode for a plain-language readout."
      />

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timeline (title, tx, correlationId)…"
          className="min-w-[220px] flex-1 rounded-lg border border-gray-700 bg-ritual-surface/60 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-ritual-green/50 focus:outline-none"
        />
        <button
          onClick={() => setNarrative((n) => !n)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            narrative ? 'border-ritual-pink/50 bg-ritual-pink/10 text-ritual-pink' : 'border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          ◇ Narrative Mode
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count =
            f.key === 'all' ? current.timeline.length : current.timeline.filter((e) => e.category === f.key).length;
          if (f.key !== 'all' && count === 0) return null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === f.key
                  ? 'border-ritual-green/50 bg-ritual-green/10 text-ritual-green'
                  : 'border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label} <span className="text-gray-600">{count}</span>
            </button>
          );
        })}
      </div>

      {/* result count */}
      {!narrative && (
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing <span className="text-gray-300">{visible.length}</span> of{' '}
            <span className="text-gray-300">{filtered.length.toLocaleString()}</span> events
          </span>
          {filtered.length > 500 && (
            <span className="text-ritual-gold/80">High-volume contract — paginated for performance.</span>
          )}
        </div>
      )}

      {narrative ? (
        <Panel className="p-6" glow="pink">
          <div className="mb-3 flex items-center gap-2 text-ritual-pink">
            <span>◇</span>
            <span className="text-sm font-medium uppercase tracking-wider">Narrative reconstruction</span>
          </div>
          <p className="text-base leading-relaxed text-gray-300">{current.narrative}</p>
          <p className="mt-4 border-t border-gray-800 pt-4 text-xs italic text-gray-500">
            This narrative is built only from on-chain evidence. Statements about unobserved internal logic are
            explicitly avoided. Findings labeled "inferred" are not proven.
          </p>
        </Panel>
      ) : (
        <div className="relative">
          {/* spine */}
          <div className="absolute bottom-0 left-[19px] top-2 w-px bg-gradient-to-b from-ritual-green/40 via-gray-800 to-transparent" />
          <div className="space-y-3">
            {visible.map((e) => (
              <TimelineRow
                key={e.id}
                event={e}
                starred={starred.has(e.id)}
                onSelect={setSelected}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-600">No events match this filter.</p>
            )}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Inspector */}
      <InspectorPanel open={!!selected} title={selected?.title ?? ''} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={statusColor[selected.status]}>{statusIcon[selected.status]}</span>
              <span className={`text-sm ${statusColor[selected.status]}`}>{selected.status.toUpperCase()}</span>
              <ConfidenceChip level={selected.confidence} />
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{selected.detail ?? selected.summary}</p>

            <div className="space-y-2 rounded-lg border border-gray-800 bg-black/40 p-3">
              <Row label="Block" value={selected.blockNumber.toLocaleString()} />
              <Row label="Category" value={selected.category} />
              {selected.correlationId && <Row label="correlationId" value={selected.correlationId} />}
              {selected.relatedAddress && <Row label="Related" value={shortAddr(selected.relatedAddress)} />}
              {selected.txHash !== '—' && selected.txHash !== '0x' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">Tx</span>
                  <a
                    href={explorerTx(selected.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-ritual-green hover:underline"
                  >
                    {shortAddr(selected.txHash)} ↗
                  </a>
                </div>
              )}
            </div>

            {selected.data && Object.keys(selected.data).length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">Decoded fields</span>
                  <CopyButton text={JSON.stringify(selected.data, null, 2)} />
                </div>
                <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-black/60 p-3 font-mono text-[11px] text-gray-300">
                  {JSON.stringify(selected.data, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={() => toggleStar(selected.id)}
              className="w-full rounded-lg border border-ritual-gold/40 px-3 py-2 text-sm text-ritual-gold transition-colors hover:bg-ritual-gold/10"
            >
              {starred.has(selected.id) ? '★ Starred (click to unstar)' : '☆ Mark as important'}
            </button>
          </div>
        )}
      </InspectorPanel>
    </div>
  );
}

// Memoized row: re-renders only when its own props change, not when a sibling
// is selected. This is what keeps high-volume contracts (10k+ events) smooth.
const TimelineRow = memo(function TimelineRow({
  event: e,
  starred,
  onSelect,
}: {
  event: TimelineEvent;
  starred: boolean;
  onSelect: (e: TimelineEvent) => void;
}) {
  return (
    <div className="relative pl-12">
      <span
        className={`absolute left-[13px] top-3 flex h-3.5 w-3.5 items-center justify-center rounded-full ${statusDot[e.status]}`}
        style={{ boxShadow: '0 0 10px currentColor' }}
      />
      <button
        onClick={() => onSelect(e)}
        className="group w-full rounded-xl border border-gray-800 bg-ritual-elevated/50 p-4 text-left transition-colors hover:border-gray-700 hover:bg-ritual-elevated"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm ${statusColor[e.status]}`}>{statusIcon[e.status]}</span>
              <span className="font-medium text-gray-200">{e.title}</span>
              <ConfidenceChip level={e.confidence} />
              {starred && <span className="text-ritual-gold">★</span>}
            </div>
            <p className="mt-1 text-sm text-gray-400">{e.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] text-gray-600">
              <span>block {e.blockNumber.toLocaleString()}</span>
              {e.correlationId && <span className="text-ritual-pink/70">corr {e.correlationId}</span>}
              {e.txHash !== '—' && <span>{shortAddr(e.txHash)}</span>}
              <span className="uppercase">{e.category}</span>
            </div>
          </div>
          <span className="shrink-0 text-xs text-gray-600 opacity-0 transition-opacity group-hover:opacity-100">
            inspect →
          </span>
        </div>
      </button>
    </div>
  );
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className="font-mono text-xs text-gray-300 break-all text-right">{value}</span>
    </div>
  );
}
