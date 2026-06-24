import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { useStore } from './store/useStore';

import { AnalyzeChamber } from './pages/AnalyzeChamber';
import { FlightRecorder } from './pages/FlightRecorder';
import { FailureAutopsy } from './pages/FailureAutopsy';
import { SignalMap } from './pages/SignalMap';
import { FixConsole } from './pages/FixConsole';
import { IntegrationKit } from './pages/IntegrationKit';
import { EvidenceVault } from './pages/EvidenceVault';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const loadVault = useStore((s) => s.loadVault);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-5 py-7 md:px-8">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><AnalyzeChamber /></PageTransition>} />
                <Route path="/recorder" element={<PageTransition><FlightRecorder /></PageTransition>} />
                <Route path="/autopsy" element={<PageTransition><FailureAutopsy /></PageTransition>} />
                <Route path="/map" element={<PageTransition><SignalMap /></PageTransition>} />
                <Route path="/fix" element={<PageTransition><FixConsole /></PageTransition>} />
                <Route path="/kit" element={<PageTransition><IntegrationKit /></PageTransition>} />
                <Route path="/vault" element={<PageTransition><EvidenceVault /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
