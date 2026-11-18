# Calculadora de Preço · MRS Resinas

App instalável (PWA) com tela de cadastro e integração com o RD Station.

---

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | O app inteiro: cadastro + calculadora |
| `manifest.webmanifest` | Faz o app poder ser instalado na tela de início |
| `sw.js` | Faz o app funcionar sem internet |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png` | Ícones |

Não renomeie nem separe os arquivos: eles precisam ficar na mesma pasta.

---

## Passo 1 · Publicar

O app precisa estar em um endereço **https**. Sem https, o navegador não instala o app nem
guarda o conteúdo para uso offline.

**Caminho mais rápido, sem conta:** abra `netlify.com/drop` e arraste a **pasta inteira**
(não os arquivos soltos). Em segundos você recebe um link https funcionando.

**Vercel:** se o time já usa (como no `pedidos-3d-cure.vercel.app`), dá para arrastar esta
pasta direto no painel da Vercel. Mesmo resultado.

**Caminho definitivo:** suba a pasta na hospedagem do site da MRS, em algo como
`mrsresinas.com.br/calculadora`. Fica na sua marca e ajuda no Google.

> Google Drive não serve. Ele não publica HTML como página desde 2016 — é por isso que
> o link ficava desconfigurado.

---

## Passo 2 · Ligar o RD Station

O app **não guarda a base de leads** — ele não tem banco de dados. Quem guarda é o
RD Station. Existem dois caminhos; escolha um.

### Caminho A · Código de monitoramento (recomendado, mantém o visual)

Mantém o formulário bonito que já está no app.

1. No RD Station: **Integrações → Código de monitoramento**. Copie o script.
2. Abra o `index.html` e cole o script **logo antes** de `</body>`, no final do arquivo.
3. Publique e preencha o formulário uma vez, com dados reais seus.
4. Volte ao RD Station: **Converter → Integração de formulário**. O formulário só aparece
   na lista **depois da primeira conversão**.
5. Clique em **Editar** e confira o de-para dos campos. Eles já vão nomeados no padrão que
   o RD reconhece: `name`, `email`, `personal_phone`.

O identificador da conversão é **`calculadora-preco-mrs`** — use esse nome para montar
automação e segmentação no RD.

### Caminho B · Formulário oficial do RD Station

Mais simples de configurar, porém com menos controle visual.

1. No RD Station, crie um formulário com nome, e-mail e telefone.
2. Em **Ver código**, copie o trecho de "Insira o formulário você mesmo".
3. No `index.html`, apague o bloco `<form id="cad">…</form>` inteiro e cole o código do RD
   no lugar. Depois procure `$('cad').addEventListener` no script e apague esse trecho.

---

## Passo 3 · Testar antes de divulgar

- [ ] Abrir o link no celular e conferir se o cadastro aparece
- [ ] Preencher com dados errados e ver se as mensagens de erro aparecem
- [ ] Preencher certo e confirmar que a calculadora abre
- [ ] Fechar e reabrir: **não deve pedir cadastro de novo**
- [ ] Conferir se o lead chegou no RD Station
- [ ] Instalar: no iPhone, Compartilhar → Adicionar à Tela de Início. No Android,
      o menu do Chrome oferece Instalar aplicativo
- [ ] Ativar o modo avião e abrir o app: deve funcionar

---

## O convite de instalação

O app mostra sozinho um aviso **"Instalar no celular"** logo depois do cadastro, com um
botão. O comportamento muda por aparelho, e isso é limitação do sistema, não do app:

- **Android e Chrome no computador:** aparece o botão **Instalar**, que abre a caixa de
  instalação do próprio sistema. Um toque e pronto.
- **iPhone no Safari:** a Apple não permite instalação por botão. O app mostra as
  instruções: Compartilhar → Adicionar à Tela de Início.
- **iPhone em outro navegador:** o app avisa para abrir no Safari, porque no Chrome do
  iPhone não existe instalação.

Quem fecha o aviso no "x" não vê de novo. Quem instala também para de ver.

## Selos no topo

- **Online / Sem internet** — mostra se o aparelho está conectado.
- **Olá, [nome]** — quem está usando, igual ao seu formulário de pedidos.
- **Cadastro na fila** — aparece se o lead ainda não chegou ao RD Station, por exemplo se
  a aluna se cadastrou sem internet. O app tenta enviar de novo sozinho quando a conexão volta.

## Como a aluna instala

**iPhone:** abrir o link no Safari → botão Compartilhar → *Adicionar à Tela de Início*.
Só funciona no Safari; no Chrome do iPhone não aparece.

**Android:** abrir no Chrome → aparece o convite *Instalar aplicativo*, ou pelo menu de
três pontinhos → *Instalar aplicativo*.

Depois disso vira um ícone na tela de início e abre em tela cheia, sem barra de navegador.

---

## Códigos de acesso (Black 2026)

O app só abre para quem digita um **código de acesso** válido, junto com o cadastro.

- **Os 50 códigos** estão em `codigos-black-2026.csv`, nesta pasta. Esse arquivo **não vai
  para o GitHub** (o repositório é público). Guarde uma cópia em lugar seguro e anote na
  coluna `comprador` para quem mandou cada código.
- **Parceiros:** os códigos 51 a 70 são para parceiros testarem o app e darem feedback.
  Estão em `codigos-parceiros-2026.csv`, também fora do GitHub.
- **Validade:** até 01/12/2027, fim do dia. Depois disso o app pede um código novo.
- **Aparelhos:** cada código ativa no máximo **3 aparelhos**. No iPhone, o Safari e o app
  instalado contam como 2, porque guardam os dados separados.
- **Internet:** só é preciso na ativação. Depois o app funciona offline até a validade e,
  quando abre com internet, confere em silêncio se o código continua valendo.
- **Cancelar um código** (por exemplo, se vazou): abra `api/_codigos.js`, coloque o número
  dele em `REVOGADOS` (ex.: `REVOGADOS: [7]`) e publique. Quem usa esse código é bloqueado
  na próxima vez que abrir o app com internet.
- **Liberar mais aparelhos para um código:** no painel do Upstash (Vercel → Storage),
  apague a chave `atv:NÚMERO` (ex.: `atv:7`). Os aparelhos ativam de novo do zero.
- **Gerar códigos novos:** peça para o Claude; os hashes vão em `api/_codigos.js` e os
  códigos num CSV novo, fora do git.

A conferência roda em `api/ativar.js`, uma função da Vercel que guarda as ativações num
banco Upstash Redis ligado ao projeto (variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`).
Sem esse banco, ninguém consegue ativar.

