import { fetchPoke } from "./fetch.js";
import { EVOLUTIONS, LEVELS } from "./config.js";
import { openShopModal, SHOP_ITEMS } from './shop.js';
import { openInventoryModal } from './inventory.js';


let allPokemonData = [];
let gameOver = false;
let gameStarted = false;
let safeCellsToReveal = 0;
let revealedSafeCellsCount = 0;
let grid = [];
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
let inventoryBtn;
export let playerInventory = {};
console.log("DEBUG_INIT: playerInventory au moment de la déclaration globale:", playerInventory);



let currentLevel = LEVELS["hautes-herbes"];

function getPlayerMoney() {
    return playerMoney;
}

function setPlayerMoney(amount) {
    playerMoney = amount;
    playerMoneyElement.textContent = playerMoney; // Met à jour l'affichage global de l'argent
}

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
  modal.classList.add("defeat-modal");
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
  }, 2500); 
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
    console.log("DEBUG_SAVE_START: playerInventory au début de saveGame():", playerInventory);
    const gameState = {
        playerMoney: playerMoney,
        capturedPokemonIds: Array.from(capturedPokemonIds),
        capturedPokemonCounts: capturedPokemonCounts,
        playerInventory: playerInventory,
        gameStarted: gameStarted,
        gameOver: gameOver,
        // *** AJOUT CRUCIAL : Sauvegarde l'état de la grille ***
        gridState: grid.map(row => row.map(cell => ({
            row: cell.row,
            col: cell.col,
            isRevealed: cell.isRevealed,
            isFlagged: cell.isFlagged,
            status: cell.status, // "boom" ou "safe"
            revealedByItem: cell.revealedByItem,
            minesAround: cell.minesAround // Utile pour les cellules "safe"
        }))),
        currentLevelId: currentLevel ? currentLevel.id : "hautes-herbes", // Sauvegarde l'ID du niveau
    };
    console.log("DEBUG_SAVE_GAMETATE: gameState avant stringify:", gameState);
    try {
        localStorage.setItem("pokemonMinesweeperSave", JSON.stringify(gameState));
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

            playerMoney = loadedState.playerMoney || 0;
            capturedPokemonIds = new Set(loadedState.capturedPokemonIds || []);
            capturedPokemonCounts = loadedState.capturedPokemonCounts || {};
            playerInventory = loadedState.playerInventory || {};
            // pokeballNbr = loadedState.pokeballNbr || 0; // Si tu ne sauvegardes pas pokeballNbr dans gameState, c'est normal qu'il ne soit pas là.
                                                          // Tu devras recalculer le pokeballNbr en fonction des capturedPokemonCounts

            currentLevel = LEVELS[loadedState.currentLevelId || "hautes-herbes"];
            gameStarted = loadedState.gameStarted;
            gameOver = loadedState.gameOver;

            playerMoneyElement.textContent = playerMoney;
            // pokeballNumberElement.innerHTML = pokeballNbr; // Commenté car pokeballNbr n'est pas dans gameState. Tu le gères peut-être différemment.
            updatePokedexUI(capturedPokemonIds, capturedPokemonCounts);

            // Mettre à jour l'état visuel du jeu (boutons, titre)
            if (gameOver) {
                replayButton.classList.remove("opacity-0", "pointer-events-none");
                replayButton.classList.add("opacity-100", "pointer-events-auto");
                toggleLevelSelectionButtons(true);
            } else if (gameStarted) {
                replayButton.classList.add("opacity-0", "pointer-events-none");
                replayButton.classList.remove("opacity-100", "pointer-events-auto");
                toggleLevelSelectionButtons(false);
            } else {
                replayButton.classList.add("opacity-0", "pointer-events-none");
                replayButton.classList.remove("opacity-100", "pointer-events-auto");
                toggleLevelSelectionButtons(true);
            }
            titre.innerText = gameStarted ? "Reprise de la partie..." : "Pokémon Démineur";

            // *** AJOUT CRUCIAL : Restaurer la grille depuis la sauvegarde ***
            if (loadedState.gridState) {
                // Créer la grille DOM d'abord
                createGrid(currentLevel.rows, currentLevel.cols); // Cela crée la structure HTML et un tableau JS 'grid' vide

                // Remplir le tableau 'grid' avec les données sauvegardées
                grid = loadedState.gridState.map(row => row.map(cellData => {
                    const cell = {
                        row: cellData.row,
                        col: cellData.col,
                        isRevealed: cellData.isRevealed,
                        isFlagged: cellData.isFlagged,
                        status: cellData.status,
                        revealedByItem: cellData.revealedByItem,
                        minesAround: cellData.minesAround
                    };
                    // Si la cellule est révélée ou flaggée, mettre à jour le DOM
                    const cellElement = document.getElementById(`${cell.row * currentLevel.cols + cell.col}`);
                    if (cellElement) {
                        if (cell.isRevealed) {
                            cellElement.classList.add("revealed");
                            // Afficher le contenu (Voltorbe ou nombre)
                            if (cell.status === "boom") {
                                const voltorb = allPokemonData.find(p => p.id === 100);
                                const img = document.createElement("img");
                                img.src = voltorb ? voltorb.sprite : "./img/ball_voltorbe.png";
                                img.classList.add("w-full", "h-full", "object-contain");
                                cellElement.appendChild(img);
                            } else if (cell.minesAround > 0) {
                                const span = document.createElement("span");
                                span.classList.add("mine-count");
                                span.textContent = cell.minesAround;
                                cellElement.appendChild(span);
                            }
                        }
                        if (cell.isFlagged) {
                            cellElement.classList.add("flagged");
                            const img = document.createElement("img");
                            img.src = "./img/red_flag.png"; // L'image du drapeau
                            img.classList.add("w-full", "h-full", "object-contain");
                            cellElement.appendChild(img);
                        }
                        if (cell.revealedByItem) {
                             cellElement.classList.add("revealed-by-item");
                             // Si c'est un Voltorbe révélé par l'item, assure-toi qu'il affiche le Voltorbe
                             if (cell.status === "boom" && !cell.isRevealed) { // Si c'est pas déjà révélé par clic
                                const voltorb = allPokemonData.find(p => p.id === 100);
                                const img = document.createElement("img");
                                img.src = voltorb ? voltorb.sprite : "./img/ball_voltorbe.png";
                                img.classList.add("w-full", "h-full", "object-contain");
                                cellElement.appendChild(img);
                             }
                        }
                    }
                    return cell;
                }));
                 // Après avoir restauré la grille, tu dois aussi potentiellement mettre à jour `isFirstClick`
                isFirstClick = false; // Si une partie est chargée, ce n'est plus le premier clic
            }
            // Si la partie est chargée et en cours, tu n'as PAS besoin de `startGame()`
            // `startGame()` est pour initialiser une NOUVELLE partie propre.
            // Si tu as chargé l'état d'une partie existante, tu continues cette partie.
            showMessage("Partie chargée avec succès !", "success");
            return true; // Chargement réussi
        } else {
            // --- CAS 2 : Aucune sauvegarde trouvée ---
            console.log("DEBUG_NO_SAVE: Aucune sauvegarde trouvée, appel de initializeGameStateForNewOrFailedLoad()");
            initializeGameStateForNewOrFailedLoad(); // Initialise un état de jeu par défaut
            console.log("DEBUG_AFTER_INIT_NO_SAVE: playerInventory après initializeGameStateForNewOrFailedLoad():", playerInventory);
            showMessage("Aucune partie sauvegardée trouvée. Nouvelle partie commencée.", "info");
            return false; // Pas de sauvegarde à charger
        }
    } catch (e) {
        console.error("DEBUG_LOAD_ERROR: Erreur lors du chargement de la partie:", e);
        initializeGameStateForNewOrFailedLoad(); // Initialise un état de jeu par défaut en cas d'erreur
        console.log("DEBUG_AFTER_INIT_ERROR: playerInventory après initializeGameStateForNewOrFailedLoad() (erreur):", playerInventory);
        showMessage("Erreur de chargement. Une nouvelle partie a été commencée.", "error");
        return false; // Échec du chargement
    }
}

