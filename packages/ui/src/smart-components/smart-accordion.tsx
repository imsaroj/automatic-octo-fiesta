"use client"

import * as React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

export interface SmartAccordionItem {
  /** Unique identifier. Must match across trigger and content. */
  value: string
  /** Text or node shown in the trigger row. */
  trigger: React.ReactNode
  /** Expanded content panel. */
  content: React.ReactNode
  /** Disable this specific item. */
  disabled?: boolean
}

export interface SmartAccordionProps {
  /** Ordered list of accordion items. */
  items: SmartAccordionItem[]
  /** Allow more than one item open at a time. @default false */
  multiple?: boolean
  /** Uncontrolled default open values. */
  defaultValue?: string[]
  /** Controlled open values. */
  value?: string[]
  onValueChange?: (value: string[]) => void
  className?: string
}

/**
 * Data-driven accordion. Replaces the repetitive item/trigger/content triple.
 *
 * ```tsx
 * // Before
 * <Accordion>
 *   <AccordionItem value="q1">
 *     <AccordionTrigger>How does billing work?</AccordionTrigger>
 *     <AccordionContent>You are billed monthly…</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="q2">
 *     <AccordionTrigger>Can I cancel?</AccordionTrigger>
 *     <AccordionContent>Yes, at any time.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // After
 * <SmartAccordion
 *   items={[
 *     { value: "q1", trigger: "How does billing work?", content: "You are billed monthly…" },
 *     { value: "q2", trigger: "Can I cancel?", content: "Yes, at any time." },
 *   ]}
 * />
 * ```
 *
 * Fall back to native Accordion primitives when items have heterogeneous
 * trigger layouts (icons, badges, counts) that differ per item.
 */
export function SmartAccordion({
  items,
  multiple = false,
  defaultValue,
  value,
  onValueChange,
  className,
}: SmartAccordionProps) {
  return (
    <Accordion
      multiple={multiple}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          disabled={item.disabled}
        >
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
