# PQO Study — Login e sincronização

1. Crie um projeto gratuito em https://supabase.com com o nome `pqo-study`.
2. No Supabase, abra `SQL Editor > New query`.
3. No VS Code, abra `supabase-setup.sql`, copie tudo, cole no Supabase e clique em `Run`.
4. No Supabase, abra `Project Settings > API`.
5. Copie a `Project URL` e a `Publishable key`.
6. No VS Code, abra `config.js` e substitua os dois textos `COLE_AQUI...` pelos valores do seu projeto.
7. Salve (`Ctrl + S`) e rode `index.html` novamente com Live Server.
8. Agora aparecerá login/cadastro. O Supabase pode exigir confirmação do e-mail antes do primeiro login.

NUNCA cole a `service_role` key no site.

## Depois
Publique no GitHub Pages. O endereço local `127.0.0.1` deixa de ser usado pelos usuários. Depois conectamos seu domínio próprio ao GitHub Pages.
