import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { BlackBox3D } from '@/components/BlackBox3D';

// ============================================================================
// Landing — the presentational front door. Connect wallet to enter the app.
// Heavy on atmosphere: floating black box, orbiting signals, animated feature
// cards, and a clear gated CTA.
// ============================================================================

const FEATURES = [
  {
    glyph: '⏱',
    title: 'Flight Recorder',
    body: 'A chronological reconstruction of everything a contract did on-chain — boot, funding, scheduler wakes, async jobs, callbacks.',
    accent: 'text-ritual-green',
  },
  {
    glyph: '⚠',
    title: 'Failure Autopsy',
    body: 'Opens the wreck: reverted txs, missing callbacks, stalled async jobs — each with severity, evidence, and a likely cause.',
    accent: 'text-ritual-red',
  },
  {
    glyph: '⬡',
    title: 'Signal Map',
    body: 'A live node graph of every entity the contract touched: RitualWallet, Scheduler, AsyncDelivery, precompiles.',
    accent: 'text-ritual-pink',
  },
  {
    glyph: '⚙',
    title: 'Fix Console',
    body: 'Not just errors — concrete, copy-ready Solidity patterns to make your agent observable and resilient.',
    accent: 'text-ritual-gold',
  },
];

const STEPS = [
  { n: '01', t: 'Insert a signal', d: 'Paste any contract or agent address from Ritual L1.' },
  { n: '02', t: 'Open the box', d: 'The recorder scans public on-chain data and decodes events.' },
  { n: '03', t: 'Read the truth', d: 'Timeline, failures, risk score, and fixes — with honest confidence labels.' },
];

const STATS = [
  { v: '1979', l: 'Ritual L1 chain ID' },
  { v: '16', l: 'precompiles understood' },
  { v: '13', l: 'lifecycle events decoded' },
  { v: '0', l: 'invented facts' },
];

