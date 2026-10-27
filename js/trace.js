/* ============================================================
   Прописи: обведение букв на canvas (мышь / палец / стилус)
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const TOTAL = 26;

  const trace = {
    index: 0,
    canvas: null,
    ctx: null,
    drawing: false,
    hasInk: false,
    last: null,

    init() {
      this.canvas = document.getElementById("traceCanvas");
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext("2d");
      this.bindDrawing();
      this.bindButtons();

      window.addEventListener("resize", () => {
        if (ABC.ui.isScreen("trace")) this.resize();
      });
    },

    open(index) {
      if (typeof index === "number") {
        this.index = ((index % TOTAL) + TOTAL) % TOTAL;
      }
      ABC.ui.showScreen("trace");
      this.render();
      window.requestAnimationFrame(() => this.resize());
    },

    render() {
      const item = ABC.LETTERS[this.index];

      const guide = document.getElementById("traceGuide");
      guide.innerHTML =
        '<span class="tg-upper">' + item.l + "</span>" +
        '<span class="tg-lower">' + item.l.toLowerCase() + "</span>";

      document.getElementById("traceLetter").textContent =
        item.l + item.l.toLowerCase();
      document.getElementById("tracePos").textContent =
        this.index + 1 + " / " + TOTAL;

      this.hasInk = false;
    },

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);

      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = Math.max(9, Math.min(rect.width, rect.height) * 0.035);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#6c5ce7";
      ctx.fillStyle = "#6c5ce7";

      this.hasInk = false;
    },

    clear() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.hasInk = false;
    },

    point(event) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    },

    dot(point) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    },

    bindDrawing() {
      const canvas = this.canvas;

      canvas.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (error) {
          /* игнорируем */
        }
        this.drawing = true;
        this.last = this.point(event);
        this.dot(this.last);
        this.hasInk = true;
        ABC.sfx.click();
      });

      canvas.addEventListener("pointermove", (event) => {
        if (!this.drawing || !this.last) return;
        event.preventDefault();
        const next = this.point(event);
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(this.last.x, this.last.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        this.last = next;
      });

      const stop = () => {
        this.drawing = false;
        this.last = null;
      };

      canvas.addEventListener("pointerup", stop);
      canvas.addEventListener("pointercancel", stop);
    },

    bindButtons() {
      const prev = document.getElementById("tracePrev");
      const next = document.getElementById("traceNext");
      const clear = document.getElementById("traceClear");
      const done = document.getElementById("traceDone");
      const say = document.getElementById("traceSay");

      if (prev) {
        prev.addEventListener("click", () => {
          this.index = (this.index - 1 + TOTAL) % TOTAL;
          this.clear();
          this.render();
          ABC.speech.sayLetter(ABC.LETTERS[this.index].l);
        });
      }

      if (next) {
        next.addEventListener("click", () => {
          this.index = (this.index + 1) % TOTAL;
          this.clear();
          this.render();
          ABC.speech.sayLetter(ABC.LETTERS[this.index].l);
        });
      }

      if (clear) {
        clear.addEventListener("click", () => {
          this.clear();
          ABC.sfx.click();
        });
      }

      if (say) {
        say.addEventListener("click", () => {
          ABC.speech.sayLetter(ABC.LETTERS[this.index].l);
        });
      }

      if (done) {
        done.addEventListener("click", () => this.complete());
      }
    },

    complete() {
      if (!this.hasInk) {
        ABC.ui.toast("Сначала обведи букву ✏️");
        return;
      }

      const item = ABC.LETTERS[this.index];
      const isNew = ABC.store.trace(item.l);

      if (isNew) {
        ABC.store.addStars(1);
        ABC.confetti.fire(45);
        ABC.sfx.win();
        ABC.ui.toast("Буква " + item.l + " обведена · +1 ⭐");
      } else {
        ABC.sfx.correct();
        ABC.ui.toast("Отлично! Буква " + item.l + " уже в копилке ⭐");
      }

      ABC.screens.updateStats();

      window.setTimeout(() => {
        if (!ABC.ui.isScreen("trace")) return;
        this.index = (this.index + 1) % TOTAL;
        this.clear();
        this.render();
      }, 950);
    }
  };

  ABC.trace = trace;
})();
