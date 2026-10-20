import { Router } from 'express';
import { aiService } from '../ai.js';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';
import { transcribeMedia } from '../transcription.js';
import {
  getAllQuestions,
  searchQuestions,
  QUESTION_CATEGORIES,
  getQuestionById,
} from '../data/interviewQuestions.js';

export const videoRouter = Router();

const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/mov',
  'video/x-matroska',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/aac',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Helper to validate and convert base64 payload to buffer
function parseBase64Media(
  base64String: string,
  declaredMimeType?: string
): { buffer: Buffer; mimeType: string } {
  let mime = (declaredMimeType || '').toLowerCase().trim();
  let rawData = base64String;

  // Handle data URI prefixes like "data:video/webm;base64,..."
  if (base64String.startsWith('data:')) {
    const matches = base64String.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (matches) {
      mime = matches[1].toLowerCase().trim();
      rawData = matches[2];
    }
  }

  const buffer = Buffer.from(rawData, 'base64');

  if (buffer.length === 0) {
    throw new Error('Provided media payload is empty.');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 50MB limit. Please upload a shorter or compressed recording.');
  }

  const isSupported = SUPPORTED_MIME_TYPES.some((supported) => mime.includes(supported) || supported.includes(mime));
  if (!isSupported && mime) {
    throw new Error(`Unsupported media format (${mime}). Supported formats: MP4, MOV, WebM, WAV.`);
  }

  return { buffer, mimeType: mime || 'video/webm' };
}

// 1. GET /api/video/questions - Fetch all 70 questions grouped by category
videoRouter.get('/questions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;
    const questions = search && typeof search === 'string' ? searchQuestions(search) : getAllQuestions();

    return res.json({
      success: true,
      totalCount: questions.length,
      categories: QUESTION_CATEGORIES,
      questions,
    });
  } catch (err: any) {
    console.error('Fetch interview questions error:', err);
    return res.status(500).json({ error: 'Failed to fetch interview questions.' });
  }
});

// 2. POST /api/video/transcribe - Standalone Speech-to-Text Transcription
videoRouter.post('/transcribe', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { videoBase64, audioBase64, mimeType, clientTranscript, filename, fileSize } = req.body;

    const payload = audioBase64 || videoBase64;
    if (!payload && !clientTranscript) {
      return res.status(400).json({
        error: 'No audio or video data provided for transcription.',
      });
    }

    let buffer: Buffer;
    let resolvedMime = mimeType || 'audio/webm';

    if (payload) {
      try {
        const parsed = parseBase64Media(payload, mimeType);
        buffer = parsed.buffer;
        resolvedMime = parsed.mimeType;
      } catch (parseErr: any) {
        return res.status(400).json({ error: parseErr.message });
      }
    } else {
      buffer = Buffer.alloc(0);
    }

    const transcription = await transcribeMedia(buffer, resolvedMime, clientTranscript);

    return res.json({
      success: true,
      transcript: transcription.text,
      wordCount: transcription.wordCount,
      provider: transcription.provider,
    });
  } catch (err: any) {
    console.error('Transcription route error:', err);
    return res.status(400).json({
      error: err?.message || 'Failed to transcribe audio/video recording.',
    });
  }
});

