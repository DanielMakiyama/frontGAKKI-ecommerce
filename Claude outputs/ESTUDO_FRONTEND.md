# Estudo técnico do front-end — GAKKI STORE

Documento de referência da camada de apresentação do protótipo. Descreve a
arquitetura, o papel de cada arquivo e as decisões técnicas que sustentam o
código, com rastreio aos requisitos do DRS quando aplicável.

**Stack:** React 19 · React Router 7 · Vite 8 · lucide-react (ícones) · CSS puro
com custom properties. Sem biblioteca de estado, sem framework de UI, sem
pré-processador de CSS.

---

## 1. Arquitetura geral

O front-end está organizado em cinco camadas. A regra que as separa é simples:
**cada camada só conhece a de baixo**, nunca a de cima.

```
┌──────────────────────────────────────────────┐
│  pages/          telas ligadas a rotas       │
├──────────────────────────────────────────────┤
│  components/     peças reutilizáveis         │
├──────────────────────────────────────────────┤
│  context/        estado global da sessão     │
├──────────────────────────────────────────────┤
│  api/            acesso a dados              │
├──────────────────────────────────────────────┤
│  utils/ + index.css   formatação e design    │
└──────────────────────────────────────────────┘
```

### Por que isso importa

Uma página nunca chama `fetch` diretamente: pede à camada `api`. Um componente
nunca lê `localStorage` de sessão: pede ao `context`. Uma tela nunca escreve um
código hexadecimal de cor: usa um token do `index.css`.

Essa disciplina é o que permite trocar o backend mockado pelo real mudando **uma
linha**, e trocar a paleta inteira mudando **um bloco de variáveis**.

---

## 2. Camada de infraestrutura

### `index.html`

Documento raiz servido pelo Vite. Carrega a fonte Kumbh Sans do Google Fonts,
declara o favicon e fornece a `<div id="root">` onde o React monta a aplicação.

### `main.jsx`

Ponto de entrada. Monta o React na `#root` e empilha os provedores de contexto na
ordem correta:

```jsx
<BrowserRouter>
  <AuthProvider>
    <CartProvider>
      <FavoritosProvider>
        <App />
```

**A ordem não é arbitrária.** `CartProvider` chama `useAuth()` internamente (o
carrinho só existe para usuário logado), então precisa estar *dentro* do
`AuthProvider`. Inverter a ordem quebra a aplicação com "cannot read property of
null".

### `App.jsx`

Define o **esqueleto visual fixo** — header, área de conteúdo, chatbot e rodapé —
e o **mapa de rotas**. Toda rota protegida é embrulhada em `<RotaProtegida>`:

```jsx
<Route path="/carrinho" element={<RotaProtegida exigirCliente><Carrinho /></RotaProtegida>} />
```

A proteção fica declarada aqui, junto da rota, e não espalhada dentro de cada
página. Quem lê o `App.jsx` vê o mapa de permissões inteiro numa tela só.

### `vite.config.js` e `package.json`

Configuração mínima do bundler (plugin do React) e scripts: `dev`, `build`,
`lint` (oxlint) e `preview`.

### `index.css`

Arquivo único de estilos, sem CSS-in-JS nem módulos. Organizado em:

1. **Bloco `:root` de tokens** — cores, tipografia, raios, sombras e larguras de
   container. É a única fonte de verdade visual do projeto.
2. **Reset e elementos base** — `box-sizing`, tipografia dos títulos, foco.
3. **Blocos por área** — header, botões, formulários, catálogo, produto,
   carrinho/checkout, perfil, home.

Os tokens seguem nomes semânticos (`--cor-primaria`, `--cor-tinta`), não
descritivos (`--marrom`, `--preto`). Quando a paleta mudou de laranja para
marrom, nenhum nome precisou mudar.

