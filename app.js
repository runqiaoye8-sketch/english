(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const articles = window.ARTICLES || [];
  const STORAGE = {
    read: 'sidequest-read-v1',
    words: 'sidequest-words-v1',
    theme: 'sidequest-theme-v1',
    font: 'sidequest-font-v1'
  };
  const state = {
    filter: 'All', search: '', current: null,
    read: readJSON(STORAGE.read, []), words: readJSON(STORAGE.words, []),
    selections: {}, submitted: false, articleFont: Number(localStorage.getItem(STORAGE.font)) || 20,
    dictionaryRequest: 0
  };
  const categoryNames = {
    Celebrity: 'CELEBRITY', Fandom: 'FANDOM', Music: 'MUSIC', Lifestyle: 'LIFESTYLE',
    Fashion: 'FASHION', Entertainment: 'ENTERTAINMENT', Internet: 'INTERNET',
    Awards: 'AWARDS', Technology: 'TECHNOLOGY'
  };
  const accents = {
    peach: '#f2d3c2', lavender: '#ddd5ef', blue: '#c9dbe8', sage: '#d2dfcf',
    rose: '#f1d2d8', gold: '#eee0b8', mint: '#c9e0d7', plum: '#d9cee2', coral: '#f1cfc2', ink: '#cbd0ce'
  };
  let toastTimer = null;
  let focusPointerTimer = null;

  function readJSON(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; }
    catch { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
  }
  function updateStats() {
    const count = state.read.length;
    const percent = Math.round(count / articles.length * 100) || 0;
    $('#progressCount').textContent = count;
    $('#progressPercent').textContent = `${percent}%`;
    $('#progressBar').style.width = `${percent}%`;
    $('#progressMessage').textContent = count === 0 ? 'Every page counts.' : count === articles.length ? 'You read the whole tea. Iconic.' : 'Look at you, making progress.';
    $('#savedWordCount').textContent = state.words.length;
    $('#vibeText').textContent = count >= 8 ? 'The culture connoisseur' : count >= 4 ? 'The curious insider' : count > 0 ? 'The rising gossip scholar' : 'The curious beginner';
    renderSavedWords();
  }
  function renderSavedWords() {
    const target = $('#savedWords');
    if (!state.words.length) {
      target.innerHTML = '<span class="saved-empty">Your words will show up here.</span>';
      return;
    }
    target.innerHTML = state.words.slice(-10).reverse().map(item => `<span class="saved-chip" title="${escapeHTML(item.meaning || '')}">${escapeHTML(item.word)}</span>`).join('');
  }
  function renderCards() {
    const grid = $('#storyGrid');
    const filtered = articles.filter(article => {
      const categoryMatch = state.filter === 'All' || article.category === state.filter;
      const text = `${article.title} ${article.subtitle} ${article.category} ${article.paragraphs.join(' ')}`.toLowerCase();
      return categoryMatch && text.includes(state.search.toLowerCase());
    });
    grid.innerHTML = filtered.map(article => {
      const isRead = state.read.includes(article.id);
      return `<article class="story-card" role="button" tabindex="0" data-id="${article.id}" aria-label="阅读：${escapeHTML(article.title)}">
        <div class="card-top"><span class="card-category">${categoryNames[article.category] || article.category.toUpperCase()}</span><span class="card-number">NO. ${String(article.id).padStart(2,'0')}</span></div>
        <div class="card-illustration" style="--card-accent:${accents[article.accent] || '#eadbd1'}"><span>${article.cover}</span></div>
        <div class="card-content"><h3>${escapeHTML(article.title)}</h3><p>${escapeHTML(article.subtitle)}</p></div>
        <div class="card-bottom"><span>${article.minutes} MIN · ${article.level}</span><span class="${isRead ? 'card-read' : ''}">${isRead ? '✓ READ' : 'OPEN STORY'} <b class="card-arrow">↗</b></span></div>
      </article>`;
    }).join('');
    $('#emptyState').hidden = filtered.length !== 0;
    $$('.story-card', grid).forEach(card => {
      const open = () => openArticle(Number(card.dataset.id));
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }
  function wordMarkup(paragraph) {
    const safe = escapeHTML(paragraph);
    return safe.replace(/[A-Za-z]+(?:['’][A-Za-z]+)*/g, word => `<span class="word-hit" data-word="${word.toLowerCase()}">${word}</span>`);
  }
  function openArticle(id) {
    const article = articles.find(item => item.id === id);
    if (!article) return;
    state.current = article;
    state.selections = {};
    state.submitted = false;
    $('#readerScreen').hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.classList.remove('adhd-on');
    $('#adhdToggle').classList.remove('active');
    $('#readerScreen').classList.remove('immersive');
    $('#immersiveToggle').textContent = '⛶';
    $('#readerScreen').scrollTop = 0;
    $('#readerCategory').textContent = (categoryNames[article.category] || article.category).toUpperCase();
    $('#railCategory').textContent = (categoryNames[article.category] || article.category).toUpperCase();
    $('#articleTag').textContent = (categoryNames[article.category] || article.category).toUpperCase();
    $('#railNumber').textContent = String(article.id).padStart(2,'0');
    $('#articleReadTime').textContent = `${article.minutes} MIN READ`;
    $('#articleLevel').textContent = `LEVEL ${article.level}`;
    $('#articleTitle').textContent = article.title;
    $('#articleSubtitle').textContent = article.subtitle;
    $('#passage').innerHTML = article.paragraphs.map((paragraph, index) => `<p data-paragraph="${index}">${wordMarkup(paragraph)}</p>`).join('');
    $('#translationContent').innerHTML = article.translations.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
    const sourceItems = (article.sources || []).map(source => `<li>${escapeHTML(source)}</li>`).join('');
    $('#realityCheck').innerHTML = `<div class="reality-check-kicker">REALITY CHECK / 事实核查</div><p>${escapeHTML(article.factNote || '本文根据公开资料改写。')}</p><div class="reality-check-sources"><strong>参考资料线索</strong><ul>${sourceItems}</ul></div>`;
    $('#realityCheck').hidden = false;
    $('#fullTranslation').hidden = true;
    $('#translationToggle').classList.remove('active');
    $('#markReadButton').classList.toggle('done', state.read.includes(article.id));
    $('#markReadButton').innerHTML = state.read.includes(article.id) ? '已读过 <span>✓</span>' : '标记为已读 <span>✓</span>';
    $('#quizResult').textContent = '读完文章后，来检验一下理解程度。';
    $('#submitQuiz').disabled = false;
    $('#submitQuiz').style.opacity = '1';
    renderQuiz(article);
    updateReaderProgress();
    hideDictionary();
    document.title = `${article.title} — SIDEQUEST`;
  }
  function renderQuiz(article) {
    $('#quizList').innerHTML = article.questions.map((question, questionIndex) => `
      <div class="question-card" data-question="${questionIndex}">
        <p class="question-title"><span class="question-number">Q0${questionIndex + 1}</span>${escapeHTML(question.q)}</p>
        <div class="options-grid">${question.options.map((option, optionIndex) => `<button class="option-button" data-option="${optionIndex}" type="button"><span class="option-letter">${'ABCD'[optionIndex]}</span><span>${escapeHTML(option)}</span></button>`).join('')}</div>
        <div class="answer-explanation" hidden></div>
      </div>`).join('');
    $$('.question-card').forEach(card => {
      $$('.option-button', card).forEach(button => button.addEventListener('click', () => {
        if (state.submitted) return;
        const qIndex = Number(card.dataset.question);
        state.selections[qIndex] = Number(button.dataset.option);
        $$('.option-button', card).forEach(option => option.classList.toggle('selected', option === button));
      }));
    });
  }
  function closeReader() {
    $('#readerScreen').hidden = true;
    document.body.style.overflow = '';
    document.body.classList.remove('adhd-on');
    hideDictionary();
    document.title = 'SIDEQUEST — English Reading Club';
    updateStats();
    renderCards();
  }
  function updateReaderProgress() {
    const el = $('#readerScreen');
    const denominator = Math.max(1, el.scrollHeight - el.clientHeight);
    const progress = Math.min(100, Math.max(0, el.scrollTop / denominator * 100));
    $('#readerProgressBar').style.width = `${progress}%`;
  }
  function markCurrentRead() {
    if (!state.current) return;
    if (!state.read.includes(state.current.id)) {
      state.read.push(state.current.id);
      state.read.sort((a,b) => a-b);
      save(STORAGE.read, state.read);
      updateStats();
      renderCards();
      showToast('已加入阅读进度。Nice work!');
    } else showToast('这篇已经在你的已读清单里啦。');
    $('#markReadButton').classList.add('done');
    $('#markReadButton').innerHTML = '已读过 <span>✓</span>';
  }
  function submitQuiz() {
    if (state.submitted || !state.current) return;
    const total = state.current.questions.length;
    const answered = Object.keys(state.selections).length;
    if (answered < total) {
      showToast(`还有 ${total - answered} 道题没选哦。`);
      return;
    }
    state.submitted = true;
    let score = 0;
    state.current.questions.forEach((question, index) => {
      const card = $(`.question-card[data-question="${index}"]`);
      const selected = state.selections[index];
      $$('.option-button', card).forEach((button, optionIndex) => {
        button.disabled = true;
        if (optionIndex === question.answer) button.classList.add('correct');
        if (optionIndex === selected && selected !== question.answer) button.classList.add('wrong');
      });
      if (selected === question.answer) score++;
      const explanation = $('.answer-explanation', card);
      explanation.hidden = false;
      explanation.innerHTML = `<b>${selected === question.answer ? '✓ Correct!' : `正确答案：${'ABCD'[question.answer]}`}</b> ${escapeHTML(question.why)}`;
    });
    const message = score === total ? '全对！Gossip scholar status unlocked.' : score >= 2 ? '不错！再回到原文看看细节。' : '别急，答案解析可以帮你找到线索。';
    $('#quizResult').textContent = `你的得分：${score} / ${total}　${message}`;
    $('#submitQuiz').disabled = true;
    $('#submitQuiz').style.opacity = '.55';
    if (!state.read.includes(state.current.id)) markCurrentRead();
  }
  async function lookupWord(word) {
    const clean = word.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!clean || clean.length < 2) return;
    const pop = $('#dictionaryPop');
    const requestId = ++state.dictionaryRequest;
    pop.hidden = false;
    $('#dictWord').textContent = clean;
    $('#dictPhonetic').textContent = 'LOOKING IT UP…';
    $('#dictMeaning').textContent = '正在查找释义';
    $('#dictExternal').href = `https://www.youdao.com/result?word=${encodeURIComponent(clean)}&lang=en`;
    const local = state.current?.vocab?.[clean];
    if (local) {
      $('#dictPhonetic').textContent = local[0] || '—';
      $('#dictMeaning').textContent = local[1];
      updateSaveButton(clean);
      return;
    }
    const saved = state.words.find(item => item.word === clean);
    if (saved?.meaning) {
      $('#dictPhonetic').textContent = saved.phonetic || '—';
      $('#dictMeaning').textContent = saved.meaning;
      updateSaveButton(clean);
      return;
    }
    updateSaveButton(clean);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
      if (!response.ok) throw new Error('not found');
      const data = await response.json();
      if (requestId !== state.dictionaryRequest) return;
      const entry = data[0];
      const phonetic = entry.phonetic || entry.phonetics?.find(item => item.text)?.text || '';
      const meaning = entry.meanings?.slice(0,2).map(item => {
        const definitions = item.definitions?.slice(0,2).map(def => def.definition).join('; ');
        return `${item.partOfSpeech || ''}: ${definitions || ''}`;
      }).filter(Boolean).join('　') || '暂时没有找到简明释义。';
      $('#dictPhonetic').textContent = phonetic;
      $('#dictMeaning').textContent = meaning;
    } catch {
      if (requestId !== state.dictionaryRequest) return;
      $('#dictPhonetic').textContent = 'OFFLINE LOOKUP';
      $('#dictMeaning').textContent = '暂未收录这个词。点击“更多释义”可打开有道词典查询。';
    }
  }
  function updateSaveButton(word) {
    const exists = state.words.some(item => item.word === word);
    $('#saveWordButton').textContent = exists ? '✓ 已收藏' : '＋ 收藏单词';
    $('#saveWordButton').disabled = exists;
  }
  function saveCurrentWord() {
    const word = $('#dictWord').textContent;
    if (!word || state.words.some(item => item.word === word)) return;
    const meaning = $('#dictMeaning').textContent;
    const phonetic = $('#dictPhonetic').textContent;
    state.words.push({word, meaning, phonetic});
    save(STORAGE.words, state.words);
    updateStats();
    updateSaveButton(word);
    showToast(`已收藏 ${word}`);
  }
  function hideDictionary() { $('#dictionaryPop').hidden = true; }
  function toggleADHD() {
    const enabled = !document.body.classList.contains('adhd-on');
    document.body.classList.toggle('adhd-on', enabled);
    $('#adhdToggle').classList.toggle('active', enabled);
    if (!enabled) $$('.passage p').forEach(paragraph => paragraph.classList.remove('is-focused'));
    showToast(enabled ? '专注模式开启：将鼠标移到段落上聚焦。' : '已关闭专注模式。');
  }
  function toggleImmersive() {
    const active = $('#readerScreen').classList.toggle('immersive');
    $('#immersiveToggle').textContent = active ? '⊡' : '⛶';
    $('#immersiveToggle').title = active ? '退出沉浸式阅读' : '沉浸式阅读';
  }
  function toggleTranslation() {
    const section = $('#fullTranslation');
    section.hidden = !section.hidden;
    $('#translationToggle').classList.toggle('active', !section.hidden);
    if (!section.hidden) section.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  function changeFont(delta) {
    state.articleFont = Math.min(26, Math.max(16, state.articleFont + delta));
    document.documentElement.style.setProperty('--article-font', `${state.articleFont}px`);
    localStorage.setItem(STORAGE.font, String(state.articleFont));
  }
  function toggleTheme() {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    localStorage.setItem(STORAGE.theme, dark ? 'dark' : 'light');
  }
  function bindEvents() {
    $('#filterRow').addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state.filter = button.dataset.filter;
      $$('.filter-chip').forEach(chip => chip.classList.toggle('active', chip === button));
      renderCards();
    });
    $('#searchInput').addEventListener('input', event => { state.search = event.target.value; renderCards(); });
    $('#startButton').addEventListener('click', () => {
      const unread = articles.filter(article => !state.read.includes(article.id));
      const chosen = unread.length ? unread[Math.floor(Math.random() * unread.length)] : articles[0];
      openArticle(chosen.id);
    });
    $('#backButton').addEventListener('click', closeReader);
    $('#markReadButton').addEventListener('click', markCurrentRead);
    $('#submitQuiz').addEventListener('click', submitQuiz);
    $('#nextButton').addEventListener('click', () => {
      const next = articles.find(article => article.id === (state.current?.id || 0) + 1) || articles[0];
      openArticle(next.id);
    });
    $('#readerScreen').addEventListener('scroll', updateReaderProgress, {passive:true});
    $('#passage').addEventListener('click', event => {
      const paragraph = event.target.closest('p[data-paragraph]');
      if (paragraph && document.body.classList.contains('adhd-on')) {
        $$('.passage p').forEach(item => item.classList.toggle('is-focused', item === paragraph));
      }
      const word = event.target.closest('.word-hit');
      if (word) lookupWord(word.dataset.word);
    });
    $('#passage').addEventListener('mouseover', event => {
      const paragraph = event.target.closest('p[data-paragraph]');
      if (paragraph && document.body.classList.contains('adhd-on')) {
        $$('.passage p').forEach(item => item.classList.toggle('is-focused', item === paragraph));
      }
    });
    $('#readerScreen').addEventListener('mousemove', event => {
      if (!document.body.classList.contains('adhd-on')) return;
      const ruler = $('#readingRuler');
      ruler.style.top = `${Math.max(65, Math.min(window.innerHeight - 55, event.clientY - 27))}px`;
    }, {passive:true});
    $('#adhdToggle').addEventListener('click', toggleADHD);
    $('#immersiveToggle').addEventListener('click', toggleImmersive);
    $('#translationToggle').addEventListener('click', toggleTranslation);
    $('#fontDown').addEventListener('click', () => changeFont(-1));
    $('#fontUp').addEventListener('click', () => changeFont(1));
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#readerThemeToggle').addEventListener('click', toggleTheme);
    $('#dictClose').addEventListener('click', hideDictionary);
    $('#saveWordButton').addEventListener('click', saveCurrentWord);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        hideDictionary();
        if (!$('#readerScreen').hidden) closeReader();
      }
      if (event.key === '/' && !event.target.matches('input,textarea')) {
        event.preventDefault();
        $('#searchInput').focus();
      }
    });
    $('#dictExternal').addEventListener('click', () => { /* Link intentionally opens an external dictionary in a new tab. */ });
  }
  function init() {
    if (localStorage.getItem(STORAGE.theme) === 'dark') document.body.classList.add('dark');
    document.documentElement.style.setProperty('--article-font', `${state.articleFont}px`);
    bindEvents();
    renderCards();
    updateStats();
  }
  init();
})();
