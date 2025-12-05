// ------- STORAGE -------
const KEY_EQUIPE="equipe", KEY_LOGO="logo", KEY_HIST="historico", KEY_RODIZIO="rodizio";

let equipe=JSON.parse(localStorage.getItem(KEY_EQUIPE)||"[]");
let historico=JSON.parse(localStorage.getItem(KEY_HIST)||"{}");
let rodizio=Number(localStorage.getItem(KEY_RODIZIO)||0);
let ultimo=null;

// ------- TABS -------
document.querySelectorAll(".tab-button").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec=>sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});

// ------- EQUIPE -------
const inputNome=document.getElementById("input-nome");
const listaEquipe=document.getElementById("lista-equipe");

function renderEquipe(){
  listaEquipe.innerHTML="";
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`${p.nome} <button class="danger" onclick="remover(${p.id})">X</button>`;
    listaEquipe.appendChild(li);
  });
}

function remover(id){
  equipe=equipe.filter(p=>p.id!==id);
  localStorage.setItem(KEY_EQUIPE,JSON.stringify(equipe));
  renderEquipe(); renderPresenca();
}

document.getElementById("btn-add").onclick=()=>{
  if(!inputNome.value.trim()) return;
  equipe.push({id:Date.now(),nome:inputNome.value});
  inputNome.value="";
  localStorage.setItem(KEY_EQUIPE,JSON.stringify(equipe));
  renderEquipe(); renderPresenca();
};

renderEquipe();

// ------- PRESENÇA -------
const listaPresenca=document.getElementById("lista-presenca");

function renderPresenca(){
  listaPresenca.innerHTML="";
  equipe.forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`<label><input type="checkbox" value="${p.id}"> ${p.nome}</label>`;
    listaPresenca.appendChild(li);
  });
}
renderPresenca();

function presentes(){
  return equipe.filter(p => [...listaPresenca.querySelectorAll("input:checked")]
  .map(x=>Number(x.value)).includes(p.id));
}

// ------- ESCALA -------
function gerarEscala(data,p){
  const lista=[...p];
  for(let i=0;i<rodizio;i++)lista.push(lista.shift());

  const esc={
    data,
    presentes:p,
    bar:[lista[0]||null,lista[1]||null],
    aparadores:[lista[2]||null,lista[3]||null,lista[4]||null],
    almoco:[], lanche:[]
  };

  const resto=lista.slice(5);
  const met=Math.ceil(resto.length/2);
  esc.almoco=[resto.slice(0,met),resto.slice(met)];

  const t1=Math.ceil(resto.length/3);
  const t2=Math.ceil((resto.length-t1)/2);
  esc.lanche=[resto.slice(0,t1),resto.slice(t1,t1+t2),resto.slice(t1+t2)];

  return esc;
}

const preview=document.getElementById("preview-dia");
const btnImprimir=document.getElementById("btn-imprimir");
const btnSalvar=document.getElementById("btn-salvar");
const inputData=document.getElementById("data-dia");

