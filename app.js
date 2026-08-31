// Elementler
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplayName = document.getElementById('userDisplayName');

const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const taskList = document.getElementById('taskList');

const apiInputGroup = document.getElementById('apiInputGroup');
const apiSavedGroup = document.getElementById('apiSavedGroup');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const resetKeyBtn = document.getElementById('resetKeyBtn');

const aiLoading = document.getElementById('aiLoading');
const notifyPermissionBtn = document.getElementById('notifyPermissionBtn');

// Veriler
let users = JSON.parse(localStorage.getItem('todo_users')) || {};
let currentUser = localStorage.getItem('todo_current_user') || null;

// Kayıt Ol
registerBtn.addEventListener('click', () => {
  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!user || !pass) return alert('Lütfen kullanıcı adı ve şifre girin.');
  if (users[user]) return alert('Bu kullanıcı adı zaten alınmış!');

  users[user] = { password: pass, apiKey: '', tasks: [] };
  localStorage.setItem('todo_users', JSON.stringify(users));
  alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
});

// Giriş Yap
loginBtn.addEventListener('click', () => {
  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (users[user] && users[user].password === pass) {
    currentUser = user;
    localStorage.setItem('todo_current_user', currentUser);
    initApp();
  } else {
    alert('Hatalı kullanıcı adı veya şifre!');
  }
});

// Çıkış Yap
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('todo_current_user');
  authContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
});

// Uygulama Başlatma ve API Görünürlüğü Kontrolü
function initApp() {
  if (!currentUser) return;
  authContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  userDisplayName.textContent = currentUser;

  updateApiUI();
  renderTasks();
}

// API Arayüzü Gizleme/Gösterme Mantığı
function updateApiUI() {
  const apiKey = users[currentUser].apiKey;
  if (apiKey) {
    // Key varsa kutuyu gizle, güvenli durumu göster
    apiInputGroup.classList.add('hidden');
    apiSavedGroup.classList.remove('hidden');
    apiKeyInput.value = ''; // Kutunun içini de temizliyoruz ki inceleden dahi okunamasın
  } else {
    // Key yoksa kutuyu göster
    apiInputGroup.classList.remove('hidden');
    apiSavedGroup.classList.add('hidden');
  }
}

// API Key Kaydetme
saveKeyBtn.addEventListener('click', () => {
  const val = apiKeyInput.value.trim();
  if (!val) return alert('Lütfen geçerli bir API Key girin.');
  users[currentUser].apiKey = val;
  localStorage.setItem('todo_users', JSON.stringify(users));
  alert('API Key güvenli şekilde kaydedildi ve gizlendi!');
  updateApiUI();
});

// API Key Sıfırlama (Değiştir)
resetKeyBtn.addEventListener('click', () => {
  users[currentUser].apiKey = '';
  localStorage.setItem('todo_users', JSON.stringify(users));
  updateApiUI();
});

// Görevleri Çiz
function renderTasks() {
  taskList.innerHTML = '';
  const tasks = users[currentUser].tasks || [];

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const formattedDate = task.date ? new Date(task.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';

    li.innerHTML = `
      <div>
        <span onclick="toggleTask(${index})">${task.text}</span>
        ${formattedDate ? `<span class="task-date">📅 ${formattedDate}</span>` : ''}
      </div>
      <button class="delete-btn" onclick="deleteTask(${index})">Sil</button>
    `;
    taskList.appendChild(li);
  });

  localStorage.setItem('todo_users', JSON.stringify(users));
}

// Görev Ekle
addTaskBtn.addEventListener('click', () => {
  if (taskInput.value.trim() !== '') {
    users[currentUser].tasks.push({
      text: taskInput.value.trim(),
      completed: false,
      date: taskDateInput.value
    });
    taskInput.value = '';
    taskDateInput.value = '';
    renderTasks();
  }
});

// Görev Tamamla
function toggleTask(index) {
  users[currentUser].tasks[index].completed = !users[currentUser].tasks[index].completed;
  renderTasks();
}

// Görev Sil
function deleteTask(index) {
  users[currentUser].tasks.splice(index, 1);
  renderTasks();
}

// AI Öneri
aiSuggestBtn.addEventListener('click', async () => {
  const apiKey = users[currentUser].apiKey;
  if (!apiKey) return alert('Lütfen önce bir Gemini API Key kaydedin.');

  aiLoading.classList.remove('hidden');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Bana gün içinde yapılabilecek verimli 1 adet kısa görev önerisi ver. Sadece görevin metnini yaz, ek açıklama yapma." }] }]
      })
    });
    const data = await response.json();
    if (data.error) return alert('API Hatası: ' + data.error.message);

    taskInput.value = data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    alert('AI önerisi alınırken hata oluştu.');
  } finally {
    aiLoading.classList.add('hidden');
  }
});

// Otomatik Giriş Kontrolü
if (currentUser && users[currentUser]) {
  initApp();
}
