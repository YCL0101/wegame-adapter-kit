import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from '../errors'
import { canCreateInterstitialAd, getAdRuntime } from '../guards'
import type { AdSdkInitOptions } from '../types'
import type { InterstitialAd, WxError } from '../wechat'

type OptionsProvider = () => AdSdkInitOptions | undefined
type InterstitialLoadListener = () => void
type InterstitialCloseListener = () => void
type InterstitialErrorListener = (error: WxError) => void

export class InterstitialManager {
  private readonly adMap = new Map<string, InterstitialAd>()
  private readonly lastErrorMap = new Map<string, WxError>()
  private readonly loadListenersMap = new Map<
    string,
    Set<InterstitialLoadListener>
  >()
  private readonly closeListenersMap = new Map<
    string,
    Set<InterstitialCloseListener>
  >()
  private readonly errorListenersMap = new Map<
    string,
    Set<InterstitialErrorListener>
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

  private bindAdEvents(placementKey: string, ad: InterstitialAd): void {
    ad.onLoad?.(() => {
      for (const listener of this.getOrCreateListeners(
        this.loadListenersMap,
        placementKey
      )) {
        listener()
      }
    })

    ad.onError?.((error) => {
      this.lastErrorMap.set(placementKey, error)

      for (const listener of this.getOrCreateListeners(
        this.errorListenersMap,
        placementKey
      )) {
        listener(error)
      }
    })

    ad.onClose?.(() => {
      for (const listener of this.getOrCreateListeners(
        this.closeListenersMap,
        placementKey
      )) {
        listener()
      }
    })
  }

  private getInterstitialAds(): Record<string, string> {
    return this.getOptions()?.interstitialAds ?? {}
  }

  private ensureAd(placementKey: string): InterstitialAd {
    const resolvedPlacementKey = placementKey
    const adUnitId = this.getInterstitialAds()[resolvedPlacementKey]

    // 插屏广告同样复用单例，避免频繁创建导致的能力异常。
    if (!canCreateInterstitialAd(adUnitId)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Interstitial ad is unavailable in the current environment.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const cachedAd = this.adMap.get(resolvedPlacementKey)

    if (cachedAd) {
      return cachedAd
    }

    const runtime = getAdRuntime()

    if (!runtime?.createInterstitialAd || !adUnitId) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Interstitial capability is unavailable.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const ad = runtime.createInterstitialAd({ adUnitId })
    this.bindAdEvents(resolvedPlacementKey, ad)

    this.adMap.set(resolvedPlacementKey, ad)
    return ad
  }

  getPlacementKeys(): string[] {
    return Object.keys(this.getInterstitialAds())
  }

  onLoad(placementKey: string, listener: InterstitialLoadListener): void {
    this.getOrCreateListeners(this.loadListenersMap, placementKey).add(listener)
  }

  offLoad(placementKey: string, listener: InterstitialLoadListener): void {
    this.loadListenersMap.get(placementKey)?.delete(listener)
  }

  onClose(placementKey: string, listener: InterstitialCloseListener): void {
    this.getOrCreateListeners(this.closeListenersMap, placementKey).add(
      listener
    )
  }

  offClose(placementKey: string, listener: InterstitialCloseListener): void {
    this.closeListenersMap.get(placementKey)?.delete(listener)
  }

  onError(placementKey: string, listener: InterstitialErrorListener): void {
    this.getOrCreateListeners(this.errorListenersMap, placementKey).add(
      listener
    )
  }

  offError(placementKey: string, listener: InterstitialErrorListener): void {
    this.errorListenersMap.get(placementKey)?.delete(listener)
  }

  async load(placementKey: string): Promise<void> {
    const resolvedPlacementKey = placementKey
    const ad = this.ensureAd(resolvedPlacementKey)

    if (!ad.load) {
      return
    }

    try {
      await ad.load()
    } catch (error) {
      throw normalizeError(
        ADAPTER_ERROR_CODES.adLoadFailed,
        'Failed to load interstitial ad.',
        this.lastErrorMap.get(resolvedPlacementKey) ?? error
      )
    }
  }

  async show(placementKey: string): Promise<void> {
    const resolvedPlacementKey = placementKey
    const ad = this.ensureAd(resolvedPlacementKey)

    try {
      await ad.show()
    } catch {
      try {
        // 对支持 load 的实现先尝试预加载，再执行二次展示。
        await ad.load?.()
        await ad.show()
      } catch (error) {
        throw normalizeError(
          ADAPTER_ERROR_CODES.adShowFailed,
          'Failed to show interstitial ad.',
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
