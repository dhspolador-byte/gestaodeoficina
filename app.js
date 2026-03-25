// ========= CONFIGURAÇÃO =========
// Troque pela URL do seu Apps Script publicado
const API_URL = "https://script.google.com/macros/s/AKfycbwp6HIfd4GfsL4IVAiBXRm_imI_CANQhS92UT-nzvrhs3wDYF2vtnGcnWnY2gPjGkVBbw/exec";

let itensOS = [];
let modoEdicao = false;
let osEditandoId = null;

function showLoading(show = true) {
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.toggle("hidden", !show);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getEl(id) {
  return document.getElementById(id);
}

async function apiGet(params = {}) {
  const url = `${API_URL}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { method: "GET" });
  return await res.json();
}

async function apiPost(payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function init() {
  bindEvents();
  await carregarClientes();
  await carregarVeiculos();
  await carregarOS();
  renderItens();
}

function bindEvents() {
  getEl("btnAdicionarItem").addEventListener("click", adicionarItem);
  getEl("btnSalvarOS").addEventListener("click", salvarOS);
  getEl("btnAtualizarOS").addEventListener("click", carregarOS);
  getEl("btnLimparForm").addEventListener("click", limparFormulario);
  getEl("desconto_geral").addEventListener("input", renderItens);

  getEl("btnNovoCliente").addEventListener("click", abrirModalCliente);
  getEl("btnFecharModalCliente").addEventListener("click", fecharModalCliente);
  getEl("btnSalvarCliente").addEventListener("click", salvarCliente);

  getEl("btnNovoVeiculo").addEventListener("click", abrirModalVeiculo);
  getEl("btnFecharModalVeiculo").addEventListener("click", fecharModalVeiculo);
  getEl("btnSalvarVeiculo").addEventListener("click", salvarVeiculo);
}

async function carregarClientes() {
  try {
    showLoading(true);
    const res = await apiGet({ action: "listarClientes" });

    const selectCliente = getEl("cliente");
    const selectVeiculoCliente = getEl("veiculo_cliente_id");

    selectCliente.innerHTML = `<option value="">Selecione um cliente</option>`;
    selectVeiculoCliente.innerHTML = `<option value="">Selecione um cliente</option>`;

    if (res.ok && Array.isArray(res.data)) {
      res.data.forEach(cliente => {
        const texto = `${cliente.NOME}${cliente.WHATSAPP ? " - " + cliente.WHATSAPP : ""}`;

        const option1 = document.createElement("option");
        option1.value = cliente.ID;
        option1.textContent = texto;
        selectCliente.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = cliente.ID;
        option2.textContent = texto;
        selectVeiculoCliente.appendChild(option2);
      });
    }
  } catch (error) {
    alert("Erro ao carregar clientes.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function carregarVeiculos() {
  try {
    showLoading(true);
    const res = await apiGet({ action: "listarVeiculos" });
    const select = getEl("veiculo");

    select.innerHTML = `<option value="">Selecione um veículo</option>`;

    if (res.ok && Array.isArray(res.data)) {
      res.data.forEach(veiculo => {
        const option = document.createElement("option");
        option.value = veiculo.ID;
        option.textContent = `${veiculo.PLACA} - ${veiculo.MARCA} ${veiculo.MODELO}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    alert("Erro ao carregar veículos.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function abrirModalCliente() {
  getEl("modalCliente").classList.remove("hidden");
}

function fecharModalCliente() {
  getEl("modalCliente").classList.add("hidden");
  getEl("cliente_nome").value = "";
  getEl("cliente_telefone").value = "";
  getEl("cliente_whatsapp").value = "";
  getEl("cliente_email").value = "";
  getEl("cliente_endereco").value = "";
  getEl("cliente_obs").value = "";
}

function abrirModalVeiculo() {
  getEl("modalVeiculo").classList.remove("hidden");
}

function fecharModalVeiculo() {
  getEl("modalVeiculo").classList.add("hidden");
  getEl("veiculo_cliente_id").value = "";
  getEl("veiculo_placa").value = "";
  getEl("veiculo_marca").value = "";
  getEl("veiculo_modelo").value = "";
  getEl("veiculo_ano").value = "";
  getEl("veiculo_cor").value = "";
  getEl("veiculo_km").value = "";
  getEl("veiculo_obs").value = "";
}

async function salvarCliente() {
  const payload = {
    action: "salvarCliente",
    nome: getEl("cliente_nome").value.trim(),
    telefone: getEl("cliente_telefone").value.trim(),
    whatsapp: getEl("cliente_whatsapp").value.trim(),
    email: getEl("cliente_email").value.trim(),
    endereco: getEl("cliente_endereco").value.trim(),
    observacoes: getEl("cliente_obs").value.trim()
  };

  if (!payload.nome) {
    alert("Informe o nome do cliente.");
    return;
  }

  try {
    showLoading(true);
    const res = await apiPost(payload);

    if (!res.ok) {
      alert(res.error || "Erro ao salvar cliente.");
      return;
    }

    await carregarClientes();
    getEl("cliente").value = String(res.id);
    fecharModalCliente();
    alert("Cliente salvo com sucesso.");
  } catch (error) {
    alert("Erro ao salvar cliente.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function salvarVeiculo() {
  const payload = {
    action: "salvarVeiculo",
    cliente_id: getEl("veiculo_cliente_id").value,
    placa: getEl("veiculo_placa").value.trim().toUpperCase(),
    marca: getEl("veiculo_marca").value.trim(),
    modelo: getEl("veiculo_modelo").value.trim(),
    ano: getEl("veiculo_ano").value.trim(),
    cor: getEl("veiculo_cor").value.trim(),
    km: getEl("veiculo_km").value.trim(),
    observacoes: getEl("veiculo_obs").value.trim()
  };

  if (!payload.cliente_id) {
    alert("Selecione o cliente do veículo.");
    return;
  }

  if (!payload.placa) {
    alert("Informe a placa.");
    return;
  }

  try {
    showLoading(true);
    const res = await apiPost(payload);

    if (!res.ok) {
      alert(res.error || "Erro ao salvar veículo.");
      return;
    }

    await carregarVeiculos();
    getEl("veiculo").value = String(res.id);
    fecharModalVeiculo();
    alert("Veículo salvo com sucesso.");
  } catch (error) {
    alert("Erro ao salvar veículo.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function adicionarItem() {
  const tipo_item = getEl("tipo_item").value;
  const descricao = getEl("descricao_item").value.trim();
  const quantidade = Number(getEl("qtd_item").value || 0);
  const valor_unitario = Number(getEl("valor_item").value || 0);
  const desconto = Number(getEl("desconto_item").value || 0);

  if (!descricao) {
    alert("Informe a descrição do item.");
    return;
  }

  if (quantidade <= 0) {
    alert("A quantidade deve ser maior que zero.");
    return;
  }

  const subtotal = (quantidade * valor_unitario) - desconto;

  itensOS.push({
    tipo_item,
    descricao,
    quantidade,
    valor_unitario,
    desconto,
    subtotal
  });

  getEl("descricao_item").value = "";
  getEl("qtd_item").value = "1";
  getEl("valor_item").value = "0";
  getEl("desconto_item").value = "0";

  renderItens();
}

function removerItem(index) {
  itensOS.splice(index, 1);
  renderItens();
}

function renderItens() {
  const lista = getEl("listaItens");
  const descontoGeral = Number(getEl("desconto_geral").value || 0);

  if (!itensOS.length) {
    lista.innerHTML = "Nenhum item adicionado.";
    lista.classList.add("empty-state");
  } else {
    lista.classList.remove("empty-state");
    lista.innerHTML = itensOS.map((item, index) => `
      <div class="item-card">
        <div class="item-card-header">
          <span class="badge ${item.tipo_item === "PECA" ? "badge-peca" : "badge-servico"}">
            ${item.tipo_item}
          </span>
          <button class="btn btn-danger" onclick="removerItem(${index})">Remover</button>
        </div>
        <div><strong>${item.descricao}</strong></div>
        <div class="item-meta">
          <span>Quantidade: ${item.quantidade}</span>
          <span>Valor unitário: R$ ${formatMoney(item.valor_unitario)}</span>
          <span>Desconto: R$ ${formatMoney(item.desconto)}</span>
          <span>Subtotal: R$ ${formatMoney(item.subtotal)}</span>
        </div>
      </div>
    `).join("");
  }

  let totalPecas = 0;
  let totalServicos = 0;

  itensOS.forEach(item => {
    if (item.tipo_item === "PECA") totalPecas += Number(item.subtotal || 0);
    if (item.tipo_item === "SERVICO") totalServicos += Number(item.subtotal || 0);
  });

  const totalFinal = totalPecas + totalServicos - descontoGeral;

  getEl("totalPecas").textContent = formatMoney(totalPecas);
  getEl("totalServicos").textContent = formatMoney(totalServicos);
  getEl("totalFinal").textContent = formatMoney(totalFinal);
}

async function salvarOS() {
  const cliente_id = getEl("cliente").value;
  const veiculo_id = getEl("veiculo").value;
  const km_entrada = getEl("km_entrada").value;
  const defeito_relatado = getEl("defeito").value.trim();
  const diagnostico = getEl("diagnostico").value.trim();
  const desconto_geral = getEl("desconto_geral").value;

  if (!cliente_id) {
    alert("Selecione o cliente.");
    return;
  }

  if (!veiculo_id) {
    alert("Selecione o veículo.");
    return;
  }

  if (!itensOS.length) {
    alert("Adicione pelo menos um item.");
    return;
  }

  const payload = {
    action: modoEdicao ? "editarOS" : "salvarOS",
    id: osEditandoId,
    cliente_id,
    veiculo_id,
    km_entrada,
    defeito_relatado,
    diagnostico,
    desconto_geral,
    itens: itensOS
  };

  try {
    showLoading(true);
    const res = await apiPost(payload);

    if (!res.ok) {
      alert(res.error || "Erro ao salvar a OS.");
      return;
    }

    alert(modoEdicao ? "OS atualizada com sucesso." : `OS salva com sucesso: ${res.numero_os}`);
    limparFormulario();
    await carregarOS();
  } catch (error) {
    alert("Erro ao salvar OS.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function limparFormulario() {
  getEl("cliente").value = "";
  getEl("veiculo").value = "";
  getEl("km_entrada").value = "";
  getEl("defeito").value = "";
  getEl("diagnostico").value = "";
  getEl("desconto_geral").value = "0";
  itensOS = [];
  modoEdicao = false;
  osEditandoId = null;
  getEl("btnSalvarOS").textContent = "Salvar OS";
  renderItens();
}

async function carregarOS() {
  try {
    showLoading(true);
    const res = await apiGet({ action: "listarOS" });
    const lista = getEl("listaOS");

    if (!res.ok || !Array.isArray(res.data) || !res.data.length) {
      lista.innerHTML = "Nenhuma ordem de serviço cadastrada.";
      lista.classList.add("empty-state");
      return;
    }

    lista.classList.remove("empty-state");
    lista.innerHTML = res.data.map(os => `
      <div class="os-card">
        <div class="os-card-header">
          <div>
            <strong>${os.NUMERO_OS}</strong>
          </div>
          <span class="badge badge-status">${os.STATUS}</span>
        </div>

        <div class="os-meta">
          <span>Data abertura: ${os.DATA_ABERTURA || "-"}</span>
          <span>Total peças: R$ ${formatMoney(os.TOTAL_PECAS)}</span>
          <span>Total serviços: R$ ${formatMoney(os.TOTAL_SERVICOS)}</span>
          <span>Total final: R$ ${formatMoney(os.TOTAL_FINAL)}</span>
        </div>

        <div class="os-actions">
          <button class="btn btn-secondary" onclick="visualizarOS(${os.ID})">Ver</button>
          <button class="btn btn-primary" onclick="editarOS(${os.ID})">Editar</button>
          <button class="btn btn-danger" onclick="excluirOS(${os.ID})">Excluir</button>
          <button class="btn btn-success" onclick="finalizarOS(${os.ID})">Finalizar</button>
          <button class="btn btn-primary" onclick="gerarPdf(${os.ID})">Gerar PDF</button>
          <button class="btn btn-secondary" onclick="enviarWhats(${os.ID})">WhatsApp</button>
        </div>
      </div>
    `).join("");
  } catch (error) {
    alert("Erro ao carregar as ordens de serviço.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function visualizarOS(id) {
  try {
    showLoading(true);
    const res = await apiGet({ action: "buscarOS", id });

    if (!res.ok) {
      alert(res.error || "OS não encontrada.");
      return;
    }

    const { os, cliente, veiculo, itens } = res.data;

    const itensTexto = (itens || []).map(i =>
      `${i.TIPO_ITEM} - ${i.DESCRICAO} | Qtd: ${i.QUANTIDADE} | Subtotal: R$ ${formatMoney(i.SUBTOTAL)}`
    ).join("\n");

    alert(
      `OS: ${os.NUMERO_OS}\n` +
      `Status: ${os.STATUS}\n` +
      `Cliente: ${cliente?.NOME || "-"}\n` +
      `Veículo: ${veiculo?.PLACA || "-"} - ${veiculo?.MARCA || ""} ${veiculo?.MODELO || ""}\n` +
      `Defeito: ${os.DEFEITO_RELATADO || "-"}\n` +
      `Diagnóstico: ${os.DIAGNOSTICO || "-"}\n` +
      `Total final: R$ ${formatMoney(os.TOTAL_FINAL)}\n\n` +
      `Itens:\n${itensTexto || "Sem itens"}`
    );
  } catch (error) {
    alert("Erro ao consultar a OS.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function editarOS(id) {
  try {
    showLoading(true);
    const res = await apiGet({ action: "buscarOS", id });

    if (!res.ok) {
      alert(res.error || "OS não encontrada.");
      return;
    }

    const { os, itens } = res.data;

    modoEdicao = true;
    osEditandoId = id;

    getEl("cliente").value = String(os.CLIENTE_ID || "");
    getEl("veiculo").value = String(os.VEICULO_ID || "");
    getEl("km_entrada").value = os.KM_ENTRADA || "";
    getEl("defeito").value = os.DEFEITO_RELATADO || "";
    getEl("diagnostico").value = os.DIAGNOSTICO || "";
    getEl("desconto_geral").value = os.DESCONTO_GERAL || 0;

    itensOS = (itens || []).map(item => ({
      tipo_item: item.TIPO_ITEM,
      descricao: item.DESCRICAO,
      quantidade: Number(item.QUANTIDADE || 0),
      valor_unitario: Number(item.VALOR_UNITARIO || 0),
      desconto: Number(item.DESCONTO || 0),
      subtotal: Number(item.SUBTOTAL || 0)
    }));

    getEl("btnSalvarOS").textContent = "Atualizar OS";
    renderItens();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert("Erro ao carregar dados da OS.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function excluirOS(id) {
  const confirmar = confirm("Deseja excluir esta ordem de serviço?");
  if (!confirmar) return;

  try {
    showLoading(true);
    const res = await apiPost({ action: "excluirOS", id });

    if (!res.ok) {
      alert(res.error || "Erro ao excluir.");
      return;
    }

    alert("OS excluída com sucesso.");
    await carregarOS();
  } catch (error) {
    alert("Erro ao excluir OS.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function finalizarOS(id) {
  const confirmar = confirm("Deseja finalizar esta ordem de serviço?");
  if (!confirmar) return;

  try {
    showLoading(true);
    const res = await apiPost({ action: "finalizarOS", id });

    if (!res.ok) {
      alert(res.error || "Erro ao finalizar.");
      return;
    }

    alert("OS finalizada com sucesso.");
    await carregarOS();
  } catch (error) {
    alert("Erro ao finalizar OS.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function gerarPdf(id) {
  try {
    showLoading(true);
    const res = await apiGet({ action: "gerarPdf", id });

    if (!res.ok) {
      alert(res.error || "Erro ao gerar PDF.");
      return;
    }

    window.open(res.pdf_url, "_blank");
  } catch (error) {
    alert("Erro ao gerar PDF.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

async function enviarWhats(id) {
  try {
    showLoading(true);

    const res = await apiGet({ action: "buscarOS", id });
    if (!res.ok) {
      alert(res.error || "OS não encontrada.");
      return;
    }

    const dados = res.data;
    const whatsapp = sanitizePhone(dados.cliente?.WHATSAPP);

    if (!whatsapp) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }

    let pdfUrl = dados.os?.PDF_URL || "";

    if (!pdfUrl) {
      const pdfRes = await apiGet({ action: "gerarPdf", id });
      if (pdfRes.ok) pdfUrl = pdfRes.pdf_url;
    }

    const msg =
      `Olá, segue a ordem de serviço ${dados.os.NUMERO_OS}.\n` +
      `Cliente: ${dados.cliente?.NOME || ""}\n` +
      `Veículo: ${dados.veiculo?.MARCA || ""} ${dados.veiculo?.MODELO || ""} ${dados.veiculo?.PLACA || ""}\n` +
      `Total: R$ ${formatMoney(dados.os.TOTAL_FINAL)}\n` +
      `PDF: ${pdfUrl}`;

    const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  } catch (error) {
    alert("Erro ao abrir o WhatsApp.");
    console.error(error);
  } finally {
    showLoading(false);
  }
}

window.addEventListener("DOMContentLoaded", init);
