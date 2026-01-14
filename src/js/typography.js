/**
 * typography.js - Dynamic text fitting module
 * Computes optimal font size to fit text within containers
 *
 * Strategy: Use direct overflow detection on the actual element.
 * This works correctly for all writing-modes because the browser
 * handles the layout context properly.
 */

const Typography = (() => {
  /**
   * Check if an element's content overflows its container
   * Works correctly regardless of writing-mode
   */
  const isOverflowing = (element) => {
    // scrollWidth/scrollHeight include overflow content
    // clientWidth/clientHeight are the visible area
    return element.scrollWidth > element.clientWidth ||
           element.scrollHeight > element.clientHeight;
  };

  /**
   * Fit text inside an element by adjusting font size (binary search)
   * Uses direct overflow detection on the actual element
   * @param {HTMLElement} element - The element containing text
   * @param {object} options - Configuration options
   */
  const fitElementText = (element, options = {}) => {
    const {
      minSize = 10,
      maxSize = 32
    } = options;

    if (!element || !element.textContent.trim()) return minSize;

    // Store original font size to restore if needed
    const originalFontSize = element.style.fontSize;

    // Binary search for optimal font size
    let low = minSize;
    let high = maxSize;
    let optimalSize = minSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      element.style.fontSize = `${mid}px`;

      // Check if content overflows at this size
      if (!isOverflowing(element)) {
        optimalSize = mid;
        low = mid + 1; // Try larger
      } else {
        high = mid - 1; // Try smaller
      }
    }

    // Apply the optimal font size
    element.style.fontSize = `${optimalSize}px`;

    return optimalSize;
  };

  /**
   * Fit text for question display (allows text wrapping)
   */
  const fitQuestion = (element) => {
    return fitElementText(element, {
      minSize: 12,
      maxSize: 48,
      padding: 4,
      allowWrap: true
    });
  };

  /**
   * Fit text for answer buttons (no wrapping)
   */
  const fitAnswer = (button) => {
    return fitElementText(button, {
      minSize: 10,
      maxSize: 28,
      padding: 8,
      allowWrap: false
    });
  };

  /**
   * Fit text for a specific player's zone only
   */
  const fitPlayerZone = (playerId) => {
    requestAnimationFrame(() => {
      // Fit this player's question
      const q = document.querySelector(`.zone-question-${playerId}`);
      if (q && q.textContent.trim() && !q.closest('.hidden') && !q.closest('.waiting')) {
        fitQuestion(q);
      }

      // Fit this player's answer buttons
      const zone = document.getElementById(`zone-${playerId}`);
      if (zone) {
        zone.querySelectorAll('.btn-answer').forEach(btn => {
          if (btn.textContent.trim() && !btn.closest('.hidden')) {
            fitAnswer(btn);
          }
        });
      }
    });
  };

  /**
   * Fit all text elements on screen
   */
  const fitAllAnswers = () => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Fit questions for each player independently using player-specific classes
      for (let i = 0; i < 4; i++) {
        const q = document.querySelector(`.zone-question-${i}`);
        if (q && q.textContent.trim() && !q.closest('.hidden') && !q.closest('.waiting')) {
          fitQuestion(q);
        }
      }

      // Then fit answer buttons
      document.querySelectorAll('.btn-answer').forEach(btn => {
        if (btn.textContent.trim() && !btn.closest('.hidden')) {
          fitAnswer(btn);
        }
      });
    });
  };

  /**
   * Truncate text with ellipsis if too long
   */
  const truncate = (text, maxLength = 15) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '...';
  };

  return {
    fitQuestion,
    fitAnswer,
    fitPlayerZone,
    fitAllAnswers,
    fitElementText,
    truncate
  };
})();
