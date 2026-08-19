const db = require('../config/database');

const STATUS = ['Regular', 'Atenção', 'Alta prioridade', 'Renovação em andamento', 'Renovada', 'Vencida'];
const PRIORIDADES = ['Urgente', 'Alta', 'Média', 'Normal', 'Em renovação', 'Resolvida'];
const selectBase = `SELECT a.*, c.nome AS cliente, v.placa, v.cavalo, v.carretas, v.comprimento, v.carroceria
FROM aets a JOIN clientes c ON c.id = a.cliente_id JOIN veiculos v ON v.id = a.veiculo_id`;

function prioridade(vencimento, status) {
    if (status === 'Renovação em andamento') return 'Em renovação';
    if (status === 'Renovada') return 'Resolvida';
    if (status === 'Vencida') return 'Urgente';
    const hoje = new Date();
    const data = new Date(`${vencimento}T00:00:00`);
    const dias = Math.ceil((data - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
    if (dias <= 7) return 'Urgente';
    if (dias <= 15) return 'Alta';
    if (dias <= 30) return 'Média';
    return 'Normal';
}

function apresentar(row) {
    const status = row.status;
    return { ...row, placas: [row.placa], clienteId: row.cliente_id, numeroAET: row.numero_aet, vencimento: row.vencimento, prioridade: prioridade(row.vencimento, status), vencimentoData: row.vencimento ? new Date(`${row.vencimento}T00:00:00`).toISOString() : null };
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

async function resolverRelacionamentos(connection, body) {
    let clienteId = body.cliente_id;
    if (!clienteId && body.cliente) {
        const [clientes] = await connection.query('SELECT id FROM clientes WHERE LOWER(nome) = LOWER(?)', [body.cliente.trim()]);
        clienteId = clientes[0]?.id;
        if (!clienteId) {
            const [novo] = await connection.query('INSERT INTO clientes (nome) VALUES (?)', [body.cliente.trim()]);
            clienteId = novo.insertId;
        }
    }
    let veiculoId = body.veiculo_id;
    if (!veiculoId && body.placa) {
        const [veiculos] = await connection.query('SELECT id FROM veiculos WHERE placa = ? AND cliente_id = ?', [String(body.placa).toUpperCase(), clienteId]);
        veiculoId = veiculos[0]?.id;
    }
    if (!veiculoId && clienteId && body.cavalo) {
        const [novo] = await connection.query('INSERT INTO veiculos (cliente_id, placa, cavalo, carretas, comprimento, carroceria) VALUES (?, ?, ?, ?, ?, ?)', [clienteId, body.placa || `FIC-${Date.now().toString().slice(-6)}`, body.cavalo, body.carretas || 0, body.comprimento || null, body.carroceria || null]);
        veiculoId = novo.insertId;
    }
    return { clienteId, veiculoId };
}

function validar(body, ids) {
    if (!ids.clienteId) return 'Cliente é obrigatório';
    if (!ids.veiculoId) return 'Veículo é obrigatório';
    if (!String(body.numero_aet || body.numeroAET || '').trim()) return 'Número AET é obrigatório';
    if (!body.vencimento) return 'Vencimento é obrigatório';
    if (body.status && !STATUS.includes(body.status)) return 'Status inválido';
    return null;
}

async function criar(req, res, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const ids = await resolverRelacionamentos(connection, req.body);
        const erro = validar(req.body, ids);
        if (erro) { await connection.rollback(); return res.status(400).json({ success: false, message: erro }); }
        const status = req.body.status || 'Regular';
        const numero = req.body.numero_aet || req.body.numeroAET;
        const prio = req.body.prioridade || prioridade(req.body.vencimento, status);
        const [result] = await connection.query('INSERT INTO aets (cliente_id, veiculo_id, numero_aet, vencimento, uf, status, prioridade, observacao, data_renovacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [ids.clienteId, ids.veiculoId, numero.trim(), req.body.vencimento, req.body.uf || null, status, prio, req.body.observacao || null, req.body.data_renovacao || null]);
        await connection.query('INSERT INTO historico (aet_id, tipo, descricao, status_novo) VALUES (?, ?, ?, ?)', [result.insertId, 'Cadastro', 'AET cadastrada', status]);
        await connection.commit();
        const [rows] = await db.query(`${selectBase} WHERE a.id = ?`, [result.insertId]);
        res.status(201).json({ success: true, data: apresentar(rows[0]) });
    } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}

async function atualizar(req, res, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [antes] = await connection.query('SELECT * FROM aets WHERE id = ?', [req.params.id]);
        if (!antes.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'AET não encontrada' }); }
        const ids = await resolverRelacionamentos(connection, req.body);
        const erro = validar(req.body, ids);
        if (erro) { await connection.rollback(); return res.status(400).json({ success: false, message: erro }); }
        const status = req.body.status || antes[0].status;
        const prio = req.body.prioridade || prioridade(req.body.vencimento, status);
        await connection.query('UPDATE aets SET cliente_id = ?, veiculo_id = ?, numero_aet = ?, vencimento = ?, uf = ?, status = ?, prioridade = ?, observacao = ?, data_renovacao = COALESCE(?, data_renovacao) WHERE id = ?', [ids.clienteId, ids.veiculoId, (req.body.numero_aet || req.body.numeroAET).trim(), req.body.vencimento, req.body.uf || null, status, prio, req.body.observacao || null, req.body.data_renovacao || null, req.params.id]);
        if (antes[0].status !== status) await connection.query('INSERT INTO historico (aet_id, tipo, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)', [req.params.id, 'Status alterado', `De: ${antes[0].status} | Para: ${status}`, antes[0].status, status]);
        await connection.commit();
        const [rows] = await db.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
        res.json({ success: true, data: apresentar(rows[0]) });
    } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}

