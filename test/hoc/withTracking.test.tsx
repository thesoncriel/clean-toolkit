/**
 * hoc 특성상, private 함수가 많아서 여기에다 복붙하고 테스트 하였음.
 * 만약 내부 함수 내용이 바뀌면, 다시 복붙해서 테스트 수행을 해야 함.
 */

import React, { FC } from 'react';
import classNames from 'classnames';
import Enzyme, { mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';

import { withTracking } from './withTracking';
import appConfig from '../app.config';
import {
  CustomTrackingMapper,
  GTMTrackingSettings,
  TrackingProps,
} from '../models';

Enzyme.configure({ adapter: new Adapter() });

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

  return classNames(props.className, additionalClassName);
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
      dataLayer.push({
        event: eventName,
      });
    },
  };
}

interface TestProps extends TrackingProps {
  index: number;
  name?: string;
}

describe('withTracking', () => {
  describe('private function', () => {
    describe('getClassName', () => {
      it('className 이 props 에만 있다면 그것을 반환한다.', () => {
        const result = getClassName(
          {
            className: 'theson',
          },
          {},
        );

        expect(result).toBe('theson');
      });
      it('className 이 settings 에만 있다면 그것을 반환한다.', () => {
        const result1 = getClassName(
          {},
          {
            className: 'sonic',
          },
        );
        const result2 = getClassName(
          {
            index: 4,
          } as TestProps,
          {
            className: (props) => `drill-${props.index}`,
          },
        );

        expect(result1).toBe('sonic');
        expect(result2).toBe('drill-4');
      });
      it('className 이 props 와 settings 양쪽에 있다면, props 의 것과 내용이 조합된다.', () => {
        const result1 = getClassName(
          {
            className: 'tails amy',
          },
          {
            className: 'sonic',
          },
        );
        const result2 = getClassName(
          {
            className: 'knuckles',
            index: 4,
          } as TestProps,
          {
            className: (props) => `drill-${props.index}`,
          },
        );

        expect(result1).toBe('tails amy sonic');
        expect(result2).toBe('knuckles drill-4');
      });
    });
    describe('getId', () => {
      it('settings 에 id 가 있다면 출력 한다.', () => {
        const result1 = getId(
          {},
          {
            id: 'sonic',
          },
        );
        const result2 = getId(
          {
            index: 4,
          } as TestProps,
          {
            id: (props) => `sonic-${props.index}`,
          },
        );

        expect(result1).toBe('sonic');
        expect(result2).toBe('sonic-4');
      });
      it('props 에만 id 가 있다면 이것을 출력 한다.', () => {
        const result1 = getId(
          {
            id: 'tongtong',
          },
          {},
        );

        expect(result1).toBe('tongtong');
      });
      it('둘 다 있을 경우 props 의 내용을 무시하고 경고로 알려준다. (경고는 개발자 모드 전용)', () => {
        // eslint-disable-next-line no-console
        const originalConsoleWarn = console.warn;
        const mockWarn = jest.fn();

        // eslint-disable-next-line no-console
        console.warn = mockWarn;

        const spy = jest.spyOn(console, 'warn');
        const result1 = getId(
          {
            id: 'ignore',
          },
          {
            id: 'sonic',
          },
        );

        expect(result1).toBe('sonic');
        expect(spy).lastCalledWith(
          'withTracking: ID (ignore) value is ignored.',
        );

        const result2 = getId(
          {
            id: 'hahaha',
            index: 6,
          } as TestProps,
          {
            id: (props) => `sonic-${props.index}`,
          },
        );

        expect(result2).toBe('sonic-6');
        expect(spy).lastCalledWith(
          'withTracking: ID (hahaha) value is ignored.',
        );

        // eslint-disable-next-line no-console
        console.warn = originalConsoleWarn;
      });
    });
    describe('getDataAttributes', () => {
      it('설정된 필드를 기반으로 data-attribute 를 만든다.', () => {
        const result1 = getDataAttributes(
          {
            index: 9,
            name: '쏜쌤',
          } as TestProps,
          {
            data: {
              sonic_mania: (props) => props.index / 3,
              star: ({ name, index }) => `${name || ''}_${index}`,
              theson: 1234,
            },
          },
        );

        expect(result1).toEqual({
          ['data-sonic_mania']: 3,
          ['data-star']: '쏜쌤_9',
          ['data-theson']: 1234,
        });
      });
    });
    describe('getWhen', () => {
      it('설정된 필드를 기반으로 when props 를 만든다.', () => {
        const result = getWhen(
          {
            index: 9,
            name: '쏜쌤',
          } as TestProps,
          {
            when: {
              flick: (props) => `Thorn_${props.name || ''}`,
            },
          },
        );

        expect(result).not.toBeNull();
        expect(result && result.flick).toBeInstanceOf(Function);
      });
      it('when 필드가 비어 있다면, null 이다.', () => {
        const result1 = getWhen(
          {
            index: 9,
            name: '쏜쌤',
          } as TestProps,
          {
            when: {},
          },
        );
        const result2 = getWhen(
          {
            index: 9,
            name: '쏜쌤',
          } as TestProps,
          {},
        );

        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });
    });
  }); // private methods [end]

  describe('decorator', () => {
    it('props 와 settings 조합으로 의도대로 props 가 만들어지고 렌더링이 이뤄진다', () => {
      interface Props extends TrackingProps {
        name: string;
        age: number;
      }
      const TestComp: FC<Props> = ({ name, ...props }) => {
        return <strong {...props}>이름: {name}</strong>;
      };
      const TestCompWithTracking = withTracking(TestComp)({
        className: (props) => `c_name-${props.name}`,
        data: {
          coco: '코코는 귀엽다!',
          hoho: (props) => `호호 ${props.name}`,
        },
        id: (props) => `text_${props.age}`,
      });
      const mountTarget = mount(
        <TestCompWithTracking age={30} className="aabb-cc" name="아줌마" />,
      );
      const elem = mountTarget.find('strong');

      expect(elem.hasClass('aabb-cc')).toBeTruthy();
      expect(elem.hasClass('c_name-아줌마')).toBeTruthy();
      expect(elem.prop('data-coco')).toEqual('코코는 귀엽다!');
      expect(elem.prop('data-hoho')).toEqual('호호 아줌마');
      expect(elem.prop('id')).toEqual('text_30');
    });
    it('렌더링 결과물의 엘리먼트내 dataset 에 data-attribute 및 설정된 className, id 가 존재 한다.', () => {
      interface Props extends TrackingProps {
        title: string;
        count?: number;
        index: number;
      }
      const TestComp: FC<Props> = ({
        title,
        count,
        children,
        id,
        index,
        ...props
      }) => {
        return (
          <section id={id}>
            <button type="button" {...props}>
              {children}
            </button>
            <span>{count}</span>
          </section>
        );
      };

      const TestWithTracking = withTracking(TestComp)({
        className: (props) => `counts-${props.count || 0}`,
        data: {
          stsh: (props) => `stsh-${props.title}`,
          title: ({ title }) => title,
        },
        id: ({ index }) => `myId_${index}`,
      });

      const renderTarget = render(
        <TestWithTracking count={12} index={2} title="웃자웃자">
          애기다
        </TestWithTracking>,
      );

      const button = renderTarget.find('button');
      const section = renderTarget;

      expect(button.data()).toEqual({
        stsh: 'stsh-웃자웃자',
        title: '웃자웃자',
      });
      expect(button.hasClass('counts-12')).toBeTruthy();
      expect(button.text()).toBe('애기다');
      expect(section.attr('id')).toBe('myId_2');
      expect(section.find('[data-stsh="stsh-웃자웃자"]')).toHaveLength(1);
    });
    it('렌더링 후 커스텀 트래킹 이벤트를 설정 했다면 그것을 사용 할 수 있다.', () => {
      interface TempGlobal {
        dataLayer?: {
          push: () => void;
        };
      }
      interface Props extends TrackingProps {
        title: string;
      }
      const TestComp: FC<Props> = ({ title, children, when, ...props }) => {
        const handleClick = () => {
          when && when.flick();
        };
        return (
          <button type="button" onClick={handleClick} {...props}>
            {children}
          </button>
        );
      };

      const TestWithTracking = withTracking(TestComp)({
        when: {
          flick: (props) => `Flick_${props.title}`,
        },
      });

      const renderTarget = mount(
        <TestWithTracking title="웃자웃자">애기다</TestWithTracking>,
      );
      const button = renderTarget;
      const g = (global as unknown) as TempGlobal;
      const fnMock = jest.fn();

      g.dataLayer = {
        push: fnMock,
      };

      act(() => {
        button.simulate('click', {});
      });

      expect(fnMock).toBeCalled();
      expect(fnMock).toBeCalledWith({
        event: 'Flick_웃자웃자',
      });

      delete g.dataLayer;
    });
  }); // decorator test [end]
});
