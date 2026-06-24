import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ritualChain, RITUAL_RPC_URL } from './ritual';

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  connectors: [injected()],
  transports: {
    [ritualChain.id]: http(RITUAL_RPC_URL),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