**Aliases de compatibilidade:** o fim do `:root` mantém os nomes da paleta antiga
(`--cor-latao`, `--cor-madeira`) apontando para os novos. São uma ponte
temporária para as telas ainda não migradas (Admin, Pedidos, Trocas, Cupons) e
devem ser removidos ao fim da refatoração.

---

## 3. Camada de dados

### `api/client.js`

**O contrato da aplicação com o backend.** Reúne três coisas:

1. A função `request()`, que centraliza `fetch`, cabeçalhos, token JWT e o
   tratamento de erro (extrai `mensagem` ou `erro` do corpo e lança `Error`).
2. O objeto `apiReal`, com um método por endpoint REST.
3. A chave de troca:

```js
const MODO_MOCK = true;
export const api = MODO_MOCK ? apiMock : apiReal;
```

**Este é o ponto mais importante do arquivo.** Nenhuma página sabe se está
falando com o backend Java ou com dados fictícios em memória — todas chamam
`api.algumaCoisa()`. Trocar `true` por `false` liga a aplicação inteira ao
backend real sem tocar em nenhuma tela.

### `api/mockApi.js`

Implementação fictícia com **exatamente a mesma assinatura** do `apiReal`, lendo
e escrevendo no `mockDb.js`. Simula latência de rede (`atraso()`) e uma sessão
falsa (o "token" é o e-mail em base64, lido do `localStorage` a cada chamada,
para sobreviver a um F5).

**Aqui vivem as invariantes de negócio.** Regras que não podem depender da tela
foram implementadas neste arquivo, não nos componentes:

| Regra | Implementação |
|---|---|
| RF0026/RF0027 — um endereço principal e um cartão preferencial | Marcar um desmarca os outros na mesma operação |
| RN0022 — cliente precisa de ao menos um endereço | `removerEndereco` recusa a remoção do último |
| Cadastro atômico | `registrar()` valida tudo **antes** de gravar cliente, endereço e cartão |
| Nunca ficar sem padrão | Ao remover o item marcado, o próximo é promovido |

O princípio: **se a tela fosse a única guardiã da regra, outro fluxo poderia
violá-la.**

### `api/mockDb.js`

Banco em memória: arrays de instrumentos, categorias, fabricantes, clientes,
endereços, cartões, cupons, carrinho e pedidos, com dados de seed realistas.
Também exporta `gerarId()`. Como é um módulo ES, o estado sobrevive à navegação
entre rotas, mas **se perde no refresh** — comportamento aceitável num protótipo.

---

## 4. Camada de estado global

Três contextos, cada um com uma responsabilidade única. Todos seguem o mesmo
padrão: um `Provider` que embrulha a aplicação e um hook `useXxx()` para consumir.

### `context/AuthContext.jsx`

Guarda quem está logado. Persiste nome, perfil e token no `localStorage`, então a
sessão sobrevive ao refresh. Expõe:

- `usuario` — objeto ou `null`
- `login(nome, perfil, token)` / `logout()`
- `isAdmin` — derivado, verdadeiro para `ADMINISTRADOR` e `GERENTE_VENDAS`

`isAdmin` é **calculado**, não armazenado. Estado derivado guardado em duplicata
é fonte garantida de inconsistência.

### `context/CartContext.jsx`

Espelha o carrinho do servidor. Expõe `carrinho`, `recarregar`, `adicionar`,
`atualizarQuantidade`, `remover` e `totalItens`.

Cada mutação **substitui o estado local pela resposta do servidor**, em vez de
atualizar otimisticamente. Mais lento, porém sempre correto — decisivo num
sistema com bloqueio de estoque (RN0044), onde o servidor pode recusar ou ajustar
o que a tela pediu.

### `context/FavoritosContext.jsx`

Lista de desejos do visitante. Diferente do carrinho, **não existe no backend**:
é preferência do navegador, guardada em `localStorage`.

Duas decisões de projeto:

- **Guarda apenas IDs**, nunca os objetos de produto. Salvar o produto inteiro
  faria a lista exibir amanhã um preço congelado hoje.
