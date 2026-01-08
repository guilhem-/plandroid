# Plandroid - Reference Application Plan

## Project Overview

**Objective**: Create a reference application demonstrating how to package a pure HTML/JS web application for Android Play Store using command-line tools only (no Android Studio).

**Secondary Objective**: Structure all information needed for AI agents to reproduce and support these operations.

---

## Application Specification

### The Trivia Game

A simple multiplayer trivia game with the following features:

- **Players**: 1 to 4 players playing simultaneously around a single phone
- **Gameplay**: 10 random questions about fun topics
- **Format**: Multiple choice (4 answers, 1 correct)
- **Technology**: Pure HTML/CSS/JavaScript (no framework)
- **Questions**: 200 questions in JSON format, multi-language
- **Offline**: Fully functional without internet
- **i18n**: French, English, Spanish, German (auto-detect from device)
- **Theme**: Fun, colorful single theme
- **Effects**: Sound effects + winner celebration animation

### Gameplay Mechanics

#### Answering System
- **Independent Progression**: Each player progresses through questions at their own pace
- **Correct answer**: Player scores a point and advances to next question
- **Wrong answer**: No point, player advances to next question (no lockout)
- **Effects are isolated**: Correct/wrong visual feedback only appears in the answering player's zone
- Each player sees their 10 questions in a randomized order (anti-cheating)

#### Scoring & Winner Determination
```
Primary:   Most correct answers wins
Tiebreak:  Fastest total response time wins
```

| Scenario | Winner |
|----------|--------|
| Player A: 7 correct, Player B: 5 correct | Player A |
| Both: 6 correct, A: 15s total, B: 18s total | Player A (faster) |
| Both: 6 correct, same time | Both declared winners |

#### Game End Conditions
1. **All players finish**: When every player has answered all 10 questions
2. **Perfect score**: If any player answers all 10 correctly, game ends immediately

#### Player Zone States

**Active State** (answering questions):
```
┌─────────────────────────────────┐
│  [Player Name]        [Score]   │
│  Question: What is 2+2?         │
│  [4] [3] [5] [6]               │
└─────────────────────────────────┘
```

**Correct Answer Feedback** (brief flash, only in THIS zone):
```
┌─────────────────────────────────┐
│  [Player Name]        [Score]   │
│  Question: What is 2+2?         │
│  [✓4] [3] [5] [6]  ← green     │
└─────────────────────────────────┘
         ↓ (after 0.5s)
    Next question appears
```

**Wrong Answer Feedback** (brief flash, only in THIS zone):
```
┌─────────────────────────────────┐
│  [Player Name]        [Score]   │
│  Question: What is 2+2?         │
│  [4] [✗3] [5] [6]  ← red       │
└─────────────────────────────────┘
         ↓ (after 0.5s)
    Next question appears
```

**Waiting State** (player finished all questions):
```
┌─────────────────────────────────┐
│  [Player Name]        [Score]   │
│                                 │
│           ⏱️ (clock icon)       │
│       Waiting for others...     │
│                                 │
└─────────────────────────────────┘
```

### Game Flow

```
┌─────────────────────────────────────────────────────────┐
│                    START SCREEN                         │
│  - Auto-detect language (FR/EN/ES/DE) or manual select │
│  - Select number of players (1-4)                       │
│  - Enter player names                                   │
│  - Start Game button                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   QUESTION SCREEN                       │
│  - Question number (1/10)                               │
│  - Question text (in selected language)                │
│  - 4 answer buttons (positioned for multi-player)      │
│  - Timer countdown                                      │
│  - Current scores per player                            │
│  - Sound: correct ✓ / wrong ✗                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (after 10 questions)
┌─────────────────────────────────────────────────────────┐
│                   RESULTS SCREEN                        │
│  - Final scores ranking                                 │
│  - 🎉 Winner celebration animation (confetti/fireworks)│
│  - 🔊 Victory sound effect                             │
│  - Play Again button                                    │
└─────────────────────────────────────────────────────────┘
```

### UI Layout for Multiplayer

