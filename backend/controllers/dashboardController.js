const db = require('../config/database');

async function obter(req, res, next) {
    try {
        const [rows] = await db.query(`SELECT COUNT(*) AS total, SUM(status = 'Regular') AS regulares, SUM(status = 'Atenção') AS atencao, SUM(status = 'Alta prioridade') AS alta_prioridade, SUM(status = 'Vencida' OR (status NOT IN ('Renovada', 'Renovação em andamento') AND vencimento < CURDATE())) AS vencidas, SUM(status = 'Renovação em andamento') AS renovacao_em_andamento, SUM(status = 'Renovada') AS renovadas, SUM(status NOT IN ('Renovada', 'Renovação em andamento') AND vencimento = CURDATE()) AS vencendo_hoje, SUM(status NOT IN ('Renovada', 'Renovação em andamento') AND vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS vencendo_7_dias, SUM(status NOT IN ('Renovada', 'Renovação em andamento') AND vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS vencendo_30_dias FROM aets`);
        const data = Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value || 0)]));
        res.json({ success: true, data });
    } catch (error) { next(error); }
}
module.exports = { obter };
