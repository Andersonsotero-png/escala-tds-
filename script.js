/* UTILITÁRIOS */
const STORAGE = {
  equipe:"tds_equipes",
  logo:"tds_logo",
  historico:"tds_hist",
  rodizio:"tds_offset"
};

let equipe = JSON.parse(localStorage.getItem(STORAGE.equipe) || "[]");
let historico = JSON.parse(localStorage.getItem(STORAGE.historico) || "{}");
let rodizio = Number(localStorage.getItem(STORAGE.rodizio) || 0);
let ultimo = null;

const turma1Input = document.getElementById("qtd-turma1");
const turma2Input = document.getElementById("qtd-turma2");

/* ----- TABS ----- */
document.querySelectorAll(".tab-button").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-section").forEach(s=>s.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});

/* ----- EQUIPE ----- */
function salvarEquipe(){
  localStorage.setItem(STORAGE.equipe,JSON.stringify(equipe));
}
const inputNome=document.getElementById("nome-funcionario");
const listaEquipe=document.getElementById("lista-funcionarios");
const totalEquipe=document.getElementById("total-funcionarios");

document.getElementById("form-add-funcionario").onsubmit=e=>{
  e.preventDefault();
  if(!inputNome.value.trim())return;
  equipe.push({id:Date.now(),nome:inputNome.value});
  inputNome.value="";
  salvarEquipe();
  renderEquipe();
  renderPresenca();
};

function remover(id){
  equipe=equipe.filter(x=>x.id!==id);
  salvarEquipe();
  renderEquipe();
  renderPresenca();
}

function renderEquipe(){
  listaEquipe.innerHTML="";
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(p=>{
    listaEquipe.innerHTML+=`<li class="list-item-row"><span>${p.nome}</span><button class="danger small" onclick="remover(${p.id})">Remover</button></li>`;
  });
  totalEquipe.textContent=equipe.length;
}

/* ----- PRESENÇA ----- */
const listaPresenca=document.getElementById("lista-presenca");
const totalPres=document.getElementById("total-presentes");

function renderPresenca(){
  listaPresenca.innerHTML="";
  equipe.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(p=>{
    listaPresenca.innerHTML+=`<li><label><input type="checkbox" value="${p.id}"> ${p.nome}</label></li>`;
  });
  atualizarTotal();
}

function presentes(){
  return [...listaPresenca.querySelectorAll("input:checked")].map(c=>Number(c.value)).map(id=>equipe.find(x=>x.id===id));
}

function atualizarTotal(){
  totalPres.textContent=presentes().length;
}

listaPresenca.onchange=atualizarTotal;

/* ----- LÓGICA ----- */
function dividir(lista,q1,q2){
  if(q1 && q2 && q1+q2===lista.length){
    return [lista.slice(0,q1),lista.slice(q1)];
  }
  const m=Math.ceil(lista.length/2);
  return [lista.slice(0,m),lista.slice(m)];
}

function gerar(data,p){
  let arr=[...p];
  for(let i=0;i<rodizio;i++)arr.push(arr.shift());
  rodizio++; localStorage.setItem(STORAGE.rodizio,rodizio);

  const esc={
    data,presentes:p,
    bar:[arr[0]||null,arr[1]||null],
    aparadores:[arr[2]||null,arr[3]||null,arr[4]||null],
    almoco:[[],[]],
    lanche:[]
  };

  const restantes=arr.slice(5);

  esc.almoco=dividir(restantes,Number(turma1Input.value),Number(turma2Input.value));

  const t1=Math.ceil(restantes.length/3);
  const t2=Math.ceil((restantes.length-t1)/2);
  esc.lanche=[restantes.slice(0,t1),restantes.slice(t1,t1+t2),restantes.slice(t1+t2)];

  return esc;
}

function nome(x){return x?x.nome:"—";}
function lista(l){return l.length?l.map(x=>x.nome).join(", "):"—";}

/* ----- EDTIAR ----- */
const modal=document.getElementById("modal-edicao");
const modalTitulo=document.getElementById("modal-titulo");
const modalLista=document.getElementById("modal-lista");
const modalSalvar=document.getElementById("modal-salvar");
let bloco=null;

document.addEventListener("click",e=>{
  if(e.target.classList.contains("editar")){
    bloco=e.target.dataset.tipo;
    modalTitulo.textContent="Editar "+bloco.toUpperCase();
    modalLista.innerHTML="";

    const tipo = bloco==="aparadores" ? "radio" : bloco==="bar" ? "radio" : "checkbox";

    ultimo.presentes.forEach(p=>{
      modalLista.innerHTML+=`<label><input type="${tipo}" name="sel" value="${p.id}"> ${p.nome}</label>`;
    });

    modal.classList.remove("hidden");
  }
});

document.getElementById("modal-cancelar").onclick=()=>{
  modal.classList.add("hidden");
};

