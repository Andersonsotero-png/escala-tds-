// BANCO LOCAL
let clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

// CADASTRO
function cadastrar() {
    const nome = document.getElementById("nome").value;
    const idade = Number(document.getElementById("idade").value);
    const altura = Number(document.getElementById("altura").value);
    const podeSair = document.getElementById("podeSair").value;

    // REGRA DAS CORES
    let corPulseira = "amarelo"; // padrão: maior de 1 metro pode ficar sozinho

    if (podeSair === "sim") corPulseira = "verde";
    if (podeSair === "nao") corPulseira = "vermelho";
    if (altura >= 100 && podeSair === "nao") corPulseira = "amarelo";

    const cliente = {
        id: Date.now(),
        nome, idade, altura, podeSair, corPulseira
    };

    clientes.push(cliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));

    gerarQR(cliente.id);
    alert("Cadastro realizado!");
}

// BUSCA DE CLIENTES
function buscarCliente() {
    const termo = document.getElementById("busca").value.toLowerCase();
    const area = document.getElementById("resultadosBusca");
    area.innerHTML = "";

    clientes
        .filter(c => c.nome.toLowerCase().includes(termo))
        .forEach(c => {
            area.innerHTML += `<div class='item'>
                ${c.nome} — Pulseira: <b>${c.corPulseira}</b>
            </div>`;
        });
}

// GERAR QR
function gerarQR(id) {
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
        text: String(id),
        width: 150,
        height: 150
    });
}

// LEITOR DE QR CODE
async function abrirCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById("camera");
        video.srcObject = stream;

    } catch (e) {
        alert("Erro ao abrir a câmera. Ative HTTPS e permita acesso.");
    }
}

// IMPRIMIR PULSEIRA
function imprimirPulseira() {
    const conteudo = document.getElementById("qrcode").innerHTML;
    const janela = window.open("", "_blank");
    janela.document.write(`
        <html><body>
        <h2>Pulseira Terrasol</h2>
        ${conteudo}
        </body></html>
    `);
    janela.print();
}
