import { beforeEach, describe, expect, it, vi } from 'vitest'

import { douyinSidebar } from './douyin-sidebar'
import {
  getAdRuntime,
  getMiniGamePlatform,
  isDouyinMiniGame,
  isWechatMiniGame
} from './guards'
import { createAdSdk } from './sdk'
import type {
  CustomAd,
  InterstitialAd,
  RewardedVideoAd,
  RewardedVideoCloseResult,
  RewardedVideoLoadResult,
  WxError,
  WxMiniGame
} from './wechat'
import type {
  TtCheckSceneOptions,
  TtLaunchOptions,
  TtMiniGame,
  TtNavigateToSceneOptions
} from './douyin'

class RewardedVideoAdMock implements RewardedVideoAd {
  private readonly loadHandlers = new Set<
    (result?: RewardedVideoLoadResult) => void
  >()
  private readonly errorHandlers = new Set<(error: WxError) => void>()
  private readonly closeHandlers = new Set<
    (result?: RewardedVideoCloseResult) => void
  >()

  async load(): Promise<void> {
    this.emitLoad({ useFallbackSharePage: false })
  }

  async show(): Promise<void> {
    this.emitClose({ isEnded: true })
  }

  onLoad(callback: (result?: RewardedVideoLoadResult) => void): void {
    this.loadHandlers.add(callback)
  }

  offLoad(callback: (result?: RewardedVideoLoadResult) => void): void {
    this.loadHandlers.delete(callback)
  }

  onError(callback: (error: WxError) => void): void {
    this.errorHandlers.add(callback)
  }

  offError(callback: (error: WxError) => void): void {
    this.errorHandlers.delete(callback)
  }

  onClose(callback: (result?: RewardedVideoCloseResult) => void): void {
    this.closeHandlers.add(callback)
  }

  offClose(callback: (result?: RewardedVideoCloseResult) => void): void {
    this.closeHandlers.delete(callback)
  }

  emitLoad(result?: RewardedVideoLoadResult): void {
    for (const handler of Array.from(this.loadHandlers)) {
      handler(result)
    }
  }

  emitError(error: WxError): void {
    for (const handler of Array.from(this.errorHandlers)) {
      handler(error)
    }
  }

  emitClose(result?: RewardedVideoCloseResult): void {
    for (const handler of Array.from(this.closeHandlers)) {
      handler(result)
    }
  }

  getCloseHandlerCount(): number {
    return this.closeHandlers.size
  }
}

class InterstitialAdMock implements InterstitialAd {
  private readonly loadHandlers = new Set<() => void>()
  private readonly errorHandlers = new Set<(error: WxError) => void>()
  private readonly closeHandlers = new Set<() => void>()

  async load(): Promise<void> {
    this.emitLoad()
  }

  async show(): Promise<void> {
    this.emitClose()
  }

  onLoad(callback: () => void): void {
    this.loadHandlers.add(callback)
  }

  offLoad(callback: () => void): void {
    this.loadHandlers.delete(callback)
  }

  onError(callback: (error: WxError) => void): void {
    this.errorHandlers.add(callback)
  }

  offError(callback: (error: WxError) => void): void {
    this.errorHandlers.delete(callback)
  }

  onClose(callback: () => void): void {
    this.closeHandlers.add(callback)
  }

  offClose(callback: () => void): void {
    this.closeHandlers.delete(callback)
  }

  emitLoad(): void {
    for (const handler of Array.from(this.loadHandlers)) {
      handler()
    }
  }

  emitError(error: WxError): void {
    for (const handler of Array.from(this.errorHandlers)) {
      handler(error)
    }
  }

  emitClose(): void {
    for (const handler of Array.from(this.closeHandlers)) {
      handler()
    }
  }
}

class CustomAdMock implements CustomAd {
  private readonly loadHandlers = new Set<() => void>()
  private readonly errorHandlers = new Set<(error: WxError) => void>()
  private readonly closeHandlers = new Set<() => void>()
  private readonly hideHandlers = new Set<() => void>()

  show(): Promise<void> {
    this.emitLoad()
    return Promise.resolve()
  }

  hide(): void {
    this.emitHide()
  }

  onLoad(callback: () => void): void {
    this.loadHandlers.add(callback)
  }

  offLoad(callback: () => void): void {
    this.loadHandlers.delete(callback)
  }

  onError(callback: (error: WxError) => void): void {
    this.errorHandlers.add(callback)
  }

  offError(callback: (error: WxError) => void): void {
    this.errorHandlers.delete(callback)
  }

  onClose(callback: () => void): void {
    this.closeHandlers.add(callback)
  }

  offClose(callback: () => void): void {
    this.closeHandlers.delete(callback)
  }

  onHide(callback: () => void): void {
    this.hideHandlers.add(callback)
  }

