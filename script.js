const TOTAL_PARES = 8;

let carregando = false;

let primeiraCarta = null;
let bloqueado = false;
let jogadas = 0;
let paresEncontrados = 0;

let listaPokemons = null;

async function obterListaPokemons() {
    if (listaPokemons) return listaPokemons;
    
    const resposta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000');
    if (!resposta.ok) {
        throw new Error('Erro ao buscar a lista de pokemons');
    }
    const dados = await resposta.json();
    listaPokemons = dados.results;
    return listaPokemons;
}

async function carregarPokemons() {
    const todos = await obterListaPokemons();
    const sorteados = embaralharCarta([...todos]).slice(0, TOTAL_PARES);
    
    const imagens = await Promise.all(
        sorteados.map(async function (pokemon) {
            const resposta = await fetch(pokemon.url);
            if (!resposta.ok) {
                throw new Error(`Erro ao buscar ${pokemon.name}`);
            }
            const dados = await resposta.json();
            return dados.sprites.front_default;
        })
    );
    return imagens;
}

function embaralharCarta(lst) {
    for (let i = lst.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [lst[i], lst[k]] = [lst[k], lst[i]];
    }
    return lst;
}

function atualizarPlacar() {
    placarJogadas.textContent = jogadas;
}

function resetarEstado() {
    primeiraCarta = null;
    bloqueado = false;
    jogadas = 0;
    paresEncontrados = 0;
    atualizarPlacar();
}

function virarCarta(carta) {
    if (bloqueado) return;
    if (carta.classList.contains('virada')) return;
    if (carta.classList.contains('combinada')) return;
    
    carta.classList.add('virada');
    
    if (primeiraCarta === null) {
        primeiraCarta = carta;
        return;
    }
    
    const segundaCarta = carta;
    jogadas++;
    atualizarPlacar();
    
    if (primeiraCarta.dataset.imagem === segundaCarta.dataset.imagem) {
        primeiraCarta.classList.add('combinada');
        segundaCarta.classList.add('combinada');
        primeiraCarta = null;
        paresEncontrados++;
        
    } else {
        bloqueado = true;
        const a = primeiraCarta;
        const b = segundaCarta;
        primeiraCarta = null;
        
        setTimeout(function () {
            a.classList.remove('virada');
            b.classList.remove('virada');
            bloqueado = false;
        }, 1000);
    }
}

async function iniciarJogo() {
    if (carregando) return;
    carregando = true;

    tabuleiro.innerHTML = '';
    resetarEstado();

    const imagens = await carregarPokemons();
    const cartas = embaralharCarta([...imagens, ...imagens]);

    cartas.forEach(function (imagem) {
        const carta = document.createElement('div');
        carta.classList.add('carta');
        carta.dataset.imagem = imagem;

        carta.innerHTML = `<div class="carta-oculta">?</div>
            <div class="carta-revelada"><img src="${imagem}" alt="Pokémon"></div>`;
                
        carta.addEventListener('click', function () {
            virarCarta(carta);
        });
            
        tabuleiro.appendChild(carta);
    });
    carregando = false;
}

botaoIniciar.addEventListener('click', function () {
    botaoIniciar.style.display = 'none';
    botaoReiniciar.style.display = 'block';
    iniciarJogo();
});

const tabuleiro = document.getElementById('tabuleiro');
const botaoIniciar = document.getElementById('iniciar');
const botaoReiniciar = document.getElementById('reiniciar');
const placarJogadas = document.getElementById('jogadas');
botaoReiniciar.addEventListener('click', iniciarJogo);