async function mudarStatus(req, res, status, descricao, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [antes] = await connection.query('SELECT * FROM aets WHERE id = ?', [req.params.id]);
        if (!antes.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'AET não encontrada' }); }
        const prio = prioridade(antes[0].vencimento, status);
        await connection.query('UPDATE aets SET status = ?, prioridade = ?, data_renovacao = CURDATE() WHERE id = ?', [status, prio, req.params.id]);
        await connection.query('INSERT INTO historico (aet_id, tipo, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)', [req.params.id, 'Status', descricao, antes[0].status, status]);
        await connection.commit();
        const [rows] = await db.query(`${selectBase} WHERE a.id = ?`, [req.params.id]);
        res.json({ success: true, data: apresentar(rows[0]) });
    } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}
function enviarParaRenovacao(req, res, next) { return mudarStatus(req, res, 'Renovação em andamento', 'AET enviada para renovação', next); }
function marcarComoRenovada(req, res, next) { return mudarStatus(req, res, 'Renovada', 'AET marcada como renovada', next); }
function cancelarRenovacao(req, res, next) { return mudarStatus(req, res, 'Regular', 'Renovação cancelada', next); }

async function historico(req, res, next) {
    try { const [rows] = await db.query('SELECT * FROM historico WHERE aet_id = ? ORDER BY created_at DESC', [req.params.id]); res.json({ success: true, data: rows }); } catch (error) { next(error); }
}
async function adicionarHistorico(req, res, next) {
    try {
        const { tipo, descricao } = req.body;
        if (!String(tipo || '').trim() || !String(descricao || '').trim()) return res.status(400).json({ success: false, message: 'Tipo e descrição são obrigatórios' });
        const [aets] = await db.query('SELECT id FROM aets WHERE id = ?', [req.params.id]);
        if (!aets.length) return res.status(404).json({ success: false, message: 'AET não encontrada' });
        await db.query('INSERT INTO historico (aet_id, tipo, descricao) VALUES (?, ?, ?)', [req.params.id, tipo.trim(), descricao.trim()]);
        res.status(201).json({ success: true, message: 'Evento adicionado ao histórico' });
    } catch (error) { next(error); }
}
async function remover(req, res, next) {
    try { const [result] = await db.query('DELETE FROM aets WHERE id = ?', [req.params.id]); if (!result.affectedRows) return res.status(404).json({ success: false, message: 'AET não encontrada' }); res.json({ success: true, message: 'AET excluída com sucesso' }); } catch (error) { next(error); }
}

module.exports = { listar, obter, criar, atualizar, remover, historico, adicionarHistorico, enviarParaRenovacao, marcarComoRenovada, cancelarRenovacao };
