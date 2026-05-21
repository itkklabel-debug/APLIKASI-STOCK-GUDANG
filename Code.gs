// ============================================================
// APLIKASI STOK GUDANG - BACKEND (Google Apps Script)
// ============================================================

// KONFIGURASI
const SPREADSHEET_ID = ''; // Isi dengan ID Google Sheets Anda
const ADMIN_EMAIL = ''; // Email untuk notifikasi

// ============================================================
// WEB APP ENTRY POINT
// ============================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Stok Gudang - Manajemen Stok Barang')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================================
// SETUP - Inisialisasi Sheet
// ============================================================

function setupSheets() {
  const ss = getSpreadsheet();
  
  // Sheet Barang
  let sheetBarang = ss.getSheetByName('Barang');
  if (!sheetBarang) {
    sheetBarang = ss.insertSheet('Barang');
    sheetBarang.appendRow(['ID Barang', 'Nama Barang', 'Stok', 'Satuan', 'Minimum Stok']);
    sheetBarang.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  
  // Sheet Transaksi
  let sheetTransaksi = ss.getSheetByName('Transaksi');
  if (!sheetTransaksi) {
    sheetTransaksi = ss.insertSheet('Transaksi');
    sheetTransaksi.appendRow(['ID Transaksi', 'Tanggal', 'Nama Barang', 'Jumlah', 'Jenis', 'User']);
    sheetTransaksi.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  // Sheet Pengajuan
  let sheetPengajuan = ss.getSheetByName('Pengajuan');
  if (!sheetPengajuan) {
    sheetPengajuan = ss.insertSheet('Pengajuan');
    sheetPengajuan.appendRow(['ID Pengajuan', 'Tanggal', 'Nama Barang', 'Jumlah', 'Status', 'User']);
    sheetPengajuan.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  // Sheet User
  let sheetUser = ss.getSheetByName('User');
  if (!sheetUser) {
    sheetUser = ss.insertSheet('User');
    sheetUser.appendRow(['Username', 'Password', 'Role']);
    sheetUser.getRange(1, 1, 1, 3).setFontWeight('bold');
    
    // Default users
    sheetUser.appendRow(['admin', hashPassword('admin123'), 'admin']);
    sheetUser.appendRow(['staff', hashPassword('staff123'), 'staff']);
    sheetUser.appendRow(['manager', hashPassword('manager123'), 'manager']);
  }
  
  return 'Setup berhasil! Sheets telah dibuat.';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let val = (rawHash[i] + 256) % 256;
    hash += ('0' + val.toString(16)).slice(-2);
  }
  return hash;
}

function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return prefix + '-' + timestamp + '-' + random;
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

// ============================================================
// AUTHENTICATION
// ============================================================

function login(username, password) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('User');
  if (!sheet) return { success: false, message: 'Sheet User tidak ditemukan. Jalankan setupSheets() terlebih dahulu.' };
  
  const data = sheet.getDataRange().getValues();
  const hashedPassword = hashPassword(password);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === hashedPassword) {
      return {
        success: true,
        user: {
          username: data[i][0],
          role: data[i][2]
        }
      };
    }
  }
  
  return { success: false, message: 'Username atau password salah!' };
}

// ============================================================
// BARANG MANAGEMENT
// ============================================================

function getBarang() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barang');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push({
        id: data[i][0],
        nama: data[i][1],
        stok: data[i][2],
        satuan: data[i][3],
        minStok: data[i][4]
      });
    }
  }
  
  return result;
}

function tambahBarang(nama, stok, satuan, minStok) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barang');
  
  // Validasi
  if (!nama || stok === undefined || !satuan) {
    return { success: false, message: 'Semua field harus diisi!' };
  }
  
  if (stok < 0) {
    return { success: false, message: 'Stok tidak boleh negatif!' };
  }
  
  const id = generateId('BRG');
  sheet.appendRow([id, nama, parseInt(stok), satuan, parseInt(minStok) || 0]);
  
  return { success: true, message: 'Barang berhasil ditambahkan!', id: id };
}

