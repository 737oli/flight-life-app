# Flight Life App

An Expo + React Native application scaffolded with Expo Router and TypeScript. This project targets iOS, Android, and Web with a single codebase, using file‑based routing, modern React Native architecture, and a modular structure for components, services, and shared types.

- Platforms: iOS, Android, Web
- Routing: [Expo Router](https://expo.dev/router) (typed routes enabled)
- Language: TypeScript
- React Native: 0.79
- React: 19
- Expo SDK: 53
- Deep linking scheme: `flightlifeapp`
- New Architecture: enabled

## Features

- Universal app (iOS/Android/Web) via Expo and React Native Web
- File-based routing with Expo Router (typed routes enabled)
- Navigation powered by React Navigation
- UI polish with `expo-blur`, `expo-haptics`, and `expo-image`
- In-app browser with `expo-web-browser`
- Web content rendering with `react-native-webview`
- Strict typing with TypeScript
- Linting via ESLint (Expo config)

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn (examples use npm)
- Xcode (macOS) for iOS simulator builds
- Android Studio for Android emulator builds
- Expo Go app (optional) for device testing

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the dev server (choose platform in the Expo UI)
npm run start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Web (React Native Web)
npm run web
```

If you run into iOS build issues locally, ensure pods are installed:

```bash
npx pod-install
```

## Scripts

Defined in `package.json`:

- `start` — Start Expo dev server
- `android` — Start and open Android
- `ios` — Start and open iOS
- `web` — Start and open Web
- `lint` — Lint the project using Expo's ESLint config
- `reset-project` — Project cleanup via `scripts/reset-project.js`

## Project Structure

A high-level overview of directories:

```
app/           # Route-based screens and layouts (Expo Router)
components/    # Reusable UI components
constants/     # App-wide constants (colors, spacing, etc.)
data/          # Static data or mock fixtures
services/      # API clients, storage, and side-effectful logic
types/         # Shared TypeScript types and interfaces
scripts/       # Project utility scripts (e.g., reset)
.vscode/       # Editor settings and recommendations
```

With Expo Router, files under `app/` map to routes. For example:

- `app/index.tsx` → `/`
- `app/(tabs)/home.tsx` → `/home`
- `app/[id].tsx` → dynamic route `/123`

Typed routes are enabled via `experiments.typedRoutes` in `app.json`.

## Configuration

Key settings in `app.json`:

- Name/slug: `flight-life-app`
- Scheme (deep linking): `flightlifeapp`
- iOS: `supportsTablet: true`
- Android: Edge-to-edge UI enabled
- Web: Metro bundler and static output
- Splash/icon assets:
  - `./assets/images/icon.png`
  - `./assets/images/adaptive-icon.png`
  - `./assets/images/favicon.png`
  - `./assets/images/splash-icon.png`

Plugins:
- `expo-router`
- `expo-splash-screen` with configurable image, width, and background color

New Architecture is enabled (`newArchEnabled: true`).

## Linting and Formatting

Run lints:

```bash
npm run lint
```

Recommendation (optional):
- Add Prettier for consistent code formatting and hook it into your editor or pre-commit workflow.

## Environment Variables

If the app requires secrets or environment-based configuration, add a `.env` file and use a library such as `expo-constants` or `react-native-config`. Make sure to:

- Add `.env*` to `.gitignore`
- Never commit secrets to the repository

## Navigation Notes

This project includes:
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/elements`

Expo Router integrates with React Navigation under the hood. Use layouts and segments in `app/` for file-based routing and shared UI.

## Building

For store-ready builds, consider using [EAS Build](https://docs.expo.dev/build/introduction/). After configuring your Expo account and `eas.json`:

```bash
# Example (requires EAS configuration, not included by default):
# eas build --platform ios
# eas build --platform android
```

For web, static export is enabled in `app.json` (`web.output: "static"`).

## Troubleshooting

- iOS Pods: Run `npx pod-install` after dependency changes.
- Reanimated: If you define a custom Babel config, ensure `react-native-reanimated/plugin` is included as the last plugin.
- Android Emulator: Make sure virtualization is enabled and an emulator is created in Android Studio.
- Cache issues: Use `npm run reset-project` if provided script clears caches and resets state.

## Tech Stack

- Expo SDK 53
- React 19
- React Native 0.79
- Expo Router
- React Navigation
- TypeScript
- React Native Web

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request with a concise summary and screenshots if UI changes are included

## License

This project does not currently include a license file. If you intend to open-source it, consider adding a license (e.g., MIT, Apache-2.0).

## Acknowledgements

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Expo Router](https://expo.dev/router)
- [React Navigation](https://reactnavigation.org/)