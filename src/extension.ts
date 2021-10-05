"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import {
  window,
  commands,
  workspace,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  extensions,
} from "vscode";

interface Theme {
  id?: string;
  label: string;
  path: string;
  uiTheme: string;
}

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error).
  // This line of code will only be executed once when your extension is activated.
  const theme = new Shuffler([]);
  const all = commands.registerCommand("extension.themeDeck", () => {
    theme.grabAllThemes();
    theme.shuffle();
  });
  const light = commands.registerCommand("extension.themeDeckLight", () => {
    theme.grabAllThemes("light");
    theme.shuffle();
  });
  const dark = commands.registerCommand("extension.themeDeckDark", () => {
    theme.grabAllThemes("dark");
    theme.shuffle();
  });
  const favorites = commands.registerCommand(
    "extension.themeDeckFavorites",
    () => {
      theme.grabFavoriteThemes();
      theme.shuffle();
    }
  );

  // Favorite Theme Command
  const themeDeckAddRemove = commands.registerCommand(
    "extension.themeDeckAddRemove",
    () => {
      const currentTheme = theme.getTheme();
      const ref = workspace.getConfiguration("themeDeck");
      if (!(theme.favorites.indexOf(currentTheme) > -1)) {
        ref.update("favoriteThemes", [...theme.favorites, currentTheme], true);
        theme.favorites = [...theme.favorites, currentTheme];
      } else {
        ref.update(
          "favoriteThemes",
          theme.favorites.filter((f) => f !== currentTheme),
          true
        );
        theme.favorites = theme.favorites.filter((f) => f !== currentTheme);
      }
      theme.setStatusBar(currentTheme);
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
  context.subscriptions.push(themeDeckAddRemove);
}

class Shuffler {
  deck: string[];
  favorites: string[];
  allThemes: Theme[];
  constructor(deck: string[]) {
    this.deck = [];
    this.favorites = this.getFavoriteThemes();
    this.allThemes = this.grabAllTheme();
  }
  private _statusBarItem: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Left
  );
  getFavoriteThemes = (): string[] => {
    return workspace.getConfiguration("themeDeck").favoriteThemes as string[];
  };
  private grabAllExtensions() {
    return extensions.all.filter((el) => {
      if (el.packageJSON.contributes) {
        return "themes" in el.packageJSON.contributes;
      }
    });
  }
  private grabAllTheme(): Theme[] {
    const themeExtensions = this.grabAllExtensions();
    const themes = themeExtensions.map((themePack) =>
      Array.from(themePack.packageJSON.contributes.themes)
    );
    return [].concat.apply([], themes);
  }
  public grabAllThemes(
    specifier: "light" | "dark" | "favorites" | "all" = "all"
  ) {
    const arr = [];
    const currentTheme = this.getTheme();
    const themeExtensions = this.grabAllExtensions();
    for (let themePack of themeExtensions) {
      const themes = Array.from(themePack.packageJSON.contributes.themes);
      for (let theme of themes) {
        const candidate = (theme as any).label;
        switch (specifier) {
          case "dark":
            if (candidate !== currentTheme && !candidate.includes("Light")) {
              arr.push(candidate);
            }
            break;
          case "light":
            if (candidate !== currentTheme && candidate.includes("Light")) {
              arr.push(candidate);
            }
            break;
          default:
            if (candidate !== currentTheme) {
              arr.push(candidate);
            }
            break;
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
    const random = Math.floor(Math.random() * this.deck.length);
    const workbench = workspace.getConfiguration("workbench");
    const newTheme = this.deck[random];
    workbench.update("colorTheme", newTheme, true);
    this.setStatusBar(newTheme);
  }
  public setStatusBar(currentTheme: string) {
    const icon =
      this.favorites.indexOf(currentTheme) > -1
        ? "$(star-full)"
        : "$(star-empty)";
    this._statusBarItem.text = `${icon} ${currentTheme}`;
    this._statusBarItem.tooltip = "Click to add/remove from favorites";
    this._statusBarItem.command = "extension.themeDeckAddRemove";
    this._statusBarItem.show();
  }
  public getTheme() {
    const workbench = workspace.getConfiguration("workbench");
    return workbench.colorTheme;
  }
  dispose() {
    this._statusBarItem.dispose();
  }
}
