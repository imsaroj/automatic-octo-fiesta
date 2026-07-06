import { z } from "zod"
import {
  createPageFetcher,
  type ServerFetchParams,
  type ServerFetchResult,
} from "@workspace/ui/data-grid"

export const userRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.enum(["Active", "Inactive", "Pending"]),
  mrr: z.number(),
})

export type UserRow = z.infer<typeof userRowSchema>

/**
 * Validated `fetchRows` adapter for SmartServerGrid, built from the shared
 * `createPageFetcher` helper: it encodes grid params in the Spring dialect,
 * calls the MSW-mocked endpoint, checks the status, and validates the response
 * shape with Zod. New server-grid pages get all of that for free.
 */
const fetchUsers = createPageFetcher({
  url: "/api/users",
  itemSchema: userRowSchema,
})

export const fetchUsersPage = (
  params: ServerFetchParams,
  signal: AbortSignal,
  options: { simulateError?: boolean } = {}
): Promise<ServerFetchResult<UserRow>> =>
  fetchUsers(
    params,
    signal,
    options.simulateError ? { simulateError: "1" } : undefined
  )
