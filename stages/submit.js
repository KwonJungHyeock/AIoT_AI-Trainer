/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · 모드별 액션 컨트롤러                         ║
   ║   체험(free)  : 이미지 저장(PNG)                          ║
   ║   수업개설(teach): 클래스 미션 생성                       ║
   ║   수업참여(class): 이미지 저장 + 미션 제출(미션 선택)     ║
   ║  사용: 스테이지에서 Submit.init({feature,label,capture,summary}) ║
   ║        + 사이드에 <div id="actionArea"></div> 배치        ║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const KEY='vision_submissions', NAMEKEY='vision_student_name';
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } };
  const saveAll=(l)=>localStorage.setItem(KEY, JSON.stringify(l));
  const esc=(s)=>(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  const modeNow=()=>(window.Session && Session.getMode && Session.getMode()) || {mode:'free'};

  // 모달 스타일
  const css=`
  .sub-ov{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;padding:22px;
    background:rgba(5,6,12,.74);backdrop-filter:blur(6px);font-family:'Pretendard',system-ui,sans-serif;}
  .sub-ov.on{display:flex;}
  .sub-card{position:relative;width:min(460px,100%);max-height:90vh;overflow:auto;background:linear-gradient(180deg,#12162a,#0d1020);
    border-radius:20px;padding:24px;color:#f2f4fb;box-shadow:0 0 0 4px rgba(59,134,255,.14),0 30px 70px rgba(0,0,0,.6);}
  .sub-h{font-size:19px;font-weight:800;margin:0 0 4px;}
  .sub-sub{font-size:12.5px;color:#8b93ad;margin:0 0 16px;line-height:1.5;}
  .sub-sub b{color:#cfe0ff;}
  .sub-prev{width:100%;border-radius:12px;display:block;margin-bottom:13px;background:#05060c;}
  .sub-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
  .sub-chips span{font-size:12px;font-weight:600;color:#cfe0ff;background:rgba(59,134,255,.14);border-radius:999px;padding:4px 10px;}
  .sub-l{display:block;font-size:12.5px;color:#aeb6cf;margin:0 0 6px;font-weight:600;}
  .sub-in,.sub-ta{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
    border-radius:10px;color:#f2f4fb;font-size:14px;font-family:inherit;padding:11px 12px;margin-bottom:13px;}
  .sub-ta{resize:vertical;min-height:62px;}
  .sub-in:focus,.sub-ta:focus{outline:none;border-color:#6aa6ff;}
  .sub-row{display:flex;gap:9px;margin-top:4px;}
  .sub-btn{flex:1;font-size:14px;font-weight:800;border:0;border-radius:12px;padding:13px;cursor:pointer;transition:.15s;}
  .sub-go{color:#fff;background:linear-gradient(135deg,#6aa6ff,#3b86ff);}
  .sub-go:hover{filter:brightness(1.07);}
  .sub-ghost{color:#aeb6cf;background:rgba(255,255,255,.06);}
  .sub-ghost:hover{color:#fff;}
  .sub-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.06);
    border:0;color:#aeb6cf;font-size:14px;cursor:pointer;}
  .sub-done{text-align:center;padding:8px 0;}
  .sub-done .ic{font-size:46px;}
  .sub-done h3{margin:8px 0 4px;font-size:18px;font-weight:800;}
  .sub-done p{margin:0 0 16px;font-size:13px;color:#aeb6cf;}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  const ov=document.createElement('div'); ov.className='sub-ov';
  ov.innerHTML=`<div class="sub-card" id="subCard"></div>`;
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(ov));
  const card=()=>ov.querySelector('#subCard');
  const open=()=>{ if(!document.body.contains(ov)) document.body.appendChild(ov); ov.classList.add('on'); };
  const close=()=>ov.classList.remove('on');

  let cfg=null;
  const cap=()=>{ try{ return cfg&&cfg.capture?cfg.capture():null; }catch(e){ return null; } };
  const summ=()=>{ try{ return cfg&&cfg.summary?cfg.summary():[]; }catch(e){ return []; } };

  /* ── 이미지 PNG 저장 ── */
  function saveImage(){
    const c=cap(); if(!c){ alert('먼저 카메라를 켜고 결과를 만들어 주세요.'); return; }
    const img=new Image();
    img.onload=()=>{ const cv=document.createElement('canvas'); cv.width=img.naturalWidth; cv.height=img.naturalHeight;
      cv.getContext('2d').drawImage(img,0,0);
      const a=document.createElement('a'); a.href=cv.toDataURL('image/png');
      a.download=`vision_${cfg.feature||'result'}_${Date.now()}.png`; a.click(); };
    img.onerror=()=>{ const a=document.createElement('a'); a.href=c; a.download=`vision_${cfg.feature||'result'}_${Date.now()}.jpg`; a.click(); };
    img.src=c;
  }

  /* ── 교사: 클래스 미션 생성 ── */
  function openMissionCreate(){
    const m=modeNow();
    card().innerHTML=`
      <button class="sub-x" id="subX">✕</button>
      <h2 class="sub-h">클래스 미션 생성</h2>
      <p class="sub-sub">수업 <b>${esc(m.name||'')}</b> <span style="font-family:var(--mono,monospace);color:#6aa6ff">[${esc(m.code||'')}]</span> 에 미션을 추가해요</p>
      <label class="sub-l">미션 제목</label>
      <input class="sub-in" id="mTitle" placeholder="예: 우리 교실 사물 5가지 찾기" />
      <label class="sub-l">미션 내용 (간단히)</label>
      <textarea class="sub-ta" id="mContent" placeholder="학생들이 무엇을 하면 되는지 한두 줄로 적어주세요"></textarea>
      <div class="sub-row"><button class="sub-btn sub-ghost" id="mCancel">취소</button><button class="sub-btn sub-go" id="mGo">미션 생성</button></div>`;
    open(); setTimeout(()=>card().querySelector('#mTitle').focus(),50);
    card().querySelector('#subX').onclick=close; card().querySelector('#mCancel').onclick=close;
    card().querySelector('#mGo').onclick=()=>{
      const title=(card().querySelector('#mTitle').value||'').trim();
      const content=(card().querySelector('#mContent').value||'').trim();
      if(!title){ card().querySelector('#mTitle').focus(); card().querySelector('#mTitle').style.borderColor='#ff6a52'; return; }
      Session.createMission({classCode:m.code, className:m.name, title, content});
      const n=(Session.missionsFor(m.code)||[]).length;
      card().innerHTML=`<div class="sub-done"><div class="ic">✅</div><h3>미션이 생성됐어요</h3>
        <p>“${esc(title)}” · 현재 이 수업 미션 ${n}개. 학생들은 ‘미션 제출’에서 이 미션을 선택해 제출해요.</p>
        <div class="sub-row"><button class="sub-btn sub-ghost" id="mMore">미션 더 만들기</button><button class="sub-btn sub-go" id="mClose">확인</button></div></div>`;
      card().querySelector('#mClose').onclick=close; card().querySelector('#mMore').onclick=openMissionCreate;
    };
  }

  /* ── 학생: 미션 제출(미션 선택 + 이름 + 파일명 + 이미지) ── */
  function openSubmit(){
    const m=modeNow(); const missions=(window.Session&&Session.missionsFor(m.code))||[]; const c=cap();
    card().innerHTML=`
      <button class="sub-x" id="subX">✕</button>
      <h2 class="sub-h">미션 제출</h2>
      <p class="sub-sub"><b>${esc(m.name||'수업')}</b> 수업에 제출해요</p>
      ${c?`<img class="sub-prev" src="${c}" alt="제출 이미지" />`:'<p class="sub-sub" style="color:#ff8472">먼저 카메라를 켜고 결과를 만들어 주세요.</p>'}
      <div class="sub-chips">${(summ()||[]).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
      <label class="sub-l">미션 선택</label>
      ${missions.length
        ? `<select class="sub-in" id="sMission">${missions.map(mi=>`<option value="${mi.id}">${esc(mi.title)}</option>`).join('')}</select>`
        : '<div class="sub-sub" style="color:#ffb36a">아직 선생님이 만든 미션이 없어요. 선생님이 ‘클래스 미션 생성’을 하면 선택할 수 있어요.</div>'}
      <label class="sub-l">이름 / 번호</label>
      <input class="sub-in" id="sName" value="${esc(m.student||'')}" placeholder="예: 김에듀" />
      <label class="sub-l">파일명 (선택)</label>
      <input class="sub-in" id="sFile" placeholder="예: 우리반_사물탐지" />
      <div class="sub-row"><button class="sub-btn sub-ghost" id="sCancel">취소</button><button class="sub-btn sub-go" id="sGo">제출하기</button></div>`;
    open(); setTimeout(()=>card().querySelector('#sName').focus(),50);
    card().querySelector('#subX').onclick=close; card().querySelector('#sCancel').onclick=close;
    card().querySelector('#sGo').onclick=()=>{
      const name=(card().querySelector('#sName').value||'').trim();
      if(!name){ card().querySelector('#sName').focus(); card().querySelector('#sName').style.borderColor='#ff6a52'; return; }
      if(!c){ alert('제출할 이미지가 없어요. 카메라를 켜고 결과를 만든 뒤 제출하세요.'); return; }
      const sel=card().querySelector('#sMission'); const missionId=sel?sel.value:'';
      const mission=missions.find(x=>x.id===missionId);
      const fileName=(card().querySelector('#sFile').value||'').trim();
      localStorage.setItem(NAMEKEY,name);
      const rec={ id:'s'+Date.now()+'_'+Math.floor(Math.random()*1e4),
        feature:cfg.feature, label:cfg.label, name, klass:m.name||'',
        classCode:m.code||'', className:m.name||'',
        missionId:missionId||'', missionTitle:mission?mission.title:'', fileName,
        note:'', summary:summ()||[], img:c||'',
        time:new Date().toISOString(), status:'제출됨', score:null, feedback:'' };
      const list=load(); list.unshift(rec); saveAll(list);
      const cnt=list.filter(s=>s.classCode===m.code).length;
      card().innerHTML=`<div class="sub-done"><div class="ic">✅</div><h3>제출 완료!</h3>
        <p>${mission?('“'+esc(mission.title)+'” 미션에 '):''}제출했어요. 이 수업 게시판에 ${cnt}건.</p>
        <div class="sub-row"><button class="sub-btn sub-ghost" id="sSave">이미지 저장</button><button class="sub-btn sub-go" id="sClose">확인</button></div></div>`;
      card().querySelector('#sClose').onclick=close; card().querySelector('#sSave').onclick=saveImage;
    };
  }

  /* ── 모드별 액션 버튼 렌더 ── */
  function renderActions(){
    const area=document.getElementById('actionArea');
    const bb=document.getElementById('boardBtn');
    const m=modeNow();
    if(bb) bb.style.display = (m.mode==='teach') ? '' : 'none';
    if(!area) return;
    if(m.mode==='teach'){
      area.innerHTML='<button class="act act-primary" id="aCreate">＋ 클래스 미션 생성</button>';
      area.querySelector('#aCreate').onclick=openMissionCreate;
    } else if(m.mode==='class'){
      area.innerHTML='<button class="act act-ghost" id="aSave">🖼 이미지 저장</button><button class="act act-primary" id="aSubmit">📤 미션 제출</button>';
      area.querySelector('#aSave').onclick=saveImage;
      area.querySelector('#aSubmit').onclick=openSubmit;
    } else {
      area.innerHTML='<button class="act act-primary" id="aSave">🖼 이미지 저장하기</button>';
      area.querySelector('#aSave').onclick=saveImage;
    }
  }

  ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
  window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&ov.classList.contains('on')) close(); });

  window.Submit={
    init(c){ cfg=c; if(document.readyState!=='loading') renderActions(); else document.addEventListener('DOMContentLoaded', renderActions); },
    open(){ const m=modeNow(); if(m.mode==='class') openSubmit(); else if(m.mode==='teach') openMissionCreate(); else saveImage(); },
    refresh: renderActions
  };
})();