function updateBarang(id, nama, stok, satuan, minStok) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barang');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(nama);
      sheet.getRange(i + 1, 3).setValue(parseInt(stok));
      sheet.getRange(i + 1, 4).setValue(satuan);
      sheet.getRange(i + 1, 5).setValue(parseInt(minStok));
      return { success: true, message: 'Barang berhasil diupdate!' };
    }
  }
  
  return { success: false, message: 'Barang tidak ditemukan!' };
}

function hapusBarang(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barang');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Barang berhasil dihapus!' };
    }
  }
  
  return { success: false, message: 'Barang tidak ditemukan!' };
}

function cariBarangByNama(nama) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barang');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toLowerCase() === nama.toLowerCase() || data[i][0] === nama) {
      return {
        id: data[i][0],
        nama: data[i][1],
        stok: data[i][2],
        satuan: data[i][3],
        minStok: data[i][4]
      };
    }
  }
  
  return null;
}

// ============================================================
// TRANSAKSI
// ============================================================

function getTransaksi() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Transaksi');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push({
        id: data[i][0],
        tanggal: data[i][1],
        namaBarang: data[i][2],
        jumlah: data[i][3],
        jenis: data[i][4],
        user: data[i][5]
      });
    }
  }
  
  return result.reverse(); // Terbaru dulu
}

function barangMasuk(namaBarang, jumlah, user) {
  if (!namaBarang || !jumlah || jumlah <= 0) {
    return { success: false, message: 'Data tidak valid!' };
  }
  
  const ss = getSpreadsheet();
  const sheetBarang = ss.getSheetByName('Barang');
  const sheetTransaksi = ss.getSheetByName('Transaksi');
  const dataBarang = sheetBarang.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < dataBarang.length; i++) {
    if (dataBarang[i][1] === namaBarang) {
      const stokBaru = parseInt(dataBarang[i][2]) + parseInt(jumlah);
      sheetBarang.getRange(i + 1, 3).setValue(stokBaru);
      found = true;
      break;
    }
  }
  
  if (!found) {
    return { success: false, message: 'Barang tidak ditemukan!' };
  }
  
  // Catat transaksi
  const idTransaksi = generateId('TRX');
  const tanggal = formatDate(new Date());
  sheetTransaksi.appendRow([idTransaksi, tanggal, namaBarang, parseInt(jumlah), 'masuk', user]);
  
  return { success: true, message: 'Barang masuk berhasil dicatat! Stok diperbarui.' };
}

function barangKeluar(namaBarang, jumlah, user) {
  if (!namaBarang || !jumlah || jumlah <= 0) {
    return { success: false, message: 'Data tidak valid!' };
  }
  
  const ss = getSpreadsheet();
  const sheetBarang = ss.getSheetByName('Barang');
  const sheetTransaksi = ss.getSheetByName('Transaksi');
  const dataBarang = sheetBarang.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < dataBarang.length; i++) {
    if (dataBarang[i][1] === namaBarang) {
      const stokSekarang = parseInt(dataBarang[i][2]);
      const jumlahKeluar = parseInt(jumlah);
      
      if (stokSekarang < jumlahKeluar) {
        return { success: false, message: 'Stok tidak mencukupi! Stok saat ini: ' + stokSekarang };
      }
      
      sheetBarang.getRange(i + 1, 3).setValue(stokSekarang - jumlahKeluar);
      found = true;
      
      // Cek minimum stok
      const minStok = parseInt(dataBarang[i][4]) || 0;
      if ((stokSekarang - jumlahKeluar) < minStok) {
        sendLowStockNotification(dataBarang[i][1], stokSekarang - jumlahKeluar, minStok);
      }
      
      break;
    }
  }
  
  if (!found) {
    return { success: false, message: 'Barang tidak ditemukan!' };
  }
  
  // Catat transaksi
  const idTransaksi = generateId('TRX');
  const tanggal = formatDate(new Date());
  sheetTransaksi.appendRow([idTransaksi, tanggal, namaBarang, parseInt(jumlah), 'keluar', user]);
  
  return { success: true, message: 'Barang keluar berhasil dicatat! Stok diperbarui.' };
}

// ============================================================
// PENGAJUAN
// ============================================================

