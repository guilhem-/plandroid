/**
 * game.js - Game state management module
 * Handles scoring, question flow, and winner determination
 */

const Game = (() => {
  const QUESTIONS_PER_GAME = 10;
  const LOCKOUT_DURATION = 1000; // 1 second penalty

  let allQuestions = [];

  // Game state
  let state = {
    language: 'en',
    playerCount: 2,
    players: [],
    currentQuestion: 0,
    questionStartTime: null,
    questionAnswered: false,
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
      currentQuestion: 0,
      questionStartTime: null,
      questionAnswered: false,
      questions: [],
      playerQuestionOrder: [],
      playerAnswerMappings: [],
      winner: null,
      gameComplete: false
    };

    // Initialize players
    for (let i = 0; i < playerCount; i++) {
      state.players.push({
        id: i,
        name: playerNames[i] || `Player ${i + 1}`,
        score: 0,
        totalResponseTime: 0,
        isLocked: false,
        lockoutEndTime: null,
        currentQuestionIndex: 0  // Track each player's progress
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
   * Get the actual question index for a player at the current round
   */
  const getPlayerQuestionIndex = (playerId) => {
    const order = state.playerQuestionOrder[playerId];
    if (!order) return state.currentQuestion;
    return order[state.currentQuestion];
  };

  /**
   * Get current question data for a specific player (with their randomization)
   */
  const getQuestionForPlayer = (playerId) => {
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
   * Start timing for current question
   */
  const startQuestionTimer = () => {
    state.questionStartTime = Date.now();
    state.questionAnswered = false;

    // Clear any existing lockouts
    state.players.forEach(p => {
      p.isLocked = false;
      p.lockoutEndTime = null;
    });
  };

  /**
   * Check if a player is currently locked out
   */
  const isPlayerLocked = (playerId) => {
    const player = state.players[playerId];
    if (!player || !player.isLocked) return false;

    if (Date.now() >= player.lockoutEndTime) {
      player.isLocked = false;
      player.lockoutEndTime = null;
      return false;
    }

    return true;
  };

  /**
   * Record a player's answer
   * @param {number} playerId - The player ID
   * @param {number} answerIndex - The shuffled answer index the player clicked
   * @returns {object} Result with isCorrect, alreadyAnswered, isLocked
   */
  const recordAnswer = (playerId, answerIndex) => {
    const player = state.players[playerId];
    if (!player) return { error: 'Invalid player' };

    // Check if player is locked out
    if (isPlayerLocked(playerId)) {
      return { isLocked: true };
    }

    // Check if question already answered
    if (state.questionAnswered) {
      return { alreadyAnswered: true };
    }

    // Get this player's question (with their shuffled answers)
    const question = getQuestionForPlayer(playerId);
    if (!question) return { error: 'No current question' };

    // Check if the shuffled answer index matches the shuffled correct position
    const isCorrect = answerIndex === question.correct;
    const responseTime = Date.now() - state.questionStartTime;

    if (isCorrect) {
      player.score++;
      player.totalResponseTime += responseTime;
      state.questionAnswered = true;
      return { isCorrect: true, responseTime, correctIndex: answerIndex };
    } else {
      // Apply lockout penalty
      player.isLocked = true;
      player.lockoutEndTime = Date.now() + LOCKOUT_DURATION;
      return { isCorrect: false, lockoutDuration: LOCKOUT_DURATION };
    }
  };

  /**
   * Move to next question
   * @returns {boolean} True if there are more questions, false if game is complete
   */
  const nextQuestion = () => {
    state.currentQuestion++;

    if (state.currentQuestion >= state.questions.length) {
      state.gameComplete = true;
      determineWinner();
      return false;
    }

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
   * Check if current question has been answered
   */
  const isQuestionAnswered = () => state.questionAnswered;

  /**
   * Get the winner(s)
   */
  const getWinner = () => state.winner;

  /**
   * Get progress info
   */
  const getProgress = () => ({
    current: state.currentQuestion + 1,
    total: state.questions.length
  });

  return {
    loadQuestions,
    init,
    getCurrentQuestion,
    getQuestionForPlayer,
    startQuestionTimer,
    isPlayerLocked,
    recordAnswer,
    nextQuestion,
    getState,
    getPlayer,
    getScoreboard,
    isComplete,
    isQuestionAnswered,
    getWinner,
    getProgress,
    QUESTIONS_PER_GAME
  };
})();
