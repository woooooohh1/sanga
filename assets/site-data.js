(function(){
  "use strict";
  const api=window.SangaPublicData; if(!api) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmtDate=v=>v?String(v).slice(0,10).replaceAll('-','.'):'-';
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const pickCohort=list=>{const a=[...(list||[])].filter(x=>x.is_published!==false);if(!a.length)return null;const t=new Date();t.setHours(0,0,0,0);a.sort((x,y)=>{const X=x.course_start_date?new Date(x.course_start_date+'T00:00:00'):new Date(8640000000000000),Y=y.course_start_date?new Date(y.course_start_date+'T00:00:00'):new Date(8640000000000000),xf=X>=t,yf=Y>=t;if(xf!==yf)return xf?-1:1;return xf?X-Y:Y-X;});return a[0];};
  const recStatus=c=>{if(!c)return'준비중';if(c.operation_status==='cancelled')return'마감';if(c.recruitment_type==='rolling')return'상시접수';const t=new Date();t.setHours(0,0,0,0);const s=c.application_start_date?new Date(c.application_start_date+'T00:00:00'):null;const e=c.application_end_date?new Date(c.application_end_date+'T00:00:00'):null;if(s&&t<s)return'준비중';if(e&&t>e)return'마감';if(s&&e)return'모집중';return'준비중';};
  const statusClass=s=>s==='마감'?'closed':s==='상시접수'?'always':'open';
  const metaIcon=k=>({period:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>',time:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',support:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="5"></circle><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"></path></svg>'}[k]);

  function homeCourseGrid(){return document.querySelector('#popularCourseTitle')?.closest('.section')?.querySelector('.course-grid');}
  function homeNoticeHost(){const h=document.querySelector('#noticeTitle')?.closest('.section-head')?.nextElementSibling;return h?.classList.contains('notice-list')?h:null;}

  async function homeCourses(){
    const grid=homeCourseGrid(); if(!grid)return;
    try{
      const rows=await api.queryCourses();
      const visible=rows.slice(0,3);
      grid.innerHTML=visible.length?visible.map(r=>{
        const c=pickCohort(r.course_cohorts),s=recStatus(c),tags=(r.course_tags||[]).map(x=>x.tags?.name).filter(Boolean).slice(0,4);
        return `<article class="card course-card motion-card"><div class="course-top"><div class="course-topline"><span class="chip">${esc(r.course_categories?.name||'과정')}</span><span class="status ${statusClass(s)}">${esc(s)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.short_description||r.description||r.lead||'')}</p></div><dl class="course-meta"><span>${metaIcon('period')}<span class="meta-label">교육기간</span><b>${c?.course_start_date&&c?.course_end_date?`${fmtDate(c.course_start_date)} ~ ${fmtDate(c.course_end_date)}`:'상담 문의'}</b></span><span>${metaIcon('time')}<span class="meta-label">교육시간</span><b>${c?.class_start_time&&c?.class_end_time?`${String(c.class_start_time).slice(0,5)} ~ ${String(c.class_end_time).slice(0,5)}`:'상담 문의'}</b></span><span>${metaIcon('support')}<span class="meta-label">지원구분</span><b>${esc(c?.support_description||'상담 문의')}</b></span></dl><div class="course-tags">${tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div><footer class="course-footer"><div class="course-price"><small>수강료</small><strong>${c?Number(c.tuition_amount||0).toLocaleString('ko-KR')+'원':'상담 문의'}</strong></div><a class="btn btn-outline" href="course-detail.html?id=${encodeURIComponent(r.id)}">과정 상세</a></footer></article>`;
      }).join(''):'<div class="card course-empty-state">현재 공개된 과정이 없습니다.</div>';
    }catch(e){
      console.error('[SANGA] public courses',e);
      grid.innerHTML='<div class="card course-empty-state"><strong>과정 정보를 불러오지 못했습니다.</strong><small>브라우저 콘솔의 [SANGA] public courses 오류를 확인해 주세요.</small></div>';
    }
  }

  async function homeNotices(){
    const host=homeNoticeHost(); if(!host)return;
    try{
      const notices=await api.loadNotices(3);
      host.innerHTML=notices.map(n=>`<a class="notice-row" href="community.html"><span>${esc(n.title)}</span><time>${fmtDate(n.published_on)}</time></a>`).join('')||'<div class="notice-row">등록된 공지사항이 없습니다.</div>';
    }catch(e){
      console.error('[SANGA] public notices',e);
      host.innerHTML='<div class="notice-row">공지사항을 불러오지 못했습니다.</div>';
    }
  }

  async function home(){await Promise.allSettled([homeCourses(),homeNotices()]);}

  async function noticesPage(){
    const tb=document.querySelector('.data-table tbody'); if(!tb)return;
    try{const data=await api.loadNotices();tb.innerHTML=data.map((n,i)=>`<tr><td>${data.length-i}</td><td><strong>${esc(n.title)}</strong><div style="margin-top:5px;color:#667085">${esc(n.content)}</div></td><td>${fmtDate(n.published_on)}</td><td>${Number(n.view_count||0)}</td></tr>`).join('')||'<tr><td colspan="4">등록된 공지사항이 없습니다.</td></tr>';}
    catch(e){console.error('[SANGA] public notices page',e);tb.innerHTML='<tr><td colspan="4">공지사항을 불러오지 못했습니다.</td></tr>';}
  }

  async function jobsPage(){
    const tb=document.querySelector('.data-table tbody'); if(!tb)return;
    try{const data=await api.loadJobs();tb.innerHTML=data.map(j=>`<tr><td>${esc(j.category)}</td><td><strong>${esc(j.title)}</strong></td><td>${esc(j.company)}</td><td>${fmtDate(j.published_on)}</td></tr>`).join('')||'<tr><td colspan="4">등록된 취업정보가 없습니다.</td></tr>';}
    catch(e){console.error('[SANGA] public jobs',e);tb.innerHTML='<tr><td colspan="4">취업정보를 불러오지 못했습니다.</td></tr>';}
  }

  async function historyPage(){
    const host=document.querySelector('#historyStage'); if(!host)return;
    try{
      const data=await api.loadHistory();
      const rail='<div class="history-rail"><div class="history-rail-fill" id="historyRailFill"></div></div>';
      const cards=data.map(x=>`<article class="history-node reveal-up is-visible"><div class="history-card-wrap"><div class="card history-card"><span class="history-tag">${esc(x.tag||'HISTORY')}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></div></div><div class="history-year-wrap"><strong class="history-year">${esc(x.year_label)}</strong></div></article>`).join('');
      host.innerHTML=rail+(cards||'<div class="card content-card history-empty-state">등록된 학원 연혁이 없습니다.</div>');
      // app.js initializes before async data arrives, so make the new rail visible immediately.
      const fill=host.querySelector('#historyRailFill'); if(fill) fill.style.height=data.length?'100%':'0%';
    }catch(e){
      console.error('[SANGA] public history',e);
      host.innerHTML='<div class="history-rail"><div class="history-rail-fill" id="historyRailFill"></div></div><div class="card content-card history-empty-state">학원 연혁을 불러오지 못했습니다.</div>';
    }
  }

  if(file==='index.html'||file==='')home();
  if(file==='community.html')noticesPage();
  if(file==='jobs.html')jobsPage();
  if(file==='academy.html')historyPage();
})();
