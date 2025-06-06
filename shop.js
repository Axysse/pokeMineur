export const SHOP_ITEMS = [
// {
//     id: "money_boost",
//     name: "Boost de PokéDollars",
//     description: "Double vos gains pour la prochaine partie.",
//     cost: 500,
//     effect: "double_next_money", // Effet à gérer dans main.js
//     icon: "./img/money_bag.png", // Icône pour l'argent
//   },
  {
    id: "reveal_safe_cell",
    name: "Détekt Volt.",
    description:
      "Révèle un Voltorbe aléatoire (à utiliser pendant le jeu).",
    cost: 25,
    effect: "reveal_random_risky_cell", // Effet à gérer dans main.js
    icon: "./img/red_flag.png", // Icône de loupe
  },
];

export function openShopModal(playerMoney, updatePlayerMoney, showMessage, playerInventory) {
    // playerMoney: argent actuel du joueur
    // updatePlayerMoney: fonction pour mettre à jour l'affichage de l'argent dans main.js
    // showMessage: fonction pour afficher des messages
    // playerInventory: l'objet ou le Map qui gère l'inventaire du joueur

    const modal = document.createElement("div");
    modal.classList.add("shop-modal", "fixed", "inset-0", "bg-gray-800", "bg-opacity-75", "flex", "items-center", "justify-center", "z-50", "p-4", "hidden");
    modal.innerHTML = `
        <div class="shop-modal-content bg-white p-6 rounded-lg shadow-xl text-center max-w-4xl w-full flex flex-col">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Boutique Pokémon</h2>
            <p class="text-xl font-semibold mb-4 text-yellow-600">Vos PokéDollars : <span id="shop-player-money">${playerMoney}</span> ₽</p>

            <div id="shop-items-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-96 pb-4">
                </div>

            <button id="closeShopModalBtn" class="mt-6 px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200">Fermer la Boutique</button>
        </div>
    `;
    document.body.appendChild(modal);

    const shopItemsContainer = document.getElementById("shop-items-container");
    const shopPlayerMoneyElement = document.getElementById("shop-player-money");

    // Fonction pour mettre à jour l'affichage de l'argent dans la modale
    const updateModalMoneyDisplay = (newMoney) => {
        shopPlayerMoneyElement.textContent = newMoney;
    };

    // Création des cartes d'articles
    SHOP_ITEMS.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.classList.add(
            "bg-gray-100", "p-4", "rounded-lg", "shadow-md", "flex", "flex-col", "items-center",
            "border", "border-gray-200", "hover:shadow-lg", "transition-all", "duration-200"
        );
        itemCard.innerHTML = `
            <img src="${item.icon}" alt="${item.name}" class="w-20 h-20 object-contain mb-2">
            <h3 class="text-lg font-bold text-gray-900 mb-1">${item.name}</h3>
            <p class="text-sm text-gray-600 text-center mb-2 flex-grow">${item.description}</p>
            <p class="text-md font-semibold text-yellow-700 mb-3">${item.cost} PokéDollars</p>
            <button class="buy-item-btn px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" data-item-id="${item.id}">Acheter</button>
        `;
        shopItemsContainer.appendChild(itemCard);

        const buyButton = itemCard.querySelector(".buy-item-btn");
        buyButton.addEventListener("click", () => {
            handlePurchase(item, playerMoney, updatePlayerMoney, showMessage, playerInventory, updateModalMoneyDisplay);
        });
    });

    // Afficher la modale avec une légère transition
    setTimeout(() => {
        modal.style.display = "flex";
        modal.classList.add("opacity-100");
    }, 50);

    // Gérer la fermeture de la modale
    document.getElementById("closeShopModalBtn").addEventListener("click", () => {
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0"); // Ajoute une transition de fondu
        setTimeout(() => modal.remove(), 300); // Supprime après la transition
    });
}

function handlePurchase(item, playerMoneyRef, updateMoneyDisplayRef, showMessageRef, currentInventoryRef, updateModalMoneyDisplayRef, saveGameRef) {
    // Tous les paramètres sont renommés avec 'Ref' pour s'assurer qu'on utilise bien les références passées
    // et éviter les conflits de noms avec des variables globales inexistantes dans shop.js.

    // console.log("handlePurchase - currentInventoryRef BEFORE:", currentInventoryRef); // Pour le débogage

    if (playerMoneyRef >= item.cost) {
        playerMoneyRef -= item.cost;

        // Mise à jour de l'inventaire référé (c'est l'objet global de main.js)
        if (currentInventoryRef[item.id]) { // <--- LIGNE CULPABLE PRÉSUMÉE : doit utiliser currentInventoryRef
            currentInventoryRef[item.id]++;
        } else {
            currentInventoryRef[item.id] = 1;
        }

        updateMoneyDisplayRef(playerMoneyRef); // Mise à jour de l'affichage global de l'argent dans main.js
        updateModalMoneyDisplayRef(playerMoneyRef); // Mise à jour de l'affichage de l'argent dans la modale
        showMessageRef(`Vous avez acheté "${item.name}" !`, "success");

        // Sauvegarde l'état du jeu après l'achat
        if (saveGameRef) {
            saveGameRef();
        }
        return true; // Indique que l'achat a réussi
    } else {
        showMessageRef("Vous n'avez pas assez d'argent !", "error");
        return false;
    }
}
