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
    {
      role: "fileMenu",
      submenu: [isMac ? { role: "close", label: menuProps["close"] } : { role: "quit", label: menuProps["quit"] }],
      label: menuProps["fileMenu"],
    },
    {
      role: "editMenu",
      label: menuProps["editMenu"],
      submenu: [
        { role: "undo", label: menuProps["undo"] },
        { role: "redo", label: menuProps["redo"] },
        { type: "separator" },
        { role: "cut", label: menuProps["cut"] },
        { role: "copy", label: menuProps["copy"] },
        { role: "paste", label: menuProps["paste"] },
        ...(isMac
          ? ([
              { role: "pasteAndMatchStyle", label: menuProps["pasteAndMatchStyle"] },
              { role: "delete", label: menuProps["delete"] },
              { role: "selectAll", label: menuProps["selectAll"] },
              { type: "separator" },
              {
                label: menuProps["substitutions"],
                submenu: [
                  { role: "showSubstitutions", label: menuProps["showSubstitutions"] },
                  { type: "separator" },
                  { role: "toggleSmartQuotes", label: menuProps["toggleSmartQuotes"] },
                  { role: "toggleSmartDashes", label: menuProps["toggleSmartDashes"] },
                  { role: "toggleTextReplacement", label: menuProps["toggleTextReplacement"] },
                ],
              },
              {
                label: menuProps["speech"],
                submenu: [
                  { role: "startSpeaking", label: menuProps["startSpeaking"] },
                  { role: "stopSpeaking", label: menuProps["stopSpeaking"] },
                ],
              },
            ] as MenuItemConstructorOptions[])
          : ([
              { role: "delete", label: menuProps["delete"] },
              { type: "separator" },
              { role: "selectAll", label: menuProps["selectAll"] },
            ] as MenuItemConstructorOptions[])),
      ],
    },
    {
      label: menuProps["view"],
      submenu: isDev
        ? [
            { role: "reload", label: menuProps["reload"] },
            { role: "forceReload", label: menuProps["forceReload"] },
            { role: "toggleDevTools", label: menuProps["toggleDevTools"] },
            { type: "separator" },
            // { role: "resetZoom" },
            // { role: "zoomIn" },
            // { role: "zoomOut" },
            // { type: "separator" },
            { role: "togglefullscreen", label: menuProps["togglefullscreen"] },
          ]
        : [
            // { role: "resetZoom" },
            // { role: "zoomIn" },
            // { role: "zoomOut" },
            // { type: "separator" },
            { role: "togglefullscreen", label: menuProps["togglefullscreen"] },
          ],
    },
    {
      role: "windowMenu",
      label: menuProps["windowMenu"],
      submenu: [
        { role: "minimize", label: menuProps["minimize"] },
        { role: "zoom", label: menuProps["zoom"] },
        ...(isMac
          ? ([{ type: "separator" }, { role: "front", label: menuProps["front"] }] as MenuItemConstructorOptions[])
          : ([{ role: "close", label: menuProps["close"] }] as MenuItemConstructorOptions[])),
      ],
    },
    {
      label: menuProps["help"],
      submenu: [
        { role: "about", label: menuProps["about"] },
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
          label: menuProps["discord"],
          click: () => {
            shell.openExternal("https://discord.gg/XqmAYxm2Xf").catch((error) => {
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

  if (isMac) {
    template.unshift({
      role: "appMenu",
      submenu: [
        { role: "about", label: menuProps["about"] },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide", label: menuProps["hide"] },
        { role: "hideOthers", label: menuProps["hideOthers"] },
        { role: "unhide", label: menuProps["unhide"] },
        { type: "separator" },
        { role: "quit", label: menuProps["quit"] },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  return menu;
};
