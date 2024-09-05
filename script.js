const pokemonList = document.querySelector("#listPokemon");
const headerButtons = document.querySelectorAll(".btn");

const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");

const searchInput = document.querySelector("#pokemon-search");
const searchBtn = document.querySelector("#search-btn");
const randomBtn = document.querySelector("#random-btn");
const pokemonModal = document.querySelector("#pokemon-modal");
const modalContent = document.querySelector("#modal-pokemon-details");
const closeModal = document.querySelector("#close-modal");

const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
const POKEMON_PER_PAGE = 21;
let currentPage = 1;
let currentType = "all";

async function fetchPokemon(id) {
    const response = await fetch(`${BASE_URL}${id}`);
    const data = await response.json();
    return data;
}

async function fetchPokemonsByType(type, offset = 0) {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    const data = await response.json();
    const pokemons = data.pokemon.slice(offset, offset + POKEMON_PER_PAGE);
    return Promise.all(pokemons.map(poke => fetchPokemon(poke.pokemon.name)));
}

async function fetchAllPokemons(offset = 0) {
    const allPokemons = [];
    for (let i = offset + 1; i <= offset + POKEMON_PER_PAGE; i++) {
        try {
            const pokemon = await fetchPokemon(i);
            allPokemons.push(pokemon);
        } catch (error) {
            break;
        }
    }
    return allPokemons;
}

async function getTotalPokemonCount() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
        const data = await response.json();
        return data.count; 
    } catch (error) {
        console.error('Error fetching Pokémon count:', error);
        return 20; 
    }
}

async function fetchRandomPokemon() {
    try {
        const totalPokemonCount = await getTotalPokemonCount();
        const randomId = Math.floor(Math.random() * totalPokemonCount) + 1; 
        return fetchPokemon(randomId);
    } catch (error) {
        console.error('Error fetching random Pokémon:', error);
    }
}


function displayPokemon(poke) {
    let types = poke.types.map(type => `<p class="${type.type.name} type">${type.type.name}</p>`).join('');
    let pokeId = poke.id.toString().padStart(3, '0');
    let primaryType = poke.types[0].type.name;

    const div = document.createElement("div");
    div.classList.add("pokemon");
    div.style.background = `linear-gradient(135deg, var(--type-${primaryType}) 5%, rgba(255, 255, 255, 0.1) 200%)`;
    div.dataset.pokemonId = poke.id;

    div.innerHTML = `
        <p class="pokemon-id-back">#${pokeId}</p>
        <div class="pokemon-image">
            <img src="${poke.sprites.other["official-artwork"].front_default}" alt="${poke.name}">
        </div>
        <div class="pokemon-info">
            <div class="name-container">
                <h2 class="pokemon-name">${poke.name}</h2>
            </div>
            <div class="pokemon-types">
                ${types}
            </div>
            <div class="pokemon-stats">
                <p class="stat">Height: ${poke.height/10}m</p>
                <p class="stat">Weight: ${poke.weight/10}kg</p>
            </div>
        </div>
    `;
    pokemonList.append(div);


    div.addEventListener("click", async () => {
        const pokemonDetails = await fetchPokemon(poke.id);
        showModal(pokemonDetails);
    });
}


