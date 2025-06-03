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
let playerMoney = 0;
let playerMoneyElement;
let evolutionQueue = [];
let titre;         
let replayButton;  
let gridElement;
let loadGameBtn;

// Manque Rhinocrone, Evoli, Tauros, Amonita, kabuto, Ptera, Mewtwo, Mew

const EVOLUTIONS = {
  19: { evolvesTo: 20, threshold: 30, moneyBonus: 50 }, // Rattata (19) évolue en Rattatac (20) après 50 captures
  16: { evolvesTo: 17, threshold: 30, moneyBonus: 50 }, // Roucool (16) évolue en Roucoups (17) après 50 captures
  17: { evolvesTo: 18, threshold: 3, moneyBonus: 250 }, // Roucoups (17) évolue en Roucarnage (18) après 70 captures
  52: { evolvesTo: 53, threshold: 40, moneyBonus: 200 }, // Miaouss évolue en Persian après 50 captures
  129:{ evolvesTo: 130, threshold: 100, moneyBonus: 3000 }, // Magicarpe évolue en Léviathor après 50 captures
  56: { evolvesTo: 57, threshold: 40, moneyBonus: 400 }, // Férosinge évolue en Colossinge après 50 captures
  25: { evolvesTo: 26, threshold: 3, moneyBonus: 500 }, // Pikachu évolue en Raichu après 50 captures
  21: { evolvesTo: 22, threshold: 40, moneyBonus: 100 }, // Piafabec évolue en Rapasdepic après 50 captures
  10: { evolvesTo: 11, threshold: 30, moneyBonus: 50 }, // Chenipan évolue en Crysacier après 50 captures
  11: { evolvesTo: 12, threshold: 3, moneyBonus: 250 }, // Crysacier évolue en Papillusion après 50 captures
  13: { evolvesTo: 14, threshold: 30, moneyBonus: 50 }, // Aspicot évolue en Coconfort après 50 captures
  14: { evolvesTo: 15, threshold: 3, moneyBonus: 250 }, // Coconfort évolue en Dardagnan après 50 captures
  29: { evolvesTo: 30, threshold: 40, moneyBonus: 150 }, // nidoran femelle évolue en Nidorina après 50 captures
  30: { evolvesTo: 31, threshold: 3, moneyBonus: 500 }, // nidorana femelle évolue en Nidoqueen après 50 captures
  32: { evolvesTo: 33, threshold: 40, moneyBonus: 150}, // nidoran male évolue en Nidorino après 50 captures
  33: { evolvesTo: 34, threshold: 3, moneyBonus: 500 }, // nidorino évolue en Nidoking après 50 captures
  35: { evolvesTo: 36, threshold: 30, moneyBonus: 350 }, // melofée évolue en Melodelfe après 50 captures
  41: { evolvesTo: 42, threshold: 40, moneyBonus: 50 }, // nosferapti évolue en Nosferalto après 50 captures
  46: { evolvesTo: 47, threshold: 40, moneyBonus: 200 }, // Paras évolue en Parasecte après 50 captures
  27: { evolvesTo: 28, threshold: 40, moneyBonus: 150 }, // Sabelette évolue en Sablaireau après 50 captures
  60: { evolvesTo: 61, threshold: 30, moneyBonus: 300 }, // Ptitard évolue en Tetarte après 50 captures
  61: { evolvesTo: 62, threshold: 3, moneyBonus: 1500 }, // tetarte évolue en Tartard après 50 captures
  74: { evolvesTo: 75, threshold: 40, moneyBonus: 60 }, // racaillou évolue en Gravalanch après 50 captures
  75: { evolvesTo: 76, threshold: 4, moneyBonus: 400 }, // Gravalanch évolue en Grolem après 50 captures
  79: { evolvesTo: 80, threshold: 30, moneyBonus: 350 }, // Ramoloss évolue en Flagadoss après 50 captures
  118: { evolvesTo: 119, threshold: 40, moneyBonus: 230 }, // Poissireine évolue en Poissoroy après 50 captures
  116: { evolvesTo: 117, threshold: 30, moneyBonus: 500 }, // Hypotrempe évolue en Hyporoi après 50 captures
  63: { evolvesTo: 64, threshold: 30, moneyBonus: 1000 }, // Abra évolue en Kadabra après 50 captures
  64: { evolvesTo: 65, threshold: 3, moneyBonus: 5000 }, // Kadabra évolue en Alakazam après 50 captures
  43: { evolvesTo: 44, threshold: 40, moneyBonus: 150 }, // Mystherbe évolue en Ortide après 50 captures
  44: { evolvesTo: 45, threshold: 3, moneyBonus: 300 }, // Ortide évolue en Raflésia après 50 captures
  69: { evolvesTo: 70, threshold: 40, moneyBonus: 150 }, // Chétiflor évolue en Boustiflor après 50 captures
  70: { evolvesTo: 71, threshold: 3, moneyBonus: 300 }, // Boustiflor évolue en Empiflor après 50 captures
  23: { evolvesTo: 24, threshold: 30, moneyBonus: 180 }, // Abo évolue en Arbok après 50 captures
  90: { evolvesTo: 91, threshold: 40, moneyBonus: 150 }, // Kokiyas évolue en Crustabri après 50 captures
  98: { evolvesTo: 99, threshold: 40, moneyBonus: 150 }, // Krabby évolue en Krabboss après 50 captures
  72: { evolvesTo: 73, threshold: 40, moneyBonus: 175 }, // Tentacool évolue en Tentacruek après 50 captures
  48: { evolvesTo: 49, threshold: 40, moneyBonus: 200 }, // Mimitoss évolue en Aéromite après 50 captures
  37: { evolvesTo: 38, threshold: 40, moneyBonus: 400 }, // Goupix évolue en Feunard après 50 captures
  58: { evolvesTo: 59, threshold: 40, moneyBonus: 300 }, // Caninos évolue en Arcanin après 50 captures
  66: { evolvesTo: 67, threshold: 30, moneyBonus: 150 }, // Machoc évolue en Machopeur après 50 captures
  67: { evolvesTo: 68, threshold: 3, moneyBonus: 500 }, // Machoc évolue en Machopeur après 50 captures
  96: { evolvesTo: 97, threshold: 40, moneyBonus: 275 }, // Spoporifik évolue en Hypnomade après 50 captures
  100: { evolvesTo: 101, threshold: 40, moneyBonus: 450 }, // Voltorbe évolue en Electrode après 50 captures
  81: { evolvesTo: 82, threshold: 40, moneyBonus: 150 }, // Magnéti évolue en Magnéton après 50 captures
  92: { evolvesTo: 93, threshold: 30, moneyBonus: 200 }, // Fantominus évolue en Spectrum après 50 captures
  93: { evolvesTo: 94, threshold: 3, moneyBonus: 3000 }, // Spectrum évolue en Ectoplasma après 50 captures
  104: { evolvesTo: 105, threshold: 40, moneyBonus: 1500 }, // Osselait évolue en Ossatueur après 50 captures
  88: { evolvesTo: 89, threshold: 40, moneyBonus: 1350 }, // Tadmorv évolue en Grotadmorv après 50 captures
  86: { evolvesTo: 87, threshold: 40, moneyBonus: 1500 }, // Otaria évolue en Lamantine après 50 captures
  120: { evolvesTo: 121, threshold: 40, moneyBonus: 1750 }, // Otaria évolue en Lamantine après 50 captures
  147: { evolvesTo: 148, threshold: 40, moneyBonus: 4000 }, // Minidraco évolue en Draco après 50 captures
  148: { evolvesTo: 149, threshold: 3, moneyBonus: 8500 }, // Draco évolue en Dracolosse après 50 captures
  4: { evolvesTo: 5, threshold: 40, moneyBonus: 5000 }, // Salamèche évolue en Reptincel après 50 captures
  5: { evolvesTo: 6, threshold: 3, moneyBonus: 9000 }, // Reptincel évolue en Dracaufeu après 50 captures
  1: { evolvesTo: 2, threshold: 40, moneyBonus: 5000 }, // Bulbizarre évolue en Herbizarre après 50 captures
  2: { evolvesTo: 3, threshold: 3, moneyBonus: 9000 }, // Herbizarre évolue en Florizarre après 50 captures
  7: { evolvesTo: 8, threshold: 40, moneyBonus: 5000 }, // Carapuce évolue en Carabaffe après 50 captures
  8: { evolvesTo: 9, threshold: 40, moneyBonus: 9000 }, // Carabaffe évolue en Tortank après 50 captures
  50: { evolvesTo: 51, threshold: 40, moneyBonus: 150 }, // Taupikeur évolue en Triopikeur après 50 captures
  77: { evolvesTo: 78, threshold: 40, moneyBonus: 250 }, // Taupikeur évolue en Triopikeur après 50 captures
  84: { evolvesTo: 85, threshold: 40, moneyBonus: 350 }, // Doduo évolue en Dodrio après 50 captures
  109: { evolvesTo: 110, threshold: 40, moneyBonus: 1500 }, // Smogo évolue en Smogogo après 50 captures
  102: { evolvesTo: 103, threshold: 40, moneyBonus: 350 }, // Noeunoeuf évolue en Noadkoko après 50 captures
};

