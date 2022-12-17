/**
 * Calculate brightness value by HEX color.
 * Credit: https://gist.github.com/w3core/e3d9b5b6d69a3ba8671cc84714cca8a4
 * @param color (String) The color value in HEX (for example: #000000 || #000)
 * @returns (Number) The brightness value (dark) 0 ... 255 (light)
 */
function brightnessByColor(color) {
  color = "" + color;
  let m = color.substr(1).match(color.length == 7 ? /(\S{2})/g : /(\S{1})/g);
  let r = parseInt(m[0], 16),
    g = parseInt(m[1], 16),
    b = parseInt(m[2], 16);
  if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
}

export default brightnessByColor;
