document.addEventListener("DOMContentLoaded", () => {

  /* helpers */
  const uid = (len = 8) => Math.random().toString(36).substr(2, len).toUpperCase();
  const nowISO = () => new Date().toISOString();
  const timeDisplay = iso => iso ? new Date(iso).toLocaleTimeString() : "—";
  const duration = (sIso, eIso) => {
    if (!sIso || !eIso) return "—";
    const s = new Date(sIso), e = new Date(eIso);
    const mins = Math.floor((e - s) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  /* state */
  let clients = JSON.parse(localStorage.getItem("clients")) || [];
  let presentes = JSON.parse(localStorage.getItem("presentes")) || [];
  let historico = JSON.parse(localStorage.getItem("historico")) || [];

  const saveAll = () => {
    localStorage.setItem("clients", JSON.stringify(clients));
    localStorage.setItem("presentes", JSON.stringify(presentes));
    localStorage.setItem("historico", JSON.stringify(historico));
  };

  /* tabs */
  function abrirAba(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    const btn = Array.from(document.querySelectorAll(".tab")).find(x => x.getAttribute("onclick") === `abrirAba('${id}')`);
    if (btn) btn.classList.add("active");
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }
  window.abrirAba = abrirAba;

  /* idade automática */
  document.getElementById("dataNascimento").addEventListener("change", () => {
    const v = document.getElementById("dataNascimento").value;
    if (!v) { document.getElementById("idadeCrianca").value = ""; return; }
    const nascimento = new Date(v);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    if (idade < 0) idade = 0;
    document.getElementById("idadeCrianca").value = idade;
  });

  /* seleção de setor */
  let setorSelecionado = null;
  document.querySelectorAll(".setor-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".setor-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      setorSelecionado = card.dataset.setor;
      atualizarCorPulseira();
    });
  });

  /* cor pulseira automática */
  function atualizarCorPulseira() {
    if (document.getElementById("manualPulseira").checked) return;
    const altura = document.getElementById("alturaCrianca").value;
    const idade = parseInt(document.getElementById("idadeCrianca").value, 10);
    let cor = "";
    if (!altura || isNaN(idade)) {
      cor = "";
    } else if (altura === "<1m") {
      cor = "Rosa";
    } else if (altura === ">=1m" && idade < 6) {
      cor = "Azul";
    } else {
      cor = "Verde";
    }
    document.getElementById("corPulseira").value = cor;
  }
  document.getElementById("alturaCrianca").addEventListener("change", atualizarCorPulseira);
  document.getElementById("manualPulseira").addEventListener("change", () => {
    if (document.getElementById("manualPulseira").checked) {
      document.getElementById("corPulseira").removeAttribute("readonly");
    } else {
      document.getElementById("corPulseira").setAttribute("readonly", "");
      atualizarCorPulseira();
    }
  });

  /* QR Code */
  let qrcode = new QRCode(document.getElementById("qrcodeGerado"), {
    width: 130,
    height: 130,
  });

  /* gerar QR ao mudar nome */
  function gerarQr(id) {
    qrcode.clear();
    qrcode.makeCode(id);
    document.getElementById("qrIdLabel").textContent = id;
  }

  /* limpar formulário */
  function limparFormulario() {
    document.getElementById("nomeCrianca").value = "";
    document.getElementById("dataNascimento").value = "";
    document.getElementById("idadeCrianca").value = "";
    document.getElementById("alturaCrianca").value = "";
    document.getElementById("alergias").value = "";
    document.getElementById("podeSairSozinho").value = "nao";
    document.getElementById("nomeResp").value = "";
    document.getElementById("telefoneResp").value = "";
    document.getElementById("emailResp").value = "";
    setorSelecionado = null;
    document.querySelectorAll(".setor-card").forEach(c => c.classList.remove("selected"));
    document.getElementById("numeroMesa").value = "";
    document.getElementById("corPulseira").value = "";
    document.getElementById("manualPulseira").checked = false;
    document.getElementById("corPulseira").setAttribute("readonly", "");
    qrcode.clear();
    document.getElementById("qrIdLabel").textContent = "Nenhum";
  }

  /* salvar cadastro */
  document.getElementById("registrarCadastro").addEventListener("click", () => {
    const nome = document.getElementById("nomeCrianca").value.trim();
    const dataNasc = document.getElementById("dataNascimento").value;
    const idade = parseInt(document.getElementById("idadeCrianca").value, 10);
    const altura = document.getElementById("alturaCrianca").value;
    const alergias = document.getElementById("alergias").value.trim();
    const podeSair = document.getElementById("podeSairSozinho").value;
    const nomeResp = document.getElementById("nomeResp").value.trim();
    const telefoneResp = document.getElementById("telefoneResp").value.trim();
    const emailResp = document.getElementById("emailResp").value.trim();
    const mesa = document.getElementById("numeroMesa").value.trim();
    const pulseira = document.getElementById("corPulseira").value.trim();

    if (!nome || !dataNasc || !setorSelecionado || !pulseira) {
      alert("Preencha todos os campos obrigatórios: nome, data de nascimento, setor e pulseira.");
      return;
    }

    const id = uid(6);
    const cadastro = {
      id,
      nome,
      dataNasc,
      idade,
      altura,
      alergias,
      podeSair,
      nomeResp,
      telefoneResp,
      emailResp,
      setor: setorSelecionado,
      mesa,
      pulseira,
      criadoEm: nowISO(),
    };

    clients.push(cadastro);
    saveAll();
    limparFormulario();
    gerarQr(id);
    alert("Cadastro salvo com sucesso!");
  });

  /* baixar QR */
  document.getElementById("baixarQR").addEventListener("click", () => {
    const qrCanvas = document.querySelector("#qrcodeGerado canvas");
    if (!qrCanvas) {
      alert("Gere o QR Code primeiro.");
      return;
    }
    const link = document.createElement("a");
    link.href = qrCanvas.toDataURL("image/png");
    link.download = "qrcode.png";
    link.click();
  });

  /* atualizar listas presentes e histórico */
  function atualizarPresentes() {
    const lista = document.getElementById("listaPresentes");
    lista.innerHTML = "";
    if (presentes.length === 0) {
      lista.innerHTML = "<p>Nenhuma criança presente.</p>";
      return;
    }
    presentes.forEach(p => {
      const item = document.createElement("div");
      item.className = "card-reg";
      item.textContent = `${p.nome} - Setor: ${p.setor} - Chegada: ${new Date(p.entrada).toLocaleTimeString()}`;
      lista.appendChild(item);
    });
  }

  function atualizarHistorico() {
    const lista = document.getElementById("listaHistorico");
    lista.innerHTML = "";
    if (historico.length === 0) {
      lista.innerHTML = "<p>Nenhum histórico registrado.</p>";
      return;
    }
    historico.forEach(h => {
      const item = document.createElement("div");
      item.className = "card-reg";
      item.innerHTML = `
        <strong>${h.nome}</strong><br/>
        Entrada: ${timeDisplay(h.entrada)} <br/>
        Saída: ${timeDisplay(h.saida)} <br/>
        Duração: ${duration(h.entrada, h.saida)}
      `;
      lista.appendChild(item);
    });
  }

  atualizarPresentes();
  atualizarHistorico();

  /* exportar CSV */
  document.getElementById("exportCsv").addEventListener("click", () => {
    if (historico.length === 0) {
      alert("Nenhum histórico para exportar.");
      return;
    }
    const csvRows = [];
    const headers = ["ID", "Nome", "Entrada", "Saída", "Duração"];
    csvRows.push(headers.join(","));
    historico.forEach(h => {
      const row = [
        h.id || "",
        `"${h.nome}"`,
        h.entrada || "",
        h.saida || "",
        duration(h.entrada, h.saida),
      ];
      csvRows.push(row.join(","));
    });
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  /* limpar histórico */
  document.getElementById("limparHistorico").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
      historico = [];
      saveAll();
      atualizarHistorico();
    }
  });

  /* Leitor QR */
  let html5QrScanner = null;
  const scannerDiv = document.getElementById("qrScanner");
  const resultadoLeitura = document.getElementById("resultadoLeitura");
  let ultimoIdLido = null;

  document.getElementById("iniciarLeitor").addEventListener("click", () => {
    if (html5QrScanner) return;
    html5QrScanner = new Html5Qrcode("qrScanner");
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;
          html5QrScanner.start(
            cameraId,
            { fps: 10, qrbox: 250 },
            qrCodeMessage => {
              resultadoLeitura.style.display = "block";
              resultadoLeitura.textContent = `QR lido: ${qrCodeMessage}`;
              ultimoIdLido = qrCodeMessage;
              registrarEntradaSaida(qrCodeMessage);
            },
            err => {}
          ).catch(err => alert(`Erro ao iniciar câmera: ${err}`));
        } else {
          alert("Nenhuma câmera encontrada.");
        }
      })
      .catch(err => alert(`Erro ao acessar câmeras: ${err}`));
  });

  document.getElementById("pararLeitor").addEventListener("click", () => {
    if (!html5QrScanner) return;
    html5QrScanner.stop().then(() => {
      html5QrScanner.clear();
      html5QrScanner = null;
      resultadoLeitura.style.display = "none";
    });
  });

  /* teste leitura manual */
  document.getElementById("testarLeitura").addEventListener("click", () => {
    if (!ultimoIdLido) {
      alert("Nenhum QR lido ainda.");
      return;
    }
    registrarEntradaSaida(ultimoIdLido);
  });

  /* Registrar entrada e saída */
  function registrarEntradaSaida(id) {
    const cliente = clients.find(c => c.id === id);
    if (!cliente) {
      alert("Cadastro não encontrado para o ID informado.");
      return;
    }
    const presenteIndex = presentes.findIndex(p => p.id === id);

    if (presenteIndex === -1) {
      // Registrar entrada
      const registro = {
        id: cliente.id,
        nome: cliente.nome,
        entrada: nowISO(),
        saida: null,
        setor: cliente.setor,
      };
      presentes.push(registro);
      alert(`${cliente.nome} registrado(a) na entrada.`);
    } else {
      // Registrar saída
      const registro = presentes[presenteIndex];
      registro.saida = nowISO();

      historico.push(registro);
      presentes.splice(presenteIndex, 1);
      alert(`${cliente.nome} registrado(a) na saída.`);
    }
    saveAll();
    atualizarPresentes();
    atualizarHistorico();
  }

  /* Marketing */
  const listaMarketing = document.getElementById("listaClientesMarketing");
  const selecionarTodos = document.getElementById("selecionarTodos");
  const assuntoInput = document.getElementById("assuntoMarketing");
  const mensagemInput = document.getElementById("mensagemMarketing");
  const imagemInput = document.getElementById("imagemMarketing");
  const previewImagem = document.getElementById("previewImagem");

  function montarListaMarketing() {
    listaMarketing.innerHTML = "";
    if (clients.length === 0) {
      listaMarketing.innerHTML = "<p>Nenhum cliente cadastrado.</p>";
      return;
    }
    clients.forEach(c => {
      const div = document.createElement("div");
      div.className = "card-reg";
      div.innerHTML = `
        <label><input type="checkbox" data-id="${c.id}" /> ${c.nome} (${c.telefoneResp || "-"})</label>
      `;
      listaMarketing.appendChild(div);
    });
  }
  montarListaMarketing();

  selecionarTodos.addEventListener("change", () => {
    const checkboxes = listaMarketing.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach(cb => cb.checked = selecionarTodos.checked);
  });

  /* enviar mensagens */
  function enviarMensagem(tipo) {
    const selecionados = Array.from(listaMarketing.querySelectorAll("input[type=checkbox]:checked"));
    if (selecionados.length === 0) {
      alert("Selecione ao menos um cliente.");
      return;
    }
    const assunto = assuntoInput.value.trim();
    const mensagem = mensagemInput.value.trim();
    if (!mensagem) {
      alert("Digite a mensagem.");
      return;
    }

    selecionados.forEach(cb => {
      const id = cb.dataset.id;
      const cliente = clients.find(c => c.id === id);
      if (!cliente) return;

      if (tipo === "whatsapp") {
        // Formatar mensagem e abrir URL para WhatsApp Web/APP
        const msg = encodeURIComponent(`${assunto}\n\n${mensagem}`);
        const telefone = cliente.telefoneResp || "";
        if (!telefone) return;
        window.open(`https://wa.me/${telefone}?text=${msg}`, "_blank");
      } else if (tipo === "sms") {
        alert("Envio de SMS não implementado (pode ser feito com APIs externas).");
      } else if (tipo === "email") {
        alert("Envio de Email não implementado (pode ser feito com APIs externas).");
      }
    });
  }

  document.getElementById("enviarWhatsApp").addEventListener("click", () => enviarMensagem("whatsapp"));
  document.getElementById("enviarSMS").addEventListener("click", () => enviarMensagem("sms"));
  document.getElementById("enviarEmail").addEventListener("click", () => enviarMensagem("email"));

  /* preview imagem marketing */
  imagemInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      previewImagem.innerHTML = "";
      return;
    }
    const url = URL.createObjectURL(file);
    previewImagem.innerHTML = `<img src="${url}" alt="Preview Imagem Marketing" />`;
  });

  /* Abrir aba cadastro ao iniciar */
  abrirAba("cadastro");

});
