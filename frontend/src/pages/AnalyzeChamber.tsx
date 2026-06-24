import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BlackBox3D } from '@/components/BlackBox3D';
import { Button, Panel, ConfidenceChip, InfoTip } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { isValidAddress, shortAddr } from '@/lib/ritual';
import { DEMO_LIST } from '@/lib/demoData';
import type { ScanStep } from '@/types';

const SCAN_STEPS: ScanStep[] = [
  { key: 'verify', label: 'Verifying address' },
  { key: 'bytecode', label: 'Searching for bytecode' },
  { key: 'history', label: 'Reading public history' },
  { key: 'decode', label: 'Decoding events' },
  { key: 'callbacks', label: 'Detecting callbacks' },
  { key: 'failures', label: 'Searching for failures' },
  { key: 'timeline', label: 'Building timeline' },
  { key: 'report', label: 'Generating report' },
  { key: 'risk', label: 'Identifying risks' },
];

export function AnalyzeChamber() {
  const navigate = useNavigate();
  const [addr, setAddr] = useState('');
  const [mode, setMode] = useState<'demo' | 'rpc'>('demo');
  const { startAnalysis, scanning, current, error, scanStepIndex, setScanStep, abiText, setAbiText, clearCurrent } =
    useStore();
  const [showAbi, setShowAbi] = useState(false);

  const valid = isValidAddress(addr);

  // Drive the cinematic scan sequence while scanning.
  useEffect(() => {
    if (!scanning) return;
    setScanStep(0);
    const id = setInterval(() => {
      setScanStep((useStore.getState().scanStepIndex + 1) % SCAN_STEPS.length);
    }, 320);
    return () => clearInterval(id);
  }, [scanning, setScanStep]);

  const run = (a: string, m: 'demo' | 'rpc') => {
    void startAnalysis(a, m);
  };

  const boxState = scanning ? 'scanning' : current ? 'open' : 'idle';
  const accent = current ? (current.risk.value >= 40 ? 'failure' : 'success') : 'success';

  return (
    <div>
      {/* Hero chamber */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-ritual-elevated/40 to-black/40 px-6 py-10 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.35em] text-ritual-green/70">
              Ritual L1 · Forensic Chamber
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-gray-100 md:text-5xl">
              Insert a signal.
              <br />
              <span className="text-ritual-green text-glow-green">Open the black box.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
              Paste a contract or agent address from Ritual L1. The recorder reconstructs its public on-chain
              story: events, callbacks, failures, and risks. It reads evidence — it does not invent what was
              never emitted.
            </p>

            {/* The "signal slot" address input — RPC mode only */}
            <div className="mt-6">
              {mode === 'rpc' && (
                <>
                  <label className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500">
                    Contract / agent address
                    <InfoTip text="The recorder analyzes public on-chain data. If the contract emits BlackBoxLogger events, the reconstruction is verified. Otherwise it falls back to inference." />
                  </label>
                  <div
                    className={`group relative flex items-center rounded-lg border bg-black/60 transition-all ${
                      addr ? (valid ? 'border-ritual-green/50 shadow-glow-green' : 'border-ritual-red/50') : 'border-gray-700'
                    }`}
                  >
                    <span className="pl-3 font-mono text-sm text-gray-500">0x</span>
                    <input
                      value={addr.replace(/^0x/, '')}
                      onChange={(e) => setAddr('0x' + e.target.value.replace(/^0x/, '').trim())}
                      placeholder="contract address…"
                      className="w-full bg-transparent px-1.5 py-3 font-mono text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                      spellCheck={false}
                    />
                    {addr && (
                      <span className={`pr-3 text-xs ${valid ? 'text-ritual-green' : 'text-ritual-red'}`}>
                        {valid ? '✓ valid' : 'invalid'}
                      </span>
                    )}
                  </div>
                </>
              )}

              {mode === 'demo' && (
                <p className="rounded-lg border border-ritual-green/30 bg-ritual-green/5 px-3 py-2.5 text-xs leading-relaxed text-ritual-green/90">
                  ◇ Demo Mode — pick a subject from the gallery below to see a full reconstruction. Switch to RPC Mode
                  to analyze a real address on Ritual L1.
                </p>
              )}

              {/* Mode toggle */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-gray-800 p-0.5">
                  {(['demo', 'rpc'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        mode === m ? 'bg-ritual-green/15 text-ritual-green' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {m === 'demo' ? 'Demo Mode' : 'RPC Mode'}
                    </button>
                  ))}
                </div>
                {mode === 'rpc' && (
                  <button
                    onClick={() => setShowAbi((s) => !s)}
                    className="rounded-md border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-ritual-gold/50 hover:text-ritual-gold"
                  >
                    {showAbi ? 'Hide ABI' : 'Import ABI (Enhanced)'}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showAbi && mode === 'rpc' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={abiText}
                      onChange={(e) => setAbiText(e.target.value)}
                      placeholder='Paste contract ABI JSON to decode unknown events (Enhanced Mode)…'
                      className="mt-3 h-24 w-full resize-none rounded-lg border border-gray-700 bg-black/60 p-3 font-mono text-xs text-gray-200 placeholder:text-gray-500 focus:border-ritual-gold/50 focus:outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'rpc' && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="primary" disabled={!valid || scanning} onClick={() => run(addr, 'rpc')}>
                    {scanning ? 'Scanning…' : 'Analyze'}
                  </Button>
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-lg border border-ritual-red/40 bg-ritual-red/5 px-3 py-2 text-xs text-ritual-red">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Black box visual */}
          <div className="flex flex-col items-center justify-center">
            <BlackBox3D state={boxState} accent={accent} size={300} />
          </div>
        </div>

        {/* Scan sequence overlay */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mt-8 rounded-xl border border-ritual-green/20 bg-black/60 p-5"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SCAN_STEPS.map((step, i) => {
                  const active = i === scanStepIndex;
                  const done = i < scanStepIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-2 font-mono text-xs">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                          done ? 'bg-ritual-green/20 text-ritual-green' : active ? 'text-ritual-green' : 'text-gray-700'
                        }`}
                      >
                        {done ? '✓' : active ? '⟳' : '·'}
                      </span>
                      <span className={done ? 'text-ritual-green/70' : active ? 'text-gray-200' : 'text-gray-600'}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Demo gallery — only in Demo Mode. Not gated on `scanning` so the
          cards don't flicker/remount when a demo loads. */}
      {mode === 'demo' && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500">
              <span className="h-px w-8 bg-gray-700" /> Demo subjects
            </div>
            {current && (
              <button
                onClick={() => clearCurrent()}
                className="rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:border-ritual-red/50 hover:text-ritual-red"
              >
                Clear analysis
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DEMO_LIST.map((d) => {
              const isActive = current?.identity.address.toLowerCase() === d.analysis.identity.address.toLowerCase();
              return (
                <button
                  key={d.analysis.id}
                  onClick={() => run(d.analysis.identity.address, 'demo')}
                  className={`group rounded-xl border p-5 text-left transition-colors duration-200 ${
                    isActive
                      ? 'border-ritual-green/60 bg-ritual-green/5'
                      : 'border-gray-800 bg-ritual-elevated/50 hover:border-ritual-green/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base text-gray-200">
                      {d.analysis.identity.classification.split('(')[0]}
                    </span>
                    {isActive ? (
                      <span className="rounded border border-ritual-green/50 px-1.5 py-0.5 text-[10px] uppercase text-ritual-green">
                        loaded
                      </span>
                    ) : (
                      <ConfidenceChip level={d.analysis.identity.usesBlackBoxLogger ? 'verified' : 'missing'} />
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{d.tagline}</p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-gray-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${d.analysis.risk.value >= 40 ? 'bg-ritual-red' : 'bg-ritual-green'}`} />
                    risk {d.analysis.risk.value} · {d.analysis.identity.eventCount} events
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Result preview — shown BELOW the demo cards once a subject is loaded.
          Demo results show only in Demo Mode; RPC/Enhanced results only in RPC Mode. */}
      <AnimatePresence mode="wait">
        {current && !scanning && (mode === 'demo' ? current.mode === 'demo' : current.mode !== 'demo') && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 grid gap-4 md:grid-cols-3"
          >
            <Panel className="p-5 md:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500">Subject identified</div>
                  <div className="mt-1 font-mono text-sm text-gray-200">{shortAddr(current.identity.address)}</div>
                  <div className="mt-1 text-sm text-gray-400">{current.identity.classification}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-medium uppercase ${
                      current.mode === 'demo'
                        ? 'border-ritual-pink/40 text-ritual-pink'
                        : 'border-ritual-green/40 text-ritual-green'
                    }`}
                  >
                    {current.mode} mode
                  </span>
                  {current.identity.usesBlackBoxLogger ? (
                    <span className="rounded border border-ritual-green/40 bg-ritual-green/5 px-2 py-0.5 text-[10px] text-ritual-green">
                      ◇ BlackBoxLogger detected
                    </span>
                  ) : (
                    <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] text-gray-500">
                      no logger
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-800 pt-4">
                <Stat label="Events" value={String(current.identity.eventCount)} />
                <Stat label="Balance" value={current.identity.balanceFormatted} />
                <Stat label="Findings" value={String(current.failures.length)} />
              </div>

              {!current.identity.usesBlackBoxLogger && current.identity.eventCount <= 1 && (
                <p className="mt-4 rounded-lg border border-ritual-gold/30 bg-ritual-gold/5 px-3 py-2.5 text-xs leading-relaxed text-ritual-gold">
                  This contract does not emit enough events to reconstruct a complete history. Install
                  BlackBoxLogger.sol to make it analyzable. The recorder will not invent a story it cannot prove.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => navigate('/app/recorder')}>
                  Open Flight Recorder →
                </Button>
                <Button variant="ghost" onClick={() => navigate('/app/map')}>
                  Signal Map
                </Button>
                <Button variant="ghost" onClick={() => navigate('/app/autopsy')}>
                  Autopsy
                </Button>
              </div>
            </Panel>

            <Panel className="p-5" glow={current.risk.value >= 40 ? 'red' : 'green'}>
              <div className="text-[11px] uppercase tracking-wider text-gray-500">Risk score</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-display text-4xl font-bold ${
                    current.risk.value >= 40 ? 'text-ritual-red' : 'text-ritual-green'
                  }`}
                >
                  {current.risk.value}
                </span>
                <span className="text-xs text-gray-500">/100</span>
              </div>
              <div className="mt-1 text-sm text-gray-300">{current.risk.label}</div>
              <div className="mt-1 text-[11px] text-gray-500">based on {current.risk.basis} evidence</div>
              <p className="mt-3 text-xs leading-relaxed text-gray-400">{current.narrative.slice(0, 160)}…</p>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-600">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-gray-200">{value}</div>
    </div>
  );
}
