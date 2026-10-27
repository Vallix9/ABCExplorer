/* ============================================================
   Ядро игры: утилиты, прогресс, озвучка, звуки, конфетти, UI
   ============================================================ */

(function () {
  const ABC = window.ABC;

  /* ---------------- утилиты ---------------- */

  const utils = {
    qs(sel, root) {
      return (root || document).querySelector(sel);
    },

    qsa(sel, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    },

    el(tag, className, html) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (html != null) node.innerHTML = html;
      return node;
    },

    shuffle(list) {
      const arr = list.slice();
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    },

    pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    },

    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },

    unique(list) {
      return list.filter((item, index) => list.indexOf(item) === index);
    },

    /* варианты ответа: target + похожие по начертанию буквы */
    makeOptions(letter, count) {
      const total = count || 4;
      const lower = String(letter).toLowerCase();
      const isUpper = letter === letter.toUpperCase();

      const similar = ABC.SIMILAR.filter((group) => group.indexOf(lower) !== -1);
      const pool = [];
      similar.forEach((group) => {
        group.forEach((ch) => {
          if (ch !== lower && pool.indexOf(ch) === -1) pool.push(ch);
        });
      });

      const rest = utils.shuffle(ABC.ALPHABET.filter((ch) => ch !== lower));
      for (let i = 0; i < rest.length && pool.length < total - 1; i += 1) {
        if (pool.indexOf(rest[i]) === -1) pool.push(rest[i]);
      }

      const distractors = utils.shuffle(pool).slice(0, total - 1);
      const options = [letter].concat(
        distractors.map((ch) => (isUpper ? ch.toUpperCase() : ch))
      );
      return utils.shuffle(options);
    },

    percent(part, whole) {
      if (!whole) return 0;
      return Math.round((part / whole) * 100);
    }
  };

  ABC.utils = utils;

  /* ---------------- прогресс ---------------- */

  const STORAGE_KEY = "abc-explorer-progress-v1";

  const store = {
    data: {
      stars: 0,
      learned: [],
      traced: [],
      best: {},
      sound: true
    },

    load() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== "object") return;
        this.data = {
          stars: Number(saved.stars) || 0,
          learned: Array.isArray(saved.learned) ? saved.learned : [],
          traced: Array.isArray(saved.traced) ? saved.traced : [],
          best: saved.best && typeof saved.best === "object" ? saved.best : {},
          sound: saved.sound !== false
        };
      } catch (error) {
        /* localStorage может быть недоступен (например, file:// в некоторых браузерах) */
      }
    },

    save() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (error) {
        /* работаем без сохранения — прогресс живёт до перезагрузки */
      }
    },

    emit() {
      document.dispatchEvent(new CustomEvent("abc:progress"));
      this.save();
    },

    addStars(count) {
      const amount = Number(count) || 0;
      if (amount <= 0) return;
      this.data.stars += amount;
      this.emit();
    },

    learn(letter) {
      if (this.data.learned.indexOf(letter) === -1) {
        this.data.learned.push(letter);
        this.emit();
        return true;
      }
      return false;
    },

    trace(letter) {
      if (this.data.traced.indexOf(letter) === -1) {
        this.data.traced.push(letter);
        this.emit();
        return true;
      }
      return false;
    },

    best(gameId, percent) {
      const prev = Number(this.data.best[gameId]) || 0;
      if (percent > prev) {
        this.data.best[gameId] = percent;
        this.emit();
        return true;
      }
      return false;
    },

    reset() {
      this.data = { stars: 0, learned: [], traced: [], best: {}, sound: this.data.sound };
      this.emit();
    },

    learnedCount() {
      return this.data.learned.length;
    },

    tracedCount() {
      return this.data.traced.length;
    }
  };

  ABC.store = store;

  /* ---------------- озвучка (Web Speech API) ---------------- */

  const speech = {
    supported: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined",
    voice: null,

    init() {
      if (!this.supported) return;
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        this.voice =
          voices.find((v) => /en[-_]GB/i.test(v.lang)) ||
          voices.find((v) => /en[-_]US/i.test(v.lang)) ||
          voices.find((v) => /^en/i.test(v.lang)) ||
          null;
      };
      pickVoice();
      if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
        window.speechSynthesis.onvoiceschanged = pickVoice;
      }
    },

    enabled() {
      return store.data.sound !== false;
    },

    utterance(text, options) {
      if (!this.supported) return null;
      const opts = options || {};
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      if (this.voice) u.voice = this.voice;
      u.rate = typeof opts.rate === "number" ? opts.rate : 0.82;
      u.pitch = typeof opts.pitch === "number" ? opts.pitch : 1.05;
      u.volume = 1;
      return u;
    },

    speak(text, options) {
      if (!this.supported || !this.enabled() || !text) return false;
      try {
        window.speechSynthesis.cancel();
        const u = this.utterance(text, options);
        if (!u) return false;
        window.speechSynthesis.speak(u);
        return true;
      } catch (error) {
        return false;
      }
    },

    sayLetter(letter) {
      return this.speak(letter, { rate: 0.65 });
    },

    sayWord(word) {
      return this.speak(word, { rate: 0.78 });
    },

    cancel() {
      if (!this.supported) return;
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        /* игнорируем */
      }
    }
  };

  ABC.speech = speech;

  /* ---------------- звуковые эффекты (Web Audio API) ---------------- */

  const sfx = {
    ctx: null,

    ensure() {
      if (!this.enabled()) return null;
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return null;
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
        return this.ctx;
      } catch (error) {
        return null;
      }
    },

    enabled() {
      return store.data.sound !== false;
    },

    tone(freq, delay, duration, type, volume) {
      const ctx = this.ensure();
      if (!ctx) return;
      const start = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (duration || 0.18));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + (duration || 0.18) + 0.03);
    },

    click() {
      this.tone(720, 0, 0.06, "triangle", 0.07);
    },

    pop() {
      this.tone(880, 0, 0.09, "sine", 0.09);
    },

    correct() {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => this.tone(freq, i * 0.075, 0.18, "sine", 0.11));
    },

    wrong() {
      this.tone(190, 0, 0.18, "sawtooth", 0.06);
      this.tone(140, 0.1, 0.2, "sawtooth", 0.05);
    },

    win() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => this.tone(freq, i * 0.1, 0.28, "triangle", 0.1));
    }
  };

  ABC.sfx = sfx;

  /* ---------------- конфетти ---------------- */

  const confetti = (function () {
    const colors = ["#6c5ce7", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa"];
    let canvas = null;
    let ctx = null;
    let particles = [];
    let frame = null;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensure() {
      if (canvas) return;
      canvas = document.getElementById("confetti");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      resize();
      window.addEventListener("resize", resize);
    }

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.vy += 0.14;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();

        if (p.y > window.innerHeight + 40 || p.x < -60 || p.x > window.innerWidth + 60) {
          particles.splice(i, 1);
        }
      }

      if (particles.length === 0) {
        frame = null;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        return;
      }
      frame = window.requestAnimationFrame(loop);
    }

    function fire(count) {
      ensure();
      if (!ctx) return;
      const total = count || 90;
      for (let i = 0; i < total; i += 1) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: -20 - Math.random() * window.innerHeight * 0.25,
          vx: (Math.random() - 0.5) * 4.5,
          vy: 2 + Math.random() * 3.5,
          size: 6 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.3,
          alpha: 0.85 + Math.random() * 0.15,
          round: Math.random() > 0.6
        });
      }
      if (!frame) frame = window.requestAnimationFrame(loop);
    }

    return { fire };
  })();

  ABC.confetti = confetti;

  /* ---------------- UI ---------------- */

  const ui = {
    toast(message, ms) {
      const node = document.getElementById("toast");
      if (!node) return;
      node.textContent = message;
      node.classList.add("show");
      window.clearTimeout(this._toastTimer);
      this._toastTimer = window.setTimeout(() => {
        node.classList.remove("show");
      }, ms || 2200);
    },

    showScreen(name) {
      utils.qsa(".screen").forEach((screen) => screen.classList.remove("is-active"));
      const target = document.getElementById("screen-" + name);
      if (target) target.classList.add("is-active");
      window.scrollTo(0, 0);
    },

    isScreen(name) {
      const target = document.getElementById("screen-" + name);
      return !!target && target.classList.contains("is-active");
    }
  };

  ABC.ui = ui;
})();
