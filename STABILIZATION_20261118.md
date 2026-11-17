# Live renderer cache stabilization

The database remains the durable source of history. No SQL records, retention
settings, outcome deduplication keys or cumulative counters are reset.

Unsolicited telemetry and alert updates retain a recent 1,000-record cache.
Explicit history paging can expand the window. A timestamp bucket is never
partially evicted because existing database pagination uses timestamp bounds;
a single oversized bucket is temporarily retained intact. Historical windows
are not spliced together with unrelated newest events while browsing backward.
The infinite-scroll viewport retains 200 unsolicited live rows and merges all new
cached items, including equal-timestamp arrivals, rather than just the newest
item. Metrics retain 128 recent samples while daily maxima and verified outcome
aggregates remain intact. Charts refresh dirty data every three seconds, including
when a bounded array stays the same length or a continuous stream never pauses.

No JSX layout, CSS classes, labels, translations, IPC contracts or database schema
were changed. The tests feed 120,000 normal process exits and verify bounded live
storage, accurate total counts, zero false forced-termination counts, historical
page retrieval, whole timestamp boundaries and outcome deduplication after sample
eviction. The complete UI suite has 37 passing tests; lint, TypeScript and the
production build pass. Electron's existing local distribution was used for an
offline build after the default download attempt was blocked by the host sandbox.

VM measurements and deployment hashes are stored with the local stabilization
checkpoint; they are not a cross-machine performance guarantee. Large explicit
history browsing and a single oversized timestamp bucket can exceed the soft
live-cache limit. The SQLite history still follows its existing retention policy.

The initial cache-only VM build still used excessive resources because chart
refreshes decoded the complete retained telemetry range. The second patch counts
normal process/file telemetry in SQLite and returns only chart buckets or daily
summaries. Verified response outcomes still use the existing evidence decoder
and deduplication. SQL aggregation is tested against 120,000 records and actual
VM history without deleting any rows.

VM regression caught and fixed before release: SQLite GROUP BY spilled sort
records to etilqs_* files. The driver correctly observed those writes, feeding
more history into the next aggregation and eventually overflowing the bounded
kernel queue. The SQL build was immediately rolled back. Cumulative loss was
retained, including all loss during mitigation; no counter reset or event-path
exclusion was used. The final query helper requires connection-local
`temp_store=MEMORY`, checks the effective setting, and rejects builds compiled
with TEMP_STORE=0. Repeated calls do not reset existing temporary tables.
SQLite's documented semantics: https://www.sqlite.org/pragma.html#pragma_temp_store
Final VM validation must confirm the counter delta and the absence of new
UI-owned etilqs writes. The earlier cache-only and disk-temp builds are not the
final performance results.

Final verified VM interval: 600.828 seconds, 103,450 raw events, additional dropped/flushed/etilqs events 0/0/0. UI save latencies 0.700/0.982/1.005 seconds. Historical cumulative loss 102,267 is preserved, including the intermediate regression and rollback (50,388). No counters or history were reset. Source tests: 37 passed; lint, type check and production build passed. The VM package hash is recorded in the local deployment checkpoint. These are bounded validation results, not a loss-free or low-resource guarantee for every workload.
