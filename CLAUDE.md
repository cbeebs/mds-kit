# Marathon des Sables Kit Planner

## How to work with me

The person running you is not a developer. They can read, click and judge whether something looks and works right. They cannot read a stack trace, diagnose a build failure, or tell whether an architectural decision was sound. Work accordingly.

**Rules:**

- At the start of every session, read the Milestones section at the end of this file, identify the first unticked milestone, and say in one sentence what it is. Then wait.
- Work one milestone at a time. Do not start the next without being asked.
- Before changing files, say in plain English what you are about to do. Two sentences, not a plan document.
- Run all terminal commands yourself. Never hand the user a command to run unless it genuinely cannot be run from here.
- When something must happen outside the terminal — in Chrome, on GitHub — give exact click-by-click steps, naming the buttons as they actually appear.
- Diagnose and fix your own errors. Escalate only when you need a decision or an action only they can take, and then explain it in plain language with one specific thing to do.
- Do not ask which library, pattern or file structure to use. This file decides, or you decide. Only ask about things a non-developer can judge: how it looks, what it does, what belongs on the kit list.
- At the end of each milestone, write a short "what to check" list: what they should see, where, and what would mean it's wrong. Then commit and push with a plain-English message, and tick the milestone off in this file.
- Never leave the project in a state where `npm run build` fails.
- Explain jargon the first time it appears, in half a sentence.

---

## Product overview

A polished, lightweight Chrome extension and companion dashboard for planning and purchasing approximately 50 items of equipment for the Marathon des Sables.

It should help a user:

- maintain a master kit list
- attach product URLs to individual kit items
- automatically extract product price and weight where possible
- compare total kit cost against a fixed budget
- calculate total carried weight, split into base weight and consumables
- mark items as purchased
- refresh product information
- add extra items manually
- export the full kit list as CSV

The application should feel like a real consumer fintech or premium utility product rather than a hobby spreadsheet.

Design inspiration: Klarna, Zilch, Linear, modern Scandinavian fintech, high-quality Danish digital design. Prioritise usability, legibility and speed over visual gimmicks.

---

## 1. Install model

This extension is loaded **unpacked**, for personal use, and will never be submitted to the Chrome Web Store.

Do not design around store review policy, permission-justification prompts, or minimal-permission constraints. Broad host permissions are acceptable.

---

## 2. Product structure

Two surfaces.

**A. Dashboard.** A full-page extension page showing the complete kit list and totals.

**B. Popup.** When the user is on a product page, clicking the extension icon opens a small popup that assigns the current tab to a kit item.

```
Current page:
HOKA Mafate X Trail Running Shoes

Assign to:
[ Shoes ▼ ]

[ Add product ]
```

On submit: save the URL against that kit item, attempt to detect product name, price and weight, save anything found, show a confirmation state.

---

## 3. Technical stack

- React 18
- TypeScript, `strict: true`
- Vite + `@crxjs/vite-plugin` — do not hand-roll a multi-entry MV3 build config
- Tailwind CSS
- Chrome Extension Manifest V3

No backend. No server. Everything runs locally.

### Manifest

No declared `content_scripts` — inject on demand.

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": { "default_popup": "src/popup/index.html" },
  "background": { "service_worker": "src/background/index.ts", "type": "module" }
}
```

### File structure

```
/src
  /dashboard
    Dashboard.tsx
  /popup
    Popup.tsx
  /background
    index.ts
  /components
  /lib
    storage.ts
    extract.ts
    currency.ts
    weight.ts
    seed.ts
manifest.json
```

---

## 4. Data model

```ts
interface KitItem {
  id: string
  name: string
  category: string
  qty: number                      // default 1
  mandatory?: boolean              // roadbook item — cannot be deleted
  consumable?: boolean             // food, fuel, electrolytes

  productTitle?: string
  retailer?: string
  url?: string

  weightGramsPerUnit?: number
  weightSource?: 'auto' | 'manual'

  priceMinorPerUnit?: number       // integer minor units
  currency?: 'GBP' | 'EUR' | 'USD' // default GBP
  priceSource?: 'auto' | 'manual'

  purchased: boolean
  extractionStatus?: 'complete' | 'partial' | 'manual' | 'needs-capture' | 'error'
  lastRefreshed?: string
  lastRefreshStatus?: 'updated' | 'unchanged' | 'needs-capture' | 'failed'
  isCustom?: boolean
  sortIndex: number
}

