import { isString, isBoolean, isNumber } from './util.type';

/**
 * 객체 파라미터를 Query Parameter 로 쓸 수 있게 문자열로 직렬화 한다.
 *
 * 내부 필드 값이 숫자 0이 아니고 비어 있다면 (empty string, null, undefined) 해당 필드는 무시한다.
 * @param params 쿼리 파라미터로 만들 객체
 * @param withQuestionMark 앞에 ? 를 붙이는지 여부. 기본 false.
 */
export function serializeParams(
  params: Record<string, any>,
  withQuestionMark = false,
) {
  const aParams: string[] = [];

  if (!params) {
    return '';
  }

  Object.keys(params).forEach((key) => {
    const value = params[key];
    let sValue: string;

    if (value !== 0 && !value) {
      return;
    }

    if (isString(value)) {
      sValue = encodeURIComponent(value);
    } else if (isBoolean(value)) {
      sValue = value === true ? 'true' : 'false';
    } else if (isNumber(value)) {
      sValue = value + '';
    } else {
      return;
    }

    aParams.push(`${key}=${sValue}`);
  });

  return (withQuestionMark ? '?' : '') + aParams.join('&');
}

/**
 * 특정 경로에 대하여 파일 다운로드를 수행 한다.
 * @param path 파일을 다운로드 받을 경로
 */
export function fileDownload(path: string) {
  window.location.href = path;
}

/**
 * 특정 경로에 대하여 새창을 열어 수행 한다.
 * @param url
 */
export function newWindow(url: string) {
  return window.open(url, '_blank');
}

/**
 * 특정 주소값에 쿼리 객체를 직렬화하여 붙여서 하나의 URL로 만든다.
 *
 * 만약 기본 주소 뒤에 이미 파라미터가 포함되어 있다면 단순히 그 뒤에 추가로 파라미터를 붙여준다.
 * @param href 기본 주소
 * @param query 추가할 쿼리 파라미터
 */
export function mergeUrlQuery(
  href?: string | null,
  query?: Record<string, any>,
) {
  if (!href || !isString(href)) {
    return '';
  }
  if (!query) {
    return href;
  }
  const sQuery = serializeParams(query);

  if (/\?/.test(href)) {
    return `${href}&${sQuery}`;
  }
  return `${href}?${sQuery}`;
}
