import { createPublicClient, http, defineChain, type PublicClient } from 'viem';

// ============================================================================
// Ritual Chain (testnet) configuration — chain ID 1979.
// Source of truth: ritual-dapp-deploy / ritual-dapp-overview skills.
// ============================================================================

export const RITUAL_RPC_URL =
  import.meta.env.VITE_RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org';

export const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'Ritual', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: {
      http: [RITUAL_RPC_URL],
      webSocket: ['wss://rpc.ritualfoundation.org/ws'],
    },
  },
  blockExplorers: {
    default: { name: 'Ritual Explorer', url: 'https://explorer.ritualfoundation.org' },
  },
});

/** Core Ritual system contracts. These addresses are stable across deployments. */
export const SYSTEM_CONTRACTS = {
  RITUAL_WALLET: '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948',
  ASYNC_JOB_TRACKER: '0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5',
  TEE_SERVICE_REGISTRY: '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F',
  SCHEDULER: '0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B',
  SECRETS_ACCESS_CONTROL: '0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD',
  ASYNC_DELIVERY: '0x5A16214fF555848411544b005f7Ac063742f39F6',
  MODEL_PRICING_REGISTRY: '0x7A85F48b971ceBb75491b61abe279728F4c4384f',
} as const;

export const PRECOMPILES: Record<string, { name: string; address: string; model: string }> = {
  '0x0000000000000000000000000000000000000800': { name: 'ONNX', address: '0x0800', model: 'sync' },
  '0x0000000000000000000000000000000000000801': { name: 'HTTP', address: '0x0801', model: 'async-short' },
  '0x0000000000000000000000000000000000000802': { name: 'LLM', address: '0x0802', model: 'async-short' },
  '0x0000000000000000000000000000000000000803': { name: 'JQ', address: '0x0803', model: 'sync' },
  '0x0000000000000000000000000000000000000805': { name: 'Long HTTP', address: '0x0805', model: 'async-long' },
  '0x0000000000000000000000000000000000000806': { name: 'ZK', address: '0x0806', model: 'async-long' },
  '0x000000000000000000000000000000000000080c': { name: 'Sovereign Agent', address: '0x080C', model: 'async-long' },
  '0x0000000000000000000000000000000000000818': { name: 'Image', address: '0x0818', model: 'async-long' },
  '0x0000000000000000000000000000000000000819': { name: 'Audio', address: '0x0819', model: 'async-long' },
  '0x000000000000000000000000000000000000081a': { name: 'Video', address: '0x081A', model: 'async-long' },
  '0x0000000000000000000000000000000000000820': { name: 'Persistent Agent', address: '0x0820', model: 'async-long' },
};

let _client: PublicClient | null = null;

/** Lazily-created read-only client for Ritual Chain. */
export function getPublicClient(): PublicClient {
  if (!_client) {
    _client = createPublicClient({ chain: ritualChain, transport: http(RITUAL_RPC_URL) });
  }
  return _client;
}

/** Truncate a hex address for display: 0x1234...5678 */
export function shortAddr(addr?: string): string {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

export const EXPLORER_URL = 'https://explorer.ritualfoundation.org';

export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}
export function explorerAddr(addr: string): string {
  return `${EXPLORER_URL}/address/${addr}`;
}
