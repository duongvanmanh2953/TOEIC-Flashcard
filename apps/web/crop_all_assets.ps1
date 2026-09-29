Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\manhd\.gemini\antigravity-ide\brain\eaa57563-4b26-42c5-bfad-bd895d33602c\.user_uploaded"
$imgSheet = Join-Path $srcDir "media_1790653772307.jpg"
$outBase = "c:\Users\manhd\Downloads\ToeicFlashCard\apps\web\public\kid"

function Crop-Tile($srcBmp, $dstPath, $x, $y, $w, $h) {
    if ($x + $w -gt $srcBmp.Width) { $w = $srcBmp.Width - $x }
    if ($y + $h -gt $srcBmp.Height) { $h = $srcBmp.Height - $y }
    if ($w -le 0 -or $h -le 0) { return }
    $rect = [System.Drawing.Rectangle]::new($x, $y, $w, $h)
    $cropped = $srcBmp.Clone($rect, $srcBmp.PixelFormat)
    $cropped.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Cropped: $dstPath"
}

$bmp = [System.Drawing.Bitmap]::FromFile($imgSheet)

# -------------------------------------------------------------
# 1. MASCOT VIVI 12 POSES (3 rows x 4 cols)
# -------------------------------------------------------------
$mascotNames = @(
    @("vivi-wave", "vivi-study", "vivi-thinking", "vivi-speaking"),
    @("vivi-listening", "vivi-celebrate", "vivi-confused", "vivi-encourage"),
    @("vivi-sleep", "vivi-pointing", "vivi-running", "vivi-trophy")
)

$mascotYStarts = @(40, 142, 244)
$mascotXStarts = @(14, 90, 166, 242)
$mascotW = 68
$mascotH = 75

for ($r = 0; $r -lt 3; $r++) {
    for ($c = 0; $c -lt 4; $c++) {
        $name = $mascotNames[$r][$c]
        $x = $mascotXStarts[$c]
        $y = $mascotYStarts[$r]
        $dst = Join-Path $outBase "mascot\$name.png"
        Crop-Tile $bmp $dst $x $y $mascotW $mascotH
    }
}

# -------------------------------------------------------------
# 2. WORLDS (5 worlds)
# -------------------------------------------------------------
# Row 1
Crop-Tile $bmp (Join-Path $outBase "worlds\world-word-forest.png") 334 38 174 105
Crop-Tile $bmp (Join-Path $outBase "worlds\world-listening-lake.png") 518 38 174 105

# Row 2
Crop-Tile $bmp (Join-Path $outBase "worlds\world-speaking-mountain.png") 334 168 174 105
Crop-Tile $bmp (Join-Path $outBase "worlds\world-grammar-castle.png") 518 168 174 105

# Row 3 (Wide)
Crop-Tile $bmp (Join-Path $outBase "worlds\world-challenge-arena.png") 334 314 358 100

# -------------------------------------------------------------
# 3. BACKGROUND LAYERS (8 layers)
# -------------------------------------------------------------
$bgNames = @(
    @("sky", "clouds"),
    @("far-mountains", "trees-left"),
    @("trees-right", "grass-foreground"),
    @("flowers", "floating-stars")
)
$bgY = @(38, 136, 236, 335)
$bgX = @(705, 850)
$bgW = 140
$bgH = 68

for ($r = 0; $r -lt 4; $r++) {
    for ($c = 0; $c -lt 2; $c++) {
        $name = $bgNames[$r][$c]
        $x = $bgX[$c]
        $y = $bgY[$r]
        $dst = Join-Path $outBase "backgrounds\$name.png"
        Crop-Tile $bmp $dst $x $y $bgW $bgH
    }
}

# -------------------------------------------------------------
# 4. ANIMAL COLLECTION (20 animals: 4 rows x 5 cols)
# -------------------------------------------------------------
$animals = @(
    @("rabbit", "panda", "lion", "tiger", "elephant"),
    @("monkey", "penguin", "bear", "cat", "dog"),
    @("bird", "giraffe", "zebra", "frog", "turtle"),
    @("dolphin", "whale", "butterfly", "bee", "fox")
)
$animY = @(468, 545, 624, 706)
$animX = @(14, 74, 134, 194, 254)
$animW = 54
$animH = 58

for ($r = 0; $r -lt 4; $r++) {
    for ($c = 0; $c -lt 5; $c++) {
        $name = $animals[$r][$c]
        $x = $animX[$c]
        $y = $animY[$r]
        $dst = Join-Path $outBase "animals\$name.png"
        Crop-Tile $bmp $dst $x $y $animW $animH
    }
}

# -------------------------------------------------------------
# 5. REWARDS & BADGES
# -------------------------------------------------------------
# Row 1 Badges
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-first-word.png") 340 464 66 66
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-word-master.png") 434 464 66 66
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-listening.png") 528 464 66 66

# Row 2 Badges
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-speaking.png") 340 545 66 66
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-streak.png") 434 545 66 66
Crop-Tile $bmp (Join-Path $outBase "rewards\badge-challenge.png") 528 545 66 66

# Row 3 Icons (star, xp, gem, trophy)
Crop-Tile $bmp (Join-Path $outBase "rewards\star.png") 338 634 50 48
Crop-Tile $bmp (Join-Path $outBase "rewards\xp.png") 405 634 50 48
Crop-Tile $bmp (Join-Path $outBase "rewards\gem.png") 472 634 50 48
Crop-Tile $bmp (Join-Path $outBase "rewards\trophy.png") 538 634 50 48

# Row 4 Icons (crown, chest, ticket)
Crop-Tile $bmp (Join-Path $outBase "rewards\crown.png") 338 706 60 52
Crop-Tile $bmp (Join-Path $outBase "rewards\chest.png") 424 706 60 52
Crop-Tile $bmp (Join-Path $outBase "rewards\ticket.png") 515 706 60 52

# -------------------------------------------------------------
# 6. STICKER PACK (9 stickers: 3 rows x 3 cols)
# -------------------------------------------------------------
$stickers = @(
    @("sticker-great-job", "sticker-awesome", "sticker-keep-going"),
    @("sticker-super", "sticker-wow", "sticker-new-word"),
    @("sticker-listening", "sticker-speaking", "sticker-thinking")
)
$stickY = @(462, 555, 650)
$stickX = @(634, 755, 874)
$stickW = 110
$stickH = 80

for ($r = 0; $r -lt 3; $r++) {
    for ($c = 0; $c -lt 3; $c++) {
        $name = $stickers[$r][$c]
        $x = $stickX[$c]
        $y = $stickY[$r]
        $dst = Join-Path $outBase "stickers\$name.png"
        Crop-Tile $bmp $dst $x $y $stickW $stickH
    }
}

$bmp.Dispose()
Write-Output "All asset tiles cropped successfully!"
