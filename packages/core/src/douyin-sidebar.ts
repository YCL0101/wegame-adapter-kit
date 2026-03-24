import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from './errors'
import {
  canCheckDouyinScene,
  canListenDouyinOnShow,
  canNavigateToDouyinScene,
  getDouyinSidebarScene,
  getTt,
  isDouyinSidebarLaunch
} from './guards'
import type {
  DouyinSidebarAvailabilityOptions,
  DouyinSidebarLaunchState,
  DouyinSidebarNavigationOptions
} from './types'
import type { TtLaunchOptions } from './douyin'

/**
 * 抖音小游戏侧边栏能力封装。
 *
 * 该类负责：
 * 1. 在游戏启动时尽早监听 tt.onShow，持续缓存最新启动参数。
 * 2. 判断当前用户是否从侧边栏启动小游戏。
 * 3. 检测侧边栏场景是否可用。
 * 4. 发起跳转到侧边栏。
 */
export class DouyinSidebar {
  private latestLaunchOptions: TtLaunchOptions | null = null
  private listening = false
  private readonly onShowHandler = (options: TtLaunchOptions): void => {
    // 侧边栏奖励必须基于最新一次 onShow 返回值判断，避免热启动返回时状态过期。
    this.latestLaunchOptions = options
  }

  /**
   * 同步注册 tt.onShow 监听。
   *
   * 建议在 game.js 或尽可能早的启动时机调用。
   */
  startListening(): void {
    if (this.listening) {
      return
    }

    const tt = getTt()

    if (!tt || !canListenDouyinOnShow()) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Douyin onShow listening is unavailable in the current environment.'
      )
    }

    tt.onShow?.(this.onShowHandler)
    this.listening = true
  }

  /**
   * 取消 tt.onShow 监听。
   */
  stopListening(): void {
    if (!this.listening) {
      return
    }

    const tt = getTt()
    tt?.offShow?.(this.onShowHandler)
    this.listening = false
  }

  /**
   * 获取最近一次缓存的启动参数。
   */
  getLatestLaunchOptions(): TtLaunchOptions | null {
    return this.latestLaunchOptions
  }

  /**
   * 获取当前侧边栏启动状态快照。
   */
  getLaunchState(): DouyinSidebarLaunchState {
    return {
      launchOptions: this.latestLaunchOptions,
      launchedFromSidebar: isDouyinSidebarLaunch(this.latestLaunchOptions)
    }
  }

  /**
   * 判断当前最新启动状态是否来自侧边栏。
   */
  isLaunchedFromSidebar(): boolean {
    return isDouyinSidebarLaunch(this.latestLaunchOptions)
  }

  /**
   * 检测当前宿主是否支持跳转侧边栏。
   */
  async checkAvailability(
    options?: DouyinSidebarAvailabilityOptions
  ): Promise<boolean> {
    const scene = options?.scene ?? getDouyinSidebarScene()

    if (!canCheckDouyinScene(scene)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Douyin sidebar scene check is unavailable in the current environment.',
        options
      )
    }

    const tt = getTt()

    if (!tt?.checkScene) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.unsupportedEnvironment,
        'Douyin mini-game runtime is unavailable.',
        options
      )
    }

    return new Promise<boolean>((resolve, reject) => {
      tt.checkScene?.({
        scene,
        success: (result) => resolve(Boolean(result.isExist)),
        fail: (error) => {
          reject(
            normalizeError(
              ADAPTER_ERROR_CODES.capabilityUnavailable,
              'Failed to check Douyin sidebar scene availability.',
              error
            )
          )
        }
      })
    })
  }

  /**
   * 跳转到抖音侧边栏场景。
   */
  async navigate(options?: DouyinSidebarNavigationOptions): Promise<void> {
    const scene = options?.scene ?? getDouyinSidebarScene()

    if (!canNavigateToDouyinScene(scene)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Douyin sidebar navigation is unavailable in the current environment.',
        options
      )
    }

    const tt = getTt()

    if (!tt?.navigateToScene) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.unsupportedEnvironment,
        'Douyin mini-game runtime is unavailable.',
        options
      )
    }

    return new Promise<void>((resolve, reject) => {
      tt.navigateToScene?.({
        scene,
        success: () => resolve(),
        fail: (error) => {
          reject(
            normalizeError(
              ADAPTER_ERROR_CODES.miniProgramNavigationFailed,
              'Failed to navigate to Douyin sidebar scene.',
              error
            )
          )
        }
      })
    })
  }
}

/**
 * 默认抖音侧边栏实例。
 *
 * 适合在 game.js 中直接导入并尽早调用 startListening。
 */
export const douyinSidebar = new DouyinSidebar()
