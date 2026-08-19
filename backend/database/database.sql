CREATE DATABASE IF NOT EXISTS gestao_aets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestao_aets;

CREATE TABLE IF NOT EXISTS clientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(180) NOT NULL,
    documento VARCHAR(30) NULL,
    telefone VARCHAR(30) NULL,
    email VARCHAR(160) NULL,
    observacao TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS veiculos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT UNSIGNED NOT NULL,
    placa VARCHAR(20) NOT NULL,
    cavalo VARCHAR(160) NOT NULL,
    carretas INT UNSIGNED NOT NULL DEFAULT 0,
    comprimento VARCHAR(30) NULL,
    carroceria VARCHAR(80) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_veiculo_placa_cliente (cliente_id, placa),
    CONSTRAINT fk_veiculo_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS aets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT UNSIGNED NOT NULL,
    veiculo_id INT UNSIGNED NOT NULL,
    numero_aet VARCHAR(80) NOT NULL UNIQUE,
    vencimento DATE NOT NULL,
    uf VARCHAR(10) NOT NULL,
    status ENUM('Regular', 'Atenção', 'Alta prioridade', 'Renovação em andamento', 'Renovada', 'Vencida') NOT NULL DEFAULT 'Regular',
    prioridade ENUM('Urgente', 'Alta', 'Média', 'Normal', 'Em renovação', 'Resolvida') NOT NULL DEFAULT 'Normal',
    observacao TEXT NULL,
    data_renovacao DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_aet_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_aet_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE RESTRICT,
    INDEX idx_aet_vencimento (vencimento),
    INDEX idx_aet_status (status),
    INDEX idx_aet_prioridade (prioridade)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historico (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    aet_id INT UNSIGNED NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    status_anterior VARCHAR(50) NULL,
    status_novo VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_aet FOREIGN KEY (aet_id) REFERENCES aets(id) ON DELETE CASCADE,
    INDEX idx_historico_aet (aet_id)
) ENGINE=InnoDB;

INSERT IGNORE INTO clientes (id, nome, documento, telefone, email, observacao) VALUES
(1, 'EMPRESA DEMONSTRAÇÃO LOGÍSTICA', '00.000.000/0000-00', '(00) 00000-0000', 'cliente01@exemplo.test', 'Dado fictício de demonstração'),
(2, 'LOGÍSTICA BRASIL EXEMPLO LTDA', '00.000.000/0000-00', '(00) 00000-0000', 'cliente02@exemplo.test', 'Dado fictício de demonstração'),
(3, 'TRANSPORTADORA TESTE LTDA', '00.000.000/0000-00', '(00) 00000-0000', 'cliente03@exemplo.test', 'Dado fictício de demonstração'),
(4, 'CARGAS EXEMPLO BRASIL', '00.000.000/0000-00', '(00) 00000-0000', 'cliente04@exemplo.test', 'Dado fictício de demonstração'),
(5, 'FROTA MODELO LTDA', '00.000.000/0000-00', '(00) 00000-0000', 'cliente05@exemplo.test', 'Dado fictício de demonstração');

INSERT IGNORE INTO veiculos (id, cliente_id, placa, cavalo, carretas, comprimento, carroceria) VALUES
(1, 1, 'FIC1T01', 'Caminhão Demonstração 01', 3, '17,50m', 'Graneleira'),
(2, 2, 'FIC1T03', 'Caminhão Demonstração 02', 2, '15,00m', 'Baú'),
(3, 3, 'FIC1T05', 'Caminhão Demonstração 03', 2, '16,50m', 'Tanque'),
(4, 4, 'FIC1T07', 'Caminhão Demonstração 04', 3, '18,00m', 'Graneleira'),
(5, 5, 'FIC1T09', 'Caminhão Demonstração 05', 2, '15,50m', 'Baú');

INSERT IGNORE INTO aets (id, cliente_id, veiculo_id, numero_aet, vencimento, uf, status, prioridade, observacao) VALUES
(1, 1, 1, 'AET-FICT-001', '2026-08-31', 'SP', 'Atenção', 'Urgente', 'Registro fictício para demonstração'),
(2, 2, 2, 'AET-FICT-002', '2026-09-15', 'SP', 'Regular', 'Alta', 'Registro fictício para demonstração'),
(3, 3, 3, 'AET-FICT-003', '2026-08-18', 'MG', 'Vencida', 'Urgente', 'Registro fictício para demonstração'),
(4, 4, 4, 'AET-FICT-004', '2026-09-10', 'GO', 'Renovação em andamento', 'Em renovação', 'Registro fictício para demonstração'),
(5, 5, 5, 'AET-FICT-005', '2026-10-10', 'SP', 'Renovada', 'Resolvida', 'Registro fictício para demonstração');

INSERT IGNORE INTO historico (aet_id, tipo, descricao, status_novo)
SELECT id, 'Cadastro', 'AET cadastrada', status FROM aets;
