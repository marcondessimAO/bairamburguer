# Bairam Burguer - Contexto do Projeto (Mapeamento para IA)

Este ficheiro serve como um "System Prompt" e mapa de contexto da arquitetura, regras de negócio e infraestrutura do Bairam Burguer, de modo a orientar novas IAs ou novos desenvolvedores.

## 1. Visão Geral do Projeto
Bairam Burguer é uma plataforma de delivery digital composta por um e-commerce interativo (para os clientes realizarem os seus pedidos e pagarem via Pix) e um painel de administração em tempo real (para a cozinha gerir e despachar os pedidos). 

## 2. Stack Tecnológico

**Backend:**
- Java (JDK 17+)
- Spring Boot 3
- Banco de Dados: PostgreSQL
- Autenticação: JWT (JSON Web Tokens)
- Segurança: Spring Security
- Pagamentos: SDK do Mercado Pago

**Frontend:**
- Next.js (App Router, Turbopack)
- React
- TypeScript
- Tailwind CSS
- Ícones: Heroicons (SVG)

## 3. Estrutura do Repositório

- `/frontend`: Aplicação web construída em Next.js. Contém o e-commerce voltado para o cliente e o painel de administração em rotas segmentadas (ex: `/(admin)` e `/(shop)`). Possui o túnel reverso de API em `next.config.ts`.
- `/backend`: API RESTful construída em Spring Boot. Geri o catálogo de produtos, as ordens de serviço, a segurança com JWT e integra com serviços externos como o Mercado Pago.
- `/database`: (Se aplicável) Scripts de migração ou ficheiros Docker relacionados com a persistência de dados.
- `CONTEXTO_IA.md`: Este ficheiro, servindo de documentação técnica.

## 4. Infraestrutura e Deploy

**Backend:**
- Hospedado numa VPS (Virtual Private Server) na Hostinger.
- Executado via Docker, gerido pelo `docker-compose.yml`. A stack inclui o container do banco de dados (PostgreSQL) e da API (Spring Boot).
- A API fica a escutar internamente (normalmente na porta 8080).

**Frontend:**
- Hospedado na Vercel com domínio principal `bairamburguerpetiscaria.com`.
- **Túnel de Comunicação (Proxy):** O frontend na Vercel serve como um Reverse Proxy para a VPS. Usamos `rewrites` no ficheiro `next.config.ts` de modo a que todas as requisições para `/api/:path*` sejam encaminhadas de forma transparente para a VPS do backend. Isso contorna problemas de CORS e simplifica a comunicação.

## 5. Integrações e Regras de Negócio Críticas

- **Mercado Pago (Pagamento via Pix):**
  - O sistema gera dinamicamente um QR Code Pix na finalização da compra usando o SDK do Mercado Pago.
  - O estado inicial do pedido é gravado como `AWAITING_PAYMENT`.
  - Quando o cliente paga, o Mercado Pago envia uma notificação POST (Webhook) para o endpoint explícito `/api/webhooks/mercadopago`.
  - O `WebhookController` processa o payload do Mercado Pago e atualiza a ordem de `AWAITING_PAYMENT` para `PAID` no banco de dados.
  - Apenas pedidos que se encontram no estado `PAID` em diante aparecem no Painel de Administração.

- **Tempo Real (Polling vs WebSockets):**
  - Devido a restrições e timeouts de WebSockets na Vercel (especialmente usando Serverless Functions/Rewrites), a arquitetura foi desenhada usando **HTTP Polling**.
  - **No Cliente (`CartDrawer.tsx`):** Após o pedido ser feito, o frontend faz um `fetch` periódico ao endpoint `/api/orders/{id}` a cada 3 segundos. Assim que o campo `paymentStatus` transita para `PAID`, o cliente é notificado do sucesso na mesma tela.
  - **No Admin (`admin/page.tsx`):** O painel do administrador faz um poll periódico da lista de pedidos pendentes. Se for detetado um pedido novo (contagem de pedidos aumentar), o frontend aciona um **alerta sonoro** (`campainha.mp3`). Por restrições de *Autoplay* dos browsers modernos, há um overlay inicial forçando o administrador a interagir ("Ativar Som e Entrar") para desbloquear o Audio Context.

- **Redirecionamento WhatsApp:**
  - Após a finalização bem-sucedida de um pedido e a exibição do popup de "Pagamento Confirmado", existe um fluxo para notificar a loja manualmente via WhatsApp.
  - O frontend formata todo o snapshot do carrinho, endereço de entrega e subtotal num texto URL-Encoded e redireciona o cliente para `wa.me/<numero_loja>`, abrindo diretamente a aplicação do WhatsApp com o resumo pronto para ser enviado.

## 6. Variáveis de Ambiente

> **Aviso de Segurança:** Nunca colocar os valores reais destas variáveis em ficheiros no repositório.

**Backend (`docker-compose.yml` / Ambiente da VPS):**
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SPRING_DATASOURCE_URL`
- `APP_BASEURL`
- `MERCADOPAGO_ACCESS_TOKEN`
- `JWT_SECRET`

**Frontend (Vercel ou `.env.local`):**
- `API_BASE_URL` (Apontando para o IP da VPS caso rodando local, mas na Vercel é o domínio proxy).
- Variáveis adicionais dependendo da infraestrutura de deploy do Next.

## 7. Comandos Frequentes

**Backend (VPS ou Local via Docker):**
- Iniciar os serviços em background e recriar as imagens de acordo com o código:
  ```bash
  docker compose up -d --build
  ```
- Visualizar os logs da API em tempo real:
  ```bash
  docker logs -f bairamburguer-api
  ```
- Desligar os serviços e apagar os containers:
  ```bash
  docker compose down
  ```

**Frontend (Local):**
- Instalar dependências:
  ```bash
  npm install
  ```
- Iniciar o servidor de desenvolvimento:
  ```bash
  npm run dev
  ```
- Build de produção:
  ```bash
  npm run build
  ```