export function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const reduce = useReducedMotion();

  // If already connected, the user can jump straight in.
  useEffect(() => {
    // no auto-redirect — let the user choose to enter.
  }, []);

  const enter = () => {
    if (isConnected) {
      navigate('/app');
    } else {
      connect(
        { connector: injected() },
        {
          onSuccess: () => navigate('/app'),
        },
      );
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduce ? 0 : i * 0.1, duration: 0.6, ease: 'easeOut' },
    }),
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* animated grid + glow backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12), transparent 60%)' }}
        animate={reduce ? {} : { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* ===== Top bar ===== */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md border border-ritual-green/40 bg-ritual-green/5">
            <span className="text-ritual-green text-glow-green">◼</span>
            <span className="absolute inset-0 animate-pulse-green rounded-md" />
          </div>
          <div className="leading-none">
            <div className="font-display text-sm font-bold text-gray-100">RITUAL</div>
            <div className="font-display text-sm font-bold text-ritual-green text-glow-green">BLACK BOX</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AbstrusImad/ritual-black-box"
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm text-gray-400 transition-colors hover:text-gray-200 sm:block"
          >
            GitHub ↗
          </a>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="rounded-lg border border-ritual-green/40 bg-ritual-green/5 px-3 py-2 font-mono text-xs text-ritual-green transition-colors hover:bg-ritual-green/10"
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:pt-16">
        <div>
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-ritual-elevated/50 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-gray-400"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ritual-green" />
            Forensic tool · Ritual L1 testnet
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display text-5xl font-bold leading-[1.05] text-gray-100 md:text-6xl"
          >
            The black box
            <br />
            for <span className="text-ritual-green text-glow-green">Ritual agents</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-md text-base leading-relaxed text-gray-400"
          >
            When an agent or async workflow misbehaves on Ritual, you need to know what really happened. Black Box
            reconstructs the public on-chain story — events, callbacks, failures, risks — and never invents what
            wasn't emitted.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={enter}
              disabled={isPending}
              className="group relative overflow-hidden rounded-lg border border-ritual-green bg-ritual-green/10 px-6 py-3.5 font-semibold text-ritual-green shadow-glow-green transition-all hover:bg-ritual-green/20 disabled:opacity-50"
            >
              <span className="relative z-10">
                {isPending ? 'Connecting…' : isConnected ? 'Enter the chamber →' : 'Connect wallet to enter →'}
              </span>
            </button>
            <span className="font-mono text-xs text-gray-500">
              {isConnected ? 'Wallet connected · click to enter' : 'A wallet connection is required to enter'}
            </span>
          </motion.div>

          {/* stats */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 grid grid-cols-4 gap-4 border-t border-gray-800 pt-6"
          >
            {STATS.map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl font-bold text-gray-100">{s.v}</div>
                <div className="mt-1 text-[10px] uppercase leading-tight tracking-wider text-gray-500">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* The black box visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <BlackBox3D state="idle" accent="success" size={360} />
        </motion.div>
      </section>

      {/* ===== Features ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-ritual-green/70">Instruments</div>
          <h2 className="mt-2 font-display text-3xl font-bold text-gray-100">Seven ways to read the wreck</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={reduce ? undefined : { y: -6 }}
              className="rounded-xl border border-gray-800 bg-ritual-elevated/50 p-6 transition-colors hover:border-gray-700"
            >
              <div className={`text-2xl ${f.accent}`}>{f.glyph}</div>
              <h3 className="mt-4 font-display text-lg text-gray-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-ritual-green/70">How it works</div>
          <h2 className="mt-2 font-display text-3xl font-bold text-gray-100">Insert. Open. Read the truth.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="relative rounded-xl border border-gray-800 bg-gradient-to-b from-ritual-elevated/60 to-transparent p-6"
            >
              <div className="font-display text-4xl font-bold text-ritual-green/30">{s.n}</div>
              <h3 className="mt-3 font-display text-lg text-gray-100">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== AI Skill ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-ritual-green/30 bg-gradient-to-br from-ritual-green/10 via-ritual-elevated/40 to-transparent p-8 md:p-10"
        >
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-ritual-green/70">AI Integration Skill</div>
              <h2 className="mt-2 font-display text-3xl font-bold text-gray-100">
                Let your AI <span className="text-ritual-green">install the kit</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                Install the BlackBox skill into Claude, Cursor, Codex or Gemini. Your agent then emits the right
                events in your Ritual contract automatically — so it earns a verified reconstruction here. The skill
                teaches integration only; diagnosis stays in this app.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/AbstrusImad/ritual-black-box/tree/main/blackbox-skill"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-ritual-green/50 hover:text-ritual-green"
                >
                  Skill on GitHub ↗
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/60 p-4 font-mono text-[11px] leading-relaxed text-gray-300">
              <div className="text-gray-500"># Claude Code</div>
              <div className="text-ritual-green">git clone https://github.com/AbstrusImad/ritual-black-box.git</div>
              <div className="text-ritual-green">cp -r ritual-black-box/blackbox-skill ~/.claude/skills/</div>
              <div className="mt-2 text-gray-500"># then tell your agent:</div>
              <div className="text-gray-300">"Read blackbox-skill/SKILL.md and follow it."</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== Honesty band ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 rounded-2xl border border-gray-800 bg-ritual-elevated/40 p-8 md:grid-cols-2"
        >
          <div>
            <div className="text-ritual-green">◇ What it can know</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Public on-chain evidence: bytecode, balance, emitted events, decoded BlackBoxLogger lifecycle,
              async requests with no callback, budget warnings, and explicit failures.
            </p>
          </div>
          <div>
            <div className="text-gray-400">⊘ What it cannot know</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Private internal logic, the contents of results never logged, or why something failed when no failure
              event was emitted. When evidence is missing, it says so — it never invents.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl font-bold text-gray-100"
        >
          Ready to open the box?
        </motion.h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-gray-400">
          Connect your wallet to enter the forensic chamber. Read-only — Black Box never signs transactions on your
          behalf.
        </p>
        <button
          onClick={enter}
          disabled={isPending}
          className="mt-8 rounded-lg border border-ritual-green bg-ritual-green/10 px-8 py-4 font-semibold text-ritual-green shadow-glow-green transition-all hover:bg-ritual-green/20 disabled:opacity-50"
        >
          {isPending ? 'Connecting…' : isConnected ? 'Enter the chamber →' : 'Connect wallet to enter →'}
        </button>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 mx-auto max-w-6xl border-t border-gray-800 px-6 py-8 text-center">
        <p className="text-xs text-gray-500">
          Ritual Black Box · a forensic flight recorder for Ritual-native agents. Testnet only · RITUAL has no real
          value.
        </p>
      </footer>
    </div>
  );
}
