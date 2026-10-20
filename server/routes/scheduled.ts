import { Router } from 'express';
import { db } from '../db.js';
import { aiService } from '../ai.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

export const scheduledRouter = Router();

// Helper to check user authorization on an interview
function checkInterviewAccess(interview: any, user: any) {
  const userEmail = (user.email || '').trim().toLowerCase();
  const candEmail = (interview.candidateEmail || '').trim().toLowerCase();
  const isCandidate =
    Boolean(interview.candidateId && String(interview.candidateId) === String(user.id)) ||
    Boolean(candEmail && userEmail && candEmail === userEmail);
  const isInterviewer = String(interview.interviewerId) === String(user.id);
  const isAdmin = user.role === 'admin';
  return {
    isCandidate,
    isInterviewer,
    isAdmin,
    hasAccess: isCandidate || isInterviewer || isAdmin,
  };
}

// POST /api/scheduled-interviews - Schedule interview (Interviewer or Admin)
scheduledRouter.post(
  '/',
  authenticateToken,
  requireRole(['interviewer', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const {
        candidateId,
        candidateEmail,
        candidateName,
        jobRole,
        interviewType,
        scheduledAt,
        duration,
      } = req.body;

      if (!jobRole || !String(jobRole).trim()) {
        return res.status(400).json({ error: 'Target job role is required.' });
      }

      let targetCandidate: any = null;
      let targetEmail = '';
      let targetName = '';
      let targetId: any = null;

      // 1. Resolve candidate if candidateId provided
      if (candidateId) {
        targetCandidate = await db.findUserById(candidateId);
      }

      // 2. Resolve candidate by email if provided
      if (!targetCandidate && candidateEmail) {
        const emailStr = String(candidateEmail).trim().toLowerCase();
        targetCandidate = await db.findUserByEmail(emailStr);
      }

      if (targetCandidate) {
        targetId = targetCandidate.id || targetCandidate._id;
        targetEmail = String(targetCandidate.email).toLowerCase().trim();
        targetName = targetCandidate.fullName;
      } else if (candidateEmail) {
        // Candidate not yet registered: validate email format for invitation workflow
        const emailStr = String(candidateEmail).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          return res.status(400).json({
            error: 'Please enter a valid candidate email address (e.g. candidate@gmail.com).',
          });
        }
        targetEmail = emailStr;
        targetName = candidateName ? String(candidateName).trim() : emailStr.split('@')[0];
        targetId = null; // Associated upon candidate sign-up or sign-in
      } else {
        return res.status(400).json({
          error: 'Please select a registered candidate or provide a candidate verified email address.',
        });
      }

      // Generate clean unique roomId and unique meeting room identifier
      const typeSlug = (interviewType || 'tech').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const uniqueSuffix =
        Date.now().toString(36).slice(-4) + Math.random().toString(36).substring(2, 6);
      let roomId = `room-${typeSlug}-${randomCode}-${uniqueSuffix}`;
      const existing = await db.findScheduledInterviewByRoomId(roomId);
      if (existing) {
        roomId = `room-${typeSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      }

      const safeRole = String(jobRole).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'Tech';
      const meetingRoomName = `Interview_ai_${safeRole}_${randomCode}_${uniqueSuffix}`;
      const meetingUrl = `https://meet.jit.si/${meetingRoomName}`;

      const parsedDate = scheduledAt ? new Date(scheduledAt) : new Date();
      const safeScheduledAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const newInterview = await db.createScheduledInterview({
        roomId,
        interviewerId: req.user!.id,
        interviewerName: req.user!.fullName,
        candidateId: targetId,
        candidateName: targetName,
        candidateEmail: targetEmail,
        jobRole: String(jobRole).trim(),
        interviewType: interviewType || 'Technical',
        mode: 'human',
        scheduledAt: safeScheduledAt,
        duration: Number(duration) || 30,
        status: 'scheduled',
        meetingProvider: 'jitsi',
        meetingRoomName,
        meetingUrl,
        notes: '',
        transcript: [],
      });

      return res.status(201).json({
        message: 'Interview scheduled successfully',
        interview: newInterview,
      });
    } catch (err: any) {
      console.error('Error scheduling interview:', err);
      return res.status(500).json({ error: 'Failed to schedule interview.' });
    }
  }
);

