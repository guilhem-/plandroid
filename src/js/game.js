/**
 * game.js - Game state management module
 * Handles scoring, question flow, and winner determination
 */

const Game = (() => {
  const QUESTIONS_PER_GAME = 10;
  const STORAGE_KEY = 'plandroid_question_history';

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
    gameComplete: false,
    // Round tracking
    totalRounds: 1,
    currentRound: 1,
    isSuddenDeath: false,
    roundComplete: false,
    matchComplete: false
  };

  // Store total rounds setting (persists across rounds)
  let totalRoundsConfig = 1;

  /**
   * Load questions from JSON file
   * @param {string} file - Question file name (without .json extension)
   */
  const loadQuestions = async (file = 'questions') => {
    try {
      const response = await fetch(`data/${file}.json`);
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
        isFinished: false,        // Has completed all questions
        roundWins: 0              // Number of rounds won
      });
    }

    // Set round tracking from config
    state.totalRounds = totalRoundsConfig;
    state.currentRound = 1;
    state.isSuddenDeath = false;
    state.roundComplete = false;
    state.matchComplete = false;

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
   * Load question history from localStorage
   * @returns {Object} Map of questionId -> lastAskedTimestamp
   */
  const loadQuestionHistory = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to load question history:', e);
      return {};
    }
  };

  /**
   * Save question history to localStorage
   * @param {Object} history - Map of questionId -> lastAskedTimestamp
   */
  const saveQuestionHistory = (history) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save question history:', e);
    }
  };

  /**
   * Calculate selection weight for a question based on time since last asked
   * Higher weight = more likely to be selected
   * @param {number} lastAsked - Timestamp when question was last asked (0 if never)
   * @param {number} now - Current timestamp
   * @returns {number} Selection weight
   */
  const calculateWeight = (lastAsked, now) => {
    if (!lastAsked) {
      // Never asked - highest priority
      return 1000;
    }
    // Weight increases with time elapsed (in hours)
    const hoursElapsed = (now - lastAsked) / (1000 * 60 * 60);
    // Minimum weight of 1, grows with time
    return Math.max(1, Math.floor(hoursElapsed) + 1);
  };

  /**
   * Select questions using weighted random selection
   * Prioritizes questions that haven't been asked recently
   * @param {number} count - Number of questions to select
   * @returns {Array} Selected questions
   */
  const selectRandomQuestions = (count) => {
    const history = loadQuestionHistory();
    const now = Date.now();

    // Calculate weights for all questions
    const weighted = allQuestions.map(q => ({
      question: q,
      weight: calculateWeight(history[q.id], now)
    }));

    // Select questions using weighted random sampling (without replacement)
    const selected = [];
    const available = [...weighted];

    for (let i = 0; i < Math.min(count, available.length); i++) {
      // Calculate total weight of remaining questions
      const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);

      // Pick a random point in the weight distribution
      let random = Math.random() * totalWeight;

      // Find the question at that point
      let selectedIndex = 0;
      for (let j = 0; j < available.length; j++) {
        random -= available[j].weight;
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      // Add selected question and remove from available pool
      selected.push(available[selectedIndex].question);
      available.splice(selectedIndex, 1);
    }

    // Update history with selected questions
    selected.forEach(q => {
      history[q.id] = now;
    });
    saveQuestionHistory(history);

    return selected;
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

  /**
   * Set total rounds for the match (call before init)
   * @param {number} rounds - Number of rounds (1, 3, or 5)
   */
  const setTotalRounds = (rounds) => {
    totalRoundsConfig = rounds;
  };

  /**
   * Get number of rounds won by a player
   * @param {number} playerId - The player ID
   * @returns {number} Number of rounds won
   */
  const getRoundWins = (playerId) => {
    const player = state.players[playerId];
    return player?.roundWins || 0;
  };

  /**
   * Get round information
   */
  const getRoundInfo = () => ({
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    isSuddenDeath: state.isSuddenDeath,
    roundComplete: state.roundComplete,
    matchComplete: state.matchComplete
  });

  /**
   * Determine round winner and record the win
   * @returns {object} Round result with winner(s) and match status
   */
  const recordRoundWin = () => {
    // Sort players by score then response time
    const sorted = [...state.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalResponseTime - b.totalResponseTime;
    });

    const topScore = sorted[0].score;
    const topTime = sorted[0].totalResponseTime;

    // Find all players tied for top position
    const roundWinners = sorted.filter(p =>
      p.score === topScore && p.totalResponseTime === topTime
    );

    // Award round wins
    roundWinners.forEach(winner => {
      const player = state.players[winner.id];
      if (player) player.roundWins++;
    });

    state.roundComplete = true;

    // Check if match is complete
    const matchStatus = checkMatchComplete();

    return {
      roundWinners,
      isTie: roundWinners.length > 1,
      ...matchStatus
    };
  };

  /**
   * Check if the match is complete
   * @returns {object} Match status with winner info
   */
  const checkMatchComplete = () => {
    // Find max round wins
    const maxWins = Math.max(...state.players.map(p => p.roundWins));
    const leaders = state.players.filter(p => p.roundWins === maxWins);

    // In sudden death, any round winner wins the match
    if (state.isSuddenDeath && leaders.length === 1) {
      state.matchComplete = true;
      state.winner = leaders[0];
      return { matchComplete: true, matchWinner: leaders[0], needsSuddenDeath: false };
    }

    // Check if all planned rounds are complete
    if (state.currentRound >= state.totalRounds) {
      if (leaders.length === 1) {
        // Clear winner
        state.matchComplete = true;
        state.winner = leaders[0];
        return { matchComplete: true, matchWinner: leaders[0], needsSuddenDeath: false };
      } else {
        // Tie - need sudden death
        return { matchComplete: false, matchWinner: null, needsSuddenDeath: true };
      }
    }

    // More rounds to play
    return { matchComplete: false, matchWinner: null, needsSuddenDeath: false };
  };

  /**
   * Start the next round (keeps round wins, resets scores)
   * @param {boolean} isSuddenDeath - Whether this is a sudden death round
   */
  const startNextRound = (isSuddenDeath = false) => {
    state.currentRound++;
    state.isSuddenDeath = isSuddenDeath;
    state.roundComplete = false;
    state.gameComplete = false;

    // Reset player scores but keep round wins
    state.players.forEach(player => {
      player.score = 0;
      player.totalResponseTime = 0;
      player.currentQuestionIndex = 0;
      player.questionStartTime = null;
      player.isFinished = false;
    });

    // Select new random questions
    state.questions = selectRandomQuestions(QUESTIONS_PER_GAME);

    // Regenerate question order for each player
    const questionIndices = state.questions.map((_, i) => i);
    for (let p = 0; p < state.playerCount; p++) {
      state.playerQuestionOrder[p] = shuffle(questionIndices);
    }

    // Regenerate answer mappings for each player
    for (let p = 0; p < state.playerCount; p++) {
      state.playerAnswerMappings[p] = [];
      for (let q = 0; q < state.questions.length; q++) {
        const answerIndices = [0, 1, 2, 3];
        state.playerAnswerMappings[p][q] = shuffle(answerIndices);
      }
    }

    state.winner = null;
  };

  /**
   * Get the overall match winner
   */
  const getMatchWinner = () => {
    if (!state.matchComplete) return null;
    return state.winner;
  };

  /**
   * Check if match is complete
   */
  const isMatchComplete = () => state.matchComplete;

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
    QUESTIONS_PER_GAME,
    // Round management
    setTotalRounds,
    getRoundWins,
    getRoundInfo,
    recordRoundWin,
    startNextRound,
    getMatchWinner,
    isMatchComplete
  };
})();
