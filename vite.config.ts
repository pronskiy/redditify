import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// Create separate configs for ES and UMD builds
export default defineConfig(({ command, mode }) => {
  // Base configuration shared between builds
  const baseConfig = {
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
    }
  };

  // For ES module build - can have multiple entry points
  if (mode === 'es') {
    return {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        lib: {
          entry: {
            index: resolve(__dirname, 'src/index.ts'),
            'redditify': resolve(__dirname, 'src/auto-embed.ts')
          },
          formats: ['es'],
          fileName: (format, entryName) => `${entryName}.${format}.js`
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      }
    };
  }
  
  // For UMD build - single entry point only
  return {
    ...baseConfig,
    build: {
      ...baseConfig.build,
      lib: {
        entry: resolve(__dirname, 'src/auto-embed.ts'),
        formats: ['umd'],
        name: 'RedditThreadViewer',
        fileName: () => 'redditify.umd.js'
      },
      rollupOptions: {
        // Don't mark React as external for UMD build
        external: [],
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
  };
});
