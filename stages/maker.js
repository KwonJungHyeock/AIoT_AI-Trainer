/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · AI 인터랙션 빌더 (트리거→액션 창작 엔진)      ║
   ║  학습한 클래스를 보면 액션이 반응하는 '나만의 작품'을 제작  ║
   ║  - 모델 코드 비침습: 화면(DOM) 예측 결과만 읽어 동작        ║
   ║  사용: <script src="/stages/maker.js"></script> + [data-maker]║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const esc=(s)=>(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  /* 액션 카탈로그 — 여기에 추가하면 게임/장면/키트로 확장된다 */
  const ACTIONS={
    emoji:{ label:'이모지 표시', kind:'hold', def:'🎉', input:'text', ph:'예: 🎉 (이모지)' },
    text: { label:'글자 표시', kind:'hold', def:'정답!', input:'text', ph:'예: 정답!' },
    bg:   { label:'배경색 전환', kind:'hold', def:'#3b86ff', input:'color' },
    tone: { label:'소리 재생', kind:'fire', def:'660', input:'select', opts:[['523','도'],['587','레'],['659','미'],['698','파'],['784','솔'],['880','라']] },
    score:{ label:'점수 +1', kind:'fire', def:'1', input:'none' },
    none: { label:'반응 없음', kind:'none', def:'', input:'none' }
  };

  const css=`
  .mk-ov{position:fixed;inset:0;z-index:98;display:none;background:rgba(6,7,12,.95);backdrop-filter:blur(9px);
    font-family:'Pretendard',system-ui,sans-serif;color:#f2f4fb;overflow:auto;}
  .mk-ov.on{display:block;}
  .mk-wrap{max-width:1140px;margin:0 auto;padding:18px 22px 40px;}
  .mk-bar{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    padding:12px 0;margin-bottom:8px;background:linear-gradient(180deg,rgba(6,7,12,.97),rgba(6,7,12,.55));}
  .mk-ttl{display:flex;align-items:center;gap:12px;}
  .mk-back{font-size:13px;font-weight:700;color:#aeb6cf;background:rgba(255,255,255,.06);border:0;border-radius:11px;
    padding:9px 14px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);transition:.15s;}
  .mk-back:hover{color:#fff;background:rgba(255,255,255,.1);}
  .mk-ttl h2{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em;}
  .mk-ttl .tag{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#ff8472;background:rgba(240,71,58,.16);border-radius:7px;padding:4px 8px;}
  .mk-sub{margin:-2px 0 16px;font-size:13px;color:#aeb6cf;line-height:1.55;max-width:760px;}
  .mk-sub b{color:#ffd36a;}
  .mk-tools{display:flex;gap:8px;flex-wrap:wrap;}
  .mk-b{font-size:12.5px;font-weight:700;color:#aeb6cf;background:rgba(255,255,255,.05);border:0;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.06);border-radius:10px;padding:9px 13px;cursor:pointer;transition:.15s;}
  .mk-b:hover{color:#fff;box-shadow:inset 0 0 0 1px #6aa6ff;}
  .mk-b.play{color:#04140c;background:#42e29b;box-shadow:none;} .mk-b.play.on{background:#ffd36a;color:#1a0a08;}
  .mk-close{font-size:15px;color:#fff;background:rgba(255,255,255,.06);border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);width:38px;height:38px;border-radius:11px;cursor:pointer;}
  .mk-grid{display:grid;grid-template-columns:minmax(300px,400px) 1fr;gap:18px;align-items:start;}
  @media(max-width:820px){ .mk-grid{grid-template-columns:1fr;} }
  .mk-panel{background:rgba(255,255,255,.04);border-radius:16px;padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
  .mk-h{font-size:13px;font-weight:800;color:#aeb6cf;margin:0 0 12px;display:flex;align-items:center;gap:8px;}
  .mk-rule{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.03);border-radius:12px;padding:10px 11px;margin-bottom:9px;}
  .mk-dot{width:13px;height:13px;border-radius:4px;flex:none;background:#6aa6ff;}
  .mk-cn{font-size:14px;font-weight:800;min-width:64px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mk-arrow{color:#737c9c;font-size:13px;}
  .mk-sel,.mk-val{background:rgba(255,255,255,.06);border:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);border-radius:9px;
    color:#f2f4fb;font-size:12.5px;font-family:inherit;padding:8px 9px;}
  .mk-sel{min-width:96px;} .mk-val{width:78px;} .mk-val[type=color]{padding:3px;height:34px;width:42px;}
  .mk-sel:focus,.mk-val:focus{outline:none;box-shadow:inset 0 0 0 2px #6aa6ff;}
  .mk-empty{color:#737c9c;font-size:12.5px;line-height:1.7;padding:8px 2px;}
  .mk-stagewrap{position:relative;}
  .mk-stage{width:100%;aspect-ratio:4/3;border-radius:16px;overflow:hidden;background:#05060c;display:block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);}
  .mk-hud{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;pointer-events:none;}
  .mk-score{font-family:'JetBrains Mono',monospace;font-weight:800;font-size:15px;color:#fff;background:rgba(0,0,0,.45);border-radius:9px;padding:6px 11px;}
  .mk-cur{font-size:12.5px;font-weight:700;color:#fff;background:rgba(0,0,0,.45);border-radius:9px;padding:6px 11px;}
  .mk-note{font-size:11.5px;color:#737c9c;margin-top:10px;line-height:1.6;}
  .mk-warn{display:none;font-size:12.5px;color:#ffd36a;background:rgba(255,180,60,.1);border-radius:10px;padding:10px 12px;margin-top:10px;line-height:1.55;}
  .mk-warn.on{display:block;}
  .mk-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(18px);z-index:140;font-size:13.5px;font-weight:700;
    color:#04140c;background:#42e29b;border-radius:12px;padding:11px 17px;box-shadow:0 14px 40px rgba(0,0,0,.5);opacity:0;transition:.25s;pointer-events:none;}
  .mk-toast.on{opacity:1;transform:translateX(-50%) translateY(0);}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  const ov=document.createElement('div'); ov.className='mk-ov';
  ov.innerHTML=`<div class="mk-wrap">
    <div class="mk-bar">
      <div class="mk-ttl"><button class="mk-back" id="mkBack">← 뒤로</button><h2>AI 인터랙션 빌더</h2><span class="tag">CREATE</span></div>
      <div class="mk-tools">
        <button class="mk-b play" id="mkPlay">▶ 플레이</button>
        <button class="mk-b" id="mkSave">결과 이미지 저장</button>
        <button class="mk-close" id="mkClose">✕</button>
      </div>
    </div>
    <p class="mk-sub">방금 <b>학습시킨 클래스</b>를 카메라로 보여주면, 내가 정한 <b>반응(소리·이모지·점수…)</b>이 나오는 나만의 작품을 만들어요. 예: “가위→✌️, 바위→점수+1, 보→배경 파랑”.</p>
    <div class="mk-grid">
      <div class="mk-panel">
        <p class="mk-h">규칙 · 클래스를 보면 →</p>
        <div id="mkRules"></div>
        <div class="mk-warn" id="mkWarn">먼저 페이지에서 <b>카메라 켜기 → 추론 시작</b>을 누르면, 보이는 클래스에 따라 작품이 반응해요.</div>
        <p class="mk-note">학습한 클래스마다 반응(액션)을 골라 나만의 작품을 만들어요. 같은 방식으로 게임·장면 전환도 만들 수 있어요.</p>
      </div>
      <div class="mk-panel mk-stagewrap">
        <p class="mk-h">무대 · 미리보기</p>
        <canvas class="mk-stage" id="mkStage" width="640" height="480"></canvas>
        <div class="mk-hud"><span class="mk-score" id="mkScore">SCORE 0</span><span class="mk-cur" id="mkCur">대기중</span></div>
      </div>
    </div>
  </div>`;

  function ensure(){ if(!document.body.contains(ov)) document.body.appendChild(ov); }
  let toastEl=null,toastT=null;
  function toast(m){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='mk-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent='✓ '+m; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'),1600); }

  /* ── DOM에서 학습된 클래스 읽기 ── */
  function readClasses(){
    let rows=[...document.querySelectorAll('#class-list .class-name')];
    let names=rows.map(e=>(e.value||e.textContent||'').trim()).filter(Boolean);
    if(!names.length) names=[...document.querySelectorAll('#bars .bar-name')].map(e=>e.textContent.trim()).filter(Boolean);
    // 색상: class-list 의 색 스와치가 있으면 사용
    const cols=[...document.querySelectorAll('#class-list [style*="background"]')].map(e=>e.style.backgroundColor).filter(Boolean);
    const palette=['#6aa6ff','#ffb84d','#42e29b','#ff7a90','#b98cff','#4dd0e1'];
    return names.map((n,i)=>({ name:n, color:cols[i]||palette[i%palette.length] }));
  }
  function curPred(){ const el=document.querySelector('#top-pred .tp-name'); const t=el?el.textContent.trim():'';
    return (t&&t!=='아직 학습 전'&&t!=='지금 무엇으로 보이나요?')?t:''; }
  function curConf(){ const el=document.getElementById('top-donut-pct'); const v=el?parseInt(el.textContent):0; return isNaN(v)?0:v; }
  function activeCam(){ const v=document.getElementById('webcam'); return (v&&v.videoWidth)?v:null; }

  let rules={};   // name -> {type, value}
  function renderRules(){
    const cs=readClasses(); const box=ov.querySelector('#mkRules');
    if(!cs.length){ box.innerHTML='<div class="mk-empty">아직 학습한 클래스가 없어요.<br>페이지에서 클래스를 만들고 사진을 모아 <b>모델 학습</b>을 한 뒤 다시 열어주세요.</div>'; return; }
    const opts=Object.entries(ACTIONS).map(([k,a])=>`<option value="${k}">${a.label}</option>`).join('');
    box.innerHTML=cs.map(c=>{ const r=rules[c.name]||(rules[c.name]={type:'emoji',value:ACTIONS.emoji.def});
      return `<div class="mk-rule" data-name="${esc(c.name)}">
        <span class="mk-dot" style="background:${c.color}"></span>
        <span class="mk-cn" title="${esc(c.name)}">${esc(c.name)}</span><span class="mk-arrow">→</span>
        <select class="mk-sel" data-role="type">${opts}</select>
        <span data-role="valwrap"></span>
      </div>`; }).join('');
    box.querySelectorAll('.mk-rule').forEach(row=>{
      const name=row.dataset.name; const sel=row.querySelector('[data-role=type]'); sel.value=rules[name].type;
      const drawVal=()=>{ const a=ACTIONS[rules[name].type]; const w=row.querySelector('[data-role=valwrap]');
        if(a.input==='none'){ w.innerHTML=''; return; }
        if(a.input==='select'){ w.innerHTML=`<select class="mk-sel" data-role="val">${a.opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`; }
        else if(a.input==='color'){ w.innerHTML=`<input class="mk-val" type="color" data-role="val" value="${rules[name].value||a.def}">`; }
        else { w.innerHTML=`<input class="mk-val" type="text" data-role="val" value="${esc(rules[name].value||a.def)}" placeholder="${a.ph||''}" style="width:120px">`; }
        const v=w.querySelector('[data-role=val]'); if(v){ v.value=rules[name].value||a.def; v.addEventListener('input',()=>rules[name].value=v.value); }
      };
      sel.addEventListener('change',()=>{ rules[name].type=sel.value; rules[name].value=ACTIONS[sel.value].def; drawVal(); });
      drawVal();
    });
  }

  /* ── 무대 렌더 + 플레이 루프 ── */
  let playing=false, raf=0, score=0, lastFired='', burst=null;
  const cv=()=>ov.querySelector('#mkStage');
  function drawStage(){
    const c=cv(), ctx=c.getContext('2d'), W=c.width, H=c.height;
    ctx.clearRect(0,0,W,H);
    const grd=ctx.createLinearGradient(0,0,W,H); grd.addColorStop(0,'#101526'); grd.addColorStop(1,'#070a12');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
    const cam=activeCam();
    if(cam){ try{ ctx.save(); ctx.globalAlpha=.9; ctx.drawImage(cam,0,0,W,H); ctx.restore(); }catch(e){} }
    const name=playing?curPred():''; const r=name?rules[name]:null;
    // 배경색 액션
    if(playing && r && r.type==='bg'){ ctx.save(); ctx.globalAlpha=.42; ctx.fillStyle=r.value||'#3b86ff'; ctx.fillRect(0,0,W,H); ctx.restore(); }
    // 이모지/글자 액션
    if(playing && r && (r.type==='emoji'||r.type==='text')){
      ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor='rgba(0,0,0,.6)'; ctx.shadowBlur=18;
      if(r.type==='emoji'){ ctx.font='160px serif'; ctx.fillText(r.value||'🎉',W/2,H/2); }
      else { ctx.fillStyle='#fff'; ctx.font='bold 72px Pretendard,system-ui,sans-serif'; ctx.fillText(r.value||'정답!',W/2,H/2); }
      ctx.restore();
    }
    if(!cam){ ctx.save(); ctx.textAlign='center';
      ctx.globalAlpha=.5; ctx.font='64px serif'; ctx.fillText('🎮',W/2,H/2-14); ctx.globalAlpha=1;
      ctx.fillStyle='#9aa3bf'; ctx.font='bold 16px Pretendard,system-ui,sans-serif';
      ctx.fillText(playing?'카메라를 켜고 추론을 시작하면 여기서 반응해요':'미리보기 — ▶ 플레이를 누르면 시작',W/2,H/2+44); ctx.restore(); }
    // HUD 업데이트
    ov.querySelector('#mkScore').textContent='SCORE '+score;
    ov.querySelector('#mkCur').textContent = playing ? (name? (name+' · '+curConf()+'%') : '인식 대기') : '대기중';
  }
  function tickFire(){
    if(!playing) return;
    const name=curPred();
    if(name && name!==lastFired){ // 클래스가 바뀌는 순간 1회성 액션 발동
      lastFired=name; const r=rules[name];
      if(r){ if(r.type==='score'){ score++; } else if(r.type==='tone'){ beep(parseInt(r.value)||660); } }
    }
    if(!name) lastFired='';
  }
  function loop(){ if(!playing) return; drawStage(); raf=requestAnimationFrame(loop); }
  let fireTimer=null;
  function play(on){
    playing=on; const btn=ov.querySelector('#mkPlay');
    btn.classList.toggle('on',on); btn.textContent=on?'⏸ 정지':'▶ 플레이';
    ov.querySelector('#mkWarn').classList.toggle('on', on && !curPred());
    if(on){ score=0; lastFired=''; clearInterval(fireTimer); fireTimer=setInterval(tickFire,160); cancelAnimationFrame(raf); loop(); }
    else { clearInterval(fireTimer); cancelAnimationFrame(raf); drawStage(); }
  }

  /* 소리 */
  let actx=null;
  function beep(f){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(),g=actx.createGain(); o.type='triangle'; o.frequency.value=f; g.gain.value=.06;
    o.connect(g); g.connect(actx.destination); const t=actx.currentTime; g.gain.setValueAtTime(.06,t);
    g.gain.exponentialRampToValueAtTime(.0001,t+.18); o.start(t); o.stop(t+.18); }catch(e){} }

  function snapshot(){ // 무대 + 정보 합성 이미지(저장/제출용)
    const c=cv(), out=document.createElement('canvas'); out.width=c.width; out.height=c.height;
    const ctx=out.getContext('2d'); ctx.drawImage(c,0,0);
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(0,out.height-40,out.width,40);
    ctx.fillStyle='#fff'; ctx.font='bold 18px Pretendard,system-ui,sans-serif'; ctx.textBaseline='middle';
    ctx.fillText('AI 인터랙션 · SCORE '+score, 14, out.height-20);
    return out.toDataURL('image/jpeg',.86);
  }
  function saveImage(){ drawStage(); const a=document.createElement('a'); a.href=snapshot();
    a.download='ai_interaction_'+Date.now()+'.png'; a.click(); toast('작품 이미지를 저장했어요'); }

  ov.querySelector('#mkClose').addEventListener('click',()=>{ play(false); ov.classList.remove('on'); });
  ov.querySelector('#mkBack').addEventListener('click',()=>{ play(false); ov.classList.remove('on'); });
  ov.querySelector('#mkPlay').addEventListener('click',()=>play(!playing));
  ov.querySelector('#mkSave').addEventListener('click',saveImage);
  ov.addEventListener('click',e=>{ if(e.target===ov){ play(false); ov.classList.remove('on'); } });
  window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&ov.classList.contains('on')){ play(false); ov.classList.remove('on'); } });

  window.Maker={ open(){ ensure(); renderRules(); play(false); drawStage(); ov.classList.add('on'); }, close(){ play(false); ov.classList.remove('on'); },
    snapshot };
  document.addEventListener('click',(e)=>{ const t=e.target.closest&&e.target.closest('[data-maker]'); if(t){ e.preventDefault(); Maker.open(); } });
})();
