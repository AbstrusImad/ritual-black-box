import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from '@/components/ui/primitives';
import { InspectorPanel } from '@/components/InspectorPanel';
import { NoAnalysis } from '@/components/NoAnalysis';
import { useStore } from '@/store/useStore';
import { explorerAddr, shortAddr } from '@/lib/ritual';
import type { SignalNode, SignalEdge } from '@/types';

const W = 900;
const H = 560;

const edgeColor: Record<string, string> = {
  success: '#f97316',
  warning: '#FACC15',
  failure: '#EF4444',
  info: '#FF1DCE',
  unknown: '#6B7280',
};

const nodeGlyph: Record<string, string> = {
  subject: '◼',
  'user-wallet': '◆',
  'ritual-wallet': '⚡',
  'callback-router': '↩',
  scheduler: '⏲',
  memory: '▤',
  'external-contract': '▢',
  precompile: '⬡',
};

export function SignalMap() {
  const current = useStore((s) => s.current);
  const [selected, setSelected] = useState<SignalNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);

  if (!current) return <NoAnalysis area="The Signal Map" />;

  const nodeById = (id: string) => current.nodes.find((n) => n.id === id);
  const px = (n: SignalNode) => n.x * W;
  const py = (n: SignalNode) => n.y * H;

  return (
    <div>
      <SectionTitle
        eyebrow="Signal Map"
        title="Relationships & signals"
        sub="The subject contract and everything it touched: RitualWallet, Scheduler, AsyncDelivery, precompiles and memory. Signals travel along the connections. Click a node to inspect it."
      />

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))} className="rounded border border-gray-700 px-2.5 py-1 text-sm text-gray-400 hover:text-gray-200">+</button>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="rounded border border-gray-700 px-2.5 py-1 text-sm text-gray-400 hover:text-gray-200">−</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200">reset</button>
        <span className="ml-2 font-mono text-[11px] text-gray-600">drag to pan · scroll nodes to inspect</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black/50"
        style={{ height: H + 40 }}
        onMouseDown={(e) => (dragging.current = { x: e.clientX - pan.x, y: e.clientY - pan.y })}
        onMouseUp={() => (dragging.current = null)}
        onMouseLeave={() => (dragging.current = null)}
        onMouseMove={(e) => {
          if (dragging.current) setPan({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
        >
          <defs>
            {Object.entries(edgeColor).map(([k, c]) => (
              <marker key={k} id={`arrow-${k}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={c} />
              </marker>
            ))}
          </defs>

          {/* edges */}
          {current.edges.map((edge: SignalEdge) => {
            const from = nodeById(edge.from);
            const to = nodeById(edge.to);
            if (!from || !to) return null;
            const c = edgeColor[edge.status] ?? '#6B7280';
            const x1 = px(from), y1 = py(from), x2 = px(to), y2 = py(to);
            return (
              <g key={edge.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1.2} strokeOpacity={0.4} markerEnd={`url(#arrow-${edge.status})`} />
                {edge.label && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} fill={c} fillOpacity={0.7} fontSize={10} fontFamily="monospace" textAnchor="middle">
                    {edge.label}
                  </text>
                )}
                {/* traveling packet */}
                {edge.active && (
                  <motion.circle
                    r={3.5}
                    fill={c}
                    style={{ filter: `drop-shadow(0 0 4px ${c})` }}
                    animate={{ cx: [x1, x2], cy: [y1, y2] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </g>
            );
          })}

          {/* nodes */}
          {current.nodes.map((n) => {
            const c = edgeColor[n.status] ?? '#6B7280';
            const isSubject = n.kind === 'subject';
            const r = isSubject ? 34 : 26;
            return (
              <g
                key={n.id}
                transform={`translate(${px(n)}, ${py(n)})`}
                className="cursor-pointer"
                onClick={() => setSelected(n)}
              >
                <motion.circle
                  r={r}
                  fill="#0a0f1a"
                  stroke={c}
                  strokeWidth={isSubject ? 2 : 1.2}
                  animate={{ strokeOpacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ filter: `drop-shadow(0 0 8px ${c}66)` }}
                />
                <text textAnchor="middle" dy={isSubject ? 2 : 1} fontSize={isSubject ? 20 : 15} fill={c}>
                  {nodeGlyph[n.kind] ?? '○'}
                </text>
                <text textAnchor="middle" y={r + 14} fontSize={10} fontFamily="monospace" fill="#9CA3AF">
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
        {Object.entries(edgeColor).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} /> {k}
          </span>
        ))}
      </div>

      <InspectorPanel open={!!selected} title={selected?.label ?? ''} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Kind: <span className="font-mono text-gray-200">{selected.kind}</span>
            </div>
            {selected.address && (
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 p-3">
                <span className="text-[11px] uppercase tracking-wider text-gray-500">Address</span>
                <a href={explorerAddr(selected.address)} target="_blank" rel="noreferrer" className="font-mono text-xs text-ritual-green hover:underline">
                  {shortAddr(selected.address)} ↗
                </a>
              </div>
            )}
            <p className="text-sm leading-relaxed text-gray-400">
              {describeNode(selected.kind)}
            </p>
            {selected.meta && (
              <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-black/60 p-3 font-mono text-[11px] text-gray-300">
                {JSON.stringify(selected.meta, null, 2)}
              </pre>
            )}
          </div>
        )}
      </InspectorPanel>
    </div>
  );
}

function describeNode(kind: string): string {
  switch (kind) {
    case 'subject':
      return 'The contract or agent under analysis. All other nodes are things it interacted with on-chain.';
    case 'ritual-wallet':
      return 'RitualWallet holds the fees that pay for async precompile calls. If it runs dry, commitments never settle.';
    case 'scheduler':
      return 'The Scheduler system contract triggers recurring wakes. It always calls back the contract that scheduled it.';
    case 'callback-router':
      return 'AsyncDelivery (0x5A16…39F6) is the msg.sender for every long-running async callback. Callbacks must verify this.';
    case 'precompile':
      return 'An enshrined Ritual precompile (HTTP, LLM, agent, etc.) invoked for non-deterministic compute via the async lifecycle.';
    case 'memory':
      return 'The subject\u2019s own state slots, mutated over its lifecycle.';
    case 'user-wallet':
      return 'An externally owned account — typically the owner/operator of the subject.';
    default:
      return 'A related on-chain entity detected during reconstruction.';
  }
}
