// Global state
let windowCounter = 0;
let activeWindows = new Map();
let currentImageIndex = 0;
let images = [];
let musicPlaying = false;
let audioInitialized = false;

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    showDesktop();
    setTimeout(initializeDesktop, 100);
  }
  initializeLogin();
  initializeClock();
  initializeMusicControl();
  initializePictureModal();
  document.querySelectorAll('.dbg-btn').forEach(b => b.addEventListener('click', () => openWindow(b.dataset.open)));
});

function initializeDesktop() { initializeDesktopIcons(); }

// Login
function initializeLogin() {
  const form = document.getElementById('loginForm');
  const input = document.getElementById('passwordInput');
  const err = document.getElementById('errorMessage');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const pw = input.value;
    if (pw === '26092001') {
      sessionStorage.setItem('isLoggedIn', 'true');
      showDesktop(); // no overlay, langsung masuk
    } else {
      err.textContent = 'Password salah. Coba lagi!';
      err.classList.remove('hidden');
      setTimeout(() => err.classList.add('hidden'), 3000);
      input.value = ''; input.focus();
    }
  });
}

function showDesktop() {
  const lock = document.getElementById('lockScreen');
  const desk = document.getElementById('desktop');
  if (lock) lock.style.display = 'none';
  if (desk) {
    desk.classList.remove('hidden');
    setTimeout(() => { initializeDesktopIcons(); }, 200);
  }
}

// Clock
function initializeClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    const n = new Date();
    el.textContent = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  };
  tick(); setInterval(tick, 1000);
}

// Desktop icons
function initializeDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');
  if (!icons.length) return;
  icons.forEach((icon, idx) => {
    icon.replaceWith(icon.cloneNode(true));
    const n = document.querySelectorAll('.desktop-icon')[idx];
    n.addEventListener('dblclick', () => openWindow(n.dataset.app));
    n.addEventListener('touchend', e => { e.preventDefault(); openWindow(n.dataset.app); });
  });
}

// Windows
function openWindow(appType) {
  const id = `window-${++windowCounter}`;
  const cfg = getWindowConfig(appType);
  const el = createWindow(id, cfg);
  document.getElementById('windowsContainer').appendChild(el);
  activeWindows.set(id, { element: el, isMinimized: false, appType, cfg });
  focusWindow(id);
  initializeWindowEvents(id);
  setTimeout(() => {
    if (appType === 'pictures') initializePicturesApp(id);
    else if (appType === 'notes') initializeNotesApp(id);
    else if (appType === 'ucapan') initializeUcapanApp(id);
    else if (appType === 'hadiah') initializeHadiahApp(id);
    else if (appType === 'bouquet') initializeBouquetApp(id);
  }, 100);
}

