/**
 * 抖音小游戏广告与能力的类型定义。
 *
 * 抖音小游戏通过全局 `tt` 对象暴露 API，接口结构与微信 `wx` 高度一致，
 * 但部分能力存在差异（如 Banner 广告、激励视频多例模式）。
 */

export interface TtError {
  errCode?: number
  errMsg?: string
  errorCode?: number
  [key: string]: unknown
}

/**
 * 抖音小游戏 onShow 返回的启动参数。
 *
 * 侧边栏奖励场景需要依赖最新一次 onShow 返回值中的启动来源信息，
 * 以判断当前是否属于“从侧边栏启动小游戏”的链路。
 */
export interface TtLaunchOptions {
  /** 启动来源，平台在侧边栏相关拉起场景下会回传对应标记。 */
  launch_from?: string
  /** 启动位置，平台在不同宿主入口下会回传不同 location。 */
  location?: string
  scene?: string | number
  query?: Record<string, string | undefined>
  referrerInfo?: Record<string, unknown>
  [key: string]: unknown
}

export interface TtCheckSceneSuccessResult {
  isExist: boolean
  [key: string]: unknown
}

export interface TtCheckSceneOptions {
  scene: string
  success?: (result: TtCheckSceneSuccessResult) => void
  fail?: (error: TtError) => void
}

export interface TtNavigateToSceneOptions {
  scene: string
  success?: (result: { errMsg?: string }) => void
  fail?: (error: TtError) => void
}

export interface TtRewardedVideoCloseResult {
  /** 视频是否被完整播放后关闭。 */
  isEnded?: boolean
  /**
   * 用户观看广告的次数（multiton 多例模式下返回）。
   */
  count?: number
}

export interface TtRewardedVideoAd {
  load(): Promise<void>
  show(): Promise<void>
  onLoad(callback: () => void): void
  offLoad?(callback: () => void): void
  onError(callback: (error: TtError) => void): void
  offError?(callback: (error: TtError) => void): void
  onClose(callback: (result?: TtRewardedVideoCloseResult) => void): void
  offClose?(callback: (result?: TtRewardedVideoCloseResult) => void): void
  destroy?(): void
}

export interface TtInterstitialAd {
  load(): Promise<void>
  show(): Promise<void>
  onLoad?(callback: () => void): void
  offLoad?(callback: () => void): void
  onError?(callback: (error: TtError) => void): void
  offError?(callback: (error: TtError) => void): void
  onClose?(callback: () => void): void
  offClose?(callback: () => void): void
  destroy?(): void
}

export interface TtBannerAdStyle {
  left?: number
  top?: number
  width?: number
  height?: number
}

export interface TtBannerAd {
  style: TtBannerAdStyle
  show(): Promise<void>
  hide(): void
  destroy(): void
  onLoad(callback: () => void): void
  offLoad?(callback: () => void): void
  onError(callback: (error: TtError) => void): void
  offError?(callback: (error: TtError) => void): void
  onResize(callback: (result: { width: number; height: number }) => void): void
  offResize?(
    callback: (result: { width: number; height: number }) => void
  ): void
}

export interface TtNavigateToMiniProgramOptions {
  appId: string
  path?: string
  extraData?: Record<string, unknown>
  /**
   * 要打开的小程序版本。
   * current -- 线上版；latest -- 测试版。
   * 仅在当前小程序为开发版或测试版时此参数有效。
   */
  envVersion?: 'current' | 'latest'
  success?: (result: { errMsg: string }) => void
  fail?: (error: TtError) => void
  complete?: () => void
}

export interface TtMiniGame {
  createRewardedVideoAd(options: {
    adUnitId: string
    multiton?: boolean
    multitonRewardMsg?: string[]
    multitonRewardTimes?: number
    progressTip?: boolean
  }): TtRewardedVideoAd
  createInterstitialAd(options: { adUnitId: string }): TtInterstitialAd
  createBannerAd(options: {
    adUnitId: string
    style?: TtBannerAdStyle
  }): TtBannerAd
  navigateToMiniProgram(options: TtNavigateToMiniProgramOptions): void
  onShow?(callback: (options: TtLaunchOptions) => void): void
  offShow?(callback: (options: TtLaunchOptions) => void): void
  checkScene?(options: TtCheckSceneOptions): void
  navigateToScene?(options: TtNavigateToSceneOptions): void
}
