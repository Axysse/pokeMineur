import { fetchPoke } from "./fetch.js";

let allPokemonData = [];
let gameOver = false;
let gameStarted = false;
let safeCellsToReveal = 0;
let revealedSafeCellsCount = 0;
let grid;
let pokeballNumberElement;
let pokeballNbr = 0;
let allCells;
let pokeList;
let capturedPokemonIds = new Set();
let capturedPokemonCounts = {};
let playerMoney = 0; // NOUVEAU : Variable pour l'argent du joueur
let playerMoneyElement; // NOUVEAU : Élément DOM pour afficher l'argent

const EVOLUTIONS = {
  19: { evolvesTo: 20, threshold: 40, moneyBonus: 70 }, // Rattata (19) évolue en Rattatac (20) après 50 captures
  16: { evolvesTo: 17, threshold: 10, moneyBonus: 70 }, // Roucool (16) évolue en Roucoups (17) après 50 captures
  17: { evolvesTo: 18, threshold: 2, moneyBonus: 150 }, // Roucoups (17) évolue en Roucarnage (18) après 70 captures
  52: { evolvesTo: 53, threshold: 50, moneyBonus: 120 }, // Miaouss évolue en Persian après 50 captures
  129: { evolvesTo: 130, threshold: 70, moneyBonus: 350 }, // Magicarpe évolue en Léviathor après 50 captures
  56: { evolvesTo: 59, threshold: 40, moneyBonus: 200 }, // Férosinge évolue en Colossinge après 50 captures
  25: { evolvesTo: 26, threshold: 40, moneyBonus: 350 }, // Pikachu évolue en Raichu après 50 captures
  21: { evolvesTo: 22, threshold: 40, moneyBonus: 80 }, // Piafabec évolue en Rapasdepic après 50 captures
  10: { evolvesTo: 11, threshold: 40, moneyBonus: 70 }, // Chenipan évolue en Crysacier après 50 captures
  11: { evolvesTo: 12, threshold: 40, moneyBonus: 50 }, // Crysacier évolue en Papillusion après 50 captures
  13: { evolvesTo: 14, threshold: 30, moneyBonus: 80 }, // Aspicot évolue en Coconfort après 50 captures
  14: { evolvesTo: 15, threshold: 30, moneyBonus: 150 }, // Cocnfort évolue en Dardagnan après 50 captures
  29: { evolvesTo: 30, threshold: 40, moneyBonus: 80 }, // nidoran femelle évolue en Nidorina après 50 captures
  30: { evolvesTo: 31, threshold: 30, moneyBonus: 170 }, // nidorana femelle évolue en Nidoqueen après 50 captures
  32: { evolvesTo: 33, threshold: 40, moneyBonus: 80 }, // nidoran male évolue en Nidorino après 50 captures
  33: { evolvesTo: 34, threshold: 30, moneyBonus: 170 }, // nidorino évolue en Nidoking après 50 captures
  35: { evolvesTo: 36, threshold: 30, moneyBonus: 250 }, // melofée évolue en Melodelfe après 50 captures
  41: { evolvesTo: 42, threshold: 50, moneyBonus: 60 }, // melofée évolue en Melodelfe après 50 captures
  46: { evolvesTo: 47, threshold: 40, moneyBonus: 120 }, // melofée évolue en Melodelfe après 50 captures
  60: { evolvesTo: 61, threshold: 40, moneyBonus: 110 }, // Ptitard évolue en Tetarte après 50 captures
  61: { evolvesTo: 62, threshold: 30, moneyBonus: 350 }, // tetarte évolue en Tartard après 50 captures
  74: { evolvesTo: 75, threshold: 40, moneyBonus: 150 }, // racaillou évolue en Gravalanch après 50 captures
  75: { evolvesTo: 76, threshold: 30, moneyBonus: 350 }, // Gravalanch évolue en Grolem après 50 captures
  79: { evolvesTo: 80, threshold: 30, moneyBonus: 300 }, // Ramoloss évolue en Flagadoss après 50 captures
  118: { evolvesTo: 119, threshold: 30, moneyBonus: 70 }, // Poissireine évolue en Poissoroy après 50 captures
  116: { evolvesTo: 117, threshold: 30, moneyBonus: 150 }, // Hypotrempe évolue en Hyporoi après 50 captures
};

