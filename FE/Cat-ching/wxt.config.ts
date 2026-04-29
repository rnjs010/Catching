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
      default_title: "Cat-ching: AI 기업 분석 & 직무 산업 동향 리서치",
    },
    name: "Cat-ching",
    description: "AI 기업 분석 & 직무 산업 동향 리서치",
    version: "0.1.0",
    host_permissions: ["<all_urls>"],
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
