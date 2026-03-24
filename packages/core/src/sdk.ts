import { CapabilityDetector } from './capability-detector'
import { ADAPTER_ERROR_CODES, createAdapterError } from './errors'
import {
  isDouyinMiniGame,
  isWechatMiniGame,
  requireInitialized,
  validateInitOptions
} from './guards'
import { MiniProgramNavigator } from './mini-program-navigator'
import { DouyinSidebar } from './douyin-sidebar'
import { BannerAdManager } from './managers/banner-manager'
import { CustomAdManager } from './managers/custom-ad-manager'
import { InterstitialManager } from './managers/interstitial-manager'
import { RewardedVideoManager } from './managers/rewarded-video-manager'
import type {
  AdSdkInitOptions,
  CapabilitySnapshot,
  DouyinSidebarAvailabilityOptions,
  DouyinSidebarLaunchState,
  DouyinSidebarNavigationOptions,
  MiniProgramNavigationOptions,
  RewardedVideoShowResult
} from './types'
import type {
  RewardedVideoCloseResult,
  RewardedVideoLoadResult,
  WxError
} from './wechat'

/**
 * 小游戏广告与能力统一接入 SDK（支持微信、抖音小游戏）。
 *
 * 通过一个实例统一管理激励视频、插屏广告、原生模板广告、Banner 广告，以及跳转小程序能力。
 */
export class WegameAdapterKit {
  private options?: AdSdkInitOptions
  // SDK 通过聚合管理器收口广告与跳转能力，对外只暴露稳定接口。
  private readonly rewardedVideoManager = new RewardedVideoManager(
    () => this.options
  )
  private readonly interstitialManager = new InterstitialManager(
    () => this.options
  )
  private readonly customAdManager = new CustomAdManager(() => this.options)
  private readonly bannerAdManager = new BannerAdManager(() => this.options)
  private readonly miniProgramNavigator = new MiniProgramNavigator()
  private readonly douyinSidebar = new DouyinSidebar()

  /**
   * 初始化 SDK。
   *
   * @param options 广告位、样式和平台配置。
   * @returns 当前 SDK 实例，便于链式调用。
   */
  init(options: AdSdkInitOptions): this {
    // 初始化阶段统一注入广告位和样式配置，避免业务代码散落常量。
    validateInitOptions(options)
    this.options = options

    if (
      options.platform === 'douyin' &&
      options.autoListenSidebarLaunch !== false
    ) {
      this.douyinSidebar.startListening()
    }

    return this
  }

  /**
   * 获取当前运行时能力快照。
   */
  getCapabilities(): CapabilitySnapshot {
    return CapabilityDetector.snapshot(this.options)
  }

  /**
   * 预加载所有已配置的激励视频和插屏广告位。
   */
  async preloadAll(): Promise<void> {
    const tasks: Promise<void>[] = []

    // 仅预加载已配置的能力，未配置项保持惰性创建。
    for (const placementKey of this.rewardedVideoManager.getPlacementKeys()) {
      tasks.push(this.rewardedVideoManager.load(placementKey))
    }

    for (const placementKey of this.interstitialManager.getPlacementKeys()) {
      tasks.push(this.interstitialManager.load(placementKey))
    }

    await Promise.all(tasks)
  }

  /**
   * 监听指定激励视频广告位的加载成功事件。
   *
   * 事件语义对应微信原生 rewardedVideoAd.onLoad。
   */
  onRewardedVideoLoad(
    placementKey: string,
    listener: (result?: RewardedVideoLoadResult) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.onLoad(placementKey, listener)
  }

  /**
   * 取消监听指定激励视频广告位的加载成功事件。
   */
  offRewardedVideoLoad(
    placementKey: string,
    listener: (result?: RewardedVideoLoadResult) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.offLoad(placementKey, listener)
  }

  /**
   * 监听指定激励视频广告位的关闭事件。
   *
   * 回调参数与微信原生 rewardedVideoAd.onClose 保持一致。
   */
  onRewardedVideoClose(
    placementKey: string,
    listener: (result?: RewardedVideoCloseResult) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.onClose(placementKey, listener)
  }

  /**
   * 取消监听指定激励视频广告位的关闭事件。
   */
  offRewardedVideoClose(
    placementKey: string,
    listener: (result?: RewardedVideoCloseResult) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.offClose(placementKey, listener)
  }

