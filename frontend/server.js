// server.js
// Basic Node.js Express server to proxy API requests and serve static frontend build

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import cors from 'cors'; // Import the cors middleware

// Emulate __dirname in ES module scope
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3000; // Port for this proxy server to run on
const API_TARGET_URL = process.env.API_TARGET_URL || 'https://coe558-gateway-42vndeds.uc.gateway.dev';
const STATIC_FILES_PATH = path.join(__dirname, 'dist');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// --- Middleware ---

// Enable CORS for requests originating from your frontend domain
app.use(cors({
  origin: FRONTEND_URL, 
  credentials: true, 
}));

// Proxy middleware for API requests

app.use('/api', createProxyMiddleware({
  target: API_TARGET_URL,
  changeOrigin: true, // Needed for virtual hosted sites
  pathRewrite: {
    '^/api': '', // Remove '/api' prefix when forwarding to the target
  },
  onProxyReq: (proxyReq, req, res) => {

    
    console.log(`[Proxy] Forwarding request: ${req.method} ${req.originalUrl} -> ${API_TARGET_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Received response: ${proxyRes.statusCode} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end('Proxy Error: Something went wrong.');
  },
  logLevel: 'debug', // Optional: for detailed proxy logs
}));

// Serve static files from the React build directory
app.use(express.static(STATIC_FILES_PATH));

// --- Catch-all Route ---
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(STATIC_FILES_PATH, 'index.html'), (err) => {
    if (err) {
      console.error(`[Static] Error sending index.html: ${err.message}`);
      res.status(500).send(err);
    }
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Proxying API requests from /api to ${API_TARGET_URL}`);
  console.log(`Serving static files from ${STATIC_FILES_PATH}`);
  console.log(`Accepting CORS requests from ${FRONTEND_URL}`);
});
