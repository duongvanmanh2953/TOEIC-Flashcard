import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { usePerformance } from '../contexts/PerformanceContext';
import api from '../lib/api';
import { audioEngine } from '../lib/audioEngine';
import { CountryFlag } from '../components/language/CountryFlag';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import {
  InterviewIndustryDto,
  InterviewPositionDto,
  InterviewSetupConfig,
  InterviewMode,
  InterviewQuestionMode,
  InterviewerStyle,
  InterviewQuestionSource,
  InterviewReportData,
  PREDEFINED_TAXONOMY,
  getLocaleForLanguage,
  buildInterviewLanguageContext,
} from '@vocabflow/shared';
import {
  Briefcase,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  BrainCircuit,
  MessageSquare,
  Shield,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Cpu,
  GraduationCap,
  Globe,
  FileText,
  Clock,
  Lightbulb,
  Upload,
  Check,
  ChevronRight,
  Send,
  Languages,
  UserCheck,
  Layers,
  ChevronDown,
  X,
  ExternalLink,
  Lock,
  Award,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AIInterviewStudioPage: React.FC = () => {
  const { user } = useAuth();
  const { activeLanguage } = useLearningContext();
  const { isUltraEfficient } = usePerformance();

  // Entitlement & Pro State (Task 10: Fail-Closed Guard)
  const [checkingBilling, setCheckingBilling] = useState<boolean>(true);
  const [isProAllowed, setIsProAllowed] = useState<boolean>(false);
  const [billingDetails, setBillingDetails] = useState<any | null>(null);

  // Navigation / Phase State: 'SETUP' | 'STUDIO' | 'REPORT'
  const [phase, setPhase] = useState<'SETUP' | 'STUDIO' | 'REPORT'>('SETUP');

  // Taxonomy State: Initialized with predefined fallback
  const [industries, setIndustries] = useState<InterviewIndustryDto[]>(PREDEFINED_TAXONOMY as any);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('TECH');
  const [selectedPosition, setSelectedPosition] = useState<string>('TECH_FE');
  const [seniorityLevel, setSeniorityLevel] = useState<string>('Mid-level');
  const [interviewType, setInterviewType] = useState<string>('Technical Interview');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('REALISTIC');
  const [questionMode, setQuestionMode] = useState<InterviewQuestionMode>('SEQUENTIAL');
  const [interviewerStyle, setInterviewerStyle] = useState<InterviewerStyle>('PROFESSIONAL');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [interviewLang, setInterviewLang] = useState<string>(activeLanguage?.id || 'en');
  const [supportLang, setSupportLang] = useState<string>('vi');

  // Active Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTurnNumber, setCurrentTurnNumber] = useState<number>(1);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [isFollowUp, setIsFollowUp] = useState<boolean>(false);
  const [followUpParentQuestion, setFollowUpParentQuestion] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<number>(4);
  const [candidateTextAnswer, setCandidateTextAnswer] = useState<string>('');
  const [aiState, setAiState] = useState<'SPEAKING' | 'LISTENING' | 'THINKING' | 'WAITING'>('WAITING');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(20 * 60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  // Candidate Voice Input Mode: Direct Interview Language vs Vietnamese with Normalization
  const [speechLanguageMode, setSpeechLanguageMode] = useState<'INTERVIEW_LANG' | 'SUPPORT_VI'>('INTERVIEW_LANG');
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef<string>('');

  // Transcript History
  const [transcriptHistory, setTranscriptHistory] = useState<
    Array<{
      turn: number;
      sender: 'AI' | 'CANDIDATE';
      text: string;
      translatedText?: string;
      isFollowUp?: boolean;
      isTranslated?: boolean;
    }>
  >([]);

  // Hints & Translation
  const [hintDrawerOpen, setHintDrawerOpen] = useState<boolean>(false);
  const [activeHintLevel, setActiveHintLevel] = useState<1 | 2 | 3 | null>(null);
  const [hintContent, setHintContent] = useState<{ text: string; textVi: string } | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [translatedQuestion, setTranslatedQuestion] = useState<string | null>(null);
  const [translating, setTranslating] = useState<boolean>(false);

  // Coach Mode Immediate Feedback
  const [coachFeedback, setCoachFeedback] = useState<any | null>(null);

  // Final Evaluation Report
  const [report, setReport] = useState<InterviewReportData | null>(null);

  // Document Ingestion Drawer & Proposal Modal
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docRawText, setDocRawText] = useState<string>('');
  const [docIsPrivate, setDocIsPrivate] = useState<boolean>(true);
  const [docContributeCommunity, setDocContributeCommunity] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  // Category Proposal Modal
  const [proposalModalOpen, setProposalModalOpen] = useState<boolean>(false);
  const [proposalName, setProposalName] = useState<string>('');
  const [proposalDesc, setProposalDesc] = useState<string>('');
  const [submittingProposal, setSubmittingProposal] = useState<boolean>(false);

  // Check Pro Entitlement on Mount (Task 10: Fail-Closed)
  useEffect(() => {
    let isMounted = true;
    setCheckingBilling(true);
    api
      .get('/interview/billing/status')
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data !== undefined ? res.data.data : res.data;
        setBillingDetails(data);
        setIsProAllowed(Boolean(data?.allowed && data?.isPremium));
      })
      .catch((err) => {
        if (!isMounted) return;
        // User role check fallback
        const userIsPro = user?.role === 'PREMIUM_USER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        setIsProAllowed(Boolean(userIsPro));
      })
      .finally(() => {
        if (isMounted) setCheckingBilling(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Synchronize transcript history with sessionStorage
  useEffect(() => {
    if (sessionId && transcriptHistory.length > 0) {
      try {
        sessionStorage.setItem(`vf_interview_transcript_${sessionId}`, JSON.stringify(transcriptHistory));
      } catch (_) {}
    }
  }, [sessionId, transcriptHistory]);

  // Load cached transcript history on re-entry
  useEffect(() => {
    if (sessionId && transcriptHistory.length === 0) {
      try {
        const cached = sessionStorage.getItem(`vf_interview_transcript_${sessionId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTranscriptHistory(parsed);
          }
        }
      } catch (_) {}
    }
  }, [sessionId]);

  // Synchronize interview language with current learning context automatically
  useEffect(() => {
    if (activeLanguage?.id) {
      setInterviewLang(activeLanguage.id);
    }
  }, [activeLanguage?.id]);

  // Fetch Taxonomy on Load with resilient payload parsing
  useEffect(() => {
    api
      .get('/interview/taxonomy')
      .then((res) => {
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        if (Array.isArray(payload) && payload.length > 0) {
          setIndustries(payload);
        }
      })
      .catch((err) => console.warn('Using predefined interview taxonomy fallback:', err));
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'STUDIO' || isPaused || timeRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setTimeRemainingSec((prev) => {
        if (prev <= 1) {
          handleFinishInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isPaused, timeRemainingSec]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Current Industry & Position helpers
  const currentIndustryObj = industries.find((i) => i.code === selectedIndustry) || industries[0];
  const availablePositions = currentIndustryObj?.positions || [];
  const currentPositionObj =
    availablePositions.find((p) => p.code === selectedPosition) || availablePositions[0];

  // Auto-correct selectedPosition if industry changed
  useEffect(() => {
    if (availablePositions.length > 0 && !availablePositions.some((p) => p.code === selectedPosition)) {
      setSelectedPosition(availablePositions[0].code);
    }
  }, [availablePositions, selectedPosition]);

  // CustomSelect Options Preparation
  const industryOptions: SelectOption<string>[] = industries.map((ind) => {
    let IndIcon = Briefcase;
    if (ind.code === 'TECH') IndIcon = Cpu;
    if (ind.code === 'FIN') IndIcon = TrendingUp;
    if (ind.code === 'MKT') IndIcon = Sparkles;
    if (ind.code === 'EDU') IndIcon = GraduationCap;
    if (ind.code === 'HOSP') IndIcon = Globe;

    return {
      value: ind.code,
      label: ind.name,
      description: ind.nameVi,
      badge: ind.positions?.length ? `${ind.positions.length} vị trí` : undefined,
      icon: <IndIcon className="w-4 h-4 text-indigo-500 shrink-0" />,
    };
  });

  const positionOptions: SelectOption<string>[] = availablePositions.map((pos) => ({
    value: pos.code,
    label: pos.title,
    description: pos.titleVi,
    badge: pos.requiredSkills?.[0],
    icon: <Cpu className="w-4 h-4 text-indigo-500 shrink-0" />,
  }));

  const seniorityOptions: SelectOption<string>[] = [
    { value: 'Intern / Fresher', label: 'Intern / Sinh viên mới tốt nghiệp', description: 'Nền tảng lý thuyết & tinh thần học hỏi' },
    { value: 'Junior', label: 'Junior (1 - 2 năm kinh nghiệm)', description: 'Thực thi nhiệm vụ độc lập & xử lý task cụ thể' },
    { value: 'Mid-level', label: 'Mid-level (2 - 4 năm kinh nghiệm)', description: 'Giải quyết bài toán phức tạp & tự chủ dự án' },
    { value: 'Senior', label: 'Senior (4 - 7 năm kinh nghiệm)', description: 'Kiến trúc chuyên sâu, tối ưu hệ thống & phản biện sâu' },
    { value: 'Lead / Manager', label: 'Lead / Operations Manager', description: 'Tầm nhìn chiến lược, quản trị đội ngũ & vận hành' },
  ];

  const interviewTypeOptions: SelectOption<string>[] = [
    { value: 'Technical Interview', label: 'Chuyên môn & Giải pháp (Domain Depth)', description: 'Đào sâu nghiệp vụ, kỹ năng thực chiến và giải quyết bài toán' },
    { value: 'Behavioral (STAR)', label: 'Tình huống & Hành vi (STAR Method)', description: 'Situation - Task - Action - Result theo chuẩn quốc tế' },
    { value: 'System Design', label: 'Thiết kế Kiến trúc / Vận hành (Architecture)', description: 'Khả năng mở rộng, phân tải và quy trình hệ thống' },
    { value: 'HR & Culture Fit', label: 'Văn hóa & Động lực (HR & Culture)', description: 'Mục tiêu nghề nghiệp, tinh thần đồng đội và hòa nhập văn hóa' },
  ];

  // Play Question Speech with BCP-47 speech locale accuracy (Task 2 & Task 4)
  const playQuestionSpeech = (text: string) => {
    if (!text) return;
    setAiState('SPEAKING');
    const targetLocale = getLocaleForLanguage(interviewLang);

    try {
      if (audioEngine && typeof (audioEngine as any).speak === 'function') {
        (audioEngine as any).speak(
          text,
          targetLocale,
          () => setAiState('WAITING'),
          () => setAiState('WAITING')
        );
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLocale;
        utterance.rate = 0.95;
        utterance.onend = () => setAiState('WAITING');
        utterance.onerror = () => setAiState('WAITING');
        window.speechSynthesis.speak(utterance);
      } else {
        setAiState('WAITING');
      }
    } catch (err) {
      console.warn('Voice playback fallback:', err);
      setAiState('WAITING');
    }
  };

  // Start Web Speech Recognition with Dynamic Locale & Real-time Streaming (Task 4)
  const handleToggleVoiceRecording = () => {
    if (isVoiceRecording) {
      // Stop recording gracefully
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (_) {}
      }
      setIsVoiceRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng Chrome, Safari hoặc nhập bằng văn bản.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const targetLocale =
        speechLanguageMode === 'SUPPORT_VI' ? 'vi-VN' : getLocaleForLanguage(interviewLang);

      recognition.lang = targetLocale;
      recognition.continuous = true;
      recognition.interimResults = true;

      // Remember any text previously entered so voice recognition appends seamlessly
      baseTranscriptRef.current = candidateTextAnswer.trim();

      recognition.onstart = () => {
        setIsVoiceRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = 0; i < event.results.length; ++i) {
          const resItem = event.results[i];
          if (resItem.isFinal) {
            finalChunk += resItem[0].transcript + ' ';
          } else {
            interimChunk += resItem[0].transcript;
          }
        }

        const currentStream = (finalChunk + interimChunk).trim();
        const base = baseTranscriptRef.current;
        const combined = base ? `${base} ${currentStream}` : currentStream;

        // Immediately update state so words appear in the textarea as spoken
        setCandidateTextAnswer(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Không thể truy cập Microphone. Vui lòng cho phép quyền Microphone trong cài đặt trình duyệt.');
        }
        setIsVoiceRecording(false);
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start SpeechRecognition:', err);
      setIsVoiceRecording(false);
    }
  };

  // Start Session (Strictly Pro Enforced, No local mock bypass)
  const handleStartSession = async () => {
    if (!isProAllowed) {
      alert('Bạn cần nâng cấp lên gói Pro / Premium để bắt đầu phiên phỏng vấn 1:1 với AI.');
      return;
    }

    setIsSubmitting(true);
    try {
      const config: InterviewSetupConfig = {
        languageId: interviewLang || activeLanguage?.id || 'en',
        supportLanguageId: supportLang || 'vi',
        industryCode: selectedIndustry,
        positionCode: selectedPosition,
        positionTitle: currentPositionObj?.title || 'Professional Candidate',
        seniorityLevel,
        interviewType,
        durationMinutes,
        mode: interviewMode,
        questionMode,
        interviewerStyle,
        questionSource: 'CURATED',
        enableHints: true,
        enableTranslation: true,
        enableVoice: true,
      };

      const res = await api.post('/interview/setup', config);
      const payload = res.data?.data !== undefined ? res.data.data : res.data;

      if (payload?.session && payload?.currentTurn) {
        setSessionId(payload.session.id);
        setCurrentTurnNumber(payload.currentTurn.turnNumber);
        setCurrentQuestionText(payload.currentTurn.questionText);
        setTotalQuestions(payload.currentTurn.totalQuestions || 4);
        setTimeRemainingSec(durationMinutes * 60);

        // Fetch dynamic tailored opening script (Task 5.3)
        let openingSpeech = payload.currentTurn.questionText;
        try {
          const scriptRes = await api.get('/interview/opening-script', {
            params: {
              industryCode: selectedIndustry,
              positionCode: selectedPosition,
              positionTitle: currentPositionObj?.title,
              seniorityLevel,
              interviewType,
              languageId: interviewLang,
              interviewerStyle,
            },
          });
          const scriptData = scriptRes.data?.data !== undefined ? scriptRes.data.data : scriptRes.data;
          if (scriptData?.scriptText) {
            openingSpeech = `${scriptData.scriptText}\n\n${payload.currentTurn.questionText}`;
          }
        } catch (_) {}

        setTranscriptHistory([
          {
            turn: 1,
            sender: 'AI',
            text: openingSpeech,
          },
        ]);

        setPhase('STUDIO');
        playQuestionSpeech(openingSpeech);
        return;
      }

      throw new Error('Không nhận được dữ liệu phiên phỏng vấn hợp lệ từ máy chủ.');
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || err.message || 'Không thể khởi tạo phòng phỏng vấn. Vui lòng thử lại sau.';
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Candidate Answer (With Support Translation normalization if candidate answered in Vietnamese)
  const handleSubmitAnswer = async () => {
    if (!sessionId || !candidateTextAnswer.trim()) return;
    if (isVoiceRecording) {
      handleToggleVoiceRecording();
    }

    setIsSubmitting(true);
    setAiState('THINKING');

    const rawAnswer = candidateTextAnswer.trim();
    setCandidateTextAnswer('');

    try {
      let finalAnswerToSend = rawAnswer;
      const isVietnameseSpoken = speechLanguageMode === 'SUPPORT_VI';

      // If candidate answered in Vietnamese, normalize to Interview Language via translation service (Task 4)
      if (isVietnameseSpoken && interviewLang !== 'vi') {
        try {
          const transRes = await api.post(`/interview/sessions/${sessionId}/translate`, {
            text: rawAnswer,
            sourceLang: 'vi',
            targetLang: interviewLang,
            purpose: 'answer',
          }, { timeout: 30000 });
          const transData = transRes.data?.data !== undefined ? transRes.data.data : transRes.data;
          if (transData?.translatedText) {
            finalAnswerToSend = transData.translatedText;
          }
        } catch (transErr) {
          console.warn('Answer normalization translation fallback:', transErr);
        }
      }

      // Append to candidate transcript
      setTranscriptHistory((prev) => [
        ...prev,
        {
          turn: currentTurnNumber,
          sender: 'CANDIDATE',
          text: rawAnswer,
          translatedText: isVietnameseSpoken && finalAnswerToSend !== rawAnswer ? finalAnswerToSend : undefined,
          isTranslated: isVietnameseSpoken,
        },
      ]);

      const res = await api.post(`/interview/sessions/${sessionId}/turn`, {
        turnNumber: currentTurnNumber,
        answer: finalAnswerToSend,
        durationSec: 30,
        isTranslated: isVietnameseSpoken,
        detectedSourceLanguage: isVietnameseSpoken ? 'vi' : interviewLang,
        originalTranscript: rawAnswer,
      }, { timeout: 45000 });

      const payload = res.data?.data !== undefined ? res.data.data : res.data;

      if (payload?.isSessionCompleted) {
        setReport(payload.report);
        setPhase('REPORT');
        return;
      }

      if (interviewMode === 'COACH' && payload?.evaluation) {
        setCoachFeedback(payload.evaluation);
      }

      if (payload?.nextTurn) {
        const next = payload.nextTurn;
        setCurrentTurnNumber(next.turnNumber);
        setCurrentQuestionText(next.questionText);
        setIsFollowUp(Boolean(next.isFollowUp));
        setFollowUpParentQuestion(next.followUpParentQuestion || '');
        setTranslatedQuestion(null);
        setHintContent(null);
        setActiveHintLevel(null);

        setTranscriptHistory((prev) => [
          ...prev,
          {
            turn: next.turnNumber,
            sender: 'AI',
            text: next.questionText,
            isFollowUp: next.isFollowUp,
          },
        ]);

        playQuestionSpeech(next.questionText);
      }
    } catch (err: any) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const msg = isTimeout
        ? 'Máy chủ AI đang phân tích sâu câu trả lời của bạn. Vui lòng bấm "Gửi câu trả lời" để thử lại.'
        : err.response?.data?.message || 'Gửi câu trả lời thất bại. Vui lòng thử lại.';
      alert(msg);
      // Restore answer to textarea so candidate never loses their thought!
      setCandidateTextAnswer(rawAnswer);
      setAiState('WAITING');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Progressive Hint
  const handleRequestHint = async (level: 1 | 2 | 3) => {
    setLoadingHint(true);
    setActiveHintLevel(level);

    try {
      const res = await api.post(`/interview/sessions/${sessionId}/hint`, {
        turnNumber: currentTurnNumber,
        hintLevel: level,
      });
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (data?.hint) {
        setHintContent({
          text: data.hint,
          textVi: data.translationVi || data.hint,
        });
        return;
      }
    } catch (_) {}

    // Fallback hints
    const posTitle = currentPositionObj?.title || 'chuyên môn';
    if (level === 1) {
      setHintContent({
        text: `Core Focus: Professional Depth, Strategic Decisions, Practical Execution, Measurable Metrics in ${posTitle}.`,
        textVi: `Từ khóa cốt lõi: Năng lực chuyên môn, Quyết định chiến lược, Khả năng thực thi và Con số đo lường trong ${posTitle}.`,
      });
    } else if (level === 2) {
      setHintContent({
        text: `STAR Framework Outline:\n• Situation: Project context & challenges\n• Task: Your direct responsibility\n• Action: Concrete solutions executed\n• Result: Measurable outcome & lessons learned`,
        textVi: `Dàn ý theo chuẩn STAR:\n• Tình huống (Situation): Bối cảnh dự án & thách thức\n• Nhiệm vụ (Task): Trách nhiệm trực tiếp\n• Hành động (Action): Giải pháp kỹ thuật đã triển khai\n• Kết quả (Result): Con số đo lường và bài học rút ra`,
      });
    } else {
      setHintContent({
        text: `"In my recent experience as a ${posTitle}, we faced a critical challenge when... To resolve this, I implemented... As a result, we achieved measurable success."`,
        textVi: `"Trong dự án gần đây với vai trò ${posTitle}, nhóm tôi gặp thử thách khi... Để giải quyết, tôi đã triển khai... Kết quả là đạt được thành công đo lường được."`,
      });
    }
    setLoadingHint(false);
  };

  // Translate Question (Task 3: Direction-Aware)
  const handleTranslateQuestion = async () => {
    if (translatedQuestion) {
      setTranslatedQuestion(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await api.post(`/interview/sessions/${sessionId}/translate`, {
        text: currentQuestionText,
        sourceLang: interviewLang,
        targetLang: supportLang || 'vi',
        purpose: 'question',
      }, { timeout: 30000 });
      const raw = res.data;
      const translated =
        raw?.data?.translatedText ||
        raw?.translatedText ||
        raw?.data?.data?.translatedText ||
        (typeof raw?.data === 'string' ? raw.data : null);

      if (translated) {
        setTranslatedQuestion(translated);
      }
    } catch (err: any) {
      console.warn('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  // Finish Interview Session
  const handleFinishInterview = async () => {
    if (!sessionId) return;
    if (isVoiceRecording) handleToggleVoiceRecording();

    setIsSubmitting(true);
    setAiState('THINKING');
    try {
      const res = await api.post(`/interview/sessions/${sessionId}/finish`);
      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      if (payload?.report) {
        setReport(payload.report);
        setPhase('REPORT');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tổng kết phiên phỏng vấn.');
      setAiState('WAITING');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Custom Document (DOCX / PDF / TXT)
  const handleUploadDocument = async () => {
    if (!docRawText.trim()) return;
    setUploadingDoc(true);
    try {
      await api.post('/interview/documents/upload', {
        title: docTitle.trim() || 'Tài liệu phỏng vấn người dùng',
        fileName: 'custom_questions.txt',
        fileMime: 'text/plain',
        fileSize: docRawText.length,
        rawText: docRawText,
        industryCode: selectedIndustry,
        languageCode: interviewLang,
        isPrivate: docIsPrivate,
        contributeToCommunity: docContributeCommunity,
      });
      alert('Tài liệu đã được tải lên và trích xuất câu hỏi thành công vào kho lưu trữ riêng của bạn!');
      setDocModalOpen(false);
      setDocTitle('');
      setDocRawText('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tải tài liệu thất bại.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Submit Category Proposal
  const handleSubmitProposal = async () => {
    if (!proposalName.trim()) return;
    setSubmittingProposal(true);
    try {
      await api.post('/interview/proposals', {
        proposedType: 'POSITION',
        name: proposalName.trim(),
        parentCategory: selectedIndustry,
        description: proposalDesc.trim(),
      });
      alert('Cảm ơn bạn! Đề xuất vị trí đã được gửi đến ban quản trị nội dung xem xét.');
      setProposalModalOpen(false);
      setProposalName('');
      setProposalDesc('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gửi đề xuất thất bại.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-3 sm:pt-6 pb-24 sm:pb-12 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        {/* =========================================================================
            HEADER BAR (Tasteskill: Clean hierarchy, quiet border, responsive actions)
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  AI Interview Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  PRO 1:1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Mô phỏng phỏng vấn tuyển dụng chuyên sâu · Đánh giá chuẩn quốc tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Space Indicator */}
            <div className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <CountryFlag countryCode={activeLanguage?.countryCode || 'US'} languageId={activeLanguage?.id} />
              <span className="hidden sm:inline">{activeLanguage?.name || 'Tiếng Anh'}</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase">({interviewLang})</span>
            </div>

            {isProAllowed && (
              <>
                <button
                  onClick={() => setDocModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-2xs"
                  title="Nạp tài liệu câu hỏi riêng"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden md:inline">Nạp đề riêng</span>
                </button>
                <button
                  onClick={() => setProposalModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-2xs"
                  title="Đề xuất vị trí hoặc ngành mới"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">Đề xuất vị trí</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* =========================================================================
            PRO PAYWALL EXECUTIVE SHOWCASE (Task 10: Fail-Closed Guard)
        ========================================================================= */}
        {!checkingBilling && !isProAllowed && (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-in fade-in duration-300">
            <div className="max-w-2xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Tính năng độc quyền gói Pro & Premium</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Luyện Phỏng Vấn Chuyên Nghiệp 1:1 Với AI Tuyển Dụng
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Mô phỏng chân thực quy trình tuyển dụng tại các tập đoàn đa quốc gia. AI đóng vai Trưởng bộ phận,
                đào sâu theo phương pháp STAR, chuẩn hóa giọng nói song ngữ và xuất báo cáo năng lực chi tiết.
              </p>
            </div>

            {/* Feature Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Phỏng vấn thích ứng</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tự động đào sâu khi ứng viên trả lời thiếu dữ liệu (STAR), điều chỉnh độ khó theo năng lực thực tế.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Voice Pipeline Đa ngôn ngữ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hỗ trợ trả lời trực tiếp bằng tiếng Anh, Nhật, Hàn, Trung hoặc nói tiếng Việt để AI tự chuẩn hóa dịch thuật.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Báo cáo Năng lực 4 Cột mốc</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tách bạch điểm Chuyên môn, Giao tiếp, Năng lực ngôn ngữ và Bản lĩnh phỏng vấn có dẫn chứng cụ thể.
                </p>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="text-center pt-2">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 transition active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Nâng cấp Pro để mở khóa phòng phỏng vấn ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-slate-400 mt-2">Kích hoạt tức thì · Hủy bất kỳ lúc nào</div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 1: SETUP & CONFIGURATION WIZARD (Pro Users Only)
        ========================================================================= */}
        {isProAllowed && phase === 'SETUP' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Stepper Navigation: Responsive Compact Bar for Mobile & Full Tabs for Desktop (Task 9) */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              {/* Mobile Stepper (< 640px) */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Bước {setupStep} / 3: {setupStep === 1 ? 'Chọn Vị trí' : setupStep === 2 ? 'Tiêu chuẩn phỏng vấn' : 'Xác nhận & Bắt đầu'}
                  </span>
                  <span className="text-slate-400 text-[11px]">{setupStep === 1 ? '33%' : setupStep === 2 ? '66%' : '100%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: setupStep === 1 ? '33.3%' : setupStep === 2 ? '66.6%' : '100%' }}
                  />
                </div>
              </div>

              {/* Desktop Stepper (>= 640px) */}
              <div className="hidden sm:grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSetupStep(1)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 1
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : setupStep > 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      setupStep === 1
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : setupStep > 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {setupStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-black tracking-wider leading-none opacity-80">Bước 1</div>
                    <div className="text-xs truncate font-bold mt-0.5">Vị trí & Ngành nghề</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 2
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : setupStep > 2
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      setupStep === 2
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : setupStep > 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {setupStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-black tracking-wider leading-none opacity-80">Bước 2</div>
                    <div className="text-xs truncate font-bold mt-0.5">Tiêu chuẩn & Phong cách</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(3)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 3
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      setupStep === 3
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    3
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-black tracking-wider leading-none opacity-80">Bước 3</div>
                    <div className="text-xs truncate font-bold mt-0.5">Xác nhận & Bắt đầu</div>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 1: NGÀNH NGHỀ & VỊ TRÍ */}
            {setupStep === 1 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bước 1: Chọn Ngành nghề, Vị trí & Cấp bậc ứng tuyển
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Câu hỏi và tiêu chí phỏng vấn sẽ điều chỉnh chuẩn xác theo competency matrix của vị trí bạn chọn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <CustomSelect
                      label="Ngành nghề tuyển dụng (Industry)"
                      value={selectedIndustry}
                      onChange={(val) => {
                        setSelectedIndustry(val);
                        const targetInd = industries.find((i) => i.code === val);
                        if (targetInd?.positions?.[0]?.code) {
                          setSelectedPosition(targetInd.positions[0].code);
                        }
                      }}
                      options={industryOptions}
                      placeholder="Chọn ngành nghề..."
                      searchable={false}
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Vị trí ứng tuyển (Position)"
                      value={selectedPosition}
                      onChange={(val) => setSelectedPosition(val)}
                      options={positionOptions}
                      placeholder="Chọn vị trí tuyển dụng..."
                      searchable={true}
                    />
                  </div>
                </div>

                {/* Selected Position Detail Card */}
                {currentPositionObj && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {currentPositionObj.titleVi || currentPositionObj.title}
                        </span>
                        <span className="text-xs text-slate-400">({currentPositionObj.title})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {currentIndustryObj?.name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {currentPositionObj.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                        Kỹ năng then chốt:
                      </span>
                      {currentPositionObj.requiredSkills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <CustomSelect
                    label="Cấp bậc kinh nghiệm (Seniority Level)"
                    value={seniorityLevel}
                    onChange={(val) => setSeniorityLevel(val)}
                    options={seniorityOptions}
                    placeholder="Chọn cấp bậc..."
                    searchable={false}
                  />
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Tiếp tục: Cấu hình tiêu chuẩn</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TIÊU CHUẨN & ĐỊNH DẠNG */}
            {setupStep === 2 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bước 2: Định dạng buổi phỏng vấn & Phong cách AI
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Lựa chọn phương thức phản hồi, thời lượng và phong cách người phỏng vấn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <CustomSelect
                      label="Trọng tâm phỏng vấn (Interview Type)"
                      value={interviewType}
                      onChange={(val) => setInterviewType(val)}
                      options={interviewTypeOptions}
                      placeholder="Chọn trọng tâm..."
                      searchable={false}
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Thời lượng phỏng vấn (Duration)"
                      value={durationMinutes.toString()}
                      onChange={(val) => setDurationMinutes(parseInt(val, 10))}
                      options={[
                        { value: '15', label: '15 phút (Nhanh - 3 câu hỏi chính)' },
                        { value: '20', label: '20 phút (Tiêu chuẩn - 4 câu hỏi chính)' },
                        { value: '30', label: '30 phút (Chuyên sâu - 5 câu hỏi chính + Follow-up)' },
                      ]}
                      placeholder="Chọn thời lượng..."
                      searchable={false}
                    />
                  </div>
                </div>

                {/* Mode & Style Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Chế độ tương tác (Interview Mode)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInterviewMode('REALISTIC')}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                          interviewMode === 'REALISTIC'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Thực chiến (Realistic)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewMode('COACH')}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                          interviewMode === 'COACH'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Huấn luyện (Coach)
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phong cách phỏng vấn (Style)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInterviewerStyle('PROFESSIONAL')}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                          interviewerStyle === 'PROFESSIONAL'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Chuyên nghiệp
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewerStyle('CHALLENGING')}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                          interviewerStyle === 'CHALLENGING'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Thử thách cao
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Tiếp tục: Xác nhận phòng phỏng vấn</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: XÁC NHẬN & BẮT ĐẦU */}
            {setupStep === 3 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bước 3: Xác nhận thông tin phòng phỏng vấn 1:1
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kiểm tra cấu hình trước khi kết nối AI Interviewer trực tiếp.
                  </p>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Vị trí</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                      {currentPositionObj?.title}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Cấp bậc</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{seniorityLevel}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Ngôn ngữ phỏng vấn</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5 uppercase">
                      {interviewLang} ({getLocaleForLanguage(interviewLang)})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Thời lượng</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{durationMinutes} phút</span>
                  </div>
                </div>

                {/* Voice Test Strip */}
                <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                    <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Kiểm tra âm thanh phát âm chuẩn theo ngôn ngữ phỏng vấn ({interviewLang})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      playQuestionSpeech(
                        interviewLang === 'ja'
                          ? 'こんにちは！AI面接官です。本日の面接を始めましょう。'
                          : interviewLang === 'ko'
                          ? '안녕하세요! AI 인터뷰어입니다. 오늘의 면접을 시작하겠습니다.'
                          : interviewLang === 'zh'
                          ? '您好！我是您的AI面试官。让我们开始今天的模拟面试。'
                          : 'Hello and welcome to your executive interview session. Let us begin.'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-indigo-50 transition"
                  >
                    {aiState === 'SPEAKING' ? 'Đang phát âm...' : 'Thử giọng AI'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Điều chỉnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isSubmitting ? 'Đang kết nối phòng phỏng vấn...' : 'Bắt đầu phỏng vấn ngay'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STATE 2: LIVE INTERVIEW STUDIO WORKSPACE
        ========================================================================= */}
        {phase === 'STUDIO' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {/* Main Stage (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Studio Top Control Bar */}
              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentPositionObj?.title}
                  </span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    Câu {currentTurnNumber} / ~{totalQuestions}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timeRemainingSec)}</span>
                  </div>

                  <button
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleFinishInterview}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition"
                  >
                    Kết thúc
                  </button>
                </div>
              </div>

              {/* AI Interviewer Avatar & Speech Stage */}
              <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-950/20 to-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative mb-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                    <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  {aiState === 'SPEAKING' && (
                    <div className="absolute -inset-2 rounded-full border-2 border-indigo-500 animate-ping opacity-60" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      aiState === 'SPEAKING'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : aiState === 'THINKING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {aiState === 'SPEAKING'
                      ? 'AI đang phát biểu...'
                      : aiState === 'THINKING'
                      ? 'AI đang phân tích...'
                      : 'Đang lắng nghe câu trả lời'}
                  </span>

                  <button
                    onClick={() => playQuestionSpeech(currentQuestionText)}
                    className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Phát lại âm thanh"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isFollowUp && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-2">
                    Câu hỏi phụ đào sâu (Follow-up)
                  </span>
                )}

                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white max-w-2xl leading-relaxed">
                  "{currentQuestionText}"
                </h2>

                {/* Quick Action Toolbar on Question Card */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={handleTranslateQuestion}
                    disabled={translating}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{translating ? 'Đang dịch...' : translatedQuestion ? 'Ẩn bản dịch' : 'Dịch câu hỏi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestHint(1)}
                    disabled={loadingHint}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      activeHintLevel === 1
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'border-amber-200 dark:border-amber-800/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý Lv1: Cốt lõi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestHint(2)}
                    disabled={loadingHint}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      activeHintLevel === 2
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'border-amber-200 dark:border-amber-800/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý Lv2: Dàn ý STAR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestHint(3)}
                    disabled={loadingHint}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      activeHintLevel === 3
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'border-amber-200 dark:border-amber-800/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý Lv3: Mẫu câu</span>
                  </button>
                </div>

                {/* Translated Question Display — Immediately Under Question */}
                {translatedQuestion && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-indigo-200 space-y-1 animate-in fade-in max-w-xl w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                        <Languages className="w-3.5 h-3.5" />
                        Bản dịch câu hỏi tiếng Việt:
                      </span>
                      <button
                        type="button"
                        onClick={() => setTranslatedQuestion(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                    <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                      {translatedQuestion}
                    </p>
                  </div>
                )}

                {/* Progressive Hint Display — Immediately Under Question & Translation */}
                {hintContent && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 text-xs text-slate-800 dark:text-amber-100 space-y-1.5 animate-in fade-in max-w-xl w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 uppercase text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Gợi ý trả lời ({activeHintLevel === 1 ? 'Cốt lõi' : activeHintLevel === 2 ? 'Dàn ý STAR' : 'Mẫu câu mẫu'}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHintContent(null);
                          setActiveHintLevel(null);
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {hintContent.text}
                    </p>
                    {hintContent.textVi && (
                      <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed pt-1 border-t border-amber-200 dark:border-amber-800/60">
                        💡 {hintContent.textVi}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Coach Mode Immediate Feedback Card */}
              {coachFeedback && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 animate-in fade-in">
                  <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhận xét tức thì của AI Coach:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{coachFeedback.feedbackMessage}</p>
                </div>
              )}

              {/* Candidate Response Workspace */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>Câu trả lời của bạn:</span>
                  </label>

                  {/* Mode & Toolbar Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleTranslateQuestion}
                      disabled={translating}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Languages className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{translating ? 'Đang dịch...' : translatedQuestion ? 'Ẩn bản dịch' : 'Dịch câu hỏi'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHintDrawerOpen((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gợi ý</span>
                    </button>
                  </div>
                </div>

                {/* Visible Translated Question Banner inside Candidate Workspace */}
                {translatedQuestion && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-indigo-200 space-y-1 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                        <Languages className="w-3.5 h-3.5" />
                        Bản dịch câu hỏi tiếng Việt:
                      </span>
                      <button
                        type="button"
                        onClick={() => setTranslatedQuestion(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                    <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                      {translatedQuestion}
                    </p>
                  </div>
                )}

                {/* Candidate Speech Language Mode Toggle (Task 4) */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold">
                  <span className="text-slate-400 pl-1">Ngôn ngữ nói:</span>
                  <button
                    type="button"
                    onClick={() => setSpeechLanguageMode('INTERVIEW_LANG')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      speechLanguageMode === 'INTERVIEW_LANG'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tiếng {interviewLang.toUpperCase()} ({getLocaleForLanguage(interviewLang)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeechLanguageMode('SUPPORT_VI')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      speechLanguageMode === 'SUPPORT_VI'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tiếng Việt (Tự động dịch sang {interviewLang.toUpperCase()})
                  </button>
                </div>

                {/* Real-time Voice Recognition Indicator */}
                {isVoiceRecording && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span>Đang nghe bạn nói... Từ sẽ hiện ngay lập tức vào ô trả lời bên dưới.</span>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500/20 shrink-0">
                      {speechLanguageMode === 'SUPPORT_VI' ? 'VI-VN' : getLocaleForLanguage(interviewLang)}
                    </span>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={candidateTextAnswer}
                  onChange={(e) => setCandidateTextAnswer(e.target.value)}
                  placeholder={`Nhập câu trả lời bằng ${speechLanguageMode === 'SUPPORT_VI' ? 'tiếng Việt' : `tiếng ${interviewLang.toUpperCase()}`} hoặc bấm "Nói qua Micro" để nói trực tiếp...`}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleToggleVoiceRecording}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isVoiceRecording
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-500" />}
                    <span>{isVoiceRecording ? 'Đang nhận diện giọng nói (Dừng)' : 'Nói qua Micro'}</span>
                  </button>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !candidateTextAnswer.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Đang xử lý...</span>
                    ) : (
                      <>
                        <span>Gửi câu trả lời</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progressive Hints Popover */}
              {hintDrawerOpen && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Gợi ý trả lời</span>
                    </div>
                    <button onClick={() => setHintDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRequestHint(1)}
                      className={`p-2 rounded-lg border text-[11px] font-bold transition text-center ${
                        activeHintLevel === 1
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Cấp 1: Từ khóa
                    </button>
                    <button
                      onClick={() => handleRequestHint(2)}
                      className={`p-2 rounded-lg border text-[11px] font-bold transition text-center ${
                        activeHintLevel === 2
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Cấp 2: Dàn ý STAR
                    </button>
                    <button
                      onClick={() => handleRequestHint(3)}
                      className={`p-2 rounded-lg border text-[11px] font-bold transition text-center ${
                        activeHintLevel === 3
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Cấp 3: Mẫu chuẩn
                    </button>
                  </div>

                  {hintContent && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white whitespace-pre-line">{hintContent.text}</div>
                      <div className="text-slate-500 dark:text-slate-400 italic whitespace-pre-line">{hintContent.textVi}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transcript History Sidebar (1 Col) */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[500px] lg:h-[620px]">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhật ký hội thoại</span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {transcriptHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl ${
                      item.sender === 'AI'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-slate-900 dark:text-indigo-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 ml-3'
                    }`}
                  >
                    <div className="font-bold text-[10px] text-slate-400 uppercase mb-0.5">
                      {item.sender === 'AI' ? (item.isFollowUp ? 'AI Follow-up' : 'AI Interviewer') : 'Ứng viên'}
                      {item.isTranslated && (
                        <span className="ml-1 text-[9px] text-amber-500 font-semibold">(Đã dịch)</span>
                      )}
                    </div>
                    <div className="leading-relaxed">{item.text}</div>
                    {item.translatedText && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-indigo-600 dark:text-indigo-300">
                        <strong>Chuẩn hóa ({interviewLang}):</strong> {item.translatedText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 3: COMPREHENSIVE POST-INTERVIEW EVALUATION REPORT (Task 8)
        ========================================================================= */}
        {phase === 'REPORT' && report && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Top Score Banner with 4 Clusters */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 border border-slate-200/80 dark:border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Phỏng vấn hoàn tất
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">{currentPositionObj?.title}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">Báo cáo Năng lực & Đánh giá Tuyển dụng</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                  {report.summaryMd}
                </p>
              </div>

              {/* Overall Score Circle */}
              <div className="text-center shrink-0">
                <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                  {report.overallScore}
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase mt-0.5">Điểm Tổng hợp / 100</div>
              </div>
            </div>

            {/* 4 Distinct Score Clusters (Task 8.1) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Chuyên môn (Competency)</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {report.competencyScore}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Giao tiếp (Communication)</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {report.communicationScore || report.overallScore}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Ngôn ngữ (Language)</div>
                <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
                  {report.languageScore}
                </div>
                {report.isAnyAnswerTranslated && (
                  <span className="text-[9px] text-amber-500 font-bold block mt-0.5">Một số câu qua dịch thuật</span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Bản lĩnh (Performance)</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {report.performanceScore || report.overallScore}
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Điểm mạnh ghi nhận</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {report.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Điểm cần cải thiện</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {report.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Question Breakdown */}
            {report.questionReviews && report.questionReviews.length > 0 && (
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>Phân tích chi tiết từng câu hỏi</span>
                </h3>

                <div className="space-y-3">
                  {report.questionReviews.map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Câu {rev.turnNumber || idx + 1}: {rev.question}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{rev.score}đ</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        <strong>Bạn đã trả lời:</strong> "{rev.candidateAnswer}"
                      </p>
                      <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-slate-800 dark:text-indigo-200">
                        <strong>Gợi ý câu trả lời mẫu:</strong> {rev.suggestedAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Learning Recommendations */}
            {report.learningRecommendations && report.learningRecommendations.length > 0 && (
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Lộ trình ôn tập gợi ý trên VocabFlow</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.learningRecommendations.map((rec, idx) => (
                    <Link
                      key={idx}
                      to={rec.targetUrl}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-800/40 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                          {rec.domain}
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{rec.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{rec.reason}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setPhase('SETUP')}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thực hiện buổi phỏng vấn mới</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal: Document Ingestion */}
        {docModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Nạp tài liệu câu hỏi (Word / PDF / Text)</span>
                </div>
                <button onClick={() => setDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tiêu đề bộ câu hỏi
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="VD: 50 Câu hỏi phỏng vấn Chuyên môn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nội dung câu hỏi
                </label>
                <textarea
                  rows={5}
                  value={docRawText}
                  onChange={(e) => setDocRawText(e.target.value)}
                  placeholder="Dán nội dung câu hỏi tại đây..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDocModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Đóng
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={uploadingDoc || !docRawText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {uploadingDoc ? 'Đang trích xuất...' : 'Trích xuất & Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Category Proposal */}
        {proposalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Đề xuất Vị trí / Ngành mới</span>
                </div>
                <button onClick={() => setProposalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tên vị trí hoặc ngành nghề
                </label>
                <input
                  type="text"
                  value={proposalName}
                  onChange={(e) => setProposalName(e.target.value)}
                  placeholder="VD: Data Protection Officer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={proposalDesc}
                  onChange={(e) => setProposalDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về vị trí..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setProposalModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitProposal}
                  disabled={submittingProposal || !proposalName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {submittingProposal ? 'Đang gửi...' : 'Gửi đề xuất'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
