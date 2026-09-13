import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceRecorder, RecordedAudioResult } from '../lib/voiceRecorder';
import { audioEngine } from '../lib/audioEngine';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'permission_denied';

export const useVoiceRecorder = () => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordedResult, setRecordedResult] = useState<RecordedAudioResult | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (voiceRecorder.isRecording) {
        voiceRecorder.stop().catch(() => {});
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setRecordedResult(null);
    setRecordingSeconds(0);
    audioEngine.stop();

    try {
      await voiceRecorder.start();
      setStatus('recording');

      // Start duration counter
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - start) / 1000));
      }, 200);
    } catch (err: any) {
      if (err.message === 'PERMISSION_DENIED') {
        setStatus('permission_denied');
        setErrorMessage(
          'Không thể truy cập Microphone. Vui lòng cho phép quyền Microphone trong Cài đặt Safari / Chrome để thu âm.'
        );
      } else if (err.message === 'SAFARI_INSECURE_CONTEXT') {
        setStatus('permission_denied');
        setErrorMessage(
          'Safari yêu cầu kết nối bảo mật (HTTPS hoặc localhost) để mở Microphone. Nếu dùng iPad qua mạng LAN, hãy dùng HTTPS hoặc mở localhost.'
        );
      } else if (err.message === 'NOT_SUPPORTED') {
        setStatus('permission_denied');
        setErrorMessage(
          'Trình duyệt Safari không tìm thấy thiết bị Microphone khả dụng hoặc quyền truy cập bị chặn trong Cài đặt iPad > Safari.'
        );
      } else {
        setStatus('idle');
        setErrorMessage(err.message || 'Không thể khởi động Microphone.');
      }
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordedAudioResult | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const result = await voiceRecorder.stop();
      setRecordedResult(result);
      setStatus('stopped');
      return result;
    } catch (err: any) {
      console.warn('Stop recording failed:', err);
      setStatus('idle');
      return null;
    }
  }, []);

  const replayRecording = useCallback(() => {
    if (!recordedResult?.url) return;

    audioEngine.stop();
    setIsPlayingRecording(true);

    voiceRecorder.playRecording(recordedResult.url, () => {
      setIsPlayingRecording(false);
    });
  }, [recordedResult]);

  const stopReplay = useCallback(() => {
    audioEngine.stop();
    setIsPlayingRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    audioEngine.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    setRecordedResult(null);
    setIsPlayingRecording(false);
    setRecordingSeconds(0);
    setErrorMessage(null);
  }, []);

  return {
    status,
    isRecording: status === 'recording',
    recordedResult,
    recordedUrl: recordedResult?.url || null,
    isPlayingRecording,
    recordingSeconds,
    errorMessage,
    startRecording,
    stopRecording,
    replayRecording,
    stopReplay,
    resetRecording,
  };
};

export default useVoiceRecorder;
