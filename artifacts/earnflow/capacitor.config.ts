import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dphms.bringwar',
  appName: 'BRINGWAR Gaming Rewards',
  webDir: 'dist',
  server: {
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
