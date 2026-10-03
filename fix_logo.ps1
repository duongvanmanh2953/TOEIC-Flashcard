$file = 'apps\student\src\components\layout\AppShell.tsx'
$content = Get-Content $file -Raw
$pattern = '(?s)<VocabFlowLogo\s*size="xs"\s*showContainer=\{false\}\s*className="cursor-pointer"\s*onClick=\{\(\) => navigate\(''/dashboard''\)\}\s*/>'
$replacement = '<div onClick={() => navigate(''/dashboard'')} className="cursor-pointer flex items-center gap-2 group shrink-0" title="VocabFlow"><VocabFlowLogo size="xs" showContainer={false} className="group-hover:scale-105 transition-transform" /><span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">VocabFlow</span></div>'
$content = $content -replace $pattern, $replacement
Set-Content -NoNewline -Path $file -Value $content
