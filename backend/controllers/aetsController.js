const db = require('../config/database');

const STATUS = ['Regular', 'Atenção', 'Alta prioridade', 'Renovação em andamento', 'Renovada', 'Vencida'];
const PRIORIDADES = ['Urgente', 'Alta', 'Média', 'Normal', 'Em renovação', 'Resolvida'];
const selectBase = `SELECT a.*, c.nome AS cliente, v.placa, v.cavalo, v.carretas, v.comprimento, v.carroceria
FROM aets a JOIN clientes c ON c.id = a.cliente_id JOIN veiculos v ON v.id = a.veiculo_id`;

function prioridade(vencimento, status) {
    if (status === 'Renovação em andamento') return 'Em renovação';
    if (status === 'Renovada') return 'Resolvida';
    if (status === 'Vencida') return 'Urgente';
    const [year, month, day] = String(vencimento).slice(0, 10).split('-').map(Number);
    const hoje = new Date();
    const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dias = Math.ceil((Date.UTC(year, month - 1, day) - hojeUTC) / 86400000);
    if (dias <= 7) return 'Urgente';
    if (dias <= 15) return 'Alta';
    if (dias <= 30) return 'Média';
    return 'Normal';
}

function statusPorVencimento(vencimento) {
    const [year, month, day] = String(vencimento).slice(0, 10).split('-').map(Number);
    const hoje = new Date();
    const dias = Math.ceil((Date.UTC(year, month - 1, day) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
    if (dias < 0) return 'Vencida';
    if (dias <= 7) return 'Atenção';
    if (dias <= 15) return 'Alta prioridade';
    return 'Regular';
}

function apresentar(row) {
    return {
        ...row,
        placas: [row.placa],
        clienteId: row.cliente_id,
        numeroAET: row.numero_aet,
        prioridade: row.prioridade || prioridade(row.vencimento, row.status),
        vencimentoData: row.vencimento ? `${String(row.vencimento).slice(0, 10)}T00:00:00` : null
    };
}

function filtros(req) {
    const { search = '', cliente = '', numero_aet = '', placa = '', status = '', prioridade: prio = '', vencimento_inicio = '', vencimento_fim = '' } = req.query;
    const clauses = [];
    const values = [];
    if (search) { clauses.push('(c.nome LIKE ? OR a.numero_aet LIKE ? OR v.placa LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (cliente) { clauses.push('c.nome LIKE ?'); values.push(`%${cliente}%`); }
    if (numero_aet) { clauses.push('a.numero_aet LIKE ?'); values.push(`%${numero_aet}%`); }
    if (placa) { clauses.push('v.placa LIKE ?'); values.push(`%${placa}%`); }
    if (status) { clauses.push('a.status = ?'); values.push(status); }
    if (prio) { clauses.push('a.prioridade = ?'); values.push(prio); }
    if (vencimento_inicio) { clauses.push('a.vencimento >= ?'); values.push(vencimento_inicio); }
    if (vencimento_fim) { clauses.push('a.vencimento <= ?'); values.push(vencimento_fim); }
    return { sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}

function idValido(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function dataValida(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validarCampos(body) {
    const nome = String(body.cliente || '').trim();
    const numero = String(body.numero_aet || body.numeroAET || '').trim();
    if (!body.cliente_id && !nome) return 'Cliente é obrigatório';
    if (nome.length > 180) return 'Nome do cliente excede o limite permitido';
    if (!String(body.veiculo_id || '').trim() && (!String(body.placa || '').trim() || !String(body.cavalo || '').trim())) {
        return 'Placa e cavalo do veículo são obrigatórios';
    }
    if (String(body.placa || '').length > 20 || String(body.cavalo || '').length > 160) return 'Placa ou cavalo excede o limite permitido';
    if (!numero) return 'Número AET é obrigatório';
    if (numero.length > 80) return 'Número AET excede o limite permitido';
    if (!dataValida(body.vencimento)) return 'Data de vencimento inválida';
    if (!String(body.uf || '').trim() || String(body.uf).length > 10) return 'UF/Órgão é obrigatório e deve ter até 10 caracteres';
    if (body.status && !STATUS.includes(body.status)) return 'Status inválido';
    if (body.prioridade && !PRIORIDADES.includes(body.prioridade)) return 'Prioridade inválida';
    if (body.carretas !== undefined && (!Number.isInteger(Number(body.carretas)) || Number(body.carretas) < 0)) return 'Quantidade de carretas inválida';
    if (body.comprimento != null && String(body.comprimento).length > 30) return 'Comprimento excede o limite permitido';
    if (body.carroceria != null && String(body.carroceria).length > 80) return 'Carroceria excede o limite permitido';
    return null;
}

async function resolverRelacionamentos(connection, body) {
    let clienteId = idValido(body.cliente_id);
    const nome = String(body.cliente || '').trim();
    if (nome) {
        const [clientes] = await connection.query('SELECT id FROM clientes WHERE LOWER(nome) = LOWER(?)', [nome]);
        if (clientes.length) clienteId = clientes[0].id;
        else {
            const [novo] = await connection.query('INSERT INTO clientes (nome) VALUES (?)', [nome]);
            clienteId = novo.insertId;
        }
    }
    if (!clienteId) return { error: 'Cliente não encontrado' };
    const [clientes] = await connection.query('SELECT id FROM clientes WHERE id = ?', [clienteId]);
    if (!clientes.length) return { error: 'Cliente não encontrado' };

    const placa = String(body.placa || '').trim().toUpperCase();
    let veiculoId = idValido(body.veiculo_id);
    if (placa) {
        const [veiculos] = await connection.query('SELECT id FROM veiculos WHERE placa = ? AND cliente_id = ?', [placa, clienteId]);
        if (veiculos.length) veiculoId = veiculos[0].id;
        else if (String(body.cavalo || '').trim()) {
            const [novo] = await connection.query(
                'INSERT INTO veiculos (cliente_id, placa, cavalo, carretas, comprimento, carroceria) VALUES (?, ?, ?, ?, ?, ?)',
                [clienteId, placa, String(body.cavalo).trim(), Number(body.carretas || 0), body.comprimento || null, body.carroceria || null]
            );
            veiculoId = novo.insertId;
        } else {
            return { error: 'Veículo não encontrado para o cliente informado' };
        }
    }

    if (!veiculoId) return { error: 'Veículo é obrigatório' };
    const [veiculos] = await connection.query('SELECT * FROM veiculos WHERE id = ? AND cliente_id = ?', [veiculoId, clienteId]);
    if (!veiculos.length) return { error: 'O veículo informado não pertence ao cliente selecionado' };
    const veiculo = veiculos[0];
    if (placa && String(body.cavalo || '').trim()) {
        await connection.query(
            'UPDATE veiculos SET placa = ?, cavalo = ?, carretas = ?, comprimento = ?, carroceria = ? WHERE id = ?',
            [placa, String(body.cavalo).trim(), Number(body.carretas || 0), body.comprimento || null, body.carroceria || null, veiculoId]
        );
    }
    return { clienteId, veiculoId, veiculo };
}

async function listar(req, res, next) {
    try {
        const f = filtros(req);
        const [rows] = await db.query(`${selectBase}${f.sql} ORDER BY a.vencimento`, f.values);
        res.json({ success: true, data: rows.map(apresentar) });
    } catch (error) { next(error); }
}

async function obter(req, res, next) {
    try {
        const [rows] = await db.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'AET não encontrada' });
        res.json({ success: true, data: apresentar(rows[0]) });
    } catch (error) { next(error); }
}

async function criar(req, res, next) {
    let connection;
    let transacaoIniciada = false;
    try {
        const erro = validarCampos(req.body);
        if (erro) return res.status(400).json({ success: false, message: erro });
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoIniciada = true;
        const ids = await resolverRelacionamentos(connection, req.body);
        if (ids.error) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(400).json({ success: false, message: ids.error });
        }
        const statusInformado = req.body.status || statusPorVencimento(req.body.vencimento);
        const status = !['Renovação em andamento', 'Renovada'].includes(statusInformado) &&
            statusPorVencimento(req.body.vencimento) === 'Vencida'
            ? 'Vencida'
            : statusInformado;
        const prio = req.body.prioridade || prioridade(req.body.vencimento, status);
        const [result] = await connection.query(
            'INSERT INTO aets (cliente_id, veiculo_id, numero_aet, vencimento, uf, status, prioridade, observacao, data_renovacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [ids.clienteId, ids.veiculoId, String(req.body.numero_aet || req.body.numeroAET).trim(), req.body.vencimento, req.body.uf.trim(), status, prio, req.body.observacao || null, req.body.data_renovacao || null]
        );
        await connection.query('INSERT INTO historico (aet_id, tipo, descricao, status_novo) VALUES (?, ?, ?, ?)', [result.insertId, 'Cadastro', 'AET cadastrada', status]);
        const [rows] = await connection.query(`${selectBase} WHERE a.id = ?`, [result.insertId]);
        await connection.commit();
        transacaoIniciada = false;
        res.status(201).json({ success: true, data: apresentar(rows[0]) });
    } catch (error) {
        if (connection && transacaoIniciada) {
            try { await connection.rollback(); } catch (rollbackError) { next(rollbackError); return; }
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

async function atualizar(req, res, next) {
    let connection;
    let transacaoIniciada = false;
    try {
        const erro = validarCampos(req.body);
        if (erro) return res.status(400).json({ success: false, message: erro });
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoIniciada = true;
        const [antesRows] = await connection.query('SELECT * FROM aets WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!antesRows.length) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(404).json({ success: false, message: 'AET não encontrada' });
        }
        const antes = antesRows[0];
        const ids = await resolverRelacionamentos(connection, req.body);
        if (ids.error) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(400).json({ success: false, message: ids.error });
        }
        const statusInformado = req.body.status || antes.status;
        const status = !['Renovação em andamento', 'Renovada'].includes(statusInformado) &&
            statusPorVencimento(req.body.vencimento) === 'Vencida'
            ? 'Vencida'
            : statusInformado;
        const prio = ['Renovação em andamento', 'Renovada', 'Vencida'].includes(status)
            ? prioridade(req.body.vencimento, status)
            : req.body.prioridade || prioridade(req.body.vencimento, status);
        await connection.query(
            'UPDATE aets SET cliente_id = ?, veiculo_id = ?, numero_aet = ?, vencimento = ?, uf = ?, status = ?, prioridade = ?, observacao = ?, data_renovacao = COALESCE(?, data_renovacao) WHERE id = ?',
            [ids.clienteId, ids.veiculoId, String(req.body.numero_aet || req.body.numeroAET).trim(), req.body.vencimento, req.body.uf.trim(), status, prio, req.body.observacao || null, req.body.data_renovacao || null, req.params.id]
        );
        if (antes.status !== status) {
            await connection.query(
                'INSERT INTO historico (aet_id, tipo, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)',
                [req.params.id, 'Status alterado', `De: ${antes.status} | Para: ${status}`, antes.status, status]
            );
        } else if (antes.vencimento !== req.body.vencimento || antes.prioridade !== prio ||
            antes.numero_aet !== (req.body.numero_aet || req.body.numeroAET) ||
            Number(antes.cliente_id) !== Number(ids.clienteId) || Number(antes.veiculo_id) !== Number(ids.veiculoId)) {
            await connection.query('INSERT INTO historico (aet_id, tipo, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)', [
                req.params.id, 'Atualização', 'Dados da AET atualizados', antes.status, status
            ]);
        }
        const [rows] = await connection.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
        await connection.commit();
        transacaoIniciada = false;
        res.json({ success: true, data: apresentar(rows[0]) });
    } catch (error) {
        if (connection && transacaoIniciada) {
            try { await connection.rollback(); } catch (rollbackError) { next(rollbackError); return; }
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

async function mudarStatus(req, res, status, descricao, next) {
    let connection;
    let transacaoIniciada = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoIniciada = true;
        const [antes] = await connection.query('SELECT * FROM aets WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!antes.length) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(404).json({ success: false, message: 'AET não encontrada' });
        }
        const novoStatus = status === 'Regular' ? statusPorVencimento(antes[0].vencimento) : status;
        if (antes[0].status === novoStatus) {
            await connection.rollback();
            transacaoIniciada = false;
            const [rows] = await db.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
            return res.json({ success: true, data: apresentar(rows[0]) });
        }
        await connection.query(
            'UPDATE aets SET status = ?, prioridade = ?, data_renovacao = CASE WHEN ? IN (?, ?) THEN CURDATE() ELSE data_renovacao END WHERE id = ?',
            [novoStatus, prioridade(antes[0].vencimento, novoStatus), novoStatus, 'Renovação em andamento', 'Renovada', req.params.id]
        );
        await connection.query(
            'INSERT INTO historico (aet_id, tipo, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, 'Status', descricao, antes[0].status, novoStatus]
        );
        const [rows] = await connection.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
        await connection.commit();
        transacaoIniciada = false;
        res.json({ success: true, data: apresentar(rows[0]) });
    } catch (error) {
        if (connection && transacaoIniciada) {
            try { await connection.rollback(); } catch (rollbackError) { next(rollbackError); return; }
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

function enviarParaRenovacao(req, res, next) { return mudarStatus(req, res, 'Renovação em andamento', 'Empresa responsável acionada para renovação da AET', next); }
function marcarComoRenovada(req, res, next) { return mudarStatus(req, res, 'Renovada', 'Renovação confirmada e AET marcada como renovada', next); }
function cancelarRenovacao(req, res, next) { return mudarStatus(req, res, 'Regular', 'Status de renovação corrigido manualmente', next); }

async function historico(req, res, next) {
    try {
        const [aets] = await db.query('SELECT id FROM aets WHERE id = ?', [req.params.id]);
        if (!aets.length) return res.status(404).json({ success: false, message: 'AET não encontrada' });
        const [rows] = await db.query('SELECT * FROM historico WHERE aet_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) { next(error); }
}

async function adicionarHistorico(req, res, next) {
    try {
        const tipo = String(req.body.tipo || '').trim();
        const descricao = String(req.body.descricao || '').trim();
        if (!tipo || !descricao) return res.status(400).json({ success: false, message: 'Tipo e descrição são obrigatórios' });
        if (tipo.length > 50 || descricao.length > 255) return res.status(400).json({ success: false, message: 'Tipo ou descrição excede o limite permitido' });
        const [aets] = await db.query('SELECT id FROM aets WHERE id = ?', [req.params.id]);
        if (!aets.length) return res.status(404).json({ success: false, message: 'AET não encontrada' });
        const [result] = await db.query('INSERT INTO historico (aet_id, tipo, descricao) VALUES (?, ?, ?)', [req.params.id, tipo, descricao]);
        const [rows] = await db.query('SELECT * FROM historico WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function remover(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM aets WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'AET não encontrada' });
        res.json({ success: true, message: 'AET excluída com sucesso' });
    } catch (error) { next(error); }
}

module.exports = { listar, obter, criar, atualizar, remover, historico, adicionarHistorico, enviarParaRenovacao, marcarComoRenovada, cancelarRenovacao };
