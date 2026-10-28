/* Dashboard / listagem de AETs
   Os dados vêm de js/data.js (fonte única do sistema). */

// VARIÁVEIS GLOBAIS
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [...AETdata];
let categoriaAtiva = '';   // filtro do painel de vencimentos
let aetAtual = null;       // AET aberta no modal
let calendarioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// INICIALIZAR PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    renderCalendario();
    applyFilters();
    setupEventListeners();
});
document.addEventListener('aet-data-ready', atualizarDashboard);

// CONFIGURAR EVENT LISTENERS
function setupEventListeners() {
    const tableSearch = document.getElementById('table-search');
    const statusFilter = document.getElementById('status-filter');
    const periodFilter = document.getElementById('period-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const calendarPrev = document.getElementById('calendar-prev');
    const calendarNext = document.getElementById('calendar-next');

    if (tableSearch) tableSearch.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (periodFilter) periodFilter.addEventListener('change', applyFilters);
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
    if (prevBtn) prevBtn.addEventListener('click', previousPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);
    if (calendarPrev) calendarPrev.addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() - 1);
        renderCalendario();
    });
    if (calendarNext) calendarNext.addEventListener('click', () => {
        calendarioMes.setMonth(calendarioMes.getMonth() + 1);
        renderCalendario();
    });

    // Busca do header replica a busca da tabela
    const headerSearch = document.getElementById('header-search');
    if (headerSearch && tableSearch) {
        headerSearch.addEventListener('input', () => {
            tableSearch.value = headerSearch.value;
            applyFilters();
        });
    }
}

function chaveData(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function classeDiaCalendario(aets) {
    const statuses = aets.map(statusAET);
    if (statuses.includes('Vencida')) return 'calendar-expired';
    if (statuses.includes('Renovação em andamento')) return 'calendar-renewal';
    if (statuses.includes('Renovada')) return 'calendar-renewed';
    if (statuses.includes('Alta prioridade')) return 'calendar-critical';
    if (statuses.includes('Atenção')) return 'calendar-warning';
    return 'calendar-renewed';
}

function renderCalendario() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-month');
    if (!grid || !title) return;

    title.textContent = calendarioMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const firstDay = (new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const todayKey = chaveData(hojeSemHora());
    const byDate = AETdata.reduce((groups, aet) => {
        const date = parseDataBR(aet.vencimento);
        const key = chaveData(date);
        groups[key] = groups[key] || [];
        groups[key].push(aet);
        return groups;
    }, {});

    grid.innerHTML = '';
    for (let cell = 0; cell < totalCells; cell++) {
        const day = cell - firstDay + 1;
        if (day < 1 || day > daysInMonth) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day calendar-day-empty';
            emptyDay.setAttribute('role', 'gridcell');
            grid.appendChild(emptyDay);
            continue;
        }

        const date = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth(), day);
        const aets = byDate[chaveData(date)] || [];
        if (!aets.length) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day calendar-day-empty';
            emptyDay.setAttribute('role', 'gridcell');
            emptyDay.innerHTML = `<strong class="calendar-day-number">${day}</strong>`;
            grid.appendChild(emptyDay);
            continue;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `calendar-day ${classeDiaCalendario(aets)}${chaveData(date) === todayKey ? ' calendar-day-today' : ''}`;
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', `${formatarDataBR(date)}: ${aets.length} AET${aets.length > 1 ? 's' : ''}`);
        button.innerHTML = `<strong class="calendar-day-number">${day}</strong><span class="calendar-day-count">${aets.length} AET${aets.length > 1 ? 's' : ''}</span>`;
        button.addEventListener('click', () => mostrarAETsNaData(date, aets));
        grid.appendChild(button);
    }
}

function mostrarAETsNaData(data, aets) {
    const result = document.getElementById('calendar-results');
    if (!result) return;
    if (!aets.length) {
        result.textContent = `${formatarDataBR(data)}: nenhuma AET vence nesta data.`;
        return;
    }
    result.innerHTML = `<h3>${data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</h3><div class="calendar-event-list">${aets.map(a => `
        <article class="calendar-event">
            <button type="button" class="calendar-event-link" onclick="viewAET(${a.id})">${escapeHTML(a.cliente)}</button>
            <span>${escapeHTML(a.placas.join(' / '))}</span>
            <span>${escapeHTML(a.numeroAET)}</span>
            <span>Vencimento: ${escapeHTML(a.vencimento)} · ${escapeHTML(textoPrazo(a))}</span>
            <span class="status-badge ${classeStatus(statusAET(a))}">${escapeHTML(statusAET(a))}</span>
        </article>`).join('')}</div>`;
}

