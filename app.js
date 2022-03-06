(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
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
      let t = 2091639 * this._s0 + this._c * FRAC;
      this._s0 = this._s1;
      this._s1 = this._s2;
      this._c = t | 0;
      this._s2 = t - this._c;
      return this._s2;
    }
    getUniformInt(lowerBound, upperBound) {
      let max = Math.max(lowerBound, upperBound);
      let min = Math.min(lowerBound, upperBound);
      return Math.floor(this.getUniform() * (max - min + 1)) + min;
    }
    getNormal(mean = 0, stddev = 1) {
      let u, v, r;
      do {
        u = 2 * this.getUniform() - 1;
        v = 2 * this.getUniform() - 1;
        r = u * u + v * v;
      } while (r > 1 || r == 0);
      let gauss = u * Math.sqrt(-2 * Math.log(r) / r);
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
    eventToPosition(x, y) {
      let canvas = this._ctx.canvas;
      let rect = canvas.getBoundingClientRect();
      x -= rect.left;
      y -= rect.top;
      x *= canvas.width / rect.width;
      y *= canvas.height / rect.height;
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        return [-1, -1];
      }
      return this._normalizedEventToPosition(x, y);
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
  function mod(x, n) {
    return (x % n + n) % n;
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
      let [x, y, ch, fg, bg] = data;
      let px = [
        (x + 1) * this._spacingX,
        y * this._spacingY + this._hexSize
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
      for (let i = 0; i < chars.length; i++) {
        this._ctx.fillText(chars[i], px[0], Math.ceil(px[1]));
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
    _normalizedEventToPosition(x, y) {
      let nodeSize;
      if (this._options.transpose) {
        x += y;
        y = x - y;
        x -= y;
        nodeSize = this._ctx.canvas.width;
      } else {
        nodeSize = this._ctx.canvas.height;
      }
      let size = nodeSize / this._options.height;
      y = Math.floor(y / size);
      if (mod(y, 2)) {
        x -= this._spacingX;
        x = 1 + 2 * Math.floor(x / (2 * this._spacingX));
      } else {
        x = 2 * Math.floor(x / (2 * this._spacingX));
      }
      return [x, y];
    }
    _fill(cx, cy) {
      let a = this._hexSize;
      let b = this._options.border;
      const ctx = this._ctx;
      ctx.beginPath();
      if (this._options.transpose) {
        ctx.moveTo(cx - a + b, cy);
        ctx.lineTo(cx - a / 2 + b, cy + this._spacingX - b);
        ctx.lineTo(cx + a / 2 - b, cy + this._spacingX - b);
        ctx.lineTo(cx + a - b, cy);
        ctx.lineTo(cx + a / 2 - b, cy - this._spacingX + b);
        ctx.lineTo(cx - a / 2 + b, cy - this._spacingX + b);
        ctx.lineTo(cx - a + b, cy);
      } else {
        ctx.moveTo(cx, cy - a + b);
        ctx.lineTo(cx + this._spacingX - b, cy - a / 2 + b);
        ctx.lineTo(cx + this._spacingX - b, cy + a / 2 - b);
        ctx.lineTo(cx, cy + a - b);
        ctx.lineTo(cx - this._spacingX + b, cy + a / 2 - b);
        ctx.lineTo(cx - this._spacingX + b, cy - a / 2 + b);
        ctx.lineTo(cx, cy - a + b);
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
        let [x, y, ch, fg, bg] = data;
        let hash = "" + ch + fg + bg;
        let canvas;
        if (hash in this._canvasCache) {
          canvas = this._canvasCache[hash];
        } else {
          let b = this._options.border;
          canvas = document.createElement("canvas");
          let ctx = canvas.getContext("2d");
          canvas.width = this._spacingX;
          canvas.height = this._spacingY;
          ctx.fillStyle = bg;
          ctx.fillRect(b, b, canvas.width - b, canvas.height - b);
          if (ch) {
            ctx.fillStyle = fg;
            ctx.font = this._ctx.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            let chars = [].concat(ch);
            for (let i = 0; i < chars.length; i++) {
              ctx.fillText(chars[i], this._spacingX / 2, Math.ceil(this._spacingY / 2));
            }
          }
          this._canvasCache[hash] = canvas;
        }
        this._ctx.drawImage(canvas, x * this._spacingX, y * this._spacingY);
      }
      _drawNoCache(data, clearBefore) {
        let [x, y, ch, fg, bg] = data;
        if (clearBefore) {
          let b = this._options.border;
          this._ctx.fillStyle = bg;
          this._ctx.fillRect(x * this._spacingX + b, y * this._spacingY + b, this._spacingX - b, this._spacingY - b);
        }
        if (!ch) {
          return;
        }
        this._ctx.fillStyle = fg;
        let chars = [].concat(ch);
        for (let i = 0; i < chars.length; i++) {
          this._ctx.fillText(chars[i], (x + 0.5) * this._spacingX, Math.ceil((y + 0.5) * this._spacingY));
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
      _normalizedEventToPosition(x, y) {
        return [Math.floor(x / this._spacingX), Math.floor(y / this._spacingY)];
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
      let [x, y, ch, fg, bg] = data;
      let tileWidth = this._options.tileWidth;
      let tileHeight = this._options.tileHeight;
      if (clearBefore) {
        if (this._options.tileColorize) {
          this._ctx.clearRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
        } else {
          this._ctx.fillStyle = bg;
          this._ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
        }
      }
      if (!ch) {
        return;
      }
      let chars = [].concat(ch);
      let fgs = [].concat(fg);
      let bgs = [].concat(bg);
      for (let i = 0; i < chars.length; i++) {
        let tile = this._options.tileMap[chars[i]];
        if (!tile) {
          throw new Error(`Char "${chars[i]}" not found in tileMap`);
        }
        if (this._options.tileColorize) {
          let canvas = this._colorCanvas;
          let context = canvas.getContext("2d");
          context.globalCompositeOperation = "source-over";
          context.clearRect(0, 0, tileWidth, tileHeight);
          let fg2 = fgs[i];
          let bg2 = bgs[i];
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
          this._ctx.drawImage(canvas, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
        } else {
          this._ctx.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
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
    _normalizedEventToPosition(x, y) {
      return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
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
    let cached, r;
    if (str in CACHE) {
      cached = CACHE[str];
    } else {
      if (str.charAt(0) == "#") {
        let matched = str.match(/[0-9a-f]/gi) || [];
        let values = matched.map((x) => parseInt(x, 16));
        if (values.length == 3) {
          cached = values.map((x) => x * 17);
        } else {
          for (let i = 0; i < 3; i++) {
            values[i + 1] += 16 * values[i];
            values.splice(i, 1);
          }
          cached = values;
        }
      } else if (r = str.match(/rgb\(([0-9, ]+)\)/i)) {
        cached = r[1].split(/\s*,\s*/).map((x) => parseInt(x));
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
      } catch (e) {
        alert(e.message);
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
      let [x, y, ch, fg, bg] = data;
      let scissorY = gl.canvas.height - (y + 1) * opts.tileHeight;
      gl.scissor(x * opts.tileWidth, scissorY, opts.tileWidth, opts.tileHeight);
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
      gl.uniform2fv(this._uniforms["targetPosRel"], [x, y]);
      for (let i = 0; i < chars.length; i++) {
        let tile = this._options.tileMap[chars[i]];
        if (!tile) {
          throw new Error(`Char "${chars[i]}" not found in tileMap`);
        }
        gl.uniform1f(this._uniforms["colorize"], opts.tileColorize ? 1 : 0);
        gl.uniform2fv(this._uniforms["tilesetPosAbs"], tile);
        if (opts.tileColorize) {
          gl.uniform4fv(this._uniforms["tint"], parseColor(fgs[i]));
          gl.uniform4fv(this._uniforms["bg"], parseColor(bgs[i]));
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
    eventToPosition(x, y) {
      let canvas = this._gl.canvas;
      let rect = canvas.getBoundingClientRect();
      x -= rect.left;
      y -= rect.top;
      x *= canvas.width / rect.width;
      y *= canvas.height / rect.height;
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        return [-1, -1];
      }
      return this._normalizedEventToPosition(x, y);
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
    _normalizedEventToPosition(x, y) {
      return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
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
    let t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return t;
  }
  var colorCache = {};
  function parseColor(color) {
    if (!(color in colorCache)) {
      let parsed;
      if (color == "transparent") {
        parsed = [0, 0, 0, 0];
      } else if (color.indexOf("rgba") > -1) {
        parsed = (color.match(/[\d.]+/g) || []).map(Number);
        for (let i = 0; i < 3; i++) {
          parsed[i] = parsed[i] / 255;
        }
      } else {
        parsed = fromString(color).map(($) => $ / 255);
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
  function positionToAnsi(x, y) {
    return `\x1B[${y + 1};${x + 1}H`;
  }
  function termcolor(color) {
    const SRC_COLORS = 256;
    const DST_COLORS = 6;
    const COLOR_RATIO = DST_COLORS / SRC_COLORS;
    let rgb = fromString(color);
    let r = Math.floor(rgb[0] * COLOR_RATIO);
    let g = Math.floor(rgb[1] * COLOR_RATIO);
    let b = Math.floor(rgb[2] * COLOR_RATIO);
    return r * 36 + g * 6 + b * 1 + 16;
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
      let [x, y, ch, fg, bg] = data;
      let dx = this._offset[0] + x;
      let dy = this._offset[1] + y;
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
    eventToPosition(x, y) {
      return [x, y];
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
    let i = 0;
    let lineLength = 0;
    let lastTokenWithSpace = -1;
    while (i < tokens.length) {
      let token = tokens[i];
      if (token.type == TYPE_NEWLINE) {
        lineLength = 0;
        lastTokenWithSpace = -1;
      }
      if (token.type != TYPE_TEXT) {
        i++;
        continue;
      }
      while (lineLength == 0 && token.value.charAt(0) == " ") {
        token.value = token.value.substring(1);
      }
      let index = token.value.indexOf("\n");
      if (index != -1) {
        token.value = breakInsideToken(tokens, i, index, true);
        let arr = token.value.split("");
        while (arr.length && arr[arr.length - 1] == " ") {
          arr.pop();
        }
        token.value = arr.join("");
      }
      if (!token.value.length) {
        tokens.splice(i, 1);
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
          token.value = breakInsideToken(tokens, i, index2, true);
        } else if (lastTokenWithSpace != -1) {
          let token2 = tokens[lastTokenWithSpace];
          let breakIndex = token2.value.lastIndexOf(" ");
          token2.value = breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
          i = lastTokenWithSpace;
        } else {
          token.value = breakInsideToken(tokens, i, maxWidth - lineLength, false);
        }
      } else {
        lineLength += token.value.length;
        if (token.value.indexOf(" ") != -1) {
          lastTokenWithSpace = i;
        }
      }
      i++;
    }
    tokens.push({ type: TYPE_NEWLINE });
    let lastTextToken = null;
    for (let i2 = 0; i2 < tokens.length; i2++) {
      let token = tokens[i2];
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
      DEBUG(x, y, what) {
        let colors = [this._options.bg, this._options.fg];
        this.draw(x, y, null, null, colors[what % colors.length]);
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
      eventToPosition(e) {
        let x, y;
        if ("touches" in e) {
          x = e.touches[0].clientX;
          y = e.touches[0].clientY;
        } else {
          x = e.clientX;
          y = e.clientY;
        }
        return this._backend.eventToPosition(x, y);
      }
      draw(x, y, ch, fg, bg) {
        if (!fg) {
          fg = this._options.fg;
        }
        if (!bg) {
          bg = this._options.bg;
        }
        let key = `${x},${y}`;
        this._data[key] = [x, y, ch, fg, bg];
        if (this._dirty === true) {
          return;
        }
        if (!this._dirty) {
          this._dirty = {};
        }
        this._dirty[key] = true;
      }
      drawOver(x, y, ch, fg, bg) {
        const key = `${x},${y}`;
        const existing = this._data[key];
        if (existing) {
          existing[2] = ch || existing[2];
          existing[3] = fg || existing[3];
          existing[4] = bg || existing[4];
        } else {
          this.draw(x, y, ch, fg, bg);
        }
      }
      drawText(x, y, text, maxWidth) {
        let fg = null;
        let bg = null;
        let cx = x;
        let cy = y;
        let lines = 1;
        if (!maxWidth) {
          maxWidth = this._options.width - x;
        }
        let tokens = tokenize(text, maxWidth);
        while (tokens.length) {
          let token = tokens.shift();
          switch (token.type) {
            case TYPE_TEXT:
              let isSpace = false, isPrevSpace = false, isFullWidth = false, isPrevFullWidth = false;
              for (let i = 0; i < token.value.length; i++) {
                let cc = token.value.charCodeAt(i);
                let c = token.value.charAt(i);
                if (this._options.layout === "term") {
                  let cch = cc >> 8;
                  let isCJK = cch === 17 || cch >= 46 && cch <= 159 || cch >= 172 && cch <= 215 || cc >= 43360 && cc <= 43391;
                  if (isCJK) {
                    this.draw(cx + 0, cy, c, fg, bg);
                    this.draw(cx + 1, cy, "	", fg, bg);
                    cx += 2;
                    continue;
                  }
                }
                isFullWidth = cc > 65280 && cc < 65377 || cc > 65500 && cc < 65512 || cc > 65518;
                isSpace = c.charCodeAt(0) == 32 || c.charCodeAt(0) == 12288;
                if (isPrevFullWidth && !isFullWidth && !isSpace) {
                  cx++;
                }
                if (isFullWidth && !isPrevSpace) {
                  cx++;
                }
                this.draw(cx++, cy, c, fg, bg);
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
              cx = x;
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
    _getCircle(cx, cy, r) {
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
      let x = cx + startOffset[0] * r;
      let y = cy + startOffset[1] * r;
      for (let i = 0; i < dirs.length; i++) {
        for (let j = 0; j < r * countFactor; j++) {
          result.push([x, y]);
          x += dirs[i][0];
          y += dirs[i][1];
        }
      }
      return result;
    }
  };

  // node_modules/rot-js/lib/fov/discrete-shadowcasting.js
  var DiscreteShadowcasting = class extends FOV {
    compute(x, y, R, callback) {
      callback(x, y, 0, 1);
      if (!this._lightPasses(x, y)) {
        return;
      }
      let DATA = [];
      let A, B, cx, cy, blocks;
      for (let r = 1; r <= R; r++) {
        let neighbors = this._getCircle(x, y, r);
        let angle = 360 / neighbors.length;
        for (let i = 0; i < neighbors.length; i++) {
          cx = neighbors[i][0];
          cy = neighbors[i][1];
          A = angle * (i - 0.5);
          B = A + angle;
          blocks = !this._lightPasses(cx, cy);
          if (this._visibleCoords(Math.floor(A), Math.ceil(B), blocks, DATA)) {
            callback(cx, cy, r, 1);
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
    compute(x, y, R, callback) {
      callback(x, y, 0, 1);
      if (!this._lightPasses(x, y)) {
        return;
      }
      let SHADOWS = [];
      let cx, cy, blocks, A1, A2, visibility;
      for (let r = 1; r <= R; r++) {
        let neighbors = this._getCircle(x, y, r);
        let neighborCount = neighbors.length;
        for (let i = 0; i < neighborCount; i++) {
          cx = neighbors[i][0];
          cy = neighbors[i][1];
          A1 = [i ? 2 * i - 1 : 2 * neighborCount - 1, 2 * neighborCount];
          A2 = [2 * i + 1, 2 * neighborCount];
          blocks = !this._lightPasses(cx, cy);
          visibility = this._checkVisibility(A1, A2, blocks, SHADOWS);
          if (visibility) {
            callback(cx, cy, r, visibility);
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
          let P = SHADOWS[index1];
          visibleLength = (A2[0] * P[1] - P[0] * A2[1]) / (P[1] * A2[1]);
          if (blocks) {
            SHADOWS.splice(index1, remove, A2);
          }
        } else {
          let P = SHADOWS[index2];
          visibleLength = (P[0] * A1[1] - A1[0] * P[1]) / (A1[1] * P[1]);
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
    compute(x, y, R, callback) {
      callback(x, y, 0, 1);
      for (let i = 0; i < OCTANTS.length; i++) {
        this._renderOctant(x, y, OCTANTS[i], R, callback);
      }
    }
    compute180(x, y, R, dir, callback) {
      callback(x, y, 0, 1);
      let previousOctant = (dir - 1 + 8) % 8;
      let nextPreviousOctant = (dir - 2 + 8) % 8;
      let nextOctant = (dir + 1 + 8) % 8;
      this._renderOctant(x, y, OCTANTS[nextPreviousOctant], R, callback);
      this._renderOctant(x, y, OCTANTS[previousOctant], R, callback);
      this._renderOctant(x, y, OCTANTS[dir], R, callback);
      this._renderOctant(x, y, OCTANTS[nextOctant], R, callback);
    }
    compute90(x, y, R, dir, callback) {
      callback(x, y, 0, 1);
      let previousOctant = (dir - 1 + 8) % 8;
      this._renderOctant(x, y, OCTANTS[dir], R, callback);
      this._renderOctant(x, y, OCTANTS[previousOctant], R, callback);
    }
    _renderOctant(x, y, octant, R, callback) {
      this._castVisibility(x, y, 1, 1, 0, R + 1, octant[0], octant[1], octant[2], octant[3], callback);
    }
    _castVisibility(startX, startY, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy, callback) {
      if (visSlopeStart < visSlopeEnd) {
        return;
      }
      for (let i = row; i <= radius; i++) {
        let dx = -i - 1;
        let dy = -i;
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
            callback(mapX, mapY, i, 1);
          }
          if (!blocked) {
            if (!this._lightPasses(mapX, mapY) && i < radius) {
              blocked = true;
              this._castVisibility(startX, startY, i + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy, callback);
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
  var Map = class {
    constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
      this._width = width;
      this._height = height;
    }
    _fillMap(value) {
      let map = [];
      for (let i = 0; i < this._width; i++) {
        map.push([]);
        for (let j = 0; j < this._height; j++) {
          map[i].push(value);
        }
      }
      return map;
    }
  };

  // node_modules/rot-js/lib/map/arena.js
  var Arena = class extends Map {
    create(callback) {
      let w = this._width - 1;
      let h = this._height - 1;
      for (let i = 0; i <= w; i++) {
        for (let j = 0; j <= h; j++) {
          let empty = i && j && i < w && j < h;
          callback(i, j, empty ? 0 : 1);
        }
      }
      return this;
    }
  };

  // node_modules/rot-js/lib/map/dungeon.js
  var Dungeon = class extends Map {
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
    static createRandomAt(x, y, dx, dy, options) {
      let min = options.roomWidth[0];
      let max = options.roomWidth[1];
      let width = rng_default.getUniformInt(min, max);
      min = options.roomHeight[0];
      max = options.roomHeight[1];
      let height = rng_default.getUniformInt(min, max);
      if (dx == 1) {
        let y2 = y - Math.floor(rng_default.getUniform() * height);
        return new this(x + 1, y2, x + width, y2 + height - 1, x, y);
      }
      if (dx == -1) {
        let y2 = y - Math.floor(rng_default.getUniform() * height);
        return new this(x - width, y2, x - 1, y2 + height - 1, x, y);
      }
      if (dy == 1) {
        let x2 = x - Math.floor(rng_default.getUniform() * width);
        return new this(x2, y + 1, x2 + width - 1, y + height, x, y);
      }
      if (dy == -1) {
        let x2 = x - Math.floor(rng_default.getUniform() * width);
        return new this(x2, y - height, x2 + width - 1, y - 1, x, y);
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
    addDoor(x, y) {
      this._doors[x + "," + y] = 1;
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
      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          if (x != left && x != right && y != top && y != bottom) {
            continue;
          }
          if (isWallCallback(x, y)) {
            continue;
          }
          this.addDoor(x, y);
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
      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          if (x == left || x == right || y == top || y == bottom) {
            if (!isWallCallback(x, y)) {
              return false;
            }
          } else {
            if (!canBeDugCallback(x, y)) {
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
      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          if (x + "," + y in this._doors) {
            value = 2;
          } else if (x == left || x == right || y == top || y == bottom) {
            value = 1;
          } else {
            value = 0;
          }
          digCallback(x, y, value);
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
    static createRandomAt(x, y, dx, dy, options) {
      let min = options.corridorLength[0];
      let max = options.corridorLength[1];
      let length = rng_default.getUniformInt(min, max);
      return new this(x, y, x + dx * length, y + dy * length);
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
      for (let i = 0; i < length; i++) {
        let x = sx + i * dx;
        let y = sy + i * dy;
        if (!canBeDugCallback(x, y)) {
          ok = false;
        }
        if (!isWallCallback(x + nx, y + ny)) {
          ok = false;
        }
        if (!isWallCallback(x - nx, y - ny)) {
          ok = false;
        }
        if (!ok) {
          length = i;
          this._endX = x - dx;
          this._endY = y - dy;
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
      for (let i = 0; i < length; i++) {
        let x = sx + i * dx;
        let y = sy + i * dy;
        digCallback(x, y, 0);
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
        for (let i = 0; i < this._width; i++) {
          for (let j = 0; j < this._height; j++) {
            callback(i, j, this._map[i][j]);
          }
        }
      }
      return this;
    }
    _generateRooms() {
      let w = this._width - 2;
      let h = this._height - 2;
      let room;
      do {
        room = this._generateRoom();
        if (this._dug / (w * h) > this._options.roomDugPercentage) {
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
        for (let i = 0; i < this._rooms.length; i++) {
          let room = this._rooms[i];
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
      for (let i = 0; i < rooms.length; i++) {
        let r = rooms[i];
        let c = r.getCenter();
        let dx = c[0] - center[0];
        let dy = c[1] - center[1];
        let d = dx * dx + dy * dy;
        if (d < dist) {
          dist = d;
          result = r;
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
      for (let i = 0; i < length; i++) {
        let x = start[0] + i * dir[0];
        let y = start[1] + i * dir[1];
        avail.push(null);
        let isWall = this._map[x][y] == 1;
        if (isWall) {
          if (lastBadIndex != i - 1) {
            avail[i] = [x, y];
          }
        } else {
          lastBadIndex = i;
          if (i) {
            avail[i - 1] = null;
          }
        }
      }
      for (let i = avail.length - 1; i >= 0; i--) {
        if (!avail[i]) {
          avail.splice(i, 1);
        }
      }
      return avail.length ? rng_default.getItem(avail) : null;
    }
    _digLine(points) {
      for (let i = 1; i < points.length; i++) {
        let start = points[i - 1];
        let end = points[i];
        let corridor = new Corridor(start[0], start[1], end[0], end[1]);
        corridor.create(this._digCallback);
        this._corridors.push(corridor);
      }
    }
    _digCallback(x, y, value) {
      this._map[x][y] = value;
      if (value == 0) {
        this._dug++;
      }
    }
    _isWallCallback(x, y) {
      if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
        return false;
      }
      return this._map[x][y] == 1;
    }
    _canBeDugCallback(x, y) {
      if (x < 1 || y < 1 || x + 1 >= this._width || y + 1 >= this._height) {
        return false;
      }
      return this._map[x][y] == 1;
    }
  };

  // node_modules/rot-js/lib/map/cellular.js
  var Cellular = class extends Map {
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
      for (let i = 0; i < this._width; i++) {
        for (let j = 0; j < this._height; j++) {
          this._map[i][j] = rng_default.getUniform() < probability ? 1 : 0;
        }
      }
      return this;
    }
    setOptions(options) {
      Object.assign(this._options, options);
    }
    set(x, y, value) {
      this._map[x][y] = value;
    }
    create(callback) {
      let newMap2 = this._fillMap(0);
      let born = this._options.born;
      let survive = this._options.survive;
      for (let j = 0; j < this._height; j++) {
        let widthStep = 1;
        let widthStart = 0;
        if (this._options.topology == 6) {
          widthStep = 2;
          widthStart = j % 2;
        }
        for (let i = widthStart; i < this._width; i += widthStep) {
          let cur = this._map[i][j];
          let ncount = this._getNeighbors(i, j);
          if (cur && survive.indexOf(ncount) != -1) {
            newMap2[i][j] = 1;
          } else if (!cur && born.indexOf(ncount) != -1) {
            newMap2[i][j] = 1;
          }
        }
      }
      this._map = newMap2;
      callback && this._serviceCallback(callback);
    }
    _serviceCallback(callback) {
      for (let j = 0; j < this._height; j++) {
        let widthStep = 1;
        let widthStart = 0;
        if (this._options.topology == 6) {
          widthStep = 2;
          widthStart = j % 2;
        }
        for (let i = widthStart; i < this._width; i += widthStep) {
          callback(i, j, this._map[i][j]);
        }
      }
    }
    _getNeighbors(cx, cy) {
      let result = 0;
      for (let i = 0; i < this._dirs.length; i++) {
        let dir = this._dirs[i];
        let x = cx + dir[0];
        let y = cy + dir[1];
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
          continue;
        }
        result += this._map[x][y] == 1 ? 1 : 0;
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
      for (let y = 0; y < this._height; y++) {
        for (let x = widthStarts[y % 2]; x < this._width; x += widthStep) {
          if (this._freeSpace(x, y, value)) {
            let p = [x, y];
            notConnected[this._pointKey(p)] = p;
            allFreeSpace.push([x, y]);
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
        for (let k in local) {
          let pp = local[k];
          this._map[pp[0]][pp[1]] = value;
          connected[k] = pp;
          delete notConnected[k];
        }
      }
      callback && this._serviceCallback(callback);
    }
    _getFromTo(connected, notConnected) {
      let from = [0, 0], to = [0, 0], d;
      let connectedKeys = Object.keys(connected);
      let notConnectedKeys = Object.keys(notConnected);
      for (let i = 0; i < 5; i++) {
        if (connectedKeys.length < notConnectedKeys.length) {
          let keys = connectedKeys;
          to = connected[keys[rng_default.getUniformInt(0, keys.length - 1)]];
          from = this._getClosest(to, notConnected);
        } else {
          let keys = notConnectedKeys;
          from = notConnected[keys[rng_default.getUniformInt(0, keys.length - 1)]];
          to = this._getClosest(from, connected);
        }
        d = (from[0] - to[0]) * (from[0] - to[0]) + (from[1] - to[1]) * (from[1] - to[1]);
        if (d < 64) {
          break;
        }
      }
      return [from, to];
    }
    _getClosest(point, space) {
      let minPoint = null;
      let minDist = null;
      for (let k in space) {
        let p = space[k];
        let d = (p[0] - point[0]) * (p[0] - point[0]) + (p[1] - point[1]) * (p[1] - point[1]);
        if (minDist == null || d < minDist) {
          minDist = d;
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
        for (let i = 0; i < tests.length; i++) {
          let key = this._pointKey(tests[i]);
          if (connected[key] == null && this._freeSpace(tests[i][0], tests[i][1], value)) {
            connected[key] = tests[i];
            if (!keepNotConnected) {
              delete notConnected[key];
            }
            stack.push(tests[i]);
          }
        }
      }
    }
    _tunnelToConnected(to, from, connected, notConnected, value, connectionCallback) {
      let a, b;
      if (from[0] < to[0]) {
        a = from;
        b = to;
      } else {
        a = to;
        b = from;
      }
      for (let xx = a[0]; xx <= b[0]; xx++) {
        this._map[xx][a[1]] = value;
        let p = [xx, a[1]];
        let pkey = this._pointKey(p);
        connected[pkey] = p;
        delete notConnected[pkey];
      }
      if (connectionCallback && a[0] < b[0]) {
        connectionCallback(a, [b[0], a[1]]);
      }
      let x = b[0];
      if (from[1] < to[1]) {
        a = from;
        b = to;
      } else {
        a = to;
        b = from;
      }
      for (let yy = a[1]; yy < b[1]; yy++) {
        this._map[x][yy] = value;
        let p = [x, yy];
        let pkey = this._pointKey(p);
        connected[pkey] = p;
        delete notConnected[pkey];
      }
      if (connectionCallback && a[1] < b[1]) {
        connectionCallback([b[0], a[1]], [b[0], b[1]]);
      }
    }
    _tunnelToConnected6(to, from, connected, notConnected, value, connectionCallback) {
      let a, b;
      if (from[0] < to[0]) {
        a = from;
        b = to;
      } else {
        a = to;
        b = from;
      }
      let xx = a[0];
      let yy = a[1];
      while (!(xx == b[0] && yy == b[1])) {
        let stepWidth = 2;
        if (yy < b[1]) {
          yy++;
          stepWidth = 1;
        } else if (yy > b[1]) {
          yy--;
          stepWidth = 1;
        }
        if (xx < b[0]) {
          xx += stepWidth;
        } else if (xx > b[0]) {
          xx -= stepWidth;
        } else if (b[1] % 2) {
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
    _freeSpace(x, y, value) {
      return x >= 0 && x < this._width && y >= 0 && y < this._height && this._map[x][y] == value;
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
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        let dir = this._getDiggingDirection(x, y);
        if (!dir) {
          continue;
        }
        let featureAttempts = 0;
        do {
          featureAttempts++;
          if (this._tryFeature(x, y, dir[0], dir[1])) {
            this._removeSurroundingWalls(x, y);
            this._removeSurroundingWalls(x - dir[0], y - dir[1]);
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
        for (let i = 0; i < this._width; i++) {
          for (let j = 0; j < this._height; j++) {
            callback(i, j, this._map[i][j]);
          }
        }
      }
      this._walls = {};
      this._map = [];
      return this;
    }
    _digCallback(x, y, value) {
      if (value == 0 || value == 2) {
        this._map[x][y] = 0;
        this._dug++;
      } else {
        this._walls[x + "," + y] = 1;
      }
    }
    _isWallCallback(x, y) {
      if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
        return false;
      }
      return this._map[x][y] == 1;
    }
    _canBeDugCallback(x, y) {
      if (x < 1 || y < 1 || x + 1 >= this._width || y + 1 >= this._height) {
        return false;
      }
      return this._map[x][y] == 1;
    }
    _priorityWallCallback(x, y) {
      this._walls[x + "," + y] = 2;
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
    _tryFeature(x, y, dx, dy) {
      let featureName = rng_default.getWeightedValue(this._features);
      let ctor = FEATURES[featureName];
      let feature = ctor.createRandomAt(x, y, dx, dy, this._options);
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
      for (let i = 0; i < deltas.length; i++) {
        let delta = deltas[i];
        let x = cx + delta[0];
        let y = cy + delta[1];
        delete this._walls[x + "," + y];
        x = cx + 2 * delta[0];
        y = cy + 2 * delta[1];
        delete this._walls[x + "," + y];
      }
    }
    _getDiggingDirection(cx, cy) {
      if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) {
        return null;
      }
      let result = null;
      let deltas = DIRS[4];
      for (let i = 0; i < deltas.length; i++) {
        let delta = deltas[i];
        let x = cx + delta[0];
        let y = cy + delta[1];
        if (!this._map[x][y]) {
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
      function isWallCallback(x, y) {
        return data[x][y] == 1;
      }
      ;
      for (let i = 0; i < this._rooms.length; i++) {
        let room = this._rooms[i];
        room.clearDoors();
        room.addDoors(isWallCallback);
      }
    }
  };

  // node_modules/rot-js/lib/map/ellermaze.js
  function addToList(i, L, R) {
    R[L[i + 1]] = R[i];
    L[R[i]] = L[i + 1];
    R[i] = i + 1;
    L[i + 1] = i;
  }
  function removeFromList(i, L, R) {
    R[L[i]] = R[i];
    L[R[i]] = L[i];
    R[i] = i;
    L[i] = i;
  }
  var EllerMaze = class extends Map {
    create(callback) {
      let map = this._fillMap(1);
      let w = Math.ceil((this._width - 2) / 2);
      let rand = 9 / 24;
      let L = [];
      let R = [];
      for (let i = 0; i < w; i++) {
        L.push(i);
        R.push(i);
      }
      L.push(w - 1);
      let j;
      for (j = 1; j + 3 < this._height; j += 2) {
        for (let i = 0; i < w; i++) {
          let x = 2 * i + 1;
          let y = j;
          map[x][y] = 0;
          if (i != L[i + 1] && rng_default.getUniform() > rand) {
            addToList(i, L, R);
            map[x + 1][y] = 0;
          }
          if (i != L[i] && rng_default.getUniform() > rand) {
            removeFromList(i, L, R);
          } else {
            map[x][y + 1] = 0;
          }
        }
      }
      for (let i = 0; i < w; i++) {
        let x = 2 * i + 1;
        let y = j;
        map[x][y] = 0;
        if (i != L[i + 1] && (i == L[i] || rng_default.getUniform() > rand)) {
          addToList(i, L, R);
          map[x + 1][y] = 0;
        }
        removeFromList(i, L, R);
      }
      for (let i = 0; i < this._width; i++) {
        for (let j2 = 0; j2 < this._height; j2++) {
          callback(i, j2, map[i][j2]);
        }
      }
      return this;
    }
  };

  // node_modules/rot-js/lib/map/dividedmaze.js
  var DividedMaze = class extends Map {
    constructor() {
      super(...arguments);
      this._stack = [];
      this._map = [];
    }
    create(callback) {
      let w = this._width;
      let h = this._height;
      this._map = [];
      for (let i = 0; i < w; i++) {
        this._map.push([]);
        for (let j = 0; j < h; j++) {
          let border = i == 0 || j == 0 || i + 1 == w || j + 1 == h;
          this._map[i].push(border ? 1 : 0);
        }
      }
      this._stack = [
        [1, 1, w - 2, h - 2]
      ];
      this._process();
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
          callback(i, j, this._map[i][j]);
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
      for (let i = room[0] + 1; i < room[2]; i++) {
        let top = this._map[i][room[1] - 1];
        let bottom = this._map[i][room[3] + 1];
        if (top && bottom && !(i % 2)) {
          availX.push(i);
        }
      }
      for (let j = room[1] + 1; j < room[3]; j++) {
        let left = this._map[room[0] - 1][j];
        let right = this._map[room[2] + 1][j];
        if (left && right && !(j % 2)) {
          availY.push(j);
        }
      }
      if (!availX.length || !availY.length) {
        return;
      }
      let x = rng_default.getItem(availX);
      let y = rng_default.getItem(availY);
      this._map[x][y] = 1;
      let walls = [];
      let w = [];
      walls.push(w);
      for (let i = room[0]; i < x; i++) {
        this._map[i][y] = 1;
        if (i % 2)
          w.push([i, y]);
      }
      w = [];
      walls.push(w);
      for (let i = x + 1; i <= room[2]; i++) {
        this._map[i][y] = 1;
        if (i % 2)
          w.push([i, y]);
      }
      w = [];
      walls.push(w);
      for (let j = room[1]; j < y; j++) {
        this._map[x][j] = 1;
        if (j % 2)
          w.push([x, j]);
      }
      w = [];
      walls.push(w);
      for (let j = y + 1; j <= room[3]; j++) {
        this._map[x][j] = 1;
        if (j % 2)
          w.push([x, j]);
      }
      let solid = rng_default.getItem(walls);
      for (let i = 0; i < walls.length; i++) {
        let w2 = walls[i];
        if (w2 == solid) {
          continue;
        }
        let hole = rng_default.getItem(w2);
        this._map[hole[0]][hole[1]] = 0;
      }
      this._stack.push([room[0], room[1], x - 1, y - 1]);
      this._stack.push([x + 1, room[1], room[2], y - 1]);
      this._stack.push([room[0], y + 1, x - 1, room[3]]);
      this._stack.push([x + 1, y + 1, room[2], room[3]]);
    }
  };

  // node_modules/rot-js/lib/map/iceymaze.js
  var IceyMaze = class extends Map {
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
            for (let i = 0; i < 4; i++) {
              nx = cx + dirs[i][0] * 2;
              ny = cy + dirs[i][1] * 2;
              if (this._isFree(map, nx, ny, width, height)) {
                map[nx][ny] = 0;
                map[cx + dirs[i][0]][cy + dirs[i][1]] = 0;
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
      for (let i = 0; i < this._width; i++) {
        for (let j = 0; j < this._height; j++) {
          callback(i, j, map[i][j]);
        }
      }
      this._map = [];
      return this;
    }
    _randomize(dirs) {
      for (let i = 0; i < 4; i++) {
        dirs[i][0] = 0;
        dirs[i][1] = 0;
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
    _isFree(map, x, y, width, height) {
      if (x < 1 || y < 1 || x >= width || y >= height) {
        return false;
      }
      return map[x][y];
    }
  };

  // node_modules/rot-js/lib/map/rogue.js
  var Rogue = class extends Map {
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
        for (let i = 0; i < this._width; i++) {
          for (let j = 0; j < this._height; j++) {
            callback(i, j, this.map[i][j]);
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
      for (let i = 0; i < this._options.cellWidth; i++) {
        this.rooms.push([]);
        for (let j = 0; j < this._options.cellHeight; j++) {
          this.rooms[i].push({ "x": 0, "y": 0, "width": 0, "height": 0, "connections": [], "cellx": i, "celly": j });
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
      for (let i = 0; i < this._options.cellWidth; i++) {
        for (let j = 0; j < this._options.cellHeight; j++) {
          room = this.rooms[i][j];
          if (room["connections"].length == 0) {
            let directions = [0, 2, 4, 6];
            directions = rng_default.shuffle(directions);
            validRoom = false;
            do {
              let dirIdx = directions.pop();
              let newI = i + DIRS[8][dirIdx][0];
              let newJ = j + DIRS[8][dirIdx][1];
              if (newI < 0 || newI >= cw || newJ < 0 || newJ >= ch) {
                continue;
              }
              otherRoom = this.rooms[newI][newJ];
              validRoom = true;
              if (otherRoom["connections"].length == 0) {
                break;
              }
              for (let k = 0; k < otherRoom["connections"].length; k++) {
                if (otherRoom["connections"][k][0] == i && otherRoom["connections"][k][1] == j) {
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
      let w = this._width;
      let h = this._height;
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
      for (let i = 0; i < cw; i++) {
        for (let j = 0; j < ch; j++) {
          sx = cwp * i;
          sy = chp * j;
          if (sx == 0) {
            sx = 1;
          }
          if (sy == 0) {
            sy = 1;
          }
          roomw = rng_default.getUniformInt(roomWidth[0], roomWidth[1]);
          roomh = rng_default.getUniformInt(roomHeight[0], roomHeight[1]);
          if (j > 0) {
            otherRoom = this.rooms[i][j - 1];
            while (sy - (otherRoom["y"] + otherRoom["height"]) < 3) {
              sy++;
            }
          }
          if (i > 0) {
            otherRoom = this.rooms[i - 1][j];
            while (sx - (otherRoom["x"] + otherRoom["width"]) < 3) {
              sx++;
            }
          }
          let sxOffset = Math.round(rng_default.getUniformInt(0, cwp - roomw) / 2);
          let syOffset = Math.round(rng_default.getUniformInt(0, chp - roomh) / 2);
          while (sx + sxOffset + roomw >= w) {
            if (sxOffset) {
              sxOffset--;
            } else {
              roomw--;
            }
          }
          while (sy + syOffset + roomh >= h) {
            if (syOffset) {
              syOffset--;
            } else {
              roomh--;
            }
          }
          sx = sx + sxOffset;
          sy = sy + syOffset;
          this.rooms[i][j]["x"] = sx;
          this.rooms[i][j]["y"] = sy;
          this.rooms[i][j]["width"] = roomw;
          this.rooms[i][j]["height"] = roomh;
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
      for (let i = 0; i < cw; i++) {
        for (let j = 0; j < ch; j++) {
          room = this.rooms[i][j];
          for (let k = 0; k < room["connections"].length; k++) {
            connection = room["connections"][k];
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

  // src/app.ts
  var verminHP = { n: 1, sides: 1, mod: 0 };
  function asRoll(n, sides, mod2) {
    return { n, sides, mod: mod2 };
  }
  function doRoll(roll) {
    let n = 0;
    for (let i = 0; i < roll.n; i += 1) {
      n += rng_default.getUniformInt(1, roll.sides);
    }
    return n + roll.mod;
  }
  var WandEffects = {
    seeker: { type: "targeting", targeting: "seeker" },
    bolt: { type: "projectile", projectile: "bolt" },
    weakMana: { type: "damage", damage: asRoll(1, 4, 0) }
  };
  var Glyphs = {
    player: "@",
    wall: "#",
    floor: ".",
    rock: ".",
    insect: "i",
    worm: "w"
  };
  var Tiles = {
    rock: { glyph: "rock", blocks: true },
    wall: { glyph: "wall", blocks: true },
    floor: { glyph: "floor", blocks: false }
  };
  var MonsterArchetypes = {
    maggot: {
      name: "maggot heap",
      danger: 1,
      glyph: "worm",
      appearing: asRoll(1, 4, 3),
      hp: verminHP
    },
    gnatSwarm: {
      name: "gnat swarm",
      danger: 1,
      glyph: "insect",
      appearing: asRoll(2, 4, 0),
      hp: verminHP
    }
  };
  function spawnMonster(archetype) {
    return {
      archetype,
      hp: doRoll(MonsterArchetypes[archetype].hp)
    };
  }
  var DeathMessages = {
    drain: "%S crumbles into dust.",
    force: "%S is blown to pieces."
  };
  function gainEssence(amt) {
    Game.player.essence += amt;
    if (Game.player.essence > Game.player.maxEssence) {
      Game.player.essence = Game.player.maxEssence;
      msg.log("Some essence escapes you and dissipates.");
    }
  }
  var Commands = {
    h: movePlayer(-1, 0),
    l: movePlayer(1, 0),
    j: movePlayer(0, 1),
    k: movePlayer(0, -1),
    d: () => {
      let c = contentsAt(Game.player.x, Game.player.y);
      if (c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        Game.player.energy -= 0.5;
        if (c.monster.hp > 1) {
          msg.angry("The wretched creature resists!");
        } else {
          msg.log("You devour the essence of %s.", describe(c));
          gainEssence(arch.danger);
          killMonsterAt(c, "drain");
        }
      } else {
        msg.think("Nothing is here to drain of essence.");
      }
    },
    " ": () => {
      let targeting = WandEffects.seeker;
      let projectile = WandEffects.bolt;
      let damage = WandEffects.weakMana;
      let cost = 3;
      if (cost > Game.player.essence) {
        msg.angry("I must have more essence!");
        return;
      }
      let target = null;
      switch (targeting.targeting) {
        case "seeker":
          let closestDistance = 9999;
          Game.map.fov.compute(Game.player.x, Game.player.y, Game.viewport.width / 2, (x, y, r, v) => {
            let c = contentsAt(x, y);
            if (c.monster) {
              let dist = Math.abs(Game.player.x - x) * Math.abs(Game.player.y - y);
              if (dist < closestDistance) {
                closestDistance = dist;
                target = c;
              }
            }
          });
      }
      if (target) {
        msg.log("The bolt hits %s!", describe(target));
        damageMonsterAt(target, damage.damage);
      } else {
        msg.think("I see none here to destroy.");
        return;
      }
      Game.player.essence -= cost;
      Game.player.energy -= 1;
    }
  };
  var Game = {
    viewport: {
      width: 30,
      height: 30
    },
    player: {
      x: 10,
      y: 10,
      essence: 0,
      maxEssence: 10,
      energy: 1,
      glyph: "player",
      knownMonsters: {}
    },
    map: {
      danger: 5,
      w: 80,
      h: 80,
      tiles: [],
      monsters: [],
      memory: [],
      fov: new fov_default.PreciseShadowcasting((x, y) => {
        let c = contentsAt(x, y);
        return !(!c.tile || c.tile.blocks);
      })
    },
    commandQueue: [],
    uiCallback: () => {
    },
    logCallback: (msg2, msgType) => {
    }
  };
  function newMap(opts) {
    Game.map.tiles = [];
    Game.map.monsters = [];
    Game.map.memory = [];
    if (opts) {
      Game.map = __spreadValues(__spreadValues({}, Game.map), opts);
    }
    Game.map.tiles.fill(Tiles.rock, 0, Game.map.h * Game.map.w);
    Game.map.monsters.fill(null, 0, Game.map.w * Game.map.h);
    Game.map.memory.fill([null, null], 0, Game.map.w * Game.map.h);
    let map = new map_default.Digger(Game.map.w, Game.map.h);
    map.create();
    let rooms = map.getRooms();
    for (let room of rooms) {
      room.create((x, y, v) => {
        Game.map.tiles[x + y * Game.map.w] = v === 1 ? Tiles.wall : Tiles.floor;
      });
    }
    rooms = rng_default.shuffle(rooms);
    const startRoom = rooms.shift();
    const [px, py] = startRoom.getCenter();
    Game.player.x = px;
    Game.player.y = py;
    const eligibleMonsters = Object.keys(MonsterArchetypes).filter((id) => MonsterArchetypes[id].danger <= Game.map.danger);
    for (let room of rooms) {
      const mArch = rng_default.getItem(eligibleMonsters);
      let appearing = doRoll(MonsterArchetypes[mArch].appearing);
      while (appearing > 0) {
        let mx = rng_default.getUniformInt(room.getLeft(), room.getRight());
        let my = rng_default.getUniformInt(room.getTop(), room.getBottom());
        let c = contentsAt(mx, my);
        if (!c.blocked) {
          Game.map.monsters[mx + my * Game.map.w] = spawnMonster(mArch);
        }
        appearing -= 1;
      }
    }
    for (let corridor of map.getCorridors()) {
      corridor.create((x, y, v) => {
        Game.map.tiles[x + y * Game.map.w] = Tiles.floor;
      });
    }
  }
  function tileAt(x, y) {
    return Game.map.tiles[x + y * Game.map.w];
  }
  function monsterAt(x, y) {
    return Game.map.monsters[x + y * Game.map.w];
  }
  function playerAt(x, y) {
    return Game.player.x === x && Game.player.y === y;
  }
  function contentsAt(x, y) {
    let tile = tileAt(x, y);
    let monster = monsterAt(x, y);
    let player = playerAt(x, y);
    let archetype = (monster == null ? void 0 : monster.archetype) || null;
    let blocked = player;
    if (tile == null ? void 0 : tile.blocks) {
      blocked = true;
    }
    if (monster && monster.hp > 1) {
      blocked = true;
    }
    return {
      x,
      y,
      tile,
      monster,
      player,
      blocked,
      memory: [tile, archetype]
    };
  }
  function describe(c) {
    if (c.monster) {
      return "a " + MonsterArchetypes[c.monster.archetype].name;
    } else {
      return "something";
    }
  }
  function killMonsterAt(c, death) {
    if (c.monster) {
      c.monster.hp = 0;
      msg.log(DeathMessages[death], describe(c));
      Game.map.monsters[c.x + c.y * Game.map.w] = null;
    }
  }
  function damageMonsterAt(c, damage) {
    if (c.monster) {
      let arch = MonsterArchetypes[c.monster.archetype];
      let wasDying = c.monster.hp <= 1;
      c.monster.hp -= doRoll(damage);
      if (c.monster.hp > 1) {
        msg.log("You see %s shudder!", describe(c));
      } else {
        if (wasDying) {
          killMonsterAt(c, "force");
        } else {
          msg.log("You see %s collapse!", describe(c));
        }
      }
    }
  }
  function tick() {
    if (Game.commandQueue.length == 0) {
      return;
    }
    while (Game.player.energy >= 1) {
      let nextCommand = Game.commandQueue.shift();
      if (nextCommand) {
        Commands[nextCommand]();
        Game.uiCallback();
      } else {
        break;
      }
    }
    if (Game.player.energy < 1) {
      Game.player.energy += 1;
    }
    Game.uiCallback();
  }
  function movePlayer(dx, dy) {
    return () => {
      const p = Game.player;
      const nx = p.x + dx;
      const ny = p.y + dy;
      const c = contentsAt(nx, ny);
      if (!c.blocked) {
        p.x = nx;
        p.y = ny;
        p.energy -= 1;
        if (c.monster) {
          msg.log("You feel the essence of %s awaiting your grasp.", describe(c));
          if (!Game.player.knownMonsters[c.monster.archetype]) {
            Game.player.knownMonsters[c.monster.archetype] = true;
            let archetype = MonsterArchetypes[c.monster.archetype];
            if (archetype.danger === 1) {
              msg.angry("Petty vermin!");
            }
          }
        }
      } else {
        if (c.monster) {
          msg.think("My way is blocked by %s.", describe(c));
        } else {
          msg.think("There is no passing this way.");
        }
      }
    };
  }
  function mkSay(type) {
    return (fmt, ...args) => {
      Game.logCallback(Util.format(fmt, ...args), type);
    };
  }
  var msg = {
    log: mkSay("normal"),
    think: mkSay("thought"),
    angry: mkSay("angry")
  };
  function handleInput() {
    document.addEventListener("keypress", (e) => {
      let command = Commands[e.key];
      if (command) {
        Game.commandQueue.push(e.key);
        setTimeout(tick, 0);
      }
    });
  }
  function drawMap(display) {
    display.clear();
    let sx = Game.player.x - Game.viewport.width / 2;
    let sy = Game.player.y - Game.viewport.height / 2;
    if (sx < 0) {
      sx = 0;
    }
    if (sy < 0) {
      sy = 0;
    }
    for (let ix = 0; ix < Game.viewport.width; ix += 1) {
      for (let iy = 0; iy < Game.viewport.height; iy += 1) {
        let mem = Game.map.memory[sx + ix + (sy + iy) * Game.map.w];
        if (mem) {
          let [mtile, mmons] = mem;
          if (mmons) {
            display.draw(ix, iy, Glyphs[MonsterArchetypes[mmons].glyph], "#666", "#000");
          } else if (mtile) {
            display.draw(ix, iy, Glyphs[mtile.glyph], "#666", "#000");
          }
        }
      }
    }
    Game.map.fov.compute(Game.player.x, Game.player.y, Game.viewport.width / 2, (x, y, r, v) => {
      if (x < sx) {
        return;
      }
      if (y < sy) {
        return;
      }
      let c = contentsAt(x, y);
      Game.map.memory[x + y * Game.map.w] = c.memory;
      if (c.player) {
        display.draw(x - sx, y - sy, Glyphs[Game.player.glyph], "#ccc", "#111");
      } else if (c.monster) {
        display.draw(x - sx, y - sy, Glyphs[MonsterArchetypes[c.monster.archetype].glyph], "#eee", "#111");
      } else if (c.tile) {
        display.draw(x - sx, y - sy, Glyphs[c.tile.glyph], "#999", "#111");
      } else {
        display.draw(x - sx, y - sy, Glyphs.rock, "#000", "#000");
      }
    });
  }
  function runGame() {
    let playarea = document.getElementById("playarea");
    let messages = document.getElementById("messages");
    let display = new display_default(Game.viewport);
    let dispC = display.getContainer();
    playarea.appendChild(dispC);
    let logEl = document.createElement("ul");
    logEl.className = "messageLog";
    messages.appendChild(logEl);
    let logMessages = [];
    Game.uiCallback = () => {
      drawMap(display);
      if (logMessages.length > 0) {
        let logLine = document.createElement("li");
        for (let [msg2, msgType] of logMessages) {
          let msgEl = document.createElement("span");
          msgEl.className = "msg-" + msgType;
          msgEl.innerHTML = msg2 + " ";
          logLine.appendChild(msgEl);
        }
        logEl.prepend(logLine);
        logMessages.length = 0;
      }
      document.getElementById("essence").innerText = Game.player.essence.toString();
      document.getElementById("maxEssence").innerText = Game.player.maxEssence.toString();
    };
    Game.logCallback = (msg2, msgType) => {
      if (!msgType) {
        msgType = "info";
      }
      logMessages.push([msg2, msgType]);
    };
    handleInput();
    newMap();
    Game.uiCallback();
  }
  window.onload = runGame;
})();
//# sourceMappingURL=app.js.map
