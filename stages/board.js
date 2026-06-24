/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · 제출 게시판 (오버레이, 페이지 이동 없음)      ║
   ║  사용: <script src="/stages/board.js"></script> 후         ║
   ║        Board.open() 호출 → 현재 화면 위로 게시판이 뜸       ║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const KEY='vision_submissions';
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } };
  const saveAll=(l)=>localStorage.setItem(KEY, JSON.stringify(l));
  const esc=(s)=>(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  const fmt=(iso)=>{ try{ const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }catch(e){ return ''; } };

  const css=`
  .bd-ov{position:fixed;inset:0;z-index:95;display:none;background:rgba(7,8,14,.92);backdrop-filter:blur(8px);
    font-family:'Pretendard',system-ui,sans-serif;color:#f2f4fb;overflow:auto;}
  .bd-ov.on{display:block;}
  .bd-wrap{max-width:1120px;margin:0 auto;padding:20px 22px 40px;}
  .bd-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    padding:14px 0;margin-bottom:8px;background:linear-gradient(180deg,rgba(7,8,14,.96),rgba(7,8,14,.6));}
  .bd-title{display:flex;align-items:center;gap:12px;}
  .bd-title h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em;}
  .bd-stats{display:flex;gap:8px;}
  .bd-stat{font-family:'JetBrains Mono',monospace;font-size:12px;color:#aeb6cf;background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:6px 11px;}
  .bd-stat b{color:#6aa6ff;font-size:14px;}
  .bd-tools{display:flex;gap:8px;flex-wrap:wrap;}
  .bd-b{font-size:12.5px;font-weight:700;color:#aeb6cf;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
    border-radius:10px;padding:8px 12px;cursor:pointer;transition:.15s;}
  .bd-b:hover{color:#fff;border-color:#6aa6ff;}
  .bd-close{font-size:15px;color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);
    width:38px;height:38px;border-radius:11px;cursor:pointer;}
  .bd-banner{background:rgba(255,180,60,.08);border:1px solid rgba(255,180,60,.22);border-radius:11px;padding:10px 14px;
    font-size:12px;color:#ffd36a;margin-bottom:16px;line-height:1.55;}
  .bd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;}
  .bd-empty{grid-column:1/-1;text-align:center;color:#737c9c;padding:64px 0;font-size:14px;line-height:1.8;}
  .bd-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;}
  .bd-card.done{border-color:rgba(66,226,155,.4);}
  .bd-img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#05060c;}
  .bd-noimg{width:100%;aspect-ratio:4/3;display:grid;place-items:center;background:#05060c;color:#737c9c;font-size:13px;}
  .bd-bd{padding:14px 15px;display:flex;flex-direction:column;gap:8px;flex:1;}
  .bd-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .bd-name{font-size:15px;font-weight:800;}
  .bd-feat{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#6aa6ff;background:rgba(59,134,255,.16);
    border:1px solid rgba(59,134,255,.3);border-radius:7px;padding:3px 7px;}
  .bd-meta{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#737c9c;}
  .bd-chips{display:flex;flex-wrap:wrap;gap:5px;}
  .bd-chips span{font-size:11px;color:#aeb6cf;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:3px 8px;}
  .bd-note{font-size:12.5px;color:#aeb6cf;line-height:1.5;background:rgba(255,255,255,.03);border-radius:9px;padding:8px 10px;}
  .bd-note.em{color:#737c9c;font-style:italic;}
  .bd-eval{border-top:1px solid rgba(255,255,255,.1);padding:12px 15px;display:flex;flex-direction:column;gap:8px;background:rgba(255,255,255,.02);}
  .bd-er{display:flex;gap:7px;}
  .bd-ev{flex:1;font-size:12.5px;font-weight:700;border:1px solid rgba(255,255,255,.16);border-radius:9px;padding:8px;color:#aeb6cf;background:rgba(255,255,255,.04);cursor:pointer;transition:.15s;}
  .bd-ev.pass.on{color:#04140c;background:#42e29b;border-color:#42e29b;}
  .bd-ev.redo.on{color:#1a0a08;background:#ffd36a;border-color:#ffd36a;}
  .bd-fb{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#f2f4fb;font-size:12.5px;font-family:inherit;padding:8px 10px;}
  .bd-fb:focus{outline:none;border-color:#6aa6ff;}
  .bd-erow2{display:flex;justify-content:space-between;align-items:center;}
  .bd-del{font-size:11px;color:#737c9c;background:none;border:0;text-decoration:underline;cursor:pointer;}
  .bd-save{font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,#6aa6ff,#3b86ff);border:0;border-radius:9px;padding:8px 13px;cursor:pointer;}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  const ov=document.createElement('div'); ov.className='bd-ov';
  ov.innerHTML=`<div class="bd-wrap">
    <div class="bd-bar">
      <div class="bd-title"><h2>📋 제출 게시판</h2>
        <div class="bd-stats"><span class="bd-stat">전체 <b id="bdTotal">0</b></span><span class="bd-stat">미평가 <b id="bdWait">0</b></span></div>
      </div>
      <div class="bd-tools">
        <button class="bd-b" id="bdImport">📥 가져오기</button>
        <input type="file" id="bdFile" accept="application/json" multiple style="display:none" />
        <button class="bd-b" id="bdExport">📤 내보내기</button>
        <button class="bd-b" id="bdClear">🗑 비우기</button>
        <button class="bd-close" id="bdClose">✕</button>
      </div>
    </div>
    <div class="bd-banner">ℹ️ 제출물은 이 브라우저에 저장돼요. 다른 기기 제출물은 <b>가져오기</b>로 모아보세요. (실시간 연동은 백엔드 단계)</div>
    <div class="bd-grid" id="bdGrid"></div>
  </div>`;

  function ensure(){ if(!document.body.contains(ov)) document.body.appendChild(ov); }
  function render(){
    const list=load();
    ov.querySelector('#bdTotal').textContent=list.length;
    ov.querySelector('#bdWait').textContent=list.filter(s=>s.status!=='평가완료').length;
    const grid=ov.querySelector('#bdGrid');
    if(!list.length){ grid.innerHTML='<div class="bd-empty">아직 제출물이 없어요.<br>스테이지에서 <b>📤 미션 제출</b>을 하면 여기에 올라와요.</div>'; return; }
    grid.innerHTML=list.map(s=>`
      <div class="bd-card${s.status==='평가완료'?' done':''}" data-id="${s.id}">
        ${s.img?`<img class="bd-img" src="${s.img}" alt="제출 스냅샷" />`:'<div class="bd-noimg">스냅샷 없음</div>'}
        <div class="bd-bd">
          <div class="bd-top"><span class="bd-name">${esc(s.name)||'이름없음'}</span><span class="bd-feat">${esc(s.label)}</span></div>
          <div class="bd-meta">${s.klass?esc(s.klass)+' · ':''}${fmt(s.time)} · ${s.status==='평가완료'?'평가완료':'미평가'}</div>
          <div class="bd-chips">${(s.summary||[]).map(c=>`<span>${esc(c)}</span>`).join('')}</div>
          <div class="bd-note${s.note?'':' em'}">${s.note?esc(s.note):'소감 없음'}</div>
        </div>
        <div class="bd-eval">
          <div class="bd-er">
            <button class="bd-ev pass${s.result==='pass'?' on':''}" data-r="pass">✓ 통과</button>
            <button class="bd-ev redo${s.result==='redo'?' on':''}" data-r="redo">↻ 재도전</button>
          </div>
          <input class="bd-fb" placeholder="한 줄 피드백…" value="${esc(s.feedback)}" />
          <div class="bd-erow2"><button class="bd-del">삭제</button>
            <div style="display:flex;gap:7px">
              <button class="bd-b bd-pdf" style="padding:8px 11px">🖨 PDF</button>
              <button class="bd-save">평가 저장</button>
            </div>
          </div>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.bd-card').forEach(c=>{
      const id=c.dataset.id;
      c.querySelectorAll('.bd-ev').forEach(b=>b.addEventListener('click',()=>{ c.querySelectorAll('.bd-ev').forEach(x=>x.classList.remove('on')); b.classList.add('on'); }));
      c.querySelector('.bd-save').addEventListener('click',()=>{ const l=load(),r=l.find(x=>x.id===id); if(!r) return;
        const sel=c.querySelector('.bd-ev.on'); r.result=sel?sel.dataset.r:(r.result||null);
        r.feedback=c.querySelector('.bd-fb').value.trim(); r.status=r.result?'평가완료':'제출됨'; saveAll(l); render(); });
      c.querySelector('.bd-del').addEventListener('click',()=>{ if(confirm('이 제출물을 삭제할까요?')){ saveAll(load().filter(x=>x.id!==id)); render(); } });
      const pdf=c.querySelector('.bd-pdf'); if(pdf) pdf.addEventListener('click',()=>{ const r=load().find(x=>x.id===id); if(r&&window.Cert) Cert.print(r); });
    });
  }

  ov.querySelector('#bdClose').addEventListener('click',()=>ov.classList.remove('on'));
  ov.querySelector('#bdImport').addEventListener('click',()=>ov.querySelector('#bdFile').click());
  ov.querySelector('#bdFile').addEventListener('change', async (e)=>{
    const files=[...e.target.files]; const l=load(); let n=0;
    for(const f of files){ try{ const o=JSON.parse(await f.text()); (Array.isArray(o)?o:[o]).forEach(r=>{ if(r&&r.id&&!l.some(x=>x.id===r.id)){ l.unshift(r); n++; } }); }catch(err){} }
    saveAll(l); render(); alert(n+'건 가져왔어요.'); e.target.value='';
  });
  ov.querySelector('#bdExport').addEventListener('click',()=>{ const b=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='제출물_전체.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); });
  ov.querySelector('#bdClear').addEventListener('click',()=>{ if(confirm('모든 제출물을 비울까요?')){ saveAll([]); render(); } });
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.classList.remove('on'); });
  window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&ov.classList.contains('on')) ov.classList.remove('on'); });

  window.Board={ open(){ ensure(); render(); ov.classList.add('on'); }, close(){ ov.classList.remove('on'); } };
})();
