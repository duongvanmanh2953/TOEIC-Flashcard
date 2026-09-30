import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

function loadManifestData(category?: string) {
  const possiblePaths = [
    path.resolve(__dirname, '../../../public/game-assets/manifest.json'),
    path.resolve(__dirname, '../../public/game-assets/manifest.json'),
    path.resolve(__dirname, '../public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'apps/api/public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'apps/web/public/game-assets/manifest.json'),
  ];

  let manifestPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      manifestPath = p;
      break;
    }
  }

  if (!manifestPath) {
    return { version: 1, items: [], totalItems: 0 };
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    if (category) {
      return {
        ...manifest,
        items: manifest.items.filter((item: any) => item.category === category),
      };
    }
    return manifest;
  } catch {
    return { version: 1, items: [], totalItems: 0 };
  }
}

@ApiTags('Game Assets Manifest & Resources')
@Controller('game-assets')
export class GameAssetsController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get game asset manifest with thumbnails and metadata' })
  getGameAssets(@Query('category') category?: string) {
    return loadManifestData(category);
  }
}

export { loadManifestData };
