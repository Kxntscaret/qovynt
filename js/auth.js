// Authentication manager supporting Google OAuth, Supabase Auth, and Offline/Guest mode
import { db } from './db.js';
import { showToast } from './utils.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.loadSession();
  }

  loadSession() {
    const raw = localStorage.getItem('qovynt_session');
    if (raw) {
      try {
        this.currentUser = JSON.parse(raw);
      } catch (e) {
        this.currentUser = null;
      }
    } else {
      // Default demo session is active so the user sees the dashboard immediately!
      this.currentUser = {
        id: 'user_default',
        name: 'Poom',
        email: 'poom@qovynt.space',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'guest'
      };
      localStorage.setItem('qovynt_session', JSON.stringify(this.currentUser));
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  // Google OAuth Sign In
  async signInWithGoogle() {
    if (db.isCloudActive && db.supabase) {
      const { data, error } = await db.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) {
        showToast(`Google Login Error: ${error.message}`, 'error');
        return false;
      }
      return true;
    }

    // Interactive Demo Google Sign In
    const googleUser = {
      id: 'google_' + Date.now(),
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      provider: 'google'
    };
    this.currentUser = googleUser;
    localStorage.setItem('qovynt_session', JSON.stringify(googleUser));
    showToast('เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
    this.notify();
    return true;
  }

  // Email / Password Sign In
  async signInWithPassword(email, password) {
    if (db.isCloudActive && db.supabase) {
      const { data, error } = await db.supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        avatar: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        provider: 'supabase'
      };
      this.currentUser = user;
      localStorage.setItem('qovynt_session', JSON.stringify(user));
      showToast(`ยินดีต้อนรับกลับ, ${user.name}`, 'success');
      this.notify();
      return true;
    }

    // Local / Demo Email Sign In
    if (!email || !password) {
      showToast('กรุณากรอกอีเมลและรหัสผ่าน', 'warning');
      return false;
    }

    const localUser = {
      id: 'user_' + btoa(email).substring(0, 8),
      name: email.split('@')[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
      provider: 'local'
    };
    this.currentUser = localUser;
    localStorage.setItem('qovynt_session', JSON.stringify(localUser));
    showToast(`เข้าสู่ระบบสำเร็จ! สวัสดี ${localUser.name}`, 'success');
    this.notify();
    return true;
  }

  // Email / Password Sign Up
  async signUp(email, password, fullName = '') {
    if (db.isCloudActive && db.supabase) {
      const { data, error } = await db.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
      showToast('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลยืนยัน (หากเปิดใช้งาน)', 'success');
      return true;
    }

    // Local registration
    const newUser = {
      id: 'user_' + Date.now(),
      name: fullName || email.split('@')[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
      provider: 'local'
    };
    this.currentUser = newUser;
    localStorage.setItem('qovynt_session', JSON.stringify(newUser));
    showToast(`ลงทะเบียนและเข้าสู่ระบบเรียบร้อย! ยินดีต้อนรับสู่ QOVYNT`, 'success');
    this.notify();
    return true;
  }

  // Quick Demo / Guest
  loginAsGuest() {
    this.currentUser = {
      id: 'user_default',
      name: 'Poom',
      email: 'poom@qovynt.space',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'guest'
    };
    localStorage.setItem('qovynt_session', JSON.stringify(this.currentUser));
    showToast('เข้าสู่ระบบแบบ Demo แล้ว', 'success');
    this.notify();
  }

  // Sign Out
  async signOut() {
    if (db.isCloudActive && db.supabase) {
      try {
        await db.supabase.auth.signOut();
      } catch (e) {}
    }
    this.currentUser = null;
    localStorage.removeItem('qovynt_session');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    this.notify();
  }
}

export const auth = new AuthManager();
