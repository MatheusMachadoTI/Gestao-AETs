/* Página de Relatórios — usa a mesma fonte de dados (js/data.js) */

let dadosRelatorio = [...AETdata];

document.addEventListener('DOMContentLoaded', () => {
    preencherClientes();

    ['rel-period', 'rel-status', 'rel-client'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', atualizarRelatorio);
    });

    atualizarRelatorio();
});
document.addEventListener('aet-data-ready', () => {
    const select = document.getElementById('rel-client');
    if (select && select.options.length <= 1) preencherClientes();
    atualizarRelatorio();
});

function preencherClientes() {
    const select = document.getElementById('rel-client');
    if (!select) return;

    CLIENTESdata.forEach(c => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.nome;
        select.appendChild(opt);
    });
}

function filtrarDados() {
    const periodo = document.getElementById('rel-period')?.value || '';
    const status = document.getElementById('rel-status')?.value || '';
    const clienteId = document.getElementById('rel-client')?.value || '';

    return AETdata.filter(a => {
        const dias = diasParaVencimento(a);

        let okPeriodo = true;
        if (periodo === 'expired') okPeriodo = dias < 0;
        else if (periodo === '7') okPeriodo = dias >= 0 && dias <= 7;
        else if (periodo === '30') okPeriodo = dias >= 0 && dias <= 30;
        else if (periodo === '60') okPeriodo = dias >= 0 && dias <= 60;
        else if (periodo === '60+') okPeriodo = dias > 60;

        const okStatus = !status || statusAET(a) === status;
        const okCliente = !clienteId || a.clienteId === Number(clienteId);

        return okPeriodo && okStatus && okCliente;
    });
}

function atualizarRelatorio() {
    dadosRelatorio = filtrarDados();

    const s = contarStatus(dadosRelatorio);
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    };

    set('rel-total', s.total);
    set('rel-regular', s.regular);
    set('rel-atencao', s.atencao);
    set('rel-alta', s.alta);
    set('rel-vencidas', s.vencida);
    set('rel-renovacao', s.renovacao);
    set('rel-renovadas', s.renovada);

    renderGrafico();
    renderTabela();
}

function faixasVencimento(lista) {
    const r = { vencidas: 0, d7: 0, d30: 0, d60: 0, mais: 0 };
    lista.forEach(a => {
        const d = diasParaVencimento(a);
        if (d < 0) r.vencidas++;
        else if (d <= 7) r.d7++;
        else if (d <= 30) r.d30++;
        else if (d <= 60) r.d60++;
        else r.mais++;
    });
    return r;
}

function renderGrafico() {
    const chart = document.getElementById('bar-chart');
    if (!chart) return;

    const f = faixasVencimento(dadosRelatorio);
    const linhas = [
        ['Vencidas', f.vencidas, 'c-vencidas'],
        ['Próximos 7 dias', f.d7, 'c-7'],
        ['Próximos 30 dias', f.d30, 'c-30'],
        ['Próximos 60 dias', f.d60, 'c-60'],
        ['Mais de 60 dias', f.mais, 'c-mais']
    ];

    const max = Math.max(1, ...linhas.map(l => l[1]));

    chart.innerHTML = linhas.map(([label, valor, cls]) => `
        <div class="bar-row">
            <span class="bar-label">${label}</span>
            <div class="bar-track"><div class="bar-fill ${cls}" style="width:${(valor / max) * 100}%"></div></div>
            <span class="bar-value">${valor}</span>
        </div>`).join('');
}

function renderTabela() {
    const tbody = document.getElementById('rel-body');
    if (!tbody) return;

    if (dadosRelatorio.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">Nenhuma AET para os filtros selecionados.</div></td></tr>';
        return;
    }

    tbody.innerHTML = dadosRelatorio.map(a => `
        <tr>
            <td>${escapeHTML(a.cliente)}</td>
            <td>${escapeHTML(a.numeroAET)}</td>
            <td>${escapeHTML(a.vencimento)}</td>
            <td><span class="prazo-text ${classePrazo(a)}">${textoPrazo(a)}</span></td>
            <td><span class="status-badge ${classeStatus(statusAET(a))}">${escapeHTML(statusAET(a))}</span></td>
            <td><span class="priority-badge ${PRIORIDADE_CLASSES[prioridadeAET(a)]}">${prioridadeAET(a)}</span></td>
        </tr>`).join('');
}

// EXPORTAÇÃO SIMPLES (CSV gerado no navegador)
function exportarRelatorio() {
    const cabecalho = ['Cliente', 'Numero AET', 'Placas', 'Vencimento', 'Prazo', 'Status', 'Prioridade'];

    const linhas = dadosRelatorio.map(a => [
        a.cliente,
        a.numeroAET,
        a.placas.join(' / '),
        a.vencimento,
        textoPrazo(a),
        statusAET(a),
        prioridadeAET(a)
    ]);

    const csv = [cabecalho, ...linhas]
        .map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `relatorio-aets-${formatarDataBR(new Date()).replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
