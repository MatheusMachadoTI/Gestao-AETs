/* =========================================================
   FONTE ÚNICA DE DADOS DO SISTEMA (AETs + Clientes)
   Usado por: index.html, clientes.html, relatorios.html
   Futuramente será substituído por API Flask + MySQL.
   ========================================================= */

// CLIENTES (dados fictícios consistentes com as AETs existentes)
const CLIENTESdata = [
    { id: 1, nome: "EMPRESA DEMONSTRAÇÃO LOGÍSTICA", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente01@exemplo.test" },
    { id: 2, nome: "LOGÍSTICA BRASIL EXEMPLO LTDA", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente02@exemplo.test" },
    { id: 3, nome: "TRANSPORTADORA TESTE LTDA", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente03@exemplo.test" },
    { id: 4, nome: "CARGAS EXEMPLO BRASIL", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente04@exemplo.test" },
    { id: 5, nome: "FROTA MODELO LTDA", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente05@exemplo.test" },
    { id: 6, nome: "AGRO CARGAS DEMO", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente06@exemplo.test" },
    { id: 7, nome: "TRANSPORTES MODELO AZUL", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente07@exemplo.test" },
    { id: 8, nome: "COOPERATIVA TESTE LOGÍSTICO", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente08@exemplo.test" },
    { id: 9, nome: "ROTA FICTÍCIA TRANSPORTES", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente09@exemplo.test" },
    { id: 10, nome: "GRUPO DEMO ESTRADA", documento: "00.000.000/0000-00", telefone: "(00) 00000-0000", email: "cliente10@exemplo.test" }
];

// DADOS FICTÍCIOS DAS AETs (mantidos do projeto original + campos novos)
const AETdataBase = [
    { id: 1, clienteId: 1, cliente: "EMPRESA DEMONSTRAÇÃO LOGÍSTICA", numeroAET: "AET-FICT-001", placas: ["FIC1T01", "FIC1T02"], vencimento: "31/08/2026", vencimentoData: new Date(2026, 7, 31), status: "Atenção", uf: "SP", cavalo: "Caminhão Demonstração 01", carretas: "3", comprimento: "17,50m", carroceria: "Graneleira", observacao: "Registro fictício para demonstração" },
    { id: 2, clienteId: 2, cliente: "LOGÍSTICA BRASIL EXEMPLO LTDA", numeroAET: "AET-FICT-002", placas: ["FIC1T03", "FIC1T04"], vencimento: "31/08/2026", vencimentoData: new Date(2026, 7, 31), status: "Atenção", uf: "SP", cavalo: "Caminhão Demonstração 02", carretas: "2", comprimento: "15,00m", carroceria: "Baú", observacao: "Registro fictício para demonstração" },
    { id: 3, clienteId: 3, cliente: "TRANSPORTADORA TESTE LTDA", numeroAET: "AET-FICT-003", placas: ["FIC1T05", "FIC1T06"], vencimento: "31/08/2026", vencimentoData: new Date(2026, 7, 31), status: "Atenção", uf: "SP", cavalo: "Caminhão Demonstração 03", carretas: "2", comprimento: "16,50m", carroceria: "Tanque", observacao: "Registro fictício para demonstração" },
    { id: 4, clienteId: 4, cliente: "CARGAS EXEMPLO BRASIL", numeroAET: "AET-FICT-004", placas: ["FIC1T07", "FIC1T08"], vencimento: "30/04/2026", vencimentoData: new Date(2026, 3, 30), status: "Vencida", uf: "SP", cavalo: "Caminhão Demonstração 04", carretas: "3", comprimento: "18,00m", carroceria: "Graneleira", observacao: "Registro fictício para demonstração" },
    { id: 5, clienteId: 5, cliente: "FROTA MODELO LTDA", numeroAET: "AET-FICT-005", placas: ["FIC1T09", "FIC1T10"], vencimento: "30/04/2026", vencimentoData: new Date(2026, 3, 30), status: "Vencida", uf: "SP", cavalo: "Caminhão Demonstração 05", carretas: "2", comprimento: "15,50m", carroceria: "Baú", observacao: "Registro fictício para demonstração" },
    { id: 6, clienteId: 6, cliente: "AGRO CARGAS DEMO", numeroAET: "AET-FICT-006", placas: ["FIC2T01", "FIC2T02"], vencimento: "15/09/2026", vencimentoData: new Date(2026, 8, 15), status: "Regular", uf: "SP", cavalo: "Caminhão Demonstração 06", carretas: "3", comprimento: "17,50m", carroceria: "Graneleira", observacao: "Registro fictício para demonstração" },
    { id: 7, clienteId: 7, cliente: "TRANSPORTES MODELO AZUL", numeroAET: "AET-FICT-007", placas: ["FIC2T03", "FIC2T04"], vencimento: "10/10/2026", vencimentoData: new Date(2026, 9, 10), status: "Regular", uf: "SP", cavalo: "Caminhão Demonstração 07", carretas: "2", comprimento: "16,00m", carroceria: "Baú", observacao: "Registro fictício para demonstração" },
    { id: 8, clienteId: 8, cliente: "COOPERATIVA TESTE LOGÍSTICO", numeroAET: "AET-FICT-008", placas: ["FIC2T05", "FIC2T06"], vencimento: "02/11/2026", vencimentoData: new Date(2026, 10, 2), status: "Regular", uf: "SP", cavalo: "Caminhão Demonstração 08", carretas: "3", comprimento: "18,50m", carroceria: "Graneleira", observacao: "Registro fictício para demonstração" },
    { id: 9, clienteId: 9, cliente: "ROTA FICTÍCIA TRANSPORTES", numeroAET: "AET-FICT-009", placas: ["FIC2T07", "FIC2T08"], vencimento: "25/11/2026", vencimentoData: new Date(2026, 10, 25), status: "Regular", uf: "SP", cavalo: "Caminhão Demonstração 09", carretas: "2", comprimento: "15,50m", carroceria: "Sider", observacao: "Registro fictício para demonstração" },
    { id: 10, clienteId: 10, cliente: "GRUPO DEMO ESTRADA", numeroAET: "AET-FICT-010", placas: ["FIC2T09", "FIC2T10"], vencimento: "08/12/2026", vencimentoData: new Date(2026, 11, 8), status: "Regular", uf: "SP", cavalo: "Caminhão Demonstração 10", carretas: "3", comprimento: "17,00m", carroceria: "Tanque", observacao: "Registro fictício para demonstração" },
    // Registros adicionais para demonstrar as novas funcionalidades
    { id: 11, clienteId: 1, cliente: "EMPRESA DEMONSTRAÇÃO LOGÍSTICA", numeroAET: "AET-FICT-011", placas: ["FIC3T01", "FIC3T02"], vencimento: "18/08/2026", vencimentoData: new Date(2026, 7, 18), status: "Atenção", uf: "MG", cavalo: "Caminhão Demonstração 11", carretas: "2", comprimento: "16,00m", carroceria: "Sider", observacao: "Registro fictício para demonstração" },
    { id: 12, clienteId: 3, cliente: "TRANSPORTADORA TESTE LTDA", numeroAET: "AET-FICT-012", placas: ["FIC3T03", "FIC3T04"], vencimento: "22/08/2026", vencimentoData: new Date(2026, 7, 22), status: "Atenção", uf: "PR", cavalo: "Caminhão Demonstração 12", carretas: "3", comprimento: "19,00m", carroceria: "Prancha", observacao: "Registro fictício para demonstração" },
    { id: 13, clienteId: 5, cliente: "FROTA MODELO LTDA", numeroAET: "AET-FICT-013", placas: ["FIC3T05", "FIC3T06"], vencimento: "05/08/2026", vencimentoData: new Date(2026, 7, 5), status: "Vencida", uf: "SC", cavalo: "Caminhão Demonstração 13", carretas: "2", comprimento: "15,00m", carroceria: "Baú", observacao: "Registro fictício para demonstração" },
    { id: 14, clienteId: 7, cliente: "TRANSPORTES MODELO AZUL", numeroAET: "AET-FICT-014", placas: ["FIC3T07", "FIC3T08"], vencimento: "10/09/2026", vencimentoData: new Date(2026, 8, 10), status: "Em renovação", uf: "GO", cavalo: "Caminhão Demonstração 14", carretas: "3", comprimento: "17,80m", carroceria: "Graneleira", observacao: "Registro fictício para demonstração" },
    { id: 15, clienteId: 9, cliente: "ROTA FICTÍCIA TRANSPORTES", numeroAET: "AET-FICT-015", placas: ["FIC3T09", "FIC3T10"], vencimento: "28/09/2026", vencimentoData: new Date(2026, 8, 28), status: "Renovada", uf: "SP", cavalo: "Caminhão Demonstração 15", carretas: "2", comprimento: "16,20m", carroceria: "Tanque", observacao: "Registro fictício para demonstração" }
];

const AET_STORAGE_KEY = 'aet_registros_demo';
const LEGACY_AET_STORAGE_KEY = 'aet_registros';

function carregarAETs() {
    try {
        const armazenadas = JSON.parse(localStorage.getItem(AET_STORAGE_KEY));
        if (!Array.isArray(armazenadas)) return AETdataBase;

        return armazenadas.map(aet => ({
            ...aet,
            vencimentoData: parseDataBR(aet.vencimento)
        }));
    } catch (e) {
        return AETdataBase;
    }
}

function salvarAETs() {
    localStorage.setItem(AET_STORAGE_KEY, JSON.stringify(AETdata));
}

const AETdata = carregarAETs();

function persistirAETs() {
    salvarAETs();
}

/* ---------------- FUNÇÕES UTILITÁRIAS ---------------- */

// Data de hoje sem horário
function hojeSemHora() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Dias restantes até o vencimento (negativo quando já venceu)
function diasParaVencimento(aet) {
    const venc = aet.vencimentoData instanceof Date
        ? new Date(aet.vencimentoData.getFullYear(), aet.vencimentoData.getMonth(), aet.vencimentoData.getDate())
        : parseDataBR(aet.vencimento);
    return Math.round((venc - hojeSemHora()) / 86400000);
}

// Converte "dd/mm/aaaa" em Date
function parseDataBR(texto) {
    const p = String(texto).split('/');
    return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
}

// Formata Date em "dd/mm/aaaa"
function formatarDataBR(data) {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${data.getFullYear()}`;
}

// CONTAGEM REGRESSIVA — texto do prazo
function textoPrazo(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') {
        return 'Renovação em andamento';
    }
    const dias = diasParaVencimento(aet);
    if (dias < 0) return `Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dias`;
}

// Classe visual do prazo
function classePrazo(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'prazo-renovacao';
    const dias = diasParaVencimento(aet);
    if (dias < 0) return 'prazo-vencido';
    if (dias <= 7) return 'prazo-critico';
    if (dias <= 30) return 'prazo-alerta';
    return 'prazo-ok';
}

// PRIORIDADE — calculada automaticamente pelo vencimento
// (aet.prioridade pode ser gravada nos dados para sobrescrever o cálculo)
function prioridadeAET(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'Em renovação';
    if (aet.status === 'Renovada') return 'Resolvida';
    if (aet.status === 'Vencida') return 'Urgente';
    const dias = diasParaVencimento(aet);
    if (dias <= 7) return 'Urgente';   // inclui vencidas
    if (dias <= 15) return 'Alta';
    if (dias <= 30) return 'Média';
    return 'Normal';
}

const PRIORIDADE_CLASSES = {
    'Urgente': 'prio-urgente',
    'Alta': 'prio-alta',
    'Média': 'prio-media',
    'Normal': 'prio-normal',
    'Em renovação': 'prio-renovacao',
    'Resolvida': 'prio-resolvida'
};

function statusAET(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'Renovação em andamento';
    if (aet.statusManual && ['Regular', 'Atenção', 'Alta prioridade', 'Renovada', 'Vencida'].includes(aet.status)) return aet.status;
    if (aet.status === 'Renovada') return 'Renovada';

    const dias = diasParaVencimento(aet);
    if (dias < 0) return 'Vencida';
    if (dias <= 7) return 'Atenção';
    if (dias <= 15) return 'Alta prioridade';
    return 'Regular';
}

function atualizarStatusCalculado(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação' || aet.status === 'Renovada') {
        if (aet.status === 'Em renovação') aet.status = 'Renovação em andamento';
        return aet.status;
    }
    aet.status = statusAET(aet);
    return aet.status;
}

// Categoria de vencimento usada no painel de atenção
function categoriaVencimento(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação' || aet.status === 'Renovada') return 'fora-pendencia';
    const dias = diasParaVencimento(aet);
    if (dias < 0) return 'vencidas';
    if (dias === 0) return 'hoje';
    if (dias <= 7) return '7dias';
    if (dias <= 30) return '30dias';
    return 'mais30';
}

// Contagem por categoria
function contarCategorias(lista) {
    const r = { vencidas: 0, hoje: 0, '7dias': 0, '30dias': 0 };
    (lista || AETdata).forEach(a => {
        const categoria = categoriaVencimento(a);
        if (Object.prototype.hasOwnProperty.call(r, categoria)) r[categoria]++;
    });
    return r;
}

// Contagem por status
function contarStatus(lista) {
    const dados = lista || AETdata;
    return {
        total: dados.length,
        regular: dados.filter(a => statusAET(a) === 'Regular').length,
        atencao: dados.filter(a => statusAET(a) === 'Atenção').length,
        alta: dados.filter(a => statusAET(a) === 'Alta prioridade').length,
        vencida: dados.filter(a => statusAET(a) === 'Vencida').length,
        renovacao: dados.filter(a => statusAET(a) === 'Renovação em andamento').length,
        renovada: dados.filter(a => a.status === 'Renovada').length
    };
}

// Classe CSS do badge de status
function classeStatus(status) {
    const mapa = {
        'Regular': 'status-regular',
        'Atenção': 'status-attention',
        'Alta prioridade': 'status-high',
        'Vencida': 'status-expired',
        'Renovação em andamento': 'status-renewal',
        'Em renovação': 'status-renewal',
        'Renovada': 'status-renewed'
    };
    return mapa[status] || 'status-regular';
}

// AETs de um cliente
function aetsDoCliente(clienteId) {
    return AETdata.filter(a => a.clienteId === clienteId);
}

/* ---------------- HISTÓRICO (localStorage) ---------------- */
const HISTORICO_KEY = 'aet_historico_demo';
const LEGACY_HISTORICO_KEY = 'aet_historico';

// Remove dados gravados por versões anteriores antes de carregar a base demo.
localStorage.removeItem(LEGACY_AET_STORAGE_KEY);
localStorage.removeItem(LEGACY_HISTORICO_KEY);

function carregarHistoricos() {
    try {
        const historicos = JSON.parse(localStorage.getItem(HISTORICO_KEY)) || {};
        let alterado = false;
        Object.keys(historicos).forEach(id => {
            const eventos = Array.isArray(historicos[id]) ? historicos[id] : [];
            const filtrados = eventos.filter(evento => !['Documentação', 'Pagamento', 'Contato com cliente'].includes(evento.tipo));
            const normalizados = filtrados.map(evento => {
                if (evento.descricao === 'Solicitação de renovação iniciada') return { ...evento, descricao: 'AET enviada para renovação' };
                if (evento.descricao === 'AET renovada com sucesso') return { ...evento, descricao: 'AET marcada como renovada' };
                if (evento.descricao.includes('cadastrada no sistema')) return { ...evento, descricao: 'AET cadastrada' };
                return evento;
            });
            historicos[id] = normalizados;
            alterado = alterado || JSON.stringify(normalizados) !== JSON.stringify(eventos);
        });
        if (alterado) salvarHistoricos(historicos);
        return historicos;
    } catch (e) {
        return {};
    }
}

function salvarHistoricos(historicos) {
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historicos));
}

// Histórico inicial padrão de uma AET (gerado apenas 1x e persistido)
function historicoPadrao(aet) {
    const base = [
        { data: '15/08/2026', tipo: 'Cadastro', descricao: 'AET cadastrada' }
    ];
    return base;
}

function registrarHistoricoAutomatico(aetId, descricao, data = hojeSemHora()) {
    adicionarEvento(aetId, {
        data: formatarDataBR(data),
        tipo: 'Status',
        descricao
    });
}

function registrarAlteracaoStatus(aetId, statusAnterior, statusNovo) {
    adicionarEvento(aetId, {
        data: formatarDataBR(hojeSemHora()),
        tipo: 'Status alterado',
        descricao: `De: ${statusAnterior} | Para: ${statusNovo}`
    });
}

function enviarParaRenovacao(aetId) {
    const aet = AETdata.find(item => item.id === Number(aetId));
    if (!aet) return false;
    aet.status = 'Renovação em andamento';
    aet.statusManual = true;
    aet.renovacaoEm = formatarDataBR(hojeSemHora());
    delete aet.prioridade;
    persistirAETs();
    registrarHistoricoAutomatico(aet.id, 'AET enviada para renovação');
    return true;
}

function marcarComoRenovada(aetId) {
    const aet = AETdata.find(item => item.id === Number(aetId));
    if (!aet) return false;
    aet.status = 'Renovada';
    aet.statusManual = true;
    aet.renovadaEm = formatarDataBR(hojeSemHora());
    persistirAETs();
    registrarHistoricoAutomatico(aet.id, 'AET marcada como renovada');
    return true;
}

function cancelarRenovacao(aetId) {
    const aet = AETdata.find(item => item.id === Number(aetId));
    if (!aet) return false;
    delete aet.renovacaoEm;
    aet.status = statusAET({ ...aet, status: '' });
    aet.statusManual = false;
    persistirAETs();
    registrarHistoricoAutomatico(aet.id, 'Renovação cancelada');
    return true;
}

function obterHistorico(aetId) {
    const historicos = carregarHistoricos();
    if (!historicos[aetId]) {
        const aet = AETdata.find(a => a.id === Number(aetId));
        historicos[aetId] = aet ? historicoPadrao(aet) : [];
        salvarHistoricos(historicos);
    }
    return historicos[aetId].slice().sort((a, b) => parseDataBR(a.data) - parseDataBR(b.data));
}

function adicionarEvento(aetId, evento) {
    const historicos = carregarHistoricos();
    if (!historicos[aetId]) historicos[aetId] = obterHistorico(aetId);
    historicos[aetId].push(evento);
    salvarHistoricos(historicos);
    return obterHistorico(aetId);
}

// Escape simples para conteúdo dinâmico
function escapeHTML(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
