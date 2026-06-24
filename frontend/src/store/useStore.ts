import { create } from 'zustand';
import type { ContractAnalysis, AnalysisMode } from '@/types';
import { analyze, type EngineMode } from '@/lib/engine';

const VAULT_KEY = 'ritual-blackbox-vault-v1';

export interface VaultEntry {
  id: string;
  address: string;
  label: string;
  createdAt: number;
  mode: AnalysisMode;
  riskValue: number;
  notes: string;
  starredEventIds: string[];
  analysis: ContractAnalysis;
}

interface AppState {
  // analysis lifecycle
  current: ContractAnalysis | null;
  scanning: boolean;
  scanStepIndex: number;
  error: string | null;
  abiText: string;

  // vault
  vault: VaultEntry[];

  // command palette
  paletteOpen: boolean;

  // actions
  setAbiText: (s: string) => void;
  startAnalysis: (address: string, mode: EngineMode) => Promise<void>;
  setScanStep: (i: number) => void;
  clearCurrent: () => void;
  setPaletteOpen: (b: boolean) => void;

  // vault actions
  loadVault: () => void;
  saveCurrentToVault: (label?: string) => void;
  deleteVaultEntry: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  toggleStar: (eventId: string) => void;
}

function persistVault(vault: VaultEntry[]) {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch {
    /* storage may be unavailable */
  }
}

export const useStore = create<AppState>((set, get) => ({
  current: null,
  scanning: false,
  scanStepIndex: 0,
  error: null,
  abiText: '',
  vault: [],
  paletteOpen: false,

  setAbiText: (s) => set({ abiText: s }),

  startAnalysis: async (address, mode) => {
    // Demo mode resolves synchronously — load it instantly with no scanning
    // phase so the gallery/cards don't flash (no current=null flicker).
    if (mode === 'demo') {
      const result = await analyze(address, mode, get().abiText);
      set({ current: result, scanning: false, error: null });
      return;
    }

    set({ scanning: true, error: null, scanStepIndex: 0, current: null });
    try {
      // Run the analysis and the cinematic scan in parallel; the UI advances
      // scanStepIndex on a timer, we just await the data.
      const result = await analyze(address, mode, get().abiText);
      set({ current: result, scanning: false });
    } catch (e) {
      set({
        scanning: false,
        error: e instanceof Error ? e.message : 'Analysis failed. The RPC may be unreachable — try Demo Mode.',
      });
    }
  },

  setScanStep: (i) => set({ scanStepIndex: i }),
  clearCurrent: () => set({ current: null, error: null }),
  setPaletteOpen: (b) => set({ paletteOpen: b }),

  loadVault: () => {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) set({ vault: JSON.parse(raw) as VaultEntry[] });
    } catch {
      /* ignore */
    }
  },

  saveCurrentToVault: (label) => {
    const { current, vault } = get();
    if (!current) return;
    const entry: VaultEntry = {
      id: `${current.identity.address.toLowerCase()}-${current.createdAt}`,
      address: current.identity.address,
      label: label || current.identity.classification,
      createdAt: current.createdAt,
      mode: current.mode,
      riskValue: current.risk.value,
      notes: current.notes ?? '',
      starredEventIds: current.starredEventIds ?? [],
      analysis: current,
    };
    const next = [entry, ...vault.filter((v) => v.id !== entry.id)].slice(0, 50);
    persistVault(next);
    set({ vault: next });
  },

  deleteVaultEntry: (id) => {
    const next = get().vault.filter((v) => v.id !== id);
    persistVault(next);
    set({ vault: next });
  },

  updateNotes: (id, notes) => {
    const next = get().vault.map((v) => (v.id === id ? { ...v, notes } : v));
    persistVault(next);
    set({ vault: next });
  },

  toggleStar: (eventId) => {
    const { current } = get();
    if (!current) return;
    const starred = new Set(current.starredEventIds ?? []);
    if (starred.has(eventId)) starred.delete(eventId);
    else starred.add(eventId);
    set({ current: { ...current, starredEventIds: Array.from(starred) } });
  },
}));
