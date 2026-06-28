/* ╔══════════════════════════════════════════════════════════╗
   ║  VISION AI · 이미지 분류 콘텐츠 레이어                      ║
   ║  - 미션 시나리오 카드(주제 프리셋) / 데이터 코치 / 배지     ║
   ║  - index.html 내부 비침습: DOM(#class-list 등)만 조작/관찰  ║
   ╚══════════════════════════════════════════════════════════╝ */
(function(){
  const $=(id)=>document.getElementById(id);
  const esc=(s)=>(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));

  /* 활성 기능이 이미지 분류일 때만 동작 */
  function isImage(){ const h=(location.hash||'').replace('#',''); return !h || h==='image' || h==='create'; }

  const SCEN=[
    { key:'recycle', emoji:'♻️', name:'분리수거 분류기', classes:['캔','페트병','종이'], tip:'쓰레기를 각도·거리를 바꿔가며 20장씩. 배경이 섞이지 않게!' },
    { key:'rps',     emoji:'✌️', name:'가위바위보',     classes:['가위','바위','보'],   tip:'손을 화면 가운데에 크게. 배경은 단순하게.' },
    { key:'mask',    emoji:'😷', name:'마스크 썼나요?', classes:['썼음','안 썼음'],     tip:'얼굴이 잘 보이게, 밝은 곳에서 다양한 표정으로.' },
    { key:'thumb',   emoji:'👍', name:'엄지 척 / 아래', classes:['엄지 척','엄지 아래'], tip:'손 모양을 또렷하게, 손 위치를 조금씩 바꿔가며.' },
    { key:'custom',  emoji:'✨', name:'자유 주제',       classes:['클래스 1','클래스 2'], tip:'내가 원하는 종류로 직접 만들어 보세요!' },
  ];
  const BADGES=[
    { key:'classes3', emoji:'🎯', label:'3종 분류기', test:(s)=>s.classCount>=3 },
    { key:'samples20',emoji:'📸', label:'사진 부자(20+)', test:(s)=>s.maxCount>=20 },
    { key:'trained',  emoji:'🧠', label:'첫 학습 완료', test:(s)=>s.trained },
    { key:'acc90',    emoji:'🏆', label:'정확도 90%+', test:(s)=>s.acc>=90 },
  ];

  const css=`
  #lab-scenarios{display:flex;gap:9px;flex-wrap:wrap;margin:4px 0 6px;}
  .lab-sc{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--border);border-radius:12px;
    padding:9px 13px;cursor:pointer;transition:.15s;color:var(--ink-2);font-weight:700;font-size:13px;}
  .lab-sc:hover{border-color:var(--accent);color:var(--ink);transform:translateY(-1px);}
  .lab-sc .e{font-size:17px;}
  .lab-sc small{display:block;font-weight:500;font-size:11px;color:var(--ink-3);}
  .lab-sctip{font-size:12px;color:var(--accent-ink);background:var(--accent-soft);border-radius:10px;padding:8px 12px;margin-bottom:8px;display:none;}
  .lab-sctip.on{display:block;}
  .lab-coach{margin-top:12px;border-top:1px solid var(--border);padding-top:11px;}
  .lab-coach h4{margin:0 0 8px;font-size:11px;font-family:var(--mono);letter-spacing:.05em;color:var(--ink-3);text-transform:uppercase;}
  .lab-ck{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-2);margin-bottom:6px;}
  .lab-ck .b{width:17px;height:17px;border-radius:6px;display:grid;place-items:center;font-size:11px;flex:none;
    background:rgba(255,255,255,.07);color:var(--ink-3);}
  .lab-ck.ok .b{background:var(--green);color:#04140c;}
  .lab-ck.ok{color:var(--ink);}
  .lab-tipline{font-size:11.5px;color:var(--ink-3);margin-top:8px;line-height:1.55;}
  #lab-badges{display:inline-flex;gap:5px;vertical-align:middle;}
  .lab-badge{font-size:14px;filter:grayscale(1) opacity(.35);transition:.2s;}
  .lab-badge.on{filter:none;transform:scale(1.05);}
  .lab-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(18px);z-index:140;font-size:13.5px;font-weight:700;
    color:#1a0a08;background:var(--amber);border-radius:12px;padding:11px 17px;box-shadow:0 14px 40px rgba(0,0,0,.5);opacity:0;transition:.25s;pointer-events:none;}
  .lab-toast.on{opacity:1;transform:translateX(-50%) translateY(0);}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  let toastEl=null,toastT=null;
  function toast(m){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='lab-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent=m; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'),2000); }

  /* ── DOM 헬퍼 (index.html 내부 비침습) ── */
  const items=()=>[...document.querySelectorAll('#class-list .class-item')];
  const counts=()=>items().map(it=>({ name:(it.querySelector('.class-name')?.value||'').trim(),
    n:parseInt(it.querySelector('.class-count')?.textContent||'0')||0 }));
  const hasData=()=>counts().some(c=>c.n>0);
  const trained=()=>{ const t=$('infer-toggle'); return !!(t && !t.disabled); };
  const savedAcc=()=>{ try{ return parseInt(localStorage.getItem('vision_imagelab_acc')||'0')||0; }catch(e){ return 0; } };

  /* ── 시나리오 적용 (UI 구동) ── */
  function applyScenario(s){
    if(hasData() && !confirm(`'${s.name}' 주제로 시작할까요?\n현재 만든 클래스 구성이 이 주제에 맞게 바뀝니다.`)) return;
    let guard=0;
    while(items().length>s.classes.length && guard++<12){ const del=items()[items().length-1].querySelector('.class-del'); if(!del) break; del.click(); }
    guard=0;
    const add=$('add-class');
    while(items().length<s.classes.length && guard++<12 && add){ add.click(); }
    items().forEach((it,i)=>{ const inp=it.querySelector('.class-name'); if(inp && s.classes[i]!==undefined){
      inp.value=s.classes[i]; inp.dispatchEvent(new Event('input',{bubbles:true})); } });
    const tip=$('lab-sctip'); if(tip){ tip.innerHTML='💡 '+esc(s.tip); tip.classList.add('on'); }
    update();
  }

  function renderScenarios(){
    const box=$('lab-scenarios'); if(!box) return;
    if(!isImage()){ box.innerHTML=''; return; }
    box.innerHTML='<div class="lab-sctip" id="lab-sctip"></div>'+
      '<div style="display:flex;gap:9px;flex-wrap:wrap;width:100%">'+SCEN.map(s=>
      `<button class="lab-sc" data-k="${s.key}"><span class="e">${s.emoji}</span><span>${esc(s.name)}<small>${s.classes.join(' · ')}</small></span></button>`).join('')+'</div>';
    box.querySelectorAll('.lab-sc').forEach(b=>b.addEventListener('click',()=>{ const s=SCEN.find(x=>x.key===b.dataset.k); if(s) applyScenario(s); }));
  }

  /* ── 데이터 코치 ── */
  function renderCoach(){
    const box=$('lab-coach'); if(!box) return; if(!isImage()){ box.innerHTML=''; return; }
    const cs=counts(); const total=cs.reduce((a,c)=>a+c.n,0);
    const mn=cs.length?Math.min(...cs.map(c=>c.n)):0, mx=cs.length?Math.max(...cs.map(c=>c.n)):0;
    const checks=[
      { ok:cs.length>=2, t:'분류할 클래스 2개 이상 만들기' },
      { ok:cs.length>=2 && cs.every(c=>c.n>=10), t:'각 클래스 사진 10장 이상 모으기' },
      { ok:cs.length>=2 && (mx-mn)<=Math.max(5, mx*0.4), t:'클래스별 장수 균형 맞추기' },
      { ok:total>=30, t:`전체 30장 이상 모으기 (현재 ${total}장)` },
    ];
    box.innerHTML='<div class="lab-coach"><h4>데이터 코치</h4>'+
      checks.map(c=>`<div class="lab-ck${c.ok?' ok':''}"><span class="b">${c.ok?'✓':' '}</span>${esc(c.t)}</div>`).join('')+
      '<div class="lab-tipline">📷 같은 물체라도 <b>각도·거리·배경·밝기</b>를 바꿔 다양하게 찍을수록 똑똑해져요.</div></div>';
  }

  /* ── 배지 ── */
  function awarded(){ try{ return JSON.parse(localStorage.getItem('vision_imagelab_badges')||'[]'); }catch(e){ return []; } }
  function renderBadges(){
    const box=$('lab-badges'); if(!box) return; if(!isImage()){ box.innerHTML=''; return; }
    const got=awarded();
    box.innerHTML=BADGES.map(b=>`<span class="lab-badge${got.includes(b.key)?' on':''}" title="${esc(b.label)}${got.includes(b.key)?' · 획득!':' (잠김)'}">${b.emoji}</span>`).join('');
  }
  function checkBadges(){
    const cs=counts(); const snap={ classCount:cs.length, maxCount:cs.length?Math.max(...cs.map(c=>c.n)):0, trained:trained(), acc:savedAcc() };
    const got=awarded(); let changed=false;
    BADGES.forEach(b=>{ if(!got.includes(b.key) && b.test(snap)){ got.push(b.key); changed=true; toast(b.emoji+' 배지 획득 · '+b.label); } });
    if(changed){ try{ localStorage.setItem('vision_imagelab_badges', JSON.stringify(got)); }catch(e){} renderBadges(); }
  }

  function update(){ renderCoach(); renderBadges(); checkBadges(); }

  function init(){ renderScenarios(); update(); setInterval(update,1300); window.addEventListener('hashchange',()=>{ renderScenarios(); update(); }); }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
  window.ImageLab={ applyScenario, update };
})();
