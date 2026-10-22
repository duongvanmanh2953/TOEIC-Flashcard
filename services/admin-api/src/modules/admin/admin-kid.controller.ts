import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface KidCategoryItem {
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

export interface KidWordItem {
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
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_KID_CATEGORIES: KidCategoryItem[] = [
  {
    id: 'animals',
    nameVi: 'Động Vật',
    nameEn: 'Animals',
    illustration: 'lion',
    icon: '🦁',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    accentGradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'fruits',
    nameVi: 'Trái Cây & Ẩm Thực',
    nameEn: 'Fruits & Food',
    illustration: 'apple',
    icon: '🍎',
    color: '#e11d48',
    bgColor: 'bg-rose-50',
    accentGradient: 'from-rose-400 to-pink-500',
  },
  {
    id: 'family',
    nameVi: 'Gia Đình & Bạn Bè',
    nameEn: 'Family & Home',
    illustration: 'cat',
    icon: '🐱',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    accentGradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'school',
    nameVi: 'Trường Học & Dụng Cụ',
    nameEn: 'School & Stationery',
    illustration: 'book',
    icon: '📚',
    color: '#2563eb',
    bgColor: 'bg-blue-50',
    accentGradient: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'transport',
    nameVi: 'Phương Tiện Giao Thông',
    nameEn: 'Vehicles & Transport',
    illustration: 'rocket',
    icon: '🚀',
    color: '#7c3aed',
    bgColor: 'bg-purple-50',
    accentGradient: 'from-purple-400 to-indigo-600',
  },
  {
    id: 'nature',
    nameVi: 'Thiên Nhiên & Thời Tiết',
    nameEn: 'Nature & Weather',
    illustration: 'sun',
    icon: '🌈',
    color: '#0891b2',
    bgColor: 'bg-cyan-50',
    accentGradient: 'from-cyan-400 to-sky-500',
  },
  {
    id: 'colors',
    nameVi: 'Màu Sắc & Hình Khối',
    nameEn: 'Colors & Shapes',
    illustration: 'balloons',
    icon: '🎈',
    color: '#db2777',
    bgColor: 'bg-pink-50',
    accentGradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 'body',
    nameVi: 'Cơ Thể & Trang Phục',
    nameEn: 'Body & Clothes',
    illustration: 'rabbit',
    icon: '🐰',
    color: '#ea580c',
    bgColor: 'bg-orange-50',
    accentGradient: 'from-orange-400 to-amber-500',
  },
  {
    id: 'objects',
    nameVi: 'Đồ Chơi & Đồ Vật',
    nameEn: 'Toys & Objects',
    illustration: 'teddy',
    icon: '🧸',
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    accentGradient: 'from-indigo-400 to-blue-500',
  },
  {
    id: 'space',
    nameVi: 'Vũ Trụ & Khoa Học',
    nameEn: 'Space & Planets',
    illustration: 'satellite',
    icon: '🪐',
    color: '#9333ea',
    bgColor: 'bg-violet-50',
    accentGradient: 'from-violet-400 to-purple-600',
  },
];

const INITIAL_KID_VOCABULARY: KidWordItem[] = [
  { id: 'kid_cat', word: 'cat', letter: 'C', phonetic: '/kæt/', viMeaning: 'Con mèo', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'a cute cat', sentence: 'The cat is sleeping on the mat.', sentenceVi: 'Con mèo đang ngủ trên tấm thảm.', imageUrl: 'https://assets.letstun.site/game-assets/animals/cat.webp', emoji: '🐱', isFlashcard: true },
  { id: 'kid_dog', word: 'dog', letter: 'D', phonetic: '/dɒɡ/', viMeaning: 'Con chó', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'a friendly dog', sentence: 'The dog wags its tail happily.', sentenceVi: 'Chú chó vẫy đuôi vui mừng.', imageUrl: 'https://assets.letstun.site/game-assets/animals/dog.webp', emoji: '🐶', isFlashcard: true },
  { id: 'kid_lion', word: 'lion', letter: 'L', phonetic: '/ˈlaɪ.ən/', viMeaning: 'Sư tử', category: 'animals', categoryVi: 'Động Vật', stage: 'tree', phrase: 'the brave lion', sentence: 'The lion is the king of the jungle.', sentenceVi: 'Sư tử là chúa tể rừng xanh.', imageUrl: 'https://assets.letstun.site/game-assets/animals/lion.webp', emoji: '🦁', isFlashcard: true },
  { id: 'kid_elephant', word: 'elephant', letter: 'E', phonetic: '/ˈel.ɪ.fənt/', viMeaning: 'Con voi', category: 'animals', categoryVi: 'Động Vật', stage: 'plant', phrase: 'a big elephant', sentence: 'The elephant has a long trunk.', sentenceVi: 'Chú voi có chiếc vòi rất dài.', imageUrl: 'https://assets.letstun.site/game-assets/animals/elephant.webp', emoji: '🐘', isFlashcard: true },
  { id: 'kid_bear', word: 'bear', letter: 'B', phonetic: '/beər/', viMeaning: 'Con gấu', category: 'animals', categoryVi: 'Động Vật', stage: 'sprout', phrase: 'a brown bear', sentence: 'The bear likes eating sweet honey.', sentenceVi: 'Chú gấu thích ăn mật ong ngọt ngào.', imageUrl: 'https://assets.letstun.site/game-assets/animals/bear.webp', emoji: '🐻', isFlashcard: true },
  { id: 'kid_monkey', word: 'monkey', letter: 'M', phonetic: '/ˈmʌŋ.ki/', viMeaning: 'Con khỉ', category: 'animals', categoryVi: 'Động Vật', stage: 'plant', phrase: 'a clever monkey', sentence: 'The monkey climbs the tall tree.', sentenceVi: 'Chú khỉ trèo lên cây cao.', imageUrl: 'https://assets.letstun.site/game-assets/animals/monkey.webp', emoji: '🐵', isFlashcard: true },
  { id: 'kid_apple', word: 'apple', letter: 'A', phonetic: '/ˈæp.əl/', viMeaning: 'Quả táo', category: 'fruits', categoryVi: 'Trái Cây & Ẩm Thực', stage: 'tree', phrase: 'a sweet red apple', sentence: 'An apple a day keeps the doctor away.', sentenceVi: 'Mỗi ngày ăn một quả táo rất tốt cho sức khỏe.', imageUrl: 'https://assets.letstun.site/game-assets/fruits/apple.webp', emoji: '🍎', isFlashcard: true },
  { id: 'kid_banana', word: 'banana', letter: 'B', phonetic: '/bəˈnɑː.nə/', viMeaning: 'Quả chuối', category: 'fruits', categoryVi: 'Trái Cây & Ẩm Thực', stage: 'tree', phrase: 'a yellow banana', sentence: 'The monkey is eating a sweet banana.', sentenceVi: 'Chú khỉ đang ăn quả chuối ngọt.', imageUrl: 'https://assets.letstun.site/game-assets/fruits/banana.webp', emoji: '🍌', isFlashcard: true },
  { id: 'kid_pizza', word: 'pizza', letter: 'P', phonetic: '/ˈpiːt.sə/', viMeaning: 'Bánh pizza', category: 'fruits', categoryVi: 'Trái Cây & Ẩm Thực', stage: 'plant', phrase: 'delicious cheese pizza', sentence: 'We share a hot pizza for dinner.', sentenceVi: 'Cả nhà cùng ăn bánh pizza nóng cho bữa tối.', imageUrl: 'https://assets.letstun.site/game-assets/fruits/pizza.webp', emoji: '🍕', isFlashcard: true },
  { id: 'kid_car', word: 'car', letter: 'C', phonetic: '/kɑːr/', viMeaning: 'Xe ô tô', category: 'transport', categoryVi: 'Phương Tiện Giao Thông', stage: 'tree', phrase: 'a shiny red car', sentence: 'My dad drives a red car to work.', sentenceVi: 'Bố tôi lái xe ô tô màu đỏ đi làm.', imageUrl: 'https://assets.letstun.site/game-assets/transport/car.webp', emoji: '🚗', isFlashcard: true },
  { id: 'kid_bus', word: 'bus', letter: 'B', phonetic: '/bʌs/', viMeaning: 'Xe buýt', category: 'transport', categoryVi: 'Phương Tiện Giao Thông', stage: 'tree', phrase: 'the yellow school bus', sentence: 'Children ride the bus to school.', sentenceVi: 'Các bạn nhỏ đi xe buýt đến trường.', imageUrl: 'https://assets.letstun.site/game-assets/transport/bus.webp', emoji: '🚌', isFlashcard: true },
  { id: 'kid_rocket', word: 'rocket', letter: 'R', phonetic: '/ˈrɒk.ɪt/', viMeaning: 'Tên lửa vũ trụ', category: 'transport', categoryVi: 'Phương Tiện Giao Thông', stage: 'tree', phrase: 'a powerful space rocket', sentence: 'The rocket flies high into the stars.', sentenceVi: 'Tên lửa bay vút lên bầu trời sao.', imageUrl: 'https://assets.letstun.site/game-assets/transport/rocket.webp', emoji: '🚀', isFlashcard: true },
  { id: 'kid_book', word: 'book', letter: 'B', phonetic: '/bʊk/', viMeaning: 'Quyển sách', category: 'school', categoryVi: 'Trường Học & Dụng Cụ', stage: 'tree', phrase: 'an interesting picture book', sentence: 'I open the book and read a story.', sentenceVi: 'Tôi mở quyển sách ra và đọc một câu chuyện.', imageUrl: 'https://assets.letstun.site/game-assets/school/book.webp', emoji: '📖', isFlashcard: true },
  { id: 'kid_pencil', word: 'pencil', letter: 'P', phonetic: '/ˈpen.səl/', viMeaning: 'Bút chì', category: 'school', categoryVi: 'Trường Học & Dụng Cụ', stage: 'tree', phrase: 'a sharp pencil', sentence: 'Draw a sunny picture with your pencil.', sentenceVi: 'Vẽ một bức tranh đầy nắng bằng bút chì.', imageUrl: 'https://assets.letstun.site/game-assets/school/pencil.webp', emoji: '✏️', isFlashcard: true },
  { id: 'kid_sun', word: 'sun', letter: 'S', phonetic: '/sʌn/', viMeaning: 'Mặt trời', category: 'nature', categoryVi: 'Thiên Nhiên & Thời Tiết', stage: 'tree', phrase: 'bright warm sun', sentence: 'The sun shines brightly in the sky.', sentenceVi: 'Mặt trời chiếu sáng rực rỡ trên bầu trời.', imageUrl: 'https://assets.letstun.site/game-assets/nature/sun.webp', emoji: '☀️', isFlashcard: true },
  { id: 'kid_rainbow', word: 'rainbow', letter: 'R', phonetic: '/ˈreɪn.bəʊ/', viMeaning: 'Cầu vồng', category: 'nature', categoryVi: 'Thiên Nhiên & Thời Tiết', stage: 'tree', phrase: 'a beautiful rainbow', sentence: 'A rainbow appears after the rain.', sentenceVi: 'Cầu vồng rực rỡ xuất hiện sau cơn mưa.', imageUrl: 'https://assets.letstun.site/game-assets/nature/rainbow.webp', emoji: '🌈', isFlashcard: true },
];

function getKidStorageFilePath(): string {
  const dir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'kid_vocabulary_store.json');
}

function loadStoredKidData(): { categories: KidCategoryItem[]; words: KidWordItem[] } {
  const filePath = getKidStorageFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        categories: parsed.categories || DEFAULT_KID_CATEGORIES,
        words: parsed.words || INITIAL_KID_VOCABULARY,
      };
    } catch {
      // Ignore parse error and fallback
    }
  }
  return {
    categories: [...DEFAULT_KID_CATEGORIES],
    words: [...INITIAL_KID_VOCABULARY],
  };
}