const LEVELS = {
  "hautes-herbes": {
    id: "hautes-herbes",
    title: "Hautes-herbes",
    rows: 5,
    cols: 5,
    minMines: 0, // Minimum de Voltorbes
    maxMines: 0, // Maximum de Voltorbes
    backgroundImage: "./img/grass.jpg",
    cost: 0,
    encounterTable: [
      { pokemonId: 16, chance: 30, money: 10 }, // Roucool
      { pokemonId: 19, chance: 30, money: 10 }, // Ratata
    ],
  },
  route_de_jadielle: {
    id: "route-de-jadielle",
    title: "Route de Jadielle",
    rows: 5,
    cols: 5,
    minMines: 3, // Minimum de Voltorbes
    maxMines: 6, // Maximum de Voltorbes
    backgroundImage: "./img/road.jpg",
    cost: 150,
    encounterTable: [
      { pokemonId: 1, chance: 1, money: 2500 }, // Bulbizarre
      { pokemonId: 16, chance: 25, money: 10 }, // Roucool
      { pokemonId: 19, chance: 25, money: 10 }, // Ratata
      { pokemonId: 52, chance: 10, money: 40 }, // Miaouss
      { pokemonId: 56, chance: 5, money: 70 }, // Férosinge
      { pokemonId: 29, chance: 15, money: 40 }, // Nidoran Femelle
      { pokemonId: 32, chance: 15, money: 40 }, // Nidoran Mâle
      { pokemonId: 21, chance: 20, money: 25 }, // Piafabec
    ],
  },
  foret: {
    id: "foret",
    title: "Fôret",
    rows: 7,
    cols: 7,
    minMines: 4,
    maxMines: 8,
    backgroundImage: "./img/forest.jpg",
    cost: 500,
    encounterTable: [
      { pokemonId: 10, chance: 35, money: 10 }, // Chenipan
      { pokemonId: 13, chance: 30, money: 10 }, // Aspicot
      { pokemonId: 25, chance: 2, money: 1200 }, // Pikachu
      { pokemonId: 127, chance: 10, money: 200 }, // Scarabrute
      { pokemonId: 143, chance: 3, money: 750 }, // Ronflex
      { pokemonId: 123, chance: 3, money: 750 }, // Insécateur
    ],
  },
  riviere: {
    id: "riviere",
    title: "Rivière",
    rows: 7,
    cols: 7,
    minMines: 6,
    maxMines: 10,
    backgroundImage: "./img/riviere.jpg",
    cost: 1000,
    encounterTable: [
      { pokemonId: 7, chance: 1, money: 2500 }, // Carapuce
      { pokemonId: 54, chance: 2, money: 1000 }, // Psykokwak
      { pokemonId: 60, chance: 10, money: 70 }, // Ptitard
      { pokemonId: 129, chance: 35, money: 10 }, // Magicarpe
      { pokemonId: 79, chance: 15, money: 40 }, // Ramoloss
    ],
  },
  caverne: {
    id: "caverne",
    title: "Caverne",
    rows: 8,
    cols: 8,
    minMines: 9,
    maxMines: 16,
    backgroundImage: "./img/cavern.jpg",
    cost: 1500,
    encounterTable: [
      { pokemonId: 41, chance: 30, money: 10 }, // Nosferapti
      { pokemonId: 74, chance: 30, money: 10 }, // Racaillou
      { pokemonId: 95, chance: 5, money: 250 }, // Onix
      { pokemonId: 46, chance: 15, money: 50 }, // Paras
      { pokemonId: 35, chance: 2, money: 350 }, // Melofée
      { pokemonId: 27, chance: 20, money: 40 }, // Sabelette
    ],
  },
  plage: {
    id: "plage",
    title: "Plage",
    rows: 8,
    cols: 8,
    minMines: 9,
    maxMines: 16,
    backgroundImage: "./img/plage.jpg",
    cost: 1500,
    encounterTable: [
      { pokemonId: 129, chance: 35, money: 10 }, // Magicarpe
      { pokemonId: 118, chance: 25, money: 30 }, // Poissirène
      { pokemonId: 116, chance: 15, money: 50 }, // hypotempe
    ],
  },
};

let currentLevel = LEVELS["hautes-herbes"];

