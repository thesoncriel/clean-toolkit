import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import uaService from './user-agent.service';
import { DeviceDetectProviderProps, DefaultDeviceSizeEnum } from './models';

function getIsMobile(isServer: boolean, tabletSize: number): boolean {
  if (isServer) {
    try {
      return uaService.isMobile();
    } catch (error) {
      //
    }
    return false;
  }

  return uaService.isMobile() || window.innerWidth < tabletSize;
}

function getIsTablet(
  isServer: boolean,
  tabletSize: number,
  desktopSize: number
): boolean {
  if (isServer) {
    try {
      return uaService.isTablet();
    } catch (error) {
      //
    }
    return false;
  }
  return (
    uaService.isTablet() ||
    (window.innerWidth >= tabletSize && window.innerWidth <= desktopSize - 1)
  );
}

const DeviceDetectContext = createContext([
  getIsMobile(uaService.isServer(), DefaultDeviceSizeEnum.TABLET_SM),
  getIsTablet(
    uaService.isServer(),
    DefaultDeviceSizeEnum.TABLET_SM,
    DefaultDeviceSizeEnum.DESKTOP_SM
  ),
  uaService.isNativeApp(),
]);

const { Provider: DeviceDetectContextProvider } = DeviceDetectContext;

/**
 * 컨텍스트: UserAgent 및 Resizing 여부에 따른 태블릿/모바일 여부를 판별 해 준다.
 *
 * 지정된 곳 이외에서는 사용치 않는다.
 *
 * 내부적으로 window.mediaQuery API를 사용한다.
 *
 * @see https://stackoverflow.com/questions/29046324/whats-the-most-reliable-way-to-integrate-javascript-with-media-queries
 * @see https://jsperf.com/matchmedia-vs-resize/3
 */
export const AdaptiveProvider: FC<DeviceDetectProviderProps> = ({
  tablet = DefaultDeviceSizeEnum.TABLET_SM,
  desktop = DefaultDeviceSizeEnum.DESKTOP_SM,
  children,
}) => {
  const isServer = uaService.isServer();
  const [isMobile, setIsMobile] = useState(getIsMobile(isServer, tablet));
  const [isTablet, setIsTablet] = useState(
    getIsTablet(isServer, tablet, desktop)
  );
  const isNative = useMemo(uaService.isNativeApp, []);

  useEffect(() => {
    if (isServer) {
      return;
    }

    const mqMobile = window.matchMedia(
      `screen and (max-width: ${tablet - 1}px)`
    );
    const mqTablet = window.matchMedia(
      `screen and (min-width: ${tablet}px) and (max-width: ${desktop - 1}px)`
    );

    const handleResizeForMobile = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    const handleResizeForTablet = (e: MediaQueryListEvent) => {
      setIsTablet(e.matches);
    };

    mqMobile.addListener(handleResizeForMobile);
    mqTablet.addListener(handleResizeForTablet);

    return () => {
      mqMobile.removeListener(handleResizeForMobile);
      mqTablet.removeListener(handleResizeForTablet);
    };
  }, []);

  return (
    <DeviceDetectContextProvider value={[isMobile, isTablet, isNative]}>
      {children}
    </DeviceDetectContextProvider>
  );
};

export const useIsMobile = () => useContext(DeviceDetectContext)[0];
export const useIsTablet = () => useContext(DeviceDetectContext)[1];
export const useIsNative = () => useContext(DeviceDetectContext)[2];
