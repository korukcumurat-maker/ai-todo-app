import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://depelkxklehdmhutfhwn.supabase.co';
const supabaseKey = 'sb_secret__b0BNiSCEEDB1qnGYcS0Bg_T_C0WsBz';
const supabase = createClient(supabaseUrl, supabaseKey);

const taskInput = document.getElementById('taskInput');
const taskTimeInput = document.getElementById('taskTimeInput');
const taskCategoryInput = document.getElementById('taskCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const taskPriorityInput = document.getElementById('taskPriorityInput');
const userProfileInput = document.getElementById('userProfileInput');
const activeDateSelect = document.getElementById('activeDateSelect');
const viewModeBtn = document.getElementById('viewModeBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
const aiDataAnalysisBtn = document.getElementById('aiDataAnalysisBtn');
const taskList = document.getElementById('taskList');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const aiLoading = document.getElementById('aiLoading');
const aiAnalysisResult = document.getElementById('aiAnalysisResult');
const aiDataResult = document.getElementById('aiDataResult');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressTitle = document.getElementById('progressTitle');
const filterBtns = document.querySelectorAll('.filter-btn');
const dailyAiGreeting = document.getElementById('dailyAiGreeting');
const dailyAiText = document.getElementById('dailyAiText');

const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let tasks = [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Genel', 'İş', 'Kişisel', 'Alışveriş', 'Sağlık'];
let apiKey = localStorage.getItem('gemini_api_key') || '';
let userNote = localStorage.getItem('gemini_user_note') || '';
let currentFilter = 'all';
let viewMode = 'day'; 
let currentTheme = localStorage.getItem('app_theme') || 'dark';

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

let selectedDate = getTodayDateStr();
activeDateSelect.value = selectedDate;

if (apiKey) apiKeyInput.value = apiKey;
if (userNote) userProfileInput.value = userNote;
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggleBtn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

function initCategories() {
  taskCategoryInput.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = '📁 ' + cat;
    taskCategoryInput.appendChild(opt);
  });
}
initCategories();

themeToggleBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('app_theme', currentTheme);
  themeToggleBtn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
});

settingsToggleBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

saveKeyBtn.addEventListener('click', () => {
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', apiKey);
  alert('API Key kaydedildi!');
  settingsModal.classList.add('hidden');
  checkAndFetchDailyAi();
});

userProfileInput.addEventListener('input', () => {
  localStorage.setItem('gemini_user_note', userProfileInput.value);
});

addCategoryBtn.addEventListener('click', () => {
  const newCat = prompt('Yeni kategori adını girin:');
  if (newCat && newCat.trim() !== '') {
    const formatted = newCat.trim();
    if (!categories.includes(formatted)) {
      categories.push(formatted);
      localStorage.setItem('categories', JSON.stringify(categories));
      initCategories();
      taskCategoryInput.value = formatted;
    } else {
      alert('Bu kategori zaten mevcut.');
    }
  }
});

activeDateSelect.addEventListener('change', (e) => {
  selectedDate = e.target.value;
  renderTasks();
});

viewModeBtn.addEventListener('click', () => {
  if (viewMode === 'day') {
    viewMode = 'all';
    viewModeBtn.textContent = '🌐 Tüm Zamanlar';
    viewModeBtn.classList.add('active-mode');
    activeDateSelect.disabled = true;
  } else {
    viewMode = 'day';
    viewModeBtn.textContent = '📅 Sadece Bu Gün';
    viewModeBtn.classList.remove('active-mode');
    activeDateSelect.disabled = false;
  }
  renderTasks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function updateProgress(filteredList) {
  if (filteredList.length === 0) {
    progressBar.style.width = '0%';
    progressText.textContent = '0/0 Tamamlandı (%0)';
    return;
  }
  const completedCount = filteredList.filter(t => t.completed).length;
  const percent = Math.round((completedCount / filteredList.length) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = `${completedCount}/${filteredList.length} Tamamlandı (%${percent})`;
  progressTitle.textContent = viewMode === 'day' ? `${selectedDate} Tarihli Plan` : 'Tüm Zamanların Özeti';
}

async function fetchTasksFromSupabase() {
  const { data, error } = await supabase.from('todos').select('*');
  if (!error && data) {
    tasks = data;
    renderTasks();
  } else {
    console.error('Görevler çekilemedi:', error);
  }
}

function renderTasks() {
  taskList.innerHTML = '';

  let scopedTasks = tasks;
  if (viewMode === 'day') {
    scopedTasks = tasks.filter(t => t.date === selectedDate);
  }

  const finalFiltered = scopedTasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  finalFiltered.forEach((task) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    // title alanı veritabanındaki sütun adımızla birebir eşleştirildi
    li.innerHTML = `
      <div class="task-info" onclick="toggleTask('${task.id}')">
        <span class="task-text">${task.title || ''}</span>
        <div class="task-meta">
          <span class="badge">📁 ${task.category || 'Genel'}</span>
          <span class="badge priority-${task.priority || 'Orta'}">• ${task.priority || 'Orta'}</span>
          ${task.date ? `<span class="badge">📅 ${task.date}</span>` : ''}
          ${task.time ? `<span class="badge">⏰ ${task.time}</span>` : ''}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask('${task.id}')">Sil</button>
    `;
    taskList.appendChild(li);
  });

  updateProgress(scopedTasks);
}

addTaskBtn.addEventListener('click', async () => {
  if (taskInput.value.trim() !== '') {
    const yeniGorev = {
      title: taskInput.value.trim(),
      completed: false,
      date: selectedDate,
      time: taskTimeInput.value || '',
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value
    };

    const { error } = await supabase.from('todos').insert([yeniGorev]);
    if (!error) {
      taskInput.value = '';
      taskTimeInput.value = '';
      fetchTasksFromSupabase();
    } else {
      alert('Görev eklenirken hata oluştu: ' + error.message);
    }
  }
});

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const newCompletedState = !task.completed;
  const { error } = await supabase
    .from('todos')
    .update({ completed: newCompletedState })
    .eq('id', id);

  if (!error) {
    fetchTasksFromSupabase();
  }
}

async function deleteTask(id) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (!error) {
    fetchTasksFromSupabase();
  }
}

