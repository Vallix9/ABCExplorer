/* ============================================================
   Точка входа: инициализация, навигация, модальные окна
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const screens = ABC.screens;

  /* ---------------- фоновая декорация ---------------- */

  function buildDecor() {
    const decor = document.getElementById("bgDecor");
    if (!decor) return;

    const chars = "AbCdEfGhIjKlMnOpQrStUvWxYz".split("");
    decor.innerHTML = chars
      .map((ch) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const size = 34 + Math.random() * 66;
        const duration = 9 + Math.random() * 8;
        const delay = -Math.random() * 14;
        return (
          '<span style="top:' + top.toFixed(1) + "%;left:" + left.toFixed(1) +
          "%;font-size:" + size.toFixed(0) + "px;animation-duration:" + duration.toFixed(1) +
          "s;animation-delay:" + delay.toFixed(1) + 's">' + ch + "</span>"
        );
      })
      .join("");
  }

  /* ---------------- «О проекте» ---------------- */

  function openAbout() {
    const overlay = document.getElementById("aboutOverlay");
    if (!overlay) return;
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    ABC.speech.cancel();
  }

  function closeAbout() {
    const overlay = document.getElementById("aboutOverlay");
    if (!overlay) return;
    overlay.hidden = true;
    if (!screens.isAnyOverlayOpen()) {
      document.body.classList.remove("is-locked");
    }
  }

  /* ---------------- навигация ---------------- */

  function goHome() {
    screens.stopGame();
    ABC.speech.cancel();
    closeAbout();
    screens.closeLetter();
    ABC.ui.showScreen("home");
  }

  function handleNav(target) {
    if (target === "home") {
      goHome();
    } else if (target === "alphabet") {
      closeAbout();
      screens.openAlphabet();
    } else if (target === "trace") {
      closeAbout();
      ABC.trace.open();
    }
  }

  /* ---------------- сброс прогресса ---------------- */

  function resetProgress() {
    const ok = window.confirm(
      "Сбросить весь прогресс? Звёзды, изученные и обведённые буквы будут удалены."
    );
    if (!ok) return;

    ABC.store.reset();
    u.qsa(".letter-tile.is-learned").forEach((tile) => {
      tile.classList.remove("is-learned");
    });
    ABC.screens.buildHome();
    screens.updateStats();
    ABC.ui.toast("Прогресс сброшен. Начинаем с чистого листа! 🌱");
  }

  /* ---------------- звук ---------------- */

  function toggleSound() {
    const next = !ABC.store.data.sound;
    ABC.store.data.sound = next;
    ABC.store.save();
    ABC.store.emit();
    if (!next) ABC.speech.cancel();
    ABC.ui.toast(next ? "Звук включён 🔊" : "Звук выключен 🔇");
  }

  /* ---------------- инициализация ---------------- */

  function bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-nav]");
      if (nav) {
        event.preventDefault();
        handleNav(nav.getAttribute("data-nav"));
        return;
      }

      const gameCard = event.target.closest("[data-game]");
      if (gameCard) {
        ABC.sfx.click();
        screens.startGame(gameCard.getAttribute("data-game"));
        return;
      }

      if (event.target.closest("[data-open-about]")) {
        openAbout();
        return;
      }

      if (event.target.closest("[data-scroll-games]")) {
        const section = document.getElementById("gamesGrid");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (event.target.closest("[data-close-about]")) {
        closeAbout();
        return;
      }

      if (event.target.closest("[data-close-letter]")) {
        screens.closeLetter();
        return;
      }

      const aboutOverlay = document.getElementById("aboutOverlay");
      if (event.target === aboutOverlay) {
        closeAbout();
      }
    });

    const aboutBtn = document.getElementById("aboutBtn");
    if (aboutBtn) aboutBtn.addEventListener("click", openAbout);

    const soundBtn = document.getElementById("soundToggle");
    if (soundBtn) soundBtn.addEventListener("click", toggleSound);

    const resetBtn = document.getElementById("resetProgress");
    if (resetBtn) resetBtn.addEventListener("click", resetProgress);

    document.addEventListener("keydown", (event) => {
      const aboutOpen = !document.getElementById("aboutOverlay").hidden;

      if (event.key === "Escape") {
        if (screens.overlayOpen) {
          screens.closeLetter();
        } else if (aboutOpen) {
          closeAbout();
        } else if (ABC.ui.isScreen("game")) {
          goHome();
        }
        return;
      }

      if (screens.overlayOpen) {
        if (event.key === "ArrowLeft") {
          screens.openLetter(screens.letterIndex - 1);
        } else if (event.key === "ArrowRight") {
          screens.openLetter(screens.letterIndex + 1);
        }
      }
    });

    document.addEventListener("abc:progress", () => {
      screens.updateStats();
    });

    /* первый жест — разрешение на звук в браузере */
    document.addEventListener(
      "pointerdown",
      () => {
        ABC.sfx.ensure();
      },
      { once: true }
    );
  }

  function init() {
    buildDecor();
    ABC.store.load();
    ABC.speech.init();
    screens.init();
    ABC.trace.init();
    bindGlobalEvents();
    screens.updateStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