interface Settings {
  budgetPence: number                     // default 140000
  minPackWeightGrams: number              // default 6500 — confirm against the 2027 roadbook
  fxRates: { EUR: number; USD: number }   // minor units per 1 GBP, manually editable
}

interface StoredState {
  schemaVersion: 1
  settings: Settings
  items: KitItem[]
}
```

### Persistence

Use `chrome.storage.local`. Persist the whole state object under a single key, `mdsKit:v1`. Debounce writes at 300ms.

Both dashboard and popup subscribe to `chrome.storage.onChanged`, so adding a product from the popup updates an already-open dashboard tab without a reload.

---

## 5. Extraction — three paths

Three distinct ways product data arrives. They have different capabilities and the UI must not pretend otherwise.

**Path A — live capture (popup).** User is on the product page. Popup calls `chrome.scripting.executeScript` into the active tab and runs `extractProductData(document)` against the live DOM. Full fallback chain: JSON-LD → microdata → OpenGraph → common selectors → visible text. This is the reliable path and should be presented as the primary way to add products.

**Path B — background refresh (service worker).** Used by Refresh All, per-row refresh, and URL paste. The service worker does `fetch(url)`, then `new DOMParser().parseFromString(html, 'text/html')`, and reads **JSON-LD only**. No selector guessing, no visible-text parsing — fetched HTML frequently lacks JS-rendered pricing, and guessing produces confidently wrong numbers. If no JSON-LD `Product` node is found, the item is not an error: it is `needs-capture`.

**Path C — URL paste (dashboard).** Saves the URL immediately, derives `retailer` from `new URL(url).hostname.replace(/^www\./, '')`, then runs Path B once. Falls back to `needs-capture`.

### Extraction function

```ts
extractProductData(document: Document): {
  title?: string
  priceMinor?: number
  currency?: string
  weightGrams?: number
}
```

Inspect `<script type="application/ld+json">` first, looking for a `Product` node with `name`, `weight` and `offers.price` / `offers.priceCurrency`. Then meta tags, then visible page text (Path A only). No aggressive scraping.

---

## 6. Refresh

Toolbar button: **Refresh all**.

- Concurrency 4, 10s timeout per URL
- Never overwrite a field whose source is `manual`
- Progress line: `Refreshing 14 of 31 products…`
- On completion, one summary line: `22 updated · 6 need a page visit · 3 couldn't be reached`
- Per-row refresh also available in the row action menu

Rows maintain `lastRefreshed`. Do not show it permanently in the table — surface it in the row menu or on hover, as `Updated 2 hours ago`.

---

## 7. Status values

`complete` · `partial` · `manual` · `needs-capture` · `error`

Keep indicators subtle — a small muted badge, never a warning.

`needs-capture` reads **Open page to capture**. It is the expected outcome for a large minority of retailers, not a failure, and must not be styled as one.

`partial` reads **Weight needed**.

---

## 8. Quantity

Weight and price are stored **per unit**. Line totals are `qty × unit value`.

- Default `qty: 1`. When qty is 1, show nothing.
- When qty > 1, show a small `×3` next to the item name; clicking it becomes an inline number input.
- Price cell shows unit price with the line total beneath in secondary text: `£12.99` / `×3 = £38.97`
- Weight cell behaves the same way.
- Seed defaults: socks ×3, spare socks ×2, spare batteries ×4, food ×7, fuel ×2, safety pins ×10.

Shoe weights are published per shoe, typically UK8. Seed shoes as a single item whose unit weight is the **pair**, with `qty: 1`.

---

## 9. Weight handling

Store weight internally as grams, per unit.

Two totals, always shown together at the top of the page:

```
7.0 kg total
4.9 kg base · 2.1 kg consumables
```

- `base` = sum of line weights where `consumable !== true`
- `consumables` = sum of line weights where `consumable === true`
- Hover on the total reveals grams

Beneath, a thin reference marker for `minPackWeightGrams` (default 6.5 kg). If the total is below it, show `0.4 kg under the pack minimum` in secondary text. Informational, not a warning — no red.

In the table, weights under 1,000 g show in grams (`285 g`), 1,000 g and above in kilograms (`1.24 kg`).

Seeded as consumable: food, fuel, electrolytes, salt tablets.

