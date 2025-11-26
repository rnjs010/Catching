import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    icons: {
      16: 'icon/icon16.png',
      32: 'icon/icon32.png',
      48: 'icon/icon48.png',
      96: 'icon/icon96.png',
      128: 'icon/icon128.png',
    },
    permissions: ['activeTab', 'storage', 'tabs', 'scripting', 'sidePanel'],
    action: {
      default_icon: {
        32: 'icon/icon32.png',
        48: 'icon/icon48.png',
        96: 'icon/icon96.png',
        128: 'icon/icon128.png',
      },
      default_title: 'Cat-ching',
    },
    name: 'Cat-ching',
    description: 'AI 기반 취업 준비 지원 서비스',
    version: '1.0.0',
    host_permissions: ['https://*/*'],
  },
  vite: () => ({
    plugins: [
      react({
        babel: {
          plugins: [
            'babel-plugin-macros',
            'babel-plugin-styled-components',
          ],
        },
      })
    ],
  }),
});
