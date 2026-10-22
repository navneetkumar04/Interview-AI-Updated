import { Router } from 'express';
import { db } from '../db.js';
import { aiService } from '../ai.js';
import { authenticateToken, AuthRequest } from '../auth.js';

export const interviewsRouter = Router();

// POST /api/interviews/generate-questions
interviewsRouter.post('/generate-questions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobRole, interviewerPersona, difficulty, mode = 'classic', count = 3 } = req.body;

    if (!jobRole) {
      return res.status(400).json({ error: 'Job role is required.' });
    }

    const questions = await aiService.generateInterviewQuestions(
      jobRole,
      interviewerPersona || 'Professional Tech Lead',
      difficulty || 'Mid-Level',
      mode,
      count
    );

    // Initialize an interview session in DB
    const interview = await db.createInterview({
      candidateId: req.user!.id,
      candidateName: req.user!.fullName,
      candidateEmail: req.user!.email,
      mode,
      jobRole,
      interviewerPersona: interviewerPersona || 'Professional Tech Lead',
      difficulty: difficulty || 'Mid-Level',
      status: 'in_progress',
      questions,
      answers: [],
    });

    return res.json({
      interviewId: interview.id || interview._id,
      questions,
    });
  } catch (err: any) {
    console.error('Error generating questions:', err);
    return res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
});

// POST /api/answers/analyze-video / analyze answer
interviewsRouter.post('/analyze-answer', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { question, answer, jobRole, difficulty } = req.body;
    const analysis = await aiService.evaluateAnswer(
      question,
      answer,
      jobRole || 'Full Stack Engineer',
      difficulty || 'Mid-Level'
    );
    return res.json(analysis);
  } catch (err: any) {
    console.error('Error analyzing answer:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer.' });
  }
});

// POST /api/interviews/next-question (AI Avatar Dynamic Follow-up)
interviewsRouter.post('/next-question', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { interviewId, role, difficulty, persona, history, currentQuestionIndex, totalQuestions } = req.body;

    const followUp = await aiService.generateFollowUpQuestion({
      role: role || 'Full Stack Engineer',
      difficulty: difficulty || 'Mid-Level',
      persona: persona || 'Senior Technical Hiring Manager',
      history: history || [],
      currentQuestionIndex: currentQuestionIndex || 1,
      totalQuestions: totalQuestions || 4,
    });

    if (interviewId) {
      const existing = await db.findInterviewById(interviewId);
      if (existing) {
        const isOwner = String(existing.candidateId) === String(req.user!.id);
        const isAdmin = req.user!.role === 'admin';
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ error: 'Access denied: You are not authorized for this interview session.' });
        }
        const questions = existing.questions || [];
        questions.push(followUp.followUpQuestion);
        await db.updateInterview(interviewId, { questions });
      }
    }

    return res.json(followUp);
  } catch (err: any) {
    console.error('Next question error:', err);
    return res.status(500).json({ error: 'Failed to generate next dynamic question.' });
  }
});

// POST /api/interviews/complete-session & POST /api/interviews/complete
const handleCompleteSession = async (req: AuthRequest, res: any) => {
  try {
    const { interviewId, qaList, jobRole, difficulty, mode, interviewerPersona, eyeContactAverage } = req.body;

    const candidateId = req.user!.id;
    const candidateName = req.user!.fullName;

    // IDOR Security: If existing interviewId provided, verify caller is owner
    if (interviewId) {
      const existing = await db.findInterviewById(interviewId);
      if (existing) {
        const isOwner = String(existing.candidateId) === String(req.user!.id);
        const isAdmin = req.user!.role === 'admin';
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ error: 'Access denied: You are not authorized for this interview session.' });
        }
      }
    }

    // Generate comprehensive report with AI
    const reportData = await aiService.generateInterviewReport({
      jobRole: jobRole || 'Full Stack Engineer',
      candidateName,
      mode: mode || 'classic',
      difficulty: difficulty || 'Mid-Level',
      qaList: qaList || [],
      eyeContactAverage: eyeContactAverage || 85,
    });

    // Save report in DB
    const report = await db.createReport({
      interviewId,
      candidateId,
      candidateName,
      jobRole: jobRole || 'Full Stack Engineer',
      ...reportData,
      eyeContact: eyeContactAverage || 85,
    });

    const reportId = report.id || report._id;

    // Update or create interview record
    if (interviewId) {
      await db.updateInterview(interviewId, {
        status: 'completed',
        answers: qaList,
        reportId,
        metrics: {
          communication: reportData.communication,
          technicalKnowledge: reportData.technicalKnowledge,
          problemSolving: reportData.problemSolving,
          confidence: reportData.confidence,
          clarity: reportData.clarity,
          eyeContact: eyeContactAverage || 85,
        },
      });
    } else {
      await db.createInterview({
        candidateId,
        candidateName,
        candidateEmail: req.user!.email,
        mode: mode || 'classic',
        jobRole: jobRole || 'Full Stack Engineer',
        interviewerPersona: interviewerPersona || 'AI Interviewer',
        difficulty: difficulty || 'Mid-Level',
        status: 'completed',
        questions: (qaList || []).map((q: any) => q.question),
        answers: qaList || [],
        metrics: {
          communication: reportData.communication,
          technicalKnowledge: reportData.technicalKnowledge,
          problemSolving: reportData.problemSolving,
          confidence: reportData.confidence,
          clarity: reportData.clarity,
          eyeContact: eyeContactAverage || 85,
        },
        reportId,
      });
    }

    return res.json({
      reportId,
      report,
    });
  } catch (err: any) {
    console.error('Error completing interview session:', err);
    return res.status(500).json({ error: 'Failed to complete interview session.' });
  }
};

