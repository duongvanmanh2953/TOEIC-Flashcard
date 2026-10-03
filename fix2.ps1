$content = Get-Content apps\student\src\components\layout\AppShell.tsx -Raw
$pattern = '(?s)onClick=\{\(e\) => e.stopPropagation\(\)\}\s*>\s*\{navSections.map'
$replacement = 'onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drawer Top Actions */}
                <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <LanguageSwitcher variant="header" />
                    </div>
                    <div className="shrink-0">
                      <NotificationBell />
                    </div>
                    <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      {theme === ''dark'' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (!user || user.isAnonymous) { promptLogin(''Đăng nhập để sử dụng ghi chép''); return; }
                        setQuickNoteOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Ghi chép
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (!user || user.isAnonymous) { promptLogin(''Đăng nhập để sử dụng tin nhắn''); return; }
                        setChatDrawerOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      Tin nhắn
                    </button>
                  </div>
                  
                  {!isPro && (
                    <button
                      onClick={() => navigate(''/upgrade'')}
                      className="w-full relative overflow-hidden px-3 py-2.5 rounded-xl bg-amber-400/20 dark:bg-amber-400/15 backdrop-blur-md border border-amber-400/60 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:border-amber-300 transition-all group"
                    >
                      <Crown className="w-4 h-4 text-amber-500 dark:text-amber-300 fill-amber-400" />
                      <span>Mở khóa Pro</span>
                    </button>
                  )}
                </div>

                {navSections.map'
$content = $content -replace $pattern, $replacement
Set-Content -NoNewline -Path apps\student\src\components\layout\AppShell.tsx -Value $content
