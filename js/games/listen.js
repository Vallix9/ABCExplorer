/* ============================================================
   Игра «Слушай и выбирай»: узнавание буквы на слух
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const ROUNDS = 10;

  /* Буквы, которые звучат похоже по-английски */
  const SOUND_ALIKE = [
    ["b", "c", "d", "e", "g", "p", "t", "v", "z"],
    ["a", "h", "j", "k"],
    ["f", "l", "m", "n", "s", "x"],
    ["i", "y"],
    ["o", "r"],
    ["q", "u", "w"]
  ];

  function makeSoundOptions(base, count) {
    const lower = base.toLowerCase();
    const group = SOUND_ALIKE.filter((g) => g.indexOf(lower) !== -1)[0] || ABC.ALPHABET;
    const pool = u.shuffle(group.filter((ch) => ch !== lower));

    while (pool.length < count - 1) {
      const extra = u.pick(ABC.ALPHABET);
      if (extra !== lower && pool.indexOf(extra) === -1) pool.push(extra);
    }

    return u
      .shuffle([lower].concat(pool.slice(0, count - 1)))
      .map((ch) => ch.toUpperCase());
  }

  ABC.games = ABC.games || {};

  ABC.games.listen = {
    start(ctx) {
      let round = 0;
      let score = 0;
      let locked = false;

      ctx.setScore(0);
      ctx.setProgress(0, ROUNDS);

      function renderRound() {
        if (round >= ROUNDS) {
          ctx.finish({ score, total: ROUNDS });
          return;
        }

        locked = false;

        const base = u.pick(ABC.LETTERS);
        const options = makeSoundOptions(base.l, 4);
        const canPlay = ABC.speech.supported && ABC.speech.enabled();

        ctx.stage.innerHTML =
          '<div class="q-card">' +
            '<span class="q-label">Послушай и выбери букву</span>' +
            '<button class="listen-btn" type="button" data-play aria-label="Прослушать букву">🔊</button>' +
            (canPlay
              ? '<p class="hint-line">Нажми на динамик, чтобы услышать ещё раз</p>'
              : '<div class="q-target" style="font-size:64px">' + base.l + "</div>" +
                '<p class="hint-line">Звук выключен — выбери букву ' + base.l + "</p>") +
          "</div>" +
          '<div class="options" data-options>' +
            options
              .map(
                (ch) =>
                  '<button class="option-btn" type="button" data-letter="' +
                  ch +
                  '">' + ch + "</button>"
              )
              .join("") +
          "</div>";

        const playBtn = ctx.stage.querySelector("[data-play]");
        const optionNodes = u.qsa("[data-letter]", ctx.stage);

        const play = () => {
          if (!ABC.speech.sayLetter(base.l)) {
            ABC.ui.toast("Озвучка недоступна — включи звук 🔈");
            return;
          }
          playBtn.classList.add("is-playing");
          ctx.timeout(() => playBtn.classList.remove("is-playing"), 900);
        };

        playBtn.addEventListener("click", play);

        optionNodes.forEach((btn) => {
          btn.addEventListener("click", () => {
            if (locked) return;
            const chosen = btn.getAttribute("data-letter");

            if (chosen === base.l) {
              locked = true;
              ABC.sfx.correct();
              score += 1;
              ctx.setScore(score);
              optionNodes.forEach((node) => {
                node.disabled = true;
                if (node.getAttribute("data-letter") === base.l) {
                  node.classList.add("is-correct");
                }
              });
              ABC.speech.sayLetter(base.l);
              ctx.timeout(() => {
                round += 1;
                ctx.setProgress(round, ROUNDS);
                renderRound();
              }, 950);
            } else {
              btn.classList.add("is-wrong");
              btn.disabled = true;
              ABC.sfx.wrong();
            }
          });
        });

        ctx.setProgress(round, ROUNDS);
        if (canPlay) ctx.timeout(play, 450);
      }

      renderRound();
    }
  };
})();
