const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDateInput');
const taskCategoryInput = document.getElementById('taskCategoryInput');
const taskPriorityInput = document.getElementById('taskPriorityInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
const taskList = document.getElementById('taskList');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const aiLoading = document.getElementById('aiLoading');
const aiAnalysisResult = document.getElementById('aiAnalysisResult');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const filterBtns = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let apiKey = localStorage.getItem('gemini_api_key') || '';
let currentFilter = 'all';

if (apiKey) apiKeyInput.value = apiKey;

// Filtre Butonları Mantığı
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// İlerleme Çubuğunu Güncelleme
function updateProgress() {
  if (tasks.length === 0) {
    progressBar.style.width = '0%';
    progressText.textContent = '0/0 Tamamlandı (%0)';
    return;
  }
  const completedCount = tasks.filter(t => t.completed).length;
  const percent = Math.round((completedCount / tasks.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${completedCount}/${tasks.length} Tamamlandı (%${percent})`;
}

// Görevleri Ekrana Çizme
function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filteredTasks.forEach((task) => {
    const originalIndex = tasks.indexOf(task);
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const formattedDate = task.date ? new Date(task.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';

    li.innerHTML = `
      <div class="task-info" onclick="toggleTask(${originalIndex})">
        <span class="task-text">${task.text}</span>
        <div class="task-meta">
          <span class="badge badge-cat">${task.category || 'Genel'}</span>
          <span class="badge priority-${task.priority || 'Orta'}">• ${task.priority || 'Orta'}</span>
          ${formattedDate ? `<span class="task-date">📅 ${formattedDate}</span>` : ''}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask(${originalIndex})">Sil</button>
    `;
    taskList.appendChild(li);
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateProgress();
}

// Görev Ekleme
addTaskBtn.addEventListener('click', () => {
  if (taskInput.value.trim() !== '') {
    tasks.push({
      text: taskInput.value.trim(),
      completed: false,
      date: taskDateInput.value,
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value
    });
    taskInput.value = '';
    taskDateInput.value = '';
    renderTasks();
  }
});

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

saveKeyBtn.addEventListener('click', () => {
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', apiKey);
  alert('API Key kaydedildi!');
});

// AI Öneri Alma
aiSuggestBtn.addEventListener('click', async () => {
  if (!apiKey) return alert('Lütfen Gemini API Key kaydedin.');
  aiLoading.classList.remove('hidden');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Günlük verimlilik için kısa ve net 1 adet görev önerisi yaz." }] }]
      })
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

// AI Öncelik Analizi
aiAnalyzeBtn.addEventListener('click', async () => {
  if (!apiKey) return alert('Lütfen Gemini API Key kaydedin.');
  const activeTasks = tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) return alert('Analiz edilecek aktif görev bulunmuyor.');

  aiLoading.classList.remove('hidden');
  aiAnalysisResult.classList.add('hidden');

  const promptText = `Aşağıdaki görev listesini incele ve kullanıcının bugün ilk olarak hangi göreve odaklanması gerektiğini 2 kısa cümleyle tavsiye et:\n` + 
    activeTasks.map(t => `- ${t.text} (Kategori: ${t.category}, Öncelik: ${t.priority})`).join('\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const data = await response.json();
    if (data.error) return alert('API Hatası: ' + data.error.message);

    aiAnalysisResult.textContent = "💡 AI Tavsiyesi: " + data.candidates[0].content.parts[0].text.trim();
    aiAnalysisResult.classList.remove('hidden');
  } catch (e) {
    alert('Analiz yapılırken hata oluştu.');
  } finally {
    aiLoading.classList.add('hidden');
  }
});

renderTasks();
const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDateInput');
const taskCategoryInput = document.getElementById('taskCategoryInput');
const taskPriorityInput = document.getElementById('taskPriorityInput');
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
const filterBtns = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let apiKey = localStorage.getItem('gemini_api_key') || '';
let currentFilter = 'all';

if (apiKey) apiKeyInput.value = apiKey;

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function updateProgress() {
  if (tasks.length === 0) {
    progressBar.style.width = '0%';
    progressText.textContent = '0/0 Tamamlandı (%0)';
    return;
  }
  const completedCount = tasks.filter(t => t.completed).length;
  const percent = Math.round((completedCount / tasks.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${completedCount}/${tasks.length} Tamamlandı (%${percent})`;
}

function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filteredTasks.forEach((task) => {
    const originalIndex = tasks.indexOf(task);
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const formattedDate = task.date ? new Date(task.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';

    li.innerHTML = `
      <div class="task-info" onclick="toggleTask(${originalIndex})">
        <span class="task-text">${task.text}</span>
        <div class="task-meta">
          <span class="badge badge-cat">${task.category || 'Genel'}</span>
          <span class="badge priority-${task.priority || 'Orta'}">• ${task.priority || 'Orta'}</span>
          ${formattedDate ? `<span class="task-date">📅 ${formattedDate}</span>` : ''}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask(${originalIndex})">Sil</button>
    `;
    taskList.appendChild(li);
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateProgress();
}

addTaskBtn.addEventListener('click', () => {
  if (taskInput.value.trim() !== '') {
    tasks.push({
      text: taskInput.value.trim(),
      completed: false,
      date: taskDateInput.value,
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value
    });
    taskInput.value = '';
    taskDateInput.value = '';
    renderTasks();
  }
});

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

saveKeyBtn.addEventListener('click', () => {
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', apiKey);
  alert('API Key kaydedildi!');
});

// AI Öneri
aiSuggestBtn.addEventListener('click', async () => {
  if (!apiKey) return alert('Lütfen Gemini API Key kaydedin.');
  aiLoading.classList.remove('hidden');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Günlük verimlilik için kısa ve net 1 adet görev önerisi yaz." }] }]
      })
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

// AI Öncelik Analizi
aiAnalyzeBtn.addEventListener('click', async () => {
  if (!apiKey) return alert('Lütfen Gemini API Key kaydedin.');
  const activeTasks = tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) return alert('Analiz edilecek aktif görev bulunmuyor.');

  aiLoading.classList.remove('hidden');
  aiAnalysisResult.classList.add('hidden');

  const promptText = `Aşağıdaki görev listesini incele ve kullanıcının bugün ilk olarak hangi göreve odaklanması gerektiğini 2 kısa cümleyle tavsiye et:\n` + 
    activeTasks.map(t => `- ${t.text} (Kategori: ${t.category}, Öncelik: ${t.priority})`).join('\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const data = await response.json();
    if (data.error) return alert('API Hatası: ' + data.error.message);

    aiAnalysisResult.textContent = "💡 AI Tavsiyesi: " + data.candidates[0].content.parts[0].text.trim();
    aiAnalysisResult.classList.remove('hidden');
  } catch (e) {
    alert('Analiz yapılırken hata oluştu.');
  } finally {
    aiLoading.classList.add('hidden');
  }
});

// AI Veri Analizi (Performans ve İstatistik Raporu)
aiDataAnalysisBtn.addEventListener('click', async () => {
  if (!apiKey) return alert('Lütfen Gemini API Key kaydedin.');
  if (tasks.length === 0) return alert('Analiz edilecek veri bulunmuyor. Lütfen önce birkaç görev ekleyin.');

  aiLoading.classList.remove('hidden');
  aiDataResult.classList.add('hidden');

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const promptText = `Sen profesyonel bir veri analistisin. Kullanıcının görev verilerini analiz et ve kısa, şık bir Verimlilik Raporu sun.
Mevcut Veriler:
- Toplam Görev: ${tasks.length}
- Tamamlanan: ${completedCount}
- Bekleyen: ${pendingCount}
- Görev Detayları: ${JSON.stringify(tasks)}

Lütfen şunları içer:
1. 📊 Genel Verimlilik Puanı (100 üzerinden)
2. 🏆 En çok odaklanılan kategoriler
3. 📈 Verimliliği artırmak için 1 adet altın tavsiye.
Yanıtın kısa, motive edici ve maddeler halinde olsun.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const data = await response.json();
    if (data.error) return alert('API Hatası: ' + data.error.message);

    aiDataResult.textContent = data.candidates[0].content.parts[0].text.trim();
    aiDataResult.classList.remove('hidden');
  } catch (e) {
    alert('Veri analizi yapılırken hata oluştu.');
  } finally {
    aiLoading.classList.add('hidden');
  }
});

renderTasks();