Each player has their **own zone** that **COVERS THE WHOLE SCREEN** divided equally. Each zone contains:
- Player name and current score
- Question text
- All 4 answer buttons in a 2x2 grid

**Key Design Principles:**
- **Full screen coverage**: Zones fill 100% of screen, no gaps
- **Equal surface area**: All players get same-sized zones
- **Player score in zone**: Each zone shows the player's name and current score
- **Randomized questions**: Each player sees questions in a DIFFERENT random order
- **Randomized answers**: Answer button positions are shuffled DIFFERENTLY for each player
- Zones are rotated so each player can read from their sitting position
- First correct answer from ANY player wins the point
- Wrong answer locks only THAT player's zone for 1 second

---

#### Layout: 1 Player (Full Screen)

Single player uses the entire screen, no rotation needed.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PLAYER 1 ZONE                        │
│                    (100% screen)                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 1]                      [Score: 5]  │  │
│  │                                                   │  │
│  │ Question: What is the capital of France?          │  │
│  │                                                   │  │
│  │ ┌─────────────┐  ┌─────────────┐                  │  │
│  │ │   Paris     │  │   London    │                  │  │
│  │ └─────────────┘  └─────────────┘                  │  │
│  │ ┌─────────────┐  ┌─────────────┐                  │  │
│  │ │   Berlin    │  │   Madrid    │                  │  │
│  │ └─────────────┘  └─────────────┘                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                  (normal orientation)                   │
└─────────────────────────────────────────────────────────┘
```

---

#### Layout: 2 Players (Top/Bottom Split)

Screen split horizontally. P1 at bottom (normal), P2 at top (rotated 180°).

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PLAYER 2 ZONE                        │
│                    (top 50%)                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 2]                      [Score: 3]  │  │
│  │ Question: What is the capital of France?          │  │
│  │ [Berlin] [Paris] [Madrid] [London]                │  │
│  └───────────────────────────────────────────────────┘  │
│                    (rotated 180°)                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    PLAYER 1 ZONE                        │
│                    (bottom 50%)                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 1]                      [Score: 4]  │  │
│  │ Question: What is the capital of France?          │  │
│  │ [Paris] [London] [Berlin] [Madrid]                │  │
│  └───────────────────────────────────────────────────┘  │
│                  (normal orientation)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

#### Layout: 3 Players (Triangle)

P1 at bottom (50% width), P2 and P3 share top half.

```
┌─────────────────────────────────────────────────────────┐
│           PLAYER 3 ZONE    │    PLAYER 2 ZONE           │
│           (top-left 25%)   │    (top-right 25%)         │
│  ┌──────────────────────┐  │  ┌──────────────────────┐  │
│  │ [P3]        [Score]  │  │  │ [P2]        [Score]  │  │
│  │ Question...          │  │  │ Question...          │  │
│  │ [A] [B] [C] [D]      │  │  │ [A] [B] [C] [D]      │  │
│  └──────────────────────┘  │  └──────────────────────┘  │
│       (rotated 270° CW)    │       (rotated 90° CW)     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    PLAYER 1 ZONE                        │
│                    (bottom 50%)                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 1]                      [Score: 4]  │  │
│  │ Question: What is the capital of France?          │  │
│  │ [Paris] [London] [Berlin] [Madrid]                │  │
│  └───────────────────────────────────────────────────┘  │
│                  (normal orientation)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

#### Layout: 4 Players (Quadrants)

Screen split into 4 equal quadrants. Each player gets 25% of screen.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    PLAYER 3 ZONE                        │
│                    (bottom 25%)                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 1]                      [Score: 4]  │  │
│  │ Question: What is the capital of France?          │  │
│  │ [Paris] [London] [Berlin] [Madrid]                │  │
│  └───────────────────────────────────────────────────┘  │
│                     (rotated 180°)                      │
├─────────────────────────────────────────────────────────┤
│           PLAYER 4 ZONE    │    PLAYER 2 ZONE           │
│           (left 25%)       │    (right 25%)             │
│  ┌──────────────────────┐  │  ┌──────────────────────┐  │
│  │ [P3]        [Score]  │  │  │ [P2]        [Score]  │  │
│  │ Question...          │  │  │ Question...          │  │
│  │ [A] [B] [C] [D]      │  │  │ [A] [B] [C] [D]      │  │
│  └──────────────────────┘  │  └──────────────────────┘  │
│       (rotated 270° ACW)   │       (rotated 90° ACW)    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    PLAYER 1 ZONE                        │
│                    (bottom 25%)                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Name: Player 1]                      [Score: 4]  │  │
│  │ Question: What is the capital of France?          │  │
│  │ [Paris] [London] [Berlin] [Madrid]                │  │
│  └───────────────────────────────────────────────────┘  │
│                  (normal orientation)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Anti-Cheating: Randomization Strategy