---

## Quando você mudar alguma coisa

O app fica guardado no aparelho da aluna. Para ela receber a versão nova, **abra o `sw.js`
e suba em um o número de `CACHE`** (por exemplo, `mrs-calc-v12` vira `mrs-calc-v13`) toda
vez que mudar o `index.html`, depois publique. Sem isso, ela continua vendo a versão antiga
por muito tempo.

A publicação é por `git push` na `main`: a Vercel republica sozinha em
`calculadora-mrs-9elf.vercel.app`.

---

## LGPD

O app pede autorização explícita antes de guardar os dados, e o texto diz o que será feito
com eles. Três pontos que ficam por sua conta:

- Ter uma **política de privacidade** publicada e acessível.
- Garantir o **descadastramento** — o RD Station faz isso pelo link de opt-out no rodapé
  dos e-mails.
- Guardar a **prova do consentimento**. Como o registro entra pelo RD Station, ele fica
  na ficha do lead, com data e hora.

Vale uma conferida do jurídico antes de divulgar em escala.

---

## Limites que vale conhecer

- **É um PWA, não um app de loja.** Instala pelo navegador, tem ícone e funciona offline,
  mas não aparece na App Store nem na Play Store. Publicar nas lojas exige contas de
  desenvolvedor pagas, revisão da Apple e do Google e manutenção — para este caso, não compensa.
- **O cadastro é por aparelho.** Se a aluna trocar de celular, cadastra de novo. Para ter
  login de verdade seria preciso um servidor e senha, o que muda bastante o projeto.
- **Não há como impedir alguém de pular o cadastro** com conhecimento técnico. A porta
  serve para captar quem quer usar, não para bloquear quem sabe mexer no navegador.
- **As peças salvas ficam no aparelho da aluna**, não com a MRS. Ela pode baixar o arquivo
  como cópia de segurança.
