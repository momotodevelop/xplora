import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs'; // Asegúrate de que esta importación exista

import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  // Ajusta esta línea si tu index.server.html no está en serverDistFolder
  // O si prefieres usar el index.html del navegador
  const indexHtml = join(serverDistFolder, 'index.server.html'); 

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml, // Asegúrate de que esta ruta sea correcta para tu index.html
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

// --- ¡ESTE ES EL CAMBIO CRÍTICO! ---
// Esta parte del código asegura que el servidor Express solo se inicie y escuche en un puerto
// si NO se está ejecutando en un entorno de Firebase Functions o Cloud Run.
// Si está en uno de esos entornos (ej. 'FUNCTION_TARGET' o 'K_SERVICE' están definidos),
// la llamada a 'run()' (y 'server.listen()') se omite.
function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Condición para ejecutar `run()` solo en entorno local (no en Firebase Functions/Cloud Run)
if (!process.env['FUNCTION_TARGET'] && !process.env['K_SERVICE']) {
  run();
}