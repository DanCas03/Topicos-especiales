/**
 * =============================================================================
 *  Pipeline de procesamiento de órdenes (e-commerce)
 *  Patrón: DECORATOR
 *  Cumple OCP (Open/Closed Principle): nuevas responsabilidades se añaden
 *  creando nuevos decoradores, sin modificar los existentes.
 * =============================================================================
 */

/* -----------------------------------------------------------------------------
 * 1. Tipos / Interfaces del dominio (los "tres tipos o interfaces" del enunciado)
 * ---------------------------------------------------------------------------*/

/** Ítem de una orden. */
export interface OrderItem {
    readonly sku: string;
    readonly quantity: number;
    readonly unitPriceUsd: number;
}

/** Orden de entrada. El objeto se trata como inmutable. */
export interface Order {
    readonly orderId: string;
    readonly customerId: string;
    readonly items: ReadonlyArray<OrderItem>;
    readonly shippingCountry: string; // ISO-3166 alpha-2 (US, MX, DE, ...)
    readonly couponCode?: string;
}

/** Resultado producido por el pipeline tras todos los decoradores. */
export interface ProcessedOrder {
    readonly orderId: string;
    readonly customerId: string;
    readonly items: ReadonlyArray<OrderItem>;
    readonly shippingCountry: string;
    readonly couponCode?: string;

    readonly subtotalUsd: number;
    readonly discountUsd: number;
    readonly taxUsd: number;
    readonly totalUsd: number;
    readonly riskScore: number;

    readonly auditTrail: ReadonlyArray<string>;
    readonly processedAt: Date;
}

/** Contrato común. Todo procesador/decorador lo implementa. */
export interface OrderProcessor {
    process(order: Order): Promise<ProcessedOrder>;
}

/* -----------------------------------------------------------------------------
 * 2. Errores personalizados
 * ---------------------------------------------------------------------------*/

export class FraudRiskError extends Error {
    public readonly orderId: string;
    public readonly riskScore: number;
    constructor(orderId: string, riskScore: number) {
        super(`La orden ${orderId} fue rechazada por riesgo de fraude (score=${riskScore}).`);
        this.name = "FraudRiskError";
        this.orderId = orderId;
        this.riskScore = riskScore;
    }
}

export class RateLimitExceededError extends Error {
    public readonly customerId: string;
    public readonly limit: number;
    public readonly windowMs: number;
    constructor(customerId: string, limit: number, windowMs: number) {
        super(
            `El cliente ${customerId} superó el límite de ${limit} pedidos ` +
                `en una ventana de ${windowMs} ms.`
        );
        this.name = "RateLimitExceededError";
        this.customerId = customerId;
        this.limit = limit;
        this.windowMs = windowMs;
    }
}

/* -----------------------------------------------------------------------------
 * 3. Interfaces de dependencias externas (servicios inyectables)
 * ---------------------------------------------------------------------------*/

export interface FraudService {
    /** Devuelve un score de riesgo entre 0 y 100 para una orden. */
    evaluate(order: Order): Promise<number>;
}

export interface CouponService {
    /**
     * Resuelve el valor (en USD) del cupón aplicable al subtotal indicado.
     * Puede fallar (servicio inestable).
     */
    resolve(couponCode: string, subtotalUsd: number): Promise<number>;
}

export interface RateLimitStore {
    /** Cantidad de pedidos del cliente dentro de la ventana actual. */
    count(customerId: string, windowMs: number): Promise<number>;
    /** Registra un nuevo pedido del cliente en la ventana actual. */
    register(customerId: string, windowMs: number): Promise<void>;
}

/* -----------------------------------------------------------------------------
 * 4. Utilidades internas (inmutabilidad)
 * ---------------------------------------------------------------------------*/

/**
 * Construye un nuevo ProcessedOrder a partir de uno previo aplicando un parche
 * parcial y (opcionalmente) anexando entradas al auditTrail. Nunca muta nada.
 */
function patch(
    prev: ProcessedOrder,
    changes: Partial<Omit<ProcessedOrder, "auditTrail">>,
    audit?: string | string[]
): ProcessedOrder {
    const newTrail = audit
        ? [...prev.auditTrail, ...(Array.isArray(audit) ? audit : [audit])]
        : prev.auditTrail;

    const merged: ProcessedOrder = {
        ...prev,
        ...changes,
        auditTrail: newTrail,
    };

    // Recalcular total para mantenerlo consistente en cada paso.
    const total = merged.subtotalUsd - merged.discountUsd + merged.taxUsd;
    return { ...merged, totalUsd: total };
}

/* -----------------------------------------------------------------------------
 * 5. Procesador base (BaseOrderProcessor)
 * ---------------------------------------------------------------------------*/

/**
 * BaseOrderProcessor: calcula subtotalUsd e inicializa los campos acumulables.
 * No aplica lógica adicional.
 */
