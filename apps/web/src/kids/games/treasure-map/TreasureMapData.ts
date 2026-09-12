// ============================================================================
// TREASURE MAP ADVENTURE — DATA DEFINITION & LANDMARKS
// Continuous winding path through 6 distinctive areas:
// Camp -> Beach -> Gate -> Bridge/River -> Mountain/Flag -> Cave -> Chest
// ============================================================================

export type QuestTargetType = 'key' | 'gate' | 'bridge' | 'flag' | 'torch' | 'chest';

export type CharacterActionState = 'idle' | 'walk' | 'happy' | 'confused' | 'celebrate';

export type GameMachineState =
  | 'loading'
  | 'intro'
  | 'teaching'
  | 'instruction'
  | 'exploring'
  | 'interaction'
  | 'success'
  | 'traveling'
  | 'completed';

export interface MapLandmarkNode {
  id: string;
  nameEn: string;
  nameVi: string;
  x: number;
  y: number;
  area: 'camp' | 'beach' | 'gate' | 'river' | 'mountain' | 'cave' | 'summit';
  questIndex: number;
}

export interface TreasureQuest {
  id: string;
  stepIndex: number;
  titleEn: string;
  titleVi: string;
  instructionEn: string;
  instructionVi: string;
  targetWord: string;
  targetWordVi: string;
  targetWordPhonetic: string;
  teachingEn: string;
  teachingVi: string;
  targetType: QuestTargetType;
  fromNodeId: string;
  toNodeId: string;
  stars: number;
  areaNameVi: string;
}

export interface InventoryItem {
  id: string;
  nameEn: string;
  nameVi: string;
  iconType: 'key' | 'wood' | 'torch' | 'compass' | 'flag';
  count?: number;
}

// 7 Key Waypoints on the continuous island map (Coordinates calibrated for 800x820 viewport)
export const MAP_LANDMARKS: MapLandmarkNode[] = [
  {
    id: 'camp',
    nameEn: 'Start Camp',
    nameVi: 'Trại Xuất Phát',
    x: 120,
    y: 720,
    area: 'camp',
    questIndex: -1,
  },
  {
    id: 'beach',
    nameEn: 'Sunny Beach',
    nameVi: 'Bãi Biển Vàng',
    x: 200,
    y: 590,
    area: 'beach',
    questIndex: 0,
  },
  {
    id: 'gate',
    nameEn: 'Ancient Forest Gate',
    nameVi: 'Cổng Rừng Cổ Xưa',
    x: 350,
    y: 470,
    area: 'gate',
    questIndex: 1,
  },
  {
    id: 'river',
    nameEn: 'Jungle River Bridge',
    nameVi: 'Cầu Sông Nhiệt Đới',
    x: 540,
    y: 380,
    area: 'river',
    questIndex: 2,
  },
  {
    id: 'mountain',
    nameEn: 'Rocky Mountain Peak',
    nameVi: 'Chân Núi Đá',
    x: 670,
    y: 270,
    area: 'mountain',
    questIndex: 3,
  },
  {
    id: 'cave',
    nameEn: 'Crystal Dark Cave',
    nameVi: 'Hang Động Pha Lê',
    x: 540,
    y: 150,
    area: 'cave',
    questIndex: 4,
  },
  {
    id: 'summit',
    nameEn: 'Treasure Summit Citadel',
    nameVi: 'Đỉnh Kho Báu Hoàng Kim',
    x: 330,
    y: 80,
    area: 'summit',
    questIndex: 5,
  },
];

// Single Continuous Cubic Bézier SVG Path connecting Camp -> Summit
export const TREASURE_MAP_CONTINUOUS_PATH = `
  M 120,720
  C 140,660 170,620 200,590
  C 240,550 290,510 350,470
  C 410,430 480,400 540,380
  C 600,355 650,320 670,270
  C 690,220 630,170 540,150
  C 460,130 390,105 330,80
`.replace(/\s+/g, ' ').trim();

