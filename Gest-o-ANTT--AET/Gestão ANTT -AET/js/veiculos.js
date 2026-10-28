document.addEventListener('DOMContentLoaded', () => {
    renderVeiculos();
    const busca = document.getElementById('vehicle-search');
    const headerBusca = document.getElementById('header-search');
    if (busca) busca.addEventListener('input', () => renderVeiculos(busca.value));
    if (headerBusca) headerBusca.addEventListener('input', () => {
        if (busca) busca.value = headerBusca.value;
        renderVeiculos(headerBusca.value);
    });
});
document.addEventListener('aet-data-ready', () => renderVeiculos(document.getElementById('vehicle-search')?.value || ''));

function aetsDoVeiculo(veiculoId) {
    return AETdata.filter(aet => Number(aet.veiculo_id) === Number(veiculoId));
}

function renderVeiculos(termo = '') {
    const tbody = document.getElementById('vehicles-body');
    if (!tbody) return;
    const busca = String(termo).toLowerCase();
    const lista = VEICULOSdata.filter(veiculo =>
        !busca || String(veiculo.placa || '').toLowerCase().includes(busca) ||
        String(veiculo.cliente || '').toLowerCase().includes(busca)
    );
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state">Nenhum veículo encontrado.</div></td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(veiculo => {
        const relacionadas = aetsDoVeiculo(veiculo.id);
        const status = relacionadas.length ? statusAET(relacionadas[0]) : 'Sem AET';
        return `<tr>
            <td><strong>${escapeHTML(veiculo.placa)}</strong></td>
            <td>${escapeHTML(veiculo.cliente)}</td>
            <td>${escapeHTML(veiculo.cavalo)}</td>
            <td>${escapeHTML(veiculo.carretas)}</td>
            <td>${escapeHTML(veiculo.comprimento || '')}</td>
            <td>${escapeHTML(veiculo.carroceria || '')}</td>
            <td><span class="status-badge ${relacionadas.length ? classeStatus(status) : ''}">${escapeHTML(status)}</span></td>
            <td><div class="actions-cell">
                <button class="action-btn tooltip" data-tooltip="Detalhes" onclick="verVeiculo(${veiculo.id})" aria-label="Detalhes do veículo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button class="action-btn tooltip" data-tooltip="Editar veículo" onclick="editarVeiculo(${veiculo.id})" aria-label="Editar veículo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button class="action-btn delete tooltip" data-tooltip="Excluir veículo" onclick="excluirVeiculo(${veiculo.id})" aria-label="Excluir veículo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div></td>
        </tr>`;
    }).join('');
}

function abrirModalVeiculo(titulo, conteudo) {
    document.getElementById('vehicle-modal-title').textContent = titulo;
    document.getElementById('vehicle-modal-body').innerHTML = conteudo;
    document.getElementById('vehicle-modal').classList.add('active');
}

function novoVeiculo() {
    renderFormularioVeiculo();
}

function editarVeiculo(veiculoId) {
    const veiculo = VEICULOSdata.find(item => Number(item.id) === Number(veiculoId));
    if (veiculo) renderFormularioVeiculo(veiculo);
}

function renderFormularioVeiculo(veiculo = null) {
    const opcoesCliente = CLIENTESdata.map(cliente =>
        `<option value="${cliente.id}" ${Number(cliente.id) === Number(veiculo?.cliente_id) ? 'selected' : ''}>${escapeHTML(cliente.nome)}</option>`
    ).join('');
    const markup = CLIENTESdata.length
        ? `<form id="vehicle-form">
            <div class="form-group">
                <label for="vehicle-client">Cliente *</label>
                <select id="vehicle-client" name="cliente_id" required><option value="">Selecione um cliente</option>${opcoesCliente}</select>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="vehicle-plate">Placa *</label><input id="vehicle-plate" name="placa" maxlength="20" required value="${escapeHTML(veiculo?.placa || '')}"></div>
                <div class="form-group"><label for="vehicle-truck">Cavalo *</label><input id="vehicle-truck" name="cavalo" maxlength="160" required value="${escapeHTML(veiculo?.cavalo || '')}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="vehicle-trailers">Carretas</label><input id="vehicle-trailers" name="carretas" type="number" min="0" step="1" value="${escapeHTML(veiculo?.carretas ?? 0)}"></div>
                <div class="form-group"><label for="vehicle-length">Comprimento</label><input id="vehicle-length" name="comprimento" maxlength="30" value="${escapeHTML(veiculo?.comprimento || '')}"></div>
            </div>
            <div class="form-group"><label for="vehicle-bodywork">Carroceria</label><input id="vehicle-bodywork" name="carroceria" maxlength="80" value="${escapeHTML(veiculo?.carroceria || '')}"></div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">${veiculo ? 'Salvar alterações' : 'Cadastrar veículo'}</button></div>
        </form>`
        : '<p>Cadastre um cliente antes de cadastrar veículos.</p>';
    abrirModalVeiculo(veiculo ? 'Editar veículo' : 'Cadastrar veículo', markup);
    const form = document.getElementById('vehicle-form');
    if (form) form.addEventListener('submit', event => salvarVeiculo(event, veiculo?.id));
}

