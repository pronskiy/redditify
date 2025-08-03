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
        'redditify': resolve(__dirname, 'src/auto-embed.ts')
      },
      formats: ['es', 'umd'],
      name: 'RedditThreadViewer',
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      // For the main library entry point, keep React as external
      // For the auto-embed bundle, include React and ReactDOM
      external: (id, parentId) => {
        if (parentId && parentId.includes('auto-embed')) {
          // Don't mark React as external for auto-embed
          return false;
        }
        
        // For the main library, React is still external
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
        // Generate a standalone bundle with everything included
        manualChunks: undefined
      }
    }
  }
});
