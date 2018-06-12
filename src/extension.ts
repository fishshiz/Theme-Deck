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
  console.log(
    'Congratulations, your extension "Theme Deck" is now active!'
  );
  let theme = new Shuffler();
  let shuf = commands.registerCommand("extension.themeDeck", () => {
    theme.shuffle();
  });
  const update = () => {
    // let theme = new Shuffler();
    let shuff = theme.shuffle();
  };
  let ref = workspace.getConfiguration("themeDeck");
  let intervalTime = ref.intervalTime * 60000;

  setInterval(update, intervalTime);
  context.subscriptions.push(theme);
  context.subscriptions.push(shuf);
  // Add to a list of disposables which are disposed when this extension is deactivated.
}

class Shuffler {
  private _statusBarItem: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Left
  );
  public shuffle() {
    // Get the current text editor
    const arr = [];
    let currentTheme = this._getTheme();
    console.log(currentTheme);
    let themeExtensions = extensions.all.filter(el => {
      if (el.packageJSON.contributes) {
        return "themes" in el.packageJSON.contributes;
      }
    });
    for (let i = 0; i < themeExtensions.length; i++) {
      let themes = Array.from(
        themeExtensions[i].packageJSON.contributes.themes
      );
      for (let j = 0; j < themes.length; j++) {
        if (themes[j].label !== currentTheme) {
          arr.push(themes[j].label);
        }
      }
    }

    let random = Math.floor(Math.random() * arr.length);
    let workbench = workspace.getConfiguration("workbench", null);
    let newTheme = arr[random];
    workbench.update("colorTheme", newTheme, 1);

    if (newTheme) {
      this._statusBarItem.text = `Current Theme: ${newTheme}`;
      this._statusBarItem.show();
    } else {
      this._statusBarItem.hide();
    }

    // Only update status if an Markdown file
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