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
  const escapedTitle = (movie.title || "Movie").replace(/'/g, "\\'");
  return `
    <div class="movie-card" data-select="${movie.id}">
      <div class="movie-poster" style="background-image:url('${movie.backdrop_url || movie.poster_url}')">
        <div class="card-overlay-actions">
           <button class="btn-suggest" onclick="event.stopPropagation(); suggestMovie(${movie.id}, '${escapedTitle}')" title="Suggest to Pulse">
             <i class="fas fa-paper-plane"></i>
           </button>
        </div>
      </div>
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
  const isWorkspace = pulseWorkspace.classList.contains("open");
  
  if (!isWorkspace) {
    modalTitle.textContent = "Loading Player...";
    movieInfoTitle.textContent = baseMovie.title;
    movieInfoDescription.textContent = baseMovie.overview;
    playerFrame.src = ""; // Clear
    watchProviderButton.href = `https://www.themoviedb.org/movie/${baseMovie.id}`;
    videoModal.classList.add("open");
    document.body.style.overflow = "hidden";
  } else {
    wsPlayerPlaceholder.style.display = "none";
    wsPlayerFrame.style.display = "block";
    wsPlayerFrame.src = ""; // Clear
  }

  // Pulse Workspace Sync: Update Now Playing Dashboard
  const npTitle = document.getElementById("npTitle");
  if (npTitle) npTitle.textContent = baseMovie.title;
  document.getElementById("nowPlayingCard").classList.add("active");

  if (broadcast && conn && conn.open) {
    conn.send({ type: 'open-player', movieId: baseMovie.id, playerType: type });
    addChatMessage("system", `You shifted the movie to ${baseMovie.title}`);
    triggerSyncWave();
  } else if (!broadcast) {
    addChatMessage("system", `Friend shifted movie to ${baseMovie.title}`);
  }

  const deep = await fetchDeepMovieDetails(baseMovie.id);
  const videoSrc = type === "movie" 
    ? `https://www.vidking.net/embed/movie/${baseMovie.id}?color=DFFF00&autoPlay=true`
    : (deep ? deep.trailer_embed : "about:blank");

  if (!isWorkspace) {
    modalTitle.textContent = "Now Playing";
    if (type === "movie") {
      modalPlayerType.className = "pill-badge type-movie";
      modalPlayerType.textContent = "FULL MOVIE";
    } else {
      modalPlayerType.className = "pill-badge type-trailer";
      modalPlayerType.textContent = "TRAILER";
    }
    playerFrame.src = videoSrc;
  } else {
    wsPlayerFrame.src = videoSrc;
    showToast(`Workspace playing: ${baseMovie.title}`);
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
let activeCall = null;
let remoteStream = null;
let isTyping = false;
let isOccupied = false;
let isGuest = false;
let typingTimeout = null;
let fallbackCallTimer = null;
let hasShownMediaReadyToast = false;

function triggerSyncWave() {
  pulseWorkspace.classList.add("syncing");
  const wave = document.createElement("div");
  wave.className = "sync-wave";
  pulseWorkspace.appendChild(wave);
  setTimeout(() => {
    pulseWorkspace.classList.remove("syncing");
    wave.remove();
  }, 1200);
}

function spawnReaction(emoji) {
  const container = document.body;
  const reaction = document.createElement("div");
  reaction.className = "floating-reaction";
  reaction.textContent = emoji;
  
  const isWp = pulseWorkspace.classList.contains("open");
  const randomX = Math.random() * 60 - 30;
  
  if (isWp) {
    // Center it over the theater
    reaction.style.left = `calc(50% + ${randomX}px)`;
    reaction.style.right = "auto";
  } else {
    reaction.style.right = `calc(440px + ${randomX}px)`;
  }
  
  container.appendChild(reaction);
  reaction.addEventListener("animationend", () => reaction.remove());
}

const appContainer = document.querySelector(".app-container");
const pulseWorkspace = document.getElementById("pulseWorkspace");
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
const wsPlayerFrame = document.getElementById("wsPlayerFrame");
const wsPlayerPlaceholder = document.getElementById("wsPlayerPlaceholder");
const toastContainer = document.getElementById("toastContainer");
const pulseStatusPill = document.getElementById("pulseStatusPill");
const localVideoCard = document.getElementById("localVideoCard");
const remoteVideoCard = document.getElementById("remoteVideoCard");
const localVideoEmpty = document.getElementById("localVideoEmpty");
const remoteVideoEmpty = document.getElementById("remoteVideoEmpty");
const guestPresenceItem = document.getElementById("guestPresenceItem");
const guestPresenceName = document.getElementById("guestPresenceName");
const remoteLabel = document.getElementById("remoteLabel");
const pulseRoomHeadline = document.getElementById("pulseRoomHeadline");
const pulseRoomSubcopy = document.getElementById("pulseRoomSubcopy");

const reactionDefaults = ["🔥", "❤️", "😂", "😮", "👏"];
document.querySelectorAll(".btn-reaction").forEach((btn, index) => {
  const emoji = reactionDefaults[index] || "✨";
  btn.dataset.emoji = emoji;
  btn.textContent = emoji;
});

function setPulseStatus(text) {
  if (pulseStatusPill) pulseStatusPill.textContent = text;
}

function setRoomCopy(title, copy) {
  if (pulseRoomHeadline) pulseRoomHeadline.textContent = title;
  if (pulseRoomSubcopy) pulseRoomSubcopy.textContent = copy;
}

function setGuestPresence(visible, online = false, label = "Friend") {
  if (!guestPresenceItem) return;
  guestPresenceItem.style.display = visible ? "flex" : "none";
  if (guestPresenceName) guestPresenceName.textContent = label;
  const dot = guestPresenceItem.querySelector(".presence-dot");
  if (dot) dot.className = `presence-dot ${online ? "online" : "connecting"}`;
}

function updateMediaButtons() {
  const videoTrack = localStream ? localStream.getVideoTracks()[0] : null;
  const audioTrack = localStream ? localStream.getAudioTracks()[0] : null;
  const videoEnabled = !!(videoTrack && videoTrack.enabled);
  const audioEnabled = !!(audioTrack && audioTrack.enabled);
  toggleVideoBtn.innerHTML = videoEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
  toggleAudioBtn.innerHTML = audioEnabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
  toggleVideoBtn.classList.toggle("active", videoEnabled);
  toggleAudioBtn.classList.toggle("active", audioEnabled);
}

function refreshVideoStage() {
  const hasLocalVideo = !!(localStream && localStream.getVideoTracks().length);
  const hasRemoteVideo = !!(remoteStream && remoteStream.getVideoTracks().length);
  if (localVideoCard) localVideoCard.classList.toggle("connected", hasLocalVideo);
  if (remoteVideoCard) remoteVideoCard.classList.toggle("connected", hasRemoteVideo);
  if (localVideoEmpty) localVideoEmpty.classList.toggle("hidden", hasLocalVideo);
  if (remoteVideoEmpty) remoteVideoEmpty.classList.toggle("hidden", hasRemoteVideo);
  if (remoteLabel && !hasRemoteVideo) {
    remoteLabel.textContent = conn && conn.open ? "Connecting live video..." : "Waiting for Friend...";
  }
}

async function attachLocalStream(stream) {
  if (!stream) return;
  localStream = stream;
  localVideo.srcObject = stream;
  localVideo.onloadedmetadata = () => localVideo.play().catch(() => {});
  updateMediaButtons();
  refreshVideoStage();
}

async function ensureLocalStream() {
  if (localStream) return localStream;
  const attempts = [
    { video: true, audio: true },
    { video: true, audio: false }
  ];

  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      await attachLocalStream(stream);
      if (!hasShownMediaReadyToast) {
        showToast(constraints.audio ? "Camera and mic are live." : "Camera is live.");
        hasShownMediaReadyToast = true;
      }
      return stream;
    } catch (error) {
      console.warn("Pulse media request failed:", constraints, error);
    }
  }

  updateMediaButtons();
  refreshVideoStage();
  throw new Error("pulse-media-unavailable");
}