const LEVELS = {
  "hautes-herbes": {
    id: "hautes-herbes",
    title: "Hautes-herbes",
    rows: 5,
    cols: 5,
    minMines: 2, // Minimum de Voltorbes
    maxMines: 3, // Maximum de Voltorbes
    backgroundImage: "./img/grass.jpg",
    cost: 0,
    encounterTable: [
      { pokemonId: 16, chance: 30, money: 5 }, // Roucool
      { pokemonId: 19, chance: 30, money: 5 }, // Ratata
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
    cost: 125,
    encounterTable: [
      { pokemonId: 1, chance: 0.5, money: 2000 }, // Bulbizarre
      { pokemonId: 16, chance: 25, money: 10 }, // Roucool
      { pokemonId: 19, chance: 25, money: 10 }, // Ratata
      { pokemonId: 52, chance: 10, money: 40 }, // Miaouss
      { pokemonId: 56, chance: 5, money: 60 }, // Férosinge
      { pokemonId: 29, chance: 15, money: 30 }, // Nidoran Femelle
      { pokemonId: 32, chance: 15, money: 30 }, // Nidoran Mâle
      { pokemonId: 21, chance: 20, money: 20 }, // Piafabec
      { pokemonId: 39, chance: 8, money: 45 }, // Rondoudou
      { pokemonId: 63, chance: 1, money: 80 }, // Abra
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
    cost: 350,
    encounterTable: [
      { pokemonId: 10, chance: 25, money: 10 }, // Chenipan
      { pokemonId: 13, chance: 25, money: 10 }, // Aspicot
      { pokemonId: 25, chance: 1, money: 500 }, // Pikachu
      { pokemonId: 127, chance: 10, money: 100 }, // Scarabrute
      { pokemonId: 143, chance: 3, money: 350 }, // Ronflex
      { pokemonId: 123, chance: 3, money: 300 }, // Insécateur
      { pokemonId: 43, chance: 15, money: 30 }, // Mystherbe
      { pokemonId: 69, chance: 15, money: 30 }, // Chétiflor
      { pokemonId: 63, chance: 1, money: 80 }, // Abra
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
    cost: 800,
    encounterTable: [
      { pokemonId: 7, chance: 1, money: 2000 }, // Carapuce
      { pokemonId: 60, chance: 10, money: 60 }, // Ptitard
      { pokemonId: 129, chance: 35, money: 10 }, // Magicarpe
      { pokemonId: 79, chance: 15, money: 40 }, // Ramoloss
      { pokemonId: 23, chance: 20, money: 20 }, // Abo
      { pokemonId: 63, chance: 3, money: 80 }, // Abra
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
    ],
  },
  caverne: {
    id: "caverne",
    title: "Caverne",
    rows: 8,
    cols: 8,
    minMines: 9,
    maxMines: 12,
    backgroundImage: "./img/cavern.jpg",
    cost: 1250,
    encounterTable: [
      { pokemonId: 41, chance: 30, money: 10 }, // Nosferapti
      { pokemonId: 74, chance: 30, money: 10 }, // Racaillou
      { pokemonId: 95, chance: 5, money: 150 }, // Onix
      { pokemonId: 46, chance: 15, money: 40 }, // Paras
      { pokemonId: 35, chance: 2, money: 200 }, // Melofée
      { pokemonId: 27, chance: 20, money: 30 }, // Sabelette
      { pokemonId: 63, chance: 3, money: 80 }, // Abra
      { pokemonId: 143, chance: 3, money: 350 }, // Ronflex
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
      { pokemonId: 50, chance: 20, money: 30 }, // Métamorphe
    ],
  },
  plage: {
    id: "plage",
    title: "Plage",
    rows: 8,
    cols: 8,
    minMines: 9,
    maxMines: 12,
    backgroundImage: "./img/plage.jpg",
    cost: 1250,
    encounterTable: [
      { pokemonId: 129, chance: 25, money: 5 }, // Magicarpe
      { pokemonId: 118, chance: 15, money: 25 }, // Poissirène
      { pokemonId: 116, chance: 10, money: 50 }, // hypotrempe
      { pokemonId: 72, chance: 25, money: 5 }, // Tentacool
      { pokemonId: 90, chance: 15, money: 15 }, // Kokiyas
      { pokemonId: 98, chance: 15, money: 15 }, // Krabby
      { pokemonId: 131, chance: 5, money: 200 }, // Lokhlass
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
    ],
  },
  sentier: {
    id: "sentier",
    title: "Sentier sinueux",
    rows: 9,
    cols: 9,
    minMines: 10,
    maxMines: 12,
    backgroundImage: "./img/sentier.jpg",
    cost: 1750,
    encounterTable: [
      { pokemonId: 48, chance: 20, money: 40 }, // Mimitoss
      { pokemonId: 37, chance: 5, money: 80 }, // Goupix
      { pokemonId: 58, chance: 15, money: 50 }, // Caninos
      { pokemonId: 63, chance: 3, money: 80 }, // Abra
      { pokemonId: 66, chance: 15, money: 40 }, // Machoc
      { pokemonId: 83, chance: 20, money: 30 }, // Canarticho
      { pokemonId: 96, chance: 15, money: 50 }, // Soporifik
      { pokemonId: 108, chance: 10, money: 60 }, // Exelangue
      { pokemonId: 114, chance: 15, money: 60 }, // Saquedeneu
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
    ],
  },
  centrale: {
    id: "centrale",
    title: "Centrale",
    rows: 9,
    cols: 9,
    minMines: 12,
    maxMines: 15,
    backgroundImage: "./img/centrale.jpg",
    cost: 2000,
    encounterTable: [
      { pokemonId: 100, chance: 25, money: 1 }, // Voltorbe
      { pokemonId: 125, chance: 15, money: 30 }, // Elektek
      { pokemonId: 145, chance: 0.1, money: 15000 }, // Electhor
      { pokemonId: 137, chance: 3, money: 100 }, // Porygon
      { pokemonId: 135, chance: 1, money: 1500 }, // Voltali
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
      { pokemonId: 122, chance: 10, money: 60 }, // M.Mime
      { pokemonId: 113, chance: 8, money: 100 }, // Leveinard
      { pokemonId: 81, chance: 25, money: 5 }, // Magnéti
      { pokemonId: 25, chance: 2, money: 500 }, // Pikachu
    ],
  },
    manoir: {
    id: "manoir",
    title: "Manoir",
    rows: 10,
    cols: 10,
    minMines: 14,
    maxMines: 16,
    backgroundImage: "./img/manoir.jpg",
    cost: 2500,
    encounterTable: [
      { pokemonId: 96, chance: 15, money: 50 }, // Soporifik
      { pokemonId: 92, chance: 25, money: 10 }, // Fantominus
      { pokemonId: 104, chance: 5, money: 80 }, // Osselait
      { pokemonId: 105, chance: 1, money: 1000 }, // Osselait
      { pokemonId: 132, chance: 3, money: 125 }, // Métamorphe
      { pokemonId: 122, chance: 10, money: 60 }, // M.Mime
      { pokemonId: 106, chance: 8, money: 70 }, // kicklee
      { pokemonId: 107, chance: 8, money: 70 }, // Tygnon
      { pokemonId: 57, chance: 5, money: 300 }, // Colossinge
      { pokemonId: 88, chance: 10, money: 65 }, // Tadmorv
    ],
  },
    iles: {
    id: "iles",
    title: "Iles",
    rows: 10,
    cols: 10,
    minMines: 14,
    maxMines: 16,
    backgroundImage: "./img/iles.jpg",
    cost: 2500,
    encounterTable: [
      { pokemonId: 86, chance: 15, money: 70 }, // Otaria
      { pokemonId: 120, chance: 10, money: 80 }, // Stari
      { pokemonId: 124, chance: 15, money: 60 }, // Lippoutou
      { pokemonId: 134, chance: 1, money: 1500 }, // Aquali
      { pokemonId: 144, chance: 0.1, money: 15000 }, // Artikodin
      { pokemonId: 147, chance: 3, money: 500 }, // Minidraco
      { pokemonId: 116, chance: 10, money: 50 }, // hypotrempe
      { pokemonId: 117, chance: 2, money: 400 }, // hypocéan
      { pokemonId: 80, chance: 5, money: 300 }, // Flagadoss
    ],
  },
    volcan: {
    id: "volcan",
    title: "Volcan",
    rows: 11,
    cols: 11,
    minMines: 30,
    maxMines: 40,
    backgroundImage: "./img/volcan.jpg",
    cost: 3000,
    encounterTable: [
      { pokemonId: 4, chance: 1, money: 1500 }, // Salamèche
      { pokemonId: 77, chance: 10, money: 100 }, // Ponyta
      { pokemonId: 84, chance: 15, money: 60 }, // Doduo
      { pokemonId: 126, chance: 5, money: 500 }, // Magmar
      { pokemonId: 136, chance: 1, money: 1500 }, // Pyroli
      { pokemonId: 146, chance: 0.1, money: 15000 }, // Sulfura
      { pokemonId: 51, chance: 20, money: 70 }, // Triopikeur
      { pokemonId: 109, chance: 15, money: 150 }, // Smogo
    ],
  },
};

let currentLevel = LEVELS["hautes-herbes"];

function showMessage(message) {
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
function handlePokemonCaptureOrEvolution(pokemonData, isEvolution = false, basePokemon = null, evolutionRule = null) {
    // Incrémente le compteur du Pokémon
    capturedPokemonCounts[pokemonData.id] = (capturedPokemonCounts[pokemonData.id] || 0) + 1;

    // Met à jour l'argent si c'est une évolution ou une capture normale
    if (isEvolution && evolutionRule && evolutionRule.moneyBonus) {
        playerMoney += evolutionRule.moneyBonus;
        playerMoneyElement.textContent = playerMoney;
        showMessage(`+${evolutionRule.moneyBonus} ₽ (Évolution de ${basePokemon.name})`);
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
        if (currentCaptures > 0 && currentCaptures % nextEvolutionRule.threshold === 0) {
            // Tente de trouver le Pokémon évolué dans la liste complète des Pokémon
            const potentialEvolvedPokemon = allPokemonData.find(p => p.id === nextEvolutionRule.evolvesTo);

            // C'est la partie CRUCIALE : Vérifiez si le Pokémon évolué a été trouvé !
            if (potentialEvolvedPokemon) {
                console.log(`${pokemonData.name} a atteint le seuil d'évolution suivant ! Ajout à la file d'attente.`);
                evolutionQueue.push({
                    basePokemon: pokemonData,
                    evolvedPokemon: potentialEvolvedPokemon, // Ici, potentialEvolvedPokemon est garanti d'être un objet valide
                    evolutionRule: nextEvolutionRule
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
                <img src="${evolvedPokemon.sprite}" alt="${ // Gardez l'image du pokémon évolué ici, cachée au début
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
    handlePokemonCaptureOrEvolution(evolvedPokemon, true, basePokemon, evolutionRule);
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
    };

    try {
        localStorage.setItem("pokemonMinesweeperSave", JSON.stringify(gameState));
        showMessage("Partie sauvegardée avec succès !", "success");
        console.log("Game saved:", gameState);
    } catch (e) {
        console.error("Erreur lors de la sauvegarde de la partie:", e);
        showMessage("Erreur lors de la sauvegarde. Espace de stockage insuffisant ou problème navigateur.", "error");
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
            allPokemonData.forEach(pokemon => {
                const pokedexImg = document.getElementById(`pokedex-sprite-${pokemon.id}`);
                const pokedexName = document.getElementById(`pokedex-name-${pokemon.id}`);
                const pokedexCount = document.getElementById(`pokedex-count-${pokemon.id}`);

                if (capturedPokemonIds.has(pokemon.id)) {
                    if (pokedexImg) pokedexImg.classList.remove("grayscale");
                    if (pokedexName) pokedexName.textContent = pokemon.name;
                } else {
                    if (pokedexImg) pokedexImg.classList.add("grayscale");
                    if (pokedexName) pokedexName.textContent = "???";
                }
                if (pokedexCount) pokedexCount.textContent = capturedPokemonCounts[pokemon.id] || 0;
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
            } else { // Partie non commencée
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
        showMessage("Erreur lors du chargement de la partie. Le fichier de sauvegarde est-il corrompu ?", "error");
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
function updatePokedexAfterEvolutionVisuals(basePokemon, evolvedPokemon, evolutionRule) {
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


    // NOUVEAU : Ajouter le Pokémon évolué à la file d'attente s'il a une prochaine évolution
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
  })

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

