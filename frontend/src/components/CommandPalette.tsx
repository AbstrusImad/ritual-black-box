import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { DEMO_LIST } from '@/lib/demoData';

interface Command {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const startAnalysis = useStore((s) => s.startAnalysis);
  const saveCurrentToVault = useStore((s) => s.saveCurrentToVault);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const commands: Command[] = [
    { id: 'go-analyze', label: 'Go to Analyze Chamber', hint: 'navigate', run: () => navigate('/app') },
    { id: 'go-recorder', label: 'Go to Flight Recorder', hint: 'navigate', run: () => navigate('/app/recorder') },
    { id: 'go-autopsy', label: 'Go to Failure Autopsy', hint: 'navigate', run: () => navigate('/app/autopsy') },
    { id: 'go-map', label: 'Go to Signal Map', hint: 'navigate', run: () => navigate('/app/map') },
    { id: 'go-fix', label: 'Go to Fix Console', hint: 'navigate', run: () => navigate('/app/fix') },
    { id: 'go-kit', label: 'Go to Integration Kit', hint: 'navigate', run: () => navigate('/app/kit') },
    { id: 'go-vault', label: 'Go to Evidence Vault', hint: 'navigate', run: () => navigate('/app/vault') },
    { id: 'save', label: 'Save current analysis to Vault', hint: 'action', run: () => saveCurrentToVault() },
    ...DEMO_LIST.map((d) => ({
      id: `demo-${d.analysis.id}`,
      label: `Load demo · ${d.analysis.identity.classification}`,
      hint: 'demo',
      run: () => {
        void startAnalysis(d.analysis.identity.address, 'demo');
        navigate('/app/recorder');
      },
    })),
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-700 bg-ritual-elevated shadow-glow-green"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              className="w-full border-b border-gray-800 bg-transparent px-4 py-3.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
            />
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-600">No commands</div>}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    c.run();
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-ritual-green/10 hover:text-ritual-green"
                >
                  <span>{c.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-600">{c.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
