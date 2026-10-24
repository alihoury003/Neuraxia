import { defineConfig } from 'vite';
import { createReadStream, existsSync, statSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BP3D_OUTPUT = resolve(here, '..', 'research', 'sprint-1b', 'output');
const BP3D_FILES = [
  'neuraxia-bp3d-cns-desktop.meshopt.glb',
  'neuraxia-bp3d-cns-mobile.meshopt.glb',
];

/**
 * Serve the canonical Sprint 1B GLBs directly from research/sprint-1b/output.
 * (Symlinks in public/ did not survive workspace snapshots; copying would
 * duplicate ~3.8 MB of persisted payload. This plugin is the durable fix.)
 */
function bp3dModelsPlugin() {
  const serve = (req, res, next) => {
    const name = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/models\//, '');
    if (!BP3D_FILES.includes(name)) return next();
    const file = resolve(BP3D_OUTPUT, name);
    if (!existsSync(file)) return next();
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Length', String(statSync(file).size));
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  };
  return {
    name: 'neuraxia-bp3d-models',
    configureServer(server) { server.middlewares.use(serve); },
    configurePreviewServer(server) { server.middlewares.use(serve); },
    closeBundle() {
      const outDir = resolve(here, 'dist', 'models');
      mkdirSync(outDir, { recursive: true });
      for (const name of BP3D_FILES) {
        const src = resolve(BP3D_OUTPUT, name);
        if (existsSync(src)) copyFileSync(src, resolve(outDir, name));
      }
    },
  };
}

export default defineConfig({
  // GitHub Pages project sites live under /<repo>/ — the deploy workflow
  // sets VITE_BASE accordingly. Local dev stays at '/'.
  base: process.env.VITE_BASE || '/',
  plugins: [bp3dModelsPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  }
});
