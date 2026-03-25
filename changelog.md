# Changelog - Últimas Alterações

Resumo das atualizações realizadas nos últimos ciclos de desenvolvimento:

### 🛡️ Controle Total do Host (Painel Administrativo)
- **Novo Componente:** `AdminPanel.tsx` - Uma interface exclusiva para o host gerenciar a sala.
- **Acesso Global:** O host agora pode abrir o painel em qualquer momento do jogo (Dicas, Votação, Resultados, etc.) através do ícone de escudo no cabeçalho.
- **Expulsão Imediata:** O host tem o poder de expulsar qualquer jogador instantaneamente, sem necessidade de votação.

### ✨ Experiência de Usuário (UX/UI)
- **Dicas em "Toast":** A entrada de dicas foi refatorada. Agora, ao chegar a sua vez, um painel flutuante elegante aparece na parte inferior da tela, melhorando o foco e o visual.
- **Interface Premium:** Uso intensivo de *glassmorphism* (desfoque de fundo), bordas dinâmicas e animações via `framer-motion` para um visual topo de linha.

### 🧹 Refatoração e Limpeza
- **Remoção da Votação de Expulsão:** Todo o código legado de `kickVotes` e mensagens de chat relacionadas à votação de expulsão foi removido para simplificar a lógica do servidor e do cliente.
- **Persistência de Estado:** Correções na lógica de eliminação para garantir que os resultados da última rodada permaneçam visíveis até o início da próxima.
- **Integridade de Tipos:** Atualização completa das definições de `Room` e `Player` no backend e frontend.

### 🐛 Correções Técnicas
- Consertados erros de importação e sintaxe introduzidos durante as grandes mudanças estruturais.
- Limpeza de dependências de ícones não utilizados (`Gavel`, `MessageSquare`).
