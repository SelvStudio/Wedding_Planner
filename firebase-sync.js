/**
 * REAL-TIME CLOUD & LOCAL SYNC ENGINE
 * Mendukung 2 Mode secara otomatis:
 * 1. Cloud Real-Time Mode (Firebase Realtime Database) -> Sinkron lintas jaringan, perangkat, dan browser yang berbeda secara instan.
 * 2. Local Demo Mode (LocalStorage + BroadcastChannel) -> Langsung berjalan tanpa setup server, sinkron antar-tab di perangkat yang sama.
 */

window.DEFAULT_FIREBASE_CONFIG = {
  // OPSIONAL: Tempelkan objek firebaseConfig Anda di sini sebelum push ke GitHub
  // agar langsung terhubung otomatis untuk semua pengguna tanpa perlu input lewat UI:
  // apiKey: "AIzaSy...",
  // authDomain: "project-id.firebaseapp.com",
  // databaseURL: "https://project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
  // projectId: "project-id",
  // storageBucket: "project-id.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

class WeddingSyncEngine {
  constructor() {
    this.mode = 'local'; // 'firebase' | 'local'
    this.db = null;
    this.auth = null;
    this.workspaceRef = null;
    this.unsubscribeFn = null;
    this.broadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wedding_planner_sync') : null;
    this.currentWorkspaceId = null;
    this.onDataChange = null;
    this.onStatusChange = null;
  }

  getSavedFirebaseConfig() {
    if (window.DEFAULT_FIREBASE_CONFIG && window.DEFAULT_FIREBASE_CONFIG.databaseURL && window.DEFAULT_FIREBASE_CONFIG.apiKey) {
      return window.DEFAULT_FIREBASE_CONFIG;
    }
    try {
      const raw = localStorage.getItem('wp_firebase_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.databaseURL && parsed.apiKey) return parsed;
      }
    } catch (e) {}
    return null;
  }

  saveFirebaseConfig(configObj) {
    localStorage.setItem('wp_firebase_config', JSON.stringify(configObj));
  }

  clearFirebaseConfig() {
    localStorage.removeItem('wp_firebase_config');
  }

  initEngine() {
    const cfg = this.getSavedFirebaseConfig();
    if (cfg && typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        this.db = firebase.database();
        this.auth = firebase.auth ? firebase.auth() : null;
        this.mode = 'firebase';
        this.notifyStatus('cloud', 'Terhubung Real-Time (Firebase Cloud)');
        return true;
      } catch (err) {
        console.warn('Firebase init error, fallback to local mode:', err);
      }
    }
    this.mode = 'local';
    this.notifyStatus('local', 'Mode Demo Lokal (Siap Konfigurasi Cloud)');
    return false;
  }

  notifyStatus(type, label) {
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange({ type, label, mode: this.mode });
    }
  }

  // Subscribe ke workspace secara real-time
  subscribeWorkspace(workspaceId, callback) {
    this.unsubscribe();
    this.currentWorkspaceId = workspaceId;
    this.onDataChange = callback;

    if (this.mode === 'firebase' && this.db) {
      this.workspaceRef = this.db.ref(`workspaces/${workspaceId}`);
      const handler = (snap) => {
        const val = snap.val();
        if (val) {
          localStorage.setItem(`wp_cache_${workspaceId}`, JSON.stringify(val));
          callback(this.normalizeData(val), 'cloud');
        } else {
          callback(null, 'cloud');
        }
      };
      this.workspaceRef.on('value', handler, (err) => {
        console.error('Firebase read error:', err);
        this.notifyStatus('error', 'Gagal sinkron Firebase: ' + err.message);
      });
      this.unsubscribeFn = () => this.workspaceRef.off('value', handler);
    } else {
      // Local Mode + BroadcastChannel listener
      const raw = localStorage.getItem(`wp_workspace_${workspaceId}`);
      if (raw) {
        callback(this.normalizeData(JSON.parse(raw)), 'local');
      } else {
        callback(null, 'local');
      }
      if (this.broadcast) {
        this._bcHandler = (ev) => {
          if (ev.data && ev.data.workspaceId === workspaceId && ev.data.payload) {
            callback(this.normalizeData(ev.data.payload), 'local');
          }
        };
        this.broadcast.addEventListener('message', this._bcHandler);
        this.unsubscribeFn = () => this.broadcast.removeEventListener('message', this._bcHandler);
      }
    }
  }

  unsubscribe() {
    if (typeof this.unsubscribeFn === 'function') {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }

  // Pastikan array tetap rapi saat diambil dari Firebase (yang mengubah array menjadi object map jika ada key)
  normalizeData(data) {
    const arrayKeys = ['checklists', 'budgets', 'expenses', 'guests', 'vendors', 'bookings', 'payments', 'events', 'inspirations', 'rsvps', 'notifications'];
    const copy = JSON.parse(JSON.stringify(data));
    arrayKeys.forEach((k) => {
      if (!copy[k]) {
        copy[k] = [];
      } else if (!Array.isArray(copy[k])) {
        copy[k] = Object.values(copy[k]);
      }
    });
    if (copy.invitation && copy.invitation.gallery && !Array.isArray(copy.invitation.gallery)) {
      copy.invitation.gallery = Object.values(copy.invitation.gallery);
    }
    if (!copy.members) copy.members = {};
    return copy;
  }

  async writeWorkspace(workspaceId, fullData) {
    fullData.meta = fullData.meta || {};
    fullData.meta.updatedAt = new Date().toISOString();

    if (this.mode === 'firebase' && this.db) {
      await this.db.ref(`workspaces/${workspaceId}`).set(fullData);
      if (fullData.invitation && fullData.invitation.slug) {
        await this.db.ref(`invitationSlugs/${fullData.invitation.slug}`).set(workspaceId);
      }
    } else {
      localStorage.setItem(`wp_workspace_${workspaceId}`, JSON.stringify(fullData));
      if (fullData.invitation && fullData.invitation.slug) {
        localStorage.setItem(`wp_slug_${fullData.invitation.slug}`, workspaceId);
      }
      if (this.broadcast) {
        this.broadcast.postMessage({ workspaceId, payload: fullData });
      }
      if (typeof this.onDataChange === 'function' && this.currentWorkspaceId === workspaceId) {
        this.onDataChange(this.normalizeData(fullData), 'local');
      }
    }
  }

  async findWorkspaceBySlug(slug) {
    if (this.mode === 'firebase' && this.db) {
      const snap = await this.db.ref(`invitationSlugs/${slug}`).once('value');
      return snap.val();
    }
    return localStorage.getItem(`wp_slug_${slug}`);
  }

  async checkWorkspaceExists(workspaceId) {
    if (this.mode === 'firebase' && this.db) {
      const snap = await this.db.ref(`workspaces/${workspaceId}/meta`).once('value');
      return snap.exists();
    }
    return Boolean(localStorage.getItem(`wp_workspace_${workspaceId}`));
  }

  async submitPublicRsvp(workspaceId, rsvpItem, notifItem) {
    if (this.mode === 'firebase' && this.db) {
      const rsvpsSnap = await this.db.ref(`workspaces/${workspaceId}/rsvps`).once('value');
      const existing = rsvpsSnap.val();
      const list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];
      list.unshift(rsvpItem);
      await this.db.ref(`workspaces/${workspaceId}/rsvps`).set(list);

      const notifSnap = await this.db.ref(`workspaces/${workspaceId}/notifications`).once('value');
      const nExisting = notifSnap.val();
      const nList = nExisting ? (Array.isArray(nExisting) ? nExisting : Object.values(nExisting)) : [];
      nList.unshift(notifItem);
      await this.db.ref(`workspaces/${workspaceId}/notifications`).set(nList);
      return true;
    } else {
      const raw = localStorage.getItem(`wp_workspace_${workspaceId}`);
      if (!raw) return false;
      const data = this.normalizeData(JSON.parse(raw));
      data.rsvps.unshift(rsvpItem);
      data.notifications.unshift(notifItem);
      await this.writeWorkspace(workspaceId, data);
      return true;
    }
  }
}

window.syncEngine = new WeddingSyncEngine();
