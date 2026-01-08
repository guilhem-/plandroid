/**
 * game.js - Game state management module
 * Handles scoring, question flow, and winner determination
 */

const Game = (() => {
  const QUESTIONS_PER_GAME = 10;

  let allQuestions = [];

  // Game state
  let state = {
    language: 'en',
    playerCount: 2,
    players: [],
    questions: [],
    // Per-player randomization
    playerQuestionOrder: [],   // Each player's question order
    playerAnswerMappings: [],  // Each player's answer shuffle per question
    winner: null,
    gameComplete: false
  };

  /**
   * Load questions from JSON file
   */
  const loadQuestions = async () => {
    try {
      const response = await fetch('data/questions.json');
      const data = await response.json();
      allQuestions = data.questions || [];
      return true;
    } catch (error) {
      console.error('Failed to load questions:', error);
      return false;
    }
  };

  /**
   * Shuffle an array (Fisher-Yates algorithm)
   */
  const shuffle = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  /**
   * Initialize a new game
   * @param {number} playerCount - Number of players (1-4)
   * @param {string[]} playerNames - Array of player names
   * @param {string} language - Language code
   */
  const init = (playerCount, playerNames, language) => {
    state = {
      language,
      playerCount,
      players: [],
      questions: [],
      playerQuestionOrder: [],
      playerAnswerMappings: [],
      winner: null,
      gameComplete: false
    };

    // Initialize players with per-player tracking
    for (let i = 0; i < playerCount; i++) {
      state.players.push({
        id: i,
        name: playerNames[i] || `Player ${i + 1}`,
        score: 0,
        totalResponseTime: 0,
        currentQuestionIndex: 0,  // Track each player's progress
        questionStartTime: null,  // Per-player timing
        isFinished: false         // Has completed all questions
      });
    }

    // Select random questions for the game
    state.questions = selectRandomQuestions(QUESTIONS_PER_GAME);

    // Generate randomized question order for each player
    const questionIndices = state.questions.map((_, i) => i);
    for (let p = 0; p < playerCount; p++) {
      state.playerQuestionOrder[p] = shuffle(questionIndices);
    }

    // Generate randomized answer mappings for each player for each question
    for (let p = 0; p < playerCount; p++) {
      state.playerAnswerMappings[p] = [];
      for (let q = 0; q < state.questions.length; q++) {
        // Create shuffle mapping: [0,1,2,3] -> shuffled positions
        const answerIndices = [0, 1, 2, 3];
        state.playerAnswerMappings[p][q] = shuffle(answerIndices);
      }
    }

    return state;
  };

  /**
   * Select random questions from the pool
   */
  const selectRandomQuestions = (count) => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  /**
   * Get the actual question index for a player at their current round
   */
  const getPlayerQuestionIndex = (playerId) => {
    const player = state.players[playerId];
    if (!player) return 0;
    const order = state.playerQuestionOrder[playerId];
    if (!order) return player.currentQuestionIndex;
    return order[player.currentQuestionIndex];
  };

  /**
   * Get current question data for a specific player (with their randomization)
   * Returns null if player has finished all questions
   */
  const getQuestionForPlayer = (playerId) => {
    const player = state.players[playerId];
    if (!player || player.isFinished) return null;

    const qIndex = getPlayerQuestionIndex(playerId);
    const q = state.questions[qIndex];
    if (!q) return null;

    const lang = state.language;
    const originalAnswers = q.answers[lang] || q.answers.en;
    const answerMapping = state.playerAnswerMappings[playerId]?.[qIndex] || [0, 1, 2, 3];

    // Shuffle answers according to player's mapping
    const shuffledAnswers = answerMapping.map(i => originalAnswers[i]);

    // Find where the correct answer ended up
    const originalCorrect = q.correct;
    const shuffledCorrect = answerMapping.indexOf(originalCorrect);

    return {
      id: q.id,
      category: q.category,
      question: q.question[lang] || q.question.en,
      answers: shuffledAnswers,
      correct: shuffledCorrect,
      originalQuestionIndex: qIndex,
      answerMapping: answerMapping
    };
  };

  /**
   * Get current question data in the current language (legacy - uses first player's view)
   */
  const getCurrentQuestion = () => {
    return getQuestionForPlayer(0);
  };

  /**
   * Start timing for a specific player's current question
   */
  const startPlayerQuestionTimer = (playerId) => {
    const player = state.players[playerId];
    if (player && !player.isFinished) {
      player.questionStartTime = Date.now();
    }
  };

  /**
   * Start timing for all players (called at game start)
   */
  const startQuestionTimer = () => {
    state.players.forEach(p => {
      if (!p.isFinished) {
        p.questionStartTime = Date.now();
      }
    });
  };

  /**
   * Check if a player has finished all questions
   */
  const isPlayerFinished = (playerId) => {
    const player = state.players[playerId];
    return player?.isFinished || false;
  };

  /**
   * Record a player's answer
   * @param {number} playerId - The player ID
   * @param {number} answerIndex - The shuffled answer index the player clicked
   * @returns {object} Result with isCorrect, isFinished, isPerfectScore, gameEnded
   */
  const recordAnswer = (playerId, answerIndex) => {
    const player = state.players[playerId];
    if (!player) return { error: 'Invalid player' };

    // Check if player already finished
    if (player.isFinished) {
      return { alreadyFinished: true };
    }

    // Get this player's question (with their shuffled answers)
    const question = getQuestionForPlayer(playerId);
    if (!question) return { error: 'No current question' };

    // Check if the shuffled answer index matches the shuffled correct position
    const isCorrect = answerIndex === question.correct;
    const responseTime = Date.now() - player.questionStartTime;

    if (isCorrect) {
      player.score++;
      player.totalResponseTime += responseTime;
    }

    // Advance to next question regardless of correct/wrong
    player.currentQuestionIndex++;

    // Check if player finished all questions
    if (player.currentQuestionIndex >= QUESTIONS_PER_GAME) {
      player.isFinished = true;
    }

    // Check for perfect score (instant game end)
    const isPerfectScore = player.score === QUESTIONS_PER_GAME;
    if (isPerfectScore) {
      state.gameComplete = true;
      determineWinner();
    }

    // Check if all players finished
    const allFinished = state.players.every(p => p.isFinished);
    if (allFinished && !state.gameComplete) {
      state.gameComplete = true;
      determineWinner();
    }

    return {
      isCorrect,
      correctIndex: question.correct,
      responseTime,
      playerFinished: player.isFinished,
      isPerfectScore,
      gameEnded: state.gameComplete
    };
  };

  /**
   * Advance a specific player to their next question
   * @param {number} playerId - The player ID
   * @returns {boolean} True if player has more questions, false if finished
   */
  const nextPlayerQuestion = (playerId) => {
    const player = state.players[playerId];
    if (!player || player.isFinished) return false;

    // Start timer for new question
    player.questionStartTime = Date.now();
    return true;
  };

  /**
   * Determine the winner(s)
   */
  const determineWinner = () => {
    const sorted = [...state.players].sort((a, b) => {
      // Primary: highest score
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: fastest total response time
      return a.totalResponseTime - b.totalResponseTime;
    });

    const topScore = sorted[0].score;
    const topTime = sorted[0].totalResponseTime;

    // Check for ties
    const winners = sorted.filter(p =>
      p.score === topScore && p.totalResponseTime === topTime
    );

    state.winner = winners.length === 1 ? winners[0] : winners;
    return state.winner;
  };

  /**
   * Get current game state
   */
  const getState = () => ({ ...state });

  /**
   * Get player by ID
   */
  const getPlayer = (playerId) => state.players[playerId];

  /**
   * Get all players sorted by score
   */
  const getScoreboard = () => {
    return [...state.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalResponseTime - b.totalResponseTime;
    });
  };

  /**
   * Check if game is complete
   */
  const isComplete = () => state.gameComplete;

  /**
   * Check if all players have finished
   */
  const allPlayersFinished = () => state.players.every(p => p.isFinished);

  /**
   * Get the winner(s)
   */
  const getWinner = () => state.winner;

  /**
   * Get progress info for a specific player
   */
  const getPlayerProgress = (playerId) => {
    const player = state.players[playerId];
    if (!player) return { current: 0, total: QUESTIONS_PER_GAME };
    return {
      current: Math.min(player.currentQuestionIndex + 1, QUESTIONS_PER_GAME),
      total: QUESTIONS_PER_GAME
    };
  };

  /**
   * Get global progress (for display)
   */
  const getProgress = () => {
    // Show the furthest player's progress
    const maxProgress = Math.max(...state.players.map(p => p.currentQuestionIndex));
    return {
      current: Math.min(maxProgress + 1, QUESTIONS_PER_GAME),
      total: QUESTIONS_PER_GAME
    };
  };

  return {
    loadQuestions,
    init,
    getCurrentQuestion,
    getQuestionForPlayer,
    startQuestionTimer,
    startPlayerQuestionTimer,
    isPlayerFinished,
    recordAnswer,
    nextPlayerQuestion,
    getState,
    getPlayer,
    getScoreboard,
    isComplete,
    allPlayersFinished,
    getWinner,
    getProgress,
    getPlayerProgress,
    QUESTIONS_PER_GAME
  };
})();
