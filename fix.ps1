$content = Get-Content apps\student\src\components\layout\AppShell.tsx -Raw
$pattern = '(?s)<div className="flex items-center gap-2">\s*\{!isPro && \(.*?<button\s+onClick=\{\(\) => setMobileMenuOpen\(!mobileMenuOpen\)\}'
$replacement = '<div className="flex items-center gap-2">' + "`r`n            " + '<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}'
$content = $content -replace $pattern, $replacement
Set-Content -NoNewline -Path apps\student\src\components\layout\AppShell.tsx -Value $content
