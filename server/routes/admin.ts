import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['admin']));

// GET /api/admin/users
adminRouter.get('/users', async (req: AuthRequest, res) => {
  try {
    const { query } = req.query;
    let users = await db.getAllUsers();

    if (query && typeof query === 'string') {
      const q = query.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.preferredRole && u.preferredRole.toLowerCase().includes(q))
      );
    }

    const safeUsers = users.map((u) => ({
      id: u.id || u._id,
      fullName: u.fullName,
      email: u.email,
      preferredRole: u.preferredRole,
      role: u.role,
      isBlocked: !!u.isBlocked,
      createdAt: u.createdAt,
    }));

    return res.json({ users: safeUsers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['candidate', 'interviewer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const updated = await db.updateUser(id, { role });
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      message: `User role updated to ${role}`,
      user: {
        id: updated.id || updated._id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// PATCH /api/admin/users/:id/block
adminRouter.patch('/users/:id/block', async (req: AuthRequest, res) => {
  try {
    const { isBlocked } = req.body;
    const { id } = req.params;

    const updated = await db.updateUser(id, { isBlocked: !!isBlocked });
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      message: `User account ${isBlocked ? 'suspended' : 'reactivated'} successfully`,
      isBlocked: updated.isBlocked,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// GET /api/admin/interviews
adminRouter.get('/interviews', async (req: AuthRequest, res) => {
  try {
    const [classic, scheduled] = await Promise.all([
      db.getAllInterviews(),
      db.getAllScheduledInterviews(),
    ]);
    return res.json({
      aiInterviews: classic,
      scheduledInterviews: scheduled,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch platform interviews.' });
  }
});

// GET /api/admin/reports
adminRouter.get('/reports', async (req: AuthRequest, res) => {
  try {
    const reports = await db.getAllReports();
    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch platform reports.' });
  }
});

// GET /api/admin/stats
adminRouter.get('/stats', async (req: AuthRequest, res) => {
  try {
    const stats = await db.getPlatformStats();
    return res.json({ stats });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to calculate platform statistics.' });
  }
});
