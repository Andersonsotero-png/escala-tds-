// app.js - Escala Automática Modo B (com export Excel + PDF incluindo logo)
const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const SHIFTS = ['manhã','tarde','noite'];

// ---- Storage helpers ----
const DB = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch(e){ return fallback; }
  },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};

let employees = DB.get('emps', []);
let settings = DB.get('settings', {
  weekStart: 4,
  minDaysOff: 1,
  maxConsecDefault: 6,
  reqs: {
    manhã: {count:2, funcs:{}},
    tarde: {count:3, funcs:{}},
    noite: {count:3, funcs:{}}
  }
});
let lastSchedule = DB.get('lastSchedule', null);
let history = DB.get('history', []);
let logoDataURL = DB.get('companyLogo', null); // salva logo como dataURL

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

// init
renderLogoPreview();
renderEmployees();
bindForm();
bindSettings();
renderSchedule(lastSchedule);
renderHistory();

// ---- Employee functions (igual) ----
function uid(){ return Date.now().toString(36)+(Math.random().toString(36).slice(2,8)); }

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
  document.getElementById('week-start').value = settings.weekStart;
  document.getElementById('min-days-off').value = settings.minDaysOff;
  document.getElementById('max-consec-default').value = settings.maxConsecDefault;

  document.querySelectorAll('.req-count').forEach(i=>{
    i.value = settings.reqs[i.dataset.shift].count;
  });
  document.querySelectorAll('.req-func').forEach(i=>{
    i.value = funcObjToString(settings.reqs[i.dataset.shift].funcs);
  });

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

  document.querySelectorAll('.req-count').forEach(i=>{
    i.addEventListener('change', ()=> {
      settings.reqs[i.dataset.shift].count = Number(i.value);
      DB.set('settings', settings);
    });
  });
  document.querySelectorAll('.req-func').forEach(i=>{
    i.addEventListener('change', ()=> {
      settings.reqs[i.dataset.shift].funcs = parseFuncString(i.value);
      DB.set('settings', settings);
    });
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

// ---- Utility parsing ----
function parseFuncString(s){
  const obj = {};
  (s||'').split(';').map(p=>p.trim()).filter(Boolean).forEach(part=>{
    const [k,v] = part.split(':').map(x=>x.trim());
    if(k && v) obj[k] = Number(v);
  });
  return obj;
}
function funcObjToString(obj){
  if(!obj) return '';
  return Object.entries(obj).map(([k,v])=>`${k}:${v}`).join(';');
}

// ---- Scheduling algorithm (mesma heurística) ----
function generateWeekSchedule(){
  for(const s of SHIFTS){
    if(typeof settings.reqs[s].funcs === 'string') settings.reqs[s].funcs = parseFuncString(settings.reqs[s].funcs);
  }
  employees.forEach(e=>{ e.assignedThisWeek = 0; e.assignedDays = []; });

  const schedule = [];
  for(let day=0; day<7; day++){
    const dayObj = {dayIndex:day, shifts:{}};
    for(const shift of SHIFTS){
      dayObj.shifts[shift] = {assigned: []};
      const req = settings.reqs[shift] || {count:0, funcs:{}};
      const needed = req.count || 0;

      const funcs = {...(req.funcs||{})};
      for(const funcName in funcs){
        let needNum = funcs[funcName];
        for(let i=0;i<needNum;i++){
          const candidate = pickCandidate(day, shift, funcName);
          if(candidate){
            assign(candidate, day, shift, dayObj.shifts[shift]);
          } else {
            dayObj.shifts[shift].assigned.push({name: `FALTA(${funcName})`, role: funcName, placeholder:true});
          }
        }
      }

      while(dayObj.shifts[shift].assigned.filter(a=>!a.placeholder).length < needed){
        const candidate = pickCandidate(day, shift, null);
        if(!candidate) {
          dayObj.shifts[shift].assigned.push({name: 'FALTA', role:'', placeholder:true});
          break;
        }
        assign(candidate, day, shift, dayObj.shifts[shift]);
      }
    }
    schedule.push(dayObj);
  }
  return {generatedAt: new Date().toISOString(), schedule, settingsSnapshot: settings, employeesSnapshot: employees.map(e=>({id:e.id,name:e.name,role:e.role}))};
}

function pickCandidate(day, shift, funcName){
  const candidates = employees.filter(e=>{
    if(!e.availDays || !e.availDays.includes(day)) return false;
    if(!e.shifts || !e.shifts.includes(shift)) return false;
    const lastAssignedDays = e.assignedDays || [];
    if(lastAssignedDays.includes(day)) return false;
    let consec = 0;
    for(let d=day-1; d>=0 && lastAssignedDays.includes(d); d--){
      consec++;
    }
    const maxAllowed = e.maxConsec || settings.maxConsecDefault;
    if(consec >= maxAllowed) return false;
    return true;
  });

  if(candidates.length===0) return null;

  let pool = candidates;
  if(funcName){
    const match = candidates.filter(c=>c.role.toLowerCase() === funcName.toLowerCase());
    if(match.length>0) pool = match;
  }

  pool.sort((a,b)=> a.assignedThisWeek - b.assignedThisWeek || Math.random()-0.5);
  return pool[0];
}

function assign(emp, day, shift, shiftObj){
  shiftObj.assigned.push({id:emp.id, name:emp.name, role:emp.role});
  emp.assignedThisWeek = (emp.assignedThisWeek || 0) + 1;
  emp.assignedDays = emp.assignedDays || [];
  emp.assignedDays.push(day);
}

// ---- Render schedule ----
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
    SHIFTS.forEach(shift=>{
      const sc = document.createElement('div');
      sc.className = 'shift-card';
      const items = dayObj.shifts[shift].assigned.map(a=>{
        if(a.placeholder) return `<div class="muted small">${a.name}${a.role? ' ('+a.role+')':''}</div>`;
        return `<div><strong>${a.name}</strong> <span class="muted small">— ${a.role}</span></div>`;
      }).join('');
      sc.innerHTML = `<strong>${capitalize(shift)}</strong><div>${items || '<span class="muted">—</span>'}</div>`;
      sc.addEventListener('click', ()=> manualEdit(dayObj.dayIndex, shift));
      shiftsDiv.appendChild(sc);
    });
    db.appendChild(shiftsDiv);
    scheduleArea.appendChild(db);
  });
}

