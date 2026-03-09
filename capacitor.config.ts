import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nikituttofare.techapp',
  appName: 'NikiTuttoFare',
  webDir: 'public',
  server: {
    url: 'https://www.nikituttofare.com/technician/dashboard',
    cleartext: true
  }
};

export default config;
