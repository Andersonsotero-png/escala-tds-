// app.js - Escala Automática Modo B (configuração extraída da imagem: Salão, Coqueiro, GuardaSol)
// Gera escala preenchendo POSTS fixos por setor; quinta-feira só permite turno 'noite'.
// Exporta Excel (ExcelJS) com logo embutida e PDF (html2canvas + jsPDF).

const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const SHIFTS = ['manhã','tarde','noite'];

// ---- Config extraída automaticamente da imagem ----
const CONFIG = {
  sectors: {
    Salao: {
      key: 'Salao',
      color: '#2f76c6',
      posts: [
        "S. SUP 01","S. SUP 02","S. SUP 03",
        "S. ESQ 01","S. ESQ 02","S. ESQ 03","S. ESQ 04","S. ESQ 05","S. ESQ 06",
        "S. DIR 01","S. DIR 02","S. DIR 03","S. DIR 04","S. DIR 05",
        "S. DIR 06","S. DIR 07","S. DIR 08","S. DIR 09","S. DIR 10",
        "S. DIR 11","S. DIR 12","S. DIR 13","S. DIR 14","S. DIR 15",
        "S. DIR 16","S. DIR 17","S. DIR 18","S. DIR 19"
      ]
    },
    Coqueiro: {
      key: 'Coqueiro',
      color: '#2bb673',
      posts: [
        "Coq. ESQ 01","Coq. ESQ 02","Coq. ESQ 03","Coq. ESQ 04","Coq. ESQ 05",
        "Coq. DIR 01","Coq. DIR 02","Coq. DIR 03","Coq. DIR 04","Coq. DIR 05",
        "Coq. DIR 06","Coq. DIR 07","Coq. DIR 08","Coq. DIR 09","Coq. DIR 10",
        "Coq. PQ 01","Coq. PQ 02","Coq. PQ 03","Coq. PQ 04","Coq. PQ 05"
      ]
    },
    GuardaSol: {
      key: 'GuardaSol',
      color: '#f2994a',
      posts: [
        "G.Sol ESQ 01","G.Sol ESQ 02","G.Sol ESQ 03","G.Sol ESQ 04","G.Sol ESQ 05",
        "G.Sol DIR 01","G.Sol DIR 02","G.Sol DIR 03","G.Sol DIR 04","G.Sol DIR 05",
        "G.Sol DIR 06","G.Sol DIR 07","G.Sol DIR 08","G.Sol DIR 09","G.Sol DIR 10",
        "G.Sol DIR 11","G.Sol DIR 12","G.Sol DIR 13","G.Sol DIR 14","G.Sol DIR 15",
        "G.Sol DIR 16","G.Sol DIR 17"
      ]
    }
  },
  week: {
    days: DAYS,
    specialRules: [
      // quinta-feira (index 3): somente turno noite
      { name: 'Quinta - só noite', dayIndex: 3, allowedShifts: ['noite'] }
    ]
  },
  export: { excel: { includeLogo:true, colorBySector:true }, pdf: { includeLogo:true, colorBySector:true } }
};

// ---- Storage helpers ----
const DB = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch(e){ return fallback; }
  },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};

let employees = DB.get('emps', []); // {id,name,role,availDays:[0..6],shifts:['manhã'],maxConsec}
let settings = DB.get('settings', { weekStart:4, minDaysOff:1, maxConsecDefault:6, reqs:{} });
let lastSchedule = DB.get('lastSchedule', null);
let history = DB.get('history', []);
let logoDataURL = DB.get('companyLogo', null);

// ---- UI refs ----
const empForm = document.getElementById('employee-form');
const employeesList = document.getElementById('employees-list');
const btnGenerate = document.getElementById('btn-generate');
const scheduleArea = document.getElementById('schedule-area');
const btnExport = document.getElementById('btn-export');
const btnSave = document.getElementById('btn-save');
const btnHistory = document.getElementById('btn-history');
const historyEl = document.getElementById('history');
const logoFile = document.getElementById('logo-file');
const logoPreview = document.getElementById('logo-preview');
const btnClearLogo = document.getElementById('btn-clear-logo');
const sectorsListEl = document.getElementById('sectors-list');