document.addEventListener("DOMContentLoaded", async () => {
  allPokemonData = await fetchPoke();
  console.log("Données Pokémon chargées :", allPokemonData);

  const gameContainer = document.getElementById("game-container");
  const gridElement = document.getElementById("grid");
  const titre = document.getElementById("titre");
  const replayButton = document.getElementById("replay");
  pokeballNumberElement = document.getElementById("pokeballNumber");
  playerMoneyElement = document.getElementById("playerMoney"); // NOUVEAU
  let completeNbr = 0;
  const complete = document.getElementById("complete");

  const gameContentArticle = document.querySelector(
    "#game-container > article"
  );

  const levelSelectionDiv = document.createElement("div");
  pokeList = document.getElementById("pokeList");
  levelSelectionDiv.id = "level-selection";
  levelSelectionDiv.className = "flex justify-center space-x-4 mb-4";

  for (const levelId in LEVELS) {
    const level = LEVELS[levelId];
    const button = document.createElement("button");
    button.textContent = level.title;
    button.dataset.levelId = level.id;
    button.className =
      "px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    button.addEventListener("click", () => {
      if (gameStarted) {
        showMessage(
          "Veuillez terminer la partie ou rejouer avant de changer de niveau !"
        );
        return;
      }
      if (playerMoney >= level.cost) {
        showConfirmationModal(level.title, level.cost, () => {
          playerMoney -= level.cost; // Déduit l'argent
          playerMoneyElement.textContent = playerMoney; // Met à jour l'affichage global
          currentLevel = level;
          startGame();
        });
      } else {
        showAccessDeniedModal(level.cost);
      }
    });
    levelSelectionDiv.appendChild(button);
  }
  gameContainer.insertBefore(levelSelectionDiv, gameContentArticle);

  replayButton.addEventListener("click", () => {
    startGame();
  });

  allPokemonData.forEach((pokemon) => {
    const pokeInPokedex = document.createElement("div");
    pokeInPokedex.classList.add(
      "flex",
      "flex-row",
      "items-center",
      "w-20",
      "h-20",
      "transition-all",
      "duration-200",
      "ease-in-out",
      "gap-2",
      "pokedex-entry"
    );
    pokeInPokedex.dataset.pokemonId = pokemon.id;

    const pokeImg = document.createElement("img");
    pokeImg.src = pokemon.sprite;
    pokeImg.alt = pokemon.name;
    pokeImg.classList.add(
      "w-20",
      "h-20",
      "object-contain",
      "mb-1",
      "grayscale"
    ); // Image grisée
    pokeImg.id = `pokedex-sprite-${pokemon.id}`; // ID unique pour cibler l'image

    const pokeName = document.createElement("p");
    pokeName.textContent = "???";
    pokeName.classList.add(
      "text-xs",
      "font-semibold",
      "capitalize",
      "text-gray-700"
    );
    // NOUVEAU : Ajoutez un ID unique pour le nom aussi
    pokeName.id = `pokedex-name-${pokemon.id}`;

    const pokeId = document.createElement("p");
    pokeId.textContent = `#${pokemon.id}`;
    pokeId.classList.add("text-xs", "text-gray-500");

    const pokeCount = document.createElement("p");
    pokeCount.textContent = 0; // Initialise à 0
    pokeCount.classList.add("text-sm", "font-bold", "text-blue-700");
    pokeCount.id = `pokedex-count-${pokemon.id}`; // ID unique pour cibler le compteur

    pokeInPokedex.appendChild(pokeImg);
    pokeInPokedex.appendChild(pokeName);
    pokeInPokedex.appendChild(pokeId);
    pokeInPokedex.appendChild(pokeCount);

    pokeList.appendChild(pokeInPokedex);

    capturedPokemonCounts[pokemon.id] = 0;
  });
  console.log(
    "Pokédex initialisé avec tous les Pokémon grisés et noms cachés."
  );

  startGame();

  function toggleLevelSelectionButtons(enable) {
    const levelButtons = document.querySelectorAll("#level-selection button");
    levelButtons.forEach((button) => {
      button.disabled = !enable;
      if (enable) {
        button.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        button.classList.add("opacity-50", "cursor-not-allowed");
      }
    });
  }

  function updateBallNumber() {
    pokeballNbr++;
    pokeballNumberElement.innerHTML = pokeballNbr;
  }

  function startGame() {
    gameOver = false;
    gameStarted = false; // Important : gameStarted doit être false au début de chaque partie
    revealedSafeCellsCount = 0;
    pokeballNbr = 0; // Réinitialise le nombre de Pokéballs
    pokeballNumberElement.innerHTML = pokeballNbr;
    titre.innerText = "Trouvez tous les Pokémon !";

    replayButton.classList.add("opacity-0", "pointer-events-none");
    replayButton.classList.remove("opacity-100", "pointer-events-auto");

    toggleLevelSelectionButtons(true);

    createGrid(currentLevel.rows, currentLevel.cols); // Crée la grille DOM sans mines initiales
    allCells = document.querySelectorAll(".cell"); // Récupère toutes les cellules DOM

    gridElement.style.backgroundImage = `url('${currentLevel.backgroundImage}')`;
    gridElement.style.backgroundSize = "cover";
    gridElement.style.backgroundRepeat = "no-repeat";
    gridElement.style.backgroundPosition = "center";

    allCells.forEach((cell) => {
      cell.style.pointerEvents = "auto";
      cell.classList.remove("revealed");
      const existingContent = cell.querySelector("img, span.mine-count");
      if (existingContent) {
        existingContent.remove();
      }
      cell.removeAttribute("status");
    });

    console.log(
      "Nouveau jeu démarré. Niveau :",
      currentLevel.title,
      "Attente du premier clic pour placer les Voltorbes."
    );
  }

  gridElement.addEventListener("click", (event) => {
    const element = event.target.closest(".cell");
    if (!element || gameOver || element.classList.contains("revealed")) {
      return;
    }

    if (!gameStarted) {
      gameStarted = true;
      toggleLevelSelectionButtons(false);
      // Place les mines après le premier clic, en s'assurant que 'element' est sûr
      placeMines(currentLevel.rows, currentLevel.cols, Number(element.id));

      allCells = document.querySelectorAll(".cell");

      safeCellsToReveal = 0;
      allCells.forEach((cell) => {
        if (cell.getAttribute("status") === "safe") {
          safeCellsToReveal++;
        }
      });
      console.log("Jeu démarré. Cellules sûres à révéler :", safeCellsToReveal);
    }

    console.log("Cliqué sur la cellule avec l'ID : " + element.id);

    // Le reste de la logique du clic reste inchangé
    if (element.getAttribute("status") === "boom") {
      element.classList.add("revealed");

      const existingContent = element.querySelector("img, span.mine-count");
      if (existingContent) {
        existingContent.remove();
      }

      const cellImg = document.createElement("img");
      cellImg.src = allPokemonData[99].sprite; // Assurez-vous que l'ID 100 de Voltorbe est bien l'index 99 si allPokemonData est un tableau par index
      cellImg.classList.add("w-28", "h-28");
      element.appendChild(cellImg);

      const audio = new Audio(allPokemonData[99].cry);
      audio.play();

      showMessage("BADABOOM ! C'était un Voltorbe !");
      game_over();
    } else {
      // ... (le reste de votre logique pour une cellule sûre) ...
      element.classList.add("revealed");
      revealedSafeCellsCount++;

      const neighborsForClickedCellCount = checkNearCells(
        element,
        currentLevel.cols
      );
      let clickedCellBoomCount = 0;
      neighborsForClickedCellCount.forEach((neighbor) => {
        if (neighbor.getAttribute("status") === "boom") {
          clickedCellBoomCount++;
        }
      });

      updateCellContent(element);

      if (clickedCellBoomCount === 0) {
        updateBallNumber();
      }

      const clickedCellNeighbors = checkNearCells(element, currentLevel.cols);

      clickedCellNeighbors.forEach((neighbor) => {
        if (!neighbor.classList.contains("revealed")) {
          updateCellContent(neighbor);
        }
      });

      checkWinCondition();
    }
  });

  function createGrid(rows, cols) {
    gridElement.innerHTML = "";
    gridElement.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, 60px)`;

    grid = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols).fill({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          minesAround: 0,
        })
      );
    renderGrid(rows, cols);
  }

  function game_over() {
    gameOver = true;
    titre.innerText = "Oh non! C'était un Voltorbe!";
    pokeballNbr = 0;

    const voltorbPokemon = allPokemonData.find((p) => p.id === 100);

    allCells.forEach((cell) => {
      if (cell.getAttribute("status") === "boom") {
        if (!cell.classList.contains("revealed")) {
          cell.classList.add("revealed");
          const existingContent = cell.querySelector("img, span.mine-count");
          if (existingContent) {
            existingContent.remove();
          }
          const cellImg = document.createElement("img");
          cellImg.src = voltorbPokemon
            ? voltorbPokemon.sprite
            : "./img/voltorb_fallback.png"; // Fallback si non trouvé
          cellImg.classList.add("w-28", "h-28");
          cell.appendChild(cellImg);
        }
      } else {
        if (!cell.classList.contains("revealed")) {
          cell.classList.add("revealed");
          updateCellContent(cell);
        }
      }
      cell.style.pointerEvents = "none";
    });
    replayButton.classList.remove("opacity-0", "pointer-events-none");
    replayButton.classList.add("opacity-100", "pointer-events-auto");

    toggleLevelSelectionButtons(true);
    showDefeatModal();
  }

  function game_won() {
    gameOver = true;
    titre.innerText = "Félicitations ! Vous avez trouvé tous les Pokémon !";
    allCells.forEach((cell) => {
      cell.style.pointerEvents = "none";
    });
    replayButton.classList.remove("opacity-0", "pointer-events-none");
    replayButton.classList.add("opacity-100", "pointer-events-auto");

    toggleLevelSelectionButtons(true);
    openBalls(pokeballNbr);
  }

  /**
   * Rend les éléments HTML des cellules de la grille et place les Voltorbes.
   * Le nombre de Voltorbes est déterminé par minMines et maxMines du niveau actuel.
   * @param {number} rows Le nombre de lignes.
   * @param {number} cols Le nombre de colonnes.
   */
  function renderGrid(rows, cols) {
    gridElement.innerHTML = "";
    gridElement.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, 60px)`;

    grid = Array(rows) // Initialisez la grille logique
      .fill(null)
      .map(() =>
        Array(cols).fill({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          isFlagged: false,
          minesAround: 0,
        })
      );

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = i;
        // Ne pas définir le statut ici
        gridElement.appendChild(cell);
        cell.addEventListener("contextmenu", (event) =>
          handleRightClick(event, r, c)
        );
        i++;
      }
    }
  }

  function placeMines(rows, cols, clickedCellId) {
    const totalCells = rows * cols;
    const minesToPlace =
      Math.floor(
        Math.random() * (currentLevel.maxMines - currentLevel.minMines + 1)
      ) + currentLevel.minMines;
    const minePositions = new Set();

    const forbiddenPositions = new Set();
    if (clickedCellId !== undefined && clickedCellId !== null) {
      forbiddenPositions.add(clickedCellId);
    }
    while (minePositions.size < minesToPlace) {
      let randomPos = Math.floor(Math.random() * totalCells);
      if (!forbiddenPositions.has(randomPos)) {
        minePositions.add(randomPos);
      }
    }

    for (let i = 0; i < totalCells; i++) {
      const cell = document.getElementById(i); // Récupère la cellule par son ID
      if (minePositions.has(i)) {
        cell.setAttribute("status", "boom");
      } else {
        cell.setAttribute("status", "safe");
      }
    }
    console.log(`Nombre de Voltorbes placés pour ce niveau: ${minesToPlace}`);
  }

  function checkNearCells(cell, gridWidth) {
    const surroundingCells = [];
    const clickedCellId = Number(cell.id);

    if (isNaN(clickedCellId)) {
      console.error(
        "Erreur: l'ID de la cellule cliquée n'est pas un nombre valide.",
        cell.id
      );
      return [];
    }

    const clickedRow = Math.floor(clickedCellId / gridWidth);
    const clickedCol = clickedCellId % gridWidth;

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        if (rowOffset === 0 && colOffset === 0) {
          continue;
        }

        const neighborRow = clickedRow + rowOffset;
        const neighborCol = clickedCol + colOffset;

        if (
          neighborRow >= 0 &&
          neighborRow < currentLevel.rows &&
          neighborCol >= 0 &&
          neighborCol < gridWidth
        ) {
          const neighborId = neighborRow * gridWidth + neighborCol;
          const foundNeighbor = Array.from(allCells).find(
            (element) => Number(element.id) === neighborId
          );

          if (foundNeighbor) {
            surroundingCells.push(foundNeighbor);
          }
        }
      }
    }
    return surroundingCells;
  }

  function updateCellContent(cellToUpdate) {
    const existingContent = cellToUpdate.querySelector("img, span.mine-count");
    if (existingContent) {
      existingContent.remove();
    }

    const neighborsOfTargetCell = checkNearCells(
      cellToUpdate,
      currentLevel.cols
    );
    let boomCount = 0;

    neighborsOfTargetCell.forEach((neighbor) => {
      if (neighbor.getAttribute("status") === "boom") {
        boomCount++;
      }
    });

    if (boomCount > 0) {
      const numberSpan = document.createElement("span");
      numberSpan.classList.add("mine-count");
      numberSpan.textContent = boomCount;
      cellToUpdate.appendChild(numberSpan);
    } else {
      const cellImg = document.createElement("img");
      cellImg.src = "./img/ball.png";
      cellImg.classList.add("w-12", "h-8");
      cellToUpdate.appendChild(cellImg);
    }
  }

  function checkWinCondition() {
    if (revealedSafeCellsCount === safeCellsToReveal) {
      game_won();
    }
  }

  function showMessage(message) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message-box");
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
      messageBox.remove();
    }, 3000);
  }

  /**
   * Ouvre une modal, affiche le nombre de Pokéballs, puis révèle les Pokémon attrapés.
   * @param {number} pokeballsToOpen Le nombre de Pokéballs à ouvrir (correspond à pokeballNbr).
   */

  function openBalls(pokeballsToOpen) {
    console.log(`openBalls() appelée. Pokéballs à ouvrir : ${pokeballsToOpen}`);

    const modal = document.createElement("div");
    modal.classList.add("pokeball-modal");
    modal.innerHTML = `
        <div class="pokeball-modal-content">
            <h2>Vous avez attrapé <span id="pokeball-count-display">${pokeballsToOpen}</span> Pokémons) !</h2>
            <div id="pokemon-reveal-area" class="flex flex-wrap justify-center gap-4 mt-4"></div>
            <div class="mt-4 text-xl font-bold">Total gagné : <span id="current-reveal-money">0</span> PokéDollars</div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
      modal.style.display = "flex";
      console.log("Modal affichée.");
    }, 100);

    const pokemonRevealArea = document.getElementById("pokemon-reveal-area");
    const currentRevealMoneyElement = document.getElementById(
      "current-reveal-money"
    );
    let currentRevealTotalMoney = 0;

    let openedCount = 0;

    const revealNextPokemon = () => {
      if (openedCount < pokeballsToOpen) {
        console.log(
          `Révélation du Pokémon ${openedCount + 1} sur ${pokeballsToOpen}...`
        );

        const encounteredPokemon = choosePokemon(currentLevel.encounterTable);

        if (encounteredPokemon) {
          capturedPokemonCounts[encounteredPokemon.id]++;
          const pokedexCount = document.getElementById(
            `pokedex-count-${encounteredPokemon.id}`
          );
          if (pokedexCount) {
            pokedexCount.textContent = `${
              capturedPokemonCounts[encounteredPokemon.id]
            }`;
            pokedexCount.classList.add("animate-pulse", "text-green-600");
            setTimeout(() => {
              pokedexCount.classList.remove("animate-pulse", "text-green-600");
            }, 500);
          }

          const pokemonMoney = encounteredPokemon.money || 0; // Utilise 0 si 'money' n'est pas défini
          console.log(
            `Pokémon trouvé : ${encounteredPokemon.name} (ID: ${encounteredPokemon.id}, Argent: ${pokemonMoney})`
          );

          const pokemonDiv = document.createElement("div");
          pokemonDiv.classList.add(
            "revealed-pokemon-item",
            "flex",
            "flex-col",
            "items-center"
          );
          pokemonDiv.innerHTML = `
                    <img src="${encounteredPokemon.sprite}" alt="${encounteredPokemon.name}" class="w-24 h-24">
                    <p class="capitalize">${encounteredPokemon.name}</p>
                    <p class="text-sm text-yellow-600">+ ${pokemonMoney} ₽</p> `;
          pokemonRevealArea.appendChild(pokemonDiv);

          const audio = new Audio(encounteredPokemon.cry);
          audio.play();

          currentRevealTotalMoney += pokemonMoney;
          currentRevealMoneyElement.textContent = currentRevealTotalMoney;

          playerMoney += pokemonMoney;
          playerMoneyElement.textContent = playerMoney; // Met à jour l'affichage global de l'argent

          if (!capturedPokemonIds.has(encounteredPokemon.id)) {
            capturedPokemonIds.add(encounteredPokemon.id);

            const pokedexImg = document.getElementById(
              `pokedex-sprite-${encounteredPokemon.id}`
            );
            const pokedexName = document.getElementById(
              `pokedex-name-${encounteredPokemon.id}`
            );

            if (pokedexImg) {
              pokedexImg.classList.remove("grayscale");
              pokedexImg.parentElement.classList.add(
                "scale-110",
                "border-blue-400"
              );
              setTimeout(() => {
                pokedexImg.parentElement.classList.remove(
                  "scale-110",
                  "border-blue-400"
                );
              }, 500);
            }
            if (pokedexName) {
              pokedexName.textContent = encounteredPokemon.name;
            }
            console.log(
              `Nouveau Pokémon capturé et mis à jour dans le Pokédex : ${encounteredPokemon.name}`
            );
          } else {
            console.log(`${encounteredPokemon.name} déjà capturé.`);
          }
          const evolutionRule = EVOLUTIONS[encounteredPokemon.id];
          if (evolutionRule) {
            const currentCaptures =
              capturedPokemonCounts[encounteredPokemon.id];
            // Vérifie si le nombre de captures est un multiple du seuil
            if (
              currentCaptures > 0 &&
              currentCaptures % evolutionRule.threshold === 0
            ) {
              console.log(
                `${encounteredPokemon.name} a atteint le seuil d'évolution !`
              );
              const evolvedPokemon = allPokemonData.find(
                (p) => p.id === evolutionRule.evolvesTo
              );
              if (evolvedPokemon) {
                console.log("Found evolvedPokemon:", evolvedPokemon);
                // On retarde l'évolution un peu pour que la modal de capture ait le temps de se fermer
                setTimeout(() => {
                  showEvolutionModal(
                    encounteredPokemon,
                    evolvedPokemon,
                    evolutionRule
                  );
                }, 2500); // Délai après la fin de la révélation des captures
              } else {
                console.warn(
                  `Pokémon évolué avec ID ${evolutionRule.evolvesTo} non trouvé.`
                );
              }
            }
          }
        } else {
          console.warn(
            "Aucun Pokémon trouvé pour la révélation (choosePokemon a retourné null)."
          );
        }

        openedCount++;
        setTimeout(revealNextPokemon, 800);
      } else {
        console.log(
          "Toutes les Pokéballs ont été ouvertes. Fermeture de la modal dans 2 secondes."
        );
        setTimeout(() => {
          modal.remove();
          pokeballNbr = 0;
          pokeballNumberElement.innerHTML = pokeballNbr;
          console.log("Modal fermée. Compteur de Pokéballs réinitialisé.");
        }, 2000);
      }
    };

    if (pokeballsToOpen > 0) {
      setTimeout(() => {
        console.log("Démarrage de la séquence de révélation des Pokémon...");
        revealNextPokemon();
      }, 3000);
    } else {
      console.log(
        "Pas de Pokéballs à ouvrir. Fermeture de la modal après 3 secondes."
      );
      setTimeout(() => {
        modal.remove();
        pokeballNbr = 0;
        pokeballNumberElement.innerHTML = pokeballNbr;
        console.log(
          "Modal fermée. Compteur de Pokéballs réinitialisé (pas de Pokéballs à ouvrir)."
        );
      }, 3000);
    }
  }

  /**
   * Choisit un Pokémon aléatoirement basé sur les pourcentages de chance du tableau de rencontre.
   * @param {Array<Object>} encounterTable La table de rencontre du niveau actuel.
   * @returns {Object|null} Les données du Pokémon choisi, ou null si rien n'est choisi (devrait pas arriver si total = 100).
   */
  function choosePokemon(encounterTable) {
    const totalChance = encounterTable.reduce(
      (sum, entry) => sum + entry.chance,
      0
    );
    let randomPoint = Math.random() * totalChance;

    for (const entry of encounterTable) {
      if (randomPoint < entry.chance) {
        const foundPokemon = allPokemonData.find(
          (p) => p.id === entry.pokemonId
        );
        if (!foundPokemon) {
          console.error(
            `Erreur: Pokémon avec ID ${entry.pokemonId} non trouvé dans allPokemonData. Vérifiez fetch.js et LEVELS.`
          );
          return null;
        }
        // NOUVEAU : Ajoutez la propriété 'money' à l'objet Pokémon trouvé
        return { ...foundPokemon, money: entry.money || 0 }; // Crée une copie et ajoute 'money'
      }
      randomPoint -= entry.chance;
    }
    console.warn(
      "choosePokemon a terminé sans trouver de Pokémon (randomPoint a dépassé toutes les chances)."
    );
    return null;
  }

  function showConfirmationModal(levelName, cost, onConfirm) {
    const modal = document.createElement("div");
    modal.classList.add("confirmation-modal"); // Classe CSS pour la modal de confirmation
    modal.innerHTML = `
        <div class="confirmation-modal-content">
            <h3>Voulez-vous jouer au niveau "${levelName}" ?</h3>
            <p>Cela vous coûtera <span class="text-yellow-600 font-bold">${cost} ₽</span>.</p>
            <div class="flex justify-center gap-4 mt-4">
                <button id="confirm-buy" class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600">Oui</button>
                <button id="cancel-buy" class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">Non</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.style.display = "flex"; // Rendre la modal visible

    document.getElementById("confirm-buy").addEventListener("click", () => {
      modal.remove(); // Ferme la modal
      onConfirm(); // Exécute la fonction de rappel pour démarrer le jeu
    });

    document.getElementById("cancel-buy").addEventListener("click", () => {
      modal.remove(); // Ferme la modal sans rien faire
    });
  }

  function showDefeatModal() {
    const modal = document.createElement("div");
    modal.classList.add("defeat-modal"); // Classe CSS pour la modale de défaite
    modal.innerHTML = `
        <div class="defeat-modal-content">
            <h3>Oh non... C'était un Voltorbe !</h3>
            <p>Vous vous empressez de retourner en lieu sûr.</p>
        </div>
    `;
    document.body.appendChild(modal);

    modal.style.display = "flex"; // Rendre la modale visible

    // Ferme la modale et relance le jeu après un court délai
    setTimeout(() => {
      modal.remove(); // Supprime la modale du DOM
      currentLevel = LEVELS["hautes-herbes"]; // Définit le niveau par défaut
      startGame(); // Redémarre une nouvelle partie avec le niveau Hautes-herbes
    }, 2500); // La modale reste visible pendant 2.5 secondes
  }

  function showAccessDeniedModal(requiredMoney) {
    const modal = document.createElement("div");
    modal.classList.add("access-denied-modal"); // Classe CSS pour la modale de refus
    modal.innerHTML = `
        <div class="access-denied-modal-content">
            <h3>Accès Refusé !</h3>
            <p>Vous n'avez pas assez de PokéDollars pour accéder à cette zone.</p>
            <p>Il vous faut au moins <span class="text-red-600 font-bold">${requiredMoney} ₽</span> pour y entrer.</p>
            <button id="close-access-denied-modal" class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 mt-4">Compris</button>
        </div>
    `;
    document.body.appendChild(modal);

    modal.style.display = "flex"; // Rendre la modale visible

    document
      .getElementById("close-access-denied-modal")
      .addEventListener("click", () => {
        modal.remove(); // Supprime la modale du DOM
      });
  }

  function showEvolutionModal(basePokemon, evolvedPokemon, evolutionRule) {
    console.log(
      "showEvolutionModal called. basePokemon:",
      basePokemon,
      "evolvedPokemon:",
      evolvedPokemon
    );
    const modal = document.createElement("div");
    modal.classList.add("evolution-modal");

    const moneyBonus = evolutionRule.moneyBonus || 0;

    modal.innerHTML = `
        <div class="evolution-modal-content">
            <h3>Félicitations !</h3>
            <p>${basePokemon.name} a évolué en...</p>
            <div class="evolution-display flex flex-col items-center justify-center">
                <img src="${basePokemon.sprite}" alt="${
      basePokemon.name
    }" class="w-24 h-24 mb-4" id="base-pokemon-sprite">
                <p class="text-xl font-bold capitalize mb-4" id="base-pokemon-name">${
                  basePokemon.name
                }</p>
                <img src="${evolvedPokemon.sprite}" alt="${
      evolvedPokemon.name
    }" class="w-24 h-24 mt-4 opacity-0" id="evolved-pokemon-sprite">
                <p class="text-2xl font-bold capitalize mt-2 opacity-0 text-purple-700" id="evolved-pokemon-name">${
                  evolvedPokemon.name
                } !</p>
                ${
                  moneyBonus > 0
                    ? `<p class="text-lg font-bold text-green-500 mt-4">Vous gagnez +${moneyBonus} ₽ !</p>`
                    : ""
                }
            </div>
            <button id="close-evolution-modal" class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 mt-6">Impressionnant !</button>
        </div>
    `;
    document.body.appendChild(modal);

    modal.style.display = "flex"; // Rendre la modal visible

    const evolvedSpriteElement = document.getElementById(
      "evolved-pokemon-sprite"
    );
    const evolvedNameElement = document.getElementById("evolved-pokemon-name");


    setTimeout(() => {
      evolvedSpriteElement.classList.remove("opacity-0");
      evolvedSpriteElement.classList.add("animate-fade-in"); // Assurez-vous d'avoir animate-fade-in dans votre CSS/Tailwind
      evolvedNameElement.classList.remove("opacity-0");
      evolvedNameElement.classList.add("animate-fade-in");
      const evolutionAudio = new Audio(evolvedPokemon.cry); // NOUVEAU : Son d'évolution (assurez-vous d'avoir ce fichier)
      evolutionAudio.play();

      // NOUVEAU : Révèle l'évolution dans le Pokédex
      updatePokedexAfterEvolution(basePokemon, evolvedPokemon);
    }, 1500); // Délai après l'affichage initial de la modal

    document
      .getElementById("close-evolution-modal")
      .addEventListener("click", () => {
        modal.remove(); // Ferme la modal
      });
  }

  function updatePokedexAfterEvolution(basePokemon, evolvedPokemon) {
    console.log("updatePokedexAfterEvolution called for:", evolvedPokemon.name);

    // Incrémente le compteur de captures pour le Pokémon évolué.
    // Si c'est la première fois qu'il est obtenu (par évolution), il sera initialisé à 1.
    // Sinon, il sera incrémenté comme une capture normale.
    capturedPokemonCounts[evolvedPokemon.id] = (capturedPokemonCounts[evolvedPokemon.id] || 0) + 1;

    const evolutionRule = EVOLUTIONS[basePokemon.id]; // On cherche la règle d'évolution du Pokémon de base
    if (evolutionRule && evolutionRule.moneyBonus) {
      playerMoney += evolutionRule.moneyBonus; // Ajoute l'argent au joueur
      playerMoneyElement.textContent = playerMoney; // Met à jour l'affichage de l'argent global
      console.log(
        `Bonus d'évolution ! Vous avez gagné ${evolutionRule.moneyBonus} PokéDollars pour l'évolution de ${basePokemon.name} en ${evolvedPokemon.name}. Total: ${playerMoney}`
      );
      showMessage(
        `+${evolutionRule.moneyBonus} ₽ (Évolution de ${basePokemon.name})`
      );
    }

    // Récupère les éléments du Pokédex pour le Pokémon évolué
    const pokedexImg = document.getElementById(
      `pokedex-sprite-${evolvedPokemon.id}`
    );
    const pokedexName = document.getElementById(
      `pokedex-name-${evolvedPokemon.id}`
    );
    const pokedexCount = document.getElementById(
      `pokedex-count-${evolvedPokemon.id}`
    );

    if (pokedexImg && pokedexName) {
      // Supprime le filtre de gris et affiche le nom si c'est la première fois qu'on voit cette évolution
      if (!capturedPokemonIds.has(evolvedPokemon.id)) {
        pokedexImg.classList.remove("grayscale");
        pokedexName.textContent = evolvedPokemon.name;
        capturedPokemonIds.add(evolvedPokemon.id); // Marque comme "révélé"
        console.log(
          `Nouvelle évolution révélée dans le Pokédex : ${evolvedPokemon.name}`
        );
      } else {
        console.log(`${evolvedPokemon.name} (évolution) déjà révélé.`);
      }

      pokedexImg.parentElement.classList.add("scale-110", "border-purple-400");
      setTimeout(() => {
        pokedexImg.parentElement.classList.remove(
          "scale-110",
          "border-purple-400"
        );
      }, 500);
    }

    if (pokedexCount) {
      pokedexCount.textContent = `${capturedPokemonCounts[evolvedPokemon.id]}`;
      pokedexCount.classList.add("animate-pulse", "text-purple-600");
      setTimeout(() => {
        pokedexCount.classList.remove("animate-pulse", "text-purple-600");
      }, 500);
    }

      // NOUVEAU : Vérifier si le Pokémon évolué peut lui-même évoluer
    const nextEvolutionRule = EVOLUTIONS[evolvedPokemon.id];
    if (nextEvolutionRule) {
        const currentCaptures = capturedPokemonCounts[evolvedPokemon.id];
        if (currentCaptures > 0 && currentCaptures % nextEvolutionRule.threshold === 0) {
            console.log(`${evolvedPokemon.name} a atteint le seuil d'évolution suivant !`);
            const nextEvolvedPokemon = allPokemonData.find(
                (p) => p.id === nextEvolutionRule.evolvesTo
            );
            if (nextEvolvedPokemon) {
                // Déclencher la prochaine évolution après un court délai pour ne pas superposer les modales
                setTimeout(() => {
                    showEvolutionModal(evolvedPokemon, nextEvolvedPokemon, nextEvolutionRule);
                }, 2500); // Même délai que pour la première évolution
            } else {
                console.warn(
                    `Pokémon de la prochaine évolution avec ID ${nextEvolutionRule.evolvesTo} non trouvé.`
                );
            }
        }
    }
  }

  function handleRightClick(event, row, col) {
    event.preventDefault(); // <-- TRÈS IMPORTANT : Empêche le menu contextuel du navigateur
    const cellElement = event.currentTarget; // L'élément div de la case
    const cellData = grid[row][col]; // Si 'grid' est ton tableau 2D de données pour le démineur

    if (cellData.isRevealed) {
      return;
    }

    if (cellData.isFlagged) {
      // Si la case a déjà un drapeau, on le retire
      cellData.isFlagged = false;
      cellElement.style.backgroundImage = ""; // Retire l'image de fond
      cellElement.classList.remove("flagged"); // Retire la classe CSS si tu en utilises une
    } else {
      cellData.isFlagged = true;
      cellElement.style.backgroundImage = 'url("./img/flag.png")'; // Chemin vers ton image de drapeau
      cellElement.style.backgroundSize = "contain"; // Pour s'assurer que l'image s'adapte
      cellElement.style.backgroundRepeat = "no-repeat";
      cellElement.style.backgroundPosition = "center";
      cellElement.classList.add("flagged"); // Ajoute une classe CSS si tu veux styliser les drapeaux
    }
  }
});
