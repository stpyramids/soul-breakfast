(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a2, b2) => {
    for (var prop in b2 || (b2 = {}))
      if (__hasOwnProp.call(b2, prop))
        __defNormalProp(a2, prop, b2[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b2)) {
        if (__propIsEnum.call(b2, prop))
          __defNormalProp(a2, prop, b2[prop]);
      }
    return a2;
  };
  var __spreadProps = (a2, b2) => __defProps(a2, __getOwnPropDescs(b2));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/rot-js/lib/rng.js
  var FRAC = 23283064365386963e-26;
  var RNG = class {
    constructor() {
      this._seed = 0;
      this._s0 = 0;
      this._s1 = 0;
      this._s2 = 0;
      this._c = 0;
    }
    getSeed() {
      return this._seed;
    }
    setSeed(seed) {
      seed = seed < 1 ? 1 / seed : seed;
      this._seed = seed;
      this._s0 = (seed >>> 0) * FRAC;
      seed = seed * 69069 + 1 >>> 0;
      this._s1 = seed * FRAC;
      seed = seed * 69069 + 1 >>> 0;
      this._s2 = seed * FRAC;
      this._c = 1;
      return this;
    }
    getUniform() {
      let t2 = 2091639 * this._s0 + this._c * FRAC;
      this._s0 = this._s1;
      this._s1 = this._s2;
      this._c = t2 | 0;
      this._s2 = t2 - this._c;
      return this._s2;
    }
    getUniformInt(lowerBound, upperBound) {
      let max = Math.max(lowerBound, upperBound);
      let min = Math.min(lowerBound, upperBound);
      return Math.floor(this.getUniform() * (max - min + 1)) + min;
    }
    getNormal(mean = 0, stddev = 1) {
      let u2, v2, r2;
      do {
        u2 = 2 * this.getUniform() - 1;
        v2 = 2 * this.getUniform() - 1;
        r2 = u2 * u2 + v2 * v2;
      } while (r2 > 1 || r2 == 0);
      let gauss = u2 * Math.sqrt(-2 * Math.log(r2) / r2);
      return mean + gauss * stddev;
    }
    getPercentage() {
      return 1 + Math.floor(this.getUniform() * 100);
    }
    getItem(array) {
      if (!array.length) {
        return null;
      }
      return array[Math.floor(this.getUniform() * array.length)];
    }
    shuffle(array) {
      let result = [];
      let clone = array.slice();
      while (clone.length) {
        let index = clone.indexOf(this.getItem(clone));
        result.push(clone.splice(index, 1)[0]);
      }
      return result;
    }
    getWeightedValue(data) {
      let total = 0;
      for (let id2 in data) {
        total += data[id2];
      }
      let random = this.getUniform() * total;
      let id, part = 0;
      for (id in data) {
        part += data[id];
        if (random < part) {
          return id;
        }
      }
      return id;
    }
    getState() {
      return [this._s0, this._s1, this._s2, this._c];
    }
    setState(state) {
      this._s0 = state[0];
      this._s1 = state[1];
      this._s2 = state[2];
      this._c = state[3];
      return this;
    }
    clone() {
      let clone = new RNG();
      return clone.setState(this.getState());
    }
  };
  var rng_default = new RNG().setSeed(Date.now());

  // node_modules/rot-js/lib/display/backend.js
  var Backend = class {
    getContainer() {
      return null;
    }
    setOptions(options) {
      this._options = options;
    }
  };

  // node_modules/rot-js/lib/display/canvas.js
  var Canvas = class extends Backend {
    constructor() {
      super();
      this._ctx = document.createElement("canvas").getContext("2d");
    }
    schedule(cb) {
      requestAnimationFrame(cb);
    }
    getContainer() {
      return this._ctx.canvas;
    }
    setOptions(opts) {
      super.setOptions(opts);
      const style = opts.fontStyle ? `${opts.fontStyle} ` : ``;
      const font = `${style} ${opts.fontSize}px ${opts.fontFamily}`;
      this._ctx.font = font;
      this._updateSize();
      this._ctx.font = font;
      this._ctx.textAlign = "center";
      this._ctx.textBaseline = "middle";
    }
    clear() {
      this._ctx.fillStyle = this._options.bg;
      this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
    }
    eventToPosition(x2, y2) {
      let canvas = this._ctx.canvas;
      let rect = canvas.getBoundingClientRect();
      x2 -= rect.left;
      y2 -= rect.top;
      x2 *= canvas.width / rect.width;
      y2 *= canvas.height / rect.height;
      if (x2 < 0 || y2 < 0 || x2 >= canvas.width || y2 >= canvas.height) {
        return [-1, -1];
      }
      return this._normalizedEventToPosition(x2, y2);
    }
  };

  // node_modules/rot-js/lib/util.js
  var util_exports = {};
  __export(util_exports, {
    capitalize: () => capitalize,
    clamp: () => clamp,
    format: () => format,
    mod: () => mod
  });
  function mod(x2, n2) {
    return (x2 % n2 + n2) % n2;
  }
  function clamp(val, min = 0, max = 1) {
    if (val < min)
      return min;
    if (val > max)
      return max;
    return val;
  }
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substring(1);
  }
  function format(template, ...args) {
    let map = format.map;
    let replacer = function(match, group1, group2, index) {
      if (template.charAt(index - 1) == "%") {
        return match.substring(1);
      }
      if (!args.length) {
        return match;
      }
      let obj = args[0];
      let group = group1 || group2;
      let parts = group.split(",");
      let name = parts.shift() || "";
      let method = map[name.toLowerCase()];
      if (!method) {
        return match;
      }
      obj = args.shift();
      let replaced = obj[method].apply(obj, parts);
      let first = name.charAt(0);
      if (first != first.toLowerCase()) {
        replaced = capitalize(replaced);
      }
      return replaced;
    };
    return template.replace(/%(?:([a-z]+)|(?:{([^}]+)}))/gi, replacer);
  }
  format.map = {
    "s": "toString"
  };

  // node_modules/rot-js/lib/display/hex.js
  var Hex = class extends Canvas {
    constructor() {
      super();
      this._spacingX = 0;
      this._spacingY = 0;
      this._hexSize = 0;
    }
    draw(data, clearBefore) {
      let [x2, y2, ch, fg, bg] = data;
      let px = [
        (x2 + 1) * this._spacingX,
        y2 * this._spacingY + this._hexSize
      ];
      if (this._options.transpose) {
        px.reverse();
      }
      if (clearBefore) {
        this._ctx.fillStyle = bg;
        this._fill(px[0], px[1]);
      }
      if (!ch) {
        return;
      }
      this._ctx.fillStyle = fg;
      let chars = [].concat(ch);
      for (let i2 = 0; i2 < chars.length; i2++) {
        this._ctx.fillText(chars[i2], px[0], Math.ceil(px[1]));
      }
    }
    computeSize(availWidth, availHeight) {
      if (this._options.transpose) {
        availWidth += availHeight;
        availHeight = availWidth - availHeight;
        availWidth -= availHeight;
      }
      let width = Math.floor(availWidth / this._spacingX) - 1;
      let height = Math.floor((availHeight - 2 * this._hexSize) / this._spacingY + 1);
      return [width, height];
    }
    computeFontSize(availWidth, availHeight) {
      if (this._options.transpose) {
        availWidth += availHeight;
        availHeight = availWidth - availHeight;
        availWidth -= availHeight;
      }
      let hexSizeWidth = 2 * availWidth / ((this._options.width + 1) * Math.sqrt(3)) - 1;
      let hexSizeHeight = availHeight / (2 + 1.5 * (this._options.height - 1));
      let hexSize = Math.min(hexSizeWidth, hexSizeHeight);
      let oldFont = this._ctx.font;
      this._ctx.font = "100px " + this._options.fontFamily;
      let width = Math.ceil(this._ctx.measureText("W").width);
      this._ctx.font = oldFont;
      let ratio = width / 100;
      hexSize = Math.floor(hexSize) + 1;
      let fontSize = 2 * hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));
      return Math.ceil(fontSize) - 1;
    }
    _normalizedEventToPosition(x2, y2) {
      let nodeSize;
      if (this._options.transpose) {
        x2 += y2;
        y2 = x2 - y2;
        x2 -= y2;
        nodeSize = this._ctx.canvas.width;
      } else {
        nodeSize = this._ctx.canvas.height;
      }
      let size = nodeSize / this._options.height;
      y2 = Math.floor(y2 / size);
      if (mod(y2, 2)) {
        x2 -= this._spacingX;
        x2 = 1 + 2 * Math.floor(x2 / (2 * this._spacingX));
      } else {
        x2 = 2 * Math.floor(x2 / (2 * this._spacingX));
      }
      return [x2, y2];
    }
    _fill(cx, cy) {
      let a2 = this._hexSize;
      let b2 = this._options.border;
      const ctx = this._ctx;
      ctx.beginPath();
      if (this._options.transpose) {
        ctx.moveTo(cx - a2 + b2, cy);
        ctx.lineTo(cx - a2 / 2 + b2, cy + this._spacingX - b2);
        ctx.lineTo(cx + a2 / 2 - b2, cy + this._spacingX - b2);
        ctx.lineTo(cx + a2 - b2, cy);
        ctx.lineTo(cx + a2 / 2 - b2, cy - this._spacingX + b2);
        ctx.lineTo(cx - a2 / 2 + b2, cy - this._spacingX + b2);
        ctx.lineTo(cx - a2 + b2, cy);
      } else {
        ctx.moveTo(cx, cy - a2 + b2);
        ctx.lineTo(cx + this._spacingX - b2, cy - a2 / 2 + b2);
        ctx.lineTo(cx + this._spacingX - b2, cy + a2 / 2 - b2);
        ctx.lineTo(cx, cy + a2 - b2);
        ctx.lineTo(cx - this._spacingX + b2, cy + a2 / 2 - b2);
        ctx.lineTo(cx - this._spacingX + b2, cy - a2 / 2 + b2);
        ctx.lineTo(cx, cy - a2 + b2);
      }
      ctx.fill();
    }
    _updateSize() {
      const opts = this._options;
      const charWidth = Math.ceil(this._ctx.measureText("W").width);
      this._hexSize = Math.floor(opts.spacing * (opts.fontSize + charWidth / Math.sqrt(3)) / 2);
      this._spacingX = this._hexSize * Math.sqrt(3) / 2;
      this._spacingY = this._hexSize * 1.5;
      let xprop;
      let yprop;
      if (opts.transpose) {
        xprop = "height";
        yprop = "width";
      } else {
        xprop = "width";
        yprop = "height";
      }
      this._ctx.canvas[xprop] = Math.ceil((opts.width + 1) * this._spacingX);
      this._ctx.canvas[yprop] = Math.ceil((opts.height - 1) * this._spacingY + 2 * this._hexSize);
    }
  };

  // node_modules/rot-js/lib/display/rect.js
  var Rect = (() => {
    class Rect2 extends Canvas {
      constructor() {
        super();
        this._spacingX = 0;
        this._spacingY = 0;
        this._canvasCache = {};
      }
      setOptions(options) {
        super.setOptions(options);
        this._canvasCache = {};
      }
      draw(data, clearBefore) {
        if (Rect2.cache) {
          this._drawWithCache(data);
        } else {
          this._drawNoCache(data, clearBefore);
        }
      }
      _drawWithCache(data) {
        let [x2, y2, ch, fg, bg] = data;
        let hash = "" + ch + fg + bg;
        let canvas;
        if (hash in this._canvasCache) {
          canvas = this._canvasCache[hash];
        } else {
          let b2 = this._options.border;
          canvas = document.createElement("canvas");
          let ctx = canvas.getContext("2d");
          canvas.width = this._spacingX;
          canvas.height = this._spacingY;
          ctx.fillStyle = bg;
          ctx.fillRect(b2, b2, canvas.width - b2, canvas.height - b2);
          if (ch) {
            ctx.fillStyle = fg;
            ctx.font = this._ctx.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            let chars = [].concat(ch);
            for (let i2 = 0; i2 < chars.length; i2++) {
              ctx.fillText(chars[i2], this._spacingX / 2, Math.ceil(this._spacingY / 2));
            }
          }
          this._canvasCache[hash] = canvas;
        }
        this._ctx.drawImage(canvas, x2 * this._spacingX, y2 * this._spacingY);
      }
      _drawNoCache(data, clearBefore) {
        let [x2, y2, ch, fg, bg] = data;
        if (clearBefore) {
          let b2 = this._options.border;
          this._ctx.fillStyle = bg;
          this._ctx.fillRect(x2 * this._spacingX + b2, y2 * this._spacingY + b2, this._spacingX - b2, this._spacingY - b2);
        }
        if (!ch) {
          return;
        }
        this._ctx.fillStyle = fg;
        let chars = [].concat(ch);
        for (let i2 = 0; i2 < chars.length; i2++) {
          this._ctx.fillText(chars[i2], (x2 + 0.5) * this._spacingX, Math.ceil((y2 + 0.5) * this._spacingY));
        }
      }
      computeSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._spacingX);
        let height = Math.floor(availHeight / this._spacingY);
        return [width, height];
      }
      computeFontSize(availWidth, availHeight) {
        let boxWidth = Math.floor(availWidth / this._options.width);
        let boxHeight = Math.floor(availHeight / this._options.height);
        let oldFont = this._ctx.font;
        this._ctx.font = "100px " + this._options.fontFamily;
        let width = Math.ceil(this._ctx.measureText("W").width);
        this._ctx.font = oldFont;
        let ratio = width / 100;
        let widthFraction = ratio * boxHeight / boxWidth;
        if (widthFraction > 1) {
          boxHeight = Math.floor(boxHeight / widthFraction);
        }
        return Math.floor(boxHeight / this._options.spacing);
      }
      _normalizedEventToPosition(x2, y2) {
        return [Math.floor(x2 / this._spacingX), Math.floor(y2 / this._spacingY)];
      }
      _updateSize() {
        const opts = this._options;
        const charWidth = Math.ceil(this._ctx.measureText("W").width);
        this._spacingX = Math.ceil(opts.spacing * charWidth);
        this._spacingY = Math.ceil(opts.spacing * opts.fontSize);
        if (opts.forceSquareRatio) {
          this._spacingX = this._spacingY = Math.max(this._spacingX, this._spacingY);
        }
        this._ctx.canvas.width = opts.width * this._spacingX;
        this._ctx.canvas.height = opts.height * this._spacingY;
      }
    }
    Rect2.cache = false;
    return Rect2;
  })();
  var rect_default = Rect;

  // node_modules/rot-js/lib/display/tile.js
  var Tile = class extends Canvas {
    constructor() {
      super();
      this._colorCanvas = document.createElement("canvas");
    }
    draw(data, clearBefore) {
      let [x2, y2, ch, fg, bg] = data;
      let tileWidth = this._options.tileWidth;
      let tileHeight = this._options.tileHeight;
      if (clearBefore) {
        if (this._options.tileColorize) {
          this._ctx.clearRect(x2 * tileWidth, y2 * tileHeight, tileWidth, tileHeight);
        } else {
          this._ctx.fillStyle = bg;
          this._ctx.fillRect(x2 * tileWidth, y2 * tileHeight, tileWidth, tileHeight);
        }
      }
      if (!ch) {
        return;
      }
      let chars = [].concat(ch);
      let fgs = [].concat(fg);
      let bgs = [].concat(bg);
      for (let i2 = 0; i2 < chars.length; i2++) {
        let tile = this._options.tileMap[chars[i2]];
        if (!tile) {
          throw new Error(`Char "${chars[i2]}" not found in tileMap`);
        }
        if (this._options.tileColorize) {
          let canvas = this._colorCanvas;
          let context = canvas.getContext("2d");
          context.globalCompositeOperation = "source-over";
          context.clearRect(0, 0, tileWidth, tileHeight);
          let fg2 = fgs[i2];
          let bg2 = bgs[i2];
          context.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
          if (fg2 != "transparent") {
            context.fillStyle = fg2;
            context.globalCompositeOperation = "source-atop";
            context.fillRect(0, 0, tileWidth, tileHeight);
          }
          if (bg2 != "transparent") {
            context.fillStyle = bg2;
            context.globalCompositeOperation = "destination-over";
            context.fillRect(0, 0, tileWidth, tileHeight);
          }
          this._ctx.drawImage(canvas, x2 * tileWidth, y2 * tileHeight, tileWidth, tileHeight);
        } else {
          this._ctx.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, x2 * tileWidth, y2 * tileHeight, tileWidth, tileHeight);
        }
      }
    }
    computeSize(availWidth, availHeight) {
      let width = Math.floor(availWidth / this._options.tileWidth);
      let height = Math.floor(availHeight / this._options.tileHeight);
      return [width, height];
    }
    computeFontSize() {
      throw new Error("Tile backend does not understand font size");
    }
    _normalizedEventToPosition(x2, y2) {
      return [Math.floor(x2 / this._options.tileWidth), Math.floor(y2 / this._options.tileHeight)];
    }
    _updateSize() {
      const opts = this._options;
      this._ctx.canvas.width = opts.width * opts.tileWidth;
      this._ctx.canvas.height = opts.height * opts.tileHeight;
      this._colorCanvas.width = opts.tileWidth;
      this._colorCanvas.height = opts.tileHeight;
    }
  };

  // node_modules/rot-js/lib/color.js
  function fromString(str) {
    let cached, r2;
    if (str in CACHE) {
      cached = CACHE[str];
    } else {
      if (str.charAt(0) == "#") {
        let matched = str.match(/[0-9a-f]/gi) || [];
        let values = matched.map((x2) => parseInt(x2, 16));
        if (values.length == 3) {
          cached = values.map((x2) => x2 * 17);
        } else {
          for (let i2 = 0; i2 < 3; i2++) {
            values[i2 + 1] += 16 * values[i2];
            values.splice(i2, 1);
          }
          cached = values;
        }
      } else if (r2 = str.match(/rgb\(([0-9, ]+)\)/i)) {
        cached = r2[1].split(/\s*,\s*/).map((x2) => parseInt(x2));
      } else {
        cached = [0, 0, 0];
      }
      CACHE[str] = cached;
    }
    return cached.slice();
  }
  var CACHE = {
    "black": [0, 0, 0],
    "navy": [0, 0, 128],
    "darkblue": [0, 0, 139],
    "mediumblue": [0, 0, 205],
    "blue": [0, 0, 255],
    "darkgreen": [0, 100, 0],
    "green": [0, 128, 0],
    "teal": [0, 128, 128],
    "darkcyan": [0, 139, 139],
    "deepskyblue": [0, 191, 255],
    "darkturquoise": [0, 206, 209],
    "mediumspringgreen": [0, 250, 154],
    "lime": [0, 255, 0],
    "springgreen": [0, 255, 127],
    "aqua": [0, 255, 255],
    "cyan": [0, 255, 255],
    "midnightblue": [25, 25, 112],
    "dodgerblue": [30, 144, 255],
    "forestgreen": [34, 139, 34],
    "seagreen": [46, 139, 87],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "limegreen": [50, 205, 50],
    "mediumseagreen": [60, 179, 113],
    "turquoise": [64, 224, 208],
    "royalblue": [65, 105, 225],
    "steelblue": [70, 130, 180],
    "darkslateblue": [72, 61, 139],
    "mediumturquoise": [72, 209, 204],
    "indigo": [75, 0, 130],
    "darkolivegreen": [85, 107, 47],
    "cadetblue": [95, 158, 160],
    "cornflowerblue": [100, 149, 237],
    "mediumaquamarine": [102, 205, 170],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "slateblue": [106, 90, 205],
    "olivedrab": [107, 142, 35],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "mediumslateblue": [123, 104, 238],
    "lawngreen": [124, 252, 0],
    "chartreuse": [127, 255, 0],
    "aquamarine": [127, 255, 212],
    "maroon": [128, 0, 0],
    "purple": [128, 0, 128],
    "olive": [128, 128, 0],
    "gray": [128, 128, 128],
    "grey": [128, 128, 128],
    "skyblue": [135, 206, 235],
    "lightskyblue": [135, 206, 250],
    "blueviolet": [138, 43, 226],
    "darkred": [139, 0, 0],
    "darkmagenta": [139, 0, 139],
    "saddlebrown": [139, 69, 19],
    "darkseagreen": [143, 188, 143],
    "lightgreen": [144, 238, 144],
    "mediumpurple": [147, 112, 216],
    "darkviolet": [148, 0, 211],
    "palegreen": [152, 251, 152],
    "darkorchid": [153, 50, 204],
    "yellowgreen": [154, 205, 50],
    "sienna": [160, 82, 45],
    "brown": [165, 42, 42],
    "darkgray": [169, 169, 169],
    "darkgrey": [169, 169, 169],
    "lightblue": [173, 216, 230],
    "greenyellow": [173, 255, 47],
    "paleturquoise": [175, 238, 238],
    "lightsteelblue": [176, 196, 222],
    "powderblue": [176, 224, 230],
    "firebrick": [178, 34, 34],
    "darkgoldenrod": [184, 134, 11],
    "mediumorchid": [186, 85, 211],
    "rosybrown": [188, 143, 143],
    "darkkhaki": [189, 183, 107],
    "silver": [192, 192, 192],
    "mediumvioletred": [199, 21, 133],
    "indianred": [205, 92, 92],
    "peru": [205, 133, 63],
    "chocolate": [210, 105, 30],
    "tan": [210, 180, 140],
    "lightgray": [211, 211, 211],
    "lightgrey": [211, 211, 211],
    "palevioletred": [216, 112, 147],
    "thistle": [216, 191, 216],
    "orchid": [218, 112, 214],
    "goldenrod": [218, 165, 32],
    "crimson": [220, 20, 60],
    "gainsboro": [220, 220, 220],
    "plum": [221, 160, 221],
    "burlywood": [222, 184, 135],
    "lightcyan": [224, 255, 255],
    "lavender": [230, 230, 250],
    "darksalmon": [233, 150, 122],
    "violet": [238, 130, 238],
    "palegoldenrod": [238, 232, 170],
    "lightcoral": [240, 128, 128],
    "khaki": [240, 230, 140],
    "aliceblue": [240, 248, 255],
    "honeydew": [240, 255, 240],
    "azure": [240, 255, 255],
    "sandybrown": [244, 164, 96],
    "wheat": [245, 222, 179],
    "beige": [245, 245, 220],
    "whitesmoke": [245, 245, 245],
    "mintcream": [245, 255, 250],
    "ghostwhite": [248, 248, 255],
    "salmon": [250, 128, 114],
    "antiquewhite": [250, 235, 215],
    "linen": [250, 240, 230],
    "lightgoldenrodyellow": [250, 250, 210],
    "oldlace": [253, 245, 230],
    "red": [255, 0, 0],
    "fuchsia": [255, 0, 255],
    "magenta": [255, 0, 255],
    "deeppink": [255, 20, 147],
    "orangered": [255, 69, 0],
    "tomato": [255, 99, 71],
    "hotpink": [255, 105, 180],
    "coral": [255, 127, 80],
    "darkorange": [255, 140, 0],
    "lightsalmon": [255, 160, 122],
    "orange": [255, 165, 0],
    "lightpink": [255, 182, 193],
    "pink": [255, 192, 203],
    "gold": [255, 215, 0],
    "peachpuff": [255, 218, 185],
    "navajowhite": [255, 222, 173],
    "moccasin": [255, 228, 181],
    "bisque": [255, 228, 196],
    "mistyrose": [255, 228, 225],
    "blanchedalmond": [255, 235, 205],
    "papayawhip": [255, 239, 213],
    "lavenderblush": [255, 240, 245],
    "seashell": [255, 245, 238],
    "cornsilk": [255, 248, 220],
    "lemonchiffon": [255, 250, 205],
    "floralwhite": [255, 250, 240],
    "snow": [255, 250, 250],
    "yellow": [255, 255, 0],
    "lightyellow": [255, 255, 224],
    "ivory": [255, 255, 240],
    "white": [255, 255, 255]
  };

  // node_modules/rot-js/lib/display/tile-gl.js
  var TileGL = class extends Backend {
    constructor() {
      super();
      this._uniforms = {};
      try {
        this._gl = this._initWebGL();
      } catch (e2) {
        alert(e2.message);
      }
    }
    static isSupported() {
      return !!document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
    }
    schedule(cb) {
      requestAnimationFrame(cb);
    }
    getContainer() {
      return this._gl.canvas;
    }
    setOptions(opts) {
      super.setOptions(opts);
      this._updateSize();
      let tileSet = this._options.tileSet;
      if (tileSet && "complete" in tileSet && !tileSet.complete) {
        tileSet.addEventListener("load", () => this._updateTexture(tileSet));
      } else {
        this._updateTexture(tileSet);
      }
    }
    draw(data, clearBefore) {
      const gl = this._gl;
      const opts = this._options;
      let [x2, y2, ch, fg, bg] = data;
      let scissorY = gl.canvas.height - (y2 + 1) * opts.tileHeight;
      gl.scissor(x2 * opts.tileWidth, scissorY, opts.tileWidth, opts.tileHeight);
      if (clearBefore) {
        if (opts.tileColorize) {
          gl.clearColor(0, 0, 0, 0);
        } else {
          gl.clearColor(...parseColor(bg));
        }
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      if (!ch) {
        return;
      }
      let chars = [].concat(ch);
      let bgs = [].concat(bg);
      let fgs = [].concat(fg);
      gl.uniform2fv(this._uniforms["targetPosRel"], [x2, y2]);
      for (let i2 = 0; i2 < chars.length; i2++) {
        let tile = this._options.tileMap[chars[i2]];
        if (!tile) {
          throw new Error(`Char "${chars[i2]}" not found in tileMap`);
        }
        gl.uniform1f(this._uniforms["colorize"], opts.tileColorize ? 1 : 0);
        gl.uniform2fv(this._uniforms["tilesetPosAbs"], tile);
        if (opts.tileColorize) {
          gl.uniform4fv(this._uniforms["tint"], parseColor(fgs[i2]));
          gl.uniform4fv(this._uniforms["bg"], parseColor(bgs[i2]));
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
    clear() {
      const gl = this._gl;
      gl.clearColor(...parseColor(this._options.bg));
      gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    computeSize(availWidth, availHeight) {
      let width = Math.floor(availWidth / this._options.tileWidth);
      let height = Math.floor(availHeight / this._options.tileHeight);
      return [width, height];
    }
    computeFontSize() {
      throw new Error("Tile backend does not understand font size");
    }
    eventToPosition(x2, y2) {
      let canvas = this._gl.canvas;
      let rect = canvas.getBoundingClientRect();
      x2 -= rect.left;
      y2 -= rect.top;
      x2 *= canvas.width / rect.width;
      y2 *= canvas.height / rect.height;
      if (x2 < 0 || y2 < 0 || x2 >= canvas.width || y2 >= canvas.height) {
        return [-1, -1];
      }
      return this._normalizedEventToPosition(x2, y2);
    }
    _initWebGL() {
      let gl = document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
      window.gl = gl;
      let program = createProgram(gl, VS, FS);
      gl.useProgram(program);
      createQuad(gl);
      UNIFORMS.forEach((name) => this._uniforms[name] = gl.getUniformLocation(program, name));
      this._program = program;
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.SCISSOR_TEST);
      return gl;
    }
    _normalizedEventToPosition(x2, y2) {
      return [Math.floor(x2 / this._options.tileWidth), Math.floor(y2 / this._options.tileHeight)];
    }
    _updateSize() {
      const gl = this._gl;
      const opts = this._options;
      const canvasSize = [opts.width * opts.tileWidth, opts.height * opts.tileHeight];
      gl.canvas.width = canvasSize[0];
      gl.canvas.height = canvasSize[1];
      gl.viewport(0, 0, canvasSize[0], canvasSize[1]);
      gl.uniform2fv(this._uniforms["tileSize"], [opts.tileWidth, opts.tileHeight]);
      gl.uniform2fv(this._uniforms["targetSize"], canvasSize);
    }
    _updateTexture(tileSet) {
      createTexture(this._gl, tileSet);
    }
  };
  var UNIFORMS = ["targetPosRel", "tilesetPosAbs", "tileSize", "targetSize", "colorize", "bg", "tint"];
  var VS = `
#version 300 es

in vec2 tilePosRel;
out vec2 tilesetPosPx;

uniform vec2 tilesetPosAbs;
uniform vec2 tileSize;
uniform vec2 targetSize;
uniform vec2 targetPosRel;

void main() {
	vec2 targetPosPx = (targetPosRel + tilePosRel) * tileSize;
	vec2 targetPosNdc = ((targetPosPx / targetSize)-0.5)*2.0;
	targetPosNdc.y *= -1.0;

	gl_Position = vec4(targetPosNdc, 0.0, 1.0);
	tilesetPosPx = tilesetPosAbs + tilePosRel * tileSize;
}`.trim();
  var FS = `
#version 300 es
precision highp float;

in vec2 tilesetPosPx;
out vec4 fragColor;
uniform sampler2D image;
uniform bool colorize;
uniform vec4 bg;
uniform vec4 tint;

void main() {
	fragColor = vec4(0, 0, 0, 1);

	vec4 texel = texelFetch(image, ivec2(tilesetPosPx), 0);

	if (colorize) {
		texel.rgb = tint.a * tint.rgb + (1.0-tint.a) * texel.rgb;
		fragColor.rgb = texel.a*texel.rgb + (1.0-texel.a)*bg.rgb;
		fragColor.a = texel.a + (1.0-texel.a)*bg.a;
	} else {
		fragColor = texel;
	}
}`.trim();
  function createProgram(gl, vss, fss) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vss);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vs) || "");
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fss);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fs) || "");
    }
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || "");
    }
    return p;
  }
  function createQuad(gl) {
    const pos = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  function createTexture(gl, data) {
    let t2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return t2;
  }
  var colorCache = {};
  function parseColor(color) {
    if (!(color in colorCache)) {
      let parsed;
      if (color == "transparent") {
        parsed = [0, 0, 0, 0];
      } else if (color.indexOf("rgba") > -1) {
        parsed = (color.match(/[\d.]+/g) || []).map(Number);
        for (let i2 = 0; i2 < 3; i2++) {
          parsed[i2] = parsed[i2] / 255;
        }
      } else {
        parsed = fromString(color).map(($2) => $2 / 255);
        parsed.push(1);
      }
      colorCache[color] = parsed;
    }
    return colorCache[color];
  }

  // node_modules/rot-js/lib/display/term.js
  function clearToAnsi(bg) {
    return `\x1B[0;48;5;${termcolor(bg)}m\x1B[2J`;
  }
  function colorToAnsi(fg, bg) {
    return `\x1B[0;38;5;${termcolor(fg)};48;5;${termcolor(bg)}m`;
  }
  function positionToAnsi(x2, y2) {
    return `\x1B[${y2 + 1};${x2 + 1}H`;
  }
  function termcolor(color) {
    const SRC_COLORS = 256;
    const DST_COLORS = 6;
    const COLOR_RATIO = DST_COLORS / SRC_COLORS;
    let rgb2 = fromString(color);
    let r2 = Math.floor(rgb2[0] * COLOR_RATIO);
    let g2 = Math.floor(rgb2[1] * COLOR_RATIO);
    let b2 = Math.floor(rgb2[2] * COLOR_RATIO);
    return r2 * 36 + g2 * 6 + b2 * 1 + 16;
  }
  var Term = class extends Backend {
    constructor() {
      super();
      this._offset = [0, 0];
      this._cursor = [-1, -1];
      this._lastColor = "";
    }
    schedule(cb) {
      setTimeout(cb, 1e3 / 60);
    }
    setOptions(options) {
      super.setOptions(options);
      let size = [options.width, options.height];
      let avail = this.computeSize();
      this._offset = avail.map((val, index) => Math.floor((val - size[index]) / 2));
    }
    clear() {
      process.stdout.write(clearToAnsi(this._options.bg));
    }
    draw(data, clearBefore) {
      let [x2, y2, ch, fg, bg] = data;
      let dx = this._offset[0] + x2;
      let dy = this._offset[1] + y2;
      let size = this.computeSize();
      if (dx < 0 || dx >= size[0]) {
        return;
      }
      if (dy < 0 || dy >= size[1]) {
        return;
      }
      if (dx !== this._cursor[0] || dy !== this._cursor[1]) {
        process.stdout.write(positionToAnsi(dx, dy));
        this._cursor[0] = dx;
        this._cursor[1] = dy;
      }
      if (clearBefore) {
        if (!ch) {
          ch = " ";
        }
      }
      if (!ch) {
        return;
      }
      let newColor = colorToAnsi(fg, bg);
      if (newColor !== this._lastColor) {
        process.stdout.write(newColor);
        this._lastColor = newColor;
      }
      if (ch != "	") {
        let chars = [].concat(ch);
        process.stdout.write(chars[0]);
      }
      this._cursor[0]++;
      if (this._cursor[0] >= size[0]) {
        this._cursor[0] = 0;
        this._cursor[1]++;
      }
    }
    computeFontSize() {
      throw new Error("Terminal backend has no notion of font size");
    }
    eventToPosition(x2, y2) {
      return [x2, y2];
    }
    computeSize() {
      return [process.stdout.columns, process.stdout.rows];
    }
  };

  // node_modules/rot-js/lib/text.js
  var RE_COLORS = /%([bc]){([^}]*)}/g;
  var TYPE_TEXT = 0;
  var TYPE_NEWLINE = 1;
  var TYPE_FG = 2;
  var TYPE_BG = 3;
  function tokenize(str, maxWidth) {
    let result = [];
    let offset = 0;
    str.replace(RE_COLORS, function(match, type, name, index) {
      let part2 = str.substring(offset, index);
      if (part2.length) {
        result.push({
          type: TYPE_TEXT,
          value: part2
        });
      }
      result.push({
        type: type == "c" ? TYPE_FG : TYPE_BG,
        value: name.trim()
      });
      offset = index + match.length;
      return "";
    });
    let part = str.substring(offset);
    if (part.length) {
      result.push({
        type: TYPE_TEXT,
        value: part
      });
    }
    return breakLines(result, maxWidth);
  }
  function breakLines(tokens, maxWidth) {
    if (!maxWidth) {
      maxWidth = Infinity;
    }
    let i2 = 0;
    let lineLength = 0;
    let lastTokenWithSpace = -1;
    while (i2 < tokens.length) {
      let token = tokens[i2];
      if (token.type == TYPE_NEWLINE) {
        lineLength = 0;
        lastTokenWithSpace = -1;
      }
      if (token.type != TYPE_TEXT) {
        i2++;
        continue;
      }
      while (lineLength == 0 && token.value.charAt(0) == " ") {
        token.value = token.value.substring(1);
      }
      let index = token.value.indexOf("\n");
      if (index != -1) {
        token.value = breakInsideToken(tokens, i2, index, true);
        let arr = token.value.split("");
        while (arr.length && arr[arr.length - 1] == " ") {
          arr.pop();
        }
        token.value = arr.join("");
      }
      if (!token.value.length) {
        tokens.splice(i2, 1);
        continue;
      }
      if (lineLength + token.value.length > maxWidth) {
        let index2 = -1;
        while (1) {
          let nextIndex = token.value.indexOf(" ", index2 + 1);
          if (nextIndex == -1) {
            break;
          }
          if (lineLength + nextIndex > maxWidth) {
            break;
          }
          index2 = nextIndex;
        }
        if (index2 != -1) {
          token.value = breakInsideToken(tokens, i2, index2, true);
        } else if (lastTokenWithSpace != -1) {
          let token2 = tokens[lastTokenWithSpace];
          let breakIndex = token2.value.lastIndexOf(" ");
          token2.value = breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
          i2 = lastTokenWithSpace;
        } else {
          token.value = breakInsideToken(tokens, i2, maxWidth - lineLength, false);
        }
      } else {
        lineLength += token.value.length;
        if (token.value.indexOf(" ") != -1) {
          lastTokenWithSpace = i2;
        }
      }
      i2++;
    }
    tokens.push({ type: TYPE_NEWLINE });
    let lastTextToken = null;
    for (let i3 = 0; i3 < tokens.length; i3++) {
      let token = tokens[i3];
      switch (token.type) {
        case TYPE_TEXT:
          lastTextToken = token;
          break;
        case TYPE_NEWLINE:
          if (lastTextToken) {
            let arr = lastTextToken.value.split("");
            while (arr.length && arr[arr.length - 1] == " ") {
              arr.pop();
            }
            lastTextToken.value = arr.join("");
          }
          lastTextToken = null;
          break;
      }
    }
    tokens.pop();
    return tokens;
  }
  function breakInsideToken(tokens, tokenIndex, breakIndex, removeBreakChar) {
    let newBreakToken = {
      type: TYPE_NEWLINE
    };
    let newTextToken = {
      type: TYPE_TEXT,
      value: tokens[tokenIndex].value.substring(breakIndex + (removeBreakChar ? 1 : 0))
    };
    tokens.splice(tokenIndex + 1, 0, newBreakToken, newTextToken);
    return tokens[tokenIndex].value.substring(0, breakIndex);
  }

  // node_modules/rot-js/lib/constants.js
  var DEFAULT_WIDTH = 80;
  var DEFAULT_HEIGHT = 25;
  var DIRS = {
    4: [[0, -1], [1, 0], [0, 1], [-1, 0]],
    8: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
    6: [[-1, -1], [1, -1], [2, 0], [1, 1], [-1, 1], [-2, 0]]
  };

  // node_modules/rot-js/lib/display/display.js
  var BACKENDS = {
    "hex": Hex,
    "rect": rect_default,
    "tile": Tile,
    "tile-gl": TileGL,
    "term": Term
  };
  var DEFAULT_OPTIONS = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    transpose: false,
    layout: "rect",
    fontSize: 15,
    spacing: 1,
    border: 0,
    forceSquareRatio: false,
    fontFamily: "monospace",
    fontStyle: "",
    fg: "#ccc",
    bg: "#000",
    tileWidth: 32,
    tileHeight: 32,
    tileMap: {},
    tileSet: null,
    tileColorize: false
  };
  var Display = (() => {
    class Display2 {
      constructor(options = {}) {
        this._data = {};
        this._dirty = false;
        this._options = {};
        options = Object.assign({}, DEFAULT_OPTIONS, options);
        this.setOptions(options);
        this.DEBUG = this.DEBUG.bind(this);
        this._tick = this._tick.bind(this);
        this._backend.schedule(this._tick);
      }
      DEBUG(x2, y2, what) {
        let colors = [this._options.bg, this._options.fg];
        this.draw(x2, y2, null, null, colors[what % colors.length]);
      }
      clear() {
        this._data = {};
        this._dirty = true;
      }
      setOptions(options) {
        Object.assign(this._options, options);
        if (options.width || options.height || options.fontSize || options.fontFamily || options.spacing || options.layout) {
          if (options.layout) {
            let ctor = BACKENDS[options.layout];
            this._backend = new ctor();
          }
          this._backend.setOptions(this._options);
          this._dirty = true;
        }
        return this;
      }
      getOptions() {
        return this._options;
      }
      getContainer() {
        return this._backend.getContainer();
      }
      computeSize(availWidth, availHeight) {
        return this._backend.computeSize(availWidth, availHeight);
      }
      computeFontSize(availWidth, availHeight) {
        return this._backend.computeFontSize(availWidth, availHeight);
      }
      computeTileSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._options.width);
        let height = Math.floor(availHeight / this._options.height);
        return [width, height];
      }
      eventToPosition(e2) {
        let x2, y2;
        if ("touches" in e2) {
          x2 = e2.touches[0].clientX;
          y2 = e2.touches[0].clientY;
        } else {
          x2 = e2.clientX;
          y2 = e2.clientY;
        }
        return this._backend.eventToPosition(x2, y2);
      }
      draw(x2, y2, ch, fg, bg) {
        if (!fg) {
          fg = this._options.fg;
        }
        if (!bg) {
          bg = this._options.bg;
        }
        let key = `${x2},${y2}`;
        this._data[key] = [x2, y2, ch, fg, bg];
        if (this._dirty === true) {
          return;
        }
        if (!this._dirty) {
          this._dirty = {};
        }
        this._dirty[key] = true;
      }
      drawOver(x2, y2, ch, fg, bg) {
        const key = `${x2},${y2}`;
        const existing = this._data[key];
        if (existing) {
          existing[2] = ch || existing[2];
          existing[3] = fg || existing[3];
          existing[4] = bg || existing[4];
        } else {
          this.draw(x2, y2, ch, fg, bg);
        }
      }
      drawText(x2, y2, text, maxWidth) {
        let fg = null;
        let bg = null;
        let cx = x2;
        let cy = y2;
        let lines = 1;
        if (!maxWidth) {
          maxWidth = this._options.width - x2;
        }
        let tokens = tokenize(text, maxWidth);
        while (tokens.length) {
          let token = tokens.shift();
          switch (token.type) {
            case TYPE_TEXT:
              let isSpace = false, isPrevSpace = false, isFullWidth = false, isPrevFullWidth = false;
              for (let i2 = 0; i2 < token.value.length; i2++) {
                let cc = token.value.charCodeAt(i2);
                let c2 = token.value.charAt(i2);
                if (this._options.layout === "term") {
                  let cch = cc >> 8;
                  let isCJK = cch === 17 || cch >= 46 && cch <= 159 || cch >= 172 && cch <= 215 || cc >= 43360 && cc <= 43391;
                  if (isCJK) {
                    this.draw(cx + 0, cy, c2, fg, bg);
                    this.draw(cx + 1, cy, "	", fg, bg);
                    cx += 2;
                    continue;
                  }
                }
                isFullWidth = cc > 65280 && cc < 65377 || cc > 65500 && cc < 65512 || cc > 65518;
                isSpace = c2.charCodeAt(0) == 32 || c2.charCodeAt(0) == 12288;
                if (isPrevFullWidth && !isFullWidth && !isSpace) {
                  cx++;
                }
                if (isFullWidth && !isPrevSpace) {
                  cx++;
                }
                this.draw(cx++, cy, c2, fg, bg);
                isPrevSpace = isSpace;
                isPrevFullWidth = isFullWidth;
              }
              break;
            case TYPE_FG:
              fg = token.value || null;
              break;
            case TYPE_BG:
              bg = token.value || null;
              break;
            case TYPE_NEWLINE:
              cx = x2;
              cy++;
              lines++;
              break;
          }
        }
        return lines;
      }
      _tick() {
        this._backend.schedule(this._tick);
        if (!this._dirty) {
          return;
        }
        if (this._dirty === true) {
          this._backend.clear();
          for (let id in this._data) {
            this._draw(id, false);
          }
        } else {
          for (let key in this._dirty) {
            this._draw(key, true);
          }
        }
        this._dirty = false;
      }
      _draw(key, clearBefore) {
        let data = this._data[key];
        if (data[4] != this._options.bg) {
          clearBefore = true;
        }
        this._backend.draw(data, clearBefore);
      }
    }
    Display2.Rect = rect_default;
    Display2.Hex = Hex;
    Display2.Tile = Tile;
    Display2.TileGL = TileGL;
    Display2.Term = Term;
    return Display2;
  })();
  var display_default = Display;

  // node_modules/rot-js/lib/fov/fov.js
  var FOV = class {
    constructor(lightPassesCallback, options = {}) {
      this._lightPasses = lightPassesCallback;
      this._options = Object.assign({ topology: 8 }, options);
    }
    _getCircle(cx, cy, r2) {
      let result = [];
      let dirs, countFactor, startOffset;
      switch (this._options.topology) {
        case 4:
          countFactor = 1;
          startOffset = [0, 1];
          dirs = [
            DIRS[8][7],
            DIRS[8][1],
            DIRS[8][3],
            DIRS[8][5]
          ];
          break;
        case 6:
          dirs = DIRS[6];
          countFactor = 1;
          startOffset = [-1, 1];
          break;
        case 8:
          dirs = DIRS[4];
          countFactor = 2;
          startOffset = [-1, 1];
          break;
        default:
          throw new Error("Incorrect topology for FOV computation");
          break;
      }
      let x2 = cx + startOffset[0] * r2;
      let y2 = cy + startOffset[1] * r2;
      for (let i2 = 0; i2 < dirs.length; i2++) {
        for (let j2 = 0; j2 < r2 * countFactor; j2++) {
          result.push([x2, y2]);
          x2 += dirs[i2][0];
          y2 += dirs[i2][1];
        }
      }
      return result;
    }
  };

  // node_modules/rot-js/lib/fov/discrete-shadowcasting.js
  var DiscreteShadowcasting = class extends FOV {
    compute(x2, y2, R2, callback) {
      callback(x2, y2, 0, 1);
      if (!this._lightPasses(x2, y2)) {
        return;
      }
      let DATA = [];
      let A, B, cx, cy, blocks;
      for (let r2 = 1; r2 <= R2; r2++) {
        let neighbors = this._getCircle(x2, y2, r2);
        let angle = 360 / neighbors.length;
        for (let i2 = 0; i2 < neighbors.length; i2++) {
          cx = neighbors[i2][0];
          cy = neighbors[i2][1];
          A = angle * (i2 - 0.5);
          B = A + angle;
          blocks = !this._lightPasses(cx, cy);
          if (this._visibleCoords(Math.floor(A), Math.ceil(B), blocks, DATA)) {
            callback(cx, cy, r2, 1);
          }
          if (DATA.length == 2 && DATA[0] == 0 && DATA[1] == 360) {
            return;
          }
        }
      }
    }
    _visibleCoords(A, B, blocks, DATA) {
      if (A < 0) {
        let v1 = this._visibleCoords(0, B, blocks, DATA);
        let v2 = this._visibleCoords(360 + A, 360, blocks, DATA);
        return v1 || v2;
      }
      let index = 0;
      while (index < DATA.length && DATA[index] < A) {
        index++;
      }
      if (index == DATA.length) {
        if (blocks) {
          DATA.push(A, B);
        }
        return true;
      }
      let count = 0;
      if (index % 2) {
        while (index < DATA.length && DATA[index] < B) {
          index++;
          count++;
        }
        if (count == 0) {
          return false;
        }
        if (blocks) {
          if (count % 2) {
            DATA.splice(index - count, count, B);
          } else {
            DATA.splice(index - count, count);
          }
        }
        return true;
      } else {
        while (index < DATA.length && DATA[index] < B) {
          index++;
          count++;
        }
        if (A == DATA[index - count] && count == 1) {
          return false;
        }
        if (blocks) {
          if (count % 2) {
            DATA.splice(index - count, count, A);
          } else {
            DATA.splice(index - count, count, A, B);
          }
        }
        return true;
      }
    }
  };

  // node_modules/rot-js/lib/fov/precise-shadowcasting.js
  var PreciseShadowcasting = class extends FOV {
    compute(x2, y2, R2, callback) {
      callback(x2, y2, 0, 1);
      if (!this._lightPasses(x2, y2)) {
        return;
      }
      let SHADOWS = [];
      let cx, cy, blocks, A1, A2, visibility;
      for (let r2 = 1; r2 <= R2; r2++) {
        let neighbors = this._getCircle(x2, y2, r2);
        let neighborCount = neighbors.length;
        for (let i2 = 0; i2 < neighborCount; i2++) {
          cx = neighbors[i2][0];
          cy = neighbors[i2][1];
          A1 = [i2 ? 2 * i2 - 1 : 2 * neighborCount - 1, 2 * neighborCount];
          A2 = [2 * i2 + 1, 2 * neighborCount];
          blocks = !this._lightPasses(cx, cy);
          visibility = this._checkVisibility(A1, A2, blocks, SHADOWS);
          if (visibility) {
            callback(cx, cy, r2, visibility);
          }
          if (SHADOWS.length == 2 && SHADOWS[0][0] == 0 && SHADOWS[1][0] == SHADOWS[1][1]) {
            return;
          }
        }
      }
    }
    _checkVisibility(A1, A2, blocks, SHADOWS) {
      if (A1[0] > A2[0]) {
        let v1 = this._checkVisibility(A1, [A1[1], A1[1]], blocks, SHADOWS);
        let v2 = this._checkVisibility([0, 1], A2, blocks, SHADOWS);
        return (v1 + v2) / 2;
      }
      let index1 = 0, edge1 = false;
      while (index1 < SHADOWS.length) {
        let old = SHADOWS[index1];
        let diff = old[0] * A1[1] - A1[0] * old[1];
        if (diff >= 0) {
          if (diff == 0 && !(index1 % 2)) {
            edge1 = true;
          }
          break;
        }
        index1++;
      }
      let index2 = SHADOWS.length, edge2 = false;
      while (index2--) {
        let old = SHADOWS[index2];
        let diff = A2[0] * old[1] - old[0] * A2[1];
        if (diff >= 0) {
          if (diff == 0 && index2 % 2) {
            edge2 = true;
          }
          break;
        }
      }
      let visible = true;
      if (index1 == index2 && (edge1 || edge2)) {
        visible = false;
      } else if (edge1 && edge2 && index1 + 1 == index2 && index2 % 2) {
        visible = false;
      } else if (index1 > index2 && index1 % 2) {
        visible = false;
      }
      if (!visible) {
        return 0;
      }
      let visibleLength;
      let remove = index2 - index1 + 1;
      if (remove % 2) {
        if (index1 % 2) {
          let P2 = SHADOWS[index1];
          visibleLength = (A2[0] * P2[1] - P2[0] * A2[1]) / (P2[1] * A2[1]);
          if (blocks) {
            SHADOWS.splice(index1, remove, A2);
          }
        } else {
          let P2 = SHADOWS[index2];
          visibleLength = (P2[0] * A1[1] - A1[0] * P2[1]) / (A1[1] * P2[1]);
          if (blocks) {
            SHADOWS.splice(index1, remove, A1);
          }
        }
      } else {
        if (index1 % 2) {
          let P1 = SHADOWS[index1];
          let P2 = SHADOWS[index2];
          visibleLength = (P2[0] * P1[1] - P1[0] * P2[1]) / (P1[1] * P2[1]);
          if (blocks) {
            SHADOWS.splice(index1, remove);
          }
        } else {
          if (blocks) {
            SHADOWS.splice(index1, remove, A1, A2);
          }
          return 1;
        }
      }
      let arcLength = (A2[0] * A1[1] - A1[0] * A2[1]) / (A1[1] * A2[1]);
      return visibleLength / arcLength;
    }
  };

  // node_modules/rot-js/lib/fov/recursive-shadowcasting.js
  var OCTANTS = [
    [-1, 0, 0, 1],
    [0, -1, 1, 0],
    [0, -1, -1, 0],
    [-1, 0, 0, -1],
    [1, 0, 0, -1],
    [0, 1, -1, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 1]
  ];
  var RecursiveShadowcasting = class extends FOV {
    compute(x2, y2, R2, callback) {
      callback(x2, y2, 0, 1);
      for (let i2 = 0; i2 < OCTANTS.length; i2++) {
        this._renderOctant(x2, y2, OCTANTS[i2], R2, callback);
      }
    }
    compute180(x2, y2, R2, dir, callback) {
      callback(x2, y2, 0, 1);
      let previousOctant = (dir - 1 + 8) % 8;
      let nextPreviousOctant = (dir - 2 + 8) % 8;
      let nextOctant = (dir + 1 + 8) % 8;
      this._renderOctant(x2, y2, OCTANTS[nextPreviousOctant], R2, callback);
      this._renderOctant(x2, y2, OCTANTS[previousOctant], R2, callback);
      this._renderOctant(x2, y2, OCTANTS[dir], R2, callback);
      this._renderOctant(x2, y2, OCTANTS[nextOctant], R2, callback);
    }
    compute90(x2, y2, R2, dir, callback) {
      callback(x2, y2, 0, 1);
      let previousOctant = (dir - 1 + 8) % 8;
      this._renderOctant(x2, y2, OCTANTS[dir], R2, callback);
      this._renderOctant(x2, y2, OCTANTS[previousOctant], R2, callback);
    }
    _renderOctant(x2, y2, octant, R2, callback) {
      this._castVisibility(x2, y2, 1, 1, 0, R2 + 1, octant[0], octant[1], octant[2], octant[3], callback);
    }
    _castVisibility(startX, startY, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy, callback) {
      if (visSlopeStart < visSlopeEnd) {
        return;
      }
      for (let i2 = row; i2 <= radius; i2++) {
        let dx = -i2 - 1;
        let dy = -i2;
        let blocked = false;
        let newStart = 0;
        while (dx <= 0) {
          dx += 1;
          let mapX = startX + dx * xx + dy * xy;
          let mapY = startY + dx * yx + dy * yy;
          let slopeStart = (dx - 0.5) / (dy + 0.5);
          let slopeEnd = (dx + 0.5) / (dy - 0.5);
          if (slopeEnd > visSlopeStart) {
            continue;
          }
          if (slopeStart < visSlopeEnd) {
            break;
          }
          if (dx * dx + dy * dy < radius * radius) {
            callback(mapX, mapY, i2, 1);
          }
          if (!blocked) {
            if (!this._lightPasses(mapX, mapY) && i2 < radius) {
              blocked = true;
              this._castVisibility(startX, startY, i2 + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy, callback);
              newStart = slopeEnd;
            }
          } else {
            if (!this._lightPasses(mapX, mapY)) {
              newStart = slopeEnd;
              continue;
            }
            blocked = false;
            visSlopeStart = newStart;
          }
        }
        if (blocked) {
          break;
        }
      }
    }
  };

  // node_modules/rot-js/lib/fov/index.js
  var fov_default = { DiscreteShadowcasting, PreciseShadowcasting, RecursiveShadowcasting };

  // node_modules/rot-js/lib/map/map.js
  var Map2 = class {
    constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
      this._width = width;
      this._height = height;
    }
    _fillMap(value) {
      let map = [];
      for (let i2 = 0; i2 < this._width; i2++) {
        map.push([]);
        for (let j2 = 0; j2 < this._height; j2++) {
          map[i2].push(value);
        }
      }
      return map;
    }
  };

  // node_modules/rot-js/lib/map/arena.js
  var Arena = class extends Map2 {
    create(callback) {
      let w2 = this._width - 1;
      let h2 = this._height - 1;
      for (let i2 = 0; i2 <= w2; i2++) {
        for (let j2 = 0; j2 <= h2; j2++) {
          let empty = i2 && j2 && i2 < w2 && j2 < h2;
          callback(i2, j2, empty ? 0 : 1);
        }
      }
      return this;
    }
  };

  // node_modules/rot-js/lib/map/dungeon.js
  var Dungeon = class extends Map2 {
    constructor(width, height) {
      super(width, height);
      this._rooms = [];
      this._corridors = [];
    }
    getRooms() {
      return this._rooms;
    }
    getCorridors() {
      return this._corridors;
    }
  };

  // node_modules/rot-js/lib/map/features.js
  var Feature = class {
  };
  var Room = class extends Feature {
    constructor(x1, y1, x2, y2, doorX, doorY) {
      super();
      this._x1 = x1;
      this._y1 = y1;
      this._x2 = x2;
      this._y2 = y2;
      this._doors = {};
      if (doorX !== void 0 && doorY !== void 0) {
        this.addDoor(doorX, doorY);
      }
    }
    static createRandomAt(x2, y2, dx, dy, options) {
      let min = options.roomWidth[0];
      let max = options.roomWidth[1];
      let width = rng_default.getUniformInt(min, max);
      min = options.roomHeight[0];
      max = options.roomHeight[1];
      let height = rng_default.getUniformInt(min, max);
      if (dx == 1) {
        let y22 = y2 - Math.floor(rng_default.getUniform() * height);
        return new this(x2 + 1, y22, x2 + width, y22 + height - 1, x2, y2);
      }
      if (dx == -1) {
        let y22 = y2 - Math.floor(rng_default.getUniform() * height);
        return new this(x2 - width, y22, x2 - 1, y22 + height - 1, x2, y2);
      }
      if (dy == 1) {
        let x22 = x2 - Math.floor(rng_default.getUniform() * width);
        return new this(x22, y2 + 1, x22 + width - 1, y2 + height, x2, y2);
      }
      if (dy == -1) {
        let x22 = x2 - Math.floor(rng_default.getUniform() * width);
        return new this(x22, y2 - height, x22 + width - 1, y2 - 1, x2, y2);
      }
      throw new Error("dx or dy must be 1 or -1");
    }
    static createRandomCenter(cx, cy, options) {
      let min = options.roomWidth[0];
      let max = options.roomWidth[1];
      let width = rng_default.getUniformInt(min, max);
      min = options.roomHeight[0];
      max = options.roomHeight[1];
      let height = rng_default.getUniformInt(min, max);
      let x1 = cx - Math.floor(rng_default.getUniform() * width);
      let y1 = cy - Math.floor(rng_default.getUniform() * height);
      let x2 = x1 + width - 1;
      let y2 = y1 + height - 1;
      return new this(x1, y1, x2, y2);
    }
    static createRandom(availWidth, availHeight, options) {
      let min = options.roomWidth[0];
      let max = options.roomWidth[1];
      let width = rng_default.getUniformInt(min, max);
      min = options.roomHeight[0];
      max = options.roomHeight[1];
      let height = rng_default.getUniformInt(min, max);
      let left = availWidth - width - 1;
      let top = availHeight - height - 1;
      let x1 = 1 + Math.floor(rng_default.getUniform() * left);
      let y1 = 1 + Math.floor(rng_default.getUniform() * top);
      let x2 = x1 + width - 1;
      let y2 = y1 + height - 1;
      return new this(x1, y1, x2, y2);
    }
    addDoor(x2, y2) {
      this._doors[x2 + "," + y2] = 1;
      return this;
    }
    getDoors(cb) {
      for (let key in this._doors) {
        let parts = key.split(",");
        cb(parseInt(parts[0]), parseInt(parts[1]));
      }
      return this;
    }
    clearDoors() {
      this._doors = {};
      return this;
    }
    addDoors(isWallCallback) {
      let left = this._x1 - 1;
      let right = this._x2 + 1;
      let top = this._y1 - 1;
      let bottom = this._y2 + 1;
      for (let x2 = left; x2 <= right; x2++) {
        for (let y2 = top; y2 <= bottom; y2++) {
          if (x2 != left && x2 != right && y2 != top && y2 != bottom) {
            continue;
          }
          if (isWallCallback(x2, y2)) {
            continue;
          }
          this.addDoor(x2, y2);
        }
      }
      return this;
    }
    debug() {
      console.log("room", this._x1, this._y1, this._x2, this._y2);
    }
    isValid(isWallCallback, canBeDugCallback) {
      let left = this._x1 - 1;
      let right = this._x2 + 1;
      let top = this._y1 - 1;
      let bottom = this._y2 + 1;
      for (let x2 = left; x2 <= right; x2++) {
        for (let y2 = top; y2 <= bottom; y2++) {
          if (x2 == left || x2 == right || y2 == top || y2 == bottom) {
            if (!isWallCallback(x2, y2)) {
              return false;
            }
          } else {
            if (!canBeDugCallback(x2, y2)) {
              return false;
            }
          }
        }
      }
      return true;
    }
    create(digCallback) {
      let left = this._x1 - 1;
      let right = this._x2 + 1;
      let top = this._y1 - 1;
      let bottom = this._y2 + 1;
      let value = 0;
      for (let x2 = left; x2 <= right; x2++) {
        for (let y2 = top; y2 <= bottom; y2++) {
          if (x2 + "," + y2 in this._doors) {
            value = 2;
          } else if (x2 == left || x2 == right || y2 == top || y2 == bottom) {
            value = 1;
          } else {
            value = 0;
          }
          digCallback(x2, y2, value);
        }
      }
    }
    getCenter() {
      return [Math.round((this._x1 + this._x2) / 2), Math.round((this._y1 + this._y2) / 2)];
    }
    getLeft() {
      return this._x1;
    }
    getRight() {
      return this._x2;
    }
    getTop() {
      return this._y1;
    }
    getBottom() {
      return this._y2;
    }
  };
  var Corridor = class extends Feature {
    constructor(startX, startY, endX, endY) {
      super();
      this._startX = startX;
      this._startY = startY;
      this._endX = endX;
      this._endY = endY;
      this._endsWithAWall = true;
    }
    static createRandomAt(x2, y2, dx, dy, options) {
      let min = options.corridorLength[0];
      let max = options.corridorLength[1];
      let length = rng_default.getUniformInt(min, max);
      return new this(x2, y2, x2 + dx * length, y2 + dy * length);
    }
    debug() {
      console.log("corridor", this._startX, this._startY, this._endX, this._endY);
    }
    isValid(isWallCallback, canBeDugCallback) {
      let sx = this._startX;
      let sy = this._startY;
      let dx = this._endX - sx;
      let dy = this._endY - sy;
      let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
      if (dx) {
        dx = dx / Math.abs(dx);
      }
      if (dy) {
        dy = dy / Math.abs(dy);
      }
      let nx = dy;
      let ny = -dx;
      let ok = true;
      for (let i2 = 0; i2 < length; i2++) {
        let x2 = sx + i2 * dx;
        let y2 = sy + i2 * dy;
        if (!canBeDugCallback(x2, y2)) {
          ok = false;
        }
        if (!isWallCallback(x2 + nx, y2 + ny)) {
          ok = false;
        }
        if (!isWallCallback(x2 - nx, y2 - ny)) {
          ok = false;
        }
        if (!ok) {
          length = i2;
          this._endX = x2 - dx;
          this._endY = y2 - dy;
          break;
        }
      }
      if (length == 0) {
        return false;
      }
      if (length == 1 && isWallCallback(this._endX + dx, this._endY + dy)) {
        return false;
      }
      let firstCornerBad = !isWallCallback(this._endX + dx + nx, this._endY + dy + ny);
      let secondCornerBad = !isWallCallback(this._endX + dx - nx, this._endY + dy - ny);
      this._endsWithAWall = isWallCallback(this._endX + dx, this._endY + dy);
      if ((firstCornerBad || secondCornerBad) && this._endsWithAWall) {
        return false;
      }
      return true;
    }
    create(digCallback) {
      let sx = this._startX;
      let sy = this._startY;
      let dx = this._endX - sx;
      let dy = this._endY - sy;
      let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
      if (dx) {
        dx = dx / Math.abs(dx);
      }
      if (dy) {
        dy = dy / Math.abs(dy);
      }
      for (let i2 = 0; i2 < length; i2++) {
        let x2 = sx + i2 * dx;
        let y2 = sy + i2 * dy;
        digCallback(x2, y2, 0);
      }
      return true;
    }
    createPriorityWalls(priorityWallCallback) {
      if (!this._endsWithAWall) {
        return;
      }
      let sx = this._startX;
      let sy = this._startY;
      let dx = this._endX - sx;
      let dy = this._endY - sy;
      if (dx) {
        dx = dx / Math.abs(dx);
      }
      if (dy) {
        dy = dy / Math.abs(dy);
      }
      let nx = dy;
      let ny = -dx;
      priorityWallCallback(this._endX + dx, this._endY + dy);
      priorityWallCallback(this._endX + nx, this._endY + ny);
      priorityWallCallback(this._endX - nx, this._endY - ny);
    }
  };

  // node_modules/rot-js/lib/map/uniform.js
  var Uniform = class extends Dungeon {
    constructor(width, height, options) {
      super(width, height);
      this._options = {
        roomWidth: [3, 9],
        roomHeight: [3, 5],
        roomDugPercentage: 0.1,
        timeLimit: 1e3
      };
      Object.assign(this._options, options);
      this._map = [];
      this._dug = 0;
      this._roomAttempts = 20;
      this._corridorAttempts = 20;
      this._connected = [];
      this._unconnected = [];
      this._digCallback = this._digCallback.bind(this);
      this._canBeDugCallback = this._canBeDugCallback.bind(this);
      this._isWallCallback = this._isWallCallback.bind(this);
    }
    create(callback) {
      let t1 = Date.now();
      while (1) {
        let t2 = Date.now();
        if (t2 - t1 > this._options.timeLimit) {
          return null;
        }
        this._map = this._fillMap(1);
        this._dug = 0;
        this._rooms = [];
        this._unconnected = [];
        this._generateRooms();
        if (this._rooms.length < 2) {
          continue;
        }
        if (this._generateCorridors()) {
          break;
        }
      }
      if (callback) {
        for (let i2 = 0; i2 < this._width; i2++) {
          for (let j2 = 0; j2 < this._height; j2++) {
            callback(i2, j2, this._map[i2][j2]);
          }
        }
      }
      return this;
    }
    _generateRooms() {
      let w2 = this._width - 2;
      let h2 = this._height - 2;
      let room;
      do {
        room = this._generateRoom();
        if (this._dug / (w2 * h2) > this._options.roomDugPercentage) {
          break;
        }
      } while (room);
    }
    _generateRoom() {
      let count = 0;
      while (count < this._roomAttempts) {
        count++;
        let room = Room.createRandom(this._width, this._height, this._options);
        if (!room.isValid(this._isWallCallback, this._canBeDugCallback)) {
          continue;
        }
        room.create(this._digCallback);
        this._rooms.push(room);
        return room;
      }
      return null;
    }
    _generateCorridors() {
      let cnt = 0;
      while (cnt < this._corridorAttempts) {
        cnt++;
        this._corridors = [];
        this._map = this._fillMap(1);
        for (let i2 = 0; i2 < this._rooms.length; i2++) {
          let room = this._rooms[i2];
          room.clearDoors();
          room.create(this._digCallback);
        }
        this._unconnected = rng_default.shuffle(this._rooms.slice());
        this._connected = [];
        if (this._unconnected.length) {
          this._connected.push(this._unconnected.pop());
        }
        while (1) {
          let connected = rng_default.getItem(this._connected);
          if (!connected) {
            break;
          }
          let room1 = this._closestRoom(this._unconnected, connected);
          if (!room1) {
            break;
          }
          let room2 = this._closestRoom(this._connected, room1);
          if (!room2) {
            break;
          }
          let ok = this._connectRooms(room1, room2);
          if (!ok) {
            break;
          }
          if (!this._unconnected.length) {
            return true;
          }
        }
      }
      return false;
    }
    _closestRoom(rooms, room) {
      let dist = Infinity;
      let center = room.getCenter();
      let result = null;
      for (let i2 = 0; i2 < rooms.length; i2++) {
        let r2 = rooms[i2];
        let c2 = r2.getCenter();
        let dx = c2[0] - center[0];
        let dy = c2[1] - center[1];
        let d2 = dx * dx + dy * dy;
        if (d2 < dist) {
          dist = d2;
          result = r2;
        }
      }
      return result;
    }
    _connectRooms(room1, room2) {
      let center1 = room1.getCenter();
      let center2 = room2.getCenter();
      let diffX = center2[0] - center1[0];
      let diffY = center2[1] - center1[1];
      let start;
      let end;
      let dirIndex1, dirIndex2, min, max, index;
      if (Math.abs(diffX) < Math.abs(diffY)) {
        dirIndex1 = diffY > 0 ? 2 : 0;
        dirIndex2 = (dirIndex1 + 2) % 4;
        min = room2.getLeft();
        max = room2.getRight();
        index = 0;
      } else {
        dirIndex1 = diffX > 0 ? 1 : 3;
        dirIndex2 = (dirIndex1 + 2) % 4;
        min = room2.getTop();
        max = room2.getBottom();
        index = 1;
      }
      start = this._placeInWall(room1, dirIndex1);
      if (!start) {
        return false;
      }
      if (start[index] >= min && start[index] <= max) {
        end = start.slice();
        let value = 0;
        switch (dirIndex2) {
          case 0:
            value = room2.getTop() - 1;
            break;
          case 1:
            value = room2.getRight() + 1;
            break;
          case 2:
            value = room2.getBottom() + 1;
            break;
          case 3:
            value = room2.getLeft() - 1;
            break;
        }
        end[(index + 1) % 2] = value;
        this._digLine([start, end]);
      } else if (start[index] < min - 1 || start[index] > max + 1) {
        let diff = start[index] - center2[index];
        let rotation = 0;
        switch (dirIndex2) {
          case 0:
          case 1:
            rotation = diff < 0 ? 3 : 1;
            break;
          case 2:
          case 3:
            rotation = diff < 0 ? 1 : 3;
            break;
        }
        dirIndex2 = (dirIndex2 + rotation) % 4;
        end = this._placeInWall(room2, dirIndex2);
        if (!end) {
          return false;
        }
        let mid = [0, 0];
        mid[index] = start[index];
        let index2 = (index + 1) % 2;
        mid[index2] = end[index2];
        this._digLine([start, mid, end]);
      } else {
        let index2 = (index + 1) % 2;
        end = this._placeInWall(room2, dirIndex2);
        if (!end) {
          return false;
        }
        let mid = Math.round((end[index2] + start[index2]) / 2);
        let mid1 = [0, 0];
        let mid2 = [0, 0];
        mid1[index] = start[index];
        mid1[index2] = mid;
        mid2[index] = end[index];
        mid2[index2] = mid;
        this._digLine([start, mid1, mid2, end]);
      }
      room1.addDoor(start[0], start[1]);
      room2.addDoor(end[0], end[1]);
      index = this._unconnected.indexOf(room1);
      if (index != -1) {
        this._unconnected.splice(index, 1);
        this._connected.push(room1);
      }
      index = this._unconnected.indexOf(room2);
      if (index != -1) {
        this._unconnected.splice(index, 1);
        this._connected.push(room2);
      }
      return true;
    }
    _placeInWall(room, dirIndex) {
      let start = [0, 0];
      let dir = [0, 0];
      let length = 0;
      switch (dirIndex) {
        case 0:
          dir = [1, 0];
          start = [room.getLeft(), room.getTop() - 1];
          length = room.getRight() - room.getLeft() + 1;
          break;
        case 1:
          dir = [0, 1];
          start = [room.getRight() + 1, room.getTop()];
          length = room.getBottom() - room.getTop() + 1;
          break;
        case 2:
          dir = [1, 0];
          start = [room.getLeft(), room.getBottom() + 1];
          length = room.getRight() - room.getLeft() + 1;
          break;
        case 3:
          dir = [0, 1];
          start = [room.getLeft() - 1, room.getTop()];
          length = room.getBottom() - room.getTop() + 1;
          break;
      }
      let avail = [];
      let lastBadIndex = -2;
      for (let i2 = 0; i2 < length; i2++) {
        let x2 = start[0] + i2 * dir[0];
        let y2 = start[1] + i2 * dir[1];
        avail.push(null);
        let isWall = this._map[x2][y2] == 1;
        if (isWall) {
          if (lastBadIndex != i2 - 1) {
            avail[i2] = [x2, y2];
          }
        } else {
          lastBadIndex = i2;
          if (i2) {
            avail[i2 - 1] = null;
          }
        }
      }
      for (let i2 = avail.length - 1; i2 >= 0; i2--) {
        if (!avail[i2]) {
          avail.splice(i2, 1);
        }
      }
      return avail.length ? rng_default.getItem(avail) : null;
    }
    _digLine(points) {
      for (let i2 = 1; i2 < points.length; i2++) {
        let start = points[i2 - 1];
        let end = points[i2];
        let corridor = new Corridor(start[0], start[1], end[0], end[1]);
        corridor.create(this._digCallback);
        this._corridors.push(corridor);
      }
    }
    _digCallback(x2, y2, value) {
      this._map[x2][y2] = value;
      if (value == 0) {
        this._dug++;
      }
    }
    _isWallCallback(x2, y2) {
      if (x2 < 0 || y2 < 0 || x2 >= this._width || y2 >= this._height) {
        return false;
      }
      return this._map[x2][y2] == 1;
    }
    _canBeDugCallback(x2, y2) {
      if (x2 < 1 || y2 < 1 || x2 + 1 >= this._width || y2 + 1 >= this._height) {
        return false;
      }
      return this._map[x2][y2] == 1;
    }
  };

  // node_modules/rot-js/lib/map/cellular.js
  var Cellular = class extends Map2 {
    constructor(width, height, options = {}) {
      super(width, height);
      this._options = {
        born: [5, 6, 7, 8],
        survive: [4, 5, 6, 7, 8],
        topology: 8
      };
      this.setOptions(options);
      this._dirs = DIRS[this._options.topology];
      this._map = this._fillMap(0);
    }
    randomize(probability) {
      for (let i2 = 0; i2 < this._width; i2++) {
        for (let j2 = 0; j2 < this._height; j2++) {
          this._map[i2][j2] = rng_default.getUniform() < probability ? 1 : 0;
        }
      }
      return this;
    }
    setOptions(options) {
      Object.assign(this._options, options);
    }
    set(x2, y2, value) {
      this._map[x2][y2] = value;
    }
    create(callback) {
      let newMap2 = this._fillMap(0);
      let born = this._options.born;
      let survive = this._options.survive;
      for (let j2 = 0; j2 < this._height; j2++) {
        let widthStep = 1;
        let widthStart = 0;
        if (this._options.topology == 6) {
          widthStep = 2;
          widthStart = j2 % 2;
        }
        for (let i2 = widthStart; i2 < this._width; i2 += widthStep) {
          let cur = this._map[i2][j2];
          let ncount = this._getNeighbors(i2, j2);
          if (cur && survive.indexOf(ncount) != -1) {
            newMap2[i2][j2] = 1;
          } else if (!cur && born.indexOf(ncount) != -1) {
            newMap2[i2][j2] = 1;
          }
        }
      }
      this._map = newMap2;
      callback && this._serviceCallback(callback);
    }
    _serviceCallback(callback) {
      for (let j2 = 0; j2 < this._height; j2++) {
        let widthStep = 1;
        let widthStart = 0;
        if (this._options.topology == 6) {
          widthStep = 2;
          widthStart = j2 % 2;
        }
        for (let i2 = widthStart; i2 < this._width; i2 += widthStep) {
          callback(i2, j2, this._map[i2][j2]);
        }
      }
    }
    _getNeighbors(cx, cy) {
      let result = 0;
      for (let i2 = 0; i2 < this._dirs.length; i2++) {
        let dir = this._dirs[i2];
        let x2 = cx + dir[0];
        let y2 = cy + dir[1];
        if (x2 < 0 || x2 >= this._width || y2 < 0 || y2 >= this._height) {
          continue;
        }
        result += this._map[x2][y2] == 1 ? 1 : 0;
      }
      return result;
    }
    connect(callback, value, connectionCallback) {
      if (!value)
        value = 0;
      let allFreeSpace = [];
      let notConnected = {};
      let widthStep = 1;
      let widthStarts = [0, 0];
      if (this._options.topology == 6) {
        widthStep = 2;
        widthStarts = [0, 1];
      }
      for (let y2 = 0; y2 < this._height; y2++) {
        for (let x2 = widthStarts[y2 % 2]; x2 < this._width; x2 += widthStep) {
          if (this._freeSpace(x2, y2, value)) {
            let p = [x2, y2];
            notConnected[this._pointKey(p)] = p;
            allFreeSpace.push([x2, y2]);
          }
        }
      }
      let start = allFreeSpace[rng_default.getUniformInt(0, allFreeSpace.length - 1)];
      let key = this._pointKey(start);
      let connected = {};
      connected[key] = start;
      delete notConnected[key];
      this._findConnected(connected, notConnected, [start], false, value);
      while (Object.keys(notConnected).length > 0) {
        let p = this._getFromTo(connected, notConnected);
        let from = p[0];
        let to = p[1];
        let local = {};
        local[this._pointKey(from)] = from;
        this._findConnected(local, notConnected, [from], true, value);
        let tunnelFn = this._options.topology == 6 ? this._tunnelToConnected6 : this._tunnelToConnected;
        tunnelFn.call(this, to, from, connected, notConnected, value, connectionCallback);
        for (let k2 in local) {
          let pp = local[k2];
          this._map[pp[0]][pp[1]] = value;
          connected[k2] = pp;
          delete notConnected[k2];
        }
      }
      callback && this._serviceCallback(callback);
    }
    _getFromTo(connected, notConnected) {
      let from = [0, 0], to = [0, 0], d2;
      let connectedKeys = Object.keys(connected);
      let notConnectedKeys = Object.keys(notConnected);
      for (let i2 = 0; i2 < 5; i2++) {
        if (connectedKeys.length < notConnectedKeys.length) {
          let keys = connectedKeys;
          to = connected[keys[rng_default.getUniformInt(0, keys.length - 1)]];
          from = this._getClosest(to, notConnected);
        } else {
          let keys = notConnectedKeys;
          from = notConnected[keys[rng_default.getUniformInt(0, keys.length - 1)]];
          to = this._getClosest(from, connected);
        }
        d2 = (from[0] - to[0]) * (from[0] - to[0]) + (from[1] - to[1]) * (from[1] - to[1]);
        if (d2 < 64) {
          break;
        }
      }
      return [from, to];
    }
    _getClosest(point, space) {
      let minPoint = null;
      let minDist = null;
      for (let k2 in space) {
        let p = space[k2];
        let d2 = (p[0] - point[0]) * (p[0] - point[0]) + (p[1] - point[1]) * (p[1] - point[1]);
        if (minDist == null || d2 < minDist) {
          minDist = d2;
          minPoint = p;
        }
      }
      return minPoint;
    }
    _findConnected(connected, notConnected, stack, keepNotConnected, value) {
      while (stack.length > 0) {
        let p = stack.splice(0, 1)[0];
        let tests;
        if (this._options.topology == 6) {
          tests = [
            [p[0] + 2, p[1]],
            [p[0] + 1, p[1] - 1],
            [p[0] - 1, p[1] - 1],
            [p[0] - 2, p[1]],
            [p[0] - 1, p[1] + 1],
            [p[0] + 1, p[1] + 1]
          ];
        } else {
          tests = [
            [p[0] + 1, p[1]],
            [p[0] - 1, p[1]],
            [p[0], p[1] + 1],
            [p[0], p[1] - 1]
          ];
        }
        for (let i2 = 0; i2 < tests.length; i2++) {
          let key = this._pointKey(tests[i2]);
          if (connected[key] == null && this._freeSpace(tests[i2][0], tests[i2][1], value)) {
            connected[key] = tests[i2];
            if (!keepNotConnected) {
              delete notConnected[key];
            }
            stack.push(tests[i2]);
          }
        }
      }
    }
    _tunnelToConnected(to, from, connected, notConnected, value, connectionCallback) {
      let a2, b2;
      if (from[0] < to[0]) {
        a2 = from;
        b2 = to;
      } else {
        a2 = to;
        b2 = from;
      }
      for (let xx = a2[0]; xx <= b2[0]; xx++) {
        this._map[xx][a2[1]] = value;
        let p = [xx, a2[1]];
        let pkey = this._pointKey(p);
        connected[pkey] = p;
        delete notConnected[pkey];
      }
      if (connectionCallback && a2[0] < b2[0]) {
        connectionCallback(a2, [b2[0], a2[1]]);
      }
      let x2 = b2[0];
      if (from[1] < to[1]) {
        a2 = from;
        b2 = to;
      } else {
        a2 = to;
        b2 = from;
      }
      for (let yy = a2[1]; yy < b2[1]; yy++) {
        this._map[x2][yy] = value;
        let p = [x2, yy];
        let pkey = this._pointKey(p);
        connected[pkey] = p;
        delete notConnected[pkey];
      }
      if (connectionCallback && a2[1] < b2[1]) {
        connectionCallback([b2[0], a2[1]], [b2[0], b2[1]]);
      }
    }
    _tunnelToConnected6(to, from, connected, notConnected, value, connectionCallback) {
      let a2, b2;
      if (from[0] < to[0]) {
        a2 = from;
        b2 = to;
      } else {
        a2 = to;
        b2 = from;
      }
      let xx = a2[0];
      let yy = a2[1];
      while (!(xx == b2[0] && yy == b2[1])) {
        let stepWidth = 2;
        if (yy < b2[1]) {
          yy++;
          stepWidth = 1;
        } else if (yy > b2[1]) {
          yy--;
          stepWidth = 1;
        }
        if (xx < b2[0]) {
          xx += stepWidth;
        } else if (xx > b2[0]) {
          xx -= stepWidth;
        } else if (b2[1] % 2) {
          xx -= stepWidth;
        } else {
          xx += stepWidth;
        }
        this._map[xx][yy] = value;
        let p = [xx, yy];
        let pkey = this._pointKey(p);
        connected[pkey] = p;
        delete notConnected[pkey];
      }
      if (connectionCallback) {
        connectionCallback(from, to);
      }
    }
    _freeSpace(x2, y2, value) {
      return x2 >= 0 && x2 < this._width && y2 >= 0 && y2 < this._height && this._map[x2][y2] == value;
    }
    _pointKey(p) {
      return p[0] + "." + p[1];
    }
  };

  // node_modules/rot-js/lib/map/digger.js
  var FEATURES = {
    "room": Room,
    "corridor": Corridor
  };
  var Digger = class extends Dungeon {
    constructor(width, height, options = {}) {
      super(width, height);
      this._options = Object.assign({
        roomWidth: [3, 9],
        roomHeight: [3, 5],
        corridorLength: [3, 10],
        dugPercentage: 0.2,
        timeLimit: 1e3
      }, options);
      this._features = {
        "room": 4,
        "corridor": 4
      };
      this._map = [];
      this._featureAttempts = 20;
      this._walls = {};
      this._dug = 0;
      this._digCallback = this._digCallback.bind(this);
      this._canBeDugCallback = this._canBeDugCallback.bind(this);
      this._isWallCallback = this._isWallCallback.bind(this);
      this._priorityWallCallback = this._priorityWallCallback.bind(this);
    }
    create(callback) {
      this._rooms = [];
      this._corridors = [];
      this._map = this._fillMap(1);
      this._walls = {};
      this._dug = 0;
      let area = (this._width - 2) * (this._height - 2);
      this._firstRoom();
      let t1 = Date.now();
      let priorityWalls;
      do {
        priorityWalls = 0;
        let t2 = Date.now();
        if (t2 - t1 > this._options.timeLimit) {
          break;
        }
        let wall = this._findWall();
        if (!wall) {
          break;
        }
        let parts = wall.split(",");
        let x2 = parseInt(parts[0]);
        let y2 = parseInt(parts[1]);
        let dir = this._getDiggingDirection(x2, y2);
        if (!dir) {
          continue;
        }
        let featureAttempts = 0;
        do {
          featureAttempts++;
          if (this._tryFeature(x2, y2, dir[0], dir[1])) {
            this._removeSurroundingWalls(x2, y2);
            this._removeSurroundingWalls(x2 - dir[0], y2 - dir[1]);
            break;
          }
        } while (featureAttempts < this._featureAttempts);
        for (let id in this._walls) {
          if (this._walls[id] > 1) {
            priorityWalls++;
          }
        }
      } while (this._dug / area < this._options.dugPercentage || priorityWalls);
      this._addDoors();
      if (callback) {
        for (let i2 = 0; i2 < this._width; i2++) {
          for (let j2 = 0; j2 < this._height; j2++) {
            callback(i2, j2, this._map[i2][j2]);
          }
        }
      }
      this._walls = {};
      this._map = [];
      return this;
    }
    _digCallback(x2, y2, value) {
      if (value == 0 || value == 2) {
        this._map[x2][y2] = 0;
        this._dug++;
      } else {
        this._walls[x2 + "," + y2] = 1;
      }
    }
    _isWallCallback(x2, y2) {
      if (x2 < 0 || y2 < 0 || x2 >= this._width || y2 >= this._height) {
        return false;
      }
      return this._map[x2][y2] == 1;
    }
    _canBeDugCallback(x2, y2) {
      if (x2 < 1 || y2 < 1 || x2 + 1 >= this._width || y2 + 1 >= this._height) {
        return false;
      }
      return this._map[x2][y2] == 1;
    }
    _priorityWallCallback(x2, y2) {
      this._walls[x2 + "," + y2] = 2;
    }
    _firstRoom() {
      let cx = Math.floor(this._width / 2);
      let cy = Math.floor(this._height / 2);
      let room = Room.createRandomCenter(cx, cy, this._options);
      this._rooms.push(room);
      room.create(this._digCallback);
    }
    _findWall() {
      let prio1 = [];
      let prio2 = [];
      for (let id2 in this._walls) {
        let prio = this._walls[id2];
        if (prio == 2) {
          prio2.push(id2);
        } else {
          prio1.push(id2);
        }
      }
      let arr = prio2.length ? prio2 : prio1;
      if (!arr.length) {
        return null;
      }
      let id = rng_default.getItem(arr.sort());
      delete this._walls[id];
      return id;
    }
    _tryFeature(x2, y2, dx, dy) {
      let featureName = rng_default.getWeightedValue(this._features);
      let ctor = FEATURES[featureName];
      let feature = ctor.createRandomAt(x2, y2, dx, dy, this._options);
      if (!feature.isValid(this._isWallCallback, this._canBeDugCallback)) {
        return false;
      }
      feature.create(this._digCallback);
      if (feature instanceof Room) {
        this._rooms.push(feature);
      }
      if (feature instanceof Corridor) {
        feature.createPriorityWalls(this._priorityWallCallback);
        this._corridors.push(feature);
      }
      return true;
    }
    _removeSurroundingWalls(cx, cy) {
      let deltas = DIRS[4];
      for (let i2 = 0; i2 < deltas.length; i2++) {
        let delta = deltas[i2];
        let x2 = cx + delta[0];
        let y2 = cy + delta[1];
        delete this._walls[x2 + "," + y2];
        x2 = cx + 2 * delta[0];
        y2 = cy + 2 * delta[1];
        delete this._walls[x2 + "," + y2];
      }
    }
    _getDiggingDirection(cx, cy) {
      if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) {
        return null;
      }
      let result = null;
      let deltas = DIRS[4];
      for (let i2 = 0; i2 < deltas.length; i2++) {
        let delta = deltas[i2];
        let x2 = cx + delta[0];
        let y2 = cy + delta[1];
        if (!this._map[x2][y2]) {
          if (result) {
            return null;
          }
          result = delta;
        }
      }
      if (!result) {
        return null;
      }
      return [-result[0], -result[1]];
    }
    _addDoors() {
      let data = this._map;
      function isWallCallback(x2, y2) {
        return data[x2][y2] == 1;
      }
      ;
      for (let i2 = 0; i2 < this._rooms.length; i2++) {
        let room = this._rooms[i2];
        room.clearDoors();
        room.addDoors(isWallCallback);
      }
    }
  };

  // node_modules/rot-js/lib/map/ellermaze.js
  function addToList(i2, L2, R2) {
    R2[L2[i2 + 1]] = R2[i2];
    L2[R2[i2]] = L2[i2 + 1];
    R2[i2] = i2 + 1;
    L2[i2 + 1] = i2;
  }
  function removeFromList(i2, L2, R2) {
    R2[L2[i2]] = R2[i2];
    L2[R2[i2]] = L2[i2];
    R2[i2] = i2;
    L2[i2] = i2;
  }
  var EllerMaze = class extends Map2 {
    create(callback) {
      let map = this._fillMap(1);
      let w2 = Math.ceil((this._width - 2) / 2);
      let rand = 9 / 24;
      let L2 = [];
      let R2 = [];
      for (let i2 = 0; i2 < w2; i2++) {
        L2.push(i2);
        R2.push(i2);
      }
      L2.push(w2 - 1);
      let j2;
      for (j2 = 1; j2 + 3 < this._height; j2 += 2) {
        for (let i2 = 0; i2 < w2; i2++) {
          let x2 = 2 * i2 + 1;
          let y2 = j2;
          map[x2][y2] = 0;
          if (i2 != L2[i2 + 1] && rng_default.getUniform() > rand) {
            addToList(i2, L2, R2);
            map[x2 + 1][y2] = 0;
          }
          if (i2 != L2[i2] && rng_default.getUniform() > rand) {
            removeFromList(i2, L2, R2);
          } else {
            map[x2][y2 + 1] = 0;
          }
        }
      }
      for (let i2 = 0; i2 < w2; i2++) {
        let x2 = 2 * i2 + 1;
        let y2 = j2;
        map[x2][y2] = 0;
        if (i2 != L2[i2 + 1] && (i2 == L2[i2] || rng_default.getUniform() > rand)) {
          addToList(i2, L2, R2);
          map[x2 + 1][y2] = 0;
        }
        removeFromList(i2, L2, R2);
      }
      for (let i2 = 0; i2 < this._width; i2++) {
        for (let j3 = 0; j3 < this._height; j3++) {
          callback(i2, j3, map[i2][j3]);
        }
      }
      return this;
    }
  };

  // node_modules/rot-js/lib/map/dividedmaze.js
  var DividedMaze = class extends Map2 {
    constructor() {
      super(...arguments);
      this._stack = [];
      this._map = [];
    }
    create(callback) {
      let w2 = this._width;
      let h2 = this._height;
      this._map = [];
      for (let i2 = 0; i2 < w2; i2++) {
        this._map.push([]);
        for (let j2 = 0; j2 < h2; j2++) {
          let border = i2 == 0 || j2 == 0 || i2 + 1 == w2 || j2 + 1 == h2;
          this._map[i2].push(border ? 1 : 0);
        }
      }
      this._stack = [
        [1, 1, w2 - 2, h2 - 2]
      ];
      this._process();
      for (let i2 = 0; i2 < w2; i2++) {
        for (let j2 = 0; j2 < h2; j2++) {
          callback(i2, j2, this._map[i2][j2]);
        }
      }
      this._map = [];
      return this;
    }
    _process() {
      while (this._stack.length) {
        let room = this._stack.shift();
        this._partitionRoom(room);
      }
    }
    _partitionRoom(room) {
      let availX = [];
      let availY = [];
      for (let i2 = room[0] + 1; i2 < room[2]; i2++) {
        let top = this._map[i2][room[1] - 1];
        let bottom = this._map[i2][room[3] + 1];
        if (top && bottom && !(i2 % 2)) {
          availX.push(i2);
        }
      }
      for (let j2 = room[1] + 1; j2 < room[3]; j2++) {
        let left = this._map[room[0] - 1][j2];
        let right = this._map[room[2] + 1][j2];
        if (left && right && !(j2 % 2)) {
          availY.push(j2);
        }
      }
      if (!availX.length || !availY.length) {
        return;
      }
      let x2 = rng_default.getItem(availX);
      let y2 = rng_default.getItem(availY);
      this._map[x2][y2] = 1;
      let walls = [];
      let w2 = [];
      walls.push(w2);
      for (let i2 = room[0]; i2 < x2; i2++) {
        this._map[i2][y2] = 1;
        if (i2 % 2)
          w2.push([i2, y2]);
      }
      w2 = [];
      walls.push(w2);
      for (let i2 = x2 + 1; i2 <= room[2]; i2++) {
        this._map[i2][y2] = 1;
        if (i2 % 2)
          w2.push([i2, y2]);
      }
      w2 = [];
      walls.push(w2);
      for (let j2 = room[1]; j2 < y2; j2++) {
        this._map[x2][j2] = 1;
        if (j2 % 2)
          w2.push([x2, j2]);
      }
      w2 = [];
      walls.push(w2);
      for (let j2 = y2 + 1; j2 <= room[3]; j2++) {
        this._map[x2][j2] = 1;
        if (j2 % 2)
          w2.push([x2, j2]);
      }
      let solid = rng_default.getItem(walls);
      for (let i2 = 0; i2 < walls.length; i2++) {
        let w3 = walls[i2];
        if (w3 == solid) {
          continue;
        }
        let hole = rng_default.getItem(w3);
        this._map[hole[0]][hole[1]] = 0;
      }
      this._stack.push([room[0], room[1], x2 - 1, y2 - 1]);
      this._stack.push([x2 + 1, room[1], room[2], y2 - 1]);
      this._stack.push([room[0], y2 + 1, x2 - 1, room[3]]);
      this._stack.push([x2 + 1, y2 + 1, room[2], room[3]]);
    }
  };

  // node_modules/rot-js/lib/map/iceymaze.js
  var IceyMaze = class extends Map2 {
    constructor(width, height, regularity = 0) {
      super(width, height);
      this._regularity = regularity;
      this._map = [];
    }
    create(callback) {
      let width = this._width;
      let height = this._height;
      let map = this._fillMap(1);
      width -= width % 2 ? 1 : 2;
      height -= height % 2 ? 1 : 2;
      let cx = 0;
      let cy = 0;
      let nx = 0;
      let ny = 0;
      let done = 0;
      let blocked = false;
      let dirs = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
      ];
      do {
        cx = 1 + 2 * Math.floor(rng_default.getUniform() * (width - 1) / 2);
        cy = 1 + 2 * Math.floor(rng_default.getUniform() * (height - 1) / 2);
        if (!done) {
          map[cx][cy] = 0;
        }
        if (!map[cx][cy]) {
          this._randomize(dirs);
          do {
            if (Math.floor(rng_default.getUniform() * (this._regularity + 1)) == 0) {
              this._randomize(dirs);
            }
            blocked = true;
            for (let i2 = 0; i2 < 4; i2++) {
              nx = cx + dirs[i2][0] * 2;
              ny = cy + dirs[i2][1] * 2;
              if (this._isFree(map, nx, ny, width, height)) {
                map[nx][ny] = 0;
                map[cx + dirs[i2][0]][cy + dirs[i2][1]] = 0;
                cx = nx;
                cy = ny;
                blocked = false;
                done++;
                break;
              }
            }
          } while (!blocked);
        }
      } while (done + 1 < width * height / 4);
      for (let i2 = 0; i2 < this._width; i2++) {
        for (let j2 = 0; j2 < this._height; j2++) {
          callback(i2, j2, map[i2][j2]);
        }
      }
      this._map = [];
      return this;
    }
    _randomize(dirs) {
      for (let i2 = 0; i2 < 4; i2++) {
        dirs[i2][0] = 0;
        dirs[i2][1] = 0;
      }
      switch (Math.floor(rng_default.getUniform() * 4)) {
        case 0:
          dirs[0][0] = -1;
          dirs[1][0] = 1;
          dirs[2][1] = -1;
          dirs[3][1] = 1;
          break;
        case 1:
          dirs[3][0] = -1;
          dirs[2][0] = 1;
          dirs[1][1] = -1;
          dirs[0][1] = 1;
          break;
        case 2:
          dirs[2][0] = -1;
          dirs[3][0] = 1;
          dirs[0][1] = -1;
          dirs[1][1] = 1;
          break;
        case 3:
          dirs[1][0] = -1;
          dirs[0][0] = 1;
          dirs[3][1] = -1;
          dirs[2][1] = 1;
          break;
      }
    }
    _isFree(map, x2, y2, width, height) {
      if (x2 < 1 || y2 < 1 || x2 >= width || y2 >= height) {
        return false;
      }
      return map[x2][y2];
    }
  };

  // node_modules/rot-js/lib/map/rogue.js
  var Rogue = class extends Map2 {
    constructor(width, height, options) {
      super(width, height);
      this.map = [];
      this.rooms = [];
      this.connectedCells = [];
      options = Object.assign({
        cellWidth: 3,
        cellHeight: 3
      }, options);
      if (!options.hasOwnProperty("roomWidth")) {
        options["roomWidth"] = this._calculateRoomSize(this._width, options["cellWidth"]);
      }
      if (!options.hasOwnProperty("roomHeight")) {
        options["roomHeight"] = this._calculateRoomSize(this._height, options["cellHeight"]);
      }
      this._options = options;
    }
    create(callback) {
      this.map = this._fillMap(1);
      this.rooms = [];
      this.connectedCells = [];
      this._initRooms();
      this._connectRooms();
      this._connectUnconnectedRooms();
      this._createRandomRoomConnections();
      this._createRooms();
      this._createCorridors();
      if (callback) {
        for (let i2 = 0; i2 < this._width; i2++) {
          for (let j2 = 0; j2 < this._height; j2++) {
            callback(i2, j2, this.map[i2][j2]);
          }
        }
      }
      return this;
    }
    _calculateRoomSize(size, cell) {
      let max = Math.floor(size / cell * 0.8);
      let min = Math.floor(size / cell * 0.25);
      if (min < 2) {
        min = 2;
      }
      if (max < 2) {
        max = 2;
      }
      return [min, max];
    }
    _initRooms() {
      for (let i2 = 0; i2 < this._options.cellWidth; i2++) {
        this.rooms.push([]);
        for (let j2 = 0; j2 < this._options.cellHeight; j2++) {
          this.rooms[i2].push({ "x": 0, "y": 0, "width": 0, "height": 0, "connections": [], "cellx": i2, "celly": j2 });
        }
      }
    }
    _connectRooms() {
      let cgx = rng_default.getUniformInt(0, this._options.cellWidth - 1);
      let cgy = rng_default.getUniformInt(0, this._options.cellHeight - 1);
      let idx;
      let ncgx;
      let ncgy;
      let found = false;
      let room;
      let otherRoom;
      let dirToCheck;
      do {
        dirToCheck = [0, 2, 4, 6];
        dirToCheck = rng_default.shuffle(dirToCheck);
        do {
          found = false;
          idx = dirToCheck.pop();
          ncgx = cgx + DIRS[8][idx][0];
          ncgy = cgy + DIRS[8][idx][1];
          if (ncgx < 0 || ncgx >= this._options.cellWidth) {
            continue;
          }
          if (ncgy < 0 || ncgy >= this._options.cellHeight) {
            continue;
          }
          room = this.rooms[cgx][cgy];
          if (room["connections"].length > 0) {
            if (room["connections"][0][0] == ncgx && room["connections"][0][1] == ncgy) {
              break;
            }
          }
          otherRoom = this.rooms[ncgx][ncgy];
          if (otherRoom["connections"].length == 0) {
            otherRoom["connections"].push([cgx, cgy]);
            this.connectedCells.push([ncgx, ncgy]);
            cgx = ncgx;
            cgy = ncgy;
            found = true;
          }
        } while (dirToCheck.length > 0 && found == false);
      } while (dirToCheck.length > 0);
    }
    _connectUnconnectedRooms() {
      let cw = this._options.cellWidth;
      let ch = this._options.cellHeight;
      this.connectedCells = rng_default.shuffle(this.connectedCells);
      let room;
      let otherRoom;
      let validRoom;
      for (let i2 = 0; i2 < this._options.cellWidth; i2++) {
        for (let j2 = 0; j2 < this._options.cellHeight; j2++) {
          room = this.rooms[i2][j2];
          if (room["connections"].length == 0) {
            let directions = [0, 2, 4, 6];
            directions = rng_default.shuffle(directions);
            validRoom = false;
            do {
              let dirIdx = directions.pop();
              let newI = i2 + DIRS[8][dirIdx][0];
              let newJ = j2 + DIRS[8][dirIdx][1];
              if (newI < 0 || newI >= cw || newJ < 0 || newJ >= ch) {
                continue;
              }
              otherRoom = this.rooms[newI][newJ];
              validRoom = true;
              if (otherRoom["connections"].length == 0) {
                break;
              }
              for (let k2 = 0; k2 < otherRoom["connections"].length; k2++) {
                if (otherRoom["connections"][k2][0] == i2 && otherRoom["connections"][k2][1] == j2) {
                  validRoom = false;
                  break;
                }
              }
              if (validRoom) {
                break;
              }
            } while (directions.length);
            if (validRoom) {
              room["connections"].push([otherRoom["cellx"], otherRoom["celly"]]);
            } else {
              console.log("-- Unable to connect room.");
            }
          }
        }
      }
    }
    _createRandomRoomConnections() {
    }
    _createRooms() {
      let w2 = this._width;
      let h2 = this._height;
      let cw = this._options.cellWidth;
      let ch = this._options.cellHeight;
      let cwp = Math.floor(this._width / cw);
      let chp = Math.floor(this._height / ch);
      let roomw;
      let roomh;
      let roomWidth = this._options["roomWidth"];
      let roomHeight = this._options["roomHeight"];
      let sx;
      let sy;
      let otherRoom;
      for (let i2 = 0; i2 < cw; i2++) {
        for (let j2 = 0; j2 < ch; j2++) {
          sx = cwp * i2;
          sy = chp * j2;
          if (sx == 0) {
            sx = 1;
          }
          if (sy == 0) {
            sy = 1;
          }
          roomw = rng_default.getUniformInt(roomWidth[0], roomWidth[1]);
          roomh = rng_default.getUniformInt(roomHeight[0], roomHeight[1]);
          if (j2 > 0) {
            otherRoom = this.rooms[i2][j2 - 1];
            while (sy - (otherRoom["y"] + otherRoom["height"]) < 3) {
              sy++;
            }
          }
          if (i2 > 0) {
            otherRoom = this.rooms[i2 - 1][j2];
            while (sx - (otherRoom["x"] + otherRoom["width"]) < 3) {
              sx++;
            }
          }
          let sxOffset = Math.round(rng_default.getUniformInt(0, cwp - roomw) / 2);
          let syOffset = Math.round(rng_default.getUniformInt(0, chp - roomh) / 2);
          while (sx + sxOffset + roomw >= w2) {
            if (sxOffset) {
              sxOffset--;
            } else {
              roomw--;
            }
          }
          while (sy + syOffset + roomh >= h2) {
            if (syOffset) {
              syOffset--;
            } else {
              roomh--;
            }
          }
          sx = sx + sxOffset;
          sy = sy + syOffset;
          this.rooms[i2][j2]["x"] = sx;
          this.rooms[i2][j2]["y"] = sy;
          this.rooms[i2][j2]["width"] = roomw;
          this.rooms[i2][j2]["height"] = roomh;
          for (let ii = sx; ii < sx + roomw; ii++) {
            for (let jj = sy; jj < sy + roomh; jj++) {
              this.map[ii][jj] = 0;
            }
          }
        }
      }
    }
    _getWallPosition(aRoom, aDirection) {
      let rx;
      let ry;
      let door;
      if (aDirection == 1 || aDirection == 3) {
        rx = rng_default.getUniformInt(aRoom["x"] + 1, aRoom["x"] + aRoom["width"] - 2);
        if (aDirection == 1) {
          ry = aRoom["y"] - 2;
          door = ry + 1;
        } else {
          ry = aRoom["y"] + aRoom["height"] + 1;
          door = ry - 1;
        }
        this.map[rx][door] = 0;
      } else {
        ry = rng_default.getUniformInt(aRoom["y"] + 1, aRoom["y"] + aRoom["height"] - 2);
        if (aDirection == 2) {
          rx = aRoom["x"] + aRoom["width"] + 1;
          door = rx - 1;
        } else {
          rx = aRoom["x"] - 2;
          door = rx + 1;
        }
        this.map[door][ry] = 0;
      }
      return [rx, ry];
    }
    _drawCorridor(startPosition, endPosition) {
      let xOffset = endPosition[0] - startPosition[0];
      let yOffset = endPosition[1] - startPosition[1];
      let xpos = startPosition[0];
      let ypos = startPosition[1];
      let tempDist;
      let xDir;
      let yDir;
      let move;
      let moves = [];
      let xAbs = Math.abs(xOffset);
      let yAbs = Math.abs(yOffset);
      let percent = rng_default.getUniform();
      let firstHalf = percent;
      let secondHalf = 1 - percent;
      xDir = xOffset > 0 ? 2 : 6;
      yDir = yOffset > 0 ? 4 : 0;
      if (xAbs < yAbs) {
        tempDist = Math.ceil(yAbs * firstHalf);
        moves.push([yDir, tempDist]);
        moves.push([xDir, xAbs]);
        tempDist = Math.floor(yAbs * secondHalf);
        moves.push([yDir, tempDist]);
      } else {
        tempDist = Math.ceil(xAbs * firstHalf);
        moves.push([xDir, tempDist]);
        moves.push([yDir, yAbs]);
        tempDist = Math.floor(xAbs * secondHalf);
        moves.push([xDir, tempDist]);
      }
      this.map[xpos][ypos] = 0;
      while (moves.length > 0) {
        move = moves.pop();
        while (move[1] > 0) {
          xpos += DIRS[8][move[0]][0];
          ypos += DIRS[8][move[0]][1];
          this.map[xpos][ypos] = 0;
          move[1] = move[1] - 1;
        }
      }
    }
    _createCorridors() {
      let cw = this._options.cellWidth;
      let ch = this._options.cellHeight;
      let room;
      let connection;
      let otherRoom;
      let wall;
      let otherWall;
      for (let i2 = 0; i2 < cw; i2++) {
        for (let j2 = 0; j2 < ch; j2++) {
          room = this.rooms[i2][j2];
          for (let k2 = 0; k2 < room["connections"].length; k2++) {
            connection = room["connections"][k2];
            otherRoom = this.rooms[connection[0]][connection[1]];
            if (otherRoom["cellx"] > room["cellx"]) {
              wall = 2;
              otherWall = 4;
            } else if (otherRoom["cellx"] < room["cellx"]) {
              wall = 4;
              otherWall = 2;
            } else if (otherRoom["celly"] > room["celly"]) {
              wall = 3;
              otherWall = 1;
            } else {
              wall = 1;
              otherWall = 3;
            }
            this._drawCorridor(this._getWallPosition(room, wall), this._getWallPosition(otherRoom, otherWall));
          }
        }
      }
    }
  };

  // node_modules/rot-js/lib/map/index.js
  var map_default = { Arena, Uniform, Cellular, Digger, EllerMaze, DividedMaze, IceyMaze, Rogue };

  // node_modules/rot-js/lib/noise/simplex.js
  var F2 = 0.5 * (Math.sqrt(3) - 1);
  var G2 = (3 - Math.sqrt(3)) / 6;

  // node_modules/rot-js/lib/index.js
  var Util = util_exports;

  // src/utils.ts
  function keysOf(obj) {
    return Object.keys(obj);
  }
  function asRoll(n2, sides, mod2) {
    return { n: n2, sides, mod: mod2 ? mod2 : 0 };
  }
  var R = asRoll;
  function doRoll(roll) {
    let n2 = 0;
    for (let i2 = 0; i2 < roll.n; i2 += 1) {
      n2 += rng_default.getUniformInt(1, roll.sides);
    }
    let v2 = n2 + roll.mod;
    return v2;
  }
  function Rnd(n2, sides, mod2) {
    return doRoll(asRoll(n2, sides, mod2));
  }
  function describeRoll(roll) {
    return roll.n + "d" + roll.sides + (roll.mod > 0 ? "+" + roll.mod : "");
  }
  function roll100(under) {
    return rng_default.getUniformInt(1, 100) <= under;
  }
  function randInt(low, high) {
    return rng_default.getUniformInt(low, high);
  }

  // src/data/monsters.ts
  function expandProto(proto) {
    let archs = { [proto.base.name]: proto.base };
    for (let variant of proto.variants) {
      archs[variant.name] = __spreadValues(__spreadValues({}, proto.base), variant);
    }
    return archs;
  }
  var MonsterArchetypes = __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({}, expandProto({
    base: {
      name: "maggot heap",
      description: "A writhing mass of sickly pale grubs, clinging to a few scraps of moldering flesh for sustenance... and now they sustain me.",
      essence: 1,
      glyph: "worm",
      color: "vermin",
      hp: R(1, 1, 0),
      speed: 0.2,
      ai: "passive",
      attack: "none",
      soul: "vermin"
    },
    variants: [
      {
        name: "gnat swarm",
        description: "Harmless pests, birthed from some forgotten corpse. They would have irritated me in life. Now they are my bread.",
        glyph: "insect",
        ai: "wander"
      },
      {
        name: "luminous grub",
        description: "A fat worm with a glowing aura. It must have learned to feed on ambient essence, which is now mine for the taking.",
        essence: 3,
        glyph: "worm",
        color: "vermin"
      },
      {
        name: "soul butterfly",
        description: "This strange insect leaves trails of essence behind its wings. A beautiful aberration, but also delicious.",
        essence: 5,
        glyph: "insect",
        color: "vermin",
        speed: 0.4,
        ai: "wander"
      },
      {
        name: "torpid ghost",
        description: "A pathetic lost soul that has been ensnared here and reduced to a nearly sessile state.",
        essence: 10,
        glyph: "ghost",
        color: "vermin",
        speed: 0.1,
        ai: "wander"
      }
    ]
  })), expandProto({
    base: {
      name: "dusty rat",
      description: "A skinny, worn creature, barely alive, but with just enough of a soul remaining to remove intact.",
      essence: 2,
      glyph: "rodent",
      color: "danger0",
      hp: R(1, 4, 1),
      speed: 0.5,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence"
    },
    variants: [
      {
        name: "hungry rat",
        description: "A brown-hided rat that gnaws old bones for food. It seems to think my skull is its next meal.",
        essence: 6,
        color: "danger5",
        hp: R(2, 4, 1),
        ai: "charge"
      }
    ]
  })), expandProto({
    base: {
      name: "crypt spider",
      description: "A cobwebbed arachnid that feeds on gnats and maggots, and in turn is fed upon by me.",
      essence: 3,
      glyph: "spider",
      color: "danger0",
      hp: R(1, 2, 2),
      speed: 0.8,
      ai: "nipper",
      attack: "bite",
      soul: "extraDamage"
    },
    variants: [
      {
        name: "wolf spider",
        description: "This furry gray arachnid is the size of my skull and intent on defending its hunting grounds. But they are my hunting grounds, now.",
        essence: 7,
        color: "danger5",
        hp: R(1, 4, 2),
        ai: "charge"
      },
      {
        name: "ambush spider",
        description: "An obnoxious creature that springs out to attack!",
        essence: 15,
        color: "danger15",
        ai: "charge",
        speed: 0.9,
        soul: "speed"
      }
    ]
  })), expandProto({
    base: {
      name: "little ghost",
      description: "A weak spirit, barely clinging to the mortal world. I wandered for decades in a state like this.",
      essence: 4,
      glyph: "ghost",
      color: "danger0",
      hp: R(2, 4, 0),
      speed: 0.25,
      ai: "charge",
      attack: "touch",
      soul: "slow"
    },
    variants: [
      {
        name: "weeping ghost",
        description: "This decrepit spirit moans and mewls in a manner that would turn my stomach, if I still had one. Its suffering shall soon be over.",
        essence: 9,
        color: "danger5",
        hp: R(2, 8, 2),
        speed: 0.5
      },
      {
        name: "howling ghost",
        description: "A vigorous spirit, for once! Its yawping does grate, but I have a cure for that.",
        essence: 12,
        color: "danger10",
        hp: R(2, 5, 2),
        speed: 0.9,
        soul: "speed"
      }
    ]
  })), expandProto({
    base: {
      name: "bleary eye",
      description: "The gummy, sluglike body of this repulsive creature clings fast to surfaces and moves exceedingly slowly, but its gaze pierces the veil and disrupts my essence.",
      essence: 5,
      glyph: "eyeball",
      color: "danger5",
      hp: R(2, 4, 0),
      speed: 0.25,
      ai: "stationary",
      attack: "gaze",
      soul: "sight"
    },
    variants: [
      {
        name: "peering eye",
        description: "This disgusting creature will pay for its insolent gaze!",
        essence: 10,
        color: "danger10",
        hp: R(3, 4, 0),
        speed: 0.5
      },
      {
        name: "gimlet eye",
        description: "These remind me of the steely, courageous gaze of someone I once knew. Just like then, I'm going to tear its soul to shreds.",
        essence: 15,
        color: "danger15"
      }
    ]
  })), expandProto({
    base: {
      name: "soul sucker",
      description: "A giant, bloated mosquito, glowing with essence. Another result of the luminous grubs? When I am restored, I should build a laboratory to study this phenomenon.",
      essence: 15,
      glyph: "insect",
      color: "danger15",
      hp: R(2, 2, 2),
      speed: 1,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence"
    },
    variants: []
  })), expandProto({
    base: {
      name: "do-gooder",
      description: "Ha! If my captors are reduced to such a feeble state, armed with weapons little better than a child's toy, my restoration will be swift indeed.",
      essence: 7,
      glyph: "do-gooder",
      color: "danger5",
      hp: R(2, 6, 4),
      speed: 0.6,
      ai: "charge",
      attack: "slice",
      soul: "soak"
    },
    variants: [
      {
        name: "acolyte",
        description: "This child has read a book or two and learned enough to be dangerous, but I am a much harsher tutor than any they have ever known.",
        essence: 8,
        color: "danger5",
        hp: R(2, 4, 2),
        attack: "abjure",
        speed: 0.5,
        soul: "extraDamage"
      },
      {
        name: "warrior",
        description: "A muscular oaf, but able enough to swing a sword. This merits caution.",
        essence: 14,
        color: "danger10",
        hp: R(3, 6, 4),
        soul: "soak"
      },
      {
        name: "priest",
        description: "Ah, a god-speaker. No doubt sent here to soothe the restless dead. I have a better solution.",
        essence: 15,
        color: "danger20",
        hp: R(3, 6, 4),
        speed: 0.5,
        attack: "abjure"
      }
    ]
  })), expandProto({
    base: {
      name: "knocker",
      description: "A despicable little gremlin that prowls the underworld for its japes. Ripping its soul from its body would be a well-deserved punchline.",
      essence: 7,
      glyph: "fairy",
      color: "danger5",
      hp: R(2, 5, 1),
      speed: 1,
      ai: "prankster",
      attack: "rock",
      soul: "umbra"
    },
    variants: []
  })), expandProto({
    base: {
      name: "MegaLich 3000",
      description: "As I once was, and shall be again.",
      essence: 9999,
      glyph: "player",
      color: "danger20",
      hp: R(100, 10, 100),
      speed: 10,
      ai: "charge",
      attack: "slice",
      soul: "megalich"
    },
    variants: []
  }));

  // src/data/formations.ts
  function solo(arch, roll, danger) {
    return {
      appearing: [[arch, roll]],
      danger
    };
  }
  var MonsterFormations = [
    solo("maggot heap", R(1, 4, 3), 1),
    solo("gnat swarm", R(2, 4, 0), 1),
    solo("luminous grub", R(1, 3, 1), 5),
    solo("soul butterfly", R(1, 3, 1), 10),
    solo("torpid ghost", R(1, 1, 0), 10),
    solo("dusty rat", R(1, 3, 0), 1),
    solo("crypt spider", R(1, 2, 0), 3),
    solo("little ghost", R(1, 1, 0), 4),
    solo("bleary eye", R(1, 1, 0), 5),
    {
      appearing: [
        ["dusty rat", R(2, 2, 1)],
        ["hungry rat", R(1, 3, 0)]
      ],
      danger: 7
    },
    solo("knocker", R(1, 1, 0), 7),
    solo("wolf spider", R(1, 1, 0), 8),
    solo("weeping ghost", R(1, 1, 0), 10),
    solo("peering eye", R(1, 1, 0), 12),
    solo("howling ghost", R(1, 1, 0), 12),
    {
      appearing: [
        ["little ghost", R(2, 2, 1)],
        ["weeping ghost", R(1, 3, 0)],
        ["howling ghost", R(1, 1, 0)],
        ["torpid ghost", R(1, 4, 1)]
      ],
      danger: 12
    },
    solo("gimlet eye", R(1, 1, 0), 15),
    solo("ambush spider", R(1, 1, 0), 15),
    solo("howling ghost", R(1, 3, 1), 17),
    {
      appearing: [
        ["dusty rat", R(2, 2, 1)],
        ["hungry rat", R(1, 3, 0)]
      ],
      danger: 7
    },
    solo("wolf spider", R(1, 1, 0), 8),
    solo("weeping ghost", R(1, 1, 0), 10),
    solo("peering eye", R(1, 1, 0), 12),
    solo("howling ghost", R(1, 1, 0), 12),
    {
      appearing: [
        ["luminous grub", R(2, 2, 2)],
        ["soul butterfly", R(2, 3, 1)],
        ["soul sucker", R(1, 2, 0)]
      ],
      danger: 15
    },
    solo("soul sucker", R(2, 2, 2), 17),
    {
      appearing: [
        ["do-gooder", R(1, 2, 0)],
        ["acolyte", R(1, 2, -1)]
      ],
      danger: 9
    },
    {
      appearing: [
        ["warrior", R(1, 1, 0)],
        ["acolyte", R(1, 1, 0)]
      ],
      danger: 12
    },
    {
      appearing: [
        ["do-gooder", R(2, 2, 0)],
        ["warrior", R(1, 2, 0)]
      ],
      danger: 15
    },
    {
      appearing: [["warrior", R(2, 2, 1)]],
      danger: 20
    },
    {
      appearing: [
        ["warrior", R(1, 2, 0)],
        ["priest", R(1, 1, 0)]
      ],
      danger: 20
    },
    {
      appearing: [
        ["do-gooder", R(2, 2, 0)],
        ["warrior", R(1, 2, 0)],
        ["priest", R(1, 1, 0)]
      ],
      danger: 25
    }
  ];

  // src/data/souls.ts
  function mkSoulF(effects) {
    return (a2) => ({
      token: [a2.glyph, a2.color],
      essence: a2.essence,
      name: a2.name,
      effects: effects(a2).filter((f2) => f2)
    });
  }
  var SoulFactories = {
    vermin: mkSoulF((a2) => []),
    maxEssence: mkSoulF((a2) => [
      { type: "stat bonus", stat: "max essence", power: a2.essence }
    ]),
    extraDamage: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a2.essence / 2) + 1
      },
      { type: "damage", damage: R(Math.floor(a2.essence / 2), 4, Rnd(1, 4)) }
    ]),
    slow: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a2.essence / 2) + 1
      },
      {
        type: "status",
        status: "slow",
        power: Math.floor(a2.essence / 2) + Rnd(1, 3)
      }
    ]),
    sight: mkSoulF((a2) => [
      { type: "stat bonus", stat: "max essence", power: a2.essence },
      roll100(20 + a2.essence) ? {
        type: "danger sense",
        power: Math.floor(a2.essence / 8) + 2
      } : null,
      {
        type: "stat bonus",
        stat: "sight",
        power: Math.floor(a2.essence / 2) + 1
      }
    ]),
    speed: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a2.essence * 0.8)
      },
      {
        type: "stat bonus",
        stat: "speed",
        power: 0.05 * (Math.floor(a2.essence / 2) + Rnd(1, 3))
      }
    ]),
    soak: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a2.essence / 2) + 1
      },
      {
        type: "soak damage",
        power: Math.floor(a2.essence / Rnd(1, 2, 3))
      }
    ]),
    umbra: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a2.essence / 2) + 1
      },
      {
        type: "ability",
        ability: "shadow cloak",
        power: Math.floor(a2.essence / 5) + 2
      }
    ]),
    megalich: mkSoulF((a2) => [
      {
        type: "stat bonus",
        stat: "max essence",
        power: 200
      },
      {
        type: "soak damage",
        power: 500
      },
      {
        type: "stat bonus",
        stat: "speed",
        power: 10
      },
      { type: "damage", damage: R(10, 100, 50) },
      {
        type: "danger sense",
        power: 20
      }
    ])
  };

  // src/msg.ts
  function mkSay(type) {
    return (fmt, ...args) => {
      UI.logCallback(Util.format(fmt, ...args), type);
    };
  }
  var msg = {
    log: mkSay("normal"),
    think: mkSay("thought"),
    angry: mkSay("angry"),
    essence: mkSay("essence"),
    combat: mkSay("combat"),
    help: mkSay("help"),
    tutorial: (fmt, ...args) => {
      if (!Game.player.seenTutorials[fmt]) {
        msg.help(fmt, ...args);
        Game.player.seenTutorials[fmt] = true;
      }
    },
    break: () => {
      UI.logCallback("", "break");
    }
  };

  // src/monster.ts
  var DamageDescriptions = [
    [0, "You absorb the attack"],
    [1, "Your essence trembles"],
    [5, "Your essence wavers"],
    [10, "You stagger as your essence is drained"],
    [20, "Your connection to the mortal world frays"],
    [30, "Your being is stretched to the breaking point"],
    [50, "You briefly swim through endless aeons of hell"]
  ];
  function getDamageDescription(dmg) {
    for (let i2 = DamageDescriptions.length - 1; i2 >= 0; i2--) {
      if (DamageDescriptions[i2][0] <= dmg) {
        return DamageDescriptions[i2][1];
      }
    }
    return DamageDescriptions[0][1];
  }
  function meleeAttack(verb, damage) {
    return {
      canReachFrom: (c2) => (Game.player.x === c2.x || Game.player.x === c2.x - 1 || Game.player.x === c2.x + 1) && (Game.player.y === c2.y || Game.player.y === c2.y - 1 || Game.player.y === c2.y + 1),
      attackFrom: (c2) => {
        msg.combat("%The %s you!", D(c2), verb);
        let m2 = c2.monster;
        let danger = m2 ? MonsterArchetypes[m2.archetype].essence : 1;
        if (doRoll(R(1, 100, 0)) > 90 - danger * 2) {
          let dmgRoll = __spreadProps(__spreadValues({}, damage), { n: damage.n + Math.floor(danger / 5) });
          let dmg = doRoll(dmgRoll);
          doDamage(dmg);
        }
      }
    };
  }
  function rangedAttack(verb, damage) {
    return {
      canReachFrom: (c2) => playerCanSee(c2.x, c2.y),
      attackFrom: (c2) => {
        msg.combat("%The %s you!", D(c2), verb);
        let m2 = c2.monster;
        let danger = m2 ? MonsterArchetypes[m2.archetype].essence : 1;
        if (doRoll(R(1, 100, 0)) > 90 - danger * 2) {
          let dmgRoll = __spreadProps(__spreadValues({}, damage), { n: damage.n + Math.floor(danger / 5) });
          let dmg = doRoll(dmgRoll);
          doDamage(dmg);
        }
      }
    };
  }
  var Attacks = {
    none: {
      canReachFrom: (c2) => false,
      attackFrom: (c2) => {
      }
    },
    bite: meleeAttack("snaps at", R(1, 4, 0)),
    touch: meleeAttack("reaches into", R(1, 4, 2)),
    slice: meleeAttack("slices at", R(1, 8, 4)),
    gaze: rangedAttack("gazes at", R(1, 4, 0)),
    abjure: rangedAttack("abjures", R(1, 4, 2)),
    rock: rangedAttack("pitches a rock at", R(1, 2, 0))
  };
  var DeathMessages = {
    drain: "%The crumbles into dust.",
    force: "%The is blown to pieces.",
    bleedout: "The soul of %the departs."
  };
  function spawnMonster(archetype) {
    let hp = doRoll(MonsterArchetypes[archetype].hp);
    return {
      archetype,
      hp,
      maxHP: hp,
      energy: 1,
      statuses: []
    };
  }
  function killMonster(m2, cause) {
    if (!m2.deathCause) {
      m2.deathCause = cause;
    }
  }
  function monsterHasStatus(m2, status) {
    return !!m2.statuses.find((s2) => s2.type === status);
  }
  function inflictStatus(m2, s2) {
    m2.statuses = m2.statuses.filter((s3) => s3.type !== s3.type);
    m2.statuses.push(s2);
  }
  function cureStatus(m2, st) {
    m2.statuses = m2.statuses.filter((s2) => s2.type !== st);
  }
  function monsterStatusTick(m2) {
    for (let st of m2.statuses) {
      switch (st.type) {
        case "dying":
          st.timer--;
          if (st.timer <= 0) {
            killMonster(m2, "bleedout");
          }
          break;
        case "slow":
          st.timer--;
          if (st.timer <= 0) {
            cureStatus(m2, "slow");
          }
          break;
      }
    }
  }
  function monsterSpeed(m2) {
    let speed = MonsterArchetypes[m2.archetype].speed;
    if (monsterHasStatus(m2, "slow")) {
      speed /= 2;
    }
    return speed;
  }
  function weakMonster(m2) {
    return m2.hp <= 1 || monsterHasStatus(m2, "dying");
  }
  function makeSoul(arch) {
    let f2 = SoulFactories[arch.soul];
    return f2(arch);
  }
  function getSoul(m2) {
    let soul = Game.monsterSouls[m2.archetype];
    if (soul) {
      return soul;
    } else {
      let arch = MonsterArchetypes[m2.archetype];
      soul = makeSoul(arch);
      Game.monsterSouls[m2.archetype] = soul;
      return soul;
    }
  }

  // src/map.ts
  var Tiles = {
    rock: { glyph: "rock", blocks: true },
    wall: { glyph: "wall", blocks: true },
    floor: { glyph: "floor", blocks: false },
    exit: { glyph: "exit", blocks: false }
  };
  var DangerDescriptions = [
    [1, "cobwebbed catacomb"],
    [5, "ruined crypt"],
    [10, "murky tomb"],
    [15, "silent mausoleum"],
    [20, "tranquil sepulcher"],
    [25, "teeming necropolis"]
  ];
  function getMapDescription() {
    for (let i2 = DangerDescriptions.length - 1; i2 >= 0; i2--) {
      if (DangerDescriptions[i2][0] < Game.map.danger) {
        return DangerDescriptions[i2][1];
      }
    }
    return DangerDescriptions[0][1];
  }
  function moveMonster(from, to) {
    if (!to.blocked) {
      Game.map.monsters[from.x + from.y * Game.map.w] = null;
      Game.map.monsters[to.x + to.y * Game.map.w] = from.monster;
      return true;
    } else {
      return false;
    }
  }
  var seenXYs = [];
  var FOV2 = new fov_default.PreciseShadowcasting((x2, y2) => {
    let c2 = contentsAt(x2, y2);
    return !(!c2.tile || c2.tile.blocks);
  });
  function recomputeFOV() {
    seenXYs.length = 0;
    console.log("recomputing FOV! vision: ", getPlayerVision());
    FOV2.compute(Game.player.x, Game.player.y, getPlayerVision(), (fx, fy, r2, v2) => {
      seenXYs.push([fx, fy]);
    });
  }
  function playerCanSee(x2, y2) {
    return !!seenXYs.find(([sx, sy]) => x2 == sx && y2 == sy);
  }
  function canSeeThreat() {
    for (let [x2, y2] of seenXYs) {
      let c2 = contentsAt(x2, y2);
      if (c2.monster && !weakMonster(c2.monster)) {
        return true;
      }
    }
    return false;
  }
  function monstersByDistance() {
    let monstersByDistance2 = [];
    for (let [x2, y2] of seenXYs) {
      if (x2 == Game.player.x && y2 == Game.player.y) {
        continue;
      }
      let c2 = contentsAt(x2, y2);
      if (c2.monster) {
        let dist = Math.sqrt(Math.pow(Math.abs(Game.player.x - x2), 2) + Math.pow(Math.abs(Game.player.y - y2), 2));
        monstersByDistance2.push([dist, c2]);
      }
    }
    monstersByDistance2.sort(([a2, _v], [b2, _v2]) => a2 - b2);
    return monstersByDistance2;
  }
  function findTargets() {
    let targets = [];
    let targetEffect = getWand().targeting;
    switch (targetEffect.targeting) {
      case "seek closest":
        let monsters = monstersByDistance();
        for (let i2 = 0; i2 < targetEffect.count && i2 < monsters.length; i2++) {
          targets.push(monsters[i2][1]);
        }
    }
    return targets;
  }
  function newMap(opts) {
    Game.map.tiles = [];
    Game.map.monsters = [];
    Game.map.memory = [];
    Game.map.exits = [];
    if (opts) {
      Game.map = __spreadValues(__spreadValues({}, Game.map), opts);
    }
    if (Game.map.danger < 1) {
      Game.map.danger = 1;
    }
    Game.map.tiles.fill(Tiles.rock, 0, Game.map.h * Game.map.w);
    Game.map.monsters.fill(null, 0, Game.map.w * Game.map.h);
    Game.map.memory.fill([null, null], 0, Game.map.w * Game.map.h);
    let map = new map_default.Digger(Game.map.w, Game.map.h);
    map.create();
    let rooms = map.getRooms();
    for (let room of rooms) {
      room.create((x2, y2, v2) => {
        Game.map.tiles[x2 + y2 * Game.map.w] = v2 === 1 ? Tiles.wall : Tiles.floor;
      });
    }
    rooms = rng_default.shuffle(rooms);
    const startRoom = rooms.shift();
    const [px, py] = startRoom.getCenter();
    Game.player.x = px;
    Game.player.y = py;
    const formations = MonsterFormations.filter((f2) => f2.danger <= Game.map.danger + 2);
    const formDist = formations.reduce((d2, form, i2) => {
      d2[i2] = Game.map.danger - Math.abs(Game.map.danger - form.danger) / 2;
      return d2;
    }, {});
    let exits = rng_default.shuffle([
      Game.map.danger > 1 ? Math.floor(Game.map.danger / 2) : 1,
      Game.map.danger,
      Game.map.danger,
      Game.map.danger + 1,
      Game.map.danger + 1,
      Game.map.danger + 1,
      Game.map.danger + 2,
      Game.map.danger + 2,
      Game.map.danger + 2,
      Game.map.danger + 2,
      Game.map.danger + 2,
      Game.map.danger + 2,
      Game.map.danger + 3,
      Game.map.danger + 3,
      Game.map.danger + 3,
      rng_default.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1,
      rng_default.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1,
      rng_default.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1
    ]);
    for (let room of rooms) {
      if (exits.length > 0 && rng_default.getUniformInt(1, exits.length / 4) === 1) {
        let exit = exits.shift();
        let ex = rng_default.getUniformInt(room.getLeft(), room.getRight());
        let ey = rng_default.getUniformInt(room.getTop(), room.getBottom());
        Game.map.exits.push([ex, ey, exit]);
        Game.map.tiles[ex + ey * Game.map.w] = Tiles.exit;
      }
      let capacity = Math.floor(0.5 * (room.getRight() - room.getLeft()) * (room.getBottom() - room.getTop()));
      let groups = rng_default.getUniformInt(0, 3);
      while (capacity > 0 && groups > 0) {
        let form = formations[parseInt(rng_default.getWeightedValue(formDist))];
        for (let [arch, roll] of form.appearing) {
          let appearing = doRoll(roll);
          while (appearing > 0) {
            let mx = rng_default.getUniformInt(room.getLeft(), room.getRight());
            let my = rng_default.getUniformInt(room.getTop(), room.getBottom());
            let c2 = contentsAt(mx, my);
            if (!c2.blocked) {
              Game.map.monsters[mx + my * Game.map.w] = spawnMonster(arch);
            }
            capacity--;
            appearing--;
          }
        }
        groups--;
      }
    }
    for (let corridor of map.getCorridors()) {
      corridor.create((x2, y2, v2) => {
        Game.map.tiles[x2 + y2 * Game.map.w] = Tiles.floor;
      });
    }
    recomputeFOV();
    if (Game.map.danger >= Game.maxLevel) {
      msg.break();
      msg.tutorial("Congratulations! You have regained enough of your lost power to begin making longer-term plans for world domination.");
      msg.break();
      msg.tutorial("You reached danger level %s in %s turns.", Game.map.danger, Game.turns);
      msg.break();
      msg.tutorial("Thanks for playing!");
      offerChoice("Thanks for playing! You have reached the end of the currently implemented content.", /* @__PURE__ */ new Map([
        ["q", "Start a new run"],
        ["c", "Continue playing"]
      ]), {
        onChoose: (key) => {
          switch (key) {
            case "q":
              startNewGame();
              return true;
            case "c":
              msg.tutorial("Use Q (shift-q) to restart, or just reload the page.");
              return true;
          }
          return false;
        }
      });
    }
  }
  function tileAt(x2, y2) {
    return Game.map.tiles[x2 + y2 * Game.map.w];
  }
  function monsterAt(x2, y2) {
    return Game.map.monsters[x2 + y2 * Game.map.w];
  }
  function playerAt(x2, y2) {
    return Game.player.x === x2 && Game.player.y === y2;
  }
  function contentsAt(x2, y2) {
    let tile = tileAt(x2, y2);
    let monster = monsterAt(x2, y2);
    let player = playerAt(x2, y2);
    let archetype = (monster == null ? void 0 : monster.archetype) || null;
    let blocked = player;
    let sensedDanger = null;
    if (!tile || tile.blocks) {
      blocked = true;
    }
    if (monster) {
      blocked = true;
      let esp = getSoulEffect("danger sense");
      if (esp) {
        let dx = Math.abs(Game.player.x - x2);
        let dy = Math.abs(Game.player.y - y2);
        let dist = Math.floor(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
        if (dist <= esp.power) {
          sensedDanger = MonsterArchetypes[archetype].essence;
        }
      }
    }
    let exitDanger = null;
    if ((tile == null ? void 0 : tile.glyph) === "exit") {
      let exit = Game.map.exits.find(([ex, ey, _2]) => ex === x2 && ey === y2);
      exitDanger = (exit == null ? void 0 : exit[2]) || null;
    }
    return {
      x: x2,
      y: y2,
      tile,
      monster,
      player,
      blocked,
      memory: [tile, archetype],
      exitDanger,
      sensedDanger
    };
  }
  function getVictim() {
    return contentsAt(Game.player.x, Game.player.y);
  }

  // src/souls.ts
  var WandEffects = {
    seek_closest: { type: "targeting", targeting: "seek closest", count: 1 },
    bolt: { type: "projectile", projectile: "bolt" },
    weakMana: { type: "damage", damage: asRoll(1, 4, 0) }
  };
  var EmptySoul = {
    token: ["none", "void"],
    name: "-",
    essence: 0,
    effects: []
  };
  function isEmptySoul(soul) {
    return soul.essence === 0;
  }
  function describeSoulEffect(e2) {
    switch (e2.type) {
      case "soak damage":
        return "soak " + e2.power + " damage";
      case "stat bonus":
        if (e2.stat === "speed") {
          return "+" + Math.floor(e2.power * 100) + "% " + e2.stat;
        } else {
          return "+" + e2.power + " " + e2.stat;
        }
      case "damage":
        return "damage " + describeRoll(e2.damage);
      case "status":
        return e2.status + " " + e2.power;
      case "projectile":
        return e2.projectile;
      case "targeting":
        return e2.targeting;
      case "danger sense":
        return "danger sense " + e2.power;
      case "ability":
        return e2.ability + " " + e2.power;
    }
  }
  function describeSoulEffects(s2) {
    if (isEmptySoul(s2)) {
      return " ";
    } else if (s2.effects.length === 0) {
      return "+" + s2.essence + " essence";
    } else {
      let d2 = [];
      for (let effect of s2.effects) {
        d2.push(describeSoulEffect(effect));
      }
      return d2.join(", ");
    }
  }

  // src/player.ts
  var newPlayer = {
    x: 10,
    y: 10,
    essence: 0,
    maxEssence: 10,
    speed: 1,
    energy: 1,
    effects: [],
    cooldownAbilities: [],
    glyph: "player",
    knownMonsters: {},
    seenTutorials: {},
    soulSlots: {
      generic: [EmptySoul, EmptySoul, EmptySoul]
    }
  };
  function maxEssence() {
    return Game.player.maxEssence + getStatBonus("max essence");
  }
  function gainEssence(amt) {
    Game.player.essence += amt;
    if (Game.player.essence > maxEssence()) {
      Game.player.essence = maxEssence();
      msg.essence("Some essence escapes you and dissipates.");
    }
    if (Game.player.essence == maxEssence()) {
      endAbilityCooldowns();
    }
  }
  function loseEssence(amt) {
    Game.player.essence -= amt;
    if (Game.player.essence < 0) {
      Game.player.essence = 0;
    }
  }
  function getPlayerEffect(type) {
    return Game.player.effects.find((e2) => e2.type == type);
  }
  function addPlayerEffect(type, duration) {
    let s2 = getPlayerEffect(type);
    if (s2) {
      s2.timer = duration;
    } else {
      Game.player.effects.push({
        type,
        timer: duration
      });
    }
  }
  function tickPlayerStatus() {
    for (let effect of Game.player.effects) {
      effect.timer--;
      if (effect.timer == 0) {
      }
    }
    Game.player.effects = Game.player.effects.filter((e2) => e2.timer > 0);
  }
  function endAbilityCooldowns() {
    if (Game.player.cooldownAbilities.length > 0) {
      Game.player.cooldownAbilities = [];
      msg.essence("Your abilities have returned.");
    }
  }
  function invokeAbility(ability, power) {
    if (Game.player.cooldownAbilities.indexOf(ability) !== -1) {
      msg.angry("I must feed, first!");
      msg.tutorial("Restore your essence to max to regain invoked abilities.");
      return;
    }
    switch (ability) {
      case "shadow cloak":
        addPlayerEffect("umbra", power + randInt(1, 2));
        msg.essence("You slip into darkness!");
    }
    loseEssence(power);
    Game.player.cooldownAbilities.push(ability);
  }
  function getSoulEffect(type) {
    for (let soul of Game.player.soulSlots.generic) {
      for (let effect of soul.effects) {
        if (effect.type === type) {
          return effect;
        }
      }
    }
    return null;
  }
  function getSoulEffects(type) {
    let effects = [];
    for (let soul of Game.player.soulSlots.generic) {
      for (let effect of soul.effects) {
        if (effect.type === type) {
          effects.push(effect);
        }
      }
    }
    return effects;
  }
  function getWand() {
    let targeting = WandEffects.seek_closest;
    let projectile = WandEffects.bolt;
    let damage = WandEffects.weakMana;
    let status = null;
    let cost = 1;
    for (let soul of Game.player.soulSlots.generic) {
      for (let effect of soul.effects) {
        switch (effect.type) {
          case "targeting":
            targeting = effect;
            break;
          case "projectile":
            projectile = effect;
            break;
          case "damage":
            damage = effect;
            break;
          case "status":
            status = effect;
            break;
        }
      }
    }
    return {
      targeting,
      projectile,
      damage,
      status,
      cost
    };
  }
  function getStatBonus(stat) {
    let base = 0;
    for (let soul of Game.player.soulSlots.generic) {
      for (let effect of soul.effects) {
        if (effect.type == "stat bonus" && effect.stat == stat) {
          base += effect.power;
        }
      }
    }
    return base;
  }
  function getPlayerVision() {
    if (getPlayerEffect("umbra")) {
      return 1;
    } else {
      return 5 + getStatBonus("sight");
    }
  }
  function getPlayerSpeed() {
    return 1 + getStatBonus("speed");
  }
  function applySoak(dmg) {
    let soak = 0;
    for (let soul of Game.player.soulSlots.generic) {
      for (let effect of soul.effects) {
        if (effect.type == "soak damage") {
          soak += effect.power;
        }
      }
    }
    return dmg - soak;
  }
  function doDamage(dmg) {
    dmg = applySoak(dmg);
    if (dmg <= 0) {
      msg.combat("You absorb the attack!");
      return;
    }
    msg.combat("%s (%s)%s", getDamageDescription(dmg), dmg, dmg > 8 ? "!" : ".");
    let wasZero = Game.player.essence === 0;
    Game.player.essence -= dmg;
    if (Game.player.essence < 0) {
      let extra = Math.abs(Game.player.essence);
      Game.player.essence = 0;
      let soulChecked = false;
      if (wasZero) {
        for (let slotGroup of keysOf(Game.player.soulSlots)) {
          let slots = Game.player.soulSlots[slotGroup];
          for (let i2 = 0; i2 < slots.length; i2++) {
            if (!isEmptySoul(slots[i2])) {
              soulChecked = true;
              let roll = R(1, slots[i2].essence, 1);
              if (doRoll(roll) < extra) {
                msg.angry("No!");
                msg.essence("The %s soul breaks free!", slots[i2].name);
                slots[i2] = EmptySoul;
                break;
              }
            }
          }
        }
        if (!soulChecked) {
          let blowback = doRoll(R(1, extra, -3));
          if (blowback > 0) {
            msg.angry("I cannot hold together! I must flee!");
            let newDanger = Game.map.danger - randInt(1, blowback);
            if (newDanger < 1) {
              newDanger = 1;
            }
            newMap({
              danger: newDanger
            });
          }
        }
      } else {
        msg.tutorial("Watch out! Taking damage at zero essence can free souls you have claimed or blow you out of the level.");
      }
    }
  }

  // src/game.ts
  var Game = {
    turns: 0,
    player: newPlayer,
    maxLevel: 30,
    map: {
      danger: 1,
      w: 80,
      h: 80,
      tiles: [],
      monsters: [],
      memory: [],
      exits: []
    },
    monsterSouls: {}
  };
  var freshGame = JSON.stringify(Game);
  function resetGame() {
    Game = JSON.parse(freshGame);
  }

  // src/token.ts
  var Colors = {
    void: [0, 0, 0],
    target: [17, 51, 153],
    dying: [68, 17, 17],
    weak: [34, 17, 17],
    critterBG: [17, 17, 17],
    vermin: [170, 170, 170],
    danger0: [124, 83, 53],
    danger5: [157, 137, 59],
    danger10: [67, 157, 59],
    danger15: [59, 157, 142],
    danger20: [157, 59, 67],
    danger25: [146, 59, 157],
    terrain: [190, 190, 190],
    floor: [127, 127, 127],
    player: [255, 255, 255]
  };
  function rgb(color) {
    let c2 = Colors[color];
    return `rgb(${c2[0]},${c2[1]},${c2[2]})`;
  }
  function rgba(color, alpha) {
    let c2 = Colors[color];
    return `rgba(${c2[0]},${c2[1]},${c2[2]},${alpha})`;
  }
  var Glyphs = {
    none: " ",
    player: "@",
    exit: ">",
    wall: "#",
    floor: ".",
    rock: ".",
    insect: "i",
    worm: "w",
    rodent: "r",
    spider: "s",
    ghost: "g",
    eyeball: "e",
    "do-gooder": "h",
    fairy: "f"
  };
  function glyphChar(glyph) {
    return Glyphs[glyph];
  }
  function tokenChar(token) {
    return glyphChar(token[0]);
  }
  function tokenRGB(token) {
    return rgb(token[1]);
  }

  // src/wizard.ts
  function wizard() {
    offerChoice("WIZARD MODE", /* @__PURE__ */ new Map([
      ["d", "Dump game state to console"],
      ["e", "Fill essence"],
      ["s", "Get soul"],
      ["w", "Teleport to danger level 50"],
      [">", "Descend 5 levels"]
    ]), {
      onChoose: (key) => {
        switch (key) {
          case "w":
            newMap({ danger: 50 });
            return true;
          case "d":
            console.log(Game);
            return true;
          case "e":
            gainEssence(maxEssence());
            return true;
          case "s":
            wizardSoul();
            return true;
          case ">":
            newMap({ danger: Game.map.danger + 5 });
            return true;
        }
        return true;
      }
    });
  }
  function wizardSoul() {
    let byLetter = Object.keys(MonsterArchetypes).reduce((m2, name) => {
      let k2 = glyphChar(MonsterArchetypes[name].glyph);
      let l2 = m2.get(k2);
      if (l2) {
        l2.push(name);
      } else {
        m2.set(k2, [name]);
      }
      return m2;
    }, /* @__PURE__ */ new Map());
    let opts = new Map(Array.from(byLetter).map(([l2, names]) => [
      l2,
      names[0] + "... (" + names.length + ")"
    ]));
    offerChoice("Claim what soul?", opts, {
      onChoose: (k2) => {
        let archs = byLetter.get(k2);
        if (archs !== void 0) {
          let opts2 = new Map(archs.map((v2, i2) => [(i2 + 1).toString(), v2]));
          offerChoice("Claim what soul?", opts2, {
            onChoose: (k3) => {
              let i2 = parseInt(k3);
              if (i2 > 0) {
                let arch = archs[i2 - 1];
                if (arch) {
                  doClaimSoul(makeSoul(MonsterArchetypes[arch]));
                }
              }
              return true;
            }
          });
        }
        return true;
      }
    });
  }

  // src/commands.ts
  function tryReleaseSoul(prompt, onRelease) {
    prompt = prompt ? prompt : "Release which soul?";
    let slots = Game.player.soulSlots.generic;
    let opts = /* @__PURE__ */ new Map();
    for (let i2 in slots) {
      if (!isEmptySoul(slots[i2])) {
        opts.set((parseInt(i2) + 1).toString(), slots[i2].name);
      }
    }
    if (opts.size === 0) {
      msg.think("I have no souls to release.");
    } else {
      offerChoice(prompt, opts, {
        onChoose: (key) => {
          if (opts.has(key)) {
            let slot = parseInt(key) - 1;
            msg.essence("The %s soul dissipates into aether.", slots[slot].name);
            let gain = slots[slot].essence;
            slots[slot] = EmptySoul;
            gainEssence(gain);
            if (onRelease) {
              onRelease();
            }
          } else {
            msg.log("Release cancelled.");
          }
          return true;
        }
      });
    }
    return false;
  }
  function doClaimSoul(soul) {
    let slots = Game.player.soulSlots.generic;
    for (let i2 = 0; i2 < slots.length; i2++) {
      if (isEmptySoul(slots[i2])) {
        slots[i2] = soul;
        if (soul.effects.find((e2) => e2.type === "ability")) {
          msg.tutorial("You can activate abilities with (a).");
        }
        return "claimed";
      } else if (slots[i2].name === soul.name) {
        return "dupe";
      }
    }
    return "full";
  }
  function tryClaimSoul(c2) {
    if (c2.monster) {
      let soul = getSoul(c2.monster);
      if (soul.effects.length === 0) {
        msg.angry("This vermin has no soul worthy of claiming.");
        msg.tutorial("Vermin can be (d)evoured for essence.");
      } else {
        Game.player.energy -= 1;
        if (weakMonster(c2.monster)) {
          let claimed = doClaimSoul(soul);
          if (claimed === "full") {
            tryReleaseSoul("You must release a soul to claim another.", () => {
              tryClaimSoul(c2);
            });
          } else if (claimed === "dupe") {
            msg.essence("You already have claimed this soul.");
          } else if (claimed === "claimed") {
            msg.essence("You claim the soul of %the.", D(c2));
            msg.tutorial("Claiming souls increases your maximum essence and may grant new powers.");
            killMonsterAt(c2, "drain");
            return true;
          }
        } else {
          msg.angry("The wretched creature resists!");
        }
      }
    } else {
      msg.think("No soul is here to claim.");
    }
    return false;
  }
  function doMovePlayer(dx, dy) {
    const p = Game.player;
    const nx = p.x + dx;
    const ny = p.y + dy;
    const c2 = contentsAt(nx, ny);
    let blocked = c2.blocked;
    if (blocked && c2.monster) {
      blocked = false;
    }
    if (!blocked) {
      p.x = nx;
      p.y = ny;
      p.energy -= 1;
      if (c2.monster) {
        if (weakMonster(c2.monster)) {
          if (!Game.player.knownMonsters[c2.monster.archetype]) {
            msg.essence("You feel the essence of %the awaiting your grasp.", D(c2));
            Game.player.knownMonsters[c2.monster.archetype] = true;
            let archetype = MonsterArchetypes[c2.monster.archetype];
            if (archetype.soul === "vermin") {
              msg.angry("Petty vermin!");
              msg.tutorial("Use 'd' to devour essence from weak creatures.");
            } else {
              msg.tutorial("Use 'c' to claim a weakened creature's soul.");
            }
          }
        } else {
          msg.think("The essence of %the resists my grasp.", D(c2));
          msg.tutorial("Fire spells using SPACE to weaken creatures.");
        }
      }
      if (c2.exitDanger) {
        msg.log("There is a passage to another area here. [Danger: %s]", c2.exitDanger);
        msg.tutorial("Spend essence to pass into newer, more difficult areas.");
      }
      return true;
    } else {
      return false;
    }
  }
  function movePlayer(dx, dy) {
    return () => {
      if (!doMovePlayer(dx, dy)) {
        const p = Game.player;
        const nx = p.x + dx;
        const ny = p.y + dy;
        const c2 = contentsAt(nx, ny);
        msg.think("There is no passing this way.");
        return false;
      }
      return true;
    };
  }
  function movePlayerUntil(key, dx, dy) {
    return () => {
      if (canSeeThreat()) {
        msg.think("Danger threatens!");
        return false;
      }
      if (doMovePlayer(dx, dy)) {
        UI.commandQueue.push(key);
        return true;
      } else {
        return false;
      }
    };
  }
  var Commands = {
    ".": () => {
      Game.player.energy -= 1;
      return true;
    },
    h: movePlayer(-1, 0),
    H: movePlayerUntil("H", -1, 0),
    l: movePlayer(1, 0),
    L: movePlayerUntil("L", 1, 0),
    j: movePlayer(0, 1),
    J: movePlayerUntil("J", 0, 1),
    k: movePlayer(0, -1),
    K: movePlayerUntil("K", 0, -1),
    d: () => {
      let c2 = contentsAt(Game.player.x, Game.player.y);
      if (c2.monster) {
        Game.player.energy -= 0.5;
        if (weakMonster(c2.monster)) {
          let soul = getSoul(c2.monster);
          msg.essence("You devour the essence of %the.", D(c2));
          gainEssence(soul.essence);
          killMonsterAt(c2, "drain");
        } else {
          msg.angry("The wretched creature resists!");
        }
        return true;
      } else {
        msg.think("Nothing is here to drain of essence.");
        return false;
      }
    },
    c: () => {
      let c2 = contentsAt(Game.player.x, Game.player.y);
      return tryClaimSoul(c2);
    },
    ">": () => {
      let c2 = contentsAt(Game.player.x, Game.player.y);
      if (c2.exitDanger) {
        let exitCost = c2.exitDanger;
        if (Game.player.essence >= exitCost) {
          Game.player.energy -= 1;
          msg.essence("You pour essence into the passage and force it open.");
          loseEssence(exitCost);
          newMap({ danger: c2.exitDanger });
        } else {
          msg.angry("I need more essence to pass!");
          msg.tutorial("Passages to more dangerous areas require spending more essence to enter.");
        }
      } else {
        msg.think("There is no passage here.");
      }
      return false;
    },
    r: () => {
      return tryReleaseSoul();
    },
    " ": () => {
      let wand = getWand();
      if (wand.cost > Game.player.essence) {
        msg.angry("I must have more essence!");
        return false;
      }
      let targets = findTargets();
      if (targets.length) {
        for (let target of targets) {
          msg.combat("The %s hits %the!", wand.projectile.projectile, D(target));
          damageMonsterAt(target, wand.damage, wand.status);
        }
      } else {
        msg.think("I see none here to destroy.");
        return false;
      }
      Game.player.essence -= wand.cost;
      Game.player.energy -= 1;
      return true;
    },
    a: () => {
      let abilities = getSoulEffects("ability");
      if (abilities.length > 0) {
        let opts = new Map(abilities.map((a2, i2) => [(i2 + 1).toString(), describeSoulEffect(a2)]));
        offerChoice("Use which ability?", opts, {
          onChoose: (key) => {
            let i2 = parseInt(key);
            if (i2 > 0) {
              let ability = abilities[i2 - 1];
              if (ability) {
                invokeAbility(ability.ability, ability.power);
                Game.player.energy -= 1;
                return true;
              }
            }
            return true;
          }
        });
        return true;
      } else {
        msg.think("I have regained none of these powers.");
        return false;
      }
    },
    Q: () => {
      offerChoice("Die and restart game?", /* @__PURE__ */ new Map([
        ["y", "Yes"],
        ["n", "No"]
      ]), {
        onChoose: (key) => {
          if (key == "y") {
            startNewGame();
          }
          return true;
        }
      });
      return false;
    },
    W: () => {
      if (document.location.hash.includes("wizard")) {
        wizard();
      }
      return false;
    }
  };
  function D(c2) {
    if (c2.monster && playerCanSee(c2.x, c2.y)) {
      let monster = c2.monster;
      return {
        toString: () => MonsterArchetypes[monster.archetype].name,
        the: () => "the " + MonsterArchetypes[monster.archetype].name
      };
    } else {
      return {
        toString: () => "something",
        the: () => "something"
      };
    }
  }
  function killMonsterAt(c2, death) {
    if (c2.monster) {
      killMonster(c2.monster, death);
    }
  }
  function damageMonsterAt(c2, damage, status) {
    let m2 = c2.monster;
    if (m2) {
      let wasDying = weakMonster(m2);
      m2.hp -= doRoll(damage.damage);
      if (m2.hp > 1) {
        msg.combat("%The %s!", D(c2), m2.hp == 1 ? "staggers" : "shudders");
        if (status) {
          switch (status.status) {
            case "slow":
              inflictStatus(m2, { type: "slow", timer: status.power });
              msg.combat("%The slows down!", D(c2));
          }
        }
      } else {
        if (wasDying) {
          killMonsterAt(c2, "force");
        } else {
          msg.combat("%The collapses!", D(c2));
          msg.tutorial("Enter a dying creature's tile to (d)evour or (c)laim their soul. Be quick, though!");
          m2.statuses.push({ type: "dying", timer: 12 + Math.floor(m2.maxHP / 2) });
          m2.hp = 0;
        }
      }
    }
  }

  // src/ai.ts
  function tryAI(c2, ...ais) {
    for (let ai of ais) {
      let spent = ai(c2);
      if (spent > 0) {
        return spent;
      }
    }
    return 0;
  }
  function canSeePlayer(c2) {
    return playerCanSee(c2.x, c2.y);
  }
  function doApproach(c2) {
    if (canSeePlayer(c2)) {
      let dx = Game.player.x - c2.x;
      dx = dx == 0 ? 0 : dx / Math.abs(dx);
      let dy = Game.player.y - c2.y;
      dy = dy == 0 ? 0 : dy / Math.abs(dy);
      moveMonster(c2, contentsAt(c2.x + dx, c2.y + dy));
      return 1;
    } else {
      return 0;
    }
  }
  function doAttack(c2) {
    let m2 = c2.monster;
    let arch = MonsterArchetypes[m2.archetype];
    let attack = Attacks[arch.attack];
    if (attack.canReachFrom(c2)) {
      attack.attackFrom(c2);
      return 1;
    } else {
      return 0;
    }
  }
  function maybeDawdle(pct, message) {
    return (c2) => {
      if (roll100(pct)) {
        if (message && canSeePlayer(c2)) {
          msg.combat(message, D(c2));
        }
        return 1;
      } else {
        return 0;
      }
    };
  }
  function maybeBlink(pct) {
    return (c2) => {
      let nx = c2.x + rng_default.getUniformInt(-4, 4);
      let ny = c2.y + rng_default.getUniformInt(-4, 4);
      let spot = contentsAt(nx, ny);
      if (!spot.blocked) {
        if (canSeePlayer(c2)) {
          msg.combat("%The disappears " + (canSeePlayer(spot) ? "from sight!" : "and reappears!"), D(c2));
        }
        moveMonster(c2, spot);
        return 1;
      } else {
        return 0;
      }
    };
  }
  var AI = {
    passive: (c2) => {
      return 1;
    },
    wander: (c2) => {
      let nx = c2.x + rng_default.getUniformInt(-1, 1);
      let ny = c2.y + rng_default.getUniformInt(-1, 1);
      let spot = contentsAt(nx, ny);
      moveMonster(c2, spot);
      return 1;
    },
    nipper: (c2) => tryAI(c2, doAttack, AI.wander),
    stationary: (c2) => tryAI(c2, maybeDawdle(25), doAttack, AI.passive),
    charge: (c2) => tryAI(c2, doAttack, maybeDawdle(25), doApproach, AI.wander, AI.passive),
    prankster: (c2) => tryAI(c2, maybeDawdle(20, "%The giggles!"), maybeDawdle(20, "%The chortles!"), maybeBlink(20), maybeDawdle(20, "%The makes a rude gesture!"), doAttack, AI.wander, AI.passive)
  };

  // src/tick.ts
  function tick(game, ui) {
    if (ui.commandQueue.length == 0) {
      return;
    }
    let noop = false;
    while (game.player.energy >= 1) {
      let nextCommand = ui.commandQueue.shift();
      if (nextCommand) {
        noop = !Commands[nextCommand]();
        ui.uiCallback();
      } else {
        break;
      }
    }
    game.map.monsters.forEach((m2, i2) => {
      if (m2 && m2.deathCause) {
        const c2 = contentsAt(i2 % game.map.w, Math.floor(i2 / game.map.w));
        msg.combat(DeathMessages[m2.deathCause], D(c2));
        game.map.monsters[i2] = null;
      }
    });
    if (game.player.energy < 1) {
      if (!(noop || ui.activeChoice)) {
        game.map.monsters.forEach((m2, i2) => {
          if (m2) {
            const c2 = contentsAt(i2 % game.map.w, Math.floor(i2 / game.map.w));
            monsterStatusTick(m2);
            if (m2.deathCause) {
              msg.combat(DeathMessages[m2.deathCause], D(c2));
              game.map.monsters[i2] = null;
            } else {
              if (!monsterHasStatus(m2, "dying")) {
                const arch = MonsterArchetypes[m2.archetype];
                const ai = AI[arch.ai];
                m2.energy += monsterSpeed(m2);
                while (m2.energy >= 1) {
                  m2.energy -= ai(c2);
                }
              }
            }
          }
        });
        game.turns += 1;
        game.player.energy += getPlayerSpeed();
        tickPlayerStatus();
      }
    }
    recomputeFOV();
    ui.uiCallback();
    if (ui.commandQueue.length > 0) {
      tick(game, ui);
    }
  }

  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var i;
  var t;
  var o;
  var r;
  var f;
  var e = {};
  var c = [];
  var s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  function a(n2, l2) {
    for (var u2 in l2)
      n2[u2] = l2[u2];
    return n2;
  }
  function h(n2) {
    var l2 = n2.parentNode;
    l2 && l2.removeChild(n2);
  }
  function v(l2, u2, i2) {
    var t2, o2, r2, f2 = {};
    for (r2 in u2)
      r2 == "key" ? t2 = u2[r2] : r2 == "ref" ? o2 = u2[r2] : f2[r2] = u2[r2];
    if (arguments.length > 2 && (f2.children = arguments.length > 3 ? n.call(arguments, 2) : i2), typeof l2 == "function" && l2.defaultProps != null)
      for (r2 in l2.defaultProps)
        f2[r2] === void 0 && (f2[r2] = l2.defaultProps[r2]);
    return y(l2, f2, t2, o2, null);
  }
  function y(n2, i2, t2, o2, r2) {
    var f2 = { type: n2, props: i2, key: t2, ref: o2, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: r2 == null ? ++u : r2 };
    return r2 == null && l.vnode != null && l.vnode(f2), f2;
  }
  function d(n2) {
    return n2.children;
  }
  function _(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function k(n2, l2) {
    if (l2 == null)
      return n2.__ ? k(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
    for (var u2; l2 < n2.__k.length; l2++)
      if ((u2 = n2.__k[l2]) != null && u2.__e != null)
        return u2.__e;
    return typeof n2.type == "function" ? k(n2) : null;
  }
  function b(n2) {
    var l2, u2;
    if ((n2 = n2.__) != null && n2.__c != null) {
      for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++)
        if ((u2 = n2.__k[l2]) != null && u2.__e != null) {
          n2.__e = n2.__c.base = u2.__e;
          break;
        }
      return b(n2);
    }
  }
  function m(n2) {
    (!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++ || r !== l.debounceRendering) && ((r = l.debounceRendering) || o)(g);
  }
  function g() {
    for (var n2; g.__r = t.length; )
      n2 = t.sort(function(n3, l2) {
        return n3.__v.__b - l2.__v.__b;
      }), t = [], n2.some(function(n3) {
        var l2, u2, i2, t2, o2, r2;
        n3.__d && (o2 = (t2 = (l2 = n3).__v).__e, (r2 = l2.__P) && (u2 = [], (i2 = a({}, t2)).__v = t2.__v + 1, j(r2, t2, i2, l2.__n, r2.ownerSVGElement !== void 0, t2.__h != null ? [o2] : null, u2, o2 == null ? k(t2) : o2, t2.__h), z(u2, t2), t2.__e != o2 && b(t2)));
      });
  }
  function w(n2, l2, u2, i2, t2, o2, r2, f2, s2, a2) {
    var h2, v2, p, _2, b2, m2, g2, w2 = i2 && i2.__k || c, A = w2.length;
    for (u2.__k = [], h2 = 0; h2 < l2.length; h2++)
      if ((_2 = u2.__k[h2] = (_2 = l2[h2]) == null || typeof _2 == "boolean" ? null : typeof _2 == "string" || typeof _2 == "number" || typeof _2 == "bigint" ? y(null, _2, null, null, _2) : Array.isArray(_2) ? y(d, { children: _2 }, null, null, null) : _2.__b > 0 ? y(_2.type, _2.props, _2.key, null, _2.__v) : _2) != null) {
        if (_2.__ = u2, _2.__b = u2.__b + 1, (p = w2[h2]) === null || p && _2.key == p.key && _2.type === p.type)
          w2[h2] = void 0;
        else
          for (v2 = 0; v2 < A; v2++) {
            if ((p = w2[v2]) && _2.key == p.key && _2.type === p.type) {
              w2[v2] = void 0;
              break;
            }
            p = null;
          }
        j(n2, _2, p = p || e, t2, o2, r2, f2, s2, a2), b2 = _2.__e, (v2 = _2.ref) && p.ref != v2 && (g2 || (g2 = []), p.ref && g2.push(p.ref, null, _2), g2.push(v2, _2.__c || b2, _2)), b2 != null ? (m2 == null && (m2 = b2), typeof _2.type == "function" && _2.__k === p.__k ? _2.__d = s2 = x(_2, s2, n2) : s2 = P(n2, _2, p, w2, b2, s2), typeof u2.type == "function" && (u2.__d = s2)) : s2 && p.__e == s2 && s2.parentNode != n2 && (s2 = k(p));
      }
    for (u2.__e = m2, h2 = A; h2--; )
      w2[h2] != null && (typeof u2.type == "function" && w2[h2].__e != null && w2[h2].__e == u2.__d && (u2.__d = k(i2, h2 + 1)), N(w2[h2], w2[h2]));
    if (g2)
      for (h2 = 0; h2 < g2.length; h2++)
        M(g2[h2], g2[++h2], g2[++h2]);
  }
  function x(n2, l2, u2) {
    for (var i2, t2 = n2.__k, o2 = 0; t2 && o2 < t2.length; o2++)
      (i2 = t2[o2]) && (i2.__ = n2, l2 = typeof i2.type == "function" ? x(i2, l2, u2) : P(u2, i2, i2, t2, i2.__e, l2));
    return l2;
  }
  function P(n2, l2, u2, i2, t2, o2) {
    var r2, f2, e2;
    if (l2.__d !== void 0)
      r2 = l2.__d, l2.__d = void 0;
    else if (u2 == null || t2 != o2 || t2.parentNode == null)
      n:
        if (o2 == null || o2.parentNode !== n2)
          n2.appendChild(t2), r2 = null;
        else {
          for (f2 = o2, e2 = 0; (f2 = f2.nextSibling) && e2 < i2.length; e2 += 2)
            if (f2 == t2)
              break n;
          n2.insertBefore(t2, o2), r2 = o2;
        }
    return r2 !== void 0 ? r2 : t2.nextSibling;
  }
  function C(n2, l2, u2, i2, t2) {
    var o2;
    for (o2 in u2)
      o2 === "children" || o2 === "key" || o2 in l2 || H(n2, o2, null, u2[o2], i2);
    for (o2 in l2)
      t2 && typeof l2[o2] != "function" || o2 === "children" || o2 === "key" || o2 === "value" || o2 === "checked" || u2[o2] === l2[o2] || H(n2, o2, l2[o2], u2[o2], i2);
  }
  function $(n2, l2, u2) {
    l2[0] === "-" ? n2.setProperty(l2, u2) : n2[l2] = u2 == null ? "" : typeof u2 != "number" || s.test(l2) ? u2 : u2 + "px";
  }
  function H(n2, l2, u2, i2, t2) {
    var o2;
    n:
      if (l2 === "style")
        if (typeof u2 == "string")
          n2.style.cssText = u2;
        else {
          if (typeof i2 == "string" && (n2.style.cssText = i2 = ""), i2)
            for (l2 in i2)
              u2 && l2 in u2 || $(n2.style, l2, "");
          if (u2)
            for (l2 in u2)
              i2 && u2[l2] === i2[l2] || $(n2.style, l2, u2[l2]);
        }
      else if (l2[0] === "o" && l2[1] === "n")
        o2 = l2 !== (l2 = l2.replace(/Capture$/, "")), l2 = l2.toLowerCase() in n2 ? l2.toLowerCase().slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + o2] = u2, u2 ? i2 || n2.addEventListener(l2, o2 ? T : I, o2) : n2.removeEventListener(l2, o2 ? T : I, o2);
      else if (l2 !== "dangerouslySetInnerHTML") {
        if (t2)
          l2 = l2.replace(/xlink[H:h]/, "h").replace(/sName$/, "s");
        else if (l2 !== "href" && l2 !== "list" && l2 !== "form" && l2 !== "tabIndex" && l2 !== "download" && l2 in n2)
          try {
            n2[l2] = u2 == null ? "" : u2;
            break n;
          } catch (n3) {
          }
        typeof u2 == "function" || (u2 != null && (u2 !== false || l2[0] === "a" && l2[1] === "r") ? n2.setAttribute(l2, u2) : n2.removeAttribute(l2));
      }
  }
  function I(n2) {
    this.l[n2.type + false](l.event ? l.event(n2) : n2);
  }
  function T(n2) {
    this.l[n2.type + true](l.event ? l.event(n2) : n2);
  }
  function j(n2, u2, i2, t2, o2, r2, f2, e2, c2) {
    var s2, h2, v2, y2, p, k2, b2, m2, g2, x2, A, P2 = u2.type;
    if (u2.constructor !== void 0)
      return null;
    i2.__h != null && (c2 = i2.__h, e2 = u2.__e = i2.__e, u2.__h = null, r2 = [e2]), (s2 = l.__b) && s2(u2);
    try {
      n:
        if (typeof P2 == "function") {
          if (m2 = u2.props, g2 = (s2 = P2.contextType) && t2[s2.__c], x2 = s2 ? g2 ? g2.props.value : s2.__ : t2, i2.__c ? b2 = (h2 = u2.__c = i2.__c).__ = h2.__E : ("prototype" in P2 && P2.prototype.render ? u2.__c = h2 = new P2(m2, x2) : (u2.__c = h2 = new _(m2, x2), h2.constructor = P2, h2.render = O), g2 && g2.sub(h2), h2.props = m2, h2.state || (h2.state = {}), h2.context = x2, h2.__n = t2, v2 = h2.__d = true, h2.__h = []), h2.__s == null && (h2.__s = h2.state), P2.getDerivedStateFromProps != null && (h2.__s == h2.state && (h2.__s = a({}, h2.__s)), a(h2.__s, P2.getDerivedStateFromProps(m2, h2.__s))), y2 = h2.props, p = h2.state, v2)
            P2.getDerivedStateFromProps == null && h2.componentWillMount != null && h2.componentWillMount(), h2.componentDidMount != null && h2.__h.push(h2.componentDidMount);
          else {
            if (P2.getDerivedStateFromProps == null && m2 !== y2 && h2.componentWillReceiveProps != null && h2.componentWillReceiveProps(m2, x2), !h2.__e && h2.shouldComponentUpdate != null && h2.shouldComponentUpdate(m2, h2.__s, x2) === false || u2.__v === i2.__v) {
              h2.props = m2, h2.state = h2.__s, u2.__v !== i2.__v && (h2.__d = false), h2.__v = u2, u2.__e = i2.__e, u2.__k = i2.__k, u2.__k.forEach(function(n3) {
                n3 && (n3.__ = u2);
              }), h2.__h.length && f2.push(h2);
              break n;
            }
            h2.componentWillUpdate != null && h2.componentWillUpdate(m2, h2.__s, x2), h2.componentDidUpdate != null && h2.__h.push(function() {
              h2.componentDidUpdate(y2, p, k2);
            });
          }
          h2.context = x2, h2.props = m2, h2.state = h2.__s, (s2 = l.__r) && s2(u2), h2.__d = false, h2.__v = u2, h2.__P = n2, s2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s, h2.getChildContext != null && (t2 = a(a({}, t2), h2.getChildContext())), v2 || h2.getSnapshotBeforeUpdate == null || (k2 = h2.getSnapshotBeforeUpdate(y2, p)), A = s2 != null && s2.type === d && s2.key == null ? s2.props.children : s2, w(n2, Array.isArray(A) ? A : [A], u2, i2, t2, o2, r2, f2, e2, c2), h2.base = u2.__e, u2.__h = null, h2.__h.length && f2.push(h2), b2 && (h2.__E = h2.__ = null), h2.__e = false;
        } else
          r2 == null && u2.__v === i2.__v ? (u2.__k = i2.__k, u2.__e = i2.__e) : u2.__e = L(i2.__e, u2, i2, t2, o2, r2, f2, c2);
      (s2 = l.diffed) && s2(u2);
    } catch (n3) {
      u2.__v = null, (c2 || r2 != null) && (u2.__e = e2, u2.__h = !!c2, r2[r2.indexOf(e2)] = null), l.__e(n3, u2, i2);
    }
  }
  function z(n2, u2) {
    l.__c && l.__c(u2, n2), n2.some(function(u3) {
      try {
        n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
          n3.call(u3);
        });
      } catch (n3) {
        l.__e(n3, u3.__v);
      }
    });
  }
  function L(l2, u2, i2, t2, o2, r2, f2, c2) {
    var s2, a2, v2, y2 = i2.props, p = u2.props, d2 = u2.type, _2 = 0;
    if (d2 === "svg" && (o2 = true), r2 != null) {
      for (; _2 < r2.length; _2++)
        if ((s2 = r2[_2]) && "setAttribute" in s2 == !!d2 && (d2 ? s2.localName === d2 : s2.nodeType === 3)) {
          l2 = s2, r2[_2] = null;
          break;
        }
    }
    if (l2 == null) {
      if (d2 === null)
        return document.createTextNode(p);
      l2 = o2 ? document.createElementNS("http://www.w3.org/2000/svg", d2) : document.createElement(d2, p.is && p), r2 = null, c2 = false;
    }
    if (d2 === null)
      y2 === p || c2 && l2.data === p || (l2.data = p);
    else {
      if (r2 = r2 && n.call(l2.childNodes), a2 = (y2 = i2.props || e).dangerouslySetInnerHTML, v2 = p.dangerouslySetInnerHTML, !c2) {
        if (r2 != null)
          for (y2 = {}, _2 = 0; _2 < l2.attributes.length; _2++)
            y2[l2.attributes[_2].name] = l2.attributes[_2].value;
        (v2 || a2) && (v2 && (a2 && v2.__html == a2.__html || v2.__html === l2.innerHTML) || (l2.innerHTML = v2 && v2.__html || ""));
      }
      if (C(l2, p, y2, o2, c2), v2)
        u2.__k = [];
      else if (_2 = u2.props.children, w(l2, Array.isArray(_2) ? _2 : [_2], u2, i2, t2, o2 && d2 !== "foreignObject", r2, f2, r2 ? r2[0] : i2.__k && k(i2, 0), c2), r2 != null)
        for (_2 = r2.length; _2--; )
          r2[_2] != null && h(r2[_2]);
      c2 || ("value" in p && (_2 = p.value) !== void 0 && (_2 !== l2.value || d2 === "progress" && !_2 || d2 === "option" && _2 !== y2.value) && H(l2, "value", _2, y2.value, false), "checked" in p && (_2 = p.checked) !== void 0 && _2 !== l2.checked && H(l2, "checked", _2, y2.checked, false));
    }
    return l2;
  }
  function M(n2, u2, i2) {
    try {
      typeof n2 == "function" ? n2(u2) : n2.current = u2;
    } catch (n3) {
      l.__e(n3, i2);
    }
  }
  function N(n2, u2, i2) {
    var t2, o2;
    if (l.unmount && l.unmount(n2), (t2 = n2.ref) && (t2.current && t2.current !== n2.__e || M(t2, null, u2)), (t2 = n2.__c) != null) {
      if (t2.componentWillUnmount)
        try {
          t2.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u2);
        }
      t2.base = t2.__P = null;
    }
    if (t2 = n2.__k)
      for (o2 = 0; o2 < t2.length; o2++)
        t2[o2] && N(t2[o2], u2, typeof n2.type != "function");
    i2 || n2.__e == null || h(n2.__e), n2.__e = n2.__d = void 0;
  }
  function O(n2, l2, u2) {
    return this.constructor(n2, u2);
  }
  function S(u2, i2, t2) {
    var o2, r2, f2;
    l.__ && l.__(u2, i2), r2 = (o2 = typeof t2 == "function") ? null : t2 && t2.__k || i2.__k, f2 = [], j(i2, u2 = (!o2 && t2 || i2).__k = v(d, null, [u2]), r2 || e, e, i2.ownerSVGElement !== void 0, !o2 && t2 ? [t2] : r2 ? null : i2.firstChild ? n.call(i2.childNodes) : null, f2, !o2 && t2 ? t2 : r2 ? r2.__e : i2.firstChild, o2), z(f2, u2);
  }
  n = c.slice, l = { __e: function(n2, l2) {
    for (var u2, i2, t2; l2 = l2.__; )
      if ((u2 = l2.__c) && !u2.__)
        try {
          if ((i2 = u2.constructor) && i2.getDerivedStateFromError != null && (u2.setState(i2.getDerivedStateFromError(n2)), t2 = u2.__d), u2.componentDidCatch != null && (u2.componentDidCatch(n2), t2 = u2.__d), t2)
            return u2.__E = u2;
        } catch (l3) {
          n2 = l3;
        }
    throw n2;
  } }, u = 0, i = function(n2) {
    return n2 != null && n2.constructor === void 0;
  }, _.prototype.setState = function(n2, l2) {
    var u2;
    u2 = this.__s != null && this.__s !== this.state ? this.__s : this.__s = a({}, this.state), typeof n2 == "function" && (n2 = n2(a({}, u2), this.props)), n2 && a(u2, n2), n2 != null && this.__v && (l2 && this.__h.push(l2), m(this));
  }, _.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), m(this));
  }, _.prototype.render = d, t = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, g.__r = 0, f = 0;

  // src/ui/controls.tsx
  function renderControls(game, ui, messages) {
    S(/* @__PURE__ */ v(Interface, __spreadValues({}, { game, ui, messages })), document.body);
  }
  function Interface(props) {
    return /* @__PURE__ */ v("div", {
      class: "wrapper"
    }, /* @__PURE__ */ v(Playarea, null), /* @__PURE__ */ v(Sidebar, {
      ui: props.ui,
      game: props.game
    }), /* @__PURE__ */ v("div", {
      id: "mapDanger"
    }, props.ui.state.mapDescription + " [Danger: " + props.game.map.danger + "]"), /* @__PURE__ */ v(MessageLog, {
      messages: props.messages
    }));
  }
  var Playarea = class extends _ {
    constructor() {
      super(...arguments);
      this.shouldComponentUpdate = () => false;
      this.render = (props) => /* @__PURE__ */ v("div", {
        id: "playarea"
      });
    }
  };
  function ChoiceBox(props) {
    let choice = props.ui.activeChoice;
    if (!choice) {
      return null;
    }
    return /* @__PURE__ */ v("div", {
      id: "choiceBox"
    }, /* @__PURE__ */ v("div", {
      class: "prompt"
    }, choice.prompt), /* @__PURE__ */ v("div", {
      class: "opts"
    }, Array.from(choice.opts, ([key, item]) => /* @__PURE__ */ v(d, {
      key
    }, /* @__PURE__ */ v("div", {
      class: "choice-key"
    }, key), /* @__PURE__ */ v("div", {
      class: "choice-item"
    }, item))), /* @__PURE__ */ v("div", {
      class: "choice-key"
    }, "ESC"), /* @__PURE__ */ v("div", {
      class: "choice-item"
    }, "Cancel")));
  }
  function Sidebar(props) {
    const game = props.game;
    return /* @__PURE__ */ v("div", {
      id: "sidebar"
    }, /* @__PURE__ */ v("h1", null, "SOUL \u{1F47B} BREAK \u{1F480} FAST"), /* @__PURE__ */ v(StatusView, {
      game,
      ui: props.ui
    }), props.ui.state.onGround ? /* @__PURE__ */ v(SidebarSection, {
      label: "On Ground",
      element: WhatsHereView,
      here: props.ui.state.onGround
    }) : null, /* @__PURE__ */ v(SidebarSection, {
      label: "Souls",
      element: SoulListView,
      souls: game.player.soulSlots.generic
    }), props.ui.activeChoice ? /* @__PURE__ */ v(SidebarSection, {
      label: "Choose",
      element: ChoiceBox,
      ui: props.ui
    }) : /* @__PURE__ */ v(d, null, props.ui.state.targets.length > 0 ? /* @__PURE__ */ v(SidebarSection, {
      label: "Targets",
      element: TargetsView,
      targets: props.ui.state.targets,
      brief: false
    }) : null, props.ui.state.visible.length > 0 ? /* @__PURE__ */ v(SidebarSection, {
      label: "In View",
      element: TargetsView,
      targets: props.ui.state.visible,
      brief: true
    }) : null));
  }
  function SidebarSection(props) {
    return /* @__PURE__ */ v("div", {
      class: "sidebar-section"
    }, /* @__PURE__ */ v("h2", null, props.label), v(props.element, props));
  }
  function StatusView(props) {
    let full = "rgba(0, 108, 139, 1)";
    let empty = "rgba(94, 94, 94, 1)";
    let essencePct = Math.floor(props.ui.state.playerEssence / props.ui.state.playerMaxEssence * 100);
    let gradient = `background: linear-gradient(90deg, ${full} 0%, ${full} ${essencePct}%, ${empty} ${essencePct}%, ${empty} ${essencePct}%);`;
    return /* @__PURE__ */ v("div", {
      id: "status"
    }, /* @__PURE__ */ v("div", {
      class: "stat"
    }, /* @__PURE__ */ v("div", {
      class: "stat-label"
    }, "Essence"), /* @__PURE__ */ v("div", {
      class: "stat-value",
      id: "essence",
      style: gradient
    }, props.ui.state.playerEssence, " / ", props.ui.state.playerMaxEssence)), /* @__PURE__ */ v("div", {
      class: "stat"
    }, /* @__PURE__ */ v("div", {
      class: "stat-label"
    }, "Turns"), /* @__PURE__ */ v("div", {
      class: "stat-value",
      id: "turns"
    }, props.game.turns)));
  }
  function WhatsHereView(props) {
    const here = props.here;
    let glyph = "";
    let what = "";
    let desc = "";
    if (here.monster) {
      let soul = getSoul(here.monster);
      glyph = tokenChar(soul.token);
      what = soul.name;
      desc = describeSoulEffects(soul);
    } else if (here.tile) {
      glyph = glyphChar(here.tile.glyph);
      what = here.tile.glyph;
      if (here.exitDanger) {
        desc = "Danger: " + here.exitDanger;
      }
    }
    return /* @__PURE__ */ v("div", {
      id: "whatsHere"
    }, /* @__PURE__ */ v("div", {
      class: "soul-glyph",
      id: "hereGlyph"
    }, glyph), /* @__PURE__ */ v("div", {
      class: "soul-name",
      id: "hereWhat"
    }, what), /* @__PURE__ */ v("div", {
      class: "soul-effect",
      id: "hereDescription"
    }, desc));
  }
  function SoulListView(props) {
    return /* @__PURE__ */ v("div", {
      id: "souls"
    }, props.souls.map((soul) => /* @__PURE__ */ v(SoulView, {
      soul
    })));
  }
  function SoulView(props) {
    return /* @__PURE__ */ v(d, {
      key: props.soul.name
    }, /* @__PURE__ */ v("div", {
      class: "soul-glyph",
      style: "color: " + tokenRGB(props.soul.token)
    }, tokenChar(props.soul.token)), /* @__PURE__ */ v("div", {
      class: "soul-name"
    }, props.soul.name), /* @__PURE__ */ v("div", {
      class: "soul-effect"
    }, describeSoulEffects(props.soul)));
  }
  function TargetsView(props) {
    let items = props.targets.map(targetToItem);
    let groups = {};
    for (let i2 of items) {
      if (i2) {
        if (!groups[i2.name]) {
          groups[i2.name] = [i2];
        } else {
          groups[i2.name].push(i2);
        }
      }
    }
    let grouped = Object.values(groups).map((is) => __spreadProps(__spreadValues({}, is[0]), {
      name: is[0].name + (is.length > 1 ? " x" + is.length : "")
    }));
    return /* @__PURE__ */ v("div", {
      id: "targets"
    }, grouped.map((i2) => /* @__PURE__ */ v(TargetItem, {
      item: i2,
      brief: props.brief
    })));
  }
  function targetToItem(c2) {
    if (c2.monster) {
      let arch = MonsterArchetypes[c2.monster.archetype];
      let glyph = glyphChar(arch.glyph);
      let color = rgb(arch.color);
      let name = arch.name;
      let statuses = [];
      if (monsterHasStatus(c2.monster, "dying")) {
        statuses.push("dying");
      } else {
        if (arch.soul == "vermin") {
          statuses.push("vermin");
        } else if (c2.monster.hp === c2.monster.maxHP) {
          statuses.push("unharmed");
        } else if (c2.monster.hp < c2.monster.maxHP / 2) {
          statuses.push("heavily wounded");
        } else {
          statuses.push("slightly wounded");
        }
        c2.monster.statuses.forEach((s2) => {
          statuses.push(s2.type);
        });
      }
      name += " (" + statuses.join(", ") + ")";
      let thoughts = arch.description;
      return {
        name,
        glyph,
        color,
        thoughts
      };
    } else {
      return null;
    }
  }
  function TargetItem(props) {
    let t2 = props.item;
    return t2 ? /* @__PURE__ */ v("div", {
      class: "target-entry"
    }, /* @__PURE__ */ v("div", {
      class: "target-glyph soul-glyph",
      style: "color: " + t2.color
    }, t2.glyph), /* @__PURE__ */ v("div", {
      class: "target-name soul-name"
    }, t2.name), props.brief ? null : /* @__PURE__ */ v("div", {
      class: "target-thoughts"
    }, t2.thoughts)) : null;
  }
  function MessageLog(props) {
    let entries = props.messages.map((msgs, i2) => {
      let log = msgs.map(([msg2, msgType], i3) => /* @__PURE__ */ v("span", {
        class: "msg-" + msgType
      }, msg2 + " "));
      return /* @__PURE__ */ v("li", {
        key: "mgs-turn-" + i2
      }, log);
    }).reverse();
    return /* @__PURE__ */ v("div", {
      id: "messages"
    }, /* @__PURE__ */ v("ul", {
      class: "messageLog"
    }, entries));
  }

  // src/ui.ts
  var UI = {
    commandQueue: [],
    uiCallback: () => {
    },
    logCallback: (msg2, msgType) => {
    },
    activeChoice: null,
    nextChoice: null,
    state: {
      playerEssence: 0,
      playerMaxEssence: 0,
      targets: [],
      visible: [],
      mapDescription: "",
      onGround: null
    },
    doTiles: document.location.hash.includes("tiles"),
    viewport: {
      width: 30,
      height: 30
    }
  };
  function bgColor(color) {
    return rgb(color);
  }
  function fgColor(color, alpha) {
    if (alpha === void 0) {
      alpha = 1;
    }
    if (UI.doTiles) {
      return rgba(color, alpha);
    } else {
      return rgb(color);
    }
  }
  function drawMap(display) {
    display.clear();
    let sx = Game.player.x - UI.viewport.width / 2;
    let sy = Game.player.y - UI.viewport.height / 2;
    if (sx < 0) {
      sx = 0;
    }
    if (sy < 0) {
      sy = 0;
    }
    let targets = findTargets();
    for (let ix = 0; ix < UI.viewport.width; ix += 1) {
      for (let iy = 0; iy < UI.viewport.height; iy += 1) {
        let x2 = sx + ix;
        let y2 = sy + iy;
        let c2 = contentsAt(x2, y2);
        if (seenXYs.find(([ex, ey]) => x2 == ex && y2 == ey)) {
          let isTarget = !!targets.find((c3) => c3.x === x2 && c3.y === y2);
          let bg = isTarget ? bgColor("target") : bgColor("void");
          Game.map.memory[x2 + y2 * Game.map.w] = c2.memory;
          if (c2.player) {
            display.draw(x2 - sx, y2 - sy, glyphChar(Game.player.glyph), fgColor("player"), bg);
          } else if (c2.monster) {
            let arch = MonsterArchetypes[c2.monster.archetype];
            display.draw(x2 - sx, y2 - sy, glyphChar(arch.glyph), fgColor(arch.color, 0.75), bgColor(monsterHasStatus(c2.monster, "dying") ? "dying" : isTarget ? "target" : weakMonster(c2.monster) ? "weak" : "critterBG"));
          } else if (c2.tile) {
            display.draw(x2 - sx, y2 - sy, glyphChar(c2.tile.glyph), fgColor(c2.tile.blocks ? "terrain" : "floor", 0.75), bg);
          } else {
            display.draw(x2 - sx, y2 - sy, glyphChar("rock"), "#000", bg);
          }
        } else if (c2.sensedDanger && c2.monster) {
          let arch = MonsterArchetypes[c2.monster.archetype];
          display.draw(ix, iy, "?", "#000", fgColor(arch.color));
        } else {
          let mem = Game.map.memory[x2 + y2 * Game.map.w];
          if (mem) {
            let [mtile, mmons] = mem;
            if (mmons) {
              display.draw(ix, iy, glyphChar(MonsterArchetypes[mmons].glyph), "#666", "#000");
            } else if (mtile) {
              display.draw(ix, iy, glyphChar(mtile.glyph), "#666", "#000");
            }
          }
        }
      }
    }
  }
  function offerChoice(prompt, opts, callbacks) {
    if (UI.activeChoice) {
      UI.nextChoice = { prompt, opts, callbacks };
    } else {
      UI.activeChoice = { prompt, opts, callbacks };
    }
  }
  function runGame() {
    let logMessages = [];
    Util.format.map.the = "the";
    renderControls(Game, UI, logMessages);
    let playarea = document.getElementById("playarea");
    let options = __spreadValues({}, UI.viewport);
    if (UI.doTiles) {
      let tileSet = document.createElement("img");
      tileSet.src = "sprites.png";
      let T2 = (x2, y2) => [
        x2 * 32,
        y2 * 32
      ];
      UI.viewport.width /= 2;
      UI.viewport.height /= 2;
      options = __spreadProps(__spreadValues({}, UI.viewport), {
        tileWidth: 32,
        tileHeight: 32,
        tileSet,
        tileColorize: true,
        tileMap: {
          [glyphChar("player")]: T2(0, 0),
          [glyphChar("worm")]: T2(1, 0),
          [glyphChar("insect")]: T2(2, 0),
          [glyphChar("wall")]: T2(3, 0),
          [glyphChar("exit")]: T2(4, 0),
          [glyphChar("floor")]: T2(5, 0),
          [glyphChar("none")]: T2(6, 0),
          [glyphChar("rodent")]: T2(0, 1),
          [glyphChar("spider")]: T2(1, 1),
          [glyphChar("ghost")]: T2(2, 1),
          [glyphChar("eyeball")]: T2(3, 1),
          [glyphChar("do-gooder")]: T2(4, 1)
        },
        layout: "tile"
      });
    }
    let display = new display_default(options);
    let dispC = display.getContainer();
    playarea.appendChild(dispC);
    UI.uiCallback = () => {
      console.log("Drawing UI");
      UI.state = {
        playerEssence: Game.player.essence,
        playerMaxEssence: maxEssence(),
        targets: findTargets(),
        visible: monstersByDistance().map((n2) => n2[1]),
        mapDescription: getMapDescription(),
        onGround: getVictim()
      };
      drawMap(display);
      renderControls(Game, UI, logMessages);
    };
    UI.logCallback = (msg2, msgType) => {
      if (!msgType) {
        msgType = "info";
      }
      if (!logMessages[Game.turns]) {
        logMessages[Game.turns] = [];
      }
      logMessages[Game.turns].push([msg2, msgType]);
    };
    handleInput();
    startNewGame();
  }
  var KeyAliases = {
    ArrowUp: "k",
    ArrowDown: "j",
    ArrowLeft: "h",
    ArrowRight: "l"
  };
  function handleInput() {
    document.addEventListener("keydown", (e2) => {
      let key = e2.key;
      if (key === "Shift") {
        return;
      }
      if (UI.activeChoice) {
        if (UI.activeChoice.callbacks.onChoose(key)) {
          UI.activeChoice = UI.nextChoice;
          UI.nextChoice = null;
        }
        recomputeFOV();
        UI.uiCallback();
      } else {
        let alias = KeyAliases[key];
        if (alias) {
          key = alias;
        }
        if (e2.shiftKey) {
          key = key.toUpperCase();
        }
        let command = Commands[key];
        if (command !== void 0) {
          UI.commandQueue.push(key);
          setTimeout(() => tick(Game, UI), 0);
        }
      }
    });
  }
  function startNewGame() {
    resetGame();
    newMap();
    recomputeFOV();
    msg.think("The world thought me forever sleeping, yet I arise.");
    msg.think("But my essence is still weak. I can barely sustain these remnants of what I once was.");
    msg.think("I hunger... I must recover my essence and rebuild my power.");
    msg.break();
    msg.angry("And then they will all pay!");
    msg.break();
    msg.help("Use 'h'/'j'/'k'/'l' to move. You can enter the squares of weak and dying creatures. Go forth and feast!");
    msg.break();
    msg.help("Reach danger level %s to win.", Game.maxLevel);
    UI.uiCallback();
  }

  // src/app.ts
  window.onload = runGame;
})();
//# sourceMappingURL=app.js.map
