/* Página de Clientes — usa a mesma fonte de dados (js/data.js) */

document.addEventListener('DOMContentLoaded', () => {
    renderClientes();

    const form = document.getElementById('client-form');
    if (form) form.addEventListener('submit', cadastrarCliente);

    const busca = document.getElementById('client-search');
    const buscaHeader = document.getElementById('header-search');

    if (busca) busca.addEventListener('input', () => renderClientes(busca.value));
    if (buscaHeader) buscaHeader.addEventListener('input', () => {
        if (busca) busca.value = buscaHeader.value;
        renderClientes(buscaHeader.value);
    });
});
document.addEventListener('aet-data-ready', () => renderClientes(document.getElementById('client-search')?.value));

let clienteEmEdicao = null;

function mostrarFormularioCliente() {
    const section = document.getElementById('client-form-section');
    if (!section) return;
    clienteEmEdicao = null;
    document.getElementById('client-form')?.reset();
    section.querySelector('h2').textContent = 'Novo cliente';
    section.querySelector('button[type="submit"]').textContent = 'Salvar cliente';
    section.hidden = false;
    document.getElementById('client-name')?.focus();
}

function ocultarFormularioCliente() {
    const section = document.getElementById('client-form-section');
    const form = document.getElementById('client-form');
    if (section) section.hidden = true;
    if (form) form.reset();
    clienteEmEdicao = null;
}

async function cadastrarCliente(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const dados = Object.fromEntries(new FormData(form).entries());
    const editing = clienteEmEdicao !== null;

    submitButton.disabled = true;
    try {
        const cliente = await API.request(editing ? `/clientes/${clienteEmEdicao}` : '/clientes', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(dados)
        });
        const index = CLIENTESdata.findIndex(item => Number(item.id) === Number(cliente.id));
        if (index >= 0) CLIENTESdata[index] = cliente;
        else CLIENTESdata.push(cliente);
        renderClientes(document.getElementById('client-search')?.value);
        ocultarFormularioCliente();
        alert(editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
    } catch (error) {
        alert(error.message);
    } finally {
        submitButton.disabled = false;
    }
}

