(function () {
  'use strict';

  const state = { select: null, popover: null, record: null, uid: 0 };
  const records = new Set();
  const pad = n => String(n).padStart(2, '0');

  function emit(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function placePopover(anchor, popover, preferredWidth) {
    const rect = anchor.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const margin = 12;
    const width = Math.min(preferredWidth || Math.max(rect.width, 240), vw - margin * 2);
    popover.style.width = width + 'px';
    popover.style.left = Math.max(margin, Math.min(rect.left, vw - width - margin)) + 'px';
    popover.style.top = rect.bottom + 8 + 'px';
    popover.style.bottom = 'auto';
    requestAnimationFrame(() => {
      const h = popover.getBoundingClientRect().height;
      if (rect.bottom + 8 + h > vh - margin && rect.top > h + margin) {
        popover.style.top = 'auto';
        popover.style.bottom = (vh - rect.top + 8) + 'px';
        popover.dataset.side = 'top';
      } else {
        popover.dataset.side = 'bottom';
      }
    });
  }

  function closeActive(focusBack) {
    if (!state.popover) return;
    const anchor = state.record?.trigger || state.record?.wrap;
    state.popover.classList.remove('is-open');
    state.popover.setAttribute('aria-hidden', 'true');
    state.record?.wrap?.classList.remove('is-open');
    state.record?.trigger?.setAttribute?.('aria-expanded', 'false');
    if (focusBack) state.record?.trigger?.focus?.();
    state.popover = null;
    state.record = null;
    state.select = null;
  }

  function openPopover(record, popover, width) {
    if (state.popover && state.popover !== popover) closeActive(false);
    state.record = record;
    state.popover = popover;
    record.wrap.classList.add('is-open');
    record.trigger?.setAttribute?.('aria-expanded', 'true');
    popover.classList.add('is-open');
    popover.setAttribute('aria-hidden', 'false');
    placePopover(record.trigger || record.wrap, popover, width);
  }

  // ---------- Custom select ----------
  function enhanceSelect(select) {
    if (!select || select.dataset.adminControlReady || select.multiple || select.size > 1 || select.closest('.admin-control-popover')) return;
    select.dataset.adminControlReady = 'select';
    select.classList.add('custom-select-source');

    const wrap = document.createElement('div');
    wrap.className = 'custom-select admin-control-select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || '선택');
    const value = document.createElement('span');
    value.className = 'custom-select-value';
    trigger.appendChild(value);
    wrap.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu admin-control-popover';
    menu.id = 'admin-select-' + (++state.uid);
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-controls', menu.id);
    document.body.appendChild(menu);

    const record = { type: 'select', select, wrap, trigger, value, menu, sync: null };
    records.add(record);

    function build() {
      menu.innerHTML = '';
      [...select.options].forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'custom-select-option';
        btn.setAttribute('role', 'option');
        btn.dataset.index = String(index);
        btn.textContent = opt.textContent;
        btn.disabled = opt.disabled;
        btn.addEventListener('click', () => {
          if (select.selectedIndex !== index) {
            select.selectedIndex = index;
            emit(select);
          }
          sync();
          closeActive(true);
        });
        menu.appendChild(btn);
      });
    }

    function sync() {
      const opt = select.options[select.selectedIndex] || select.options[0];
      value.textContent = opt ? opt.textContent : '선택';
      [...menu.querySelectorAll('.custom-select-option')].forEach((btn, index) => {
        btn.setAttribute('aria-selected', String(index === select.selectedIndex));
      });
      trigger.disabled = select.disabled;
    }
    record.sync = sync;
    build(); sync();

    trigger.addEventListener('click', () => {
      if (state.popover === menu) return closeActive(false);
      build(); sync();
      openPopover(record, menu, Math.max(trigger.getBoundingClientRect().width, 180));
    });
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeActive(true); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        let next = select.selectedIndex;
        do { next += dir; } while (select.options[next]?.disabled);
        if (next >= 0 && next < select.options.length) {
          select.selectedIndex = next;
          emit(select); sync();
        }
      }
      if ((e.key === 'Enter' || e.key === ' ') && state.popover !== menu) { e.preventDefault(); trigger.click(); }
    });
    select.addEventListener('change', sync);
  }

  // ---------- Custom date picker ----------
  function parseDate(raw) {
    const v = String(raw || '').trim().replace(/[./]/g, '-');
    if (!v) return '';
    let y, m, d;
    if (/^\d{8}$/.test(v)) { y = +v.slice(0,4); m = +v.slice(4,6); d = +v.slice(6,8); }
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) [y,m,d] = v.split('-').map(Number);
    else return null;
    const dt = new Date(y, m - 1, d);
    if (y < 1900 || y > 2500 || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function dateFromIso(v) { const p = parseDate(v); if (!p) return null; const [y,m,d] = p.split('-').map(Number); return new Date(y,m-1,d); }

  function enhanceDate(source) {
    if (!source || source.dataset.adminControlReady) return;
    source.dataset.adminControlReady = 'date';
    const wasRequired = source.required;
    source.required = false;
    source.type = 'hidden';
    source.classList.add('admin-control-source');

    const wrap = document.createElement('div');
    wrap.className = 'modern-date-picker admin-control-date';
    source.parentNode.insertBefore(wrap, source);
    wrap.appendChild(source);

    const shell = document.createElement('div');
    shell.className = 'modern-date-input-wrap';
    const display = document.createElement('input');
    display.type = 'text';
    display.className = 'modern-date-input';
    display.inputMode = 'numeric';
    display.autocomplete = 'off';
    display.placeholder = 'YYYY-MM-DD';
    display.required = wasRequired;
    display.setAttribute('aria-label', source.getAttribute('aria-label') || source.closest('.form-field')?.querySelector('label')?.textContent || '날짜');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'modern-date-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="modern-date-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none"><path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    shell.append(display, trigger); wrap.appendChild(shell);

    const pop = document.createElement('div');
    pop.className = 'modern-calendar admin-control-popover admin-calendar-v9';
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pop);

    let view = dateFromIso(source.value) || new Date();
    const record = { type:'date', source, wrap, trigger, display, pop, sync:null };
    records.add(record);

    function commit(value, close) {
      source.value = value || '';
      display.value = value || '';
      wrap.classList.remove('has-date-error');
      emit(source);
      if (close) closeActive(true);
    }
    function sync() { display.value = source.value || ''; wrap.classList.toggle('has-value', !!source.value); }
    record.sync = sync;

    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const selected = dateFromIso(source.value), today = new Date();
      const firstDay = new Date(y,m,1).getDay();
      const days = new Date(y,m+1,0).getDate();
      const prevDays = new Date(y,m,0).getDate();
      const cells = [];
      for (let i=firstDay-1;i>=0;i--) cells.push({d:new Date(y,m-1,prevDays-i), muted:true});
      for (let d=1;d<=days;d++) cells.push({d:new Date(y,m,d), muted:false});
      let n=1; while(cells.length<42) cells.push({d:new Date(y,m+1,n++), muted:true});
      pop.innerHTML = `
        <div class="modern-calendar-head admin-calendar-head-v9">
          <button type="button" class="calendar-nav" data-prev aria-label="이전 달">‹</button>
          <button type="button" class="admin-calendar-title-v9" tabindex="-1">${y}년 ${m+1}월</button>
          <button type="button" class="calendar-nav" data-next aria-label="다음 달">›</button>
        </div>
        <div class="calendar-weekdays">${['일','월','화','수','목','금','토'].map((x,i)=>`<span class="${i===0?'is-sunday':i===6?'is-saturday':''}">${x}</span>`).join('')}</div>
        <div class="calendar-days">${cells.map(({d,muted})=>{
          const iso=isoDate(d), sel=selected&&iso===isoDate(selected), isToday=iso===isoDate(today), dow=d.getDay();
          return `<button type="button" class="calendar-day${muted?' is-muted':''}${sel?' is-selected':''}${isToday?' is-today':''}${dow===0?' is-sunday':dow===6?' is-saturday':''}" data-date="${iso}">${d.getDate()}</button>`;
        }).join('')}</div>
        <div class="modern-calendar-foot">
          <button type="button" class="calendar-text-btn" data-clear>지우기</button>
          <button type="button" class="calendar-today-btn" data-today>오늘</button>
        </div>`;
      pop.querySelector('[data-prev]').onclick=()=>{view=new Date(y,m-1,1);render();placePopover(trigger,pop,332);};
      pop.querySelector('[data-next]').onclick=()=>{view=new Date(y,m+1,1);render();placePopover(trigger,pop,332);};
      pop.querySelector('[data-clear]').onclick=()=>commit('',true);
      pop.querySelector('[data-today]').onclick=()=>commit(isoDate(new Date()),true);
      pop.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>commit(b.dataset.date,true));
    }

    function open() {
      view = dateFromIso(source.value) || dateFromIso(display.value) || new Date();
      view = new Date(view.getFullYear(), view.getMonth(), 1);
      render(); openPopover(record,pop,332);
    }
    trigger.addEventListener('click',()=>state.popover===pop?closeActive(false):open());
    display.addEventListener('focus',()=>{ if(!state.popover) open(); });
    display.addEventListener('input',()=>wrap.classList.remove('has-date-error'));
    display.addEventListener('blur',()=>{
      setTimeout(()=>{
        const parsed=parseDate(display.value);
        if(parsed===null){ wrap.classList.add('has-date-error'); display.setCustomValidity('날짜를 YYYY-MM-DD 형식으로 입력해주세요.'); }
        else { display.setCustomValidity(''); if(source.value!==parsed) commit(parsed,false); }
      },120);
    });
    display.addEventListener('keydown',e=>{if(e.key==='Escape'){closeActive(false);display.blur();} if(e.key==='Enter'){const p=parseDate(display.value);if(p!==null){commit(p,true);e.preventDefault();}}});
    source.addEventListener('change',sync); sync();
  }

  // ---------- Custom time picker ----------
  function parseTime(raw) {
    let v = String(raw || '').trim();
    if (!v) return '';
    if (/^\d{3,4}$/.test(v)) v = v.padStart(4,'0').slice(0,2)+':'+v.padStart(4,'0').slice(2);
    const m = v.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h=+m[1], min=+m[2]; if(h>23||min>59) return null;
    return `${pad(h)}:${pad(min)}`;
  }

  function enhanceTime(source) {
    if (!source || source.dataset.adminControlReady) return;
    source.dataset.adminControlReady = 'time';
    const wasRequired=source.required; source.required=false; source.type='hidden'; source.classList.add('admin-control-source');
    const wrap=document.createElement('div'); wrap.className='admin-time-picker'; source.parentNode.insertBefore(wrap,source); wrap.appendChild(source);
    const shell=document.createElement('div'); shell.className='admin-time-input-wrap';
    const display=document.createElement('input'); display.type='text'; display.className='admin-time-input'; display.inputMode='numeric'; display.autocomplete='off'; display.placeholder='HH:MM'; display.required=wasRequired; display.setAttribute('aria-label',source.getAttribute('aria-label')||source.closest('.form-field')?.querySelector('label')?.textContent||'시간');
    const trigger=document.createElement('button'); trigger.type='button'; trigger.className='admin-time-trigger'; trigger.setAttribute('aria-haspopup','dialog'); trigger.setAttribute('aria-expanded','false'); trigger.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    shell.append(display,trigger); wrap.appendChild(shell);
    const pop=document.createElement('div'); pop.className='admin-time-popover admin-control-popover'; pop.setAttribute('aria-hidden','true'); document.body.appendChild(pop);
    const record={type:'time',source,wrap,trigger,display,pop,sync:null}; records.add(record);
    let draft=source.value||'09:00';
    function sync(){display.value=(source.value||'').slice(0,5);wrap.classList.toggle('has-value',!!source.value);}
    record.sync=sync;
    function commit(v,close){source.value=v||'';display.value=v||'';wrap.classList.remove('has-time-error');display.setCustomValidity('');emit(source);if(close)closeActive(true);}
    function render(){
      const current=parseTime(draft)||'09:00'; const [hh,mm]=current.split(':').map(Number);
      const minutes=[0,5,10,15,20,25,30,35,40,45,50,55]; if(!minutes.includes(mm)) minutes.push(mm); minutes.sort((a,b)=>a-b);
      pop.innerHTML=`<div class="admin-time-head"><div><strong>시간 선택</strong><span>${current}</span></div><button type="button" class="admin-time-close" aria-label="닫기">✕</button></div>
        <div class="admin-time-quick">${['09:00','10:00','13:00','14:00','18:00','19:00'].map(v=>`<button type="button" data-quick="${v}" class="${v===current?'is-active':''}">${v}</button>`).join('')}</div>
        <div class="admin-time-columns"><div><span class="admin-time-label">시</span><div class="admin-time-scroll">${Array.from({length:24},(_,h)=>`<button type="button" data-hour="${h}" class="${h===hh?'is-selected':''}">${pad(h)}</button>`).join('')}</div></div><div class="admin-time-colon">:</div><div><span class="admin-time-label">분</span><div class="admin-time-scroll">${minutes.map(m=>`<button type="button" data-minute="${m}" class="${m===mm?'is-selected':''}">${pad(m)}</button>`).join('')}</div></div></div>
        <div class="admin-time-foot"><button type="button" data-clear>지우기</button><button type="button" data-now>현재시간</button><button type="button" class="admin-time-done" data-done>적용</button></div>`;
      pop.querySelector('.admin-time-close').onclick=()=>closeActive(true);
      pop.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{draft=b.dataset.quick;render();placePopover(trigger,pop,320);});
      pop.querySelectorAll('[data-hour]').forEach(b=>b.onclick=()=>{draft=`${pad(+b.dataset.hour)}:${pad(mm)}`;render();placePopover(trigger,pop,320);});
      pop.querySelectorAll('[data-minute]').forEach(b=>b.onclick=()=>{draft=`${pad(hh)}:${pad(+b.dataset.minute)}`;render();placePopover(trigger,pop,320);});
      pop.querySelector('[data-clear]').onclick=()=>commit('',true);
      pop.querySelector('[data-now]').onclick=()=>{const d=new Date();commit(`${pad(d.getHours())}:${pad(d.getMinutes())}`,true);};
      pop.querySelector('[data-done]').onclick=()=>commit(parseTime(draft)||'',true);
      requestAnimationFrame(()=>pop.querySelector('[data-hour].is-selected')?.scrollIntoView({block:'center'}));
    }
    function open(){draft=parseTime(source.value)||parseTime(display.value)||'09:00';render();openPopover(record,pop,320);}
    trigger.addEventListener('click',()=>state.popover===pop?closeActive(false):open());
    display.addEventListener('focus',()=>{if(!state.popover)open();});
    display.addEventListener('blur',()=>setTimeout(()=>{const p=parseTime(display.value);if(p===null){wrap.classList.add('has-time-error');display.setCustomValidity('시간을 HH:MM 형식으로 입력해주세요.');}else{wrap.classList.remove('has-time-error');display.setCustomValidity('');if(source.value!==p)commit(p,false);}},120));
    display.addEventListener('keydown',e=>{if(e.key==='Enter'){const p=parseTime(display.value);if(p!==null){commit(p,true);e.preventDefault();}} if(e.key==='Escape')closeActive(false);});
    source.addEventListener('change',sync); sync();
  }

  function enhanceAll(root=document) {
    root.querySelectorAll?.('select:not([data-native-control])').forEach(enhanceSelect);
    root.querySelectorAll?.('input[type="date"]:not([data-native-control])').forEach(enhanceDate);
    root.querySelectorAll?.('input[type="time"]:not([data-native-control])').forEach(enhanceTime);
  }

  function refresh() { records.forEach(r=>{ try { r.sync?.(); } catch(_){} }); }

  document.addEventListener('click', e => {
    if (state.popover && !state.popover.contains(e.target) && !state.record?.wrap?.contains(e.target)) closeActive(false);
    if (e.target.closest('[data-reset-filters], [data-edit-course], [data-edit-notices], [data-edit-jobs], [data-edit-history], #addCourseBtn, #addNoticeBtn, #addJobBtn, #addHistoryBtn')) setTimeout(refresh, 60);
  }, true);
  window.addEventListener('resize',()=>{if(state.popover)placePopover(state.record.trigger||state.record.wrap,state.popover,state.popover.classList.contains('admin-calendar-v9')?332:320);});
  window.addEventListener('scroll',()=>{if(state.popover)placePopover(state.record.trigger||state.record.wrap,state.popover,state.popover.classList.contains('admin-calendar-v9')?332:320);},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.popover)closeActive(true);});
  document.addEventListener('reset',()=>setTimeout(refresh,0),true);

  const observer=new MutationObserver(muts=>{
    let shouldEnhance=false, shouldRefresh=false;
    for(const m of muts){
      if(m.type==='childList'&&m.addedNodes.length) shouldEnhance=true;
      if(m.type==='attributes'&&m.target.classList?.contains('admin-modal')&&m.target.classList.contains('open')) shouldRefresh=true;
    }
    if(shouldEnhance) enhanceAll(document);
    if(shouldRefresh) setTimeout(refresh,0);
  });

  function init(){ enhanceAll(document); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']}); refresh(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  window.AdminControls={refresh,enhanceAll};
})();
