
let carregando = false;

let primeiraCarta = null;
let bloqueado = false;
let jogadas = 0;
let paresEncontrados = 0;

let listaPokemons = null;
let TOTAL_PARES = 8;

const tabuleiro = document.getElementById('tabuleiro');
const placarJogadas = document.getElementById('jogadas');
const selecao = document.getElementById('selecao');
const placar = document.querySelector('.jogadas');

const botaoReiniciar = document.getElementById('reiniciar');
const botaoFacil = document.getElementById('facil');
const botaoMedio = document.getElementById('medio');
const botaoDificil = document.getElementById('dificil');

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

    const imagensValidas = imagens.filter(function (imagem) {
        return imagem !== null;
    });

    /*corrigir imagem não carregada*/ 
    while (imagensValidas.length < TOTAL_PARES) {
        const restantes = todos.filter(function (pokemon) {
            return !sorteados.some(function (sorteado) {
                return sorteado.name === pokemon.name;
            });
        });

        const pokemon = embaralharCarta([...restantes])[0];

        const resposta = await fetch(pokemon.url);

        if (!resposta.ok) {
            continue;
        }

        const dados = await resposta.json();
        const imagem = dados.sprites.front_default;

        if (imagem !== null) {
            imagensValidas.push(imagem);
            sorteados.push(pokemon);
        }
    }

    return imagensValidas;
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

        if (paresEncontrados === TOTAL_PARES) {
            setTimeout(function () {
                alert('Parabéns! Você encontrou todos os Pokémons!');
                aparecerBotoes();
            }, 500);
        }

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

    try {
        tabuleiro.innerHTML = '';
        resetarEstado();

        const imagens = await carregarPokemons();
        const cartas = embaralharCarta([...imagens, ...imagens]);

        cartas.forEach(function (imagem) {
            const carta = document.createElement('div');

            carta.classList.add('carta');
            carta.dataset.imagem = imagem;

            carta.innerHTML = `
                <div class="carta-oculta">?</div>
                <div class="carta-revelada">
                    <img src="${imagem}" alt="Pokémon">
                </div>
            `;

            carta.addEventListener('click', function () {
                virarCarta(carta);
            });

            tabuleiro.appendChild(carta);
        });

    } catch (erro) {
        console.error(erro);
        tabuleiro.textContent = 'Não foi possível carregar os Pokémons. Tente novamente.';
    } finally {
        carregando = false;
    }
}



function esconderBotoes() {
    botaoFacil.hidden = true;
    botaoMedio.hidden = true;
    botaoDificil.hidden = true;


    botaoReiniciar.hidden = false;
    placar.hidden = false;
    selecao.hidden = true;
}

function aparecerBotoes() {
    botaoFacil.hidden = false;
    botaoMedio.hidden = false;
    botaoDificil.hidden = false;

    botaoReiniciar.hidden = true;
    placar.hidden = true;
    selecao.hidden = false;

    placar

    tabuleiro.innerHTML = '';

    resetarEstado();
}



botaoReiniciar.addEventListener('click', aparecerBotoes);

botaoFacil.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 4);
    TOTAL_PARES = 8;

    esconderBotoes();
    iniciarJogo();
});

botaoMedio.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 6);
    TOTAL_PARES = 18;

    esconderBotoes();
    iniciarJogo();
});

botaoDificil.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 8);
    TOTAL_PARES = 32;

    esconderBotoes();
    iniciarJogo();
});


