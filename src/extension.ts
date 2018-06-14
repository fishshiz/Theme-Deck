"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import {
  window,
  commands,
  workspace,
  Disposable,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
  extensions
} from "vscode";

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error).
  // This line of code will only be executed once when your extension is activated.
  let theme = new Shuffler([]);
  let deck;
  let all = commands.registerCommand("extension.themeDeck", () => {
    theme.grabAllThemes();
    theme.shuffle();
  });
  let light = commands.registerCommand("extension.themeDeckLight", () => {
    theme.grabLightThemes();
    theme.shuffle();
  });
  let dark = commands.registerCommand("extension.themeDeckDark", () => {
    theme.grabDarkThemes();
    theme.shuffle();
  });
  
  const update = () => {
    theme.shuffle();
  };
  let ref = workspace.getConfiguration("themeDeck");
  let intervalTime = ref.intervalTime * 60000;

  setInterval(update, intervalTime);
  context.subscriptions.push(theme);
  context.subscriptions.push(all);
  context.subscriptions.push(light);
  context.subscriptions.push(dark);
}

class Shuffler {
  deck: string[];
  constructor(deck: string[]) { this.deck = []; }
  private _statusBarItem: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Left
  );
  private grabAllExtensions() {
    let themeExtensions = extensions.all.filter(el => {
      if (el.packageJSON.contributes) {
        return "themes" in el.packageJSON.contributes;
      }
    });
    return themeExtensions;
  }
  public grabAllThemes() {
    const arr = [];
    let currentTheme = this._getTheme();
    let themeExtensions = this.grabAllExtensions();
    for (let i = 0; i < themeExtensions.length; i++) {
      let themes = Array.from(
        themeExtensions[i].packageJSON.contributes.themes
      );
      for (let j = 0; j < themes.length; j++) {
        let candidate = (themes[j] as any).label;
        if (candidate !== currentTheme) {
          arr.push(candidate);
        }
      }
    }
    this.deck = arr;
  }
  public grabDarkThemes() {
    const arr = [];
    let currentTheme = this._getTheme();
    let themeExtensions = this.grabAllExtensions();
    for (let i = 0; i < themeExtensions.length; i++) {
      let themes = Array.from(
        themeExtensions[i].packageJSON.contributes.themes
      );
      for (let j = 0; j < themes.length; j++) {
        let candidate = (themes[j] as any).label;

        if (candidate !== currentTheme && !candidate.includes("Light")) {
          arr.push(candidate);
        }
      }
    }
    this.deck = arr;
  }
  public grabLightThemes() {
    const arr = [];
    let currentTheme = this._getTheme();
    let themeExtensions = this.grabAllExtensions();
    for (let i = 0; i < themeExtensions.length; i++) {
      let themes = Array.from(
        themeExtensions[i].packageJSON.contributes.themes
      );
      for (let j = 0; j < themes.length; j++) {
        let candidate = (themes[j] as any).label;

        if (candidate !== currentTheme && candidate.includes("Light")) {
          arr.push(candidate);
        }
      }
    }
    this.deck = arr;
  }
  public shuffle() {
    // Get the current text editor
    let random = Math.floor(Math.random() * this.deck.length);
    let workbench = workspace.getConfiguration("workbench", null);
    let newTheme = this.deck[random];
    workbench.update("colorTheme", newTheme, 1);

    if (newTheme) {
      this._statusBarItem.text = `Current Theme: ${newTheme}`;
      this._statusBarItem.show();
    } else {
      this._statusBarItem.hide();
    }
  }
  public _getTheme() {
    let workbench = workspace.getConfiguration("workbench", null);
    let currTheme = workbench.colorTheme;
    return currTheme;
  }
  dispose() {
    this._statusBarItem.dispose();
  }
}
