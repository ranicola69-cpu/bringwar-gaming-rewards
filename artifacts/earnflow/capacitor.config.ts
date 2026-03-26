import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dphms.bringwar',
  appName: 'BRINGWAR Gaming Rewards',
  webDir: 'dist/public',
  server: {
    url: 'https://arbitrage-autonomy.replit.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'bringwar.keystore',
      keystoreAlias: 'bringwar',
    }
  }
};

export default config;
