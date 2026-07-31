# Marks Distribution — Implementation Notes

Implements FE-MD-100 Rev A ("Exam Builder — Marks Distribution") against the
Exam Creation Wizard (`src/components/teacherscomponent/pages/ExamWizard.vue`),
which is the frontend's "exam builder" (draft state, question editor, submit
flow) referenced by the manual.

## What changed

- **`src/lib/marksDistributor.js`** — the canonical `distribute(totalMarks, count)`
  port from manual section 03-03-00, copied exactly as specified. Nothing else
  should import a different implementation of this algorithm.
- **`src/components/teacherscomponent/composables/useExamMarksDistribution.js`** —
  the draft-state engine from sections 02, 03-04-00, 04, 05, and 06:
  the `{ question_id, default_marks, marks, is_marks_locked, order }` draft
  structure, the five recompute trigger events, locked-input validation
  (with a max-value guard), and the fault-isolation flags (`lockedExceedsTotal`,
  `allLocked`, `zeroPoolNoMarksLeft`). All mutation here is local — no network
  calls happen until submit.
- **`ExamWizard.vue`** — Step 2 (Select Questions) now uses the engine for the
  live marks preview, lock/unlock controls, and the three fault banners from
  section 06-00-00. A "Total Marks" field was added to Step 2 itself, since
  distribution needs a total before questions are picked (it was previously
  only present on Step 3). Save/submit is blocked while any fault condition
  is active, per 07-01-00 / 07-02-00.
- **`src/components/teacherscomponent/services/api/exams.js`** and
  **`stores/exams.js`** — added `bulkSetExamQuestions()` / `bulkSetQuestions()`,
  sending the full draft in one `PUT /api/exams/{id}` request (body:
  `{ questions: [...] }`), replacing the previous per-question sequential
  `addQuestion` calls.

## Removed (superseded / dead code)

- `src/components/teacherscomponent/lib/marksDistribution.js` — an earlier,
  differently-shaped distribution helper that was never imported anywhere and
  did not match the manual's reference algorithm or file location.
- `src/components/teacherscomponent/pages/ExamCreatePage.vue` and
  `ExamQuestionsPage.vue` — not registered in the router and not referenced
  by any other file; a simpler, out-of-date duplicate of the exam
  creation/question-editing flow now properly implemented in `ExamWizard.vue`.

## Not changed

`ExamQuestionsPanel.vue` (the quick add/remove modal used from `ExamList.vue`
to edit questions on an *already-created* exam) was left as-is. It persists
each action immediately via the existing per-question endpoints rather than
holding a local draft, which is a different, already-working workflow from
the "draft state, submit at the end" builder this manual describes. Porting
it to the same draft/bulk model would be a separate, larger change to that
component's save model and is out of scope for this pass.

## Backend contract needed

The frontend sends the draft question list as part of a `PUT` request to the
existing exam resource:

```
PUT /api/exams/{examId}
Body: { "questions": [ { "question_id", "marks", "is_marks_locked", "order" }, ... ] }
```

This should replace the exam's question list in one transaction (delete/
upsert as needed) and return the resulting exam (or question list). Note this
uses `PUT` on `/api/exams/{id}`, distinct from the existing `PATCH
/api/exams/{id}` used by `updateExam()` for basic-info edits — both hit the
same resource with different HTTP methods and payload shapes, so the backend
route needs to branch on method/body rather than merging them into one
handler. Until the `PUT` handler accepts a `questions` array, `Save Draft` /
`Create Exam` in the wizard will fail at the question-save step with a
"Unable to save exam questions." toast (the exam record itself still saves
via the separate `PATCH`/`POST` calls).

## Answers to manual section 08-00-00

1. **0.01 tolerance — shared or independent?** Implemented as an independent
   frontend constant (`TOLERANCE = 0.01` in the composable). It is not fetched
   from the server; if the backend's tolerance ever changes, this constant
   needs updating to match.
2. **Uneven remainder — specific visual style?** Plain number display, per the
   "first version" allowance in the manual. `distribute()` already returns the
   exact split (e.g. 33.34/33.33/33.33); the UI shows those values as-is with
   no extra rounding or styling.
3. **Error shape — must it match what the banner needs, or does the banner
   check independently?** The banner checks independently: `ExamWizard.vue`
   reads `marksEngine.lockedExceedsTotal` / `allLocked` / `zeroPoolNoMarksLeft`
   directly from the composable's reactive state rather than parsing an error
   string, so the banner doesn't depend on the exact shape of `error`.
4. **Does `order` affect which question gets the extra hundredth?** No —
   `order` controls display order only. The extra hundredth in step 6 of
   03-02-00 goes to the first entries of the *pool array* (unlocked questions
   in their current order), which is what `recomputeDraft()` implements.
5. **Removing a locked question — recompute other locked questions, or only
   the pool?** Only the pool, as stated in the manual. Removing a locked
   question changes the locked sum and therefore the remaining value, which
   triggers a normal recompute of the unlocked pool; other locked questions'
   values are never touched by recompute.
