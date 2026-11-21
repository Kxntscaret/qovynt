// Central reactive state store for QOVYNT
import { db } from './db.js';
import { auth } from './auth.js';
import { showToast, playAudioFeedback } from './utils.js';

class StateStore {
  constructor() {
    this.currentView = 'overview';
    this.data = {
      profile: null,
      transactions: [],
      tasks: [],
      calendarEvents: [],
      goals: [],
      notes: [],
      projects: [],
      habits: []
    };
    this.listeners = [];
    this.searchQuery = '';
    this.isLoaded = false;
  }

  async init(onProgress) {
    await this.loadAll(onProgress);
    this.isLoaded = true;
    this.notify();
  }

  async loadAll(onProgress) {
    let completed = 0;
    const total = 8;
    const track = (promise, key) => promise.then(val => {
      this.data[key] = val;
      completed++;
      if (onProgress) onProgress(Math.round((completed / total) * 100));
      return val;
    });

    const [profile, txs, tasks, events, goals, notes, projects, habits] = await Promise.all([
      track(db.getProfile(), 'profile'),
      track(db.getCollection('transactions'), 'transactions'),
      track(db.getCollection('tasks'), 'tasks'),
      track(db.getCollection('calendarEvents'), 'calendarEvents'),
      track(db.getCollection('goals'), 'goals'),
      track(db.getCollection('notes'), 'notes'),
      track(db.getCollection('projects'), 'projects'),
      track(db.getCollection('habits'), 'habits')
    ]);

    this.data.profile = profile;
    this.data.transactions = txs;
    this.data.tasks = tasks;
    this.data.calendarEvents = events;
    this.data.goals = goals;
    this.data.notes = notes;
    this.data.projects = projects;
    this.data.habits = habits;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    if (this.isLoaded) listener(this);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this));
  }

  // Clear state in memory on logout
  clearData() {
    this.data = {
      profile: null,
      transactions: [],
      tasks: [],
      calendarEvents: [],
      goals: [],
      notes: [],
      projects: [],
      habits: []
    };
    this.notify();
  }

  // Reload all data for the current user (called on account switch or sign in)
  async reloadForUser() {
    await this.loadAll();
    this.notify();
  }

  setView(viewName) {
    if (this.currentView !== viewName) {
      this.currentView = viewName;
      playAudioFeedback('click');
      this.notify();
      if (window.scrollY > 100) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }

  // Transaction Actions
  async addTransaction(tx) {
    const saved = await db.saveItem('transactions', tx);
    this.data.transactions.unshift(saved);
    showToast(`บันทึก${tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ${tx.title} เรียบร้อย`, 'success');
    this.notify();
    return saved;
  }

  async deleteTransaction(id) {
    await db.deleteItem('transactions', id);
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    showToast('ลบรายการเรียบร้อยแล้ว', 'info');
    this.notify();
  }

  // Task Actions
  async addTask(task) {
    const saved = await db.saveItem('tasks', task);
    this.data.tasks.unshift(saved);
    showToast(`เพิ่มงาน "${task.title}" แล้ว`, 'success');
    this.notify();
    return saved;
  }

  async toggleTask(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.status = task.completed ? 'completed' : 'todo';
      await db.saveItem('tasks', task);
      if (task.completed) {
        showToast(`ทำงาน "${task.title}" เสร็จแล้ว! 🎉`, 'success');
        playAudioFeedback('success');
      }
      this.notify();
    }
  }

  async deleteTask(id) {
    await db.deleteItem('tasks', id);
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    showToast('ลบงานแล้ว', 'info');
    this.notify();
  }

  // Calendar Event Actions
  async addCalendarEvent(ev) {
    const saved = await db.saveItem('calendarEvents', ev);
    this.data.calendarEvents.push(saved);
    showToast(`บันทึกนัดหมาย "${ev.title}" แล้ว`, 'success');
    this.notify();
    return saved;
  }

  async deleteCalendarEvent(id) {
    await db.deleteItem('calendarEvents', id);
    this.data.calendarEvents = this.data.calendarEvents.filter(e => e.id !== id);
    showToast('ลบนัดหมายแล้ว', 'info');
    this.notify();
  }

  // Goal Actions
  async addGoal(goal) {
    const saved = await db.saveItem('goals', goal);
    this.data.goals.unshift(saved);
    showToast(`ตั้งเป้าหมาย "${goal.title}" แล้ว`, 'success');
    this.notify();
    return saved;
  }

  async updateGoalProgress(id, addAmount) {
    const goal = this.data.goals.find(g => g.id === id);
    if (goal) {
      goal.current = Math.min(goal.target, goal.current + Number(addAmount));
      const percent = Math.round((goal.current / goal.target) * 100);
      const remaining = Math.max(0, goal.target - goal.current);
      goal.remainingText = remaining === 0 ? 'สำเร็จตามเป้าหมายแล้ว! 🎉' : `เหลืออีก ${goal.unit === '฿' ? '฿ ' + remaining.toLocaleString() : remaining + ' ' + goal.unit}`;
      await db.saveItem('goals', goal);
      showToast(`อัปเดตเป้าหมาย: ${percent}%`, 'success');
      this.notify();
    }
  }

  async deleteGoal(id) {
    await db.deleteItem('goals', id);
    this.data.goals = this.data.goals.filter(g => g.id !== id);
    showToast('ลบเป้าหมายแล้ว', 'info');
    this.notify();
  }

  // Note Actions
  async addNote(note) {
    note.updatedAt = new Date().toISOString();
    const saved = await db.saveItem('notes', note);
    this.data.notes.unshift(saved);
    showToast(`บันทึกโน้ต "${note.title}" แล้ว`, 'success');
    this.notify();
    return saved;
  }

  async updateNote(note) {
    note.updatedAt = new Date().toISOString();
    const saved = await db.saveItem('notes', note);
    const idx = this.data.notes.findIndex(n => n.id === note.id);
    if (idx >= 0) this.data.notes[idx] = saved;
    showToast('อัปเดตโน้ตเรียบร้อย', 'success');
    this.notify();
  }

  async deleteNote(id) {
    await db.deleteItem('notes', id);
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    showToast('ลบโน้ตแล้ว', 'info');
    this.notify();
  }

  // Project Actions
  async addProject(project) {
    const saved = await db.saveItem('projects', project);
    this.data.projects.unshift(saved);
    showToast(`สร้างโปรเจกต์ "${project.title}" แล้ว`, 'success');
    this.notify();
    return saved;
  }

  async updateProject(project) {
    const saved = await db.saveItem('projects', project);
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) this.data.projects[idx] = saved;
    this.notify();
  }

  async deleteProject(id) {
    await db.deleteItem('projects', id);
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    showToast('ลบโปรเจกต์แล้ว', 'info');
    this.notify();
  }

  // Habit Actions
  async toggleHabit(id) {
    const habit = this.data.habits.find(h => h.id === id);
    if (habit) {
      habit.completedToday = !habit.completedToday;
      if (habit.completedToday) {
        habit.streak += 1;
        playAudioFeedback('success');
      } else {
        habit.streak = Math.max(0, habit.streak - 1);
      }
      await db.saveItem('habits', habit);
      this.notify();
    }
  }

  // Computed Financial Metrics
  getFinancialMetrics() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};

    this.data.transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        const cat = t.category || 'อื่น ๆ';
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
      }
    });

    const balance = totalIncome - totalExpense;
    // Link savings target to active financial goal if available, or fallback to profile
    const financeGoals = (this.data.goals || []).filter(g => !g.unit || g.unit === '฿' || g.category === 'finance');
    const savingsTarget = financeGoals.length > 0 ? Number(financeGoals[0].target) : (this.data.profile?.monthlySavingsTarget || 10000);
    const savingsPercent = Math.min(100, Math.max(0, Math.round((Math.max(0, balance) / savingsTarget) * 100)));

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsTarget,
      savingsPercent,
      categoryExpenses
    };
  }
}

export const state = new StateStore();
