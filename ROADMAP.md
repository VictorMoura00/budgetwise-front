# BudgetWise Front-end — Roadmap de Implementações

## Legenda
- ✅ Concluído
- 🔲 Pendente

---

## ⚙️ Infraestrutura / Configuração
- ✅ Angular 21 standalone (sem NgModules)
- ✅ PrimeNG 21 com tema Aura + dark mode (`.dark-mode` no `<html>`)
- ✅ i18n com ngx-translate (pt padrão, en) — arquivos em `public/i18n/`
- ✅ ThemeService + LanguageService
- ✅ Proxy para desenvolvimento local (`proxy.conf.json`)
- ✅ Lazy loading de rotas
- ✅ Interceptor de erros global (ProblemDetails → toast via MessageService root)
- ✅ MessageService e ConfirmationService no root (Toast e ConfirmDialog no MainLayout)
- 🔲 Interceptor de loading global (spinner/skeleton durante requisições)
- 🔲 Testes unitários (configuração Karma/Jest + primeiros specs)

---

## 🔐 Autenticação
- ✅ `POST /auth/login` — Tela de login com validação de formulário
- ✅ `POST /auth/register` — Tela de cadastro
- ✅ `POST /auth/refresh` — Interceptor de refresh token rotativo
- ✅ AuthGuard + NoAuthGuard (rotas protegidas)
- ✅ AuthService (login, register, refresh, logout)
- ✅ Armazenamento de access/refresh token
- 🔲 Feedback visual de lockout (5 tentativas)
- 🔲 Tela de "sessão expirada" / redirect automático ao logout

---

## 🏗️ Layout Principal
- ✅ MainLayoutComponent (shell autenticado)
- ✅ HeaderComponent (logo, toggle dark mode, toggle idioma, logout)
- 🔲 SidebarComponent (navegação principal)
- 🔲 Breadcrumb dinâmico por rota

---

## 📊 Dashboard
- ✅ Rota `/dashboard` (estrutura inicial)
- 🔲 Cards de resumo (saldo total, receitas, despesas do mês)
- 🔲 Gráfico de despesas por categoria (PrimeNG Chart)
- 🔲 Lista de transações recentes
- 🔲 Integração com `GET /summary?month=YYYY-MM` (quando disponível no backend)

---

## 🗂️ Categorias
- ✅ Rota `/categories` (estrutura inicial)
- ✅ CategoryService (`GET /categories`, `GET /categories/{id}`)
- ✅ CategoryModel / DTOs
- 🔲 Listagem de categorias (tabela/cards com paginação)
- 🔲 Criação de categoria pessoal (`POST /categories`)
- 🔲 Edição de categoria (`PUT /categories/{id}`)
- 🔲 Exclusão de categoria com confirmação (`DELETE /categories/{id}`)
- 🔲 Distinção visual entre categorias do sistema e pessoais

---

## 💸 Transações
- ✅ Rota `/transactions`
- ✅ TransactionService (CRUD completo + confirm)
- ✅ Listagem com filtros (tipo, período, status) + paginação lazy
- ✅ Formulário de criação/edição (descrição, valor, tipo, data, categoria, pagamento, recorrência, notas)
- ✅ Exclusão com confirmação
- ✅ Ação de confirmar transação pendente (`PATCH /transactions/{id}/confirm`)
- ✅ Badge de status (pendente / confirmada) + valor colorido por tipo

---

## 🏷️ Tags
- ✅ TagService (CRUD + vincular/desvincular)
- ✅ Gerenciamento de tags (listar, criar, renomear, excluir) — layout em grid de cards
- ✅ Seleção de tags no formulário de transação (MultiSelect com chips)
- ✅ Sincronização de vínculos via forkJoin (add/remove por diff)
- 🔲 Filtro de transações por tag _(endpoint não suportado pelo backend)_

---

## 👨‍👩‍👧 Grupos Familiares _(aguardando backend)_
- 🔲 Rota `/family-groups`
- 🔲 FamilyGroupService
- 🔲 Listagem de grupos + membros
- 🔲 Criação e edição de grupo
- 🔲 Entrar via invite code
- 🔲 Remover membro / regenerar invite code

---

## 💰 Despesas Compartilhadas _(aguardando backend)_
- 🔲 Rota `/shared-expenses`
- 🔲 SharedExpenseService
- 🔲 Listagem de despesas do grupo
- 🔲 Formulário de criação/edição
- 🔲 Ação de quitar participante (`PATCH .../settle`)

---

## 🌐 UX / Qualidade
- 🔲 Tratamento global de erros HTTP (ProblemDetails → toast/mensagem)
- 🔲 Mensagens de validação i18n nos formulários
- 🔲 Empty states nas listagens
- 🔲 Responsividade mobile (primeflex breakpoints)
- 🔲 Acessibilidade básica (aria-labels, foco gerenciado em modais)