function cleanupRemoteStream() {
  remoteStream = null;
  remoteVideo.srcObject = null;
  remoteVideo.classList.remove("playing");
  refreshVideoStage();
}

function sendPulseData(payload) {
  if (conn && conn.open) conn.send(payload);
}

function sendMediaState() {
  sendPulseData({
    type: "media-state",
    videoEnabled: !!(localStream && localStream.getVideoTracks()[0] && localStream.getVideoTracks()[0].enabled),
    audioEnabled: !!(localStream && localStream.getAudioTracks()[0] && localStream.getAudioTracks()[0].enabled)
  });
}

function bindCallEvents(call) {
  if (activeCall && activeCall !== call) {
    activeCall.close();
  }
  activeCall = call;
  refreshVideoStage();

  call.on("stream", (stream) => {
    remoteStream = stream;
    remoteVideo.srcObject = stream;
    remoteVideo.onloadedmetadata = () => remoteVideo.play().catch(() => {});
    remoteVideo.classList.add("playing");
    remoteLabel.textContent = "Friend (Live)";
    statusDot.className = "status-dot connected";
    setPulseStatus("Pulse live");
    refreshVideoStage();
    createStardust();
  });

  call.on("close", () => {
    if (activeCall === call) activeCall = null;
    cleanupRemoteStream();
    requestCallRetry();
  });

  call.on("error", (error) => {
    console.error("Pulse call failed:", error);
    if (activeCall === call) activeCall = null;
    cleanupRemoteStream();
    requestCallRetry();
  });
}

