(function(){
  "use strict";
  const cfg=window.SANGA_SUPABASE_CONFIG||{};
  let client=null;

  function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey)return null;
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  function needClient(){
    const c=getClient();
    if(!c) throw new Error('Supabase 연결정보가 없습니다. assets/supabase-config.js를 확인해 주세요.');
    return c;
  }

  async function rpcJson(name,args={}){
    const c=needClient();
    const {data,error}=await c.rpc(name,args);
    if(error) throw error;
    return data;
  }

  async function queryCourses(typeCode){
    const data=await rpcJson('public_courses_feed',{p_type_code:typeCode||null});
    return Array.isArray(data)?data:[];
  }

  async function getCourseDetail(key,{preview=false}={}){
    const c=needClient();
    const raw=String(key||'').trim();
    const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);

    // Public detail is UUID-first. UUID is the canonical DB identifier and avoids
    // slug encoding/cache mismatches between list and detail pages.
    let courseId=isUuid?raw:null;
    if(!courseId&&raw){
      const rows=await queryCourses();
      const found=rows.find(x=>x.slug===raw||x.id===raw);
      courseId=found?.id||null;
    }

    if(courseId){
      // Primary path: UUID-specific RPC.
      // If the database function is missing/stale in PostgREST's schema cache,
      // fall back to the original text RPC, which accepts both UUID text and slug.
      try{
        const {data,error}=await c.rpc('public_course_detail_v2',{p_course_id:courseId});
        if(!error && data) return data;
        if(error) console.warn('[SANGA] public_course_detail_v2 fallback', error);
      }catch(err){
        console.warn('[SANGA] public_course_detail_v2 fallback', err);
      }

      const {data:fallbackData,error:fallbackError}=await c.rpc('public_course_detail',{p_key:courseId});
      if(fallbackError) throw fallbackError;
      if(fallbackData) return fallbackData;
    }

    // Slug fallback for old links/bookmarks.
    if(raw && !courseId){
      const {data:fallbackData,error:fallbackError}=await c.rpc('public_course_detail',{p_key:raw});
      if(fallbackError) throw fallbackError;
      if(fallbackData) return fallbackData;
    }

    // Admin preview: unpublished course may be viewed only with an admin session token.
    if(preview&&courseId){
      let sess=null;
      try{sess=JSON.parse(sessionStorage.getItem('sanga_admin_session_v1')||localStorage.getItem('sanga_admin_session_v1')||'null');}catch{}
      if(sess?.token){
        const {data:rpcData,error:rpcError}=await c.rpc('admin_api',{p_token:sess.token,p_action:'course.get',p_payload:{id:courseId}});
        if(rpcError)throw rpcError;
        if(rpcData?.ok){
          const d=rpcData.data||{},x=d.course||{};
          return {
            ...x,
            course_types:{code:x.type_code,name:x.type_name},
            course_categories:{name:x.category_name},
            course_cohorts:x.cohort_id?[x]:[],
            course_tags:(d.tags||[]).map(name=>({tags:{name}})),
            course_hero_points:(d.hero_points||[]).map((content,i)=>({content,sort_order:i+1})),
            course_competencies:(d.competencies||[]).map((a,i)=>({title:a[1],description:a[2],sort_order:i+1})),
            course_curriculum_sections:(d.curriculum||[]).map((a,i)=>({title:a[1],sort_order:i+1,course_curriculum_items:(a[2]||[]).map((content,j)=>({content,sort_order:j+1}))})),
            course_targets:(d.targets||[]).map((content,i)=>({content,sort_order:i+1})),
            course_benefits:(d.benefits||[]).map((a,i)=>({title:a[0],description:a[1],sort_order:i+1})),
            course_faqs:(d.faqs||[]).map((a,i)=>({question:a[0],answer:a[1],sort_order:i+1}))
          };
        }
      }
    }
    return null;
  }

  async function submitInquiry(payload){
    const c=needClient();
    const {data,error}=await c.rpc('submit_inquiry',{p_name:payload.name,p_phone:payload.phone,p_course_interest:payload.course,p_message:payload.message||null});
    if(error)throw error;
    return data;
  }

  async function loadNotices(limit){
    const data=await rpcJson('public_notices_feed',{p_limit:limit||null});
    return Array.isArray(data)?data:[];
  }

  async function loadJobs(limit){
    const data=await rpcJson('public_jobs_feed',{p_limit:limit||null});
    return Array.isArray(data)?data:[];
  }

  async function loadHistory(){
    const data=await rpcJson('public_history_feed',{});
    return Array.isArray(data)?data:[];
  }

  window.SangaPublicData={getClient,queryCourses,getCourseDetail,submitInquiry,loadNotices,loadJobs,loadHistory};
})();
