const garcons = [];
const ajudantes = [];
const recep = [];

// 🔄 Atualiza tudo na tela
function renderAll() {

    document.getElementById("weekLabel").textContent =
        document.getElementById("weekRange").value;

    // GARÇONS
    const gBody = document.querySelector("#tblGarcons tbody");
    gBody.innerHTML = "";
    garcons.forEach(g => {
        gBody.innerHTML += `
        <tr>
            <td class="sector-${g.sector}">${g.setor}</td>
            <td>${g.posicao}</td>
            <td>${g.nome}</td>
        </tr>`;
    });

    document.getElementById("gList").innerHTML = garcons
        .map(g => `<div>${g.setor} • ${g.posicao} • ${g.nome}</div>`)
        .join("");

    // AJUDANTES
    const aBody = document.querySelector("#tblAjudantes tbody");
    aBody.innerHTML = "";
    ajudantes.forEach(a => {
        aBody.innerHTML += `
        <tr>
            <td>${a.dia}</td>
            <td>${a.turno}</td>
            <td>${a.nome}</td>
        </tr>`;
    });

    document.getElementById("aList").innerHTML = ajudantes
        .map(a => `<div>${a.dia} • ${a.turno} • ${a.nome}</div>`)
        .join("");

    // RECEPCIONISTAS
    const rBody = document.querySelector("#tblRecep tbody");
    rBody.innerHTML = "";
    recep.forEach(r => {
        rBody.innerHTML += `
        <tr>
            <td>${r.dia}</td>
            <td>${r.nome}</td>
        </tr>`;
    });

    document.getElementById("rList").innerHTML = recep
        .map(r => `<div>${r.dia} • ${r.nome}</div>`)
        .join("");
}

// ➕ GARÇOM
document.getElementById("addG").onclick = () => {
    const setorVal = document.getElementById("gSector").value;
    const posicao = document.getElementById("gPosition").value.trim();
    const nome = document.getElementById("gName").value.trim();

    if (!posicao || !nome) return alert("Preencha posição e nome.");

    garcons.push({
        setor: setorVal === "salon" ? "Salão" :
               setorVal === "coq" ? "Coqueiro" : "Guarda-Sol",
        sector: setorVal,
        posicao,
        nome
    });

    document.getElementById("gPosition").value = "";
    document.getElementById("gName").value = "";
    renderAll();
};

// ➕ AJUDANTE
document.getElementById("addA").onclick = () => {
    const dia = document.getElementById("aDay").value;
    const turno = document.getElementById("aShift").value;
    const nome = document.getElementById("aName").value.trim();

    if (!nome) return alert("Preencha o nome.");

    ajudantes.push({ dia, turno, nome });
    document.getElementById("aName").value = "";
    renderAll();
};

// ➕ RECEPCIONISTA
document.getElementById("addR").onclick = () => {
    const dia = document.getElementById("rDay").value;
    const nome = document.getElementById("rName").value.trim();

    if (!nome) return alert("Preencha o nome.");

    recep.push({ dia, nome });
    document.getElementById("rName").value = "";
    renderAll();
};

// 📄 PDF
document.getElementById("exportPdf").onclick = async () => {
    const area = document.getElementById("exportArea");
    const canvas = await html2canvas(area, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const props = pdf.getImageProperties(img);
    const height = (props.height * width) / props.width;

    pdf.addImage(img, "PNG", 0, 5, width, height);
    pdf.save("Escala_Terra_do_Sol.pdf");
};

// 📊 EXCEL
document.getElementById("exportExcel").onclick = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(garcons), "Garçons");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ajudantes), "Ajudantes");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recep), "Recepcionistas");

    XLSX.writeFile(wb, "Escala_Terra_do_Sol.xlsx");
};

// 🖨️ IMPRIMIR
document.getElementById("printBtn").onclick = () => window.print();

renderAll();
