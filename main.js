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


// MODIFIÉ : Ajout de minMines et maxMines
const LEVELS = {
    "hautes-herbes": {
        id: "hautes-herbes",
        title: "Hautes-herbes",
        rows: 5,
        cols: 5,
        minMines: 2, // Minimum de Voltorbes
        maxMines: 4, // Maximum de Voltorbes
        backgroundImage: './img/grass.jpg',
        encounterTable: [
            { pokemonId: 0, chance: 1 }, // Bulbizarre
            { pokemonId: 16, chance: 30 }, // Roucool
            { pokemonId: 18, chance: 30 }, // Ratata
        ]
    },
    "foret": {
        id: "foret",
        title: "Fôret",
        rows: 7,
        cols: 7,
        minMines: 5,
        maxMines: 10,
        backgroundImage: './img/forest.jpg',
        encounterTable: [
            { pokemonId: 10, chance: 35 }, // Chenipan
            { pokemonId: 13, chance: 30 }, // Aspicot
            { pokemonId: 25, chance: 25 }, // Pikachu
        ]
    },
    "riviere": {
        id: "riviere",
        title: "Rivière",
        rows: 7,
        cols: 7,
        minMines: 6,
        maxMines: 10,
        backgroundImage: './img/riviere.jpg',
        encounterTable: [
            { pokemonId: 6, chance: 40 }, // Carapuce
            { pokemonId: 54, chance: 10 } // Psykokwak
        ]
    },
    "caverne": {
        id: "caverne",
        title: "Caverne",
        rows: 8,
        cols: 8,
        minMines: 9,
        maxMines: 16,
        backgroundImage: './img/cavern.jpg',
        encounterTable: [
            { pokemonId: 41, chance: 30 }, // Nosferapti
            { pokemonId: 74, chance: 30 }, // Racaillou
            { pokemonId: 95, chance: 25 }, // Onix
        ]
    }
};

let currentLevel = LEVELS["hautes-herbes"];

