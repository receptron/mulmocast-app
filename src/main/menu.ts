import { Menu, MenuItemConstructorOptions } from "electron";

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
  { role: "help", submenu: [{ role: "about" }] },
];

if (process.platform === "darwin") template.unshift({ role: "appMenu" });

export const menu = Menu.buildFromTemplate(template);
