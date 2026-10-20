import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { initSocketServer } from './server/socket.js';
import { authRouter } from './server/routes/auth.js';
import { interviewsRouter } from './server/routes/interviews.js';
import { scheduledRouter } from './server/routes/scheduled.js';
import { resumeRouter } from './server/routes/resume.js';
import { roadmapRouter } from './server/routes/roadmap.js';
import { videoRouter } from './server/routes/video.js';
import { usersRouter } from './server/routes/users.js';
import { adminRouter } from './server/routes/admin.js';
import { webrtcRouter } from './server/routes/webrtc.js';
import { avatarInterviewsRouter } from './server/routes/avatarInterviews.js';
import { getIceServers } from './server/webrtc.js';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB
  await initDatabase();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Attach Socket.IO for WebRTC signaling
  initSocketServer(server);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'ok',
      service: 'Interview.ai',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/scheduled-interviews', scheduledRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/roadmap', roadmapRouter);
  app.use('/api/video', videoRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/webrtc', webrtcRouter);
  app.use('/api/avatar-interviews', avatarInterviewsRouter);

  // Direct alias for ice-servers
  app.get('/api/ice-servers', (req, res) => {
    const config = getIceServers();
    res.json({ iceServers: config.iceServers, turnEnabled: config.turnEnabled });
  });

  // API 404 Handler - prevent fallback to index.html for missing API endpoints
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Locate production build dist folder across standard deployment environments
    const candidateDirs = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname, '../dist'),
      path.resolve(__dirname, '.'),
      process.cwd(),
    ];
    let distPath = path.resolve(process.cwd(), 'dist');
    for (const dir of candidateDirs) {
      if (fs.existsSync(path.join(dir, 'index.html'))) {
        distPath = dir;
        break;
      }
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Interview.ai server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
