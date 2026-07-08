/**
 * Public-API smoke check: import one value symbol from **every** subpath of
 * `@workspace/ui`'s `exports` map and reference it, then compile this file with
 * `tsc --noEmit` under the same TS settings `apps/web` uses (see
 * `tooling/api-check/tsconfig.json`). It is never bundled or run — it is the
 * cheap version of api-extractor: accidental type breakage or a renamed
 * entrypoint fails CI here. `./globals.css` is an asset, not a type surface, so
 * it is intentionally excluded.
 */
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { SmartPage } from "@workspace/ui/smart-components/page"
import { AddButton } from "@workspace/ui/smart-components/buttons"
import { SmartCard } from "@workspace/ui/smart-components/smart-card"
import { SmartForm } from "@workspace/ui/form-engine"
import { SmartSearchForm } from "@workspace/ui/search-engine"
import { SmartGrid } from "@workspace/ui/data-grid"
import { SmartTree } from "@workspace/ui/tree-engine"
import { SmartTransferList } from "@workspace/ui/transfer-list-engine"
import { SmartCalendar } from "@workspace/ui/calendar-engine"
import { SmartTextEditor } from "@workspace/ui/lexical-text-editor"

// Reference each symbol so `noUnusedLocals` proves the import actually resolved.
void cn
void Button
void useIsMobile
void SmartPage
void AddButton
void SmartCard
void SmartForm
void SmartSearchForm
void SmartGrid
void SmartTree
void SmartTransferList
void SmartCalendar
void SmartTextEditor
