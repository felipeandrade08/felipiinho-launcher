const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { exigirAutenticacao, exigirAdmin } = require('../middlewares/autenticacao');

router.get('/', exigirAutenticacao, exigirAdmin, async (req,res) => {
  try {
    const [rows] = await pool.query(`SELECT s.*, u.nome AS solicitante_nome, u.email AS solicitante_email FROM solicitacoes_empresas s JOIN usuarios u ON u.id=s.usuario_id WHERE s.status='pendente' ORDER BY s.criado_em ASC`);
    res.json({sucesso:true,dados:rows});
  } catch(e) { console.error(e); res.status(500).json({sucesso:false,mensagem:'Erro ao carregar solicitações de empresas.'}); }
});

router.patch('/:id/aprovar', exigirAutenticacao, exigirAdmin, async (req,res) => {
  const c=await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[s]]=await c.query("SELECT * FROM solicitacoes_empresas WHERE id=? AND status='pendente' FOR UPDATE",[req.params.id]);
    if(!s){await c.rollback();return res.status(404).json({sucesso:false,mensagem:'Solicitação não encontrada ou já analisada.'});}
    const [[slug]]=await c.query('SELECT id FROM empresas WHERE slug=? LIMIT 1',[s.slug]);
    if(slug){await c.rollback();return res.status(409).json({sucesso:false,mensagem:'Já existe uma empresa com este endereço.'});}
    const [emp]=await c.query(`INSERT INTO empresas (nome,slug,descricao,logo_url,capa_url,localizacao,motoristas,caminhoes,data_fundacao,discord,instagram,site,pontuacao_ranking,posicao_ranking,destaque) VALUES (?,?,?,?,?,?,0,0,?,?,?,?,0,NULL,0)`,[s.nome,s.slug,s.descricao,s.logo_url,s.capa_url,s.localizacao,s.data_fundacao,s.discord,s.instagram,s.site]);
    const [conta]=await c.query("INSERT INTO contas (nome,tipo,email_contato,status) VALUES (?,'empresa',?,'ativa')",[s.nome,s.email]);
    await c.query("INSERT INTO conta_membros (conta_id,usuario_id,papel,status) VALUES (?,?,'proprietario','ativo')",[conta.insertId,s.usuario_id]);
    const [[plano]]=await c.query("SELECT id FROM planos WHERE codigo='empresa' AND ativo=TRUE LIMIT 1");
    if(plano) await c.query("INSERT INTO assinaturas (conta_id,plano_id,status,inicio_em,fim_em,trial_inicio,trial_fim,trial_usado) VALUES (?,?,'trial',NOW(),DATE_ADD(NOW(),INTERVAL 7 DAY),NOW(),DATE_ADD(NOW(),INTERVAL 7 DAY),FALSE)",[conta.insertId,plano.id]);
    await c.query("UPDATE solicitacoes_empresas SET status='aprovada',analisado_por=?,analisado_em=NOW(),empresa_id=? WHERE id=?",[req.usuario.id,emp.insertId,s.id]);
    await c.commit();
    res.json({sucesso:true,mensagem:'Empresa aprovada com sucesso.',dados:{id:emp.insertId,conta_id:conta.insertId}});
  } catch(e){await c.rollback();console.error(e);res.status(500).json({sucesso:false,mensagem:'Erro ao aprovar empresa.'});} finally{c.release();}
});

router.patch('/:id/rejeitar', exigirAutenticacao, exigirAdmin, async(req,res)=>{
  try{
    const motivo=String(req.body?.motivo||'').trim().slice(0,500)||null;
    const [r]=await pool.query("UPDATE solicitacoes_empresas SET status='rejeitada',motivo_recusa=?,analisado_por=?,analisado_em=NOW() WHERE id=? AND status='pendente'",[motivo,req.usuario.id,req.params.id]);
    if(!r.affectedRows)return res.status(404).json({sucesso:false,mensagem:'Solicitação não encontrada ou já analisada.'});
    res.json({sucesso:true,mensagem:'Solicitação rejeitada.',dados:null});
  }catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:'Erro ao rejeitar solicitação.'});}
});
module.exports=router;
