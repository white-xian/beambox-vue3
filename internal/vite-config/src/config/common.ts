import UnoCSS from 'unocss/vite';
import { type UserConfig } from 'vite';

const commonConfig: (mode: string) => UserConfig = (mode) => ({
  server: {
    host: true,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // TODO: Prevent memory overflow
      maxParallelFileOps: 3,
    },
  },
  plugins: [
    UnoCSS({
      theme: {
        breakpoints: {
          xs: '320px',
          sm: '640px',
          md: '768px',
          lg: '960px',
          xl: '1100px',
          '2xl': '1536px',
        },
      },
    }),
  ],
});

export { commonConfig };
