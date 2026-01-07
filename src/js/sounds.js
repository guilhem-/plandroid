/**
 * sounds.js - Audio synthesis module
 * Generates game sounds using Web Audio API (no external files needed)
 * License: Public Domain / CC0
 */

const Sounds = (() => {
  let audioContext = null;
  let initialized = false;

  /**
   * Initialize audio context (must be called after user interaction)
   */
  const init = () => {
    if (initialized) return true;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
      return true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      return false;
    }
  };

  /**
   * Resume audio context if suspended (required by browsers)
   */
  const resume = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  };

  /**
   * Play a tone with specified parameters
   */
  const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope: quick attack, sustain, fade out
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.7);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  /**
   * Play correct answer sound - happy ascending chime
   */
  const playCorrect = async () => {
    await resume();
    if (!audioContext) return;

    // Ascending major chord arpeggio (C-E-G-C)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.12;

    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, duration, 'sine', 0.25);
      }, i * 80);
    });
  };

  /**
   * Play wrong answer sound - descending buzz
   */
  const playWrong = async () => {
    await resume();
    if (!audioContext) return;

    // Low buzz with slight pitch drop
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  /**
   * Play victory fanfare - triumphant melody
   */
  const playVictory = async () => {
    await resume();
    if (!audioContext) return;

    // Fanfare melody
    const melody = [
      { freq: 523.25, start: 0, dur: 0.15 },     // C5
      { freq: 659.25, start: 0.15, dur: 0.15 },  // E5
      { freq: 783.99, start: 0.30, dur: 0.15 },  // G5
      { freq: 1046.50, start: 0.45, dur: 0.4 },  // C6 (hold)
      { freq: 783.99, start: 0.90, dur: 0.1 },   // G5
      { freq: 1046.50, start: 1.05, dur: 0.5 },  // C6 (final)
    ];

    melody.forEach(note => {
      setTimeout(() => {
        playTone(note.freq, note.dur, 'triangle', 0.3);
      }, note.start * 1000);
    });

    // Add harmony
    setTimeout(() => {
      playTone(523.25, 0.5, 'sine', 0.15); // C5 bass
    }, 1050);
  };

  /**
   * Play a named sound effect
   */
  const play = async (name) => {
    init(); // Ensure initialized

    switch (name) {
      case 'correct':
        await playCorrect();
        break;
      case 'wrong':
        await playWrong();
        break;
      case 'victory':
        await playVictory();
        break;
      default:
        console.warn(`Unknown sound: ${name}`);
    }
  };

  return {
    init,
    play,
    playCorrect,
    playWrong,
    playVictory
  };
})();
