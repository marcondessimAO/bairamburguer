# CONTEXTO DE ARQUITETURA - BAIRAMBURGUER

## 1. Visão Geral e UI/UX
- **Aplicação:** Sistema de Delivery focado em automação e tempo real.
- **Identidade Visual:** Dark Mode Premium.
- **Paleta de Cores (Tailwind):** Verde Floresta (#1B4D3E), Amarelo Mostarda (#F1C40F), Dark Charcoal (#121212) e Branco (#FFFFFF).
- **Interface:** Mobile-first para o cliente, Dashboard em grid para o administrador.

## 2. Diagrama de Entidade e Relacionamento (DER) - PostgreSQL
O banco deve conter estritamente estas tabelas e relacionamentos:
- `users`: id (UUID PK), username (VARCHAR UNIQUE), password_hash (TEXT), role (VARCHAR).
- `categories`: id (SERIAL PK), name (VARCHAR), is_active (BOOLEAN).
- `products`: id (SERIAL PK), category_id (INT FK), name (VARCHAR), price (DECIMAL 10,2), is_available (BOOLEAN).
- `neighborhoods`: id (SERIAL PK), name (VARCHAR - Bairros de João Pessoa), delivery_fee (DECIMAL 10,2).
- `orders`: id (BIGSERIAL PK), neighborhood_id (INT FK), customer_name (VARCHAR), total_amount (DECIMAL 10,2), payment_status (VARCHAR PENDING/PAID), order_status (VARCHAR RCVD/PREP/DELV/DONE), created_at (TIMESTAMP).
- `payments`: id (SERIAL PK), order_id (BIGINT FK UNIQUE), transaction_id (VARCHAR), gateway_response (JSONB), status (VARCHAR).

## 3. Arquitetura de API e Integrações
**Stack:** Java 21 + Spring Boot (Backend) | Next.js + Tailwind (Frontend) | PostgreSQL (Database).
**Comunicação:**
- RESTful: Para CRUD de cardápio e gestão.
- Webhooks: Endpoint `POST /api/v1/webhooks/payment` para ouvir o gateway de pagamento (Pix) e atualizar o `payment_status` para 'PAID'.
- WebSockets: Endpoint `WS /api/v1/ws/dashboard` para disparar notificação em tempo real (alerta sonoro) para a cozinha assim que o pagamento for confirmado.
- Segurança: Acesso administrativo protegido via Spring Security e JWT.

## 4. Regras de Negócio Críticas
- O frete deve ser calculado baseado na tabela `neighborhoods` atrelada ao pedido.
- O alerta para a cozinha SÓ PODE ser disparado após o pagamento estar com status 'PAID'.
- Ao finalizar a confirmação de sucesso, o cliente deve ser redirecionado para a API do WhatsApp com o resumo do pedido.