// 6 Structured Pedagogical Quests: See -> Hear -> Understand -> Act -> Reward
export const TREASURE_QUESTS: TreasureQuest[] = [
  {
    id: 'quest_1_key',
    stepIndex: 0,
    titleEn: 'Find the Key',
    titleVi: 'Tìm Chìa Khóa Vàng',
    instructionEn: 'Find the golden key!',
    instructionVi: 'Bé hãy chạm vào chiếc chìa khóa vàng trên bãi cát nhé!',
    targetWord: 'Key',
    targetWordVi: 'Chìa khóa',
    targetWordPhonetic: '/kiː/',
    teachingEn: 'This is a golden key. We need it to open secret locks!',
    teachingVi: 'Đây là chiếc chìa khóa thần kỳ để mở các ổ khóa bí mật!',
    targetType: 'key',
    fromNodeId: 'camp',
    toNodeId: 'beach',
    stars: 2,
    areaNameVi: 'Bãi Biển Vàng',
  },
  {
    id: 'quest_2_gate',
    stepIndex: 1,
    titleEn: 'Open the Gate',
    titleVi: 'Mở Cổng Rừng Cổ Xưa',
    instructionEn: 'Open the gate with your key!',
    instructionVi: 'Dùng chìa khóa vàng mở cổng rừng để tiếp tục hành trình!',
    targetWord: 'Gate',
    targetWordVi: 'Cổng',
    targetWordPhonetic: '/ɡeɪt/',
    teachingEn: 'A giant wooden gate blocks the path. Use the key to unlock it!',
    teachingVi: 'Một cánh cổng gỗ lớn chắn đường. Hãy tra chìa khóa vào ổ!',
    targetType: 'gate',
    fromNodeId: 'beach',
    toNodeId: 'gate',
    stars: 2,
    areaNameVi: 'Cổng Rừng Cổ Xưa',
  },
  {
    id: 'quest_3_bridge',
    stepIndex: 2,
    titleEn: 'Build the Bridge',
    titleVi: 'Bắc Cầu Qua Sông',
    instructionEn: 'Build the bridge! Place 3 wooden planks.',
    instructionVi: 'Cầu sông bị gãy, bé hãy ghép 3 thanh gỗ để hoàn thiện cây cầu!',
    targetWord: 'Bridge',
    targetWordVi: 'Cây cầu',
    targetWordPhonetic: '/brɪdʒ/',
    teachingEn: 'Look! The bridge is broken. Let’s place the wooden planks!',
    teachingVi: 'Cây cầu qua dòng sông đang thiếu ván gỗ. Chúng ta cùng sửa cầu nào!',
    targetType: 'bridge',
    fromNodeId: 'gate',
    toNodeId: 'river',
    stars: 3,
    areaNameVi: 'Cầu Sông Nhiệt Đới',
  },
  {
    id: 'quest_4_flag',
    stepIndex: 3,
    titleEn: 'Find the Blue Flag',
    titleVi: 'Cắm Cờ Xanh Chinh Phục Núi',
    instructionEn: 'Find the blue flag on the rocky mountain!',
    instructionVi: 'Chạm vào lá cờ xanh để đánh dấu lối mòn lên đỉnh núi!',
    targetWord: 'Flag',
    targetWordVi: 'Lá cờ',
    targetWordPhonetic: '/flæɡ/',
    teachingEn: 'The blue flag marks our route to the high mountain peak!',
    teachingVi: 'Lá cờ xanh phấp phới chỉ dẫn đường leo núi an toàn cho bé!',
    targetType: 'flag',
    fromNodeId: 'river',
    toNodeId: 'mountain',
    stars: 2,
    areaNameVi: 'Chân Núi Đá',
  },
  {
    id: 'quest_5_torch',
    stepIndex: 4,
    titleEn: 'Find the Torch',
    titleVi: 'Thắp Sáng Đuốc Trong Hang',
    instructionEn: 'Find the torch to light up the dark cave!',
    instructionVi: 'Hang động quá tối, bé hãy nhặt và thắp sáng ngọn đuốc thần kỳ!',
    targetWord: 'Torch',
    targetWordVi: 'Ngọn đuốc',
    targetWordPhonetic: '/tɔːrtʃ/',
    teachingEn: 'The cave is dark! A flaming torch will light up the secret passage.',
    teachingVi: 'Hang động tối quá! Ngọn đuốc sáng sẽ soi rõ lối đi bí mật.',
    targetType: 'torch',
    fromNodeId: 'mountain',
    toNodeId: 'cave',
    stars: 3,
    areaNameVi: 'Hang Động Pha Lê',
  },
  {
    id: 'quest_6_chest',
    stepIndex: 5,
    titleEn: 'Open the Treasure Chest',
    titleVi: 'Mở Rương Kho Báu Hoàng Kim',
    instructionEn: 'Open the treasure chest!',
    instructionVi: 'Dùng chìa khóa mở rương vàng ngọc ngập tràn châu báu!',
    targetWord: 'Chest',
    targetWordVi: 'Rương kho báu',
    targetWordPhonetic: '/tʃest/',
    teachingEn: 'You reached the summit! Unlock the legendary treasure chest now!',
    teachingVi: 'Bé đã lên tới đỉnh núi! Hãy xoay chìa khóa mở rương kho báu nào!',
    targetType: 'chest',
    fromNodeId: 'cave',
    toNodeId: 'summit',
    stars: 5,
    areaNameVi: 'Đỉnh Kho Báu',
  },
];

// Persistent State Schema
export interface TreasureMapSavedState {
  currentQuestIndex: number;
  completedQuestIds: string[];
  inventory: InventoryItem[];
  characterNodeId: string;
  bridgePlanksPlaced: number;
  gateUnlocked: boolean;
  flagDiscovered: boolean;
  caveLit: boolean;
  chestOpened: boolean;
  totalStarsEarned: number;
}

export const INITIAL_TREASURE_STATE: TreasureMapSavedState = {
  currentQuestIndex: 0,
  completedQuestIds: [],
  inventory: [
    { id: 'compass', nameEn: 'Compass', nameVi: 'La bàn', iconType: 'compass' },
  ],
  characterNodeId: 'camp',
  bridgePlanksPlaced: 0,
  gateUnlocked: false,
  flagDiscovered: false,
  caveLit: false,
  chestOpened: false,
  totalStarsEarned: 0,
};
