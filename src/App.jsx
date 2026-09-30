import Footer from './components/Footer.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import dataUrl from '../web-data/jobs.json?url'
import Icon from './components/Icon.jsx'
import JobCard from './components/JobCard.jsx'
import Filters from './components/Filters.jsx'
import JobDetail from './components/JobDetail.jsx'
import { filterJobs, normalizeRegion } from './lib/jobs.mjs'

const EMPTY_FILTERS = {
  query: '',
  region: '',
  district: '',
  types: [],
  days: '',
  sort: 'latest',
}
const PAGE_SIZE = 12
const NAV = [
  { path: '/', label: '일자리 찾기', icon: 'bag' },
  { path: '/saved', label: '관심 공고', icon: 'heart' },
  { path: '/recent', label: '최근 본 공고', icon: 'clock' },
]
function readStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value)
      ? value.filter((id) => typeof id === 'string').slice(0, 500)
      : []
  } catch {
    return []
  }
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [request, setRequest] = useState(0)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState(() => readStorage('dolbom-demo-saved'))
  const [recent, setRecent] = useState(() => readStorage('dolbom-demo-recent'))
  const [toast, setToast] = useState('')
  const dialog = useRef(null)
  const results = useRef(null)
  const listScroll = useRef(0)
  const previousList = useRef('/')

  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch(dataUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('공고 조회 실패')
        return response.json()
      })
      .then((result) => {
        if (!Array.isArray(result.jobs) || !result.capturedAt)
          throw new Error('데이터 형식 오류')
        setData(result)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true)
      })
    return () => controller.abort()
  }, [request])

  useEffect(() => {
    const pop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const id = path.startsWith('/jobs/') ? path.slice(6) : null
  const job = data?.jobs.find((item) => encodeURIComponent(item.id) === id)
  useEffect(() => {
    if (!job) return
    document.title = `${job.title} · 돌봄다리`
    setRecent((previous) => {
      const next = [
        job.id,
        ...previous.filter((item) => item !== job.id),
      ].slice(0, 100)
      try {
        localStorage.setItem('dolbom-demo-recent', JSON.stringify(next))
      } catch {
        /* 저장 불가 시 현재 세션만 유지 */
      }
      return next
    })
  }, [job?.id])
  useEffect(() => {
    if (!id)
      document.title = `${NAV.find((item) => item.path === path)?.label || '일자리 찾기'} · 돌봄다리`
  }, [path, id])

  const navigate = (next) => {
    if (!id) {
      listScroll.current = window.scrollY
      previousList.current = path
    }
    window.history.pushState({}, '', next)
    setPath(next)
    if (!next.startsWith('/jobs/')) window.scrollTo({ top: 0 })
  }
  const goList = () => {
    navigate(previousList.current)
    requestAnimationFrame(() => window.scrollTo({ top: listScroll.current }))
  }
  const update = (value) => {
    setFilters((previous) => ({ ...previous, ...value }))
    setPage(1)
  }
  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }
  const toggleSave = (id) => {
    const isSaved = saved.includes(id)
    const next = isSaved ? saved.filter((item) => item !== id) : [...saved, id]
    setSaved(next)
    try {
      localStorage.setItem('dolbom-demo-saved', JSON.stringify(next))
      setToast(isSaved ? '관심 공고에서 해제했어요' : '관심 공고에 저장했어요')
    } catch {
      setToast('브라우저 저장이 제한되어 현재 화면에서만 유지돼요')
    }
  }
  const jobs = data?.jobs || []
  const counts = useMemo(
    () =>
      jobs.reduce(
        (acc, item) => ({
          ...acc,
          [item.work_type]: (acc[item.work_type] || 0) + 1,
        }),
        {},
      ),
    [data],
  )
  const types = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  const regions = useMemo(
    () =>
      [...new Set(jobs.map((item) => normalizeRegion(item.location)))].sort(
        (a, b) => a.localeCompare(b, 'ko'),
      ),
    [data],
  )
  const districts = useMemo(
    () =>
      [
        ...new Set(
          jobs
            .filter((item) => normalizeRegion(item.location) === filters.region)
            .map((item) => item.location.split(/\s+/)[1])
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, 'ko')),
    [data, filters.region],
  )
  const filtered = useMemo(() => {
    const scoped =
      path === '/saved'
        ? jobs.filter((item) => saved.includes(item.id))
        : path === '/recent'
          ? jobs.filter((item) => recent.includes(item.id))
          : jobs
    const result = filterJobs(scoped, filters)
    return path === '/recent' && filters.sort === 'latest'
      ? result.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))
      : result
  }, [data, filters, path, saved, recent])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const activeCount =
    filters.types.length +
    Number(!!filters.region) +
    Number(!!filters.district) +
    Number(!!filters.days)
  const filterProps = {
    filters,
    update,
    regions,
    districts,
    types,
    reset,
  }
  const title =
    path === '/saved'
      ? '마음에 드는 일자리를 한곳에'
      : path === '/recent'
        ? '살펴본 일자리를 다시 만나보세요'
        : '내게 맞는 돌봄 일자리 찾기'
  const changeNav = (next) => {
    reset()
    navigate(next)
  }
  const renderNav = (mobile = false) =>
    NAV.filter((item) => item.path === '/').map((item) => (
      <a
        key={item.path}
        href={item.path}
        className={
          path === item.path || (id && item.path === previousList.current)
            ? 'active'
            : ''
        }
        aria-current={
          path === item.path || (id && item.path === previousList.current)
            ? 'page'
            : undefined
        }
        onClick={(event) => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
            event.preventDefault()
            changeNav(item.path)
          }
        }}
      >
        {mobile && <Icon name={item.icon} />}
        <span>{item.label}</span>
        {item.path === '/saved' && saved.length > 0 && (
          <small>{saved.length}</small>
        )}
      </a>
    ))

  return (
    <>
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              changeNav('/')
            }}
            aria-label="돌봄다리 홈"
          >
            <img src="/logo.png" alt="" width="32" height="26" />
            <span>돌봄다리</span>
          </a>
          <nav className="desktop-nav" aria-label="주 메뉴">
            {renderNav()}
          </nav>
        </div>
      </header>
      <div id="main">
        {!data ? (
          <main className="load-state" aria-live="polite">
            {error ? (
              <>
                <h1>공고를 불러오지 못했어요</h1>
                <p>연결 상태를 확인한 뒤 다시 시도해 주세요</p>
                <button
                  className="primary"
                  onClick={() => setRequest((value) => value + 1)}
                >
                  다시 시도
                </button>
              </>
            ) : (
              <>
                <span className="spinner" />
                <p>일자리를 불러오고 있어요</p>
              </>
            )}
          </main>
        ) : id ? (
          <JobDetail
            job={job}
            saved={saved.includes(job?.id)}
            onSave={toggleSave}
            onBack={goList}
          />
        ) : !NAV.some((item) => item.path === path) ? (
          <main className="empty">
            <h1>페이지를 찾을 수 없습니다</h1>
            <button className="primary" onClick={() => changeNav('/')}>
              일자리 목록으로
            </button>
          </main>
        ) : (
          <>
            <section className="intro">
              <div className="intro-inner">
                <div>
                  <p className="eyebrow">돌봄으로 이어지는 더 나은 일상</p>
                  <h1>{title}</h1>
                  <p className="intro-description">
                    {path === '/'
                      ? '가까운 지역에서, 원하는 조건으로 일자리를 찾아보세요'
                      : '이 브라우저에 저장한 공고를 확인할 수 있어요'}
                  </p>
                </div>

              </div>
            </section>
            <main className="workspace">
              <aside className="filters-panel" aria-label="일자리 필터">
                <Filters {...filterProps} />
              </aside>
              <section className="results-column" aria-label="일자리 공고">
                <form
                  className="search-bar"
                  role="search"
                  onSubmit={(event) => {
                    event.preventDefault()
                    results.current?.scrollIntoView({
                      block: 'start',
                      behavior: 'smooth',
                    })
                  }}
                >
                  <Icon name="search" size={22} />
                  <label className="sr-only" htmlFor="search">
                    공고·기관·지역 검색
                  </label>
                  <input
                    id="search"
                    type="search"
                    placeholder="공고명, 기관명, 지역을 검색해 보세요"
                    value={filters.query}
                    onChange={(event) => update({ query: event.target.value })}
                  />
                  <button type="submit">검색</button>
                </form>
                <div className="mobile-filters">
                  <button onClick={() => dialog.current.showModal()}>
                    <Icon name="pin" size={17} />
                    {filters.region || '전체 지역'}
                    <Icon name="arrow" size={13} />
                  </button>
                  <button onClick={() => dialog.current.showModal()}>
                    <Icon name="filter" size={17} />
                    조건 설정{activeCount > 0 && <small>{activeCount}</small>}
                  </button>
                </div>
                <div className="type-chips" aria-label="근무유형 빠른 선택">
                  <button
                    className={!filters.types.length ? 'selected' : ''}
                    aria-pressed={!filters.types.length}
                    onClick={() => update({ types: [] })}
                  >
                    전체
                  </button>
                  {types.map((type) => (
                    <button
                      className={filters.types.includes(type) ? 'selected' : ''}
                      aria-pressed={filters.types.includes(type)}
                      key={type}
                      onClick={() =>
                        update({
                          types: filters.types.includes(type)
                            ? filters.types.filter((item) => item !== type)
                            : [...filters.types, type],
                        })
                      }
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {(activeCount > 0 || filters.query) && (
                  <div className="applied-filters">
                    <span>
                      {[
                        filters.region,
                        filters.district,
                        filters.days,
                        filters.query && `“${filters.query}”`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '선택한 근무유형'}
                    </span>
                    <button onClick={reset}>
                      전체 해제
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                )}
                <div className="results-toolbar" ref={results}>
                  <label className="sr-only" htmlFor="sort">
                    정렬
                  </label>
                  <select
                    id="sort"
                    value={filters.sort}
                    onChange={(event) => update({ sort: event.target.value })}
                  >
                    <option value="latest">
                      {path === '/recent' ? '최근 열람순' : '최신순'}
                    </option>
                    <option value="deadline">마감임박순</option>
                  </select>
                </div>
                {filtered.length ? (
                  <div className="jobs-grid">
                    {filtered
                      .slice(
                        (currentPage - 1) * PAGE_SIZE,
                        currentPage * PAGE_SIZE,
                      )
                      .map((item) => (
                        <JobCard
                          key={item.id}
                          job={item}
                          saved={saved.includes(item.id)}
                          viewed={recent.includes(item.id)}
                          onSave={toggleSave}
                          onNavigate={(id) =>
                            navigate(`/jobs/${encodeURIComponent(id)}`)
                          }
                        />
                      ))}
                  </div>
                ) : (
                  <div className="empty">
                    <div className="empty-icon">
                      <Icon
                        name={path === '/saved' ? 'heart' : 'search'}
                        size={30}
                      />
                    </div>
                    <h2>
                      {path === '/saved' && !saved.length
                        ? '아직 관심 공고가 없어요'
                        : '조건에 맞는 공고가 없어요'}
                    </h2>
                    <p>
                      {path === '/saved' && !saved.length
                        ? '마음에 드는 공고의 관심 버튼을 눌러보세요'
                        : '검색어나 필터를 바꿔서 다시 찾아보세요'}
                    </p>
                    <button
                      className="outline"
                      onClick={() => (path === '/' ? reset() : changeNav('/'))}
                    >
                      {path === '/' ? '검색 조건 초기화' : '일자리 찾아보기'}
                    </button>
                  </div>
                )}
                {pages > 1 && (
                  <nav className="pagination" aria-label="공고 페이지">
                    <button
                      aria-label="이전 페이지"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setPage(currentPage - 1)
                        results.current?.scrollIntoView({ block: 'start' })
                      }}
                    >
                      <Icon name="back" size={18} />
                    </button>
                    {Array.from(
                      { length: Math.min(5, pages) },
                      (_, i) =>
                        Math.min(
                          Math.max(1, currentPage - 2),
                          Math.max(1, pages - 4),
                        ) + i,
                    ).map((number) => (
                      <button
                        key={number}
                        className={number === currentPage ? 'current' : ''}
                        aria-label={`${number}페이지`}
                        aria-current={
                          number === currentPage ? 'page' : undefined
                        }
                        onClick={() => {
                          setPage(number)
                          results.current?.scrollIntoView({ block: 'start' })
                        }}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      aria-label="다음 페이지"
                      disabled={currentPage === pages}
                      onClick={() => {
                        setPage(currentPage + 1)
                        results.current?.scrollIntoView({ block: 'start' })
                      }}
                    >
                      <Icon name="arrow" size={18} />
                    </button>
                    <span>
                      {currentPage} / {pages}
                    </span>
                  </nav>
                )}
                <p className="snapshot-note">
                  {data.capturedAt.slice(0, 10).replaceAll('-', '.')} 기준
                  공고 · 실제 모집 여부는 확인 필요
                </p>
              </section>
            </main>
          </>
        )}
      </div>
      <Footer />
      <nav className="mobile-nav" aria-label="모바일 메뉴">
        {renderNav(true)}
      </nav>
      <dialog
        ref={dialog}
        className="filter-dialog"
        aria-labelledby="filter-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close()
        }}
      >
        <div className="dialog-content">
          <header>
            <h2 id="filter-title">일자리 조건 설정</h2>
            <button
              className="icon-button"
              aria-label="필터 닫기"
              onClick={() => dialog.current.close()}
            >
              <Icon name="close" />
            </button>
          </header>
          <Filters {...filterProps} prefix="mobile" />
          <button
            className="primary apply-filters"
            onClick={() => dialog.current.close()}
          >
            공고 보기
          </button>
        </div>
      </dialog>
      <div className={`toast ${toast ? 'visible' : ''}`} role="status">
        {toast}
      </div>
    </>
  )
}
