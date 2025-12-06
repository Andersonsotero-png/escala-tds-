/************************************
 * SISTEMA DE ABAS
 ************************************/
function configurarAbas() {
  const botoes = document.querySelectorAll(".tab-button");
  const secoes = document.querySelectorAll(".tab-section");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      botoes.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");
      secoes.forEach(sec => sec.classList.remove("active"));
      document.getElementById(botao.dataset.target).classList.add("active");
    });
  });
}

/************************************
 * LOCAL STORAGE KEYS
 ************************************/
const STORAGE = {
  FUNC: "escala_funcionarios",
  LOGO: "escala_logo",
  HIST: "escala_historico"
};

/************************************
 * ESTADO
 ************************************/
let funcionarios = JSON.parse(localStorage.getItem(STORAGE.FUNC) || "[]");
let ultimoDia = null;

/************************************
 * RENDER DE LISTAS
 ************************************/
const listaFuncionariosEl = document.getElementById("lista-funcionarios");
const totalFuncionariosEl = document.getElementById("total-funcionarios");

function renderFuncionarios() {
  listaFuncionariosEl.innerHTML = "";

  if (funcionarios.length === 0) {
    listaFuncionariosEl.innerHTML = "<li>Nenhum cadastrado</li>";
    totalFuncionariosEl.textContent = "0";
    return;
  }

  funcionarios.sort((a, b) => a.localeCompare(b, "pt-BR"));

  funcionarios.forEach(nome => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main">
        <span>${nome}</span>
      </div>
      <button class="danger small remover">Excluir</button>
    `;
    li.querySelector(".remover").addEventListener("click", () => removerFuncionario(nome));
    listaFuncionariosEl.appendChild(li);
  });

  totalFuncionariosEl.textContent = funcionarios.length;
}

function removerFuncionario(nome) {
  if (confirm(`Remover ${nome}?`)) {
    funcionarios = funcionarios.filter(n => n !== nome);
    localStorage.setItem(STORAGE.FUNC, JSON.stringify(funcionarios));
    renderFuncionarios();
    renderPresenca();
  }
}

/************************************
 * ADICIONAR FUNCIONÁRIO
 ************************************/
document.getElementById("form-add-funcionario").addEventListener("submit", e => {
  e.preventDefault();
  const nome = document.getElementById("nome-funcionario").value.trim();
  if (!nome) return;

  funcionarios.push(nome);
  localStorage.setItem(STORAGE.FUNC, JSON.stringify(funcionarios));

  document.getElementById("nome-funcionario").value = "";
  renderFuncionarios();
  renderPresenca();
});

/************************************
 * PRESENÇA
 ************************************/
const listaPresencaEl = document.getElementById("lista-presenca");
const totalPresentesEl = document.getElementById("total-presentes");

function renderPresenca() {
  listaPresencaEl.innerHTML = "";

  funcionarios.sort((a, b) => a.localeCompare(b, "pt-BR"));

  funcionarios.forEach(nome => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main">
        <input type="checkbox" data-nome="${nome}">
        <span>${nome}</span>
      </div>
    `;
    listaPresencaEl.appendChild(li);
  });

  atualizarTotalPresentes();
}

function atualizarTotalPresentes() {
  const checks = listaPresencaEl.querySelectorAll("input[type='checkbox']");
  totalPresentesEl.textContent = [...checks].filter(c => c.checked).length;
}

listaPresencaEl.addEventListener("change", atualizarTotalPresentes);

/************************************
 * GERAR ESCALA
 ************************************/
const previewDiaEl = document.getElementById("preview-dia");
const printArea = document.getElementById("print-area");

function gerarEscala() {
  const checkboxes = listaPresencaEl.querySelectorAll("input:checked");
  const presentes = [...checkboxes].map(c => c.dataset.nome);

  if (presentes.length === 0) {
    alert("Selecione os presentes.");
    return;
  }

  const q1 = Number(document.getElementById("q1").value) || 0;
  const q2 = Number(document.getElementById("q2").value) || 0;

  const turma1 = presentes.slice(0, q1);
  const turma2 = presentes.slice(q1, q1 + q2);
  const resto = presentes.slice(q1 + q2);

  ultimoDia = { turma1, turma2, resto, data: document.getElementById("data-dia").value };

  renderPreview();
}

/************************************
 * PREVIEW E IMPRESSÃO
 ************************************/
function renderPreview() {
  previewDiaEl.innerHTML = `
    <h3>🍽 Almoço</h3>
    <p><strong>1ª Turma:</strong> ${ultimoDia.turma1.join(", ") || "—"}</p>
    <p><strong>2ª Turma:</strong> ${ultimoDia.turma2.join(", ") || "—"}</p>
    <h3>Outros Setores</h3>
    <p>${ultimoDia.resto.join(", ") || "—"}</p>
  `;

  previewDiaEl.classList.remove("empty");
  document.getElementById("btn-imprimir-dia").disabled = false;
}

document.getElementById("btn-gerar-dia").addEventListener("click", gerarEscala);

document.getElementById("btn-imprimir-dia").addEventListener("click", () => {
  printArea.innerHTML = previewDiaEl.innerHTML;
  window.print();
});

/************************************
 * LOGO
 ************************************/
const inputLogo = document.getElementById("input-logo");
const logoPreview = document.getElementById("logo-preview-container");

function renderLogo() {
  const logo = localStorage.getItem(STORAGE.LOGO);
  logoPreview.innerHTML = logo ? `<img src="${logo}">` : `<p>Nenhuma logo selecionada.</p>`;
}

inputLogo.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = data => {
    localStorage.setItem(STORAGE.LOGO, data.target.result);
    renderLogo();
  };
  reader.readAsDataURL(file);
});

document.getElementById("btn-remover-logo").addEventListener("click", () => {
  localStorage.removeItem(STORAGE.LOGO);
  renderLogo();
});

/************************************
 * INICIALIZAÇÃO
 ************************************/
function init() {
  configurarAbas();
  renderFuncionarios();
  renderPresenca();
  renderLogo();
}

document.addEventListener("DOMContentLoaded", init);