async function salvarVeiculo(event, veiculoId) {
    event.preventDefault();
    const form = event.currentTarget;
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
        const dados = Object.fromEntries(new FormData(form).entries());
        const veiculo = await API.request(veiculoId ? `/veiculos/${veiculoId}` : '/veiculos', {
            method: veiculoId ? 'PUT' : 'POST',
            body: JSON.stringify(dados)
        });
        const index = VEICULOSdata.findIndex(item => Number(item.id) === Number(veiculo.id));
        if (index >= 0) VEICULOSdata[index] = veiculo;
        else VEICULOSdata.push(veiculo);
        renderVeiculos(document.getElementById('vehicle-search')?.value || '');
        closeVehicleModal();
        alert(veiculoId ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.');
    } catch (error) {
        alert(error.message);
    } finally {
        botao.disabled = false;
    }
}

async function excluirVeiculo(veiculoId) {
    const veiculo = VEICULOSdata.find(item => Number(item.id) === Number(veiculoId));
    if (!veiculo || !confirm(`Excluir o veículo "${veiculo.placa}"? Veículos vinculados a AETs não podem ser excluídos.`)) return;
    try {
        await API.request(`/veiculos/${veiculoId}`, { method: 'DELETE' });
        VEICULOSdata = VEICULOSdata.filter(item => Number(item.id) !== Number(veiculoId));
        renderVeiculos(document.getElementById('vehicle-search')?.value || '');
        alert('Veículo excluído com sucesso.');
    } catch (error) {
        alert(error.message);
    }
}

function verVeiculo(veiculoId) {
    const veiculo = VEICULOSdata.find(item => Number(item.id) === Number(veiculoId));
    if (!veiculo) return;
    const aets = aetsDoVeiculo(veiculo.id);
    const listaAETs = aets.length
        ? `<div class="table-wrapper"><table class="data-table"><thead><tr><th>Número AET</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${aets.map(aet => `<tr><td>${escapeHTML(aet.numeroAET)}</td><td>${escapeHTML(aet.vencimento)}</td><td><span class="status-badge ${classeStatus(statusAET(aet))}">${escapeHTML(statusAET(aet))}</span></td></tr>`).join('')}</tbody></table></div>`
        : '<p>Este veículo ainda não possui AET cadastrada.</p>';
    const detalhes = `<p><strong>Cliente:</strong> ${escapeHTML(veiculo.cliente)}</p><p><strong>Placa:</strong> ${escapeHTML(veiculo.placa)}</p><p><strong>Cavalo:</strong> ${escapeHTML(veiculo.cavalo)}</p><p><strong>Carretas:</strong> ${escapeHTML(veiculo.carretas)}</p><p><strong>Comprimento:</strong> ${escapeHTML(veiculo.comprimento || '')}</p><p><strong>Carroceria:</strong> ${escapeHTML(veiculo.carroceria || '')}</p><h3>AETs relacionadas</h3>${listaAETs}`;
    abrirModalVeiculo(`Veículo ${veiculo.placa}`, detalhes);
}

function closeVehicleModal() {
    document.getElementById('vehicle-modal')?.classList.remove('active');
}

window.addEventListener('click', event => {
    const modal = document.getElementById('vehicle-modal');
    if (event.target === modal) closeVehicleModal();
});
