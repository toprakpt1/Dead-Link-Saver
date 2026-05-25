<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License: GPL v3][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toprakpt1/Dead-Link-Saver">
    <img src="assets/icon.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Dead Link Saver</h3>

  <p align="center">
    A lightweight, fast, and dead-simple link saver for Android.
    <br />
    <a href="https://github.com/toprakpt1/Dead-Link-Saver/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/toprakpt1/Dead-Link-Saver/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
    &middot;
    <a href="README.tr.md">Türkçe</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#screenshots">Screenshots</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#privacy">Privacy</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

Dead Link Saver is a **privacy-respecting, open-source link bookmarking app** for Android. Paste a link and it automatically detects the platform (YouTube, Reddit, GitHub, etc.), fetches the title and thumbnail, classifies it into a category, and saves it — zero manual work.

It also **detects dead links** via Archive.org integration and surfaces **forgotten links** (not opened in 30+ days) so nothing important slips through the cracks.

No ads, no trackers, no subscriptions. Just your links.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![React Native][ReactNative-shield]][ReactNative-url]
* [![Expo][Expo-shield]][Expo-url]
* [![TypeScript][TypeScript-shield]][TypeScript-url]
* [![Zustand][Zustand-shield]][Zustand-url]
* [![FlashList][FlashList-shield]][FlashList-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (LTS recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [Android Studio](https://developer.android.com/studio) (for local Android builds)
* [Java 17](https://openjdk.org/) or later

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/toprakpt1/Dead-Link-Saver.git
   cd Dead-Link-Saver
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Start the development server
   ```sh
   npx expo start
   ```
4. Build for Android (APK)
   ```sh
   npx expo prebuild --platform android
   cd android
   ./gradlew assembleRelease
   ```
   The unsigned APK will be at `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- FEATURES -->
## Features

- **One-Tap Save** — Paste a link, the app does the rest
- **Platform Detection** — YouTube, Reddit, Twitter/X, GitHub, Instagram, Medium, and more
- **Auto Metadata** — Title, thumbnail, and description are fetched automatically
- **Smart Categorization** — Education, Entertainment, Code, News, Random — auto-classified
- **Custom Categories** — Create and manage your own categories
- **Dead Link Detection** — Find 404/500 links with Archive.org fallback
- **Forgotten Links** — See links you haven't opened in 30+ days
- **Favorites** — Star important links to keep them front of mind
- **Link Status** — Unread / Watched / Saved — track where you left off
- **Card Sizing** — Small, Medium, Large — customize your view
- **Share Menu** — Android Share Intent to save links from any app
- **Offline Caching** — All data stays on your device
- **Dark Theme** — Easy on the eyes dark UI

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- SCREENSHOTS -->
## Screenshots

| Home & Link List | Forgotten Links | Settings |
|---|---|---|
| *(screenshot coming soon)* | *(screenshot coming soon)* | *(screenshot coming soon)* |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE -->
## Usage

1. **Save a Link** — Paste a URL in the input field on the home screen, or share it from any app via "Dead Link Saver".
2. **Auto Processing** — The app detects the platform, fetches metadata, and assigns a category.
3. **Manage Links** — Tap a link to change its status (Unread → Watched → Saved), favorite it, or delete it.
4. **Filter by Category** — Use the chips at the top to filter links by category.
5. **Scan for Dead Links** — Tap "Check Dead Links" to test all your links.
6. **Discover Forgotten Links** — Switch to the "Forgotten" tab to see links untouched for 30+ days.

### Android Share Intent
1. Tap the share button in any app (Chrome, YouTube, Twitter, etc.)
2. Select "Dead Link Saver" from the share sheet
3. The link is saved automatically

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PROJECT STRUCTURE -->
## Project Structure

```
Dead-Link-Saver/
├── app/                       # Expo Router pages
│   ├── (tabs)/
│   │   ├── index.tsx          # Home (link list + input)
│   │   ├── forgotten.tsx      # Forgotten links
│   │   ├── settings.tsx       # Settings & category management
│   │   └── _layout.tsx        # Tab navigation
│   ├── _layout.tsx            # Root layout
│   └── +not-found.tsx         # 404 page
├── components/                # UI components
│   ├── LinkCard.tsx           # Link card component
│   ├── LinkInput.tsx          # Link input field
│   ├── CategoryBadge.tsx      # Category badge
│   ├── CategoryPicker.tsx     # Category picker
│   ├── StatusIndicator.tsx    # Status indicator
│   └── OnboardingTutorial.tsx # First-run tutorial
├── services/                  # Business logic
│   ├── linkParser.ts          # URL analysis & platform detection
│   ├── metadataFetcher.ts     # Metadata fetching (OG, Microlink, YouTube oEmbed)
│   ├── linkChecker.ts         # Dead link detection & Archive.org integration
│   └── categoryClassifier.ts  # Auto categorization
├── store/                     # State management (Zustand)
│   ├── linkStore.ts           # Link store
│   ├── categoryStore.ts       # Category store
│   ├── settingsStore.ts       # Settings store
│   ├── tutorialStore.ts       # Tutorial store
│   └── types.ts               # TypeScript types
└── utils/                     # Utilities
    ├── storage.ts             # AsyncStorage wrapper
    └── constants.ts           # Constants & color palette
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] Add & remove links
- [x] Auto platform detection
- [x] Metadata fetching (title, thumbnail, description)
- [x] Smart categorization
- [x] Custom category support
- [x] Link status management (Unread/Watched/Saved)
- [x] Dead link detection & Archive.org integration
- [x] Forgotten links (30+ days)
- [x] Favorites
- [x] Card size options
- [x] Android Share Intent integration
- [x] Offline caching
- [x] Onboarding tutorial
- [ ] Text search & filtering
- [ ] Sort options
- [ ] Bulk operations (batch delete, recategorize)
- [ ] AI summarizer
- [ ] Duplicate link detection
- [ ] Auto-save from clipboard
- [ ] Tag system
- [ ] iOS Share Extension

See the [open issues](https://github.com/toprakpt1/Dead-Link-Saver/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PRIVACY -->
## Privacy

Dead Link Saver is designed with privacy in mind:

- **No analytics, crash trackers, or ads** — zero telemetry
- All your links are stored **locally** on your device
- **Internet access is required only** for auto-fetching metadata and checking dead links — no data is sent to any server other than the URLs you explicitly save
- We don't collect, sell, or see your data

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Toprak Talha Karcılar — [@toprakpt1](https://github.com/toprakpt1)

Project Link: [https://github.com/toprakpt1/Dead-Link-Saver](https://github.com/toprakpt1/Dead-Link-Saver)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Zustand](https://github.com/pmndrs/zustand)
- [FlashList](https://shopify.github.io/flash-list/)
- [Lucide Icons](https://lucide.dev)
- [Microlink](https://microlink.io)
- [Internet Archive](https://archive.org)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[contributors-url]: https://github.com/toprakpt1/Dead-Link-Saver/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[forks-url]: https://github.com/toprakpt1/Dead-Link-Saver/network/members
[stars-shield]: https://img.shields.io/github/stars/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[stars-url]: https://github.com/toprakpt1/Dead-Link-Saver/stargazers
[issues-shield]: https://img.shields.io/github/issues/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[issues-url]: https://github.com/toprakpt1/Dead-Link-Saver/issues
[license-shield]: https://img.shields.io/github/license/toprakpt1/Dead-Link-Saver.svg?style=for-the-badge
[license-url]: https://github.com/toprakpt1/Dead-Link-Saver/blob/main/LICENSE

[ReactNative-shield]: https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[ReactNative-url]: https://reactnative.dev/
[Expo-shield]: https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white
[Expo-url]: https://expo.dev
[TypeScript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Zustand-shield]: https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=zustand&logoColor=white
[Zustand-url]: https://github.com/pmndrs/zustand
[FlashList-shield]: https://img.shields.io/badge/FlashList-000000?style=for-the-badge&logo=shopify&logoColor=white
[FlashList-url]: https://shopify.github.io/flash-list/
