describe('serializeParams', () => {
  it('객체를 주면 URL 호출에 사용가능한 쿼리 스트링을 만든다.', () => {
    const mockData = {
      age: 1234,
      keyword: '',
      name: '하하',
      youth: true,
      zero: 0,
    };
    expect(serializeParams(mockData)).toEqual(
      `age=${mockData.age}&keyword=${
        mockData.keyword
      }&name=${encodeURIComponent(mockData.name)}&youth=${
        mockData.youth ? 'true' : 'false'
      }&zero=${mockData.zero}`,
    );
  });
  it('객체 안에 null 값은 empty string으로 변환하고 undefined 값은 무시한다.', () => {
    const mockData = {
      bar: null,
      foo: undefined,
    };
    expect(serializeParams(mockData)).toEqual('bar=');
  });
  it('객체 안에 배열이 있을 경우 쉼표로 연결된 값으로 바꿔준다.', () => {
    const mockData = {
      age: 1234,
      cates: ['haha', 'hoho', 'hoxy'],
      ids: [123, 567, 998],
      kors: ['하하', '호호', '히히'],
      name: '쏜쌤이다',
      youth: true,
    };
    expect(serializeParams(mockData)).toEqual(
      `age=1234&cates=haha,hoho,hoxy&ids=123,567,998&kors=${mockData.kors
        .map((kor) => encodeURIComponent(kor))
        .join(',')}&name=${encodeURIComponent(mockData.name)}&youth=${
        mockData.youth ? 'true' : 'false'
      }`,
    );
  });
  it('객체가 비어있거나 의미 없는 값일 경우 빈 문자열을 되돌려 준다.', () => {
    expect(serializeParams(null)).toBe('');
    expect(serializeParams(undefined)).toBe('');
    expect(serializeParams({})).toBe('');
  });
});

describe('mergeUrlQuery', () => {
  it('기본 주소에 파리미터 객체를 직렬화하여 새로운 주소를 만든다.', () => {
    const domain = 'https://www.skbt.co.kr';
    const domain2 = '/spider/man/jjang';
    const query = {
      age: 12,
      falsy: false,
      kor: '북치기박치기',
      name: 'haha',
      old: true,
    };
    expect(mergeUrlQuery(domain, query)).toBe(
      `${domain}?age=12&falsy=false&kor=${encodeURIComponent(
        query.kor,
      )}&name=haha&old=true`,
    );
    expect(mergeUrlQuery(domain2, query)).toBe(
      `${domain2}?age=12&falsy=false&kor=${encodeURIComponent(
        query.kor,
      )}&name=haha&old=true`,
    );
  });
  it('기본 주소에 이미 파라미터가 포함되어 있다면, 그 뒤에 파라미터 내용을 추가로 붙인다.', () => {
    const domain = 'https://www.skbt.co.kr?hoho=boba';
    const domain2 = '/spider/man/jjang?roll=gaja&counts=123';
    const query = {
      age: 12,
      falsy: false,
      kor: '북치기박치기',
      name: 'haha',
      old: true,
    };

    expect(mergeUrlQuery(domain, query)).toBe(
      `${domain}&age=12&falsy=false&kor=${encodeURIComponent(
        query.kor,
      )}&name=haha&old=true`,
    );

    expect(mergeUrlQuery(domain2, query)).toBe(
      `${domain2}&age=12&falsy=false&kor=${encodeURIComponent(
        query.kor,
      )}&name=haha&old=true`,
    );
  });
  it('쿼리가 주어지지 않는다면 기본 주소만 되돌려준다.', () => {
    const domain = 'https://www.skbt.co.kr';
    expect(mergeUrlQuery(domain)).toBe(domain);
  });
  it('기본 주소가 비어있거나 의미 없을 경우 빈 값을 되돌려준다.', () => {
    expect(mergeUrlQuery('')).toBe('');
    expect(mergeUrlQuery(null)).toBe('');
    expect(mergeUrlQuery()).toBe('');
    expect(mergeUrlQuery(undefined)).toBe('');
  });
});
