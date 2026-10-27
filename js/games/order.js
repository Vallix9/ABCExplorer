/* ============================================================
   Игра «По порядку»: расстановка букв по алфавиту
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const SETS = 6;
  const SIZE = 5;

  ABC.games = ABC.games || {};

  ABC.games.order = {
    start(ctx) {
      const starts = u.shuffle(
        Array.from({ length: ABC.ALPHABET.length - SIZE + 1 }, (_, i) => i)
      ).slice(0, SETS);

      let setIndex = 0;
      let score = 0;
      let expected = 0;
      let sorted = [];
      let placed = [];
      let locked = false;

      ctx.setScore(0);
      ctx.setProgress(0, SETS);

      function buildSet() {
        if (setIndex >= SETS) {
          ctx.finish({ score, total: SETS });
          return;
        }

        locked = false;
        expected = 0;
        sorted = ABC.ALPHABET.slice(starts[setIndex], starts[setIndex] + SIZE);
        placed = new Array(SIZE).fill(null);

        const tiles = u.shuffle(sorted);

        ctx.stage.innerHTML =
          '<div class="q-card">' +
            '<span class="q-label">Расставь буквы по алфавиту</span>' +
            '<div class="order-slots" data-slots></div>' +
          "</div>" +
          '<div class="order-tiles" data-tiles>' +
            tiles
              .map(
                (ch) =>
                  '<button class="letter-tile-btn" type="button" data-ch="' + ch + '">' + ch + "</button>"
              )
              .join("") +
          "</div>" +
          '<p class="hint-line">Нажимай на буквы от первой к последней: ' +
          sorted[0] + " → " + sorted[SIZE - 1] + "</p>";

        const slotsBox = ctx.stage.querySelector("[data-slots]");
        const tilesBox = ctx.stage.querySelector("[data-tiles]");

        function drawSlots() {
          slotsBox.innerHTML = placed
            .map((ch, i) => {
              const filled = !!ch;
              return (
                '<div class="order-slot' + (filled ? " is-filled" : "") + '">' +
                (filled ? ch : "·") +
                "</div>"
              );
            })
            .join("");
        }

        tilesBox.addEventListener("click", (event) => {
          const btn = event.target.closest("[data-ch]");
          if (!btn || locked || btn.disabled) return;

          const ch = btn.getAttribute("data-ch");

          if (ch === sorted[expected]) {
            btn.disabled = true;
            placed[expected] = ch;
            expected += 1;
            ABC.sfx.pop();
            drawSlots();

            if (expected === SIZE) {
              locked = true;
              score += 1;
              ctx.setScore(score);
              ABC.sfx.win();
              ABC.confetti.fire(50);
              ctx.timeout(() => {
                setIndex += 1;
                ctx.setProgress(setIndex, SETS);
                buildSet();
              }, 1150);
            }
          } else {
            ABC.sfx.wrong();
            btn.classList.add("shake");
            ctx.timeout(() => btn.classList.remove("shake"), 450);
          }
        });

        drawSlots();
        ctx.setProgress(setIndex, SETS);
      }

      buildSet();
    }
  };
})();
