# Performance

Targets from the brief: **< 3 s to interactive with cached data**, **60 fps list scroll**, **< 150 MB memory**.

> **Status:** bundle size, Release-build memory, and cold-start time below were measured on this machine (native Release build, iPhone 18 Pro simulator on Apple Silicon). Simulator numbers are a proxy; a physical device will differ. Profiler, FPS and scroll-memory screenshots still need interaction and are marked **TODO**, with steps at the bottom.

## Bundle analysis

Measured with `npx expo export --platform ios --dump-sourcemap` (Expo SDK 58, React Native 0.88, Hermes):

| Platform | Main bundle (Hermes bytecode) |
| --- | ---: |
| iOS | **2.37 MB** |
| Android | **2.37 MB** |

Breakdown by package, as a share of original source bytes in the bundle (`npm run bundle:analyze`):

| Package | Source size | Share |
| --- | ---: | ---: |
| react-native | 2191.2 KB | 43.8% |
| expo-router (includes bundled React Navigation) | 1292.0 KB | 25.8% |
| @tanstack/query-core | 174.8 KB | 3.5% |
| react-native-screens | 163.5 KB | 3.3% |
| @react-native/virtualized-lists | 154.4 KB | 3.1% |
| expo | 153.9 KB | 3.1% |
| **app code (src/)** | **135.3 KB** | **2.7%** |
| expo-sqlite | 72.7 KB | 1.5% |
| expo-file-system | 70.6 KB | 1.4% |
| @tanstack/react-query | 53.3 KB | 1.1% |
| expo-image | 35.0 KB | 0.7% |
| zustand | 4.2 KB | 0.1% |

Takeaways:

- Around 70% of the bundle is React Native plus the router, which is fixed cost for any Expo Router app.
- The app's own code is 2.7%. Zustand contributes just 4.2 KB.
- No icon fonts or lodash-style utility libraries are bundled.

To reproduce:

```bash
npx expo export --platform ios --dump-sourcemap --output-dir dist
npm run bundle:analyze
```

CI runs the Android export on every push and writes the table into the job summary.

## Memory

| Scenario | Build | Physical footprint |
| --- | --- | ---: |
| Cold launch, cached list rendered | **Release** (`npm run ios:release`), simulator | **85 MB** (peak 86 MB) |
| First launch: full 6-page sync + thumbnails downloading | **Release**, simulator | **93 MB** |
| Android, cold launch with cached list | **Release** APK, emulator (API 37) | **107 MB** total PSS |
| Android, after scrolling 6 screens of the list | **Release** APK, emulator | **112 MB** total PSS |
| List synced, 3 detail screens + gallery + filters visited | Expo Go, dev mode, simulator | 269 MB (peak 271 MB) |
| Android, after scrolling the full list down and up | **Release** APK, emulator | **133 MB** total PSS |
| During scroll (Instruments screenshot) | Release | **TODO: capture** |

Measured with `footprint <pid>` / `vmmap --summary` (physical footprint, the number iOS uses for memory limits) on the simulator process. The Release build sits at **85–93 MB, within the < 150 MB target**. The dev-mode number is not representative: Expo Go loads every bundled SDK module, its own home app and dev menu, and React's development build. Detail and gallery screens weren't included in the Release measurement, because deep links into the native build trigger an iOS confirmation prompt that can't be tapped headlessly.

What keeps memory bounded by design:

- The list decodes **thumb** variants only (~20 KB each). Medium and large never load during scrolling.
- `windowSize=9` limits mounted rows to about 9 screens' worth.
- Gallery pager: `windowSize=3`, so at most 3 medium images are mounted.
- The fullscreen viewer mounts a single large image, and only while open.
- On a memory warning, `Image.clearMemoryCache()` drops decoded bitmaps.
- The catalog in memory is ~283 normalized objects plus their projections (a low single-digit number of MB).

![Memory during scroll](images/memory-scroll.png) — **TODO: capture**

## Rendering

