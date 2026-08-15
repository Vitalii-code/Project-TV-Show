//You can edit ALL of the code here

const grid = document.getElementById("grid");

async function setup() {
  const url = "https://api.tvmaze.com/shows/82/episodes";

  await fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    })
    .then((episodeList) => {
      if (episodeList?.length) {
        setupSearch(episodeList);
        setupEpisodeSelector(episodeList);
        render(episodeList);
      }
    })
    .catch((err) => {
      displayError(err);
      throw new Error(err);
    });
}

function displayError(errorMessage) {
  grid.innerHTML = "";

  const template = document.getElementById("error");

  let clone = template.content.cloneNode(true);

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

  updateMatchCount(episodeList.length, episodeList.length);
}

function updateMatchCount(shown, total) {
  const rootElem = document.getElementById("root");
  rootElem.textContent =
    shown === total
      ? `Got ${total} episode(s)`
      : `Displaying ${shown}/${total} episode(s)`;
}

// --- Search ---

function setupSearch(episodeList) {
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = term
      ? episodeList.filter((episode) => {
        const name = episode.name.toLowerCase();
        const summary = (episode.summary || "").toLowerCase();
        return name.includes(term) || summary.includes(term);
      })
      : episodeList;

    render(filtered);
  });
}

// --- Episode selector ---

function setupEpisodeSelector(episodeList) {
  if (episodeList == undefined || episodeList.length === 0) return;

  const select = document.getElementById("episode-select");

  // Placeholder option so nothing is auto-selected/scrolled-to on load
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Jump to episode...";
  select.appendChild(placeholder);

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

  select.addEventListener("change", () => {
    if (!select.value) return;

    // Reset any active search so the target episode is guaranteed
    // to be in the rendered list before we try to scroll to it.
    const searchInput = document.getElementById("search-input");
    searchInput.value = "";
    render(episodeList);

    const target = document.getElementById(`episode-${select.value}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

window.onload = setup;
