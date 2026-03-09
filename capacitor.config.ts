import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.nikituttofare.techapp',
  appName: 'NikiTuttoFare',
  webDir: 'public',
  server: {
    url: 'https://www.nikituttofare.com/technician/dashboard',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.None,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#131314",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
