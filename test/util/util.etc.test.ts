import { setIsServer } from './util.common';
import { setUrlToTemporaryIframe, timeout } from './util.etc';

describe('util.etc', () => {
  describe('timeout', () => {
    it('특정 시간이 지나면 비동기 콜백을 수행한다.', async (done) => {
      let result = 0;

      setTimeout(() => result++, 50);

      await timeout(60);
      expect(result).toBe(1);
      done();
    });
    it('특정 시간이 지난 후 지정된 값을 전달 한다.', async (done) => {
      const result = await timeout(60, 'theson');

      expect(result).toBe('theson');
      done();
    });
    it('취소 시키면 catch 로 받아올 수 있다.', (done) => {
      let fnStop: unknown;
      let result = '';
      timeout(100, 'theson', (stop) => (fnStop = stop))
        .then((val) => (result = val))
        .catch((err) => {
          expect(result).not.toBe('theson');
          expect((err as Error).message).toBe('timeout stopped.');
          done();
        });

      setTimeout(() => {
        typeof fnStop === 'function' && fnStop();
      }, 50);
    });
  });

  describe('setUrlToTemporaryIframe', () => {
    it('특정 url 을 전달하면 그 것을 iframe 에 렌더링 한다.', async (done) => {
      const url = 'http://blank.org/';
      const id = 'iframe_test';
      setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).not.toBeNull();
      expect(elem.src).toEqual(url);
      expect(elem.getAttribute('sandbox')).toEqual('allow-same-origin');
      expect(elem.id).toEqual(id);

      await timeout(2500);

      done();
    });
    it('수행 후 2초 뒤엔 해당 요소를 자동으로 제거한다.', async (done) => {
      const url = 'http://blank.org';
      const id = 'iframe_test1';
      setUrlToTemporaryIframe(url, id);

      await timeout(2500);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).toBeNull();

      done();
    });
    it('서버 환경일 때는 수행되지 않는다.', () => {
      setIsServer(true);
      const url = 'http://blank.org/';
      const id = 'iframe_test2';

      setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).toBeNull();

      setIsServer(false);
    });
    it('요청 url이 비어있다면 수행되지 않는다.', () => {
      const id = 'iframe_test3';

      setUrlToTemporaryIframe('', id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).toBeNull();
    });
    it('쓰려는 id 가 이미 존재 한다면 자동으로 제거하고 다시 만들어 적용한다.', async (done) => {
      const id = 'iframe_test4';
      const url = 'http://blank.org/';
      const url2 = 'https://blank.org/blank.html';

      setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem.src).toBe(url);

      setUrlToTemporaryIframe(url2, id);

      const elem2 = document.getElementById(id) as HTMLIFrameElement;

      expect(elem2.src).not.toBe(url);
      expect(elem2.src).toBe(url2);

      await timeout(2500);

      done();
    });
    it('수행 2초 후 기존 iframe 을 제거하려 했을 때 외부 제거등의 요인으로 존재하지 않는다면 아무일도 일어나지 않는다.', async (done) => {
      const id = 'iframe_test_bonus1';
      const url = 'http://blank.org/';

      setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).not.toBeNull();

      document.body.removeChild(elem);

      await timeout(2500);

      done();
    });
    it('만들어진 iframe 을 반환 함수를 통해 즉시 제거 가능하다.', async (done) => {
      const id = 'iframe_test5';
      const url = 'http://blank.org/';

      const remove = setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem).not.toBeNull();

      remove();

      const elem2 = document.getElementById(id) as HTMLIFrameElement;

      expect(elem2).toBeNull();

      await timeout(2500);

      done();
    });
    it('인앱 deep-link 를 url 에 적용할 수 있다.', async (done) => {
      const id = 'iframe_test6';
      const url = 'someapp://prod/1234';

      setUrlToTemporaryIframe(url, id);

      const elem = document.getElementById(id) as HTMLIFrameElement;

      expect(elem.src).toBe(url);

      await timeout(2500);

      done();
    });
  });
});