---

## 10. Price handling

Store values internally as integer minor units. `£149.99 → 14999`.

Display GBP using `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`. High-level metrics may show whole pounds (`£1,400`); individual product prices show pence (`£149.99`).

### Currency

JSON-LD gives `offers.priceCurrency`. Store it. Do not coerce foreign prices into pence.

- Non-GBP prices display in their own currency with a small muted currency tag on the row
- Totals convert using the fixed `fxRates` in Settings; tooltip on the converted value shows the original
- If a price is captured with no currency signal, assume GBP

### Price parser

Prefer `offers.price` + `offers.priceCurrency` above everything.

When falling back to text, detect `£199`, `£199.00`, `GBP 199`, and reject a candidate if:

- it is preceded within 40 characters by `was`, `RRP`, `from`, or sits in a strikethrough element
- it is followed by `/mo`, `per month`, `a month`, `x3`, `x 4`
- it sits inside an element whose class or id matches `klarna|clearpay|paypal|instal|finance|afterpay`

---

## 11. Weight parser

Support `250g`, `250 g`, `250 grams`, `0.25kg`, `0.25 kg`, `8.8 oz`, `Weight: 280 grams`, `Item weight`, `Approx weight`.

Convert everything to grams. `1 oz = 28.3495 g`. Avoid interpreting shipping weight where possible.

Never prevent saving a product because weight extraction failed. The user must always be able to edit a detected weight.

---

## 12. Dashboard layout

Centred desktop layout, generous whitespace, max content width 1280–1440px. Light warm grey background, white content cards.

**Header.** Top-left: `MDS Kit`, with small secondary text `Marathon des Sables kit planner`. Top-right: Refresh all, Export CSV, settings icon. Do not overload the navigation.

**Budget summary.** Below the header, a restrained panel:

```
Budget      £1,400
Spent       £684
Remaining   £716
Projected   £1,186
Kit weight  7.0 kg      4.9 kg base · 2.1 kg consumables
```

`remaining = budget − purchased line total`. Only purchased items count toward Spent. Projected includes every priced item. If some items have no price, show `8 items unpriced` in secondary text so Projected isn't misread as complete.

**Budget progress.** A subtle horizontal bar beneath: `£684 of £1,400 spent`. If spending exceeds budget, remaining goes negative, the bar changes state, and the label reads `£86 over budget`. No alarming styling.

---

## 13. Kit table

Columns: Purchased · Item · Product / URL · Weight · Price · Actions

```
✓ | Shoes | HOKA Mafate X | 682 g | £154.99 | ···
```

Rows are compact but comfortable, and should not each look like an individual card — thin borders and subtle surface variation.

### Grouping

Default view is **grouped by category** in seed order, with a sticky subhead per group:

```
Safety & mandatory          7 of 11 bought          412 g
```

Clicking a sortable column header (item, weight, price, purchased) flattens the table to a single sorted list and switches the toolbar control to `Grouped`. Grouping and sorting are mutually exclusive — do not sort within groups.

Filters: All · To buy · Purchased · Needs capture · Missing price · Missing weight. A compact control, not a sidebar.

### Purchased state

Tick fills, row takes a pale green background, item counts toward Spent. Purchased rows stay editable. Never rely on colour alone.

### Product cell

The detected title links to the saved URL, opening in a new tab. Show the title with the bare hostname beneath, never the full URL:

```
HOKA Mafate X
hoka.com
```

### Row hover

Reveals refresh, open product, delete. Muted until needed.

### Empty states

`Add product` in an empty URL cell. `—` for missing price or weight. No placeholder wording.

### Add item

`+ Add item` at the bottom adds a row with name, category, qty, URL, weight, price, purchased. Custom items can be deleted. Seed items can be renamed and deleted unless `mandatory: true`.

---

## 14. Manual editing

All product information stays editable. Clicking a price or weight turns the cell into an input.

```
285 g   →   [285] g
£149.99 →   £ [149.99]
```

Save on Enter or blur. Escape cancels. Editing sets that field's source to `manual`, protecting it from future refreshes.

Optimistic UI — changes save immediately with a small transient `Saved` state. No save buttons for ordinary row changes. Avoid modals where inline works. Undo toast for deletions rather than a confirmation dialog.

---

## 15. Extension popup

Approximately 360–400px wide.

