export async function fetchPoke() {
    const pokemonData = [];
    const minId = 1; // L'ID le plus bas des Pokémon que vous voulez (ex: Bulbizarre est ID 1)
    const maxId = 151; // L'ID le plus haut des Pokémon que vous voulez (ex: Mew est ID 151)

    const pokemonPromises = [];
    for (let i = minId; i <= maxId; i++) {
        pokemonPromises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${i}/`)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Failed to fetch Pokémon with ID ${i}. Status: ${response.status}`);
                        return null;
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error(`Error fetching Pokémon ID ${i}:`, error);
                    return null;
                })
        );
    }

    const fetchedResults = await Promise.all(pokemonPromises);

    const formattedData = fetchedResults
        .filter(data => data !== null)
        .map(data => ({
            id: data.id,
            name: data.name,
            sprite: data.sprites.front_default,
            cry: data.cries.latest
        }));

    return formattedData;
}