- **Leitura tolerante a falha.** `localStorage` pode estar bloqueado (navegação
  anônima) ou conter JSON corrompido; `lerDoStorage()` devolve `[]` em vez de
  derrubar a aplicação na primeira renderização.

---

## 5. Componentes de navegação e identidade

### `components/Header.jsx`

Barra fixa no topo (`position: sticky` com `backdrop-filter`). **Renderiza menus
diferentes conforme o perfil**: cliente vê catálogo e carrinho, administrador vê
o atalho do painel, visitante vê "Entrar" e "Criar conta".

Pontos de acessibilidade implementados:

- `NavLink` no lugar de `Link` para a rota atual — o React Router entrega
  `isActive` e a classe `.ativo` marca a página em que se está, sem estado manual.
- Dropdown fecha com clique fora **e** com `Escape`.
- `aria-expanded`, `aria-haspopup` e `role="menu"` no menu da conta.
- O `aria-label` do carrinho carrega a contagem ("Carrinho (3 itens)") — leitor
  de tela não lê o badge visual.

### `components/LogoGakki.jsx`

Símbolo da marca. Recebe `size`, `className` e `titulo` opcional.

Quando `titulo` é omitido, a imagem é marcada como decorativa (`alt=""` +
`aria-hidden`), porque a palavra "GAKKI store" já aparece ao lado no header —
um `alt` aqui seria leitura duplicada.

O componente já foi um SVG desenhado à mão e hoje é uma imagem raster. **A API
não mudou**, então nenhum ponto de uso precisou ser tocado — exemplo prático de
por que encapsular um ativo num componente vale a pena.

### `components/RotaProtegida.jsx`

Guarda de rota declarativa. Três props booleanas combinam as políticas:

| Prop | Efeito |
|---|---|
| `permitirVisitante` | Não exige login (catálogo, produto) |
| `exigirCliente` | Redireciona administrador para fora |
| `exigirAdmin` | Redireciona não-administrador para fora |

Redireciona com `<Navigate replace>` — sem o `replace`, a página bloqueada
ficaria no histórico e o botão voltar entraria em laço.

### `components/Chatbot.jsx`

Widget flutuante ligado ao serviço de IA (`POST /recomendacoes/chat`, RNF0044-2).
Mantém o histórico da conversa em estado local e só se renderiza para usuário
logado (`if (!usuario) return null`). Falha de rede vira mensagem amigável no
próprio chat, não um erro na tela.

---

## 6. Componentes de catálogo e produto

### `components/ProdutoCard.jsx`

Unidade da vitrine, usada no catálogo, na home e no carrossel. Recebe o produto
pronto e não sabe de onde veio — por isso serve em qualquer listagem.

**A técnica central: o link de cobertura.** O card inteiro é clicável, mas *não*
está embrulhado num `<a>` — botão dentro de link é HTML inválido e quebraria o
favoritar. A solução:

```css
.link-cobertura::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.btn-favorito { z-index: 2; }
```

O `<Link>` fica só no título e seu pseudo-elemento se estica sobre o card.
Resultado: **um único link** na árvore de acessibilidade, card todo clicável, e o
coração acima na pilha recebendo o próprio clique — sem `stopPropagation`.

Exibe ainda selos condicionais (Esgotado, Restam N) e o parcelamento calculado.

### `components/FiltrosCatalogo.jsx`

Barra lateral de filtros: busca, chips de categoria, faixas de preço, marca e
"somente em estoque".

**É um componente 100% controlado** — não guarda estado nenhum. Recebe `filtros`
e devolve mudanças por `aoMudar`. Toda a verdade vive no `Catalogo.jsx`, o que
garante que a contagem de resultados, os chips de filtro ativo e a URL nunca
dessincronizem.

