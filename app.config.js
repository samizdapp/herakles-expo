import "dotenv/config";

export default {
  name: "Herakles",
  version: "1.0.0",
  slug: "pwa",
  owner: "samizdapp",
  extra: {
    devIP: process.env.DEV_IP || "setup.local",
  },
  ios: {
    bundleIdentifier: "herakles",
  },
};
