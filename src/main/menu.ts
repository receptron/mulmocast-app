import { Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron";
import * as settingsManager from "./settings_manager";
import config from "../renderer/i18n/index";

const isDev = process.env.NODE_ENV === "development";

export const getMenu = async () => {
  const lang = settingsManager.loadAppLanguage();
  const menuProps = config.messages[lang as keyof typeof config.messages].nativeMenu;

  const template: MenuItemConstructorOptions[] = [
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: menuProps["view"],
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
      label: "Help",
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
            shell.openExternal("https://mulmocast.com/faq").catch((error) => {
              console.error("Failed to open external URL:", error);
            });
          },
        },
        {
          label: "ASK/Request",
          click: () => {
            shell
              .openExternal(
                "https://docs.google.com/forms/d/e/1FAIpQLSdOOhskhHyjIUhVTeDJaaNcX04nWT_s7xJTRao3gnC9fT6xkA/viewform?usp=dialog",
              )
              .catch((error) => {
                console.error("Failed to open external URL:", error);
              });
          },
        },
      ],
    },
  ];

  if (process.platform === "darwin") template.unshift({ role: "appMenu" });

  const menu = Menu.buildFromTemplate(template);
  return menu;
};
