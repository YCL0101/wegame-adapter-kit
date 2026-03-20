import {
  ADAPTER_ERROR_CODES,
  createAdapterError,
  normalizeError
} from './errors'
import { canNavigateToMiniProgram, getAdRuntime } from './guards'
import type { MiniProgramNavigationOptions } from './types'

/**
 * 小程序跳转封装（支持微信 wx 和抖音 tt）。
 */
export class MiniProgramNavigator {
  /**
   * 跳转到其他小程序。
   *
   * @param options 跳转参数，包含目标 appId、path、extraData 等信息。
   */
  async navigate(options: MiniProgramNavigationOptions): Promise<void> {
    if (!canNavigateToMiniProgram(options)) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.capabilityUnavailable,
        'Mini program navigation is unavailable in the current environment.',
        options
      )
    }

    const runtime = getAdRuntime()

    if (!runtime) {
      throw createAdapterError(
        ADAPTER_ERROR_CODES.unsupportedEnvironment,
        'Mini-game runtime is unavailable.',
        options
      )
    }

    return new Promise<void>((resolve, reject) => {
      // 两个平台的 navigateToMiniProgram 签名兼容，统一通过 unknown 转换调用。
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(
        runtime as unknown as { navigateToMiniProgram: (o: unknown) => void }
      ).navigateToMiniProgram({
        ...options,
        success: () => resolve(),
        fail: (error: unknown) => {
          reject(
            normalizeError(
              ADAPTER_ERROR_CODES.miniProgramNavigationFailed,
              'Failed to navigate to mini program.',
              error
            )
          )
        }
      })
    })
  }
}
