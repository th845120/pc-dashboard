/* ==========================================================
   水滴鈴 — 點擊 tab 時的水晶音效
   FM Bell synthesis · short reverb · auto-duck on rapid clicks
   ========================================================== */
(function(){
  let ctx = null;
  let bus = null;
  let lastTrigger = 0;
  let enabled = true;

  // localStorage 開關（用戶想靜音可以 set 'pc_sound' = '0'）
  try {
    if(localStorage.getItem('pc_sound') === '0') enabled = false;
  } catch(e){}

  function ensureCtx(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function getBus(){
    if(bus) return bus;
    if(!ensureCtx()) return null;

    // 短 room reverb impulse (1.2s)
    const len = ctx.sampleRate * 1.2;
    const imp = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let ch=0; ch<2; ch++){
      const d = imp.getChannelData(ch);
      for(let i=0; i<len; i++){
        const t = i/len;
        const tail = Math.pow(1-t, 3.5);
        d[i] = (Math.random()*2-1) * tail * (0.65 + 0.35 * Math.sin(t*13 + ch*1.7));
      }
    }
    const conv = ctx.createConvolver(); conv.buffer = imp;

    const dl1 = ctx.createDelay(1.0); dl1.delayTime.value = 0.18;
    const dl2 = ctx.createDelay(1.0); dl2.delayTime.value = 0.27;
    const fb = ctx.createGain(); fb.gain.value = 0.18;
    dl1.connect(dl2); dl2.connect(fb); fb.connect(dl1);

    const tilt = ctx.createBiquadFilter();
    tilt.type='highshelf'; tilt.frequency.value=4500; tilt.gain.value=-3;
    const lowcut = ctx.createBiquadFilter();
    lowcut.type='highpass'; lowcut.frequency.value=80;

    const inputNode = ctx.createGain();
    const wetReverb = ctx.createGain(); wetReverb.gain.value = 0.4;
    const wetDelay  = ctx.createGain(); wetDelay.gain.value  = 0.2;
    const dry       = ctx.createGain(); dry.gain.value       = 0.85;
    const out       = ctx.createGain(); out.gain.value       = 1.0;
    const master    = ctx.createGain(); master.gain.value    = 0.7;  // 整體再壓 70% 不要吵到內容

    inputNode.connect(lowcut); lowcut.connect(tilt);
    tilt.connect(dry); tilt.connect(conv); tilt.connect(dl1);
    conv.connect(wetReverb); dl1.connect(wetDelay); dl2.connect(wetDelay);
    dry.connect(out); wetReverb.connect(out); wetDelay.connect(out);
    out.connect(master); master.connect(ctx.destination);

    bus = { input: inputNode, master };
    return bus;
  }

  function duck(){
    if(!bus) return;
    const t = ctx.currentTime;
    const m = bus.master.gain;
    m.cancelScheduledValues(t);
    m.setValueAtTime(m.value, t);
    m.linearRampToValueAtTime(0.0001, t + 0.03);
    m.linearRampToValueAtTime(0.7,    t + 0.08);
  }

  function fmBell({ freq, modRatio=2, modIndex=200, start=0, dur=1.5, peak=0.08 }){
    const now = ctx.currentTime + start;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const g = ctx.createGain();
    car.type='sine'; mod.type='sine';
    car.frequency.value = freq;
    mod.frequency.value = freq * modRatio;
    modGain.gain.value = modIndex;
    modGain.gain.exponentialRampToValueAtTime(0.001, now + dur*0.7);
    mod.connect(modGain); modGain.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    car.connect(g); g.connect(bus.input);
    mod.start(now); car.start(now);
    mod.stop(now + dur + 0.05); car.stop(now + dur + 0.05);
  }

  // 水滴鈴主音色
  function playWaterBell(){
    if(!enabled) return;
    if(!ensureCtx()) return;
    if(!getBus()) return;

    const nowT = ctx.currentTime;
    if(nowT - lastTrigger < 0.25) duck();
    lastTrigger = nowT;

    fmBell({ freq:1568, modRatio:3.5, modIndex:600, dur:0.6, peak:0.10 });
    fmBell({ freq:2349, modRatio:2.0, modIndex:300, start:0.04, dur:0.4, peak:0.04 });
  }

  // 暴露為全局，方便別處呼叫
  window.PCBell = {
    play: playWaterBell,
    enable: () => { enabled = true; try{ localStorage.setItem('pc_sound','1'); }catch(e){} },
    disable: () => { enabled = false; try{ localStorage.setItem('pc_sound','0'); }catch(e){} },
    isEnabled: () => enabled,
  };

  // 自動綁定：所有 .tab-btn / .tab-dropdown-item / data-bell="1" 元素
  function bindAll(){
    const selectors = '.tab-btn, .tab-dropdown-item, [data-bell]';
    document.querySelectorAll(selectors).forEach(el => {
      if(el.__bellBound) return;
      el.__bellBound = true;
      el.addEventListener('click', playWaterBell, { capture:false });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }

  // 動態插入的元素也要綁（observer）
  const obs = new MutationObserver(() => bindAll());
  obs.observe(document.documentElement, { childList:true, subtree:true });
})();
