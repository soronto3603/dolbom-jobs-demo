import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import { Tags } from './JobCard.jsx'
import { deadlineLabel, formatTime } from '../lib/jobs.mjs'

function Info({ items }) {
  return (
    <dl className="detail-info">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {Array.isArray(value)
              ? value.join(' · ') || '미기재'
              : value || '미기재'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function JobDetail({ job, saved, onSave, onBack }) {
  const heading = useRef(null)
  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [job?.id])
  if (!job)
    return (
      <main className="empty detail-missing">
        <h1>공고를 찾을 수 없습니다</h1>
        <p>주소를 확인하거나 일자리 목록에서 다시 찾아보세요</p>
        <button className="primary" onClick={onBack}>
          일자리 목록으로
        </button>
      </main>
    )
  return (
    <main className="detail-page">
      <button className="back-link" onClick={onBack}>
        <Icon name="back" />
        일자리 목록
      </button>
      <div className="detail-layout">
        <article className="detail-card">
          <header className="detail-header">
            <div className="card-top">
              <Tags job={job} />
              <span className="deadline">
                {deadlineLabel(job.deadline_date)}
              </span>
            </div>
            <p className="location">
              <Icon name="pin" size={17} />
              {job.location}
            </p>
            <h1 tabIndex={-1} ref={heading}>
              {job.title}
            </h1>
            <p className="company">{job.company}</p>
          </header>
          <section>
            <h2>근무 조건</h2>
            <Info
              items={[
                ['급여', job.salary],
                ['근무유형', job.work_type],
                ['근무일', job.days],
                ['근무시간', formatTime(job.time)],
                ['근무 지역', job.location],
              ]}
            />
          </section>
          <section>
            <h2>모집 조건</h2>
            <Info
              items={[
                ['필수 자격', job.required_qualification],
                ['경력 조건', job.experience_preference],
                ['복리후생', job.benefits],
                ['등록일', job.registration_date],
                ['마감일', job.deadline_date || '미기재 · 모집 여부 확인 필요'],
              ]}
            />
          </section>
          <section>
            <h2>기관 정보</h2>
            <Info
              items={[
                ['기관명', job.company],
                ['공고 출처', job.source === 'work24' ? '고용24' : '직접 등록'],
              ]}
            />
          </section>
        </article>
        <aside className="detail-aside">
          <span className="tag blue">일자리 상세</span>
          <h2>
            마음에 드는
            <br />
            일자리를 모아보세요
          </h2>
          <p>
            관심 공고로 저장하면
            <br />
            다시 찾기 편해요
          </p>
          <button
            className={`primary ${saved ? 'is-saved' : ''}`}
            onClick={() => onSave(job.id)}
            aria-pressed={saved}
          >
            <Icon name={saved ? 'check' : 'heart'} />
            {saved ? '관심 공고 저장됨' : '관심 공고 저장'}
          </button>
          <p className="small-note">이 브라우저에만 저장</p>
          <div className="detail-notice">
            <strong>공고 안내</strong>
            <p>
              저장된 시점의 공고 정보입니다
              <br />
              실제 모집 여부와 근무 조건은 확인이 필요합니다
            </p>
            <p>지원·전화 연결은 제공하지 않습니다</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