As faixas de preço são exportadas como constante `FAIXAS_PRECO`, com `min` e
`max` declarados junto do rótulo — a página importa e usa, sem duplicar `if`s.

### `components/IconeInstrumento.jsx`

Mapeia nome de categoria para um ícone SVG monolinear (violão, sax, bateria,
piano, amplificador, acessório). Substitui as fotos que o catálogo ainda não tem.
Faz *lookup* em objeto com fallback para um ícone genérico — sem cadeia de `if`.

### `components/CarrosselProdutos.jsx`

Vitrine horizontal com setas nas pontas. Recebe `titulo`, `produtos` e
`verTudoPara`.

**A rolagem é nativa**, não controlada por estado. Não há `slideAtual` nem
`transform`: o trilho é um `overflow-x: auto` com `scroll-snap`, e as setas só
chamam `scrollBy()`. Isso entrega de graça o arrastar no touch, o shift+roda do
mouse, as setas do teclado e — o mais esquecido — o navegador trazendo o card
para a vista quando ele recebe foco pelo Tab.

O componente apenas **observa** a rolagem para desabilitar as setas nas pontas,
com folga de 4px contra arredondamento de subpixel.

### `components/DestaqueHero.jsx`

Painel do hero que mostra **um produto por vez**, com setas laterais e
indicadores. Diferente do carrossel, aqui não há rolagem: é troca de conteúdo por
índice, e a navegação é **circular**.

O detalhe que evita bug:

```js
setIndice((i) => (i + passo + produtos.length) % produtos.length);
```

O `+ produtos.length` antes do módulo é obrigatório: em JavaScript `(0 - 1) % 8`
resulta `-1`, não `7`.

### `components/GaleriaProduto.jsx`

Painel principal + tira de miniaturas da página de produto. Trabalha com uma
lista `imagens` que hoje chega vazia — o backend ainda não expõe imagens. Nesse
caso mostra o ícone da categoria **sem** a tira (uma miniatura só não é galeria).
Quando o campo existir, a página não muda.

### `components/SeletorQuantidade.jsx`

Stepper − / valor / +, controlado, usado na página de produto e no carrinho.

**Um único ponto de saneamento** garante que o pai nunca receba lixo:

```js
const aplicar = (bruto) => {
  const n = Math.trunc(Number(bruto));
  if (!Number.isFinite(n)) return;
  aoMudar(Math.min(max, Math.max(min, n)));
};
```

Botões e digitação passam pelos mesmos limites. O `<input>` permanece digitável
de propósito — quem quer 12 unidades não deve clicar onze vezes; as setinhas
nativas foram escondidas por CSS, não removidas.

---

## 7. Componentes de perfil

### `components/EnderecosCliente.jsx`

CRUD completo de endereços de entrega (RF0026): listar, cadastrar, alterar,
remover e definir o principal.

### `components/CartoesCliente.jsx`

CRUD completo de cartões (RF0027), com a mesma estrutura de estado, as mesmas
classes CSS e o mesmo desenho de API do componente de endereços. **Duas telas que
fazem a mesma coisa devem parecer a mesma coisa** — para o usuário e para quem
mantém o código.

Dois pontos compartilhados pelos dois componentes:

- **Um estado só para o formulário.** `editando` guarda o *id* em edição ou a
  string `"novo"`. Dois booleanos separados (`editando` + `criando`) permitiriam
  os dois formulários abertos ao mesmo tempo — bug clássico desse tipo de tela.
- **Modelo de dados do cartão:** apenas os quatro últimos dígitos são guardados.
  Número completo e CVV exigem certificação PCI-DSS; num fluxo real vão direto ao
  gateway, que devolve um token. A RN0024 lista esses campos, mas armazená-los
  seria erro grave de segurança.

---

## 8. Páginas

### `pages/Home.jsx`

Vitrine em quatro blocos: hero com painel de destaque navegável, faixa de
garantias, atalhos por categoria e carrossel "Em destaque". Uma requisição
(`size: 8`) alimenta o painel do hero e o carrossel.

