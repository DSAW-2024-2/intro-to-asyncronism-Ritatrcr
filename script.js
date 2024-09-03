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

function showModal(pokemon) {
    const types = pokemon.types.map(type => `<p class="modal-type ${type.type.name}">${type.type.name}</p>`).join('');
    const pokeId = pokemon.id.toString().padStart(3, '0');

    modalContent.innerHTML = `
        <h2>${pokemon.name} (#${pokeId})</h2>
        <div class="modal-image">
            <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
        </div>
        <div class="modal-info">
            <p>Height: ${pokemon.height / 10} m</p>
            <p>Weight: ${pokemon.weight / 10} kg</p>
            <p>Types: ${types}</p>
        </div>
    `;
    pokemonModal.style.display = "block";
}

function closeModalWindow() {
    pokemonModal.style.display = "none";
}

async function loadPokemons(type = "all", page = 1) {
    pokemonList.innerHTML = ''; 
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
        pokemonList.innerHTML = `<p>Pokémon not found.</p>`;
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
