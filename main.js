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
let saveGameBtn ;
let survive = false;
let lure = false;
let isFirstClick = true;


let currentLevel = LEVELS["hautes-herbes"];

function getPlayerMoney() {
    return playerMoney;
}

function setPlayerMoney(amount) {
    playerMoney = amount;
    playerMoneyElement.textContent = playerMoney; 
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
    modal.id = "defeat-or-survive-modal"; 
    if (survive === true) {
        modal.innerHTML = `
            <div class="defeat-modal-content">
                <img src="./img/potion.png" alt="Potion" class="w-24 h-24 mx-auto mb-4 animate-bounce">
                <h3>Oh non... C'était un Voltorbe !</h3>
                <p>Mais comme vous êtes malin, votre potion vous a protégé(e) cette fois-ci !</p>
                <p class="text-sm mt-2">(La partie continue)</p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = "flex"; 
        survive = false; 
        setTimeout(() => {
            modal.remove(); 
        }, 2500);

    } else { 
        modal.innerHTML = `
            <div class="defeat-modal-content">
                <h3>Oh non... C'était un Voltorbe !</h3>
                <p>Vous vous empressez de retourner en lieu sûr.</p>
                <p class="text-sm mt-2">(Une nouvelle partie va commencer)</p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = "flex"; 
        setTimeout(() => {
            modal.remove(); 
            currentLevel = LEVELS["hautes-herbes"]; 
            startGame(); 
        }, 2500);
    }
}

function showAccessDeniedModal(requiredMoney) {
  const modal = document.createElement("div");
  modal.classList.add("access-denied-modal"); 
  modal.innerHTML = `
        <div class="access-denied-modal-content">
            <h3>Accès Refusé !</h3>
            <p>Vous n'avez pas assez de PokéDollars pour accéder à cette zone.</p>
            <p>Il vous faut au moins <span class="text-red-600 font-bold">${requiredMoney} ₽</span> pour y entrer.</p>
            <button id="close-access-denied-modal" class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 mt-4">Compris</button>
        </div>
    `;
  document.body.appendChild(modal);

  modal.style.display = "flex"; 

  document
    .getElementById("close-access-denied-modal")
    .addEventListener("click", () => {
      modal.remove(); 
    });
}

function showConfirmationModal(levelName, cost, onConfirm) {
  const modal = document.createElement("div");
  modal.classList.add("confirmation-modal"); 
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

  modal.style.display = "flex"; 

  document.getElementById("confirm-buy").addEventListener("click", () => {
    modal.remove(); 
    onConfirm(); 
  });

  document.getElementById("cancel-buy").addEventListener("click", () => {
    modal.remove(); 
  });
}

/**
 * Choisit un Pokémon aléatoirement basé sur les pourcentages de chance du tableau de rencontre.
 * @param {Array<Object>} encounterTable La table de rencontre du niveau actuel.
 * @param {boolean} isLureActive Indique si le leurre est actif ou non.
 * @returns {Object|null} Les données du Pokémon choisi, ou null si rien n'est choisi (devrait pas arriver si total = 100).
 */
