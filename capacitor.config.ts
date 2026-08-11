import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yonge6.wendao",
  appName: "三慢问道",
  webDir: "dist/client",
  ios: {
    backgroundColor: "#f7f1e6",
    contentInset: "never",
    preferredContentMode: "mobile",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#f7f1e6",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "LIGHT",
    },
  },
};

export default config;
