import { delay, http, HttpResponse } from "msw"
import { parseUsersQuery } from "@/api/users-query"
import { queryUsers } from "@/mocks/users-dataset"

/** Network latency (ms) so loading states are visible in the demo. */
const LATENCY = 450

export const handlers = [
  http.get("/api/users", async ({ request }) => {
    const url = new URL(request.url)

    if (url.searchParams.get("simulateError") === "1") {
      await delay(LATENCY)
      return HttpResponse.json(
        { message: "Simulated server error (HTTP 500)." },
        { status: 500 }
      )
    }

    const { page, size, sorts, filters } = parseUsersQuery(url.searchParams)
    const { content, total } = queryUsers({ page, size, sorts, filters })
    await delay(LATENCY)

    const totalPages = size > 0 ? Math.ceil(total / size) : 0
    return HttpResponse.json({
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalElements: total,
      totalPages,
      number: page,
      size,
      first: page === 0,
      last: page >= totalPages - 1,
      numberOfElements: content.length,
      empty: content.length === 0,
    })
  }),
]
