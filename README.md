<img src="./assets/fusenfull.png" alt="fusen logo" width="200"/>

# fusen – stick to things
[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE.md)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/quietscher/fusen/issues?q=is%3Aissue+is%3Aopen)
[![made with hearth by quietscher](https://img.shields.io/badge/made%20with%20%E2%99%A5%20by-quietscher-ff1414.svg?style=flat-square)](https://github.com//quietscher)
<br>
Welcome to a new world of saving notes. 🗃️<br>
fusen [付箋](https://www.japandict.com/%E4%BB%98%E7%AE%8B) lets you add sticky notes to any webpage, that stay where you created them.
<br>
<br>
Core values of fusen are:

- have your notes only where you need them
- quick space to scribble ideas
- built in markdown support
- quick and easy keyboard shortcuts
- keeps your data locally 
- configuration when notes should show
    - default filtering by domain
    - custom filtering by pathname
- open source 🥳

## In action

<img src="./assets/fusen.gif" alt="fusen demo" width="600"/>

## Installation

Download the latest .zip version from the [releases page](https://github.com/Quietscher/fusen/releases).<br>
Extract it in a folder of your choice. <br>
Open the [extension page](chrome://extensions/) in your chromium browser.<br>
(Enable developer mode if you haven't already.)<br>
Click on "Load unpacked" and select the extracted fusen folder.<br>
Done! 🎉

## Contribution

Have a look at the issues or open a new one with your ideas :)<br>
Then fork the repository and create a pull request.<br>

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl + ⌘/⊞ + x | Delete Note |
| Ctrl + ⌘/⊞ + y | New Note |
| Ctrl + ⌘/⊞ + < | Temporarily Close Note |

## Configuration

You can configure the match percentage for the pathname in the extension settings via the popup.<br>
With it you can define how sticky notes are matched to the current page by the pathname.<br>
The input defines the percentage of the pathname that must match to show the sticky note.<br>

## License of used libraries

- marked.js
  - License
    Copyright (c) 2011-2022, Christopher Jeffrey. (MIT License)
  - Repo: [marked](https://github.com/markedjs/marked)
  - Full License at: [here](/libs/marked.LICENSE)