// GET /api/scheduled-interviews - List scheduled interviews for current user (Strict server-side privacy filter)
scheduledRouter.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getScheduledInterviewsForUser(
      req.user!.id,
      req.user!.role,
      req.user!.email
    );
    return res.json({ scheduledInterviews: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch scheduled interviews.' });
  }
});

// GET /api/scheduled-interviews/:id - Single interview with strict authorization check
scheduledRouter.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Scheduled interview not found.' });
    }

    const { isCandidate, isInterviewer, isAdmin, hasAccess } = checkInterviewAccess(
      interview,
      req.user!
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied: You are not authorized to view this private interview.',
      });
    }

    // Auto-link candidate ID if interview was scheduled before candidate created account
    if (isCandidate && (!interview.candidateId || interview.candidateId !== req.user!.id)) {
      await db.updateScheduledInterview(interview.roomId, {
        candidateId: req.user!.id,
        candidateName: req.user!.fullName,
      });
      interview.candidateId = req.user!.id;
      interview.candidateName = req.user!.fullName;
    }

    // Ensure meeting identifiers exist
    if (!interview.meetingRoomName) {
      const safeRole =
        (interview.jobRole || 'Tech').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'Tech';
      const meetingRoomName = `Interview_ai_${safeRole}_${interview.roomId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      interview.meetingProvider = 'jitsi';
      interview.meetingRoomName = meetingRoomName;
      interview.meetingUrl = `https://meet.jit.si/${meetingRoomName}`;
      await db.updateScheduledInterview(interview.roomId, {
        meetingProvider: 'jitsi',
        meetingRoomName,
        meetingUrl: interview.meetingUrl,
      });
    }

    return res.json({ interview });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch interview details.' });
  }
});

// POST /api/scheduled-interviews/:id/join - Verify access before entering room
scheduledRouter.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Scheduled interview not found.' });
    }

    const { isCandidate, isInterviewer, isAdmin, hasAccess } = checkInterviewAccess(
      interview,
      req.user!
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied: Only assigned participants can enter this private interview room.',
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({ error: 'This interview has been cancelled by the host.' });
    }

    // Auto-link candidate account ID if previously pending
    if (isCandidate && (!interview.candidateId || interview.candidateId !== req.user!.id)) {
      await db.updateScheduledInterview(interview.roomId, {
        candidateId: req.user!.id,
        candidateName: req.user!.fullName,
      });
      interview.candidateId = req.user!.id;
      interview.candidateName = req.user!.fullName;
    }

    // Ensure meeting identifiers exist
    if (!interview.meetingRoomName) {
      const safeRole =
        (interview.jobRole || 'Tech').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'Tech';
      const meetingRoomName = `Interview_ai_${safeRole}_${interview.roomId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      interview.meetingProvider = 'jitsi';
      interview.meetingRoomName = meetingRoomName;
      interview.meetingUrl = `https://meet.jit.si/${meetingRoomName}`;
      await db.updateScheduledInterview(interview.roomId, {
        meetingProvider: 'jitsi',
        meetingRoomName,
        meetingUrl: interview.meetingUrl,
      });
    }

    // If scheduled or waiting, transition to in_progress
    if (interview.status === 'scheduled' || interview.status === 'waiting') {
      await db.updateScheduledInterview(interview.roomId, { status: 'in_progress' });
      interview.status = 'in_progress';
    }

    return res.json({
      canJoin: true,
      roleInInterview: isInterviewer ? 'interviewer' : isCandidate ? 'candidate' : 'admin_observer',
      interview,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to join interview room.' });
  }
});

// POST /api/scheduled-interviews/:id/start - Mark in_progress (Secured against IDOR)
scheduledRouter.post('/:id/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { hasAccess } = checkInterviewAccess(interview, req.user!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied: Unauthorized to start this interview.' });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot start a cancelled interview.' });
    }

    await db.updateScheduledInterview(interview.roomId, { status: 'in_progress' });
    return res.json({ status: 'in_progress' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to start interview.' });
  }
});

// POST /api/scheduled-interviews/:id/notes - Save interviewer live notes (Interviewer or Admin only)
scheduledRouter.post('/:id/notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { notes } = req.body;
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { isInterviewer, isAdmin } = checkInterviewAccess(interview, req.user!);
    if (!isInterviewer && !isAdmin) {
      return res.status(403).json({
        error: 'Only the assigned interviewer or administrator can save interview notes.',
      });
    }

    await db.updateScheduledInterview(interview.roomId, { notes: String(notes || '') });
    return res.json({ success: true, notes });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update interview notes.' });
  }
});