// init UI
renderLogoPreview();
renderSectors();
renderEmployees();
bindForm();
bindSettings();
renderSchedule(lastSchedule);
renderHistory();

// ---- helpers ----
function uid(){ return Date.now().toString(36)+(Math.random().toString(36).slice(2,8)); }
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// ---- Render sectors (detected posts) ----
function renderSectors(){
  let html = '';
  for(const k in CONFIG.sectors){
    const sec = CONFIG.sectors[k];
    html += `<div><strong style="color:${sec.color}">${sec.key}</strong>: ${sec.posts.length} postos &nbsp; <span class="muted small">${sec.posts.slice(0,8).join(', ')}${sec.posts.length>8?' ...':''}</span></div>`;
  }
  sectorsListEl.innerHTML = html;
}

// ---- Employee form ----
function bindForm(){
  empForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('emp-name').value.trim();
    const role = document.getElementById('emp-role').value.trim();
    if(!name || !role) return alert('Nome e função obrigatórios');
    const dayChecks = Array.from(empForm.querySelectorAll('.days-checks input[type=checkbox]'));
    const availDays = dayChecks.filter(c=>c.checked).map(c=>Number(c.value));
    const shifts = Array.from(empForm.querySelectorAll('.shift-cb')).filter(n=>n.checked).map(n=>n.value);
    const maxconsec = Number(document.getElementById('emp-maxconsec').value) || settings.maxConsecDefault;

    const existing = employees.find(e=>e.name.toLowerCase()===name.toLowerCase() && e.role===role);
    if(existing){
      existing.availDays = availDays;
      existing.shifts = shifts;
      existing.maxConsec = maxconsec;
    } else {
      employees.push({id:uid(), name, role, availDays, shifts, maxConsec: maxconsec, assignedThisWeek:0});
    }
    DB.set('emps', employees);
    renderEmployees();
    empForm.reset();
  });

  document.getElementById('btn-clear-emps').addEventListener('click', ()=>{
    if(!confirm('Remover todos os funcionários?')) return;
    employees = [];
    DB.set('emps', employees);
    renderEmployees();
  });
}

function renderEmployees(){
  employeesList.innerHTML = '';
  if(employees.length===0){
    employeesList.innerHTML = '<div class="muted">Nenhum funcionário cadastrado</div>';
    return;
  }
  employees.forEach(emp=>{
    const div = document.createElement('div');
    div.className = 'employee-card';
    div.innerHTML = `
      <div>
        <div><strong>${emp.name}</strong> — <span class="emp-meta">${emp.role}</span></div>
        <div class="small muted">Disponível: ${emp.availDays.map(i=>DAYS[i]).join(', ') || '—'} • Turnos: ${emp.shifts.join(', ') || '—'}</div>
      </div>
      <div>
        <button data-id="${emp.id}" class="edit">Editar</button>
        <button data-id="${emp.id}" class="del muted">Remover</button>
      </div>
    `;
    employeesList.appendChild(div);
  });

  employeesList.querySelectorAll('button.edit').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = b.dataset.id;
      const emp = employees.find(x=>x.id===id);
      if(!emp) return;
      document.getElementById('emp-name').value = emp.name;
      document.getElementById('emp-role').value = emp.role;
      document.querySelectorAll('.days-checks input').forEach(c=>c.checked = emp.availDays.includes(Number(c.value)));
      document.querySelectorAll('.shift-cb').forEach(c=>c.checked = emp.shifts.includes(c.value));
      document.getElementById('emp-maxconsec').value = emp.maxConsec || settings.maxConsecDefault;
    });
  });

  employeesList.querySelectorAll('button.del').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = b.dataset.id;
      if(!confirm('Remover este funcionário?')) return;
      employees = employees.filter(x=>x.id!==id);
      DB.set('emps', employees);
      renderEmployees();
    });
  });
}