function requestCallRetry() {
  clearTimeout(fallbackCallTimer);
  if (!(conn && conn.open)) return;
  fallbackCallTimer = setTimeout(() => {
    if (!remoteStream && conn && conn.open) {
      sendPulseData({ type: "request-call" });
      if (!isGuest) startCall(conn.peer);
    }
  }, 1800);
}

function updateConnectedState(connected) {
  isOccupied = connected;
  statusDot.className = connected ? "status-dot connected" : "status-dot connecting";
  setPulseStatus(connected ? "Pulse linked" : "Pulse waiting");
  setGuestPresence(connected, connected);
  setRoomCopy(
    connected ? "Pulse is connected." : "Open Pulse and invite someone you love.",
    connected
      ? "Talk, react, and stay on the same movie together while both camera feeds stay live."
      : "Live camera, synced playback, reactions, and chat all stay together in one room."
  );
}

function initPeer() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  const storedId = sessionStorage.getItem('pulseRoomId');
  
  isGuest = !!roomParam;
  statusDot.className = "status-dot connecting";
  setPulseStatus(isGuest ? "Joining Pulse" : "Pulse opening");
  setRoomCopy(
    isGuest ? "Joining your Pulse room..." : "Your Pulse room is loading.",
    isGuest ? "We are connecting your live camera and sync controls now." : "Copy the invite once the room is ready and bring one person in."
  );

  const peerOptions = {
    debug: 2,
    config: {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        { 'urls': 'stun:stun3.l.google.com:19302' },
        { 'urls': 'stun:stun4.l.google.com:19302' }
      ]
    }
  };

  // If Host and have stored ID, re-claim it. Guests should always get a fresh ID.
  if (!isGuest && storedId) {
    peer = new Peer(storedId, peerOptions);
    console.log("Re-claiming previous Room ID:", storedId);
  } else {
    peer = new Peer(peerOptions);
  }

  peer.on('open', (id) => {
    console.log('My Pulse ID: ' + id);
    pulseIdDisplay.textContent = `ID: ${id.substring(0, 8)}...`;
    statusDot.className = "status-dot online"; // Host is online
    setPulseStatus(isGuest ? "Pulse ready" : "Pulse ready to invite");
    
    if (isGuest) {
      showToast("Syncing with Host...");
      connectToPeer(roomParam);
    } else {
      updatePulseRoomInfo(id);
    }
  });

  peer.on('connection', (c) => {
    // If we're already occupied by a different peer, reject
    if (isOccupied && conn && conn.peer !== c.peer) {
      c.on('open', () => {
        c.send({ type: 'room-full' });
        setTimeout(() => c.close(), 500);
      });
      return;
    }
    
    // Accept connection: can be a rejoin or a fresh join
    conn = c;
    setupConnection(c);
    showToast("Friend joined! Room Locked.");
    pulseWorkspace.classList.add("locked");
    statusDot.className = "status-dot connected";
  });

  peer.on('call', async (call) => {
    remoteLabel.textContent = "Answering live video...";
    try {
      const stream = await ensureLocalStream();
      bindCallEvents(call);
      call.answer(stream);
    } catch (error) {
      showToast("Camera access denied.");
    }
  });

  peer.on('disconnected', () => {
    console.log("Pulse Connection Lost. Reconnecting...");
    peer.reconnect();
  });

  peer.on('close', () => {
    isOccupied = false;
    showToast("Pulse Session Ended.");
  });

  peer.on('error', (err) => {
    console.error("Pulse Peer Error:", err.type, err);
    if (err.type === 'peer-not-found') {
      showToast("Social Error: Finding Friend Failed. Link might be expired.");
    } else if (err.type === 'unavailable-id') {
      showToast("Social Error: This Room ID is taken. Trying a fresh one...");
      sessionStorage.removeItem('pulseRoomId');
      setTimeout(() => location.reload(), 1500);
    } else if (err.type === 'network') {
      showToast("Social Error: Network issue. Check your connection.");
    } else {
      showToast(`Pulse Error: ${err.type}`);
    }
    statusDot.className = "status-dot";
    // If we're the host and it failed, we might need to reset
    if (!isGuest) {
       pulseIdDisplay.textContent = "ID: Offline";
    }
  });
}

