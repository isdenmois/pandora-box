type SortFn<T> = (object: T) => string | number | boolean

export const compare = <T>(fn: SortFn<T>, fn2?: SortFn<T> | null, fn3?: SortFn<T> | null, asc: number = 1) => {
  return (a: T, b: T) => {
    let x = fn(a)
    let y = fn(b)

    if (fn2 && x === y) {
      x = fn2(a)
      y = fn2(b)
    }

    if (fn3 && x === y) {
      x = fn3(a)
      y = fn3(b)
    }

    if (x < y) {
      return -1 * asc
    }

    if (x > y) {
      return 1 * asc
    }

    return 0
  }
}
