const fs = require('fs');
let html = fs.readFileSync('apps/landing/index.html', 'utf8');

// 1. Change HTML tag
html = html.replaceAll('<html lang="vi" class="dark scroll-smooth">', '<html lang="vi" class="scroll-smooth">');

// 2. Change global background & text classes
html = html.replaceAll('bg-[#060813]', 'bg-[#fdfbf9]');
html = html.replaceAll('text-white', 'text-slate-800');
html = html.replaceAll('text-slate-200', 'text-slate-700');
html = html.replaceAll('text-slate-300', 'text-slate-600');
html = html.replaceAll('text-slate-400', 'text-slate-500');
html = html.replaceAll('bg-indigo-600 selection:text-white', 'bg-indigo-200 selection:text-indigo-900');

// 3. Update specific dark surfaces
html = html.replaceAll('bg-slate-900/80', 'bg-white/50');
html = html.replaceAll('bg-slate-900/60', 'bg-white/50');
html = html.replaceAll('bg-[#0c1222]/90', 'bg-white/70');
html = html.replaceAll('bg-[#080d1a]', 'bg-white/60');
html = html.replaceAll('bg-[#04060d]', 'bg-white/40');

// 4. Update borders
html = html.replaceAll('border-white/[0.08]', 'border-slate-200/60');
html = html.replaceAll('border-white/[0.06]', 'border-slate-200/60');
html = html.replaceAll('border-white/10', 'border-slate-200/60');

// 5. Replace 'glass-dark-card' with 'frosted-glass-panel'
html = html.replaceAll('glass-dark-card', 'frosted-glass-panel');

fs.writeFileSync('apps/landing/index.html', html);
console.log('HTML transformed successfully.');