function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// ---- Manual edit (igual) ----
function manualEdit(dayIndex, shift){
  const avail = employees.filter(e=> e.availDays.includes(dayIndex) && e.shifts.includes(shift));
  const options = ['(Remover pessoa)','(Deixar inconcluso/FALTA)'].concat(avail.map(a=>`${a.name} — ${a.role}`));
  const pick = prompt(`Editar ${DAYS[dayIndex]} ${capitalize(shift)}:\nEscolha índice:\n` + options.map((o,i)=>`${i}: ${o}`).join('\n'));
  if(pick === null) return;
  const idx = Number(pick);
  if(Number.isNaN(idx) || idx < 0 || idx >= options.length) return alert('Escolha inválida');

  const slot = lastSchedule.schedule[dayIndex].shifts[shift];
  if(idx === 0){
    const ni = slot.assigned.findIndex(a=>!a.placeholder);
    if(ni>=0) slot.assigned.splice(ni,1);
  } else if(idx===1){
    slot.assigned.push({name:'FALTA', role:'', placeholder:true});
  } else {
    const emp = avail[idx-2];
    slot.assigned.push({id:emp.id, name:emp.name, role:emp.role});
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

// ---- EXPORT / PRINT functions ----
function showExportOptions(){
  if(!lastSchedule) return alert('Gere uma escala primeiro');
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

    // inserir logo se existir
    if(logoDataURL){
      // extrair mime e base64
      const match = logoDataURL.match(/^data:(image\/\w+);base64,(.+)$/);
      if(match){
        const mime = match[1];
        const base64 = match[2];
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
        const imageId = workbook.addImage({base64: base64, extension: ext});
        // inserir no topo (celulas A1:C3)
        sheet.addImage(imageId, {tl: {col:0, row:0}, br: {col:3, row:3}});
      }
    }

    // header com data
    sheet.mergeCells('D1','G2');
    sheet.getCell('D1').value = `Escala gerada em: ${new Date(sched.generatedAt).toLocaleString()}`;

    // tabela: dias x turnos
    // cabeçalho
    sheet.getRow(5).values = ['Dia', 'Manhã', 'Tarde', 'Noite'];
    sheet.getRow(5).font = {bold:true};

    let rowIndex = 6;
    sched.schedule.forEach(dayObj=>{
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = DAYS[dayObj.dayIndex];
      SHIFTS.forEach((shift, i)=>{
        const cell = row.getCell(i+2);
        const assigned = dayObj.shifts[shift].assigned.map(a => a.placeholder ? a.name : `${a.name} (${a.role})`);
        cell.value = assigned.join(', ') || '';
      });
      rowIndex++;
    });

    // ajustar larguras
    sheet.columns.forEach((col, idx)=> {
      col.width = idx === 0 ? 12 : 40;
    });

    // gerar arquivo
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(blob, `escala_${(new Date()).toISOString().slice(0,10)}.xlsx`);
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar Excel: ' + e.message);
  }
}

// PDF export usando html2canvas + jsPDF
async function exportPDF(sched){
  try {
    // criar um container invisível com layout para print que inclui a logo
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

    // tabela
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '12px';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Dia</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Manhã</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Tarde</th>
      <th style="border:1px solid #ddd;padding:6px;background:#f3f3f3">Noite</th>
    </tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    sched.schedule.forEach(dayObj=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #ddd;padding:6px;vertical-align:top">${DAYS[dayObj.dayIndex]}</td>
        <td style="border:1px solid #ddd;padding:6px;vertical-align:top">${dayObj.shifts['manhã'].assigned.map(a=> a.placeholder ? a.name : `${a.name} (${a.role})`).join('<br>')}</td>
        <td style="border:1px solid #ddd;padding:6px;vertical-align:top">${dayObj.shifts['tarde'].assigned.map(a=> a.placeholder ? a.name : `${a.name} (${a.role})`).join('<br>')}</td>
        <td style="border:1px solid #ddd;padding:6px;vertical-align:top">${dayObj.shifts['noite'].assigned.map(a=> a.placeholder ? a.name : `${a.name} (${a.role})`).join('<br>')}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);

    document.body.appendChild(wrapper);
    // renderizar com html2canvas
    const canvas = await html2canvas(wrapper, {scale:2, useCORS:true});
    const imgData = canvas.toDataURL('image/png');
    // criar pdf com jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // calcular imagem para caber na página com margens
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
