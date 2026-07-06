import { expect, test, vi } from "vitest"
import type { IGetRowsParams } from "ag-grid-community"

import {
  createGridDatasource,
  type CreateGridDatasourceOptions,
} from "./server-grid-internals"
import type {
  ServerFetchParams,
  ServerFetchResult,
  ServerFilter,
} from "./pagination"

/**
 * Datasource harness for {@link SmartServerGrid}: `createGridDatasource` is the
 * component's entire fetch pipeline (AG Grid block → normalized params →
 * external-filter merge → abortable fetch → success/fail callbacks), extracted
 * so it can be specified without instantiating AG Grid in jsdom. Full-browser
 * grid behavior belongs to the Playwright suite (roadmap 1.3).
 */

type Row = { id: string; name: string }

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Let the datasource's .then/.finally chain run to completion. */
const flush = () => new Promise((r) => setTimeout(r))

/** A fake AG Grid block request (`IGetRowsParams`) with spy callbacks. */
const fakeGetRowsParams = (
  overrides: Partial<{
    startRow: number
    endRow: number
    sortModel: Array<{ colId: string; sort: "asc" | "desc" }>
    filterModel: Record<string, unknown> | null
  }> = {}
) => {
  const successCallback = vi.fn()
  const failCallback = vi.fn()
  return {
    params: {
      startRow: overrides.startRow ?? 0,
      endRow: overrides.endRow ?? 20,
      sortModel: overrides.sortModel ?? [],
      filterModel: overrides.filterModel ?? {},
      successCallback,
      failCallback,
      context: undefined,
    } as unknown as IGetRowsParams,
    successCallback,
    failCallback,
  }
}

/** A datasource wired to spies, with every option overridable per test. */
const harness = (overrides: Partial<CreateGridDatasourceOptions<Row>> = {}) => {
  const fetchRows =
    vi.fn<
      (
        params: ServerFetchParams,
        signal: AbortSignal
      ) => Promise<ServerFetchResult<Row>>
    >()
  const controllers = new Set<AbortController>()
  const onFetchStart = vi.fn()
  const onSuccess = vi.fn()
  const onError = vi.fn()
  const onSettled = vi.fn()
  const datasource = createGridDatasource<Row>({
    getFetchRows: () => fetchRows,
    getExternalFilters: () => undefined,
    controllers,
    onFetchStart,
    onSuccess,
    onError,
    onSettled,
    ...overrides,
  })
  return {
    datasource,
    fetchRows,
    controllers,
    onFetchStart,
    onSuccess,
    onError,
    onSettled,
  }
}

test("translates the block request into normalized paging + sort params", async () => {
  const { datasource, fetchRows } = harness()
  fetchRows.mockResolvedValue({ rows: [], total: 0 })

  const { params } = fakeGetRowsParams({
    startRow: 40,
    endRow: 60,
    sortModel: [{ colId: "name", sort: "desc" }],
  })
  datasource.getRows(params)
  await flush()

  expect(fetchRows).toHaveBeenCalledTimes(1)
  const [serverParams, signal] = fetchRows.mock.calls[0]
  expect(serverParams).toMatchObject({
    startRow: 40,
    endRow: 60,
    page: 2,
    pageSize: 20,
    sort: [{ field: "name", dir: "desc" }],
    filters: [],
  })
  expect(signal).toBeInstanceOf(AbortSignal)
})

test("success: rows + exact total reach successCallback; error state clears", async () => {
  const { datasource, fetchRows, onFetchStart, onSuccess, onError, onSettled } =
    harness()
  const rows: Row[] = [{ id: "1", name: "Ada" }]
  fetchRows.mockResolvedValue({ rows, total: 101 })

  const { params, successCallback, failCallback } = fakeGetRowsParams()
  datasource.getRows(params)
  expect(onFetchStart).toHaveBeenCalledTimes(1)
  await flush()

  expect(successCallback).toHaveBeenCalledWith(rows, 101)
  expect(failCallback).not.toHaveBeenCalled()
  expect(onSuccess).toHaveBeenCalledTimes(1)
  expect(onError).not.toHaveBeenCalled()
  expect(onSettled).toHaveBeenCalledTimes(1)
})

