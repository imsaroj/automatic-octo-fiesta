import { delay, http, HttpResponse } from "msw"
import { parseUsersQuery } from "@/api/users-query"
import {
  insertUser,
  patchUser,
  queryUsers,
  removeUser,
  type NewUser,
} from "@/mocks/users-dataset"

/** Network latency (ms) so loading states are visible in the demo. */
const LATENCY = 450
/** Shorter latency for mutations so the demo stays snappy. */
const MUTATION_LATENCY = 300

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
    // The stable `PageResponse<T>` contract the library speaks: `page` is
    // one-based (the request page is zero-based here, hence `page + 1`).
    return HttpResponse.json({
      content,
      page: page + 1,
      size,
      totalElements: total,
      totalPages,
    })
  }),

  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as NewUser
    await delay(MUTATION_LATENCY)
    const created = insertUser(body)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put("/api/users/:id", async ({ request, params }) => {
    const id = Number(params.id)
    const changes = (await request.json()) as Partial<NewUser>
    await delay(MUTATION_LATENCY)
    const updated = patchUser(id, changes)
    if (!updated) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  http.delete("/api/users/:id", async ({ params }) => {
    const id = Number(params.id)
    await delay(MUTATION_LATENCY)
    const deleted = removeUser(id)
    if (!deleted) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
