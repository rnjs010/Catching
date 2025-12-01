import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, ".env") });

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: [], //'@wxt-dev/module-react'],
  manifest: {
    icons: {
      16: "icon/icon16.png",
      32: "icon/icon32.png",
      48: "icon/icon48.png",
      96: "icon/icon96.png",
      128: "icon/icon128.png",
    },
    permissions: [
      "activeTab",
      "storage",
      "tabs",
      "scripting",
      "sidePanel",
      "identity",
    ],
    action: {
      default_icon: {
        32: "icon/icon32.png",
        48: "icon/icon48.png",
        96: "icon/icon96.png",
        128: "icon/icon128.png",
      },
      default_title: "Cat-ching",
    },
    name: "Cat-ching",
    description: "AI 기반 취업 준비 지원 서비스",
    version: "0.0.1",
    host_permissions: ["https://*/*"],
    oauth2: {
      client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
      scopes: ["openid", "email", "profile"],
    },
    key: process.env.VITE_CHROME_EXTENSION_KEY,
  },
  vite: () => ({
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-macros", "babel-plugin-styled-components"],
        },
      }),
    ],
  }),
});
