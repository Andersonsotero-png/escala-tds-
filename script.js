// --------------------- STORAGE KEYS ---------------------
const STORAGE_KEYS = {
  FUNCIONARIOS: "tds_funcionarios",
  LOGO: "tds_logo",
  HISTORICO: "tds_historico",
};

// --------------------- ESTADO ---------------------
let funcionarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.FUNCIONARIOS) || "[]");
let escalaAtual = null;
let editContext = null;

// --------------------- FUNÇÕES BASE ---------------------
function salvarFuncionarios() {
  localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(funcionarios));
}

function salvarLogo(data) {
  if (data) localStorage.setItem(STORAGE_KEYS.LOGO, data);
  else localStorage.removeItem(STORAGE_KEYS.LOGO);
}

function loadLogo() {
  return localStorage.getItem(STORAGE_KEYS.LOGO);
}

function salvarHistorico(dataISO, escala) {
  const hist = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORICO) || "{}");
  hist[dataISO] = escala;
  localStorage.setItem(STORAGE_KEYS.HISTORICO, JSON.stringify(hist));
}

function carregarHistorico() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORICO) || "{}");
}

// --------------------- TABS ---------------------
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.target;
    document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

// --------------------- LISTA DE FUNCIONÁRIOS ---------------------
const listaFuncionariosEl = document.getElementById("lista-funcionarios");
const totalFuncionariosEl = document.getElementById("total-funcionarios");
const inputNomeFuncionario = document.getElementById("nome-funcionario");

document.getElementById("form-add-funcionario").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = inputNomeFuncionario.value.trim();
  if (!nome) return;
  funcionarios.push({ id: Date.now(), nome });
  salvarFuncionarios();
  inputNomeFuncionario.value = "";
  renderFuncionarios();
  renderPresenca();
});

function removerFuncionario(id) {
  funcionarios = funcionarios.filter(f => f.id !== id);
  salvarFuncionarios();
  renderFuncionarios();
  renderPresenca();
}

function renderFuncionarios() {
  listaFuncionariosEl.innerHTML = "";
  funcionarios.sort((a, b) => a.nome.localeCompare(b.nome));
  funcionarios.forEach(f => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main"><span>${f.nome}</span></div>
      <button class="danger small">Remover</button>
    `;
    li.querySelector("button").addEventListener("click", () => removerFuncionario(f.id));
    listaFuncionariosEl.appendChild(li);
  });
  totalFuncionariosEl.textContent = funcionarios.length;
}

// --------------------- PRESENÇA ---------------------
const listaPresencaEl = document.getElementById("lista-presenca");
const totalPresentesEl = document.getElementById("total-presentes");

function renderPresenca() {
  listaPresencaEl.innerHTML = "";
  funcionarios.forEach(f => {
    const row = document.createElement("li");
    row.className = "list-item-row";
    row.innerHTML = `
      <label class="list-item-main">
        <input type="checkbox" data-id="${f.id}">
        <span>${f.nome}</span>
      </label>
    `;
    listaPresencaEl.appendChild(row);
  });
  atualizarContagemPresenca();
}

function getPresentes() {
  return [...listaPresencaEl.querySelectorAll("input:checked")]
    .map(c => funcionarios.find(f => f.id == c.dataset.id));
}

function atualizarContagemPresenca() {
  totalPresentesEl.textContent = getPresentes().length;
}

listaPresencaEl.addEventListener("change", atualizarContagemPresenca);

// --------------------- GERAR ESCALA ---------------------
document.getElementById("btn-gerar-dia").addEventListener("click", () => {
  const presentes = getPresentes();
  if (presentes.length < 5) {
    if (!confirm("Poucas pessoas marcadas. Continuar?")) return;
  }

  const q1 = Number(document.getElementById("q1").value);
  const q2 = Number(document.getElementById("q2").value);

  const sorteio = [...presentes].sort(() => Math.random() - 0.5);

  escalaAtual = {
    data: document.getElementById("data-dia").value || new Date().toISOString().slice(0, 10),
    logo: loadLogo(),
    bar: sorteio.splice(0, 2),
    aparadores: sorteio.splice(0, 3),
    almoco1: sorteio.splice(0, q1),
    almoco2: sorteio.splice(0, q2),
    lanche: sorteio
  };

  renderPreview();
});

// --------------------- PREVIEW ---------------------
function renderPreview() {
  const area = document.getElementById("preview-dia");
  area.innerHTML = "";

  const logoHTML = escalaAtual.logo ? `<img src="${escalaAtual.logo}" style="max-width:180px; margin-bottom:10px;">` : "";

  area.innerHTML = `
    ${logoHTML}
    <strong>Data:</strong> ${escalaAtual.data}<br><br>

    <strong>🍽 Almoço</strong><br>
    1ª Turma: ${escalaAtual.almoco1.map(p => p.nome).join(", ") || "—"}<br>
    2ª Turma: ${escalaAtual.almoco2.map(p => p.nome).join(", ") || "—"}<br><br>

    <strong>☕ Lanche</strong><br>
    ${escalaAtual.lanche.map(p => p.nome).join(", ") || "—"}<br><br>

    <strong>🍹 Bar</strong><br>
    ${escalaAtual.bar.map(p => p.nome).join(", ") || "—"}<br><br>

    <strong>🧯 Aparadores</strong><br>
    ${escalaAtual.aparadores.map(p => p.nome).join(", ") || "—"}
  `;

  document.getElementById("btn-imprimir-dia").disabled = false;
}

// --------------------- IMPRESSÃO ---------------------
document.getElementById("btn-imprimir-dia").addEventListener("click", () => {
  const printArea = document.getElementById("print-area");
  printArea.innerHTML = document.getElementById("preview-dia").innerHTML;
  window.print();
});

// --------------------- LOGO ---------------------
document.getElementById("input-logo").addEventListener("change", function() {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    salvarLogo(e.target.result);
    renderLogoPreview();
  };
  reader.readAsDataURL(file);
});

document.getElementById("btn-remover-logo").addEventListener("click", () => {
  salvarLogo(null);
  renderLogoPreview();
});

function renderLogoPreview() {
  const data = loadLogo();
  const el = document.getElementById("logo-preview-container");
  if (!data) el.innerHTML = "Nenhuma logo.";
  else el.innerHTML = `<img src="${data}" style="max-width:200px;">`;
}

// ---------------- INIT ----------------
function init() {
  document.getElementById("data-dia").value = new Date().toISOString().slice(0,10);
  renderFuncionarios();
  renderPresenca();
  renderLogoPreview();
}
init();
