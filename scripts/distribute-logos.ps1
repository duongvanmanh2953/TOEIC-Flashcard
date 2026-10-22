Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [System.Drawing.Image]$src,
        [int]$width,
        [int]$height
    )
    $dest = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $width, $height)
    $g.Dispose()
    return $dest
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$lightCleanPath = Join-Path $root "assets\test-left-clean.png"
$darkCleanPath = Join-Path $root "assets\test-right-clean.png"

$lightImg = [System.Drawing.Image]::FromFile($lightCleanPath)
$darkImg = [System.Drawing.Image]::FromFile($darkCleanPath)

# Generate 256x256 versions
$light256 = Resize-Image -src $lightImg -width 256 -height 256
$dark256 = Resize-Image -src $darkImg -width 256 -height 256
$light512 = Resize-Image -src $lightImg -width 512 -height 512
$dark512 = Resize-Image -src $darkImg -width 512 -height 512
$dark32 = Resize-Image -src $darkImg -width 32 -height 32

# Save master assets in assets/
$lightCleanPathFinal = Join-Path $root "assets\letstun-logo-light.png"
$darkCleanPathFinal = Join-Path $root "assets\letstun-logo-dark.png"
$lightImg.Save($lightCleanPathFinal, [System.Drawing.Imaging.ImageFormat]::Png)
$darkImg.Save($darkCleanPathFinal, [System.Drawing.Imaging.ImageFormat]::Png)

$light256.Save((Join-Path $root "assets\letstun-logo-light-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$dark256.Save((Join-Path $root "assets\letstun-logo-dark-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# Targets to deploy:
$publicDirs = @(
    "apps\web\public",
    "apps\landing\public",
    "apps\student\public",
    "apps\admin\public",
    "apps\kid\public",
    "services\app-api\assets",
    "services\admin-api\assets",
    "services\kid-api\assets",
    "apps\api\assets"
)

foreach ($rel in $publicDirs) {
    $targetDir = Join-Path $root $rel
    if (Test-Path $targetDir) {
        Write-Output "Deploying logos to: $targetDir"
        
        # Deploy light & dark logos
        $lightImg.Save((Join-Path $targetDir "letstun-logo-light.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $darkImg.Save((Join-Path $targetDir "letstun-logo-dark.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        
        $light256.Save((Join-Path $targetDir "letstun-logo-light-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $dark256.Save((Join-Path $targetDir "letstun-logo-dark-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)

        # Default logo (dark logo is primary vibrant brand, light logo also provided)
        $dark256.Save((Join-Path $targetDir "letstun-logo-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $darkImg.Save((Join-Path $targetDir "letstun-logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)

        # Overwrite legacy vocabflow-logo-256.png and vocabflow-logo.png so existing references automatically show LetStuN!
        $dark256.Save((Join-Path $targetDir "vocabflow-logo-256.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        if (Test-Path (Join-Path $targetDir "vocabflow-logo.png")) {
            $darkImg.Save((Join-Path $targetDir "vocabflow-logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        }
    }
}

$lightImg.Dispose()
$darkImg.Dispose()
$light256.Dispose()
$dark256.Dispose()
$light512.Dispose()
$dark512.Dispose()
$dark32.Dispose()

Write-Output "All logo assets generated and distributed successfully!"
