// --- STORAGE ---
const STORAGE = {
  equipe: "tds_equipe",
  logo: "tds_logo",
  historico: "tds_hist"
};

let equipe = JSON.parse(localStorage.getItem(STORAGE.equipe) || "[]");
let historico = JSON.parse(localStorage.getItem(STORAGE.historico) || "{}");
let logoData = localStorage.getItem(STORAGE.logo) || null;

// --- RENDER EQUIPE ---
function renderEquipe(){
  const lista = document.getElementById("lista-funcionarios");
  const total = document.getElementById("total-funcionarios");
  lista.innerHTML = "";

  equipe.sort((a,b)=>a.localeCompare(b)).forEach(nome=>{
    const li = document.createElement("li");
    li.className="list-item-row";
    li.innerHTML = `
      <span>${nome}</span>
      <button class="danger small" onclick="remover('${nome}')">X</button>
    `;
    lista.appendChild(li);
  });

  total.textContent = equipe.length;
}

// --- REMOVER ---
function remover(nome){
  equipe = equipe.filter(n=>n!==nome);
  localStorage.setItem(STORAGE.equipe, JSON.stringify(equipe));
  renderEquipe();
  renderPresenca();
}

// --- ADICIONAR ---
document.getElementById("form-add-funcionario").addEventListener("submit", e=>{
  e.preventDefault();
  const nome = document.getElementById("nome-funcionario").value.trim();
  if(!nome) return;
  equipe.push(nome);
  localStorage.setItem(STORAGE.equipe, JSON.stringify(equipe));
  document.getElementById("nome-funcionario").value="";
  renderEquipe();
  renderPresenca();
});

// --- PRESENÇA ---
function renderPresenca(){
  const ul = document.getElementById("lista-presenca");
  const total = document.getElementById("total-presentes");
  ul.innerHTML="";

  equipe.forEach(nome=>{
    const li=document.createElement("li");
    li.className="list-item-row";
    li.innerHTML=`
      <label style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" value="${nome}">
        ${nome}
      </label>
    `;
    ul.appendChild(li);
  });

  ul.addEventListener("change",()=>{
    total.textContent = getPresentes().length;
  });

  total.textContent="0";
}

function getPresentes(){
  return [...document.querySelectorAll("#lista-presenca input:checked")].map(e=>e.value);
}

// --- GERAR ESCALA ---
document.getElementById("btn-gerar").addEventListener("click", ()=>{
  const presentes = getPresentes();
  if(presentes.length===0) return alert("Selecione pelo menos 1 nome!");

  // auto preenchimento
  document.getElementById("edit-t1").value = presentes.slice(0,Math.ceil(presentes.length/2)).join(", ");
  document.getElementById("edit-t2").value = presentes.slice(Math.ceil(presentes.length/2)).join(", ");
  
  document.getElementById("lanche1").value = presentes.join(", ");
  document.getElementById("lanche2").value = "";
  document.getElementById("lanche3").value = "";

  document.getElementById("setor1").value = presentes[0]||"";
  document.getElementById("setor2").value = presentes[1]||"";
  document.getElementById("setor3").value = presentes[2]||"";

  document.getElementById("bar1").value = presentes[0]||"";
  document.getElementById("bar2").value = presentes[1]||"";

  gerarPreview();
});

// --- PREVIEW ---
function gerarPreview(){
  const preview=document.getElementById("preview");
  preview.classList.remove("empty");

  preview.innerHTML = `
    <div class="escala-documento">
      ${logoData ? `<img src="${logoData}" style="max-width:120px;margin:auto;display:block">` : ""}
      <h2>Escala Terra do Sol</h2>
      <p>${document.getElementById("data-dia").value}</p>

      <h3>🍽 Almoço</h3>
      1ª turma: ${document.getElementById("edit-t1").value}<br>
      2ª turma: ${document.getElementById("edit-t2").value}<br><br>

      <h3>☕ Lanche</h3>
      1ª: ${document.getElementById("lanche1").value}<br>
      2ª: ${document.getElementById("lanche2").value}<br>
      3ª: ${document.getElementById("lanche3").value}<br><br>

      <h3>🧺 Aparadores</h3>
      Setor1: ${document.getElementById("setor1").value}<br>
      Setor2: ${document.getElementById("setor2").value}<br>
      Setor3: ${document.getElementById("setor3").value}<br><br>

      <h3>🍹 Bar</h3>
      Bar1: ${document.getElementById("bar1").value}<br>
      Bar2: ${document.getElementById("bar2").value}<br>
    </div>
  `;

  document.getElementById("btn-imprimir").disabled=false;
}

// --- IMPRESSÃO ---
document.getElementById("btn-imprimir").addEventListener("click", ()=>{
  localStorage.setItem(STORAGE.historico, JSON.stringify(historico));
  const printArea=document.getElementById("print-area");
  printArea.innerHTML=document.getElementById("preview").innerHTML;
  window.print();
});

// --- LOGO ---
document.getElementById("input-logo").addEventListener("change", e=>{
  const file=e.target.files[0];
  const reader=new FileReader();
  reader.onload=()=>{ 
    logoData=reader.result;
    localStorage.setItem(STORAGE.logo, logoData);
    document.getElementById("logo-preview").innerHTML=`<img src="${logoData}" />`;
  };
  reader.readAsDataURL(file);
});

// --- INIT ---
renderEquipe();
renderPresenca();
if(logoData) document.getElementById("logo-preview").innerHTML=`<img src="${logoData}">`;
