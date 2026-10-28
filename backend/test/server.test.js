const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../server');
const db = require('../config/database');

let server;
let baseUrl;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.end();
});

test('serve o frontend e os recursos estáticos originais', async () => {
    const pagina = await fetch(`${baseUrl}/`);
    const css = await fetch(`${baseUrl}/css/style.css`);
    const javascript = await fetch(`${baseUrl}/js/api.js`);

    assert.equal(pagina.status, 200);
    assert.match(await pagina.text(), /<!DOCTYPE html>/i);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type'), /text\/css/);
    assert.equal(javascript.status, 200);
    assert.match(javascript.headers.get('content-type'), /javascript/);
});

test('retorna estado seguro da API, conexão e esquema do banco', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.ok([200, 503].includes(response.status));
    assert.equal(body.api, 'online');
    if (response.status === 200) {
        assert.equal(body.database, 'online');
        assert.equal(body.schema, 'ok');
    } else {
        assert.ok(['offline', 'online'].includes(body.database));
        if (body.database === 'online') assert.equal(body.schema, 'incompleto');
        assert.doesNotMatch(JSON.stringify(body), /password|ER_ACCESS_DENIED/i);
    }
});

test('valida campos obrigatórios sem executar operações no banco', async () => {
    const clientes = await fetch(`${baseUrl}/api/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: '   ' })
    });
    const veiculos = await fetch(`${baseUrl}/api/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    const aets = await fetch(`${baseUrl}/api/aets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    const bodyAusente = await fetch(`${baseUrl}/api/clientes`, { method: 'POST' });
    const dataInvalida = await fetch(`${baseUrl}/api/aets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente_id: 1,
            veiculo_id: 1,
            numero_aet: 'TESTE',
            vencimento: '2026-02-31',
            uf: 'SP',
            status: 'Status inválido'
        })
    });

    assert.equal(clientes.status, 400);
    assert.equal(veiculos.status, 400);
    assert.equal(aets.status, 400);
    assert.equal(bodyAusente.status, 400);
    assert.equal(dataInvalida.status, 400);
});

test('retorna erro JSON para rotas inexistentes', async () => {
    const response = await fetch(`${baseUrl}/api/inexistente`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).success, false);
});