function getWindowConfig(appType) {
  const c = {
    pictures: { title: 'Pictures', width: 'w-4/5 max-w-4xl', height: 'h-4/5', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/></svg>' },
    notes: { title: 'Notes', width: 'w-96', height: 'h-96', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>' },
    ucapan: { title: 'For You', width: 'w-96', height: 'h-80', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/></svg>' },
    hadiah: { title: 'Hadiah', width: 'w-96', height: 'h-96', icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12v7a2 2 0 0 1-2 2h-5v-9h7ZM11 21H6a2 2 0 0 1-2-2v-7h7v9ZM21 8h-3.17a3 3 0 1 0-4.66-3 3 3 0 1 0-4.66 3H5a1 1 0 0 0-1 1v2h18V9a1 1 0 0 0-1-1Z"/></svg>' },
    bouquet: { title: 'Hadiahmu!', width: 'w-[min(80vmin,620px)] h-[min(80vmin,620px)]', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/></svg>' },
  };
  return c[appType] || c.notes;
}

function createWindow(id, cfg) {
  const d = document.createElement('div');
  d.id = id;
  d.className = `fixed bg-white rounded-lg shadow-2xl border border-gray-300 ${cfg.width} ${cfg.height} pointer-events-auto animate-fade-in`;
  d.style.left = '50px'; d.style.top = '50px'; d.style.zIndex = '1000';
  d.innerHTML = `
    <div class="window-header bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-t-lg flex items-center justify-between cursor-move">
      <div class="flex items-center space-x-2">${cfg.icon}<span class="font-medium">${cfg.title}</span></div>
      <div class="flex items-center space-x-1">
        <button class="minimize-btn w-6 h-6 bg-yellow-500 hover:bg-yellow-600 rounded-sm flex items-center justify-center text-xs text-white">−</button>
        <button class="maximize-btn w-6 h-6 bg-green-500 hover:bg-green-600 rounded-sm flex items-center justify-center text-xs text-white">⬜</button>
        <button class="close-btn w-6 h-6 bg-red-500 hover:bg-red-600 rounded-sm flex items-center justify-center text-xs text-white">×</button>
      </div>
    </div>
    <div class="window-content p-4 flex-1 overflow-auto" style="height:calc(100% - 40px)"></div>`;
  return d;
}

function initializeWindowEvents(id) {
  const el = activeWindows.get(id).element;
  const header = el.querySelector('.window-header');
  const min = el.querySelector('.minimize-btn');
  const max = el.querySelector('.maximize-btn');
  const cls = el.querySelector('.close-btn');
  let dragging = false, off = { x: 0, y: 0 };
  header.addEventListener('mousedown', e => {
    dragging = true; const r = el.getBoundingClientRect();
    off.x = e.clientX - r.left; off.y = e.clientY - r.top; focusWindow(id);
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const x = e.clientX - off.x, y = e.clientY - off.y;
    el.style.left = Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth)) + 'px';
    el.style.top = Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight)) + 'px';
  });
  document.addEventListener('mouseup', () => dragging = false);
  min.addEventListener('click', () => minimizeWindow(id));
  max.addEventListener('click', () => maximizeWindow(id));
  cls.addEventListener('click', () => closeWindow(id));
  el.addEventListener('mousedown', () => focusWindow(id));
}

function focusWindow(id) {
  activeWindows.forEach(w => w.element.style.zIndex = '1000');
  if (activeWindows.has(id)) activeWindows.get(id).element.style.zIndex = '1001';
}

function minimizeWindow(id) {
  const w = activeWindows.get(id); if (!w) return;
  w.element.style.display = 'none'; w.isMinimized = true;
  addToTaskbar(id, w.cfg.title, w.cfg.icon);
}
function maximizeWindow(id) {
  const el = activeWindows.get(id).element;
  el.style.left = '0px'; el.style.top = '0px';
  el.style.width = '100vw'; el.style.height = 'calc(100vh - 48px)';
  el.className = el.className.replace(/w-\S+/, 'w-full').replace(/h-\S+/, 'h-full');
}
function closeWindow(id) {
  const w = activeWindows.get(id); if (!w) return;
  w.element.remove(); activeWindows.delete(id); removeFromTaskbar(id);
}

// Taskbar
function addToTaskbar(id, title, icon) {
  const b = document.createElement('button');
  b.id = `taskbar-${id}`;
  b.className = 'bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-2 max-w-32 truncate';
  b.innerHTML = `${icon}<span class="truncate">${title}</span>`;
  b.addEventListener('click', () => restoreWindow(id));
  document.getElementById('minimizedWindows').appendChild(b);
}
function removeFromTaskbar(id) {
  const b = document.getElementById(`taskbar-${id}`); if (b) b.remove();
}
function restoreWindow(id) {
  const w = activeWindows.get(id); if (!w) return;
  w.element.style.display = 'block'; w.isMinimized = false; focusWindow(id); removeFromTaskbar(id);
}

// Apps
function initializePicturesApp(id) {
  const w = activeWindows.get(id); if (!w) return;
  const content = w.element.querySelector('.window-content'); if (!content) return;
  content.innerHTML = '';
  images = [
    'assets/img/photo1.jpg', 'assets/img/photo2.jpg', 'assets/img/photo3.jpg',
    'assets/img/photo4.jpg', 'assets/img/photo5.jpg', 'assets/img/photo6.jpg',
    'assets/img/photo7.jpg', 'assets/img/photo8.jpg', 'assets/img/photo9.jpg',
    'assets/img/photo10.jpg', 'assets/img/photo11.jpg', 'assets/img/photo12.jpg',
    'assets/img/photo13.jpg', 'assets/img/photo14.jpg', 'assets/img/photo15.jpg',
    'assets/img/photo16.jpg', 'assets/img/photo17.jpg', 'assets/img/photo18.jpg',
    'assets/img/photo19.jpg', 'assets/img/photo20.jpg', 'assets/img/photo21.jpg',
  ];
  const grid = document.createElement('div'); grid.className = 'grid grid-cols-2 sm:grid-cols-3 gap-4';
  images.forEach((src, i) => {
    const box = document.createElement('div');
    box.className = 'aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform';
    box.innerHTML = `<img src="${src}" alt="Photo ${i + 1}" class="w-full h-full object-cover" loading="lazy">`;
    box.addEventListener('click', () => openPictureModal(i));
    grid.appendChild(box);
  });
  content.appendChild(grid);
}
function initializeNotesApp(id) {
  const w = activeWindows.get(id); if (!w) return;
  const content = w.element.querySelector('.window-content'); if (!content) return;
  const saved = localStorage.getItem('birthdayNote') || '';
  content.innerHTML = `
    <div class="h-full flex flex-col space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">My Notes</h2>
        <button id="resetNote-${id}" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Reset Note</button>
      </div>
      <textarea id="noteArea-${id}" class="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Tulis catatan di sini...">${saved}</textarea>
    </div>`;
  setTimeout(() => {
    const ta = content.querySelector(`#noteArea-${id}`);
    const rb = content.querySelector(`#resetNote-${id}`);
    let t;
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => localStorage.setItem('birthdayNote', ta.value), 500); });
    ta.addEventListener('blur', () => localStorage.setItem('birthdayNote', ta.value));
    rb.addEventListener('click', () => { if (confirm('Yakin ingin menghapus semua catatan?')) { ta.value = ''; localStorage.removeItem('birthdayNote'); } });
  }, 50);
}
function initializeUcapanApp(id) {
  const w = activeWindows.get(id); if (!w) return;
  const content = w.element.querySelector('.window-content'); if (!content) return;
  const text = `Happy Birthday, sayang🤍!

Semoga di usia ini, selalu dikelilingi kebahagiaan, kesehatan, rezeki, dan juga selalu didekatkan dengan berkah ya sayang.
Semoga semakin cantik, semakin pintar, semoga kuliahnya lancar jugaaa, dan semakin sukses di segala hal yang Yeli lakukan.
maaf ya Abang nggak bisa kasih kado yang wah, tapi Abang harap Yeli suka dengan kejutan kecil ini.
Terima kasih sudah menjadi bagian penting dalam hidup Abang. Semoga tahun baru ini membawa banyak kebahagian, pencapaian baru, dan momen-momen baik yang nanti kita buat bareng-bareng yaaa.

Sekali lagi, Selamat ulang tahun sayang🤍🤍 🎉
ILOVEYOUUUU!🤍🤍🤍🤍`; // Ucapan bisa diubah di sini
  const box = document.createElement('div'); box.className = 'h-full flex flex-col space-y-4';
  const title = document.createElement('h2'); title.className = 'text-2xl font-bold text-center text-blue-600 mb-4'; title.textContent = 'Happy Birthday Cintaaa🤍! 🎂';
  const msg = document.createElement('div'); msg.className = 'flex-1 text-gray-700 leading-relaxed whitespace-pre-line';
  box.appendChild(title); box.appendChild(msg); content.appendChild(box);
  setTimeout(() => typewriterEffect(msg, text, 50), 100);
}