// ---- Settings & actions ----
function bindSettings(){
  document.getElementById('week-start').value = settings.weekStart || 4;
  document.getElementById('min-days-off').value = settings.minDaysOff || 1;
  document.getElementById('max-consec-default').value = settings.maxConsecDefault || 6;

  document.getElementById('week-start').addEventListener('change', ()=> {
    settings.weekStart = Number(document.getElementById('week-start').value);
    DB.set('settings', settings);
  });
  document.getElementById('min-days-off').addEventListener('change', ()=> {
    settings.minDaysOff = Number(document.getElementById('min-days-off').value);
    DB.set('settings', settings);
  });
  document.getElementById('max-consec-default').addEventListener('change', ()=>{
    settings.maxConsecDefault = Number(document.getElementById('max-consec-default').value);
    DB.set('settings', settings);
  });

  btnGenerate.addEventListener('click', ()=> {
    if(employees.length===0) return alert('Cadastre pelo menos 1 funcionário');
    const sched = generateWeekSchedule();
    lastSchedule = sched;
    DB.set('lastSchedule', sched);
    renderSchedule(sched);
  });

  btnExport.addEventListener('click', showExportOptions);

  btnSave.addEventListener('click', ()=>{
    if(!lastSchedule) return alert('Gere uma escala primeiro');
    history.unshift({date: new Date().toISOString(), schedule:lastSchedule});
    DB.set('history', history);
    alert('Escala salva no histórico');
    renderHistory();
  });

  btnHistory.addEventListener('click', ()=> {
    historyEl.style.display = historyEl.style.display === 'block' ? 'none' : 'block';
  });

  // logo upload
  logoFile.addEventListener('change', e=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=> {
      logoDataURL = reader.result;
      DB.set('companyLogo', logoDataURL);
      renderLogoPreview();
    };
    reader.readAsDataURL(f);
  });
  btnClearLogo.addEventListener('click', ()=>{
    if(!confirm('Remover logo?')) return;
    logoDataURL = null;
    DB.set('companyLogo', null);
    renderLogoPreview();
  });
}

function renderLogoPreview(){
  if(!logoDataURL){
    logoPreview.innerHTML = 'Nenhuma logo carregada';
    return;
  }
  logoPreview.innerHTML = `<img src="${logoDataURL}" alt="logo" style="max-height:40px">`;
}

// ---- Scheduling algorithm (por POSTS) ----
function generateWeekSchedule(){
  // Reset counters
  employees.forEach(e=>{ e.assignedThisWeek = 0; e.assignedDays = []; });

  // Build schedule: for each day index, for each shift, produce array of assigned {post, name, role}
  const schedule = [];
  for(let day=0; day<7; day++){
    const dayObj = { dayIndex: day, shifts: {} };
    for(const shift of SHIFTS){
      // check special rule: if today has restriction, skip shifts not allowed
      const special = CONFIG.week.specialRules.find(r => r.dayIndex === day);
      if(special && !special.allowedShifts.includes(shift)){
        dayObj.shifts[shift] = { assigned: [], disabled: true };
        continue;
      }
      // collect all posts for this shift: default we assume all posts are active each shift,
      // but you can tune later to only show specific posts on specific shifts.
      // For now: fill posts across sectors in this order: Salao, Coqueiro, GuardaSol
      const posts = [];
      for(const sk of Object.keys(CONFIG.sectors)){
        const sec = CONFIG.sectors[sk];
        // For restaurants often not all posts active at all shifts. We'll include all posts but if you want subset per shift, we can configure.
        sec.posts.forEach(p => posts.push({ post: p, sector: sec.key, color: sec.color }));
      }

      // attempt to assign each post to a candidate
      const assigned = [];
      posts.forEach(postInfo => {
        const candidate = pickCandidateForPost(day, shift, postInfo);
        if(candidate){
          assigned.push({ post: postInfo.post, sector: postInfo.sector, name: candidate.name, role: candidate.role, id: candidate.id });
          // mark assignment on candidate
          candidate.assignedThisWeek = (candidate.assignedThisWeek||0) + 1;
          candidate.assignedDays = candidate.assignedDays || [];
          candidate.assignedDays.push(day);
        } else {
          assigned.push({ post: postInfo.post, sector: postInfo.sector, name: null, role: null, placeholder: true });
        }
      });

      dayObj.shifts[shift] = { assigned, disabled:false };
    }
    schedule.push(dayObj);
  }

  return { generatedAt: new Date().toISOString(), schedule, configSnapshot: CONFIG };
}

