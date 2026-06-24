import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ============================================================================
// BlackBox3D — a pseudo-3D floating "black box" recorder built with CSS
// transforms + SVG. Optimized: pure transform/opacity animation, no canvas.
// States: idle (floating), scanning (holographic open), open (analyzed).
// ============================================================================

type BoxState = 'idle' | 'scanning' | 'open';

const accentFor = (status: 'success' | 'warning' | 'failure' | 'unknown' | 'info' | undefined) => {
  switch (status) {
    case 'failure':
      return '#EF4444';
    case 'warning':
      return '#FACC15';
    case 'success':
      return '#f97316';
    case 'info':
      return '#FF1DCE';
    default:
      return '#f97316';
  }
};

export function BlackBox3D({
  state = 'idle',
  accent = 'success',
  size = 280,
}: {
  state?: BoxState;
  accent?: 'success' | 'warning' | 'failure' | 'unknown' | 'info';
  size?: number;
}) {
  const color = accentFor(accent);
  const lidOpen = state !== 'idle';

  // Orbiting particles
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        radius: 0.42 + (i % 4) * 0.07,
        duration: 8 + (i % 5) * 3,
        delay: i * 0.4,
        size: 2 + (i % 3),
      })),
    [],
  );

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size, perspective: 900 }}
      role="img"
      aria-label={`Black box recorder, state: ${state}`}
    >
      {/* radar rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0.55, 0.78, 1].map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{ width: size * s, height: size * s, borderColor: `${color}22` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30 + i * 12, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        {/* sweeping radar line */}
        <motion.div
          className="absolute origin-bottom"
          style={{
            width: 1,
            height: size / 2,
            background: `linear-gradient(to top, ${color}, transparent)`,
            bottom: '50%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: state === 'scanning' ? 2 : 6, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* orbiting signal particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{
            x: [
              Math.cos(0) * size * p.radius,
              Math.cos(Math.PI) * size * p.radius,
              Math.cos(Math.PI * 2) * size * p.radius,
            ],
            y: [
              Math.sin(0) * size * p.radius * 0.5,
              Math.sin(Math.PI) * size * p.radius * 0.5,
              Math.sin(Math.PI * 2) * size * p.radius * 0.5,
            ],
            opacity: [0.2, 0.9, 0.2],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* The box itself */}
      <motion.div
        className="relative"
        style={{ width: size * 0.46, height: size * 0.46, transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: [12, 16, 12],
          rotateY: [-18, -10, -18],
          y: [0, -10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* body */}
        <div
          className="absolute inset-0 rounded-md"
          style={{
            background: 'linear-gradient(145deg, #0e1320, #05070d)',
            border: `1px solid ${color}55`,
            boxShadow: `0 0 40px -8px ${color}66, inset 0 0 30px rgba(0,0,0,0.8)`,
            transform: 'translateZ(0px)',
          }}
        >
          {/* internal glow / grid */}
          <div className="absolute inset-1.5 overflow-hidden rounded-sm grid-bg opacity-60" />
          {/* core */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: 22, height: 22, background: color, boxShadow: `0 0 24px ${color}` }}
            animate={{ scale: state === 'scanning' ? [1, 1.5, 1] : [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: state === 'scanning' ? 1 : 2.6, repeat: Infinity }}
          />
          {/* scanning beam */}
          {state === 'scanning' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm">
              <div
                className="absolute left-0 h-8 w-full animate-scanline"
                style={{ background: `linear-gradient(to bottom, transparent, ${color}55, transparent)` }}
              />
            </div>
          )}
          {/* label */}
          <div className="absolute bottom-1 left-0 right-0 text-center font-mono text-[7px] uppercase tracking-[0.3em] text-gray-500">
            FLIGHT REC
          </div>
        </div>

        {/* lid (opens when scanning/open) */}
        <motion.div
          className="absolute left-0 right-0 top-0 rounded-t-md"
          style={{
            height: '32%',
            background: 'linear-gradient(145deg, #131a2b, #0a0f1a)',
            border: `1px solid ${color}55`,
            transformOrigin: 'top',
          }}
          animate={{ rotateX: lidOpen ? -110 : 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
