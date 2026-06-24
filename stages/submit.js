/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · 미션 제출 모듈 (백엔드 없는 1차 데모)        ║
   ║  사용: 페이지에서 Submit.init({feature,label,capture,summary})║
   ║        버튼에서 Submit.open() 호출                         ║
   ║  저장: localStorage 'vision_submissions' + .json 내보내기  ║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const KEY='vision_submissions', NAMEKEY='vision_student_name', CLASSKEY='vision_student_class';
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } };
  const saveAll=(l)=>localStorage.setItem(KEY, JSON.stringify(l));

  // 스타일 주입
  const css=`
  .sub-ov{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;padding:22px;
    background:rgba(5,6,12,.74);backdrop-filter:blur(6px);font-family:'Pretendard',system-ui,sans-serif;}
  .sub-ov.on{display:flex;}
  .sub-card{position:relative;width:min(440px,100%);max-height:90vh;overflow:auto;background:linear-gradient(180deg,#12162a,#0d1020);
    border:1px solid rgba(59,134,255,.32);border-radius:20px;padding:22px;color:#f2f4fb;
    box-shadow:0 0 0 4px rgba(59,134,255,.14),0 30px 70px rgba(0,0,0,.6);}
  .sub-h{font-size:18px;font-weight:800;margin:0 0 4px;}
  .sub-sub{font-size:12px;color:#8b93ad;margin:0 0 14px;}
  .sub-prev{width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.12);display:block;margin-bottom:12px;background:#05060c;}
  .sub-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
  .sub-chips span{font-size:12px;font-weight:600;color:#cfe0ff;background:rgba(59,134,255,.14);
    border:1px solid rgba(59,134,255,.28);border-radius:999px;padding:4px 10px;}
  .sub-l{display:block;font-size:12.5px;color:#aeb6cf;margin:0 0 6px;font-weight:600;}
  .sub-in,.sub-ta{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
    border-radius:10px;color:#f2f4fb;font-size:14px;font-family:inherit;padding:11px 12px;margin-bottom:13px;}
  .sub-ta{resize:vertical;min-height:62px;}
  .sub-in:focus,.sub-ta:focus{outline:none;border-color:#6aa6ff;}
  .sub-row{display:flex;gap:9px;margin-top:4px;}
  .sub-btn{flex:1;font-size:14px;font-weight:800;border:0;border-radius:12px;padding:13px;cursor:pointer;transition:.15s;}
  .sub-go{color:#fff;background:linear-gradient(135deg,#6aa6ff,#3b86ff);box-shadow:0 8px 22px rgba(59,134,255,.36);}
  .sub-go:hover{filter:brightness(1.07);}
  .sub-ghost{color:#aeb6cf;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);}
  .sub-ghost:hover{color:#fff;}
  .sub-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);color:#aeb6cf;font-size:14px;cursor:pointer;}
  .sub-done{text-align:center;padding:8px 0;}
  .sub-done .ic{font-size:46px;}
  .sub-done h3{margin:8px 0 4px;font-size:18px;font-weight:800;}
  .sub-done p{margin:0 0 16px;font-size:13px;color:#aeb6cf;}
  /* 페이지 제출 버튼 */
  .submitbtn{width:100%;margin-top:12px;font-size:14.5px;font-weight:800;color:#fff;border:0;border-radius:12px;padding:14px;cursor:pointer;
    background:linear-gradient(135deg,#6aa6ff,#3b86ff);box-shadow:0 8px 22px rgba(59,134,255,.34);transition:.15s;}
  .submitbtn:hover{transform:translateY(-1px);filter:brightness(1.06);}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // 모달 DOM
  const ov=document.createElement('div'); ov.className='sub-ov';
  ov.innerHTML=`<div class="sub-card" id="subCard"></div>`;
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(ov));
  const card=()=>ov.querySelector('#subCard');

  let cfg=null;
  function esc(s){ return (s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  function renderForm(capture, summary, mode){
    const name = (mode && mode.mode==='class' && mode.student) ? mode.student : (localStorage.getItem(NAMEKEY)||'');
    card().innerHTML=`
      <button class="sub-x" id="subX">✕</button>
      <h2 class="sub-h">📤 미션 제출</h2>
      <p class="sub-sub">${esc(cfg.label)} 결과를 <b>${esc(mode.name||'수업')}</b> 게시판에 제출해요 <span style="font-family:var(--mono,monospace);color:#6aa6ff">[${esc(mode.code||'')}]</span></p>
      ${capture?`<img class="sub-prev" src="${capture}" alt="제출 스냅샷" />`:''}
      <div class="sub-chips">${(summary||[]).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
      <label class="sub-l">이름 / 번호</label>
      <input class="sub-in" id="subName" placeholder="예: 김에듀" value="${esc(name)}" />
      <label class="sub-l">한 줄 소감 (선택)</label>
      <textarea class="sub-ta" id="subNote" placeholder="무엇을 발견했나요? 어떤 점이 신기했나요?"></textarea>
      <div class="sub-row">
        <button class="sub-btn sub-ghost" id="subCancel">취소</button>
        <button class="sub-btn sub-go" id="subGo">제출하기</button>
      </div>`;
    card().querySelector('#subX').onclick=close;
    card().querySelector('#subCancel').onclick=close;
    card().querySelector('#subGo').onclick=()=>doSubmit(capture, summary, mode);
    setTimeout(()=>card().querySelector('#subName').focus(),50);
  }

  /* 체험(자유) 모드 — 게시판 업로드 없이 이미지 저장만 */
  function renderFree(capture, summary){
    card().innerHTML=`
      <button class="sub-x" id="subX">✕</button>
      <h2 class="sub-h">🖼 결과 저장</h2>
      <p class="sub-sub">체험 모드예요. 결과 화면을 이미지로 저장할 수 있어요. (수업 게시판 제출은 ‘수업 참여’로 입장하면 가능)</p>
      ${capture?`<img class="sub-prev" src="${capture}" alt="결과 스냅샷" />`:'<p class="sub-sub" style="color:#ff8472">먼저 카메라를 켜고 결과를 만들어 주세요.</p>'}
      <div class="sub-chips">${(summary||[]).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
      <div class="sub-row">
        <button class="sub-btn sub-ghost" id="subCancel">닫기</button>
        <button class="sub-btn sub-go" id="subSave">🖼 이미지 저장</button>
      </div>`;
    card().querySelector('#subX').onclick=close;
    card().querySelector('#subCancel').onclick=close;
    const sv=card().querySelector('#subSave'); if(sv) sv.onclick=()=>saveImage(capture);
  }
  function saveImage(capture){ if(!capture){ alert('저장할 결과가 없어요. 카메라를 켜고 다시 시도하세요.'); return; }
    const a=document.createElement('a'); a.href=capture; a.download=`vision_${cfg.feature||'result'}_${Date.now()}.jpg`; a.click(); }

  function doSubmit(capture, summary, mode){
    const name=(card().querySelector('#subName').value||'').trim();
    const note=(card().querySelector('#subNote').value||'').trim();
    if(!name){ card().querySelector('#subName').focus(); card().querySelector('#subName').style.borderColor='#ff6a52'; return; }
    localStorage.setItem(NAMEKEY,name);
    const rec={ id:'s'+Date.now()+'_'+Math.floor(Math.random()*1e4),
      feature:cfg.feature, label:cfg.label, name,
      classCode:(mode&&mode.code)||'', className:(mode&&mode.name)||'', klass:(mode&&mode.name)||'',
      note, summary:summary||[], img:capture||'', topic:cfg.topic||'',
      time:new Date().toISOString(), status:'제출됨', score:null, feedback:'' };
    const list=load(); list.unshift(rec); saveAll(list);
    renderDone(rec);
  }

  function renderDone(rec){
    const cnt=load().length;
    card().innerHTML=`
      <div class="sub-done">
        <div class="ic">✅</div>
        <h3>제출 완료!</h3>
        <p>게시판에 올라갔어요 (현재 ${cnt}건). 선생님께 파일로도 전달할 수 있어요.</p>
        <div class="sub-row">
          ${window.Cert?'<button class="sub-btn sub-ghost" id="subPdf">📄 PDF로 저장</button>':''}
          ${window.Board?'<button class="sub-btn sub-ghost" id="subBoard">📋 게시판</button>':''}
          <button class="sub-btn sub-go" id="subClose">확인</button>
        </div>
      </div>`;
    card().querySelector('#subClose').onclick=close;
    const pb=card().querySelector('#subPdf'); if(pb) pb.onclick=()=>window.Cert.print(rec);
    const sb=card().querySelector('#subBoard'); if(sb) sb.onclick=()=>{ close(); window.Board.open(); };
  }

  function exportFile(rec){
    const blob=new Blob([JSON.stringify(rec,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`제출_${rec.label}_${rec.name||'학생'}.json`.replace(/\s+/g,'');
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function close(){ ov.classList.remove('on'); }

  window.Submit={
    init(c){ cfg=c; },
    open(){
      if(!cfg) return;
      let capture=null, summary=[];
      try{ capture=cfg.capture?cfg.capture():null; }catch(e){}
      try{ summary=cfg.summary?cfg.summary():[]; }catch(e){}
      if(!document.body.contains(ov)) document.body.appendChild(ov);
      const mode=(window.Session&&Session.getMode&&Session.getMode())||{mode:'free'};
      if(mode.mode==='class'||mode.mode==='teach') renderForm(capture, summary, mode);
      else renderFree(capture, summary);
      ov.classList.add('on');
    }
  };
  ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
  window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&ov.classList.contains('on')) close(); });
})();