// 3. POST /api/video/process-and-report - Complete End-to-End Processing & Report Generation
videoRouter.post('/process-and-report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      question,
      questionId,
      videoBase64,
      audioBase64,
      mimeType,
      transcript,
      clientTranscript,
      videoMetrics,
      role,
    } = req.body;

    const cleanQuestion = (question || '').trim();
    if (!cleanQuestion) {
      return res.status(400).json({ error: 'Interview question is required.' });
    }

    // Step A: Obtain Transcript
    let finalTranscript = (transcript || '').trim();

    if (!finalTranscript) {
      const mediaPayload = audioBase64 || videoBase64;
      if (!mediaPayload && !clientTranscript) {
        return res.status(400).json({
          error: 'Please record or upload a video response before requesting analysis.',
        });
      }

      let buffer = Buffer.alloc(0);
      let resolvedMime = mimeType || 'video/webm';

      if (mediaPayload) {
        try {
          const parsed = parseBase64Media(mediaPayload, mimeType);
          buffer = parsed.buffer;
          resolvedMime = parsed.mimeType;
        } catch (validationErr: any) {
          return res.status(400).json({ error: validationErr.message });
        }
      }

      // Execute Speech-to-Text Transcription
      try {
        const transResult = await transcribeMedia(buffer, resolvedMime, clientTranscript);
        finalTranscript = transResult.text;
      } catch (sttErr: any) {
        return res.status(400).json({
          error: sttErr?.message || 'Speech-to-text transcription failed. Please ensure your microphone captured audible speech.',
        });
      }
    }

    // Step B: Validate Transcript is non-empty and contains words
    if (!finalTranscript || finalTranscript.length < 5 || finalTranscript === '[NO_SPEECH]') {
      return res.status(400).json({
        error: 'No intelligible speech detected in recording. Please speak clearly and try again.',
      });
    }

    // Step C: Run Comprehensive AI Interview Analysis
    const targetRole = role || req.user!.preferredRole || 'Software Engineer';
    const candidateName = req.user!.fullName || 'Candidate';

    const analysis = await aiService.analyzeVideoResponse({
      question: cleanQuestion,
      transcript: finalTranscript,
      videoMetrics: videoMetrics || {},
      role: targetRole,
      candidateName,
    });

    // Step D: Persist Structured Report in Database
    const reportData = {
      candidateId: req.user!.id,
      candidateName,
      jobRole: targetRole,
      mode: 'video',
      question: cleanQuestion,
      overallScore: analysis.overallScore,
      technicalKnowledge: analysis.technicalKnowledge,
      communication: analysis.communication,
      problemSolving: analysis.problemSolving,
      confidence: analysis.confidence,
      clarity: analysis.clarity,
      eyeContact: analysis.eyeContact,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      recommendedTopics: analysis.recommendedTopics,
      finalSummary: analysis.finalSummary,
      summary: analysis.summary,
      communicationAnalysis: analysis.communicationAnalysis,
      answerQuality: analysis.answerQuality,
      languageDelivery: analysis.languageDelivery,
      fillerWords: analysis.fillerWords,
      scoring: analysis.scoring,
      improvedAnswer: analysis.improvedAnswer,
      recommendations: analysis.recommendations,
      followUpQuestions: analysis.followUpQuestions,
      videoMetrics: analysis.videoMetrics,
      questionAnalysis: analysis.questionAnalysis,
      transcript: [
        {
          speaker: candidateName,
          text: finalTranscript,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      processingStatus: 'completed',
    };

    const savedReport = await db.createReport(reportData);
    const reportId = savedReport.id || savedReport._id;

    // Step E: Create Linked Interview Record so it displays in candidate history
    await db.createInterview({
      candidateId: req.user!.id,
      candidateName,
      candidateEmail: req.user!.email,
      mode: 'video',
      jobRole: targetRole,
      interviewerPersona: 'AI Video Delivery Coach',
      difficulty: 'Mid-Level',
      status: 'completed',
      questions: [cleanQuestion],
      answers: [
        {
          question: cleanQuestion,
          answer: finalTranscript,
          score: analysis.overallScore,
          feedback: analysis.finalSummary,
        },
      ],
      metrics: {
        communication: analysis.communication,
        technicalKnowledge: analysis.technicalKnowledge,
        problemSolving: analysis.problemSolving,
        confidence: analysis.confidence,
        clarity: analysis.clarity,
        eyeContact: analysis.eyeContact,
      },
      reportId,
    });

    return res.json({
      success: true,
      reportId,
      report: savedReport,
      transcript: finalTranscript,
    });
  } catch (err: any) {
    console.error('End-to-end Video Review error:', err);
    return res.status(500).json({
      error: 'Failed to complete video review and report generation.',
      details: err?.message || 'Server error during video processing.',
    });
  }
});

// 4. POST /api/video/analyze-qa (Backward Compatibility + Persistence)
videoRouter.post('/analyze-qa', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { question, answerTranscript, videoMetrics, role } = req.body;

    const cleanQuestion = (question || 'Tell me about yourself.').trim();
    const cleanTranscript = (answerTranscript || '').trim();

    if (!cleanTranscript || cleanTranscript.length < 5) {
      return res.status(400).json({
        error: 'Spoken transcript is required for analysis.',
      });
    }

    const targetRole = role || req.user!.preferredRole || 'Software Engineer';
    const candidateName = req.user!.fullName || 'Candidate';

    const analysis = await aiService.analyzeVideoResponse({
      question: cleanQuestion,
      transcript: cleanTranscript,
      videoMetrics: videoMetrics || {},
      role: targetRole,
      candidateName,
    });

    // Persist report
    const savedReport = await db.createReport({
      candidateId: req.user!.id,
      candidateName,
      jobRole: targetRole,
      mode: 'video',
      question: cleanQuestion,
      overallScore: analysis.overallScore,
      technicalKnowledge: analysis.technicalKnowledge,
      communication: analysis.communication,
      problemSolving: analysis.problemSolving,
      confidence: analysis.confidence,
      clarity: analysis.clarity,
      eyeContact: analysis.eyeContact,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      recommendedTopics: analysis.recommendedTopics,
      finalSummary: analysis.finalSummary,
      summary: analysis.summary,
      communicationAnalysis: analysis.communicationAnalysis,
      answerQuality: analysis.answerQuality,
      languageDelivery: analysis.languageDelivery,
      fillerWords: analysis.fillerWords,
      scoring: analysis.scoring,
      improvedAnswer: analysis.improvedAnswer,
      recommendations: analysis.recommendations,
      followUpQuestions: analysis.followUpQuestions,
      videoMetrics: analysis.videoMetrics,
      questionAnalysis: analysis.questionAnalysis,
      transcript: [
        {
          speaker: candidateName,
          text: cleanTranscript,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      processingStatus: 'completed',
    });

    const reportId = savedReport.id || savedReport._id;

    return res.json({
      success: true,
      reportId,
      report: savedReport,
      analysis,
      question: cleanQuestion,
    });
  } catch (err: any) {
    console.error('QA Video Analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze Q&A video presentation.' });
  }
});

// 5. POST /api/video/analyze-interview (Backward Compatibility)
videoRouter.post('/analyze-interview', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { transcript, videoMetrics, role } = req.body;

    const cleanTranscript = (transcript || '').trim();
    if (!cleanTranscript || cleanTranscript.length < 5) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const visualSummary = `Average gaze accuracy: ${videoMetrics?.eyeContact || 86}%, Smile & confidence index: ${
      videoMetrics?.confidence || 82
    }%, Expressive pauses: ${videoMetrics?.pauses || 4}.`;

    const feedback = await aiService.analyzeVideoInterview(
      cleanTranscript,
      visualSummary,
      role || 'Software Engineer'
    );

    return res.json({
      analysis: feedback,
    });
  } catch (err: any) {
    console.error('Video interview analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze interview video.' });
  }
});
