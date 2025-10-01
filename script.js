// script.js - Modern To-Do List App
// Author: GitHub Copilot
// All main logic for task CRUD, filtering, search, localStorage, UI, and dark mode

// --- Data Model ---
const STORAGE_KEY = 'todo_tasks_v1';

let tasks = [];
let filter = 'all';
let searchQuery = '';
let darkMode = false;
let editingId = null;

// --- DOM Elements ---
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskDesc = document.getElementById('task-desc');
const taskDue = document.getElementById('task-due');
const taskPriority = document.getElementById('task-priority');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search');
const clearCompletedBtn = document.getElementById('clear-completed');
const resetAllBtn = document.getElementById('reset-all');
const themeToggleBtn = document.getElementById('theme-toggle');

// --- Utility Functions ---
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function loadTasks() {
  const data = localStorage.getItem(STORAGE_KEY);
  tasks = data ? JSON.parse(data) : [];
}
function saveTheme() {
  localStorage.setItem('todo_theme', darkMode ? 'dark' : 'light');
}
function loadTheme() {
  darkMode = localStorage.getItem('todo_theme') === 'dark';
  document.body.classList.toggle('dark', darkMode);
  themeToggleBtn.textContent = darkMode ? '☀️' : '🌙';
}
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}
function isOverdue(due, completed) {
  if (!due || completed) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return new Date(due) < today;
}

// --- Rendering ---
function renderTasks() {
  taskList.innerHTML = '';
  let filtered = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'active') return !task.completed;
    return true;
  });
  if (searchQuery) {
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchQuery) ||
      (task.desc && task.desc.toLowerCase().includes(searchQuery))
    );
  }
  if (filtered.length === 0) {
    taskList.innerHTML = '<li style="text-align:center;color:#888;">No tasks found.</li>';
    return;
  }
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '') + (isOverdue(task.due, task.completed) ? ' overdue' : '');
    li.setAttribute('draggable', 'true');
    li.dataset.id = task.id;
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleComplete(task.id));
    // Content
    const content = document.createElement('div');
    content.className = 'task-content';
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    content.appendChild(title);
    if (task.desc) {
      const desc = document.createElement('div');
      desc.className = 'task-desc';
      desc.textContent = task.desc;
      content.appendChild(desc);
    }
    // Meta
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    // Priority
    const prio = document.createElement('span');
    prio.className = 'task-priority priority-' + task.priority;
    prio.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    meta.appendChild(prio);
    // Due date
    if (task.due) {
      const due = document.createElement('span');
      due.textContent = 'Due: ' + task.due;
      if (isOverdue(task.due, task.completed)) due.style.color = 'var(--overdue)';
      meta.appendChild(due);
    }
    content.appendChild(meta);
    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    // Edit
    const editBtn = document.createElement('button');
    editBtn.title = 'Edit';
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => editTask(task.id);
    actions.appendChild(editBtn);
    // Delete
    const delBtn = document.createElement('button');
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => deleteTask(task.id);
    actions.appendChild(delBtn);
    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);
    // Drag events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);
    taskList.appendChild(li);
  });
}

// --- CRUD Operations ---
function addTask(e) {
  e.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;
  const desc = taskDesc.value.trim();
  const due = taskDue.value;
  const priority = taskPriority.value;
  if (editingId) {
    // Update existing task
    const t = tasks.find(t => t.id === editingId);
    if (t) {
      t.title = title;
      t.desc = desc;
      t.due = due;
      t.priority = priority;
    }
    editingId = null;
  } else {
    // Add new task
    tasks.unshift({
      id: generateId(),
      title,
      desc,
      due,
      priority,
      completed: false,
      created: new Date().toISOString()
    });
  }
  saveTasks();
  renderTasks();
  taskForm.reset();
  taskForm.querySelector('button[type="submit"]').textContent = 'Add';
}
function toggleComplete(id) {
  const t = tasks.find(t => t.id === id);
  if (t) t.completed = !t.completed;
  saveTasks();
  renderTasks();
}
function editTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  // Prefill form
  taskTitle.value = t.title;
  taskDesc.value = t.desc || '';
  taskDue.value = t.due || '';
  taskPriority.value = t.priority || 'low';
  editingId = id;
  taskForm.querySelector('button[type="submit"]').textContent = 'Save';
  taskForm.scrollIntoView({behavior:'smooth'});
}
function deleteTask(id) {
  const li = document.querySelector(`li[data-id='${id}']`);
  if (li) {
    li.style.animation = 'fadeOut 0.4s';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, 350);
  }
}
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}
function resetAll() {
  if (confirm('Are you sure you want to delete ALL tasks?')) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
}

// --- Filtering & Search ---
filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    renderTasks();
  };
});
searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderTasks();
});

// --- Drag & Drop ---
let dragSrcId = null;
function handleDragStart(e) {
  dragSrcId = this.dataset.id;
  this.style.opacity = '0.5';
}
function handleDragOver(e) {
  e.preventDefault();
  this.style.boxShadow = '0 0 0 2px var(--primary)';
}
function handleDrop(e) {
  e.preventDefault();
  this.style.boxShadow = '';
  const targetId = this.dataset.id;
  if (dragSrcId && dragSrcId !== targetId) {
    const srcIdx = tasks.findIndex(t => t.id === dragSrcId);
    const tgtIdx = tasks.findIndex(t => t.id === targetId);
    if (srcIdx > -1 && tgtIdx > -1) {
      const [moved] = tasks.splice(srcIdx, 1);
      tasks.splice(tgtIdx, 0, moved);
      saveTasks();
      renderTasks();
    }
  }
  dragSrcId = null;
}
function handleDragEnd(e) {
  this.style.opacity = '';
  this.style.boxShadow = '';
}

// --- Theme Toggle ---
themeToggleBtn.onclick = () => {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  themeToggleBtn.textContent = darkMode ? '☀️' : '🌙';
  saveTheme();
};

// --- Event Listeners ---
taskForm.addEventListener('submit', addTask);
clearCompletedBtn.onclick = clearCompleted;
resetAllBtn.onclick = resetAll;

// --- Initialization ---
loadTheme();
loadTasks();
renderTasks();

// --- Sample Data (for first time) ---
if (tasks.length === 0) {
  tasks = [
    { id: generateId(), title: 'Welcome to your To-Do List!', desc: 'Add, edit, complete, and organize your tasks.', due: '', priority: 'medium', completed: false, created: new Date().toISOString() },
    { id: generateId(), title: 'Try Dark/Light Mode', desc: 'Click the moon/sun icon in the header.', due: '', priority: 'low', completed: false, created: new Date().toISOString() },
    { id: generateId(), title: 'Drag & drop to reorder', desc: '', due: '', priority: 'high', completed: false, created: new Date().toISOString() }
  ];
  saveTasks();
  renderTasks();
}
