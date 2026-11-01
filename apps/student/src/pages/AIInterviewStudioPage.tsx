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
  InterviewActivity,
  ExtractedSkillItem,
  InterviewJobBrief,
  InterviewBlueprint,
  UserInterviewLearningProfileDto,
  normalizeSkillName,
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
  Trash2,
  Plus,
  Square,
  CheckSquare,
  Sliders,
  BarChart2,
  Copy,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTIVITY_MAP: Record<
  InterviewActivity,
  { label: string; subLabel: string; badgeClass: string }
> = {
  idle: {
    label: 'Chờ ứng viên',
    subLabel: 'Sẵn sàng ghi nhận câu trả lời',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  preparing: {
    label: 'Đang chuẩn bị lộ trình phỏng vấn...',
    subLabel: 'Đối chiếu JD và cấu trúc câu hỏi theo Blueprint',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  listening: {
    label: 'Đang lắng nghe câu trả lời...',
    subLabel: 'Thu nhận giọng nói trực tiếp qua microphone',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  transcribing: {
    label: 'Đang nhận diện giọng nói...',
    subLabel: 'Hoàn thiện bản ghi lời nói của ứng viên',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  analyzing: {
    label: 'Đang phân tích câu trả lời...',
    subLabel: 'Đánh giá chiều sâu kỹ thuật & logic giải quyết vấn đề',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  retrieving_context: {
    label: 'Đang đối chiếu yêu cầu công việc...',
    subLabel: 'Rút trích tiêu chuẩn đánh giá từ Blueprint & RAG',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  evaluating: {
    label: 'Đang đánh giá năng lực & độ hoàn thiện...',
    subLabel: 'Kiểm tra bằng chứng định lượng & framework STAR',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  selecting_question: {
    label: 'Đang lựa chọn câu hỏi chuyên sâu tiếp theo...',
    subLabel: 'Cân đối phân bổ năng lực theo kế hoạch',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  generating_response: {
    label: 'Đang tạo phản hồi & chuẩn bị câu hỏi...',
    subLabel: 'Tối ưu hóa câu hỏi phù hợp với năng lực vừa thể hiện',
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  speaking: {
    label: 'AI đang phát biểu câu hỏi...',
    subLabel: 'Lắng nghe kỹ yêu cầu từ AI Interviewer',
    badgeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
  },
  completed: {
    label: 'Phiên phỏng vấn hoàn tất',
    subLabel: 'Đã tổng kết báo cáo năng lực chi tiết',
    badgeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
  },
  error: {
    label: 'Gặp sự cố kết nối',
    subLabel: 'Vui lòng kiểm tra lại mic hoặc gửi lại',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

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
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);

  // Live AI Activity State Machine (TASK 1)
  const [currentActivity, setCurrentActivity] = useState<InterviewActivity>('idle');
  const [activityMessage, setActivityMessage] = useState<string>('Sẵn sàng ghi nhận câu trả lời');

  // Job Description Analyzer & Skills Matrix (TASK 2)
  const [jdText, setJdText] = useState<string>('');
  const [analyzingJd, setAnalyzingJd] = useState<boolean>(false);
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkillItem[]>([]);
  const [jobBrief, setJobBrief] = useState<InterviewJobBrief | null>(null);

  // Add Custom Skill State (Task 2.5)
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillCategory, setNewSkillCategory] = useState<string>('Framework');
  const [newSkillPriority, setNewSkillPriority] = useState<'required' | 'preferred'>('required');

  // Interview Blueprint (TASK 3)
  const [blueprint, setBlueprint] = useState<InterviewBlueprint | null>(null);
  const [generatingBlueprint, setGeneratingBlueprint] = useState<boolean>(false);

  // Observability & Token Metrics (TASK 10)
  const [tokenMetrics, setTokenMetrics] = useState<{
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    estimatedCostUsd: number;
  } | null>(null);

  // Learning Memory Profile & Privacy (TASK 7)
  const [learningProfile, setLearningProfile] = useState<UserInterviewLearningProfileDto | null>(null);
  const [learningMemoryModalOpen, setLearningMemoryModalOpen] = useState<boolean>(false);

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
  const [hintModalOpen, setHintModalOpen] = useState<boolean>(false);
  const [isPlayingHintAudio, setIsPlayingHintAudio] = useState<boolean>(false);
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

  // Fetch User Learning Profile on Mount (TASK 7)
  const fetchLearningProfile = async () => {
    try {
      const res = await api.get('/interview/learning-profile');
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (data) {
        setLearningProfile(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isProAllowed) {
      fetchLearningProfile();
    }
  }, [isProAllowed]);

  // TASK 2: Job Description Analysis
  const handleAnalyzeJobDescription = async () => {
    if (!jdText.trim()) {
      alert('Vui lòng dán nội dung Mô tả công việc (JD) để AI phân tích.');
      return;
    }
    setAnalyzingJd(true);
    try {
      const res = await api.post('/interview/jd/analyze', {
        jdText,
        positionTitle: currentPositionObj?.title || 'Chuyên viên',
        industry: currentIndustryObj?.name || 'Công nghệ',
        seniority: seniorityLevel,
      });
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (data?.extracted) {
        const skills: ExtractedSkillItem[] = data.extracted.skills || [];
        setExtractedSkills(skills);
        const matrix: Record<string, ExtractedSkillItem[]> = {};
        for (const s of skills) {
          const cat = s.category || 'General';
          if (!matrix[cat]) matrix[cat] = [];
          matrix[cat].push(s);
        }
        const brief: InterviewJobBrief = {
          id: data.extracted.id || `brief-${Date.now()}`,
          jobTitle: data.extracted.jobTitle || currentPositionObj?.title || 'Ứng viên',
          industryCode: currentIndustryObj?.code || 'TECH',
          positionCode: currentPositionObj?.code || 'DEV',
          seniority: seniorityLevel,
          responsibilities: data.extracted.responsibilities || [],
          requiredSkills: skills.filter((s) => s.priority === 'required'),
          preferredSkills: skills.filter((s) => s.priority === 'preferred'),
          userAddedSkills: skills.filter((s) => s.source === 'user_added'),
          competencyMatrix: matrix,
          interviewPriorities: skills.filter((s) => s.includeInInterview).map((s) => s.name),
          languageRequirements: interviewLang,
          version: 1,
          createdAt: new Date().toISOString(),
        };
        setJobBrief(brief);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể phân tích JD. Vui lòng thử lại.');
    } finally {
      setAnalyzingJd(false);
    }
  };

  // Toggle skill inclusion
  const handleToggleSkill = (skillName: string) => {
    setExtractedSkills((prev) =>
      prev.map((s) =>
        s.name.toLowerCase() === skillName.toLowerCase()
          ? { ...s, includeInInterview: !s.includeInInterview }
          : s
      )
    );
  };

  // Remove skill
  const handleRemoveSkill = (skillName: string) => {
    setExtractedSkills((prev) =>
      prev.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase())
    );
  };

  // Add custom user skill (TASK 2.5)
  const handleAddCustomSkill = () => {
    if (!newSkillName.trim()) return;
    const normalized = normalizeSkillName(newSkillName.trim());
    if (extractedSkills.some((s) => s.name.toLowerCase() === normalized.toLowerCase())) {
      alert('Kỹ năng này đã tồn tại trong danh sách.');
      return;
    }

    const customSkill: ExtractedSkillItem = {
      id: `custom-skill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: normalized,
      category: newSkillCategory,
      priority: newSkillPriority,
      requirementType: newSkillPriority === 'required' ? 'required' : 'preferred',
      source: 'user_added',
      confidence: 1.0,
      importance: 5,
      includeInInterview: true,
      userNotes: 'Thêm thủ công bởi ứng viên',
    };

    setExtractedSkills((prev) => [customSkill, ...prev]);
    setNewSkillName('');
  };

  // Confirm Skills Matrix & Generate Job Brief
  const handleConfirmSkills = () => {
    const included = extractedSkills.filter((s) => s.includeInInterview);
    if (included.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kỹ năng để đưa vào kế hoạch phỏng vấn.');
      return;
    }

    const matrix: Record<string, ExtractedSkillItem[]> = {};
    for (const s of included) {
      const cat = s.category || 'General';
      if (!matrix[cat]) matrix[cat] = [];
      matrix[cat].push(s);
    }

    const brief: InterviewJobBrief = {
      id: `brief-${Date.now()}`,
      jobTitle: currentPositionObj?.title || 'Ứng viên',
      industryCode: currentIndustryObj?.code || 'TECH',
      positionCode: currentPositionObj?.code || 'DEV',
      seniority: seniorityLevel,
      responsibilities: [],
      requiredSkills: included.filter((s) => s.priority === 'required'),
      preferredSkills: included.filter((s) => s.priority === 'preferred'),
      userAddedSkills: included.filter((s) => s.source === 'user_added'),
      competencyMatrix: matrix,
      interviewPriorities: included.map((s) => s.name),
      languageRequirements: interviewLang,
      version: 1,
      createdAt: new Date().toISOString(),
    };
    setJobBrief(brief);
    setSetupStep(3);
  };

  // TASK 3: Generate Interview Blueprint
  const handleGenerateBlueprint = async () => {
    setGeneratingBlueprint(true);
    try {
      const activeBrief = jobBrief || {
        jobTitle: currentPositionObj?.title || 'Ứng viên',
        industry: currentIndustryObj?.name || 'Công nghệ',
        position: currentPositionObj?.title || 'Chuyên viên',
        seniority: seniorityLevel,
        responsibilities: [],
        requiredSkills: currentPositionObj?.requiredSkills || [],
        preferredSkills: [],
        userAddedSkills: [],
        competencyMatrix: (currentPositionObj?.requiredSkills || []).map((name) => ({
          name,
          category: 'Core',
          priority: 'required',
          requirementType: 'required',
          source: 'curated',
          confidence: 1.0,
          importance: 0.9,
          includeInInterview: true,
        })),
        interviewPriorities: currentPositionObj?.requiredSkills || [],
        languageRequirements: [interviewLang],
        sourceJdVersion: 'v1.0',
      };

      const res = await api.post('/interview/blueprint/generate', {
        jobBrief: activeBrief,
        durationMinutes,
        seniority: seniorityLevel,
      });
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (data?.blueprint) {
        setBlueprint(data.blueprint);
      }
      setSetupStep(4);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo lộ trình phỏng vấn.');
      setSetupStep(4);
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  // Learning Memory Management (TASK 7.4)
  const handleResetLearningProfile = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử năng lực ghi nhớ?')) return;
    try {
      await api.delete('/interview/learning-profile');
      await fetchLearningProfile();
      alert('Đã xóa thành công hồ sơ ghi nhớ phỏng vấn.');
    } catch (_) {
      alert('Xóa hồ sơ ghi nhớ thất bại.');
    }
  };

  const handleTogglePersonalization = async (enabled: boolean) => {
    try {
      await api.post('/interview/learning-profile/toggle', { enabled });
      await fetchLearningProfile();
    } catch (_) {
      alert('Không thể thay đổi cài đặt cá nhân hóa.');
    }
  };

  // Start Session (Strictly Pro Enforced, with Job Brief & Blueprint)
  const handleStartSession = async () => {
    if (!isProAllowed) {
      alert('Bạn cần nâng cấp lên gói Pro / Premium để bắt đầu phiên phỏng vấn 1:1 với AI.');
      return;
    }

    setIsSubmitting(true);
    setCurrentActivity('preparing');
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
        jobBrief: jobBrief || undefined,
        blueprint: blueprint || undefined,
      };

      const res = await api.post('/interview/setup', config);
      const payload = res.data?.data !== undefined ? res.data.data : res.data;

      if (payload?.session && payload?.currentTurn) {
        setSessionId(payload.session.id);
        setCurrentTurnNumber(payload.currentTurn.turnNumber);
        setCurrentQuestionText(payload.currentTurn.questionText);
        setTotalQuestions(payload.currentTurn.totalQuestions || 4);
        setTimeRemainingSec(durationMinutes * 60);

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
        setCurrentActivity('speaking');
        playQuestionSpeech(openingSpeech);
        return;
      }

      throw new Error('Không nhận được dữ liệu phiên phỏng vấn hợp lệ từ máy chủ.');
    } catch (err: any) {
      setCurrentActivity('error');
      const errMsg =
        err.response?.data?.message || err.message || 'Không thể khởi tạo phòng phỏng vấn. Vui lòng thử lại sau.';
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Candidate Answer (TASK 4: Single-Pass Turn Orchestrator without separate translate call)
  const handleSubmitAnswer = async () => {
    if (!sessionId || !candidateTextAnswer.trim()) return;

    // Stop voice recognition safely & clean listeners so trailing events never refill input
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    setIsVoiceRecording(false);
    baseTranscriptRef.current = '';

    setIsSubmitting(true);
    setAiState('THINKING');
    setCurrentActivity('analyzing');

    const rawAnswer = candidateTextAnswer.trim();
    // Fresh reset of input immediately
    setCandidateTextAnswer('');

    try {
      const isVietnameseSpoken = speechLanguageMode === 'SUPPORT_VI';

      // Append to candidate transcript immediately
      setTranscriptHistory((prev) => [
        ...prev,
        {
          turn: currentTurnNumber,
          sender: 'CANDIDATE',
          text: rawAnswer,
          isTranslated: isVietnameseSpoken,
        },
      ]);

      // Direct single-pass turn orchestrator call (no separate preliminary /translate request needed)
      const res = await api.post(`/interview/sessions/${sessionId}/turn`, {
        turnNumber: currentTurnNumber,
        answer: rawAnswer,
        durationSec: 30,
        isTranslated: isVietnameseSpoken,
        detectedSourceLanguage: isVietnameseSpoken ? 'vi' : interviewLang,
        originalTranscript: rawAnswer,
      }, { timeout: 45000 });

      const payload = res.data?.data !== undefined ? res.data.data : res.data;

      // Observability token metrics
      if (payload?.metrics) {
        setTokenMetrics(payload.metrics);
      }

      if (payload?.isSessionCompleted) {
        setCurrentActivity('completed');
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
        setHintModalOpen(false);
        stopHintSpeech();

        // Fresh clear for the new question turn
        setCandidateTextAnswer('');
        baseTranscriptRef.current = '';

        setTranscriptHistory((prev) => [
          ...prev,
          {
            turn: next.turnNumber,
            sender: 'AI',
            text: next.questionText,
            isFollowUp: next.isFollowUp,
          },
        ]);

        setCurrentActivity('speaking');
        playQuestionSpeech(next.questionText);
      } else {
        setCurrentActivity('idle');
      }
    } catch (err: any) {
      setCurrentActivity('error');
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const msg = isTimeout
        ? 'Máy chủ AI đang phân tích sâu câu trả lời của bạn. Vui lòng bấm "Gửi câu trả lời" để thử lại.'
        : err.response?.data?.message || 'Gửi câu trả lời thất bại. Vui lòng thử lại.';
      alert(msg);
      // Restore answer to textarea so candidate never loses their thought!
      setCandidateTextAnswer(rawAnswer);
      baseTranscriptRef.current = rawAnswer;
      setAiState('WAITING');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Play Hint Speech for Read-Along (TTS)
  const playHintSpeech = (text: string) => {
    if (!text) return;
    setIsPlayingHintAudio(true);
    const targetLocale = getLocaleForLanguage(interviewLang);

    try {
      if (audioEngine && typeof (audioEngine as any).speak === 'function') {
        (audioEngine as any).speak(
          text,
          targetLocale,
          () => setIsPlayingHintAudio(false),
          () => setIsPlayingHintAudio(false)
        );
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLocale;
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlayingHintAudio(false);
        utterance.onerror = () => setIsPlayingHintAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingHintAudio(false);
      }
    } catch (_) {
      setIsPlayingHintAudio(false);
    }
  };

  // Stop Hint Speech
  const stopHintSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingHintAudio(false);
  };

  // Apply Hint into Candidate Answer Textarea
  const handleApplyHintToAnswer = () => {
    if (!hintContent?.text) return;
    setCandidateTextAnswer(hintContent.text);
    baseTranscriptRef.current = hintContent.text;
    stopHintSpeech();
    setHintModalOpen(false);
  };

  // Request Progressive Hint (Level 1, 2, 3 with Dedicated Popup & Non-blocking Loading)
  const handleRequestHint = async (level: 1 | 2 | 3) => {
    setActiveHintLevel(level);
    setHintModalOpen(true);
    setLoadingHint(true);
    stopHintSpeech();

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
    } catch (_) {
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
    } finally {
      setLoadingHint(false);
    }
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
            {/* Stepper Navigation: Responsive 4-Step Flow (Task 2 & Task 3) */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              {/* Mobile Stepper (< 640px) */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Bước {setupStep} / 4:{' '}
                    {setupStep === 1
                      ? 'Chọn Vị trí'
                      : setupStep === 2
                      ? 'Phân tích JD & Kỹ năng'
                      : setupStep === 3
                      ? 'Cấu hình phỏng vấn'
                      : 'Lộ trình Blueprint'}
                  </span>
                  <span className="text-slate-400 text-[11px]">{setupStep * 25}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${setupStep * 25}%` }}
                  />
                </div>
              </div>

              {/* Desktop Stepper (>= 640px) */}
              <div className="hidden sm:grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSetupStep(1)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 1
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : setupStep > 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                      setupStep === 1
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : setupStep > 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {setupStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-80">Bước 1</div>
                    <div className="text-[11px] truncate font-bold mt-0.5">Vị trí & Ngành</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 2
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : setupStep > 2
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                      setupStep === 2
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : setupStep > 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {setupStep > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-80">Bước 2</div>
                    <div className="text-[11px] truncate font-bold mt-0.5">JD & Ma trận Kỹ năng</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(3)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 3
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : setupStep > 3
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                      setupStep === 3
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : setupStep > 3
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {setupStep > 3 ? <Check className="w-3 h-3 stroke-[3]" /> : '3'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-80">Bước 3</div>
                    <div className="text-[11px] truncate font-bold mt-0.5">Thời lượng & Chế độ</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(4)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition text-left cursor-pointer border ${
                    setupStep === 4
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-semibold'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                      setupStep === 4
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    4
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-80">Bước 4</div>
                    <div className="text-[11px] truncate font-bold mt-0.5">Xem Blueprint & Bắt đầu</div>
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
                    Khung năng lực cơ bản sẽ được thiết lập theo ngành nghề và cấp bậc bạn chọn.
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
                    onClick={() => {
                      // Initialize extracted skills with position defaults if empty
                      if (extractedSkills.length === 0 && currentPositionObj?.requiredSkills) {
                        const defaults: ExtractedSkillItem[] = currentPositionObj.requiredSkills.map((name, i) => ({
                          id: `default-skill-${i}-${Date.now()}`,
                          name: normalizeSkillName(name),
                          category: 'Core',
                          priority: 'required',
                          requirementType: 'required',
                          source: 'inferred',
                          confidence: 1.0,
                          importance: 5,
                          includeInInterview: true,
                        }));
                        setExtractedSkills(defaults);
                      }
                      setSetupStep(2);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Tiếp tục: Phân tích JD & Ma trận kỹ năng</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: JOB DESCRIPTION ANALYZER & SKILLS MATRIX (TASK 2) */}
            {setupStep === 2 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      TASK 2 · JD Analyzer
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Bóc tách Yêu cầu Tuyển dụng & Tùy biến Ma trận Kỹ năng
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Dán nội dung JD để AI tự động trích xuất các kỹ năng (Required vs Preferred), chuẩn hóa tên công nghệ và cho phép bạn thêm bớt tùy ý.
                  </p>
                </div>

                {/* JD Input Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Nội dung Mô tả công việc (Job Description)</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {jdText.length > 0 ? `${jdText.length} ký tự` : 'Tùy chọn'}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Dán toàn bộ văn bản JD tại đây (Yêu cầu chuyên môn, công nghệ bắt buộc, kỹ năng mềm, v.v.)..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[11px] text-slate-500">
                      💡 <em>AI chỉ phân tích một lần duy nhất tại bước này. Không gửi nguyên văn JD ở từng lượt hỏi.</em>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyzeJobDescription}
                      disabled={analyzingJd || !jdText.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {analyzingJd ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang trích xuất năng lực...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Phân tích JD bằng AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Add Custom User Skill Form (Task 2.5) */}
                <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Thêm Kỹ năng / Công nghệ bạn muốn kiểm tra sâu (User Added)</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Tùy biến cá nhân</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="VD: Docker, GitLab CI/CD, WebSocket, Redux..."
                      className="sm:col-span-5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="sm:col-span-3 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="Framework">Framework</option>
                      <option value="Language">Ngôn ngữ</option>
                      <option value="DevOps">DevOps / CI/CD</option>
                      <option value="Database">Database</option>
                      <option value="Architecture">Kiến trúc</option>
                      <option value="Testing">Testing</option>
                      <option value="SoftSkill">Kỹ năng mềm</option>
                    </select>
                    <select
                      value={newSkillPriority}
                      onChange={(e) => setNewSkillPriority(e.target.value as any)}
                      className="sm:col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="required">Bắt buộc</option>
                      <option value="preferred">Ưu tiên</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>

                {/* Skills Matrix Table / Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ma trận Kỹ năng ({extractedSkills.filter((s) => s.includeInInterview).length} / {extractedSkills.length} sẽ phỏng vấn)
                    </label>
                    <span className="text-[11px] text-slate-400">Bấm checkbox để bật/tắt kỹ năng</span>
                  </div>

                  {extractedSkills.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      Chưa có kỹ năng nào. Vui lòng nhập JD và bấm "Phân tích JD bằng AI" hoặc thêm kỹ năng thủ công.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                      {extractedSkills.map((skill, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                            skill.includeInInterview
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={skill.includeInInterview}
                              onChange={() => handleToggleSkill(skill.name)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {skill.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400">{skill.category}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    skill.priority === 'required'
                                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200'
                                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200'
                                  }`}
                                >
                                  {skill.priority === 'required' ? 'Required' : 'Preferred'}
                                </span>
                                {skill.source === 'user_added' && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                                    User
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Xóa kỹ năng khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSkills}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Xác nhận ma trận kỹ năng & Tiếp tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ĐỊNH DẠNG & THỜI LƯỢNG */}
            {setupStep === 3 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bước 3: Định dạng buổi phỏng vấn & Phong cách AI
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
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
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
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
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
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
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
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
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
                    onClick={() => setSetupStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBlueprint}
                    disabled={generatingBlueprint}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {generatingBlueprint ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang thiết lập Blueprint...</span>
                      </>
                    ) : (
                      <>
                        <span>Tạo lộ trình Blueprint</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW INTERVIEW PLAN & BLUEPRINT (TASK 3) */}
            {setupStep === 4 && (
              <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      TASK 3 · Interview Blueprint
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Bước 4: Xem trước Lộ trình Phỏng vấn & Khởi tạo
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kế hoạch phỏng vấn thích ứng được chuẩn bị trước phiên, phân bổ ngân sách câu hỏi và tích hợp Learning Memory của bạn.
                  </p>
                </div>

                {/* Adaptive Learning Memory Indicator (Task 7) */}
                {learningProfile && learningProfile.skills && learningProfile.skills.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-indigo-950 dark:text-indigo-200">
                      <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-bold">Adaptive Memory đã kích hoạt: </span>
                        <span>
                          AI đã ghi nhớ {learningProfile.skills.filter((s) => s.status === 'demonstrated').length} kỹ năng đã trả lời tốt ở phiên trước để tránh hỏi lại trùng lặp.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLearningMemoryModalOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 cursor-pointer"
                    >
                      Xem hồ sơ ghi nhớ
                    </button>
                  </div>
                )}

                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Vị trí</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                      {jobBrief?.jobTitle || currentPositionObj?.title}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Cấp bậc</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{seniorityLevel}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Ngân sách câu hỏi</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      ~{blueprint?.totalQuestionBudget || 4} câu chính + Follow-up
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Thời lượng</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{durationMinutes} phút</span>
                  </div>
                </div>

                {/* Blueprint Topic Phases */}
                {blueprint && blueprint.topics && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Các chủ đề phỏng vấn theo Blueprint:</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {blueprint.topics.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                            <span className="truncate">{idx + 1}. {t.topicName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 font-mono">
                              ~{t.timeAllocationMinutes} phút · {t.questionBudget} câu
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {t.suggestedFocus}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {t.targetCompetencies.map((comp, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Live AI Activity State Indicator (TASK 1 & TASK 9) */}
                <div className="flex flex-col items-center gap-1.5 mb-2.5">
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs transition-all duration-200 ${
                      ACTIVITY_MAP[currentActivity]?.badgeClass || ACTIVITY_MAP.idle.badgeClass
                    }`}
                  >
                    {currentActivity === 'listening' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    ) : currentActivity === 'speaking' ? (
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    ) : currentActivity === 'analyzing' || currentActivity === 'evaluating' || currentActivity === 'transcribing' ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>{ACTIVITY_MAP[currentActivity]?.label || 'Đang sẵn sàng'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {ACTIVITY_MAP[currentActivity]?.subLabel || 'Sẵn sàng ghi nhận'}
                  </div>
                </div>

                {/* Observability Token Metrics Strip (TASK 10) */}
                {tokenMetrics && (
                  <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/70 text-[10px] text-slate-500 dark:text-slate-400 font-mono mb-2 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-500" />
                      In: {tokenMetrics.inputTokens} (Cached: {tokenMetrics.cachedInputTokens})
                    </span>
                    <span>•</span>
                    <span>Out: {tokenMetrics.outputTokens}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Est. ${tokenMetrics.estimatedCostUsd.toFixed(4)}
                    </span>
                  </div>
                )}

                {isFollowUp && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-2">
                    Câu hỏi phụ đào sâu (Follow-up)
                  </span>
                )}

                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white max-w-2xl leading-relaxed">
                  "{currentQuestionText}"
                </h2>

                {/* Quick Action Toolbar on Question Card */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => playQuestionSpeech(currentQuestionText)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Nghe câu hỏi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTranslateQuestion}
                    disabled={translating}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{translating ? 'Đang dịch...' : translatedQuestion ? 'Ẩn bản dịch' : 'Dịch câu hỏi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestHint(activeHintLevel || 1)}
                    className="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý & Đọc theo</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-mono">
                      Lv{activeHintLevel || 1}
                    </span>
                  </button>
                </div>

                {/* Translated Question Display — Clean & Compact under question */}
                {translatedQuestion && (
                  <div className="mt-3 p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-indigo-200 space-y-1 animate-in fade-in max-w-xl w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                        <Languages className="w-3.5 h-3.5" />
                        Bản dịch câu hỏi tiếng Việt:
                      </span>
                      <button
                        type="button"
                        onClick={() => setTranslatedQuestion(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-1.5 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                    <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                      {translatedQuestion}
                    </p>
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
                      onClick={() => handleRequestHint(activeHintLevel || 1)}
                      className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gợi ý trả lời</span>
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
                    onClick={() => handleRequestHint(activeHintLevel || 1)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý trả lời</span>
                  </button>

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

        {/* Modal: Adaptive Learning Memory & Privacy (TASK 7) */}
        {learningMemoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  <span>Hồ sơ Ghi nhớ Năng lực (Learning Memory)</span>
                </div>
                <button
                  onClick={() => setLearningMemoryModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    AI ghi nhớ bằng chứng năng lực bạn đã thể hiện qua từng câu trả lời để không lặp lại câu hỏi quá cơ bản và tập trung hỏi sâu những điểm cần cải thiện.
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Kích hoạt cá nhân hóa thích ứng:</span>
                    <input
                      type="checkbox"
                      checked={learningProfile?.personalizationEnabled ?? true}
                      onChange={(e) => handleTogglePersonalization(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kỹ năng đã được ghi nhận:
                  </div>
                  {(!learningProfile?.skills || learningProfile.skills.length === 0) ? (
                    <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-400">
                      Chưa có bằng chứng năng lực nào được ghi nhận. Sau khi hoàn thành phiên phỏng vấn, hồ sơ sẽ được cập nhật tự động.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {learningProfile.skills.map((sk, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{sk.name}</span>
                            <div className="text-[10px] text-slate-400">
                              Bằng chứng: {sk.evidenceCount} lần · Độ tin cậy: {Math.round(sk.confidence * 100)}%
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sk.status === 'demonstrated' || sk.status === 'strong'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sk.status === 'emerging' || sk.status === 'developing'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {sk.status === 'demonstrated' || sk.status === 'strong'
                              ? 'Đã chứng minh'
                              : sk.status === 'emerging' || sk.status === 'developing'
                              ? 'Cần luyện thêm'
                              : 'Chưa đánh giá'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {learningProfile?.communicationPatterns && learningProfile.communicationPatterns.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">Mẫu giao tiếp ghi nhận:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      {learningProfile.communicationPatterns.map((pat, idx) => (
                        <li key={idx}>{pat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetLearningProfile}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hồ sơ ghi nhớ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLearningMemoryModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Read-Along & Strategic Hint Popup Modal */}
        {hintModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Gợi ý chiến lược & Đọc theo</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                        Câu #{currentTurnNumber}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentPositionObj?.title || 'Chuyên viên'} · Vị trí: {seniorityLevel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    stopHintSpeech();
                    setHintModalOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Level Selector Tabs */}
              <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestHint(1)}
                  disabled={loadingHint}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex flex-col gap-0.5 ${
                    activeHintLevel === 1
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider">Cấp 1</span>
                    <span className="text-[10px] opacity-80">Nhanh</span>
                  </div>
                  <span className="font-bold text-xs truncate">Từ khóa cốt lõi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestHint(2)}
                  disabled={loadingHint}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex flex-col gap-0.5 ${
                    activeHintLevel === 2
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider">Cấp 2</span>
                    <span className="text-[10px] opacity-80">Chuẩn</span>
                  </div>
                  <span className="font-bold text-xs truncate">Dàn ý STAR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestHint(3)}
                  disabled={loadingHint}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex flex-col gap-0.5 ${
                    activeHintLevel === 3
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider">Cấp 3</span>
                    <span className="text-[10px] opacity-80">Đọc theo</span>
                  </div>
                  <span className="font-bold text-xs truncate">Mẫu hoàn chỉnh</span>
                </button>
              </div>

              {/* Body: Loading State or Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {loadingHint ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Coach đang soạn gợi ý {activeHintLevel === 1 ? 'từ khóa cốt lõi' : activeHintLevel === 2 ? 'dàn ý STAR' : 'mẫu câu đọc theo'}...
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        Tối ưu hóa sát với vị trí {currentPositionObj?.title || 'ứng viên'} và chuẩn phỏng vấn quốc tế
                      </p>
                    </div>
                    {/* Animated shimmer bars */}
                    <div className="w-full max-w-md space-y-2 pt-2">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-5/6 mx-auto" />
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-4/6 mx-auto" />
                    </div>
                  </div>
                ) : hintContent ? (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Read-Along Speech Control Bar */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingHintAudio) {
                              stopHintSpeech();
                            } else {
                              playHintSpeech(hintContent.text);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs ${
                            isPlayingHintAudio
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isPlayingHintAudio ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{isPlayingHintAudio ? 'Dừng phát âm' : 'Nghe phát âm chuẩn'}</span>
                        </button>
                        {isPlayingHintAudio && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Đang đọc mẫu...
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                        Chế độ đọc theo (Read-Along)
                      </span>
                    </div>

                    {/* Target Language Model Content */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Nội dung gợi ý ({interviewLang.toUpperCase()}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(hintContent.text);
                            alert('Đã sao chép nội dung gợi ý!');
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line selection:bg-indigo-200">
                        {hintContent.text}
                      </div>
                    </div>

                    {/* Vietnamese Translation / Breakdown */}
                    {hintContent.textVi && (
                      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Languages className="w-3 h-3" />
                          <span>Giải nghĩa & Hướng dẫn trả lời (Tiếng Việt):</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed whitespace-pre-line">
                          {hintContent.textVi}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopHintSpeech();
                    setHintModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Đóng cửa sổ
                </button>

                <div className="flex items-center gap-2">
                  {hintContent && (
                    <button
                      type="button"
                      onClick={handleApplyHintToAnswer}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Áp dụng vào câu trả lời</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      stopHintSpeech();
                      setHintModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Đã hiểu & Bắt đầu trả lời</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
