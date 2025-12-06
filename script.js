// ========= UTILIDADES =========
function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
const diasSemana = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
function weekdayName(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return diasSemana[new Date(y, m - 1, d).getDay()];
}

// ========= LOCALSTORAGE =========
const STORAGE_KEYS = {
  FUNC: "tds_funcionarios",
  LOGO: "tds_logo",
  HIST: "tds_historico"
};

function loadFuncionarios() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FUNC) || "[]");
}
function saveFuncionarios(list) {
  localStorage.setItem(STORAGE_KEYS.FUNC, JSON.stringify(list));
}

function loadLogo() {
  return localStorage.getItem(STORAGE_KEYS.LOGO);
}
function saveLogo(data) {
  if (data) localStorage.setItem(STORAGE_KEYS.LOGO, data);
  else localStorage.removeItem(STORAGE_KEYS.LOGO);
}

function loadHistorico() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.HIST) || "{}");
}
function saveHistorico(h) {
  localStorage.setItem(STORAGE_KEYS.HIST, JSON.stringify(h));
}


// ========= ESTADOS =========
let funcionarios = loadFuncionarios();
let resultadoFinal = null;


// ========= TABS =========
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});


// ========= EQUIPE =========
const listaFuncionariosEl = document.getElementById("lista-funcionarios");
const totalFuncionariosEl = document.getElementById("total-funcionarios");

function renderFuncionarios() {
  listaFuncionariosEl.innerHTML = "";
  if (funcionarios.length === 0) {
    listaFuncionariosEl.innerHTML = "<li>Nenhum colaborador cadastrado.</li>";
  } else {
    funcionarios.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(f => {
      const li = document.createElement("li");
      li.className = "list-item-row";
      li.innerHTML = `
        <div class="list-item-main"><span class="nome">${f.nome}</span></div>
        <button class="danger small">Remover</button>
      `;
      li.querySelector("button").onclick = () => {
        if (confirm(`Remover ${f.nome}?`)) {
          funcionarios = funcionarios.filter(x => x.id !== f.id);
          saveFuncionarios(funcionarios);
          renderFuncionarios();
          renderPresenca();
        }
      };
      listaFuncionariosEl.appendChild(li);
    });
  }
  totalFuncionariosEl.textContent = funcionarios.length;
}

document.getElementById("form-add-funcionario").onsubmit = e => {
  e.preventDefault();
  const nome = document.getElementById("nome-funcionario").value.trim();
  if (!nome) return;
  funcionarios.push({id: Date.now(), nome});
  saveFuncionarios(funcionarios);
  document.getElementById("nome-funcionario").value="";
  renderFuncionarios();
  renderPresenca();
};

renderFuncionarios();


// ========= PRESENÇA =========
const listaPresencaEl = document.getElementById("lista-presenca");

function renderPresenca() {
  listaPresencaEl.innerHTML = "";
  funcionarios.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(f => {
    const li = document.createElement("li");
    li.className="list-item-row";
    li.innerHTML = `
      <label class="list-item-main">
        <input type="checkbox" data-id="${f.id}"> ${f.nome}
      </label>
    `;
    listaPresencaEl.appendChild(li);
  });
  updateSelects();
}

function getPresentes() {
  return [...document.querySelectorAll("#lista-presenca input:checked")]
    .map(chk => funcionarios.find(f=>f.id==chk.dataset.id));
}

renderPresenca();


// ========= SELECTS (APENAS PRESENTES — OPCÃO A) =========
const selects = {
  bar1: document.getElementById("sel-bar1"),
  bar2: document.getElementById("sel-bar2"),
  a1: document.getElementById("sel-a1"),
  a2: document.getElementById("sel-a2"),
  l1: document.getElementById("sel-l1"),
  l2: document.getElementById("sel-l2"),
  l3: document.getElementById("sel-l3"),
  ap1: document.getElementById("sel-ap1"),
  ap2: document.getElementById("sel-ap2"),
  ap3: document.getElementById("sel-ap3")
};

