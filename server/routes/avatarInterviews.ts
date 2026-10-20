import { Router } from 'express';
import { db } from '../db.js';
import { aiService } from '../ai.js';
import { authenticateToken, AuthRequest } from '../auth.js';

export const avatarInterviewsRouter = Router();

// POST /api/avatar-interviews/start
avatarInterviewsRouter.post('/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobRole, difficulty = 'Mid-Level', duration = 15, persona = 'Elena Rostova' } = req.body;

    if (!jobRole || typeof jobRole !== 'string' || jobRole.trim() === '') {
      return res.status(400).json({ error: 'Valid job role is required.' });
    }

    const validDuration = Math.max(5, Math.min(60, Number(duration) || 15));
    const validDifficulty = String(difficulty || 'Mid-Level');
    const validPersona = String(persona || 'Elena Rostova');

    // Generate tailored opening greeting and initial question via Gemini
    const opening = await aiService.generateAvatarOpening({
      jobRole: jobRole.trim(),
      difficulty: validDifficulty,
      persona: validPersona,
    });

    const initialAiSpeech = `${opening.greeting} ${opening.initialQuestion}`;

    // Create Avatar Interview record in DB (deriving candidate directly from JWT)
    const interview = await db.createAvatarInterview({
      candidateId: req.user!.id,
      candidateName: req.user!.fullName,
      candidateEmail: req.user!.email,
      jobRole: jobRole.trim(),
      difficulty: validDifficulty,
      duration: validDuration,
      persona: validPersona,
      questions: [opening.initialQuestion],
      answers: [],
      transcript: [
        {
          speaker: 'ai',
          text: initialAiSpeech,
          timestamp: new Date().toISOString(),
        },
      ],
      status: 'in_progress',
      startedAt: new Date(),
    });

    const interviewId = interview.id || interview._id;

    return res.status(201).json({
      interviewId,
      greeting: opening.greeting,
      initialQuestion: opening.initialQuestion,
      questionType: opening.questionType,
      topic: opening.topic,
      difficulty: opening.difficulty,
      persona: validPersona,
      duration: validDuration,
    });
  } catch (err: any) {
    console.error('Error starting AI avatar interview:', err);
    return res.status(500).json({ error: 'Failed to initialize AI avatar interview session.' });
  }
});

// POST /api/avatar-interviews/next-question
avatarInterviewsRouter.post('/next-question', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId) {
      return res.status(400).json({ error: 'Interview ID is required.' });
    }

    const interview = await db.findAvatarInterviewById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Avatar interview session not found.' });
    }

    // IDOR Security: Only the candidate owner or admin can access
    const isOwner = String(interview.candidateId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized for this interview session.' });
    }

    if (interview.status === 'completed') {
      return res.json({
        isCompleted: true,
        reportId: interview.reportId,
        message: 'This interview has already been completed.',
      });
    }

    const questions: string[] = interview.questions || [];
    const answers: any[] = interview.answers || [];
    const transcript: any[] = interview.transcript || [];
    const questionIndex = questions.length; // e.g., answering question 1, 2, 3...
    const currentQuestion = questions[questionIndex - 1] || 'Describe your engineering experience.';

    // Estimate target questions from duration (approx 2.5-3 min per question, bounded 4 to 8)
    const totalExpectedQuestions = Math.max(4, Math.min(8, Math.round((interview.duration || 15) / 2.5)));

    // Collect previous topics covered
    const previousTopics = answers.map((a: any) => a.topic).filter(Boolean);

    // Call Gemini to evaluate answer and dynamically generate context-aware next question
    const candidateAnswerText = (answer || '').trim();
    const dynamicResult = await aiService.generateAvatarDynamicNextQuestion({
      jobRole: interview.jobRole,
      difficulty: interview.difficulty,
      persona: interview.persona,
      history: answers.map((a: any) => ({
        question: a.question,
        answer: a.answer,
        questionType: a.questionType,
        topic: a.topic,
      })),
      previousTopics,
      currentAnswer: candidateAnswerText,
      currentQuestion,
      questionIndex,
      totalExpectedQuestions,
    });

    // Store candidate's answer with its evaluation
    const storedAnswer = {
      question: currentQuestion,
      answer: candidateAnswerText,
      questionType: dynamicResult.questionType || 'technical',
      topic: dynamicResult.topic || 'General',
      difficulty: dynamicResult.difficulty || interview.difficulty,
      timestamp: new Date(),
      answerEvaluation: dynamicResult.evaluation,
    };

    answers.push(storedAnswer);

    // Append candidate speech to transcript
    transcript.push({
      speaker: 'candidate',
      text: candidateAnswerText || '(No verbal response)',
      timestamp: new Date().toISOString(),
    });

    const isFinalQuestion = dynamicResult.isFinal || questionIndex >= totalExpectedQuestions;

    if (isFinalQuestion) {
      // Save updated answers and transcript
      await db.updateAvatarInterview(interviewId, {
        answers,
        transcript,
      });

      return res.json({
        isCompleted: true,
        evaluation: dynamicResult.evaluation,
        contextComment: dynamicResult.contextComment,
        message: 'You have reached the final interview question. Ready to generate comprehensive scorecard.',
      });
    }

    // Append next question
    questions.push(dynamicResult.nextQuestion);
    transcript.push({
      speaker: 'ai',
      text: `${dynamicResult.contextComment} ${dynamicResult.nextQuestion}`,
      timestamp: new Date().toISOString(),
    });

    await db.updateAvatarInterview(interviewId, {
      questions,
      answers,
      transcript,
    });

    return res.json({
      isCompleted: false,
      contextComment: dynamicResult.contextComment,
      nextQuestion: dynamicResult.nextQuestion,
      questionType: dynamicResult.questionType,
      topic: dynamicResult.topic,
      difficulty: dynamicResult.difficulty,
      evaluation: dynamicResult.evaluation,
      questionNumber: questions.length,
      totalQuestions: totalExpectedQuestions,
    });
  } catch (err: any) {
    console.error('Error generating dynamic next question:', err);
    return res.status(500).json({ error: 'Failed to process answer and generate next question.' });
  }
});

