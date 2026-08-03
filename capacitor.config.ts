import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medipost.ai',
  appName: 'Medipost AI',
  webDir: 'dist',
  server: {
    url: 'https://www.medipostai.com',
    cleartext: false,
  },
};

export default config;