function getPengajuan() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Pengajuan');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push({
        id: data[i][0],
        tanggal: data[i][1],
        namaBarang: data[i][2],
        jumlah: data[i][3],
        status: data[i][4],
        user: data[i][5]
      });
    }
  }
  
  return result.reverse();
}

function ajukanBarang(namaBarang, jumlah, user) {
  if (!namaBarang || !jumlah || jumlah <= 0) {
    return { success: false, message: 'Data tidak valid!' };
  }
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Pengajuan');
  
  const id = generateId('PGJ');
  const tanggal = formatDate(new Date());
  
  sheet.appendRow([id, tanggal, namaBarang, parseInt(jumlah), 'Pending', user]);
  
  return { success: true, message: 'Pengajuan berhasil diajukan!' };
}

function approvePengajuan(id) {
  const ss = getSpreadsheet();
  const sheetPengajuan = ss.getSheetByName('Pengajuan');
  const sheetBarang = ss.getSheetByName('Barang');
  const sheetTransaksi = ss.getSheetByName('Transaksi');
  const dataPengajuan = sheetPengajuan.getDataRange().getValues();
  
  for (let i = 1; i < dataPengajuan.length; i++) {
    if (dataPengajuan[i][0] === id) {
      if (dataPengajuan[i][4] !== 'Pending') {
        return { success: false, message: 'Pengajuan sudah diproses sebelumnya!' };
      }
      
      // Update status
      sheetPengajuan.getRange(i + 1, 5).setValue('Approve');
      
      // Update stok barang
      const namaBarang = dataPengajuan[i][2];
      const jumlah = parseInt(dataPengajuan[i][3]);
      const dataBarang = sheetBarang.getDataRange().getValues();
      
      let found = false;
      for (let j = 1; j < dataBarang.length; j++) {
        if (dataBarang[j][1] === namaBarang) {
          const stokBaru = parseInt(dataBarang[j][2]) + jumlah;
          sheetBarang.getRange(j + 1, 3).setValue(stokBaru);
          found = true;
          break;
        }
      }
      
      // Jika barang belum ada, tambah baru
      if (!found) {
        const idBarang = generateId('BRG');
        sheetBarang.appendRow([idBarang, namaBarang, jumlah, 'pcs', 5]);
      }
      
      // Catat transaksi
      const idTransaksi = generateId('TRX');
      const tanggal = formatDate(new Date());
      sheetTransaksi.appendRow([idTransaksi, tanggal, namaBarang, jumlah, 'masuk', 'system-approve']);
      
      return { success: true, message: 'Pengajuan disetujui! Stok diperbarui.' };
    }
  }
  
  return { success: false, message: 'Pengajuan tidak ditemukan!' };
}

function rejectPengajuan(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Pengajuan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][4] !== 'Pending') {
        return { success: false, message: 'Pengajuan sudah diproses sebelumnya!' };
      }
      sheet.getRange(i + 1, 5).setValue('Reject');
      return { success: true, message: 'Pengajuan ditolak.' };
    }
  }
  
  return { success: false, message: 'Pengajuan tidak ditemukan!' };
}

// ============================================================
// DASHBOARD & LAPORAN
// ============================================================

function getDashboardData() {
  const barang = getBarang();
  const transaksi = getTransaksi();
  
  const totalBarang = barang.length;
  const totalStok = barang.reduce((sum, b) => sum + parseInt(b.stok), 0);
  const stokRendah = barang.filter(b => parseInt(b.stok) < parseInt(b.minStok)).length;
  
  // Data bulanan untuk grafik
  const bulanIni = new Date().getMonth();
  const tahunIni = new Date().getFullYear();
  const dataBulanan = [];
  
  for (let m = 0; m < 6; m++) {
    const targetMonth = bulanIni - m;
    const targetYear = tahunIni;
    
    let masuk = 0;
    let keluar = 0;
    
    transaksi.forEach(t => {
      const tgl = new Date(t.tanggal);
      if (tgl.getMonth() === ((targetMonth + 12) % 12) && tgl.getFullYear() === targetYear) {
        if (t.jenis === 'masuk') masuk += parseInt(t.jumlah);
        else keluar += parseInt(t.jumlah);
      }
    });
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    dataBulanan.unshift({
      bulan: monthNames[(targetMonth + 12) % 12],
      masuk: masuk,
      keluar: keluar
    });
  }
  
  // Top 10 stok terendah
  const stokTerendah = [...barang].sort((a, b) => a.stok - b.stok).slice(0, 10);
  
  return {
    totalBarang: totalBarang,
    totalStok: totalStok,
    stokRendah: stokRendah,
    totalTransaksi: transaksi.length,
    dataBulanan: dataBulanan,
    stokTerendah: stokTerendah
  };
}