test("merges external (search-form) filters after the grid's column filters", async () => {
  const external: ServerFilter[] = [
    { field: "status", filterType: "set", type: "set", value: ["active"] },
  ]
  const { datasource, fetchRows } = harness({
    getExternalFilters: () => external,
  })
  fetchRows.mockResolvedValue({ rows: [], total: 0 })

  const { params } = fakeGetRowsParams({
    filterModel: {
      name: { filterType: "text", type: "contains", filter: "ada" },
    },
  })
  datasource.getRows(params)
  await flush()

  const [serverParams] = fetchRows.mock.calls[0]
  expect(serverParams.filters).toEqual([
    { field: "name", filterType: "text", type: "contains", value: "ada" },
    ...external,
  ])
})

test("failure: failCallback fires and the coerced message reaches onError", async () => {
  const { datasource, fetchRows, onError, onSettled } = harness()
  fetchRows.mockRejectedValue(new Error("HTTP 500"))

  const { params, successCallback, failCallback } = fakeGetRowsParams()
  datasource.getRows(params)
  await flush()

  expect(successCallback).not.toHaveBeenCalled()
  expect(failCallback).toHaveBeenCalledTimes(1)
  expect(onError).toHaveBeenCalledWith("HTTP 500")
  expect(onSettled).toHaveBeenCalledTimes(1)
})

test("failure with a message-less reason falls back to the generic message", async () => {
  const { datasource, fetchRows, onError } = harness()
  fetchRows.mockRejectedValue("boom")

  const { params } = fakeGetRowsParams()
  datasource.getRows(params)
  await flush()

  expect(onError).toHaveBeenCalledWith("Failed to load data.")
})

test("abort: an aborted block is not an error — no failCallback, no onError", async () => {
  const { datasource, fetchRows, controllers, onError, onSettled } = harness()
  const gate = deferred<ServerFetchResult<Row>>()
  fetchRows.mockImplementation((_params, signal) => {
    // A well-behaved fetch rejects when its signal aborts.
    signal.addEventListener("abort", () => gate.reject(new Error("aborted")))
    return gate.promise
  })

  const { params, successCallback, failCallback } = fakeGetRowsParams()
  datasource.getRows(params)
  expect(controllers.size).toBe(1)

  const [controller] = controllers
  controller.abort()
  await flush()

  expect(successCallback).not.toHaveBeenCalled()
  expect(failCallback).not.toHaveBeenCalled()
  expect(onError).not.toHaveBeenCalled()
  // Settled still runs so the loading overlay never gets stuck.
  expect(onSettled).toHaveBeenCalledTimes(1)
  expect(controllers.size).toBe(0)
})

test("tracks one AbortController per in-flight block and removes it on settle", async () => {
  const { datasource, fetchRows, controllers } = harness()
  const first = deferred<ServerFetchResult<Row>>()
  const second = deferred<ServerFetchResult<Row>>()
  fetchRows
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)

  const a = fakeGetRowsParams({ startRow: 0, endRow: 20 })
  const b = fakeGetRowsParams({ startRow: 20, endRow: 40 })
  datasource.getRows(a.params)
  datasource.getRows(b.params)
  expect(controllers.size).toBe(2)

  first.resolve({ rows: [], total: 40 })
  await flush()
  expect(controllers.size).toBe(1)

  second.resolve({ rows: [], total: 40 })
  await flush()
  expect(controllers.size).toBe(0)
  expect(a.successCallback).toHaveBeenCalledWith([], 40)
  expect(b.successCallback).toHaveBeenCalledWith([], 40)
})

test("reads fetchRows/filters lazily — swapping them affects the NEXT block, not the datasource identity", async () => {
  // Simulates the component's ref pattern: the datasource is created once, but
  // props change over its lifetime.
  const filtersRef: { current?: ServerFilter[] } = {}
  const { datasource, fetchRows } = harness({
    getExternalFilters: () => filtersRef.current,
  })
  fetchRows.mockResolvedValue({ rows: [], total: 0 })

  datasource.getRows(fakeGetRowsParams().params)
  await flush()
  expect(fetchRows.mock.calls[0][0].filters).toEqual([])

  filtersRef.current = [
    { field: "role", filterType: "text", type: "equals", value: "admin" },
  ]
  datasource.getRows(fakeGetRowsParams().params)
  await flush()
  expect(fetchRows.mock.calls[1][0].filters).toEqual(filtersRef.current)
})
