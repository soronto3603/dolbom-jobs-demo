import Icon from './Icon.jsx'

export default function Filters({
  filters,
  update,
  regions,
  districts,
  types,
  reset,
  prefix = 'desktop',
}) {
  return (
    <>
      <div className="filter-heading">
        <h2>
          <Icon name="filter" />
          맞춤 조건
        </h2>
        <button className="text-button" onClick={reset}>
          <Icon name="reset" size={14} />
          초기화
        </button>
      </div>
      <div className="filter-section">
        <label htmlFor={`${prefix}-region`}>근무 지역</label>
        <select
          id={`${prefix}-region`}
          value={filters.region}
          onChange={(event) =>
            update({ region: event.target.value, district: '' })
          }
        >
          <option value="">전체 지역</option>
          {regions.map((region) => (
            <option key={region}>{region}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`${prefix}-district`}>
          시·군·구
        </label>
        <select
          id={`${prefix}-district`}
          value={filters.district}
          disabled={!filters.region}
          onChange={(event) => update({ district: event.target.value })}
        >
          <option value="">전체 시·군·구</option>
          {districts.map((district) => (
            <option key={district}>{district}</option>
          ))}
        </select>
      </div>
      <fieldset className="filter-section">
        <legend>근무유형</legend>
        {types.map((type) => (
          <label className="check-row" key={type}>
            <input
              type="checkbox"
              checked={filters.types.includes(type)}
              onChange={() =>
                update({
                  types: filters.types.includes(type)
                    ? filters.types.filter((item) => item !== type)
                    : [...filters.types, type],
                })
              }
            />
            <span>{type}</span>
          </label>
        ))}
      </fieldset>
      <div className="filter-section">
        <label htmlFor={`${prefix}-days`}>주당 근무일 수</label>
        <select
          id={`${prefix}-days`}
          value={filters.days}
          onChange={(event) => update({ days: event.target.value })}
        >
          <option value="">전체 근무일</option>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <option key={day}>주 {day}일</option>
          ))}
        </select>
        <p className="filter-help">공고에 명시된 근무일 수 기준</p>
      </div>
      <div className="filter-note">
        <span className="mini-brand">돌봄다리</span>
        <p>
          좋은 돌봄의 시작,
          <br />
          나에게 맞는 일자리부터
        </p>
      </div>
    </>
  )
}
