const config = window.MILKA_CONFIG || {};
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";
const FALLBACK_COUNTRY = config.country || "US";

const fallbackMovies = [
  {
    id: 155,
    title: "The Dark Knight",
    overview: "Batman faces the Joker as Gotham is pushed into chaos and moral collapse.",
    genre_names: ["Action", "Crime"],
    vote_average: 9.0,
    runtime: 152,
    release_year: "2008",
    poster_url: `${TMDB_IMAGE}/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg`,
    backdrop_url: `${TMDB_IMAGE}/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg`,
    trailer_url: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    trailer_embed: "https://www.youtube.com/embed/EXeTwQWrcwY?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en",
    provider_summary: "Add a TMDB API token to load live provider availability.",
    provider_link: "https://www.themoviedb.org/movie/155-the-dark-knight/watch"
  },
  {
    id: 27205,
    title: "Inception",
    overview: "A skilled extractor enters layered dream worlds to plant an idea that could change everything.",
    genre_names: ["Sci-Fi", "Thriller"],
    vote_average: 8.8,
    runtime: 148,
    release_year: "2010",
    poster_url: `${TMDB_IMAGE}/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg`,
    backdrop_url: `${TMDB_IMAGE}/original/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg`,
    trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    trailer_embed: "https://www.youtube.com/embed/YoHD9XEInc0?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en",
    provider_summary: "Live provider links appear after TMDB is configured.",
    provider_link: "https://www.themoviedb.org/movie/27205-inception/watch"
  },
  {
    id: 157336,
    title: "Interstellar",
    overview: "A team travels beyond our galaxy in search of a future for humanity as Earth begins to fail.",
    genre_names: ["Sci-Fi", "Adventure"],
    vote_average: 8.7,
    runtime: 169,
    release_year: "2014",
    poster_url: `${TMDB_IMAGE}/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdrop_url: `${TMDB_IMAGE}/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg`,
    trailer_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    trailer_embed: "https://www.youtube.com/embed/zSWdZVtXT7E?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en",
    provider_summary: "Live provider links appear after TMDB is configured.",
    provider_link: "https://www.themoviedb.org/movie/157336-interstellar/watch"
  },
  {
    id: 872585,
    title: "Oppenheimer",
    overview: "The story of J. Robert Oppenheimer and the impossible weight of building the atomic bomb.",
    genre_names: ["Drama", "History"],
    vote_average: 8.3,
    runtime: 180,
    release_year: "2023",
    poster_url: `${TMDB_IMAGE}/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg`,
    backdrop_url: `${TMDB_IMAGE}/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg`,
    trailer_url: "https://www.youtube.com/watch?v=uYPbbksJxIg",
    trailer_embed: "https://www.youtube.com/embed/uYPbbksJxIg?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en",
    provider_summary: "Live provider links appear after TMDB is configured.",
    provider_link: "https://www.themoviedb.org/movie/872585-oppenheimer/watch"
  }
];

// Replicator
let allMovies = [...fallbackMovies];
let selectedId = fallbackMovies[0].id;

// DOM Elements
const navbar = document.getElementById("navbar");
const searchInput = document.getElementById("searchInput");
const heroSection = document.getElementById("hero");
const heroTitle = document.getElementById("heroTitle");
const heroReleaseYear = document.getElementById("heroReleaseYear");
const heroRuntime = document.getElementById("heroRuntime");
const heroDescription = document.getElementById("heroDescription");
const heroGenreTag = document.getElementById("heroGenreTag");
const heroRating = document.getElementById("heroRating");
const watchTrailerButton = document.getElementById("watchTrailerButton");
const moreInfoButton = document.getElementById("moreInfoButton");

// Rows
const popularRow = document.getElementById("popularRow");
const actionRow = document.getElementById("actionRow");
const scifiRow = document.getElementById("scifiRow");
const dramaRow = document.getElementById("dramaRow");

// Modal Elements
const videoModal = document.getElementById("videoModal");
const closeModalBtn = document.getElementById("closeModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const trailerFrame = document.getElementById("trailerFrame");
const trailerTitle = document.getElementById("trailerTitle");
const trailerDescription = document.getElementById("trailerDescription");
const providerName = document.getElementById("providerName");
const providerSummary = document.getElementById("providerSummary");
const watchProviderButton = document.getElementById("watchProviderButton");
const openTrailerLink = document.getElementById("openTrailerLink");

// Navbar Scroll Effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
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
        <p class="movie-meta">${movie.genre_names[0] || ""} • ${movie.release_year}</p>
      </div>
    </div>
  `;
}

function renderRow(container, movies) {
  if (!container) return;
  if (!movies.length) {
    container.innerHTML = `<div style="color:#666; padding:1vw;">No movies found</div>`;
    return;
  }
  container.innerHTML = movies.map(m => createMovieCard(m)).join("");
}

function renderMovies() {
  const actionMovies = allMovies.filter(movie => movie.genre_names.includes("Action") || movie.genre_names.includes("Thriller"));
  const scifiMovies = allMovies.filter(movie => movie.genre_names.includes("Sci-Fi") || movie.genre_names.includes("Science Fiction"));
  const dramaMovies = allMovies.filter(movie => movie.genre_names.includes("Drama"));

  renderRow(popularRow, allMovies.slice(0, 10));
  renderRow(actionRow, actionMovies.length ? actionMovies : allMovies.slice(0, 8));
  renderRow(scifiRow, scifiMovies.length ? scifiMovies : allMovies.slice(2, 10));
  renderRow(dramaRow, dramaMovies.length ? dramaMovies : allMovies.slice(1, 9));
}

function updateHeroSection(movie) {
  if (!movie) return;
  selectedId = movie.id;
  
  heroTitle.textContent = movie.title;
  heroReleaseYear.textContent = movie.release_year;
  heroRuntime.textContent = formatRuntime(movie.runtime);
  heroDescription.textContent = movie.overview;
  heroRating.textContent = movie.vote_average >= 7 ? "98% Match" : "80% Match";
  heroGenreTag.textContent = movie.genre_names.join(" • ");
  
  // Set hero backdrop seamlessly
  heroSection.style.backgroundImage = `url("${movie.backdrop_url}")`;
}

function openModal(movie) {
  trailerTitle.textContent = movie.title;
  trailerDescription.textContent = movie.overview;
  trailerFrame.src = movie.trailer_embed || "about:blank";
  
  providerName.textContent = movie.provider_name || "Available Now";
  providerSummary.textContent = movie.provider_summary || "See TMDb for links.";
  
  watchProviderButton.href = movie.provider_link || "#";
  openTrailerLink.href = movie.trailer_url || "#";

  videoModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  videoModal.classList.remove("open");
  document.body.style.overflow = "";
  // Stop video playback safely
  const currentSrc = trailerFrame.src;
  trailerFrame.src = "";
  setTimeout(() => { trailerFrame.src = currentSrc; }, 200);
}

closeModalBtn.addEventListener("click", closeVideoModal);
modalBackdrop.addEventListener("click", closeVideoModal);

// Hero button listeners
watchTrailerButton.addEventListener("click", () => {
  const m = allMovies.find(v => v.id === selectedId);
  if (m) openModal(m);
});

moreInfoButton.addEventListener("click", () => {
  const m = allMovies.find(v => v.id === selectedId);
  if (m) openModal(m);
});

document.addEventListener("click", (event) => {
  const target = event.target.closest(".movie-card");
  if (!target) return;
  
  const mId = Number(target.dataset.select);
  const movie = allMovies.find(v => v.id === mId);
  if (movie) openModal(movie);
});

/* TMDB API INTEGRATION */

function findOfficialTrailer(videos) {
  const official = videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official);
  const fallback = videos.find((video) => video.site === "YouTube" && video.type === "Trailer");
  return official || fallback || null;
}

