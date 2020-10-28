import {
  createMessageObserver,
  SimpleObserver,
  SimpleSubject,
} from './message-observer';
import { AppMessageEventArgs } from '../../models';
import { setIsServer, timeout } from '../../util';

describe('SimpleObserver', () => {
  it('옵저버에 콜백을 넣고 구독한 상태에서 next 수행하면 콜백으로 값을 받을 수 있다.', async (done) => {
    const obs = new SimpleObserver<number>((subs) => {
      timeout(300).then(() => subs.next(1));
    });

    let result0 = 0;
    let result1 = 0;

    const sub0 = obs.subscribe((val) => {
      result0 = val;
    });
    const sub1 = obs.subscribe((val) => {
      result1 = val;
    });

    expect(sub0 === sub1).toBeFalsy();

    await timeout(350);

    expect(result0).toBe(1);
    expect(result1).toBe(1);

    sub0.unsubscribe();
    sub1.unsubscribe();

    done();
  });
  it('옵저버에 구독하고 해제하면 더 이상 값을 받을 수 없다.', async (done) => {
    const obs = new SimpleObserver<number>((subs) => {
      timeout(300)
        .then(() => subs.next(1))
        .then(() => timeout(100))
        .then(() => subs.next(2));
    });

    let result = 0;

    const sub0 = obs.subscribe((val) => {
      result = val;
    });

    await timeout(350);

    expect(result).toBe(1);

    sub0.unsubscribe();

    await timeout(100);

    expect(result).toBe(1);

    done();
  });
  it('옵저버가 실패하면 구독 두번째 콜백으로 오류 상태를 받을 수 있다.', (done) => {
    const obs = new SimpleObserver<number>((subs) => {
      timeout(300)
        .then(() => subs.next(1))
        .then(() => timeout(100))
        .then(() => subs.error(new Error('observer error!')));
    });

    const sub0 = obs.subscribe(
      (val) => {
        expect(val).toBe(1);
      },
      (error) => {
        expect(error.message).toBe('observer error!');

        sub0.unsubscribe();

        done();
      },
    );
  });
  it('옵저버가 끝나면 구독 세번째 콜백으로 확인할 수 있다.', async (done) => {
    const obs = new SimpleObserver<number>((subs) => {
      timeout(300)
        .then(() => subs.next(1))
        .then(() => timeout(100))
        .then(() => subs.complete());
    });

    const fnComp = jest.fn();

    const sub0 = obs.subscribe(
      (val) => {
        expect(val).toBe(1);
      },
      null,
      fnComp,
    );

    await timeout(450);

    expect(fnComp).toBeCalled();

    sub0.unsubscribe();

    done();
  });
});

describe('SimpleSubject', () => {
  it('구독자에게 지속적인 데이터 전달이 가능하다.', () => {
    const sbj = new SimpleSubject<string>();
    let result0 = '';
    const arrResult: string[] = [];
    const sub0 = sbj.subscribe((val) => {
      result0 = val;
      arrResult.push(val);
    });

    sbj.next('abc');

    expect(result0).toBe('abc');

    sbj.next('haha');
    sbj.next('hoho');
    sbj.next('kaka');

    expect(arrResult).toEqual(['abc', 'haha', 'hoho', 'kaka']);

    sub0.unsubscribe();
  });
  it('실패를 전달하면 모든 구독자에게 실패 내용이 전달된다.', () => {
    const sbj = new SimpleSubject<string>();
    let result0 = '';
    let err: Error | undefined;
    const arrResult: string[] = [];
    const sub0 = sbj.subscribe(
      (val) => {
        result0 = val;
        arrResult.push(val);
      },
      (error) => (err = error),
    );

    sbj.next('쓰슥!');

    expect(result0).toBe('쓰슥!');

    sbj.error(new Error('오오 둘리!'));
    sbj.next('오호호!');

    expect(err && err.message).toBe('오오 둘리!');
    expect(result0).toBe('오호호!');

    sub0.unsubscribe();
  });
  it('완료를 전달하면 모든 구독자에게 완료가 호출된다.', () => {
    const sbj = new SimpleSubject<string>();
    let result0 = '';
    const arrResult: string[] = [];
    const fnComp = jest.fn();
    const sub0 = sbj.subscribe(
      (val) => {
        result0 = val;
        arrResult.push(val);
      },
      null,
      fnComp,
    );

    sbj.complete();
    sbj.next('쓰슥!');

    expect(result0).toBe('');
    expect(fnComp).toBeCalled();

    sub0.unsubscribe();
  });
});

