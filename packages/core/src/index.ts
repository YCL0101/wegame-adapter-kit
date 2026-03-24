export { CapabilityDetector } from './capability-detector'
export {
  ADAPTER_ERROR_CODES,
  AdapterError,
  createAdapterError,
  normalizeError
} from './errors'
export {
  canCheckDouyinScene,
  canCreateBannerAd,
  canCreateCustomAd,
  canCreateInterstitialAd,
  canCreateRewardedVideoAd,
  canNavigateToMiniProgram,
  canListenDouyinOnShow,
  canNavigateToDouyinScene,
  getDouyinSidebarScene,
  getAdRuntime,
  getMiniGamePlatform,
  getTt,
  getWx,
  isDouyinSidebarLaunch,
  isDouyinMiniGame,
  isWechatMiniGame,
  requireInitialized,
  validateInitOptions
} from './guards'
export type { MiniGamePlatform } from './guards'
export { DouyinSidebar, douyinSidebar } from './douyin-sidebar'
export { MiniProgramNavigator } from './mini-program-navigator'
export { BannerAdManager } from './managers/banner-manager'
export { CustomAdManager } from './managers/custom-ad-manager'
export { InterstitialManager } from './managers/interstitial-manager'
export { RewardedVideoManager } from './managers/rewarded-video-manager'
export { adSdk, createAdSdk, WegameAdapterKit } from './sdk'
export type {
  AdSdkInitOptions,
  BannerAdPlacementMap,
  BannerAdPlacementOptions,
  CapabilitySnapshot,
  CustomAdPlacementMap,
  CustomAdPlacementOptions,
  DouyinSidebarAvailabilityOptions,
  DouyinAdSdkInitOptions,
  DouyinSidebarLaunchState,
  DouyinSidebarNavigationOptions,
  InterstitialPlacementMap,
  MiniProgramNavigationOptions,
  RewardedVideoPlacementMap,
  RewardedVideoPlacementOptions,
  RewardedVideoShowResult,
  StandardizedError,
  WechatAdSdkInitOptions
} from './types'
export type {
  BannerAd,
  BannerAdStyle,
  CustomAd,
  CustomAdStyle,
  InterstitialAd,
  NavigateToMiniProgramOptions,
  RewardedVideoAd,
  RewardedVideoCloseResult,
  RewardedVideoLoadResult,
  WxError,
  WxMiniGame
} from './wechat'
export type {
  TtBannerAd,
  TtBannerAdStyle,
  TtCheckSceneOptions,
  TtCheckSceneSuccessResult,
  TtError,
  TtInterstitialAd,
  TtLaunchOptions,
  TtMiniGame,
  TtNavigateToSceneOptions,
  TtRewardedVideoAd,
  TtRewardedVideoCloseResult
} from './douyin'