// POST /api/avatar-interviews/complete
avatarInterviewsRouter.post('/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { interviewId, finalAnswer } = req.body;

    if (!interviewId) {
      return res.status(400).json({ error: 'Interview ID is required.' });
    }

    const interview = await db.findAvatarInterviewById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Avatar interview session not found.' });
    }

    // IDOR Security: Only the candidate owner or admin can access
    const isOwner = String(interview.candidateId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized for this interview session.' });
    }

    // If already completed and report exists, return existing report
    if (interview.status === 'completed' && interview.reportId) {
      const existingReport = await db.findReportById(String(interview.reportId));
      if (existingReport) {
        return res.json({
          message: 'Interview session was previously completed.',
          reportId: interview.reportId,
          report: existingReport,
        });
      }
    }

    const questions: string[] = interview.questions || [];
    const answers: any[] = [...(interview.answers || [])];
    const transcript: any[] = [...(interview.transcript || [])];

    // If final answer was provided and not yet stored
    if (finalAnswer && finalAnswer.trim() && answers.length < questions.length) {
      const lastQ = questions[questions.length - 1];
      const evalRes = await aiService.evaluateAnswer(
        lastQ,
        finalAnswer,
        interview.jobRole,
        interview.difficulty
      );
      answers.push({
        question: lastQ,
        answer: finalAnswer.trim(),
        questionType: 'technical',
        topic: 'Final Question',
        difficulty: interview.difficulty,
        timestamp: new Date(),
        answerEvaluation: {
          score: evalRes.score,
          feedback: evalRes.feedback,
          strengths: ['Addressed question prompt directly'],
          improvement: evalRes.suggestion,
        },
      });
      transcript.push({
        speaker: 'candidate',
        text: finalAnswer.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    // Generate comprehensive evaluation report using Gemini
    const reportData = await aiService.generateAvatarReport({
      jobRole: interview.jobRole,
      candidateName: req.user!.fullName,
      difficulty: interview.difficulty,
      persona: interview.persona,
      questions,
      answers,
      transcript,
    });

    // Save report in database
    const savedReport = await db.createReport({
      avatarInterviewId: interview.id || interview._id,
      interviewId: interview.id || interview._id,
      candidateId: req.user!.id,
      candidateName: req.user!.fullName,
      jobRole: interview.jobRole,
      mode: 'avatar',
      overallScore: reportData.overallScore,
      technicalKnowledge: reportData.technicalKnowledge,
      problemSolving: reportData.problemSolving,
      communication: reportData.communication,
      confidence: reportData.confidence,
      roleFit: reportData.roleFit || 85,
      clarity: reportData.clarity,
      strengths: reportData.strengths,
      weaknesses: reportData.weaknesses,
      suggestions: reportData.suggestions,
      recommendedTopics: reportData.recommendedTopics,
      finalSummary: reportData.finalSummary,
      questionAnalysis: reportData.questionAnalysis,
      transcript,
    });

    const reportId = savedReport.id || savedReport._id;

    // Update avatar interview to completed
    await db.updateAvatarInterview(interviewId, {
      status: 'completed',
      completedAt: new Date(),
      reportId,
      answers,
      transcript,
    });

    return res.json({
      message: 'AI Avatar interview completed successfully.',
      reportId,
      report: savedReport,
    });
  } catch (err: any) {
    console.error('Error completing AI avatar interview session:', err);
    return res.status(500).json({ error: 'Failed to finalize interview report.' });
  }
});

// GET /api/avatar-interviews/:id
avatarInterviewsRouter.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const interview = await db.findAvatarInterviewById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Avatar interview not found.' });
    }

    // IDOR Security
    const isOwner = String(interview.candidateId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to view this interview.' });
    }

    return res.json({ avatarInterview: interview });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch avatar interview.' });
  }
});

// GET /api/avatar-interviews/history
avatarInterviewsRouter.get('/user/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getAvatarInterviewsByCandidate(req.user!.id);
    return res.json({ avatarInterviews: list, interviews: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch avatar interview history.' });
  }
});
