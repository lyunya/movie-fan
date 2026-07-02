/* eslint-disable @typescript-eslint/no-explicit-any */
type Debounced<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void }

const debounce = <T extends (...args: any[]) => ReturnType<T>>(
  callback: T,
  timeout: number
): Debounced<T> => {
  let timer: ReturnType<typeof setTimeout>

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      callback(...args)
    }, timeout)
  }
  debounced.cancel = () => clearTimeout(timer)

  return debounced
}
export default debounce
