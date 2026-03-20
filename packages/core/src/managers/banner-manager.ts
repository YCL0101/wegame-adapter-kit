import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from '../errors'
import { canCreateBannerAd, getAdRuntime } from '../guards'
import type { AdSdkInitOptions, BannerAdPlacementOptions } from '../types'
import type { BannerAd, WxError } from '../wechat'

type OptionsProvider = () => AdSdkInitOptions | undefined
type BannerAdLoadListener = () => void
type BannerAdErrorListener = (error: WxError) => void
type BannerAdResizeListener = (result: {
  width: number
  height: number
}) => void

export class BannerAdManager {
  private readonly adMap = new Map<string, BannerAd>()
  private readonly lastErrorMap = new Map<string, WxError>()
  private readonly loadListenersMap = new Map<
    string,
    Set<BannerAdLoadListener>
  >()
  private readonly errorListenersMap = new Map<
    string,
    Set<BannerAdErrorListener>
  >()
  private readonly resizeListenersMap = new Map<
    string,
    Set<BannerAdResizeListener>
  >()

  constructor(private readonly getOptions: OptionsProvider) {}

  private getOrCreateListeners<T>(
    map: Map<string, Set<T>>,
    placementKey: string
  ): Set<T> {
    const existing = map.get(placementKey)
    if (existing) return existing
    const next = new Set<T>()
    map.set(placementKey, next)
    return next
  }

  private bindAdEvents(placementKey: string, ad: BannerAd): void {
    ad.onLoad(() => {
      for (const listener of this.getOrCreateListeners(
        this.loadListenersMap,
        placementKey
      )) {
        listener()
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

    ad.onResize((result) => {
      for (const listener of this.getOrCreateListeners(
        this.resizeListenersMap,
        placementKey
      )) {
        listener(result)
      }
    })
  }

  private getBannerAds(): Record<string, BannerAdPlacementOptions> {
    return this.getOptions()?.bannerAds ?? {}
  }

  private ensureAd(placementKey: string): BannerAd {
    const config = this.getBannerAds()[placementKey]
    const adUnitId = config?.adUnitId

    if (!canCreateBannerAd(adUnitId)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Banner ad is unavailable in the current environment.',
        { adUnitId, placementKey }
      )
    }

    const cached = this.adMap.get(placementKey)
    if (cached) return cached

    const runtime = getAdRuntime()

    if (!runtime?.createBannerAd || !adUnitId) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Banner ad capability is unavailable.',
        { adUnitId, placementKey }
      )
    }

    const ad = runtime.createBannerAd({
      adUnitId,
      ...(config.style ? { style: config.style } : {})
    })
    this.bindAdEvents(placementKey, ad)
    this.adMap.set(placementKey, ad)
    return ad
  }

  getPlacementKeys(): string[] {
    return Object.keys(this.getBannerAds())
  }

  onLoad(placementKey: string, listener: BannerAdLoadListener): void {
    this.getOrCreateListeners(this.loadListenersMap, placementKey).add(listener)
  }

  offLoad(placementKey: string, listener: BannerAdLoadListener): void {
    this.loadListenersMap.get(placementKey)?.delete(listener)
  }

  onError(placementKey: string, listener: BannerAdErrorListener): void {
    this.getOrCreateListeners(this.errorListenersMap, placementKey).add(
      listener
    )
  }

  offError(placementKey: string, listener: BannerAdErrorListener): void {
    this.errorListenersMap.get(placementKey)?.delete(listener)
  }

  onResize(placementKey: string, listener: BannerAdResizeListener): void {
    this.getOrCreateListeners(this.resizeListenersMap, placementKey).add(
      listener
    )
  }

  offResize(placementKey: string, listener: BannerAdResizeListener): void {
    this.resizeListenersMap.get(placementKey)?.delete(listener)
  }

  async show(placementKey: string): Promise<void> {
    try {
      await this.ensureAd(placementKey).show()
    } catch (error) {
      throw normalizeError(
        ADAPTER_ERROR_CODES.adShowFailed,
        'Failed to show banner ad.',
        this.lastErrorMap.get(placementKey) ?? error
      )
    }
  }

  hide(placementKey: string): void {
    this.adMap.get(placementKey)?.hide()
  }

  destroy(): void {
    for (const ad of this.adMap.values()) {
      ad.destroy()
    }
    this.adMap.clear()
    this.lastErrorMap.clear()
    this.loadListenersMap.clear()
    this.errorListenersMap.clear()
    this.resizeListenersMap.clear()
  }
}
