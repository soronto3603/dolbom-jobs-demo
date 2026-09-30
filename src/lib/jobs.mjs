const aliases = {
  전라북: '전북',
  전라남: '전남',
  경상북: '경북',
  경상남: '경남',
  충청북: '충북',
  충청남: '충남',
}

export function normalizeRegion(location = '') {
  const region = location.trim().split(/\s+/)[0]
  return aliases[region] || region
}

export function filterJobs(
  jobs,
  {
    query = '',
    region = '',
    district = '',
    types = [],
    days = '',
    sort = 'latest',
  } = {},
) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return jobs
    .filter((job) => {
      const text =
        `${job.title} ${job.company} ${job.location} ${job.work_type}`.toLocaleLowerCase()
      return (
        words.every((word) => text.includes(word)) &&
        (!region || normalizeRegion(job.location) === region) &&
        (!district || job.location.split(/\s+/)[1] === district) &&
        (!types.length || types.includes(job.work_type)) &&
        (!days || job.days === days)
      )
    })
    .sort((a, b) =>
      sort === 'deadline'
        ? (a.deadline_date || '9999').localeCompare(
            b.deadline_date || '9999',
          ) || b.created_at.localeCompare(a.created_at)
        : b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id),
    )
}

export function deadlineLabel(date, now = new Date()) {
  if (!date) return '마감일 미기재'
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const days = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  )
  if (days < 0) return '마감'
  if (days === 0) return '오늘 마감'
  return `${days}일 후 마감`
}

export function formatTime(value) {
  if (!value) return '미기재'
  if (/^\d+(\.\d+)?$/.test(value.trim())) return '상세 확인 필요'
  return value
    .replace(/\(근무시간\)\s*/g, '')
    .replace(/[()]/g, '')
    .trim()
}