To prevent players from copying others:

1. **Question Order**: Each player gets the same 10 questions but in a different random order
2. **Answer Positions**: For each question, answer buttons are shuffled differently per player

```javascript
// Example: Same question, different answer positions
Player 1: [Paris] [London] [Berlin] [Madrid]  // Paris is at index 0
Player 2: [Berlin] [Paris] [Madrid] [London]  // Paris is at index 1
Player 3: [Madrid] [Berlin] [London] [Paris]  // Paris is at index 3
```

This means watching another player's screen gives no advantage.

### Dynamic Typography

Text size is **computed dynamically** using binary search to find the **largest font that fits**:

```javascript
// Binary search for optimal font size
function fitElementText(element, options) {
  const { minSize, maxSize, allowWrap } = options;

  // Create temporary element to measure text
  const measureEl = document.createElement('span');
  measureEl.textContent = element.textContent;
  measureEl.style.width = allowWrap ? maxWidth + 'px' : 'auto';

  // Binary search: find largest size that fits
  let low = minSize, high = maxSize, optimal = minSize;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    measureEl.style.fontSize = mid + 'px';

    if (measureEl.offsetWidth <= maxWidth &&
        measureEl.offsetHeight <= maxHeight) {
      optimal = mid;
      low = mid + 1;  // Try larger
    } else {
      high = mid - 1; // Try smaller
    }
  }
  element.style.fontSize = optimal + 'px';
}
```

| Element | Min Size | Max Size | Wrapping | Behavior |
|---------|----------|----------|----------|----------|
| Question text | 12px | 36px | Yes | Multi-line, largest fit |
| Answer buttons | 10px | 28px | No | Single line, largest fit |
| Player names | 12px | 18px | No | Truncate with ellipsis |
| Score display | 14px | 28px | No | Fixed per breakpoint |

**Key Features:**
- **Binary search** for efficient O(log n) font size calculation
- **Accurate measurement** using temporary DOM elements
- **Questions allow wrapping** for longer text
- **Buttons stay single-line** for quick readability
- **Re-fits on resize** with debounced handler

### Mobile & Tablet Compatibility

The application is optimized for various device sizes:

| Device Category | Width | Height | Optimizations |
|-----------------|-------|--------|---------------|
| Small phones (SE) | 320-374px | any | Compact UI, smaller fonts |
| Standard phones | 375-767px | any | Balanced layout |
| Tablets portrait | 768-1023px | any | Larger touch targets, bigger fonts |
| Tablets landscape | 1024px+ | any | Desktop-like experience |

**Key Mobile Features:**
- **Touch targets**: Minimum 44px height for all interactive elements
- **Safe areas**: Support for notched devices (iPhone X+) via `env(safe-area-inset-*)`
- **Dynamic viewport**: Uses `100dvh` for proper mobile browser height
- **Orientation support**: Landscape mode has adapted layout for start screen
- **Reduced motion**: Respects `prefers-reduced-motion` accessibility setting
- **No zoom**: Disabled pinch-to-zoom for game interface stability
- **Touch optimization**: `touch-action: manipulation` prevents double-tap zoom
- **Multi-touch support**: Multiple players can touch simultaneously without blocking each other

### Multi-Touch Support

Multiple players can interact with their zones simultaneously:

```javascript
// Each answer button uses touchstart for immediate response
button.addEventListener('touchstart', (e) => {
  e.preventDefault();  // Prevent mouse event emulation
  handleAnswer(playerId, answerIndex);
}, { passive: false });

// Click events for mouse/stylus fallback
button.addEventListener('click', handleAnswer);
```

