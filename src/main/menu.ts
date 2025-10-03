import { Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron";

const isDev = process.env.NODE_ENV === "development";

const template: MenuItemConstructorOptions[] = [
  { role: "fileMenu" },
  { role: "editMenu" },
  {
    role: "viewMenu",
    submenu: isDev
      ? [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ]
      : [
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
  },
  { role: "windowMenu" },
  {
    role: "help",
    submenu: [
      { role: "about" },
      {
        label: "Settings",
        click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.webContents.send("navigate", "/settings");
          }
        },
      },
      {
        label: "FAQ",
        click: () => {
          shell.openExternal("https://mulmocast.com/faq");
        },
      },
      {
        label: "ASK/Request",
        click: () => {
          shell.openExternal(
            "https://docs.google.com/forms/d/e/1FAIpQLSdOOhskhHyjIUhVTeDJaaNcX04nWT_s7xJTRao3gnC9fT6xkA/viewform?usp=dialog",
          );
        },
      },
    ],
  },
];

if (process.platform === "darwin") template.unshift({ role: "appMenu" });

export const menu = Menu.buildFromTemplate(template);
