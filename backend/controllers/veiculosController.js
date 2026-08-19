const db = require('../config/database');

const selectBase = `SELECT v.*, c.nome AS cliente, COUNT(DISTINCT a.id) AS total_aets
FROM veiculos v JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN aets a ON a.veiculo_id = v.id`;

async function listar(req, res, next) {
    try {
        const termo = String(req.query.search || '').trim();
        const [rows] = await db.query(`${selectBase} WHERE ? = '' OR v.placa LIKE ? OR c.nome LIKE ? GROUP BY v.id ORDER BY v.placa`, [termo, `%${termo}%`, `%${termo}%`]);
        res.json({ success: true, data: rows });
    } catch (error) { next(error); }
}

async function obter(req, res, next) {
    try {
        const [rows] = await db.query(`${selectBase} WHERE v.id = ? GROUP BY v.id`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function criar(req, res, next) {
    try {
        const { cliente_id, placa, cavalo, carretas, comprimento = null, carroceria = null } = req.body;
        if (!cliente_id || !String(placa || '').trim() || !String(cavalo || '').trim()) return res.status(400).json({ success: false, message: 'Cliente, placa e cavalo são obrigatórios' });
        const [result] = await db.query('INSERT INTO veiculos (cliente_id, placa, cavalo, carretas, comprimento, carroceria) VALUES (?, ?, ?, ?, ?, ?)', [cliente_id, placa.trim().toUpperCase(), cavalo.trim(), carretas || 0, comprimento, carroceria]);
        const [rows] = await db.query(`${selectBase} WHERE v.id = ? GROUP BY v.id`, [result.insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function atualizar(req, res, next) {
    try {
        const { cliente_id, placa, cavalo, carretas, comprimento = null, carroceria = null } = req.body;
        if (!cliente_id || !String(placa || '').trim() || !String(cavalo || '').trim()) return res.status(400).json({ success: false, message: 'Cliente, placa e cavalo são obrigatórios' });
        const [result] = await db.query('UPDATE veiculos SET cliente_id = ?, placa = ?, cavalo = ?, carretas = ?, comprimento = ?, carroceria = ? WHERE id = ?', [cliente_id, placa.trim().toUpperCase(), cavalo.trim(), carretas || 0, comprimento, carroceria, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        const [rows] = await db.query(`${selectBase} WHERE v.id = ? GROUP BY v.id`, [req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function remover(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM veiculos WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        res.json({ success: true, message: 'Veículo excluído com sucesso' });
    } catch (error) { next(error); }
}

module.exports = { listar, obter, criar, atualizar, remover };