**Key Implementation Details:**
- Use `touchstart` instead of `click` for instant response (no 300ms delay)
- Call `e.preventDefault()` to prevent duplicate mouse events
- Each touch is handled independently (no global touch state)
- Buttons handle their own touch events (no event delegation blocking)
- CSS `touch-action: manipulation` on buttons prevents zoom interference

| Scenario | Behavior |
|----------|----------|
| Player A holds finger on screen | Other players can still tap normally |
| Players A and B tap simultaneously | Both taps register independently |
| Player taps and holds | Only first tap registers (no repeat) |
| Player drags finger off button | No action (touchstart already fired) |

### Answer Format Guidelines

Answers must be **SHORT** for readability around the phone:

| Rule | Good | Bad |
|------|------|-----|
| Max characters | "Mars" (4) | "The planet Mars" (14) |
| Single word preferred | "Blue" | "The color blue" |
| Numbers are OK | "1969" | "The year 1969" |
| Proper nouns | "Einstein" | "Albert Einstein" |

```json
// Example: Well-formatted answers
{
  "question": { "en": "What is the largest planet?" },
  "answers": { "en": ["Jupiter", "Saturn", "Neptune", "Mars"] }
}

// Example: BAD - too long
{
  "question": { "en": "What is the largest planet?" },
  "answers": { "en": ["The planet Jupiter", "The planet Saturn", ...] }
}
```

**Target**: All answers should be **≤ 15 characters** when possible

---

## Technical Architecture

### 1. Web Application Structure

```
/src/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Styling (responsive, touch-friendly, fun theme)
├── js/
│   ├── app.js              # Main application entry point
│   ├── game.js             # Game state, scoring, response timers
│   ├── i18n.js             # Internationalization logic
│   ├── typography.js       # Dynamic text fitting
│   └── animations.js       # Confetti & penalty effects
├── data/
│   └── questions.json      # 1000 questions (all languages)
├── i18n/
│   ├── en.json             # English UI strings
│   ├── fr.json             # French UI strings
│   ├── es.json             # Spanish UI strings
│   └── de.json             # German UI strings
└── assets/
    ├── icons/              # App icons (various sizes)
    └── sounds/
        ├── correct.mp3     # Correct answer sound
        ├── wrong.mp3       # Wrong answer sound
        └── victory.mp3     # Winner celebration sound
```

### 2. Game State Schema

```javascript
const gameState = {
  // Game setup
  language: 'en',
  playerCount: 4,
  players: [
    {
      id: 0,
      name: 'Player 1',
      score: 0,
      totalResponseTime: 0,       // Milliseconds (for tiebreaker)
      currentQuestionIndex: 0,    // This player's progress (0-9)
      isFinished: false,          // Has answered all 10 questions
      questionStartTime: null     // When current question was shown
    }
    // ... up to 4 players
  ],

  // Questions pool
  questions: [],                  // 10 randomly selected questions
  playerQuestionOrder: [],        // Per-player randomized order
  playerAnswerMappings: [],       // Per-player answer shuffling

  // Final results
  winner: null,                   // Player ID or array if tie
  gameComplete: false
};

// Per-player question tracking
function recordAnswer(playerId, isCorrect) {
  const player = gameState.players[playerId];
  const responseTime = Date.now() - player.questionStartTime;

  if (isCorrect) {
    player.score++;
    player.totalResponseTime += responseTime;
  }
  // Wrong or correct: advance to next question
  player.currentQuestionIndex++;

  // Check if player finished
  if (player.currentQuestionIndex >= 10) {
    player.isFinished = true;
  }

  // Check for game end conditions
  checkGameEnd();
}

function checkGameEnd() {
  // Perfect score: instant win
  const perfectPlayer = gameState.players.find(p => p.score === 10);
  if (perfectPlayer) {
    endGame();
    return;
  }

  // All players finished
  const allFinished = gameState.players.every(p => p.isFinished);
  if (allFinished) {
    endGame();
  }
}
```

