export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(input, { ...(init ?? {}), signal: controller.signal })
    clearTimeout(timer)
    return resp
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}
