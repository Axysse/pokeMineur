import { fetchPoke } from "./fetch.js"; // Assure-toi que ce fichier existe et fonctionne correctement

let allPokemonData = []; // Stocke toutes les données Pokémon récupérées
let gameOver = false; // État du jeu (terminé ou non)
let gameStarted = false; // Indique si une partie est en cours (premier clic effectué)
let safeCellsToReveal = 0; // Nombre total de cellules sûres à révéler pour gagner
let revealedSafeCellsCount = 0; // Nombre de cellules sûres actuellement révélées par le joueur
let grid; // Déclaration de la variable 'grid' pour éviter 'ReferenceError'
let pokeballNumberElement; // Référence à l'élément DOM qui affichera le nombre de Pokéballs
let pokeballNbr = 0; // Compteur de Pokéballs trouvées (initialisé à 0 une seule fois au chargement de la page)
let allCells; // Déclaration globale pour stocker toutes les cellules après la création de la grille

// Définition des niveaux de difficulté
const LEVELS = {
    "hautes-herbes": {
        id: "hautes-herbes",
        title: "Hautes-herbes",
        rows: 6,
        cols: 6,
        mineChance: 15, // Pourcentage de chance qu'une cellule soit un Voltorbe (15%)
        backgroundImage: './img/grass.jpg' // URL d'image de fond placeholder
    },
    "caverne": {
        id: "caverne",
        title: "Caverne",
        rows: 8,
        cols: 8,
        mineChance: 25, // Pourcentage de chance qu'une cellule soit un Voltorbe (25%)
        backgroundImage: './img/cavern.jpg' // URL d'image de fond placeholder
    }
};

let currentLevel = LEVELS["hautes-herbes"]; // Niveau par défaut au démarrage

