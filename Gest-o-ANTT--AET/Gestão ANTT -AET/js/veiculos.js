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

function dadosVeiculos() {
    const veiculos = [];
    AETdata.forEach(aet => {
        (aet.placas || []).forEach(placa => veiculos.push({ placa, aet }));
    });
    return veiculos;
}

function renderVeiculos(termo = '') {
    const tbody = document.getElementById('vehicles-body');
    if (!tbody) return;
    const busca = termo.toLowerCase();
    const lista = dadosVeiculos().filter(item =>
        !busca || item.placa.toLowerCase().includes(busca) || item.aet.cliente.toLowerCase().includes(busca)
    );
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">Nenhum veículo encontrado.</div></td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(item => {
        const aet = item.aet;
        const status = statusAET(aet);
        return `<tr class="vehicle-row" tabindex="0" onclick="verVeiculo('${escapeHTML(item.placa)}')">
            <td><strong>${escapeHTML(item.placa)}</strong></td>
            <td>${escapeHTML(aet.cliente)}</td>
            <td>${escapeHTML(aet.cavalo)}</td>
            <td>${escapeHTML(aet.carretas)}</td>
            <td>${escapeHTML(aet.comprimento)}</td>
            <td>${escapeHTML(aet.carroceria)}</td>
            <td><span class="status-badge ${classeStatus(status)}">${escapeHTML(status)}</span></td>
        </tr>`;
    }).join('');
}

function verVeiculo(placa) {
    const aets = dadosVeiculos().filter(item => item.placa === placa).map(item => item.aet);
    const body = document.getElementById('vehicle-modal-body');
    if (!body || !aets.length) return;
    body.innerHTML = `<p class="page-subtitle">AETs relacionadas à placa ${escapeHTML(placa)}</p><div class="table-wrapper"><table class="data-table"><thead><tr><th>Número AET</th><th>Vencimento</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${aets.map(aet => `<tr><td>${escapeHTML(aet.numeroAET)}</td><td>${escapeHTML(aet.vencimento)}</td><td><span class="prazo-text ${classePrazo(aet)}">${textoPrazo(aet)}</span></td><td><span class="status-badge ${classeStatus(statusAET(aet))}">${escapeHTML(statusAET(aet))}</span></td></tr>`).join('')}</tbody></table></div>`;
    document.getElementById('vehicle-modal-title').textContent = `Veículo ${placa}`;
    document.getElementById('vehicle-modal').classList.add('active');
}

function closeVehicleModal() {
    document.getElementById('vehicle-modal')?.classList.remove('active');
}

window.addEventListener('click', event => {
    const modal = document.getElementById('vehicle-modal');
    if (event.target === modal) closeVehicleModal();
});
