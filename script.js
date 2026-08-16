//You can edit ALL of the code here
const grid = document.getElementById("grid");
const showSelect = document.getElementById("show-select");
const searchInput = document.getElementById("search-input");
const select = document.getElementById("episode-select");

const SHOWS_URL = "https://api.tvmaze.com/shows";

// Currently loaded episode list for whichever show is selected.
// Kept as shared state instead of a closure param, so listeners only
// need to be attached once (see note above).
let currentEpisodes = [];
let currentShowId = null;

// Cache of already-fetched episode lists, keyed by show id, so switching
// back to a previously-viewed show never re-fetches it (requirement 6).
const episodeCache = new Map();

async function setup() {
  setupSearch();
  setupEpisodeSelector();
  setupShowSelector();

  await fetch(SHOWS_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    })
    .then((shows) => {
      // Alphabetical, case-insensitive (requirement 5)
      const sortedShows = shows.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {sensitivity: "base"}),
      );
      populateShowSelect(sortedShows);

      if (sortedShows.length) {
        loadShow(sortedShows[0].id);
      }
    })
    .catch((err) => {
      displayError(err.message);
    });
}

function populateShowSelect(shows) {
  showSelect.innerHTML = "";
  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });
}

function setupShowSelector() {
  showSelect.addEventListener("change", () => {
    loadShow(Number(showSelect.value));
  });
}

function loadShow(showId) {
  currentShowId = showId;
  searchInput.value = "";

  if (episodeCache.has(showId)) {
    currentEpisodes = episodeCache.get(showId);
    render(currentEpisodes);
    return;
  }

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    })
    .then((episodeList) => {
      episodeCache.set(showId, episodeList);
      // Ignore a stale response if the user has since picked another show
      if (currentShowId === showId) {
        currentEpisodes = episodeList;
        render(currentEpisodes);
      }
    })
    .catch((err) => {
      displayError(err.message);
    });
}

function displayError(errorMessage) {
  grid.innerHTML = "";

  const template = document.getElementById("error");
  const clone = template.content.cloneNode(true);
  clone.querySelector(".error-message").textContent = errorMessage;

  document.body.appendChild(clone);
}

// Renders a given list of episodes into the grid (used for both "show all"
// and "show filtered results") and updates the match-count message.
function render(episodeList) {
  const template = document.getElementById("episode-card");

  // Clear previous render before drawing the new (possibly filtered) list
  grid.innerHTML = "";

  if (episodeList == undefined || episodeList.length === 0) return;

  for (const episode of episodeList) {
    const clone = template.content.cloneNode(true);

    // Give each card a stable id so the episode selector can scroll to it
    const card =
      clone.querySelector(".episode-card") || clone.firstElementChild;
    if (card) card.id = `episode-${episode.id}`;

    clone.querySelector(".title").textContent =
      episode.name +
      " - S" +
      String(episode.season).padStart(2, "0") +
      "E" +
      String(episode.number).padStart(2, "0");
    clone.querySelector(".thumb").src = episode.image.medium;
    clone.querySelector(".description").innerHTML = episode.summary;

    grid.appendChild(clone);
  }

  updateMatchCount(episodeList.length, currentEpisodes.length);
  populateEpisodeSelectOptions(episodeList);
}

function updateMatchCount(shown, total) {
  const rootElem = document.getElementById("root");
  rootElem.textContent =
    shown === total
      ? `Got ${total} episode(s)`
      : `Displaying ${shown}/${total} episode(s)`;
}

// --- Search ---

function setupSearch() {
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = term
      ? currentEpisodes.filter((episode) => {
          const name = episode.name.toLowerCase();
          const summary = (episode.summary || "").toLowerCase();
          return name.includes(term) || summary.includes(term);
        })
      : currentEpisodes;

    render(filtered);
  });
}

// --- Episode selector ---

function setupEpisodeSelector() {
  select.addEventListener("change", () => {
    if (!select.value) return;

    // Reset any active search so the target episode is guaranteed
    // to be in the rendered list before we try to scroll to it.
    searchInput.value = "";
    render(currentEpisodes);

    const target = document.getElementById(`episode-${select.value}`);
    if (target) {
      target.scrollIntoView({behavior: "smooth", block: "start"});
    }
  });
}

// Rebuilds the <select> options to match whatever list is currently
// rendered (so it stays in sync across shows and search filtering).
function populateEpisodeSelectOptions(episodeList) {
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Jump to episode...";
  select.appendChild(placeholder);

  if (episodeList == undefined || episodeList.length === 0) return;

  for (const episode of episodeList) {
    const code =
      "S" +
      String(episode.season).padStart(2, "0") +
      "E" +
      String(episode.number).padStart(2, "0");
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${code} - ${episode.name}`;
    select.appendChild(option);
  }
}

window.onload = setup;