// Indicadores carregados do endpoint de dashboard
function renderCards(s) {
    const set = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };
    set('card-total', s.total);
    set('card-regular', s.regulares);
    set('card-attention', s.atencao + s.alta_prioridade);
    set('card-expired', s.vencidas);
    set('card-renewal', s.renovacao_em_andamento);
    set('card-renewed', s.renovadas);
}

// PAINEL DE VENCIMENTOS
function renderPainelVencimentos(s) {
    const set = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };
    set('alert-vencidas', s.vencidas);
    set('alert-hoje', s.vencendo_hoje);
    set('alert-7dias', Math.max(0, s.vencendo_7_dias - s.vencendo_hoje));
    set('alert-30dias', Math.max(0, s.vencendo_30_dias - s.vencendo_7_dias));
}

// Clique nas categorias do painel filtra a tabela
function filtrarCategoria(categoria) {
    categoriaAtiva = categoriaAtiva === categoria ? '' : categoria;

    document.querySelectorAll('.alert-card').forEach(card => {
        card.classList.toggle('active', card.dataset.categoria === categoriaAtiva);
    });

    applyFilters();

    const tabela = document.querySelector('.table-section');
    if (tabela && categoriaAtiva) tabela.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// APLICAR FILTROS
function applyFilters() {
    const searchTerm = document.getElementById('table-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const periodFilter = document.getElementById('period-filter')?.value || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';

    filteredData = AETdata.filter(aet => {
        const matchesSearch = !searchTerm ||
            aet.cliente.toLowerCase().includes(searchTerm) ||
            aet.numeroAET.toLowerCase().includes(searchTerm) ||
            aet.placas.some(placa => placa.toLowerCase().includes(searchTerm));

        const matchesStatus = !statusFilter || statusAET(aet) === statusFilter;
        const matchesPriority = !priorityFilter || prioridadeAET(aet) === priorityFilter;
        const matchesCategoria = !categoriaAtiva || categoriaVencimento(aet) === categoriaAtiva;

        // Filtro de período
        let matchesPeriod = true;
        if (periodFilter) {
            const today = hojeSemHora();
            const vencimento = aet.vencimentoData;
            const daysUntilExpiry = diasParaVencimento(aet);

            switch (periodFilter) {
                case 'this-month':
                    matchesPeriod =
                        vencimento.getMonth() === today.getMonth() &&
                        vencimento.getFullYear() === today.getFullYear();
                    break;

                case 'next-month': {
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    matchesPeriod =
                        vencimento.getMonth() === nextMonth.getMonth() &&
                        vencimento.getFullYear() === nextMonth.getFullYear();
                    break;
                }

                case '30-days':
                    matchesPeriod = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                    break;

                case '60-days':
                    matchesPeriod = daysUntilExpiry >= 0 && daysUntilExpiry <= 60;
                    break;

                case 'expired':
                    matchesPeriod = daysUntilExpiry < 0;
                    break;
            }
        }

        return matchesSearch && matchesStatus && matchesPeriod && matchesPriority && matchesCategoria;
    });

    currentPage = 1;
    renderTable();
}

// RENDERIZAR TABELA
function renderTable() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (pageData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Nenhuma AET encontrada com os filtros aplicados.</div></td></tr>`;
        updatePagination();
        return;
    }

    tableBody.innerHTML = pageData.map(aet => {
        const prioridade = prioridadeAET(aet);
        const status = statusAET(aet);
        const renovacaoActions = status === 'Renovação em andamento'
            ? `
                <button class="action-btn tooltip" data-tooltip="Marcar como renovada" onclick="marcarRenovada(${aet.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                </button>
                <button class="action-btn tooltip" data-tooltip="Cancelar renovação" onclick="cancelarRenovacaoAET(${aet.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>`
            : status !== 'Renovada'
                ? `<button class="action-btn tooltip" data-tooltip="Enviar para renovação" onclick="enviarRenovacaoAET(${aet.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path></svg>
                </button>`
                : '';
        return `
        <tr>
            <td>${escapeHTML(aet.cliente)}</td>
            <td>${escapeHTML(aet.numeroAET)}</td>
            <td>${escapeHTML(aet.placas.join(' / '))}</td>
            <td>${escapeHTML(aet.vencimento)}</td>
            <td><span class="prazo-text ${classePrazo(aet)}">${textoPrazo(aet)}</span></td>
            <td><span class="status-badge ${classeStatus(status)}">${escapeHTML(status)}</span></td>
            <td><span class="priority-badge ${PRIORIDADE_CLASSES[prioridade]}">${prioridade}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="action-btn tooltip" data-tooltip="Visualizar" onclick="viewAET(${aet.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>

                    <button class="action-btn tooltip" data-tooltip="Editar" onclick="editAET(${aet.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>

                    <button class="action-btn delete tooltip" data-tooltip="Excluir" onclick="deleteAET(${aet.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                    ${renovacaoActions}
                </div>
            </td>
        </tr>`;
    }).join('');

    updatePagination();
}

