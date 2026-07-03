"use strict";

/* =========================================================
   Bizim Hikayemiz — Application Logic
   ========================================================= */
let pin = "";
const correctPin = "1234";


const App = {
  settings: null,
  memories: null,
  letters: null,
  overrides: {},
  currentPinEntry: "",
  secretPinEntry: "",
  logoTapCount: 0,
  logoTapTimer: null,
  currentLightboxIndex: 0,
  currentTrackIndex: 0,
  isPlaying: false,
  favLetters: [],
  favPhotos: [],
  counterInterval: null,
};

/* ---------- Storage helpers ---------- */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  },
};

/* ---------- Data loading ---------- */
async function loadJSON(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Dosya alınamadı: ${path}`);
  return response.json();
}

async function loadAllData() {
  const [settings, memories, letters] = await Promise.all([
    loadJSON("settings.json"),
    loadJSON("memories.json"),
    loadJSON("letters.json"),
  ]);
  App.settings = settings;
  App.memories = memories;
  App.letters = letters;
  App.overrides = Store.get("bh_overrides", {});
  App.favLetters = Store.get("bh_fav_letters", []);
  App.favPhotos = Store.get("bh_fav_photos", []);
}

function getEffectivePin() {
  return App.overrides.pin || App.settings.pin;
}
function getEffectiveRelDate() {
  return App.overrides.relationshipStartDate || App.settings.relationshipStartDate;
}
function getEffectiveAnimations() {
  return App.overrides.animationsEnabled !== undefined
    ? App.overrides.animationsEnabled
    : App.settings.animations.enabled;
}
function getEffectiveHearts() {
  return App.overrides.heartsEnabled !== undefined
    ? App.overrides.heartsEnabled
    : App.settings.animations.floatingHearts;
}
document.querySelectorAll(".pin-key").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;

    if (key === "del") {
      pin = pin.slice(0, -1);
    } else {
      if (pin.length < 4) pin += key;
    }

    updateDots();
    checkPin();
  });
});
/* =========================================================
   PIN LOGIN
   ========================================================= */
function initPinScreen() {
  const dotsWrap = document.getElementById("pinDots");
  const errorEl = document.getElementById("pinError");
  const keypad = document.getElementById("pinKeypad");

  keypad.addEventListener("click", (e) => {
    const btn = e.target.closest(".pin-key");
    if (!btn || !btn.dataset.key) return;
    handlePinKey(btn.dataset.key, dotsWrap, errorEl, getEffectivePin(), () => {
      unlockApp();
    });
  });
}

function handlePinKey(key, dotsWrap, errorEl, correctPin, onSuccess) {
  const isPinScreen = dotsWrap.id === "pinDots";
  let entry = isPinScreen ? App.currentPinEntry : App.secretPinEntry;

  if (key === "del") {
    entry = entry.slice(0, -1);
  } else if (entry.length < 4) {
    entry += key;
  }

  if (isPinScreen) App.currentPinEntry = entry;
  else App.secretPinEntry = entry;

  renderPinDots(dotsWrap, entry.length);
  errorEl.classList.remove("visible");

  if (entry.length === 4) {
    setTimeout(() => {
      if (entry === correctPin) {
        onSuccess();
        if (isPinScreen) App.currentPinEntry = "";
        else App.secretPinEntry = "";
        renderPinDots(dotsWrap, 0);
      } else {
        errorEl.classList.add("visible");
        dotsWrap.classList.add("shake");
        navigator.vibrate && navigator.vibrate([40, 40, 40]);
        setTimeout(() => {
          dotsWrap.classList.remove("shake");
          if (isPinScreen) App.currentPinEntry = "";
          else App.secretPinEntry = "";
          renderPinDots(dotsWrap, 0);
        }, 500);
      }
    }, 150);
  }
}

function renderPinDots(dotsWrap, count) {
  const dots = dotsWrap.querySelectorAll(".pin-dot");
  dots.forEach((dot, i) => dot.classList.toggle("filled", i < count));
}

function unlockApp() {
  sessionStorage.setItem("bh_unlocked", "1");
  document.getElementById("screen-pin").classList.remove("active");
  document.getElementById("appShell").classList.add("active");
  navigate("home");
  startCounters();
  startFloatingHearts();
  checkSpecialDay();
}
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i < pin.length);
  });
}
function checkPin() {
  if (pin === correctPin) {
    document.getElementById("screen-pin").classList.remove("active");
  }

  if (pin.length === 4 && pin !== correctPin) {
    document.getElementById("pinError").style.display = "block";
    pin = "";
    updateDots();
  }
}

/* =========================================================
   ROUTING
   ========================================================= */
function navigate(route) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));

  if (route === "music-sheet") {
    openMusicSheet();
    return;
  }

  const target = document.getElementById(`screen-${route}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  window.scrollTo(0, 0);
  window.location.hash = route;
}

