# Diagrama UML — Pipeline de procesamiento de órdenes (patrón Decorador)

Este diagrama modela las clases e interfaces definidas en `OrderPipeline.ts`.
Se respeta la nomenclatura UML:

- **Componente**: `OrderProcessor` (interfaz común a procesador base y decoradores).
- **Componente Concreto**: `BaseOrderProcessor` (implementación sin lógica adicional).
- **Decorador abstracto**: `OrderProcessorDecorator` (mantiene la referencia al componente envuelto).
- **Decoradores concretos**: `TaxDecorator`, `CouponDecorator`, `FraudDetectionDecorator`, `RateLimitDecorator`.
- **Servicios externos (dependencias inyectadas)**: `FraudService`, `CouponService`, `RateLimitStore`.
- **Errores personalizados**: `FraudRiskError`, `RateLimitExceededError`.

## Diagrama de clases

```mermaid
classDiagram
    direction LR

    %% =========================================================
    %%  Tipos de dominio
    %% =========================================================
    class OrderItem {
        <<interface>>
        +string sku
        +number quantity
        +number unitPriceUsd
    }

    class Order {
        <<interface>>
        +string orderId
        +string customerId
        +OrderItem[] items
        +string shippingCountry
        +string couponCode?
    }

    class ProcessedOrder {
        <<interface>>
        +string orderId
        +string customerId
        +OrderItem[] items
        +string shippingCountry
        +string couponCode?
        +number subtotalUsd
        +number discountUsd
        +number taxUsd
        +number totalUsd
        +number riskScore
        +string[] auditTrail
        +Date processedAt
    }

    Order "1" o-- "*" OrderItem : items
    ProcessedOrder "1" o-- "*" OrderItem : items

    %% =========================================================
    %%  Componente (patrón Decorador)
    %% =========================================================
    class OrderProcessor {
        <<interface>>
        +process(order : Order) Promise~ProcessedOrder~
    }

    %% =========================================================
    %%  Componente concreto
    %% =========================================================
    class BaseOrderProcessor {
        +process(order : Order) Promise~ProcessedOrder~
    }

    %% =========================================================
    %%  Decorador abstracto
    %% =========================================================
    class OrderProcessorDecorator {
        <<abstract>>
        #OrderProcessor wrappee
        +process(order : Order) Promise~ProcessedOrder~
        #decorate(order : Order, prev : ProcessedOrder)* Promise~ProcessedOrder~
    }

    %% =========================================================
    %%  Decoradores concretos
    %% =========================================================
    class TaxDecorator {
        -Record~string, number~ RATES$
        #decorate(order, prev) Promise~ProcessedOrder~
    }

    class CouponDecorator {
        -CouponService coupons
        #decorate(order, prev) Promise~ProcessedOrder~
    }

    class FraudDetectionDecorator {
        -FraudService fraud
        -number threshold
        #decorate(order, prev) Promise~ProcessedOrder~
    }

    class RateLimitDecorator {
        -RateLimitStore store
        -number limit
        -number windowMs
        #decorate(order, prev) Promise~ProcessedOrder~
    }

    %% =========================================================
    %%  Servicios externos (dependencias inyectadas)
    %% =========================================================
    class FraudService {
        <<interface>>
        +evaluate(order : Order) Promise~number~
    }

    class CouponService {
        <<interface>>
        +resolve(code : string, subtotalUsd : number) Promise~number~
    }

    class RateLimitStore {
        <<interface>>
        +count(customerId : string, windowMs : number) Promise~number~
        +register(customerId : string, windowMs : number) Promise~void~
    }

    %% =========================================================
    %%  Errores personalizados
    %% =========================================================
    class Error {
        <<builtin>>
        +string name
        +string message
    }

    class FraudRiskError {
        +string orderId
        +number riskScore
    }

    class RateLimitExceededError {
        +string customerId
        +number limit
        +number windowMs
    }

    Error <|-- FraudRiskError
    Error <|-- RateLimitExceededError

    %% =========================================================
    %%  Relaciones del patrón Decorador
    %% =========================================================
    OrderProcessor <|.. BaseOrderProcessor : realiza
    OrderProcessor <|.. OrderProcessorDecorator : realiza
    OrderProcessorDecorator o--> OrderProcessor : wrappee

    OrderProcessorDecorator <|-- TaxDecorator
    OrderProcessorDecorator <|-- CouponDecorator
    OrderProcessorDecorator <|-- FraudDetectionDecorator
    OrderProcessorDecorator <|-- RateLimitDecorator

    %% =========================================================
    %%  Dependencias (inyección en los decoradores concretos)
    %% =========================================================
    CouponDecorator ..> CouponService : usa
    FraudDetectionDecorator ..> FraudService : usa
    FraudDetectionDecorator ..> FraudRiskError : lanza
    RateLimitDecorator ..> RateLimitStore : usa
    RateLimitDecorator ..> RateLimitExceededError : lanza

    OrderProcessor ..> Order : consume
    OrderProcessor ..> ProcessedOrder : produce
```