function saveStoredKidData(data: { categories: KidCategoryItem[]; words: KidWordItem[] }) {
  const filePath = getKidStorageFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

@ApiTags('Admin Kid Zone Management')
@Controller('admin/kid')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminKidController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all kid vocabulary areas / categories' })
  getCategories() {
    const { categories, words } = loadStoredKidData();
    const categoriesWithCount = categories.map((cat) => {
      const count = words.filter((w) => w.category === cat.id).length;
      return {
        ...cat,
        wordCount: count,
      };
    });

    return {
      success: true,
      total: categoriesWithCount.length,
      data: categoriesWithCount,
    };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new kid vocabulary area / category' })
  createCategory(@Body() body: Partial<KidCategoryItem>) {
    if (!body.nameVi || !body.nameEn) {
      throw new BadRequestException('Tên khu vực (tiếng Việt & tiếng Anh) không được để trống');
    }

    const { categories, words } = loadStoredKidData();
    const slug = (body.id || body.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

    if (categories.some((c) => c.id === slug)) {
      throw new BadRequestException(`Khu vực với mã "${slug}" đã tồn tại`);
    }

    const newCategory: KidCategoryItem = {
      id: slug,
      nameVi: body.nameVi.trim(),
      nameEn: body.nameEn.trim(),
      illustration: body.illustration || 'star',
      icon: body.icon || '🌟',
      color: body.color || '#4f46e5',
      bgColor: body.bgColor || 'bg-indigo-50',
      accentGradient: body.accentGradient || 'from-indigo-400 to-purple-500',
    };

    categories.push(newCategory);
    saveStoredKidData({ categories, words });

    return {
      success: true,
      message: `Đã thêm khu vực mới: ${newCategory.nameVi}`,
      data: newCategory,
    };
  }

  @Get('words')
  @ApiOperation({ summary: 'Get kid words and flashcards with filters' })
  getWords(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('stage') stage?: string,
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '50',
  ) {
    const { categories, words } = loadStoredKidData();
    let filtered = words;

    if (category && category !== 'all') {
      filtered = filtered.filter((w) => w.category === category);
    }

    if (stage && stage !== 'all') {
      filtered = filtered.filter((w) => w.stage === stage);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.viMeaning.toLowerCase().includes(q) ||
          (w.phonetic && w.phonetic.toLowerCase().includes(q)) ||
          (w.phrase && w.phrase.toLowerCase().includes(q)),
      );
    }

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.max(1, parseInt(limitStr, 10) || 50);
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories,
      data: paginated,
    };
  }

  @Post('words')
  @ApiOperation({ summary: 'Add a new kid word / flashcard to a category' })
  async createWord(@Body() body: Partial<KidWordItem>) {
    if (!body.word || !body.word.trim()) {
      throw new BadRequestException('Từ tiếng Anh không được để trống');
    }
    if (!body.viMeaning || !body.viMeaning.trim()) {
      throw new BadRequestException('Nghĩa tiếng Việt không được để trống');
    }
    if (!body.category) {
      throw new BadRequestException('Vui lòng chọn khu vực từ vựng cho bé');
    }

    const cleanWord = body.word.trim().toLowerCase();
    const { categories, words } = loadStoredKidData();

    const catObj = categories.find((c) => c.id === body.category);
    const categoryVi = catObj ? catObj.nameVi : body.category;

    const newId = `kid_${cleanWord.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newWord: KidWordItem = {
      id: newId,
      word: cleanWord,
      letter: (cleanWord[0] || 'A').toUpperCase(),
      phonetic: body.phonetic || `/${cleanWord}/`,
      viMeaning: body.viMeaning.trim(),
      category: body.category,
      categoryVi,
      stage: body.stage || 'plant',
      phrase: body.phrase || `a ${cleanWord}`,
      sentence: body.sentence || `Look at the ${cleanWord}!`,
      sentenceVi: body.sentenceVi || `Hãy nhìn vào ${body.viMeaning.trim()} kìa!`,
      imageUrl: body.imageUrl || '',
      audioUrl: body.audioUrl || `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanWord)}&tl=en&client=tw-ob`,
      emoji: body.emoji || '✨',
      isFlashcard: body.isFlashcard !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend to top
    words.unshift(newWord);
    saveStoredKidData({ categories, words });

    // Also persist into PostgreSQL database via Prisma for cross-app synchronization
    try {
      await this.prisma.vocabulary.upsert({
        where: { word: cleanWord },
        create: {
          word: cleanWord,
          normalizedWord: cleanWord,
          definition: newWord.viMeaning,
          shortDefinition: newWord.viMeaning,
          phonetic: newWord.phonetic,
          cefrLevel: 'A1',
          imageUrl: newWord.imageUrl || null,
          audioUrl: newWord.audioUrl || null,
          meanings: {
            create: [{ meaning: newWord.viMeaning }],
          },
          examples: newWord.sentence
            ? {
                create: [{ sentence: newWord.sentence, translation: newWord.sentenceVi }],
              }
            : undefined,
        },
        update: {
          definition: newWord.viMeaning,
          shortDefinition: newWord.viMeaning,
          phonetic: newWord.phonetic,
          imageUrl: newWord.imageUrl || undefined,
          audioUrl: newWord.audioUrl || undefined,
        },
      });
    } catch {
      // Non-blocking sync failover
    }

    return {
      success: true,
      message: `Đã thêm từ vựng mới "${cleanWord}" vào khu vực ${categoryVi}`,
      data: newWord,
    };
  }

  @Patch('words/:id')
  @ApiOperation({ summary: 'Update an existing kid word / flashcard' })
  async updateWord(@Param('id') id: string, @Body() body: Partial<KidWordItem>) {
    const { categories, words } = loadStoredKidData();
    const index = words.findIndex((w) => w.id === id);

    if (index === -1) {
      throw new NotFoundException(`Không tìm thấy từ vựng có mã "${id}"`);
    }

    const current = words[index];
    const catObj = body.category ? categories.find((c) => c.id === body.category) : undefined;

    const updated: KidWordItem = {
      ...current,
      ...body,
      word: body.word ? body.word.trim().toLowerCase() : current.word,
      letter: body.word ? (body.word.trim()[0] || 'A').toUpperCase() : current.letter,
      categoryVi: catObj ? catObj.nameVi : current.categoryVi,
      updatedAt: new Date().toISOString(),
    };

    words[index] = updated;
    saveStoredKidData({ categories, words });

    // Update DB
    try {
      await this.prisma.vocabulary.updateMany({
        where: { word: updated.word },
        data: {
          definition: updated.viMeaning,
          shortDefinition: updated.viMeaning,
          phonetic: updated.phonetic,
          imageUrl: updated.imageUrl || null,
          audioUrl: updated.audioUrl || null,
        },
      });
    } catch {}

    return {
      success: true,
      message: `Đã cập nhật từ "${updated.word}" thành công`,
      data: updated,
    };
  }

  @Delete('words/:id')
  @ApiOperation({ summary: 'Delete a kid word / flashcard' })
  deleteWord(@Param('id') id: string) {
    const { categories, words } = loadStoredKidData();
    const index = words.findIndex((w) => w.id === id);

    if (index === -1) {
      throw new NotFoundException(`Không tìm thấy từ vựng có mã "${id}"`);
    }

    const deletedWord = words[index];
    words.splice(index, 1);
    saveStoredKidData({ categories, words });

    return {
      success: true,
      message: `Đã xóa từ "${deletedWord.word}" khỏi danh sách`,
    };
  }

  @Post('words/bulk-delete')
  @ApiOperation({ summary: 'Delete multiple kid words by IDs' })
  bulkDeleteWords(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID cần xóa không được để trống');
    }

    const { categories, words } = loadStoredKidData();
    const idsSet = new Set(ids);
    const beforeCount = words.length;
    const remaining = words.filter((w) => !idsSet.has(w.id));
    const deletedCount = beforeCount - remaining.length;

    saveStoredKidData({ categories, words: remaining });

    return {
      success: true,
      deletedCount,
      message: `Đã xóa thành công ${deletedCount} từ vựng đã chọn`,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overview statistics for Kid Zone' })
  getStats() {
    const { categories, words } = loadStoredKidData();
    const totalWords = words.length;
    const withImages = words.filter((w) => !!w.imageUrl).length;
    const withAudio = words.filter((w) => !!w.audioUrl).length;
    const flashcardsCount = words.filter((w) => w.isFlashcard).length;

    return {
      success: true,
      data: {
        totalWords,
        totalCategories: categories.length,
        withImages,
        withAudio,
        flashcardsCount,
        imageRatio: totalWords > 0 ? Math.round((withImages / totalWords) * 100) : 0,
        audioRatio: totalWords > 0 ? Math.round((withAudio / totalWords) * 100) : 0,
      },
    };
  }
}
