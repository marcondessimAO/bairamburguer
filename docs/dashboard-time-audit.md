# Auditoria de métricas e contrato temporal

## Contrato adotado

- O timezone da loja é `America/Recife`.
- As colunas históricas `TIMESTAMP WITHOUT TIME ZONE` continuam representando horário civil da loja. Nenhum dado existente é convertido.
- Toda nova escrita usa um `Clock` de `America/Recife`.
- A API transporta timestamps em ISO-8601 com offset explícito, por exemplo `2026-08-09T00:30:00-03:00`.
- O frontend aceita temporariamente o `LocalDateTime` legado sem offset como horário da loja e sempre exibe em `America/Recife`.
- Não existe ajuste manual de três horas.

O modelo atual não possui `dispatchedAt`, `deliveredAt` ou `cancelledAt`. As transições desses estados atualizam apenas `orderStatus`. Os timestamps reais de pedido são `createdAt`, `productionStartedAt`, `readyAt` e `paymentConfirmedAt`; `Addon` possui `createdAt`/`updatedAt` e `StoreSettings` possui `updatedAt`.

## Matriz das métricas

| Métrica | Origem | Período | Pagamento | Status | Agrupamento/duplicidade | Timezone |
|---|---|---|---|---|---|---|
| Faturamento | `orders.total_amount` | `created_at >= início` e `< dia seguinte` | somente `PAID` | exclui `CANCELED`/`CANCELLED` | uma linha por pedido | Recife |
| Pedidos no período | `orders.id` | mesmo intervalo por `created_at` | todos | todos | `COUNT(DISTINCT id)` | Recife |
| Pedidos pagos | `orders.id` | mesmo intervalo por `created_at` | somente `PAID` | exclui cancelados | `COUNT(id)` sem `JOIN` | Recife |
| Ticket médio | faturamento / pedidos pagos | mesmo intervalo | somente `PAID` | exclui cancelados | divisor é a contagem paga | Recife |
| Comparação | mesmas consultas no intervalo imediatamente anterior de igual duração | limites exclusivos | regra da métrica comparada | regra da métrica comparada | sem sobreposição entre períodos | Recife |
| Pedidos por status | `orders.order_status` | mesmo intervalo por `created_at` | todos | normaliza aliases históricos | `COUNT(DISTINCT id)`; soma `CANCELED` + `CANCELLED` | Recife |
| Evolução de vendas | `orders` | mesmo intervalo por `created_at` | somente `PAID` | exclui cancelados | hora para um dia; dia para períodos maiores | Recife |
| Ranking de produtos | `order_items` + `orders` | mesmo intervalo por `orders.created_at` | somente `PAID` | exclui cancelados | agrega por nome congelado do produto | Recife |
| Tempo médio de preparo | `production_started_at` até `ready_at` | pedidos criados no mesmo intervalo global | todos com transições válidas | qualquer status | uma amostra por pedido, sem duração negativa | Recife |

## Diagnóstico PostgreSQL somente leitura

As consultas abaixo podem ser executadas em produção por um operador com acesso somente leitura. Elas não foram executadas neste workspace porque não há container ou credencial do banco Bairam configurados.

```sql
SHOW TIMEZONE;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('orders', 'addons', 'store_settings')
  AND (column_name LIKE '%_at' OR column_name IN ('created_at', 'updated_at'))
ORDER BY table_name, ordinal_position;

-- Substituir os dois limites por horários civis de America/Recife.
WITH period_orders AS (
  SELECT id, payment_status, UPPER(order_status) AS order_status, total_amount, created_at
  FROM orders
  WHERE created_at >= TIMESTAMP '2026-08-01 00:00:00'
    AND created_at <  TIMESTAMP '2026-08-08 00:00:00'
)
SELECT
  COUNT(DISTINCT id) AS total_orders,
  COUNT(DISTINCT id) FILTER (
    WHERE payment_status = 'PAID'
      AND order_status NOT IN ('CANCELED', 'CANCELLED')
  ) AS paid_orders,
  COALESCE(SUM(total_amount) FILTER (
    WHERE payment_status = 'PAID'
      AND order_status NOT IN ('CANCELED', 'CANCELLED')
  ), 0) AS revenue
FROM period_orders;

SELECT CASE
         WHEN UPPER(order_status) IN ('RCVD', 'PENDING') THEN 'PENDING'
         WHEN UPPER(order_status) IN ('IN_PRODUCTION', 'PREPARING') THEN 'PREPARING'
         WHEN UPPER(order_status) IN ('CANCELED', 'CANCELLED') THEN 'CANCELED'
         ELSE UPPER(order_status)
       END AS canonical_status,
       COUNT(DISTINCT id)
FROM orders
WHERE created_at >= TIMESTAMP '2026-08-01 00:00:00'
  AND created_at <  TIMESTAMP '2026-08-08 00:00:00'
GROUP BY 1
ORDER BY 1;
```
