const db = require('../config/database');

const selectBase = `SELECT v.*, c.nome AS cliente,
    (SELECT COUNT(*) FROM aets a WHERE a.veiculo_id = v.id) AS total_aets
FROM veiculos v JOIN clientes c ON c.id = v.cliente_id`;

async function listar(req, res, next) {
    try {
        const termo = String(req.query.search || '').trim();
        const [rows] = await db.query(`${selectBase} WHERE (? = '' OR v.placa LIKE ? OR c.nome LIKE ?) ORDER BY v.placa`, [termo, `%${termo}%`, `%${termo}%`]);
        res.json({ success: true, data: rows });
    } catch (error) { next(error); }
}

async function obter(req, res, next) {
    try {
        const [rows] = await db.query(`${selectBase} WHERE v.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function criar(req, res, next) {
    try {
        const { cliente_id, placa, cavalo, carretas, comprimento = null, carroceria = null } = req.body;
        const erro = validarVeiculo({ cliente_id, placa, cavalo, carretas, comprimento, carroceria });
        if (erro) return res.status(400).json({ success: false, message: erro });
        const [result] = await db.query('INSERT INTO veiculos (cliente_id, placa, cavalo, carretas, comprimento, carroceria) VALUES (?, ?, ?, ?, ?, ?)', [Number(cliente_id), placa.trim().toUpperCase(), cavalo.trim(), Number(carretas || 0), comprimento || null, carroceria || null]);
        const [rows] = await db.query(`${selectBase} WHERE v.id = ?`, [result.insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

async function atualizar(req, res, next) {
    try {
        const { cliente_id, placa, cavalo, carretas, comprimento = null, carroceria = null } = req.body;
        const erro = validarVeiculo({ cliente_id, placa, cavalo, carretas, comprimento, carroceria });
        if (erro) return res.status(400).json({ success: false, message: erro });
        const [existentes] = await db.query('SELECT id, cliente_id FROM veiculos WHERE id = ?', [req.params.id]);
        if (!existentes.length) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        if (Number(existentes[0].cliente_id) !== Number(cliente_id)) {
            const [aets] = await db.query('SELECT id FROM aets WHERE veiculo_id = ? LIMIT 1', [req.params.id]);
            if (aets.length) return res.status(409).json({ success: false, message: 'Não é possível trocar o cliente de um veículo vinculado a uma AET.' });
        }
        await db.query('UPDATE veiculos SET cliente_id = ?, placa = ?, cavalo = ?, carretas = ?, comprimento = ?, carroceria = ? WHERE id = ?', [Number(cliente_id), placa.trim().toUpperCase(), cavalo.trim(), Number(carretas || 0), comprimento || null, carroceria || null, req.params.id]);
        const [rows] = await db.query(`${selectBase} WHERE v.id = ?`, [req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
}

function validarVeiculo({ cliente_id, placa, cavalo, carretas, comprimento, carroceria }) {
    if (!Number.isInteger(Number(cliente_id)) || Number(cliente_id) <= 0) return 'Selecione um cliente válido';
    if (!String(placa || '').trim() || !String(cavalo || '').trim()) return 'Placa e cavalo são obrigatórios';
    if (String(placa).trim().length > 20 || String(cavalo).trim().length > 160) return 'Placa ou cavalo excede o limite permitido';
    if (carretas !== undefined && (!Number.isInteger(Number(carretas)) || Number(carretas) < 0)) return 'Quantidade de carretas inválida';
    if (comprimento != null && String(comprimento).length > 30) return 'Comprimento excede o limite permitido';
    if (carroceria != null && String(carroceria).length > 80) return 'Carroceria excede o limite permitido';
    return null;
}

async function remover(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM veiculos WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
        res.json({ success: true, message: 'Veículo excluído com sucesso' });
    } catch (error) { next(error); }
}

module.exports = { listar, obter, criar, atualizar, remover };
