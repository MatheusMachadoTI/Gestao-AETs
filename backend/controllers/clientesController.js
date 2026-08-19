const db = require('../config/database');

async function listar(req, res, next) {
    try {
        const termo = String(req.query.search || '').trim();
        const [rows] = await db.query(
            `SELECT c.*, COUNT(DISTINCT a.id) AS total_aets
             FROM clientes c LEFT JOIN aets a ON a.cliente_id = c.id
             WHERE ? = '' OR c.nome LIKE ? OR c.telefone LIKE ? OR c.email LIKE ?
             GROUP BY c.id ORDER BY c.nome`,
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
        if (!String(nome || '').trim()) return res.status(400).json({ success: false, message: 'Nome do cliente é obrigatório' });
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
        if (!String(nome || '').trim()) return res.status(400).json({ success: false, message: 'Nome do cliente é obrigatório' });
        const [result] = await db.query(
            'UPDATE clientes SET nome = ?, documento = ?, telefone = ?, email = ?, observacao = ? WHERE id = ?',
            [nome.trim(), documento, telefone, email, observacao, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function remover(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        res.json({ success: true, message: 'Cliente excluído com sucesso' });
    } catch (error) { next(error); }
}

module.exports = { listar, obter, criar, atualizar, remover };
