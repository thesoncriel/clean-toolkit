/**
 * 목록 형태의 응답을 가져오는 API호출 시 쓰이는 기본 파라미터.
 */
export interface ListQueryParams {
  /**
   * 페이징 시 넘길 데이터 개수
   */
  skip?: number;
  /**
   * 페이징 시 한번에 가져올 데이터 개수
   */
  limit?: number;
}

/**
 * 목록 형태의 응답 데이터.
 */
export interface ListRes<T> {
  /**
   * 데이터 목록
   */
  items: T[];
  /**
   * 전체 개수
   */
  totalCount: number;
}

/**
 * Backend API 호출 시 오류일 때 전달되는 오류 객체 데이터.
 */
export interface ErrorModel {
  /**
   * 상태값.
   * - 400번대: 잘못된 호출
   * - 500번대: 서버 오류
   */
  status: number;
  /**
   * 오류명
   */
  name: string;
  /**
   * 서버에서 전달되는 메시지 내용.
   */
  message: string;
}

/**
 * Backend API 호출 시 오류일 때 전달되는 응답 데이터.
 */
export interface ErrorRes<T = ErrorModel> {
  error: T;
}

/**
 * 업로드 상태를 확인할 수 있는 객체.
 */
export interface UploadStateArgs {
  /**
   * 진행도. 0~100 까지의 수치.
   */
  progress: number;
  /**
   * 업로드된 바이트수.
   */
  loaded: number;
  /**
   * 업로드 해야 할 총 바이트수.
   */
  total: number;
  /**
   * 완료여부.
   */
  completed: boolean;
}

/**
 * HTTP 프로토콜을 이용하여 비동기 통신을 수행한다.
 */
export interface HttpBaseApi {
  /**
   * GET 메서드 호출
   * @param url 호출 경로
   * @param params 전달할 파라미터
   */
  get<T = any, P = any>(url: string, params?: P): Promise<T>;
  /**
   * POST 메서드 호출
   * @param url 호출 경로. 만약 쿼리 파라미터가 포함된다면 이 곳에 추가적으로 명시 해 주어야 한다.
   * @param data body 요청으로 보낼 데이터. json 으로 바꿔서 보내게 된다.
   */
  post<T = any, P = any>(url: string, data?: P): Promise<T>;
  /**
   * PUT 메서드 호출
   * @param url 호출 경로. 만약 쿼리 파라미터가 포함된다면 이 곳에 추가적으로 명시 해 주어야 한다.
   * @param data body 요청으로 보낼 데이터. json 으로 바꿔서 보내게 된다.
   */
  put<T = any, P = any>(url: string, data?: P): Promise<T>;
  /**
   * DELETE 메서드 호출
   * @param url 호출 경로
   * @param params 전달할 파라미터
   */
  delete<T = any, P = any>(url: string, params?: P): Promise<T>;
  /**
   * POST 메서드로 업로드 한다.
   * @param url 업로드 경로
   * @param data 업로드에 쓰이는 데이터
   * @param progCallback 업로드 상황을 보내주는 콜백
   */
  postUpload<T = any, P = any>(
    url: string,
    data: P,
    progCallback?: (args: UploadStateArgs) => void
  ): Promise<T>;
  /**
   * PUT 메서드로 업로드 한다.
   * @param url 업로드 경로
   * @param data 업로드에 쓰이는 데이터
   * @param progCallback 업로드 상황을 보내주는 콜백
   */
  putUpload<T = any, P = any>(
    url: string,
    data: P,
    progCallback?: (args: UploadStateArgs) => void
  ): Promise<T>;
  /**
   * GET 메서드로 파일을 비동기로 가져온다.
   * @param url 파일을 가져올 경로
   * @param params 전달할 파라미터
   * @param filename 파일이 받아졌을 때 쓰여질 파일명.
   */
  getFile<P = any>(url: string, params?: P, filename?: string): Promise<File>;
}
