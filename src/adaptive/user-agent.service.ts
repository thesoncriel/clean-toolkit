import { UserAgentConfigureOptions, UserAgentService } from './models';

const isServer = typeof window === 'undefined';
let userAgent = isServer ? '' : window.navigator.userAgent;
let privateOptions: Required<UserAgentConfigureOptions> = {
  mobile: (ua: string) => /iPhone|iPod|Android/.test(ua),
  tablet: (ua: string) => /iPad/.test(ua),
  ios: (ua: string) => /iPad|iPhone|iPad/.test(ua),
  native: (ua: string) => /NaviveApp/.test(ua),
};

const userAgentService: UserAgentService = {
  configure(options: UserAgentConfigureOptions) {
    if (!options) {
      return;
    }
    privateOptions = {
      ...privateOptions,
      ...options,
    };
  },
  setUserAgent(ua?: string) {
    if (isServer && ua) {
      userAgent = ua;
    }
  },
  isMobile() {
    const ua = userAgent;

    if (!ua) {
      return false;
    }

    return privateOptions.mobile(ua);
  },
  isTablet() {
    const ua = userAgent;

    if (!ua) {
      return false;
    }

    return privateOptions.tablet(ua);
  },
  isIOS() {
    const ua = userAgent;

    if (!ua) {
      return false;
    }

    return privateOptions.ios(ua);
  },
  isNativeApp() {
    const ua = userAgent;

    if (!ua) {
      return false;
    }

    return privateOptions.native(ua);
  },
  isServer() {
    return isServer;
  },
};

export default userAgentService;
