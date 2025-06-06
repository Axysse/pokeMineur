import { SHOP_ITEMS } from './shop.js';
import { showMessage } from './main.js';

// La fonction showMessage sera nécessaire pour les retours visuels.
// Si showMessage est exportée depuis un fichier 'utils.js' :
// import { showMessage } from './utils.js';
// Si showMessage est définie globalement dans main.js et n'est pas exportée,
// il faudra la passer en paramètre comme pour openShopModal.
// Pour cet exemple, nous la passerons en paramètre.

/**
 * Ouvre une modale affichant l'inventaire du joueur.
 * @param {object} playerInventory - L'objet contenant les articles du joueur (ex: { itemId: quantity }).
 * @param {function} showMessage - La fonction pour afficher des messages au joueur.
 * @param {function} useItemCallback - La fonction à appeler quand un joueur utilise un objet.
 */
export function openInventoryModal(playerInventory, showMessage, useItemCallback) {
    const modal = document.createElement("div");
    modal.classList.add("inventory-modal", "fixed", "inset-0", "bg-gray-800", "bg-opacity-75", "flex", "items-center", "justify-center", "z-50", "p-4", "hidden");
    modal.innerHTML = `
        <div class="inventory-modal-content bg-white p-6 rounded-lg shadow-xl text-center max-w-2xl w-full flex flex-col">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Votre Inventaire</h2>

            <div id="inventory-items-container" class="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-96 pb-4">
                </div>

            <button id="closeInventoryModalBtn" class="mt-6 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">Fermer l'Inventaire</button>
        </div>
    `;
    document.body.appendChild(modal);

    const inventoryItemsContainer = document.getElementById("inventory-items-container");

    let hasItems = false; // Pour vérifier si l'inventaire est vide

    // Parcourir l'inventaire du joueur
    for (const itemId in playerInventory) {
        const quantity = playerInventory[itemId];

        // Ne pas afficher les articles en quantité 0
        if (quantity > 0) {
            hasItems = true;
            // Trouver les détails de l'article depuis SHOP_ITEMS
            const itemDetails = SHOP_ITEMS.find(item => item.id === itemId);

            if (itemDetails) {
                const itemCard = document.createElement("div");
                itemCard.classList.add(
                    "bg-gray-100", "p-4", "rounded-lg", "shadow-md", "flex", "flex-col", "items-center",
                    "border", "border-gray-200", "hover:shadow-lg", "transition-all", "duration-200"
                );
                itemCard.innerHTML = `
                    <img src="${itemDetails.icon}" alt="${itemDetails.name}" class="w-20 h-20 object-contain mb-2">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">${itemDetails.name}</h3>
                    <p class="text-sm text-gray-600 text-center mb-2 flex-grow">${itemDetails.description}</p>
                    <p class="text-md font-semibold text-purple-700 mb-3">Quantité : <span class="item-quantity">${quantity}</span></p>
                    <button class="use-item-btn px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" data-item-id="${itemDetails.id}">Utiliser</button>
                `;
                inventoryItemsContainer.appendChild(itemCard);

                // Gérer l'utilisation de l'objet
                const useButton = itemCard.querySelector(".use-item-btn");
                useButton.addEventListener("click", () => {
                    // Appelle le callback fourni par main.js pour gérer l'effet de l'objet
                    if (useItemCallback(itemId)) { // Si l'utilisation est réussie
                        playerInventory[itemId]--; // Décrémente la quantité
                        // Met à jour la quantité affichée dans la modale
                        itemCard.querySelector(".item-quantity").textContent = playerInventory[itemId];
                        if (playerInventory[itemId] <= 0) {
                            itemCard.remove(); // Supprime la carte si la quantité est à zéro
                            // Si plus aucun objet, affiche un message
                            if (Object.values(playerInventory).every(q => q <= 0)) {
                                inventoryItemsContainer.innerHTML = '<p class="text-gray-600 text-center text-lg col-span-full">Votre inventaire est vide.</p>';
                            }
                        }
                    }
                });
            } else {
                console.warn(`Article inconnu dans l'inventaire: ${itemId}`);
            }
        }
    }

    if (!hasItems) {
        inventoryItemsContainer.innerHTML = '<p class="text-gray-600 text-center text-lg col-span-full">Votre inventaire est vide.</p>';
    }


    // Afficher la modale avec une légère transition
    setTimeout(() => {
        modal.style.display = "flex";
        modal.classList.add("opacity-100");
    }, 50);

    // Gérer la fermeture de la modale
    document.getElementById("closeInventoryModalBtn").addEventListener("click", () => {
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0"); // Ajoute une transition de fondu
        setTimeout(() => modal.remove(), 300); // Supprime après la transition
    });
}