function initRouting() {
  document.body.addEventListener("click", (e) => {
    const el = e.target.closest("[data-route]");
    if (!el) return;
    const route = el.dataset.route;

    if (route === "home" && el.id === "logoTap") return;

    if (el.classList.contains("secret-cancel")) {
      App.secretPinEntry = "";
      renderPinDots(document.getElementById("secretPinDots"), 0);
    }

    navigate(route);
  });
}

/* =========================================================
   LOGO SECRET TAP (7 taps)
   ========================================================= */
function initSecretTap() {
  const logo = document.getElementById("logoTap");
  logo.addEventListener("click", () => {
    App.logoTapCount += 1;
    clearTimeout(App.logoTapTimer);
    App.logoTapTimer = setTimeout(() => (App.logoTapCount = 0), 1800);

    if (App.logoTapCount >= 7) {
      App.logoTapCount = 0;
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      document.getElementById("screen-secret-pin").classList.add("active");
    }
  });

  const secretDots = document.getElementById("secretPinDots");
  const secretError = document.getElementById("secretPinError");
  const secretKeypad = document.getElementById("secretPinKeypad");

  secretKeypad.addEventListener("click", (e) => {
    const btn = e.target.closest(".pin-key");
    if (!btn || !btn.dataset.key) return;
    handlePinKey(btn.dataset.key, secretDots, secretError, App.settings.secretPin, () => {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      document.getElementById("screen-secret").classList.add("active");
    });
  });
}

/* =========================================================
   RELATIONSHIP COUNTER
   ========================================================= */
function startCounters() {
  updateCounter();
  clearInterval(App.counterInterval);
  App.counterInterval = setInterval(updateCounter, 1000);

  document.getElementById("coupleNames").textContent =
    `${App.settings.coupleNames.personA} & ${App.settings.coupleNames.personB}`;
}

function updateCounter() {
  const start = new Date(getEffectiveRelDate());
  const now = new Date();
  const diffMs = Math.max(0, now - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById("counterDays").textContent = days.toLocaleString("tr-TR");
  document.getElementById("cbHours").textContent = String(hours).padStart(2, "0");
  document.getElementById("cbMinutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("cbSeconds").textContent = String(seconds).padStart(2, "0");

  const ring = document.getElementById("ringProgress");
  const circumference = 553;
  const cycleProgress = (days % 365) / 365;
  ring.style.strokeDashoffset = String(circumference - circumference * cycleProgress);
}

/* =========================================================
   FLOATING HEARTS (ambient)
   ========================================================= */
let heartsTimer = null;
function startFloatingHearts() {
  clearInterval(heartsTimer);
  if (!getEffectiveHearts() || !getEffectiveAnimations()) return;

  const container = document.getElementById("floatingHearts");
  heartsTimer = setInterval(() => {
    if (!getEffectiveHearts() || !getEffectiveAnimations()) return;
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = Math.random() > 0.5 ? "❤" : "♡";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
    heart.style.fontSize = `${14 + Math.random() * 14}px`;
    heart.style.animationDuration = `${8 + Math.random() * 6}s`;
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 15000);
  }, 1400);
}

/* =========================================================
   SPECIAL DAYS
   ========================================================= */
function checkSpecialDay() {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const banner = document.getElementById("specialBanner");
  const match = (App.settings.specialDays || []).find((d) => d.date === mmdd);

  banner.innerHTML = "";
  if (!match) return;

  banner.textContent = match.message;
  if (getEffectiveAnimations()) triggerSpecialEffect(match.effect);
}

function triggerSpecialEffect(effect) {
  const layer = document.getElementById("specialEffects");
  const count = 26;
  const glyphs = {
    hearts: ["❤", "💛", "💕"],
    confetti: ["🎉", "✨", "🎊"],
    snow: ["❄", "❅", "❆"],
    fireworks: ["🎆", "✨", "🎇"],
  };
  const set = glyphs[effect] || glyphs.hearts;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const span = document.createElement("span");
      span.textContent = set[Math.floor(Math.random() * set.length)];
      span.style.position = "absolute";
      span.style.left = `${Math.random() * 100}%`;
      span.style.top = "-40px";
      span.style.fontSize = `${16 + Math.random() * 18}px`;
      span.style.opacity = "0.9";
      span.style.transition = `transform ${3 + Math.random() * 3}s linear, opacity 3s linear`;
      layer.appendChild(span);
      requestAnimationFrame(() => {
        span.style.transform = `translateY(${window.innerHeight + 80}px) rotate(${Math.random() * 360}deg)`;
        span.style.opacity = "0";
      });
      setTimeout(() => span.remove(), 6500);
    }, i * 150);
  }
}

