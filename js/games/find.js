/* ============================================================
   Игра «Найди букву»: соотнесение заглавной и строчной буквы
   ============================================================ */

(function () {
  const ABC = window.ABC;
  const u = ABC.utils;
  const ROUNDS = 10;

  ABC.games = ABC.games || {};

  ABC.games.find = {
    start(ctx) {
      let round = 0;
      let score = 0;
      let locked = false;
      let firstTry = true;

      ctx.setScore(0);
      ctx.setProgress(0, ROUNDS);

      function renderRound() {
        if (round >= ROUNDS) {
          ctx.finish({ score, total: ROUNDS });
          return;
        }

        locked = false;
        firstTry = true;

        const base = u.pick(ABC.LETTERS);
        const targetUpper = Math.random() < 0.5;
        const target = targetUpper ? base.l : base.l.toLowerCase();
        const optionUpper = !targetUpper;
        const answer = optionUpper ? base.l : base.l.toLowerCase();

        const options = u
          .makeOptions(base.l, 4)
          .map((ch) => (optionUpper ? ch : ch.toLowerCase()));

        ctx.stage.innerHTML =
          '<div class="q-card">' +
            '<span class="q-label">Найди такую же букву</span>' +
            '<div class="q-target">' + target + "</div>" +
            '<button class="btn btn-soft q-say" type="button" data-say>🔊 Послушать</button>' +
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
          "</div>" +
          '<p class="hint-line">Заглавная и строчная буквы — это одна и та же буква</p>';

        const sayBtn = ctx.stage.querySelector("[data-say]");
        const optionNodes = u.qsa("[data-letter]", ctx.stage);

        sayBtn.addEventListener("click", () => {
          ABC.speech.sayLetter(base.l);
        });

        optionNodes.forEach((btn) => {
          btn.addEventListener("click", () => {
            if (locked) return;
            const chosen = btn.getAttribute("data-letter");

            if (chosen === answer) {
              locked = true;
              ABC.sfx.correct();
              if (firstTry) {
                score += 1;
                ctx.setScore(score);
              }
              optionNodes.forEach((node) => {
                node.disabled = true;
                if (node.getAttribute("data-letter") === answer) {
                  node.classList.add("is-correct");
                }
              });
              ABC.speech.sayLetter(base.l);
              ctx.timeout(() => {
                round += 1;
                ctx.setProgress(round, ROUNDS);
                renderRound();
              }, 900);
            } else {
              firstTry = false;
              btn.classList.add("is-wrong");
              btn.disabled = true;
              ABC.sfx.wrong();
            }
          });
        });

        ABC.speech.sayLetter(base.l);
        ctx.setProgress(round, ROUNDS);
      }

      renderRound();
    }
  };
})();
