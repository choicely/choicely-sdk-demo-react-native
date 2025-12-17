# Choicely SDK React Native Example App

Welcome! 
This project provides sample applications for integrating *React Native* to *Choicely* on **Android** and **iOS**.
It is intended to serve as a reference or starting point for developers looking to explore cross-platform app development.

This is an example setup demonstrating how to use the Choicely SDK and React Native together by
embedding React Native components within a native Choicely app.

## Features

- Example Android app
- Example iOS app
- Demonstrates basic app structure and functionality
- Shows how to embed React Native components in a native Choicely app

## Project Overview

This project is structured as a Choicely SDK setup that integrates React Native. 
The native side handles the main application structure and Choicely SDK integration, while the React Native
part contains the UI components that are embedded into the native views.

## File Structure

The project is divided into these main parts: the native Android and iOS projects and the React Native project.

### React Native Project

The React Native project is located in the `rn` directory of the project. The main files in this
project are:

* `package.json`: This file contains the project's dependencies and scripts. It lists the React
  Native and other JavaScript libraries that are used in the project.
* `rn/src/index.js`: This is the entry point for the React Native application. It registers the React
  Native components that are used in the application, like: `Hello` and `Counter`.
* `rn/src/components/`: This directory contains the React Native components. To add more components, create new
  files in this directory and then import and register them in `rn/src/index.js`.

## Android

The native Android project is located in the `android` directory.

To run the application, you need to have the *Android SDK* and *node* installed. 
You also need to have an Android emulator or a physical device connected to your computer.

### Build Types

* `debug`: connects to Metro for live reload/fast refresh; run npm start; unoptimized with dev
  tooling.
* `offline`: like debug but bundled JS/assets; no Metro needed; still debuggable, great for
  “prod-like” testing.
* `release`: production build; bundled, minified, optimized; no Metro; ship this to users.

## iOS

The native iOS project is located in the `ios` directory.

To run the application, you need to have an Apple Mac computer with *Xcode* and *node* installed. 

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

In debug builds, you need to start the Metro server. 
This will enable live reloading of your React Native components, allowing you to see changes to the React
Native components without rebuilding the entire application.
Start the Metro server by running the following command in the root directory of the project:

```console
npm start
```

## Documentation

For detailed documentation,
visit: [Choicely Mobile SDK Documentation](https://docs.choicely.com)

## Notes

### Not using React Native?

Please refer to the official fully native SDK example
app: [Choicely SDK Example App repository](https://github.com/choicely/choicely-sdk-demo) (fully
native)

## Licensing

This project is provided under the Elastic License 2.0 (ELv2). See `LICENCE.md` for full terms. Notable points:
- Commercial use is permitted.
- You may not offer the Software as a managed service without a separate commercial agreement with Choicely Oy.

## Support & commercial inquiries

For commercial licensing, enterprise integration, or support, contact: support@choicely.com

For terms and privacy information:
- Terms and Conditions: https://www.choicely.com/terms-and-conditions
- Privacy Policy: https://www.choicely.com/privacy-policy
