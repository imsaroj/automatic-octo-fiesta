# 0004 — Spring Data `Page<T>` server contract

- **Status:** Accepted

## Context

`SmartServerGrid` needs a server paging/sorting/filtering protocol. AG Grid's
infinite row model speaks `IGetRowsParams` (start/end row, sort model, filter
model); the server needs a stable request/response shape.

## Decision

Normalize on the **Spring Data `Page<T>`** envelope for responses (`content`,
`totalElements`, `number`, `size`, …) and a Spring-style query encoder for
requests. `pagination.ts` owns `ServerFetchParams`/`ServerFetchResult`,
`buildServerFetchParams` (AG Grid → normalized), `pageSchema` (Zod validation of
the envelope), `toSpringSort`, and `buildSpringQuery`/`encodeSpringFilter`.

## Consequences

- **Pro:** A ubiquitous, well-understood backend contract; Spring Boot services
  work out of the box.
- **Pro:** Responses are **Zod-validated** at the boundary (`pageSchema(...).parse`)
  — malformed pages fail loudly, not silently.
- **Pro:** The transport-agnostic `ServerFetchParams` decouples AG Grid from the
  wire format; `createPageFetcher` makes the fetch→parse pipeline reusable.
- **Con:** Non-Spring backends must adapt to the envelope (or provide a custom
  `buildQuery`/decoder). The **decoder** stays app/mock-side by design.
- **Con:** Couples the grid's mental model to one pagination dialect; a cursor-based
  API would need a different fetcher.
