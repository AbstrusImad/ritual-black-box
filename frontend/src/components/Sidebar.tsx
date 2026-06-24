import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

const NAV = [
  { to: '/', label: 'Analyze Chamber', glyph: '◎', desc: 'Insert a signal' },
  { to: '/recorder', label: 'Flight Recorder', glyph: '⏱', desc: 'Chronological history' },
  { to: '/autopsy', label: 'Failure Autopsy', glyph: '⚠', desc: 'Open the wreck' },
  { to: '/map', label: 'Signal Map', glyph: '⬡', desc: 'Node relationships' },
  { to: '/fix', label: 'Fix Console', glyph: '⚙', desc: 'What to do next' },
  { to: '/kit', label: 'Integration Kit', glyph: '◇', desc: 'BlackBoxLogger.sol' },
  { to: '/vault', label: 'Evidence Vault', glyph: '▣', desc: 'Saved analyses' },
];

export function Sidebar() {
  const current = useStore((s) => s.current);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-800/80 bg-black/40 px-4 py-6 backdrop-blur-md lg:flex">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md border border-ritual-green/40 bg-ritual-green/5">
            <span className="text-ritual-green text-glow-green">◼</span>
            <span className="absolute inset-0 animate-pulse-green rounded-md" />
          </div>
          <div>
            <div className="font-display text-sm font-bold leading-none text-gray-100">RITUAL</div>
            <div className="font-display text-sm font-bold leading-none text-ritual-green text-glow-green">BLACK BOX</div>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-gray-600">
          Forensic flight recorder for Ritual-native agents & async workflows.
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? 'bg-ritual-green/10 text-ritual-green'
                  : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-ritual-green shadow-glow-green"
                  />
                )}
                <span className="w-5 text-center text-base">{item.glyph}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{item.label}</span>
                  <span className="text-[10px] leading-tight text-gray-600">{item.desc}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-300"
        >
          <span>Command palette</span>
          <kbd className="rounded border border-gray-700 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <div className="rounded-lg border border-gray-800/60 bg-ritual-elevated/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-600">Loaded subject</div>
          {current ? (
            <div className="mt-1 font-mono text-[11px] text-ritual-green">
              {current.identity.address.slice(0, 10)}…{current.identity.address.slice(-6)}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-gray-600">none — analyze a contract</div>
          )}
        </div>
      </div>
    </aside>
  );
}