Se o usuário for administrador, a página **desvia para o `AdminDashboard`** antes
de qualquer requisição de vitrine.

### `pages/Catalogo.jsx`

Coração do e-commerce. Orquestra filtros, ordenação e listagem.

**A decisão mais relevante é a divisão de trabalho entre servidor e navegador:**

- **Nome e categoria** vão para a API — ela já sabe filtrar por eles e um dia
  serão índices no banco.
- **Preço, marca, estoque e ordenação** são aplicados no navegador, num `useMemo`
  sobre a página já recebida.

Isso só é legítimo porque o catálogo cabe numa página (`size: 50`). **Quando
passar disso, os quatro precisam virar query params** — caso contrário a
ordenação passa a ordenar apenas o pedaço visível, que é o bug clássico de
catálogo paginado.

Outros mecanismos:

- **Debounce de 350 ms** na busca por nome: uma requisição por pausa de
  digitação, não por tecla.
- **Categoria sincronizada com a URL** (`/catalogo?categoria=3`), nos dois
  sentidos, com guarda contra laço infinito e `replace: true` para não encher o
  histórico. Só a categoria vai para a URL: é o que se compartilha e o que a home
  linka; o resto é refinamento de sessão.
- **Esqueleto de carregamento** no formato do card, para a página não "pular"
  quando os dados chegam.

### `pages/ProdutoDetalhe.jsx`

Página do produto em duas colunas: galeria à esquerda, bloco de compra à direita.
Reúne trilha de navegação, preço com parcelamento, aviso de estoque em três
estados, stepper, adicionar ao carrinho, favoritar e ficha técnica em `<dl>`.

Visitante não logado que clica em comprar é enviado ao login **com a origem
guardada** (`state: { from }`), para voltar ao produto depois de entrar.

### `pages/Carrinho.jsx`

Lista de itens à esquerda e resumo fixo (`position: sticky`) à direita — o resumo
é o que o cliente consulta enquanto mexe nas quantidades. Reaproveita o
`SeletorQuantidade`, cujo `min = 1` impede zerar por engano; remover é a lixeira,
ação explícita.

### `pages/Checkout.jsx`

Tela mais complexa do fluxo de cliente. Três etapas à esquerda (endereço,
pagamento, cupons) e resumo fixo à direita.

- **Endereço em lista de radios**, não `<select>`: rua, cidade e CEP ficam
  visíveis, e é onde mais se erra.
- **Numeração das etapas por contador CSS** (`counter-increment`), não escrita no
  JSX — reordenar as `<section>` renumera sozinho.
- **Pagamento combinado** (RN0034): várias linhas cartão + valor, com botão
  "Restante" que subtrai o valor da própria linha antes de calcular a diferença.
- **Frete recalculado** a cada mudança de endereço, via `preverFrete`.
- O botão de confirmar só habilita com endereço escolhido, frete calculado e ao
  menos uma forma de pagamento.

### `pages/Pedidos.jsx`

Histórico do cliente com ações contextuais por status: cancelar pedido, confirmar
recebimento e solicitar troca de um item (RF0041). A solicitação de troca abre um
`window.prompt` para a justificativa — ponto conhecido a melhorar.

### `pages/Trocas.jsx`

Acompanhamento das trocas. O dicionário `ROTULOS_STATUS` traduz o enum do backend
para linguagem do cliente ("Aceita — envie o item de volta"). O botão "Informar
que enviei o item" só aparece no status `TROCA_ACEITA`.

### `pages/Cupons.jsx`

Tabela de cupons promocionais e de troca, com valor, validade e status.

### `pages/Perfil.jsx`

Agrega quatro seções: dados cadastrais, endereços, cartões e alteração de senha
(RF0028), além do encerramento de conta com confirmação em duas etapas.

### `pages/Login.jsx`