function connectToPeer(targetId) {
  const connection = peer.connect(targetId, { reliable: true });
  setupConnection(connection);
  // startCall is now handled in setupConnection -> conn.on('open')
  statusDot.className = "status-dot connecting";
}

async function startCall(targetId) {
  try {
    const stream = await ensureLocalStream();
    const call = peer.call(targetId, stream);
    bindCallEvents(call);
  } catch (err) {
    showToast("Camera/Mic access required for video chat.");
  }
}

function setupConnection(connection = conn) {
  conn = connection;
  conn.on('open', () => {
    showToast("Linked to Party!");
    addChatMessage("system", "Pulse sync active.");
    createStardust(); // Celebratory welcome
    triggerSyncWave();
    
    // Status only turns green when data is open
    statusDot.className = "status-dot connected";
    
    // Pulse 11.0: Reveal guest presence badge
    updateConnectedState(true);
    sendPulseData({ type: "participant-ready" });
    sendMediaState();
    
    // GUARANTEED BILATERAL HANDSHAKE:
    if (isGuest) {
      console.log("Guest initiating video call to Host...");
      startCall(conn.peer);
    } else {
      console.log("Host monitoring connection...");
      // Auto-sync current movie state to the joiner
      const movie = allMovies.find(m => m.id === selectedId);
      if (movie) {
        const playerType = modalPlayerType.textContent.includes("TRAILER") ? "trailer" : "movie";
        const isPlayerActive = videoModal.classList.contains("open") || pulseWorkspace.classList.contains("open");
        
        setTimeout(() => {
          if (conn && conn.open) {
            conn.send({ type: 'sync-movie', movieId: movie.id });
            if (isPlayerActive) {
              conn.send({ type: 'open-player', movieId: movie.id, playerType: playerType });
            }
          }
        }, 1000);
      }

      // If Host doesn't see a stream in 3s, call the Guest as a fallback
      requestCallRetry();
    }
  });

  conn.on('close', () => {
    updateConnectedState(false);
    cleanupRemoteStream();
    showToast("Friend left. Room remains open.");
  });

  conn.on('error', (err) => {
    console.error("Connection Error:", err);
    isOccupied = false;
    statusDot.className = "status-dot";
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
    } else if (data.type === 'reaction') {
      spawnReaction(data.emoji);
      triggerSyncWave();
    } else if (data.type === 'suggestion') {
      handleMovieSuggestion(data.movieId, data.movieTitle);
    } else if (data.type === 'participant-ready') {
      updateConnectedState(true);
      requestCallRetry();
    } else if (data.type === 'request-call') {
      startCall(conn.peer);
    } else if (data.type === 'media-state') {
      remoteLabel.textContent = data.videoEnabled ? "Friend (camera on)" : "Friend (camera off)";
    } else if (data.type === 'moment') {
      addChatMessage("system", `Friend: ${data.message}`);
      spawnReaction("✨");
      triggerSyncWave();
    } else if (data.type === 'room-full') {
      showToast("Private room is already full.");
      addChatMessage("system", "Access Denied: Room is private & full.");
    }
  });

  conn.on('close', () => {
    pulseWorkspace.classList.remove("locked");
    cleanupRemoteStream();
  });
}

function addChatMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "system" ? "msg system" : (sender === "local" ? "msg local" : "msg remote");
  div.textContent = text;
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
  copyPulseLinkBtn.onclick = async () => {
    if (isOccupied) {
      showToast("Access Restricted: Session is private and locked.");
      return;
    }
    try {
      await navigator.clipboard.writeText(roomUrl);
      copyPulseLinkBtn.textContent = "Invite Copied";
      showToast("Invite link copied to clipboard.");
      setTimeout(() => {
        copyPulseLinkBtn.textContent = isOccupied ? "Session Locked" : "Invite Friend";
      }, 2000);
    } catch (error) {
      showToast("Copy failed. Clipboard access was blocked.");
    }
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
async function togglePulse(forceClose = false) {
  const isOpen = pulseWorkspace.classList.contains("open");
  if (isOpen || forceClose) {
    pulseWorkspace.classList.remove("open");
    document.body.classList.remove("pulse-active");
    openPulseBtn.classList.remove("active");
    
    if (document.fullscreenElement === pulseWorkspace) {
      document.exitFullscreen().catch(() => {});
    }
  } else {
    pulseWorkspace.classList.add("open");
    document.body.classList.add("pulse-active");
    openPulseBtn.classList.add("active");
    setPulseStatus("Pulse opening");
    refreshVideoStage();

    // Enter Fullscreen for cinematic feel
    if (!document.fullscreenElement) {
      pulseWorkspace.requestFullscreen().catch(err => {
        console.warn("Fullscreen request failed:", err);
      });
    }
    
    // Pre-acquire camera/mic and show preview
    try {
      await ensureLocalStream();
    } catch(e) { 
      showToast("Workspace Active. Camera access recommended.");
    }
    
    if (!peer) initPeer();
  }
}

// Handle manual fullscreen exit (e.g., ESC key)
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && pulseWorkspace.classList.contains("open")) {
    // If the user exited fullscreen manually but the workspace is still "open" in UI
    // We can choose to keep it open or close it. Usually better to keep UI consistent.
    console.log("Fullscreen exited manually.");
  }
});

