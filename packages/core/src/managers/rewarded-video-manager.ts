import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from '../errors'
import { canCreateRewardedVideoAd, getAdRuntime } from '../guards'
import type {
  AdSdkInitOptions,
  RewardedVideoPlacementOptions,
  RewardedVideoShowResult
} from '../types'
import type {
  RewardedVideoAd,
  RewardedVideoCloseResult,
  RewardedVideoLoadResult,
  WxError
} from '../wechat'

type OptionsProvider = () => AdSdkInitOptions | undefined
type RewardedVideoLoadListener = (result?: RewardedVideoLoadResult) => void
type RewardedVideoCloseListener = (result?: RewardedVideoCloseResult) => void
type RewardedVideoErrorListener = (error: WxError) => void

export class RewardedVideoManager {
  private readonly adMap = new Map<string, RewardedVideoAd>()
  private readonly lastErrorMap = new Map<string, WxError>()
  private readonly loadListenersMap = new Map<
    string,
    Set<RewardedVideoLoadListener>
  >()
  private readonly closeListenersMap = new Map<
    string,
    Set<RewardedVideoCloseListener>
  >()
  private readonly errorListenersMap = new Map<
    string,
    Set<RewardedVideoErrorListener>
  >()

  constructor(private readonly getOptions: OptionsProvider) {}

  private getOrCreateListeners<T>(
    map: Map<string, Set<T>>,
    placementKey: string
  ): Set<T> {
    const listeners = map.get(placementKey)

    if (listeners) {
      return listeners
    }

    const nextListeners = new Set<T>()
    map.set(placementKey, nextListeners)
    return nextListeners
  }

  private bindAdEvents(placementKey: string, ad: RewardedVideoAd): void {
    ad.onLoad((result) => {
      for (const listener of this.getOrCreateListeners(
        this.loadListenersMap,
        placementKey
      )) {
        listener(result)
      }
    })

    ad.onError((error) => {
      this.lastErrorMap.set(placementKey, error)

      for (const listener of this.getOrCreateListeners(
        this.errorListenersMap,
        placementKey
      )) {
        listener(error)
      }
    })

    ad.onClose((result) => {
      for (const listener of this.getOrCreateListeners(
        this.closeListenersMap,
        placementKey
      )) {
        listener(result)
      }
    })
  }

  private getRewardedVideoAds(): Record<string, RewardedVideoPlacementOptions> {
    return Object.fromEntries(
      Object.entries(this.getOptions()?.rewardedVideoAds ?? {}).map(
        ([placementKey, config]) => [
          placementKey,
          typeof config === 'string' ? { adUnitId: config } : { ...config }
        ]
      )
    )
  }

  private ensureAd(placementKey: string): RewardedVideoAd {
    const resolvedPlacementKey = placementKey
    const rewardedVideoConfig = this.getRewardedVideoAds()[resolvedPlacementKey]
    const adUnitId = rewardedVideoConfig?.adUnitId

    // 激励视频实例按需创建并缓存，避免业务侧重复 new 实例。
    if (!canCreateRewardedVideoAd(adUnitId)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Rewarded video ad is unavailable in the current environment.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const cachedAd = this.adMap.get(resolvedPlacementKey)

    if (cachedAd) {
      return cachedAd
    }

    const runtime = getAdRuntime()

    if (!runtime || !adUnitId) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Rewarded video capability is unavailable.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const ad = runtime.createRewardedVideoAd({
      adUnitId,
      ...(rewardedVideoConfig.disableFallbackSharePage === undefined
        ? {}
        : {
            disableFallbackSharePage:
              rewardedVideoConfig.disableFallbackSharePage
          })
    })
    this.bindAdEvents(resolvedPlacementKey, ad)

    this.adMap.set(resolvedPlacementKey, ad)
    return ad
  }

  getPlacementKeys(): string[] {
    return Object.keys(this.getRewardedVideoAds())
  }

  onLoad(placementKey: string, listener: RewardedVideoLoadListener): void {
    this.getOrCreateListeners(this.loadListenersMap, placementKey).add(listener)
  }

  offLoad(placementKey: string, listener: RewardedVideoLoadListener): void {
    this.loadListenersMap.get(placementKey)?.delete(listener)
  }

  onClose(placementKey: string, listener: RewardedVideoCloseListener): void {
    this.getOrCreateListeners(this.closeListenersMap, placementKey).add(
      listener
    )
  }

  offClose(placementKey: string, listener: RewardedVideoCloseListener): void {
    this.closeListenersMap.get(placementKey)?.delete(listener)
  }

  onError(placementKey: string, listener: RewardedVideoErrorListener): void {
    this.getOrCreateListeners(this.errorListenersMap, placementKey).add(
      listener
    )
  }

  offError(placementKey: string, listener: RewardedVideoErrorListener): void {
    this.errorListenersMap.get(placementKey)?.delete(listener)
  }

  async load(placementKey: string): Promise<void> {
    const resolvedPlacementKey = placementKey

    try {
      await this.ensureAd(resolvedPlacementKey).load()
    } catch (error) {
      throw normalizeError(
        ADAPTER_ERROR_CODES.adLoadFailed,
        'Failed to load rewarded video ad.',
        this.lastErrorMap.get(resolvedPlacementKey) ?? error
      )
    }
  }

  async show(placementKey: string): Promise<RewardedVideoShowResult> {
    const resolvedPlacementKey = placementKey
    const ad = this.ensureAd(resolvedPlacementKey)
    let cleanup = () => undefined

    // show 成功并不代表用户完成观看，真正结果以 onClose 回调为准。
    const closePromise = new Promise<RewardedVideoShowResult>((resolve) => {
      const handleClose = (result?: RewardedVideoCloseResult) => {
        cleanup()

        if (result) {
          const completed = result.isEnded !== false

          resolve({
            rewarded: completed,
            completed,
            shouldReward: completed,
            placementKey: resolvedPlacementKey,
            raw: result
          })
          return
        }

        resolve({
          rewarded: true,
          completed: true,
          shouldReward: true,
          placementKey: resolvedPlacementKey
        })
      }

      cleanup = () => {
        ad.offClose?.(handleClose)
      }

      ad.onClose(handleClose)
    })

    try {
      await ad.show()
      return await closePromise
    } catch {
      try {
        // 微信广告偶发会在首次展示前要求显式 load，这里统一兜底一次。
        await ad.load()
        await ad.show()
        return await closePromise
      } catch (error) {
        cleanup()
        throw normalizeError(
          ADAPTER_ERROR_CODES.adShowFailed,
          'Failed to show rewarded video ad.',
          this.lastErrorMap.get(resolvedPlacementKey) ?? error
        )
      }
    }
  }

  destroy(): void {
    for (const ad of this.adMap.values()) {
      ad.destroy?.()
    }

    this.adMap.clear()
    this.lastErrorMap.clear()
    this.loadListenersMap.clear()
    this.closeListenersMap.clear()
    this.errorListenersMap.clear()
  }
}
