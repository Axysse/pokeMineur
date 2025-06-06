import { fetchPoke } from "./fetch.js";
import { EVOLUTIONS, LEVELS } from "./config.js";
import { openShopModal, SHOP_ITEMS } from './shop.js';

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
let playerMoney = 0;
let playerMoneyElement;
let evolutionQueue = [];
let titre;
let replayButton;
let gridElement;
let loadGameBtn;
let shopBtn;
let playerInventory = {};

let currentLevel = LEVELS["hautes-herbes"];

export function showMessage(message) {
  const messageBox = document.createElement("div");
  messageBox.classList.add("message-box");
  messageBox.textContent = message;
  document.body.appendChild(messageBox);

  setTimeout(() => {
    messageBox.remove();
  }, 3000);
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
      const foundPokemon = allPokemonData.find((p) => p.id === entry.pokemonId);
      if (!foundPokemon) {
        console.error(
          `Erreur: Pokémon avec ID ${entry.pokemonId} non trouvé dans allPokemonData. Vérifiez fetch.js et LEVELS.`
        );
        return null;
      }
      return { ...foundPokemon, money: entry.money || 0 }; // Crée une copie et ajoute 'money'
    }
    randomPoint -= entry.chance;
  }
  console.warn(
    "choosePokemon a terminé sans trouver de Pokémon (randomPoint a dépassé toutes les chances)."
  );
  return null;
}

// Cette nouvelle fonction est purement pour la mise à jour visuelle du Pokédex
function updatePokedexVisuals(pokemon) {
  const pokedexImg = document.getElementById(`pokedex-sprite-${pokemon.id}`);
  const pokedexName = document.getElementById(`pokedex-name-${pokemon.id}`);
  const pokedexCount = document.getElementById(`pokedex-count-${pokemon.id}`);

  if (pokedexImg && pokedexName) {
    if (!capturedPokemonIds.has(pokemon.id)) {
      pokedexImg.classList.remove("grayscale");
      pokedexName.textContent = pokemon.name;
      capturedPokemonIds.add(pokemon.id);
      console.log(`Nouveau Pokémon révélé dans le Pokédex : ${pokemon.name}`);
    } else {
      console.log(`${pokemon.name} déjà révélé.`);
    }

    pokedexImg.parentElement.classList.add("scale-110", "border-blue-400"); // Ou une autre couleur si c'est une évolution
    setTimeout(() => {
      pokedexImg.parentElement.classList.remove("scale-110", "border-blue-400");
    }, 500);
  }

  if (pokedexCount) {
    pokedexCount.textContent = `${capturedPokemonCounts[pokemon.id]}`;
    pokedexCount.classList.add("animate-pulse", "text-green-600"); // Ou une autre couleur pour les mises à jour de count
    setTimeout(() => {
      pokedexCount.classList.remove("animate-pulse", "text-green-600");
    }, 500);
  }
}

// Cette fonction est appelée lorsqu'une capture ou une évolution a lieu,
// pour mettre à jour les compteurs et éventuellement ajouter une évolution à la queue.
function handlePokemonCaptureOrEvolution(
  pokemonData,
  isEvolution = false,
  basePokemon = null,
  evolutionRule = null
) {
  // Incrémente le compteur du Pokémon
  capturedPokemonCounts[pokemonData.id] =
    (capturedPokemonCounts[pokemonData.id] || 0) + 1;

  // Met à jour l'argent si c'est une évolution ou une capture normale
  if (isEvolution && evolutionRule && evolutionRule.moneyBonus) {
    playerMoney += evolutionRule.moneyBonus;
    playerMoneyElement.textContent = playerMoney;
    showMessage(
      `+${evolutionRule.moneyBonus} ₽ (Évolution de ${basePokemon.name})`
    );
  } else if (!isEvolution && pokemonData.money) {
    playerMoney += pokemonData.money;
    playerMoneyElement.textContent = playerMoney;
  }

  // Met à jour les visuels du Pokédex
  updatePokedexVisuals(pokemonData);

  // Vérifie si ce Pokémon peut évoluer
  const nextEvolutionRule = EVOLUTIONS[pokemonData.id];
  if (nextEvolutionRule) {
    const currentCaptures = capturedPokemonCounts[pokemonData.id];
    // Vérifie si le seuil d'évolution est atteint
    if (
      currentCaptures > 0 &&
      currentCaptures % nextEvolutionRule.threshold === 0
    ) {
      // Tente de trouver le Pokémon évolué dans la liste complète des Pokémon
      const potentialEvolvedPokemon = allPokemonData.find(
        (p) => p.id === nextEvolutionRule.evolvesTo
      );
      if (potentialEvolvedPokemon) {
        console.log(
          `${pokemonData.name} a atteint le seuil d'évolution suivant ! Ajout à la file d'attente.`
        );
        evolutionQueue.push({
          basePokemon: pokemonData,
          evolvedPokemon: potentialEvolvedPokemon, // Ici, potentialEvolvedPokemon est garanti d'être un objet valide
          evolutionRule: nextEvolutionRule,
        });
      } else {
        // Si le Pokémon évolué n'est pas trouvé, affichez un avertissement.
        // Cela peut indiquer une erreur dans vos données EVOLUTIONS ou allPokemonData.
        console.warn(
          `Attention: Le Pokémon avec l'ID ${nextEvolutionRule.evolvesTo} (cible de l'évolution de ${pokemonData.name}) n'a pas été trouvé dans allPokemonData. L'évolution ne sera pas ajoutée à la file.`
        );
      }
    }
  }
}

