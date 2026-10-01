const fs = require('fs');
let html = fs.readFileSync('apps/landing/index.html', 'utf8');

// 1. Revert HTML tag
html = html.replaceAll('<html lang="vi" class="scroll-smooth">', '<html lang="vi" class="dark scroll-smooth">');

// 2. Revert global background & text classes
html = html.replaceAll('bg-[#fdfbf9]', 'bg-[#060813]');
html = html.replaceAll('text-slate-800', 'text-white');
html = html.replaceAll('text-slate-700', 'text-slate-200');
html = html.replaceAll('text-slate-600', 'text-slate-300');
html = html.replaceAll('text-slate-500', 'text-slate-400');
html = html.replaceAll('bg-indigo-200 selection:text-indigo-900', 'bg-indigo-600 selection:text-white');

// 3. Revert specific dark surfaces
html = html.replaceAll('bg-white/50', 'bg-slate-900/80');
html = html.replaceAll('bg-white/70', 'bg-[#0c1222]/90');
html = html.replaceAll('bg-white/60', 'bg-[#080d1a]');
html = html.replaceAll('bg-white/40', 'bg-[#04060d]');

// 4. Revert borders
html = html.replaceAll('border-slate-200/60', 'border-white/[0.08]');
html = html.replaceAll('border-slate-200/50', 'border-white/[0.08]');
html = html.replaceAll('border-b border-slate-200', 'border-b border-white/[0.08]');

fs.writeFileSync('apps/landing/index.html', html);
console.log('HTML reverted to dark successfully.');
