import React, {
  ComponentType,
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { isServer } from '../util';

interface IntersectionEventProps {
  /**
   * 현재 컴포넌트가 View Port 에 들어오면 발생되는 이벤트.
   *
   * 한번만 발동 된다.
   */
  onVisible?: () => void;
}

/**
 * 컴포넌트에 단발성 Intersection을 발생시키는 이벤트를 제공한다.
 *
 * intersection 이란 화면 영역 (View Port) 안으로 지정된 객체가 들어오면 발생되는 기능을 말한다.
 *
 * 단발성 이기 때문에 한번 발생되고 나면 자동으로 연결을 끊어버리고 두번다시 이벤트를 발동 시키지 않는다.
 *
 * 참고: https://heropy.blog/2019/10/27/intersection-observer/
 * @example
 *
 * // hoc 적용 할 컴포넌트. 아래와 같이 styled 를 이용하거나 forwardRef 를 통해 ref 참조가 가능한 컴포넌트여야 한다.
 * const StyledSection = styled.section` ..codes `;
 *
 * // currying 으로 함수를 두번 수행한다. 처음 함수는 옵션용, 두번째는 주입용이다.
 * const DecoratedSection = withIntersection({
 *   rootMargin: '40px',
 *   threshold: 0.3,
 * })(StyledSection);
 *
 * // 옵션이 없는 경우 예시.
 * const DecoratedSection = withIntersection()(StyledSection);
 *
 * // 실 사용 예시
 * const Execution: FC = () => {
 *   const handleVisible = () => {
 *     console.log('나 화면에 보이죠?! +_+');
 *   };
 *   return (
 *     <DecoratedSection onVisible={handleVisible}>
 *       <SomeChildList />
 *     </DecoratedSection>
 *   );
 * }
 *
 * @param option (optional) Intersection 생성 옵션. 많이 쓰이는건 rootMargin, threshold 가 있다. https://developer.mozilla.org/ko/docs/Web/API/IntersectionObserver/IntersectionObserver
 * @param Comp 이벤트를 일으키고 싶은 컴포넌트. ref 참조가 가능해야 한다. (ex: styled 로만 만들어진 컴포넌트, forwardRef 가 쓰여진 컴포넌트)
 */
export function withIntersection(option?: IntersectionObserverInit) {
  return function <P>(
    Comp: ComponentType<P>,
  ): ComponentType<P & IntersectionEventProps> {
    if (isServer()) {
      return Comp;
    }

    const ReturnComp: FC<P & IntersectionEventProps> = (props) => {
      const onVisible = props.onVisible;
      const [vis, setVis] = useState(false);
      const ref = useRef<HTMLElement>(null);
      const handleIntersecting = useCallback(
        (entries: IntersectionObserverEntry[]) => {
          if (
            !onVisible ||
            vis ||
            entries.length === 0 ||
            !entries[0].isIntersecting
          ) {
            return;
          }

          onVisible();
          setVis(true);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          inter.current.disconnect();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
      );
      const inter = useRef<IntersectionObserver>(
        new IntersectionObserver(handleIntersecting, option),
      );

      useEffect(() => {
        if (ref.current) {
          inter.current.observe(ref.current);
        }
        return () => {
          if (inter.current) {
            try {
              // eslint-disable-next-line react-hooks/exhaustive-deps
              inter.current.disconnect();
            } catch (error) {
              //
            }
          }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <Comp {...props} ref={ref} />;
    };

    return memo(ReturnComp);
  };
}
