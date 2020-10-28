/**
 * 특정 값이 문자열인지 확인한다.
 * @param values 확인하고 싶은 값
 */
export function isString(values: unknown): values is string {
  return typeof values === "string";
}

/**
 * 특정 값이 숫자형인지 확인한다.
 *
 * 숫자여도 무한(Infinite) 이거나 NaN 일경우 false 를 반환한다.
 * @param values 확인하고 싶은 값
 */
export function isNumber(values: unknown): values is number {
  return typeof values === "number" && !isNaN(values) && isFinite(values);
}

/**
 * 특정 값이 불리언인지 확인한다.
 * @param values 확인하고 싶은 값
 */
export function isBoolean(values: unknown): values is boolean {
  return typeof values === "boolean";
}