### 3. Android Packaging Strategy

**Chosen Approach: Capacitor CLI**

Why Capacitor over alternatives:
| Approach | Pros | Cons |
|----------|------|------|
| **Capacitor** | Modern, well-maintained, simple CLI, good docs | Requires Node.js |
| Cordova | Mature, widely used | Older, more complex |
| TWA (Bubblewrap) | Most minimal, PWA-native | Requires hosted PWA |
| Raw Android SDK | Full control | Complex, verbose |

**Capacitor** is the best choice because:
- Pure CLI workflow (no Android Studio required for builds)
- Simple configuration
- Active maintenance
- Works with any web app
- Good documentation for agents to follow

### 3. Build Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │────▶│  Capacitor   │────▶│  Android     │
│  (HTML/JS)   │     │   Sync       │     │    APK       │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │ Android SDK │
                     │ (CLI tools) │
                     └─────────────┘
```

---

## Required Tools & Dependencies

### Development Machine Setup

1. **Node.js** (v18+ LTS)
   - For Capacitor CLI and build tools

2. **Java JDK** (JDK 17)
   - Required for Android builds

3. **Android SDK Command Line Tools**
   - `cmdline-tools`
   - `platform-tools`
   - `build-tools` (version 33.0.0+)
   - `platforms;android-33` (or latest)

4. **Capacitor CLI**
   - `@capacitor/cli`
   - `@capacitor/core`
   - `@capacitor/android`

### Environment Variables

```bash
export JAVA_HOME=/path/to/jdk17
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/33.0.0
```

---

## Play Store Requirements Checklist

### Required Assets

- [ ] **App Icon**: 512x512 PNG (Play Store listing)
- [ ] **Feature Graphic**: 1024x500 PNG
- [ ] **Screenshots**: Min 2, recommended 8 (phone + tablet)
- [ ] **App Name**: Max 30 characters
- [ ] **Short Description**: Max 80 characters
- [ ] **Full Description**: Max 4000 characters

### Technical Requirements

- [ ] **Target API Level**: API 33+ (Android 13+) - Required as of 2024
- [ ] **Signed APK/AAB**: Release build signed with keystore
- [ ] **64-bit support**: Default with Capacitor
- [ ] **Privacy Policy URL**: Required for all apps
- [ ] **Content Rating**: Complete questionnaire

### App Bundle

- [ ] Generate AAB (Android App Bundle) instead of APK for Play Store
- [ ] Create signing keystore
- [ ] Configure signing in gradle

---

## Implementation Phases

### Phase 1: Project Setup
- Initialize project structure
- Set up npm/package.json
- Configure Capacitor
- Create CLAUDE.md for agent instructions

### Phase 2: Web Application
- Build HTML structure
- Implement CSS (responsive, touch-optimized)
- Create question bank
- Implement game logic
- Test in browser

### Phase 3: Android Integration
- Install Android SDK (CLI)
- Add Android platform via Capacitor
- Configure app metadata (name, icon, etc.)
- Build debug APK
- Test on emulator/device

### Phase 4: Play Store Preparation
- Generate signing keystore
- Create release build (AAB)
- Prepare store listing assets
- Write privacy policy
- Complete content rating

### Phase 5: Documentation
- Finalize CLAUDE.md with all commands
- Document troubleshooting
- Create step-by-step agent guide

---

## File Structure (Final)

```
/plandroid/
├── PLAN.md                    # This plan document
├── CLAUDE.md                  # Agent instructions
├── package.json               # Node.js dependencies
├── capacitor.config.ts        # Capacitor configuration
│
├── src/                       # Web application source
│   ├── index.html             # Single page app entry
│   ├── css/
│   │   └── styles.css         # Fun theme styles
│   ├── js/
│   │   ├── app.js             # Main entry point
│   │   ├── game.js            # Game logic, scoring, timers
│   │   ├── i18n.js            # Language management
│   │   ├── typography.js      # Dynamic text fitting
│   │   └── animations.js      # Confetti & penalty effects
│   ├── data/
│   │   └── questions.json     # 200 questions (4 languages)
│   ├── i18n/
│   │   ├── en.json            # English UI
│   │   ├── fr.json            # French UI
│   │   ├── es.json            # Spanish UI
│   │   └── de.json            # German UI
│   └── assets/
│       ├── icons/
│       │   ├── icon-72.png
│       │   ├── icon-96.png
│       │   ├── icon-128.png
│       │   ├── icon-192.png
│       │   └── icon-512.png
│       └── sounds/
│           ├── correct.mp3
│           ├── wrong.mp3
│           └── victory.mp3
│
├── android/                   # Generated by Capacitor
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   └── gradle/
│
├── scripts/                   # Build helper scripts
│   ├── setup-android-sdk.sh   # Android SDK installation
│   └── build-release.sh       # Release build automation
│
└── store-assets/              # Play Store assets
    ├── icon-512.png           # Store icon
    ├── feature-graphic.png    # 1024x500 banner
    ├── screenshots/           # App screenshots
    └── descriptions/
        ├── en.md              # English description
        ├── fr.md              # French description
        ├── es.md              # Spanish description
        └── de.md              # German description
