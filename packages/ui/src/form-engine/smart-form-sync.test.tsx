import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"
import { type FieldDefinition, SmartForm } from "./index"

/**
 * Regression coverage for the "Maximum update depth exceeded" infinite loop that
 * fired when a `SmartForm` field was edited faster than React could settle
 * (holding / repeatedly pressing a key). The two-way `data` <-> form `values`
 * sync raced: the reconcile effect saw the mirrored `data` lag behind the live
 * `values`, called `form.reset` with a *stale* value, and looped — the loop
 * also fought TanStack's per-render `form.update(opts)` reverting to the frozen
 * mount baseline. See `smart-form.tsx`.
 *
 * These tests must keep passing so the loop can never come back.
 */

const schema = z.object({
  // A range field ships an object value + `undefined` default — historically the
  // trickiest shape for the deep-equality guards, so keep it in the fixture.
  text: z.string().min(1),
  note: z.string().optional(),
  range: z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .optional(),
})
type F = z.infer<typeof schema>
const fields: FieldDefinition<F>[] = [
  { name: "text", type: "text", label: "Text" },
  { name: "note", type: "text", label: "Note" },
  { name: "range", type: "daterange", label: "Range" },
]
const EMPTY: F = { text: "", note: "", range: undefined }

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function mount(ui: React.ReactElement) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const nativeSet = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value"
)!.set!

function typeInto(input: HTMLInputElement, value: string) {
  act(() => {
    nativeSet.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

/** Run `fn` while capturing everything React logs to `console.error`. */
function captureConsoleErrors(fn: () => void): string[] {
  const errors: string[] = []
  const spy = vi
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(" "))
    })
  try {
    fn()
  } finally {
    spy.mockRestore()
  }
  return errors
}

test("rapid successive edits never trigger a max-update-depth loop", () => {
  const setDataCalls: F[] = []
  function Harness() {
    const [data, setData] = React.useState<F>(EMPTY)
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={(d) => {
          setDataCalls.push(d)
          setData(d)
        }}
        fields={fields}
      />
    )
  }

  let input!: HTMLInputElement
  const N = 25
  const errors = captureConsoleErrors(() => {
    mount(<Harness />)
    input = container.querySelector(
      '[data-field="text"] input'
    ) as HTMLInputElement
    // Fire the whole burst inside ONE act(): React does not fully settle between
    // events, so the mirrored `data` lags the live form `values` — exactly the
    // race that used to make the reconcile effect reset the form to a stale value
    // and spin into "Maximum update depth exceeded".
    act(() => {
      let s = ""
      for (let i = 0; i < N; i++) {
        s += "a"
        nativeSet.call(input, s)
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })
  })

  // 1. The actual crash: React never reports a runaway update cycle.
  expect(errors.filter((e) => /Maximum update depth/.test(e))).toEqual([])
  // 2. Value integrity: the burst is not reset backward mid-stream.
  expect(input.value).toBe("a".repeat(N))
  // 3. No reset feedback: setData fires ~once per edit, not a multiplied storm.
  //    (Allow a small margin for React's mount/StrictMode double-invokes.)
  expect(setDataCalls.length).toBeLessThanOrEqual(N + 5)
})

test("mounting with initial data is a stable fixpoint (no sync churn)", () => {
  const setDataCalls: F[] = []
  function Harness() {
    const [data, setData] = React.useState<F>({
      text: "seed",
      note: "",
      range: undefined,
    })
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={(d) => {
          setDataCalls.push(d)
          setData(d)
        }}
        fields={fields}
      />
    )
  }
  const errors = captureConsoleErrors(() => mount(<Harness />))
  expect(errors.filter((e) => /Maximum update depth/.test(e))).toEqual([])
  // Nothing changed, so the form must not push edits back on its own.
  expect(setDataCalls).toEqual([])
})

test("genuine external data changes are still adopted into the form", () => {
  let setExternal!: (d: F) => void
  function Harness() {
    const [data, setData] = React.useState<F>({
      text: "start",
      note: "",
      range: undefined,
    })
    setExternal = setData
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={setData}
        fields={fields}
      />
    )
  }
  mount(<Harness />)
  const input = container.querySelector(
    '[data-field="text"] input'
  ) as HTMLInputElement
  expect(input.value).toBe("start")

  // Parent replaces data wholesale (async load / reset after submit). This must
  // stick — the loop fix must not swallow legitimate external updates, and
  // TanStack's per-render `form.update` must not revert it to the mount baseline.
  act(() => setExternal({ text: "loaded", note: "hi", range: undefined }))
  expect(input.value).toBe("loaded")

  // And a subsequent external change still lands (baseline advanced correctly).
  act(() => setExternal({ text: "again", note: "", range: undefined }))
  expect(input.value).toBe("again")
})

test("editing after an external adoption round-trips correctly", () => {
  let setExternal!: (d: F) => void
  let latest: F = EMPTY
  function Harness() {
    const [data, setData] = React.useState<F>(EMPTY)
    setExternal = setData
    latest = data
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={setData}
        fields={fields}
      />
    )
  }
  mount(<Harness />)
  const input = container.querySelector(
    '[data-field="text"] input'
  ) as HTMLInputElement

  act(() => setExternal({ text: "hydrated", note: "", range: undefined }))
  expect(input.value).toBe("hydrated")

  const errors = captureConsoleErrors(() => {
    typeInto(input, "hydrated!")
  })
  expect(errors.filter((e) => /Maximum update depth/.test(e))).toEqual([])
  expect(input.value).toBe("hydrated!")
  expect(latest.text).toBe("hydrated!")
})
