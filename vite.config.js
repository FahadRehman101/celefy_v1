// 🚨 COMPLETE FIXED vite.config.js - Copy this entire file
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  // CRITICAL FIX: Build optimization to prevent initialization errors
  build: {
    // Increase chunk size limit to prevent over-splitting
    chunkSizeWarningLimit: 1000,
    
    // CRITICAL: Configure rollup options to fix initialization order
    rollupOptions: {
      output: {
        // CRITICAL: Manual chunk splitting to control load order
        manualChunks: {
          // React and core libraries - load first
          'react-vendor': ['react', 'react-dom'],
          
          // Firebase - load second
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // UI components - load third
          'ui-vendor': ['lucide-react']
        },
        
        // CRITICAL: Ensure proper module format
        format: 'es',
        
        // CRITICAL: Add proper exports to prevent undefined references
        exports: 'named'
      }
    },
    
    // CRITICAL: Enable source maps for debugging
    sourcemap: true,
    
    // CRITICAL: Ensure proper target for modern browsers
    target: 'es2020',
    
    // CRITICAL: Minification settings to prevent variable hoisting issues
    minify: 'terser',
    terserOptions: {
      compress: {
        // CRITICAL: Don't remove unused variables that might be needed for hoisting
        unused: false,
        // CRITICAL: Don't remove dead code that might be initialization code
        dead_code: false,
        // Don't drop console statements for debugging
        drop_console: false
      },
      mangle: {
        // CRITICAL: Prevent mangling of critical variables
        reserved: ['OneSignal', 'firebase', 'auth', 'firestore', 'React', 'ReactDOM']
      }
    }
  },
  
  // CRITICAL: Development server configuration
  server: {
    port: 3000,
    open: true,
    // Allow OneSignal to work in development
    https: false,
    hmr: {
      overlay: false // Prevent HMR overlay from interfering
    }
  },
  
      // CRITICAL: Define global variables safely
    define: {
      // Ensure process.env is available
      'process.env': {},
      // Define NODE_ENV
      'process.env.NODE_ENV': JSON.stringify('development')
    },
  
  // CRITICAL: Optimize dependencies to prevent circular imports
  optimizeDeps: {
    // Include all dependencies that need pre-bundling
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/auth', 
      'firebase/firestore',
      'lucide-react'
    ],
    
    // Exclude problematic dependencies from pre-bundling
    exclude: []
  },
  
  // CRITICAL: ESBuild configuration
  esbuild: {
    // Keep function names for better error messages
    keepNames: true,
    
    // Don't drop labels that might be needed
    drop: []
  }
})