/**
 * Public-API smoke check: import one value symbol from **every** subpath of
 * `@iamsaroj/smart-ui`'s `exports` map and reference it, then compile this file with
 * `tsc --noEmit` under the same TS settings `apps/web` uses (see
 * `tooling/api-check/tsconfig.json`). It is never bundled or run — it is the
 * cheap version of api-extractor: accidental type breakage or a renamed
 * entrypoint fails CI here. `./globals.css` is an asset, not a type surface, so
 * it is intentionally excluded.
 */
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { useIsMobile } from "@iamsaroj/smart-ui/hooks/use-mobile"
import { SmartPage } from "@iamsaroj/smart-ui/smart-components/page"
import { AddButton } from "@iamsaroj/smart-ui/smart-components/buttons"
import { SmartCard } from "@iamsaroj/smart-ui/smart-components/smart-card"
import { SmartForm } from "@iamsaroj/smart-ui/form-engine"
import { SmartSearchForm } from "@iamsaroj/smart-ui/search-engine"
import { SmartGrid } from "@iamsaroj/smart-ui/data-grid"
import { SmartTree } from "@iamsaroj/smart-ui/tree-engine"
import { SmartTransferList } from "@iamsaroj/smart-ui/transfer-list-engine"
import { SmartCalendar } from "@iamsaroj/smart-ui/calendar-engine"
import { SmartTextEditor } from "@iamsaroj/smart-ui/lexical-text-editor"

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
