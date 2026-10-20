import { Router } from 'express';
import { getIceServers } from '../webrtc.js';

export const webrtcRouter = Router();

// GET /api/webrtc/config
webrtcRouter.get('/config', (req, res) => {
  const config = getIceServers();
  return res.json({
    iceServers: config.iceServers,
    turnEnabled: config.turnEnabled,
    reason: config.reason,
  });
});

// GET /api/webrtc/ice-servers
webrtcRouter.get('/ice-servers', (req, res) => {
  const config = getIceServers();
  return res.json({
    iceServers: config.iceServers,
    turnEnabled: config.turnEnabled,
  });
});
