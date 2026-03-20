import {
  canCreateBannerAd,
  canCreateCustomAd,
  canCreateInterstitialAd,
  canCreateRewardedVideoAd,
  canNavigateToMiniProgram,
  isDouyinMiniGame,
  isWechatMiniGame
} from './guards'
import type { CapabilitySnapshot, RewardedVideoPlacementOptions } from './types'

function getRewardedVideoAdUnitId(
  config: string | RewardedVideoPlacementOptions
): string {
  return typeof config === 'string' ? config : config.adUnitId
}

export const CapabilityDetector = {
  snapshot(config?: {
    rewardedVideoAds?: Record<string, string | RewardedVideoPlacementOptions>
    interstitialAds?: Record<string, string>
    customAds?: Record<string, { adUnitId: string }>
    bannerAds?: Record<string, { adUnitId: string }>
  }): CapabilitySnapshot {
    const rewardedVideoAdUnitId = Object.values(config?.rewardedVideoAds ?? {})
      .map(getRewardedVideoAdUnitId)
      .find(Boolean)
    const interstitialAdUnitId = Object.values(
      config?.interstitialAds ?? {}
    ).find(Boolean)
    const customAdUnitId = Object.values(config?.customAds ?? {})
      .map((item) => item.adUnitId)
      .find(Boolean)
    const bannerAdUnitId = Object.values(config?.bannerAds ?? {})
      .map((item) => item.adUnitId)
      .find(Boolean)

    return {
      wechatMiniGame: isWechatMiniGame(),
      douyinMiniGame: isDouyinMiniGame(),
      rewardedVideo: canCreateRewardedVideoAd(rewardedVideoAdUnitId),
      interstitial: canCreateInterstitialAd(interstitialAdUnitId),
      bannerAd: canCreateBannerAd(bannerAdUnitId),
      customAd: canCreateCustomAd(customAdUnitId),
      miniProgramNavigation: canNavigateToMiniProgram({ appId: 'probe' })
    }
  }
}