/* =========================================================
   GALLERY (Masonry + Lightbox)
   ========================================================= */
function renderGallery() {
  const grid = document.getElementById("masonryGrid");
  grid.innerHTML = "";

  App.memories.photos.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "masonry-item";
    item.dataset.index = String(index);

    const isFav = App.favPhotos.includes(photo.id);

    item.innerHTML = `
      <img data-src="${photo.src}" alt="${escapeHtml(photo.title)}" loading="lazy" />
      <span class="masonry-fav" data-photo-id="${photo.id}">${isFav ? "♥" : "♡"}</span>
      <div class="masonry-caption">${escapeHtml(photo.title)}</div>
    `;
    grid.appendChild(item);
  });

  lazyLoadImages(grid);

  grid.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".masonry-fav");
    if (favBtn) {
      toggleFavPhoto(favBtn.dataset.photoId, favBtn);
      return;
    }
    const item = e.target.closest(".masonry-item");
    if (item) openLightbox(Number(item.dataset.index));
  });
}

function toggleFavPhoto(photoId, el) {
  const idx = App.favPhotos.indexOf(photoId);
  if (idx >= 0) {
    App.favPhotos.splice(idx, 1);
    el.textContent = "♡";
  } else {
    App.favPhotos.push(photoId);
    el.textContent = "♥";
  }
  Store.set("bh_fav_photos", App.favPhotos);
}

function lazyLoadImages(scope) {
  const imgs = scope.querySelectorAll("img[data-src]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
          io.unobserve(img);
        }
      });
    },
    { rootMargin: "200px" }
  );
  imgs.forEach((img) => io.observe(img));
}

function openLightbox(index) {
  App.currentLightboxIndex = index;
  const lightbox = document.getElementById("lightbox");
  const track = document.getElementById("lightboxTrack");
  track.innerHTML = "";

  App.memories.photos.forEach((photo) => {
    const slide = document.createElement("div");
    slide.className = "lightbox-slide";
    slide.innerHTML = `<img src="${photo.src}" alt="${escapeHtml(photo.title)}" />`;
    track.appendChild(slide);
    initPinchZoom(slide.querySelector("img"));
  });

  lightbox.classList.add("active");
  updateLightboxInfo();

  requestAnimationFrame(() => {
    track.scrollTo({ left: index * track.clientWidth, behavior: "instant" });
  });

  track.onscroll = () => {
    const newIndex = Math.round(track.scrollLeft / track.clientWidth);
    if (newIndex !== App.currentLightboxIndex) {
      App.currentLightboxIndex = newIndex;
      updateLightboxInfo();
    }
  };
}