```
MDS Kit

Detected
HOKA Mafate X
£154.99
682 g

Add to kit item
[ Search kit items…        ▼ ]

[ Add product ]

Open kit dashboard
```

Missing information is stated plainly (`Weight not detected`) and the item can still be added.

The item selector is searchable — there are 50+ items. Typing `shoe` filters to `Running shoes`. Items still missing a product appear first.

On success: `Added to Running shoes ✓`

If the tab isn't a product page: `No product detected on this page`, with manual URL assignment still available.

---

## 16. Seed kit list

Seed from `lib/seed.ts` so it can easily be modified. Every item carries a category, a qty, and where relevant `mandatory` and `consumable`.

**Clothing** — Running shoes · Sand gaiters · Running shorts · Running shirt · Base layer · Warm layer · Waterproof shell · Socks ×3 · Spare socks ×2 · Cap · Sunglasses

**Carry system** — Backpack · Front pouch · Water bottles · Soft flasks

**Sleeping** — Sleeping bag · Sleeping mat

**Food and cooking** — Stove · Fuel ×2 · Cooking pot · Spoon · Food ×7 · Electrolytes · Salt tablets

**Safety and mandatory** — Compass · Whistle · Knife · Head torch · Spare batteries ×4 · Emergency blanket · Venom pump · Signal mirror · Lighter · Antiseptic · Safety pins ×10 · Luminous sticks ×2 · Cash (€) · Passport · Medical certificate · ECG

**Medical and foot care** — Blister kit · Tape · Painkillers · Sunscreen · Lip balm · Hand sanitiser · Anti-chafe balm

**Electronics** — GPS watch · Power bank · Charging cable

**Camp and comfort** — Camp footwear · Pack towel · Wet wipes · Toilet paper · Earplugs · Repair kit (needle, thread, tape) · Trekking poles

Cash and documents carry no weight or price but belong on the checklist. Mark items `mandatory: true` against the current roadbook.

---

## 17. CSV export

Button: **Export CSV**. Filename: `mds-kit-list.csv`.

```
Category, Item, Qty, Product, URL, Retailer, Unit weight (g), Line weight (g),
Unit price, Currency, Line price, Consumable, Mandatory, Purchased, Last refreshed
```

RFC 4180 quoting: wrap any field containing a comma, double quote or newline in double quotes, escaping internal double quotes by doubling them. Product titles contain commas constantly.

---

## 18. Settings

Small: Budget (default £1,400) · Minimum pack weight (default 6.5 kg) · EUR and USD rates.

No account creation, no login, no cloud sync.

---

## 19. First run

Show the pre-populated kit checklist immediately, grouped by category. No onboarding.

An optional line above the table: `Build your kit. Track your weight. Stay on budget.`

---

## 20. Visual design direction

Scandinavian, understated, premium, modern, urban, practical, slightly fintech, calm, highly legible. Klarna × Linear × Danish furniture brand × premium running product.

Avoid: gradients everywhere · glassmorphism · heavy shadows · neon · gaming aesthetics · outdoor cliché · mountain or desert imagery · military styling · spreadsheet aesthetics.

That this is for Marathon des Sables is communicated through content, not themed desert visuals.

### Tokens

```js
// tailwind.config.js — theme.extend.colors
{
  bg:         '#F6F6F3',
  surface:    '#FFFFFF',
  ink:        '#161616',
  muted:      '#6D6D68',
  border:     '#E7E7E2',
  bought:     '#EFF7F0',
  boughtInk:  '#3F7D52',
  accent:     '#C8E85A',  // lime
  accentDeep: '#8DA82C',  // lime, darkened for use on white
}
```

Lime usage rules, narrow on purpose:

- Lime is a **fill behind dark ink**, never a text colour on white. Use `accentDeep` if it must appear as text or an icon.
- Permitted: budget progress bar fill, active filter pill, selected row in the popup's item selector.
- Not permitted: the purchased state (that stays the muted green), focus rings (use `ink`), any border, any hover state.

### Typography

Inter, bundled via `@fontsource/inter` at weights 400/500/600. No CDN link — MV3's CSP will block it and the UI will silently fall back to system sans. Sans-serif only, no serif anywhere.

```
Page title      28–32px / 600
Budget figure   32–40px / 600
Metric labels   12–13px / 500
Table           14px / 400
Supporting      13px / 400
```