// --- NOUVELLE FONCTION POUR INITIALISER L'ÉTAT DU JEU LORS D'UNE NOUVELLE PARTIE OU D'UN ÉCHEC DE CHARGEMENT ---
// Cela évite la duplication de code et assure la cohérence.
function initializeGameStateForNewOrFailedLoad() {
    console.log("DEBUG_INIT_STATE_START: playerInventory au début de initializeGameStateForNewOrFailedLoad():", playerInventory); // Log 11
    playerMoney = 0;
    capturedPokemonIds = new Set();
    capturedPokemonCounts = {};
    pokeballNbr = 5; // Pokéballs de départ pour une nouvelle partie
    playerInventory = {
        "pokeball_pack_5": 1, // Exemple: un pack de 5 Pokéballs de départ
        "reveal_safe_cell": 0 // 0 au départ, si tu veux le gérer via l'inventaire
    };
      console.log("DEBUG_INIT_STATE_ASSIGN: playerInventory après initialisation dans initializeGameStateForNewOrFailedLoad():", playerInventory); // Log 12
    currentLevel = LEVELS["hautes-herbes"];
    gameStarted = false;
    gameOver = false;
    safeCellsToReveal = 0;
    revealedSafeCellsCount = 0;

    // Mise à jour de l'UI pour cet état de départ
    playerMoneyElement.textContent = playerMoney;
    pokeballNumberElement.innerHTML = pokeballNbr;
    updatePokedexUI(); // Met à jour l'affichage du Pokédex (tout grisé)
    titre.innerText = "Pokémon Démineur";
    replayButton.classList.add("opacity-0", "pointer-events-none");
    replayButton.classList.remove("opacity-100", "pointer-events-auto"); // Assure-toi qu'il est bien caché
    toggleLevelSelectionButtons(true);

    createGrid(currentLevel.rows, currentLevel.cols); // Crée une grille vide pour le départ
    // Pas besoin d'appeler startGame() ici, car DOMContentLoaded s'en occupe si loadGame() retourne false.
    // startGame() sera appelée au premier clic sur la grille ou si un niveau est choisi.
}

