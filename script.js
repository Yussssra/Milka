const config = window.MILKA_CONFIG || {};
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";
const FALLBACK_COUNTRY = config.country || "US";

const fallbackMovies = [
  { id: 155, title: "The Dark Knight", vote_average: 9.0, release_year: "2008", backdrop_url: `${TMDB_IMAGE}/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg` },
  { id: 27205, title: "Inception", vote_average: 8.8, release_year: "2010", backdrop_url: `${TMDB_IMAGE}/original/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg` }
];

// State
let allMovies = [];
let selectedId = fallbackMovies[0].id;
let searchDebounceTimeout = null;

// DOM Elements
const navbar = document.getElementById("navbar");
const searchInput = document.getElementById("searchInput");
const searchResultsArea = document.getElementById("searchResultsArea");
const searchGrid = document.getElementById("searchGrid");
const searchQueryText = document.getElementById("searchQueryText");
const slidersContainer = document.getElementById("slidersContainer");
const heroSection = document.getElementById("hero");

const heroTitle = document.getElementById("heroTitle");
const heroReleaseYear = document.getElementById("heroReleaseYear");
const heroRuntime = document.getElementById("heroRuntime");
const heroDescription = document.getElementById("heroDescription");
const heroGenreTag = document.getElementById("heroGenreTag");
const heroRatingBadge = document.getElementById("heroRatingBadge");

const watchMovieButton = document.getElementById("watchMovieButton");
const watchTrailerButton = document.getElementById("watchTrailerButton");

// Rows
const favoritesRow = document.getElementById("favoritesRow");
const romanceRow = document.getElementById("romanceRow");
const popularRow = document.getElementById("popularRow");
const actionRow = document.getElementById("actionRow");
const scifiRow = document.getElementById("scifiRow");
const dramaRow = document.getElementById("dramaRow");

// Modal Elements
const videoModal = document.getElementById("videoModal");
const closeModalBtn = document.getElementById("closeModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const playerFrame = document.getElementById("playerFrame");
const modalPlayerType = document.getElementById("modalPlayerType");
const modalTitle = document.getElementById("modalTitle");
const movieInfoTitle = document.getElementById("movieInfoTitle");
const movieInfoDescription = document.getElementById("movieInfoDescription");
const watchProviderButton = document.getElementById("watchProviderButton");

// Scroll FX
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
});

function formatRuntime(runtime) {
  if (!runtime) return "N/A";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function createMovieCard(movie) {
  return `
    <div class="movie-card" data-select="${movie.id}">
      <div class="movie-poster" style="background-image:url('${movie.backdrop_url || movie.poster_url}')"></div>
      <div class="movie-copy">
        <h3>${movie.title}</h3>
        <p class="movie-meta">${movie.release_year || "Unknown"}</p>
      </div>
    </div>
  `;
}

function renderRow(container, movies) {
  if (!container) return;
  if (!movies || !movies.length) {
    container.innerHTML = `<div style="color:#666; padding:1vw;">No movies found</div>`;
    return;
  }
  container.innerHTML = movies.map(m => createMovieCard(m)).join("");
}

// Map Base Movie Model
function mapBaseMovie(m) {
  return {
    id: m.id,
    title: m.title || m.name,
    overview: m.overview,
    vote_average: m.vote_average || 0,
    release_year: (m.release_date || m.first_air_date || "").slice(0, 4),
    poster_url: m.poster_path ? `${TMDB_IMAGE}/w500${m.poster_path}` : "",
    backdrop_url: m.backdrop_path ? `${TMDB_IMAGE}/original${m.backdrop_path}` : ""
  };
}

function updateHeroSection(movie) {
  if (!movie) return;
  selectedId = movie.id;
  
  heroTitle.textContent = movie.title;
  heroReleaseYear.textContent = movie.release_year;
  heroDescription.textContent = movie.overview || "No description available.";
  
  const ratingMatch = movie.vote_average >= 7 ? "High Match" : "Match";
  heroRatingBadge.textContent = `${(movie.vote_average * 10).toFixed(0)}% ${ratingMatch}`;
  
  heroSection.style.backgroundImage = `url("${movie.backdrop_url}")`;
  
  heroRuntime.textContent = "Loading...";
  heroGenreTag.textContent = "Loading...";
  
  fetchDeepMovieDetails(movie.id).then(detailed => {
    if (detailed) {
      heroRuntime.textContent = formatRuntime(detailed.runtime);
      heroGenreTag.textContent = detailed.genre_names.join(" • ");
    }
  });
}

async function fetchDeepMovieDetails(id) {
  if (!config.tmdbBearerToken) return null;
  const headers = { Authorization: `Bearer ${config.tmdbBearerToken}`, accept: "application/json" };
  try {
    const details = await fetchJson(`${TMDB_BASE}/movie/${id}?append_to_response=videos&language=en-US`, { headers });
    const videos = details.videos?.results || [];
    const official = videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) || videos.find((v) => v.site === "YouTube" && v.type === "Trailer");
    
    return {
      runtime: details.runtime,
      genre_names: (details.genres || []).map(g => g.name),
      trailer_embed: official ? `https://www.youtube.com/embed/${official.key}?autoplay=1&rel=0` : "about:blank"
    };
  } catch(e) { return null; }
}

