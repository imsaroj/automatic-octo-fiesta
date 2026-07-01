import { setupWorker } from "msw/browser"
import { handlers } from "@/mocks/handlers"

/** Browser MSW worker that serves the mock `/api/users` endpoint. */
export const worker = setupWorker(...handlers)
