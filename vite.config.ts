
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We load all variables (third param '') so we can find GEMINI_API_KEY without the VITE_ prefix if needed.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This shim ensures process.env.API_KEY is accessible globally in the browser,
      // satisfying the @google/genai SDK requirement while resolving Vite ReferenceErrors.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
    },
  };
});
