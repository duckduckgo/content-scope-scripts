"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
    mod
  ));

  // ../node_modules/classnames/index.js
  var require_classnames = __commonJS({
    "../node_modules/classnames/index.js"(exports, module) {
      (function() {
        "use strict";
        var hasOwn = {}.hasOwnProperty;
        function classNames2() {
          var classes = "";
          for (var i3 = 0; i3 < arguments.length; i3++) {
            var arg = arguments[i3];
            if (arg) {
              classes = appendClass(classes, parseValue(arg));
            }
          }
          return classes;
        }
        function parseValue(arg) {
          if (typeof arg === "string" || typeof arg === "number") {
            return arg;
          }
          if (typeof arg !== "object") {
            return "";
          }
          if (Array.isArray(arg)) {
            return classNames2.apply(null, arg);
          }
          if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
            return arg.toString();
          }
          var classes = "";
          for (var key in arg) {
            if (hasOwn.call(arg, key) && arg[key]) {
              classes = appendClass(classes, key);
            }
          }
          return classes;
        }
        function appendClass(value, newClass) {
          if (!newClass) {
            return value;
          }
          if (value) {
            return value + " " + newClass;
          }
          return value + newClass;
        }
        if (typeof module !== "undefined" && module.exports) {
          classNames2.default = classNames2;
          module.exports = classNames2;
        } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
          define("classnames", [], function() {
            return classNames2;
          });
        } else {
          window.classNames = classNames2;
        }
      })();
    }
  });

  // ../node_modules/@rive-app/canvas-single/rive.js
  var require_rive = __commonJS({
    "../node_modules/@rive-app/canvas-single/rive.js"(exports, module) {
      (function webpackUniversalModuleDefinition(root2, factory) {
        if (typeof exports === "object" && typeof module === "object")
          module.exports = factory();
        else if (typeof define === "function" && define.amd)
          define([], factory);
        else if (typeof exports === "object")
          exports["rive"] = factory();
        else
          root2["rive"] = factory();
      })(exports, () => {
        return (
          /******/
          (() => {
            "use strict";
            var __webpack_modules__ = [
              ,
              /* 1 */
              /***/
              (__unused_webpack___webpack_module__, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  "default": () => __WEBPACK_DEFAULT_EXPORT__
                  /* harmony export */
                });
                var Rive2 = (() => {
                  var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
                  return function(moduleArg = {}) {
                    var m2 = moduleArg, aa, ea;
                    m2.ready = new Promise((a3, b2) => {
                      aa = a3;
                      ea = b2;
                    });
                    function fa() {
                      function a3(g2) {
                        const n2 = d3;
                        c3 = b2 = 0;
                        d3 = /* @__PURE__ */ new Map();
                        n2.forEach((p3) => {
                          try {
                            p3(g2);
                          } catch (l3) {
                            console.error(l3);
                          }
                        });
                        this.ob();
                        e3 && e3.Tb();
                      }
                      let b2 = 0, c3 = 0, d3 = /* @__PURE__ */ new Map(), e3 = null, f3 = null;
                      this.requestAnimationFrame = function(g2) {
                        b2 || (b2 = requestAnimationFrame(a3.bind(this)));
                        const n2 = ++c3;
                        d3.set(n2, g2);
                        return n2;
                      };
                      this.cancelAnimationFrame = function(g2) {
                        d3.delete(g2);
                        b2 && 0 == d3.size && (cancelAnimationFrame(b2), b2 = 0);
                      };
                      this.Rb = function(g2) {
                        f3 && (document.body.remove(f3), f3 = null);
                        g2 || (f3 = document.createElement("div"), f3.style.backgroundColor = "black", f3.style.position = "fixed", f3.style.right = 0, f3.style.top = 0, f3.style.color = "white", f3.style.padding = "4px", f3.innerHTML = "RIVE FPS", g2 = function(n2) {
                          f3.innerHTML = "RIVE FPS " + n2.toFixed(1);
                        }, document.body.appendChild(f3));
                        e3 = new function() {
                          let n2 = 0, p3 = 0;
                          this.Tb = function() {
                            var l3 = performance.now();
                            p3 ? (++n2, l3 -= p3, 1e3 < l3 && (g2(1e3 * n2 / l3), n2 = p3 = 0)) : (p3 = l3, n2 = 0);
                          };
                        }();
                      };
                      this.Ob = function() {
                        f3 && (document.body.remove(f3), f3 = null);
                        e3 = null;
                      };
                      this.ob = function() {
                      };
                    }
                    function ha(a3) {
                      console.assert(true);
                      const b2 = /* @__PURE__ */ new Map();
                      let c3 = -Infinity;
                      this.push = function(d3) {
                        d3 = d3 + ((1 << a3) - 1) >> a3;
                        b2.has(d3) && clearTimeout(b2.get(d3));
                        b2.set(d3, setTimeout(function() {
                          b2.delete(d3);
                          0 == b2.length ? c3 = -Infinity : d3 == c3 && (c3 = Math.max(...b2.keys()), console.assert(c3 < d3));
                        }, 1e3));
                        c3 = Math.max(d3, c3);
                        return c3 << a3;
                      };
                    }
                    const ia = m2.onRuntimeInitialized;
                    m2.onRuntimeInitialized = function() {
                      ia && ia();
                      let a3 = m2.decodeAudio;
                      m2.decodeAudio = function(e3, f3) {
                        e3 = a3(e3);
                        f3(e3);
                      };
                      let b2 = m2.decodeFont;
                      m2.decodeFont = function(e3, f3) {
                        e3 = b2(e3);
                        f3(e3);
                      };
                      const c3 = m2.FileAssetLoader;
                      m2.ptrToAsset = (e3) => {
                        let f3 = m2.ptrToFileAsset(e3);
                        return f3.isImage ? m2.ptrToImageAsset(e3) : f3.isFont ? m2.ptrToFontAsset(e3) : f3.isAudio ? m2.ptrToAudioAsset(e3) : f3;
                      };
                      m2.CustomFileAssetLoader = c3.extend("CustomFileAssetLoader", { __construct: function({ loadContents: e3 }) {
                        this.__parent.__construct.call(this);
                        this.Gb = e3;
                      }, loadContents: function(e3, f3) {
                        e3 = m2.ptrToAsset(e3);
                        return this.Gb(e3, f3);
                      } });
                      m2.CDNFileAssetLoader = c3.extend("CDNFileAssetLoader", { __construct: function() {
                        this.__parent.__construct.call(this);
                      }, loadContents: function(e3) {
                        let f3 = m2.ptrToAsset(e3);
                        e3 = f3.cdnUuid;
                        if ("" === e3) {
                          return false;
                        }
                        (function(g2, n2) {
                          var p3 = new XMLHttpRequest();
                          p3.responseType = "arraybuffer";
                          p3.onreadystatechange = function() {
                            4 == p3.readyState && 200 == p3.status && n2(p3);
                          };
                          p3.open("GET", g2, true);
                          p3.send(null);
                        })(f3.cdnBaseUrl + "/" + e3, (g2) => {
                          f3.decode(new Uint8Array(g2.response));
                        });
                        return true;
                      } });
                      m2.FallbackFileAssetLoader = c3.extend("FallbackFileAssetLoader", { __construct: function() {
                        this.__parent.__construct.call(this);
                        this.kb = [];
                      }, addLoader: function(e3) {
                        this.kb.push(e3);
                      }, loadContents: function(e3, f3) {
                        for (let g2 of this.kb) {
                          if (g2.loadContents(e3, f3)) {
                            return true;
                          }
                        }
                        return false;
                      } });
                      let d3 = m2.computeAlignment;
                      m2.computeAlignment = function(e3, f3, g2, n2, p3 = 1) {
                        return d3.call(this, e3, f3, g2, n2, p3);
                      };
                    };
                    const ja = "createConicGradient createImageData createLinearGradient createPattern createRadialGradient getContextAttributes getImageData getLineDash getTransform isContextLost isPointInPath isPointInStroke measureText".split(" "), ka = new function() {
                      function a3() {
                        if (!b2) {
                          let B3 = function(D2, w3, M2) {
                            w3 = r3.createShader(w3);
                            r3.shaderSource(w3, M2);
                            r3.compileShader(w3);
                            M2 = r3.getShaderInfoLog(w3);
                            if (0 < (M2 || "").length) {
                              throw M2;
                            }
                            r3.attachShader(D2, w3);
                          };
                          var k3 = document.createElement("canvas"), t3 = { alpha: 1, depth: 0, stencil: 0, antialias: 0, premultipliedAlpha: 1, preserveDrawingBuffer: 0, powerPreference: "high-performance", failIfMajorPerformanceCaveat: 0, enableExtensionsByDefault: 1, explicitSwapControl: 1, renderViaOffscreenBackBuffer: 1 };
                          let r3;
                          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                            if (r3 = k3.getContext("webgl", t3), c3 = 1, !r3) {
                              return console.log("No WebGL support. Image mesh will not be drawn."), false;
                            }
                          } else {
                            if (r3 = k3.getContext("webgl2", t3)) {
                              c3 = 2;
                            } else {
                              if (r3 = k3.getContext("webgl", t3)) {
                                c3 = 1;
                              } else {
                                return console.log("No WebGL support. Image mesh will not be drawn."), false;
                              }
                            }
                          }
                          r3 = new Proxy(r3, { get(D2, w3) {
                            if (D2.isContextLost()) {
                              if (p3 || (console.error("Cannot render the mesh because the GL Context was lost. Tried to invoke ", w3), p3 = true), "function" === typeof D2[w3]) {
                                return function() {
                                };
                              }
                            } else {
                              return "function" === typeof D2[w3] ? function(...M2) {
                                return D2[w3].apply(D2, M2);
                              } : D2[w3];
                            }
                          }, set(D2, w3, M2) {
                            if (D2.isContextLost()) {
                              p3 || (console.error("Cannot render the mesh because the GL Context was lost. Tried to set property " + w3), p3 = true);
                            } else {
                              return D2[w3] = M2, true;
                            }
                          } });
                          d3 = Math.min(r3.getParameter(r3.MAX_RENDERBUFFER_SIZE), r3.getParameter(r3.MAX_TEXTURE_SIZE));
                          k3 = r3.createProgram();
                          B3(k3, r3.VERTEX_SHADER, "attribute vec2 vertex;\n                attribute vec2 uv;\n                uniform vec4 mat;\n                uniform vec2 translate;\n                varying vec2 st;\n                void main() {\n                    st = uv;\n                    gl_Position = vec4(mat2(mat) * vertex + translate, 0, 1);\n                }");
                          B3(k3, r3.FRAGMENT_SHADER, "precision highp float;\n                uniform sampler2D image;\n                varying vec2 st;\n                void main() {\n                    gl_FragColor = texture2D(image, st);\n                }");
                          r3.bindAttribLocation(k3, 0, "vertex");
                          r3.bindAttribLocation(k3, 1, "uv");
                          r3.linkProgram(k3);
                          t3 = r3.getProgramInfoLog(k3);
                          if (0 < (t3 || "").trim().length) {
                            throw t3;
                          }
                          e3 = r3.getUniformLocation(k3, "mat");
                          f3 = r3.getUniformLocation(k3, "translate");
                          r3.useProgram(k3);
                          r3.bindBuffer(r3.ARRAY_BUFFER, r3.createBuffer());
                          r3.enableVertexAttribArray(0);
                          r3.enableVertexAttribArray(1);
                          r3.bindBuffer(r3.ELEMENT_ARRAY_BUFFER, r3.createBuffer());
                          r3.uniform1i(r3.getUniformLocation(k3, "image"), 0);
                          r3.pixelStorei(r3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                          b2 = r3;
                        }
                        return true;
                      }
                      let b2 = null, c3 = 0, d3 = 0, e3 = null, f3 = null, g2 = 0, n2 = 0, p3 = false;
                      a3();
                      this.hc = function() {
                        a3();
                        return d3;
                      };
                      this.Mb = function(k3) {
                        b2.deleteTexture && b2.deleteTexture(k3);
                      };
                      this.Lb = function(k3) {
                        if (!a3()) {
                          return null;
                        }
                        const t3 = b2.createTexture();
                        if (!t3) {
                          return null;
                        }
                        b2.bindTexture(b2.TEXTURE_2D, t3);
                        b2.texImage2D(b2.TEXTURE_2D, 0, b2.RGBA, b2.RGBA, b2.UNSIGNED_BYTE, k3);
                        b2.texParameteri(b2.TEXTURE_2D, b2.TEXTURE_WRAP_S, b2.CLAMP_TO_EDGE);
                        b2.texParameteri(b2.TEXTURE_2D, b2.TEXTURE_WRAP_T, b2.CLAMP_TO_EDGE);
                        b2.texParameteri(b2.TEXTURE_2D, b2.TEXTURE_MAG_FILTER, b2.LINEAR);
                        2 == c3 ? (b2.texParameteri(b2.TEXTURE_2D, b2.TEXTURE_MIN_FILTER, b2.LINEAR_MIPMAP_LINEAR), b2.generateMipmap(b2.TEXTURE_2D)) : b2.texParameteri(b2.TEXTURE_2D, b2.TEXTURE_MIN_FILTER, b2.LINEAR);
                        return t3;
                      };
                      const l3 = new ha(8), u3 = new ha(8), v3 = new ha(10), x3 = new ha(10);
                      this.Qb = function(k3, t3, r3, B3, D2) {
                        if (a3()) {
                          var w3 = l3.push(k3), M2 = u3.push(t3);
                          if (b2.canvas) {
                            if (b2.canvas.width != w3 || b2.canvas.height != M2) {
                              b2.canvas.width = w3, b2.canvas.height = M2;
                            }
                            b2.viewport(0, M2 - t3, k3, t3);
                            b2.disable(b2.SCISSOR_TEST);
                            b2.clearColor(0, 0, 0, 0);
                            b2.clear(b2.COLOR_BUFFER_BIT);
                            b2.enable(b2.SCISSOR_TEST);
                            r3.sort((H, ba) => ba.wb - H.wb);
                            w3 = v3.push(B3);
                            g2 != w3 && (b2.bufferData(b2.ARRAY_BUFFER, 8 * w3, b2.DYNAMIC_DRAW), g2 = w3);
                            w3 = 0;
                            for (var T3 of r3) {
                              b2.bufferSubData(b2.ARRAY_BUFFER, w3, T3.Ta), w3 += 4 * T3.Ta.length;
                            }
                            console.assert(w3 == 4 * B3);
                            for (var ca of r3) {
                              b2.bufferSubData(b2.ARRAY_BUFFER, w3, ca.Db), w3 += 4 * ca.Db.length;
                            }
                            console.assert(w3 == 8 * B3);
                            w3 = x3.push(D2);
                            n2 != w3 && (b2.bufferData(b2.ELEMENT_ARRAY_BUFFER, 2 * w3, b2.DYNAMIC_DRAW), n2 = w3);
                            T3 = 0;
                            for (var ra of r3) {
                              b2.bufferSubData(b2.ELEMENT_ARRAY_BUFFER, T3, ra.indices), T3 += 2 * ra.indices.length;
                            }
                            console.assert(T3 == 2 * D2);
                            ra = 0;
                            ca = true;
                            w3 = T3 = 0;
                            for (const H of r3) {
                              H.image.Ka != ra && (b2.bindTexture(b2.TEXTURE_2D, H.image.Ja || null), ra = H.image.Ka);
                              H.mc ? (b2.scissor(H.Ya, M2 - H.Za - H.jb, H.Ac, H.jb), ca = true) : ca && (b2.scissor(0, M2 - t3, k3, t3), ca = false);
                              r3 = 2 / k3;
                              const ba = -2 / t3;
                              b2.uniform4f(e3, H.ha[0] * r3 * H.Ba, H.ha[1] * ba * H.Ca, H.ha[2] * r3 * H.Ba, H.ha[3] * ba * H.Ca);
                              b2.uniform2f(f3, H.ha[4] * r3 * H.Ba + r3 * (H.Ya - H.ic * H.Ba) - 1, H.ha[5] * ba * H.Ca + ba * (H.Za - H.jc * H.Ca) + 1);
                              b2.vertexAttribPointer(0, 2, b2.FLOAT, false, 0, w3);
                              b2.vertexAttribPointer(1, 2, b2.FLOAT, false, 0, w3 + 4 * B3);
                              b2.drawElements(b2.TRIANGLES, H.indices.length, b2.UNSIGNED_SHORT, T3);
                              w3 += 4 * H.Ta.length;
                              T3 += 2 * H.indices.length;
                            }
                            console.assert(w3 == 4 * B3);
                            console.assert(T3 == 2 * D2);
                          }
                        }
                      };
                      this.canvas = function() {
                        return a3() && b2.canvas;
                      };
                    }(), la = m2.onRuntimeInitialized;
                    m2.onRuntimeInitialized = function() {
                      function a3(q3) {
                        switch (q3) {
                          case l3.srcOver:
                            return "source-over";
                          case l3.screen:
                            return "screen";
                          case l3.overlay:
                            return "overlay";
                          case l3.darken:
                            return "darken";
                          case l3.lighten:
                            return "lighten";
                          case l3.colorDodge:
                            return "color-dodge";
                          case l3.colorBurn:
                            return "color-burn";
                          case l3.hardLight:
                            return "hard-light";
                          case l3.softLight:
                            return "soft-light";
                          case l3.difference:
                            return "difference";
                          case l3.exclusion:
                            return "exclusion";
                          case l3.multiply:
                            return "multiply";
                          case l3.hue:
                            return "hue";
                          case l3.saturation:
                            return "saturation";
                          case l3.color:
                            return "color";
                          case l3.luminosity:
                            return "luminosity";
                        }
                      }
                      function b2(q3) {
                        return "rgba(" + ((16711680 & q3) >>> 16) + "," + ((65280 & q3) >>> 8) + "," + ((255 & q3) >>> 0) + "," + ((4278190080 & q3) >>> 24) / 255 + ")";
                      }
                      function c3() {
                        0 < M2.length && (ka.Qb(w3.drawWidth(), w3.drawHeight(), M2, T3, ca), M2 = [], ca = T3 = 0, w3.reset(512, 512));
                        for (const q3 of D2) {
                          for (const y3 of q3.H) {
                            y3();
                          }
                          q3.H = [];
                        }
                        D2.clear();
                      }
                      la && la();
                      var d3 = m2.RenderPaintStyle;
                      const e3 = m2.RenderPath, f3 = m2.RenderPaint, g2 = m2.Renderer, n2 = m2.StrokeCap, p3 = m2.StrokeJoin, l3 = m2.BlendMode, u3 = d3.fill, v3 = d3.stroke, x3 = m2.FillRule.evenOdd;
                      let k3 = 1;
                      var t3 = m2.RenderImage.extend("CanvasRenderImage", { __construct: function({ la: q3, xa: y3 } = {}) {
                        this.__parent.__construct.call(this);
                        this.Ka = k3;
                        k3 = k3 + 1 & 2147483647 || 1;
                        this.la = q3;
                        this.xa = y3;
                      }, __destruct: function() {
                        this.Ja && (ka.Mb(this.Ja), URL.revokeObjectURL(this.Wa));
                        this.__parent.__destruct.call(this);
                      }, decode: function(q3) {
                        var y3 = this;
                        y3.xa && y3.xa(y3);
                        var F2 = new Image();
                        y3.Wa = URL.createObjectURL(new Blob([q3], { type: "image/png" }));
                        F2.onload = function() {
                          y3.Fb = F2;
                          y3.Ja = ka.Lb(F2);
                          y3.size(F2.width, F2.height);
                          y3.la && y3.la(y3);
                        };
                        F2.src = y3.Wa;
                      } }), r3 = e3.extend("CanvasRenderPath", { __construct: function() {
                        this.__parent.__construct.call(this);
                        this.T = new Path2D();
                      }, rewind: function() {
                        this.T = new Path2D();
                      }, addPath: function(q3, y3, F2, G2, A3, I2, J) {
                        var K = this.T, X = K.addPath;
                        q3 = q3.T;
                        const Q = new DOMMatrix();
                        Q.a = y3;
                        Q.b = F2;
                        Q.c = G2;
                        Q.d = A3;
                        Q.e = I2;
                        Q.f = J;
                        X.call(K, q3, Q);
                      }, fillRule: function(q3) {
                        this.Va = q3;
                      }, moveTo: function(q3, y3) {
                        this.T.moveTo(q3, y3);
                      }, lineTo: function(q3, y3) {
                        this.T.lineTo(q3, y3);
                      }, cubicTo: function(q3, y3, F2, G2, A3, I2) {
                        this.T.bezierCurveTo(q3, y3, F2, G2, A3, I2);
                      }, close: function() {
                        this.T.closePath();
                      } }), B3 = f3.extend("CanvasRenderPaint", { color: function(q3) {
                        this.Xa = b2(q3);
                      }, thickness: function(q3) {
                        this.Ib = q3;
                      }, join: function(q3) {
                        switch (q3) {
                          case p3.miter:
                            this.Ia = "miter";
                            break;
                          case p3.round:
                            this.Ia = "round";
                            break;
                          case p3.bevel:
                            this.Ia = "bevel";
                        }
                      }, cap: function(q3) {
                        switch (q3) {
                          case n2.butt:
                            this.Ha = "butt";
                            break;
                          case n2.round:
                            this.Ha = "round";
                            break;
                          case n2.square:
                            this.Ha = "square";
                        }
                      }, style: function(q3) {
                        this.Hb = q3;
                      }, blendMode: function(q3) {
                        this.Eb = a3(q3);
                      }, clearGradient: function() {
                        this.ja = null;
                      }, linearGradient: function(q3, y3, F2, G2) {
                        this.ja = { yb: q3, zb: y3, bb: F2, cb: G2, Ra: [] };
                      }, radialGradient: function(q3, y3, F2, G2) {
                        this.ja = { yb: q3, zb: y3, bb: F2, cb: G2, Ra: [], ec: true };
                      }, addStop: function(q3, y3) {
                        this.ja.Ra.push({ color: q3, stop: y3 });
                      }, completeGradient: function() {
                      }, draw: function(q3, y3, F2) {
                        let G2 = this.Hb;
                        var A3 = this.Xa, I2 = this.ja;
                        q3.globalCompositeOperation = this.Eb;
                        if (null != I2) {
                          A3 = I2.yb;
                          var J = I2.zb;
                          const X = I2.bb;
                          var K = I2.cb;
                          const Q = I2.Ra;
                          I2.ec ? (I2 = X - A3, K -= J, A3 = q3.createRadialGradient(A3, J, 0, A3, J, Math.sqrt(I2 * I2 + K * K))) : A3 = q3.createLinearGradient(A3, J, X, K);
                          for (let da = 0, R = Q.length; da < R; da++) {
                            J = Q[da], A3.addColorStop(J.stop, b2(J.color));
                          }
                          this.Xa = A3;
                          this.ja = null;
                        }
                        switch (G2) {
                          case v3:
                            q3.strokeStyle = A3;
                            q3.lineWidth = this.Ib;
                            q3.lineCap = this.Ha;
                            q3.lineJoin = this.Ia;
                            q3.stroke(y3);
                            break;
                          case u3:
                            q3.fillStyle = A3, q3.fill(y3, F2);
                        }
                      } });
                      const D2 = /* @__PURE__ */ new Set();
                      let w3 = null, M2 = [], T3 = 0, ca = 0;
                      var ra = m2.CanvasRenderer = g2.extend("Renderer", { __construct: function(q3) {
                        this.__parent.__construct.call(this);
                        this.S = [1, 0, 0, 1, 0, 0];
                        this.C = q3.getContext("2d");
                        this.Ua = q3;
                        this.H = [];
                      }, save: function() {
                        this.S.push(...this.S.slice(this.S.length - 6));
                        this.H.push(this.C.save.bind(this.C));
                      }, restore: function() {
                        const q3 = this.S.length - 6;
                        if (6 > q3) {
                          throw "restore() called without matching save().";
                        }
                        this.S.splice(q3);
                        this.H.push(this.C.restore.bind(this.C));
                      }, transform: function(q3, y3, F2, G2, A3, I2) {
                        const J = this.S, K = J.length - 6;
                        J.splice(K, 6, J[K] * q3 + J[K + 2] * y3, J[K + 1] * q3 + J[K + 3] * y3, J[K] * F2 + J[K + 2] * G2, J[K + 1] * F2 + J[K + 3] * G2, J[K] * A3 + J[K + 2] * I2 + J[K + 4], J[K + 1] * A3 + J[K + 3] * I2 + J[K + 5]);
                        this.H.push(this.C.transform.bind(this.C, q3, y3, F2, G2, A3, I2));
                      }, rotate: function(q3) {
                        const y3 = Math.sin(q3);
                        q3 = Math.cos(q3);
                        this.transform(q3, y3, -y3, q3, 0, 0);
                      }, _drawPath: function(q3, y3) {
                        this.H.push(y3.draw.bind(y3, this.C, q3.T, q3.Va === x3 ? "evenodd" : "nonzero"));
                      }, _drawRiveImage: function(q3, y3, F2) {
                        var G2 = q3.Fb;
                        if (G2) {
                          var A3 = this.C, I2 = a3(y3);
                          this.H.push(function() {
                            A3.globalCompositeOperation = I2;
                            A3.globalAlpha = F2;
                            A3.drawImage(G2, 0, 0);
                            A3.globalAlpha = 1;
                          });
                        }
                      }, _getMatrix: function(q3) {
                        const y3 = this.S, F2 = y3.length - 6;
                        for (let G2 = 0; 6 > G2; ++G2) {
                          q3[G2] = y3[F2 + G2];
                        }
                      }, _drawImageMesh: function(q3, y3, F2, G2, A3, I2, J, K, X, Q) {
                        var da = this.C.canvas.width, R = this.C.canvas.height;
                        const Xb = X - J, Yb = Q - K;
                        J = Math.max(J, 0);
                        K = Math.max(K, 0);
                        X = Math.min(X, da);
                        Q = Math.min(Q, R);
                        const Fa = X - J, Ga = Q - K;
                        console.assert(Fa <= Math.min(Xb, da));
                        console.assert(Ga <= Math.min(Yb, R));
                        if (!(0 >= Fa || 0 >= Ga)) {
                          X = Fa < Xb || Ga < Yb;
                          da = Q = 1;
                          var sa = Math.ceil(Fa * Q), ta = Math.ceil(Ga * da);
                          R = ka.hc();
                          sa > R && (Q *= R / sa, sa = R);
                          ta > R && (da *= R / ta, ta = R);
                          w3 || (w3 = new m2.DynamicRectanizer(R), w3.reset(512, 512));
                          R = w3.addRect(sa, ta);
                          0 > R && (c3(), D2.add(this), R = w3.addRect(sa, ta), console.assert(0 <= R));
                          var Zb = R & 65535, $b = R >> 16;
                          M2.push({ ha: this.S.slice(this.S.length - 6), image: q3, Ya: Zb, Za: $b, ic: J, jc: K, Ac: sa, jb: ta, Ba: Q, Ca: da, Ta: new Float32Array(G2), Db: new Float32Array(A3), indices: new Uint16Array(I2), mc: X, wb: q3.Ka << 1 | (X ? 1 : 0) });
                          T3 += G2.length;
                          ca += I2.length;
                          var ya = this.C, md = a3(y3);
                          this.H.push(function() {
                            ya.save();
                            ya.resetTransform();
                            ya.globalCompositeOperation = md;
                            ya.globalAlpha = F2;
                            const ac = ka.canvas();
                            ac && ya.drawImage(ac, Zb, $b, sa, ta, J, K, Fa, Ga);
                            ya.restore();
                          });
                        }
                      }, _clipPath: function(q3) {
                        this.H.push(this.C.clip.bind(this.C, q3.T, q3.Va === x3 ? "evenodd" : "nonzero"));
                      }, clear: function() {
                        D2.add(this);
                        this.H.push(this.C.clearRect.bind(this.C, 0, 0, this.Ua.width, this.Ua.height));
                      }, flush: function() {
                      }, translate: function(q3, y3) {
                        this.transform(1, 0, 0, 1, q3, y3);
                      } });
                      m2.makeRenderer = function(q3) {
                        const y3 = new ra(q3), F2 = y3.C;
                        return new Proxy(y3, { get(G2, A3) {
                          if ("function" === typeof G2[A3]) {
                            return function(...I2) {
                              return G2[A3].apply(G2, I2);
                            };
                          }
                          if ("function" === typeof F2[A3]) {
                            if (-1 < ja.indexOf(A3)) {
                              throw Error("RiveException: Method call to '" + A3 + "()' is not allowed, as the renderer cannot immediately pass through the return                 values of any canvas 2d context methods.");
                            }
                            return function(...I2) {
                              y3.H.push(F2[A3].bind(F2, ...I2));
                            };
                          }
                          return G2[A3];
                        }, set(G2, A3, I2) {
                          if (A3 in F2) {
                            return y3.H.push(() => {
                              F2[A3] = I2;
                            }), true;
                          }
                        } });
                      };
                      m2.decodeImage = function(q3, y3) {
                        new t3({ la: y3 }).decode(q3);
                      };
                      m2.renderFactory = { makeRenderPaint: function() {
                        return new B3();
                      }, makeRenderPath: function() {
                        return new r3();
                      }, makeRenderImage: function() {
                        let q3 = ba;
                        return new t3({ xa: () => {
                          q3.total++;
                        }, la: () => {
                          q3.loaded++;
                          if (q3.loaded === q3.total) {
                            const y3 = q3.ready;
                            y3 && (y3(), q3.ready = null);
                          }
                        } });
                      } };
                      let H = m2.load, ba = null;
                      m2.load = function(q3, y3, F2 = true) {
                        const G2 = new m2.FallbackFileAssetLoader();
                        void 0 !== y3 && G2.addLoader(y3);
                        F2 && (y3 = new m2.CDNFileAssetLoader(), G2.addLoader(y3));
                        return new Promise(function(A3) {
                          let I2 = null;
                          ba = { total: 0, loaded: 0, ready: function() {
                            A3(I2);
                          } };
                          I2 = H(q3, G2);
                          0 == ba.total && A3(I2);
                        });
                      };
                      let nd = m2.RendererWrapper.prototype.align;
                      m2.RendererWrapper.prototype.align = function(q3, y3, F2, G2, A3 = 1) {
                        nd.call(this, q3, y3, F2, G2, A3);
                      };
                      d3 = new fa();
                      m2.requestAnimationFrame = d3.requestAnimationFrame.bind(d3);
                      m2.cancelAnimationFrame = d3.cancelAnimationFrame.bind(d3);
                      m2.enableFPSCounter = d3.Rb.bind(d3);
                      m2.disableFPSCounter = d3.Ob;
                      d3.ob = c3;
                      m2.resolveAnimationFrame = c3;
                      m2.cleanup = function() {
                        w3 && w3.delete();
                      };
                    };
                    var ma = Object.assign({}, m2), na = "./this.program", oa = "function" == typeof importScripts, pa = "", qa;
                    if ("object" == typeof window || oa) {
                      oa ? pa = self.location.href : "undefined" != typeof document && document.currentScript && (pa = document.currentScript.src), _scriptDir && (pa = _scriptDir), 0 !== pa.indexOf("blob:") ? pa = pa.substr(0, pa.replace(/[?#].*/, "").lastIndexOf("/") + 1) : pa = "", oa && (qa = (a3) => {
                        var b2 = new XMLHttpRequest();
                        b2.open("GET", a3, false);
                        b2.responseType = "arraybuffer";
                        b2.send(null);
                        return new Uint8Array(b2.response);
                      });
                    }
                    var ua = m2.print || console.log.bind(console), va = m2.printErr || console.error.bind(console);
                    Object.assign(m2, ma);
                    ma = null;
                    m2.thisProgram && (na = m2.thisProgram);
                    var wa;
                    m2.wasmBinary && (wa = m2.wasmBinary);
                    var noExitRuntime = m2.noExitRuntime || true;
                    "object" != typeof WebAssembly && xa("no native wasm support detected");
                    var za, z3, Aa = false, C3, E, Ba, Ca, L2, N2, Da, Ea;
                    function Ha() {
                      var a3 = za.buffer;
                      m2.HEAP8 = C3 = new Int8Array(a3);
                      m2.HEAP16 = Ba = new Int16Array(a3);
                      m2.HEAP32 = L2 = new Int32Array(a3);
                      m2.HEAPU8 = E = new Uint8Array(a3);
                      m2.HEAPU16 = Ca = new Uint16Array(a3);
                      m2.HEAPU32 = N2 = new Uint32Array(a3);
                      m2.HEAPF32 = Da = new Float32Array(a3);
                      m2.HEAPF64 = Ea = new Float64Array(a3);
                    }
                    var Ia, Ja = [], Ka = [], La = [];
                    function Ma() {
                      var a3 = m2.preRun.shift();
                      Ja.unshift(a3);
                    }
                    var Na = 0, Oa = null, Pa = null;
                    function xa(a3) {
                      if (m2.onAbort) {
                        m2.onAbort(a3);
                      }
                      a3 = "Aborted(" + a3 + ")";
                      va(a3);
                      Aa = true;
                      a3 = new WebAssembly.RuntimeError(a3 + ". Build with -sASSERTIONS for more info.");
                      ea(a3);
                      throw a3;
                    }
                    function Qa(a3) {
                      return a3.startsWith("data:application/octet-stream;base64,");
                    }
                    var Ra;
                    if (!Qa(Ra)) {
                      var Sa = Ra;
                      Ra = m2.locateFile ? m2.locateFile(Sa, pa) : pa + Sa;
                    }
                    function Ta() {
                      var a3 = Ra;
                      return Promise.resolve().then(() => {
                        if (a3 == Ra && wa) {
                          var b2 = new Uint8Array(wa);
                        } else {
                          if (Qa(a3)) {
                            try {
                              b2 = atob(a3.slice(37));
                              for (var c3 = new Uint8Array(b2.length), d3 = 0; d3 < b2.length; ++d3) {
                                c3[d3] = b2.charCodeAt(d3);
                              }
                            } catch (e3) {
                              throw Error("Converting base64 string to bytes failed.");
                            }
                            b2 = c3;
                          } else {
                            b2 = void 0;
                          }
                          if (!b2) {
                            if (qa) {
                              b2 = qa(a3);
                            } else {
                              throw "both async and sync fetching of the wasm failed";
                            }
                          }
                        }
                        return b2;
                      });
                    }
                    function Ua(a3, b2) {
                      return Ta().then((c3) => WebAssembly.instantiate(c3, a3)).then((c3) => c3).then(b2, (c3) => {
                        va("failed to asynchronously prepare wasm: " + c3);
                        xa(c3);
                      });
                    }
                    function Va(a3, b2) {
                      return Ua(a3, b2);
                    }
                    var Wa, Xa, ab = { 445532: (a3, b2, c3, d3, e3) => {
                      if ("undefined" === typeof window || void 0 === (window.AudioContext || window.webkitAudioContext)) {
                        return 0;
                      }
                      if ("undefined" === typeof window.h) {
                        window.h = { Aa: 0 };
                        window.h.I = {};
                        window.h.I.ya = a3;
                        window.h.I.capture = b2;
                        window.h.I.La = c3;
                        window.h.ga = {};
                        window.h.ga.stopped = d3;
                        window.h.ga.xb = e3;
                        let f3 = window.h;
                        f3.D = [];
                        f3.yc = function(g2) {
                          for (var n2 = 0; n2 < f3.D.length; ++n2) {
                            if (null == f3.D[n2]) {
                              return f3.D[n2] = g2, n2;
                            }
                          }
                          f3.D.push(g2);
                          return f3.D.length - 1;
                        };
                        f3.Cb = function(g2) {
                          for (f3.D[g2] = null; 0 < f3.D.length; ) {
                            if (null == f3.D[f3.D.length - 1]) {
                              f3.D.pop();
                            } else {
                              break;
                            }
                          }
                        };
                        f3.Sc = function(g2) {
                          for (var n2 = 0; n2 < f3.D.length; ++n2) {
                            if (f3.D[n2] == g2) {
                              return f3.Cb(n2);
                            }
                          }
                        };
                        f3.ra = function(g2) {
                          return f3.D[g2];
                        };
                        f3.Bb = ["touchend", "click"];
                        f3.unlock = function() {
                          for (var g2 = 0; g2 < f3.D.length; ++g2) {
                            var n2 = f3.D[g2];
                            null != n2 && null != n2.J && n2.state === f3.ga.xb && n2.J.resume().then(() => {
                              Ya(n2.pb);
                            }, (p3) => {
                              console.error("Failed to resume audiocontext", p3);
                            });
                          }
                          f3.Bb.map(function(p3) {
                            document.removeEventListener(p3, f3.unlock, true);
                          });
                        };
                        f3.Bb.map(function(g2) {
                          document.addEventListener(g2, f3.unlock, true);
                        });
                      }
                      window.h.Aa += 1;
                      return 1;
                    }, 447710: () => {
                      "undefined" !== typeof window.h && (--window.h.Aa, 0 === window.h.Aa && delete window.h);
                    }, 447874: () => void 0 !== navigator.mediaDevices && void 0 !== navigator.mediaDevices.getUserMedia, 447978: () => {
                      try {
                        var a3 = new (window.AudioContext || window.webkitAudioContext)(), b2 = a3.sampleRate;
                        a3.close();
                        return b2;
                      } catch (c3) {
                        return 0;
                      }
                    }, 448149: (a3, b2, c3, d3, e3, f3) => {
                      if ("undefined" === typeof window.h) {
                        return -1;
                      }
                      var g2 = {}, n2 = {};
                      a3 == window.h.I.ya && 0 != c3 && (n2.sampleRate = c3);
                      g2.J = new (window.AudioContext || window.webkitAudioContext)(n2);
                      g2.J.suspend();
                      g2.state = window.h.ga.stopped;
                      c3 = 0;
                      a3 != window.h.I.ya && (c3 = b2);
                      g2.Z = g2.J.createScriptProcessor(d3, c3, b2);
                      g2.Z.onaudioprocess = function(p3) {
                        if (null == g2.sa || 0 == g2.sa.length) {
                          g2.sa = new Float32Array(Da.buffer, e3, d3 * b2);
                        }
                        if (a3 == window.h.I.capture || a3 == window.h.I.La) {
                          for (var l3 = 0; l3 < b2; l3 += 1) {
                            for (var u3 = p3.inputBuffer.getChannelData(l3), v3 = g2.sa, x3 = 0; x3 < d3; x3 += 1) {
                              v3[x3 * b2 + l3] = u3[x3];
                            }
                          }
                          Za(f3, d3, e3);
                        }
                        if (a3 == window.h.I.ya || a3 == window.h.I.La) {
                          for ($a(f3, d3, e3), l3 = 0; l3 < p3.outputBuffer.numberOfChannels; ++l3) {
                            for (u3 = p3.outputBuffer.getChannelData(l3), v3 = g2.sa, x3 = 0; x3 < d3; x3 += 1) {
                              u3[x3] = v3[x3 * b2 + l3];
                            }
                          }
                        } else {
                          for (l3 = 0; l3 < p3.outputBuffer.numberOfChannels; ++l3) {
                            p3.outputBuffer.getChannelData(l3).fill(0);
                          }
                        }
                      };
                      a3 != window.h.I.capture && a3 != window.h.I.La || navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(p3) {
                        g2.Da = g2.J.createMediaStreamSource(p3);
                        g2.Da.connect(g2.Z);
                        g2.Z.connect(g2.J.destination);
                      }).catch(function(p3) {
                        console.log("Failed to get user media: " + p3);
                      });
                      a3 == window.h.I.ya && g2.Z.connect(g2.J.destination);
                      g2.pb = f3;
                      return window.h.yc(g2);
                    }, 451026: (a3) => window.h.ra(a3).J.sampleRate, 451099: (a3) => {
                      a3 = window.h.ra(a3);
                      void 0 !== a3.Z && (a3.Z.onaudioprocess = function() {
                      }, a3.Z.disconnect(), a3.Z = void 0);
                      void 0 !== a3.Da && (a3.Da.disconnect(), a3.Da = void 0);
                      a3.J.close();
                      a3.J = void 0;
                      a3.pb = void 0;
                    }, 451499: (a3) => {
                      window.h.Cb(a3);
                    }, 451549: (a3) => {
                      a3 = window.h.ra(a3);
                      a3.J.resume();
                      a3.state = window.h.ga.xb;
                    }, 451688: (a3) => {
                      a3 = window.h.ra(a3);
                      a3.J.suspend();
                      a3.state = window.h.ga.stopped;
                    } }, bb = (a3) => {
                      for (; 0 < a3.length; ) {
                        a3.shift()(m2);
                      }
                    }, cb = (a3, b2) => {
                      for (var c3 = 0, d3 = a3.length - 1; 0 <= d3; d3--) {
                        var e3 = a3[d3];
                        "." === e3 ? a3.splice(d3, 1) : ".." === e3 ? (a3.splice(d3, 1), c3++) : c3 && (a3.splice(d3, 1), c3--);
                      }
                      if (b2) {
                        for (; c3; c3--) {
                          a3.unshift("..");
                        }
                      }
                      return a3;
                    }, db = (a3) => {
                      var b2 = "/" === a3.charAt(0), c3 = "/" === a3.substr(-1);
                      (a3 = cb(a3.split("/").filter((d3) => !!d3), !b2).join("/")) || b2 || (a3 = ".");
                      a3 && c3 && (a3 += "/");
                      return (b2 ? "/" : "") + a3;
                    }, eb = (a3) => {
                      var b2 = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a3).slice(1);
                      a3 = b2[0];
                      b2 = b2[1];
                      if (!a3 && !b2) {
                        return ".";
                      }
                      b2 && (b2 = b2.substr(0, b2.length - 1));
                      return a3 + b2;
                    }, fb = (a3) => {
                      if ("/" === a3) {
                        return "/";
                      }
                      a3 = db(a3);
                      a3 = a3.replace(/\/$/, "");
                      var b2 = a3.lastIndexOf("/");
                      return -1 === b2 ? a3 : a3.substr(b2 + 1);
                    }, gb = () => {
                      if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) {
                        return (a3) => crypto.getRandomValues(a3);
                      }
                      xa("initRandomDevice");
                    }, hb = (a3) => (hb = gb())(a3);
                    function ib() {
                      for (var a3 = "", b2 = false, c3 = arguments.length - 1; -1 <= c3 && !b2; c3--) {
                        b2 = 0 <= c3 ? arguments[c3] : "/";
                        if ("string" != typeof b2) {
                          throw new TypeError("Arguments to path.resolve must be strings");
                        }
                        if (!b2) {
                          return "";
                        }
                        a3 = b2 + "/" + a3;
                        b2 = "/" === b2.charAt(0);
                      }
                      a3 = cb(a3.split("/").filter((d3) => !!d3), !b2).join("/");
                      return (b2 ? "/" : "") + a3 || ".";
                    }
                    var jb = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, kb = (a3, b2, c3) => {
                      var d3 = b2 + c3;
                      for (c3 = b2; a3[c3] && !(c3 >= d3); ) {
                        ++c3;
                      }
                      if (16 < c3 - b2 && a3.buffer && jb) {
                        return jb.decode(a3.subarray(b2, c3));
                      }
                      for (d3 = ""; b2 < c3; ) {
                        var e3 = a3[b2++];
                        if (e3 & 128) {
                          var f3 = a3[b2++] & 63;
                          if (192 == (e3 & 224)) {
                            d3 += String.fromCharCode((e3 & 31) << 6 | f3);
                          } else {
                            var g2 = a3[b2++] & 63;
                            e3 = 224 == (e3 & 240) ? (e3 & 15) << 12 | f3 << 6 | g2 : (e3 & 7) << 18 | f3 << 12 | g2 << 6 | a3[b2++] & 63;
                            65536 > e3 ? d3 += String.fromCharCode(e3) : (e3 -= 65536, d3 += String.fromCharCode(55296 | e3 >> 10, 56320 | e3 & 1023));
                          }
                        } else {
                          d3 += String.fromCharCode(e3);
                        }
                      }
                      return d3;
                    }, lb = [], mb = (a3) => {
                      for (var b2 = 0, c3 = 0; c3 < a3.length; ++c3) {
                        var d3 = a3.charCodeAt(c3);
                        127 >= d3 ? b2++ : 2047 >= d3 ? b2 += 2 : 55296 <= d3 && 57343 >= d3 ? (b2 += 4, ++c3) : b2 += 3;
                      }
                      return b2;
                    }, nb = (a3, b2, c3, d3) => {
                      if (!(0 < d3)) {
                        return 0;
                      }
                      var e3 = c3;
                      d3 = c3 + d3 - 1;
                      for (var f3 = 0; f3 < a3.length; ++f3) {
                        var g2 = a3.charCodeAt(f3);
                        if (55296 <= g2 && 57343 >= g2) {
                          var n2 = a3.charCodeAt(++f3);
                          g2 = 65536 + ((g2 & 1023) << 10) | n2 & 1023;
                        }
                        if (127 >= g2) {
                          if (c3 >= d3) {
                            break;
                          }
                          b2[c3++] = g2;
                        } else {
                          if (2047 >= g2) {
                            if (c3 + 1 >= d3) {
                              break;
                            }
                            b2[c3++] = 192 | g2 >> 6;
                          } else {
                            if (65535 >= g2) {
                              if (c3 + 2 >= d3) {
                                break;
                              }
                              b2[c3++] = 224 | g2 >> 12;
                            } else {
                              if (c3 + 3 >= d3) {
                                break;
                              }
                              b2[c3++] = 240 | g2 >> 18;
                              b2[c3++] = 128 | g2 >> 12 & 63;
                            }
                            b2[c3++] = 128 | g2 >> 6 & 63;
                          }
                          b2[c3++] = 128 | g2 & 63;
                        }
                      }
                      b2[c3] = 0;
                      return c3 - e3;
                    };
                    function ob(a3, b2) {
                      var c3 = Array(mb(a3) + 1);
                      a3 = nb(a3, c3, 0, c3.length);
                      b2 && (c3.length = a3);
                      return c3;
                    }
                    var pb = [];
                    function qb(a3, b2) {
                      pb[a3] = { input: [], F: [], V: b2 };
                      rb(a3, sb);
                    }
                    var sb = { open: function(a3) {
                      var b2 = pb[a3.node.za];
                      if (!b2) {
                        throw new O2(43);
                      }
                      a3.s = b2;
                      a3.seekable = false;
                    }, close: function(a3) {
                      a3.s.V.qa(a3.s);
                    }, qa: function(a3) {
                      a3.s.V.qa(a3.s);
                    }, read: function(a3, b2, c3, d3) {
                      if (!a3.s || !a3.s.V.ib) {
                        throw new O2(60);
                      }
                      for (var e3 = 0, f3 = 0; f3 < d3; f3++) {
                        try {
                          var g2 = a3.s.V.ib(a3.s);
                        } catch (n2) {
                          throw new O2(29);
                        }
                        if (void 0 === g2 && 0 === e3) {
                          throw new O2(6);
                        }
                        if (null === g2 || void 0 === g2) {
                          break;
                        }
                        e3++;
                        b2[c3 + f3] = g2;
                      }
                      e3 && (a3.node.timestamp = Date.now());
                      return e3;
                    }, write: function(a3, b2, c3, d3) {
                      if (!a3.s || !a3.s.V.Oa) {
                        throw new O2(60);
                      }
                      try {
                        for (var e3 = 0; e3 < d3; e3++) {
                          a3.s.V.Oa(a3.s, b2[c3 + e3]);
                        }
                      } catch (f3) {
                        throw new O2(29);
                      }
                      d3 && (a3.node.timestamp = Date.now());
                      return e3;
                    } }, tb = { ib: function() {
                      a: {
                        if (!lb.length) {
                          var a3 = null;
                          "undefined" != typeof window && "function" == typeof window.prompt ? (a3 = window.prompt("Input: "), null !== a3 && (a3 += "\n")) : "function" == typeof readline && (a3 = readline(), null !== a3 && (a3 += "\n"));
                          if (!a3) {
                            a3 = null;
                            break a;
                          }
                          lb = ob(a3, true);
                        }
                        a3 = lb.shift();
                      }
                      return a3;
                    }, Oa: function(a3, b2) {
                      null === b2 || 10 === b2 ? (ua(kb(a3.F, 0)), a3.F = []) : 0 != b2 && a3.F.push(b2);
                    }, qa: function(a3) {
                      a3.F && 0 < a3.F.length && (ua(kb(a3.F, 0)), a3.F = []);
                    }, bc: function() {
                      return { Fc: 25856, Hc: 5, Ec: 191, Gc: 35387, Dc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
                    }, cc: function() {
                      return 0;
                    }, dc: function() {
                      return [24, 80];
                    } }, ub = { Oa: function(a3, b2) {
                      null === b2 || 10 === b2 ? (va(kb(a3.F, 0)), a3.F = []) : 0 != b2 && a3.F.push(b2);
                    }, qa: function(a3) {
                      a3.F && 0 < a3.F.length && (va(kb(a3.F, 0)), a3.F = []);
                    } };
                    function vb(a3, b2) {
                      var c3 = a3.j ? a3.j.length : 0;
                      c3 >= b2 || (b2 = Math.max(b2, c3 * (1048576 > c3 ? 2 : 1.125) >>> 0), 0 != c3 && (b2 = Math.max(b2, 256)), c3 = a3.j, a3.j = new Uint8Array(b2), 0 < a3.v && a3.j.set(c3.subarray(0, a3.v), 0));
                    }
                    var P2 = { O: null, U() {
                      return P2.createNode(null, "/", 16895, 0);
                    }, createNode(a3, b2, c3, d3) {
                      if (24576 === (c3 & 61440) || 4096 === (c3 & 61440)) {
                        throw new O2(63);
                      }
                      P2.O || (P2.O = { dir: { node: { Y: P2.l.Y, P: P2.l.P, ka: P2.l.ka, va: P2.l.va, ub: P2.l.ub, Ab: P2.l.Ab, vb: P2.l.vb, sb: P2.l.sb, Ea: P2.l.Ea }, stream: { ba: P2.m.ba } }, file: { node: { Y: P2.l.Y, P: P2.l.P }, stream: { ba: P2.m.ba, read: P2.m.read, write: P2.m.write, pa: P2.m.pa, lb: P2.m.lb, nb: P2.m.nb } }, link: { node: { Y: P2.l.Y, P: P2.l.P, ma: P2.l.ma }, stream: {} }, $a: { node: { Y: P2.l.Y, P: P2.l.P }, stream: wb } });
                      c3 = xb(a3, b2, c3, d3);
                      16384 === (c3.mode & 61440) ? (c3.l = P2.O.dir.node, c3.m = P2.O.dir.stream, c3.j = {}) : 32768 === (c3.mode & 61440) ? (c3.l = P2.O.file.node, c3.m = P2.O.file.stream, c3.v = 0, c3.j = null) : 40960 === (c3.mode & 61440) ? (c3.l = P2.O.link.node, c3.m = P2.O.link.stream) : 8192 === (c3.mode & 61440) && (c3.l = P2.O.$a.node, c3.m = P2.O.$a.stream);
                      c3.timestamp = Date.now();
                      a3 && (a3.j[b2] = c3, a3.timestamp = c3.timestamp);
                      return c3;
                    }, Kc(a3) {
                      return a3.j ? a3.j.subarray ? a3.j.subarray(0, a3.v) : new Uint8Array(a3.j) : new Uint8Array(0);
                    }, l: { Y(a3) {
                      var b2 = {};
                      b2.Jc = 8192 === (a3.mode & 61440) ? a3.id : 1;
                      b2.Mc = a3.id;
                      b2.mode = a3.mode;
                      b2.Oc = 1;
                      b2.uid = 0;
                      b2.Lc = 0;
                      b2.za = a3.za;
                      16384 === (a3.mode & 61440) ? b2.size = 4096 : 32768 === (a3.mode & 61440) ? b2.size = a3.v : 40960 === (a3.mode & 61440) ? b2.size = a3.link.length : b2.size = 0;
                      b2.Bc = new Date(a3.timestamp);
                      b2.Nc = new Date(a3.timestamp);
                      b2.Ic = new Date(a3.timestamp);
                      b2.Jb = 4096;
                      b2.Cc = Math.ceil(b2.size / b2.Jb);
                      return b2;
                    }, P(a3, b2) {
                      void 0 !== b2.mode && (a3.mode = b2.mode);
                      void 0 !== b2.timestamp && (a3.timestamp = b2.timestamp);
                      if (void 0 !== b2.size && (b2 = b2.size, a3.v != b2)) {
                        if (0 == b2) {
                          a3.j = null, a3.v = 0;
                        } else {
                          var c3 = a3.j;
                          a3.j = new Uint8Array(b2);
                          c3 && a3.j.set(c3.subarray(0, Math.min(b2, a3.v)));
                          a3.v = b2;
                        }
                      }
                    }, ka() {
                      throw yb[44];
                    }, va(a3, b2, c3, d3) {
                      return P2.createNode(a3, b2, c3, d3);
                    }, ub(a3, b2, c3) {
                      if (16384 === (a3.mode & 61440)) {
                        try {
                          var d3 = zb(b2, c3);
                        } catch (f3) {
                        }
                        if (d3) {
                          for (var e3 in d3.j) {
                            throw new O2(55);
                          }
                        }
                      }
                      delete a3.parent.j[a3.name];
                      a3.parent.timestamp = Date.now();
                      a3.name = c3;
                      b2.j[c3] = a3;
                      b2.timestamp = a3.parent.timestamp;
                      a3.parent = b2;
                    }, Ab(a3, b2) {
                      delete a3.j[b2];
                      a3.timestamp = Date.now();
                    }, vb(a3, b2) {
                      var c3 = zb(a3, b2), d3;
                      for (d3 in c3.j) {
                        throw new O2(55);
                      }
                      delete a3.j[b2];
                      a3.timestamp = Date.now();
                    }, sb(a3) {
                      var b2 = [".", ".."], c3;
                      for (c3 in a3.j) {
                        a3.j.hasOwnProperty(c3) && b2.push(c3);
                      }
                      return b2;
                    }, Ea(a3, b2, c3) {
                      a3 = P2.createNode(a3, b2, 41471, 0);
                      a3.link = c3;
                      return a3;
                    }, ma(a3) {
                      if (40960 !== (a3.mode & 61440)) {
                        throw new O2(28);
                      }
                      return a3.link;
                    } }, m: { read(a3, b2, c3, d3, e3) {
                      var f3 = a3.node.j;
                      if (e3 >= a3.node.v) {
                        return 0;
                      }
                      a3 = Math.min(a3.node.v - e3, d3);
                      if (8 < a3 && f3.subarray) {
                        b2.set(f3.subarray(e3, e3 + a3), c3);
                      } else {
                        for (d3 = 0; d3 < a3; d3++) {
                          b2[c3 + d3] = f3[e3 + d3];
                        }
                      }
                      return a3;
                    }, write(a3, b2, c3, d3, e3, f3) {
                      b2.buffer === C3.buffer && (f3 = false);
                      if (!d3) {
                        return 0;
                      }
                      a3 = a3.node;
                      a3.timestamp = Date.now();
                      if (b2.subarray && (!a3.j || a3.j.subarray)) {
                        if (f3) {
                          return a3.j = b2.subarray(c3, c3 + d3), a3.v = d3;
                        }
                        if (0 === a3.v && 0 === e3) {
                          return a3.j = b2.slice(c3, c3 + d3), a3.v = d3;
                        }
                        if (e3 + d3 <= a3.v) {
                          return a3.j.set(b2.subarray(c3, c3 + d3), e3), d3;
                        }
                      }
                      vb(a3, e3 + d3);
                      if (a3.j.subarray && b2.subarray) {
                        a3.j.set(b2.subarray(c3, c3 + d3), e3);
                      } else {
                        for (f3 = 0; f3 < d3; f3++) {
                          a3.j[e3 + f3] = b2[c3 + f3];
                        }
                      }
                      a3.v = Math.max(a3.v, e3 + d3);
                      return d3;
                    }, ba(a3, b2, c3) {
                      1 === c3 ? b2 += a3.position : 2 === c3 && 32768 === (a3.node.mode & 61440) && (b2 += a3.node.v);
                      if (0 > b2) {
                        throw new O2(28);
                      }
                      return b2;
                    }, pa(a3, b2, c3) {
                      vb(a3.node, b2 + c3);
                      a3.node.v = Math.max(a3.node.v, b2 + c3);
                    }, lb(a3, b2, c3, d3, e3) {
                      if (32768 !== (a3.node.mode & 61440)) {
                        throw new O2(43);
                      }
                      a3 = a3.node.j;
                      if (e3 & 2 || a3.buffer !== C3.buffer) {
                        if (0 < c3 || c3 + b2 < a3.length) {
                          a3.subarray ? a3 = a3.subarray(c3, c3 + b2) : a3 = Array.prototype.slice.call(a3, c3, c3 + b2);
                        }
                        c3 = true;
                        xa();
                        b2 = void 0;
                        if (!b2) {
                          throw new O2(48);
                        }
                        C3.set(a3, b2);
                      } else {
                        c3 = false, b2 = a3.byteOffset;
                      }
                      return { o: b2, M: c3 };
                    }, nb(a3, b2, c3, d3) {
                      P2.m.write(a3, b2, 0, d3, c3, false);
                      return 0;
                    } } };
                    function Ab(a3, b2) {
                      var c3 = 0;
                      a3 && (c3 |= 365);
                      b2 && (c3 |= 146);
                      return c3;
                    }
                    var Bb = null, Cb = {}, Db = [], Eb = 1, Fb = null, Gb = true, O2 = null, yb = {}, Ib = (a3, b2 = {}) => {
                      a3 = ib(a3);
                      if (!a3) {
                        return { path: "", node: null };
                      }
                      b2 = Object.assign({ gb: true, Qa: 0 }, b2);
                      if (8 < b2.Qa) {
                        throw new O2(32);
                      }
                      a3 = a3.split("/").filter((g2) => !!g2);
                      for (var c3 = Bb, d3 = "/", e3 = 0; e3 < a3.length; e3++) {
                        var f3 = e3 === a3.length - 1;
                        if (f3 && b2.parent) {
                          break;
                        }
                        c3 = zb(c3, a3[e3]);
                        d3 = db(d3 + "/" + a3[e3]);
                        c3.wa && (!f3 || f3 && b2.gb) && (c3 = c3.wa.root);
                        if (!f3 || b2.fb) {
                          for (f3 = 0; 40960 === (c3.mode & 61440); ) {
                            if (c3 = Hb(d3), d3 = ib(eb(d3), c3), c3 = Ib(d3, { Qa: b2.Qa + 1 }).node, 40 < f3++) {
                              throw new O2(32);
                            }
                          }
                        }
                      }
                      return { path: d3, node: c3 };
                    }, Jb = (a3) => {
                      for (var b2; ; ) {
                        if (a3 === a3.parent) {
                          return a3 = a3.U.mb, b2 ? "/" !== a3[a3.length - 1] ? `${a3}/${b2}` : a3 + b2 : a3;
                        }
                        b2 = b2 ? `${a3.name}/${b2}` : a3.name;
                        a3 = a3.parent;
                      }
                    }, Kb = (a3, b2) => {
                      for (var c3 = 0, d3 = 0; d3 < b2.length; d3++) {
                        c3 = (c3 << 5) - c3 + b2.charCodeAt(d3) | 0;
                      }
                      return (a3 + c3 >>> 0) % Fb.length;
                    }, zb = (a3, b2) => {
                      var c3;
                      if (c3 = (c3 = Lb(a3, "x")) ? c3 : a3.l.ka ? 0 : 2) {
                        throw new O2(c3, a3);
                      }
                      for (c3 = Fb[Kb(a3.id, b2)]; c3; c3 = c3.lc) {
                        var d3 = c3.name;
                        if (c3.parent.id === a3.id && d3 === b2) {
                          return c3;
                        }
                      }
                      return a3.l.ka(a3, b2);
                    }, xb = (a3, b2, c3, d3) => {
                      a3 = new Mb(a3, b2, c3, d3);
                      b2 = Kb(a3.parent.id, a3.name);
                      a3.lc = Fb[b2];
                      return Fb[b2] = a3;
                    }, Nb = (a3) => {
                      var b2 = ["r", "w", "rw"][a3 & 3];
                      a3 & 512 && (b2 += "w");
                      return b2;
                    }, Lb = (a3, b2) => {
                      if (Gb) {
                        return 0;
                      }
                      if (!b2.includes("r") || a3.mode & 292) {
                        if (b2.includes("w") && !(a3.mode & 146) || b2.includes("x") && !(a3.mode & 73)) {
                          return 2;
                        }
                      } else {
                        return 2;
                      }
                      return 0;
                    }, Ob = (a3, b2) => {
                      try {
                        return zb(a3, b2), 20;
                      } catch (c3) {
                      }
                      return Lb(a3, "wx");
                    }, Pb = () => {
                      for (var a3 = 0; 4096 >= a3; a3++) {
                        if (!Db[a3]) {
                          return a3;
                        }
                      }
                      throw new O2(33);
                    }, Qb = (a3) => {
                      a3 = Db[a3];
                      if (!a3) {
                        throw new O2(8);
                      }
                      return a3;
                    }, Sb = (a3, b2 = -1) => {
                      Rb || (Rb = function() {
                        this.h = {};
                      }, Rb.prototype = {}, Object.defineProperties(Rb.prototype, { object: { get() {
                        return this.node;
                      }, set(c3) {
                        this.node = c3;
                      } }, flags: { get() {
                        return this.h.flags;
                      }, set(c3) {
                        this.h.flags = c3;
                      } }, position: { get() {
                        return this.h.position;
                      }, set(c3) {
                        this.h.position = c3;
                      } } }));
                      a3 = Object.assign(new Rb(), a3);
                      -1 == b2 && (b2 = Pb());
                      a3.X = b2;
                      return Db[b2] = a3;
                    }, wb = { open: (a3) => {
                      a3.m = Cb[a3.node.za].m;
                      a3.m.open && a3.m.open(a3);
                    }, ba: () => {
                      throw new O2(70);
                    } }, rb = (a3, b2) => {
                      Cb[a3] = { m: b2 };
                    }, Tb = (a3, b2) => {
                      var c3 = "/" === b2, d3 = !b2;
                      if (c3 && Bb) {
                        throw new O2(10);
                      }
                      if (!c3 && !d3) {
                        var e3 = Ib(b2, { gb: false });
                        b2 = e3.path;
                        e3 = e3.node;
                        if (e3.wa) {
                          throw new O2(10);
                        }
                        if (16384 !== (e3.mode & 61440)) {
                          throw new O2(54);
                        }
                      }
                      b2 = { type: a3, Qc: {}, mb: b2, kc: [] };
                      a3 = a3.U(b2);
                      a3.U = b2;
                      b2.root = a3;
                      c3 ? Bb = a3 : e3 && (e3.wa = b2, e3.U && e3.U.kc.push(b2));
                    }, S2 = (a3, b2, c3) => {
                      var d3 = Ib(a3, { parent: true }).node;
                      a3 = fb(a3);
                      if (!a3 || "." === a3 || ".." === a3) {
                        throw new O2(28);
                      }
                      var e3 = Ob(d3, a3);
                      if (e3) {
                        throw new O2(e3);
                      }
                      if (!d3.l.va) {
                        throw new O2(63);
                      }
                      return d3.l.va(d3, a3, b2, c3);
                    }, Ub = (a3, b2, c3) => {
                      "undefined" == typeof c3 && (c3 = b2, b2 = 438);
                      S2(a3, b2 | 8192, c3);
                    }, Vb = (a3, b2) => {
                      if (!ib(a3)) {
                        throw new O2(44);
                      }
                      var c3 = Ib(b2, { parent: true }).node;
                      if (!c3) {
                        throw new O2(44);
                      }
                      b2 = fb(b2);
                      var d3 = Ob(c3, b2);
                      if (d3) {
                        throw new O2(d3);
                      }
                      if (!c3.l.Ea) {
                        throw new O2(63);
                      }
                      c3.l.Ea(c3, b2, a3);
                    }, Hb = (a3) => {
                      a3 = Ib(a3).node;
                      if (!a3) {
                        throw new O2(44);
                      }
                      if (!a3.l.ma) {
                        throw new O2(28);
                      }
                      return ib(Jb(a3.parent), a3.l.ma(a3));
                    }, bc = (a3, b2, c3) => {
                      if ("" === a3) {
                        throw new O2(44);
                      }
                      if ("string" == typeof b2) {
                        var d3 = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b2];
                        if ("undefined" == typeof d3) {
                          throw Error(`Unknown file open mode: ${b2}`);
                        }
                        b2 = d3;
                      }
                      c3 = b2 & 64 ? ("undefined" == typeof c3 ? 438 : c3) & 4095 | 32768 : 0;
                      if ("object" == typeof a3) {
                        var e3 = a3;
                      } else {
                        a3 = db(a3);
                        try {
                          e3 = Ib(a3, { fb: !(b2 & 131072) }).node;
                        } catch (f3) {
                        }
                      }
                      d3 = false;
                      if (b2 & 64) {
                        if (e3) {
                          if (b2 & 128) {
                            throw new O2(20);
                          }
                        } else {
                          e3 = S2(a3, c3, 0), d3 = true;
                        }
                      }
                      if (!e3) {
                        throw new O2(44);
                      }
                      8192 === (e3.mode & 61440) && (b2 &= -513);
                      if (b2 & 65536 && 16384 !== (e3.mode & 61440)) {
                        throw new O2(54);
                      }
                      if (!d3 && (c3 = e3 ? 40960 === (e3.mode & 61440) ? 32 : 16384 === (e3.mode & 61440) && ("r" !== Nb(b2) || b2 & 512) ? 31 : Lb(e3, Nb(b2)) : 44)) {
                        throw new O2(c3);
                      }
                      if (b2 & 512 && !d3) {
                        c3 = e3;
                        c3 = "string" == typeof c3 ? Ib(c3, { fb: true }).node : c3;
                        if (!c3.l.P) {
                          throw new O2(63);
                        }
                        if (16384 === (c3.mode & 61440)) {
                          throw new O2(31);
                        }
                        if (32768 !== (c3.mode & 61440)) {
                          throw new O2(28);
                        }
                        if (d3 = Lb(c3, "w")) {
                          throw new O2(d3);
                        }
                        c3.l.P(c3, { size: 0, timestamp: Date.now() });
                      }
                      b2 &= -131713;
                      e3 = Sb({ node: e3, path: Jb(e3), flags: b2, seekable: true, position: 0, m: e3.m, zc: [], error: false });
                      e3.m.open && e3.m.open(e3);
                      !m2.logReadFiles || b2 & 1 || (Wb || (Wb = {}), a3 in Wb || (Wb[a3] = 1));
                      return e3;
                    }, cc = (a3, b2, c3) => {
                      if (null === a3.X) {
                        throw new O2(8);
                      }
                      if (!a3.seekable || !a3.m.ba) {
                        throw new O2(70);
                      }
                      if (0 != c3 && 1 != c3 && 2 != c3) {
                        throw new O2(28);
                      }
                      a3.position = a3.m.ba(a3, b2, c3);
                      a3.zc = [];
                    }, dc = () => {
                      O2 || (O2 = function(a3, b2) {
                        this.name = "ErrnoError";
                        this.node = b2;
                        this.pc = function(c3) {
                          this.aa = c3;
                        };
                        this.pc(a3);
                        this.message = "FS error";
                      }, O2.prototype = Error(), O2.prototype.constructor = O2, [44].forEach((a3) => {
                        yb[a3] = new O2(a3);
                        yb[a3].stack = "<generic error, no stack>";
                      }));
                    }, ec, gc = (a3, b2, c3) => {
                      a3 = db("/dev/" + a3);
                      var d3 = Ab(!!b2, !!c3);
                      fc || (fc = 64);
                      var e3 = fc++ << 8 | 0;
                      rb(e3, { open: (f3) => {
                        f3.seekable = false;
                      }, close: () => {
                        c3 && c3.buffer && c3.buffer.length && c3(10);
                      }, read: (f3, g2, n2, p3) => {
                        for (var l3 = 0, u3 = 0; u3 < p3; u3++) {
                          try {
                            var v3 = b2();
                          } catch (x3) {
                            throw new O2(29);
                          }
                          if (void 0 === v3 && 0 === l3) {
                            throw new O2(6);
                          }
                          if (null === v3 || void 0 === v3) {
                            break;
                          }
                          l3++;
                          g2[n2 + u3] = v3;
                        }
                        l3 && (f3.node.timestamp = Date.now());
                        return l3;
                      }, write: (f3, g2, n2, p3) => {
                        for (var l3 = 0; l3 < p3; l3++) {
                          try {
                            c3(g2[n2 + l3]);
                          } catch (u3) {
                            throw new O2(29);
                          }
                        }
                        p3 && (f3.node.timestamp = Date.now());
                        return l3;
                      } });
                      Ub(a3, d3, e3);
                    }, fc, hc = {}, Rb, Wb, ic = void 0;
                    function jc() {
                      ic += 4;
                      return L2[ic - 4 >> 2];
                    }
                    function kc(a3) {
                      if (void 0 === a3) {
                        return "_unknown";
                      }
                      a3 = a3.replace(/[^a-zA-Z0-9_]/g, "$");
                      var b2 = a3.charCodeAt(0);
                      return 48 <= b2 && 57 >= b2 ? `_${a3}` : a3;
                    }
                    function lc(a3, b2) {
                      a3 = kc(a3);
                      return { [a3]: function() {
                        return b2.apply(this, arguments);
                      } }[a3];
                    }
                    function mc() {
                      this.M = [void 0];
                      this.hb = [];
                    }
                    var U = new mc(), nc = void 0;
                    function V2(a3) {
                      throw new nc(a3);
                    }
                    var oc = (a3) => {
                      a3 || V2("Cannot use deleted val. handle = " + a3);
                      return U.get(a3).value;
                    }, pc = (a3) => {
                      switch (a3) {
                        case void 0:
                          return 1;
                        case null:
                          return 2;
                        case true:
                          return 3;
                        case false:
                          return 4;
                        default:
                          return U.pa({ tb: 1, value: a3 });
                      }
                    };
                    function qc(a3) {
                      var b2 = Error, c3 = lc(a3, function(d3) {
                        this.name = a3;
                        this.message = d3;
                        d3 = Error(d3).stack;
                        void 0 !== d3 && (this.stack = this.toString() + "\n" + d3.replace(/^Error(:[^\n]*)?\n/, ""));
                      });
                      c3.prototype = Object.create(b2.prototype);
                      c3.prototype.constructor = c3;
                      c3.prototype.toString = function() {
                        return void 0 === this.message ? this.name : `${this.name}: ${this.message}`;
                      };
                      return c3;
                    }
                    var rc = void 0, sc = void 0;
                    function W(a3) {
                      for (var b2 = ""; E[a3]; ) {
                        b2 += sc[E[a3++]];
                      }
                      return b2;
                    }
                    var tc = [];
                    function uc() {
                      for (; tc.length; ) {
                        var a3 = tc.pop();
                        a3.g.fa = false;
                        a3["delete"]();
                      }
                    }
                    var vc = void 0, wc = {};
                    function xc(a3, b2) {
                      for (void 0 === b2 && V2("ptr should not be undefined"); a3.A; ) {
                        b2 = a3.na(b2), a3 = a3.A;
                      }
                      return b2;
                    }
                    var yc = {};
                    function zc(a3) {
                      a3 = Ac(a3);
                      var b2 = W(a3);
                      Bc(a3);
                      return b2;
                    }
                    function Cc(a3, b2) {
                      var c3 = yc[a3];
                      void 0 === c3 && V2(b2 + " has unknown type " + zc(a3));
                      return c3;
                    }
                    function Dc() {
                    }
                    var Ec = false;
                    function Fc(a3) {
                      --a3.count.value;
                      0 === a3.count.value && (a3.G ? a3.L.W(a3.G) : a3.u.i.W(a3.o));
                    }
                    function Gc(a3, b2, c3) {
                      if (b2 === c3) {
                        return a3;
                      }
                      if (void 0 === c3.A) {
                        return null;
                      }
                      a3 = Gc(a3, b2, c3.A);
                      return null === a3 ? null : c3.Pb(a3);
                    }
                    var Hc = {};
                    function Ic(a3, b2) {
                      b2 = xc(a3, b2);
                      return wc[b2];
                    }
                    var Jc = void 0;
                    function Kc(a3) {
                      throw new Jc(a3);
                    }
                    function Lc(a3, b2) {
                      b2.u && b2.o || Kc("makeClassHandle requires ptr and ptrType");
                      !!b2.L !== !!b2.G && Kc("Both smartPtrType and smartPtr must be specified");
                      b2.count = { value: 1 };
                      return Mc(Object.create(a3, { g: { value: b2 } }));
                    }
                    function Mc(a3) {
                      if ("undefined" === typeof FinalizationRegistry) {
                        return Mc = (b2) => b2, a3;
                      }
                      Ec = new FinalizationRegistry((b2) => {
                        Fc(b2.g);
                      });
                      Mc = (b2) => {
                        var c3 = b2.g;
                        c3.G && Ec.register(b2, { g: c3 }, b2);
                        return b2;
                      };
                      Dc = (b2) => {
                        Ec.unregister(b2);
                      };
                      return Mc(a3);
                    }
                    var Nc = {};
                    function Oc(a3) {
                      for (; a3.length; ) {
                        var b2 = a3.pop();
                        a3.pop()(b2);
                      }
                    }
                    function Pc(a3) {
                      return this.fromWireType(L2[a3 >> 2]);
                    }
                    var Qc = {}, Rc = {};
                    function Y(a3, b2, c3) {
                      function d3(n2) {
                        n2 = c3(n2);
                        n2.length !== a3.length && Kc("Mismatched type converter count");
                        for (var p3 = 0; p3 < a3.length; ++p3) {
                          Sc(a3[p3], n2[p3]);
                        }
                      }
                      a3.forEach(function(n2) {
                        Rc[n2] = b2;
                      });
                      var e3 = Array(b2.length), f3 = [], g2 = 0;
                      b2.forEach((n2, p3) => {
                        yc.hasOwnProperty(n2) ? e3[p3] = yc[n2] : (f3.push(n2), Qc.hasOwnProperty(n2) || (Qc[n2] = []), Qc[n2].push(() => {
                          e3[p3] = yc[n2];
                          ++g2;
                          g2 === f3.length && d3(e3);
                        }));
                      });
                      0 === f3.length && d3(e3);
                    }
                    function Tc(a3) {
                      switch (a3) {
                        case 1:
                          return 0;
                        case 2:
                          return 1;
                        case 4:
                          return 2;
                        case 8:
                          return 3;
                        default:
                          throw new TypeError(`Unknown type size: ${a3}`);
                      }
                    }
                    function Uc(a3, b2, c3 = {}) {
                      var d3 = b2.name;
                      a3 || V2(`type "${d3}" must have a positive integer typeid pointer`);
                      if (yc.hasOwnProperty(a3)) {
                        if (c3.$b) {
                          return;
                        }
                        V2(`Cannot register type '${d3}' twice`);
                      }
                      yc[a3] = b2;
                      delete Rc[a3];
                      Qc.hasOwnProperty(a3) && (b2 = Qc[a3], delete Qc[a3], b2.forEach((e3) => e3()));
                    }
                    function Sc(a3, b2, c3 = {}) {
                      if (!("argPackAdvance" in b2)) {
                        throw new TypeError("registerType registeredInstance requires argPackAdvance");
                      }
                      Uc(a3, b2, c3);
                    }
                    function Vc(a3) {
                      V2(a3.g.u.i.name + " instance already deleted");
                    }
                    function Wc() {
                    }
                    function Xc(a3, b2, c3) {
                      if (void 0 === a3[b2].B) {
                        var d3 = a3[b2];
                        a3[b2] = function() {
                          a3[b2].B.hasOwnProperty(arguments.length) || V2(`Function '${c3}' called with an invalid number of arguments (${arguments.length}) - expects one of (${a3[b2].B})!`);
                          return a3[b2].B[arguments.length].apply(this, arguments);
                        };
                        a3[b2].B = [];
                        a3[b2].B[d3.ea] = d3;
                      }
                    }
                    function Yc(a3, b2, c3) {
                      m2.hasOwnProperty(a3) ? ((void 0 === c3 || void 0 !== m2[a3].B && void 0 !== m2[a3].B[c3]) && V2(`Cannot register public name '${a3}' twice`), Xc(m2, a3, a3), m2.hasOwnProperty(c3) && V2(`Cannot register multiple overloads of a function with the same number of arguments (${c3})!`), m2[a3].B[c3] = b2) : (m2[a3] = b2, void 0 !== c3 && (m2[a3].Pc = c3));
                    }
                    function Zc(a3, b2, c3, d3, e3, f3, g2, n2) {
                      this.name = a3;
                      this.constructor = b2;
                      this.N = c3;
                      this.W = d3;
                      this.A = e3;
                      this.Ub = f3;
                      this.na = g2;
                      this.Pb = n2;
                      this.qb = [];
                    }
                    function $c(a3, b2, c3) {
                      for (; b2 !== c3; ) {
                        b2.na || V2(`Expected null or instance of ${c3.name}, got an instance of ${b2.name}`), a3 = b2.na(a3), b2 = b2.A;
                      }
                      return a3;
                    }
                    function ad(a3, b2) {
                      if (null === b2) {
                        return this.Na && V2(`null is not a valid ${this.name}`), 0;
                      }
                      b2.g || V2(`Cannot pass "${bd(b2)}" as a ${this.name}`);
                      b2.g.o || V2(`Cannot pass deleted object as a pointer of type ${this.name}`);
                      return $c(b2.g.o, b2.g.u.i, this.i);
                    }
                    function cd(a3, b2) {
                      if (null === b2) {
                        this.Na && V2(`null is not a valid ${this.name}`);
                        if (this.ua) {
                          var c3 = this.Pa();
                          null !== a3 && a3.push(this.W, c3);
                          return c3;
                        }
                        return 0;
                      }
                      b2.g || V2(`Cannot pass "${bd(b2)}" as a ${this.name}`);
                      b2.g.o || V2(`Cannot pass deleted object as a pointer of type ${this.name}`);
                      !this.ta && b2.g.u.ta && V2(`Cannot convert argument of type ${b2.g.L ? b2.g.L.name : b2.g.u.name} to parameter type ${this.name}`);
                      c3 = $c(b2.g.o, b2.g.u.i, this.i);
                      if (this.ua) {
                        switch (void 0 === b2.g.G && V2("Passing raw pointer to smart pointer is illegal"), this.tc) {
                          case 0:
                            b2.g.L === this ? c3 = b2.g.G : V2(`Cannot convert argument of type ${b2.g.L ? b2.g.L.name : b2.g.u.name} to parameter type ${this.name}`);
                            break;
                          case 1:
                            c3 = b2.g.G;
                            break;
                          case 2:
                            if (b2.g.L === this) {
                              c3 = b2.g.G;
                            } else {
                              var d3 = b2.clone();
                              c3 = this.oc(c3, pc(function() {
                                d3["delete"]();
                              }));
                              null !== a3 && a3.push(this.W, c3);
                            }
                            break;
                          default:
                            V2("Unsupporting sharing policy");
                        }
                      }
                      return c3;
                    }
                    function dd(a3, b2) {
                      if (null === b2) {
                        return this.Na && V2(`null is not a valid ${this.name}`), 0;
                      }
                      b2.g || V2(`Cannot pass "${bd(b2)}" as a ${this.name}`);
                      b2.g.o || V2(`Cannot pass deleted object as a pointer of type ${this.name}`);
                      b2.g.u.ta && V2(`Cannot convert argument of type ${b2.g.u.name} to parameter type ${this.name}`);
                      return $c(b2.g.o, b2.g.u.i, this.i);
                    }
                    function ed(a3, b2, c3, d3) {
                      this.name = a3;
                      this.i = b2;
                      this.Na = c3;
                      this.ta = d3;
                      this.ua = false;
                      this.W = this.oc = this.Pa = this.rb = this.tc = this.nc = void 0;
                      void 0 !== b2.A ? this.toWireType = cd : (this.toWireType = d3 ? ad : dd, this.K = null);
                    }
                    function fd(a3, b2, c3) {
                      m2.hasOwnProperty(a3) || Kc("Replacing nonexistant public symbol");
                      void 0 !== m2[a3].B && void 0 !== c3 ? m2[a3].B[c3] = b2 : (m2[a3] = b2, m2[a3].ea = c3);
                    }
                    var gd = [], hd = (a3) => {
                      var b2 = gd[a3];
                      b2 || (a3 >= gd.length && (gd.length = a3 + 1), gd[a3] = b2 = Ia.get(a3));
                      return b2;
                    }, jd = (a3, b2) => {
                      var c3 = [];
                      return function() {
                        c3.length = 0;
                        Object.assign(c3, arguments);
                        if (a3.includes("j")) {
                          var d3 = m2["dynCall_" + a3];
                          d3 = c3 && c3.length ? d3.apply(null, [b2].concat(c3)) : d3.call(null, b2);
                        } else {
                          d3 = hd(b2).apply(null, c3);
                        }
                        return d3;
                      };
                    };
                    function Z(a3, b2) {
                      a3 = W(a3);
                      var c3 = a3.includes("j") ? jd(a3, b2) : hd(b2);
                      "function" != typeof c3 && V2(`unknown function pointer with signature ${a3}: ${b2}`);
                      return c3;
                    }
                    var kd = void 0;
                    function ld(a3, b2) {
                      function c3(f3) {
                        e3[f3] || yc[f3] || (Rc[f3] ? Rc[f3].forEach(c3) : (d3.push(f3), e3[f3] = true));
                      }
                      var d3 = [], e3 = {};
                      b2.forEach(c3);
                      throw new kd(`${a3}: ` + d3.map(zc).join([", "]));
                    }
                    function od(a3, b2, c3, d3, e3) {
                      var f3 = b2.length;
                      2 > f3 && V2("argTypes array size mismatch! Must at least get return value and 'this' types!");
                      var g2 = null !== b2[1] && null !== c3, n2 = false;
                      for (c3 = 1; c3 < b2.length; ++c3) {
                        if (null !== b2[c3] && void 0 === b2[c3].K) {
                          n2 = true;
                          break;
                        }
                      }
                      var p3 = "void" !== b2[0].name, l3 = f3 - 2, u3 = Array(l3), v3 = [], x3 = [];
                      return function() {
                        arguments.length !== l3 && V2(`function ${a3} called with ${arguments.length} arguments, expected ${l3} args!`);
                        x3.length = 0;
                        v3.length = g2 ? 2 : 1;
                        v3[0] = e3;
                        if (g2) {
                          var k3 = b2[1].toWireType(x3, this);
                          v3[1] = k3;
                        }
                        for (var t3 = 0; t3 < l3; ++t3) {
                          u3[t3] = b2[t3 + 2].toWireType(x3, arguments[t3]), v3.push(u3[t3]);
                        }
                        t3 = d3.apply(null, v3);
                        if (n2) {
                          Oc(x3);
                        } else {
                          for (var r3 = g2 ? 1 : 2; r3 < b2.length; r3++) {
                            var B3 = 1 === r3 ? k3 : u3[r3 - 2];
                            null !== b2[r3].K && b2[r3].K(B3);
                          }
                        }
                        k3 = p3 ? b2[0].fromWireType(t3) : void 0;
                        return k3;
                      };
                    }
                    function pd(a3, b2) {
                      for (var c3 = [], d3 = 0; d3 < a3; d3++) {
                        c3.push(N2[b2 + 4 * d3 >> 2]);
                      }
                      return c3;
                    }
                    function qd(a3, b2, c3) {
                      a3 instanceof Object || V2(`${c3} with invalid "this": ${a3}`);
                      a3 instanceof b2.i.constructor || V2(`${c3} incompatible with "this" of type ${a3.constructor.name}`);
                      a3.g.o || V2(`cannot call emscripten binding method ${c3} on deleted object`);
                      return $c(a3.g.o, a3.g.u.i, b2.i);
                    }
                    function rd(a3) {
                      a3 >= U.h && 0 === --U.get(a3).tb && U.Zb(a3);
                    }
                    function sd(a3, b2, c3) {
                      switch (b2) {
                        case 0:
                          return function(d3) {
                            return this.fromWireType((c3 ? C3 : E)[d3]);
                          };
                        case 1:
                          return function(d3) {
                            return this.fromWireType((c3 ? Ba : Ca)[d3 >> 1]);
                          };
                        case 2:
                          return function(d3) {
                            return this.fromWireType((c3 ? L2 : N2)[d3 >> 2]);
                          };
                        default:
                          throw new TypeError("Unknown integer type: " + a3);
                      }
                    }
                    function bd(a3) {
                      if (null === a3) {
                        return "null";
                      }
                      var b2 = typeof a3;
                      return "object" === b2 || "array" === b2 || "function" === b2 ? a3.toString() : "" + a3;
                    }
                    function td(a3, b2) {
                      switch (b2) {
                        case 2:
                          return function(c3) {
                            return this.fromWireType(Da[c3 >> 2]);
                          };
                        case 3:
                          return function(c3) {
                            return this.fromWireType(Ea[c3 >> 3]);
                          };
                        default:
                          throw new TypeError("Unknown float type: " + a3);
                      }
                    }
                    function ud(a3, b2, c3) {
                      switch (b2) {
                        case 0:
                          return c3 ? function(d3) {
                            return C3[d3];
                          } : function(d3) {
                            return E[d3];
                          };
                        case 1:
                          return c3 ? function(d3) {
                            return Ba[d3 >> 1];
                          } : function(d3) {
                            return Ca[d3 >> 1];
                          };
                        case 2:
                          return c3 ? function(d3) {
                            return L2[d3 >> 2];
                          } : function(d3) {
                            return N2[d3 >> 2];
                          };
                        default:
                          throw new TypeError("Unknown integer type: " + a3);
                      }
                    }
                    var vd = "undefined" != typeof TextDecoder ? new TextDecoder("utf-16le") : void 0, wd = (a3, b2) => {
                      var c3 = a3 >> 1;
                      for (var d3 = c3 + b2 / 2; !(c3 >= d3) && Ca[c3]; ) {
                        ++c3;
                      }
                      c3 <<= 1;
                      if (32 < c3 - a3 && vd) {
                        return vd.decode(E.subarray(a3, c3));
                      }
                      c3 = "";
                      for (d3 = 0; !(d3 >= b2 / 2); ++d3) {
                        var e3 = Ba[a3 + 2 * d3 >> 1];
                        if (0 == e3) {
                          break;
                        }
                        c3 += String.fromCharCode(e3);
                      }
                      return c3;
                    }, xd = (a3, b2, c3) => {
                      void 0 === c3 && (c3 = 2147483647);
                      if (2 > c3) {
                        return 0;
                      }
                      c3 -= 2;
                      var d3 = b2;
                      c3 = c3 < 2 * a3.length ? c3 / 2 : a3.length;
                      for (var e3 = 0; e3 < c3; ++e3) {
                        Ba[b2 >> 1] = a3.charCodeAt(e3), b2 += 2;
                      }
                      Ba[b2 >> 1] = 0;
                      return b2 - d3;
                    }, yd = (a3) => 2 * a3.length, zd = (a3, b2) => {
                      for (var c3 = 0, d3 = ""; !(c3 >= b2 / 4); ) {
                        var e3 = L2[a3 + 4 * c3 >> 2];
                        if (0 == e3) {
                          break;
                        }
                        ++c3;
                        65536 <= e3 ? (e3 -= 65536, d3 += String.fromCharCode(55296 | e3 >> 10, 56320 | e3 & 1023)) : d3 += String.fromCharCode(e3);
                      }
                      return d3;
                    }, Ad = (a3, b2, c3) => {
                      void 0 === c3 && (c3 = 2147483647);
                      if (4 > c3) {
                        return 0;
                      }
                      var d3 = b2;
                      c3 = d3 + c3 - 4;
                      for (var e3 = 0; e3 < a3.length; ++e3) {
                        var f3 = a3.charCodeAt(e3);
                        if (55296 <= f3 && 57343 >= f3) {
                          var g2 = a3.charCodeAt(++e3);
                          f3 = 65536 + ((f3 & 1023) << 10) | g2 & 1023;
                        }
                        L2[b2 >> 2] = f3;
                        b2 += 4;
                        if (b2 + 4 > c3) {
                          break;
                        }
                      }
                      L2[b2 >> 2] = 0;
                      return b2 - d3;
                    }, Bd = (a3) => {
                      for (var b2 = 0, c3 = 0; c3 < a3.length; ++c3) {
                        var d3 = a3.charCodeAt(c3);
                        55296 <= d3 && 57343 >= d3 && ++c3;
                        b2 += 4;
                      }
                      return b2;
                    }, Cd = {};
                    function Dd(a3) {
                      var b2 = Cd[a3];
                      return void 0 === b2 ? W(a3) : b2;
                    }
                    var Ed = [];
                    function Fd(a3) {
                      var b2 = Ed.length;
                      Ed.push(a3);
                      return b2;
                    }
                    function Gd(a3, b2) {
                      for (var c3 = Array(a3), d3 = 0; d3 < a3; ++d3) {
                        c3[d3] = Cc(N2[b2 + 4 * d3 >> 2], "parameter " + d3);
                      }
                      return c3;
                    }
                    var Hd = [], Id = [], Jd = {}, Ld = () => {
                      if (!Kd) {
                        var a3 = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: na || "./this.program" }, b2;
                        for (b2 in Jd) {
                          void 0 === Jd[b2] ? delete a3[b2] : a3[b2] = Jd[b2];
                        }
                        var c3 = [];
                        for (b2 in a3) {
                          c3.push(`${b2}=${a3[b2]}`);
                        }
                        Kd = c3;
                      }
                      return Kd;
                    }, Kd, Md = (a3) => 0 === a3 % 4 && (0 !== a3 % 100 || 0 === a3 % 400), Nd = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], Od = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], Pd = (a3, b2, c3, d3) => {
                      function e3(k3, t3, r3) {
                        for (k3 = "number" == typeof k3 ? k3.toString() : k3 || ""; k3.length < t3; ) {
                          k3 = r3[0] + k3;
                        }
                        return k3;
                      }
                      function f3(k3, t3) {
                        return e3(k3, t3, "0");
                      }
                      function g2(k3, t3) {
                        function r3(D2) {
                          return 0 > D2 ? -1 : 0 < D2 ? 1 : 0;
                        }
                        var B3;
                        0 === (B3 = r3(k3.getFullYear() - t3.getFullYear())) && 0 === (B3 = r3(k3.getMonth() - t3.getMonth())) && (B3 = r3(k3.getDate() - t3.getDate()));
                        return B3;
                      }
                      function n2(k3) {
                        switch (k3.getDay()) {
                          case 0:
                            return new Date(k3.getFullYear() - 1, 11, 29);
                          case 1:
                            return k3;
                          case 2:
                            return new Date(k3.getFullYear(), 0, 3);
                          case 3:
                            return new Date(k3.getFullYear(), 0, 2);
                          case 4:
                            return new Date(k3.getFullYear(), 0, 1);
                          case 5:
                            return new Date(k3.getFullYear() - 1, 11, 31);
                          case 6:
                            return new Date(k3.getFullYear() - 1, 11, 30);
                        }
                      }
                      function p3(k3) {
                        var t3 = k3.ca;
                        for (k3 = new Date(new Date(k3.da + 1900, 0, 1).getTime()); 0 < t3; ) {
                          var r3 = k3.getMonth(), B3 = (Md(k3.getFullYear()) ? Nd : Od)[r3];
                          if (t3 > B3 - k3.getDate()) {
                            t3 -= B3 - k3.getDate() + 1, k3.setDate(1), 11 > r3 ? k3.setMonth(r3 + 1) : (k3.setMonth(0), k3.setFullYear(k3.getFullYear() + 1));
                          } else {
                            k3.setDate(k3.getDate() + t3);
                            break;
                          }
                        }
                        r3 = new Date(k3.getFullYear() + 1, 0, 4);
                        t3 = n2(new Date(k3.getFullYear(), 0, 4));
                        r3 = n2(r3);
                        return 0 >= g2(t3, k3) ? 0 >= g2(r3, k3) ? k3.getFullYear() + 1 : k3.getFullYear() : k3.getFullYear() - 1;
                      }
                      var l3 = L2[d3 + 40 >> 2];
                      d3 = { wc: L2[d3 >> 2], vc: L2[d3 + 4 >> 2], Fa: L2[d3 + 8 >> 2], Sa: L2[d3 + 12 >> 2], Ga: L2[d3 + 16 >> 2], da: L2[d3 + 20 >> 2], R: L2[d3 + 24 >> 2], ca: L2[d3 + 28 >> 2], Rc: L2[d3 + 32 >> 2], uc: L2[d3 + 36 >> 2], xc: l3 ? l3 ? kb(E, l3) : "" : "" };
                      c3 = c3 ? kb(E, c3) : "";
                      l3 = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
                      for (var u3 in l3) {
                        c3 = c3.replace(new RegExp(u3, "g"), l3[u3]);
                      }
                      var v3 = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "), x3 = "January February March April May June July August September October November December".split(" ");
                      l3 = { "%a": (k3) => v3[k3.R].substring(0, 3), "%A": (k3) => v3[k3.R], "%b": (k3) => x3[k3.Ga].substring(0, 3), "%B": (k3) => x3[k3.Ga], "%C": (k3) => f3((k3.da + 1900) / 100 | 0, 2), "%d": (k3) => f3(k3.Sa, 2), "%e": (k3) => e3(k3.Sa, 2, " "), "%g": (k3) => p3(k3).toString().substring(2), "%G": (k3) => p3(k3), "%H": (k3) => f3(k3.Fa, 2), "%I": (k3) => {
                        k3 = k3.Fa;
                        0 == k3 ? k3 = 12 : 12 < k3 && (k3 -= 12);
                        return f3(k3, 2);
                      }, "%j": (k3) => {
                        for (var t3 = 0, r3 = 0; r3 <= k3.Ga - 1; t3 += (Md(k3.da + 1900) ? Nd : Od)[r3++]) {
                        }
                        return f3(k3.Sa + t3, 3);
                      }, "%m": (k3) => f3(k3.Ga + 1, 2), "%M": (k3) => f3(k3.vc, 2), "%n": () => "\n", "%p": (k3) => 0 <= k3.Fa && 12 > k3.Fa ? "AM" : "PM", "%S": (k3) => f3(k3.wc, 2), "%t": () => "	", "%u": (k3) => k3.R || 7, "%U": (k3) => f3(Math.floor((k3.ca + 7 - k3.R) / 7), 2), "%V": (k3) => {
                        var t3 = Math.floor((k3.ca + 7 - (k3.R + 6) % 7) / 7);
                        2 >= (k3.R + 371 - k3.ca - 2) % 7 && t3++;
                        if (t3) {
                          53 == t3 && (r3 = (k3.R + 371 - k3.ca) % 7, 4 == r3 || 3 == r3 && Md(k3.da) || (t3 = 1));
                        } else {
                          t3 = 52;
                          var r3 = (k3.R + 7 - k3.ca - 1) % 7;
                          (4 == r3 || 5 == r3 && Md(k3.da % 400 - 1)) && t3++;
                        }
                        return f3(t3, 2);
                      }, "%w": (k3) => k3.R, "%W": (k3) => f3(Math.floor((k3.ca + 7 - (k3.R + 6) % 7) / 7), 2), "%y": (k3) => (k3.da + 1900).toString().substring(2), "%Y": (k3) => k3.da + 1900, "%z": (k3) => {
                        k3 = k3.uc;
                        var t3 = 0 <= k3;
                        k3 = Math.abs(k3) / 60;
                        return (t3 ? "+" : "-") + String("0000" + (k3 / 60 * 100 + k3 % 60)).slice(-4);
                      }, "%Z": (k3) => k3.xc, "%%": () => "%" };
                      c3 = c3.replace(/%%/g, "\0\0");
                      for (u3 in l3) {
                        c3.includes(u3) && (c3 = c3.replace(new RegExp(u3, "g"), l3[u3](d3)));
                      }
                      c3 = c3.replace(/\0\0/g, "%");
                      u3 = ob(c3, false);
                      if (u3.length > b2) {
                        return 0;
                      }
                      C3.set(u3, a3);
                      return u3.length - 1;
                    };
                    function Mb(a3, b2, c3, d3) {
                      a3 || (a3 = this);
                      this.parent = a3;
                      this.U = a3.U;
                      this.wa = null;
                      this.id = Eb++;
                      this.name = b2;
                      this.mode = c3;
                      this.l = {};
                      this.m = {};
                      this.za = d3;
                    }
                    Object.defineProperties(Mb.prototype, { read: { get: function() {
                      return 365 === (this.mode & 365);
                    }, set: function(a3) {
                      a3 ? this.mode |= 365 : this.mode &= -366;
                    } }, write: { get: function() {
                      return 146 === (this.mode & 146);
                    }, set: function(a3) {
                      a3 ? this.mode |= 146 : this.mode &= -147;
                    } } });
                    dc();
                    Fb = Array(4096);
                    Tb(P2, "/");
                    S2("/tmp", 16895, 0);
                    S2("/home", 16895, 0);
                    S2("/home/web_user", 16895, 0);
                    (() => {
                      S2("/dev", 16895, 0);
                      rb(259, { read: () => 0, write: (d3, e3, f3, g2) => g2 });
                      Ub("/dev/null", 259);
                      qb(1280, tb);
                      qb(1536, ub);
                      Ub("/dev/tty", 1280);
                      Ub("/dev/tty1", 1536);
                      var a3 = new Uint8Array(1024), b2 = 0, c3 = () => {
                        0 === b2 && (b2 = hb(a3).byteLength);
                        return a3[--b2];
                      };
                      gc("random", c3);
                      gc("urandom", c3);
                      S2("/dev/shm", 16895, 0);
                      S2("/dev/shm/tmp", 16895, 0);
                    })();
                    (() => {
                      S2("/proc", 16895, 0);
                      var a3 = S2("/proc/self", 16895, 0);
                      S2("/proc/self/fd", 16895, 0);
                      Tb({ U: () => {
                        var b2 = xb(a3, "fd", 16895, 73);
                        b2.l = { ka: (c3, d3) => {
                          var e3 = Qb(+d3);
                          c3 = { parent: null, U: { mb: "fake" }, l: { ma: () => e3.path } };
                          return c3.parent = c3;
                        } };
                        return b2;
                      } }, "/proc/self/fd");
                    })();
                    Object.assign(mc.prototype, { get(a3) {
                      return this.M[a3];
                    }, has(a3) {
                      return void 0 !== this.M[a3];
                    }, pa(a3) {
                      var b2 = this.hb.pop() || this.M.length;
                      this.M[b2] = a3;
                      return b2;
                    }, Zb(a3) {
                      this.M[a3] = void 0;
                      this.hb.push(a3);
                    } });
                    nc = m2.BindingError = class extends Error {
                      constructor(a3) {
                        super(a3);
                        this.name = "BindingError";
                      }
                    };
                    U.M.push({ value: void 0 }, { value: null }, { value: true }, { value: false });
                    U.h = U.M.length;
                    m2.count_emval_handles = function() {
                      for (var a3 = 0, b2 = U.h; b2 < U.M.length; ++b2) {
                        void 0 !== U.M[b2] && ++a3;
                      }
                      return a3;
                    };
                    rc = m2.PureVirtualError = qc("PureVirtualError");
                    for (var Qd = Array(256), Rd = 0; 256 > Rd; ++Rd) {
                      Qd[Rd] = String.fromCharCode(Rd);
                    }
                    sc = Qd;
                    m2.getInheritedInstanceCount = function() {
                      return Object.keys(wc).length;
                    };
                    m2.getLiveInheritedInstances = function() {
                      var a3 = [], b2;
                      for (b2 in wc) {
                        wc.hasOwnProperty(b2) && a3.push(wc[b2]);
                      }
                      return a3;
                    };
                    m2.flushPendingDeletes = uc;
                    m2.setDelayFunction = function(a3) {
                      vc = a3;
                      tc.length && vc && vc(uc);
                    };
                    Jc = m2.InternalError = class extends Error {
                      constructor(a3) {
                        super(a3);
                        this.name = "InternalError";
                      }
                    };
                    Wc.prototype.isAliasOf = function(a3) {
                      if (!(this instanceof Wc && a3 instanceof Wc)) {
                        return false;
                      }
                      var b2 = this.g.u.i, c3 = this.g.o, d3 = a3.g.u.i;
                      for (a3 = a3.g.o; b2.A; ) {
                        c3 = b2.na(c3), b2 = b2.A;
                      }
                      for (; d3.A; ) {
                        a3 = d3.na(a3), d3 = d3.A;
                      }
                      return b2 === d3 && c3 === a3;
                    };
                    Wc.prototype.clone = function() {
                      this.g.o || Vc(this);
                      if (this.g.ia) {
                        return this.g.count.value += 1, this;
                      }
                      var a3 = Mc, b2 = Object, c3 = b2.create, d3 = Object.getPrototypeOf(this), e3 = this.g;
                      a3 = a3(c3.call(b2, d3, { g: { value: { count: e3.count, fa: e3.fa, ia: e3.ia, o: e3.o, u: e3.u, G: e3.G, L: e3.L } } }));
                      a3.g.count.value += 1;
                      a3.g.fa = false;
                      return a3;
                    };
                    Wc.prototype["delete"] = function() {
                      this.g.o || Vc(this);
                      this.g.fa && !this.g.ia && V2("Object already scheduled for deletion");
                      Dc(this);
                      Fc(this.g);
                      this.g.ia || (this.g.G = void 0, this.g.o = void 0);
                    };
                    Wc.prototype.isDeleted = function() {
                      return !this.g.o;
                    };
                    Wc.prototype.deleteLater = function() {
                      this.g.o || Vc(this);
                      this.g.fa && !this.g.ia && V2("Object already scheduled for deletion");
                      tc.push(this);
                      1 === tc.length && vc && vc(uc);
                      this.g.fa = true;
                      return this;
                    };
                    ed.prototype.Vb = function(a3) {
                      this.rb && (a3 = this.rb(a3));
                      return a3;
                    };
                    ed.prototype.ab = function(a3) {
                      this.W && this.W(a3);
                    };
                    ed.prototype.argPackAdvance = 8;
                    ed.prototype.readValueFromPointer = Pc;
                    ed.prototype.deleteObject = function(a3) {
                      if (null !== a3) {
                        a3["delete"]();
                      }
                    };
                    ed.prototype.fromWireType = function(a3) {
                      function b2() {
                        return this.ua ? Lc(this.i.N, { u: this.nc, o: c3, L: this, G: a3 }) : Lc(this.i.N, { u: this, o: a3 });
                      }
                      var c3 = this.Vb(a3);
                      if (!c3) {
                        return this.ab(a3), null;
                      }
                      var d3 = Ic(this.i, c3);
                      if (void 0 !== d3) {
                        if (0 === d3.g.count.value) {
                          return d3.g.o = c3, d3.g.G = a3, d3.clone();
                        }
                        d3 = d3.clone();
                        this.ab(a3);
                        return d3;
                      }
                      d3 = this.i.Ub(c3);
                      d3 = Hc[d3];
                      if (!d3) {
                        return b2.call(this);
                      }
                      d3 = this.ta ? d3.Kb : d3.pointerType;
                      var e3 = Gc(c3, this.i, d3.i);
                      return null === e3 ? b2.call(this) : this.ua ? Lc(d3.i.N, { u: d3, o: e3, L: this, G: a3 }) : Lc(d3.i.N, { u: d3, o: e3 });
                    };
                    kd = m2.UnboundTypeError = qc("UnboundTypeError");
                    var Ud = { __syscall_fcntl64: function(a3, b2, c3) {
                      ic = c3;
                      try {
                        var d3 = Qb(a3);
                        switch (b2) {
                          case 0:
                            var e3 = jc();
                            return 0 > e3 ? -28 : Sb(d3, e3).X;
                          case 1:
                          case 2:
                            return 0;
                          case 3:
                            return d3.flags;
                          case 4:
                            return e3 = jc(), d3.flags |= e3, 0;
                          case 5:
                            return e3 = jc(), Ba[e3 + 0 >> 1] = 2, 0;
                          case 6:
                          case 7:
                            return 0;
                          case 16:
                          case 8:
                            return -28;
                          case 9:
                            return L2[Sd() >> 2] = 28, -1;
                          default:
                            return -28;
                        }
                      } catch (f3) {
                        if ("undefined" == typeof hc || "ErrnoError" !== f3.name) {
                          throw f3;
                        }
                        return -f3.aa;
                      }
                    }, __syscall_ioctl: function(a3, b2, c3) {
                      ic = c3;
                      try {
                        var d3 = Qb(a3);
                        switch (b2) {
                          case 21509:
                            return d3.s ? 0 : -59;
                          case 21505:
                            if (!d3.s) {
                              return -59;
                            }
                            if (d3.s.V.bc) {
                              b2 = [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              var e3 = jc();
                              L2[e3 >> 2] = 25856;
                              L2[e3 + 4 >> 2] = 5;
                              L2[e3 + 8 >> 2] = 191;
                              L2[e3 + 12 >> 2] = 35387;
                              for (var f3 = 0; 32 > f3; f3++) {
                                C3[e3 + f3 + 17 >> 0] = b2[f3] || 0;
                              }
                            }
                            return 0;
                          case 21510:
                          case 21511:
                          case 21512:
                            return d3.s ? 0 : -59;
                          case 21506:
                          case 21507:
                          case 21508:
                            if (!d3.s) {
                              return -59;
                            }
                            if (d3.s.V.cc) {
                              for (e3 = jc(), b2 = [], f3 = 0; 32 > f3; f3++) {
                                b2.push(C3[e3 + f3 + 17 >> 0]);
                              }
                            }
                            return 0;
                          case 21519:
                            if (!d3.s) {
                              return -59;
                            }
                            e3 = jc();
                            return L2[e3 >> 2] = 0;
                          case 21520:
                            return d3.s ? -28 : -59;
                          case 21531:
                            e3 = jc();
                            if (!d3.m.ac) {
                              throw new O2(59);
                            }
                            return d3.m.ac(d3, b2, e3);
                          case 21523:
                            if (!d3.s) {
                              return -59;
                            }
                            d3.s.V.dc && (f3 = [24, 80], e3 = jc(), Ba[e3 >> 1] = f3[0], Ba[e3 + 2 >> 1] = f3[1]);
                            return 0;
                          case 21524:
                            return d3.s ? 0 : -59;
                          case 21515:
                            return d3.s ? 0 : -59;
                          default:
                            return -28;
                        }
                      } catch (g2) {
                        if ("undefined" == typeof hc || "ErrnoError" !== g2.name) {
                          throw g2;
                        }
                        return -g2.aa;
                      }
                    }, __syscall_openat: function(a3, b2, c3, d3) {
                      ic = d3;
                      try {
                        b2 = b2 ? kb(E, b2) : "";
                        var e3 = b2;
                        if ("/" === e3.charAt(0)) {
                          b2 = e3;
                        } else {
                          var f3 = -100 === a3 ? "/" : Qb(a3).path;
                          if (0 == e3.length) {
                            throw new O2(44);
                          }
                          b2 = db(f3 + "/" + e3);
                        }
                        var g2 = d3 ? jc() : 0;
                        return bc(b2, c3, g2).X;
                      } catch (n2) {
                        if ("undefined" == typeof hc || "ErrnoError" !== n2.name) {
                          throw n2;
                        }
                        return -n2.aa;
                      }
                    }, _embind_create_inheriting_constructor: function(a3, b2, c3) {
                      a3 = W(a3);
                      b2 = Cc(b2, "wrapper");
                      c3 = oc(c3);
                      var d3 = [].slice, e3 = b2.i, f3 = e3.N, g2 = e3.A.N, n2 = e3.A.constructor;
                      a3 = lc(a3, function() {
                        e3.A.qb.forEach(function(l3) {
                          if (this[l3] === g2[l3]) {
                            throw new rc(`Pure virtual function ${l3} must be implemented in JavaScript`);
                          }
                        }.bind(this));
                        Object.defineProperty(this, "__parent", { value: f3 });
                        this.__construct.apply(this, d3.call(arguments));
                      });
                      f3.__construct = function() {
                        this === f3 && V2("Pass correct 'this' to __construct");
                        var l3 = n2.implement.apply(void 0, [this].concat(d3.call(arguments)));
                        Dc(l3);
                        var u3 = l3.g;
                        l3.notifyOnDestruction();
                        u3.ia = true;
                        Object.defineProperties(this, { g: { value: u3 } });
                        Mc(this);
                        l3 = u3.o;
                        l3 = xc(e3, l3);
                        wc.hasOwnProperty(l3) ? V2(`Tried to register registered instance: ${l3}`) : wc[l3] = this;
                      };
                      f3.__destruct = function() {
                        this === f3 && V2("Pass correct 'this' to __destruct");
                        Dc(this);
                        var l3 = this.g.o;
                        l3 = xc(e3, l3);
                        wc.hasOwnProperty(l3) ? delete wc[l3] : V2(`Tried to unregister unregistered instance: ${l3}`);
                      };
                      a3.prototype = Object.create(f3);
                      for (var p3 in c3) {
                        a3.prototype[p3] = c3[p3];
                      }
                      return pc(a3);
                    }, _embind_finalize_value_object: function(a3) {
                      var b2 = Nc[a3];
                      delete Nc[a3];
                      var c3 = b2.Pa, d3 = b2.W, e3 = b2.eb, f3 = e3.map((g2) => g2.Yb).concat(e3.map((g2) => g2.rc));
                      Y([a3], f3, (g2) => {
                        var n2 = {};
                        e3.forEach((p3, l3) => {
                          var u3 = g2[l3], v3 = p3.Wb, x3 = p3.Xb, k3 = g2[l3 + e3.length], t3 = p3.qc, r3 = p3.sc;
                          n2[p3.Sb] = { read: (B3) => u3.fromWireType(v3(x3, B3)), write: (B3, D2) => {
                            var w3 = [];
                            t3(r3, B3, k3.toWireType(w3, D2));
                            Oc(w3);
                          } };
                        });
                        return [{ name: b2.name, fromWireType: function(p3) {
                          var l3 = {}, u3;
                          for (u3 in n2) {
                            l3[u3] = n2[u3].read(p3);
                          }
                          d3(p3);
                          return l3;
                        }, toWireType: function(p3, l3) {
                          for (var u3 in n2) {
                            if (!(u3 in l3)) {
                              throw new TypeError(`Missing field: "${u3}"`);
                            }
                          }
                          var v3 = c3();
                          for (u3 in n2) {
                            n2[u3].write(v3, l3[u3]);
                          }
                          null !== p3 && p3.push(d3, v3);
                          return v3;
                        }, argPackAdvance: 8, readValueFromPointer: Pc, K: d3 }];
                      });
                    }, _embind_register_bigint: function() {
                    }, _embind_register_bool: function(a3, b2, c3, d3, e3) {
                      var f3 = Tc(c3);
                      b2 = W(b2);
                      Sc(a3, { name: b2, fromWireType: function(g2) {
                        return !!g2;
                      }, toWireType: function(g2, n2) {
                        return n2 ? d3 : e3;
                      }, argPackAdvance: 8, readValueFromPointer: function(g2) {
                        if (1 === c3) {
                          var n2 = C3;
                        } else if (2 === c3) {
                          n2 = Ba;
                        } else if (4 === c3) {
                          n2 = L2;
                        } else {
                          throw new TypeError("Unknown boolean type size: " + b2);
                        }
                        return this.fromWireType(n2[g2 >> f3]);
                      }, K: null });
                    }, _embind_register_class: function(a3, b2, c3, d3, e3, f3, g2, n2, p3, l3, u3, v3, x3) {
                      u3 = W(u3);
                      f3 = Z(e3, f3);
                      n2 && (n2 = Z(g2, n2));
                      l3 && (l3 = Z(p3, l3));
                      x3 = Z(v3, x3);
                      var k3 = kc(u3);
                      Yc(k3, function() {
                        ld(`Cannot construct ${u3} due to unbound types`, [d3]);
                      });
                      Y([a3, b2, c3], d3 ? [d3] : [], function(t3) {
                        t3 = t3[0];
                        if (d3) {
                          var r3 = t3.i;
                          var B3 = r3.N;
                        } else {
                          B3 = Wc.prototype;
                        }
                        t3 = lc(k3, function() {
                          if (Object.getPrototypeOf(this) !== D2) {
                            throw new nc("Use 'new' to construct " + u3);
                          }
                          if (void 0 === w3.$) {
                            throw new nc(u3 + " has no accessible constructor");
                          }
                          var T3 = w3.$[arguments.length];
                          if (void 0 === T3) {
                            throw new nc(`Tried to invoke ctor of ${u3} with invalid number of parameters (${arguments.length}) - expected (${Object.keys(w3.$).toString()}) parameters instead!`);
                          }
                          return T3.apply(this, arguments);
                        });
                        var D2 = Object.create(B3, { constructor: { value: t3 } });
                        t3.prototype = D2;
                        var w3 = new Zc(u3, t3, D2, x3, r3, f3, n2, l3);
                        w3.A && (void 0 === w3.A.oa && (w3.A.oa = []), w3.A.oa.push(w3));
                        r3 = new ed(u3, w3, true, false);
                        B3 = new ed(u3 + "*", w3, false, false);
                        var M2 = new ed(u3 + " const*", w3, false, true);
                        Hc[a3] = { pointerType: B3, Kb: M2 };
                        fd(k3, t3);
                        return [r3, B3, M2];
                      });
                    }, _embind_register_class_class_function: function(a3, b2, c3, d3, e3, f3, g2) {
                      var n2 = pd(c3, d3);
                      b2 = W(b2);
                      f3 = Z(e3, f3);
                      Y([], [a3], function(p3) {
                        function l3() {
                          ld(`Cannot call ${u3} due to unbound types`, n2);
                        }
                        p3 = p3[0];
                        var u3 = `${p3.name}.${b2}`;
                        b2.startsWith("@@") && (b2 = Symbol[b2.substring(2)]);
                        var v3 = p3.i.constructor;
                        void 0 === v3[b2] ? (l3.ea = c3 - 1, v3[b2] = l3) : (Xc(v3, b2, u3), v3[b2].B[c3 - 1] = l3);
                        Y([], n2, function(x3) {
                          x3 = od(u3, [x3[0], null].concat(x3.slice(1)), null, f3, g2);
                          void 0 === v3[b2].B ? (x3.ea = c3 - 1, v3[b2] = x3) : v3[b2].B[c3 - 1] = x3;
                          if (p3.i.oa) {
                            for (const k3 of p3.i.oa) {
                              k3.constructor.hasOwnProperty(b2) || (k3.constructor[b2] = x3);
                            }
                          }
                          return [];
                        });
                        return [];
                      });
                    }, _embind_register_class_class_property: function(a3, b2, c3, d3, e3, f3, g2, n2) {
                      b2 = W(b2);
                      f3 = Z(e3, f3);
                      Y([], [a3], function(p3) {
                        p3 = p3[0];
                        var l3 = `${p3.name}.${b2}`, u3 = { get() {
                          ld(`Cannot access ${l3} due to unbound types`, [c3]);
                        }, enumerable: true, configurable: true };
                        u3.set = n2 ? () => {
                          ld(`Cannot access ${l3} due to unbound types`, [c3]);
                        } : () => {
                          V2(`${l3} is a read-only property`);
                        };
                        Object.defineProperty(p3.i.constructor, b2, u3);
                        Y([], [c3], function(v3) {
                          v3 = v3[0];
                          var x3 = { get() {
                            return v3.fromWireType(f3(d3));
                          }, enumerable: true };
                          n2 && (n2 = Z(g2, n2), x3.set = (k3) => {
                            var t3 = [];
                            n2(d3, v3.toWireType(t3, k3));
                            Oc(t3);
                          });
                          Object.defineProperty(p3.i.constructor, b2, x3);
                          return [];
                        });
                        return [];
                      });
                    }, _embind_register_class_constructor: function(a3, b2, c3, d3, e3, f3) {
                      var g2 = pd(b2, c3);
                      e3 = Z(d3, e3);
                      Y([], [a3], function(n2) {
                        n2 = n2[0];
                        var p3 = `constructor ${n2.name}`;
                        void 0 === n2.i.$ && (n2.i.$ = []);
                        if (void 0 !== n2.i.$[b2 - 1]) {
                          throw new nc(`Cannot register multiple constructors with identical number of parameters (${b2 - 1}) for class '${n2.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
                        }
                        n2.i.$[b2 - 1] = () => {
                          ld(`Cannot construct ${n2.name} due to unbound types`, g2);
                        };
                        Y([], g2, function(l3) {
                          l3.splice(1, 0, null);
                          n2.i.$[b2 - 1] = od(p3, l3, null, e3, f3);
                          return [];
                        });
                        return [];
                      });
                    }, _embind_register_class_function: function(a3, b2, c3, d3, e3, f3, g2, n2) {
                      var p3 = pd(c3, d3);
                      b2 = W(b2);
                      f3 = Z(e3, f3);
                      Y([], [a3], function(l3) {
                        function u3() {
                          ld(`Cannot call ${v3} due to unbound types`, p3);
                        }
                        l3 = l3[0];
                        var v3 = `${l3.name}.${b2}`;
                        b2.startsWith("@@") && (b2 = Symbol[b2.substring(2)]);
                        n2 && l3.i.qb.push(b2);
                        var x3 = l3.i.N, k3 = x3[b2];
                        void 0 === k3 || void 0 === k3.B && k3.className !== l3.name && k3.ea === c3 - 2 ? (u3.ea = c3 - 2, u3.className = l3.name, x3[b2] = u3) : (Xc(x3, b2, v3), x3[b2].B[c3 - 2] = u3);
                        Y([], p3, function(t3) {
                          t3 = od(v3, t3, l3, f3, g2);
                          void 0 === x3[b2].B ? (t3.ea = c3 - 2, x3[b2] = t3) : x3[b2].B[c3 - 2] = t3;
                          return [];
                        });
                        return [];
                      });
                    }, _embind_register_class_property: function(a3, b2, c3, d3, e3, f3, g2, n2, p3, l3) {
                      b2 = W(b2);
                      e3 = Z(d3, e3);
                      Y([], [a3], function(u3) {
                        u3 = u3[0];
                        var v3 = `${u3.name}.${b2}`, x3 = { get() {
                          ld(`Cannot access ${v3} due to unbound types`, [c3, g2]);
                        }, enumerable: true, configurable: true };
                        x3.set = p3 ? () => {
                          ld(`Cannot access ${v3} due to unbound types`, [c3, g2]);
                        } : () => {
                          V2(v3 + " is a read-only property");
                        };
                        Object.defineProperty(u3.i.N, b2, x3);
                        Y([], p3 ? [c3, g2] : [c3], function(k3) {
                          var t3 = k3[0], r3 = { get() {
                            var D2 = qd(this, u3, v3 + " getter");
                            return t3.fromWireType(e3(f3, D2));
                          }, enumerable: true };
                          if (p3) {
                            p3 = Z(n2, p3);
                            var B3 = k3[1];
                            r3.set = function(D2) {
                              var w3 = qd(this, u3, v3 + " setter"), M2 = [];
                              p3(l3, w3, B3.toWireType(M2, D2));
                              Oc(M2);
                            };
                          }
                          Object.defineProperty(u3.i.N, b2, r3);
                          return [];
                        });
                        return [];
                      });
                    }, _embind_register_emval: function(a3, b2) {
                      b2 = W(b2);
                      Sc(a3, { name: b2, fromWireType: function(c3) {
                        var d3 = oc(c3);
                        rd(c3);
                        return d3;
                      }, toWireType: function(c3, d3) {
                        return pc(d3);
                      }, argPackAdvance: 8, readValueFromPointer: Pc, K: null });
                    }, _embind_register_enum: function(a3, b2, c3, d3) {
                      function e3() {
                      }
                      c3 = Tc(c3);
                      b2 = W(b2);
                      e3.values = {};
                      Sc(a3, { name: b2, constructor: e3, fromWireType: function(f3) {
                        return this.constructor.values[f3];
                      }, toWireType: function(f3, g2) {
                        return g2.value;
                      }, argPackAdvance: 8, readValueFromPointer: sd(b2, c3, d3), K: null });
                      Yc(b2, e3);
                    }, _embind_register_enum_value: function(a3, b2, c3) {
                      var d3 = Cc(a3, "enum");
                      b2 = W(b2);
                      a3 = d3.constructor;
                      d3 = Object.create(d3.constructor.prototype, { value: { value: c3 }, constructor: { value: lc(`${d3.name}_${b2}`, function() {
                      }) } });
                      a3.values[c3] = d3;
                      a3[b2] = d3;
                    }, _embind_register_float: function(a3, b2, c3) {
                      c3 = Tc(c3);
                      b2 = W(b2);
                      Sc(a3, { name: b2, fromWireType: function(d3) {
                        return d3;
                      }, toWireType: function(d3, e3) {
                        return e3;
                      }, argPackAdvance: 8, readValueFromPointer: td(b2, c3), K: null });
                    }, _embind_register_function: function(a3, b2, c3, d3, e3, f3) {
                      var g2 = pd(b2, c3);
                      a3 = W(a3);
                      e3 = Z(d3, e3);
                      Yc(a3, function() {
                        ld(`Cannot call ${a3} due to unbound types`, g2);
                      }, b2 - 1);
                      Y([], g2, function(n2) {
                        fd(a3, od(a3, [n2[0], null].concat(n2.slice(1)), null, e3, f3), b2 - 1);
                        return [];
                      });
                    }, _embind_register_integer: function(a3, b2, c3, d3, e3) {
                      b2 = W(b2);
                      -1 === e3 && (e3 = 4294967295);
                      e3 = Tc(c3);
                      var f3 = (n2) => n2;
                      if (0 === d3) {
                        var g2 = 32 - 8 * c3;
                        f3 = (n2) => n2 << g2 >>> g2;
                      }
                      c3 = b2.includes("unsigned") ? function(n2, p3) {
                        return p3 >>> 0;
                      } : function(n2, p3) {
                        return p3;
                      };
                      Sc(a3, { name: b2, fromWireType: f3, toWireType: c3, argPackAdvance: 8, readValueFromPointer: ud(b2, e3, 0 !== d3), K: null });
                    }, _embind_register_memory_view: function(a3, b2, c3) {
                      function d3(f3) {
                        f3 >>= 2;
                        var g2 = N2;
                        return new e3(g2.buffer, g2[f3 + 1], g2[f3]);
                      }
                      var e3 = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][b2];
                      c3 = W(c3);
                      Sc(a3, { name: c3, fromWireType: d3, argPackAdvance: 8, readValueFromPointer: d3 }, { $b: true });
                    }, _embind_register_std_string: function(a3, b2) {
                      b2 = W(b2);
                      var c3 = "std::string" === b2;
                      Sc(a3, { name: b2, fromWireType: function(d3) {
                        var e3 = N2[d3 >> 2], f3 = d3 + 4;
                        if (c3) {
                          for (var g2 = f3, n2 = 0; n2 <= e3; ++n2) {
                            var p3 = f3 + n2;
                            if (n2 == e3 || 0 == E[p3]) {
                              g2 = g2 ? kb(E, g2, p3 - g2) : "";
                              if (void 0 === l3) {
                                var l3 = g2;
                              } else {
                                l3 += String.fromCharCode(0), l3 += g2;
                              }
                              g2 = p3 + 1;
                            }
                          }
                        } else {
                          l3 = Array(e3);
                          for (n2 = 0; n2 < e3; ++n2) {
                            l3[n2] = String.fromCharCode(E[f3 + n2]);
                          }
                          l3 = l3.join("");
                        }
                        Bc(d3);
                        return l3;
                      }, toWireType: function(d3, e3) {
                        e3 instanceof ArrayBuffer && (e3 = new Uint8Array(e3));
                        var f3 = "string" == typeof e3;
                        f3 || e3 instanceof Uint8Array || e3 instanceof Uint8ClampedArray || e3 instanceof Int8Array || V2("Cannot pass non-string to std::string");
                        var g2 = c3 && f3 ? mb(e3) : e3.length;
                        var n2 = Td(4 + g2 + 1), p3 = n2 + 4;
                        N2[n2 >> 2] = g2;
                        if (c3 && f3) {
                          nb(e3, E, p3, g2 + 1);
                        } else {
                          if (f3) {
                            for (f3 = 0; f3 < g2; ++f3) {
                              var l3 = e3.charCodeAt(f3);
                              255 < l3 && (Bc(p3), V2("String has UTF-16 code units that do not fit in 8 bits"));
                              E[p3 + f3] = l3;
                            }
                          } else {
                            for (f3 = 0; f3 < g2; ++f3) {
                              E[p3 + f3] = e3[f3];
                            }
                          }
                        }
                        null !== d3 && d3.push(Bc, n2);
                        return n2;
                      }, argPackAdvance: 8, readValueFromPointer: Pc, K: function(d3) {
                        Bc(d3);
                      } });
                    }, _embind_register_std_wstring: function(a3, b2, c3) {
                      c3 = W(c3);
                      if (2 === b2) {
                        var d3 = wd;
                        var e3 = xd;
                        var f3 = yd;
                        var g2 = () => Ca;
                        var n2 = 1;
                      } else {
                        4 === b2 && (d3 = zd, e3 = Ad, f3 = Bd, g2 = () => N2, n2 = 2);
                      }
                      Sc(a3, { name: c3, fromWireType: function(p3) {
                        for (var l3 = N2[p3 >> 2], u3 = g2(), v3, x3 = p3 + 4, k3 = 0; k3 <= l3; ++k3) {
                          var t3 = p3 + 4 + k3 * b2;
                          if (k3 == l3 || 0 == u3[t3 >> n2]) {
                            x3 = d3(x3, t3 - x3), void 0 === v3 ? v3 = x3 : (v3 += String.fromCharCode(0), v3 += x3), x3 = t3 + b2;
                          }
                        }
                        Bc(p3);
                        return v3;
                      }, toWireType: function(p3, l3) {
                        "string" != typeof l3 && V2(`Cannot pass non-string to C++ string type ${c3}`);
                        var u3 = f3(l3), v3 = Td(4 + u3 + b2);
                        N2[v3 >> 2] = u3 >> n2;
                        e3(l3, v3 + 4, u3 + b2);
                        null !== p3 && p3.push(Bc, v3);
                        return v3;
                      }, argPackAdvance: 8, readValueFromPointer: Pc, K: function(p3) {
                        Bc(p3);
                      } });
                    }, _embind_register_value_object: function(a3, b2, c3, d3, e3, f3) {
                      Nc[a3] = { name: W(b2), Pa: Z(c3, d3), W: Z(e3, f3), eb: [] };
                    }, _embind_register_value_object_field: function(a3, b2, c3, d3, e3, f3, g2, n2, p3, l3) {
                      Nc[a3].eb.push({ Sb: W(b2), Yb: c3, Wb: Z(d3, e3), Xb: f3, rc: g2, qc: Z(n2, p3), sc: l3 });
                    }, _embind_register_void: function(a3, b2) {
                      b2 = W(b2);
                      Sc(a3, { fc: true, name: b2, argPackAdvance: 0, fromWireType: function() {
                      }, toWireType: function() {
                      } });
                    }, _emscripten_get_now_is_monotonic: () => true, _emval_as: function(a3, b2, c3) {
                      a3 = oc(a3);
                      b2 = Cc(b2, "emval::as");
                      var d3 = [], e3 = pc(d3);
                      N2[c3 >> 2] = e3;
                      return b2.toWireType(d3, a3);
                    }, _emval_call_method: function(a3, b2, c3, d3, e3) {
                      a3 = Ed[a3];
                      b2 = oc(b2);
                      c3 = Dd(c3);
                      var f3 = [];
                      N2[d3 >> 2] = pc(f3);
                      return a3(b2, c3, f3, e3);
                    }, _emval_call_void_method: function(a3, b2, c3, d3) {
                      a3 = Ed[a3];
                      b2 = oc(b2);
                      c3 = Dd(c3);
                      a3(b2, c3, null, d3);
                    }, _emval_decref: rd, _emval_get_method_caller: function(a3, b2) {
                      var c3 = Gd(a3, b2), d3 = c3[0];
                      b2 = d3.name + "_$" + c3.slice(1).map(function(g2) {
                        return g2.name;
                      }).join("_") + "$";
                      var e3 = Hd[b2];
                      if (void 0 !== e3) {
                        return e3;
                      }
                      var f3 = Array(a3 - 1);
                      e3 = Fd((g2, n2, p3, l3) => {
                        for (var u3 = 0, v3 = 0; v3 < a3 - 1; ++v3) {
                          f3[v3] = c3[v3 + 1].readValueFromPointer(l3 + u3), u3 += c3[v3 + 1].argPackAdvance;
                        }
                        g2 = g2[n2].apply(g2, f3);
                        for (v3 = 0; v3 < a3 - 1; ++v3) {
                          c3[v3 + 1].Nb && c3[v3 + 1].Nb(f3[v3]);
                        }
                        if (!d3.fc) {
                          return d3.toWireType(p3, g2);
                        }
                      });
                      return Hd[b2] = e3;
                    }, _emval_get_module_property: function(a3) {
                      a3 = Dd(a3);
                      return pc(m2[a3]);
                    }, _emval_get_property: function(a3, b2) {
                      a3 = oc(a3);
                      b2 = oc(b2);
                      return pc(a3[b2]);
                    }, _emval_incref: function(a3) {
                      4 < a3 && (U.get(a3).tb += 1);
                    }, _emval_new_cstring: function(a3) {
                      return pc(Dd(a3));
                    }, _emval_new_object: function() {
                      return pc({});
                    }, _emval_run_destructors: function(a3) {
                      var b2 = oc(a3);
                      Oc(b2);
                      rd(a3);
                    }, _emval_set_property: function(a3, b2, c3) {
                      a3 = oc(a3);
                      b2 = oc(b2);
                      c3 = oc(c3);
                      a3[b2] = c3;
                    }, _emval_take_value: function(a3, b2) {
                      a3 = Cc(a3, "_emval_take_value");
                      a3 = a3.readValueFromPointer(b2);
                      return pc(a3);
                    }, abort: () => {
                      xa("");
                    }, emscripten_asm_const_int: (a3, b2, c3) => {
                      Id.length = 0;
                      var d3;
                      for (c3 >>= 2; d3 = E[b2++]; ) {
                        c3 += 105 != d3 & c3, Id.push(105 == d3 ? L2[c3] : Ea[c3++ >> 1]), ++c3;
                      }
                      return ab[a3].apply(null, Id);
                    }, emscripten_date_now: function() {
                      return Date.now();
                    }, emscripten_get_now: () => performance.now(), emscripten_memcpy_big: (a3, b2, c3) => E.copyWithin(a3, b2, b2 + c3), emscripten_resize_heap: (a3) => {
                      var b2 = E.length;
                      a3 >>>= 0;
                      if (2147483648 < a3) {
                        return false;
                      }
                      for (var c3 = 1; 4 >= c3; c3 *= 2) {
                        var d3 = b2 * (1 + 0.2 / c3);
                        d3 = Math.min(d3, a3 + 100663296);
                        var e3 = Math;
                        d3 = Math.max(a3, d3);
                        a: {
                          e3 = e3.min.call(e3, 2147483648, d3 + (65536 - d3 % 65536) % 65536) - za.buffer.byteLength + 65535 >>> 16;
                          try {
                            za.grow(e3);
                            Ha();
                            var f3 = 1;
                            break a;
                          } catch (g2) {
                          }
                          f3 = void 0;
                        }
                        if (f3) {
                          return true;
                        }
                      }
                      return false;
                    }, environ_get: (a3, b2) => {
                      var c3 = 0;
                      Ld().forEach(function(d3, e3) {
                        var f3 = b2 + c3;
                        e3 = N2[a3 + 4 * e3 >> 2] = f3;
                        for (f3 = 0; f3 < d3.length; ++f3) {
                          C3[e3++ >> 0] = d3.charCodeAt(f3);
                        }
                        C3[e3 >> 0] = 0;
                        c3 += d3.length + 1;
                      });
                      return 0;
                    }, environ_sizes_get: (a3, b2) => {
                      var c3 = Ld();
                      N2[a3 >> 2] = c3.length;
                      var d3 = 0;
                      c3.forEach(function(e3) {
                        d3 += e3.length + 1;
                      });
                      N2[b2 >> 2] = d3;
                      return 0;
                    }, fd_close: function(a3) {
                      try {
                        var b2 = Qb(a3);
                        if (null === b2.X) {
                          throw new O2(8);
                        }
                        b2.Ma && (b2.Ma = null);
                        try {
                          b2.m.close && b2.m.close(b2);
                        } catch (c3) {
                          throw c3;
                        } finally {
                          Db[b2.X] = null;
                        }
                        b2.X = null;
                        return 0;
                      } catch (c3) {
                        if ("undefined" == typeof hc || "ErrnoError" !== c3.name) {
                          throw c3;
                        }
                        return c3.aa;
                      }
                    }, fd_read: function(a3, b2, c3, d3) {
                      try {
                        a: {
                          var e3 = Qb(a3);
                          a3 = b2;
                          for (var f3, g2 = b2 = 0; g2 < c3; g2++) {
                            var n2 = N2[a3 >> 2], p3 = N2[a3 + 4 >> 2];
                            a3 += 8;
                            var l3 = e3, u3 = n2, v3 = p3, x3 = f3, k3 = C3;
                            if (0 > v3 || 0 > x3) {
                              throw new O2(28);
                            }
                            if (null === l3.X) {
                              throw new O2(8);
                            }
                            if (1 === (l3.flags & 2097155)) {
                              throw new O2(8);
                            }
                            if (16384 === (l3.node.mode & 61440)) {
                              throw new O2(31);
                            }
                            if (!l3.m.read) {
                              throw new O2(28);
                            }
                            var t3 = "undefined" != typeof x3;
                            if (!t3) {
                              x3 = l3.position;
                            } else if (!l3.seekable) {
                              throw new O2(70);
                            }
                            var r3 = l3.m.read(l3, k3, u3, v3, x3);
                            t3 || (l3.position += r3);
                            var B3 = r3;
                            if (0 > B3) {
                              var D2 = -1;
                              break a;
                            }
                            b2 += B3;
                            if (B3 < p3) {
                              break;
                            }
                            "undefined" !== typeof f3 && (f3 += B3);
                          }
                          D2 = b2;
                        }
                        N2[d3 >> 2] = D2;
                        return 0;
                      } catch (w3) {
                        if ("undefined" == typeof hc || "ErrnoError" !== w3.name) {
                          throw w3;
                        }
                        return w3.aa;
                      }
                    }, fd_seek: function(a3, b2, c3, d3, e3) {
                      b2 = c3 + 2097152 >>> 0 < 4194305 - !!b2 ? (b2 >>> 0) + 4294967296 * c3 : NaN;
                      try {
                        if (isNaN(b2)) {
                          return 61;
                        }
                        var f3 = Qb(a3);
                        cc(f3, b2, d3);
                        Xa = [f3.position >>> 0, (Wa = f3.position, 1 <= +Math.abs(Wa) ? 0 < Wa ? +Math.floor(Wa / 4294967296) >>> 0 : ~~+Math.ceil((Wa - +(~~Wa >>> 0)) / 4294967296) >>> 0 : 0)];
                        L2[e3 >> 2] = Xa[0];
                        L2[e3 + 4 >> 2] = Xa[1];
                        f3.Ma && 0 === b2 && 0 === d3 && (f3.Ma = null);
                        return 0;
                      } catch (g2) {
                        if ("undefined" == typeof hc || "ErrnoError" !== g2.name) {
                          throw g2;
                        }
                        return g2.aa;
                      }
                    }, fd_write: function(a3, b2, c3, d3) {
                      try {
                        a: {
                          var e3 = Qb(a3);
                          a3 = b2;
                          for (var f3, g2 = b2 = 0; g2 < c3; g2++) {
                            var n2 = N2[a3 >> 2], p3 = N2[a3 + 4 >> 2];
                            a3 += 8;
                            var l3 = e3, u3 = n2, v3 = p3, x3 = f3, k3 = C3;
                            if (0 > v3 || 0 > x3) {
                              throw new O2(28);
                            }
                            if (null === l3.X) {
                              throw new O2(8);
                            }
                            if (0 === (l3.flags & 2097155)) {
                              throw new O2(8);
                            }
                            if (16384 === (l3.node.mode & 61440)) {
                              throw new O2(31);
                            }
                            if (!l3.m.write) {
                              throw new O2(28);
                            }
                            l3.seekable && l3.flags & 1024 && cc(l3, 0, 2);
                            var t3 = "undefined" != typeof x3;
                            if (!t3) {
                              x3 = l3.position;
                            } else if (!l3.seekable) {
                              throw new O2(70);
                            }
                            var r3 = l3.m.write(l3, k3, u3, v3, x3, void 0);
                            t3 || (l3.position += r3);
                            var B3 = r3;
                            if (0 > B3) {
                              var D2 = -1;
                              break a;
                            }
                            b2 += B3;
                            "undefined" !== typeof f3 && (f3 += B3);
                          }
                          D2 = b2;
                        }
                        N2[d3 >> 2] = D2;
                        return 0;
                      } catch (w3) {
                        if ("undefined" == typeof hc || "ErrnoError" !== w3.name) {
                          throw w3;
                        }
                        return w3.aa;
                      }
                    }, strftime_l: (a3, b2, c3, d3) => Pd(a3, b2, c3, d3) };
                    (function() {
                      function a3(c3) {
                        z3 = c3 = c3.exports;
                        za = z3.memory;
                        Ha();
                        Ia = z3.__indirect_function_table;
                        Ka.unshift(z3.__wasm_call_ctors);
                        Na--;
                        m2.monitorRunDependencies && m2.monitorRunDependencies(Na);
                        if (0 == Na && (null !== Oa && (clearInterval(Oa), Oa = null), Pa)) {
                          var d3 = Pa;
                          Pa = null;
                          d3();
                        }
                        return c3;
                      }
                      var b2 = { env: Ud, wasi_snapshot_preview1: Ud };
                      Na++;
                      m2.monitorRunDependencies && m2.monitorRunDependencies(Na);
                      if (m2.instantiateWasm) {
                        try {
                          return m2.instantiateWasm(b2, a3);
                        } catch (c3) {
                          va("Module.instantiateWasm callback failed with error: " + c3), ea(c3);
                        }
                      }
                      Va(b2, function(c3) {
                        a3(c3.instance);
                      }).catch(ea);
                      return {};
                    })();
                    var Bc = (a3) => (Bc = z3.free)(a3), Td = (a3) => (Td = z3.malloc)(a3), Ya = m2._ma_device__on_notification_unlocked = (a3) => (Ya = m2._ma_device__on_notification_unlocked = z3.ma_device__on_notification_unlocked)(a3);
                    m2._ma_malloc_emscripten = (a3, b2) => (m2._ma_malloc_emscripten = z3.ma_malloc_emscripten)(a3, b2);
                    m2._ma_free_emscripten = (a3, b2) => (m2._ma_free_emscripten = z3.ma_free_emscripten)(a3, b2);
                    var Za = m2._ma_device_process_pcm_frames_capture__webaudio = (a3, b2, c3) => (Za = m2._ma_device_process_pcm_frames_capture__webaudio = z3.ma_device_process_pcm_frames_capture__webaudio)(a3, b2, c3), $a = m2._ma_device_process_pcm_frames_playback__webaudio = (a3, b2, c3) => ($a = m2._ma_device_process_pcm_frames_playback__webaudio = z3.ma_device_process_pcm_frames_playback__webaudio)(a3, b2, c3), Sd = () => (Sd = z3.__errno_location)(), Ac = (a3) => (Ac = z3.__getTypeName)(a3);
                    m2.__embind_initialize_bindings = () => (m2.__embind_initialize_bindings = z3._embind_initialize_bindings)();
                    m2.dynCall_iiji = (a3, b2, c3, d3, e3) => (m2.dynCall_iiji = z3.dynCall_iiji)(a3, b2, c3, d3, e3);
                    m2.dynCall_jiji = (a3, b2, c3, d3, e3) => (m2.dynCall_jiji = z3.dynCall_jiji)(a3, b2, c3, d3, e3);
                    m2.dynCall_iiiji = (a3, b2, c3, d3, e3, f3) => (m2.dynCall_iiiji = z3.dynCall_iiiji)(a3, b2, c3, d3, e3, f3);
                    m2.dynCall_iij = (a3, b2, c3, d3) => (m2.dynCall_iij = z3.dynCall_iij)(a3, b2, c3, d3);
                    m2.dynCall_jii = (a3, b2, c3) => (m2.dynCall_jii = z3.dynCall_jii)(a3, b2, c3);
                    m2.dynCall_viijii = (a3, b2, c3, d3, e3, f3, g2) => (m2.dynCall_viijii = z3.dynCall_viijii)(a3, b2, c3, d3, e3, f3, g2);
                    m2.dynCall_iiiiij = (a3, b2, c3, d3, e3, f3, g2) => (m2.dynCall_iiiiij = z3.dynCall_iiiiij)(a3, b2, c3, d3, e3, f3, g2);
                    m2.dynCall_iiiiijj = (a3, b2, c3, d3, e3, f3, g2, n2, p3) => (m2.dynCall_iiiiijj = z3.dynCall_iiiiijj)(a3, b2, c3, d3, e3, f3, g2, n2, p3);
                    m2.dynCall_iiiiiijj = (a3, b2, c3, d3, e3, f3, g2, n2, p3, l3) => (m2.dynCall_iiiiiijj = z3.dynCall_iiiiiijj)(a3, b2, c3, d3, e3, f3, g2, n2, p3, l3);
                    var Vd;
                    Pa = function Wd() {
                      Vd || Xd();
                      Vd || (Pa = Wd);
                    };
                    function Xd() {
                      function a3() {
                        if (!Vd && (Vd = true, m2.calledRun = true, !Aa)) {
                          m2.noFSInit || ec || (ec = true, dc(), m2.stdin = m2.stdin, m2.stdout = m2.stdout, m2.stderr = m2.stderr, m2.stdin ? gc("stdin", m2.stdin) : Vb("/dev/tty", "/dev/stdin"), m2.stdout ? gc("stdout", null, m2.stdout) : Vb("/dev/tty", "/dev/stdout"), m2.stderr ? gc("stderr", null, m2.stderr) : Vb("/dev/tty1", "/dev/stderr"), bc("/dev/stdin", 0), bc("/dev/stdout", 1), bc("/dev/stderr", 1));
                          Gb = false;
                          bb(Ka);
                          aa(m2);
                          if (m2.onRuntimeInitialized) {
                            m2.onRuntimeInitialized();
                          }
                          if (m2.postRun) {
                            for ("function" == typeof m2.postRun && (m2.postRun = [m2.postRun]); m2.postRun.length; ) {
                              var b2 = m2.postRun.shift();
                              La.unshift(b2);
                            }
                          }
                          bb(La);
                        }
                      }
                      if (!(0 < Na)) {
                        if (m2.preRun) {
                          for ("function" == typeof m2.preRun && (m2.preRun = [m2.preRun]); m2.preRun.length; ) {
                            Ma();
                          }
                        }
                        bb(Ja);
                        0 < Na || (m2.setStatus ? (m2.setStatus("Running..."), setTimeout(function() {
                          setTimeout(function() {
                            m2.setStatus("");
                          }, 1);
                          a3();
                        }, 1)) : a3());
                      }
                    }
                    if (m2.preInit) {
                      for ("function" == typeof m2.preInit && (m2.preInit = [m2.preInit]); 0 < m2.preInit.length; ) {
                        m2.preInit.pop()();
                      }
                    }
                    Xd();
                    return moduleArg.ready;
                  };
                })();
                const __WEBPACK_DEFAULT_EXPORT__ = Rive2;
              },
              /* 2 */
              /***/
              (module2) => {
                module2.exports = JSON.parse(`{"name":"@rive-app/canvas-single","version":"2.25.3","description":"Rive's high-level canvas based web api all in one js file.","main":"rive.js","homepage":"https://rive.app","repository":{"type":"git","url":"https://github.com/rive-app/rive-wasm/tree/master/js"},"keywords":["rive","animation"],"author":"Rive","contributors":["Luigi Rosso <luigi@rive.app> (https://rive.app)","Maxwell Talbot <max@rive.app> (https://rive.app)","Arthur Vivian <arthur@rive.app> (https://rive.app)","Umberto Sonnino <umberto@rive.app> (https://rive.app)","Matthew Sullivan <matt.j.sullivan@gmail.com> (mailto:matt.j.sullivan@gmail.com)"],"license":"MIT","files":["rive.js","rive.js.map","rive.d.ts","rive_advanced.mjs.d.ts"],"typings":"rive.d.ts","dependencies":{},"browser":{"fs":false,"path":false}}`);
              },
              /* 3 */
              /***/
              (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  Animation: () => (
                    /* reexport safe */
                    _Animation__WEBPACK_IMPORTED_MODULE_0__.Animation
                  )
                  /* harmony export */
                });
                var _Animation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(4);
              },
              /* 4 */
              /***/
              (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  Animation: () => (
                    /* binding */
                    Animation2
                  )
                  /* harmony export */
                });
                var Animation2 = (
                  /** @class */
                  function() {
                    function Animation3(animation, artboard, runtime, playing) {
                      this.animation = animation;
                      this.artboard = artboard;
                      this.playing = playing;
                      this.loopCount = 0;
                      this.scrubTo = null;
                      this.instance = new runtime.LinearAnimationInstance(animation, artboard);
                    }
                    Object.defineProperty(Animation3.prototype, "name", {
                      /**
                       * Returns the animation's name
                       */
                      get: function() {
                        return this.animation.name;
                      },
                      enumerable: false,
                      configurable: true
                    });
                    Object.defineProperty(Animation3.prototype, "time", {
                      /**
                       * Returns the animation's name
                       */
                      get: function() {
                        return this.instance.time;
                      },
                      /**
                       * Sets the animation's current time
                       */
                      set: function(value) {
                        this.instance.time = value;
                      },
                      enumerable: false,
                      configurable: true
                    });
                    Object.defineProperty(Animation3.prototype, "loopValue", {
                      /**
                       * Returns the animation's loop type
                       */
                      get: function() {
                        return this.animation.loopValue;
                      },
                      enumerable: false,
                      configurable: true
                    });
                    Object.defineProperty(Animation3.prototype, "needsScrub", {
                      /**
                       * Indicates whether the animation needs to be scrubbed.
                       * @returns `true` if the animation needs to be scrubbed, `false` otherwise.
                       */
                      get: function() {
                        return this.scrubTo !== null;
                      },
                      enumerable: false,
                      configurable: true
                    });
                    Animation3.prototype.advance = function(time) {
                      if (this.scrubTo === null) {
                        this.instance.advance(time);
                      } else {
                        this.instance.time = 0;
                        this.instance.advance(this.scrubTo);
                        this.scrubTo = null;
                      }
                    };
                    Animation3.prototype.apply = function(mix) {
                      this.instance.apply(mix);
                    };
                    Animation3.prototype.cleanup = function() {
                      this.instance.delete();
                    };
                    return Animation3;
                  }()
                );
              },
              /* 5 */
              /***/
              (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  BLANK_URL: () => (
                    /* reexport safe */
                    _sanitizeUrl__WEBPACK_IMPORTED_MODULE_1__.BLANK_URL
                  ),
                  /* harmony export */
                  registerTouchInteractions: () => (
                    /* reexport safe */
                    _registerTouchInteractions__WEBPACK_IMPORTED_MODULE_0__.registerTouchInteractions
                  ),
                  /* harmony export */
                  sanitizeUrl: () => (
                    /* reexport safe */
                    _sanitizeUrl__WEBPACK_IMPORTED_MODULE_1__.sanitizeUrl
                  )
                  /* harmony export */
                });
                var _registerTouchInteractions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(6);
                var _sanitizeUrl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(7);
              },
              /* 6 */
              /***/
              (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  registerTouchInteractions: () => (
                    /* binding */
                    registerTouchInteractions
                  )
                  /* harmony export */
                });
                var _this = void 0;
                var getClientCoordinates = function(event, isTouchScrollEnabled) {
                  var _a, _b;
                  if (["touchstart", "touchmove"].indexOf(event.type) > -1 && ((_a = event.touches) === null || _a === void 0 ? void 0 : _a.length)) {
                    if (!isTouchScrollEnabled) {
                      event.preventDefault();
                    }
                    return {
                      clientX: event.touches[0].clientX,
                      clientY: event.touches[0].clientY
                    };
                  } else if (event.type === "touchend" && ((_b = event.changedTouches) === null || _b === void 0 ? void 0 : _b.length)) {
                    return {
                      clientX: event.changedTouches[0].clientX,
                      clientY: event.changedTouches[0].clientY
                    };
                  } else {
                    return {
                      clientX: event.clientX,
                      clientY: event.clientY
                    };
                  }
                };
                var registerTouchInteractions = function(_a) {
                  var canvas = _a.canvas, artboard = _a.artboard, _b = _a.stateMachines, stateMachines = _b === void 0 ? [] : _b, renderer = _a.renderer, rive = _a.rive, fit = _a.fit, alignment = _a.alignment, _c = _a.isTouchScrollEnabled, isTouchScrollEnabled = _c === void 0 ? false : _c, _d = _a.layoutScaleFactor, layoutScaleFactor = _d === void 0 ? 1 : _d;
                  if (!canvas || !stateMachines.length || !renderer || !rive || !artboard || typeof window === "undefined") {
                    return null;
                  }
                  var _prevEventType = null;
                  var _syntheticEventsActive = false;
                  var processEventCallback = function(event) {
                    if (_syntheticEventsActive && event instanceof MouseEvent) {
                      if (event.type == "mouseup") {
                        _syntheticEventsActive = false;
                      }
                      return;
                    }
                    _syntheticEventsActive = isTouchScrollEnabled && event.type === "touchend" && _prevEventType === "touchstart";
                    _prevEventType = event.type;
                    var boundingRect = event.currentTarget.getBoundingClientRect();
                    var _a2 = getClientCoordinates(event, isTouchScrollEnabled), clientX = _a2.clientX, clientY = _a2.clientY;
                    if (!clientX && !clientY) {
                      return;
                    }
                    var canvasX = clientX - boundingRect.left;
                    var canvasY = clientY - boundingRect.top;
                    var forwardMatrix = rive.computeAlignment(fit, alignment, {
                      minX: 0,
                      minY: 0,
                      maxX: boundingRect.width,
                      maxY: boundingRect.height
                    }, artboard.bounds, layoutScaleFactor);
                    var invertedMatrix = new rive.Mat2D();
                    forwardMatrix.invert(invertedMatrix);
                    var canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
                    var transformedVector = rive.mapXY(invertedMatrix, canvasCoordinatesVector);
                    var transformedX = transformedVector.x();
                    var transformedY = transformedVector.y();
                    transformedVector.delete();
                    invertedMatrix.delete();
                    canvasCoordinatesVector.delete();
                    forwardMatrix.delete();
                    switch (event.type) {
                      /**
                       * There's a 2px buffer for a hitRadius when translating the pointer coordinates
                       * down to the state machine. In cases where the hitbox is about that much away
                       * from the Artboard border, we don't have exact precision on determining pointer
                       * exit. We're therefore adding to the translated coordinates on mouseout of a canvas
                       * to ensure that we report the mouse has truly exited the hitarea.
                       * https://github.com/rive-app/rive-cpp/blob/master/src/animation/state_machine_instance.cpp#L336
                       *
                       * We add/subtract 10000 to account for when the graphic goes beyond the canvas bound
                       * due to for example, a fit: 'cover'. Not perfect, but helps reliably (for now) ensure
                       * we report going out of bounds when the mouse is out of the canvas
                       */
                      case "mouseout":
                        for (var _i = 0, stateMachines_1 = stateMachines; _i < stateMachines_1.length; _i++) {
                          var stateMachine = stateMachines_1[_i];
                          stateMachine.pointerMove(transformedX, transformedY);
                        }
                        break;
                      // Pointer moving/hovering on the canvas
                      case "touchmove":
                      case "mouseover":
                      case "mousemove": {
                        for (var _b2 = 0, stateMachines_2 = stateMachines; _b2 < stateMachines_2.length; _b2++) {
                          var stateMachine = stateMachines_2[_b2];
                          stateMachine.pointerMove(transformedX, transformedY);
                        }
                        break;
                      }
                      // Pointer click initiated but not released yet on the canvas
                      case "touchstart":
                      case "mousedown": {
                        for (var _c2 = 0, stateMachines_3 = stateMachines; _c2 < stateMachines_3.length; _c2++) {
                          var stateMachine = stateMachines_3[_c2];
                          stateMachine.pointerDown(transformedX, transformedY);
                        }
                        break;
                      }
                      // Pointer click released on the canvas
                      case "touchend":
                      case "mouseup": {
                        for (var _d2 = 0, stateMachines_4 = stateMachines; _d2 < stateMachines_4.length; _d2++) {
                          var stateMachine = stateMachines_4[_d2];
                          stateMachine.pointerUp(transformedX, transformedY);
                        }
                        break;
                      }
                      default:
                    }
                  };
                  var callback = processEventCallback.bind(_this);
                  canvas.addEventListener("mouseover", callback);
                  canvas.addEventListener("mouseout", callback);
                  canvas.addEventListener("mousemove", callback);
                  canvas.addEventListener("mousedown", callback);
                  canvas.addEventListener("mouseup", callback);
                  canvas.addEventListener("touchmove", callback, {
                    passive: isTouchScrollEnabled
                  });
                  canvas.addEventListener("touchstart", callback, {
                    passive: isTouchScrollEnabled
                  });
                  canvas.addEventListener("touchend", callback);
                  return function() {
                    canvas.removeEventListener("mouseover", callback);
                    canvas.removeEventListener("mouseout", callback);
                    canvas.removeEventListener("mousemove", callback);
                    canvas.removeEventListener("mousedown", callback);
                    canvas.removeEventListener("mouseup", callback);
                    canvas.removeEventListener("touchmove", callback);
                    canvas.removeEventListener("touchstart", callback);
                    canvas.removeEventListener("touchend", callback);
                  };
                };
              },
              /* 7 */
              /***/
              (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
                __webpack_require__2.r(__webpack_exports__2);
                __webpack_require__2.d(__webpack_exports__2, {
                  /* harmony export */
                  BLANK_URL: () => (
                    /* binding */
                    BLANK_URL
                  ),
                  /* harmony export */
                  sanitizeUrl: () => (
                    /* binding */
                    sanitizeUrl
                  )
                  /* harmony export */
                });
                var invalidProtocolRegex = /^([^\w]*)(javascript|data|vbscript)/im;
                var htmlEntitiesRegex = /&#(\w+)(^\w|;)?/g;
                var htmlCtrlEntityRegex = /&(newline|tab);/gi;
                var ctrlCharactersRegex = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
                var urlSchemeRegex = /^.+(:|&colon;)/gim;
                var relativeFirstCharacters = [".", "/"];
                var BLANK_URL = "about:blank";
                function isRelativeUrlWithoutProtocol(url) {
                  return relativeFirstCharacters.indexOf(url[0]) > -1;
                }
                function decodeHtmlCharacters(str) {
                  var removedNullByte = str.replace(ctrlCharactersRegex, "");
                  return removedNullByte.replace(htmlEntitiesRegex, function(match, dec) {
                    return String.fromCharCode(dec);
                  });
                }
                function sanitizeUrl(url) {
                  if (!url) {
                    return BLANK_URL;
                  }
                  var sanitizedUrl = decodeHtmlCharacters(url).replace(htmlCtrlEntityRegex, "").replace(ctrlCharactersRegex, "").trim();
                  if (!sanitizedUrl) {
                    return BLANK_URL;
                  }
                  if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
                    return sanitizedUrl;
                  }
                  var urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);
                  if (!urlSchemeParseResults) {
                    return sanitizedUrl;
                  }
                  var urlScheme = urlSchemeParseResults[0];
                  if (invalidProtocolRegex.test(urlScheme)) {
                    return BLANK_URL;
                  }
                  return sanitizedUrl;
                }
              }
              /******/
            ];
            var __webpack_module_cache__ = {};
            function __webpack_require__(moduleId) {
              var cachedModule = __webpack_module_cache__[moduleId];
              if (cachedModule !== void 0) {
                return cachedModule.exports;
              }
              var module2 = __webpack_module_cache__[moduleId] = {
                /******/
                // no module.id needed
                /******/
                // no module.loaded needed
                /******/
                exports: {}
                /******/
              };
              __webpack_modules__[moduleId](module2, module2.exports, __webpack_require__);
              return module2.exports;
            }
            (() => {
              __webpack_require__.d = (exports2, definition) => {
                for (var key in definition) {
                  if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports2, key)) {
                    Object.defineProperty(exports2, key, { enumerable: true, get: definition[key] });
                  }
                }
              };
            })();
            (() => {
              __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
            })();
            (() => {
              __webpack_require__.r = (exports2) => {
                if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
                }
                Object.defineProperty(exports2, "__esModule", { value: true });
              };
            })();
            var __webpack_exports__ = {};
            (() => {
              __webpack_require__.r(__webpack_exports__);
              __webpack_require__.d(__webpack_exports__, {
                /* harmony export */
                Alignment: () => (
                  /* binding */
                  Alignment
                ),
                /* harmony export */
                EventType: () => (
                  /* binding */
                  EventType
                ),
                /* harmony export */
                Fit: () => (
                  /* binding */
                  Fit
                ),
                /* harmony export */
                Layout: () => (
                  /* binding */
                  Layout
                ),
                /* harmony export */
                LoopType: () => (
                  /* binding */
                  LoopType
                ),
                /* harmony export */
                Rive: () => (
                  /* binding */
                  Rive2
                ),
                /* harmony export */
                RiveEventType: () => (
                  /* binding */
                  RiveEventType
                ),
                /* harmony export */
                RiveFile: () => (
                  /* binding */
                  RiveFile
                ),
                /* harmony export */
                RuntimeLoader: () => (
                  /* binding */
                  RuntimeLoader
                ),
                /* harmony export */
                StateMachineInput: () => (
                  /* binding */
                  StateMachineInput
                ),
                /* harmony export */
                StateMachineInputType: () => (
                  /* binding */
                  StateMachineInputType
                ),
                /* harmony export */
                Testing: () => (
                  /* binding */
                  Testing
                ),
                /* harmony export */
                decodeAudio: () => (
                  /* binding */
                  decodeAudio
                ),
                /* harmony export */
                decodeFont: () => (
                  /* binding */
                  decodeFont
                ),
                /* harmony export */
                decodeImage: () => (
                  /* binding */
                  decodeImage
                )
                /* harmony export */
              });
              var _rive_advanced_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
              var package_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
              var _animation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
              var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
              var __extends = /* @__PURE__ */ function() {
                var extendStatics = function(d3, b2) {
                  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d4, b3) {
                    d4.__proto__ = b3;
                  } || function(d4, b3) {
                    for (var p3 in b3) if (Object.prototype.hasOwnProperty.call(b3, p3)) d4[p3] = b3[p3];
                  };
                  return extendStatics(d3, b2);
                };
                return function(d3, b2) {
                  if (typeof b2 !== "function" && b2 !== null)
                    throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
                  extendStatics(d3, b2);
                  function __() {
                    this.constructor = d3;
                  }
                  d3.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
                };
              }();
              var __awaiter = function(thisArg, _arguments, P2, generator) {
                function adopt(value) {
                  return value instanceof P2 ? value : new P2(function(resolve) {
                    resolve(value);
                  });
                }
                return new (P2 || (P2 = Promise))(function(resolve, reject) {
                  function fulfilled(value) {
                    try {
                      step(generator.next(value));
                    } catch (e3) {
                      reject(e3);
                    }
                  }
                  function rejected(value) {
                    try {
                      step(generator["throw"](value));
                    } catch (e3) {
                      reject(e3);
                    }
                  }
                  function step(result) {
                    result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
                  }
                  step((generator = generator.apply(thisArg, _arguments || [])).next());
                });
              };
              var __generator = function(thisArg, body) {
                var _3 = { label: 0, sent: function() {
                  if (t3[0] & 1) throw t3[1];
                  return t3[1];
                }, trys: [], ops: [] }, f3, y3, t3, g2;
                return g2 = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g2[Symbol.iterator] = function() {
                  return this;
                }), g2;
                function verb(n2) {
                  return function(v3) {
                    return step([n2, v3]);
                  };
                }
                function step(op) {
                  if (f3) throw new TypeError("Generator is already executing.");
                  while (g2 && (g2 = 0, op[0] && (_3 = 0)), _3) try {
                    if (f3 = 1, y3 && (t3 = op[0] & 2 ? y3["return"] : op[0] ? y3["throw"] || ((t3 = y3["return"]) && t3.call(y3), 0) : y3.next) && !(t3 = t3.call(y3, op[1])).done) return t3;
                    if (y3 = 0, t3) op = [op[0] & 2, t3.value];
                    switch (op[0]) {
                      case 0:
                      case 1:
                        t3 = op;
                        break;
                      case 4:
                        _3.label++;
                        return { value: op[1], done: false };
                      case 5:
                        _3.label++;
                        y3 = op[1];
                        op = [0];
                        continue;
                      case 7:
                        op = _3.ops.pop();
                        _3.trys.pop();
                        continue;
                      default:
                        if (!(t3 = _3.trys, t3 = t3.length > 0 && t3[t3.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                          _3 = 0;
                          continue;
                        }
                        if (op[0] === 3 && (!t3 || op[1] > t3[0] && op[1] < t3[3])) {
                          _3.label = op[1];
                          break;
                        }
                        if (op[0] === 6 && _3.label < t3[1]) {
                          _3.label = t3[1];
                          t3 = op;
                          break;
                        }
                        if (t3 && _3.label < t3[2]) {
                          _3.label = t3[2];
                          _3.ops.push(op);
                          break;
                        }
                        if (t3[2]) _3.ops.pop();
                        _3.trys.pop();
                        continue;
                    }
                    op = body.call(thisArg, _3);
                  } catch (e3) {
                    op = [6, e3];
                    y3 = 0;
                  } finally {
                    f3 = t3 = 0;
                  }
                  if (op[0] & 5) throw op[1];
                  return { value: op[0] ? op[1] : void 0, done: true };
                }
              };
              var Fit;
              (function(Fit2) {
                Fit2["Cover"] = "cover";
                Fit2["Contain"] = "contain";
                Fit2["Fill"] = "fill";
                Fit2["FitWidth"] = "fitWidth";
                Fit2["FitHeight"] = "fitHeight";
                Fit2["None"] = "none";
                Fit2["ScaleDown"] = "scaleDown";
                Fit2["Layout"] = "layout";
              })(Fit || (Fit = {}));
              var Alignment;
              (function(Alignment2) {
                Alignment2["Center"] = "center";
                Alignment2["TopLeft"] = "topLeft";
                Alignment2["TopCenter"] = "topCenter";
                Alignment2["TopRight"] = "topRight";
                Alignment2["CenterLeft"] = "centerLeft";
                Alignment2["CenterRight"] = "centerRight";
                Alignment2["BottomLeft"] = "bottomLeft";
                Alignment2["BottomCenter"] = "bottomCenter";
                Alignment2["BottomRight"] = "bottomRight";
              })(Alignment || (Alignment = {}));
              var Layout = (
                /** @class */
                function() {
                  function Layout2(params) {
                    var _a, _b, _c, _d, _e, _f, _g;
                    this.fit = (_a = params === null || params === void 0 ? void 0 : params.fit) !== null && _a !== void 0 ? _a : Fit.Contain;
                    this.alignment = (_b = params === null || params === void 0 ? void 0 : params.alignment) !== null && _b !== void 0 ? _b : Alignment.Center;
                    this.layoutScaleFactor = (_c = params === null || params === void 0 ? void 0 : params.layoutScaleFactor) !== null && _c !== void 0 ? _c : 1;
                    this.minX = (_d = params === null || params === void 0 ? void 0 : params.minX) !== null && _d !== void 0 ? _d : 0;
                    this.minY = (_e = params === null || params === void 0 ? void 0 : params.minY) !== null && _e !== void 0 ? _e : 0;
                    this.maxX = (_f = params === null || params === void 0 ? void 0 : params.maxX) !== null && _f !== void 0 ? _f : 0;
                    this.maxY = (_g = params === null || params === void 0 ? void 0 : params.maxY) !== null && _g !== void 0 ? _g : 0;
                  }
                  Layout2.new = function(_a) {
                    var fit = _a.fit, alignment = _a.alignment, minX = _a.minX, minY = _a.minY, maxX = _a.maxX, maxY = _a.maxY;
                    console.warn("This function is deprecated: please use `new Layout({})` instead");
                    return new Layout2({ fit, alignment, minX, minY, maxX, maxY });
                  };
                  Layout2.prototype.copyWith = function(_a) {
                    var fit = _a.fit, alignment = _a.alignment, layoutScaleFactor = _a.layoutScaleFactor, minX = _a.minX, minY = _a.minY, maxX = _a.maxX, maxY = _a.maxY;
                    return new Layout2({
                      fit: fit !== null && fit !== void 0 ? fit : this.fit,
                      alignment: alignment !== null && alignment !== void 0 ? alignment : this.alignment,
                      layoutScaleFactor: layoutScaleFactor !== null && layoutScaleFactor !== void 0 ? layoutScaleFactor : this.layoutScaleFactor,
                      minX: minX !== null && minX !== void 0 ? minX : this.minX,
                      minY: minY !== null && minY !== void 0 ? minY : this.minY,
                      maxX: maxX !== null && maxX !== void 0 ? maxX : this.maxX,
                      maxY: maxY !== null && maxY !== void 0 ? maxY : this.maxY
                    });
                  };
                  Layout2.prototype.runtimeFit = function(rive) {
                    if (this.cachedRuntimeFit)
                      return this.cachedRuntimeFit;
                    var fit;
                    if (this.fit === Fit.Cover)
                      fit = rive.Fit.cover;
                    else if (this.fit === Fit.Contain)
                      fit = rive.Fit.contain;
                    else if (this.fit === Fit.Fill)
                      fit = rive.Fit.fill;
                    else if (this.fit === Fit.FitWidth)
                      fit = rive.Fit.fitWidth;
                    else if (this.fit === Fit.FitHeight)
                      fit = rive.Fit.fitHeight;
                    else if (this.fit === Fit.ScaleDown)
                      fit = rive.Fit.scaleDown;
                    else if (this.fit === Fit.Layout)
                      fit = rive.Fit.layout;
                    else
                      fit = rive.Fit.none;
                    this.cachedRuntimeFit = fit;
                    return fit;
                  };
                  Layout2.prototype.runtimeAlignment = function(rive) {
                    if (this.cachedRuntimeAlignment)
                      return this.cachedRuntimeAlignment;
                    var alignment;
                    if (this.alignment === Alignment.TopLeft)
                      alignment = rive.Alignment.topLeft;
                    else if (this.alignment === Alignment.TopCenter)
                      alignment = rive.Alignment.topCenter;
                    else if (this.alignment === Alignment.TopRight)
                      alignment = rive.Alignment.topRight;
                    else if (this.alignment === Alignment.CenterLeft)
                      alignment = rive.Alignment.centerLeft;
                    else if (this.alignment === Alignment.CenterRight)
                      alignment = rive.Alignment.centerRight;
                    else if (this.alignment === Alignment.BottomLeft)
                      alignment = rive.Alignment.bottomLeft;
                    else if (this.alignment === Alignment.BottomCenter)
                      alignment = rive.Alignment.bottomCenter;
                    else if (this.alignment === Alignment.BottomRight)
                      alignment = rive.Alignment.bottomRight;
                    else
                      alignment = rive.Alignment.center;
                    this.cachedRuntimeAlignment = alignment;
                    return alignment;
                  };
                  return Layout2;
                }()
              );
              var RuntimeLoader = (
                /** @class */
                function() {
                  function RuntimeLoader2() {
                  }
                  RuntimeLoader2.loadRuntime = function() {
                    _rive_advanced_mjs__WEBPACK_IMPORTED_MODULE_0__["default"]({
                      // Loads Wasm bundle
                      locateFile: function() {
                        return RuntimeLoader2.wasmURL;
                      }
                    }).then(function(rive) {
                      var _a;
                      RuntimeLoader2.runtime = rive;
                      while (RuntimeLoader2.callBackQueue.length > 0) {
                        (_a = RuntimeLoader2.callBackQueue.shift()) === null || _a === void 0 ? void 0 : _a(RuntimeLoader2.runtime);
                      }
                    }).catch(function(error) {
                      var errorDetails = {
                        message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error",
                        type: (error === null || error === void 0 ? void 0 : error.name) || "Error",
                        // Some browsers may provide additional WebAssembly-specific details
                        wasmError: error instanceof WebAssembly.CompileError || error instanceof WebAssembly.RuntimeError,
                        originalError: error
                      };
                      console.debug("Rive WASM load error details:", errorDetails);
                      var backupJsdelivrUrl = "https://cdn.jsdelivr.net/npm/".concat(package_json__WEBPACK_IMPORTED_MODULE_1__.name, "@").concat(package_json__WEBPACK_IMPORTED_MODULE_1__.version, "/rive_fallback.wasm");
                      if (RuntimeLoader2.wasmURL.toLowerCase() !== backupJsdelivrUrl) {
                        console.warn("Failed to load WASM from ".concat(RuntimeLoader2.wasmURL, " (").concat(errorDetails.message, "), trying jsdelivr as a backup"));
                        RuntimeLoader2.setWasmUrl(backupJsdelivrUrl);
                        RuntimeLoader2.loadRuntime();
                      } else {
                        var errorMessage = [
                          "Could not load Rive WASM file from ".concat(RuntimeLoader2.wasmURL, " or ").concat(backupJsdelivrUrl, "."),
                          "Possible reasons:",
                          "- Network connection is down",
                          "- WebAssembly is not supported in this environment",
                          "- The WASM file is corrupted or incompatible",
                          "\nError details:",
                          "- Type: ".concat(errorDetails.type),
                          "- Message: ".concat(errorDetails.message),
                          "- WebAssembly-specific error: ".concat(errorDetails.wasmError),
                          "\nTo resolve, you may need to:",
                          "1. Check your network connection",
                          "2. Set a new WASM source via RuntimeLoader.setWasmUrl()",
                          "3. Call RuntimeLoader.loadRuntime() again"
                        ].join("\n");
                        console.error(errorMessage);
                      }
                    });
                  };
                  RuntimeLoader2.getInstance = function(callback) {
                    if (!RuntimeLoader2.isLoading) {
                      RuntimeLoader2.isLoading = true;
                      RuntimeLoader2.loadRuntime();
                    }
                    if (!RuntimeLoader2.runtime) {
                      RuntimeLoader2.callBackQueue.push(callback);
                    } else {
                      callback(RuntimeLoader2.runtime);
                    }
                  };
                  RuntimeLoader2.awaitInstance = function() {
                    return new Promise(function(resolve) {
                      return RuntimeLoader2.getInstance(function(rive) {
                        return resolve(rive);
                      });
                    });
                  };
                  RuntimeLoader2.setWasmUrl = function(url) {
                    RuntimeLoader2.wasmURL = url;
                  };
                  RuntimeLoader2.getWasmUrl = function() {
                    return RuntimeLoader2.wasmURL;
                  };
                  RuntimeLoader2.isLoading = false;
                  RuntimeLoader2.callBackQueue = [];
                  RuntimeLoader2.wasmURL = "https://unpkg.com/".concat(package_json__WEBPACK_IMPORTED_MODULE_1__.name, "@").concat(package_json__WEBPACK_IMPORTED_MODULE_1__.version, "/rive.wasm");
                  return RuntimeLoader2;
                }()
              );
              var StateMachineInputType;
              (function(StateMachineInputType2) {
                StateMachineInputType2[StateMachineInputType2["Number"] = 56] = "Number";
                StateMachineInputType2[StateMachineInputType2["Trigger"] = 58] = "Trigger";
                StateMachineInputType2[StateMachineInputType2["Boolean"] = 59] = "Boolean";
              })(StateMachineInputType || (StateMachineInputType = {}));
              var StateMachineInput = (
                /** @class */
                function() {
                  function StateMachineInput2(type, runtimeInput) {
                    this.type = type;
                    this.runtimeInput = runtimeInput;
                  }
                  Object.defineProperty(StateMachineInput2.prototype, "name", {
                    /**
                     * Returns the name of the input
                     */
                    get: function() {
                      return this.runtimeInput.name;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(StateMachineInput2.prototype, "value", {
                    /**
                     * Returns the current value of the input
                     */
                    get: function() {
                      return this.runtimeInput.value;
                    },
                    /**
                     * Sets the value of the input
                     */
                    set: function(value) {
                      this.runtimeInput.value = value;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  StateMachineInput2.prototype.fire = function() {
                    if (this.type === StateMachineInputType.Trigger) {
                      this.runtimeInput.fire();
                    }
                  };
                  StateMachineInput2.prototype.delete = function() {
                    this.runtimeInput = null;
                  };
                  return StateMachineInput2;
                }()
              );
              var RiveEventType;
              (function(RiveEventType2) {
                RiveEventType2[RiveEventType2["General"] = 128] = "General";
                RiveEventType2[RiveEventType2["OpenUrl"] = 131] = "OpenUrl";
              })(RiveEventType || (RiveEventType = {}));
              var StateMachine = (
                /** @class */
                function() {
                  function StateMachine2(stateMachine, runtime, playing, artboard) {
                    this.stateMachine = stateMachine;
                    this.playing = playing;
                    this.artboard = artboard;
                    this.inputs = [];
                    this.instance = new runtime.StateMachineInstance(stateMachine, artboard);
                    this.initInputs(runtime);
                  }
                  Object.defineProperty(StateMachine2.prototype, "name", {
                    get: function() {
                      return this.stateMachine.name;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(StateMachine2.prototype, "statesChanged", {
                    /**
                     * Returns a list of state names that have changed on this frame
                     */
                    get: function() {
                      var names = [];
                      for (var i3 = 0; i3 < this.instance.stateChangedCount(); i3++) {
                        names.push(this.instance.stateChangedNameByIndex(i3));
                      }
                      return names;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  StateMachine2.prototype.advance = function(time) {
                    this.instance.advance(time);
                  };
                  StateMachine2.prototype.advanceAndApply = function(time) {
                    this.instance.advanceAndApply(time);
                  };
                  StateMachine2.prototype.reportedEventCount = function() {
                    return this.instance.reportedEventCount();
                  };
                  StateMachine2.prototype.reportedEventAt = function(i3) {
                    return this.instance.reportedEventAt(i3);
                  };
                  StateMachine2.prototype.initInputs = function(runtime) {
                    for (var i3 = 0; i3 < this.instance.inputCount(); i3++) {
                      var input = this.instance.input(i3);
                      this.inputs.push(this.mapRuntimeInput(input, runtime));
                    }
                  };
                  StateMachine2.prototype.mapRuntimeInput = function(input, runtime) {
                    if (input.type === runtime.SMIInput.bool) {
                      return new StateMachineInput(StateMachineInputType.Boolean, input.asBool());
                    } else if (input.type === runtime.SMIInput.number) {
                      return new StateMachineInput(StateMachineInputType.Number, input.asNumber());
                    } else if (input.type === runtime.SMIInput.trigger) {
                      return new StateMachineInput(StateMachineInputType.Trigger, input.asTrigger());
                    }
                  };
                  StateMachine2.prototype.cleanup = function() {
                    this.inputs.forEach(function(input) {
                      input.delete();
                    });
                    this.inputs.length = 0;
                    this.instance.delete();
                  };
                  return StateMachine2;
                }()
              );
              var Animator = (
                /** @class */
                function() {
                  function Animator2(runtime, artboard, eventManager, animations2, stateMachines) {
                    if (animations2 === void 0) {
                      animations2 = [];
                    }
                    if (stateMachines === void 0) {
                      stateMachines = [];
                    }
                    this.runtime = runtime;
                    this.artboard = artboard;
                    this.eventManager = eventManager;
                    this.animations = animations2;
                    this.stateMachines = stateMachines;
                  }
                  Animator2.prototype.add = function(animatables, playing, fireEvent) {
                    if (fireEvent === void 0) {
                      fireEvent = true;
                    }
                    animatables = mapToStringArray(animatables);
                    if (animatables.length === 0) {
                      this.animations.forEach(function(a3) {
                        return a3.playing = playing;
                      });
                      this.stateMachines.forEach(function(m2) {
                        return m2.playing = playing;
                      });
                    } else {
                      var instancedAnimationNames = this.animations.map(function(a3) {
                        return a3.name;
                      });
                      var instancedMachineNames = this.stateMachines.map(function(m2) {
                        return m2.name;
                      });
                      for (var i3 = 0; i3 < animatables.length; i3++) {
                        var aIndex = instancedAnimationNames.indexOf(animatables[i3]);
                        var mIndex = instancedMachineNames.indexOf(animatables[i3]);
                        if (aIndex >= 0 || mIndex >= 0) {
                          if (aIndex >= 0) {
                            this.animations[aIndex].playing = playing;
                          } else {
                            this.stateMachines[mIndex].playing = playing;
                          }
                        } else {
                          var anim = this.artboard.animationByName(animatables[i3]);
                          if (anim) {
                            var newAnimation = new _animation__WEBPACK_IMPORTED_MODULE_2__.Animation(anim, this.artboard, this.runtime, playing);
                            newAnimation.advance(0);
                            newAnimation.apply(1);
                            this.animations.push(newAnimation);
                          } else {
                            var sm = this.artboard.stateMachineByName(animatables[i3]);
                            if (sm) {
                              var newStateMachine = new StateMachine(sm, this.runtime, playing, this.artboard);
                              this.stateMachines.push(newStateMachine);
                            }
                          }
                        }
                      }
                    }
                    if (fireEvent) {
                      if (playing) {
                        this.eventManager.fire({
                          type: EventType.Play,
                          data: this.playing
                        });
                      } else {
                        this.eventManager.fire({
                          type: EventType.Pause,
                          data: this.paused
                        });
                      }
                    }
                    return playing ? this.playing : this.paused;
                  };
                  Animator2.prototype.initLinearAnimations = function(animatables, playing) {
                    var instancedAnimationNames = this.animations.map(function(a3) {
                      return a3.name;
                    });
                    for (var i3 = 0; i3 < animatables.length; i3++) {
                      var aIndex = instancedAnimationNames.indexOf(animatables[i3]);
                      if (aIndex >= 0) {
                        this.animations[aIndex].playing = playing;
                      } else {
                        var anim = this.artboard.animationByName(animatables[i3]);
                        if (anim) {
                          var newAnimation = new _animation__WEBPACK_IMPORTED_MODULE_2__.Animation(anim, this.artboard, this.runtime, playing);
                          newAnimation.advance(0);
                          newAnimation.apply(1);
                          this.animations.push(newAnimation);
                        }
                      }
                    }
                  };
                  Animator2.prototype.initStateMachines = function(animatables, playing) {
                    var instancedStateMachineNames = this.stateMachines.map(function(a3) {
                      return a3.name;
                    });
                    for (var i3 = 0; i3 < animatables.length; i3++) {
                      var aIndex = instancedStateMachineNames.indexOf(animatables[i3]);
                      if (aIndex >= 0) {
                        this.stateMachines[aIndex].playing = playing;
                      } else {
                        var sm = this.artboard.stateMachineByName(animatables[i3]);
                        if (sm) {
                          var newStateMachine = new StateMachine(sm, this.runtime, playing, this.artboard);
                          this.stateMachines.push(newStateMachine);
                        } else {
                          this.initLinearAnimations([animatables[i3]], playing);
                        }
                      }
                    }
                  };
                  Animator2.prototype.play = function(animatables) {
                    return this.add(animatables, true);
                  };
                  Animator2.prototype.pause = function(animatables) {
                    return this.add(animatables, false);
                  };
                  Animator2.prototype.scrub = function(animatables, value) {
                    var forScrubbing = this.animations.filter(function(a3) {
                      return animatables.includes(a3.name);
                    });
                    forScrubbing.forEach(function(a3) {
                      return a3.scrubTo = value;
                    });
                    return forScrubbing.map(function(a3) {
                      return a3.name;
                    });
                  };
                  Object.defineProperty(Animator2.prototype, "playing", {
                    /**
                     * Returns a list of names of all animations and state machines currently
                     * playing
                     */
                    get: function() {
                      return this.animations.filter(function(a3) {
                        return a3.playing;
                      }).map(function(a3) {
                        return a3.name;
                      }).concat(this.stateMachines.filter(function(m2) {
                        return m2.playing;
                      }).map(function(m2) {
                        return m2.name;
                      }));
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Animator2.prototype, "paused", {
                    /**
                     * Returns a list of names of all animations and state machines currently
                     * paused
                     */
                    get: function() {
                      return this.animations.filter(function(a3) {
                        return !a3.playing;
                      }).map(function(a3) {
                        return a3.name;
                      }).concat(this.stateMachines.filter(function(m2) {
                        return !m2.playing;
                      }).map(function(m2) {
                        return m2.name;
                      }));
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Animator2.prototype.stop = function(animatables) {
                    var _this = this;
                    animatables = mapToStringArray(animatables);
                    var removedNames = [];
                    if (animatables.length === 0) {
                      removedNames = this.animations.map(function(a3) {
                        return a3.name;
                      }).concat(this.stateMachines.map(function(m2) {
                        return m2.name;
                      }));
                      this.animations.forEach(function(a3) {
                        return a3.cleanup();
                      });
                      this.stateMachines.forEach(function(m2) {
                        return m2.cleanup();
                      });
                      this.animations.splice(0, this.animations.length);
                      this.stateMachines.splice(0, this.stateMachines.length);
                    } else {
                      var animationsToRemove = this.animations.filter(function(a3) {
                        return animatables.includes(a3.name);
                      });
                      animationsToRemove.forEach(function(a3) {
                        a3.cleanup();
                        _this.animations.splice(_this.animations.indexOf(a3), 1);
                      });
                      var machinesToRemove = this.stateMachines.filter(function(m2) {
                        return animatables.includes(m2.name);
                      });
                      machinesToRemove.forEach(function(m2) {
                        m2.cleanup();
                        _this.stateMachines.splice(_this.stateMachines.indexOf(m2), 1);
                      });
                      removedNames = animationsToRemove.map(function(a3) {
                        return a3.name;
                      }).concat(machinesToRemove.map(function(m2) {
                        return m2.name;
                      }));
                    }
                    this.eventManager.fire({
                      type: EventType.Stop,
                      data: removedNames
                    });
                    return removedNames;
                  };
                  Object.defineProperty(Animator2.prototype, "isPlaying", {
                    /**
                     * Returns true if at least one animation is active
                     */
                    get: function() {
                      return this.animations.reduce(function(acc, curr) {
                        return acc || curr.playing;
                      }, false) || this.stateMachines.reduce(function(acc, curr) {
                        return acc || curr.playing;
                      }, false);
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Animator2.prototype, "isPaused", {
                    /**
                     * Returns true if all animations are paused and there's at least one animation
                     */
                    get: function() {
                      return !this.isPlaying && (this.animations.length > 0 || this.stateMachines.length > 0);
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Animator2.prototype, "isStopped", {
                    /**
                     * Returns true if there are no playing or paused animations/state machines
                     */
                    get: function() {
                      return this.animations.length === 0 && this.stateMachines.length === 0;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Animator2.prototype.atLeastOne = function(playing, fireEvent) {
                    if (fireEvent === void 0) {
                      fireEvent = true;
                    }
                    var instancedName;
                    if (this.animations.length === 0 && this.stateMachines.length === 0) {
                      if (this.artboard.animationCount() > 0) {
                        this.add([instancedName = this.artboard.animationByIndex(0).name], playing, fireEvent);
                      } else if (this.artboard.stateMachineCount() > 0) {
                        this.add([instancedName = this.artboard.stateMachineByIndex(0).name], playing, fireEvent);
                      }
                    }
                    return instancedName;
                  };
                  Animator2.prototype.handleLooping = function() {
                    for (var _i = 0, _a = this.animations.filter(function(a3) {
                      return a3.playing;
                    }); _i < _a.length; _i++) {
                      var animation = _a[_i];
                      if (animation.loopValue === 0 && animation.loopCount) {
                        animation.loopCount = 0;
                        this.stop(animation.name);
                      } else if (animation.loopValue === 1 && animation.loopCount) {
                        this.eventManager.fire({
                          type: EventType.Loop,
                          data: { animation: animation.name, type: LoopType.Loop }
                        });
                        animation.loopCount = 0;
                      } else if (animation.loopValue === 2 && animation.loopCount > 1) {
                        this.eventManager.fire({
                          type: EventType.Loop,
                          data: { animation: animation.name, type: LoopType.PingPong }
                        });
                        animation.loopCount = 0;
                      }
                    }
                  };
                  Animator2.prototype.handleStateChanges = function() {
                    var statesChanged = [];
                    for (var _i = 0, _a = this.stateMachines.filter(function(sm) {
                      return sm.playing;
                    }); _i < _a.length; _i++) {
                      var stateMachine = _a[_i];
                      statesChanged.push.apply(statesChanged, stateMachine.statesChanged);
                    }
                    if (statesChanged.length > 0) {
                      this.eventManager.fire({
                        type: EventType.StateChange,
                        data: statesChanged
                      });
                    }
                  };
                  Animator2.prototype.handleAdvancing = function(time) {
                    this.eventManager.fire({
                      type: EventType.Advance,
                      data: time
                    });
                  };
                  return Animator2;
                }()
              );
              var EventType;
              (function(EventType2) {
                EventType2["Load"] = "load";
                EventType2["LoadError"] = "loaderror";
                EventType2["Play"] = "play";
                EventType2["Pause"] = "pause";
                EventType2["Stop"] = "stop";
                EventType2["Loop"] = "loop";
                EventType2["Draw"] = "draw";
                EventType2["Advance"] = "advance";
                EventType2["StateChange"] = "statechange";
                EventType2["RiveEvent"] = "riveevent";
                EventType2["AudioStatusChange"] = "audiostatuschange";
              })(EventType || (EventType = {}));
              var LoopType;
              (function(LoopType2) {
                LoopType2["OneShot"] = "oneshot";
                LoopType2["Loop"] = "loop";
                LoopType2["PingPong"] = "pingpong";
              })(LoopType || (LoopType = {}));
              var EventManager = (
                /** @class */
                function() {
                  function EventManager2(listeners) {
                    if (listeners === void 0) {
                      listeners = [];
                    }
                    this.listeners = listeners;
                  }
                  EventManager2.prototype.getListeners = function(type) {
                    return this.listeners.filter(function(e3) {
                      return e3.type === type;
                    });
                  };
                  EventManager2.prototype.add = function(listener) {
                    if (!this.listeners.includes(listener)) {
                      this.listeners.push(listener);
                    }
                  };
                  EventManager2.prototype.remove = function(listener) {
                    for (var i3 = 0; i3 < this.listeners.length; i3++) {
                      var currentListener = this.listeners[i3];
                      if (currentListener.type === listener.type) {
                        if (currentListener.callback === listener.callback) {
                          this.listeners.splice(i3, 1);
                          break;
                        }
                      }
                    }
                  };
                  EventManager2.prototype.removeAll = function(type) {
                    var _this = this;
                    if (!type) {
                      this.listeners.splice(0, this.listeners.length);
                    } else {
                      this.listeners.filter(function(l3) {
                        return l3.type === type;
                      }).forEach(function(l3) {
                        return _this.remove(l3);
                      });
                    }
                  };
                  EventManager2.prototype.fire = function(event) {
                    var eventListeners = this.getListeners(event.type);
                    eventListeners.forEach(function(listener) {
                      return listener.callback(event);
                    });
                  };
                  return EventManager2;
                }()
              );
              var TaskQueueManager = (
                /** @class */
                function() {
                  function TaskQueueManager2(eventManager) {
                    this.eventManager = eventManager;
                    this.queue = [];
                  }
                  TaskQueueManager2.prototype.add = function(task) {
                    this.queue.push(task);
                  };
                  TaskQueueManager2.prototype.process = function() {
                    while (this.queue.length > 0) {
                      var task = this.queue.shift();
                      if (task === null || task === void 0 ? void 0 : task.action) {
                        task.action();
                      }
                      if (task === null || task === void 0 ? void 0 : task.event) {
                        this.eventManager.fire(task.event);
                      }
                    }
                  };
                  return TaskQueueManager2;
                }()
              );
              var SystemAudioStatus;
              (function(SystemAudioStatus2) {
                SystemAudioStatus2[SystemAudioStatus2["AVAILABLE"] = 0] = "AVAILABLE";
                SystemAudioStatus2[SystemAudioStatus2["UNAVAILABLE"] = 1] = "UNAVAILABLE";
              })(SystemAudioStatus || (SystemAudioStatus = {}));
              var AudioManager = (
                /** @class */
                function(_super) {
                  __extends(AudioManager2, _super);
                  function AudioManager2() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this._started = false;
                    _this._enabled = false;
                    _this._status = SystemAudioStatus.UNAVAILABLE;
                    return _this;
                  }
                  AudioManager2.prototype.delay = function(time) {
                    return __awaiter(this, void 0, void 0, function() {
                      return __generator(this, function(_a) {
                        return [2, new Promise(function(resolve) {
                          return setTimeout(resolve, time);
                        })];
                      });
                    });
                  };
                  AudioManager2.prototype.timeout = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      return __generator(this, function(_a) {
                        return [2, new Promise(function(_3, reject) {
                          return setTimeout(reject, 50);
                        })];
                      });
                    });
                  };
                  AudioManager2.prototype.reportToListeners = function() {
                    this.fire({ type: EventType.AudioStatusChange });
                    this.removeAll();
                  };
                  AudioManager2.prototype.enableAudio = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      return __generator(this, function(_a) {
                        if (!this._enabled) {
                          this._enabled = true;
                          this._status = SystemAudioStatus.AVAILABLE;
                          this.reportToListeners();
                        }
                        return [
                          2
                          /*return*/
                        ];
                      });
                    });
                  };
                  AudioManager2.prototype.testAudio = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      var _a;
                      return __generator(this, function(_b) {
                        switch (_b.label) {
                          case 0:
                            if (!(this._status === SystemAudioStatus.UNAVAILABLE && this._audioContext !== null)) return [3, 4];
                            _b.label = 1;
                          case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4, Promise.race([this._audioContext.resume(), this.timeout()])];
                          case 2:
                            _b.sent();
                            this.enableAudio();
                            return [3, 4];
                          case 3:
                            _a = _b.sent();
                            return [3, 4];
                          case 4:
                            return [
                              2
                              /*return*/
                            ];
                        }
                      });
                    });
                  };
                  AudioManager2.prototype._establishAudio = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      return __generator(this, function(_a) {
                        switch (_a.label) {
                          case 0:
                            if (!!this._started) return [3, 5];
                            this._started = true;
                            if (!(typeof window == "undefined")) return [3, 1];
                            this.enableAudio();
                            return [3, 5];
                          case 1:
                            this._audioContext = new AudioContext();
                            this.listenForUserAction();
                            _a.label = 2;
                          case 2:
                            if (!(this._status === SystemAudioStatus.UNAVAILABLE)) return [3, 5];
                            return [4, this.testAudio()];
                          case 3:
                            _a.sent();
                            return [4, this.delay(1e3)];
                          case 4:
                            _a.sent();
                            return [3, 2];
                          case 5:
                            return [
                              2
                              /*return*/
                            ];
                        }
                      });
                    });
                  };
                  AudioManager2.prototype.listenForUserAction = function() {
                    var _this = this;
                    var _clickListener = function() {
                      return __awaiter(_this, void 0, void 0, function() {
                        return __generator(this, function(_a) {
                          this.enableAudio();
                          return [
                            2
                            /*return*/
                          ];
                        });
                      });
                    };
                    document.addEventListener("pointerdown", _clickListener, {
                      once: true
                    });
                  };
                  AudioManager2.prototype.establishAudio = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      return __generator(this, function(_a) {
                        this._establishAudio();
                        return [
                          2
                          /*return*/
                        ];
                      });
                    });
                  };
                  Object.defineProperty(AudioManager2.prototype, "systemVolume", {
                    get: function() {
                      if (this._status === SystemAudioStatus.UNAVAILABLE) {
                        this.testAudio();
                        return 0;
                      }
                      return 1;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(AudioManager2.prototype, "status", {
                    get: function() {
                      return this._status;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  return AudioManager2;
                }(EventManager)
              );
              var audioManager = new AudioManager();
              var FakeResizeObserver = (
                /** @class */
                function() {
                  function FakeResizeObserver2() {
                  }
                  FakeResizeObserver2.prototype.observe = function() {
                  };
                  FakeResizeObserver2.prototype.unobserve = function() {
                  };
                  FakeResizeObserver2.prototype.disconnect = function() {
                  };
                  return FakeResizeObserver2;
                }()
              );
              var MyResizeObserver = globalThis.ResizeObserver || FakeResizeObserver;
              var ObjectObservers = (
                /** @class */
                function() {
                  function ObjectObservers2() {
                    var _this = this;
                    this._elementsMap = /* @__PURE__ */ new Map();
                    this._onObservedEntry = function(entry) {
                      var observed = _this._elementsMap.get(entry.target);
                      if (observed !== null) {
                        observed.onResize(entry.target.clientWidth == 0 || entry.target.clientHeight == 0);
                      } else {
                        _this._resizeObserver.unobserve(entry.target);
                      }
                    };
                    this._onObserved = function(entries) {
                      entries.forEach(_this._onObservedEntry);
                    };
                    this._resizeObserver = new MyResizeObserver(this._onObserved);
                  }
                  ObjectObservers2.prototype.add = function(element, onResize) {
                    var observed = {
                      onResize,
                      element
                    };
                    this._elementsMap.set(element, observed);
                    this._resizeObserver.observe(element);
                    return observed;
                  };
                  ObjectObservers2.prototype.remove = function(observed) {
                    this._resizeObserver.unobserve(observed.element);
                    this._elementsMap.delete(observed.element);
                  };
                  return ObjectObservers2;
                }()
              );
              var observers = new ObjectObservers();
              var RiveFile = (
                /** @class */
                function() {
                  function RiveFile2(params) {
                    this.enableRiveAssetCDN = true;
                    this.referenceCount = 0;
                    this.src = params.src;
                    this.buffer = params.buffer;
                    if (params.assetLoader)
                      this.assetLoader = params.assetLoader;
                    this.enableRiveAssetCDN = typeof params.enableRiveAssetCDN == "boolean" ? params.enableRiveAssetCDN : true;
                    this.eventManager = new EventManager();
                    if (params.onLoad)
                      this.on(EventType.Load, params.onLoad);
                    if (params.onLoadError)
                      this.on(EventType.LoadError, params.onLoadError);
                  }
                  RiveFile2.prototype.initData = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      var _a, loader, _b;
                      return __generator(this, function(_c) {
                        switch (_c.label) {
                          case 0:
                            if (!this.src) return [3, 2];
                            _a = this;
                            return [4, loadRiveFile(this.src)];
                          case 1:
                            _a.buffer = _c.sent();
                            _c.label = 2;
                          case 2:
                            if (this.assetLoader) {
                              loader = new this.runtime.CustomFileAssetLoader({
                                loadContents: this.assetLoader
                              });
                            }
                            _b = this;
                            return [4, this.runtime.load(new Uint8Array(this.buffer), loader, this.enableRiveAssetCDN)];
                          case 3:
                            _b.file = _c.sent();
                            if (this.file !== null) {
                              this.eventManager.fire({
                                type: EventType.Load,
                                data: this
                              });
                            } else {
                              this.eventManager.fire({
                                type: EventType.LoadError,
                                data: null
                              });
                              throw new Error(RiveFile2.fileLoadErrorMessage);
                            }
                            return [
                              2
                              /*return*/
                            ];
                        }
                      });
                    });
                  };
                  RiveFile2.prototype.init = function() {
                    return __awaiter(this, void 0, void 0, function() {
                      var _a;
                      return __generator(this, function(_b) {
                        switch (_b.label) {
                          case 0:
                            if (!this.src && !this.buffer) {
                              throw new Error(RiveFile2.missingErrorMessage);
                            }
                            _a = this;
                            return [4, RuntimeLoader.awaitInstance()];
                          case 1:
                            _a.runtime = _b.sent();
                            return [4, this.initData()];
                          case 2:
                            _b.sent();
                            return [
                              2
                              /*return*/
                            ];
                        }
                      });
                    });
                  };
                  RiveFile2.prototype.on = function(type, callback) {
                    this.eventManager.add({
                      type,
                      callback
                    });
                  };
                  RiveFile2.prototype.off = function(type, callback) {
                    this.eventManager.remove({
                      type,
                      callback
                    });
                  };
                  RiveFile2.prototype.cleanup = function() {
                    var _a;
                    this.referenceCount -= 1;
                    if (this.referenceCount <= 0) {
                      this.removeAllRiveEventListeners();
                      (_a = this.file) === null || _a === void 0 ? void 0 : _a.delete();
                    }
                  };
                  RiveFile2.prototype.removeAllRiveEventListeners = function(type) {
                    this.eventManager.removeAll(type);
                  };
                  RiveFile2.prototype.getInstance = function() {
                    if (this.file !== null) {
                      this.referenceCount += 1;
                      return this.file;
                    }
                  };
                  RiveFile2.missingErrorMessage = "Rive source file or data buffer required";
                  RiveFile2.fileLoadErrorMessage = "The file failed to load";
                  return RiveFile2;
                }()
              );
              var Rive2 = (
                /** @class */
                function() {
                  function Rive3(params) {
                    var _this = this;
                    var _a;
                    this.loaded = false;
                    this._observed = null;
                    this.readyForPlaying = false;
                    this.artboard = null;
                    this.eventCleanup = null;
                    this.shouldDisableRiveListeners = false;
                    this.automaticallyHandleEvents = false;
                    this.enableRiveAssetCDN = true;
                    this._volume = 1;
                    this._artboardWidth = void 0;
                    this._artboardHeight = void 0;
                    this._devicePixelRatioUsed = 1;
                    this._hasZeroSize = false;
                    this._audioEventListener = null;
                    this.durations = [];
                    this.frameTimes = [];
                    this.frameCount = 0;
                    this.isTouchScrollEnabled = false;
                    this.onCanvasResize = function(hasZeroSize) {
                      _this._hasZeroSize = hasZeroSize;
                      if (!_this._layout.maxX || !_this._layout.maxY) {
                        _this.resizeToCanvas();
                      }
                    };
                    this.renderSecondTimer = 0;
                    this.canvas = params.canvas;
                    if (params.canvas.constructor === HTMLCanvasElement) {
                      this._observed = observers.add(this.canvas, this.onCanvasResize);
                    }
                    this.src = params.src;
                    this.buffer = params.buffer;
                    this.riveFile = params.riveFile;
                    this.layout = (_a = params.layout) !== null && _a !== void 0 ? _a : new Layout();
                    this.shouldDisableRiveListeners = !!params.shouldDisableRiveListeners;
                    this.isTouchScrollEnabled = !!params.isTouchScrollEnabled;
                    this.automaticallyHandleEvents = !!params.automaticallyHandleEvents;
                    this.enableRiveAssetCDN = params.enableRiveAssetCDN === void 0 ? true : params.enableRiveAssetCDN;
                    this.eventManager = new EventManager();
                    if (params.onLoad)
                      this.on(EventType.Load, params.onLoad);
                    if (params.onLoadError)
                      this.on(EventType.LoadError, params.onLoadError);
                    if (params.onPlay)
                      this.on(EventType.Play, params.onPlay);
                    if (params.onPause)
                      this.on(EventType.Pause, params.onPause);
                    if (params.onStop)
                      this.on(EventType.Stop, params.onStop);
                    if (params.onLoop)
                      this.on(EventType.Loop, params.onLoop);
                    if (params.onStateChange)
                      this.on(EventType.StateChange, params.onStateChange);
                    if (params.onAdvance)
                      this.on(EventType.Advance, params.onAdvance);
                    if (params.onload && !params.onLoad)
                      this.on(EventType.Load, params.onload);
                    if (params.onloaderror && !params.onLoadError)
                      this.on(EventType.LoadError, params.onloaderror);
                    if (params.onplay && !params.onPlay)
                      this.on(EventType.Play, params.onplay);
                    if (params.onpause && !params.onPause)
                      this.on(EventType.Pause, params.onpause);
                    if (params.onstop && !params.onStop)
                      this.on(EventType.Stop, params.onstop);
                    if (params.onloop && !params.onLoop)
                      this.on(EventType.Loop, params.onloop);
                    if (params.onstatechange && !params.onStateChange)
                      this.on(EventType.StateChange, params.onstatechange);
                    if (params.assetLoader)
                      this.assetLoader = params.assetLoader;
                    this.taskQueue = new TaskQueueManager(this.eventManager);
                    this.init({
                      src: this.src,
                      buffer: this.buffer,
                      riveFile: this.riveFile,
                      autoplay: params.autoplay,
                      animations: params.animations,
                      stateMachines: params.stateMachines,
                      artboard: params.artboard,
                      useOffscreenRenderer: params.useOffscreenRenderer
                    });
                  }
                  Rive3.new = function(params) {
                    console.warn("This function is deprecated: please use `new Rive({})` instead");
                    return new Rive3(params);
                  };
                  Rive3.prototype.onSystemAudioChanged = function() {
                    this.volume = this._volume;
                  };
                  Rive3.prototype.init = function(_a) {
                    var _this = this;
                    var src = _a.src, buffer = _a.buffer, riveFile = _a.riveFile, animations2 = _a.animations, stateMachines = _a.stateMachines, artboard = _a.artboard, _b = _a.autoplay, autoplay = _b === void 0 ? false : _b, _c = _a.useOffscreenRenderer, useOffscreenRenderer = _c === void 0 ? false : _c;
                    this.src = src;
                    this.buffer = buffer;
                    this.riveFile = riveFile;
                    if (!this.src && !this.buffer && !this.riveFile) {
                      throw new Error(Rive3.missingErrorMessage);
                    }
                    var startingAnimationNames = mapToStringArray(animations2);
                    var startingStateMachineNames = mapToStringArray(stateMachines);
                    this.loaded = false;
                    this.readyForPlaying = false;
                    RuntimeLoader.awaitInstance().then(function(runtime) {
                      _this.runtime = runtime;
                      _this.removeRiveListeners();
                      _this.deleteRiveRenderer();
                      _this.renderer = _this.runtime.makeRenderer(_this.canvas, useOffscreenRenderer);
                      if (!(_this.canvas.width || _this.canvas.height)) {
                        _this.resizeDrawingSurfaceToCanvas();
                      }
                      _this.initData(artboard, startingAnimationNames, startingStateMachineNames, autoplay).then(function() {
                        return _this.setupRiveListeners();
                      }).catch(function(e3) {
                        console.error(e3);
                      });
                    }).catch(function(e3) {
                      console.error(e3);
                    });
                  };
                  Rive3.prototype.setupRiveListeners = function(riveListenerOptions) {
                    var _this = this;
                    if (!this.shouldDisableRiveListeners) {
                      var activeStateMachines = (this.animator.stateMachines || []).filter(function(sm) {
                        return sm.playing && _this.runtime.hasListeners(sm.instance);
                      }).map(function(sm) {
                        return sm.instance;
                      });
                      var touchScrollEnabledOption = this.isTouchScrollEnabled;
                      if (riveListenerOptions && "isTouchScrollEnabled" in riveListenerOptions) {
                        touchScrollEnabledOption = riveListenerOptions.isTouchScrollEnabled;
                      }
                      this.eventCleanup = (0, _utils__WEBPACK_IMPORTED_MODULE_3__.registerTouchInteractions)({
                        canvas: this.canvas,
                        artboard: this.artboard,
                        stateMachines: activeStateMachines,
                        renderer: this.renderer,
                        rive: this.runtime,
                        fit: this._layout.runtimeFit(this.runtime),
                        alignment: this._layout.runtimeAlignment(this.runtime),
                        isTouchScrollEnabled: touchScrollEnabledOption,
                        layoutScaleFactor: this._layout.layoutScaleFactor
                      });
                    }
                  };
                  Rive3.prototype.removeRiveListeners = function() {
                    if (this.eventCleanup) {
                      this.eventCleanup();
                      this.eventCleanup = null;
                    }
                  };
                  Rive3.prototype.initializeAudio = function() {
                    var _this = this;
                    var _a;
                    if (audioManager.status == SystemAudioStatus.UNAVAILABLE) {
                      if (((_a = this.artboard) === null || _a === void 0 ? void 0 : _a.hasAudio) && this._audioEventListener === null) {
                        this._audioEventListener = {
                          type: EventType.AudioStatusChange,
                          callback: function() {
                            return _this.onSystemAudioChanged();
                          }
                        };
                        audioManager.add(this._audioEventListener);
                        audioManager.establishAudio();
                      }
                    }
                  };
                  Rive3.prototype.initArtboardSize = function() {
                    if (!this.artboard)
                      return;
                    this._artboardWidth = this.artboard.width = this._artboardWidth || this.artboard.width;
                    this._artboardHeight = this.artboard.height = this._artboardHeight || this.artboard.height;
                  };
                  Rive3.prototype.initData = function(artboardName, animationNames, stateMachineNames, autoplay) {
                    var _a;
                    return __awaiter(this, void 0, void 0, function() {
                      var error_1, msg;
                      return __generator(this, function(_b) {
                        switch (_b.label) {
                          case 0:
                            _b.trys.push([0, 3, , 4]);
                            if (!(this.riveFile == null)) return [3, 2];
                            this.riveFile = new RiveFile({
                              src: this.src,
                              buffer: this.buffer,
                              enableRiveAssetCDN: this.enableRiveAssetCDN,
                              assetLoader: this.assetLoader
                            });
                            return [4, this.riveFile.init()];
                          case 1:
                            _b.sent();
                            _b.label = 2;
                          case 2:
                            this.file = this.riveFile.getInstance();
                            this.initArtboard(artboardName, animationNames, stateMachineNames, autoplay);
                            this.initArtboardSize();
                            this.initializeAudio();
                            this.loaded = true;
                            this.eventManager.fire({
                              type: EventType.Load,
                              data: (_a = this.src) !== null && _a !== void 0 ? _a : "buffer"
                            });
                            this.readyForPlaying = true;
                            this.taskQueue.process();
                            this.drawFrame();
                            return [2, Promise.resolve()];
                          case 3:
                            error_1 = _b.sent();
                            msg = "Problem loading file; may be corrupt!";
                            console.warn(msg);
                            this.eventManager.fire({ type: EventType.LoadError, data: msg });
                            return [2, Promise.reject(msg)];
                          case 4:
                            return [
                              2
                              /*return*/
                            ];
                        }
                      });
                    });
                  };
                  Rive3.prototype.initArtboard = function(artboardName, animationNames, stateMachineNames, autoplay) {
                    if (!this.file) {
                      return;
                    }
                    var rootArtboard = artboardName ? this.file.artboardByName(artboardName) : this.file.defaultArtboard();
                    if (!rootArtboard) {
                      var msg = "Invalid artboard name or no default artboard";
                      console.warn(msg);
                      this.eventManager.fire({ type: EventType.LoadError, data: msg });
                      return;
                    }
                    this.artboard = rootArtboard;
                    rootArtboard.volume = this._volume * audioManager.systemVolume;
                    if (this.artboard.animationCount() < 1) {
                      var msg = "Artboard has no animations";
                      this.eventManager.fire({ type: EventType.LoadError, data: msg });
                      throw msg;
                    }
                    this.animator = new Animator(this.runtime, this.artboard, this.eventManager);
                    var instanceNames;
                    if (animationNames.length > 0 || stateMachineNames.length > 0) {
                      instanceNames = animationNames.concat(stateMachineNames);
                      this.animator.initLinearAnimations(animationNames, autoplay);
                      this.animator.initStateMachines(stateMachineNames, autoplay);
                    } else {
                      instanceNames = [this.animator.atLeastOne(autoplay, false)];
                    }
                    this.taskQueue.add({
                      event: {
                        type: autoplay ? EventType.Play : EventType.Pause,
                        data: instanceNames
                      }
                    });
                  };
                  Rive3.prototype.drawFrame = function() {
                    this.startRendering();
                  };
                  Rive3.prototype.draw = function(time, onSecond) {
                    this.frameRequestId = null;
                    var before = performance.now();
                    if (!this.lastRenderTime) {
                      this.lastRenderTime = time;
                    }
                    this.renderSecondTimer += time - this.lastRenderTime;
                    if (this.renderSecondTimer > 5e3) {
                      this.renderSecondTimer = 0;
                      onSecond === null || onSecond === void 0 ? void 0 : onSecond();
                    }
                    var elapsedTime = (time - this.lastRenderTime) / 1e3;
                    this.lastRenderTime = time;
                    var activeAnimations = this.animator.animations.filter(function(a3) {
                      return a3.playing || a3.needsScrub;
                    }).sort(function(first) {
                      return first.needsScrub ? -1 : 1;
                    });
                    for (var _i = 0, activeAnimations_1 = activeAnimations; _i < activeAnimations_1.length; _i++) {
                      var animation = activeAnimations_1[_i];
                      animation.advance(elapsedTime);
                      if (animation.instance.didLoop) {
                        animation.loopCount += 1;
                      }
                      animation.apply(1);
                    }
                    var activeStateMachines = this.animator.stateMachines.filter(function(a3) {
                      return a3.playing;
                    });
                    for (var _a = 0, activeStateMachines_1 = activeStateMachines; _a < activeStateMachines_1.length; _a++) {
                      var stateMachine = activeStateMachines_1[_a];
                      var numEventsReported = stateMachine.reportedEventCount();
                      if (numEventsReported) {
                        for (var i3 = 0; i3 < numEventsReported; i3++) {
                          var event_1 = stateMachine.reportedEventAt(i3);
                          if (event_1) {
                            if (event_1.type === RiveEventType.OpenUrl) {
                              this.eventManager.fire({
                                type: EventType.RiveEvent,
                                data: event_1
                              });
                              if (this.automaticallyHandleEvents) {
                                var newAnchorTag = document.createElement("a");
                                var _b = event_1, url = _b.url, target2 = _b.target;
                                var sanitizedUrl = (0, _utils__WEBPACK_IMPORTED_MODULE_3__.sanitizeUrl)(url);
                                url && newAnchorTag.setAttribute("href", sanitizedUrl);
                                target2 && newAnchorTag.setAttribute("target", target2);
                                if (sanitizedUrl && sanitizedUrl !== _utils__WEBPACK_IMPORTED_MODULE_3__.BLANK_URL) {
                                  newAnchorTag.click();
                                }
                              }
                            } else {
                              this.eventManager.fire({
                                type: EventType.RiveEvent,
                                data: event_1
                              });
                            }
                          }
                        }
                      }
                      stateMachine.advanceAndApply(elapsedTime);
                    }
                    if (this.animator.stateMachines.length == 0) {
                      this.artboard.advance(elapsedTime);
                    }
                    var renderer = this.renderer;
                    renderer.clear();
                    renderer.save();
                    this.alignRenderer();
                    if (!this._hasZeroSize) {
                      this.artboard.draw(renderer);
                    }
                    renderer.restore();
                    renderer.flush();
                    this.animator.handleLooping();
                    this.animator.handleStateChanges();
                    this.animator.handleAdvancing(elapsedTime);
                    this.frameCount++;
                    var after = performance.now();
                    this.frameTimes.push(after);
                    this.durations.push(after - before);
                    while (this.frameTimes[0] <= after - 1e3) {
                      this.frameTimes.shift();
                      this.durations.shift();
                    }
                    if (this.animator.isPlaying) {
                      this.startRendering();
                    } else if (this.animator.isPaused) {
                      this.lastRenderTime = 0;
                    } else if (this.animator.isStopped) {
                      this.lastRenderTime = 0;
                    }
                  };
                  Rive3.prototype.alignRenderer = function() {
                    var _a = this, renderer = _a.renderer, runtime = _a.runtime, _layout = _a._layout, artboard = _a.artboard;
                    renderer.align(_layout.runtimeFit(runtime), _layout.runtimeAlignment(runtime), {
                      minX: _layout.minX,
                      minY: _layout.minY,
                      maxX: _layout.maxX,
                      maxY: _layout.maxY
                    }, artboard.bounds, this._devicePixelRatioUsed * _layout.layoutScaleFactor);
                  };
                  Object.defineProperty(Rive3.prototype, "fps", {
                    get: function() {
                      return this.durations.length;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "frameTime", {
                    get: function() {
                      if (this.durations.length === 0) {
                        return 0;
                      }
                      return (this.durations.reduce(function(a3, b2) {
                        return a3 + b2;
                      }, 0) / this.durations.length).toFixed(4);
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.prototype.cleanup = function() {
                    var _a;
                    this.stopRendering();
                    this.cleanupInstances();
                    if (this._observed !== null) {
                      observers.remove(this._observed);
                    }
                    this.removeRiveListeners();
                    (_a = this.riveFile) === null || _a === void 0 ? void 0 : _a.cleanup();
                    this.riveFile = null;
                    this.file = null;
                    this.deleteRiveRenderer();
                    if (this._audioEventListener !== null) {
                      audioManager.remove(this._audioEventListener);
                      this._audioEventListener = null;
                    }
                  };
                  Rive3.prototype.deleteRiveRenderer = function() {
                    var _a;
                    (_a = this.renderer) === null || _a === void 0 ? void 0 : _a.delete();
                    this.renderer = null;
                  };
                  Rive3.prototype.cleanupInstances = function() {
                    if (this.eventCleanup !== null) {
                      this.eventCleanup();
                    }
                    this.stop();
                    if (this.artboard) {
                      this.artboard.delete();
                      this.artboard = null;
                    }
                  };
                  Rive3.prototype.retrieveTextRun = function(textRunName) {
                    var _a;
                    if (!textRunName) {
                      console.warn("No text run name provided");
                      return;
                    }
                    if (!this.artboard) {
                      console.warn("Tried to access text run, but the Artboard is null");
                      return;
                    }
                    var textRun = this.artboard.textRun(textRunName);
                    if (!textRun) {
                      console.warn("Could not access a text run with name '".concat(textRunName, "' in the '").concat((_a = this.artboard) === null || _a === void 0 ? void 0 : _a.name, "' Artboard. Note that you must rename a text run node in the Rive editor to make it queryable at runtime."));
                      return;
                    }
                    return textRun;
                  };
                  Rive3.prototype.getTextRunValue = function(textRunName) {
                    var textRun = this.retrieveTextRun(textRunName);
                    return textRun ? textRun.text : void 0;
                  };
                  Rive3.prototype.setTextRunValue = function(textRunName, textRunValue) {
                    var textRun = this.retrieveTextRun(textRunName);
                    if (textRun) {
                      textRun.text = textRunValue;
                    }
                  };
                  Rive3.prototype.play = function(animationNames, autoplay) {
                    var _this = this;
                    animationNames = mapToStringArray(animationNames);
                    if (!this.readyForPlaying) {
                      this.taskQueue.add({
                        action: function() {
                          return _this.play(animationNames, autoplay);
                        }
                      });
                      return;
                    }
                    this.animator.play(animationNames);
                    if (this.eventCleanup) {
                      this.eventCleanup();
                    }
                    this.setupRiveListeners();
                    this.startRendering();
                  };
                  Rive3.prototype.pause = function(animationNames) {
                    var _this = this;
                    animationNames = mapToStringArray(animationNames);
                    if (!this.readyForPlaying) {
                      this.taskQueue.add({
                        action: function() {
                          return _this.pause(animationNames);
                        }
                      });
                      return;
                    }
                    if (this.eventCleanup) {
                      this.eventCleanup();
                    }
                    this.animator.pause(animationNames);
                  };
                  Rive3.prototype.scrub = function(animationNames, value) {
                    var _this = this;
                    animationNames = mapToStringArray(animationNames);
                    if (!this.readyForPlaying) {
                      this.taskQueue.add({
                        action: function() {
                          return _this.scrub(animationNames, value);
                        }
                      });
                      return;
                    }
                    this.animator.scrub(animationNames, value || 0);
                    this.drawFrame();
                  };
                  Rive3.prototype.stop = function(animationNames) {
                    var _this = this;
                    animationNames = mapToStringArray(animationNames);
                    if (!this.readyForPlaying) {
                      this.taskQueue.add({
                        action: function() {
                          return _this.stop(animationNames);
                        }
                      });
                      return;
                    }
                    if (this.animator) {
                      this.animator.stop(animationNames);
                    }
                    if (this.eventCleanup) {
                      this.eventCleanup();
                    }
                  };
                  Rive3.prototype.reset = function(params) {
                    var _a;
                    var artBoardName = params === null || params === void 0 ? void 0 : params.artboard;
                    var animationNames = mapToStringArray(params === null || params === void 0 ? void 0 : params.animations);
                    var stateMachineNames = mapToStringArray(params === null || params === void 0 ? void 0 : params.stateMachines);
                    var autoplay = (_a = params === null || params === void 0 ? void 0 : params.autoplay) !== null && _a !== void 0 ? _a : false;
                    this.cleanupInstances();
                    this.initArtboard(artBoardName, animationNames, stateMachineNames, autoplay);
                    this.taskQueue.process();
                  };
                  Rive3.prototype.load = function(params) {
                    this.file = null;
                    this.stop();
                    this.init(params);
                  };
                  Object.defineProperty(Rive3.prototype, "layout", {
                    /**
                     * Returns the current layout. Note that layout should be treated as
                     * immutable. If you want to change the layout, create a new one use the
                     * layout setter
                     */
                    get: function() {
                      return this._layout;
                    },
                    // Sets a new layout
                    set: function(layout) {
                      this._layout = layout;
                      if (!layout.maxX || !layout.maxY) {
                        this.resizeToCanvas();
                      }
                      if (this.loaded && !this.animator.isPlaying) {
                        this.drawFrame();
                      }
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.prototype.resizeToCanvas = function() {
                    this._layout = this.layout.copyWith({
                      minX: 0,
                      minY: 0,
                      maxX: this.canvas.width,
                      maxY: this.canvas.height
                    });
                  };
                  Rive3.prototype.resizeDrawingSurfaceToCanvas = function(customDevicePixelRatio) {
                    if (this.canvas instanceof HTMLCanvasElement && !!window) {
                      var _a = this.canvas.getBoundingClientRect(), width = _a.width, height = _a.height;
                      var dpr = customDevicePixelRatio || window.devicePixelRatio || 1;
                      this.devicePixelRatioUsed = dpr;
                      this.canvas.width = dpr * width;
                      this.canvas.height = dpr * height;
                      this.startRendering();
                      this.resizeToCanvas();
                      if (this.layout.fit === Fit.Layout) {
                        var scaleFactor = this._layout.layoutScaleFactor;
                        this.artboard.width = width / scaleFactor;
                        this.artboard.height = height / scaleFactor;
                      }
                    }
                  };
                  Object.defineProperty(Rive3.prototype, "source", {
                    // Returns the animation source, which may be undefined
                    get: function() {
                      return this.src;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "activeArtboard", {
                    /**
                     * Returns the name of the active artboard
                     */
                    get: function() {
                      return this.artboard ? this.artboard.name : "";
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "animationNames", {
                    // Returns a list of animation names on the chosen artboard
                    get: function() {
                      if (!this.loaded || !this.artboard) {
                        return [];
                      }
                      var animationNames = [];
                      for (var i3 = 0; i3 < this.artboard.animationCount(); i3++) {
                        animationNames.push(this.artboard.animationByIndex(i3).name);
                      }
                      return animationNames;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "stateMachineNames", {
                    /**
                     * Returns a list of state machine names from the current artboard
                     */
                    get: function() {
                      if (!this.loaded || !this.artboard) {
                        return [];
                      }
                      var stateMachineNames = [];
                      for (var i3 = 0; i3 < this.artboard.stateMachineCount(); i3++) {
                        stateMachineNames.push(this.artboard.stateMachineByIndex(i3).name);
                      }
                      return stateMachineNames;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.prototype.stateMachineInputs = function(name) {
                    if (!this.loaded) {
                      return;
                    }
                    var stateMachine = this.animator.stateMachines.find(function(m2) {
                      return m2.name === name;
                    });
                    return stateMachine === null || stateMachine === void 0 ? void 0 : stateMachine.inputs;
                  };
                  Rive3.prototype.retrieveInputAtPath = function(name, path) {
                    if (!name) {
                      console.warn("No input name provided for path '".concat(path, "'"));
                      return;
                    }
                    if (!this.artboard) {
                      console.warn("Tried to access input: '".concat(name, "', at path: '").concat(path, "', but the Artboard is null"));
                      return;
                    }
                    var input = this.artboard.inputByPath(name, path);
                    if (!input) {
                      console.warn("Could not access an input with name: '".concat(name, "', at path:'").concat(path, "'"));
                      return;
                    }
                    return input;
                  };
                  Rive3.prototype.setBooleanStateAtPath = function(inputName, value, path) {
                    var input = this.retrieveInputAtPath(inputName, path);
                    if (!input)
                      return;
                    if (input.type === StateMachineInputType.Boolean) {
                      input.asBool().value = value;
                    } else {
                      console.warn("Input with name: '".concat(inputName, "', at path:'").concat(path, "' is not a boolean"));
                    }
                  };
                  Rive3.prototype.setNumberStateAtPath = function(inputName, value, path) {
                    var input = this.retrieveInputAtPath(inputName, path);
                    if (!input)
                      return;
                    if (input.type === StateMachineInputType.Number) {
                      input.asNumber().value = value;
                    } else {
                      console.warn("Input with name: '".concat(inputName, "', at path:'").concat(path, "' is not a number"));
                    }
                  };
                  Rive3.prototype.fireStateAtPath = function(inputName, path) {
                    var input = this.retrieveInputAtPath(inputName, path);
                    if (!input)
                      return;
                    if (input.type === StateMachineInputType.Trigger) {
                      input.asTrigger().fire();
                    } else {
                      console.warn("Input with name: '".concat(inputName, "', at path:'").concat(path, "' is not a trigger"));
                    }
                  };
                  Rive3.prototype.retrieveTextAtPath = function(name, path) {
                    if (!name) {
                      console.warn("No text name provided for path '".concat(path, "'"));
                      return;
                    }
                    if (!path) {
                      console.warn("No path provided for text '".concat(name, "'"));
                      return;
                    }
                    if (!this.artboard) {
                      console.warn("Tried to access text: '".concat(name, "', at path: '").concat(path, "', but the Artboard is null"));
                      return;
                    }
                    var text = this.artboard.textByPath(name, path);
                    if (!text) {
                      console.warn("Could not access text with name: '".concat(name, "', at path:'").concat(path, "'"));
                      return;
                    }
                    return text;
                  };
                  Rive3.prototype.getTextRunValueAtPath = function(textName, path) {
                    var run = this.retrieveTextAtPath(textName, path);
                    if (!run) {
                      console.warn("Could not get text with name: '".concat(textName, "', at path:'").concat(path, "'"));
                      return;
                    }
                    return run.text;
                  };
                  Rive3.prototype.setTextRunValueAtPath = function(textName, value, path) {
                    var run = this.retrieveTextAtPath(textName, path);
                    if (!run) {
                      console.warn("Could not set text with name: '".concat(textName, "', at path:'").concat(path, "'"));
                      return;
                    }
                    run.text = value;
                  };
                  Object.defineProperty(Rive3.prototype, "playingStateMachineNames", {
                    // Returns a list of playing machine names
                    get: function() {
                      if (!this.loaded) {
                        return [];
                      }
                      return this.animator.stateMachines.filter(function(m2) {
                        return m2.playing;
                      }).map(function(m2) {
                        return m2.name;
                      });
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "playingAnimationNames", {
                    // Returns a list of playing animation names
                    get: function() {
                      if (!this.loaded) {
                        return [];
                      }
                      return this.animator.animations.filter(function(a3) {
                        return a3.playing;
                      }).map(function(a3) {
                        return a3.name;
                      });
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "pausedAnimationNames", {
                    // Returns a list of paused animation names
                    get: function() {
                      if (!this.loaded) {
                        return [];
                      }
                      return this.animator.animations.filter(function(a3) {
                        return !a3.playing;
                      }).map(function(a3) {
                        return a3.name;
                      });
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "pausedStateMachineNames", {
                    /**
                     *  Returns a list of paused machine names
                     * @returns a list of state machine names that are paused
                     */
                    get: function() {
                      if (!this.loaded) {
                        return [];
                      }
                      return this.animator.stateMachines.filter(function(m2) {
                        return !m2.playing;
                      }).map(function(m2) {
                        return m2.name;
                      });
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "isPlaying", {
                    /**
                     * @returns true if any animation is playing
                     */
                    get: function() {
                      return this.animator.isPlaying;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "isPaused", {
                    /**
                     * @returns true if all instanced animations are paused
                     */
                    get: function() {
                      return this.animator.isPaused;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "isStopped", {
                    /**
                     * @returns true if no animations are playing or paused
                     */
                    get: function() {
                      return this.animator.isStopped;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "bounds", {
                    /**
                     * @returns the bounds of the current artboard, or undefined if the artboard
                     * isn't loaded yet.
                     */
                    get: function() {
                      return this.artboard ? this.artboard.bounds : void 0;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.prototype.on = function(type, callback) {
                    this.eventManager.add({
                      type,
                      callback
                    });
                  };
                  Rive3.prototype.off = function(type, callback) {
                    this.eventManager.remove({
                      type,
                      callback
                    });
                  };
                  Rive3.prototype.unsubscribe = function(type, callback) {
                    console.warn("This function is deprecated: please use `off()` instead.");
                    this.off(type, callback);
                  };
                  Rive3.prototype.removeAllRiveEventListeners = function(type) {
                    this.eventManager.removeAll(type);
                  };
                  Rive3.prototype.unsubscribeAll = function(type) {
                    console.warn("This function is deprecated: please use `removeAllRiveEventListeners()` instead.");
                    this.removeAllRiveEventListeners(type);
                  };
                  Rive3.prototype.stopRendering = function() {
                    if (this.loaded && this.frameRequestId) {
                      if (this.runtime.cancelAnimationFrame) {
                        this.runtime.cancelAnimationFrame(this.frameRequestId);
                      } else {
                        cancelAnimationFrame(this.frameRequestId);
                      }
                      this.frameRequestId = null;
                    }
                  };
                  Rive3.prototype.startRendering = function() {
                    if (this.loaded && this.artboard && !this.frameRequestId) {
                      if (this.runtime.requestAnimationFrame) {
                        this.frameRequestId = this.runtime.requestAnimationFrame(this.draw.bind(this));
                      } else {
                        this.frameRequestId = requestAnimationFrame(this.draw.bind(this));
                      }
                    }
                  };
                  Rive3.prototype.enableFPSCounter = function(fpsCallback) {
                    this.runtime.enableFPSCounter(fpsCallback);
                  };
                  Rive3.prototype.disableFPSCounter = function() {
                    this.runtime.disableFPSCounter();
                  };
                  Object.defineProperty(Rive3.prototype, "contents", {
                    /**
                     * Returns the contents of a Rive file: the artboards, animations, and state machines
                     */
                    get: function() {
                      if (!this.loaded) {
                        return void 0;
                      }
                      var riveContents = {
                        artboards: []
                      };
                      for (var i3 = 0; i3 < this.file.artboardCount(); i3++) {
                        var artboard = this.file.artboardByIndex(i3);
                        var artboardContents = {
                          name: artboard.name,
                          animations: [],
                          stateMachines: []
                        };
                        for (var j3 = 0; j3 < artboard.animationCount(); j3++) {
                          var animation = artboard.animationByIndex(j3);
                          artboardContents.animations.push(animation.name);
                        }
                        for (var k3 = 0; k3 < artboard.stateMachineCount(); k3++) {
                          var stateMachine = artboard.stateMachineByIndex(k3);
                          var name_1 = stateMachine.name;
                          var instance = new this.runtime.StateMachineInstance(stateMachine, artboard);
                          var inputContents = [];
                          for (var l3 = 0; l3 < instance.inputCount(); l3++) {
                            var input = instance.input(l3);
                            inputContents.push({ name: input.name, type: input.type });
                          }
                          artboardContents.stateMachines.push({
                            name: name_1,
                            inputs: inputContents
                          });
                        }
                        riveContents.artboards.push(artboardContents);
                      }
                      return riveContents;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "volume", {
                    /**
                     * Getter / Setter for the volume of the artboard
                     */
                    get: function() {
                      if (this.artboard && this.artboard.volume !== this._volume) {
                        this._volume = this.artboard.volume;
                      }
                      return this._volume;
                    },
                    set: function(value) {
                      this._volume = value;
                      if (this.artboard) {
                        this.artboard.volume = value * audioManager.systemVolume;
                      }
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "artboardWidth", {
                    /**
                     * The width of the artboard.
                     *
                     * This will return 0 if the artboard is not loaded yet and a custom
                     * width has not been set.
                     *
                     * Do not set this value manually when using {@link resizeDrawingSurfaceToCanvas}
                     * with a {@link Layout.fit} of {@link Fit.Layout}, as the artboard width is
                     * automatically set.
                     */
                    get: function() {
                      var _a;
                      if (this.artboard) {
                        return this.artboard.width;
                      }
                      return (_a = this._artboardWidth) !== null && _a !== void 0 ? _a : 0;
                    },
                    set: function(value) {
                      this._artboardWidth = value;
                      if (this.artboard) {
                        this.artboard.width = value;
                      }
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Object.defineProperty(Rive3.prototype, "artboardHeight", {
                    /**
                     * The height of the artboard.
                     *
                     * This will return 0 if the artboard is not loaded yet and a custom
                     * height has not been set.
                     *
                     * Do not set this value manually when using {@link resizeDrawingSurfaceToCanvas}
                     * with a {@link Layout.fit} of {@link Fit.Layout}, as the artboard height is
                     * automatically set.
                     */
                    get: function() {
                      var _a;
                      if (this.artboard) {
                        return this.artboard.height;
                      }
                      return (_a = this._artboardHeight) !== null && _a !== void 0 ? _a : 0;
                    },
                    set: function(value) {
                      this._artboardHeight = value;
                      if (this.artboard) {
                        this.artboard.height = value;
                      }
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.prototype.resetArtboardSize = function() {
                    if (this.artboard) {
                      this.artboard.resetArtboardSize();
                      this._artboardWidth = this.artboard.width;
                      this._artboardHeight = this.artboard.height;
                    } else {
                      this._artboardWidth = void 0;
                      this._artboardHeight = void 0;
                    }
                  };
                  Object.defineProperty(Rive3.prototype, "devicePixelRatioUsed", {
                    /**
                     * The device pixel ratio used in rendering and canvas/artboard resizing.
                     *
                     * This value will be overidden by the device pixel ratio used in
                     * {@link resizeDrawingSurfaceToCanvas}. If you use that method, do not set this value.
                     */
                    get: function() {
                      return this._devicePixelRatioUsed;
                    },
                    set: function(value) {
                      this._devicePixelRatioUsed = value;
                    },
                    enumerable: false,
                    configurable: true
                  });
                  Rive3.missingErrorMessage = "Rive source file or data buffer required";
                  return Rive3;
                }()
              );
              var loadRiveFile = function(src) {
                return __awaiter(void 0, void 0, void 0, function() {
                  var req, res, buffer;
                  return __generator(this, function(_a) {
                    switch (_a.label) {
                      case 0:
                        req = new Request(src);
                        return [4, fetch(req)];
                      case 1:
                        res = _a.sent();
                        return [4, res.arrayBuffer()];
                      case 2:
                        buffer = _a.sent();
                        return [2, buffer];
                    }
                  });
                });
              };
              var mapToStringArray = function(obj) {
                if (typeof obj === "string") {
                  return [obj];
                } else if (obj instanceof Array) {
                  return obj;
                }
                return [];
              };
              var Testing = {
                EventManager,
                TaskQueueManager
              };
              var decodeAudio = function(bytes) {
                return new Promise(function(resolve) {
                  return RuntimeLoader.getInstance(function(rive) {
                    rive.decodeAudio(bytes, resolve);
                  });
                });
              };
              var decodeImage = function(bytes) {
                return new Promise(function(resolve) {
                  return RuntimeLoader.getInstance(function(rive) {
                    rive.decodeImage(bytes, resolve);
                  });
                });
              };
              var decodeFont = function(bytes) {
                return new Promise(function(resolve) {
                  return RuntimeLoader.getInstance(function(rive) {
                    rive.decodeFont(bytes, resolve);
                  });
                });
              };
            })();
            return __webpack_exports__;
          })()
        );
      });
    }
  });

  // pages/onboarding/app/messages.js
  var OnboardingMessages = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta["injectName"]} injectName
     * @internal
     */
    constructor(messaging2, injectName) {
      this.messaging = messaging2;
      this.injectName = injectName;
    }
    /**
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "stepDefinitions": {
     *     "systemSettings": {
     *       "rows": ["dock", "import", "default-browser"]
     *     }
     *   },
     *   "order": "v2",
     *   "exclude": ["dockSingle"],
     *   "locale": "en"
     * }
     * ```
     *
     * In that example, the native layer is providing the list of rows that should be shown in the
     * systemSettings step, overriding the default list provided in `data.js`.
     *
     * @returns {Promise<InitResponse>}
     */
    async init() {
      return await this.messaging.request("init");
    }
    /**
     * Sends a notification to the native layer that the user has completed a step
     *
     * @param {StepCompleteParams} params
     */
    stepCompleted(params) {
      this.messaging.notify("stepCompleted", params);
    }
    /**
     * Sent when the user wants to enable or disable the bookmarks bar
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setBookmarksBar(params) {
      this.messaging.notify("setBookmarksBar", params);
    }
    /**
     * Sent when the user wants to enable or disable the session restore setting
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setSessionRestore(params) {
      this.messaging.notify("setSessionRestore", params);
    }
    /**
     * Sent when the user wants to enable or disable the home button
     * Note: Although the home button can placed in multiple places in the browser taskbar, this
     * application will only ever send enabled/disabled to the native layer
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setShowHomeButton(params) {
      this.messaging.notify("setShowHomeButton", params);
    }
    /**
     * Sent when the user wants to keep the application in the dock/taskbar.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestDockOptIn() {
      return this.messaging.request("requestDockOptIn");
    }
    /**
     * Sent when the user wants to import data. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestImport() {
      return this.messaging.request("requestImport");
    }
    /**
     * Sent when the user wants to set DuckDuckGo as their default browser. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestSetAsDefault() {
      return this.messaging.request("requestSetAsDefault");
    }
    /**
     * Sent when onboarding is complete and the user has chosen to go to settings
     */
    dismissToSettings() {
      this.messaging.notify("dismissToSettings");
    }
    /**
     * Sent when the "Start Browsing" button has been clicked.
     */
    dismissToAddressBar() {
      this.messaging.notify("dismissToAddressBar");
    }
    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {import('./types').ErrorBoundaryEvent["error"]} params
     */
    reportPageException(params) {
      this.messaging.notify("reportPageException", params);
    }
    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException(params) {
      this.messaging.notify("reportInitException", params);
    }
  };

  // ../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var o;
  var r;
  var f;
  var e;
  var c;
  var s;
  var a;
  var h = {};
  var v = [];
  var p = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var y = Array.isArray;
  function d(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function w(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u3, t3) {
    var i3, o3, r3, f3 = {};
    for (r3 in u3) "key" == r3 ? i3 = u3[r3] : "ref" == r3 ? o3 = u3[r3] : f3[r3] = u3[r3];
    if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (r3 in l3.defaultProps) void 0 === f3[r3] && (f3[r3] = l3.defaultProps[r3]);
    return g(l3, f3, i3, o3, null);
  }
  function g(n2, t3, i3, o3, r3) {
    var f3 = { type: n2, props: t3, key: i3, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r3 ? ++u : r3, __i: -1, __u: 0 };
    return null == r3 && null != l.vnode && l.vnode(f3), f3;
  }
  function b(n2) {
    return n2.children;
  }
  function k(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function x(n2, l3) {
    if (null == l3) return n2.__ ? x(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? x(n2) : null;
  }
  function C(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
      return C(n2);
    }
  }
  function S(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !M.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(M);
  }
  function M() {
    var n2, u3, t3, o3, r3, e3, c3, s3;
    for (i.sort(f); n2 = i.shift(); ) n2.__d && (u3 = i.length, o3 = void 0, e3 = (r3 = (t3 = n2).__v).__e, c3 = [], s3 = [], t3.__P && ((o3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(o3), O(t3.__P, o3, r3, t3.__n, t3.__P.namespaceURI, 32 & r3.__u ? [e3] : null, c3, null == e3 ? x(r3) : e3, !!(32 & r3.__u), s3), o3.__v = r3.__v, o3.__.__k[o3.__i] = o3, j(c3, o3, s3), o3.__e != e3 && C(o3)), i.length > u3 && i.sort(f));
    M.__r = 0;
  }
  function P(n2, l3, u3, t3, i3, o3, r3, f3, e3, c3, s3) {
    var a3, p3, y3, d3, w3, _3 = t3 && t3.__k || v, g2 = l3.length;
    for (u3.__d = e3, $(u3, l3, _3), e3 = u3.__d, a3 = 0; a3 < g2; a3++) null != (y3 = u3.__k[a3]) && (p3 = -1 === y3.__i ? h : _3[y3.__i] || h, y3.__i = a3, O(n2, y3, p3, i3, o3, r3, f3, e3, c3, s3), d3 = y3.__e, y3.ref && p3.ref != y3.ref && (p3.ref && N(p3.ref, null, y3), s3.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), 65536 & y3.__u || p3.__k === y3.__k ? e3 = I(y3, e3, n2) : "function" == typeof y3.type && void 0 !== y3.__d ? e3 = y3.__d : d3 && (e3 = d3.nextSibling), y3.__d = void 0, y3.__u &= -196609);
    u3.__d = e3, u3.__e = w3;
  }
  function $(n2, l3, u3) {
    var t3, i3, o3, r3, f3, e3 = l3.length, c3 = u3.length, s3 = c3, a3 = 0;
    for (n2.__k = [], t3 = 0; t3 < e3; t3++) null != (i3 = l3[t3]) && "boolean" != typeof i3 && "function" != typeof i3 ? (r3 = t3 + a3, (i3 = n2.__k[t3] = "string" == typeof i3 || "number" == typeof i3 || "bigint" == typeof i3 || i3.constructor == String ? g(null, i3, null, null, null) : y(i3) ? g(b, { children: i3 }, null, null, null) : void 0 === i3.constructor && i3.__b > 0 ? g(i3.type, i3.props, i3.key, i3.ref ? i3.ref : null, i3.__v) : i3).__ = n2, i3.__b = n2.__b + 1, o3 = null, -1 !== (f3 = i3.__i = L(i3, u3, r3, s3)) && (s3--, (o3 = u3[f3]) && (o3.__u |= 131072)), null == o3 || null === o3.__v ? (-1 == f3 && a3--, "function" != typeof i3.type && (i3.__u |= 65536)) : f3 !== r3 && (f3 == r3 - 1 ? a3-- : f3 == r3 + 1 ? a3++ : (f3 > r3 ? a3-- : a3++, i3.__u |= 65536))) : i3 = n2.__k[t3] = null;
    if (s3) for (t3 = 0; t3 < c3; t3++) null != (o3 = u3[t3]) && 0 == (131072 & o3.__u) && (o3.__e == n2.__d && (n2.__d = x(o3)), V(o3, o3));
  }
  function I(n2, l3, u3) {
    var t3, i3;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++) t3[i3] && (t3[i3].__ = n2, l3 = I(t3[i3], l3, u3));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !u3.contains(l3) && (l3 = x(n2)), u3.insertBefore(n2.__e, l3 || null), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 === l3.nodeType);
    return l3;
  }
  function L(n2, l3, u3, t3) {
    var i3 = n2.key, o3 = n2.type, r3 = u3 - 1, f3 = u3 + 1, e3 = l3[u3];
    if (null === e3 || e3 && i3 == e3.key && o3 === e3.type && 0 == (131072 & e3.__u)) return u3;
    if (t3 > (null != e3 && 0 == (131072 & e3.__u) ? 1 : 0)) for (; r3 >= 0 || f3 < l3.length; ) {
      if (r3 >= 0) {
        if ((e3 = l3[r3]) && 0 == (131072 & e3.__u) && i3 == e3.key && o3 === e3.type) return r3;
        r3--;
      }
      if (f3 < l3.length) {
        if ((e3 = l3[f3]) && 0 == (131072 & e3.__u) && i3 == e3.key && o3 === e3.type) return f3;
        f3++;
      }
    }
    return -1;
  }
  function T(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || p.test(l3) ? u3 : u3 + "px";
  }
  function A(n2, l3, u3, t3, i3) {
    var o3;
    n: if ("style" === l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u3 && l3 in u3 || T(n2.style, l3, "");
      if (u3) for (l3 in u3) t3 && u3[l3] === t3[l3] || T(n2.style, l3, u3[l3]);
    }
    else if ("o" === l3[0] && "n" === l3[1]) o3 = l3 !== (l3 = l3.replace(/(PointerCapture)$|Capture$/i, "$1")), l3 = l3.toLowerCase() in n2 || "onFocusOut" === l3 || "onFocusIn" === l3 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = e, n2.addEventListener(l3, o3 ? s : c, o3)) : n2.removeEventListener(l3, o3 ? s : c, o3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" !== l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
  }
  function F(n2) {
    return function(u3) {
      if (this.l) {
        var t3 = this.l[u3.type + n2];
        if (null == u3.t) u3.t = e++;
        else if (u3.t < t3.u) return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function O(n2, u3, t3, i3, o3, r3, f3, e3, c3, s3) {
    var a3, h3, v3, p3, w3, _3, g2, m2, x3, C3, S2, M2, $2, I2, H, L2, T3 = u3.type;
    if (void 0 !== u3.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), r3 = [e3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n: if ("function" == typeof T3) try {
      if (m2 = u3.props, x3 = "prototype" in T3 && T3.prototype.render, C3 = (a3 = T3.contextType) && i3[a3.__c], S2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? g2 = (h3 = u3.__c = t3.__c).__ = h3.__E : (x3 ? u3.__c = h3 = new T3(m2, S2) : (u3.__c = h3 = new k(m2, S2), h3.constructor = T3, h3.render = q), C3 && C3.sub(h3), h3.props = m2, h3.state || (h3.state = {}), h3.context = S2, h3.__n = i3, v3 = h3.__d = true, h3.__h = [], h3._sb = []), x3 && null == h3.__s && (h3.__s = h3.state), x3 && null != T3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, T3.getDerivedStateFromProps(m2, h3.__s))), p3 = h3.props, w3 = h3.state, h3.__v = u3, v3) x3 && null == T3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), x3 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
      else {
        if (x3 && null == T3.getDerivedStateFromProps && m2 !== p3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(m2, S2), !h3.__e && (null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(m2, h3.__s, S2) || u3.__v === t3.__v)) {
          for (u3.__v !== t3.__v && (h3.props = m2, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
            n3 && (n3.__ = u3);
          }), M2 = 0; M2 < h3._sb.length; M2++) h3.__h.push(h3._sb[M2]);
          h3._sb = [], h3.__h.length && f3.push(h3);
          break n;
        }
        null != h3.componentWillUpdate && h3.componentWillUpdate(m2, h3.__s, S2), x3 && null != h3.componentDidUpdate && h3.__h.push(function() {
          h3.componentDidUpdate(p3, w3, _3);
        });
      }
      if (h3.context = S2, h3.props = m2, h3.__P = n2, h3.__e = false, $2 = l.__r, I2 = 0, x3) {
        for (h3.state = h3.__s, h3.__d = false, $2 && $2(u3), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++) h3.__h.push(h3._sb[H]);
        h3._sb = [];
      } else do {
        h3.__d = false, $2 && $2(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
      } while (h3.__d && ++I2 < 25);
      h3.state = h3.__s, null != h3.getChildContext && (i3 = d(d({}, i3), h3.getChildContext())), x3 && !v3 && null != h3.getSnapshotBeforeUpdate && (_3 = h3.getSnapshotBeforeUpdate(p3, w3)), P(n2, y(L2 = null != a3 && a3.type === b && null == a3.key ? a3.props.children : a3) ? L2 : [L2], u3, t3, i3, o3, r3, f3, e3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && f3.push(h3), g2 && (h3.__E = h3.__ = null);
    } catch (n3) {
      if (u3.__v = null, c3 || null != r3) {
        for (u3.__u |= c3 ? 160 : 128; e3 && 8 === e3.nodeType && e3.nextSibling; ) e3 = e3.nextSibling;
        r3[r3.indexOf(e3)] = null, u3.__e = e3;
      } else u3.__e = t3.__e, u3.__k = t3.__k;
      l.__e(n3, u3, t3);
    }
    else null == r3 && u3.__v === t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : u3.__e = z(t3.__e, u3, t3, i3, o3, r3, f3, c3, s3);
    (a3 = l.diffed) && a3(u3);
  }
  function j(n2, u3, t3) {
    u3.__d = void 0;
    for (var i3 = 0; i3 < t3.length; i3++) N(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function z(u3, t3, i3, o3, r3, f3, e3, c3, s3) {
    var a3, v3, p3, d3, _3, g2, m2, b2 = i3.props, k3 = t3.props, C3 = t3.type;
    if ("svg" === C3 ? r3 = "http://www.w3.org/2000/svg" : "math" === C3 ? r3 = "http://www.w3.org/1998/Math/MathML" : r3 || (r3 = "http://www.w3.org/1999/xhtml"), null != f3) {
      for (a3 = 0; a3 < f3.length; a3++) if ((_3 = f3[a3]) && "setAttribute" in _3 == !!C3 && (C3 ? _3.localName === C3 : 3 === _3.nodeType)) {
        u3 = _3, f3[a3] = null;
        break;
      }
    }
    if (null == u3) {
      if (null === C3) return document.createTextNode(k3);
      u3 = document.createElementNS(r3, C3, k3.is && k3), c3 && (l.__m && l.__m(t3, f3), c3 = false), f3 = null;
    }
    if (null === C3) b2 === k3 || c3 && u3.data === k3 || (u3.data = k3);
    else {
      if (f3 = f3 && n.call(u3.childNodes), b2 = i3.props || h, !c3 && null != f3) for (b2 = {}, a3 = 0; a3 < u3.attributes.length; a3++) b2[(_3 = u3.attributes[a3]).name] = _3.value;
      for (a3 in b2) if (_3 = b2[a3], "children" == a3) ;
      else if ("dangerouslySetInnerHTML" == a3) p3 = _3;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
        A(u3, a3, null, _3, r3);
      }
      for (a3 in k3) _3 = k3[a3], "children" == a3 ? d3 = _3 : "dangerouslySetInnerHTML" == a3 ? v3 = _3 : "value" == a3 ? g2 = _3 : "checked" == a3 ? m2 = _3 : c3 && "function" != typeof _3 || b2[a3] === _3 || A(u3, a3, _3, b2[a3], r3);
      if (v3) c3 || p3 && (v3.__html === p3.__html || v3.__html === u3.innerHTML) || (u3.innerHTML = v3.__html), t3.__k = [];
      else if (p3 && (u3.innerHTML = ""), P(u3, y(d3) ? d3 : [d3], t3, i3, o3, "foreignObject" === C3 ? "http://www.w3.org/1999/xhtml" : r3, f3, e3, f3 ? f3[0] : i3.__k && x(i3, 0), c3, s3), null != f3) for (a3 = f3.length; a3--; ) w(f3[a3]);
      c3 || (a3 = "value", "progress" === C3 && null == g2 ? u3.removeAttribute("value") : void 0 !== g2 && (g2 !== u3[a3] || "progress" === C3 && !g2 || "option" === C3 && g2 !== b2[a3]) && A(u3, a3, g2, b2[a3], r3), a3 = "checked", void 0 !== m2 && m2 !== u3[a3] && A(u3, a3, m2, b2[a3], r3));
    }
    return u3;
  }
  function N(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function V(n2, u3, t3) {
    var i3, o3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current !== n2.__e || N(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k) for (o3 = 0; o3 < i3.length; o3++) i3[o3] && V(i3[o3], u3, t3 || "function" != typeof n2.type);
    t3 || w(n2.__e), n2.__c = n2.__ = n2.__e = n2.__d = void 0;
  }
  function q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function B(u3, t3, i3) {
    var o3, r3, f3, e3;
    l.__ && l.__(u3, t3), r3 = (o3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, f3 = [], e3 = [], O(t3, u3 = (!o3 && i3 || t3).__k = _(b, null, [u3]), r3 || h, h, t3.namespaceURI, !o3 && i3 ? [i3] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, f3, !o3 && i3 ? i3 : r3 ? r3.__e : t3.firstChild, o3, e3), j(f3, u3, e3);
  }
  function G(n2, l3) {
    var u3 = { __c: l3 = "__cC" + a++, __: n2, Consumer: function(n3, l4) {
      return n3.children(l4);
    }, Provider: function(n3) {
      var u4, t3;
      return this.getChildContext || (u4 = /* @__PURE__ */ new Set(), (t3 = {})[l3] = this, this.getChildContext = function() {
        return t3;
      }, this.componentWillUnmount = function() {
        u4 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value !== n4.value && u4.forEach(function(n5) {
          n5.__e = true, S(n5);
        });
      }, this.sub = function(n4) {
        u4.add(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u4 && u4.delete(n4), l4 && l4.call(n4);
        };
      }), n3.children;
    } };
    return u3.Provider.__ = u3.Consumer.contextType = u3;
  }
  n = v.slice, l = { __e: function(n2, l3, u3, t3) {
    for (var i3, o3, r3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((o3 = i3.constructor) && null != o3.getDerivedStateFromError && (i3.setState(o3.getDerivedStateFromError(n2)), r3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), r3 = i3.__d), r3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && null == n2.constructor;
  }, k.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u3), this.props)), n2 && d(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), S(this));
  }, k.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), S(this));
  }, k.prototype.render = b, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, M.__r = 0, e = 0, c = F(false), s = F(true), a = 0;

  // ../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m = c2.unmount;
  var s2 = c2.__;
  function d2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
  }
  function h2(n2) {
    return o2 = 1, p2(D, n2);
  }
  function p2(n2, u3, i3) {
    var o3 = d2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.u)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        })) return !c3 || c3.call(this, n3, t3, r3);
        var i4 = false;
        return u4.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), !(!i4 && o3.__c.props === n3) && (!c3 || c3.call(this, n3, t3, r3));
      };
      r2.u = true;
      var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u4 = c3;
          c3 = void 0, f3(n3, t3, r3), c3 = u4;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f3;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u3) {
    var i3 = d2(t2++, 3);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.i = u3, r2.__H.__h.push(i3));
  }
  function _2(n2, u3) {
    var i3 = d2(t2++, 4);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.i = u3, r2.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u3 = d2(t2++, 7);
    return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
  }
  function q2(n2, t3) {
    return o2 = 8, T2(function() {
      return n2;
    }, t3);
  }
  function x2(n2) {
    var u3 = r2.context[n2.__c], i3 = d2(t2++, 9);
    return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
    } catch (t3) {
      n2.__H.__h = [], c2.__e(t3, n2.__v);
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.i = n3.__N = void 0;
    })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
      n3.i && (n3.__H = n3.i), n3.i = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m && m(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 100);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u3 = n2.__c;
    "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // pages/onboarding/app/components/App.module.css
  var App_default = {
    main: "App_main",
    container: "App_container",
    slideout: "App_slideout"
  };

  // pages/onboarding/app/components/Stack.module.css
  var Stack_default = {
    stack: "Stack_stack"
  };

  // ../node_modules/@formkit/auto-animate/index.mjs
  var parents = /* @__PURE__ */ new Set();
  var coords = /* @__PURE__ */ new WeakMap();
  var siblings = /* @__PURE__ */ new WeakMap();
  var animations = /* @__PURE__ */ new WeakMap();
  var intersections = /* @__PURE__ */ new WeakMap();
  var intervals = /* @__PURE__ */ new WeakMap();
  var options = /* @__PURE__ */ new WeakMap();
  var debounces = /* @__PURE__ */ new WeakMap();
  var enabled = /* @__PURE__ */ new WeakSet();
  var root;
  var scrollX = 0;
  var scrollY = 0;
  var TGT = "__aa_tgt";
  var DEL = "__aa_del";
  var NEW = "__aa_new";
  var handleMutations = (mutations2) => {
    const elements = getElements(mutations2);
    if (elements) {
      elements.forEach((el) => animate(el));
    }
  };
  var handleResizes = (entries) => {
    entries.forEach((entry) => {
      if (entry.target === root)
        updateAllPos();
      if (coords.has(entry.target))
        updatePos(entry.target);
    });
  };
  function observePosition(el) {
    const oldObserver = intersections.get(el);
    oldObserver === null || oldObserver === void 0 ? void 0 : oldObserver.disconnect();
    let rect = coords.get(el);
    let invocations = 0;
    const buffer = 5;
    if (!rect) {
      rect = getCoords(el);
      coords.set(el, rect);
    }
    const { offsetWidth, offsetHeight } = root;
    const rootMargins = [
      rect.top - buffer,
      offsetWidth - (rect.left + buffer + rect.width),
      offsetHeight - (rect.top + buffer + rect.height),
      rect.left - buffer
    ];
    const rootMargin = rootMargins.map((px) => `${-1 * Math.floor(px)}px`).join(" ");
    const observer = new IntersectionObserver(() => {
      ++invocations > 1 && updatePos(el);
    }, {
      root,
      threshold: 1,
      rootMargin
    });
    observer.observe(el);
    intersections.set(el, observer);
  }
  function updatePos(el) {
    clearTimeout(debounces.get(el));
    const optionsOrPlugin = getOptions(el);
    const delay = isPlugin(optionsOrPlugin) ? 500 : optionsOrPlugin.duration;
    debounces.set(el, setTimeout(async () => {
      const currentAnimation = animations.get(el);
      try {
        await (currentAnimation === null || currentAnimation === void 0 ? void 0 : currentAnimation.finished);
        coords.set(el, getCoords(el));
        observePosition(el);
      } catch {
      }
    }, delay));
  }
  function updateAllPos() {
    clearTimeout(debounces.get(root));
    debounces.set(root, setTimeout(() => {
      parents.forEach((parent) => forEach(parent, (el) => lowPriority(() => updatePos(el))));
    }, 100));
  }
  function poll(el) {
    setTimeout(() => {
      intervals.set(el, setInterval(() => lowPriority(updatePos.bind(null, el)), 2e3));
    }, Math.round(2e3 * Math.random()));
  }
  function lowPriority(callback) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => callback());
    } else {
      requestAnimationFrame(() => callback());
    }
  }
  var mutations;
  var resize;
  var supportedBrowser = typeof window !== "undefined" && "ResizeObserver" in window;
  if (supportedBrowser) {
    root = document.documentElement;
    mutations = new MutationObserver(handleMutations);
    resize = new ResizeObserver(handleResizes);
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      scrollX = window.scrollX;
    });
    resize.observe(root);
  }
  function getElements(mutations2) {
    const observedNodes = mutations2.reduce((nodes, mutation) => {
      return [
        ...nodes,
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes)
      ];
    }, []);
    const onlyCommentNodesObserved = observedNodes.every((node) => node.nodeName === "#comment");
    if (onlyCommentNodesObserved)
      return false;
    return mutations2.reduce((elements, mutation) => {
      if (elements === false)
        return false;
      if (mutation.target instanceof Element) {
        target(mutation.target);
        if (!elements.has(mutation.target)) {
          elements.add(mutation.target);
          for (let i3 = 0; i3 < mutation.target.children.length; i3++) {
            const child = mutation.target.children.item(i3);
            if (!child)
              continue;
            if (DEL in child) {
              return false;
            }
            target(mutation.target, child);
            elements.add(child);
          }
        }
        if (mutation.removedNodes.length) {
          for (let i3 = 0; i3 < mutation.removedNodes.length; i3++) {
            const child = mutation.removedNodes[i3];
            if (DEL in child) {
              return false;
            }
            if (child instanceof Element) {
              elements.add(child);
              target(mutation.target, child);
              siblings.set(child, [
                mutation.previousSibling,
                mutation.nextSibling
              ]);
            }
          }
        }
      }
      return elements;
    }, /* @__PURE__ */ new Set());
  }
  function target(el, child) {
    if (!child && !(TGT in el))
      Object.defineProperty(el, TGT, { value: el });
    else if (child && !(TGT in child))
      Object.defineProperty(child, TGT, { value: el });
  }
  function animate(el) {
    var _a;
    const isMounted = el.isConnected;
    const preExisting = coords.has(el);
    if (isMounted && siblings.has(el))
      siblings.delete(el);
    if (animations.has(el)) {
      (_a = animations.get(el)) === null || _a === void 0 ? void 0 : _a.cancel();
    }
    if (NEW in el) {
      add(el);
    } else if (preExisting && isMounted) {
      remain(el);
    } else if (preExisting && !isMounted) {
      remove(el);
    } else {
      add(el);
    }
  }
  function raw(str) {
    return Number(str.replace(/[^0-9.\-]/g, ""));
  }
  function getScrollOffset(el) {
    let p3 = el.parentElement;
    while (p3) {
      if (p3.scrollLeft || p3.scrollTop) {
        return { x: p3.scrollLeft, y: p3.scrollTop };
      }
      p3 = p3.parentElement;
    }
    return { x: 0, y: 0 };
  }
  function getCoords(el) {
    const rect = el.getBoundingClientRect();
    const { x: x3, y: y3 } = getScrollOffset(el);
    return {
      top: rect.top + y3,
      left: rect.left + x3,
      width: rect.width,
      height: rect.height
    };
  }
  function getTransitionSizes(el, oldCoords, newCoords) {
    let widthFrom = oldCoords.width;
    let heightFrom = oldCoords.height;
    let widthTo = newCoords.width;
    let heightTo = newCoords.height;
    const styles = getComputedStyle(el);
    const sizing = styles.getPropertyValue("box-sizing");
    if (sizing === "content-box") {
      const paddingY = raw(styles.paddingTop) + raw(styles.paddingBottom) + raw(styles.borderTopWidth) + raw(styles.borderBottomWidth);
      const paddingX = raw(styles.paddingLeft) + raw(styles.paddingRight) + raw(styles.borderRightWidth) + raw(styles.borderLeftWidth);
      widthFrom -= paddingX;
      widthTo -= paddingX;
      heightFrom -= paddingY;
      heightTo -= paddingY;
    }
    return [widthFrom, widthTo, heightFrom, heightTo].map(Math.round);
  }
  function getOptions(el) {
    return TGT in el && options.has(el[TGT]) ? options.get(el[TGT]) : { duration: 250, easing: "ease-in-out" };
  }
  function getTarget(el) {
    if (TGT in el)
      return el[TGT];
    return void 0;
  }
  function isEnabled(el) {
    const target2 = getTarget(el);
    return target2 ? enabled.has(target2) : false;
  }
  function forEach(parent, ...callbacks) {
    callbacks.forEach((callback) => callback(parent, options.has(parent)));
    for (let i3 = 0; i3 < parent.children.length; i3++) {
      const child = parent.children.item(i3);
      if (child) {
        callbacks.forEach((callback) => callback(child, options.has(child)));
      }
    }
  }
  function getPluginTuple(pluginReturn) {
    if (Array.isArray(pluginReturn))
      return pluginReturn;
    return [pluginReturn];
  }
  function isPlugin(config) {
    return typeof config === "function";
  }
  function remain(el) {
    const oldCoords = coords.get(el);
    const newCoords = getCoords(el);
    if (!isEnabled(el))
      return coords.set(el, newCoords);
    let animation;
    if (!oldCoords)
      return;
    const pluginOrOptions = getOptions(el);
    if (typeof pluginOrOptions !== "function") {
      const deltaX = oldCoords.left - newCoords.left;
      const deltaY = oldCoords.top - newCoords.top;
      const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(el, oldCoords, newCoords);
      const start = {
        transform: `translate(${deltaX}px, ${deltaY}px)`
      };
      const end = {
        transform: `translate(0, 0)`
      };
      if (widthFrom !== widthTo) {
        start.width = `${widthFrom}px`;
        end.width = `${widthTo}px`;
      }
      if (heightFrom !== heightTo) {
        start.height = `${heightFrom}px`;
        end.height = `${heightTo}px`;
      }
      animation = el.animate([start, end], {
        duration: pluginOrOptions.duration,
        easing: pluginOrOptions.easing
      });
    } else {
      const [keyframes] = getPluginTuple(pluginOrOptions(el, "remain", oldCoords, newCoords));
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    coords.set(el, newCoords);
    animation.addEventListener("finish", updatePos.bind(null, el));
  }
  function add(el) {
    if (NEW in el)
      delete el[NEW];
    const newCoords = getCoords(el);
    coords.set(el, newCoords);
    const pluginOrOptions = getOptions(el);
    if (!isEnabled(el))
      return;
    let animation;
    if (typeof pluginOrOptions !== "function") {
      animation = el.animate([
        { transform: "scale(.98)", opacity: 0 },
        { transform: "scale(0.98)", opacity: 0, offset: 0.5 },
        { transform: "scale(1)", opacity: 1 }
      ], {
        duration: pluginOrOptions.duration * 1.5,
        easing: "ease-in"
      });
    } else {
      const [keyframes] = getPluginTuple(pluginOrOptions(el, "add", newCoords));
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    animation.addEventListener("finish", updatePos.bind(null, el));
  }
  function cleanUp(el, styles) {
    var _a;
    el.remove();
    coords.delete(el);
    siblings.delete(el);
    animations.delete(el);
    (_a = intersections.get(el)) === null || _a === void 0 ? void 0 : _a.disconnect();
    setTimeout(() => {
      if (DEL in el)
        delete el[DEL];
      Object.defineProperty(el, NEW, { value: true, configurable: true });
      if (styles && el instanceof HTMLElement) {
        for (const style in styles) {
          el.style[style] = "";
        }
      }
    }, 0);
  }
  function remove(el) {
    var _a;
    if (!siblings.has(el) || !coords.has(el))
      return;
    const [prev, next] = siblings.get(el);
    Object.defineProperty(el, DEL, { value: true, configurable: true });
    const finalX = window.scrollX;
    const finalY = window.scrollY;
    if (next && next.parentNode && next.parentNode instanceof Element) {
      next.parentNode.insertBefore(el, next);
    } else if (prev && prev.parentNode) {
      prev.parentNode.appendChild(el);
    } else {
      (_a = getTarget(el)) === null || _a === void 0 ? void 0 : _a.appendChild(el);
    }
    if (!isEnabled(el))
      return cleanUp(el);
    const [top, left, width, height] = deletePosition(el);
    const optionsOrPlugin = getOptions(el);
    const oldCoords = coords.get(el);
    if (finalX !== scrollX || finalY !== scrollY) {
      adjustScroll(el, finalX, finalY, optionsOrPlugin);
    }
    let animation;
    let styleReset = {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      pointerEvents: "none",
      transformOrigin: "center",
      zIndex: "100"
    };
    if (!isPlugin(optionsOrPlugin)) {
      Object.assign(el.style, styleReset);
      animation = el.animate([
        {
          transform: "scale(1)",
          opacity: 1
        },
        {
          transform: "scale(.98)",
          opacity: 0
        }
      ], { duration: optionsOrPlugin.duration, easing: "ease-out" });
    } else {
      const [keyframes, options2] = getPluginTuple(optionsOrPlugin(el, "remove", oldCoords));
      if ((options2 === null || options2 === void 0 ? void 0 : options2.styleReset) !== false) {
        styleReset = (options2 === null || options2 === void 0 ? void 0 : options2.styleReset) || styleReset;
        Object.assign(el.style, styleReset);
      }
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    animation.addEventListener("finish", cleanUp.bind(null, el, styleReset));
  }
  function adjustScroll(el, finalX, finalY, optionsOrPlugin) {
    const scrollDeltaX = scrollX - finalX;
    const scrollDeltaY = scrollY - finalY;
    const scrollBefore = document.documentElement.style.scrollBehavior;
    const scrollBehavior = getComputedStyle(root).scrollBehavior;
    if (scrollBehavior === "smooth") {
      document.documentElement.style.scrollBehavior = "auto";
    }
    window.scrollTo(window.scrollX + scrollDeltaX, window.scrollY + scrollDeltaY);
    if (!el.parentElement)
      return;
    const parent = el.parentElement;
    let lastHeight = parent.clientHeight;
    let lastWidth = parent.clientWidth;
    const startScroll = performance.now();
    function smoothScroll() {
      requestAnimationFrame(() => {
        if (!isPlugin(optionsOrPlugin)) {
          const deltaY = lastHeight - parent.clientHeight;
          const deltaX = lastWidth - parent.clientWidth;
          if (startScroll + optionsOrPlugin.duration > performance.now()) {
            window.scrollTo({
              left: window.scrollX - deltaX,
              top: window.scrollY - deltaY
            });
            lastHeight = parent.clientHeight;
            lastWidth = parent.clientWidth;
            smoothScroll();
          } else {
            document.documentElement.style.scrollBehavior = scrollBefore;
          }
        }
      });
    }
    smoothScroll();
  }
  function deletePosition(el) {
    const oldCoords = coords.get(el);
    const [width, , height] = getTransitionSizes(el, oldCoords, getCoords(el));
    let offsetParent = el.parentElement;
    while (offsetParent && (getComputedStyle(offsetParent).position === "static" || offsetParent instanceof HTMLBodyElement)) {
      offsetParent = offsetParent.parentElement;
    }
    if (!offsetParent)
      offsetParent = document.body;
    const parentStyles = getComputedStyle(offsetParent);
    const parentCoords = coords.get(offsetParent) || getCoords(offsetParent);
    const top = Math.round(oldCoords.top - parentCoords.top) - raw(parentStyles.borderTopWidth);
    const left = Math.round(oldCoords.left - parentCoords.left) - raw(parentStyles.borderLeftWidth);
    return [top, left, width, height];
  }
  function autoAnimate(el, config = {}) {
    if (mutations && resize) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const isDisabledDueToReduceMotion = mediaQuery.matches && !isPlugin(config) && !config.disrespectUserMotionPreference;
      if (!isDisabledDueToReduceMotion) {
        enabled.add(el);
        if (getComputedStyle(el).position === "static") {
          Object.assign(el.style, { position: "relative" });
        }
        forEach(el, updatePos, poll, (element) => resize === null || resize === void 0 ? void 0 : resize.observe(element));
        if (isPlugin(config)) {
          options.set(el, config);
        } else {
          options.set(el, { duration: 250, easing: "ease-in-out", ...config });
        }
        mutations.observe(el, { childList: true });
        parents.add(el);
      }
    }
    return Object.freeze({
      parent: el,
      enable: () => {
        enabled.add(el);
      },
      disable: () => {
        enabled.delete(el);
      },
      isEnabled: () => enabled.has(el)
    });
  }

  // ../node_modules/@formkit/auto-animate/preact/index.mjs
  function useAutoAnimate(options2) {
    const element = A2(null);
    const [controller, setController] = h2();
    const setEnabled = (enabled2) => {
      if (controller) {
        enabled2 ? controller.enable() : controller.disable();
      }
    };
    y2(() => {
      if (element.current instanceof HTMLElement)
        setController(autoAnimate(element.current, options2 || {}));
    }, []);
    return [element, setEnabled];
  }

  // shared/components/EnvironmentProvider.js
  var EnvironmentContext = G({
    isReducedMotion: false,
    isDarkMode: false,
    debugState: false,
    injectName: (
      /** @type {import('../environment').Environment['injectName']} */
      "windows"
    ),
    willThrow: false,
    /** @type {import('../environment').Environment['env']} */
    env: "production"
  });
  var THEME_QUERY = "(prefers-color-scheme: dark)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function EnvironmentProvider({ children, debugState, env = "production", willThrow = false, injectName = "windows" }) {
    const [theme, setTheme] = h2(window.matchMedia(THEME_QUERY).matches ? "dark" : "light");
    const [isReducedMotion, setReducedMotion] = h2(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    y2(() => {
      const mediaQueryList = window.matchMedia(THEME_QUERY);
      const listener = (e3) => setTheme(e3.matches ? "dark" : "light");
      mediaQueryList.addEventListener("change", listener);
      return () => mediaQueryList.removeEventListener("change", listener);
    }, []);
    y2(() => {
      const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e3) => setter(e3.matches);
      mediaQueryList.addEventListener("change", listener);
      setter(mediaQueryList.matches);
      function setter(value) {
        document.documentElement.dataset.reducedMotion = String(value);
        setReducedMotion(value);
      }
      window.addEventListener("toggle-reduced-motion", () => {
        setter(true);
      });
      return () => mediaQueryList.removeEventListener("change", listener);
    }, []);
    return /* @__PURE__ */ _(
      EnvironmentContext.Provider,
      {
        value: {
          isReducedMotion,
          debugState,
          isDarkMode: theme === "dark",
          injectName,
          willThrow,
          env
        }
      },
      children
    );
  }
  function UpdateEnvironment({ search }) {
    y2(() => {
      const params = new URLSearchParams(search);
      if (params.has("reduced-motion")) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("toggle-reduced-motion"));
        }, 0);
      }
    }, [search]);
    return null;
  }
  function useEnv() {
    return x2(EnvironmentContext);
  }

  // pages/onboarding/app/components/Stack.js
  function Stack({ children, gap = "var(--sp-6)", animate: animate2 = false, debug = false }) {
    const { isReducedMotion } = useEnv();
    const [parent] = useAutoAnimate({ duration: isReducedMotion ? 0 : 300 });
    return /* @__PURE__ */ _("div", { class: Stack_default.stack, ref: animate2 ? parent : null, "data-debug": String(debug), style: { gap } }, children);
  }
  Stack.gaps = {
    6: "var(--sp-6)",
    4: "var(--sp-4)",
    3: "var(--sp-3)",
    0: 0
  };

  // pages/onboarding/app/components/Icons.module.css
  var Icons_default = {
    bounceIn: "Icons_bounceIn",
    bouncein: "Icons_bouncein",
    slideIn: "Icons_slideIn",
    slidein: "Icons_slidein",
    slideUp: "Icons_slideUp",
    slideup: "Icons_slideup",
    fadeIn: "Icons_fadeIn"
  };

  // pages/onboarding/app/components/Icons.js
  function BounceIn({ children, delay = "none" }) {
    return /* @__PURE__ */ _("div", { className: Icons_default.bounceIn, "data-delay": delay }, children);
  }
  function FadeIn({ children, delay = "none" }) {
    return /* @__PURE__ */ _("div", { className: Icons_default.fadeIn, "data-delay": delay }, children);
  }
  function SlideIn({ children, delay = "none" }) {
    return /* @__PURE__ */ _("div", { className: Icons_default.slideIn, "data-delay": delay }, children);
  }
  function SlideUp({ children, delay = "none" }) {
    return /* @__PURE__ */ _("div", { className: Icons_default.slideUp, "data-delay": delay }, children);
  }
  function Check() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-labelledby": "svgTitle svgDesc", role: "img" }, /* @__PURE__ */ _("title", { id: "svgCheckTitle" }, "Completed Action"), /* @__PURE__ */ _("desc", { id: "svgCheckDesc" }, "Green check mark indicating action completed successfully."), /* @__PURE__ */ _("g", { "clip-path": "url(#clip0_3030_17975)" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z",
        fill: "#21C000"
      }
    ), /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M11.6668 5.28423C11.924 5.51439 11.946 5.90951 11.7158 6.16675L7.46579 10.9168C7.34402 11.0529 7.1688 11.1289 6.98622 11.1249C6.80363 11.1208 6.63194 11.0371 6.5163 10.8958L4.2663 8.14578C4.04772 7.87863 4.08709 7.48486 4.35425 7.26628C4.6214 7.0477 5.01516 7.08708 5.23374 7.35423L7.02125 9.53896L10.7842 5.33326C11.0144 5.07602 11.4095 5.05407 11.6668 5.28423Z",
        fill: "white"
      }
    )), /* @__PURE__ */ _("defs", null, /* @__PURE__ */ _("clipPath", { id: "clip0_3030_17975" }, /* @__PURE__ */ _("rect", { width: "16", height: "16", fill: "white" }))));
  }
  function Play() {
    return /* @__PURE__ */ _("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M1 10.2768V1.72318C1 0.955357 1.82948 0.47399 2.49614 0.854937L9.98057 5.13176C10.6524 5.51565 10.6524 6.48435 9.98057 6.86824L2.49614 11.1451C1.82948 11.526 1 11.0446 1 10.2768Z",
        fill: "currentColor"
      }
    ));
  }
  function Replay({ direction = "backward" }) {
    return /* @__PURE__ */ _(
      "svg",
      {
        width: "12",
        height: "12",
        viewBox: "0 0 12 12",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        style: direction === "forward" ? { transform: "scale(-1,1)" } : {}
      },
      /* @__PURE__ */ _("g", { "clip-path": "url(#clip0_10021_2837)" }, /* @__PURE__ */ _(
        "path",
        {
          d: "M7.11485 1.37611C6.05231 1.12541 4.93573 1.25089 3.95534 1.73116C3.06198 2.1688 2.33208 2.87636 1.86665 3.75003H3.9837C4.32888 3.75003 4.6087 4.02985 4.6087 4.37503C4.6087 4.7202 4.32888 5.00003 3.9837 5.00003H0.625013C0.279836 5.00003 1.33514e-05 4.7202 1.33514e-05 4.37503V0.651184C1.33514e-05 0.306006 0.279836 0.0261841 0.625013 0.0261841C0.970191 0.0261841 1.25001 0.306006 1.25001 0.651184V2.39582C1.81304 1.64241 2.54999 1.02768 3.40543 0.608623C4.64552 0.00112504 6.05789 -0.157593 7.40189 0.159513C8.74589 0.476619 9.93836 1.24993 10.7761 2.34768C11.6139 3.44543 12.0451 4.7997 11.9963 6.17974C11.9475 7.55977 11.4216 8.88019 10.5084 9.91601C9.59521 10.9518 8.35109 11.639 6.98804 11.8603C5.625 12.0817 4.22737 11.8236 3.03329 11.13C1.83922 10.4364 0.922573 9.35022 0.43955 8.05655C0.318811 7.73318 0.483079 7.37316 0.806451 7.25242C1.12982 7.13168 1.48985 7.29595 1.61059 7.61932C1.99245 8.64206 2.71713 9.50076 3.66114 10.0491C4.60514 10.5974 5.71008 10.8015 6.78767 10.6265C7.86526 10.4515 8.84883 9.90826 9.5708 9.08936C10.2928 8.27047 10.7085 7.22658 10.747 6.13555C10.7856 5.04453 10.4447 3.97387 9.78243 3.10602C9.12012 2.23816 8.17738 1.6268 7.11485 1.37611Z",
          fill: "currentColor",
          "fill-opacity": "0.84"
        }
      )),
      /* @__PURE__ */ _("defs", null, /* @__PURE__ */ _("clipPath", { id: "clip0_10021_2837" }, /* @__PURE__ */ _("rect", { width: "12", height: "12", fill: "white" })))
    );
  }
  function Launch() {
    return /* @__PURE__ */ _("svg", { width: "17", height: "16", viewBox: "0 0 17 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _("g", { "clip-path": "url(#clip0_3098_23365)" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12.0465 7.31875C11.269 8.09623 10.0085 8.09623 9.23102 7.31875C8.45354 6.54128 8.45354 5.28074 9.23102 4.50327C10.0085 3.7258 11.269 3.7258 12.0465 4.50327C12.824 5.28074 12.824 6.54128 12.0465 7.31875ZM11.1626 6.43487C10.8733 6.72419 10.4042 6.72419 10.1149 6.43487C9.82558 6.14555 9.82558 5.67647 10.1149 5.38715C10.4042 5.09783 10.8733 5.09783 11.1626 5.38715C11.4519 5.67647 11.4519 6.14555 11.1626 6.43487Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M15.0163 0.357982C10.4268 0.792444 7.29295 2.76331 5.19328 5.43188C5.03761 5.41854 4.88167 5.40999 4.72564 5.40608C3.54981 5.37661 2.36922 5.61098 1.26629 6.0488C0.653083 6.29222 0.543501 7.07682 1.01002 7.54334L2.92009 9.45341C2.86071 9.6032 2.80326 9.75371 2.74768 9.90485C2.61756 10.2587 2.71271 10.6538 2.97932 10.9204L5.62864 13.5698C5.89525 13.8364 6.29037 13.9315 6.64424 13.8014C6.79555 13.7458 6.94624 13.6882 7.0962 13.6288L9.0054 15.538C9.47191 16.0045 10.2565 15.8949 10.4999 15.2817C10.9378 14.1788 11.1721 12.9982 11.1427 11.8224C11.1388 11.6668 11.1302 11.5112 11.117 11.356C13.7857 9.25633 15.7566 6.1224 16.1911 1.53282C16.2296 1.12649 16.256 0.708745 16.2698 0.279297C15.8403 0.293094 15.4226 0.319516 15.0163 0.357982ZM3.9867 10.1601L6.38903 12.5624C8.6807 11.6928 10.7461 10.3775 12.2764 8.46444C13.2183 7.28687 13.9808 5.85389 14.4628 4.10497L12.4441 2.08628C10.6952 2.56825 9.26222 3.33082 8.08465 4.27272C6.17156 5.80296 4.85624 7.86839 3.9867 10.1601ZM2.25561 7.02117C2.84462 6.83216 3.44604 6.71284 4.04467 6.67074L3.29585 8.06141L2.25561 7.02117ZM9.52757 14.2924C9.71658 13.7034 9.8359 13.102 9.878 12.5033L8.48733 13.2522L9.52757 14.2924ZM14.7828 2.65724L13.8919 1.76626C14.2259 1.7093 14.5703 1.6616 14.9253 1.62375C14.8875 1.97878 14.8398 2.32317 14.7828 2.65724Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ _(
      "path",
      {
        d: "M4.98318 13.664C5.19417 13.9372 5.14374 14.3297 4.87055 14.5407C3.96675 15.2387 2.81266 15.6173 1.50788 15.7098L0.78927 15.7608L0.840231 15.0422C0.932761 13.7374 1.31133 12.5833 2.00934 11.6795C2.22032 11.4063 2.61283 11.3559 2.88602 11.5669C3.15921 11.7779 3.20963 12.1704 2.99865 12.4436C2.60779 12.9497 2.32977 13.5927 2.18426 14.3658C2.95736 14.2203 3.60041 13.9423 4.1065 13.5514C4.37969 13.3404 4.77219 13.3909 4.98318 13.664Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    )), /* @__PURE__ */ _("defs", null, /* @__PURE__ */ _("clipPath", { id: "clip0_3098_23365" }, /* @__PURE__ */ _("rect", { width: "16", height: "16", fill: "white", transform: "translate(0.5)" }))));
  }

  // pages/onboarding/app/components/Buttons.module.css
  var Buttons_default = {
    buttons: "Buttons_buttons",
    button: "Buttons_button",
    large: "Buttons_large",
    xl: "Buttons_xl",
    secondary: "Buttons_secondary",
    primary: "Buttons_primary"
  };

  // pages/onboarding/app/components/Buttons.js
  var import_classnames = __toESM(require_classnames(), 1);
  function ButtonBar(props) {
    const { children, ...rest } = props;
    return /* @__PURE__ */ _("div", { className: Buttons_default.buttons, ...rest }, children);
  }
  function Button({ variant = "primary", size = "normal", children, ...rest }) {
    const classes = (0, import_classnames.default)({
      [Buttons_default.button]: true,
      [Buttons_default.primary]: variant === "primary",
      [Buttons_default.secondary]: variant === "secondary",
      [Buttons_default.large]: size === "large",
      [Buttons_default.xl]: size === "xl"
    });
    return /* @__PURE__ */ _("button", { className: classes, ...rest }, children);
  }

  // pages/onboarding/app/components/ListItem.js
  var import_classnames2 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/components/ListItem.module.css
  var ListItem_default = {
    step: "ListItem_step",
    plain: "ListItem_plain",
    plainContent: "ListItem_plainContent",
    inner: "ListItem_inner",
    icon: "ListItem_icon",
    iconSmall: "ListItem_iconSmall",
    contentWrapper: "ListItem_contentWrapper",
    content: "ListItem_content",
    title: "ListItem_title",
    secondaryText: "ListItem_secondaryText",
    inlineAction: "ListItem_inlineAction",
    children: "ListItem_children",
    indentChild: "ListItem_indentChild",
    slideIn: "ListItem_slideIn",
    slidein: "ListItem_slidein"
  };

  // pages/onboarding/app/components/ListItem.js
  var prefix = "assets/img/steps/";
  function ListItem({ animate: animate2 = false, ...props }) {
    const path = prefix + props.icon;
    return /* @__PURE__ */ _("li", { className: (0, import_classnames2.default)(ListItem_default.step, animate2 ? ListItem_default.slideIn : void 0), "data-testid": "ListItem", "data-index": String(props.index) }, /* @__PURE__ */ _("div", { className: (0, import_classnames2.default)(ListItem_default.inner) }, /* @__PURE__ */ _("div", { className: ListItem_default.icon, style: `background-image: url(${path});` }), /* @__PURE__ */ _("div", { className: ListItem_default.contentWrapper }, /* @__PURE__ */ _("div", { className: ListItem_default.content }, /* @__PURE__ */ _("p", { className: ListItem_default.title }, props.title), props.secondaryText && /* @__PURE__ */ _("p", { className: ListItem_default.secondaryText }, props.secondaryText)), /* @__PURE__ */ _("div", { className: ListItem_default.inlineAction }, props.inline))), /* @__PURE__ */ _("div", { className: ListItem_default.children }, props.children));
  }
  ListItem.Indent = function({ children }) {
    return /* @__PURE__ */ _("div", { className: ListItem_default.indentChild }, children);
  };
  function ListItemPlain(props) {
    const path = prefix + props.icon;
    return /* @__PURE__ */ _("li", { className: ListItem_default.plain, "data-testid": "ListItem" }, /* @__PURE__ */ _(Check, null), /* @__PURE__ */ _("div", { className: ListItem_default.plainContent }, /* @__PURE__ */ _("div", { className: ListItem_default.iconSmall, style: `background-image: url(${path});` }), /* @__PURE__ */ _("p", { className: ListItem_default.title }, props.title)));
  }

  // pages/onboarding/app/animations/taskbar_pinning.riv
  var taskbar_pinning_default = "./taskbar_pinning-6NHIEEJL.riv";

  // pages/onboarding/app/animations/import.riv
  var import_default = "./import-HLF6I3ZA.riv";

  // pages/onboarding/app/animations/set_default.riv
  var set_default_default = "./set_default-6KY7WB33.riv";

  // pages/onboarding/app/data.js
  var stepDefinitions = {
    welcome: {
      id: "welcome",
      kind: "info"
    },
    getStarted: {
      id: "getStarted",
      kind: "info"
    },
    privateByDefault: {
      id: "privateByDefault",
      kind: "info"
    },
    cleanerBrowsing: {
      id: "cleanerBrowsing",
      kind: "info"
    },
    systemSettings: {
      id: "systemSettings",
      kind: "settings",
      rows: ["import", "default-browser"]
    },
    dockSingle: {
      id: "dockSingle",
      kind: "settings",
      rows: ["dock"]
    },
    importSingle: {
      id: "importSingle",
      kind: "settings",
      rows: ["import"]
    },
    makeDefaultSingle: {
      id: "makeDefaultSingle",
      kind: "settings",
      rows: ["default-browser"]
    },
    customize: {
      id: "customize",
      kind: "settings",
      rows: ["bookmarks", "session-restore", "home-shortcut"]
    },
    summary: {
      id: "summary",
      kind: "info"
    },
    duckPlayerSingle: {
      id: "duckPlayerSingle",
      kind: "info"
    }
  };
  var stepMeta = (
    /** @type {const} */
    {
      dockSingle: {
        rows: {
          dock: {
            kind: "animation",
            path: taskbar_pinning_default
          }
        }
      },
      importSingle: {
        rows: {
          import: {
            kind: "animation",
            path: import_default
          }
        }
      },
      makeDefaultSingle: {
        rows: {
          "default-browser": {
            kind: "animation",
            path: set_default_default
          }
        }
      }
    }
  );
  var noneSettingsRowItems = {
    search: (t3) => ({
      id: "search",
      summary: t3("row_search_summary"),
      icon: "search.png",
      title: t3("row_search_title"),
      secondaryText: t3("row_search_desc"),
      kind: "one-time"
    }),
    trackingProtection: (t3) => ({
      id: "trackingProtection",
      summary: t3("row_trackingProtection_summary"),
      icon: "shield.png",
      title: t3("row_trackingProtection_title"),
      secondaryText: t3("row_trackingProtection_desc"),
      kind: "one-time"
    }),
    cookieManagement: (t3) => ({
      id: "cookieManagement",
      summary: t3("row_cookieManagement_summary"),
      icon: "cookie.png",
      title: t3("row_cookieManagement_title"),
      secondaryText: t3("row_cookieManagement_desc"),
      kind: "one-time"
    }),
    fewerAds: (t3) => ({
      id: "fewerAds",
      summary: t3("row_fewerAds_summary"),
      icon: "browsing.png",
      title: t3("row_fewerAds_title"),
      secondaryText: t3("row_fewerAds_desc"),
      kind: "one-time"
    }),
    duckPlayer: (t3) => ({
      id: "duckPlayer",
      summary: t3("row_duckPlayer_summary"),
      icon: "duckplayer.png",
      title: t3("row_duckPlayer_title"),
      secondaryText: t3("row_duckPlayer_desc"),
      kind: "one-time"
    })
  };
  var settingsRowItems = {
    dock: (t3, platform) => {
      const title = platform === "apple" ? t3("row_dock_macos_title") : t3("row_dock_title");
      const acceptText = platform === "apple" ? t3("row_dock_macos_accept") : t3("row_dock_accept");
      return {
        id: "dock",
        icon: "dock.png",
        title,
        secondaryText: t3("row_dock_desc"),
        summary: t3("row_dock_summary"),
        kind: "one-time",
        acceptText
      };
    },
    import: (t3) => ({
      id: "import",
      icon: "import.png",
      title: t3("row_import_title"),
      secondaryText: t3("row_import_desc"),
      summary: t3("row_import_summary"),
      kind: "one-time",
      acceptText: t3("row_import_accept")
    }),
    "default-browser": (t3) => ({
      id: "default-browser",
      icon: "switch.png",
      title: t3("row_default-browser_title"),
      secondaryText: t3("row_default-browser_desc"),
      summary: t3("row_default-browser_summary"),
      kind: "one-time",
      acceptText: t3("row_default-browser_accept")
    }),
    bookmarks: (t3) => ({
      id: "bookmarks",
      icon: "bookmarks.png",
      title: t3("row_bookmarks_title"),
      secondaryText: t3("row_bookmarks_desc"),
      summary: t3("row_bookmarks_summary"),
      kind: "toggle",
      acceptText: t3("row_bookmarks_accept")
    }),
    "session-restore": (t3) => ({
      id: "session-restore",
      icon: "session-restore.png",
      title: t3("row_session-restore_title"),
      secondaryText: t3("row_session-restore_desc"),
      summary: t3("row_session-restore_summary"),
      kind: "toggle",
      acceptText: t3("row_session-restore_accept")
    }),
    "home-shortcut": (t3) => ({
      id: "home-shortcut",
      icon: "home.png",
      title: t3("row_home-shortcut_title"),
      secondaryText: t3("row_home-shortcut_desc"),
      summary: t3("row_home-shortcut_summary"),
      kind: "toggle",
      acceptText: t3("row_home-shortcut_accept")
    })
  };
  var beforeAfterMeta = {
    /**
     * @param {import('./types').TranslationFn} t
     */
    fewerAds: (t3) => ({
      btnBeforeText: t3("beforeAfter_fewerAds_show"),
      btnAfterText: t3("beforeAfter_fewerAds_hide"),
      artboard: "Ad Blocking",
      inputName: "DDG?",
      stateMachine: "State Machine 2"
    }),
    /**
     * @param {import('./types').TranslationFn} t
     */
    duckPlayer: (t3) => ({
      btnBeforeText: t3("beforeAfter_duckPlayer_show"),
      btnAfterText: t3("beforeAfter_duckPlayer_hide"),
      artboard: "Duck Player",
      inputName: "Duck Player?",
      stateMachine: "State Machine 2"
    })
  };

  // pages/onboarding/app/components/List.js
  var import_classnames3 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/components/List.module.css
  var List_default = {
    list: "List_list",
    plainListContainer: "List_plainListContainer",
    plainList: "List_plainList",
    borderedList: "List_borderedList",
    summaryList: "List_summaryList"
  };

  // pages/onboarding/app/components/List.js
  function List({ animate: animate2 = false, children }) {
    const { isReducedMotion } = useEnv();
    const [parent] = useAutoAnimate(isReducedMotion ? { duration: 0 } : void 0);
    return /* @__PURE__ */ _("ul", { className: List_default.list, ref: animate2 ? parent : null }, children);
  }
  function PlainList({ variant, animate: animate2 = false, children }) {
    const listRef = A2(null);
    const containerRef = A2(null);
    const classes = (0, import_classnames3.default)({
      [List_default.plainList]: true,
      [List_default.borderedList]: variant === "bordered"
    });
    y2(() => {
      if (containerRef.current && listRef.current) {
        const container = (
          /** @type {HTMLElement} */
          containerRef.current
        );
        const list = (
          /** @type {HTMLElement} */
          listRef.current
        );
        container.style.height = `${list.clientHeight}px`;
      }
    }, [containerRef, listRef, children]);
    return /* @__PURE__ */ _("div", { className: List_default.plainListContainer, ref: animate2 ? containerRef : null }, /* @__PURE__ */ _("ul", { className: classes, ref: animate2 ? listRef : null }, children));
  }
  function SummaryList(props) {
    return /* @__PURE__ */ _("ul", { className: List_default.summaryList }, props.children);
  }

  // shared/translations.js
  function apply(subject, replacements, textLength = 1) {
    if (typeof subject !== "string" || subject.length === 0) return "";
    let out = subject;
    if (replacements) {
      for (let [name, value] of Object.entries(replacements)) {
        if (typeof value !== "string") value = "";
        out = out.replaceAll(`{${name}}`, value);
      }
    }
    if (textLength !== 1 && textLength > 0 && textLength <= 2) {
      const targetLen = Math.ceil(out.length * textLength);
      const target2 = Math.ceil(textLength);
      const combined = out.repeat(target2);
      return combined.slice(0, targetLen);
    }
    return out;
  }

  // shared/components/TranslationsProvider.js
  var TranslationContext = G({
    /** @type {LocalTranslationFn} */
    t: () => {
      throw new Error("must implement");
    }
  });
  function TranslationProvider({ children, translationObject, fallback, textLength = 1 }) {
    function t3(inputKey, replacements) {
      const subject = translationObject?.[inputKey]?.title || fallback?.[inputKey]?.title;
      return apply(subject, replacements, textLength);
    }
    return /* @__PURE__ */ _(TranslationContext.Provider, { value: { t: t3 } }, children);
  }
  function Trans({ str, values }) {
    const ref = A2(null);
    const cleanups = A2([]);
    y2(() => {
      if (!ref.current) return;
      const curr = ref.current;
      const cleanupsCurr = cleanups.current;
      Object.entries(values).forEach(([tag, attributes]) => {
        curr.querySelectorAll(tag).forEach((el) => {
          Object.entries(attributes).forEach(([key, value]) => {
            if (typeof value === "function") {
              el.addEventListener(key, value);
              cleanupsCurr.push(() => el.removeEventListener(key, value));
            } else {
              el.setAttribute(key, value);
            }
          });
        });
      });
      return () => {
        cleanupsCurr.forEach((fn) => fn());
      };
    }, [values, str]);
    return /* @__PURE__ */ _("span", { ref, dangerouslySetInnerHTML: { __html: str } });
  }

  // pages/onboarding/public/locales/en/onboarding.json
  var onboarding_default = {
    smartling: {
      string_format: "icu",
      translate_paths: [
        {
          path: "*/title",
          key: "{*}/title",
          instruction: "*/note"
        }
      ]
    },
    skipButton: {
      title: "Skip",
      note: "Used to advance to the next step in the process"
    },
    getStartedButton: {
      title: "Get Started",
      note: "Button text in the button used to start the process"
    },
    gotIt: {
      title: "Got It",
      note: "Button text used to confirm understanding of a particular step, used as an action to proceed"
    },
    startBrowsing: {
      title: "Start Browsing",
      note: "Used as the final step in the process - to indicate that the next step will be using the browser"
    },
    somethingWentWrong: {
      title: "Something went wrong",
      note: "A message shown when the application experienced a crash"
    },
    youCanChangeYourChoicesAnyTimeInSettings: {
      title: "You can change your choices any time in <a>Settings</a>.",
      note: "This is a statement with inline link, informing users that they can alter their preferences in `Settings` anytime. Please maintain the position of the opening `<a>` and closing `</a>` tag since they are used to create a link for the enclosed word only."
    },
    welcome_title: {
      title: "Welcome To DuckDuckGo!",
      note: "Page title for the first step in the process"
    },
    getStarted_title: {
      title: "Tired of being tracked online?{newline}We can help!",
      note: "Page title indicating that DuckDuckGo can help against online trackers. Please adjust `{newline}` placement ensuring visual balance and readability."
    },
    privateByDefault_title: {
      title: "Unlike other browsers, DuckDuckGo{newline}comes with privacy by default",
      note: "Page title indicating that this application is private by default, requiring little to no user configuration. Please adjust `{newline}` placement ensuring visual balance and readability."
    },
    cleanerBrowsing_title: {
      title: "Private also means{newline}fewer ads and pop-ups",
      note: "Page title highlighting that DuckDuckGo shows less advertisements and popups. Please adjust `{newline}` placement ensuring visual balance and readability."
    },
    systemSettings_title: {
      title: "Make privacy your go-to",
      note: "Page title used in lists of toggle & switches that enable or disable particular privacy features"
    },
    customize_title: {
      title: "Customize your experience",
      note: "Page title used in lists of toggle & switches that enable or disable particular features"
    },
    customize_subtitle: {
      title: "Make DuckDuckGo work just the way you want.",
      note: "Shown under the main page title as encouragement to enable particular features"
    },
    summary_title: {
      title: "You're all set!",
      note: "Page title of the summary page. Indicates that all steps are complete"
    },
    nextButton: {
      title: "Next",
      note: "Button text used to advance to the next step"
    },
    row_search_title: {
      title: "Private Search",
      note: "Title for the search feature status row, shows the status of the private search feature."
    },
    row_search_desc: {
      title: "We don't track you. Ever.",
      note: "Description for the search feature status row, emphasizes privacy."
    },
    row_search_summary: {
      title: "Private Search",
      note: "Summary title for the private search feature."
    },
    row_trackingProtection_title: {
      title: "Advanced Tracking Protection",
      note: "Title for the tracking protection feature status row."
    },
    row_trackingProtection_desc: {
      title: "We block most trackers before they even load.",
      note: "Description for the tracking protection feature status row, emphasizes proactive blocking."
    },
    row_trackingProtection_summary: {
      title: "Advanced Tracking Protection",
      note: "Summary title for the tracking protection feature."
    },
    row_cookieManagement_title: {
      title: "Automatic Cookie Pop-Up Blocking",
      note: "Title for the cookie management feature status row."
    },
    row_cookieManagement_desc: {
      title: "We deny optional cookies for you & hide pop-ups.",
      note: "Description for the cookie management feature status row, emphasizes automated protection."
    },
    row_cookieManagement_summary: {
      title: "Automatic Cookie Pop-Up Blocking",
      note: "Summary title for the automatic cookie pop-up blocking feature."
    },
    row_fewerAds_title: {
      title: "While browsing the web",
      note: "Title for the fewer ads feature status row gist, clarifies where the feature is relevant."
    },
    row_fewerAds_summary: {
      title: "See Fewer Ads & Pop-Ups",
      note: "Summary title for the fewer ads feature, describes the intended effect."
    },
    row_fewerAds_desc: {
      title: "Our tracker blocking eliminates most ads.",
      note: "Description for the fewer ads feature status row, explains how the feature works."
    },
    row_duckPlayer_summary: {
      title: "Distraction-Free YouTube",
      note: "Summary title for the Duck Player feature, emphasizes a cleaner experience."
    },
    row_duckPlayer_title: {
      title: "While watching YouTube",
      note: "Title for the Duck Player feature status row, clarifies where the feature is relevant."
    },
    row_duckPlayer_desc: {
      title: "Enforce YouTube\u2019s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.",
      note: "Description for the Duck Player feature status row, states the feature's purpose and execution."
    },
    row_dock_title: {
      title: "Keep DuckDuckGo in your Taskbar",
      note: "Suggests users to keep DuckDuckGo in their taskbar for quick access."
    },
    row_dock_summary: {
      title: "Pin to Taskbar",
      note: "The text shown on the button to perform the action to pin DuckDuckGo to the taskbar."
    },
    row_dock_desc: {
      title: "Get to DuckDuckGo faster.",
      note: "Description for keeping DuckDuckGo in the taskbar, emphasizes on speed and ease of access."
    },
    row_dock_accept: {
      title: "Pin to Taskbar",
      note: "The text shown in the button to confirm pinning DuckDuckGo to the taskbar."
    },
    row_dock_macos_title: {
      title: "Keep DuckDuckGo in your Dock",
      note: "Suggests users to keep DuckDuckGo in their Dock for quick access."
    },
    row_dock_macos_accept: {
      title: "Keep in Dock",
      note: "The text shown on the button to perform the action to keep DuckDuckGo in the users Dock."
    },
    row_import_title: {
      title: "Bring your stuff",
      note: "Title for importing user data (bookmarks, favorites, passwords) to DuckDuckGo from other browsers."
    },
    row_import_summary: {
      title: "Import Your Stuff",
      note: "Summary title for the import feature, refers to personal browser data."
    },
    row_import_desc: {
      title: "Import bookmarks, favorites, and passwords.",
      note: "Description for the import feature, lists specific items that can be imported."
    },
    row_import_accept: {
      title: "Import",
      note: "The text shown in the button to perform the import action."
    },
    "row_default-browser_title": {
      title: "Switch your default browser",
      note: "Title for the default browser suggestion, encourages users to make DuckDuckGo their primary browser."
    },
    "row_default-browser_summary": {
      title: "Default Browser",
      note: "Summary title for the default browser switch feature."
    },
    "row_default-browser_desc": {
      title: "Always browse privately by default.",
      note: "Description for the default browser switch feature, emphasizes privacy."
    },
    "row_default-browser_accept": {
      title: "Make Default",
      note: "The text shown in the button to perform the action to make DuckDuckGo the default browser."
    },
    row_bookmarks_title: {
      title: "Put your bookmarks in easy reach",
      note: "Title for the bookmarks bar feature, suggests placing bookmarks in an easily accessible location."
    },
    row_bookmarks_summary: {
      title: "Bookmarks Bar",
      note: "Summary title for the bookmarks bar."
    },
    row_bookmarks_desc: {
      title: "Show a bookmarks bar with your favorite bookmarks.",
      note: "Description for the bookmarks bar feature, describes the outcome."
    },
    row_bookmarks_accept: {
      title: "Show Bookmarks Bar",
      note: "The text shown on the button to show the bookmarks bar."
    },
    "row_session-restore_title": {
      title: "Pick up where you left off",
      note: "Title for the session restoring feature, suggests resuming from the point where the user last stopped."
    },
    "row_session-restore_summary": {
      title: "Session Restore",
      note: "Summary title for the session restore feature."
    },
    "row_session-restore_desc": {
      title: "Always restart with all windows from your last session.",
      note: "Description for the session restoring feature, elaborates on its functionality."
    },
    "row_session-restore_accept": {
      title: "Enable Session Restore",
      note: "The text shown on the button to enable the session restore feature."
    },
    "row_home-shortcut_title": {
      title: "Add a shortcut to your homepage",
      note: "Title for the home button feature, suggests adding a shortcut to the homepage for easy access."
    },
    "row_home-shortcut_summary": {
      title: "Home Button",
      note: "Summary title for the home button, refers to a toolbar feature."
    },
    "row_home-shortcut_desc": {
      title: "Show a home button in your toolbar.",
      note: "Description for the home button feature, outlines the outcome."
    },
    "row_home-shortcut_accept": {
      title: "Show Home Button",
      note: "The text shown on the button to show the home button."
    },
    beforeAfter_fewerAds_show: {
      title: "See With Tracker Blocking",
      note: "Option for comparing browsing with and without tracker blocking."
    },
    beforeAfter_fewerAds_hide: {
      title: "See Without Tracker Blocking",
      note: "Option for comparing browsing with and without tracker blocking."
    },
    beforeAfter_duckPlayer_show: {
      title: "See With Duck Player",
      note: "Option for comparing YouTube viewing experience with and without Duck Player."
    },
    beforeAfter_duckPlayer_hide: {
      title: "See Without Duck Player",
      note: "Option for comparing YouTube viewing experience with and without Duck Player."
    },
    getStarted_title_v3: {
      title: "Hi there.{paragraph}Ready for a faster browser{newline}that keeps you protected?",
      note: "Introductory text when a user starts the onboarding process. `{paragraph}` and `{newline}` should not be translated. Please adjust `{newline}` placement ensuring visual balance and readability."
    },
    getStartedButton_v3: {
      title: "Let\u2019s Do It!",
      note: "Button label prompting user to start the onboarding process."
    },
    protectionsActivated_title: {
      title: "Protections activated!",
      note: "Title for a page that shows all the protections offered by the DuckDuckGo browser and how they compare to other browsers."
    },
    makeDefaultButton: {
      title: "Make DuckDuckGo Your Default",
    },
    },
    },
