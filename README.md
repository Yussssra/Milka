# milka

Static movie site wired for real TMDB data.

## Configure live API

1. Open `config.js`
2. Paste your TMDB v4 bearer token into `tmdbBearerToken`
3. Set `country` to your provider region if needed
4. Open `index.html`

Without a token, the UI uses a fallback real-movie catalog.

## What this setup does

- Loads live popular movies from TMDB
- Fetches official posters and backdrops
- Loads official YouTube trailers
- Requests captions by default in trailer embeds
- Shows TMDB provider availability page for legal viewing options

## Important note

Full in-site movie playback with subtitles requires you to legally host or license the content and use a player like Mux or Vimeo with subtitle tracks.
