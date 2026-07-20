# Arquitectura de Secuencia de Pedidos — `OrderSequence`

## Descripción General

SATEM Food Engine implementa un generador transaccional de números de pedido atómico por sucursal y fecha de negocio (`businessDate`).

A diferencia de algoritmos convencionales que consultan la tabla de pedidos (`Orders`), el motor utiliza una entidad dedicada en PostgreSQL llamada `OrderSequence`.

---

## Modelo Prisma (`OrderSequence`)

```prisma
model OrderSequence {
  id           String   @id @default(cuid())
  locationId   String
  businessDate DateTime @db.Date
  lastNumber   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([locationId, businessDate])
  @@index([locationId])
  @@map("order_sequences")
}
```

---

## Algoritmo Transaccional Atómico (`PrismaOrderRepository.create`)

1. **Fecha de Negocio Pura (`@db.Date`)**:
   La fecha de negocio se calcula mediante la función pura `getPureBusinessDate(date)` que retorna la fecha normalizada en formato UTC medianoche (`YYYY-MM-DD 00:00:00.000Z`). Esto elimina cualquier interferencia de zona horaria o reloj del servidor.

2. **Operación `UPSERT` Incremental Atómica**:
   Dentro de una única transacción `db.$transaction`, se ejecuta:

   ```ts
   const sequence = await tx.orderSequence.upsert({
     where: {
       locationId_businessDate: {
         locationId,
         businessDate,
       },
     },
     update: {
       lastNumber: { increment: 1 },
     },
     create: {
       locationId,
       businessDate,
       lastNumber: 1,
     },
   })
   ```

3. **Formateo Comercial**:
   El entero devuelto se formatea como `#001`, `#002`, ..., `#999`, `#1000`.

4. **Persistencia del Pedido**:
   El pedido se crea dentro de la misma transacción garantizando que nunca se produzca un salto no deseado en caso de rollback.

---

## Propiedades de Seguridad

- **Immune a Concurrencia**: Múltiples tablets, kioscos, chatbots o llamadas a API REST simultáneas incrementan `lastNumber` de forma atómica en el motor PostgreSQL.
- **Sin Dependencia de `Orders`**: NUNCA se ejecuta `findFirst`, `MAX()` ni ordenamientos alfabéticos sobre la tabla de pedidos.
- **Cero Retries P2002**: Al no consultar pedidos ni depender de lecturas sucias en aislamiento _Read Committed_, no ocurren errores `P2002`.
- **Continuidad de Seed**: El script de seed inicializa `lastNumber = 8` para mantener la secuencia histórica `#SEED01...#SEED08`, asegurando que el primer pedido real del cliente comience en `#009`.
