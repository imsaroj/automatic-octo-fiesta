import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  buildServerFetchParams,
  buildSpringQuery,
  encodeSpringFilter,
  normalizeFilterModel,
  pageSchema,
  toSpringSort,
} from "@/data-grid/pagination"
import type { ServerFetchParams } from "@/data-grid/pagination"

const userRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  mrr: z.number(),
})

describe("pageSchema", () => {
  it("parses a Spring `Page<T>` envelope", () => {
    const schema = pageSchema(userRowSchema)
    const page = schema.parse({
      content: [{ id: 1, name: "John Doe", mrr: 2500 }],
      pageable: { pageNumber: 0, pageSize: 5 },
      totalElements: 20,
      totalPages: 4,
      number: 0,
      size: 5,
      first: true,
      last: false,
      numberOfElements: 1,
      empty: false,
    })

    expect(page.content).toHaveLength(1)
    expect(page.totalElements).toBe(20)
    expect(page.number).toBe(0)
  })

  it("works with only the required fields present", () => {
    const schema = pageSchema(userRowSchema)
    expect(() =>
      schema.parse({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 10,
      })
    ).not.toThrow()
  })

  it("rejects rows that fail the item schema", () => {
    const schema = pageSchema(userRowSchema)
    expect(() =>
      schema.parse({
        content: [{ id: "not-a-number", name: "X", mrr: 1 }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
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
      filterModel: null,
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
      filterModel: null,
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
      filterModel: null,
    })
    expect(params.pageSize).toBe(1)
    expect(params.page).toBe(0)
  })
})

describe("normalizeFilterModel", () => {
  it("returns an empty list for a missing model", () => {
    expect(normalizeFilterModel(null)).toEqual([])
    expect(normalizeFilterModel(undefined)).toEqual([])
  })

  it("normalizes a text filter", () => {
    const filters = normalizeFilterModel({
      name: { filterType: "text", type: "contains", filter: "John" },
    })
    expect(filters).toEqual([
      {
        field: "name",
        filterType: "text",
        type: "contains",
        value: "John",
        valueTo: undefined,
      },
    ])
  })

  it("normalizes a number range filter", () => {
    const filters = normalizeFilterModel({
      mrr: {
        filterType: "number",
        type: "inRange",
        filter: 1000,
        filterTo: 2000,
      },
    })
    expect(filters[0]).toMatchObject({
      field: "mrr",
      filterType: "number",
      type: "inRange",
      value: 1000,
      valueTo: 2000,
    })
  })

  it("normalizes a set filter to its selected values", () => {
    const filters = normalizeFilterModel({
      status: { filterType: "set", values: ["Active", "Pending"] },
    })
    expect(filters[0]).toMatchObject({
      field: "status",
      filterType: "set",
      type: "set",
      value: ["Active", "Pending"],
    })
  })

  it("collapses a combined (AND/OR) condition to its first predicate", () => {
    const filters = normalizeFilterModel({
      mrr: {
        filterType: "number",
        operator: "AND",
        condition1: { filterType: "number", type: "greaterThan", filter: 500 },
        condition2: { filterType: "number", type: "lessThan", filter: 3000 },
      },
    })
    expect(filters[0]).toMatchObject({
      field: "mrr",
      type: "greaterThan",
      value: 500,
    })
  })
})

describe("toSpringSort", () => {
  it("encodes sort instructions as `field,dir` strings", () => {
    expect(
      toSpringSort([
        { field: "name", dir: "asc" },
        { field: "mrr", dir: "desc" },
      ])
    ).toEqual(["name,asc", "mrr,desc"])
  })

  it("returns an empty array when nothing is sorted", () => {
    expect(toSpringSort([])).toEqual([])
  })
})

describe("encodeSpringFilter", () => {
  it("encodes a scalar operator as `<op>:<value>`", () => {
    expect(
      encodeSpringFilter({
        field: "name",
        filterType: "text",
        type: "contains",
        value: "ada",
      })
    ).toBe("contains:ada")
  })

  it("encodes an `inRange` filter with both bounds", () => {
    expect(
      encodeSpringFilter({
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
      encodeSpringFilter({
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
      encodeSpringFilter({
        field: "mrr",
        filterType: "number",
        type: "inRange",
        value: [1, 2],
        valueTo: 3,
      })
    ).toBe("inRange:1,2:3")
  })
})

describe("buildSpringQuery", () => {
  const base: ServerFetchParams = {
    startRow: 0,
    endRow: 20,
    page: 0,
    pageSize: 20,
    sort: [],
    filters: [],
  }

  it("always emits page + size, even with no sort or filters", () => {
    expect(buildSpringQuery(base)).toBe("page=0&size=20")
  })

  it("appends one repeated `sort` param per sorted column, in order", () => {
    const query = buildSpringQuery({
      ...base,
      sort: [
        { field: "name", dir: "asc" },
        { field: "mrr", dir: "desc" },
      ],
    })
    // URLSearchParams encodes the comma, so decode before asserting Spring shape.
    expect(decodeURIComponent(query)).toBe(
      "page=0&size=20&sort=name,asc&sort=mrr,desc"
    )
  })

  it("serializes each filter as `<field>=<op>:<value>`", () => {
    const query = buildSpringQuery({
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
    const query = buildSpringQuery({
      ...base,
      filters: [
        { field: "name", filterType: "text", type: "contains", value: "a b&c" },
      ],
    })
    // Raw output stays URL-safe…
    expect(query).toContain("name=contains%3Aa+b%26c")
    // …and round-trips back to the intended Spring value.
    expect(new URLSearchParams(query).get("name")).toBe("contains:a b&c")
  })
})
