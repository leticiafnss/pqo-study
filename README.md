# PQO Study — Compliance

Primeira versão completa da estrutura web baseada na matriz de estudos da PQO Compliance.

## O que já existe
- Perfil inicial (nome, e-mail e data da prova)
- Plano automático de estudo pela data da prova
- 23 módulos da matriz
- Priorização P0 → P1 → P2 → P3
- Trilha com progresso
- Flashcards
- Banco inicial de questões
- Caderno de erros
- Fontes oficiais
- Layout adaptado para computador e celular
- Dados salvos no navegador

## Importante sobre o cadastro
Nesta versão o “cadastro” é local: fica salvo no navegador pelo `localStorage`.
Isso é proposital para você conseguir rodar o projeto sem configurar servidor ou banco de dados.

Quando você quiser login real e sincronização entre celular/computador, a próxima versão pode usar Supabase.

# PASSO A PASSO — para quem está começando do zero

## 1. Instale o Google Chrome
Se já usa Chrome, pule.

## 2. Instale o Visual Studio Code
Pesquise no Google por “Visual Studio Code download” e baixe pelo site da Microsoft.

## 3. Extraia o ZIP
Clique com o botão direito no arquivo `pqo-study-completo.zip` e escolha “Extrair tudo”.

## 4. Abra o projeto
1. Abra o VS Code.
2. Clique em `File`.
3. Clique em `Open Folder`.
4. Escolha a pasta `pqo-study-completo`.
5. Clique em `Selecionar pasta`.

## 5. Instale Live Server
1. No menu esquerdo do VS Code, clique no ícone de quadradinhos (Extensions).
2. Pesquise `Live Server`.
3. Instale a extensão de Ritwick Dey.

## 6. Rode o site
1. No VS Code, clique no arquivo `index.html`.
2. Clique com o botão direito dentro do arquivo.
3. Escolha `Open with Live Server`.
4. O navegador abrirá automaticamente.

Pronto. O PQO Study está rodando no seu computador.

# Onde cada coisa fica

- `index.html` — estrutura/telas.
- `style.css` — cores, tamanhos e aparência.
- `data.js` — módulos, flashcards, questões e links.
- `app.js` — regras do sistema: cadastro local, progresso, cronograma, questões.
- `README.md` — este manual.

# Publicar para acessar pelo celular

O caminho mais fácil será GitHub Pages.

## Você precisará
- uma conta gratuita no GitHub;
- GitHub Desktop (opcional, mas recomendado para iniciantes).

Depois:
1. Criamos um repositório chamado `pqo-study`;
2. enviamos os arquivos;
3. habilitamos `Settings > Pages`;
4. o GitHub cria um link;
5. você abre esse link no iPhone ou Android.

# Próximas evoluções
1. Login real com Supabase;
2. sincronização de progresso entre dispositivos;
3. mais questões por capítulo;
4. simulados de 60 questões;
5. repetição espaçada por data;
6. gráfico de desempenho por tema;
7. cronograma diário, e não apenas semanal;
8. PWA para adicionar à tela inicial do celular;
9. painel administrativo para inserir conteúdos sem editar código.

## Observação de conteúdo
Esta versão usa a matriz como espinha dorsal e inclui um banco inicial de questões/flashcards.
Para transformar o site em um curso realmente exaustivo, o próximo enriquecimento é incorporar, capítulo por capítulo, o Guia Por Dentro da B3 e demais materiais oficiais vigentes, sempre mantendo links de fonte.
