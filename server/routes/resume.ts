import { Router } from 'express';
import { db } from '../db.js';
import { aiService } from '../ai.js';
import { authenticateToken, AuthRequest } from '../auth.js';
import { extractDocumentText } from '../documentParser.js';

export const resumeRouter = Router();

// POST /api/resume/analyze
resumeRouter.post('/analyze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fileName, resumeText, fileBase64, fileType, targetRole, jobDescription } = req.body;

    let textToAnalyze = '';
    let extractionMethod: 'plaintext' | 'docx' | 'pdf' = 'plaintext';

    // 1. Process binary document upload (PDF or DOCX via Base64)
    if (fileBase64 && typeof fileBase64 === 'string') {
      try {
        // Strip data URI prefix if present (e.g. data:application/pdf;base64,...)
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');

        if (fileBuffer.length === 0) {
          return res.status(400).json({ error: 'Uploaded file is empty. Please select a valid document.' });
        }

        const extracted = await extractDocumentText(fileBuffer, fileType, fileName);
        textToAnalyze = extracted.text;
        extractionMethod = extracted.method;
      } catch (extractErr: any) {
        console.error('Document extraction error:', extractErr);
        return res.status(400).json({
          error: `Failed to extract readable text from ${fileName || 'the uploaded file'}: ${extractErr.message}. If this is a scanned document, please paste the text directly.`,
        });
      }
    } else if (resumeText && typeof resumeText === 'string') {
      textToAnalyze = resumeText.trim();
      extractionMethod = 'plaintext';
    }

    // 2. Validate readable content length
    if (!textToAnalyze || textToAnalyze.trim().length < 50) {
      return res.status(400).json({
        error:
          'Insufficient readable resume content. Please provide or upload a resume with at least 50 characters of readable text. For scanned image-only PDFs, paste the text directly.',
      });
    }

    const candidateId = req.user!.id;
    const cleanRole = (targetRole || 'Software Engineer').trim();
    const cleanJD = typeof jobDescription === 'string' ? jobDescription.trim() : '';

    console.log(
      `[ResumeAnalyzer] Analyzing candidate resume (${extractionMethod}, ${textToAnalyze.length} chars) for role: "${cleanRole}"`
    );

    // 3. Run genuine AI ATS analysis (No hardcoded fake reports)
    const analysis = await aiService.analyzeResume(textToAnalyze, cleanRole, cleanJD);

    // 4. Save analysis to database
    const saved = await db.createResume({
      candidateId,
      fileName: fileName || (fileBase64 ? (extractionMethod === 'docx' ? 'Resume.docx' : 'Resume.pdf') : 'Pasted_Resume.txt'),
      fileText: textToAnalyze.slice(0, 15000),
      targetRole: cleanRole,
      jobDescription: cleanJD,
      overallScore: analysis.overallScore,
      score: analysis.overallScore,
      scoreLabel: analysis.scoreLabel,
      scoreDisclaimer: analysis.scoreDisclaimer,
      subscores: analysis.subscores,
      foundKeywords: analysis.foundKeywords,
      missingKeywords: analysis.missingKeywords,
      categoryRubric: analysis.categoryRubric,
      executiveSummary: analysis.executiveSummary,
      extractedInfo: analysis.extractedInfo,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      skillGaps: analysis.skillGaps,
      sectionFeedback: analysis.sectionFeedback,
      projectAnalysis: analysis.projectAnalysis,
      bulletImprovements: analysis.bulletImprovements,
      formattingGrammarObservations: analysis.formattingGrammarObservations,
      keyRecommendations: analysis.keyRecommendations,
      improvements: analysis.keyRecommendations,
      suggestions: analysis.keyRecommendations,
      interviewPrepTips: analysis.keyRecommendations,
      improvedResumeDraft: analysis.improvedResumeDraft,
    });

    return res.json({
      success: true,
      resume: saved,
      analysis,
    });
  } catch (err: any) {
    console.error('Resume analysis error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to analyze resume. Please ensure the AI service is reachable and retry.',
    });
  }
});

// GET /api/resume/my-resumes
resumeRouter.get('/my-resumes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await db.getResumesByCandidate(req.user!.id);
    return res.json({ resumes: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch resumes.' });
  }
});
