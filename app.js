const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const taskList = document.getElementById('taskList');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const aiLoading = document.getElementById('aiLoading');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let apiKey = localStorage.getItem('gemini_api_key') || '';

if (apiKey) apiKeyInput.value = apiKey;

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${task}</span><button class="delete-btn" onclick="deleteTask(${index})">Sil</button>`;
    taskList.appendChild(li);
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

addTaskBtn.addEventListener('click', () => {
  if (taskInput.value.trim() !== '') {
    tasks.push(taskInput.value.trim());
    taskInput.value = '';
    renderTasks();
  }
});

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

saveKeyBtn.addEventListener('click', () => {
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', apiKey);
  alert('API Key kaydedildi!');
});

aiSuggestBtn.addEventListener('click', async () => {
  if (!apiKey) {
    alert('Lütfen önce Gemini API Key alanını doldurun ve kaydedin.');
    return;
  }
  aiLoading.classList.remove('hidden');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Bana gün içinde yapılabilecek verimli 1 adet kısa görev önerisi ver. Sadece görevin metnini yaz, ek açıklama yapma." }] }]
      })
    });
    const data = await response.json();
    
    if (data.error) {
      alert('API Hatası: ' + data.error.message);
      return;
    }
    
    const suggestion = data.candidates[0].content.parts[0].text.trim();
    taskInput.value = suggestion;
  } catch (error) {
    alert('AI önerisi alınırken bir hata oluştu. Lütfen API Keyinizin doğruluğunu kontrol edin.');
    console.error(error);
  } finally {
    aiLoading.classList.add('hidden');
  }
});

renderTasks();