  offHide(callback: () => void): void {
    this.hideHandlers.delete(callback)
  }

  emitLoad(): void {
    for (const handler of Array.from(this.loadHandlers)) {
      handler()
    }
  }

  emitError(error: WxError): void {
    for (const handler of Array.from(this.errorHandlers)) {
      handler(error)
    }
  }

  emitClose(): void {
    for (const handler of Array.from(this.closeHandlers)) {
      handler()
    }
  }

  emitHide(): void {
    for (const handler of Array.from(this.hideHandlers)) {
      handler()
    }
  }
}

class TtMiniGameMock implements TtMiniGame {
  private onShowHandler: ((options: TtLaunchOptions) => void) | undefined

  createRewardedVideoAd = vi.fn(() => {
    throw new Error('Not implemented in this test')
  })

  createInterstitialAd = vi.fn(() => {
    throw new Error('Not implemented in this test')
  })

  createBannerAd = vi.fn(() => {
    throw new Error('Not implemented in this test')
  })

  navigateToMiniProgram = vi.fn()
  checkScene = vi.fn((options: TtCheckSceneOptions) => {
    options.success?.({ isExist: true })
  })
  navigateToScene = vi.fn((options: TtNavigateToSceneOptions) => {
    options.success?.({ errMsg: 'navigateToScene:ok' })
  })

  onShow(callback: (options: TtLaunchOptions) => void): void {
    this.onShowHandler = callback
  }

  offShow(callback: (options: TtLaunchOptions) => void): void {
    if (this.onShowHandler === callback) {
      this.onShowHandler = undefined
    }
  }

  emitShow(options: TtLaunchOptions): void {
    this.onShowHandler?.(options)
  }
}

describe('runtime detection', () => {
  beforeEach(() => {
    delete (globalThis as typeof globalThis & { wx?: WxMiniGame }).wx
    delete (globalThis as typeof globalThis & { tt?: TtMiniGame }).tt
  })

  it('prefers Douyin when both tt and wx compatibility runtime exist', () => {
    const wxMock = {
      createRewardedVideoAd: vi.fn(),
      navigateToMiniProgram: vi.fn()
    } as unknown as WxMiniGame
    const ttMock = new TtMiniGameMock()

    ;(globalThis as typeof globalThis & { wx?: WxMiniGame }).wx = wxMock
    ;(globalThis as typeof globalThis & { tt?: TtMiniGame }).tt = ttMock

    expect(getMiniGamePlatform()).toBe('douyin')
    expect(isDouyinMiniGame()).toBe(true)
    expect(isWechatMiniGame()).toBe(false)
    expect(getAdRuntime()).toBe(ttMock)
  })
})