function choosePokemon(encounterTable) {
  const adjustedEncounterTable = encounterTable.map(entry => {
    let currentChance = entry.chance;


    if (entry.pokemonId === 145 || entry.pokemonId === 144 || entry.pokemonId === 146 ) { 
      if (lure === true) {
        currentChance = 0.5; 
        console.log(`Leurre actif : Électhor (ID 145) sa chance est ajustée à ${currentChance}.`);
      } else {
        currentChance = 0.1; 
        console.log(`Leurre inactif : Électhor (ID 145) sa chance est de ${currentChance}.`);
      }
    }
  

    return { ...entry, chance: currentChance }; // Retourne une nouvelle entrée avec la chance potentiellement ajustée
  });

  // Calcule la somme totale des chances (maintenant ajustées)
  const totalAdjustedChance = adjustedEncounterTable.reduce(
    (sum, entry) => sum + entry.chance,
    0
  );

  let randomPoint = Math.random() * totalAdjustedChance;

  for (const entry of adjustedEncounterTable) { // Utilise la table avec les chances ajustées
    if (randomPoint < entry.chance) {
      const foundPokemon = allPokemonData.find((p) => p.id === entry.pokemonId);
      if (!foundPokemon) {
        console.error(
          `Erreur: Pokémon avec ID ${entry.pokemonId} non trouvé dans allPokemonData. Vérifiez vos données.`
        );
        return null;
      }
      return { ...foundPokemon, money: entry.money || 0 };
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
            <h2>Vous avez attrapé <span id="pokeball-count-display">${pokeballsToOpen}</span> Pokémons !</h2>
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

        const pokemonMoney = encounteredPokemon.money || 0; 
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
        lure: lure,
        
        
        gridState: grid.map(row => row.map(cell => ({
            row: cell.row,
            col: cell.col,
            isRevealed: cell.isRevealed,
            isFlagged: cell.isFlagged,
            status: cell.status,
            revealedByItem: cell.revealedByItem,
            minesAround: cell.minesAround 
        }))),
        currentLevelId: currentLevel ? currentLevel.id : "hautes-herbes", 
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

            // --- 1. Restaurer l'état du joueur ---
            playerMoney = loadedState.playerMoney || 0;
            capturedPokemonIds = new Set(loadedState.capturedPokemonIds || []);
            capturedPokemonCounts = loadedState.capturedPokemonCounts || {};
            playerInventory = loadedState.playerInventory || {};
            lure = lure
            pokeballNbr = 0; 
            gameStarted = false;
            gameOver = false;
           

            
            playerMoneyElement.textContent = playerMoney;
            pokeballNumberElement.innerHTML = pokeballNbr; 
            updatePokedexUI(capturedPokemonIds, capturedPokemonCounts);
            
            currentLevel = LEVELS["hautes-herbes"]; 
            revealedSafeCellsCount = 0;
            safeCellsToReveal = 0;
            startGame(); 

            titre.innerText = "Partie chargée ! Commencez une nouvelle partie."; 
            replayButton.classList.add("opacity-0", "pointer-events-none"); 
            toggleLevelSelectionButtons(true); 

            showMessage("Partie chargée avec succès ! Nouvelle partie commencée au niveau Hautes Herbes.", "success");
             console.log(lure)
            return true; 
        } else {
            console.log("DEBUG_NO_SAVE: Aucune sauvegarde trouvée, appel de initializeGameStateForNewOrFailedLoad()");
            initializeGameStateForNewOrFailedLoad(); 
            currentLevel = LEVELS["hautes-herbes"]; 
            startGame(); 
            showMessage("Aucune partie sauvegardée trouvée. Nouvelle partie commencée.", "info");
            return false; 
        }
    } catch (e) {
        console.error("DEBUG_LOAD_ERROR: Erreur lors du chargement de la partie:", e);
        
        initializeGameStateForNewOrFailedLoad();
        currentLevel = LEVELS["hautes-herbes"]; 
        startGame(); 
        showMessage("Erreur de chargement. Une nouvelle partie a été commencée.", "error");
        return false; 
    }
}

function resetGame() {
    if (!confirm("Êtes-vous sûr de vouloir commencer une NOUVELLE PARTIE ? Toutes vos données sauvegardées (argent, inventaire, Pokédex) seront EFFACÉES DÉFINITIVEMENT !")) {
        return; 
    }

    console.log("Début de la réinitialisation complète du jeu.");

    localStorage.removeItem("playerMoney");
    localStorage.removeItem("playerInventory");
    localStorage.removeItem("capturedPokemonCounts");
    localStorage.removeItem("capturedPokemonIds");
    localStorage.removeItem("gameSaveState"); 

    playerMoney = 0; 
    playerInventory = {}; 
    capturedPokemonCounts = {}; 
    capturedPokemonIds = new Set(); 

    currentLevel = LEVELS["hautes-herbes"];

   
    playerMoneyElement.textContent = playerMoney;
    pokeballNumberElement.innerHTML = 0;
    titre.innerText = "Trouvez tous les Pokémon !"; 

    allPokemonData.forEach(pokemon => {
        const pokeImg = document.getElementById(`pokedex-sprite-${pokemon.id}`);
        const pokeName = document.getElementById(`pokedex-name-${pokemon.id}`);
        const pokeCount = document.getElementById(`pokedex-count-${pokemon.id}`);

        if (pokeImg) pokeImg.classList.add("grayscale");
        if (pokeName) pokeName.textContent = "???";
        if (pokeCount) pokeCount.textContent = 0;
    });
    console.log("Pokédex visuellement réinitialisé.");
    startGame();

    showMessage("Une nouvelle partie a commencé ! Vos anciennes données ont été effacées.", "success");
    console.log("Jeu complètement réinitialisé. Nouvelle partie lancée.");
}


function initializeGameStateForNewOrFailedLoad() {
    console.log("DEBUG_INIT_STATE_START: playerInventory au début de initializeGameStateForNewOrFailedLoad():", playerInventory); 
    playerMoney = 0;
    capturedPokemonIds = new Set();
    capturedPokemonCounts = {};
    pokeballNbr = 5; 
    playerInventory = {
        "pokeball_pack_5": 1,
        "reveal_safe_cell": 0 
    };
      console.log("DEBUG_INIT_STATE_ASSIGN: playerInventory après initialisation dans initializeGameStateForNewOrFailedLoad():", playerInventory); 
    currentLevel = LEVELS["hautes-herbes"];
    gameStarted = false;
    gameOver = false;
    safeCellsToReveal = 0;
    revealedSafeCellsCount = 0;


    playerMoneyElement.textContent = playerMoney;
    pokeballNumberElement.innerHTML = pokeballNbr;
    updatePokedexUI(); 
    titre.innerText = "Pokémon Démineur";
    replayButton.classList.add("opacity-0", "pointer-events-none");
    replayButton.classList.remove("opacity-100", "pointer-events-auto"); 
    toggleLevelSelectionButtons(true);

    createGrid(currentLevel.rows, currentLevel.cols); 
    
}


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
  
}

