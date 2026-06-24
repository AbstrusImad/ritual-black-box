import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { ConfidenceLevel, SignalStatus, Severity } from '@/types';
import { copyToClipboard } from '@/lib/exporters';

// ----------------------------------------------------------------------------
// Status color mapping (semantic honesty: color always means the same thing).
// ----------------------------------------------------------------------------

export const statusColor: Record<SignalStatus, string> = {
  success: 'text-ritual-green',
  warning: 'text-ritual-gold',
  failure: 'text-ritual-red',
  unknown: 'text-gray-500',
  info: 'text-ritual-pink',
};

export const statusBorder: Record<SignalStatus, string> = {
  success: 'border-ritual-green/40',
  warning: 'border-ritual-gold/40',
  failure: 'border-ritual-red/50',
  unknown: 'border-gray-700',
  info: 'border-ritual-pink/40',
};

export const statusDot: Record<SignalStatus, string> = {
  success: 'bg-ritual-green',
  warning: 'bg-ritual-gold',
  failure: 'bg-ritual-red',
  unknown: 'bg-gray-600',
  info: 'bg-ritual-pink',
};

export const statusIcon: Record<SignalStatus, string> = {
  success: '✓',
  warning: '◌',
  failure: '✗',
  unknown: '⊘',
  info: '◈',
};

// ----------------------------------------------------------------------------
// Confidence label chip — the core of the app's honesty.
// ----------------------------------------------------------------------------

const confidenceStyle: Record<ConfidenceLevel, { label: string; cls: string; title: string }> = {
  verified: { label: 'Verified', cls: 'text-ritual-green border-ritual-green/40 bg-ritual-green/5', title: 'Decoded directly from an on-chain log or receipt.' },
  decoded: { label: 'Decoded', cls: 'text-ritual-lime border-ritual-lime/40 bg-ritual-lime/5', title: 'Decoded using a provided/known ABI.' },
  inferred: { label: 'Inferred', cls: 'text-ritual-gold border-ritual-gold/40 bg-ritual-gold/5', title: 'Pattern-matched, not directly proven.' },
  uncertain: { label: 'Uncertain', cls: 'text-ritual-gold/80 border-ritual-gold/30 bg-ritual-gold/5', title: 'Weak signal — may be wrong.' },
  missing: { label: 'Missing', cls: 'text-gray-400 border-gray-700 bg-gray-800/40', title: 'We know we do NOT know this. Not emitted on-chain.' },
};

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  const s = confidenceStyle[level];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const severityStyle: Record<Severity, string> = {
  low: 'text-gray-300 border-gray-600 bg-gray-800/40',
  medium: 'text-ritual-gold border-ritual-gold/40 bg-ritual-gold/5',
  high: 'text-orange-400 border-orange-500/40 bg-orange-500/5',
  critical: 'text-ritual-red border-ritual-red/50 bg-ritual-red/10',
};

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityStyle[severity]}`}>
      {severity}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Panel / Card
// ----------------------------------------------------------------------------

export function Panel({
  children,
  className = '',
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: 'green' | 'pink' | 'gold' | 'red';
}) {
  const glowCls = glow ? `shadow-glow-${glow}` : 'shadow-card';
  return (
    <div className={`rounded-xl border border-gray-800 bg-ritual-elevated/70 backdrop-blur-sm ${glowCls} ${className}`}>
      {children}
    </div>
  );
}

export function DataLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] uppercase tracking-wider text-gray-500">{children}</span>;
}

export function DataValue({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-sm text-gray-300 ${className}`}>{children}</span>;
}

// ----------------------------------------------------------------------------
// Buttons (Ritual style: transparent + colored border + glow on hover).
// ----------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'pink';

const variantCls: Record<Variant, string> = {
  primary: 'border-ritual-green text-ritual-green hover:bg-ritual-green/10 hover:shadow-glow-green',
  secondary: 'border-dashed border-ritual-gold text-ritual-gold hover:bg-ritual-gold/10',
  ghost: 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200',
  danger: 'border-ritual-red/50 text-ritual-red hover:bg-ritual-red/10',
  pink: 'border-ritual-pink text-ritual-pink hover:bg-ritual-pink/10 hover:shadow-glow-pink',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40 ${variantCls[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Copy button
// ----------------------------------------------------------------------------

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        const ok = await copyToClipboard(text);
        if (ok) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
      className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 font-mono text-[11px] text-gray-400 transition-colors hover:border-ritual-green/50 hover:text-ritual-green"
    >
      {done ? '✓ copied' : label}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Tooltip (educational)
// ----------------------------------------------------------------------------

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help items-center justify-center">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-[9px] text-gray-500">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gray-700 bg-black/95 p-2.5 text-[11px] leading-relaxed text-gray-300 opacity-0 shadow-card transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

// ----------------------------------------------------------------------------
// Section heading
// ----------------------------------------------------------------------------

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-ritual-green/70">{eyebrow}</div>}
      <h1 className="font-display text-3xl font-bold text-gray-100 md:text-4xl">{title}</h1>
      {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">{sub}</p>}
      <div className="mt-4 h-px bg-gradient-to-r from-ritual-green/40 via-gray-800 to-transparent" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Empty / honesty state
// ----------------------------------------------------------------------------

export function EmptyState({ icon = '◌', title, body, action }: { icon?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-ritual-elevated/30 px-6 py-16 text-center"
    >
      <div className="mb-4 text-4xl text-gray-700">{icon}</div>
      <h3 className="font-display text-lg text-gray-300">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// Risk meter
// ----------------------------------------------------------------------------

export function RiskMeter({ value, label, basis }: { value: number; label: string; basis: string }) {
  const color = value >= 70 ? 'ritual-red' : value >= 40 ? 'ritual-gold' : value >= 15 ? 'ritual-lime' : 'ritual-green';
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={`font-display text-3xl font-bold text-${color}`}>{value}</span>
        <span className="text-xs text-gray-500">/100</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-${color}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={`text-${color}`}>{label}</span>
        <span className="text-gray-500">{basis} evidence</span>
      </div>
    </div>
  );
}