describe('WegameAdapterKit events', () => {
  let rewardedAd: RewardedVideoAdMock
  let interstitialAd: InterstitialAdMock
  let customAd: CustomAdMock
  let wxMock: WxMiniGame
  let ttMock: TtMiniGameMock

  beforeEach(() => {
    rewardedAd = new RewardedVideoAdMock()
    interstitialAd = new InterstitialAdMock()
    customAd = new CustomAdMock()
    ttMock = new TtMiniGameMock()

    wxMock = {
      createRewardedVideoAd: vi.fn(() => rewardedAd),
      createInterstitialAd: vi.fn(() => interstitialAd),
      createCustomAd: vi.fn(() => customAd),
      navigateToMiniProgram: vi.fn()
    }
    ;(globalThis as typeof globalThis & { wx?: WxMiniGame }).wx = wxMock
    delete (globalThis as typeof globalThis & { tt?: TtMiniGame }).tt
    douyinSidebar.stopListening()
  })

  it('supports rewarded video onLoad and onClose subscriptions before ad creation', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      rewardedVideoAds: {
        levelReward: 'rewarded-unit'
      }
    })
    const onLoad = vi.fn()
    const onClose = vi.fn()

    sdk.onRewardedVideoLoad('levelReward', onLoad)
    sdk.onRewardedVideoClose('levelReward', onClose)

    await sdk.loadRewardedVideo('levelReward')
    const result = await sdk.showRewardedVideo('levelReward')

    expect(onLoad).toHaveBeenCalledWith({ useFallbackSharePage: false })
    expect(onClose).toHaveBeenCalledWith({ isEnded: true })
    expect(result.shouldReward).toBe(true)
    expect(result.placementKey).toBe('levelReward')
  })

  it('passes native rewarded video create options when configured', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      rewardedVideoAds: {
        levelReward: {
          adUnitId: 'rewarded-unit',
          disableFallbackSharePage: true
        }
      }
    })

    await sdk.loadRewardedVideo('levelReward')

    expect(wxMock.createRewardedVideoAd).toHaveBeenCalledWith({
      adUnitId: 'rewarded-unit',
      disableFallbackSharePage: true
    })
  })

  it('supports rewarded video off methods', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      rewardedVideoAds: {
        levelReward: 'rewarded-unit'
      }
    })
    const onLoad = vi.fn()
    const onClose = vi.fn()
    const onError = vi.fn()

    sdk.onRewardedVideoLoad('levelReward', onLoad)
    sdk.onRewardedVideoClose('levelReward', onClose)
    sdk.onRewardedVideoError('levelReward', onError)
    sdk.offRewardedVideoLoad('levelReward', onLoad)
    sdk.offRewardedVideoClose('levelReward', onClose)
    sdk.offRewardedVideoError('levelReward', onError)

    await sdk.loadRewardedVideo('levelReward')
    rewardedAd.emitError({ errCode: 1001, errMsg: 'rewarded error' })
    await sdk.showRewardedVideo('levelReward')

    expect(onLoad).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('binds native rewarded video onClose only once per show lifecycle', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      rewardedVideoAds: {
        levelReward: 'rewarded-unit'
      }
    })

    rewardedAd.show = vi.fn(async () => {
      expect(rewardedAd.getCloseHandlerCount()).toBe(1)
      rewardedAd.emitClose({ isEnded: true })
    })

    const result = await sdk.showRewardedVideo('levelReward')

    expect(result.shouldReward).toBe(true)
    expect(rewardedAd.getCloseHandlerCount()).toBe(0)
  })

  it('rejects duplicated rewarded video show while the same placement is busy', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      rewardedVideoAds: {
        levelReward: 'rewarded-unit'
      }
    })

    let resolveClose = () => undefined

    rewardedAd.show = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveClose = () => {
            rewardedAd.emitClose({ isEnded: true })
            resolve()
          }
        })
    )

    const firstShow = sdk.showRewardedVideo('levelReward')
    const secondShow = sdk.showRewardedVideo('levelReward')

    await expect(secondShow).rejects.toMatchObject({
      code: 'AD_SHOW_FAILED',
      message: 'Rewarded video ad is already showing.'
    })

    resolveClose()

    await expect(firstShow).resolves.toMatchObject({
      shouldReward: true,
      placementKey: 'levelReward'
    })
  })

  it('supports interstitial load close and error events', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      interstitialAds: {
        levelStart: 'interstitial-unit'
      }
    })
    const onLoad = vi.fn()
    const onClose = vi.fn()
    const onError = vi.fn()

    sdk.onInterstitialLoad('levelStart', onLoad)
    sdk.onInterstitialClose('levelStart', onClose)
    sdk.onInterstitialError('levelStart', onError)

    await sdk.loadInterstitial('levelStart')
    interstitialAd.emitError({ errCode: 2001, errMsg: 'interstitial error' })
    await sdk.showInterstitial('levelStart')

    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith({
      errCode: 2001,
      errMsg: 'interstitial error'
    })
  })

  it('supports custom ad load close hide and error events', async () => {
    const sdk = createAdSdk({
      platform: 'wechat',
      customAds: {
        homeFloat: {
          adUnitId: 'custom-unit',
          style: {
            left: 0,
            top: 0,
            width: 320
          }
        }
      }
    })
    const onLoad = vi.fn()
    const onClose = vi.fn()
    const onHide = vi.fn()
    const onError = vi.fn()

    sdk.onCustomAdLoad('homeFloat', onLoad)
    sdk.onCustomAdClose('homeFloat', onClose)
    sdk.onCustomAdHide('homeFloat', onHide)
    sdk.onCustomAdError('homeFloat', onError)

    await sdk.showCustomAd('homeFloat')
    customAd.emitClose()
    customAd.emitError({ errCode: 3001, errMsg: 'custom error' })
    sdk.hideCustomAd('homeFloat')

    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith({
      errCode: 3001,
      errMsg: 'custom error'
    })
  })

  it('tracks latest Douyin launch state from onShow and identifies sidebar launch', async () => {
    ;(globalThis as typeof globalThis & { tt?: TtMiniGame }).tt = ttMock

    const sdk = createAdSdk({
      platform: 'douyin',
      autoListenSidebarLaunch: false
    })

    sdk.startDouyinSidebarListening()
    ttMock.emitShow({ launch_from: 'side_bar' })

    expect(sdk.isLaunchedFromDouyinSidebar()).toBe(true)
    expect(sdk.getDouyinSidebarLaunchState()).toEqual({
      launchOptions: { launch_from: 'side_bar' },
      launchedFromSidebar: true
    })

    expect(await sdk.checkDouyinSidebarAvailability()).toBe(true)
    await expect(sdk.navigateToDouyinSidebar()).resolves.toBeUndefined()
  })
})
