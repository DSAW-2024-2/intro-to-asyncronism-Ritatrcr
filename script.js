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

    // Actualizar el estado de los botones después de cargar los Pokémones
    await updateButtonStates();
}


function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
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
    

        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = 'Pokémon not found.';
        document.body.appendChild(alert);
    
     
        setTimeout(() => {
            alert.remove();
        }, 2000); 
    }
}


//Random 
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
    // Icons
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
        rock: 'fa-gem',
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

    document.querySelector('.modal-content').style.background = `linear-gradient(180deg, var(--type-${primaryType}), #000 200%)`;

    const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;
    const evolutionResponse = await fetch(evolutionChainUrl);
    const evolutionData = await evolutionResponse.json();
    
    const evolutions = await getEvolutions(evolutionData.chain);

    const evolutionHTML = evolutions.map((evo, index) => `
        <img src="${evo.image}" alt="${evo.name}">
        ${index < evolutions.length - 1 ? `<span class="evolution-arrow arrow-${primaryType}">»</span>` : ''}
    `).join('');

    const statsHTML = pokemon.stats.map(stat => `
        <div class="stat-bar">
            <span class="${stat.stat.name.replace(' ', '-')} stat-value" style="width: ${stat.base_stat}%; background-color: var(--type-${primaryType});">
                ${stat.stat.name}: ${stat.base_stat}
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
                <img id="pokemon-image" src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
            </div>
            <button id="toggle-shiny-btn" class="btn-shiny"><i class="fa-regular fa-star"></i></button>
        </div>
        
        <div class='modal-evolution-container'>
            <h3 class='modal-evolution'>Evolution Chain</h3>
        </div>
        <div class="evolution-container">${evolutionHTML}</div>
        <div class="stats-container">${statsHTML}</div>

        

    `;
    

    pokemonModal.style.display = "block";

    const toggleShinyBtn = document.querySelector("#toggle-shiny-btn");
    const pokemonImage = document.querySelector("#pokemon-image");
    
    const shinyIcon = '<i class="fa-regular fa-star"></i>'; 
    const normalIcon = '<i class="fa-solid fa-star"></i>'; 
    
    let isShiny = false; 
    

    toggleShinyBtn.addEventListener("click", () => {
        if (!isShiny) {
            pokemonImage.src = pokemon.sprites.other["official-artwork"].front_shiny;
            toggleShinyBtn.innerHTML = `${normalIcon}`;
        } else {
            pokemonImage.src = pokemon.sprites.other["official-artwork"].front_default;
            toggleShinyBtn.innerHTML = `${shinyIcon} `;
        }
        isShiny = !isShiny;
    });
    
}





async function getEvolutions(chain) {
    let evolutions = [];
    let currentStage = chain;

    while (currentStage) {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${currentStage.species.name}`);
        const pokemonData = await pokemonResponse.json();

        evolutions.push({
            id: pokemonData.id,
            name: pokemonData.name,
            image: pokemonData.sprites.other["official-artwork"].front_default
        });
        currentStage = currentStage.evolves_to.length ? currentStage.evolves_to[0] : null;
    }

    return evolutions;
}

function closeModalWindow() {
    pokemonModal.style.display = "none";
}

async function updateButtonStates() {
    const totalPokemons = await getTotalPokemonCount();


    if (currentPage === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }

    if (currentPage * POKEMON_PER_PAGE >= totalPokemons) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }

    if (totalPokemons <= POKEMON_PER_PAGE) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }
}



function setupButtons() {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            loadPokemons(currentType, currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            searchPokemon(searchTerm);
        }
    });



    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            searchBtn.click();
        }
    });

    randomBtn.addEventListener("click", async () => {
        const pokemon = await fetchRandomPokemon();
        pokemonList.innerHTML = ''; 
        searchInput.value = ''; 
        nextBtn.disabled = true;
        displayPokemon(pokemon);
    });


    closeModal.addEventListener("click", closeModalWindow);
    window.addEventListener("click", (e) => {
        if (e.target === pokemonModal) {
            closeModalWindow();
        }
    });
}



// Manejar el clic en el botón de toggle
document.querySelector('.nav-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('.nav-list').classList.toggle('active');
});

document.querySelectorAll('.nav-list .btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelector('.nav-toggle').classList.remove('active');
        document.querySelector('.nav-list').classList.remove('active');
    });
});







setupButtons();
loadPokemons();





