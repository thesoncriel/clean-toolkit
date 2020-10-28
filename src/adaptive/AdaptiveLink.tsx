import React, { FC } from 'react';
import { Link, LinkProps } from 'react-router-dom';

import { getNativeAppService, isNativeApp } from '../../services';
import { isDeepLink, mergeUrlQuery } from '../../util';

// FIXME: 앱 스키마 설정 기능 추가 필요

interface Props extends Partial<LinkProps> {
  /**
   * 인앱 환경일 때 deep-link 를 수행하고 싶다면 설정한다.
   *
   * 만약 주소 접두어가 `todoapp://` 혹은 `todoapp-web://` 이 아니라면 인앱 새창으로 동작된다.
   *
   * 새창 모드일 때 appTarget props 에 지정된 값을 넣으면 관련 기능으로 동작 된다.
   *
   * 일반 웹 환경이면 설정 내용은 무시 된다.
   */
  appHref?: string;
  /**
   * 웹뷰 새창을 열 때 적용 할 제목.
   *
   * 일반적인 DOM 의 title 역할은 하지 않는다.
   */
  title?: string;
  /**
   * appHref 이용 시 쿼리 파라미터로 사용하기 위한 객체.
   *
   * 파라미터가 객체 형태가 아니라면 단순히 appHref 주소 뒤에 파라미터를 붙여도 된다.
   */
  query?: Record<string, any>;
}

/**
 * 적응형 링크를 렌더링한다.
 *
 * 여기서의 적응형이란 네이티브앱 환경과 웹브라우저 환경에 대한 자동 렌더링 상황을 말한다.
 *
 * 사용되는 주요 속성은 다음과 같다. 아래로 갈 수록 우선순위가 낮다.
 * - appHref - 인앱 deep-link 용. 현재 화면에서 다른 앱 화면을 호출하며 네이티브앱 환경에서만 유효하다.
 *   - `todoapp://` 로 시작하는 주소라면 딥링크로, 그 외는 앱내 새창을 열기위한 주소로 인식된다.
 * - to - react-router-dom 의 Link 컴포넌트의 것과 동일. 기본 웹환경에서만 쓰이나 appHref 미설정 시 어디서든 사용된다.
 * - href - a 태그에 쓰이는 하이퍼링크 주소. 기본 웹환경에서만 쓰이나 to, appHref 설정이 안되어 있다면, 어디서든 쓰이게 된다.
 * - onClick - 인앱 환경이 아닐 때는 버튼처럼 동작이 필요하다면 지정한다. to, href 가 지정되어 있지 않아야 한다.
 *
 * ## 주의
 *
 * `react-router-dom` - Link 컴포넌트의 속성인 replace, innerRef 및 component 속성(props)은 `to`가 사용되는 웹브라우저 환경에서만 유효하다.
 *
 * @example
 * // react-router 와 deep-link 를 함께 쓸 때 예시
 * const Section: FC = () => {
 *   return (
 *     <div>
 *       <AdaptiveLink
 *         to="/goods/1234"
 *         appHref="todoapp://goods/1234"
 *       />
 *         Go To Anywhere~
 *       </AdaptiveLink>
 *     </div>
 *   );
 * };
 * * // 일반 href 와 인앱 새창열기를 함께 쓸 때 예시
 * const Section: FC = () => {
 *   return (
 *     <div>
 *       <AdaptiveLink
 *         href="https://www.google.com"
 *         appHref="/search/filter"
 *       />
 *         Go To Anywhere~
 *       </AdaptiveLink>
 *     </div>
 *   );
 * };
 *
 * @see https://reactrouter.com/web/api/Link
 *
 */
export const AdaptiveLink: FC<Props> = ({
  href,
  appHref,
  to,
  replace,
  innerRef,
  component,
  title,
  query,
  children,
  onClick,
  ...props
}) => {
  const isNative = isNativeApp();

  const handleAppNewHrefClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (!appHref) {
      return;
    }
    e.preventDefault();
    const service = getNativeAppService();

    service.openNewWebview(mergeUrlQuery(appHref, query), title);
  };

  if (isNative && appHref) {
    const isAvail = isDeepLink(appHref);

    if (!isAvail && appHref) {
      return (
        <a href="" onClick={handleAppNewHrefClick} {...props}>
          {children}
        </a>
      );
    } else if (isAvail) {
      return (
        <a href={mergeUrlQuery(appHref, query)} {...props}>
          {children}
        </a>
      );
    }
  }

  if (to) {
    return (
      <Link
        component={component}
        innerRef={innerRef}
        replace={replace}
        to={to}
        {...props}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={mergeUrlQuery(href, query)} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href="" onClick={onClick} {...props}>
      {children}
    </a>
  );
};
