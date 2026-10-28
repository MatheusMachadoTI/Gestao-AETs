const db = require('../config/database');

async function listar(req, res, next) {
    try {
        const termo = String(req.query.search || '').trim();
        const [rows] = await db.query(
            `SELECT c.*,
                    (SELECT COUNT(*) FROM aets a WHERE a.cliente_id = c.id) AS total_aets
             FROM clientes c
             WHERE (? = '' OR c.nome LIKE ? OR c.telefone LIKE ? OR c.email LIKE ?)
             ORDER BY c.nome`,
            [termo, `%${termo}%`, `%${termo}%`, `%${termo}%`]
        );
        res.json({ success: true, data: rows });
    } catch (error) { next(error); }
}

async function obter(req, res, next) {
    try {
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function criar(req, res, next) {
    try {
        const { nome, telefone = null, email = null, observacao = null, documento = null } = req.body;
        const erro = validarCliente({ nome, documento, telefone, email });
        if (erro) return res.status(400).json({ success: false, message: erro });
        const [result] = await db.query(
            'INSERT INTO clientes (nome, documento, telefone, email, observacao) VALUES (?, ?, ?, ?, ?)',
            [nome.trim(), documento, telefone, email, observacao]
        );
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function atualizar(req, res, next) {
    try {
        const { nome, telefone = null, email = null, observacao = null, documento = null } = req.body;
        const erro = validarCliente({ nome, documento, telefone, email });
        if (erro) return res.status(400).json({ success: false, message: erro });
        const [existentes] = await db.query('SELECT id FROM clientes WHERE id = ?', [req.params.id]);
        if (!existentes.length) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        await db.query(
            'UPDATE clientes SET nome = ?, documento = ?, telefone = ?, email = ?, observacao = ? WHERE id = ?',
            [nome.trim(), documento, telefone, email, observacao, req.params.id]
        );
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

function validarCliente({ nome, documento, telefone, email }) {
    if (!String(nome || '').trim()) return 'Nome do cliente é obrigatório';
    if (String(documento || '').length > 30 || String(telefone || '').length > 30) return 'Documento ou telefone excede o limite permitido';
    if (String(email || '').length > 160) return 'E-mail excede o limite permitido';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido';
    return null;
}

async function remover(req, res, next) {
    let connection;
    let transacaoIniciada = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoIniciada = true;
        const [clientes] = await connection.query('SELECT id FROM clientes WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!clientes.length) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }
        const [relacionamentos] = await connection.query(
            'SELECT (SELECT COUNT(*) FROM veiculos WHERE cliente_id = ?) AS veiculos, (SELECT COUNT(*) FROM aets WHERE cliente_id = ?) AS aets',
            [req.params.id, req.params.id]
        );
        if (Number(relacionamentos[0].veiculos) || Number(relacionamentos[0].aets)) {
            await connection.rollback();
            transacaoIniciada = false;
            return res.status(409).json({ success: false, message: 'Não é possível excluir um cliente que possui veículos ou AETs vinculados.' });
        }
        await connection.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        await connection.commit();
        transacaoIniciada = false;
        res.json({ success: true, message: 'Cliente excluído com sucesso' });
    } catch (error) {
        if (connection && transacaoIniciada) {
            try { await connection.rollback(); } catch (rollbackError) { next(rollbackError); return; }
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { listar, obter, criar, atualizar, remover };
