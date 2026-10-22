import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Validated MIME types for asset security
const ALLOWED_MIME_TYPES = new Set([
  'image/webp',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
]);

export interface UploadedAssetFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

function getAssetStoragePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'assets'),
    path.resolve(process.cwd(), '../../assets'),
    path.resolve(__dirname, '../../../../assets'),
    '/usr/share/nginx/html/assets',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  const defaultPath = path.resolve(process.cwd(), 'assets');
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath, { recursive: true });
  }
  return defaultPath;
}

@ApiTags('Admin Asset Management')
@Controller('admin/assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminAssetsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to scan system entities for asset URLs and file usages
   */
  private async getAssetUsageMap(): Promise<{
    usedSet: Set<string>;
    usageDetails: Map<string, string[]>;
  }> {
    const usedSet = new Set<string>();
    const usageDetails = new Map<string, string[]>();

    const registerUsage = (rawUrlOrPath: string | null | undefined, label: string) => {
      if (!rawUrlOrPath || typeof rawUrlOrPath !== 'string') return;
      const clean = rawUrlOrPath.trim().toLowerCase();
      if (!clean) return;

      usedSet.add(clean);
      const filename = path.basename(clean);
      usedSet.add(filename);

      try {
        const urlObj = new URL(clean);
        usedSet.add(urlObj.pathname.toLowerCase());
        usedSet.add(urlObj.pathname.replace(/^\/+/, '').toLowerCase());
      } catch {}

      const existing = usageDetails.get(filename) || [];
      if (!existing.includes(label) && existing.length < 5) {
        existing.push(label);
        usageDetails.set(filename, existing);
      }
    };

    try {
      // 1. Vocabulary images & audios
      const vocabs = await this.prisma.vocabulary.findMany({
        where: {
          OR: [{ imageUrl: { not: null } }, { audioUrl: { not: null } }],
        },
        select: { word: true, imageUrl: true, audioUrl: true },
      });
      for (const v of vocabs) {
        if (v.imageUrl) registerUsage(v.imageUrl, `Từ vựng: "${v.word}" (Ảnh)`);
        if (v.audioUrl) registerUsage(v.audioUrl, `Từ vựng: "${v.word}" (Audio)`);
      }

      // 2. Vocabulary Topics icons
      const topics = await this.prisma.vocabularyTopic.findMany({
        where: { icon: { not: null } },
        select: { name: true, icon: true },
      });
      for (const t of topics) {
        if (t.icon) registerUsage(t.icon, `Chủ đề: "${t.name}" (Icon)`);
      }

      // 3. Learning Resources
      const resources = await this.prisma.learningResource.findMany({
        select: { title: true, imageUrl: true, audioUrl: true },
      });
      for (const r of resources) {
        if (r.imageUrl) registerUsage(r.imageUrl, `Học liệu: "${r.title}" (Ảnh)`);
        if (r.audioUrl) registerUsage(r.audioUrl, `Học liệu: "${r.title}" (Audio)`);
      }
    } catch {
      // Failover gracefully if tables are temporarily uninitialized
    }

    // 4. Default active Kid curriculum dataset references
    const kidActiveWords = [
      'bear', 'cat', 'dog', 'elephant', 'lion', 'monkey', 'rabbit', 'frog', 'bird', 'duck',
      'fish', 'turtle', 'butterfly', 'horse', 'pig', 'apple', 'banana', 'orange', 'grape',
      'watermelon', 'strawberry', 'pizza', 'burger', 'milk', 'bread', 'carrot', 'cookie',
      'rice', 'egg', 'water', 'car', 'bus', 'train', 'rocket', 'airplane', 'boat', 'bicycle',
      'book', 'pencil', 'clock', 'bag', 'sun', 'cloud', 'rain', 'rainbow', 'moon', 'star'
    ];
    for (const kw of kidActiveWords) {
      registerUsage(`${kw}.webp`, `Kid Zone: "${kw}" (Flashcard)`);
      registerUsage(`${kw}.png`, `Kid Zone: "${kw}" (Flashcard)`);
      registerUsage(`${kw}.mp3`, `Kid Zone: "${kw}" (Phát âm)`);
    }

    return { usedSet, usageDetails };
  }

  @Get()
  @ApiOperation({ summary: 'List managed static assets with usage status and metadata' })
  async listAssets(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'all' | 'used' | 'unused',
  ) {
    const storageDir = getAssetStoragePath();
    const assetsBase = (process.env.ASSETS_BASE_URL || 'https://assets.letstun.site').replace(/\/+$/, '');
    const results: any[] = [];

    const { usedSet, usageDetails } = await this.getAssetUsageMap();

    const scanDirectory = (dir: string, relPrefix: string = '') => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relPrefix, entry.name);
        if (entry.isDirectory()) {
          scanDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.webp', '.png', '.jpg', '.jpeg', '.mp3', '.ogg', '.wav', '.svg'].includes(ext)) {
            const stat = fs.statSync(fullPath);
            const itemCategory = relPrefix.split(path.sep)[0] || 'general';
            const normalizedId = relPath.replace(/\\/g, '/');
            const filename = entry.name.toLowerCase();
            const fullUrl = `${assetsBase}/${normalizedId}`;

            const isUsed =
              usedSet.has(filename) ||
              usedSet.has(normalizedId.toLowerCase()) ||
              usedSet.has(fullUrl.toLowerCase()) ||
              usedSet.has(path.basename(normalizedId, ext).toLowerCase());

            const detailList = usageDetails.get(filename) || (isUsed ? ['Đang liên kết trong hệ thống học tập'] : []);

            results.push({
              id: normalizedId,
              name: entry.name,
              category: itemCategory,
              url: fullUrl,
              sizeBytes: stat.size,
              mimeType:
                ext === '.webp'
                  ? 'image/webp'
                  : ext === '.png'
                  ? 'image/png'
                  : ext === '.mp3'
                  ? 'audio/mpeg'
                  : ext === '.svg'
                  ? 'image/svg+xml'
                  : ext === '.ogg'
                  ? 'audio/ogg'
                  : ext === '.wav'
                  ? 'audio/wav'
                  : 'application/octet-stream',
              updatedAt: stat.mtime.toISOString(),
              isUsed,
              usageCount: detailList.length,
              usedIn: detailList,
            });
          }
        }
      }
    };

    scanDirectory(storageDir);

    let filtered = results;
    if (category && category !== 'all') {
      filtered = filtered.filter((a) => a.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }

    const totalUsed = filtered.filter((a) => a.isUsed).length;
    const totalUnused = filtered.length - totalUsed;

    if (status === 'used') {
      filtered = filtered.filter((a) => a.isUsed);
    } else if (status === 'unused') {
      filtered = filtered.filter((a) => !a.isUsed);
    }

    return {
      success: true,
      total: filtered.length,
      totalAll: results.length,
      usedCount: totalUsed,
      unusedCount: totalUnused,
      data: filtered,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload validated binary assets to storage volume' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadAssets(
    @UploadedFiles() files: UploadedAssetFile[],
    @Body('category') category: string = 'general',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file để tải lên');
    }

    // Security check: Sanitized category against path traversal
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
    const storageDir = getAssetStoragePath();
    const targetDir = path.join(storageDir, sanitizedCategory);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uploadedResults: any[] = [];
    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(`File ${file.originalname} vượt quá dung lượng tối đa 15MB`);
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(`File ${file.originalname} có định dạng MIME (${file.mimetype}) không được phép`);
      }

      // Security check: Sanitized filename against path traversal
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFilename = `${baseName}${ext}`;
      const destPath = path.join(targetDir, safeFilename);

      fs.writeFileSync(destPath, file.buffer);
      const assetsBase = (process.env.ASSETS_BASE_URL || 'https://assets.letstun.site').replace(/\/+$/, '');
      const publicUrl = `${assetsBase}/${sanitizedCategory}/${safeFilename}`;

      uploadedResults.push({
        id: `${sanitizedCategory}/${safeFilename}`,
        name: safeFilename,
        category: sanitizedCategory,
        url: publicUrl,
        sizeBytes: file.size,
        mimeType: file.mimetype,
        isUsed: false,
        usageCount: 0,
        usedIn: [],
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Đã tải lên thành công ${uploadedResults.length} file tài nguyên`,
      data: uploadedResults,
    };
  }

  @Delete(':id(*)')
  @ApiOperation({ summary: 'Delete a single static asset by relative ID' })
  async deleteAsset(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID tài nguyên không hợp lệ');
    }

    const sanitizedRelPath = id.replace(/\.\./g, '').replace(/^[/\\]+/, '');
    const storageDir = getAssetStoragePath();
    const targetPath = path.resolve(storageDir, sanitizedRelPath);

    if (!targetPath.startsWith(storageDir)) {
      throw new BadRequestException('Đường dẫn truy cập bị từ chối');
    }

    if (!fs.existsSync(targetPath)) {
      throw new NotFoundException('Không tìm thấy file tài nguyên cần xóa');
    }

    try {
      fs.unlinkSync(targetPath);
      return {
        success: true,
        message: `Đã xóa file ${path.basename(targetPath)} thành công`,
      };
    } catch (err: any) {
      throw new BadRequestException(`Lỗi khi xóa file: ${err.message}`);
    }
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple static assets by list of IDs' })
  async bulkDeleteAssets(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách file cần xóa không được để trống');
    }

    const storageDir = getAssetStoragePath();
    let deletedCount = 0;
    const errors: string[] = [];

    for (const rawId of ids) {
      try {
        const sanitizedRelPath = rawId.replace(/\.\./g, '').replace(/^[/\\]+/, '');
        const targetPath = path.resolve(storageDir, sanitizedRelPath);

        if (!targetPath.startsWith(storageDir)) {
          errors.push(`Đường dẫn không an toàn: ${rawId}`);
          continue;
        }

        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          deletedCount++;
        }
      } catch (err: any) {
        errors.push(`Lỗi xóa ${rawId}: ${err.message}`);
      }
    }

    return {
      success: true,
      deletedCount,
      totalRequested: ids.length,
      message: `Đã xóa thành công ${deletedCount}/${ids.length} file tài nguyên`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
