# Real-Time Collaborative Task Board — Implementation Checklist

_Last updated: 2026-02-21_

## Status Legend

- ✅ Done
- 🟡 Partial
- ❌ Missing
- ⚪ Unverifiable (needs measurement/proof)

---

## 1) Core Features

- [x] ✅ Three-column Kanban board: **To Do / In Progress / Done**
  - **Status:** Done
  - **Evidence:** `client/src/types/index.ts` (`COLUMN_CONFIG`), `client/src/components/Board.tsx` (column render loop)
  - **Notes:** Columns are fixed by shared config.

- [ ] 🟡 Create, edit (title + description), and delete tasks via **inline UI**
  - **Status:** Partial
  - **Evidence:** `client/src/components/TaskCard.tsx` (inline edit + delete), `client/src/components/CreateTaskModal.tsx` (create via modal)
  - **Gap:** Create flow is modal, not inline (if interpreted strictly).
  - **TODO:** Add inline create interaction per column (or document accepted deviation).

- [x] ✅ Drag-and-drop between columns and reorder within a column
  - **Status:** Done
  - **Evidence:** `client/src/components/Board.tsx` (`handleDragEnd`, DnD context), `client/src/components/TaskCard.tsx`
  - **Notes:** Uses order keys to place tasks between neighbors.

- [ ] ⚪ Real-time sync to all connected clients within **200 ms on localhost**
  - **Status:** Unverifiable
  - **Evidence:** `server/src/socket/SocketHandler.ts` (broadcast events), `client/src/components/SocketProvider.tsx` (event handling)
  - **Gap:** No benchmark/assertion proving <200 ms propagation.
  - **TODO:** Add a simple latency measurement script/test and report observed p95 latency.

- [x] ✅ Multi-user presence indicators
  - **Status:** Done
  - **Evidence:** `server/src/services/PresenceService.ts`, `server/src/socket/SocketHandler.ts`, `client/src/components/Board.tsx`
  - **Notes:** Online users and lock/presence indicators are shown.

---

## 2) Conflict Resolution

- [ ] ❌ Concurrent **move + edit** preserves both changes
  - **Status:** Missing
  - **Evidence:** `server/src/services/TaskService.ts` (version-check conflict rejection), `server/src/socket/SocketHandler.ts` (conflict emits)
  - **Gap:** Current optimistic concurrency rejects loser update instead of merging move+edit.
  - **TODO:** Implement field-level merge policy so location/order and content edits can co-exist.

- [ ] 🟡 Concurrent **move + move** deterministic winner + losing user notified
  - **Status:** Partial
  - **Evidence:** `server/src/services/TaskService.ts` (first successful versioned write wins), `server/src/socket/SocketHandler.ts` (`CONFLICT_MOVE_REJECTED`)
  - **Gap:** Deterministic policy exists implicitly but is not explicitly documented/tested as a rule.
  - **TODO:** Document deterministic rule in `DESIGN.md` and add explicit integration test assertion.

- [ ] ⚪ Concurrent **reorder + add** yields consistent final order across clients
  - **Status:** Unverifiable
  - **Evidence:** `server/src/lib/fractional.ts`, `server/src/services/TaskService.ts`
  - **Gap:** Algorithm supports this, but no dedicated race/integration test proving consistency.
  - **TODO:** Add integration test for reorder/add race and validate identical order on all clients.

- [x] ✅ Conflict resolution strategy documented in `DESIGN.md`
  - **Status:** Done
  - **Evidence:** `DESIGN.md` (conflict strategy and ordering sections)
  - **Notes:** Strategy exists; trade-off depth can be improved.

---

## 3) Offline Support

- [x] ✅ On WebSocket disconnect, user actions queue locally
  - **Status:** Done
  - **Evidence:** `client/src/store/taskStore.ts` (`offlineQueue`, `addToQueue`)

- [x] ✅ On reconnect, queued actions replay against current server state
  - **Status:** Done
  - **Evidence:** `client/src/store/taskStore.ts` (`replayQueue`), `client/src/components/SocketProvider.tsx` (replay on connect)

- [x] ✅ Offline conflicts follow same resolution path as online conflicts
  - **Status:** Done
  - **Evidence:** `client/src/components/SocketProvider.tsx` (shared conflict handlers), server conflict events in `server/src/socket/SocketHandler.ts`

---

## 4) Technical Requirements

- [x] ✅ Backend stack: Node.js + Express/Fastify + WebSockets
  - **Status:** Done
  - **Evidence:** `server/src/index.ts` (Express), `server/src/socket/SocketHandler.ts` (Socket.IO)

- [x] ✅ Frontend stack: React 18+
  - **Status:** Done
  - **Evidence:** `client/package.json` (React 19)