// Assure-toi que cette fonction existe et est correctement définie dans main.js
function updatePokedexUI(ids = capturedPokemonIds, counts = capturedPokemonCounts) {
    allPokemonData.forEach((pokemon) => {
        const pokedexImg = document.getElementById(`pokedex-sprite-${pokemon.id}`);
        const pokedexName = document.getElementById(`pokedex-name-${pokemon.id}`);
        const pokedexCount = document.getElementById(`pokedex-count-${pokemon.id}`);

        if (ids.has(pokemon.id)) {
            if (pokedexImg) pokedexImg.classList.remove("grayscale");
            if (pokedexName) pokedexName.textContent = pokemon.name;
        } else {
            if (pokedexImg) pokedexImg.classList.add("grayscale");
            if (pokedexName) pokedexName.textContent = "???";
        }
        if (pokedexCount) {
            pokedexCount.textContent = counts[pokemon.id] || 0;
        }
    });
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

  // FIX: Create a new, unique object for each cell
  grid = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null) // Fill with null first
        .map(() => ({
          // Then map to create a new object for each
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          minesAround: 0,
          status: "hidden", // Initialisation, sera 'boom' ou 'safe' par placeMines
          revealedByItem: false,
        }))
    );

  // You are creating the DOM elements here within createGrid, which is good.
  // The 'renderGrid' function seems to duplicate this and should probably be merged or removed.
  // Let's refine the loop from your renderGrid and put it here:

  let cellIdCounter = 0; // Use a counter for cell IDs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      cellElement.dataset.row = r;
      cellElement.dataset.col = c;
      cellElement.id = cellIdCounter; // Assign unique ID
      gridElement.appendChild(cellElement);

      // Add event listeners directly here
      cellElement.addEventListener("contextmenu", (event) =>
        handleRightClick(event, r, c)
      );

      // Store a reference to the DOM element in your JS grid object if needed
      // (This can be useful, but make sure not to create circular references if saving/loading)
      // For now, let's just make sure your grid[r][c] is the plain JS object.
      // The `document.getElementById(cellId)` in other functions will get the DOM element.

      cellIdCounter++;
    }
  }

  // After creating grid and DOM, ensure allCells is populated:
  allCells = document.querySelectorAll(".cell");
}

