import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const source = process.argv[2]
if (!source) throw new Error('사용법: npm run data:prepare -- data/수집시각')
const dir = resolve(source)
const raw = await readFile(`${dir}/jobs.json`)
const manifest = JSON.parse(await readFile(`${dir}/manifest.json`, 'utf8'))
if (
  createHash('sha256').update(raw).digest('hex') !==
  manifest.sha256['jobs.json']
)
  throw new Error('원본 해시 불일치')
const fields = [
  'id',
  'source',
  'title',
  'work_type',
  'salary',
  'location',
  'days',
  'time',
  'company',
  'registration_date',
  'deadline_date',
  'created_at',
  'required_qualification',
  'experience_preference',
  'benefits',
]
const jobs = JSON.parse(raw).map((job) =>
  Object.fromEntries(fields.map((field) => [field, job[field] ?? null])),
)
if (
  jobs.length !== manifest.imported_count ||
  new Set(jobs.map((job) => job.id)).size !== jobs.length
)
  throw new Error('원본 건수 또는 ID 검증 실패')
const output = resolve('web-data')
await mkdir(output, { recursive: true })
await writeFile(
  `${output}/jobs.json`,
  JSON.stringify({ capturedAt: manifest.captured_at, jobs }),
)
console.log(`공개용 필드 ${fields.length}개, 공고 ${jobs.length}건 준비 완료`)
