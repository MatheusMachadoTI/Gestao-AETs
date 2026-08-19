const express = require('express');
const controller = require('../controllers/aetsController');
const router = express.Router();

router.get('/', controller.listar);
router.get('/:id/historico', controller.historico);
router.post('/:id/historico', controller.adicionarHistorico);
router.post('/:id/renovacao', controller.enviarParaRenovacao);
router.post('/:id/renovada', controller.marcarComoRenovada);
router.post('/:id/cancelar-renovacao', controller.cancelarRenovacao);
router.get('/:id', controller.obter);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);

module.exports = router;
