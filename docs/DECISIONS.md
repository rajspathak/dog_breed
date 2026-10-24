# Technical decisions

## Assumptions and API findings

Before writing code I profiled the live API (all 283 records). Several findings differ from the brief and shaped the implementation:

| Brief says | API actually does | Decision |
| --- | --- | --- |
| 48 per page, 6 pages | Default page size is **30 → 10 pages** | Request `page[size]=48` explicitly and read the page count from `meta.pagination.last`, never hardcoding 6. Configurable via `EXPO_PUBLIC_PAGE_SIZE`. |
| Up to 9 images | Up to **10** (78 breeds have 10) | The gallery and cache handle any count. |
| Coat length short/medium/long/wire | `coat.length` ∈ short/medium/long/**hairless**. "wire" is a `coat.type` (35 breeds) | The filter offers Short / Medium / Long / Wire / Hairless. Wire matches the coat *texture* regardless of length, so a short wire coat matches both "Short" and "Wire". |
| Clean records | Bavarian Mountain Scent Hound has `{}` for coat, traits, origin, and heights. 10 height ranges are `{}`. 244 of 2,354 image attributions have a `null` author or license URL. | Everything is read through type guards. Empty objects become `null`, not `0`. Missing traits show an empty state, not zeros. Attribution renders "unknown author" / "License not specified". |
| — | `exercise_minutes` is minutes (20–120), not a 1–5 score | Rendered as a separate minutes meter, not on the 1–5 scale. |
| — | Weight in kg, height in cm (inferred from values: Affenpinscher 4–6 / 23–29) | Units shown as kg / cm. |

## State management: Zustand

**Chosen:** Zustand, with two stores: `catalogStore` (normalized server cache) and `filterStore` (UI state).

- **Normalized cache:** `breedsById` and `groupsById` plus id arrays, as the brief requires. Upserting one breed after a detail refresh touches one key.
- **Selector-level subscriptions:** a row only re-renders when its own data changes. Context + reducer would re-render every consumer on any change, which matters during a 6-page streaming sync.
- **Usable outside React:** the sync engine writes to the store with `getState()` and doesn't need hooks or providers. This is what makes the engine unit-testable with plain injected functions.
- **Why not Redux Toolkit:** RTK's entity adapter would also work, but the extra ceremony (slices, actions, middleware for side effects) buys nothing here, since side effects already live in the sync engine and React Query.
- **Why not Jotai:** atoms suit fine-grained independent state. This app's state is a single normalized catalog plus one filter object.

**List projection.** The store keeps a precomputed `listItems: BreedListItem[]`: a flat, primitive-only view of each breed (name, thumb URL, size band, coat categories, three trait scores, a search string). It is rebuilt only on writes, never on render. A `WeakMap<Breed, BreedListItem>` keeps item identity stable for unchanged breeds, so `React.memo` rows skip re-rendering when another page or a detail refresh lands.

## Persistence: expo-sqlite

**Chosen:** SQLite (expo-sqlite), with one row per breed and a JSON payload.

- 283 rich records (~1.8 MB of raw JSON) in one AsyncStorage key would be a single large serialize/parse on every write. SQLite gives per-row upserts, transactions (a partial sync can never leave a half-written row), and pruning by id.
- The image cache needs an index with LRU queries (`bucket, last_access`), which is natural in SQL.
- **Why not WatermelonDB:** its lazy, observable model is built for tens of thousands of rows and two-way sync. This is a read-only catalog of 283 rows. The extra schema and model layer, plus its native setup, aren't justified.
- **Why a JSON payload instead of fully normalized tables:** the detail screen always needs the whole breed, and nested data (traits, images with attribution) would mean 4–5 joined tables to reassemble one object. Filter-relevant fields live in memory anyway. `name` and `group_id` are promoted to columns as a growth path.

## API layer: React Query + custom fetch layer

React Query owns **when** to sync, and the sync engine owns **how**.

- React Query provides staleness (`staleTime` = 6 h), dedupe, reconnect- and focus-triggered refetch (wired to NetInfo and AppState), paused queries while offline, and whole-operation retries.
- The `queryFn` result is a small `SyncReport`, not the dataset. The data lives in SQLite and Zustand, so it's never duplicated in React Query's cache and there's one source of truth.
- **Retry with exponential backoff happens per page** in `http.ts` (`withRetry`): 3 retries, delay = `min(8 s, 500 ms × 2^attempt)` with ±50% jitter, honoring `Retry-After`. Only timeouts, network errors, 408/425/429, and 5xx are retried. A 404 fails fast. Per-page retry means one flaky page doesn't force refetching the other five.
- **Pagination assembly:** page 1 is fetched first to learn the page count, then the rest go through a concurrency pool of 3. Results are merged into a `Map` by id, which also dedupes a breed that shifts between pages if the server reorders during a sync. Each page streams to the UI as it arrives.

## Offline sync strategy

- **Read path:** always cache-first. The UI never awaits the network.
- **Write path:** upsert per page. Prune only after a provably complete sync (no failed pages and the merged count ≥ `meta.records`). A partial sync can add or update rows but never delete them, so an outage can't shrink the catalog.
- **Freshness:** `lastSuccessAt` only advances on complete syncs. The banner shows "Last synced 2 hours ago", turns amber with a Refresh action once data is older than `EXPO_PUBLIC_STALE_AFTER_MINUTES`, and turns red with Retry after a partial or failed sync.
- **Offline:** NetInfo drives React Query's `onlineManager`. Queries pause instead of erroring, and the banner says "You're offline · showing saved breeds". When the network returns, React Query refetches if data is stale.

## Image caching

| Variant | Size (measured) | Used for | Cached when |
| --- | --- | --- | --- |
| `thumb` | ~20 KB | List rows (56 pt) | On first display. Primary thumbs for all 283 breeds are **prefetched on Wi-Fi** after a complete sync (~6 MB), so the whole list works offline. |
| `medium` | ~62 KB | Detail hero, gallery slides | On view (lazy). |
| `large` | ~196 KB | Fullscreen viewer only | On open. The viewer shows the cached medium image immediately and swaps in the large one when it arrives (progressive upgrade). |
| `url` (original) | ~3.2 MB | Never | Too heavy for mobile, and the large variant already exceeds screen resolution. |

- Separate LRU budgets (thumb 20 MB, full 80 MB) mean browsing galleries can never evict the thumbnails the list depends on offline.
- `expo-image`'s own disk cache isn't used for these images (`cachePolicy="memory"` on a `file://` source). Its disk-size limit (`Image.configureCache`) is iOS-only, and the brief asks for size limits on both platforms. Images are downloaded once, by the cache, so there's no double download.
- On a memory warning, `Image.clearMemoryCache()` frees decoded bitmaps. The disk cache survives.

## Performance trade-off: payload richness, not row count

The brief calls this out explicitly. 283 rows is a small list, so virtualization isn't really the hard part. The risk is that each record is heavy (nested traits, coat, origin, up to 10 images with 4 URLs and 5 attribution fields each). Handing those objects to rows makes reconciliation, `memo` comparisons, and any per-render derivation expensive.

What I did:

1. **Project once, render primitives.** Rows receive a `BreedListItem` (about 10 primitive or small-array fields) instead of a `Breed`. The subtitle, life-span label, and search text are computed at write time, not on each render or keystroke.
2. **Stable identities** (the WeakMap above) so `React.memo(BreedRow)` actually skips work.
3. **Fixed row and header heights with an exact `getItemLayout`** from a precomputed offset table. FlatList never measures, scroll-to and sticky headers are exact, and blank areas during fast flings are minimized.
4. **A flattened list with sticky headers** (`ListEntry = header | row`) instead of `SectionList`, which doesn't support `getItemLayout` cleanly.
5. **Thumbnail variant only in the list** (20 KB, decoded near display size). Medium and large never load during scrolling.
6. **Filtering in memory** over the projections: filter plus regroup over all 283 real breeds measured 0.14 ms per pass in a Node micro-benchmark, far inside a 16 ms frame even allowing for Hermes being slower than V8. Search is debounced at 250 ms, so typing never re-filters per keystroke.
7. Tuned windowing: `initialNumToRender=14`, `maxToRenderPerBatch=16`, `windowSize=9`.

The cost of this approach: the projection duplicates a few fields in memory (~283 small objects, negligible), and the store must rebuild projections on writes. That's a deliberate choice of write-time cost over render-time cost, since writes happen six times per sync and renders happen continuously while scrolling.

**FlatList vs. FlashList:** with fixed heights and `getItemLayout`, FlatList has no measurement cost, and 283 rows fit comfortably in its windowing model. FlashList's cell recycling pays off on lists with thousands of variable-height rows. Here it would add a dependency and recycling edge cases (stale images in recycled cells) for little gain. It's the first thing I'd reach for if the dataset grew 10×.

## Derived buckets

**Size band:** the mean of the available male and female weight min/max values, in kg.

| Band | Range | Count (live data) |
| --- | --- | --- |
| Small | < 10 kg | 67 |
| Medium | 10–25 kg | 109 |
| Large | 25–40 kg | 72 |
| Giant | ≥ 40 kg | 35 |

If weight is missing, height is used instead (<35 / <55 / <68 / ≥68 cm). If neither is present the band is `unknown`, and that breed matches no size filter rather than being forced into a bucket.

**Trait threshold:** "Good with children / other dogs / strangers", each with Any / 2+ / 3+ / 4+ / 5. Breeds with no trait data are excluded once a threshold is set. Unknown doesn't count as good with children.

**Filter semantics:** OR within a facet (Small *or* Medium), AND across facets (Small *and* Hypoallergenic). This is the usual faceted-search convention.

## Navigation: Expo Router

File-based routes with **typed routes** enabled (`experiments.typedRoutes`), so `router.push({ pathname: '/breed/[id]', params: { id } })` is checked at compile time. Route files are thin: they parse params and render a screen component. Deep links like `dogbreed://breed/<id>?tab=gallery` work for free, and I used them to capture the README screenshots.

Filters open as a modal route rather than an in-screen sheet. The modal gets native presentation and back handling, and the filter state lives in Zustand, so the live "Show 37 breeds" count stays in sync without prop drilling.

## Code quality

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- No `any` anywhere (enforced by `@typescript-eslint/no-explicit-any: error`). All external data enters as `unknown` and passes through guards in `api/guards.ts`.
- Pure logic (normalization, derivation, filtering, eviction planning, banner state, sync orchestration) is separated from native modules, which is what makes the 85 unit tests fast (≈1.5 s).

## What I'd do next

- Move the image download queue to `expo-background-task` so thumbnail prefetch continues when the app is backgrounded.
- Use FTS5 in SQLite for search if the catalog grew beyond a few thousand records.
- Add an EAS development build profile so the Maestro flow runs in CI against a simulator.
