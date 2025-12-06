/* ==============================
    UTILITÁRIOS DE DATA
============================== */
function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value) {
  if (!value) return new Date();
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateBR(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return String(d).padStart(2, "0") + "/" + String(m).padStart(2, "0") + "/" + y;
}

function weekdayName(dateStr) {
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const date = parseDateInput(dateStr);
  return dias[date.getDay()];
}

/* ==============================
    STORAGE
============================== */
const STORAGE_KEYS = {
  FUNCIONARIOS: "tds_escala_funcionarios",
  LOGO: "tds_escala_logo",
  RODIZIO: "tds_rodizio",
  HISTORICO: "tds_historico"
};

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ==============================
    ESTADO
============================== */
let funcionarios = load(STORAGE_KEYS.FUNCIONARIOS, []);
let rodizio = load(STORAGE_KEYS.RODIZIO, 0);
let historico = load(STORAGE_KEYS.HISTORICO, {});
let escalaAtual = null;

/* ==============================
    TABS
============================== */
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});

/* ==============================
    CADASTRO DE FUNCIONÁRIOS
============================== */
const inputNome = document.getElementById("nome-funcionario");
const listaFuncionariosEL = document.getElementById("lista-funcionarios");

function renderFuncionarios() {
  listaFuncionariosEL.innerHTML = "";
  if (funcionarios.length === 0) {
    listaFuncionariosEL.innerHTML = `<p>Nenhum colaborador cadastrado.</p>`;
    return;
  }

  funcionarios.sort((a,b)=> a.nome.localeCompare(b.nome)).forEach(f => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <span>${f.nome}</span>
      <button class="danger small">Remover</button>
    `;
    li.querySelector("button").onclick = () => {
      funcionarios = funcionarios.filter(x=>x.id!==f.id);
      save(STORAGE_KEYS.FUNCIONARIOS, funcionarios);
      renderFuncionarios();
      renderPresenca();
    };
    listaFuncionariosEL.appendChild(li);
  });
}
document.getElementById("form-add-funcionario").addEventListener("submit", e => {
  e.preventDefault();
  if (!inputNome.value.trim()) return;
  funcionarios.push({ id: Date.now(), nome: inputNome.value.trim() });
  save(STORAGE_KEYS.FUNCIONARIOS, funcionarios);
  inputNome.value = "";
  renderFuncionarios();
  renderPresenca();
});

/* ==============================
    PRESENÇA
============================== */
const listaPresencaEL = document.getElementById("lista-presenca");
function renderPresenca() {
  listaPresencaEL.innerHTML = "";
  funcionarios.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(f => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <label style="display:flex;gap:6px;align-items:center;">
        <input type="checkbox" data-id="${f.id}">
        ${f.nome}
      </label>
    `;
    listaPresencaEL.appendChild(li);
  });
}
function getPresentes() {
  return [...listaPresencaEL.querySelectorAll("input:checked")].map(chk => {
    return funcionarios.find(f => f.id == chk.dataset.id);
  });
}

/* ==============================
    GERAÇÃO DA ESCALA
============================== */
function gerarEscala(dataISO) {
  const presentes = getPresentes();
  const ordenados = presentes.sort((a,b)=>a.nome.localeCompare(b.nome));
  if (ordenados.length < 5 && !confirm("Menos de 5 pessoas — continuar?")) return null;

  const lista = [...ordenados.slice(rodizio), ...ordenados.slice(0, rodizio)];
  rodizio = (rodizio + 1) % (presentes.length || 1);
  save(STORAGE_KEYS.RODIZIO, rodizio);

  return escalaAtual = {
    data: dataISO,
    dia: weekdayName(dataISO),
    bar: [lista.shift() || null, lista.shift() || null],
    aparadores: [lista.shift()||null, lista.shift()||null, lista.shift()||null],
    almoco: lista.slice(0, Math.ceil(lista.length / 2)),
    lanche: lista.slice(Math.ceil(lista.length / 2)),
    presentes: ordenados
  };
}

/* ==============================
    RENDERIZAÇÃO E IMPRESSÃO
============================== */
function renderPreview() {
  const preview = document.getElementById("preview-dia");
  if (!escalaAtual) return preview.innerHTML = `<p>Nenhuma escala gerada.</p>`;
  
  preview.innerHTML = `
  <div class="preview-card">
    <strong>${escalaAtual.dia} — ${formatDateBR(escalaAtual.data)}</strong><br><br>

    <b>BAR:</b> ${escalaAtual.bar.map(x=>x?.nome||"—").join(" / ")}<br><br>

    <b>APARADORES:</b><br>
    1️⃣ ${escalaAtual.aparadores[0]?.nome||"—"}<br>
    2️⃣ ${escalaAtual.aparadores[1]?.nome||"—"}<br>
    3️⃣ ${escalaAtual.aparadores[2]?.nome||"—"}<br><br>

    🍽 <b>ALMOÇO:</b><br> ${escalaAtual.almoco.map(p=>p.nome).join(", ")}<br><br>
    ☕ <b>LANCHE:</b><br> ${escalaAtual.lanche.map(p=>p.nome).join(", ")}
  </div>
  `;
}