// POST /api/scheduled-interviews/:id/end - End interview and generate AI report
scheduledRouter.post('/:id/end', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { hasAccess } = checkInterviewAccess(interview, req.user!);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Only assigned participants or administrator can conclude this interview.',
      });
    }

    // Optional transcript and notes passed from client or retrieved from DB
    const finalTranscript = req.body.transcript || interview.transcript || [];
    const finalNotes =
      req.body.notes !== undefined ? req.body.notes : interview.notes || '';

    // Analyze transcript and interview notes with Gemini AI
    const reportData = await aiService.generateHumanInterviewReport({
      jobRole: interview.jobRole,
      interviewType: interview.interviewType,
      candidateName: interview.candidateName,
      interviewerName: interview.interviewerName,
      duration: interview.duration,
      notes: finalNotes,
      transcript: finalTranscript,
    });

    // Save report in database
    const report = await db.createReport({
      scheduledInterviewId: interview.id || interview._id,
      candidateId: interview.candidateId,
      candidateName: interview.candidateName,
      interviewerId: interview.interviewerId,
      interviewerName: interview.interviewerName,
      jobRole: interview.jobRole,
      overallScore: reportData.overallScore,
      technicalKnowledge: reportData.technicalKnowledge,
      communication: reportData.communication,
      problemSolving: reportData.problemSolving,
      confidence: reportData.confidence,
      clarity: reportData.clarity,
      eyeContact: 85,
      strengths: reportData.strengths,
      weaknesses: reportData.weaknesses,
      suggestions: reportData.suggestions,
      recommendedTopics: reportData.recommendedTopics,
      questionAnalysis: reportData.questionAnalysis,
      transcript: finalTranscript,
    });

    const reportId = report.id || report._id;

    // Update interview status, notes, transcript, and link report
    await db.updateScheduledInterview(interview.roomId, {
      status: 'completed',
      reportId,
      notes: finalNotes,
      transcript: finalTranscript,
    });

    return res.json({
      message: 'Interview completed and AI report generated successfully',
      reportId,
      report,
    });
  } catch (err: any) {
    console.error('Error ending interview:', err);
    return res.status(500).json({
      error: 'Failed to complete interview and generate report.',
      details: err?.message || String(err),
    });
  }
});

// POST /api/scheduled-interviews/:id/leave - Record participant leaving
scheduledRouter.post('/:id/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { hasAccess } = checkInterviewAccess(interview, req.user!);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied: You are not assigned to this interview.',
      });
    }

    return res.json({ success: true, status: interview.status });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record participant exit.' });
  }
});

// POST /api/scheduled-interviews/:id/cancel - Cancel interview (Interviewer or Admin only, IDOR protected)
scheduledRouter.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { isInterviewer, isAdmin } = checkInterviewAccess(interview, req.user!);
    if (!isInterviewer && !isAdmin) {
      return res.status(403).json({
        error: 'Only the assigned interviewer or platform administrator can cancel this interview.',
      });
    }

    await db.updateScheduledInterview(interview.roomId, { status: 'cancelled' });
    return res.json({ status: 'cancelled' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to cancel interview.' });
  }
});

// POST /api/scheduled-interviews/:id/transcript - Append live transcript snippet (Participants only)
scheduledRouter.post('/:id/transcript', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { item } = req.body;
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { hasAccess } = checkInterviewAccess(interview, req.user!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to submit transcript entries.' });
    }

    const transcript = interview.transcript || [];
    transcript.push(item);
    await db.updateScheduledInterview(interview.roomId, { transcript });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save transcript snippet.' });
  }
});

// GET /api/scheduled-interviews/:id/report - Access scorecard
scheduledRouter.get('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await db.findScheduledInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const { hasAccess } = checkInterviewAccess(interview, req.user!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this interview report.' });
    }

    if (!interview.reportId) {
      return res.status(404).json({ error: 'No report has been generated for this interview yet.' });
    }

    const report = await db.findReportById(interview.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json({ report });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve scheduled interview report.' });
  }
});
