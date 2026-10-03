$file = 'apps\student\src\components\layout\AppShell.tsx'
$content = Get-Content $file -Raw
$content = $content -replace '<LanguageSwitcher variant="header" />', '<LanguageSwitcher variant="compact" />'
Set-Content -NoNewline -Path $file -Value $content
