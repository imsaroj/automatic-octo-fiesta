import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  buildFlatQuery,
  buildPageQuery,
  buildServerFetchParams,
  encodePageFilter,
  pageResponseSchema,
  toServerFilters,
  toSortParams,
} from "@/data-grid/pagination"
import type { ServerFetchParams } from "@/data-grid/pagination"

const userRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  mrr: z.number(),
})

describe("pageResponseSchema", () => {
  it("parses a `PageResponse<T>` envelope", () => {
    const schema = pageResponseSchema(userRowSchema)
    const page = schema.parse({
      content: [{ id: 1, name: "John Doe", mrr: 2500 }],
      page: 1,
      size: 5,
      totalElements: 20,
      totalPages: 4,
    })

    expect(page.content).toHaveLength(1)
    expect(page.totalElements).toBe(20)
    expect(page.page).toBe(1)
  })

  it("rejects a response missing a required field", () => {
    const schema = pageResponseSchema(userRowSchema)
    expect(() =>
      schema.parse({
        content: [],
        page: 1,
        size: 10,
        totalElements: 0,
        // totalPages missing
      })
    ).toThrow()
  })

  it("rejects rows that fail the item schema", () => {
    const schema = pageResponseSchema(userRowSchema)
    expect(() =>
      schema.parse({
        content: [{ id: "not-a-number", name: "X", mrr: 1 }],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      })
    ).toThrow()
  })
})

describe("buildServerFetchParams", () => {
  it("derives page + pageSize from the AG Grid block coordinates", () => {
    const params = buildServerFetchParams({
      startRow: 40,
      endRow: 60,
      sortModel: [],
    })

    expect(params.pageSize).toBe(20)
    expect(params.page).toBe(2) // floor(40 / 20)
    expect(params.startRow).toBe(40)
    expect(params.endRow).toBe(60)
  })

  it("maps the AG Grid sort model to ordered sort instructions", () => {
    const params = buildServerFetchParams({
      startRow: 0,
      endRow: 20,
      sortModel: [
        { colId: "status", sort: "asc" },
        { colId: "mrr", sort: "desc" },
      ],
    })

    expect(params.sort).toEqual([
      { field: "status", dir: "asc" },
      { field: "mrr", dir: "desc" },
    ])
  })

  it("guards against a zero-width block (pageSize never below 1)", () => {
    const params = buildServerFetchParams({
      startRow: 0,
      endRow: 0,
      sortModel: [],
    })
    expect(params.pageSize).toBe(1)
    expect(params.page).toBe(0)
  })
})

describe("toSortParams", () => {
  it("encodes sort instructions as `field,dir` strings", () => {
    expect(
      toSortParams([
        { field: "name", dir: "asc" },
        { field: "mrr", dir: "desc" },
      ])
    ).toEqual(["name,asc", "mrr,desc"])
  })

  it("returns an empty array when nothing is sorted", () => {
    expect(toSortParams([])).toEqual([])
  })
})

describe("encodePageFilter", () => {
  it("encodes a scalar operator as `<op>:<value>`", () => {
    expect(
      encodePageFilter({
        field: "name",
        filterType: "text",
        type: "contains",
        value: "ada",
      })
    ).toBe("contains:ada")
  })

  it("encodes an `inRange` filter with both bounds", () => {
    expect(
      encodePageFilter({
        field: "mrr",
        filterType: "number",
        type: "inRange",
        value: 1000,
        valueTo: 2000,
      })
    ).toBe("inRange:1000:2000")
  })

  it("encodes an array (set) value as a comma-joined `set:` list", () => {
    expect(
      encodePageFilter({
        field: "status",
        filterType: "set",
        type: "set",
        value: ["Active", "Pending"],
      })
    ).toBe("set:Active,Pending")
  })

  it("prefers the range branch over the array branch when both could apply", () => {
    // inRange is checked first, so an array `value` is still stringified as a scalar.
    expect(
      encodePageFilter({
        field: "mrr",
        filterType: "number",
        type: "inRange",
        value: [1, 2],
        valueTo: 3,
      })
    ).toBe("inRange:1,2:3")
  })
})

describe("buildPageQuery", () => {
  const base: ServerFetchParams = {
    startRow: 0,
    endRow: 20,
    page: 0,
    pageSize: 20,
    sort: [],
    filters: [],
  }

  it("always emits page + size, even with no sort or filters", () => {
    expect(buildPageQuery(base)).toBe("page=0&size=20")
  })

  it("appends one repeated `sort` param per sorted column, in order", () => {
    const query = buildPageQuery({
      ...base,
      sort: [
        { field: "name", dir: "asc" },
        { field: "mrr", dir: "desc" },
      ],
    })
    // URLSearchParams encodes the comma, so decode before asserting the shape.
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&sort=name,asc&sort=mrr,desc"
    )
  })

  it("serializes each filter as `<field>=<op>:<value>`", () => {
    const query = buildPageQuery({
      ...base,
      filters: [
        { field: "name", filterType: "text", type: "contains", value: "ada" },
        {
          field: "mrr",
          filterType: "number",
          type: "inRange",
          value: 1000,
          valueTo: 2000,
        },
        {
          field: "status",
          filterType: "set",
          type: "set",
          value: ["Active", "Pending"],
        },
      ],
    })
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&name=contains:ada&mrr=inRange:1000:2000&status=set:Active,Pending"
    )
  })

  it("percent-encodes values that contain reserved characters", () => {
    const query = buildPageQuery({
      ...base,
      filters: [
        { field: "name", filterType: "text", type: "contains", value: "a b&c" },
      ],
    })
    // Raw output stays URL-safe…
    expect(query).toContain("name=contains%3Aa+b%26c")
    // …and round-trips back to the intended operator value.
    expect(new URLSearchParams(query).get("name")).toBe("contains:a b&c")
  })
})

