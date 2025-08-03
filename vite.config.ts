import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'] })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      // Build multiple entry points
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'reddit-embed': resolve(__dirname, 'src/auto-embed.ts')
      },
      formats: ['es', 'umd'],
      name: 'RedditThreadViewer',
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      // For the main library, keep React as external
      external: (id) => {
        // Only treat React and ReactDOM as external for the main library
        // Include them in the standalone bundle
        if (id === 'react' || id === 'react-dom') {
          return true;
        }
        return false;
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        // Generate a separate standalone bundle that includes React
        manualChunks: (id) => {
          if (id.includes('auto-embed')) {
            return 'reddit-embed';
          }
          return undefined;
        }
      }
    }
  }
});
