/* ============================================================
   Экраны: главная, алфавит, карточка буквы, игровой экран,
   результаты. Здесь же — оболочка запуска мини-игр.
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;

  const screens = {
    letterIndex: 0,
    overlayOpen: false,
    lastGameId: null,
    _cleanup: null,
    _finished: false,

    init() {
      this.buildHome();
      this.buildAlphabet();
      this.bindLetterOverlay();
      this.bindAlphabetPlay();
      this.bindShell();
    },

    /* ---------------- главная ---------------- */

    buildHome() {
      const grid = document.getElementById("gamesGrid");
      if (!grid) return;

      grid.innerHTML = ABC.GAME_LIST.map((game) => {
        const best = ABC.store.data.best[game.id];
        const meta = best ? "Лучший результат: " + best + "%" : game.meta;
        return (
          '<button class="game-card" type="button" data-game="' + game.id + '" ' +
            'style="--accent:' + game.accent + ";--tint:" + game.tint + '">' +
            '<span class="game-emoji">' + game.emoji + "</span>" +
            '<span class="game-title">' + game.title + "</span>" +
            '<span class="game-desc">' + game.desc + "</span>" +
            '<span class="game-meta">' + meta + "</span>" +
          "</button>"
        );
      }).join("");
    },

    refreshHomeMeta() {
      u.qsa("[data-game]", document.getElementById("gamesGrid")).forEach((card) => {
        const game = ABC.GAME_LIST.filter((item) => item.id === card.getAttribute("data-game"))[0];
        if (!game) return;
        const best = ABC.store.data.best[game.id];
        const meta = card.querySelector(".game-meta");
        if (meta) meta.textContent = best ? "Лучший результат: " + best + "%" : game.meta;
      });
    },

    updateStats() {
      const learned = ABC.store.learnedCount();
      const traced = ABC.store.tracedCount();
      const stars = ABC.store.data.stars;

      const setText = (key, value) => {
        const node = document.querySelector('[data-stat="' + key + '"]');
        if (node) node.textContent = value;
      };
      const setBar = (key, percent) => {
        const node = document.querySelector('[data-stat-bar="' + key + '"]');
        if (node) node.style.width = u.clamp(percent, 0, 100) + "%";
      };

      setText("learned", learned);
      setText("traced", traced);
      setText("stars", stars);
      setBar("learned", (learned / ABC.LETTERS.length) * 100);
      setBar("traced", (traced / ABC.LETTERS.length) * 100);
      setBar("stars", (stars / 60) * 100);

      this.updateStarPill(stars);

      const traceCount = document.getElementById("traceCount");
      if (traceCount) traceCount.textContent = traced;
      const traceBar = document.getElementById("traceBar");
      if (traceBar) traceBar.style.width = (traced / ABC.LETTERS.length) * 100 + "%";

      this.refreshHomeMeta();
      this.updateSoundButton();
    },

    updateStarPill(stars) {
      const pill = document.getElementById("starCounter");
      if (!pill) return;
      const value = pill.querySelector("b");
      if (value) value.textContent = stars;

      if (this._lastStars != null && stars > this._lastStars) {
        pill.classList.remove("pulse");
        void pill.offsetWidth;
        pill.classList.add("pulse");
      }
      this._lastStars = stars;
    },

    updateSoundButton() {
      const btn = document.getElementById("soundToggle");
      if (!btn) return;
      const on = ABC.store.data.sound !== false;
      btn.textContent = on ? "🔊" : "🔇";
      btn.classList.toggle("is-muted", !on);
      btn.setAttribute("aria-label", on ? "Выключить звук" : "Включить звук");
      btn.title = on ? "Звук включён" : "Звук выключен";
    },

    /* ---------------- алфавит ---------------- */

    buildAlphabet() {
      const grid = document.getElementById("alphabetGrid");
      if (!grid) return;

      grid.innerHTML = ABC.LETTERS.map(
        (item, index) =>
          '<button class="letter-tile' +
            (ABC.store.data.learned.indexOf(item.l) !== -1 ? " is-learned" : "") +
            '" type="button" data-letter="' + item.l + '" data-index="' + index + '">' +
            '<span class="lt-upper">' + item.l + "</span>" +
            '<span class="lt-lower">' + item.l.toLowerCase() + "</span>" +
            '<span class="lt-emoji">' + item.emoji + "</span>" +
          "</button>"
      ).join("");

      grid.addEventListener("click", (event) => {
        const tile = event.target.closest("[data-index]");
        if (!tile) return;
        this.openLetter(Number(tile.getAttribute("data-index")));
      });
    },

    openAlphabet() {
      ABC.speech.cancel();
      this.clearSpeaking();
      ABC.ui.showScreen("alphabet");
    },

    clearSpeaking() {
      u.qsa(".letter-tile.is-speaking").forEach((tile) => {
        tile.classList.remove("is-speaking");
      });
    },

    openLetter(index) {
      const total = ABC.LETTERS.length;
      this.clearSpeaking();
      this.letterIndex = ((index % total) + total) % total;
      const item = ABC.LETTERS[this.letterIndex];

      const big = document.getElementById("letterBig");
      big.innerHTML =
        "<span>" + item.l + "</span><small>" + item.l.toLowerCase() + "</small>";

      document.getElementById("letterName").textContent = item.ipa + " · «" + item.name + "»";
      document.getElementById("letterWord").textContent = item.word;
      document.getElementById("letterRu").textContent = item.ru;
      document.getElementById("letterEmoji").textContent = item.emoji;
      document.getElementById("letterPos").textContent =
        this.letterIndex + 1 + " / " + total;

      const overlay = document.getElementById("letterOverlay");
      if (overlay.hidden) {
        overlay.hidden = false;
        document.body.classList.add("is-locked");
        this.overlayOpen = true;
      }

      const tile = document.querySelector(
        '.letter-tile[data-letter="' + item.l + '"]'
      );
      if (tile) tile.classList.add("is-learned");

      const isNew = ABC.store.learn(item.l);
      if (isNew) {
        ABC.store.addStars(1);
        ABC.ui.toast("Буква " + item.l + " изучена · +1 ⭐");
      }

      ABC.speech.sayLetter(item.l);
    },

    closeLetter() {
      const overlay = document.getElementById("letterOverlay");
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      this.overlayOpen = false;
      if (!this.isAnyOverlayOpen()) document.body.classList.remove("is-locked");
      ABC.speech.cancel();
    },

    isAnyOverlayOpen() {
      const letter = document.getElementById("letterOverlay");
      const about = document.getElementById("aboutOverlay");
      return (
        (letter && !letter.hidden) || (about && !about.hidden)
      );
    },

    bindLetterOverlay() {
      const overlay = document.getElementById("letterOverlay");
      if (!overlay) return;

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) this.closeLetter();
      });
      document.querySelector("[data-close-letter]").addEventListener("click", () => {
        this.closeLetter();
      });
      document.getElementById("letterPrev").addEventListener("click", () => {
        this.openLetter(this.letterIndex - 1);
      });
      document.getElementById("letterNext").addEventListener("click", () => {
        this.openLetter(this.letterIndex + 1);
      });

      const speakLetter = () => {
        const item = ABC.LETTERS[this.letterIndex];
        ABC.speech.sayLetter(item.l);
      };
      const speakWord = () => {
        const item = ABC.LETTERS[this.letterIndex];
        ABC.speech.sayWord(item.word);
      };

      document.getElementById("sayLetterBtn").addEventListener("click", speakLetter);
      document.getElementById("sayWordBtn").addEventListener("click", speakWord);
    },

    bindAlphabetPlay() {
      const btn = document.getElementById("playAlphabet");
      if (!btn) return;

      btn.addEventListener("click", () => {
        if (!ABC.speech.supported) {
          ABC.ui.toast("Браузер не поддерживает озвучку 😔");
          return;
        }
        if (!ABC.speech.enabled()) {
          ABC.ui.toast("Сначала включи звук 🔈");
          return;
        }

        ABC.speech.cancel();
        ABC.LETTERS.forEach((item) => {
          const tile = document.querySelector(
            '.letter-tile[data-letter="' + item.l + '"]'
          );
          const utter = ABC.speech.utterance(item.l, { rate: 0.6 });
          if (!utter) return;
          utter.onstart = () => tile && tile.classList.add("is-speaking");
          utter.onend = () => tile && tile.classList.remove("is-speaking");
          window.speechSynthesis.speak(utter);
        });
        ABC.ui.toast("Слушай алфавит и повторяй вслух 🎧", 2600);
      });
    },

    /* ---------------- игровой экран ---------------- */

    bindShell() {
      document.getElementById("gameBack").addEventListener("click", () => {
        this.stopGame();
        ABC.speech.cancel();
        ABC.ui.showScreen("home");
      });

      document.getElementById("resultsRetry").addEventListener("click", () => {
        if (this.lastGameId) this.startGame(this.lastGameId);
      });

      document.getElementById("resultsHome").addEventListener("click", () => {
        ABC.speech.cancel();
        ABC.ui.showScreen("home");
      });
    },

    startGame(id) {
      const meta = ABC.GAME_LIST.filter((game) => game.id === id)[0];
      if (!meta) return;

      if (meta.kind === "alphabet") {
        this.openAlphabet();
        return;
      }
      if (meta.kind === "trace") {
        ABC.trace.open();
        return;
      }
      if (!ABC.games[id]) return;

      this.stopGame();
      this.lastGameId = id;
      this._finished = false;

      ABC.ui.showScreen("game");

      document.getElementById("gameTitle").textContent = meta.title;
      document.getElementById("gameSubtitle").textContent = meta.desc;
      document.getElementById("gameScore").textContent = "⭐ 0";
      document.getElementById("gameBar").style.width = "0%";

      const stage = document.getElementById("gameStage");
      stage.innerHTML = "";

      const timers = new Set();
      this._cleanup = () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
      };

      const self = this;
      const ctx = {
        stage: stage,

        setScore(value) {
          document.getElementById("gameScore").textContent = "⭐ " + value;
        },

        setProgress(done, total) {
          const percent = total ? (done / total) * 100 : 0;
          document.getElementById("gameBar").style.width =
            u.clamp(percent, 0, 100) + "%";
        },

        timeout(fn, ms) {
          const timer = window.setTimeout(() => {
            timers.delete(timer);
            if (stage.isConnected && ABC.ui.isScreen("game")) fn();
          }, ms);
          timers.add(timer);
          return timer;
        },

        finish(result) {
          if (self._finished || !stage.isConnected) return;
          self._finished = true;
          self.finishGame(id, result);
        }
      };

      ABC.games[id].start(ctx);
    },

    stopGame() {
      if (this._cleanup) {
        this._cleanup();
        this._cleanup = null;
      }
    },

    finishGame(id, result) {
      const meta = ABC.GAME_LIST.filter((game) => game.id === id)[0] || {};
      this.lastGameId = id;
      const total = result.total || 1;
      const percent = Math.round((result.score / total) * 100);
      const stars =
        typeof result.stars === "number"
          ? result.stars
          : percent >= 90
          ? 3
          : percent >= 70
          ? 2
          : percent >= 50
          ? 1
          : 0;

      this.stopGame();
      ABC.store.addStars(stars);
      ABC.store.best(id, percent);

      const titles = {
        3: ["Отличная работа!", "Ты настоящий знаток алфавита!"],
        2: ["Здорово получилось!", "Ещё немного — и будет отлично!"],
        1: ["Хорошая попытка!", "Повтори игру, чтобы заработать больше звёзд."],
        0: ["Не сдавайся!", "Попробуй ещё раз — всё получится!"]
      };
      const emojis = { 3: "🏆", 2: "🌟", 1: "👍", 0: "💪" };
      const title = titles[stars];

      document.getElementById("resultsEmoji").textContent = emojis[stars];
      document.getElementById("resultsTitle").textContent = title[0];
      document.getElementById("resultsSub").textContent =
        meta.title + " · правильно " + result.score + " из " + total + " (" + percent + "%)";

      document.getElementById("resultsStars").innerHTML = [0, 1, 2]
        .map((i) => '<span class="' + (i < stars ? "" : "off") + '">⭐</span>')
        .join("");

      document.getElementById("resultsExtra").textContent =
        (result.extra ? result.extra + " · " : "") + "Награда: +" + stars + " ⭐";

      ABC.ui.showScreen("results");

      if (stars >= 2) {
        window.setTimeout(() => ABC.confetti.fire(80), 150);
      }
      if (stars >= 1) {
        ABC.sfx.win();
      }
    }
  };

  ABC.screens = screens;
})();
