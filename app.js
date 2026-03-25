const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_XsyDwZMGvHt8ASO7Id54rAk4iy7i4gozqZ9GXQKTQqhmqjjje4RIi4MGqCp2aMmQxg/exec";

let clientes = [];
let veiculos = [];
let ordensServico = [];
let itensOS = [];
let checklistFotos = [];
let indiceEdicaoOS = null;
let indiceEdicaoItem = null;

function mostrarLoading(mostrar) {
  document.getElementById("loading").classList.toggle("ativo", !!mostrar);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function apiPost(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.includes("COLE_AQUI_A_URL_DO_SEU_WEB_APP")) {
    throw new Error("Configure a URL do Web App no app.js");
  }

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || "Erro na comunicação com o Apps Script.");
  }

  return data;
}

async function carregarProximoNumeroOS() {
  try {
    const data = await apiPost({ action: "getProximoNumeroOS" });
    const numero = data.proximoNumeroOS || "";
    document.getElementById("osNumero").value = numero;
    return numero;
  } catch (error) {
    console.error("Erro ao carregar próximo número da OS:", error);
    return "";
  }
}

async function carregarDadosIniciais() {
  try {
    mostrarLoading(true);

    const data = await apiPost({ action: "init" });

    clientes = data.clientes || [];
    veiculos = data.veiculos || [];
    ordensServico = data.ordensServico || [];

    ordensServico = ordensServico.map(os => {
      const cliente = clientes.find(c => String(c.id) === String(os.clienteId));
      return {
        ...os,
        clienteTelefone: cliente ? (cliente.telefone || "") : "",
        clienteWhatsapp: cliente ? (cliente.whatsapp || "") : ""
      };
    });

    preencherSelectClientes();
    renderizarOS();

    if (data.proximoNumeroOS) {
      document.getElementById("osNumero").value = data.proximoNumeroOS;
    } else {
      await carregarProximoNumeroOS();
    }
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

function preencherSelectClientes() {
  const selectOS = document.getElementById("osCliente");
  const selectVeiculo = document.getElementById("veiculoCliente");

  selectOS.innerHTML = '<option value="">Selecione</option>';
  selectVeiculo.innerHTML = '<option value="">Selecione</option>';

  clientes.forEach(cliente => {
    const optionOS = document.createElement("option");
    optionOS.value = cliente.id;
    optionOS.textContent = cliente.nome;
    selectOS.appendChild(optionOS);

    const optionVeiculo = document.createElement("option");
    optionVeiculo.value = cliente.id;
    optionVeiculo.textContent = cliente.nome;
    selectVeiculo.appendChild(optionVeiculo);
  });
}

function preencherVeiculosCliente(clienteIdSelecionado = null, veiculoIdSelecionado = null) {
  const clienteId = clienteIdSelecionado || document.getElementById("osCliente").value;
  const selectVeiculo = document.getElementById("osVeiculo");

  selectVeiculo.innerHTML = '<option value="">Selecione</option>';

  veiculos
    .filter(v => String(v.clienteId) === String(clienteId))
    .forEach(veiculo => {
      const option = document.createElement("option");
      option.value = veiculo.id;
      option.textContent = `${veiculo.marca || ""} ${veiculo.modelo || ""} - ${veiculo.placa || ""}`.trim();

      if (String(veiculo.id) === String(veiculoIdSelecionado)) {
        option.selected = true;
      }

      selectVeiculo.appendChild(option);
    });
}

function calcularTotalOS() {
  const total = itensOS.reduce((acc, item) => {
    return acc + (Number(item.quantidade) * Number(item.valor));
  }, 0);

  document.getElementById("totalOS").textContent = formatarMoeda(total);
  return total;
}

function limparCamposItem() {
  document.getElementById("itemDescricao").value = "";
  document.getElementById("itemQuantidade").value = 1;
  document.getElementById("itemValor").value = "";
  indiceEdicaoItem = null;
}

function renderizarItensOS() {
  const tbody = document.getElementById("listaItensOS");
  tbody.innerHTML = "";

  itensOS.forEach((item, index) => {
    const totalItem = Number(item.quantidade) * Number(item.valor);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.descricao}</td>
      <td>${item.quantidade}</td>
      <td>${formatarMoeda(item.valor)}</td>
      <td>${formatarMoeda(totalItem)}</td>
      <td>
        <button class="btn-acao btn-editar" type="button" onclick="editarItem(${index})">Editar</button>
        <button class="btn-acao btn-excluir" type="button" onclick="excluirItem(${index})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  calcularTotalOS();
}

function adicionarItem() {
  const descricao = document.getElementById("itemDescricao").value.trim();
  const quantidade = Number(document.getElementById("itemQuantidade").value);
  const valor = Number(document.getElementById("itemValor").value);

  if (!descricao) {
    alert("Informe a descrição do item.");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  if (isNaN(valor) || valor < 0) {
    alert("Informe um valor válido.");
    return;
  }

  const item = {
    descricao,
    quantidade,
    valor
  };

  if (indiceEdicaoItem !== null) {
    itensOS[indiceEdicaoItem] = item;
  } else {
    itensOS.push(item);
  }

  renderizarItensOS();
  limparCamposItem();
}

function editarItem(index) {
  const item = itensOS[index];
  document.getElementById("itemDescricao").value = item.descricao;
  document.getElementById("itemQuantidade").value = item.quantidade;
  document.getElementById("itemValor").value = item.valor;
  indiceEdicaoItem = index;
}

function excluirItem(index) {
  if (!confirm("Deseja excluir este item?")) return;
  itensOS.splice(index, 1);
  renderizarItensOS();
}

function previewChecklistFotos(event) {
  const files = Array.from(event.target.files || []);
  checklistFotos = files;

  const preview = document.getElementById("previewChecklist");
  preview.innerHTML = "";

  files.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${e.target.result}" alt="Foto ${index + 1}">
        <span>${file.name}</span>
      `;
      preview.appendChild(div);
    };

    reader.readAsDataURL(file);
  });
}

function limparFormularioCliente() {
  document.getElementById("clienteNome").value = "";
  document.getElementById("clienteTelefone").value = "";
  document.getElementById("clienteWhatsapp").value = "";
  document.getElementById("clienteEmail").value = "";
  document.getElementById("clienteEndereco").value = "";
  document.getElementById("clienteObs").value = "";
}

function limparFormularioVeiculo() {
  document.getElementById("veiculoCliente").value = "";
  document.getElementById("veiculoMarca").value = "";
  document.getElementById("veiculoModelo").value = "";
  document.getElementById("veiculoPlaca").value = "";
  document.getElementById("veiculoAno").value = "";
  document.getElementById("veiculoCor").value = "";
  document.getElementById("veiculoKm").value = "";
  document.getElementById("veiculoChassi").value = "";
  document.getElementById("veiculoObs").value = "";
}

async function limparFormularioOS() {
  document.getElementById("osNumero").value = "";
  document.getElementById("osCliente").value = "";
  document.getElementById("osVeiculo").innerHTML = '<option value="">Selecione</option>';
  document.getElementById("osStatus").value = "Aberta";
  document.getElementById("osObservacoes").value = "";
  document.getElementById("checklistFotos").value = "";
  document.getElementById("previewChecklist").innerHTML = "";

  itensOS = [];
  checklistFotos = [];
  indiceEdicaoOS = null;
  indiceEdicaoItem = null;

  limparCamposItem();
  renderizarItensOS();
  await carregarProximoNumeroOS();
}

async function salvarCliente() {
  const cliente = {
    nome: document.getElementById("clienteNome").value.trim(),
    telefone: document.getElementById("clienteTelefone").value.trim(),
    whatsapp: document.getElementById("clienteWhatsapp").value.trim(),
    email: document.getElementById("clienteEmail").value.trim(),
    endereco: document.getElementById("clienteEndereco").value.trim(),
    observacoes: document.getElementById("clienteObs").value.trim()
  };

  if (!cliente.nome) {
    alert("Informe o nome do cliente.");
    return;
  }

  try {
    mostrarLoading(true);

    const data = await apiPost({
      action: "saveCliente",
      cliente
    });

    clientes.push(data.cliente);
    preencherSelectClientes();
    fecharModal("modalCliente");
    limparFormularioCliente();

    alert("Cliente salvo com sucesso.");
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

async function salvarVeiculo() {
  const veiculo = {
    clienteId: document.getElementById("veiculoCliente").value,
    marca: document.getElementById("veiculoMarca").value.trim(),
    modelo: document.getElementById("veiculoModelo").value.trim(),
    placa: document.getElementById("veiculoPlaca").value.trim(),
    ano: document.getElementById("veiculoAno").value.trim(),
    cor: document.getElementById("veiculoCor").value.trim(),
    km: document.getElementById("veiculoKm").value.trim(),
    chassi: document.getElementById("veiculoChassi").value.trim(),
    observacoes: document.getElementById("veiculoObs").value.trim()
  };

  if (!veiculo.clienteId) {
    alert("Selecione o cliente.");
    return;
  }

  if (!veiculo.modelo) {
    alert("Informe o modelo do veículo.");
    return;
  }

  try {
    mostrarLoading(true);

    const data = await apiPost({
      action: "saveVeiculo",
      veiculo
    });

    veiculos.push(data.veiculo);
    fecharModal("modalVeiculo");
    limparFormularioVeiculo();

    alert("Veículo salvo com sucesso.");
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        nome: file.name,
        tipo: file.type,
        base64: String(reader.result).split(",")[1]
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function salvarOS() {
  let numero = document.getElementById("osNumero").value.trim();

  if (!numero && indiceEdicaoOS === null) {
    numero = await carregarProximoNumeroOS();
  }

  const clienteId = document.getElementById("osCliente").value;
  const veiculoId = document.getElementById("osVeiculo").value;
  const status = document.getElementById("osStatus").value;
  const observacoes = document.getElementById("osObservacoes").value.trim();
  const total = calcularTotalOS();

  const cliente = clientes.find(c => String(c.id) === String(clienteId));
  const veiculo = veiculos.find(v => String(v.id) === String(veiculoId));

  if (!numero && indiceEdicaoOS !== null) {
    alert("Número da OS não encontrado na edição.");
    return;
  }

  if (!clienteId) {
    alert("Selecione o cliente.");
    return;
  }

  if (!veiculoId) {
    alert("Selecione o veículo.");
    return;
  }

  if (!itensOS.length) {
    alert("Inclua pelo menos um item na OS.");
    return;
  }

  try {
    mostrarLoading(true);

    const checklistConvertido = await Promise.all(
      checklistFotos.map(file => fileToBase64(file))
    );

    const payload = {
      action: "saveOS",
      os: {
        id: indiceEdicaoOS !== null ? ordensServico[indiceEdicaoOS].id : "",
        numero,
        clienteId,
        clienteNome: cliente ? cliente.nome : "",
        veiculoId,
        veiculoDescricao: veiculo ? `${veiculo.marca || ""} ${veiculo.modelo || ""} - ${veiculo.placa || ""}`.trim() : "",
        status,
        observacoes,
        total,
        itens: itensOS,
        checklist: checklistConvertido
      }
    };

    const data = await apiPost(payload);

    const osSalva = {
      ...data.os,
      clienteTelefone: cliente ? (cliente.telefone || "") : "",
      clienteWhatsapp: cliente ? (cliente.whatsapp || "") : ""
    };

    if (indiceEdicaoOS !== null) {
      ordensServico[indiceEdicaoOS] = osSalva;
    } else {
      ordensServico.push(osSalva);
    }

    renderizarOS();
    await limparFormularioOS();

    alert("OS salva com sucesso.");
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

function renderizarOS(lista = ordensServico) {
  const tbody = document.getElementById("listaOS");
  tbody.innerHTML = "";

  lista.forEach((os, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${os.numero}</td>
      <td>${os.clienteNome}</td>
      <td>${os.veiculoDescricao}</td>
      <td>${os.status}</td>
      <td>${formatarMoeda(os.total)}</td>
      <td>
        <button class="btn-acao btn-ver" type="button" onclick="verOS(${index})">Ver</button>
        <button class="btn-acao btn-editar" type="button" onclick="editarOS(${index})">Editar</button>
        <button class="btn-acao btn-whats" type="button" onclick="enviarPdfWhatsApp(${index})">WhatsApp PDF</button>
        <button class="btn-acao btn-excluir" type="button" onclick="excluirOS(${index})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verOS(index) {
  const os = ordensServico[index];

  const textoItens = (os.itens || []).length
    ? os.itens.map(i => `- ${i.descricao} | Qtd: ${i.quantidade} | Valor: ${formatarMoeda(i.valor)}`).join("\n")
    : "Sem itens";

  const textoChecklist = (os.checklist || []).length
    ? os.checklist.map(f => f.nome || f.url || "Foto").join(", ")
    : "Sem fotos";

  alert(
    `OS: ${os.numero}\n` +
    `Cliente: ${os.clienteNome}\n` +
    `Veículo: ${os.veiculoDescricao}\n` +
    `Status: ${os.status}\n` +
    `Total: ${formatarMoeda(os.total)}\n\n` +
    `Itens:\n${textoItens}\n\n` +
    `Checklist:\n${textoChecklist}`
  );
}

function editarOS(index) {
  const os = ordensServico[index];

  document.getElementById("osNumero").value = os.numero || "";
  document.getElementById("osCliente").value = os.clienteId || "";
  preencherVeiculosCliente(os.clienteId, os.veiculoId);
  document.getElementById("osStatus").value = os.status || "Aberta";
  document.getElementById("osObservacoes").value = os.observacoes || "";

  itensOS = os.itens ? [...os.itens] : [];
  checklistFotos = [];
  document.getElementById("checklistFotos").value = "";
  document.getElementById("previewChecklist").innerHTML = "";

  indiceEdicaoOS = index;
  renderizarItensOS();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function excluirOS(index) {
  if (!confirm("Deseja excluir esta OS?")) return;

  try {
    mostrarLoading(true);

    const os = ordensServico[index];

    await apiPost({
      action: "deleteOS",
      id: os.id
    });

    ordensServico.splice(index, 1);
    renderizarOS();
    await carregarProximoNumeroOS();
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

async function enviarPdfWhatsApp(index) {
  try {
    const os = ordensServico[index];

    if (!os || !os.id) {
      alert("OS não encontrada.");
      return;
    }

    mostrarLoading(true);

    const data = await apiPost({
      action: "gerarPdfOS",
      osId: os.id
    });

    const telefoneCliente = String(os.clienteWhatsapp || os.clienteTelefone || "").replace(/\D/g, "");

    const mensagem =
      `Olá, segue a Ordem de Serviço ${os.numero} da Mecânica & Guincho Bonatto BEM.\n\n` +
      `Cliente: ${os.clienteNome}\n` +
      `Veículo: ${os.veiculoDescricao}\n` +
      `Total: ${formatarMoeda(os.total)}\n\n` +
      `PDF: ${data.pdfUrl}`;

    const mensagemCodificada = encodeURIComponent(mensagem);

    let urlWhatsapp = "";

    if (telefoneCliente) {
      urlWhatsapp = `https://wa.me/55${telefoneCliente}?text=${mensagemCodificada}`;
    } else {
      urlWhatsapp = `https://wa.me/?text=${mensagemCodificada}`;
    }

    window.open(urlWhatsapp, "_blank");
  } catch (error) {
    alert(error.message);
  } finally {
    mostrarLoading(false);
  }
}

function filtrarOS() {
  const termo = document.getElementById("pesquisaOS").value.toLowerCase().trim();

  if (!termo) {
    renderizarOS(ordensServico);
    return;
  }

  const filtrada = ordensServico.filter(os =>
    String(os.numero || "").toLowerCase().includes(termo) ||
    String(os.clienteNome || "").toLowerCase().includes(termo)
  );

  renderizarOS(filtrada);
}

function abrirModalCliente() {
  document.getElementById("modalCliente").classList.add("ativo");
}

function abrirModalVeiculo() {
  document.getElementById("modalVeiculo").classList.add("ativo");
}

function fecharModal(id) {
  document.getElementById(id).classList.remove("ativo");
}

async function abrirNovaOS() {
  await limparFormularioOS();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

window.addEventListener("load", () => {
  renderizarItensOS();
  carregarDadosIniciais();
});
