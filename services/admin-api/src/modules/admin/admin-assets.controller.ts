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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
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
  @Get()
  @ApiOperation({ summary: 'List managed static assets with metadata' })
  listAssets(@Query('category') category?: string, @Query('search') search?: string) {
    const storageDir = getAssetStoragePath();
    const assetsBase = (process.env.ASSETS_BASE_URL || 'https://assets.vocalflow.site').replace(/\/+$/, '');
    const results: any[] = [];

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
            results.push({
              id: relPath.replace(/\\/g, '/'),
              name: entry.name,
              category: itemCategory,
              url: `${assetsBase}/${relPath.replace(/\\/g, '/')}`,
              sizeBytes: stat.size,
              mimeType: ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream',
              updatedAt: stat.mtime.toISOString(),
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
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    }

    return {
      success: true,
      total: filtered.length,
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
      const assetsBase = (process.env.ASSETS_BASE_URL || 'https://assets.vocalflow.site').replace(/\/+$/, '');
      const publicUrl = `${assetsBase}/${sanitizedCategory}/${safeFilename}`;

      uploadedResults.push({
        name: safeFilename,
        category: sanitizedCategory,
        url: publicUrl,
        sizeBytes: file.size,
        mimeType: file.mimetype,
      });
    }

    return {
      success: true,
      message: `Đã tải lên thành công ${uploadedResults.length} file tài nguyên`,
      data: uploadedResults,
    };
  }
}
