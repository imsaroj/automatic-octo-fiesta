# 0004 — `PageResponse<T>` server contract

- **Status:** Accepted

## Context

`SmartServerGrid` needs a server paging/sorting/filtering protocol. AG Grid's
infinite row model speaks `IGetRowsParams` (start/end row, sort model, filter
model); the server needs a stable request/response shape. The library must not be
coupled to any one backend framework's internal pagination types.

## Decision

Normalize on a dedicated **`PageResponse<T>`** envelope for responses — a stable,
framework-agnostic contract the backend is responsible for producing:

```jsonc
{ "content": [...], "page": 1, "size": 20, "totalElements": 20, "totalPages": 4 }
```

`pagination.ts` owns `ServerFetchParams`/`ServerFetchResult`,
`buildServerFetchParams` (AG Grid → normalized), `pageResponseSchema` (Zod
validation of the envelope), `toSortParams`, and `buildPageQuery`/`encodePageFilter`
for requests. The grid only reads `content` and `totalElements`; the remaining
metadata is validated for fail-loud safety but not consumed.

## Consequences

- **Pro:** A stable API contract the frontend fully controls — no coupling to any
  backend framework's internal page metadata. The backend maps its native page
  type (e.g. Spring Data's `Page<T>`) into `PageResponse<T>` at its own boundary.
- **Pro:** Responses are **Zod-validated** at the boundary
  (`pageResponseSchema(...).parse`) — malformed pages fail loudly, not silently.
- **Pro:** The transport-agnostic `ServerFetchParams` decouples AG Grid from the
  wire format; `createPageFetcher` makes the fetch→parse pipeline reusable.
- **Con:** Backends must expose the `PageResponse<T>` shape (a thin mapping step)
  rather than serializing their native page type directly. The request **decoder**
  stays app/mock-side by design.
- **Con:** Couples the grid's mental model to one pagination dialect; a cursor-based
  API would need a different fetcher.
