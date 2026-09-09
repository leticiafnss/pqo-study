# PQO Study — versão plataforma

## O que esta versão resolve

1. Cadastro apenas na primeira vez.
2. Depois, o usuário entra com e-mail e senha.
3. Progresso salvo no Supabase.
4. Mesmo progresso no notebook e no celular.
5. A plataforma lembra o último módulo aberto.
6. Cada módulo contém:
   - resumo;
   - pontos-chave;
   - conteúdo a dominar;
   - como estudar;
   - foco de revisão;
   - fontes clicáveis;
   - 8 flashcards de conteúdo;
   - 6 questões de múltipla escolha;
   - resultado e diagnóstico;
   - botão de conclusão.
7. O progresso antigo local é migrado quando possível.

## MUITO IMPORTANTE

A sincronização entre dispositivos só funciona depois que o Supabase estiver configurado no `config.js`
e o SQL do arquivo `supabase-setup.sql` tiver sido executado.

Sem Supabase, o site continua funcionando, mas o progresso fica apenas naquele navegador.

## Como testar no computador

1. Extraia o ZIP.
2. Abra `pqo-study-plataforma` no VS Code.
3. Se você já tinha configurado Supabase, copie a Project URL e a Publishable key do seu `config.js` antigo para o novo `config.js`.
4. Abra `index.html` com Live Server.
5. Faça login.
6. Entre em um módulo, faça flashcards e questões.
7. Feche a aba.
8. Abra de novo: a sessão deve continuar ativa e o progresso deve permanecer.

## Como abrir no celular

`127.0.0.1` NÃO é um link público.

Para usar pelo WhatsApp/celular, publique o projeto. O caminho recomendado é:

### GitHub Pages
1. Crie uma conta no GitHub.
2. Crie um repositório chamado `pqo-study`.
3. Envie os arquivos desta pasta para o repositório.
4. No GitHub, abra `Settings`.
5. Abra `Pages`.
6. Em `Build and deployment`, escolha `Deploy from a branch`.
7. Branch: `main`.
8. Pasta: `/ (root)`.
9. Salve.

O GitHub vai gerar um endereço parecido com:

`https://SEU-USUARIO.github.io/pqo-study/`

ESSE é o link que você envia no WhatsApp e abre no iPhone.

Depois podemos ligar um domínio próprio, por exemplo:

`https://www.pqostudy.com.br`

## Login no celular

1. Abra o link público no Safari/Chrome.
2. Entre com o mesmo e-mail e senha usados no notebook.
3. O site busca o progresso salvo no Supabase.
4. Você continua de onde parou.

## Se trocar de versão do projeto

Se o Supabase estiver configurado, uma versão nova não deve zerar seu progresso, porque o progresso fica no banco associado ao seu usuário.
