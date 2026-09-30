import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterJobs,
  deadlineLabel,
  normalizeRegion,
  formatTime,
} from '../src/lib/jobs.mjs'

const jobs = [
  {
    id: 'a',
    title: '오전 돌봄',
    company: '한마음',
    location: '전라북 전주시',
    work_type: '방문요양',
    days: '주 5일',
    created_at: '2026-09-20',
    deadline_date: null,
  },
  {
    id: 'b',
    title: '야간 돌봄',
    company: '함께',
    location: '전북 익산시',
    work_type: '시설요양',
    days: '평균근무시간 : 40',
    created_at: '2026-09-25',
    deadline_date: '2026-10-02',
  },
  {
    id: 'c',
    title: '오전 돌봄',
    company: '한마음',
    location: '서울 강남구',
    work_type: '방문요양',
    days: '주 3일',
    created_at: '2026-09-29',
    deadline_date: '2026-10-01',
  },
]

test('지역 별칭을 합치되 전남광주통합을 전남이나 광주로 단정하지 않는 처리', () => {
  assert.equal(normalizeRegion('전라북 전주시'), '전북')
  assert.equal(normalizeRegion('전북 익산시'), '전북')
  assert.equal(normalizeRegion('전남광주통합 광산구'), '전남광주통합')
})
test('검색과 지역과 직무 필터를 함께 만족하는 공고만 반환', () => {
  assert.deepEqual(
    filterJobs(jobs, {
      query: '한마음 오전',
      region: '전북',
      types: ['방문요양'],
    }).map((x) => x.id),
    ['a'],
  )
  assert.deepEqual(filterJobs(jobs, { query: '없는 기관' }), [])
})
test('주당 근무시간을 근무일 수로 추정하지 않는 처리', () => {
  assert.deepEqual(
    filterJobs(jobs, { days: '주 5일' }).map((x) => x.id),
    ['a'],
  )
})
test('마감 미지정은 임박순 끝에 배치하고 원본 배열 보존', () => {
  assert.deepEqual(
    filterJobs(jobs, { sort: 'deadline' }).map((x) => x.id),
    ['c', 'b', 'a'],
  )
  assert.deepEqual(
    jobs.map((x) => x.id),
    ['a', 'b', 'c'],
  )
})
test('한국 날짜 경계에서 마감 여부 계산 및 미지정 상태 구분', () => {
  const now = new Date('2026-09-30T15:05:00Z')
  assert.equal(deadlineLabel('2026-09-30', now), '마감')
  assert.equal(deadlineLabel('2026-10-01', now), '오늘 마감')
  assert.equal(deadlineLabel(null, now), '마감일 미기재')
})
test('근무시간 숫자 원본을 하루 근무시간으로 오인하지 않는 표시', () => {
  assert.equal(formatTime('40'), '상세 확인 필요')
  assert.equal(formatTime(null), '미기재')
  assert.equal(
    formatTime('(근무시간) (오전) 9시 00분 ~ (정오) 12시 00분'),
    '오전 9시 00분 ~ 정오 12시 00분',
  )
})
