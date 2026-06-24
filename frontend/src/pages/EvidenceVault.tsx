import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionTitle, Panel, Button, EmptyState, CopyButton } from '@/components/ui/primitives';
import { useStore, type VaultEntry } from '@/store/useStore';
import { shortAddr } from '@/lib/ritual';
import { toJSON, toMarkdown, toSummary, download, copyToClipboard } from '@/lib/exporters';

export function EvidenceVault() {
  const { current, vault, saveCurrentToVault, deleteVaultEntry, updateNotes } = useStore();
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  const entryA = vault.find((v) => v.id === compareA);
  const entryB = vault.find((v) => v.id === compareB);

  return (
    <div>
      <SectionTitle
        eyebrow="Evidence Vault"
        title="Saved analyses"
        sub="Analyses are stored locally in your browser (no backend). Save the current subject, compare two runs of the same contract, attach notes, and export reports as JSON or Markdown."
      />

      {/* Save current */}
      <Panel className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-gray-300">Current subject</div>
          <div className="font-mono text-xs text-gray-500">
            {current ? shortAddr(current.identity.address) : 'none loaded'}
          </div>
        </div>
        <div className="flex gap-2">
          {current && (
            <>
              <Button variant="primary" onClick={() => saveCurrentToVault()}>
                Save to Vault
              </Button>
              <Button variant="ghost" onClick={() => download(`blackbox-${current.identity.address.slice(0, 8)}.json`, toJSON(current), 'application/json')}>
                Export JSON
              </Button>
              <Button variant="ghost" onClick={() => download(`blackbox-${current.identity.address.slice(0, 8)}.md`, toMarkdown(current), 'text/markdown')}>
                Export MD
              </Button>
              <Button variant="secondary" onClick={() => void copyToClipboard(toSummary(current))}>
                Copy summary
              </Button>
            </>
          )}
        </div>
      </Panel>

      {vault.length === 0 ? (
        <EmptyState
          icon="▣"
          title="Vault is empty"
          body="Save an analysis to keep it here. Stored locally via your browser — nothing leaves your machine."
        />
      ) : (
        <div className="space-y-4">
          {vault.map((entry, i) => (
            <VaultCard
              key={entry.id}
              entry={entry}
              index={i}
              onDelete={() => deleteVaultEntry(entry.id)}
              onNotes={(n) => updateNotes(entry.id, n)}
              compareState={compareA === entry.id ? 'A' : compareB === entry.id ? 'B' : null}
              onCompare={() => {
                if (compareA === entry.id) setCompareA(null);
                else if (compareB === entry.id) setCompareB(null);
                else if (!compareA) setCompareA(entry.id);
                else setCompareB(entry.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Compare view */}
      {entryA && entryB && (
        <Panel className="mt-8 p-5">
          <h3 className="mb-4 font-display text-lg text-gray-200">Comparison</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {[entryA, entryB].map((e) => (
              <div key={e.id} className="rounded-lg border border-gray-800 bg-black/30 p-4">
                <div className="font-mono text-xs text-gray-400">{shortAddr(e.address)}</div>
                <div className="mt-1 text-xs text-gray-600">{new Date(e.createdAt).toLocaleString()}</div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <CompareRow label="Risk" value={`${e.riskValue}/100`} />
                  <CompareRow label="Events" value={String(e.analysis.identity.eventCount)} />
                  <CompareRow label="Failures" value={String(e.analysis.failures.length)} />
                  <CompareRow label="Logger" value={e.analysis.identity.usesBlackBoxLogger ? 'yes' : 'no'} />
                  <CompareRow label="Mode" value={e.mode} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-3 text-sm text-gray-400">
            Risk delta:{' '}
            <span className={entryB.riskValue >= entryA.riskValue ? 'text-ritual-red' : 'text-ritual-green'}>
              {entryB.riskValue - entryA.riskValue > 0 ? '+' : ''}
              {entryB.riskValue - entryA.riskValue}
            </span>{' '}
            · Events delta: {entryB.analysis.identity.eventCount - entryA.analysis.identity.eventCount}
          </div>
        </Panel>
      )}
    </div>
  );
}

function VaultCard({
  entry,
  index,
  onDelete,
  onNotes,
  compareState,
  onCompare,
}: {
  entry: VaultEntry;
  index: number;
  onDelete: () => void;
  onNotes: (n: string) => void;
  compareState: 'A' | 'B' | null;
  onCompare: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(entry.notes);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-200">{shortAddr(entry.address)}</span>
              <span className={`h-2 w-2 rounded-full ${entry.riskValue >= 40 ? 'bg-ritual-red' : 'bg-ritual-green'}`} />
              <span className="text-xs text-gray-500">risk {entry.riskValue}</span>
            </div>
            <div className="mt-0.5 text-sm text-gray-400">{entry.label}</div>
            <div className="mt-0.5 text-[11px] text-gray-600">{new Date(entry.createdAt).toLocaleString()} · {entry.mode} mode</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onCompare}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                compareState ? 'border-ritual-pink/50 text-ritual-pink' : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {compareState ? `Compare ${compareState}` : 'Compare'}
            </button>
            <CopyButton text={toSummary(entry.analysis)} label="Summary" />
            <button onClick={onDelete} className="rounded border border-ritual-red/40 px-2.5 py-1 text-xs text-ritual-red hover:bg-ritual-red/10">
              Delete
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-gray-800 pt-3">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Builder notes…"
                className="h-20 w-full resize-none rounded-lg border border-gray-700 bg-black/60 p-2.5 text-sm text-gray-300 focus:border-ritual-green/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => { onNotes(notes); setEditing(false); }}>Save notes</Button>
                <Button variant="ghost" onClick={() => { setNotes(entry.notes); setEditing(false); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-left text-sm text-gray-500 hover:text-gray-300">
              {entry.notes ? <span className="text-gray-400">{entry.notes}</span> : '+ Add builder notes'}
            </button>
          )}
        </div>
      </Panel>
    </motion.div>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className="font-mono text-xs text-gray-300">{value}</span>
    </div>
  );
}
