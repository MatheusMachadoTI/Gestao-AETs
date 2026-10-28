# Gestão AETs

Sistema de gerenciamento de AETs, clientes e veículos com HTML, CSS, JavaScript, Node.js, Express e MySQL/MariaDB.

## Pastas

- `Gest-o-ANTT--AET/Gestão ANTT -AET/`: páginas e arquivos originais do frontend.
- `backend/`: API Express, rotas, controllers e configuração do MySQL.

O Express serve o frontend original, sem processo de build.

## Configuração local

1. Instale e inicie MySQL ou MariaDB por meio do aplicativo/serviço que você já utiliza. O projeto não inicia nem altera serviços do Windows.
2. Revise `backend/database/database.sql` antes de executá-lo. Ele cria o banco/tabelas que não existirem e insere registros fictícios de demonstração. Não o execute sobre dados existentes sem verificar os efeitos e ter um backup. A rota de saúde também verifica se as quatro tabelas esperadas existem.
   Se usar MySQL Workbench, abra o arquivo no editor SQL, confira o conteúdo e execute-o somente depois de confirmar que o banco alvo pode receber o esquema e os dados de demonstração.
3. Crie `backend/.env` a partir de `backend/.env.example` e preencha as credenciais locais corretas. Não compartilhe nem versione esse arquivo.
4. No terminal, execute:

   ```powershell
   cd backend
   npm install
   npm start
   ```

5. Abra `http://localhost:3000`. Verifique a conexão do servidor e do banco em `http://localhost:3000/api/health`.
6. Para validar a aplicação sem executar operações de escrita, rode `npm test` na pasta `backend`.

O frontend carrega clientes, veículos, AETs e indicadores a partir da API. Se o banco estiver indisponível, a interface exibe o erro em vez de substituir os dados por demonstrações locais.
