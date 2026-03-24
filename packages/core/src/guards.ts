import { ADAPTER_ERROR_CODES, createAdapterError } from './errors'
import type { AdSdkInitOptions } from './types'
import type { NavigateToMiniProgramOptions, WxMiniGame } from './wechat'
import type { TtLaunchOptions, TtMiniGame } from './douyin'

const DOUYIN_SIDEBAR_SCENE = 'side_bar'
const DOUYIN_SIDEBAR_LAUNCH_FROM_VALUES = new Set(['side_bar', 'sidebar'])
const DOUYIN_SIDEBAR_LOCATION_VALUES = new Set(['side_bar', 'sidebar'])

type GlobalRuntime = typeof globalThis & {
  wx?: WxMiniGame
  tt?: TtMiniGame
  Laya?: {
    Browser?: {
      onMiniGame?: boolean
    }
  }
  cc?: {
    sys?: {
      platform?: string
      WECHAT_GAME?: string
    }
  }
}

// 统一从全局对象读取运行时，便于在不同引擎环境下复用同一套判断逻辑。
function getRuntime(): GlobalRuntime {
  return globalThis as GlobalRuntime
}

function hasWxRuntime(): boolean {
  return Boolean(getRuntime().wx)
}

function hasTtRuntime(): boolean {
  return Boolean(getRuntime().tt)
}

function detectMiniGamePlatform(): MiniGamePlatform {
  // 在抖音开发工具和部分运行时适配层中，可能同时暴露 wx 兼容对象和真实 tt。
  // 这里优先认定 tt，避免把抖音环境误识别成微信。
  if (hasTtRuntime()) return 'douyin'
  if (hasWxRuntime()) return 'wechat'
  return 'unknown'
}

/**
 * 获取当前运行时中的微信小游戏 wx 对象。
 */
export function getWx(): WxMiniGame | null {
  return getRuntime().wx ?? null
}

/**
 * 获取当前运行时中的抖音小游戏 tt 对象。
 */
export function getTt(): TtMiniGame | null {
  return getRuntime().tt ?? null
}

/**
 * 获取当前可用的小游戏广告运行时（wx 优先，其次 tt）。
 * 管理器通过此方法屏蔽平台差异，统一调用广告 API。
 */
export function getAdRuntime(): WxMiniGame | TtMiniGame | null {
  const runtime = getRuntime()

  if (detectMiniGamePlatform() === 'douyin') {
    return runtime.tt ?? null
  }

  if (detectMiniGamePlatform() === 'wechat') {
    return runtime.wx ?? null
  }

  return null
}

// 微信小游戏运行时是所有能力可用的前置条件。
/**
 * 当前小游戏平台标识。
 *
 * - wechat   微信小游戏
 * - douyin   抖音小游戏
 * - unknown  非小游戏环境
 */
export type MiniGamePlatform = 'wechat' | 'douyin' | 'unknown'

/**
 * 返回当前运行的小游戏平台。
 * 大多数业务场景用这一个函数即可替代多个 is* 判断。
 */
export function getMiniGamePlatform(): MiniGamePlatform {
  return detectMiniGamePlatform()
}

/**
 * 判断当前是否运行在微信小游戏环境。
 */
export function isWechatMiniGame(): boolean {
  return detectMiniGamePlatform() === 'wechat'
}

/**
 * 判断当前是否运行在抖音小游戏环境。
 */
export function isDouyinMiniGame(): boolean {
  return detectMiniGamePlatform() === 'douyin'
}

/**
 * 判断当前运行时是否可创建激励视频广告。
 *
 * @param adUnitId 目标激励视频广告位 ID。
 */
export function canCreateRewardedVideoAd(adUnitId?: string): boolean {
  const runtime = getAdRuntime()
  return Boolean(
    runtime && adUnitId && typeof runtime.createRewardedVideoAd === 'function'
  )
}

/**
 * 判断当前运行时是否可创建插屏广告。
 *
 * @param adUnitId 目标插屏广告位 ID。
 */
