import Icon from './Icon.jsx'
import { deadlineLabel, formatTime } from '../lib/jobs.mjs'

export function Tags({ job }) {
  return (
    <div className="tags">
      <span className={`tag ${job.source === 'work24' ? 'gov' : 'blue'}`}>
        {job.source === 'work24' ? '고용24' : '직접 등록'}
      </span>
      <span className="tag">{job.work_type || '근무유형 미기재'}</span>
    </div>
  )
}

export default function JobCard({ job, saved, onSave, onNavigate, viewed }) {
  return (
    <article className="job-card">
      <div className="card-top">
        <Tags job={job} />
        <span className="deadline">{deadlineLabel(job.deadline_date)}</span>
      </div>
      <div className="card-body">
        <p className="location">
          <Icon name="pin" size={15} />
          {job.location}
        </p>
        <h3>
          <a
            className={viewed ? 'viewed' : ''}
            href={`/jobs/${encodeURIComponent(job.id)}`}
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.button === 0
              ) {
                event.preventDefault()
                onNavigate(job.id)
              }
            }}
          >
            {job.title}
          </a>
        </h3>
        <p className="company">{job.company}</p>
        <dl className="card-info">
          <div>
            <dt>급여</dt>
            <dd>{job.salary}</dd>
          </div>
          <div>
            <dt>근무유형</dt>
            <dd>{job.work_type || '미기재'}</dd>
          </div>
          <div>
            <dt>근무일</dt>
            <dd>{job.days || '미기재'}</dd>
          </div>
          <div>
            <dt>근무시간</dt>
            <dd title={formatTime(job.time)}>{formatTime(job.time)}</dd>
          </div>
        </dl>
      </div>
      <div className="card-actions">
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          aria-label={`${job.title} 관심 ${saved ? '해제' : '저장'}`}
          aria-pressed={saved}
          onClick={() => onSave(job.id)}
        >
          <Icon name="heart" filled={saved} size={18} />
          관심
        </button>
        <a
          className="primary"
          href={`/jobs/${encodeURIComponent(job.id)}`}
          onClick={(event) => {
            if (
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              event.button === 0
            ) {
              event.preventDefault()
              onNavigate(job.id)
            }
          }}
        >
          자세히 보기
          <Icon name="arrow" size={16} />
        </a>
      </div>
    </article>
  )
}
