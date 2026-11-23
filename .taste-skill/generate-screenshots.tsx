import React from 'react';
import { renderToString } from 'react-dom/server';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { ArenaBattleView } from '../apps/web/src/pages/games/arena/ArenaBattleView';
import { TikTokLiveView, LiveFinalResults } from '../apps/web/src/pages/games/arena/TikTokLiveView';
import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';

const astralCss = fs.readFileSync(path.resolve('apps/web/src/pages/games/arena/astral-arena.css'), 'utf8');
const stageCss = fs.readFileSync(path.resolve('apps/web/src/pages/games/arena/arena-stage.css'), 'utf8');

const sampleQuestion = {
  id: 'q-battle-01',
  prompt: 'The executive committee agreed to ___ the quarterly budget report before the annual shareholder summit.',
  options: [
    'A. review',
    'B. postpone',
    'C. terminate',
    'D. fabricate',
  ],
  category: 'TOEIC BUSINESS STRATEGY',
  difficulty: 2,
};

const samplePlayers = [
  { userId: 'u1', displayName: 'Elena Rostova', score: 980, rank: 1, avatar: '' },
  { userId: 'u2', displayName: 'Minh Tuấn (Bạn)', score: 890, rank: 2, avatar: '', isCurrentUser: true },
  { userId: 'u3', displayName: 'Kenji Sato', score: 810, rank: 3, avatar: '' },
  { userId: 'u4', displayName: 'Sarah Connor', score: 650, rank: 4, avatar: '' },
  { userId: 'u5', displayName: 'Lucas Silva', score: 540, rank: 5, avatar: '' },
];

const sampleLiveComments = [
  { eventId: 'c1', displayName: 'PhanAnh_99', commentText: 'A', answer: 'A', accepted: true, timestamp: Date.now() - 4000 },
  { eventId: 'c2', displayName: 'ThuTrang_Toeic', commentText: 'A', answer: 'A', accepted: true, timestamp: Date.now() - 3200 },
  { eventId: 'c3', displayName: 'DragonFly', commentText: 'B', answer: 'B', accepted: true, timestamp: Date.now() - 2500 },
  { eventId: 'c4', displayName: 'HoangLong', commentText: 'A', answer: 'A', accepted: true, timestamp: Date.now() - 1800 },
  { eventId: 'c5', displayName: 'VocalChamp', commentText: 'C', answer: 'C', accepted: true, timestamp: Date.now() - 1100 },
];

const sampleLiveWinners = [
  { commenterId: 'c1', displayName: 'PhanAnh_99', answer: 'A', points: 100, rank: 1 },
  { commenterId: 'c2', displayName: 'ThuTrang_Toeic', answer: 'A', points: 95, rank: 2 },
  { commenterId: 'c4', displayName: 'HoangLong', answer: 'A', points: 88, rank: 3 },
];

const sampleVotes = { A: 48, B: 12, C: 6, D: 4 };

