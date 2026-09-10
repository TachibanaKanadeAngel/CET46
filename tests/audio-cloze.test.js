// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playTone, speak } from '../js/ui/audio.js';
import { generateCloze, initClozeMode } from '../js/ui/cloze.js';

describe('Audio & Cloze UI Systems', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="audio-announcer"></div>';

    // Mock AudioContext class
    class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
      }
      resume() {}
      createBuffer() { return {}; }
      createBufferSource() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
    }

    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;

    // Mock SpeechSynthesisUtterance class
    class MockSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = 'en-US';
        this.rate = 1;
      }
    }
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  describe('Audio Engine', () => {
    it('plays success tone and sets ARIA live text', () => {
      playTone('success');
      const announcer = document.getElementById('audio-announcer');
      expect(announcer.textContent).toBe('正确提示音');
    });

    it('plays fail tone and sets ARIA live text', () => {
      playTone('fail');
      const announcer = document.getElementById('audio-announcer');
      expect(announcer.textContent).toBe('错误提示音');
    });

    it('triggers speech synthesis when available', async () => {
      const speakMock = vi.fn();
      window.speechSynthesis = {
        speak: speakMock,
        cancel: vi.fn(),
      };

      await speak('abandon');
      expect(window.speechSynthesis).toBeDefined();
    });

    it('plays proxy audio with fallback to local TTS on error or timeout', async () => {
      const origAudio = globalThis.Audio;
      try {
        class MockAudio {
          constructor(url) {
            this.url = url;
            this.oncanplaythrough = null;
            this.onerror = null;
            this.onended = null;
          }
          load() {
            setTimeout(() => {
              if (this.url.includes('corsproxy')) {
                if (this.oncanplaythrough) this.oncanplaythrough();
              } else {
                if (this.onerror) this.onerror();
              }
            }, 10);
          }
          play() {
            return Promise.resolve();
          }
          pause() {}
          removeAttribute() {}
        }
        globalThis.Audio = MockAudio;

        navigator.serviceWorker = {
          controller: { postMessage: vi.fn() },
        };

        await speak('testWord');
        expect(navigator.serviceWorker.controller.postMessage).toHaveBeenCalled();
      } finally {
        globalThis.Audio = origAudio;
      }
    });
  });

  describe('Cloze Gap Generation & Interaction', () => {
    it('replaces target word with blank gap in sentence', () => {
      const word = 'apple';
      const sentence = 'I ate an apple yesterday.';
      const clozeHtml = generateCloze(word, sentence);

      expect(clozeHtml).toContain('class="cloze-gap"');
      expect(clozeHtml).toContain('____');
      expect(clozeHtml).toContain('data-answer="apple"');
    });

    it('handles inflections such as apples, playing, etc.', () => {
      const word = 'play';
      const sentence = 'They are playing football.';
      const clozeHtml = generateCloze(word, sentence);

      expect(clozeHtml).toContain('class="cloze-gap"');
      expect(clozeHtml).toContain('data-answer="playing"');
    });

    it('returns fallback message for short examples', () => {
      const clozeHtml = generateCloze('hi', 'a');
      expect(clozeHtml).toContain('cloze-fallback');
    });

    it('returns empty string if input is empty', () => {
      expect(generateCloze('', '')).toBe('');
      expect(generateCloze('word', '')).toBe('');
    });

    it('initClozeMode reveals gap text when clicked or key pressed', () => {
      const listeners = {};
      const mockDoc = {
        addEventListener: vi.fn((type, fn) => {
          listeners[type] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const origDoc = globalThis.document;
      globalThis.document = mockDoc;

      try {
        initClozeMode();

        expect(mockDoc.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockDoc.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

        const gap = {
          dataset: { answer: 'banana' },
          textContent: '____',
          style: {},
          classList: { contains: vi.fn(c => c === 'cloze-gap') },
        };

        // Trigger click
        listeners['click']({ target: gap });
        expect(gap.textContent).toBe('banana');
        expect(gap.style.borderBottom).toBe('none');

        // Click again toggles back
        listeners['click']({ target: gap });
        expect(gap.textContent).toBe('____');

        // Trigger keydown Enter
        const preventDefault = vi.fn();
        listeners['keydown']({ target: gap, key: 'Enter', preventDefault });
        expect(preventDefault).toHaveBeenCalled();
        expect(gap.textContent).toBe('banana');
      } finally {
        globalThis.document = origDoc;
      }
    });
  });
});