function getLaporan(startDate, endDate) {
  const transaksi = getTransaksi();
  const barang = getBarang();
  
  let filtered = transaksi;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    
    filtered = transaksi.filter(t => {
      const tgl = new Date(t.tanggal);
      return tgl >= start && tgl <= end;
    });
  }
  
  const totalMasuk = filtered.filter(t => t.jenis === 'masuk').reduce((sum, t) => sum + parseInt(t.jumlah), 0);
  const totalKeluar = filtered.filter(t => t.jenis === 'keluar').reduce((sum, t) => sum + parseInt(t.jumlah), 0);
  
  return {
    transaksi: filtered,
    barang: barang,
    totalMasuk: totalMasuk,
    totalKeluar: totalKeluar,
    totalTransaksi: filtered.length
  };
}

// ============================================================
// NOTIFIKASI EMAIL
// ============================================================

function sendLowStockNotification(namaBarang, stokSekarang, minStok) {
  if (!ADMIN_EMAIL) return;
  
  try {
    const subject = '⚠️ Peringatan Stok Rendah - ' + namaBarang;
    const body = 'Halo Admin,\n\n' +
      'Stok barang "' + namaBarang + '" sudah di bawah batas minimum.\n\n' +
      'Stok saat ini: ' + stokSekarang + '\n' +
      'Minimum stok: ' + minStok + '\n\n' +
      'Segera lakukan pengisian ulang stok.\n\n' +
      'Terima kasih,\nSistem Stok Gudang';
    
    MailApp.sendEmail(ADMIN_EMAIL, subject, body);
  } catch (e) {
    Logger.log('Gagal mengirim email: ' + e.message);
  }
}

function checkAllLowStock() {
  const barang = getBarang();
  const lowStock = barang.filter(b => parseInt(b.stok) < parseInt(b.minStok));
  
  lowStock.forEach(b => {
    sendLowStockNotification(b.nama, b.stok, b.minStok);
  });
  
  return { count: lowStock.length, items: lowStock };
}

// ============================================================
// USER MANAGEMENT
// ============================================================

function getUsers() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('User');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push({
        username: data[i][0],
        role: data[i][2]
      });
    }
  }
  
  return result;
}

function tambahUser(username, password, role) {
  if (!username || !password || !role) {
    return { success: false, message: 'Semua field harus diisi!' };
  }
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('User');
  const data = sheet.getDataRange().getValues();
  
  // Cek duplikat
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return { success: false, message: 'Username sudah digunakan!' };
    }
  }
  
  sheet.appendRow([username, hashPassword(password), role]);
  return { success: true, message: 'User berhasil ditambahkan!' };
}

// ============================================================
// EXPORT DATA
// ============================================================

function exportCSV() {
  const barang = getBarang();
  let csv = 'ID Barang,Nama Barang,Stok,Satuan,Minimum Stok\n';
  
  barang.forEach(b => {
    csv += b.id + ',' + b.nama + ',' + b.stok + ',' + b.satuan + ',' + b.minStok + '\n';
  });
  
  return csv;
}

function exportLaporanCSV(startDate, endDate) {
  const laporan = getLaporan(startDate, endDate);
  let csv = 'ID Transaksi,Tanggal,Nama Barang,Jumlah,Jenis,User\n';
  
  laporan.transaksi.forEach(t => {
    csv += t.id + ',' + t.tanggal + ',' + t.namaBarang + ',' + t.jumlah + ',' + t.jenis + ',' + t.user + '\n';
  });
  
  return csv;
}
