(function () {
  "use strict";

  const auth = window.SangaAdminAuth;
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];
  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const state = { page: Object.create(null), data: Object.create(null) };
  const PAGE_SIZE = 8;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmtDate = (v) => v ? String(v).slice(0,10).replaceAll('-','.') : '-';
  const fmtDateTime = (v) => v ? new Date(v).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-';
  const money = (v) => Number(v || 0).toLocaleString('ko-KR') + '원';
  const statusMap = { waiting:'대기', consulting:'상담중', completed:'완료', cancelled:'취소', published:'게시', draft:'임시저장' };

  function toast(msg) {
    const el=qs('#adminToast'); if(!el) return;
    el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200);
  }
  function errorToast(e) { console.error('[SANGA ADMIN]', e); toast(e?.message || '처리 중 오류가 발생했습니다.'); }
  function openModal(id){ qs(id)?.classList.add('open'); }
  function closeModal(id){ qs(id)?.classList.remove('open'); }
  function initSidebar(){ qs('#adminMobileToggle')?.addEventListener('click',()=>qs('#adminSidebar')?.classList.toggle('open')); }
  function badge(text, kind='') { return `<span class="badge ${kind}">${esc(text)}</span>`; }

  function pagination(key, total, render) {
    const bodyMap={courses:'#courseTableBody',notices:'#noticeTableBody',jobs:'#jobTableBody',history:'#historyTableBody',inquiries:'#inquiryTableBody'};
    const body=qs(bodyMap[key]); if(!body) return;
    let host=body.closest('.table-wrap')?.nextElementSibling;
    if(!host || !host.classList.contains('pagination')) {
      host=document.createElement('nav'); host.className='pagination'; body.closest('.table-wrap')?.insertAdjacentElement('afterend',host);
    }
    const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    state.page[key]=Math.min(Math.max(state.page[key]||1,1),pages);
    const cur=state.page[key];
    const nums=[]; for(let i=1;i<=pages;i++) if(pages<=7 || i===1 || i===pages || Math.abs(i-cur)<=1) nums.push(i); else if(nums[nums.length-1]!=='…') nums.push('…');
    host.innerHTML=`<button type="button" data-p="${cur-1}" ${cur===1?'disabled':''}>‹</button>${nums.map(n=>n==='…'?'<span>…</span>':`<button type="button" data-p="${n}" class="${n===cur?'active':''}">${n}</button>`).join('')}<button type="button" data-p="${cur+1}" ${cur===pages?'disabled':''}>›</button><small>총 ${total}건 · ${cur}/${pages} 페이지</small>`;
    qsa('button[data-p]',host).forEach(btn=>btn.addEventListener('click',()=>{state.page[key]=Number(btn.dataset.p); render();}));
  }
  function pageSlice(key,list){ const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE)); const p=Math.min(Math.max(state.page[key]||1,1),pages); state.page[key]=p; return list.slice((p-1)*PAGE_SIZE,p*PAGE_SIZE); }
  function decorate(){ qsa('.admin-table:not(.dashboard-table)').forEach(table=>{const labels=qsa('thead th',table).map(x=>x.textContent.trim());qsa('tbody tr',table).forEach(tr=>qsa('td',tr).forEach((td,i)=>{if(!td.hasAttribute('colspan')) td.dataset.label=labels[i]||'항목';}));}); }

  function recruitmentStatus(c) {
    if(!c) return '준비중';
    if(c.operation_status==='cancelled') return '마감';
    if(c.recruitment_type==='rolling') return '상시접수';
    const t=new Date(); t.setHours(0,0,0,0);
    const s=c.application_start_date?new Date(c.application_start_date+'T00:00:00'):null;
    const e=c.application_end_date?new Date(c.application_end_date+'T00:00:00'):null;
    if(s && t<s) return '준비중'; if(e && t>e) return '마감'; if(s&&e) return '모집중'; return '준비중';
  }

  async function api(action,payload={}) { return auth.api(action,payload); }

  // ---------------- Dashboard ----------------
  async function initDashboard(){
    try{
      const d=await api('dashboard');
      qs('#courseCount').textContent=d.counts.courses; qs('#noticeCount').textContent=d.counts.notices; qs('#jobCount').textContent=d.counts.jobs; qs('#inquiryCount').textContent=d.counts.inquiries;
      qs('#recentCourses').innerHTML=(d.recent_courses||[]).map(x=>`<tr><td><strong>${esc(x.title)}</strong></td><td>${esc(x.category)}</td><td>${badge(x.is_published?'공개':'비공개',x.is_published?'badge-open':'badge-draft')}</td></tr>`).join('')||'<tr><td colspan="3">등록된 과정이 없습니다.</td></tr>';
      qs('#recentInquiries').innerHTML=(d.recent_inquiries||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.course_interest||'-')}</td><td>${badge(statusMap[x.status]||x.status)}</td></tr>`).join('')||'<tr><td colspan="3">상담신청이 없습니다.</td></tr>';
    }catch(e){errorToast(e);}
  }

  // ---------------- Course editor repeaters ----------------
  const rep={heroPoints:'#heroPointsEditor',outcomes:'#outcomesEditor',curriculum:'#curriculumEditor',targets:'#targetsEditor',benefits:'#benefitsEditor',faqs:'#faqsEditor'};
  function repTpl(kind,v){
    if(kind==='heroPoints'||kind==='targets') return `<div class="repeater-item repeater-simple" data-repeater-item="${kind}"><div class="form-field repeater-grow"><label>${kind==='heroPoints'?'핵심 포인트':'추천 대상'}</label><input data-field="value" value="${esc(v||'')}"></div><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div>`;
    if(kind==='outcomes'){const [n='',t='',d='']=v||[];return `<div class="repeater-item" data-repeater-item="outcomes"><div class="repeater-item-head"><strong>핵심 역량</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div><div class="form-grid repeater-fields"><div class="form-field"><label>번호</label><input data-field="num" value="${esc(n)}"></div><div class="form-field"><label>역량 제목</label><input data-field="title" value="${esc(t)}"></div><div class="form-field full"><label>설명</label><textarea data-field="text" rows="3">${esc(d)}</textarea></div></div></div>`;}
    if(kind==='curriculum'){const [step='',t='',items=[]]=v||[];return `<div class="repeater-item" data-repeater-item="curriculum"><div class="repeater-item-head"><strong>커리큘럼 단계</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div><div class="form-grid repeater-fields"><div class="form-field"><label>단계명</label><input data-field="step" value="${esc(step)}"></div><div class="form-field"><label>단계 제목</label><input data-field="title" value="${esc(t)}"></div><div class="form-field full"><label>세부 학습내용</label><textarea data-field="items" rows="5">${esc((items||[]).join('\n'))}</textarea></div></div></div>`;}
    if(kind==='benefits'){const [t='',d='']=v||[];return `<div class="repeater-item" data-repeater-item="benefits"><div class="repeater-item-head"><strong>수강 혜택</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div><div class="form-grid repeater-fields"><div class="form-field full"><label>혜택 제목</label><input data-field="title" value="${esc(t)}"></div><div class="form-field full"><label>설명</label><textarea data-field="text" rows="3">${esc(d)}</textarea></div></div></div>`;}
    if(kind==='faqs'){const [q='',a='']=v||[];return `<div class="repeater-item" data-repeater-item="faqs"><div class="repeater-item-head"><strong>FAQ</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div><div class="form-grid repeater-fields"><div class="form-field full"><label>질문</label><input data-field="question" value="${esc(q)}"></div><div class="form-field full"><label>답변</label><textarea data-field="answer" rows="4">${esc(a)}</textarea></div></div></div>`;}
    return '';
  }
  function renderReps(data={}){Object.entries(rep).forEach(([k,sel])=>{const el=qs(sel);if(el)el.innerHTML=(data[k]||[]).map(v=>repTpl(k,v)).join('');});}
  function collectReps(){
    const simple=k=>qsa(`[data-repeater-item="${k}"]`).map(x=>qs('[data-field="value"]',x)?.value.trim()).filter(Boolean);
    return {
      heroPoints:simple('heroPoints'), targets:simple('targets'),
      outcomes:qsa('[data-repeater-item="outcomes"]').map((x,i)=>[qs('[data-field="num"]',x)?.value.trim()||String(i+1).padStart(2,'0'),qs('[data-field="title"]',x)?.value.trim()||'',qs('[data-field="text"]',x)?.value.trim()||'']).filter(x=>x[1]||x[2]),
      curriculum:qsa('[data-repeater-item="curriculum"]').map((x,i)=>[qs('[data-field="step"]',x)?.value.trim()||`STEP ${i+1}`,qs('[data-field="title"]',x)?.value.trim()||'',(qs('[data-field="items"]',x)?.value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean)]).filter(x=>x[1]||x[2].length),
      benefits:qsa('[data-repeater-item="benefits"]').map(x=>[qs('[data-field="title"]',x)?.value.trim()||'',qs('[data-field="text"]',x)?.value.trim()||'']).filter(x=>x[0]||x[1]),
      faqs:qsa('[data-repeater-item="faqs"]').map(x=>[qs('[data-field="question"]',x)?.value.trim()||'',qs('[data-field="answer"]',x)?.value.trim()||'']).filter(x=>x[0]||x[1])
    };
  }

  async function openCourse(id=null){
    const f=qs('#courseForm'); if(!f)return; f.reset(); qs('#courseId').value=id||''; f.dataset.cohortId='';
    renderReps({}); qsa('input[name="weekdays"]',f).forEach(x=>x.checked=false);
    qs('#courseModalTitle').textContent=id?'과정 상세 편집':'새 과정 만들기';
    if(id){
      try{
        const d=await api('course.get',{id}); const c=d.course||{};
        const map={type:c.type_code,category:c.category_name,title:c.title,published:String(c.is_published),cohort_year:c.cohort_year,cohort_number:c.cohort_number,cohort_name:c.cohort_name,recruitment_type:c.recruitment_type,application_start_date:c.application_start_date,application_end_date:c.application_end_date,course_start_date:c.course_start_date,course_end_date:c.course_end_date,class_start_time:(c.class_start_time||'').slice(0,5),class_end_time:(c.class_end_time||'').slice(0,5),capacity:c.capacity,tuition:c.tuition_amount,support:c.support_description,description:c.short_description||c.description,eyebrow:c.eyebrow,badge:c.badge,lead:c.lead,tags:(d.tags||[]).join(',')};
        Object.entries(map).forEach(([k,v])=>{const el=f.elements.namedItem(k);if(el&&!Array.isArray(el))el.value=v??'';});
        f.dataset.cohortId=c.cohort_id||''; f.dataset.courseSlug=c.slug||'';
        qsa('input[name="weekdays"]',f).forEach(x=>x.checked=(d.weekdays||[]).map(Number).includes(Number(x.value)));
        renderReps({heroPoints:d.hero_points||[],outcomes:d.competencies||[],curriculum:d.curriculum||[],targets:d.targets||[],benefits:d.benefits||[],faqs:d.faqs||[]});
      }catch(e){errorToast(e);return;}
    } else {
      f.dataset.courseSlug='';
      const y=new Date().getFullYear(); f.elements.cohort_year.value=y; f.elements.cohort_number.value=1; f.elements.recruitment_type.value='scheduled';
    }
    openModal('#courseModal');
  }

  async function saveCourse(e){
    e.preventDefault(); const f=e.currentTarget; const fd=new FormData(f); const p=Object.fromEntries(fd.entries());
    p.id=qs('#courseId').value||null; p.cohort_id=f.dataset.cohortId||null; p.weekdays=fd.getAll('weekdays').map(Number); p.tags=String(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean); Object.assign(p,collectReps());
    try{await api('course.save',p);closeModal('#courseModal');toast('과정이 저장되었습니다.');await loadCourses();}catch(e){errorToast(e);}
  }

  function renderCourses(){
    const all=state.data.courses||[]; const kw=(qs('#courseSearch')?.value||'').trim().toLowerCase(),type=qs('#courseTypeFilter')?.value||'',st=qs('#courseStatusFilter')?.value||'',pub=qs('#coursePublishFilter')?.value||'';
    const list=all.filter(c=>{const rs=recruitmentStatus(c);return(!type||c.type_code===type)&&(!st||rs===st)&&(!pub||(pub==='published'?c.is_published:!c.is_published))&&(!kw||`${c.title} ${c.category_name} ${c.short_description||''}`.toLowerCase().includes(kw));});
    const rows=pageSlice('courses',list); qs('#courseTableBody').innerHTML=rows.map(c=>{const rs=recruitmentStatus(c);return `<tr><td><span title="${esc(c.id)}">${esc(c.id.slice(0,8))}…</span></td><td>${esc(c.type_name)}</td><td>${esc(c.category_name)}</td><td><strong>${esc(c.title)}</strong>${c.cohort_name?`<div style="font-size:12px;color:#77808d;margin-top:4px">${esc(c.cohort_name)}</div>`:''}</td><td>${badge(rs,rs==='마감'?'badge-closed':'badge-open')}</td><td>${badge(c.is_published?'공개':'비공개',c.is_published?'badge-open':'badge-draft')}</td><td>${fmtDate(c.course_start_date)} ~ ${fmtDate(c.course_end_date)}</td><td><div class="row-actions"><button class="btn btn-outline" data-edit-course="${c.id}">상세편집</button><a class="btn btn-green" href="../course-detail.html?id=${encodeURIComponent(c.id)}${c.is_published?'':'&preview=1'}" target="_blank">미리보기</a><button class="btn btn-danger" data-del-course="${c.id}">삭제</button></div></td></tr>`;}).join('')||'<tr><td colspan="8"><div class="empty-state">등록된 과정이 없습니다.</div></td></tr>';
    pagination('courses',list.length,renderCourses);decorate();qsa('[data-edit-course]').forEach(b=>b.onclick=()=>openCourse(b.dataset.editCourse));qsa('[data-del-course]').forEach(b=>b.onclick=async()=>{if(confirm('이 과정을 삭제할까요?')){try{await api('course.delete',{id:b.dataset.delCourse});toast('삭제했습니다.');loadCourses();}catch(e){errorToast(e);}}});
  }
  async function loadCourses(){try{state.data.courses=await api('courses.list');renderCourses();}catch(e){errorToast(e);}}
  function initCourses(){
    qs('#addCourseBtn')?.addEventListener('click',()=>openCourse()); qs('#courseModalClose')?.addEventListener('click',()=>closeModal('#courseModal')); qs('#courseModalClose2')?.addEventListener('click',()=>closeModal('#courseModal')); qs('#courseForm')?.addEventListener('submit',saveCourse);
    qs('#coursePreviewBtn')?.addEventListener('click',()=>{ const id=qs('#courseId')?.value; const slug=qs('#courseForm')?.dataset.courseSlug||''; if(!id){toast('과정을 먼저 저장해 주세요.');return;} const key=`id=${encodeURIComponent(id)}`; window.open(`../course-detail.html?${key}&preview=1`,'_blank','noopener'); });
    qsa('[data-add-repeater]').forEach(b=>b.addEventListener('click',()=>qs(rep[b.dataset.addRepeater])?.insertAdjacentHTML('beforeend',repTpl(b.dataset.addRepeater,null)))); document.addEventListener('click',e=>{const b=e.target.closest('[data-remove-repeater]');if(b)b.closest('[data-repeater-item]')?.remove();});
    ['#courseSearch','#courseTypeFilter','#courseStatusFilter','#coursePublishFilter'].forEach(sel=>qs(sel)?.addEventListener(sel==='#courseSearch'?'input':'change',()=>{state.page.courses=1;renderCourses();})); qs('[data-reset-filters="courses"]')?.addEventListener('click',()=>{['#courseTypeFilter','#courseStatusFilter','#coursePublishFilter','#courseSearch'].forEach(x=>{const el=qs(x);if(el)el.value='';});state.page.courses=1;renderCourses();}); loadCourses();
  }

  // ---------------- Generic CRUD pages ----------------
  function setupCrud(cfg){
    async function load(){try{state.data[cfg.key]=await api(cfg.listAction);render();}catch(e){errorToast(e);}}
    function filtered(){const arr=state.data[cfg.key]||[];return cfg.filter?arr.filter(cfg.filter):arr;}
    function render(){const list=filtered();qs(cfg.body).innerHTML=pageSlice(cfg.key,list).map(cfg.row).join('')||`<tr><td colspan="${cfg.cols}"><div class="empty-state">등록된 데이터가 없습니다.</div></td></tr>`;pagination(cfg.key,list.length,render);decorate();qsa(`[data-edit-${cfg.key}]`).forEach(b=>b.onclick=()=>edit(b.dataset[`edit${cap(cfg.key)}`]||b.getAttribute(`data-edit-${cfg.key}`)));qsa(`[data-del-${cfg.key}]`).forEach(b=>b.onclick=()=>del(b.getAttribute(`data-del-${cfg.key}`)));}
    function edit(id){const item=(state.data[cfg.key]||[]).find(x=>String(x.id)===String(id));if(!item)return;const f=qs(cfg.form);f.reset();Object.entries(cfg.toForm(item)).forEach(([k,v])=>{const el=f.elements.namedItem(k);if(el)el.value=v??'';});openModal(cfg.modal);}
    async function del(id){if(!confirm('삭제할까요?'))return;try{await api(cfg.deleteAction,{id});toast('삭제했습니다.');load();}catch(e){errorToast(e);}}
    qs(cfg.add)?.addEventListener('click',()=>{const f=qs(cfg.form);f.reset();f.elements.id.value='';if(f.elements.date)f.elements.date.value=new Date().toISOString().slice(0,10);openModal(cfg.modal);});
    qs(cfg.form)?.addEventListener('submit',async e=>{e.preventDefault();try{await api(cfg.saveAction,Object.fromEntries(new FormData(e.currentTarget).entries()));closeModal(cfg.modal);toast('저장했습니다.');load();}catch(err){errorToast(err);}});
    qsa(`[data-close="${cfg.modal.slice(1)}"]`).forEach(b=>b.onclick=()=>closeModal(cfg.modal));
    (cfg.controls||[]).forEach(([sel,ev])=>qs(sel)?.addEventListener(ev,()=>{state.page[cfg.key]=1;render();}));qs(`[data-reset-filters="${cfg.key}"]`)?.addEventListener('click',()=>{(cfg.controls||[]).forEach(([sel])=>{const el=qs(sel);if(el)el.value='';});state.page[cfg.key]=1;render();});load();
  }
  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

  function initNotices(){setupCrud({key:'notices',body:'#noticeTableBody',cols:6,listAction:'notices.list',saveAction:'notice.save',deleteAction:'notice.delete',add:'#addNoticeBtn',form:'#noticeForm',modal:'#noticeModal',controls:[['#noticeStatusFilter','change'],['#noticeSearch','input']],filter:x=>{const st=qs('#noticeStatusFilter')?.value||'',kw=(qs('#noticeSearch')?.value||'').toLowerCase();return(!st||(st==='게시'?x.status==='published':x.status==='draft'))&&(!kw||`${x.title} ${x.content}`.toLowerCase().includes(kw));},row:x=>`<tr><td>${x.id}</td><td><strong>${esc(x.title)}</strong></td><td>${badge(statusMap[x.status]||x.status,x.status==='published'?'badge-open':'badge-draft')}</td><td>${fmtDate(x.published_on)}</td><td>${x.view_count}</td><td><div class="row-actions"><button class="btn btn-outline" data-edit-notices="${x.id}">수정</button><button class="btn btn-danger" data-del-notices="${x.id}">삭제</button></div></td></tr>`,toForm:x=>({id:x.id,title:x.title,status:x.status==='published'?'게시':'임시저장',date:x.published_on,content:x.content,views:x.view_count})});}
  function initJobs(){setupCrud({key:'jobs',body:'#jobTableBody',cols:6,listAction:'jobs.list',saveAction:'job.save',deleteAction:'job.delete',add:'#addJobBtn',form:'#jobForm',modal:'#jobModal',controls:[['#jobStatusFilter','change'],['#jobCategoryFilter','input'],['#jobSearch','input']],filter:x=>{const st=qs('#jobStatusFilter')?.value||'',cat=(qs('#jobCategoryFilter')?.value||'').toLowerCase(),kw=(qs('#jobSearch')?.value||'').toLowerCase();return(!st||(st==='게시'?x.status==='published':x.status==='draft'))&&(!cat||x.category.toLowerCase().includes(cat))&&(!kw||`${x.title} ${x.company}`.toLowerCase().includes(kw));},row:x=>`<tr><td>${x.id}</td><td>${esc(x.category)}</td><td><strong>${esc(x.title)}</strong></td><td>${esc(x.company)}</td><td>${fmtDate(x.published_on)}</td><td><div class="row-actions"><button class="btn btn-outline" data-edit-jobs="${x.id}">수정</button><button class="btn btn-danger" data-del-jobs="${x.id}">삭제</button></div></td></tr>`,toForm:x=>({id:x.id,category:x.category,company:x.company,title:x.title,status:x.status==='published'?'게시':'임시저장',date:x.published_on})});}
  function initHistoryEditorUX(){
    const modal=qs('#historyModal'),form=qs('#historyForm'); if(!modal||!form)return;
    const year=form.elements.namedItem('year'),tag=form.elements.namedItem('tag'),title=form.elements.namedItem('title'),desc=form.elements.namedItem('description'),id=form.elements.namedItem('id');
    const py=qs('#historyPreviewYear'),pt=qs('#historyPreviewTag'),ph=qs('#historyPreviewTitle'),pd=qs('#historyPreviewDescription'),count=qs('#historyDescriptionCount'),modalTitle=qs('#historyModalTitle');
    const sync=()=>{
      if(py)py.textContent=year?.value.trim()||String(new Date().getFullYear());
      if(pt)pt.textContent=(tag?.value.trim()||'HISTORY').toUpperCase();
      if(ph)ph.textContent=title?.value.trim()||'연혁 제목';
      if(pd)pd.textContent=desc?.value.trim()||'설명을 입력하면 이곳에서 미리 확인할 수 있습니다.';
      if(count)count.textContent=`${(desc?.value||'').length}자`;
      if(modalTitle)modalTitle.textContent=id?.value?'학원 연혁 수정':'학원 연혁 추가';
    };
    [year,tag,title,desc].forEach(el=>el?.addEventListener('input',sync));
    qsa('[data-history-year]',modal).forEach(b=>b.addEventListener('click',()=>{year.value=b.dataset.historyYear||'';year.dispatchEvent(new Event('input',{bubbles:true}));year.focus();}));
    qsa('[data-history-tag]',modal).forEach(b=>b.addEventListener('click',()=>{tag.value=b.dataset.historyTag||'';tag.dispatchEvent(new Event('input',{bubbles:true}));tag.focus();}));
    const observer=new MutationObserver(()=>{if(modal.classList.contains('open'))requestAnimationFrame(sync);});
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest('[data-edit-history]')||e.target.closest('#addHistoryBtn'))setTimeout(sync,0);});
    sync();
  }

  function initHistory(){
    setupCrud({key:'history',body:'#historyTableBody',cols:5,listAction:'history.list',saveAction:'history.save',deleteAction:'history.delete',add:'#addHistoryBtn',form:'#historyForm',modal:'#historyModal',controls:[['#historyYearFilter','input'],['#historySearch','input']],filter:x=>{const yr=(qs('#historyYearFilter')?.value||'').toLowerCase(),kw=(qs('#historySearch')?.value||'').toLowerCase();return(!yr||x.year_label.toLowerCase().includes(yr))&&(!kw||`${x.tag||''} ${x.title} ${x.description}`.toLowerCase().includes(kw));},row:x=>`<tr><td>${x.id}</td><td><strong>${esc(x.year_label)}</strong></td><td>${esc(x.tag||'-')}</td><td>${esc(x.title)}</td><td><div class="row-actions"><button class="btn btn-outline" data-edit-history="${x.id}">수정</button><button class="btn btn-danger" data-del-history="${x.id}">삭제</button></div></td></tr>`,toForm:x=>({id:x.id,year:x.year_label,tag:x.tag,title:x.title,description:x.description})});
    initHistoryEditorUX();
  }

  async function initInquiries(){
    async function load(){try{state.data.inquiries=await api('inquiries.list');render();}catch(e){errorToast(e);}}
    function render(){const st=qs('#inquiryStatusFilter')?.value||'',kw=(qs('#inquirySearch')?.value||'').toLowerCase();const list=(state.data.inquiries||[]).filter(x=>(!st||(statusMap[x.status]||x.status)===st)&&(!kw||`${x.name} ${x.phone} ${x.course_interest||''} ${x.message||''} ${x.consultation_note||''}`.toLowerCase().includes(kw)));qs('#inquiryTableBody').innerHTML=pageSlice('inquiries',list).map(x=>`<tr><td>${esc(x.id.slice(0,8))}…</td><td><strong>${esc(x.name)}</strong><div>${esc(x.phone)}</div></td><td>${esc(x.course_interest||'-')}</td><td>${esc(x.message||'-')}</td><td>${esc(x.consultation_note||'-')}</td><td>${fmtDateTime(x.created_at)}</td><td>${badge(statusMap[x.status]||x.status)}</td><td><button class="btn btn-outline" data-consult="${x.id}">상담관리</button></td></tr>`).join('')||'<tr><td colspan="8"><div class="empty-state">상담신청이 없습니다.</div></td></tr>';pagination('inquiries',list.length,render);decorate();qsa('[data-consult]').forEach(b=>b.onclick=()=>openConsult(b.dataset.consult));}
    function openConsult(id){const x=(state.data.inquiries||[]).find(v=>v.id===id);if(!x)return;qs('#consultationInquiryId').value=id;qs('#consultationMessage').textContent=x.message||'-';qs('#consultationNoteField').value=x.consultation_note||'';qsa('input[name="consultationStatus"]').forEach(r=>r.checked=r.value===(statusMap[x.status]||x.status));qs('#consultationSummary').innerHTML=`<strong>${esc(x.name)}</strong> · ${esc(x.phone)} · ${esc(x.course_interest||'-')}`;openModal('#consultationModal');}
    qs('#consultationForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=qs('#consultationInquiryId').value,status=qs('input[name="consultationStatus"]:checked')?.value||'대기',consultation_note=qs('#consultationNoteField').value;try{await api('inquiry.update',{id,status,consultation_note});closeModal('#consultationModal');toast('상담 기록을 저장했습니다.');load();}catch(err){errorToast(err);}});
    qs('#consultationModalClose')?.addEventListener('click',()=>closeModal('#consultationModal'));qs('#consultationCancelBtn')?.addEventListener('click',()=>closeModal('#consultationModal'));qs('#inquiryStatusFilter')?.addEventListener('change',()=>{state.page.inquiries=1;render();});qs('#inquirySearch')?.addEventListener('input',()=>{state.page.inquiries=1;render();});qs('[data-reset-filters="inquiries"]')?.addEventListener('click',()=>{if(qs('#inquiryStatusFilter'))qs('#inquiryStatusFilter').value='';if(qs('#inquirySearch'))qs('#inquirySearch').value='';state.page.inquiries=1;render();});load();
  }

  document.addEventListener('sanga:admin-ready',function(){
    initSidebar();
    if(page==='index.html') initDashboard();
    if(page==='courses.html') initCourses();
    if(page==='notices.html') initNotices();
    if(page==='jobs.html') initJobs();
    if(page==='history.html') initHistory();
    if(page==='inquiries.html') initInquiries();
  },{once:true});
})();