function initializeHadiahApp(id) {
  const w = activeWindows.get(id); if (!w) return;
  const el = w.element.querySelector('.window-content'); if (!el) return;

  el.innerHTML = `
    <div class="h-full flex flex-col items-center justify-center gap-4">
      <div class="gift-box">
        <div class="gift-lid"></div>
        <div class="gift-body"></div>
        <div class="gift-ribbon-vert"></div>
        <div class="gift-ribbon-hor"></div>
      </div>
      <button id="openGift-${id}" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded">
        Buka Hadiah
      </button>
      <p class="text-sm text-gray-600 text-center">Klik untuk membuka hadiah di jendela baru.</p>
    </div>
  `;

  const btn = el.querySelector(`#openGift-${id}`);
  const box = el.querySelector('.gift-box');
  let opened = false;

  btn.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    box.classList.add('open');
    openWindow('bouquet');
    btn.textContent = 'Hadiah Dibuka!';
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  });
}

function initializeBouquetApp(id) {
  const w = activeWindows.get(id); if (!w) return;
  const content = w.element.querySelector('.window-content'); if (!content) return;
  content.innerHTML = '<div class="h-full flex items-center justify-center p-4"><div id="bouquetMount" class="w-full max-w-4xl mx-auto flex items-center justify-center"></div></div>';
  const mount = content.querySelector('#bouquetMount');
  setTimeout(() => {
    renderBouquet(mount);
  }, 100);
}

