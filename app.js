const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDateInput');
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
    const taskText = typeof task === 'string' ? task : task.text;
    const isCompleted = typeof task === 'object' && task.completed;
    const taskDate = (typeof task === 'object' && task.date) ? task.date : '';

    const li = document.createElement('li');
    if (isCompleted) li.classList.add('completed');

    const formattedDate = taskDate ? new Date(taskDate).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';

    li.innerHTML = `
      <div class="task-info" onclick="toggleTask(${index})">
        <span class="task-text">${taskText}</span>
        ${formattedDate ? `<span class="task-date">📅 ${formattedDate}</span>` : ''}
      </div>
      <button class="delete-btn" onclick="deleteTask(${index})">Sil</button>
    `;
    taskList.appendChild(li);
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

addTaskBtn.addEventListener('click', () => {
  if (taskInput.value.trim() !== '') {
    tasks.push({
      text: taskInput.value.trim(),
      completed: false,
      date: taskDateInput.value
    });
    taskInput.value = '';
    taskDateInput.value = '';
    renderTasks();
  }
});

function toggleTask(index) {
  if (typeof tasks[index] === 'string') {
    tasks[index] = { text: tasks[index], completed: true, date: '' };
  } else {
    tasks[index].completed = !tasks[index].completed;
  }
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

aiSuggestBtn.addEventListener('click', async () => {
  if (!apiKey) {
    alert('Lütfen önce Gemini API Key alanını doldurun ve kaydedin.');
    return;
  }
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
    
    if (data.error) {
      alert('API Hatası: ' + data.error.message);
      return;
    }
    
    const suggestion = data.candidates[0].content.parts[0].text.trim();
    taskInput.value = suggestion;
  } catch (error) {
    alert('AI önerisi alınırken bir hata oluştu.');
    console.error(error);
  } finally {
    aiLoading.classList.add('hidden');
  }
});

renderTasks();
