import { afterEach, beforeAll, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { expectNoA11yViolations } from "./a11y"
import { SmartForm } from "@imsaroj/smart-ui/form-engine"
import { SmartDialog } from "@imsaroj/smart-ui/smart-components/smart-dialog"
import { SmartSelect } from "@imsaroj/smart-ui/smart-components/smart-select"
import { SmartCombobox } from "@imsaroj/smart-ui/smart-components/smart-combobox"
import { SmartDatePicker } from "@imsaroj/smart-ui/smart-components/smart-date-picker"
import { SmartStepper } from "@imsaroj/smart-ui/smart-components/smart-stepper"
import { SmartTree } from "@imsaroj/smart-ui/tree-engine"
import { SmartTransferList } from "@imsaroj/smart-ui/transfer-list-engine"
import { SmartCalendar } from "@imsaroj/smart-ui/calendar-engine"
import {
  AddButton,
  DeleteButton,
  SaveButton,
} from "@imsaroj/smart-ui/smart-components/buttons"

/**
 * Accessibility smoke tests: render each high-traffic surface and assert axe-core
 * finds no violations. Structural checks only (labels/roles/names/ARIA); layout
 * and contrast are covered by the axe E2E pass. See {@link expectNoA11yViolations}.
 */

// Base UI's ScrollArea viewport (used by SmartTransferList/SmartCombobox popups)
// calls getAnimations() on a timer; jsdom lacks it. Stub it for this file only —
// a global stub changes Base UI's Dialog close-animation path and breaks the
// dialog tests. Vitest isolates each file's environment, so this stays local.
beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== "function") {
    Element.prototype.getAnimations = () => []
  }
})

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

const OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
]

test("SmartForm (one field per major type) has no axe violations", async () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number(),
    role: z.string(),
    active: z.boolean(),
    bio: z.string().optional(),
  })
  type Form = z.infer<typeof schema>
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={[
        { name: "name", type: "text", label: "Name" },
        { name: "email", type: "email", label: "Email" },
        { name: "age", type: "number", label: "Age" },
        { name: "role", type: "select", label: "Role", options: OPTIONS },
        { name: "active", type: "checkbox", label: "Active" },
        { name: "bio", type: "textarea", label: "Bio" },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartDialog (open) has no axe violations", async () => {
  mount(
    <SmartDialog
      open
      header={{ title: "Delete item", subtitle: "This cannot be undone." }}
      footer={<SaveButton />}
    >
      <p>Are you sure you want to delete this item?</p>
    </SmartDialog>
  )
  await expectNoA11yViolations(document.body)
})

test("SmartSelect has no axe violations", async () => {
  mount(
    <SmartSelect
      label="Role"
      placeholder="Choose a role"
      options={OPTIONS}
      value={null}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartCombobox has no axe violations", async () => {
  mount(
    <SmartCombobox
      label="Framework"
      placeholder="Select framework"
      options={OPTIONS}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartDatePicker has no axe violations", async () => {
  mount(<SmartDatePicker label="Start date" placeholder="Pick a date" />)
  await expectNoA11yViolations(container)
})

test("SmartStepper has no axe violations", async () => {
  mount(
    <SmartStepper
      activeStep={1}
      steps={[
        { label: "Account", description: "Credentials" },
        { label: "Profile", description: "About you" },
        { label: "Review", description: "Confirm" },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartTree has no axe violations", async () => {
  mount(
    <SmartTree
      selectionMode="multiple"
      checkable
      defaultExpandAll
      data={[
        {
          id: "src",
          label: "src",
          children: [
            { id: "index", label: "index.ts" },
            { id: "app", label: "app.tsx" },
          ],
        },
        { id: "readme", label: "README.md" },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartTransferList has no axe violations", async () => {
  mount(
    <SmartTransferList
      sourceTitle="Available"
      targetTitle="Selected"
      defaultTargetIds={["b"]}
      items={[
        { id: "a", label: "Alpha" },
        { id: "b", label: "Bravo" },
        { id: "c", label: "Charlie" },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartCalendar (month view) has no axe violations", async () => {
  mount(
    <SmartCalendar
      view="month"
      defaultDate={new Date(2026, 6, 15)}
      events={[
        {
          id: "e1",
          title: "Standup",
          start: new Date(2026, 6, 15, 9, 0),
          end: new Date(2026, 6, 15, 9, 30),
        },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("SmartCalendar (week view) has no axe violations", async () => {
  mount(
    <SmartCalendar
      view="week"
      defaultDate={new Date(2026, 6, 15)}
      events={[
        {
          id: "e1",
          title: "Standup",
          start: new Date(2026, 6, 15, 9, 0),
          end: new Date(2026, 6, 15, 9, 30),
        },
      ]}
    />
  )
  await expectNoA11yViolations(container)
})

test("action buttons row has no axe violations", async () => {
  mount(
    <div>
      <AddButton />
      <SaveButton />
      <DeleteButton />
    </div>
  )
  await expectNoA11yViolations(container)
})
