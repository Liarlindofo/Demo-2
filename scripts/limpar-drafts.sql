-- Script SQL para limpar rascunhos problemáticos
-- Execute este script no banco de dados se continuar com erro 500

-- Ver todos os rascunhos atuais
SELECT id, user_id, store_id, store_name, created_at, last_saved 
FROM checklist_drafts 
ORDER BY last_saved DESC;

-- Deletar TODOS os rascunhos (se necessário)
-- DELETE FROM checklist_drafts;

-- OU deletar apenas rascunhos antigos (mais de 2 dias)
-- DELETE FROM checklist_drafts WHERE expires_at < NOW();

-- OU deletar apenas seus rascunhos (substitua USER_ID)
-- DELETE FROM checklist_drafts WHERE user_id = 'SEU_USER_ID';