async function showModal(pokemon) {
    const typeIcons = {
        fire: 'fa-fire',
        water: 'fa-tint',
        grass: 'fa-leaf',
        electric: 'fa-bolt',
        psychic: 'fa-brain',
        ice: 'fa-snowflake',
        dragon: 'fa-dragon',
        dark: 'fa-moon',
        fairy: 'fa-star',
        fighting: 'fa-fist-raised',
        flying: 'fa-plane',
        poison: 'fa-skull-crossbones',
        ground: 'fa-mountain',
        rock: 'fa-cave',
        bug: 'fa-bug',
        ghost: 'fa-ghost',
        steel: 'fa-tools',
        normal: 'fa-circle'
    };

    const types = pokemon.types.map(type => `
        <i class="fas ${typeIcons[type.type.name]} type-icon"></i>
    `).join('');
    const pokeId = pokemon.id.toString().padStart(3, '0');
    const primaryType = pokemon.types[0].type.name;

    // Cambiar color de fondo del modal según el tipo de Pokémon
    document.querySelector('.modal-content').style.background = `linear-gradient(180deg, var(--type-${primaryType}), rgba(0, 0, 0) 200%)`;

    // Obtener evoluciones
    const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;
    const evolutionResponse = await fetch(evolutionChainUrl);
    const evolutionData = await evolutionResponse.json();
    const evolutions = getEvolutions(evolutionData.chain);

    pokemonModal.style.display = 'flex';

    

    const evolutionHTML = evolutions.map((evo, index) => `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png" alt="${evo.name}">
        ${index < evolutions.length - 1 ? `<span class="evolution-arrow arrow-${primaryType}">»</span>` : ''}
    `).join('');

    // Mostrar stats con barras de porcentaje
    // pon el color del pokemon en las barras
    const statsHTML = pokemon.stats.map(stat => `
        <div class="stat-bar">
            <span class="${stat.stat.name.replace(' ', '-')} stat-value" style="width: ${stat.base_stat}%;">
                ${stat.stat.name}: ${stat.base_stat}%
            </span>
        </div>
    `).join('');

    modalContent.innerHTML = `
    <div class="modal-header"> 
        <div class="modal-info"> 
            <h2>${pokemon.name} (#${pokeId})</h2>
            <p>Height: ${pokemon.height / 10} m</p>
                <p>Weight: ${pokemon.weight / 10} kg</p>
                <p>Types: ${types}</p>
        </div>
        <div class="modal-image">
            <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
        </div>
    </div>
   
        <div>
            <div class="evolution-container">${evolutionHTML}</div>
            <div class="stats-container">${statsHTML}</div>
        </div>
   
    `;
    pokemonModal.style.display = "block";
}

// Obtener las evoluciones de forma recursiva
function getEvolutions(chain, evolutions = []) {
    evolutions.push({ id: extractIdFromUrl(chain.species.url), name: chain.species.name });
    if (chain.evolves_to.length > 0) {
        chain.evolves_to.forEach(evo => getEvolutions(evo, evolutions));
    }
    return evolutions;
}

// Extraer el ID de la URL de la especie
function extractIdFromUrl(url) {
    const idMatch = url.match(/\/(\d+)\/$/);
    return idMatch ? idMatch[1] : null;
}

function closeModalWindow() {
    pokemonModal.style.display = "none";
}

async function loadPokemons(type = "all", page = 1) {
    pokemonList.innerHTML = ''; 
    searchInput.value = ''; 
    currentPage = page;
    currentType = type;
    
    let offset = (page - 1) * POKEMON_PER_PAGE;
    let pokemons;

    if (type === "all") {
        pokemons = await fetchAllPokemons(offset);
    } else {
        pokemons = await fetchPokemonsByType(type, offset);
    }
    pokemons.forEach(displayPokemon);
}

async function searchPokemon(name) {
    pokemonList.innerHTML = ''; 
    try {
        const pokemon = await fetchPokemon(name.toLowerCase());
        displayPokemon(pokemon);
    } catch (error) {
        // Eliminar cualquier aviso previo
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
    
        // Crear y mostrar el nuevo aviso
        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = 'Pokémon not found.';
        document.body.appendChild(alert);
    
        // Opcional: Ocultar el aviso después de unos segundos
        setTimeout(() => {
            alert.remove();
        }, 2000); // El aviso se ocultará después de 3 segundos
    }
}

function setupButtons() {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            loadPokemons(currentType, currentPage - 1);
        }
    });

    nextBtn.addEventListener("click", async () => {
        const offset = currentPage * POKEMON_PER_PAGE;
        let hasMorePokemons = true;

        if (currentType === "all") {
            try {
                await fetchPokemon(offset + 1); 
            } catch {
                hasMorePokemons = false; 
            }
        } else {
            const pokemons = await fetchPokemonsByType(currentType, offset);
            hasMorePokemons = pokemons.length > 0;
        }
        
        if (hasMorePokemons) {
            loadPokemons(currentType, currentPage + 1);
        }
    });

    headerButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const type = e.target.id;
            
            if (type === "see-all") {
                loadPokemons("all");
            } else if (type) {
                loadPokemons(type);
            }
        });
    });

    searchBtn.addEventListener("click", () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchPokemon(searchTerm);
        }
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            searchBtn.click();
        }
    });

    randomBtn.addEventListener("click", async () => {
        const pokemon = await fetchRandomPokemon();
        pokemonList.innerHTML = ''; 
        displayPokemon(pokemon);
    });


    closeModal.addEventListener("click", closeModalWindow);
    window.addEventListener("click", (e) => {
        if (e.target === pokemonModal) {
            closeModalWindow();
        }
    });
}


setupButtons();
loadPokemons();
