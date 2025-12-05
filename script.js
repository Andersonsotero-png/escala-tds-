// ======= STORAGE / VARIÁVEIS =======
const STORAGE = {
  equipe: "app_equipe",
  logo: "app_logo",
  historico: "app_historico",
  rodizio: "app_rodizio"
};

let equipe = JSON.parse(localStorage.getItem(STORAGE.equipe) || "[]");
let historico = JSON.parse(localStorage.getItem(STORAGE.historico) || "{}");
let rodizioIndex = Number(localStorage.getItem(STORAGE.rodizio) || 0);
let ultimoResultado = null;

// ======= FUNÇÕES BASE =======
function salvarEquipe() {
  localStorage.setItem(STORAGE.equipe, JSON.stringify(equipe));
}

function salvarHistorico() {
  localStorage.setItem(STORAGE.historico, JSON.stringify(historico));
}

function salvarRodizio() {
  localStorage.setItem(STORAGE.rodizio, rodizioIndex);
}

function formatarDataBR(data) {
  const d = data.split("-");
  return `${d[2]}/${d[1]}/${d[0]}`;
}

function diaDaSemana(data) {
  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const d = new Date(data);
  return dias[d.getDay()];
}

// ======= UI: TABS =======
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec=>sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});

// ======= EQUIPE =======
const inputNome = document.getElementById("input-nome");
const btnAdd = document.getElementById("btn-add");
const listaEquipe = document.getElementById("lista-equipe");

btnAdd.addEventListener("click", () => {
  if(inputNome.value.trim()==="") return;
  equipe.push({ id:Date.now(), nome:inputNome.value });
  inputNome.value="";
  salvarEquipe();
  renderEquipe();
  renderPresenca();
});

function removerPessoa(id) {
  equipe = equipe.filter(p=>p.id!==id);
  salvarEquipe();
  renderEquipe();
  renderPresenca();
}

function renderEquipe() {
  listaEquipe.innerHTML="";
  if(equipe.length===0){
    listaEquipe.innerHTML="<li>Ninguém cadastrado ainda</li>";
    return;
  }
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome))
  .forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`${p.nome} <button class="danger small" onclick="removerPessoa(${p.id})">Excluir</button>`;
    listaEquipe.appendChild(li);
  });
} 
// ======= PRESENÇA =======
const listaPresenca = document.getElementById("lista-presenca");
const inputDataDia = document.getElementById("data-dia");

function renderPresenca(){
  listaPresenca.innerHTML="";
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome))
  .forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`<label><input type="checkbox" value="${p.id}"> ${p.nome}</label>`;
    listaPresenca.appendChild(li);
  });
}

function pegarPresentes(){
  const marcados=[...listaPresenca.querySelectorAll("input:checked")].map(c=>Number(c.value));
  return equipe.filter(p=>marcados.includes(p.id));
}

// ======= GERA ESCALA =======
function gerarEscala(data, presentes){

  const rotacionados = [...presentes];
  for(let i=0;i<rodizioIndex;i++){
    rotacionados.push(rotacionados.shift());
  }

  const escala = {
    data,
    dia:diaDaSemana(data),
    presentes,
    bar:[rotacionados[0]||null, rotacionados[1]||null],
    aparadores:[rotacionados[2]||null, rotacionados[3]||null, rotacionados[4]||null],
    almoco:[],
    lanche:[]
  };

  const restante = rotacionados.slice(5);

  // divisões
  const met = Math.ceil(restante.length/2);
  escala.almoco=[restante.slice(0,met), restante.slice(met)];

  const t1=Math.ceil(restante.length/3);
  const t2=Math.ceil((restante.length-t1)/2);
  escala.lanche=[restante.slice(0,t1), restante.slice(t1,t1+t2), restante.slice(t1+t2)];

  return escala;
}

// ======= RENDER DA IMPRESSÃO =======
function renderDocumento(escala){
  const logo = localStorage.getItem(STORAGE.logo);

  const nome = p=>p?p.nome:"—";
  const lista = arr=>arr&&arr.length?arr.map(p=>p.nome).join(", "):"—";

  let html = `
  <div class="escala-documento">
    ${logo?`<img class="doc-logo" src="${logo}">`:''}
    <h2>BARRACA TERRA DO SOL</h2>
    <h3>${diaDaSemana(escala.data)} — ${formatarDataBR(escala.data)}</h3>
    
    <h3 style="display:flex;justify-content:space-between;">
      🍽 Almoço <button class="editar" data-bloco="almoco">Editar</button>
    </h3>
    <p>10:00 → 10:40: ${lista(escala.almoco[0])}</p>
    <p>10:40 → 11:20: ${lista(escala.almoco[1])}</p>

    <h3 style="display:flex;justify-content:space-between;">
      ☕ Lanche <button class="editar" data-bloco="lanche">Editar</button>
    </h3>
    <p>15:00 → 15:20: ${lista(escala.lanche[0])}</p>
    <p>15:20 → 15:40: ${lista(escala.lanche[1])}</p>
    <p>15:40 → 16:00: ${lista(escala.lanche[2])}</p>

    <h3 style="display:flex;justify-content:space-between;">
      🧺 Aparadores <button class="editar" data-bloco="aparadores">Editar</button>
    </h3>
    <p>Salão + direito: ${nome(escala.aparadores[0])}</p>
    <p>Praia direita + parquinho: ${nome(escala.aparadores[1])}</p>
    <p>Coqueiro esquerdo + praia esquerda: ${nome(escala.aparadores[2])}</p>

    <h3 style="display:flex;justify-content:space-between;">
      🍹 Bar <button class="editar" data-bloco="bar">Editar</button>
    </h3>
    <p>Bar 1: ${nome(escala.bar[0])}</p>
    <p>Bar 2: ${nome(escala.bar[1])}</p>
  </div>
  `;
  
  return html;
} 
// ======= AÇÕES DO DIA =======
const btnGerarDia = document.getElementById("btn-gerar-dia");
const previewDia = document.getElementById("preview-dia");
const btnSalvarHist = document.getElementById("btn-salvar-hist");
const btnImprimirDia = document.getElementById("btn-imprimir-dia");