// ATUALIZAR PAGINAÇÃO
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const paginationInfo = document.getElementById('pagination-info');
    const paginationNumbers = document.getElementById('pagination-numbers');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (!paginationInfo || !paginationNumbers || !prevBtn || !nextBtn) return;

    const startItem = filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);

    paginationInfo.textContent =
        `Mostrando ${startItem} a ${endItem} de ${filteredData.length} registros`;

    paginationNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        button.textContent = i;
        button.onclick = () => goToPage(i);
        paginationNumbers.appendChild(button);
    }

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// NAVEGAÇÃO
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// VISUALIZAR AET (detalhes + histórico)
function viewAET(id) {
    const aet = AETdata.find(a => a.id === id);
    if (!aet) return;

    aetAtual = aet;

    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const prioridade = prioridadeAET(aet);
    const status = statusAET(aet);
    const linha = (label, valor) => `
        <div class="modal-detail-row">
            <div class="modal-detail-label">${label}</div>
            <div class="modal-detail-value">${valor}</div>
        </div>`;

    modalBody.innerHTML =
        linha('Cliente', escapeHTML(aet.cliente)) +
        linha('Número AET', escapeHTML(aet.numeroAET)) +
        linha('Placas', escapeHTML(aet.placas.join(' / '))) +
        linha('Data de Vencimento', escapeHTML(aet.vencimento)) +
        linha('Prazo', `<span class="prazo-text ${classePrazo(aet)}">${textoPrazo(aet)}</span>`) +
        linha('Status', `<span class="status-badge ${classeStatus(status)}">${escapeHTML(status)}</span>`) +
        linha('Prioridade', `<span class="priority-badge ${PRIORIDADE_CLASSES[prioridade]}">${prioridade}</span>`) +
        linha('UF/Órgão', escapeHTML(aet.uf)) +
        linha('Cavalo', escapeHTML(aet.cavalo)) +
        linha('Carretas', escapeHTML(aet.carretas)) +
        linha('Comprimento', escapeHTML(aet.comprimento)) +
        linha('Carroceria', escapeHTML(aet.carroceria)) +
        linha('Observação', escapeHTML(aet.observacao)) +
        `
        <div class="historico-section">
            <div class="historico-header">
                <h3>Histórico</h3>
                    <button class="btn btn-secondary btn-small" onclick="toggleEventoForm()">Histórico</button>
            </div>

            <div class="evento-form" id="evento-form">
                <div class="form-line">
                    <div>
                        <label for="evento-data">Data</label>
                        <input type="date" id="evento-data">
                    </div>
                    <div>
                        <label for="evento-tipo">Tipo</label>
                        <select id="evento-tipo">
                            <option>Cadastro</option>
                            <option>Renovação</option>
                            <option>Outro</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label for="evento-descricao">Descrição</label>
                    <textarea id="evento-descricao" rows="2" placeholder="Descreva o evento..."></textarea>
                </div>
                <button class="btn btn-primary btn-small" onclick="salvarEvento()">Salvar evento</button>
            </div>

            <ul class="timeline" id="timeline"></ul>
        </div>`;

    renderTimeline(aet.id);
    openViewModal();
}

function renderTimeline(aetId) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    API.request(`/aets/${aetId}/historico`).then(eventos => {
        timeline.innerHTML = eventos.length
            ? eventos.map(ev => `
            <li class="timeline-item">
                <span class="timeline-date">${escapeHTML(dataAPIParaTela(ev.created_at))}</span>
                <span class="timeline-type">${escapeHTML(ev.tipo)}</span>
                <div class="timeline-desc">${escapeHTML(ev.descricao)}</div>
            </li>`).join('')
            : '<li class="timeline-item"><div class="timeline-desc">Nenhum evento registrado.</div></li>';
    }).catch(error => {
        timeline.innerHTML = `<li class="timeline-item"><div class="timeline-desc">${escapeHTML(`Não foi possível carregar o histórico: ${error.message}`)}</div></li>`;
    });
}