```

---

## Key Commands Reference

```bash
# Project setup
npm init -y
npm install @capacitor/cli @capacitor/core
npx cap init

# Add Android platform
npm install @capacitor/android
npx cap add android

# Development workflow
npx cap sync                    # Sync web app to native
npx cap open android           # Open in Android Studio (optional)

# Build APK (CLI only)
cd android
./gradlew assembleDebug        # Debug APK
./gradlew assembleRelease      # Release APK (needs signing)
./gradlew bundleRelease        # AAB for Play Store

# APK location
# android/app/build/outputs/apk/debug/app-debug.apk
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## Decided Specifications

| Decision | Choice |
|----------|--------|
| Question Source | JSON file with 200 questions |
| Offline Support | Yes - fully offline capable |
| Sound Effects | Yes - correct/wrong/victory sounds |
| Animations | Yes - winner confetti + wrong answer red fade |
| Theme | Single fun colorful theme |
| Languages | FR, EN, ES, DE (auto-detect from device) |
| Wrong Answer Penalty | 1-second lockout with red fade overlay |
| Winner Logic | Most correct wins; fastest total time breaks ties |
| Typography | Dynamic sizing to fit available space |
| Answer Format | Short answers (≤15 chars recommended) |

---

## Internationalization (i18n) Architecture

### Language Detection

```javascript
// Priority order:
// 1. User manual selection (stored in localStorage)
// 2. Navigator language (navigator.language)
// 3. Default: English

const supportedLanguages = ['en', 'fr', 'es', 'de'];
const userLang = navigator.language.slice(0, 2);
const lang = supportedLanguages.includes(userLang) ? userLang : 'en';
```

### UI Strings Structure (i18n/*.json)

```json
{
  "app": {
    "title": "Fun Trivia",
    "start": "Start Game",
    "players": "Number of Players",
    "playerName": "Player {{n}} Name",
    "question": "Question {{current}} of {{total}}",
    "score": "Score",
    "winner": "{{name}} wins!",
    "tie": "It's a tie!",
    "playAgain": "Play Again",
    "correct": "Correct!",
    "wrong": "Wrong!",
    "timeUp": "Time's up!",
    "selectLanguage": "Language"
  }
}
```

### Questions JSON Structure (data/questions.json)

```json
{
  "version": "1.0",
  "totalQuestions": 1000,
  "categories": ["science", "history", "geography", "entertainment", "sports", "nature"],
  "questions": [
    {
      "id": 1,
      "category": "science",
      "difficulty": "easy",
      "question": {
        "en": "What planet is known as the Red Planet?",
        "fr": "Quelle planète est connue comme la planète rouge?",
        "es": "¿Qué planeta es conocido como el Planeta Rojo?",
        "de": "Welcher Planet ist als der Rote Planet bekannt?"
      },
      "answers": {
        "en": ["Mars", "Venus", "Jupiter", "Saturn"],
        "fr": ["Mars", "Vénus", "Jupiter", "Saturne"],
        "es": ["Marte", "Venus", "Júpiter", "Saturno"],
        "de": ["Mars", "Venus", "Jupiter", "Saturn"]
      },
      "correct": 0
    }
  ]
}
```