describe('createMessageObserver', () => {
  interface MessagePayload {
    value: string;
    count: number;
    young: boolean;
  }
  function makeMockEvent<T>(
    data: { event: string; payload: T },
    origin = window.location.origin,
  ): AppMessageEventArgs<T> {
    return {
      ...new Event('message'),
      data,
      lastEventId: '1234',
      origin,
      ports: [],
      source: null,
    };
  }

  const spyAddEvent = jest.spyOn(window, 'addEventListener');
  const spyRmvEvent = jest.spyOn(window, 'removeEventListener');
  const spyPostMsg = jest.spyOn(window, 'postMessage');

  let messageListener: EventListener[] = [];

  spyAddEvent.mockImplementation((type, listener) => {
    if (type === 'message') {
      messageListener.push(listener as EventListener);
    }
  });
  spyRmvEvent.mockImplementation((type, listener) => {
    if (type === 'message' && !!listener) {
      const index = messageListener.indexOf(listener as EventListener);

      if (index < 0) {
        return;
      }

      messageListener.splice(index, 1);
    }
  });
  spyPostMsg.mockImplementation((data, origin) => {
    messageListener.forEach((handler) => {
      handler(makeMockEvent(data, origin || window.location.origin));
    });
  });

  beforeAll(() => {
    setIsServer(false);
  });
  beforeEach(() => {
    spyAddEvent.mockClear();
    spyRmvEvent.mockClear();
    spyPostMsg.mockClear();
  });
  afterAll(() => {
    setIsServer(true);
    spyAddEvent.mockRestore();
    spyRmvEvent.mockRestore();
    spyPostMsg.mockRestore();
    messageListener = [];
  });

  it('메시지 옵저버를 만들면 외부 메시지를 옵저버 형태로 받을 수 있다.', (done) => {
    const TYPE = 'test-message';
    const msgObs = createMessageObserver<MessagePayload>(TYPE);

    const originalPayload: MessagePayload = {
      count: 134,
      value: '하하하핫',
      young: false,
    };

    msgObs.subscribe((payload) => {
      expect(payload).toEqual(originalPayload);

      msgObs.destroy();

      done();
    });

    window.postMessage(
      {
        event: TYPE,
        payload: originalPayload,
      },
      window.location.origin,
    );

    expect(spyAddEvent).toBeCalled();
    expect(spyPostMsg).toBeCalled();
  });

  it('origin, 메시지명이 다르거나 payload가 비어 있으면 아무것도 호출하지 않는다.', () => {
    const TYPE = 'test-message';
    const msgObs = createMessageObserver<MessagePayload>(TYPE);

    const originalPayload: MessagePayload = {
      count: 134,
      value: '하하하핫',
      young: false,
    };

    const fnNext = jest.fn();
    const fnError = jest.fn();

    msgObs.subscribe(fnNext, fnError);

    window.postMessage(
      {
        event: TYPE,
        payload: originalPayload,
      },
      'wtf!',
    );

    expect(fnNext).not.toBeCalled();
    expect(fnError).not.toBeCalled();
    fnNext.mockClear();
    fnError.mockClear();

    window.postMessage(
      {
        event: TYPE + 'df',
        payload: originalPayload,
      },
      window.location.origin,
    );

    expect(fnNext).not.toBeCalled();
    expect(fnError).not.toBeCalled();
    fnNext.mockClear();
    fnError.mockClear();

    window.postMessage(
      {
        event: TYPE,
        payload: null,
      },
      window.location.origin,
    );

    expect(fnNext).not.toBeCalled();
    expect(fnError).not.toBeCalled();
    fnNext.mockClear();
    fnError.mockClear();

    msgObs.destroy();
  });

  it('unsubscribe 하면 더이상 구독할 수 없다.', () => {
    const TYPE = 'test-message';
    const msgObs = createMessageObserver<MessagePayload>(TYPE);

    const originalPayload: MessagePayload = {
      count: 134,
      value: '하하하핫',
      young: false,
    };

    const fnNext = jest.fn();
    const fnError = jest.fn();

    const sub0 = msgObs.subscribe(fnNext, fnError);

    window.postMessage(
      {
        event: TYPE,
        payload: originalPayload,
      },
      window.location.origin,
    );

    expect(fnNext).toBeCalledWith(originalPayload);
    fnNext.mockClear();

    sub0.unsubscribe();

    window.postMessage(
      {
        event: TYPE,
        payload: originalPayload,
      },
      window.location.origin,
    );

    expect(fnNext).not.toBeCalled();
    msgObs.destroy();
  });

  it('destroy 하면 구독 해제되고 이벤트에서 제거된다.', () => {
    const TYPE = 'test-message';
    const msgObs = createMessageObserver<MessagePayload>(TYPE);

    const originalPayload: MessagePayload = {
      count: 134,
      value: '하하하핫',
      young: false,
    };

    const fnNext = jest.fn();
    const fnError = jest.fn();
    const fnComp = jest.fn();

    msgObs.subscribe(fnNext, fnError, fnComp);

    window.postMessage(
      {
        event: TYPE,
        payload: { ...originalPayload, young: true },
      },
      window.location.origin,
    );

    expect(fnNext).toBeCalledWith({ ...originalPayload, young: true });
    fnNext.mockClear();

    msgObs.destroy();

    window.postMessage(
      {
        event: TYPE,
        payload: originalPayload,
      },
      window.location.origin,
    );

    expect(spyRmvEvent).toBeCalled();
    expect(fnNext).not.toBeCalled();
    expect(fnComp).toBeCalled();
  });

  it('메시지 이벤트가 여러 타입이 동시에 수행되어도 의도대로 동작 된다.', async (done) => {
    interface MockPayload0 {
      name: string;
      age: number;
    }
    interface MockPayload1 {
      value: string;
      young: boolean;
    }
    interface MockPayload2 {
      title: string;
      volume: number;
    }
    interface MockPayload3 {
      id: string;
      keyword?: string;
    }
    const types = ['apply0', 'update1', 'delete2', 'create3'];
    const msgObs0 = createMessageObserver<MockPayload0>(types[0]);
    const msgObs1 = createMessageObserver<MockPayload1>(types[1]);
    const msgObs2 = createMessageObserver<MockPayload2>(types[2]);
    const msgObs3 = createMessageObserver<MockPayload3>(types[3]);
    const msgObsList = [msgObs0, msgObs1, msgObs2, msgObs3];

    const fnNexts = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];

    msgObsList.forEach((msgObs, idx) => msgObs.subscribe(fnNexts[idx]));

    const payload0: MockPayload0 = {
      age: 29,
      name: '쏜쌤',
    };
    const payload1: MockPayload1 = {
      value: '쏘니쿤',
      young: true,
    };
    const payload2: MockPayload2 = {
      title: '개발강의',
      volume: 1004,
    };
    const payload3: MockPayload3 = {
      id: '6699887',
      keyword: '검색해 보자 하하핫',
    };

    const payloadList = [payload0, payload1, payload2, payload3];

    types.forEach((typeName, idx) => {
      window.postMessage(
        {
          event: typeName,
          payload: { ...payloadList[idx] },
        },
        window.location.origin,
      );
    });

    await timeout(150);

    fnNexts.forEach((fnNext, idx) => {
      expect(fnNext).toBeCalledWith(payloadList[idx]);
    });

    window.postMessage(
      {
        event: types[3],
        payload: { id: 'hohoho' },
      },
      window.location.origin,
    );

    expect(fnNexts[3]).toBeCalledTimes(2);
    expect(fnNexts[3]).toBeCalledWith({ id: 'hohoho' });
    expect(fnNexts[0]).toBeCalledTimes(1);
    expect(fnNexts[1]).toBeCalledTimes(1);
    expect(fnNexts[2]).toBeCalledTimes(1);

    msgObsList.forEach((msgObs) => msgObs.destroy());

    expect(spyRmvEvent).toBeCalledTimes(4);

    done();
  });
});
