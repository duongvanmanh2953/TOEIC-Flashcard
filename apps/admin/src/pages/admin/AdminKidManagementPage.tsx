import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Volume2,
  Image as ImageIcon,
  Edit2,
  Trash2,
  RefreshCw,
  FolderPlus,
  Sparkles,
  ExternalLink,
  Check,
  LayoutGrid,
  List,
  Upload,
  CheckSquare,
  Square,
  Smile,
  Heart,
  Baby,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmModal } from '../../components/common/ConfirmDialog';
import { SearchableSelect, DropdownOption } from '../../components/common/SearchableSelect';

export interface KidCategory {
  id: string;
  nameVi: string;
  nameEn: string;
  illustration: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  accentGradient?: string;
  wordCount?: number;
}

export interface KidWord {
  id: string;
  word: string;
  letter?: string;
  phonetic: string;
  viMeaning: string;
  category: string;
  categoryVi?: string;
  stage?: 'sprout' | 'plant' | 'tree';
  phrase?: string;
  sentence?: string;
  sentenceVi?: string;
  imageUrl?: string;
  audioUrl?: string;
  emoji?: string;
  isFlashcard?: boolean;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AssetItem {
  id: string;
  name: string;
  category: string;
  url: string;
  mimeType?: string;
}

const DEFAULT_CATEGORIES: KidCategory[] = [
  { id: 'animals', nameVi: 'Động Vật', nameEn: 'Animals', illustration: 'lion', icon: '🦁', color: '#d97706', bgColor: 'bg-amber-50 dark:bg-amber-950/40', accentGradient: 'from-amber-400 to-orange-500' },
  { id: 'fruits', nameVi: 'Trái Cây & Ẩm Thực', nameEn: 'Fruits & Food', illustration: 'apple', icon: '🍎', color: '#e11d48', bgColor: 'bg-rose-50 dark:bg-rose-950/40', accentGradient: 'from-rose-400 to-pink-500' },
  { id: 'family', nameVi: 'Gia Đình & Bạn Bè', nameEn: 'Family & Home', illustration: 'cat', icon: '🐱', color: '#059669', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40', accentGradient: 'from-emerald-400 to-teal-500' },
  { id: 'school', nameVi: 'Trường Học & Dụng Cụ', nameEn: 'School & Stationery', illustration: 'book', icon: '📚', color: '#2563eb', bgColor: 'bg-blue-50 dark:bg-blue-950/40', accentGradient: 'from-blue-400 to-indigo-500' },
  { id: 'transport', nameVi: 'Phương Tiện Giao Thông', nameEn: 'Vehicles & Transport', illustration: 'rocket', icon: '🚀', color: '#7c3aed', bgColor: 'bg-purple-50 dark:bg-purple-950/40', accentGradient: 'from-purple-400 to-indigo-600' },
  { id: 'nature', nameVi: 'Thiên Nhiên & Thời Tiết', nameEn: 'Nature & Weather', illustration: 'sun', icon: '🌈', color: '#0891b2', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40', accentGradient: 'from-cyan-400 to-sky-500' },
  { id: 'colors', nameVi: 'Màu Sắc & Hình Khối', nameEn: 'Colors & Shapes', illustration: 'balloons', icon: '🎈', color: '#db2777', bgColor: 'bg-pink-50 dark:bg-pink-950/40', accentGradient: 'from-pink-400 to-rose-500' },
  { id: 'body', nameVi: 'Cơ Thể & Trang Phục', nameEn: 'Body & Clothes', illustration: 'rabbit', icon: '🐰', color: '#ea580c', bgColor: 'bg-orange-50 dark:bg-orange-950/40', accentGradient: 'from-orange-400 to-amber-500' },
  { id: 'objects', nameVi: 'Đồ Chơi & Đồ Vật', nameEn: 'Toys & Objects', illustration: 'teddy', icon: '🧸', color: '#6366f1', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40', accentGradient: 'from-indigo-400 to-blue-500' },
  { id: 'space', nameVi: 'Vũ Trụ & Khoa Học', nameEn: 'Space & Planets', illustration: 'satellite', icon: '🪐', color: '#9333ea', bgColor: 'bg-violet-50 dark:bg-violet-950/40', accentGradient: 'from-violet-400 to-purple-600' },
];

const INITIAL_WORDS: KidWord[] = [
  { id: 'kid_cat', word: 'cat', letter: 'C', phonetic: '/kæt/', viMeaning: 'Con mèo', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'a cute cat', sentence: 'The cat is sleeping on the mat.', sentenceVi: 'Con mèo đang ngủ trên tấm thảm.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/cat.webp', emoji: '🐱', isFlashcard: true, theme: 'skyCyan' },
  { id: 'kid_dog', word: 'dog', letter: 'D', phonetic: '/dɒɡ/', viMeaning: 'Con chó', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'a friendly dog', sentence: 'The dog wags its tail happily.', sentenceVi: 'Chú chó vẫy đuôi vui mừng.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/dog.webp', emoji: '🐶', isFlashcard: true, theme: 'coral' },
  { id: 'kid_lion', word: 'lion', letter: 'L', phonetic: '/ˈlaɪ.ən/', viMeaning: 'Sư tử', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'the brave lion', sentence: 'The lion is the king of the jungle.', sentenceVi: 'Sư tử là chúa tể rừng xanh.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/lion.webp', emoji: '🦁', isFlashcard: true, theme: 'goldenSun' },
  { id: 'kid_elephant', word: 'elephant', letter: 'E', phonetic: '/ˈel.ɪ.fənt/', viMeaning: 'Con voi', category: 'animals', categoryVi: 'Động Vật', stage: 'plant', phrase: 'a big elephant', sentence: 'The elephant has a long trunk.', sentenceVi: 'Chú voi có chiếc vòi rất dài.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/elephant.webp', emoji: '🐘', isFlashcard: true, theme: 'coral' },
  { id: 'kid_bear', word: 'bear', letter: 'B', phonetic: '/beər/', viMeaning: 'Con gấu', category: 'animals', categoryVi: 'Động Vật', stage: 'sprout', phrase: 'a brown bear', sentence: 'The bear likes eating sweet honey.', sentenceVi: 'Chú gấu thích ăn mật ong ngọt ngào.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/bear.webp', emoji: '🐻', isFlashcard: true, theme: 'emeraldGreen' },
  { id: 'kid_monkey', word: 'monkey', letter: 'M', phonetic: '/ˈmʌŋ.ki/', viMeaning: 'Con khỉ', category: 'animals', categoryVi: 'Động Vật', stage: 'plant', phrase: 'a clever monkey', sentence: 'The monkey climbs the tall tree.', sentenceVi: 'Chú khỉ trèo lên cây cao.', imageUrl: 'https://assets.vocalflow.site/game-assets/animals/monkey.webp', emoji: '🐵', isFlashcard: true, theme: 'goldenSun' },
  { id: 'kid_apple', word: 'apple', letter: 'A', phonetic: '/ˈæp.əl/', viMeaning: 'Quả táo', category: 'fruits', categoryVi: 'Trái Cây & Ẩm Thực', stage: 'tree', phrase: 'a sweet red apple', sentence: 'An apple a day keeps the doctor away.', sentenceVi: 'Mỗi ngày ăn một quả táo rất tốt cho sức khỏe.', imageUrl: 'https://assets.vocalflow.site/game-assets/fruits/apple.webp', emoji: '🍎', isFlashcard: true, theme: 'lavenderPink' },
  { id: 'kid_banana', word: 'banana', letter: 'B', phonetic: '/bəˈnɑː.nə/', viMeaning: 'Quả chuối', category: 'fruits', categoryVi: 'Trái Cây & Ẩm Thực', stage: 'tree', phrase: 'a yellow banana', sentence: 'The monkey is eating a sweet banana.', sentenceVi: 'Chú khỉ đang ăn quả chuối ngọt.', imageUrl: 'https://assets.vocalflow.site/game-assets/fruits/banana.webp', emoji: '🍌', isFlashcard: true, theme: 'goldenSun' },
  { id: 'kid_car', word: 'car', letter: 'C', phonetic: '/kɑːr/', viMeaning: 'Xe ô tô', category: 'transport', categoryVi: 'Phương Tiện Giao Thông', stage: 'tree', phrase: 'a shiny red car', sentence: 'My dad drives a red car to work.', sentenceVi: 'Bố tôi lái xe ô tô màu đỏ đi làm.', imageUrl: 'https://assets.vocalflow.site/game-assets/transport/car.webp', emoji: '🚗', isFlashcard: true, theme: 'coral' },
  { id: 'kid_rocket', word: 'rocket', letter: 'R', phonetic: '/ˈrɒk.ɪt/', viMeaning: 'Tên lửa vũ trụ', category: 'transport', categoryVi: 'Phương Tiện Giao Thông', stage: 'tree', phrase: 'a powerful space rocket', sentence: 'The rocket flies high into the stars.', sentenceVi: 'Tên lửa bay vút lên bầu trời sao.', imageUrl: 'https://assets.vocalflow.site/game-assets/transport/rocket.webp', emoji: '🚀', isFlashcard: true, theme: 'neonAzure' },
  { id: 'kid_book', word: 'book', letter: 'B', phonetic: '/bʊk/', viMeaning: 'Quyển sách', category: 'school', categoryVi: 'Trường Học & Dụng Cụ', stage: 'tree', phrase: 'an interesting picture book', sentence: 'I open the book and read a story.', sentenceVi: 'Tôi mở quyển sách ra và đọc một câu chuyện.', imageUrl: 'https://assets.vocalflow.site/game-assets/school/book.webp', emoji: '📖', isFlashcard: true, theme: 'skyCyan' },
  { id: 'kid_sun', word: 'sun', letter: 'S', phonetic: '/sʌn/', viMeaning: 'Mặt trời', category: 'nature', categoryVi: 'Thiên Nhiên & Thời Tiết', stage: 'tree', phrase: 'bright warm sun', sentence: 'The sun shines brightly in the sky.', sentenceVi: 'Mặt trời chiếu sáng rực rỡ trên bầu trời.', imageUrl: 'https://assets.vocalflow.site/game-assets/nature/sun.webp', emoji: '☀️', isFlashcard: true, theme: 'goldenSun' },
];

const CARD_THEMES: Record<string, { bg: string; border: string; label: string }> = {
  coral: { bg: 'from-orange-500 to-amber-500', border: 'border-orange-400', label: 'Cam Rực Rỡ' },
  skyCyan: { bg: 'from-sky-400 to-blue-600', border: 'border-sky-400', label: 'Xanh Da Trời' },
  lavenderPink: { bg: 'from-pink-400 to-rose-600', border: 'border-pink-400', label: 'Hồng Ngọt Ngào' },
  goldenSun: { bg: 'from-amber-400 to-yellow-500', border: 'border-amber-400', label: 'Vàng Nắng' },
  emeraldGreen: { bg: 'from-emerald-400 to-teal-600', border: 'border-emerald-400', label: 'Xanh Lá Cây' },
  neonAzure: { bg: 'from-cyan-400 to-indigo-600', border: 'border-cyan-400', label: 'Xanh Lam Vũ Trụ' },
};

export const AdminKidManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<KidCategory[]>(DEFAULT_CATEGORIES);
  const [words, setWords] = useState<KidWord[]>(INITIAL_WORDS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());

  // Category Dropdown Options with live counts and icons
  const categoryOptions: DropdownOption[] = useMemo(() => [
    {
      value: 'all',
      label: `✨ Tất cả chủ đề (${words.length} từ)`,
      badge: words.length,
      icon: '✨',
      description: `Hiển thị toàn bộ ${words.length} từ vựng trong tất cả các chủ đề`,
    },
    ...categories.map((cat) => {
      const count = words.filter((w) => w.category === cat.id).length;
      return {
        value: cat.id,
        label: `${cat.nameVi} (${cat.nameEn})`,
        badge: count,
        icon: cat.icon || '📁',
        description: `Chủ đề: ${cat.nameVi} • ${count} từ vựng đang có`,
      };
    }),
  ], [categories, words]);

  // Modals
  const [isWordModalOpen, setIsWordModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<KidWord | null>(null);

  // System assets for the picker
  const [systemAssets, setSystemAssets] = useState<AssetItem[]>([]);
  const [assetPickerSearch, setAssetPickerSearch] = useState<string>('');
  const [assetPickerCategory, setAssetPickerCategory] = useState<string>('all');
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);

  // Form State for Word
  const [formData, setFormData] = useState({
    word: '',
    phonetic: '',
    viMeaning: '',
    category: 'animals',
    stage: 'plant' as 'sprout' | 'plant' | 'tree',
    phrase: '',
    sentence: '',
    sentenceVi: '',
    imageUrl: '',
    audioUrl: '',
    emoji: '⭐',
    theme: 'coral',
    isFlashcard: true,
  });

  // Form State for Category
  const [categoryFormData, setCategoryFormData] = useState({
    nameVi: '',
    nameEn: '',
    icon: '🌟',
    illustration: 'star',
    color: '#4f46e5',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Kid Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catsRes, wordsRes] = await Promise.allSettled([
        api.get('/admin/kid/categories'),
        api.get('/admin/kid/words'),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
        setCategories(catsRes.value.data.data);
      }
      if (wordsRes.status === 'fulfilled' && wordsRes.value.data?.data) {
        setWords(wordsRes.value.data.data);
      }
    } catch {
      // Keep initial sample data on fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load system assets for the image picker
  const fetchSystemAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const res = await api.get('/admin/assets', {
        params: {
          category: assetPickerCategory !== 'all' ? assetPickerCategory : undefined,
          search: assetPickerSearch || undefined,
        },
      });
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setSystemAssets(data);
    } catch {
      // Fallback assets
      setSystemAssets([
        { id: 'kid-animals/bear.webp', name: 'bear.webp', category: 'kid-animals', url: 'https://assets.vocalflow.site/game-assets/animals/bear.webp' },
        { id: 'kid-animals/cat.webp', name: 'cat.webp', category: 'kid-animals', url: 'https://assets.vocalflow.site/game-assets/animals/cat.webp' },
        { id: 'kid-animals/dog.webp', name: 'dog.webp', category: 'kid-animals', url: 'https://assets.vocalflow.site/game-assets/animals/dog.webp' },
        { id: 'kid-animals/elephant.webp', name: 'elephant.webp', category: 'kid-animals', url: 'https://assets.vocalflow.site/game-assets/animals/elephant.webp' },
        { id: 'kid-animals/lion.webp', name: 'lion.webp', category: 'kid-animals', url: 'https://assets.vocalflow.site/game-assets/animals/lion.webp' },
        { id: 'kid-fruits/apple.webp', name: 'apple.webp', category: 'kid-fruits', url: 'https://assets.vocalflow.site/game-assets/fruits/apple.webp' },
        { id: 'kid-fruits/banana.webp', name: 'banana.webp', category: 'kid-fruits', url: 'https://assets.vocalflow.site/game-assets/fruits/banana.webp' },
        { id: 'kid-transport/car.webp', name: 'car.webp', category: 'kid-transport', url: 'https://assets.vocalflow.site/game-assets/transport/car.webp' },
        { id: 'kid-transport/rocket.webp', name: 'rocket.webp', category: 'kid-transport', url: 'https://assets.vocalflow.site/game-assets/transport/rocket.webp' },
      ]);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (isAssetPickerOpen) {
      fetchSystemAssets();
    }
  }, [isAssetPickerOpen, assetPickerCategory]);

  // Filtered Words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (selectedCategory !== 'all' && w.category !== selectedCategory) return false;
      if (selectedStage !== 'all' && w.stage !== selectedStage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          w.word.toLowerCase().includes(q) ||
          w.viMeaning.toLowerCase().includes(q) ||
          (w.phonetic && w.phonetic.toLowerCase().includes(q)) ||
          (w.phrase && w.phrase.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [words, selectedCategory, selectedStage, searchQuery]);

  // Open modal to add new word
  const handleOpenAddWord = (categoryPreselect?: string) => {
    setEditingWord(null);
    setFormData({
      word: '',
      phonetic: '',
      viMeaning: '',
      category: categoryPreselect && categoryPreselect !== 'all' ? categoryPreselect : (categories[0]?.id || 'animals'),
      stage: 'plant',
      phrase: '',
      sentence: '',
      sentenceVi: '',
      imageUrl: '',
      audioUrl: '',
      emoji: '🌟',
      theme: 'coral',
      isFlashcard: true,
    });
    setIsWordModalOpen(true);
  };

  // Open modal to edit word
  const handleOpenEditWord = (wordItem: KidWord) => {
    setEditingWord(wordItem);
    setFormData({
      word: wordItem.word,
      phonetic: wordItem.phonetic || '',
      viMeaning: wordItem.viMeaning,
      category: wordItem.category,
      stage: wordItem.stage || 'plant',
      phrase: wordItem.phrase || '',
      sentence: wordItem.sentence || '',
      sentenceVi: wordItem.sentenceVi || '',
      imageUrl: wordItem.imageUrl || '',
      audioUrl: wordItem.audioUrl || '',
      emoji: wordItem.emoji || '⭐',
      theme: wordItem.theme || 'coral',
      isFlashcard: wordItem.isFlashcard !== false,
    });
    setIsWordModalOpen(true);
  };

  // Auto-generate phonetic suggestions
  const handleAutoSuggestPhonetic = () => {
    if (!formData.word.trim()) return;
    const clean = formData.word.trim().toLowerCase();
    setFormData((prev) => ({
      ...prev,
      phonetic: `/${clean}/`,
      phrase: prev.phrase || `a cute ${clean}`,
      sentence: prev.sentence || `Look at the little ${clean}!`,
      sentenceVi: prev.sentenceVi || `Hãy nhìn kìa!`,
    }));
  };

  // Pronounce audio directly in browser
  const handlePlayVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Kid friendly speed
      utterance.pitch = 1.1; // Friendly higher tone
      window.speechSynthesis.speak(utterance);
    }
  };

  // Direct image file upload inside word modal
  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadForm = new FormData();
    uploadForm.append('files', file);
    uploadForm.append('category', `kid-${formData.category}`);

    try {
      const res = await api.post('/admin/assets/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.[0]?.url;
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      }
    } catch {
      // Local preview fallback if offline
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, imageUrl: localUrl }));
    }
  };

  // Save Word handler
  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word.trim() || !formData.viMeaning.trim()) {
      alert('Vui lòng điền từ tiếng Anh và nghĩa tiếng Việt');
      return;
    }

    setIsSubmitting(true);
    const catObj = categories.find((c) => c.id === formData.category);
    const categoryVi = catObj ? catObj.nameVi : formData.category;

    const payload: Partial<KidWord> = {
      word: formData.word.trim().toLowerCase(),
      letter: (formData.word.trim()[0] || 'A').toUpperCase(),
      phonetic: formData.phonetic.trim() || `/${formData.word.trim().toLowerCase()}/`,
      viMeaning: formData.viMeaning.trim(),
      category: formData.category,
      categoryVi,
      stage: formData.stage,
      phrase: formData.phrase.trim(),
      sentence: formData.sentence.trim(),
      sentenceVi: formData.sentenceVi.trim(),
      imageUrl: formData.imageUrl.trim(),
      audioUrl: formData.audioUrl.trim(),
      emoji: formData.emoji || '✨',
      theme: formData.theme,
      isFlashcard: formData.isFlashcard,
    };

    try {
      if (editingWord) {
        await api.patch(`/admin/kid/words/${editingWord.id}`, payload);
        setWords((prev) =>
          prev.map((w) => (w.id === editingWord.id ? { ...w, ...payload, updatedAt: new Date().toISOString() } : w))
        );
      } else {
        const res = await api.post('/admin/kid/words', payload);
        const createdWord = res.data?.data || {
          ...payload,
          id: `kid_${payload.word}_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setWords((prev) => [createdWord, ...prev]);
      }
      setIsWordModalOpen(false);
    } catch (err: any) {
      // Fallback local persistence
      if (editingWord) {
        setWords((prev) =>
          prev.map((w) => (w.id === editingWord.id ? { ...w, ...payload, updatedAt: new Date().toISOString() } : w))
        );
      } else {
        const newWordItem: KidWord = {
          id: `kid_${payload.word}_${Date.now()}`,
          ...payload as KidWord,
          createdAt: new Date().toISOString(),
        };
        setWords((prev) => [newWordItem, ...prev]);
      }
      setIsWordModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete single word
  const handleDeleteWord = async (wordItem: KidWord) => {
    const ok = await confirmModal({
      title: 'Xóa từ vựng / Flashcard cho bé',
      message: `Bạn có chắc chắn muốn xóa thẻ từ vựng "${wordItem.word}" (${wordItem.viMeaning})?`,
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/kid/words/${wordItem.id}`);
      setWords((prev) => prev.filter((w) => w.id !== wordItem.id));
    } catch {
      setWords((prev) => prev.filter((w) => w.id !== wordItem.id));
    }
  };

  // Bulk delete words
  const handleBulkDeleteWords = async () => {
    if (selectedWordIds.size === 0) return;
    const ok = await confirmModal({
      title: 'Xóa nhiều thẻ từ vựng đã chọn',
      message: `Bạn có chắc chắn muốn xóa ${selectedWordIds.size} thẻ từ vựng đã chọn khỏi kho học liệu Kid?`,
      type: 'danger',
      confirmText: `Xóa ${selectedWordIds.size} thẻ`,
      cancelText: 'Hủy',
    });
    if (!ok) return;

    try {
      await api.post('/admin/kid/words/bulk-delete', { ids: Array.from(selectedWordIds) });
      setWords((prev) => prev.filter((w) => !selectedWordIds.has(w.id)));
      setSelectedWordIds(new Set());
    } catch {
      setWords((prev) => prev.filter((w) => !selectedWordIds.has(w.id)));
      setSelectedWordIds(new Set());
    }
  };

  // Add Category Handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.nameVi.trim() || !categoryFormData.nameEn.trim()) {
      alert('Vui lòng nhập tên khu vực tiếng Việt & tiếng Anh');
      return;
    }

    const slug = categoryFormData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: KidCategory = {
      id: slug,
      nameVi: categoryFormData.nameVi.trim(),
      nameEn: categoryFormData.nameEn.trim(),
      icon: categoryFormData.icon || '🌟',
      illustration: categoryFormData.illustration || 'star',
      color: categoryFormData.color || '#4f46e5',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      accentGradient: 'from-indigo-400 to-purple-500',
      wordCount: 0,
    };

    try {
      await api.post('/admin/kid/categories', newCat);
      setCategories((prev) => [...prev, newCat]);
    } catch {
      setCategories((prev) => [...prev, newCat]);
    }
    setIsCategoryModalOpen(false);
    setSelectedCategory(newCat.id);
  };

  // Selection handlers
  const handleToggleSelectWord = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisibleWords = () => {
    if (selectedWordIds.size >= filteredWords.length && filteredWords.length > 0) {
      setSelectedWordIds(new Set());
    } else {
      const next = new Set(selectedWordIds);
      filteredWords.forEach((w) => next.add(w.id));
      setSelectedWordIds(next);
    }
  };

  // Stats calculation
  const totalWordsCount = words.length;
  const withImagesCount = words.filter((w) => !!w.imageUrl).length;
  const withAudioCount = words.filter((w) => !!w.audioUrl || !!w.word).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Smile className="w-7 h-7 text-amber-500" />
            Quản Lý Nội Dung Kid & Thẻ Học (Kid Zone & Flashcards)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản trị từ vựng thiếu nhi, thẻ Magic Flashcard 3D, hình ảnh hoạt họa và âm thanh phát âm theo từng khu vực.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Add Category */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Thêm Khu Vực</span>
          </button>

          {/* Add Word / Flashcard */}
          <button
            onClick={() => handleOpenAddWord()}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Từ Mới & Thẻ</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng Từ Vựng Kid</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalWordsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase">Khu Vực / Đảo Học</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{categories.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Có Ảnh Minh Họa</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {withImagesCount}{' '}
              <span className="text-xs font-medium text-slate-400">
                ({totalWordsCount > 0 ? Math.round((withImagesCount / totalWordsCount) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Có Phát Âm Audio</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{withAudioCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
            <Volume2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Dropdown Selector with Built-in Search & Direct Action */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-xl">
          <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider shrink-0 flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-amber-500" />
            <span>Khu Vực Từ Vựng (Chủ Đề):</span>
          </label>
          <div className="flex-1 min-w-[240px]">
            <SearchableSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(String(val))}
              options={categoryOptions}
              placeholder="Chọn khu vực từ vựng..."
              searchPlaceholder="Tìm kiếm chủ đề (Động vật, Trái cây, Giao thông...)..."
              size="sm"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenAddWord(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm từ mới
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700/60"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Tạo chủ đề mới
          </button>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm từ tiếng Anh, tiếng Việt, phiên âm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedStage === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả giai đoạn
            </button>
            <button
              onClick={() => setSelectedStage('sprout')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                selectedStage === 'sprout'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌱 Mầm non
            </button>
            <button
              onClick={() => setSelectedStage('plant')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                selectedStage === 'plant'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌿 Đang lớn
            </button>
            <button
              onClick={() => setSelectedStage('tree')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                selectedStage === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌳 Cây lớn
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          {/* Select all */}
          <button
            onClick={handleSelectAllVisibleWords}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            {selectedWordIds.size >= filteredWords.length && filteredWords.length > 0
              ? 'Bỏ chọn tất cả'
              : 'Chọn tất cả hiển thị'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Thẻ Flashcard</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedWordIds.size > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
              {selectedWordIds.size}
            </span>
            <span className="text-xs font-bold">Đã chọn {selectedWordIds.size} thẻ từ vựng</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWordIds(new Set())}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Bỏ chọn
            </button>
            <button
              onClick={handleBulkDeleteWords}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md shadow-rose-900/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa các thẻ đã chọn ({selectedWordIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Words Content: Cards View vs Table View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">Đang tải dữ liệu từ vựng cho bé...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Baby className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Chưa có từ vựng nào trong khu vực này</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hãy nhấn nút "Thêm Từ Mới & Thẻ" để bắt đầu bổ sung hình ảnh và từ vựng cho bé nhé.
          </p>
          <button
            onClick={() => handleOpenAddWord(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thẻ Đầu Tiên</span>
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* ================== FLASHCARDS GRID ================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWords.map((wordItem) => {
            const isSelected = selectedWordIds.has(wordItem.id);
            const themeKey = wordItem.theme || 'coral';
            const themeStyle = CARD_THEMES[themeKey] || CARD_THEMES.coral;

            return (
              <div
                key={wordItem.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Card Gradient Bar */}
                <div className={`h-28 bg-gradient-to-br ${themeStyle.bg} relative p-3 flex flex-col justify-between`}>
                  {/* Select Checkbox */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleSelectWord(wordItem.id)}
                      className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
                      title={isSelected ? 'Bỏ chọn' : 'Chọn thẻ này'}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/25 text-white backdrop-blur-xs">
                        {wordItem.categoryVi || wordItem.category}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center font-black text-xs text-white">
                        {wordItem.letter || wordItem.word[0].toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Play audio button on gradient */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{wordItem.emoji || '⭐'}</span>
                    <button
                      onClick={() => handlePlayVoice(wordItem.word)}
                      className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:scale-110 active:scale-95 transition cursor-pointer"
                      title="Nghe phát âm từ này"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                </div>

                {/* Card Illustration Thumbnail Floating Frame */}
                <div className="relative -mt-10 px-4 flex justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-lg flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform duration-300">
                    {wordItem.imageUrl ? (
                      <img
                        src={wordItem.imageUrl}
                        alt={wordItem.word}
                        loading="lazy"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to placeholder if url fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-black text-indigo-500">
                        {wordItem.letter || wordItem.word[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-4 text-center space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight">
                      {wordItem.word}
                    </h3>
                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {wordItem.phonetic || `/${wordItem.word}/`}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                      {wordItem.viMeaning}
                    </p>
                  </div>

                  {/* Examples */}
                  {(wordItem.phrase || wordItem.sentence) && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-left space-y-1">
                      {wordItem.phrase && (
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 line-clamp-1">
                          • {wordItem.phrase}
                        </p>
                      )}
                      {wordItem.sentence && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-2">
                          "{wordItem.sentence}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      {wordItem.stage === 'sprout' ? '🌱 Mầm non' : wordItem.stage === 'tree' ? '🌳 Cây lớn' : '🌿 Đang lớn'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditWord(wordItem)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Chỉnh sửa từ này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWord(wordItem)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Xóa từ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================== TABLE VIEW ================== */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={handleSelectAllVisibleWords}
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      {selectedWordIds.size >= filteredWords.length && filteredWords.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Ảnh & Từ tiếng Anh</th>
                  <th className="p-3.5">Phiên âm & Nghĩa</th>
                  <th className="p-3.5">Khu vực (Chủ đề)</th>
                  <th className="p-3.5">Giai đoạn</th>
                  <th className="p-3.5">Cụm từ & Mẫu câu</th>
                  <th className="p-3.5">Phát âm</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWords.map((wordItem) => {
                  const isSelected = selectedWordIds.has(wordItem.id);
                  return (
                    <tr
                      key={wordItem.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectWord(wordItem.id)}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {wordItem.imageUrl ? (
                              <img
                                src={wordItem.imageUrl}
                                alt={wordItem.word}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <span className="font-black text-indigo-600 text-sm">
                                {wordItem.letter || wordItem.word[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-slate-100 capitalize">
                              {wordItem.word}
                            </p>
                            <span className="text-[10px] text-slate-400">{wordItem.emoji || '✨'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{wordItem.viMeaning}</p>
                        <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                          {wordItem.phonetic || `/${wordItem.word}/`}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {wordItem.categoryVi || wordItem.category}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-xs">
                          {wordItem.stage === 'sprout'
                            ? '🌱 Mầm non'
                            : wordItem.stage === 'tree'
                            ? '🌳 Cây lớn'
                            : '🌿 Đang lớn'}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        {wordItem.phrase && (
                          <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {wordItem.phrase}
                          </p>
                        )}
                        {wordItem.sentence && (
                          <p className="text-[11px] text-slate-400 truncate">"{wordItem.sentence}"</p>
                        )}
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handlePlayVoice(wordItem.word)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 transition"
                          title="Nghe thử phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditWord(wordItem)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(wordItem)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================== MODAL THÊM / CHỈNH SỬA TỪ MỚI & THẺ FLASHCARD ================== */}
      {isWordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {editingWord ? 'Chỉnh Sửa Thẻ Từ Vựng Cho Bé' : 'Thêm Từ Mới & Thẻ Flashcard Cho Bé'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bổ sung từ, hình ảnh minh họa và câu ví dụ theo từng khu vực
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWordModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="p-6 space-y-4">
              {/* Row 1: English word & Vietnamese Meaning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Từ tiếng Anh (Word) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. dolphin, kangaroo, apple..."
                      value={formData.word}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                      onBlur={handleAutoSuggestPhonetic}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Nghĩa tiếng Việt (Vi Meaning) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cá heo, Chuột túi, Quả táo..."
                    value={formData.viMeaning}
                    onChange={(e) => setFormData({ ...formData, viMeaning: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Phonetic & Category & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Phiên âm IPA
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSuggestPhonetic}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Gợi ý tự động
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="/ˈdɒl.fɪn/"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Khu vực từ vựng *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '📁'} {c.nameVi} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Giai đoạn học
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                  >
                    <option value="sprout">🌱 Mầm non (3-4 tuổi)</option>
                    <option value="plant">🌿 Đang lớn (5-6 tuổi)</option>
                    <option value="tree">🌳 Cây lớn (7-8 tuổi)</option>
                  </select>
                </div>
              </div>

              {/* SECTION: THÊM ẢNH MINH HỌA (IMAGE PICKER & UPLOAD) */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Ảnh minh họa thẻ Flashcard (Add Ảnh)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Hỗ trợ file webp, png, svg từ CDN hoặc tải trực tiếp
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Actions to pick or upload image */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pick from System Assets */}
                      <button
                        type="button"
                        onClick={() => setIsAssetPickerOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Chọn từ Kho Media Hệ Thống</span>
                      </button>

                      {/* Direct Upload */}
                      <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Tải ảnh từ máy</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDirectImageUpload}
                        />
                      </label>

                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="text-xs text-rose-500 hover:underline font-bold"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {/* Direct Image URL input */}
                    <input
                      type="text"
                      placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Example Phrase & Sentence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Cụm từ tiếng Anh mẫu (Example Phrase)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. a cute cat, a big elephant..."
                    value={formData.phrase}
                    onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Emoji đại diện
                  </label>
                  <input
                    type="text"
                    placeholder="🐱, 🐶, 🍎, 🚀..."
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Câu ví dụ tiếng Anh (Sentence)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The cat is sleeping on the mat."
                  value={formData.sentence}
                  onChange={(e) => setFormData({ ...formData, sentence: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Dịch câu ví dụ tiếng Việt
                </label>
                <input
                  type="text"
                  placeholder="e.g. Con mèo đang ngủ trên tấm thảm."
                  value={formData.sentenceVi}
                  onChange={(e) => setFormData({ ...formData, sentenceVi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Màu sắc gradient thẻ Flashcard
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(CARD_THEMES).map(([key, style]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: key })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                        formData.theme === key
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${style.bg} shadow-xs`} />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-5 py-2 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {editingWord ? 'Cập Nhật Thẻ' : 'Thêm Vào Khu Vực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================== MODAL CHỌN ẢNH TỪ KHO MEDIA (ASSET PICKER) ================== */}
      {isAssetPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Kho Ảnh & Tài Nguyên Hệ Thống
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm vào ảnh bất kỳ để chèn vào thẻ Flashcard của bé
                </p>
              </div>
              <button
                onClick={() => setIsAssetPickerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter in picker */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-950/60">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm ảnh theo tên (cat, dog, lion, apple...)"
                  value={assetPickerSearch}
                  onChange={(e) => setAssetPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <select
                value={assetPickerCategory}
                onChange={(e) => setAssetPickerCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
              >
                <option value="all">Tất cả danh mục ảnh</option>
                <option value="kid-animals">Kid Động Vật</option>
                <option value="kid-food">Kid Đồ Ăn</option>
                <option value="kid-objects">Kid Đồ Vật</option>
                <option value="kid-vehicles">Kid Phương Tiện</option>
                <option value="kid-backgrounds">Kid Hình Nền</option>
                <option value="kid-rewards">Phần Thưởng</option>
              </select>
            </div>

            {/* Grid of assets */}
            <div className="p-4 flex-1 overflow-y-auto">
              {isLoadingAssets ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Đang tải danh sách ảnh CDN...</p>
                </div>
              ) : systemAssets.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold">
                  Không tìm thấy hình ảnh nào phù hợp.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {systemAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, imageUrl: asset.url }));
                        setIsAssetPickerOpen(false);
                      }}
                      className="group p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:shadow-md transition text-center cursor-pointer flex flex-col items-center justify-between"
                    >
                      <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden mb-1 p-1">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full" title={asset.name}>
                        {asset.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================== MODAL THÊM KHU VỰC CHỦ ĐỀ MỚI ================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                Thêm Khu Vực Từ Vựng Mới
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tên khu vực (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nghề Nghiệp, Thời Trang..."
                  value={categoryFormData.nameVi}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, nameVi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tên khu vực (Tiếng Anh) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jobs, Fashion..."
                  value={categoryFormData.nameEn}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Emoji icon đại diện
                </label>
                <input
                  type="text"
                  placeholder="👨‍⚕️, 👗, 🎨..."
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs font-black"
                >
                  Tạo Khu Vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKidManagementPage;
