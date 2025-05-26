import { fetchPoke } from "./fetch.js"; // Assure-toi que ce fichier existe et fonctionne correctement

let allPokemonData = []; // Stocke toutes les données Pokémon récupérées
let gameOver = false; // État du jeu (terminé ou non)
let safeCellsToReveal = 0; // Nombre total de cellules sûres à révéler pour gagner
let revealedSafeCellsCount = 0; // Nombre de cellules sûres actuellement révélées par le joueur
let grid;

// Constantes pour la taille de la grille
const GRID_COLS = 7;
const GRID_ROWS = 7;

document.addEventListener('DOMContentLoaded', async () => {
    // Récupère les données Pokémon au chargement de la page
    allPokemonData = await fetchPoke();
    console.log("Données Pokémon chargées :", allPokemonData);

    // Récupère les éléments DOM nécessaires
    const gridElement = document.getElementById('grid');
    const titre = document.getElementById("titre");
    const replay = document.getElementById("replay");

    // Initialise la grille du jeu
    createGrid(GRID_ROWS, GRID_COLS);
    const allCells = document.querySelectorAll(".cell"); // Sélectionne toutes les cellules après leur création
    console.log("Toutes les cellules de la grille :", allCells);

    // Calcule le nombre total de cellules sûres au début du jeu
    allCells.forEach(cell => {
        if (cell.getAttribute("status") === "safe") {
            safeCellsToReveal++;
        }
    });
    console.log("Nombre total de cellules sûres à révéler :", safeCellsToReveal);

    // Ajoute un écouteur d'événements 'click' à chaque cellule
    allCells.forEach(element => {
        element.addEventListener("click", () => {
            // Si le jeu est terminé ou si la cellule est déjà révélée, ne fait rien
            if (gameOver || element.classList.contains('revealed')) {
                return;
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

                // Met à jour le contenu de la cellule cliquée elle-même (affichera son propre compte)
                updateCellContent(element);

                // Obtient les voisins de la cellule cliquée
                const clickedCellNeighbors = checkNearCells(element, GRID_COLS);

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
    });

    /**
     * Crée la structure visuelle de la grille et initialise l'état logique des cellules.
     * @param {number} rows Le nombre de lignes de la grille.
     * @param {number} cols Le nombre de colonnes de la grille.
     */
    function createGrid(rows, cols) {
        gridElement.innerHTML = ''; // Vide la grille existante
        gridElement.style.gridTemplateColumns = `repeat(${cols}, 70px)`; // Définit les colonnes CSS
        gridElement.style.gridTemplateRows = `repeat(${rows}, 70px)`; // Définit les lignes CSS

        // Initialise la variable 'grid' logique (non utilisée directement pour le DOM ici, mais peut servir pour l'état interne)
        // Note: Cette variable 'grid' n'est pas utilisée dans la logique actuelle du jeu (tout est basé sur le DOM).
        // Si tu souhaites l'utiliser, il faudrait la synchroniser avec les attributs DOM.
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
        // Désactive les clics sur toutes les cellules
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
        replay.classList.remove("hidden"); // Affiche le bouton de rejouer
    }

    /**
     * Gère la victoire du joueur.
     */
    function game_won() {
        gameOver = true; // Met l'état du jeu à terminé
        titre.innerText = "Félicitations ! Vous avez trouvé tous les Pokémon !"; // Message de victoire
        // Désactive les clics sur toutes les cellules
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
        replay.classList.remove("hidden"); // Affiche le bouton de rejouer
    }

    /**
     * Rend les éléments HTML des cellules de la grille.
     * Attribue un ID séquentiel et un statut "boom" ou "safe".
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
                const randomNumber = Math.floor(Math.random() * 51);
                if (randomNumber < 10) { // Environ 20% de chance d'être une bombe
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
                    neighborRow >= 0 && neighborRow < GRID_ROWS &&
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

        const neighborsOfTargetCell = checkNearCells(cellToUpdate, GRID_COLS); // Récupère les voisins de cette cellule
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
    }
});
