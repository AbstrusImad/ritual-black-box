import { useEffect } from 'react';
import { Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { useStore } from './store/useStore';

import { Landing } from './pages/Landing';
import { AnalyzeChamber } from './pages/AnalyzeChamber';
import { FlightRecorder } from './pages/FlightRecorder';
import { FailureAutopsy } from './pages/FailureAutopsy';
import { SignalMap } from './pages/SignalMap';
import { FixConsole } from './pages/FixConsole';
import { IntegrationKit } from './pages/IntegrationKit';
import { EvidenceVault } from './pages/EvidenceVault';
import { SkillPage } from './pages/SkillPage';

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

// Application shell (sidebar + topbar). Requires a connected wallet — if none,
// bounce back to the landing page where the user connects to enter.
function AppLayout() {
  const { isConnected } = useAccount();
  const location = useLocation();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-5 py-7 md:px-8">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default function App() {
  const loadVault = useStore((s) => s.loadVault);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<AnalyzeChamber />} />
        <Route path="recorder" element={<FlightRecorder />} />
        <Route path="autopsy" element={<FailureAutopsy />} />
        <Route path="map" element={<SignalMap />} />
        <Route path="fix" element={<FixConsole />} />
        <Route path="kit" element={<IntegrationKit />} />
        <Route path="skill" element={<SkillPage />} />
        <Route path="vault" element={<EvidenceVault />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
