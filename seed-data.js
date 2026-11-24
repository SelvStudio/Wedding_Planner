// Data awal realistis untuk Demo & Inisialisasi Workspace Baru
window.WEDDING_CONSTANTS = {
  checklistCategories: [
    'Persiapan Administrasi', 'Penentuan Tanggal Pernikahan', 'Pemilihan Venue',
    'Catering', 'Dekorasi', 'Busana Pengantin', 'Makeup Artist', 'Fotografi',
    'Videografi', 'Undangan', 'Souvenir', 'Hiburan', 'Dokumentasi',
    'Transportasi', 'Persiapan Akad', 'Persiapan Resepsi'
  ],
  budgetCategories: [
    'Venue dan Gedung', 'Catering', 'Dekorasi', 'Busana Pengantin',
    'Makeup Artist', 'Fotografi', 'Videografi', 'Undangan', 'Souvenir',
    'Entertainment', 'Transportasi', 'Administrasi', 'Mahar', 'Hantaran', 'Biaya Tambahan'
  ],
  vendorCategories: [
    'Wedding Organizer', 'Gedung', 'Catering', 'Dekorasi', 'Makeup Artist',
    'Fotografer', 'Videografer', 'Entertainment', 'Undangan', 'Souvenir',
    'Busana Pengantin', 'Transportasi'
  ],
  guestCategories: ['Keluarga', 'Teman', 'Rekan Kerja', 'Tetangga', 'Relasi', 'Lainnya'],
  inspirationCategories: [
    'Wedding Decoration', 'Wedding Dress', 'Wedding Makeup', 'Wedding Invitation',
    'Wedding Photography', 'Wedding Venue', 'Wedding Theme', 'Wedding Souvenir'
  ],
  eventCategories: ['Meeting', 'Vendor Appointment', 'Payment', 'Fitting', 'Administration', 'Wedding Day']
};

