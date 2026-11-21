// Database persistence layer: Supabase Cloud + LocalStorage / IndexedDB fallback
import { CONFIG } from './config.js';
import { uuidv4 } from './utils.js';

// Default Seed Data based directly on the user's design reference
const DEFAULT_SEED = {
  profile: {
    id: 'user_default',
    name: 'Poom',
    title: 'Developer & Creator',
    email: 'poom@qovynt.space',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    quote: 'ทุกก้าวเล็ก ๆ คือความสำเร็จที่ยิ่งใหญ่',
    monthlySavingsTarget: 10000
  },
  transactions: [
    {
      id: 'tx_1',
      title: 'ค่าอาหาร (ร้านข้าว)',
      amount: 120,
      type: 'expense',
      category: 'อาหาร',
      date: '2026-11-21T12:30:00',
      note: 'ข้าวผัดกะเพราไข่ดาว'
    },
    {
      id: 'tx_2',
      title: 'เงินจากครอบครัว',
      amount: 3000,
      type: 'income',
      category: 'เงินจากครอบครัว',
      date: '2026-11-21T09:00:00',
      note: 'ค่าใช้จ่ายประจำเดือน'
    },
    {
      id: 'tx_3',
      title: 'ค่าเดินทาง (รถเมล์/BTS)',
      amount: 50,
      type: 'expense',
      category: 'เดินทาง',
      date: '2026-11-20T18:20:00',
      note: 'เดินทางกลับบ้าน'
    },
    {
      id: 'tx_4',
      title: 'ค่าช็อปปิ้ง (ของใช้)',
      amount: 350,
      type: 'expense',
      category: 'ช้อปปิ้ง',
      date: '2026-11-20T15:45:00',
      note: 'สบู่ ยาสระผม ปากกา'
    },
    {
      id: 'tx_5',
      title: 'ค่าอินเทอร์เน็ต',
      amount: 590,
      type: 'expense',
      category: 'อื่น ๆ',
      date: '2026-11-19T20:15:00',
      note: 'แพ็กเกจไฟเบอร์รายเดือน'
    },
    {
      id: 'tx_6',
      title: 'รับงานฟรีแลนซ์ออกแบบ UI',
      amount: 9500,
      type: 'income',
      category: 'งานพิเศษ/ฟรีแลนซ์',
      date: '2026-11-15T14:00:00',
      note: 'โปรเจกต์ Dashboard'
    },
    {
      id: 'tx_7',
      title: 'คอร์สเรียนออนไลน์ Web Dev',
      amount: 1200,
      type: 'expense',
      category: 'การเรียน',
      date: '2026-11-10T11:00:00',
      note: 'Full-stack course'
    },
    {
      id: 'tx_8',
      title: 'ตั๋วชมภาพยนตร์ IMAX',
      amount: 450,
      type: 'expense',
      category: 'บันเทิง',
      date: '2026-11-08T19:30:00',
      note: 'ดูหนังกะเพื่อน'
    },
    {
      id: 'tx_9',
      title: 'ค่าอาหารชาบูกับเพื่อน',
      amount: 890,
      type: 'expense',
      category: 'อาหาร',
      date: '2026-11-05T20:00:00',
      note: 'ฉลองปิดโปรเจกต์'
    },
    {
      id: 'tx_10',
      title: 'ค่าขนมและกาแฟ',
      amount: 600,
      type: 'expense',
      category: 'อาหาร',
      date: '2026-11-02T16:00:00',
      note: 'เครื่องดื่ม'
    }
  ],
  tasks: [
    {
      id: 'task_1',
      title: 'ส่งรายงานวิชาคอมพิวเตอร์',
      category: 'เรียน',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-11-23',
      completed: false
    },
    {
      id: 'task_2',
      title: 'ออกกำลังกาย 45 นาที',
      category: 'สุขภาพ',
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-11-21',
      completed: false
    },
    {
      id: 'task_3',
      title: 'อ่านหนังสือ 30 นาที',
      category: 'พัฒนาตัวเอง',
      priority: 'low',
      status: 'todo',
      dueDate: '2026-11-21',
      completed: false
    },
    {
      id: 'task_4',
      title: 'สรุปค่าใช้จ่ายประจำเดือน',
      category: 'การเงิน',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-11-21',
      completed: false
    },
    {
      id: 'task_5',
      title: 'ประชุมโปรเจกต์กลุ่ม',
      category: 'งาน',
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-11-22',
      completed: false
    },
    {
      id: 'task_6',
      title: 'อัปเดตพอร์ตโฟลิโอบน GitHub',
      category: 'งาน',
      priority: 'medium',
      status: 'completed',
      dueDate: '2026-11-20',
      completed: true
    }
  ],
  calendarEvents: [
    {
      id: 'ev_1',
      title: 'ส่งรายงานวิชาคอมพิวเตอร์',
      startTime: '09:00',
      endTime: '10:00',
      date: '2026-11-21',
      category: 'เรียน',
      color: 'purple'
    },
    {
      id: 'ev_2',
      title: 'เรียนออนไลน์',
      startTime: '13:00',
      endTime: '15:00',
      date: '2026-11-21',
      category: 'เรียน',
      color: 'cyan'
    },
    {
      id: 'ev_3',
      title: 'ว่าง / พักผ่อน',
      startTime: '16:00',
      endTime: '17:00',
      date: '2026-11-21',
      category: 'พักผ่อน',
      color: 'green'
    },
    {
      id: 'ev_4',
      title: 'ออกกำลังกาย',
      startTime: '18:00',
      endTime: '19:00',
      date: '2026-11-21',
      category: 'สุขภาพ',
      color: 'rose'
    },
    {
      id: 'ev_5',
      title: 'อ่านหนังสือ',
      startTime: '20:00',
      endTime: '21:00',
      date: '2026-11-21',
      category: 'พัฒนาตัวเอง',
      color: 'amber'
    }
  ],
  goals: [
    {
      id: 'goal_1',
      title: 'ซื้อโน้ตบุ๊กใหม่',
      current: 8000,
      target: 20000,
      unit: '฿',
      remainingText: 'เหลืออีก ฿ 12,000',
      icon: 'laptop',
      color: 'purple',
      category: 'finance'
    },
    {
      id: 'goal_2',
      title: 'ออกกำลังกายสม่ำเสมอ',
      current: 45,
      target: 75,
      unit: 'วัน',
      remainingText: 'เหลืออีก 30 วัน',
      icon: 'dumbbell',
      color: 'green',
      category: 'health'
    },
    {
      id: 'goal_3',
      title: 'อ่านหนังสือ 12 เล่ม/ปี',
      current: 4,
      target: 12,
      unit: 'เล่ม',
      remainingText: 'เหลืออีก 8 เล่ม',
      icon: 'book-open',
      color: 'cyan',
      category: 'learning'
    },
    {
      id: 'goal_4',
      title: 'เก็บเงิน 10,000 บาท',
      current: 6500,
      target: 10000,
      unit: '฿',
      remainingText: 'เหลืออีก ฿ 3,500',
      icon: 'piggy-bank',
      color: 'pink',
      category: 'finance'
    }
  ],
  notes: [
    {
      id: 'note_1',
      title: 'ไอเดียพัฒนาเว็บไซต์',
      content: `- เพิ่มระบบแจ้งเตือน (Notifications)\n- เชื่อมต่อกับ API ธนาคาร\n- ทำแอปมือถือ (PWA)\n- โหมดเปรียบเทียบสถิติรายปี`,
      updatedAt: '2026-11-21T14:20:00',
      color: 'amber',
      isPinned: true
    },
    {
      id: 'note_2',
      title: 'หนังสือที่อยากอ่านในไตรมาสนี้',
      content: `1. Atomic Habits - James Clear\n2. The Psychology of Money - Morgan Housel\n3. Designing Data-Intensive Applications`,
      updatedAt: '2026-11-19T10:00:00',
      color: 'purple',
      isPinned: false
    },
    {
      id: 'note_3',
      title: 'เป้าหมายและสิ่งที่ได้เรียนรู้สัปดาห์นี้',
      content: `เรียนรู้การใช้งาน Supabase Auth, Row Level Security และ Tailwind CSS สำหรับการทำ Dashboard ระดับมืออาชีพ`,
      updatedAt: '2026-11-18T16:30:00',
      color: 'cyan',
      isPinned: false
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Personal Website',
      description: 'พัฒนา Dashboard จัดการชีวิต QOVYNT สไตล์ Cyberpunk/Glassmorphic',
      stage: 'พัฒนา UI',
      progress: 70,
      color: 'purple',
      category: 'Web Dev'
    },
    {
      id: 'proj_2',
      title: 'Study Tracker',
      description: 'ระบบติดตามการเรียนและเนื้อหาสอบ',
      stage: 'ออกแบบฐานข้อมูล',
      progress: 40,
      color: 'green',
      category: 'Education'
    },
    {
      id: 'proj_3',
      title: 'Game Project',
      description: 'เกม 2D Pixel Art พัฒนาด้วย Godot/HTML5 Canvas',
      stage: 'เขียนโค้ด',
      progress: 25,
      color: 'rose',
      category: 'Gaming'
    }
  ],
  habits: [
    { id: 'hab_1', title: 'ดื่มน้ำ 2 ลิตร', streak: 8, completedToday: true, icon: 'droplet' },
    { id: 'hab_2', title: 'อ่านหนังสือ 20 หน้า', streak: 5, completedToday: false, icon: 'book' },
    { id: 'hab_3', title: 'นอนก่อนเที่ยงคืน', streak: 3, completedToday: false, icon: 'moon' },
    { id: 'hab_4', title: 'ออกกำลังกาย', streak: 12, completedToday: true, icon: 'activity' }
  ]
};

