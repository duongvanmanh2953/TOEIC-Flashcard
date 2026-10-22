import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

function loadManifestData(category?: string) {
  const possiblePaths = [
    path.resolve(process.cwd(), 'apps/api/public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'apps/web/public/game-assets/manifest.json'),
    path.resolve(process.cwd(), 'assets/game-assets/manifest.json'),
    path.resolve(__dirname, '../../../public/game-assets/manifest.json'),
    path.resolve(__dirname, '../../public/game-assets/manifest.json'),
    path.resolve(__dirname, '../public/game-assets/manifest.json'),
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
    const assetsBase = (process.env.ASSETS_BASE_URL || 'https://assets.letstun.site').replace(/\/+$/, '');
    
    let items = manifest.items || [];
    if (category) {
      items = items.filter((item: any) => item.category === category);
    }

    const transformedItems = items.map((item: any) => ({
      ...item,
      thumbnail: item.thumbnail.startsWith('http') ? item.thumbnail : `${assetsBase}${item.thumbnail.startsWith('/') ? item.thumbnail : '/' + item.thumbnail}`,
      image: item.image.startsWith('http') ? item.image : `${assetsBase}${item.image.startsWith('/') ? item.image : '/' + item.image}`,
    }));

    return {
      ...manifest,
      totalItems: transformedItems.length,
      items: transformedItems,
    };
  } catch {
    return { version: 1, items: [], totalItems: 0 };
  }
}

@ApiTags('Game Assets Manifest & Resources')
@Controller(['game-assets', 'games/assets'])
export class GameAssetsController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get game asset manifest with thumbnails and metadata' })
  getGameAssets(@Query('category') category?: string) {
    return loadManifestData(category);
  }
}

export { loadManifestData };