document.addEventListener('DOMContentLoaded', async () => {
    // Récupère les données Pokémon au chargement de la page
    allPokemonData = await fetchPoke();
    console.log("Données Pokémon chargées :", allPokemonData);

    // Récupère les éléments DOM nécessaires
    const gameContainer = document.getElementById('game-container'); // Conteneur principal du jeu
    const gridElement = document.getElementById('grid');
    const titre = document.getElementById("titre");
    const replayButton = document.getElementById("replay");
    pokeballNumberElement = document.getElementById("pokeballNumber"); // Initialise la référence DOM

    // Récupère la référence à la section principale qui contient la grille et les articles
    const mainSection = document.querySelector('section');

    // Crée les boutons de sélection de niveau
    const levelSelectionDiv = document.createElement('div');
    levelSelectionDiv.id = 'level-selection';
    levelSelectionDiv.className = 'flex justify-center space-x-4 mb-4'; // Tailwind classes for styling

    for (const levelId in LEVELS) {
        const level = LEVELS[levelId];
        const button = document.createElement('button');
        button.textContent = level.title;
        button.dataset.levelId = level.id; // Ajoute un dataset pour identifier le bouton de niveau
        button.className = 'px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'; // Tailwind classes
        button.addEventListener('click', () => {
            // Si une partie est déjà commencée, on ne change pas de niveau directement
            if (gameStarted) {
                showMessage("Veuillez terminer la partie ou rejouer avant de changer de niveau !");
                return;
            }
            currentLevel = level;
            startGame(); // Démarre le jeu avec le niveau sélectionné
        });
        levelSelectionDiv.appendChild(button);
    }
    // Insère les boutons avant la section principale, qui est une enfant directe de gameContainer
    gameContainer.insertBefore(levelSelectionDiv, mainSection); 

    // Ajoute un écouteur d'événements pour le bouton rejouer
    replayButton.addEventListener('click', () => {
        startGame(); // Redémarre le jeu avec le niveau actuel
    });

    // Démarre le jeu avec le niveau par défaut au premier chargement
    startGame();

    /**
     * Active ou désactive les boutons de sélection de niveau.
     * @param {boolean} enable Si true, active les boutons; si false, les désactive.
     */
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

    /**
     * Met à jour le compteur de Pokéballs affiché.
     */
    function updateBallNumber() {
        pokeballNbr++;
        pokeballNumberElement.innerHTML = pokeballNbr;
    }

    /**
     * Initialise ou redémarre le jeu avec le niveau actuel.
     */
    function startGame() {
        gameOver = false;
        gameStarted = false; // Réinitialise l'état de la partie
        revealedSafeCellsCount = 0;
        // pokeballNbr n'est plus réinitialisé ici pour le garder entre les parties
        pokeballNumberElement.innerHTML = pokeballNbr; // Met à jour l'affichage avec le compte actuel
        titre.innerText = "Trouvez tous les Pokémon !"; // Réinitialise le titre
        
        // MODIFIÉ : Gère la visibilité du bouton Rejouer via l'opacité et les pointer-events
        replayButton.classList.add('opacity-0', 'pointer-events-none');
        replayButton.classList.remove('opacity-100', 'pointer-events-auto');


        toggleLevelSelectionButtons(true); // Active les boutons de sélection de niveau au début du jeu

        createGrid(currentLevel.rows, currentLevel.cols); // Crée la grille selon le niveau
        allCells = document.querySelectorAll(".cell"); // Met à jour la NodeList des cellules

        // Applique l'image de fond de la grille
        gridElement.style.backgroundImage = `url('${currentLevel.backgroundImage}')`;
        gridElement.style.backgroundSize = 'cover';
        gridElement.style.backgroundRepeat = 'no-repeat';
        gridElement.style.backgroundPosition = 'center';

        // Réactive les clics sur toutes les cellules
        allCells.forEach(cell => {
            cell.style.pointerEvents = 'auto';
            // Supprime le contenu et les classes révélées/marquées pour un nouveau jeu
            cell.classList.remove('revealed');
            const existingContent = cell.querySelector('img, span.mine-count');
            if (existingContent) {
                existingContent.remove();
            }
        });

        // Recalcule le nombre total de cellules sûres pour le nouveau niveau
        safeCellsToReveal = 0;
        allCells.forEach(cell => {
            if (cell.getAttribute("status") === "safe") {
                safeCellsToReveal++;
            }
        });
        console.log("Nouveau jeu démarré. Niveau :", currentLevel.title, "Cellules sûres à révéler :", safeCellsToReveal);
    }

    // Ajoute un écouteur d'événements 'click' à chaque cellule (délégation d'événements pour les cellules recréées)
    // On attache l'écouteur au gridElement parent et on vérifie la cible du clic
    gridElement.addEventListener("click", (event) => {
        const element = event.target.closest('.cell'); // Trouve la cellule cliquée ou un de ses enfants
        if (!element || gameOver || element.classList.contains('revealed')) {
            return; // Si ce n'est pas une cellule, le jeu est terminé ou la cellule est révélée, ne fait rien
        }

        // Si la partie n'a pas encore commencé, la marque comme commencée et désactive les boutons de niveau
        if (!gameStarted) {
            gameStarted = true;
            toggleLevelSelectionButtons(false); // Désactive les boutons de sélection de niveau
        }

        console.log("Cliqué sur la cellule avec l'ID : " + element.id);

        // Si la cellule est une bombe (Voltorbe)
        if (element.getAttribute("status") === "boom") {
            element.classList.add('revealed'); // Révèle la cellule

            // Supprime tout contenu existant avant d'ajouter le Voltorbe
            const existingContent = element.querySelector('img, span.mine-count');
            if (existingContent) {
                existingContent.remove();
            }

            const cellImg = document.createElement("img");
            cellImg.src = allPokemonData[99].sprite; // Affiche l'image du Voltorbe (ID 99)
            cellImg.classList.add("w-28", "h-28");
            element.appendChild(cellImg);

            const audio = new Audio(allPokemonData[99].cry); // Joue le cri du Voltorbe
            audio.play();

            // Utilise une modale ou un message personnalisé au lieu d'alert()
            showMessage("BADABOOM ! C'était un Voltorbe !");
            game_over(); // Déclenche la fin du jeu
        } else {
            // Si la cellule est sûre (pas une bombe)
            element.classList.add('revealed'); // Révèle la cellule cliquée
            revealedSafeCellsCount++; // Incrémente le compteur de cellules sûres révélées

            // Calcule le nombre de bombes autour de la cellule cliquée pour savoir si elle affichera une Pokéball
            const neighborsForClickedCellCount = checkNearCells(element, currentLevel.cols); // Utilise currentLevel.cols
            let clickedCellBoomCount = 0;
            neighborsForClickedCellCount.forEach(neighbor => {
                if (neighbor.getAttribute("status") === "boom") {
                    clickedCellBoomCount++;
                }
            });

            // Met à jour le contenu de la cellule cliquée elle-même (affichera son propre compte ou Pokéball)
            updateCellContent(element);

            // Si la cellule cliquée est sûre et qu'elle n'a pas de bombes autour (donc affiche une Pokéball)
            if (clickedCellBoomCount === 0) {
                updateBallNumber(); // Incrémente le compteur de Pokéballs trouvées
            }

            // Obtient les voisins de la cellule cliquée
            const clickedCellNeighbors = checkNearCells(element, currentLevel.cols); // Utilise currentLevel.cols

            // Pour chaque voisin, met à jour son contenu (afficher son propre compte)
            clickedCellNeighbors.forEach(neighbor => {
                // S'assurer que le voisin n'est pas déjà révélé.
                // La condition 'neighbor.getAttribute("status") !== "boom"' a été retirée ici
                // pour permettre aux cases "boom" d'afficher un chiffre si elles sont voisines d'une case cliquée.
                if (!neighbor.classList.contains('revealed')) {
                    updateCellContent(neighbor); // Met à jour le contenu du voisin
                }
            });

            checkWinCondition(); // Vérifie si le joueur a gagné après chaque clic sûr
        }
    });

    /**
     * Crée la structure visuelle de la grille et initialise l'état logique des cellules.
     * @param {number} rows Le nombre de lignes de la grille.
     * @param {number} cols Le nombre de colonnes de la grille.
     */
    function createGrid(rows, cols) {
        gridElement.innerHTML = ''; // Vide la grille existante
        gridElement.style.gridTemplateColumns = `repeat(${cols}, 60px)`; // Définit les colonnes CSS
        gridElement.style.gridTemplateRows = `repeat(${rows}, 60px)`; // Définit les lignes CSS

        // Initialise la variable 'grid' logique (non utilisée directement pour le DOM ici, mais peut servir pour l'état interne)
        grid = Array(rows).fill(null).map(() => Array(cols).fill({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            minesAround: 0
        }));
        renderGrid(rows, cols); // Rend les éléments DOM de la grille
    }

    /**
     * Gère la fin du jeu lorsque le joueur clique sur un Voltorbe.
     */
    function game_over() {
        gameOver = true; // Met l'état du jeu à terminé
        titre.innerText = "Oh non! C'était un Voltorbe!"; // Met à jour le titre

        // Révèle tous les Voltorbes et les chiffres sur les autres cases
        allCells.forEach(cell => {
            if (cell.getAttribute("status") === "boom") {
                // Révèle les Voltorbes
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed'); // Révèle la cellule
                    const existingContent = cell.querySelector('img, span.mine-count');
                    if (existingContent) {
                        existingContent.remove();
                    }
                    const cellImg = document.createElement("img");
                    cellImg.src = allPokemonData[99].sprite; // Affiche l'image du Voltorbe
                    cellImg.classList.add("w-28", "h-28");
                    cell.appendChild(cellImg);
                }
            } else {
                // Révèle les chiffres sur les cases sûres non encore révélées
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed'); // Révèle la cellule
                    updateCellContent(cell); // Met à jour son contenu (chiffre ou Pokéball)
                }
            }
            cell.style.pointerEvents = 'none'; // Désactive les clics sur toutes les cellules
        });
        // MODIFIÉ : Gère la visibilité du bouton Rejouer via l'opacité et les pointer-events
        replayButton.classList.remove('opacity-0', 'pointer-events-none');
        replayButton.classList.add('opacity-100', 'pointer-events-auto');
        
        toggleLevelSelectionButtons(true); // Réactive les boutons de sélection de niveau à la fin de la partie
    }

    /**
     * Gère la victoire du joueur.
     */
    function game_won() {
        gameOver = true; // Met l'état du jeu à terminé
        titre.innerText = "Félicitations ! Vous avez trouvé tous les Pokémon !"; // Message de victoire
        // Désactive les clics sur toutes les cellules
        allCells.forEach(cell => { // Utilise allCells ici
            cell.style.pointerEvents = 'none';
        });
        // MODIFIÉ : Gère la visibilité du bouton Rejouer via l'opacité et les pointer-events
        replayButton.classList.remove('opacity-0', 'pointer-events-none');
        replayButton.classList.add('opacity-100', 'pointer-events-auto');
        
        toggleLevelSelectionButtons(true); // Réactive les boutons de sélection de niveau à la fin de la partie
    }

    /**
     * Rend les éléments HTML des cellules de la grille.
     * Attribue un ID séquentiel et un statut "boom" ou "safe".
     * Le pourcentage de bombes est basé sur le niveau actuel.
     * @param {number} rows Le nombre de lignes.
     * @param {number} cols Le nombre de colonnes.
     */
    function renderGrid(rows, cols) {
        let i = 0; // Compteur pour l'ID de la cellule
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r; // Stocke la ligne dans un dataset
                cell.dataset.col = c; // Stocke la colonne dans un dataset
                cell.id = i; // Attribue un ID unique (string)
                
                // Détermine si c'est une bombe en fonction du pourcentage du niveau actuel
                const randomNumber = Math.floor(Math.random() * 100); // Nombre entre 0 et 99
                if (randomNumber < currentLevel.mineChance) { // Compare avec le pourcentage de chance du niveau
                    cell.setAttribute("status", "boom");
                } else {
                    cell.setAttribute("status", "safe");
                }
                gridElement.appendChild(cell); // Ajoute la cellule à la grille
                i++;
            }
        }
    }

    /**
     * Trouve et retourne les cellules voisines d'une cellule donnée.
     * Cette fonction est pure : elle ne modifie pas le DOM et ne contient pas de logique de jeu.
     * @param {HTMLElement} cell La cellule dont on veut trouver les voisins.
     * @param {number} gridWidth La largeur de la grille (nombre de colonnes).
     * @returns {HTMLElement[]} Un tableau d'éléments DOM représentant les cellules voisines.
     */
    function checkNearCells(cell, gridWidth) {
        const surroundingCells = [];
        const clickedCellId = Number(cell.id); // Convertit l'ID de la cellule cliquée en nombre

        if (isNaN(clickedCellId)) {
            console.error("Erreur: l'ID de la cellule cliquée n'est pas un nombre valide.", cell.id);
            return []; // Retourne un tableau vide en cas d'erreur
        }

        const clickedRow = Math.floor(clickedCellId / gridWidth); // Calcule la ligne
        const clickedCol = clickedCellId % gridWidth; // Calcule la colonne

        // Parcourt les 8 positions autour de la cellule (3x3, en excluant la cellule centrale)
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue; // Exclut la cellule elle-même
                }

                const neighborRow = clickedRow + rowOffset;
                const neighborCol = clickedCol + colOffset;

                // Vérifie si le voisin est dans les limites de la grille
                if (
                    neighborRow >= 0 && neighborRow < currentLevel.rows && // Utilise currentLevel.rows
                    neighborCol >= 0 && neighborCol < gridWidth
                ) {
                    const neighborId = neighborRow * gridWidth + neighborCol; // Calcule l'ID du voisin
                    // Cherche la cellule correspondante dans la NodeList 'allCells'
                    const foundNeighbor = Array.from(allCells).find(element => Number(element.id) === neighborId);

                    if (foundNeighbor) {
                        surroundingCells.push(foundNeighbor); // Ajoute le voisin trouvé
                    }
                }
            }
        }
        return surroundingCells; // Retourne le tableau des voisins
    }

    /**
     * Met à jour le contenu d'une cellule : compte les bombes autour d'elle
     * et affiche le chiffre ou l'image de la Pokéball.
     * Cette fonction ne révèle PAS la cellule et n'est PAS récursive.
     * @param {HTMLElement} cellToUpdate La cellule dont le contenu doit être mis à jour.
     */
    function updateCellContent(cellToUpdate) {
        // Supprime tout contenu existant (image ou chiffre précédent) de la cellule
        const existingContent = cellToUpdate.querySelector('img, span.mine-count');
        if (existingContent) {
            existingContent.remove();
        }

        const neighborsOfTargetCell = checkNearCells(cellToUpdate, currentLevel.cols); // Utilise currentLevel.cols
        let boomCount = 0; // Compteur de Voltorbes

        // Compte le nombre de Voltorbes parmi les voisins
        neighborsOfTargetCell.forEach(neighbor => {
            if (neighbor.getAttribute("status") === "boom") {
                boomCount++;
            }
        });

        // Si des Voltorbes sont trouvés autour, affiche le chiffre
        if (boomCount > 0) {
            const numberSpan = document.createElement('span');
            numberSpan.classList.add('mine-count'); // Pour le styliser en CSS
            numberSpan.textContent = boomCount; // Affiche le nombre
            cellToUpdate.appendChild(numberSpan);
        } else {
            // Si aucun Voltorbe n'est trouvé (boomCount === 0), affiche l'image de la Pokéball
            const cellImg = document.createElement("img");
            cellImg.src = "./img/ball.png"; // Image pour les cases sûres et vides
            cellImg.classList.add("w-12", "h-8"); // Ajuste les classes si nécessaire
            cellToUpdate.appendChild(cellImg);
        }
    }

    /**
     * Vérifie si toutes les cellules sûres ont été révélées, déclenchant la victoire si c'est le cas.
     */
    function checkWinCondition() {
        if (revealedSafeCellsCount === safeCellsToReveal) {
            game_won();
        }
    }

    /**
     * Affiche un message personnalisé à l'utilisateur (remplace alert()).
     * @param {string} message Le message à afficher.
     */
    function showMessage(message) {
        const messageBox = document.createElement('div');
        messageBox.classList.add('message-box');
        messageBox.textContent = message;
        document.body.appendChild(messageBox);

        // Supprime le message après quelques secondes
        setTimeout(() => {
            messageBox.remove();
        }, 3000); // Message disparaît après 3 secondes
    }
});
