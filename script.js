/**************************************************
 * VARIÁVEIS E STORAGE
 **************************************************/
const STORAGE = {
  FUNC: "escala_funcionarios",
  LOGO: "escala_logo",
  HIST: "escala_historico"
};

let funcionarios = JSON.parse(localStorage.getItem(STORAGE.FUNC) || "[]");
let historico = JSON.parse(localStorage.getItem(STORAGE.HIST) || "{}");
let ultimoResultado = null;

/**************************************************
 * TABS
 **************************************************/
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});

/**************************************************
 * RENDER LISTA DE FUNCIONÁRIOS
 **************************************************/
const listaFuncionariosEl = document.getElementById("lista-funcionarios");
const totalFuncionariosEl = document.getElementById("total-funcionarios");

function salvarFuncionarios() {
  localStorage.setItem(STORAGE.FUNC, JSON.stringify(funcionarios));
}

function renderFuncionarios() {
  listaFuncionariosEl.innerHTML = "";
  if (funcionarios.length === 0) {
    listaFuncionariosEl.innerHTML = "<li>Nenhum colaborador cadastrado.</li>";
    totalFuncionariosEl.textContent = "0";
    return;
  }

  funcionarios.sort((a, b) => a.localeCompare(b, "pt-BR"));

  funcionarios.forEach(nome => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <div class="list-item-main">${nome}</div>
      <button class="danger small">Remover</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      if (confirm(`Remover ${nome}?`)) {
        funcionarios = funcionarios.filter(f => f !== nome);
        salvarFuncionarios();
        renderFuncionarios();
        renderPresenca();
      }
    });

    listaFuncionariosEl.appendChild(li);
  });

  totalFuncionariosEl.textContent = funcionarios.length;
}

/**************************************************
 * ADICIONAR FUNCIONÁRIO
 **************************************************/
document.getElementById("form-add-funcionario").addEventListener("submit", e => {
  e.preventDefault();
  const inp = document.getElementById("nome-funcionario");
  const nome = inp.value.trim();
  if (!nome) return;
  
  funcionarios.push(nome);
  salvarFuncionarios();
  inp.value = "";
  renderFuncionarios();
  renderPresenca();
});

/**************************************************
 * PRESENÇA
 **************************************************/
const listaPresencaEl = document.getElementById("lista-presenca");
const totalPresentesEl = document.getElementById("total-presentes");

function renderPresenca() {
  listaPresencaEl.innerHTML = "";
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
  atualizarPresentes();
}

function atualizarPresentes() {
  const checked = listaPresencaEl.querySelectorAll("input:checked").length;
  totalPresentesEl.textContent = checked;
}

listaPresencaEl.addEventListener("change", atualizarPresentes);

/**************************************************
 * GERAR ESCALA
 **************************************************/
function gerarEscala() {
  const presentes = [...listaPresencaEl.querySelectorAll("input:checked")].map(c => c.dataset.nome);

  if (presentes.length === 0) return alert("Selecione pelo menos 1 pessoa.");

  const q1 = Number(document.getElementById("q1").value) || 0;
  const q2 = Number(document.getElementById("q2").value) || 0;

  const turma1 = presentes.slice(0, q1);
  const turma2 = presentes.slice(q1, q1 + q2);
  const resto = presentes.slice(q1 + q2);

  ultimoResultado = {
    data: document.getElementById("data-dia").value || new Date().toISOString().split("T")[0],
    almoco: { turma1, turma2 },
    lanche: [...resto],
    bar: resto.slice(0,2),
    aparadores: resto.slice(2,5)
  };

  renderPreview();
}

document.getElementById("btn-gerar-dia").addEventListener("click", gerarEscala);

/**************************************************
 * PREVIEW SAÍDA
 **************************************************/
const previewDiaEl = document.getElementById("preview-dia");

