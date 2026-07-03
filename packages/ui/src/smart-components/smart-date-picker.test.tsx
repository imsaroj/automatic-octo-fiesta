import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { addDays } from "date-fns"

import { SmartDatePicker } from "./smart-date-picker"

/**
 * SmartDatePicker adds field decoration + stepper/today controls around the
 * calendar popover. The stepper contract is pure logic (±1 day, empty starts
 * at midnight-today, matcher-disabled keeps controls active) and is covered
 * exactly; the popover itself is asserted to open with a calendar.
 */

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

const byLabel = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)

function midnightToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

test("renders label/error decoration around the trigger", () => {
  mount(
    <SmartDatePicker
      label="Date of birth"
      required
      error="A date is required."
      placeholder="Pick a date"
    />
  )

  const label = container.querySelector("label")!
  expect(label.textContent).toContain("Date of birth")
  expect(label.textContent).toContain("*")
  const hint = container.querySelector("p")!
  expect(hint.textContent).toBe("A date is required.")
  expect(hint.className).toContain("text-destructive")
  expect(container.textContent).toContain("Pick a date")
})

test("no steppers/todayButton → no control buttons around the picker", () => {
  mount(<SmartDatePicker />)
  expect(byLabel("Previous day")).toBeNull()
  expect(byLabel("Next day")).toBeNull()
  expect(byLabel("Reset to today")).toBeNull()
})

test("steppers move the selected date by ±1 day", () => {
  const onSelect = vi.fn()
  const base = new Date(2026, 5, 15)
  mount(<SmartDatePicker selected={base} onSelect={onSelect} steppers />)

  act(() => byLabel("Previous day")!.click())
  expect(onSelect).toHaveBeenLastCalledWith(addDays(base, -1))

  act(() => byLabel("Next day")!.click())
  expect(onSelect).toHaveBeenLastCalledWith(addDays(base, 1))
})

test("stepping from an empty value starts at midnight today", () => {
  const onSelect = vi.fn()
  mount(<SmartDatePicker onSelect={onSelect} steppers="next" />)

  act(() => byLabel("Next day")!.click())
  expect(onSelect).toHaveBeenCalledWith(addDays(midnightToday(), 1))
})

test('steppers="prev" / "next" render only their side', () => {
  mount(<SmartDatePicker steppers="prev" />)
  expect(byLabel("Previous day")).not.toBeNull()
  expect(byLabel("Next day")).toBeNull()

  act(() => root.render(<SmartDatePicker steppers="next" />))
  expect(byLabel("Previous day")).toBeNull()
  expect(byLabel("Next day")).not.toBeNull()
})

test("todayButton resets to midnight today", () => {
  const onSelect = vi.fn()
  mount(
    <SmartDatePicker
      selected={new Date(2020, 0, 1)}
      onSelect={onSelect}
      todayButton
    />
  )
  act(() => byLabel("Reset to today")!.click())
  expect(onSelect).toHaveBeenCalledWith(midnightToday())
})

test("disabled=true disables trigger and controls; a matcher keeps controls active", () => {
  mount(<SmartDatePicker steppers todayButton disabled />)
  expect(byLabel("Previous day")!.disabled).toBe(true)
  expect(byLabel("Reset to today")!.disabled).toBe(true)

  const onSelect = vi.fn()
  act(() =>
    root.render(
      <SmartDatePicker
        steppers
        onSelect={onSelect}
        disabled={(d: Date) => d.getTime() < 0}
      />
    )
  )
  expect(byLabel("Previous day")!.disabled).toBe(false)
  act(() => byLabel("Previous day")!.click())
  expect(onSelect).toHaveBeenCalled()
})

test("clicking the trigger opens the calendar popover", () => {
  mount(<SmartDatePicker placeholder="Pick a date" />)
  const trigger = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("Pick a date")
  ) as HTMLElement

  act(() => {
    trigger.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    trigger.click()
  })

  expect(document.querySelector('[data-slot="calendar"]')).not.toBeNull()
})
