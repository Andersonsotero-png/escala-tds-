//--------------------------------------------------
// STORAGE
//--------------------------------------------------
const KEY_EQUIPE="equipe";
const KEY_HIST="historico";
const KEY_LOGO="logo";
const KEY_RODIZIO="rodizio";

let equipe=JSON.parse(localStorage.getItem(KEY_EQUIPE)||"[]");
let historico=JSON.parse(localStorage.getItem(KEY_HIST)||"{}");
let rodizio=Number(localStorage.getItem(KEY_RODIZIO)||0);
let ultimo=null;


//--------------------------------------------------
// TABS
//--------------------------------------------------
const tabs=document.querySelectorAll(".tab-button");
const sections=document.querySelectorAll(".tab-section");

tabs.forEach(btn=>{
  btn.onclick=()=>{
    tabs.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    sections.forEach(sec=>sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});


//--------------------------------------------------
// EQUIPES
//--------------------------------------------------
const inputNome=document.getElementById("input-nome");
const listaEquipe=document.getElementById("lista-equipe");

function salvarEquipe(){
  localStorage.setItem(KEY_EQUIPE,JSON.stringify(equipe));
}

function renderEquipe(){
  listaEquipe.innerHTML="";
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`${p.nome} <button class="danger" onclick="removerEquipe(${p.id})">X</button>`;
    listaEquipe.appendChild(li);
  });
}

function removerEquipe(id){
  equipe=equipe.filter(p=>p.id!==id);
  salvarEquipe();
  renderEquipe(); renderPresenca();
}

document.getElementById("btn-add").onclick=()=>{
  if(!inputNome.value.trim())return;
  equipe.push({id:Date.now(), nome:inputNome.value});
  inputNome.value="";
  salvarEquipe();
  renderEquipe(); renderPresenca();
};

renderEquipe();


//--------------------------------------------------
// PRESENÇA
//--------------------------------------------------
const listaPresenca=document.getElementById("lista-presenca");

function renderPresenca(){
  listaPresenca.innerHTML="";
  equipe.forEach(p=>{
    listaPresenca.innerHTML+=`<li><label><input type="checkbox" value="${p.id}"> ${p.nome}</label></li>`;
  });
}
renderPresenca();

function getPresentes(){
  return equipe.filter(p => [...listaPresenca.querySelectorAll("input:checked")]
  .map(x=>Number(x.value)).includes(p.id));
}


//--------------------------------------------------
// GERAR ESCALA
//--------------------------------------------------
function gerar(data,p){
  let arr=[...p];
  for(let i=0;i<rodizio;i++)arr.push(arr.shift());

  const esc={
    data,presentes:p,
    bar:[arr[0]||null,arr[1]||null],
    aparadores:[arr[2]||null,arr[3]||null,arr[4]||null],
    almoco:[],
    lanche:[]
  };

  const resto=arr.slice(5);
  const m=Math.ceil(resto.length/2);
  esc.almoco=[resto.slice(0,m),resto.slice(m)];

  const t1=Math.ceil(resto.length/3);
  const t2=Math.ceil((resto.length-t1)/2);
  esc.lanche=[resto.slice(0,t1),resto.slice(t1,t1+t2),resto.slice(t1+t2)];

  return esc;
}


//--------------------------------------------------
// PREVIEW
//--------------------------------------------------
const preview=document.getElementById("preview");
const btnGerar=document.getElementById("btn-gerar");
const btnSalvar=document.getElementById("btn-salvar");
const btnImprimir=document.getElementById("btn-imprimir");
const inputData=document.getElementById("data-dia");

function nome(x){return x?x.nome:"—";}
function lista(arr){return arr.length?arr.map(x=>x.nome).join(", "):"—";}

function renderDoc(e){
  const logo=localStorage.getItem(KEY_LOGO);
  return `
  ${logo?`<img class="doc-logo" src="${logo}">`:''}
  <h3>${e.data.split("-").reverse().join("/")}</h3>

  <h4>🍽 Almoço <button class="editar" data-edit="almoco">Editar</button></h4>
  10:00 - 10:40: ${lista(e.almoco[0])}<br>
  10:40 - 11:20: ${lista(e.almoco[1])}<br><br>

  <h4>☕ Lanche <button class="editar" data-edit="lanche">Editar</button></h4>
  15:00 - 15:20: ${lista(e.lanche[0])}<br>
  15:20 - 15:40: ${lista(e.lanche[1])}<br>
  15:40 - 16:00: ${lista(e.lanche[2])}<br><br>

  <h4>🧺 Aparadores <button class="editar" data-edit="aparadores">Editar</button></h4>
  Setor 1: ${nome(e.aparadores[0])}<br>
  Setor 2: ${nome(e.aparadores[1])}<br>
  Setor 3: ${nome(e.aparadores[2])}<br><br>

  <h4>🍹 Bar <button class="editar" data-edit="bar">Editar</button></h4>
  Bar 1: ${nome(e.bar[0])}<br>
  Bar 2: ${nome(e.bar[1])}<br>
  `;
}