// Changez la signature de la fonction pour accepter un callback
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
    // Gardez l'image du pokémon évolué ici, cachée au début
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

  modal.style.display = "flex";

  const evolvedSpriteElement = document.getElementById(
    "evolved-pokemon-sprite"
  );
  const evolvedNameElement = document.getElementById("evolved-pokemon-name");

  setTimeout(() => {
    evolvedSpriteElement.classList.remove("opacity-0");
    evolvedSpriteElement.classList.add("animate-fade-in");
    evolvedNameElement.classList.remove("opacity-0");
    evolvedNameElement.classList.add("animate-fade-in");
    const evolutionAudio = new Audio(evolvedPokemon.cry);
    evolutionAudio.play();

    // NOUVEAU : Traiter l'évolution comme une "capture" pour le Pokédex et les futures évolutions
    handlePokemonCaptureOrEvolution(
      evolvedPokemon,
      true,
      basePokemon,
      evolutionRule
    );
  }, 1500);

  // Lorsque le joueur clique sur le bouton de fermeture
  document
    .getElementById("close-evolution-modal")
    .addEventListener("click", () => {
      modal.remove(); // Ferme la modal
      // NOUVEAU : Une fois que cette modale est fermée, on traite la suivante dans la file
      processEvolutionQueue();
    });
}

function processEvolutionQueue() {
  if (evolutionQueue.length > 0) {
    const nextEvolution = evolutionQueue.shift(); // Prend la première évolution de la file
    console.log(
      "Traitement de la prochaine évolution dans la file :",
      nextEvolution.evolvedPokemon.name
    );

    showEvolutionModal(
      nextEvolution.basePokemon,
      nextEvolution.evolvedPokemon,
      nextEvolution.evolutionRule
    );
  } else {
    console.log("File d'attente d'évolutions vide.");
  }
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
        handlePokemonCaptureOrEvolution(encounteredPokemon, false); // C'est une capture, pas une évolution

        const pokemonMoney = encounteredPokemon.money || 0; // Utilise 0 si 'money' n'est pas défini
        currentRevealTotalMoney += pokemonMoney;
        currentRevealMoneyElement.textContent = currentRevealTotalMoney;

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
          const currentCaptures = capturedPokemonCounts[encounteredPokemon.id];
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
        processEvolutionQueue();
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
      processEvolutionQueue();
      saveGame();
    }, 3000);
  }
}

function saveGame() {
  const gameState = {
    playerMoney: playerMoney,
    capturedPokemonIds: Array.from(capturedPokemonIds), // Convertir le Set en tableau pour le stockage
    capturedPokemonCounts: capturedPokemonCounts,
    playerInventory: playerInventory,
  };

  try {
    localStorage.setItem("pokemonMinesweeperSave", JSON.stringify(gameState));
    showMessage("Partie sauvegardée avec succès !", "success");
    console.log("Game saved:", gameState);
  } catch (e) {
    console.error("Erreur lors de la sauvegarde de la partie:", e);
    showMessage(
      "Erreur lors de la sauvegarde. Espace de stockage insuffisant ou problème navigateur.",
      "error"
    );
  }
}