async function checkAndFetchDailyAi() {
  if (!apiKey) return;
  const today = getTodayDateStr();
  const todayTasks = tasks.filter(t => t.date === today);

  dailyAiGreeting.classList.remove('hidden');
  dailyAiText.textContent = 'Günlük AI stratejiniz yükleniyor...';

  const promptText = `Bugünün tarihi: ${today}. Kullanıcının ana hedefi/notu: ${userProfileInput.value || 'Belirtilmedi'}. Bugün yapacağı görevler: ${JSON.stringify(todayTasks)}. Kullanıcıya güne zinde başlaması için 1-2 cümlelik motive edici ve akıllı bir günlük strateji özeti ver.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const data = await response.json();
    if (!data.error && data.candidates) {
      dailyAiText.textContent = data.candidates[0].content.parts[0].text.trim();
    } else {
      dailyAiGreeting.classList.add('hidden');
    }
  } catch (e) {
    dailyAiGreeting.classList.add('hidden');
  }
}

if (aiSuggestBtn) {
  aiSuggestBtn.addEventListener('click', async () => {
    if (!apiKey) return alert('Lütfen ayarlardan (⚙️) API Key girin.');
    aiLoading.classList.remove('hidden');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Verimlilik odaklı kısa ve net 1 adet görev önerisi yaz.' }] }] })
      });
      const data = await response.json();
      if (data.error) return alert('API Hatası: ' + data.error.message);
      taskInput.value = data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
      alert('AI Hatası oluştu.');
    } finally {
      aiLoading.classList.add('hidden');
    }
  });
}

if (aiAnalyzeBtn) {
  aiAnalyzeBtn.addEventListener('click', async () => {
    if (!apiKey) return alert('Lütfen ayarlardan (⚙️) API Key girin.');
    const todayTasks = tasks.filter(t => t.date === selectedDate && !t.completed);
    if (todayTasks.length === 0) return alert('Seçilen günde analiz edilecek aktif görev yok.');

    aiLoading.classList.remove('hidden');
    aiAnalysisResult.classList.add('hidden');

    const promptText = `Tarih: ${selectedDate}. Kullanıcı Hedefi: ${userProfileInput.value || 'Belirtilmedi'}\nAktif Görevler:\n${todayTasks.map(t => `- ${t.title} (${t.category}, ${t.priority}, ${t.time || 'Saat belirtilmedi'})`).join('\n')}\nBu günlük planı optimize etmek için kısa taktikler ver.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      const data = await response.json();
      if (data.error) return alert('API Hatası: ' + data.error.message);

      aiAnalysisResult.textContent = '🧠 Günlük Plan Tavsiyesi:\n' + data.candidates[0].content.parts[0].text.trim();
      aiAnalysisResult.classList.remove('hidden');
    } catch (e) {
      alert('Analiz hatası.');
    } finally {
      aiLoading.classList.add('hidden');
    }
  });
}

if (aiDataAnalysisBtn) {
  aiDataAnalysisBtn.addEventListener('click', async () => {
    if (!apiKey) return alert('Lütfen ayarlardan (⚙️) API Key girin.');
    if (tasks.length === 0) return alert('Veri bulunmuyor.');

    aiLoading.classList.remove('hidden');
    aiDataResult.classList.add('hidden');

    const promptText = `Tüm zamanların görev verileri:\n${JSON.stringify(tasks)}\n1. Genel verimlilik puanı (100 üzerinden)\n2. Performans analizi\n3. 1 altın öneri. Kısa ve maddeler halinde yaz.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      const data = await response.json();
      if (data.error) return alert('API Hatası: ' + data.error.message);

      aiDataResult.textContent = '📊 Genel Verimlilik Raporu:\n' + data.candidates[0].content.parts[0].text.trim();
      aiDataResult.classList.remove('hidden');
    } catch (e) {
      alert('Veri analizi hatası.');
    } finally {
      aiLoading.classList.add('hidden');
    }
  });
}

fetchTasksFromSupabase();
if (apiKey) checkAndFetchDailyAi();