class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.isCloudActive = false;
    this.currentUserId = null;
    this.initSupabase();
  }

  // Set current user for per-user data isolation
  setCurrentUser(userId) {
    this.currentUserId = userId || null;
  }

  // Per-user storage key (strictly isolated per user ID)
  _getStorageKey(name) {
    if (this.currentUserId) {
      return CONFIG.STORAGE_KEY_PREFIX + this.currentUserId + '_' + name;
    }
    return CONFIG.STORAGE_KEY_PREFIX + 'guest_' + name;
  }

  initSupabase() {
    const url = CONFIG.SUPABASE.URL || localStorage.getItem('qovynt_supabase_url');
    const key = CONFIG.SUPABASE.ANON_KEY || localStorage.getItem('qovynt_supabase_key');

    if (window.supabase && url && key) {
      try {
        this.supabase = window.supabase.createClient(url, key);
        this.isCloudActive = true;
        console.log('QOVYNT: Connected to Supabase Cloud Database');
      } catch (err) {
        console.warn('Supabase init failed, falling back to local DB:', err);
        this.isCloudActive = false;
      }
    } else {
      this.isCloudActive = false;
    }
  }

  // Retrieve whole collection
  async getCollection(name) {
    if (!this.currentUserId) {
      return [];
    }

    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from(name)
          .select('*')
          .eq('user_id', this.currentUserId);
        if (!error && Array.isArray(data)) return data;
      } catch (e) {
        console.warn(`Supabase get error for ${name}, falling back to local`, e);
      }
    }

    // Local fallback - strictly isolated for this user
    const key = this._getStorageKey(name);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        // Only return items created by this specific user
        return items.filter(item => item.user_id === this.currentUserId);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Save item in collection
  async saveItem(collectionName, item) {
    if (!item.id) {
      item.id = uuidv4();
    }
    // Tag item with current user ID
    if (this.currentUserId) {
      item.user_id = this.currentUserId;
    }

    if (this.isCloudActive && this.supabase && this.currentUserId) {
      try {
        await this.supabase.from(collectionName).upsert(item);
      } catch (e) {
        console.warn('Cloud save error', e);
      }
    }

    // Always update local cache
    if (this.currentUserId) {
      const key = this._getStorageKey(collectionName);
      let items = await this.getCollection(collectionName);
      const index = items.findIndex(i => i.id === item.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...item };
      } else {
        items.unshift(item);
      }
      localStorage.setItem(key, JSON.stringify(items));
    }
    return item;
  }

  // Delete item from collection
  async deleteItem(collectionName, id) {
    if (this.isCloudActive && this.supabase && this.currentUserId) {
      try {
        await this.supabase.from(collectionName).delete().eq('id', id).eq('user_id', this.currentUserId);
      } catch (e) {
        console.warn('Cloud delete error', e);
      }
    }

    if (this.currentUserId) {
      const key = this._getStorageKey(collectionName);
      let items = await this.getCollection(collectionName);
      items = items.filter(i => i.id !== id);
      localStorage.setItem(key, JSON.stringify(items));
    }
    return true;
  }

  // Get current user profile
  async getProfile() {
    const raw = localStorage.getItem(this._getStorageKey('profile'));
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    // New user: minimal empty profile
    return {
      id: 'user_default',
      name: '',
      title: '',
      email: '',
      avatar: '',
      quote: '',
      monthlySavingsTarget: 10000
    };
  }

  async saveProfile(profile) {
    localStorage.setItem(this._getStorageKey('profile'), JSON.stringify(profile));
    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('profiles').upsert(profile);
      } catch (e) {}
    }
    return profile;
  }

  // Reset to original seed data
  resetAll() {
    Object.keys(DEFAULT_SEED).forEach(name => {
      localStorage.setItem(this._getStorageKey(name), JSON.stringify(DEFAULT_SEED[name]));
    });
  }

  // Export all data as JSON
  exportJSON() {
    const dump = {};
    Object.keys(DEFAULT_SEED).forEach(name => {
      const raw = localStorage.getItem(this._getStorageKey(name));
      dump[name] = raw ? JSON.parse(raw) : DEFAULT_SEED[name];
    });
    return JSON.stringify(dump, null, 2);
  }

  // Import JSON
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      Object.keys(parsed).forEach(name => {
        localStorage.setItem(this._getStorageKey(name), JSON.stringify(parsed[name]));
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const db = new DatabaseManager();
