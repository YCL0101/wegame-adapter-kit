import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from '../errors'
import { canCreateCustomAd, getWx } from '../guards'
import type { AdSdkInitOptions } from '../types'
import type { CustomAd, CustomAdStyle, WxError } from '../wechat'

type OptionsProvider = () => AdSdkInitOptions | undefined
type CustomAdLoadListener = () => void
type CustomAdCloseListener = () => void
type CustomAdHideListener = () => void
type CustomAdErrorListener = (error: WxError) => void

const DEFAULT_STYLE: CustomAdStyle = {
  left: 0,
  top: 0,
  width: 320
}

export class CustomAdManager {
  private readonly adMap = new Map<string, CustomAd>()
  private readonly lastErrorMap = new Map<string, WxError>()
  private readonly loadListenersMap = new Map<
    string,
    Set<CustomAdLoadListener>
  >()
  private readonly closeListenersMap = new Map<
    string,
    Set<CustomAdCloseListener>
  >()
  private readonly hideListenersMap = new Map<
    string,
    Set<CustomAdHideListener>
  >()
  private readonly errorListenersMap = new Map<
    string,
    Set<CustomAdErrorListener>
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

  private bindAdEvents(placementKey: string, ad: CustomAd): void {
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

    ad.onHide?.(() => {
      for (const listener of this.getOrCreateListeners(
        this.hideListenersMap,
        placementKey
      )) {
        listener()
      }
    })
  }

  private getCustomAds(): Record<
    string,
    { adUnitId: string; style: CustomAdStyle }
  > {
    const options = this.getOptions()
    const customAds = options?.platform !== 'douyin' ? options?.customAds : undefined
    return Object.fromEntries(
      Object.entries(customAds ?? {}).map(
        ([placementKey, config]) => [
          placementKey,
          {
            adUnitId: config.adUnitId,
            style: config.style ?? DEFAULT_STYLE
          }
        ]
      )
    )
  }

  private ensureAd(placementKey: string): CustomAd {
    const resolvedPlacementKey = placementKey
    const customAd = this.getCustomAds()[resolvedPlacementKey]
    const adUnitId = customAd?.adUnitId
    const style = customAd?.style ?? DEFAULT_STYLE

    // 原生模板广告依赖样式信息，未配置时使用默认尺寸占位。
    if (!canCreateCustomAd(adUnitId)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Custom ad is unavailable in the current environment.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const cachedAd = this.adMap.get(resolvedPlacementKey)

    if (cachedAd) {
      return cachedAd
    }

    const wx = getWx()

    if (!wx?.createCustomAd || !adUnitId) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'WeChat custom ad capability is unavailable.',
        { adUnitId, placementKey: resolvedPlacementKey }
      )
    }

    const ad = wx.createCustomAd({ adUnitId, style })
    this.bindAdEvents(resolvedPlacementKey, ad)

    this.adMap.set(resolvedPlacementKey, ad)
    return ad
  }

  getPlacementKeys(): string[] {
    return Object.keys(this.getCustomAds())
  }

  onLoad(placementKey: string, listener: CustomAdLoadListener): void {
    this.getOrCreateListeners(this.loadListenersMap, placementKey).add(listener)
  }

  offLoad(placementKey: string, listener: CustomAdLoadListener): void {
    this.loadListenersMap.get(placementKey)?.delete(listener)
  }

  onClose(placementKey: string, listener: CustomAdCloseListener): void {
    this.getOrCreateListeners(this.closeListenersMap, placementKey).add(
      listener
    )
  }

  offClose(placementKey: string, listener: CustomAdCloseListener): void {
    this.closeListenersMap.get(placementKey)?.delete(listener)
  }

  onHide(placementKey: string, listener: CustomAdHideListener): void {
    this.getOrCreateListeners(this.hideListenersMap, placementKey).add(listener)
  }

  offHide(placementKey: string, listener: CustomAdHideListener): void {
    this.hideListenersMap.get(placementKey)?.delete(listener)
  }

  onError(placementKey: string, listener: CustomAdErrorListener): void {
    this.getOrCreateListeners(this.errorListenersMap, placementKey).add(
      listener
    )
  }

  offError(placementKey: string, listener: CustomAdErrorListener): void {
    this.errorListenersMap.get(placementKey)?.delete(listener)
  }

  async show(placementKey: string): Promise<void> {
    const resolvedPlacementKey = placementKey

    try {
      await Promise.resolve(this.ensureAd(resolvedPlacementKey).show())
    } catch (error) {
      throw normalizeError(
        ADAPTER_ERROR_CODES.adShowFailed,
        'Failed to show custom ad.',
        this.lastErrorMap.get(resolvedPlacementKey) ?? error
      )
    }
  }

  hide(placementKey: string): void {
    const resolvedPlacementKey = placementKey

    // 自定义广告通常需要显式隐藏，避免残留在游戏界面上。
    this.ensureAd(resolvedPlacementKey).hide()
  }

  destroy(): void {
    for (const ad of this.adMap.values()) {
      ad.destroy?.()
    }

    this.adMap.clear()
    this.lastErrorMap.clear()
    this.loadListenersMap.clear()
    this.closeListenersMap.clear()
    this.hideListenersMap.clear()
    this.errorListenersMap.clear()
  }
}
