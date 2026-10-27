/* ============================================================
   Игра «Собери слово»: составление английского слова по картинке
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const TOTAL = 8;

  ABC.games = ABC.games || {};

  ABC.games.word = {
    start(ctx) {
      const words = u.shuffle(ABC.WORDS).slice(0, TOTAL);
      let index = 0;
      let score = 0;
      let locked = false;

      let current = null;
      let letters = [];
      let tiles = [];
      let placed = [];

      ctx.setScore(0);
      ctx.setProgress(0, TOTAL);

      function buildRound() {
        if (index >= TOTAL) {
          ctx.finish({ score, total: TOTAL });
          return;
        }

        locked = false;
        current = words[index];
        letters = current.w.split("");
        placed = new Array(letters.length).fill(null);
        tiles = u.shuffle(
          letters.map((ch, i) => ({ ch, i, used: false }))
        );

        ctx.stage.innerHTML =
          '<div class="word-prompt">' +
            '<div class="word-emoji">' + current.emoji + "</div>" +
            '<div class="word-ru">' + current.ru + "</div>" +
            '<div class="word-ghost" data-ghost></div>' +
          "</div>" +
          '<div class="word-slots" data-slots></div>' +
          '<div class="word-tiles" data-tiles></div>' +
          '<div class="word-tools">' +
            '<button class="btn btn-soft" type="button" data-hint>💡 Подсказка</button>' +
            '<button class="btn btn-soft" type="button" data-say>🔊 Слово</button>' +
          "</div>";

        const slotsBox = ctx.stage.querySelector("[data-slots]");
        const tilesBox = ctx.stage.querySelector("[data-tiles]");
        const ghost = ctx.stage.querySelector("[data-ghost]");

        function drawSlots() {
          slotsBox.innerHTML = placed
            .map((tile, i) => {
              const filled = !!tile;
              return (
                '<button class="word-slot' + (filled ? " is-filled" : "") +
                '" type="button" data-slot="' + i + '" aria-label="Ячейка ' + (i + 1) + '">' +
                (filled ? tile.ch : "") +
                "</button>"
              );
            })
            .join("");
        }

        function drawTiles() {
          tilesBox.innerHTML = tiles
            .map(
              (tile) =>
                '<button class="letter-tile-btn" type="button" data-tile="' + tile.i +
                '"' + (tile.used ? " disabled" : "") + ">" + tile.ch + "</button>"
            )
            .join("");
        }

        function paint() {
          drawSlots();
          drawTiles();
        }

        function takeTile(tileId) {
          if (locked) return;
          const tile = tiles.filter((t) => t.i === tileId)[0];
          if (!tile || tile.used) return;
          const free = placed.indexOf(null);
          if (free === -1) return;

          placed[free] = tile;
          tile.used = true;
          ABC.sfx.click();
          paint();

          if (placed.indexOf(null) === -1) {
            checkWord();
          }
        }

        function returnTile(slotIndex) {
          if (locked) return;
          const tile = placed[slotIndex];
          if (!tile) return;
          tile.used = false;
          placed[slotIndex] = null;
          ABC.sfx.click();
          paint();
        }

        function checkWord() {
          const answer = placed.map((tile) => tile.ch).join("");
          if (answer === current.w) {
            locked = true;
            score += 1;
            ctx.setScore(score);
            ABC.sfx.correct();
            const nodes = u.qsa("[data-slot]", slotsBox);
            nodes.forEach((node) => node.classList.add("is-correct"));
            ctx.timeout(() => ABC.confetti.fire(45), 120);
            ABC.speech.sayWord(current.w);
            ctx.timeout(() => {
              index += 1;
              ctx.setProgress(index, TOTAL);
              buildRound();
            }, 1400);
          } else {
            locked = true;
            ABC.sfx.wrong();
            slotsBox.classList.add("is-wrong");
            ctx.timeout(() => {
              placed = new Array(letters.length).fill(null);
              tiles.forEach((tile) => { tile.used = false; });
              slotsBox.classList.remove("is-wrong");
              locked = false;
              paint();
            }, 780);
          }
        }

        slotsBox.addEventListener("click", (event) => {
          const slot = event.target.closest("[data-slot]");
          if (!slot) return;
          returnTile(Number(slot.getAttribute("data-slot")));
        });

        tilesBox.addEventListener("click", (event) => {
          const tile = event.target.closest("[data-tile]");
          if (!tile) return;
          takeTile(Number(tile.getAttribute("data-tile")));
        });

        ctx.stage.querySelector("[data-hint]").addEventListener("click", () => {
          ghost.textContent = current.w;
          ghost.classList.add("is-visible");
          ABC.speech.sayWord(current.w);
          ABC.sfx.pop();
          ctx.timeout(() => ghost.classList.remove("is-visible"), 2600);
        });

        ctx.stage.querySelector("[data-say]").addEventListener("click", () => {
          ABC.speech.sayWord(current.w);
        });

        paint();
        ctx.setProgress(index, TOTAL);
        ctx.timeout(() => ABC.speech.sayWord(current.w), 500);
      }

      buildRound();
    }
  };
})();