describe("buildFlatQuery", () => {
  const base: ServerFetchParams = {
    startRow: 0,
    endRow: 20,
    page: 0,
    pageSize: 20,
    sort: [],
    filters: [],
  }

  it("always emits page + size", () => {
    expect(buildFlatQuery(base)).toBe("page=0&size=20")
  })

  it("emits bare `field=value` filters with no operator prefix", () => {
    const query = buildFlatQuery({
      ...base,
      filters: [
        { field: "name", filterType: "text", type: "contains", value: "ada" },
      ],
    })
    expect(decodeURIComponent(query)).toBe("page=0&size=20&name=ada")
  })

  it("splits an inRange filter into `<field>From` / `<field>To`", () => {
    const query = buildFlatQuery({
      ...base,
      filters: [
        {
          field: "mrr",
          filterType: "number",
          type: "inRange",
          value: 1000,
          valueTo: 2000,
        },
      ],
    })
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&mrrFrom=1000&mrrTo=2000"
    )
  })

  it("repeats the key for each value of a set filter", () => {
    const query = buildFlatQuery({
      ...base,
      filters: [
        {
          field: "status",
          filterType: "set",
          type: "set",
          value: ["Active", "Pending"],
        },
      ],
    })
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&status=Active&status=Pending"
    )
  })

  it("appends one repeated `sort` param per sorted column, in order", () => {
    const query = buildFlatQuery({
      ...base,
      sort: [
        { field: "name", dir: "asc" },
        { field: "mrr", dir: "desc" },
      ],
    })
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&sort=name,asc&sort=mrr,desc"
    )
  })
})

describe("toServerFilters", () => {
  it("maps strings and booleans to text/equals filters", () => {
    expect(
      toServerFilters({ search: "ada", active: true, disabled: false })
    ).toEqual([
      { field: "search", filterType: "text", type: "equals", value: "ada" },
      { field: "active", filterType: "text", type: "equals", value: true },
      { field: "disabled", filterType: "text", type: "equals", value: false },
    ])
  })

  it("drops values with no filter intent (undefined, null, empty string, empty array)", () => {
    expect(
      toServerFilters({ a: undefined, b: null, c: "", d: [], e: "keep" })
    ).toEqual([
      { field: "e", filterType: "text", type: "equals", value: "keep" },
    ])
  })

  it("maps numbers to number/equals and arrays to set filters", () => {
    expect(toServerFilters({ mrr: 0, status: ["Active", "Pending"] })).toEqual([
      { field: "mrr", filterType: "number", type: "equals", value: 0 },
      {
        field: "status",
        filterType: "set",
        type: "set",
        value: ["Active", "Pending"],
      },
    ])
  })

  it("maps Date values to date/equals", () => {
    const date = new Date("2026-01-01T00:00:00Z")
    expect(toServerFilters({ createdAt: date })).toEqual([
      { field: "createdAt", filterType: "date", type: "equals", value: date },
    ])
  })

  it("maps { from, to } and { start, end } range objects to inRange", () => {
    expect(
      toServerFilters({
        created: { from: "2026-01-01", to: "2026-01-31" },
        shift: { start: "09:00", end: "17:00" },
      })
    ).toEqual([
      {
        field: "created",
        filterType: "date",
        type: "inRange",
        value: "2026-01-01",
        valueTo: "2026-01-31",
      },
      {
        field: "shift",
        filterType: "date",
        type: "inRange",
        value: "09:00",
        valueTo: "17:00",
      },
    ])
  })

  it("degrades half-open ranges to one-sided comparisons", () => {
    expect(
      toServerFilters({
        created: { from: "2026-01-01" },
        due: { to: "2026-02-01" },
      })
    ).toEqual([
      {
        field: "created",
        filterType: "date",
        type: "greaterThanOrEqual",
        value: "2026-01-01",
      },
      {
        field: "due",
        filterType: "date",
        type: "lessThanOrEqual",
        value: "2026-02-01",
      },
    ])
  })

  it("infers number ranges from numeric bounds", () => {
    expect(toServerFilters({ mrr: { from: 100, to: 200 } })).toEqual([
      {
        field: "mrr",
        filterType: "number",
        type: "inRange",
        value: 100,
        valueTo: 200,
      },
    ])
  })

  it("drops range objects with no bounds and unknown object shapes", () => {
    expect(
      toServerFilters({ created: { from: "", to: undefined }, odd: { x: 1 } })
    ).toEqual([])
  })

  it("applies per-field overrides over the inferred filter", () => {
    expect(
      toServerFilters(
        { name: "ada", roleId: "3" },
        { name: { type: "contains" } }
      )
    ).toEqual([
      { field: "name", filterType: "text", type: "contains", value: "ada" },
      { field: "roleId", filterType: "text", type: "equals", value: "3" },
    ])
  })
})
