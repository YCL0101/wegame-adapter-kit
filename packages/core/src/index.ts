export { CapabilityDetector } from './capability-detector'
export {
  ADAPTER_ERROR_CODES,
  AdapterError,
  createAdapterError,
  normalizeError
} from './errors'
export {
  canCreateBannerAd,
  canCreateCustomAd,
  canCreateInterstitialAd,
  canCreateRewardedVideoAd,
  canNavigateToMiniProgram,
  getAdRuntime,
  getMiniGamePlatform,
  getTt,
  getWx,
  isDouyinMiniGame,
  isWechatMiniGame,
  requireInitialized,
  validateInitOptions
} from './guards'
export type { MiniGamePlatform } from './guards'
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
  DouyinAdSdkInitOptions,
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
  TtError,
  TtInterstitialAd,
  TtMiniGame,
  TtRewardedVideoAd,
  TtRewardedVideoCloseResult
} from './douyin'
