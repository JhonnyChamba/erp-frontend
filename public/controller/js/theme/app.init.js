const modoOscuro = $("#sessionModo").val();
const colorTablas = $("#sessionModoColorTablas").val();

var userSettings = {
  Layout: "vertical", // vertical | horizontal
  SidebarType: "full", // full | mini-sidebar
  BoxedLayout: true, // true | false
  Direction: "ltr", // ltr | rtl
  Theme: modoOscuro, // light | dark
  ColorTheme: colorTablas, // Blue_Theme | Aqua_Theme | Purple_Theme | Green_Theme | Cyan_Theme | Orange_Theme
  cardBorder: false, // true | false
};

