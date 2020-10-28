import { extractMessagePayload } from './commonApp.util';
import {
  AppMessageObserver,
  SimpleObservable,
  SimpleSubscriber,
  SimpleSubscription,
} from '../../models';
import { nop } from '../../util';

class SimpleSubscriberHandler<T = void> implements SimpleSubscriber<T> {
  private subsList: Array<SimpleSubscriber<T>> = [];
  private isCompleted = false;

  get completed() {
    return this.isCompleted;
  }

  next(val: T) {
    if (this.completed) {
      return;
    }
    this.subsList.forEach((subs) => subs.next(val));
  }
  error(reason: Error) {
    if (this.completed) {
      return;
    }
    this.subsList.forEach((subs) => subs.error(reason));
  }
  complete() {
    if (this.completed) {
      return;
    }
    this.subsList.forEach((subs) => subs.complete());
    this.destroy();
  }
  add(subs: SimpleSubscriber<T>) {
    if (this.completed) {
      return;
    }
    this.subsList.push(subs);
  }
  remove(subs: SimpleSubscriber<T>) {
    if (this.completed) {
      return;
    }
    const index = this.subsList.indexOf(subs);

    if (this.subsList.length === 0 || index < 0) {
      return;
    }

    this.subsList.splice(index, 1);
  }
  destroy() {
    (this.subsList as unknown) = null;
    this.isCompleted = true;
  }
}

/**
 * 간단한 옵저버 객체.
 */
export class SimpleObserver<T = void> implements SimpleObservable<T> {
  private subsHandler = new SimpleSubscriberHandler<T>();
  /**
   * 간단한 옵저버 객체를 생성한다.
   * @param callback 비동기로 자료전달을 제어하는 콜백. 자료를 전달할 수 있는 Subscriber 객체를 제공한다.
   */
  constructor(callback: (subs: SimpleSubscriber<T>) => void) {
    callback(this.subsHandler);
  }
  subscribe(
    next: (val: T) => void,
    error?: ((reason: Error) => void) | null,
    complete?: (() => void) | null,
  ): SimpleSubscription {
    if (this.subsHandler.completed) {
      return {
        unsubscribe: nop,
      };
    }
    const subs = {
      complete: complete || nop,
      error: error || nop,
      next,
    };
    this.subsHandler.add(subs);
    return {
      unsubscribe: () => {
        this.subsHandler.remove(subs);
      },
    };
  }
}

/**
 * 외부에서 명시적으로 비동기로 자료를 전달할 수 있는 서브젝트 객체.
 */
export class SimpleSubject<T = void>
  implements SimpleSubscriber<T>, SimpleObservable<T> {
  private subscriber: SimpleSubscriberHandler<T> | undefined;
  private observer: SimpleObserver<T>;
  /**
   * 외부에서 명시적으로 비동기로 자료를 전달할 수 있는 서브젝트 객체를 만든다.
   */
  constructor() {
    this.observer = new SimpleObserver<T>(
      (subs) => (this.subscriber = subs as SimpleSubscriberHandler<T>),
    );
  }

  next(val: T) {
    this.subscriber && this.subscriber.next(val);
  }
  error(reason: Error) {
    this.subscriber && this.subscriber.error(reason);
  }
  complete() {
    this.subscriber && this.subscriber.complete();
  }
  subscribe(
    next: (val: T) => void,
    error?: ((reason: Error) => void) | null,
    complete?: (() => void) | null,
  ) {
    return this.observer.subscribe(next, error, complete);
  }
}

/**
 * Message API 를 이용하여 자료를 받아오는 메시지 옵저버를 만들어 전달한다.
 *
 * 메시지 이벤트에 Payload 가 빠져있거나 유효성 검증에 실패하면 아무것도 수행하지 않는다.
 * @param type 메시지 타입
 */
export function createMessageObserver<P extends Record<string, any>>(
  type: string,
): AppMessageObserver<P> {
  const sbj = new SimpleSubject<P>();
  const removeEvent = () => {
    window.removeEventListener('message', handleMessage);
    sbj.complete();
  };
  const registEvent = () => {
    window.addEventListener('message', handleMessage);
  };
  const handleMessage = (event: AppBridgeMessageEvent<P>) => {
    const payload = extractMessagePayload(type, event);

    if (payload) {
      sbj.next(payload);
    }
  };
  registEvent();

  return {
    destroy: removeEvent,
    subscribe: (next, error, complete) => sbj.subscribe(next, error, complete),
  };
}
