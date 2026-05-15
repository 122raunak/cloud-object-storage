const CircuitBreaker = require("opossum")
const logger = require("./logger")

const defaultOptions = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
}

const createCircuitBreaker = (fn, name) => {
    const breaker = new CircuitBreaker(fn, defaultOptions)

    breaker.on("open", () =>
        logger.warn({ service: name }, "Circuit breaker opened — service unavailable")
    )
    breaker.on("halfOpen", () =>
        logger.info({ service: name }, "Circuit breaker half-open — retrying")
    )
    breaker.on("close", () =>
        logger.info({ service: name }, "Circuit breaker closed — service recovered")
    )
    breaker.on("fallback", () =>
        logger.warn({ service: name }, "Circuit breaker fallback triggered")
    )

    breaker.fallback(() => ({
        fallback: true,
        message: `${name} is currently unavailable`
    }))

    return breaker
}

module.exports = createCircuitBreaker