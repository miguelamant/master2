import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodbase.app',
  appName: 'foodbase',
  webDir: 'build',
  // Quick-win: load the live site instead of the bundled build. The webview
  // origin then BECOMES the backend origin, so the express-session cookie is
  // first-party again and login works (no cross-site cookie fight). The
  // Capacitor bridge is still injected, so native plugins (camera, etc.) keep
  // working. webDir/build stays as the fallback bundle.
  server: {
    url: 'https://master2-1-xm2m.onrender.com/join',
    cleartext: false,
  },
};

export default config;
