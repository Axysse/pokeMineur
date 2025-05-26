export async function fetchPoke() {
    let allPokemonData = []

try {
        // Première requête pour obtenir la liste des Pokémon (limite à 150)
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=150');
        if (!response.ok) {
            // Gère les erreurs HTTP pour la requête initiale
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }
        const results = await response.json();
        const pokemonList = results.results; // Tableau d'objets {name: "...", url: "..."}

        // Utilise Promise.all pour lancer toutes les requêtes détaillées en parallèle
        // et attendre que toutes soient terminées.
        const detailedPokemonData = await Promise.all(pokemonList.map(async (pokemon) => {
            // Requête détaillée pour chaque Pokémon
            const pokeResponse = await fetch(pokemon.url);
            if (!pokeResponse.ok) {
                // Gère les erreurs HTTP pour les requêtes détaillées
                throw new Error(`Erreur HTTP ! statut : ${pokeResponse.status} pour ${pokemon.name}`);
            }
            const pokemonDetails = await pokeResponse.json();

            // Retourne un objet avec les informations pertinentes pour chaque Pokémon
            return {
                name: pokemonDetails.name,
                sprite: pokemonDetails.sprites.front_default, // URL du sprite frontal par défaut
                // URL du cri : Notez que l'API PokeAPI ne fournit pas directement les cris.
                // Cette URL est une source communautaire courante.
                cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonDetails.id}.ogg`
            };
        }));
        // Retourne le tableau complet des données détaillées des Pokémon
        return detailedPokemonData;
    } catch (error) {
        // Capture et logue toute erreur survenue pendant le processus de récupération
        console.error("Erreur lors de la récupération des données Pokémon :", error);
        return []; // Retourne un tableau vide pour éviter que le programme ne plante
    }
}