
# Sushi Browser

## Why?
 
When you are browsing the web you can only use a section of your screen. Have you ever thought that that's a waste?   
The concept of the "Sushi Browser" is wanting to utilize the screen to the maximum capacity just by a simple operation.  

"Multiple panels, sync scrolling, sidebar, slim menu, panel alignment etc. are some of the gimmicks it has onboard.  

[Downloads](#downloads)

![OverView](https://sushib.me/github/demos.gif)

## Table of Contents

* [Special features](#special-features)
  * [Multi panel](#multi-panel)
  * [Extension tools](#extension-tools)
  * <a href="#muon-electron-fork">Muon (Electron Fork)</a>
  * [Useful features](#useful-features)
  * [Web Technologies](#web-technologies)

* [Downloads](#downloads)

* [Use of Flash](#use-of-flash)

* [New Features](#new-features)

* [TODO](#todo)


# Special features

## Multi panel  

The browser's greatest feature is the specialized display and operation using multiple panels.   
It not only displays multiple web pages side-by-side but it also has various functions. 

#### 1. Display to the opposite panel  

By **middle clicking (pressing the mouse wheel)** the link you can open the page in the link to the opposite panel.   
**Middle clicking** with 1 panel automatically splits the display into 2 panels.   
Of course, just like ordinary browsers, it can be configured to open a new browser. 

#### 2. Sync scrolling 

By pressing the Sync scroll button, 1 page can be lined up like the pages of a book.  
Moreover, for a group of panels at this state, you can do actions such as scroll, page transition or close at the same time. 　
 
Also, right clicking the we page, you can choose from a menu for a 2-page spread that reads left to right or from right to left. (Commonly it's left to right) 

#### 3. Side (bottom) bar

You can open favorite pages or pages from your history using the side bar.  
The side bar can display web pages same as common panels. 　　  
The difference to common panels is even if you change the window size, the width remains fixed, and only this cannot be used with sync scrolling. 

#### 4. Slim menu 
In order to optimize the use of screen space, there are 2 possible display modes.  
- One Line mode: Using a display method that integrates the menu bar and tab bar, it achieves a menu with a mere 30px.   
- Full screen mode: The menu bar is not displayed and the menu is displayed by moving the cursor. 

#### 5. Panel movement
For general browser, by dragging and dropping the tab, you can move the tab.
In addition to moving the tab, this browser can be moved all the tabs of one tab to other panel or window by dragging or dropping the tab addition button.

#### 6. Float panel mode
By selecting Floating Panel from the menu that is displayed by right clicking a tab,you can detach the panel that can be moved within the window.   
It is a function that can be used for playing videos etc. while web browsing. 

#### 7. Simultaneous page transition 
By using a regular expression, the page URL can be permutated and opened in a different page.  
It can also open a normal page at the left and Google Translate at the right.   

The method of entering data is entering the regular expression for the URL at the left, and entering the text after permutation at the right.   
By using () at the left makes it CAPTCHA, and can be used for the content after permutation using numerals.   
(It can be used as text which was encoded with $$ numbers.)   

For example, by making the left side `(.+)` and the right side `https://www.google.com/search?q=$$1`, the target URL can be Google-searched. 

#### 8. Other
- Swapping panels: You can switch the position of 2 panels. 
- Aligning panels: Panels can be lined up with fixed widths horizontally or vertically. 
- Switch direction:You can realign vertically-lined panels horizontally or horizontally-lined panels vertically. 
- Simultaneous scrolling: By moving the mouse wheel, you can scroll 2 panels at the same time.
- Mobile mode: You can carry out the switch to pages for mobile device use. (Change of user agent)

## Extension tools 
As a special tool, it has the following functions. 
1. Terminal: It can operate Bash for Linux/Mac and Power Shell for Windows. 
2. File explorer: It can manage and browse files. 
3. Text editor: It can edit text and source codes etc.
4. Video playback: It can be used for automatic playback of videos. 

By taking advantage of the above functions operation close to IDE (integrated development environment) becomes possible.


## Muon (Electron Fork)
This browser uses [Muon](https://github.com/brave/muon) as a browser function.  
Muon is a framework for very fast browser with [Electron's](https://github.com/electron/electron) fork that was used for the [Brave browser](https://github.com/brave/browser-laptop).   

1. AdBlock: Equipped with a native-implemented high speed advertisement block.
2. Chromium: It uses Chromium in its engine, which implemented in Chrome's open source code. The newest, and moreover, high speed execution is possible. 
3. Partial support from Chrome extensions: It can use some of Chrome's extensions.


## Useful features

#### 1. Download function
- Video download: When downloading video and music information, download link is displayed automatically.  
- Parallel download: For 1 file it can download with a maximum of 16 parallel downloads. 

#### 2. Mouse gesture
It can use mouse gestures from Chrome's extension features. Even in Mac and Linux it can be used with the same operability as in Windows. 

#### 3. AutoPagerize
It can automatically read ahead websites that spans several pages. (Chrome Extension)

#### 4. Anything Search
When entering an address in the address bar, or by pressing the Shift key twice, it can carry out a search from the browser history. 

#### 5. Data syncing (Experimental)
Turning Sync Data on makes syncing possible from the history and favorites from multiple machines. 

## Web Technologies

This browser makes use of wonderful web technologies, starting with the following. 
- [Muon](https://github.com/brave/muon) (A fork from [Electron](https://github.com/electron/electron), used for the [Brave browser](https://github.com/brave/browser-laptop), and a framework for high speed browsers) 
- [Inferno](https://github.com/infernojs/inferno) (An extremely fast, React-like library)
- [Semantic UI React](https://github.com/Semantic-Org/Semantic-UI-React)
- [xterm.js](https://github.com/sourcelair/xterm.js/) (Terminal used for visual studio code etc.)

# Downloads
Both the installer for every platform and the portable version can be downloaded.  
To use the portable edition, please run sushi.exe for Windows and sushi-browser for Mac/Linux after decompressing.

- [Windows Installer v0.6.1](https://sushib.me/dl/sushi-browser-0.6.1-setup-x64.exe)
- [Windows Portable v0.6.1(self-extract)](https://sushib.me/dl/sushi-browser-0.6.1-win-x64.exe)
- [Windows Portable v0.6.1](https://sushib.me/dl/sushi-browser-0.6.1-win-x64.zip)
- [MacOS dmg v0.6.1](https://sushib.me/dl/SushiBrowser-0.6.1.dmg)
- [MacOS Portable v0.6.1](https://sushib.me/dl/sushi-browser-0.6.1-mac-x64.zip)
- [Linux rpm (for Fedora/CentOS) v0.6.1](https://sushib.me/dl/sushi-browser-0.6.1.x86_64.rpm)
- [Linux deb (for Debian/Ubuntu) v0.6.1](https://sushib.me/dl/sushi-browser_0.6.1_amd64.deb)
- [Linux Portable v0.6.1](https://sushib.me/dl/sushi-browser-0.6.1.tar.bz2)

# Use of Flash 
If Flash won't run, please install Flash from the following web sites.  
- [Adobe Flash Player](https://get.adobe.com/flashplayer/)

Also, for Linux, there are cases that it won't run after the above install.  
These will lower the security level but the following commands can be run. 
 
```
sushi-browser --no-sandbox
```

# New Features

#### New function(v0.61)
- Added session tab function
- Fixed bug at load start and stop

#### New function(v0.60)
- Speed up by making main synchronization processing asynchronous
- Speed up the process of creating new tabs
- Speed up display processing of Top page
- Update npm library

#### New function(v0.50)
- Added VPN function (Windows only). We are using the VPN Gate service and connect with MS-SSTP VPN. (It is a true VPN which is not a multiple proxy.)
- Added function to extract audio from video (using ffmpeg)
- Reduce download file size (initial launch after installation is slightly late)
- Fixed Issue #9 on MacOS(Command-scroll wheel to zoom is making my page all sorts of crazy sizes)
- Fixed Issue #10 on MacOS (Copy doesn't work on Mac OS)

#### New function(v0.40)
- The function to send and play URL to the external media player (such as VLC Media Player etc.) was added.
- The function to select multiple tabs and to enable tab operation and drop and drag was added.
- Fixed so that it works properly when the link is sent from the external application in the case that it is set up as a default browser.
- Fixed so that multiple applications start in parallel.

#### New function(v0.30-0.33)
- Improved top page's customizability 
- Fixed bug that does not start on Windows
- Added control of AdBlock by domain
- Added option page for extensions
- Performance improvement of the top menu history
- Add page translation function that use Simultaneous page transition to right click menu
- Reduced the number of files using asar archive
- Addition of update information notification
- Add the latest history information to the top page
- Improved performance when new window is opened
- Able bind other windows to the panel (Only for Windows and Linux )  
  Note:  Please install wmctrl when using on Linux. (apt-get install wmctrl or yum(dnf) install wmctrl)
- Multiple search at the same time by right-clicked menu
- Drop and drag to divide the panel
- Download function is changed to Aria2's wrapper. It has better performance and stability. The limit of the maximum of parallel download will be changed to 16(Aria2's maximum).
- Improvement of the sidebar bookmark and the history function.
- Improvement of the top menu bookmark and the history function.
- Mouse gesture for special pages like Top Page
- Improvement of the behavior of the private tab
- Introducing the full text search in history function (Experimental)
- Deleting unnecessary data (Reducing some download size)


#### New Function (v0.20-v0.21)
- Search engines can be selected.
- Multiple simultaneous search function, (For example, if you input "g4 word" in the address bar, you can search in multiple panels with different conditions simultaneously.)
- Partial localize.
- Addition of the setting pages.
- Addition of the keyboard shortcuts and the setting page for the key bind.
- Add a function to convert 1 window with multiple panels to multiple windows
- Improve performance with MacOS
- Add function of horizontal scrolling by using triple clicks
- Add comic pdf viewer
- Improve right click menu line order
- Changing the action of the mouse's middle click by pressing for a long time and clicking only. (For normal clicking, the opposite panel will be opened as link. When pressing for a long time, the same panel will be open in the background as link. )


# TODO

- Enhanced Anything Search
- Adblock control panel
- Addition of build method in the Readme
- Refactoring, introduction of Mobx (currently closely integrated with the PubSub base) 
- Add test code
- Auto Update
- Manual
- New features  