export class BaseOrderProcessor implements OrderProcessor {
    async process(order: Order): Promise<ProcessedOrder> {
        const subtotalUsd = order.items.reduce(
            (acc, it) => acc + it.quantity * it.unitPriceUsd,
            0
        );

        const processedAt = new Date();
        const auditTrail: string[] = [
            `[BASE] subtotalUsd=${subtotalUsd.toFixed(2)} ` +
                `items=${order.items.length} ` +
                `orderId=${order.orderId} ` +
                `at=${processedAt.toISOString()}`,
        ];

        return {
            orderId: order.orderId,
            customerId: order.customerId,
            items: order.items,
            shippingCountry: order.shippingCountry,
            couponCode: order.couponCode,

            subtotalUsd,
            discountUsd: 0,
            taxUsd: 0,
            totalUsd: subtotalUsd,
            riskScore: 0,

            auditTrail,
            processedAt,
        };
    }
}

/* -----------------------------------------------------------------------------
 * 6. Decorador abstracto
 * ---------------------------------------------------------------------------*/

/**
 * Decorador base. Delega en el procesador envuelto y deja que las subclases
 * apliquen su enriquecimiento sobre el resultado.
 */
export abstract class OrderProcessorDecorator implements OrderProcessor {
    protected readonly wrappee: OrderProcessor;

    constructor(wrappee: OrderProcessor) {
        this.wrappee = wrappee;
    }

    /** Equivalente a super.process() del enunciado. */
    async process(order: Order): Promise<ProcessedOrder> {
        const prev = await this.wrappee.process(order);
        return this.decorate(order, prev);
    }

    /** Cada decorador concreto implementa su lógica sobre el resultado previo. */
    protected abstract decorate(
        order: Order,
        prev: ProcessedOrder
    ): Promise<ProcessedOrder>;
}

/* -----------------------------------------------------------------------------
 * 7. Decoradores concretos
 * ---------------------------------------------------------------------------*/

/**
 * TaxDecorator — Falla fuerte si el país es desconocido? NO: política = 0 %.
 * Aplica porcentaje según país sobre (subtotal - descuento).
 */
export class TaxDecorator extends OrderProcessorDecorator {
    private static readonly RATES: Readonly<Record<string, number>> = {
        US: 0.0825,
        MX: 0.16,
        DE: 0.19,
    };

    protected async decorate(
        _order: Order,
        prev: ProcessedOrder
    ): Promise<ProcessedOrder> {
        const rate = TaxDecorator.RATES[prev.shippingCountry] ?? 0;
        const base = prev.subtotalUsd - prev.discountUsd;
        const taxUsd = +(base * rate).toFixed(2);

        return patch(
            prev,
            { taxUsd },
            `[TAX] country=${prev.shippingCountry} rate=${(rate * 100).toFixed(2)}% ` +
                `base=${base.toFixed(2)} taxUsd=${taxUsd.toFixed(2)}`
        );
    }
}

/**
 * CouponDecorator — Resiliente. Si el CouponService falla, el pedido continúa
 * con descuento 0 y se registra el fallo en el auditTrail.
 * Los descuentos son acumulativos: se suman a los ya presentes en prev.
 */
export class CouponDecorator extends OrderProcessorDecorator {
    private readonly coupons: CouponService;

    constructor(wrappee: OrderProcessor, coupons: CouponService) {
        super(wrappee);
        this.coupons = coupons;
    }

    protected async decorate(
        order: Order,
        prev: ProcessedOrder
    ): Promise<ProcessedOrder> {
        if (!order.couponCode) {
            return patch(prev, {}, `[COUPON] sin cupón en la orden`);
        }

        try {
            const discount = await this.coupons.resolve(
                order.couponCode,
                prev.subtotalUsd
            );
            const safeDiscount = Math.max(0, Math.min(discount, prev.subtotalUsd));
            return patch(
                prev,
                { discountUsd: prev.discountUsd + safeDiscount },
                `[COUPON] code=${order.couponCode} ` +
                    `discountUsd+=${safeDiscount.toFixed(2)}`
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return patch(
                prev,
                {},
                `[COUPON] FALLBACK: servicio de cupones falló (${msg}). ` +
                    `Se continúa con discountUsd=${prev.discountUsd.toFixed(2)}.`
            );
        }
    }
}

/**
 * FraudDetectionDecorator — Falla fuerte. Si riskScore >= 75 lanza FraudRiskError.
 */
export class FraudDetectionDecorator extends OrderProcessorDecorator {
    private readonly fraud: FraudService;
    private readonly threshold: number;

    constructor(wrappee: OrderProcessor, fraud: FraudService, threshold = 75) {
        super(wrappee);
        this.fraud = fraud;
        this.threshold = threshold;
    }

    protected async decorate(
        order: Order,
        prev: ProcessedOrder
    ): Promise<ProcessedOrder> {
        const riskScore = await this.fraud.evaluate(order);

        const withScore = patch(
            prev,
            { riskScore },
            `[FRAUD] riskScore=${riskScore} threshold=${this.threshold}`
        );

        if (riskScore >= this.threshold) {
            throw new FraudRiskError(order.orderId, riskScore);
        }
        return withScore;
    }
}

/**
 * RateLimitDecorator — Falla fuerte. Si el cliente supera el límite en la
 * ventana configurada, lanza RateLimitExceededError. Registra el pedido tras
 * validar (para no bloquear al cliente en reintentos fallidos).
 */
export class RateLimitDecorator extends OrderProcessorDecorator {
    private readonly store: RateLimitStore;
    private readonly limit: number;
    private readonly windowMs: number;

