//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();

  const grid = document.getElementById("grid");
  const template = document.getElementById("episode-card");

  for (const episode of allEpisodes) {
    const clone = template.content.cloneNode(true);

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

  makePageForEpisodes(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.textContent = `Got ${episodeList.length} episode(s)`;
}

window.onload = setup;