/* ==============================
    BOTÕES
============================== */
document.getElementById("btn-gerar-dia").onclick = () => {
  escalaAtual = gerarEscala(document.getElementById("data-dia").value || formatDateISO(new Date()));
  renderPreview();
  document.getElementById("btn-imprimir-dia").disabled = false;
  document.getElementById("btn-salvar-dia").disabled = false;
  prepararEditor();
};

document.getElementById("btn-imprimir-dia").onclick = () => {
  if (!escalaAtual) return;
  const printArea = document.getElementById("print-area");
  printArea.innerHTML = "";
  printArea.innerHTML = document.getElementById("preview-dia").innerHTML;
  window.print();
};

/* ==============================
    EDITOR (OPÇÃO C)
============================== */
function prepararEditor() {
  const editar = document.getElementById("editar-container");
  editar.innerHTML = "";

  if (!escalaAtual) {
    editar.innerHTML = `<p class="tip">Gere uma escala primeiro.</p>`;
    return;
  }

  // BAR
  editar.innerHTML += `<h3>Bar</h3>`;
  
  escalaAtual.bar.forEach((val, i)=>{
    const select = criarSelect(val?.id || null, id=>{
      escalaAtual.bar[i] = funcionarios.find(f=>f.id==id) || null;
    });
    editar.appendChild(select);
  });

  // APARADORES
  editar.innerHTML += `<br><h3>Aparadores</h3>`;
  escalaAtual.aparadores.forEach((val, i)=>{
    const select = criarSelect(val?.id || null, id=>{
      escalaAtual.aparadores[i] = funcionarios.find(f=>f.id==id) || null;
    });
    editar.appendChild(select);
  });

  // DRAG / ALMOÇO & LANCHE
  editar.innerHTML += `<br><h3>Almoço (arraste para reordenar)</h3>`;
  editar.appendChild(criarDragList(escalaAtual.almoco, newOrder => escalaAtual.almoco = newOrder));

  editar.innerHTML += `<br><h3>Lanche (arraste para reordenar)</h3>`;
  editar.appendChild(criarDragList(escalaAtual.lanche, newOrder => escalaAtual.lanche = newOrder));

  document.getElementById("btn-salvar-edicao").disabled = false;
}

function criarSelect(valor, onChange) {
  const sel = document.createElement("select");
  sel.innerHTML = `<option value="">---</option>` + 
    funcionarios.map(f=>`<option value="${f.id}" ${valor==f.id?"selected":""}>${f.nome}</option>`).join("");
  
  sel.onchange = ()=>onChange(sel.value || null);
  return sel;
}

function criarDragList(lista, callback) {
  const container = document.createElement("div");
  container.className = "drag-zone";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "editar-item";
    div.draggable = true;
    div.textContent = p.nome;

    div.ondragstart = e => {
      e.dataTransfer.setData("text/plain", p.id);
      div.style.opacity = 0.3;
    };
    div.ondragend = ()=> div.style.opacity = 1;

    div.ondragover = e => e.preventDefault();
    div.ondrop = e => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      const draggedPerson = funcionarios.find(f=>f.id==draggedId);
      const targetPerson = lista.find(f=>f.nome === div.textContent);

      if (draggedPerson && targetPerson && draggedPerson.id !== targetPerson.id) {
        const oldIdx = lista.indexOf(draggedPerson);
        const newIdx = lista.indexOf(targetPerson);
        lista.splice(oldIdx,1);
        lista.splice(newIdx,0,draggedPerson);
        callback([...lista]);
        prepararEditor();
        renderPreview();
      }
    };

    container.appendChild(div);
  });

  return container;
}

/* ==============================
    SALVAR EDIÇÕES / HISTÓRICO
============================== */
document.getElementById("btn-salvar-edicao").onclick = ()=>{
  historico[escalaAtual.data] = escalaAtual;
  save(STORAGE_KEYS.HISTORICO, historico);
  alert("Escala atualizada com sucesso!");
};

/* ==============================
    INICIALIZAÇÃO
============================== */
function init() {
  document.getElementById("data-dia").value = formatDateISO(new Date());
  renderFuncionarios();
  renderPresenca();
}

init();
