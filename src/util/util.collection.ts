import { isBoolean, isNumber, isString } from './util.type';

/**
 * 두 쿼리 파라미터 객체에 대하여 병합 한다.
 *
 * 이전 값을 베이스로 하되 새로운 객체에 있는 값을 덮어씌운다 (overwrite)
 *
 * 단, 새 객체의 값이 비어 있거나 문자열이 아닐 경우 무시한다.
 * @param prevQuery 베이스 객체
 * @param newQuery 필드를 변경 할 객체
 * @returns {object} 병합된 객체
 */
export function mergeQuries<
  T extends Record<string, any>,
  N extends Record<string, any>
>(prevQuery?: T, newQuery?: N): T {
  const mRet: Record<string, string> = { ...prevQuery };

  if (!newQuery) {
    return mRet as T;
  }

  return Object.keys(newQuery).reduce((acc, key) => {
    const newValue = newQuery[key] as string;

    if (newValue && isString(newValue)) {
      acc[key] = newValue;
    }

    return acc;
  }, mRet) as T;
}

/**
 * 들어온 객체의 필드들의 타입을 문자열(string)로 변환하고 새로운 객체를 반환한다.
 *
 * 변환가능한 타입은 다음과 같으며 그 이외의 타입들은 모두 무시된다.
 * - string (빈 문자열 가능)
 * - number (NaN, Infinity 무시)
 * - boolean (true -> 'true', false -> '')
 * @param src 변환 할 객체
 * @returns {object} 변환된 새 객체
 */
export function toStringField<
  T extends Record<string, any>,
  R = Record<keyof T, string>
>(src?: T): R {
  const mRet: Record<string, string> = {};

  if (!src) {
    return (mRet as unknown) as R;
  }

  return (Object.keys(src).reduce((acc, key) => {
    const val = src[key] as unknown;
    if (isString(val)) {
      acc[key] = val;
    } else if (isNumber(val)) {
      acc[key] = val.toString();
    } else if (isBoolean(val)) {
      acc[key] = val === true ? 'true' : '';
    }
    return acc;
  }, mRet) as unknown) as R;
}
