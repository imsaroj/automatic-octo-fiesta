import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createPageFetcher } from "@/data-grid/create-page-fetcher"
import { buildSpringQuery } from "@/data-grid/pagination"
import type { ServerFetchParams } from "@/data-grid/pagination"

const rowSchema = z.object({ id: z.number(), name: z.string() })

const PARAMS: ServerFetchParams = {
  startRow: 0,
  endRow: 20,
  page: 0,
  pageSize: 20,
  sort: [{ field: "name", dir: "asc" }],
  filters: [
    { field: "name", filterType: "text", type: "contains", value: "a" },
  ],
}

const pageResponse = (rows: { id: number; name: string }[], total: number) => ({
  content: rows,
  totalElements: total,
  totalPages: 1,
  number: 0,
  size: rows.length,
})

const okFetch = (body: unknown): typeof fetch =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
  ) as unknown as typeof fetch

describe("createPageFetcher", () => {
  it("builds the Spring query, calls the injected transport, and returns rows + total", async () => {
    const fetchImpl = okFetch(pageResponse([{ id: 1, name: "Ada" }], 42))
    const fetchRows = createPageFetcher({
      url: "/api/users",
      itemSchema: rowSchema,
      fetchImpl,
    })

    const result = await fetchRows(PARAMS, new AbortController().signal)

    expect(result).toEqual({ rows: [{ id: 1, name: "Ada" }], total: 42 })
    const [calledUrl] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(calledUrl).toBe(`/api/users?${buildSpringQuery(PARAMS)}`)
  })

  it("merges per-call extra params on top of the built query", async () => {
    const fetchImpl = okFetch(pageResponse([], 0))
    const fetchRows = createPageFetcher({
      url: "/api/users",
      itemSchema: rowSchema,
      fetchImpl,
    })

    await fetchRows(PARAMS, new AbortController().signal, {
      simulateError: "1",
    })

    const [calledUrl] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(calledUrl)).toContain("simulateError=1")
  })

  it("throws via mapError on a non-OK response", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("nope", { status: 500 })
    ) as unknown as typeof fetch
    const fetchRows = createPageFetcher({
      url: "/api/users",
      itemSchema: rowSchema,
      fetchImpl,
      mapError: (res) => new Error(`boom ${res.status}`),
    })

    await expect(
      fetchRows(PARAMS, new AbortController().signal)
    ).rejects.toThrow("boom 500")
  })

  it("rejects a response that doesn't match the page envelope", async () => {
    const fetchImpl = okFetch({ content: [{ id: "not-a-number" }] })
    const fetchRows = createPageFetcher({
      url: "/api/users",
      itemSchema: rowSchema,
      fetchImpl,
    })

    await expect(
      fetchRows(PARAMS, new AbortController().signal)
    ).rejects.toThrow()
  })
})
