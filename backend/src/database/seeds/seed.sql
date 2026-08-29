-- =====================================================================
-- FELIPINHO LAUNCHER - Dados de exemplo (seed)
-- Execute após o schema.sql para popular o sistema com dados de teste
-- =====================================================================

USE gr_expresso;

-- ---------------------------------------------------------------------
-- MOTORISTAS
-- ---------------------------------------------------------------------
INSERT INTO motoristas (nome, apelido, cnh, telefone, email, steam_id, data_admissao, status, total_km, total_viagens, total_faturado, pontuacao_ranking) VALUES
('Carlos Eduardo Silva', 'Cadu', 'CNH-001', '(11) 98888-1111', 'cadu@grexpresso.com', 'steam_cadu01', '2024-01-15', 'ativo', 48230.50, 87, 154300.00, 920.5),
('Marina Souza Lima', 'Mari', 'CNH-002', '(21) 97777-2222', 'mari@grexpresso.com', 'steam_mari02', '2024-02-20', 'ativo', 39120.00, 64, 121800.00, 845.0),
('Roberto Almeida', 'Beto', 'CNH-003', '(31) 96666-3333', 'beto@grexpresso.com', 'steam_beto03', '2024-03-10', 'ativo', 51200.75, 95, 178900.00, 980.2),
('Fernanda Costa', 'Fê', 'CNH-004', '(41) 95555-4444', 'fe@grexpresso.com', 'steam_fe04', '2024-04-05', 'ferias', 22300.00, 38, 78200.00, 610.0),
('Lucas Martins', 'Lukinhas', 'CNH-005', '(51) 94444-5555', 'lucas@grexpresso.com', 'steam_lucas05', '2024-05-18', 'ativo', 33500.25, 52, 99500.00, 730.8);

-- ---------------------------------------------------------------------
-- USUARIOS (login do sistema)
-- ---------------------------------------------------------------------
-- O seed não publica credenciais administrativas.
-- Crie/atualize o administrador de produção por um procedimento seguro
-- no banco e armazene somente o hash bcrypt da senha.

-- ---------------------------------------------------------------------
-- CAMINHÕES
-- ---------------------------------------------------------------------
INSERT INTO caminhoes (placa, marca, modelo, ano, cor, km_atual, capacidade_tanque, consumo_medio, status, motorista_atual_id, valor_aquisicao) VALUES
('GRE1A01', 'Scania', 'R 540 6x2', 2023, 'Verde Escuro', 48230.50, 900.00, 2.8, 'em_viagem', 1, 750000.00),
('GRE1A02', 'Volvo', 'FH 540 6x4', 2023, 'Preto', 39120.00, 800.00, 3.0, 'em_viagem', 2, 720000.00),
('GRE1A03', 'MAN', 'TGX 29.640', 2022, 'Verde Limão', 51200.75, 750.00, 3.2, 'em_viagem', 3, 690000.00),
('GRE1A04', 'Mercedes-Benz', 'Actros 2651', 2024, 'Branco', 22300.00, 850.00, 2.9, 'disponivel', 4, 780000.00);