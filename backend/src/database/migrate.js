// =====================================================================
// FELIPINHO LAUNCHER - Runner de Migrations
// Mantém histórico das migrations e permite atualizar bancos que já
// possuem a estrutura antiga, sem executar novamente migrations antigas.
// =====================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('🚚 FELIPINHO LAUNCHER - Executando migrations...\n');

  const nomeBanco = process.env.DB_NAME || 'gr_expresso';
  const usarSSL = process.env.DB_SSL === 'true';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: nomeBanco,
    multipleStatements: true,
    ...(usarSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    // Histórico das migrations. O banco existente não possuía essa tabela.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        aplicado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const pastaMigrations = path.join(__dirname, 'migrations');
    const arquivos = fs.readdirSync(pastaMigrations)
      .filter((nome) => nome.endsWith('.sql'))
      .sort();

    if (arquivos.length === 0) {
      console.log('ℹ️ Nenhuma migration encontrada.');
      return;
    }

    // O banco atual já contém as estruturas das migrations 002–007.
    // Registramos somente esses arquivos no histórico, sem executar SQL
    // novamente. Isso preserva os dados existentes e evita duplicações.
    const baselineExistente = [
      '002_telemetria_launcher.sql',
      '003_ranking_penalidades.sql',
      '004_cargos_recrutamento.sql',
      '004_multa_infracao_transito.sql',
      '005_abastecimento_pendente.sql',
      '006_manutencoes.sql',
      '007_recalcular_fretes.sql'
    ];

    for (const nome of baselineExistente) {
      if (arquivos.includes(nome)) {
        await connection.query(
          'INSERT IGNORE INTO schema_migrations (nome) VALUES (?)',
          [nome]
        );
      }
    }

    for (const arquivo of arquivos) {
      const [rows] = await connection.query(
        'SELECT id FROM schema_migrations WHERE nome = ? LIMIT 1',
        [arquivo]
      );

      if (rows.length > 0) {
        console.log(`⏭️ ${arquivo} já registrada/aplicada.`);
        continue;
      }

      console.log(`📦 Aplicando ${arquivo}...`);
      let sql = fs.readFileSync(path.join(pastaMigrations, arquivo), 'utf8')
        .replace(/\r\n/g, '\n');

      if (nomeBanco !== 'gr_expresso') {
        sql = sql.replace(/gr_expresso/g, nomeBanco);
      }

      await connection.query(sql);
      await connection.query(
        'INSERT INTO schema_migrations (nome) VALUES (?)',
        [arquivo]
      );
      console.log(`✅ ${arquivo} aplicada com sucesso.\n`);
    }

    console.log('🎉 Migrations concluídas!');
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