// picks candidate based on availability & least assignments
function pickCandidateForPost(day, shift, postInfo){
  // filter by employees available this day and shift
  const candidates = employees.filter(e=>{
    if(!e.availDays || !e.availDays.includes(day)) return false;
    if(!e.shifts || !e.shifts.includes(shift)) return false;
    if((e.assignedDays||[]).includes(day)) return false; // already working today
    // consecutive constraint
    let consec = 0;
    for(let d=day-1; d>=0; d--){
      if((e.assignedDays||[]).includes(d)) consec++;
      else break;
    }
    const maxAllowed = e.maxConsec || settings.maxConsecDefault || 6;
    if(consec >= maxAllowed) return false;
    return true;
  });

  if(candidates.length === 0) return null;

  // prefer candidates with matching role word (if post contains hints like 'DIR' or 'SUP' we don't enforce)
  // sort by least assignedThisWeek
  candidates.sort((a,b)=> (a.assignedThisWeek||0) - (b.assignedThisWeek||0) || Math.random()-0.5);
  return candidates[0];
}

// ---- Render schedule visually ----
function renderSchedule(obj){
  scheduleArea.innerHTML = '';
  if(!obj){
    scheduleArea.innerHTML = '<div class="muted">Nenhuma escala gerada ainda. Clique em "Gerar escala da próxima semana".</div>';
    return;
  }

  const header = document.createElement('div');
  header.innerHTML = `<div class="small muted">Gerada em: ${new Date(obj.generatedAt).toLocaleString()}</div>`;
  scheduleArea.appendChild(header);

  obj.schedule.forEach(dayObj=>{
    const db = document.createElement('div');
    db.className = 'day-block';
    db.innerHTML = `<h4>${DAYS[dayObj.dayIndex]}</h4>`;
    const shiftsDiv = document.createElement('div');
    shiftsDiv.className = 'shift-list';
    for(const shift of SHIFTS){
      const sc = document.createElement('div');
      sc.className = 'shift-card';
      if(dayObj.shifts[shift].disabled){
        sc.innerHTML = `<strong>${capitalize(shift)}</strong><div class="muted small">-- não opera neste turno --</div>`;
      } else {
        // build content grouped by sector
        const bySector = {};
        dayObj.shifts[shift].assigned.forEach(a=>{
          if(!bySector[a.sector]) bySector[a.sector] = [];
          bySector[a.sector].push(a);
        });
        let inner = `<strong>${capitalize(shift)}</strong>`;
        for(const secName in bySector){
          inner += `<div style="margin-top:6px"><em>${secName}</em><div>`;
          bySector[secName].forEach(p=>{
            if(p.placeholder) inner += `<div class="muted small">${p.post} — FALTA</div>`;
            else inner += `<div><span class="post-badge ${secName==='Salao'?'post-salao':secName==='Coqueiro'?'post-coq':'post-gsol'}">${p.post}</span> ${p.name}</div>`;
          });
          inner += `</div></div>`;
        }
        sc.innerHTML = inner;
      }
      // manual edit on click
      sc.addEventListener('click', ()=> manualEdit(dayObj.dayIndex, shift));
      shiftsDiv.appendChild(sc);
    }
    db.appendChild(shiftsDiv);
    scheduleArea.appendChild(db);
  });
}