// Typewriter
function typewriterEffect(el, txt, speed = 50) {
  let i = 0; el.textContent = '';
  (function type() {
    if (i < txt.length) { el.textContent += txt.charAt(i++); setTimeout(type, speed); }
  })();
}

// Music
function initializeMusicControl() {
  const btn = document.getElementById('musicToggle');
  const audio = document.getElementById('backgroundMusic');
  if (!btn || !audio) return;

  btn.addEventListener('click', () => {
    if (!audioInitialized) { audio.load(); audioInitialized = true; }
    if (musicPlaying) { audio.pause(); musicPlaying = false; updateBtn(); }
    else {
      audio.play().then(() => { musicPlaying = true; updateBtn(); fadeIn(); }).catch(() => {});
    }
  });
  function updateBtn() {
    btn.innerHTML = musicPlaying
      ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z"/></svg>'
      : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>';
    btn.setAttribute('aria-label', musicPlaying ? 'Pause music' : 'Play music');
  }
  function fadeIn() {
    if (!audio || !musicPlaying) return; audio.volume = 0;
    const it = setInterval(() => {
      if (audio.volume < 0.8) audio.volume = Math.min(audio.volume + 0.05, 0.8);
      else clearInterval(it);
    }, 100);
  }
}

// Picture Modal
function initializePictureModal() {
  const modal = document.getElementById('pictureModal');
  const img = document.getElementById('modalImage');
  const prev = document.getElementById('prevImage');
  const next = document.getElementById('nextImage');
  const close = document.getElementById('closeModal');
  if (!modal) return;

  function setImg() {
    img.src = images[currentImageIndex];
    img.alt = `Photo ${currentImageIndex + 1}`;
    img.onerror = function () {
      this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjd2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QaG90byAke2N1cnJlbnRJbWFnZUluZGV4ICsgMX08L3RleHQ+PC9zdmc+';
    };
  }
  prev.addEventListener('click', () => { currentImageIndex = (currentImageIndex - 1 + images.length) % images.length; setImg(); });
  next.addEventListener('click', () => { currentImageIndex = (currentImageIndex + 1) % images.length; setImg(); });
  close.addEventListener('click', () => modal.classList.add('hidden'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) modal.classList.add('hidden'); });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  window.openPictureModal = function (i) { currentImageIndex = i; modal.classList.remove('hidden'); setImg(); };
}

// === Bouquet renderer (in-app) ===
function renderBouquet(parentEl) {
  const wrap = document.createElement('div');
  wrap.className = 'bouquet-wrap in-app';
  wrap.setAttribute('aria-hidden', 'true');

  // kertas + pita
  const paper = document.createElement('div'); paper.className = 'paper white';
  const tie = document.createElement('div'); tie.className = 'tie pink';
  wrap.appendChild(paper);

  // layout bunga
  const rows = [5, 6, 6, 5, 2];
  const rowGap = 42, baseRise = 120, colStep = 32;
  let idx = 0;
  rows.forEach((count, r) => {
    const rise = baseRise + r * rowGap;
    const span = (count - 1) * colStep;
    for (let i = 0; i < count; i++) {
      const dx = -span / 2 + i * colStep;
      const jitterX = (Math.random() - 0.5) * 6;
      const jitterR = (Math.random() - 0.5) * 2;
      const deg = Math.atan2(dx, rise) * 180 / Math.PI;

      const rose = document.createElement('div');
      rose.className = 'rose';
      const len = Math.round(rise * 0.88 + Math.random() * 12);
      rose.style.setProperty('--len', len + 'px');
      rose.style.setProperty('--rot', (deg + jitterR) + 'deg');
      rose.style.setProperty('--rise', rise + 'px');
      rose.style.transform = `translateX(${dx + jitterX}px) rotate(${deg}deg) translateY(-${rise}px)`;

      rose.innerHTML = `
        <div class="stem"></div>
        <div class="leaf"></div>
        <div class="bud" style="animation-delay:${idx * 22}ms"></div>
      `;
      wrap.appendChild(rose);
      idx++;
    }
  });

  // pita paling depan
  wrap.appendChild(tie);

  parentEl.innerHTML = '';
  parentEl.appendChild(wrap);
}