modalSalvar.onclick=()=>{
  const ids=[...modalLista.querySelectorAll("input:checked")].map(x=>Number(x.value));
  
  if(bloco==="almoco"){
    const select=ultimo.presentes.filter(p=>ids.includes(p.id));
    ultimo.almoco=dividir(select,Number(turma1Input.value),Number(turma2Input.value));
  }

  if(bloco==="lanche"){
    const list=ultimo.presentes.filter(p=>ids.includes(p.id));
    const t1=Math.ceil(list.length/3);
    ultimo.lanche=[list.slice(0,t1),list.slice(t1,t1*2),list.slice(t1*2)];
  }

  if(bloco==="bar"){
    ultimo.bar=[ultimo.presentes.find(p=>p.id===ids[0])||null,ultimo.presentes.find(p=>p.id===ids[1])||null];
  }

  if(bloco==="aparadores"){
    ultimo.aparadores=[
      ultimo.presentes.find(p=>p.id===ids[0])||null,
      ultimo.presentes.find(p=>p.id===ids[1])||null,
      ultimo.presentes.find(p=>p.id===ids[2])||null
    ];
  }

  atualizarPreview();
  modal.classList.add("hidden");
};

/* ----- RENDER PREVIEW ----- */
const preview=document.getElementById("preview-dia");

function atualizarPreview(){
  preview.innerHTML=renderHTML(ultimo);
}

function renderHTML(e){
  const logo=localStorage.getItem(STORAGE.logo)||"";

  return `
  <article class="escala-documento">
    ${logo?`<img src="${logo}" style="max-width:180px;margin-bottom:10px;">`:``}

    <h3>🍽 Almoço <button class="editar" data-tipo="almoco">Editar</button></h3>
    10:00 → ${lista(e.almoco[0])}<br>
    10:40 → ${lista(e.almoco[1])}<br><br>

    <h3>☕ Lanche <button class="editar" data-tipo="lanche">Editar</button></h3>
    15:00 → ${lista(e.lanche[0])}<br>
    15:20 → ${lista(e.lanche[1])}<br>
    15:40 → ${lista(e.lanche[2])}<br><br>

    <h3>🧺 Aparadores <button class="editar" data-tipo="aparadores">Editar</button></h3>
    Setor 1: ${nome(e.aparadores[0])}<br>
    Setor 2: ${nome(e.aparadores[1])}<br>
    Setor 3: ${nome(e.aparadores[2])}<br><br>

    <h3>🍹 Bar <button class="editar" data-tipo="bar">Editar</button></h3>
    Bar 1: ${nome(e.bar[0])}<br>
    Bar 2: ${nome(e.bar[1])}<br>
  </article>
  `;
}

/* ----- GERAR ----- */
document.getElementById("btn-gerar-dia").onclick=()=>{
  const p=presentes();
  if(!p.length)return alert("Selecione presentes.");
  ultimo=gerar(document.getElementById("data-dia").value,p);
  atualizarPreview();
  document.getElementById("btn-salvar-dia").disabled=false;
  document.getElementById("btn-imprimir-dia").disabled=false;
};

/* ----- LOGO ----- */
document.getElementById("input-logo").onchange=e=>{
  const file=e.target.files[0];
  const reader=new FileReader();
  reader.onload=ev=>{
    localStorage.setItem(STORAGE.logo,ev.target.result);
    document.getElementById("logo-preview-container").innerHTML=`<img src="${ev.target.result}">`;
  };
  reader.readAsDataURL(file);
};

document.getElementById("btn-remover-logo").onclick=()=>{
  localStorage.removeItem(STORAGE.logo);
  document.getElementById("logo-preview-container").innerHTML="<p>Nenhuma imagem</p>";
};

/* ----- IMPRESSÃO ----- */
document.getElementById("btn-imprimir-dia").onclick=()=>{
  const logo=localStorage.getItem(STORAGE.logo)||"";
  document.getElementById("print-area").innerHTML=(logo?`<img src="${logo}" style="max-width:200px;margin-bottom:10px;">`:``)+renderHTML(ultimo);
  window.print();
};

/* ----- HISTÓRICO ----- */
function renderHistorico(){
  const lista=document.getElementById("lista-historico");
  lista.innerHTML="";
  Object.keys(historico).sort().forEach(d=>{
    lista.innerHTML+=`<li>${d} <button onclick="ver('${d}')">Abrir</button></li>`;
  });
}

function ver(d){
  ultimo=historico[d];
  atualizarPreview();
  document.querySelector(`.tab-button[data-target='section-dia']`).click();
}

document.getElementById("btn-salvar-dia").onclick=()=>{
  historico[document.getElementById("data-dia").value]=ultimo;
  localStorage.setItem(STORAGE.historico,JSON.stringify(historico));
  renderHistorico();
};

document.getElementById("btn-apagar-historico").onclick=()=>{
  if(confirm("Apagar todo histórico?")){
    historico={};
    localStorage.setItem(STORAGE.historico,"{}");
    renderHistorico();
  }
};

/* ----- INÍCIO ----- */
renderEquipe();
renderPresenca();
renderHistorico();
