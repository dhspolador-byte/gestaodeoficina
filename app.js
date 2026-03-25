// ========= CONFIGURAÇÃO =========
// Troque pela URL do seu Apps Script publicado
const API_URL = "https://script.google.com/macros/s/AKfycbwp6HIfd4GfsL4IVAiBXRm_imI_CANQhS92UT-nzvrhs3wDYF2vtnGcnWnY2gPjGkVBbw/exec";

// ========= ESTADO =========
let itensOS = [];

// ========= HELPERS =========
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

// ========= CARGA INICIAL =========
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
}

// ========= CLIENTES / VEÍCULOS =========
async function carregarClientes() {
  try {
    showLoading(true);
    const res = await apiGet({ action: "listarClientes" });
    const select = getEl("cliente");

    select.innerHTML = `<option value="">Selecione um cliente</option>`;

    if (res.ok && Array.isArray(res.data)) {
      res.data.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente.ID;
        option.textContent = `${cliente.NOME} ${cliente.WHATSAPP ? "- " + cliente.WHATSAPP : ""}`;
        select.appendChild(option);
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

// ========= ITENS DA OS =========
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

// ========= SALVAR OS =========
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
    action: "salvarOS",
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

    alert(`OS salva com sucesso: ${res.numero_os}`);
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
  renderItens();
}

// ========= LISTAGEM DE OS =========
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

// ========= AÇÕES DA OS =========
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

// iniciar
window.addEventListener("DOMContentLoaded", init);