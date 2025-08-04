import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// Create separate configs for ES and UMD builds
export default defineConfig(({ command, mode }) => {
  // Base configuration shared between builds
  const baseConfig = {
    plugins: [
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
            index: resolve(__dirname, 'src/vanilla/index.js'),
            'redditify': resolve(__dirname, 'src/vanilla/auto-embed.js')
          },
          formats: ['es'],
          fileName: (format, entryName) => `${entryName}.${format}.js`
        },
        rollupOptions: {
          external: ['date-fns'],
          output: {
            globals: {
              'date-fns': 'dateFns'
            }
          }
        }
      }
    };
  }
  
  // For UMD build - single entry point only
  return {
    ...baseConfig,
    define: {
      // Replace process.env.NODE_ENV with actual values for browser usage
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      ...baseConfig.build,
      lib: {
        entry: resolve(__dirname, 'src/vanilla/auto-embed.js'),
        formats: ['umd'],
        name: 'RedditThreadViewer',
        fileName: () => 'redditify.min.js'
      },
      rollupOptions: {
        // Mark date-fns as external for UMD build
        external: ['date-fns'],
        output: {
          globals: {
            'date-fns': 'dateFns'
          },
          // Generate a standalone bundle with everything included
          manualChunks: undefined
        }
      }
    }
  };
});