btnGerar.onclick=()=>{
  if(!inputData.value)return alert("Escolha uma data.");
  let p=getPresentes();
  if(!p.length)return alert("Selecione quem está presente.");

  rodizio++; localStorage.setItem(KEY_RODIZIO,rodizio);

  ultimo=gerar(inputData.value,p);
  preview.innerHTML=renderDoc(ultimo);
  btnSalvar.disabled=false;
  btnImprimir.disabled=false;
};


//--------------------------------------------------
// MODAL EDIT
//--------------------------------------------------
const modal=document.getElementById("modal");
const modalLista=document.getElementById("modal-lista");
const modalTitle=document.getElementById("modal-title");
let bloco=null;

document.addEventListener("click",e=>{
  if(e.target.classList.contains("editar")){
    bloco=e.target.dataset.edit;
    modalTitle.innerText="Editar "+bloco.toUpperCase();
    modalLista.innerHTML="";
    ultimo.presentes.forEach(p=>{
      modalLista.innerHTML+=`<label><input type="checkbox" value="${p.id}"> ${p.nome}</label><br>`;
    });
    modal.classList.remove("hidden");
  }
});

document.getElementById("modal-fechar").onclick=()=>modal.classList.add("hidden");

document.getElementById("modal-salvar").onclick=()=>{
  let ids=[...modalLista.querySelectorAll("input:checked")].map(x=>Number(x.value));
  let sel=ultimo.presentes.filter(p=>ids.includes(p.id));

  if(bloco==="bar")ultimo.bar=[sel[0]||null,sel[1]||null];
  if(bloco==="aparadores")ultimo.aparadores=[sel[0]||null,sel[1]||null,sel[2]||null];
  if(bloco==="almoco"){
    const m=Math.ceil(sel.length/2);
    ultimo.almoco=[sel.slice(0,m),sel.slice(m)];
  }
  if(bloco==="lanche"){
    const t1=Math.ceil(sel.length/3);
    const t2=Math.ceil((sel.length-t1)/2);
    ultimo.lanche=[sel.slice(0,t1),sel.slice(t1,t1+t2),sel.slice(t1+t2)];
  }

  preview.innerHTML=renderDoc(ultimo);
  modal.classList.add("hidden");
};


//--------------------------------------------------
// SALVAR & IMPRIMIR
//--------------------------------------------------
btnSalvar.onclick=()=>{
  historico[ultimo.data]=ultimo;
  localStorage.setItem(KEY_HIST,JSON.stringify(historico));
  renderHist();
  alert("Salvo!");
};

btnImprimir.onclick=()=>{
  document.getElementById("print-area").innerHTML=renderDoc(ultimo);
  window.print();
};


//--------------------------------------------------
// HISTÓRICO
//--------------------------------------------------
const listaHist=document.getElementById("lista-historico");

function renderHist(){
  listaHist.innerHTML="";
  Object.keys(historico).sort().forEach(d=>{
    listaHist.innerHTML+=`<li>${d.split("-").reverse().join("/")} 
      <button class="secondary" onclick="abrir('${d}')">Ver</button></li>`;
  });
}
renderHist();

window.abrir=d=>{
  ultimo=historico[d];
  preview.innerHTML=renderDoc(ultimo);
  btnImprimir.disabled=false;
};


//--------------------------------------------------
// LOGO
//--------------------------------------------------
const inputLogo=document.getElementById("input-logo");
const previewLogo=document.getElementById("logo-preview");

inputLogo.onchange=()=>{
  const f=inputLogo.files[0];
  const r=new FileReader();
  r.onload=()=>{
    localStorage.setItem(KEY_LOGO,r.result);
    previewLogo.innerHTML=`<img src="${r.result}">`;
  };
  r.readAsDataURL(f);
};

document.getElementById("btn-remover-logo").onclick=()=>{
  localStorage.removeItem(KEY_LOGO);
  previewLogo.innerHTML="Nenhuma logo";
};

if(localStorage.getItem(KEY_LOGO)){
  previewLogo.innerHTML=`<img src="${localStorage.getItem(KEY_LOGO)}">`;
}
