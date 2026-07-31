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
  calls happen until save.
- **`ExamWizard.vue`** — Step 2 (Select Questions) now uses the engine for the
  live marks preview, lock/unlock controls, and the three fault banners from
  section 06-00-00. A "Total Marks" field was added to Step 2 itself, since
  distribution needs a total before questions are picked (it was previously
  only present on Step 3). Save is blocked while any fault condition is
  active, per 07-01-00. The final step's action was relabeled "Create Exam"
  (it was "Save Draft", which was confusing given it's also the create-and-
  finish action), and it always navigates to `/teachers/exams` on success.
- **`src/components/teacherscomponent/services/api/exams.js`** and
  **`stores/exams.js`** — questions are now saved by *diffing* the wizard's
  draft against what's already linked to the exam, using the confirmed-
  working per-question endpoints (`POST` to add, `PATCH` to update
  marks/order, `DELETE` to remove — see Backend contract below). This
  replaced an earlier attempt at a single bulk `PUT /api/exams/{id}` call,
  which turned out not to be supported by the backend (see note below).

## Removed (superseded / dead code)

- `src/components/teacherscomponent/lib/marksDistribution.js` — an earlier,
  differently-shaped distribution helper that was never imported anywhere and
  did not match the manual's reference algorithm or file location.
- `src/components/teacherscomponent/pages/ExamCreatePage.vue` and
  `ExamQuestionsPage.vue` — not registered in the router and not referenced
  by any other file; a simpler, out-of-date duplicate of the exam
  creation/question-editing flow now properly implemented in `ExamWizard.vue`.
- `src/components/teacherscomponent/components/ExamQuestionsPanel.vue` and the
  "Questions" button that opened it from `ExamList.vue` — question management
  now lives solely in the wizard, per request.

## Backend contract (confirmed)

There is **no bulk/replace endpoint**. `PUT /api/exams/{id}` only updates the
exam's own scalar fields — a `questions` array in that body is silently
ignored (confirmed by inspecting the live API responses: the exam saved
correctly, but `question_count` stayed `0`). Questions are saved individually:

```
POST   /api/exams/{examId}/questions            body: { question_id, marks, order }
PATCH  /api/exams/{examId}/questions/{linkId}    body: { marks?, order? }
DELETE /api/exams/{examId}/questions/{linkId}
```

The wizard now keeps a local `question_id -> exam_question id` map for the
current session and, on every save, diffs the current draft against it:
new questions are `POST`ed, questions still present get their marks/order
`PATCH`ed, and questions removed from the draft are `DELETE`d. Basic exam
fields (title, subject, dates, total marks, etc.) are saved separately via
`POST /api/exams` (create) / `PATCH /api/exams/{id}` (update) — both already
confirmed working from the API previews.

## Not changed

`GET /api/exams` returns each exam's count as `question_count` (not
`questions_count`); `ExamList.vue`'s `getQuestionCount()` already checks that
field first, so no change was needed there — the list will show the correct
count as soon as the wizard actually persists the questions.

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
