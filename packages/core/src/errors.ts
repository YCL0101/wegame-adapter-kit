export const ADAPTER_ERROR_CODES = {
  unsupportedEnvironment: 'UNSUPPORTED_ENVIRONMENT',
  invalidConfig: 'INVALID_CONFIG',
  capabilityUnavailable: 'CAPABILITY_UNAVAILABLE',
  adLoadFailed: 'AD_LOAD_FAILED',
  adShowFailed: 'AD_SHOW_FAILED',
  miniProgramNavigationFailed: 'MINI_PROGRAM_NAVIGATION_FAILED'
} as const

export type AdapterErrorCode =
  (typeof ADAPTER_ERROR_CODES)[keyof typeof ADAPTER_ERROR_CODES]

export class AdapterError extends Error {
  readonly code: AdapterErrorCode
  readonly raw?: unknown

  constructor(code: AdapterErrorCode, message: string, raw?: unknown) {
    super(message)
    this.name = 'AdapterError'
    this.code = code
    this.raw = raw
  }
}

export function createAdapterError(
  code: AdapterErrorCode,
  message: string,
  raw?: unknown
): AdapterError {
  return new AdapterError(code, message, raw)
}

export function normalizeError(
  code: AdapterErrorCode,
  fallbackMessage: string,
  raw?: unknown
): AdapterError {
  if (raw instanceof AdapterError) {
    return raw
  }

  if (raw instanceof Error) {
    return new AdapterError(code, raw.message || fallbackMessage, raw)
  }

  return new AdapterError(code, fallbackMessage, raw)
}
