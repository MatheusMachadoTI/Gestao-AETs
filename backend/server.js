const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./config/database');
const clientesRoutes = require('./routes/clientes');
const veiculosRoutes = require('./routes/veiculos');
const aetsRoutes = require('./routes/aets');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendPath = path.join(__dirname, '..', 'Gest-o-ANTT--AET', 'Gestão ANTT -AET');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
        (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
        return res.status(400).json({ success: false, message: 'Envie os dados da requisição em formato JSON válido.' });
    }
    next();
});

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        const [tables] = await db.query(
            `SELECT COUNT(*) AS total FROM information_schema.tables
             WHERE table_schema = DATABASE()
               AND table_name IN ('clientes', 'veiculos', 'aets', 'historico')`
        );
        if (Number(tables[0].total) !== 4) {
            return res.status(503).json({
                success: false,
                api: 'online',
                database: 'online',
                schema: 'incompleto',
                message: 'A conexão funciona, mas faltam tabelas do sistema no banco configurado.'
            });
        }
        res.json({ success: true, api: 'online', database: 'online', schema: 'ok' });
    } catch (error) {
        console.error('Verificação do banco falhou', { code: error.code || 'UNKNOWN' });
        res.status(503).json({ success: false, api: 'online', database: 'offline', message: 'Banco de dados indisponível. Verifique a conexão e as configurações locais.' });
    }
});
app.use('/api/clientes', clientesRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/aets', aetsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(frontendPath));
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

app.use((error, req, res, next) => {
    const code = error.code || '';
    const status = error.status || error.statusCode;
    console.error('Falha na requisição', { method: req.method, path: req.path, code: code || 'UNKNOWN' });

    if (status === 400 || error.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Requisição inválida. Verifique os dados enviados.' });
    }
    if (code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Já existe um registro com esses dados.' });
    }
    if (code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ success: false, message: 'O cliente ou veículo informado não existe.' });
    }
    if (code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, message: 'Não é possível excluir um registro que possui vínculos.' });
    }
    if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(code)) {
        return res.status(503).json({ success: false, message: 'Banco de dados indisponível. Verifique as configurações locais.' });
    }
    if (code === 'ER_NO_SUCH_TABLE') {
        return res.status(503).json({ success: false, message: 'O esquema do banco está incompleto. Verifique se as tabelas do sistema foram criadas.' });
    }
    if (['ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'ER_BAD_NULL_ERROR', 'ER_WARN_DATA_OUT_OF_RANGE'].includes(code)) {
        return res.status(400).json({ success: false, message: 'Um ou mais campos possuem valores inválidos ou acima do limite.' });
    }
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

if (require.main === module) {
    const server = app.listen(port, () => console.log(`API AET/ANTT disponível em http://localhost:${port}`));
    const shutdown = () => {
        server.close(() => db.end().catch(error => {
            console.error('Falha ao encerrar o pool do banco', { code: error.code || 'UNKNOWN' });
            process.exitCode = 1;
        }));
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

module.exports = app;
