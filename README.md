# wegame-adapter-kit

提供微信和抖音小游戏统一广告接入层、小游戏环境检测和跳转小程序封装。

## Package

- @wegame-adapter-kit/core：微信、抖音小游戏能力封装、广告管理器与运行时检测

## 平台支持

| 能力         | 微信（wx） | 抖音（tt） |
| ------------ | ---------- | ---------- |
| 激励视频广告 | ✓          | ✓          |
| 插屏广告     | ✓          | ✓          |
| Banner 广告  | ✓          | ✓          |
| 原生模板广告 | ✓          | ✗          |
| 跳转小程序   | ✓          | ✓          |

## Quick Start

用 `getMiniGamePlatform()` 判断当前平台（返回 `'wechat' | 'douyin' | 'unknown'`），按需初始化 SDK。

**微信小游戏**

```ts
import { adSdk, getMiniGamePlatform } from '@wegame-adapter-kit/core'

if (getMiniGamePlatform() !== 'unknown') {
  adSdk.init({
    platform: 'wechat',
    rewardedVideoAds: {
      levelReward: {
        adUnitId: process.env.LEVEL_REWARD_VIDEO_AD_UNIT_ID ?? '',
        disableFallbackSharePage: true
      }
    },
    interstitialAds: {
      levelStart: process.env.LEVEL_START_INTERSTITIAL_AD_UNIT_ID ?? ''
    },
    customAds: {
      homeFloat: {
        adUnitId: process.env.HOME_FLOAT_CUSTOM_AD_UNIT_ID ?? '',
        style: {
          left: 0,
          top: 0,
          width: 320
        }
      }
    }
  })

  await adSdk.loadRewardedVideo('levelReward')
  const result = await adSdk.showRewardedVideo('levelReward')

  if (result.shouldReward) {
    console.log('grant reward')
  }
}
```

**抖音小游戏**

```ts
import { adSdk, getMiniGamePlatform } from '@wegame-adapter-kit/core'

if (getMiniGamePlatform() === 'douyin') {
  adSdk.init({
    platform: 'douyin',
    rewardedVideoAds: {
      levelReward: process.env.LEVEL_REWARD_VIDEO_AD_UNIT_ID ?? ''
    },
    interstitialAds: {
      levelStart: process.env.LEVEL_START_INTERSTITIAL_AD_UNIT_ID ?? ''
    },
    bannerAds: {
      homeBottom: {
        adUnitId: process.env.HOME_BOTTOM_BANNER_AD_UNIT_ID ?? '',
        style: { width: 300 }
      }
    }
  })

  await adSdk.showBannerAd('homeBottom')

  await adSdk.loadRewardedVideo('levelReward')
  const result = await adSdk.showRewardedVideo('levelReward')

  if (result.shouldReward) {
    console.log('grant reward')
  }
}
```

初始化只注册配置，不会立即创建全部广告实例。广告会在对应广告位第一次 load 或 show 时按需创建并缓存。

## Init Config

微信和抖音使用各自独立的配置类型，通过 `platform` 字段区分。

**微信（`WechatAdSdkInitOptions`）**

```ts
type WechatAdSdkInitOptions = {
  platform: 'wechat'
  rewardedVideoAds?: Record<
    string,
    string | { adUnitId: string; disableFallbackSharePage?: boolean }
  >
  interstitialAds?: Record<string, string>
  customAds?: Record<
    string,
    {
      adUnitId: string
      style?: { left: number; top: number; width: number; fixed?: boolean }
    }
  >
  bannerAds?: Record<
    string,
    {
      adUnitId: string
      style?: { left?: number; top?: number; width?: number; height?: number }
    }
  >
  debug?: boolean
}
```

**抖音（`DouyinAdSdkInitOptions`）**

```ts
type DouyinAdSdkInitOptions = {
  platform: 'douyin'
  rewardedVideoAds?: Record<string, string>
  interstitialAds?: Record<string, string>
  bannerAds?: Record<
    string,
    {
      adUnitId: string
      style?: { left?: number; top?: number; width?: number; height?: number }
    }
  >
  debug?: boolean
}
```

广告位 key 建议使用稳定的业务名，例如 `levelReward`、`levelStart`、`homeFloat`，不要在不同业务场景复用同一个 key。

## API Reference

### init

初始化 SDK，注册广告位配置。`platform` 字段必填以确定平台类型。

```ts
// 微信
adSdk.init({
  platform: 'wechat',
  rewardedVideoAds: { levelReward: 'adunit-xxx' }
})

// 抖音
adSdk.init({
  platform: 'douyin',
  rewardedVideoAds: { levelReward: 'adunit-xxx' }
})
```

### getCapabilities

返回当前环境和已配置能力的快照。

```ts
const capabilities = adSdk.getCapabilities()
// capabilities.rewardedVideo / .interstitial / .customAd
```

| 字段            | 说明                                                        |
| --------------- | ----------------------------------------------------------- |
| `rewardedVideo` | 环境支持激励视频 且 init 时至少配置了一个激励视频广告位     |
| `interstitial`  | 环境支持插屏广告 且 init 时至少配置了一个插屏广告位         |
| `customAd`      | 环境支持原生模板广告 且 init 时至少配置了一个原生模板广告位 |

任一字段为 `false` 表示：当前不在微信小游戏环境 / 基础库不支持该广告类型，或 init 时未传对应广告位。