Reformulada para uso em sala: **não há mais formulário de e-mail e senha**. Dois
cartões de perfil (cliente e administrador) entram instantaneamente.

A tela continua chamando `api.login(email)` — o mesmo caminho de antes. Mudou
apenas *como o e-mail é informado*: vem da constante `CONTAS_DEMO`. Não existe
"modo demo" espalhado pela aplicação; para voltar ao login digitado, basta
reescrever esta tela.

### `pages/Registrar.jsx`

Cadastro em três grupos de campos (`<fieldset>` + `<legend>`, para que o leitor
de tela anuncie o grupo): dados pessoais, endereço de entrega e cartão opcional.

**Tudo vai num único payload.** A RN0022 exige que todo cliente tenha endereço de
entrega; se fossem duas requisições, uma falha na segunda deixaria no banco
exatamente o que a regra proíbe. O cartão viaja junto mas é opcional — nenhuma
regra obriga o cliente a ter cartão para existir.

Ao concluir, o cadastro **já autentica** o usuário, porque a tela de login só
oferece os perfis de demonstração.

### `pages/Admin.jsx`

Painel administrativo em abas, com seis subcomponentes no mesmo arquivo:

#### `GerenciarPedidos`
Lista com filtro por status e linha expansível. O objeto `PROXIMA_ACAO` mapeia
status para a ação seguinte, e o botão é montado a partir dele — sem cadeia de
`if` por status (RF0039, RF0040).

#### `GerenciarTrocas`
Fluxo completo de troca do lado do administrador: aceitar, negar com motivo,
confirmar recebimento (indicando se o item retorna ao estoque) e processar,
gerando o cupom (RF0042 a RF0045).

#### `GerenciarClientes`
Busca por nome e alternância entre ativar e inativar cadastro (RF0023).

#### `FormularioProduto`
Cadastro de instrumento com categorias, fabricante e grupo de precificação
(RF0011).

#### `FormularioEstoque`
Entrada em estoque com valor de custo; o valor de venda é recalculado pela margem
do grupo de precificação (RF0051, RF0052).

#### `AnaliseVendas`
Consulta de histórico por período e categorias (RF0055).

### `components/AdminDashboard.jsx`

Painel de abertura do administrador. Dispara três requisições em paralelo com
`Promise.all` (pedidos, clientes e trocas) e **deriva as métricas no cliente**:
receita considerando apenas status que representam pagamento confirmado, pedidos
aguardando ação e trocas pendentes.

Os limiares vivem em constantes no topo (`STATUS_RECEITA`,
`STATUS_ACAO_PENDENTE`, `TROCA_STATUS_PENDENTE`), não espalhados pelo JSX.

---

## 9. Utilitários

### `utils/formatos.js`

`formatarCep` e `formatarTelefone` — máscaras aplicadas durante a digitação, de
modo que o valor já sai do estado no formato esperado pelo backend.

Vivem fora dos componentes porque cadastro e perfil precisam da **mesma** máscara.
Duas cópias divergem cedo ou tarde (uma aceita nove dígitos, a outra não).

### `utils/constantes.js`

`BANDEIRAS` — lista de bandeiras aceitas (RN0025). Mesmo raciocínio: se cada tela
tivesse a sua, uma aceitaria uma bandeira que a outra recusa. Quando o backend
expuser esse cadastro, vira `api.listarBandeiras()`.

---

## 10. Padrões transversais

Cinco decisões se repetem em todo o projeto e explicam boa parte do código.

### Componente controlado

Componentes de formulário (`FiltrosCatalogo`, `SeletorQuantidade`) não guardam
estado: recebem valor e devolvem mudança. O estado vive num lugar só, o que
elimina dessincronização entre partes da tela.

### Invariante no dado, não na tela

Regras como "só um cartão preferencial" ou "ao menos um endereço" foram
implementadas na camada de API, não nos componentes. A tela apenas exibe a
mensagem que vem de lá.

