import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createPageFetcher } from "@/data-grid/create-page-fetcher"
import { buildFlatQuery, buildSpringQuery } from "@/data-grid/pagination"
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

  it("uses a custom `request` transport that returns an already-parsed body", async () => {
    const request = vi.fn<(url: string) => Promise<unknown>>(async () =>
      pageResponse([{ id: 7, name: "Grace" }], 3)
    )
    const fetchRows = createPageFetcher({
      url: "/users",
      itemSchema: rowSchema,
      request,
    })

    const result = await fetchRows(PARAMS, new AbortController().signal)

    expect(result).toEqual({ rows: [{ id: 7, name: "Grace" }], total: 3 })
    const [calledUrl] = request.mock.calls[0]
    expect(String(calledUrl)).toBe(`/users?${buildSpringQuery(PARAMS)}`)
  })

  it("offsets the page number for 1-indexed backends", async () => {
    const request = vi.fn<(url: string) => Promise<unknown>>(async () =>
      pageResponse([], 0)
    )
    const fetchRows = createPageFetcher({
      url: "/users",
      itemSchema: rowSchema,
      pageIndexBase: 1,
      request,
    })

    // PARAMS.page is 0; a 1-indexed backend should receive page=1.
    await fetchRows(PARAMS, new AbortController().signal)

    const [calledUrl] = request.mock.calls[0]
    const sp = new URLSearchParams(String(calledUrl).split("?")[1])
    expect(sp.get("page")).toBe("1")
  })

  it("peels a response envelope via `unwrap` before parsing", async () => {
    const request = vi.fn(async () => ({
      data: pageResponse([{ id: 1, name: "Ada" }], 1),
      status: "OK",
    }))
    const fetchRows = createPageFetcher({
      url: "/users",
      itemSchema: rowSchema,
      request,
      unwrap: (body) => (body as { data: unknown }).data,
    })

    const result = await fetchRows(PARAMS, new AbortController().signal)

    expect(result).toEqual({ rows: [{ id: 1, name: "Ada" }], total: 1 })
  })

  it("skips validation when no itemSchema is given (trusted source)", async () => {
    // A row that would FAIL the schema (id is a string) still passes through.
    const request = vi.fn(async () =>
      pageResponse([{ id: "x", name: "Untyped" } as never], 1)
    )
    const fetchRows = createPageFetcher({ url: "/users", request })

    const result = await fetchRows(PARAMS, new AbortController().signal)

    expect(result).toEqual({ rows: [{ id: "x", name: "Untyped" }], total: 1 })
  })

  it("honors the deprecated `buildQuery` alias when `encodeQuery` is absent", async () => {
    const request = vi.fn<(url: string) => Promise<unknown>>(async () =>
      pageResponse([], 0)
    )
    const fetchRows = createPageFetcher({
      url: "/users",
      itemSchema: rowSchema,
      buildQuery: () => "custom=1",
      request,
    })

    await fetchRows(PARAMS, new AbortController().signal)

    const [aliasUrl] = request.mock.calls[0]
    expect(String(aliasUrl)).toBe("/users?custom=1")
  })

  it("encodes with `buildFlatQuery` when requested", async () => {
    const request = vi.fn<(url: string) => Promise<unknown>>(async () =>
      pageResponse([], 0)
    )
    const fetchRows = createPageFetcher({
      url: "/users",
      itemSchema: rowSchema,
      encodeQuery: buildFlatQuery,
      request,
    })

    await fetchRows(PARAMS, new AbortController().signal)

    const [calledUrl] = request.mock.calls[0]
    // Flat dialect drops the operator prefix: `name=a`, not `name=contains:a`.
    expect(String(calledUrl)).toBe(`/users?${buildFlatQuery(PARAMS)}`)
    expect(String(calledUrl)).toContain("name=a")
  })
})
