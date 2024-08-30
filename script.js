

// Mapeo de colores pastel según el tipo de Pokémon
const typeColors = {
    normal: '#D3D3D3',
    fire: '#FFD1BA',
    water: '#B3D9FF',
    electric: '#FFFACD',
    grass: '#C1E1C1',
    ice: '#D0E8E8',
    fighting: '#E6A8A8',
    poison: '#E6CCE6',
    ground: '#EEDD82',
    flying: '#DDEDFB',
    psychic: '#FFB6C1',
    bug: '#D6E8D6',
    rock: '#E3E2C3',
    ghost: '#C6BBDA',
    dragon: '#C2C2FF',
    dark: '#A9A9A9',
    steel: '#D4D4D4',
    fairy: '#FADADD'
};

// Función para buscar un Pokémon específico
async function fetchPokemonData() {
    const input = document.getElementById('pokemonInput').value.toLowerCase();
    if (!input) return;  // No hacer nada si el input está vacío

    const pokemonCardsDiv = document.getElementById('pokemonCards');
    const currentPokemonDiv = document.getElementById('currentPokemon');

    try {
        // Llamada al primer endpoint: Obtener datos básicos del Pokémon
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
        if (!response.ok) {
            throw new Error('Pokémon not found');
        }
        const data = await response.json();

        // Llamada al segundo endpoint: Obtener especies para información adicional
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        // Llamada al tercer endpoint: Obtener la cadena evolutiva
        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();

        // Si ya hay un Pokémon en el área actual, moverlo a la lista de buscados
        if (currentPokemonDiv.innerHTML !== '') {
            const previousPokemonCard = document.createElement('div');
            previousPokemonCard.className = 'pokemon-card';
            previousPokemonCard.innerHTML = currentPokemonDiv.innerHTML;

            // Obtener el tipo del Pokémon que se está moviendo a la lista
            const previousPokemonType = currentPokemonDiv.getAttribute('data-pokemon-type');
            previousPokemonCard.style.backgroundColor = getTypeColor(previousPokemonType);

            // Insertar en la parte superior de la lista
            pokemonCardsDiv.insertBefore(previousPokemonCard, pokemonCardsDiv.firstChild);
        }

        // Mostrar el nuevo Pokémon buscado en el área especial
        currentPokemonDiv.innerHTML = `
            <img src="${data.sprites.front_default}" alt="${data.name}">
            <h2>${data.name}</h2>
            <p>Weight: ${data.weight} hectograms</p>
            <p>Base Experience: ${data.base_experience}</p>
            <p>Species: ${speciesData.name}</p>
            <p>Evolution Chain: ${getEvolutionChain(evolutionData.chain)}</p>
        `;
        const pokemonType = data.types[0].type.name;
        currentPokemonDiv.style.backgroundColor = getTypeColor(pokemonType);
        currentPokemonDiv.setAttribute('data-pokemon-type', pokemonType); // Guardar el tipo del Pokémon actual

    } catch (error) {
        showAlert(error.message);
    }
}

// Función para obtener un Pokémon aleatorio por nombre
async function fetchRandomPokemon() {
    try {
        // Obtener una lista de todos los Pokémon
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=898');
        const data = await response.json();
        const randomPokemon = data.results[Math.floor(Math.random() * data.results.length)];
        
        // Realizar la búsqueda por nombre
        const pokemonInput = document.getElementById('pokemonInput');
        pokemonInput.value = randomPokemon.name;
        fetchPokemonData();
    } catch (error) {
        showAlert('Failed to fetch a random Pokémon');
    }
}

// Función para recorrer la cadena evolutiva
function getEvolutionChain(chain) {
    let evolutionChain = chain.species.name;
    while (chain.evolves_to.length) {
        chain = chain.evolves_to[0];
        evolutionChain += ` -> ${chain.species.name}`;
    }
    return evolutionChain;
}

// Función para mostrar un aviso de error
function showAlert(message) {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.classList.add('show');
    setTimeout(() => {
        alertDiv.classList.remove('show');
    }, 3000);
}

// Función para obtener el color basado en el tipo de Pokémon
function getTypeColor(type) {
    return typeColors[type] || '#f9f9f9';  // Color por defecto si el tipo no está en la lista
}

// Función para limpiar la lista de Pokémon buscados
function clearPokemonList() {
    const pokemonCardsDiv = document.getElementById('pokemonCards');
    pokemonCardsDiv.innerHTML = '';  // Vaciar el contenedor de tarjetas
}


// Función para limpiar la lista de Pokémon buscados
function clearPokemonList() {
    const pokemonCardsDiv = document.getElementById('pokemonCards');
    pokemonCardsDiv.innerHTML = '';  // Vaciar el contenedor de tarjetas
}