## Diagrama de composición concreta (resultado del factory `buildOrderPipeline`)

El factory construye, de afuera hacia adentro, la siguiente cadena:

```
RateLimit → FraudDetection → Coupon → Tax → Base
```

```mermaid
flowchart LR
    RL["RateLimitDecorator"]
    FD["FraudDetectionDecorator"]
    CO["CouponDecorator"]
    TX["TaxDecorator"]
    BA["BaseOrderProcessor"]

    RL -- wrappee --> FD
    FD -- wrappee --> CO
    CO -- wrappee --> TX
    TX -- wrappee --> BA

    subgraph Servicios
        FS["FraudService"]
        CS["CouponService"]
        RS["RateLimitStore"]
    end

    RL -. usa .-> RS
    FD -. usa .-> FS
    CO -. usa .-> CS
```

## Diagrama de secuencia (flujo de una orden válida)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Cliente
    participant RL as RateLimitDecorator
    participant FD as FraudDetectionDecorator
    participant CO as CouponDecorator
    participant TX as TaxDecorator
    participant BA as BaseOrderProcessor
    participant RS as RateLimitStore
    participant FS as FraudService
    participant CS as CouponService

    Client->>RL: process(order)
    RL->>FD: process(order)
    FD->>CO: process(order)
    CO->>TX: process(order)
    TX->>BA: process(order)
    BA-->>TX: ProcessedOrder (subtotal, trail[BASE])
    TX-->>CO: ProcessedOrder (+taxUsd, trail[TAX])
    CO->>CS: resolve(code, subtotal)
    CS-->>CO: discount
    CO-->>FD: ProcessedOrder (+discount, trail[COUPON])
    FD->>FS: evaluate(order)
    FS-->>FD: score
    alt score >= threshold
        FD--xRL: throw FraudRiskError
    else score OK
        FD-->>RL: ProcessedOrder (+riskScore, trail[FRAUD])
    end
    RL->>RS: count(customerId, windowMs)
    RS-->>RL: current
    alt current >= limit
        RL--xClient: throw RateLimitExceededError
    else dentro del límite
        RL->>RS: register(customerId, windowMs)
        RL-->>Client: ProcessedOrder (trail[RATE_LIMIT])
    end
```

## Notas de diseño

- **OCP (Open/Closed)**: para añadir una nueva responsabilidad (p. ej. `LoyaltyPointsDecorator`, `GiftWrapDecorator`) basta con crear una nueva subclase de `OrderProcessorDecorator` y componerla en el factory; no se modifica ningún decorador existente.
- **Inmutabilidad**: la utilidad privada `patch` reconstruye siempre un `ProcessedOrder` nuevo; nunca se muta el objeto recibido.
- **Resiliencia vs. fallo fuerte**:
  - Resiliente: `CouponDecorator` (captura el error del servicio y continúa con `discountUsd = 0`, dejando traza).
  - Fallo fuerte: `FraudDetectionDecorator` lanza `FraudRiskError` si el score supera el umbral; `RateLimitDecorator` lanza `RateLimitExceededError` si se excede el límite.
- **Testeabilidad aislada**: cada decorador puede probarse usando un _stub_ del `OrderProcessor` envuelto y _mocks_ de los servicios externos (`FraudService`, `CouponService`, `RateLimitStore`), sin requerir el resto del pipeline.
- **Orden de composición** en `buildOrderPipeline`: externos → internos = `RateLimit → FraudDetection → Coupon → Tax → Base`. El efecto en tiempo de ejecución es que `Base` se ejecuta primero (cálculo de subtotal) y `RateLimit` envuelve todo el pipeline, bloqueando órdenes abusivas antes de devolver al cliente.
