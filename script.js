(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const orb       = $('orb');
  const orbGlyph  = $('orbGlyph');
  const prophecy  = $('prophecy');
  const sig       = $('sig');
  const form      = $('askForm');
  const input     = $('askInput');
  const askBtn    = $('askBtn');
  const rerollBtn = $('rerollBtn');
  const shareBtn  = $('shareBtn');
  const muteBtn   = $('muteBtn');
  const toast     = $('toast');
  const canvas    = $('shareCanvas');

  // ---- Oracle corpus ------------------------------------------------------
  const openers = [
    'the orb hums.',
    'a comet whispers.',
    'the void clears its throat.',
    'three moons align, briefly.',
    'from behind the curtain:',
    'a static-filled transmission:',
    'the cards say nothing, but the orb says:',
    'the answer arrives, damp and unbidden:',
    'an unseen goat bleats in approval.',
    'the orb exhales glitter.',
  ];

  const verbs = [
    'befriend', 'anoint', 'outrun', 'mail', 'rotate', 'negotiate with',
    'gently betray', 'rename', 'photograph', 'bless', 'unclasp',
    're-parent', 'decline', 'escort', 'refactor', 'serenade',
    'unionize', 'barter with', 'forgive', 'pickle', 'unplug',
    'summon', 'decline politely', 'haunt', 'soft-launch',
  ];

  const nouns = [
    'the third most trustworthy lamp',
    'a slightly wet envelope',
    'your oldest grudge',
    'a raccoon with opinions',
    'the Tuesday version of yourself',
    'every unread group chat',
    'an accountant named Brenda',
    'the group project you escaped in 2014',
    'a future houseplant',
    'the person you almost became',
    'your manager, metaphorically',
    'a pigeon of great importance',
    'the ceiling fan above you',
    'a single, committed spreadsheet',
    'the receipt in your coat from last winter',
    'a stranger\'s very good dog',
    'the concept of "inbox zero"',
    'your unsent drafts folder',
    'the meeting that could have been an email',
    'a perfectly ripe pear',
  ];

  const kickers = [
    'before sundown.',
    'but only in parentheses.',
    'gently, like a secret.',
    'with the lights off.',
    'with full corporate approval.',
    'without telling Gary.',
    'in the group chat, first.',
    'for exactly 11 minutes.',
    'and then nap.',
    'loudly, and on purpose.',
    'while pretending it was their idea.',
    'in a low, conspiratorial tone.',
    'until the vibes recalibrate.',
    'before the next full moon.',
    'while maintaining eye contact with the ceiling.',
  ];

  const omens = [
    'expect a small, useful inconvenience by Thursday.',
    'beware anyone overly confident about spreadsheets.',
    'the color yellow is suspiciously aligned with you today.',
    'you will mishear something important and it will help.',
    'a door you forgot about will quietly reopen.',
    'trust the second idea, not the first.',
    'someone is about to apologize; let them finish.',
    'your next good decision arrives disguised as a snack.',
    'a slight delay now prevents a large regret later.',
    'do not trust round numbers this week.',
  ];

  const signatures = [
    'signed — the orb',
    'filed under: probably',
    'transmission #' ,
    'veracity: questionable',
    'decree of the pink moon',
    'on behalf of the committee of vibes',
    'per the archive of loose ends',
  ];

  const glyphs = ['◎','✶','☍','⚚','☽','✷','⟁','✺','❂','☌','♆','∰'];

  // Simple seeded RNG so the same question yields the same prophecy (stable).
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  function buildProphecy(question, salt = 0) {
    const seed = hash(question.trim().toLowerCase() + '|' + salt);
    const rng = mulberry32(seed);

    const opener = pick(rng, openers);
    const verb   = pick(rng, verbs);
    const noun   = pick(rng, nouns);
    const kicker = pick(rng, kickers);
    const omen   = pick(rng, omens);
    const glyph  = pick(rng, glyphs);

    const directive = `you must ${verb} ${noun} ${kicker}`;
    const tail = rng() < 0.55 ? ` ${omen}` : '';

    return {
      opener,
      directive,
      tail,
      glyph,
      seed,
      sig: (() => {
        const base = pick(rng, signatures);
        const needsNum = base.endsWith('#') || rng() < 0.4;
        return base + (needsNum ? (base.endsWith('#') ? '' : ' ') + Math.floor(rng() * 9000 + 1000) : '');
      })(),
    };
  }

  // ---- Starfield parallax (subtle) ----------------------------------------
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    document.getElementById('stars').style.transform = `translate(${x}px, ${y}px)`;
    orb.style.setProperty('--tiltX', `${y * 0.4}deg`);
    orb.style.setProperty('--tiltY', `${-x * 0.4}deg`);
    orb.style.transform = `rotateX(var(--tiltX)) rotateY(var(--tiltY))`;
  }, { passive: true });

  // ---- Audio -------------------------------------------------------------
  let audioCtx = null;
  let muted = false;
  function ensureAudio() {
    if (muted) return null;
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function blip(freq = 440, dur = 0.18, type = 'sine', gain = 0.08) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }
  function revealChime() {
    const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    notes.forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.06), i * 80));
  }
  function thinkingHum() {
    const ctx = ensureAudio();
    if (!ctx) return () => {};
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 110;
    g.gain.value = 0.02;
    lfo.frequency.value = 7;
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    o.connect(g); g.connect(ctx.destination);
    o.start(); lfo.start();
    return () => {
      try {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        o.stop(ctx.currentTime + 0.2);
        lfo.stop(ctx.currentTime + 0.2);
      } catch (_) {}
    };
  }

  // ---- Particle burst ----------------------------------------------------
  function burst(x, y) {
    const colors = ['#ff3ea5', '#7a5cff', '#41e8ff', '#b8ff5a', '#ffe3f2'];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'spark';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = colors[i % colors.length];
      el.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
      document.body.appendChild(el);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 80 + Math.random() * 140;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      el.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.18,.7,.3,1)' }
      ).onfinish = () => el.remove();
    }
  }

  // ---- Typewriter --------------------------------------------------------
  let typingAbort = null;
  function typeText(target, text, speed = 22) {
    return new Promise((resolve) => {
      if (typingAbort) typingAbort();
      let cancelled = false;
      typingAbort = () => { cancelled = true; };
      target.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'caret';
      target.appendChild(caret);
      let i = 0;
      function step() {
        if (cancelled) return;
        if (i < text.length) {
          caret.insertAdjacentText('beforebegin', text[i]);
          if (text[i] !== ' ' && Math.random() < 0.35) blip(880 + Math.random() * 320, 0.04, 'square', 0.015);
          i++;
          setTimeout(step, speed + (Math.random() * 18 - 9));
        } else {
          caret.remove();
          resolve();
        }
      }
      step();
    });
  }

  // ---- Toast -------------------------------------------------------------
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // ---- Core flow ---------------------------------------------------------
  let lastQuestion = '';
  let lastSalt = 0;

  async function consult(question, { salt = 0, fromReroll = false } = {}) {
    if (!question) return;
    lastQuestion = question;
    lastSalt = salt;

    askBtn.disabled = true;
    rerollBtn.disabled = true;
    shareBtn.disabled = true;
    sig.classList.remove('show');

    // Thinking state
    orb.classList.add('thinking');
    const stopHum = thinkingHum();

    // Quick glitch flicker on glyph
    const glitchChars = '◎✶☍⚚☽✷⟁✺❂♆∰?!§Ω∆';
    let g = 0;
    const flickerId = setInterval(() => {
      orbGlyph.textContent = glitchChars[(g++ + Math.floor(Math.random() * 12)) % glitchChars.length];
    }, 55);

    // Burst at orb
    const rect = orb.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);

    await wait(fromReroll ? 700 : 1100);

    clearInterval(flickerId);
    stopHum();
    orb.classList.remove('thinking');

    const p = buildProphecy(question, salt);
    orbGlyph.textContent = p.glyph;
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    revealChime();

    const line = `${capitalize(p.opener)} ${p.directive}${p.tail}`;
    await typeText(prophecy, line, 18);

    sig.textContent = p.sig;
    sig.classList.add('show');

    askBtn.disabled = false;
    rerollBtn.disabled = false;
    shareBtn.disabled = false;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ---- Form handlers -----------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    consult(q, { salt: 0 });
  });

  rerollBtn.addEventListener('click', () => {
    if (!lastQuestion) return;
    lastSalt += 1;
    consult(lastQuestion, { salt: lastSalt, fromReroll: true });
  });

  orb.addEventListener('click', () => {
    const rect = orb.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    blip(520 + Math.random() * 300, 0.1, 'sine', 0.05);
  });

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.textContent = muted ? '🔇 sound: off' : '🔊 sound: on';
    if (muted && audioCtx) { try { audioCtx.suspend(); } catch (_) {} }
    if (!muted && audioCtx) { try { audioCtx.resume(); } catch (_) {} }
  });

  // ---- Share: render a card to canvas and copy/download ------------------
  function drawShareCard() {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    // background gradient
    const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 50, W * 0.5, H * 0.4, W * 0.7);
    g.addColorStop(0, '#2a0a5c');
    g.addColorStop(0.6, '#0b0620');
    g.addColorStop(1, '#05020d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.4;
      ctx.globalAlpha = 0.3 + Math.random() * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // orb
    const ox = W * 0.22, oy = H * 0.55, or = 150;
    const orbGrad = ctx.createRadialGradient(ox - 40, oy - 50, 10, ox, oy, or);
    orbGrad.addColorStop(0, '#ffe3f2');
    orbGrad.addColorStop(0.25, '#ff3ea5');
    orbGrad.addColorStop(0.6, '#7a5cff');
    orbGrad.addColorStop(1, '#160538');
    ctx.fillStyle = orbGrad;
    ctx.shadowColor = 'rgba(255, 62, 165, 0.55)';
    ctx.shadowBlur = 80;
    ctx.beginPath();
    ctx.arc(ox, oy, or, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // brand
    ctx.fillStyle = '#fff';
    ctx.font = '700 28px "JetBrains Mono", Menlo, monospace';
    ctx.fillText('◎  CHAOS ORB', 60, 80);
    ctx.fillStyle = '#a295c7';
    ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('an oracle of dubious wisdom', 60, 112);

    // question
    ctx.fillStyle = '#a295c7';
    ctx.font = '500 18px "JetBrains Mono", Menlo, monospace';
    wrapText(ctx, `Q: ${lastQuestion}`, 460, 210, 680, 26);

    // prophecy
    ctx.fillStyle = '#fff';
    ctx.font = '400 36px "Cormorant Garamond", Georgia, serif';
    const text = prophecy.textContent.replace(/\s+/g, ' ').trim();
    wrapText(ctx, text, 460, 300, 680, 46);

    // footer
    ctx.fillStyle = '#a295c7';
    ctx.font = '500 14px "JetBrains Mono", Menlo, monospace';
    ctx.fillText('chaos-orb', 60, H - 60);
    ctx.fillText(sig.textContent || '', 460, H - 60);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }

  shareBtn.addEventListener('click', async () => {
    drawShareCard();
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('share card copied to clipboard');
          return;
        }
      } catch (_) { /* fall through */ }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chaos-orb.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('share card downloaded');
    }, 'image/png');
  });

  // ---- Seed a greeting prophecy on first keystroke or click --------------
  input.addEventListener('focus', () => {
    if (!orbGlyph.dataset.ready) {
      orbGlyph.textContent = '◎';
      orbGlyph.dataset.ready = '1';
    }
  });

  // ---- Enter key submit convenience --------------------------------------
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // default submit works
    }
  });

  // Prefill a playful placeholder rotation
  const placeholders = [
    'type your question…',
    'should I send it?',
    'what do I owe the universe today?',
    'will this meeting end me?',
    'should I start the thing?',
    'is it a pasta night?',
  ];
  let phIdx = 0;
  setInterval(() => {
    if (document.activeElement === input || input.value) return;
    phIdx = (phIdx + 1) % placeholders.length;
    input.placeholder = placeholders[phIdx];
  }, 3200);
})();
