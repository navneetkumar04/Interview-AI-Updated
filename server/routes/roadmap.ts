import { Router } from 'express';
import { db } from '../db.js';
import { aiService } from '../ai.js';
import { authenticateToken, AuthRequest } from '../auth.js';
import { normalizeRoadmapData } from '../roadmapNormalizer.js';

export const roadmapRouter = Router();

// POST /api/roadmap/generate
roadmapRouter.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobRole, durationMonths, targetLevel } = req.body;

    if (!jobRole || typeof jobRole !== 'string' || !jobRole.trim()) {
      return res.status(400).json({ error: 'Job role is required.' });
    }

    let cleanDuration: number;
    if (durationMonths === undefined || durationMonths === null) {
      if (targetLevel) {
        cleanDuration = 3; // Graceful fallback for legacy clients
      } else {
        return res.status(400).json({
          error: 'Duration is required. Please specify durationMonths as an integer between 1 and 6.',
        });
      }
    } else {
      const parsed = Number(durationMonths);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 6) {
        return res.status(400).json({
          error: 'Invalid duration. Preparation time must be an integer between 1 and 6 months.',
        });
      }
      cleanDuration = parsed;
    }

    const candidateId = req.user!.id;
    const cleanRole = jobRole.trim();

    // Generate roadmap via AI service
    const rawRoadmap = await aiService.generateCareerRoadmap(cleanRole, cleanDuration);

    // Defensive validation & normalization matching Mongoose schema
    const normalizedData = normalizeRoadmapData(rawRoadmap, cleanRole, cleanDuration);

    // Persist normalized document
    const saved = await db.createRoadmap({
      candidateId,
      ...normalizedData,
    });

    return res.json({ roadmap: saved });
  } catch (err: any) {
    console.error('Roadmap generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate career roadmap.',
      details: err?.message || 'Server error during roadmap processing.',
    });
  }
});

// GET /api/roadmap/my-roadmaps
roadmapRouter.get('/my-roadmaps', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getRoadmapsByCandidate(req.user!.id);
    return res.json({ roadmaps: list });
  } catch (err: any) {
    console.error('Fetch roadmaps error:', err);
    return res.status(500).json({ error: 'Failed to fetch roadmaps.' });
  }
});

// GET /api/roadmap/:id
roadmapRouter.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const roadmap = await db.findRoadmapById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }
    const isOwner = String(roadmap.candidateId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to view this roadmap.' });
    }
    return res.json({ roadmap });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch roadmap.' });
  }
});

// POST /api/roadmap/:id/toggle-task
roadmapRouter.post('/:id/toggle-task', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Valid taskId is required.' });
    }

    const roadmap = await db.findRoadmapById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const isOwner = String(roadmap.candidateId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to modify this roadmap.' });
    }

    const currentTasks: string[] = roadmap.completedTasks || [];
    const exists = currentTasks.includes(taskId);
    const updatedTasks = exists
      ? currentTasks.filter((t: string) => t !== taskId)
      : [...currentTasks, taskId];

    const updated = await db.updateRoadmap(req.params.id, { completedTasks: updatedTasks });
    return res.json({
      message: exists ? 'Task marked incomplete.' : 'Task marked complete.',
      completedTasks: updatedTasks,
      roadmap: updated,
    });
  } catch (err: any) {
    console.error('Toggle roadmap task error:', err);
    return res.status(500).json({ error: 'Failed to update task progress.' });
  }
});