function renderPreview() {
  if (!ultimoResultado) return;

  previewDiaEl.classList.remove("empty");
  previewDiaEl.innerHTML = `
    <strong>Data:</strong> ${ultimoResultado.data}<br><br>

    🍽 <b>Almoço</b> <button class="edit-btn" data-edit="almoco">Editar</button><br>
    → 1ª Turma: ${ultimoResultado.almoco.turma1.join(", ") || "—"}<br>
    → 2ª Turma: ${ultimoResultado.almoco.turma2.join(", ") || "—"}<br><br>

    ☕ <b>Lanche</b> <button class="edit-btn" data-edit="lanche">Editar</button><br>
    → ${ultimoResultado.lanche.join(", ") || "—"}<br><br>

    🍹 <b>Bar</b> <button class="edit-btn" data-edit="bar">Editar</button><br>
    → ${ultimoResultado.bar.join(", ") || "—"}<br><br>

    🧺 <b>Aparadores</b> <button class="edit-btn" data-edit="aparadores">Editar</button><br>
    → ${ultimoResultado.aparadores.join(", ") || "—"}<br>
  `;

  document.getElementById("btn-imprimir-dia").disabled = false;
}

/**************************************************
 * MODAL DE EDIÇÃO
 **************************************************/
const modal = document.getElementById("edit-modal");
const modalList = document.getElementById("modal-list");
const modalTitle = document.getElementById("modal-title");

let campoEditando = null;

document.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    campoEditando = e.target.dataset.edit;
    abrirModal();
  }
});

function abrirModal() {
  modalList.innerHTML = "";
  modalTitle.textContent = `Editar ${campoEditando.toUpperCase()}`;

  const todos = [...listaPresencaEl.querySelectorAll("input")]
    .map(i => i.dataset.nome);

  const selecionados = [...ultimoResultado[campoEditando]];

  todos.forEach(nome => {
    const li = document.createElement("li");
    li.draggable = true;
    li.innerHTML = `
      <span style="display:flex;gap:10px;align-items:center">
        <input type="checkbox" ${selecionados.includes(nome) ? "checked" : ""}>
        ${nome}
      </span>
      ⠿
    `;

    li.querySelector("input").dataset.nome = nome;

    modalList.appendChild(li);
  });

  ativarDrag();
  modal.classList.remove("hidden");
}

modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden"); 
});

/**************************************************
 * DRAG & DROP
 **************************************************/
function ativarDrag() {
  let dragging = null;

  modalList.querySelectorAll("li").forEach(li => {
    li.addEventListener("dragstart", () => dragging = li);
    li.addEventListener("dragover", e => e.preventDefault());
    li.addEventListener("drop", () => {
      modalList.insertBefore(dragging, li);
    });
  });
}

/**************************************************
 * SALVAR MODAL
 **************************************************/
document.getElementById("save-modal").addEventListener("click", () => {
  const selecionados = [...modalList.querySelectorAll("input:checked")].map(i => i.dataset.nome);
  ultimoResultado[campoEditando] = selecionados;
  modal.classList.add("hidden");
  renderPreview();
});

/**************************************************
 * LOGO
 **************************************************/
const inputLogo = document.getElementById("input-logo");
const previewLogo = document.getElementById("logo-preview-container");

function renderLogo() {
  const logo = localStorage.getItem(STORAGE.LOGO);
  previewLogo.innerHTML = logo ? `<img src="${logo}">` : "Nenhuma logo ainda.";
}

inputLogo.addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = r => {
    localStorage.setItem(STORAGE.LOGO, r.target.result);
    renderLogo();
  };
  reader.readAsDataURL(e.target.files[0]);
});

document.getElementById("btn-remover-logo").addEventListener("click", () => {
  localStorage.removeItem(STORAGE.LOGO);
  renderLogo();
});

/**************************************************
 * IMPRESSÃO
 **************************************************/
document.getElementById("btn-imprimir-dia").addEventListener("click", () => {
  const logo = localStorage.getItem(STORAGE.LOGO);
  const printArea = document.getElementById("print-area");

  printArea.innerHTML = `
    ${logo ? `<img style="max-width:200px;margin-bottom:10px;" src="${logo}"><br>` : ""}
    ${previewDiaEl.innerHTML}
  `;

  window.print();
});

/**************************************************
 * INICIALIZAÇÃO
 **************************************************/
function init() {
  document.getElementById("data-dia").value = new Date().toISOString().split("T")[0];
  renderFuncionarios();
  renderPresenca();
  renderLogo();
}
document.addEventListener("DOMContentLoaded", init);
