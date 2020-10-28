import { mergeQuries, toStringField } from './util.collection';

describe('mergeQueries', () => {
  interface TestModel {
    name?: string;
    age?: string;
    min?: string | number;
    max?: string | null;
    isFree?: string;
  }
  it('두 객체의 내용을 병합한다.', () => {
    const src: TestModel = {
      age: '14',
      min: '12',
      name: '하하',
    };
    const target: TestModel = {
      isFree: 'true',
      max: '0',
      min: '22',
    };
    expect(mergeQuries(src, target)).toEqual({
      ...src,
      ...target,
    });
  });
  it('우측 객체의 필드 값에 빈 문자열이 있다면 해당 필드의 병합은 무시 한다.', () => {
    const src: TestModel = {
      age: '14',
      min: '12',
      name: '하하',
    };
    const target: TestModel = {
      isFree: 'true',
      max: '0',
      min: '',
    };
    expect(mergeQuries(src, target)).toEqual({
      ...src,
      ...target,
      min: src.min,
    });
  });
  it('우측 객체의 필드 값이 null, undefined 혹은 문자열이 아니라면 해당 필드의 병합은 무시 한다.', () => {
    const src: TestModel = {
      age: '14',
      min: '12',
      name: '하하',
    };
    const target: TestModel = {
      isFree: 'true',
      max: null,
      min: 0,
      name: undefined,
    };
    expect(mergeQuries(src, target)).toEqual({
      ...src,
      isFree: target.isFree,
    });
  });
});

describe('toStringField', () => {
  interface TestModel {
    name?: string;
    age?: number | null;
    oops?: Record<string, any>;
    isFree?: boolean;
  }
  it('객체의 필드를 모두 문자열로 바꾸어 새로운 객체로 반환한다.', () => {
    const src: TestModel = {
      age: 25,
      isFree: true,
      name: '쏜쌤',
    };

    expect(toStringField(src)).toEqual({
      age: `${src.age as number}`,
      isFree: 'true',
      name: src.name,
    });
  });
  it('필드 내 boolean 값이 false 면 빈 문자열로 바꾼다.', () => {
    const src: TestModel = {
      age: 25,
      isFree: false,
      name: '쏜쌤',
    };

    expect(toStringField(src)).toEqual({
      age: `${src.age as number}`,
      isFree: '',
      name: src.name,
    });
  });
  it('필드가 비어있거나 null 이면 변환 시 무시한다.', () => {
    expect(
      toStringField({
        counts: 66788,
      }),
    ).toEqual({
      counts: '66788',
    });
    expect(
      toStringField({
        counts: null,
      }),
    ).toEqual({});
    expect(
      toStringField({
        counts: undefined,
      }),
    ).toEqual({});
    expect(
      toStringField({
        counts: NaN,
      }),
    ).toEqual({});
    expect(
      toStringField({
        counts: Infinity,
      }),
    ).toEqual({});
  });
  it('필드에 객체나 배열이 포함 되어 있다면 무시한다.', () => {
    const src: TestModel = {
      age: 30,
      oops: {
        calls: 46,
        hoho: '호호',
        values: [12, 12],
      },
    };

    expect(toStringField(src)).toEqual({
      age: '30',
    });

    const src2: TestModel = {
      age: 0,
      name: '',
      oops: [55, 88],
    };

    expect(toStringField(src2)).toEqual({
      age: '0',
      name: '',
    });
  });
});