openPulseBtn.addEventListener("click", () => togglePulse());
closePulseBtn.addEventListener("click", () => togglePulse(true));
const reconnectPulseBtn = document.getElementById("reconnectPulse");
if (reconnectPulseBtn) {
  reconnectPulseBtn.addEventListener("click", () => {
    clearTimeout(fallbackCallTimer);
    cleanupRemoteStream();
    if (activeCall) {
      activeCall.close();
      activeCall = null;
    }
    if (peer) {
      peer.destroy();
      peer = null;
    }
    showToast("Re-initializing Pulse...");
    initPeer();
  });
}

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
toggleVideoBtn.addEventListener("click", async () => {
  try {
    const stream = await ensureLocalStream();
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    updateMediaButtons();
    sendMediaState();
    refreshVideoStage();
  } catch (error) {
    showToast("We could not access your camera.");
  }
});

toggleAudioBtn.addEventListener("click", async () => {
  try {
    const stream = await ensureLocalStream();
    const track = stream.getAudioTracks()[0];
    if (!track) {
      showToast("Mic is unavailable on this device.");
      return;
    }
    track.enabled = !track.enabled;
    updateMediaButtons();
    sendMediaState();
  } catch (error) {
    showToast("We could not access your microphone.");
  }
});

forceSyncBtn.addEventListener("click", () => {
  const movie = allMovies.find(m => m.id === selectedId);
  const isModalOpen = videoModal.classList.contains("open");
  const isWorkspaceOpen = pulseWorkspace.classList.contains("open");
  const playerType = modalPlayerType.textContent.includes("TRAILER") ? "trailer" : "movie";

  if (movie && conn && conn.open) {
    // Send full state sync
    conn.send({ 
      type: 'sync-movie', 
      movieId: movie.id 
    });
    
    if (isModalOpen || isWorkspaceOpen) {
      conn.send({ 
        type: 'open-player', 
        movieId: movie.id, 
        playerType: playerType 
      });
    }

    requestCallRetry();
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

function emergencyResetPulse() {
  if (!(conn && conn.open)) {
    showToast("Open Pulse with your friend first.");
    return;
  }
  cleanupRemoteStream();
  if (activeCall) {
    activeCall.close();
    activeCall = null;
  }
  const movie = allMovies.find(m => m.id === selectedId);
  const playerType = modalPlayerType.textContent.includes("TRAILER") ? "trailer" : "movie";
  if (movie) {
    conn.send({ type: 'sync-movie', movieId: movie.id });
    conn.send({ type: 'open-player', movieId: movie.id, playerType: playerType });
  }
  requestCallRetry();
  startCall(conn.peer);
  triggerSyncWave();
  showToast("Pulse session is re-syncing.");
}

window.emergencyResetPulse = emergencyResetPulse;

// Pulse 9.0: Suggestion Engine
function handleMovieSuggestion(id, title) {
  showToast(`Suggestion: ${title}`);
  addChatMessage("system", `Friend suggested watching "${title}".`);
  triggerSyncWave();
}

function suggestMovie(id, title) {
  if (conn && conn.open) {
    conn.send({ type: 'suggestion', movieId: id, movieTitle: title });
    showToast("Suggestion sent!");
    addChatMessage("system", `You suggested "${title}" to your friend.`);
  } else {
    showToast("Connect Pulse to suggest movies.");
  }
}

// Reaction Pickers
document.querySelectorAll(".btn-reaction").forEach(btn => {
  btn.addEventListener("click", () => {
    const emoji = btn.dataset.emoji;
    if (conn && conn.open) {
      conn.send({ type: 'reaction', emoji: emoji });
      spawnReaction(emoji);
      triggerSyncWave();
    } else {
      showToast("Connect to a Pulse to send reactions!");
    }
  });
});

document.querySelectorAll(".moment-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const message = btn.dataset.message;
    if (conn && conn.open) {
      conn.send({ type: "moment", message });
      addChatMessage("system", `You: ${message}`);
      triggerSyncWave();
    } else {
      showToast("Connect Pulse to send a moment.");
    }
  });
});

// Boot logic
window.addEventListener('load', () => {
  setPulseStatus("Pulse offline");
  refreshVideoStage();
  updateMediaButtons();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('room')) {
    togglePulse();
  }
});