async function openModalLazy(baseMovie, type = "movie", broadcast = true) {
  modalTitle.textContent = "Loading Player...";
  movieInfoTitle.textContent = baseMovie.title;
  movieInfoDescription.textContent = baseMovie.overview;
  playerFrame.src = ""; // Clear
  watchProviderButton.href = `https://www.themoviedb.org/movie/${baseMovie.id}`;
  
  videoModal.classList.add("open");
  document.body.style.overflow = "hidden";

  if (broadcast && conn && conn.open) {
    conn.send({ type: 'open-player', movieId: baseMovie.id, playerType: type });
    triggerSyncWave();
  }

  const deep = await fetchDeepMovieDetails(baseMovie.id);
  
  modalTitle.textContent = "Now Playing";
  if (type === "movie") {
    modalPlayerType.className = "pill-badge type-movie";
    modalPlayerType.textContent = "FULL MOVIE";
    playerFrame.src = `https://www.vidking.net/embed/movie/${baseMovie.id}?color=DFFF00&autoPlay=true`;
  } else {
    modalPlayerType.className = "pill-badge type-trailer";
    modalPlayerType.textContent = "TRAILER";
    playerFrame.src = deep ? deep.trailer_embed : "about:blank";
  }
}

function closeVideoModal(broadcast = true) {
  videoModal.classList.remove("open");
  document.body.style.overflow = "";
  playerFrame.src = "";
  
  if (broadcast && conn && conn.open) {
    conn.send({ type: 'close-player' });
    triggerSyncWave();
  }
}

closeModalBtn.addEventListener("click", closeVideoModal);
modalBackdrop.addEventListener("click", closeVideoModal);

watchMovieButton.addEventListener("click", () => {
  const m = allMovies.find(v => v.id === selectedId);
  if (m) openModalLazy(m, "movie");
});

watchTrailerButton.addEventListener("click", () => {
  const m = allMovies.find(v => v.id === selectedId);
  if (m) openModalLazy(m, "trailer");
});

document.addEventListener("click", (event) => {
  const target = event.target.closest(".movie-card");
  if (!target) return;
  const mId = Number(target.dataset.select);
  const movie = allMovies.find(v => v.id === mId);
  if (movie) openModalLazy(movie, "movie");
});

/* TMDB MASSIVE API FETCHING */
async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function fetchMultiplePages(endpoint, pages = 2) {
  const headers = { Authorization: `Bearer ${config.tmdbBearerToken}`, accept: "application/json" };
  const separator = endpoint.includes("?") ? "&" : "?";
  let merged = [];
  try {
    for (let i = 1; i <= pages; i++) {
      const data = await fetchJson(`${TMDB_BASE}${endpoint}${separator}page=${i}&language=en-US`, { headers });
      merged = [...merged, ...(data.results || [])];
    }
  } catch(e) { console.error("Failed fetching multi page", e); }
  return merged.map(mapBaseMovie).filter(m => m.poster_url && m.backdrop_url);
}

