/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · 세션/수업 관리 (백엔드 전 단계, localStorage) ║
   ║  - 수업(클래스) 개설/조회: localStorage 'vision_classes'   ║
   ║  - 현재 진입 모드: sessionStorage 'vision_session'         ║
   ║    { mode:'free' | 'teach' | 'class', code, name, student }║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const CKEY='vision_classes', MKEY='vision_session';
  const loadC=()=>{ try{ return JSON.parse(localStorage.getItem(CKEY)||'[]'); }catch(e){ return []; } };
  const saveC=(l)=>localStorage.setItem(CKEY, JSON.stringify(l));
  function gencode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }

  window.Session = {
    createClass({name, capacity}){
      const list=loadC(); let code; do{ code=gencode(); }while(list.some(c=>c.code===code));
      const rec={ code, name:(name||'새 수업').trim(), capacity:+capacity||0, createdAt:new Date().toISOString() };
      list.unshift(rec); saveC(list); return rec;
    },
    listClasses(){ return loadC(); },
    getClass(code){ return loadC().find(c=>c.code===(code||'').trim().toUpperCase()); },
    removeClass(code){ saveC(loadC().filter(c=>c.code!==code)); },
    setMode(m){ try{ sessionStorage.setItem(MKEY, JSON.stringify(m)); }catch(e){} },
    getMode(){ try{ return JSON.parse(sessionStorage.getItem(MKEY)||'null'); }catch(e){ return null; } },
    clearMode(){ try{ sessionStorage.removeItem(MKEY); }catch(e){} },
    /* 수업별 제출물 집계 */
    submissionsFor(code){ try{ return JSON.parse(localStorage.getItem('vision_submissions')||'[]').filter(s=>s.classCode===code); }catch(e){ return []; } },
  };
})();
