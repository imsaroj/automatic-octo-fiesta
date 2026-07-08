import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { stripLeadingSpaces } from "./leading-space"
import { SmartInput } from "../smart-components/smart-input"
import { SmartTextarea } from "../smart-components/smart-textarea"
import { SmartSearchInput } from "../smart-components/search-input"

/**
 * The leading-space guard's contract: a value can never *start* with
 * whitespace. Space at caret position 0 is swallowed at keydown (which also
 * covers a held, auto-repeating space bar), pasted leading whitespace is
 * stripped before `onChange`, and everything is bypassed by
 * `allowLeadingSpace`.
 */

let container: HTMLDivElement | undefined
let root: Root | undefined
afterEach(() => {
  const mounted = root
  if (mounted) act(() => mounted.unmount())
  container?.remove()
  container = undefined
  root = undefined
})

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  const created = createRoot(container)
  root = created
  act(() => created.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const input = () => container!.querySelector("input") as HTMLInputElement
const textarea = () =>
  container!.querySelector("textarea") as HTMLTextAreaElement

/** Dispatches a Space keydown and reports whether it was blocked. */
const pressSpace = (el: HTMLElement): boolean => {
  let prevented = false
  act(() => {
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(event)
    prevented = event.defaultPrevented
  })
  return prevented
}

/** Sets the value through the native setter and fires an input event. */
const typeValue = (
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
) => {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const nativeSet = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  act(() => {
    nativeSet.call(el, value)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

test("stripLeadingSpaces removes only leading whitespace", () => {
  expect(stripLeadingSpaces("  a b ")).toBe("a b ")
  expect(stripLeadingSpaces("\t\n x")).toBe("x")
  expect(stripLeadingSpaces("a  b")).toBe("a  b")
  expect(stripLeadingSpaces("")).toBe("")
})

test("space is blocked while the input is empty", () => {
  mount(<SmartInput label="Name" />)
  expect(pressSpace(input())).toBe(true)
})

test("space is allowed after the first character", () => {
  mount(<SmartInput label="Name" defaultValue="a" />)
  input().setSelectionRange(1, 1)
  expect(pressSpace(input())).toBe(false)
})

test("space is still blocked when the caret is moved back to the start", () => {
  mount(<SmartInput label="Name" defaultValue="abc" />)
  input().setSelectionRange(0, 0)
  expect(pressSpace(input())).toBe(true)
})

test("blocked space does not reach the consumer's onKeyDown; other keys do", () => {
  const onKeyDown = vi.fn()
  mount(<SmartInput label="Name" onKeyDown={onKeyDown} />)

  pressSpace(input())
  expect(onKeyDown).not.toHaveBeenCalled()

  act(() => {
    input().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "a",
        bubbles: true,
        cancelable: true,
      })
    )
  })
  expect(onKeyDown).toHaveBeenCalledTimes(1)
})

test("pasted leading whitespace is stripped before onChange", () => {
  const seen: string[] = []
  mount(<SmartInput label="Name" onChange={(e) => seen.push(e.target.value)} />)

  typeValue(input(), "   hello")
  expect(seen).toEqual(["hello"])
  expect(input().value).toBe("hello")
})

test("allowLeadingSpace opts out of both the key block and the stripping", () => {
  const seen: string[] = []
  mount(
    <SmartInput
      label="Name"
      allowLeadingSpace
      onChange={(e) => seen.push(e.target.value)}
    />
  )

  expect(pressSpace(input())).toBe(false)
  typeValue(input(), "  hi")
  expect(seen).toEqual(["  hi"])
})

test("SmartTextarea blocks a leading space too", () => {
  mount(<SmartTextarea label="Bio" />)
  expect(pressSpace(textarea())).toBe(true)

  const seen: string[] = []
  act(() =>
    root!.render(
      <SmartTextarea label="Bio" onChange={(e) => seen.push(e.target.value)} />
    )
  )
  typeValue(textarea(), " \n note")
  expect(seen).toEqual(["note"])
})

test("SmartSearchInput reports the stripped query via onValueChange", () => {
  const seen: string[] = []
  const Harness = () => {
    const [query, setQuery] = React.useState("")
    return (
      <SmartSearchInput
        value={query}
        onValueChange={(v) => {
          seen.push(v)
          setQuery(v)
        }}
      />
    )
  }
  mount(<Harness />)

  expect(pressSpace(input())).toBe(true)
  typeValue(input(), "  ada")
  expect(seen).toEqual(["ada"])
  expect(input().value).toBe("ada")
})
