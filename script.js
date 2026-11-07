let carregando = false;

let primeiraCarta = null;
let bloqueado = false;
let jogadas = 0;
let paresEncontrados = 0;
let jogoFinalizado = false;

let listaPokemons = null;
let TOTAL_PARES = 8;

let inicioCronometro = null;
let tempoDecorrido = 0;
let intervaloCronometro = null;
let tempoLimite = 150000;

const tabuleiro = document.getElementById('tabuleiro');
const placarJogadas = document.getElementById('jogadas');
const placarTempo = document.getElementById('tempo');
const selecao = document.getElementById('selecao');
const placar = document.querySelector('.jogadas');

const botaoReiniciar = document.getElementById('reiniciar');
const botaoFacil = document.getElementById('facil');
const botaoMedio = document.getElementById('medio');
const botaoDificil = document.getElementById('dificil');
const botaoOk = document.getElementById('ok');
const botaoTentarNovamente = document.getElementById('tentar-novamente');

const modal = document.getElementById('sucesso');
const modalTempo = document.getElementById('tempo-esgotado');

function soltarConfete() {
    const duracao = 2000;
    const fim = Date.now() + duracao;

    (function frame() {
        /*canto esquerdo*/
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
            zIndex: 2000
        });

        /*canto direito*/
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
            zIndex: 2000
        });

        if (Date.now() < fim) {
            requestAnimationFrame(frame);
        }
    })();
}

async function obterListaPokemons() {
    if (listaPokemons) return listaPokemons;

    const resposta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000');

    const dados = await resposta.json();
    listaPokemons = dados.results;

    return listaPokemons;
}

async function carregarPokemons() {
    const todos = await obterListaPokemons();
    const sorteados = embaralharCarta([...todos]);

    const imagens = [];
    let indice = 0;

    while (imagens.length < TOTAL_PARES && indice < sorteados.length) {
        const lote = sorteados.slice(indice, indice + 16);
        indice += 16;

        const resultados = await Promise.all(
            lote.map(async function (pokemon) {
                try {
                    const resposta = await fetch(pokemon.url);

                    if (!resposta.ok) return null;

                    const dados = await resposta.json();
                    const imagem = dados.sprites.front_default;

                    if (imagem && await verificarImagem(imagem)) {
                        return imagem;
                    }

                    return null;
                }
                catch {
                    return null;
                }
            })
        );

        imagens.push(
            ...resultados
                .filter(imagem => imagem !== null)
                .slice(0, TOTAL_PARES - imagens.length)
        );
    }

    return imagens;
}

function verificarImagem(url) {
    return new Promise(function (resolve) {
        const img = new Image();

        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        img.src = url;
    });
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

function atualizarCronometro() {
    let tempo = tempoDecorrido;

    if (inicioCronometro !== null) {
        tempo += performance.now() - inicioCronometro;
    }

    let restante = Math.max(0, tempoLimite - tempo);

    let segundosTotais = Math.ceil(restante / 1000);
    let minutos = Math.floor(segundosTotais / 60);
    let segundos = segundosTotais % 60;

    placarTempo.textContent =
        String(minutos).padStart(2, '0') + ':' +
        String(segundos).padStart(2, '0');

    if (restante <= 30000) {
        placarTempo.classList.add('tempo-alerta');
    }
    else {
        placarTempo.classList.remove('tempo-alerta');
    }

    if (restante === 0 && inicioCronometro !== null) {
        finalizarPorTempo();
    }
}

function iniciarCronometro() {
    if (intervaloCronometro !== null) return;

    inicioCronometro = performance.now();

    atualizarCronometro();

    intervaloCronometro = setInterval(atualizarCronometro, 1000);
}

function pausarCronometro() {
    if (intervaloCronometro === null) return;

    tempoDecorrido += performance.now() - inicioCronometro;

    inicioCronometro = null;

    clearInterval(intervaloCronometro);
    intervaloCronometro = null;

    atualizarCronometro();
}

function zerarCronometro() {
    clearInterval(intervaloCronometro);

    intervaloCronometro = null;
    inicioCronometro = null;
    tempoDecorrido = 0;

    placarTempo.classList.remove('tempo-alerta');

    atualizarCronometro();
}

function finalizarPorTempo() {
    if (jogoFinalizado) return;

    jogoFinalizado = true;

    pausarCronometro();

    modalTempo.showModal();
}

function resetarEstado() {
    primeiraCarta = null;
    bloqueado = false;
    jogadas = 0;
    paresEncontrados = 0;
    jogoFinalizado = false;

    atualizarPlacar();
    zerarCronometro();
}

function virarCarta(carta) {
    if (bloqueado) return;
    if (jogoFinalizado) return;
    if (carta.classList.contains('virada')) return;
    if (carta.classList.contains('combinada')) return;

    if (primeiraCarta === null && paresEncontrados === 0 && jogadas === 0) {
        iniciarCronometro();
    }

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
            jogoFinalizado = true;
            pausarCronometro();

            setTimeout(function () {
                modal.showModal();
                soltarConfete();
            }, 700);
        }
    }
    else {
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

        carta.innerHTML = `
            <div class="carta-oculta">?</div>
            <div class="carta-revelada">
                <img src="${imagem}" alt="PokÃ©mon">
            </div>
        `;

        carta.addEventListener('click', function () {
            virarCarta(carta);
        });

        tabuleiro.appendChild(carta);
    });

    carregando = false;
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

    tabuleiro.innerHTML = '';

    resetarEstado();
}

botaoReiniciar.addEventListener('click', aparecerBotoes);

botaoFacil.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 4);
    TOTAL_PARES = 8;
    tempoLimite = 150000;

    esconderBotoes();
    iniciarJogo();
});

botaoMedio.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 6);
    TOTAL_PARES = 18;
    tempoLimite = 240000;

    esconderBotoes();
    iniciarJogo();
});

botaoDificil.addEventListener('click', function () {
    tabuleiro.style.setProperty('--colunas', 8);
    TOTAL_PARES = 32;
    tempoLimite = 480000;

    esconderBotoes();
    iniciarJogo();
});

botaoOk.addEventListener('click', function () {
    modal.close();
    aparecerBotoes();
});

botaoTentarNovamente.addEventListener('click', function () {
    modalTempo.close();
    aparecerBotoes();
});