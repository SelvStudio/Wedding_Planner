/**
 * WEDDING PLANNER - CORE APPLICATION LOGIC
 * Luxury Elegant SaaS Multi-Workspace Real-Time Web App
 */

const App = {
  state: {
    view: 'landing', // 'landing' | 'auth' | 'app' | 'public_invitation'
    activePage: 'dashboard',
    authTab: 'login', // 'login' | 'register' | 'join'
    user: null,
    workspaceId: null,
    workspaceData: null,
    charts: {},
    calendarInstance: null,
    filters: {
      checklistCategory: 'ALL',
      checklistStatus: 'ALL',
      checklistSearch: '',
      guestCategory: 'ALL',
      guestRsvp: 'ALL',
      guestSearch: '',
      vendorCategory: 'ALL',
      vendorSearch: '',
      inspirationCategory: 'ALL'
    }
  },

  init() {
    window.syncEngine.onStatusChange = (status) => this.renderSyncBadge(status);
    window.syncEngine.initEngine();

    // Cek Parameter URL (?invitation=slug atau ?join=workspaceId)
    const params = new URLSearchParams(window.location.search);
    const invSlug = params.get('invitation');
    const joinWs = params.get('join');

    if (invSlug) {
      this.openPublicInvitationBySlug(invSlug, params.get('ws'));
      return;
    }

    // Cek sesi pengguna tersimpan
    const savedSession = this.getSavedSession();
    if (joinWs) {
      if (savedSession && savedSession.user) {
        this.joinWorkspaceFlow(savedSession.user, joinWs);
      } else {
        this.state.pendingJoinWs = joinWs;
        this.switchView('auth', 'join');
      }
      return;
    }

    if (savedSession && savedSession.user && savedSession.workspaceId) {
      this.state.user = savedSession.user;
      this.connectWorkspace(savedSession.workspaceId);
    } else {
      this.switchView('landing');
    }

    this.bindGlobalEvents();
  },

  bindGlobalEvents() {
    // Tutup dropdown notifikasi saat klik luar
    document.addEventListener('click', (e) => {
      const dd = document.getElementById('notif-dropdown');
      const btn = document.getElementById('notif-btn');
      if (dd && !dd.classList.contains('hidden') && !dd.contains(e.target) && btn && !btn.contains(e.target)) {
        dd.classList.add('hidden');
      }
    });
  },

  getSavedSession() {
    try {
      const raw = localStorage.getItem('wp_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  saveSession(user, workspaceId) {
    this.state.user = user;
    this.state.workspaceId = workspaceId;
    localStorage.setItem('wp_session', JSON.stringify({ user, workspaceId }));
  },

  logout() {
    window.syncEngine.unsubscribe();
    localStorage.removeItem('wp_session');
    this.state.user = null;
    this.state.workspaceId = null;
    this.state.workspaceData = null;
    this.switchView('landing');
    this.toast('Anda berhasil keluar dari workspace.', 'info');
  },

  // --- VIEW SWITCHER ---
  switchView(viewName, subTab) {
    this.state.view = viewName;
    ['view-landing', 'view-auth', 'view-app', 'view-public-invitation'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`view-${viewName === 'public_invitation' ? 'public-invitation' : viewName}`);
    if (target) target.classList.remove('hidden');

    if (viewName === 'auth' && subTab) {
      this.switchAuthTab(subTab);
    }
    if (viewName === 'app') {
      this.navigatePage(this.state.activePage || 'dashboard');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.scrollTo(0, 0);
  },

  switchAuthTab(tab) {
    this.state.authTab = tab;
    ['login', 'register', 'join'].forEach((t) => {
      const panel = document.getElementById(`auth-panel-${t}`);
      const btn = document.getElementById(`auth-tab-${t}`);
      if (panel) panel.classList.toggle('hidden', t !== tab);
      if (btn) {
        btn.className = t === tab
          ? 'flex-1 py-2.5 text-sm font-medium rounded-lg bg-[#C5A46D] text-white shadow'
          : 'flex-1 py-2.5 text-sm font-medium rounded-lg text-[#6E5F53] hover:bg-[#F8F5EF]';
      }
    });
    if (tab === 'join' && this.state.pendingJoinWs) {
      const inp = document.getElementById('join-ws-code');
      if (inp) inp.value = this.state.pendingJoinWs;
    }
  },

  // --- AUTHENTICATION & WORKSPACE CONNECTION ---
  handleDemoLogin() {
    const demoUser = {
      uid: 'usr_demo_owner',
      name: 'Raka Pratama',
      email: 'raka.nabila@weddingplanner.id',
      phone: '081234567890',
      role: 'Owner'
    };
    const demoWsId = 'WP-DEMO-2026';
    this.saveSession(demoUser, demoWsId);
    this.connectWorkspace(demoWsId, true, demoUser);
    this.toast('Selamat datang di Workspace Demo Pernikahan!', 'success');
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const groom = document.getElementById('reg-groom').value.trim() || name;
    const bride = document.getElementById('reg-bride').value.trim() || 'Pasangan';

    if (password.length < 6) return this.toast('Password minimal 6 karakter.', 'error');
    if (password !== confirm) return this.toast('Konfirmasi password tidak cocok.', 'error');

    const uid = 'usr_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const wsId = 'WP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const user = { uid, name, email, phone, role: 'Owner' };

    // Simpan akun lokal untuk validasi login sederhana
    const accounts = JSON.parse(localStorage.getItem('wp_accounts') || '{}');
    accounts[email] = { ...user, passwordHash: btoa(password), workspaceId: wsId };
    localStorage.setItem('wp_accounts', JSON.stringify(accounts));

    const initialData = window.createDefaultWorkspaceData(wsId, user, { groom, bride });
    await window.syncEngine.writeWorkspace(wsId, initialData);
    this.saveSession(user, wsId);
    this.connectWorkspace(wsId);
    this.toast(`Workspace ${wsId} berhasil dibuat!`, 'success');
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const wsCodeInput = document.getElementById('login-ws-code').value.trim().toUpperCase();

    if (email === 'raka.nabila@weddingplanner.id' && password === '123456') {
      return this.handleDemoLogin();
    }

    const accounts = JSON.parse(localStorage.getItem('wp_accounts') || '{}');
    const acc = accounts[email];

    if (acc) {
      if (acc.passwordHash !== btoa(password)) {
        return this.toast('Password salah. Silakan periksa kembali.', 'error');
      }
      const targetWs = wsCodeInput || acc.workspaceId;
      const user = { uid: acc.uid, name: acc.name, email: acc.email, phone: acc.phone, role: acc.role || 'Owner' };
      this.saveSession(user, targetWs);
      this.connectWorkspace(targetWs);
      this.toast('Login berhasil!', 'success');
    } else if (wsCodeInput) {
      // Login lintas perangkat menggunakan Kode Workspace jika belum ada di cache browser ini
      const exists = await window.syncEngine.checkWorkspaceExists(wsCodeInput);
      if (!exists) {
        return this.toast('Kode Workspace tidak ditemukan di database aktif.', 'error');
      }
      const uid = 'usr_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      const user = { uid, name: email.split('@')[0], email, phone: '', role: 'Partner' };
      this.saveSession(user, wsCodeInput);
      this.connectWorkspace(wsCodeInput);
      this.toast(`Berhasil masuk ke Workspace ${wsCodeInput}!`, 'success');
    } else {
      this.toast('Akun tidak ditemukan di perangkat ini. Masukkan Kode Workspace Anda atau daftar akun baru.', 'error');
    }
  },

  async handleJoinWorkspace(e) {
    e.preventDefault();
    const wsCode = document.getElementById('join-ws-code').value.trim().toUpperCase();
    const name = document.getElementById('join-name').value.trim();
    const email = document.getElementById('join-email').value.trim().toLowerCase();

    if (!wsCode || !name || !email) return this.toast('Lengkapi semua kolom undangan.', 'error');
    const exists = await window.syncEngine.checkWorkspaceExists(wsCode);
    if (!exists) {
      return this.toast(`Workspace "${wsCode}" tidak ditemukan. Pastikan mode sinkronisasi (Cloud/Lokal) sesuai.`, 'error');
    }

    const uid = 'usr_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const user = { uid, name, email, phone: '', role: 'Partner' };
    await this.joinWorkspaceFlow(user, wsCode);
  },

  async joinWorkspaceFlow(user, wsCode) {
    this.saveSession(user, wsCode);
    this.connectWorkspace(wsCode, false, user, true);
    this.toast(`Berhasil bergabung ke Workspace ${wsCode} sebagai Partner!`, 'success');
  },

  connectWorkspace(workspaceId, createIfMissing = false, userObj = null, registerAsPartner = false) {
    this.state.workspaceId = workspaceId;
    this.switchView('app');

    window.syncEngine.subscribeWorkspace(workspaceId, async (data) => {
      if (!data) {
        if (createIfMissing || workspaceId === 'WP-DEMO-2026') {
          const seed = window.createDefaultWorkspaceData(workspaceId, userObj || this.state.user);
          await window.syncEngine.writeWorkspace(workspaceId, seed);
          return;
        }
        this.toast('Data workspace belum tersedia atau telah dihapus.', 'error');
        return;
      }

      // Auto-evaluasi status Overdue checklist berdasarkan tanggal hari ini
      this.applyAutoOverdue(data);

      // Daftarkan partner ke members jika bergabung via invite link
      if (registerAsPartner && this.state.user && data.members && !data.members[this.state.user.uid]) {
        registerAsPartner = false;
        data.members[this.state.user.uid] = {
          uid: this.state.user.uid,
          name: this.state.user.name,
          email: this.state.user.email,
          role: 'Partner',
          joinedAt: new Date().toISOString()
        };
        data.notifications.unshift({
          id: 'ntf_' + Date.now(),
          title: 'Pasangan Bergabung!',
          message: `${this.state.user.name} bergabung ke workspace untuk berkolaborasi real-time.`,
          type: 'workspace',
          read: false,
          createdAt: new Date().toISOString()
        });
        await window.syncEngine.writeWorkspace(workspaceId, data);
        return;
      }

      this.state.workspaceData = data;
      this.renderHeaderAndSidebar();
      this.renderActivePage();
    });
  },

  applyAutoOverdue(data) {
    const today = new Date().toISOString().split('T')[0];
    if (!data.checklists) return;
    data.checklists.forEach((c) => {
      if (c.status !== 'Completed' && c.dueDate && c.dueDate < today) {
        c.status = 'Overdue';
      }
    });
  },

  async persistData(successMsg = null) {
    if (!this.state.workspaceId || !this.state.workspaceData) return;
    await window.syncEngine.writeWorkspace(this.state.workspaceId, this.state.workspaceData);
    if (successMsg) this.toast(successMsg, 'success');
  },

  // --- NAVIGATION ---
  navigatePage(page) {
    this.state.activePage = page;
    document.querySelectorAll('.app-section').forEach((sec) => sec.classList.add('hidden'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    const titles = {
      dashboard: ['Dashboard Wedding Planner', 'Ringkasan persiapan pernikahan secara real-time'],
      profile: ['Profil Pernikahan', 'Data pasangan, tanggal akad & resepsi, serta lokasi acara'],
      checklist: ['Wedding Checklist', 'Pantau seluruh tugas persiapan dari 16 kategori'],
      budget: ['Anggaran & Pengeluaran', 'Kontrol estimasi, realisasi, dan grafik keuangan'],
      guests: ['Manajemen Tamu', 'Daftar undangan, kategori tamu, dan status RSVP'],
      vendors: ['Direktori Vendor', 'Kelola vendor pilihan & favorit Anda'],
      bookings: ['Pemesanan Vendor', 'Kontrak kesepakatan & status booking vendor'],
      payments: ['Pelacakan Pembayaran', 'Riwayat DP, cicilan bertahap, dan jatuh tempo'],
      calendar: ['Kalender & Timeline', 'Jadwal terintegrasi dengan checklist dan pembayaran'],
      inspirations: ['Galeri Inspirasi', 'Koleksi referensi konsep pernikahan impian'],
      invitation: ['Undangan Digital & RSVP', 'Atur template, publikasikan tautan, dan pantau ucapan'],
      reports: ['Laporan & Analitik', 'Rekap lengkap seluruh modul siap ekspor PDF/Excel'],
      settings: ['Pengaturan & Real-Time Cloud', 'Kolaborasi pasangan & konfigurasi sinkronisasi GitHub']
    };
    const [title, sub] = titles[page] || ['Wedding Planner', ''];
    const titleEl = document.getElementById('header-page-title');
    const subEl = document.getElementById('header-page-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;

    // Tutup sidebar mobile
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
      if (overlay) overlay.classList.add('hidden');
    }

    this.renderActivePage();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    const isClosed = sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full', !isClosed);
    if (overlay) overlay.classList.toggle('hidden', !isClosed);
  },

  renderSyncBadge(status) {
    const badge = document.getElementById('sync-status-badge');
    if (!badge) return;
    if (status.type === 'cloud') {
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>Cloud Real-Time</span>';
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-pointer';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>Mode Demo Lokal</span>';
      badge.onclick = () => this.navigatePage('settings');
    }
  },

  renderHeaderAndSidebar() {
    const d = this.state.workspaceData;
    if (!d) return;
    const userEl = document.getElementById('header-user-name');
    const wsBadge = document.getElementById('sidebar-ws-code');
    const coupleSide = document.getElementById('sidebar-couple-name');
    if (userEl && this.state.user) userEl.textContent = this.state.user.name;
    if (wsBadge) wsBadge.textContent = this.state.workspaceId;
    if (coupleSide && d.profile) {
      coupleSide.textContent = `${d.profile.groomNickname} & ${d.profile.brideNickname}`;
    }
    this.renderNotifications();
  },

  renderActivePage() {
    if (!this.state.workspaceData) return;
    switch (this.state.activePage) {
      case 'dashboard': this.renderDashboard(); break;
      case 'profile': this.renderProfile(); break;
      case 'checklist': this.renderChecklist(); break;
      case 'budget': this.renderBudget(); break;
      case 'guests': this.renderGuests(); break;
      case 'vendors': this.renderVendors(); break;
      case 'bookings': this.renderBookings(); break;
      case 'payments': this.renderPayments(); break;
      case 'calendar': this.renderCalendar(); break;
      case 'inspirations': this.renderInspirations(); break;
      case 'invitation': this.renderInvitationBuilder(); break;
      case 'reports': this.renderReports(); break;
      case 'settings': this.renderSettings(); break;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  // --- HELPER FORMATTERS ---
  rupiah(n) {
    const num = Number(n) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  },

  formatDateID(dateStr) {
    if (!dateStr) return '-';
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  },

  esc(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  },

  uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  },

  // --- 1. DASHBOARD ---
  renderDashboard() {
    const d = this.state.workspaceData;
    const p = d.profile;

    document.getElementById('dash-couple-names').textContent = `${p.groomName} & ${p.brideName}`;
    document.getElementById('dash-wedding-date').textContent = this.formatDateID(p.weddingDate);
    document.getElementById('dash-wedding-venue').textContent = p.venueName || 'Belum ditentukan';
    document.getElementById('dash-wedding-theme').textContent = p.weddingTheme || 'Luxury Elegant';
    const photo = document.getElementById('dash-couple-photo');
    if (photo) photo.src = p.couplePhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';

    // Countdown interval
    this.startCountdown(`${p.akadDate || p.weddingDate}T${p.akadTime || '08:00'}:00`, 'dash-cd');

    // Checklist metrics
    const totalChk = d.checklists.length;
    const doneChk = d.checklists.filter((c) => c.status === 'Completed').length;
    const overdueChk = d.checklists.filter((c) => c.status === 'Overdue').length;
    const pct = totalChk ? Math.round((doneChk / totalChk) * 100) : 0;

    document.getElementById('dash-chk-pct').textContent = `${pct}%`;
    document.getElementById('dash-chk-bar').style.width = `${pct}%`;
    document.getElementById('dash-chk-done').textContent = doneChk;
    document.getElementById('dash-chk-pending').textContent = totalChk - doneChk;
    document.getElementById('dash-chk-overdue').textContent = overdueChk;

    // Budget metrics
    const totalBudget = Number(p.totalBudget) || 0;
    const totalEst = d.budgets.reduce((s, b) => s + (Number(b.estimatedCost) || 0), 0);
    const totalAct = d.budgets.reduce((s, b) => s + (Number(b.actualCost) || 0), 0);
    const totalPaid = d.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) +
      d.payments.filter((pay) => pay.status === 'Paid').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    const remainingBudget = totalBudget - totalAct;

    document.getElementById('dash-bdg-total').textContent = this.rupiah(totalBudget);
    document.getElementById('dash-bdg-est').textContent = this.rupiah(totalEst);
    document.getElementById('dash-bdg-act').textContent = this.rupiah(totalAct);
    document.getElementById('dash-bdg-paid').textContent = this.rupiah(totalPaid);
    const remEl = document.getElementById('dash-bdg-rem');
    remEl.textContent = this.rupiah(remainingBudget);
    remEl.className = remainingBudget < 0 ? 'text-xl font-bold text-rose-600' : 'text-xl font-bold text-emerald-700';

    // Guest metrics
    const totalGuests = d.guests.length;
    const totalPax = d.guests.reduce((s, g) => s + (Number(g.guestCount) || 1), 0);
    const rsvpDone = d.guests.filter((g) => g.rsvpStatus !== 'Pending').length;
    const attendingPax = d.guests.filter((g) => g.rsvpStatus === 'Attending').reduce((s, g) => s + (Number(g.guestCount) || 1), 0)
      + d.rsvps.filter((r) => r.attendanceStatus === 'Attending').reduce((s, r) => s + (Number(r.guestCount) || 1), 0);

    document.getElementById('dash-gst-total').textContent = `${totalGuests} Undangan (${totalPax} Pax)`;
    document.getElementById('dash-gst-rsvp').textContent = rsvpDone + d.rsvps.length;
    document.getElementById('dash-gst-attending').textContent = `${attendingPax} Orang`;
    document.getElementById('dash-gst-pending').textContent = d.guests.filter((g) => g.rsvpStatus === 'Pending').length;

    // Upcoming events
    const todayIso = new Date().toISOString();
    const upcoming = [...d.events]
      .filter((ev) => ev.startDatetime >= todayIso.slice(0, 10))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))
      .slice(0, 5);
    const upEl = document.getElementById('dash-upcoming-events');
    if (!upcoming.length) {
      upEl.innerHTML = '<p class="text-sm text-[#6E5F53] py-4 text-center">Belum ada jadwal terdekat.</p>';
    } else {
      upEl.innerHTML = upcoming.map((ev) => `
        <div class="flex items-start justify-between p-3 rounded-xl bg-[#F8F5EF] border border-[#E8DFD1]">
          <div>
            <p class="font-medium text-sm text-[#463B32]">${this.esc(ev.title)}</p>
            <p class="text-xs text-[#6E5F53] mt-0.5">${this.formatDateID(ev.startDatetime)} • ${ev.startDatetime.slice(11, 16) || '09:00'} WIB</p>
          </div>
          <span class="px-2.5 py-0.5 text-[11px] rounded-full bg-white border border-[#C5A46D]/40 text-[#8C6D3B] font-medium">${this.esc(ev.category)}</span>
        </div>
      `).join('');
    }
  },

  startCountdown(targetIso, prefix) {
    if (this._cdTimers && this._cdTimers[prefix]) clearInterval(this._cdTimers[prefix]);
    this._cdTimers = this._cdTimers || {};
    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      const ids = ['days', 'hours', 'minutes', 'seconds'];
      if (isNaN(diff) || diff <= 0) {
        ids.forEach((k) => {
          const el = document.getElementById(`${prefix}-${k}`);
          if (el) el.textContent = '00';
        });
        return;
      }
      const vals = {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      };
      ids.forEach((k) => {
        const el = document.getElementById(`${prefix}-${k}`);
        if (el) el.textContent = String(vals[k]).padStart(2, '0');
      });
    };
    update();
    this._cdTimers[prefix] = setInterval(update, 1000);
  },

  // --- 2. PROFIL PERNIKAHAN ---
  renderProfile() {
    const p = this.state.workspaceData.profile;
    const fields = ['groomName', 'groomNickname', 'groomParents', 'brideName', 'brideNickname', 'brideParents',
      'description', 'akadDate', 'akadTime', 'receptionDate', 'receptionTime', 'venueName', 'venueAddress',
      'googleMapsUrl', 'weddingTheme', 'themeColor', 'targetGuests', 'totalBudget'];
    fields.forEach((f) => {
      const el = document.getElementById(`prof-${f}`);
      if (el) el.value = p[f] ?? '';
    });
    const prev = document.getElementById('prof-photo-preview');
    if (prev) prev.src = p.couplePhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
  },

  async handleSaveProfile(e) {
    e.preventDefault();
    const p = this.state.workspaceData.profile;
    const fields = ['groomName', 'groomNickname', 'groomParents', 'brideName', 'brideNickname', 'brideParents',
      'description', 'akadDate', 'akadTime', 'receptionDate', 'receptionTime', 'venueName', 'venueAddress',
      'googleMapsUrl', 'weddingTheme', 'themeColor'];
    fields.forEach((f) => {
      const el = document.getElementById(`prof-${f}`);
      if (el) p[f] = el.value.trim();
    });
    p.weddingDate = p.akadDate || p.receptionDate;
    p.targetGuests = Number(document.getElementById('prof-targetGuests').value) || 0;
    p.totalBudget = Number(document.getElementById('prof-totalBudget').value) || 0;
    this.state.workspaceData.meta.workspaceName = `Pernikahan ${p.groomNickname} & ${p.brideNickname}`;
    await this.persistData('Profil pernikahan berhasil diperbarui secara real-time!');
  },

  handleImageCompress(file, maxWidth = 800, callback) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return this.toast('File harus berupa gambar (JPG/PNG/WebP).', 'error');
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  },

  uploadCouplePhoto(input) {
    if (!input.files[0]) return;
    this.handleImageCompress(input.files[0], 900, async (base64) => {
      this.state.workspaceData.profile.couplePhoto = base64;
      document.getElementById('prof-photo-preview').src = base64;
      await this.persistData('Foto pasangan berhasil diperbarui!');
    });
  },

  // --- 3. CHECKLIST ---
  renderChecklist() {
    const d = this.state.workspaceData;
    const catSel = document.getElementById('chk-filter-cat');
    if (catSel && catSel.options.length <= 1) {
      window.WEDDING_CONSTANTS.checklistCategories.forEach((c) => {
        catSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
      });
    }

    const total = d.checklists.length;
    const done = d.checklists.filter((c) => c.status === 'Completed').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('chk-progress-label').textContent = `${done} dari ${total} tugas selesai (${pct}%)`;
    document.getElementById('chk-progress-bar').style.width = `${pct}%`;

    const fCat = this.state.filters.checklistCategory;
    const fStat = this.state.filters.checklistStatus;
    const fQ = this.state.filters.checklistSearch.toLowerCase();

    const filtered = d.checklists.filter((c) => {
      if (fCat !== 'ALL' && c.category !== fCat) return false;
      if (fStat !== 'ALL' && c.status !== fStat) return false;
      if (fQ && !`${c.title} ${c.category} ${c.assignee}`.toLowerCase().includes(fQ)) return false;
      return true;
    });

    const tbody = document.getElementById('chk-table-body');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-sm text-[#6E5F53]">Tidak ada checklist yang sesuai filter.</td></tr>';
      return;
    }

    const statusBadge = {
      'To Do': 'bg-stone-100 text-stone-700',
      'In Progress': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Overdue': 'bg-rose-100 text-rose-700'
    };
    const prioBadge = {
      'Low': 'text-stone-500',
      'Medium': 'text-amber-700',
      'High': 'text-orange-700 font-semibold',
      'Urgent': 'text-rose-700 font-bold'
    };

    tbody.innerHTML = filtered.map((c) => `
      <tr class="border-b border-[#F2ECE2] hover:bg-[#FAF7F2]">
        <td class="py-3 px-4">
          <input type="checkbox" ${c.status === 'Completed' ? 'checked' : ''} onchange="App.toggleChecklist('${c.id}')" class="w-4 h-4 accent-[#C5A46D] cursor-pointer rounded">
        </td>
        <td class="py-3 px-4">
          <p class="font-medium text-sm ${c.status === 'Completed' ? 'line-through text-[#9E8F82]' : 'text-[#463B32]'}">${this.esc(c.title)}</p>
          <p class="text-xs text-[#6E5F53]">${this.esc(c.category)} • PJ: ${this.esc(c.assignee || '-')}</p>
        </td>
        <td class="py-3 px-4 text-xs">${this.formatDateID(c.dueDate)}</td>
        <td class="py-3 px-4 text-xs ${prioBadge[c.priority] || ''}">${this.esc(c.priority)}</td>
        <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[c.status] || ''}">${this.esc(c.status)}</span></td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <button onclick="App.openChecklistModal('${c.id}')" class="text-xs text-[#8C6D3B] hover:underline mr-3">Edit</button>
          <button onclick="App.deleteItem('checklists', '${c.id}', 'Hapus tugas checklist ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
        </td>
      </tr>
    `).join('');
  },

  async toggleChecklist(id) {
    const item = this.state.workspaceData.checklists.find((c) => c.id === id);
    if (!item) return;
    item.status = item.status === 'Completed' ? 'To Do' : 'Completed';
    await this.persistData('Status checklist diperbarui!');
  },

  openChecklistModal(editId = null) {
    const item = editId ? this.state.workspaceData.checklists.find((c) => c.id === editId) : null;
    const catOpts = window.WEDDING_CONSTANTS.checklistCategories.map((c) => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('');
    this.openModal(item ? 'Edit Checklist' : 'Tambah Checklist Baru', `
      <form onsubmit="App.saveChecklist(event, '${editId || ''}')" class="space-y-3">
        <div><label class="text-xs font-medium">Nama Pekerjaan *</label><input id="m-chk-title" required value="${this.esc(item?.title)}" class="input-luxury mt-1"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Kategori</label><select id="m-chk-cat" class="input-luxury mt-1">${catOpts}</select></div>
          <div><label class="text-xs font-medium">Penanggung Jawab</label><input id="m-chk-pj" value="${this.esc(item?.assignee || 'Bersama')}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label class="text-xs font-medium">Deadline *</label><input type="date" id="m-chk-due" required value="${item?.dueDate || new Date().toISOString().split('T')[0]}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Prioritas</label>
            <select id="m-chk-prio" class="input-luxury mt-1">
              ${['Low', 'Medium', 'High', 'Urgent'].map((p) => `<option ${item?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <div><label class="text-xs font-medium">Status</label>
            <select id="m-chk-stat" class="input-luxury mt-1">
              ${['To Do', 'In Progress', 'Completed', 'Overdue'].map((s) => `<option ${item?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div><label class="text-xs font-medium">Catatan</label><textarea id="m-chk-notes" rows="2" class="input-luxury mt-1">${this.esc(item?.notes)}</textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan</button>
        </div>
      </form>
    `);
  },

  async saveChecklist(e, editId) {
    e.preventDefault();
    const payload = {
      id: editId || this.uid('chk'),
      title: document.getElementById('m-chk-title').value.trim(),
      category: document.getElementById('m-chk-cat').value,
      assignee: document.getElementById('m-chk-pj').value.trim(),
      dueDate: document.getElementById('m-chk-due').value,
      priority: document.getElementById('m-chk-prio').value,
      status: document.getElementById('m-chk-stat').value,
      notes: document.getElementById('m-chk-notes').value.trim()
    };
    const list = this.state.workspaceData.checklists;
    if (editId) {
      const idx = list.findIndex((c) => c.id === editId);
      if (idx > -1) list[idx] = payload;
    } else {
      list.unshift(payload);
    }
    this.closeModal();
    await this.persistData('Checklist berhasil disimpan!');
  },

  // --- 4. BUDGET & PENGELUARAN ---
  renderBudget() {
    const d = this.state.workspaceData;
    const totalBudget = Number(d.profile.totalBudget) || 0;
    const totalEst = d.budgets.reduce((s, b) => s + (Number(b.estimatedCost) || 0), 0);
    const totalAct = d.budgets.reduce((s, b) => s + (Number(b.actualCost) || 0), 0);
    const remaining = totalBudget - totalAct;

    document.getElementById('bdg-sum-total').textContent = this.rupiah(totalBudget);
    document.getElementById('bdg-sum-est').textContent = this.rupiah(totalEst);
    document.getElementById('bdg-sum-act').textContent = this.rupiah(totalAct);
    document.getElementById('bdg-sum-rem').textContent = this.rupiah(remaining);

    const warn = document.getElementById('bdg-over-warning');
    if (warn) warn.classList.toggle('hidden', totalAct <= totalBudget);

    const tbody = document.getElementById('bdg-table-body');
    tbody.innerHTML = d.budgets.map((b) => {
      const est = Number(b.estimatedCost) || 0;
      const act = Number(b.actualCost) || 0;
      const diff = act - est;
      const overrun = diff > 0;
      return `
        <tr class="border-b border-[#F2ECE2] hover:bg-[#FAF7F2]">
          <td class="py-3 px-4">
            <p class="font-medium text-sm text-[#463B32]">${this.esc(b.itemName)}</p>
            <p class="text-xs text-[#6E5F53]">${this.esc(b.category)}</p>
          </td>
          <td class="py-3 px-4 text-sm">${this.rupiah(est)}</td>
          <td class="py-3 px-4 text-sm font-medium">${this.rupiah(act)}</td>
          <td class="py-3 px-4 text-xs font-medium ${overrun ? 'text-rose-600' : 'text-emerald-700'}">
            ${overrun ? `+${this.rupiah(diff)} (Melebihi)` : this.rupiah(diff)}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick="App.openBudgetModal('${b.id}')" class="text-xs text-[#8C6D3B] hover:underline mr-3">Edit</button>
            <button onclick="App.deleteItem('budgets', '${b.id}', 'Hapus pos anggaran ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
          </td>
        </tr>
      `;
    }).join('');

    // Render Expenses list
    const expEl = document.getElementById('exp-table-body');
    expEl.innerHTML = d.expenses.length ? d.expenses.map((ex) => {
      const bdg = d.budgets.find((b) => b.id === ex.budgetId);
      return `
        <tr class="border-b border-[#F2ECE2] text-sm">
          <td class="py-2.5 px-4">${this.esc(ex.description)} <span class="block text-xs text-[#6E5F53]">${this.esc(bdg?.itemName || '-')}</span></td>
          <td class="py-2.5 px-4 text-xs">${this.formatDateID(ex.transactionDate)}</td>
          <td class="py-2.5 px-4 text-xs">${this.esc(ex.paymentMethod)}</td>
          <td class="py-2.5 px-4 font-semibold">${this.rupiah(ex.amount)}</td>
          <td class="py-2.5 px-4 text-right"><button onclick="App.deleteItem('expenses', '${ex.id}', 'Hapus catatan pengeluaran ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" class="text-center py-6 text-sm text-[#6E5F53]">Belum ada pengeluaran tercatat.</td></tr>';

    this.renderBudgetCharts(d, totalBudget, totalAct);
  },

  renderBudgetCharts(d, totalBudget, totalAct) {
    if (typeof Chart === 'undefined') return;
    ['budgetBar', 'budgetPie', 'budgetGauge'].forEach((k) => {
      if (this.state.charts[k]) this.state.charts[k].destroy();
    });

    const labels = d.budgets.map((b) => b.category);
    const estData = d.budgets.map((b) => Number(b.estimatedCost) || 0);
    const actData = d.budgets.map((b) => Number(b.actualCost) || 0);

    const ctx1 = document.getElementById('chart-budget-vs-actual');
    if (ctx1) {
      this.state.charts.budgetBar = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Estimasi', data: estData, backgroundColor: '#E8DFD1' },
            { label: 'Aktual', data: actData, backgroundColor: '#C5A46D' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
    }

    const ctx2 = document.getElementById('chart-budget-category');
    if (ctx2) {
      this.state.charts.budgetPie = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: actData,
            backgroundColor: ['#C5A46D', '#463B32', '#C9A3A3', '#E8DFD1', '#A6854E', '#8C7A6B', '#D8B98A', '#7E6551', '#B89B9B', '#9D835C']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 11, font: { size: 10 } } } } }
      });
    }

    const ctx3 = document.getElementById('chart-budget-usage');
    if (ctx3) {
      const rem = Math.max(0, totalBudget - totalAct);
      this.state.charts.budgetGauge = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: ['Terpakai (Aktual)', 'Sisa Anggaran'],
          datasets: [{ data: [totalAct, rem], backgroundColor: [totalAct > totalBudget ? '#DC2626' : '#C5A46D', '#EFE7DA'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
      });
    }
  },

  openBudgetModal(editId = null) {
    const item = editId ? this.state.workspaceData.budgets.find((b) => b.id === editId) : null;
    const catOpts = window.WEDDING_CONSTANTS.budgetCategories.map((c) => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('');
    this.openModal(item ? 'Edit Pos Anggaran' : 'Tambah Pos Anggaran', `
      <form onsubmit="App.saveBudget(event, '${editId || ''}')" class="space-y-3">
        <div><label class="text-xs font-medium">Nama Kebutuhan *</label><input id="m-bdg-name" required value="${this.esc(item?.itemName)}" class="input-luxury mt-1"></div>
        <div><label class="text-xs font-medium">Kategori</label><select id="m-bdg-cat" class="input-luxury mt-1">${catOpts}</select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Estimasi Biaya (Rp) *</label><input type="number" id="m-bdg-est" required min="0" value="${item?.estimatedCost || 0}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Biaya Aktual (Rp) *</label><input type="number" id="m-bdg-act" required min="0" value="${item?.actualCost || 0}" class="input-luxury mt-1"></div>
        </div>
        <div><label class="text-xs font-medium">Catatan</label><textarea id="m-bdg-notes" rows="2" class="input-luxury mt-1">${this.esc(item?.notes)}</textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan</button>
        </div>
      </form>
    `);
  },

  async saveBudget(e, editId) {
    e.preventDefault();
    const payload = {
      id: editId || this.uid('bdg'),
      itemName: document.getElementById('m-bdg-name').value.trim(),
      category: document.getElementById('m-bdg-cat').value,
      estimatedCost: Number(document.getElementById('m-bdg-est').value) || 0,
      actualCost: Number(document.getElementById('m-bdg-act').value) || 0,
      notes: document.getElementById('m-bdg-notes').value.trim()
    };
    const list = this.state.workspaceData.budgets;
    if (editId) {
      const idx = list.findIndex((b) => b.id === editId);
      if (idx > -1) list[idx] = payload;
    } else {
      list.push(payload);
    }
    this.closeModal();
    await this.persistData('Pos anggaran berhasil disimpan!');
  },

  openExpenseModal() {
    const bdgOpts = this.state.workspaceData.budgets.map((b) => `<option value="${b.id}">${this.esc(b.itemName)} (${this.esc(b.category)})</option>`).join('');
    this.openModal('Catat Pengeluaran Baru', `
      <form onsubmit="App.saveExpense(event)" class="space-y-3">
        <div><label class="text-xs font-medium">Pos Anggaran Terkait</label><select id="m-exp-bdg" class="input-luxury mt-1">${bdgOpts}</select></div>
        <div><label class="text-xs font-medium">Deskripsi Pengeluaran *</label><input id="m-exp-desc" required class="input-luxury mt-1" placeholder="Contoh: DP Catering 30%"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Nominal (Rp) *</label><input type="number" id="m-exp-amt" required min="1" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Tanggal Transaksi *</label><input type="date" id="m-exp-date" required value="${new Date().toISOString().split('T')[0]}" class="input-luxury mt-1"></div>
        </div>
        <div><label class="text-xs font-medium">Metode Pembayaran</label><input id="m-exp-method" value="Transfer BCA" class="input-luxury mt-1"></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan Pengeluaran</button>
        </div>
      </form>
    `);
  },

  async saveExpense(e) {
    e.preventDefault();
    this.state.workspaceData.expenses.unshift({
      id: this.uid('exp'),
      budgetId: document.getElementById('m-exp-bdg').value,
      description: document.getElementById('m-exp-desc').value.trim(),
      amount: Number(document.getElementById('m-exp-amt').value) || 0,
      transactionDate: document.getElementById('m-exp-date').value,
      paymentMethod: document.getElementById('m-exp-method').value.trim()
    });
    this.closeModal();
    await this.persistData('Pengeluaran berhasil dicatat!');
  },

  // --- 5. GUEST MANAGEMENT ---
  renderGuests() {
    const d = this.state.workspaceData;
    const fCat = this.state.filters.guestCategory;
    const fRsvp = this.state.filters.guestRsvp;
    const fQ = this.state.filters.guestSearch.toLowerCase();

    const filtered = d.guests.filter((g) => {
      if (fCat !== 'ALL' && g.category !== fCat) return false;
      if (fRsvp !== 'ALL' && g.rsvpStatus !== fRsvp) return false;
      if (fQ && !`${g.name} ${g.phone} ${g.address}`.toLowerCase().includes(fQ)) return false;
      return true;
    });

    const totalPax = d.guests.reduce((s, g) => s + (Number(g.guestCount) || 1), 0);
    const attPax = d.guests.filter((g) => g.rsvpStatus === 'Attending').reduce((s, g) => s + (Number(g.guestCount) || 1), 0);
    document.getElementById('gst-summary-line').textContent = `Total ${d.guests.length} Undangan (${totalPax} Tamu) • Konfirmasi Hadir: ${attPax} Orang`;

    const rsvpBadge = {
      'Pending': 'bg-amber-100 text-amber-800',
      'Attending': 'bg-emerald-100 text-emerald-700',
      'Not Attending': 'bg-rose-100 text-rose-700'
    };

    const tbody = document.getElementById('gst-table-body');
    tbody.innerHTML = filtered.length ? filtered.map((g) => `
      <tr class="border-b border-[#F2ECE2] hover:bg-[#FAF7F2]">
        <td class="py-3 px-4">
          <p class="font-medium text-sm text-[#463B32]">${this.esc(g.name)}</p>
          <p class="text-xs text-[#6E5F53]">${this.esc(g.phone || '-')} • ${this.esc(g.address || '-')}</p>
        </td>
        <td class="py-3 px-4 text-xs">${this.esc(g.category)}<span class="block text-[#9E8F82]">${this.esc(g.invitedBy)}</span></td>
        <td class="py-3 px-4 text-sm font-medium">${g.guestCount} Org</td>
        <td class="py-3 px-4 text-xs">${this.esc(g.invitationStatus)}</td>
        <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${rsvpBadge[g.rsvpStatus] || ''}">${this.esc(g.rsvpStatus)}</span></td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <button onclick="App.openGuestModal('${g.id}')" class="text-xs text-[#8C6D3B] hover:underline mr-3">Edit</button>
          <button onclick="App.deleteItem('guests', '${g.id}', 'Hapus tamu ini dari daftar?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="text-center py-8 text-sm text-[#6E5F53]">Belum ada data tamu yang cocok.</td></tr>';
  },

  openGuestModal(editId = null) {
    const item = editId ? this.state.workspaceData.guests.find((g) => g.id === editId) : null;
    const cats = window.WEDDING_CONSTANTS.guestCategories.map((c) => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('');
    this.openModal(item ? 'Edit Data Tamu' : 'Tambah Tamu Undangan', `
      <form onsubmit="App.saveGuest(event, '${editId || ''}')" class="space-y-3">
        <div><label class="text-xs font-medium">Nama Tamu *</label><input id="m-gst-name" required value="${this.esc(item?.name)}" class="input-luxury mt-1"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">No. Telepon / WA</label><input id="m-gst-phone" value="${this.esc(item?.phone)}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Email</label><input type="email" id="m-gst-email" value="${this.esc(item?.email)}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs font-medium">Kategori</label><select id="m-gst-cat" class="input-luxury mt-1">${cats}</select></div>
          <div><label class="text-xs font-medium">Pihak Pengundang</label>
            <select id="m-gst-by" class="input-luxury mt-1">
              ${['Mempelai Pria', 'Mempelai Wanita', 'Bersama'].map((b) => `<option ${item?.invitedBy === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>
          <div><label class="text-xs font-medium">Jumlah Orang</label><input type="number" min="1" id="m-gst-count" value="${item?.guestCount || 2}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Status Undangan</label>
            <select id="m-gst-inv" class="input-luxury mt-1">
              ${['Belum Dikirim', 'Sudah Dikirim'].map((s) => `<option ${item?.invitationStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div><label class="text-xs font-medium">Status RSVP</label>
            <select id="m-gst-rsvp" class="input-luxury mt-1">
              ${['Pending', 'Attending', 'Not Attending'].map((s) => `<option ${item?.rsvpStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div><label class="text-xs font-medium">Alamat / Catatan</label><input id="m-gst-addr" value="${this.esc(item?.address)}" class="input-luxury mt-1"></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan</button>
        </div>
      </form>
    `);
  },

  async saveGuest(e, editId) {
    e.preventDefault();
    const payload = {
      id: editId || this.uid('gst'),
      name: document.getElementById('m-gst-name').value.trim(),
      phone: document.getElementById('m-gst-phone').value.trim(),
      email: document.getElementById('m-gst-email').value.trim(),
      category: document.getElementById('m-gst-cat').value,
      invitedBy: document.getElementById('m-gst-by').value,
      guestCount: Number(document.getElementById('m-gst-count').value) || 1,
      invitationStatus: document.getElementById('m-gst-inv').value,
      rsvpStatus: document.getElementById('m-gst-rsvp').value,
      address: document.getElementById('m-gst-addr').value.trim(),
      notes: ''
    };
    const list = this.state.workspaceData.guests;
    if (editId) {
      const idx = list.findIndex((g) => g.id === editId);
      if (idx > -1) list[idx] = payload;
    } else {
      list.unshift(payload);
    }
    this.closeModal();
    await this.persistData('Data tamu berhasil disimpan!');
  },

  exportGuestsCSV() {
    const rows = [['Nama Tamu', 'Telepon', 'Kategori', 'Pihak Pengundang', 'Jumlah Orang', 'Status Undangan', 'Status RSVP', 'Alamat']];
    this.state.workspaceData.guests.forEach((g) => {
      rows.push([g.name, g.phone, g.category, g.invitedBy, g.guestCount, g.invitationStatus, g.rsvpStatus, g.address]);
    });
    this.downloadCSV(rows, 'daftar-tamu-wedding.csv');
  },

  importGuestsCSV(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter((l) => l.trim());
      let added = 0;
      lines.slice(1).forEach((line) => {
        const cols = line.split(/[,;]/).map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols[0]) {
          this.state.workspaceData.guests.unshift({
            id: this.uid('gst'),
            name: cols[0],
            phone: cols[1] || '',
            category: cols[2] || 'Lainnya',
            invitedBy: cols[3] || 'Bersama',
            guestCount: Number(cols[4]) || 2,
            invitationStatus: cols[5] || 'Belum Dikirim',
            rsvpStatus: cols[6] || 'Pending',
            address: cols[7] || ''
          });
          added++;
        }
      });
      input.value = '';
      await this.persistData(`Berhasil mengimpor ${added} tamu dari file CSV/Excel!`);
    };
    reader.readAsText(file);
  },

  // --- 6. VENDORS ---
  renderVendors() {
    const d = this.state.workspaceData;
    const catSel = document.getElementById('vnd-filter-cat');
    if (catSel && catSel.options.length <= 1) {
      window.WEDDING_CONSTANTS.vendorCategories.forEach((c) => {
        catSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
      });
    }
    const fCat = this.state.filters.vendorCategory;
    const fQ = this.state.filters.vendorSearch.toLowerCase();
    const list = d.vendors.filter((v) => {
      if (fCat !== 'ALL' && v.category !== fCat) return false;
      if (fQ && !`${v.name} ${v.category} ${v.contactPerson}`.toLowerCase().includes(fQ)) return false;
      return true;
    });

    const statBadge = {
      Prospect: 'bg-stone-100 text-stone-700',
      Contacted: 'bg-sky-100 text-sky-700',
      Negotiating: 'bg-amber-100 text-amber-800',
      Booked: 'bg-emerald-100 text-emerald-700',
      Cancelled: 'bg-rose-100 text-rose-700'
    };

    const grid = document.getElementById('vnd-grid');
    grid.innerHTML = list.length ? list.map((v) => `
      <div class="luxury-card p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-[#8C6D3B] font-semibold">${this.esc(v.category)}</span>
              <h4 class="font-serif-luxury text-lg font-bold text-[#463B32] mt-0.5">${this.esc(v.name)}</h4>
            </div>
            <button onclick="App.toggleVendorFav('${v.id}')" class="p-1.5 rounded-full hover:bg-[#F8F5EF]" title="Favorit">
              <i data-lucide="heart" class="w-4 h-4 ${v.isFavorite ? 'fill-[#C9A3A3] text-[#C9A3A3]' : 'text-[#9E8F82]'}"></i>
            </button>
          </div>
          <p class="text-xs text-[#6E5F53] mt-2 line-clamp-2">${this.esc(v.description || 'Tidak ada deskripsi')}</p>
          <div class="mt-3 pt-3 border-t border-[#F2ECE2] space-y-1 text-xs text-[#5E5045]">
            <p><strong>Kontak:</strong> ${this.esc(v.contactPerson)} (${this.esc(v.phone)})</p>
            <p><strong>Penawaran:</strong> <span class="font-semibold text-[#463B32]">${this.rupiah(v.priceOffer)}</span></p>
            <p><strong>Instagram:</strong> ${this.esc(v.instagram || '-')}</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-[#F2ECE2] flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${statBadge[v.status] || ''}">${this.esc(v.status)}</span>
          <div class="flex items-center gap-3 text-xs">
            <button onclick="App.openBookingModal(null, '${v.id}')" class="text-emerald-700 font-medium hover:underline">Booking</button>
            <button onclick="App.openVendorModal('${v.id}')" class="text-[#8C6D3B] hover:underline">Edit</button>
            <button onclick="App.deleteItem('vendors', '${v.id}', 'Hapus vendor ini?')" class="text-rose-600 hover:underline">Hapus</button>
          </div>
        </div>
      </div>
    `).join('') : '<div class="col-span-full text-center py-10 text-sm text-[#6E5F53]">Belum ada vendor ditemukan.</div>';
  },

  async toggleVendorFav(id) {
    const v = this.state.workspaceData.vendors.find((x) => x.id === id);
    if (!v) return;
    v.isFavorite = !v.isFavorite;
    await this.persistData();
  },

  openVendorModal(editId = null) {
    const item = editId ? this.state.workspaceData.vendors.find((v) => v.id === editId) : null;
    const cats = window.WEDDING_CONSTANTS.vendorCategories.map((c) => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('');
    this.openModal(item ? 'Edit Vendor' : 'Tambah Vendor Baru', `
      <form onsubmit="App.saveVendor(event, '${editId || ''}')" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Nama Vendor *</label><input id="m-vnd-name" required value="${this.esc(item?.name)}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Kategori</label><select id="m-vnd-cat" class="input-luxury mt-1">${cats}</select></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Nama Kontak (PIC)</label><input id="m-vnd-pic" value="${this.esc(item?.contactPerson)}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">No. Telepon / WA</label><input id="m-vnd-phone" value="${this.esc(item?.phone)}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs font-medium">Penawaran Harga (Rp)</label><input type="number" id="m-vnd-price" value="${item?.priceOffer || 0}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Instagram</label><input id="m-vnd-ig" value="${this.esc(item?.instagram)}" class="input-luxury mt-1" placeholder="@vendor"></div>
          <div><label class="text-xs font-medium">Status</label>
            <select id="m-vnd-stat" class="input-luxury mt-1">
              ${['Prospect', 'Contacted', 'Negotiating', 'Booked', 'Cancelled'].map((s) => `<option ${item?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div><label class="text-xs font-medium">Deskripsi Layanan</label><textarea id="m-vnd-desc" rows="2" class="input-luxury mt-1">${this.esc(item?.description)}</textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan Vendor</button>
        </div>
      </form>
    `);
  },

  async saveVendor(e, editId) {
    e.preventDefault();
    const prev = editId ? this.state.workspaceData.vendors.find((v) => v.id === editId) : {};
    const payload = {
      ...prev,
      id: editId || this.uid('vnd'),
      name: document.getElementById('m-vnd-name').value.trim(),
      category: document.getElementById('m-vnd-cat').value,
      contactPerson: document.getElementById('m-vnd-pic').value.trim(),
      phone: document.getElementById('m-vnd-phone').value.trim(),
      priceOffer: Number(document.getElementById('m-vnd-price').value) || 0,
      instagram: document.getElementById('m-vnd-ig').value.trim(),
      status: document.getElementById('m-vnd-stat').value,
      description: document.getElementById('m-vnd-desc').value.trim(),
      isFavorite: Boolean(prev?.isFavorite)
    };
    const list = this.state.workspaceData.vendors;
    if (editId) {
      const idx = list.findIndex((v) => v.id === editId);
      if (idx > -1) list[idx] = payload;
    } else {
      list.unshift(payload);
    }
    this.closeModal();
    await this.persistData('Data vendor berhasil disimpan!');
  },

  // --- 7. VENDOR BOOKING ---
  renderBookings() {
    const d = this.state.workspaceData;
    const tbody = document.getElementById('bkg-table-body');
    tbody.innerHTML = d.bookings.length ? d.bookings.map((b) => {
      const v = d.vendors.find((x) => x.id === b.vendorId);
      const paid = d.payments.filter((p) => p.bookingId === b.id && p.status === 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const rem = (Number(b.totalAmount) || 0) - paid;
      return `
        <tr class="border-b border-[#F2ECE2] hover:bg-[#FAF7F2]">
          <td class="py-3 px-4">
            <p class="font-medium text-sm text-[#463B32]">${this.esc(v?.name || 'Vendor')}</p>
            <p class="text-xs text-[#6E5F53]">${this.esc(b.serviceName)} • #${this.esc(b.contractNumber)}</p>
          </td>
          <td class="py-3 px-4 text-xs">${this.formatDateID(b.eventDate)}</td>
          <td class="py-3 px-4 text-sm font-semibold">${this.rupiah(b.totalAmount)}</td>
          <td class="py-3 px-4 text-xs text-emerald-700 font-medium">${this.rupiah(paid)}<span class="block text-[#6E5F53]">Sisa: ${this.rupiah(rem)}</span></td>
          <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">${this.esc(b.status)}</span></td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick="App.openPaymentModal('${b.id}')" class="text-xs text-[#8C6D3B] font-medium hover:underline mr-3">+ Bayar</button>
            <button onclick="App.deleteItem('bookings', '${b.id}', 'Hapus data booking ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="6" class="text-center py-8 text-sm text-[#6E5F53]">Belum ada pemesanan vendor.</td></tr>';
  },

  openBookingModal(editId = null, preselectVendorId = '') {
    const d = this.state.workspaceData;
    const item = editId ? d.bookings.find((b) => b.id === editId) : null;
    const vOpts = d.vendors.map((v) => `<option value="${v.id}" ${(item?.vendorId || preselectVendorId) === v.id ? 'selected' : ''}>${this.esc(v.name)} (${this.esc(v.category)})</option>`).join('');
    this.openModal('Buat Pemesanan Vendor (Booking)', `
      <form onsubmit="App.saveBooking(event, '${editId || ''}')" class="space-y-3">
        <div><label class="text-xs font-medium">Pilih Vendor *</label><select id="m-bkg-vnd" required class="input-luxury mt-1">${vOpts}</select></div>
        <div><label class="text-xs font-medium">Jenis Layanan *</label><input id="m-bkg-srv" required value="${this.esc(item?.serviceName)}" class="input-luxury mt-1" placeholder="Contoh: Paket Catering 300 Pax"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Total Kesepakatan (Rp) *</label><input type="number" id="m-bkg-amt" required min="0" value="${item?.totalAmount || 0}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Nomor Kontrak</label><input id="m-bkg-ctr" value="${this.esc(item?.contractNumber || 'CTR-' + Date.now().toString().slice(-4))}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Tanggal Booking</label><input type="date" id="m-bkg-bdate" value="${item?.bookingDate || new Date().toISOString().split('T')[0]}" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Tanggal Pelaksanaan</label><input type="date" id="m-bkg-edate" value="${item?.eventDate || d.profile.weddingDate}" class="input-luxury mt-1"></div>
        </div>
        <div><label class="text-xs font-medium">Catatan Kesepakatan</label><textarea id="m-bkg-notes" rows="2" class="input-luxury mt-1">${this.esc(item?.notes)}</textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan Booking</button>
        </div>
      </form>
    `);
  },

  async saveBooking(e, editId) {
    e.preventDefault();
    const vendorId = document.getElementById('m-bkg-vnd').value;
    const payload = {
      id: editId || this.uid('bkg'),
      vendorId,
      serviceName: document.getElementById('m-bkg-srv').value.trim(),
      totalAmount: Number(document.getElementById('m-bkg-amt').value) || 0,
      contractNumber: document.getElementById('m-bkg-ctr').value.trim(),
      bookingDate: document.getElementById('m-bkg-bdate').value,
      eventDate: document.getElementById('m-bkg-edate').value,
      status: 'Confirmed',
      notes: document.getElementById('m-bkg-notes').value.trim()
    };
    this.state.workspaceData.bookings.unshift(payload);
    const v = this.state.workspaceData.vendors.find((x) => x.id === vendorId);
    if (v) v.status = 'Booked';
    this.closeModal();
    await this.persistData('Booking vendor berhasil disimpan & status vendor diperbarui menjadi Booked!');
  },

  // --- 8. PAYMENT TRACKING ---
  renderPayments() {
    const d = this.state.workspaceData;
    const totalContract = d.bookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const totalPaid = d.payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalRemaining = Math.max(0, totalContract - totalPaid);

    document.getElementById('pay-sum-total').textContent = this.rupiah(totalContract);
    document.getElementById('pay-sum-paid').textContent = this.rupiah(totalPaid);
    document.getElementById('pay-sum-rem').textContent = this.rupiah(totalRemaining);

    const today = new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('pay-table-body');
    tbody.innerHTML = d.payments.length ? d.payments.map((p) => {
      const bkg = d.bookings.find((b) => b.id === p.bookingId);
      const vnd = bkg ? d.vendors.find((v) => v.id === bkg.vendorId) : null;
      const isLate = p.status !== 'Paid' && p.dueDate && p.dueDate < today;
      return `
        <tr class="border-b border-[#F2ECE2] hover:bg-[#FAF7F2]">
          <td class="py-3 px-4">
            <p class="font-medium text-sm text-[#463B32]">${this.esc(p.label)}</p>
            <p class="text-xs text-[#6E5F53]">${this.esc(vnd?.name || '-')} • ${this.esc(bkg?.serviceName || '-')}</p>
          </td>
          <td class="py-3 px-4 font-semibold text-sm">${this.rupiah(p.amount)}</td>
          <td class="py-3 px-4 text-xs ${isLate ? 'text-rose-600 font-semibold' : ''}">${this.formatDateID(p.dueDate)} ${isLate ? '(Terlambat)' : ''}</td>
          <td class="py-3 px-4 text-xs">${this.esc(p.paymentMethod)}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">
              ${p.status === 'Paid' ? 'Lunas / Paid' : 'Menunggu Bayar'}
            </span>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            ${p.status !== 'Paid' ? `<button onclick="App.markPaymentPaid('${p.id}')" class="text-xs text-emerald-700 font-medium hover:underline mr-3">Tandai Lunas</button>` : ''}
            <button onclick="App.deleteItem('payments', '${p.id}', 'Hapus jadwal pembayaran ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="6" class="text-center py-8 text-sm text-[#6E5F53]">Belum ada catatan pembayaran.</td></tr>';
  },

  openPaymentModal(preselectBookingId = '') {
    const d = this.state.workspaceData;
    const bOpts = d.bookings.map((b) => {
      const v = d.vendors.find((x) => x.id === b.vendorId);
      return `<option value="${b.id}" ${preselectBookingId === b.id ? 'selected' : ''}>${this.esc(v?.name || 'Vendor')} - ${this.esc(b.serviceName)}</option>`;
    }).join('');
    this.openModal('Tambah Pembayaran / Termin Vendor', `
      <form onsubmit="App.savePayment(event)" class="space-y-3">
        <div><label class="text-xs font-medium">Booking Vendor *</label><select id="m-pay-bkg" required class="input-luxury mt-1">${bOpts}</select></div>
        <div><label class="text-xs font-medium">Keterangan Termin *</label><input id="m-pay-label" required class="input-luxury mt-1" placeholder="Contoh: DP 30% / Pelunasan"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Nominal (Rp) *</label><input type="number" id="m-pay-amt" required min="1" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Jatuh Tempo *</label><input type="date" id="m-pay-due" required value="${new Date().toISOString().split('T')[0]}" class="input-luxury mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Metode Pembayaran</label><input id="m-pay-method" value="Transfer BCA" class="input-luxury mt-1"></div>
          <div><label class="text-xs font-medium">Status</label>
            <select id="m-pay-stat" class="input-luxury mt-1">
              <option value="Paid">Sudah Dibayar (Paid)</option>
              <option value="Pending">Jadwal Jatuh Tempo (Pending)</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan Pembayaran</button>
        </div>
      </form>
    `);
  },

  async savePayment(e) {
    e.preventDefault();
    const stat = document.getElementById('m-pay-stat').value;
    const due = document.getElementById('m-pay-due').value;
    this.state.workspaceData.payments.unshift({
      id: this.uid('pay'),
      bookingId: document.getElementById('m-pay-bkg').value,
      label: document.getElementById('m-pay-label').value.trim(),
      amount: Number(document.getElementById('m-pay-amt').value) || 0,
      dueDate: due,
      paymentDate: stat === 'Paid' ? new Date().toISOString().split('T')[0] : '',
      paymentMethod: document.getElementById('m-pay-method').value.trim(),
      status: stat
    });
    this.closeModal();
    await this.persistData('Transaksi pembayaran berhasil dicatat!');
  },

  async markPaymentPaid(id) {
    const p = this.state.workspaceData.payments.find((x) => x.id === id);
    if (!p) return;
    p.status = 'Paid';
    p.paymentDate = new Date().toISOString().split('T')[0];
    await this.persistData('Pembayaran ditandai sebagai Lunas!');
  },

  // --- 9. FULLCALENDAR ---
  renderCalendar() {
    const el = document.getElementById('wedding-fullcalendar');
    if (!el || typeof FullCalendar === 'undefined') return;
    const d = this.state.workspaceData;

    const events = [
      ...d.events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: ev.startDatetime,
        end: ev.endDatetime,
        color: ev.category === 'Wedding Day' ? '#C9A3A3' : '#C5A46D',
        extendedProps: { source: 'event', raw: ev }
      })),
      ...d.checklists.filter((c) => c.status !== 'Completed' && c.dueDate).map((c) => ({
        id: 'chk_' + c.id,
        title: `Deadline: ${c.title}`,
        start: c.dueDate,
        color: '#6E5F53',
        extendedProps: { source: 'checklist' }
      })),
      ...d.payments.filter((p) => p.status !== 'Paid' && p.dueDate).map((p) => ({
        id: 'pay_' + p.id,
        title: `Tagihan: ${p.label} (${this.rupiah(p.amount)})`,
        start: p.dueDate,
        color: '#B91C1C',
        extendedProps: { source: 'payment' }
      }))
    ];

    if (this.state.calendarInstance) {
      this.state.calendarInstance.destroy();
    }
    this.state.calendarInstance = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'id',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events,
      dateClick: (info) => this.openEventModal(null, info.dateStr),
      eventClick: (info) => {
        if (info.event.extendedProps.source === 'event') {
          this.openEventModal(info.event.extendedProps.raw.id);
        } else {
          this.toast(info.event.title, 'info');
        }
      }
    });
    setTimeout(() => this.state.calendarInstance.render(), 50);
  },

  openEventModal(editId = null, preDate = '') {
    const item = editId ? this.state.workspaceData.events.find((e) => e.id === editId) : null;
    const cats = window.WEDDING_CONSTANTS.eventCategories.map((c) => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('');
    const defaultStart = item?.startDatetime || `${preDate || new Date().toISOString().split('T')[0]}T10:00`;
    this.openModal(item ? 'Edit Jadwal Acara' : 'Tambah Jadwal Baru', `
      <form onsubmit="App.saveEvent(event, '${editId || ''}')" class="space-y-3">
        <div><label class="text-xs font-medium">Nama Kegiatan *</label><input id="m-evt-title" required value="${this.esc(item?.title)}" class="input-luxury mt-1"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Kategori</label><select id="m-evt-cat" class="input-luxury mt-1">${cats}</select></div>
          <div><label class="text-xs font-medium">Waktu Mulai *</label><input type="datetime-local" id="m-evt-start" required value="${defaultStart.slice(0, 16)}" class="input-luxury mt-1"></div>
        </div>
        <div><label class="text-xs font-medium">Deskripsi / Lokasi</label><textarea id="m-evt-desc" rows="2" class="input-luxury mt-1">${this.esc(item?.description)}</textarea></div>
        <div class="flex justify-between pt-2">
          ${item ? `<button type="button" onclick="App.closeModal(); App.deleteItem('events', '${item.id}', 'Hapus jadwal ini?')" class="text-xs text-rose-600 hover:underline">Hapus Jadwal</button>` : '<span></span>'}
          <div class="flex gap-2">
            <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
            <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan</button>
          </div>
        </div>
      </form>
    `);
  },

  async saveEvent(e, editId) {
    e.preventDefault();
    const start = document.getElementById('m-evt-start').value;
    const payload = {
      id: editId || this.uid('evt'),
      title: document.getElementById('m-evt-title').value.trim(),
      category: document.getElementById('m-evt-cat').value,
      startDatetime: start,
      endDatetime: start,
      description: document.getElementById('m-evt-desc').value.trim()
    };
    const list = this.state.workspaceData.events;
    if (editId) {
      const idx = list.findIndex((x) => x.id === editId);
      if (idx > -1) list[idx] = payload;
    } else {
      list.push(payload);
    }
    this.closeModal();
    await this.persistData('Jadwal berhasil disimpan ke kalender!');
  },

  // --- 10. INSPIRATION GALLERY ---
  renderInspirations() {
    const d = this.state.workspaceData;
    const catSel = document.getElementById('ins-filter-cat');
    if (catSel && catSel.options.length <= 1) {
      window.WEDDING_CONSTANTS.inspirationCategories.forEach((c) => {
        catSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
      });
    }
    const fCat = this.state.filters.inspirationCategory;
    const items = d.inspirations.filter((i) => fCat === 'ALL' || i.category === fCat);

    const grid = document.getElementById('ins-masonry');
    grid.innerHTML = items.length ? items.map((i) => `
      <div class="masonry-item luxury-card overflow-hidden group">
        <div class="relative">
          <img src="${this.esc(i.imageUrl)}" alt="${this.esc(i.title)}" class="w-full object-cover cursor-pointer" onclick="App.previewInspiration('${i.id}')">
          <button onclick="App.toggleInspFav('${i.id}')" class="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow">
            <i data-lucide="heart" class="w-4 h-4 ${i.isFavorite ? 'fill-[#C9A3A3] text-[#C9A3A3]' : 'text-[#463B32]'}"></i>
          </button>
        </div>
        <div class="p-4">
          <span class="text-[11px] uppercase tracking-wider text-[#8C6D3B] font-medium">${this.esc(i.category)}</span>
          <h4 class="font-serif-luxury font-bold text-[#463B32] mt-0.5">${this.esc(i.title)}</h4>
          <p class="text-xs text-[#6E5F53] mt-1">${this.esc(i.description)}</p>
          <div class="mt-3 flex justify-end">
            <button onclick="App.deleteItem('inspirations', '${i.id}', 'Hapus inspirasi ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button>
          </div>
        </div>
      </div>
    `).join('') : '<p class="text-center py-8 text-sm text-[#6E5F53]">Belum ada inspirasi untuk kategori ini.</p>';
  },

  previewInspiration(id) {
    const item = this.state.workspaceData.inspirations.find((x) => x.id === id);
    if (!item) return;
    this.openModal(item.title, `
      <img src="${this.esc(item.imageUrl)}" class="w-full max-h-[65vh] object-contain rounded-xl mb-3">
      <p class="text-xs text-[#8C6D3B] font-medium">${this.esc(item.category)}</p>
      <p class="text-sm text-[#463B32] mt-1">${this.esc(item.description)}</p>
    `);
  },

  async toggleInspFav(id) {
    const item = this.state.workspaceData.inspirations.find((x) => x.id === id);
    if (!item) return;
    item.isFavorite = !item.isFavorite;
    await this.persistData();
  },

  openInspirationModal() {
    const cats = window.WEDDING_CONSTANTS.inspirationCategories.map((c) => `<option>${c}</option>`).join('');
    this.openModal('Tambah Inspirasi Pernikahan', `
      <form onsubmit="App.saveInspiration(event)" class="space-y-3">
        <div><label class="text-xs font-medium">Judul Inspirasi *</label><input id="m-ins-title" required class="input-luxury mt-1"></div>
        <div><label class="text-xs font-medium">Kategori</label><select id="m-ins-cat" class="input-luxury mt-1">${cats}</select></div>
        <div><label class="text-xs font-medium">URL Gambar</label><input id="m-ins-url" class="input-luxury mt-1" placeholder="https://..."></div>
        <div><label class="text-xs font-medium">Atau Upload Gambar dari Perangkat</label><input type="file" id="m-ins-file" accept="image/*" class="input-luxury mt-1"></div>
        <div><label class="text-xs font-medium">Deskripsi</label><textarea id="m-ins-desc" rows="2" class="input-luxury mt-1"></textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
          <button type="submit" class="btn-gold px-5 py-2 text-sm">Simpan Inspirasi</button>
        </div>
      </form>
    `);
  },

  saveInspiration(e) {
    e.preventDefault();
    const file = document.getElementById('m-ins-file').files[0];
    const url = document.getElementById('m-ins-url').value.trim();
    const finishSave = async (finalImg) => {
      this.state.workspaceData.inspirations.unshift({
        id: this.uid('ins'),
        title: document.getElementById('m-ins-title').value.trim(),
        category: document.getElementById('m-ins-cat').value,
        imageUrl: finalImg || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80',
        description: document.getElementById('m-ins-desc').value.trim(),
        isFavorite: false
      });
      this.closeModal();
      await this.persistData('Inspirasi berhasil ditambahkan!');
    };
    if (file) {
      this.handleImageCompress(file, 750, finishSave);
    } else {
      finishSave(url);
    }
  },

  // --- 11. DIGITAL INVITATION & RSVP ---
  renderInvitationBuilder() {
    const d = this.state.workspaceData;
    const inv = d.invitation;
    document.getElementById('inv-slug').value = inv.slug || '';
    document.getElementById('inv-template').value = inv.template || 'classic';
    document.getElementById('inv-story').value = inv.story || '';
    document.getElementById('inv-maxcap').value = inv.maxCapacity || 300;
    document.getElementById('inv-published').checked = Boolean(inv.isPublished);

    const publicUrl = `${window.location.origin}${window.location.pathname}?invitation=${encodeURIComponent(inv.slug)}&ws=${encodeURIComponent(this.state.workspaceId)}`;
    document.getElementById('inv-public-url').value = publicUrl;

    // Daftar RSVP masuk
    const rsvpBody = document.getElementById('inv-rsvp-body');
    rsvpBody.innerHTML = d.rsvps.length ? d.rsvps.map((r) => `
      <tr class="border-b border-[#F2ECE2] text-sm">
        <td class="py-3 px-4 font-medium">${this.esc(r.guestName)}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs ${r.attendanceStatus === 'Attending' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
            ${r.attendanceStatus === 'Attending' ? 'Hadir' : 'Tidak Hadir'} (${r.guestCount} org)
          </span>
        </td>
        <td class="py-3 px-4 text-xs text-[#6E5F53]">"${this.esc(r.message)}"</td>
        <td class="py-3 px-4 text-right"><button onclick="App.deleteItem('rsvps', '${r.id}', 'Hapus ucapan RSVP ini?')" class="text-xs text-rose-600 hover:underline">Hapus</button></td>
      </tr>
    `).join('') : '<tr><td colspan="4" class="text-center py-6 text-sm text-[#6E5F53]">Belum ada konfirmasi RSVP dari undangan digital.</td></tr>';
  },

  async saveInvitationSettings(e) {
    e.preventDefault();
    const inv = this.state.workspaceData.invitation;
    inv.slug = document.getElementById('inv-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'our-wedding';
    inv.template = document.getElementById('inv-template').value;
    inv.story = document.getElementById('inv-story').value.trim();
    inv.maxCapacity = Number(document.getElementById('inv-maxcap').value) || 300;
    inv.isPublished = document.getElementById('inv-published').checked;
    await this.persistData('Pengaturan undangan digital berhasil disimpan!');
  },

  copyInvitationLink() {
    const inp = document.getElementById('inv-public-url');
    navigator.clipboard.writeText(inp.value);
    this.toast('Tautan undangan publik disalin ke clipboard!', 'success');
  },

  shareInvitationWhatsApp() {
    const p = this.state.workspaceData.profile;
    const url = document.getElementById('inv-public-url').value;
    const msg = `Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan ${p.groomNickname} & ${p.brideNickname}.\n\nSilakan buka undangan digital kami pada tautan berikut:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  },

  previewPublicInvitation() {
    this.renderPublicInvitationView(this.state.workspaceData, true);
  },

  async openPublicInvitationBySlug(slug, wsHint = null) {
    let wsId = wsHint || await window.syncEngine.findWorkspaceBySlug(slug);
    if (!wsId) wsId = 'WP-DEMO-2026';
    this.state.publicTargetWsId = wsId;

    window.syncEngine.subscribeWorkspace(wsId, (data) => {
      if (!data) {
        if (wsId === 'WP-DEMO-2026') {
          data = window.createDefaultWorkspaceData(wsId, null);
        } else {
          document.getElementById('pub-inv-container').innerHTML = '<div class="p-12 text-center">Undangan tidak ditemukan atau belum dipublikasikan.</div>';
          this.switchView('public_invitation');
          return;
        }
      }
      this.renderPublicInvitationView(data, false);
    });
  },

  renderPublicInvitationView(data, isPreview = false) {
    this.switchView('public_invitation');
    const p = data.profile;
    const inv = data.invitation;
    const container = document.getElementById('pub-inv-container');

    if (!inv.isPublished && !isPreview) {
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-6 text-center">
          <div class="luxury-card p-10 max-w-md">
            <h2 class="font-serif-luxury text-2xl font-bold mb-2">Undangan Belum Dipublikasikan</h2>
            <p class="text-sm text-[#6E5F53]">Pasangan belum mengaktifkan akses publik untuk undangan ini.</p>
          </div>
        </div>`;
      return;
    }

    const themeMap = {
      classic: 'inv-theme-classic',
      luxury: 'inv-theme-luxury',
      minimalist: 'inv-theme-minimalist',
      floral: 'inv-theme-floral'
    };

    container.className = `min-h-screen ${themeMap[inv.template] || 'inv-theme-classic'}`;
    container.innerHTML = `
      ${isPreview ? `
        <div class="sticky top-0 z-50 bg-[#463B32] text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <span>Mode Preview Undangan (${inv.template.toUpperCase()})</span>
          <button onclick="App.switchView('app')" class="px-3 py-1 rounded bg-[#C5A46D] text-white font-medium">Kembali ke Dashboard</button>
        </div>` : ''}
      <section class="max-w-3xl mx-auto px-5 py-14 text-center space-y-8">
        <p class="uppercase tracking-[0.28em] text-xs text-[#C5A46D] font-semibold">The Wedding Celebration Of</p>
        <div class="w-44 h-44 mx-auto rounded-full overflow-hidden border-4 border-[#C5A46D]/60 shadow-xl">
          <img src="${this.esc(p.couplePhoto || inv.coverPhoto)}" class="w-full h-full object-cover" alt="Couple">
        </div>
        <div>
          <h1 class="font-serif-luxury text-4xl sm:text-5xl font-bold">${this.esc(p.groomName)} <span class="text-[#C5A46D]">&amp;</span> ${this.esc(p.brideName)}</h1>
          <p class="text-sm opacity-80 mt-3">${this.formatDateID(p.weddingDate)} • ${this.esc(p.venueName)}</p>
        </div>

        <div class="grid grid-cols-4 gap-3 max-w-md mx-auto">
          ${['days:Hari', 'hours:Jam', 'minutes:Menit', 'seconds:Detik'].map((it) => {
            const [k, lbl] = it.split(':');
            return `<div class="inv-card luxury-card p-3"><div id="pub-cd-${k}" class="text-2xl font-serif-luxury font-bold text-[#C5A46D]">00</div><div class="text-[11px] opacity-75">${lbl}</div></div>`;
          }).join('')}
        </div>

        <div class="inv-card luxury-card p-6 sm:p-8 text-center space-y-4">
          <h3 class="font-serif-luxury text-2xl font-bold text-[#C5A46D]">Kisah &amp; Doa</h3>
          <p class="text-sm leading-relaxed opacity-85">${this.esc(inv.story)}</p>
          <div class="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[#C5A46D]/25 text-sm">
            <div><p class="font-semibold text-[#C5A46D]">Putra Dari</p><p class="opacity-85">${this.esc(p.groomParents || '-')}</p></div>
            <div><p class="font-semibold text-[#C5A46D]">Putri Dari</p><p class="opacity-85">${this.esc(p.brideParents || '-')}</p></div>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="inv-card luxury-card p-6">
            <h4 class="font-serif-luxury text-xl font-bold text-[#C5A46D]">Akad Nikah</h4>
            <p class="text-sm mt-2">${this.formatDateID(p.akadDate)}</p>
            <p class="text-sm font-medium">${this.esc(p.akadTime)} WIB - Selesai</p>
          </div>
          <div class="inv-card luxury-card p-6">
            <h4 class="font-serif-luxury text-xl font-bold text-[#C5A46D]">Resepsi</h4>
            <p class="text-sm mt-2">${this.formatDateID(p.receptionDate)}</p>
            <p class="text-sm font-medium">${this.esc(p.receptionTime)} WIB - Selesai</p>
          </div>
        </div>

        <div class="inv-card luxury-card p-6 space-y-3">
          <h4 class="font-serif-luxury text-xl font-bold text-[#C5A46D]">Lokasi Acara</h4>
          <p class="font-medium">${this.esc(p.venueName)}</p>
          <p class="text-xs opacity-80">${this.esc(p.venueAddress)}</p>
          ${p.googleMapsUrl ? `<a href="${this.esc(p.googleMapsUrl)}" target="_blank" class="inline-block btn-gold px-5 py-2.5 text-xs mt-2">Buka Google Maps</a>` : ''}
        </div>

        <div class="inv-card luxury-card p-6 sm:p-8 text-left">
          <h3 class="font-serif-luxury text-2xl font-bold text-center text-[#C5A46D] mb-4">Konfirmasi Kehadiran (RSVP) &amp; Ucapan</h3>
          <form onsubmit="App.submitPublicRsvp(event, '${this.esc(data.meta.workspaceId)}')" class="space-y-3">
            <div><label class="text-xs font-medium">Nama Lengkap *</label><input id="pub-rsvp-name" required class="input-luxury mt-1" placeholder="Nama Anda"></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-medium">Kehadiran</label>
                <select id="pub-rsvp-status" class="input-luxury mt-1">
                  <option value="Attending">Hadir</option>
                  <option value="Not Attending">Berhalangan Hadir</option>
                </select>
              </div>
              <div><label class="text-xs font-medium">Jumlah Tamu</label><input type="number" id="pub-rsvp-count" min="1" max="10" value="2" class="input-luxury mt-1"></div>
            </div>
            <div><label class="text-xs font-medium">Ucapan &amp; Doa Restu *</label><textarea id="pub-rsvp-msg" required rows="3" class="input-luxury mt-1" placeholder="Tuliskan doa terbaik untuk kedua mempelai..."></textarea></div>
            <button type="submit" class="btn-gold w-full py-2.5 text-sm">Kirim RSVP &amp; Ucapan</button>
          </form>

          <div class="mt-6 pt-5 border-t border-[#C5A46D]/25 space-y-3 max-h-72 overflow-y-auto">
            ${(data.rsvps || []).map((r) => `
              <div class="p-3 rounded-xl bg-black/5 border border-[#C5A46D]/20">
                <div class="flex items-center justify-between text-xs">
                  <strong class="text-[#C5A46D]">${this.esc(r.guestName)}</strong>
                  <span class="opacity-75">${r.attendanceStatus === 'Attending' ? 'Hadir' : 'Tidak Hadir'}</span>
                </div>
                <p class="text-xs mt-1 opacity-90">${this.esc(r.message)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
    this.startCountdown(`${p.akadDate || p.weddingDate}T${p.akadTime || '08:00'}:00`, 'pub-cd');
  },

  async submitPublicRsvp(e, wsId) {
    e.preventDefault();
    const guestName = document.getElementById('pub-rsvp-name').value.trim();
    const attendanceStatus = document.getElementById('pub-rsvp-status').value;
    const guestCount = Number(document.getElementById('pub-rsvp-count').value) || 1;
    const message = document.getElementById('pub-rsvp-msg').value.trim();

    const rsvpItem = {
      id: this.uid('rsvp'),
      guestName,
      attendanceStatus,
      guestCount,
      message,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const notifItem = {
      id: this.uid('ntf'),
      title: 'RSVP Baru Masuk',
      message: `${guestName} mengisi RSVP (${attendanceStatus === 'Attending' ? 'Hadir ' + guestCount + ' org' : 'Tidak Hadir'}).`,
      type: 'rsvp',
      read: false,
      createdAt: new Date().toISOString()
    };

    const ok = await window.syncEngine.submitPublicRsvp(wsId, rsvpItem, notifItem);
    if (ok) {
      this.toast('Terima kasih! RSVP dan ucapan Anda telah terkirim secara real-time.', 'success');
    } else {
      this.toast('Gagal mengirim RSVP. Pastikan workspace aktif.', 'error');
    }
  },

  // --- 12. NOTIFICATIONS ---
  renderNotifications() {
    const list = this.state.workspaceData?.notifications || [];
    const unread = list.filter((n) => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = unread;
      badge.classList.toggle('hidden', unread === 0);
    }
    const cont = document.getElementById('notif-list');
    if (!cont) return;
    cont.innerHTML = list.length ? list.slice(0, 10).map((n) => `
      <div onclick="App.markNotifRead('${n.id}')" class="p-3 border-b border-[#F2ECE2] cursor-pointer hover:bg-[#FAF7F2] ${n.read ? 'opacity-60' : 'bg-[#FDF9F1]'}">
        <p class="text-xs font-semibold text-[#463B32]">${this.esc(n.title)}</p>
        <p class="text-xs text-[#6E5F53] mt-0.5">${this.esc(n.message)}</p>
      </div>
    `).join('') : '<p class="p-4 text-xs text-center text-[#6E5F53]">Belum ada notifikasi.</p>';
  },

  toggleNotifDropdown() {
    document.getElementById('notif-dropdown')?.classList.toggle('hidden');
  },

  async markNotifRead(id) {
    const n = this.state.workspaceData.notifications.find((x) => x.id === id);
    if (n) {
      n.read = true;
      await this.persistData();
    }
  },

  async markAllNotifRead() {
    this.state.workspaceData.notifications.forEach((n) => { n.read = true; });
    await this.persistData('Semua notifikasi ditandai sudah dibaca.');
  },

  // --- 13. REPORTS & EXPORT ---
  renderReports() {
    const d = this.state.workspaceData;
    const totalBudget = Number(d.profile.totalBudget) || 0;
    const totalEst = d.budgets.reduce((s, b) => s + (Number(b.estimatedCost) || 0), 0);
    const totalAct = d.budgets.reduce((s, b) => s + (Number(b.actualCost) || 0), 0);
    const totalBooking = d.bookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const totalPaid = d.payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const doneChk = d.checklists.filter((c) => c.status === 'Completed').length;
    const overChk = d.checklists.filter((c) => c.status === 'Overdue').length;
    const attPax = d.guests.filter((g) => g.rsvpStatus === 'Attending').reduce((s, g) => s + (Number(g.guestCount) || 1), 0);

    document.getElementById('rep-grid').innerHTML = `
      <div class="luxury-card p-5 space-y-2">
        <h4 class="font-serif-luxury font-bold text-lg text-[#C5A46D]">A. Laporan Anggaran</h4>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>Total Budget:</span><strong>${this.rupiah(totalBudget)}</strong></div>
          <div class="flex justify-between"><span>Total Estimasi:</span><span>${this.rupiah(totalEst)}</span></div>
          <div class="flex justify-between"><span>Total Aktual:</span><strong>${this.rupiah(totalAct)}</strong></div>
          <div class="flex justify-between"><span>Sisa Anggaran:</span><strong class="text-emerald-700">${this.rupiah(totalBudget - totalAct)}</strong></div>
        </div>
      </div>
      <div class="luxury-card p-5 space-y-2">
        <h4 class="font-serif-luxury font-bold text-lg text-[#C5A46D]">B. Laporan Tamu &amp; RSVP</h4>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>Total Undangan:</span><strong>${d.guests.length}</strong></div>
          <div class="flex justify-between"><span>Konfirmasi Hadir:</span><strong class="text-emerald-700">${attPax} Orang</strong></div>
          <div class="flex justify-between"><span>RSVP Online Masuk:</span><strong>${d.rsvps.length} Respon</strong></div>
          <div class="flex justify-between"><span>Target Kapasitas:</span><span>${d.profile.targetGuests} Orang</span></div>
        </div>
      </div>
      <div class="luxury-card p-5 space-y-2">
        <h4 class="font-serif-luxury font-bold text-lg text-[#C5A46D]">C. Laporan Checklist</h4>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>Total Pekerjaan:</span><strong>${d.checklists.length}</strong></div>
          <div class="flex justify-between"><span>Selesai:</span><strong class="text-emerald-700">${doneChk}</strong></div>
          <div class="flex justify-between"><span>Belum Selesai:</span><span>${d.checklists.length - doneChk}</span></div>
          <div class="flex justify-between"><span>Terlambat (Overdue):</span><strong class="text-rose-600">${overChk}</strong></div>
        </div>
      </div>
      <div class="luxury-card p-5 space-y-2">
        <h4 class="font-serif-luxury font-bold text-lg text-[#C5A46D]">D. Laporan Vendor &amp; Pembayaran</h4>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>Total Vendor Terdaftar:</span><strong>${d.vendors.length}</strong></div>
          <div class="flex justify-between"><span>Total Nilai Kontrak:</span><strong>${this.rupiah(totalBooking)}</strong></div>
          <div class="flex justify-between"><span>Total Sudah Dibayar:</span><strong class="text-emerald-700">${this.rupiah(totalPaid)}</strong></div>
          <div class="flex justify-between"><span>Sisa Tagihan Vendor:</span><strong class="text-amber-700">${this.rupiah(Math.max(0, totalBooking - totalPaid))}</strong></div>
        </div>
      </div>
    `;
  },

  exportFullReportCSV() {
    const d = this.state.workspaceData;
    const rows = [['Modul', 'Item', 'Kategori/Status', 'Nilai/Detail']];
    d.budgets.forEach((b) => rows.push(['Anggaran', b.itemName, b.category, `Estimasi: ${b.estimatedCost} | Aktual: ${b.actualCost}`]));
    d.checklists.forEach((c) => rows.push(['Checklist', c.title, c.status, `Deadline: ${c.dueDate}`]));
    d.guests.forEach((g) => rows.push(['Tamu', g.name, g.rsvpStatus, `${g.guestCount} orang (${g.category})`]));
    d.payments.forEach((p) => rows.push(['Pembayaran', p.label, p.status, `Nominal: ${p.amount} | Jatuh Tempo: ${p.dueDate}`]));
    this.downloadCSV(rows, `laporan-wedding-${this.state.workspaceId}.csv`);
  },

  downloadCSV(rows, filename) {
    const csvContent = '\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  // --- 14. SETTINGS & REAL-TIME CLOUD COLLABORATION ---
  renderSettings() {
    const d = this.state.workspaceData;
    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(this.state.workspaceId)}`;
    document.getElementById('set-ws-code').textContent = this.state.workspaceId;
    document.getElementById('set-join-url').value = joinUrl;

    const memEl = document.getElementById('set-members-list');
    const members = Object.values(d.members || {});
    memEl.innerHTML = members.map((m) => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-[#F8F5EF] border border-[#E8DFD1]">
        <div>
          <p class="text-sm font-medium text-[#463B32]">${this.esc(m.name)}</p>
          <p class="text-xs text-[#6E5F53]">${this.esc(m.email)}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${m.role === 'Owner' ? 'bg-[#C5A46D] text-white' : 'bg-white border border-[#C5A46D] text-[#463B32]'}">${this.esc(m.role)}</span>
      </div>
    `).join('');

    const cfg = window.syncEngine.getSavedFirebaseConfig();
    if (cfg) {
      document.getElementById('set-fb-json').value = JSON.stringify(cfg, null, 2);
    }
  },

  copyJoinLink() {
    const inp = document.getElementById('set-join-url');
    navigator.clipboard.writeText(inp.value);
    this.toast('Tautan kolaborasi pasangan disalin! Kirim ke pasangan Anda.', 'success');
  },

  async saveFirebaseConfigFromUI(e) {
    e.preventDefault();
    const raw = document.getElementById('set-fb-json').value.trim();
    try {
      // Izinkan user menempelkan format JS object maupun JSON murni
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        const cleaned = raw
          .replace(/const\s+\w+\s*=\s*/, '')
          .replace(/;\s*$/, '')
          .replace(/(\w+)\s*:/g, '"$1":')
          .replace(/'/g, '"');
        parsed = JSON.parse(cleaned);
      }
      if (!parsed.apiKey || !parsed.databaseURL) {
        return this.toast('Konfigurasi harus memiliki minimal apiKey dan databaseURL.', 'error');
      }
      window.syncEngine.saveFirebaseConfig(parsed);
      window.syncEngine.initEngine();
      // Sinkronkan workspace aktif langsung ke Firebase agar pasangan langsung bisa melihatnya
      if (this.state.workspaceData) {
        await window.syncEngine.writeWorkspace(this.state.workspaceId, this.state.workspaceData);
      }
      this.connectWorkspace(this.state.workspaceId);
      this.toast('Firebase Cloud Real-Time aktif! Data workspace telah disinkronkan ke cloud.', 'success');
    } catch (err) {
      this.toast('Format JSON Firebase Config tidak valid. Pastikan kurung kurawal lengkap.', 'error');
    }
  },

  // --- MODAL & DELETE HELPERS ---
  openModal(title, bodyHtml) {
    document.getElementById('global-modal-title').textContent = title;
    document.getElementById('global-modal-body').innerHTML = bodyHtml;
    document.getElementById('global-modal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  closeModal() {
    document.getElementById('global-modal').classList.add('hidden');
  },

  deleteItem(collectionKey, id, confirmText) {
    this.openModal('Konfirmasi Hapus', `
      <p class="text-sm text-[#5E5045] mb-5">${this.esc(confirmText)}</p>
      <div class="flex justify-end gap-2">
        <button onclick="App.closeModal()" class="btn-outline-gold px-4 py-2 text-sm">Batal</button>
        <button onclick="App.confirmDelete('${collectionKey}', '${id}')" class="px-5 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700">Ya, Hapus</button>
      </div>
    `);
  },

  async confirmDelete(collectionKey, id) {
    this.state.workspaceData[collectionKey] = this.state.workspaceData[collectionKey].filter((x) => x.id !== id);
    this.closeModal();
    await this.persistData('Data berhasil dihapus.');
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
      success: 'bg-[#463B32] text-white border-l-4 border-[#C5A46D]',
      error: 'bg-rose-700 text-white border-l-4 border-rose-300',
      info: 'bg-white text-[#463B32] border border-[#C5A46D]'
    };
    const el = document.createElement('div');
    el.className = `toast-enter px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm max-w-sm ${colors[type] || colors.info}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