function createTrailerEmbed(keyOrUrl) {
  if (!keyOrUrl) return "about:blank";
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  return `https://www.youtube.com/embed/${keyOrUrl}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en`;
}

function buildProviderSummary(providerData, region) {
  const result = providerData?.results?.[region] || providerData?.results?.US;
  if (!result) {
    return {
      providerLink: "",
      providerName: "Legal watch links",
      providerSummary: "No provider data returned for this region."
    };
  }
  const groups = ["flatrate", "rent", "buy", "ads"]
    .flatMap((key) => (result[key] || []).map((p) => p.provider_name));
  const unique = [...new Set(groups)].slice(0, 4);

  return {
    providerLink: result.link || "",
    providerName: unique[0] || "Legal watch links",
    providerSummary: unique.length ? `Available via ${unique.join(", ")}.` : "Available now."
  };
}

function mapMovieDetails(movie, genresById, details, providerData) {
  const videos = details?.videos?.results || [];
  const trailer = findOfficialTrailer(videos);
  const genreNames = (movie.genre_ids || []).map((id) => genresById.get(id)).filter(Boolean);
  const providers = buildProviderSummary(providerData, FALLBACK_COUNTRY);
  const releaseDate = movie.release_date || details?.release_date || "";

  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview || "Overview unavailable.",
    genre_names: genreNames,
    vote_average: movie.vote_average || details?.vote_average || 0,
    runtime: details?.runtime || 0,
    release_year: releaseDate ? releaseDate.slice(0, 4) : "Unknown",
    poster_url: movie.poster_path ? `${TMDB_IMAGE}/w500${movie.poster_path}` : "",
    backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE}/original${movie.backdrop_path}` : "",
    trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
    trailer_embed: trailer ? createTrailerEmbed(trailer.key) : "about:blank",
    provider_link: providers.providerLink,
    provider_name: providers.providerName,
    provider_summary: providers.providerSummary
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadLiveMovies() {
  const statusEl = document.getElementById("tmdbStatus");
  const msgEl = document.getElementById("tmdbMessage");
  const banner = document.getElementById("tmdbBanner");

  if (!config.tmdbBearerToken) {
    statusEl.textContent = "Fallback Demo Mode";
    msgEl.textContent = "Add your TMDB bearer token in config.js for 1000s of titles.";
    banner.style.backgroundColor = "rgba(109, 109, 110, 0.4)";
    renderMovies();
    updateHeroSection(allMovies[0]);
    return;
  }

  statusEl.textContent = "Loading TMDB catalog...";
  msgEl.textContent = "Fetching Netflix-like catalog rows...";

  const headers = {
    Authorization: `Bearer ${config.tmdbBearerToken}`,
    accept: "application/json"
  };

  try {
    const [popular, genresResponse] = await Promise.all([
      fetchJson(`${TMDB_BASE}/trending/movie/week?language=en-US`, { headers }),
      fetchJson(`${TMDB_BASE}/genre/movie/list?language=en-US`, { headers })
    ]);

    const genresById = new Map((genresResponse.genres || []).map((g) => [g.id, g.name]));
    const candidates = (popular.results || []).slice(0, 16);

    const enriched = await Promise.all(candidates.map(async (movie) => {
      const [details, providers] = await Promise.all([
        fetchJson(`${TMDB_BASE}/movie/${movie.id}?append_to_response=videos&language=en-US`, { headers }),
        fetchJson(`${TMDB_BASE}/movie/${movie.id}/watch/providers`, { headers })
      ]);
      return mapMovieDetails(movie, genresById, details, providers);
    }));

    allMovies = enriched.filter((m) => m.poster_url && m.backdrop_url);
    if(allMovies.length > 0) {
      banner.style.display = 'none'; // hide TMDB warning if success
    }
    
    renderMovies();
    updateHeroSection(allMovies[0]);
  } catch(e) {
    console.error(e);
    statusEl.textContent = "TMDB Load Error";
    msgEl.textContent = "Falling back to sample fallback movies. Please check your API key.";
    renderMovies();
    updateHeroSection(allMovies[0]);
  }
}

// Search Filter (optional simple local filter)
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".movie-card");
  cards.forEach(card => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    card.style.display = title.includes(query) ? "block" : "none";
  });
});

// Initialization
loadLiveMovies();
