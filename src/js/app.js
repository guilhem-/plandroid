/**
 * app.js - Main application entry point
 * Handles UI interactions and screen management
 */

const App = (() => {
  const PLAYER_NAMES_KEY = 'plandroid_player_names';

  // DOM Elements
  const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    results: document.getElementById('screen-results')
  };

  const elements = {
    btnLanguage: document.getElementById('btn-language'),
    currentLang: document.getElementById('current-lang'),
    playerNames: document.getElementById('player-names'),
    btnStart: document.getElementById('btn-start'),
    questionCounter: document.getElementById('question-counter'),
    scores: document.getElementById('scores'),
    winnerText: document.getElementById('winner-text'),
    finalScores: document.getElementById('final-scores'),
    btnPlayAgain: document.getElementById('btn-play-again')
  };

  let playerCount = 2;
  let roundCount = 1;
  let questionFile = 'questions';

  /**
   * Load saved player names from localStorage
   * @returns {string[]} Array of saved names (may contain empty strings)
   */
  const loadPlayerNames = () => {
    try {
      const data = localStorage.getItem(PLAYER_NAMES_KEY);
      return data ? JSON.parse(data) : ['', '', '', ''];
    } catch (e) {
      console.warn('Failed to load player names:', e);
      return ['', '', '', ''];
    }
  };

  /**
   * Save player names to localStorage
   * @param {string[]} names - Array of player names
   */
  const savePlayerNames = (names) => {
    try {
      localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(names));
    } catch (e) {
      console.warn('Failed to save player names:', e);
    }
  };

  /**
   * Get current names from all input fields and save to localStorage
   */
  const saveCurrentNames = () => {
    const savedNames = loadPlayerNames();
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input) {
        savedNames[i] = input.value;
      }
    }
    savePlayerNames(savedNames);
  };

  /**
   * Show a specific screen
   */
  const showScreen = (screenName) => {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName]?.classList.add('active');
  };

  /**
   * Update player count selector
   */
  const updatePlayerCount = (count) => {
    playerCount = count;

    // Update button states
    document.querySelectorAll('.btn-count').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });

    // Generate player name inputs
    renderPlayerNameInputs();
  };

  /**
   * Render player name input fields
   * Loads saved names from localStorage and adds listeners to save on change
   */
  const renderPlayerNameInputs = () => {
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'];
    const savedNames = loadPlayerNames();
    let html = '';

    for (let i = 0; i < playerCount; i++) {
      const savedName = savedNames[i] || '';
      html += `
        <div class="player-name-input">
          <div class="player-badge" style="background: ${colors[i]}">${i + 1}</div>
          <input
            type="text"
            id="player-name-${i}"
            placeholder="${I18n.t('app.playerPlaceholder')}"
            maxlength="12"
            value="${savedName.replace(/"/g, '&quot;')}"
          >
        </div>
      `;
    }

    elements.playerNames.innerHTML = html;

    // Add input listeners to save names when they change
    for (let i = 0; i < playerCount; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input) {
        input.addEventListener('input', saveCurrentNames);
      }
    }
  };

  /**
   * Get player names from inputs
   */
  const getPlayerNames = () => {
    const names = [];
    for (let i = 0; i < playerCount; i++) {
      const input = document.getElementById(`player-name-${i}`);
      const name = input?.value.trim() || I18n.t('app.playerName', { n: i + 1 });
      names.push(name);
    }
    return names;
  };

  /**
   * Update scores display in each zone
   */
  const updateScores = () => {
    for (let i = 0; i < playerCount; i++) {
      const player = Game.getPlayer(i);
      const zone = document.getElementById(`zone-${i}`);
      if (zone) {
        const scoreEl = zone.querySelector('.zone-score');
        if (scoreEl) {
          scoreEl.textContent = `${player.score}/${player.currentQuestionIndex}`;
        }
      }
    }
  };

  /**
   * Update question counter display
   */
  const updateQuestionCounter = () => {
    const progress = Game.getProgress();
    elements.questionCounter.textContent = `${progress.current}/${progress.total}`;
  };

  /**
   * Set the layout class based on player count
   */
  const setLayout = () => {
    const answersArea = document.getElementById('answers-area');
    if (!answersArea) return;

    // Remove all layout classes
    answersArea.classList.remove('layout-1', 'layout-2', 'layout-3', 'layout-4');

    // Add the appropriate layout class
    answersArea.classList.add(`layout-${playerCount}`);
  };

  /**
   * Update player names in zones
   */
  const updateZonePlayerNames = () => {
    for (let i = 0; i < playerCount; i++) {
      const player = Game.getPlayer(i);
      const zone = document.getElementById(`zone-${i}`);
      if (zone && player) {
        const nameEl = zone.querySelector('.zone-player-name');
        if (nameEl) {
          nameEl.textContent = player.name;
        }
      }
    }
  };

  /**
   * Update round count selector
   */
  const updateRoundCount = (count) => {
    roundCount = count;
    Game.setTotalRounds(count);

    // Update button states
    document.querySelectorAll('.round-count-selector .btn-count').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.rounds) === count);
    });
  };

  /**
   * Update question file selector
   */
  const updateQuestionFile = async (file) => {
    questionFile = file;

    // Update button states
    document.querySelectorAll('.question-file-selector .btn-count').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.file === file);
    });

    // Reload questions with new file
    await Game.loadQuestions(file);
  };

  /**
   * Update cups display in zone headers
   */
  const updateZoneCups = () => {
    for (let i = 0; i < playerCount; i++) {
      const zone = document.getElementById(`zone-${i}`);
      if (zone) {
        const cupsEl = zone.querySelector('.zone-cups');
        if (cupsEl) {
          const wins = Game.getRoundWins(i);
          cupsEl.textContent = '🏆'.repeat(wins);
        }
      }
    }
  };

  /**
   * Update round counter in header
   */
  const updateRoundCounter = () => {
    const roundInfo = Game.getRoundInfo();
    const progress = Game.getProgress();

    if (roundInfo.isSuddenDeath) {
      elements.questionCounter.textContent = `⚡ ${progress.current}/${progress.total}`;
    } else if (roundInfo.totalRounds > 1) {
      elements.questionCounter.textContent = `R${roundInfo.currentRound}: ${progress.current}/${progress.total}`;
    } else {
      elements.questionCounter.textContent = `${progress.current}/${progress.total}`;
    }
  };

  /**
   * Display current question for a specific player
   */
  const displayPlayerQuestion = (playerId) => {
    const zone = document.getElementById(`zone-${playerId}`);
    if (!zone) return;

    // Check if player has finished
    if (Game.isPlayerFinished(playerId)) {
      showPlayerWaiting(playerId);
      return;
    }

    zone.classList.remove('hidden', 'locked', 'waiting');

    // Get this player's question (with their randomized answers)
    const q = Game.getQuestionForPlayer(playerId);
    if (!q) return;

    // Set question text in this zone
    const questionEl = zone.querySelector('.zone-question');
    if (questionEl) {
      questionEl.textContent = q.question;
    }

    // Hide waiting icon if visible
    const waitingIcon = zone.querySelector('.waiting-icon');
    if (waitingIcon) {
      waitingIcon.remove();
    }

    // Set all 4 shuffled answers in this zone
    const buttons = zone.querySelectorAll('.btn-answer');
    const answersContainer = zone.querySelector('.zone-answers');
    if (answersContainer) {
      answersContainer.style.display = 'grid';
    }

    buttons.forEach((btn, i) => {
      btn.textContent = q.answers[i] || '';
      btn.dataset.answer = i.toString();
      btn.disabled = false;
      btn.classList.remove('correct', 'wrong');
    });

    // Start timer for this player
    Game.startPlayerQuestionTimer(playerId);
  };

  /**
   * Show waiting state for a player who finished all questions
   */
  const showPlayerWaiting = (playerId) => {
    const zone = document.getElementById(`zone-${playerId}`);
    if (!zone) return;

    zone.classList.add('waiting');

    // Hide question and answers
    const questionEl = zone.querySelector('.zone-question');
    if (questionEl) {
      questionEl.textContent = I18n.t('app.waiting') || 'Waiting...';
    }

    // Hide answer buttons and show clock icon
    const answersContainer = zone.querySelector('.zone-answers');
    if (answersContainer) {
      answersContainer.style.display = 'none';
    }

    // Add waiting clock icon if not present
    if (!zone.querySelector('.waiting-icon')) {
      const icon = document.createElement('div');
      icon.className = 'waiting-icon';
      icon.innerHTML = '⏱️';
      zone.querySelector('.zone-content')?.appendChild(icon);
    }
  };

  /**
   * Display current question - each player sees their own randomized version
   */
  const displayQuestion = () => {
    // Update each player zone with THEIR question and THEIR shuffled answers
    for (let p = 0; p < playerCount; p++) {
      displayPlayerQuestion(p);
    }

    // Hide unused zones
    for (let p = playerCount; p < 4; p++) {
      const zone = document.getElementById(`zone-${p}`);
      if (zone) zone.classList.add('hidden');
    }

    Typography.fitAllAnswers();
    updateScores();
    updateRoundCounter();
    updateZoneCups();
  };

  /**
   * Handle answer selection
   */
  const handleAnswer = (playerId, answerIndex) => {
    const result = Game.recordAnswer(playerId, answerIndex);
    const zone = document.getElementById(`zone-${playerId}`);
    const button = zone?.querySelector(`[data-answer="${answerIndex}"]`);

    if (result.alreadyFinished) {
      return; // Player already finished
    }

    if (result.error) {
      return;
    }

    // Disable all buttons in THIS player's zone immediately
    zone?.querySelectorAll('.btn-answer').forEach(b => b.disabled = true);

    if (result.isCorrect) {
      // Correct answer - only highlight in THIS player's zone
      playSound('correct');
      if (button) {
        Animations.flashCorrect(button);
      }
    } else {
      // Wrong answer - show lockout overlay and flash
      playSound('wrong');
      Animations.showLockout(playerId);
      if (button) {
        Animations.flashWrong(button);
      }
    }

    // Update score immediately
    updateScores();

    // Check if round ended (perfect score or all finished)
    if (result.gameEnded) {
      setTimeout(() => {
        handleRoundEnd();
      }, 800);
      return;
    }

    // Delay before next question: 500ms for correct, 1000ms for wrong (lockout)
    const delay = result.isCorrect ? 500 : 1000;
    setTimeout(() => {
      if (result.playerFinished) {
        showPlayerWaiting(playerId);
      } else {
        displayPlayerQuestion(playerId);
        Typography.fitPlayerZone(playerId);
      }
      updateRoundCounter();
    }, delay);
  };

  /**
   * Handle end of a round
   */
  const handleRoundEnd = () => {
    const roundResult = Game.recordRoundWin();

    if (roundResult.matchComplete) {
      // Match is over - show final results
      updateZoneCups();
      showResults();
    } else {
      // More rounds to play - show in-place animation
      const winnerId = roundResult.roundWinners[0]?.id ?? 0;
      showRoundWinAnimation(winnerId, roundResult.needsSuddenDeath);
    }
  };

  /**
   * Show round win animation in-place, then start next round
   * Animation: fade content (1.5s) -> show cup (0.3s fade-in, 0.5s display) -> new round
   */
  const showRoundWinAnimation = (winnerId, isSuddenDeath) => {
    // Step 1: Fade out all zone content (1.5s)
    for (let i = 0; i < playerCount; i++) {
      const zone = document.getElementById(`zone-${i}`);
      const content = zone?.querySelector('.zone-content');
      if (content) {
        content.classList.add('fading');
      }
    }

    // Step 2: After fade, show large cup in winner's zone (0.3s fade-in)
    setTimeout(() => {
      const winnerZone = document.getElementById(`zone-${winnerId}`);
      if (winnerZone) {
        // Create large cup element
        const cupEl = document.createElement('div');
        cupEl.className = 'round-win-cup';
        cupEl.textContent = '🏆';
        winnerZone.appendChild(cupEl);

        // Trigger fade-in animation
        requestAnimationFrame(() => {
          cupEl.classList.add('visible');
        });

        // Step 3: After cup display (0.5s), start next round
        setTimeout(() => {
          // Remove cup and fading state
          cupEl.remove();
          for (let i = 0; i < playerCount; i++) {
            const zone = document.getElementById(`zone-${i}`);
            const content = zone?.querySelector('.zone-content');
            if (content) {
              content.classList.remove('fading');
            }
          }

          // Update cups in header after animation
          updateZoneCups();

          // Start next round
          Game.startNextRound(isSuddenDeath);
          displayQuestion();
        }, 500);
      }
    }, 1500);

    // Play sound
    playSound('correct');
  };

  /**
   * Show results screen (final match results)
   */
  const showResults = () => {
    showScreen('results');

    const winner = Game.getWinner();
    const scoreboard = Game.getScoreboard();
    const roundInfo = Game.getRoundInfo();
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'];

    // Winner text
    if (Array.isArray(winner)) {
      elements.winnerText.textContent = I18n.t('app.winners');
    } else {
      elements.winnerText.textContent = I18n.t('app.winner', { name: winner.name });
    }

    // Final scores with cups for multi-round games
    let html = '';
    scoreboard.forEach((player) => {
      const isWinner = Array.isArray(winner)
        ? winner.some(w => w.id === player.id)
        : winner.id === player.id;

      const cups = roundInfo.totalRounds > 1 ? '🏆'.repeat(player.roundWins) : '';
      const scoreText = roundInfo.totalRounds > 1
        ? `${player.roundWins}/${roundInfo.currentRound}`
        : `${player.score}/${Game.QUESTIONS_PER_GAME}`;

      html += `
        <div class="final-score-row ${isWinner ? 'winner' : ''}" style="border-left: 4px solid ${colors[player.id]}">
          <span class="final-score-name">${player.name} ${cups}</span>
          <span class="final-score-value">${scoreText}</span>
        </div>
      `;
    });
    elements.finalScores.innerHTML = html;

    // Play victory sound and start confetti
    playSound('victory');
    Animations.startConfetti();
  };

  /**
   * Play a sound effect using Web Audio API synthesis
   */
  const playSound = (name) => {
    Sounds.play(name);
  };

  /**
   * Start a new game
   */
  const startGame = async () => {
    const names = getPlayerNames();
    const lang = I18n.getCurrentLanguage();

    // Set total rounds before init (init reads this config)
    Game.setTotalRounds(roundCount);
    Game.init(playerCount, names, lang);

    setLayout();
    showScreen('game');
    updateZonePlayerNames();
    clearZoneCups();
    displayQuestion();
  };

  /**
   * Clear cups display in zone headers
   */
  const clearZoneCups = () => {
    for (let i = 0; i < 4; i++) {
      const zone = document.getElementById(`zone-${i}`);
      if (zone) {
        const cupsEl = zone.querySelector('.zone-cups');
        if (cupsEl) cupsEl.textContent = '';
      }
    }
  };

  /**
   * Reset and go back to start
   */
  const resetGame = () => {
    Animations.stopConfetti();
    showScreen('start');
  };

  /**
   * Cycle through languages
   * Updates UI text without resetting player names
   */
  const cycleLanguage = async () => {
    const nextLang = I18n.getNextLanguage();
    await I18n.setLanguage(nextLang);
    elements.currentLang.textContent = nextLang.toUpperCase();

    // Only update placeholders, not values (preserve user-entered names)
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input) {
        input.placeholder = I18n.t('app.playerPlaceholder');
      }
    }
  };

  /**
   * Set up event listeners
   */
  const setupEventListeners = () => {
    // Player count selection
    document.querySelectorAll('.player-count-selector .btn-count').forEach(btn => {
      btn.addEventListener('click', () => {
        updatePlayerCount(parseInt(btn.dataset.count));
      });
    });

    // Round count selection
    document.querySelectorAll('.round-count-selector .btn-count').forEach(btn => {
      btn.addEventListener('click', () => {
        updateRoundCount(parseInt(btn.dataset.rounds));
      });
    });

    // Question file selection
    document.querySelectorAll('.question-file-selector .btn-count').forEach(btn => {
      btn.addEventListener('click', () => {
        updateQuestionFile(btn.dataset.file);
      });
    });

    // Language toggle
    elements.btnLanguage.addEventListener('click', cycleLanguage);

    // Start game
    elements.btnStart.addEventListener('click', startGame);

    // Play again
    elements.btnPlayAgain.addEventListener('click', resetGame);

    // Answer buttons - use touchstart for multi-touch support
    document.querySelectorAll('.btn-answer').forEach(btn => {
      // Touch handler for immediate multi-touch response
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent mouse event emulation
        if (btn.disabled) return;
        const playerId = parseInt(btn.dataset.player);
        const answerIndex = parseInt(btn.dataset.answer);
        handleAnswer(playerId, answerIndex);
      }, { passive: false });

      // Click handler as fallback for mouse/stylus
      btn.addEventListener('click', () => {
        const playerId = parseInt(btn.dataset.player);
        const answerIndex = parseInt(btn.dataset.answer);
        handleAnswer(playerId, answerIndex);
      });
    });

    // Re-fit typography on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (screens.game.classList.contains('active')) {
          Typography.fitAllAnswers();
        }
      }, 100);
    });
  };

  /**
   * Initialize the application
   */
  const init = async () => {
    // Load i18n
    const lang = await I18n.init();
    elements.currentLang.textContent = lang.toUpperCase();

    // Load questions
    await Game.loadQuestions();

    // Set up UI
    renderPlayerNameInputs();
    setupEventListeners();

    // Show start screen
    showScreen('start');

    console.log('App initialized');
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    showScreen
  };
})();
