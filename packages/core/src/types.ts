import type {
  BannerAdStyle,
  CustomAdStyle,
  NavigateToMiniProgramOptions,
  RewardedVideoCloseResult
} from './wechat'

/**
 * 单个激励视频广告位配置。
 */
export interface RewardedVideoPlacementOptions {
  /**
   * 微信后台配置的激励视频广告 adUnitId。
   */
  adUnitId: string

  /**
   * 是否禁用微信原生的 fallback 分享页。
   */
  disableFallbackSharePage?: boolean
}

/**
 * 激励视频广告位映射表。
 *
 * key 建议使用业务语义名称，例如 levelReward、saveUnlock。
 * value 可以直接传 adUnitId，也可以传包含原生创建参数的对象。
 */
export interface RewardedVideoPlacementMap {
  [placementKey: string]: string | RewardedVideoPlacementOptions
}

/**
 * 插屏广告位映射表。
 *
 * key 建议使用业务语义名称，例如 levelStart、gameOver。
 * value 为对应的微信广告位 adUnitId。
 */
export interface InterstitialPlacementMap {
  [placementKey: string]: string
}

/**
 * 单个原生模板广告位配置。
 */
export interface CustomAdPlacementOptions {
  /**
   * 微信后台配置的原生模板广告 adUnitId。
   */
  adUnitId: string

  /**
   * 当前广告位的样式配置。
   * 未传时会回退到 SDK 内置默认样式。
   */
  style?: CustomAdStyle
}

/**
 * 原生模板广告位映射表。
 */
export interface CustomAdPlacementMap {
  [placementKey: string]: CustomAdPlacementOptions
}

/**
 * 单个 Banner 广告位配置。
 */
export interface BannerAdPlacementOptions {
  /**
   * 广告后台配置的 Banner 广告 adUnitId。
   */
  adUnitId: string

  /**
   * Banner 广告位样式配置。
   */
  style?: BannerAdStyle
}

/**
 * Banner 广告位映射表。
 */
export interface BannerAdPlacementMap {
  [placementKey: string]: BannerAdPlacementOptions
}

/**
 * 微信小游戏 SDK 初始化配置。
 */
export interface WechatAdSdkInitOptions {
  platform: 'wechat'

  /** 激励视频广告位表。value 可为 adUnitId 字符串或完整配置对象。 */
  rewardedVideoAds?: RewardedVideoPlacementMap

  /** 插屏广告位表。value 为 adUnitId。 */
  interstitialAds?: InterstitialPlacementMap

  /** 原生模板广告位表（仅微信支持）。 */
  customAds?: CustomAdPlacementMap

  /** Banner 广告位表。 */
  bannerAds?: BannerAdPlacementMap

  /** 预留调试开关。 */
  debug?: boolean
}

/**
 * 抖音小游戏 SDK 初始化配置。
 */
export interface DouyinAdSdkInitOptions {
  platform: 'douyin'

  /** 激励视频广告位表。value 为 adUnitId 字符串。 */
  rewardedVideoAds?: InterstitialPlacementMap

  /** 插屏广告位表。value 为 adUnitId。 */
  interstitialAds?: InterstitialPlacementMap

  /** Banner 广告位表。 */
  bannerAds?: BannerAdPlacementMap

  /** 预留调试开关。 */
  debug?: boolean
}

/**
 * SDK 初始化配置，微信与抖音使用各自的类型，通过 platform 字段区分。
 */
export type AdSdkInitOptions = WechatAdSdkInitOptions | DouyinAdSdkInitOptions

/**
 * 统一错误结构。
 */
export interface StandardizedError {
  /**
   * 规范化错误码。
   */
  code: string

  /**
   * 可直接展示或记录的错误消息。
   */
  message: string

  /**
   * 微信原始错误对象或底层异常。
   */
  raw?: unknown
}

/**
 * 激励视频展示结果。
 */
export interface RewardedVideoShowResult {
  /**
   * 用户是否完成观看。
   * 与微信原生回调里的 isEnded 语义一致。
   */
  rewarded: boolean

  /**
   * 用户是否完整观看。
   * 为了贴近微信原生语义，和 rewarded 保持相同值。
   */
  completed: boolean

  /**
   * 是否应该发放奖励。
   * 业务代码推荐优先使用这个字段判断发奖。
   */
  shouldReward: boolean

  /**
   * 本次展示对应的业务广告位 key。
   */
  placementKey: string

  /**
   * 微信原始关闭回调结果。
   */
  raw?: RewardedVideoCloseResult
}

/**
 * 当前运行时的能力快照。
 */
export interface CapabilitySnapshot {
  wechatMiniGame: boolean
  douyinMiniGame: boolean
  rewardedVideo: boolean
  interstitial: boolean
  bannerAd: boolean
  customAd: boolean
  miniProgramNavigation: boolean
}

/**
 * 跳转小程序参数。
 */
export interface MiniProgramNavigationOptions extends NavigateToMiniProgramOptions {}
