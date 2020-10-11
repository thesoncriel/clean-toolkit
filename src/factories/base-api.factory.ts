/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/interface-name-prefix */
import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import {
  ErrorModel,
  ErrorRes,
  HashMap,
  UploadStateArgs,
  HttpBaseApi,
} from '../models';
import { getFileName, isServer } from '../util';

// export type HttpApiMethod = <T = any>(url: string, params?: any) => Promise<T>;

function getError(message = '오류', status = 400): ErrorModel {
  return {
    name: '',
    message,
    status,
  };
}

const axiosResponseToData = <T>(axiosRes: AxiosResponse<T>) => axiosRes.data;
const axiosErrorResToData = (err: AxiosError) => {
  const res: AxiosResponse<ErrorRes> = err.response!;

  if (isServer() && err) {
    throw err;
  }

  if (!res) {
    throw getError();
  }

  if (!res.data || !res.data.error) {
    throw getError(res.statusText, res.status);
  }

  throw res.data.error;
};

const uploadCommon = (
  baseUrl: string,
  headerProvider: () => HashMap<string>
) => <T>(
  method: Method,
  url: string,
  data: any,
  progCallback?: (args: UploadStateArgs) => void
) => {
  try {
    const argsProgress: UploadStateArgs = {
      progress: 0,
      loaded: 0,
      total: 0,
      completed: false,
    };

    const headers = headerProvider();

    return axios(baseUrl + url, {
      method,
      headers,
      data,
      onUploadProgress: (progressEvent: any) => {
        const args = argsProgress;
        args.progress =
          Math.floor((progressEvent.loaded * 1000) / progressEvent.total) / 10;
        args.loaded = progressEvent.loaded;
        args.total = progressEvent.total;

        if (progCallback) {
          progCallback(args);
        }
      },
    })
      .then((res: any) => axiosResponseToData<T>(res))
      .catch(axiosErrorResToData);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Backend 에서 API를 호출하는 서비스를 생성한다.
 * @param baseUrl 현재 서비스에서 API 호출 시 필요한 도메인 및 하위 경로를 정의 한다.
 * @param headerProvider 헤더 제공자를 주입한다.
 */
export const apiFactory = (
  baseUrl: string,
  headerProvider: () => HashMap<string> = () => ({})
): HttpBaseApi => {
  const fnUploadCommon = uploadCommon(baseUrl, headerProvider);

  return {
    get<T>(url: string, params: any = null): Promise<T> {
      try {
        const headers = headerProvider();

        return axios
          .get<T>(baseUrl + url, {
            headers,
            params,
          })
          .then(axiosResponseToData)
          .catch(axiosErrorResToData);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    post<T>(url: string, data: any = null): Promise<T> {
      try {
        const headers = headerProvider();

        return axios
          .post<T>(baseUrl + url, data, {
            headers,
          })
          .then(axiosResponseToData)
          .catch(axiosErrorResToData);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    put<T>(url: string, data: any = null): Promise<T> {
      try {
        const headers = headerProvider();

        return axios
          .put<T>(baseUrl + url, data, {
            headers,
          })
          .then(axiosResponseToData)
          .catch(axiosErrorResToData);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    delete<T>(url: string, params: any = null): Promise<T> {
      try {
        const headers = headerProvider();

        return axios
          .delete(baseUrl + url, {
            headers,
            params,
          })
          .then(axiosResponseToData)
          .catch(axiosErrorResToData);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    postUpload<T>(
      url: string,
      data: any,
      progCallback?: (args: UploadStateArgs) => void
    ): Promise<T> {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key];

        if (value instanceof Array) {
          value.forEach((val) => {
            const file: File = val;
            formData.append(key, file, file.name);
          });
        } else {
          formData.set(key, value);
        }
      });

      return fnUploadCommon('post', url, formData, progCallback);
    },
    putUpload<T>(
      url: string,
      data: any,
      progCallback?: (args: UploadStateArgs) => void
    ): Promise<T> {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key];

        if (value instanceof Array) {
          value.forEach((val) => {
            const file: File = val;
            formData.append(key, file, file.name);
          });
        } else {
          formData.set(key, value);
        }
      });

      return fnUploadCommon('put', url, formData, progCallback);
    },
    getFile(url: string, params?: any, filename?: string): Promise<File> {
      try {
        const headers = headerProvider();

        return axios
          .get<Blob>(baseUrl + url, {
            headers,
            params,
            responseType: 'blob',
          })
          .then(axiosResponseToData)
          .then((blob) => new File([blob], filename || getFileName(url)))
          .catch(axiosErrorResToData);
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
};
