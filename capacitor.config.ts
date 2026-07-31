import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medipost.ai',
  appName: 'Medipost AI',
  webDir: 'dist',
  server: {
    url: 'https://medipost-ai-studio.vercel.app',
    cleartext: false,
  },
};

export default config;