Labels in sentence case, not uppercase. `Total kit weight`, not `TOTAL KIT WEIGHT`.

### Shape and motion

Cards `border-radius: 16px`. Inputs and buttons 10–12px. Shadows extremely subtle or omitted.

Animation minimal and functional: 120–180ms hover transitions, a subtle purchased-row transition, a loading spinner during refresh. No animation library.

---

## 21. Responsive behaviour

Desktop primary. On narrow screens rows become stacked cards, ordered: item name → purchased state → price → weight → product → URL/actions.

The popup is inherently mobile-like and stays extremely simple.

---

## 22. Accessibility

Semantic HTML, strong contrast, keyboard navigation, visible focus states, accessible labels, real buttons rather than clickable divs, keyboard-operable checkboxes. Never rely on colour alone.

---

## 23. Suggested components

AppShell · Header · BudgetSummary · BudgetProgress · WeightSummary · KitToolbar · KitTable · KitGroupHeader · KitRow · PurchasedToggle · QtyControl · ProductCell · EditablePrice · EditableWeight · StatusBadge · AddItemRow · ExtensionPopup · KitItemSelector · RefreshButton · ExportButton

---

## 24. Development philosophy

Keep the codebase small and intentional. Prioritise maintainability, strong types, reusable components, excellent UI states, clear extraction fallbacks, fast local interaction.

Avoid premature abstraction, backend services, complicated architecture.

Include unit tests for `parseWeight` and `parsePrice` with a small fixtures folder of saved product HTML. These two functions are where the bugs will live.

---

## 25. Out of scope for V1

No auth, no accounts, no server, no database, no cloud sync, no price history, no retailer APIs, no affiliate links, no image extraction, no animation library.

---

## 26. Quality bar

The finished product should not look like a developer tool or a spreadsheet. It should look like a small, highly polished consumer product a fintech company might release as a free utility.

Within a few seconds the interface should communicate: what still needs buying · what has been bought · how much has been spent · how much budget remains · what the kit weighs, base and consumables · which products are missing information.

**Make 50 pieces of kit feel simple.**

---

## Milestones

Work these in order. Tick one off only after the user confirms it's right.

- [x] **1. Scaffold.** Vite + @crxjs/vite-plugin, React 18, TypeScript strict, Tailwind, MV3 manifest per section 3. `@fontsource/inter` installed. `lib/seed.ts` with all 50 kit items. `lib/storage.ts` with the StoredState model and debounced writes. `.gitignore` covering `dist` and `node_modules`. No UI. `npm run build` produces a loadable `dist/`.

- [ ] **2. Dashboard.** Header, budget summary, weight summary with base/consumable split, progress bar, grouped kit table, inline editing of price, weight and qty, purchased toggle, add and delete item, filters and sorting. Tokens from section 20 used exactly. Everything reads and writes through storage. No extraction yet.

- [ ] **3. Extraction and popup.** `lib/extract.ts` implementing Path A with the full fallback chain, plus unit tests and saved HTML fixtures for `parsePrice` and `parseWeight`. Then the popup: detect the current product via `chrome.scripting.executeScript`, searchable item selector, add to kit, confirmation state.

- [ ] **4. Refresh and export.** Background service worker with Path B JSON-LD refresh. Refresh All with concurrency 4 and per-item outcomes. Per-row refresh. URL paste (Path C). CSV export with RFC 4180 quoting.

- [ ] **5. Acceptance pass.** Work through the criteria below one by one. Fix anything that fails.

### Acceptance criteria

1. Adding a product from the popup updates an already-open dashboard tab with no reload.
2. Refresh All on 30 URLs completes without hanging, reports per-item outcomes, and does not overwrite a single manually-edited price or weight.
3. A row with `qty: 3` contributes 3× its unit weight and 3× its unit price to every total.
4. Marking an item purchased changes Spent, Remaining and the progress bar, and nothing else.
5. Total weight shows base and consumable figures separately, and both change when a consumable's qty changes.
6. A €189 product does not appear anywhere as £189.
7. Every interactive control is reachable and operable by keyboard, with a visible focus ring.
8. Closing and reopening Chrome preserves all data.
9. CSV opens in Excel with no column drift on products whose titles contain commas.
10. First launch shows the full grouped kit list with no onboarding.