| Interaction | Expected | Measured |
| --- | --- | --- |
| Cold start → interactive (cached) | < 3 s. SQLite read of 283 rows + JSON parse, no network on the critical path | **Android 1.0–1.5 s** (Release APK: list blank at 1.0 s, visible at 1.5 s in every run; `am start -W` first frame 369–511 ms). **iOS 2.0–2.5 s** on a Release build (simulator). The list was visible in every run screenshotted at 2.5 s and blank at 2.0 s. The blank phase is native + React Native startup; no frame ever caught the SQLite hydration spinner. |
| Full 283-row list render (Profiler) | First window of 14 rows. Remaining rows render in batches of 16 | **TODO: screenshot** |
| Sustained scroll | 60 fps UI and JS | **Not provable on this machine.** Android Release APK, full list scrolled down and up (28 flings, 358 frames, `dumpsys gfxinfo`): median 34 ms, p90 48 ms, 45.5% janky. Android's own **Settings app scrolled the same way on the same emulator: median 34 ms, p90 61 ms, 49.8% janky**. The emulator caps rendering at ~30 fps, and the app matches or beats the system baseline. 60 fps must be confirmed on a physical device. **TODO** |
| Typing in search | No dropped frames. Filtering runs once per 250 ms debounce | Filter + group over 283 real breeds: **0.14 ms** per pass (Node/V8 micro-benchmark, 1,000 iterations). On-device Hermes: **TODO** |
| Rebuilding all 283 list projections | Happens on writes only | **0.29 ms** (Node/V8) |
| Applying filters | Single re-filter + re-group | **TODO** |

![React Profiler — full list render](images/profiler-list.png) — **TODO: capture**

![Perf monitor during scroll](images/fps-scroll.png) — **TODO: capture**

### Why this list stays at 60 fps

See "Performance trade-off: payload richness, not row count" in [DECISIONS.md](DECISIONS.md). In short:

- Rows receive primitive projections rather than full nested breeds.
- Projections keep stable identities, so memoized rows skip re-rendering.
- `getItemLayout` is exact (fixed heights, precomputed offsets), so nothing is measured during scroll.
- Rows use thumbnail-only images, served from a synchronous in-memory index, so there's no placeholder flash.

Bugs found by running on real builds (all fixed):

- **Android crash with sticky headers.** FlatList turns on `removeClippedSubviews` by default on Android only. Combined with `stickyHeaderIndices` under Fabric, it crashed with `addViewAt: failed to insert view`. It's now explicitly `false`. Fixed-height windowing already bounds the number of mounted rows.
- **Gallery photos stuck behind background prefetch.** The download queue was first-in, first-out, so a gallery photo waited behind ~280 Wi-Fi thumbnail prefetches. The queue now has two priorities (on-screen first, with promotion for queued items) and a 20 s per-download timeout. See `src/images/downloadQueue.ts` and its tests.

Another observation from development: in Expo Go dev mode, the first progressive sync (6 pages streaming in while 283 thumbnails download) triggered React Native's "VirtualizedList: large list that is slow to update" dev warning. The cause was that every page rebuilt every list item, which defeated `React.memo`. Projections are now cached per breed object (`WeakMap`) so unchanged rows keep their identity.

## How to capture the remaining evidence

Release build on a simulator or device. This requires CocoaPods for iOS:

```bash
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

1. **FPS:** open the dev menu in a dev build (or use Xcode → Debug → View Debugging → Rendering on iOS / "Profile GPU rendering" on Android), enable the Perf Monitor, scroll the full list top to bottom, and screenshot `docs/images/fps-scroll.png`.
2. **Profiler:** in a dev build, open React DevTools (`j` in the Expo CLI) → Profiler, record a cold launch until the list is populated, and screenshot the flamegraph as `docs/images/profiler-list.png`.
3. **Memory:** Xcode → Open Developer Tool → Instruments → Allocations, attach to the Release app, scroll the full list twice, open a gallery, and screenshot as `docs/images/memory-scroll.png`. On Android, use the Android Studio Memory Profiler.
4. **Startup:** with cached data, cold launch and time to the first rendered row (Instruments "App Launch" template, or `adb shell am start -W`).
