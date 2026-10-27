/* ============================================================
   Игра «Пары букв»: память + заглавные и строчные буквы
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const PAIRS = 6;

  ABC.games = ABC.games || {};

  ABC.games.memory = {
    start(ctx) {
      const chosen = u.shuffle(ABC.LETTERS).slice(0, PAIRS);
      const cards = u.shuffle(
        chosen.reduce((acc, base) => {
          acc.push({ ch: base.l, pair: base.l });
          acc.push({ ch: base.l.toLowerCase(), pair: base.l });
          return acc;
        }, [])
      );

      let first = null;
      let second = null;
      let locked = false;
      let matched = 0;
      let moves = 0;

      ctx.setScore(0);
      ctx.setProgress(0, PAIRS);

      ctx.stage.innerHTML =
        '<p class="memory-info" data-info>Ходов: 0 · Найдено: 0 / ' + PAIRS + "</p>" +
        '<div class="memory-grid" data-grid>' +
          cards
            .map(
              (card, i) =>
                '<button class="mem-card" type="button" data-i="' + i + '" aria-label="Карточка ' + (i + 1) + '">' +
                  '<span class="mem-inner">' +
                    '<span class="mem-face mem-front">?</span>' +
                    '<span class="mem-face mem-back">' + card.ch + "</span>" +
                  "</span>" +
                "</button>"
            )
            .join("") +
        "</div>";

      const grid = ctx.stage.querySelector("[data-grid]");
      const info = ctx.stage.querySelector("[data-info]");

      function updateInfo() {
        info.textContent = "Ходов: " + moves + " · Найдено: " + matched + " / " + PAIRS;
      }

      function cardAt(i) {
        return grid.querySelector('[data-i="' + i + '"]');
      }

      function finishGame() {
        const stars = moves <= 8 ? 3 : moves <= 12 ? 2 : 1;
        ctx.finish({
          score: matched,
          total: PAIRS,
          stars: stars,
          extra: "Ходов: " + moves
        });
      }

      function resetPair() {
        cardAt(first).classList.remove("is-flipped");
        cardAt(second).classList.remove("is-flipped");
        first = null;
        second = null;
        locked = false;
      }

      grid.addEventListener("click", (event) => {
        const btn = event.target.closest(".mem-card");
        if (!btn || locked) return;

        const i = Number(btn.getAttribute("data-i"));
        if (btn.classList.contains("is-matched") || btn.classList.contains("is-flipped")) return;

        btn.classList.add("is-flipped");
        ABC.sfx.click();

        if (first === null) {
          first = i;
          return;
        }

        second = i;
        moves += 1;
        updateInfo();
        locked = true;

        if (cards[first].pair === cards[second].pair) {
          const a = cardAt(first);
          const b = cardAt(second);
          a.classList.add("is-matched");
          b.classList.add("is-matched");
          matched += 1;
          ctx.setProgress(matched, PAIRS);
          ctx.setScore(matched);
          ABC.sfx.correct();
          first = null;
          second = null;
          locked = false;

          if (matched === PAIRS) {
            ABC.confetti.fire(70);
            ctx.timeout(finishGame, 700);
          }
        } else {
          ABC.sfx.wrong();
          ctx.timeout(resetPair, 950);
        }
      });
    }
  };
})();