function loadGame() {
  try {
    const savedStateString = localStorage.getItem("pokemonMinesweeperSave");
    if (savedStateString) {
      const loadedState = JSON.parse(savedStateString);
      console.log("Game loaded:", loadedState);

      playerMoney = loadedState.playerMoney;
      capturedPokemonIds = new Set(loadedState.capturedPokemonIds);
      capturedPokemonCounts = loadedState.capturedPokemonCounts;
        playerInventory = loadedState.playerInventory || {};

      // NOUVEAU : Chargement des états de jeu et du niveau
      currentLevel = LEVELS[loadedState.currentLevelId || "hautes-herbes"]; // Fallback au cas où l'ancienne sauvegarde n'ait pas le niveau
      gameStarted = loadedState.gameStarted;
      gameOver = loadedState.gameOver;

      // Charger l'état de la grille si tu décides de le faire plus tard. Pour l'instant, on lance une nouvelle grille.
      // Si tu ne sauvegardes pas la grille, le jeu commencera avec une nouvelle grille visuellement.
      // Il faudrait appeler `startGame()` après le chargement pour avoir une grille prête.
      // Mais si gameStarted est true, ce n'est pas une nouvelle partie.

      // Il est important de créer une grille vide pour que les éléments existent si le jeu est chargé en cours.
      createGrid(currentLevel.rows, currentLevel.cols);
      allCells = document.querySelectorAll(".cell"); // Re-sélectionner toutes les cellules

      // Si la partie était en cours lors de la sauvegarde, il faut recréer l'état visuel de la grille.
      // Cependant, si tu ne sauvegardes pas `grid` elle-même, la grille sera vide.
      // Pour l'instant, si tu charges, ça ne restaurera que l'argent et le Pokédex.
      // Si `gameStarted` est `true` après le chargement, il faut empêcher de lancer `startGame()`
      // qui effacerait la partie.

      // Mise à jour de l'UI
      playerMoneyElement.textContent = playerMoney;
      pokeballNumberElement.innerHTML = pokeballNbr; // La pokeballNbr n'est pas sauvegardée ici, donc sera 0.
      // Si tu veux sauvegarder les pokeballs, ajoute-les à gameState.
      titre.innerText = "Reprise de la partie..."; // Ajuster le titre

      // Mettre à jour le Pokédex visuel
      allPokemonData.forEach((pokemon) => {
        const pokedexImg = document.getElementById(
          `pokedex-sprite-${pokemon.id}`
        );
        const pokedexName = document.getElementById(
          `pokedex-name-${pokemon.id}`
        );
        const pokedexCount = document.getElementById(
          `pokedex-count-${pokemon.id}`
        );

        if (capturedPokemonIds.has(pokemon.id)) {
          if (pokedexImg) pokedexImg.classList.remove("grayscale");
          if (pokedexName) pokedexName.textContent = pokemon.name;
        } else {
          if (pokedexImg) pokedexImg.classList.add("grayscale");
          if (pokedexName) pokedexName.textContent = "???";
        }
        if (pokedexCount)
          pokedexCount.textContent = capturedPokemonCounts[pokemon.id] || 0;
      });

      // Gérer l'état des boutons de niveau et replay
      if (gameOver) {
        replayButton.classList.remove("opacity-0", "pointer-events-none");
        replayButton.classList.add("opacity-100", "pointer-events-auto");
        toggleLevelSelectionButtons(true);
      } else if (gameStarted) {
        // Si la partie était en cours, désactiver les sélections de niveau
        replayButton.classList.add("opacity-0", "pointer-events-none");
        replayButton.classList.remove("opacity-100", "pointer-events-auto");
        toggleLevelSelectionButtons(false);
      } else {
        // Partie non commencée
        replayButton.classList.add("opacity-0", "pointer-events-none");
        replayButton.classList.remove("opacity-100", "pointer-events-auto");
        toggleLevelSelectionButtons(true);
      }

      showMessage("Partie chargée avec succès !", "success");

      // Si la partie était en cours, tu devras peut-être ré-initialiser certains aspects
      // qui ne sont pas sauvegardés (comme l'état visuel de la grille ou les événements de clic).
      // Si tu ne sauvegardes pas la grille, le chargement ne restaurera que l'argent et le Pokédex.
      // Dans ce cas, une nouvelle grille sera générée au premier clic si gameStarted est false.
      // Si gameStarted est true, tu devras décider quoi faire avec la grille.
      // Une solution simple est de forcer une nouvelle partie visuelle mais garder les stats.
      // Ou de sauvegarder l'état de la grille aussi, comme dans mon exemple précédent.
    } else {
      showMessage("Aucune partie sauvegardée trouvée.", "info");
    }
  } catch (e) {
    console.error("Erreur lors du chargement de la partie:", e);
    showMessage(
      "Erreur lors du chargement de la partie. Le fichier de sauvegarde est-il corrompu ?",
      "error"
    );
    // En cas d'erreur de chargement, réinitialiser le jeu à un état propre
    startGame();
  }
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
  saveGame();
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
  saveGame();
}

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

