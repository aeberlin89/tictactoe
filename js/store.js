const initialValue = {
  currentGameMoves: [],
  history: {
    currentRoundGames: [],
    allGames: [],
  },
};

export default class Store {
  constructor(key, players) {
    this.storageKey = key;
    this.players = players;
  }

  get stats() {
    const state = this.#getState();

    return {
      playerWithStats: this.players.map((player) => {
        const wins = state.history.currentRoundGames.filter(
          (game) => game.status.winner?.id === player.id
        ).length;

        //return an object that is filled with player and
        //the wins calculated above
        return {
          ...player,
          wins,
        };
      }),

      ties: state.history.currentRoundGames.filter(
        (game) => game.status.winner === null
      ).length,
    };
    console.log(this.#getState());
  }

  //getter function to get state info
  //get keyword makes it act like a property on the class instance
  get game() {
    const state = this.#getState();

    //using modulo will give either return either a 0 or 1, which coincides
    //with the player index for players 1 & 2
    const currentPlayer = this.players[state.currentGameMoves.length % 2];

    const winningPatterns = [
      [1, 2, 3],
      [1, 5, 9],
      [1, 4, 7],
      [2, 5, 8],
      [3, 5, 7],
      [3, 6, 9],
      [4, 5, 6],
      [7, 8, 9],
    ];

    let winner = null;

    //Check if player moves match a winning pattern to see if the game has
    //been won. First, store the player's seleced squares in an array by
    //filtering out moves not made by the player. Then, use map to access the
    //object's corresponding squareId for each move.
    for (const player of this.players) {
      const selectedSquareIds = state.currentGameMoves
        .filter((move) => move.player.id === player.id)
        .map((move) => move.squareId);

      //Then compare the array of selected squares with the winning patterns
      //using the every method on each pattern, checking to see if the
      //players selected square IDs include every item in each pattern.
      //If so, declare a winner by setting the winner to the player.
      //Later, when the game getter method is returned, it will be returning
      //a status that reflects if winner has been set to a player or is
      //still null.
      for (const pattern of winningPatterns) {
        if (pattern.every((v) => selectedSquareIds.includes(v))) {
          winner = player;
        }
      }
    }

    return {
      moves: state.currentGameMoves,
      currentPlayer,
      status: {
        isComplete: winner != null || state.currentGameMoves.length === 9,
        winner,
      },
    };
  }

  playerMove(squareId) {
    //we use a state clone in order to not mutate state directly
    const stateClone = structuredClone(this.#getState());

    stateClone.currentGameMoves.push({
      squareId,
      player: this.game.currentPlayer,
    });

    this.#saveState(stateClone);
  }

  reset() {
    const stateClone = structuredClone(this.#getState());
    //if the game is complete, push the current game to the history object
    //we have to check because we can also reset the game if it isn't
    //complete
    const { status, moves } = this.game;

    if (status.isComplete) {
      stateClone.history.currentRoundGames.push({
        moves,
        status,
      });
    }

    stateClone.currentGameMoves = [];

    this.#saveState(stateClone);
  }

  newRound() {
    //We know that new round is always going to start with a reset
    this.reset();
    //Then, we want to pushe the current round games to the all games,
    //then we can clear the current round games

    //Again, we want to create a state clone so that we do not
    //mutate state directly.
    const stateClone = structuredClone(this.#getState());
    stateClone.history.allGames.push(...stateClone.history.currentRoundGames);
    stateClone.history.currentRoundGames = [];

    this.#saveState(stateClone);
  }

  #getState() {
    const item = window.localStorage.getItem(this.storageKey);
    return item ? JSON.parse(item) : initialValue;
  }

  //private variable that takes and object or function to set state
  #saveState(stateOrFn) {
    const prevState = this.#getState();

    let newState;

    switch (typeof stateOrFn) {
      case "function":
        newState = stateOrFn(prevState);
        break;
      case "object":
        newState = stateOrFn;
        break;
      default:
        throw new Error("Invalid argument passed to saveState");
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(newState));
  }
}