// Custom specialized fetch for Hashphile's favorites
async function fetchExactFavorites() {
  const queries = ["The Substance", "Rockstar", "Now You See Me", "Eternity", "About Time"];
  const headers = { Authorization: `Bearer ${config.tmdbBearerToken}`, accept: "application/json" };
  const exactMatches = [];

  for (const q of queries) {
    try {
      const data = await fetchJson(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(q)}&language=en-US&page=1`, { headers });
      if (data.results && data.results.length > 0) {
        exactMatches.push(mapBaseMovie(data.results[0]));
      }
    } catch (e) { console.error("Error fetching favorite", q, e); }
  }
  return exactMatches.filter(m => m.poster_url);
}

async function loadLiveMovies() {
  const statusEl = document.getElementById("tmdbStatus");
  const msgEl = document.getElementById("tmdbMessage");
  const banner = document.getElementById("tmdbBanner");

  if (!config.tmdbBearerToken) {
    statusEl.textContent = "Fallback Mode";
    msgEl.textContent = "API key missing. Load TMDB token to stream massive databases.";
    allMovies = fallbackMovies;
    updateHeroSection(allMovies[0]);
    return;
  }

  statusEl.textContent = "Loading Massive Data...";
  msgEl.textContent = "Booting up Custom Hashphile Environment...";

  try {
    const langFilter = "&with_original_language=hi|en|ml|ta|te";
    const [favorites, romance, trending, action, scifi, drama] = await Promise.all([
      fetchExactFavorites(),
      fetchMultiplePages(`/discover/movie?with_genres=10749${langFilter}`, 4), // Romance
      fetchMultiplePages(`/trending/movie/week`, 4), // Trending globally
      fetchMultiplePages(`/discover/movie?with_genres=28,53${langFilter}`, 4),
      fetchMultiplePages(`/discover/movie?with_genres=878${langFilter}`, 4),
      fetchMultiplePages(`/discover/movie?with_genres=18${langFilter}`, 4)
    ]);

    allMovies = [...favorites, ...romance, ...trending, ...action, ...scifi, ...drama];
    
    renderRow(favoritesRow, favorites);
    renderRow(romanceRow, romance);
    renderRow(popularRow, trending);
    renderRow(actionRow, action);
    renderRow(scifiRow, scifi);
    renderRow(dramaRow, drama);
    
    // Set Hero to the absolute latest trending movie globally!
    if(trending.length > 0) {
      banner.style.display = 'none';
      updateHeroSection(trending[0]);
    }
  } catch(e) {
    console.error(e);
    statusEl.textContent = "Data Pipeline Error";
  }
}

/* GLOBAL SEARCH ENGINE 2.0 */
const searchLoader = document.getElementById("searchLoader");
const clearSearchBtn = document.getElementById("clearSearch");

async function performSearch(query) {
  if (!query) {
    searchResultsArea.classList.remove("active");
    clearSearchBtn.style.display = "none";
    return;
  }
  
  searchResultsArea.classList.add("active");
  clearSearchBtn.style.display = "block";
  searchQueryText.textContent = query;
  searchLoader.style.display = "block";
  
  const headers = { Authorization: `Bearer ${config.tmdbBearerToken}`, accept: "application/json" };
  try {
    const data = await fetchJson(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, { headers });
    const results = (data.results || []).map(mapBaseMovie).filter(m => m.poster_url);
    
    // Smoothly update grid
    renderRow(searchGrid, results);
    searchLoader.style.display = "none";
    
    // Add to allMovies so results are selectable
    allMovies = [...allMovies, ...results];
  } catch (e) {
    console.error("Search failed", e);
    renderRow(searchGrid, []);
    searchLoader.style.display = "none";
  }
}

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim();
  
  if (!q) {
    performSearch("");
    return;
  }

  clearTimeout(searchDebounceTimeout);
  searchLoader.style.display = "block"; // Immediate feedback
  searchDebounceTimeout = setTimeout(() => {
    performSearch(q);
  }, 400); 
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  performSearch("");
  searchInput.focus();
});

// Close search on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && searchResultsArea.classList.contains("active")) {
    searchInput.value = "";
    performSearch("");
  }
});

// Carousel Pagination Controls (Horizontal scrolling arrows)
document.querySelectorAll('.scroll-btn.right-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const carousel = e.target.parentElement.querySelector('.poster-carousel');
    if (carousel) carousel.scrollBy({ left: 850, behavior: 'smooth' });
  });
});

document.querySelectorAll('.scroll-btn.left-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const carousel = e.target.parentElement.querySelector('.poster-carousel');
    if (carousel) carousel.scrollBy({ left: -850, behavior: 'smooth' });
  });
});

loadLiveMovies();

// --- Advanced Animations Engine --- //
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target); 
    }
  });
}, { root: null, rootMargin: '0px', threshold: 0.15 });

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});

setTimeout(() => {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}, 1500);

let lastScrollY = window.scrollY;
let isTicking = false;

window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
  if (!isTicking) {
    window.requestAnimationFrame(() => {
      if (heroSection && heroSection.style.display !== "none") {
        heroSection.style.backgroundPositionY = `calc(20% + ${lastScrollY * 0.4}px)`;
      }
      isTicking = false;
    });
    isTicking = true;
  }
});

// Parallax Footer Dynamic Margin
function setFooterMargin() {
  const footer = document.getElementById('siteFooter');
  const appContainer = document.querySelector('.app-container');
  if (footer && appContainer) {
    appContainer.style.marginBottom = `${footer.offsetHeight}px`;
  }
}

window.addEventListener('resize', setFooterMargin);
window.addEventListener('load', setFooterMargin);
setTimeout(setFooterMargin, 1000); // Safety check after TMDB paints

// Floating Back-To-Top Interaction
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 1200) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Recommendation Form Logic
const sendRecBtn = document.getElementById('sendRec');
if (sendRecBtn) {
  sendRecBtn.addEventListener('click', () => {
    const movie = document.getElementById('recMovie').value;
    const rating = document.getElementById('recRating').value;
    const desc = document.getElementById('recDesc').value;
    const points = document.getElementById('recPoints').value;

    if (!movie || !rating) {
      alert("Please enter at least the movie name and a rating!");
      return;
    }

    const subject = encodeURIComponent(`Recommendation: ${movie}`);
    const body = encodeURIComponent(
      `Movie: ${movie}\n` +
      `Rating: ${rating}/10\n\n` +
      `Description:\n${desc}\n\n` +
      `Rewatch Points:\n${points}`
    );

    window.location.href = `mailto:yusra.here77@gmail.com?subject=${subject}&body=${body}`;
  });
}

// --- Pulse Watch Party Engine 2.0 (Social Cinema) --- //

let peer = null;
let conn = null;
let localStream = null;
let isTyping = false;
let isOccupied = false;
let typingTimeout = null;

function triggerSyncWave() {
  pulseSidebar.classList.add("syncing");
  const wave = document.createElement("div");
  wave.className = "sync-wave";
  pulseSidebar.appendChild(wave);
  setTimeout(() => {
    pulseSidebar.classList.remove("syncing");
    wave.remove();
  }, 1200);
}

const appContainer = document.querySelector(".app-container");
const pulseSidebar = document.getElementById("pulseSidebar");
const openPulseBtn = document.getElementById("openPulse");
const closePulseBtn = document.getElementById("closePulse");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const copyPulseLinkBtn = document.getElementById("copyPulseLink");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const toggleVideoBtn = document.getElementById("toggleVideo");
const toggleAudioBtn = document.getElementById("toggleAudio");
const forceSyncBtn = document.getElementById("forceSync");
const statusDot = document.getElementById("statusDot");
const typingIndicator = document.getElementById("typingIndicator");
const pulseIdDisplay = document.getElementById("pulseIdDisplay");
const toastContainer = document.getElementById("toastContainer");

function initPeer() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || sessionStorage.getItem('pulseRoomId');

  statusDot.className = "status-dot connecting";
  peer = new Peer();

  peer.on('open', (id) => {
    console.log('My Pulse ID: ' + id);
    pulseIdDisplay.textContent = `ID: ${id.substring(0, 8)}...`;
    
    if (urlParams.get('room')) {
      connectToPeer(urlParams.get('room'));
    } else if (sessionStorage.getItem('pulseRoomId')) {
      // Re-initialize as host if we had a session but no room param
      updatePulseRoomInfo(id);
    } else {
      updatePulseRoomInfo(id);
    }
  });

  peer.on('connection', (c) => {
    if (isOccupied) {
      c.on('open', () => {
        c.send({ type: 'room-full' });
        setTimeout(() => c.close(), 500);
      });
      return;
    }
    conn = c;
    isOccupied = true;
    setupConnection();
    showToast("Friend joined! Room Locked.");
    pulseSidebar.classList.add("locked");
    statusDot.className = "status-dot connected";
  });

  peer.on('call', async (call) => {
    if (!localStream) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
      } catch(e) { showToast("Camera access denied."); }
    }
    call.answer(localStream);
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
      document.getElementById("remoteLabel").textContent = "Friend (Live)";
    });
  });

  peer.on('error', (err) => {
    console.error(err);
    showToast("Pulse Error: Peer server unreachable.");
    statusDot.className = "status-dot";
  });
}

function connectToPeer(targetId) {
  conn = peer.connect(targetId);
  setupConnection();
  startCall(targetId);
  statusDot.className = "status-dot connecting";
}

async function startCall(targetId) {
  try {
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    }
    const call = peer.call(targetId, localStream);
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
      document.getElementById("remoteLabel").textContent = "Friend (Live)";
      statusDot.className = "status-dot connected";
    });
  } catch (err) {
    showToast("Camera/Mic access required for video chat.");
  }
}

function setupConnection() {
  conn.on('open', () => {
    statusDot.className = "status-dot connected";
    showToast("Connected to party!");
    addChatMessage("system", "Pulse sync active.");
    createStardust(); // Whimsical welcome
  });

  conn.on('data', (data) => {
    if (data.type === 'chat') {
      addChatMessage("remote", data.message);
    } else if (data.type === 'typing') {
      typingIndicator.style.display = data.isTyping ? 'block' : 'none';
    } else if (data.type === 'sync-movie') {
      const movie = allMovies.find(m => m.id === data.movieId);
      if (movie && movie.id !== selectedId) {
        updateHeroSection(movie, false);
        showToast(`Sync: Switched to ${movie.title}`);
        triggerSyncWave();
      }
    } else if (data.type === 'open-player') {
      const movie = allMovies.find(m => m.id === data.movieId);
      if (movie) {
        openModalLazy(movie, data.playerType, false);
        showToast(`Sync: Playing ${movie.title}`);
        triggerSyncWave();
      }
    } else if (data.type === 'close-player') {
      closeVideoModal(false);
      showToast("Sync: Player closed by friend.");
      triggerSyncWave();
    } else if (data.type === 'room-full') {
      showToast("Private room is already full.");
      addChatMessage("system", "Access Denied: Room is private & full.");
    }
  });

  conn.on('close', () => {
    isOccupied = false;
    pulseSidebar.classList.remove("locked");
    statusDot.className = "status-dot";
    showToast("Friend left the Pulse.");
  });
}

function addChatMessage(type, message) {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = message;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>⚡</span> ${text}`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function updatePulseRoomInfo(id) {
  sessionStorage.setItem('pulseRoomId', id);
  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${id}`;
  copyPulseLinkBtn.onclick = () => {
    if (isOccupied) {
      showToast("Access Restricted: Session is private and locked.");
      return;
    }
    navigator.clipboard.writeText(roomUrl);
    copyPulseLinkBtn.textContent = "URL Copied!";
    showToast("Invite link copied to clipboard.");
    setTimeout(() => {
      copyPulseLinkBtn.textContent = isOccupied ? "Session Locked" : "Invite Friend";
    }, 2000);
  };
}

// Intercept Movie Changes
const originalUpdateHeroSection = updateHeroSection;
updateHeroSection = function(movie, broadcast = true) {
  originalUpdateHeroSection(movie);
  if (broadcast && conn && conn.open) {
    conn.send({ type: 'sync-movie', movieId: movie.id });
    triggerSyncWave();
  }
};

// UI Toggles
function togglePulse(forceClose = false) {
  const isOpen = pulseSidebar.classList.contains("open");
  if (isOpen || forceClose) {
    pulseSidebar.classList.remove("open");
    appContainer.classList.remove("pulse-open");
    openPulseBtn.classList.remove("active");
  } else {
    pulseSidebar.classList.add("open");
    appContainer.classList.add("pulse-open");
    openPulseBtn.classList.add("active");
    if (!peer) initPeer();
  }
}

openPulseBtn.addEventListener("click", () => togglePulse());
closePulseBtn.addEventListener("click", () => togglePulse(true));

// Chat & Typing Logic
sendChatBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (msg && conn && conn.open) {
    conn.send({ type: 'chat', message: msg });
    addChatMessage("local", msg);
    chatInput.value = "";
    sendTypingStatus(false);
  }
});

chatInput.addEventListener("input", () => {
  sendTypingStatus(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => sendTypingStatus(false), 2000);
});

function sendTypingStatus(typing) {
  if (isTyping !== typing && conn && conn.open) {
    isTyping = typing;
    conn.send({ type: 'typing', isTyping: typing });
  }
}

chatInput.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') sendChatBtn.click();
});

// Media Controls
toggleVideoBtn.addEventListener("click", () => {
  if (localStream) {
    const track = localStream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    toggleVideoBtn.textContent = track.enabled ? "Disable Camera" : "Enable Camera";
  }
});

toggleAudioBtn.addEventListener("click", () => {
  if (localStream) {
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    toggleAudioBtn.textContent = track.enabled ? "Mute Mic" : "Unmute Mic";
  }
});

forceSyncBtn.addEventListener("click", () => {
  const movie = allMovies.find(m => m.id === selectedId);
  const isModalOpen = videoModal.classList.contains("open");
  const playerType = modalPlayerType.textContent.includes("TRAILER") ? "trailer" : "movie";

  if (movie && conn && conn.open) {
    // Send full state sync
    conn.send({ 
      type: 'sync-movie', 
      movieId: movie.id 
    });
    
    if (isModalOpen) {
      conn.send({ 
        type: 'open-player', 
        movieId: movie.id, 
        playerType: playerType 
      });
    }

    showToast("Pulse Signal: Force Syncing all frames...");
    triggerSyncWave();
  }
});

// --- Hashphile Stardust (Whimsical Glitter) ---
function createStardust() {
  const colors = ['#DFFF00', '#FF00E5', '#00F0FF', '#FFFFFF'];
  const particleCount = 70;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "stardust-particle";
    
    // Randomize properties
    const size = Math.random() * 5 + 2 + "px";
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100 + "vw";
    const delay = Math.random() * 2 + "s";
    const duration = Math.random() * 3 + 2 + "s";
    
    particle.style.width = size;
    particle.style.height = size;
    particle.style.backgroundColor = color;
    particle.style.color = color;
    particle.style.left = left;
    particle.style.animationDelay = delay;
    particle.style.animationDuration = duration;
    
    document.body.appendChild(particle);
    
    // Self-destruct after animation
    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }
}

// Avatar Trigger
const avatar = document.querySelector(".profile-avatar");
if (avatar) {
  avatar.addEventListener("click", () => {
    // Spark Flash
    avatar.classList.remove("flash-active");
    void avatar.offsetWidth; // Force reflow
    avatar.classList.add("flash-active");
    
    // Trigger Stardust
    createStardust();
  });
}

// Boot logic
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('room')) {
    togglePulse();
  }
});

