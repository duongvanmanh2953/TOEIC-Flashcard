import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { CountryFlag } from '../components/language/CountryFlag';
import { ModalPortal } from '../components/common/ModalPortal';
import {
  MULTILINGUAL_CURRICULA,
  AI_ROADMAP_RECOMMENDATIONS,
  CurriculumStage,
  CurriculumLesson,
  getCurriculumQuestions,
  matchesCurriculumAnswer,
  playCorrectSound,
  RoadmapRecommendation,
} from '@vocabflow/shared';
import {
  Compass,
  Sparkles,
  Award,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
  AlertCircle,
  Clock,
  ChevronRight,
  Target,
  Flame,
  ArrowRight,
  BookOpen,
  Volume2,
  BrainCircuit,
  Sliders,
  X,
  Crown,
  Star,
  Check,
  ChevronLeft,
  GraduationCap,
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export interface LessonNode {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  skills: string[];
  prerequisites: string[];
  objective: string;
  activities: any[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  biome: string;
  themeColor: string;
  checkpointId: string;
  lessons: LessonNode[];
}

export interface Stage {
  id: string;
  level: string;
  title: string;
  description: string;
  order: number;
  chapters: Chapter[];
}

export const LearningJourneyPage: React.FC = () => {
  const { user } = useAuth();
  const { activeLanguage } = useLearningContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper to construct a rich initial baseline roadmap
  const buildInitialBaselineRoadmap = (langId: string) => {
    const stages = (MULTILINGUAL_CURRICULA[langId] || MULTILINGUAL_CURRICULA['en'] || []) as Stage[];
    let totalNodes = 0;
    stages.forEach((st) => {
      st.chapters.forEach((ch) => {
        totalNodes += ch.lessons.length;
      });
    });

    const defaultFirstId = stages[0]?.chapters[0]?.lessons[0]?.id || 'first-les';

    return {
      id: `baseline-${langId}`,
      languageId: langId,
      title: `Lộ Trình Chuẩn Hóa ${activeLanguage?.name || 'Ngôn Ngữ'} (Hệ Thống Đề Xuất)`,
      targetLevel: langId === 'ja' ? 'N4' : langId === 'ko' ? 'TOPIK 2' : langId === 'zh' ? 'HSK 2' : 'B1',
      version: 1,
      status: 'ACTIVE',
      totalNodes: Math.max(totalNodes, 12),
      completedNodes: 0,
      masteredNodes: 0,
      currentStageIndex: 0,
      currentChapterIndex: 0,
      currentNodeId: defaultFirstId,
      stagesJson: stages,
      progressList: [
        {
          nodeId: defaultFirstId,
          status: 'AVAILABLE',
          score: 0,
          attemptCount: 0,
        },
      ],
      isBaseline: true,
    };
  };

  const [roadmap, setRoadmap] = useState<any>(() => buildInitialBaselineRoadmap(activeLanguage.id));
  const [profile, setProfile] = useState<any>({
    languageId: activeLanguage.id,
    currentEstimatedLevel: activeLanguage.id === 'ja' ? 'N5' : activeLanguage.id === 'ko' ? 'TOPIK 1' : activeLanguage.id === 'zh' ? 'HSK 1' : 'A2',
    targetLevel: activeLanguage.id === 'ja' ? 'N4' : activeLanguage.id === 'ko' ? 'TOPIK 2' : activeLanguage.id === 'zh' ? 'HSK 2' : 'B1',
    learningGoal: 'COMMUNICATION',
    dailyStudyMinutes: 20,
    strengths: ['Từ vựng nền tảng', 'Khả năng ghi nhớ từ khóa'],
    weaknesses: ['Phản xạ nghe hội thoại', 'Cụm từ ứng dụng thực tế'],
  });
  const [recommendations, setRecommendations] = useState<RoadmapRecommendation[]>(
    () => (AI_ROADMAP_RECOMMENDATIONS[activeLanguage.id] || AI_ROADMAP_RECOMMENDATIONS['en'] || [])
  );
  const [loading, setLoading] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [aiAgreed, setAiAgreed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(null);
  const [selectedNodeProgress, setSelectedNodeProgress] = useState<any>(null);

  // Lesson Player Modal state
  const [activeLessonSession, setActiveLessonSession] = useState<LessonNode | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [lessonAttempt, setLessonAttempt] = useState<{ id: string; startedAt: number } | null>(null);
  const [lessonError, setLessonError] = useState('');
  const [lessonOutcome, setLessonOutcome] = useState<{ score: number; isPassed: boolean } | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [submittingProgress, setSubmittingProgress] = useState<boolean>(false);

  // Profile customization modal
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [targetLevel, setTargetLevel] = useState<string>('B1');
  const [learningGoal, setLearningGoal] = useState<string>('COMMUNICATION');
  const [dailyMinutes, setDailyMinutes] = useState<number>(20);

  const getLevelsForLanguage = (langId: string) => {
    switch (langId) {
      case 'ja':
        return [
          { val: 'N5', label: 'JLPT N5 (Sơ cấp nhập môn)', cefr: 'A1' },
          { val: 'N4', label: 'JLPT N4 (Sơ cấp nâng cao)', cefr: 'A2' },
          { val: 'N3', label: 'JLPT N3 (Trung cấp phản xạ)', cefr: 'B1' },
          { val: 'N2', label: 'JLPT N2 (Thương mại & Làm việc)', cefr: 'B2' },
        ];
      case 'ko':
        return [
          { val: 'TOPIK 1', label: 'TOPIK I - Cấp 1 (Nhập môn)', cefr: 'A1' },
          { val: 'TOPIK 2', label: 'TOPIK I - Cấp 2 (Sơ cấp vững)', cefr: 'A2' },
          { val: 'TOPIK 3', label: 'TOPIK II - Cấp 3 (Trung cấp)', cefr: 'B1' },
          { val: 'TOPIK 4', label: 'TOPIK II - Cấp 4 (Công sở)', cefr: 'B2' },
        ];
      case 'zh':
        return [
          { val: 'HSK 1', label: 'HSK 1 (150 từ cơ bản)', cefr: 'A1' },
          { val: 'HSK 2', label: 'HSK 2 (300 từ giao tiếp)', cefr: 'A2' },
          { val: 'HSK 3', label: 'HSK 3 (600 từ nâng cao)', cefr: 'B1' },
          { val: 'HSK 4', label: 'HSK 4 (1200 từ thành thạo)', cefr: 'B2' },
        ];
      default:
        return [
          { val: 'A1', label: 'A1 Beginner (Khởi đầu)', cefr: 'A1' },
          { val: 'A2', label: 'A2 Elementary (Nền tảng vững)', cefr: 'A2' },
          { val: 'B1', label: 'B1 Intermediate (Giao tiếp độc lập)', cefr: 'B1' },
          { val: 'B2', label: 'B2 Upper-Intermediate (Công sở & Chuyên môn)', cefr: 'B2' },
          { val: 'C1', label: 'C1 Advanced (Thành thạo tự nhiên)', cefr: 'C1' },
        ];
    }
  };

  const goalOptions = [
    {
      id: 'COMMUNICATION',
      title: 'Giao tiếp đời thực',
      desc: 'Phản xạ đàm thoại, sinh hoạt hàng ngày & du lịch',
      icon: Zap,
    },
    {
      id: 'CAREER',
      title: 'Công sở & Sự nghiệp',
      desc: 'Viết email, báo cáo, họp hành & thuyết trình chuyên nghiệp',
      icon: TrendingUp,
    },
    {
      id: 'EXAM',
      title: 'Luyện thi chứng chỉ',
      desc: 'Chiến thuật làm đề TOEIC, JLPT, HSK, TOPIK điểm cao',
      icon: GraduationCap,
    },
    {
      id: 'TRAVEL',
      title: 'Du lịch & Định cư',
      desc: 'Giao tiếp tại sân bay, khách sạn, nhà hàng & văn hóa bản địa',
      icon: Compass,
    },
  ];

  const fetchJourneyData = async () => {
    try {
      const [roadmapRes, profileRes, recRes]: any = await Promise.all([
        api.get('/learning-journey/roadmap', { params: { languageId: activeLanguage.id } }).catch(() => null),
        api.get('/learning-journey/profile', { params: { languageId: activeLanguage.id } }).catch(() => null),
        api.get('/learning-journey/recommendations', { params: { languageId: activeLanguage.id } }).catch(() => ({ data: [] })),
      ]);

      const rData = roadmapRes?.data || roadmapRes;
      const pData = profileRes?.data || profileRes;
      const recData = recRes?.data || recRes || [];

      if (rData && rData.stagesJson) {
        setRoadmap(rData);
      } else {
        // Fallback to baseline roadmap
        setRoadmap(buildInitialBaselineRoadmap(activeLanguage.id));
      }

      if (pData) {
        setProfile(pData);
        setTargetLevel(pData.targetLevel || (activeLanguage.id === 'ja' ? 'N4' : 'B1'));
        setLearningGoal(pData.learningGoal || 'COMMUNICATION');
        setDailyMinutes(pData.dailyStudyMinutes || 20);
        setCustomTitle(rData?.title || '');
      }

      if (Array.isArray(recData) && recData.length > 0) {
        setRecommendations(recData);
      } else {
        setRecommendations(AI_ROADMAP_RECOMMENDATIONS[activeLanguage.id] || AI_ROADMAP_RECOMMENDATIONS['en'] || []);
      }

      // Auto select current node
      const queryNodeId = searchParams.get('nodeId');
      const targetId = queryNodeId || rData?.currentNodeId;
      const targetStages = (rData?.stagesJson || roadmap?.stagesJson || []) as Stage[];

      for (const st of targetStages) {
        for (const ch of st.chapters) {
          for (const les of ch.lessons) {
            if (les.id === targetId || (!selectedNode && les.id === (rData?.currentNodeId || targetStages[0]?.chapters[0]?.lessons[0]?.id))) {
              setSelectedNode(les);
              const prog = (rData?.progressList || roadmap?.progressList || []).find((p: any) => p.nodeId === les.id);
              setSelectedNodeProgress(prog);
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load roadmap data', err);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, [activeLanguage.id]);

  const handleSelectNode = (node: LessonNode, chapter: Chapter) => {
    setSelectedNode(node);
    const prog = (roadmap?.progressList || []).find((p: any) => p.nodeId === node.id);
    setSelectedNodeProgress(prog);
  };

  const handleStartLesson = (node: LessonNode) => {
    setActiveLessonSession(node);
    setCurrentStep(0);
    setUserAnswers({});
    setLessonAttempt({ id: crypto.randomUUID(), startedAt: Date.now() });
    setLessonOutcome(null);
    setLessonError('');
    setSessionCompleted(false);
  };

  const currentActivity = activeLessonSession?.activities[currentStep];
  const activityQuestions = currentActivity ? getCurriculumQuestions(currentActivity, currentStep) : [];
  const currentAnswered = activityQuestions.every((question) => Boolean(userAnswers[question.key]?.trim()));
  const lastActivity = currentStep === (activeLessonSession?.activities.length ?? 0) - 1;

  const handleFinishLesson = async () => {
    if (!activeLessonSession || !lessonAttempt || submittingProgress) return;
    setSubmittingProgress(true);
    setLessonError('');
    try {
      if (roadmap?.id && !roadmap.isBaseline) {
        const response: any = await api.post(`/learning-journey/lesson/${roadmap.id}/submit`, {
          nodeId: activeLessonSession.id,
          timeSpentSeconds: Math.round((Date.now() - lessonAttempt.startedAt) / 1000),
          activitiesResult: {
            stepsCompleted: activeLessonSession.activities.length,
            userAnswers,
            attemptId: lessonAttempt.id,
          },
        });
        setLessonOutcome(response?.data || response);
        await fetchJourneyData();
      } else {
        const questions = activeLessonSession.activities.flatMap(getCurriculumQuestions);
        const correct = questions.filter(({ key, answer }) => matchesCurriculumAnswer(userAnswers[key], answer)).length;
        const score = questions.length ? Math.round(100 * correct / questions.length) : 0;
        setLessonOutcome({ score, isPassed: !questions.length || score >= 80 });
      }
      setSessionCompleted(true);
    } catch (err: any) {
      setLessonError(err?.message || 'Chưa lưu được bài học. Bạn có thể thử lại.');
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleApplyPreset = async (preset: RoadmapRecommendation) => {
    setApplyingPreset(true);
    try {
      await api.post('/learning-journey/apply-preset', {
        languageId: activeLanguage.id,
        presetId: preset.id,
        customTitle: preset.title,
        targetLevel: preset.targetLevel,
        learningGoal: preset.learningGoal,
        dailyStudyMinutes: preset.dailyStudyMinutes,
      });
      playCorrectSound();
      await fetchJourneyData();
    } catch (err) {
      console.error('Failed to apply roadmap preset', err);
    } finally {
      setApplyingPreset(false);
    }
  };

  const handleAgreeAndGenerateAIRoadmap = async () => {
    setApplyingPreset(true);
    try {
      await api.post('/learning-journey/apply-preset', {
        languageId: activeLanguage.id,
        customTitle: `Lộ Trình AI Cá Nhân Hóa (${profile?.targetLevel || targetLevel})`,
        targetLevel: profile?.targetLevel || targetLevel,
        learningGoal: profile?.learningGoal || learningGoal,
        dailyStudyMinutes: profile?.dailyStudyMinutes || dailyMinutes,
      });
      setAiAgreed(true);
      playCorrectSound();
      await fetchJourneyData();
    } catch (err) {
      console.error('Failed to generate AI roadmap', err);
      setAiAgreed(true);
    } finally {
      setApplyingPreset(false);
    }
  };

  const handleSaveCustomRoadmap = async () => {
    setApplyingPreset(true);
    try {
      await api.post('/learning-journey/apply-preset', {
        languageId: activeLanguage.id,
        customTitle: customTitle.trim() || undefined,
        targetLevel,
        learningGoal,
        dailyStudyMinutes: dailyMinutes,
      });
      setShowConfigModal(false);
      playCorrectSound();
      await fetchJourneyData();
    } catch (err) {
      console.error('Error saving custom roadmap', err);
      setShowConfigModal(false);
    } finally {
      setApplyingPreset(false);
    }
  };

  const stages: Stage[] = roadmap?.stagesJson || [];
  const progressList = roadmap?.progressList || [];
  const progressMap = new Map<string, any>(progressList.map((p: any) => [p.nodeId, p]));

  const completedCount = roadmap?.completedNodes || 0;
  const totalCount = Math.max(1, roadmap?.totalNodes || 1);
  const overallProgressPct = Math.min(100, Math.round((completedCount / totalCount) * 100));

  // Determine next available lesson
  let firstAvailableNode: { node: LessonNode; chapter: Chapter } | null = null;
  for (const st of stages) {
    for (const ch of st.chapters) {
      for (const les of ch.lessons) {
        const p = progressMap.get(les.id);
        if (!p || p.status === 'AVAILABLE' || p.status === 'IN_PROGRESS' || p.status === 'RETAKE_REQUIRED') {
          firstAvailableNode = { node: les, chapter: ch };
          break;
        }
      }
      if (firstAvailableNode) break;
    }
    if (firstAvailableNode) break;
  }

  // 4-Phase Study Plan Schedule Matrix
  const studyPlanSchedule = useMemo(() => {
    const curLevel = profile?.currentEstimatedLevel || 'A2';
    const tgtLevel = profile?.targetLevel || targetLevel || 'B1';

    return [
      {
        phase: 'Giai đoạn 1 (Tuần 1 - 2)',
        title: 'Củng cố nền móng & Từ vựng cốt lõi',
        outcome: `Làm chủ 200 từ vựng cốt lõi & 15 cấu trúc phản xạ căn bản chuẩn ${curLevel}`,
        schedule: `${dailyMinutes} phút/ngày • 5 ngày/tuần`,
        method: 'Thuật toán lặp lại ngắt quãng FSRS + Flashcard 3D',
        status: 'ĐANG DIỄN RA',
        statusColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      },
      {
        phase: 'Giai đoạn 2 (Tuần 3 - 6)',
        title: 'Tăng tốc phản xạ đàm thoại & Ngữ cảnh',
        outcome: '350 từ vựng tình huống + Phản xạ hỏi đáp tự nhiên dưới 3 giây',
        schedule: `${dailyMinutes} phút/ngày • 5 ngày/tuần`,
        method: 'Active Listening Lab + Shadowing cùng AI Coach',
        status: 'TIẾP THEO',
        statusColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      },
      {
        phase: 'Giai đoạn 3 (Tuần 7 - 10)',
        title: 'Chuyên sâu đa kỹ năng & Đọc hiểu',
        outcome: 'Xử lý văn bản thực tế, báo chí, hợp đồng & hội thoại đa giọng bản ngữ',
        schedule: `${Math.min(45, dailyMinutes + 5)} phút/ngày • 6 ngày/tuần`,
        method: 'Immersion Audio Lab + Dictation chính tả chuyên sâu',
        status: 'SẮP DIỄN RA',
        statusColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      },
      {
        phase: 'Giai đoạn 4 (Tuần 11 - 12)',
        title: `Đạt chuẩn đầu ra & Thi thử chứng chỉ ${tgtLevel}`,
        outcome: `Đạt độ chính xác ≥ 85% trên đề thi mô phỏng và thành thạo cấp độ ${tgtLevel}`,
        schedule: `${Math.min(45, dailyMinutes + 10)} phút/ngày • Toàn diện`,
        method: 'Mock Exam Simulator + Phân tích lỗi sai AI Diagnostic',
        status: 'MỤC TIÊU',
        statusColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      },
    ];
  }, [profile, targetLevel, dailyMinutes]);

  return (
    <div className="w-full space-y-7 animate-fade-in pb-16">
      {/* 1. Header Overview Bar — Electric Blue Brand Themed (#2041F6) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2041F6]/10 via-[#2041F6]/5 to-indigo-500/10 border border-[#2041F6]/30 dark:border-[#2041F6]/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2041F6]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2041F6]/15 border border-[#2041F6]/30 text-[#2041F6] dark:text-blue-300 text-xs font-black uppercase tracking-wider">
              <CountryFlag languageId={activeLanguage.id} size="xs" />
              <span>Hành Trình {activeLanguage.name} • MY LEARNING JOURNEY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>{roadmap?.title || 'Lộ Trình Học Cá Nhân Hóa'}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-[#2041F6]" />
                <span>Trình độ hiện tại: <strong>{profile?.currentEstimatedLevel || 'A2'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mục tiêu: <strong>{profile?.targetLevel || 'B1'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Mỗi ngày: <strong>{profile?.dailyStudyMinutes || dailyMinutes} phút</strong></span>
              </span>
            </div>
          </div>

          {/* Overall Progress Gauge & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
            <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-[200px]">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Tiến trình toàn chặng</span>
                <span className="text-[#2041F6] dark:text-blue-400 font-extrabold">{overallProgressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2041F6] to-indigo-500 transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgressPct}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
                Đã mở khóa {completedCount}/{totalCount} cột mốc tri thức
              </p>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              title="Tùy chỉnh lộ trình và mục tiêu"
            >
              <Sliders className="w-4 h-4 text-[#2041F6]" />
              <span>Tùy biến lộ trình</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AI Personalized Study Plan Table Card (AI Phân Tích & Kế Hoạch Đề Xuất) */}
      <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-xl space-y-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#2041F6] dark:text-blue-400 tracking-wider">
              <BrainCircuit className="w-4 h-4 text-[#2041F6]" />
              <span>KẾ HOẠCH HỌC TẬP AI ĐỀ XUẤT • VOCABFLOW ADAPTIVE ENGINE</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Bảng Kế Hoạch Học Tập Theo Năng Lực ({activeLanguage.name})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Thiết lập lộ trình 4 giai đoạn chuẩn quốc tế hướng tới mục tiêu <strong>{profile?.targetLevel || targetLevel}</strong> ({activeLanguage.name}). Chưa có bài test kiểm tra đầu vào — Hệ thống thiết lập theo chuẩn quốc tế và tự động thích ứng với điểm số làm bài thực tế của bạn.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Tùy chỉnh cấp độ & thời lượng học"
            >
              <Sliders className="w-3.5 h-3.5 text-[#2041F6]" />
              <span>Chọn mục tiêu & cấp độ</span>
            </button>
          </div>
        </div>

        {/* Real Data Diagnostic & Learning Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Tiến độ bài học</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {completedCount}/{totalCount} bài
            </div>
            <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#2041F6] rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Cấp độ mục tiêu</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {profile?.targetLevel || targetLevel}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold truncate">
              {activeLanguage.name} • Lộ trình chuẩn
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Thời lượng học</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {profile?.dailyStudyMinutes || dailyMinutes}p/ngày
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              5 ngày/tuần
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Trạng thái lộ trình</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {completedCount > 0 ? 'Đang kích hoạt' : 'Sẵn sàng'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold truncate">
              {completedCount > 0 ? `${completedCount} bài đã đạt` : 'Bắt đầu bài 1 ngay'}
            </div>
          </div>
        </div>

        {/* Detailed Study Plan Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Giai đoạn</th>
                <th className="py-3 px-4">Mục tiêu năng lực</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4">Phương pháp trọng tâm</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {studyPlanSchedule.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white block">{row.phase}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.title}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-xs leading-relaxed">
                    {row.outcome}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {row.schedule}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-snug">
                    {row.method}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agreement / Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>AI sẽ tự động cập nhật độ khó các bài học sau mỗi lần bạn luyện tập.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleAgreeAndGenerateAIRoadmap}
              disabled={applyingPreset}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#2041F6] hover:bg-[#1a35cc] text-white font-black text-xs shadow-lg shadow-[#2041F6]/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{applyingPreset ? 'Đang tạo lộ trình...' : aiAgreed ? 'Đã Đồng Ý & Kích Hoạt Lộ Trình' : 'Đồng Ý & Khởi Tạo Lộ Trình AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. AI Roadmap Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2041F6] dark:text-blue-400" />
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Gợi Ý Lộ Trình Phù Hợp ({activeLanguage.name})</span>
                <CountryFlag languageId={activeLanguage.id} size="xs" />
              </h2>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-xs font-bold text-[#2041F6] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tùy chỉnh riêng</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.map((rec) => {
              const isCurrentActive =
                roadmap?.title?.toLowerCase().includes(rec.title.toLowerCase()) ||
                (profile?.learningGoal === rec.learningGoal && profile?.targetLevel === rec.targetLevel);
              return (
                <div
                  key={rec.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 bg-white/90 dark:bg-slate-900/90 shadow-sm relative overflow-hidden ${
                    isCurrentActive
                      ? 'border-[#2041F6] ring-2 ring-[#2041F6]/25 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          rec.badgeColor || 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {rec.tag}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                        {rec.estimatedDays} ngày • {rec.dailyStudyMinutes}p/ngày
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {rec.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {rec.highlightSkills?.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(rec)}
                    disabled={applyingPreset}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#2041F6] hover:bg-[#1a35cc] text-white shadow-md shadow-[#2041F6]/20'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Đang theo học</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Áp Dụng Lộ Trình Này</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Guidance Banner if no node selected */}
      {!selectedNode && firstAvailableNode && (
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-3 my-2 animate-fade-in">
          <div className="w-11 h-11 rounded-2xl bg-[#2041F6]/10 text-[#2041F6] flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Bản Đồ Học Tập Đang Mở
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
              Chọn một bài học trên bản đồ để xem chi tiết và bắt đầu rèn luyện.
            </p>
          </div>
          <button
            onClick={() => handleSelectNode(firstAvailableNode!.node, firstAvailableNode!.chapter)}
            className="px-4 py-2.5 rounded-xl bg-[#2041F6] hover:bg-[#1a35cc] text-white text-xs font-black shadow-md shadow-[#2041F6]/25 transition flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Bài tiếp theo: {firstAvailableNode.node.title}</span>
          </button>
        </div>
      )}

      {/* 5. Main Map & Side Detail Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: The Interactive Adventure Map (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-8">
          {stages.map((stage, stageIdx) => (
            <div key={stage.id} className="space-y-6">
              {/* Stage Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-md relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2041F6] text-white">
                    Stage {stageIdx + 1} • {stage.level}
                  </span>
                  <h2 className="text-lg font-black tracking-tight">{stage.title}</h2>
                  <p className="text-xs text-slate-300 font-medium">{stage.description}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
              </div>

              {/* Chapters & Nodes on Map */}
              {stage.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-6"
                >
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#2041F6] dark:text-blue-400">
                        {chapter.biome} BIOME
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {chapter.description}
                      </p>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: chapter.themeColor }}
                    >
                      Checkpoint ≥ 80%
                    </div>
                  </div>

                  {/* Adventure Trail Path: Line placed at the start of stage (left rail), illuminated up to current progress */}
                  <div className="relative py-2 space-y-4">
                    {chapter.lessons.map((lesson, lesIdx) => {
                      const prog = progressMap.get(lesson.id);
                      const status = prog?.status || (lesIdx === 0 ? 'AVAILABLE' : 'LOCKED');
                      const isCompleted = status === 'COMPLETED' || status === 'MASTERED';
                      const isReady = status === 'IN_PROGRESS' || status === 'AVAILABLE' || status === 'RETAKE_REQUIRED';
                      const isSelected = selectedNode?.id === lesson.id;
                      const isCheckpoint = lesson.type === 'CHECKPOINT';
                      const isLast = lesIdx === chapter.lessons.length - 1;

                      // Glow line up to current learned node ("học đến đâu sáng đến đó để ở đầu chặng đi")
                      const isTrailIlluminated = isCompleted;

                      let nodeBg = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700';
                      let badgeIcon = <Lock className="w-4 h-4" />;
                      let statusText = 'Đang khóa';

                      if (status === 'MASTERED') {
                        nodeBg = 'bg-amber-500/15 text-amber-500 border-amber-500 shadow-amber-500/20 shadow-md ring-2 ring-amber-400/30';
                        badgeIcon = <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />;
                        statusText = `Mastered (${prog?.score ?? 0}%)`;
                      } else if (status === 'COMPLETED') {
                        nodeBg = 'bg-emerald-500/15 text-emerald-500 border-emerald-500 shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400/30';
                        badgeIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                        statusText = `Hoàn thành (${prog?.score || 80}%)`;
                      } else if (status === 'IN_PROGRESS' || status === 'AVAILABLE') {
                        nodeBg = 'bg-[#2041F6] text-white border-[#2041F6] shadow-lg shadow-[#2041F6]/40 ring-4 ring-[#2041F6]/25 animate-pulse';
                        badgeIcon = <Play className="w-5 h-5 fill-white ml-0.5" />;
                        statusText = 'Sẵn sàng học';
                      } else if (status === 'RETAKE_REQUIRED') {
                        nodeBg = 'bg-rose-500/15 text-rose-500 border-rose-500 shadow-rose-500/20 shadow-md';
                        badgeIcon = <AlertCircle className="w-5 h-5 text-rose-500" />;
                        statusText = `Cần ôn luyện lại (${prog?.score || 60}%)`;
                      }

                      return (
                        <div
                          key={lesson.id}
                          className="relative flex items-stretch gap-3 sm:gap-4 group"
                        >
                          {/* Left Rail: Milestone Circle + Illuminated Progress Line */}
                          <div className="flex flex-col items-center shrink-0 w-12 sm:w-14 relative z-10">
                            {/* Milestone Circle at start of chặng */}
                            <button
                              type="button"
                              onClick={() => handleSelectNode(lesson, chapter)}
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer ${nodeBg} ${
                                isSelected ? 'scale-105' : 'hover:scale-102'
                              }`}
                              title={statusText}
                            >
                              {badgeIcon}
                            </button>

                            {/* Trail segment to next milestone: glowing only up to user's learned progress */}
                            {!isLast && (
                              <div className="flex-1 w-1.5 min-h-[28px] my-1 rounded-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                <div
                                  className={`w-full h-full transition-all duration-500 ${
                                    isTrailIlluminated
                                      ? 'bg-gradient-to-b from-[#2041F6] via-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(32,65,246,0.85)]'
                                      : isReady
                                      ? 'bg-gradient-to-b from-[#2041F6]/60 to-transparent'
                                      : 'bg-transparent'
                                  }`}
                                />
                              </div>
                            )}
                          </div>

                          {/* Lesson Details Card (full flex width on right) */}
                          <button
                            type="button"
                            onClick={() => handleSelectNode(lesson, chapter)}
                            className={`flex-1 p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#2041F6]/5 dark:bg-[#2041F6]/10 border-[#2041F6] shadow-md ring-2 ring-[#2041F6]/30'
                                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  {isCheckpoint ? 'Checkpoint Sát Hạch' : `Bài ${lesIdx + 1} • ${lesson.type}`}
                                </span>
                                {isCheckpoint && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase border border-amber-500/20">
                                    Điểm mốc
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                <span>{lesson.durationMinutes} phút</span>
                                <span>•</span>
                                <span className={`font-semibold ${
                                  status === 'MASTERED'
                                    ? 'text-amber-500'
                                    : status === 'COMPLETED'
                                    ? 'text-emerald-500'
                                    : status === 'RETAKE_REQUIRED'
                                    ? 'text-rose-500'
                                    : 'text-[#2041F6] dark:text-blue-400'
                                }`}>
                                  {statusText}
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                                isSelected ? 'translate-x-1 text-[#2041F6]' : 'group-hover:text-[#2041F6]'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Column: Node Detail Panel (Sticky) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          {selectedNode ? (
            <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-[#2041F6]/30 dark:border-[#2041F6]/40 shadow-xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#2041F6]/10 text-[#2041F6] dark:text-blue-400 border border-[#2041F6]/20">
                  {selectedNode.type} MODULE
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {selectedNode.durationMinutes} phút • +50 XP
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedNode.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                  {selectedNode.objective}
                </p>
              </div>

              {/* Skills Practiced */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Kỹ Năng Rèn Luyện
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mastery & Attempt Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Trạng thái:</span>
                  <strong className="text-[#2041F6] dark:text-blue-400 font-extrabold uppercase text-[11px]">
                    {selectedNodeProgress?.status || 'Sẵn sàng học'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Điểm cao nhất:</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold">
                    {selectedNodeProgress?.score || 0}%
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số lần làm:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {selectedNodeProgress?.attemptCount || 0} lần
                  </span>
                </div>
              </div>

              {selectedNodeProgress?.status === 'RETAKE_REQUIRED' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                  <strong className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Cần cải thiện năng lực</span>
                  </strong>
                  <p className="text-[11px] leading-relaxed">
                    Điểm số bài học trước đạt {selectedNodeProgress.score}%, dưới ngưỡng yêu cầu 80%. Hãy làm lại bài học để củng cố phản xạ!
                  </p>
                </div>
              )}

              <button
                onClick={() => handleStartLesson(selectedNode)}
                disabled={selectedNodeProgress?.status === 'LOCKED'}
                className="w-full py-4 rounded-2xl bg-[#2041F6] hover:bg-[#1a35cc] disabled:opacity-40 disabled:hover:bg-[#2041F6] text-white font-black text-sm shadow-xl shadow-[#2041F6]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {selectedNodeProgress?.status === 'LOCKED' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Cần hoàn thành bài trước</span>
                  </>
                ) : selectedNodeProgress?.status === 'MASTERED' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Ôn tập lại bài học (Mastered)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Bắt Đầu Bài Học Ngay</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[220px] space-y-2.5">
              <Compass className="w-8 h-8 text-[#2041F6]/70 dark:text-blue-400/70 mb-1 animate-pulse" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold max-w-[240px] leading-relaxed">
                Chọn một bài học trên bản đồ để xem chi tiết mục tiêu và bắt đầu trải nghiệm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Interactive Multi-Activity Lesson Modal */}
      {activeLessonSession && (
        <ModalPortal isOpen={Boolean(activeLessonSession)} onClose={() => setActiveLessonSession(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in my-8 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#2041F6] dark:text-blue-400 tracking-wider">
                  {activeLessonSession.type} SESSION • BƯỚC {currentStep + 1} / 5
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {activeLessonSession.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveLessonSession(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lesson activity progress */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              {activeLessonSession.activities.map((activity) => activity.type).map(
                (stepName, sIdx) => (
                  <div key={sIdx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full h-1.5 rounded-full transition-all ${
                        currentStep === sIdx
                          ? 'bg-[#2041F6]'
                          : currentStep > sIdx
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-extrabold truncate hidden sm:block ${
                        currentStep === sIdx
                          ? 'text-[#2041F6] dark:text-blue-400'
                          : currentStep > sIdx
                          ? 'text-emerald-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {stepName}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Step Body */}
            {!sessionCompleted ? (
              <div className="space-y-6">
                {currentActivity ? (
                  <section className="space-y-4">
                    <h4 className="text-base font-semibold">{currentActivity.title}</h4>
                    <p className="text-sm">{currentActivity.instructions}</p>
                    {currentActivity.content?.items?.map((item: { word?: string; ipa?: string; meaning?: string; example?: string }, index: number) => (
                      <div key={index} className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                        <p className="font-semibold">{item.word} {item.ipa}</p>
                        <p>{item.meaning}</p>
                        {item.example && <p className="mt-1">{item.example}</p>}
                      </div>
                    ))}
                    {['rules', 'templates'].flatMap((key) => Array.isArray(currentActivity.content?.[key]) ? currentActivity.content[key] : []).map((line, index) => (
                      <p key={index} className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{line}</p>
                    ))}
                    {['transcript', 'summary', 'tip', 'rule'].map((key) => typeof currentActivity.content?.[key] === 'string' && (
                      <p key={key} className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{currentActivity.content[key]}</p>
                    ))}
                    {activityQuestions.map(({ key, prompt, options }) => (
                      <fieldset key={key} className="min-w-0 space-y-2">
                        <legend className="mb-2 text-sm font-semibold">{prompt}</legend>
                        {options ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {options.map((option) => (
                              <label key={option} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700">
                                <input type="radio" name={key} value={option} checked={userAnswers[key] === option}
                                  onChange={() => setUserAnswers((previous) => ({ ...previous, [key]: option }))} />
                                {option}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input value={userAnswers[key] ?? ''} aria-label={prompt}
                            onChange={(event) => setUserAnswers((previous) => ({ ...previous, [key]: event.target.value }))}
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3 dark:border-slate-700" />
                        )}
                      </fieldset>
                    ))}
                  </section>
                ) : <p role="status">Bài học chưa có hoạt động.</p>}
                {lessonError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{lessonError}</p>}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>

                  {!lastActivity ? (
                    <button
                      disabled={!currentActivity || !currentAnswered}
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-[#2041F6] hover:bg-[#1a35cc] text-white font-black text-xs shadow-md shadow-[#2041F6]/30 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Bước tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishLesson}
                      disabled={submittingProgress || !currentAnswered}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submittingProgress ? 'Đang lưu...' : 'Hoàn Thành Bài Học'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {lessonOutcome?.isPassed ? 'Đã hoàn thành bài học' : 'Bài học cần luyện thêm'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  {activeLessonSession.activities.flatMap(getCurriculumQuestions).length ? `Điểm bài học: ${lessonOutcome?.score ?? 0}%.` : 'Đã đọc hết nội dung.'}{' '}
                  {roadmap?.isBaseline ? 'Kết quả của bài xem thử chỉ hiển thị ở đây.' : 'Lần làm này đã được lưu vào lộ trình.'}
                </p>

                <button
                  onClick={() => {
                    setActiveLessonSession(null);
                    setSessionCompleted(false);
                  }}
                  className="w-full max-w-sm mx-auto py-3.5 rounded-2xl bg-[#2041F6] hover:bg-[#1a35cc] text-white font-black text-xs shadow-lg shadow-[#2041F6]/30 transition cursor-pointer"
                >
                  Quay lại Bản Đồ Học Tập
                </button>
              </div>
            )}
          </div>
        </ModalPortal>
      )}

      {/* 7. Redesigned Custom Roadmap & Goal Setting Modal (Using ModalPortal + Dimmed Blurred Backdrop + System Styled Selectors) */}
      {showConfigModal && (
        <ModalPortal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2041F6]/10 text-[#2041F6] flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Tùy Chỉnh Lộ Trình ({activeLanguage.name})
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    Hệ thống AI sẽ tái cấu trúc bản đồ học tập dựa trên lựa chọn này
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Custom Title Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên lộ trình riêng (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`VD: Lộ trình chinh phục ${activeLanguage.name} 60 ngày`}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2041F6] focus:ring-2 focus:ring-[#2041F6]/20 transition"
                />
              </div>

              {/* Language-Aware Level Selector Cards (No ugly raw native select!) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Trình độ mục tiêu ({activeLanguage.name})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {getLevelsForLanguage(activeLanguage.id).map((lvl) => {
                    const isSelected = targetLevel === lvl.val;
                    return (
                      <button
                        key={lvl.val}
                        type="button"
                        onClick={() => setTargetLevel(lvl.val)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#2041F6]/10 border-[#2041F6] text-[#2041F6] ring-2 ring-[#2041F6]/20 font-black shadow-xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs">{lvl.val}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 font-mono">
                            {lvl.cefr}
                          </span>
                        </div>
                        <span className="text-[11px] block mt-1 font-medium truncate opacity-90">
                          {lvl.label.replace(/^JLPT\s|^TOPIK\s|^HSK\s|^[A-Z0-9]+\s/, '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Select Cards (System styled cards with icons) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Mục tiêu trọng tâm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {goalOptions.map((g) => {
                    const isSelected = learningGoal === g.id;
                    const IconComp = g.icon;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setLearningGoal(g.id)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-black'
                            : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-extrabold truncate">{g.title}</span>
                        </div>
                        <span className="text-[10px] leading-tight opacity-80 font-medium line-clamp-2">
                          {g.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Minutes Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Thời lượng học mỗi ngày (phút)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 15, 20, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDailyMinutes(m)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        dailyMinutes === m
                          ? 'bg-[#2041F6] text-white border-[#2041F6] shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Concise Save Button as requested by user */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCustomRoadmap}
                disabled={applyingPreset}
                className="flex-1 py-3 rounded-2xl bg-[#2041F6] hover:bg-[#1a35cc] text-white font-black text-xs shadow-lg shadow-[#2041F6]/30 transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{applyingPreset ? 'Đang lưu...' : 'Lưu'}</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