function editarCliente(clienteId) {
    const cliente = CLIENTESdata.find(item => Number(item.id) === Number(clienteId));
    if (!cliente) return;
    clienteEmEdicao = Number(cliente.id);
    const section = document.getElementById('client-form-section');
    const form = document.getElementById('client-form');
    form.elements.nome.value = cliente.nome || '';
    form.elements.documento.value = cliente.documento || '';
    form.elements.telefone.value = cliente.telefone || '';
    form.elements.email.value = cliente.email || '';
    form.elements.observacao.value = cliente.observacao || '';
    section.querySelector('h2').textContent = 'Editar cliente';
    section.querySelector('button[type="submit"]').textContent = 'Salvar alterações';
    section.hidden = false;
    document.getElementById('client-name').focus();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function excluirCliente(clienteId) {
    const cliente = CLIENTESdata.find(item => Number(item.id) === Number(clienteId));
    if (!cliente || !confirm(`Excluir o cliente "${cliente.nome}"? Clientes com veículos ou AETs vinculados não podem ser excluídos.`)) return;
    try {
        await API.request(`/clientes/${clienteId}`, { method: 'DELETE' });
        CLIENTESdata = CLIENTESdata.filter(item => Number(item.id) !== Number(clienteId));
        renderClientes(document.getElementById('client-search')?.value);
        alert('Cliente excluído com sucesso.');
    } catch (error) {
        alert(error.message);
    }
}

// Resumo das AETs de um cliente
function resumoCliente(clienteId) {
    const aets = aetsDoCliente(clienteId);
    return {
        aets,
        total: aets.length,
        regulares: aets.filter(a => statusAET(a) === 'Regular').length,
        atencao: aets.filter(a => statusAET(a) === 'Atenção' || statusAET(a) === 'Alta prioridade').length,
        vencidas: aets.filter(a => statusAET(a) === 'Vencida').length,
        renovacao: aets.filter(a => statusAET(a) === 'Renovação em andamento').length,
        renovadas: aets.filter(a => statusAET(a) === 'Renovada').length
    };
}

function renderClientes(termo) {
    const tbody = document.getElementById('clients-body');
    if (!tbody) return;

    const busca = (termo || '').toLowerCase();

    const lista = CLIENTESdata.filter(c =>
        !busca ||
        String(c.nome || '').toLowerCase().includes(busca) ||
        String(c.documento || '').toLowerCase().includes(busca) ||
        String(c.email || '').toLowerCase().includes(busca) ||
        String(c.telefone || '').toLowerCase().includes(busca)
    );

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state">Nenhum cliente encontrado.</div></td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(c => {
        const r = resumoCliente(c.id);
        return `
        <tr>
            <td>${escapeHTML(c.nome)}</td>
            <td>${escapeHTML(c.documento)}</td>
            <td>${escapeHTML(c.telefone)}</td>
            <td>${escapeHTML(c.email)}</td>
            <td><span class="count-pill">${r.total}</span></td>
            <td><span class="count-pill warn">${r.atencao}</span></td>
            <td><span class="count-pill danger">${r.vencidas}</span></td>
            <td><span class="count-pill">${r.renovacao}</span></td>
            <td><span class="count-pill">${r.renovadas}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="action-btn tooltip" data-tooltip="Ver detalhes" onclick="verCliente(${c.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="action-btn tooltip" data-tooltip="Editar cliente" onclick="editarCliente(${c.id})" aria-label="Editar cliente">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete tooltip" data-tooltip="Excluir cliente" onclick="excluirCliente(${c.id})" aria-label="Excluir cliente">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function verCliente(clienteId) {
    const cliente = CLIENTESdata.find(c => c.id === clienteId);
    if (!cliente) return;

    const r = resumoCliente(clienteId);
    const body = document.getElementById('client-modal-body');
    document.getElementById('client-modal-title').textContent = cliente.nome;

    const linha = (label, valor) => `
        <div class="modal-detail-row">
            <div class="modal-detail-label">${label}</div>
            <div class="modal-detail-value">${valor}</div>
        </div>`;

    const stat = (label, valor) => `
        <div class="client-stat">
            <div class="client-stat-label">${label}</div>
            <div class="client-stat-value">${valor}</div>
        </div>`;

    const linhasAET = r.aets.length
        ? r.aets.map(a => `
            <tr>
                <td>${escapeHTML(a.numeroAET)}</td>
                <td>${escapeHTML(a.placas.join(' / '))}</td>
                <td>${escapeHTML(a.vencimento)}</td>
                <td><span class="prazo-text ${classePrazo(a)}">${textoPrazo(a)}</span></td>
                <td><span class="status-badge ${classeStatus(statusAET(a))}">${escapeHTML(statusAET(a))}</span></td>
                <td><span class="priority-badge ${PRIORIDADE_CLASSES[prioridadeAET(a)]}">${prioridadeAET(a)}</span></td>
            </tr>`).join('')
        : '<tr><td colspan="6"><div class="empty-state">Nenhuma AET vinculada.</div></td></tr>';

    body.innerHTML = `
        ${linha('Nome / Razão Social', escapeHTML(cliente.nome))}
        ${linha('CPF/CNPJ', escapeHTML(cliente.documento || ''))}
        ${linha('Telefone', escapeHTML(cliente.telefone || ''))}
        ${linha('E-mail', escapeHTML(cliente.email || ''))}

        <div class="client-detail-grid" style="margin-top:20px;">
            ${stat('Total de AETs', r.total)}
            ${stat('Regulares', r.regulares)}
            ${stat('Em atenção', r.atencao)}
            ${stat('Vencidas', r.vencidas)}
            ${stat('Em renovação', r.renovacao)}
            ${stat('Renovadas', r.renovadas)}
        </div>

        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">AETs do cliente</h3>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Número AET</th>
                        <th>Placas</th>
                        <th>Vencimento</th>
                        <th>Prazo</th>
                        <th>Status</th>
                        <th>Prioridade</th>
                    </tr>
                </thead>
                <tbody>${linhasAET}</tbody>
            </table>
        </div>`;

    document.getElementById('client-modal').classList.add('active');
}

function closeClientModal() {
    document.getElementById('client-modal').classList.remove('active');
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('client-modal');
    if (e.target === modal) closeClientModal();
});
