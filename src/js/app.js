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
   * Update scores display
   */
  const updateScores = () => {
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'];
    let html = '';

    for (let i = 0; i < playerCount; i++) {
      const player = Game.getPlayer(i);
      html += `
        <div class="score-badge" style="background: ${colors[i]}">
          ${player.score}
        </div>
      `;
    }

    elements.scores.innerHTML = html;
  };

  /**
   * Display current question
   */
  const displayQuestion = () => {
    const q = Game.getCurrentQuestion();
    if (!q) return;

    const progress = Game.getProgress();
    elements.questionCounter.textContent = `${progress.current}/${progress.total}`;

    // Update each player zone with question and all 4 answers
    for (let p = 0; p < 4; p++) {
      const zone = document.getElementById(`zone-${p}`);
      if (!zone) continue;

      if (p < playerCount) {
        zone.classList.remove('hidden');
        zone.classList.remove('locked');

        // Set question text in this zone
        const questionEl = zone.querySelector('.zone-question');
        if (questionEl) {
          questionEl.textContent = q.question;
        }

        // Set all 4 answers in this zone
        const buttons = zone.querySelectorAll('.btn-answer');
        buttons.forEach((btn, i) => {
          btn.textContent = q.answers[i] || '';
          btn.dataset.answer = i.toString();
          btn.disabled = false;
          btn.classList.remove('correct', 'wrong');
        });
      } else {
        zone.classList.add('hidden');
      }
    }

    Typography.fitAllAnswers();
    Game.startQuestionTimer();
    updateScores();
  };

  /**
   * Handle answer selection
   */
  const handleAnswer = (playerId, answerIndex) => {
    const result = Game.recordAnswer(playerId, answerIndex);
    const zone = document.getElementById(`zone-${playerId}`);
    const button = zone?.querySelector(`[data-answer="${answerIndex}"]`);

    if (result.isLocked) {
      return; // Player is still locked out
    }

    if (result.alreadyAnswered) {
      return; // Someone else already got it
    }

    if (result.isCorrect) {
      // Correct answer - highlight correct button in all zones
      playSound('correct');

      // Show correct answer in all zones
      for (let p = 0; p < playerCount; p++) {
        const z = document.getElementById(`zone-${p}`);
        const correctBtn = z?.querySelector(`[data-answer="${answerIndex}"]`);
        if (correctBtn) {
          Animations.flashCorrect(correctBtn);
        }
        // Disable all buttons in all zones
        z?.querySelectorAll('.btn-answer').forEach(b => b.disabled = true);
      }

      // Brief delay then next question
      setTimeout(() => {
        if (Game.nextQuestion()) {
          displayQuestion();
        } else {
          showResults();
        }
      }, 800);
    } else {
      // Wrong answer - apply penalty to this player only
      playSound('wrong');
      Animations.flashWrong(button);
      Animations.showLockout(playerId);

      // Disable all buttons in this player's zone during lockout
      zone?.querySelectorAll('.btn-answer').forEach(b => b.disabled = true);

      // Re-enable after lockout
      setTimeout(() => {
        if (!Game.isComplete() && !Game.isQuestionAnswered()) {
          zone?.querySelectorAll('.btn-answer').forEach(b => b.disabled = false);
        }
      }, result.lockoutDuration);
    }
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
    showScreen('game');
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
   * Set up event listeners
   */
  const setupEventListeners = () => {
    // Player count selection
    document.querySelectorAll('.btn-count').forEach(btn => {
      btn.addEventListener('click', () => {
        updatePlayerCount(parseInt(btn.dataset.count));
      });
    });

    // Language toggle
    elements.btnLanguage.addEventListener('click', cycleLanguage);

    // Start game
    elements.btnStart.addEventListener('click', startGame);

    // Play again
    elements.btnPlayAgain.addEventListener('click', resetGame);

    // Answer buttons
    document.querySelectorAll('.btn-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = parseInt(btn.dataset.player);
        const answerIndex = parseInt(btn.dataset.answer);
        handleAnswer(playerId, answerIndex);
      });
    });

    // Prevent zoom on double-tap
    document.addEventListener('touchend', (e) => {
      e.preventDefault();
    }, { passive: false });
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