function updateSelects() {
  const presentes = getPresentes();
  Object.values(selects).forEach(sel=>{
    sel.innerHTML="";
    presentes.forEach(p=>{
      const opt=document.createElement("option");
      opt.value=p.nome;
      opt.textContent=p.nome;
      sel.appendChild(opt);
    });
  });
}

listaPresencaEl.onchange = updateSelects;


// ========= PREVIEW & IMPRESSÃO =========
const preview = document.getElementById("preview-dia");
const printArea = document.getElementById("print-area");

document.getElementById("btn-imprimir-dia").onclick = () => {
  if (!resultadoFinal) return alert("Gere primeiro!");

  printArea.innerHTML = preview.innerHTML;
  window.print();
};

function gerarPreview() {
  const data = document.getElementById("data-dia").value;
  if (!data) return alert("Selecione a data!");

  resultadoFinal = {
    data,
    bar1: selects.bar1.value,
    bar2: selects.bar2.value,
    almoco1: [...selects.a1.selectedOptions].map(o=>o.value),
    almoco2: [...selects.a2.selectedOptions].map(o=>o.value),
    lanche1: [...selects.l1.selectedOptions].map(o=>o.value),
    lanche2: [...selects.l2.selectedOptions].map(o=>o.value),
    lanche3: [...selects.l3.selectedOptions].map(o=>o.value),
    ap1: selects.ap1.value,
    ap2: selects.ap2.value,
    ap3: selects.ap3.value
  };

  preview.classList.remove("empty");
  preview.innerHTML = `
    <div class="escala-documento">

      <header class="escala-header">
        ${loadLogo() ? `<img src="${loadLogo()}">` : ""}
        <h1>BARRACA TERRA DO SOL</h1>
        <h2>Escala Operacional do Dia</h2>
        <p>${weekdayName(data)} — ${formatDateBR(data)}</p>
      </header>

      <h3>🍽 Almoço</h3>
      <p><strong>Turma 1:</strong> ${resultadoFinal.almoco1.join(", ") || "—"}</p>
      <p><strong>Turma 2:</strong> ${resultadoFinal.almoco2.join(", ") || "—"}</p>

      <h3>☕ Lanche</h3>
      <p><strong>T1:</strong> ${resultadoFinal.lanche1.join(", ") || "—"}</p>
      <p><strong>T2:</strong> ${resultadoFinal.lanche2.join(", ") || "—"}</p>
      <p><strong>T3:</strong> ${resultadoFinal.lanche3.join(", ") || "—"}</p>

      <h3>🧺 Aparadores</h3>
      <p>Setor 1 → ${resultadoFinal.ap1 || "—"}</p>
      <p>Setor 2 → ${resultadoFinal.ap2 || "—"}</p>
      <p>Setor 3 → ${resultadoFinal.ap3 || "—"}</p>

      <h3>🍹 Bar</h3>
      <p>Bar 1 → ${resultadoFinal.bar1 || "—"}</p>
      <p>Bar 2 → ${resultadoFinal.bar2 || "—"}</p>

    </div>
  `;

  document.getElementById("btn-imprimir-dia").classList.remove("disabled");
}

document.getElementById("btn-imprimir-dia").disabled = false;


// ========= LOGO =========
document.getElementById("input-logo").onchange = e => {
  const file=e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    saveLogo(ev.target.result);
    renderLogo();
  };
  reader.readAsDataURL(file);
};

document.getElementById("btn-remover-logo").onclick = ()=>{
  saveLogo(null);
  renderLogo();
};

function renderLogo(){
  const area=document.getElementById("logo-preview-container");
  const data=loadLogo();
  area.innerHTML = data ? `<img src="${data}" />`:"<p>Nenhuma logo selecionada</p>";
}
renderLogo();
