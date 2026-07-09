import { z } from "zod"
import { pageSchema } from "@iamsaroj/smart-ui/data-grid"
import { userRowSchema, type UserRow } from "@/api/users"

/**
 * CRUD client for the users resource — the fetch layer the TanStack Query hooks
 * in the CRUD example page call. Reads validate against the Spring `Page<T>`
 * envelope; writes validate the returned row. This is the recipe real consumer
 * apps copy: a thin, typed, validated transport that Query wraps with caching,
 * retries, and invalidation.
 */

export const newUserSchema = userRowSchema.omit({ id: true })
export type NewUser = z.infer<typeof newUserSchema>

const usersPageSchema = pageSchema(userRowSchema)

export interface UserListParams {
  page?: number
  size?: number
  /** Free-text search matched against the name (server `contains` filter). */
  search?: string
}

export interface UserList {
  rows: UserRow[]
  total: number
}

/** Fetch a page of users, optionally filtered by a name search. */
export const fetchUserList = async (
  { page = 0, size = 20, search }: UserListParams = {},
  signal?: AbortSignal
): Promise<UserList> => {
  const sp = new URLSearchParams({ page: String(page), size: String(size) })
  if (search?.trim()) sp.set("name", `contains:${search.trim()}`)
  const res = await fetch(`/api/users?${sp.toString()}`, { signal })
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`)
  const data: unknown = await res.json()
  const parsed = usersPageSchema.parse(data)
  return { rows: parsed.content, total: parsed.totalElements }
}

/** Create a user; resolves to the persisted row (with its server-assigned id). */
export const createUser = async (input: NewUser): Promise<UserRow> => {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create user (${res.status})`)
  return userRowSchema.parse(await res.json())
}

/** Patch a user; resolves to the updated row. */
export const updateUser = async (
  id: number,
  changes: Partial<NewUser>
): Promise<UserRow> => {
  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(changes),
  })
  if (!res.ok) throw new Error(`Failed to update user (${res.status})`)
  return userRowSchema.parse(await res.json())
}

/** Delete a user by id. */
export const deleteUser = async (id: number): Promise<void> => {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete user (${res.status})`)
}