    constructor(
        wrappee: OrderProcessor,
        store: RateLimitStore,
        limit: number,
        windowMs: number
    ) {
        super(wrappee);
        this.store = store;
        this.limit = limit;
        this.windowMs = windowMs;
    }

    protected async decorate(
        order: Order,
        prev: ProcessedOrder
    ): Promise<ProcessedOrder> {
        const current = await this.store.count(order.customerId, this.windowMs);

        if (current >= this.limit) {
            throw new RateLimitExceededError(
                order.customerId,
                this.limit,
                this.windowMs
            );
        }

        await this.store.register(order.customerId, this.windowMs);

        return patch(
            prev,
            {},
            `[RATE_LIMIT] customerId=${order.customerId} ` +
                `count=${current + 1}/${this.limit} windowMs=${this.windowMs}`
        );
    }
}

/* -----------------------------------------------------------------------------
 * 8. Factory: composición del pipeline
 * ---------------------------------------------------------------------------*/

export interface BuildOrderPipelineDeps {
    fraudService: FraudService;
    couponService: CouponService;
    rateLimitStore: RateLimitStore;
    rateLimit: {
        limit: number;
        windowMs: number;
    };
    fraudThreshold?: number;
}

/**
 * Compone el pipeline en el orden pedido:
 *
 *   RateLimit → FraudDetection → Coupon → Tax → Base
 *
 * Es decir, al invocar process() se ejecuta primero Base (el más interno) y
 * las responsabilidades externas (RateLimit) terminan de ejecutarse al final
 * del desenrollado, lo que coincide con el orden de decoración pedido.
 *
 * Nota: el orden de "wrapping" se escribe de adentro hacia afuera.
 */
export function buildOrderPipeline(deps: BuildOrderPipelineDeps): OrderProcessor {
    const base: OrderProcessor = new BaseOrderProcessor();
    const withTax = new TaxDecorator(base);
    const withCoupon = new CouponDecorator(withTax, deps.couponService);
    const withFraud = new FraudDetectionDecorator(
        withCoupon,
        deps.fraudService,
        deps.fraudThreshold ?? 75
    );
    const withRateLimit = new RateLimitDecorator(
        withFraud,
        deps.rateLimitStore,
        deps.rateLimit.limit,
        deps.rateLimit.windowMs
    );
    return withRateLimit;
}

/* -----------------------------------------------------------------------------
 * 9. Ejemplo ejecutable (implementaciones in-memory de las dependencias)
 *    Ejecutar con:  bun run OrderPipeline.ts
 * ---------------------------------------------------------------------------*/

class InMemoryRateLimitStore implements RateLimitStore {
    private readonly hits = new Map<string, number[]>();

    async count(customerId: string, windowMs: number): Promise<number> {
        const now = Date.now();
        const arr = (this.hits.get(customerId) ?? []).filter(
            (t) => now - t < windowMs
        );
        this.hits.set(customerId, arr);
        return arr.length;
    }

    async register(customerId: string, _windowMs: number): Promise<void> {
        const arr = this.hits.get(customerId) ?? [];
        arr.push(Date.now());
        this.hits.set(customerId, arr);
    }
}

class StubFraudService implements FraudService {
    constructor(private readonly score: number) {}
    async evaluate(_order: Order): Promise<number> {
        return this.score;
    }
}

class FlakyCouponService implements CouponService {
    constructor(
        private readonly fail: boolean,
        private readonly amountUsd: number
    ) {}
    async resolve(_code: string, _subtotalUsd: number): Promise<number> {
        if (this.fail) throw new Error("CouponService timeout");
        return this.amountUsd;
    }
}

async function demo() {
    const pipeline = buildOrderPipeline({
        fraudService: new StubFraudService(40),
        couponService: new FlakyCouponService(false, 15),
        rateLimitStore: new InMemoryRateLimitStore(),
        rateLimit: { limit: 3, windowMs: 60_000 },
    });

    const order: Order = {
        orderId: "ORD-001",
        customerId: "CUST-42",
        shippingCountry: "MX",
        couponCode: "WELCOME15",
        items: [
            { sku: "A", quantity: 2, unitPriceUsd: 50 },
            { sku: "B", quantity: 1, unitPriceUsd: 30 },
        ],
    };

    const result = await pipeline.process(order);
    console.log("Resultado:", result);
    console.log("\nAudit trail:");
    for (const line of result.auditTrail) console.log("  -", line);
}

// Ejecutar la demo sólo si se invoca el archivo directamente (Bun/Node).
// @ts-ignore - import.meta.main existe en Bun.
if (typeof import.meta !== "undefined" && (import.meta as any).main) {
    demo().catch((e) => {
        console.error("Pipeline falló:", e);
    });
}