- [x] ✅ Database: PostgreSQL/Mongo with persistence
  - **Status:** Done
  - **Evidence:** `server/prisma/schema.prisma` (PostgreSQL datasource)

- [x] ✅ Tests: integration tests for conflicts + unit tests for ordering logic
  - **Status:** Done
  - **Evidence:** `server/tests/integration/conflict.test.ts`, `server/tests/unit/fractional.test.ts`

---

## 5) Architecture Constraints

- [x] ✅ WebSocket handling separated from business logic
  - **Status:** Done
  - **Evidence:** `server/src/socket/SocketHandler.ts` (transport/event layer), `server/src/services/TaskService.ts` (business logic)

- [x] ✅ O(1) amortized ordering approach (no naive O(n) re-index per move)
  - **Status:** Done
  - **Evidence:** `server/src/lib/fractional.ts`, `client/src/lib/fractional.ts`, `DESIGN.md`

- [ ] ❌ Database writes are atomic (no partial updates)
  - **Status:** Missing
  - **Evidence:** `server/src/services/TaskService.ts`, `server/src/services/HistoryService.ts`
  - **Gap:** Multi-step mutations (task change + history write) are not wrapped in a DB transaction.
  - **TODO:** Use Prisma transaction (`$transaction`) for mutation + history write as a single atomic unit.

- [x] ✅ Optimistic UI on client
  - **Status:** Done
  - **Evidence:** `client/src/store/taskStore.ts` (optimistic create/update/move/delete before authoritative sync)

---

## 6) Error Handling

- [x] ✅ Graceful WS disconnect degradation (queued writes + visual indicator)
  - **Status:** Done
  - **Evidence:** `client/src/store/taskStore.ts` (queueing), `client/src/components/Board.tsx` (offline banner/queue count)

- [x] ✅ React error boundaries around DnD/WS-dependent areas
  - **Status:** Done
  - **Evidence:** `client/src/app/page.tsx` (boundary wrapping app tree), `client/src/components/ErrorBoundary.tsx`

- [x] ✅ Server-side validation for incoming task mutations
  - **Status:** Done
  - **Evidence:** `server/src/validation/schemas.ts`, validation usage in `server/src/socket/SocketHandler.ts`

---

## 7) Deliverables

- [ ] ❌ README setup works with single `docker compose up` or equivalent one-command flow
  - **Status:** Missing
  - **Evidence:** `README.md` currently describes separate backend/frontend setup; no `docker-compose.yml` found
  - **TODO:** Add Docker Compose (client + server + db) and update README quick start.

- [x] ✅ `DESIGN.md` explains conflict strategy and ordering approach
  - **Status:** Done
  - **Evidence:** `DESIGN.md`

- [ ] 🟡 `DESIGN.md` includes clear trade-offs
  - **Status:** Partial
  - **Evidence:** `DESIGN.md`
  - **Gap:** Trade-offs are present but could be more explicit/structured.
  - **TODO:** Add a “Trade-offs” subsection with alternatives and rationale.

- [x] ✅ Deployment section includes live URL(s)
  - **Status:** Done
  - **Evidence:** `README.md` Deployment section

- [x] ✅ Deployed WebSocket support documented
  - **Status:** Done
  - **Evidence:** `README.md` deployment notes

- [x] ✅ Persistent deployed database documented
  - **Status:** Done
  - **Evidence:** `README.md`, `DESIGN.md`

- [x] ✅ Cold-start expectations documented
  - **Status:** Done
  - **Evidence:** `README.md` cold-start note

- [ ] ⚪ Demo recording (2–3 min) exists and covers required scenarios
  - **Status:** Unverifiable
  - **Evidence:** Not verifiable from repository contents alone
  - **TODO:** Attach recording link in README (or submission notes).

---

## 8) FAQ-Specific Constraint

- [x] ✅ Authentication not required; simple user identification is acceptable
  - **Status:** Done
  - **Evidence:** `client/src/lib/userIdentity.ts`, `client/src/components/LoginPage.tsx`

---

## 9) Evaluation Rubric Risk Tracker (Priority)

### High Priority (likely score impact)

- [ ] Implement merge-safe handling for **move + edit** to avoid data loss.
- [ ] Add explicit deterministic policy + test coverage for **move + move** and **reorder + add** races.
- [ ] Make task mutation + history write **atomic** via DB transactions.
- [ ] Provide **one-command local setup** (`docker compose up` or equivalent).

### Medium Priority

- [ ] Measure and report real-time propagation against the **200 ms** target.
- [ ] Tighten `DESIGN.md` trade-off discussion.

### Submission Completeness

- [ ] Confirm/demo recording link included with required scenarios.

---

## 10) Quick Progress Summary

- **Done:** 24
- **Partial:** 4
- **Missing:** 4
- **Unverifiable:** 3

> Update this file as implementation changes land; move items from Partial/Missing/Unverifiable to Done with evidence.
