/**
 * animations.js - Visual effects module
 * Handles confetti celebration and penalty animations
 */

const Animations = (() => {
  const CONFETTI_COLORS = [
    '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
    '#a78bfa', '#fb7185', '#38bdf8', '#4ade80'
  ];

  let confettiInterval = null;

  /**
   * Create a single confetti particle
   */
  const createConfettiParticle = (container) => {
    const particle = document.createElement('div');
    particle.className = 'confetti';

    // Random position across screen width
    const startX = Math.random() * 100;
    particle.style.left = `${startX}%`;
    particle.style.top = '-20px';

    // Random color
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    particle.style.backgroundColor = color;

    // Random size
    const size = 8 + Math.random() * 8;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random shape (square or circle)
    if (Math.random() > 0.5) {
      particle.style.borderRadius = '50%';
    }

    // Random animation duration
    const duration = 2 + Math.random() * 2;
    particle.style.animationDuration = `${duration}s`;

    container.appendChild(particle);

    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  };

  /**
   * Start confetti celebration
   */
  const startConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    // Clear any existing confetti
    stopConfetti();
    container.innerHTML = '';

    // Create initial burst
    for (let i = 0; i < 50; i++) {
      setTimeout(() => createConfettiParticle(container), i * 30);
    }

    // Continue with periodic particles
    confettiInterval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        createConfettiParticle(container);
      }
    }, 200);

    // Auto-stop after 5 seconds
    setTimeout(stopConfetti, 5000);
  };

  /**
   * Stop confetti celebration
   */
  const stopConfetti = () => {
    if (confettiInterval) {
      clearInterval(confettiInterval);
      confettiInterval = null;
    }
  };

  /**
   * Show lockout penalty animation on a player zone
   * @param {number} playerId - Player ID (0-3)
   */
  const showLockout = (playerId) => {
    const zone = document.getElementById(`zone-${playerId}`);
    if (!zone) return;

    zone.classList.add('locked');

    // Remove after animation completes (1 second)
    setTimeout(() => {
      zone.classList.remove('locked');
    }, 1000);
  };

  /**
   * Flash correct answer feedback
   * @param {HTMLElement} button - The answer button
   */
  const flashCorrect = (button) => {
    button.classList.add('correct');
    setTimeout(() => {
      button.classList.remove('correct');
    }, 500);
  };

  /**
   * Flash wrong answer feedback
   * @param {HTMLElement} button - The answer button
   */
  const flashWrong = (button) => {
    button.classList.add('wrong');
    setTimeout(() => {
      button.classList.remove('wrong');
    }, 300);
  };

  return {
    startConfetti,
    stopConfetti,
    showLockout,
    flashCorrect,
    flashWrong
  };
})();
