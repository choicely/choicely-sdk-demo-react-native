# Choicely SDK React Native Example App

Welcome! This project provides sample application for
**Android**. It is intended to serve as a reference or starting point for developers looking to
explore cross-platform app development.

This is an example setup demonstrating how to use the Choicely SDK and React Native together by
embedding React Native components within a native Choicely app.

## Features

- Example Android app
- Demonstrates basic app structure and functionality
- Shows how to embed React Native components in a native Android app

## Project Overview

This project is structured as a native Android application that integrates React Native. The native
side handles the main application structure and Choicely SDK integration, while the React Native
part contains the UI components that are embedded into the native views.

## File Structure

The project is divided into two main parts: the native Android project and the React Native project.

### React Native Project

The React Native project is located in the root directory of the project. The main files in this
project are:

* `package.json`: This file contains the project's dependencies and scripts. It lists the React
  Native and other JavaScript libraries that are used in the project.
* `src/index.js`: This is the entry point for the React Native application. It registers the two React
  Native components that are used in the application: `Hello` and `Counter`.
* `src/components/`: This directory contains the React Native components. To add more components, create new
  files in this directory and then import and register them in `src/index.js`.

## Android

The native Android project is located in the `android` directory.

To run the application, you need to have the Android SDK and the React Native CLI installed. You
also need to have an Android emulator or a physical device connected to your computer.

### Build Types

* `debug`: connects to Metro for live reload/fast refresh; run npm start; unoptimized with dev
  tooling.
* `offline`: like debug but bundled JS/assets; no Metro needed; still debuggable, great for
  “prod-like” testing.
* `release`: production build; bundled, minified, optimized; no Metro; ship this to users.

## iOS

**Official React Native iOS example code**: Coming soon...

## Environment Configuration

The project uses `.env` files to manage environment-specific variables (e.g., the Metro server port) without touching version-controlled files.

### Files

* **`default.env`**
  Committed to the repo and contains default settings (including the default Metro port). **Do not modify** this file.

* **`.env`**
  Git-ignored. Use this for your local overrides.

### Override the Metro Port

Create a `.env` file in the project root and set your desired port:

```env
RCT_METRO_PORT=8932
```

> Values in `.env` override those in `default.env`. The Metro bundler will automatically use the port you set.


## Debug Builds & Live Reloading via Metro

In debug builds, you need to start the Metro server. This will
enable live reloading of your React Native components, allowing you to see changes to the React
Native components without rebuilding the entire application.
Start the Metro server by running the following command in the root directory of the project:

```console
npm start
```

## Documentation

For detailed documentation,
visit: [Choicely Mobile SDK Documentation](https://studio.choicely.com/docs/sdk)

## Notes

### Firebase Studio

<a href="https://studio.firebase.google.com/new?template=https%3A%2F%2Fgithub.com%2Fchoicely%2Fchoicely-sdk-demo-react-native&name=My%20App" target="_blank" rel="noopener noreferrer">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.firebasestudio.dev/btn/try_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.firebasestudio.dev/btn/try_light_32.svg">
    <img
      height="32"
      alt="Try in Firebase Studio"
      src="https://cdn.firebasestudio.dev/btn/try_blue_32.svg">
  </picture>
</a>

### Not using React Native?

Please refer to the official fully native SDK example
app: [Choicely SDK Example App repository](https://github.com/choicely/choicely-sdk-demo) (fully
native)

## Licensing

This project is licensed under the Elastic License 2.0.

Commercial use is permitted. Offering the software as a managed service is not permitted without a commercial agreement with Choicely Oy.

For commercial licensing, contact: support@choicely.com

Terms and Conditions: https://www.choicely.com/terms-and-conditions  
Privacy Policy: https://www.choicely.com/privacy-policy
