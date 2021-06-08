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
  extensions,
} from "vscode";

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error).
  // This line of code will only be executed once when your extension is activated.
  let theme = new Shuffler([]);
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
  let favorites = commands.registerCommand(
    "extension.themeDeckFavorites",
    () => {
      theme.grabFavoriteThemes();
      theme.shuffle();
    }
  );

  const update = () => {
    theme.shuffle();
  };
  const ref = workspace.getConfiguration("themeDeck");
  const intervalTime = ref.intervalTime * 60000;

  setInterval(update, intervalTime);
  context.subscriptions.push(theme);
  context.subscriptions.push(all);
  context.subscriptions.push(light);
  context.subscriptions.push(dark);
  context.subscriptions.push(favorites);
}

class Shuffler {
  deck: string[];
  constructor(deck: string[]) {
    this.deck = [];
  }
  private _statusBarItem: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Left
  );
  private grabAllExtensions() {
    let themeExtensions = extensions.all.filter((el) => {
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
    for (let themePack of themeExtensions) {
      let themes = Array.from(themePack.packageJSON.contributes.themes);
      for (let theme of themes) {
        let candidate = (theme as any).label;
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
    for (let themePack of themeExtensions) {
      let themes = Array.from(themePack.packageJSON.contributes.themes);
      for (let theme of themes) {
        let candidate = (theme as any).label;

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
    for (let themePack of themeExtensions) {
      let themes = Array.from(themePack.packageJSON.contributes.themes);
      for (let theme of themes) {
        let candidate = (theme as any).label;

        if (candidate !== currentTheme && candidate.includes("Light")) {
          arr.push(candidate);
        }
      }
    }
    this.deck = arr;
  }

  public grabFavoriteThemes() {
    const ref = workspace.getConfiguration("themeDeck");
    this.deck = ref.favoriteThemes;
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
