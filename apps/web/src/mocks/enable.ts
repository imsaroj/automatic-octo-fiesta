/**
 * Start the MSW mock API in development. No-op in production so the mock worker
 * and dataset never ship. Unhandled requests pass through untouched.
 */
export async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return
  const { worker } = await import("@/mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}