### Question Categories (Fun Topics)

| Category | Count | Examples |
|----------|-------|----------|
| Science | ~35 | Space, physics, biology |
| History | ~35 | World events, famous people |
| Geography | ~35 | Countries, capitals, landmarks |
| Entertainment | ~35 | Movies, music, TV |
| Sports | ~30 | Olympics, football, records |
| Nature | ~30 | Animals, plants, weather |

**Total Questions**: 200 questions across all categories

---

### Smart Question Selection

Questions are selected using a **weighted random algorithm** that maximizes variety and minimizes repetition:

```javascript
// localStorage key for tracking
const STORAGE_KEY = 'plandroid_question_history';

// Storage format: { questionId: lastAskedTimestamp }
{
  "1": 1704672000000,   // Asked 2 hours ago
  "15": 1704585600000,  // Asked 26 hours ago
  "42": null            // Never asked
}
```

**Weight Calculation**:
```javascript
function calculateWeight(lastAsked, now) {
  if (!lastAsked) {
    return 1000;  // Never asked = highest priority
  }
  // Weight grows with hours elapsed
  const hoursElapsed = (now - lastAsked) / (1000 * 60 * 60);
  return Math.max(1, Math.floor(hoursElapsed) + 1);
}
```

| Last Asked | Weight | Selection Priority |
|------------|--------|-------------------|
| Never | 1000 | Highest |
| 24+ hours ago | 25+ | High |
| 1-24 hours ago | 2-24 | Medium |
| < 1 hour ago | 1 | Lowest |

**Selection Algorithm**:
1. Load question history from localStorage
2. Calculate weights for all 200 questions
3. Use weighted random sampling (without replacement) to select 10 questions
4. Save selected question timestamps to localStorage

**Benefits**:
- Players encounter new questions first
- Familiar questions gradually return after time passes
- Randomness is preserved while avoiding immediate repeats
- Works offline (localStorage persists)

---

### Player Name Persistence

Player names are **stored in localStorage** and persist across sessions:

```javascript
// localStorage key for player names
const PLAYER_NAMES_KEY = 'plandroid_player_names';

// Storage format: array of 4 names (max players)
["Alice", "Bob", "Charlie", "Diana"]
```

**Behavior**:
- Names are loaded when the app starts
- Names are saved whenever a player edits their name input
- Names persist across app restarts and browser sessions
- **Language changes do NOT reset names** - names are user data, not localized
- Default names use localized placeholders only if no saved name exists

| Action | Result |
|--------|--------|
| First launch | Show localized "Player 1", "Player 2", etc. placeholders |
| User types name | Save immediately to localStorage |
| App restart | Load saved names from localStorage |
| Language change | Keep current names (no reset) |
| Clear browser data | Reset to localized placeholders |

---

## Sound & Animation Specifications

### Sound Effects

| Sound | Trigger | Duration | Format |
|-------|---------|----------|--------|
| `correct.mp3` | Player answers correctly | ~0.5s | MP3, 44.1kHz |
| `wrong.mp3` | Player answers wrong | ~0.5s | MP3, 44.1kHz |
| `victory.mp3` | Winner celebration | ~3s | MP3, 44.1kHz |

### Winner Celebration Animation

```
┌─────────────────────────────────────────┐
│  ✨  🎊  ✨  🎊  ✨  🎊  ✨  🎊  ✨    │
│                                         │
│         🏆 WINNER! 🏆                   │
│                                         │
│         Player Name                     │
│         Score: 8/10                     │
│                                         │
│  🎉  ✨  🎉  ✨  🎉  ✨  🎉  ✨  🎉    │
└─────────────────────────────────────────┘

Animation: CSS confetti particles falling
Duration: 3-5 seconds
Library: Pure CSS (no external deps) or canvas-confetti (~3KB)
```

---

## Next Steps

1. ✅ Plan reviewed and specifications decided
2. Create CLAUDE.md with agent instructions
3. Begin Phase 1 implementation