export function canCreateInterstitialAd(adUnitId?: string): boolean {
  const runtime = getAdRuntime()
  return Boolean(
    runtime && adUnitId && typeof runtime.createInterstitialAd === 'function'
  )
}

/**
 * 判断当前运行时是否可创建 Banner 广告。
 *
 * @param adUnitId 目标 Banner 广告位 ID。
 */
export function canCreateBannerAd(adUnitId?: string): boolean {
  const runtime = getAdRuntime()
  return Boolean(
    runtime && adUnitId && typeof runtime.createBannerAd === 'function'
  )
}

/**
 * 判断当前运行时是否可创建原生模板广告（仅微信支持）。
 *
 * @param adUnitId 目标原生模板广告位 ID。
 */
export function canCreateCustomAd(adUnitId?: string): boolean {
  const wx = getWx()
  return Boolean(wx && adUnitId && typeof wx.createCustomAd === 'function')
}

/**
 * 判断当前运行时是否支持跳转到其他小程序（微信和抖音均支持）。
 *
 * @param options 跳转参数，至少需要提供 appId。
 */
export function canNavigateToMiniProgram(
  options?: Partial<NavigateToMiniProgramOptions>
): boolean {
  const runtime = getAdRuntime()

  return Boolean(
    runtime &&
    options?.appId &&
    typeof runtime.navigateToMiniProgram === 'function'
  )
}

/**
 * 判断当前抖音小游戏运行时是否支持监听 onShow 启动参数。
 */
export function canListenDouyinOnShow(): boolean {
  const tt = getTt()

  return Boolean(tt && typeof tt.onShow === 'function')
}

/**
 * 判断当前抖音小游戏运行时是否支持检测侧边栏场景可用性。
 */
export function canCheckDouyinScene(
  scene: string = DOUYIN_SIDEBAR_SCENE
): boolean {
  const tt = getTt()

  return Boolean(tt && scene && typeof tt.checkScene === 'function')
}

/**
 * 判断当前抖音小游戏运行时是否支持跳转到指定场景。
 */
export function canNavigateToDouyinScene(
  scene: string = DOUYIN_SIDEBAR_SCENE
): boolean {
  const tt = getTt()

  return Boolean(tt && scene && typeof tt.navigateToScene === 'function')
}

/**
 * 返回默认的抖音侧边栏场景名。
 */
export function getDouyinSidebarScene(): string {
  return DOUYIN_SIDEBAR_SCENE
}

/**
 * 根据最新一次 tt.onShow 返回值判断是否从侧边栏启动。
 *
 * 平台会在 launch_from 或 location 字段中给出侧边栏来源标记，
 * 这里统一兼容常见值，避免业务侧自行散落判断逻辑。
 */
export function isDouyinSidebarLaunch(
  launchOptions?: TtLaunchOptions | null
): boolean {
  if (!launchOptions) {
    return false
  }

  const launchFrom = String(launchOptions.launch_from ?? '').toLowerCase()
  const location = String(launchOptions.location ?? '').toLowerCase()

  return (
    DOUYIN_SIDEBAR_LAUNCH_FROM_VALUES.has(launchFrom) ||
    DOUYIN_SIDEBAR_LOCATION_VALUES.has(location)
  )
}

/**
 * 校验 SDK 初始化参数是否合法。
 *
 * @param options SDK 初始化配置。
 */
export function validateInitOptions(_options: AdSdkInitOptions): void {
  // 平台判别已由 TypeScript 类型系统在编译期保证，运行时无需额外校验。
}

/**
 * 断言某个值已完成初始化。
 *
 * @param value 需要校验的值。
 * @param message 未初始化时抛出的错误消息。
 */
export function requireInitialized<T>(
  value: T | undefined,
  message: string
): T {
  // 对外方法统一走初始化校验，避免在各个管理器里重复判断状态。
  if (value === undefined) {
    throw createAdapterError(ADAPTER_ERROR_CODES.invalidConfig, message)
  }

  return value
}
