// ========= STORAGE =========
const STORAGE = {
  FUNC: "tds_funcionarios",
  LOGO: "tds_logo",
  HIST: "tds_historico",
  FUNCOES: "tds_funcoes_personalizadas"
};

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

// ========= DADOS EM MEMÓRIA =========
let funcionarios = load(STORAGE.FUNC, []);
let funcoesPersonalizadas = load(STORAGE.FUNCOES, {});
let ultimoDia = null;


// ========= FUNÇÕES UI =========

// tabs
document.querySelectorAll(".tab-button").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(bt => bt.classList.remove("active"));
    b.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(b.dataset.target).classList.add("active");
  });
});


// ========= CADASTRO =========
const listaEquipe = document.getElementById("lista-funcionarios");
const totalEquipe = document.getElementById("total-funcionarios");

function renderEquipe() {
  listaEquipe.innerHTML = "";

  if (funcionarios.length === 0) {
    listaEquipe.innerHTML = "<li>Nenhum colaborador cadastrado.</li>";
    totalEquipe.textContent = 0;
    return;
  }

  funcionarios.sort((a, b) => a.localeCompare(b)).forEach(nome => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main"><span class="nome">${nome}</span></div>
      <div class="list-item-actions">
        <button class="danger small">Excluir</button>
      </div>
    `;
    li.querySelector("button").onclick = () => {
      if(confirm(`Excluir ${nome}?`)) {
        funcionarios = funcionarios.filter(f => f !== nome);
        save(STORAGE.FUNC, funcionarios);
        renderEquipe();
        renderPresenca();
      }
    };
    listaEquipe.appendChild(li);
  });

  totalEquipe.textContent = funcionarios.length;
}

document.getElementById("form-add-funcionario").addEventListener("submit", e => {
  e.preventDefault();
  const nome = document.getElementById("nome-funcionario").value.trim();
  if (!nome) return;
  funcionarios.push(nome);
  save(STORAGE.FUNC, funcionarios);
  document.getElementById("nome-funcionario").value = "";
  renderEquipe();
  renderPresenca();
});


// ========= LISTA DE PRESENÇA =========

const listaPresenca = document.getElementById("lista-presenca");
const totalPresenca = document.getElementById("total-presentes");

function renderPresenca() {
  listaPresenca.innerHTML = "";

  funcionarios.sort((a,b)=>a.localeCompare(b)).forEach(nome => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main">
        <input type="checkbox" class="chk-presenca" value="${nome}">
        <span>${nome}</span>
      </div>
    `;
    listaPresenca.appendChild(li);
  });

  atualizarPresenca();
}

function atualizarPresenca() {
  const qtd = [...document.querySelectorAll(".chk-presenca:checked")].length;
  totalPresenca.textContent = qtd;
}

listaPresenca.addEventListener("change", atualizarPresenca);


// ========= GERAR ESCALA =========

function gerarEscala() {
  const presentes = [...document.querySelectorAll(".chk-presenca:checked")].map(c => c.value);
  const data = document.getElementById("data-dia").value;

  if (presentes.length === 0) {
    alert("Selecione colaboradores antes de gerar a escala.");
    return;
  }

  // Salva escolhas personalizadas do dia
  funcoesPersonalizadas[data] = {
    almoco1: document.getElementById("quant-t1").value,
    almoco2: document.getElementById("quant-t2").value,
    setor1: document.getElementById("setor1").value,
    setor2: document.getElementById("setor2").value,
    setor3: document.getElementById("setor3").value,
    bar1: document.getElementById("bar1").value,
    bar2: document.getElementById("bar2").value,
  };

  save(STORAGE.FUNCOES, funcoesPersonalizadas);

  renderPreview(data, presentes);
}

document.getElementById("btn-gerar-dia").onclick = gerarEscala;


// ========= PREVIEW IMPRESSÃO =========

const preview = document.getElementById("preview-dia");
const printArea = document.getElementById("print-area");

function renderPreview(data, presentes) {
  const cfg = funcoesPersonalizadas[data];
  preview.innerHTML = `
    <div class="escala-documento">
      <header class="escala-header">
        <img src="${load(STORAGE.LOGO, '')}" style="max-width:150px">
        <h1>Escala Terra do Sol</h1>
        <p>${data}</p>
      </header>

      <table class="escala-table">
        <tr><th>Almoço - 1ª Turma</th><td>${cfg.almoco1 || "—"}</td></tr>
        <tr><th>Almoço - 2ª Turma</th><td>${cfg.almoco2 || "—"}</td></tr>
        <tr><th>Setor 1</th><td>${cfg.setor1 || "—"}</td></tr>
        <tr><th>Setor 2</th><td>${cfg.setor2 || "—"}</td></tr>
        <tr><th>Setor 3</th><td>${cfg.setor3 || "—"}</td></tr>
        <tr><th>Bar 1</th><td>${cfg.bar1 || "—"}</td></tr>
        <tr><th>Bar 2</th><td>${cfg.bar2 || "—"}</td></tr>
      </table>
    </div>
  `;
}

document.getElementById("btn-imprimir-dia").onclick = () => {
  printArea.innerHTML = preview.innerHTML;
  window.print();
};


// ========= INICIALIZAÇÃO =========
function start() {
  document.getElementById("data-dia").value = new Date().toISOString().slice(0,10);
  renderEquipe();
  renderPresenca();
}

document.addEventListener("DOMContentLoaded", start);