function game_over() {
    if (survive === true) {
        console.log("Potion active : Le joueur a survécu à l'explosion !");
        showDefeatModal(); 
        return; 
    }
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

function createGrid(rows, cols) {
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
  gridElement.style.gridTemplateRows = `repeat(${rows}, 60px)`;

  grid = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null) 
        .map(() => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          minesAround: 0,
          status: "hidden", 
          revealedByItem: false,
        }))
    );
  let cellIdCounter = 0; 
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      cellElement.dataset.row = r;
      cellElement.dataset.col = c;
      cellElement.id = cellIdCounter; 
      gridElement.appendChild(cellElement);

      cellElement.addEventListener("contextmenu", (event) =>
        handleRightClick(event, r, c)
      );
      cellIdCounter++;
    }
  }
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
}

document.addEventListener("DOMContentLoaded", async () => {
  gridElement = document.getElementById("grid");
  allPokemonData = await fetchPoke();
  console.log("Données Pokémon chargées :", allPokemonData);
  const gameContainer = document.getElementById("game-container");
  titre = document.getElementById("titre");
  replayButton = document.getElementById("replay");
  pokeballNumberElement = document.getElementById("pokeballNumber");
  playerMoneyElement = document.getElementById("playerMoney"); 
   const newGameButton = document.getElementById("newGameButton");

  saveGameBtn = document.getElementById("saveGameBtn")
  loadGameBtn = document.getElementById("loadGameBtn");
  shopBtn = document.getElementById("shopBtn");
  inventoryBtn = document.getElementById("inventoryBtn");

  const gameContentArticle = document.querySelector(
    "#game-container > article"
  );
   console.log("DEBUG_BEFORE_LOAD: playerInventory avant loadGame():", playerInventory);
   
  const gameLoadedSuccessfully = loadGame(); 

      if (newGameButton) {
        newGameButton.addEventListener("click", resetGame);
    }
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
  saveGameBtn.addEventListener("click", saveGame);

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
 
  function updatePokedexAfterEvolutionVisuals(
    basePokemon,
    evolvedPokemon,
    evolutionRule
  ) {
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
        case "potion":
            itemEffectResult = potion(); // Capture the boolean result
            break;
        case "leurre":
            itemEffectResult = leurre(); // Capture the boolean result
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
    const existingModal = document.querySelector(".inventory-modal");
    if (existingModal) {
        existingModal.remove();
    }
    openInventoryModal(playerInventory, showMessage, useItem, updateInventoryUI); // Assure-toi que c'est bien la fonction pour ouvrir/mettre à jour l'inventaire
 
}

function useRevealRiskyCellItem() {
    if (!gameStarted || gameOver) {
        showMessage("Vous ne pouvez utiliser cet objet qu'en pleine partie.", "warning");
        return false;
    }
    if (!playerInventory["reveal_safe_cell"] || playerInventory["reveal_safe_cell"] <= 0) {
        showMessage("Vous n'avez pas de Détekt Volt. !", "error");
        return false;
    }


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

   
    const randomIndex = Math.floor(Math.random() * unrevealedVoltorbeCells.length);
    const chosenVoltorbe = unrevealedVoltorbeCells[randomIndex];
    const cellId = chosenVoltorbe.row * currentLevel.cols + chosenVoltorbe.col;
    const cellElement = document.getElementById(`${cellId}`);

    if (cellElement) {
        grid[chosenVoltorbe.row][chosenVoltorbe.col].isRevealed = true; 
        grid[chosenVoltorbe.row][chosenVoltorbe.col].revealedByItem = true; 

        cellElement.classList.add("revealed");
        cellElement.classList.add("revealed-by-item");

        const voltorb = allPokemonData.find(p => p.id === 100);
        const img = document.createElement("img");
        img.src = voltorb ? voltorb.sprite : "./img/ball_voltorbe.png";
        img.classList.add("w-full", "h-full", "object-contain");
        cellElement.appendChild(img);
        showMessage("Un Voltorbe a été détecté et révélé !", "success");
        return true; 
    } else {
        console.error("Élément de cellule Voltorbe non trouvé pour ID:", cellId);
        showMessage("Erreur lors de la révélation du Voltorbe.", "error");
        return false; 
    }
}

function potion(){
    survive = true
    return true;
}

function leurre(){
  if(lure != true){
    lure = true
    return true;
  }
}