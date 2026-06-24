import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { NavLink } from 'react-router-dom';
import { Button } from './ui/primitives';
import { shortAddr } from '@/lib/ritual';

const MOBILE_NAV = [
  { to: '/app', label: 'Analyze' },
  { to: '/app/recorder', label: 'Recorder' },
  { to: '/app/autopsy', label: 'Autopsy' },
  { to: '/app/map', label: 'Map' },
  { to: '/app/fix', label: 'Fix' },
  { to: '/app/kit', label: 'Kit' },
  { to: '/app/skill', label: 'AI Skill' },
  { to: '/app/vault', label: 'Vault' },
];

export function TopBar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const onRitual = chainId === 1979;

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-gray-800/80 bg-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="lg:hidden font-display text-sm font-bold text-ritual-green">RITUAL BLACK BOX</span>
          {/* Network indicator */}
          <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-ritual-elevated/60 px-3 py-1">
            <span className={`h-2 w-2 rounded-full ${onRitual ? 'bg-ritual-green animate-pulse' : 'bg-ritual-gold'}`} />
            <span className="font-mono text-[11px] text-gray-400">
              {onRitual ? 'Ritual L1 · 1979' : isConnected ? 'Wrong network' : 'Ritual L1 testnet'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 rounded-lg border border-ritual-green/40 bg-ritual-green/5 px-3 py-2 font-mono text-xs text-ritual-green transition-colors hover:bg-ritual-green/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ritual-green" />
              {shortAddr(address)}
            </button>
          ) : (
            <Button variant="primary" onClick={() => connect({ connector: injected() })}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* mobile nav row */}
      <nav className="flex gap-1 overflow-x-auto border-t border-gray-800/60 px-3 py-2 lg:hidden">
        {MOBILE_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/app'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                isActive ? 'bg-ritual-green/10 text-ritual-green' : 'text-gray-500'
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
