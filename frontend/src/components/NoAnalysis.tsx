import { useNavigate } from 'react-router-dom';
import { EmptyState, Button } from './ui/primitives';
import { useStore } from '@/store/useStore';
import { DEFAULT_DEMO } from '@/lib/demoData';

/** Shown on any analysis page when no subject is loaded yet. */
export function NoAnalysis({ area }: { area: string }) {
  const navigate = useNavigate();
  const startAnalysis = useStore((s) => s.startAnalysis);

  return (
    <EmptyState
      icon="◌"
      title={`No subject loaded`}
      body={`${area} reconstructs the on-chain story of a contract. Insert a contract address in the Analyze Chamber, or load a demo to see how it works.`}
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/app')}>
            Open Analyze Chamber
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void startAnalysis(DEFAULT_DEMO.identity.address, 'demo');
            }}
          >
            Load demo subject
          </Button>
        </div>
      }
    />
  );
}
