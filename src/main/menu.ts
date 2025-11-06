import { Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron";
import * as settingsManager from "./settings_manager";
import config from "../renderer/i18n/index";

const isDev = process.env.NODE_ENV === "development";

// https://github.com/electron/electron/blob/main/lib/browser/api/menu-item-roles.ts
export const getMenu = async () => {
  const lang = settingsManager.loadAppLanguage();
  const menuProps = config.messages[lang as keyof typeof config.messages].nativeMenu;
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    { role: "fileMenu", submenu: [isMac ? { role: "close" } : { role: "quit" }], label: menuProps["fileMenu"] },
    {
      role: "editMenu",
      label: menuProps["editMenu"],
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? ([
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Substitutions",
                submenu: [
                  { role: "showSubstitutions" },
                  { type: "separator" },
                  { role: "toggleSmartQuotes" },
                  { role: "toggleSmartDashes" },
                  { role: "toggleTextReplacement" },
                ],
              },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ] as MenuItemConstructorOptions[])
          : ([{ role: "delete" }, { type: "separator" }, { role: "selectAll" }] as MenuItemConstructorOptions[])),
      ],
    },
    {
      label: menuProps["view"],
      submenu: isDev
        ? [
            { role: "reload" },
            { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
            // { role: "resetZoom" },
            // { role: "zoomIn" },
            // { role: "zoomOut" },
            // { type: "separator" },
            { role: "togglefullscreen" },
          ]
        : [
            // { role: "resetZoom" },
            // { role: "zoomIn" },
            // { role: "zoomOut" },
            // { type: "separator" },
            { role: "togglefullscreen" },
          ],
    },
    {
      role: "windowMenu",
      label: menuProps["windowMenu"],
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? ([{ type: "separator" }, { role: "front" }] as MenuItemConstructorOptions[])
          : ([{ role: "close" }] as MenuItemConstructorOptions[])),
      ],
    },
    {
      label: menuProps["help"],
      submenu: [
        { role: "about" },
        {
          label: menuProps["settings"],
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.send("navigate", "/settings");
            }
          },
        },
        {
          label: menuProps["FAQ"],
          click: () => {
            shell.openExternal("https://mulmocast.com/faq").catch((error) => {
              console.error("Failed to open external URL:", error);
            });
          },
        },
        {
          label: menuProps["ASK"],
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

  if (isMac) template.unshift({ role: "appMenu" });

  const menu = Menu.buildFromTemplate(template);
  return menu;
};