window.createDefaultWorkspaceData = function(workspaceId, ownerUser, coupleOverride) {
  const now = new Date();
  const addDays = (d) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };
  const weddingDateStr = addDays(120);
  const groom = (coupleOverride && coupleOverride.groom) || 'Raka Pratama';
  const bride = (coupleOverride && coupleOverride.bride) || 'Nabila Putri';
  const slugBase = `${groom.split(' ')[0]}-${bride.split(' ')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

  return {
    meta: {
      workspaceId: workspaceId,
      workspaceName: `Pernikahan ${groom.split(' ')[0]} & ${bride.split(' ')[0]}`,
      ownerEmail: ownerUser ? ownerUser.email : 'owner@weddingplanner.id',
      ownerName: ownerUser ? ownerUser.name : groom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    members: {
      [ownerUser ? ownerUser.uid : 'owner_1']: {
        uid: ownerUser ? ownerUser.uid : 'owner_1',
        name: ownerUser ? ownerUser.name : groom,
        email: ownerUser ? ownerUser.email : 'owner@weddingplanner.id',
        role: 'Owner',
        joinedAt: new Date().toISOString()
      }
    },
    profile: {
      groomName: groom,
      groomNickname: groom.split(' ')[0],
      groomParents: 'Bpk. Hendra Pratama & Ibu Sari Dewi',
      brideName: bride,
      brideNickname: bride.split(' ')[0],
      brideParents: 'Bpk. Budi Santoso & Ibu Ratna Kusuma',
      couplePhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
      description: 'Dua hati yang bertumbuh bersama menuju ikatan suci yang penuh berkah dan kebahagiaan.',
      weddingDate: weddingDateStr,
      akadDate: weddingDateStr,
      akadTime: '08:00',
      receptionDate: weddingDateStr,
      receptionTime: '11:00',
      venueName: 'The Hermitage Ballroom Jakarta',
      venueAddress: 'Jl. Cilacap No. 1, Menteng, Jakarta Pusat',
      googleMapsUrl: 'https://maps.google.com/?q=Menteng+Jakarta+Pusat',
      weddingTheme: 'Luxury Champagne & Ivory Classic',
      themeColor: '#C5A46D',
      targetGuests: 300,
      totalBudget: 185000000
    },
    checklists: [
      { id: 'chk_1', title: 'Menentukan Tanggal Akad & Resepsi', category: 'Penentuan Tanggal Pernikahan', description: 'Musyawarah keluarga besar untuk tanggal baik.', startDate: addDays(-30), dueDate: addDays(-20), priority: 'Urgent', status: 'Completed', assignee: 'Bersama', notes: 'Sudah disepakati kedua keluarga.' },
      { id: 'chk_2', title: 'Booking Gedung & Down Payment Venue', category: 'Pemilihan Venue', description: 'Survei kapasitas 300 pax dan parkir.', startDate: addDays(-25), dueDate: addDays(-10), priority: 'High', status: 'Completed', assignee: groom.split(' ')[0], notes: 'DP 30% sudah dibayar.' },
      { id: 'chk_3', title: 'Pengurusan Surat N1-N4 KUA', category: 'Persiapan Administrasi', description: 'Lengkapi berkas pengantar RT/RW dan Kelurahan.', startDate: addDays(-10), dueDate: addDays(-2), priority: 'Urgent', status: 'In Progress', assignee: groom.split(' ')[0], notes: 'Tinggal tanda tangan kelurahan.' },
      { id: 'chk_4', title: 'Test Food Menu Utama Catering', category: 'Catering', description: 'Coba menu prasmanan dan 4 gubukan favorit.', startDate: addDays(-5), dueDate: addDays(5), priority: 'High', status: 'In Progress', assignee: bride.split(' ')[0], notes: 'Jadwal hari Sabtu pukul 13.00.' },
      { id: 'chk_5', title: 'Finalisasi Konsep Pelaminan & Bunga', category: 'Dekorasi', description: 'Moodboard Champagne Gold & Ivory Roses.', startDate: addDays(0), dueDate: addDays(14), priority: 'High', status: 'To Do', assignee: bride.split(' ')[0], notes: 'Konfirmasi panjang panggung.' },
      { id: 'chk_6', title: 'Fitting Kebaya Akad & Jas Pengantin', category: 'Busana Pengantin', description: 'Pengukuran ulang dan penyesuaian payet.', startDate: addDays(5), dueDate: addDays(21), priority: 'Medium', status: 'To Do', assignee: 'Bersama', notes: 'Bawa sepatu hak tinggi saat fitting.' },
      { id: 'chk_7', title: 'Trial Makeup Akad & Resepsi', category: 'Makeup Artist', description: 'Pilih look soft glam timeless.', startDate: addDays(10), dueDate: addDays(28), priority: 'Medium', status: 'To Do', assignee: bride.split(' ')[0], notes: '' },
      { id: 'chk_8', title: 'Sesi Foto Prewedding Outdoor', category: 'Fotografi', description: 'Konsep casual & formal di Kebun Raya.', startDate: addDays(12), dueDate: addDays(30), priority: 'Medium', status: 'To Do', assignee: 'Bersama', notes: '' },
      { id: 'chk_9', title: 'Briefing Alur Video Cinematic', category: 'Videografi', description: 'Pilih lagu latar dan daftar wawancara keluarga.', startDate: addDays(15), dueDate: addDays(35), priority: 'Low', status: 'To Do', assignee: groom.split(' ')[0], notes: '' },
      { id: 'chk_10', title: 'Finalisasi Daftar Tamu VIP & Keluarga', category: 'Undangan', description: 'Validasi nomor WhatsApp dan alamat kirim.', startDate: addDays(7), dueDate: addDays(40), priority: 'High', status: 'In Progress', assignee: 'Bersama', notes: '' },
      { id: 'chk_11', title: 'Pemesanan 300 Pcs Souvenir Reed Diffuser', category: 'Souvenir', description: 'Custom tag inisial pengantin.', startDate: addDays(20), dueDate: addDays(50), priority: 'Medium', status: 'To Do', assignee: bride.split(' ')[0], notes: '' },
      { id: 'chk_12', title: 'Pemilihan Lagu Akustik & MC Resepsi', category: 'Hiburan', description: 'Susun playlist entrance hingga akhir acara.', startDate: addDays(25), dueDate: addDays(60), priority: 'Low', status: 'To Do', assignee: groom.split(' ')[0], notes: '' },
      { id: 'chk_13', title: 'Menyiapkan Mahar & Logam Mulia', category: 'Persiapan Akad', description: 'Cetak bingkai mahar dan verifikasi berat.', startDate: addDays(15), dueDate: addDays(45), priority: 'High', status: 'To Do', assignee: groom.split(' ')[0], notes: '' },
      { id: 'chk_14', title: 'Sewa Mobil Pengantin & Transport Keluarga', category: 'Transportasi', description: 'Koordinasi jam jemput hotel ke venue.', startDate: addDays(30), dueDate: addDays(75), priority: 'Medium', status: 'To Do', assignee: groom.split(' ')[0], notes: '' },
      { id: 'chk_15', title: 'Technical Meeting Seluruh Vendor', category: 'Persiapan Resepsi', description: 'Koordinasi rundown menit demi menit bersama WO.', startDate: addDays(85), dueDate: addDays(100), priority: 'Urgent', status: 'To Do', assignee: 'Bersama', notes: '' }
    ],
    budgets: [
      { id: 'bdg_1', itemName: 'Sewa Ballroom & Fasilitas Akad', category: 'Venue dan Gedung', vendorId: 'vnd_1', estimatedCost: 45000000, actualCost: 45000000, notes: 'Paket Full Day + Ruang Rias' },
      { id: 'bdg_2', itemName: 'Paket Catering 300 Pax + 4 Gubukan', category: 'Catering', vendorId: 'vnd_2', estimatedCost: 60000000, actualCost: 63500000, notes: 'Penambahan 1 gubukan Zuppa Soup' },
      { id: 'bdg_3', itemName: 'Dekorasi Pelaminan, Lorong & Gate', category: 'Dekorasi', vendorId: 'vnd_3', estimatedCost: 28000000, actualCost: 27500000, notes: 'Fresh flowers rose & baby breath' },
      { id: 'bdg_4', itemName: 'Busana Pengantin & Orang Tua', category: 'Busana Pengantin', vendorId: 'vnd_5', estimatedCost: 12000000, actualCost: 12000000, notes: '2 pasang busana akad & resepsi' },
      { id: 'bdg_5', itemName: 'MUA Pengantin & 2 Ibu', category: 'Makeup Artist', vendorId: '', estimatedCost: 9500000, actualCost: 9500000, notes: 'Termasuk retouch resepsi' },
      { id: 'bdg_6', itemName: 'Fotografi & Album Kolase Eksklusif', category: 'Fotografi', vendorId: 'vnd_4', estimatedCost: 9000000, actualCost: 9000000, notes: '2 fotografer + cetak canvas' },
      { id: 'bdg_7', itemName: 'Videografi Same Day Edit (SDE)', category: 'Videografi', vendorId: 'vnd_4', estimatedCost: 6000000, actualCost: 6000000, notes: 'Teaser 1 menit + full doc' },
      { id: 'bdg_8', itemName: 'Cetak Undangan Hardcover 100 Pcs', category: 'Undangan', vendorId: '', estimatedCost: 3000000, actualCost: 2800000, notes: 'Foil emas + amplop kalkir' },
      { id: 'bdg_9', itemName: 'Souvenir Reed Diffuser 300 Pcs', category: 'Souvenir', vendorId: '', estimatedCost: 4500000, actualCost: 4500000, notes: 'Custom box pita satin' },
      { id: 'bdg_10', itemName: 'Mahar, Cincin & Administrasi KUA', category: 'Mahar', vendorId: '', estimatedCost: 8000000, actualCost: 7200000, notes: 'Cincin couple + biaya pencatatan' }
    ],
    expenses: [
      { id: 'exp_1', budgetId: 'bdg_1', description: 'DP Sewa Ballroom', amount: 15000000, transactionDate: addDays(-25), paymentMethod: 'Transfer BCA', notes: 'Kwitansi #001' },
      { id: 'exp_2', budgetId: 'bdg_2', description: 'Booking Fee Catering', amount: 15000000, transactionDate: addDays(-18), paymentMethod: 'Transfer Mandiri', notes: 'Lock tanggal acara' },
      { id: 'exp_3', budgetId: 'bdg_3', description: 'DP Dekorasi Tahap 1', amount: 10000000, transactionDate: addDays(-12), paymentMethod: 'Transfer BCA', notes: 'Desain 3D disetujui' },
      { id: 'exp_4', budgetId: 'bdg_6', description: 'DP Paket Foto & Video', amount: 5000000, transactionDate: addDays(-8), paymentMethod: 'Transfer QRIS', notes: 'Termasuk prewedding' },
      { id: 'exp_5', budgetId: 'bdg_10', description: 'Pembelian Cincin Kawin', amount: 6500000, transactionDate: addDays(-5), paymentMethod: 'Kartu Debit', notes: 'Sudah diukir nama' }
    ],
    guests: [
      { id: 'gst_1', name: 'Bpk. Ahmad Fauzi & Ibu', phone: '081211110001', email: 'ahmad@example.com', address: 'Jakarta Selatan', category: 'Keluarga', invitedBy: 'Mempelai Pria', guestCount: 2, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Attending', notes: 'Meja VIP A1' },
      { id: 'gst_2', name: 'Dr. Ratna Wijaya', phone: '081211110002', email: 'ratna@example.com', address: 'Menteng, Jakarta', category: 'Relasi', invitedBy: 'Mempelai Wanita', guestCount: 2, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Attending', notes: 'Tamu VIP' },
      { id: 'gst_3', name: 'Dimas Anggara', phone: '081211110003', email: 'dimas@example.com', address: 'Bandung', category: 'Teman', invitedBy: 'Mempelai Pria', guestCount: 2, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Pending', notes: 'Teman Kuliah' },
      { id: 'gst_4', name: 'Sinta Larasati', phone: '081211110004', email: 'sinta@example.com', address: 'Depok', category: 'Rekan Kerja', invitedBy: 'Mempelai Wanita', guestCount: 1, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Attending', notes: 'Tim Divisi HR' },
      { id: 'gst_5', name: 'Keluarga H. Ridwan', phone: '081211110005', email: '', address: 'Karawang', category: 'Keluarga', invitedBy: 'Mempelai Pria', guestCount: 4, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Attending', notes: 'Rombongan keluarga' },
      { id: 'gst_6', name: 'Andi Prasetyo', phone: '081211110006', email: '', address: 'Bekasi', category: 'Tetangga', invitedBy: 'Mempelai Wanita', guestCount: 2, invitationStatus: 'Belum Dikirim', rsvpStatus: 'Pending', notes: 'Antar undangan fisik' },
      { id: 'gst_7', name: 'Maya Kartika', phone: '081211110007', email: 'maya@example.com', address: 'Surabaya', category: 'Teman', invitedBy: 'Mempelai Wanita', guestCount: 1, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Not Attending', notes: 'Sedang dinas luar kota' },
      { id: 'gst_8', name: 'Ir. Bagus Setiawan', phone: '081211110008', email: '', address: 'Tangerang', category: 'Rekan Kerja', invitedBy: 'Mempelai Pria', guestCount: 2, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Attending', notes: '' },
      { id: 'gst_9', name: 'Nadia Kusuma & Pasangan', phone: '081211110009', email: '', address: 'Jakarta Timur', category: 'Teman', invitedBy: 'Mempelai Wanita', guestCount: 2, invitationStatus: 'Sudah Dikirim', rsvpStatus: 'Pending', notes: '' },
      { id: 'gst_10', name: 'Ibu Sri Mulyani (Tetangga)', phone: '081211110010', email: '', address: 'Jakarta Pusat', category: 'Tetangga', invitedBy: 'Mempelai Pria', guestCount: 2, invitationStatus: 'Belum Dikirim', rsvpStatus: 'Pending', notes: '' }
    ],
    vendors: [
      { id: 'vnd_1', name: 'The Hermitage Ballroom', category: 'Gedung', contactPerson: 'Ibu Clarissa', phone: '081199001122', email: 'events@hermitage.example', address: 'Menteng, Jakarta Pusat', instagram: '@hermitageevents', website: 'https://example.com', priceOffer: 45000000, status: 'Booked', isFavorite: true, description: 'Ballroom klasik kolonial dengan kapasitas hingga 400 tamu.', logoPath: '' },
      { id: 'vnd_2', name: 'Puspita Sawargi Catering', category: 'Catering', contactPerson: 'Pak Hendro', phone: '081199002233', email: 'sales@puspitacatering.example', address: 'Tebet, Jakarta Selatan', instagram: '@puspitacatering', website: '', priceOffer: 63500000, status: 'Booked', isFavorite: true, description: 'Menu nusantara dan internasional premium beserta dekorasi buffet.', logoPath: '' },
      { id: 'vnd_3', name: 'Aurelia Florist & Decor', category: 'Dekorasi', contactPerson: 'Mba Tania', phone: '081199003344', email: 'hello@aureliadecor.example', address: 'Kemang, Jakarta Selatan', instagram: '@aureliadecor', website: '', priceOffer: 27500000, status: 'Booked', isFavorite: true, description: 'Spesialis dekorasi romantic garden & classic luxury.', logoPath: '' },
      { id: 'vnd_4', name: 'Lumina Visual Studio', category: 'Fotografer', contactPerson: 'Mas Reza', phone: '081199004455', email: 'booking@luminavisual.example', address: 'Senopati, Jakarta Selatan', instagram: '@luminavisual', website: '', priceOffer: 15000000, status: 'Booked', isFavorite: false, description: 'Dokumentasi foto dan video sinematik timeless.', logoPath: '' },
      { id: 'vnd_5', name: 'Atelier Srikandi Kebaya', category: 'Busana Pengantin', contactPerson: 'Desainer Nita', phone: '081199005566', email: 'atelier@srikandi.example', address: 'Kebayoran Baru, Jakarta', instagram: '@ateliersrikandi', website: '', priceOffer: 12000000, status: 'Negotiating', isFavorite: true, description: 'Sewa & jahit perdana kebaya modern dan beskap eksklusif.', logoPath: '' }
    ],
    bookings: [
      { id: 'bkg_1', vendorId: 'vnd_1', serviceName: 'Paket Ballroom Akad & Resepsi', bookingDate: addDays(-25), eventDate: weddingDateStr, totalAmount: 45000000, contractNumber: 'CTR-2026-001', status: 'Confirmed', notes: 'Termasuk 2 ruang transit keluarga & sound system standar.' },
      { id: 'bkg_2', vendorId: 'vnd_2', serviceName: 'Catering 300 Pax + 4 Gubukan', bookingDate: addDays(-18), eventDate: weddingDateStr, totalAmount: 63500000, contractNumber: 'CTR-2026-002', status: 'Confirmed', notes: 'Pelunasan maksimal H-14.' },
      { id: 'bkg_3', vendorId: 'vnd_3', serviceName: 'Dekorasi Pelaminan Luxury Ivory', bookingDate: addDays(-12), eventDate: weddingDateStr, totalAmount: 27500000, contractNumber: 'CTR-2026-003', status: 'Confirmed', notes: 'Loading malam H-1 pukul 22.00.' }
    ],
    payments: [
      { id: 'pay_1', bookingId: 'bkg_1', label: 'DP Tahap 1 Ballroom', amount: 15000000, paymentDate: addDays(-25), dueDate: addDays(-25), paymentMethod: 'Transfer Bank BCA', status: 'Paid', proofPath: '', notes: 'Bukti transfer terverifikasi' },
      { id: 'pay_2', bookingId: 'bkg_1', label: 'Termin 2 Ballroom', amount: 15000000, paymentDate: '', dueDate: addDays(6), paymentMethod: 'Transfer Bank BCA', status: 'Pending', proofPath: '', notes: 'Jatuh tempo minggu depan' },
      { id: 'pay_3', bookingId: 'bkg_2', label: 'DP Catering 300 Pax', amount: 15000000, paymentDate: addDays(-18), dueDate: addDays(-18), paymentMethod: 'Transfer Mandiri', status: 'Paid', proofPath: '', notes: 'Sudah diterima Pak Hendro' },
      { id: 'pay_4', bookingId: 'bkg_2', label: 'Termin 2 Catering', amount: 25000000, paymentDate: '', dueDate: addDays(45), paymentMethod: 'Transfer Mandiri', status: 'Pending', proofPath: '', notes: 'Setelah test food final' },
      { id: 'pay_5', bookingId: 'bkg_3', label: 'DP Dekorasi Pelaminan', amount: 10000000, paymentDate: addDays(-12), dueDate: addDays(-12), paymentMethod: 'Transfer BCA', status: 'Paid', proofPath: '', notes: 'Lock tanggal & sketsa 3D' }
    ],
    events: [
      { id: 'evt_1', title: 'Test Food Puspita Catering', category: 'Vendor Appointment', startDatetime: `${addDays(5)}T13:00`, endDatetime: `${addDays(5)}T15:00`, description: 'Mencicipi menu utama dan 4 stall pilihan.' },
      { id: 'evt_2', title: 'Fitting Kebaya & Jas Tahap 1', category: 'Fitting', startDatetime: `${addDays(12)}T11:00`, endDatetime: `${addDays(12)}T13:00`, description: 'At Atelier Srikandi Kebayoran.' },
      { id: 'evt_3', title: 'Urus Berkas KUA Menteng', category: 'Administration', startDatetime: `${addDays(3)}T09:00`, endDatetime: `${addDays(3)}T11:00`, description: 'Membawa berkas N1-N4 dan pas foto.' },
      { id: 'evt_4', title: 'Meeting Konsep Dekorasi', category: 'Meeting', startDatetime: `${addDays(9)}T16:00`, endDatetime: `${addDays(9)}T17:30`, description: 'Review palet warna bunga & lighting.' },
      { id: 'evt_5', title: `Hari Pernikahan ${groom.split(' ')[0]} & ${bride.split(' ')[0]}`, category: 'Wedding Day', startDatetime: `${weddingDateStr}T08:00`, endDatetime: `${weddingDateStr}T14:00`, description: 'Akad Nikah & Resepsi di The Hermitage Ballroom.' }
    ],
    inspirations: [
      { id: 'ins_1', title: 'Pelaminan Klasik Ivory & Gold', category: 'Wedding Decoration', imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80', description: 'Perpaduan bunga putih krem dengan aksen lengkung keemasan.', isFavorite: true },
      { id: 'ins_2', title: 'Gaun & Kebaya Minimalis Elegan', category: 'Wedding Dress', imageUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=700&q=80', description: 'Siluet anggun dengan detail payet halus.', isFavorite: true },
      { id: 'ins_3', title: 'Table Setting Champagne Candlelight', category: 'Wedding Venue', imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=80', description: 'Meja VIP dengan lilin tinggi dan serbet linen.', isFavorite: false },
      { id: 'ins_4', title: 'Buket Bunga Mawar & Dusty Rose', category: 'Wedding Theme', imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80', description: 'Kombinasi mawar putih dan dusty rose.', isFavorite: true },
      { id: 'ins_5', title: 'Soft Glam Bridal Makeup', category: 'Wedding Makeup', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80', description: 'Riasan natural glowing tahan lama.', isFavorite: false },
      { id: 'ins_6', title: 'Undangan Wax Seal Champagne', category: 'Wedding Invitation', imageUrl: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=700&q=80', description: 'Kertas cotton textured dengan segel lilin emas.', isFavorite: true },
      { id: 'ins_7', title: 'Golden Hour Couple Portrait', category: 'Wedding Photography', imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80', description: 'Referensi pose candid saat matahari terbenam.', isFavorite: false },
      { id: 'ins_8', title: 'Souvenir Kotak Pita Satin', category: 'Wedding Souvenir', imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=700&q=80', description: 'Kemasan kotak ivory dengan pita satin champagne.', isFavorite: false }
    ],
    invitation: {
      slug: slugBase || 'raka-nabila',
      template: 'classic',
      isPublished: true,
      coverPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
      story: 'Pertemuan sederhana di penghujung senja menjadi awal dari perjalanan panjang kami. Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.',
      gallery: [
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=80'
      ],
      maxCapacity: 300
    },
    rsvps: [
      { id: 'rsvp_1', guestName: 'Dr. Ratna Wijaya', attendanceStatus: 'Attending', guestCount: 2, message: 'Selamat menempuh hidup baru Raka & Nabila! Semoga menjadi keluarga sakinah mawaddah warahmah.', createdAt: addDays(-3) },
      { id: 'rsvp_2', guestName: 'Sinta Larasati', attendanceStatus: 'Attending', guestCount: 1, message: 'Lancar sampai hari H ya Nabila sayang! Tidak sabar merayakan hari bahagiamu.', createdAt: addDays(-2) },
      { id: 'rsvp_3', guestName: 'Maya Kartika', attendanceStatus: 'Not Attending', guestCount: 1, message: 'Mohon maaf belum bisa hadir karena tugas kerja di Surabaya, doa terbaik selalu untuk kalian berdua.', createdAt: addDays(-1) }
    ],
    notifications: [
      { id: 'ntf_1', title: 'RSVP Baru Masuk', message: 'Sinta Larasati mengonfirmasi hadir (1 tamu).', type: 'rsvp', read: false, createdAt: new Date().toISOString() },
      { id: 'ntf_2', title: 'Checklist Mendekati Deadline', message: 'Pengurusan Surat N1-N4 KUA perlu segera diselesaikan.', type: 'checklist', read: false, createdAt: new Date().toISOString() },
      { id: 'ntf_3', title: 'Pengingat Pembayaran Vendor', message: 'Termin 2 Ballroom jatuh tempo dalam 6 hari.', type: 'payment', read: false, createdAt: new Date().toISOString() }
    ]
  };
};