// gerar
btnGerarDia.addEventListener("click",()=>{
  const presentes = pegarPresentes();
  const data = inputDataDia.value;
  if(!data || presentes.length===0) return alert("Selecione data e colaboradores!");

  ultimoResultado = gerarEscala(data, presentes);
  rodizioIndex++;
  salvarRodizio();

  previewDia.innerHTML = renderDocumento(ultimoResultado);
  btnSalvarHist.disabled=false;
  btnImprimirDia.disabled=false;
});

// imprimir
btnImprimirDia.addEventListener("click",()=>{
  document.getElementById("print-area").innerHTML=renderDocumento(ultimoResultado);
  window.print();
});

// salvar histórico
btnSalvarHist.addEventListener("click",()=>{
  historico[ultimoResultado.data] = ultimoResultado;
  salvarHistorico();
  alert("Salvo!");
  renderHistorico();
});

// ======= HISTÓRICO =======
const listaHistorico = document.getElementById("lista-historico");
const btnApagarHistorico = document.getElementById("btn-apagar-historico");

function renderHistorico(){
  listaHistorico.innerHTML="";
  Object.keys(historico).sort().forEach(d=>{
    const li=document.createElement("li");
    li.innerHTML=`${formatarDataBR(d)} <button class="secondary" onclick="verEscala('${d}')">Ver</button>`;
    listaHistorico.appendChild(li);
  });
}

window.verEscala = function(d){
  ultimoResultado = historico[d];
  previewDia.innerHTML = renderDocumento(ultimoResultado);
  btnImprimirDia.disabled=false;
};

// apagar tudo
btnApagarHistorico.addEventListener("click",()=>{
  if(confirm("Apagar tudo?")){
    historico={};
    salvarHistorico();
    renderHistorico();
  }
});

// ======= LOGO =======
const inputLogo = document.getElementById("input-logo");
const previewLogo = document.getElementById("logo-preview");
const btnRemoveLogo = document.getElementById("btn-remover-logo");

inputLogo.addEventListener("change",()=>{
  const file = inputLogo.files[0];
  const reader = new FileReader();
  reader.onload=()=> {
    localStorage.setItem(STORAGE.logo, reader.result);
    atualizarLogo();
  };
  reader.readAsDataURL(file);
});

btnRemoveLogo.addEventListener("click",()=>{
  localStorage.removeItem(STORAGE.logo);
  atualizarLogo();
});

function atualizarLogo(){
  const logo=localStorage.getItem(STORAGE.logo);
  previewLogo.innerHTML=logo?`<img src="${logo}">`:"Nenhuma logo";
}

// ======= MODAL E EDIÇÃO =======
const modal=document.getElementById("modal-edicao");
const modalLista=document.getElementById("modal-lista");
const modalTitulo=document.getElementById("modal-titulo");
const btnModalSalvar=document.getElementById("modal-salvar");
const btnModalFechar=document.getElementById("modal-fechar");

let blocoEditando=null;

document.addEventListener("click",(e)=>{
  if(e.target.classList.contains("editar")){
    blocoEditando=e.target.dataset.bloco;
    abrirModal();
  }
});

function abrirModal(){
  modal.classList.remove("hidden");
  modalTitulo.innerText="Editar "+blocoEditando.toUpperCase();
  modalLista.innerHTML="";

  ultimoResultado.presentes.forEach(p=>{
    modalLista.innerHTML+=`<label><input type="checkbox" value="${p.id}"> ${p.nome}</label>`;
  });
}

btnModalSalvar.addEventListener("click",()=>{
  const marcados=[...modalLista.querySelectorAll("input:checked")].map(c=>Number(c.value));
  const selecionados = ultimoResultado.presentes.filter(p=>marcados.includes(p.id));

  if(blocoEditando==="bar") ultimoResultado.bar=[selecionados[0]||null, selecionados[1]||null];
  if(blocoEditando==="aparadores") ultimoResultado.aparadores=[selecionados[0]||null, selecionados[1]||null, selecionados[2]||null];
  if(blocoEditando==="almoco"){
    ultimoResultado.almoco=[selecionados.slice(0,Math.ceil(selecionados.length/2)), selecionados.slice(Math.ceil(selecionados.length/2))];
  }
  if(blocoEditando==="lanche"){
    const t1=Math.ceil(selecionados.length/3);
    const t2=Math.ceil((selecionados.length-t1)/2);
    ultimoResultado.lanche=[selecionados.slice(0,t1), selecionados.slice(t1,t1+t2), selecionados.slice(t1+t2)];
  }

  previewDia.innerHTML=renderDocumento(ultimoResultado);
  modal.classList.add("hidden");
});

btnModalFechar.addEventListener("click",()=>modal.classList.add("hidden"));

// ======= INICIAR =======
renderEquipe();
renderPresenca();
renderHistorico();
atualizarLogo();