// ---- Manual edit (simplificado) ----
function manualEdit(dayIndex, shift){
  if(!lastSchedule) lastSchedule = generateWeekSchedule();
  const slot = lastSchedule.schedule[dayIndex].shifts[shift];
  if(slot.disabled) return alert('Turno inativo (regra especial).');

  // collect available employees for that day/shift
  const avail = employees.filter(e=> e.availDays.includes(dayIndex) && e.shifts.includes(shift));
  const options = ['(Cancelar / não alterar)','(Marcar FALTA)'].concat(avail.map(a=>`${a.name} — ${a.role}`));
  const pick = prompt(`Editar ${DAYS[dayIndex]} ${capitalize(shift)}:\nEscolha índice para ADICIONAR no final do turno:\n` + options.map((o,i)=>`${i}: ${o}`).join('\n'));
  if(pick === null) return;
  const idx = Number(pick);
  if(Number.isNaN(idx) || idx < 0 || idx >= options.length) return alert('Escolha inválida');

  if(idx === 0) return;
  if(idx === 1){
    slot.assigned.push({ post: 'MANUAL', sector: 'Manual', name: null, placeholder: true });
  } else {
    const emp = avail[idx-2];
    slot.assigned.push({ post: 'MANUAL', sector: 'Manual', name: emp.name, role: emp.role, id: emp.id });
    emp.assignedThisWeek = (emp.assignedThisWeek||0) + 1;
    emp.assignedDays = emp.assignedDays || [];
    emp.assignedDays.push(dayIndex);
  }
  DB.set('lastSchedule', lastSchedule);
  renderSchedule(lastSchedule);
}

// ---- History ----
function renderHistory(){
  historyEl.innerHTML = '';
  if(history.length===0){
    historyEl.innerHTML = '<div class="muted">Nenhuma escala salva no histórico</div>';
    return;
  }
  history.forEach((h, i)=>{
    const d = document.createElement('div');
    d.className = 'employee-card';
    d.innerHTML = `<div><strong>${new Date(h.date).toLocaleString()}</strong><div class="small muted">Clique para visualizar</div></div><div><button data-i="${i}" class="view">Abrir</button></div>`;
    historyEl.appendChild(d);
  });
  historyEl.querySelectorAll('button.view').forEach(b=>{
    b.addEventListener('click', ()=>{
      const i = Number(b.dataset.i);
      lastSchedule = history[i].schedule;
      DB.set('lastSchedule', lastSchedule);
      renderSchedule(lastSchedule);
    });
  });
}

// ---- EXPORT / PRINT ----
function showExportOptions(){
  if(!lastSchedule) { lastSchedule = generateWeekSchedule(); DB.set('lastSchedule', lastSchedule); renderSchedule(lastSchedule); }
  const opt = prompt('Escolha opção de exportação:\n1 - Exportar Excel (.xlsx)\n2 - Exportar PDF\n3 - Imprimir (visual)\nDigite 1, 2 ou 3');
  if(opt === null) return;
  if(opt === '1') exportExcel(lastSchedule);
  else if(opt === '2') exportPDF(lastSchedule);
  else if(opt === '3') window.print();
  else alert('Opção inválida');
}

