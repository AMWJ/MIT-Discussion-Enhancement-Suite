# MIT Discussion Enhancement Suite

This MIT Discussion Enhancement Suite (MDES) is a suite of modules that enhances your MIT Discussion browsing experience.

It borrows heavily from [Reddit Enhancement Suite (RES)](http://redditenhancementsuite.com)

For general discussion about this suite, visit the [MIT Discussion Enhancement Suite Subreddit](https://discussion.mit.edu/r/Enhancement/).

## Introduction

Hi there! Thanks for checking out MDES on GitHub. An important note:

* This is not RES! Please never bother RES developers or community members regarding this suite.

Thanks!

Ariel Jacobs
arielj@mit.edu

## Contributor guidelines

Thinking about contributing to MDES? Awesome! We just ask that you follow a few simple guidelines:

1. Consider if your contribution would be more appropriate in [Reddit Enhancement Suite (RES)](http://redditenhancementsuite.com). If the feature you are suggesting is as applicable to RES as it is to MDES, follow [RES's guide for contributors](https://github.com/honestbleeps/Reddit-Enhancement-Suite).

2. Stop by the [MDES's dedicated subreddit](https://discussion.mit.edu/r/Enhancement) to discuss your proposed contributions.

## Project structure

##### Top level files & folders

  - `README.md` – YOU ARE HERE, unless you're browsing on GitHub
  - `changelog.txt` – self-explanatory
  - `gulpfile.js` - build script
  - `package.json` – package info, dependencies
  - `lib/` – all MDES code
  - `lib/core/` – core MDES code
  - `lib/modules/` – MDES modules
  - `lib/vendor/` – MDES vendor libraries
  - `Chrome/` – Chrome-specific MDES files
  - `Firefox/` – Firefox-specific MDES files
  - `Safari/` – Safari-specific MDES files
  - `dist/` - build output
  - `tests/` – MDES tests, currently unused

##### Chrome files

  - `background.js` – the "background page" for MDES, necessary for Chrome extensions
  - `manifest.json` – the project manifest
  - `icon.png`, `icon48.png`, `icon128.png` – icons!

##### Firefox files

  - `index.js` – this is Firefox's sort of "background page" for MDES, like what Chrome has, but just a JS file
  - `package.json` – the project manifest for the Firefox add-on

##### Safari files

  - `background-safari.html` – the "background page" for MDES, necessary for Safari extensions
  - `Info.plist` – the project manifest
  - `icon.png`, `icon48.png`, `icon128.png` – icons!

## Building development versions of the extension

MDES is built with [gulp](http://gulpjs.com/).

First time installation:

1. Install [node.js](http://nodejs.org) (version 4+).
1. Install [Python 2](https://www.python.org/downloads/) (*not* version 3).
1. Run `npm install -g gulp`.
1. Navigate to your MDES folder.
1. Run `npm install`.

Once done, you can build the extension by running `gulp`. This will also start a watch task that will rebuild MDES when you make changes (see [Advanced Usage](#details-and-advanced-usage) for more details). If you're having issues with building the extension, try uninstalling global `gulp` (`npm uninstall -g gulp`) and reinstalling it.

To load the extension into your browser, see [the sections below](#building-in-chrome).

#### Details and Advanced Usage

JavaScript files in `lib/` (except `lib/vendor/`) will be compiled with [Babel](https://babeljs.io/).

Sass (`.scss`) files in `lib/` will be compiled with [Sass](http://sass-lang.com/) and post-processed with [Autoprefixer](https://github.com/postcss/autoprefixer).

**`gulp`** will run `gulp clean` and `gulp watch` in sequence.

**`gulp clean`** will delete the build output subdirectories of the `dist/` directory.

**`gulp build`** will build MDES, copying the resultant files into the `dist/` directory. It is recommended to run `gulp clean` first.

**`gulp watch`** will run `gulp build`, then re-run it when anything changes. Only changed files will be rebuilt.

**`gulp add-module --file module.js`** will add `module.js`, a new module, to the manifest for each browser.

**`gulp add-host --file hostname.js`** will add `hostname.js`, a new media host, to the manifest for each browser.

**`gulp zip --zipdir /path/to/zip/directory`** will compress the build folders in `dist/` into .zip files. If no `--zipdir` is specified, the .zip files will be placed in `dist/zip/`. It is recommended to run `gulp build` first.

**`gulp <tasks> -b chrome -b firefox`** can be used with any of the above commands to specify individual browsers (chrome, firefox, safari), instead of performing the task(s) for all of them.

**`gulp travis`** will verify the code style (and point out any errors) of all `.js` files in `lib/` (except `lib/vendor/`) using [ESLint](http://eslint.org/), as well as all `.scss` files with [scss-lint](https://github.com/brigade/scss-lint). It will also run QUnit tests (in `tests/qunit`). We recommend that you run this before opening a pull request. (This is used by Travis CI to automatically test pull requests.)

Note: You will need to install [Ruby](https://www.ruby-lang.org/) and run `gem install scss_lint` before using `gulp travis`.

##### Building in Chrome

  1. Go to `Menu->Tools->Extensions` and tick the `Developer Mode` checkbox
  2. Choose `Load unpacked extension` and point it to the `dist/chrome` folder. Make sure you only have one MDES version running at a time.
  3. Any time you make changes to the script, you must go back to the `Menu->Tools->Extensions` page and `Reload` the extension.

##### Building in Firefox

  1. Install [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm) using `npm`: `npm install -g jpm`
  2. Navigate to `dist/firefox` and run the command `jpm run`, which should launch a new Firefox browser using a temporary profile with only MDES installed.

##### Building in Safari (assumes Mac)

  1. Open the `Preferences` by going to `Safari->Preferences` or pressing `⌘,`, then go to `Advanced` and check the checkbox for `Show Develop menu in menu bar`.
  2. Navigate to `Develop->Show Extension Builder` to open the extensions builder. Add a new extension by pressing the `+` in the bottom left and choosing `Add Extension`.
  3. Navigate to the `dist/RES.safariextension` folder for MDES and select it.
  4. If you are using Safari 9+, you should be able to install the extension without enrolling in the [Apple Developer Program](https://developer.apple.com/programs/); however, the extension will be auto-uninstalled when you quit Safari.

  If you use an older version of Safari or find the auto-uninstall annoying, you need to purchase a proper certificate by signing up for the [Apple Developer Program](https://developer.apple.com/programs/) (currently $99/yr).

##### Modules

Create a new `.js` file in `lib/modules`. Use [gulp add-module](#details-and-advanced-usage) to add the file to the browsers' manifests.

##### Inline image viewer hosts

See `lib/modules/hosts/example.js` for an example.

Create a new `.js` file in `lib/modules/hosts`. Use [gulp add-host](#details-and-advanced-usage) to add the file to the browsers' manifests.

##### Stylesheets

Create a new Sass partial under `lib/css/` (with a leading underscore, e.g. `_myPartial.scss`). Import the file in `lib/css/res.scss` (i.e. `@import 'modules/myPartial';` - do not include the underscore or file extension). You do not need to add it to any browser manifests.

Body classes will be automatically added for boolean and enum options with the property `bodyClass: true`, in the form `.res-moduleId-optionKey` for boolean options (only when they're enabled), and `.res-moduleId-optionKey-optionValue` for enums.
This is the preferred way to create optional CSS, do not use `addCSS()` unless absolutely necessary (i.e. variable color, size, etc.).