### Validar antes de gravar

Operações compostas (cadastro de cliente + endereço + cartão) validam tudo antes
do primeiro `push`. Um `throw` no meio deixaria dados órfãos.

### Um token, um lugar

Cores, larguras e espaçamentos são variáveis CSS. Alterar `--recuo-lateral`
reposiciona header, conteúdo e rodapé simultaneamente, porque os três leem a
mesma variável.

### Acessibilidade estrutural

`<fieldset>`/`<legend>` para grupos de campos, `<dl>` para pares rótulo/valor,
`aria-label` com informação que só existe visualmente, `role="status"` em
mensagens de confirmação, e foco visível preservado em todos os controles.

---

## 11. Dívidas técnicas conhecidas

Registro honesto do que ficou pendente, com o impacto de cada item.

| # | Item | Impacto |
|---|---|---|
| 1 | Aliases `--cor-latao` / `--cor-madeira` ainda no `:root` | Admin, Pedidos, Trocas e Cupons dependem deles; impedem fechar a migração de paleta |
| 2 | Filtros de preço, marca e ordenação no cliente | Quebram quando o catálogo passar de uma página |
| 3 | `formatarBRL` mora em `ProdutoCard.jsx` | Quatro telas importam formatação de um componente de UI; deveria estar em `utils/` |
| 4 | Campos de endereço incompletos frente à RN0023 | Faltam tipo de residência, tipo de logradouro, bairro e país |
| 5 | Página de favoritos inexistente | O coração salva, mas não há tela para ver a lista |
| 6 | `window.prompt` na solicitação de troca | Não estilizável e ruim em mobile; deveria ser um modal |
| 7 | Sem tratamento global de erro | Cada tela repete `try/catch`; um *error boundary* centralizaria |
| 8 | Sem testes automatizados | O DRS menciona Selenium; nada implementado ainda |

---

## Apêndice — mapa de arquivos

```
frontend/
├── index.html
├── public/
│   ├── logo-gakki.png        símbolo da marca
│   └── favicon.png
└── src/
    ├── main.jsx              montagem + provedores
    ├── App.jsx               esqueleto + rotas
    ├── index.css             tokens + estilos
    ├── api/
    │   ├── client.js         contrato REST + chave MODO_MOCK
    │   ├── mockApi.js        implementação fictícia + invariantes
    │   └── mockDb.js         dados de seed
    ├── context/
    │   ├── AuthContext.jsx   sessão e perfil
    │   ├── CartContext.jsx   carrinho espelhado do servidor
    │   └── FavoritosContext.jsx  lista de desejos local
    ├── components/
    │   ├── Header.jsx            navegação por perfil
    │   ├── LogoGakki.jsx         símbolo da marca
    │   ├── RotaProtegida.jsx     guarda de rota
    │   ├── Chatbot.jsx           assistente com IA
    │   ├── ProdutoCard.jsx       card da vitrine
    │   ├── FiltrosCatalogo.jsx   barra lateral de filtros
    │   ├── IconeInstrumento.jsx  ícone por categoria
    │   ├── CarrosselProdutos.jsx vitrine horizontal
    │   ├── DestaqueHero.jsx      destaque do hero
    │   ├── GaleriaProduto.jsx    galeria da página de produto
    │   ├── SeletorQuantidade.jsx stepper de quantidade
    │   ├── EnderecosCliente.jsx  CRUD de endereços
    │   ├── CartoesCliente.jsx    CRUD de cartões
    │   └── AdminDashboard.jsx    métricas do administrador
    ├── pages/                Home, Catalogo, ProdutoDetalhe, Login,
    │                         Registrar, Carrinho, Checkout, Pedidos,
    │                         Cupons, Trocas, Perfil, Admin
    └── utils/
        ├── formatos.js       máscaras de CEP e telefone
        └── constantes.js     bandeiras de cartão
```
