// Speech Synthesis & Recognition Services for Browser Audio

export interface TTSOptions {
  pitch?: number;
  rate?: number;
  voiceGender?: 'male' | 'female' | 'neutral';
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isListening = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private keepAliveTimer: any = null;

  // Persistent speech transcript buffers across silence gaps and browser restarts
  private baseFinalTranscript = '';
  private sessionFinalTranscript = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.populateVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.populateVoices();
      }
    }
  }

  // Pre-load voices list into memory cache
  private populateVoices(): void {
    if (!this.synth) return;
    try {
      const v = this.synth.getVoices();
      if (v && v.length > 0) {
        this.cachedVoices = v;
      }
    } catch (e) {
      console.warn('Could not populate speech voices:', e);
    }
  }

  // Check support
  isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  // Check if currently synthesizing speech
  isSpeaking(): boolean {
    if (!this.synth) return false;
    return this.synth.speaking || this.synth.pending;
  }

  // Sanitize text for clean voice narration (strip markdown, asterisks, brackets, URLs)
  private sanitizeForSpeech(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/```[\s\S]*?```/g, 'code snippet omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/#+\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[•●▪-]\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Best voice selector (prioritizes high-quality English natural voices)
  private selectBestVoice(gender?: 'male' | 'female' | 'neutral'): SpeechSynthesisVoice | null {
    if (!this.cachedVoices.length && this.synth) {
      this.populateVoices();
    }
    const voices = this.cachedVoices;
    if (!voices.length) return null;

    const enVoices = voices.filter((v) => v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB'));
    const pool = enVoices.length > 0 ? enVoices : voices;

    // Gender/Name preference heuristics
    if (gender === 'female') {
      const femaleVoice = pool.find(
        (v) =>
          v.name.includes('Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Zira') ||
          v.name.includes('Victoria') ||
          v.name.includes('Aria') ||
          v.name.includes('Jenny')
      );
      if (femaleVoice) return femaleVoice;
    } else if (gender === 'male') {
      const maleVoice = pool.find(
        (v) =>
          v.name.includes('Male') ||
          v.name.includes('Daniel') ||
          v.name.includes('David') ||
          v.name.includes('Alex') ||
          v.name.includes('Guy') ||
          v.name.includes('Ryan')
      );
      if (maleVoice) return maleVoice;
    }

    // Default: Prefer Google, Microsoft Natural, or Apple Samantha/Daniel
    const preferred =
      pool.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) ||
      pool.find((v) => v.lang === 'en-US') ||
      pool[0];

    return preferred || null;
  }

  // Wake up and unpause synthesis engine (handles browser autoplay policies and background tab throttling)
  resumeAudio(): void {
    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch {}
    }
  }

  // Text-To-Speech with V8 garbage collection prevention & Chromium keepalive
  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !this.isTTSSupported()) {
        options.onEnd?.();
        return resolve();
      }

      const cleanText = this.sanitizeForSpeech(text);
      if (!cleanText) {
        options.onEnd?.();
        return resolve();
      }

      // Stop previous utterance
      this.stopSpeaking();

      // Ensure synthesizer is unpaused
      this.resumeAudio();

      // Small tick delay (40ms) allows Chromium audio pipeline to cleanly flush canceled state
      setTimeout(() => {
        if (!this.synth) {
          options.onEnd?.();
          return resolve();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.pitch = options.pitch ?? 1.0;
        utterance.rate = options.rate ?? 1.0;

        const voice = this.selectBestVoice(options.voiceGender);
        if (voice) {
          utterance.voice = voice;
        }

        let hasFinished = false;
        const cleanup = () => {
          if (hasFinished) return;
          hasFinished = true;
          if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
          }
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
          if (typeof window !== 'undefined' && (window as any).__activeSpeechUtterance === utterance) {
            (window as any).__activeSpeechUtterance = null;
          }
          options.onEnd?.();
          resolve();
        };

        utterance.onstart = () => {
          options.onStart?.();

          // Chrome speech bug keepalive: Chrome cuts off speeches longer than ~14s unless keepalive pauses/resumes
          if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = setInterval(() => {
            if (!this.synth || !this.synth.speaking) {
              if (this.keepAliveTimer) {
                clearInterval(this.keepAliveTimer);
                this.keepAliveTimer = null;
              }
              return;
            }
            try {
              this.synth.pause();
              this.synth.resume();
            } catch {}
          }, 10000);
        };

        utterance.onend = () => {
          cleanup();
        };

        utterance.onerror = (e) => {
          // 'interrupted' or 'canceled' are standard when user skips/stops or re-triggers
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech synthesis utterance error:', e.error);
          }
          cleanup();
        };

        if (options.onBoundary) {
          utterance.onboundary = (e) => {
            options.onBoundary?.(e.charIndex);
          };
        }

        this.currentUtterance = utterance;
        // Keep a strong global reference on window to prevent V8 GC from dropping utterance mid-sentence
        if (typeof window !== 'undefined') {
          (window as any).__activeSpeechUtterance = utterance;
        }

        try {
          this.synth.speak(utterance);
        } catch (speakErr) {
          console.warn('synth.speak threw exception:', speakErr);
          cleanup();
        }
      }, 40);
    });
  }

  stopSpeaking(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.currentUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__activeSpeechUtterance = null;
    }
  }

  // Speech-To-Text with Persistent Silence Recovery & Accumulation
  startListening({
    onResult,
    onError,
    onEnd,
    initialText = '',
  }: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
    initialText?: string;
  }): boolean {
    if (!this.isSTTSupported()) {
      onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.stopListening();

      // Initialize persistent base transcript
      this.baseFinalTranscript = (initialText || '').trim();
      this.sessionFinalTranscript = '';

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let currentFinal = '';
        let currentInterim = '';

        // Iterate over ALL results from index 0 to accumulate previous speech
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              currentFinal += item[0].transcript + ' ';
            } else {
              currentInterim += item[0].transcript;
            }
          }
        }

        this.sessionFinalTranscript = currentFinal;

        // Total speech = base accumulated text + current session final + current active words
        const fullTranscript = [
          this.baseFinalTranscript,
          currentFinal,
          currentInterim,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (fullTranscript) {
          onResult(fullTranscript, !!currentFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore expected silence / abort events so they don't break recording
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition warning:', event.error);
          onError?.(event.error || 'Speech recognition error');
        }
      };

      this.recognition.onend = () => {
        // If candidate is still recording (silence pause fired onend), preserve text & auto-resume
        if (this.isListening) {
          if (this.sessionFinalTranscript.trim()) {
            this.baseFinalTranscript = [this.baseFinalTranscript, this.sessionFinalTranscript]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            this.sessionFinalTranscript = '';
          }

          // Restart recognition after a brief micro-delay
          setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                this.recognition.start();
              } catch (restartErr: any) {
                // If browser reports already started, ignore silently
                if (!restartErr?.message?.includes('already started')) {
                  console.debug('Speech recognition auto-resumed after silence.');
                }
              }
            }
          }, 150);
        } else {
          onEnd?.();
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      console.warn('SpeechRecognition start failed:', err);
      onError?.(err?.message || 'Failed to start speech recognition');
      return false;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.baseFinalTranscript = '';
    this.sessionFinalTranscript = '';
  }
}

export const speechService = new SpeechService();
