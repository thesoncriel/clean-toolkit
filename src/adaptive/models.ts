import { ComponentType } from 'react';

/**
 * 기기별 사이즈를 정의한 것.
 *
 * 사이즈 참고:
 * https://stackoverflow.com/questions/6370690/media-queries-how-to-target-desktop-tablet-and-mobile
 */
export enum DefaultDeviceSizeEnum {
  MOBILE_SM = 320,
  MOBILE = 481,
  TABLET_SM = 641,
  TABLET = 961,
  DESKTOP_SM = 1025,
  DESKTOP = 1280,
}

/**
 * user agent 제공자의 설정 옵션
 */
export interface UserAgentConfigureOptions {
  /**
   * 모바일 환경인지 판단하는 조건 함수
   */
  mobile?: (ua: string) => boolean;
  /**
   * 태블릿 환경인지 판단하는 조건 함수
   */
  tablet?: (ua: string) => boolean;
  /**
   * IOS 환경인지 판단하는 조건 함수
   */
  ios?: (ua: string) => boolean;
  /**
   * 네이티브앱(웹뷰) 환경인지를 판단하는 조건 함수
   */
  native?: (ua: string) => boolean;
}

export interface UserAgentService {
  /**
   * user agent 를 이용하여 각 플랫폼을 판별하는 조건 함수를 설정한다.
   *
   * @param options 조건 함수 묶음
   */
  configure(options: UserAgentConfigureOptions): void;
  /**
   * user agent 정보를 설정 한다.
   * 설정하는 장소는 Next js SSR 기준으로 App.getInitialProps 이다.
   *
   * client side 에서 동작 시 무시한다.
   *
   * @param ua 적용 할 user agent 정보
   */
  setUserAgent(ua?: string): void;

  /**
   * user-agent 정보를 이용하여 단순 모바일인지 여부를 확인한다.
   *
   * 모바일 기종: 안드로이드 계열 전 기종, ios 를 사용하는 모든 기종 (아이폰, 아이패드, 아이팟 등)
   */
  isMobile(): boolean;

  /**
   * user-agent 정보를 이용하여 태블릿 여부를 판단한다.
   *
   * TODO: 아직 Android 태블릿 여부는 확인이 불가하다. (ipad 만 가능)
   */
  isTablet(): boolean;

  /**
   * user-agent 정보를 이용하여 ios 여부를 판단한다.
   */
  isIOS(): boolean;

  /**
   * user-agent 정보를 이용하여 native app 여부를 판단한다.
   */
  isNativeApp(): boolean;

  /**
   * 현재 구동 환경이 서버인지를 확인한다.
   */
  isServer(): boolean;
}

/**
 * 디바이스 감지기 컨텍스트에 대한 설정값
 */
export interface DeviceDetectProviderProps {
  /**
   * 태블릿 화면의 최소 크기 조건.
   *
   * 화면이 이 크기 미만일 경우 모바일로 간주된다.
   *
   * @default 641
   * @see DefaultDeviceSizeEnum.TABLET_SM
   */
  tablet?: number;
  /**
   * 데스크탑 화면의 최소 크기 조건.
   *
   * 화면이 이 크기 미만일 경우 태블릿으로 간주된다.
   *
   * @default 1025
   * @see DefaultDeviceSizeEnum.DESKTOP_SM
   */
  desktop?: number;
}

/**
 * 적응형 렌더링에서 쓰이는 설정 모델.
 */
export interface AdaptiveRenderSettingModel<T> {
  /**
   * 네이티브 모바일앱 에서만 보여질 컴포넌트.
   *
   * 다른 조건들 대비 우선순위가 가장 높다.
   *
   * 미설정 시 앱에서 보여지지 않는다.
   */
  native?: ComponentType<T>;
  /**
   * 모바일 에서만 보여질 컴포넌트.
   *
   * 미설정 시 모바일에서 보여지지 않는다.
   */
  mobile?: ComponentType<T>;
  /**
   * 태블릿에서만 보여질 컴포넌트.
   *
   * 미설정 시 태블릿에서 보여지지 않는다.
   */
  tablet?: ComponentType<T>;
  /**
   * 데스크탑에서만 보여질 컴포넌트.
   *
   * 미설정  desktop 에서 보여지지 않는다.
   */
  desktop?: ComponentType<T>;
}