function updateLightboxInfo() {
  const photo = App.memories.photos[App.currentLightboxIndex];
  if (!photo) return;
  document.getElementById("lightboxTitle").textContent = photo.title;
  document.getElementById("lightboxDesc").textContent = photo.description;
  document.getElementById("lightboxMeta").textContent = `${formatDate(photo.date)} · ${photo.location}`;
}

function initPinchZoom(img) {
  let scale = 1;
  let lastDistance = 0;
  let originX = 0;
  let originY = 0;
  let panX = 0;
  let panY = 0;
  let lastPanX = 0;
  let lastPanY = 0;

  function applyTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  img.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        lastDistance = getDistance(e.touches);
      } else if (e.touches.length === 1 && scale > 1) {
        lastPanX = e.touches[0].clientX - panX;
        lastPanY = e.touches[0].clientY - panY;
      }
    },
    { passive: true }
  );

  img.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = getDistance(e.touches);
        const delta = distance / (lastDistance || distance);
        scale = Math.min(4, Math.max(1, scale * delta));
        lastDistance = distance;
        applyTransform();
      } else if (e.touches.length === 1 && scale > 1) {
        panX = e.touches[0].clientX - lastPanX;
        panY = e.touches[0].clientY - lastPanY;
        applyTransform();
      }
    },
    { passive: false }
  );

  img.addEventListener("touchend", (e) => {
    if (e.touches.length === 0 && scale <= 1) {
      scale = 1;
      panX = 0;
      panY = 0;
      applyTransform();
    }
  });

  img.addEventListener("dblclick", () => {
    scale = scale > 1 ? 1 : 2.2;
    panX = 0;
    panY = 0;
    applyTransform();
  });
}

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function initLightboxControls() {
  document.getElementById("lightboxClose").addEventListener("click", () => {
    document.getElementById("lightbox").classList.remove("active");
  });
}

/* =========================================================
   VIDEO GALLERY
   ========================================================= */
