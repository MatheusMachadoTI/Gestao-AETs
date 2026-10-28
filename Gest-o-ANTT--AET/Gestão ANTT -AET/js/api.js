const API_BASE_URL = `${window.location.protocol === 'file:' ? 'http://localhost:3000' : ''}/api`;

function apiRequest(path, options = {}) {
    return fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    }).then(async response => {
        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error('A API retornou uma resposta inválida.');
        }
        if (!response.ok || payload.success === false) throw new Error(payload.message || 'Erro na comunicação com a API');
        return payload.data === undefined ? payload : payload.data;
    });
}

function dataAPIParaTela(data) {
    const [ano, mes, dia] = String(data || '').slice(0, 10).split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
}

function aetAPIParaTela(aet) {
    return {
        ...aet,
        clienteId: aet.cliente_id || aet.clienteId,
        cliente: aet.cliente || '',
        numeroAET: aet.numero_aet || aet.numeroAET,
        placas: aet.placas || (aet.placa ? [aet.placa] : []),
        veiculo_id: aet.veiculo_id || aet.veiculoId,
        statusManual: true,
        vencimento: dataAPIParaTela(aet.vencimento),
        vencimentoData: parseDataBR(dataAPIParaTela(aet.vencimento)),
        carretas: String(aet.carretas == null ? '' : aet.carretas)
    };
}

async function carregarDadosDaAPI() {
    const [clientes, aets, veiculos] = await Promise.all([
        apiRequest('/clientes'),
        apiRequest('/aets'),
        apiRequest('/veiculos')
    ]);
    return { clientes, aets: aets.map(aetAPIParaTela), veiculos };
}

window.API = { request: apiRequest, carregarDadosDaAPI, aetAPIParaTela, dataAPIParaTela };
