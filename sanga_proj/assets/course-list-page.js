(function(){
  "use strict";
  const pageType={"unemployed.html":"unemployed","worker.html":"worker","general.html":"general"}[(location.pathname.split('/').pop()||'').toLowerCase()];
  const listEl=document.querySelector('#courseList'); if(!pageType||!listEl)return;
  const api=window.SangaPublicData;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmtDate=v=>v?String(v).slice(0,10).replaceAll('-','.').replace(/^(\d{4})\./,'$1.'):'상담 문의';
  const fmtTime=v=>v?String(v).slice(0,5):'';
  const pickCohort=list=>{const arr=[...(list||[])].filter(x=>x.is_published!==false);if(!arr.length)return null;const today=new Date();today.setHours(0,0,0,0);arr.sort((a,b)=>{const A=a.course_start_date?new Date(a.course_start_date+'T00:00:00'):new Date(8640000000000000);const B=b.course_start_date?new Date(b.course_start_date+'T00:00:00'):new Date(8640000000000000);const af=A>=today,bf=B>=today;if(af!==bf)return af?-1:1;return af?A-B:B-A;});return arr[0];};
  const status=c=>{if(!c)return'준비중';if(c.operation_status==='cancelled')return'마감';if(c.recruitment_type==='rolling')return'상시접수';const t=new Date();t.setHours(0,0,0,0);const s=c.application_start_date?new Date(c.application_start_date+'T00:00:00'):null,e=c.application_end_date?new Date(c.application_end_date+'T00:00:00'):null;if(s&&t<s)return'준비중';if(e&&t>e)return'마감';if(s&&e)return'모집중';return'준비중';};
  const statusClass=s=>s==='마감'?'closed':s==='상시접수'?'always':'open';
  const metaIcon=k=>({period:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>',time:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',support:'<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="5"></circle><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"></path></svg>'}[k]);
  let courses=[];
  function render(){
    const cat=document.querySelector('#categoryFilter')?.value||'',kw=(document.querySelector('#courseSearch')?.value||'').trim().toLowerCase();
    const filtered=courses.filter(x=>(!cat||x.category===cat)&&(!kw||`${x.title} ${x.category} ${x.description}`.toLowerCase().includes(kw)));
    listEl.innerHTML=filtered.map(x=>`<article class="card course-card motion-card" data-course-card data-category="${esc(x.category)}" data-reveal="scale"><div class="course-top"><div class="course-topline"><span class="chip">${esc(x.category)}</span><span class="status ${statusClass(x.status)}">${esc(x.status)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.description||'과정 상세내용을 확인해 주세요.')}</p></div><dl class="course-meta"><span>${metaIcon('period')}<span class="meta-label">교육기간</span><b>${esc(x.period)}</b></span><span>${metaIcon('time')}<span class="meta-label">교육시간</span><b>${esc(x.time||'상담 문의')}</b></span><span>${metaIcon('support')}<span class="meta-label">지원구분</span><b>${esc(x.support||'상담 문의')}</b></span></dl><div class="course-tags">${x.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div><footer class="course-footer"><div class="course-price"><small>수강료</small><strong>${esc(x.tuition)}</strong></div><a class="btn btn-outline" href="course-detail.html?id=${encodeURIComponent(x.id)}">과정 상세</a></footer></article>`).join('')+`<div id="courseEmpty" class="card content-card" ${filtered.length?'hidden':''} style="grid-column:1/-1">등록된 과정이 없습니다.</div>`;
  }
  async function load(){
    try{
      const rows=await api.queryCourses(pageType); courses=rows.map(r=>{const c=pickCohort(r.course_cohorts),s=status(c);return{id:r.id,slug:r.slug,title:r.title,category:r.course_categories?.name||'과정',description:r.short_description||r.description||r.lead||'',status:s,period:c?.course_start_date&&c?.course_end_date?`${fmtDate(c.course_start_date)} ~ ${fmtDate(c.course_end_date)}`:'상담 문의',time:c?.class_start_time&&c?.class_end_time?`${fmtTime(c.class_start_time)} ~ ${fmtTime(c.class_end_time)}`:'상담 문의',support:c?.support_description||'상담 문의',tuition:c?Number(c.tuition_amount||0).toLocaleString('ko-KR')+'원':'상담 문의',tags:(r.course_tags||[]).map(x=>x.tags?.name).filter(Boolean)};});
      const cats=[...new Set(courses.map(x=>x.category))];const f=document.querySelector('#categoryFilter');if(f)f.innerHTML='<option value="">전체 분야</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      const metrics=document.querySelectorAll('.course-summary-card .metric');if(metrics[0])metrics[0].textContent=String(courses.length);if(metrics[1])metrics[1].textContent=String(cats.length);render();
    }catch(e){console.error('[SANGA] course list',e);listEl.innerHTML='<div class="card content-card" style="grid-column:1/-1">과정 정보를 불러오지 못했습니다.</div>';}
  }
  document.querySelector('#categoryFilter')?.addEventListener('change',render);document.querySelector('#courseSearch')?.addEventListener('input',render);load();
})();