interviewsRouter.post('/complete-session', authenticateToken, handleCompleteSession);
interviewsRouter.post('/complete', authenticateToken, handleCompleteSession);

// GET /api/interviews/history
interviewsRouter.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getInterviewsByCandidate(req.user!.id);
    return res.json({ interviews: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch interview history.' });
  }
});

// GET /api/interviews/evaluations - List all candidate evaluations and scorecards
interviewsRouter.get('/evaluations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const userEmail = (req.user!.email || '').trim().toLowerCase();
    const allReports = await db.getAllReports();

    let evaluations: any[] = [];
    if (role === 'admin') {
      evaluations = allReports;
    } else if (role === 'interviewer') {
      evaluations = allReports.filter((r) => {
        const matchesInterviewer =
          String(r.interviewerId) === String(userId) ||
          r.interviewerName === req.user!.fullName;
        // Also allow interviewer to review candidate mock evaluations
        return matchesInterviewer || !r.interviewerId;
      });
    } else {
      evaluations = allReports.filter((r) => {
        const matchesId = String(r.candidateId) === String(userId);
        const matchesEmail =
          r.candidateEmail && r.candidateEmail.trim().toLowerCase() === userEmail;
        return matchesId || matchesEmail;
      });
    }

    return res.json({ evaluations });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch evaluations.' });
  }
});

// GET /api/interviews/:id/report
interviewsRouter.get('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    let report = await db.findReportById(id);

    // If not found by report ID, try finding by interviewId
    if (!report) {
      const allReports = await db.getAllReports();
      report = allReports.find(
        (r) =>
          String(r.interviewId) === String(id) ||
          String(r.scheduledInterviewId) === String(id) ||
          String(r.avatarInterviewId) === String(id)
      );
    }

    if (!report) {
      return res.status(404).json({ error: 'Interview report not found.' });
    }

    // Security check: Candidate can only view their own report; interviewer can only view if assigned; admin can view all
    const userEmail = (req.user!.email || '').trim().toLowerCase();
    let isOwner = Boolean(report.candidateId && String(report.candidateId) === String(req.user!.id));
    if (!isOwner && report.scheduledInterviewId) {
      const scheduled = await db.findScheduledInterviewById(String(report.scheduledInterviewId));
      if (
        scheduled &&
        scheduled.candidateEmail &&
        scheduled.candidateEmail.trim().toLowerCase() === userEmail
      ) {
        isOwner = true;
      }
    }
    const isAdmin = req.user!.role === 'admin';

    let isAssignedInterviewer = false;
    if (req.user!.role === 'interviewer') {
      if (report.interviewerId && String(report.interviewerId) === String(req.user!.id)) {
        isAssignedInterviewer = true;
      } else if (report.scheduledInterviewId) {
        const scheduled = await db.findScheduledInterviewById(String(report.scheduledInterviewId));
        if (scheduled && String(scheduled.interviewerId) === String(req.user!.id)) {
          isAssignedInterviewer = true;
        }
      }
    }

    if (!isOwner && !isAdmin && !isAssignedInterviewer) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to view this interview report.' });
    }

    return res.json({ report });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch report.' });
  }
});