function checkWinCondition() {
  if (revealedSafeCellsCount === safeCellsToReveal) {
    game_won();
  }
}

function startGame() {
    console.log("DEBUG: startGame() est appelée.");

    // 1. Réinitialiser les variables d'état du jeu
    gameOver = false;
    gameStarted = false; // Important : gameStarted doit être false au début de chaque partie
    revealedSafeCellsCount = 0;
    pokeballNbr = 0; // Réinitialise le nombre de Pokéballs
    pokeballNumberElement.innerHTML = pokeballNbr;
    titre.innerText = "Trouvez tous les Pokémon !";

    // 2. Réinitialiser l'interface utilisateur des boutons
    replayButton.classList.add("opacity-0", "pointer-events-none");
    replayButton.classList.remove("opacity-100", "pointer-events-auto");

    toggleLevelSelectionButtons(true); // Permet de sélectionner les niveaux

    // --- MODIFICATIONS CLÉS POUR RÉINITIALISER LA GRILLE ---

    // 3. Vider l'élément HTML de la grille pour supprimer toutes les anciennes cellules
    // Assurez-vous que gridElement est bien défini (ce que tes logs précédents indiquent)
    if (gridElement) {
        gridElement.innerHTML = "";
    }
    
    // 4. Réinitialiser complètement le tableau JavaScript 'grid'
    // C'est CRUCIAL pour éviter l'accumulation de Voltorbes et s'assurer d'une grille vierge.
    // Cette ligne rend 'grid' vide avant que createGrid ne la peuple avec de NOUVEAUX objets.
    grid = []; 

    // 5. Créer une NOUVELLE grille vierge JavaScript et DOM
    // `createGrid` va maintenant remplir un tableau 'grid' vide avec de nouvelles cellules uniques.
    createGrid(currentLevel.rows, currentLevel.cols); 

    // 6. Récupérer les nouvelles cellules DOM après la recréation par createGrid
    allCells = document.querySelectorAll(".cell"); 

    // 7. Appliquer les styles de fond et réinitialiser l'état visuel des cellules
    gridElement.style.backgroundImage = `url('${currentLevel.backgroundImage}')`;
    gridElement.style.backgroundSize = "cover";
    gridElement.style.backgroundRepeat = "no-repeat";
    gridElement.style.backgroundPosition = "center";

    // Pour chaque nouvelle cellule, s'assurer qu'elle est prête pour un nouveau jeu
    allCells.forEach((cell) => {
        cell.style.pointerEvents = "auto";
        cell.classList.remove("revealed", "revealed-by-item", "flagged"); // Nettoyage complet des classes
        const existingContent = cell.querySelector("img, span.mine-count"); // Enlève le contenu (Voltorbe, Pokémon, compteur)
        if (existingContent) {
            existingContent.remove();
        }
        cell.removeAttribute("status"); // Supprime l'attribut 'status' du DOM
    });

    // 8. Réinitialiser le flag du premier clic pour la logique de placement des Voltorbes
    

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
    console.log("DEBUG: Nombre de Voltorbes calculés pour ce niveau:", minesToPlace); // <-- NOUVEAU LOG ICI
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

for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellId = r * cols + c; // Calcule l'ID unique de la cellule
            const cellElement = document.getElementById(cellId); // Récupère l'élément DOM

            // Récupère l'objet cellule JavaScript correspondant dans ta grille
            const jsCellObject = grid[r][c]; // <--- Assure-toi que 'grid' est accessible ici

            if (minePositions.has(cellId)) {
                // Si cette position contient une mine, marque l'élément DOM ET l'objet JS
                cellElement.setAttribute("status", "boom");
                jsCellObject.status = "boom"; // <--- AJOUT CRUCIAL : Met à jour l'objet JS !
            } else {
                // Si c'est une cellule sûre
                cellElement.setAttribute("status", "safe");
                jsCellObject.status = "safe"; // <--- AJOUT CRUCIAL : Met à jour l'objet JS !
            }
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

function updateGameVariablesAndSave(newMoney, newInventory) {
  console.log("DEBUG_UPDATE_STATE_START: playerInventory au début de updatePlayerState():", playerInventory); // Log 13
    console.log("DEBUG_UPDATE_STATE_NEW_INV: newInventory reçu par updatePlayerState():", newInventory); // Log 14
    playerMoney = newMoney; // Met à jour la variable globale playerMoney
    playerInventory = newInventory; // Si l'inventaire est passé par valeur, sinon il est déjà mis à jour.
                                   // Dans ton cas, playerInventory est déjà mis à jour par référence.

    console.log("DEBUG_UPDATE_STATE_ASSIGN: playerInventory après affectation dans updatePlayerState():", playerInventory); // Log 15

    playerMoneyElement.textContent = playerMoney; // Met à jour l'affichage de l'argent
    pokeballNumberElement.innerHTML = pokeballNbr;
    saveGame(); // Sauvegarde tout l'état du jeu
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
  inventoryBtn = document.getElementById("inventoryBtn");

  const gameContentArticle = document.querySelector(
    "#game-container > article"
  );
   console.log("DEBUG_BEFORE_LOAD: playerInventory avant loadGame():", playerInventory);
   
  const gameLoadedSuccessfully = loadGame(); // Appelle loadGame()

  if (!gameLoadedSuccessfully) {
        currentLevel = LEVELS["hautes-herbes"]; // Définit le niveau par défaut
        startGame(); // Démarrer une nouvelle partie seulement s'il n'y avait pas de sauvegarde à charger.
    }

   console.log("DEBUG_AFTER_LOAD: playerInventory après loadGame():", playerInventory);

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
              openShopModal(
            getPlayerMoney,           // Fonction qui renvoie la valeur actuelle de playerMoney
            setPlayerMoney,           // Fonction qui met à jour playerMoney et son affichage global
            showMessage,              // Votre fonction pour les messages
            playerInventory,          // Votre variable globale playerInventory (l'objet)
            updateGameVariablesAndSave// Votre callback pour sauvegarder l'état complet
        );
    });

        inventoryBtn.addEventListener("click", () => {
        console.log("main.js - inventoryBtn click - playerInventory avant openInventoryModal:", playerInventory);
        openInventoryModal(playerInventory, showMessage, useItem, updateInventoryUI);
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

function useItem(itemId) {
    if (!playerInventory[itemId] || playerInventory[itemId] <= 0) {
        showMessage("Vous n'avez plus de cet objet !", "error");
        return false;
    }

    let itemEffectResult = false; // Use a more descriptive name
    switch (itemId) {
        case "reveal_safe_cell":
            itemEffectResult = useRevealRiskyCellItem(); // Capture the boolean result
            break;
        // ... other cases
        default:
            console.warn(`Effet pour l'objet ${itemId} non implémenté.`);
            showMessage("Cet objet n'a pas encore d'effet implémenté.", "warning");
            return false; // Item not used successfully
    }

    if (itemEffectResult) {
        playerInventory[itemId]--; // Decrement only if the effect was successful
        updateGameVariablesAndSave(playerMoney, playerInventory); // This will also save
        return true;
    }
    return false;
}

export function updateInventoryUI() {
    // Supprime l'ancienne modale d'inventaire si elle existe pour la recréer
    // (C'est souvent le plus simple si l'inventaire est recréé dynamiquement)
    const existingModal = document.querySelector(".inventory-modal");
    if (existingModal) {
        existingModal.remove();
    }
    // Recrée la modale avec les données à jour
    // Tu devras peut-être passer playerInventory et showMessage ici aussi
    openInventoryModal(playerInventory, showMessage, useItem, updateInventoryUI); // Assure-toi que c'est bien la fonction pour ouvrir/mettre à jour l'inventaire
    // Si openInventoryModal ne rafraîchit pas tout, tu as peut-être un conteneur spécifique
    // où tu listes les items. Mets à jour ce conteneur ici.
    // Exemple (si tu as un élément spécifique pour l'inventaire) :
    // const inventoryDisplayElement = document.getElementById("inventory-display");
    // if (inventoryDisplayElement) {
    //     inventoryDisplayElement.innerHTML = ''; // Vide l'ancien contenu
    //     for (const itemId in playerInventory) {
    //         if (playerInventory[itemId] > 0) {
    //             // Crée un élément pour chaque item et l'ajoute
    //             const itemElement = document.createElement('div');
    //             itemElement.textContent = `${itemId}: ${playerInventory[itemId]}`;
    //             inventoryDisplayElement.appendChild(itemElement);
    //         }
    //     }
    // }
}

function useRevealRiskyCellItem() {
    // Vérifier si le jeu est en cours
    if (!gameStarted || gameOver) {
        showMessage("Vous ne pouvez utiliser cet objet qu'en pleine partie.", "warning");
        return false;
    }

    // Vérifier si le joueur possède l'objet
    // Cette vérification est déjà faite dans useItem(), mais la garder ici peut être une bonne pratique défensive
    if (!playerInventory["reveal_safe_cell"] || playerInventory["reveal_safe_cell"] <= 0) {
        showMessage("Vous n'avez pas de Détekt Volt. !", "error");
        return false;
    }

    // Trouver toutes les cellules non-révélées qui contiennent un Voltorbe
    const unrevealedVoltorbeCells = [];
    for (let r = 0; r < currentLevel.rows; r++) {
        for (let c = 0; c < currentLevel.cols; c++) {
            const cell = grid[r][c];
            if (cell.status === "boom" && !cell.revealedByItem) {
                unrevealedVoltorbeCells.push({ row: r, col: c });
            }
        }
    }
    console.log("DEBUG: Voltorbes non-révélés trouvés pour l'objet :", unrevealedVoltorbeCells);

    if (unrevealedVoltorbeCells.length === 0) {
        showMessage("Aucun Voltorbe non-révélé à détecter !", "info");
        return false;
    }

    // Choisir un Voltorbe aléatoire parmi ceux non-révélés
    const randomIndex = Math.floor(Math.random() * unrevealedVoltorbeCells.length);
    const chosenVoltorbe = unrevealedVoltorbeCells[randomIndex];
    const cellId = chosenVoltorbe.row * currentLevel.cols + chosenVoltorbe.col;
    const cellElement = document.getElementById(`${cellId}`);

    if (cellElement) {
        grid[chosenVoltorbe.row][chosenVoltorbe.col].isRevealed = true; // Mettre à jour l'état interne
        grid[chosenVoltorbe.row][chosenVoltorbe.col].revealedByItem = true; // Marquer comme révélé par l'objet

        cellElement.classList.add("revealed");
        cellElement.classList.add("revealed-by-item");

        const voltorb = allPokemonData.find(p => p.id === 100);
        const img = document.createElement("img");
        img.src = voltorb ? voltorb.sprite : "./img/ball_voltorbe.png";
        img.classList.add("w-full", "h-full", "object-contain");
        cellElement.appendChild(img);

        showMessage("Un Voltorbe a été détecté et révélé !", "success");

        return true; // Indique que l'objet a été utilisé avec succès
    } else {
        console.error("Élément de cellule Voltorbe non trouvé pour ID:", cellId);
        showMessage("Erreur lors de la révélation du Voltorbe.", "error");
        return false; // Indique que l'objet n'a pas pu être utilisé
    }
}