export default function Footer() {
  return (
    <footer className="business-footer">
      <div className="footer-brand">
        <strong>돌봄다리</strong>
        <span>사람과 돌봄, 일자리를 잇다</span>
      </div>
      <dl className="business-info">
        <div>
          <dt>상호</dt>
          <dd>돌봄다리</dd>
        </div>
        <div>
          <dt>대표자</dt>
          <dd>박여경</dd>
        </div>
        <div>
          <dt>사업자등록번호</dt>
          <dd>438-14-02613</dd>
        </div>
        <div className="business-address">
          <dt>사업장 소재지</dt>
          <dd>
            전북특별자치도 전주시 완산구 강변로 106, 101동 1502호(삼천동1가,
            삼천하이츠아파트)
          </dd>
        </div>
      </dl>
      <div className="footer-bottom">
        <small>© {new Date().getFullYear()} 돌봄다리</small>
        <span>일자리찾기 웹 데모</span>
      </div>
    </footer>
  )
}
