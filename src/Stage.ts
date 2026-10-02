// Shared score, shown on the stage.
export const game = { score: 0, best: 0 };

whenFlag(() => {
  switchBackdrop("background");
  showVariable(game.score);
  showVariable(game.best);
});
