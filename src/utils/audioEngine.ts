export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private isRecording: boolean = false;
  private onAmplitudeCallback?: (rms: Float32Array | number) => void;
  private onSpeakingStartCallback?: () => void;
  private onSpeakingStopCallback?: () => void;
  private isSpeaking: boolean = false;
  private recognition: any = null;

  constructor() {
    // Audio context will be lazy-initialized on user interaction
  }

  public initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setAmplitudeListener(cb: (rms: Float32Array | number) => void) {
    this.onAmplitudeCallback = cb;
  }

  public setSpeakingListeners(onStart: () => void, onStop: () => void) {
    this.onSpeakingStartCallback = onStart;
    this.onSpeakingStopCallback = onStop;
  }

  public speakText(text: string, voiceName: string = 'Aoede', onEnd?: () => void) {
    this.stopPlayback();
    this.isSpeaking = true;
    if (this.onSpeakingStartCallback) this.onSpeakingStartCallback();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Select matching voice pitch/gender if available
      const voices = window.speechSynthesis.getVoices();
      const isMale = ['Charon', 'Fenrir', 'Puck', 'Orus'].includes(voiceName);
      utterance.pitch = isMale ? 0.8 : 1.2;
      utterance.rate = 1.0;

      // Find suitable hindi/english voice if available
      const matchVoice = voices.find(v => v.name.includes(voiceName) || (isMale ? v.name.includes('Male') : v.name.includes('Female')));
      if (matchVoice) utterance.voice = matchVoice;

      // Simulate amplitude fluctuations for visualizer
      let animInterval: any = null;
      animInterval = setInterval(() => {
        if (!this.isSpeaking) {
          clearInterval(animInterval);
          return;
        }
        const rms = Math.random() * 0.7 + 0.3;
        if (this.onAmplitudeCallback) this.onAmplitudeCallback(rms);
      }, 80);

      utterance.onend = () => {
        clearInterval(animInterval);
        this.isSpeaking = false;
        if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
        if (this.onSpeakingStopCallback) this.onSpeakingStopCallback();
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        clearInterval(animInterval);
        this.isSpeaking = false;
        if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
        if (this.onSpeakingStopCallback) this.onSpeakingStopCallback();
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer if Speech Synthesis not available
      setTimeout(() => {
        this.isSpeaking = false;
        if (this.onSpeakingStopCallback) this.onSpeakingStopCallback();
        if (onEnd) onEnd();
      }, 2000);
    }
  }

  public stopPlayback() {
    this.isSpeaking = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.onSpeakingStopCallback) this.onSpeakingStopCallback();
    if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
  }

  public startSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech Recognition is not supported in this browser.');
      return;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'hi-IN'; // Default Hinglish / Indian English support

    let interval: any = null;
    this.isRecording = true;

    // Simulate mic amplitude
    interval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(interval);
        return;
      }
      if (this.onAmplitudeCallback) {
        this.onAmplitudeCallback(Math.random() * 0.6 + 0.2);
      }
    }, 100);

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        onResult(final, true);
      } else if (interim) {
        onResult(interim, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      clearInterval(interval);
      this.isRecording = false;
      if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      clearInterval(interval);
      this.isRecording = false;
      if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
    };

    this.recognition.start();
  }

  public stopSpeechRecognition() {
    this.isRecording = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    if (this.onAmplitudeCallback) this.onAmplitudeCallback(0);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeechRecognition();
      this.stopPlayback();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
