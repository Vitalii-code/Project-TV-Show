const grid = document.getElementById("grid");
const showSelect = document.getElementById("show-select");
const searchInput = document.getElementById("search-input");
const select = document.getElementById("episode-select");

const SHOWS_URL = "https://api.tvmaze.com/shows";
const PLACEHOLDER_IMAGE =
  "https://placehold.co/250x140?text=No+image+available";

let currentEpisodes = [];
let currentShowId = null;

const episodeCache = new Map();

async function setup() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("showId")) {
    const showId = params.get("showId");

    if (isValidShowId(showId)) {
      currentShowId = showId;

      // load specific show list
      setupSearch();
      setupEpisodeSelector();
      setupShowSelector();

      await fetch(SHOWS_URL)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          return response.json();
        })
        .then((shows) => {
          const sortedShows = shows.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          );
          populateShowSelect(sortedShows);

          if (sortedShows.length) {
            showControls();
            loadShow(currentShowId);
          }
        })
        .catch((err) => {
          displayError(err.message);
        });
    } else {
      displayError(`Bad showId passed in: "${showId}"`);
      return;
    }
  } else {
    // display show search
    loadShowFinder();
  }
}

function loadShowFinder() {
  grid.innerHTML = "";
}

function showControls() {
  showSelect.classList.remove("controls-hidden");
  searchInput.classList.remove("controls-hidden");
  select.classList.remove("controls-hidden");
}

function isValidShowId(value) {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
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
  showSelect.value = showId;
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

function render(episodeList) {
  const template = document.getElementById("episode-card");

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

    clone.querySelector(".thumb").src =
      episode.image && episode.image.medium
        ? episode.image.medium
        : PLACEHOLDER_IMAGE;
    clone.querySelector(".description").textContent = episode.summary;

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
    const selectedId = select.value;
    if (!selectedId) return;

    searchInput.value = "";

    const target = document.getElementById(`episode-${selectedId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

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
