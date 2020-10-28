import React, { FC } from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';

import { AdaptiveLink } from './AdaptiveLink';
import {
  getNativeAppService,
  getUserAgent,
  setDevUserAgent,
} from '../../services';
import { AndroidAppService } from '../../services/nativeApp/AndroidAppService';
import { b64EncodeUnicode, mergeUrlQuery, setIsServer } from '../../util';

Enzyme.configure({ adapter: new Adapter() });

const DOMAIN = 'https://www.skbt.co.kr';

const locationMock: Location = {
  ancestorOrigins: window.location.ancestorOrigins,
  assign: jest.fn(),
  hash: '',
  host: '',
  hostname: '',
  href: '',
  origin: DOMAIN,
  pathname: '',
  port: '80',
  protocol: 'https:',
  reload: jest.fn(),
  replace: jest.fn(),
  search: '',
  toString: jest.fn(() => ''),
};

describe('AdaptiveLink', () => {
  const ua = getUserAgent();
  // let locationHrefMock: jest.SpyInstance<void, [string]>;
  const originalLocation = window.location;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete window.location;

    window.location = locationMock;
    setIsServer(false);
  });

  afterAll(() => {
    // locationHrefMock.mockRestore();

    window.location = originalLocation;
    setIsServer(true);
  });

  afterEach(() => {
    locationMock.href = '';
  });

  afterAll(() => {
    setDevUserAgent(ua);
  });

  describe('네이티브 환경', () => {
    beforeAll(() => {
      setDevUserAgent('webkit StyleShare ver 1.0 Android');
    });

    afterAll(() => {
      setDevUserAgent(ua);
    });

    it('네이티브앱 환경이면 네이티브앱 모드로 동작 된다.', () => {
      const SampleComp: FC = () => {
        return (
          <div>
            <AdaptiveLink
              appHref="someapp://product/1234"
              href="www.google.com"
              id="link_korea"
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      act(() => {
        let mountTarget = mount(<SampleComp />);

        mountTarget = mountTarget.mount();

        expect(mountTarget.find('a#link_korea').prop('href')).toBe(
          'someapp://product/1234',
        );
      });
    });

    it('설정된 앱링크(appHref)가 deep-link 형식이 아닐경우 새창 수행 모드가 된다.', () => {
      const testPath = '/search/filter/?keyword=nike';
      const testTitle = '검색이당';
      const fnMock = jest.fn();
      const SampleComp: FC = () => {
        // 새창 수행모드일 경우 onClick 이벤트는 무시된다
        const handleClick = () => {
          fnMock();
        };
        return (
          <div>
            <AdaptiveLink
              appHref={testPath}
              href="www.google.com"
              id="link_korea"
              title={testTitle}
              onClick={handleClick}
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      const expectedValue =
        'app-webview://openSearch/aHR0cHM6Ly93d3cuc2tidC5jby5rci9zZWFyY2gvZmlsdGVyLz9rZXl3b3JkPW5pa2U=?title=%EA%B2%80%EC%83%89%EC%9D%B4%EB%8B%B9';
      const createdValue = `app-webview://openSearch/${b64EncodeUnicode(
        `${window.location.origin}${testPath}`,
      )}?title=${encodeURIComponent(testTitle)}`;
      const service = getNativeAppService();

      expect(service).toBeInstanceOf(AndroidAppService);

      expect(createdValue).toBe(expectedValue);

      act(() => {
        let mountTarget = mount(<SampleComp />);

        mountTarget.find('#link_korea').at(0).simulate('click', {});
        mountTarget = mountTarget.mount();

        expect(mountTarget.find('a#link_korea').prop('href')).toBe('');
        expect(window.location.href).toBe(createdValue);
        expect(fnMock).not.toBeCalled();

        mountTarget.unmount();
      });
    });

    it('query 속성에 자료를 넣으면 appHref 내용에 쿼리파라미터가 추가된다.', () => {
      const testPath = '/search/filter/?keyword=nike';
      const testTitle = '검색이당';
      const query = {
        name: '이순신',
        value: 567,
        young: true,
      };
      const SampleComp: FC = () => {
        return (
          <div>
            <AdaptiveLink
              appHref={testPath}
              href="www.google.com"
              id="link_korea"
              query={query}
              title={testTitle}
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      const expectedValue =
        'app-webview://openSearch/aHR0cHM6Ly93d3cuc2tidC5jby5rci9zZWFyY2gvZmlsdGVyLz9rZXl3b3JkPW5pa2UmbmFtZT0lRUMlOUQlQjQlRUMlODglOUMlRUMlOEIlQTAmdmFsdWU9NTY3JnlvdW5nPXRydWU=?title=%EA%B2%80%EC%83%89%EC%9D%B4%EB%8B%B9';
      const createdValue = `app-webview://openSearch/${b64EncodeUnicode(
        `${window.location.origin}${mergeUrlQuery(testPath, query)}`,
      )}?title=${encodeURIComponent(testTitle)}`;
      const service = getNativeAppService();

      expect(service).toBeInstanceOf(AndroidAppService);
      expect(createdValue).toBe(expectedValue);

      act(() => {
        let mountTarget = mount(<SampleComp />);

        mountTarget.find('#link_korea').at(0).simulate('click', {});
        mountTarget = mountTarget.mount();

        expect(mountTarget.find('a#link_korea').prop('href')).toBe('');
        expect(window.location.href).toBe(createdValue);

        mountTarget.unmount();
      });
    });
  });
  describe('웹브라우저 환경', () => {
    it('웹브라우저 환경이면 웹브라우저 모드로 동작된다.', () => {
      const fnMock = jest.fn();
      const SampleComp: FC = () => {
        const handleClick = () => {
          fnMock();
        };
        return (
          <div>
            <AdaptiveLink
              appHref="someapp://product/1234"
              href="www.google.com"
              id="link_korea"
              onClick={handleClick}
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      act(() => {
        let mountTarget = mount(<SampleComp />);

        mountTarget = mountTarget.mount();

        expect(mountTarget.find('a#link_korea').prop('href')).toBe(
          'www.google.com',
        );
        expect(fnMock).not.toBeCalled();

        mountTarget.unmount();
      });
    });
    it('to 속성이 정의 되어 있다면 react-router 의 Link 로써 동작 된다.', () => {
      const SampleApp: FC = () => {
        return (
          <BrowserRouter>
            <Switch>
              <Route path="/">
                <SampleComp />
              </Route>
            </Switch>
          </BrowserRouter>
        );
      };
      const SampleComp: FC = () => {
        return (
          <div>
            <AdaptiveLink
              href="www.google.com"
              id="link_korea"
              to="/product/1234"
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      act(() => {
        const mountTarget = mount(<SampleApp />);

        expect(mountTarget.find(Link)).toHaveLength(1);

        mountTarget.unmount();
      });
    });
    it('to 와 href 대신 onClick 으로 버튼처럼 사용 가능하다.', () => {
      const fnMock = jest.fn();

      const SampleComp: FC = () => {
        const handleClick = () => {
          fnMock();
        };

        return (
          <div>
            <AdaptiveLink
              appHref="someapp://product/1234"
              id="link_korea"
              onClick={handleClick}
            >
              오 필승 꼬레아!
            </AdaptiveLink>
          </div>
        );
      };
      act(() => {
        let mountTarget = mount(<SampleComp />);

        mountTarget.find('a#link_korea').simulate('click', {});

        mountTarget = mountTarget.mount();

        expect(mountTarget.find('a#link_korea').prop('href')).toBe('');
        expect(fnMock).toBeCalled();
        expect(window.location.href).toBe('');

        mountTarget.unmount();
      });
    });
  });
});
