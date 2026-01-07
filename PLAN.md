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

### Game Flow

```
┌─────────────────────────────────────────────────────────┐
│                    START SCREEN                         │
│  - Select number of players (1-4)                       │
│  - Enter player names                                   │
│  - Start Game button                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   QUESTION SCREEN                       │
│  - Question number (1/10)                               │
│  - Question text                                        │
│  - 4 answer buttons (positioned for multi-player)      │
│  - Timer (optional)                                     │
│  - Current scores                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (after 10 questions)
┌─────────────────────────────────────────────────────────┐
│                   RESULTS SCREEN                        │
│  - Final scores                                         │
│  - Winner announcement                                  │
│  - Play Again button                                    │
└─────────────────────────────────────────────────────────┘
```

### UI Layout for Multiplayer

For 4 players around a phone, answers should be positioned at 4 corners/edges:
```
        ┌─────────────────────┐
        │    Player 1 (Top)   │
        │      [Answer]       │
        ├─────────────────────┤
Player 4│                     │Player 2
[Answer]│     QUESTION        │[Answer]
        │                     │
        ├─────────────────────┤
        │   Player 3 (Bottom) │
        │      [Answer]       │
        └─────────────────────┘
```

---

## Technical Architecture

### 1. Web Application Structure

```
/src/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Styling (responsive, touch-friendly)
├── js/
│   ├── app.js          # Main application logic
│   ├── questions.js    # Question bank
│   └── game.js         # Game state management
└── assets/
    ├── icons/          # App icons (various sizes)
    └── sounds/         # Optional sound effects
```

### 2. Android Packaging Strategy

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
├── README.md                  # Project readme
├── package.json               # Node.js dependencies
├── capacitor.config.ts        # Capacitor configuration
├── src/                       # Web application source
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── questions.js
│   │   └── game.js
│   └── assets/
│       └── icons/
├── android/                   # Generated by Capacitor
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   └── gradle/
├── scripts/                   # Build helper scripts
│   ├── setup-android-sdk.sh
│   └── build-release.sh
└── store-assets/              # Play Store assets
    ├── icon-512.png
    ├── feature-graphic.png
    ├── screenshots/
    └── descriptions.md
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

## Open Questions / Decisions Needed

1. **Question Source**:
   - Hardcoded questions in JS?
   - External JSON file?
   - API call (requires internet)?

2. **Offline Support**:
   - Should work fully offline? (Recommended: Yes)

3. **Sound Effects**:
   - Include audio feedback? (correct/wrong sounds)

4. **Theming**:
   - Light/dark mode support?
   - Single fun theme?

5. **Localization**:
   - English only?
   - Multi-language support?

---

## Next Steps

1. Review this plan
2. Answer open questions
3. Begin Phase 1 implementation