  /**
   * 监听指定激励视频广告位的错误事件。
   */
  onRewardedVideoError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.onError(placementKey, listener)
  }

  /**
   * 取消监听指定激励视频广告位的错误事件。
   */
  offRewardedVideoError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.rewardedVideoManager.offError(placementKey, listener)
  }

  /**
   * 预加载指定激励视频广告位。
   *
   * load 成功即可视为微信原生 load 回调成功。
   *
   * @param placementKey 激励视频广告位 key。
   */
  loadRewardedVideo(placementKey: string): Promise<void> {
    this.getOptions()
    return this.rewardedVideoManager.load(placementKey)
  }

  /**
   * 展示指定激励视频广告位。
   *
   * Promise resolve 的结果对应微信原生 onClose 回调。
   * 其中 shouldReward=true 代表可发放奖励。
   *
   * @param placementKey 激励视频广告位 key。
   * @returns 展示结果，包含是否完成观看和本次使用的广告位 key。
   */
  showRewardedVideo(placementKey: string): Promise<RewardedVideoShowResult> {
    this.getOptions()
    return this.rewardedVideoManager.show(placementKey)
  }

  /**
   * 监听指定插屏广告位的加载成功事件。
   */
  onInterstitialLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.interstitialManager.onLoad(placementKey, listener)
  }

  /**
   * 取消监听指定插屏广告位的加载成功事件。
   */
  offInterstitialLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.interstitialManager.offLoad(placementKey, listener)
  }

  /**
   * 监听指定插屏广告位的关闭事件。
   */
  onInterstitialClose(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.interstitialManager.onClose(placementKey, listener)
  }

  /**
   * 取消监听指定插屏广告位的关闭事件。
   */
  offInterstitialClose(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.interstitialManager.offClose(placementKey, listener)
  }

  /**
   * 监听指定插屏广告位的错误事件。
   */
  onInterstitialError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.interstitialManager.onError(placementKey, listener)
  }

  /**
   * 取消监听指定插屏广告位的错误事件。
   */
  offInterstitialError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.interstitialManager.offError(placementKey, listener)
  }

  /**
   * 预加载指定插屏广告位。
   *
   * load 成功即可视为微信原生 load 回调成功。
   *
   * @param placementKey 插屏广告位 key。
   */
  loadInterstitial(placementKey: string): Promise<void> {
    this.getOptions()
    return this.interstitialManager.load(placementKey)
  }

  /**
   * 展示指定插屏广告位。
   *
   * @param placementKey 插屏广告位 key。
   */
  showInterstitial(placementKey: string): Promise<void> {
    this.getOptions()
    return this.interstitialManager.show(placementKey)
  }

  /**
   * 监听指定原生模板广告位的加载成功事件。
   */
  onCustomAdLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.onLoad(placementKey, listener)
  }

  /**
   * 取消监听指定原生模板广告位的加载成功事件。
   */
  offCustomAdLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.offLoad(placementKey, listener)
  }

  /**
   * 监听指定原生模板广告位的关闭事件。
   */
  onCustomAdClose(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.onClose(placementKey, listener)
  }

  /**
   * 取消监听指定原生模板广告位的关闭事件。
   */
  offCustomAdClose(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.offClose(placementKey, listener)
  }

  /**
   * 监听指定原生模板广告位的隐藏事件。
   */
  onCustomAdHide(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.onHide(placementKey, listener)
  }

  /**
   * 取消监听指定原生模板广告位的隐藏事件。
   */
  offCustomAdHide(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.customAdManager.offHide(placementKey, listener)
  }

  /**
   * 监听指定原生模板广告位的错误事件。
   */
  onCustomAdError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.customAdManager.onError(placementKey, listener)
  }

  /**
   * 取消监听指定原生模板广告位的错误事件。
   */
  offCustomAdError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.customAdManager.offError(placementKey, listener)
  }

  /**
   * 展示指定原生模板广告位。
   *
   * @param placementKey 原生模板广告位 key。
   */
  showCustomAd(placementKey: string): Promise<void> {
    this.getOptions()
    return this.customAdManager.show(placementKey)
  }

  /**
   * 隐藏指定原生模板广告位。
   *
   * @param placementKey 原生模板广告位 key。
   */
  hideCustomAd(placementKey: string): void {
    this.getOptions()
    this.customAdManager.hide(placementKey)
  }

  /**
   * 展示指定 Banner 广告位。
   *
   * @param placementKey Banner 广告位 key。
   */
  showBannerAd(placementKey: string): Promise<void> {
    this.getOptions()
    return this.bannerAdManager.show(placementKey)
  }

  /**
   * 隐藏指定 Banner 广告位。
   *
   * @param placementKey Banner 广告位 key。
   */
  hideBannerAd(placementKey: string): void {
    this.getOptions()
    this.bannerAdManager.hide(placementKey)
  }

  /**
   * 监听指定 Banner 广告位的加载成功事件。
   */
  onBannerAdLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.bannerAdManager.onLoad(placementKey, listener)
  }

  /**
   * 取消监听 Banner 广告位的加载成功事件。
   */
  offBannerAdLoad(placementKey: string, listener: () => void): void {
    this.getOptions()
    this.bannerAdManager.offLoad(placementKey, listener)
  }

  /**
   * 监听指定 Banner 广告位的尺寸变化事件。
   */
  onBannerAdResize(
    placementKey: string,
    listener: (result: { width: number; height: number }) => void
  ): void {
    this.getOptions()
    this.bannerAdManager.onResize(placementKey, listener)
  }

  /**
   * 取消监听 Banner 广告位的尺寸变化事件。
   */
  offBannerAdResize(
    placementKey: string,
    listener: (result: { width: number; height: number }) => void
  ): void {
    this.getOptions()
    this.bannerAdManager.offResize(placementKey, listener)
  }

  /**
   * 监听指定 Banner 广告位的错误事件。
   */
  onBannerAdError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.bannerAdManager.onError(placementKey, listener)
  }

  /**
   * 取消监听 Banner 广告位的错误事件。
   */
  offBannerAdError(
    placementKey: string,
    listener: (error: WxError) => void
  ): void {
    this.getOptions()
    this.bannerAdManager.offError(placementKey, listener)
  }

  /**
   * 跳转到其他微信小程序。
   *
   * @param options 跳转参数，包含 appId、path、extraData 等信息。
   */
  navigateToMiniProgram(options: MiniProgramNavigationOptions): Promise<void> {
    this.getOptions()
    return this.miniProgramNavigator.navigate(options)
  }

  /**
   * 同步监听抖音小游戏 onShow。
   *
   * 建议在 game.js 或尽可能早的启动时机调用，确保侧边栏奖励链路可获取最新启动参数。
   */
  startDouyinSidebarListening(): void {
    this.douyinSidebar.startListening()
  }

  /**
   * 取消抖音小游戏 onShow 监听。
   */
  stopDouyinSidebarListening(): void {
    this.douyinSidebar.stopListening()
  }

  /**
   * 获取最近一次抖音小游戏启动状态快照。
   */
  getDouyinSidebarLaunchState(): DouyinSidebarLaunchState {
    return this.douyinSidebar.getLaunchState()
  }

  /**
   * 判断当前用户是否由抖音侧边栏启动小游戏。
   */
  isLaunchedFromDouyinSidebar(): boolean {
    return this.douyinSidebar.isLaunchedFromSidebar()
  }

  /**
   * 检测当前宿主是否支持跳转抖音侧边栏。
   */
  checkDouyinSidebarAvailability(
    options?: DouyinSidebarAvailabilityOptions
  ): Promise<boolean> {
    return this.douyinSidebar.checkAvailability(options)
  }

  /**
   * 跳转到抖音侧边栏。
   */
  navigateToDouyinSidebar(
    options?: DouyinSidebarNavigationOptions
  ): Promise<void> {
    return this.douyinSidebar.navigate(options)
  }

  /**
   * 销毁当前实例创建的所有广告对象。
   */
  destroy(): void {
    this.douyinSidebar.stopListening()
    this.rewardedVideoManager.destroy()
    this.interstitialManager.destroy()
    this.customAdManager.destroy()
    this.bannerAdManager.destroy()
  }

  private getOptions(): AdSdkInitOptions {
    return requireInitialized(
      this.options,
      'SDK is not initialized. Call init() first.'
    )
  }
}

/**
 * 创建一个独立的 SDK 实例。
 *
 * @param options 可选的初始化配置，传入后会立即执行 init。
 */
export function createAdSdk(options?: AdSdkInitOptions): WegameAdapterKit {
  // 保留工厂函数，便于业务侧按场景创建独立实例。
  const sdk = new WegameAdapterKit()

  if (options) {
    sdk.init(options)
  }

  return sdk
}

/**
 * 默认单例。
 *
 * 适合绝大多数项目直接 import 后调用 init 和各类展示方法。
 */
// 默认单例适合绝大多数项目直接接入。
export const adSdk = createAdSdk()