### preloadAll

预加载当前已配置的全部激励视频和插屏广告。

```ts
await adSdk.preloadAll()
```

---

### 激励视频广告

#### loadRewardedVideo

预加载指定激励视频广告位。

```ts
await adSdk.loadRewardedVideo('levelReward')
```

#### showRewardedVideo

展示指定激励视频广告位，返回观看结果。

```ts
const result = await adSdk.showRewardedVideo('levelReward')

if (result.shouldReward) {
  console.log('grant reward')
}
```

返回类型：

```ts
type RewardedVideoShowResult = {
  rewarded: boolean // 用户是否完成观看
  completed: boolean // 与微信原生 isEnded 语义一致
  shouldReward: boolean // 业务是否应发奖励，建议优先使用
  placementKey: string // 本次展示使用的广告位 key
  raw?: { isEnded?: boolean } // 微信原始 onClose 结果
}
```

#### 激励视频事件监听

| 方法                             | 说明                            |
| -------------------------------- | ------------------------------- |
| `onRewardedVideoLoad(key, fn)`   | 监听加载完成                    |
| `offRewardedVideoLoad(key, fn)`  | 取消加载监听                    |
| `onRewardedVideoClose(key, fn)`  | 监听关闭，`fn` 参数含 `isEnded` |
| `offRewardedVideoClose(key, fn)` | 取消关闭监听                    |
| `onRewardedVideoError(key, fn)`  | 监听错误                        |
| `offRewardedVideoError(key, fn)` | 取消错误监听                    |

---

### 插屏广告

#### loadInterstitial

预加载指定插屏广告位。

```ts
await adSdk.loadInterstitial('levelStart')
```

#### showInterstitial

展示指定插屏广告位。

```ts
await adSdk.showInterstitial('levelStart')
```

#### 插屏广告事件监听

| 方法                            | 说明         |
| ------------------------------- | ------------ |
| `onInterstitialLoad(key, fn)`   | 监听加载完成 |
| `offInterstitialLoad(key, fn)`  | 取消加载监听 |
| `onInterstitialClose(key, fn)`  | 监听关闭     |
| `offInterstitialClose(key, fn)` | 取消关闭监听 |
| `onInterstitialError(key, fn)`  | 监听错误     |
| `offInterstitialError(key, fn)` | 取消错误监听 |

---

### 原生模板广告

#### showCustomAd

创建并显示指定原生模板广告位。

```ts
await adSdk.showCustomAd('homeFloat')
```

#### hideCustomAd

隐藏指定原生模板广告位。

```ts
adSdk.hideCustomAd('homeFloat')
```

#### 原生模板广告事件监听

| 方法                        | 说明         |
| --------------------------- | ------------ |
| `onCustomAdLoad(key, fn)`   | 监听加载完成 |
| `offCustomAdLoad(key, fn)`  | 取消加载监听 |
| `onCustomAdClose(key, fn)`  | 监听关闭     |
| `offCustomAdClose(key, fn)` | 取消关闭监听 |
| `onCustomAdHide(key, fn)`   | 监听被隐藏   |
| `offCustomAdHide(key, fn)`  | 取消隐藏监听 |
| `onCustomAdError(key, fn)`  | 监听错误     |
| `offCustomAdError(key, fn)` | 取消错误监听 |

> 原生模板广告仅微信平台支持。

---

### Banner 广告

微信与抖音均支持。Banner 广告在 `showBannerAd` 时按需创建实例。

#### showBannerAd

创建并展示指定 Banner 广告位。

```ts
await adSdk.showBannerAd('homeBottom')
```

#### hideBannerAd

隐藏指定 Banner 广告位。

```ts
adSdk.hideBannerAd('homeBottom')
```

#### Banner 广告事件监听

| 方法                         | 说明                                        |
| ---------------------------- | ------------------------------------------- |
| `onBannerAdLoad(key, fn)`    | 监听加载完成                                |
| `offBannerAdLoad(key, fn)`   | 取消加载监听                                |
| `onBannerAdResize(key, fn)`  | 监听尺寸变化，`fn` 参数含 `{width, height}` |
| `offBannerAdResize(key, fn)` | 取消尺寸变化监听                            |
| `onBannerAdError(key, fn)`   | 监听错误                                    |
| `offBannerAdError(key, fn)`  | 取消错误监听                                |

---

### navigateToMiniProgram

跳转到其他小程序，微信与抖音参数略有差异。

**微信**

```ts
await adSdk.navigateToMiniProgram({
  appId: 'wx1234567890',
  path: 'pages/index/index',
  extraData: { from: 'game' },
  envVersion: 'release' // 'develop' | 'trial' | 'release'
})
```

**抖音**

```ts
await adSdk.navigateToMiniProgram({
  appId: 'tt1234567890',
  path: 'pages/index/index',
  extraData: { from: 'game' },
  envVersion: 'current' // 'current'（线上版） | 'latest'（测试版）
})
```

### destroy

销毁当前 SDK 实例已创建的广告对象。

```ts
adSdk.destroy()
```

## 高级用法

### createAdSdk

创建独立 SDK 实例，适合多实例或测试场景。

```ts
import { createAdSdk } from '@wegame-adapter-kit/core'

const sdk = createAdSdk()
sdk.init({
  rewardedVideoAds: {
    levelReward: 'adunit-xxx'
  }
})
```