// Excel export usando ExcelJS + FileSaver
async function exportExcel(sched){
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EscalaApp';
    const sheet = workbook.addWorksheet('Escala');

    // inserir logo se existir (A1:C4)
    if(logoDataURL){
      const match = logoDataURL.match(/^data:(image\/\w+);base64,(.+)$/);
      if(match){
        const mime = match[1];
        const base64 = match[2];
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
        const imageId = workbook.addImage({base64: base64, extension: ext});
        sheet.addImage(imageId, {tl: {col:0, row:0}, br: {col:3, row:4}});
      }
    }

    sheet.getCell('D1').value = `Escala gerada em: ${new Date(sched.generatedAt).toLocaleString()}`;
    sheet.getRow(6).values = ['Dia','Turno','Posto','Setor','Funcionário'];
    sheet.getRow(6).font = {bold:true};

    let rowIndex = 7;
    sched.schedule.forEach(dayObj=>{
      for(const shift of SHIFTS){
        const slot = dayObj.shifts[shift];
        if(slot.disabled){
          const row = sheet.getRow(rowIndex++);
          row.getCell(1).value = DAYS[dayObj.dayIndex];
          row.getCell(2).value = capitalize(shift);
          row.getCell(3).value = '--';
          row.getCell(4).value = '--';
          row.getCell(5).value = 'Não opera';
          continue;
        }
        slot.assigned.forEach(a=>{
          const row = sheet.getRow(rowIndex++);
          row.getCell(1).value = DAYS[dayObj.dayIndex];
          row.getCell(2).value = capitalize(shift);
          row.getCell(3).value = a.post || '';
          row.getCell(4).value = a.sector || '';
          row.getCell(5).value = a.placeholder ? 'FALTA' : (a.name ? `${a.name} (${a.role||''})` : '');
          // color by sector
          const sec = a.sector;
          if(sec){
            const fillColor = (sec==='Salao' ? 'FF2F76C6' : sec==='Coqueiro' ? 'FF2BB673' : sec==='GuardaSol' ? 'FFF2994A' : null);
            if(fillColor){
              row.getCell(3).fill = { type: 'pattern', pattern:'solid', fgColor:{argb: fillColor} };
            }
          }
        });
      }
    });

    sheet.columns.forEach((c,i)=> c.width = i===0 ? 12 : 30);
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(blob, `escala_${(new Date()).toISOString().slice(0,10)}.xlsx`);
  } catch (e){
    console.error(e);
    alert('Erro ao gerar Excel: ' + e.message);
  }
}

// PDF export usando html2canvas + jsPDF
async function exportPDF(sched){
  try {
    const wrapper = document.createElement('div');
    wrapper.style.width = '900px';
    wrapper.style.padding = '16px';
    wrapper.style.background = '#fff';
    wrapper.style.color = '#000';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.boxSizing = 'border-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '12px';
    if(logoDataURL){
      const img = document.createElement('img');
      img.src = logoDataURL;
      img.style.maxHeight = '60px';
      img.style.objectFit = 'contain';
      header.appendChild(img);
    }
    const title = document.createElement('div');
    title.innerHTML = `<h2 style="margin:0">Escala Semanal</h2><div style="font-size:12px;color:#666">Gerada em: ${new Date(sched.generatedAt).toLocaleString()}</div>`;
    header.appendChild(title);
    wrapper.appendChild(header);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '12px';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Dia</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Turno</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Posto</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Setor</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Funcionário</th>
    </tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    sched.schedule.forEach(dayObj=>{
      for(const shift of SHIFTS){
        const slot = dayObj.shifts[shift];
        if(slot.disabled){
          const tr = document.createElement('tr');
          tr.innerHTML = `<td style="border:1px solid #ddd;padding:6px">${DAYS[dayObj.dayIndex]}</td>
                          <td style="border:1px solid #ddd;padding:6px">${capitalize(shift)}</td>
                          <td style="border:1px solid #ddd;padding:6px">--</td>
                          <td style="border:1px solid #ddd;padding:6px">--</td>
                          <td style="border:1px solid #ddd;padding:6px">Não opera</td>`;
          tbody.appendChild(tr);
          continue;
        }
        slot.assigned.forEach(a=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td style="border:1px solid #ddd;padding:6px">${DAYS[dayObj.dayIndex]}</td>
                          <td style="border:1px solid #ddd;padding:6px">${capitalize(shift)}</td>
                          <td style="border:1px solid #ddd;padding:6px">${a.post||''}</td>
                          <td style="border:1px solid #ddd;padding:6px">${a.sector||''}</td>
                          <td style="border:1px solid #ddd;padding:6px">${a.placeholder?'FALTA':(a.name?`${a.name} (${a.role||''})`: '')}</td>`;
          tbody.appendChild(tr);
        });
      }
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    document.body.appendChild(wrapper);
    const canvas = await html2canvas(wrapper, {scale:2, useCORS:true});
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = {width: canvas.width, height: canvas.height};
    const ratio = Math.min((pageWidth-40)/imgProps.width, (pageHeight-40)/imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`escala_${(new Date()).toISOString().slice(0,10)}.pdf`);
    document.body.removeChild(wrapper);
  } catch (e){
    console.error(e);
    alert('Erro ao gerar PDF: ' + e.message);
  }
}