// ------- RENDER DOCUMENTO -------
function nome(x){ return x?x.nome:"—"; }
function lista(arr){ return arr.length?arr.map(x=>x.nome).join(", "):"—"; }
function dia(d){return["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][new Date(d).getDay()]}

function renderDoc(e){
  const logo=localStorage.getItem(KEY_LOGO);
  return `
  ${logo?`<img class="doc-logo" src="${logo}">`:''}
  <h3>${dia(e.data)} — ${e.data.split("-").reverse().join("/")}</h3>
  
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

document.getElementById("btn-gerar-dia").onclick=()=>{
  if(!inputData.value)return alert("Selecione uma data");
  const p=presentes();
  if(!p.length)return alert("Marque quem está presente");

  rodizio++; localStorage.setItem(KEY_RODIZIO,rodizio);

  ultimo=gerarEscala(inputData.value,p);
  preview.innerHTML=renderDoc(ultimo);
  btnSalvar.disabled=false;
  btnImprimir.disabled=false;
};

// ------- MODAL EDIT -------
const modal=document.getElementById("modal");
const modalLista=document.getElementById("modal-lista");
const modalTitle=document.getElementById("modal-title");
let bloco="";

document.addEventListener("click",e=>{
  if(e.target.classList.contains("editar")){
    bloco=e.target.dataset.edit;
    modalTitle.innerText="Editar "+bloco.toUpperCase();
    modalLista.innerHTML="";
    ultimo.presentes.forEach(p=>{
      modalLista.innerHTML+=`<label><input type="checkbox" value="${p.id}"> ${p.nome}</label>`;
    });
    modal.classList.remove("hidden");
  }
});

document.getElementById("modal-fechar").onclick=()=>modal.classList.add("hidden");

document.getElementById("modal-salvar").onclick=()=>{
  const ids=[...modalLista.querySelectorAll("input:checked")].map(el=>Number(el.value));
  const selecionados=ultimo.presentes.filter(x=>ids.includes(x.id));

  if(bloco==="bar") ultimo.bar=[selecionados[0]||null,selecionados[1]||null];
  if(bloco==="aparadores") ultimo.aparadores=[selecionados[0]||null,selecionados[1]||null,selecionados[2]||null];
  if(bloco==="almoco"){
    const m=Math.ceil(selecionados.length/2);
    ultimo.almoco=[selecionados.slice(0,m),selecionados.slice(m)];
  }
  if(bloco==="lanche"){
    const t1=Math.ceil(selecionados.length/3);
    const t2=Math.ceil((selecionados.length-t1)/2);
    ultimo.lanche=[selecionados.slice(0,t1),selecionados.slice(t1,t1+t2),selecionados.slice(t1+t2)];
  }

  preview.innerHTML=renderDoc(ultimo);
  modal.classList.add("hidden");
};

// ------- IMPRESSÃO -------
document.getElementById("btn-imprimir").onclick=()=>{
  document.getElementById("print-area").innerHTML=renderDoc(ultimo);
  window.print();
};

// ------- HISTÓRICO -------
const listaHist=document.getElementById("lista-historico");

function renderHist(){
  listaHist.innerHTML="";
  Object.keys(historico).sort().forEach(d=>{
    const li=document.createElement("li");
    li.innerHTML=`${d.split("-").reverse().join("/")} 
    <button class="secondary" onclick="ver('${d}')">Ver</button>`;
    listaHist.appendChild(li);
  });
}

window.ver=d=>{
  ultimo=historico[d];
  preview.innerHTML=renderDoc(ultimo);
  btnImprimir.disabled=false;
};

btnSalvar.onclick=()=>{
  historico[ultimo.data]=ultimo;
  localStorage.setItem(KEY_HIST,JSON.stringify(historico));
  renderHist();
  alert("Salvo!");
};

document.getElementById("btn-apagar-historico").onclick=()=>{
  if(confirm("Apagar tudo?")){
    historico={};
    localStorage.setItem(KEY_HIST,"{}");
    renderHist();
  }
};

// ------- LOGO -------
const inputLogo=document.getElementById("input-logo");
const previewLogo=document.getElementById("logo-preview");

inputLogo.onchange=()=>{
  const f=inputLogo.files[0];
  const reader=new FileReader();
  reader.onload=()=>{
    localStorage.setItem(KEY_LOGO,reader.result);
    previewLogo.innerHTML=`<img src="${reader.result}">`;
  };
  reader.readAsDataURL(f);
};

document.getElementById("btn-remover-logo").onclick=()=>{
  localStorage.removeItem(KEY_LOGO);
  previewLogo.innerHTML="Nenhuma logo";
};

renderHist();
const l=localStorage.getItem(KEY_LOGO);
if(l)previewLogo.innerHTML=`<img src="${l}">`;
