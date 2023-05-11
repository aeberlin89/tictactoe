import View from "./view.js";
import Store from "./store.js";

const players = [
  {
    id: 1,
    name: "Player 1",
    iconClass: "fa-x",
    colorClass: "turquoise",
  },
  {
    id: 2,
    name: "Player 2",
    iconClass: "fa-o",
    colorClass: "yellow",
  },
];

function init() {
  const view = new View();
  const store = new Store("live-t3-storage-key", players);

  function initView() {
    view.closeAll();
    view.clearMoves();
    view.setTurnIndicator(store.game.currentPlayer);
    view.updateScoreboard(
      store.stats.playerWithStats[0].wins,
      store.stats.playerWithStats[1].wins,
      store.stats.ties
    );
    view.initializeMoves(store.game.moves);
  }

  window.addEventListener("storage", () => {
    console.log("State changed from another tab");
    initView();
  });

  initView();

  view.bindGameResetEvent((event) => {
    store.reset();
    initView();
  });

  view.bindNewRoundEvent((event) => {
    //first call the new round so that the state is updated, then update
    //the UI based on the state
    store.newRound();
    initView();
  });

  view.bindPlayerMoveEvent((square) => {
    //check if there is an existing move so that we do not write to a
    //square that has been marked
    const existingMove = store.game.moves.find(
      (move) => move.squareId === +square.id
    );

    if (existingMove) {
      return;
    }

    //place and icon of the current player (from store) in a square
    view.handlePlayerMove(square, store.game.currentPlayer);

    //advance to the next state by pushing a move to the moves array
    store.playerMove(+square.id);

    //Check if someone has won the game
    if (store.game.status.isComplete) {
      view.openModal(
        store.game.status.winner
          ? `${store.game.status.winner.name} wins!`
          : "Tie game!"
      );

      //if the game is complete, we don't want to continue on and set the
      //turn indicator, so we can return
      return;
    }

    //now this current player is different than the one in handleplayermove
    //we're setting the next player's turn indicator
    view.setTurnIndicator(store.game.currentPlayer);
  });
}

window.addEventListener("load", init);
