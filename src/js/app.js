/**
 * app.js - Main application entry point
 * Handles UI interactions and screen management
 */

const App = (() => {
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
   */
  const renderPlayerNameInputs = () => {
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'];
    let html = '';

    for (let i = 0; i < playerCount; i++) {
      html += `
        <div class="player-name-input">
          <div class="player-badge" style="background: ${colors[i]}">${i + 1}</div>
          <input
            type="text"
            id="player-name-${i}"
            placeholder="${I18n.t('app.playerPlaceholder')}"
            maxlength="12"
          >
        </div>
      `;
    }

    elements.playerNames.innerHTML = html;
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
          scoreEl.textContent = player.score;
        }
      }
    }
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
      // Wrong answer - only show in THIS player's zone
      playSound('wrong');
      if (button) {
        Animations.flashWrong(button);
      }
    }

    // Update score immediately
    updateScores();

    // Check if game ended (perfect score or all finished)
    if (result.gameEnded) {
      setTimeout(() => {
        showResults();
      }, 800);
      return;
    }

    // Brief delay then show next question for THIS player only
    setTimeout(() => {
      if (result.playerFinished) {
        showPlayerWaiting(playerId);
      } else {
        displayPlayerQuestion(playerId);
        Typography.fitAllAnswers();
      }
    }, 500);
  };

  /**
   * Show results screen
   */
  const showResults = () => {
    showScreen('results');

    const winner = Game.getWinner();
    const scoreboard = Game.getScoreboard();
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'];

    // Winner text
    if (Array.isArray(winner)) {
      elements.winnerText.textContent = I18n.t('app.winners');
    } else {
      elements.winnerText.textContent = I18n.t('app.winner', { name: winner.name });
    }

    // Final scores
    let html = '';
    scoreboard.forEach((player, rank) => {
      const isWinner = Array.isArray(winner)
        ? winner.some(w => w.id === player.id)
        : winner.id === player.id;

      html += `
        <div class="final-score-row ${isWinner ? 'winner' : ''}" style="border-left: 4px solid ${colors[player.id]}">
          <span class="final-score-name">${player.name}</span>
          <span class="final-score-value">${player.score}/${Game.QUESTIONS_PER_GAME}</span>
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

    Game.init(playerCount, names, lang);
    setLayout();
    showScreen('game');
    updateZonePlayerNames();
    displayQuestion();
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
   */
  const cycleLanguage = async () => {
    const nextLang = I18n.getNextLanguage();
    await I18n.setLanguage(nextLang);
    elements.currentLang.textContent = nextLang.toUpperCase();
    renderPlayerNameInputs();
  };

  /**
   * Helper to add touch-friendly event listener
   */
  const addTouchHandler = (element, handler) => {
    let touchHandled = false;

    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchHandled = true;
      handler(e);
    }, { passive: false });

    element.addEventListener('click', (e) => {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      handler(e);
    });
  };

  /**
   * Set up event listeners
   */
  const setupEventListeners = () => {
    // Player count selection
    document.querySelectorAll('.btn-count').forEach(btn => {
      addTouchHandler(btn, () => {
        updatePlayerCount(parseInt(btn.dataset.count));
      });
    });

    // Language toggle
    addTouchHandler(elements.btnLanguage, cycleLanguage);

    // Start game
    addTouchHandler(elements.btnStart, startGame);

    // Play again
    addTouchHandler(elements.btnPlayAgain, resetGame);

    // Answer buttons
    document.querySelectorAll('.btn-answer').forEach(btn => {
      addTouchHandler(btn, () => {
        const playerId = parseInt(btn.dataset.player);
        const answerIndex = parseInt(btn.dataset.answer);
        handleAnswer(playerId, answerIndex);
      });
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
