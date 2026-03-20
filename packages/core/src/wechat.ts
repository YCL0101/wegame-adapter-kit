export interface WxError {
  errCode?: number
  errMsg?: string
  [key: string]: unknown
}

export interface RewardedVideoLoadResult {
  useFallbackSharePage?: boolean
}

export interface RewardedVideoCloseResult {
  isEnded?: boolean
}

export interface RewardedVideoAd {
  load(): Promise<void>
  show(): Promise<void>
  onLoad(callback: (result?: RewardedVideoLoadResult) => void): void
  offLoad?(callback: (result?: RewardedVideoLoadResult) => void): void
  onError(callback: (error: WxError) => void): void
  offError?(callback: (error: WxError) => void): void
  onClose(callback: (result?: RewardedVideoCloseResult) => void): void
  offClose?(callback: (result?: RewardedVideoCloseResult) => void): void
  destroy?(): void
}

export interface InterstitialAd {
  load?(): Promise<void>
  show(): Promise<void>
  onLoad?(callback: () => void): void
  offLoad?(callback: () => void): void
  onError?(callback: (error: WxError) => void): void
  offError?(callback: (error: WxError) => void): void
  onClose?(callback: () => void): void
  offClose?(callback: () => void): void
  destroy?(): void
}

export interface CustomAdStyle {
  left: number
  top: number
  width: number
  fixed?: boolean
}

export interface BannerAdStyle {
  left?: number
  top?: number
  width?: number
  height?: number
}

export interface BannerAd {
  style: BannerAdStyle
  show(): Promise<void>
  hide(): void
  destroy(): void
  onLoad(callback: () => void): void
  offLoad?(callback: () => void): void
  onError(callback: (error: WxError) => void): void
  offError?(callback: (error: WxError) => void): void
  onResize(callback: (result: { width: number; height: number }) => void): void
  offResize?(
    callback: (result: { width: number; height: number }) => void
  ): void
}

export interface CustomAd {
  show(): Promise<void> | void
  hide(): void
  onLoad?(callback: () => void): void
  offLoad?(callback: () => void): void
  onError?(callback: (error: WxError) => void): void
  offError?(callback: (error: WxError) => void): void
  onClose?(callback: () => void): void
  offClose?(callback: () => void): void
  onHide?(callback: () => void): void
  offHide?(callback: () => void): void
  destroy?(): void
}

export interface NavigateToMiniProgramOptions {
  appId: string
  path?: string
  extraData?: Record<string, unknown>
  /** 微信：develop / trial / release；抖音：current / latest */
  envVersion?: 'develop' | 'trial' | 'release' | 'current' | 'latest'
}

export interface WxMiniGame {
  createRewardedVideoAd(options: {
    adUnitId: string
    disableFallbackSharePage?: boolean
  }): RewardedVideoAd
  createInterstitialAd?(options: { adUnitId: string }): InterstitialAd
  createBannerAd?(options: {
    adUnitId: string
    style?: BannerAdStyle
  }): BannerAd
  createCustomAd?(options: { adUnitId: string; style: CustomAdStyle }): CustomAd
  navigateToMiniProgram(
    options: NavigateToMiniProgramOptions & {
      success?: () => void
      fail?: (error: WxError) => void
    }
  ): void
}
