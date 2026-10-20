import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';

export const usersRouter = Router();

// GET /api/users/candidates - List candidates for interview scheduling
usersRouter.get('/candidates', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const candidates = await db.getCandidates();
    const safeList = candidates.map((c) => ({
      id: c.id || c._id,
      fullName: c.fullName,
      email: c.email,
      preferredRole: c.preferredRole,
      role: c.role,
      avatar: c.avatar,
    }));
    return res.json({ candidates: safeList });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch candidate list.' });
  }
});

// GET /api/users/interviewers - List interviewers
usersRouter.get('/interviewers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getInterviewers();
    const safeList = list.map((c) => ({
      id: c.id || c._id,
      fullName: c.fullName,
      email: c.email,
      preferredRole: c.preferredRole,
      role: c.role,
      avatar: c.avatar,
    }));
    return res.json({ interviewers: safeList });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch interviewers list.' });
  }
});