function renderVideos() {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";

  App.memories.videos.forEach((video, index) => {
    const card = document.createElement("div");
    card.className = "video-card glass";
    card.dataset.index = String(index);
    card.innerHTML = `
      <img src="${video.poster}" alt="${escapeHtml(video.title)}" loading="lazy" />
      <button class="video-play-btn" aria-label="Oynat">▶</button>
      <div class="video-card-info">
        <h4>${escapeHtml(video.title)}</h4>
        <p>${escapeHtml(video.description)}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".video-card");
    if (!card) return;
    openVideoModal(Number(card.dataset.index));
  });
}

function openVideoModal(index) {
  const video = App.memories.videos[index];
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoModalPlayer");
  player.src = video.src;
  player.poster = video.poster;
  document.getElementById("videoModalTitle").textContent = video.title;
  document.getElementById("videoModalDesc").textContent = video.description;
  modal.classList.add("active");
  player.play().catch(() => {});
}

function initVideoModalControls() {
  document.getElementById("videoModalClose").addEventListener("click", () => {
    const modal = document.getElementById("videoModal");
    const player = document.getElementById("videoModalPlayer");
    player.pause();
    player.removeAttribute("src");
    player.load();
    modal.classList.remove("active");
  });
}

/* =========================================================
   LETTERS
   ========================================================= */
let typingTimer = null;

function renderLetters() {
  const list = document.getElementById("lettersList");
  list.innerHTML = "";

  App.letters.letters.forEach((letter, index) => {
    const isFav = App.favLetters.includes(letter.id);
    const card = document.createElement("div");
    card.className = "letter-card";
    card.dataset.index = String(index);
    const preview = letter.content.split("\n").filter(Boolean)[0] || "";
    card.innerHTML = `
      <button class="letter-card-fav" data-letter-id="${letter.id}">${isFav ? "♥" : "♡"}</button>
      <h4>${escapeHtml(letter.title)}</h4>
      <span class="letter-date">${formatDate(letter.date)}</span>
      <p class="letter-preview">${escapeHtml(preview)}</p>
    `;
    list.appendChild(card);
  });

  list.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".letter-card-fav");
    if (favBtn) {
      toggleFavLetter(favBtn.dataset.letterId, favBtn);
      return;
    }
    const card = e.target.closest(".letter-card");
    if (card) openLetterModal(Number(card.dataset.index));
  });
}

function toggleFavLetter(letterId, el) {
  const idx = App.favLetters.indexOf(letterId);
  if (idx >= 0) {
    App.favLetters.splice(idx, 1);
    el.textContent = "♡";
  } else {
    App.favLetters.push(letterId);
    el.textContent = "♥";
  }
  Store.set("bh_fav_letters", App.favLetters);
  syncLetterModalFav(letterId);
}

function syncLetterModalFav(letterId) {
  const favBtn = document.getElementById("letterFavBtn");
  if (favBtn.dataset.letterId === letterId) {
    favBtn.classList.toggle("active", App.favLetters.includes(letterId));
    favBtn.textContent = App.favLetters.includes(letterId) ? "♥" : "♡";
  }
}

function openLetterModal(index) {
  const letter = App.letters.letters[index];
  const modal = document.getElementById("letterModal");
  const favBtn = document.getElementById("letterFavBtn");

  document.getElementById("letterModalTitle").textContent = letter.title;
  document.getElementById("letterModalDate").textContent = formatDate(letter.date);
  favBtn.dataset.letterId = letter.id;
  favBtn.textContent = App.favLetters.includes(letter.id) ? "♥" : "♡";
  favBtn.classList.toggle("active", App.favLetters.includes(letter.id));

  modal.classList.add("active");
  typeLetterContent(letter.content);
}

function typeLetterContent(text) {
  const el = document.getElementById("letterModalContent");
  el.innerHTML = "";
  clearInterval(typingTimer);

  if (!getEffectiveAnimations()) {
    el.textContent = text;
    return;
  }

  let i = 0;
  const speed = 14;
  el.innerHTML = '<span class="typing-cursor">&nbsp;</span>';
  typingTimer = setInterval(() => {
    i += 2;
    const shown = text.slice(0, i);
    el.innerHTML = escapeHtml(shown) + '<span class="typing-cursor">&nbsp;</span>';
    el.scrollTop = el.scrollHeight;
    if (i >= text.length) {
      clearInterval(typingTimer);
      el.innerHTML = escapeHtml(text);
    }
  }, speed);
}

function initLetterModalControls() {
  document.getElementById("letterModalClose").addEventListener("click", () => {
    clearInterval(typingTimer);
    document.getElementById("letterModal").classList.remove("active");
  });
  document.getElementById("letterFavBtn").addEventListener("click", (e) => {
    toggleFavLetter(e.currentTarget.dataset.letterId, e.currentTarget);
  });
}

/* =========================================================
   TIMELINE
   ========================================================= */
const TIMELINE_ICONS = {
  heart: "❤",
  coffee: "☕",
  ring: "💍",
  cake: "🎂",
  plane: "✈",
  star: "⭐",
};

function renderTimeline() {
  const list = document.getElementById("timelineList");
  list.innerHTML = "";

  const sorted = [...App.memories.timeline].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((item) => {
    const el = document.createElement("div");
    el.className = "timeline-item";
    el.innerHTML = `
      <span class="timeline-dot">${TIMELINE_ICONS[item.icon] || "❤"}</span>
      <span class="timeline-date">${formatDate(item.date)}</span>
      <h4 class="timeline-title">${escapeHtml(item.title)}</h4>
      <p class="timeline-desc">${escapeHtml(item.description)}</p>
    `;
    list.appendChild(el);
  });
}

/* =========================================================
   MUSIC PLAYER
   ========================================================= */
const [isOpen, setIsOpen] = useState(false);

const audio = () => document.getElementById("audioPlayer");

function initMusicPlayer() {
  const playlist = App.settings.music.playlist;
  audio().volume = App.settings.music.defaultVolume;
  document.getElementById("msVolume").value = String(App.settings.music.defaultVolume);
  loadTrack(0, false);

  document.getElementById("fpPlayPause").addEventListener("click", togglePlay);
  document.getElementById("msPlayPause").addEventListener("click", togglePlay);
  document.getElementById("fpExpand").addEventListener("click", openMusicSheet);
  document.getElementById("msPrev").addEventListener("click", () => changeTrack(-1));
  document.getElementById("msNext").addEventListener("click", () => changeTrack(1));

  document.getElementById("msVolume").addEventListener("input", (e) => {
    audio().volume = Number(e.target.value);
  });

  document.getElementById("msSeek").addEventListener("input", (e) => {
    const pct = Number(e.target.value) / 100;
    if (audio().duration) audio().currentTime = pct * audio().duration;
  });

  audio().addEventListener("timeupdate", updateSeekUI);
  audio().addEventListener("ended", () => changeTrack(1));
  audio().addEventListener("play", () => setPlayingUI(true));
  audio().addEventListener("pause", () => setPlayingUI(false));

  document.getElementById("musicSheetHandle").addEventListener("click", closeMusicSheet);

  renderPlaylist(playlist);

  document.getElementById("floatingPlayer").addEventListener("click", (e) => {
  if (e.target.closest("#fpPlayPause")) return;

  if (e.target.closest("#fpExpand")) {
    openMusicSheet();
    return;
  }

  if (!isOpen) {
    openMusicSheet();
  }
});
   
  setTimeout(() => document.getElementById("floatingPlayer").classList.add("visible"), 600);
}

function renderPlaylist(playlist) {
  const wrap = document.getElementById("msPlaylist");
  wrap.innerHTML = "";
  playlist.forEach((track, index) => {
    const el = document.createElement("div");
    el.className = "ms-track" + (index === App.currentTrackIndex ? " playing" : "");
    el.dataset.index = String(index);
    el.innerHTML = `
      <img src="${track.cover}" alt="" />
      <div class="ms-track-info">
        <div class="ms-track-title">${escapeHtml(track.title)}</div>
        <div class="ms-track-artist">${escapeHtml(track.artist)}</div>
      </div>
    `;
    wrap.appendChild(el);
  });

  wrap.onclick = (e) => {
    const el = e.target.closest(".ms-track");
    if (!el) return;
    loadTrack(Number(el.dataset.index), true);
  };
}

function loadTrack(index, autoplay) {
  const playlist = App.settings.music.playlist;
  App.currentTrackIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  const track = playlist[App.currentTrackIndex];

  audio().src = track.src;
  document.getElementById("fpTitle").textContent = track.title;
  document.getElementById("fpArtist").textContent = track.artist;
  document.getElementById("fpCover").src = track.cover;
  document.getElementById("msTitle").textContent = track.title;
  document.getElementById("msArtist").textContent = track.artist;
  document.getElementById("msCover").src = track.cover;

  renderPlaylist(playlist);

  if (autoplay) {
    audio()
      .play()
      .catch(() => {});
  }
}

function changeTrack(delta) {
  loadTrack(App.currentTrackIndex + delta, true);
}

function togglePlay() {
  if (audio().paused) {
    audio()
      .play()
      .catch(() => {});
  } else {
    audio().pause();
  }
}

function setPlayingUI(playing) {
  App.isPlaying = playing;
  document.getElementById("fpPlayPause").textContent = playing ? "❚❚" : "▶";
  document.getElementById("msPlayPause").textContent = playing ? "❚❚" : "▶";
}

function updateSeekUI() {
  const a = audio();
  if (!a.duration) return;
  document.getElementById("msSeek").value = String((a.currentTime / a.duration) * 100);
  document.getElementById("msCurrentTime").textContent = formatTime(a.currentTime);
  document.getElementById("msDuration").textContent = formatTime(a.duration);
}

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

let isOpen = false;

function openMusicSheet() {
  isOpen = true;
  document.getElementById("musicSheet").classList.add("active");
}

function closeMusicSheet() {
  isOpen = false;
  document.getElementById("musicSheet").classList.remove("active");
}

/* =========================================================
   SETTINGS
   ========================================================= */
function initSettings() {
  const themeToggle = document.getElementById("themeToggle");
  const animToggle = document.getElementById("animToggle");
  const heartsToggle = document.getElementById("heartsToggle");
  const autoplayToggle = document.getElementById("autoplayToggle");
  const relDateInput = document.getElementById("relDateInput");
  const newPinInput = document.getElementById("newPinInput");
  const savePinBtn = document.getElementById("savePinBtn");
  const pinSaveHint = document.getElementById("pinSaveHint");
  const resetBtn = document.getElementById("resetAppBtn");

  themeToggle.checked = Store.get("bh_theme_dark", true);
  animToggle.checked = getEffectiveAnimations();
  heartsToggle.checked = getEffectiveHearts();
  autoplayToggle.checked = App.settings.music.autoplay;
  relDateInput.value = getEffectiveRelDate().slice(0, 10);

  themeToggle.addEventListener("change", () => {
    Store.set("bh_theme_dark", themeToggle.checked);
    document.documentElement.style.filter = themeToggle.checked ? "" : "invert(0.92) hue-rotate(180deg)";
  });

  animToggle.addEventListener("change", () => {
    App.overrides.animationsEnabled = animToggle.checked;
    Store.set("bh_overrides", App.overrides);
    startFloatingHearts();
  });

  heartsToggle.addEventListener("change", () => {
    App.overrides.heartsEnabled = heartsToggle.checked;
    Store.set("bh_overrides", App.overrides);
    startFloatingHearts();
  });

  autoplayToggle.addEventListener("change", () => {
    App.settings.music.autoplay = autoplayToggle.checked;
  });

  relDateInput.addEventListener("change", () => {
    App.overrides.relationshipStartDate = new Date(relDateInput.value).toISOString();
    Store.set("bh_overrides", App.overrides);
    updateCounter();
  });

  savePinBtn.addEventListener("click", () => {
    const val = newPinInput.value.trim();
    if (!/^\d{4}$/.test(val)) {
      pinSaveHint.textContent = "PIN 4 haneli rakamlardan oluşmalı.";
      return;
    }
    App.overrides.pin = val;
    Store.set("bh_overrides", App.overrides);
    newPinInput.value = "";
    pinSaveHint.textContent = "Yeni PIN kaydedildi ❤️";
    setTimeout(() => (pinSaveHint.textContent = ""), 2500);
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("bh_overrides");
    localStorage.removeItem("bh_theme_dark");
    App.overrides = {};
    document.documentElement.style.filter = "";
    relDateInput.value = getEffectiveRelDate().slice(0, 10);
    animToggle.checked = getEffectiveAnimations();
    heartsToggle.checked = getEffectiveHearts();
    themeToggle.checked = true;
    pinSaveHint.textContent = "Ayarlar sıfırlandı.";
    setTimeout(() => (pinSaveHint.textContent = ""), 2500);
    startFloatingHearts();
  });
}

/* =========================================================
   PWA — Service Worker & Install Prompt
   ========================================================= */
function initPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  let deferredPrompt = null;
  const toast = document.getElementById("installToast");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!Store.get("bh_install_dismissed", false)) {
      toast.classList.add("visible");
    }
  });

  document.getElementById("installBtn").addEventListener("click", async () => {
    toast.classList.remove("visible");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });

  document.getElementById("installDismiss").addEventListener("click", () => {
    toast.classList.remove("visible");
    Store.set("bh_install_dismissed", true);
  });
}

/* =========================================================
   UTILITIES
   ========================================================= */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/* =========================================================
   BOOTSTRAP
   ========================================================= */
async function bootstrap() {
  try {
    await loadAllData();
  } catch (err) {
    document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#E8B4B8;font-family:sans-serif;">
      Veri dosyaları yüklenemedi. Lütfen uygulamayı bir web sunucusu üzerinden açın.<br/><br/>
      <small>${err.message}</small>
    </div>`;
    return;
  }

  initPinScreen();
  initRouting();
  initSecretTap();
  initLightboxControls();
  initVideoModalControls();
  initLetterModalControls();
  initPWA();

  renderGallery();
  renderVideos();
  renderLetters();
  renderTimeline();
  initMusicPlayer();
  initSettings();

  if (Store.get("bh_theme_dark", true) === false) {
    document.documentElement.style.filter = "invert(0.92) hue-rotate(180deg)";
  }

  if (sessionStorage.getItem("bh_unlocked") === "1") {
    unlockApp();
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
