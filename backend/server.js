const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API AET/ANTT online' }));
app.use('/api/clientes', clientesRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/aets', aetsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(frontendPath));
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((error, req, res, next) => {
    console.error(error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ success: false, message: 'Relacionamento informado não existe' });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Registro duplicado' });
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

app.listen(port, () => console.log(`API AET/ANTT disponível em http://localhost:${port}`));
