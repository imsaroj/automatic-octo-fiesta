import { z } from "zod"
import {
  pageSchema,
  type ServerFetchParams,
  type ServerFetchResult,
} from "@workspace/ui/data-grid"
import { buildUsersQuery } from "@/api/users-query"

export const userRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.enum(["Active", "Inactive", "Pending"]),
  mrr: z.number(),
})

export type UserRow = z.infer<typeof userRowSchema>

const usersPageSchema = pageSchema(userRowSchema)

/**
 * `fetchRows` adapter for SmartServerGrid: serializes normalized grid params to
 * the Spring query contract, calls the MSW-mocked endpoint, and validates the
 * response shape with Zod.
 */
export async function fetchUsersPage(
  params: ServerFetchParams,
  signal: AbortSignal,
  options: { simulateError?: boolean } = {}
): Promise<ServerFetchResult<UserRow>> {
  const query = buildUsersQuery(params)
  const suffix = options.simulateError ? "&simulateError=1" : ""
  const res = await fetch(`/api/users?${query}${suffix}`, { signal })
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  const data: unknown = await res.json()
  const page = usersPageSchema.parse(data)
  return { rows: page.content, total: page.totalElements }
}
