type EventFn = (event: Event, ...args: unknown[]) => void
/**
 * Substitute for the `preventDefault` event modifier
 */
export function preventDefault(fn: EventFn): EventFn {
  return function (...args) {
    args[0].preventDefault()
    // @ts-ignore
    return fn?.apply(this, args)
  }
}
