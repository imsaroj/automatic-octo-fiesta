import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { IDatasource, IGetRowsParams } from "ag-grid-community";
import { SmartServerGrid } from "@/data-grid/server-data-grid";
import type { DataGridColumn } from "@/data-grid/grid-internals";
import type { ServerFetchParams, ServerFetchResult, ServerFilter } from "@/api/pagination";

/**
 * Behavior tests that drive the *real* {@link SmartServerGrid} with AG Grid
 * mocked: the mock immediately fires `onGridReady` with a fake `GridApi` and
 * captures the props (incl. the datasource set via `setGridOption`). This lets
 * us assert the fetch/selection/export/refresh wiring without a real grid.
 */

const h = vi.hoisted(() => ({
  api: undefined as unknown,
  lastProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock("ag-grid-react", async () => {
  const React = await import("react");
  return {
    AgGridReact: (props: { onGridReady?: (event: { api: unknown }) => void }) => {
      h.lastProps = props as Record<string, unknown>;
      const { onGridReady } = props;
      React.useEffect(() => {
        onGridReady?.({ api: h.api });
      }, [onGridReady]);
      return React.createElement("div", { "data-testid": "ag-grid-mock" });
    },
  };
});

// Spy on the export download; keep the rest of the xlsx module real.
vi.mock("@/lib/xlsx", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof XlsxModule;
  return { ...actual, downloadXlsx: vi.fn() };
});
import type * as XlsxModule from "@/lib/xlsx";
import { downloadXlsx } from "@/lib/xlsx";

interface Row {
  id: number;
  name: string;
}

const columns: DataGridColumn<Row>[] = [
  { field: "id", headerName: "ID" },
  { field: "name", headerName: "Name" },
];

const getRowId = (row: Row): string => String(row.id);

interface FakeGridApi {
  datasource?: IDatasource;
  setGridOption: ReturnType<typeof vi.fn>;
  refreshInfiniteCache: ReturnType<typeof vi.fn>;
  purgeInfiniteCache: ReturnType<typeof vi.fn>;
  deselectAll: ReturnType<typeof vi.fn>;
  getColumnState: ReturnType<typeof vi.fn>;
  getFilterModel: ReturnType<typeof vi.fn>;
  applyColumnState: ReturnType<typeof vi.fn>;
  setFilterModel: ReturnType<typeof vi.fn>;
  setColumnsVisible: ReturnType<typeof vi.fn>;
  getAllDisplayedColumns: ReturnType<typeof vi.fn>;
  forEachNode: ReturnType<typeof vi.fn>;
  getCellValue: ReturnType<typeof vi.fn>;
}

function createFakeGridApi(): FakeGridApi {
  const self: FakeGridApi = {
    datasource: undefined,
    setGridOption: vi.fn((key: string, value: unknown) => {
      if (key === "datasource") self.datasource = value as IDatasource;
    }),
    refreshInfiniteCache: vi.fn(),
    purgeInfiniteCache: vi.fn(),
    deselectAll: vi.fn(),
    getColumnState: vi.fn(() => []),
    getFilterModel: vi.fn(() => ({})),
    applyColumnState: vi.fn(),
    setFilterModel: vi.fn(),
    setColumnsVisible: vi.fn(),
    getAllDisplayedColumns: vi.fn(() => [
      { getColDef: () => ({ headerName: "ID" }), getColId: () => "id" },
      { getColDef: () => ({ headerName: "Name" }), getColId: () => "name" },
    ]),
    forEachNode: vi.fn((cb: (node: { data: Row; id: string }) => void) => {
      [{ id: 1, name: "Ada" }].forEach((row) => cb({ data: row, id: String(row.id) }));
    }),
    getCellValue: vi.fn(
      ({ rowNode, colKey }: { rowNode: { data: Row }; colKey: { getColId: () => string } }) =>
        rowNode.data[colKey.getColId() as keyof Row],
    ),
  };
  return self;
}

let api: FakeGridApi;

beforeEach(() => {
  api = createFakeGridApi();
  h.api = api;
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Build a getRows request matching AG Grid's `IGetRowsParams` shape. */
function getRowsRequest(overrides: Partial<IGetRowsParams> = {}): {
  request: IGetRowsParams;
  successCallback: ReturnType<typeof vi.fn>;
  failCallback: ReturnType<typeof vi.fn>;
} {
  const successCallback = vi.fn();
  const failCallback = vi.fn();
  const request = {
    startRow: 0,
    endRow: 20,
    sortModel: [],
    filterModel: {},
    successCallback,
    failCallback,
    context: undefined,
    ...overrides,
  } as unknown as IGetRowsParams;
  return { request, successCallback, failCallback };
}

describe("SmartServerGrid — datasource fetch", () => {
  it("normalizes paging/sort and merges external filters into fetchRows", async () => {
    const external: ServerFilter[] = [
      { field: "status", filterType: "text", type: "equals", value: "Active" },
    ];
    const fetchRows = vi
      .fn<(params: ServerFetchParams, signal: AbortSignal) => Promise<ServerFetchResult<Row>>>()
      .mockResolvedValue({ rows: [{ id: 1, name: "Ada" }], total: 1 });

    render(
      <SmartServerGrid
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
        filters={external}
        columnFilters={false}
      />,
    );

    const ds = api.datasource;
    expect(ds).toBeDefined();

    const { request, successCallback } = getRowsRequest({
      startRow: 40,
      endRow: 60,
      sortModel: [{ colId: "name", sort: "asc" }],
    });

    await act(async () => {
      ds?.getRows(request);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchRows).toHaveBeenCalledTimes(1);
    const [params, signal] = fetchRows.mock.calls[0];
    expect(params.page).toBe(2); // floor(40 / 20)
    expect(params.pageSize).toBe(20);
    expect(params.sort).toEqual([{ field: "name", dir: "asc" }]);
    expect(params.filters).toEqual(external); // column filters off + external merged
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(successCallback).toHaveBeenCalledWith([{ id: 1, name: "Ada" }], 1);
  });

  it("shows the error panel and retries (purges the cache) on failure", async () => {
    const fetchRows = vi
      .fn<(params: ServerFetchParams, signal: AbortSignal) => Promise<ServerFetchResult<Row>>>()
      .mockRejectedValue(new Error("Server exploded"));

    render(<SmartServerGrid columns={columns} fetchRows={fetchRows} getRowId={getRowId} />);

    const { request, failCallback } = getRowsRequest();
    await act(async () => {
      api.datasource?.getRows(request);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(failCallback).toHaveBeenCalled();
    expect(await screen.findByText(/couldn.t load data/i)).toBeInTheDocument();
    expect(screen.getByText("Server exploded")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(api.purgeInfiniteCache).toHaveBeenCalledTimes(1);
  });
});

describe("SmartServerGrid — toolbar actions", () => {
  const fetchRows = (): Promise<ServerFetchResult<Row>> =>
    Promise.resolve({ rows: [{ id: 1, name: "Ada" }], total: 1 });

  it("refreshes the infinite cache from the Refresh button", async () => {
    render(<SmartServerGrid columns={columns} fetchRows={fetchRows} getRowId={getRowId} />);
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(api.refreshInfiniteCache).toHaveBeenCalledTimes(1);
  });

  it("exports the displayed columns and loaded rows to .xlsx", async () => {
    render(
      <SmartServerGrid
        title="Users"
        exportFileName="users"
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /export/i }));

    expect(downloadXlsx).toHaveBeenCalledTimes(1);
    const call = (downloadXlsx as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const [fileName, sheet] = call as [
      string,
      { name: string; headers: string[]; rows: unknown[] },
    ];
    expect(fileName).toMatch(/^users-/);
    expect(sheet.name).toBe("Users");
    expect(sheet.headers).toEqual(["ID", "Name"]);
    expect(sheet.rows).toEqual([[1, "Ada"]]);
  });
});

describe("SmartServerGrid — external filters", () => {
  const fetchRows = (): Promise<ServerFetchResult<Row>> => Promise.resolve({ rows: [], total: 0 });

  it("purges the cache when the filters identity changes, but not on mount", () => {
    const filtersA: ServerFilter[] = [
      { field: "name", filterType: "text", type: "contains", value: "a" },
    ];
    const filtersB: ServerFilter[] = [
      { field: "name", filterType: "text", type: "contains", value: "b" },
    ];

    const view = (filters: ServerFilter[]) => (
      <SmartServerGrid
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
        filters={filters}
        columnFilters={false}
      />
    );

    const { rerender } = render(view(filtersA));
    // Mount must not purge (the datasource's own first fetch covers it).
    expect(api.purgeInfiniteCache).not.toHaveBeenCalled();

    rerender(view(filtersB));
    expect(api.purgeInfiniteCache).toHaveBeenCalledTimes(1);
  });
});
