/**
 * Cross-Platform Voice Recorder for Mobile & Desktop
 * Supports iOS Safari (mp4/aac/wav), Android Chrome (webm/ogg/wav), and Web Audio API PCM fallback.
 */

import { audioEngine } from './audioEngine';

export interface RecordedAudioResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationSec: number;
}

export class VoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private supportedMimeType = '';
  private currentObjectUrl: string | null = null;
  private isCurrentlyRecording = false;

  // Web Audio Fallback states (if MediaRecorder is not available)
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private pcmBuffers: Float32Array[] = [];
  private pcmLength = 0;

  constructor() {
    this.detectSupportedMimeType();
  }

  /**
   * Resolve supported MIME type for current browser
   */
  private detectSupportedMimeType(): string {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      this.supportedMimeType = 'audio/wav';
      return 'audio/wav';
    }

    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];

    for (const type of preferredTypes) {
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          this.supportedMimeType = type;
          return type;
        }
      } catch (_) {}
    }

    this.supportedMimeType = '';
    return '';
  }

  /**
   * Check if browser environment supports microphone recording
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Start microphone recording. Must be called inside a user gesture (e.g. onClick/onTouchEnd).
   */
  public async start(): Promise<void> {
    if (this.isCurrentlyRecording) {
      this.stop();
    }

    // Clean up previous Object URL to avoid memory leaks
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    this.chunks = [];
    this.pcmBuffers = [];
    this.pcmLength = 0;

    // Check secure context
    if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost') {
      console.warn('Microphone recording requires a secure context (HTTPS).');
    }

    // Request user media
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    try {
      if (typeof navigator === 'undefined') {
        throw new Error('NOT_SUPPORTED');
      }

      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        // Fallback for Safari / WebKit or older browsers
        const legacyGetUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;

        if (typeof legacyGetUserMedia === 'function') {
          this.mediaStream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        } else {
          // Safari completely removes mediaDevices in HTTP non-localhost contexts
          if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
            throw new Error('SAFARI_INSECURE_CONTEXT');
          }
          throw new Error('NOT_SUPPORTED');
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message === 'PERMISSION_DENIED') {
        throw new Error('PERMISSION_DENIED');
      }
      throw err;
    }

    this.startTime = Date.now();
    this.isCurrentlyRecording = true;

    // Ensure audio engine is unlocked on this user gesture
    audioEngine.unlock();

    // Use MediaRecorder if available and supported
    if (typeof MediaRecorder !== 'undefined' && this.supportedMimeType) {
      try {
        const options: MediaRecorderOptions = { mimeType: this.supportedMimeType };
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            this.chunks.push(e.data);
          }
        };

        // Collect chunks every 250ms for stability
        this.mediaRecorder.start(250);
        return;
      } catch (err) {
        console.warn('MediaRecorder failed, falling back to Web Audio PCM:', err);
      }
    }

    // Fallback: Web Audio API PCM capture (100% universal)
    this.startPcmCapture(this.mediaStream);
  }

  /**
   * Universal Web Audio PCM Capture Fallback
   */
  private startPcmCapture(stream: MediaStream) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.audioContext = new AudioCtx();
    const source = this.audioContext.createMediaStreamSource(stream);
    // Buffer size 4096, 1 input channel, 1 output channel
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isCurrentlyRecording) return;
      const input = e.inputBuffer.getChannelData(0);
      const buffer = new Float32Array(input);
      this.pcmBuffers.push(buffer);
      this.pcmLength += buffer.length;
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  /**
   * Stop microphone recording and produce a playable Audio Blob & Object URL
   */
  public async stop(): Promise<RecordedAudioResult> {
    this.isCurrentlyRecording = false;
    const durationSec = Math.max(0.5, (Date.now() - this.startTime) / 1000);

    return new Promise<RecordedAudioResult>((resolve, reject) => {
      const finishTracks = () => {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }
      };

      // 1. If MediaRecorder was active
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          finishTracks();
          const finalMime = this.mediaRecorder?.mimeType || this.supportedMimeType || 'audio/webm';
          const blob = new Blob(this.chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);
          this.currentObjectUrl = url;
          resolve({ blob, url, mimeType: finalMime, durationSec });
        };

        try {
          this.mediaRecorder.stop();
        } catch (_) {
          finishTracks();
          const blob = new Blob(this.chunks, { type: this.supportedMimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          this.currentObjectUrl = url;
          resolve({ blob, url, mimeType: this.supportedMimeType, durationSec });
        }
        return;
      }

      // 2. If Web Audio PCM capture was active
      finishTracks();
      if (this.audioContext && this.pcmBuffers.length > 0) {
        try {
          const sampleRate = this.audioContext.sampleRate || 44100;
          const wavBlob = this.encodeWav(this.pcmBuffers, this.pcmLength, sampleRate);
          const url = URL.createObjectURL(wavBlob);
          this.currentObjectUrl = url;
          this.audioContext.close().catch(() => {});
          this.audioContext = null;
          resolve({ blob: wavBlob, url, mimeType: 'audio/wav', durationSec });
          return;
        } catch (e) {
          reject(e);
          return;
        }
      }

      // Fallback empty result
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      resolve({ blob: emptyBlob, url: '', mimeType: 'audio/webm', durationSec: 0 });
    });
  }

  /**
   * Helper to encode PCM audio buffers to a standard 16-bit PCM WAV Blob
   */
  private encodeWav(buffers: Float32Array[], totalLength: number, sampleRate: number): Blob {
    const flatBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      flatBuffer.set(b, offset);
      offset += b.length;
    }

    const wavBuffer = new ArrayBuffer(44 + flatBuffer.length * 2);
    const view = new DataView(wavBuffer);

    // Write WAV header
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + flatBuffer.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, flatBuffer.length * 2, true);

    // Convert Float32 to 16-bit PCM
    let writeOffset = 44;
    for (let i = 0; i < flatBuffer.length; i++, writeOffset += 2) {
      const s = Math.max(-1, Math.min(1, flatBuffer[i]));
      view.setInt16(writeOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  /**
   * Replay a recorded audio URL using the shared AudioEngine
   */
  public async playRecording(url: string, onEnded?: () => void): Promise<void> {
    if (!url) return;
    await audioEngine.playWord('', {
      audioUrl: url,
      onEnd: onEnded,
    });
  }

  public get isRecording(): boolean {
    return this.isCurrentlyRecording;
  }
}

export const voiceRecorder = new VoiceRecorder();
export default voiceRecorder;
