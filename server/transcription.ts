import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

function getFileExtension(mimeType: string): string {
  const m = (mimeType || '').toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('quicktime') || m.includes('mov')) return 'mov';
  if (m.includes('wav')) return 'wav';
  if (m.includes('ogg') || m.includes('opus')) return 'ogg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  return 'webm';
}

export interface TranscriptionResult {
  text: string;
  provider: 'gemini' | 'groq-whisper' | 'client-speech-recognition';
  wordCount: number;
}

/**
 * Transcribes audio or video media buffer to text using Google Gemini, Groq Whisper,
 * or client speech recognition fallback.
 */
export async function transcribeMedia(
  buffer: Buffer,
  mimeType: string,
  clientFallbackTranscript?: string
): Promise<TranscriptionResult> {
  const cleanMime = (mimeType || 'video/webm').toLowerCase().split(';')[0].trim();
  const ext = getFileExtension(cleanMime);
  const geminiErrors: string[] = [];
  const groqErrors: string[] = [];

  // Check if buffer contains actual data
  if (!buffer || buffer.length === 0) {
    if (clientFallbackTranscript && clientFallbackTranscript.trim().length >= 3) {
      const cleanClient = clientFallbackTranscript.trim();
      return {
        text: cleanClient,
        provider: 'client-speech-recognition',
        wordCount: cleanClient.split(/\s+/).filter(Boolean).length,
      };
    }
    throw new Error('Recording file is empty (0 bytes). Please ensure microphone permissions are granted and speak clearly.');
  }

  const base64Data = buffer.toString('base64');

  // 1. Try Gemini Multimodal STT (testing gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
  const gemini = getGemini();
  if (gemini) {
    const candidateGeminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const model of candidateGeminiModels) {
      try {
        console.log(`[Transcription] Attempting STT via Gemini model "${model}" (mime: ${cleanMime}, size: ${buffer.length} bytes)...`);
        const response = await gemini.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Data,
              },
            },
            {
              text: `You are an expert speech-to-text audio transcriber. Listen carefully to this recording and transcribe every spoken word verbatim in English.
Rules:
- Transcribe exactly what is spoken by the candidate.
- Preserve verbal fillers (such as "um", "uh", "like", "basically", "you know") as spoken.
- Do NOT summarize, explain, or edit the candidate's speech.
- Do NOT output any markdown backticks, conversational preamble, or explanations.
- If there is no intelligible human speech (e.g. only silence, room noise, static, or background music), output exactly: "[NO_SPEECH]".
- Return ONLY the transcription text.`,
            },
          ],
        });

        const rawText = (response.text || '').trim();
        const cleanText = rawText.replace(/```(?:text)?/gi, '').replace(/```/g, '').trim();

        if (
          cleanText === '[NO_SPEECH]' ||
          cleanText.toLowerCase() === 'no speech detected' ||
          cleanText.toLowerCase() === '[silence]'
        ) {
          throw new Error('No intelligible speech detected in recording. Please ensure your microphone is working and speak clearly.');
        }

        if (cleanText && cleanText.length >= 3) {
          const words = cleanText.split(/\s+/).filter(Boolean);
          console.log(`[Transcription] Gemini STT succeeded (${words.length} words).`);
          return {
            text: cleanText,
            provider: 'gemini',
            wordCount: words.length,
          };
        }
      } catch (err: any) {
        if (err?.message?.includes('No intelligible speech')) {
          throw err;
        }
        const msg = err?.message || String(err);
        console.warn(`[Transcription] Gemini STT (${model}) failed:`, msg);
        geminiErrors.push(`[${model}] ${msg.slice(0, 100)}`);
      }
    }
  } else {
    geminiErrors.push('GEMINI_API_KEY is not configured or placeholder.');
  }

  // 2. Try Groq Whisper API (whisper-large-v3-turbo, whisper-large-v3)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim() !== '') {
    const groqCandidateModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];
    const filename = `recording.${ext}`;

    // Normalize mime for Groq
    let groqMime = cleanMime;
    if (groqMime.includes('webm')) groqMime = 'audio/webm';
    if (groqMime.includes('mp4')) groqMime = 'audio/mp4';

    for (const groqModel of groqCandidateModels) {
      try {
        console.log(`[Transcription] Attempting STT via Groq Whisper model "${groqModel}" (filename: ${filename}, bytes: ${buffer.length})...`);
        const formData = new FormData();

        const fileObj =
          typeof File !== 'undefined'
            ? new File([buffer], filename, { type: groqMime })
            : new Blob([buffer], { type: groqMime });

        formData.append('file', fileObj, filename);
        formData.append('model', groqModel);
        formData.append('response_format', 'json');
        formData.append('language', 'en');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = (await res.json()) as { text?: string };
          const whisperText = (data.text || '').trim();

          if (whisperText) {
            const words = whisperText.split(/\s+/).filter(Boolean);
            if (
              words.length < 2 &&
              (whisperText.toLowerCase().includes('thank you') ||
                whisperText.toLowerCase().includes('subtitles') ||
                whisperText.toLowerCase() === '.')
            ) {
              throw new Error('No intelligible speech detected in recording. Please speak clearly into your microphone.');
            }

            console.log(`[Transcription] Groq Whisper (${groqModel}) succeeded (${words.length} words).`);
            return {
              text: whisperText,
              provider: 'groq-whisper',
              wordCount: words.length,
            };
          }
        } else {
          const errText = await res.text();
          console.warn(`[Transcription] Groq Whisper (${groqModel}) HTTP ${res.status}:`, errText);
          groqErrors.push(`[${groqModel}] HTTP ${res.status}: ${errText.slice(0, 100)}`);
        }
      } catch (groqErr: any) {
        if (groqErr?.message?.includes('No intelligible speech')) {
          throw groqErr;
        }
        const gMsg = groqErr?.message || String(groqErr);
        console.warn(`[Transcription] Groq Whisper (${groqModel}) error:`, gMsg);
        groqErrors.push(`[${groqModel}] ${gMsg.slice(0, 100)}`);
      }
    }
  } else {
    groqErrors.push('GROQ_API_KEY is not configured.');
  }

  // 3. Fallback to client speech recognition transcript if available
  if (clientFallbackTranscript && clientFallbackTranscript.trim().length >= 3) {
    const cleanClient = clientFallbackTranscript.trim();
    const words = cleanClient.split(/\s+/).filter(Boolean);
    console.log('[Transcription] Utilizing client-captured speech transcript fallback (words: ' + words.length + ').');
    return {
      text: cleanClient,
      provider: 'client-speech-recognition',
      wordCount: words.length,
    };
  }

  // 4. Construct descriptive diagnostic if all attempts fail
  const diagnostic = [
    geminiErrors.length > 0 ? `Gemini STT: ${geminiErrors.join('; ')}` : null,
    groqErrors.length > 0 ? `Groq Whisper: ${groqErrors.join('; ')}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  throw new Error(
    `Speech-to-text transcription failed (${diagnostic || 'No speech detected'}). You can enter or paste your spoken answer in the transcript box below and submit.`
  );
}
