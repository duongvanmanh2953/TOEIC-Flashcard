(() => {
  'use strict';

  const FIELDS = ['english','type','vietnamese','pronounce','explain','example','example_vietnamese','image_url','audio_url','topic','topic_url'];
  const DB_KEY = 'vocabflow_data_v1';
  const META_KEY = 'vocabflow_meta_v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const shuffle = array => array.map(v => [Math.random(), v]).sort((a,b) => a[0]-b[0]).map(([,v]) => v);

  const defaults = {
    settings:{language:'vi',theme:'system',accent:'#6757e5',voice:'en-US',speed:1,autoPronounce:false,autoNext:true,showImage:true,showExample:true,quizAutoNext:true,randomTypes:true,dailyGoal:20},
    activity:{}, streak:0, longestStreak:0, lastGoalDate:'', sessions:0,
    history:[], selectedTopic:'All', importedAt:null
  };

  let words = [];
  let meta = loadJSON(META_KEY, defaults);
  let currentView = 'dashboard';
  let flash = {deck:[], index:0, flipped:false, answers:0};
  let quiz = null;
  let vocabPage = 1;
  let searchQuery = '';
  let toastTimer;
  const originalText = new WeakMap();
  const vi = {
    'English Learning':'Học tiếng Anh','day streak':'ngày liên tiếp','Dashboard':'Tổng quan','Flashcards':'Thẻ ghi nhớ','Quick Learn':'Học nhanh','Quiz':'Kiểm tra','Vocabulary':'Từ vựng','Mistakes':'Từ hay sai','Favorites':'Yêu thích','Statistics':'Thống kê','Settings':'Cài đặt','Import vocabulary':'Nhập từ vựng','Daily goal':'Mục tiêu ngày',
    'Ready to learn?':'Sẵn sàng học chưa?','A focused review is the shortest path to remembering.':'Ôn tập tập trung là con đường ngắn nhất để ghi nhớ.','Import CSV':'Nhập CSV','Smart Learn':'Học thông minh','Total words':'Tổng số từ','Words learned':'Từ đã học','Mastered':'Đã thuộc','Accuracy':'Độ chính xác','Learning progress':'Tiến độ học','Continue learning':'Tiếp tục học','Browse words':'Xem danh sách','Today\'s goal':'Mục tiêu hôm nay','Complete!':'Hoàn thành!','Keep going':'Tiếp tục nhé','Choose a topic':'Chọn chủ đề',
    'Shuffle':'Trộn thẻ','Tap card or press Space to reveal':'Chạm vào thẻ hoặc nhấn Space để xem nghĩa','Again':'Học lại','Hard':'Khó','Good':'Tốt','Easy':'Dễ','this session':'trong phiên này','1 day':'1 ngày','3+ days':'3+ ngày','7+ days':'7+ ngày','Smart review':'Ôn tập thông minh',
    'Build a quiz':'Tạo bài kiểm tra','Short, varied active-recall practice.':'Bài luyện nhớ chủ động ngắn và đa dạng.','Choose a comfortable challenge.':'Chọn mức thử thách phù hợp.','Number of questions':'Số câu hỏi','Topic':'Chủ đề','Question types':'Dạng câu hỏi','Multiple choice':'Trắc nghiệm','Typing':'Nhập từ','Listening':'Nghe','Fill in blank':'Điền chỗ trống','Start quick learn':'Bắt đầu học nhanh','Start quiz':'Bắt đầu kiểm tra','Active recall in progress':'Đang luyện nhớ chủ động','What word did you hear?':'Bạn nghe thấy từ gì?','Check':'Kiểm tra','Next':'Tiếp theo','Correct!':'Chính xác!','Incorrect':'Chưa đúng',
    'Search and explore your complete collection.':'Tìm kiếm và khám phá toàn bộ kho từ.','Turn weak words into strong ones.':'Biến những từ còn yếu thành từ đã thuộc.','Your saved words, ready to review.':'Các từ đã lưu, sẵn sàng để ôn tập.','Practice selection':'Học danh sách này','Practice mistakes':'Luyện từ hay sai','Practice favorites':'Luyện từ yêu thích','Word':'Từ','Pronunciation':'Phiên âm','Type':'Loại từ','Meaning':'Nghĩa','Status':'Trạng thái','Learning':'Đang học','New':'Mới','No matching words':'Không tìm thấy từ phù hợp','Try another search or import more vocabulary.':'Hãy thử từ khóa khác hoặc nhập thêm từ vựng.','Continue':'Tiếp tục',
    'Small, consistent sessions compound over time.':'Những phiên học ngắn, đều đặn sẽ tạo nên tiến bộ lớn.','Correct answers':'Trả lời đúng','Wrong answers':'Trả lời sai','Current streak':'Chuỗi hiện tại','Longest streak':'Chuỗi dài nhất','Study sessions':'Phiên học','Last 7 days':'7 ngày gần đây','Words reviewed':'Từ đã ôn','Weak words':'Từ còn yếu','Strong words':'Từ đã thuộc','Recently learned':'Vừa học gần đây','Complete a session to see insights.':'Hoàn thành một phiên học để xem phân tích.',
    'Tune the experience to the way you learn.':'Điều chỉnh trải nghiệm theo cách học của bạn.','Appearance':'Giao diện','Theme':'Chủ đề','System':'Hệ thống','Light':'Sáng','Dark':'Tối','Accent color':'Màu chủ đạo','Violet':'Tím','Teal':'Xanh ngọc','Orange':'Cam','Voice':'Giọng đọc','American English':'Anh - Mỹ','British English':'Anh - Anh','Speech speed':'Tốc độ đọc','Auto pronunciation':'Tự động phát âm','Study preferences':'Tùy chọn học','Show images':'Hiện hình ảnh','Show examples':'Hiện ví dụ','Auto next in quiz':'Tự chuyển câu trong bài kiểm tra','Data':'Dữ liệu','Reset learning progress':'Đặt lại tiến độ học','Delete vocabulary database':'Xóa kho từ vựng','Import new CSV':'Nhập CSV mới',
    'Use the provided TOEIC deck or bring your own CSV.':'Sử dụng bộ TOEIC có sẵn hoặc nhập CSV của bạn.','Drag & drop CSV here':'Kéo và thả CSV vào đây','Choose CSV':'Chọn CSV','Expected structure':'Cấu trúc yêu cầu','Session complete':'Hoàn thành phiên học','You showed up and strengthened your memory.':'Bạn đã hoàn thành và củng cố trí nhớ.','Reviewed':'Đã ôn','Best streak':'Chuỗi tốt nhất','Study again':'Học lại'
  };

  function loadJSON(key, fallback) {
    try { return {...structuredClone(fallback), ...JSON.parse(localStorage.getItem(key) || '{}')}; }
    catch { return structuredClone(fallback); }
  }
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(words)); localStorage.setItem(META_KEY, JSON.stringify(meta)); }
    catch { toast('Bộ nhớ trình duyệt đã đầy. Hãy import bộ dữ liệu nhỏ hơn.'); }
    updateChrome();
  }
  function normalizeWord(row, index) {
    const word = {}; FIELDS.forEach(f => word[f] = String(row[f] ?? '').trim());
    word.id = row.id || `${word.english.toLowerCase()}-${index}-${simpleHash(word.vietnamese)}`;
    word.progress = {correct:0,wrong:0,level:0,lastReviewed:null,nextReview:null,favorite:false,hard:false,...(row.progress || {})};
    return word;
  }
  function simpleHash(s) { let h=0; for(let i=0;i<s.length;i++) h=((h<<5)-h+s.charCodeAt(i))|0; return Math.abs(h); }
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
  function applyTheme() {
    const theme = meta.settings.theme;
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.setProperty('--primary', meta.settings.accent || '#6757e5');
    $('#themeToggle').innerHTML = `<i class="ri-${dark ? 'sun' : 'moon-clear'}-line"></i>`;
  }

  async function init() {
    words = (JSON.parse(localStorage.getItem(DB_KEY) || '[]')).map(normalizeWord);
    applyTheme(); bindShell(); updateStreak();
    $('#languageSelect').value = meta.settings.language || 'vi';
    observeLanguage();
    if (!words.length) {
      try {
        const response = await fetch('toeic_600_words.csv');
        if (response.ok) importCSV(await response.text(), true);
      } catch (_) { /* file:// cannot fetch local sample; import remains available */ }
    }
    navigate(words.length ? 'dashboard' : 'import');
  }

  function bindShell() {
    document.addEventListener('click', e => {
      if(!e.target.closest('.custom-dropdown')) $$('.custom-dropdown.open').forEach(x=>{x.classList.remove('open');x.querySelector('.custom-dropdown-trigger')?.setAttribute('aria-expanded','false')});
      const nav = e.target.closest('[data-view]');
      if (nav) { navigate(nav.dataset.view); $('#sidebar').classList.remove('open'); }
      if (e.target.closest('[data-close-modal]') || e.target.id === 'modal') closeModal();
    });
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
    $('#themeToggle').onclick = () => { meta.settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(); };
    $('#languageSelect').onchange = e => { meta.settings.language=e.target.value; document.documentElement.lang=e.target.value; save(); navigate(currentView); localizeDOM(document.body); };
    $('#globalSearch').addEventListener('input', e => { searchQuery=e.target.value.trim(); if(searchQuery) navigate('vocabulary'); else if(currentView==='vocabulary') renderVocabulary(); });
    $('#csvPicker').onchange = e => e.target.files[0] && readFile(e.target.files[0]);
    document.addEventListener('keydown', handleKeyboard);
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  }

  function navigate(view, options = {}) {
    currentView = view;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    const renderers = {dashboard:renderDashboard,flashcards:()=>startFlashcards(options.words),learn:()=>renderQuizSetup(true),quiz:()=>renderQuizSetup(false),vocabulary:renderVocabulary,mistakes:renderMistakes,favorites:renderFavorites,statistics:renderStatistics,settings:renderSettings,import:renderImport};
    (renderers[view] || renderDashboard)();
    localizeDOM(document.body);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function localizeDOM(root) {
    const lang=meta.settings.language||'vi'; document.documentElement.lang=lang;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node; while((node=walker.nextNode())) {
      if(node.parentElement?.closest('script,style,option[value="#6757e5"],option[value="#147d75"],option[value="#ce5d28"]')) continue;
      if(!originalText.has(node)) originalText.set(node,node.nodeValue);
      const source=originalText.get(node),trimmed=source.trim();
      if(!trimmed) continue;
      const translated=lang==='vi'?(vi[trimmed]||trimmed):trimmed;
      const next=source.replace(trimmed,translated); if(node.nodeValue!==next) node.nodeValue=next;
    }
    const placeholders={'Search vocabulary...':'Tìm kiếm từ vựng...','Search word, meaning, definition...':'Tìm theo từ, nghĩa, giải thích...','Type your answer...':'Nhập câu trả lời...'};
    $$('[placeholder]',root).forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.placeholder;el.placeholder=lang==='vi'?(placeholders[el.dataset.originalPlaceholder]||el.dataset.originalPlaceholder):el.dataset.originalPlaceholder});
    enhanceSelects(root);
  }
  function observeLanguage() {
    const pendingRoots=new Set();
    let frame=0;
    const config={childList:true,subtree:true};
    const observer=new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{
        if(node.nodeType!==Node.ELEMENT_NODE) return;
        // Dropdown internals are already localized when they are created.
        if(node.matches?.('.custom-dropdown-menu,.custom-dropdown-trigger,.custom-dropdown-option')||node.closest?.('.custom-dropdown')) return;
        pendingRoots.add(node);
      }));
      if(frame||!pendingRoots.size) return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const roots=[...pendingRoots].filter(root=>root.isConnected&&!root.closest('.custom-dropdown'));
        pendingRoots.clear();
        // Keep only the highest root so a subtree is never scanned twice.
        const unique=roots.filter((root,index)=>!roots.some((parent,i)=>i!==index&&parent.contains(root)));
        observer.disconnect();
        unique.forEach(localizeDOM);
        observer.observe(document.body,config);
      });
    });
    observer.observe(document.body,config);
  }

  function enhanceSelects(root=document) {
    const candidates=[];
    if(root.matches?.('select')) candidates.push(root);
    candidates.push(...$$('select:not([data-customized])',root));
    candidates.forEach(select=>{
      select.dataset.customized='true';
      const wrapper=document.createElement('div');wrapper.className='custom-dropdown';
      const trigger=document.createElement('button');trigger.type='button';trigger.className='custom-dropdown-trigger';
      trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
      const menu=document.createElement('div');menu.className='custom-dropdown-menu';menu.setAttribute('role','listbox');
      const sync=()=>{
        const selected=select.options[select.selectedIndex];
        const label=trigger.querySelector('span');
        if(label) label.textContent=selected?.textContent||'';
        $$('.custom-dropdown-option',menu).forEach(x=>x.classList.toggle('selected',x.dataset.value===select.value));
      };
      trigger.innerHTML='<span></span><i class="ri-arrow-down-s-line"></i>';
      [...select.options].forEach(option=>{
        const item=document.createElement('button');item.type='button';item.className='custom-dropdown-option';item.dataset.value=option.value;item.setAttribute('role','option');
        item.innerHTML=`<span>${esc(option.textContent)}</span><i class="ri-check-line"></i>`;
        item.onclick=e=>{e.stopPropagation();select.value=option.value;sync();wrapper.classList.remove('open');trigger.setAttribute('aria-expanded','false');select.dispatchEvent(new Event('change',{bubbles:true}))};
        menu.appendChild(item);
      });
      select.parentNode.insertBefore(wrapper,select);wrapper.append(select,trigger,menu);sync();
      trigger.onclick=e=>{e.stopPropagation();$$('.custom-dropdown.open').filter(x=>x!==wrapper).forEach(x=>x.classList.remove('open'));const open=wrapper.classList.toggle('open');trigger.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('.selected')?.focus()};
      trigger.onkeydown=e=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();trigger.click()}};
      select.addEventListener('change',sync);
    });
  }

  function updateChrome() {
    const learnedToday = meta.activity[today()] || 0;
    $('#sideStreak').textContent = meta.streak || 0;
    $('#sideGoalText').textContent = `${learnedToday} / ${meta.settings.dailyGoal}`;
    $('#sideGoalBar').style.width = `${clamp(learnedToday/meta.settings.dailyGoal*100,0,100)}%`;
  }
  function updateStreak() {
    if (!meta.lastGoalDate) return updateChrome();
    const gap = Math.floor((new Date(today()) - new Date(meta.lastGoalDate))/86400000);
    if (gap > 1) meta.streak = 0;
    updateChrome();
  }
  function stats() {
    const correct=words.reduce((s,w)=>s+w.progress.correct,0), wrong=words.reduce((s,w)=>s+w.progress.wrong,0);
    const learned=words.filter(w=>w.progress.correct+w.progress.wrong>0).length, mastered=words.filter(w=>w.progress.level>=4).length;
    return {correct,wrong,learned,mastered,accuracy:correct+wrong?Math.round(correct/(correct+wrong)*100):0};
  }
  function header(title, subtitle, actions='') { return `<div class="page-head"><div><span class="eyebrow">VocabFlow</span><h1>${title}</h1><p>${subtitle}</p></div><div class="actions">${actions}</div></div>`; }
  function statCard(icon, value, label) { return `<article class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></article>`; }
  function topics() {
    const map={}; words.forEach(w=>{const t=w.topic||'Uncategorized'; map[t]=(map[t]||0)+1});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function topicVisual(topic,index) {
    const name=topic.toLowerCase();
    const rules=[
      [/salary|benefit|finance|bank|money|account/,'ri-money-dollar-circle-line'],
      [/travel|airport|hotel|transport|train|car/,'ri-plane-line'],
      [/tech|computer|office equipment|internet/,'ri-cpu-line'],
      [/home|daily|house|restaurant|food/,'ri-home-smile-2-line'],
      [/hiring|training|personnel|team|meeting/,'ri-team-line'],
      [/market|advertis|media|sales/,'ri-megaphone-line'],
      [/shop|purchase|order|shipping/,'ri-shopping-bag-3-line'],
      [/schedule|event|conference|appointment/,'ri-calendar-check-line']
    ];
    const icon=rules.find(([pattern])=>pattern.test(name))?.[1]||'ri-briefcase-4-line';
    return {icon,tone:`tone-${index%8+1}`};
  }

  function renderDashboard() {
    const s=stats(), activity=meta.activity[today()]||0, goal=meta.settings.dailyGoal, progress=words.length?Math.round(s.learned/words.length*100):0;
    $('#app').innerHTML = header('Ready to learn?', 'A focused review is the shortest path to remembering.', `<button class="btn outline" data-view="import">Import CSV</button><button class="btn primary" id="smartLearn">⚡ Smart Learn</button>`)+
      `<section class="grid stats-grid">${statCard('<i class="ri-stack-line"></i>',words.length,'Total words')}${statCard('<i class="ri-book-open-line"></i>',s.learned,'Words learned')}${statCard('<i class="ri-graduation-cap-line"></i>',s.mastered,'Mastered')}${statCard('<i class="ri-focus-3-line"></i>',s.accuracy+'%','Accuracy')}</section>
      <section class="grid dashboard-grid"><article class="panel"><div class="panel-title"><h2>Learning progress</h2><span>${progress}% complete</span></div><div class="progress"><i style="width:${progress}%"></i></div><p class="muted">${s.learned} reviewed · ${words.length-s.learned} waiting · ${s.wrong} mistakes</p><div class="actions"><button class="btn primary" id="continueStudy">Continue learning</button><button class="btn" data-view="vocabulary">Browse words</button></div></article>
      <article class="panel goal-hero"><div class="panel-title"><h2>Today's goal</h2><span>${activity>=goal?'Complete!':'Keep going'}</span></div><div class="goal-number">${activity} / ${goal} words</div><div class="progress"><i style="width:${clamp(activity/goal*100,0,100)}%"></i></div><small>${activity>=goal?'Beautiful work — come back tomorrow.':Math.max(0,goal-activity)+' more to protect your streak.'}</small></article></section>
      <div class="panel-title" style="margin-top:32px"><h2>Choose a topic</h2><span>${topics().length} topics</span></div><section class="grid topics">${topics().slice(0,9).map(([t,n],i)=>{const visual=topicVisual(t,i);return `<article class="topic-card ${visual.tone}" data-topic="${esc(t)}"><div class="topic-top"><span class="topic-icon"><i class="${visual.icon}"></i></span><span class="topic-arrow"><i class="ri-arrow-right-line"></i></span></div><h3>${esc(t)}</h3><p>${n} words</p></article>`}).join('')}</section>`;
    $('#smartLearn').onclick = () => startSmartLearn();
    $('#continueStudy').onclick = () => startFlashcards();
    $$('.topic-card').forEach(el=>el.onclick=()=>{meta.selectedTopic=el.dataset.topic;save();startFlashcards(words.filter(w=>w.topic===el.dataset.topic));});
  }

  function weightedDeck(source=words) {
    const now=Date.now(), pool=[];
    source.forEach(w=>{
      const p=w.progress; let weight=!p.lastReviewed?3:p.wrong>p.correct?5:p.hard?4:p.level>=4?1:2;
      if(p.nextReview && new Date(p.nextReview).getTime()<=now) weight+=2;
      for(let i=0;i<weight;i++) pool.push(w);
    });
    const result=[], seen=new Set();
    shuffle(pool).forEach(w=>{if(!seen.has(w.id)){seen.add(w.id);result.push(w)}});
    return result;
  }
  function startSmartLearn() {
    const weak=shuffle(words.filter(w=>w.progress.wrong>w.progress.correct||w.progress.hard));
    const fresh=shuffle(words.filter(w=>!w.progress.lastReviewed));
    const learned=shuffle(words.filter(w=>w.progress.lastReviewed&&!weak.includes(w)));
    const deck=[...weak.slice(0,12),...fresh.slice(0,5),...learned.slice(0,3)];
    startFlashcards(shuffle([...new Set(deck)]));
  }
  function startFlashcards(source) {
    const base=source?.length?source:(meta.selectedTopic!=='All'?words.filter(w=>w.topic===meta.selectedTopic):words);
    if(!base.length) return renderEmpty('No words to study','Import a CSV file to create your first deck.','import');
    flash={deck:weightedDeck(base),index:0,flipped:false,answers:0}; currentView='flashcards'; renderFlashcard();
  }
  function renderFlashcard() {
    const w=flash.deck[flash.index]; if(!w) return renderSessionComplete({total:flash.answers,correct:0,wrong:0,best:0,newWords:0},()=>startFlashcards());
    const pct=Math.round(flash.index/flash.deck.length*100), p=w.progress;
    $('#app').innerHTML = header('Flashcards',esc(meta.selectedTopic==='All'?'Smart review':meta.selectedTopic),`<button class="btn outline" id="shuffleDeck">Shuffle</button>`)+
      `<div class="study-layout"><div class="study-meta"><b>${flash.index+1} / ${flash.deck.length}</b><div class="progress"><i style="width:${pct}%"></i></div></div>
      <div class="flashcard ${flash.flipped?'flipped':''}" id="flashcard"><div class="flashcard-inner"><section class="card-face card-front"><button class="favorite-btn ${p.favorite?'on':''}" data-favorite><i class="ri-heart-3-${p.favorite?'fill':'line'}"></i></button><h2 class="card-word">${esc(w.english)}</h2>${w.pronounce?`<div class="phonetic">${esc(w.pronounce)}</div>`:''}<button class="speak-btn" data-speak><i class="ri-volume-up-line"></i></button>${w.type?`<span class="word-type">${esc(w.type)}</span>`:''}<p class="muted">Tap card or press Space to reveal</p></section>
      <section class="card-face card-back"><button class="favorite-btn ${p.favorite?'on':''}" data-favorite><i class="ri-heart-3-${p.favorite?'fill':'line'}"></i></button><span class="word-type">${esc(w.type||'word')}</span><h2 class="meaning">${esc(w.vietnamese||w.english)}</h2>${w.explain?`<div class="definition">${esc(w.explain)}</div>`:''}${meta.settings.showExample&&w.example?`<div class="example-box"><b>${esc(w.example)}</b>${w.example_vietnamese?`<br><span class="muted">${esc(w.example_vietnamese)}</span>`:''}</div>`:''}${meta.settings.showImage&&w.image_url?`<img class="card-image" src="${esc(w.image_url)}" alt="" onerror="this.remove()">`:''}</section></div></div>
      <div class="rating-row"><button class="rating" data-rating="again">😵 Again<small>this session</small></button><button class="rating" data-rating="hard">😐 Hard<small>1 day</small></button><button class="rating" data-rating="good">🙂 Good<small>3+ days</small></button><button class="rating" data-rating="easy">😎 Easy<small>7+ days</small></button></div><p class="hint">Space flip · 1–4 rate · ← → navigate · P pronounce · F favorite</p></div>`;
    $('#flashcard').onclick=e=>{if(e.target.closest('button'))return;flash.flipped=!flash.flipped;$('#flashcard').classList.toggle('flipped')};
    $$('[data-speak]').forEach(b=>b.onclick=e=>{e.stopPropagation();speak(w)});
    $$('[data-favorite]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(w);renderFlashcard()});
    $$('[data-rating]').forEach(b=>b.onclick=()=>rateWord(w,b.dataset.rating));
    $('#shuffleDeck').onclick=()=>{flash.deck=shuffle(flash.deck);flash.index=0;renderFlashcard()};
    if(meta.settings.autoPronounce) setTimeout(()=>speak(w),180);
  }
  function rateWord(w, rating) {
    const p=w.progress, wasNew=!p.lastReviewed; p.lastReviewed=new Date().toISOString(); p.hard=rating==='hard';
    const days={again:0,hard:1,good:Math.max(3,p.level*2),easy:Math.max(7,p.level*4)}[rating];
    p.nextReview=new Date(Date.now()+(days?days*86400000:5*60000)).toISOString();
    if(rating==='again'){p.wrong++;p.level=Math.max(0,p.level-1); flash.deck.push(w)} else {p.correct++;p.level+=rating==='easy'?2:1}
    recordActivity(wasNew); flash.answers++; save();
    if(flash.index<flash.deck.length-1){flash.index++;flash.flipped=false;renderFlashcard()} else renderSessionComplete({total:flash.answers,correct:0,wrong:0,best:0,newWords:0},()=>startFlashcards());
  }

  function renderQuizSetup(quick) {
    if(!words.length)return renderEmpty('No quiz available','Import vocabulary before starting a quiz.','import');
    $('#app').innerHTML=header(quick?'Quick Learn':'Build a quiz',quick?'Short, varied active-recall practice.':'Choose a comfortable challenge.')+`<section class="setup-card"><div class="form-grid"><div class="field"><label>Number of questions</label><select id="questionCount"><option>10</option><option>20</option><option>30</option><option>50</option><option>100</option></select></div><div class="field"><label>Topic</label><select id="quizTopic"><option>All</option>${topics().map(([t])=>`<option>${esc(t)}</option>`).join('')}</select></div></div><div class="field" style="margin-top:22px"><label>Question types</label><div class="checks">${[['mc','Multiple choice'],['typing','Typing'],['listening','Listening'],['fill','Fill in blank']].map(([v,l])=>`<label class="check-chip"><input type="checkbox" value="${v}" checked><span>${l}</span></label>`).join('')}</div></div><button class="btn primary" id="startQuiz" style="margin-top:25px;width:100%">${quick?'Start quick learn':'Start quiz'} →</button></section>`;
    $('#questionCount').value=quick?'10':'20'; $('#quizTopic').value=meta.selectedTopic;
    $('#startQuiz').onclick=()=>{const types=$$('.check-chip input:checked').map(x=>x.value);if(!types.length)return toast('Choose at least one question type.'); const topic=$('#quizTopic').value;beginQuiz({count:+$('#questionCount').value,types,source:topic==='All'?words:words.filter(w=>w.topic===topic),quick})};
  }
  function beginQuiz({count=10,types=['mc','typing','listening','fill'],source=words,quick=false}) {
    if (!source.length) { toast('No words are available for this practice set.'); return navigate('dashboard'); }
    quiz={deck:weightedDeck(source).slice(0,Math.min(count,source.length)),index:0,correct:0,wrong:0,streak:0,best:0,newWords:0,types,locked:false,quick}; renderQuestion();
  }
  function makeQuestion(w) {
    let available=[...quiz.types]; if(!w.example) available=available.filter(t=>t!=='fill');
    const type=available[Math.floor(Math.random()*available.length)]||'typing';
    if(type==='mc'){
      const reverse=Math.random()>.5, answer=reverse?w.english:w.vietnamese;
      const distractors=shuffle(words.filter(x=>x.id!==w.id).map(x=>reverse?x.english:x.vietnamese).filter(Boolean)).slice(0,3);
      return {type,prompt:reverse?(w.vietnamese||w.explain):w.english,answer,options:shuffle([answer,...distractors])};
    }
    if(type==='fill') return {type,prompt:w.example.replace(new RegExp(`\\b${escapeRegex(w.english)}\\w*`,'i'),'_______'),answer:w.english};
    if(type==='listening') return {type,prompt:'What word did you hear?',answer:w.english};
    return {type,prompt:w.vietnamese||w.explain||'Type the English word',answer:w.english};
  }
  function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function renderQuestion() {
    if(quiz.index>=quiz.deck.length)return finishQuiz(); const w=quiz.deck[quiz.index]; quiz.question=makeQuestion(w);const q=quiz.question;
    $('#app').innerHTML=header(quiz.quick?'Quick Learn':'Quiz','Active recall in progress')+`<section class="question-card panel"><div class="question-top"><b>Question ${quiz.index+1} / ${quiz.deck.length}</b><span>Accuracy: ${quiz.index?Math.round(quiz.correct/quiz.index*100):0}% · <i class="ri-fire-fill"></i> ${quiz.streak}</span></div><div class="progress"><i style="width:${quiz.index/quiz.deck.length*100}%"></i></div>${q.type==='listening'?`<div class="prompt"><button class="speak-btn" id="listenBtn"><i class="ri-volume-up-line"></i></button><br><small>${q.prompt}</small></div>`:`<div class="prompt">${esc(q.prompt)}</div>`}<div id="answerArea">${q.type==='mc'?`<div class="options">${q.options.map((o,i)=>`<button class="option" data-answer="${esc(o)}"><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}</button>`).join('')}</div>`:`<form class="answer-input" id="answerForm"><input id="typedAnswer" autocomplete="off" placeholder="Type your answer..." autofocus><button class="btn primary">Check</button></form>`}</div><div id="feedback"></div></section>`;
    if(q.type==='listening'){setTimeout(()=>speak(w),200);$('#listenBtn').onclick=()=>speak(w)}
    $$('.option').forEach(b=>b.onclick=()=>submitAnswer(b.dataset.answer,b));
    $('#answerForm')?.addEventListener('submit',e=>{e.preventDefault();submitAnswer($('#typedAnswer').value)}); $('#typedAnswer')?.focus();
  }
  function equivalent(answer, expected) {
    const clean=s=>s.toLowerCase().trim().replace(/[.,!?]/g,''); const a=clean(answer),e=clean(expected); if(a===e)return true;
    return [e+'s',e+'es',e+'ed',e+'d',e+'ing'].includes(a) || (e.endsWith('e')&&a===e.slice(0,-1)+'ing');
  }
  function submitAnswer(answer, button) {
    if(quiz.locked||!answer.trim())return;quiz.locked=true; const w=quiz.deck[quiz.index], correct=equivalent(answer,quiz.question.answer), wasNew=!w.progress.lastReviewed;
    w.progress.lastReviewed=new Date().toISOString();
    if(correct){quiz.correct++;quiz.streak++;quiz.best=Math.max(quiz.best,quiz.streak);w.progress.correct++;w.progress.level++;w.progress.nextReview=new Date(Date.now()+3*86400000).toISOString();button?.classList.add('correct')}
    else{quiz.wrong++;quiz.streak=0;w.progress.wrong++;w.progress.level=Math.max(0,w.progress.level-1);w.progress.nextReview=new Date(Date.now()+5*60000).toISOString();button?.classList.add('wrong');$$('.option').find(x=>equivalent(x.dataset.answer,quiz.question.answer))?.classList.add('correct');speak(w)}
    if(wasNew)quiz.newWords++; recordActivity(wasNew); save();
    $('#feedback').innerHTML=`<div class="feedback ${correct?'good':'bad'}"><b>${correct?'✓ Correct!':'✕ Incorrect'}</b><div>${esc(w.english)} = ${esc(w.vietnamese)}</div>${!correct?`<small>Your answer: ${esc(answer)} · Correct: ${esc(quiz.question.answer)}</small>`:''}</div><button class="btn primary" id="nextQuestion" style="float:right;margin-top:12px">Next →</button>`;
    $('#nextQuestion').onclick=nextQuestion; if(meta.settings.quizAutoNext)setTimeout(()=>{if(quiz?.locked)nextQuestion()},correct?1000:1700);
  }
  function nextQuestion(){quiz.index++;quiz.locked=false;renderQuestion()}
  function finishQuiz(){meta.sessions++;meta.history.push({date:new Date().toISOString(),correct:quiz.correct,wrong:quiz.wrong});meta.history=meta.history.slice(-100);save();renderSessionComplete({total:quiz.deck.length,correct:quiz.correct,wrong:quiz.wrong,best:quiz.best,newWords:quiz.newWords},()=>beginQuiz({count:quiz.deck.length,types:quiz.types,source:words,quick:quiz.quick}))}
  function renderSessionComplete(r,restart){const acc=r.correct+r.wrong?Math.round(r.correct/(r.correct+r.wrong)*100):100,hasMistakes=words.some(w=>w.progress.wrong);$('#app').innerHTML=`<section class="panel session-complete"><div class="complete-icon">🎉</div><h1>Session complete</h1><p class="muted">You showed up and strengthened your memory.</p><div class="grid result-grid"><div><b>${r.total}</b><span>Reviewed</span></div><div><b>${acc}%</b><span>Accuracy</span></div><div><b>🔥 ${r.best}</b><span>Best streak</span></div></div><p><b>${r.correct}</b> correct · <b>${r.wrong}</b> incorrect · <b>${r.newWords}</b> new words</p><div class="actions" style="justify-content:center"><button class="btn" id="practiceWrong" ${hasMistakes?'':'disabled'}>Practice mistakes</button><button class="btn primary" id="restart">Study again</button><button class="btn outline" data-view="dashboard">Dashboard</button></div></section>`;$('#practiceWrong').onclick=()=>beginQuiz({count:20,types:['mc','typing'],source:words.filter(w=>w.progress.wrong)});$('#restart').onclick=restart}

  function getFilteredWords(mode) {
    let list=words;if(mode==='mistakes')list=words.filter(w=>w.progress.wrong);if(mode==='favorites')list=words.filter(w=>w.progress.favorite);
    const topic=$('#topicFilter')?.value||'All',q=(searchQuery||$('#listSearch')?.value||'').toLowerCase();if(topic!=='All')list=list.filter(w=>w.topic===topic);if(q)list=list.filter(w=>[w.english,w.vietnamese,w.explain,w.topic].some(x=>x.toLowerCase().includes(q)));return list;
  }
  function renderVocabulary(mode='all') {
    const title=mode==='mistakes'?'Mistakes':mode==='favorites'?'Favorites':'Vocabulary';
    $('#app').innerHTML=header(title,mode==='all'?'Search and explore your complete collection.':mode==='mistakes'?'Turn weak words into strong ones.':'Your saved words, ready to review.',`<button class="btn primary" id="practiceList">Practice ${mode==='all'?'selection':title.toLowerCase()}</button>`)+`<div class="toolbar"><input id="listSearch" placeholder="Search word, meaning, definition..." value="${esc(searchQuery)}"><select id="topicFilter"><option>All</option>${topics().map(([t])=>`<option>${esc(t)}</option>`).join('')}</select></div><div id="wordTable"></div>`;
    const update=()=>{const list=getFilteredWords(mode),size=25,pages=Math.max(1,Math.ceil(list.length/size));vocabPage=clamp(vocabPage,1,pages);const slice=list.slice((vocabPage-1)*size,vocabPage*size);$('#wordTable').innerHTML=!slice.length?`<div class="panel empty"><div class="empty-icon">⌕</div><h3>No matching words</h3><p>Try another search or import more vocabulary.</p></div>`:`<div class="table-wrap"><table><thead><tr><th>Word</th><th>Pronunciation</th><th>Type</th><th>Meaning</th><th>Topic</th><th>Status</th></tr></thead><tbody>${slice.map(w=>`<tr data-word="${esc(w.id)}"><td class="word-cell"><strong>${esc(w.english)}</strong></td><td>${esc(w.pronounce||'—')}</td><td>${esc(w.type||'—')}</td><td>${esc(w.vietnamese||'—')}</td><td>${esc(w.topic||'—')}</td><td><span class="badge">${w.progress.level>=4?'Mastered':w.progress.lastReviewed?'Learning':'New'}</span></td></tr>`).join('')}</tbody></table></div><div class="pagination"><button class="btn" id="prevPage" ${vocabPage===1?'disabled':''}>←</button><span class="btn">${vocabPage} / ${pages}</span><button class="btn" id="nextPage" ${vocabPage===pages?'disabled':''}>→</button></div>`;$$('[data-word]').forEach(tr=>tr.onclick=()=>showDetail(words.find(w=>w.id===tr.dataset.word)));$('#prevPage')?.addEventListener('click',()=>{vocabPage--;update()});$('#nextPage')?.addEventListener('click',()=>{vocabPage++;update()})};
    $('#listSearch').oninput=e=>{searchQuery=e.target.value;vocabPage=1;update()};$('#topicFilter').onchange=()=>{vocabPage=1;update()};$('#practiceList').onclick=()=>{const list=getFilteredWords(mode);if(list.length)startFlashcards(list);else toast('No words available to practice.')};update();
  }
  function renderMistakes(){renderVocabulary('mistakes')} function renderFavorites(){renderVocabulary('favorites')}
  function showDetail(w){if(!w)return;openModal(`<span class="word-type">${esc(w.type||'word')}</span><h1>${esc(w.english)}</h1><div class="phonetic">${esc(w.pronounce)}</div><button class="speak-btn" id="detailSpeak">🔊</button>${w.image_url?`<img class="detail-image" src="${esc(w.image_url)}" onerror="this.remove()">`:''}<h2>${esc(w.vietnamese)}</h2>${w.explain?`<h3>Definition</h3><p class="definition">${esc(w.explain)}</p>`:''}${w.example?`<div class="example-box"><b>${esc(w.example)}</b><br>${esc(w.example_vietnamese)}</div>`:''}<p class="muted">Topic · ${esc(w.topic||'Uncategorized')}</p><button class="btn ${w.progress.favorite?'danger':'primary'}" id="detailFavorite">${w.progress.favorite?'♥ Remove favorite':'♡ Add favorite'}</button>`);$('#detailSpeak').onclick=()=>speak(w);$('#detailFavorite').onclick=()=>{toggleFavorite(w);closeModal();toast(w.progress.favorite?'Added to favorites':'Removed from favorites')}}
  function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false')} function closeModal(){$('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true')}
  function toggleFavorite(w){w.progress.favorite=!w.progress.favorite;save()}

  function renderStatistics(){const s=stats(),days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=d.toISOString().slice(0,10);return {label:d.toLocaleDateString('en',{weekday:'short'}),value:meta.activity[key]||0}}),max=Math.max(1,...days.map(d=>d.value));$('#app').innerHTML=header('Statistics','Small, consistent sessions compound over time.')+`<section class="grid stats-grid">${statCard('<i class="ri-book-open-line"></i>',s.learned,'Words learned')}${statCard('<i class="ri-focus-3-line"></i>',s.accuracy+'%','Accuracy')}${statCard('<i class="ri-checkbox-circle-line"></i>',s.correct,'Correct answers')}${statCard('<i class="ri-close-circle-line"></i>',s.wrong,'Wrong answers')}${statCard('<i class="ri-fire-fill"></i>',meta.streak,'Current streak')}${statCard('<i class="ri-trophy-line"></i>',meta.longestStreak,'Longest streak')}${statCard('<i class="ri-history-line"></i>',meta.sessions,'Study sessions')}${statCard('<i class="ri-heart-3-line"></i>',words.filter(w=>w.progress.favorite).length,'Favorites')}</section><section class="panel" style="margin-top:18px"><div class="panel-title"><h2>Last 7 days</h2><span>Words reviewed</span></div><div class="chart">${days.map(d=>`<div class="bar-col"><div class="bar" title="${d.value} words" style="height:${Math.max(4,d.value/max*170)}px"></div>${d.label}</div>`).join('')}</div></section><section class="grid topics" style="margin-top:18px"><article class="panel"><h3>Weak words</h3>${wordMiniList([...words].sort((a,b)=>b.progress.wrong-a.progress.wrong).slice(0,5))}</article><article class="panel"><h3>Strong words</h3>${wordMiniList([...words].sort((a,b)=>b.progress.level-a.progress.level).slice(0,5))}</article><article class="panel"><h3>Recently learned</h3>${wordMiniList(words.filter(w=>w.progress.lastReviewed).sort((a,b)=>new Date(b.progress.lastReviewed)-new Date(a.progress.lastReviewed)).slice(0,5))}</article></section>`}
  function wordMiniList(list){return list.length?list.map(w=>`<p><b>${esc(w.english)}</b><br><small class="muted">${esc(w.vietnamese)}</small></p>`).join(''):'<p class="muted">Complete a session to see insights.</p>'}

  function renderSettings(){const s=meta.settings;$('#app').innerHTML=header('Settings','Tune the experience to the way you learn.')+`<div class="settings-list"><section class="setting-section"><h3>Appearance</h3>${selectSetting('Language','language',[['vi','Tiếng Việt'],['en','English']],s.language)}${selectSetting('Theme','theme',[['system','System'],['light','Light'],['dark','Dark']],s.theme)}${selectSetting('Accent color','accent',[['#6757e5','Violet'],['#147d75','Teal'],['#ce5d28','Orange']],s.accent)}</section><section class="setting-section"><h3>Pronunciation</h3>${selectSetting('Voice','voice',[['en-US','American English'],['en-GB','British English']],s.voice)}${selectSetting('Speech speed','speed',[[.75,'0.75×'],[1,'1×'],[1.25,'1.25×']],s.speed)}${toggleSetting('Auto pronunciation','autoPronounce',s.autoPronounce)}</section><section class="setting-section"><h3>Study preferences</h3>${toggleSetting('Show images','showImage',s.showImage)}${toggleSetting('Show examples','showExample',s.showExample)}${toggleSetting('Auto next in quiz','quizAutoNext',s.quizAutoNext)}${selectSetting('Daily goal','dailyGoal',[[10,'10 words'],[20,'20 words'],[30,'30 words'],[50,'50 words']],s.dailyGoal)}</section><section class="setting-section"><h3>Data</h3><div class="actions"><button class="btn danger" id="resetProgress">Reset learning progress</button><button class="btn danger" id="deleteWords">Delete vocabulary database</button><button class="btn outline" data-view="import">Import new CSV</button></div><p class="muted">Your data stays only in this browser's local storage.</p></section></div>`;$$('[data-setting]').forEach(el=>el.onchange=()=>{let v=el.type==='checkbox'?el.checked:el.value;if(['speed','dailyGoal'].includes(el.dataset.setting))v=+v;meta.settings[el.dataset.setting]=v;if(el.dataset.setting==='language'){const topLanguage=$('#languageSelect');topLanguage.value=v;topLanguage.dispatchEvent(new Event('change',{bubbles:true}))}applyTheme();save();if(el.dataset.setting==='language'){renderSettings();localizeDOM(document.body)}});$('#resetProgress').onclick=()=>{if(confirm('Reset all learning progress? Your vocabulary will be kept.')){words.forEach(w=>w.progress={correct:0,wrong:0,level:0,lastReviewed:null,nextReview:null,favorite:w.progress.favorite,hard:false});meta.activity={};meta.history=[];meta.sessions=0;meta.streak=0;save();renderSettings();toast('Learning progress reset.')}};$('#deleteWords').onclick=()=>{if(confirm('Delete the entire vocabulary database? This cannot be undone.')){words=[];localStorage.removeItem(DB_KEY);save();navigate('import');toast('Vocabulary database deleted.')}}}
  function selectSetting(label,key,options,value){return `<label class="setting-row"><span><b>${label}</b></span><select data-setting="${key}" class="btn">${options.map(([v,l])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${l}</option>`).join('')}</select></label>`} function toggleSetting(label,key,value){return `<label class="setting-row"><b>${label}</b><span class="switch"><input type="checkbox" data-setting="${key}" ${value?'checked':''}><span></span></span></label>`}

  function renderImport(){ $('#app').innerHTML=header('Import vocabulary','Use the provided TOEIC deck or bring your own CSV.')+`<section class="panel" style="max-width:850px;margin:auto"><div class="dropzone" id="dropzone"><div class="dropzone-icon">⇧</div><h2>Drag & drop CSV here</h2><p class="muted">Required columns: <b>english</b> and <b>vietnamese</b></p><button class="btn primary" id="chooseCsv">Choose CSV</button></div><div class="import-result"><h3>Expected structure</h3><div class="table-wrap"><table><tr>${FIELDS.map(f=>`<th>${f}</th>`).join('')}</tr></table></div><p class="muted">UTF-8 CSV is recommended. Quoted values and commas inside fields are supported.</p>${words.length?`<p>Current database: <b>${words.length.toLocaleString()} words</b> across <b>${topics().length} topics</b>.</p>`:''}</div></section>`;const zone=$('#dropzone');$('#chooseCsv').onclick=()=>$('#csvPicker').click();['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('dragging')}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('dragging')}));zone.addEventListener('drop',e=>e.dataTransfer.files[0]&&readFile(e.dataTransfer.files[0]));}
  function readFile(file){if(!file.name.toLowerCase().endsWith('.csv'))return toast('Please choose a CSV file.');if(file.size>25*1024*1024)return toast('CSV is too large (maximum 25 MB).');const reader=new FileReader();reader.onload=()=>importCSV(reader.result);reader.onerror=()=>toast('Could not read this file.');reader.readAsText(file,'UTF-8')}
  function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];if(c==='"'){if(quoted&&next==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field=''}else field+=c}row.push(field);if(row.some(v=>v.trim()))rows.push(row);return rows}
  function importCSV(text,silent=false){try{const rows=parseCSV(text.replace(/^\uFEFF/,''));if(rows.length<2)throw new Error('CSV contains no vocabulary rows.');const headers=rows[0].map(h=>h.trim().toLowerCase());const missing=['english','vietnamese'].filter(h=>!headers.includes(h));if(missing.length)throw new Error(`Missing required column: ${missing.join(', ')}`);const imported=rows.slice(1).map((r,i)=>normalizeWord(Object.fromEntries(headers.map((h,j)=>[h,r[j]||''])),i)).filter(w=>w.english&&w.vietnamese);if(!imported.length)throw new Error('No valid rows with English and Vietnamese values.');words=imported;meta.importedAt=new Date().toISOString();meta.selectedTopic='All';save();if(!silent){toast(`Imported ${words.length.toLocaleString()} words successfully.`);renderImport()}}catch(err){toast(err.message)}}

  function speak(w){if(!w)return;if(w.audio_url){const audio=new Audio(w.audio_url);audio.playbackRate=meta.settings.speed;audio.play().catch(()=>speechFallback(w.english));audio.onerror=()=>speechFallback(w.english)}else speechFallback(w.english)}
  function speechFallback(text){if(!('speechSynthesis'in window))return toast('Speech is not supported in this browser.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=meta.settings.voice;u.rate=meta.settings.speed;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang===u.lang)||voices.find(v=>v.lang.startsWith(u.lang.slice(0,2)))||null;speechSynthesis.speak(u)}
  function recordActivity(isNew){const day=today();meta.activity[day]=(meta.activity[day]||0)+1;if(isNew){}if(meta.activity[day]>=meta.settings.dailyGoal&&meta.lastGoalDate!==day){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const y=yesterday.toISOString().slice(0,10);meta.streak=meta.lastGoalDate===y?meta.streak+1:1;meta.longestStreak=Math.max(meta.longestStreak,meta.streak);meta.lastGoalDate=day;toast(`🔥 ${meta.streak} day streak!`)}}
  function handleKeyboard(e){if(e.target.matches('input,select,textarea'))return;if(currentView==='flashcards'&&flash.deck.length){const w=flash.deck[flash.index];if(e.code==='Space'){e.preventDefault();flash.flipped=!flash.flipped;$('#flashcard')?.classList.toggle('flipped')}if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code))rateWord(w,{Digit1:'again',Digit2:'hard',Digit3:'good',Digit4:'easy'}[e.code]);if(e.key==='ArrowRight'&&flash.index<flash.deck.length-1){flash.index++;flash.flipped=false;renderFlashcard()}if(e.key==='ArrowLeft'&&flash.index>0){flash.index--;flash.flipped=false;renderFlashcard()}if(e.key.toLowerCase()==='p')speak(w);if(e.key.toLowerCase()==='f'){toggleFavorite(w);renderFlashcard()}}if(e.key==='Escape')closeModal()}
  function renderEmpty(title,message,view){$('#app').innerHTML=`<section class="panel empty"><div class="empty-icon">◇</div><h2>${title}</h2><p>${message}</p><button class="btn primary" data-view="${view}">Continue</button></section>`}

  init();
})();