function checkWinCondition() {
  if (revealedSafeCellsCount === safeCellsToReveal) {
    game_won();
  }
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

  const neighborsOfTargetCell = checkNearCells(cellToUpdate, currentLevel.cols);
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

document.addEventListener("DOMContentLoaded", async () => {
  gridElement = document.getElementById("grid");
  allPokemonData = await fetchPoke();
  console.log("Données Pokémon chargées :", allPokemonData);
  const gameContainer = document.getElementById("game-container");
  titre = document.getElementById("titre");
  replayButton = document.getElementById("replay");
  pokeballNumberElement = document.getElementById("pokeballNumber");
  playerMoneyElement = document.getElementById("playerMoney"); // NOUVEAU
  let completeNbr = 0;
  const complete = document.getElementById("complete");

  loadGameBtn = document.getElementById("loadGameBtn");
  shopBtn = document.getElementById("shopBtn");

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

  loadGameBtn.addEventListener("click", loadGame);

      shopBtn.addEventListener("click", () => {
        // Passe playerMoney, la fonction de mise à jour, showMessage et l'inventaire
        openShopModal(playerMoney, showMessage, playerInventory);
    });

  gridElement.addEventListener("click", (event) => {
    const element = event.target.closest(".cell");
    if (!element || gameOver || element.classList.contains("revealed")) {
      return;
    }

    if (!gameStarted) {
      gameStarted = true;
      toggleLevelSelectionButtons(false);
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

  // pour clarifier qu'elle gère les aspects visuels et l'ajout à la file, mais pas l'ouverture de la modal elle-même
  function updatePokedexAfterEvolutionVisuals(
    basePokemon,
    evolvedPokemon,
    evolutionRule
  ) {
    // Assurez-vous que le compteur est mis à jour si ce n'est pas déjà fait avant d'appeler ici
    // (normalement, il l'est déjà dans la fonction updatePokedexAfterEvolution d'où celle-ci est appelée)
    // Il est crucial que capturedPokemonCounts[evolvedPokemon.id] soit à jour ici.

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
      if (!capturedPokemonIds.has(evolvedPokemon.id)) {
        pokedexImg.classList.remove("grayscale");
        pokedexName.textContent = evolvedPokemon.name;
        capturedPokemonIds.add(evolvedPokemon.id);
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
  }

  const nextEvolutionRule = EVOLUTIONS[evolvedPokemon.id];
  if (nextEvolutionRule) {
    const currentCaptures = capturedPokemonCounts[evolvedPokemon.id];
    if (
      currentCaptures > 0 &&
      currentCaptures % nextEvolutionRule.threshold === 0
    ) {
      console.log(
        `${evolvedPokemon.name} a atteint le seuil d'évolution suivant ! Ajout à la file d'attente.`
      );
      // Ajoutez l'information nécessaire à la file d'attente
      evolutionQueue.push({
        basePokemon: evolvedPokemon,
        evolvedPokemon: allPokemonData.find(
          (p) => p.id === nextEvolutionRule.evolvesTo
        ),
        evolutionRule: nextEvolutionRule,
      });
    }
  }
  startGame();
});

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
