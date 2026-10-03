$file = 'apps\student\src\components\layout\AppShell.tsx'
$content = Get-Content $file -Raw
$pattern = '(?s)<div className="flex items-center gap-2">\s*<button\s*onClick=\{\(\) => setMobileMenuOpen\(!mobileMenuOpen\)\}\s*className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"\s*>\s*\{mobileMenuOpen \? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />\}\s*</button>\s*</div>'
$replacement = '<div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            <button
              onClick={() => {
                if (!user || user.isAnonymous) { promptLogin(''Đăng nhập để sử dụng ghi chép nhanh''); return; }
                setQuickNoteOpen(true);
              }}
              title="Ghi chép nhanh"
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!user || user.isAnonymous) { promptLogin(''Đăng nhập để sử dụng tính năng nhắn tin''); return; }
                setChatDrawerOpen(true);
              }}
              title="Tin nhắn học tập"
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>'
$content = $content -replace $pattern, $replacement
Set-Content -NoNewline -Path $file -Value $content
