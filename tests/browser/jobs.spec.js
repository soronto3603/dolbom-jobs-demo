import { test, expect } from '@playwright/test'

test('실제 공고의 직무 필터와 검색 빈 결과 및 초기화', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status').first()).toHaveText('전체 5,384건')
  await page.getByRole('button', { name: '시설요양' }).click()
  await expect(page.getByRole('status').first()).toHaveText('전체 743건')
  await expect(page.getByRole('article')).toHaveCount(12)
  await page.getByRole('searchbox').fill('검색결과가없는문자열검증')
  await expect(
    page.getByRole('heading', { name: '조건에 맞는 공고가 없어요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '검색 조건 초기화' }).click()
  await expect(page.getByRole('status').first()).toHaveText('전체 5,384건')
  await page.screenshot({ path: 'artifacts/screenshots/desktop.png' })
})

test('관심 공고 새로고침 유지와 상세 직접 접근 및 최근 본 공고', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  const card = page.getByRole('article').first()
  const title = await card.getByRole('heading').innerText()
  await card.getByRole('button', { name: /관심 저장/ }).click()
  await page
    .getByRole('navigation', { name: '주 메뉴', exact: true })
    .getByRole('link', { name: '관심 공고' })
    .click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: '자세히 보기' }).click()
  await expect(page).toHaveURL(/\/jobs\//)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(
    page.getByRole('button', { name: '관심 공고 저장됨' }),
  ).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/detail.png' })
  await page
    .getByRole('navigation', { name: '주 메뉴', exact: true })
    .getByRole('link', { name: '최근 본 공고' })
    .click()
  await expect(page.getByRole('article')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('모바일 필터와 단일 열 카드 및 가로 넘침 방지', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('navigation', { name: '모바일 메뉴' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '조건 설정' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('근무 지역', { exact: true }).selectOption('서울')
  await dialog.getByLabel('시·군·구', { exact: true }).selectOption('강남구')
  await dialog.getByRole('button', { name: /개 공고 보기/ }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('article').first()).toContainText('서울 강남구')
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({ path: 'artifacts/screenshots/mobile.png' })
  await page.getByRole('link', { name: '자세히 보기' }).first().click()
  await expect(page.getByRole('heading', { name: '근무 조건' })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('잘못된 상세 주소와 네트워크 실패에서 복구 가능한 안내', async ({
  page,
}) => {
  await page.goto('/jobs/missing-job')
  await expect(
    page.getByRole('heading', { name: '공고를 찾을 수 없습니다' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '일자리 목록으로' }).click()
  await expect(page.getByRole('article')).toHaveCount(12)
  await page.route('**/assets/jobs-*.json', (route) => route.abort())
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '공고를 불러오지 못했어요' }),
  ).toBeVisible()
  await page.unroute('**/assets/jobs-*.json')
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.getByRole('article')).toHaveCount(12)
})

test('최근 본 공고는 마지막으로 본 순서로 표시', async ({ page }) => {
  await page.goto('/')
  const secondTitle = await page
    .getByRole('article')
    .nth(1)
    .getByRole('heading')
    .innerText()
  await page.getByRole('link', { name: '자세히 보기' }).first().click()
  await page.getByRole('button', { name: '일자리 목록', exact: true }).click()
  await page.getByRole('link', { name: '자세히 보기' }).nth(1).click()
  await page
    .getByRole('navigation', { name: '주 메뉴', exact: true })
    .getByRole('link', { name: '최근 본 공고' })
    .click()
  await expect(
    page.getByRole('article').first().getByRole('heading'),
  ).toHaveText(secondTitle)
})
