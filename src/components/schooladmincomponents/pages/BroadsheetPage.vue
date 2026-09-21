<template>
  <div class="broadsheet-page">
    <header class="masthead">
      <div>
        <h1>Broadsheet <em>{{ classLabel }}</em></h1>
        <p>Consolidated subject performance and class ranking</p>
      </div>
      <div class="masthead-meta">
        <strong>{{ termLabel }}</strong><br />{{ sessionLabel }}<br />
        {{ students.length }} students · {{ subjects.length }} subjects
      </div>
    </header>

    <form class="filter-bar" @submit.prevent="loadBroadsheet">
      <select v-model="filters.classLevelId" aria-label="Class level" required>
        <option value="">Select class level</option>
        <option v-for="level in classLevels" :key="level.id" :value="level.id">{{ level.name }}</option>
      </select>
      <select v-model="filters.classArmId" aria-label="Class arm">
        <option value="">All arms</option>
        <option v-for="arm in classArms" :key="arm.id" :value="arm.id">{{ arm.name }}</option>
      </select>
      <select v-model="filters.termId" aria-label="Term" required>
        <option value="">Select term</option>
        <option v-for="term in terms" :key="term.id" :value="term.id">{{ term.name }}</option>
      </select>
      <select v-model="filters.academicSessionId" aria-label="Academic session" required>
        <option value="">Select session</option>
        <option v-for="session in sessions" :key="session.id" :value="session.id">{{ session.name }}</option>
      </select>
      <input v-model="search" class="search-input" type="search" placeholder="Find a student…" />
      <span class="filter-spacer" />
      <button class="btn btn-ghost" type="button" @click="printSheet">Print view</button>
      <button class="btn btn-primary" type="button" :disabled="loading || !hasRequiredFilters" @click="downloadPdf">
        {{ downloading ? 'Preparing PDF…' : 'Download PDF' }}
      </button>
    </form>

    <p v-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="state">Loading broadsheet…</p>
    <template v-else>
      <div class="ticker">
        <div v-for="subject in subjects" :key="subject.id" class="ticker-item">
          <div class="ticker-label">{{ subject.name }} · class average</div>
          <strong :class="{ low: subject.class_average < 50 }">{{ format(subject.class_average, 2) }}</strong>
        </div>
      </div>

      <div v-if="filteredStudents.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th rowspan="2">No.</th><th rowspan="2" class="student-heading">Student</th>
              <th v-for="subject in subjects" :key="subject.id" colspan="3">{{ subject.name }}</th>
              <th rowspan="2">Total</th><th rowspan="2">Average</th><th rowspan="2">Position</th>
            </tr>
            <tr class="subhead-row">
              <template v-for="subject in subjects" :key="`${subject.id}-sub`"><th>CA</th><th>Exam</th><th>Total</th></template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in filteredStudents" :key="student.student_id">
              <td class="row-number">{{ index + 1 }}</td><td class="student-name">{{ student.full_name }}</td>
              <template v-for="(score, scoreIndex) in student.subjects" :key="score.subject_id">
                <td>{{ format(score.ca, 1) }}</td><td>{{ format(score.exam, 1) }}</td>
                <td class="score-total" :class="subjectAverageClass(scoreIndex, score.total)">{{ format(score.total, 1) }}</td>
              </template>
              <td class="summary">{{ format(student.total_score, 1) }}</td>
              <td class="summary">{{ format(student.average_score, 2) }}</td>
              <td class="position"><span :class="['position-badge', posClass(student.position)]">{{ ordinal(student.position) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="state">{{ hasRequiredFilters ? 'No students match this broadsheet.' : 'No Exams have been created or taken yet.' }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getBroadsheet, downloadBroadsheetPdf } from '../services/api/broadsheet'
import { getClassArms, getClassLevels } from '../services/api/classes'
import { getSessions, getTerms } from '../services/api/sessions'

const classLevels = ref([])
const classArms = ref([])
const sessions = ref([])
const terms = ref([])
const subjects = ref([])
const students = ref([])
const search = ref('')
const loading = ref(false)
const downloading = ref(false)
const errorMessage = ref('')
const filters = reactive({ classLevelId: '', classArmId: '', termId: '', academicSessionId: '' })

const hasRequiredFilters = computed(() => Boolean(filters.classLevelId && filters.termId && filters.academicSessionId))
const selected = (items, id) => items.value.find(item => String(item.id) === String(id))
const classLabel = computed(() => [selected(classLevels, filters.classLevelId)?.name, selected(classArms, filters.classArmId)?.name].filter(Boolean).join(' ') || 'N/A')
const termLabel = computed(() => selected(terms, filters.termId)?.name || 'N/A')
const sessionLabel = computed(() => selected(sessions, filters.academicSessionId)?.name || 'N/A')
const filteredStudents = computed(() => {
  const query = search.value.trim().toLowerCase()
  return query ? students.value.filter(student => student.full_name.toLowerCase().includes(query)) : students.value
})

async function loadOptions() {
  const [levels, sessionData] = await Promise.all([getClassLevels(), getSessions()])
  classLevels.value = levels || []
  sessions.value = sessionData || []
  const currentSession = sessions.value.find(session => session.is_current || session.current)
  if (currentSession) filters.academicSessionId = currentSession.id
  if (classLevels.value.length) filters.classLevelId = classLevels.value[0].id
  if (filters.academicSessionId) await loadTerms()
}

async function loadTerms() {
  terms.value = filters.academicSessionId ? (await getTerms(filters.academicSessionId)) || [] : []
  const currentTerm = terms.value.find(term => term.is_current || term.current)
  if (currentTerm) filters.termId = currentTerm.id
}

async function loadArms() {
  classArms.value = filters.classLevelId ? (await getClassArms(filters.classLevelId)) || [] : []
  filters.classArmId = ''
}

async function loadBroadsheet() {
  if (!hasRequiredFilters.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getBroadsheet({ class_level_id: filters.classLevelId, class_arm_id: filters.classArmId || undefined, term_id: filters.termId, academic_session_id: filters.academicSessionId })
    const rawSubjects = result?.subjects || []
    const subjectIds = rawSubjects.map((subject) => String(subject.id))
    const rawStudents = (result?.students || []).map((student) => normalizeStudentRow(student, subjectIds))
    const sortedStudents = [...rawStudents].sort((a, b) => normalizeNumber(b.average_score) - normalizeNumber(a.average_score) || normalizeNumber(b.total_score) - normalizeNumber(a.total_score) || (a.full_name || '').localeCompare(b.full_name || ''))

    let previousAverage = null
    let previousPosition = 0
    students.value = sortedStudents.map((student, index) => {
      const averageScore = normalizeNumber(student.average_score)
      const position = index === 0 || averageScore !== previousAverage
        ? index + 1
        : previousPosition

      previousAverage = averageScore
      previousPosition = position

      return {
        ...student,
        position,
        total_score: normalizeNumber(student.total_score),
        average_score: averageScore,
      }
    })

    subjects.value = rawSubjects
  } catch (error) {
    errorMessage.value = error.message || 'Unable to fetch broadsheet.'
    subjects.value = []; students.value = []
  } finally { loading.value = false }
}

async function downloadPdf() {
  if (!hasRequiredFilters.value || downloading.value) return
  downloading.value = true
  try {
    const blob = await downloadBroadsheetPdf({ class_level_id: filters.classLevelId, class_arm_id: filters.classArmId || undefined, term_id: filters.termId, academic_session_id: filters.academicSessionId })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `broadsheet-${classLabel.value.replace(/\s+/g, '-')}.pdf`; link.click(); URL.revokeObjectURL(url)
  } catch (error) { errorMessage.value = error.message || 'Unable to download broadsheet PDF.' } finally { downloading.value = false }
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeStudentRow(student, subjectIds) {
  const subjectMap = new Map((student?.subjects || []).map((score) => [String(score?.subject_id), score]))

  const normalizedSubjects = subjectIds.map((subjectId) => {
    const entry = subjectMap.get(subjectId)
    const ca = normalizeNumber(entry?.ca)
    const exam = normalizeNumber(entry?.exam)
    const computedTotal = ca + exam
    const total = normalizeNumber(entry?.total) || computedTotal

    return {
      subject_id: subjectId,
      ca,
      exam,
      total: computedTotal === 0 ? 0 : total,
    }
  })

  const totalScore = normalizedSubjects.reduce((sum, score) => sum + normalizeNumber(score.total), 0)
  const averageScore = normalizedSubjects.length ? totalScore / normalizedSubjects.length : 0

  return {
    ...student,
    subjects: normalizedSubjects,
    total_score: totalScore,
    average_score: averageScore,
    position: normalizeNumber(student?.position || 0),
  }
}

function format(value, digits) { return Number(value || 0).toFixed(digits) }
function ordinal(value) { const suffix = value % 100 >= 11 && value % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[value % 10] || 'th'); return `${value}${suffix}` }
function posClass(value) { return value <= 3 ? `top${value}` : '' }
function subjectAverageClass(index, total) { return total >= Number(subjects.value[index]?.class_average || 0) ? 'above-average' : 'below-average' }
function printSheet() { window.print() }

watch(() => filters.academicSessionId, async () => { await loadTerms(); await loadBroadsheet() })
watch(() => filters.classLevelId, async () => { await loadArms(); await loadBroadsheet() })
watch(() => [filters.classArmId, filters.termId], loadBroadsheet)

onMounted(async () => {
  try { await loadOptions(); await loadArms(); await loadBroadsheet() } catch (error) { errorMessage.value = error.message || 'Unable to load broadsheet options.' }
})
</script>

<style scoped>
.broadsheet-page{width:100%;max-width:100%;margin:0 auto;padding:1.5rem 1rem 4rem;color:#1b2436;font-family:inherit;font-variant-numeric:tabular-nums}.masthead{display:flex;justify-content:space-between;gap:1rem;border-top:3px solid #101d33;border-bottom:1px solid #1b2436;padding:1.1rem 0 .85rem}.masthead h1{margin:0;font-size:2rem;color:#0d1626;font-weight:700;font-family:inherit}.masthead em{color:#7c5f22;font-size:.8em;font-weight:400}.masthead p{margin:.35rem 0 0;color:#4d5670;font-size:.85rem}.masthead-meta{text-align:right;color:#4d5670;font-size:.8rem;line-height:1.55}.masthead-meta strong{color:#1b2436}.filter-bar{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;padding:.8rem 0 1.1rem;border-bottom:1px solid #e2e2da}.filter-bar select,.search-input{min-width:9rem;padding:.45rem .6rem;border:1px solid #c9c9bd;border-radius:3px;background:#fff;color:#1b2436;font:inherit;font-size:.8rem}.search-input{width:12rem}.filter-spacer{flex:1}.btn{padding:.5rem .8rem;border:1px solid transparent;border-radius:3px;font:inherit;font-size:.8rem;cursor:pointer}.btn:disabled{cursor:not-allowed;opacity:.55}.btn-ghost{border-color:#c9c9bd;background:transparent}.btn-primary{background:#101d33;color:#fff}.ticker{display:flex;overflow:auto;margin:1.1rem 0;border:1px solid #e2e2da;background:#fff}.ticker-item{min-width:8rem;padding:.65rem 1rem;border-right:1px solid #e2e2da}.ticker-label{margin-bottom:.2rem;color:#8890a3;font-size:.7rem}.ticker strong{font-size:1rem}.low,.below-average{color:#a5503f}.above-average{color:#3c6e52}.table-wrap{overflow:auto;max-height:72vh;border:1px solid #c9c9bd;background:#fff}table{width:100%;border-collapse:separate;border-spacing:0;font-size:.76rem}th{position:sticky;top:0;z-index:2;padding:.65rem .5rem;background:#101d33;color:#e9e5d6;font-weight:500;white-space:nowrap}th:first-child{left:0;z-index:4}.student-heading{left:2.5rem;text-align:left}.subhead-row th{top:2.15rem;background:#16274a;color:#c9c3ac;font-size:.68rem}.row-number,.student-name,.summary,.position,.score-total{font-variant-numeric:tabular-nums}.position-badge{display:inline-flex;align-items:center;justify-content:center;min-width:2.7rem;padding:.2rem .45rem;border-radius:999px;background:#eef2ff;color:#0f172a;font-weight:600}.top1{background:#fef3c7;color:#7c5f22}.top2{background:#e2e8f0;color:#0f172a}.top3{background:#fce7f3;color:#7c2d12}@media print{.broadsheet-page{padding:0 !important}.filter-bar{display:none !important}.masthead{border-top:none}.table-wrap{max-height:none;overflow:visible;border:none}.table-wrap table{font-size:11px}.btn{display:none !important}}td{padding:.5rem;border-bottom:1px solid #e2e2da;text-align:center;white-space:nowrap}tbody tr:nth-child(even) td{background:#fbfaf6}.row-number{position:sticky;left:0;text-align:left;color:#8890a3;background:#fff}.student-name{position:sticky;left:2.5rem;text-align:left;font-weight:500;background:#fff}tbody tr:nth-child(even) .row-number,tbody tr:nth-child(even) .student-name{background:#fbfaf6}.score-total,.summary,.position{border-left:1px solid #c9c9bd}.score-total{font-weight:600}.summary{font-weight:600}.position-badge{display:inline-flex;min-width:1.7rem;justify-content:center;padding:.25rem .35rem;border-radius:1rem;background:#eef0f4;color:#4d5670}.top1{background:#a9822f;color:#fff}.top2{background:#c4bda3;color:#3a3221}.top3{background:#e4d9b8;color:#5a4a1f}.state{padding:2rem 0;color:#8890a3}.error{color:#a5503f}@media(max-width:640px){.masthead{flex-direction:column}.masthead-meta{text-align:left}.masthead h1{font-size:1.6rem}.filter-spacer{display:none}.filter-bar>*{flex:1}.search-input{width:auto}}
</style>