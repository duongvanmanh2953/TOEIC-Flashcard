import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import { RichAIMessageRenderer } from '../components/ai/RichAIMessageRenderer';
import { VocabFlowLogo } from '@vocabflow/shared';
import { confirmModal } from '../components/common/ConfirmDialog';
import {
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
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Cpu,
  Smile,
  Briefcase,
  GraduationCap,
  Globe,
  Radio,
  FileText,
  Copy,
  Check,
  PhoneCall,
  PhoneOff,
  Headphones,
  Waves,
  Zap,
  Plus,
  X,
  Settings2,
  Trash2,
  Send,
  Clock,
  Lightbulb,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { ModalPortal } from '../components/common/ModalPortal';
import { audioEngine } from '../lib/audioEngine';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { evaluatePronunciation } from '../lib/pronunciationEvaluator';
import { useLearningContext } from '../contexts/LearningContext';
import { getLanguage, SUPPORTED_LANGUAGES, getSpeechLocale } from '../config/languages';
import { CountryFlag } from '../components/language/CountryFlag';

const LANGUAGE_PRACTICE_WORDS: Record<string, Array<{ word: string; ipa: string; phoneme: string; meaning: string }>> = {
  en: [
    { word: 'thoroughly', ipa: '/ˈθɜːrəli/', phoneme: '/θ/', meaning: 'Kỹ lưỡng, thấu đáo' },
    { word: 'schedule', ipa: '/ˈskedʒuːl/', phoneme: '/sk/', meaning: 'Lịch trình, kế hoạch' },
    { word: 'vulnerable', ipa: '/ˈvʌlnərəbl/', phoneme: '/v/', meaning: 'Dễ bị tổn thương' },
    { word: 'architecture', ipa: '/ˈɑːrkɪtektʃər/', phoneme: '/tʃ/', meaning: 'Kiến trúc hệ thống' },
    { word: 'regularly', ipa: '/ˈreɡjələrli/', phoneme: '/r/ & /l/', meaning: 'Thường xuyên' },
  ],
  de: [
    { word: 'Zuverlässigkeit', ipa: '/ˈtsuːfɛɐ̯ˌlɛsɪçkaɪt/', phoneme: '/ç/ & /z/', meaning: 'Sự đáng tin cậy' },
    { word: 'Entwicklung', ipa: '/ɛntˈvɪklʊŋ/', phoneme: '/pf/ & /ŋ/', meaning: 'Sự phát triển' },
    { word: 'Geschwindigkeit', ipa: '/ɡəˈʃvɪndɪçkaɪt/', phoneme: '/ʃv/', meaning: 'Tốc độ, nhanh nhẹn' },
    { word: 'Wunderbar', ipa: '/ˈvʊndɐbaːɐ̯/', phoneme: '/v/ & /r/', meaning: 'Tuyệt vời, kỳ diệu' },
    { word: 'Verständnis', ipa: '/fɛɐ̯ˈʃtɛntnɪs/', phoneme: '/f/ & /ʃt/', meaning: 'Sự thấu hiểu' },
  ],
  ja: [
    { word: '改善', ipa: '/kaizen/', phoneme: 'かいぜん', meaning: 'Cải tiến liên tục' },
    { word: 'ありがとうございます', ipa: '/aɾiɡatoː gozaimasɯ/', phoneme: '有難う', meaning: 'Cảm ơn chân thành' },
    { word: '一生懸命', ipa: '/iɕːoːkeːmeː/', phoneme: 'いっしょうけんめい', meaning: 'Hết sức cố gắng' },
    { word: '素晴らしい', ipa: '/sɯbaɾaɕiː/', phoneme: 'すばらしい', meaning: 'Tuyệt vời' },
    { word: '効率的', ipa: '/koːɾitsɯteki/', phoneme: 'こうりつてき', meaning: 'Mang tính hiệu quả' },
  ],
  zh: [
    { word: '坚持不懈', ipa: '/tɕjɛn˥ ʈʂʰʐ̩˧˥ pu˥˩ ɕjɛ˥˩/', phoneme: 'jiān chí bù xiè', meaning: 'Kiên trì không ngừng nghỉ' },
    { word: '脚踏实地', ipa: '/tɕjaʊ˨˩˦ tʰa˥˩ ʂʐ̩˧˥ ti˥˩/', phoneme: 'jiǎo tà shí dì', meaning: 'Thiết thực, vững vàng' },
    { word: '齐心协力', ipa: '/tɕʰi˧˥ ɕin˥ ɕjɛ˧˥ li˥˩/', phoneme: 'qí xīn xié lì', meaning: 'Đồng tâm hiệp lực' },
    { word: '独具匠心', ipa: '/tu˧˥ tɕy˥˩ tɕjaŋ˥˩ ɕin˥/', phoneme: 'dú jù jiàng xīn', meaning: 'Sáng tạo độc đáo' },
    { word: '蒸蒸日上', ipa: '/ʈʂɤŋ˥ ʈʂɤŋ˥ ʐʐ̩˥˩ ʂaŋ˥˩/', phoneme: 'zhēng zhēng rì shàng', meaning: 'Phát triển ngày một đi lên' },
  ],
  fr: [
    { word: 'Épanouissement', ipa: '/e.pa.nwi.smɑ̃/', phoneme: '/ɑ̃/', meaning: 'Sự nở rộ, thăng hoa' },
    { word: 'Inoubliable', ipa: '/i.nu.bli.jabl/', phoneme: '/bl/', meaning: 'Không thể nào quên' },
    { word: 'Bienveillance', ipa: '/bjɛ̃.vɛ.jɑ̃s/', phoneme: '/bjɛ̃/', meaning: 'Lòng nhân từ, thiện chí' },
    { word: 'Développement', ipa: '/de.vlɔp.mɑ̃/', phoneme: '/mɑ̃/', meaning: 'Sự phát triển bền vững' },
    { word: 'Magnifique', ipa: '/ma.ɲi.fik/', phoneme: '/ɲ/', meaning: 'Tráng lệ, tuyệt đẹp' },
  ],
  es: [
    { word: 'Desarrollo', ipa: '/desaˈroʎo/', phoneme: '/rr/ & /ll/', meaning: 'Sự phát triển' },
    { word: 'Inquebrantable', ipa: '/iŋkeβɾanˈtaβle/', phoneme: '/β/ & /ɾ/', meaning: 'Kiên định, không thể lung lay' },
    { word: 'Agradecimiento', ipa: '/aɣɾaðeθiˈmjento/', phoneme: '/θ/ & /ð/', meaning: 'Lòng biết ơn sâu sắc' },
    { word: 'Maravilloso', ipa: '/maɾaβiˈʎoso/', phoneme: '/ʎ/', meaning: 'Kỳ diệu, tuyệt vời' },
    { word: 'Responsabilidad', ipa: '/responsaβiliˈðað/', phoneme: '/ðað/', meaning: 'Tinh thần trách nhiệm' },
  ],
  ko: [
    { word: '성장', ipa: '/sʰʌ̹ŋdʑa̠ŋ/', phoneme: 'Seongjang', meaning: 'Sự trưởng thành, phát triển' },
    { word: '감사합니다', ipa: '/kam.sa.ham.ni.da/', phoneme: 'Gamsahamnida', meaning: 'Cảm ơn chân thành' },
    { word: '열심히', ipa: '/jʌ̹l.s͈im.hi/', phoneme: 'Yeolsimhi', meaning: 'Chăm chỉ, hết mình' },
    { word: '아름답다', ipa: '/a.ɾɯm.dap̚.t͈a/', phoneme: 'Areumdapda', meaning: 'Đẹp đẽ, tuyệt diệu' },
    { word: '도전하다', ipa: '/to.dʑʌn.ha.da/', phoneme: 'Dojeonhada', meaning: 'Thử thách, chinh phục' },
  ],
};

// ==============================================================================
// 5 PHÒNG LUYỆN CHỨC NĂNG AI COACH STUDIO
// ==============================================================================
export type StudioTabType = 'voice' | 'pronunciation' | 'simulator' | 'error-bank' | 'sound-better';

export interface StudioTabItem {
  id: StudioTabType;
  name: string;
  shortName: string;
  icon: any;
  desc: string;
}

export const STUDIO_TABS: StudioTabItem[] = [
  { id: 'voice', name: 'Voice Coach & Studio', shortName: 'Voice Coach', icon: Mic, desc: 'Đàm thoại 1:1 phản xạ giọng nói' },
  { id: 'pronunciation', name: 'Phòng Luyện Phát Âm (Phoneme Lab)', shortName: 'Luyện Âm', icon: Volume2, desc: 'Chấm điểm âm vị & Shadowing' },
  { id: 'simulator', name: 'Mô Phỏng Tình Huống (Roleplay)', shortName: 'Mô Phỏng', icon: Briefcase, desc: 'Phỏng vấn Tech & Công sở' },
  { id: 'error-bank', name: 'Ngân Hàng Lỗi Sai (Error Heatmap)', shortName: 'Lỗi Sai', icon: BrainCircuit, desc: 'Bản đồ nhiệt & Sửa lỗi gốc' },
  { id: 'sound-better', name: 'Make Me Sound Better (Bản Xứ Hóa)', shortName: 'Bản Xứ Hóa', icon: Sparkles, desc: 'Nâng cấp câu nói sang chuẩn bản xứ' },
];

export interface ScenarioItem {
  id: string;
  name: string;
  shortName: string;
  desc: string;
}

export const SIMULATOR_SCENARIOS: ScenarioItem[] = [
  { id: 'job_interview', name: 'Phỏng Vấn Tech Job', shortName: 'Phỏng Vấn Tech', desc: 'Đối thoại với Giám đốc Kỹ thuật về kinh nghiệm và xử lý sự cố.' },
  { id: 'bug_delay_meeting', name: 'Giải Trình Hoãn Release', shortName: 'Hoãn Release', desc: 'Thuyết phục VP Sản phẩm về việc lùi thời gian do bug nghiêm trọng.' },
  { id: 'salary_negotiation', name: 'Đàm Phán Tăng Lương', shortName: 'Đàm Phán Lương', desc: 'Đưa ra luận điểm tăng 25% thu nhập dựa trên hiệu suất.' },
  { id: 'dining_out', name: 'Gọi Món Nhà Hàng', shortName: 'Gọi Món', desc: 'Yêu cầu món ăn theo chế độ ăn uống và hỏi kỹ thành phần.' },
];

// ==============================================================================
// CHỢ TRỢ LÝ GIA SƯ AI VOCABFLOW (TUTOR PERSONA MARKETPLACE)
// ==============================================================================
export interface TutorPersonaTheme {
  chipActive: string;
  chipInactive: string;
  avatarBg: string;
  ringColor: string;
  dotColor: string;
}

export interface TutorPersona {
  id: string;
  name: string;
  vietnameseTitle: string;
  avatar: string;
  tag: string;
  badgeColor: string;
  accent: string;
  description: string;
  specialty: string[];
  greeting: string;
  theme: TutorPersonaTheme;
  languageId?: string;
  preferredGender?: 'male' | 'female';
  preferredLocale?: string;
}

export const LANGUAGE_TUTOR_PERSONAS: Record<string, TutorPersona[]> = {
  // ==================== CHINESE (TIẾNG TRUNG) ====================
  zh: [
    {
      id: 'zh_wang_laoshi',
      name: 'Wang Laoshi (王老师)',
      vietnameseTitle: 'Thầy Chuẩn Bắc Kinh',
      avatar: '🇨🇳',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
      accent: 'Phổ Thông Bắc Kinh (Standard Mandarin)',
      description: 'Phát âm chuẩn âm cuốn lưỡi, 4 thanh điệu chính xác, kiên nhẫn hướng dẫn giao tiếp khẩu ngữ.',
      specialty: ['Phát âm Pinyin', 'Thanh điệu chuẩn', 'Khẩu ngữ hàng ngày'],
      greeting: '你好！我是王老师。学好普通话，声调和发音是关键。让我们一起轻松开口说中文吧！',
      languageId: 'zh',
      preferredGender: 'male',
      preferredLocale: 'zh-CN',
      theme: {
        chipActive: 'bg-red-600 text-white shadow-red-500/25',
        chipInactive: 'bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300/80 dark:border-red-800/70 hover:bg-red-100',
        avatarBg: 'bg-red-100/90 dark:bg-red-950/70 border-red-300/80 dark:border-red-700',
        ringColor: 'border-red-500 ring-2 ring-red-500/30',
        dotColor: 'bg-red-500',
      },
    },
    {
      id: 'zh_li_na',
      name: 'Li Na (李娜)',
      vietnameseTitle: 'Bạn Tán Gẫu Bản Xứ',
      avatar: '👩‍🏫',
      tag: 'Đời sống & Khẩu ngữ',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accent: 'Khẩu Ngữ Đời Thường',
      description: 'Trò chuyện tự nhiên như bạn bè WeChat, chia sẻ từ lóng mạng và phản xạ giao tiếp đời sống.',
      specialty: ['Khẩu ngữ đời sống', 'Từ lóng WeChat', 'Giao tiếp phản xạ'],
      greeting: '嗨！我是李娜。今天过得怎么样？不用拘谨，有什么想聊的尽管和我说哦！',
      languageId: 'zh',
      preferredGender: 'female',
      preferredLocale: 'zh-CN',
      theme: {
        chipActive: 'bg-emerald-600 text-white shadow-emerald-500/25',
        chipInactive: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70 hover:bg-emerald-100',
        avatarBg: 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-700',
        ringColor: 'border-emerald-500 ring-2 ring-emerald-500/30',
        dotColor: 'bg-emerald-500',
      },
    },
    {
      id: 'zh_zhang_wei',
      name: 'Zhang Wei (张伟)',
      vietnameseTitle: 'Chuyên Gia Luyện Thi HSK',
      avatar: '🎯',
      tag: 'HSK 1-6 & Học thuật',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      accent: 'Học Thuật Chuẩn Mực',
      description: 'Chuyên sâu ngữ pháp HSK, bổ ngữ kết quả, câu chữ 把/被 và sửa lỗi câu chuẩn mực.',
      specialty: ['Ngữ pháp HSK', 'Bổ ngữ trạng thái', 'Sửa lỗi hành văn'],
      greeting: '你好！我是张伟老师。无论你备考HSK几级，我都会帮你夯实语法基础，精准纠错。',
      languageId: 'zh',
      preferredGender: 'male',
      preferredLocale: 'zh-CN',
      theme: {
        chipActive: 'bg-indigo-600 text-white shadow-indigo-500/25',
        chipInactive: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/70 hover:bg-indigo-100',
        avatarBg: 'bg-indigo-100/90 dark:bg-indigo-950/70 border-indigo-300/80 dark:border-indigo-700',
        ringColor: 'border-indigo-500 ring-2 ring-indigo-500/30',
        dotColor: 'bg-indigo-500',
      },
    },
    {
      id: 'zh_chen_jing',
      name: 'Chen Jing (陈静)',
      vietnameseTitle: 'Đồng Nghiệp Thương Mại',
      avatar: '💼',
      tag: 'Tiếng Trung Công Sở',
      badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
      accent: 'Thương Mại & Đàm Phán',
      description: 'Luyện giao tiếp văn phòng, đàm phán hợp đồng, xuất nhập khẩu và kỹ năng họp trực tuyến.',
      specialty: ['Tiếng Trung Thương Mại', 'Đàm phán thương vụ', 'Email & Họp công sở'],
      greeting: '您好！我是陈静。今天我们来模拟商务会议与业务洽谈，做好准备了吗？',
      languageId: 'zh',
      preferredGender: 'female',
      preferredLocale: 'zh-CN',
      theme: {
        chipActive: 'bg-teal-600 text-white shadow-teal-500/25',
        chipInactive: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/70 hover:bg-teal-100',
        avatarBg: 'bg-teal-100/90 dark:bg-teal-950/70 border-teal-300/80 dark:border-teal-700',
        ringColor: 'border-teal-500 ring-2 ring-teal-500/30',
        dotColor: 'bg-teal-500',
      },
    },
    {
      id: 'zh_xiao_yu',
      name: 'Xiao Yu (小雨)',
      vietnameseTitle: 'Thần Tượng & C-Pop',
      avatar: '✨',
      tag: 'Văn hóa & Phim ảnh',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      accent: 'Giọng Nam Phương Nhẹ Nhàng',
      description: 'Giọng điệu truyền cảm, luyện nói qua phim ảnh, bài hát C-Pop và văn hóa ẩm thực Trung Hoa.',
      specialty: ['Học qua C-Pop', 'Hội thoại phim ảnh', 'Ngữ điệu tự nhiên'],
      greeting: '哈喽！我是小雨。让我们一边聊喜欢的电影和音乐，一边快乐学中文吧！',
      languageId: 'zh',
      preferredGender: 'female',
      preferredLocale: 'zh-CN',
      theme: {
        chipActive: 'bg-amber-600 text-white shadow-amber-500/25',
        chipInactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 hover:bg-amber-100',
        avatarBg: 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700',
        ringColor: 'border-amber-500 ring-2 ring-amber-500/30',
        dotColor: 'bg-amber-500',
      },
    },
  ],

  // ==================== JAPANESE (TIẾNG NHẬT) ====================
  ja: [
    {
      id: 'ja_kenji_sato',
      name: 'Kenji Sato (佐藤 健二)',
      vietnameseTitle: 'Thầy Chuẩn Tokyo',
      avatar: '🇯🇵',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      accent: 'Tokyo Hyoujungo (Chuẩn Tokyo)',
      description: 'Ngữ điệu chuẩn Tokyo, giải thích ngữ pháp tỉ mỉ, trọng âm cao thấp (pitch accent) rõ ràng.',
      specialty: ['Pitch Accent Tokyo', 'Ngữ pháp sơ-trung cấp', 'Hội thoại tự nhiên'],
      greeting: 'こんにちは！佐藤健二です。標準的な東京アクセントで、自然な日本語を身につけましょう！',
      languageId: 'ja',
      preferredGender: 'male',
      preferredLocale: 'ja-JP',
      theme: {
        chipActive: 'bg-rose-600 text-white shadow-rose-500/25',
        chipInactive: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70 hover:bg-rose-100',
        avatarBg: 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300/80 dark:border-rose-700',
        ringColor: 'border-rose-500 ring-2 ring-rose-500/30',
        dotColor: 'bg-rose-500',
      },
    },
    {
      id: 'ja_yumi_tanaka',
      name: 'Yumi Tanaka (田中 由美)',
      vietnameseTitle: 'Cô Giáo Lịch Sự Keigo',
      avatar: '👩‍🏫',
      tag: 'Hội thoại & Kính ngữ',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accent: 'Nhẹ Nhàng & Lịch Thiệp',
      description: 'Kiên nhẫn, chuyên về giao tiếp thường nhật, văn hóa ứng xử và kính ngữ Keigo.',
      specialty: ['Keigo & Lịch sự', 'Hội thoại đời sống', 'Giao tiếp hàng ngày'],
      greeting: 'はじめまして、田中由美です。日常会話から敬語まで、優しくサポートしますね。',
      languageId: 'ja',
      preferredGender: 'female',
      preferredLocale: 'ja-JP',
      theme: {
        chipActive: 'bg-emerald-600 text-white shadow-emerald-500/25',
        chipInactive: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70 hover:bg-emerald-100',
        avatarBg: 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-700',
        ringColor: 'border-emerald-500 ring-2 ring-emerald-500/30',
        dotColor: 'bg-emerald-500',
      },
    },
    {
      id: 'ja_daiki_takahashi',
      name: 'Daiki Takahashi (高橋 大树)',
      vietnameseTitle: 'Giám Khảo Luyện JLPT',
      avatar: '🎯',
      tag: 'JLPT N5-N1',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      accent: 'Học Thuật Chuyên Sâu',
      description: 'Luyện thi JLPT thực chiến, phân tích ngữ pháp bẫy và kỹ năng nghe hiểu choukai.',
      specialty: ['Luyện thi JLPT', 'Nghe hiểu Choukai', 'Đọc hiểu Dokkai'],
      greeting: 'こんにちは、高橋です。JLPT合格に向けて、文法と聴解の要点を効率よくトレーニングしましょう。',
      languageId: 'ja',
      preferredGender: 'male',
      preferredLocale: 'ja-JP',
      theme: {
        chipActive: 'bg-indigo-600 text-white shadow-indigo-500/25',
        chipInactive: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/70 hover:bg-indigo-100',
        avatarBg: 'bg-indigo-100/90 dark:bg-indigo-950/70 border-indigo-300/80 dark:border-indigo-700',
        ringColor: 'border-indigo-500 ring-2 ring-indigo-500/30',
        dotColor: 'bg-indigo-500',
      },
    },
    {
      id: 'ja_sakura_mori',
      name: 'Sakura Mori (森 さくら)',
      vietnameseTitle: 'Bạn Tán Gẫu Anime',
      avatar: '🌸',
      tag: 'Văn hóa Giới trẻ',
      badgeColor: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
      accent: 'Trẻ Trung Tự Nhiên',
      description: 'Nói chuyện vui vẻ, tự nhiên qua Anime, Manga, J-Pop và đời sống giới trẻ Nhật Bản.',
      specialty: ['Tiếng lóng Anime', 'Văn hóa Manga', 'Phản xạ đời thường'],
      greeting: 'やっほー！さくらです。アニメや日本の流行について、リラックスしておしゃべりしましょう！',
      languageId: 'ja',
      preferredGender: 'female',
      preferredLocale: 'ja-JP',
      theme: {
        chipActive: 'bg-pink-600 text-white shadow-pink-500/25',
        chipInactive: 'bg-pink-50/80 dark:bg-pink-950/40 text-pink-900 dark:text-pink-300 border-pink-300/80 dark:border-pink-800/70 hover:bg-pink-100',
        avatarBg: 'bg-pink-100/90 dark:bg-pink-950/70 border-pink-300/80 dark:border-pink-700',
        ringColor: 'border-pink-500 ring-2 ring-pink-500/30',
        dotColor: 'bg-pink-500',
      },
    },
  ],

  // ==================== KOREAN (TIẾNG HÀN) ====================
  ko: [
    {
      id: 'ko_kim_minjun',
      name: 'Kim Min-jun (김민준)',
      vietnameseTitle: 'Thầy Chuẩn Seoul',
      avatar: '🇰🇷',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      accent: 'Chuẩn Seoul (표준어)',
      description: 'Giọng chuẩn Seoul thanh lịch, nhấn nhá đúng quy tắc biến âm và nối âm tiếng Hàn.',
      specialty: ['Quy tắc biến âm', 'Chuẩn Seoul', 'Luyện phát âm Hangul'],
      greeting: '안녕하세요! 김민준입니다. 정확한 표준어 발음과 자연스러운 억양을 함께 연습해 봐요.',
      languageId: 'ko',
      preferredGender: 'male',
      preferredLocale: 'ko-KR',
      theme: {
        chipActive: 'bg-sky-600 text-white shadow-sky-500/25',
        chipInactive: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/70 hover:bg-sky-100',
        avatarBg: 'bg-sky-100/90 dark:bg-sky-950/70 border-sky-300/80 dark:border-sky-700',
        ringColor: 'border-sky-500 ring-2 ring-sky-500/30',
        dotColor: 'bg-sky-500',
      },
    },
    {
      id: 'ko_park_jieun',
      name: 'Park Ji-eun (박지은)',
      vietnameseTitle: 'Giao Tiếp K-Drama',
      avatar: '👩‍🏫',
      tag: 'Đời sống & K-Pop',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      accent: 'Thân Thiện Hàng Ngày',
      description: 'Học tiếng Hàn sinh động qua lời thoại phim truyền hình Hàn Quốc, K-Pop và đời sống thường nhật.',
      specialty: ['Hội thoại K-Drama', 'Tiếng lóng giới trẻ', 'Giao tiếp đời sống'],
      greeting: '반가워요! 박지은입니다. 드라마 속 생생한 대화로 한국어를 쉽고 재미있게 배워보세요!',
      languageId: 'ko',
      preferredGender: 'female',
      preferredLocale: 'ko-KR',
      theme: {
        chipActive: 'bg-rose-600 text-white shadow-rose-500/25',
        chipInactive: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70 hover:bg-rose-100',
        avatarBg: 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300/80 dark:border-rose-700',
        ringColor: 'border-rose-500 ring-2 ring-rose-500/30',
        dotColor: 'bg-rose-500',
      },
    },
    {
      id: 'ko_lee_seungwoo',
      name: 'Lee Seung-woo (이승우)',
      vietnameseTitle: 'Tiếng Hàn Công Sở',
      avatar: '💼',
      tag: 'Business & TOPIK',
      badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
      accent: 'Trang Trọng & Phỏng Vấn',
      description: 'Luyện đuôi câu kính trọng -ㅂ니다/습니다, giao tiếp nơi công sở và chuẩn bị phỏng vấn TOPIK.',
      specialty: ['Kính ngữ công sở', 'Luyện thi TOPIK', 'Phỏng vấn xin việc'],
      greeting: '안녕하십니까! 이승우입니다. 비즈니스 한국어와 면접 대비 실전 감각을 키워드리겠습니다.',
      languageId: 'ko',
      preferredGender: 'male',
      preferredLocale: 'ko-KR',
      theme: {
        chipActive: 'bg-teal-600 text-white shadow-teal-500/25',
        chipInactive: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/70 hover:bg-teal-100',
        avatarBg: 'bg-teal-100/90 dark:bg-teal-950/70 border-teal-300/80 dark:border-teal-700',
        ringColor: 'border-teal-500 ring-2 ring-teal-500/30',
        dotColor: 'bg-teal-500',
      },
    },
  ],

  // ==================== FRENCH (TIẾNG PHÁP) ====================
  fr: [
    {
      id: 'fr_pierre_dubois',
      name: 'Pierre Dubois',
      vietnameseTitle: 'Thầy Chuẩn Paris',
      avatar: '🇫🇷',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      accent: 'Parisian Standard French',
      description: 'Giọng Paris chuẩn mực, thanh lịch, chỉnh âm mũi và nối âm liaison mượt mà.',
      specialty: ['Âm mũi & Liaison', 'Ngữ pháp DELF', 'Văn phong học thuật'],
      greeting: 'Bonjour ! Je m\'appelle Pierre. Travaillons ensemble votre français avec un accent parisien soigné et élégant.',
      languageId: 'fr',
      preferredGender: 'male',
      preferredLocale: 'fr-FR',
      theme: {
        chipActive: 'bg-blue-600 text-white shadow-blue-500/25',
        chipInactive: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-800/70 hover:bg-blue-100',
        avatarBg: 'bg-blue-100/90 dark:bg-blue-950/70 border-blue-300/80 dark:border-blue-700',
        ringColor: 'border-blue-500 ring-2 ring-blue-500/30',
        dotColor: 'bg-blue-500',
      },
    },
    {
      id: 'fr_amelie_laurent',
      name: 'Amélie Laurent',
      vietnameseTitle: 'Bạn Tán Gẫu Đời Thường',
      avatar: '👩‍🏫',
      tag: 'Đời sống & Văn hóa',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      accent: 'Giao Tiếp Tự Nhiên',
      description: 'Trò chuyện cởi mở về văn hóa, ẩm thực Pháp, dùng từ ngữ thông dụng đời sống hàng ngày.',
      specialty: ['Khẩu ngữ Pháp', 'Văn hóa ẩm thực', 'Phản xạ đời sống'],
      greeting: 'Coucou ! Moi c\'est Amélie. Parlons de façon détendue et découvrons la richesse de la langue française au quotidien !',
      languageId: 'fr',
      preferredGender: 'female',
      preferredLocale: 'fr-FR',
      theme: {
        chipActive: 'bg-rose-600 text-white shadow-rose-500/25',
        chipInactive: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70 hover:bg-rose-100',
        avatarBg: 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300/80 dark:border-rose-700',
        ringColor: 'border-rose-500 ring-2 ring-rose-500/30',
        dotColor: 'bg-rose-500',
      },
    },
  ],

  // ==================== GERMAN (TIẾNG ĐỨC) ====================
  de: [
    {
      id: 'de_lukas_weber',
      name: 'Lukas Weber',
      vietnameseTitle: 'Thầy Chuẩn Berlin',
      avatar: '🇩🇪',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      accent: 'Standard Hochdeutsch (Berlin)',
      description: 'Hochdeutsch chuẩn mực, rèn luyện cấu trúc câu phức, giống từ der/die/das và biến cách Kasus.',
      specialty: ['Ngữ pháp Kasus', 'Giống danh từ', 'Goethe-Zertifikat'],
      greeting: 'Hallo! Mein Name ist Lukas. Ich helfe dir dabei, fehlerfreies Hochdeutsch mit präziser Grammatik zu sprechen.',
      languageId: 'de',
      preferredGender: 'male',
      preferredLocale: 'de-DE',
      theme: {
        chipActive: 'bg-amber-600 text-white shadow-amber-500/25',
        chipInactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 hover:bg-amber-100',
        avatarBg: 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700',
        ringColor: 'border-amber-500 ring-2 ring-amber-500/30',
        dotColor: 'bg-amber-500',
      },
    },
    {
      id: 'de_hanna_schmidt',
      name: 'Hanna Schmidt',
      vietnameseTitle: 'Giao Tiếp Cuộc Sống Đức',
      avatar: '👩‍🏫',
      tag: 'Đời sống & Hội thoại',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accent: 'Thân Thiện Hàng Ngày',
      description: 'Đồng hành luyện nói không áp lực, làm quen với đời sống du học và làm việc tại Đức.',
      specialty: ['Giao tiếp đời sống', 'Đời sống du học sinh', 'Small Talk thường nhật'],
      greeting: 'Guten Tag! Ich bin Hanna. Lass uns ganz ungezwungen Deutsch üben – Schritt für Schritt zum Erfolg!',
      languageId: 'de',
      preferredGender: 'female',
      preferredLocale: 'de-DE',
      theme: {
        chipActive: 'bg-emerald-600 text-white shadow-emerald-500/25',
        chipInactive: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70 hover:bg-emerald-100',
        avatarBg: 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-700',
        ringColor: 'border-emerald-500 ring-2 ring-emerald-500/30',
        dotColor: 'bg-emerald-500',
      },
    },
  ],

  // ==================== SPANISH (TIẾNG TÂY BAN NHA) ====================
  es: [
    {
      id: 'es_carlos_rodriguez',
      name: 'Carlos Rodriguez',
      vietnameseTitle: 'Thầy Chuẩn Madrid',
      avatar: '🇪🇸',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
      accent: 'Castilian Spanish (Madrid)',
      description: 'Ngữ điệu Tây Ban Nha chính gốc Madrid, rèn luyện phát âm chữ R rung và ngữ pháp DELE.',
      specialty: ['Âm R rung chuẩn', 'Ngữ pháp DELE', 'Giao tiếp chuẩn mực'],
      greeting: '¡Hola! Soy Carlos de Madrid. Practiquemos español auténtico con excelente pronunciación y ritmo natural.',
      languageId: 'es',
      preferredGender: 'male',
      preferredLocale: 'es-ES',
      theme: {
        chipActive: 'bg-red-600 text-white shadow-red-500/25',
        chipInactive: 'bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300/80 dark:border-red-800/70 hover:bg-red-100',
        avatarBg: 'bg-red-100/90 dark:bg-red-950/70 border-red-300/80 dark:border-red-700',
        ringColor: 'border-red-500 ring-2 ring-red-500/30',
        dotColor: 'bg-red-500',
      },
    },
    {
      id: 'es_sofia_martinez',
      name: 'Sofia Martinez',
      vietnameseTitle: 'Bạn Tán Gẫu Mỹ Latin',
      avatar: '🌮',
      tag: 'Mỹ Latin Thân Thiện',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      accent: 'Latin American Spanish (Mexico)',
      description: 'Giọng điệu Mỹ Latin vui tươi, gần gũi, nhiều biểu cảm đời thường sinh động.',
      specialty: ['Español Latino', 'Hội thoại đời sống', 'Phản xạ vui tươi'],
      greeting: '¡Hola a todos! Soy Sofía. Vamos a conversar alegremente y a dominar el español de la vida real.',
      languageId: 'es',
      preferredGender: 'female',
      preferredLocale: 'es-MX',
      theme: {
        chipActive: 'bg-amber-600 text-white shadow-amber-500/25',
        chipInactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 hover:bg-amber-100',
        avatarBg: 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700',
        ringColor: 'border-amber-500 ring-2 ring-amber-500/30',
        dotColor: 'bg-amber-500',
      },
    },
  ],

  // ==================== ENGLISH (TIẾNG ANH) ====================
  en: [
    {
      id: 'Friendly Tutor',
      name: 'Alex Johnson',
      vietnameseTitle: 'Gia sư Thân Thiện',
      avatar: '👨‍🏫',
      tag: 'Phổ biến nhất',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accent: 'US Neutral',
      description: 'Kiên nhẫn, luôn động viên và cổ vũ bạn nói tự tin mà không sợ sai sót.',
      specialty: ['Giao tiếp cơ bản', 'Sửa lỗi nhẹ nhàng', 'Tạo động lực học tập'],
      greeting: 'Hello there! I am Alex. Let\'s practice speaking comfortably and build your confidence together!',
      languageId: 'en',
      preferredGender: 'male',
      preferredLocale: 'en-US',
      theme: {
        chipActive: 'bg-emerald-600 text-white shadow-emerald-500/25',
        chipInactive: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70 hover:bg-emerald-100',
        avatarBg: 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-700',
        ringColor: 'border-emerald-500 ring-2 ring-emerald-500/30',
        dotColor: 'bg-emerald-500',
      },
    },
    {
      id: 'Strict Teacher',
      name: 'Ms. Clara Vance',
      vietnameseTitle: 'Giáo viên Nghiêm Khắc',
      avatar: '👩‍🏫',
      tag: 'Học thuật & Luyện thi',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      accent: 'UK Academic',
      description: 'Chỉnh lỗi ngữ pháp, thì và chia động từ nghiêm túc, đặt độ chính xác lên hàng đầu.',
      specialty: ['Ngữ pháp chuyên sâu', 'Sửa lỗi từng câu', 'Chuẩn văn phong'],
      greeting: 'Good day. I am Ms. Clara. I will closely monitor your grammar, sentence structure, and vocabulary precision.',
      languageId: 'en',
      preferredGender: 'female',
      preferredLocale: 'en-GB',
      theme: {
        chipActive: 'bg-rose-600 text-white shadow-rose-500/25',
        chipInactive: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70 hover:bg-rose-100',
        avatarBg: 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300/80 dark:border-rose-700',
        ringColor: 'border-rose-500 ring-2 ring-rose-500/30',
        dotColor: 'bg-rose-500',
      },
    },
    {
      id: 'Interview Coach',
      name: 'David Chen',
      vietnameseTitle: 'Chuyên gia Phỏng Vấn',
      avatar: '🎯',
      tag: 'Sự nghiệp & Việc làm',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      accent: 'US Corporate',
      description: 'Chuyên rèn luyện phỏng vấn xin việc tiếng Anh, phương pháp STAR và đàm phán lương.',
      specialty: ['Mock Interview', 'STAR Method', 'Business English'],
      greeting: 'Welcome! I am David. Let\'s sharpen your interview storytelling and professional responses today.',
      languageId: 'en',
      preferredGender: 'male',
      preferredLocale: 'en-US',
      theme: {
        chipActive: 'bg-indigo-600 text-white shadow-indigo-500/25',
        chipInactive: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/70 hover:bg-indigo-100',
        avatarBg: 'bg-indigo-100/90 dark:bg-indigo-950/70 border-indigo-300/80 dark:border-indigo-700',
        ringColor: 'border-indigo-500 ring-2 ring-indigo-500/30',
        dotColor: 'bg-indigo-500',
      },
    },
    {
      id: 'Casual Friend',
      name: 'Chloe Miller',
      vietnameseTitle: 'Bạn Tán Gẫu Bản Xứ',
      avatar: '☕',
      tag: 'Đời sống & Tiếng lóng',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      accent: 'US Casual',
      description: 'Nói chuyện tự nhiên như bạn bè cafe, dùng tiếng lóng, thành ngữ đời thường.',
      specialty: ['Daily Slang', 'Small Talk', 'Phản xạ đời sống'],
      greeting: 'Hey there! I am Chloe. Tell me what\'s on your mind today — let\'s keep it fun and casual!',
      languageId: 'en',
      preferredGender: 'female',
      preferredLocale: 'en-US',
      theme: {
        chipActive: 'bg-amber-600 text-white shadow-amber-500/25',
        chipInactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 hover:bg-amber-100',
        avatarBg: 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700',
        ringColor: 'border-amber-500 ring-2 ring-amber-500/30',
        dotColor: 'bg-amber-500',
      },
    },
    {
      id: 'Work Colleague',
      name: 'Marcus Sterling',
      vietnameseTitle: 'Đồng Nghiệp Công Sở',
      avatar: '💼',
      tag: 'Văn phòng quốc tế',
      badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
      accent: 'Global English',
      description: 'Luyện viết email, thuyết trình và thảo luận dự án chuyên nghiệp với đồng nghiệp.',
      specialty: ['Business Email', 'Họp trực tuyến', 'Đàm phán công việc'],
      greeting: 'Hi colleague! I am Marcus. How are your current work deliverables and project meetings going?',
      languageId: 'en',
      preferredGender: 'male',
      preferredLocale: 'en-US',
      theme: {
        chipActive: 'bg-teal-600 text-white shadow-teal-500/25',
        chipInactive: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/70 hover:bg-teal-100',
        avatarBg: 'bg-teal-100/90 dark:bg-teal-950/70 border-teal-300/80 dark:border-teal-700',
        ringColor: 'border-teal-500 ring-2 ring-teal-500/30',
        dotColor: 'bg-teal-500',
      },
    },
    {
      id: 'American Coach',
      name: 'Jack O\'Connor',
      vietnameseTitle: 'Thầy Bản Xứ Mỹ',
      avatar: '🇺🇸',
      tag: 'General American',
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      accent: 'US Native',
      description: 'Ngữ điệu Mỹ chuẩn (General American), nuốt âm, nối âm tự nhiên như người bản xứ.',
      specialty: ['Nối âm Linking', 'Flap T & Schwa', 'Phim ảnh Hollywood'],
      greeting: 'What\'s up! I\'m Jack from California. Let\'s practice sounding authentic with genuine American rhythm!',
      languageId: 'en',
      preferredGender: 'male',
      preferredLocale: 'en-US',
      theme: {
        chipActive: 'bg-sky-600 text-white shadow-sky-500/25',
        chipInactive: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/70 hover:bg-sky-100',
        avatarBg: 'bg-sky-100/90 dark:bg-sky-950/70 border-sky-300/80 dark:border-sky-700',
        ringColor: 'border-sky-500 ring-2 ring-sky-500/30',
        dotColor: 'bg-sky-500',
      },
    },
    {
      id: 'British Coach',
      name: 'Emma Watson-Hill',
      vietnameseTitle: 'Cô Bản Xứ Anh',
      avatar: '🇬🇧',
      tag: 'Received Pronunciation',
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
      accent: 'UK Royal RP',
      description: 'Giọng Anh chuẩn Hoàng Gia quý phái, trọng âm và nhịp điệu tao nhã, chuẩn mực.',
      specialty: ['RP Accent', 'Formal Vocab', 'IELTS Speaking'],
      greeting: 'Good day! I am Emma. I am thrilled to accompany you on your journey towards polished British pronunciation.',
      languageId: 'en',
      preferredGender: 'female',
      preferredLocale: 'en-GB',
      theme: {
        chipActive: 'bg-purple-600 text-white shadow-purple-500/25',
        chipInactive: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/70 hover:bg-purple-100',
        avatarBg: 'bg-purple-100/90 dark:bg-purple-950/70 border-purple-300/80 dark:border-purple-700',
        ringColor: 'border-purple-500 ring-2 ring-purple-500/30',
        dotColor: 'bg-purple-500',
      },
    },
    {
      id: 'IELTS Master',
      name: 'Dr. Gregory Hall',
      vietnameseTitle: 'Giám Khảo Luyện Thi',
      avatar: '🏆',
      tag: 'Target Band 7.5+',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      accent: 'Academic Exam',
      description: 'Mô phỏng Speaking Part 1, 2, 3 và phân tích chi tiết tiêu chí Lexical Resource & Fluency.',
      specialty: ['Speaking Part 1-3', 'Lexical Resource', 'Fluency & Coherence'],
      greeting: 'Hello. I am Dr. Gregory. Let\'s begin your mock speaking examination and target Band 7.5+ performance.',
      languageId: 'en',
      preferredGender: 'male',
      preferredLocale: 'en-GB',
      theme: {
        chipActive: 'bg-amber-600 text-white shadow-amber-500/25',
        chipInactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 hover:bg-amber-100',
        avatarBg: 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700',
        ringColor: 'border-amber-500 ring-2 ring-amber-500/30',
        dotColor: 'bg-amber-500',
      },
    },
  ],
};

export const getTutorsForLanguage = (langId: string): TutorPersona[] => {
  const code = (langId || 'en').toLowerCase();
  return LANGUAGE_TUTOR_PERSONAS[code] || LANGUAGE_TUTOR_PERSONAS.en;
};

export const TUTOR_PERSONA_MARKET: TutorPersona[] = LANGUAGE_TUTOR_PERSONAS.en;

export const getAILanguageFallbackReply = (langId: string, langName: string): string => {
  const fallbacks: Record<string, string> = {
    zh: '我清楚听到你的回答了！让我们继续用中文练习吧。你接下来想探讨什么内容？',
    ja: 'しっかり聞き取れましたよ！引き続き日本語で練習しましょう。次はどんなことについて話したいですか？',
    ko: '잘 들었습니다! 계속해서 한국어로 연습해 볼까요? 다음으로 어떤 주제를 이야기하고 싶으신가요?',
    fr: 'Je vous ai bien entendu ! Continuons à pratiquer en français. De quoi aimeriez-vous parler ensuite ?',
    de: 'Ich habe dich gut verstanden! Lass uns weiter auf Deutsch üben. Was möchtest du als Nächstes ausprobieren?',
    es: '¡Te escuché con claridad! Sigamos practicando en español. ¿Qué te gustaría explorar ahora?',
    en: 'I heard you clearly! Let\'s continue practicing English. What would you like to explore next?',
  };
  return fallbacks[langId] || `I heard you clearly! Let's continue practicing ${langName}. What would you like to explore next?`;
};

export const AI_LANGUAGE_GREETINGS: Record<
  string,
  {
    content: string;
    viTranslation: string;
    simulatorOpening: (scName: string) => string;
  }
> = {
  de: {
    content: "Hallo! Ich bin dein persönlicher KI-Coach für Deutsch. Woran möchtest du heute arbeiten? Sprich gerne auf Deutsch, oder wechsle zu Vietnamesisch, wenn du Hilfe brauchst.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Đức của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Đức, hoặc chuyển sang tiếng Việt khi cần nhé.",
    simulatorOpening: (sc) => `Hallo! Willkommen zum Training für ${sc}. Was ist Ihr Vorschlag?`,
  },
  ja: {
    content: "こんにちは！あなたのAI専属日本語コーチです。今日はどんな練習をしましょうか？気軽に日本語で話しかけてくださいね。困ったらベトナム語でも大丈夫ですよ！",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Nhật của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Nhật, hoặc dùng tiếng Việt khi cần nhé!",
    simulatorOpening: (sc) => `こんにちは！${sc}のシミュレーションを始めましょう。あなたの提案をお聞かせください。`,
  },
  zh: {
    content: "你好！我是你的AI专属中文教练。今天你想练习什么主题？请随时用中文和我交流，遇到困难也可以切换成越南语哦！",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Trung của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Trung, hoặc chuyển sang tiếng Việt nhé!",
    simulatorOpening: (sc) => `你好！让我们开始${sc}的场景模拟。请问你的方案是什么？`,
  },
  fr: {
    content: "Bonjour ! Je suis votre coach personnel IA pour le français. Sur quel sujet souhaitez-vous vous entraîner aujourd'hui ? N'hésitez pas à parler en français, ou à passer au vietnamien si besoin.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Pháp của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Pháp, hoặc chuyển sang tiếng Việt khi cần nhé.",
    simulatorOpening: (sc) => `Bonjour ! Commençons la simulation pour ${sc}. Quelle est votre proposition ?`,
  },
  es: {
    content: "¡Hola! Soy tu entrenador personal de IA para español. ¿Sobre qué tema te gustaría practicar hoy? Siéntete libre de hablar en español, o cambia a vietnamita si lo necesitas.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Tây Ban Nha của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Tây Ban Nha, hoặc chuyển sang tiếng Việt nhé.",
    simulatorOpening: (sc) => `¡Hola! Comencemos la simulación para ${sc}. ¿Cuál es tu propuesta?`,
  },
  ko: {
    content: "안녕하세요! 저는 당신의 AI 전담 한국어 코치입니다. 오늘 어떤 주제로 연습하고 싶으신가요? 편하게 한국어로 대화해 보세요. 막히면 베트남어로 말씀하셔도 괜찮아요!",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Hàn của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Hàn, hoặc chuyển sang tiếng Việt khi cần nhé!",
    simulatorOpening: (sc) => `안녕하세요! ${sc} 시뮬레이션을 시작하겠습니다. 어떤 제안이 있으신가요?`,
  },
  en: {
    content: "Hello! I'm your AI Personal English Coach. What would you like to practice today? Feel free to speak in English, or switch to Vietnamese whenever you feel stuck.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Anh của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Anh, hoặc chuyển sang tiếng Việt khi bí nhé.",
    simulatorOpening: (sc) => `Hello, let's start the simulation for ${sc}. What is your proposal?`,
  },
};

// Strips Markdown headings, bullet title headers, and metadata to read clean spoken text without word limits
export function stripHeadingsForSpeech(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanedLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Strip markdown headings (# Heading, ## Heading, ### Heading)
    if (/^#{1,6}\s+/.test(trimmed)) return false;
    // Strip numbered or bulleted title labels e.g. "1. 📌 **Giải thích:**" or "### 💡 Title"
    if (/^(\d+\.\s*)?([📌💡🌐🇻🇳🎯🔗✨*_-]\s*)*\*\*[^:]+:\*\*\s*$/.test(trimmed)) return false;
    if (/^\*\*(Tiêu đề|Title|Chủ đề|Topic|Context|Giải thích|Ví dụ):\*\*/i.test(trimmed)) return false;
    return true;
  });
  let clean = cleanedLines.join(' ');
  // Strip markdown formatting symbols
  clean = clean.replace(/[*#_`~]/g, '');
  // Strip URLs and markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip emojis that sound awkward in TTS
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

export const getAILanguageGreeting = (langId: string) => {
  return AI_LANGUAGE_GREETINGS[langId] || AI_LANGUAGE_GREETINGS.en;
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  viTranslation?: string;
  audioUrl?: string;
  timestamp: Date;
}

export const AICoachStudioPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();

  let learningCtx: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    learningCtx = useLearningContext();
  } catch (_) { }

  const activeLanguage = learningCtx?.activeLanguage || getLanguage('en');
  const targetLocale = activeLanguage.speechLocale || 'en-US';

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<'voice' | 'pronunciation' | 'simulator' | 'error-bank' | 'sound-better'>('voice');

  // Hero banner dismiss state
  const [showHeroBanner, setShowHeroBanner] = useState(() => {
    return localStorage.getItem('vocabflow_hide_coach_hero') !== 'true';
  });

  const dismissHeroBanner = () => {
    setShowHeroBanner(false);
    localStorage.setItem('vocabflow_hide_coach_hero', 'true');
  };

  // ==========================================
  // TAB 1: REAL-TIME VOICE COACH & HANDS-FREE 1:1 CALL
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const greeting = getAILanguageGreeting(activeLanguage.id);
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: greeting.content,
        viTranslation: greeting.viTranslation,
        timestamp: new Date(),
      },
    ];
  });

  // Dynamically update welcome message when active language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1 && (prev.length === 0 || prev[0]?.id?.startsWith('welcome'))) {
        const greeting = getAILanguageGreeting(activeLanguage.id);
        return [
          {
            id: 'welcome-' + activeLanguage.id,
            role: 'assistant',
            content: greeting.content,
            viTranslation: greeting.viTranslation,
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [activeLanguage.id]);

  const availableTutors = useMemo(() => getTutorsForLanguage(activeLanguage.id), [activeLanguage.id]);
  const [coachPersonality, setCoachPersonality] = useState<string>(() => {
    const list = getTutorsForLanguage(activeLanguage.id);
    return list[0]?.id || 'Friendly Tutor';
  });

  // Sync coach personality when language space changes
  useEffect(() => {
    if (!availableTutors.some((t) => t.id === coachPersonality)) {
      setCoachPersonality(availableTutors[0]?.id || 'Friendly Tutor');
    }
  }, [availableTutors, coachPersonality]);

  const [tutorMarketModalOpen, setTutorMarketModalOpen] = useState(false);
  const [bilingualMode, setBilingualMode] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [fearlessLevel, setFearlessLevel] = useState<number>(2);
  const [whatShouldISayStep, setWhatShouldISayStep] = useState<number | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSelectTutor = (tutor: TutorPersona) => {
    setCoachPersonality(tutor.id);
    setTutorMarketModalOpen(false);
    setMobileDrawerOpen(false);

    // Apply preferred voice gender and locale for selected tutor
    if (tutor.preferredGender) {
      audioEngine.setPreferredVoiceGender(tutor.preferredGender);
    }
    const matchingVoice = availableVoices.find((v) => {
      const vName = (v.name || '').toLowerCase();
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const matchesLocale = tutor.preferredLocale
        ? vLang.startsWith(tutor.preferredLocale.toLowerCase().split('-')[0])
        : vLang.startsWith((activeLanguage.id || 'en').toLowerCase());
      if (!matchesLocale) return false;
      if (tutor.preferredGender === 'male') {
        return (
          !vName.includes('female') &&
          !vName.includes('woman') &&
          (vName.includes('male') ||
            vName.includes('guy') ||
            vName.includes('yunxi') ||
            vName.includes('kangkang') ||
            vName.includes('zhiwei') ||
            vName.includes('keita') ||
            vName.includes('david'))
        );
      }
      return (
        vName.includes('female') ||
        vName.includes('woman') ||
        vName.includes('xiaoxiao') ||
        vName.includes('yaoyao') ||
        vName.includes('kyoko') ||
        vName.includes('zira')
      );
    }) || availableVoices[0];

    if (matchingVoice) {
      handleSelectVoice(matchingVoice.voiceURI || matchingVoice.name);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'tutor-switch-' + Date.now(),
        role: 'assistant',
        content: `${tutor.avatar} **${tutor.name} (${tutor.vietnameseTitle}) đã vào phòng học!**\n\n${tutor.greeting}`,
        viTranslation: `${tutor.description} • Chuyên môn: ${tutor.specialty.join(', ')}`,
        timestamp: new Date(),
      },
    ]);
    speakText(tutor.greeting);
  };

  // User Voice & Speech Input Language Preference (Syncs with active learning language setting)
  const [voiceLang, setVoiceLang] = useState<'vi' | 'en' | 'auto'>(() => {
    return audioEngine.getPreferredVoiceLang();
  });
  const [speechInputLang, setSpeechInputLang] = useState<string>(() => {
    return activeLanguage.speechLocale || 'en-US';
  });
  const [chatLanguageMode, setChatLanguageMode] = useState<'bilingual' | 'vi' | 'en'>('bilingual');

  // System Voices strictly filtered for current target language space
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return audioEngine.getPreferredVoiceURI() || '';
  });

  // Auto-translate replies to Vietnamese (Configurable in Settings)
  const [autoTranslateVi, setAutoTranslateVi] = useState<boolean>(() => {
    return localStorage.getItem('vocabflow_coach_autotranslate') !== 'false';
  });

  // Auto-play initial coach greeting when entering the page
  const hasAutoPlayedWelcomeRef = useRef<string | null>(null);

  // Load and filter system voices strictly matching the active language space
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const langCode = (activeLanguage.id || 'en').toLowerCase();
      // Match BCP-47 language prefix (e.g. en, ja, zh, cmn, fr, de, ko, es)
      const matching = allVoices.filter((v) => {
        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
        if (langCode === 'zh') {
          return vLang.startsWith('zh') || vLang.startsWith('cmn');
        }
        return vLang.startsWith(langCode);
      });

      setAvailableVoices(matching);

      const savedVoiceURI =
        localStorage.getItem(`vocabflow_voice_uri_${activeLanguage.id}`) ||
        audioEngine.getPreferredVoiceURI();
      const exists = matching.find((v) => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
      if (exists) {
        setSelectedVoiceURI(exists.voiceURI || exists.name);
        audioEngine.setPreferredVoiceURI(exists.voiceURI || exists.name);
      } else if (matching.length > 0) {
        const defaultPick = matching.find((v) => v.default) || matching[0];
        setSelectedVoiceURI(defaultPick.voiceURI || defaultPick.name);
        audioEngine.setPreferredVoiceURI(defaultPick.voiceURI || defaultPick.name);
      } else {
        setSelectedVoiceURI('');
        audioEngine.setPreferredVoiceURI(null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [activeLanguage.id]);

  const handleSelectVoice = (voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    audioEngine.setPreferredVoiceURI(voiceURI);
    try {
      localStorage.setItem(`vocabflow_voice_uri_${activeLanguage.id}`, voiceURI);
    } catch (_) { }
  };

  const handlePrevVoice = () => {
    if (availableVoices.length === 0) return;
    const currentIndex = availableVoices.findIndex((v) => (v.voiceURI || v.name) === selectedVoiceURI);
    const prevIndex = currentIndex <= 0 ? availableVoices.length - 1 : currentIndex - 1;
    const target = availableVoices[prevIndex];
    if (target) {
      handleSelectVoice(target.voiceURI || target.name);
    }
  };

  const handleNextVoice = () => {
    if (availableVoices.length === 0) return;
    const currentIndex = availableVoices.findIndex((v) => (v.voiceURI || v.name) === selectedVoiceURI);
    const nextIndex = currentIndex >= availableVoices.length - 1 ? 0 : currentIndex + 1;
    const target = availableVoices[nextIndex];
    if (target) {
      handleSelectVoice(target.voiceURI || target.name);
    }
  };

  const handleTestVoice = (voiceURI?: string) => {
    const samplePhrases: Record<string, string> = {
      en: "Hello! I am your AI Coach. How are you doing today?",
      ja: "こんにちは！あなたのAI専属コーチです。今日の調子はいかがですか？",
      zh: "你好！我是你的专属AI教练。今天学得怎么样？",
      fr: "Bonjour ! Je suis votre coach personnel IA. Comment allez-vous aujourd'hui ?",
      de: "Hallo! Ich bin dein persönlicher KI-Coach. Wie geht es dir heute?",
      es: "¡Hola! Soy tu entrenador personal de IA. ¿Cómo estás hoy?",
      ko: "안녕하세요! 저는 당신의 전담 AI 코치입니다. 오늘 기분은 어떠신가요?",
    };
    const sample = samplePhrases[activeLanguage.id] || `Hello! I am your AI Coach for ${activeLanguage.name}.`;
    audioEngine.stop();
    audioEngine.speak(sample, activeLanguage.speechLocale || 'en-US');
  };

  // Convert available voices for activeLanguage to CustomSelect options
  const voiceSelectOptions: SelectOption<string>[] = availableVoices.length > 0
    ? availableVoices.map((v, idx) => ({
        value: v.voiceURI || v.name,
        label: v.name.replace(/Microsoft |Google |Apple /g, ''),
        badge: v.lang,
        description: `${v.localService ? 'Ngoại tuyến (Offline)' : 'Neural'} • Giọng #${idx + 1}`,
      }))
    : [
        {
          value: 'default',
          label: `Giọng Mặc Định (${activeLanguage.name})`,
          badge: activeLanguage.speechLocale || activeLanguage.id,
          description: 'Hệ thống tự động điều phối giọng chuẩn bản xứ',
        },
      ];

  // Synchronize target audio & mic recognition when user changes language
  useEffect(() => {
    if (activeLanguage?.speechLocale) {
      audioEngine.setPreferredTargetLocale(activeLanguage.speechLocale);
      setSpeechInputLang(activeLanguage.speechLocale);
    }
  }, [activeLanguage?.speechLocale]);

  useEffect(() => {
    if (recognitionRef.current && speechInputLang) {
      try {
        recognitionRef.current.lang = speechInputLang;
      } catch (_) { }
    }
  }, [speechInputLang]);

  interface ChatSuggestion {
    id: string;
    title: string;
    category: string;
    hasCache: boolean;
  }
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
    return audioEngine.getPreferredVoiceGender();
  });

  const handleVoiceGenderChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    audioEngine.setPreferredVoiceGender(gender);
  };

  const handleVoiceLangChange = (mode: 'vi' | 'en' | 'auto') => {
    setVoiceLang(mode);
    audioEngine.setPreferredVoiceLang(mode);
  };

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const isCallActiveRef = useRef(isCallActive);
  isCallActiveRef.current = isCallActive;

  const currentTranscriptRef = useRef('');
  currentTranscriptRef.current = transcript;

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechInputLang;

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // In 1:1 call mode: auto detect end-of-speech silence (1.4s)
        if (isCallActiveRef.current && currentText.trim().length > 1) {
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          setCallStatus('listening');
          silenceTimeoutRef.current = setTimeout(() => {
            const finalSpeech = currentText.trim();
            if (finalSpeech && isCallActiveRef.current) {
              try {
                recognition.stop();
              } catch (_) { }
              handleSendMessage(finalSpeech);
            }
          }, 1400);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If still in active call mode and not currently thinking/speaking, restart recognition
        if (isCallActiveRef.current && callStatus !== 'speaking' && callStatus !== 'thinking') {
          setTimeout(() => {
            if (isCallActiveRef.current) {
              try {
                recognition.start();
                setIsListening(true);
                setCallStatus('listening');
              } catch (_) { }
            }
          }, 300);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) { }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callStatus, speechInputLang]);

  // Fetch smart autocomplete and cached suggestions from DB (saves API tokens)
  useEffect(() => {
    let isCancelled = false;
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/ai/suggestions?q=${encodeURIComponent(transcript.trim())}`);
        const list = res.data?.data || res.data || [];
        if (!isCancelled && Array.isArray(list)) {
          setSuggestions(list);
        }
      } catch (_) { }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [transcript]);

  const [isHoldingToRecord, setIsHoldingToRecord] = useState(false);
  const holdStartTimeRef = useRef(0);

  const startListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    setTranscript('');
    currentTranscriptRef.current = '';
    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = speechInputLang;
      }
      recognitionRef.current?.start();
      setIsListening(true);
      if (isCallActiveRef.current) setCallStatus('listening');
    } catch (err) {
      console.warn('Speech recognition start error:', err);
    }
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (_) { }
    setIsListening(false);
    setIsHoldingToRecord(false);
  };

  const handleHoldStart = (e?: React.SyntheticEvent) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    if (isCallActive) return; // In 1:1 call mode, hands-free takes care of it

    holdStartTimeRef.current = Date.now();
    setIsHoldingToRecord(true);
    startListening();
  };

  const handleHoldEnd = () => {
    if (!isHoldingToRecord || isCallActive) return;
    setIsHoldingToRecord(false);

    // Give a 200ms grace period to let SpeechRecognition append the final words
    setTimeout(() => {
      stopListening();
      const recorded = (currentTranscriptRef.current || transcript).trim();
      if (recorded.length > 0) {
        handleSendMessage(recorded);
      }
    }, 200);
  };

  const toggleListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    if (isListening) {
      stopListening();
      const recorded = (currentTranscriptRef.current || transcript).trim();
      if (recorded.length > 0) {
        handleSendMessage(recorded);
      }
    } else {
      startListening();
    }
  };

  // Toggle 1:1 Hands-Free Call Mode
  const toggleCallMode = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để gọi thoại 1:1 trực tiếp với AI Coach');
      return;
    }
    if (isCallActive) {
      // End call
      setIsCallActive(false);
      setCallStatus('idle');
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Start call
      setIsCallActive(true);
      setCallStatus('listening');
      startListening();
    }
  };

  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

  const handleTranslateMessage = async (msgId: string, text: string) => {
    if (translatedMessages[msgId]) {
      const next = { ...translatedMessages };
      delete next[msgId];
      setTranslatedMessages(next);
      return;
    }

    setTranslatingMsgId(msgId);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translation = data[0].map((item: any) => item[0]).join('');
      setTranslatedMessages(prev => ({ ...prev, [msgId]: translation }));
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || transcript).trim();
    if (!msg) return;

    if (isGuest || !user) {
      promptLogin('Đăng nhập để trò chuyện và nhận phân tích sửa lỗi từ AI Coach');
      return;
    }

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    setShowSuggestions(false);
    setCoachLoading(true);
    if (isCallActiveRef.current) setCallStatus('thinking');
    setWhatShouldISayStep(null);

    try {
      const res = await api.post('/ai/tutor', {
        message: msg,
        contextWord: coachPersonality,
        language: activeLanguage.id,
      });

      const data = res.data?.data || res.data || res;
      const assistantReply = data?.reply || data?.content || data?.text || getAILanguageFallbackReply(activeLanguage.id, activeLanguage.name);

      const botMsg: ChatMessage & { provider?: string } = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: assistantReply,
        provider: data?.provider,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(assistantReply);
      if (autoTranslateVi) {
        handleTranslateMessage(botMsg.id, assistantReply);
      }
    } catch (err) {
      const fallbackReply = getAILanguageFallbackReply(activeLanguage.id, activeLanguage.name);
      const fallbackId = String(Date.now() + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: fallbackId,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date(),
        },
      ]);
      speakText(fallbackReply);
      if (autoTranslateVi) {
        handleTranslateMessage(fallbackId, fallbackReply);
      }
    } finally {
      setCoachLoading(false);
    }
  };

  const speakText = (text: string, rate = 1.05) => {
    // Strip markdown headings and title headers so only conversational text is spoken aloud without word limits
    const cleanSpeech = stripHeadingsForSpeech(text);
    if (!cleanSpeech) return;

    if (isCallActiveRef.current) {
      setCallStatus('speaking');
      try {
        recognitionRef.current?.stop();
      } catch (_) { }
    }

    audioEngine.playBilingualText(cleanSpeech, {
      rate,
      targetLocale: activeLanguage.speechLocale,
      onEnd: () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          setTimeout(() => {
            if (isCallActiveRef.current) {
              startListening();
            }
          }, 300);
        }
      },
      onError: () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          startListening();
        }
      },
    });
  };

  // Auto-read initial coach greeting when entering the page or changing language
  useEffect(() => {
    const welcomeMsg = messages.find((m) => m.role === 'assistant');
    if (welcomeMsg && hasAutoPlayedWelcomeRef.current !== welcomeMsg.id) {
      hasAutoPlayedWelcomeRef.current = welcomeMsg.id;
      const timer = setTimeout(() => {
        speakText(welcomeMsg.content);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [messages, activeLanguage.id]);

  // ==========================================
  // TAB 2: PRONUNCIATION LAB & SHADOWING
  // ==========================================
  const [selectedWord, setSelectedWord] = useState('thoroughly');
  const [pronunciationResult, setPronunciationResult] = useState<any>(null);
  const [evaluatingPronunciation, setEvaluatingPronunciation] = useState(false);
  const [isRecordingPronunciation, setIsRecordingPronunciation] = useState(false);
  const [recordedSpokenWord, setRecordedSpokenWord] = useState('');
  const [customWordInput, setCustomWordInput] = useState('');
  const [customIpaInput, setCustomIpaInput] = useState('');
  const [customMeaningInput, setCustomMeaningInput] = useState('');
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const pronunciationRecRef = useRef<any>(null);
  const recordedSpokenWordRef = useRef<string>('');

  const [practiceWords, setPracticeWords] = useState<Array<{ word: string; ipa: string; phoneme: string; meaning: string; isCustom?: boolean }>>(() => {
    return LANGUAGE_PRACTICE_WORDS[activeLanguage.id] || LANGUAGE_PRACTICE_WORDS['en'];
  });

  // Automatically update practice words when active learning language changes
  useEffect(() => {
    const list = LANGUAGE_PRACTICE_WORDS[activeLanguage.id] || LANGUAGE_PRACTICE_WORDS['en'];
    setPracticeWords(list);
    if (list[0]) {
      setSelectedWord(list[0].word);
    }
  }, [activeLanguage.id]);

  const speakWord = (word: string, rate: number = 1.0) => {
    audioEngine.playWord(word, {
      rate,
      lang: activeLanguage.speechLocale,
    });
  };

  // Load words from user's flashcards/vault
  const handleLoadUserFlashcards = async () => {
    setLoadingFlashcards(true);
    try {
      const res = await api.get('/flashcards?limit=10');
      const cards = res.data?.data || res.data || [];
      if (Array.isArray(cards) && cards.length > 0) {
        const mapped = cards.slice(0, 8).map((c: any) => ({
          word: c.word || c.term,
          ipa: c.phonetic || c.ipa || `/${c.word}/`,
          phoneme: c.word?.slice(0, 2) || '/en/',
          meaning: c.definition || c.meaning || 'Từ vựng trong thẻ của bạn',
          isCustom: true,
        }));
        setPracticeWords((prev) => {
          const existing = new Set(prev.map((w) => w.word.toLowerCase()));
          const newOnes = mapped.filter((m: any) => !existing.has(m.word.toLowerCase()));
          return [...newOnes, ...prev];
        });
      }
    } catch {
      // Fallback sample cards
      setPracticeWords((prev) => [
        { word: 'collaborate', ipa: '/kəˈlæbəreɪt/', phoneme: '/b/ & /l/', meaning: 'Hợp tác (Thẻ của bạn)', isCustom: true },
        { word: 'negotiate', ipa: '/nɪˈɡoʊʃieɪt/', phoneme: '/ʃ/', meaning: 'Đàm phán (Thẻ của bạn)', isCustom: true },
        ...prev,
      ]);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleAddCustomWord = () => {
    if (!customWordInput.trim()) return;
    const newWord = customWordInput.trim().toLowerCase();
    const newEntry = {
      word: newWord,
      ipa: customIpaInput.trim() || `/${newWord}/`,
      phoneme: `/${newWord.slice(0, 2)}/`,
      meaning: customMeaningInput.trim() || 'Từ vựng tự thêm',
      isCustom: true,
    };
    setPracticeWords((prev) => [newEntry, ...prev]);
    setSelectedWord(newWord);
    setCustomWordInput('');
    setCustomIpaInput('');
    setCustomMeaningInput('');
    setShowAddWordModal(false);
  };

  // Phoneme detail dictionary
  const phonemeDetails: Record<string, any> = {
    thoroughly: {
      targetPhoneme: '/θ/',
      tonguePositionGuide: 'Đặt đầu lưỡi kẹp nhẹ giữa hai hàng răng cửa, đẩy luồng hơi liên tục qua kẽ răng mà không rung dây thanh quản.',
      techniqueTips: 'Không rụt lưỡi vào trong vòm miệng kẻo phát âm nhầm thành âm /t/ hoặc /s/. Giữ luồng hơi thoát đều.',
      pitfallAlert: 'Lỗi người Việt thường gặp: Đọc thành "thờ-rô-li" hoặc "tờ-rô-li". Hãy phát âm âm /θ/ vô thanh nhẹ nhàng.',
    },
    schedule: {
      targetPhoneme: '/sk/',
      tonguePositionGuide: 'Bắt đầu từ âm /s/ xì hơi ở đầu lưỡi gần vòm họng, sau đó bật dứt khoát âm /k/ từ cuống họng.',
      techniqueTips: 'Nối liền mạch /sk/, không chèn nguyên âm đệm như "xì-két-điu".',
      pitfallAlert: 'Lưu ý phiên âm Mỹ /ˈskedʒuːl/ khác với phiên âm Anh /ˈʃedjuːl/. Cả hai đều chuẩn nhưng nên đồng nhất.',
    },
    vulnerable: {
      targetPhoneme: '/v/',
      tonguePositionGuide: 'Răng cửa trên chạm nhẹ vào lòng môi dưới, đẩy hơi có rung dây thanh quản (âm hữu thanh).',
      techniqueTips: 'Phát âm rõ 4 âm tiết: /ˈvʌl.nər.ə.bl̩/ với trọng âm rơi vào âm tiết đầu tiên.',
      pitfallAlert: 'Tránh nuốt âm "ner" hoặc đọc lẫn lộn /v/ thành /w/ (quân-nơ-rơ-bồ).',
    },
    architecture: {
      targetPhoneme: '/tʃ/',
      tonguePositionGuide: 'Đưa đầu lưỡi lên vòm họng cứng sau chân răng, chặn hơi rồi bật dứt khoát như âm "ch" mạnh hơn.',
      techniqueTips: 'Âm "ch" trong "archi" lại phát âm là /k/ (/ˈɑːrkɪ-/), trong khi đuôi "ture" mới là /tʃər/.',
      pitfallAlert: 'Rất nhiều học viên đọc nhầm "art-chi-tek-tu-re". Cần chú ý /tʃər/ ở âm cuối.',
    },
    regularly: {
      targetPhoneme: '/r/ & /l/',
      tonguePositionGuide: 'Uốn cong lưỡi về phía sau cho âm /r/, sau đó đưa đầu lưỡi chạm vào chân răng trên cho âm /l/.',
      techniqueTips: 'Luyện chuyển vị trí lưỡi nhịp nhàng giữa /r/ và /l/: reg - yuh - ler - lee.',
      pitfallAlert: 'Hiện tượng lẹo lưỡi: người học hay bị nuốt bớt âm tiết hoặc nói thành "regu-lali".',
    },
  };

  // Tab 2 Voice Recorder Integration (cross-platform MediaRecorder + PCM WAV fallback)
  const {
    status: pronRecStatus,
    isRecording: isPronRecording,
    recordedUrl: pronRecordedUrl,
    isPlayingRecording: isPlayingPronRecording,
    recordingSeconds: pronRecordingSeconds,
    errorMessage: pronRecErrorMessage,
    startRecording: startPronVoiceRecording,
    stopRecording: stopPronVoiceRecording,
    replayRecording: replayPronVoiceRecording,
    stopReplay: stopPronVoiceReplay,
    resetRecording: resetPronVoiceRecording,
  } = useVoiceRecorder();

  const handleStartPronRecording = async () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện và chấm điểm phát âm chuẩn bản xứ');
      return;
    }
    setRecordedSpokenWord('');
    recordedSpokenWordRef.current = '';
    setPronunciationResult(null);

    // 1. Start cross-platform microphone recording (MediaRecorder / PCM)
    await startPronVoiceRecording();

    // 2. Start Web SpeechRecognition matching active language locale
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = activeLanguage.speechLocale || 'en-US';
        recognition.onresult = (event: any) => {
          const spoken = (event.results?.[0]?.[0]?.transcript || '').trim();
          recordedSpokenWordRef.current = spoken;
          setRecordedSpokenWord(spoken);
        };
        recognition.onerror = () => {
          // Keep whatever we have or empty
        };
        pronunciationRecRef.current = recognition;
        recognition.start();
      } catch (_) { }
    }
  };

  const handleStopPronRecording = async () => {
    try {
      pronunciationRecRef.current?.stop();
    } catch (_) { }

    await stopPronVoiceRecording();

    // Give SpeechRecognition a moment to flush final transcript
    setTimeout(() => {
      const spoken = recordedSpokenWordRef.current || recordedSpokenWord || '';
      evaluatePronunciationMatch(selectedWord, spoken);
    }, 200);
  };

  const handleToggleReplayPronRecording = () => {
    if (isPlayingPronRecording) {
      stopPronVoiceReplay();
    } else {
      replayPronVoiceRecording();
    }
  };

  const evaluatePronunciationMatch = async (target: string, spoken: string) => {
    setEvaluatingPronunciation(true);
    try {
      const res = await api.post('/ai/pronunciation', {
        word: target,
        spokenText: spoken,
        mode: 'adult',
        language: activeLanguage.id,
      });
      const data = res.data?.data || res.data;
      if (data && data.accuracy !== undefined) {
        setPronunciationResult(data);
        setEvaluatingPronunciation(false);
        return;
      }
    } catch (_) { }

    // Accurate local scoring engine (Levenshtein + Dice + Token Jaccard) with Adult threshold > 90%
    const evalResult = evaluatePronunciation(target, spoken, 'adult');
    const score = evalResult.score;
    const isPassing = evalResult.isPassing; // Adult requires > 90%
    const details = phonemeDetails[target] || phonemeDetails['thoroughly'];

    setPronunciationResult({
      targetWord: target,
      spokenText: spoken,
      accuracy: score,
      isPassing,
      feedback: evalResult.feedback,
      phonemeAnalysis: {
        targetPhoneme: details?.targetPhoneme || '/th/',
        accuracyScore: score,
        tonguePositionGuide: details?.tonguePositionGuide || 'Đặt đầu lưỡi gần vòm họng và giữ luồng hơi ổn định.',
        techniqueTips: details?.techniqueTips || 'Luyện tập phát âm rõ từng âm tiết, đặc biệt chú ý âm cuối (ending sound).',
        pitfallAlert: details?.pitfallAlert || 'Người học hay nuốt âm cuối hoặc đặt sai trọng âm của từ.',
      },
      prosody: {
        stressAccuracy: isPassing ? Math.min(100, score + 2) : Math.max(35, Math.round(score * 0.9)),
        rhythmScore: isPassing ? Math.min(100, score) : Math.max(40, Math.round(score * 0.85)),
        intonationScore: isPassing ? Math.min(100, score + 1) : Math.max(38, Math.round(score * 0.88)),
      },
    });
    setEvaluatingPronunciation(false);
  };

  // ==========================================
  // TAB 3: REAL-WORLD SIMULATOR (ROLEPLAY)
  // ==========================================
  const [simulatorScenario, setSimulatorScenario] = useState('bug_delay_meeting');
  const [simulatorHistory, setSimulatorHistory] = useState<any[]>(() => {
    const greeting = getAILanguageGreeting(activeLanguage.id);
    return [
      {
        role: 'assistant',
        content: greeting.simulatorOpening('Giải Trình Hoãn Release'),
      },
    ];
  });

  // Dynamically update simulator greeting when active language changes
  useEffect(() => {
    setSimulatorHistory((prev) => {
      if (prev.length <= 1) {
        const greeting = getAILanguageGreeting(activeLanguage.id);
        return [
          {
            role: 'assistant',
            content: greeting.simulatorOpening('Giải Trình Hoãn Release'),
          },
        ];
      }
      return prev;
    });
  }, [activeLanguage.id]);

  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorRadar, setSimulatorRadar] = useState<any>({
    communication: 84,
    grammar: 78,
    vocabulary: 82,
    pronunciation: 80,
    fluency: 76,
    confidence: 86,
  });
  const [simulatorFeedback, setSimulatorFeedback] = useState<any>(null);

  const handleSimulatorSend = async () => {
    if (!simulatorInput.trim()) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tham gia mô phỏng tình huống đàm phán thực tế với AI');
      return;
    }
    const userMsg = simulatorInput.trim();
    setSimulatorInput('');

    const newHistory = [...simulatorHistory, { role: 'user', content: userMsg }];
    setSimulatorHistory(newHistory);

    try {
      const res = await api.post('/ai/roleplay', {
        scenarioId: simulatorScenario,
        message: userMsg,
        history: newHistory,
        language: activeLanguage.id,
      });
      const data = res.data?.data || res.data;
      if (data?.reply) {
        setSimulatorHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.scores) setSimulatorRadar(data.scores);
        if (data.feedback) setSimulatorFeedback(data.feedback);
        speakText(data.reply);
      }
    } catch {
      const fallbackSimulatorReplies: Record<string, string> = {
        zh: '我明白了你的顾虑。如果我们把发布时间推迟到明天早上，能确保系统的稳定性吗？',
        ja: '技術的な課題は理解しました。リリースを明朝に延期した場合、システムの安定性は保証できますか？',
        ko: '기술적 부채 이슈는 잘 이해했습니다. 출시를 내일 아침으로 연기한다면 시스템 안정성을 확보할 수 있나요?',
        fr: 'Je comprends le problème technique. Pouvez-vous garantir la stabilité si nous reportons le déploiement à demain matin ?',
        de: 'Ich verstehe die technischen Bedenken. Können Sie die Stabilität garantieren, wenn wir den Rollout auf morgen früh verschieben?',
        es: 'Entiendo el problema técnico. ¿Puedes garantizar la estabilidad si posponemos el lanzamiento para mañana por la mañana?',
        en: 'I understand the technical debt issue. Can you guarantee stability if we push the rollout to tomorrow morning?',
      };
      const reply = fallbackSimulatorReplies[activeLanguage.id] || fallbackSimulatorReplies.en;
      setSimulatorHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
      speakText(reply);
    }
  };

  // ==========================================
  // TAB 4: ROOT-CAUSE ERROR BANK & HEATMAP
  // ==========================================
  const [errorBankData, setErrorBankData] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'error-bank') {
      api.get('/ai/error-bank')
        .then((res) => setErrorBankData(res.data?.data || res.data))
        .catch(() => {
          setErrorBankData({
            heatmap: { grammar: 68, pronunciation: 72, fluency: 64, vocabulary: 81, listening: 79 },
            errorBank: [
              {
                category: 'Grammar',
                overallScore: 68,
                items: [
                  {
                    rule: 'Third-person singular -s/-es',
                    rootCause: 'Thói quen tiếng Việt không biến đổi đuôi động từ theo ngôi số ít.',
                    occurrences: 14,
                    exampleWrong: 'He work in an international bank.',
                    exampleCorrect: 'He works in an international bank.',
                  },
                  {
                    rule: 'Past Simple tense irregular verbs',
                    rootCause: 'Chưa tự động hóa các động từ bất quy tắc (bought, went, thought).',
                    occurrences: 9,
                    exampleWrong: 'Yesterday I go to see my manager.',
                    exampleCorrect: 'Yesterday I went to see my manager.',
                  },
                ],
              },
            ],
          });
        });
    }
  }, [activeTab]);

  // ==========================================
  // TAB 5: "MAKE ME SOUND BETTER" & REAL CONTENT
  // ==========================================
  const [soundBetterInput, setSoundBetterInput] = useState('I want to make a meeting with you to talk about project');
  const [soundBetterResult, setSoundBetterResult] = useState<any>(null);
  const [soundBetterLoading, setSoundBetterLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleMakeMeSoundBetter = async () => {
    if (!soundBetterInput.trim()) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để sử dụng tính năng nâng cấp câu văn chuẩn bản xứ');
      return;
    }
    setSoundBetterLoading(true);
    try {
      const res = await api.post('/ai/sound-better', {
        sentence: soundBetterInput,
        language: activeLanguage.id,
      });
      setSoundBetterResult(res.data?.data || res.data);
    } catch {
      const soundBetterFallbacks: Record<string, any> = {
        zh: {
          yourVersion: soundBetterInput,
          corrected: soundBetterInput.endsWith('。') ? soundBetterInput : `${soundBetterInput}。`,
          natural: '我想和你聊聊这个项目的具体进展。',
          professional: '我想与您安排一次简短会议，共同评估项目的最新推进情况与下一步规划。',
          nativeStyle: '方便抽空对齐一下这个项目的进度吗？',
          grammarExplanation: 'Đã chuẩn hóa viết hoa đầu câu, dấu câu và chọn lọc từ ngữ chính xác.',
          pronunciationFocus: 'Chú ý thanh điệu tiếng Trung và ngắt nghỉ tự nhiên giữa các phân câu.',
        },
        ja: {
          yourVersion: soundBetterInput,
          corrected: soundBetterInput.endsWith('。') ? soundBetterInput : `${soundBetterInput}。`,
          natural: 'プロジェクトの進捗について少しお話ししたいです。',
          professional: 'プロジェクトの状況確認および今後の進め方について、お時間を頂戴できますでしょうか。',
          nativeStyle: 'プロジェクトの件、少しすり合わせのお時間をいただけますか？',
          grammarExplanation: 'Đã chuẩn hóa câu văn sang dạng kính ngữ lịch sự và tự nhiên.',
          pronunciationFocus: 'Chú ý ngữ điệu lên xuống nhẹ nhàng và phát âm chuẩn các trường âm.',
        },
        ko: {
          yourVersion: soundBetterInput,
          corrected: soundBetterInput.endsWith('.') ? soundBetterInput : `${soundBetterInput}.`,
          natural: '프로젝트 진행 상황에 대해 잠깐 이야기 나누고 싶어요.',
          professional: '프로젝트 현황 점검 및 향후 일정 조율을 위해 짧은 미팅을 요청드리고자 합니다.',
          nativeStyle: '프로젝트 건으로 잠깐 시간 내서 싱크 맞출 수 있을까요?',
          grammarExplanation: 'Đã chuẩn hóa đuôi câu lịch sự và phong cách giao tiếp công sở.',
          pronunciationFocus: 'Chú ý ngữ điệu nhẹ nhàng và nối âm chuẩn xác.',
        },
        en: {
          yourVersion: soundBetterInput,
          corrected: 'I want to have a meeting with you to discuss the project.',
          natural: 'Could we schedule a quick chat to sync up on the project?',
          professional: 'I would like to arrange a brief meeting with you to review the project status and next steps.',
          nativeStyle: 'Can we carve out 15 minutes to touch base on the project deliverables?',
          grammarExplanation: 'Dùng động từ "discuss" thay cho "talk about" và cụm tự nhiên "schedule a quick chat / arrange a meeting".',
          pronunciationFocus: 'Chú ý nhấn mạnh vào Content Words và nối âm cuối câu.',
        },
      };
      setSoundBetterResult(soundBetterFallbacks[activeLanguage.id] || soundBetterFallbacks.en);
    } finally {
      setSoundBetterLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ==========================================
  // NAVIGATION & STEPPER CONTROLS FOR MOBILE
  // ==========================================
  const currentTabIndex = Math.max(0, STUDIO_TABS.findIndex((t) => t.id === activeTab));
  const activeTabMeta = STUDIO_TABS[currentTabIndex] || STUDIO_TABS[0];
  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(STUDIO_TABS[currentTabIndex - 1].id);
    }
  };
  const handleNextTab = () => {
    if (currentTabIndex < STUDIO_TABS.length - 1) {
      setActiveTab(STUDIO_TABS[currentTabIndex + 1].id);
    }
  };

  const currentTutorIndex = Math.max(0, availableTutors.findIndex((p) => p.id === coachPersonality));
  const activeTutor = availableTutors[currentTutorIndex] || availableTutors[0];
  const handlePrevTutor = () => {
    const nextIdx = (currentTutorIndex - 1 + availableTutors.length) % availableTutors.length;
    handleSelectTutor(availableTutors[nextIdx]);
  };
  const handleNextTutor = () => {
    const nextIdx = (currentTutorIndex + 1) % availableTutors.length;
    handleSelectTutor(availableTutors[nextIdx]);
  };

  const selectedWordIndex = Math.max(0, practiceWords.findIndex((w) => w.word === selectedWord));
  const handlePrevWord = () => {
    if (selectedWordIndex > 0) {
      const prevWord = practiceWords[selectedWordIndex - 1];
      setSelectedWord(prevWord.word);
      evaluatePronunciationMatch(prevWord.word, prevWord.word);
    }
  };
  const handleNextWord = () => {
    if (selectedWordIndex < practiceWords.length - 1) {
      const nextWord = practiceWords[selectedWordIndex + 1];
      setSelectedWord(nextWord.word);
      evaluatePronunciationMatch(nextWord.word, nextWord.word);
    }
  };

  const currentScenarioIndex = Math.max(0, SIMULATOR_SCENARIOS.findIndex((s) => s.id === simulatorScenario));
  const handlePrevScenario = () => {
    if (currentScenarioIndex > 0) {
      const prevSc = SIMULATOR_SCENARIOS[currentScenarioIndex - 1];
      setSimulatorScenario(prevSc.id);
      const greeting = getAILanguageGreeting(activeLanguage.id);
      setSimulatorHistory([{ role: 'assistant', content: greeting.simulatorOpening(prevSc.name) }]);
    }
  };
  const handleNextScenario = () => {
    if (currentScenarioIndex < SIMULATOR_SCENARIOS.length - 1) {
      const nextSc = SIMULATOR_SCENARIOS[currentScenarioIndex + 1];
      setSimulatorScenario(nextSc.id);
      const greeting = getAILanguageGreeting(activeLanguage.id);
      setSimulatorHistory([{ role: 'assistant', content: greeting.simulatorOpening(nextSc.name) }]);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 p-0 sm:p-2.5 lg:p-4 space-y-0 sm:space-y-2">
      {/* Top Product Header (Compact & Streamlined with Dismiss X Button - Hidden on mobile to maximize chat space) */}
      {showHeroBanner ? (
        <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950/90 to-slate-900 text-white shadow-lg border border-indigo-500/20 relative overflow-hidden pr-12 animate-fade-in shrink-0">
          <button
            onClick={dismissHeroBanner}
            className="absolute top-3 right-3 p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition z-20"
            title="Ẩn banner giới thiệu"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-1 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Next-Gen AI Personal English Coach</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              A Personal English Coach That Learns You
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              Huấn luyện viên ghi nhớ lịch sử, tìm nguyên nhân gốc rễ và tự động may đo lộ trình phản xạ cho riêng bạn.
            </p>
          </div>

          <div className="z-10 flex items-center gap-2.5 self-end sm:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block leading-tight">English Power</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 leading-tight">764</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex justify-end shrink-0">
          <button
            onClick={() => {
              setShowHeroBanner(true);
              localStorage.removeItem('vocabflow_hide_coach_hero');
            }}
            className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition py-0.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Hiện lại banner giới thiệu"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Hiện giới thiệu Coach</span>
          </button>
        </div>
      )}

      {/* 5 Core Feature Navigation: Mobile Mode Stepper & Select vs Desktop Tab Bar */}
      {/* MOBILE VIEW: No more horizontal scrolling chips! Premium Segmented Stepper + Dropdown */}
      <div className="md:hidden px-2.5 py-1.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevTab}
            disabled={currentTabIndex <= 0}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
            title="Chế độ trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <CustomSelect
              value={activeTab}
              onChange={(val) => setActiveTab(val as StudioTabType)}
              size="sm"
              options={STUDIO_TABS.map((t, idx) => ({
                value: t.id,
                label: t.name,
                badge: `${idx + 1}/5`,
                icon: t.icon,
                description: t.desc,
              }))}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleNextTab}
            disabled={currentTabIndex >= STUDIO_TABS.length - 1}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
            title="Chế độ tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Active Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {STUDIO_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeTab === t.id
                  ? 'w-7 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
              }`}
              title={t.name}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP VIEW: Sleek Active Tab Pills */}
      <div className="hidden md:flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 shrink-0 select-none">
        {STUDIO_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: VOICE COACH & REAL-TIME CONVERSATION              */}
      {/* ======================================================== */}
      {activeTab === 'voice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Controls & Coach Settings */}
          <div className="space-y-3 overflow-y-auto max-h-full pr-1 hidden lg:block">
            {/* Hands-Free 1:1 Call Banner Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-black tracking-wide uppercase text-indigo-300">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    Đối Thoại 1 : 1 Rảnh Tay
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                    }`}>
                    {isCallActive ? (callStatus === 'speaking' ? 'AI Đang Nói' : callStatus === 'thinking' ? 'AI Đang Nghĩ' : 'Đang Nghe Bạn') : 'Chưa Kết Nối'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Nói chuyện trực tiếp 100% không cần bấm nút "Gửi". AI tự nhận diện ngắt câu, trả lời và tự động bật lại micro.
                </p>

                <button
                  onClick={toggleCallMode}
                  className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${isCallActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse'
                    : 'btn-glass-primary shadow-indigo-600/30'
                    }`}
                >
                  {isCallActive ? (
                    <>
                      <PhoneOff className="w-4 h-4" />
                      <span>Kết Thúc Cuộc Gọi 1:1</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Bật Cuộc Gọi Đối Thoại 1:1</span>
                    </>
                  )}
                </button>

                {isCallActive && (
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs text-indigo-300">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-pulse [animation-delay:200ms]" />
                    </span>
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      {callStatus === 'listening' && (
                        <>
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Bạn hãy nói tự nhiên... AI đang lắng nghe</span>
                        </>
                      )}
                      {callStatus === 'thinking' && (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>AI đang phân tích và chuẩn bị câu trả lời...</span>
                        </>
                      )}
                      {callStatus === 'speaking' && (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>AI đang phản hồi giọng nói...</span>
                        </>
                      )}
                      {callStatus === 'idle' && <span>Đang đồng bộ...</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Voice Selection for Active Language Space */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Giọng Đọc AI Coach</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1">
                  <CountryFlag languageId={activeLanguage.id} size="xs" />
                  <span>{activeLanguage.name}</span>
                </span>
              </div>

              {/* Prev / Next controls + CustomSelect + Test Voice Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevVoice}
                  disabled={availableVoices.length <= 1}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                  title="Giọng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <CustomSelect
                    value={selectedVoiceURI || 'default'}
                    onChange={(val) => handleSelectVoice(String(val))}
                    size="sm"
                    options={voiceSelectOptions}
                    placeholder={`Chọn giọng ${activeLanguage.name}...`}
                    className="w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextVoice}
                  disabled={availableVoices.length <= 1}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                  title="Giọng tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVoice()}
                  className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center active:scale-90 transition border border-indigo-200/80 dark:border-indigo-800/80 shrink-0 shadow-2xs"
                  title="Nghe thử giọng này"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>{availableVoices.length > 0 ? `${availableVoices.length} giọng sẵn có trên máy` : 'Đang dùng giọng chuẩn hệ thống'}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Không giới hạn từ</span>
              </div>
            </div>

            {/* Translation Settings (Auto-translate to Vietnamese) */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Dịch Sang Tiếng Việt</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoTranslateVi;
                    setAutoTranslateVi(next);
                    localStorage.setItem('vocabflow_coach_autotranslate', String(next));
                  }}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${autoTranslateVi ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
                  title={autoTranslateVi ? 'Đang bật dịch tự động sang Tiếng Việt' : 'Đang tắt dịch tự động'}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Tự động dịch câu trả lời của Huấn luyện viên sang <strong className="text-slate-700 dark:text-slate-200 font-bold">Tiếng Việt</strong> ngay khi nhận được phản hồi.
              </p>
            </div>

            {/* Microphone Recording Language Selection */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-500" />
                  Ngôn Ngữ Nhận Diện Micro
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  {speechInputLang === 'vi-VN' ? (
                    <>
                      <CountryFlag languageId="vi" size="xs" />
                      <span>Đang nghe Tiếng Việt</span>
                    </>
                  ) : (
                    <>
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span>Đang nghe {activeLanguage.name}</span>
                    </>
                  )}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setSpeechInputLang('vi-VN');
                    if (recognitionRef.current) {
                      try { recognitionRef.current.lang = 'vi-VN'; } catch (_) { }
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${speechInputLang === 'vi-VN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <CountryFlag languageId="vi" size="xs" />
                  <span>Nói Tiếng Việt</span>
                </button>
                <button
                  onClick={() => {
                    const targetLoc = activeLanguage.speechLocale || 'en-US';
                    setSpeechInputLang(targetLoc);
                    if (recognitionRef.current) {
                      try { recognitionRef.current.lang = targetLoc; } catch (_) { }
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${speechInputLang === activeLanguage.speechLocale
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <CountryFlag languageId={activeLanguage.id} size="xs" />
                  <span>Nói {activeLanguage.name}</span>
                </button>
              </div>
            </div>

            {/* Personality Selector using CustomSelect */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <CustomSelect
                label="AI Coach Personality"
                icon={Smile}
                value={coachPersonality}
                onChange={(val) => setCoachPersonality(String(val))}
                options={[
                  { value: 'Friendly Tutor', label: 'Friendly Tutor', description: 'Kiên nhẫn & Cổ vũ người học' },
                  { value: 'Strict Teacher', label: 'Strict Teacher', description: 'Chỉnh lỗi ngữ pháp nghiêm khắc' },
                  { value: 'Casual Friend', label: 'Casual Friend', description: 'Bạn bè thân thiện, đàm thoại tự nhiên' },
                  { value: 'Work Colleague', label: 'Work Colleague', description: 'Đồng nghiệp công sở, ngôn ngữ văn phòng' },
                  { value: 'Interview Coach', label: 'Interview Coach', description: 'Chuyên gia phỏng vấn việc làm' },
                  { value: 'American Coach', label: 'American Teacher', description: 'Giọng Mỹ chuẩn (General American)' },
                  { value: 'British Coach', label: 'British Teacher', description: 'Giọng Anh chuẩn (Received Pronunciation)' },
                ]}
                className="w-full"
              />
            </div>

            {/* Bilingual Fallback Mode */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Bilingual Fallback (Cứu Cánh Song Ngữ)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setBilingualMode('beginner')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'beginner'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>50%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Beginner</span>
                </button>
                <button
                  onClick={() => setBilingualMode('intermediate')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'intermediate'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>80%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Inter</span>
                </button>
                <button
                  onClick={() => setBilingualMode('advanced')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'advanced'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>100%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Native</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Interactive Voice Chat Stage - Full width edge-to-edge on mobile, rounded card on desktop */}
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-slate-200/80 dark:border-slate-800 shadow-none sm:shadow-lg overflow-hidden flex-1 h-full min-h-0 w-full">
            {/* Dedicated Sleek Chat Box Header */}
            {(() => {
              const activeTutor = availableTutors.find((p) => p.id === coachPersonality) || availableTutors[0];
              return (
                <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-lg border shadow-xs transition-colors ${activeTutor.theme.avatarBg}`}>
                        <span>{activeTutor.avatar}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${activeTutor.theme.dotColor}`} title="AI Coach Sẵn Sàng" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-tight">
                          {activeTutor.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${activeTutor.badgeColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${activeTutor.theme.dotColor}`} />
                          <span>{activeTutor.vietnameseTitle}</span>
                          <span className="opacity-50">•</span>
                          <span>{activeTutor.tag}</span>
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {bilingualMode === 'beginner' ? 'Song ngữ 50%' : bilingualMode === 'intermediate' ? 'Song ngữ 80%' : '100% Bản xứ'}
                        </span>
                        <span className="hidden sm:inline text-slate-400">• {activeTutor.accent}</span>
                      </p>
                    </div>
                  </div>

                  {/* Header Action Controls */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Tutor Marketplace Open Button */}
                    <button
                      type="button"
                      onClick={() => setTutorMarketModalOpen(true)}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-bold text-[11px] transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
                      title="Mở Chợ Trợ Lý Gia Sư AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="hidden xs:inline">Gia sư</span>
                    </button>

                    {/* 1:1 Call Mode Toggle */}
                    <button
                      type="button"
                      onClick={toggleCallMode}
                      className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${isCallActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        }`}
                      title={isCallActive ? 'Dừng cuộc gọi thoại' : 'Bật đàm thoại giọng nói 1:1'}
                    >
                      {isCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />}
                      <span className="hidden sm:inline">{isCallActive ? 'Dừng Gọi' : 'Gọi 1:1'}</span>
                    </button>

                    {/* Mobile Settings Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setMobileDrawerOpen(true)}
                      className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                      title="Cài đặt giọng nói & Huấn luyện viên"
                    >
                      <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    {/* Reset Chat Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Bạn có muốn làm mới cuộc trò chuyện này?')) {
                          const greeting = getAILanguageGreeting(activeLanguage.id);
                          setMessages([
                            {
                              id: 'welcome-' + Date.now(),
                              role: 'assistant',
                              content: greeting.content,
                              viTranslation: greeting.viTranslation,
                              timestamp: new Date(),
                            },
                          ]);
                        }
                      }}
                      className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
                      title="Làm mới cuộc trò chuyện"
                    >
                      <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Quick Tutor Persona Selector: Mobile Stepper vs Desktop Horizontal Strip */}
            {/* MOBILE VIEW: Active Tutor Stepper with Prev/Next Navigation Controls — No scrollbar */}
            <div className="sm:hidden px-2.5 py-1.5 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevTutor}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition shrink-0 shadow-2xs"
                title="Gia sư trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                onClick={() => setTutorMarketModalOpen(true)}
                className={`flex-1 flex items-center justify-between px-2.5 py-1 rounded-xl border cursor-pointer active:scale-98 transition min-w-0 shadow-2xs ${activeTutor.theme.chipActive} border-transparent`}
                title="Bấm để đổi gia sư"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm leading-none shrink-0">{activeTutor.avatar}</span>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-[11px] text-white truncate">
                        {activeTutor.name}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 rounded bg-white/20 text-white font-extrabold shrink-0">
                        {activeTutor.tag}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/80 block truncate">
                      {activeTutor.vietnameseTitle} ({currentTutorIndex + 1}/{availableTutors.length})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-white/90 font-bold shrink-0 pl-1 flex items-center gap-0.5">
                  <span>Đổi</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextTutor}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition shrink-0 shadow-2xs"
                title="Gia sư tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* DESKTOP VIEW: Quick Tutor Persona Selector Strip with Prev/Next Navigation (No scrollbar) */}
            <div className="hidden sm:flex px-2.5 sm:px-4 py-1.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/70 dark:border-slate-800/80 items-center justify-between gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevTutor}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition shrink-0 shadow-2xs hover:bg-slate-100"
                title="Gia sư trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTutorMarketModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 font-bold text-[10px] shrink-0 active:scale-95 transition shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Tất cả</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5" />

              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={coachPersonality}
                  onChange={(val) => {
                    const tutor = availableTutors.find((p) => p.id === val);
                    if (tutor) handleSelectTutor(tutor);
                  }}
                  size="sm"
                  options={availableTutors.map((persona) => ({
                    value: persona.id,
                    label: `${persona.avatar} ${persona.name} (${persona.vietnameseTitle})`,
                    badge: persona.tag,
                    description: `${persona.accent} • ${persona.description}`,
                  }))}
                  placeholder="Chọn Huấn luyện viên AI..."
                  className="w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleNextTutor}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition shrink-0 shadow-2xs hover:bg-slate-100"
                title="Gia sư tiếp theo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Call Mode Status Bar */}
            {isCallActive && (
              <div className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white flex items-center justify-between text-[11px] sm:text-xs font-bold shadow-md shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Cuộc gọi 1:1 Đang Hoạt Động</span>
                </div>
                <span className="text-[10px] sm:text-[11px] opacity-90 hidden xs:inline">Tự nhận diện khi dừng nói 1.4s</span>
              </div>
            )}

            {/* Chat Log */}
            <div className="flex-1 p-2.5 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mt-0.5">
                      <VocabFlowLogo size="xs" showContainer={false} className="w-7 h-7 sm:w-8 sm:h-8 object-contain select-none" />
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <div className="max-w-md p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed bg-indigo-600 text-white rounded-br-none shadow-md">
                      <p>{msg.content}</p>
                      {msg.viTranslation && (
                        <p className="mt-2 pt-2 border-t border-indigo-400 text-[11px] text-indigo-100 italic flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>{msg.viTranslation}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-xl w-full">
                      <RichAIMessageRenderer
                        content={msg.content}
                        provider={(msg as any).provider}
                        hideActions={true}
                        onSelectQuizOption={(opt) => handleSendMessage(opt)}
                      />
                      {(translatedMessages[msg.id] || (autoTranslateVi && msg.viTranslation)) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl flex items-start gap-1.5 border border-slate-200/50 dark:border-slate-800/60">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="flex-1">{translatedMessages[msg.id] || msg.viTranslation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                        <button
                          onClick={() => speakText(msg.content)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                          title="Phát âm giọng AI Coach (Không giới hạn từ, bỏ tiêu đề)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTranslateMessage(msg.id, msg.content)}
                          disabled={translatingMsgId === msg.id}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                          title="Dịch sang tiếng Việt"
                        >
                          {translatingMsgId === msg.id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {coachLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span>Huấn luyện viên đang suy nghĩ và chuẩn bị phản hồi...</span>
                </div>
              )}
            </div>

            {/* "What Should I Say?" Scaffolding Help Bar */}
            <div className="px-3 sm:px-6 py-1 sm:py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-1.5">
              <span className="text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 mr-2 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Bị bí từ?</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setWhatShouldISayStep(1)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Gợi ý ý tưởng
                </button>
                <button
                  onClick={() => setWhatShouldISayStep(2)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Từ then chốt
                </button>
                <button
                  onClick={() => setWhatShouldISayStep(3)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Mẫu câu
                </button>
              </div>
            </div>

            {whatShouldISayStep && (
              <div className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs border-t border-amber-500/20 flex items-center justify-between gap-2">
                <div className="flex-1">
                  {whatShouldISayStep === 1 && (
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span><strong>Gợi ý:</strong> Chia sẻ về 1 trở ngại bạn đã vượt qua trong công việc hôm nay.</span>
                    </span>
                  )}
                  {whatShouldISayStep === 2 && (
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span><strong>Từ then chốt:</strong> resolved / bottleneck / coordinated / team deliverables.</span>
                    </span>
                  )}
                  {whatShouldISayStep === 3 && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span><strong>Mẫu câu:</strong> "Today, my team successfully coordinated to resolve a major delivery bottleneck."</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setWhatShouldISayStep(null)}
                  className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-300 shrink-0"
                  title="Đóng gợi ý"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Autocomplete & Cached Prompt Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mx-2 sm:mx-4 mb-2 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-100 dark:border-slate-800 shadow-xl space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>Gợi ý câu hỏi & từ khóa từ dữ liệu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Tiết kiệm 100% Token
                    </span>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Đóng gợi ý"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60">
                  {suggestions.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => {
                        setTranscript(item.title);
                        setShowSuggestions(false);
                        handleSendMessage(item.title);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.hasCache ? (
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-400" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${item.hasCache
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}
                      >
                        {item.hasCache ? (
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 shrink-0" />
                            <span>Có sẵn</span>
                          </span>
                        ) : (
                          item.category
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Input & Action Bar */}
            <div className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Sleek Language Switch Button (Tiếng Việt <-> [Ngôn ngữ đang học]) */}
              <button
                type="button"
                onClick={() => {
                  const targetLoc = activeLanguage.speechLocale || 'en-US';
                  const nextLang = speechInputLang === 'vi-VN' ? targetLoc : 'vi-VN';
                  setSpeechInputLang(nextLang);
                  if (recognitionRef.current) {
                    try { recognitionRef.current.lang = nextLang; } catch (_) { }
                  }
                }}
                className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl border text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs select-none ${speechInputLang === 'vi-VN'
                  ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                  }`}
                title={`Bấm để đổi ngôn ngữ thu âm Micro: Tiếng Việt (vi-VN) hoặc ${activeLanguage.name} (${activeLanguage.speechLocale})`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${speechInputLang === 'vi-VN' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'
                    }`}
                />
                <span className="font-extrabold flex items-center gap-1">
                  {speechInputLang === 'vi-VN' ? (
                    <>
                      <CountryFlag languageId="vi" size="xs" />
                      <span className="hidden sm:inline">Tiếng Việt</span>
                      <span className="sm:hidden">VI</span>
                    </>
                  ) : (
                    <>
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span className="hidden sm:inline">{activeLanguage.name}</span>
                      <span className="sm:hidden">{activeLanguage.id.toUpperCase()}</span>
                    </>
                  )}
                </span>
              </button>

              {/* Refined Push-To-Talk Microphone Button (Ấn giữ để nói, thả tay để gửi) */}
              <button
                type="button"
                onPointerDown={handleHoldStart}
                onPointerUp={handleHoldEnd}
                onPointerLeave={() => { if (isHoldingToRecord) handleHoldEnd(); }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 select-none cursor-pointer active:scale-95 border ${isListening || isHoldingToRecord
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-rose-500/40 ring-4 ring-rose-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                  }`}
                title="Ấn và GIỮ để nói, THẢ RA để gửi tin nhắn phân tích"
              >
                {isListening || isHoldingToRecord ? (
                  <Mic className="w-5 h-5 text-white animate-bounce" />
                ) : (
                  <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>

              <input
                type="text"
                value={transcript}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    handleSendMessage();
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder={
                  isCallActive
                    ? 'Chế độ 1:1 bật — hãy nói...'
                    : isHoldingToRecord || isListening
                      ? `🔴 Đang lắng nghe... Thả tay để gửi`
                      : `Ấn giữ Micro để nói, hoặc gõ câu hỏi...`
                }
                className="flex-1 h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <button
                onClick={() => {
                  setShowSuggestions(false);
                  handleSendMessage();
                }}
                disabled={!transcript.trim() || coachLoading}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PRONUNCIATION LAB & SHADOWING                     */}
      {/* ======================================================== */}
      {activeTab === 'pronunciation' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 space-y-4">
          {/* Mobile Quick Word Selector: Stepper with Prev/Next Navigation Controls + CustomSelect — No horizontal scroll! */}
          <div className="lg:hidden space-y-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Từ Luyện Âm ({selectedWordIndex + 1}/{practiceWords.length})</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLoadUserFlashcards}
                  disabled={loadingFlashcards}
                  className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition flex items-center gap-1 whitespace-nowrap active:scale-95"
                  title="Nạp từ vựng từ bộ thẻ Flashcard của bạn"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{loadingFlashcards ? '...' : 'Từ thẻ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(true)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-600 dark:text-slate-300 transition active:scale-95"
                  title="Thêm từ vựng riêng của bạn vào danh sách"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Navigation Control Bar: Prev Button + Select + Next Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevWord}
                disabled={selectedWordIndex <= 0}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                title="Từ trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={selectedWord}
                  onChange={(val) => {
                    setSelectedWord(String(val));
                    evaluatePronunciationMatch(String(val), String(val));
                  }}
                  size="sm"
                  options={practiceWords.map((item, idx) => ({
                    value: item.word,
                    label: item.word,
                    badge: item.phoneme,
                    description: `${idx + 1}/${practiceWords.length} • ${item.meaning}`,
                  }))}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleNextWord}
                disabled={selectedWordIndex >= practiceWords.length - 1}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                title="Từ tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Word list to test with Custom Add & Flashcard import */}
            <div className="hidden lg:block space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Danh sách từ luyện âm
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLoadUserFlashcards}
                  disabled={loadingFlashcards}
                  className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-black transition flex items-center gap-1 whitespace-nowrap"
                  title="Nạp từ vựng từ bộ thẻ Flashcard của bạn"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{loadingFlashcards ? 'Đang tải...' : 'Lấy từ thẻ'}</span>
                </button>
                <button
                  onClick={() => setShowAddWordModal(true)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                  title="Thêm từ vựng riêng của bạn vào danh sách"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add Custom Word Mini Modal / Dropdown */}
            {showAddWordModal && (
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/40 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white">Thêm từ luyện phát âm</span>
                  <button onClick={() => setShowAddWordModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Từ tiếng Anh (VD: negotiation)"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Phiên âm (tùy chọn)"
                    value={customIpaInput}
                    onChange={(e) => setCustomIpaInput(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="Ý nghĩa tiếng Việt"
                    value={customMeaningInput}
                    onChange={(e) => setCustomMeaningInput(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                  />
                </div>
                <button
                  onClick={handleAddCustomWord}
                  disabled={!customWordInput.trim()}
                  className="w-full py-1.5 rounded-xl btn-glass-primary text-xs font-black"
                >
                  Thêm Vào Danh Sách Luyện
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {practiceWords.map((item) => (
                <div
                  key={item.word}
                  onClick={() => {
                    setSelectedWord(item.word);
                    evaluatePronunciationMatch(item.word, item.word);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${selectedWord === item.word
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{item.word}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                        {item.phoneme}
                      </span>
                      {item.isCustom && (
                        <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                          Thẻ của bạn
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{item.ipa} • {item.meaning}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(item.word);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 transition"
                    title={`Nghe phát âm chuẩn ${activeLanguage.name}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis & Mouth/Tongue Articulation Guide */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Từ Đang Phân Tích</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 flex items-center gap-1">
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span>{activeLanguage.name} ({activeLanguage.speechLocale})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{selectedWord}</h2>
                    <button
                      onClick={() => speakWord(selectedWord)}
                      className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition"
                      title={`Nghe phát âm bản xứ (${activeLanguage.name})`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Controls: Listen / Replay Native / Record / Replay User Recording */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Native Listen / Replay Button */}
                  <button
                    type="button"
                    onClick={() => speakWord(selectedWord, 1.0)}
                    className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                    title={`Nghe lại phát âm bản xứ chuẩn (${activeLanguage.name})`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="flex items-center gap-1">
                      Nghe chuẩn <CountryFlag languageId={activeLanguage.id} size="xs" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakWord(selectedWord, 0.75)}
                    className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
                    title="Nghe lại ở tốc độ chậm 0.75x"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chậm 0.75x</span>
                  </button>

                  {/* Microphone Record / Stop Button */}
                  {!isPronRecording ? (
                    <button
                      type="button"
                      onClick={handleStartPronRecording}
                      className="px-4 py-2.5 rounded-2xl btn-glass-primary text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 transition active:scale-95"
                      title={`Thu âm nhận diện giọng ${activeLanguage.name} (${activeLanguage.speechLocale})`}
                    >
                      <Mic className="w-4 h-4" />
                      <span className="flex items-center gap-1">
                        <span>{pronRecordedUrl ? 'Thu lại' : 'Thu âm'}</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopPronRecording}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition active:scale-95 animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span className="flex items-center gap-1">
                        <span>Dừng mic</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>({pronRecordingSeconds < 10 ? `0${pronRecordingSeconds}` : pronRecordingSeconds}s)</span>
                      </span>
                    </button>
                  )}

                  {/* Replay User Recording Button */}
                  {pronRecordedUrl && (
                    <button
                      type="button"
                      onClick={handleToggleReplayPronRecording}
                      className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-sm flex items-center gap-2 transition active:scale-95 ${isPlayingPronRecording
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                    >
                      {isPlayingPronRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlayingPronRecording ? 'Đang nghe giọng bạn...' : 'Nghe lại bản thu của bạn'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Banner if mic permission issue */}
              {pronRecErrorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pronRecErrorMessage}</span>
                </div>
              )}

              {recordedSpokenWord && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-500 whitespace-nowrap">Giọng nói nhận diện được:</span>
                  <span className="font-black text-slate-800 dark:text-white">"{recordedSpokenWord}"</span>
                </div>
              )}

              {pronunciationResult && (
                <div className="space-y-4">
                  {/* Pass/Fail Status Banner (Adult threshold > 90%) */}
                  <div
                    className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${pronunciationResult.isPassing
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {pronunciationResult.isPassing ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>
                            {pronunciationResult.isPassing
                              ? 'ĐẠT CHUẨN PHÁT ÂM (>90%)'
                              : 'CHƯA ĐẠT (Yêu cầu người lớn >90%)'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${pronunciationResult.isPassing
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            {pronunciationResult.accuracy}% / 100%
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
                          {pronunciationResult.feedback ||
                            (pronunciationResult.isPassing
                              ? 'Phát âm chuẩn âm vị, ngữ điệu và trọng âm đạt yêu cầu bài thi.'
                              : `Cần đạt trên 90% để vượt qua. Bạn đạt ${pronunciationResult.accuracy}%. Hãy nghe lại từ mẫu và đọc rõ từng âm.`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ Chính Xác Âm Vị</span>
                      <span
                        className={`text-2xl font-black ${pronunciationResult.isPassing ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                      >
                        {pronunciationResult.accuracy}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Trọng Âm (Stress)</span>
                      <span className="text-2xl font-black text-indigo-500">{pronunciationResult.prosody?.stressAccuracy}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nhịp Điệu (Rhythm)</span>
                      <span className="text-2xl font-black text-amber-500">{pronunciationResult.prosody?.rhythmScore}%</span>
                    </div>
                  </div>

                  {/* Articulation Guide Box */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <Waves className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Hướng dẫn Khẩu Hình & Vị Trí Đặt Lưỡi ({pronunciationResult.phonemeAnalysis?.targetPhoneme}):</span>
                    </span>
                    <p><strong>Vị trí lưỡi:</strong> {pronunciationResult.phonemeAnalysis?.tonguePositionGuide}</p>
                    <p><strong>Kỹ thuật đẩy hơi:</strong> {pronunciationResult.phonemeAnalysis?.techniqueTips}</p>
                    <p className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Lưu ý: {pronunciationResult.phonemeAnalysis?.pitfallAlert}</span>
                    </p>
                  </div>

                  {/* Shadowing Mode Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs space-y-2">
                    <span className="font-black flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Chế Độ Shadowing (Nhại Giọng Bản Xứ):</span>
                    </span>
                    <p className="text-slate-500 dark:text-slate-400">
                      1. Bấm loa để nghe người bản xứ đọc mẫu 2 lần. <br />
                      2. Nhại lại ngay lập tức theo ngữ điệu và ngữ âm, không ngắt quãng câu.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const shadowingMap: Record<string, string> = {
                          en: 'I thoroughly inspected the code before deployment.',
                          de: 'Ich habe den Code vor der Bereitstellung gründlich überprüft.',
                          ja: '本番リリースの前にコードを徹底的に検証しました。',
                          zh: '我们在系统部署之前仔细检查了所有代码。',
                          fr: "J'ai inspecté minutieusement le code avant le déploiement.",
                          es: 'Inspeccioné a fondo el código antes del despliegue.',
                          ko: '배포 전에 코드를 철저하게 검토했습니다.',
                        };
                        const sentence = shadowingMap[activeLanguage.id] || shadowingMap.en;
                        speakWord(sentence, 0.9);
                      }}
                      className="mt-2 px-3 py-1.5 rounded-xl btn-glass-primary font-bold flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="flex items-center gap-1.5">
                        <span>Nghe câu mẫu Shadowing</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>({activeLanguage.name})</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ======================================================== */}
      {/* TAB 3: REAL-WORLD SIMULATOR (ROLEPLAY)                   */}
      {/* ======================================================== */}
      {activeTab === 'simulator' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 space-y-4">
          {/* Mobile Quick Scenario Selector: Stepper with Prev/Next Navigation Controls + CustomSelect — No scrollbar */}
          <div className="lg:hidden space-y-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kịch Bản Tình Huống ({currentScenarioIndex + 1}/{SIMULATOR_SCENARIOS.length})</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevScenario}
                disabled={currentScenarioIndex <= 0}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                title="Tình huống trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={simulatorScenario}
                  onChange={(val) => {
                    setSimulatorScenario(String(val));
                    const sc = SIMULATOR_SCENARIOS.find((s) => s.id === val);
                    const greeting = getAILanguageGreeting(activeLanguage.id);
                    setSimulatorHistory([{ role: 'assistant', content: greeting.simulatorOpening(sc?.name || '') }]);
                  }}
                  size="sm"
                  options={SIMULATOR_SCENARIOS.map((sc, idx) => ({
                    value: sc.id,
                    label: sc.name,
                    badge: `${idx + 1}/${SIMULATOR_SCENARIOS.length}`,
                    description: sc.desc,
                  }))}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleNextScenario}
                disabled={currentScenarioIndex >= SIMULATOR_SCENARIOS.length - 1}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                title="Tình huống tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario Chooser - Desktop */}
            <div className="hidden lg:block space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
                Kịch Bản Tình Huống Thực Tế
              </span>
              <div className="space-y-2">
                {[
                  { id: 'job_interview', name: 'Phỏng Vấn Tech Job', desc: 'Đối thoại với Giám đốc Kỹ thuật về kinh nghiệm và xử lý sự cố.' },
                  { id: 'bug_delay_meeting', name: 'Giải Trình Hoãn Release', desc: 'Thuyết phục VP Sản phẩm về việc lùi thời gian do bug nghiêm trọng.' },
                  { id: 'salary_negotiation', name: 'Đàm Phán Tăng Lương', desc: 'Đưa ra luận điểm tăng 25% thu nhập dựa trên hiệu suất.' },
                  { id: 'dining_out', name: 'Gọi Món Nhà Hàng', desc: 'Yêu cầu món ăn theo chế độ ăn uống và hỏi kỹ thành phần.' },
                ].map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSimulatorScenario(sc.id);
                      const greeting = getAILanguageGreeting(activeLanguage.id);
                      setSimulatorHistory([{ role: 'assistant', content: greeting.simulatorOpening(sc.name) }]);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${simulatorScenario === sc.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                  >
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{sc.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
                  </div>
                ))}
              </div>

              {/* Radar Scores Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                  Bảng Điểm Radar Kỹ Năng
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Giao Tiếp</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.communication}/100</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Ngữ Pháp</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.grammar}/100</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Từ Vựng</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.vocabulary}/100</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Độ Tự Tin</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{simulatorRadar.confidence}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roleplay Chat Window */}
            <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden min-h-[420px] sm:min-h-[540px]">
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {simulatorHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${item.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                        }`}
                    >
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {simulatorFeedback && (
                <div className="p-3.5 sm:p-4 bg-emerald-500/10 border-t border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300">
                  <p><strong>Điểm cộng:</strong> {simulatorFeedback.greatPoint}</p>
                  <p className="mt-1"><strong>Nâng cấp gợi ý:</strong> {simulatorFeedback.betterWayToSay}</p>
                </div>
              )}

              <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={simulatorInput}
                  onChange={(e) => setSimulatorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulatorSend()}
                  placeholder="Ứng biến câu trả lời của bạn trong tình huống này..."
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSimulatorSend}
                  className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 shrink-0"
                >
                  Phản xạ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ROOT-CAUSE ERROR BANK & HEATMAP                   */}
      {/* ======================================================== */}
      {activeTab === 'error-bank' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 space-y-4 sm:space-y-6">
          {/* Heatmap Bar */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-black tracking-tight">Bản Đồ Nhiệt Điểm Yếu (English Weakness Heatmap)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {[
                { label: 'Ngữ Pháp', score: 68, color: 'text-amber-500', bar: 'w-[68%]' },
                { label: 'Phát Âm', score: 72, color: 'text-indigo-500', bar: 'w-[72%]' },
                { label: 'Độ Lưu Loát', score: 64, color: 'text-rose-500', bar: 'w-[64%]' },
                { label: 'Vốn Từ Vựng', score: 81, color: 'text-emerald-500', bar: 'w-[81%]' },
                { label: 'Nghe Hiểu', score: 79, color: 'text-cyan-500', bar: 'w-[79%]' },
              ].map((item) => (
                <div key={item.label} className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[11px] sm:text-xs text-slate-400 font-bold block">{item.label}</span>
                  <span className={`text-xl sm:text-2xl font-black ${item.color} mt-0.5 sm:mt-1 block`}>{item.score}/100</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full bg-indigo-500 rounded-full ${item.bar}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Bank Root Cause Cards */}
          <div className="space-y-2.5 sm:space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
              Lỗi Sai Lặp Lại & Nguyên Nhân Gốc Rễ (Root Cause Analysis)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  title: 'Ngôi thứ 3 số ít (He/She/It + V-s/es)',
                  occurrences: 14,
                  root: 'Thói quen tư duy tiếng Việt không chia động từ theo ngôi số ít.',
                  wrong: 'He work in an international bank.',
                  correct: 'He works in an international bank.',
                },
                {
                  title: 'Động từ bất quy tắc thì Quá Khứ Đơn',
                  occurrences: 9,
                  root: 'Chưa tự động hóa các động từ quen thuộc (went, bought, thought, brought).',
                  wrong: 'Yesterday I go to meet the client.',
                  correct: 'Yesterday I went to meet the client.',
                },
                {
                  title: 'Nuốt âm cuối Consonant (/s/, /z/, /t/, /d/)',
                  occurrences: 18,
                  root: 'Tiếng Việt là ngôn ngữ đơn âm tiết, người học hay bỏ quên âm đuôi.',
                  wrong: 'I like this product (thiếu âm /k/)',
                  correct: 'I like [laɪk] this product.',
                },
                {
                  title: 'Dùng sai giới từ chỉ thời gian (In / On / At)',
                  occurrences: 7,
                  root: 'Dịch nghĩa đen từ "ở/vào" từ tiếng Việt sang tiếng Anh.',
                  wrong: 'I will call you in Monday morning.',
                  correct: 'I will call you on Monday morning.',
                },
              ].map((err, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm">{err.title}</h3>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                      {err.occurrences} lần lặp lại
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Nguyên nhân gốc rễ:</strong> {err.root}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                    <div className="text-rose-500 font-semibold line-through flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{err.wrong}</span>
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{err.correct}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: "MAKE ME SOUND BETTER" (BẢN XỨ HÓA)               */}
      {/* ======================================================== */}
      {activeTab === 'sound-better' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>"Make Me Sound Better" — Nâng Cấp Câu Nói Sang Chuẩn Bản Xứ</span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhập bất kỳ câu tiếng Anh nào của bạn. AI sẽ chuyển đổi câu qua 4 cấp độ: Chuẩn ngữ pháp &rarr; Tự nhiên đời thường &rarr; Chuyên nghiệp công sở &rarr; Đậm chất bản xứ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
              <input
                type="text"
                value={soundBetterInput}
                onChange={(e) => setSoundBetterInput(e.target.value)}
                placeholder="Nhập câu bạn muốn nói (ví dụ: I want to talk about project...)"
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleMakeMeSoundBetter}
                disabled={soundBetterLoading || !soundBetterInput.trim()}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 font-bold text-xs transition active:scale-95 shrink-0"
              >
                {soundBetterLoading ? 'Đang nâng cấp...' : 'Bản Xứ Hóa Ngay'}
              </button>
            </div>
          </div>

          {soundBetterResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Correct Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    1. Correct (Chuẩn Ngữ Pháp)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.corrected, 'corrected')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'corrected' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{soundBetterResult.corrected}</p>
                <span className="text-[11px] text-slate-400 block">Sửa sạch lỗi chia thì, chính tả và cấu trúc câu.</span>
              </div>

              {/* 2. Natural Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                    2. Natural (Tự Nhiên Hàng Ngày)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.natural, 'natural')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'natural' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{soundBetterResult.natural}</p>
                <span className="text-[11px] text-slate-400 block">Cách người bản xứ trò chuyện tự nhiên ngoài đời thật.</span>
              </div>

              {/* 3. Professional Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
                    3. Professional (Công Sở & Email)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.professional, 'professional')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'professional' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{soundBetterResult.professional}</p>
                <span className="text-[11px] text-slate-400 block">Trang trọng, lịch thiệp, phù hợp gửi sếp và đối tác.</span>
              </div>

              {/* 4. Native-like Style */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-2 border-indigo-500/30 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase">
                    4. Native-Style (Văn Phong Bản Xứ Đậm Đà)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.nativeStyle, 'nativeStyle')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'nativeStyle' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">{soundBetterResult.nativeStyle}</p>
                <span className="text-[11px] text-slate-400 block">Sử dụng phrasal verbs, idioms và nhịp điệu sinh động.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Secondary Drawer (Drawer Phụ gom toàn bộ chức năng & cài đặt để tối ưu 100% diện tích cho khung chat) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[86%] max-w-[340px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col p-4 space-y-4 overflow-y-auto animate-slide-in-left z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Studio & Cài Đặt</h3>
                  <p className="text-[10px] text-slate-400">Chọn phòng luyện & tùy biến Coach</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1:1 Voice Call Quick Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 text-white space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  Đối Thoại 1:1 Rảnh Tay
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                  {isCallActive ? 'Đang Bật' : 'Chưa Bật'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Nói chuyện liên tục không cần bấm nút gửi. AI tự ngắt câu và phản hồi giọng nói.
              </p>
              <button
                onClick={() => {
                  toggleCallMode();
                  setMobileDrawerOpen(false);
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${isCallActive ? 'bg-rose-600 text-white' : 'btn-glass-primary'
                  }`}
              >
                {isCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isCallActive ? 'Tắt Cuộc Gọi 1:1' : 'Bật Cuộc Gọi 1:1 Rảnh Tay'}</span>
              </button>
            </div>

            {/* 5 Studio Feature Rooms */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                Phòng Luyện Chức Năng
              </span>
              {[
                { id: 'voice', name: 'Voice Coach & Real-Time', icon: Mic, desc: 'Đàm thoại phản xạ 1:1' },
                { id: 'pronunciation', name: 'Phòng Luyện Phát Âm', icon: Volume2, desc: 'Phoneme Lab & Shadowing' },
                { id: 'simulator', name: 'Mô Phỏng Tình Huống', icon: Briefcase, desc: 'Roleplay phỏng vấn & công việc' },
                { id: 'error-bank', name: 'Ngân Hàng Lỗi Sai', icon: BrainCircuit, desc: 'Error Heatmap & sửa lỗi' },
                { id: 'sound-better', name: 'Make Me Sound Better', icon: Sparkles, desc: 'Bản xứ hóa câu văn' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition ${isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate">{tab.name}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{tab.desc}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Coach Settings */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                Cài Đặt Huấn Luyện Viên
              </span>

              {/* AI Voice Selection with CustomSelect & Prev/Next Navigation */}
              <div className="space-y-2 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Giọng Nói AI Coach</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                    <span>{activeLanguage.name}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevVoice}
                    disabled={availableVoices.length <= 1}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                    title="Giọng trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={selectedVoiceURI || 'default'}
                      onChange={(val) => handleSelectVoice(String(val))}
                      size="sm"
                      options={voiceSelectOptions}
                      placeholder={`Chọn giọng ${activeLanguage.name}...`}
                      className="w-full"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextVoice}
                    disabled={availableVoices.length <= 1}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                    title="Giọng tiếp theo"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestVoice()}
                    className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center active:scale-90 transition border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-2xs"
                    title="Nghe thử giọng này"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Translation Settings (Auto-translate to Vietnamese) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Dịch Sang Tiếng Việt</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoTranslateVi;
                      setAutoTranslateVi(next);
                      localStorage.setItem('vocabflow_coach_autotranslate', String(next));
                    }}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${autoTranslateVi ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
                    title={autoTranslateVi ? 'Đang bật dịch tự động sang Tiếng Việt' : 'Đang tắt dịch tự động'}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Tự động dịch câu trả lời của Huấn luyện viên sang Tiếng Việt ngay dưới tin nhắn.
                </p>
              </div>

              {/* Microphone Recording Language Selection */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-500" />
                    Ngôn Ngữ Nhận Diện Micro
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    {speechInputLang === 'vi-VN' ? (
                      <>
                        <CountryFlag languageId="vi" size="xs" />
                        <span>Đang nghe Tiếng Việt</span>
                      </>
                    ) : (
                      <>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>Đang nghe {activeLanguage.name}</span>
                      </>
                    )}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeechInputLang('vi-VN');
                      if (recognitionRef.current) {
                        try { recognitionRef.current.lang = 'vi-VN'; } catch (_) { }
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${speechInputLang === 'vi-VN'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <CountryFlag languageId="vi" size="xs" />
                    <span>Nói Tiếng Việt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetLoc = activeLanguage.speechLocale || 'en-US';
                      setSpeechInputLang(targetLoc);
                      if (recognitionRef.current) {
                        try { recognitionRef.current.lang = targetLoc; } catch (_) { }
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${speechInputLang !== 'vi-VN'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                    <span>Nói {activeLanguage.name}</span>
                  </button>
                </div>
              </div>

              {/* Personality */}
              <CustomSelect
                label="Tính cách AI Coach"
                icon={Smile}
                value={coachPersonality}
                onChange={(val) => setCoachPersonality(String(val))}
                options={[
                  { value: 'Friendly Tutor', label: 'Friendly Tutor', description: 'Kiên nhẫn & Cổ vũ người học' },
                  { value: 'Strict Teacher', label: 'Strict Teacher', description: 'Chỉnh lỗi ngữ pháp nghiêm khắc' },
                  { value: 'Casual Friend', label: 'Casual Friend', description: 'Bạn bè thân thiện, đàm thoại tự nhiên' },
                  { value: 'Work Colleague', label: 'Work Colleague', description: 'Đồng nghiệp công sở' },
                  { value: 'Interview Coach', label: 'Interview Coach', description: 'Chuyên gia phỏng vấn' },
                  { value: 'American Coach', label: 'American Teacher', description: 'Giọng Mỹ chuẩn' },
                  { value: 'British Coach', label: 'British Teacher', description: 'Giọng Anh chuẩn' },
                ]}
                className="w-full text-xs"
              />

              {/* Bilingual fallback */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Cứu cánh song ngữ</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBilingualMode(m)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${bilingualMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{m === 'beginner' ? '50%' : m === 'intermediate' ? '80%' : '100%'}</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fearless Speaking Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nói không sợ sai</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    Mức {fearlessLevel}/3
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  value={fearlessLevel}
                  onChange={(e) => setFearlessLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  {fearlessLevel === 1 && 'Sửa mọi lỗi ngữ pháp & phát âm ngay lập tức.'}
                  {fearlessLevel === 2 && 'Cân bằng giao tiếp tự nhiên và góp ý điểm cốt lõi.'}
                  {fearlessLevel === 3 && 'Tối đa độ trôi chảy, không ngắt lời.'}
                </p>
              </div>
            </div>

            {/* Close Drawer Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl btn-glass-primary font-bold text-xs"
              >
                Xong & Tiếp Tục Trò Chuyện
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHỢ TRỢ LÝ GIA SƯ AI VOCABFLOW (TUTOR MARKETPLACE) */}
      {/* ======================================================== */}
      {tutorMarketModalOpen && (
        <ModalPortal isOpen={tutorMarketModalOpen} onClose={() => setTutorMarketModalOpen(false)}>
            {/* Modal Container — Bottom Sheet on Mobile, Centered Dialog on Tablet/Desktop */}
            <div
              className="w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950/90 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0">
                    🏪
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-black tracking-tight">
                        Chợ Trợ Lý Gia Sư AI ({activeLanguage.name})
                      </h2>
                      <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                        {availableTutors.length} Huấn luyện viên
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80 line-clamp-1">
                      Huấn luyện viên bản xứ đồng hành luyện phản xạ & phát âm chuẩn {activeLanguage.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTutorMarketModalOpen(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                  title="Đóng chợ trợ lý"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tutor Cards Grid */}
              <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {availableTutors.map((tutor) => {
                    const isSelected = coachPersonality === tutor.id;
                    return (
                      <div
                        key={tutor.id}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group ${
                          isSelected
                            ? `${tutor.theme.ringColor} bg-slate-50/80 dark:bg-slate-900/80 shadow-md`
                            : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-white font-black text-[9px] flex items-center gap-1 shadow-xs ${tutor.theme.chipActive}`}>
                            <Check className="w-2.5 h-2.5" />
                            Đang Học
                          </span>
                        )}

                        <div className="space-y-2.5">
                          {/* Tutor Top Profile */}
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform border ${tutor.theme.avatarBg}`}>
                              {tutor.avatar}
                            </div>
                            <div className="min-w-0 flex-1 pr-12">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                {tutor.name}
                              </h3>
                              <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
                                {tutor.vietnameseTitle}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${tutor.badgeColor}`}>
                                  {tutor.tag}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                  • {tutor.accent}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {tutor.description}
                          </p>

                          {/* Specialties */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {tutor.specialty.map((spec) => (
                              <span
                                key={spec}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>

                          {/* Greeting Quote */}
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            "{tutor.greeting}"
                          </div>
                        </div>

                        {/* Action CTA Button */}
                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleSelectTutor(tutor)}
                            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                              isSelected
                                ? `${tutor.theme.chipActive} shadow-sm`
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Đang Đồng Hành Cùng Bạn</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Chọn Học Cùng {tutor.name.split(' ')[0]}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <span>Trợ lý tự động điều chỉnh tốc độ & giọng nói tương thích</span>
                <button
                  type="button"
                  onClick={() => setTutorMarketModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs transition"
                >
                  Đóng
                </button>
              </div>
            </div>
        </ModalPortal>
      )}
    </div>
  );
};
