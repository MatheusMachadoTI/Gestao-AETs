let CLIENTESdata = [];
let AETdata = [];
let VEICULOSdata = [];

function hojeSemHora() {
    const data = new Date();
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function parseDataBR(texto) {
    const valor = String(texto || '').slice(0, 10);
    const partes = valor.includes('-') ? valor.split('-') : valor.split('/');
    const [ano, mes, dia] = valor.includes('-')
        ? partes.map(Number)
        : [Number(partes[2]), Number(partes[1]), Number(partes[0])];
    if (!ano || !mes || !dia) return new Date(NaN);
    return new Date(ano, mes - 1, dia);
}

function formatarDataBR(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${data.getFullYear()}`;
}

function diasParaVencimento(aet) {
    const vencimento = aet.vencimentoData instanceof Date
        ? new Date(aet.vencimentoData.getFullYear(), aet.vencimentoData.getMonth(), aet.vencimentoData.getDate())
        : parseDataBR(aet.vencimento);
    if (Number.isNaN(vencimento.getTime())) return Number.POSITIVE_INFINITY;
    return Math.round((vencimento - hojeSemHora()) / 86400000);
}

function textoPrazo(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'Renovação em andamento';
    const dias = diasParaVencimento(aet);
    if (dias < 0) return `Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dias`;
}

function classePrazo(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'prazo-renovacao';
    const dias = diasParaVencimento(aet);
    if (dias < 0) return 'prazo-vencido';
    if (dias <= 7) return 'prazo-critico';
    if (dias <= 30) return 'prazo-alerta';
    return 'prazo-ok';
}

function prioridadeAET(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'Em renovação';
    if (aet.status === 'Renovada') return 'Resolvida';
    if (aet.status === 'Vencida' || diasParaVencimento(aet) < 0) return 'Urgente';
    if (PRIORIDADE_CLASSES[aet.prioridade]) return aet.prioridade;
    const dias = diasParaVencimento(aet);
    if (dias <= 7) return 'Urgente';
    if (dias <= 15) return 'Alta';
    if (dias <= 30) return 'Média';
    return 'Normal';
}

const PRIORIDADE_CLASSES = {
    Urgente: 'prio-urgente',
    Alta: 'prio-alta',
    Média: 'prio-media',
    Normal: 'prio-normal',
    'Em renovação': 'prio-renovacao',
    Resolvida: 'prio-resolvida'
};

function statusAET(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação') return 'Renovação em andamento';
    if (aet.status === 'Renovada') return 'Renovada';
    if (diasParaVencimento(aet) < 0) return 'Vencida';
    if (aet.statusManual && ['Regular', 'Atenção', 'Alta prioridade', 'Vencida'].includes(aet.status)) return aet.status;
    const dias = diasParaVencimento(aet);
    if (dias <= 7) return 'Atenção';
    if (dias <= 15) return 'Alta prioridade';
    return 'Regular';
}

function categoriaVencimento(aet) {
    if (aet.status === 'Renovação em andamento' || aet.status === 'Em renovação' || aet.status === 'Renovada') return 'fora-pendencia';
    if (aet.status === 'Vencida') return 'vencidas';
    const dias = diasParaVencimento(aet);
    if (dias < 0) return 'vencidas';
    if (dias === 0) return 'hoje';
    if (dias <= 7) return '7dias';
    if (dias <= 30) return '30dias';
    return 'mais30';
}

function contarCategorias(lista) {
    const resultado = { vencidas: 0, hoje: 0, '7dias': 0, '30dias': 0 };
    (lista || AETdata).forEach(aet => {
        const categoria = categoriaVencimento(aet);
        if (Object.prototype.hasOwnProperty.call(resultado, categoria)) resultado[categoria]++;
    });
    return resultado;
}

function contarStatus(lista) {
    const dados = lista || AETdata;
    return {
        total: dados.length,
        regular: dados.filter(aet => statusAET(aet) === 'Regular').length,
        atencao: dados.filter(aet => statusAET(aet) === 'Atenção').length,
        alta: dados.filter(aet => statusAET(aet) === 'Alta prioridade').length,
        vencida: dados.filter(aet => statusAET(aet) === 'Vencida').length,
        renovacao: dados.filter(aet => statusAET(aet) === 'Renovação em andamento').length,
        renovada: dados.filter(aet => statusAET(aet) === 'Renovada').length
    };
}

function classeStatus(status) {
    const mapa = {
        Regular: 'status-regular',
        Atenção: 'status-attention',
        'Alta prioridade': 'status-high',
        Vencida: 'status-expired',
        'Renovação em andamento': 'status-renewal',
        'Em renovação': 'status-renewal',
        Renovada: 'status-renewed'
    };
    return mapa[status] || 'status-regular';
}

function aetsDoCliente(clienteId) {
    return AETdata.filter(aet => Number(aet.clienteId) === Number(clienteId));
}

function escapeHTML(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mostrarErroCarregamento(mensagem) {
    let aviso = document.getElementById('api-load-error');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'api-load-error';
        aviso.setAttribute('role', 'alert');
        aviso.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:3000;padding:12px 18px;background:#b42318;color:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);font:500 14px Inter,sans-serif;max-width:calc(100% - 32px);';
        document.body.appendChild(aviso);
    }
    aviso.textContent = mensagem;
}

async function carregarDadosPersistidos() {
    try {
        const { clientes, aets, veiculos } = await window.API.carregarDadosDaAPI();
        CLIENTESdata = clientes;
        AETdata = aets;
        VEICULOSdata = veiculos;
        document.getElementById('api-load-error')?.remove();
        document.dispatchEvent(new CustomEvent('aet-data-ready'));
    } catch (error) {
        CLIENTESdata = [];
        AETdata = [];
        VEICULOSdata = [];
        mostrarErroCarregamento(`Não foi possível carregar os dados do banco: ${error.message}`);
        document.dispatchEvent(new CustomEvent('aet-data-ready'));
    }
}

document.addEventListener('DOMContentLoaded', carregarDadosPersistidos);