document.addEventListener('DOMContentLoaded', async () => {
    allPokemonData = await fetchPoke();
    console.log("Données Pokémon chargées :", allPokemonData);

    const gameContainer = document.getElementById('game-container');
    const gridElement = document.getElementById('grid');
    const titre = document.getElementById("titre");
    const replayButton = document.getElementById("replay");
    pokeballNumberElement = document.getElementById("pokeballNumber");

    const gameContentArticle = document.querySelector('#game-container > article');

    const levelSelectionDiv = document.createElement('div');
    const pokeList = document.getElementById("pokeList")
    levelSelectionDiv.id = 'level-selection';
    levelSelectionDiv.className = 'flex justify-center space-x-4 mb-4';

    for (const levelId in LEVELS) {
        const level = LEVELS[levelId];
        const button = document.createElement('button');
        button.textContent = level.title;
        button.dataset.levelId = level.id;
        button.className = 'px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50';
        button.addEventListener('click', () => {
            if (gameStarted) {
                showMessage("Veuillez terminer la partie ou rejouer avant de changer de niveau !");
                return;
            }
            currentLevel = level;
            startGame();
        });
        levelSelectionDiv.appendChild(button);
    }
    gameContainer.insertBefore(levelSelectionDiv, gameContentArticle);

    replayButton.addEventListener('click', () => {
        startGame();
    });

    allPokemonData.forEach(pokemon => {
        const pokeInPokedex = document.createElement("div");
        pokeInPokedex.classList.add(
            "flex", "flex-row", "items-center", "p-2", "w-22", "h-22", "gap-2"
        );
        // Ajoutez un dataset pour l'ID du Pokémon pour pouvoir le cibler plus tard
        pokeInPokedex.dataset.pokemonId = pokemon.id;

        const pokeImg = document.createElement("img");
        pokeImg.src = pokemon.sprite; // Utilisez la propriété sprite du Pokémon
        pokeImg.alt = pokemon.name;
        pokeImg.classList.add("w-20", "h-20", "object-contain", "mb-1", "grayscale"); // Ajoutez grayscale ici
        pokeImg.id = `pokedex-sprite-${pokemon.id}`; // Ajoutez un ID pour cibler l'image spécifiquement

        const pokeName = document.createElement("p");
        pokeName.textContent = pokemon.name; // Utilisez la propriété name du Pokémon
        pokeName.classList.add("text-xs", "font-semibold", "capitalize", "text-gray-700");

        const pokeId = document.createElement("p");
        pokeId.textContent = `#${pokemon.id}`; // Affiche l'ID avec un #
        pokeId.classList.add("text-xs", "text-gray-500");

        pokeInPokedex.appendChild(pokeImg);
        pokeInPokedex.appendChild(pokeName);
        pokeInPokedex.appendChild(pokeId);

        // Assurez-vous que 'pokeList' est bien définie et fait référence à votre div du Pokédex
        pokeList.appendChild(pokeInPokedex);
    });

    startGame();


    function toggleLevelSelectionButtons(enable) {
        const levelButtons = document.querySelectorAll('#level-selection button');
        levelButtons.forEach(button => {
            button.disabled = !enable;
            if (enable) {
                button.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                button.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    function updateBallNumber() {
        pokeballNbr++;
        pokeballNumberElement.innerHTML = pokeballNbr;
    }

    function startGame() {
        gameOver = false;
        gameStarted = false;
        revealedSafeCellsCount = 0;
        pokeballNumberElement.innerHTML = pokeballNbr;
        titre.innerText = "Trouvez tous les Pokémon !";

        // Gère la visibilité du bouton Rejouer
        replayButton.classList.add('opacity-0', 'pointer-events-none');
        replayButton.classList.remove('opacity-100', 'pointer-events-auto');

        toggleLevelSelectionButtons(true);

        createGrid(currentLevel.rows, currentLevel.cols);
        allCells = document.querySelectorAll(".cell");

        gridElement.style.backgroundImage = `url('${currentLevel.backgroundImage}')`;
        gridElement.style.backgroundSize = 'cover';
        gridElement.style.backgroundRepeat = 'no-repeat';
        gridElement.style.backgroundPosition = 'center';

        allCells.forEach(cell => {
            cell.style.pointerEvents = 'auto';
            cell.classList.remove('revealed');
            const existingContent = cell.querySelector('img, span.mine-count');
            if (existingContent) {
                existingContent.remove();
            }
        });

        safeCellsToReveal = 0;
        allCells.forEach(cell => {
            if (cell.getAttribute("status") === "safe") {
                safeCellsToReveal++;
            }
        });
        console.log("Nouveau jeu démarré. Niveau :", currentLevel.title, "Cellules sûres à révéler :", safeCellsToReveal);
    }

    gridElement.addEventListener("click", (event) => {
        const element = event.target.closest('.cell');
        if (!element || gameOver || element.classList.contains('revealed')) {
            return;
        }

        if (!gameStarted) {
            gameStarted = true;
            toggleLevelSelectionButtons(false);
        }

        console.log("Cliqué sur la cellule avec l'ID : " + element.id);

        if (element.getAttribute("status") === "boom") {
            element.classList.add('revealed');

            const existingContent = element.querySelector('img, span.mine-count');
            if (existingContent) {
                existingContent.remove();
            }

            const cellImg = document.createElement("img");
            cellImg.src = allPokemonData[99].sprite;
            cellImg.classList.add("w-28", "h-28");
            element.appendChild(cellImg);

            const audio = new Audio(allPokemonData[99].cry);
            audio.play();

            showMessage("BADABOOM ! C'était un Voltorbe !");
            game_over();
        } else {
            element.classList.add('revealed');
            revealedSafeCellsCount++;

            const neighborsForClickedCellCount = checkNearCells(element, currentLevel.cols);
            let clickedCellBoomCount = 0;
            neighborsForClickedCellCount.forEach(neighbor => {
                if (neighbor.getAttribute("status") === "boom") {
                    clickedCellBoomCount++;
                }
            });

            updateCellContent(element);

            if (clickedCellBoomCount === 0) {
                updateBallNumber();
            }

            const clickedCellNeighbors = checkNearCells(element, currentLevel.cols);

            clickedCellNeighbors.forEach(neighbor => {
                if (!neighbor.classList.contains('revealed')) {
                    updateCellContent(neighbor);
                }
            });

            checkWinCondition();
        }
    });

    function createGrid(rows, cols) {
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
        gridElement.style.gridTemplateRows = `repeat(${rows}, 60px)`;

        grid = Array(rows).fill(null).map(() => Array(cols).fill({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            minesAround: 0
        }));
        renderGrid(rows, cols);
    }

    function game_over() {
        gameOver = true;
        titre.innerText = "Oh non! C'était un Voltorbe!";
        pokeballNbr = 0

        allCells.forEach(cell => {
            if (cell.getAttribute("status") === "boom") {
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed');
                    const existingContent = cell.querySelector('img, span.mine-count');
                    if (existingContent) {
                        existingContent.remove();
                    }
                    const cellImg = document.createElement("img");
                    cellImg.src = allPokemonData[99].sprite;
                    cellImg.classList.add("w-28", "h-28");
                    cell.appendChild(cellImg);
                }
            } else {
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed');
                    updateCellContent(cell);
                }
            }
            cell.style.pointerEvents = 'none';
        });
        replayButton.classList.remove('opacity-0', 'pointer-events-none');
        replayButton.classList.add('opacity-100', 'pointer-events-auto');

        toggleLevelSelectionButtons(true);
    }

    function game_won() {
        gameOver = true;
        titre.innerText = "Félicitations ! Vous avez trouvé tous les Pokémon !";
        allCells.forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
        replayButton.classList.remove('opacity-0', 'pointer-events-none');
        replayButton.classList.add('opacity-100', 'pointer-events-auto');

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
        gridElement.innerHTML = '';
        const totalCells = rows * cols;
        const minesToPlace = Math.floor(Math.random() * (currentLevel.maxMines - currentLevel.minMines + 1)) + currentLevel.minMines;
        const minePositions = new Set();

        // Sélectionne aléatoirement les positions des mines
        while (minePositions.size < minesToPlace) {
            minePositions.add(Math.floor(Math.random() * totalCells));
        }

        let i = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.id = i;

                if (minePositions.has(i)) {
                    cell.setAttribute("status", "boom");
                } else {
                    cell.setAttribute("status", "safe");
                }
                gridElement.appendChild(cell);
                i++;
            }
        }
        console.log(`Nombre de Voltorbes placés pour ce niveau: ${minesToPlace}`);
    }

    function checkNearCells(cell, gridWidth) {
        const surroundingCells = [];
        const clickedCellId = Number(cell.id);

        if (isNaN(clickedCellId)) {
            console.error("Erreur: l'ID de la cellule cliquée n'est pas un nombre valide.", cell.id);
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
                    neighborRow >= 0 && neighborRow < currentLevel.rows &&
                    neighborCol >= 0 && neighborCol < gridWidth
                ) {
                    const neighborId = neighborRow * gridWidth + neighborCol;
                    const foundNeighbor = Array.from(allCells).find(element => Number(element.id) === neighborId);

                    if (foundNeighbor) {
                        surroundingCells.push(foundNeighbor);
                    }
                }
            }
        }
        return surroundingCells;
    }

    function updateCellContent(cellToUpdate) {
        const existingContent = cellToUpdate.querySelector('img, span.mine-count');
        if (existingContent) {
            existingContent.remove();
        }

        const neighborsOfTargetCell = checkNearCells(cellToUpdate, currentLevel.cols);
        let boomCount = 0;

        neighborsOfTargetCell.forEach(neighbor => {
            if (neighbor.getAttribute("status") === "boom") {
                boomCount++;
            }
        });

        if (boomCount > 0) {
            const numberSpan = document.createElement('span');
            numberSpan.classList.add('mine-count');
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
        const messageBox = document.createElement('div');
        messageBox.classList.add('message-box');
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
        //  Crée la modal de révélation des Pokéballs
        const modal = document.createElement('div');
        modal.classList.add('pokeball-modal'); // Classe CSS pour styliser la modal
        modal.innerHTML = `
            <div class="pokeball-modal-content">
                <h2>Vous avez attrapé <span id="pokeball-count-display">${pokeballsToOpen}</span> Pokéball(s) !</h2>
                <div id="pokemon-reveal-area" class="flex flex-wrap justify-center gap-4 mt-4"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Affiche la modal
        setTimeout(() => {
            modal.style.display = 'flex'; // Rendre la modal visible
        }, 50); // Petit délai pour l'animation d'apparition

        const pokemonRevealArea = document.getElementById('pokemon-reveal-area');
        let openedCount = 0;

        const revealNextPokemon = () => {
            if (openedCount < pokeballsToOpen) {
                // Choisir un Pokémon en fonction de la table de rencontre du niveau actuel
                const encounteredPokemon = choosePokemon(currentLevel.encounterTable);
                if (encounteredPokemon) {
                    const pokemonDiv = document.createElement('div');
                    pokemonDiv.classList.add('revealed-pokemon-item', 'flex', 'flex-col', 'items-center');
                    pokemonDiv.innerHTML = `
                        <img src="${encounteredPokemon.sprite}" alt="${encounteredPokemon.name}" class="w-24 h-24">
                        <p class="capitalize">${encounteredPokemon.name}</p>
                    `;
                    pokemonRevealArea.appendChild(pokemonDiv);

                    // Jouer le cri du Pokémon
                    const audio = new Audio(encounteredPokemon.cry);
                    audio.play();
                }
                openedCount++;
                setTimeout(revealNextPokemon, 800); // Révéler le prochain Pokémon après 0.8 seconde
            } else {
                // Tous les Pokémon ont été révélés
                setTimeout(() => {
                    modal.remove(); // Fermer la modal après un délai
                    pokeballNbr = 0; // Réinitialise le compteur de Pokéballs pour la prochaine partie
                    pokeballNumberElement.innerHTML = pokeballNbr; // Met à jour l'affichage
                }, 2000); // Laisser la modal visible 2 secondes après la dernière révélation
            }
        };

        // Démarrer la révélation des Pokémon après 3 secondes
        setTimeout(() => {
            revealNextPokemon();
        }, 3000);
    }

    /**
     * Choisit un Pokémon aléatoirement basé sur les pourcentages de chance du tableau de rencontre.
     * @param {Array<Object>} encounterTable La table de rencontre du niveau actuel.
     * @returns {Object|null} Les données du Pokémon choisi, ou null si rien n'est choisi (devrait pas arriver si total = 100).
     */
    function choosePokemon(encounterTable) {
        const totalChance = encounterTable.reduce((sum, entry) => sum + entry.chance, 0);
        let randomPoint = Math.random() * totalChance;

        for (const entry of encounterTable) {
            if (randomPoint < entry.chance) {
                return allPokemonData[entry.pokemonId];
            }
            randomPoint -= entry.chance;
        }
        return null; // En cas d'erreur ou si totalChance n'est pas 100
    }
});