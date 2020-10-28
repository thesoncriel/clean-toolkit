import React, { ComponentType, FC, ReactNode } from 'react';
import { cn } from '../util';

import appConfig from '../app.config';
import {
  CustomTrackingMapper,
  GTMTrackingSettings,
  TrackingProps,
} from '../models';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

function getClassName<P extends TrackingProps>(
  props: P,
  settings: GTMTrackingSettings<P>,
) {
  let additionalClassName = '';
  if (settings.className) {
    if (typeof settings.className === 'function') {
      additionalClassName = settings.className(props);
    } else {
      additionalClassName = settings.className;
    }
  }

  return cn(props.className, additionalClassName);
}

function getId<P extends TrackingProps>(
  props: P,
  settings: GTMTrackingSettings<P>,
) {
  if (settings.id) {
    if (props.id) {
      if (appConfig.development) {
        // eslint-disable-next-line no-console
        console.warn(`withTracking: ID (${props.id}) value is ignored.`);
      }
    }
    if (typeof settings.id === 'function') {
      return settings.id(props);
    } else {
      return settings.id;
    }
  } else {
    return props.id || '';
  }
}

function getDataAttributes<P extends TrackingProps>(
  props: P,
  settings: GTMTrackingSettings<P>,
): Record<string, string | number> {
  const mRet: Record<string, string | number> = {};
  if (!settings.data) {
    return mRet;
  }
  return Object.keys(settings.data).reduce((acc, key) => {
    if (!settings.data) {
      return acc;
    }
    const item = settings.data[key];

    if (!item) {
      return acc;
    }
    if (typeof item === 'function') {
      acc[`data-${key}`] = item(props);
    } else {
      acc[`data-${key}`] = item;
    }

    return acc;
  }, mRet);
}

function getWhen<P extends TrackingProps>(
  props: P,
  settings: GTMTrackingSettings<P>,
): CustomTrackingMapper | null {
  if (!settings.when) {
    return null;
  }
  let eventName = '';

  // TODO: 이 후 이벤트가 많아지면 Object.keys 로 돌리는 방법으로 바꿀 것
  if (!settings.when.flick) {
    return null;
  }

  if (typeof settings.when.flick === 'function') {
    eventName = settings.when.flick(props).toString();
  } else {
    eventName = settings.when.flick.toString();
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flick: () => {
      window.dataLayer.push({
        event: eventName,
      });
    },
  };
}

/**
 * 컴포넌트에 이벤트 트래킹 기능을 덧붙인다.
 *
 * 트래킹 가능한 벤더
 * - GTM
 *
 * @example
 *
 * // 컴포넌트의 Props 는 반드시 TrackingProps 기반이어야 한다.
 * interface Props extends TrackingProps {
 *   name: string;
 *   index: number;
 * }
 *
 * // 컴포넌트 선언
 * const TargetComponent: FC<Props> = ({ name, children, ...props }) => {
 *   return (
 *     <article {...props}>
 *       my name is: {name}<br />
 *       {children}
 *     </article>
 *   );
 * };
 *
 * // HOC 사용 예제. 옵션은 필요한 필드만 채워서 넣으면 된다.
 * export const Target = withTracking(TargetComponent)({
 *   // className 정의. 단순 string literal 로 넘길수도 있다.
 *   className: (props) => `my-name_index-${props.index}`,
 *   // id 가 필요하다면 가능.
 *   id: 'my-name-article',
 *   // data-attribute 를 정의 한다.
 *   data: {
 *     // props 기반으로 자료를 넘겨줄 수 있다.
 *     my_index: (props) => props.index, // --> data-my_index="0"
 *     // literal 값도 가능
 *     item_state: 'yes', // -> data-item_state="yes"
 *   },
 * });
 *
 * // -------- 커스텀 이벤트가 필요한 경우 ------- //
 * interface Props extends CustomTrackingProps {
 *   items: SampleUiModelItem[];
 * }
 * // 컴포넌트 선언
 * const TargetComponent: FC<Props> = ({ items, when, ...props }) => {
 *   const handleBeforeChange = (_: number, nextIndex: number) => {
 *     // 커스텀 트래킹을 방출 시킨다.
 *     when && when.flick();
 *   };
 *   return (
 *     <Slider beforeChange={handleBeforeChange} {...props}>
 *       {items.map((item, idx) => <SlideItem key={idx} item={item} />)}
 *     </Slider>
 *   );
 * };
 *
 * // HOC 사용 예제. 옵션은 필요한 필드만 채워서 넣으면 된다.
 * export const Target = withTracking(TargetComponent)({
 *   // 커스텀 트래킹이 필요할 때 설정한다.
 *   when: {
 *     // 플릭 이벤트에 쓰인다.
 *     flick: (props) => `Style_Pop_${props.index}`
 *   },
 * });
 *
 * @param Comp 이벤트 트래킹 옵션을 적용 할 컴포넌트. 반드시 Props 가 TrackingProps 를 기반으로 쓰여야 한다.
 * @param settings 트래킹 옵션 세팅 객체.
 */
export function withTracking<P extends TrackingProps>(
  Comp: ComponentType<P> | FC<P>,
) {
  return function (settings: GTMTrackingSettings<P>) {
    const ReturnComp: FC<P> = (props) => {
      const className = getClassName(props, settings);
      const id = getId(props, settings);
      const dataAttr = getDataAttributes(props, settings);
      const when = getWhen(props, settings);

      const mProps: P & { children?: ReactNode } & Record<string, any> = {
        ...props,
        ...dataAttr,
      };

      if (className) {
        mProps.className = className;
      }
      if (id) {
        mProps.id = id;
      }
      if (when) {
        mProps.when = when;
      }
      return <Comp {...mProps} />;
    };
    return ReturnComp as FC<Omit<P, 'when'>>;
  };
}