function toggleEventoForm() {
    const form = document.getElementById('evento-form');
    if (form) form.classList.toggle('active');
}

function salvarEvento() {
    if (!aetAtual) return;

    const dataInput = document.getElementById('evento-data');
    const tipo = document.getElementById('evento-tipo').value;
    const descricao = document.getElementById('evento-descricao').value.trim();

    if (!dataInput.value || !descricao) {
        alert('Informe a data e a descrição do evento.');
        return;
    }

    const partes = dataInput.value.split('-');
    const dataBR = formatarDataBR(new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2])));

    API.request(`/aets/${aetAtual.id}/historico`, { method: 'POST', body: JSON.stringify({ tipo, descricao, data: dataBR }) }).then(() => {
        renderTimeline(aetAtual.id);
        dataInput.value = '';
        document.getElementById('evento-descricao').value = '';
        toggleEventoForm();
        showSuccessMessage('Evento adicionado ao histórico');
    }).catch(error => showErrorMessage(error.message));
}

async function atualizarDashboard() {
    try {
        const resumo = await API.request('/dashboard');
        renderCards(resumo);
        renderPainelVencimentos(resumo);
    } catch (error) {
        showErrorMessage(`Não foi possível carregar os indicadores do dashboard: ${error.message}`);
    }
    renderCalendario();
    applyFilters();
}

function enviarRenovacaoAET(id) {
    if (!confirm('Confirmar envio desta AET para renovação?')) return;
    API.request(`/aets/${id}/renovacao`, { method: 'POST' }).then(aet => {
        const index = AETdata.findIndex(item => item.id === Number(id));
        if (index >= 0) AETdata[index] = API.aetAPIParaTela(aet);
        atualizarDashboard();
        showSuccessMessage('AET enviada para renovação.');
    }).catch(error => showErrorMessage(error.message));
}

function marcarRenovada(id) {
    if (!confirm('Confirmar que esta AET foi renovada?')) return;
    API.request(`/aets/${id}/renovada`, { method: 'POST' }).then(aet => {
        const index = AETdata.findIndex(item => item.id === Number(id));
        if (index >= 0) AETdata[index] = API.aetAPIParaTela(aet);
        atualizarDashboard();
        showSuccessMessage('AET marcada como renovada.');
    }).catch(error => showErrorMessage(error.message));
}

function cancelarRenovacaoAET(id) {
    if (!confirm('Cancelar a renovação desta AET?')) return;
    API.request(`/aets/${id}/cancelar-renovacao`, { method: 'POST' }).then(aet => {
        const index = AETdata.findIndex(item => item.id === Number(id));
        if (index >= 0) AETdata[index] = API.aetAPIParaTela(aet);
        atualizarDashboard();
        showSuccessMessage('Renovação cancelada.');
    }).catch(error => showErrorMessage(error.message));
}

// EDITAR AET
function editAET(id) {
    localStorage.setItem('editAETId', id);
    window.location.href = 'editar.html';
}

// DELETAR AET
function deleteAET(id) {
    if (confirm('Excluir esta AET e todo o histórico associado? Esta ação não pode ser desfeita.')) {
        API.request(`/aets/${id}`, { method: 'DELETE' }).then(() => {
            const index = AETdata.findIndex(a => Number(a.id) === Number(id));
            if (index > -1) AETdata.splice(index, 1);
            atualizarDashboard();
            showSuccessMessage('AET excluída com sucesso');
        }).catch(error => showErrorMessage(error.message));
    }
}

// MODAL
function openViewModal() {
    const modal = document.getElementById('view-modal');
    if (modal) modal.classList.add('active');
}

function closeViewModal() {
    const modal = document.getElementById('view-modal');
    if (modal) modal.classList.remove('active');
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('view-modal');
    if (e.target === modal) closeViewModal();
});

// MENSAGEM DE SUCESSO
function showSuccessMessage(message) {
    showToast(message, '#22A559');
}

function showErrorMessage(message) {
    showToast(message, '#B42318');
}

function showToast(message, color) {
    const messageEl = document.createElement('div');

    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${color};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(34, 165, 89, 0.2);
        font-weight: 600;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;

    messageEl.textContent = message;
    document.body.appendChild(messageEl);

    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// ANIMAÇÕES CSS
const style = document.createElement('style');

style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

document.head.appendChild(style);