function renderPage(content: React.ReactElement, title: string) {
  const bodyHtml = renderToString(content);
  return `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #070B18;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    ${astralCss}
    ${stageCss}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

// Scenarios mapping
const scenarios: Record<string, () => string> = {
  'arena-battle-active': () =>
    renderPage(
      <ArenaBattleView
        currentRound={3}
        totalRounds={10}
        question={sampleQuestion}
        roundDurationSec={30}
        seconds={19}
        closed={false}
        paused={false}
        disabled={false}
        selectedOption={null}
        evaluation={null}
        skipped={false}
        players={samplePlayers}
        myPlayer={samplePlayers[1]}
        onSelectOption={() => {}}
        onSubmitText={() => {}}
        onSkipQuestion={() => {}}
        onLeaveRoom={() => {}}
      />,
      'Arena Battle - Active Question'
    ),

  'arena-battle-correct': () =>
    renderPage(
      <ArenaBattleView
        currentRound={3}
        totalRounds={10}
        question={sampleQuestion}
        roundDurationSec={30}
        seconds={12}
        closed={true}
        paused={false}
        disabled={true}
        selectedOption={0}
        evaluation={{ isCorrect: true, score: 92 }}
        skipped={false}
        correctOptionIndex={0}
        correctAnswer="review"
        players={samplePlayers}
        myPlayer={{ ...samplePlayers[1], score: 982, rank: 1 }}
        onSelectOption={() => {}}
        onSubmitText={() => {}}
        onSkipQuestion={() => {}}
        onLeaveRoom={() => {}}
      />,
      'Arena Battle - Correct Answer'
    ),

  'arena-battle-champion': () =>
    renderPage(
      <LiveFinalResults
        live={false}
        playedRounds={10}
        totalRounds={10}
        participants={samplePlayers}
        personalResult={{ correctCount: 9, answeredCount: 10, bestStreak: 7 }}
        onLeaveRoom={() => {}}
        onPlayAgain={() => {}}
      />,
      'Arena Battle - Champion Gold Board'
    ),

  'live-desktop-full': () =>
    renderPage(
      <TikTokLiveView
        currentRound={5}
        totalRounds={10}
        question={sampleQuestion}
        seconds={18}
        duration={30}
        resultSeconds={null}
        participants={samplePlayers}
        comments={sampleLiveComments}
        votes={sampleVotes}
        winners={sampleLiveWinners}
        correctOptionIndex={0}
        paused={false}
        onLeaveRoom={() => {}}
      />,
      'TikTok Live - Desktop Full Layout'
    ),

  'live-mobile-comments': () =>
    renderPage(
      <TikTokLiveView
        currentRound={2}
        totalRounds={10}
        question={sampleQuestion}
        seconds={26}
        duration={30}
        resultSeconds={null}
        participants={samplePlayers}
        comments={sampleLiveComments}
        votes={sampleVotes}
        winners={sampleLiveWinners}
        correctOptionIndex={0}
        paused={false}
        onLeaveRoom={() => {}}
      />,
      'TikTok Live - Mobile Comments Phase'
    ),

  'live-mobile-chart': () =>
    renderPage(
      <TikTokLiveView
        currentRound={2}
        totalRounds={10}
        question={sampleQuestion}
        seconds={0}
        duration={30}
        resultSeconds={8}
        participants={samplePlayers}
        comments={sampleLiveComments}
        votes={sampleVotes}
        winners={sampleLiveWinners}
        correctOptionIndex={0}
        paused={false}
        onLeaveRoom={() => {}}
      />,
      'TikTok Live - Mobile Chart Phase'
    ),

  'live-mobile-top3': () =>
    renderPage(
      <TikTokLiveView
        currentRound={2}
        totalRounds={10}
        question={sampleQuestion}
        seconds={0}
        duration={30}
        resultSeconds={3}
        participants={samplePlayers}
        comments={sampleLiveComments}
        votes={sampleVotes}
        winners={sampleLiveWinners}
        correctOptionIndex={0}
        paused={false}
        onLeaveRoom={() => {}}
      />,
      'TikTok Live - Mobile Top 3 Reflex'
    ),

  'live-final-goldboard': () =>
    renderPage(
      <LiveFinalResults
        live={true}
        playedRounds={10}
        totalRounds={10}
        participants={samplePlayers}
        onLeaveRoom={() => {}}
        onPlayAgain={() => {}}
      />,
      'TikTok Live - Final Gold Board'
    ),
};

// Simple HTTP server to serve HTML and game assets
const publicDir = path.resolve('apps/web/public');
const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';
  if (urlPath.startsWith('/scenario/')) {
    const key = urlPath.replace('/scenario/', '');
    const generator = scenarios[key];
    if (generator) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generator());
      return;
    }
  }

  // Serve static assets
  const filePath = path.join(publicDir, urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const PORT = 3899;

async function run() {
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`Preview server running at http://localhost:${PORT}`);

  const browser = await Browser.launch();
  console.log('Browser launched successfully');

  const screenshotsDir = path.resolve('.taste-skill/screenshots');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const viewports = [
    // Desktop
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1366x768', width: 1366, height: 768 },
    { name: 'desktop-1280x720', width: 1280, height: 720 },
    // Tablet
    { name: 'tablet-1024x768', width: 1024, height: 768 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    // Mobile
    { name: 'mobile-430x932', width: 430, height: 932 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-360x740', width: 360, height: 740 },
    { name: 'mobile-320x640', width: 320, height: 640 },
  ];

  // Specific scenarios to capture across viewports
  const jobs = [
    // Desktop Battle
    { scenario: 'arena-battle-active', viewports: ['desktop-1920x1080', 'desktop-1440x900', 'desktop-1280x720', 'tablet-768x1024', 'mobile-390x844'] },
    { scenario: 'arena-battle-correct', viewports: ['desktop-1440x900', 'mobile-390x844'] },
    { scenario: 'arena-battle-champion', viewports: ['desktop-1440x900', 'mobile-390x844'] },
    // Live
    { scenario: 'live-desktop-full', viewports: ['desktop-1920x1080', 'desktop-1440x900', 'tablet-1024x768'] },
    { scenario: 'live-mobile-comments', viewports: ['mobile-390x844', 'mobile-360x740'] },
    { scenario: 'live-mobile-chart', viewports: ['mobile-390x844'] },
    { scenario: 'live-mobile-top3', viewports: ['mobile-390x844'] },
    { scenario: 'live-final-goldboard', viewports: ['desktop-1440x900', 'mobile-390x844'] },
  ];

  for (const job of jobs) {
    for (const vpName of job.viewports) {
      const vp = viewports.find((v) => v.name === vpName)!;
      const page = await browser.newPage({ width: vp.width, height: vp.height });
      const targetUrl = `http://127.0.0.1:${PORT}/scenario/${job.scenario}`;
      console.log(`Capturing ${job.scenario} at ${vp.width}x${vp.height}...`);
      await page.goto(targetUrl);
      // Wait for fonts & animations
      await new Promise((r) => setTimeout(r, 600));
      const filename = `${job.scenario}-${vpName}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, filename) });
      await page.close();
      console.log(`Saved ${filename}`);
    }
  }

  await browser.close();
  server.close();
  console.log('All QA screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
