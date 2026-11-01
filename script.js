const tabuleiro = document.getElementById('tabuleiro');

function sortearPokemons(quantidade){
    const ids = [];
    while (ids.length < quantidade){
        const id = Math.floor(Math.random() * 151) + 1;
        if (!ids.includes(id)){
            ids.push(id);
        }
    }
    return ids;
}

async function carregarPokemons() {
    const ids = sortearPokemons(8);
    const imagens = [];

    for (const id of ids) {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const dados = await resposta.json();
        imagens.push(dados.sprites.front_default);
    }
    return imagens;
}

function embaralharCarta(lst){
    for (let i = lst.length - 1; i > 0; i--){
        const k = Math.floor(Math.random() * (i + 1));
        [lst[i], lst[k]] = [lst[k], lst[i]];
    }
    return lst;
}

async function iniciarJogo() {
    tabuleiro.innerHTML = '';
    const imagens = await carregarPokemons();
    /*duplica e embaralha as cartinhas*/
    const cartas = embaralharCarta([...imagens, ...imagens]);

    cartas.forEach(function (imagem) {
        const carta = document.createElement('div');
        carta.classList.add('carta');

        /*cria as cartas pokemon*/
        carta.innerHTML = `
            <div class="carta-oculta">?</div>
            <div class="carta-revelada"><img src="${imagem}" alt="Pokémon"></div>
        `;

        /*acao de virar a carta*/
        carta.addEventListener('click', function () {
            carta.classList.toggle('virada');
        });

        tabuleiro.appendChild(carta);
    });
}



const botaoIniciar = document.getElementById('iniciar')
botaoIniciar.addEventListener('click', function () {
    botaoIniciar.style.display = 'none';       
    botaoReiniciar.style.display = 'block';     /* habilita o reiniciar*/
    iniciarJogo();
});
const botaoReiniciar = document.getElementById('reiniciar')
botaoReiniciar.addEventListener('click',iniciarJogo)