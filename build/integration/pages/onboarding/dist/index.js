"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod2) => function __require() {
    try {
      return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
    } catch (e3) {
      throw mod2 = 0, e3;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod2, isNodeMode, target2) => (target2 = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target2, "default", { value: mod2, enumerable: true }) : target2,
    mod2
  ));

  // ../node_modules/classnames/index.js
  var require_classnames = __commonJS({
    "../node_modules/classnames/index.js"(exports2, module2) {
      (function() {
        "use strict";
        var hasOwn = {}.hasOwnProperty;
        function classNames() {
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
            return classNames.apply(null, arg);
          }
          if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
            return arg.toString();
          }
          var classes = "";
          for (var key2 in arg) {
            if (hasOwn.call(arg, key2) && arg[key2]) {
              classes = appendClass(classes, key2);
            }
          }
          return classes;
        }
        function appendClass(value2, newClass) {
          if (!newClass) {
            return value2;
          }
          if (value2) {
            return value2 + " " + newClass;
          }
          return value2 + newClass;
        }
        if (typeof module2 !== "undefined" && module2.exports) {
          classNames.default = classNames;
          module2.exports = classNames;
        } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
          define("classnames", [], function() {
            return classNames;
          });
        } else {
          window.classNames = classNames;
        }
      })();
    }
  });

  // ../node_modules/lottie-web/build/player/lottie.js
  var require_lottie = __commonJS({
    "../node_modules/lottie-web/build/player/lottie.js"(exports, module) {
      typeof document !== "undefined" && typeof navigator !== "undefined" && (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.lottie = factory());
      })(exports, (function() {
        "use strict";
        var svgNS = "http://www.w3.org/2000/svg";
        var locationHref = "";
        var _useWebWorker = false;
        var initialDefaultFrame = -999999;
        var setWebWorker = function setWebWorker2(flag) {
          _useWebWorker = !!flag;
        };
        var getWebWorker = function getWebWorker2() {
          return _useWebWorker;
        };
        var setLocationHref = function setLocationHref2(value2) {
          locationHref = value2;
        };
        var getLocationHref = function getLocationHref2() {
          return locationHref;
        };
        function createTag(type) {
          return document.createElement(type);
        }
        function extendPrototype(sources, destination) {
          var i3;
          var len = sources.length;
          var sourcePrototype;
          for (i3 = 0; i3 < len; i3 += 1) {
            sourcePrototype = sources[i3].prototype;
            for (var attr in sourcePrototype) {
              if (Object.prototype.hasOwnProperty.call(sourcePrototype, attr)) destination.prototype[attr] = sourcePrototype[attr];
            }
          }
        }
        function getDescriptor(object, prop) {
          return Object.getOwnPropertyDescriptor(object, prop);
        }
        function createProxyFunction(prototype) {
          function ProxyFunction() {
          }
          ProxyFunction.prototype = prototype;
          return ProxyFunction;
        }
        var audioControllerFactory = (function() {
          function AudioController(audioFactory) {
            this.audios = [];
            this.audioFactory = audioFactory;
            this._volume = 1;
            this._isMuted = false;
          }
          AudioController.prototype = {
            addAudio: function addAudio(audio) {
              this.audios.push(audio);
            },
            pause: function pause() {
              var i3;
              var len = this.audios.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this.audios[i3].pause();
              }
            },
            resume: function resume() {
              var i3;
              var len = this.audios.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this.audios[i3].resume();
              }
            },
            setRate: function setRate(rateValue) {
              var i3;
              var len = this.audios.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this.audios[i3].setRate(rateValue);
              }
            },
            createAudio: function createAudio(assetPath) {
              if (this.audioFactory) {
                return this.audioFactory(assetPath);
              }
              if (window.Howl) {
                return new window.Howl({
                  src: [assetPath]
                });
              }
              return {
                isPlaying: false,
                play: function play() {
                  this.isPlaying = true;
                },
                seek: function seek() {
                  this.isPlaying = false;
                },
                playing: function playing() {
                },
                rate: function rate() {
                },
                setVolume: function setVolume() {
                }
              };
            },
            setAudioFactory: function setAudioFactory(audioFactory) {
              this.audioFactory = audioFactory;
            },
            setVolume: function setVolume(value2) {
              this._volume = value2;
              this._updateVolume();
            },
            mute: function mute() {
              this._isMuted = true;
              this._updateVolume();
            },
            unmute: function unmute() {
              this._isMuted = false;
              this._updateVolume();
            },
            getVolume: function getVolume() {
              return this._volume;
            },
            _updateVolume: function _updateVolume() {
              var i3;
              var len = this.audios.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this.audios[i3].volume(this._volume * (this._isMuted ? 0 : 1));
              }
            }
          };
          return function() {
            return new AudioController();
          };
        })();
        var createTypedArray = (function() {
          function createRegularArray(type, len) {
            var i3 = 0;
            var arr = [];
            var value2;
            switch (type) {
              case "int16":
              case "uint8c":
                value2 = 1;
                break;
              default:
                value2 = 1.1;
                break;
            }
            for (i3 = 0; i3 < len; i3 += 1) {
              arr.push(value2);
            }
            return arr;
          }
          function createTypedArrayFactory(type, len) {
            if (type === "float32") {
              return new Float32Array(len);
            }
            if (type === "int16") {
              return new Int16Array(len);
            }
            if (type === "uint8c") {
              return new Uint8ClampedArray(len);
            }
            return createRegularArray(type, len);
          }
          if (typeof Uint8ClampedArray === "function" && typeof Float32Array === "function") {
            return createTypedArrayFactory;
          }
          return createRegularArray;
        })();
        function createSizedArray(len) {
          return Array.apply(null, {
            length: len
          });
        }
        function _typeof$6(o3) {
          "@babel/helpers - typeof";
          return _typeof$6 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$6(o3);
        }
        var subframeEnabled = true;
        var expressionsPlugin = null;
        var expressionsInterfaces = null;
        var idPrefix$1 = "";
        var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        var _shouldRoundValues = false;
        var bmPow = Math.pow;
        var bmSqrt = Math.sqrt;
        var bmFloor = Math.floor;
        var bmMax = Math.max;
        var bmMin = Math.min;
        var BMMath = {};
        (function() {
          var propertyNames = ["abs", "acos", "acosh", "asin", "asinh", "atan", "atanh", "atan2", "ceil", "cbrt", "expm1", "clz32", "cos", "cosh", "exp", "floor", "fround", "hypot", "imul", "log", "log1p", "log2", "log10", "max", "min", "pow", "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc", "E", "LN10", "LN2", "LOG10E", "LOG2E", "PI", "SQRT1_2", "SQRT2"];
          var i3;
          var len = propertyNames.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            BMMath[propertyNames[i3]] = Math[propertyNames[i3]];
          }
        })();
        function ProjectInterface$1() {
          return {};
        }
        BMMath.random = Math.random;
        BMMath.abs = function(val2) {
          var tOfVal = _typeof$6(val2);
          if (tOfVal === "object" && val2.length) {
            var absArr = createSizedArray(val2.length);
            var i3;
            var len = val2.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              absArr[i3] = Math.abs(val2[i3]);
            }
            return absArr;
          }
          return Math.abs(val2);
        };
        var defaultCurveSegments = 150;
        var degToRads = Math.PI / 180;
        var roundCorner = 0.5519;
        function roundValues(flag) {
          _shouldRoundValues = !!flag;
        }
        function bmRnd(value2) {
          if (_shouldRoundValues) {
            return Math.round(value2);
          }
          return value2;
        }
        function styleDiv(element) {
          element.style.position = "absolute";
          element.style.top = 0;
          element.style.left = 0;
          element.style.display = "block";
          element.style.transformOrigin = "0 0";
          element.style.webkitTransformOrigin = "0 0";
          element.style.backfaceVisibility = "visible";
          element.style.webkitBackfaceVisibility = "visible";
          element.style.transformStyle = "preserve-3d";
          element.style.webkitTransformStyle = "preserve-3d";
          element.style.mozTransformStyle = "preserve-3d";
        }
        function BMEnterFrameEvent(type, currentTime, totalTime, frameMultiplier) {
          this.type = type;
          this.currentTime = currentTime;
          this.totalTime = totalTime;
          this.direction = frameMultiplier < 0 ? -1 : 1;
        }
        function BMCompleteEvent(type, frameMultiplier) {
          this.type = type;
          this.direction = frameMultiplier < 0 ? -1 : 1;
        }
        function BMCompleteLoopEvent(type, totalLoops, currentLoop, frameMultiplier) {
          this.type = type;
          this.currentLoop = currentLoop;
          this.totalLoops = totalLoops;
          this.direction = frameMultiplier < 0 ? -1 : 1;
        }
        function BMSegmentStartEvent(type, firstFrame, totalFrames) {
          this.type = type;
          this.firstFrame = firstFrame;
          this.totalFrames = totalFrames;
        }
        function BMDestroyEvent(type, target2) {
          this.type = type;
          this.target = target2;
        }
        function BMRenderFrameErrorEvent(nativeError, currentTime) {
          this.type = "renderFrameError";
          this.nativeError = nativeError;
          this.currentTime = currentTime;
        }
        function BMConfigErrorEvent(nativeError) {
          this.type = "configError";
          this.nativeError = nativeError;
        }
        function BMAnimationConfigErrorEvent(type, nativeError) {
          this.type = type;
          this.nativeError = nativeError;
        }
        var createElementID = /* @__PURE__ */ (function() {
          var _count = 0;
          return function createID() {
            _count += 1;
            return idPrefix$1 + "__lottie_element_" + _count;
          };
        })();
        function HSVtoRGB(h3, s3, v3) {
          var r3;
          var g3;
          var b2;
          var i3;
          var f3;
          var p3;
          var q3;
          var t3;
          i3 = Math.floor(h3 * 6);
          f3 = h3 * 6 - i3;
          p3 = v3 * (1 - s3);
          q3 = v3 * (1 - f3 * s3);
          t3 = v3 * (1 - (1 - f3) * s3);
          switch (i3 % 6) {
            case 0:
              r3 = v3;
              g3 = t3;
              b2 = p3;
              break;
            case 1:
              r3 = q3;
              g3 = v3;
              b2 = p3;
              break;
            case 2:
              r3 = p3;
              g3 = v3;
              b2 = t3;
              break;
            case 3:
              r3 = p3;
              g3 = q3;
              b2 = v3;
              break;
            case 4:
              r3 = t3;
              g3 = p3;
              b2 = v3;
              break;
            case 5:
              r3 = v3;
              g3 = p3;
              b2 = q3;
              break;
            default:
              break;
          }
          return [r3, g3, b2];
        }
        function RGBtoHSV(r3, g3, b2) {
          var max = Math.max(r3, g3, b2);
          var min = Math.min(r3, g3, b2);
          var d3 = max - min;
          var h3;
          var s3 = max === 0 ? 0 : d3 / max;
          var v3 = max / 255;
          switch (max) {
            case min:
              h3 = 0;
              break;
            case r3:
              h3 = g3 - b2 + d3 * (g3 < b2 ? 6 : 0);
              h3 /= 6 * d3;
              break;
            case g3:
              h3 = b2 - r3 + d3 * 2;
              h3 /= 6 * d3;
              break;
            case b2:
              h3 = r3 - g3 + d3 * 4;
              h3 /= 6 * d3;
              break;
            default:
              break;
          }
          return [h3, s3, v3];
        }
        function addSaturationToRGB(color, offset) {
          var hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
          hsv[1] += offset;
          if (hsv[1] > 1) {
            hsv[1] = 1;
          } else if (hsv[1] <= 0) {
            hsv[1] = 0;
          }
          return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
        }
        function addBrightnessToRGB(color, offset) {
          var hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
          hsv[2] += offset;
          if (hsv[2] > 1) {
            hsv[2] = 1;
          } else if (hsv[2] < 0) {
            hsv[2] = 0;
          }
          return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
        }
        function addHueToRGB(color, offset) {
          var hsv = RGBtoHSV(color[0] * 255, color[1] * 255, color[2] * 255);
          hsv[0] += offset / 360;
          if (hsv[0] > 1) {
            hsv[0] -= 1;
          } else if (hsv[0] < 0) {
            hsv[0] += 1;
          }
          return HSVtoRGB(hsv[0], hsv[1], hsv[2]);
        }
        var rgbToHex = (function() {
          var colorMap = [];
          var i3;
          var hex;
          for (i3 = 0; i3 < 256; i3 += 1) {
            hex = i3.toString(16);
            colorMap[i3] = hex.length === 1 ? "0" + hex : hex;
          }
          return function(r3, g3, b2) {
            if (r3 < 0) {
              r3 = 0;
            }
            if (g3 < 0) {
              g3 = 0;
            }
            if (b2 < 0) {
              b2 = 0;
            }
            return "#" + colorMap[r3] + colorMap[g3] + colorMap[b2];
          };
        })();
        var setSubframeEnabled = function setSubframeEnabled2(flag) {
          subframeEnabled = !!flag;
        };
        var getSubframeEnabled = function getSubframeEnabled2() {
          return subframeEnabled;
        };
        var setExpressionsPlugin = function setExpressionsPlugin2(value2) {
          expressionsPlugin = value2;
        };
        var getExpressionsPlugin = function getExpressionsPlugin2() {
          return expressionsPlugin;
        };
        var setExpressionInterfaces = function setExpressionInterfaces2(value2) {
          expressionsInterfaces = value2;
        };
        var getExpressionInterfaces = function getExpressionInterfaces2() {
          return expressionsInterfaces;
        };
        var setDefaultCurveSegments = function setDefaultCurveSegments2(value2) {
          defaultCurveSegments = value2;
        };
        var getDefaultCurveSegments = function getDefaultCurveSegments2() {
          return defaultCurveSegments;
        };
        var setIdPrefix = function setIdPrefix2(value2) {
          idPrefix$1 = value2;
        };
        var getIdPrefix = function getIdPrefix2() {
          return idPrefix$1;
        };
        function createNS(type) {
          return document.createElementNS(svgNS, type);
        }
        function _typeof$5(o3) {
          "@babel/helpers - typeof";
          return _typeof$5 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$5(o3);
        }
        var dataManager = /* @__PURE__ */ (function() {
          var _counterId = 1;
          var processes = [];
          var workerFn;
          var workerInstance;
          var workerProxy = {
            onmessage: function onmessage() {
            },
            postMessage: function postMessage(path) {
              workerFn({
                data: path
              });
            }
          };
          var _workerSelf = {
            postMessage: function postMessage(data2) {
              workerProxy.onmessage({
                data: data2
              });
            }
          };
          function createWorker(fn) {
            if (window.Worker && window.Blob && getWebWorker()) {
              var blob = new Blob(["var _workerSelf = self; self.onmessage = ", fn.toString()], {
                type: "text/javascript"
              });
              var url2 = URL.createObjectURL(blob);
              return new Worker(url2);
            }
            workerFn = fn;
            return workerProxy;
          }
          function setupWorker() {
            if (!workerInstance) {
              workerInstance = createWorker(function workerStart(e3) {
                function dataFunctionManager() {
                  function completeLayers(layers, comps) {
                    var layerData;
                    var i3;
                    var len = layers.length;
                    var j3;
                    var jLen;
                    var k3;
                    var kLen;
                    for (i3 = 0; i3 < len; i3 += 1) {
                      layerData = layers[i3];
                      if ("ks" in layerData && !layerData.completed) {
                        layerData.completed = true;
                        if (layerData.hasMask) {
                          var maskProps = layerData.masksProperties;
                          jLen = maskProps.length;
                          for (j3 = 0; j3 < jLen; j3 += 1) {
                            if (maskProps[j3].pt.k.i) {
                              convertPathsToAbsoluteValues(maskProps[j3].pt.k);
                            } else {
                              kLen = maskProps[j3].pt.k.length;
                              for (k3 = 0; k3 < kLen; k3 += 1) {
                                if (maskProps[j3].pt.k[k3].s) {
                                  convertPathsToAbsoluteValues(maskProps[j3].pt.k[k3].s[0]);
                                }
                                if (maskProps[j3].pt.k[k3].e) {
                                  convertPathsToAbsoluteValues(maskProps[j3].pt.k[k3].e[0]);
                                }
                              }
                            }
                          }
                        }
                        if (layerData.ty === 0) {
                          layerData.layers = findCompLayers(layerData.refId, comps);
                          completeLayers(layerData.layers, comps);
                        } else if (layerData.ty === 4) {
                          completeShapes(layerData.shapes);
                        } else if (layerData.ty === 5) {
                          completeText(layerData);
                        }
                      }
                    }
                  }
                  function completeChars(chars, assets) {
                    if (chars) {
                      var i3 = 0;
                      var len = chars.length;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        if (chars[i3].t === 1) {
                          chars[i3].data.layers = findCompLayers(chars[i3].data.refId, assets);
                          completeLayers(chars[i3].data.layers, assets);
                        }
                      }
                    }
                  }
                  function findComp(id, comps) {
                    var i3 = 0;
                    var len = comps.length;
                    while (i3 < len) {
                      if (comps[i3].id === id) {
                        return comps[i3];
                      }
                      i3 += 1;
                    }
                    return null;
                  }
                  function findCompLayers(id, comps) {
                    var comp2 = findComp(id, comps);
                    if (comp2) {
                      if (!comp2.layers.__used) {
                        comp2.layers.__used = true;
                        return comp2.layers;
                      }
                      return JSON.parse(JSON.stringify(comp2.layers));
                    }
                    return null;
                  }
                  function completeShapes(arr) {
                    var i3;
                    var len = arr.length;
                    var j3;
                    var jLen;
                    for (i3 = len - 1; i3 >= 0; i3 -= 1) {
                      if (arr[i3].ty === "sh") {
                        if (arr[i3].ks.k.i) {
                          convertPathsToAbsoluteValues(arr[i3].ks.k);
                        } else {
                          jLen = arr[i3].ks.k.length;
                          for (j3 = 0; j3 < jLen; j3 += 1) {
                            if (arr[i3].ks.k[j3].s) {
                              convertPathsToAbsoluteValues(arr[i3].ks.k[j3].s[0]);
                            }
                            if (arr[i3].ks.k[j3].e) {
                              convertPathsToAbsoluteValues(arr[i3].ks.k[j3].e[0]);
                            }
                          }
                        }
                      } else if (arr[i3].ty === "gr") {
                        completeShapes(arr[i3].it);
                      }
                    }
                  }
                  function convertPathsToAbsoluteValues(path) {
                    var i3;
                    var len = path.i.length;
                    for (i3 = 0; i3 < len; i3 += 1) {
                      path.i[i3][0] += path.v[i3][0];
                      path.i[i3][1] += path.v[i3][1];
                      path.o[i3][0] += path.v[i3][0];
                      path.o[i3][1] += path.v[i3][1];
                    }
                  }
                  function checkVersion(minimum, animVersionString) {
                    var animVersion = animVersionString ? animVersionString.split(".") : [100, 100, 100];
                    if (minimum[0] > animVersion[0]) {
                      return true;
                    }
                    if (animVersion[0] > minimum[0]) {
                      return false;
                    }
                    if (minimum[1] > animVersion[1]) {
                      return true;
                    }
                    if (animVersion[1] > minimum[1]) {
                      return false;
                    }
                    if (minimum[2] > animVersion[2]) {
                      return true;
                    }
                    if (animVersion[2] > minimum[2]) {
                      return false;
                    }
                    return null;
                  }
                  var checkText = /* @__PURE__ */ (function() {
                    var minimumVersion = [4, 4, 14];
                    function updateTextLayer(textLayer) {
                      var documentData = textLayer.t.d;
                      textLayer.t.d = {
                        k: [{
                          s: documentData,
                          t: 0
                        }]
                      };
                    }
                    function iterateLayers(layers) {
                      var i3;
                      var len = layers.length;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        if (layers[i3].ty === 5) {
                          updateTextLayer(layers[i3]);
                        }
                      }
                    }
                    return function(animationData2) {
                      if (checkVersion(minimumVersion, animationData2.v)) {
                        iterateLayers(animationData2.layers);
                        if (animationData2.assets) {
                          var i3;
                          var len = animationData2.assets.length;
                          for (i3 = 0; i3 < len; i3 += 1) {
                            if (animationData2.assets[i3].layers) {
                              iterateLayers(animationData2.assets[i3].layers);
                            }
                          }
                        }
                      }
                    };
                  })();
                  var checkChars = /* @__PURE__ */ (function() {
                    var minimumVersion = [4, 7, 99];
                    return function(animationData2) {
                      if (animationData2.chars && !checkVersion(minimumVersion, animationData2.v)) {
                        var i3;
                        var len = animationData2.chars.length;
                        for (i3 = 0; i3 < len; i3 += 1) {
                          var charData = animationData2.chars[i3];
                          if (charData.data && charData.data.shapes) {
                            completeShapes(charData.data.shapes);
                            charData.data.ip = 0;
                            charData.data.op = 99999;
                            charData.data.st = 0;
                            charData.data.sr = 1;
                            charData.data.ks = {
                              p: {
                                k: [0, 0],
                                a: 0
                              },
                              s: {
                                k: [100, 100],
                                a: 0
                              },
                              a: {
                                k: [0, 0],
                                a: 0
                              },
                              r: {
                                k: 0,
                                a: 0
                              },
                              o: {
                                k: 100,
                                a: 0
                              }
                            };
                            if (!animationData2.chars[i3].t) {
                              charData.data.shapes.push({
                                ty: "no"
                              });
                              charData.data.shapes[0].it.push({
                                p: {
                                  k: [0, 0],
                                  a: 0
                                },
                                s: {
                                  k: [100, 100],
                                  a: 0
                                },
                                a: {
                                  k: [0, 0],
                                  a: 0
                                },
                                r: {
                                  k: 0,
                                  a: 0
                                },
                                o: {
                                  k: 100,
                                  a: 0
                                },
                                sk: {
                                  k: 0,
                                  a: 0
                                },
                                sa: {
                                  k: 0,
                                  a: 0
                                },
                                ty: "tr"
                              });
                            }
                          }
                        }
                      }
                    };
                  })();
                  var checkPathProperties = /* @__PURE__ */ (function() {
                    var minimumVersion = [5, 7, 15];
                    function updateTextLayer(textLayer) {
                      var pathData = textLayer.t.p;
                      if (typeof pathData.a === "number") {
                        pathData.a = {
                          a: 0,
                          k: pathData.a
                        };
                      }
                      if (typeof pathData.p === "number") {
                        pathData.p = {
                          a: 0,
                          k: pathData.p
                        };
                      }
                      if (typeof pathData.r === "number") {
                        pathData.r = {
                          a: 0,
                          k: pathData.r
                        };
                      }
                    }
                    function iterateLayers(layers) {
                      var i3;
                      var len = layers.length;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        if (layers[i3].ty === 5) {
                          updateTextLayer(layers[i3]);
                        }
                      }
                    }
                    return function(animationData2) {
                      if (checkVersion(minimumVersion, animationData2.v)) {
                        iterateLayers(animationData2.layers);
                        if (animationData2.assets) {
                          var i3;
                          var len = animationData2.assets.length;
                          for (i3 = 0; i3 < len; i3 += 1) {
                            if (animationData2.assets[i3].layers) {
                              iterateLayers(animationData2.assets[i3].layers);
                            }
                          }
                        }
                      }
                    };
                  })();
                  var checkColors = /* @__PURE__ */ (function() {
                    var minimumVersion = [4, 1, 9];
                    function iterateShapes(shapes) {
                      var i3;
                      var len = shapes.length;
                      var j3;
                      var jLen;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        if (shapes[i3].ty === "gr") {
                          iterateShapes(shapes[i3].it);
                        } else if (shapes[i3].ty === "fl" || shapes[i3].ty === "st") {
                          if (shapes[i3].c.k && shapes[i3].c.k[0].i) {
                            jLen = shapes[i3].c.k.length;
                            for (j3 = 0; j3 < jLen; j3 += 1) {
                              if (shapes[i3].c.k[j3].s) {
                                shapes[i3].c.k[j3].s[0] /= 255;
                                shapes[i3].c.k[j3].s[1] /= 255;
                                shapes[i3].c.k[j3].s[2] /= 255;
                                shapes[i3].c.k[j3].s[3] /= 255;
                              }
                              if (shapes[i3].c.k[j3].e) {
                                shapes[i3].c.k[j3].e[0] /= 255;
                                shapes[i3].c.k[j3].e[1] /= 255;
                                shapes[i3].c.k[j3].e[2] /= 255;
                                shapes[i3].c.k[j3].e[3] /= 255;
                              }
                            }
                          } else {
                            shapes[i3].c.k[0] /= 255;
                            shapes[i3].c.k[1] /= 255;
                            shapes[i3].c.k[2] /= 255;
                            shapes[i3].c.k[3] /= 255;
                          }
                        }
                      }
                    }
                    function iterateLayers(layers) {
                      var i3;
                      var len = layers.length;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        if (layers[i3].ty === 4) {
                          iterateShapes(layers[i3].shapes);
                        }
                      }
                    }
                    return function(animationData2) {
                      if (checkVersion(minimumVersion, animationData2.v)) {
                        iterateLayers(animationData2.layers);
                        if (animationData2.assets) {
                          var i3;
                          var len = animationData2.assets.length;
                          for (i3 = 0; i3 < len; i3 += 1) {
                            if (animationData2.assets[i3].layers) {
                              iterateLayers(animationData2.assets[i3].layers);
                            }
                          }
                        }
                      }
                    };
                  })();
                  var checkShapes = /* @__PURE__ */ (function() {
                    var minimumVersion = [4, 4, 18];
                    function completeClosingShapes(arr) {
                      var i3;
                      var len = arr.length;
                      var j3;
                      var jLen;
                      for (i3 = len - 1; i3 >= 0; i3 -= 1) {
                        if (arr[i3].ty === "sh") {
                          if (arr[i3].ks.k.i) {
                            arr[i3].ks.k.c = arr[i3].closed;
                          } else {
                            jLen = arr[i3].ks.k.length;
                            for (j3 = 0; j3 < jLen; j3 += 1) {
                              if (arr[i3].ks.k[j3].s) {
                                arr[i3].ks.k[j3].s[0].c = arr[i3].closed;
                              }
                              if (arr[i3].ks.k[j3].e) {
                                arr[i3].ks.k[j3].e[0].c = arr[i3].closed;
                              }
                            }
                          }
                        } else if (arr[i3].ty === "gr") {
                          completeClosingShapes(arr[i3].it);
                        }
                      }
                    }
                    function iterateLayers(layers) {
                      var layerData;
                      var i3;
                      var len = layers.length;
                      var j3;
                      var jLen;
                      var k3;
                      var kLen;
                      for (i3 = 0; i3 < len; i3 += 1) {
                        layerData = layers[i3];
                        if (layerData.hasMask) {
                          var maskProps = layerData.masksProperties;
                          jLen = maskProps.length;
                          for (j3 = 0; j3 < jLen; j3 += 1) {
                            if (maskProps[j3].pt.k.i) {
                              maskProps[j3].pt.k.c = maskProps[j3].cl;
                            } else {
                              kLen = maskProps[j3].pt.k.length;
                              for (k3 = 0; k3 < kLen; k3 += 1) {
                                if (maskProps[j3].pt.k[k3].s) {
                                  maskProps[j3].pt.k[k3].s[0].c = maskProps[j3].cl;
                                }
                                if (maskProps[j3].pt.k[k3].e) {
                                  maskProps[j3].pt.k[k3].e[0].c = maskProps[j3].cl;
                                }
                              }
                            }
                          }
                        }
                        if (layerData.ty === 4) {
                          completeClosingShapes(layerData.shapes);
                        }
                      }
                    }
                    return function(animationData2) {
                      if (checkVersion(minimumVersion, animationData2.v)) {
                        iterateLayers(animationData2.layers);
                        if (animationData2.assets) {
                          var i3;
                          var len = animationData2.assets.length;
                          for (i3 = 0; i3 < len; i3 += 1) {
                            if (animationData2.assets[i3].layers) {
                              iterateLayers(animationData2.assets[i3].layers);
                            }
                          }
                        }
                      }
                    };
                  })();
                  function completeData(animationData2) {
                    if (animationData2.__complete) {
                      return;
                    }
                    checkColors(animationData2);
                    checkText(animationData2);
                    checkChars(animationData2);
                    checkPathProperties(animationData2);
                    checkShapes(animationData2);
                    completeLayers(animationData2.layers, animationData2.assets);
                    completeChars(animationData2.chars, animationData2.assets);
                    animationData2.__complete = true;
                  }
                  function completeText(data2) {
                    if (data2.t.a.length === 0 && !("m" in data2.t.p)) {
                    }
                  }
                  var moduleOb = {};
                  moduleOb.completeData = completeData;
                  moduleOb.checkColors = checkColors;
                  moduleOb.checkChars = checkChars;
                  moduleOb.checkPathProperties = checkPathProperties;
                  moduleOb.checkShapes = checkShapes;
                  moduleOb.completeLayers = completeLayers;
                  return moduleOb;
                }
                if (!_workerSelf.dataManager) {
                  _workerSelf.dataManager = dataFunctionManager();
                }
                if (!_workerSelf.assetLoader) {
                  _workerSelf.assetLoader = /* @__PURE__ */ (function() {
                    function formatResponse(xhr) {
                      var contentTypeHeader = xhr.getResponseHeader("content-type");
                      if (contentTypeHeader && xhr.responseType === "json" && contentTypeHeader.indexOf("json") !== -1) {
                        return xhr.response;
                      }
                      if (xhr.response && _typeof$5(xhr.response) === "object") {
                        return xhr.response;
                      }
                      if (xhr.response && typeof xhr.response === "string") {
                        return JSON.parse(xhr.response);
                      }
                      if (xhr.responseText) {
                        return JSON.parse(xhr.responseText);
                      }
                      return null;
                    }
                    function loadAsset(path, fullPath, callback, errorCallback) {
                      var response;
                      var xhr = new XMLHttpRequest();
                      try {
                        xhr.responseType = "json";
                      } catch (err) {
                      }
                      xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                          if (xhr.status === 200) {
                            response = formatResponse(xhr);
                            callback(response);
                          } else {
                            try {
                              response = formatResponse(xhr);
                              callback(response);
                            } catch (err) {
                              if (errorCallback) {
                                errorCallback(err);
                              }
                            }
                          }
                        }
                      };
                      try {
                        xhr.open(["G", "E", "T"].join(""), path, true);
                      } catch (error) {
                        xhr.open(["G", "E", "T"].join(""), fullPath + "/" + path, true);
                      }
                      xhr.send();
                    }
                    return {
                      load: loadAsset
                    };
                  })();
                }
                if (e3.data.type === "loadAnimation") {
                  _workerSelf.assetLoader.load(e3.data.path, e3.data.fullPath, function(data2) {
                    _workerSelf.dataManager.completeData(data2);
                    _workerSelf.postMessage({
                      id: e3.data.id,
                      payload: data2,
                      status: "success"
                    });
                  }, function() {
                    _workerSelf.postMessage({
                      id: e3.data.id,
                      status: "error"
                    });
                  });
                } else if (e3.data.type === "complete") {
                  var animation = e3.data.animation;
                  _workerSelf.dataManager.completeData(animation);
                  _workerSelf.postMessage({
                    id: e3.data.id,
                    payload: animation,
                    status: "success"
                  });
                } else if (e3.data.type === "loadData") {
                  _workerSelf.assetLoader.load(e3.data.path, e3.data.fullPath, function(data2) {
                    _workerSelf.postMessage({
                      id: e3.data.id,
                      payload: data2,
                      status: "success"
                    });
                  }, function() {
                    _workerSelf.postMessage({
                      id: e3.data.id,
                      status: "error"
                    });
                  });
                }
              });
              workerInstance.onmessage = function(event) {
                var data2 = event.data;
                var id = data2.id;
                var process = processes[id];
                processes[id] = null;
                if (data2.status === "success") {
                  process.onComplete(data2.payload);
                } else if (process.onError) {
                  process.onError();
                }
              };
            }
          }
          function createProcess(onComplete, onError) {
            _counterId += 1;
            var id = "processId_" + _counterId;
            processes[id] = {
              onComplete,
              onError
            };
            return id;
          }
          function loadAnimation2(path, onComplete, onError) {
            setupWorker();
            var processId = createProcess(onComplete, onError);
            workerInstance.postMessage({
              type: "loadAnimation",
              path,
              fullPath: window.location.origin + window.location.pathname,
              id: processId
            });
          }
          function loadData(path, onComplete, onError) {
            setupWorker();
            var processId = createProcess(onComplete, onError);
            workerInstance.postMessage({
              type: "loadData",
              path,
              fullPath: window.location.origin + window.location.pathname,
              id: processId
            });
          }
          function completeAnimation(anim, onComplete, onError) {
            setupWorker();
            var processId = createProcess(onComplete, onError);
            workerInstance.postMessage({
              type: "complete",
              animation: anim,
              id: processId
            });
          }
          return {
            loadAnimation: loadAnimation2,
            loadData,
            completeAnimation
          };
        })();
        var ImagePreloader = (function() {
          var proxyImage = (function() {
            var canvas = createTag("canvas");
            canvas.width = 1;
            canvas.height = 1;
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "rgba(0,0,0,0)";
            ctx.fillRect(0, 0, 1, 1);
            return canvas;
          })();
          function imageLoaded() {
            this.loadedAssets += 1;
            if (this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages) {
              if (this.imagesLoadedCb) {
                this.imagesLoadedCb(null);
              }
            }
          }
          function footageLoaded() {
            this.loadedFootagesCount += 1;
            if (this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages) {
              if (this.imagesLoadedCb) {
                this.imagesLoadedCb(null);
              }
            }
          }
          function getAssetsPath(assetData, assetsPath, originalPath) {
            var path = "";
            if (assetData.e) {
              path = assetData.p;
            } else if (assetsPath) {
              var imagePath = assetData.p;
              if (imagePath.indexOf("images/") !== -1) {
                imagePath = imagePath.split("/")[1];
              }
              path = assetsPath + imagePath;
            } else {
              path = originalPath;
              path += assetData.u ? assetData.u : "";
              path += assetData.p;
            }
            return path;
          }
          function testImageLoaded(img) {
            var _count = 0;
            var intervalId = setInterval((function() {
              var box = img.getBBox();
              if (box.width || _count > 500) {
                this._imageLoaded();
                clearInterval(intervalId);
              }
              _count += 1;
            }).bind(this), 50);
          }
          function createImageData(assetData) {
            var path = getAssetsPath(assetData, this.assetsPath, this.path);
            var img = createNS("image");
            if (isSafari) {
              this.testImageLoaded(img);
            } else {
              img.addEventListener("load", this._imageLoaded, false);
            }
            img.addEventListener("error", (function() {
              ob2.img = proxyImage;
              this._imageLoaded();
            }).bind(this), false);
            img.setAttributeNS("http://www.w3.org/1999/xlink", "href", path);
            if (this._elementHelper.append) {
              this._elementHelper.append(img);
            } else {
              this._elementHelper.appendChild(img);
            }
            var ob2 = {
              img,
              assetData
            };
            return ob2;
          }
          function createImgData(assetData) {
            var path = getAssetsPath(assetData, this.assetsPath, this.path);
            var img = createTag("img");
            img.crossOrigin = "anonymous";
            img.addEventListener("load", this._imageLoaded, false);
            img.addEventListener("error", (function() {
              ob2.img = proxyImage;
              this._imageLoaded();
            }).bind(this), false);
            img.src = path;
            var ob2 = {
              img,
              assetData
            };
            return ob2;
          }
          function createFootageData(data2) {
            var ob2 = {
              assetData: data2
            };
            var path = getAssetsPath(data2, this.assetsPath, this.path);
            dataManager.loadData(path, (function(footageData) {
              ob2.img = footageData;
              this._footageLoaded();
            }).bind(this), (function() {
              ob2.img = {};
              this._footageLoaded();
            }).bind(this));
            return ob2;
          }
          function loadAssets(assets, cb) {
            this.imagesLoadedCb = cb;
            var i3;
            var len = assets.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (!assets[i3].layers) {
                if (!assets[i3].t || assets[i3].t === "seq") {
                  this.totalImages += 1;
                  this.images.push(this._createImageData(assets[i3]));
                } else if (assets[i3].t === 3) {
                  this.totalFootages += 1;
                  this.images.push(this.createFootageData(assets[i3]));
                }
              }
            }
          }
          function setPath(path) {
            this.path = path || "";
          }
          function setAssetsPath(path) {
            this.assetsPath = path || "";
          }
          function getAsset(assetData) {
            var i3 = 0;
            var len = this.images.length;
            while (i3 < len) {
              if (this.images[i3].assetData === assetData) {
                return this.images[i3].img;
              }
              i3 += 1;
            }
            return null;
          }
          function destroy() {
            this.imagesLoadedCb = null;
            this.images.length = 0;
          }
          function loadedImages() {
            return this.totalImages === this.loadedAssets;
          }
          function loadedFootages() {
            return this.totalFootages === this.loadedFootagesCount;
          }
          function setCacheType(type, elementHelper) {
            if (type === "svg") {
              this._elementHelper = elementHelper;
              this._createImageData = this.createImageData.bind(this);
            } else {
              this._createImageData = this.createImgData.bind(this);
            }
          }
          function ImagePreloaderFactory() {
            this._imageLoaded = imageLoaded.bind(this);
            this._footageLoaded = footageLoaded.bind(this);
            this.testImageLoaded = testImageLoaded.bind(this);
            this.createFootageData = createFootageData.bind(this);
            this.assetsPath = "";
            this.path = "";
            this.totalImages = 0;
            this.totalFootages = 0;
            this.loadedAssets = 0;
            this.loadedFootagesCount = 0;
            this.imagesLoadedCb = null;
            this.images = [];
          }
          ImagePreloaderFactory.prototype = {
            loadAssets,
            setAssetsPath,
            setPath,
            loadedImages,
            loadedFootages,
            destroy,
            getAsset,
            createImgData,
            createImageData,
            imageLoaded,
            footageLoaded,
            setCacheType
          };
          return ImagePreloaderFactory;
        })();
        function BaseEvent() {
        }
        BaseEvent.prototype = {
          triggerEvent: function triggerEvent(eventName, args) {
            if (this._cbs[eventName]) {
              var callbacks = this._cbs[eventName];
              for (var i3 = 0; i3 < callbacks.length; i3 += 1) {
                callbacks[i3](args);
              }
            }
          },
          addEventListener: function addEventListener2(eventName, callback) {
            if (!this._cbs[eventName]) {
              this._cbs[eventName] = [];
            }
            this._cbs[eventName].push(callback);
            return (function() {
              this.removeEventListener(eventName, callback);
            }).bind(this);
          },
          removeEventListener: function removeEventListener2(eventName, callback) {
            if (!callback) {
              this._cbs[eventName] = null;
            } else if (this._cbs[eventName]) {
              var i3 = 0;
              var len = this._cbs[eventName].length;
              while (i3 < len) {
                if (this._cbs[eventName][i3] === callback) {
                  this._cbs[eventName].splice(i3, 1);
                  i3 -= 1;
                  len -= 1;
                }
                i3 += 1;
              }
              if (!this._cbs[eventName].length) {
                this._cbs[eventName] = null;
              }
            }
          }
        };
        var markerParser = /* @__PURE__ */ (function() {
          function parsePayloadLines(payload) {
            var lines = payload.split("\r\n");
            var keys = {};
            var line;
            var keysCount = 0;
            for (var i3 = 0; i3 < lines.length; i3 += 1) {
              line = lines[i3].split(":");
              if (line.length === 2) {
                keys[line[0]] = line[1].trim();
                keysCount += 1;
              }
            }
            if (keysCount === 0) {
              throw new Error();
            }
            return keys;
          }
          return function(_markers) {
            var markers = [];
            for (var i3 = 0; i3 < _markers.length; i3 += 1) {
              var _marker = _markers[i3];
              var markerData = {
                time: _marker.tm,
                duration: _marker.dr
              };
              try {
                markerData.payload = JSON.parse(_markers[i3].cm);
              } catch (_3) {
                try {
                  markerData.payload = parsePayloadLines(_markers[i3].cm);
                } catch (__) {
                  markerData.payload = {
                    name: _markers[i3].cm
                  };
                }
              }
              markers.push(markerData);
            }
            return markers;
          };
        })();
        var ProjectInterface = /* @__PURE__ */ (function() {
          function registerComposition(comp2) {
            this.compositions.push(comp2);
          }
          return function() {
            function _thisProjectFunction(name2) {
              var i3 = 0;
              var len = this.compositions.length;
              while (i3 < len) {
                if (this.compositions[i3].data && this.compositions[i3].data.nm === name2) {
                  if (this.compositions[i3].prepareFrame && this.compositions[i3].data.xt) {
                    this.compositions[i3].prepareFrame(this.currentFrame);
                  }
                  return this.compositions[i3].compInterface;
                }
                i3 += 1;
              }
              return null;
            }
            _thisProjectFunction.compositions = [];
            _thisProjectFunction.currentFrame = 0;
            _thisProjectFunction.registerComposition = registerComposition;
            return _thisProjectFunction;
          };
        })();
        var renderers = {};
        var registerRenderer = function registerRenderer2(key2, value2) {
          renderers[key2] = value2;
        };
        function getRenderer(key2) {
          return renderers[key2];
        }
        function getRegisteredRenderer() {
          if (renderers.canvas) {
            return "canvas";
          }
          for (var key2 in renderers) {
            if (renderers[key2]) {
              return key2;
            }
          }
          return "";
        }
        function _typeof$4(o3) {
          "@babel/helpers - typeof";
          return _typeof$4 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$4(o3);
        }
        var AnimationItem = function AnimationItem2() {
          this._cbs = [];
          this.name = "";
          this.path = "";
          this.isLoaded = false;
          this.currentFrame = 0;
          this.currentRawFrame = 0;
          this.firstFrame = 0;
          this.totalFrames = 0;
          this.frameRate = 0;
          this.frameMult = 0;
          this.playSpeed = 1;
          this.playDirection = 1;
          this.playCount = 0;
          this.animationData = {};
          this.assets = [];
          this.isPaused = true;
          this.autoplay = false;
          this.loop = true;
          this.renderer = null;
          this.animationID = createElementID();
          this.assetsPath = "";
          this.timeCompleted = 0;
          this.segmentPos = 0;
          this.isSubframeEnabled = getSubframeEnabled();
          this.segments = [];
          this._idle = true;
          this._completedLoop = false;
          this.projectInterface = ProjectInterface();
          this.imagePreloader = new ImagePreloader();
          this.audioController = audioControllerFactory();
          this.markers = [];
          this.configAnimation = this.configAnimation.bind(this);
          this.onSetupError = this.onSetupError.bind(this);
          this.onSegmentComplete = this.onSegmentComplete.bind(this);
          this.drawnFrameEvent = new BMEnterFrameEvent("drawnFrame", 0, 0, 0);
          this.expressionsPlugin = getExpressionsPlugin();
        };
        extendPrototype([BaseEvent], AnimationItem);
        AnimationItem.prototype.setParams = function(params) {
          if (params.wrapper || params.container) {
            this.wrapper = params.wrapper || params.container;
          }
          var animType = "svg";
          if (params.animType) {
            animType = params.animType;
          } else if (params.renderer) {
            animType = params.renderer;
          }
          var RendererClass = getRenderer(animType);
          this.renderer = new RendererClass(this, params.rendererSettings);
          this.imagePreloader.setCacheType(animType, this.renderer.globalData.defs);
          this.renderer.setProjectInterface(this.projectInterface);
          this.animType = animType;
          if (params.loop === "" || params.loop === null || params.loop === void 0 || params.loop === true) {
            this.loop = true;
          } else if (params.loop === false) {
            this.loop = false;
          } else {
            this.loop = parseInt(params.loop, 10);
          }
          this.autoplay = "autoplay" in params ? params.autoplay : true;
          this.name = params.name ? params.name : "";
          this.autoloadSegments = Object.prototype.hasOwnProperty.call(params, "autoloadSegments") ? params.autoloadSegments : true;
          this.assetsPath = params.assetsPath;
          this.initialSegment = params.initialSegment;
          if (params.audioFactory) {
            this.audioController.setAudioFactory(params.audioFactory);
          }
          if (params.animationData) {
            this.setupAnimation(params.animationData);
          } else if (params.path) {
            if (params.path.lastIndexOf("\\") !== -1) {
              this.path = params.path.substr(0, params.path.lastIndexOf("\\") + 1);
            } else {
              this.path = params.path.substr(0, params.path.lastIndexOf("/") + 1);
            }
            this.fileName = params.path.substr(params.path.lastIndexOf("/") + 1);
            this.fileName = this.fileName.substr(0, this.fileName.lastIndexOf(".json"));
            dataManager.loadAnimation(params.path, this.configAnimation, this.onSetupError);
          }
        };
        AnimationItem.prototype.onSetupError = function() {
          this.trigger("data_failed");
        };
        AnimationItem.prototype.setupAnimation = function(data2) {
          dataManager.completeAnimation(data2, this.configAnimation);
        };
        AnimationItem.prototype.setData = function(wrapper, animationData2) {
          if (animationData2) {
            if (_typeof$4(animationData2) !== "object") {
              animationData2 = JSON.parse(animationData2);
            }
          }
          var params = {
            wrapper,
            animationData: animationData2
          };
          var wrapperAttributes = wrapper.attributes;
          params.path = wrapperAttributes.getNamedItem("data-animation-path") ? wrapperAttributes.getNamedItem("data-animation-path").value : wrapperAttributes.getNamedItem("data-bm-path") ? wrapperAttributes.getNamedItem("data-bm-path").value : wrapperAttributes.getNamedItem("bm-path") ? wrapperAttributes.getNamedItem("bm-path").value : "";
          params.animType = wrapperAttributes.getNamedItem("data-anim-type") ? wrapperAttributes.getNamedItem("data-anim-type").value : wrapperAttributes.getNamedItem("data-bm-type") ? wrapperAttributes.getNamedItem("data-bm-type").value : wrapperAttributes.getNamedItem("bm-type") ? wrapperAttributes.getNamedItem("bm-type").value : wrapperAttributes.getNamedItem("data-bm-renderer") ? wrapperAttributes.getNamedItem("data-bm-renderer").value : wrapperAttributes.getNamedItem("bm-renderer") ? wrapperAttributes.getNamedItem("bm-renderer").value : getRegisteredRenderer() || "canvas";
          var loop = wrapperAttributes.getNamedItem("data-anim-loop") ? wrapperAttributes.getNamedItem("data-anim-loop").value : wrapperAttributes.getNamedItem("data-bm-loop") ? wrapperAttributes.getNamedItem("data-bm-loop").value : wrapperAttributes.getNamedItem("bm-loop") ? wrapperAttributes.getNamedItem("bm-loop").value : "";
          if (loop === "false") {
            params.loop = false;
          } else if (loop === "true") {
            params.loop = true;
          } else if (loop !== "") {
            params.loop = parseInt(loop, 10);
          }
          var autoplay = wrapperAttributes.getNamedItem("data-anim-autoplay") ? wrapperAttributes.getNamedItem("data-anim-autoplay").value : wrapperAttributes.getNamedItem("data-bm-autoplay") ? wrapperAttributes.getNamedItem("data-bm-autoplay").value : wrapperAttributes.getNamedItem("bm-autoplay") ? wrapperAttributes.getNamedItem("bm-autoplay").value : true;
          params.autoplay = autoplay !== "false";
          params.name = wrapperAttributes.getNamedItem("data-name") ? wrapperAttributes.getNamedItem("data-name").value : wrapperAttributes.getNamedItem("data-bm-name") ? wrapperAttributes.getNamedItem("data-bm-name").value : wrapperAttributes.getNamedItem("bm-name") ? wrapperAttributes.getNamedItem("bm-name").value : "";
          var prerender = wrapperAttributes.getNamedItem("data-anim-prerender") ? wrapperAttributes.getNamedItem("data-anim-prerender").value : wrapperAttributes.getNamedItem("data-bm-prerender") ? wrapperAttributes.getNamedItem("data-bm-prerender").value : wrapperAttributes.getNamedItem("bm-prerender") ? wrapperAttributes.getNamedItem("bm-prerender").value : "";
          if (prerender === "false") {
            params.prerender = false;
          }
          if (!params.path) {
            this.trigger("destroy");
          } else {
            this.setParams(params);
          }
        };
        AnimationItem.prototype.includeLayers = function(data2) {
          if (data2.op > this.animationData.op) {
            this.animationData.op = data2.op;
            this.totalFrames = Math.floor(data2.op - this.animationData.ip);
          }
          var layers = this.animationData.layers;
          var i3;
          var len = layers.length;
          var newLayers = data2.layers;
          var j3;
          var jLen = newLayers.length;
          for (j3 = 0; j3 < jLen; j3 += 1) {
            i3 = 0;
            while (i3 < len) {
              if (layers[i3].id === newLayers[j3].id) {
                layers[i3] = newLayers[j3];
                break;
              }
              i3 += 1;
            }
          }
          if (data2.chars || data2.fonts) {
            this.renderer.globalData.fontManager.addChars(data2.chars);
            this.renderer.globalData.fontManager.addFonts(data2.fonts, this.renderer.globalData.defs);
          }
          if (data2.assets) {
            len = data2.assets.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.animationData.assets.push(data2.assets[i3]);
            }
          }
          this.animationData.__complete = false;
          dataManager.completeAnimation(this.animationData, this.onSegmentComplete);
        };
        AnimationItem.prototype.onSegmentComplete = function(data2) {
          this.animationData = data2;
          var expressionsPlugin2 = getExpressionsPlugin();
          if (expressionsPlugin2) {
            expressionsPlugin2.initExpressions(this);
          }
          this.loadNextSegment();
        };
        AnimationItem.prototype.loadNextSegment = function() {
          var segments = this.animationData.segments;
          if (!segments || segments.length === 0 || !this.autoloadSegments) {
            this.trigger("data_ready");
            this.timeCompleted = this.totalFrames;
            return;
          }
          var segment = segments.shift();
          this.timeCompleted = segment.time * this.frameRate;
          var segmentPath = this.path + this.fileName + "_" + this.segmentPos + ".json";
          this.segmentPos += 1;
          dataManager.loadData(segmentPath, this.includeLayers.bind(this), (function() {
            this.trigger("data_failed");
          }).bind(this));
        };
        AnimationItem.prototype.loadSegments = function() {
          var segments = this.animationData.segments;
          if (!segments) {
            this.timeCompleted = this.totalFrames;
          }
          this.loadNextSegment();
        };
        AnimationItem.prototype.imagesLoaded = function() {
          this.trigger("loaded_images");
          this.checkLoaded();
        };
        AnimationItem.prototype.preloadImages = function() {
          this.imagePreloader.setAssetsPath(this.assetsPath);
          this.imagePreloader.setPath(this.path);
          this.imagePreloader.loadAssets(this.animationData.assets, this.imagesLoaded.bind(this));
        };
        AnimationItem.prototype.configAnimation = function(animData) {
          if (!this.renderer) {
            return;
          }
          try {
            this.animationData = animData;
            if (this.initialSegment) {
              this.totalFrames = Math.floor(this.initialSegment[1] - this.initialSegment[0]);
              this.firstFrame = Math.round(this.initialSegment[0]);
            } else {
              this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip);
              this.firstFrame = Math.round(this.animationData.ip);
            }
            this.renderer.configAnimation(animData);
            if (!animData.assets) {
              animData.assets = [];
            }
            this.assets = this.animationData.assets;
            this.frameRate = this.animationData.fr;
            this.frameMult = this.animationData.fr / 1e3;
            this.renderer.searchExtraCompositions(animData.assets);
            this.markers = markerParser(animData.markers || []);
            this.trigger("config_ready");
            this.preloadImages();
            this.loadSegments();
            this.updaFrameModifier();
            this.waitForFontsLoaded();
            if (this.isPaused) {
              this.audioController.pause();
            }
          } catch (error) {
            this.triggerConfigError(error);
          }
        };
        AnimationItem.prototype.waitForFontsLoaded = function() {
          if (!this.renderer) {
            return;
          }
          if (this.renderer.globalData.fontManager.isLoaded) {
            this.checkLoaded();
          } else {
            setTimeout(this.waitForFontsLoaded.bind(this), 20);
          }
        };
        AnimationItem.prototype.checkLoaded = function() {
          if (!this.isLoaded && this.renderer.globalData.fontManager.isLoaded && (this.imagePreloader.loadedImages() || this.renderer.rendererType !== "canvas") && this.imagePreloader.loadedFootages()) {
            this.isLoaded = true;
            var expressionsPlugin2 = getExpressionsPlugin();
            if (expressionsPlugin2) {
              expressionsPlugin2.initExpressions(this);
            }
            this.renderer.initItems();
            setTimeout((function() {
              this.trigger("DOMLoaded");
            }).bind(this), 0);
            this.gotoFrame();
            if (this.autoplay) {
              this.play();
            }
          }
        };
        AnimationItem.prototype.resize = function(width2, height2) {
          var _width = typeof width2 === "number" ? width2 : void 0;
          var _height = typeof height2 === "number" ? height2 : void 0;
          this.renderer.updateContainerSize(_width, _height);
        };
        AnimationItem.prototype.setSubframe = function(flag) {
          this.isSubframeEnabled = !!flag;
        };
        AnimationItem.prototype.gotoFrame = function() {
          this.currentFrame = this.isSubframeEnabled ? this.currentRawFrame : ~~this.currentRawFrame;
          if (this.timeCompleted !== this.totalFrames && this.currentFrame > this.timeCompleted) {
            this.currentFrame = this.timeCompleted;
          }
          this.trigger("enterFrame");
          this.renderFrame();
          this.trigger("drawnFrame");
        };
        AnimationItem.prototype.renderFrame = function() {
          if (this.isLoaded === false || !this.renderer) {
            return;
          }
          try {
            if (this.expressionsPlugin) {
              this.expressionsPlugin.resetFrame();
            }
            this.renderer.renderFrame(this.currentFrame + this.firstFrame);
          } catch (error) {
            this.triggerRenderFrameError(error);
          }
        };
        AnimationItem.prototype.play = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          if (this.isPaused === true) {
            this.isPaused = false;
            this.trigger("_play");
            this.audioController.resume();
            if (this._idle) {
              this._idle = false;
              this.trigger("_active");
            }
          }
        };
        AnimationItem.prototype.pause = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          if (this.isPaused === false) {
            this.isPaused = true;
            this.trigger("_pause");
            this._idle = true;
            this.trigger("_idle");
            this.audioController.pause();
          }
        };
        AnimationItem.prototype.togglePause = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          if (this.isPaused === true) {
            this.play();
          } else {
            this.pause();
          }
        };
        AnimationItem.prototype.stop = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          this.pause();
          this.playCount = 0;
          this._completedLoop = false;
          this.setCurrentRawFrameValue(0);
        };
        AnimationItem.prototype.getMarkerData = function(markerName) {
          var marker;
          for (var i3 = 0; i3 < this.markers.length; i3 += 1) {
            marker = this.markers[i3];
            if (marker.payload && marker.payload.name === markerName) {
              return marker;
            }
          }
          return null;
        };
        AnimationItem.prototype.goToAndStop = function(value2, isFrame, name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          var numValue = Number(value2);
          if (isNaN(numValue)) {
            var marker = this.getMarkerData(value2);
            if (marker) {
              this.goToAndStop(marker.time, true);
            }
          } else if (isFrame) {
            this.setCurrentRawFrameValue(value2);
          } else {
            this.setCurrentRawFrameValue(value2 * this.frameModifier);
          }
          this.pause();
        };
        AnimationItem.prototype.goToAndPlay = function(value2, isFrame, name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          var numValue = Number(value2);
          if (isNaN(numValue)) {
            var marker = this.getMarkerData(value2);
            if (marker) {
              if (!marker.duration) {
                this.goToAndStop(marker.time, true);
              } else {
                this.playSegments([marker.time, marker.time + marker.duration], true);
              }
            }
          } else {
            this.goToAndStop(numValue, isFrame, name2);
          }
          this.play();
        };
        AnimationItem.prototype.advanceTime = function(value2) {
          if (this.isPaused === true || this.isLoaded === false) {
            return;
          }
          var nextValue = this.currentRawFrame + value2 * this.frameModifier;
          var _isComplete = false;
          if (nextValue >= this.totalFrames - 1 && this.frameModifier > 0) {
            if (!this.loop || this.playCount === this.loop) {
              if (!this.checkSegments(nextValue > this.totalFrames ? nextValue % this.totalFrames : 0)) {
                _isComplete = true;
                nextValue = this.totalFrames - 1;
              }
            } else if (nextValue >= this.totalFrames) {
              this.playCount += 1;
              if (!this.checkSegments(nextValue % this.totalFrames)) {
                this.setCurrentRawFrameValue(nextValue % this.totalFrames);
                this._completedLoop = true;
                this.trigger("loopComplete");
              }
            } else {
              this.setCurrentRawFrameValue(nextValue);
            }
          } else if (nextValue < 0) {
            if (!this.checkSegments(nextValue % this.totalFrames)) {
              if (this.loop && !(this.playCount-- <= 0 && this.loop !== true)) {
                this.setCurrentRawFrameValue(this.totalFrames + nextValue % this.totalFrames);
                if (!this._completedLoop) {
                  this._completedLoop = true;
                } else {
                  this.trigger("loopComplete");
                }
              } else {
                _isComplete = true;
                nextValue = 0;
              }
            }
          } else {
            this.setCurrentRawFrameValue(nextValue);
          }
          if (_isComplete) {
            this.setCurrentRawFrameValue(nextValue);
            this.pause();
            this.trigger("complete");
          }
        };
        AnimationItem.prototype.adjustSegment = function(arr, offset) {
          this.playCount = 0;
          if (arr[1] < arr[0]) {
            if (this.frameModifier > 0) {
              if (this.playSpeed < 0) {
                this.setSpeed(-this.playSpeed);
              } else {
                this.setDirection(-1);
              }
            }
            this.totalFrames = arr[0] - arr[1];
            this.timeCompleted = this.totalFrames;
            this.firstFrame = arr[1];
            this.setCurrentRawFrameValue(this.totalFrames - 1e-3 - offset);
          } else if (arr[1] > arr[0]) {
            if (this.frameModifier < 0) {
              if (this.playSpeed < 0) {
                this.setSpeed(-this.playSpeed);
              } else {
                this.setDirection(1);
              }
            }
            this.totalFrames = arr[1] - arr[0];
            this.timeCompleted = this.totalFrames;
            this.firstFrame = arr[0];
            this.setCurrentRawFrameValue(1e-3 + offset);
          }
          this.trigger("segmentStart");
        };
        AnimationItem.prototype.setSegment = function(init2, end) {
          var pendingFrame = -1;
          if (this.isPaused) {
            if (this.currentRawFrame + this.firstFrame < init2) {
              pendingFrame = init2;
            } else if (this.currentRawFrame + this.firstFrame > end) {
              pendingFrame = end - init2;
            }
          }
          this.firstFrame = init2;
          this.totalFrames = end - init2;
          this.timeCompleted = this.totalFrames;
          if (pendingFrame !== -1) {
            this.goToAndStop(pendingFrame, true);
          }
        };
        AnimationItem.prototype.playSegments = function(arr, forceFlag) {
          if (forceFlag) {
            this.segments.length = 0;
          }
          if (_typeof$4(arr[0]) === "object") {
            var i3;
            var len = arr.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.segments.push(arr[i3]);
            }
          } else {
            this.segments.push(arr);
          }
          if (this.segments.length && forceFlag) {
            this.adjustSegment(this.segments.shift(), 0);
          }
          if (this.isPaused) {
            this.play();
          }
        };
        AnimationItem.prototype.resetSegments = function(forceFlag) {
          this.segments.length = 0;
          this.segments.push([this.animationData.ip, this.animationData.op]);
          if (forceFlag) {
            this.checkSegments(0);
          }
        };
        AnimationItem.prototype.checkSegments = function(offset) {
          if (this.segments.length) {
            this.adjustSegment(this.segments.shift(), offset);
            return true;
          }
          return false;
        };
        AnimationItem.prototype.destroy = function(name2) {
          if (name2 && this.name !== name2 || !this.renderer) {
            return;
          }
          this.renderer.destroy();
          this.imagePreloader.destroy();
          this.trigger("destroy");
          this._cbs = null;
          this.onEnterFrame = null;
          this.onLoopComplete = null;
          this.onComplete = null;
          this.onSegmentStart = null;
          this.onDestroy = null;
          this.renderer = null;
          this.expressionsPlugin = null;
          this.imagePreloader = null;
          this.projectInterface = null;
        };
        AnimationItem.prototype.setCurrentRawFrameValue = function(value2) {
          this.currentRawFrame = value2;
          this.gotoFrame();
        };
        AnimationItem.prototype.setSpeed = function(val2) {
          this.playSpeed = val2;
          this.updaFrameModifier();
        };
        AnimationItem.prototype.setDirection = function(val2) {
          this.playDirection = val2 < 0 ? -1 : 1;
          this.updaFrameModifier();
        };
        AnimationItem.prototype.setLoop = function(isLooping) {
          this.loop = isLooping;
        };
        AnimationItem.prototype.setVolume = function(val2, name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          this.audioController.setVolume(val2);
        };
        AnimationItem.prototype.getVolume = function() {
          return this.audioController.getVolume();
        };
        AnimationItem.prototype.mute = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          this.audioController.mute();
        };
        AnimationItem.prototype.unmute = function(name2) {
          if (name2 && this.name !== name2) {
            return;
          }
          this.audioController.unmute();
        };
        AnimationItem.prototype.updaFrameModifier = function() {
          this.frameModifier = this.frameMult * this.playSpeed * this.playDirection;
          this.audioController.setRate(this.playSpeed * this.playDirection);
        };
        AnimationItem.prototype.getPath = function() {
          return this.path;
        };
        AnimationItem.prototype.getAssetsPath = function(assetData) {
          var path = "";
          if (assetData.e) {
            path = assetData.p;
          } else if (this.assetsPath) {
            var imagePath = assetData.p;
            if (imagePath.indexOf("images/") !== -1) {
              imagePath = imagePath.split("/")[1];
            }
            path = this.assetsPath + imagePath;
          } else {
            path = this.path;
            path += assetData.u ? assetData.u : "";
            path += assetData.p;
          }
          return path;
        };
        AnimationItem.prototype.getAssetData = function(id) {
          var i3 = 0;
          var len = this.assets.length;
          while (i3 < len) {
            if (id === this.assets[i3].id) {
              return this.assets[i3];
            }
            i3 += 1;
          }
          return null;
        };
        AnimationItem.prototype.hide = function() {
          this.renderer.hide();
        };
        AnimationItem.prototype.show = function() {
          this.renderer.show();
        };
        AnimationItem.prototype.getDuration = function(isFrame) {
          return isFrame ? this.totalFrames : this.totalFrames / this.frameRate;
        };
        AnimationItem.prototype.updateDocumentData = function(path, documentData, index2) {
          try {
            var element = this.renderer.getElementByPath(path);
            element.updateDocumentData(documentData, index2);
          } catch (error) {
          }
        };
        AnimationItem.prototype.trigger = function(name2) {
          if (this._cbs && this._cbs[name2]) {
            switch (name2) {
              case "enterFrame":
                this.triggerEvent(name2, new BMEnterFrameEvent(name2, this.currentFrame, this.totalFrames, this.frameModifier));
                break;
              case "drawnFrame":
                this.drawnFrameEvent.currentTime = this.currentFrame;
                this.drawnFrameEvent.totalTime = this.totalFrames;
                this.drawnFrameEvent.direction = this.frameModifier;
                this.triggerEvent(name2, this.drawnFrameEvent);
                break;
              case "loopComplete":
                this.triggerEvent(name2, new BMCompleteLoopEvent(name2, this.loop, this.playCount, this.frameMult));
                break;
              case "complete":
                this.triggerEvent(name2, new BMCompleteEvent(name2, this.frameMult));
                break;
              case "segmentStart":
                this.triggerEvent(name2, new BMSegmentStartEvent(name2, this.firstFrame, this.totalFrames));
                break;
              case "destroy":
                this.triggerEvent(name2, new BMDestroyEvent(name2, this));
                break;
              default:
                this.triggerEvent(name2);
            }
          }
          if (name2 === "enterFrame" && this.onEnterFrame) {
            this.onEnterFrame.call(this, new BMEnterFrameEvent(name2, this.currentFrame, this.totalFrames, this.frameMult));
          }
          if (name2 === "loopComplete" && this.onLoopComplete) {
            this.onLoopComplete.call(this, new BMCompleteLoopEvent(name2, this.loop, this.playCount, this.frameMult));
          }
          if (name2 === "complete" && this.onComplete) {
            this.onComplete.call(this, new BMCompleteEvent(name2, this.frameMult));
          }
          if (name2 === "segmentStart" && this.onSegmentStart) {
            this.onSegmentStart.call(this, new BMSegmentStartEvent(name2, this.firstFrame, this.totalFrames));
          }
          if (name2 === "destroy" && this.onDestroy) {
            this.onDestroy.call(this, new BMDestroyEvent(name2, this));
          }
        };
        AnimationItem.prototype.triggerRenderFrameError = function(nativeError) {
          var error = new BMRenderFrameErrorEvent(nativeError, this.currentFrame);
          this.triggerEvent("error", error);
          if (this.onError) {
            this.onError.call(this, error);
          }
        };
        AnimationItem.prototype.triggerConfigError = function(nativeError) {
          var error = new BMConfigErrorEvent(nativeError, this.currentFrame);
          this.triggerEvent("error", error);
          if (this.onError) {
            this.onError.call(this, error);
          }
        };
        var animationManager = (function() {
          var moduleOb = {};
          var registeredAnimations = [];
          var initTime = 0;
          var len = 0;
          var playingAnimationsNum = 0;
          var _stopped = true;
          var _isFrozen = false;
          function removeElement(ev) {
            var i3 = 0;
            var animItem = ev.target;
            while (i3 < len) {
              if (registeredAnimations[i3].animation === animItem) {
                registeredAnimations.splice(i3, 1);
                i3 -= 1;
                len -= 1;
                if (!animItem.isPaused) {
                  subtractPlayingCount();
                }
              }
              i3 += 1;
            }
          }
          function registerAnimation(element, animationData2) {
            if (!element) {
              return null;
            }
            var i3 = 0;
            while (i3 < len) {
              if (registeredAnimations[i3].elem === element && registeredAnimations[i3].elem !== null) {
                return registeredAnimations[i3].animation;
              }
              i3 += 1;
            }
            var animItem = new AnimationItem();
            setupAnimation(animItem, element);
            animItem.setData(element, animationData2);
            return animItem;
          }
          function getRegisteredAnimations() {
            var i3;
            var lenAnims = registeredAnimations.length;
            var animations2 = [];
            for (i3 = 0; i3 < lenAnims; i3 += 1) {
              animations2.push(registeredAnimations[i3].animation);
            }
            return animations2;
          }
          function addPlayingCount() {
            playingAnimationsNum += 1;
            activate();
          }
          function subtractPlayingCount() {
            playingAnimationsNum -= 1;
          }
          function setupAnimation(animItem, element) {
            animItem.addEventListener("destroy", removeElement);
            animItem.addEventListener("_active", addPlayingCount);
            animItem.addEventListener("_idle", subtractPlayingCount);
            registeredAnimations.push({
              elem: element,
              animation: animItem
            });
            len += 1;
          }
          function loadAnimation2(params) {
            var animItem = new AnimationItem();
            setupAnimation(animItem, null);
            animItem.setParams(params);
            return animItem;
          }
          function setSpeed(val2, animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.setSpeed(val2, animation);
            }
          }
          function setDirection(val2, animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.setDirection(val2, animation);
            }
          }
          function play(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.play(animation);
            }
          }
          function resume(nowTime) {
            var elapsedTime = nowTime - initTime;
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.advanceTime(elapsedTime);
            }
            initTime = nowTime;
            if (playingAnimationsNum && !_isFrozen) {
              window.requestAnimationFrame(resume);
            } else {
              _stopped = true;
            }
          }
          function first(nowTime) {
            initTime = nowTime;
            window.requestAnimationFrame(resume);
          }
          function pause(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.pause(animation);
            }
          }
          function goToAndStop(value2, isFrame, animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.goToAndStop(value2, isFrame, animation);
            }
          }
          function stop(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.stop(animation);
            }
          }
          function togglePause(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.togglePause(animation);
            }
          }
          function destroy(animation) {
            var i3;
            for (i3 = len - 1; i3 >= 0; i3 -= 1) {
              registeredAnimations[i3].animation.destroy(animation);
            }
          }
          function searchAnimations2(animationData2, standalone2, renderer2) {
            var animElements = [].concat([].slice.call(document.getElementsByClassName("lottie")), [].slice.call(document.getElementsByClassName("bodymovin")));
            var i3;
            var lenAnims = animElements.length;
            for (i3 = 0; i3 < lenAnims; i3 += 1) {
              if (renderer2) {
                animElements[i3].setAttribute("data-bm-type", renderer2);
              }
              registerAnimation(animElements[i3], animationData2);
            }
            if (standalone2 && lenAnims === 0) {
              if (!renderer2) {
                renderer2 = "svg";
              }
              var body = document.getElementsByTagName("body")[0];
              body.innerText = "";
              var div2 = createTag("div");
              div2.style.width = "100%";
              div2.style.height = "100%";
              div2.setAttribute("data-bm-type", renderer2);
              body.appendChild(div2);
              registerAnimation(div2, animationData2);
            }
          }
          function resize2() {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.resize();
            }
          }
          function activate() {
            if (!_isFrozen && playingAnimationsNum) {
              if (_stopped) {
                window.requestAnimationFrame(first);
                _stopped = false;
              }
            }
          }
          function freeze() {
            _isFrozen = true;
          }
          function unfreeze() {
            _isFrozen = false;
            activate();
          }
          function setVolume(val2, animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.setVolume(val2, animation);
            }
          }
          function mute(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.mute(animation);
            }
          }
          function unmute(animation) {
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              registeredAnimations[i3].animation.unmute(animation);
            }
          }
          moduleOb.registerAnimation = registerAnimation;
          moduleOb.loadAnimation = loadAnimation2;
          moduleOb.setSpeed = setSpeed;
          moduleOb.setDirection = setDirection;
          moduleOb.play = play;
          moduleOb.pause = pause;
          moduleOb.stop = stop;
          moduleOb.togglePause = togglePause;
          moduleOb.searchAnimations = searchAnimations2;
          moduleOb.resize = resize2;
          moduleOb.goToAndStop = goToAndStop;
          moduleOb.destroy = destroy;
          moduleOb.freeze = freeze;
          moduleOb.unfreeze = unfreeze;
          moduleOb.setVolume = setVolume;
          moduleOb.mute = mute;
          moduleOb.unmute = unmute;
          moduleOb.getRegisteredAnimations = getRegisteredAnimations;
          return moduleOb;
        })();
        var BezierFactory = (function() {
          var ob2 = {};
          ob2.getBezierEasing = getBezierEasing;
          var beziers = {};
          function getBezierEasing(a3, b2, c3, d3, nm) {
            var str = nm || ("bez_" + a3 + "_" + b2 + "_" + c3 + "_" + d3).replace(/\./g, "p");
            if (beziers[str]) {
              return beziers[str];
            }
            var bezEasing = new BezierEasing([a3, b2, c3, d3]);
            beziers[str] = bezEasing;
            return bezEasing;
          }
          var NEWTON_ITERATIONS = 4;
          var NEWTON_MIN_SLOPE = 1e-3;
          var SUBDIVISION_PRECISION = 1e-7;
          var SUBDIVISION_MAX_ITERATIONS = 10;
          var kSplineTableSize = 11;
          var kSampleStepSize = 1 / (kSplineTableSize - 1);
          var float32ArraySupported = typeof Float32Array === "function";
          function A3(aA1, aA2) {
            return 1 - 3 * aA2 + 3 * aA1;
          }
          function B3(aA1, aA2) {
            return 3 * aA2 - 6 * aA1;
          }
          function C3(aA1) {
            return 3 * aA1;
          }
          function calcBezier(aT, aA1, aA2) {
            return ((A3(aA1, aA2) * aT + B3(aA1, aA2)) * aT + C3(aA1)) * aT;
          }
          function getSlope(aT, aA1, aA2) {
            return 3 * A3(aA1, aA2) * aT * aT + 2 * B3(aA1, aA2) * aT + C3(aA1);
          }
          function binarySubdivide(aX, aA, aB, mX1, mX2) {
            var currentX, currentT, i3 = 0;
            do {
              currentT = aA + (aB - aA) / 2;
              currentX = calcBezier(currentT, mX1, mX2) - aX;
              if (currentX > 0) {
                aB = currentT;
              } else {
                aA = currentT;
              }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i3 < SUBDIVISION_MAX_ITERATIONS);
            return currentT;
          }
          function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
            for (var i3 = 0; i3 < NEWTON_ITERATIONS; ++i3) {
              var currentSlope = getSlope(aGuessT, mX1, mX2);
              if (currentSlope === 0) return aGuessT;
              var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
              aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
          }
          function BezierEasing(points) {
            this._p = points;
            this._mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
            this._precomputed = false;
            this.get = this.get.bind(this);
          }
          BezierEasing.prototype = {
            get: function get(x3) {
              var mX1 = this._p[0], mY1 = this._p[1], mX2 = this._p[2], mY2 = this._p[3];
              if (!this._precomputed) this._precompute();
              if (mX1 === mY1 && mX2 === mY2) return x3;
              if (x3 === 0) return 0;
              if (x3 === 1) return 1;
              return calcBezier(this._getTForX(x3), mY1, mY2);
            },
            // Private part
            _precompute: function _precompute() {
              var mX1 = this._p[0], mY1 = this._p[1], mX2 = this._p[2], mY2 = this._p[3];
              this._precomputed = true;
              if (mX1 !== mY1 || mX2 !== mY2) {
                this._calcSampleValues();
              }
            },
            _calcSampleValues: function _calcSampleValues() {
              var mX1 = this._p[0], mX2 = this._p[2];
              for (var i3 = 0; i3 < kSplineTableSize; ++i3) {
                this._mSampleValues[i3] = calcBezier(i3 * kSampleStepSize, mX1, mX2);
              }
            },
            /**
                 * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
                 */
            _getTForX: function _getTForX(aX) {
              var mX1 = this._p[0], mX2 = this._p[2], mSampleValues = this._mSampleValues;
              var intervalStart = 0;
              var currentSample = 1;
              var lastSample = kSplineTableSize - 1;
              for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
              }
              --currentSample;
              var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]);
              var guessForT = intervalStart + dist * kSampleStepSize;
              var initialSlope = getSlope(guessForT, mX1, mX2);
              if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
              }
              if (initialSlope === 0) {
                return guessForT;
              }
              return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            }
          };
          return ob2;
        })();
        var pooling = /* @__PURE__ */ (function() {
          function _double(arr) {
            return arr.concat(createSizedArray(arr.length));
          }
          return {
            "double": _double
          };
        })();
        var poolFactory = /* @__PURE__ */ (function() {
          return function(initialLength, _create, _release) {
            var _length = 0;
            var _maxLength = initialLength;
            var pool = createSizedArray(_maxLength);
            var ob2 = {
              newElement,
              release
            };
            function newElement() {
              var element;
              if (_length) {
                _length -= 1;
                element = pool[_length];
              } else {
                element = _create();
              }
              return element;
            }
            function release(element) {
              if (_length === _maxLength) {
                pool = pooling["double"](pool);
                _maxLength *= 2;
              }
              if (_release) {
                _release(element);
              }
              pool[_length] = element;
              _length += 1;
            }
            return ob2;
          };
        })();
        var bezierLengthPool = (function() {
          function create() {
            return {
              addedLength: 0,
              percents: createTypedArray("float32", getDefaultCurveSegments()),
              lengths: createTypedArray("float32", getDefaultCurveSegments())
            };
          }
          return poolFactory(8, create);
        })();
        var segmentsLengthPool = (function() {
          function create() {
            return {
              lengths: [],
              totalLength: 0
            };
          }
          function release(element) {
            var i3;
            var len = element.lengths.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              bezierLengthPool.release(element.lengths[i3]);
            }
            element.lengths.length = 0;
          }
          return poolFactory(8, create, release);
        })();
        function bezFunction() {
          var math = Math;
          function pointOnLine2D(x1, y1, x22, y22, x3, y3) {
            var det1 = x1 * y22 + y1 * x3 + x22 * y3 - x3 * y22 - y3 * x1 - x22 * y1;
            return det1 > -1e-3 && det1 < 1e-3;
          }
          function pointOnLine3D(x1, y1, z1, x22, y22, z22, x3, y3, z3) {
            if (z1 === 0 && z22 === 0 && z3 === 0) {
              return pointOnLine2D(x1, y1, x22, y22, x3, y3);
            }
            var dist1 = math.sqrt(math.pow(x22 - x1, 2) + math.pow(y22 - y1, 2) + math.pow(z22 - z1, 2));
            var dist2 = math.sqrt(math.pow(x3 - x1, 2) + math.pow(y3 - y1, 2) + math.pow(z3 - z1, 2));
            var dist3 = math.sqrt(math.pow(x3 - x22, 2) + math.pow(y3 - y22, 2) + math.pow(z3 - z22, 2));
            var diffDist;
            if (dist1 > dist2) {
              if (dist1 > dist3) {
                diffDist = dist1 - dist2 - dist3;
              } else {
                diffDist = dist3 - dist2 - dist1;
              }
            } else if (dist3 > dist2) {
              diffDist = dist3 - dist2 - dist1;
            } else {
              diffDist = dist2 - dist1 - dist3;
            }
            return diffDist > -1e-4 && diffDist < 1e-4;
          }
          var getBezierLength = /* @__PURE__ */ (function() {
            return function(pt1, pt2, pt3, pt4) {
              var curveSegments = getDefaultCurveSegments();
              var k3;
              var i3;
              var len;
              var ptCoord;
              var perc;
              var addedLength = 0;
              var ptDistance;
              var point = [];
              var lastPoint = [];
              var lengthData = bezierLengthPool.newElement();
              len = pt3.length;
              for (k3 = 0; k3 < curveSegments; k3 += 1) {
                perc = k3 / (curveSegments - 1);
                ptDistance = 0;
                for (i3 = 0; i3 < len; i3 += 1) {
                  ptCoord = bmPow(1 - perc, 3) * pt1[i3] + 3 * bmPow(1 - perc, 2) * perc * pt3[i3] + 3 * (1 - perc) * bmPow(perc, 2) * pt4[i3] + bmPow(perc, 3) * pt2[i3];
                  point[i3] = ptCoord;
                  if (lastPoint[i3] !== null) {
                    ptDistance += bmPow(point[i3] - lastPoint[i3], 2);
                  }
                  lastPoint[i3] = point[i3];
                }
                if (ptDistance) {
                  ptDistance = bmSqrt(ptDistance);
                  addedLength += ptDistance;
                }
                lengthData.percents[k3] = perc;
                lengthData.lengths[k3] = addedLength;
              }
              lengthData.addedLength = addedLength;
              return lengthData;
            };
          })();
          function getSegmentsLength(shapeData) {
            var segmentsLength = segmentsLengthPool.newElement();
            var closed = shapeData.c;
            var pathV = shapeData.v;
            var pathO = shapeData.o;
            var pathI = shapeData.i;
            var i3;
            var len = shapeData._length;
            var lengths = segmentsLength.lengths;
            var totalLength = 0;
            for (i3 = 0; i3 < len - 1; i3 += 1) {
              lengths[i3] = getBezierLength(pathV[i3], pathV[i3 + 1], pathO[i3], pathI[i3 + 1]);
              totalLength += lengths[i3].addedLength;
            }
            if (closed && len) {
              lengths[i3] = getBezierLength(pathV[i3], pathV[0], pathO[i3], pathI[0]);
              totalLength += lengths[i3].addedLength;
            }
            segmentsLength.totalLength = totalLength;
            return segmentsLength;
          }
          function BezierData(length2) {
            this.segmentLength = 0;
            this.points = new Array(length2);
          }
          function PointData(partial, point) {
            this.partialLength = partial;
            this.point = point;
          }
          var buildBezierData = /* @__PURE__ */ (function() {
            var storedData = {};
            return function(pt1, pt2, pt3, pt4) {
              var bezierName = (pt1[0] + "_" + pt1[1] + "_" + pt2[0] + "_" + pt2[1] + "_" + pt3[0] + "_" + pt3[1] + "_" + pt4[0] + "_" + pt4[1]).replace(/\./g, "p");
              if (!storedData[bezierName]) {
                var curveSegments = getDefaultCurveSegments();
                var k3;
                var i3;
                var len;
                var ptCoord;
                var perc;
                var addedLength = 0;
                var ptDistance;
                var point;
                var lastPoint = null;
                if (pt1.length === 2 && (pt1[0] !== pt2[0] || pt1[1] !== pt2[1]) && pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt1[0] + pt3[0], pt1[1] + pt3[1]) && pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt2[0] + pt4[0], pt2[1] + pt4[1])) {
                  curveSegments = 2;
                }
                var bezierData = new BezierData(curveSegments);
                len = pt3.length;
                for (k3 = 0; k3 < curveSegments; k3 += 1) {
                  point = createSizedArray(len);
                  perc = k3 / (curveSegments - 1);
                  ptDistance = 0;
                  for (i3 = 0; i3 < len; i3 += 1) {
                    ptCoord = bmPow(1 - perc, 3) * pt1[i3] + 3 * bmPow(1 - perc, 2) * perc * (pt1[i3] + pt3[i3]) + 3 * (1 - perc) * bmPow(perc, 2) * (pt2[i3] + pt4[i3]) + bmPow(perc, 3) * pt2[i3];
                    point[i3] = ptCoord;
                    if (lastPoint !== null) {
                      ptDistance += bmPow(point[i3] - lastPoint[i3], 2);
                    }
                  }
                  ptDistance = bmSqrt(ptDistance);
                  addedLength += ptDistance;
                  bezierData.points[k3] = new PointData(ptDistance, point);
                  lastPoint = point;
                }
                bezierData.segmentLength = addedLength;
                storedData[bezierName] = bezierData;
              }
              return storedData[bezierName];
            };
          })();
          function getDistancePerc(perc, bezierData) {
            var percents = bezierData.percents;
            var lengths = bezierData.lengths;
            var len = percents.length;
            var initPos = bmFloor((len - 1) * perc);
            var lengthPos = perc * bezierData.addedLength;
            var lPerc = 0;
            if (initPos === len - 1 || initPos === 0 || lengthPos === lengths[initPos]) {
              return percents[initPos];
            }
            var dir = lengths[initPos] > lengthPos ? -1 : 1;
            var flag = true;
            while (flag) {
              if (lengths[initPos] <= lengthPos && lengths[initPos + 1] > lengthPos) {
                lPerc = (lengthPos - lengths[initPos]) / (lengths[initPos + 1] - lengths[initPos]);
                flag = false;
              } else {
                initPos += dir;
              }
              if (initPos < 0 || initPos >= len - 1) {
                if (initPos === len - 1) {
                  return percents[initPos];
                }
                flag = false;
              }
            }
            return percents[initPos] + (percents[initPos + 1] - percents[initPos]) * lPerc;
          }
          function getPointInSegment(pt1, pt2, pt3, pt4, percent, bezierData) {
            var t1 = getDistancePerc(percent, bezierData);
            var u1 = 1 - t1;
            var ptX = math.round((u1 * u1 * u1 * pt1[0] + (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[0] + (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[0] + t1 * t1 * t1 * pt2[0]) * 1e3) / 1e3;
            var ptY = math.round((u1 * u1 * u1 * pt1[1] + (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[1] + (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[1] + t1 * t1 * t1 * pt2[1]) * 1e3) / 1e3;
            return [ptX, ptY];
          }
          var bezierSegmentPoints = createTypedArray("float32", 8);
          function getNewSegment(pt1, pt2, pt3, pt4, startPerc, endPerc, bezierData) {
            if (startPerc < 0) {
              startPerc = 0;
            } else if (startPerc > 1) {
              startPerc = 1;
            }
            var t0 = getDistancePerc(startPerc, bezierData);
            endPerc = endPerc > 1 ? 1 : endPerc;
            var t1 = getDistancePerc(endPerc, bezierData);
            var i3;
            var len = pt1.length;
            var u0 = 1 - t0;
            var u1 = 1 - t1;
            var u0u0u0 = u0 * u0 * u0;
            var t0u0u0_3 = t0 * u0 * u0 * 3;
            var t0t0u0_3 = t0 * t0 * u0 * 3;
            var t0t0t0 = t0 * t0 * t0;
            var u0u0u1 = u0 * u0 * u1;
            var t0u0u1_3 = t0 * u0 * u1 + u0 * t0 * u1 + u0 * u0 * t1;
            var t0t0u1_3 = t0 * t0 * u1 + u0 * t0 * t1 + t0 * u0 * t1;
            var t0t0t1 = t0 * t0 * t1;
            var u0u1u1 = u0 * u1 * u1;
            var t0u1u1_3 = t0 * u1 * u1 + u0 * t1 * u1 + u0 * u1 * t1;
            var t0t1u1_3 = t0 * t1 * u1 + u0 * t1 * t1 + t0 * u1 * t1;
            var t0t1t1 = t0 * t1 * t1;
            var u1u1u1 = u1 * u1 * u1;
            var t1u1u1_3 = t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1;
            var t1t1u1_3 = t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1;
            var t1t1t1 = t1 * t1 * t1;
            for (i3 = 0; i3 < len; i3 += 1) {
              bezierSegmentPoints[i3 * 4] = math.round((u0u0u0 * pt1[i3] + t0u0u0_3 * pt3[i3] + t0t0u0_3 * pt4[i3] + t0t0t0 * pt2[i3]) * 1e3) / 1e3;
              bezierSegmentPoints[i3 * 4 + 1] = math.round((u0u0u1 * pt1[i3] + t0u0u1_3 * pt3[i3] + t0t0u1_3 * pt4[i3] + t0t0t1 * pt2[i3]) * 1e3) / 1e3;
              bezierSegmentPoints[i3 * 4 + 2] = math.round((u0u1u1 * pt1[i3] + t0u1u1_3 * pt3[i3] + t0t1u1_3 * pt4[i3] + t0t1t1 * pt2[i3]) * 1e3) / 1e3;
              bezierSegmentPoints[i3 * 4 + 3] = math.round((u1u1u1 * pt1[i3] + t1u1u1_3 * pt3[i3] + t1t1u1_3 * pt4[i3] + t1t1t1 * pt2[i3]) * 1e3) / 1e3;
            }
            return bezierSegmentPoints;
          }
          return {
            getSegmentsLength,
            getNewSegment,
            getPointInSegment,
            buildBezierData,
            pointOnLine2D,
            pointOnLine3D
          };
        }
        var bez = bezFunction();
        var initFrame = initialDefaultFrame;
        var mathAbs = Math.abs;
        function interpolateValue(frameNum, caching) {
          var offsetTime = this.offsetTime;
          var newValue;
          if (this.propType === "multidimensional") {
            newValue = createTypedArray("float32", this.pv.length);
          }
          var iterationIndex = caching.lastIndex;
          var i3 = iterationIndex;
          var len = this.keyframes.length - 1;
          var flag = true;
          var keyData;
          var nextKeyData;
          var keyframeMetadata;
          while (flag) {
            keyData = this.keyframes[i3];
            nextKeyData = this.keyframes[i3 + 1];
            if (i3 === len - 1 && frameNum >= nextKeyData.t - offsetTime) {
              if (keyData.h) {
                keyData = nextKeyData;
              }
              iterationIndex = 0;
              break;
            }
            if (nextKeyData.t - offsetTime > frameNum) {
              iterationIndex = i3;
              break;
            }
            if (i3 < len - 1) {
              i3 += 1;
            } else {
              iterationIndex = 0;
              flag = false;
            }
          }
          keyframeMetadata = this.keyframesMetadata[i3] || {};
          var k3;
          var kLen;
          var perc;
          var jLen;
          var j3;
          var fnc;
          var nextKeyTime = nextKeyData.t - offsetTime;
          var keyTime = keyData.t - offsetTime;
          var endValue;
          if (keyData.to) {
            if (!keyframeMetadata.bezierData) {
              keyframeMetadata.bezierData = bez.buildBezierData(keyData.s, nextKeyData.s || keyData.e, keyData.to, keyData.ti);
            }
            var bezierData = keyframeMetadata.bezierData;
            if (frameNum >= nextKeyTime || frameNum < keyTime) {
              var ind = frameNum >= nextKeyTime ? bezierData.points.length - 1 : 0;
              kLen = bezierData.points[ind].point.length;
              for (k3 = 0; k3 < kLen; k3 += 1) {
                newValue[k3] = bezierData.points[ind].point[k3];
              }
            } else {
              if (keyframeMetadata.__fnct) {
                fnc = keyframeMetadata.__fnct;
              } else {
                fnc = BezierFactory.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y, keyData.n).get;
                keyframeMetadata.__fnct = fnc;
              }
              perc = fnc((frameNum - keyTime) / (nextKeyTime - keyTime));
              var distanceInLine = bezierData.segmentLength * perc;
              var segmentPerc;
              var addedLength = caching.lastFrame < frameNum && caching._lastKeyframeIndex === i3 ? caching._lastAddedLength : 0;
              j3 = caching.lastFrame < frameNum && caching._lastKeyframeIndex === i3 ? caching._lastPoint : 0;
              flag = true;
              jLen = bezierData.points.length;
              while (flag) {
                addedLength += bezierData.points[j3].partialLength;
                if (distanceInLine === 0 || perc === 0 || j3 === bezierData.points.length - 1) {
                  kLen = bezierData.points[j3].point.length;
                  for (k3 = 0; k3 < kLen; k3 += 1) {
                    newValue[k3] = bezierData.points[j3].point[k3];
                  }
                  break;
                } else if (distanceInLine >= addedLength && distanceInLine < addedLength + bezierData.points[j3 + 1].partialLength) {
                  segmentPerc = (distanceInLine - addedLength) / bezierData.points[j3 + 1].partialLength;
                  kLen = bezierData.points[j3].point.length;
                  for (k3 = 0; k3 < kLen; k3 += 1) {
                    newValue[k3] = bezierData.points[j3].point[k3] + (bezierData.points[j3 + 1].point[k3] - bezierData.points[j3].point[k3]) * segmentPerc;
                  }
                  break;
                }
                if (j3 < jLen - 1) {
                  j3 += 1;
                } else {
                  flag = false;
                }
              }
              caching._lastPoint = j3;
              caching._lastAddedLength = addedLength - bezierData.points[j3].partialLength;
              caching._lastKeyframeIndex = i3;
            }
          } else {
            var outX;
            var outY;
            var inX;
            var inY;
            var keyValue;
            len = keyData.s.length;
            endValue = nextKeyData.s || keyData.e;
            if (this.sh && keyData.h !== 1) {
              if (frameNum >= nextKeyTime) {
                newValue[0] = endValue[0];
                newValue[1] = endValue[1];
                newValue[2] = endValue[2];
              } else if (frameNum <= keyTime) {
                newValue[0] = keyData.s[0];
                newValue[1] = keyData.s[1];
                newValue[2] = keyData.s[2];
              } else {
                var quatStart = createQuaternion(keyData.s);
                var quatEnd = createQuaternion(endValue);
                var time2 = (frameNum - keyTime) / (nextKeyTime - keyTime);
                quaternionToEuler(newValue, slerp(quatStart, quatEnd, time2));
              }
            } else {
              for (i3 = 0; i3 < len; i3 += 1) {
                if (keyData.h !== 1) {
                  if (frameNum >= nextKeyTime) {
                    perc = 1;
                  } else if (frameNum < keyTime) {
                    perc = 0;
                  } else {
                    if (keyData.o.x.constructor === Array) {
                      if (!keyframeMetadata.__fnct) {
                        keyframeMetadata.__fnct = [];
                      }
                      if (!keyframeMetadata.__fnct[i3]) {
                        outX = keyData.o.x[i3] === void 0 ? keyData.o.x[0] : keyData.o.x[i3];
                        outY = keyData.o.y[i3] === void 0 ? keyData.o.y[0] : keyData.o.y[i3];
                        inX = keyData.i.x[i3] === void 0 ? keyData.i.x[0] : keyData.i.x[i3];
                        inY = keyData.i.y[i3] === void 0 ? keyData.i.y[0] : keyData.i.y[i3];
                        fnc = BezierFactory.getBezierEasing(outX, outY, inX, inY).get;
                        keyframeMetadata.__fnct[i3] = fnc;
                      } else {
                        fnc = keyframeMetadata.__fnct[i3];
                      }
                    } else if (!keyframeMetadata.__fnct) {
                      outX = keyData.o.x;
                      outY = keyData.o.y;
                      inX = keyData.i.x;
                      inY = keyData.i.y;
                      fnc = BezierFactory.getBezierEasing(outX, outY, inX, inY).get;
                      keyData.keyframeMetadata = fnc;
                    } else {
                      fnc = keyframeMetadata.__fnct;
                    }
                    perc = fnc((frameNum - keyTime) / (nextKeyTime - keyTime));
                  }
                }
                endValue = nextKeyData.s || keyData.e;
                keyValue = keyData.h === 1 ? keyData.s[i3] : keyData.s[i3] + (endValue[i3] - keyData.s[i3]) * perc;
                if (this.propType === "multidimensional") {
                  newValue[i3] = keyValue;
                } else {
                  newValue = keyValue;
                }
              }
            }
          }
          caching.lastIndex = iterationIndex;
          return newValue;
        }
        function slerp(a3, b2, t3) {
          var out = [];
          var ax = a3[0];
          var ay = a3[1];
          var az = a3[2];
          var aw = a3[3];
          var bx = b2[0];
          var by = b2[1];
          var bz = b2[2];
          var bw = b2[3];
          var omega;
          var cosom;
          var sinom;
          var scale0;
          var scale1;
          cosom = ax * bx + ay * by + az * bz + aw * bw;
          if (cosom < 0) {
            cosom = -cosom;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
          }
          if (1 - cosom > 1e-6) {
            omega = Math.acos(cosom);
            sinom = Math.sin(omega);
            scale0 = Math.sin((1 - t3) * omega) / sinom;
            scale1 = Math.sin(t3 * omega) / sinom;
          } else {
            scale0 = 1 - t3;
            scale1 = t3;
          }
          out[0] = scale0 * ax + scale1 * bx;
          out[1] = scale0 * ay + scale1 * by;
          out[2] = scale0 * az + scale1 * bz;
          out[3] = scale0 * aw + scale1 * bw;
          return out;
        }
        function quaternionToEuler(out, quat) {
          var qx = quat[0];
          var qy = quat[1];
          var qz = quat[2];
          var qw = quat[3];
          var heading = Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy * qy - 2 * qz * qz);
          var attitude = Math.asin(2 * qx * qy + 2 * qz * qw);
          var bank = Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx * qx - 2 * qz * qz);
          out[0] = heading / degToRads;
          out[1] = attitude / degToRads;
          out[2] = bank / degToRads;
        }
        function createQuaternion(values) {
          var heading = values[0] * degToRads;
          var attitude = values[1] * degToRads;
          var bank = values[2] * degToRads;
          var c1 = Math.cos(heading / 2);
          var c22 = Math.cos(attitude / 2);
          var c3 = Math.cos(bank / 2);
          var s1 = Math.sin(heading / 2);
          var s22 = Math.sin(attitude / 2);
          var s3 = Math.sin(bank / 2);
          var w3 = c1 * c22 * c3 - s1 * s22 * s3;
          var x3 = s1 * s22 * c3 + c1 * c22 * s3;
          var y3 = s1 * c22 * c3 + c1 * s22 * s3;
          var z3 = c1 * s22 * c3 - s1 * c22 * s3;
          return [x3, y3, z3, w3];
        }
        function getValueAtCurrentTime() {
          var frameNum = this.comp.renderedFrame - this.offsetTime;
          var initTime = this.keyframes[0].t - this.offsetTime;
          var endTime = this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
          if (!(frameNum === this._caching.lastFrame || this._caching.lastFrame !== initFrame && (this._caching.lastFrame >= endTime && frameNum >= endTime || this._caching.lastFrame < initTime && frameNum < initTime))) {
            if (this._caching.lastFrame >= frameNum) {
              this._caching._lastKeyframeIndex = -1;
              this._caching.lastIndex = 0;
            }
            var renderResult = this.interpolateValue(frameNum, this._caching);
            this.pv = renderResult;
          }
          this._caching.lastFrame = frameNum;
          return this.pv;
        }
        function setVValue(val2) {
          var multipliedValue;
          if (this.propType === "unidimensional") {
            multipliedValue = val2 * this.mult;
            if (mathAbs(this.v - multipliedValue) > 1e-5) {
              this.v = multipliedValue;
              this._mdf = true;
            }
          } else {
            var i3 = 0;
            var len = this.v.length;
            while (i3 < len) {
              multipliedValue = val2[i3] * this.mult;
              if (mathAbs(this.v[i3] - multipliedValue) > 1e-5) {
                this.v[i3] = multipliedValue;
                this._mdf = true;
              }
              i3 += 1;
            }
          }
        }
        function processEffectsSequence() {
          if (this.elem.globalData.frameId === this.frameId || !this.effectsSequence.length) {
            return;
          }
          if (this.lock) {
            this.setVValue(this.pv);
            return;
          }
          this.lock = true;
          this._mdf = this._isFirstFrame;
          var i3;
          var len = this.effectsSequence.length;
          var finalValue = this.kf ? this.pv : this.data.k;
          for (i3 = 0; i3 < len; i3 += 1) {
            finalValue = this.effectsSequence[i3](finalValue);
          }
          this.setVValue(finalValue);
          this._isFirstFrame = false;
          this.lock = false;
          this.frameId = this.elem.globalData.frameId;
        }
        function addEffect(effectFunction) {
          this.effectsSequence.push(effectFunction);
          this.container.addDynamicProperty(this);
        }
        function ValueProperty(elem2, data2, mult, container) {
          this.propType = "unidimensional";
          this.mult = mult || 1;
          this.data = data2;
          this.v = mult ? data2.k * mult : data2.k;
          this.pv = data2.k;
          this._mdf = false;
          this.elem = elem2;
          this.container = container;
          this.comp = elem2.comp;
          this.k = false;
          this.kf = false;
          this.vel = 0;
          this.effectsSequence = [];
          this._isFirstFrame = true;
          this.getValue = processEffectsSequence;
          this.setVValue = setVValue;
          this.addEffect = addEffect;
        }
        function MultiDimensionalProperty(elem2, data2, mult, container) {
          this.propType = "multidimensional";
          this.mult = mult || 1;
          this.data = data2;
          this._mdf = false;
          this.elem = elem2;
          this.container = container;
          this.comp = elem2.comp;
          this.k = false;
          this.kf = false;
          this.frameId = -1;
          var i3;
          var len = data2.k.length;
          this.v = createTypedArray("float32", len);
          this.pv = createTypedArray("float32", len);
          this.vel = createTypedArray("float32", len);
          for (i3 = 0; i3 < len; i3 += 1) {
            this.v[i3] = data2.k[i3] * this.mult;
            this.pv[i3] = data2.k[i3];
          }
          this._isFirstFrame = true;
          this.effectsSequence = [];
          this.getValue = processEffectsSequence;
          this.setVValue = setVValue;
          this.addEffect = addEffect;
        }
        function KeyframedValueProperty(elem2, data2, mult, container) {
          this.propType = "unidimensional";
          this.keyframes = data2.k;
          this.keyframesMetadata = [];
          this.offsetTime = elem2.data.st;
          this.frameId = -1;
          this._caching = {
            lastFrame: initFrame,
            lastIndex: 0,
            value: 0,
            _lastKeyframeIndex: -1
          };
          this.k = true;
          this.kf = true;
          this.data = data2;
          this.mult = mult || 1;
          this.elem = elem2;
          this.container = container;
          this.comp = elem2.comp;
          this.v = initFrame;
          this.pv = initFrame;
          this._isFirstFrame = true;
          this.getValue = processEffectsSequence;
          this.setVValue = setVValue;
          this.interpolateValue = interpolateValue;
          this.effectsSequence = [getValueAtCurrentTime.bind(this)];
          this.addEffect = addEffect;
        }
        function KeyframedMultidimensionalProperty(elem2, data2, mult, container) {
          this.propType = "multidimensional";
          var i3;
          var len = data2.k.length;
          var s3;
          var e3;
          var to;
          var ti;
          for (i3 = 0; i3 < len - 1; i3 += 1) {
            if (data2.k[i3].to && data2.k[i3].s && data2.k[i3 + 1] && data2.k[i3 + 1].s) {
              s3 = data2.k[i3].s;
              e3 = data2.k[i3 + 1].s;
              to = data2.k[i3].to;
              ti = data2.k[i3].ti;
              if (s3.length === 2 && !(s3[0] === e3[0] && s3[1] === e3[1]) && bez.pointOnLine2D(s3[0], s3[1], e3[0], e3[1], s3[0] + to[0], s3[1] + to[1]) && bez.pointOnLine2D(s3[0], s3[1], e3[0], e3[1], e3[0] + ti[0], e3[1] + ti[1]) || s3.length === 3 && !(s3[0] === e3[0] && s3[1] === e3[1] && s3[2] === e3[2]) && bez.pointOnLine3D(s3[0], s3[1], s3[2], e3[0], e3[1], e3[2], s3[0] + to[0], s3[1] + to[1], s3[2] + to[2]) && bez.pointOnLine3D(s3[0], s3[1], s3[2], e3[0], e3[1], e3[2], e3[0] + ti[0], e3[1] + ti[1], e3[2] + ti[2])) {
                data2.k[i3].to = null;
                data2.k[i3].ti = null;
              }
              if (s3[0] === e3[0] && s3[1] === e3[1] && to[0] === 0 && to[1] === 0 && ti[0] === 0 && ti[1] === 0) {
                if (s3.length === 2 || s3[2] === e3[2] && to[2] === 0 && ti[2] === 0) {
                  data2.k[i3].to = null;
                  data2.k[i3].ti = null;
                }
              }
            }
          }
          this.effectsSequence = [getValueAtCurrentTime.bind(this)];
          this.data = data2;
          this.keyframes = data2.k;
          this.keyframesMetadata = [];
          this.offsetTime = elem2.data.st;
          this.k = true;
          this.kf = true;
          this._isFirstFrame = true;
          this.mult = mult || 1;
          this.elem = elem2;
          this.container = container;
          this.comp = elem2.comp;
          this.getValue = processEffectsSequence;
          this.setVValue = setVValue;
          this.interpolateValue = interpolateValue;
          this.frameId = -1;
          var arrLen = data2.k[0].s.length;
          this.v = createTypedArray("float32", arrLen);
          this.pv = createTypedArray("float32", arrLen);
          for (i3 = 0; i3 < arrLen; i3 += 1) {
            this.v[i3] = initFrame;
            this.pv[i3] = initFrame;
          }
          this._caching = {
            lastFrame: initFrame,
            lastIndex: 0,
            value: createTypedArray("float32", arrLen)
          };
          this.addEffect = addEffect;
        }
        var PropertyFactory = /* @__PURE__ */ (function() {
          function getProp(elem2, data2, type, mult, container) {
            if (data2.sid) {
              data2 = elem2.globalData.slotManager.getProp(data2);
            }
            var p3;
            if (!data2.k.length) {
              p3 = new ValueProperty(elem2, data2, mult, container);
            } else if (typeof data2.k[0] === "number") {
              p3 = new MultiDimensionalProperty(elem2, data2, mult, container);
            } else {
              switch (type) {
                case 0:
                  p3 = new KeyframedValueProperty(elem2, data2, mult, container);
                  break;
                case 1:
                  p3 = new KeyframedMultidimensionalProperty(elem2, data2, mult, container);
                  break;
                default:
                  break;
              }
            }
            if (p3.effectsSequence.length) {
              container.addDynamicProperty(p3);
            }
            return p3;
          }
          var ob2 = {
            getProp
          };
          return ob2;
        })();
        function DynamicPropertyContainer() {
        }
        DynamicPropertyContainer.prototype = {
          addDynamicProperty: function addDynamicProperty(prop) {
            if (this.dynamicProperties.indexOf(prop) === -1) {
              this.dynamicProperties.push(prop);
              this.container.addDynamicProperty(this);
              this._isAnimated = true;
            }
          },
          iterateDynamicProperties: function iterateDynamicProperties() {
            this._mdf = false;
            var i3;
            var len = this.dynamicProperties.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.dynamicProperties[i3].getValue();
              if (this.dynamicProperties[i3]._mdf) {
                this._mdf = true;
              }
            }
          },
          initDynamicPropertyContainer: function initDynamicPropertyContainer(container) {
            this.container = container;
            this.dynamicProperties = [];
            this._mdf = false;
            this._isAnimated = false;
          }
        };
        var pointPool = (function() {
          function create() {
            return createTypedArray("float32", 2);
          }
          return poolFactory(8, create);
        })();
        function ShapePath() {
          this.c = false;
          this._length = 0;
          this._maxLength = 8;
          this.v = createSizedArray(this._maxLength);
          this.o = createSizedArray(this._maxLength);
          this.i = createSizedArray(this._maxLength);
        }
        ShapePath.prototype.setPathData = function(closed, len) {
          this.c = closed;
          this.setLength(len);
          var i3 = 0;
          while (i3 < len) {
            this.v[i3] = pointPool.newElement();
            this.o[i3] = pointPool.newElement();
            this.i[i3] = pointPool.newElement();
            i3 += 1;
          }
        };
        ShapePath.prototype.setLength = function(len) {
          while (this._maxLength < len) {
            this.doubleArrayLength();
          }
          this._length = len;
        };
        ShapePath.prototype.doubleArrayLength = function() {
          this.v = this.v.concat(createSizedArray(this._maxLength));
          this.i = this.i.concat(createSizedArray(this._maxLength));
          this.o = this.o.concat(createSizedArray(this._maxLength));
          this._maxLength *= 2;
        };
        ShapePath.prototype.setXYAt = function(x3, y3, type, pos, replace) {
          var arr;
          this._length = Math.max(this._length, pos + 1);
          if (this._length >= this._maxLength) {
            this.doubleArrayLength();
          }
          switch (type) {
            case "v":
              arr = this.v;
              break;
            case "i":
              arr = this.i;
              break;
            case "o":
              arr = this.o;
              break;
            default:
              arr = [];
              break;
          }
          if (!arr[pos] || arr[pos] && !replace) {
            arr[pos] = pointPool.newElement();
          }
          arr[pos][0] = x3;
          arr[pos][1] = y3;
        };
        ShapePath.prototype.setTripleAt = function(vX, vY, oX, oY, iX, iY, pos, replace) {
          this.setXYAt(vX, vY, "v", pos, replace);
          this.setXYAt(oX, oY, "o", pos, replace);
          this.setXYAt(iX, iY, "i", pos, replace);
        };
        ShapePath.prototype.reverse = function() {
          var newPath = new ShapePath();
          newPath.setPathData(this.c, this._length);
          var vertices = this.v;
          var outPoints = this.o;
          var inPoints = this.i;
          var init2 = 0;
          if (this.c) {
            newPath.setTripleAt(vertices[0][0], vertices[0][1], inPoints[0][0], inPoints[0][1], outPoints[0][0], outPoints[0][1], 0, false);
            init2 = 1;
          }
          var cnt = this._length - 1;
          var len = this._length;
          var i3;
          for (i3 = init2; i3 < len; i3 += 1) {
            newPath.setTripleAt(vertices[cnt][0], vertices[cnt][1], inPoints[cnt][0], inPoints[cnt][1], outPoints[cnt][0], outPoints[cnt][1], i3, false);
            cnt -= 1;
          }
          return newPath;
        };
        ShapePath.prototype.length = function() {
          return this._length;
        };
        var shapePool = (function() {
          function create() {
            return new ShapePath();
          }
          function release(shapePath) {
            var len = shapePath._length;
            var i3;
            for (i3 = 0; i3 < len; i3 += 1) {
              pointPool.release(shapePath.v[i3]);
              pointPool.release(shapePath.i[i3]);
              pointPool.release(shapePath.o[i3]);
              shapePath.v[i3] = null;
              shapePath.i[i3] = null;
              shapePath.o[i3] = null;
            }
            shapePath._length = 0;
            shapePath.c = false;
          }
          function clone(shape) {
            var cloned = factory.newElement();
            var i3;
            var len = shape._length === void 0 ? shape.v.length : shape._length;
            cloned.setLength(len);
            cloned.c = shape.c;
            for (i3 = 0; i3 < len; i3 += 1) {
              cloned.setTripleAt(shape.v[i3][0], shape.v[i3][1], shape.o[i3][0], shape.o[i3][1], shape.i[i3][0], shape.i[i3][1], i3);
            }
            return cloned;
          }
          var factory = poolFactory(4, create, release);
          factory.clone = clone;
          return factory;
        })();
        function ShapeCollection() {
          this._length = 0;
          this._maxLength = 4;
          this.shapes = createSizedArray(this._maxLength);
        }
        ShapeCollection.prototype.addShape = function(shapeData) {
          if (this._length === this._maxLength) {
            this.shapes = this.shapes.concat(createSizedArray(this._maxLength));
            this._maxLength *= 2;
          }
          this.shapes[this._length] = shapeData;
          this._length += 1;
        };
        ShapeCollection.prototype.releaseShapes = function() {
          var i3;
          for (i3 = 0; i3 < this._length; i3 += 1) {
            shapePool.release(this.shapes[i3]);
          }
          this._length = 0;
        };
        var shapeCollectionPool = (function() {
          var ob2 = {
            newShapeCollection,
            release
          };
          var _length = 0;
          var _maxLength = 4;
          var pool = createSizedArray(_maxLength);
          function newShapeCollection() {
            var shapeCollection;
            if (_length) {
              _length -= 1;
              shapeCollection = pool[_length];
            } else {
              shapeCollection = new ShapeCollection();
            }
            return shapeCollection;
          }
          function release(shapeCollection) {
            var i3;
            var len = shapeCollection._length;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapePool.release(shapeCollection.shapes[i3]);
            }
            shapeCollection._length = 0;
            if (_length === _maxLength) {
              pool = pooling["double"](pool);
              _maxLength *= 2;
            }
            pool[_length] = shapeCollection;
            _length += 1;
          }
          return ob2;
        })();
        var ShapePropertyFactory = (function() {
          var initFrame2 = -999999;
          function interpolateShape(frameNum, previousValue, caching) {
            var iterationIndex = caching.lastIndex;
            var keyPropS;
            var keyPropE;
            var isHold;
            var j3;
            var k3;
            var jLen;
            var kLen;
            var perc;
            var vertexValue;
            var kf = this.keyframes;
            if (frameNum < kf[0].t - this.offsetTime) {
              keyPropS = kf[0].s[0];
              isHold = true;
              iterationIndex = 0;
            } else if (frameNum >= kf[kf.length - 1].t - this.offsetTime) {
              keyPropS = kf[kf.length - 1].s ? kf[kf.length - 1].s[0] : kf[kf.length - 2].e[0];
              isHold = true;
            } else {
              var i3 = iterationIndex;
              var len = kf.length - 1;
              var flag = true;
              var keyData;
              var nextKeyData;
              var keyframeMetadata;
              while (flag) {
                keyData = kf[i3];
                nextKeyData = kf[i3 + 1];
                if (nextKeyData.t - this.offsetTime > frameNum) {
                  break;
                }
                if (i3 < len - 1) {
                  i3 += 1;
                } else {
                  flag = false;
                }
              }
              keyframeMetadata = this.keyframesMetadata[i3] || {};
              isHold = keyData.h === 1;
              iterationIndex = i3;
              if (!isHold) {
                if (frameNum >= nextKeyData.t - this.offsetTime) {
                  perc = 1;
                } else if (frameNum < keyData.t - this.offsetTime) {
                  perc = 0;
                } else {
                  var fnc;
                  if (keyframeMetadata.__fnct) {
                    fnc = keyframeMetadata.__fnct;
                  } else {
                    fnc = BezierFactory.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y).get;
                    keyframeMetadata.__fnct = fnc;
                  }
                  perc = fnc((frameNum - (keyData.t - this.offsetTime)) / (nextKeyData.t - this.offsetTime - (keyData.t - this.offsetTime)));
                }
                keyPropE = nextKeyData.s ? nextKeyData.s[0] : keyData.e[0];
              }
              keyPropS = keyData.s[0];
            }
            jLen = previousValue._length;
            kLen = keyPropS.i[0].length;
            caching.lastIndex = iterationIndex;
            for (j3 = 0; j3 < jLen; j3 += 1) {
              for (k3 = 0; k3 < kLen; k3 += 1) {
                vertexValue = isHold ? keyPropS.i[j3][k3] : keyPropS.i[j3][k3] + (keyPropE.i[j3][k3] - keyPropS.i[j3][k3]) * perc;
                previousValue.i[j3][k3] = vertexValue;
                vertexValue = isHold ? keyPropS.o[j3][k3] : keyPropS.o[j3][k3] + (keyPropE.o[j3][k3] - keyPropS.o[j3][k3]) * perc;
                previousValue.o[j3][k3] = vertexValue;
                vertexValue = isHold ? keyPropS.v[j3][k3] : keyPropS.v[j3][k3] + (keyPropE.v[j3][k3] - keyPropS.v[j3][k3]) * perc;
                previousValue.v[j3][k3] = vertexValue;
              }
            }
          }
          function interpolateShapeCurrentTime() {
            var frameNum = this.comp.renderedFrame - this.offsetTime;
            var initTime = this.keyframes[0].t - this.offsetTime;
            var endTime = this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
            var lastFrame = this._caching.lastFrame;
            if (!(lastFrame !== initFrame2 && (lastFrame < initTime && frameNum < initTime || lastFrame > endTime && frameNum > endTime))) {
              this._caching.lastIndex = lastFrame < frameNum ? this._caching.lastIndex : 0;
              this.interpolateShape(frameNum, this.pv, this._caching);
            }
            this._caching.lastFrame = frameNum;
            return this.pv;
          }
          function resetShape() {
            this.paths = this.localShapeCollection;
          }
          function shapesEqual(shape1, shape2) {
            if (shape1._length !== shape2._length || shape1.c !== shape2.c) {
              return false;
            }
            var i3;
            var len = shape1._length;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (shape1.v[i3][0] !== shape2.v[i3][0] || shape1.v[i3][1] !== shape2.v[i3][1] || shape1.o[i3][0] !== shape2.o[i3][0] || shape1.o[i3][1] !== shape2.o[i3][1] || shape1.i[i3][0] !== shape2.i[i3][0] || shape1.i[i3][1] !== shape2.i[i3][1]) {
                return false;
              }
            }
            return true;
          }
          function setVValue2(newPath) {
            if (!shapesEqual(this.v, newPath)) {
              this.v = shapePool.clone(newPath);
              this.localShapeCollection.releaseShapes();
              this.localShapeCollection.addShape(this.v);
              this._mdf = true;
              this.paths = this.localShapeCollection;
            }
          }
          function processEffectsSequence2() {
            if (this.elem.globalData.frameId === this.frameId) {
              return;
            }
            if (!this.effectsSequence.length) {
              this._mdf = false;
              return;
            }
            if (this.lock) {
              this.setVValue(this.pv);
              return;
            }
            this.lock = true;
            this._mdf = false;
            var finalValue;
            if (this.kf) {
              finalValue = this.pv;
            } else if (this.data.ks) {
              finalValue = this.data.ks.k;
            } else {
              finalValue = this.data.pt.k;
            }
            var i3;
            var len = this.effectsSequence.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              finalValue = this.effectsSequence[i3](finalValue);
            }
            this.setVValue(finalValue);
            this.lock = false;
            this.frameId = this.elem.globalData.frameId;
          }
          function ShapeProperty(elem2, data2, type) {
            this.propType = "shape";
            this.comp = elem2.comp;
            this.container = elem2;
            this.elem = elem2;
            this.data = data2;
            this.k = false;
            this.kf = false;
            this._mdf = false;
            var pathData = type === 3 ? data2.pt.k : data2.ks.k;
            this.v = shapePool.clone(pathData);
            this.pv = shapePool.clone(this.v);
            this.localShapeCollection = shapeCollectionPool.newShapeCollection();
            this.paths = this.localShapeCollection;
            this.paths.addShape(this.v);
            this.reset = resetShape;
            this.effectsSequence = [];
          }
          function addEffect2(effectFunction) {
            this.effectsSequence.push(effectFunction);
            this.container.addDynamicProperty(this);
          }
          ShapeProperty.prototype.interpolateShape = interpolateShape;
          ShapeProperty.prototype.getValue = processEffectsSequence2;
          ShapeProperty.prototype.setVValue = setVValue2;
          ShapeProperty.prototype.addEffect = addEffect2;
          function KeyframedShapeProperty(elem2, data2, type) {
            this.propType = "shape";
            this.comp = elem2.comp;
            this.elem = elem2;
            this.container = elem2;
            this.offsetTime = elem2.data.st;
            this.keyframes = type === 3 ? data2.pt.k : data2.ks.k;
            this.keyframesMetadata = [];
            this.k = true;
            this.kf = true;
            var len = this.keyframes[0].s[0].i.length;
            this.v = shapePool.newElement();
            this.v.setPathData(this.keyframes[0].s[0].c, len);
            this.pv = shapePool.clone(this.v);
            this.localShapeCollection = shapeCollectionPool.newShapeCollection();
            this.paths = this.localShapeCollection;
            this.paths.addShape(this.v);
            this.lastFrame = initFrame2;
            this.reset = resetShape;
            this._caching = {
              lastFrame: initFrame2,
              lastIndex: 0
            };
            this.effectsSequence = [interpolateShapeCurrentTime.bind(this)];
          }
          KeyframedShapeProperty.prototype.getValue = processEffectsSequence2;
          KeyframedShapeProperty.prototype.interpolateShape = interpolateShape;
          KeyframedShapeProperty.prototype.setVValue = setVValue2;
          KeyframedShapeProperty.prototype.addEffect = addEffect2;
          var EllShapeProperty = (function() {
            var cPoint = roundCorner;
            function EllShapePropertyFactory(elem2, data2) {
              this.v = shapePool.newElement();
              this.v.setPathData(true, 4);
              this.localShapeCollection = shapeCollectionPool.newShapeCollection();
              this.paths = this.localShapeCollection;
              this.localShapeCollection.addShape(this.v);
              this.d = data2.d;
              this.elem = elem2;
              this.comp = elem2.comp;
              this.frameId = -1;
              this.initDynamicPropertyContainer(elem2);
              this.p = PropertyFactory.getProp(elem2, data2.p, 1, 0, this);
              this.s = PropertyFactory.getProp(elem2, data2.s, 1, 0, this);
              if (this.dynamicProperties.length) {
                this.k = true;
              } else {
                this.k = false;
                this.convertEllToPath();
              }
            }
            EllShapePropertyFactory.prototype = {
              reset: resetShape,
              getValue: function getValue() {
                if (this.elem.globalData.frameId === this.frameId) {
                  return;
                }
                this.frameId = this.elem.globalData.frameId;
                this.iterateDynamicProperties();
                if (this._mdf) {
                  this.convertEllToPath();
                }
              },
              convertEllToPath: function convertEllToPath() {
                var p0 = this.p.v[0];
                var p1 = this.p.v[1];
                var s0 = this.s.v[0] / 2;
                var s1 = this.s.v[1] / 2;
                var _cw = this.d !== 3;
                var _v = this.v;
                _v.v[0][0] = p0;
                _v.v[0][1] = p1 - s1;
                _v.v[1][0] = _cw ? p0 + s0 : p0 - s0;
                _v.v[1][1] = p1;
                _v.v[2][0] = p0;
                _v.v[2][1] = p1 + s1;
                _v.v[3][0] = _cw ? p0 - s0 : p0 + s0;
                _v.v[3][1] = p1;
                _v.i[0][0] = _cw ? p0 - s0 * cPoint : p0 + s0 * cPoint;
                _v.i[0][1] = p1 - s1;
                _v.i[1][0] = _cw ? p0 + s0 : p0 - s0;
                _v.i[1][1] = p1 - s1 * cPoint;
                _v.i[2][0] = _cw ? p0 + s0 * cPoint : p0 - s0 * cPoint;
                _v.i[2][1] = p1 + s1;
                _v.i[3][0] = _cw ? p0 - s0 : p0 + s0;
                _v.i[3][1] = p1 + s1 * cPoint;
                _v.o[0][0] = _cw ? p0 + s0 * cPoint : p0 - s0 * cPoint;
                _v.o[0][1] = p1 - s1;
                _v.o[1][0] = _cw ? p0 + s0 : p0 - s0;
                _v.o[1][1] = p1 + s1 * cPoint;
                _v.o[2][0] = _cw ? p0 - s0 * cPoint : p0 + s0 * cPoint;
                _v.o[2][1] = p1 + s1;
                _v.o[3][0] = _cw ? p0 - s0 : p0 + s0;
                _v.o[3][1] = p1 - s1 * cPoint;
              }
            };
            extendPrototype([DynamicPropertyContainer], EllShapePropertyFactory);
            return EllShapePropertyFactory;
          })();
          var StarShapeProperty = (function() {
            function StarShapePropertyFactory(elem2, data2) {
              this.v = shapePool.newElement();
              this.v.setPathData(true, 0);
              this.elem = elem2;
              this.comp = elem2.comp;
              this.data = data2;
              this.frameId = -1;
              this.d = data2.d;
              this.initDynamicPropertyContainer(elem2);
              if (data2.sy === 1) {
                this.ir = PropertyFactory.getProp(elem2, data2.ir, 0, 0, this);
                this.is = PropertyFactory.getProp(elem2, data2.is, 0, 0.01, this);
                this.convertToPath = this.convertStarToPath;
              } else {
                this.convertToPath = this.convertPolygonToPath;
              }
              this.pt = PropertyFactory.getProp(elem2, data2.pt, 0, 0, this);
              this.p = PropertyFactory.getProp(elem2, data2.p, 1, 0, this);
              this.r = PropertyFactory.getProp(elem2, data2.r, 0, degToRads, this);
              this.or = PropertyFactory.getProp(elem2, data2.or, 0, 0, this);
              this.os = PropertyFactory.getProp(elem2, data2.os, 0, 0.01, this);
              this.localShapeCollection = shapeCollectionPool.newShapeCollection();
              this.localShapeCollection.addShape(this.v);
              this.paths = this.localShapeCollection;
              if (this.dynamicProperties.length) {
                this.k = true;
              } else {
                this.k = false;
                this.convertToPath();
              }
            }
            StarShapePropertyFactory.prototype = {
              reset: resetShape,
              getValue: function getValue() {
                if (this.elem.globalData.frameId === this.frameId) {
                  return;
                }
                this.frameId = this.elem.globalData.frameId;
                this.iterateDynamicProperties();
                if (this._mdf) {
                  this.convertToPath();
                }
              },
              convertStarToPath: function convertStarToPath() {
                var numPts = Math.floor(this.pt.v) * 2;
                var angle = Math.PI * 2 / numPts;
                var longFlag = true;
                var longRad = this.or.v;
                var shortRad = this.ir.v;
                var longRound = this.os.v;
                var shortRound = this.is.v;
                var longPerimSegment = 2 * Math.PI * longRad / (numPts * 2);
                var shortPerimSegment = 2 * Math.PI * shortRad / (numPts * 2);
                var i3;
                var rad;
                var roundness;
                var perimSegment;
                var currentAng = -Math.PI / 2;
                currentAng += this.r.v;
                var dir = this.data.d === 3 ? -1 : 1;
                this.v._length = 0;
                for (i3 = 0; i3 < numPts; i3 += 1) {
                  rad = longFlag ? longRad : shortRad;
                  roundness = longFlag ? longRound : shortRound;
                  perimSegment = longFlag ? longPerimSegment : shortPerimSegment;
                  var x3 = rad * Math.cos(currentAng);
                  var y3 = rad * Math.sin(currentAng);
                  var ox = x3 === 0 && y3 === 0 ? 0 : y3 / Math.sqrt(x3 * x3 + y3 * y3);
                  var oy = x3 === 0 && y3 === 0 ? 0 : -x3 / Math.sqrt(x3 * x3 + y3 * y3);
                  x3 += +this.p.v[0];
                  y3 += +this.p.v[1];
                  this.v.setTripleAt(x3, y3, x3 - ox * perimSegment * roundness * dir, y3 - oy * perimSegment * roundness * dir, x3 + ox * perimSegment * roundness * dir, y3 + oy * perimSegment * roundness * dir, i3, true);
                  longFlag = !longFlag;
                  currentAng += angle * dir;
                }
              },
              convertPolygonToPath: function convertPolygonToPath() {
                var numPts = Math.floor(this.pt.v);
                var angle = Math.PI * 2 / numPts;
                var rad = this.or.v;
                var roundness = this.os.v;
                var perimSegment = 2 * Math.PI * rad / (numPts * 4);
                var i3;
                var currentAng = -Math.PI * 0.5;
                var dir = this.data.d === 3 ? -1 : 1;
                currentAng += this.r.v;
                this.v._length = 0;
                for (i3 = 0; i3 < numPts; i3 += 1) {
                  var x3 = rad * Math.cos(currentAng);
                  var y3 = rad * Math.sin(currentAng);
                  var ox = x3 === 0 && y3 === 0 ? 0 : y3 / Math.sqrt(x3 * x3 + y3 * y3);
                  var oy = x3 === 0 && y3 === 0 ? 0 : -x3 / Math.sqrt(x3 * x3 + y3 * y3);
                  x3 += +this.p.v[0];
                  y3 += +this.p.v[1];
                  this.v.setTripleAt(x3, y3, x3 - ox * perimSegment * roundness * dir, y3 - oy * perimSegment * roundness * dir, x3 + ox * perimSegment * roundness * dir, y3 + oy * perimSegment * roundness * dir, i3, true);
                  currentAng += angle * dir;
                }
                this.paths.length = 0;
                this.paths[0] = this.v;
              }
            };
            extendPrototype([DynamicPropertyContainer], StarShapePropertyFactory);
            return StarShapePropertyFactory;
          })();
          var RectShapeProperty = (function() {
            function RectShapePropertyFactory(elem2, data2) {
              this.v = shapePool.newElement();
              this.v.c = true;
              this.localShapeCollection = shapeCollectionPool.newShapeCollection();
              this.localShapeCollection.addShape(this.v);
              this.paths = this.localShapeCollection;
              this.elem = elem2;
              this.comp = elem2.comp;
              this.frameId = -1;
              this.d = data2.d;
              this.initDynamicPropertyContainer(elem2);
              this.p = PropertyFactory.getProp(elem2, data2.p, 1, 0, this);
              this.s = PropertyFactory.getProp(elem2, data2.s, 1, 0, this);
              this.r = PropertyFactory.getProp(elem2, data2.r, 0, 0, this);
              if (this.dynamicProperties.length) {
                this.k = true;
              } else {
                this.k = false;
                this.convertRectToPath();
              }
            }
            RectShapePropertyFactory.prototype = {
              convertRectToPath: function convertRectToPath() {
                var p0 = this.p.v[0];
                var p1 = this.p.v[1];
                var v0 = this.s.v[0] / 2;
                var v1 = this.s.v[1] / 2;
                var round = bmMin(v0, v1, this.r.v);
                var cPoint = round * (1 - roundCorner);
                this.v._length = 0;
                if (this.d === 2 || this.d === 1) {
                  this.v.setTripleAt(p0 + v0, p1 - v1 + round, p0 + v0, p1 - v1 + round, p0 + v0, p1 - v1 + cPoint, 0, true);
                  this.v.setTripleAt(p0 + v0, p1 + v1 - round, p0 + v0, p1 + v1 - cPoint, p0 + v0, p1 + v1 - round, 1, true);
                  if (round !== 0) {
                    this.v.setTripleAt(p0 + v0 - round, p1 + v1, p0 + v0 - round, p1 + v1, p0 + v0 - cPoint, p1 + v1, 2, true);
                    this.v.setTripleAt(p0 - v0 + round, p1 + v1, p0 - v0 + cPoint, p1 + v1, p0 - v0 + round, p1 + v1, 3, true);
                    this.v.setTripleAt(p0 - v0, p1 + v1 - round, p0 - v0, p1 + v1 - round, p0 - v0, p1 + v1 - cPoint, 4, true);
                    this.v.setTripleAt(p0 - v0, p1 - v1 + round, p0 - v0, p1 - v1 + cPoint, p0 - v0, p1 - v1 + round, 5, true);
                    this.v.setTripleAt(p0 - v0 + round, p1 - v1, p0 - v0 + round, p1 - v1, p0 - v0 + cPoint, p1 - v1, 6, true);
                    this.v.setTripleAt(p0 + v0 - round, p1 - v1, p0 + v0 - cPoint, p1 - v1, p0 + v0 - round, p1 - v1, 7, true);
                  } else {
                    this.v.setTripleAt(p0 - v0, p1 + v1, p0 - v0 + cPoint, p1 + v1, p0 - v0, p1 + v1, 2);
                    this.v.setTripleAt(p0 - v0, p1 - v1, p0 - v0, p1 - v1 + cPoint, p0 - v0, p1 - v1, 3);
                  }
                } else {
                  this.v.setTripleAt(p0 + v0, p1 - v1 + round, p0 + v0, p1 - v1 + cPoint, p0 + v0, p1 - v1 + round, 0, true);
                  if (round !== 0) {
                    this.v.setTripleAt(p0 + v0 - round, p1 - v1, p0 + v0 - round, p1 - v1, p0 + v0 - cPoint, p1 - v1, 1, true);
                    this.v.setTripleAt(p0 - v0 + round, p1 - v1, p0 - v0 + cPoint, p1 - v1, p0 - v0 + round, p1 - v1, 2, true);
                    this.v.setTripleAt(p0 - v0, p1 - v1 + round, p0 - v0, p1 - v1 + round, p0 - v0, p1 - v1 + cPoint, 3, true);
                    this.v.setTripleAt(p0 - v0, p1 + v1 - round, p0 - v0, p1 + v1 - cPoint, p0 - v0, p1 + v1 - round, 4, true);
                    this.v.setTripleAt(p0 - v0 + round, p1 + v1, p0 - v0 + round, p1 + v1, p0 - v0 + cPoint, p1 + v1, 5, true);
                    this.v.setTripleAt(p0 + v0 - round, p1 + v1, p0 + v0 - cPoint, p1 + v1, p0 + v0 - round, p1 + v1, 6, true);
                    this.v.setTripleAt(p0 + v0, p1 + v1 - round, p0 + v0, p1 + v1 - round, p0 + v0, p1 + v1 - cPoint, 7, true);
                  } else {
                    this.v.setTripleAt(p0 - v0, p1 - v1, p0 - v0 + cPoint, p1 - v1, p0 - v0, p1 - v1, 1, true);
                    this.v.setTripleAt(p0 - v0, p1 + v1, p0 - v0, p1 + v1 - cPoint, p0 - v0, p1 + v1, 2, true);
                    this.v.setTripleAt(p0 + v0, p1 + v1, p0 + v0 - cPoint, p1 + v1, p0 + v0, p1 + v1, 3, true);
                  }
                }
              },
              getValue: function getValue() {
                if (this.elem.globalData.frameId === this.frameId) {
                  return;
                }
                this.frameId = this.elem.globalData.frameId;
                this.iterateDynamicProperties();
                if (this._mdf) {
                  this.convertRectToPath();
                }
              },
              reset: resetShape
            };
            extendPrototype([DynamicPropertyContainer], RectShapePropertyFactory);
            return RectShapePropertyFactory;
          })();
          function getShapeProp(elem2, data2, type) {
            var prop;
            if (type === 3 || type === 4) {
              var dataProp = type === 3 ? data2.pt : data2.ks;
              var keys = dataProp.k;
              if (keys.length) {
                prop = new KeyframedShapeProperty(elem2, data2, type);
              } else {
                prop = new ShapeProperty(elem2, data2, type);
              }
            } else if (type === 5) {
              prop = new RectShapeProperty(elem2, data2);
            } else if (type === 6) {
              prop = new EllShapeProperty(elem2, data2);
            } else if (type === 7) {
              prop = new StarShapeProperty(elem2, data2);
            }
            if (prop.k) {
              elem2.addDynamicProperty(prop);
            }
            return prop;
          }
          function getConstructorFunction() {
            return ShapeProperty;
          }
          function getKeyframedConstructorFunction() {
            return KeyframedShapeProperty;
          }
          var ob2 = {};
          ob2.getShapeProp = getShapeProp;
          ob2.getConstructorFunction = getConstructorFunction;
          ob2.getKeyframedConstructorFunction = getKeyframedConstructorFunction;
          return ob2;
        })();
        var Matrix = /* @__PURE__ */ (function() {
          var _cos = Math.cos;
          var _sin = Math.sin;
          var _tan = Math.tan;
          var _rnd = Math.round;
          function reset() {
            this.props[0] = 1;
            this.props[1] = 0;
            this.props[2] = 0;
            this.props[3] = 0;
            this.props[4] = 0;
            this.props[5] = 1;
            this.props[6] = 0;
            this.props[7] = 0;
            this.props[8] = 0;
            this.props[9] = 0;
            this.props[10] = 1;
            this.props[11] = 0;
            this.props[12] = 0;
            this.props[13] = 0;
            this.props[14] = 0;
            this.props[15] = 1;
            return this;
          }
          function rotate(angle) {
            if (angle === 0) {
              return this;
            }
            var mCos = _cos(angle);
            var mSin = _sin(angle);
            return this._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function rotateX(angle) {
            if (angle === 0) {
              return this;
            }
            var mCos = _cos(angle);
            var mSin = _sin(angle);
            return this._t(1, 0, 0, 0, 0, mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1);
          }
          function rotateY(angle) {
            if (angle === 0) {
              return this;
            }
            var mCos = _cos(angle);
            var mSin = _sin(angle);
            return this._t(mCos, 0, mSin, 0, 0, 1, 0, 0, -mSin, 0, mCos, 0, 0, 0, 0, 1);
          }
          function rotateZ(angle) {
            if (angle === 0) {
              return this;
            }
            var mCos = _cos(angle);
            var mSin = _sin(angle);
            return this._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function shear(sx, sy) {
            return this._t(1, sy, sx, 1, 0, 0);
          }
          function skew(ax, ay) {
            return this.shear(_tan(ax), _tan(ay));
          }
          function skewFromAxis(ax, angle) {
            var mCos = _cos(angle);
            var mSin = _sin(angle);
            return this._t(mCos, mSin, 0, 0, -mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)._t(1, 0, 0, 0, _tan(ax), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)._t(mCos, -mSin, 0, 0, mSin, mCos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function scale2(sx, sy, sz) {
            if (!sz && sz !== 0) {
              sz = 1;
            }
            if (sx === 1 && sy === 1 && sz === 1) {
              return this;
            }
            return this._t(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
          }
          function setTransform(a3, b2, c3, d3, e3, f3, g3, h3, i3, j3, k3, l3, m3, n2, o3, p3) {
            this.props[0] = a3;
            this.props[1] = b2;
            this.props[2] = c3;
            this.props[3] = d3;
            this.props[4] = e3;
            this.props[5] = f3;
            this.props[6] = g3;
            this.props[7] = h3;
            this.props[8] = i3;
            this.props[9] = j3;
            this.props[10] = k3;
            this.props[11] = l3;
            this.props[12] = m3;
            this.props[13] = n2;
            this.props[14] = o3;
            this.props[15] = p3;
            return this;
          }
          function translate(tx, ty, tz) {
            tz = tz || 0;
            if (tx !== 0 || ty !== 0 || tz !== 0) {
              return this._t(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
            }
            return this;
          }
          function transform2(a22, b2, c22, d22, e22, f22, g22, h22, i22, j22, k22, l22, m22, n2, o22, p22) {
            var _p = this.props;
            if (a22 === 1 && b2 === 0 && c22 === 0 && d22 === 0 && e22 === 0 && f22 === 1 && g22 === 0 && h22 === 0 && i22 === 0 && j22 === 0 && k22 === 1 && l22 === 0) {
              _p[12] = _p[12] * a22 + _p[15] * m22;
              _p[13] = _p[13] * f22 + _p[15] * n2;
              _p[14] = _p[14] * k22 + _p[15] * o22;
              _p[15] *= p22;
              this._identityCalculated = false;
              return this;
            }
            var a1 = _p[0];
            var b1 = _p[1];
            var c1 = _p[2];
            var d1 = _p[3];
            var e1 = _p[4];
            var f1 = _p[5];
            var g1 = _p[6];
            var h1 = _p[7];
            var i1 = _p[8];
            var j1 = _p[9];
            var k1 = _p[10];
            var l1 = _p[11];
            var m1 = _p[12];
            var n1 = _p[13];
            var o1 = _p[14];
            var p1 = _p[15];
            _p[0] = a1 * a22 + b1 * e22 + c1 * i22 + d1 * m22;
            _p[1] = a1 * b2 + b1 * f22 + c1 * j22 + d1 * n2;
            _p[2] = a1 * c22 + b1 * g22 + c1 * k22 + d1 * o22;
            _p[3] = a1 * d22 + b1 * h22 + c1 * l22 + d1 * p22;
            _p[4] = e1 * a22 + f1 * e22 + g1 * i22 + h1 * m22;
            _p[5] = e1 * b2 + f1 * f22 + g1 * j22 + h1 * n2;
            _p[6] = e1 * c22 + f1 * g22 + g1 * k22 + h1 * o22;
            _p[7] = e1 * d22 + f1 * h22 + g1 * l22 + h1 * p22;
            _p[8] = i1 * a22 + j1 * e22 + k1 * i22 + l1 * m22;
            _p[9] = i1 * b2 + j1 * f22 + k1 * j22 + l1 * n2;
            _p[10] = i1 * c22 + j1 * g22 + k1 * k22 + l1 * o22;
            _p[11] = i1 * d22 + j1 * h22 + k1 * l22 + l1 * p22;
            _p[12] = m1 * a22 + n1 * e22 + o1 * i22 + p1 * m22;
            _p[13] = m1 * b2 + n1 * f22 + o1 * j22 + p1 * n2;
            _p[14] = m1 * c22 + n1 * g22 + o1 * k22 + p1 * o22;
            _p[15] = m1 * d22 + n1 * h22 + o1 * l22 + p1 * p22;
            this._identityCalculated = false;
            return this;
          }
          function multiply(matrix) {
            var matrixProps = matrix.props;
            return this.transform(matrixProps[0], matrixProps[1], matrixProps[2], matrixProps[3], matrixProps[4], matrixProps[5], matrixProps[6], matrixProps[7], matrixProps[8], matrixProps[9], matrixProps[10], matrixProps[11], matrixProps[12], matrixProps[13], matrixProps[14], matrixProps[15]);
          }
          function isIdentity() {
            if (!this._identityCalculated) {
              this._identity = !(this.props[0] !== 1 || this.props[1] !== 0 || this.props[2] !== 0 || this.props[3] !== 0 || this.props[4] !== 0 || this.props[5] !== 1 || this.props[6] !== 0 || this.props[7] !== 0 || this.props[8] !== 0 || this.props[9] !== 0 || this.props[10] !== 1 || this.props[11] !== 0 || this.props[12] !== 0 || this.props[13] !== 0 || this.props[14] !== 0 || this.props[15] !== 1);
              this._identityCalculated = true;
            }
            return this._identity;
          }
          function equals(matr) {
            var i3 = 0;
            while (i3 < 16) {
              if (matr.props[i3] !== this.props[i3]) {
                return false;
              }
              i3 += 1;
            }
            return true;
          }
          function clone(matr) {
            var i3;
            for (i3 = 0; i3 < 16; i3 += 1) {
              matr.props[i3] = this.props[i3];
            }
            return matr;
          }
          function cloneFromProps(props) {
            var i3;
            for (i3 = 0; i3 < 16; i3 += 1) {
              this.props[i3] = props[i3];
            }
          }
          function applyToPoint(x3, y3, z3) {
            return {
              x: x3 * this.props[0] + y3 * this.props[4] + z3 * this.props[8] + this.props[12],
              y: x3 * this.props[1] + y3 * this.props[5] + z3 * this.props[9] + this.props[13],
              z: x3 * this.props[2] + y3 * this.props[6] + z3 * this.props[10] + this.props[14]
            };
          }
          function applyToX(x3, y3, z3) {
            return x3 * this.props[0] + y3 * this.props[4] + z3 * this.props[8] + this.props[12];
          }
          function applyToY(x3, y3, z3) {
            return x3 * this.props[1] + y3 * this.props[5] + z3 * this.props[9] + this.props[13];
          }
          function applyToZ(x3, y3, z3) {
            return x3 * this.props[2] + y3 * this.props[6] + z3 * this.props[10] + this.props[14];
          }
          function getInverseMatrix() {
            var determinant = this.props[0] * this.props[5] - this.props[1] * this.props[4];
            var a3 = this.props[5] / determinant;
            var b2 = -this.props[1] / determinant;
            var c3 = -this.props[4] / determinant;
            var d3 = this.props[0] / determinant;
            var e3 = (this.props[4] * this.props[13] - this.props[5] * this.props[12]) / determinant;
            var f3 = -(this.props[0] * this.props[13] - this.props[1] * this.props[12]) / determinant;
            var inverseMatrix = new Matrix();
            inverseMatrix.props[0] = a3;
            inverseMatrix.props[1] = b2;
            inverseMatrix.props[4] = c3;
            inverseMatrix.props[5] = d3;
            inverseMatrix.props[12] = e3;
            inverseMatrix.props[13] = f3;
            return inverseMatrix;
          }
          function inversePoint(pt) {
            var inverseMatrix = this.getInverseMatrix();
            return inverseMatrix.applyToPointArray(pt[0], pt[1], pt[2] || 0);
          }
          function inversePoints(pts) {
            var i3;
            var len = pts.length;
            var retPts = [];
            for (i3 = 0; i3 < len; i3 += 1) {
              retPts[i3] = inversePoint(pts[i3]);
            }
            return retPts;
          }
          function applyToTriplePoints(pt1, pt2, pt3) {
            var arr = createTypedArray("float32", 6);
            if (this.isIdentity()) {
              arr[0] = pt1[0];
              arr[1] = pt1[1];
              arr[2] = pt2[0];
              arr[3] = pt2[1];
              arr[4] = pt3[0];
              arr[5] = pt3[1];
            } else {
              var p0 = this.props[0];
              var p1 = this.props[1];
              var p4 = this.props[4];
              var p5 = this.props[5];
              var p12 = this.props[12];
              var p13 = this.props[13];
              arr[0] = pt1[0] * p0 + pt1[1] * p4 + p12;
              arr[1] = pt1[0] * p1 + pt1[1] * p5 + p13;
              arr[2] = pt2[0] * p0 + pt2[1] * p4 + p12;
              arr[3] = pt2[0] * p1 + pt2[1] * p5 + p13;
              arr[4] = pt3[0] * p0 + pt3[1] * p4 + p12;
              arr[5] = pt3[0] * p1 + pt3[1] * p5 + p13;
            }
            return arr;
          }
          function applyToPointArray(x3, y3, z3) {
            var arr;
            if (this.isIdentity()) {
              arr = [x3, y3, z3];
            } else {
              arr = [x3 * this.props[0] + y3 * this.props[4] + z3 * this.props[8] + this.props[12], x3 * this.props[1] + y3 * this.props[5] + z3 * this.props[9] + this.props[13], x3 * this.props[2] + y3 * this.props[6] + z3 * this.props[10] + this.props[14]];
            }
            return arr;
          }
          function applyToPointStringified(x3, y3) {
            if (this.isIdentity()) {
              return x3 + "," + y3;
            }
            var _p = this.props;
            return Math.round((x3 * _p[0] + y3 * _p[4] + _p[12]) * 100) / 100 + "," + Math.round((x3 * _p[1] + y3 * _p[5] + _p[13]) * 100) / 100;
          }
          function toCSS() {
            var i3 = 0;
            var props = this.props;
            var cssValue = "matrix3d(";
            var v3 = 1e4;
            while (i3 < 16) {
              cssValue += _rnd(props[i3] * v3) / v3;
              cssValue += i3 === 15 ? ")" : ",";
              i3 += 1;
            }
            return cssValue;
          }
          function roundMatrixProperty(val2) {
            var v3 = 1e4;
            if (val2 < 1e-6 && val2 > 0 || val2 > -1e-6 && val2 < 0) {
              return _rnd(val2 * v3) / v3;
            }
            return val2;
          }
          function to2dCSS() {
            var props = this.props;
            var _a = roundMatrixProperty(props[0]);
            var _b = roundMatrixProperty(props[1]);
            var _c = roundMatrixProperty(props[4]);
            var _d = roundMatrixProperty(props[5]);
            var _e = roundMatrixProperty(props[12]);
            var _f = roundMatrixProperty(props[13]);
            return "matrix(" + _a + "," + _b + "," + _c + "," + _d + "," + _e + "," + _f + ")";
          }
          return function() {
            this.reset = reset;
            this.rotate = rotate;
            this.rotateX = rotateX;
            this.rotateY = rotateY;
            this.rotateZ = rotateZ;
            this.skew = skew;
            this.skewFromAxis = skewFromAxis;
            this.shear = shear;
            this.scale = scale2;
            this.setTransform = setTransform;
            this.translate = translate;
            this.transform = transform2;
            this.multiply = multiply;
            this.applyToPoint = applyToPoint;
            this.applyToX = applyToX;
            this.applyToY = applyToY;
            this.applyToZ = applyToZ;
            this.applyToPointArray = applyToPointArray;
            this.applyToTriplePoints = applyToTriplePoints;
            this.applyToPointStringified = applyToPointStringified;
            this.toCSS = toCSS;
            this.to2dCSS = to2dCSS;
            this.clone = clone;
            this.cloneFromProps = cloneFromProps;
            this.equals = equals;
            this.inversePoints = inversePoints;
            this.inversePoint = inversePoint;
            this.getInverseMatrix = getInverseMatrix;
            this._t = this.transform;
            this.isIdentity = isIdentity;
            this._identity = true;
            this._identityCalculated = false;
            this.props = createTypedArray("float32", 16);
            this.reset();
          };
        })();
        function _typeof$3(o3) {
          "@babel/helpers - typeof";
          return _typeof$3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$3(o3);
        }
        var lottie = {};
        var standalone = "__[STANDALONE]__";
        var animationData = "__[ANIMATIONDATA]__";
        var renderer = "";
        function setLocation(href) {
          setLocationHref(href);
        }
        function searchAnimations() {
          if (standalone === true) {
            animationManager.searchAnimations(animationData, standalone, renderer);
          } else {
            animationManager.searchAnimations();
          }
        }
        function setSubframeRendering(flag) {
          setSubframeEnabled(flag);
        }
        function setPrefix(prefix) {
          setIdPrefix(prefix);
        }
        function loadAnimation(params) {
          if (standalone === true) {
            params.animationData = JSON.parse(animationData);
          }
          return animationManager.loadAnimation(params);
        }
        function setQuality(value2) {
          if (typeof value2 === "string") {
            switch (value2) {
              case "high":
                setDefaultCurveSegments(200);
                break;
              default:
              case "medium":
                setDefaultCurveSegments(50);
                break;
              case "low":
                setDefaultCurveSegments(10);
                break;
            }
          } else if (!isNaN(value2) && value2 > 1) {
            setDefaultCurveSegments(value2);
          }
          if (getDefaultCurveSegments() >= 50) {
            roundValues(false);
          } else {
            roundValues(true);
          }
        }
        function inBrowser() {
          return typeof navigator !== "undefined";
        }
        function installPlugin(type, plugin) {
          if (type === "expressions") {
            setExpressionsPlugin(plugin);
          }
        }
        function getFactory(name2) {
          switch (name2) {
            case "propertyFactory":
              return PropertyFactory;
            case "shapePropertyFactory":
              return ShapePropertyFactory;
            case "matrix":
              return Matrix;
            default:
              return null;
          }
        }
        lottie.play = animationManager.play;
        lottie.pause = animationManager.pause;
        lottie.setLocationHref = setLocation;
        lottie.togglePause = animationManager.togglePause;
        lottie.setSpeed = animationManager.setSpeed;
        lottie.setDirection = animationManager.setDirection;
        lottie.stop = animationManager.stop;
        lottie.searchAnimations = searchAnimations;
        lottie.registerAnimation = animationManager.registerAnimation;
        lottie.loadAnimation = loadAnimation;
        lottie.setSubframeRendering = setSubframeRendering;
        lottie.resize = animationManager.resize;
        lottie.goToAndStop = animationManager.goToAndStop;
        lottie.destroy = animationManager.destroy;
        lottie.setQuality = setQuality;
        lottie.inBrowser = inBrowser;
        lottie.installPlugin = installPlugin;
        lottie.freeze = animationManager.freeze;
        lottie.unfreeze = animationManager.unfreeze;
        lottie.setVolume = animationManager.setVolume;
        lottie.mute = animationManager.mute;
        lottie.unmute = animationManager.unmute;
        lottie.getRegisteredAnimations = animationManager.getRegisteredAnimations;
        lottie.useWebWorker = setWebWorker;
        lottie.setIDPrefix = setPrefix;
        lottie.__getFactory = getFactory;
        lottie.version = "5.13.0";
        function checkReady() {
          if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            searchAnimations();
          }
        }
        function getQueryVariable(variable) {
          var vars = queryString.split("&");
          for (var i3 = 0; i3 < vars.length; i3 += 1) {
            var pair = vars[i3].split("=");
            if (decodeURIComponent(pair[0]) == variable) {
              return decodeURIComponent(pair[1]);
            }
          }
          return null;
        }
        var queryString = "";
        if (standalone) {
          var scripts = document.getElementsByTagName("script");
          var index = scripts.length - 1;
          var myScript = scripts[index] || {
            src: ""
          };
          queryString = myScript.src ? myScript.src.replace(/^[^\?]+\??/, "") : "";
          renderer = getQueryVariable("renderer");
        }
        var readyStateCheckInterval = setInterval(checkReady, 100);
        try {
          if (!((typeof exports === "undefined" ? "undefined" : _typeof$3(exports)) === "object" && typeof module !== "undefined") && !(typeof define === "function" && define.amd)) {
            window.bodymovin = lottie;
          }
        } catch (err) {
        }
        var ShapeModifiers = (function() {
          var ob2 = {};
          var modifiers = {};
          ob2.registerModifier = registerModifier;
          ob2.getModifier = getModifier;
          function registerModifier(nm, factory) {
            if (!modifiers[nm]) {
              modifiers[nm] = factory;
            }
          }
          function getModifier(nm, elem2, data2) {
            return new modifiers[nm](elem2, data2);
          }
          return ob2;
        })();
        function ShapeModifier() {
        }
        ShapeModifier.prototype.initModifierProperties = function() {
        };
        ShapeModifier.prototype.addShapeToModifier = function() {
        };
        ShapeModifier.prototype.addShape = function(data2) {
          if (!this.closed) {
            data2.sh.container.addDynamicProperty(data2.sh);
            var shapeData = {
              shape: data2.sh,
              data: data2,
              localShapeCollection: shapeCollectionPool.newShapeCollection()
            };
            this.shapes.push(shapeData);
            this.addShapeToModifier(shapeData);
            if (this._isAnimated) {
              data2.setAsAnimated();
            }
          }
        };
        ShapeModifier.prototype.init = function(elem2, data2) {
          this.shapes = [];
          this.elem = elem2;
          this.initDynamicPropertyContainer(elem2);
          this.initModifierProperties(elem2, data2);
          this.frameId = initialDefaultFrame;
          this.closed = false;
          this.k = false;
          if (this.dynamicProperties.length) {
            this.k = true;
          } else {
            this.getValue(true);
          }
        };
        ShapeModifier.prototype.processKeys = function() {
          if (this.elem.globalData.frameId === this.frameId) {
            return;
          }
          this.frameId = this.elem.globalData.frameId;
          this.iterateDynamicProperties();
        };
        extendPrototype([DynamicPropertyContainer], ShapeModifier);
        function TrimModifier() {
        }
        extendPrototype([ShapeModifier], TrimModifier);
        TrimModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.s = PropertyFactory.getProp(elem2, data2.s, 0, 0.01, this);
          this.e = PropertyFactory.getProp(elem2, data2.e, 0, 0.01, this);
          this.o = PropertyFactory.getProp(elem2, data2.o, 0, 0, this);
          this.sValue = 0;
          this.eValue = 0;
          this.getValue = this.processKeys;
          this.m = data2.m;
          this._isAnimated = !!this.s.effectsSequence.length || !!this.e.effectsSequence.length || !!this.o.effectsSequence.length;
        };
        TrimModifier.prototype.addShapeToModifier = function(shapeData) {
          shapeData.pathsData = [];
        };
        TrimModifier.prototype.calculateShapeEdges = function(s3, e3, shapeLength, addedLength, totalModifierLength) {
          var segments = [];
          if (e3 <= 1) {
            segments.push({
              s: s3,
              e: e3
            });
          } else if (s3 >= 1) {
            segments.push({
              s: s3 - 1,
              e: e3 - 1
            });
          } else {
            segments.push({
              s: s3,
              e: 1
            });
            segments.push({
              s: 0,
              e: e3 - 1
            });
          }
          var shapeSegments = [];
          var i3;
          var len = segments.length;
          var segmentOb;
          for (i3 = 0; i3 < len; i3 += 1) {
            segmentOb = segments[i3];
            if (!(segmentOb.e * totalModifierLength < addedLength || segmentOb.s * totalModifierLength > addedLength + shapeLength)) {
              var shapeS;
              var shapeE;
              if (segmentOb.s * totalModifierLength <= addedLength) {
                shapeS = 0;
              } else {
                shapeS = (segmentOb.s * totalModifierLength - addedLength) / shapeLength;
              }
              if (segmentOb.e * totalModifierLength >= addedLength + shapeLength) {
                shapeE = 1;
              } else {
                shapeE = (segmentOb.e * totalModifierLength - addedLength) / shapeLength;
              }
              shapeSegments.push([shapeS, shapeE]);
            }
          }
          if (!shapeSegments.length) {
            shapeSegments.push([0, 0]);
          }
          return shapeSegments;
        };
        TrimModifier.prototype.releasePathsData = function(pathsData) {
          var i3;
          var len = pathsData.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            segmentsLengthPool.release(pathsData[i3]);
          }
          pathsData.length = 0;
          return pathsData;
        };
        TrimModifier.prototype.processShapes = function(_isFirstFrame) {
          var s3;
          var e3;
          if (this._mdf || _isFirstFrame) {
            var o3 = this.o.v % 360 / 360;
            if (o3 < 0) {
              o3 += 1;
            }
            if (this.s.v > 1) {
              s3 = 1 + o3;
            } else if (this.s.v < 0) {
              s3 = 0 + o3;
            } else {
              s3 = this.s.v + o3;
            }
            if (this.e.v > 1) {
              e3 = 1 + o3;
            } else if (this.e.v < 0) {
              e3 = 0 + o3;
            } else {
              e3 = this.e.v + o3;
            }
            if (s3 > e3) {
              var _s = s3;
              s3 = e3;
              e3 = _s;
            }
            s3 = Math.round(s3 * 1e4) * 1e-4;
            e3 = Math.round(e3 * 1e4) * 1e-4;
            this.sValue = s3;
            this.eValue = e3;
          } else {
            s3 = this.sValue;
            e3 = this.eValue;
          }
          var shapePaths;
          var i3;
          var len = this.shapes.length;
          var j3;
          var jLen;
          var pathsData;
          var pathData;
          var totalShapeLength;
          var totalModifierLength = 0;
          if (e3 === s3) {
            for (i3 = 0; i3 < len; i3 += 1) {
              this.shapes[i3].localShapeCollection.releaseShapes();
              this.shapes[i3].shape._mdf = true;
              this.shapes[i3].shape.paths = this.shapes[i3].localShapeCollection;
              if (this._mdf) {
                this.shapes[i3].pathsData.length = 0;
              }
            }
          } else if (!(e3 === 1 && s3 === 0 || e3 === 0 && s3 === 1)) {
            var segments = [];
            var shapeData;
            var localShapeCollection;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapeData = this.shapes[i3];
              if (!shapeData.shape._mdf && !this._mdf && !_isFirstFrame && this.m !== 2) {
                shapeData.shape.paths = shapeData.localShapeCollection;
              } else {
                shapePaths = shapeData.shape.paths;
                jLen = shapePaths._length;
                totalShapeLength = 0;
                if (!shapeData.shape._mdf && shapeData.pathsData.length) {
                  totalShapeLength = shapeData.totalShapeLength;
                } else {
                  pathsData = this.releasePathsData(shapeData.pathsData);
                  for (j3 = 0; j3 < jLen; j3 += 1) {
                    pathData = bez.getSegmentsLength(shapePaths.shapes[j3]);
                    pathsData.push(pathData);
                    totalShapeLength += pathData.totalLength;
                  }
                  shapeData.totalShapeLength = totalShapeLength;
                  shapeData.pathsData = pathsData;
                }
                totalModifierLength += totalShapeLength;
                shapeData.shape._mdf = true;
              }
            }
            var shapeS = s3;
            var shapeE = e3;
            var addedLength = 0;
            var edges;
            for (i3 = len - 1; i3 >= 0; i3 -= 1) {
              shapeData = this.shapes[i3];
              if (shapeData.shape._mdf) {
                localShapeCollection = shapeData.localShapeCollection;
                localShapeCollection.releaseShapes();
                if (this.m === 2 && len > 1) {
                  edges = this.calculateShapeEdges(s3, e3, shapeData.totalShapeLength, addedLength, totalModifierLength);
                  addedLength += shapeData.totalShapeLength;
                } else {
                  edges = [[shapeS, shapeE]];
                }
                jLen = edges.length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  shapeS = edges[j3][0];
                  shapeE = edges[j3][1];
                  segments.length = 0;
                  if (shapeE <= 1) {
                    segments.push({
                      s: shapeData.totalShapeLength * shapeS,
                      e: shapeData.totalShapeLength * shapeE
                    });
                  } else if (shapeS >= 1) {
                    segments.push({
                      s: shapeData.totalShapeLength * (shapeS - 1),
                      e: shapeData.totalShapeLength * (shapeE - 1)
                    });
                  } else {
                    segments.push({
                      s: shapeData.totalShapeLength * shapeS,
                      e: shapeData.totalShapeLength
                    });
                    segments.push({
                      s: 0,
                      e: shapeData.totalShapeLength * (shapeE - 1)
                    });
                  }
                  var newShapesData = this.addShapes(shapeData, segments[0]);
                  if (segments[0].s !== segments[0].e) {
                    if (segments.length > 1) {
                      var lastShapeInCollection = shapeData.shape.paths.shapes[shapeData.shape.paths._length - 1];
                      if (lastShapeInCollection.c) {
                        var lastShape = newShapesData.pop();
                        this.addPaths(newShapesData, localShapeCollection);
                        newShapesData = this.addShapes(shapeData, segments[1], lastShape);
                      } else {
                        this.addPaths(newShapesData, localShapeCollection);
                        newShapesData = this.addShapes(shapeData, segments[1]);
                      }
                    }
                    this.addPaths(newShapesData, localShapeCollection);
                  }
                }
                shapeData.shape.paths = localShapeCollection;
              }
            }
          } else if (this._mdf) {
            for (i3 = 0; i3 < len; i3 += 1) {
              this.shapes[i3].pathsData.length = 0;
              this.shapes[i3].shape._mdf = true;
            }
          }
        };
        TrimModifier.prototype.addPaths = function(newPaths, localShapeCollection) {
          var i3;
          var len = newPaths.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            localShapeCollection.addShape(newPaths[i3]);
          }
        };
        TrimModifier.prototype.addSegment = function(pt1, pt2, pt3, pt4, shapePath, pos, newShape) {
          shapePath.setXYAt(pt2[0], pt2[1], "o", pos);
          shapePath.setXYAt(pt3[0], pt3[1], "i", pos + 1);
          if (newShape) {
            shapePath.setXYAt(pt1[0], pt1[1], "v", pos);
          }
          shapePath.setXYAt(pt4[0], pt4[1], "v", pos + 1);
        };
        TrimModifier.prototype.addSegmentFromArray = function(points, shapePath, pos, newShape) {
          shapePath.setXYAt(points[1], points[5], "o", pos);
          shapePath.setXYAt(points[2], points[6], "i", pos + 1);
          if (newShape) {
            shapePath.setXYAt(points[0], points[4], "v", pos);
          }
          shapePath.setXYAt(points[3], points[7], "v", pos + 1);
        };
        TrimModifier.prototype.addShapes = function(shapeData, shapeSegment, shapePath) {
          var pathsData = shapeData.pathsData;
          var shapePaths = shapeData.shape.paths.shapes;
          var i3;
          var len = shapeData.shape.paths._length;
          var j3;
          var jLen;
          var addedLength = 0;
          var currentLengthData;
          var segmentCount;
          var lengths;
          var segment;
          var shapes = [];
          var initPos;
          var newShape = true;
          if (!shapePath) {
            shapePath = shapePool.newElement();
            segmentCount = 0;
            initPos = 0;
          } else {
            segmentCount = shapePath._length;
            initPos = shapePath._length;
          }
          shapes.push(shapePath);
          for (i3 = 0; i3 < len; i3 += 1) {
            lengths = pathsData[i3].lengths;
            shapePath.c = shapePaths[i3].c;
            jLen = shapePaths[i3].c ? lengths.length : lengths.length + 1;
            for (j3 = 1; j3 < jLen; j3 += 1) {
              currentLengthData = lengths[j3 - 1];
              if (addedLength + currentLengthData.addedLength < shapeSegment.s) {
                addedLength += currentLengthData.addedLength;
                shapePath.c = false;
              } else if (addedLength > shapeSegment.e) {
                shapePath.c = false;
                break;
              } else {
                if (shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + currentLengthData.addedLength) {
                  this.addSegment(shapePaths[i3].v[j3 - 1], shapePaths[i3].o[j3 - 1], shapePaths[i3].i[j3], shapePaths[i3].v[j3], shapePath, segmentCount, newShape);
                  newShape = false;
                } else {
                  segment = bez.getNewSegment(shapePaths[i3].v[j3 - 1], shapePaths[i3].v[j3], shapePaths[i3].o[j3 - 1], shapePaths[i3].i[j3], (shapeSegment.s - addedLength) / currentLengthData.addedLength, (shapeSegment.e - addedLength) / currentLengthData.addedLength, lengths[j3 - 1]);
                  this.addSegmentFromArray(segment, shapePath, segmentCount, newShape);
                  newShape = false;
                  shapePath.c = false;
                }
                addedLength += currentLengthData.addedLength;
                segmentCount += 1;
              }
            }
            if (shapePaths[i3].c && lengths.length) {
              currentLengthData = lengths[j3 - 1];
              if (addedLength <= shapeSegment.e) {
                var segmentLength = lengths[j3 - 1].addedLength;
                if (shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + segmentLength) {
                  this.addSegment(shapePaths[i3].v[j3 - 1], shapePaths[i3].o[j3 - 1], shapePaths[i3].i[0], shapePaths[i3].v[0], shapePath, segmentCount, newShape);
                  newShape = false;
                } else {
                  segment = bez.getNewSegment(shapePaths[i3].v[j3 - 1], shapePaths[i3].v[0], shapePaths[i3].o[j3 - 1], shapePaths[i3].i[0], (shapeSegment.s - addedLength) / segmentLength, (shapeSegment.e - addedLength) / segmentLength, lengths[j3 - 1]);
                  this.addSegmentFromArray(segment, shapePath, segmentCount, newShape);
                  newShape = false;
                  shapePath.c = false;
                }
              } else {
                shapePath.c = false;
              }
              addedLength += currentLengthData.addedLength;
              segmentCount += 1;
            }
            if (shapePath._length) {
              shapePath.setXYAt(shapePath.v[initPos][0], shapePath.v[initPos][1], "i", initPos);
              shapePath.setXYAt(shapePath.v[shapePath._length - 1][0], shapePath.v[shapePath._length - 1][1], "o", shapePath._length - 1);
            }
            if (addedLength > shapeSegment.e) {
              break;
            }
            if (i3 < len - 1) {
              shapePath = shapePool.newElement();
              newShape = true;
              shapes.push(shapePath);
              segmentCount = 0;
            }
          }
          return shapes;
        };
        function PuckerAndBloatModifier() {
        }
        extendPrototype([ShapeModifier], PuckerAndBloatModifier);
        PuckerAndBloatModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.getValue = this.processKeys;
          this.amount = PropertyFactory.getProp(elem2, data2.a, 0, null, this);
          this._isAnimated = !!this.amount.effectsSequence.length;
        };
        PuckerAndBloatModifier.prototype.processPath = function(path, amount) {
          var percent = amount / 100;
          var centerPoint = [0, 0];
          var pathLength = path._length;
          var i3 = 0;
          for (i3 = 0; i3 < pathLength; i3 += 1) {
            centerPoint[0] += path.v[i3][0];
            centerPoint[1] += path.v[i3][1];
          }
          centerPoint[0] /= pathLength;
          centerPoint[1] /= pathLength;
          var clonedPath = shapePool.newElement();
          clonedPath.c = path.c;
          var vX;
          var vY;
          var oX;
          var oY;
          var iX;
          var iY;
          for (i3 = 0; i3 < pathLength; i3 += 1) {
            vX = path.v[i3][0] + (centerPoint[0] - path.v[i3][0]) * percent;
            vY = path.v[i3][1] + (centerPoint[1] - path.v[i3][1]) * percent;
            oX = path.o[i3][0] + (centerPoint[0] - path.o[i3][0]) * -percent;
            oY = path.o[i3][1] + (centerPoint[1] - path.o[i3][1]) * -percent;
            iX = path.i[i3][0] + (centerPoint[0] - path.i[i3][0]) * -percent;
            iY = path.i[i3][1] + (centerPoint[1] - path.i[i3][1]) * -percent;
            clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, i3);
          }
          return clonedPath;
        };
        PuckerAndBloatModifier.prototype.processShapes = function(_isFirstFrame) {
          var shapePaths;
          var i3;
          var len = this.shapes.length;
          var j3;
          var jLen;
          var amount = this.amount.v;
          if (amount !== 0) {
            var shapeData;
            var localShapeCollection;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapeData = this.shapes[i3];
              localShapeCollection = shapeData.localShapeCollection;
              if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
                localShapeCollection.releaseShapes();
                shapeData.shape._mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  localShapeCollection.addShape(this.processPath(shapePaths[j3], amount));
                }
              }
              shapeData.shape.paths = shapeData.localShapeCollection;
            }
          }
          if (!this.dynamicProperties.length) {
            this._mdf = false;
          }
        };
        var TransformPropertyFactory = (function() {
          var defaultVector = [0, 0];
          function applyToMatrix(mat) {
            var _mdf = this._mdf;
            this.iterateDynamicProperties();
            this._mdf = this._mdf || _mdf;
            if (this.a) {
              mat.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
            }
            if (this.s) {
              mat.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
            }
            if (this.sk) {
              mat.skewFromAxis(-this.sk.v, this.sa.v);
            }
            if (this.r) {
              mat.rotate(-this.r.v);
            } else {
              mat.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
            }
            if (this.data.p.s) {
              if (this.data.p.z) {
                mat.translate(this.px.v, this.py.v, -this.pz.v);
              } else {
                mat.translate(this.px.v, this.py.v, 0);
              }
            } else {
              mat.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
            }
          }
          function processKeys(forceRender) {
            if (this.elem.globalData.frameId === this.frameId) {
              return;
            }
            if (this._isDirty) {
              this.precalculateMatrix();
              this._isDirty = false;
            }
            this.iterateDynamicProperties();
            if (this._mdf || forceRender) {
              var frameRate;
              this.v.cloneFromProps(this.pre.props);
              if (this.appliedTransformations < 1) {
                this.v.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
              }
              if (this.appliedTransformations < 2) {
                this.v.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
              }
              if (this.sk && this.appliedTransformations < 3) {
                this.v.skewFromAxis(-this.sk.v, this.sa.v);
              }
              if (this.r && this.appliedTransformations < 4) {
                this.v.rotate(-this.r.v);
              } else if (!this.r && this.appliedTransformations < 4) {
                this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
              }
              if (this.autoOriented) {
                var v1;
                var v22;
                frameRate = this.elem.globalData.frameRate;
                if (this.p && this.p.keyframes && this.p.getValueAtTime) {
                  if (this.p._caching.lastFrame + this.p.offsetTime <= this.p.keyframes[0].t) {
                    v1 = this.p.getValueAtTime((this.p.keyframes[0].t + 0.01) / frameRate, 0);
                    v22 = this.p.getValueAtTime(this.p.keyframes[0].t / frameRate, 0);
                  } else if (this.p._caching.lastFrame + this.p.offsetTime >= this.p.keyframes[this.p.keyframes.length - 1].t) {
                    v1 = this.p.getValueAtTime(this.p.keyframes[this.p.keyframes.length - 1].t / frameRate, 0);
                    v22 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t - 0.05) / frameRate, 0);
                  } else {
                    v1 = this.p.pv;
                    v22 = this.p.getValueAtTime((this.p._caching.lastFrame + this.p.offsetTime - 0.01) / frameRate, this.p.offsetTime);
                  }
                } else if (this.px && this.px.keyframes && this.py.keyframes && this.px.getValueAtTime && this.py.getValueAtTime) {
                  v1 = [];
                  v22 = [];
                  var px = this.px;
                  var py = this.py;
                  if (px._caching.lastFrame + px.offsetTime <= px.keyframes[0].t) {
                    v1[0] = px.getValueAtTime((px.keyframes[0].t + 0.01) / frameRate, 0);
                    v1[1] = py.getValueAtTime((py.keyframes[0].t + 0.01) / frameRate, 0);
                    v22[0] = px.getValueAtTime(px.keyframes[0].t / frameRate, 0);
                    v22[1] = py.getValueAtTime(py.keyframes[0].t / frameRate, 0);
                  } else if (px._caching.lastFrame + px.offsetTime >= px.keyframes[px.keyframes.length - 1].t) {
                    v1[0] = px.getValueAtTime(px.keyframes[px.keyframes.length - 1].t / frameRate, 0);
                    v1[1] = py.getValueAtTime(py.keyframes[py.keyframes.length - 1].t / frameRate, 0);
                    v22[0] = px.getValueAtTime((px.keyframes[px.keyframes.length - 1].t - 0.01) / frameRate, 0);
                    v22[1] = py.getValueAtTime((py.keyframes[py.keyframes.length - 1].t - 0.01) / frameRate, 0);
                  } else {
                    v1 = [px.pv, py.pv];
                    v22[0] = px.getValueAtTime((px._caching.lastFrame + px.offsetTime - 0.01) / frameRate, px.offsetTime);
                    v22[1] = py.getValueAtTime((py._caching.lastFrame + py.offsetTime - 0.01) / frameRate, py.offsetTime);
                  }
                } else {
                  v22 = defaultVector;
                  v1 = v22;
                }
                this.v.rotate(-Math.atan2(v1[1] - v22[1], v1[0] - v22[0]));
              }
              if (this.data.p && this.data.p.s) {
                if (this.data.p.z) {
                  this.v.translate(this.px.v, this.py.v, -this.pz.v);
                } else {
                  this.v.translate(this.px.v, this.py.v, 0);
                }
              } else {
                this.v.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
              }
            }
            this.frameId = this.elem.globalData.frameId;
          }
          function precalculateMatrix() {
            this.appliedTransformations = 0;
            this.pre.reset();
            if (!this.a.effectsSequence.length) {
              this.pre.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
              this.appliedTransformations = 1;
            } else {
              return;
            }
            if (!this.s.effectsSequence.length) {
              this.pre.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
              this.appliedTransformations = 2;
            } else {
              return;
            }
            if (this.sk) {
              if (!this.sk.effectsSequence.length && !this.sa.effectsSequence.length) {
                this.pre.skewFromAxis(-this.sk.v, this.sa.v);
                this.appliedTransformations = 3;
              } else {
                return;
              }
            }
            if (this.r) {
              if (!this.r.effectsSequence.length) {
                this.pre.rotate(-this.r.v);
                this.appliedTransformations = 4;
              }
            } else if (!this.rz.effectsSequence.length && !this.ry.effectsSequence.length && !this.rx.effectsSequence.length && !this.or.effectsSequence.length) {
              this.pre.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
              this.appliedTransformations = 4;
            }
          }
          function autoOrient() {
          }
          function addDynamicProperty(prop) {
            this._addDynamicProperty(prop);
            this.elem.addDynamicProperty(prop);
            this._isDirty = true;
          }
          function TransformProperty(elem2, data2, container) {
            this.elem = elem2;
            this.frameId = -1;
            this.propType = "transform";
            this.data = data2;
            this.v = new Matrix();
            this.pre = new Matrix();
            this.appliedTransformations = 0;
            this.initDynamicPropertyContainer(container || elem2);
            if (data2.p && data2.p.s) {
              this.px = PropertyFactory.getProp(elem2, data2.p.x, 0, 0, this);
              this.py = PropertyFactory.getProp(elem2, data2.p.y, 0, 0, this);
              if (data2.p.z) {
                this.pz = PropertyFactory.getProp(elem2, data2.p.z, 0, 0, this);
              }
            } else {
              this.p = PropertyFactory.getProp(elem2, data2.p || {
                k: [0, 0, 0]
              }, 1, 0, this);
            }
            if (data2.rx) {
              this.rx = PropertyFactory.getProp(elem2, data2.rx, 0, degToRads, this);
              this.ry = PropertyFactory.getProp(elem2, data2.ry, 0, degToRads, this);
              this.rz = PropertyFactory.getProp(elem2, data2.rz, 0, degToRads, this);
              if (data2.or.k[0].ti) {
                var i3;
                var len = data2.or.k.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  data2.or.k[i3].to = null;
                  data2.or.k[i3].ti = null;
                }
              }
              this.or = PropertyFactory.getProp(elem2, data2.or, 1, degToRads, this);
              this.or.sh = true;
            } else {
              this.r = PropertyFactory.getProp(elem2, data2.r || {
                k: 0
              }, 0, degToRads, this);
            }
            if (data2.sk) {
              this.sk = PropertyFactory.getProp(elem2, data2.sk, 0, degToRads, this);
              this.sa = PropertyFactory.getProp(elem2, data2.sa, 0, degToRads, this);
            }
            this.a = PropertyFactory.getProp(elem2, data2.a || {
              k: [0, 0, 0]
            }, 1, 0, this);
            this.s = PropertyFactory.getProp(elem2, data2.s || {
              k: [100, 100, 100]
            }, 1, 0.01, this);
            if (data2.o) {
              this.o = PropertyFactory.getProp(elem2, data2.o, 0, 0.01, elem2);
            } else {
              this.o = {
                _mdf: false,
                v: 1
              };
            }
            this._isDirty = true;
            if (!this.dynamicProperties.length) {
              this.getValue(true);
            }
          }
          TransformProperty.prototype = {
            applyToMatrix,
            getValue: processKeys,
            precalculateMatrix,
            autoOrient
          };
          extendPrototype([DynamicPropertyContainer], TransformProperty);
          TransformProperty.prototype.addDynamicProperty = addDynamicProperty;
          TransformProperty.prototype._addDynamicProperty = DynamicPropertyContainer.prototype.addDynamicProperty;
          function getTransformProperty(elem2, data2, container) {
            return new TransformProperty(elem2, data2, container);
          }
          return {
            getTransformProperty
          };
        })();
        function RepeaterModifier() {
        }
        extendPrototype([ShapeModifier], RepeaterModifier);
        RepeaterModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.getValue = this.processKeys;
          this.c = PropertyFactory.getProp(elem2, data2.c, 0, null, this);
          this.o = PropertyFactory.getProp(elem2, data2.o, 0, null, this);
          this.tr = TransformPropertyFactory.getTransformProperty(elem2, data2.tr, this);
          this.so = PropertyFactory.getProp(elem2, data2.tr.so, 0, 0.01, this);
          this.eo = PropertyFactory.getProp(elem2, data2.tr.eo, 0, 0.01, this);
          this.data = data2;
          if (!this.dynamicProperties.length) {
            this.getValue(true);
          }
          this._isAnimated = !!this.dynamicProperties.length;
          this.pMatrix = new Matrix();
          this.rMatrix = new Matrix();
          this.sMatrix = new Matrix();
          this.tMatrix = new Matrix();
          this.matrix = new Matrix();
        };
        RepeaterModifier.prototype.applyTransforms = function(pMatrix, rMatrix, sMatrix, transform2, perc, inv) {
          var dir = inv ? -1 : 1;
          var scaleX = transform2.s.v[0] + (1 - transform2.s.v[0]) * (1 - perc);
          var scaleY = transform2.s.v[1] + (1 - transform2.s.v[1]) * (1 - perc);
          pMatrix.translate(transform2.p.v[0] * dir * perc, transform2.p.v[1] * dir * perc, transform2.p.v[2]);
          rMatrix.translate(-transform2.a.v[0], -transform2.a.v[1], transform2.a.v[2]);
          rMatrix.rotate(-transform2.r.v * dir * perc);
          rMatrix.translate(transform2.a.v[0], transform2.a.v[1], transform2.a.v[2]);
          sMatrix.translate(-transform2.a.v[0], -transform2.a.v[1], transform2.a.v[2]);
          sMatrix.scale(inv ? 1 / scaleX : scaleX, inv ? 1 / scaleY : scaleY);
          sMatrix.translate(transform2.a.v[0], transform2.a.v[1], transform2.a.v[2]);
        };
        RepeaterModifier.prototype.init = function(elem2, arr, pos, elemsData) {
          this.elem = elem2;
          this.arr = arr;
          this.pos = pos;
          this.elemsData = elemsData;
          this._currentCopies = 0;
          this._elements = [];
          this._groups = [];
          this.frameId = -1;
          this.initDynamicPropertyContainer(elem2);
          this.initModifierProperties(elem2, arr[pos]);
          while (pos > 0) {
            pos -= 1;
            this._elements.unshift(arr[pos]);
          }
          if (this.dynamicProperties.length) {
            this.k = true;
          } else {
            this.getValue(true);
          }
        };
        RepeaterModifier.prototype.resetElements = function(elements) {
          var i3;
          var len = elements.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            elements[i3]._processed = false;
            if (elements[i3].ty === "gr") {
              this.resetElements(elements[i3].it);
            }
          }
        };
        RepeaterModifier.prototype.cloneElements = function(elements) {
          var newElements = JSON.parse(JSON.stringify(elements));
          this.resetElements(newElements);
          return newElements;
        };
        RepeaterModifier.prototype.changeGroupRender = function(elements, renderFlag) {
          var i3;
          var len = elements.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            elements[i3]._render = renderFlag;
            if (elements[i3].ty === "gr") {
              this.changeGroupRender(elements[i3].it, renderFlag);
            }
          }
        };
        RepeaterModifier.prototype.processShapes = function(_isFirstFrame) {
          var items;
          var itemsTransform;
          var i3;
          var dir;
          var cont;
          var hasReloaded = false;
          if (this._mdf || _isFirstFrame) {
            var copies = Math.ceil(this.c.v);
            if (this._groups.length < copies) {
              while (this._groups.length < copies) {
                var group = {
                  it: this.cloneElements(this._elements),
                  ty: "gr"
                };
                group.it.push({
                  a: {
                    a: 0,
                    ix: 1,
                    k: [0, 0]
                  },
                  nm: "Transform",
                  o: {
                    a: 0,
                    ix: 7,
                    k: 100
                  },
                  p: {
                    a: 0,
                    ix: 2,
                    k: [0, 0]
                  },
                  r: {
                    a: 1,
                    ix: 6,
                    k: [{
                      s: 0,
                      e: 0,
                      t: 0
                    }, {
                      s: 0,
                      e: 0,
                      t: 1
                    }]
                  },
                  s: {
                    a: 0,
                    ix: 3,
                    k: [100, 100]
                  },
                  sa: {
                    a: 0,
                    ix: 5,
                    k: 0
                  },
                  sk: {
                    a: 0,
                    ix: 4,
                    k: 0
                  },
                  ty: "tr"
                });
                this.arr.splice(0, 0, group);
                this._groups.splice(0, 0, group);
                this._currentCopies += 1;
              }
              this.elem.reloadShapes();
              hasReloaded = true;
            }
            cont = 0;
            var renderFlag;
            for (i3 = 0; i3 <= this._groups.length - 1; i3 += 1) {
              renderFlag = cont < copies;
              this._groups[i3]._render = renderFlag;
              this.changeGroupRender(this._groups[i3].it, renderFlag);
              if (!renderFlag) {
                var elems = this.elemsData[i3].it;
                var transformData = elems[elems.length - 1];
                if (transformData.transform.op.v !== 0) {
                  transformData.transform.op._mdf = true;
                  transformData.transform.op.v = 0;
                } else {
                  transformData.transform.op._mdf = false;
                }
              }
              cont += 1;
            }
            this._currentCopies = copies;
            var offset = this.o.v;
            var offsetModulo = offset % 1;
            var roundOffset = offset > 0 ? Math.floor(offset) : Math.ceil(offset);
            var pProps = this.pMatrix.props;
            var rProps = this.rMatrix.props;
            var sProps = this.sMatrix.props;
            this.pMatrix.reset();
            this.rMatrix.reset();
            this.sMatrix.reset();
            this.tMatrix.reset();
            this.matrix.reset();
            var iteration = 0;
            if (offset > 0) {
              while (iteration < roundOffset) {
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                iteration += 1;
              }
              if (offsetModulo) {
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, offsetModulo, false);
                iteration += offsetModulo;
              }
            } else if (offset < 0) {
              while (iteration > roundOffset) {
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, true);
                iteration -= 1;
              }
              if (offsetModulo) {
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, -offsetModulo, true);
                iteration -= offsetModulo;
              }
            }
            i3 = this.data.m === 1 ? 0 : this._currentCopies - 1;
            dir = this.data.m === 1 ? 1 : -1;
            cont = this._currentCopies;
            var j3;
            var jLen;
            while (cont) {
              items = this.elemsData[i3].it;
              itemsTransform = items[items.length - 1].transform.mProps.v.props;
              jLen = itemsTransform.length;
              items[items.length - 1].transform.mProps._mdf = true;
              items[items.length - 1].transform.op._mdf = true;
              items[items.length - 1].transform.op.v = this._currentCopies === 1 ? this.so.v : this.so.v + (this.eo.v - this.so.v) * (i3 / (this._currentCopies - 1));
              if (iteration !== 0) {
                if (i3 !== 0 && dir === 1 || i3 !== this._currentCopies - 1 && dir === -1) {
                  this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                }
                this.matrix.transform(rProps[0], rProps[1], rProps[2], rProps[3], rProps[4], rProps[5], rProps[6], rProps[7], rProps[8], rProps[9], rProps[10], rProps[11], rProps[12], rProps[13], rProps[14], rProps[15]);
                this.matrix.transform(sProps[0], sProps[1], sProps[2], sProps[3], sProps[4], sProps[5], sProps[6], sProps[7], sProps[8], sProps[9], sProps[10], sProps[11], sProps[12], sProps[13], sProps[14], sProps[15]);
                this.matrix.transform(pProps[0], pProps[1], pProps[2], pProps[3], pProps[4], pProps[5], pProps[6], pProps[7], pProps[8], pProps[9], pProps[10], pProps[11], pProps[12], pProps[13], pProps[14], pProps[15]);
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  itemsTransform[j3] = this.matrix.props[j3];
                }
                this.matrix.reset();
              } else {
                this.matrix.reset();
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  itemsTransform[j3] = this.matrix.props[j3];
                }
              }
              iteration += 1;
              cont -= 1;
              i3 += dir;
            }
          } else {
            cont = this._currentCopies;
            i3 = 0;
            dir = 1;
            while (cont) {
              items = this.elemsData[i3].it;
              itemsTransform = items[items.length - 1].transform.mProps.v.props;
              items[items.length - 1].transform.mProps._mdf = false;
              items[items.length - 1].transform.op._mdf = false;
              cont -= 1;
              i3 += dir;
            }
          }
          return hasReloaded;
        };
        RepeaterModifier.prototype.addShape = function() {
        };
        function RoundCornersModifier() {
        }
        extendPrototype([ShapeModifier], RoundCornersModifier);
        RoundCornersModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.getValue = this.processKeys;
          this.rd = PropertyFactory.getProp(elem2, data2.r, 0, null, this);
          this._isAnimated = !!this.rd.effectsSequence.length;
        };
        RoundCornersModifier.prototype.processPath = function(path, round) {
          var clonedPath = shapePool.newElement();
          clonedPath.c = path.c;
          var i3;
          var len = path._length;
          var currentV;
          var currentI;
          var currentO;
          var closerV;
          var distance;
          var newPosPerc;
          var index2 = 0;
          var vX;
          var vY;
          var oX;
          var oY;
          var iX;
          var iY;
          for (i3 = 0; i3 < len; i3 += 1) {
            currentV = path.v[i3];
            currentO = path.o[i3];
            currentI = path.i[i3];
            if (currentV[0] === currentO[0] && currentV[1] === currentO[1] && currentV[0] === currentI[0] && currentV[1] === currentI[1]) {
              if ((i3 === 0 || i3 === len - 1) && !path.c) {
                clonedPath.setTripleAt(currentV[0], currentV[1], currentO[0], currentO[1], currentI[0], currentI[1], index2);
                index2 += 1;
              } else {
                if (i3 === 0) {
                  closerV = path.v[len - 1];
                } else {
                  closerV = path.v[i3 - 1];
                }
                distance = Math.sqrt(Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2));
                newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
                iX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
                vX = iX;
                iY = currentV[1] - (currentV[1] - closerV[1]) * newPosPerc;
                vY = iY;
                oX = vX - (vX - currentV[0]) * roundCorner;
                oY = vY - (vY - currentV[1]) * roundCorner;
                clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index2);
                index2 += 1;
                if (i3 === len - 1) {
                  closerV = path.v[0];
                } else {
                  closerV = path.v[i3 + 1];
                }
                distance = Math.sqrt(Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2));
                newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
                oX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
                vX = oX;
                oY = currentV[1] + (closerV[1] - currentV[1]) * newPosPerc;
                vY = oY;
                iX = vX - (vX - currentV[0]) * roundCorner;
                iY = vY - (vY - currentV[1]) * roundCorner;
                clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index2);
                index2 += 1;
              }
            } else {
              clonedPath.setTripleAt(path.v[i3][0], path.v[i3][1], path.o[i3][0], path.o[i3][1], path.i[i3][0], path.i[i3][1], index2);
              index2 += 1;
            }
          }
          return clonedPath;
        };
        RoundCornersModifier.prototype.processShapes = function(_isFirstFrame) {
          var shapePaths;
          var i3;
          var len = this.shapes.length;
          var j3;
          var jLen;
          var rd = this.rd.v;
          if (rd !== 0) {
            var shapeData;
            var localShapeCollection;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapeData = this.shapes[i3];
              localShapeCollection = shapeData.localShapeCollection;
              if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
                localShapeCollection.releaseShapes();
                shapeData.shape._mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  localShapeCollection.addShape(this.processPath(shapePaths[j3], rd));
                }
              }
              shapeData.shape.paths = shapeData.localShapeCollection;
            }
          }
          if (!this.dynamicProperties.length) {
            this._mdf = false;
          }
        };
        function floatEqual(a3, b2) {
          return Math.abs(a3 - b2) * 1e5 <= Math.min(Math.abs(a3), Math.abs(b2));
        }
        function floatZero(f3) {
          return Math.abs(f3) <= 1e-5;
        }
        function lerp(p0, p1, amount) {
          return p0 * (1 - amount) + p1 * amount;
        }
        function lerpPoint(p0, p1, amount) {
          return [lerp(p0[0], p1[0], amount), lerp(p0[1], p1[1], amount)];
        }
        function quadRoots(a3, b2, c3) {
          if (a3 === 0) return [];
          var s3 = b2 * b2 - 4 * a3 * c3;
          if (s3 < 0) return [];
          var singleRoot = -b2 / (2 * a3);
          if (s3 === 0) return [singleRoot];
          var delta = Math.sqrt(s3) / (2 * a3);
          return [singleRoot - delta, singleRoot + delta];
        }
        function polynomialCoefficients(p0, p1, p22, p3) {
          return [-p0 + 3 * p1 - 3 * p22 + p3, 3 * p0 - 6 * p1 + 3 * p22, -3 * p0 + 3 * p1, p0];
        }
        function singlePoint(p3) {
          return new PolynomialBezier(p3, p3, p3, p3, false);
        }
        function PolynomialBezier(p0, p1, p22, p3, linearize) {
          if (linearize && pointEqual(p0, p1)) {
            p1 = lerpPoint(p0, p3, 1 / 3);
          }
          if (linearize && pointEqual(p22, p3)) {
            p22 = lerpPoint(p0, p3, 2 / 3);
          }
          var coeffx = polynomialCoefficients(p0[0], p1[0], p22[0], p3[0]);
          var coeffy = polynomialCoefficients(p0[1], p1[1], p22[1], p3[1]);
          this.a = [coeffx[0], coeffy[0]];
          this.b = [coeffx[1], coeffy[1]];
          this.c = [coeffx[2], coeffy[2]];
          this.d = [coeffx[3], coeffy[3]];
          this.points = [p0, p1, p22, p3];
        }
        PolynomialBezier.prototype.point = function(t3) {
          return [((this.a[0] * t3 + this.b[0]) * t3 + this.c[0]) * t3 + this.d[0], ((this.a[1] * t3 + this.b[1]) * t3 + this.c[1]) * t3 + this.d[1]];
        };
        PolynomialBezier.prototype.derivative = function(t3) {
          return [(3 * t3 * this.a[0] + 2 * this.b[0]) * t3 + this.c[0], (3 * t3 * this.a[1] + 2 * this.b[1]) * t3 + this.c[1]];
        };
        PolynomialBezier.prototype.tangentAngle = function(t3) {
          var p3 = this.derivative(t3);
          return Math.atan2(p3[1], p3[0]);
        };
        PolynomialBezier.prototype.normalAngle = function(t3) {
          var p3 = this.derivative(t3);
          return Math.atan2(p3[0], p3[1]);
        };
        PolynomialBezier.prototype.inflectionPoints = function() {
          var denom = this.a[1] * this.b[0] - this.a[0] * this.b[1];
          if (floatZero(denom)) return [];
          var tcusp = -0.5 * (this.a[1] * this.c[0] - this.a[0] * this.c[1]) / denom;
          var square = tcusp * tcusp - 1 / 3 * (this.b[1] * this.c[0] - this.b[0] * this.c[1]) / denom;
          if (square < 0) return [];
          var root2 = Math.sqrt(square);
          if (floatZero(root2)) {
            if (root2 > 0 && root2 < 1) return [tcusp];
            return [];
          }
          return [tcusp - root2, tcusp + root2].filter(function(r3) {
            return r3 > 0 && r3 < 1;
          });
        };
        PolynomialBezier.prototype.split = function(t3) {
          if (t3 <= 0) return [singlePoint(this.points[0]), this];
          if (t3 >= 1) return [this, singlePoint(this.points[this.points.length - 1])];
          var p10 = lerpPoint(this.points[0], this.points[1], t3);
          var p11 = lerpPoint(this.points[1], this.points[2], t3);
          var p12 = lerpPoint(this.points[2], this.points[3], t3);
          var p20 = lerpPoint(p10, p11, t3);
          var p21 = lerpPoint(p11, p12, t3);
          var p3 = lerpPoint(p20, p21, t3);
          return [new PolynomialBezier(this.points[0], p10, p20, p3, true), new PolynomialBezier(p3, p21, p12, this.points[3], true)];
        };
        function extrema(bez2, comp2) {
          var min = bez2.points[0][comp2];
          var max = bez2.points[bez2.points.length - 1][comp2];
          if (min > max) {
            var e3 = max;
            max = min;
            min = e3;
          }
          var f3 = quadRoots(3 * bez2.a[comp2], 2 * bez2.b[comp2], bez2.c[comp2]);
          for (var i3 = 0; i3 < f3.length; i3 += 1) {
            if (f3[i3] > 0 && f3[i3] < 1) {
              var val2 = bez2.point(f3[i3])[comp2];
              if (val2 < min) min = val2;
              else if (val2 > max) max = val2;
            }
          }
          return {
            min,
            max
          };
        }
        PolynomialBezier.prototype.bounds = function() {
          return {
            x: extrema(this, 0),
            y: extrema(this, 1)
          };
        };
        PolynomialBezier.prototype.boundingBox = function() {
          var bounds = this.bounds();
          return {
            left: bounds.x.min,
            right: bounds.x.max,
            top: bounds.y.min,
            bottom: bounds.y.max,
            width: bounds.x.max - bounds.x.min,
            height: bounds.y.max - bounds.y.min,
            cx: (bounds.x.max + bounds.x.min) / 2,
            cy: (bounds.y.max + bounds.y.min) / 2
          };
        };
        function intersectData(bez2, t1, t22) {
          var box = bez2.boundingBox();
          return {
            cx: box.cx,
            cy: box.cy,
            width: box.width,
            height: box.height,
            bez: bez2,
            t: (t1 + t22) / 2,
            t1,
            t2: t22
          };
        }
        function splitData(data2) {
          var split = data2.bez.split(0.5);
          return [intersectData(split[0], data2.t1, data2.t), intersectData(split[1], data2.t, data2.t2)];
        }
        function boxIntersect(b1, b2) {
          return Math.abs(b1.cx - b2.cx) * 2 < b1.width + b2.width && Math.abs(b1.cy - b2.cy) * 2 < b1.height + b2.height;
        }
        function intersectsImpl(d1, d22, depth, tolerance, intersections2, maxRecursion) {
          if (!boxIntersect(d1, d22)) return;
          if (depth >= maxRecursion || d1.width <= tolerance && d1.height <= tolerance && d22.width <= tolerance && d22.height <= tolerance) {
            intersections2.push([d1.t, d22.t]);
            return;
          }
          var d1s = splitData(d1);
          var d2s = splitData(d22);
          intersectsImpl(d1s[0], d2s[0], depth + 1, tolerance, intersections2, maxRecursion);
          intersectsImpl(d1s[0], d2s[1], depth + 1, tolerance, intersections2, maxRecursion);
          intersectsImpl(d1s[1], d2s[0], depth + 1, tolerance, intersections2, maxRecursion);
          intersectsImpl(d1s[1], d2s[1], depth + 1, tolerance, intersections2, maxRecursion);
        }
        PolynomialBezier.prototype.intersections = function(other, tolerance, maxRecursion) {
          if (tolerance === void 0) tolerance = 2;
          if (maxRecursion === void 0) maxRecursion = 7;
          var intersections2 = [];
          intersectsImpl(intersectData(this, 0, 1), intersectData(other, 0, 1), 0, tolerance, intersections2, maxRecursion);
          return intersections2;
        };
        PolynomialBezier.shapeSegment = function(shapePath, index2) {
          var nextIndex = (index2 + 1) % shapePath.length();
          return new PolynomialBezier(shapePath.v[index2], shapePath.o[index2], shapePath.i[nextIndex], shapePath.v[nextIndex], true);
        };
        PolynomialBezier.shapeSegmentInverted = function(shapePath, index2) {
          var nextIndex = (index2 + 1) % shapePath.length();
          return new PolynomialBezier(shapePath.v[nextIndex], shapePath.i[nextIndex], shapePath.o[index2], shapePath.v[index2], true);
        };
        function crossProduct(a3, b2) {
          return [a3[1] * b2[2] - a3[2] * b2[1], a3[2] * b2[0] - a3[0] * b2[2], a3[0] * b2[1] - a3[1] * b2[0]];
        }
        function lineIntersection(start1, end1, start2, end2) {
          var v1 = [start1[0], start1[1], 1];
          var v22 = [end1[0], end1[1], 1];
          var v3 = [start2[0], start2[1], 1];
          var v4 = [end2[0], end2[1], 1];
          var r3 = crossProduct(crossProduct(v1, v22), crossProduct(v3, v4));
          if (floatZero(r3[2])) return null;
          return [r3[0] / r3[2], r3[1] / r3[2]];
        }
        function polarOffset(p3, angle, length2) {
          return [p3[0] + Math.cos(angle) * length2, p3[1] - Math.sin(angle) * length2];
        }
        function pointDistance(p1, p22) {
          return Math.hypot(p1[0] - p22[0], p1[1] - p22[1]);
        }
        function pointEqual(p1, p22) {
          return floatEqual(p1[0], p22[0]) && floatEqual(p1[1], p22[1]);
        }
        function ZigZagModifier() {
        }
        extendPrototype([ShapeModifier], ZigZagModifier);
        ZigZagModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.getValue = this.processKeys;
          this.amplitude = PropertyFactory.getProp(elem2, data2.s, 0, null, this);
          this.frequency = PropertyFactory.getProp(elem2, data2.r, 0, null, this);
          this.pointsType = PropertyFactory.getProp(elem2, data2.pt, 0, null, this);
          this._isAnimated = this.amplitude.effectsSequence.length !== 0 || this.frequency.effectsSequence.length !== 0 || this.pointsType.effectsSequence.length !== 0;
        };
        function setPoint(outputBezier, point, angle, direction, amplitude, outAmplitude, inAmplitude) {
          var angO = angle - Math.PI / 2;
          var angI = angle + Math.PI / 2;
          var px = point[0] + Math.cos(angle) * direction * amplitude;
          var py = point[1] - Math.sin(angle) * direction * amplitude;
          outputBezier.setTripleAt(px, py, px + Math.cos(angO) * outAmplitude, py - Math.sin(angO) * outAmplitude, px + Math.cos(angI) * inAmplitude, py - Math.sin(angI) * inAmplitude, outputBezier.length());
        }
        function getPerpendicularVector(pt1, pt2) {
          var vector = [pt2[0] - pt1[0], pt2[1] - pt1[1]];
          var rot = -Math.PI * 0.5;
          var rotatedVector = [Math.cos(rot) * vector[0] - Math.sin(rot) * vector[1], Math.sin(rot) * vector[0] + Math.cos(rot) * vector[1]];
          return rotatedVector;
        }
        function getProjectingAngle(path, cur) {
          var prevIndex = cur === 0 ? path.length() - 1 : cur - 1;
          var nextIndex = (cur + 1) % path.length();
          var prevPoint = path.v[prevIndex];
          var nextPoint = path.v[nextIndex];
          var pVector = getPerpendicularVector(prevPoint, nextPoint);
          return Math.atan2(0, 1) - Math.atan2(pVector[1], pVector[0]);
        }
        function zigZagCorner(outputBezier, path, cur, amplitude, frequency, pointType, direction) {
          var angle = getProjectingAngle(path, cur);
          var point = path.v[cur % path._length];
          var prevPoint = path.v[cur === 0 ? path._length - 1 : cur - 1];
          var nextPoint = path.v[(cur + 1) % path._length];
          var prevDist = pointType === 2 ? Math.sqrt(Math.pow(point[0] - prevPoint[0], 2) + Math.pow(point[1] - prevPoint[1], 2)) : 0;
          var nextDist = pointType === 2 ? Math.sqrt(Math.pow(point[0] - nextPoint[0], 2) + Math.pow(point[1] - nextPoint[1], 2)) : 0;
          setPoint(outputBezier, path.v[cur % path._length], angle, direction, amplitude, nextDist / ((frequency + 1) * 2), prevDist / ((frequency + 1) * 2), pointType);
        }
        function zigZagSegment(outputBezier, segment, amplitude, frequency, pointType, direction) {
          for (var i3 = 0; i3 < frequency; i3 += 1) {
            var t3 = (i3 + 1) / (frequency + 1);
            var dist = pointType === 2 ? Math.sqrt(Math.pow(segment.points[3][0] - segment.points[0][0], 2) + Math.pow(segment.points[3][1] - segment.points[0][1], 2)) : 0;
            var angle = segment.normalAngle(t3);
            var point = segment.point(t3);
            setPoint(outputBezier, point, angle, direction, amplitude, dist / ((frequency + 1) * 2), dist / ((frequency + 1) * 2), pointType);
            direction = -direction;
          }
          return direction;
        }
        ZigZagModifier.prototype.processPath = function(path, amplitude, frequency, pointType) {
          var count = path._length;
          var clonedPath = shapePool.newElement();
          clonedPath.c = path.c;
          if (!path.c) {
            count -= 1;
          }
          if (count === 0) return clonedPath;
          var direction = -1;
          var segment = PolynomialBezier.shapeSegment(path, 0);
          zigZagCorner(clonedPath, path, 0, amplitude, frequency, pointType, direction);
          for (var i3 = 0; i3 < count; i3 += 1) {
            direction = zigZagSegment(clonedPath, segment, amplitude, frequency, pointType, -direction);
            if (i3 === count - 1 && !path.c) {
              segment = null;
            } else {
              segment = PolynomialBezier.shapeSegment(path, (i3 + 1) % count);
            }
            zigZagCorner(clonedPath, path, i3 + 1, amplitude, frequency, pointType, direction);
          }
          return clonedPath;
        };
        ZigZagModifier.prototype.processShapes = function(_isFirstFrame) {
          var shapePaths;
          var i3;
          var len = this.shapes.length;
          var j3;
          var jLen;
          var amplitude = this.amplitude.v;
          var frequency = Math.max(0, Math.round(this.frequency.v));
          var pointType = this.pointsType.v;
          if (amplitude !== 0) {
            var shapeData;
            var localShapeCollection;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapeData = this.shapes[i3];
              localShapeCollection = shapeData.localShapeCollection;
              if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
                localShapeCollection.releaseShapes();
                shapeData.shape._mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  localShapeCollection.addShape(this.processPath(shapePaths[j3], amplitude, frequency, pointType));
                }
              }
              shapeData.shape.paths = shapeData.localShapeCollection;
            }
          }
          if (!this.dynamicProperties.length) {
            this._mdf = false;
          }
        };
        function linearOffset(p1, p22, amount) {
          var angle = Math.atan2(p22[0] - p1[0], p22[1] - p1[1]);
          return [polarOffset(p1, angle, amount), polarOffset(p22, angle, amount)];
        }
        function offsetSegment(segment, amount) {
          var p0;
          var p1a;
          var p1b;
          var p2b;
          var p2a;
          var p3;
          var e3;
          e3 = linearOffset(segment.points[0], segment.points[1], amount);
          p0 = e3[0];
          p1a = e3[1];
          e3 = linearOffset(segment.points[1], segment.points[2], amount);
          p1b = e3[0];
          p2b = e3[1];
          e3 = linearOffset(segment.points[2], segment.points[3], amount);
          p2a = e3[0];
          p3 = e3[1];
          var p1 = lineIntersection(p0, p1a, p1b, p2b);
          if (p1 === null) p1 = p1a;
          var p22 = lineIntersection(p2a, p3, p1b, p2b);
          if (p22 === null) p22 = p2a;
          return new PolynomialBezier(p0, p1, p22, p3);
        }
        function joinLines(outputBezier, seg1, seg2, lineJoin, miterLimit) {
          var p0 = seg1.points[3];
          var p1 = seg2.points[0];
          if (lineJoin === 3) return p0;
          if (pointEqual(p0, p1)) return p0;
          if (lineJoin === 2) {
            var angleOut = -seg1.tangentAngle(1);
            var angleIn = -seg2.tangentAngle(0) + Math.PI;
            var center = lineIntersection(p0, polarOffset(p0, angleOut + Math.PI / 2, 100), p1, polarOffset(p1, angleOut + Math.PI / 2, 100));
            var radius = center ? pointDistance(center, p0) : pointDistance(p0, p1) / 2;
            var tan = polarOffset(p0, angleOut, 2 * radius * roundCorner);
            outputBezier.setXYAt(tan[0], tan[1], "o", outputBezier.length() - 1);
            tan = polarOffset(p1, angleIn, 2 * radius * roundCorner);
            outputBezier.setTripleAt(p1[0], p1[1], p1[0], p1[1], tan[0], tan[1], outputBezier.length());
            return p1;
          }
          var t0 = pointEqual(p0, seg1.points[2]) ? seg1.points[0] : seg1.points[2];
          var t1 = pointEqual(p1, seg2.points[1]) ? seg2.points[3] : seg2.points[1];
          var intersection = lineIntersection(t0, p0, p1, t1);
          if (intersection && pointDistance(intersection, p0) < miterLimit) {
            outputBezier.setTripleAt(intersection[0], intersection[1], intersection[0], intersection[1], intersection[0], intersection[1], outputBezier.length());
            return intersection;
          }
          return p0;
        }
        function getIntersection(a3, b2) {
          var intersect = a3.intersections(b2);
          if (intersect.length && floatEqual(intersect[0][0], 1)) intersect.shift();
          if (intersect.length) return intersect[0];
          return null;
        }
        function pruneSegmentIntersection(a3, b2) {
          var outa = a3.slice();
          var outb = b2.slice();
          var intersect = getIntersection(a3[a3.length - 1], b2[0]);
          if (intersect) {
            outa[a3.length - 1] = a3[a3.length - 1].split(intersect[0])[0];
            outb[0] = b2[0].split(intersect[1])[1];
          }
          if (a3.length > 1 && b2.length > 1) {
            intersect = getIntersection(a3[0], b2[b2.length - 1]);
            if (intersect) {
              return [[a3[0].split(intersect[0])[0]], [b2[b2.length - 1].split(intersect[1])[1]]];
            }
          }
          return [outa, outb];
        }
        function pruneIntersections(segments) {
          var e3;
          for (var i3 = 1; i3 < segments.length; i3 += 1) {
            e3 = pruneSegmentIntersection(segments[i3 - 1], segments[i3]);
            segments[i3 - 1] = e3[0];
            segments[i3] = e3[1];
          }
          if (segments.length > 1) {
            e3 = pruneSegmentIntersection(segments[segments.length - 1], segments[0]);
            segments[segments.length - 1] = e3[0];
            segments[0] = e3[1];
          }
          return segments;
        }
        function offsetSegmentSplit(segment, amount) {
          var flex = segment.inflectionPoints();
          var left;
          var right;
          var split;
          var mid;
          if (flex.length === 0) {
            return [offsetSegment(segment, amount)];
          }
          if (flex.length === 1 || floatEqual(flex[1], 1)) {
            split = segment.split(flex[0]);
            left = split[0];
            right = split[1];
            return [offsetSegment(left, amount), offsetSegment(right, amount)];
          }
          split = segment.split(flex[0]);
          left = split[0];
          var t3 = (flex[1] - flex[0]) / (1 - flex[0]);
          split = split[1].split(t3);
          mid = split[0];
          right = split[1];
          return [offsetSegment(left, amount), offsetSegment(mid, amount), offsetSegment(right, amount)];
        }
        function OffsetPathModifier() {
        }
        extendPrototype([ShapeModifier], OffsetPathModifier);
        OffsetPathModifier.prototype.initModifierProperties = function(elem2, data2) {
          this.getValue = this.processKeys;
          this.amount = PropertyFactory.getProp(elem2, data2.a, 0, null, this);
          this.miterLimit = PropertyFactory.getProp(elem2, data2.ml, 0, null, this);
          this.lineJoin = data2.lj;
          this._isAnimated = this.amount.effectsSequence.length !== 0;
        };
        OffsetPathModifier.prototype.processPath = function(inputBezier, amount, lineJoin, miterLimit) {
          var outputBezier = shapePool.newElement();
          outputBezier.c = inputBezier.c;
          var count = inputBezier.length();
          if (!inputBezier.c) {
            count -= 1;
          }
          var i3;
          var j3;
          var segment;
          var multiSegments = [];
          for (i3 = 0; i3 < count; i3 += 1) {
            segment = PolynomialBezier.shapeSegment(inputBezier, i3);
            multiSegments.push(offsetSegmentSplit(segment, amount));
          }
          if (!inputBezier.c) {
            for (i3 = count - 1; i3 >= 0; i3 -= 1) {
              segment = PolynomialBezier.shapeSegmentInverted(inputBezier, i3);
              multiSegments.push(offsetSegmentSplit(segment, amount));
            }
          }
          multiSegments = pruneIntersections(multiSegments);
          var lastPoint = null;
          var lastSeg = null;
          for (i3 = 0; i3 < multiSegments.length; i3 += 1) {
            var multiSegment = multiSegments[i3];
            if (lastSeg) lastPoint = joinLines(outputBezier, lastSeg, multiSegment[0], lineJoin, miterLimit);
            lastSeg = multiSegment[multiSegment.length - 1];
            for (j3 = 0; j3 < multiSegment.length; j3 += 1) {
              segment = multiSegment[j3];
              if (lastPoint && pointEqual(segment.points[0], lastPoint)) {
                outputBezier.setXYAt(segment.points[1][0], segment.points[1][1], "o", outputBezier.length() - 1);
              } else {
                outputBezier.setTripleAt(segment.points[0][0], segment.points[0][1], segment.points[1][0], segment.points[1][1], segment.points[0][0], segment.points[0][1], outputBezier.length());
              }
              outputBezier.setTripleAt(segment.points[3][0], segment.points[3][1], segment.points[3][0], segment.points[3][1], segment.points[2][0], segment.points[2][1], outputBezier.length());
              lastPoint = segment.points[3];
            }
          }
          if (multiSegments.length) joinLines(outputBezier, lastSeg, multiSegments[0][0], lineJoin, miterLimit);
          return outputBezier;
        };
        OffsetPathModifier.prototype.processShapes = function(_isFirstFrame) {
          var shapePaths;
          var i3;
          var len = this.shapes.length;
          var j3;
          var jLen;
          var amount = this.amount.v;
          var miterLimit = this.miterLimit.v;
          var lineJoin = this.lineJoin;
          if (amount !== 0) {
            var shapeData;
            var localShapeCollection;
            for (i3 = 0; i3 < len; i3 += 1) {
              shapeData = this.shapes[i3];
              localShapeCollection = shapeData.localShapeCollection;
              if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
                localShapeCollection.releaseShapes();
                shapeData.shape._mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  localShapeCollection.addShape(this.processPath(shapePaths[j3], amount, lineJoin, miterLimit));
                }
              }
              shapeData.shape.paths = shapeData.localShapeCollection;
            }
          }
          if (!this.dynamicProperties.length) {
            this._mdf = false;
          }
        };
        function getFontProperties(fontData) {
          var styles = fontData.fStyle ? fontData.fStyle.split(" ") : [];
          var fWeight = "normal";
          var fStyle = "normal";
          var len = styles.length;
          var styleName;
          for (var i3 = 0; i3 < len; i3 += 1) {
            styleName = styles[i3].toLowerCase();
            switch (styleName) {
              case "italic":
                fStyle = "italic";
                break;
              case "bold":
                fWeight = "700";
                break;
              case "black":
                fWeight = "900";
                break;
              case "medium":
                fWeight = "500";
                break;
              case "regular":
              case "normal":
                fWeight = "400";
                break;
              case "light":
              case "thin":
                fWeight = "200";
                break;
              default:
                break;
            }
          }
          return {
            style: fStyle,
            weight: fontData.fWeight || fWeight
          };
        }
        var FontManager = (function() {
          var maxWaitingTime = 5e3;
          var emptyChar = {
            w: 0,
            size: 0,
            shapes: [],
            data: {
              shapes: []
            }
          };
          var combinedCharacters = [];
          combinedCharacters = combinedCharacters.concat([2304, 2305, 2306, 2307, 2362, 2363, 2364, 2364, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373, 2374, 2375, 2376, 2377, 2378, 2379, 2380, 2381, 2382, 2383, 2387, 2388, 2389, 2390, 2391, 2402, 2403]);
          var BLACK_FLAG_CODE_POINT = 127988;
          var CANCEL_TAG_CODE_POINT = 917631;
          var A_TAG_CODE_POINT = 917601;
          var Z_TAG_CODE_POINT = 917626;
          var VARIATION_SELECTOR_16_CODE_POINT = 65039;
          var ZERO_WIDTH_JOINER_CODE_POINT = 8205;
          var REGIONAL_CHARACTER_A_CODE_POINT = 127462;
          var REGIONAL_CHARACTER_Z_CODE_POINT = 127487;
          var surrogateModifiers = ["d83cdffb", "d83cdffc", "d83cdffd", "d83cdffe", "d83cdfff"];
          function trimFontOptions(font) {
            var familyArray = font.split(",");
            var i3;
            var len = familyArray.length;
            var enabledFamilies = [];
            for (i3 = 0; i3 < len; i3 += 1) {
              if (familyArray[i3] !== "sans-serif" && familyArray[i3] !== "monospace") {
                enabledFamilies.push(familyArray[i3]);
              }
            }
            return enabledFamilies.join(",");
          }
          function setUpNode(font, family) {
            var parentNode = createTag("span");
            parentNode.setAttribute("aria-hidden", true);
            parentNode.style.fontFamily = family;
            var node = createTag("span");
            node.innerText = "giItT1WQy@!-/#";
            parentNode.style.position = "absolute";
            parentNode.style.left = "-10000px";
            parentNode.style.top = "-10000px";
            parentNode.style.fontSize = "300px";
            parentNode.style.fontVariant = "normal";
            parentNode.style.fontStyle = "normal";
            parentNode.style.fontWeight = "normal";
            parentNode.style.letterSpacing = "0";
            parentNode.appendChild(node);
            document.body.appendChild(parentNode);
            var width2 = node.offsetWidth;
            node.style.fontFamily = trimFontOptions(font) + ", " + family;
            return {
              node,
              w: width2,
              parent: parentNode
            };
          }
          function checkLoadedFonts() {
            var i3;
            var len = this.fonts.length;
            var node;
            var w3;
            var loadedCount = len;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (this.fonts[i3].loaded) {
                loadedCount -= 1;
              } else if (this.fonts[i3].fOrigin === "n" || this.fonts[i3].origin === 0) {
                this.fonts[i3].loaded = true;
              } else {
                node = this.fonts[i3].monoCase.node;
                w3 = this.fonts[i3].monoCase.w;
                if (node.offsetWidth !== w3) {
                  loadedCount -= 1;
                  this.fonts[i3].loaded = true;
                } else {
                  node = this.fonts[i3].sansCase.node;
                  w3 = this.fonts[i3].sansCase.w;
                  if (node.offsetWidth !== w3) {
                    loadedCount -= 1;
                    this.fonts[i3].loaded = true;
                  }
                }
                if (this.fonts[i3].loaded) {
                  this.fonts[i3].sansCase.parent.parentNode.removeChild(this.fonts[i3].sansCase.parent);
                  this.fonts[i3].monoCase.parent.parentNode.removeChild(this.fonts[i3].monoCase.parent);
                }
              }
            }
            if (loadedCount !== 0 && Date.now() - this.initTime < maxWaitingTime) {
              setTimeout(this.checkLoadedFontsBinded, 20);
            } else {
              setTimeout(this.setIsLoadedBinded, 10);
            }
          }
          function createHelper(fontData, def) {
            var engine = document.body && def ? "svg" : "canvas";
            var helper;
            var fontProps = getFontProperties(fontData);
            if (engine === "svg") {
              var tHelper = createNS("text");
              tHelper.style.fontSize = "100px";
              tHelper.setAttribute("font-family", fontData.fFamily);
              tHelper.setAttribute("font-style", fontProps.style);
              tHelper.setAttribute("font-weight", fontProps.weight);
              tHelper.textContent = "1";
              if (fontData.fClass) {
                tHelper.style.fontFamily = "inherit";
                tHelper.setAttribute("class", fontData.fClass);
              } else {
                tHelper.style.fontFamily = fontData.fFamily;
              }
              def.appendChild(tHelper);
              helper = tHelper;
            } else {
              var tCanvasHelper = new OffscreenCanvas(500, 500).getContext("2d");
              tCanvasHelper.font = fontProps.style + " " + fontProps.weight + " 100px " + fontData.fFamily;
              helper = tCanvasHelper;
            }
            function measure(text2) {
              if (engine === "svg") {
                helper.textContent = text2;
                return helper.getComputedTextLength();
              }
              return helper.measureText(text2).width;
            }
            return {
              measureText: measure
            };
          }
          function addFonts(fontData, defs) {
            if (!fontData) {
              this.isLoaded = true;
              return;
            }
            if (this.chars) {
              this.isLoaded = true;
              this.fonts = fontData.list;
              return;
            }
            if (!document.body) {
              this.isLoaded = true;
              fontData.list.forEach(function(data2) {
                data2.helper = createHelper(data2);
                data2.cache = {};
              });
              this.fonts = fontData.list;
              return;
            }
            var fontArr = fontData.list;
            var i3;
            var len = fontArr.length;
            var _pendingFonts = len;
            for (i3 = 0; i3 < len; i3 += 1) {
              var shouldLoadFont = true;
              var loadedSelector;
              var j3;
              fontArr[i3].loaded = false;
              fontArr[i3].monoCase = setUpNode(fontArr[i3].fFamily, "monospace");
              fontArr[i3].sansCase = setUpNode(fontArr[i3].fFamily, "sans-serif");
              if (!fontArr[i3].fPath) {
                fontArr[i3].loaded = true;
                _pendingFonts -= 1;
              } else if (fontArr[i3].fOrigin === "p" || fontArr[i3].origin === 3) {
                loadedSelector = document.querySelectorAll('style[f-forigin="p"][f-family="' + fontArr[i3].fFamily + '"], style[f-origin="3"][f-family="' + fontArr[i3].fFamily + '"]');
                if (loadedSelector.length > 0) {
                  shouldLoadFont = false;
                }
                if (shouldLoadFont) {
                  var s3 = createTag("style");
                  s3.setAttribute("f-forigin", fontArr[i3].fOrigin);
                  s3.setAttribute("f-origin", fontArr[i3].origin);
                  s3.setAttribute("f-family", fontArr[i3].fFamily);
                  s3.type = "text/css";
                  s3.innerText = "@font-face {font-family: " + fontArr[i3].fFamily + "; font-style: normal; src: url('" + fontArr[i3].fPath + "');}";
                  defs.appendChild(s3);
                }
              } else if (fontArr[i3].fOrigin === "g" || fontArr[i3].origin === 1) {
                loadedSelector = document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]');
                for (j3 = 0; j3 < loadedSelector.length; j3 += 1) {
                  if (loadedSelector[j3].href.indexOf(fontArr[i3].fPath) !== -1) {
                    shouldLoadFont = false;
                  }
                }
                if (shouldLoadFont) {
                  var l3 = createTag("link");
                  l3.setAttribute("f-forigin", fontArr[i3].fOrigin);
                  l3.setAttribute("f-origin", fontArr[i3].origin);
                  l3.type = "text/css";
                  l3.rel = "stylesheet";
                  l3.href = fontArr[i3].fPath;
                  document.body.appendChild(l3);
                }
              } else if (fontArr[i3].fOrigin === "t" || fontArr[i3].origin === 2) {
                loadedSelector = document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]');
                for (j3 = 0; j3 < loadedSelector.length; j3 += 1) {
                  if (fontArr[i3].fPath === loadedSelector[j3].src) {
                    shouldLoadFont = false;
                  }
                }
                if (shouldLoadFont) {
                  var sc = createTag("link");
                  sc.setAttribute("f-forigin", fontArr[i3].fOrigin);
                  sc.setAttribute("f-origin", fontArr[i3].origin);
                  sc.setAttribute("rel", "stylesheet");
                  sc.setAttribute("href", fontArr[i3].fPath);
                  defs.appendChild(sc);
                }
              }
              fontArr[i3].helper = createHelper(fontArr[i3], defs);
              fontArr[i3].cache = {};
              this.fonts.push(fontArr[i3]);
            }
            if (_pendingFonts === 0) {
              this.isLoaded = true;
            } else {
              setTimeout(this.checkLoadedFonts.bind(this), 100);
            }
          }
          function addChars(chars) {
            if (!chars) {
              return;
            }
            if (!this.chars) {
              this.chars = [];
            }
            var i3;
            var len = chars.length;
            var j3;
            var jLen = this.chars.length;
            var found;
            for (i3 = 0; i3 < len; i3 += 1) {
              j3 = 0;
              found = false;
              while (j3 < jLen) {
                if (this.chars[j3].style === chars[i3].style && this.chars[j3].fFamily === chars[i3].fFamily && this.chars[j3].ch === chars[i3].ch) {
                  found = true;
                }
                j3 += 1;
              }
              if (!found) {
                this.chars.push(chars[i3]);
                jLen += 1;
              }
            }
          }
          function getCharData(_char, style, font) {
            var i3 = 0;
            var len = this.chars.length;
            while (i3 < len) {
              if (this.chars[i3].ch === _char && this.chars[i3].style === style && this.chars[i3].fFamily === font) {
                return this.chars[i3];
              }
              i3 += 1;
            }
            if ((typeof _char === "string" && _char.charCodeAt(0) !== 13 || !_char) && console && console.warn && !this._warned) {
              this._warned = true;
              console.warn("Missing character from exported characters list: ", _char, style, font);
            }
            return emptyChar;
          }
          function measureText(_char2, fontName, size) {
            var fontData = this.getFontByName(fontName);
            var index2 = _char2;
            if (!fontData.cache[index2]) {
              var tHelper = fontData.helper;
              if (_char2 === " ") {
                var doubleSize = tHelper.measureText("|" + _char2 + "|");
                var singleSize = tHelper.measureText("||");
                fontData.cache[index2] = (doubleSize - singleSize) / 100;
              } else {
                fontData.cache[index2] = tHelper.measureText(_char2) / 100;
              }
            }
            return fontData.cache[index2] * size;
          }
          function getFontByName(name2) {
            var i3 = 0;
            var len = this.fonts.length;
            while (i3 < len) {
              if (this.fonts[i3].fName === name2) {
                return this.fonts[i3];
              }
              i3 += 1;
            }
            return this.fonts[0];
          }
          function getCodePoint(string) {
            var codePoint = 0;
            var first = string.charCodeAt(0);
            if (first >= 55296 && first <= 56319) {
              var second = string.charCodeAt(1);
              if (second >= 56320 && second <= 57343) {
                codePoint = (first - 55296) * 1024 + second - 56320 + 65536;
              }
            }
            return codePoint;
          }
          function isModifier(firstCharCode, secondCharCode) {
            var sum2 = firstCharCode.toString(16) + secondCharCode.toString(16);
            return surrogateModifiers.indexOf(sum2) !== -1;
          }
          function isZeroWidthJoiner(charCode) {
            return charCode === ZERO_WIDTH_JOINER_CODE_POINT;
          }
          function isVariationSelector(charCode) {
            return charCode === VARIATION_SELECTOR_16_CODE_POINT;
          }
          function isRegionalCode(string) {
            var codePoint = getCodePoint(string);
            if (codePoint >= REGIONAL_CHARACTER_A_CODE_POINT && codePoint <= REGIONAL_CHARACTER_Z_CODE_POINT) {
              return true;
            }
            return false;
          }
          function isFlagEmoji(string) {
            return isRegionalCode(string.substr(0, 2)) && isRegionalCode(string.substr(2, 2));
          }
          function isCombinedCharacter(_char3) {
            return combinedCharacters.indexOf(_char3) !== -1;
          }
          function isRegionalFlag(text2, index2) {
            var codePoint = getCodePoint(text2.substr(index2, 2));
            if (codePoint !== BLACK_FLAG_CODE_POINT) {
              return false;
            }
            var count = 0;
            index2 += 2;
            while (count < 5) {
              codePoint = getCodePoint(text2.substr(index2, 2));
              if (codePoint < A_TAG_CODE_POINT || codePoint > Z_TAG_CODE_POINT) {
                return false;
              }
              count += 1;
              index2 += 2;
            }
            return getCodePoint(text2.substr(index2, 2)) === CANCEL_TAG_CODE_POINT;
          }
          function setIsLoaded() {
            this.isLoaded = true;
          }
          var Font = function Font2() {
            this.fonts = [];
            this.chars = null;
            this.typekitLoaded = 0;
            this.isLoaded = false;
            this._warned = false;
            this.initTime = Date.now();
            this.setIsLoadedBinded = this.setIsLoaded.bind(this);
            this.checkLoadedFontsBinded = this.checkLoadedFonts.bind(this);
          };
          Font.isModifier = isModifier;
          Font.isZeroWidthJoiner = isZeroWidthJoiner;
          Font.isFlagEmoji = isFlagEmoji;
          Font.isRegionalCode = isRegionalCode;
          Font.isCombinedCharacter = isCombinedCharacter;
          Font.isRegionalFlag = isRegionalFlag;
          Font.isVariationSelector = isVariationSelector;
          Font.BLACK_FLAG_CODE_POINT = BLACK_FLAG_CODE_POINT;
          var fontPrototype = {
            addChars,
            addFonts,
            getCharData,
            getFontByName,
            measureText,
            checkLoadedFonts,
            setIsLoaded
          };
          Font.prototype = fontPrototype;
          return Font;
        })();
        function SlotManager(animationData2) {
          this.animationData = animationData2;
        }
        SlotManager.prototype.getProp = function(data2) {
          if (this.animationData.slots && this.animationData.slots[data2.sid]) {
            return Object.assign(data2, this.animationData.slots[data2.sid].p);
          }
          return data2;
        };
        function slotFactory(animationData2) {
          return new SlotManager(animationData2);
        }
        function RenderableElement() {
        }
        RenderableElement.prototype = {
          initRenderable: function initRenderable() {
            this.isInRange = false;
            this.hidden = false;
            this.isTransparent = false;
            this.renderableComponents = [];
          },
          addRenderableComponent: function addRenderableComponent(component) {
            if (this.renderableComponents.indexOf(component) === -1) {
              this.renderableComponents.push(component);
            }
          },
          removeRenderableComponent: function removeRenderableComponent(component) {
            if (this.renderableComponents.indexOf(component) !== -1) {
              this.renderableComponents.splice(this.renderableComponents.indexOf(component), 1);
            }
          },
          prepareRenderableFrame: function prepareRenderableFrame(num) {
            this.checkLayerLimits(num);
          },
          checkTransparency: function checkTransparency() {
            if (this.finalTransform.mProp.o.v <= 0) {
              if (!this.isTransparent && this.globalData.renderConfig.hideOnTransparent) {
                this.isTransparent = true;
                this.hide();
              }
            } else if (this.isTransparent) {
              this.isTransparent = false;
              this.show();
            }
          },
          /**
             * @function
             * Initializes frame related properties.
             *
             * @param {number} num
             * current frame number in Layer's time
             *
             */
          checkLayerLimits: function checkLayerLimits(num) {
            if (this.data.ip - this.data.st <= num && this.data.op - this.data.st > num) {
              if (this.isInRange !== true) {
                this.globalData._mdf = true;
                this._mdf = true;
                this.isInRange = true;
                this.show();
              }
            } else if (this.isInRange !== false) {
              this.globalData._mdf = true;
              this.isInRange = false;
              this.hide();
            }
          },
          renderRenderable: function renderRenderable() {
            var i3;
            var len = this.renderableComponents.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.renderableComponents[i3].renderFrame(this._isFirstFrame);
            }
          },
          sourceRectAtTime: function sourceRectAtTime2() {
            return {
              top: 0,
              left: 0,
              width: 100,
              height: 100
            };
          },
          getLayerSize: function getLayerSize() {
            if (this.data.ty === 5) {
              return {
                w: this.data.textData.width,
                h: this.data.textData.height
              };
            }
            return {
              w: this.data.width,
              h: this.data.height
            };
          }
        };
        var getBlendMode = /* @__PURE__ */ (function() {
          var blendModeEnums = {
            0: "source-over",
            1: "multiply",
            2: "screen",
            3: "overlay",
            4: "darken",
            5: "lighten",
            6: "color-dodge",
            7: "color-burn",
            8: "hard-light",
            9: "soft-light",
            10: "difference",
            11: "exclusion",
            12: "hue",
            13: "saturation",
            14: "color",
            15: "luminosity"
          };
          return function(mode) {
            return blendModeEnums[mode] || "";
          };
        })();
        function SliderEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 0, 0, container);
        }
        function AngleEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 0, 0, container);
        }
        function ColorEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 1, 0, container);
        }
        function PointEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 1, 0, container);
        }
        function LayerIndexEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 0, 0, container);
        }
        function MaskIndexEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 0, 0, container);
        }
        function CheckboxEffect(data2, elem2, container) {
          this.p = PropertyFactory.getProp(elem2, data2.v, 0, 0, container);
        }
        function NoValueEffect() {
          this.p = {};
        }
        function EffectsManager(data2, element) {
          var effects = data2.ef || [];
          this.effectElements = [];
          var i3;
          var len = effects.length;
          var effectItem;
          for (i3 = 0; i3 < len; i3 += 1) {
            effectItem = new GroupEffect(effects[i3], element);
            this.effectElements.push(effectItem);
          }
        }
        function GroupEffect(data2, element) {
          this.init(data2, element);
        }
        extendPrototype([DynamicPropertyContainer], GroupEffect);
        GroupEffect.prototype.getValue = GroupEffect.prototype.iterateDynamicProperties;
        GroupEffect.prototype.init = function(data2, element) {
          this.data = data2;
          this.effectElements = [];
          this.initDynamicPropertyContainer(element);
          var i3;
          var len = this.data.ef.length;
          var eff;
          var effects = this.data.ef;
          for (i3 = 0; i3 < len; i3 += 1) {
            eff = null;
            switch (effects[i3].ty) {
              case 0:
                eff = new SliderEffect(effects[i3], element, this);
                break;
              case 1:
                eff = new AngleEffect(effects[i3], element, this);
                break;
              case 2:
                eff = new ColorEffect(effects[i3], element, this);
                break;
              case 3:
                eff = new PointEffect(effects[i3], element, this);
                break;
              case 4:
              case 7:
                eff = new CheckboxEffect(effects[i3], element, this);
                break;
              case 10:
                eff = new LayerIndexEffect(effects[i3], element, this);
                break;
              case 11:
                eff = new MaskIndexEffect(effects[i3], element, this);
                break;
              case 5:
                eff = new EffectsManager(effects[i3], element, this);
                break;
              // case 6:
              default:
                eff = new NoValueEffect(effects[i3], element, this);
                break;
            }
            if (eff) {
              this.effectElements.push(eff);
            }
          }
        };
        function BaseElement() {
        }
        BaseElement.prototype = {
          checkMasks: function checkMasks() {
            if (!this.data.hasMask) {
              return false;
            }
            var i3 = 0;
            var len = this.data.masksProperties.length;
            while (i3 < len) {
              if (this.data.masksProperties[i3].mode !== "n" && this.data.masksProperties[i3].cl !== false) {
                return true;
              }
              i3 += 1;
            }
            return false;
          },
          initExpressions: function initExpressions() {
            var expressionsInterfaces2 = getExpressionInterfaces();
            if (!expressionsInterfaces2) {
              return;
            }
            var LayerExpressionInterface2 = expressionsInterfaces2("layer");
            var EffectsExpressionInterface2 = expressionsInterfaces2("effects");
            var ShapeExpressionInterface2 = expressionsInterfaces2("shape");
            var TextExpressionInterface2 = expressionsInterfaces2("text");
            var CompExpressionInterface2 = expressionsInterfaces2("comp");
            this.layerInterface = LayerExpressionInterface2(this);
            if (this.data.hasMask && this.maskManager) {
              this.layerInterface.registerMaskInterface(this.maskManager);
            }
            var effectsInterface = EffectsExpressionInterface2.createEffectsInterface(this, this.layerInterface);
            this.layerInterface.registerEffectsInterface(effectsInterface);
            if (this.data.ty === 0 || this.data.xt) {
              this.compInterface = CompExpressionInterface2(this);
            } else if (this.data.ty === 4) {
              this.layerInterface.shapeInterface = ShapeExpressionInterface2(this.shapesData, this.itemsData, this.layerInterface);
              this.layerInterface.content = this.layerInterface.shapeInterface;
            } else if (this.data.ty === 5) {
              this.layerInterface.textInterface = TextExpressionInterface2(this);
              this.layerInterface.text = this.layerInterface.textInterface;
            }
          },
          setBlendMode: function setBlendMode() {
            var blendModeValue = getBlendMode(this.data.bm);
            var elem2 = this.baseElement || this.layerElement;
            elem2.style["mix-blend-mode"] = blendModeValue;
          },
          initBaseData: function initBaseData(data2, globalData2, comp2) {
            this.globalData = globalData2;
            this.comp = comp2;
            this.data = data2;
            this.layerId = createElementID();
            if (!this.data.sr) {
              this.data.sr = 1;
            }
            this.effectsManager = new EffectsManager(this.data, this, this.dynamicProperties);
          },
          getType: function getType() {
            return this.type;
          },
          sourceRectAtTime: function sourceRectAtTime2() {
          }
        };
        function FrameElement() {
        }
        FrameElement.prototype = {
          /**
             * @function
             * Initializes frame related properties.
             *
             */
          initFrame: function initFrame2() {
            this._isFirstFrame = false;
            this.dynamicProperties = [];
            this._mdf = false;
          },
          /**
             * @function
             * Calculates all dynamic values
             *
             * @param {number} num
             * current frame number in Layer's time
             * @param {boolean} isVisible
             * if layers is currently in range
             *
             */
          prepareProperties: function prepareProperties(num, isVisible) {
            var i3;
            var len = this.dynamicProperties.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (isVisible || this._isParent && this.dynamicProperties[i3].propType === "transform") {
                this.dynamicProperties[i3].getValue();
                if (this.dynamicProperties[i3]._mdf) {
                  this.globalData._mdf = true;
                  this._mdf = true;
                }
              }
            }
          },
          addDynamicProperty: function addDynamicProperty(prop) {
            if (this.dynamicProperties.indexOf(prop) === -1) {
              this.dynamicProperties.push(prop);
            }
          }
        };
        function FootageElement(data2, globalData2, comp2) {
          this.initFrame();
          this.initRenderable();
          this.assetData = globalData2.getAssetData(data2.refId);
          this.footageData = globalData2.imageLoader.getAsset(this.assetData);
          this.initBaseData(data2, globalData2, comp2);
        }
        FootageElement.prototype.prepareFrame = function() {
        };
        extendPrototype([RenderableElement, BaseElement, FrameElement], FootageElement);
        FootageElement.prototype.getBaseElement = function() {
          return null;
        };
        FootageElement.prototype.renderFrame = function() {
        };
        FootageElement.prototype.destroy = function() {
        };
        FootageElement.prototype.initExpressions = function() {
          var expressionsInterfaces2 = getExpressionInterfaces();
          if (!expressionsInterfaces2) {
            return;
          }
          var FootageInterface2 = expressionsInterfaces2("footage");
          this.layerInterface = FootageInterface2(this);
        };
        FootageElement.prototype.getFootageData = function() {
          return this.footageData;
        };
        function AudioElement(data2, globalData2, comp2) {
          this.initFrame();
          this.initRenderable();
          this.assetData = globalData2.getAssetData(data2.refId);
          this.initBaseData(data2, globalData2, comp2);
          this._isPlaying = false;
          this._canPlay = false;
          var assetPath = this.globalData.getAssetsPath(this.assetData);
          this.audio = this.globalData.audioController.createAudio(assetPath);
          this._currentTime = 0;
          this.globalData.audioController.addAudio(this);
          this._volumeMultiplier = 1;
          this._volume = 1;
          this._previousVolume = null;
          this.tm = data2.tm ? PropertyFactory.getProp(this, data2.tm, 0, globalData2.frameRate, this) : {
            _placeholder: true
          };
          this.lv = PropertyFactory.getProp(this, data2.au && data2.au.lv ? data2.au.lv : {
            k: [100]
          }, 1, 0.01, this);
        }
        AudioElement.prototype.prepareFrame = function(num) {
          this.prepareRenderableFrame(num, true);
          this.prepareProperties(num, true);
          if (!this.tm._placeholder) {
            var timeRemapped = this.tm.v;
            this._currentTime = timeRemapped;
          } else {
            this._currentTime = num / this.data.sr;
          }
          this._volume = this.lv.v[0];
          var totalVolume = this._volume * this._volumeMultiplier;
          if (this._previousVolume !== totalVolume) {
            this._previousVolume = totalVolume;
            this.audio.volume(totalVolume);
          }
        };
        extendPrototype([RenderableElement, BaseElement, FrameElement], AudioElement);
        AudioElement.prototype.renderFrame = function() {
          if (this.isInRange && this._canPlay) {
            if (!this._isPlaying) {
              this.audio.play();
              this.audio.seek(this._currentTime / this.globalData.frameRate);
              this._isPlaying = true;
            } else if (!this.audio.playing() || Math.abs(this._currentTime / this.globalData.frameRate - this.audio.seek()) > 0.1) {
              this.audio.seek(this._currentTime / this.globalData.frameRate);
            }
          }
        };
        AudioElement.prototype.show = function() {
        };
        AudioElement.prototype.hide = function() {
          this.audio.pause();
          this._isPlaying = false;
        };
        AudioElement.prototype.pause = function() {
          this.audio.pause();
          this._isPlaying = false;
          this._canPlay = false;
        };
        AudioElement.prototype.resume = function() {
          this._canPlay = true;
        };
        AudioElement.prototype.setRate = function(rateValue) {
          this.audio.rate(rateValue);
        };
        AudioElement.prototype.volume = function(volumeValue) {
          this._volumeMultiplier = volumeValue;
          this._previousVolume = volumeValue * this._volume;
          this.audio.volume(this._previousVolume);
        };
        AudioElement.prototype.getBaseElement = function() {
          return null;
        };
        AudioElement.prototype.destroy = function() {
        };
        AudioElement.prototype.sourceRectAtTime = function() {
        };
        AudioElement.prototype.initExpressions = function() {
        };
        function BaseRenderer() {
        }
        BaseRenderer.prototype.checkLayers = function(num) {
          var i3;
          var len = this.layers.length;
          var data2;
          this.completeLayers = true;
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (!this.elements[i3]) {
              data2 = this.layers[i3];
              if (data2.ip - data2.st <= num - this.layers[i3].st && data2.op - data2.st > num - this.layers[i3].st) {
                this.buildItem(i3);
              }
            }
            this.completeLayers = this.elements[i3] ? this.completeLayers : false;
          }
          this.checkPendingElements();
        };
        BaseRenderer.prototype.createItem = function(layer) {
          switch (layer.ty) {
            case 2:
              return this.createImage(layer);
            case 0:
              return this.createComp(layer);
            case 1:
              return this.createSolid(layer);
            case 3:
              return this.createNull(layer);
            case 4:
              return this.createShape(layer);
            case 5:
              return this.createText(layer);
            case 6:
              return this.createAudio(layer);
            case 13:
              return this.createCamera(layer);
            case 15:
              return this.createFootage(layer);
            default:
              return this.createNull(layer);
          }
        };
        BaseRenderer.prototype.createCamera = function() {
          throw new Error("You're using a 3d camera. Try the html renderer.");
        };
        BaseRenderer.prototype.createAudio = function(data2) {
          return new AudioElement(data2, this.globalData, this);
        };
        BaseRenderer.prototype.createFootage = function(data2) {
          return new FootageElement(data2, this.globalData, this);
        };
        BaseRenderer.prototype.buildAllItems = function() {
          var i3;
          var len = this.layers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.buildItem(i3);
          }
          this.checkPendingElements();
        };
        BaseRenderer.prototype.includeLayers = function(newLayers) {
          this.completeLayers = false;
          var i3;
          var len = newLayers.length;
          var j3;
          var jLen = this.layers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            j3 = 0;
            while (j3 < jLen) {
              if (this.layers[j3].id === newLayers[i3].id) {
                this.layers[j3] = newLayers[i3];
                break;
              }
              j3 += 1;
            }
          }
        };
        BaseRenderer.prototype.setProjectInterface = function(pInterface) {
          this.globalData.projectInterface = pInterface;
        };
        BaseRenderer.prototype.initItems = function() {
          if (!this.globalData.progressiveLoad) {
            this.buildAllItems();
          }
        };
        BaseRenderer.prototype.buildElementParenting = function(element, parentName, hierarchy) {
          var elements = this.elements;
          var layers = this.layers;
          var i3 = 0;
          var len = layers.length;
          while (i3 < len) {
            if (layers[i3].ind == parentName) {
              if (!elements[i3] || elements[i3] === true) {
                this.buildItem(i3);
                this.addPendingElement(element);
              } else {
                hierarchy.push(elements[i3]);
                elements[i3].setAsParent();
                if (layers[i3].parent !== void 0) {
                  this.buildElementParenting(element, layers[i3].parent, hierarchy);
                } else {
                  element.setHierarchy(hierarchy);
                }
              }
            }
            i3 += 1;
          }
        };
        BaseRenderer.prototype.addPendingElement = function(element) {
          this.pendingElements.push(element);
        };
        BaseRenderer.prototype.searchExtraCompositions = function(assets) {
          var i3;
          var len = assets.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (assets[i3].xt) {
              var comp2 = this.createComp(assets[i3]);
              comp2.initExpressions();
              this.globalData.projectInterface.registerComposition(comp2);
            }
          }
        };
        BaseRenderer.prototype.getElementById = function(ind) {
          var i3;
          var len = this.elements.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.elements[i3].data.ind === ind) {
              return this.elements[i3];
            }
          }
          return null;
        };
        BaseRenderer.prototype.getElementByPath = function(path) {
          var pathValue = path.shift();
          var element;
          if (typeof pathValue === "number") {
            element = this.elements[pathValue];
          } else {
            var i3;
            var len = this.elements.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (this.elements[i3].data.nm === pathValue) {
                element = this.elements[i3];
                break;
              }
            }
          }
          if (path.length === 0) {
            return element;
          }
          return element.getElementByPath(path);
        };
        BaseRenderer.prototype.setupGlobalData = function(animData, fontsContainer) {
          this.globalData.fontManager = new FontManager();
          this.globalData.slotManager = slotFactory(animData);
          this.globalData.fontManager.addChars(animData.chars);
          this.globalData.fontManager.addFonts(animData.fonts, fontsContainer);
          this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
          this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
          this.globalData.imageLoader = this.animationItem.imagePreloader;
          this.globalData.audioController = this.animationItem.audioController;
          this.globalData.frameId = 0;
          this.globalData.frameRate = animData.fr;
          this.globalData.nm = animData.nm;
          this.globalData.compSize = {
            w: animData.w,
            h: animData.h
          };
        };
        var effectTypes = {
          TRANSFORM_EFFECT: "transformEFfect"
        };
        function TransformElement() {
        }
        TransformElement.prototype = {
          initTransform: function initTransform() {
            var mat = new Matrix();
            this.finalTransform = {
              mProp: this.data.ks ? TransformPropertyFactory.getTransformProperty(this, this.data.ks, this) : {
                o: 0
              },
              _matMdf: false,
              _localMatMdf: false,
              _opMdf: false,
              mat,
              localMat: mat,
              localOpacity: 1
            };
            if (this.data.ao) {
              this.finalTransform.mProp.autoOriented = true;
            }
            if (this.data.ty !== 11) {
            }
          },
          renderTransform: function renderTransform() {
            this.finalTransform._opMdf = this.finalTransform.mProp.o._mdf || this._isFirstFrame;
            this.finalTransform._matMdf = this.finalTransform.mProp._mdf || this._isFirstFrame;
            if (this.hierarchy) {
              var mat;
              var finalMat = this.finalTransform.mat;
              var i3 = 0;
              var len = this.hierarchy.length;
              if (!this.finalTransform._matMdf) {
                while (i3 < len) {
                  if (this.hierarchy[i3].finalTransform.mProp._mdf) {
                    this.finalTransform._matMdf = true;
                    break;
                  }
                  i3 += 1;
                }
              }
              if (this.finalTransform._matMdf) {
                mat = this.finalTransform.mProp.v.props;
                finalMat.cloneFromProps(mat);
                for (i3 = 0; i3 < len; i3 += 1) {
                  finalMat.multiply(this.hierarchy[i3].finalTransform.mProp.v);
                }
              }
            }
            if (!this.localTransforms || this.finalTransform._matMdf) {
              this.finalTransform._localMatMdf = this.finalTransform._matMdf;
            }
            if (this.finalTransform._opMdf) {
              this.finalTransform.localOpacity = this.finalTransform.mProp.o.v;
            }
          },
          renderLocalTransform: function renderLocalTransform() {
            if (this.localTransforms) {
              var i3 = 0;
              var len = this.localTransforms.length;
              this.finalTransform._localMatMdf = this.finalTransform._matMdf;
              if (!this.finalTransform._localMatMdf || !this.finalTransform._opMdf) {
                while (i3 < len) {
                  if (this.localTransforms[i3]._mdf) {
                    this.finalTransform._localMatMdf = true;
                  }
                  if (this.localTransforms[i3]._opMdf && !this.finalTransform._opMdf) {
                    this.finalTransform.localOpacity = this.finalTransform.mProp.o.v;
                    this.finalTransform._opMdf = true;
                  }
                  i3 += 1;
                }
              }
              if (this.finalTransform._localMatMdf) {
                var localMat = this.finalTransform.localMat;
                this.localTransforms[0].matrix.clone(localMat);
                for (i3 = 1; i3 < len; i3 += 1) {
                  var lmat = this.localTransforms[i3].matrix;
                  localMat.multiply(lmat);
                }
                localMat.multiply(this.finalTransform.mat);
              }
              if (this.finalTransform._opMdf) {
                var localOp = this.finalTransform.localOpacity;
                for (i3 = 0; i3 < len; i3 += 1) {
                  localOp *= this.localTransforms[i3].opacity * 0.01;
                }
                this.finalTransform.localOpacity = localOp;
              }
            }
          },
          searchEffectTransforms: function searchEffectTransforms() {
            if (this.renderableEffectsManager) {
              var transformEffects = this.renderableEffectsManager.getEffects(effectTypes.TRANSFORM_EFFECT);
              if (transformEffects.length) {
                this.localTransforms = [];
                this.finalTransform.localMat = new Matrix();
                var i3 = 0;
                var len = transformEffects.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  this.localTransforms.push(transformEffects[i3]);
                }
              }
            }
          },
          globalToLocal: function globalToLocal(pt) {
            var transforms = [];
            transforms.push(this.finalTransform);
            var flag = true;
            var comp2 = this.comp;
            while (flag) {
              if (comp2.finalTransform) {
                if (comp2.data.hasMask) {
                  transforms.splice(0, 0, comp2.finalTransform);
                }
                comp2 = comp2.comp;
              } else {
                flag = false;
              }
            }
            var i3;
            var len = transforms.length;
            var ptNew;
            for (i3 = 0; i3 < len; i3 += 1) {
              ptNew = transforms[i3].mat.applyToPointArray(0, 0, 0);
              pt = [pt[0] - ptNew[0], pt[1] - ptNew[1], 0];
            }
            return pt;
          },
          mHelper: new Matrix()
        };
        function MaskElement(data2, element, globalData2) {
          this.data = data2;
          this.element = element;
          this.globalData = globalData2;
          this.storedData = [];
          this.masksProperties = this.data.masksProperties || [];
          this.maskElement = null;
          var defs = this.globalData.defs;
          var i3;
          var len = this.masksProperties ? this.masksProperties.length : 0;
          this.viewData = createSizedArray(len);
          this.solidPath = "";
          var path;
          var properties = this.masksProperties;
          var count = 0;
          var currentMasks = [];
          var j3;
          var jLen;
          var layerId = createElementID();
          var rect;
          var expansor;
          var feMorph;
          var x3;
          var maskType = "clipPath";
          var maskRef = "clip-path";
          for (i3 = 0; i3 < len; i3 += 1) {
            if (properties[i3].mode !== "a" && properties[i3].mode !== "n" || properties[i3].inv || properties[i3].o.k !== 100 || properties[i3].o.x) {
              maskType = "mask";
              maskRef = "mask";
            }
            if ((properties[i3].mode === "s" || properties[i3].mode === "i") && count === 0) {
              rect = createNS("rect");
              rect.setAttribute("fill", "#ffffff");
              rect.setAttribute("width", this.element.comp.data.w || 0);
              rect.setAttribute("height", this.element.comp.data.h || 0);
              currentMasks.push(rect);
            } else {
              rect = null;
            }
            path = createNS("path");
            if (properties[i3].mode === "n") {
              this.viewData[i3] = {
                op: PropertyFactory.getProp(this.element, properties[i3].o, 0, 0.01, this.element),
                prop: ShapePropertyFactory.getShapeProp(this.element, properties[i3], 3),
                elem: path,
                lastPath: ""
              };
              defs.appendChild(path);
            } else {
              count += 1;
              path.setAttribute("fill", properties[i3].mode === "s" ? "#000000" : "#ffffff");
              path.setAttribute("clip-rule", "nonzero");
              var filterID;
              if (properties[i3].x.k !== 0) {
                maskType = "mask";
                maskRef = "mask";
                x3 = PropertyFactory.getProp(this.element, properties[i3].x, 0, null, this.element);
                filterID = createElementID();
                expansor = createNS("filter");
                expansor.setAttribute("id", filterID);
                feMorph = createNS("feMorphology");
                feMorph.setAttribute("operator", "erode");
                feMorph.setAttribute("in", "SourceGraphic");
                feMorph.setAttribute("radius", "0");
                expansor.appendChild(feMorph);
                defs.appendChild(expansor);
                path.setAttribute("stroke", properties[i3].mode === "s" ? "#000000" : "#ffffff");
              } else {
                feMorph = null;
                x3 = null;
              }
              this.storedData[i3] = {
                elem: path,
                x: x3,
                expan: feMorph,
                lastPath: "",
                lastOperator: "",
                filterId: filterID,
                lastRadius: 0
              };
              if (properties[i3].mode === "i") {
                jLen = currentMasks.length;
                var g3 = createNS("g");
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  g3.appendChild(currentMasks[j3]);
                }
                var mask2 = createNS("mask");
                mask2.setAttribute("mask-type", "alpha");
                mask2.setAttribute("id", layerId + "_" + count);
                mask2.appendChild(path);
                defs.appendChild(mask2);
                g3.setAttribute("mask", "url(" + getLocationHref() + "#" + layerId + "_" + count + ")");
                currentMasks.length = 0;
                currentMasks.push(g3);
              } else {
                currentMasks.push(path);
              }
              if (properties[i3].inv && !this.solidPath) {
                this.solidPath = this.createLayerSolidPath();
              }
              this.viewData[i3] = {
                elem: path,
                lastPath: "",
                op: PropertyFactory.getProp(this.element, properties[i3].o, 0, 0.01, this.element),
                prop: ShapePropertyFactory.getShapeProp(this.element, properties[i3], 3),
                invRect: rect
              };
              if (!this.viewData[i3].prop.k) {
                this.drawPath(properties[i3], this.viewData[i3].prop.v, this.viewData[i3]);
              }
            }
          }
          this.maskElement = createNS(maskType);
          len = currentMasks.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.maskElement.appendChild(currentMasks[i3]);
          }
          if (count > 0) {
            this.maskElement.setAttribute("id", layerId);
            this.element.maskedElement.setAttribute(maskRef, "url(" + getLocationHref() + "#" + layerId + ")");
            defs.appendChild(this.maskElement);
          }
          if (this.viewData.length) {
            this.element.addRenderableComponent(this);
          }
        }
        MaskElement.prototype.getMaskProperty = function(pos) {
          return this.viewData[pos].prop;
        };
        MaskElement.prototype.renderFrame = function(isFirstFrame) {
          var finalMat = this.element.finalTransform.mat;
          var i3;
          var len = this.masksProperties.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.viewData[i3].prop._mdf || isFirstFrame) {
              this.drawPath(this.masksProperties[i3], this.viewData[i3].prop.v, this.viewData[i3]);
            }
            if (this.viewData[i3].op._mdf || isFirstFrame) {
              this.viewData[i3].elem.setAttribute("fill-opacity", this.viewData[i3].op.v);
            }
            if (this.masksProperties[i3].mode !== "n") {
              if (this.viewData[i3].invRect && (this.element.finalTransform.mProp._mdf || isFirstFrame)) {
                this.viewData[i3].invRect.setAttribute("transform", finalMat.getInverseMatrix().to2dCSS());
              }
              if (this.storedData[i3].x && (this.storedData[i3].x._mdf || isFirstFrame)) {
                var feMorph = this.storedData[i3].expan;
                if (this.storedData[i3].x.v < 0) {
                  if (this.storedData[i3].lastOperator !== "erode") {
                    this.storedData[i3].lastOperator = "erode";
                    this.storedData[i3].elem.setAttribute("filter", "url(" + getLocationHref() + "#" + this.storedData[i3].filterId + ")");
                  }
                  feMorph.setAttribute("radius", -this.storedData[i3].x.v);
                } else {
                  if (this.storedData[i3].lastOperator !== "dilate") {
                    this.storedData[i3].lastOperator = "dilate";
                    this.storedData[i3].elem.setAttribute("filter", null);
                  }
                  this.storedData[i3].elem.setAttribute("stroke-width", this.storedData[i3].x.v * 2);
                }
              }
            }
          }
        };
        MaskElement.prototype.getMaskelement = function() {
          return this.maskElement;
        };
        MaskElement.prototype.createLayerSolidPath = function() {
          var path = "M0,0 ";
          path += " h" + this.globalData.compSize.w;
          path += " v" + this.globalData.compSize.h;
          path += " h-" + this.globalData.compSize.w;
          path += " v-" + this.globalData.compSize.h + " ";
          return path;
        };
        MaskElement.prototype.drawPath = function(pathData, pathNodes, viewData) {
          var pathString = " M" + pathNodes.v[0][0] + "," + pathNodes.v[0][1];
          var i3;
          var len;
          len = pathNodes._length;
          for (i3 = 1; i3 < len; i3 += 1) {
            pathString += " C" + pathNodes.o[i3 - 1][0] + "," + pathNodes.o[i3 - 1][1] + " " + pathNodes.i[i3][0] + "," + pathNodes.i[i3][1] + " " + pathNodes.v[i3][0] + "," + pathNodes.v[i3][1];
          }
          if (pathNodes.c && len > 1) {
            pathString += " C" + pathNodes.o[i3 - 1][0] + "," + pathNodes.o[i3 - 1][1] + " " + pathNodes.i[0][0] + "," + pathNodes.i[0][1] + " " + pathNodes.v[0][0] + "," + pathNodes.v[0][1];
          }
          if (viewData.lastPath !== pathString) {
            var pathShapeValue = "";
            if (viewData.elem) {
              if (pathNodes.c) {
                pathShapeValue = pathData.inv ? this.solidPath + pathString : pathString;
              }
              viewData.elem.setAttribute("d", pathShapeValue);
            }
            viewData.lastPath = pathString;
          }
        };
        MaskElement.prototype.destroy = function() {
          this.element = null;
          this.globalData = null;
          this.maskElement = null;
          this.data = null;
          this.masksProperties = null;
        };
        var filtersFactory = (function() {
          var ob2 = {};
          ob2.createFilter = createFilter;
          ob2.createAlphaToLuminanceFilter = createAlphaToLuminanceFilter;
          function createFilter(filId, skipCoordinates) {
            var fil = createNS("filter");
            fil.setAttribute("id", filId);
            if (skipCoordinates !== true) {
              fil.setAttribute("filterUnits", "objectBoundingBox");
              fil.setAttribute("x", "0%");
              fil.setAttribute("y", "0%");
              fil.setAttribute("width", "100%");
              fil.setAttribute("height", "100%");
            }
            return fil;
          }
          function createAlphaToLuminanceFilter() {
            var feColorMatrix = createNS("feColorMatrix");
            feColorMatrix.setAttribute("type", "matrix");
            feColorMatrix.setAttribute("color-interpolation-filters", "sRGB");
            feColorMatrix.setAttribute("values", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1");
            return feColorMatrix;
          }
          return ob2;
        })();
        var featureSupport = (function() {
          var ob2 = {
            maskType: true,
            svgLumaHidden: true,
            offscreenCanvas: typeof OffscreenCanvas !== "undefined"
          };
          if (/MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) {
            ob2.maskType = false;
          }
          if (/firefox/i.test(navigator.userAgent)) {
            ob2.svgLumaHidden = false;
          }
          return ob2;
        })();
        var registeredEffects$1 = {};
        var idPrefix = "filter_result_";
        function SVGEffects(elem2) {
          var i3;
          var source = "SourceGraphic";
          var len = elem2.data.ef ? elem2.data.ef.length : 0;
          var filId = createElementID();
          var fil = filtersFactory.createFilter(filId, true);
          var count = 0;
          this.filters = [];
          var filterManager;
          for (i3 = 0; i3 < len; i3 += 1) {
            filterManager = null;
            var type = elem2.data.ef[i3].ty;
            if (registeredEffects$1[type]) {
              var Effect = registeredEffects$1[type].effect;
              filterManager = new Effect(fil, elem2.effectsManager.effectElements[i3], elem2, idPrefix + count, source);
              source = idPrefix + count;
              if (registeredEffects$1[type].countsAsEffect) {
                count += 1;
              }
            }
            if (filterManager) {
              this.filters.push(filterManager);
            }
          }
          if (count) {
            elem2.globalData.defs.appendChild(fil);
            elem2.layerElement.setAttribute("filter", "url(" + getLocationHref() + "#" + filId + ")");
          }
          if (this.filters.length) {
            elem2.addRenderableComponent(this);
          }
        }
        SVGEffects.prototype.renderFrame = function(_isFirstFrame) {
          var i3;
          var len = this.filters.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.filters[i3].renderFrame(_isFirstFrame);
          }
        };
        SVGEffects.prototype.getEffects = function(type) {
          var i3;
          var len = this.filters.length;
          var effects = [];
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.filters[i3].type === type) {
              effects.push(this.filters[i3]);
            }
          }
          return effects;
        };
        function registerEffect$1(id, effect2, countsAsEffect) {
          registeredEffects$1[id] = {
            effect: effect2,
            countsAsEffect
          };
        }
        function SVGBaseElement() {
        }
        SVGBaseElement.prototype = {
          initRendererElement: function initRendererElement() {
            this.layerElement = createNS("g");
          },
          createContainerElements: function createContainerElements() {
            this.matteElement = createNS("g");
            this.transformedElement = this.layerElement;
            this.maskedElement = this.layerElement;
            this._sizeChanged = false;
            var layerElementParent = null;
            if (this.data.td) {
              this.matteMasks = {};
              var gg = createNS("g");
              gg.setAttribute("id", this.layerId);
              gg.appendChild(this.layerElement);
              layerElementParent = gg;
              this.globalData.defs.appendChild(gg);
            } else if (this.data.tt) {
              this.matteElement.appendChild(this.layerElement);
              layerElementParent = this.matteElement;
              this.baseElement = this.matteElement;
            } else {
              this.baseElement = this.layerElement;
            }
            if (this.data.ln) {
              this.layerElement.setAttribute("id", this.data.ln);
            }
            if (this.data.cl) {
              this.layerElement.setAttribute("class", this.data.cl);
            }
            if (this.data.ty === 0 && !this.data.hd) {
              var cp = createNS("clipPath");
              var pt = createNS("path");
              pt.setAttribute("d", "M0,0 L" + this.data.w + ",0 L" + this.data.w + "," + this.data.h + " L0," + this.data.h + "z");
              var clipId = createElementID();
              cp.setAttribute("id", clipId);
              cp.appendChild(pt);
              this.globalData.defs.appendChild(cp);
              if (this.checkMasks()) {
                var cpGroup = createNS("g");
                cpGroup.setAttribute("clip-path", "url(" + getLocationHref() + "#" + clipId + ")");
                cpGroup.appendChild(this.layerElement);
                this.transformedElement = cpGroup;
                if (layerElementParent) {
                  layerElementParent.appendChild(this.transformedElement);
                } else {
                  this.baseElement = this.transformedElement;
                }
              } else {
                this.layerElement.setAttribute("clip-path", "url(" + getLocationHref() + "#" + clipId + ")");
              }
            }
            if (this.data.bm !== 0) {
              this.setBlendMode();
            }
          },
          renderElement: function renderElement() {
            if (this.finalTransform._localMatMdf) {
              this.transformedElement.setAttribute("transform", this.finalTransform.localMat.to2dCSS());
            }
            if (this.finalTransform._opMdf) {
              this.transformedElement.setAttribute("opacity", this.finalTransform.localOpacity);
            }
          },
          destroyBaseElement: function destroyBaseElement() {
            this.layerElement = null;
            this.matteElement = null;
            this.maskManager.destroy();
          },
          getBaseElement: function getBaseElement() {
            if (this.data.hd) {
              return null;
            }
            return this.baseElement;
          },
          createRenderableComponents: function createRenderableComponents() {
            this.maskManager = new MaskElement(this.data, this, this.globalData);
            this.renderableEffectsManager = new SVGEffects(this);
            this.searchEffectTransforms();
          },
          getMatte: function getMatte(matteType) {
            if (!this.matteMasks) {
              this.matteMasks = {};
            }
            if (!this.matteMasks[matteType]) {
              var id = this.layerId + "_" + matteType;
              var filId;
              var fil;
              var useElement;
              var gg;
              if (matteType === 1 || matteType === 3) {
                var masker = createNS("mask");
                masker.setAttribute("id", id);
                masker.setAttribute("mask-type", matteType === 3 ? "luminance" : "alpha");
                useElement = createNS("use");
                useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId);
                masker.appendChild(useElement);
                this.globalData.defs.appendChild(masker);
                if (!featureSupport.maskType && matteType === 1) {
                  masker.setAttribute("mask-type", "luminance");
                  filId = createElementID();
                  fil = filtersFactory.createFilter(filId);
                  this.globalData.defs.appendChild(fil);
                  fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                  gg = createNS("g");
                  gg.appendChild(useElement);
                  masker.appendChild(gg);
                  gg.setAttribute("filter", "url(" + getLocationHref() + "#" + filId + ")");
                }
              } else if (matteType === 2) {
                var maskGroup = createNS("mask");
                maskGroup.setAttribute("id", id);
                maskGroup.setAttribute("mask-type", "alpha");
                var maskGrouper = createNS("g");
                maskGroup.appendChild(maskGrouper);
                filId = createElementID();
                fil = filtersFactory.createFilter(filId);
                var feCTr = createNS("feComponentTransfer");
                feCTr.setAttribute("in", "SourceGraphic");
                fil.appendChild(feCTr);
                var feFunc = createNS("feFuncA");
                feFunc.setAttribute("type", "table");
                feFunc.setAttribute("tableValues", "1.0 0.0");
                feCTr.appendChild(feFunc);
                this.globalData.defs.appendChild(fil);
                var alphaRect = createNS("rect");
                alphaRect.setAttribute("width", this.comp.data.w);
                alphaRect.setAttribute("height", this.comp.data.h);
                alphaRect.setAttribute("x", "0");
                alphaRect.setAttribute("y", "0");
                alphaRect.setAttribute("fill", "#ffffff");
                alphaRect.setAttribute("opacity", "0");
                maskGrouper.setAttribute("filter", "url(" + getLocationHref() + "#" + filId + ")");
                maskGrouper.appendChild(alphaRect);
                useElement = createNS("use");
                useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId);
                maskGrouper.appendChild(useElement);
                if (!featureSupport.maskType) {
                  maskGroup.setAttribute("mask-type", "luminance");
                  fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                  gg = createNS("g");
                  maskGrouper.appendChild(alphaRect);
                  gg.appendChild(this.layerElement);
                  maskGrouper.appendChild(gg);
                }
                this.globalData.defs.appendChild(maskGroup);
              }
              this.matteMasks[matteType] = id;
            }
            return this.matteMasks[matteType];
          },
          setMatte: function setMatte(id) {
            if (!this.matteElement) {
              return;
            }
            this.matteElement.setAttribute("mask", "url(" + getLocationHref() + "#" + id + ")");
          }
        };
        function HierarchyElement() {
        }
        HierarchyElement.prototype = {
          /**
             * @function
             * Initializes hierarchy properties
             *
             */
          initHierarchy: function initHierarchy() {
            this.hierarchy = [];
            this._isParent = false;
            this.checkParenting();
          },
          /**
             * @function
             * Sets layer's hierarchy.
             * @param {array} hierarch
             * layer's parent list
             *
             */
          setHierarchy: function setHierarchy(hierarchy) {
            this.hierarchy = hierarchy;
          },
          /**
             * @function
             * Sets layer as parent.
             *
             */
          setAsParent: function setAsParent() {
            this._isParent = true;
          },
          /**
             * @function
             * Searches layer's parenting chain
             *
             */
          checkParenting: function checkParenting() {
            if (this.data.parent !== void 0) {
              this.comp.buildElementParenting(this, this.data.parent, []);
            }
          }
        };
        function RenderableDOMElement() {
        }
        (function() {
          var _prototype = {
            initElement: function initElement(data2, globalData2, comp2) {
              this.initFrame();
              this.initBaseData(data2, globalData2, comp2);
              this.initTransform(data2, globalData2, comp2);
              this.initHierarchy();
              this.initRenderable();
              this.initRendererElement();
              this.createContainerElements();
              this.createRenderableComponents();
              this.createContent();
              this.hide();
            },
            hide: function hide() {
              if (!this.hidden && (!this.isInRange || this.isTransparent)) {
                var elem2 = this.baseElement || this.layerElement;
                elem2.style.display = "none";
                this.hidden = true;
              }
            },
            show: function show() {
              if (this.isInRange && !this.isTransparent) {
                if (!this.data.hd) {
                  var elem2 = this.baseElement || this.layerElement;
                  elem2.style.display = "block";
                }
                this.hidden = false;
                this._isFirstFrame = true;
              }
            },
            renderFrame: function renderFrame() {
              if (this.data.hd || this.hidden) {
                return;
              }
              this.renderTransform();
              this.renderRenderable();
              this.renderLocalTransform();
              this.renderElement();
              this.renderInnerContent();
              if (this._isFirstFrame) {
                this._isFirstFrame = false;
              }
            },
            renderInnerContent: function renderInnerContent() {
            },
            prepareFrame: function prepareFrame(num) {
              this._mdf = false;
              this.prepareRenderableFrame(num);
              this.prepareProperties(num, this.isInRange);
              this.checkTransparency();
            },
            destroy: function destroy() {
              this.innerElem = null;
              this.destroyBaseElement();
            }
          };
          extendPrototype([RenderableElement, createProxyFunction(_prototype)], RenderableDOMElement);
        })();
        function IImageElement(data2, globalData2, comp2) {
          this.assetData = globalData2.getAssetData(data2.refId);
          if (this.assetData && this.assetData.sid) {
            this.assetData = globalData2.slotManager.getProp(this.assetData);
          }
          this.initElement(data2, globalData2, comp2);
          this.sourceRect = {
            top: 0,
            left: 0,
            width: this.assetData.w,
            height: this.assetData.h
          };
        }
        extendPrototype([BaseElement, TransformElement, SVGBaseElement, HierarchyElement, FrameElement, RenderableDOMElement], IImageElement);
        IImageElement.prototype.createContent = function() {
          var assetPath = this.globalData.getAssetsPath(this.assetData);
          this.innerElem = createNS("image");
          this.innerElem.setAttribute("width", this.assetData.w + "px");
          this.innerElem.setAttribute("height", this.assetData.h + "px");
          this.innerElem.setAttribute("preserveAspectRatio", this.assetData.pr || this.globalData.renderConfig.imagePreserveAspectRatio);
          this.innerElem.setAttributeNS("http://www.w3.org/1999/xlink", "href", assetPath);
          this.layerElement.appendChild(this.innerElem);
        };
        IImageElement.prototype.sourceRectAtTime = function() {
          return this.sourceRect;
        };
        function ProcessedElement(element, position2) {
          this.elem = element;
          this.pos = position2;
        }
        function IShapeElement() {
        }
        IShapeElement.prototype = {
          addShapeToModifiers: function addShapeToModifiers(data2) {
            var i3;
            var len = this.shapeModifiers.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.shapeModifiers[i3].addShape(data2);
            }
          },
          isShapeInAnimatedModifiers: function isShapeInAnimatedModifiers(data2) {
            var i3 = 0;
            var len = this.shapeModifiers.length;
            while (i3 < len) {
              if (this.shapeModifiers[i3].isAnimatedWithShape(data2)) {
                return true;
              }
            }
            return false;
          },
          renderModifiers: function renderModifiers() {
            if (!this.shapeModifiers.length) {
              return;
            }
            var i3;
            var len = this.shapes.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.shapes[i3].sh.reset();
            }
            len = this.shapeModifiers.length;
            var shouldBreakProcess;
            for (i3 = len - 1; i3 >= 0; i3 -= 1) {
              shouldBreakProcess = this.shapeModifiers[i3].processShapes(this._isFirstFrame);
              if (shouldBreakProcess) {
                break;
              }
            }
          },
          searchProcessedElement: function searchProcessedElement(elem2) {
            var elements = this.processedElements;
            var i3 = 0;
            var len = elements.length;
            while (i3 < len) {
              if (elements[i3].elem === elem2) {
                return elements[i3].pos;
              }
              i3 += 1;
            }
            return 0;
          },
          addProcessedElement: function addProcessedElement(elem2, pos) {
            var elements = this.processedElements;
            var i3 = elements.length;
            while (i3) {
              i3 -= 1;
              if (elements[i3].elem === elem2) {
                elements[i3].pos = pos;
                return;
              }
            }
            elements.push(new ProcessedElement(elem2, pos));
          },
          prepareFrame: function prepareFrame(num) {
            this.prepareRenderableFrame(num);
            this.prepareProperties(num, this.isInRange);
          }
        };
        var lineCapEnum = {
          1: "butt",
          2: "round",
          3: "square"
        };
        var lineJoinEnum = {
          1: "miter",
          2: "round",
          3: "bevel"
        };
        function SVGShapeData(transformers, level, shape) {
          this.caches = [];
          this.styles = [];
          this.transformers = transformers;
          this.lStr = "";
          this.sh = shape;
          this.lvl = level;
          this._isAnimated = !!shape.k;
          var i3 = 0;
          var len = transformers.length;
          while (i3 < len) {
            if (transformers[i3].mProps.dynamicProperties.length) {
              this._isAnimated = true;
              break;
            }
            i3 += 1;
          }
        }
        SVGShapeData.prototype.setAsAnimated = function() {
          this._isAnimated = true;
        };
        function SVGStyleData(data2, level) {
          this.data = data2;
          this.type = data2.ty;
          this.d = "";
          this.lvl = level;
          this._mdf = false;
          this.closed = data2.hd === true;
          this.pElem = createNS("path");
          this.msElem = null;
        }
        SVGStyleData.prototype.reset = function() {
          this.d = "";
          this._mdf = false;
        };
        function DashProperty(elem2, data2, renderer2, container) {
          this.elem = elem2;
          this.frameId = -1;
          this.dataProps = createSizedArray(data2.length);
          this.renderer = renderer2;
          this.k = false;
          this.dashStr = "";
          this.dashArray = createTypedArray("float32", data2.length ? data2.length - 1 : 0);
          this.dashoffset = createTypedArray("float32", 1);
          this.initDynamicPropertyContainer(container);
          var i3;
          var len = data2.length || 0;
          var prop;
          for (i3 = 0; i3 < len; i3 += 1) {
            prop = PropertyFactory.getProp(elem2, data2[i3].v, 0, 0, this);
            this.k = prop.k || this.k;
            this.dataProps[i3] = {
              n: data2[i3].n,
              p: prop
            };
          }
          if (!this.k) {
            this.getValue(true);
          }
          this._isAnimated = this.k;
        }
        DashProperty.prototype.getValue = function(forceRender) {
          if (this.elem.globalData.frameId === this.frameId && !forceRender) {
            return;
          }
          this.frameId = this.elem.globalData.frameId;
          this.iterateDynamicProperties();
          this._mdf = this._mdf || forceRender;
          if (this._mdf) {
            var i3 = 0;
            var len = this.dataProps.length;
            if (this.renderer === "svg") {
              this.dashStr = "";
            }
            for (i3 = 0; i3 < len; i3 += 1) {
              if (this.dataProps[i3].n !== "o") {
                if (this.renderer === "svg") {
                  this.dashStr += " " + this.dataProps[i3].p.v;
                } else {
                  this.dashArray[i3] = this.dataProps[i3].p.v;
                }
              } else {
                this.dashoffset[0] = this.dataProps[i3].p.v;
              }
            }
          }
        };
        extendPrototype([DynamicPropertyContainer], DashProperty);
        function SVGStrokeStyleData(elem2, data2, styleOb) {
          this.initDynamicPropertyContainer(elem2);
          this.getValue = this.iterateDynamicProperties;
          this.o = PropertyFactory.getProp(elem2, data2.o, 0, 0.01, this);
          this.w = PropertyFactory.getProp(elem2, data2.w, 0, null, this);
          this.d = new DashProperty(elem2, data2.d || {}, "svg", this);
          this.c = PropertyFactory.getProp(elem2, data2.c, 1, 255, this);
          this.style = styleOb;
          this._isAnimated = !!this._isAnimated;
        }
        extendPrototype([DynamicPropertyContainer], SVGStrokeStyleData);
        function SVGFillStyleData(elem2, data2, styleOb) {
          this.initDynamicPropertyContainer(elem2);
          this.getValue = this.iterateDynamicProperties;
          this.o = PropertyFactory.getProp(elem2, data2.o, 0, 0.01, this);
          this.c = PropertyFactory.getProp(elem2, data2.c, 1, 255, this);
          this.style = styleOb;
        }
        extendPrototype([DynamicPropertyContainer], SVGFillStyleData);
        function SVGNoStyleData(elem2, data2, styleOb) {
          this.initDynamicPropertyContainer(elem2);
          this.getValue = this.iterateDynamicProperties;
          this.style = styleOb;
        }
        extendPrototype([DynamicPropertyContainer], SVGNoStyleData);
        function GradientProperty(elem2, data2, container) {
          this.data = data2;
          this.c = createTypedArray("uint8c", data2.p * 4);
          var cLength = data2.k.k[0].s ? data2.k.k[0].s.length - data2.p * 4 : data2.k.k.length - data2.p * 4;
          this.o = createTypedArray("float32", cLength);
          this._cmdf = false;
          this._omdf = false;
          this._collapsable = this.checkCollapsable();
          this._hasOpacity = cLength;
          this.initDynamicPropertyContainer(container);
          this.prop = PropertyFactory.getProp(elem2, data2.k, 1, null, this);
          this.k = this.prop.k;
          this.getValue(true);
        }
        GradientProperty.prototype.comparePoints = function(values, points) {
          var i3 = 0;
          var len = this.o.length / 2;
          var diff;
          while (i3 < len) {
            diff = Math.abs(values[i3 * 4] - values[points * 4 + i3 * 2]);
            if (diff > 0.01) {
              return false;
            }
            i3 += 1;
          }
          return true;
        };
        GradientProperty.prototype.checkCollapsable = function() {
          if (this.o.length / 2 !== this.c.length / 4) {
            return false;
          }
          if (this.data.k.k[0].s) {
            var i3 = 0;
            var len = this.data.k.k.length;
            while (i3 < len) {
              if (!this.comparePoints(this.data.k.k[i3].s, this.data.p)) {
                return false;
              }
              i3 += 1;
            }
          } else if (!this.comparePoints(this.data.k.k, this.data.p)) {
            return false;
          }
          return true;
        };
        GradientProperty.prototype.getValue = function(forceRender) {
          this.prop.getValue();
          this._mdf = false;
          this._cmdf = false;
          this._omdf = false;
          if (this.prop._mdf || forceRender) {
            var i3;
            var len = this.data.p * 4;
            var mult;
            var val2;
            for (i3 = 0; i3 < len; i3 += 1) {
              mult = i3 % 4 === 0 ? 100 : 255;
              val2 = Math.round(this.prop.v[i3] * mult);
              if (this.c[i3] !== val2) {
                this.c[i3] = val2;
                this._cmdf = !forceRender;
              }
            }
            if (this.o.length) {
              len = this.prop.v.length;
              for (i3 = this.data.p * 4; i3 < len; i3 += 1) {
                mult = i3 % 2 === 0 ? 100 : 1;
                val2 = i3 % 2 === 0 ? Math.round(this.prop.v[i3] * 100) : this.prop.v[i3];
                if (this.o[i3 - this.data.p * 4] !== val2) {
                  this.o[i3 - this.data.p * 4] = val2;
                  this._omdf = !forceRender;
                }
              }
            }
            this._mdf = !forceRender;
          }
        };
        extendPrototype([DynamicPropertyContainer], GradientProperty);
        function SVGGradientFillStyleData(elem2, data2, styleOb) {
          this.initDynamicPropertyContainer(elem2);
          this.getValue = this.iterateDynamicProperties;
          this.initGradientData(elem2, data2, styleOb);
        }
        SVGGradientFillStyleData.prototype.initGradientData = function(elem2, data2, styleOb) {
          this.o = PropertyFactory.getProp(elem2, data2.o, 0, 0.01, this);
          this.s = PropertyFactory.getProp(elem2, data2.s, 1, null, this);
          this.e = PropertyFactory.getProp(elem2, data2.e, 1, null, this);
          this.h = PropertyFactory.getProp(elem2, data2.h || {
            k: 0
          }, 0, 0.01, this);
          this.a = PropertyFactory.getProp(elem2, data2.a || {
            k: 0
          }, 0, degToRads, this);
          this.g = new GradientProperty(elem2, data2.g, this);
          this.style = styleOb;
          this.stops = [];
          this.setGradientData(styleOb.pElem, data2);
          this.setGradientOpacity(data2, styleOb);
          this._isAnimated = !!this._isAnimated;
        };
        SVGGradientFillStyleData.prototype.setGradientData = function(pathElement, data2) {
          var gradientId = createElementID();
          var gfill = createNS(data2.t === 1 ? "linearGradient" : "radialGradient");
          gfill.setAttribute("id", gradientId);
          gfill.setAttribute("spreadMethod", "pad");
          gfill.setAttribute("gradientUnits", "userSpaceOnUse");
          var stops = [];
          var stop;
          var j3;
          var jLen;
          jLen = data2.g.p * 4;
          for (j3 = 0; j3 < jLen; j3 += 4) {
            stop = createNS("stop");
            gfill.appendChild(stop);
            stops.push(stop);
          }
          pathElement.setAttribute(data2.ty === "gf" ? "fill" : "stroke", "url(" + getLocationHref() + "#" + gradientId + ")");
          this.gf = gfill;
          this.cst = stops;
        };
        SVGGradientFillStyleData.prototype.setGradientOpacity = function(data2, styleOb) {
          if (this.g._hasOpacity && !this.g._collapsable) {
            var stop;
            var j3;
            var jLen;
            var mask2 = createNS("mask");
            var maskElement = createNS("path");
            mask2.appendChild(maskElement);
            var opacityId = createElementID();
            var maskId = createElementID();
            mask2.setAttribute("id", maskId);
            var opFill = createNS(data2.t === 1 ? "linearGradient" : "radialGradient");
            opFill.setAttribute("id", opacityId);
            opFill.setAttribute("spreadMethod", "pad");
            opFill.setAttribute("gradientUnits", "userSpaceOnUse");
            jLen = data2.g.k.k[0].s ? data2.g.k.k[0].s.length : data2.g.k.k.length;
            var stops = this.stops;
            for (j3 = data2.g.p * 4; j3 < jLen; j3 += 2) {
              stop = createNS("stop");
              stop.setAttribute("stop-color", "rgb(255,255,255)");
              opFill.appendChild(stop);
              stops.push(stop);
            }
            maskElement.setAttribute(data2.ty === "gf" ? "fill" : "stroke", "url(" + getLocationHref() + "#" + opacityId + ")");
            if (data2.ty === "gs") {
              maskElement.setAttribute("stroke-linecap", lineCapEnum[data2.lc || 2]);
              maskElement.setAttribute("stroke-linejoin", lineJoinEnum[data2.lj || 2]);
              if (data2.lj === 1) {
                maskElement.setAttribute("stroke-miterlimit", data2.ml);
              }
            }
            this.of = opFill;
            this.ms = mask2;
            this.ost = stops;
            this.maskId = maskId;
            styleOb.msElem = maskElement;
          }
        };
        extendPrototype([DynamicPropertyContainer], SVGGradientFillStyleData);
        function SVGGradientStrokeStyleData(elem2, data2, styleOb) {
          this.initDynamicPropertyContainer(elem2);
          this.getValue = this.iterateDynamicProperties;
          this.w = PropertyFactory.getProp(elem2, data2.w, 0, null, this);
          this.d = new DashProperty(elem2, data2.d || {}, "svg", this);
          this.initGradientData(elem2, data2, styleOb);
          this._isAnimated = !!this._isAnimated;
        }
        extendPrototype([SVGGradientFillStyleData, DynamicPropertyContainer], SVGGradientStrokeStyleData);
        function ShapeGroupData() {
          this.it = [];
          this.prevViewData = [];
          this.gr = createNS("g");
        }
        function SVGTransformData(mProps, op, container) {
          this.transform = {
            mProps,
            op,
            container
          };
          this.elements = [];
          this._isAnimated = this.transform.mProps.dynamicProperties.length || this.transform.op.effectsSequence.length;
        }
        var buildShapeString = function buildShapeString2(pathNodes, length2, closed, mat) {
          if (length2 === 0) {
            return "";
          }
          var _o = pathNodes.o;
          var _i = pathNodes.i;
          var _v = pathNodes.v;
          var i3;
          var shapeString = " M" + mat.applyToPointStringified(_v[0][0], _v[0][1]);
          for (i3 = 1; i3 < length2; i3 += 1) {
            shapeString += " C" + mat.applyToPointStringified(_o[i3 - 1][0], _o[i3 - 1][1]) + " " + mat.applyToPointStringified(_i[i3][0], _i[i3][1]) + " " + mat.applyToPointStringified(_v[i3][0], _v[i3][1]);
          }
          if (closed && length2) {
            shapeString += " C" + mat.applyToPointStringified(_o[i3 - 1][0], _o[i3 - 1][1]) + " " + mat.applyToPointStringified(_i[0][0], _i[0][1]) + " " + mat.applyToPointStringified(_v[0][0], _v[0][1]);
            shapeString += "z";
          }
          return shapeString;
        };
        var SVGElementsRenderer = (function() {
          var _identityMatrix = new Matrix();
          var _matrixHelper = new Matrix();
          var ob2 = {
            createRenderFunction
          };
          function createRenderFunction(data2) {
            switch (data2.ty) {
              case "fl":
                return renderFill;
              case "gf":
                return renderGradient;
              case "gs":
                return renderGradientStroke;
              case "st":
                return renderStroke;
              case "sh":
              case "el":
              case "rc":
              case "sr":
                return renderPath;
              case "tr":
                return renderContentTransform;
              case "no":
                return renderNoop;
              default:
                return null;
            }
          }
          function renderContentTransform(styleData, itemData, isFirstFrame) {
            if (isFirstFrame || itemData.transform.op._mdf) {
              itemData.transform.container.setAttribute("opacity", itemData.transform.op.v);
            }
            if (isFirstFrame || itemData.transform.mProps._mdf) {
              itemData.transform.container.setAttribute("transform", itemData.transform.mProps.v.to2dCSS());
            }
          }
          function renderNoop() {
          }
          function renderPath(styleData, itemData, isFirstFrame) {
            var j3;
            var jLen;
            var pathStringTransformed;
            var redraw;
            var pathNodes;
            var l3;
            var lLen = itemData.styles.length;
            var lvl = itemData.lvl;
            var paths;
            var mat;
            var iterations;
            var k3;
            for (l3 = 0; l3 < lLen; l3 += 1) {
              redraw = itemData.sh._mdf || isFirstFrame;
              if (itemData.styles[l3].lvl < lvl) {
                mat = _matrixHelper.reset();
                iterations = lvl - itemData.styles[l3].lvl;
                k3 = itemData.transformers.length - 1;
                while (!redraw && iterations > 0) {
                  redraw = itemData.transformers[k3].mProps._mdf || redraw;
                  iterations -= 1;
                  k3 -= 1;
                }
                if (redraw) {
                  iterations = lvl - itemData.styles[l3].lvl;
                  k3 = itemData.transformers.length - 1;
                  while (iterations > 0) {
                    mat.multiply(itemData.transformers[k3].mProps.v);
                    iterations -= 1;
                    k3 -= 1;
                  }
                }
              } else {
                mat = _identityMatrix;
              }
              paths = itemData.sh.paths;
              jLen = paths._length;
              if (redraw) {
                pathStringTransformed = "";
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  pathNodes = paths.shapes[j3];
                  if (pathNodes && pathNodes._length) {
                    pathStringTransformed += buildShapeString(pathNodes, pathNodes._length, pathNodes.c, mat);
                  }
                }
                itemData.caches[l3] = pathStringTransformed;
              } else {
                pathStringTransformed = itemData.caches[l3];
              }
              itemData.styles[l3].d += styleData.hd === true ? "" : pathStringTransformed;
              itemData.styles[l3]._mdf = redraw || itemData.styles[l3]._mdf;
            }
          }
          function renderFill(styleData, itemData, isFirstFrame) {
            var styleElem = itemData.style;
            if (itemData.c._mdf || isFirstFrame) {
              styleElem.pElem.setAttribute("fill", "rgb(" + bmFloor(itemData.c.v[0]) + "," + bmFloor(itemData.c.v[1]) + "," + bmFloor(itemData.c.v[2]) + ")");
            }
            if (itemData.o._mdf || isFirstFrame) {
              styleElem.pElem.setAttribute("fill-opacity", itemData.o.v);
            }
          }
          function renderGradientStroke(styleData, itemData, isFirstFrame) {
            renderGradient(styleData, itemData, isFirstFrame);
            renderStroke(styleData, itemData, isFirstFrame);
          }
          function renderGradient(styleData, itemData, isFirstFrame) {
            var gfill = itemData.gf;
            var hasOpacity = itemData.g._hasOpacity;
            var pt1 = itemData.s.v;
            var pt2 = itemData.e.v;
            if (itemData.o._mdf || isFirstFrame) {
              var attr = styleData.ty === "gf" ? "fill-opacity" : "stroke-opacity";
              itemData.style.pElem.setAttribute(attr, itemData.o.v);
            }
            if (itemData.s._mdf || isFirstFrame) {
              var attr1 = styleData.t === 1 ? "x1" : "cx";
              var attr2 = attr1 === "x1" ? "y1" : "cy";
              gfill.setAttribute(attr1, pt1[0]);
              gfill.setAttribute(attr2, pt1[1]);
              if (hasOpacity && !itemData.g._collapsable) {
                itemData.of.setAttribute(attr1, pt1[0]);
                itemData.of.setAttribute(attr2, pt1[1]);
              }
            }
            var stops;
            var i3;
            var len;
            var stop;
            if (itemData.g._cmdf || isFirstFrame) {
              stops = itemData.cst;
              var cValues = itemData.g.c;
              len = stops.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                stop = stops[i3];
                stop.setAttribute("offset", cValues[i3 * 4] + "%");
                stop.setAttribute("stop-color", "rgb(" + cValues[i3 * 4 + 1] + "," + cValues[i3 * 4 + 2] + "," + cValues[i3 * 4 + 3] + ")");
              }
            }
            if (hasOpacity && (itemData.g._omdf || isFirstFrame)) {
              var oValues = itemData.g.o;
              if (itemData.g._collapsable) {
                stops = itemData.cst;
              } else {
                stops = itemData.ost;
              }
              len = stops.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                stop = stops[i3];
                if (!itemData.g._collapsable) {
                  stop.setAttribute("offset", oValues[i3 * 2] + "%");
                }
                stop.setAttribute("stop-opacity", oValues[i3 * 2 + 1]);
              }
            }
            if (styleData.t === 1) {
              if (itemData.e._mdf || isFirstFrame) {
                gfill.setAttribute("x2", pt2[0]);
                gfill.setAttribute("y2", pt2[1]);
                if (hasOpacity && !itemData.g._collapsable) {
                  itemData.of.setAttribute("x2", pt2[0]);
                  itemData.of.setAttribute("y2", pt2[1]);
                }
              }
            } else {
              var rad;
              if (itemData.s._mdf || itemData.e._mdf || isFirstFrame) {
                rad = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
                gfill.setAttribute("r", rad);
                if (hasOpacity && !itemData.g._collapsable) {
                  itemData.of.setAttribute("r", rad);
                }
              }
              if (itemData.s._mdf || itemData.e._mdf || itemData.h._mdf || itemData.a._mdf || isFirstFrame) {
                if (!rad) {
                  rad = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
                }
                var ang = Math.atan2(pt2[1] - pt1[1], pt2[0] - pt1[0]);
                var percent = itemData.h.v;
                if (percent >= 1) {
                  percent = 0.99;
                } else if (percent <= -1) {
                  percent = -0.99;
                }
                var dist = rad * percent;
                var x3 = Math.cos(ang + itemData.a.v) * dist + pt1[0];
                var y3 = Math.sin(ang + itemData.a.v) * dist + pt1[1];
                gfill.setAttribute("fx", x3);
                gfill.setAttribute("fy", y3);
                if (hasOpacity && !itemData.g._collapsable) {
                  itemData.of.setAttribute("fx", x3);
                  itemData.of.setAttribute("fy", y3);
                }
              }
            }
          }
          function renderStroke(styleData, itemData, isFirstFrame) {
            var styleElem = itemData.style;
            var d3 = itemData.d;
            if (d3 && (d3._mdf || isFirstFrame) && d3.dashStr) {
              styleElem.pElem.setAttribute("stroke-dasharray", d3.dashStr);
              styleElem.pElem.setAttribute("stroke-dashoffset", d3.dashoffset[0]);
            }
            if (itemData.c && (itemData.c._mdf || isFirstFrame)) {
              styleElem.pElem.setAttribute("stroke", "rgb(" + bmFloor(itemData.c.v[0]) + "," + bmFloor(itemData.c.v[1]) + "," + bmFloor(itemData.c.v[2]) + ")");
            }
            if (itemData.o._mdf || isFirstFrame) {
              styleElem.pElem.setAttribute("stroke-opacity", itemData.o.v);
            }
            if (itemData.w._mdf || isFirstFrame) {
              styleElem.pElem.setAttribute("stroke-width", itemData.w.v);
              if (styleElem.msElem) {
                styleElem.msElem.setAttribute("stroke-width", itemData.w.v);
              }
            }
          }
          return ob2;
        })();
        function SVGShapeElement(data2, globalData2, comp2) {
          this.shapes = [];
          this.shapesData = data2.shapes;
          this.stylesList = [];
          this.shapeModifiers = [];
          this.itemsData = [];
          this.processedElements = [];
          this.animatedContents = [];
          this.initElement(data2, globalData2, comp2);
          this.prevViewData = [];
        }
        extendPrototype([BaseElement, TransformElement, SVGBaseElement, IShapeElement, HierarchyElement, FrameElement, RenderableDOMElement], SVGShapeElement);
        SVGShapeElement.prototype.initSecondaryElement = function() {
        };
        SVGShapeElement.prototype.identityMatrix = new Matrix();
        SVGShapeElement.prototype.buildExpressionInterface = function() {
        };
        SVGShapeElement.prototype.createContent = function() {
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true);
          this.filterUniqueShapes();
        };
        SVGShapeElement.prototype.filterUniqueShapes = function() {
          var i3;
          var len = this.shapes.length;
          var shape;
          var j3;
          var jLen = this.stylesList.length;
          var style;
          var tempShapes = [];
          var areAnimated = false;
          for (j3 = 0; j3 < jLen; j3 += 1) {
            style = this.stylesList[j3];
            areAnimated = false;
            tempShapes.length = 0;
            for (i3 = 0; i3 < len; i3 += 1) {
              shape = this.shapes[i3];
              if (shape.styles.indexOf(style) !== -1) {
                tempShapes.push(shape);
                areAnimated = shape._isAnimated || areAnimated;
              }
            }
            if (tempShapes.length > 1 && areAnimated) {
              this.setShapesAsAnimated(tempShapes);
            }
          }
        };
        SVGShapeElement.prototype.setShapesAsAnimated = function(shapes) {
          var i3;
          var len = shapes.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            shapes[i3].setAsAnimated();
          }
        };
        SVGShapeElement.prototype.createStyleElement = function(data2, level) {
          var elementData;
          var styleOb = new SVGStyleData(data2, level);
          var pathElement = styleOb.pElem;
          if (data2.ty === "st") {
            elementData = new SVGStrokeStyleData(this, data2, styleOb);
          } else if (data2.ty === "fl") {
            elementData = new SVGFillStyleData(this, data2, styleOb);
          } else if (data2.ty === "gf" || data2.ty === "gs") {
            var GradientConstructor = data2.ty === "gf" ? SVGGradientFillStyleData : SVGGradientStrokeStyleData;
            elementData = new GradientConstructor(this, data2, styleOb);
            this.globalData.defs.appendChild(elementData.gf);
            if (elementData.maskId) {
              this.globalData.defs.appendChild(elementData.ms);
              this.globalData.defs.appendChild(elementData.of);
              pathElement.setAttribute("mask", "url(" + getLocationHref() + "#" + elementData.maskId + ")");
            }
          } else if (data2.ty === "no") {
            elementData = new SVGNoStyleData(this, data2, styleOb);
          }
          if (data2.ty === "st" || data2.ty === "gs") {
            pathElement.setAttribute("stroke-linecap", lineCapEnum[data2.lc || 2]);
            pathElement.setAttribute("stroke-linejoin", lineJoinEnum[data2.lj || 2]);
            pathElement.setAttribute("fill-opacity", "0");
            if (data2.lj === 1) {
              pathElement.setAttribute("stroke-miterlimit", data2.ml);
            }
          }
          if (data2.r === 2) {
            pathElement.setAttribute("fill-rule", "evenodd");
          }
          if (data2.ln) {
            pathElement.setAttribute("id", data2.ln);
          }
          if (data2.cl) {
            pathElement.setAttribute("class", data2.cl);
          }
          if (data2.bm) {
            pathElement.style["mix-blend-mode"] = getBlendMode(data2.bm);
          }
          this.stylesList.push(styleOb);
          this.addToAnimatedContents(data2, elementData);
          return elementData;
        };
        SVGShapeElement.prototype.createGroupElement = function(data2) {
          var elementData = new ShapeGroupData();
          if (data2.ln) {
            elementData.gr.setAttribute("id", data2.ln);
          }
          if (data2.cl) {
            elementData.gr.setAttribute("class", data2.cl);
          }
          if (data2.bm) {
            elementData.gr.style["mix-blend-mode"] = getBlendMode(data2.bm);
          }
          return elementData;
        };
        SVGShapeElement.prototype.createTransformElement = function(data2, container) {
          var transformProperty = TransformPropertyFactory.getTransformProperty(this, data2, this);
          var elementData = new SVGTransformData(transformProperty, transformProperty.o, container);
          this.addToAnimatedContents(data2, elementData);
          return elementData;
        };
        SVGShapeElement.prototype.createShapeElement = function(data2, ownTransformers, level) {
          var ty = 4;
          if (data2.ty === "rc") {
            ty = 5;
          } else if (data2.ty === "el") {
            ty = 6;
          } else if (data2.ty === "sr") {
            ty = 7;
          }
          var shapeProperty = ShapePropertyFactory.getShapeProp(this, data2, ty, this);
          var elementData = new SVGShapeData(ownTransformers, level, shapeProperty);
          this.shapes.push(elementData);
          this.addShapeToModifiers(elementData);
          this.addToAnimatedContents(data2, elementData);
          return elementData;
        };
        SVGShapeElement.prototype.addToAnimatedContents = function(data2, element) {
          var i3 = 0;
          var len = this.animatedContents.length;
          while (i3 < len) {
            if (this.animatedContents[i3].element === element) {
              return;
            }
            i3 += 1;
          }
          this.animatedContents.push({
            fn: SVGElementsRenderer.createRenderFunction(data2),
            element,
            data: data2
          });
        };
        SVGShapeElement.prototype.setElementStyles = function(elementData) {
          var arr = elementData.styles;
          var j3;
          var jLen = this.stylesList.length;
          for (j3 = 0; j3 < jLen; j3 += 1) {
            if (arr.indexOf(this.stylesList[j3]) === -1 && !this.stylesList[j3].closed) {
              arr.push(this.stylesList[j3]);
            }
          }
        };
        SVGShapeElement.prototype.reloadShapes = function() {
          this._isFirstFrame = true;
          var i3;
          var len = this.itemsData.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.prevViewData[i3] = this.itemsData[i3];
          }
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true);
          this.filterUniqueShapes();
          len = this.dynamicProperties.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.dynamicProperties[i3].getValue();
          }
          this.renderModifiers();
        };
        SVGShapeElement.prototype.searchShapes = function(arr, itemsData, prevViewData, container, level, transformers, render) {
          var ownTransformers = [].concat(transformers);
          var i3;
          var len = arr.length - 1;
          var j3;
          var jLen;
          var ownStyles = [];
          var ownModifiers = [];
          var currentTransform;
          var modifier;
          var processedPos;
          for (i3 = len; i3 >= 0; i3 -= 1) {
            processedPos = this.searchProcessedElement(arr[i3]);
            if (!processedPos) {
              arr[i3]._render = render;
            } else {
              itemsData[i3] = prevViewData[processedPos - 1];
            }
            if (arr[i3].ty === "fl" || arr[i3].ty === "st" || arr[i3].ty === "gf" || arr[i3].ty === "gs" || arr[i3].ty === "no") {
              if (!processedPos) {
                itemsData[i3] = this.createStyleElement(arr[i3], level);
              } else {
                itemsData[i3].style.closed = arr[i3].hd;
              }
              if (arr[i3]._render) {
                if (itemsData[i3].style.pElem.parentNode !== container) {
                  container.appendChild(itemsData[i3].style.pElem);
                }
              }
              ownStyles.push(itemsData[i3].style);
            } else if (arr[i3].ty === "gr") {
              if (!processedPos) {
                itemsData[i3] = this.createGroupElement(arr[i3]);
              } else {
                jLen = itemsData[i3].it.length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  itemsData[i3].prevViewData[j3] = itemsData[i3].it[j3];
                }
              }
              this.searchShapes(arr[i3].it, itemsData[i3].it, itemsData[i3].prevViewData, itemsData[i3].gr, level + 1, ownTransformers, render);
              if (arr[i3]._render) {
                if (itemsData[i3].gr.parentNode !== container) {
                  container.appendChild(itemsData[i3].gr);
                }
              }
            } else if (arr[i3].ty === "tr") {
              if (!processedPos) {
                itemsData[i3] = this.createTransformElement(arr[i3], container);
              }
              currentTransform = itemsData[i3].transform;
              ownTransformers.push(currentTransform);
            } else if (arr[i3].ty === "sh" || arr[i3].ty === "rc" || arr[i3].ty === "el" || arr[i3].ty === "sr") {
              if (!processedPos) {
                itemsData[i3] = this.createShapeElement(arr[i3], ownTransformers, level);
              }
              this.setElementStyles(itemsData[i3]);
            } else if (arr[i3].ty === "tm" || arr[i3].ty === "rd" || arr[i3].ty === "ms" || arr[i3].ty === "pb" || arr[i3].ty === "zz" || arr[i3].ty === "op") {
              if (!processedPos) {
                modifier = ShapeModifiers.getModifier(arr[i3].ty);
                modifier.init(this, arr[i3]);
                itemsData[i3] = modifier;
                this.shapeModifiers.push(modifier);
              } else {
                modifier = itemsData[i3];
                modifier.closed = false;
              }
              ownModifiers.push(modifier);
            } else if (arr[i3].ty === "rp") {
              if (!processedPos) {
                modifier = ShapeModifiers.getModifier(arr[i3].ty);
                itemsData[i3] = modifier;
                modifier.init(this, arr, i3, itemsData);
                this.shapeModifiers.push(modifier);
                render = false;
              } else {
                modifier = itemsData[i3];
                modifier.closed = true;
              }
              ownModifiers.push(modifier);
            }
            this.addProcessedElement(arr[i3], i3 + 1);
          }
          len = ownStyles.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            ownStyles[i3].closed = true;
          }
          len = ownModifiers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            ownModifiers[i3].closed = true;
          }
        };
        SVGShapeElement.prototype.renderInnerContent = function() {
          this.renderModifiers();
          var i3;
          var len = this.stylesList.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.stylesList[i3].reset();
          }
          this.renderShape();
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.stylesList[i3]._mdf || this._isFirstFrame) {
              if (this.stylesList[i3].msElem) {
                this.stylesList[i3].msElem.setAttribute("d", this.stylesList[i3].d);
                this.stylesList[i3].d = "M0 0" + this.stylesList[i3].d;
              }
              this.stylesList[i3].pElem.setAttribute("d", this.stylesList[i3].d || "M0 0");
            }
          }
        };
        SVGShapeElement.prototype.renderShape = function() {
          var i3;
          var len = this.animatedContents.length;
          var animatedContent;
          for (i3 = 0; i3 < len; i3 += 1) {
            animatedContent = this.animatedContents[i3];
            if ((this._isFirstFrame || animatedContent.element._isAnimated) && animatedContent.data !== true) {
              animatedContent.fn(animatedContent.data, animatedContent.element, this._isFirstFrame);
            }
          }
        };
        SVGShapeElement.prototype.destroy = function() {
          this.destroyBaseElement();
          this.shapesData = null;
          this.itemsData = null;
        };
        function LetterProps(o3, sw, sc, fc, m3, p3) {
          this.o = o3;
          this.sw = sw;
          this.sc = sc;
          this.fc = fc;
          this.m = m3;
          this.p = p3;
          this._mdf = {
            o: true,
            sw: !!sw,
            sc: !!sc,
            fc: !!fc,
            m: true,
            p: true
          };
        }
        LetterProps.prototype.update = function(o3, sw, sc, fc, m3, p3) {
          this._mdf.o = false;
          this._mdf.sw = false;
          this._mdf.sc = false;
          this._mdf.fc = false;
          this._mdf.m = false;
          this._mdf.p = false;
          var updated = false;
          if (this.o !== o3) {
            this.o = o3;
            this._mdf.o = true;
            updated = true;
          }
          if (this.sw !== sw) {
            this.sw = sw;
            this._mdf.sw = true;
            updated = true;
          }
          if (this.sc !== sc) {
            this.sc = sc;
            this._mdf.sc = true;
            updated = true;
          }
          if (this.fc !== fc) {
            this.fc = fc;
            this._mdf.fc = true;
            updated = true;
          }
          if (this.m !== m3) {
            this.m = m3;
            this._mdf.m = true;
            updated = true;
          }
          if (p3.length && (this.p[0] !== p3[0] || this.p[1] !== p3[1] || this.p[4] !== p3[4] || this.p[5] !== p3[5] || this.p[12] !== p3[12] || this.p[13] !== p3[13])) {
            this.p = p3;
            this._mdf.p = true;
            updated = true;
          }
          return updated;
        };
        function TextProperty(elem2, data2) {
          this._frameId = initialDefaultFrame;
          this.pv = "";
          this.v = "";
          this.kf = false;
          this._isFirstFrame = true;
          this._mdf = false;
          if (data2.d && data2.d.sid) {
            data2.d = elem2.globalData.slotManager.getProp(data2.d);
          }
          this.data = data2;
          this.elem = elem2;
          this.comp = this.elem.comp;
          this.keysIndex = 0;
          this.canResize = false;
          this.minimumFontSize = 1;
          this.effectsSequence = [];
          this.currentData = {
            ascent: 0,
            boxWidth: this.defaultBoxWidth,
            f: "",
            fStyle: "",
            fWeight: "",
            fc: "",
            j: "",
            justifyOffset: "",
            l: [],
            lh: 0,
            lineWidths: [],
            ls: "",
            of: "",
            s: "",
            sc: "",
            sw: 0,
            t: 0,
            tr: 0,
            sz: 0,
            ps: null,
            fillColorAnim: false,
            strokeColorAnim: false,
            strokeWidthAnim: false,
            yOffset: 0,
            finalSize: 0,
            finalText: [],
            finalLineHeight: 0,
            __complete: false
          };
          this.copyData(this.currentData, this.data.d.k[0].s);
          if (!this.searchProperty()) {
            this.completeTextData(this.currentData);
          }
        }
        TextProperty.prototype.defaultBoxWidth = [0, 0];
        TextProperty.prototype.copyData = function(obj, data2) {
          for (var s3 in data2) {
            if (Object.prototype.hasOwnProperty.call(data2, s3)) {
              obj[s3] = data2[s3];
            }
          }
          return obj;
        };
        TextProperty.prototype.setCurrentData = function(data2) {
          if (!data2.__complete) {
            this.completeTextData(data2);
          }
          this.currentData = data2;
          this.currentData.boxWidth = this.currentData.boxWidth || this.defaultBoxWidth;
          this._mdf = true;
        };
        TextProperty.prototype.searchProperty = function() {
          return this.searchKeyframes();
        };
        TextProperty.prototype.searchKeyframes = function() {
          this.kf = this.data.d.k.length > 1;
          if (this.kf) {
            this.addEffect(this.getKeyframeValue.bind(this));
          }
          return this.kf;
        };
        TextProperty.prototype.addEffect = function(effectFunction) {
          this.effectsSequence.push(effectFunction);
          this.elem.addDynamicProperty(this);
        };
        TextProperty.prototype.getValue = function(_finalValue) {
          if ((this.elem.globalData.frameId === this.frameId || !this.effectsSequence.length) && !_finalValue) {
            return;
          }
          this.currentData.t = this.data.d.k[this.keysIndex].s.t;
          var currentValue = this.currentData;
          var currentIndex = this.keysIndex;
          if (this.lock) {
            this.setCurrentData(this.currentData);
            return;
          }
          this.lock = true;
          this._mdf = false;
          var i3;
          var len = this.effectsSequence.length;
          var finalValue = _finalValue || this.data.d.k[this.keysIndex].s;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (currentIndex !== this.keysIndex) {
              finalValue = this.effectsSequence[i3](finalValue, finalValue.t);
            } else {
              finalValue = this.effectsSequence[i3](this.currentData, finalValue.t);
            }
          }
          if (currentValue !== finalValue) {
            this.setCurrentData(finalValue);
          }
          this.v = this.currentData;
          this.pv = this.v;
          this.lock = false;
          this.frameId = this.elem.globalData.frameId;
        };
        TextProperty.prototype.getKeyframeValue = function() {
          var textKeys = this.data.d.k;
          var frameNum = this.elem.comp.renderedFrame;
          var i3 = 0;
          var len = textKeys.length;
          while (i3 <= len - 1) {
            if (i3 === len - 1 || textKeys[i3 + 1].t > frameNum) {
              break;
            }
            i3 += 1;
          }
          if (this.keysIndex !== i3) {
            this.keysIndex = i3;
          }
          return this.data.d.k[this.keysIndex].s;
        };
        TextProperty.prototype.buildFinalText = function(text2) {
          var charactersArray = [];
          var i3 = 0;
          var len = text2.length;
          var charCode;
          var secondCharCode;
          var shouldCombine = false;
          var shouldCombineNext = false;
          var currentChars = "";
          while (i3 < len) {
            shouldCombine = shouldCombineNext;
            shouldCombineNext = false;
            charCode = text2.charCodeAt(i3);
            currentChars = text2.charAt(i3);
            if (FontManager.isCombinedCharacter(charCode)) {
              shouldCombine = true;
            } else if (charCode >= 55296 && charCode <= 56319) {
              if (FontManager.isRegionalFlag(text2, i3)) {
                currentChars = text2.substr(i3, 14);
              } else {
                secondCharCode = text2.charCodeAt(i3 + 1);
                if (secondCharCode >= 56320 && secondCharCode <= 57343) {
                  if (FontManager.isModifier(charCode, secondCharCode)) {
                    currentChars = text2.substr(i3, 2);
                    shouldCombine = true;
                  } else if (FontManager.isFlagEmoji(text2.substr(i3, 4))) {
                    currentChars = text2.substr(i3, 4);
                  } else {
                    currentChars = text2.substr(i3, 2);
                  }
                }
              }
            } else if (charCode > 56319) {
              secondCharCode = text2.charCodeAt(i3 + 1);
              if (FontManager.isVariationSelector(charCode)) {
                shouldCombine = true;
              }
            } else if (FontManager.isZeroWidthJoiner(charCode)) {
              shouldCombine = true;
              shouldCombineNext = true;
            }
            if (shouldCombine) {
              charactersArray[charactersArray.length - 1] += currentChars;
              shouldCombine = false;
            } else {
              charactersArray.push(currentChars);
            }
            i3 += currentChars.length;
          }
          return charactersArray;
        };
        TextProperty.prototype.completeTextData = function(documentData) {
          documentData.__complete = true;
          var fontManager = this.elem.globalData.fontManager;
          var data2 = this.data;
          var letters = [];
          var i3;
          var len;
          var newLineFlag;
          var index2 = 0;
          var val2;
          var anchorGrouping = data2.m.g;
          var currentSize = 0;
          var currentPos = 0;
          var currentLine = 0;
          var lineWidths = [];
          var lineWidth = 0;
          var maxLineWidth = 0;
          var j3;
          var jLen;
          var fontData = fontManager.getFontByName(documentData.f);
          var charData;
          var cLength = 0;
          var fontProps = getFontProperties(fontData);
          documentData.fWeight = fontProps.weight;
          documentData.fStyle = fontProps.style;
          documentData.finalSize = documentData.s;
          documentData.finalText = this.buildFinalText(documentData.t);
          len = documentData.finalText.length;
          documentData.finalLineHeight = documentData.lh;
          var trackingOffset = documentData.tr / 1e3 * documentData.finalSize;
          var charCode;
          if (documentData.sz) {
            var flag = true;
            var boxWidth = documentData.sz[0];
            var boxHeight = documentData.sz[1];
            var currentHeight;
            var finalText;
            while (flag) {
              finalText = this.buildFinalText(documentData.t);
              currentHeight = 0;
              lineWidth = 0;
              len = finalText.length;
              trackingOffset = documentData.tr / 1e3 * documentData.finalSize;
              var lastSpaceIndex = -1;
              for (i3 = 0; i3 < len; i3 += 1) {
                charCode = finalText[i3].charCodeAt(0);
                newLineFlag = false;
                if (finalText[i3] === " ") {
                  lastSpaceIndex = i3;
                } else if (charCode === 13 || charCode === 3) {
                  lineWidth = 0;
                  newLineFlag = true;
                  currentHeight += documentData.finalLineHeight || documentData.finalSize * 1.2;
                }
                if (fontManager.chars) {
                  charData = fontManager.getCharData(finalText[i3], fontData.fStyle, fontData.fFamily);
                  cLength = newLineFlag ? 0 : charData.w * documentData.finalSize / 100;
                } else {
                  cLength = fontManager.measureText(finalText[i3], documentData.f, documentData.finalSize);
                }
                if (lineWidth + cLength > boxWidth && finalText[i3] !== " ") {
                  if (lastSpaceIndex === -1) {
                    len += 1;
                  } else {
                    i3 = lastSpaceIndex;
                  }
                  currentHeight += documentData.finalLineHeight || documentData.finalSize * 1.2;
                  finalText.splice(i3, lastSpaceIndex === i3 ? 1 : 0, "\r");
                  lastSpaceIndex = -1;
                  lineWidth = 0;
                } else {
                  lineWidth += cLength;
                  lineWidth += trackingOffset;
                }
              }
              currentHeight += fontData.ascent * documentData.finalSize / 100;
              if (this.canResize && documentData.finalSize > this.minimumFontSize && boxHeight < currentHeight) {
                documentData.finalSize -= 1;
                documentData.finalLineHeight = documentData.finalSize * documentData.lh / documentData.s;
              } else {
                documentData.finalText = finalText;
                len = documentData.finalText.length;
                flag = false;
              }
            }
          }
          lineWidth = -trackingOffset;
          cLength = 0;
          var uncollapsedSpaces = 0;
          var currentChar;
          for (i3 = 0; i3 < len; i3 += 1) {
            newLineFlag = false;
            currentChar = documentData.finalText[i3];
            charCode = currentChar.charCodeAt(0);
            if (charCode === 13 || charCode === 3) {
              uncollapsedSpaces = 0;
              lineWidths.push(lineWidth);
              maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
              lineWidth = -2 * trackingOffset;
              val2 = "";
              newLineFlag = true;
              currentLine += 1;
            } else {
              val2 = currentChar;
            }
            if (fontManager.chars) {
              charData = fontManager.getCharData(currentChar, fontData.fStyle, fontManager.getFontByName(documentData.f).fFamily);
              cLength = newLineFlag ? 0 : charData.w * documentData.finalSize / 100;
            } else {
              cLength = fontManager.measureText(val2, documentData.f, documentData.finalSize);
            }
            if (currentChar === " ") {
              uncollapsedSpaces += cLength + trackingOffset;
            } else {
              lineWidth += cLength + trackingOffset + uncollapsedSpaces;
              uncollapsedSpaces = 0;
            }
            letters.push({
              l: cLength,
              an: cLength,
              add: currentSize,
              n: newLineFlag,
              anIndexes: [],
              val: val2,
              line: currentLine,
              animatorJustifyOffset: 0
            });
            if (anchorGrouping == 2) {
              currentSize += cLength;
              if (val2 === "" || val2 === " " || i3 === len - 1) {
                if (val2 === "" || val2 === " ") {
                  currentSize -= cLength;
                }
                while (currentPos <= i3) {
                  letters[currentPos].an = currentSize;
                  letters[currentPos].ind = index2;
                  letters[currentPos].extra = cLength;
                  currentPos += 1;
                }
                index2 += 1;
                currentSize = 0;
              }
            } else if (anchorGrouping == 3) {
              currentSize += cLength;
              if (val2 === "" || i3 === len - 1) {
                if (val2 === "") {
                  currentSize -= cLength;
                }
                while (currentPos <= i3) {
                  letters[currentPos].an = currentSize;
                  letters[currentPos].ind = index2;
                  letters[currentPos].extra = cLength;
                  currentPos += 1;
                }
                currentSize = 0;
                index2 += 1;
              }
            } else {
              letters[index2].ind = index2;
              letters[index2].extra = 0;
              index2 += 1;
            }
          }
          documentData.l = letters;
          maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
          lineWidths.push(lineWidth);
          if (documentData.sz) {
            documentData.boxWidth = documentData.sz[0];
            documentData.justifyOffset = 0;
          } else {
            documentData.boxWidth = maxLineWidth;
            switch (documentData.j) {
              case 1:
                documentData.justifyOffset = -documentData.boxWidth;
                break;
              case 2:
                documentData.justifyOffset = -documentData.boxWidth / 2;
                break;
              default:
                documentData.justifyOffset = 0;
            }
          }
          documentData.lineWidths = lineWidths;
          var animators = data2.a;
          var animatorData;
          var letterData;
          jLen = animators.length;
          var based;
          var ind;
          var indexes = [];
          for (j3 = 0; j3 < jLen; j3 += 1) {
            animatorData = animators[j3];
            if (animatorData.a.sc) {
              documentData.strokeColorAnim = true;
            }
            if (animatorData.a.sw) {
              documentData.strokeWidthAnim = true;
            }
            if (animatorData.a.fc || animatorData.a.fh || animatorData.a.fs || animatorData.a.fb) {
              documentData.fillColorAnim = true;
            }
            ind = 0;
            based = animatorData.s.b;
            for (i3 = 0; i3 < len; i3 += 1) {
              letterData = letters[i3];
              letterData.anIndexes[j3] = ind;
              if (based == 1 && letterData.val !== "" || based == 2 && letterData.val !== "" && letterData.val !== " " || based == 3 && (letterData.n || letterData.val == " " || i3 == len - 1) || based == 4 && (letterData.n || i3 == len - 1)) {
                if (animatorData.s.rn === 1) {
                  indexes.push(ind);
                }
                ind += 1;
              }
            }
            data2.a[j3].s.totalChars = ind;
            var currentInd = -1;
            var newInd;
            if (animatorData.s.rn === 1) {
              for (i3 = 0; i3 < len; i3 += 1) {
                letterData = letters[i3];
                if (currentInd != letterData.anIndexes[j3]) {
                  currentInd = letterData.anIndexes[j3];
                  newInd = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
                }
                letterData.anIndexes[j3] = newInd;
              }
            }
          }
          documentData.yOffset = documentData.finalLineHeight || documentData.finalSize * 1.2;
          documentData.ls = documentData.ls || 0;
          documentData.ascent = fontData.ascent * documentData.finalSize / 100;
        };
        TextProperty.prototype.updateDocumentData = function(newData, index2) {
          index2 = index2 === void 0 ? this.keysIndex : index2;
          var dData = this.copyData({}, this.data.d.k[index2].s);
          dData = this.copyData(dData, newData);
          this.data.d.k[index2].s = dData;
          this.recalculate(index2);
          this.setCurrentData(dData);
          this.elem.addDynamicProperty(this);
        };
        TextProperty.prototype.recalculate = function(index2) {
          var dData = this.data.d.k[index2].s;
          dData.__complete = false;
          this.keysIndex = 0;
          this._isFirstFrame = true;
          this.getValue(dData);
        };
        TextProperty.prototype.canResizeFont = function(_canResize) {
          this.canResize = _canResize;
          this.recalculate(this.keysIndex);
          this.elem.addDynamicProperty(this);
        };
        TextProperty.prototype.setMinimumFontSize = function(_fontValue) {
          this.minimumFontSize = Math.floor(_fontValue) || 1;
          this.recalculate(this.keysIndex);
          this.elem.addDynamicProperty(this);
        };
        var TextSelectorProp = (function() {
          var max = Math.max;
          var min = Math.min;
          var floor = Math.floor;
          function TextSelectorPropFactory(elem2, data2) {
            this._currentTextLength = -1;
            this.k = false;
            this.data = data2;
            this.elem = elem2;
            this.comp = elem2.comp;
            this.finalS = 0;
            this.finalE = 0;
            this.initDynamicPropertyContainer(elem2);
            this.s = PropertyFactory.getProp(elem2, data2.s || {
              k: 0
            }, 0, 0, this);
            if ("e" in data2) {
              this.e = PropertyFactory.getProp(elem2, data2.e, 0, 0, this);
            } else {
              this.e = {
                v: 100
              };
            }
            this.o = PropertyFactory.getProp(elem2, data2.o || {
              k: 0
            }, 0, 0, this);
            this.xe = PropertyFactory.getProp(elem2, data2.xe || {
              k: 0
            }, 0, 0, this);
            this.ne = PropertyFactory.getProp(elem2, data2.ne || {
              k: 0
            }, 0, 0, this);
            this.sm = PropertyFactory.getProp(elem2, data2.sm || {
              k: 100
            }, 0, 0, this);
            this.a = PropertyFactory.getProp(elem2, data2.a, 0, 0.01, this);
            if (!this.dynamicProperties.length) {
              this.getValue();
            }
          }
          TextSelectorPropFactory.prototype = {
            getMult: function getMult(ind) {
              if (this._currentTextLength !== this.elem.textProperty.currentData.l.length) {
                this.getValue();
              }
              var x1 = 0;
              var y1 = 0;
              var x22 = 1;
              var y22 = 1;
              if (this.ne.v > 0) {
                x1 = this.ne.v / 100;
              } else {
                y1 = -this.ne.v / 100;
              }
              if (this.xe.v > 0) {
                x22 = 1 - this.xe.v / 100;
              } else {
                y22 = 1 + this.xe.v / 100;
              }
              var easer = BezierFactory.getBezierEasing(x1, y1, x22, y22).get;
              var mult = 0;
              var s3 = this.finalS;
              var e3 = this.finalE;
              var type = this.data.sh;
              if (type === 2) {
                if (e3 === s3) {
                  mult = ind >= e3 ? 1 : 0;
                } else {
                  mult = max(0, min(0.5 / (e3 - s3) + (ind - s3) / (e3 - s3), 1));
                }
                mult = easer(mult);
              } else if (type === 3) {
                if (e3 === s3) {
                  mult = ind >= e3 ? 0 : 1;
                } else {
                  mult = 1 - max(0, min(0.5 / (e3 - s3) + (ind - s3) / (e3 - s3), 1));
                }
                mult = easer(mult);
              } else if (type === 4) {
                if (e3 === s3) {
                  mult = 0;
                } else {
                  mult = max(0, min(0.5 / (e3 - s3) + (ind - s3) / (e3 - s3), 1));
                  if (mult < 0.5) {
                    mult *= 2;
                  } else {
                    mult = 1 - 2 * (mult - 0.5);
                  }
                }
                mult = easer(mult);
              } else if (type === 5) {
                if (e3 === s3) {
                  mult = 0;
                } else {
                  var tot = e3 - s3;
                  ind = min(max(0, ind + 0.5 - s3), e3 - s3);
                  var x3 = -tot / 2 + ind;
                  var a3 = tot / 2;
                  mult = Math.sqrt(1 - x3 * x3 / (a3 * a3));
                }
                mult = easer(mult);
              } else if (type === 6) {
                if (e3 === s3) {
                  mult = 0;
                } else {
                  ind = min(max(0, ind + 0.5 - s3), e3 - s3);
                  mult = (1 + Math.cos(Math.PI + Math.PI * 2 * ind / (e3 - s3))) / 2;
                }
                mult = easer(mult);
              } else {
                if (ind >= floor(s3)) {
                  if (ind - s3 < 0) {
                    mult = max(0, min(min(e3, 1) - (s3 - ind), 1));
                  } else {
                    mult = max(0, min(e3 - ind, 1));
                  }
                }
                mult = easer(mult);
              }
              if (this.sm.v !== 100) {
                var smoothness = this.sm.v * 0.01;
                if (smoothness === 0) {
                  smoothness = 1e-8;
                }
                var threshold = 0.5 - smoothness * 0.5;
                if (mult < threshold) {
                  mult = 0;
                } else {
                  mult = (mult - threshold) / smoothness;
                  if (mult > 1) {
                    mult = 1;
                  }
                }
              }
              return mult * this.a.v;
            },
            getValue: function getValue(newCharsFlag) {
              this.iterateDynamicProperties();
              this._mdf = newCharsFlag || this._mdf;
              this._currentTextLength = this.elem.textProperty.currentData.l.length || 0;
              if (newCharsFlag && this.data.r === 2) {
                this.e.v = this._currentTextLength;
              }
              var divisor = this.data.r === 2 ? 1 : 100 / this.data.totalChars;
              var o3 = this.o.v / divisor;
              var s3 = this.s.v / divisor + o3;
              var e3 = this.e.v / divisor + o3;
              if (s3 > e3) {
                var _s = s3;
                s3 = e3;
                e3 = _s;
              }
              this.finalS = s3;
              this.finalE = e3;
            }
          };
          extendPrototype([DynamicPropertyContainer], TextSelectorPropFactory);
          function getTextSelectorProp(elem2, data2, arr) {
            return new TextSelectorPropFactory(elem2, data2, arr);
          }
          return {
            getTextSelectorProp
          };
        })();
        function TextAnimatorDataProperty(elem2, animatorProps, container) {
          var defaultData = {
            propType: false
          };
          var getProp = PropertyFactory.getProp;
          var textAnimatorAnimatables = animatorProps.a;
          this.a = {
            r: textAnimatorAnimatables.r ? getProp(elem2, textAnimatorAnimatables.r, 0, degToRads, container) : defaultData,
            rx: textAnimatorAnimatables.rx ? getProp(elem2, textAnimatorAnimatables.rx, 0, degToRads, container) : defaultData,
            ry: textAnimatorAnimatables.ry ? getProp(elem2, textAnimatorAnimatables.ry, 0, degToRads, container) : defaultData,
            sk: textAnimatorAnimatables.sk ? getProp(elem2, textAnimatorAnimatables.sk, 0, degToRads, container) : defaultData,
            sa: textAnimatorAnimatables.sa ? getProp(elem2, textAnimatorAnimatables.sa, 0, degToRads, container) : defaultData,
            s: textAnimatorAnimatables.s ? getProp(elem2, textAnimatorAnimatables.s, 1, 0.01, container) : defaultData,
            a: textAnimatorAnimatables.a ? getProp(elem2, textAnimatorAnimatables.a, 1, 0, container) : defaultData,
            o: textAnimatorAnimatables.o ? getProp(elem2, textAnimatorAnimatables.o, 0, 0.01, container) : defaultData,
            p: textAnimatorAnimatables.p ? getProp(elem2, textAnimatorAnimatables.p, 1, 0, container) : defaultData,
            sw: textAnimatorAnimatables.sw ? getProp(elem2, textAnimatorAnimatables.sw, 0, 0, container) : defaultData,
            sc: textAnimatorAnimatables.sc ? getProp(elem2, textAnimatorAnimatables.sc, 1, 0, container) : defaultData,
            fc: textAnimatorAnimatables.fc ? getProp(elem2, textAnimatorAnimatables.fc, 1, 0, container) : defaultData,
            fh: textAnimatorAnimatables.fh ? getProp(elem2, textAnimatorAnimatables.fh, 0, 0, container) : defaultData,
            fs: textAnimatorAnimatables.fs ? getProp(elem2, textAnimatorAnimatables.fs, 0, 0.01, container) : defaultData,
            fb: textAnimatorAnimatables.fb ? getProp(elem2, textAnimatorAnimatables.fb, 0, 0.01, container) : defaultData,
            t: textAnimatorAnimatables.t ? getProp(elem2, textAnimatorAnimatables.t, 0, 0, container) : defaultData
          };
          this.s = TextSelectorProp.getTextSelectorProp(elem2, animatorProps.s, container);
          this.s.t = animatorProps.s.t;
        }
        function TextAnimatorProperty(textData, renderType, elem2) {
          this._isFirstFrame = true;
          this._hasMaskedPath = false;
          this._frameId = -1;
          this._textData = textData;
          this._renderType = renderType;
          this._elem = elem2;
          this._animatorsData = createSizedArray(this._textData.a.length);
          this._pathData = {};
          this._moreOptions = {
            alignment: {}
          };
          this.renderedLetters = [];
          this.lettersChangedFlag = false;
          this.initDynamicPropertyContainer(elem2);
        }
        TextAnimatorProperty.prototype.searchProperties = function() {
          var i3;
          var len = this._textData.a.length;
          var animatorProps;
          var getProp = PropertyFactory.getProp;
          for (i3 = 0; i3 < len; i3 += 1) {
            animatorProps = this._textData.a[i3];
            this._animatorsData[i3] = new TextAnimatorDataProperty(this._elem, animatorProps, this);
          }
          if (this._textData.p && "m" in this._textData.p) {
            this._pathData = {
              a: getProp(this._elem, this._textData.p.a, 0, 0, this),
              f: getProp(this._elem, this._textData.p.f, 0, 0, this),
              l: getProp(this._elem, this._textData.p.l, 0, 0, this),
              r: getProp(this._elem, this._textData.p.r, 0, 0, this),
              p: getProp(this._elem, this._textData.p.p, 0, 0, this),
              m: this._elem.maskManager.getMaskProperty(this._textData.p.m)
            };
            this._hasMaskedPath = true;
          } else {
            this._hasMaskedPath = false;
          }
          this._moreOptions.alignment = getProp(this._elem, this._textData.m.a, 1, 0, this);
        };
        TextAnimatorProperty.prototype.getMeasures = function(documentData, lettersChangedFlag) {
          this.lettersChangedFlag = lettersChangedFlag;
          if (!this._mdf && !this._isFirstFrame && !lettersChangedFlag && (!this._hasMaskedPath || !this._pathData.m._mdf)) {
            return;
          }
          this._isFirstFrame = false;
          var alignment = this._moreOptions.alignment.v;
          var animators = this._animatorsData;
          var textData = this._textData;
          var matrixHelper = this.mHelper;
          var renderType = this._renderType;
          var renderedLettersCount = this.renderedLetters.length;
          var xPos;
          var yPos;
          var i3;
          var len;
          var letters = documentData.l;
          var pathInfo;
          var currentLength;
          var currentPoint;
          var segmentLength;
          var flag;
          var pointInd;
          var segmentInd;
          var prevPoint;
          var points;
          var segments;
          var partialLength;
          var totalLength;
          var perc;
          var tanAngle;
          var mask2;
          if (this._hasMaskedPath) {
            mask2 = this._pathData.m;
            if (!this._pathData.n || this._pathData._mdf) {
              var paths = mask2.v;
              if (this._pathData.r.v) {
                paths = paths.reverse();
              }
              pathInfo = {
                tLength: 0,
                segments: []
              };
              len = paths._length - 1;
              var bezierData;
              totalLength = 0;
              for (i3 = 0; i3 < len; i3 += 1) {
                bezierData = bez.buildBezierData(paths.v[i3], paths.v[i3 + 1], [paths.o[i3][0] - paths.v[i3][0], paths.o[i3][1] - paths.v[i3][1]], [paths.i[i3 + 1][0] - paths.v[i3 + 1][0], paths.i[i3 + 1][1] - paths.v[i3 + 1][1]]);
                pathInfo.tLength += bezierData.segmentLength;
                pathInfo.segments.push(bezierData);
                totalLength += bezierData.segmentLength;
              }
              i3 = len;
              if (mask2.v.c) {
                bezierData = bez.buildBezierData(paths.v[i3], paths.v[0], [paths.o[i3][0] - paths.v[i3][0], paths.o[i3][1] - paths.v[i3][1]], [paths.i[0][0] - paths.v[0][0], paths.i[0][1] - paths.v[0][1]]);
                pathInfo.tLength += bezierData.segmentLength;
                pathInfo.segments.push(bezierData);
                totalLength += bezierData.segmentLength;
              }
              this._pathData.pi = pathInfo;
            }
            pathInfo = this._pathData.pi;
            currentLength = this._pathData.f.v;
            segmentInd = 0;
            pointInd = 1;
            segmentLength = 0;
            flag = true;
            segments = pathInfo.segments;
            if (currentLength < 0 && mask2.v.c) {
              if (pathInfo.tLength < Math.abs(currentLength)) {
                currentLength = -Math.abs(currentLength) % pathInfo.tLength;
              }
              segmentInd = segments.length - 1;
              points = segments[segmentInd].points;
              pointInd = points.length - 1;
              while (currentLength < 0) {
                currentLength += points[pointInd].partialLength;
                pointInd -= 1;
                if (pointInd < 0) {
                  segmentInd -= 1;
                  points = segments[segmentInd].points;
                  pointInd = points.length - 1;
                }
              }
            }
            points = segments[segmentInd].points;
            prevPoint = points[pointInd - 1];
            currentPoint = points[pointInd];
            partialLength = currentPoint.partialLength;
          }
          len = letters.length;
          xPos = 0;
          yPos = 0;
          var yOff = documentData.finalSize * 1.2 * 0.714;
          var firstLine = true;
          var animatorProps;
          var animatorSelector;
          var j3;
          var jLen;
          var letterValue;
          jLen = animators.length;
          var mult;
          var ind = -1;
          var offf;
          var xPathPos;
          var yPathPos;
          var initPathPos = currentLength;
          var initSegmentInd = segmentInd;
          var initPointInd = pointInd;
          var currentLine = -1;
          var elemOpacity;
          var sc;
          var sw;
          var fc;
          var k3;
          var letterSw;
          var letterSc;
          var letterFc;
          var letterM = "";
          var letterP = this.defaultPropsArray;
          var letterO;
          if (documentData.j === 2 || documentData.j === 1) {
            var animatorJustifyOffset = 0;
            var animatorFirstCharOffset = 0;
            var justifyOffsetMult = documentData.j === 2 ? -0.5 : -1;
            var lastIndex = 0;
            var isNewLine = true;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (letters[i3].n) {
                if (animatorJustifyOffset) {
                  animatorJustifyOffset += animatorFirstCharOffset;
                }
                while (lastIndex < i3) {
                  letters[lastIndex].animatorJustifyOffset = animatorJustifyOffset;
                  lastIndex += 1;
                }
                animatorJustifyOffset = 0;
                isNewLine = true;
              } else {
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  animatorProps = animators[j3].a;
                  if (animatorProps.t.propType) {
                    if (isNewLine && documentData.j === 2) {
                      animatorFirstCharOffset += animatorProps.t.v * justifyOffsetMult;
                    }
                    animatorSelector = animators[j3].s;
                    mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                    if (mult.length) {
                      animatorJustifyOffset += animatorProps.t.v * mult[0] * justifyOffsetMult;
                    } else {
                      animatorJustifyOffset += animatorProps.t.v * mult * justifyOffsetMult;
                    }
                  }
                }
                isNewLine = false;
              }
            }
            if (animatorJustifyOffset) {
              animatorJustifyOffset += animatorFirstCharOffset;
            }
            while (lastIndex < i3) {
              letters[lastIndex].animatorJustifyOffset = animatorJustifyOffset;
              lastIndex += 1;
            }
          }
          for (i3 = 0; i3 < len; i3 += 1) {
            matrixHelper.reset();
            elemOpacity = 1;
            if (letters[i3].n) {
              xPos = 0;
              yPos += documentData.yOffset;
              yPos += firstLine ? 1 : 0;
              currentLength = initPathPos;
              firstLine = false;
              if (this._hasMaskedPath) {
                segmentInd = initSegmentInd;
                pointInd = initPointInd;
                points = segments[segmentInd].points;
                prevPoint = points[pointInd - 1];
                currentPoint = points[pointInd];
                partialLength = currentPoint.partialLength;
                segmentLength = 0;
              }
              letterM = "";
              letterFc = "";
              letterSw = "";
              letterO = "";
              letterP = this.defaultPropsArray;
            } else {
              if (this._hasMaskedPath) {
                if (currentLine !== letters[i3].line) {
                  switch (documentData.j) {
                    case 1:
                      currentLength += totalLength - documentData.lineWidths[letters[i3].line];
                      break;
                    case 2:
                      currentLength += (totalLength - documentData.lineWidths[letters[i3].line]) / 2;
                      break;
                    default:
                      break;
                  }
                  currentLine = letters[i3].line;
                }
                if (ind !== letters[i3].ind) {
                  if (letters[ind]) {
                    currentLength += letters[ind].extra;
                  }
                  currentLength += letters[i3].an / 2;
                  ind = letters[i3].ind;
                }
                currentLength += alignment[0] * letters[i3].an * 5e-3;
                var animatorOffset = 0;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  animatorProps = animators[j3].a;
                  if (animatorProps.p.propType) {
                    animatorSelector = animators[j3].s;
                    mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                    if (mult.length) {
                      animatorOffset += animatorProps.p.v[0] * mult[0];
                    } else {
                      animatorOffset += animatorProps.p.v[0] * mult;
                    }
                  }
                  if (animatorProps.a.propType) {
                    animatorSelector = animators[j3].s;
                    mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                    if (mult.length) {
                      animatorOffset += animatorProps.a.v[0] * mult[0];
                    } else {
                      animatorOffset += animatorProps.a.v[0] * mult;
                    }
                  }
                }
                flag = true;
                if (this._pathData.a.v) {
                  currentLength = letters[0].an * 0.5 + (totalLength - this._pathData.f.v - letters[0].an * 0.5 - letters[letters.length - 1].an * 0.5) * ind / (len - 1);
                  currentLength += this._pathData.f.v;
                }
                while (flag) {
                  if (segmentLength + partialLength >= currentLength + animatorOffset || !points) {
                    perc = (currentLength + animatorOffset - segmentLength) / currentPoint.partialLength;
                    xPathPos = prevPoint.point[0] + (currentPoint.point[0] - prevPoint.point[0]) * perc;
                    yPathPos = prevPoint.point[1] + (currentPoint.point[1] - prevPoint.point[1]) * perc;
                    matrixHelper.translate(-alignment[0] * letters[i3].an * 5e-3, -(alignment[1] * yOff) * 0.01);
                    flag = false;
                  } else if (points) {
                    segmentLength += currentPoint.partialLength;
                    pointInd += 1;
                    if (pointInd >= points.length) {
                      pointInd = 0;
                      segmentInd += 1;
                      if (!segments[segmentInd]) {
                        if (mask2.v.c) {
                          pointInd = 0;
                          segmentInd = 0;
                          points = segments[segmentInd].points;
                        } else {
                          segmentLength -= currentPoint.partialLength;
                          points = null;
                        }
                      } else {
                        points = segments[segmentInd].points;
                      }
                    }
                    if (points) {
                      prevPoint = currentPoint;
                      currentPoint = points[pointInd];
                      partialLength = currentPoint.partialLength;
                    }
                  }
                }
                offf = letters[i3].an / 2 - letters[i3].add;
                matrixHelper.translate(-offf, 0, 0);
              } else {
                offf = letters[i3].an / 2 - letters[i3].add;
                matrixHelper.translate(-offf, 0, 0);
                matrixHelper.translate(-alignment[0] * letters[i3].an * 5e-3, -alignment[1] * yOff * 0.01, 0);
              }
              for (j3 = 0; j3 < jLen; j3 += 1) {
                animatorProps = animators[j3].a;
                if (animatorProps.t.propType) {
                  animatorSelector = animators[j3].s;
                  mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                  if (xPos !== 0 || documentData.j !== 0) {
                    if (this._hasMaskedPath) {
                      if (mult.length) {
                        currentLength += animatorProps.t.v * mult[0];
                      } else {
                        currentLength += animatorProps.t.v * mult;
                      }
                    } else if (mult.length) {
                      xPos += animatorProps.t.v * mult[0];
                    } else {
                      xPos += animatorProps.t.v * mult;
                    }
                  }
                }
              }
              if (documentData.strokeWidthAnim) {
                sw = documentData.sw || 0;
              }
              if (documentData.strokeColorAnim) {
                if (documentData.sc) {
                  sc = [documentData.sc[0], documentData.sc[1], documentData.sc[2]];
                } else {
                  sc = [0, 0, 0];
                }
              }
              if (documentData.fillColorAnim && documentData.fc) {
                fc = [documentData.fc[0], documentData.fc[1], documentData.fc[2]];
              }
              for (j3 = 0; j3 < jLen; j3 += 1) {
                animatorProps = animators[j3].a;
                if (animatorProps.a.propType) {
                  animatorSelector = animators[j3].s;
                  mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                  if (mult.length) {
                    matrixHelper.translate(-animatorProps.a.v[0] * mult[0], -animatorProps.a.v[1] * mult[1], animatorProps.a.v[2] * mult[2]);
                  } else {
                    matrixHelper.translate(-animatorProps.a.v[0] * mult, -animatorProps.a.v[1] * mult, animatorProps.a.v[2] * mult);
                  }
                }
              }
              for (j3 = 0; j3 < jLen; j3 += 1) {
                animatorProps = animators[j3].a;
                if (animatorProps.s.propType) {
                  animatorSelector = animators[j3].s;
                  mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                  if (mult.length) {
                    matrixHelper.scale(1 + (animatorProps.s.v[0] - 1) * mult[0], 1 + (animatorProps.s.v[1] - 1) * mult[1], 1);
                  } else {
                    matrixHelper.scale(1 + (animatorProps.s.v[0] - 1) * mult, 1 + (animatorProps.s.v[1] - 1) * mult, 1);
                  }
                }
              }
              for (j3 = 0; j3 < jLen; j3 += 1) {
                animatorProps = animators[j3].a;
                animatorSelector = animators[j3].s;
                mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                if (animatorProps.sk.propType) {
                  if (mult.length) {
                    matrixHelper.skewFromAxis(-animatorProps.sk.v * mult[0], animatorProps.sa.v * mult[1]);
                  } else {
                    matrixHelper.skewFromAxis(-animatorProps.sk.v * mult, animatorProps.sa.v * mult);
                  }
                }
                if (animatorProps.r.propType) {
                  if (mult.length) {
                    matrixHelper.rotateZ(-animatorProps.r.v * mult[2]);
                  } else {
                    matrixHelper.rotateZ(-animatorProps.r.v * mult);
                  }
                }
                if (animatorProps.ry.propType) {
                  if (mult.length) {
                    matrixHelper.rotateY(animatorProps.ry.v * mult[1]);
                  } else {
                    matrixHelper.rotateY(animatorProps.ry.v * mult);
                  }
                }
                if (animatorProps.rx.propType) {
                  if (mult.length) {
                    matrixHelper.rotateX(animatorProps.rx.v * mult[0]);
                  } else {
                    matrixHelper.rotateX(animatorProps.rx.v * mult);
                  }
                }
                if (animatorProps.o.propType) {
                  if (mult.length) {
                    elemOpacity += (animatorProps.o.v * mult[0] - elemOpacity) * mult[0];
                  } else {
                    elemOpacity += (animatorProps.o.v * mult - elemOpacity) * mult;
                  }
                }
                if (documentData.strokeWidthAnim && animatorProps.sw.propType) {
                  if (mult.length) {
                    sw += animatorProps.sw.v * mult[0];
                  } else {
                    sw += animatorProps.sw.v * mult;
                  }
                }
                if (documentData.strokeColorAnim && animatorProps.sc.propType) {
                  for (k3 = 0; k3 < 3; k3 += 1) {
                    if (mult.length) {
                      sc[k3] += (animatorProps.sc.v[k3] - sc[k3]) * mult[0];
                    } else {
                      sc[k3] += (animatorProps.sc.v[k3] - sc[k3]) * mult;
                    }
                  }
                }
                if (documentData.fillColorAnim && documentData.fc) {
                  if (animatorProps.fc.propType) {
                    for (k3 = 0; k3 < 3; k3 += 1) {
                      if (mult.length) {
                        fc[k3] += (animatorProps.fc.v[k3] - fc[k3]) * mult[0];
                      } else {
                        fc[k3] += (animatorProps.fc.v[k3] - fc[k3]) * mult;
                      }
                    }
                  }
                  if (animatorProps.fh.propType) {
                    if (mult.length) {
                      fc = addHueToRGB(fc, animatorProps.fh.v * mult[0]);
                    } else {
                      fc = addHueToRGB(fc, animatorProps.fh.v * mult);
                    }
                  }
                  if (animatorProps.fs.propType) {
                    if (mult.length) {
                      fc = addSaturationToRGB(fc, animatorProps.fs.v * mult[0]);
                    } else {
                      fc = addSaturationToRGB(fc, animatorProps.fs.v * mult);
                    }
                  }
                  if (animatorProps.fb.propType) {
                    if (mult.length) {
                      fc = addBrightnessToRGB(fc, animatorProps.fb.v * mult[0]);
                    } else {
                      fc = addBrightnessToRGB(fc, animatorProps.fb.v * mult);
                    }
                  }
                }
              }
              for (j3 = 0; j3 < jLen; j3 += 1) {
                animatorProps = animators[j3].a;
                if (animatorProps.p.propType) {
                  animatorSelector = animators[j3].s;
                  mult = animatorSelector.getMult(letters[i3].anIndexes[j3], textData.a[j3].s.totalChars);
                  if (this._hasMaskedPath) {
                    if (mult.length) {
                      matrixHelper.translate(0, animatorProps.p.v[1] * mult[0], -animatorProps.p.v[2] * mult[1]);
                    } else {
                      matrixHelper.translate(0, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                    }
                  } else if (mult.length) {
                    matrixHelper.translate(animatorProps.p.v[0] * mult[0], animatorProps.p.v[1] * mult[1], -animatorProps.p.v[2] * mult[2]);
                  } else {
                    matrixHelper.translate(animatorProps.p.v[0] * mult, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                  }
                }
              }
              if (documentData.strokeWidthAnim) {
                letterSw = sw < 0 ? 0 : sw;
              }
              if (documentData.strokeColorAnim) {
                letterSc = "rgb(" + Math.round(sc[0] * 255) + "," + Math.round(sc[1] * 255) + "," + Math.round(sc[2] * 255) + ")";
              }
              if (documentData.fillColorAnim && documentData.fc) {
                letterFc = "rgb(" + Math.round(fc[0] * 255) + "," + Math.round(fc[1] * 255) + "," + Math.round(fc[2] * 255) + ")";
              }
              if (this._hasMaskedPath) {
                matrixHelper.translate(0, -documentData.ls);
                matrixHelper.translate(0, alignment[1] * yOff * 0.01 + yPos, 0);
                if (this._pathData.p.v) {
                  tanAngle = (currentPoint.point[1] - prevPoint.point[1]) / (currentPoint.point[0] - prevPoint.point[0]);
                  var rot = Math.atan(tanAngle) * 180 / Math.PI;
                  if (currentPoint.point[0] < prevPoint.point[0]) {
                    rot += 180;
                  }
                  matrixHelper.rotate(-rot * Math.PI / 180);
                }
                matrixHelper.translate(xPathPos, yPathPos, 0);
                currentLength -= alignment[0] * letters[i3].an * 5e-3;
                if (letters[i3 + 1] && ind !== letters[i3 + 1].ind) {
                  currentLength += letters[i3].an / 2;
                  currentLength += documentData.tr * 1e-3 * documentData.finalSize;
                }
              } else {
                matrixHelper.translate(xPos, yPos, 0);
                if (documentData.ps) {
                  matrixHelper.translate(documentData.ps[0], documentData.ps[1] + documentData.ascent, 0);
                }
                switch (documentData.j) {
                  case 1:
                    matrixHelper.translate(letters[i3].animatorJustifyOffset + documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i3].line]), 0, 0);
                    break;
                  case 2:
                    matrixHelper.translate(letters[i3].animatorJustifyOffset + documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i3].line]) / 2, 0, 0);
                    break;
                  default:
                    break;
                }
                matrixHelper.translate(0, -documentData.ls);
                matrixHelper.translate(offf, 0, 0);
                matrixHelper.translate(alignment[0] * letters[i3].an * 5e-3, alignment[1] * yOff * 0.01, 0);
                xPos += letters[i3].l + documentData.tr * 1e-3 * documentData.finalSize;
              }
              if (renderType === "html") {
                letterM = matrixHelper.toCSS();
              } else if (renderType === "svg") {
                letterM = matrixHelper.to2dCSS();
              } else {
                letterP = [matrixHelper.props[0], matrixHelper.props[1], matrixHelper.props[2], matrixHelper.props[3], matrixHelper.props[4], matrixHelper.props[5], matrixHelper.props[6], matrixHelper.props[7], matrixHelper.props[8], matrixHelper.props[9], matrixHelper.props[10], matrixHelper.props[11], matrixHelper.props[12], matrixHelper.props[13], matrixHelper.props[14], matrixHelper.props[15]];
              }
              letterO = elemOpacity;
            }
            if (renderedLettersCount <= i3) {
              letterValue = new LetterProps(letterO, letterSw, letterSc, letterFc, letterM, letterP);
              this.renderedLetters.push(letterValue);
              renderedLettersCount += 1;
              this.lettersChangedFlag = true;
            } else {
              letterValue = this.renderedLetters[i3];
              this.lettersChangedFlag = letterValue.update(letterO, letterSw, letterSc, letterFc, letterM, letterP) || this.lettersChangedFlag;
            }
          }
        };
        TextAnimatorProperty.prototype.getValue = function() {
          if (this._elem.globalData.frameId === this._frameId) {
            return;
          }
          this._frameId = this._elem.globalData.frameId;
          this.iterateDynamicProperties();
        };
        TextAnimatorProperty.prototype.mHelper = new Matrix();
        TextAnimatorProperty.prototype.defaultPropsArray = [];
        extendPrototype([DynamicPropertyContainer], TextAnimatorProperty);
        function ITextElement() {
        }
        ITextElement.prototype.initElement = function(data2, globalData2, comp2) {
          this.lettersChangedFlag = true;
          this.initFrame();
          this.initBaseData(data2, globalData2, comp2);
          this.textProperty = new TextProperty(this, data2.t, this.dynamicProperties);
          this.textAnimator = new TextAnimatorProperty(data2.t, this.renderType, this);
          this.initTransform(data2, globalData2, comp2);
          this.initHierarchy();
          this.initRenderable();
          this.initRendererElement();
          this.createContainerElements();
          this.createRenderableComponents();
          this.createContent();
          this.hide();
          this.textAnimator.searchProperties(this.dynamicProperties);
        };
        ITextElement.prototype.prepareFrame = function(num) {
          this._mdf = false;
          this.prepareRenderableFrame(num);
          this.prepareProperties(num, this.isInRange);
        };
        ITextElement.prototype.createPathShape = function(matrixHelper, shapes) {
          var j3;
          var jLen = shapes.length;
          var pathNodes;
          var shapeStr = "";
          for (j3 = 0; j3 < jLen; j3 += 1) {
            if (shapes[j3].ty === "sh") {
              pathNodes = shapes[j3].ks.k;
              shapeStr += buildShapeString(pathNodes, pathNodes.i.length, true, matrixHelper);
            }
          }
          return shapeStr;
        };
        ITextElement.prototype.updateDocumentData = function(newData, index2) {
          this.textProperty.updateDocumentData(newData, index2);
        };
        ITextElement.prototype.canResizeFont = function(_canResize) {
          this.textProperty.canResizeFont(_canResize);
        };
        ITextElement.prototype.setMinimumFontSize = function(_fontSize) {
          this.textProperty.setMinimumFontSize(_fontSize);
        };
        ITextElement.prototype.applyTextPropertiesToMatrix = function(documentData, matrixHelper, lineNumber, xPos, yPos) {
          if (documentData.ps) {
            matrixHelper.translate(documentData.ps[0], documentData.ps[1] + documentData.ascent, 0);
          }
          matrixHelper.translate(0, -documentData.ls, 0);
          switch (documentData.j) {
            case 1:
              matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber]), 0, 0);
              break;
            case 2:
              matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber]) / 2, 0, 0);
              break;
            default:
              break;
          }
          matrixHelper.translate(xPos, yPos, 0);
        };
        ITextElement.prototype.buildColor = function(colorData) {
          return "rgb(" + Math.round(colorData[0] * 255) + "," + Math.round(colorData[1] * 255) + "," + Math.round(colorData[2] * 255) + ")";
        };
        ITextElement.prototype.emptyProp = new LetterProps();
        ITextElement.prototype.destroy = function() {
        };
        ITextElement.prototype.validateText = function() {
          if (this.textProperty._mdf || this.textProperty._isFirstFrame) {
            this.buildNewText();
            this.textProperty._isFirstFrame = false;
            this.textProperty._mdf = false;
          }
        };
        var emptyShapeData = {
          shapes: []
        };
        function SVGTextLottieElement(data2, globalData2, comp2) {
          this.textSpans = [];
          this.renderType = "svg";
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, SVGBaseElement, HierarchyElement, FrameElement, RenderableDOMElement, ITextElement], SVGTextLottieElement);
        SVGTextLottieElement.prototype.createContent = function() {
          if (this.data.singleShape && !this.globalData.fontManager.chars) {
            this.textContainer = createNS("text");
          }
        };
        SVGTextLottieElement.prototype.buildTextContents = function(textArray) {
          var i3 = 0;
          var len = textArray.length;
          var textContents = [];
          var currentTextContent = "";
          while (i3 < len) {
            if (textArray[i3] === String.fromCharCode(13) || textArray[i3] === String.fromCharCode(3)) {
              textContents.push(currentTextContent);
              currentTextContent = "";
            } else {
              currentTextContent += textArray[i3];
            }
            i3 += 1;
          }
          textContents.push(currentTextContent);
          return textContents;
        };
        SVGTextLottieElement.prototype.buildShapeData = function(data2, scale2) {
          if (data2.shapes && data2.shapes.length) {
            var shape = data2.shapes[0];
            if (shape.it) {
              var shapeItem = shape.it[shape.it.length - 1];
              if (shapeItem.s) {
                shapeItem.s.k[0] = scale2;
                shapeItem.s.k[1] = scale2;
              }
            }
          }
          return data2;
        };
        SVGTextLottieElement.prototype.buildNewText = function() {
          this.addDynamicProperty(this);
          var i3;
          var len;
          var documentData = this.textProperty.currentData;
          this.renderedLetters = createSizedArray(documentData ? documentData.l.length : 0);
          if (documentData.fc) {
            this.layerElement.setAttribute("fill", this.buildColor(documentData.fc));
          } else {
            this.layerElement.setAttribute("fill", "rgba(0,0,0,0)");
          }
          if (documentData.sc) {
            this.layerElement.setAttribute("stroke", this.buildColor(documentData.sc));
            this.layerElement.setAttribute("stroke-width", documentData.sw);
          }
          this.layerElement.setAttribute("font-size", documentData.finalSize);
          var fontData = this.globalData.fontManager.getFontByName(documentData.f);
          if (fontData.fClass) {
            this.layerElement.setAttribute("class", fontData.fClass);
          } else {
            this.layerElement.setAttribute("font-family", fontData.fFamily);
            var fWeight = documentData.fWeight;
            var fStyle = documentData.fStyle;
            this.layerElement.setAttribute("font-style", fStyle);
            this.layerElement.setAttribute("font-weight", fWeight);
          }
          this.layerElement.setAttribute("aria-label", documentData.t);
          var letters = documentData.l || [];
          var usesGlyphs = !!this.globalData.fontManager.chars;
          len = letters.length;
          var tSpan;
          var matrixHelper = this.mHelper;
          var shapeStr = "";
          var singleShape = this.data.singleShape;
          var xPos = 0;
          var yPos = 0;
          var firstLine = true;
          var trackingOffset = documentData.tr * 1e-3 * documentData.finalSize;
          if (singleShape && !usesGlyphs && !documentData.sz) {
            var tElement = this.textContainer;
            var justify = "start";
            switch (documentData.j) {
              case 1:
                justify = "end";
                break;
              case 2:
                justify = "middle";
                break;
              default:
                justify = "start";
                break;
            }
            tElement.setAttribute("text-anchor", justify);
            tElement.setAttribute("letter-spacing", trackingOffset);
            var textContent = this.buildTextContents(documentData.finalText);
            len = textContent.length;
            yPos = documentData.ps ? documentData.ps[1] + documentData.ascent : 0;
            for (i3 = 0; i3 < len; i3 += 1) {
              tSpan = this.textSpans[i3].span || createNS("tspan");
              tSpan.textContent = textContent[i3];
              tSpan.setAttribute("x", 0);
              tSpan.setAttribute("y", yPos);
              tSpan.style.display = "inherit";
              tElement.appendChild(tSpan);
              if (!this.textSpans[i3]) {
                this.textSpans[i3] = {
                  span: null,
                  glyph: null
                };
              }
              this.textSpans[i3].span = tSpan;
              yPos += documentData.finalLineHeight;
            }
            this.layerElement.appendChild(tElement);
          } else {
            var cachedSpansLength = this.textSpans.length;
            var charData;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (!this.textSpans[i3]) {
                this.textSpans[i3] = {
                  span: null,
                  childSpan: null,
                  glyph: null
                };
              }
              if (!usesGlyphs || !singleShape || i3 === 0) {
                tSpan = cachedSpansLength > i3 ? this.textSpans[i3].span : createNS(usesGlyphs ? "g" : "text");
                if (cachedSpansLength <= i3) {
                  tSpan.setAttribute("stroke-linecap", "butt");
                  tSpan.setAttribute("stroke-linejoin", "round");
                  tSpan.setAttribute("stroke-miterlimit", "4");
                  this.textSpans[i3].span = tSpan;
                  if (usesGlyphs) {
                    var childSpan = createNS("g");
                    tSpan.appendChild(childSpan);
                    this.textSpans[i3].childSpan = childSpan;
                  }
                  this.textSpans[i3].span = tSpan;
                  this.layerElement.appendChild(tSpan);
                }
                tSpan.style.display = "inherit";
              }
              matrixHelper.reset();
              if (singleShape) {
                if (letters[i3].n) {
                  xPos = -trackingOffset;
                  yPos += documentData.yOffset;
                  yPos += firstLine ? 1 : 0;
                  firstLine = false;
                }
                this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i3].line, xPos, yPos);
                xPos += letters[i3].l || 0;
                xPos += trackingOffset;
              }
              if (usesGlyphs) {
                charData = this.globalData.fontManager.getCharData(documentData.finalText[i3], fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
                var glyphElement;
                if (charData.t === 1) {
                  glyphElement = new SVGCompElement(charData.data, this.globalData, this);
                } else {
                  var data2 = emptyShapeData;
                  if (charData.data && charData.data.shapes) {
                    data2 = this.buildShapeData(charData.data, documentData.finalSize);
                  }
                  glyphElement = new SVGShapeElement(data2, this.globalData, this);
                }
                if (this.textSpans[i3].glyph) {
                  var glyph = this.textSpans[i3].glyph;
                  this.textSpans[i3].childSpan.removeChild(glyph.layerElement);
                  glyph.destroy();
                }
                this.textSpans[i3].glyph = glyphElement;
                glyphElement._debug = true;
                glyphElement.prepareFrame(0);
                glyphElement.renderFrame();
                this.textSpans[i3].childSpan.appendChild(glyphElement.layerElement);
                if (charData.t === 1) {
                  this.textSpans[i3].childSpan.setAttribute("transform", "scale(" + documentData.finalSize / 100 + "," + documentData.finalSize / 100 + ")");
                }
              } else {
                if (singleShape) {
                  tSpan.setAttribute("transform", "translate(" + matrixHelper.props[12] + "," + matrixHelper.props[13] + ")");
                }
                tSpan.textContent = letters[i3].val;
                tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
              }
            }
            if (singleShape && tSpan) {
              tSpan.setAttribute("d", shapeStr);
            }
          }
          while (i3 < this.textSpans.length) {
            this.textSpans[i3].span.style.display = "none";
            i3 += 1;
          }
          this._sizeChanged = true;
        };
        SVGTextLottieElement.prototype.sourceRectAtTime = function() {
          this.prepareFrame(this.comp.renderedFrame - this.data.st);
          this.renderInnerContent();
          if (this._sizeChanged) {
            this._sizeChanged = false;
            var textBox = this.layerElement.getBBox();
            this.bbox = {
              top: textBox.y,
              left: textBox.x,
              width: textBox.width,
              height: textBox.height
            };
          }
          return this.bbox;
        };
        SVGTextLottieElement.prototype.getValue = function() {
          var i3;
          var len = this.textSpans.length;
          var glyphElement;
          this.renderedFrame = this.comp.renderedFrame;
          for (i3 = 0; i3 < len; i3 += 1) {
            glyphElement = this.textSpans[i3].glyph;
            if (glyphElement) {
              glyphElement.prepareFrame(this.comp.renderedFrame - this.data.st);
              if (glyphElement._mdf) {
                this._mdf = true;
              }
            }
          }
        };
        SVGTextLottieElement.prototype.renderInnerContent = function() {
          this.validateText();
          if (!this.data.singleShape || this._mdf) {
            this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
            if (this.lettersChangedFlag || this.textAnimator.lettersChangedFlag) {
              this._sizeChanged = true;
              var i3;
              var len;
              var renderedLetters = this.textAnimator.renderedLetters;
              var letters = this.textProperty.currentData.l;
              len = letters.length;
              var renderedLetter;
              var textSpan;
              var glyphElement;
              for (i3 = 0; i3 < len; i3 += 1) {
                if (!letters[i3].n) {
                  renderedLetter = renderedLetters[i3];
                  textSpan = this.textSpans[i3].span;
                  glyphElement = this.textSpans[i3].glyph;
                  if (glyphElement) {
                    glyphElement.renderFrame();
                  }
                  if (renderedLetter._mdf.m) {
                    textSpan.setAttribute("transform", renderedLetter.m);
                  }
                  if (renderedLetter._mdf.o) {
                    textSpan.setAttribute("opacity", renderedLetter.o);
                  }
                  if (renderedLetter._mdf.sw) {
                    textSpan.setAttribute("stroke-width", renderedLetter.sw);
                  }
                  if (renderedLetter._mdf.sc) {
                    textSpan.setAttribute("stroke", renderedLetter.sc);
                  }
                  if (renderedLetter._mdf.fc) {
                    textSpan.setAttribute("fill", renderedLetter.fc);
                  }
                }
              }
            }
          }
        };
        function ISolidElement(data2, globalData2, comp2) {
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([IImageElement], ISolidElement);
        ISolidElement.prototype.createContent = function() {
          var rect = createNS("rect");
          rect.setAttribute("width", this.data.sw);
          rect.setAttribute("height", this.data.sh);
          rect.setAttribute("fill", this.data.sc);
          this.layerElement.appendChild(rect);
        };
        function NullElement(data2, globalData2, comp2) {
          this.initFrame();
          this.initBaseData(data2, globalData2, comp2);
          this.initFrame();
          this.initTransform(data2, globalData2, comp2);
          this.initHierarchy();
        }
        NullElement.prototype.prepareFrame = function(num) {
          this.prepareProperties(num, true);
        };
        NullElement.prototype.renderFrame = function() {
        };
        NullElement.prototype.getBaseElement = function() {
          return null;
        };
        NullElement.prototype.destroy = function() {
        };
        NullElement.prototype.sourceRectAtTime = function() {
        };
        NullElement.prototype.hide = function() {
        };
        extendPrototype([BaseElement, TransformElement, HierarchyElement, FrameElement], NullElement);
        function SVGRendererBase() {
        }
        extendPrototype([BaseRenderer], SVGRendererBase);
        SVGRendererBase.prototype.createNull = function(data2) {
          return new NullElement(data2, this.globalData, this);
        };
        SVGRendererBase.prototype.createShape = function(data2) {
          return new SVGShapeElement(data2, this.globalData, this);
        };
        SVGRendererBase.prototype.createText = function(data2) {
          return new SVGTextLottieElement(data2, this.globalData, this);
        };
        SVGRendererBase.prototype.createImage = function(data2) {
          return new IImageElement(data2, this.globalData, this);
        };
        SVGRendererBase.prototype.createSolid = function(data2) {
          return new ISolidElement(data2, this.globalData, this);
        };
        SVGRendererBase.prototype.configAnimation = function(animData) {
          this.svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          this.svgElement.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
          if (this.renderConfig.viewBoxSize) {
            this.svgElement.setAttribute("viewBox", this.renderConfig.viewBoxSize);
          } else {
            this.svgElement.setAttribute("viewBox", "0 0 " + animData.w + " " + animData.h);
          }
          if (!this.renderConfig.viewBoxOnly) {
            this.svgElement.setAttribute("width", animData.w);
            this.svgElement.setAttribute("height", animData.h);
            this.svgElement.style.width = "100%";
            this.svgElement.style.height = "100%";
            this.svgElement.style.transform = "translate3d(0,0,0)";
            this.svgElement.style.contentVisibility = this.renderConfig.contentVisibility;
          }
          if (this.renderConfig.width) {
            this.svgElement.setAttribute("width", this.renderConfig.width);
          }
          if (this.renderConfig.height) {
            this.svgElement.setAttribute("height", this.renderConfig.height);
          }
          if (this.renderConfig.className) {
            this.svgElement.setAttribute("class", this.renderConfig.className);
          }
          if (this.renderConfig.id) {
            this.svgElement.setAttribute("id", this.renderConfig.id);
          }
          if (this.renderConfig.focusable !== void 0) {
            this.svgElement.setAttribute("focusable", this.renderConfig.focusable);
          }
          this.svgElement.setAttribute("preserveAspectRatio", this.renderConfig.preserveAspectRatio);
          this.animationItem.wrapper.appendChild(this.svgElement);
          var defs = this.globalData.defs;
          this.setupGlobalData(animData, defs);
          this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
          this.data = animData;
          var maskElement = createNS("clipPath");
          var rect = createNS("rect");
          rect.setAttribute("width", animData.w);
          rect.setAttribute("height", animData.h);
          rect.setAttribute("x", 0);
          rect.setAttribute("y", 0);
          var maskId = createElementID();
          maskElement.setAttribute("id", maskId);
          maskElement.appendChild(rect);
          this.layerElement.setAttribute("clip-path", "url(" + getLocationHref() + "#" + maskId + ")");
          defs.appendChild(maskElement);
          this.layers = animData.layers;
          this.elements = createSizedArray(animData.layers.length);
        };
        SVGRendererBase.prototype.destroy = function() {
          if (this.animationItem.wrapper) {
            this.animationItem.wrapper.innerText = "";
          }
          this.layerElement = null;
          this.globalData.defs = null;
          var i3;
          var len = this.layers ? this.layers.length : 0;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.elements[i3] && this.elements[i3].destroy) {
              this.elements[i3].destroy();
            }
          }
          this.elements.length = 0;
          this.destroyed = true;
          this.animationItem = null;
        };
        SVGRendererBase.prototype.updateContainerSize = function() {
        };
        SVGRendererBase.prototype.findIndexByInd = function(ind) {
          var i3 = 0;
          var len = this.layers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.layers[i3].ind === ind) {
              return i3;
            }
          }
          return -1;
        };
        SVGRendererBase.prototype.buildItem = function(pos) {
          var elements = this.elements;
          if (elements[pos] || this.layers[pos].ty === 99) {
            return;
          }
          elements[pos] = true;
          var element = this.createItem(this.layers[pos]);
          elements[pos] = element;
          if (getExpressionsPlugin()) {
            if (this.layers[pos].ty === 0) {
              this.globalData.projectInterface.registerComposition(element);
            }
            element.initExpressions();
          }
          this.appendElementInPos(element, pos);
          if (this.layers[pos].tt) {
            var elementIndex = "tp" in this.layers[pos] ? this.findIndexByInd(this.layers[pos].tp) : pos - 1;
            if (elementIndex === -1) {
              return;
            }
            if (!this.elements[elementIndex] || this.elements[elementIndex] === true) {
              this.buildItem(elementIndex);
              this.addPendingElement(element);
            } else {
              var matteElement = elements[elementIndex];
              var matteMask = matteElement.getMatte(this.layers[pos].tt);
              element.setMatte(matteMask);
            }
          }
        };
        SVGRendererBase.prototype.checkPendingElements = function() {
          while (this.pendingElements.length) {
            var element = this.pendingElements.pop();
            element.checkParenting();
            if (element.data.tt) {
              var i3 = 0;
              var len = this.elements.length;
              while (i3 < len) {
                if (this.elements[i3] === element) {
                  var elementIndex = "tp" in element.data ? this.findIndexByInd(element.data.tp) : i3 - 1;
                  var matteElement = this.elements[elementIndex];
                  var matteMask = matteElement.getMatte(this.layers[i3].tt);
                  element.setMatte(matteMask);
                  break;
                }
                i3 += 1;
              }
            }
          }
        };
        SVGRendererBase.prototype.renderFrame = function(num) {
          if (this.renderedFrame === num || this.destroyed) {
            return;
          }
          if (num === null) {
            num = this.renderedFrame;
          } else {
            this.renderedFrame = num;
          }
          this.globalData.frameNum = num;
          this.globalData.frameId += 1;
          this.globalData.projectInterface.currentFrame = num;
          this.globalData._mdf = false;
          var i3;
          var len = this.layers.length;
          if (!this.completeLayers) {
            this.checkLayers(num);
          }
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.completeLayers || this.elements[i3]) {
              this.elements[i3].prepareFrame(num - this.layers[i3].st);
            }
          }
          if (this.globalData._mdf) {
            for (i3 = 0; i3 < len; i3 += 1) {
              if (this.completeLayers || this.elements[i3]) {
                this.elements[i3].renderFrame();
              }
            }
          }
        };
        SVGRendererBase.prototype.appendElementInPos = function(element, pos) {
          var newElement = element.getBaseElement();
          if (!newElement) {
            return;
          }
          var i3 = 0;
          var nextElement;
          while (i3 < pos) {
            if (this.elements[i3] && this.elements[i3] !== true && this.elements[i3].getBaseElement()) {
              nextElement = this.elements[i3].getBaseElement();
            }
            i3 += 1;
          }
          if (nextElement) {
            this.layerElement.insertBefore(newElement, nextElement);
          } else {
            this.layerElement.appendChild(newElement);
          }
        };
        SVGRendererBase.prototype.hide = function() {
          this.layerElement.style.display = "none";
        };
        SVGRendererBase.prototype.show = function() {
          this.layerElement.style.display = "block";
        };
        function ICompElement() {
        }
        extendPrototype([BaseElement, TransformElement, HierarchyElement, FrameElement, RenderableDOMElement], ICompElement);
        ICompElement.prototype.initElement = function(data2, globalData2, comp2) {
          this.initFrame();
          this.initBaseData(data2, globalData2, comp2);
          this.initTransform(data2, globalData2, comp2);
          this.initRenderable();
          this.initHierarchy();
          this.initRendererElement();
          this.createContainerElements();
          this.createRenderableComponents();
          if (this.data.xt || !globalData2.progressiveLoad) {
            this.buildAllItems();
          }
          this.hide();
        };
        ICompElement.prototype.prepareFrame = function(num) {
          this._mdf = false;
          this.prepareRenderableFrame(num);
          this.prepareProperties(num, this.isInRange);
          if (!this.isInRange && !this.data.xt) {
            return;
          }
          if (!this.tm._placeholder) {
            var timeRemapped = this.tm.v;
            if (timeRemapped === this.data.op) {
              timeRemapped = this.data.op - 1;
            }
            this.renderedFrame = timeRemapped;
          } else {
            this.renderedFrame = num / this.data.sr;
          }
          var i3;
          var len = this.elements.length;
          if (!this.completeLayers) {
            this.checkLayers(this.renderedFrame);
          }
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.completeLayers || this.elements[i3]) {
              this.elements[i3].prepareFrame(this.renderedFrame - this.layers[i3].st);
              if (this.elements[i3]._mdf) {
                this._mdf = true;
              }
            }
          }
        };
        ICompElement.prototype.renderInnerContent = function() {
          var i3;
          var len = this.layers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.completeLayers || this.elements[i3]) {
              this.elements[i3].renderFrame();
            }
          }
        };
        ICompElement.prototype.setElements = function(elems) {
          this.elements = elems;
        };
        ICompElement.prototype.getElements = function() {
          return this.elements;
        };
        ICompElement.prototype.destroyElements = function() {
          var i3;
          var len = this.layers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.elements[i3]) {
              this.elements[i3].destroy();
            }
          }
        };
        ICompElement.prototype.destroy = function() {
          this.destroyElements();
          this.destroyBaseElement();
        };
        function SVGCompElement(data2, globalData2, comp2) {
          this.layers = data2.layers;
          this.supports3d = true;
          this.completeLayers = false;
          this.pendingElements = [];
          this.elements = this.layers ? createSizedArray(this.layers.length) : [];
          this.initElement(data2, globalData2, comp2);
          this.tm = data2.tm ? PropertyFactory.getProp(this, data2.tm, 0, globalData2.frameRate, this) : {
            _placeholder: true
          };
        }
        extendPrototype([SVGRendererBase, ICompElement, SVGBaseElement], SVGCompElement);
        SVGCompElement.prototype.createComp = function(data2) {
          return new SVGCompElement(data2, this.globalData, this);
        };
        function SVGRenderer(animationItem, config) {
          this.animationItem = animationItem;
          this.layers = null;
          this.renderedFrame = -1;
          this.svgElement = createNS("svg");
          var ariaLabel = "";
          if (config && config.title) {
            var titleElement = createNS("title");
            var titleId = createElementID();
            titleElement.setAttribute("id", titleId);
            titleElement.textContent = config.title;
            this.svgElement.appendChild(titleElement);
            ariaLabel += titleId;
          }
          if (config && config.description) {
            var descElement = createNS("desc");
            var descId = createElementID();
            descElement.setAttribute("id", descId);
            descElement.textContent = config.description;
            this.svgElement.appendChild(descElement);
            ariaLabel += " " + descId;
          }
          if (ariaLabel) {
            this.svgElement.setAttribute("aria-labelledby", ariaLabel);
          }
          var defs = createNS("defs");
          this.svgElement.appendChild(defs);
          var maskElement = createNS("g");
          this.svgElement.appendChild(maskElement);
          this.layerElement = maskElement;
          this.renderConfig = {
            preserveAspectRatio: config && config.preserveAspectRatio || "xMidYMid meet",
            imagePreserveAspectRatio: config && config.imagePreserveAspectRatio || "xMidYMid slice",
            contentVisibility: config && config.contentVisibility || "visible",
            progressiveLoad: config && config.progressiveLoad || false,
            hideOnTransparent: !(config && config.hideOnTransparent === false),
            viewBoxOnly: config && config.viewBoxOnly || false,
            viewBoxSize: config && config.viewBoxSize || false,
            className: config && config.className || "",
            id: config && config.id || "",
            focusable: config && config.focusable,
            filterSize: {
              width: config && config.filterSize && config.filterSize.width || "100%",
              height: config && config.filterSize && config.filterSize.height || "100%",
              x: config && config.filterSize && config.filterSize.x || "0%",
              y: config && config.filterSize && config.filterSize.y || "0%"
            },
            width: config && config.width,
            height: config && config.height,
            runExpressions: !config || config.runExpressions === void 0 || config.runExpressions
          };
          this.globalData = {
            _mdf: false,
            frameNum: -1,
            defs,
            renderConfig: this.renderConfig
          };
          this.elements = [];
          this.pendingElements = [];
          this.destroyed = false;
          this.rendererType = "svg";
        }
        extendPrototype([SVGRendererBase], SVGRenderer);
        SVGRenderer.prototype.createComp = function(data2) {
          return new SVGCompElement(data2, this.globalData, this);
        };
        function ShapeTransformManager() {
          this.sequences = {};
          this.sequenceList = [];
          this.transform_key_count = 0;
        }
        ShapeTransformManager.prototype = {
          addTransformSequence: function addTransformSequence(transforms) {
            var i3;
            var len = transforms.length;
            var key2 = "_";
            for (i3 = 0; i3 < len; i3 += 1) {
              key2 += transforms[i3].transform.key + "_";
            }
            var sequence = this.sequences[key2];
            if (!sequence) {
              sequence = {
                transforms: [].concat(transforms),
                finalTransform: new Matrix(),
                _mdf: false
              };
              this.sequences[key2] = sequence;
              this.sequenceList.push(sequence);
            }
            return sequence;
          },
          processSequence: function processSequence(sequence, isFirstFrame) {
            var i3 = 0;
            var len = sequence.transforms.length;
            var _mdf = isFirstFrame;
            while (i3 < len && !isFirstFrame) {
              if (sequence.transforms[i3].transform.mProps._mdf) {
                _mdf = true;
                break;
              }
              i3 += 1;
            }
            if (_mdf) {
              sequence.finalTransform.reset();
              for (i3 = len - 1; i3 >= 0; i3 -= 1) {
                sequence.finalTransform.multiply(sequence.transforms[i3].transform.mProps.v);
              }
            }
            sequence._mdf = _mdf;
          },
          processSequences: function processSequences(isFirstFrame) {
            var i3;
            var len = this.sequenceList.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.processSequence(this.sequenceList[i3], isFirstFrame);
            }
          },
          getNewKey: function getNewKey() {
            this.transform_key_count += 1;
            return "_" + this.transform_key_count;
          }
        };
        var lumaLoader = function lumaLoader2() {
          var id = "__lottie_element_luma_buffer";
          var lumaBuffer = null;
          var lumaBufferCtx = null;
          var svg = null;
          function createLumaSvgFilter() {
            var _svg = createNS("svg");
            var fil = createNS("filter");
            var matrix = createNS("feColorMatrix");
            fil.setAttribute("id", id);
            matrix.setAttribute("type", "matrix");
            matrix.setAttribute("color-interpolation-filters", "sRGB");
            matrix.setAttribute("values", "0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0");
            fil.appendChild(matrix);
            _svg.appendChild(fil);
            _svg.setAttribute("id", id + "_svg");
            if (featureSupport.svgLumaHidden) {
              _svg.style.display = "none";
            }
            return _svg;
          }
          function loadLuma() {
            if (!lumaBuffer) {
              svg = createLumaSvgFilter();
              document.body.appendChild(svg);
              lumaBuffer = createTag("canvas");
              lumaBufferCtx = lumaBuffer.getContext("2d");
              lumaBufferCtx.filter = "url(#" + id + ")";
              lumaBufferCtx.fillStyle = "rgba(0,0,0,0)";
              lumaBufferCtx.fillRect(0, 0, 1, 1);
            }
          }
          function getLuma(canvas) {
            if (!lumaBuffer) {
              loadLuma();
            }
            lumaBuffer.width = canvas.width;
            lumaBuffer.height = canvas.height;
            lumaBufferCtx.filter = "url(#" + id + ")";
            return lumaBuffer;
          }
          return {
            load: loadLuma,
            get: getLuma
          };
        };
        function createCanvas(width2, height2) {
          if (featureSupport.offscreenCanvas) {
            return new OffscreenCanvas(width2, height2);
          }
          var canvas = createTag("canvas");
          canvas.width = width2;
          canvas.height = height2;
          return canvas;
        }
        var assetLoader = (function() {
          return {
            loadLumaCanvas: lumaLoader.load,
            getLumaCanvas: lumaLoader.get,
            createCanvas
          };
        })();
        var registeredEffects = {};
        function CVEffects(elem2) {
          var i3;
          var len = elem2.data.ef ? elem2.data.ef.length : 0;
          this.filters = [];
          var filterManager;
          for (i3 = 0; i3 < len; i3 += 1) {
            filterManager = null;
            var type = elem2.data.ef[i3].ty;
            if (registeredEffects[type]) {
              var Effect = registeredEffects[type].effect;
              filterManager = new Effect(elem2.effectsManager.effectElements[i3], elem2);
            }
            if (filterManager) {
              this.filters.push(filterManager);
            }
          }
          if (this.filters.length) {
            elem2.addRenderableComponent(this);
          }
        }
        CVEffects.prototype.renderFrame = function(_isFirstFrame) {
          var i3;
          var len = this.filters.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.filters[i3].renderFrame(_isFirstFrame);
          }
        };
        CVEffects.prototype.getEffects = function(type) {
          var i3;
          var len = this.filters.length;
          var effects = [];
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.filters[i3].type === type) {
              effects.push(this.filters[i3]);
            }
          }
          return effects;
        };
        function registerEffect(id, effect2) {
          registeredEffects[id] = {
            effect: effect2
          };
        }
        function CVMaskElement(data2, element) {
          this.data = data2;
          this.element = element;
          this.masksProperties = this.data.masksProperties || [];
          this.viewData = createSizedArray(this.masksProperties.length);
          var i3;
          var len = this.masksProperties.length;
          var hasMasks = false;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.masksProperties[i3].mode !== "n") {
              hasMasks = true;
            }
            this.viewData[i3] = ShapePropertyFactory.getShapeProp(this.element, this.masksProperties[i3], 3);
          }
          this.hasMasks = hasMasks;
          if (hasMasks) {
            this.element.addRenderableComponent(this);
          }
        }
        CVMaskElement.prototype.renderFrame = function() {
          if (!this.hasMasks) {
            return;
          }
          var transform2 = this.element.finalTransform.mat;
          var ctx = this.element.canvasContext;
          var i3;
          var len = this.masksProperties.length;
          var pt;
          var pts;
          var data2;
          ctx.beginPath();
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.masksProperties[i3].mode !== "n") {
              if (this.masksProperties[i3].inv) {
                ctx.moveTo(0, 0);
                ctx.lineTo(this.element.globalData.compSize.w, 0);
                ctx.lineTo(this.element.globalData.compSize.w, this.element.globalData.compSize.h);
                ctx.lineTo(0, this.element.globalData.compSize.h);
                ctx.lineTo(0, 0);
              }
              data2 = this.viewData[i3].v;
              pt = transform2.applyToPointArray(data2.v[0][0], data2.v[0][1], 0);
              ctx.moveTo(pt[0], pt[1]);
              var j3;
              var jLen = data2._length;
              for (j3 = 1; j3 < jLen; j3 += 1) {
                pts = transform2.applyToTriplePoints(data2.o[j3 - 1], data2.i[j3], data2.v[j3]);
                ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
              }
              pts = transform2.applyToTriplePoints(data2.o[j3 - 1], data2.i[0], data2.v[0]);
              ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
            }
          }
          this.element.globalData.renderer.save(true);
          ctx.clip();
        };
        CVMaskElement.prototype.getMaskProperty = MaskElement.prototype.getMaskProperty;
        CVMaskElement.prototype.destroy = function() {
          this.element = null;
        };
        function CVBaseElement() {
        }
        var operationsMap = {
          1: "source-in",
          2: "source-out",
          3: "source-in",
          4: "source-out"
        };
        CVBaseElement.prototype = {
          createElements: function createElements() {
          },
          initRendererElement: function initRendererElement() {
          },
          createContainerElements: function createContainerElements() {
            if (this.data.tt >= 1) {
              this.buffers = [];
              var canvasContext = this.globalData.canvasContext;
              var bufferCanvas = assetLoader.createCanvas(canvasContext.canvas.width, canvasContext.canvas.height);
              this.buffers.push(bufferCanvas);
              var bufferCanvas2 = assetLoader.createCanvas(canvasContext.canvas.width, canvasContext.canvas.height);
              this.buffers.push(bufferCanvas2);
              if (this.data.tt >= 3 && !document._isProxy) {
                assetLoader.loadLumaCanvas();
              }
            }
            this.canvasContext = this.globalData.canvasContext;
            this.transformCanvas = this.globalData.transformCanvas;
            this.renderableEffectsManager = new CVEffects(this);
            this.searchEffectTransforms();
          },
          createContent: function createContent() {
          },
          setBlendMode: function setBlendMode() {
            var globalData2 = this.globalData;
            if (globalData2.blendMode !== this.data.bm) {
              globalData2.blendMode = this.data.bm;
              var blendModeValue = getBlendMode(this.data.bm);
              globalData2.canvasContext.globalCompositeOperation = blendModeValue;
            }
          },
          createRenderableComponents: function createRenderableComponents() {
            this.maskManager = new CVMaskElement(this.data, this);
            this.transformEffects = this.renderableEffectsManager.getEffects(effectTypes.TRANSFORM_EFFECT);
          },
          hideElement: function hideElement() {
            if (!this.hidden && (!this.isInRange || this.isTransparent)) {
              this.hidden = true;
            }
          },
          showElement: function showElement() {
            if (this.isInRange && !this.isTransparent) {
              this.hidden = false;
              this._isFirstFrame = true;
              this.maskManager._isFirstFrame = true;
            }
          },
          clearCanvas: function clearCanvas(canvasContext) {
            canvasContext.clearRect(this.transformCanvas.tx, this.transformCanvas.ty, this.transformCanvas.w * this.transformCanvas.sx, this.transformCanvas.h * this.transformCanvas.sy);
          },
          prepareLayer: function prepareLayer() {
            if (this.data.tt >= 1) {
              var buffer = this.buffers[0];
              var bufferCtx = buffer.getContext("2d");
              this.clearCanvas(bufferCtx);
              bufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
              this.currentTransform = this.canvasContext.getTransform();
              this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
              this.clearCanvas(this.canvasContext);
              this.canvasContext.setTransform(this.currentTransform);
            }
          },
          exitLayer: function exitLayer() {
            if (this.data.tt >= 1) {
              var buffer = this.buffers[1];
              var bufferCtx = buffer.getContext("2d");
              this.clearCanvas(bufferCtx);
              bufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
              this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
              this.clearCanvas(this.canvasContext);
              this.canvasContext.setTransform(this.currentTransform);
              var mask2 = this.comp.getElementById("tp" in this.data ? this.data.tp : this.data.ind - 1);
              mask2.renderFrame(true);
              this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
              if (this.data.tt >= 3 && !document._isProxy) {
                var lumaBuffer = assetLoader.getLumaCanvas(this.canvasContext.canvas);
                var lumaBufferCtx = lumaBuffer.getContext("2d");
                lumaBufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
                this.clearCanvas(this.canvasContext);
                this.canvasContext.drawImage(lumaBuffer, 0, 0);
              }
              this.canvasContext.globalCompositeOperation = operationsMap[this.data.tt];
              this.canvasContext.drawImage(buffer, 0, 0);
              this.canvasContext.globalCompositeOperation = "destination-over";
              this.canvasContext.drawImage(this.buffers[0], 0, 0);
              this.canvasContext.setTransform(this.currentTransform);
              this.canvasContext.globalCompositeOperation = "source-over";
            }
          },
          renderFrame: function renderFrame(forceRender) {
            if (this.hidden || this.data.hd) {
              return;
            }
            if (this.data.td === 1 && !forceRender) {
              return;
            }
            this.renderTransform();
            this.renderRenderable();
            this.renderLocalTransform();
            this.setBlendMode();
            var forceRealStack = this.data.ty === 0;
            this.prepareLayer();
            this.globalData.renderer.save(forceRealStack);
            this.globalData.renderer.ctxTransform(this.finalTransform.localMat.props);
            this.globalData.renderer.ctxOpacity(this.finalTransform.localOpacity);
            this.renderInnerContent();
            this.globalData.renderer.restore(forceRealStack);
            this.exitLayer();
            if (this.maskManager.hasMasks) {
              this.globalData.renderer.restore(true);
            }
            if (this._isFirstFrame) {
              this._isFirstFrame = false;
            }
          },
          destroy: function destroy() {
            this.canvasContext = null;
            this.data = null;
            this.globalData = null;
            this.maskManager.destroy();
          },
          mHelper: new Matrix()
        };
        CVBaseElement.prototype.hide = CVBaseElement.prototype.hideElement;
        CVBaseElement.prototype.show = CVBaseElement.prototype.showElement;
        function CVShapeData(element, data2, styles, transformsManager) {
          this.styledShapes = [];
          this.tr = [0, 0, 0, 0, 0, 0];
          var ty = 4;
          if (data2.ty === "rc") {
            ty = 5;
          } else if (data2.ty === "el") {
            ty = 6;
          } else if (data2.ty === "sr") {
            ty = 7;
          }
          this.sh = ShapePropertyFactory.getShapeProp(element, data2, ty, element);
          var i3;
          var len = styles.length;
          var styledShape;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (!styles[i3].closed) {
              styledShape = {
                transforms: transformsManager.addTransformSequence(styles[i3].transforms),
                trNodes: []
              };
              this.styledShapes.push(styledShape);
              styles[i3].elements.push(styledShape);
            }
          }
        }
        CVShapeData.prototype.setAsAnimated = SVGShapeData.prototype.setAsAnimated;
        function CVShapeElement(data2, globalData2, comp2) {
          this.shapes = [];
          this.shapesData = data2.shapes;
          this.stylesList = [];
          this.itemsData = [];
          this.prevViewData = [];
          this.shapeModifiers = [];
          this.processedElements = [];
          this.transformsManager = new ShapeTransformManager();
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, CVBaseElement, IShapeElement, HierarchyElement, FrameElement, RenderableElement], CVShapeElement);
        CVShapeElement.prototype.initElement = RenderableDOMElement.prototype.initElement;
        CVShapeElement.prototype.transformHelper = {
          opacity: 1,
          _opMdf: false
        };
        CVShapeElement.prototype.dashResetter = [];
        CVShapeElement.prototype.createContent = function() {
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, true, []);
        };
        CVShapeElement.prototype.createStyleElement = function(data2, transforms) {
          var styleElem = {
            data: data2,
            type: data2.ty,
            preTransforms: this.transformsManager.addTransformSequence(transforms),
            transforms: [],
            elements: [],
            closed: data2.hd === true
          };
          var elementData = {};
          if (data2.ty === "fl" || data2.ty === "st") {
            elementData.c = PropertyFactory.getProp(this, data2.c, 1, 255, this);
            if (!elementData.c.k) {
              styleElem.co = "rgb(" + bmFloor(elementData.c.v[0]) + "," + bmFloor(elementData.c.v[1]) + "," + bmFloor(elementData.c.v[2]) + ")";
            }
          } else if (data2.ty === "gf" || data2.ty === "gs") {
            elementData.s = PropertyFactory.getProp(this, data2.s, 1, null, this);
            elementData.e = PropertyFactory.getProp(this, data2.e, 1, null, this);
            elementData.h = PropertyFactory.getProp(this, data2.h || {
              k: 0
            }, 0, 0.01, this);
            elementData.a = PropertyFactory.getProp(this, data2.a || {
              k: 0
            }, 0, degToRads, this);
            elementData.g = new GradientProperty(this, data2.g, this);
          }
          elementData.o = PropertyFactory.getProp(this, data2.o, 0, 0.01, this);
          if (data2.ty === "st" || data2.ty === "gs") {
            styleElem.lc = lineCapEnum[data2.lc || 2];
            styleElem.lj = lineJoinEnum[data2.lj || 2];
            if (data2.lj == 1) {
              styleElem.ml = data2.ml;
            }
            elementData.w = PropertyFactory.getProp(this, data2.w, 0, null, this);
            if (!elementData.w.k) {
              styleElem.wi = elementData.w.v;
            }
            if (data2.d) {
              var d3 = new DashProperty(this, data2.d, "canvas", this);
              elementData.d = d3;
              if (!elementData.d.k) {
                styleElem.da = elementData.d.dashArray;
                styleElem["do"] = elementData.d.dashoffset[0];
              }
            }
          } else {
            styleElem.r = data2.r === 2 ? "evenodd" : "nonzero";
          }
          this.stylesList.push(styleElem);
          elementData.style = styleElem;
          return elementData;
        };
        CVShapeElement.prototype.createGroupElement = function() {
          var elementData = {
            it: [],
            prevViewData: []
          };
          return elementData;
        };
        CVShapeElement.prototype.createTransformElement = function(data2) {
          var elementData = {
            transform: {
              opacity: 1,
              _opMdf: false,
              key: this.transformsManager.getNewKey(),
              op: PropertyFactory.getProp(this, data2.o, 0, 0.01, this),
              mProps: TransformPropertyFactory.getTransformProperty(this, data2, this)
            }
          };
          return elementData;
        };
        CVShapeElement.prototype.createShapeElement = function(data2) {
          var elementData = new CVShapeData(this, data2, this.stylesList, this.transformsManager);
          this.shapes.push(elementData);
          this.addShapeToModifiers(elementData);
          return elementData;
        };
        CVShapeElement.prototype.reloadShapes = function() {
          this._isFirstFrame = true;
          var i3;
          var len = this.itemsData.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.prevViewData[i3] = this.itemsData[i3];
          }
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, true, []);
          len = this.dynamicProperties.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            this.dynamicProperties[i3].getValue();
          }
          this.renderModifiers();
          this.transformsManager.processSequences(this._isFirstFrame);
        };
        CVShapeElement.prototype.addTransformToStyleList = function(transform2) {
          var i3;
          var len = this.stylesList.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (!this.stylesList[i3].closed) {
              this.stylesList[i3].transforms.push(transform2);
            }
          }
        };
        CVShapeElement.prototype.removeTransformFromStyleList = function() {
          var i3;
          var len = this.stylesList.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (!this.stylesList[i3].closed) {
              this.stylesList[i3].transforms.pop();
            }
          }
        };
        CVShapeElement.prototype.closeStyles = function(styles) {
          var i3;
          var len = styles.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            styles[i3].closed = true;
          }
        };
        CVShapeElement.prototype.searchShapes = function(arr, itemsData, prevViewData, shouldRender, transforms) {
          var i3;
          var len = arr.length - 1;
          var j3;
          var jLen;
          var ownStyles = [];
          var ownModifiers = [];
          var processedPos;
          var modifier;
          var currentTransform;
          var ownTransforms = [].concat(transforms);
          for (i3 = len; i3 >= 0; i3 -= 1) {
            processedPos = this.searchProcessedElement(arr[i3]);
            if (!processedPos) {
              arr[i3]._shouldRender = shouldRender;
            } else {
              itemsData[i3] = prevViewData[processedPos - 1];
            }
            if (arr[i3].ty === "fl" || arr[i3].ty === "st" || arr[i3].ty === "gf" || arr[i3].ty === "gs") {
              if (!processedPos) {
                itemsData[i3] = this.createStyleElement(arr[i3], ownTransforms);
              } else {
                itemsData[i3].style.closed = false;
              }
              ownStyles.push(itemsData[i3].style);
            } else if (arr[i3].ty === "gr") {
              if (!processedPos) {
                itemsData[i3] = this.createGroupElement(arr[i3]);
              } else {
                jLen = itemsData[i3].it.length;
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  itemsData[i3].prevViewData[j3] = itemsData[i3].it[j3];
                }
              }
              this.searchShapes(arr[i3].it, itemsData[i3].it, itemsData[i3].prevViewData, shouldRender, ownTransforms);
            } else if (arr[i3].ty === "tr") {
              if (!processedPos) {
                currentTransform = this.createTransformElement(arr[i3]);
                itemsData[i3] = currentTransform;
              }
              ownTransforms.push(itemsData[i3]);
              this.addTransformToStyleList(itemsData[i3]);
            } else if (arr[i3].ty === "sh" || arr[i3].ty === "rc" || arr[i3].ty === "el" || arr[i3].ty === "sr") {
              if (!processedPos) {
                itemsData[i3] = this.createShapeElement(arr[i3]);
              }
            } else if (arr[i3].ty === "tm" || arr[i3].ty === "rd" || arr[i3].ty === "pb" || arr[i3].ty === "zz" || arr[i3].ty === "op") {
              if (!processedPos) {
                modifier = ShapeModifiers.getModifier(arr[i3].ty);
                modifier.init(this, arr[i3]);
                itemsData[i3] = modifier;
                this.shapeModifiers.push(modifier);
              } else {
                modifier = itemsData[i3];
                modifier.closed = false;
              }
              ownModifiers.push(modifier);
            } else if (arr[i3].ty === "rp") {
              if (!processedPos) {
                modifier = ShapeModifiers.getModifier(arr[i3].ty);
                itemsData[i3] = modifier;
                modifier.init(this, arr, i3, itemsData);
                this.shapeModifiers.push(modifier);
                shouldRender = false;
              } else {
                modifier = itemsData[i3];
                modifier.closed = true;
              }
              ownModifiers.push(modifier);
            }
            this.addProcessedElement(arr[i3], i3 + 1);
          }
          this.removeTransformFromStyleList();
          this.closeStyles(ownStyles);
          len = ownModifiers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            ownModifiers[i3].closed = true;
          }
        };
        CVShapeElement.prototype.renderInnerContent = function() {
          this.transformHelper.opacity = 1;
          this.transformHelper._opMdf = false;
          this.renderModifiers();
          this.transformsManager.processSequences(this._isFirstFrame);
          this.renderShape(this.transformHelper, this.shapesData, this.itemsData, true);
        };
        CVShapeElement.prototype.renderShapeTransform = function(parentTransform, groupTransform) {
          if (parentTransform._opMdf || groupTransform.op._mdf || this._isFirstFrame) {
            groupTransform.opacity = parentTransform.opacity;
            groupTransform.opacity *= groupTransform.op.v;
            groupTransform._opMdf = true;
          }
        };
        CVShapeElement.prototype.drawLayer = function() {
          var i3;
          var len = this.stylesList.length;
          var j3;
          var jLen;
          var k3;
          var kLen;
          var elems;
          var nodes;
          var renderer2 = this.globalData.renderer;
          var ctx = this.globalData.canvasContext;
          var type;
          var currentStyle;
          for (i3 = 0; i3 < len; i3 += 1) {
            currentStyle = this.stylesList[i3];
            type = currentStyle.type;
            if (!((type === "st" || type === "gs") && currentStyle.wi === 0 || !currentStyle.data._shouldRender || currentStyle.coOp === 0 || this.globalData.currentGlobalAlpha === 0)) {
              renderer2.save();
              elems = currentStyle.elements;
              if (type === "st" || type === "gs") {
                renderer2.ctxStrokeStyle(type === "st" ? currentStyle.co : currentStyle.grd);
                renderer2.ctxLineWidth(currentStyle.wi);
                renderer2.ctxLineCap(currentStyle.lc);
                renderer2.ctxLineJoin(currentStyle.lj);
                renderer2.ctxMiterLimit(currentStyle.ml || 0);
              } else {
                renderer2.ctxFillStyle(type === "fl" ? currentStyle.co : currentStyle.grd);
              }
              renderer2.ctxOpacity(currentStyle.coOp);
              if (type !== "st" && type !== "gs") {
                ctx.beginPath();
              }
              renderer2.ctxTransform(currentStyle.preTransforms.finalTransform.props);
              jLen = elems.length;
              for (j3 = 0; j3 < jLen; j3 += 1) {
                if (type === "st" || type === "gs") {
                  ctx.beginPath();
                  if (currentStyle.da) {
                    ctx.setLineDash(currentStyle.da);
                    ctx.lineDashOffset = currentStyle["do"];
                  }
                }
                nodes = elems[j3].trNodes;
                kLen = nodes.length;
                for (k3 = 0; k3 < kLen; k3 += 1) {
                  if (nodes[k3].t === "m") {
                    ctx.moveTo(nodes[k3].p[0], nodes[k3].p[1]);
                  } else if (nodes[k3].t === "c") {
                    ctx.bezierCurveTo(nodes[k3].pts[0], nodes[k3].pts[1], nodes[k3].pts[2], nodes[k3].pts[3], nodes[k3].pts[4], nodes[k3].pts[5]);
                  } else {
                    ctx.closePath();
                  }
                }
                if (type === "st" || type === "gs") {
                  renderer2.ctxStroke();
                  if (currentStyle.da) {
                    ctx.setLineDash(this.dashResetter);
                  }
                }
              }
              if (type !== "st" && type !== "gs") {
                this.globalData.renderer.ctxFill(currentStyle.r);
              }
              renderer2.restore();
            }
          }
        };
        CVShapeElement.prototype.renderShape = function(parentTransform, items, data2, isMain) {
          var i3;
          var len = items.length - 1;
          var groupTransform;
          groupTransform = parentTransform;
          for (i3 = len; i3 >= 0; i3 -= 1) {
            if (items[i3].ty === "tr") {
              groupTransform = data2[i3].transform;
              this.renderShapeTransform(parentTransform, groupTransform);
            } else if (items[i3].ty === "sh" || items[i3].ty === "el" || items[i3].ty === "rc" || items[i3].ty === "sr") {
              this.renderPath(items[i3], data2[i3]);
            } else if (items[i3].ty === "fl") {
              this.renderFill(items[i3], data2[i3], groupTransform);
            } else if (items[i3].ty === "st") {
              this.renderStroke(items[i3], data2[i3], groupTransform);
            } else if (items[i3].ty === "gf" || items[i3].ty === "gs") {
              this.renderGradientFill(items[i3], data2[i3], groupTransform);
            } else if (items[i3].ty === "gr") {
              this.renderShape(groupTransform, items[i3].it, data2[i3].it);
            } else if (items[i3].ty === "tm") {
            }
          }
          if (isMain) {
            this.drawLayer();
          }
        };
        CVShapeElement.prototype.renderStyledShape = function(styledShape, shape) {
          if (this._isFirstFrame || shape._mdf || styledShape.transforms._mdf) {
            var shapeNodes = styledShape.trNodes;
            var paths = shape.paths;
            var i3;
            var len;
            var j3;
            var jLen = paths._length;
            shapeNodes.length = 0;
            var groupTransformMat = styledShape.transforms.finalTransform;
            for (j3 = 0; j3 < jLen; j3 += 1) {
              var pathNodes = paths.shapes[j3];
              if (pathNodes && pathNodes.v) {
                len = pathNodes._length;
                for (i3 = 1; i3 < len; i3 += 1) {
                  if (i3 === 1) {
                    shapeNodes.push({
                      t: "m",
                      p: groupTransformMat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                    });
                  }
                  shapeNodes.push({
                    t: "c",
                    pts: groupTransformMat.applyToTriplePoints(pathNodes.o[i3 - 1], pathNodes.i[i3], pathNodes.v[i3])
                  });
                }
                if (len === 1) {
                  shapeNodes.push({
                    t: "m",
                    p: groupTransformMat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                  });
                }
                if (pathNodes.c && len) {
                  shapeNodes.push({
                    t: "c",
                    pts: groupTransformMat.applyToTriplePoints(pathNodes.o[i3 - 1], pathNodes.i[0], pathNodes.v[0])
                  });
                  shapeNodes.push({
                    t: "z"
                  });
                }
              }
            }
            styledShape.trNodes = shapeNodes;
          }
        };
        CVShapeElement.prototype.renderPath = function(pathData, itemData) {
          if (pathData.hd !== true && pathData._shouldRender) {
            var i3;
            var len = itemData.styledShapes.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              this.renderStyledShape(itemData.styledShapes[i3], itemData.sh);
            }
          }
        };
        CVShapeElement.prototype.renderFill = function(styleData, itemData, groupTransform) {
          var styleElem = itemData.style;
          if (itemData.c._mdf || this._isFirstFrame) {
            styleElem.co = "rgb(" + bmFloor(itemData.c.v[0]) + "," + bmFloor(itemData.c.v[1]) + "," + bmFloor(itemData.c.v[2]) + ")";
          }
          if (itemData.o._mdf || groupTransform._opMdf || this._isFirstFrame) {
            styleElem.coOp = itemData.o.v * groupTransform.opacity;
          }
        };
        CVShapeElement.prototype.renderGradientFill = function(styleData, itemData, groupTransform) {
          var styleElem = itemData.style;
          var grd;
          if (!styleElem.grd || itemData.g._mdf || itemData.s._mdf || itemData.e._mdf || styleData.t !== 1 && (itemData.h._mdf || itemData.a._mdf)) {
            var ctx = this.globalData.canvasContext;
            var pt1 = itemData.s.v;
            var pt2 = itemData.e.v;
            if (styleData.t === 1) {
              grd = ctx.createLinearGradient(pt1[0], pt1[1], pt2[0], pt2[1]);
            } else {
              var rad = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
              var ang = Math.atan2(pt2[1] - pt1[1], pt2[0] - pt1[0]);
              var percent = itemData.h.v;
              if (percent >= 1) {
                percent = 0.99;
              } else if (percent <= -1) {
                percent = -0.99;
              }
              var dist = rad * percent;
              var x3 = Math.cos(ang + itemData.a.v) * dist + pt1[0];
              var y3 = Math.sin(ang + itemData.a.v) * dist + pt1[1];
              grd = ctx.createRadialGradient(x3, y3, 0, pt1[0], pt1[1], rad);
            }
            var i3;
            var len = styleData.g.p;
            var cValues = itemData.g.c;
            var opacity = 1;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (itemData.g._hasOpacity && itemData.g._collapsable) {
                opacity = itemData.g.o[i3 * 2 + 1];
              }
              grd.addColorStop(cValues[i3 * 4] / 100, "rgba(" + cValues[i3 * 4 + 1] + "," + cValues[i3 * 4 + 2] + "," + cValues[i3 * 4 + 3] + "," + opacity + ")");
            }
            styleElem.grd = grd;
          }
          styleElem.coOp = itemData.o.v * groupTransform.opacity;
        };
        CVShapeElement.prototype.renderStroke = function(styleData, itemData, groupTransform) {
          var styleElem = itemData.style;
          var d3 = itemData.d;
          if (d3 && (d3._mdf || this._isFirstFrame)) {
            styleElem.da = d3.dashArray;
            styleElem["do"] = d3.dashoffset[0];
          }
          if (itemData.c._mdf || this._isFirstFrame) {
            styleElem.co = "rgb(" + bmFloor(itemData.c.v[0]) + "," + bmFloor(itemData.c.v[1]) + "," + bmFloor(itemData.c.v[2]) + ")";
          }
          if (itemData.o._mdf || groupTransform._opMdf || this._isFirstFrame) {
            styleElem.coOp = itemData.o.v * groupTransform.opacity;
          }
          if (itemData.w._mdf || this._isFirstFrame) {
            styleElem.wi = itemData.w.v;
          }
        };
        CVShapeElement.prototype.destroy = function() {
          this.shapesData = null;
          this.globalData = null;
          this.canvasContext = null;
          this.stylesList.length = 0;
          this.itemsData.length = 0;
        };
        function CVTextElement(data2, globalData2, comp2) {
          this.textSpans = [];
          this.yOffset = 0;
          this.fillColorAnim = false;
          this.strokeColorAnim = false;
          this.strokeWidthAnim = false;
          this.stroke = false;
          this.fill = false;
          this.justifyOffset = 0;
          this.currentRender = null;
          this.renderType = "canvas";
          this.values = {
            fill: "rgba(0,0,0,0)",
            stroke: "rgba(0,0,0,0)",
            sWidth: 0,
            fValue: ""
          };
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement, ITextElement], CVTextElement);
        CVTextElement.prototype.tHelper = createTag("canvas").getContext("2d");
        CVTextElement.prototype.buildNewText = function() {
          var documentData = this.textProperty.currentData;
          this.renderedLetters = createSizedArray(documentData.l ? documentData.l.length : 0);
          var hasFill = false;
          if (documentData.fc) {
            hasFill = true;
            this.values.fill = this.buildColor(documentData.fc);
          } else {
            this.values.fill = "rgba(0,0,0,0)";
          }
          this.fill = hasFill;
          var hasStroke = false;
          if (documentData.sc) {
            hasStroke = true;
            this.values.stroke = this.buildColor(documentData.sc);
            this.values.sWidth = documentData.sw;
          }
          var fontData = this.globalData.fontManager.getFontByName(documentData.f);
          var i3;
          var len;
          var letters = documentData.l;
          var matrixHelper = this.mHelper;
          this.stroke = hasStroke;
          this.values.fValue = documentData.finalSize + "px " + this.globalData.fontManager.getFontByName(documentData.f).fFamily;
          len = documentData.finalText.length;
          var charData;
          var shapeData;
          var k3;
          var kLen;
          var shapes;
          var j3;
          var jLen;
          var pathNodes;
          var commands;
          var pathArr;
          var singleShape = this.data.singleShape;
          var trackingOffset = documentData.tr * 1e-3 * documentData.finalSize;
          var xPos = 0;
          var yPos = 0;
          var firstLine = true;
          var cnt = 0;
          for (i3 = 0; i3 < len; i3 += 1) {
            charData = this.globalData.fontManager.getCharData(documentData.finalText[i3], fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
            shapeData = charData && charData.data || {};
            matrixHelper.reset();
            if (singleShape && letters[i3].n) {
              xPos = -trackingOffset;
              yPos += documentData.yOffset;
              yPos += firstLine ? 1 : 0;
              firstLine = false;
            }
            shapes = shapeData.shapes ? shapeData.shapes[0].it : [];
            jLen = shapes.length;
            matrixHelper.scale(documentData.finalSize / 100, documentData.finalSize / 100);
            if (singleShape) {
              this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i3].line, xPos, yPos);
            }
            commands = createSizedArray(jLen - 1);
            var commandsCounter = 0;
            for (j3 = 0; j3 < jLen; j3 += 1) {
              if (shapes[j3].ty === "sh") {
                kLen = shapes[j3].ks.k.i.length;
                pathNodes = shapes[j3].ks.k;
                pathArr = [];
                for (k3 = 1; k3 < kLen; k3 += 1) {
                  if (k3 === 1) {
                    pathArr.push(matrixHelper.applyToX(pathNodes.v[0][0], pathNodes.v[0][1], 0), matrixHelper.applyToY(pathNodes.v[0][0], pathNodes.v[0][1], 0));
                  }
                  pathArr.push(matrixHelper.applyToX(pathNodes.o[k3 - 1][0], pathNodes.o[k3 - 1][1], 0), matrixHelper.applyToY(pathNodes.o[k3 - 1][0], pathNodes.o[k3 - 1][1], 0), matrixHelper.applyToX(pathNodes.i[k3][0], pathNodes.i[k3][1], 0), matrixHelper.applyToY(pathNodes.i[k3][0], pathNodes.i[k3][1], 0), matrixHelper.applyToX(pathNodes.v[k3][0], pathNodes.v[k3][1], 0), matrixHelper.applyToY(pathNodes.v[k3][0], pathNodes.v[k3][1], 0));
                }
                pathArr.push(matrixHelper.applyToX(pathNodes.o[k3 - 1][0], pathNodes.o[k3 - 1][1], 0), matrixHelper.applyToY(pathNodes.o[k3 - 1][0], pathNodes.o[k3 - 1][1], 0), matrixHelper.applyToX(pathNodes.i[0][0], pathNodes.i[0][1], 0), matrixHelper.applyToY(pathNodes.i[0][0], pathNodes.i[0][1], 0), matrixHelper.applyToX(pathNodes.v[0][0], pathNodes.v[0][1], 0), matrixHelper.applyToY(pathNodes.v[0][0], pathNodes.v[0][1], 0));
                commands[commandsCounter] = pathArr;
                commandsCounter += 1;
              }
            }
            if (singleShape) {
              xPos += letters[i3].l;
              xPos += trackingOffset;
            }
            if (this.textSpans[cnt]) {
              this.textSpans[cnt].elem = commands;
            } else {
              this.textSpans[cnt] = {
                elem: commands
              };
            }
            cnt += 1;
          }
        };
        CVTextElement.prototype.renderInnerContent = function() {
          this.validateText();
          var ctx = this.canvasContext;
          ctx.font = this.values.fValue;
          this.globalData.renderer.ctxLineCap("butt");
          this.globalData.renderer.ctxLineJoin("miter");
          this.globalData.renderer.ctxMiterLimit(4);
          if (!this.data.singleShape) {
            this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
          }
          var i3;
          var len;
          var j3;
          var jLen;
          var k3;
          var kLen;
          var renderedLetters = this.textAnimator.renderedLetters;
          var letters = this.textProperty.currentData.l;
          len = letters.length;
          var renderedLetter;
          var lastFill = null;
          var lastStroke = null;
          var lastStrokeW = null;
          var commands;
          var pathArr;
          var renderer2 = this.globalData.renderer;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (!letters[i3].n) {
              renderedLetter = renderedLetters[i3];
              if (renderedLetter) {
                renderer2.save();
                renderer2.ctxTransform(renderedLetter.p);
                renderer2.ctxOpacity(renderedLetter.o);
              }
              if (this.fill) {
                if (renderedLetter && renderedLetter.fc) {
                  if (lastFill !== renderedLetter.fc) {
                    renderer2.ctxFillStyle(renderedLetter.fc);
                    lastFill = renderedLetter.fc;
                  }
                } else if (lastFill !== this.values.fill) {
                  lastFill = this.values.fill;
                  renderer2.ctxFillStyle(this.values.fill);
                }
                commands = this.textSpans[i3].elem;
                jLen = commands.length;
                this.globalData.canvasContext.beginPath();
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  pathArr = commands[j3];
                  kLen = pathArr.length;
                  this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
                  for (k3 = 2; k3 < kLen; k3 += 6) {
                    this.globalData.canvasContext.bezierCurveTo(pathArr[k3], pathArr[k3 + 1], pathArr[k3 + 2], pathArr[k3 + 3], pathArr[k3 + 4], pathArr[k3 + 5]);
                  }
                }
                this.globalData.canvasContext.closePath();
                renderer2.ctxFill();
              }
              if (this.stroke) {
                if (renderedLetter && renderedLetter.sw) {
                  if (lastStrokeW !== renderedLetter.sw) {
                    lastStrokeW = renderedLetter.sw;
                    renderer2.ctxLineWidth(renderedLetter.sw);
                  }
                } else if (lastStrokeW !== this.values.sWidth) {
                  lastStrokeW = this.values.sWidth;
                  renderer2.ctxLineWidth(this.values.sWidth);
                }
                if (renderedLetter && renderedLetter.sc) {
                  if (lastStroke !== renderedLetter.sc) {
                    lastStroke = renderedLetter.sc;
                    renderer2.ctxStrokeStyle(renderedLetter.sc);
                  }
                } else if (lastStroke !== this.values.stroke) {
                  lastStroke = this.values.stroke;
                  renderer2.ctxStrokeStyle(this.values.stroke);
                }
                commands = this.textSpans[i3].elem;
                jLen = commands.length;
                this.globalData.canvasContext.beginPath();
                for (j3 = 0; j3 < jLen; j3 += 1) {
                  pathArr = commands[j3];
                  kLen = pathArr.length;
                  this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
                  for (k3 = 2; k3 < kLen; k3 += 6) {
                    this.globalData.canvasContext.bezierCurveTo(pathArr[k3], pathArr[k3 + 1], pathArr[k3 + 2], pathArr[k3 + 3], pathArr[k3 + 4], pathArr[k3 + 5]);
                  }
                }
                this.globalData.canvasContext.closePath();
                renderer2.ctxStroke();
              }
              if (renderedLetter) {
                this.globalData.renderer.restore();
              }
            }
          }
        };
        function CVImageElement(data2, globalData2, comp2) {
          this.assetData = globalData2.getAssetData(data2.refId);
          this.img = globalData2.imageLoader.getAsset(this.assetData);
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement], CVImageElement);
        CVImageElement.prototype.initElement = SVGShapeElement.prototype.initElement;
        CVImageElement.prototype.prepareFrame = IImageElement.prototype.prepareFrame;
        CVImageElement.prototype.createContent = function() {
          if (this.img.width && (this.assetData.w !== this.img.width || this.assetData.h !== this.img.height)) {
            var canvas = createTag("canvas");
            canvas.width = this.assetData.w;
            canvas.height = this.assetData.h;
            var ctx = canvas.getContext("2d");
            var imgW = this.img.width;
            var imgH = this.img.height;
            var imgRel = imgW / imgH;
            var canvasRel = this.assetData.w / this.assetData.h;
            var widthCrop;
            var heightCrop;
            var par = this.assetData.pr || this.globalData.renderConfig.imagePreserveAspectRatio;
            if (imgRel > canvasRel && par === "xMidYMid slice" || imgRel < canvasRel && par !== "xMidYMid slice") {
              heightCrop = imgH;
              widthCrop = heightCrop * canvasRel;
            } else {
              widthCrop = imgW;
              heightCrop = widthCrop / canvasRel;
            }
            ctx.drawImage(this.img, (imgW - widthCrop) / 2, (imgH - heightCrop) / 2, widthCrop, heightCrop, 0, 0, this.assetData.w, this.assetData.h);
            this.img = canvas;
          }
        };
        CVImageElement.prototype.renderInnerContent = function() {
          this.canvasContext.drawImage(this.img, 0, 0);
        };
        CVImageElement.prototype.destroy = function() {
          this.img = null;
        };
        function CVSolidElement(data2, globalData2, comp2) {
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement], CVSolidElement);
        CVSolidElement.prototype.initElement = SVGShapeElement.prototype.initElement;
        CVSolidElement.prototype.prepareFrame = IImageElement.prototype.prepareFrame;
        CVSolidElement.prototype.renderInnerContent = function() {
          this.globalData.renderer.ctxFillStyle(this.data.sc);
          this.globalData.renderer.ctxFillRect(0, 0, this.data.sw, this.data.sh);
        };
        function CanvasRendererBase() {
        }
        extendPrototype([BaseRenderer], CanvasRendererBase);
        CanvasRendererBase.prototype.createShape = function(data2) {
          return new CVShapeElement(data2, this.globalData, this);
        };
        CanvasRendererBase.prototype.createText = function(data2) {
          return new CVTextElement(data2, this.globalData, this);
        };
        CanvasRendererBase.prototype.createImage = function(data2) {
          return new CVImageElement(data2, this.globalData, this);
        };
        CanvasRendererBase.prototype.createSolid = function(data2) {
          return new CVSolidElement(data2, this.globalData, this);
        };
        CanvasRendererBase.prototype.createNull = SVGRenderer.prototype.createNull;
        CanvasRendererBase.prototype.ctxTransform = function(props) {
          if (props[0] === 1 && props[1] === 0 && props[4] === 0 && props[5] === 1 && props[12] === 0 && props[13] === 0) {
            return;
          }
          this.canvasContext.transform(props[0], props[1], props[4], props[5], props[12], props[13]);
        };
        CanvasRendererBase.prototype.ctxOpacity = function(op) {
          this.canvasContext.globalAlpha *= op < 0 ? 0 : op;
        };
        CanvasRendererBase.prototype.ctxFillStyle = function(value2) {
          this.canvasContext.fillStyle = value2;
        };
        CanvasRendererBase.prototype.ctxStrokeStyle = function(value2) {
          this.canvasContext.strokeStyle = value2;
        };
        CanvasRendererBase.prototype.ctxLineWidth = function(value2) {
          this.canvasContext.lineWidth = value2;
        };
        CanvasRendererBase.prototype.ctxLineCap = function(value2) {
          this.canvasContext.lineCap = value2;
        };
        CanvasRendererBase.prototype.ctxLineJoin = function(value2) {
          this.canvasContext.lineJoin = value2;
        };
        CanvasRendererBase.prototype.ctxMiterLimit = function(value2) {
          this.canvasContext.miterLimit = value2;
        };
        CanvasRendererBase.prototype.ctxFill = function(rule) {
          this.canvasContext.fill(rule);
        };
        CanvasRendererBase.prototype.ctxFillRect = function(x3, y3, w3, h3) {
          this.canvasContext.fillRect(x3, y3, w3, h3);
        };
        CanvasRendererBase.prototype.ctxStroke = function() {
          this.canvasContext.stroke();
        };
        CanvasRendererBase.prototype.reset = function() {
          if (!this.renderConfig.clearCanvas) {
            this.canvasContext.restore();
            return;
          }
          this.contextData.reset();
        };
        CanvasRendererBase.prototype.save = function() {
          this.canvasContext.save();
        };
        CanvasRendererBase.prototype.restore = function(actionFlag) {
          if (!this.renderConfig.clearCanvas) {
            this.canvasContext.restore();
            return;
          }
          if (actionFlag) {
            this.globalData.blendMode = "source-over";
          }
          this.contextData.restore(actionFlag);
        };
        CanvasRendererBase.prototype.configAnimation = function(animData) {
          if (this.animationItem.wrapper) {
            this.animationItem.container = createTag("canvas");
            var containerStyle = this.animationItem.container.style;
            containerStyle.width = "100%";
            containerStyle.height = "100%";
            var origin = "0px 0px 0px";
            containerStyle.transformOrigin = origin;
            containerStyle.mozTransformOrigin = origin;
            containerStyle.webkitTransformOrigin = origin;
            containerStyle["-webkit-transform"] = origin;
            containerStyle.contentVisibility = this.renderConfig.contentVisibility;
            this.animationItem.wrapper.appendChild(this.animationItem.container);
            this.canvasContext = this.animationItem.container.getContext("2d");
            if (this.renderConfig.className) {
              this.animationItem.container.setAttribute("class", this.renderConfig.className);
            }
            if (this.renderConfig.id) {
              this.animationItem.container.setAttribute("id", this.renderConfig.id);
            }
          } else {
            this.canvasContext = this.renderConfig.context;
          }
          this.contextData.setContext(this.canvasContext);
          this.data = animData;
          this.layers = animData.layers;
          this.transformCanvas = {
            w: animData.w,
            h: animData.h,
            sx: 0,
            sy: 0,
            tx: 0,
            ty: 0
          };
          this.setupGlobalData(animData, document.body);
          this.globalData.canvasContext = this.canvasContext;
          this.globalData.renderer = this;
          this.globalData.isDashed = false;
          this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
          this.globalData.transformCanvas = this.transformCanvas;
          this.elements = createSizedArray(animData.layers.length);
          this.updateContainerSize();
        };
        CanvasRendererBase.prototype.updateContainerSize = function(width2, height2) {
          this.reset();
          var elementWidth;
          var elementHeight;
          if (width2) {
            elementWidth = width2;
            elementHeight = height2;
            this.canvasContext.canvas.width = elementWidth;
            this.canvasContext.canvas.height = elementHeight;
          } else {
            if (this.animationItem.wrapper && this.animationItem.container) {
              elementWidth = this.animationItem.wrapper.offsetWidth;
              elementHeight = this.animationItem.wrapper.offsetHeight;
            } else {
              elementWidth = this.canvasContext.canvas.width;
              elementHeight = this.canvasContext.canvas.height;
            }
            this.canvasContext.canvas.width = elementWidth * this.renderConfig.dpr;
            this.canvasContext.canvas.height = elementHeight * this.renderConfig.dpr;
          }
          var elementRel;
          var animationRel;
          if (this.renderConfig.preserveAspectRatio.indexOf("meet") !== -1 || this.renderConfig.preserveAspectRatio.indexOf("slice") !== -1) {
            var par = this.renderConfig.preserveAspectRatio.split(" ");
            var fillType = par[1] || "meet";
            var pos = par[0] || "xMidYMid";
            var xPos = pos.substr(0, 4);
            var yPos = pos.substr(4);
            elementRel = elementWidth / elementHeight;
            animationRel = this.transformCanvas.w / this.transformCanvas.h;
            if (animationRel > elementRel && fillType === "meet" || animationRel < elementRel && fillType === "slice") {
              this.transformCanvas.sx = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
              this.transformCanvas.sy = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
            } else {
              this.transformCanvas.sx = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
              this.transformCanvas.sy = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
            }
            if (xPos === "xMid" && (animationRel < elementRel && fillType === "meet" || animationRel > elementRel && fillType === "slice")) {
              this.transformCanvas.tx = (elementWidth - this.transformCanvas.w * (elementHeight / this.transformCanvas.h)) / 2 * this.renderConfig.dpr;
            } else if (xPos === "xMax" && (animationRel < elementRel && fillType === "meet" || animationRel > elementRel && fillType === "slice")) {
              this.transformCanvas.tx = (elementWidth - this.transformCanvas.w * (elementHeight / this.transformCanvas.h)) * this.renderConfig.dpr;
            } else {
              this.transformCanvas.tx = 0;
            }
            if (yPos === "YMid" && (animationRel > elementRel && fillType === "meet" || animationRel < elementRel && fillType === "slice")) {
              this.transformCanvas.ty = (elementHeight - this.transformCanvas.h * (elementWidth / this.transformCanvas.w)) / 2 * this.renderConfig.dpr;
            } else if (yPos === "YMax" && (animationRel > elementRel && fillType === "meet" || animationRel < elementRel && fillType === "slice")) {
              this.transformCanvas.ty = (elementHeight - this.transformCanvas.h * (elementWidth / this.transformCanvas.w)) * this.renderConfig.dpr;
            } else {
              this.transformCanvas.ty = 0;
            }
          } else if (this.renderConfig.preserveAspectRatio === "none") {
            this.transformCanvas.sx = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
            this.transformCanvas.sy = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
            this.transformCanvas.tx = 0;
            this.transformCanvas.ty = 0;
          } else {
            this.transformCanvas.sx = this.renderConfig.dpr;
            this.transformCanvas.sy = this.renderConfig.dpr;
            this.transformCanvas.tx = 0;
            this.transformCanvas.ty = 0;
          }
          this.transformCanvas.props = [this.transformCanvas.sx, 0, 0, 0, 0, this.transformCanvas.sy, 0, 0, 0, 0, 1, 0, this.transformCanvas.tx, this.transformCanvas.ty, 0, 1];
          this.ctxTransform(this.transformCanvas.props);
          this.canvasContext.beginPath();
          this.canvasContext.rect(0, 0, this.transformCanvas.w, this.transformCanvas.h);
          this.canvasContext.closePath();
          this.canvasContext.clip();
          this.renderFrame(this.renderedFrame, true);
        };
        CanvasRendererBase.prototype.destroy = function() {
          if (this.renderConfig.clearCanvas && this.animationItem.wrapper) {
            this.animationItem.wrapper.innerText = "";
          }
          var i3;
          var len = this.layers ? this.layers.length : 0;
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.elements[i3] && this.elements[i3].destroy) {
              this.elements[i3].destroy();
            }
          }
          this.elements.length = 0;
          this.globalData.canvasContext = null;
          this.animationItem.container = null;
          this.destroyed = true;
        };
        CanvasRendererBase.prototype.renderFrame = function(num, forceRender) {
          if (this.renderedFrame === num && this.renderConfig.clearCanvas === true && !forceRender || this.destroyed || num === -1) {
            return;
          }
          this.renderedFrame = num;
          this.globalData.frameNum = num - this.animationItem._isFirstFrame;
          this.globalData.frameId += 1;
          this.globalData._mdf = !this.renderConfig.clearCanvas || forceRender;
          this.globalData.projectInterface.currentFrame = num;
          var i3;
          var len = this.layers.length;
          if (!this.completeLayers) {
            this.checkLayers(num);
          }
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.completeLayers || this.elements[i3]) {
              this.elements[i3].prepareFrame(num - this.layers[i3].st);
            }
          }
          if (this.globalData._mdf) {
            if (this.renderConfig.clearCanvas === true) {
              this.canvasContext.clearRect(0, 0, this.transformCanvas.w, this.transformCanvas.h);
            } else {
              this.save();
            }
            for (i3 = len - 1; i3 >= 0; i3 -= 1) {
              if (this.completeLayers || this.elements[i3]) {
                this.elements[i3].renderFrame();
              }
            }
            if (this.renderConfig.clearCanvas !== true) {
              this.restore();
            }
          }
        };
        CanvasRendererBase.prototype.buildItem = function(pos) {
          var elements = this.elements;
          if (elements[pos] || this.layers[pos].ty === 99) {
            return;
          }
          var element = this.createItem(this.layers[pos], this, this.globalData);
          elements[pos] = element;
          element.initExpressions();
        };
        CanvasRendererBase.prototype.checkPendingElements = function() {
          while (this.pendingElements.length) {
            var element = this.pendingElements.pop();
            element.checkParenting();
          }
        };
        CanvasRendererBase.prototype.hide = function() {
          this.animationItem.container.style.display = "none";
        };
        CanvasRendererBase.prototype.show = function() {
          this.animationItem.container.style.display = "block";
        };
        function CanvasContext() {
          this.opacity = -1;
          this.transform = createTypedArray("float32", 16);
          this.fillStyle = "";
          this.strokeStyle = "";
          this.lineWidth = "";
          this.lineCap = "";
          this.lineJoin = "";
          this.miterLimit = "";
          this.id = Math.random();
        }
        function CVContextData() {
          this.stack = [];
          this.cArrPos = 0;
          this.cTr = new Matrix();
          var i3;
          var len = 15;
          for (i3 = 0; i3 < len; i3 += 1) {
            var canvasContext = new CanvasContext();
            this.stack[i3] = canvasContext;
          }
          this._length = len;
          this.nativeContext = null;
          this.transformMat = new Matrix();
          this.currentOpacity = 1;
          this.currentFillStyle = "";
          this.appliedFillStyle = "";
          this.currentStrokeStyle = "";
          this.appliedStrokeStyle = "";
          this.currentLineWidth = "";
          this.appliedLineWidth = "";
          this.currentLineCap = "";
          this.appliedLineCap = "";
          this.currentLineJoin = "";
          this.appliedLineJoin = "";
          this.appliedMiterLimit = "";
          this.currentMiterLimit = "";
        }
        CVContextData.prototype.duplicate = function() {
          var newLength = this._length * 2;
          var i3 = 0;
          for (i3 = this._length; i3 < newLength; i3 += 1) {
            this.stack[i3] = new CanvasContext();
          }
          this._length = newLength;
        };
        CVContextData.prototype.reset = function() {
          this.cArrPos = 0;
          this.cTr.reset();
          this.stack[this.cArrPos].opacity = 1;
        };
        CVContextData.prototype.restore = function(forceRestore) {
          this.cArrPos -= 1;
          var currentContext = this.stack[this.cArrPos];
          var transform2 = currentContext.transform;
          var i3;
          var arr = this.cTr.props;
          for (i3 = 0; i3 < 16; i3 += 1) {
            arr[i3] = transform2[i3];
          }
          if (forceRestore) {
            this.nativeContext.restore();
            var prevStack = this.stack[this.cArrPos + 1];
            this.appliedFillStyle = prevStack.fillStyle;
            this.appliedStrokeStyle = prevStack.strokeStyle;
            this.appliedLineWidth = prevStack.lineWidth;
            this.appliedLineCap = prevStack.lineCap;
            this.appliedLineJoin = prevStack.lineJoin;
            this.appliedMiterLimit = prevStack.miterLimit;
          }
          this.nativeContext.setTransform(transform2[0], transform2[1], transform2[4], transform2[5], transform2[12], transform2[13]);
          if (forceRestore || currentContext.opacity !== -1 && this.currentOpacity !== currentContext.opacity) {
            this.nativeContext.globalAlpha = currentContext.opacity;
            this.currentOpacity = currentContext.opacity;
          }
          this.currentFillStyle = currentContext.fillStyle;
          this.currentStrokeStyle = currentContext.strokeStyle;
          this.currentLineWidth = currentContext.lineWidth;
          this.currentLineCap = currentContext.lineCap;
          this.currentLineJoin = currentContext.lineJoin;
          this.currentMiterLimit = currentContext.miterLimit;
        };
        CVContextData.prototype.save = function(saveOnNativeFlag) {
          if (saveOnNativeFlag) {
            this.nativeContext.save();
          }
          var props = this.cTr.props;
          if (this._length <= this.cArrPos) {
            this.duplicate();
          }
          var currentStack = this.stack[this.cArrPos];
          var i3;
          for (i3 = 0; i3 < 16; i3 += 1) {
            currentStack.transform[i3] = props[i3];
          }
          this.cArrPos += 1;
          var newStack = this.stack[this.cArrPos];
          newStack.opacity = currentStack.opacity;
          newStack.fillStyle = currentStack.fillStyle;
          newStack.strokeStyle = currentStack.strokeStyle;
          newStack.lineWidth = currentStack.lineWidth;
          newStack.lineCap = currentStack.lineCap;
          newStack.lineJoin = currentStack.lineJoin;
          newStack.miterLimit = currentStack.miterLimit;
        };
        CVContextData.prototype.setOpacity = function(value2) {
          this.stack[this.cArrPos].opacity = value2;
        };
        CVContextData.prototype.setContext = function(value2) {
          this.nativeContext = value2;
        };
        CVContextData.prototype.fillStyle = function(value2) {
          if (this.stack[this.cArrPos].fillStyle !== value2) {
            this.currentFillStyle = value2;
            this.stack[this.cArrPos].fillStyle = value2;
          }
        };
        CVContextData.prototype.strokeStyle = function(value2) {
          if (this.stack[this.cArrPos].strokeStyle !== value2) {
            this.currentStrokeStyle = value2;
            this.stack[this.cArrPos].strokeStyle = value2;
          }
        };
        CVContextData.prototype.lineWidth = function(value2) {
          if (this.stack[this.cArrPos].lineWidth !== value2) {
            this.currentLineWidth = value2;
            this.stack[this.cArrPos].lineWidth = value2;
          }
        };
        CVContextData.prototype.lineCap = function(value2) {
          if (this.stack[this.cArrPos].lineCap !== value2) {
            this.currentLineCap = value2;
            this.stack[this.cArrPos].lineCap = value2;
          }
        };
        CVContextData.prototype.lineJoin = function(value2) {
          if (this.stack[this.cArrPos].lineJoin !== value2) {
            this.currentLineJoin = value2;
            this.stack[this.cArrPos].lineJoin = value2;
          }
        };
        CVContextData.prototype.miterLimit = function(value2) {
          if (this.stack[this.cArrPos].miterLimit !== value2) {
            this.currentMiterLimit = value2;
            this.stack[this.cArrPos].miterLimit = value2;
          }
        };
        CVContextData.prototype.transform = function(props) {
          this.transformMat.cloneFromProps(props);
          var currentTransform = this.cTr;
          this.transformMat.multiply(currentTransform);
          currentTransform.cloneFromProps(this.transformMat.props);
          var trProps = currentTransform.props;
          this.nativeContext.setTransform(trProps[0], trProps[1], trProps[4], trProps[5], trProps[12], trProps[13]);
        };
        CVContextData.prototype.opacity = function(op) {
          var currentOpacity = this.stack[this.cArrPos].opacity;
          currentOpacity *= op < 0 ? 0 : op;
          if (this.stack[this.cArrPos].opacity !== currentOpacity) {
            if (this.currentOpacity !== op) {
              this.nativeContext.globalAlpha = op;
              this.currentOpacity = op;
            }
            this.stack[this.cArrPos].opacity = currentOpacity;
          }
        };
        CVContextData.prototype.fill = function(rule) {
          if (this.appliedFillStyle !== this.currentFillStyle) {
            this.appliedFillStyle = this.currentFillStyle;
            this.nativeContext.fillStyle = this.appliedFillStyle;
          }
          this.nativeContext.fill(rule);
        };
        CVContextData.prototype.fillRect = function(x3, y3, w3, h3) {
          if (this.appliedFillStyle !== this.currentFillStyle) {
            this.appliedFillStyle = this.currentFillStyle;
            this.nativeContext.fillStyle = this.appliedFillStyle;
          }
          this.nativeContext.fillRect(x3, y3, w3, h3);
        };
        CVContextData.prototype.stroke = function() {
          if (this.appliedStrokeStyle !== this.currentStrokeStyle) {
            this.appliedStrokeStyle = this.currentStrokeStyle;
            this.nativeContext.strokeStyle = this.appliedStrokeStyle;
          }
          if (this.appliedLineWidth !== this.currentLineWidth) {
            this.appliedLineWidth = this.currentLineWidth;
            this.nativeContext.lineWidth = this.appliedLineWidth;
          }
          if (this.appliedLineCap !== this.currentLineCap) {
            this.appliedLineCap = this.currentLineCap;
            this.nativeContext.lineCap = this.appliedLineCap;
          }
          if (this.appliedLineJoin !== this.currentLineJoin) {
            this.appliedLineJoin = this.currentLineJoin;
            this.nativeContext.lineJoin = this.appliedLineJoin;
          }
          if (this.appliedMiterLimit !== this.currentMiterLimit) {
            this.appliedMiterLimit = this.currentMiterLimit;
            this.nativeContext.miterLimit = this.appliedMiterLimit;
          }
          this.nativeContext.stroke();
        };
        function CVCompElement(data2, globalData2, comp2) {
          this.completeLayers = false;
          this.layers = data2.layers;
          this.pendingElements = [];
          this.elements = createSizedArray(this.layers.length);
          this.initElement(data2, globalData2, comp2);
          this.tm = data2.tm ? PropertyFactory.getProp(this, data2.tm, 0, globalData2.frameRate, this) : {
            _placeholder: true
          };
        }
        extendPrototype([CanvasRendererBase, ICompElement, CVBaseElement], CVCompElement);
        CVCompElement.prototype.renderInnerContent = function() {
          var ctx = this.canvasContext;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.data.w, 0);
          ctx.lineTo(this.data.w, this.data.h);
          ctx.lineTo(0, this.data.h);
          ctx.lineTo(0, 0);
          ctx.clip();
          var i3;
          var len = this.layers.length;
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.completeLayers || this.elements[i3]) {
              this.elements[i3].renderFrame();
            }
          }
        };
        CVCompElement.prototype.destroy = function() {
          var i3;
          var len = this.layers.length;
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            if (this.elements[i3]) {
              this.elements[i3].destroy();
            }
          }
          this.layers = null;
          this.elements = null;
        };
        CVCompElement.prototype.createComp = function(data2) {
          return new CVCompElement(data2, this.globalData, this);
        };
        function CanvasRenderer(animationItem, config) {
          this.animationItem = animationItem;
          this.renderConfig = {
            clearCanvas: config && config.clearCanvas !== void 0 ? config.clearCanvas : true,
            context: config && config.context || null,
            progressiveLoad: config && config.progressiveLoad || false,
            preserveAspectRatio: config && config.preserveAspectRatio || "xMidYMid meet",
            imagePreserveAspectRatio: config && config.imagePreserveAspectRatio || "xMidYMid slice",
            contentVisibility: config && config.contentVisibility || "visible",
            className: config && config.className || "",
            id: config && config.id || "",
            runExpressions: !config || config.runExpressions === void 0 || config.runExpressions
          };
          this.renderConfig.dpr = config && config.dpr || 1;
          if (this.animationItem.wrapper) {
            this.renderConfig.dpr = config && config.dpr || window.devicePixelRatio || 1;
          }
          this.renderedFrame = -1;
          this.globalData = {
            frameNum: -1,
            _mdf: false,
            renderConfig: this.renderConfig,
            currentGlobalAlpha: -1
          };
          this.contextData = new CVContextData();
          this.elements = [];
          this.pendingElements = [];
          this.transformMat = new Matrix();
          this.completeLayers = false;
          this.rendererType = "canvas";
          if (this.renderConfig.clearCanvas) {
            this.ctxTransform = this.contextData.transform.bind(this.contextData);
            this.ctxOpacity = this.contextData.opacity.bind(this.contextData);
            this.ctxFillStyle = this.contextData.fillStyle.bind(this.contextData);
            this.ctxStrokeStyle = this.contextData.strokeStyle.bind(this.contextData);
            this.ctxLineWidth = this.contextData.lineWidth.bind(this.contextData);
            this.ctxLineCap = this.contextData.lineCap.bind(this.contextData);
            this.ctxLineJoin = this.contextData.lineJoin.bind(this.contextData);
            this.ctxMiterLimit = this.contextData.miterLimit.bind(this.contextData);
            this.ctxFill = this.contextData.fill.bind(this.contextData);
            this.ctxFillRect = this.contextData.fillRect.bind(this.contextData);
            this.ctxStroke = this.contextData.stroke.bind(this.contextData);
            this.save = this.contextData.save.bind(this.contextData);
          }
        }
        extendPrototype([CanvasRendererBase], CanvasRenderer);
        CanvasRenderer.prototype.createComp = function(data2) {
          return new CVCompElement(data2, this.globalData, this);
        };
        function HBaseElement() {
        }
        HBaseElement.prototype = {
          checkBlendMode: function checkBlendMode() {
          },
          initRendererElement: function initRendererElement() {
            this.baseElement = createTag(this.data.tg || "div");
            if (this.data.hasMask) {
              this.svgElement = createNS("svg");
              this.layerElement = createNS("g");
              this.maskedElement = this.layerElement;
              this.svgElement.appendChild(this.layerElement);
              this.baseElement.appendChild(this.svgElement);
            } else {
              this.layerElement = this.baseElement;
            }
            styleDiv(this.baseElement);
          },
          createContainerElements: function createContainerElements() {
            this.renderableEffectsManager = new CVEffects(this);
            this.transformedElement = this.baseElement;
            this.maskedElement = this.layerElement;
            if (this.data.ln) {
              this.layerElement.setAttribute("id", this.data.ln);
            }
            if (this.data.cl) {
              this.layerElement.setAttribute("class", this.data.cl);
            }
            if (this.data.bm !== 0) {
              this.setBlendMode();
            }
          },
          renderElement: function renderElement() {
            var transformedElementStyle = this.transformedElement ? this.transformedElement.style : {};
            if (this.finalTransform._matMdf) {
              var matrixValue = this.finalTransform.mat.toCSS();
              transformedElementStyle.transform = matrixValue;
              transformedElementStyle.webkitTransform = matrixValue;
            }
            if (this.finalTransform._opMdf) {
              transformedElementStyle.opacity = this.finalTransform.mProp.o.v;
            }
          },
          renderFrame: function renderFrame() {
            if (this.data.hd || this.hidden) {
              return;
            }
            this.renderTransform();
            this.renderRenderable();
            this.renderElement();
            this.renderInnerContent();
            if (this._isFirstFrame) {
              this._isFirstFrame = false;
            }
          },
          destroy: function destroy() {
            this.layerElement = null;
            this.transformedElement = null;
            if (this.matteElement) {
              this.matteElement = null;
            }
            if (this.maskManager) {
              this.maskManager.destroy();
              this.maskManager = null;
            }
          },
          createRenderableComponents: function createRenderableComponents() {
            this.maskManager = new MaskElement(this.data, this, this.globalData);
          },
          addEffects: function addEffects() {
          },
          setMatte: function setMatte() {
          }
        };
        HBaseElement.prototype.getBaseElement = SVGBaseElement.prototype.getBaseElement;
        HBaseElement.prototype.destroyBaseElement = HBaseElement.prototype.destroy;
        HBaseElement.prototype.buildElementParenting = BaseRenderer.prototype.buildElementParenting;
        function HSolidElement(data2, globalData2, comp2) {
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, HBaseElement, HierarchyElement, FrameElement, RenderableDOMElement], HSolidElement);
        HSolidElement.prototype.createContent = function() {
          var rect;
          if (this.data.hasMask) {
            rect = createNS("rect");
            rect.setAttribute("width", this.data.sw);
            rect.setAttribute("height", this.data.sh);
            rect.setAttribute("fill", this.data.sc);
            this.svgElement.setAttribute("width", this.data.sw);
            this.svgElement.setAttribute("height", this.data.sh);
          } else {
            rect = createTag("div");
            rect.style.width = this.data.sw + "px";
            rect.style.height = this.data.sh + "px";
            rect.style.backgroundColor = this.data.sc;
          }
          this.layerElement.appendChild(rect);
        };
        function HShapeElement(data2, globalData2, comp2) {
          this.shapes = [];
          this.shapesData = data2.shapes;
          this.stylesList = [];
          this.shapeModifiers = [];
          this.itemsData = [];
          this.processedElements = [];
          this.animatedContents = [];
          this.shapesContainer = createNS("g");
          this.initElement(data2, globalData2, comp2);
          this.prevViewData = [];
          this.currentBBox = {
            x: 999999,
            y: -999999,
            h: 0,
            w: 0
          };
        }
        extendPrototype([BaseElement, TransformElement, HSolidElement, SVGShapeElement, HBaseElement, HierarchyElement, FrameElement, RenderableElement], HShapeElement);
        HShapeElement.prototype._renderShapeFrame = HShapeElement.prototype.renderInnerContent;
        HShapeElement.prototype.createContent = function() {
          var cont;
          this.baseElement.style.fontSize = 0;
          if (this.data.hasMask) {
            this.layerElement.appendChild(this.shapesContainer);
            cont = this.svgElement;
          } else {
            cont = createNS("svg");
            var size = this.comp.data ? this.comp.data : this.globalData.compSize;
            cont.setAttribute("width", size.w);
            cont.setAttribute("height", size.h);
            cont.appendChild(this.shapesContainer);
            this.layerElement.appendChild(cont);
          }
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.shapesContainer, 0, [], true);
          this.filterUniqueShapes();
          this.shapeCont = cont;
        };
        HShapeElement.prototype.getTransformedPoint = function(transformers, point) {
          var i3;
          var len = transformers.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            point = transformers[i3].mProps.v.applyToPointArray(point[0], point[1], 0);
          }
          return point;
        };
        HShapeElement.prototype.calculateShapeBoundingBox = function(item, boundingBox) {
          var shape = item.sh.v;
          var transformers = item.transformers;
          var i3;
          var len = shape._length;
          var vPoint;
          var oPoint;
          var nextIPoint;
          var nextVPoint;
          if (len <= 1) {
            return;
          }
          for (i3 = 0; i3 < len - 1; i3 += 1) {
            vPoint = this.getTransformedPoint(transformers, shape.v[i3]);
            oPoint = this.getTransformedPoint(transformers, shape.o[i3]);
            nextIPoint = this.getTransformedPoint(transformers, shape.i[i3 + 1]);
            nextVPoint = this.getTransformedPoint(transformers, shape.v[i3 + 1]);
            this.checkBounds(vPoint, oPoint, nextIPoint, nextVPoint, boundingBox);
          }
          if (shape.c) {
            vPoint = this.getTransformedPoint(transformers, shape.v[i3]);
            oPoint = this.getTransformedPoint(transformers, shape.o[i3]);
            nextIPoint = this.getTransformedPoint(transformers, shape.i[0]);
            nextVPoint = this.getTransformedPoint(transformers, shape.v[0]);
            this.checkBounds(vPoint, oPoint, nextIPoint, nextVPoint, boundingBox);
          }
        };
        HShapeElement.prototype.checkBounds = function(vPoint, oPoint, nextIPoint, nextVPoint, boundingBox) {
          this.getBoundsOfCurve(vPoint, oPoint, nextIPoint, nextVPoint);
          var bounds = this.shapeBoundingBox;
          boundingBox.x = bmMin(bounds.left, boundingBox.x);
          boundingBox.xMax = bmMax(bounds.right, boundingBox.xMax);
          boundingBox.y = bmMin(bounds.top, boundingBox.y);
          boundingBox.yMax = bmMax(bounds.bottom, boundingBox.yMax);
        };
        HShapeElement.prototype.shapeBoundingBox = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
        HShapeElement.prototype.tempBoundingBox = {
          x: 0,
          xMax: 0,
          y: 0,
          yMax: 0,
          width: 0,
          height: 0
        };
        HShapeElement.prototype.getBoundsOfCurve = function(p0, p1, p22, p3) {
          var bounds = [[p0[0], p3[0]], [p0[1], p3[1]]];
          for (var a3, b2, c3, t3, b2ac, t1, t22, i3 = 0; i3 < 2; ++i3) {
            b2 = 6 * p0[i3] - 12 * p1[i3] + 6 * p22[i3];
            a3 = -3 * p0[i3] + 9 * p1[i3] - 9 * p22[i3] + 3 * p3[i3];
            c3 = 3 * p1[i3] - 3 * p0[i3];
            b2 |= 0;
            a3 |= 0;
            c3 |= 0;
            if (a3 === 0 && b2 === 0) {
            } else if (a3 === 0) {
              t3 = -c3 / b2;
              if (t3 > 0 && t3 < 1) {
                bounds[i3].push(this.calculateF(t3, p0, p1, p22, p3, i3));
              }
            } else {
              b2ac = b2 * b2 - 4 * c3 * a3;
              if (b2ac >= 0) {
                t1 = (-b2 + bmSqrt(b2ac)) / (2 * a3);
                if (t1 > 0 && t1 < 1) bounds[i3].push(this.calculateF(t1, p0, p1, p22, p3, i3));
                t22 = (-b2 - bmSqrt(b2ac)) / (2 * a3);
                if (t22 > 0 && t22 < 1) bounds[i3].push(this.calculateF(t22, p0, p1, p22, p3, i3));
              }
            }
          }
          this.shapeBoundingBox.left = bmMin.apply(null, bounds[0]);
          this.shapeBoundingBox.top = bmMin.apply(null, bounds[1]);
          this.shapeBoundingBox.right = bmMax.apply(null, bounds[0]);
          this.shapeBoundingBox.bottom = bmMax.apply(null, bounds[1]);
        };
        HShapeElement.prototype.calculateF = function(t3, p0, p1, p22, p3, i3) {
          return bmPow(1 - t3, 3) * p0[i3] + 3 * bmPow(1 - t3, 2) * t3 * p1[i3] + 3 * (1 - t3) * bmPow(t3, 2) * p22[i3] + bmPow(t3, 3) * p3[i3];
        };
        HShapeElement.prototype.calculateBoundingBox = function(itemsData, boundingBox) {
          var i3;
          var len = itemsData.length;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (itemsData[i3] && itemsData[i3].sh) {
              this.calculateShapeBoundingBox(itemsData[i3], boundingBox);
            } else if (itemsData[i3] && itemsData[i3].it) {
              this.calculateBoundingBox(itemsData[i3].it, boundingBox);
            } else if (itemsData[i3] && itemsData[i3].style && itemsData[i3].w) {
              this.expandStrokeBoundingBox(itemsData[i3].w, boundingBox);
            }
          }
        };
        HShapeElement.prototype.expandStrokeBoundingBox = function(widthProperty, boundingBox) {
          var width2 = 0;
          if (widthProperty.keyframes) {
            for (var i3 = 0; i3 < widthProperty.keyframes.length; i3 += 1) {
              var kfw = widthProperty.keyframes[i3].s;
              if (kfw > width2) {
                width2 = kfw;
              }
            }
            width2 *= widthProperty.mult;
          } else {
            width2 = widthProperty.v * widthProperty.mult;
          }
          boundingBox.x -= width2;
          boundingBox.xMax += width2;
          boundingBox.y -= width2;
          boundingBox.yMax += width2;
        };
        HShapeElement.prototype.currentBoxContains = function(box) {
          return this.currentBBox.x <= box.x && this.currentBBox.y <= box.y && this.currentBBox.width + this.currentBBox.x >= box.x + box.width && this.currentBBox.height + this.currentBBox.y >= box.y + box.height;
        };
        HShapeElement.prototype.renderInnerContent = function() {
          this._renderShapeFrame();
          if (!this.hidden && (this._isFirstFrame || this._mdf)) {
            var tempBoundingBox = this.tempBoundingBox;
            var max = 999999;
            tempBoundingBox.x = max;
            tempBoundingBox.xMax = -max;
            tempBoundingBox.y = max;
            tempBoundingBox.yMax = -max;
            this.calculateBoundingBox(this.itemsData, tempBoundingBox);
            tempBoundingBox.width = tempBoundingBox.xMax < tempBoundingBox.x ? 0 : tempBoundingBox.xMax - tempBoundingBox.x;
            tempBoundingBox.height = tempBoundingBox.yMax < tempBoundingBox.y ? 0 : tempBoundingBox.yMax - tempBoundingBox.y;
            if (this.currentBoxContains(tempBoundingBox)) {
              return;
            }
            var changed = false;
            if (this.currentBBox.w !== tempBoundingBox.width) {
              this.currentBBox.w = tempBoundingBox.width;
              this.shapeCont.setAttribute("width", tempBoundingBox.width);
              changed = true;
            }
            if (this.currentBBox.h !== tempBoundingBox.height) {
              this.currentBBox.h = tempBoundingBox.height;
              this.shapeCont.setAttribute("height", tempBoundingBox.height);
              changed = true;
            }
            if (changed || this.currentBBox.x !== tempBoundingBox.x || this.currentBBox.y !== tempBoundingBox.y) {
              this.currentBBox.w = tempBoundingBox.width;
              this.currentBBox.h = tempBoundingBox.height;
              this.currentBBox.x = tempBoundingBox.x;
              this.currentBBox.y = tempBoundingBox.y;
              this.shapeCont.setAttribute("viewBox", this.currentBBox.x + " " + this.currentBBox.y + " " + this.currentBBox.w + " " + this.currentBBox.h);
              var shapeStyle = this.shapeCont.style;
              var shapeTransform = "translate(" + this.currentBBox.x + "px," + this.currentBBox.y + "px)";
              shapeStyle.transform = shapeTransform;
              shapeStyle.webkitTransform = shapeTransform;
            }
          }
        };
        function HTextElement(data2, globalData2, comp2) {
          this.textSpans = [];
          this.textPaths = [];
          this.currentBBox = {
            x: 999999,
            y: -999999,
            h: 0,
            w: 0
          };
          this.renderType = "svg";
          this.isMasked = false;
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, HBaseElement, HierarchyElement, FrameElement, RenderableDOMElement, ITextElement], HTextElement);
        HTextElement.prototype.createContent = function() {
          this.isMasked = this.checkMasks();
          if (this.isMasked) {
            this.renderType = "svg";
            this.compW = this.comp.data.w;
            this.compH = this.comp.data.h;
            this.svgElement.setAttribute("width", this.compW);
            this.svgElement.setAttribute("height", this.compH);
            var g3 = createNS("g");
            this.maskedElement.appendChild(g3);
            this.innerElem = g3;
          } else {
            this.renderType = "html";
            this.innerElem = this.layerElement;
          }
          this.checkParenting();
        };
        HTextElement.prototype.buildNewText = function() {
          var documentData = this.textProperty.currentData;
          this.renderedLetters = createSizedArray(documentData.l ? documentData.l.length : 0);
          var innerElemStyle = this.innerElem.style;
          var textColor = documentData.fc ? this.buildColor(documentData.fc) : "rgba(0,0,0,0)";
          innerElemStyle.fill = textColor;
          innerElemStyle.color = textColor;
          if (documentData.sc) {
            innerElemStyle.stroke = this.buildColor(documentData.sc);
            innerElemStyle.strokeWidth = documentData.sw + "px";
          }
          var fontData = this.globalData.fontManager.getFontByName(documentData.f);
          if (!this.globalData.fontManager.chars) {
            innerElemStyle.fontSize = documentData.finalSize + "px";
            innerElemStyle.lineHeight = documentData.finalSize + "px";
            if (fontData.fClass) {
              this.innerElem.className = fontData.fClass;
            } else {
              innerElemStyle.fontFamily = fontData.fFamily;
              var fWeight = documentData.fWeight;
              var fStyle = documentData.fStyle;
              innerElemStyle.fontStyle = fStyle;
              innerElemStyle.fontWeight = fWeight;
            }
          }
          var i3;
          var len;
          var letters = documentData.l;
          len = letters.length;
          var tSpan;
          var tParent;
          var tCont;
          var matrixHelper = this.mHelper;
          var shapes;
          var shapeStr = "";
          var cnt = 0;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.globalData.fontManager.chars) {
              if (!this.textPaths[cnt]) {
                tSpan = createNS("path");
                tSpan.setAttribute("stroke-linecap", lineCapEnum[1]);
                tSpan.setAttribute("stroke-linejoin", lineJoinEnum[2]);
                tSpan.setAttribute("stroke-miterlimit", "4");
              } else {
                tSpan = this.textPaths[cnt];
              }
              if (!this.isMasked) {
                if (this.textSpans[cnt]) {
                  tParent = this.textSpans[cnt];
                  tCont = tParent.children[0];
                } else {
                  tParent = createTag("div");
                  tParent.style.lineHeight = 0;
                  tCont = createNS("svg");
                  tCont.appendChild(tSpan);
                  styleDiv(tParent);
                }
              }
            } else if (!this.isMasked) {
              if (this.textSpans[cnt]) {
                tParent = this.textSpans[cnt];
                tSpan = this.textPaths[cnt];
              } else {
                tParent = createTag("span");
                styleDiv(tParent);
                tSpan = createTag("span");
                styleDiv(tSpan);
                tParent.appendChild(tSpan);
              }
            } else {
              tSpan = this.textPaths[cnt] ? this.textPaths[cnt] : createNS("text");
            }
            if (this.globalData.fontManager.chars) {
              var charData = this.globalData.fontManager.getCharData(documentData.finalText[i3], fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
              var shapeData;
              if (charData) {
                shapeData = charData.data;
              } else {
                shapeData = null;
              }
              matrixHelper.reset();
              if (shapeData && shapeData.shapes && shapeData.shapes.length) {
                shapes = shapeData.shapes[0].it;
                matrixHelper.scale(documentData.finalSize / 100, documentData.finalSize / 100);
                shapeStr = this.createPathShape(matrixHelper, shapes);
                tSpan.setAttribute("d", shapeStr);
              }
              if (!this.isMasked) {
                this.innerElem.appendChild(tParent);
                if (shapeData && shapeData.shapes) {
                  document.body.appendChild(tCont);
                  var boundingBox = tCont.getBBox();
                  tCont.setAttribute("width", boundingBox.width + 2);
                  tCont.setAttribute("height", boundingBox.height + 2);
                  tCont.setAttribute("viewBox", boundingBox.x - 1 + " " + (boundingBox.y - 1) + " " + (boundingBox.width + 2) + " " + (boundingBox.height + 2));
                  var tContStyle = tCont.style;
                  var tContTranslation = "translate(" + (boundingBox.x - 1) + "px," + (boundingBox.y - 1) + "px)";
                  tContStyle.transform = tContTranslation;
                  tContStyle.webkitTransform = tContTranslation;
                  letters[i3].yOffset = boundingBox.y - 1;
                } else {
                  tCont.setAttribute("width", 1);
                  tCont.setAttribute("height", 1);
                }
                tParent.appendChild(tCont);
              } else {
                this.innerElem.appendChild(tSpan);
              }
            } else {
              tSpan.textContent = letters[i3].val;
              tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
              if (!this.isMasked) {
                this.innerElem.appendChild(tParent);
                var tStyle = tSpan.style;
                var tSpanTranslation = "translate3d(0," + -documentData.finalSize / 1.2 + "px,0)";
                tStyle.transform = tSpanTranslation;
                tStyle.webkitTransform = tSpanTranslation;
              } else {
                this.innerElem.appendChild(tSpan);
              }
            }
            if (!this.isMasked) {
              this.textSpans[cnt] = tParent;
            } else {
              this.textSpans[cnt] = tSpan;
            }
            this.textSpans[cnt].style.display = "block";
            this.textPaths[cnt] = tSpan;
            cnt += 1;
          }
          while (cnt < this.textSpans.length) {
            this.textSpans[cnt].style.display = "none";
            cnt += 1;
          }
        };
        HTextElement.prototype.renderInnerContent = function() {
          this.validateText();
          var svgStyle;
          if (this.data.singleShape) {
            if (!this._isFirstFrame && !this.lettersChangedFlag) {
              return;
            }
            if (this.isMasked && this.finalTransform._matMdf) {
              this.svgElement.setAttribute("viewBox", -this.finalTransform.mProp.p.v[0] + " " + -this.finalTransform.mProp.p.v[1] + " " + this.compW + " " + this.compH);
              svgStyle = this.svgElement.style;
              var translation = "translate(" + -this.finalTransform.mProp.p.v[0] + "px," + -this.finalTransform.mProp.p.v[1] + "px)";
              svgStyle.transform = translation;
              svgStyle.webkitTransform = translation;
            }
          }
          this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
          if (!this.lettersChangedFlag && !this.textAnimator.lettersChangedFlag) {
            return;
          }
          var i3;
          var len;
          var count = 0;
          var renderedLetters = this.textAnimator.renderedLetters;
          var letters = this.textProperty.currentData.l;
          len = letters.length;
          var renderedLetter;
          var textSpan;
          var textPath;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (letters[i3].n) {
              count += 1;
            } else {
              textSpan = this.textSpans[i3];
              textPath = this.textPaths[i3];
              renderedLetter = renderedLetters[count];
              count += 1;
              if (renderedLetter._mdf.m) {
                if (!this.isMasked) {
                  textSpan.style.webkitTransform = renderedLetter.m;
                  textSpan.style.transform = renderedLetter.m;
                } else {
                  textSpan.setAttribute("transform", renderedLetter.m);
                }
              }
              textSpan.style.opacity = renderedLetter.o;
              if (renderedLetter.sw && renderedLetter._mdf.sw) {
                textPath.setAttribute("stroke-width", renderedLetter.sw);
              }
              if (renderedLetter.sc && renderedLetter._mdf.sc) {
                textPath.setAttribute("stroke", renderedLetter.sc);
              }
              if (renderedLetter.fc && renderedLetter._mdf.fc) {
                textPath.setAttribute("fill", renderedLetter.fc);
                textPath.style.color = renderedLetter.fc;
              }
            }
          }
          if (this.innerElem.getBBox && !this.hidden && (this._isFirstFrame || this._mdf)) {
            var boundingBox = this.innerElem.getBBox();
            if (this.currentBBox.w !== boundingBox.width) {
              this.currentBBox.w = boundingBox.width;
              this.svgElement.setAttribute("width", boundingBox.width);
            }
            if (this.currentBBox.h !== boundingBox.height) {
              this.currentBBox.h = boundingBox.height;
              this.svgElement.setAttribute("height", boundingBox.height);
            }
            var margin = 1;
            if (this.currentBBox.w !== boundingBox.width + margin * 2 || this.currentBBox.h !== boundingBox.height + margin * 2 || this.currentBBox.x !== boundingBox.x - margin || this.currentBBox.y !== boundingBox.y - margin) {
              this.currentBBox.w = boundingBox.width + margin * 2;
              this.currentBBox.h = boundingBox.height + margin * 2;
              this.currentBBox.x = boundingBox.x - margin;
              this.currentBBox.y = boundingBox.y - margin;
              this.svgElement.setAttribute("viewBox", this.currentBBox.x + " " + this.currentBBox.y + " " + this.currentBBox.w + " " + this.currentBBox.h);
              svgStyle = this.svgElement.style;
              var svgTransform = "translate(" + this.currentBBox.x + "px," + this.currentBBox.y + "px)";
              svgStyle.transform = svgTransform;
              svgStyle.webkitTransform = svgTransform;
            }
          }
        };
        function HCameraElement(data2, globalData2, comp2) {
          this.initFrame();
          this.initBaseData(data2, globalData2, comp2);
          this.initHierarchy();
          var getProp = PropertyFactory.getProp;
          this.pe = getProp(this, data2.pe, 0, 0, this);
          if (data2.ks.p.s) {
            this.px = getProp(this, data2.ks.p.x, 1, 0, this);
            this.py = getProp(this, data2.ks.p.y, 1, 0, this);
            this.pz = getProp(this, data2.ks.p.z, 1, 0, this);
          } else {
            this.p = getProp(this, data2.ks.p, 1, 0, this);
          }
          if (data2.ks.a) {
            this.a = getProp(this, data2.ks.a, 1, 0, this);
          }
          if (data2.ks.or.k.length && data2.ks.or.k[0].to) {
            var i3;
            var len = data2.ks.or.k.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              data2.ks.or.k[i3].to = null;
              data2.ks.or.k[i3].ti = null;
            }
          }
          this.or = getProp(this, data2.ks.or, 1, degToRads, this);
          this.or.sh = true;
          this.rx = getProp(this, data2.ks.rx, 0, degToRads, this);
          this.ry = getProp(this, data2.ks.ry, 0, degToRads, this);
          this.rz = getProp(this, data2.ks.rz, 0, degToRads, this);
          this.mat = new Matrix();
          this._prevMat = new Matrix();
          this._isFirstFrame = true;
          this.finalTransform = {
            mProp: this
          };
        }
        extendPrototype([BaseElement, FrameElement, HierarchyElement], HCameraElement);
        HCameraElement.prototype.setup = function() {
          var i3;
          var len = this.comp.threeDElements.length;
          var comp2;
          var perspectiveStyle;
          var containerStyle;
          for (i3 = 0; i3 < len; i3 += 1) {
            comp2 = this.comp.threeDElements[i3];
            if (comp2.type === "3d") {
              perspectiveStyle = comp2.perspectiveElem.style;
              containerStyle = comp2.container.style;
              var perspective = this.pe.v + "px";
              var origin = "0px 0px 0px";
              var matrix = "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)";
              perspectiveStyle.perspective = perspective;
              perspectiveStyle.webkitPerspective = perspective;
              containerStyle.transformOrigin = origin;
              containerStyle.mozTransformOrigin = origin;
              containerStyle.webkitTransformOrigin = origin;
              perspectiveStyle.transform = matrix;
              perspectiveStyle.webkitTransform = matrix;
            }
          }
        };
        HCameraElement.prototype.createElements = function() {
        };
        HCameraElement.prototype.hide = function() {
        };
        HCameraElement.prototype.renderFrame = function() {
          var _mdf = this._isFirstFrame;
          var i3;
          var len;
          if (this.hierarchy) {
            len = this.hierarchy.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              _mdf = this.hierarchy[i3].finalTransform.mProp._mdf || _mdf;
            }
          }
          if (_mdf || this.pe._mdf || this.p && this.p._mdf || this.px && (this.px._mdf || this.py._mdf || this.pz._mdf) || this.rx._mdf || this.ry._mdf || this.rz._mdf || this.or._mdf || this.a && this.a._mdf) {
            this.mat.reset();
            if (this.hierarchy) {
              len = this.hierarchy.length - 1;
              for (i3 = len; i3 >= 0; i3 -= 1) {
                var mTransf = this.hierarchy[i3].finalTransform.mProp;
                this.mat.translate(-mTransf.p.v[0], -mTransf.p.v[1], mTransf.p.v[2]);
                this.mat.rotateX(-mTransf.or.v[0]).rotateY(-mTransf.or.v[1]).rotateZ(mTransf.or.v[2]);
                this.mat.rotateX(-mTransf.rx.v).rotateY(-mTransf.ry.v).rotateZ(mTransf.rz.v);
                this.mat.scale(1 / mTransf.s.v[0], 1 / mTransf.s.v[1], 1 / mTransf.s.v[2]);
                this.mat.translate(mTransf.a.v[0], mTransf.a.v[1], mTransf.a.v[2]);
              }
            }
            if (this.p) {
              this.mat.translate(-this.p.v[0], -this.p.v[1], this.p.v[2]);
            } else {
              this.mat.translate(-this.px.v, -this.py.v, this.pz.v);
            }
            if (this.a) {
              var diffVector;
              if (this.p) {
                diffVector = [this.p.v[0] - this.a.v[0], this.p.v[1] - this.a.v[1], this.p.v[2] - this.a.v[2]];
              } else {
                diffVector = [this.px.v - this.a.v[0], this.py.v - this.a.v[1], this.pz.v - this.a.v[2]];
              }
              var mag = Math.sqrt(Math.pow(diffVector[0], 2) + Math.pow(diffVector[1], 2) + Math.pow(diffVector[2], 2));
              var lookDir = [diffVector[0] / mag, diffVector[1] / mag, diffVector[2] / mag];
              var lookLengthOnXZ = Math.sqrt(lookDir[2] * lookDir[2] + lookDir[0] * lookDir[0]);
              var mRotationX = Math.atan2(lookDir[1], lookLengthOnXZ);
              var mRotationY = Math.atan2(lookDir[0], -lookDir[2]);
              this.mat.rotateY(mRotationY).rotateX(-mRotationX);
            }
            this.mat.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);
            this.mat.rotateX(-this.or.v[0]).rotateY(-this.or.v[1]).rotateZ(this.or.v[2]);
            this.mat.translate(this.globalData.compSize.w / 2, this.globalData.compSize.h / 2, 0);
            this.mat.translate(0, 0, this.pe.v);
            var hasMatrixChanged = !this._prevMat.equals(this.mat);
            if ((hasMatrixChanged || this.pe._mdf) && this.comp.threeDElements) {
              len = this.comp.threeDElements.length;
              var comp2;
              var perspectiveStyle;
              var containerStyle;
              for (i3 = 0; i3 < len; i3 += 1) {
                comp2 = this.comp.threeDElements[i3];
                if (comp2.type === "3d") {
                  if (hasMatrixChanged) {
                    var matValue = this.mat.toCSS();
                    containerStyle = comp2.container.style;
                    containerStyle.transform = matValue;
                    containerStyle.webkitTransform = matValue;
                  }
                  if (this.pe._mdf) {
                    perspectiveStyle = comp2.perspectiveElem.style;
                    perspectiveStyle.perspective = this.pe.v + "px";
                    perspectiveStyle.webkitPerspective = this.pe.v + "px";
                  }
                }
              }
              this.mat.clone(this._prevMat);
            }
          }
          this._isFirstFrame = false;
        };
        HCameraElement.prototype.prepareFrame = function(num) {
          this.prepareProperties(num, true);
        };
        HCameraElement.prototype.destroy = function() {
        };
        HCameraElement.prototype.getBaseElement = function() {
          return null;
        };
        function HImageElement(data2, globalData2, comp2) {
          this.assetData = globalData2.getAssetData(data2.refId);
          this.initElement(data2, globalData2, comp2);
        }
        extendPrototype([BaseElement, TransformElement, HBaseElement, HSolidElement, HierarchyElement, FrameElement, RenderableElement], HImageElement);
        HImageElement.prototype.createContent = function() {
          var assetPath = this.globalData.getAssetsPath(this.assetData);
          var img = new Image();
          if (this.data.hasMask) {
            this.imageElem = createNS("image");
            this.imageElem.setAttribute("width", this.assetData.w + "px");
            this.imageElem.setAttribute("height", this.assetData.h + "px");
            this.imageElem.setAttributeNS("http://www.w3.org/1999/xlink", "href", assetPath);
            this.layerElement.appendChild(this.imageElem);
            this.baseElement.setAttribute("width", this.assetData.w);
            this.baseElement.setAttribute("height", this.assetData.h);
          } else {
            this.layerElement.appendChild(img);
          }
          img.crossOrigin = "anonymous";
          img.src = assetPath;
          if (this.data.ln) {
            this.baseElement.setAttribute("id", this.data.ln);
          }
        };
        function HybridRendererBase(animationItem, config) {
          this.animationItem = animationItem;
          this.layers = null;
          this.renderedFrame = -1;
          this.renderConfig = {
            className: config && config.className || "",
            imagePreserveAspectRatio: config && config.imagePreserveAspectRatio || "xMidYMid slice",
            hideOnTransparent: !(config && config.hideOnTransparent === false),
            filterSize: {
              width: config && config.filterSize && config.filterSize.width || "400%",
              height: config && config.filterSize && config.filterSize.height || "400%",
              x: config && config.filterSize && config.filterSize.x || "-100%",
              y: config && config.filterSize && config.filterSize.y || "-100%"
            }
          };
          this.globalData = {
            _mdf: false,
            frameNum: -1,
            renderConfig: this.renderConfig
          };
          this.pendingElements = [];
          this.elements = [];
          this.threeDElements = [];
          this.destroyed = false;
          this.camera = null;
          this.supports3d = true;
          this.rendererType = "html";
        }
        extendPrototype([BaseRenderer], HybridRendererBase);
        HybridRendererBase.prototype.buildItem = SVGRenderer.prototype.buildItem;
        HybridRendererBase.prototype.checkPendingElements = function() {
          while (this.pendingElements.length) {
            var element = this.pendingElements.pop();
            element.checkParenting();
          }
        };
        HybridRendererBase.prototype.appendElementInPos = function(element, pos) {
          var newDOMElement = element.getBaseElement();
          if (!newDOMElement) {
            return;
          }
          var layer = this.layers[pos];
          if (!layer.ddd || !this.supports3d) {
            if (this.threeDElements) {
              this.addTo3dContainer(newDOMElement, pos);
            } else {
              var i3 = 0;
              var nextDOMElement;
              var nextLayer;
              var tmpDOMElement;
              while (i3 < pos) {
                if (this.elements[i3] && this.elements[i3] !== true && this.elements[i3].getBaseElement) {
                  nextLayer = this.elements[i3];
                  tmpDOMElement = this.layers[i3].ddd ? this.getThreeDContainerByPos(i3) : nextLayer.getBaseElement();
                  nextDOMElement = tmpDOMElement || nextDOMElement;
                }
                i3 += 1;
              }
              if (nextDOMElement) {
                if (!layer.ddd || !this.supports3d) {
                  this.layerElement.insertBefore(newDOMElement, nextDOMElement);
                }
              } else if (!layer.ddd || !this.supports3d) {
                this.layerElement.appendChild(newDOMElement);
              }
            }
          } else {
            this.addTo3dContainer(newDOMElement, pos);
          }
        };
        HybridRendererBase.prototype.createShape = function(data2) {
          if (!this.supports3d) {
            return new SVGShapeElement(data2, this.globalData, this);
          }
          return new HShapeElement(data2, this.globalData, this);
        };
        HybridRendererBase.prototype.createText = function(data2) {
          if (!this.supports3d) {
            return new SVGTextLottieElement(data2, this.globalData, this);
          }
          return new HTextElement(data2, this.globalData, this);
        };
        HybridRendererBase.prototype.createCamera = function(data2) {
          this.camera = new HCameraElement(data2, this.globalData, this);
          return this.camera;
        };
        HybridRendererBase.prototype.createImage = function(data2) {
          if (!this.supports3d) {
            return new IImageElement(data2, this.globalData, this);
          }
          return new HImageElement(data2, this.globalData, this);
        };
        HybridRendererBase.prototype.createSolid = function(data2) {
          if (!this.supports3d) {
            return new ISolidElement(data2, this.globalData, this);
          }
          return new HSolidElement(data2, this.globalData, this);
        };
        HybridRendererBase.prototype.createNull = SVGRenderer.prototype.createNull;
        HybridRendererBase.prototype.getThreeDContainerByPos = function(pos) {
          var i3 = 0;
          var len = this.threeDElements.length;
          while (i3 < len) {
            if (this.threeDElements[i3].startPos <= pos && this.threeDElements[i3].endPos >= pos) {
              return this.threeDElements[i3].perspectiveElem;
            }
            i3 += 1;
          }
          return null;
        };
        HybridRendererBase.prototype.createThreeDContainer = function(pos, type) {
          var perspectiveElem = createTag("div");
          var style;
          var containerStyle;
          styleDiv(perspectiveElem);
          var container = createTag("div");
          styleDiv(container);
          if (type === "3d") {
            style = perspectiveElem.style;
            style.width = this.globalData.compSize.w + "px";
            style.height = this.globalData.compSize.h + "px";
            var center = "50% 50%";
            style.webkitTransformOrigin = center;
            style.mozTransformOrigin = center;
            style.transformOrigin = center;
            containerStyle = container.style;
            var matrix = "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)";
            containerStyle.transform = matrix;
            containerStyle.webkitTransform = matrix;
          }
          perspectiveElem.appendChild(container);
          var threeDContainerData = {
            container,
            perspectiveElem,
            startPos: pos,
            endPos: pos,
            type
          };
          this.threeDElements.push(threeDContainerData);
          return threeDContainerData;
        };
        HybridRendererBase.prototype.build3dContainers = function() {
          var i3;
          var len = this.layers.length;
          var lastThreeDContainerData;
          var currentContainer = "";
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.layers[i3].ddd && this.layers[i3].ty !== 3) {
              if (currentContainer !== "3d") {
                currentContainer = "3d";
                lastThreeDContainerData = this.createThreeDContainer(i3, "3d");
              }
              lastThreeDContainerData.endPos = Math.max(lastThreeDContainerData.endPos, i3);
            } else {
              if (currentContainer !== "2d") {
                currentContainer = "2d";
                lastThreeDContainerData = this.createThreeDContainer(i3, "2d");
              }
              lastThreeDContainerData.endPos = Math.max(lastThreeDContainerData.endPos, i3);
            }
          }
          len = this.threeDElements.length;
          for (i3 = len - 1; i3 >= 0; i3 -= 1) {
            this.resizerElem.appendChild(this.threeDElements[i3].perspectiveElem);
          }
        };
        HybridRendererBase.prototype.addTo3dContainer = function(elem2, pos) {
          var i3 = 0;
          var len = this.threeDElements.length;
          while (i3 < len) {
            if (pos <= this.threeDElements[i3].endPos) {
              var j3 = this.threeDElements[i3].startPos;
              var nextElement;
              while (j3 < pos) {
                if (this.elements[j3] && this.elements[j3].getBaseElement) {
                  nextElement = this.elements[j3].getBaseElement();
                }
                j3 += 1;
              }
              if (nextElement) {
                this.threeDElements[i3].container.insertBefore(elem2, nextElement);
              } else {
                this.threeDElements[i3].container.appendChild(elem2);
              }
              break;
            }
            i3 += 1;
          }
        };
        HybridRendererBase.prototype.configAnimation = function(animData) {
          var resizerElem = createTag("div");
          var wrapper = this.animationItem.wrapper;
          var style = resizerElem.style;
          style.width = animData.w + "px";
          style.height = animData.h + "px";
          this.resizerElem = resizerElem;
          styleDiv(resizerElem);
          style.transformStyle = "flat";
          style.mozTransformStyle = "flat";
          style.webkitTransformStyle = "flat";
          if (this.renderConfig.className) {
            resizerElem.setAttribute("class", this.renderConfig.className);
          }
          wrapper.appendChild(resizerElem);
          style.overflow = "hidden";
          var svg = createNS("svg");
          svg.setAttribute("width", "1");
          svg.setAttribute("height", "1");
          styleDiv(svg);
          this.resizerElem.appendChild(svg);
          var defs = createNS("defs");
          svg.appendChild(defs);
          this.data = animData;
          this.setupGlobalData(animData, svg);
          this.globalData.defs = defs;
          this.layers = animData.layers;
          this.layerElement = this.resizerElem;
          this.build3dContainers();
          this.updateContainerSize();
        };
        HybridRendererBase.prototype.destroy = function() {
          if (this.animationItem.wrapper) {
            this.animationItem.wrapper.innerText = "";
          }
          this.animationItem.container = null;
          this.globalData.defs = null;
          var i3;
          var len = this.layers ? this.layers.length : 0;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.elements[i3] && this.elements[i3].destroy) {
              this.elements[i3].destroy();
            }
          }
          this.elements.length = 0;
          this.destroyed = true;
          this.animationItem = null;
        };
        HybridRendererBase.prototype.updateContainerSize = function() {
          var elementWidth = this.animationItem.wrapper.offsetWidth;
          var elementHeight = this.animationItem.wrapper.offsetHeight;
          var elementRel = elementWidth / elementHeight;
          var animationRel = this.globalData.compSize.w / this.globalData.compSize.h;
          var sx;
          var sy;
          var tx;
          var ty;
          if (animationRel > elementRel) {
            sx = elementWidth / this.globalData.compSize.w;
            sy = elementWidth / this.globalData.compSize.w;
            tx = 0;
            ty = (elementHeight - this.globalData.compSize.h * (elementWidth / this.globalData.compSize.w)) / 2;
          } else {
            sx = elementHeight / this.globalData.compSize.h;
            sy = elementHeight / this.globalData.compSize.h;
            tx = (elementWidth - this.globalData.compSize.w * (elementHeight / this.globalData.compSize.h)) / 2;
            ty = 0;
          }
          var style = this.resizerElem.style;
          style.webkitTransform = "matrix3d(" + sx + ",0,0,0,0," + sy + ",0,0,0,0,1,0," + tx + "," + ty + ",0,1)";
          style.transform = style.webkitTransform;
        };
        HybridRendererBase.prototype.renderFrame = SVGRenderer.prototype.renderFrame;
        HybridRendererBase.prototype.hide = function() {
          this.resizerElem.style.display = "none";
        };
        HybridRendererBase.prototype.show = function() {
          this.resizerElem.style.display = "block";
        };
        HybridRendererBase.prototype.initItems = function() {
          this.buildAllItems();
          if (this.camera) {
            this.camera.setup();
          } else {
            var cWidth = this.globalData.compSize.w;
            var cHeight = this.globalData.compSize.h;
            var i3;
            var len = this.threeDElements.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              var style = this.threeDElements[i3].perspectiveElem.style;
              style.webkitPerspective = Math.sqrt(Math.pow(cWidth, 2) + Math.pow(cHeight, 2)) + "px";
              style.perspective = style.webkitPerspective;
            }
          }
        };
        HybridRendererBase.prototype.searchExtraCompositions = function(assets) {
          var i3;
          var len = assets.length;
          var floatingContainer = createTag("div");
          for (i3 = 0; i3 < len; i3 += 1) {
            if (assets[i3].xt) {
              var comp2 = this.createComp(assets[i3], floatingContainer, this.globalData.comp, null);
              comp2.initExpressions();
              this.globalData.projectInterface.registerComposition(comp2);
            }
          }
        };
        function HCompElement(data2, globalData2, comp2) {
          this.layers = data2.layers;
          this.supports3d = !data2.hasMask;
          this.completeLayers = false;
          this.pendingElements = [];
          this.elements = this.layers ? createSizedArray(this.layers.length) : [];
          this.initElement(data2, globalData2, comp2);
          this.tm = data2.tm ? PropertyFactory.getProp(this, data2.tm, 0, globalData2.frameRate, this) : {
            _placeholder: true
          };
        }
        extendPrototype([HybridRendererBase, ICompElement, HBaseElement], HCompElement);
        HCompElement.prototype._createBaseContainerElements = HCompElement.prototype.createContainerElements;
        HCompElement.prototype.createContainerElements = function() {
          this._createBaseContainerElements();
          if (this.data.hasMask) {
            this.svgElement.setAttribute("width", this.data.w);
            this.svgElement.setAttribute("height", this.data.h);
            this.transformedElement = this.baseElement;
          } else {
            this.transformedElement = this.layerElement;
          }
        };
        HCompElement.prototype.addTo3dContainer = function(elem2, pos) {
          var j3 = 0;
          var nextElement;
          while (j3 < pos) {
            if (this.elements[j3] && this.elements[j3].getBaseElement) {
              nextElement = this.elements[j3].getBaseElement();
            }
            j3 += 1;
          }
          if (nextElement) {
            this.layerElement.insertBefore(elem2, nextElement);
          } else {
            this.layerElement.appendChild(elem2);
          }
        };
        HCompElement.prototype.createComp = function(data2) {
          if (!this.supports3d) {
            return new SVGCompElement(data2, this.globalData, this);
          }
          return new HCompElement(data2, this.globalData, this);
        };
        function HybridRenderer(animationItem, config) {
          this.animationItem = animationItem;
          this.layers = null;
          this.renderedFrame = -1;
          this.renderConfig = {
            className: config && config.className || "",
            imagePreserveAspectRatio: config && config.imagePreserveAspectRatio || "xMidYMid slice",
            hideOnTransparent: !(config && config.hideOnTransparent === false),
            filterSize: {
              width: config && config.filterSize && config.filterSize.width || "400%",
              height: config && config.filterSize && config.filterSize.height || "400%",
              x: config && config.filterSize && config.filterSize.x || "-100%",
              y: config && config.filterSize && config.filterSize.y || "-100%"
            },
            runExpressions: !config || config.runExpressions === void 0 || config.runExpressions
          };
          this.globalData = {
            _mdf: false,
            frameNum: -1,
            renderConfig: this.renderConfig
          };
          this.pendingElements = [];
          this.elements = [];
          this.threeDElements = [];
          this.destroyed = false;
          this.camera = null;
          this.supports3d = true;
          this.rendererType = "html";
        }
        extendPrototype([HybridRendererBase], HybridRenderer);
        HybridRenderer.prototype.createComp = function(data2) {
          if (!this.supports3d) {
            return new SVGCompElement(data2, this.globalData, this);
          }
          return new HCompElement(data2, this.globalData, this);
        };
        var CompExpressionInterface = /* @__PURE__ */ (function() {
          return function(comp2) {
            function _thisLayerFunction(name2) {
              var i3 = 0;
              var len = comp2.layers.length;
              while (i3 < len) {
                if (comp2.layers[i3].nm === name2 || comp2.layers[i3].ind === name2) {
                  return comp2.elements[i3].layerInterface;
                }
                i3 += 1;
              }
              return null;
            }
            Object.defineProperty(_thisLayerFunction, "_name", {
              value: comp2.data.nm
            });
            _thisLayerFunction.layer = _thisLayerFunction;
            _thisLayerFunction.pixelAspect = 1;
            _thisLayerFunction.height = comp2.data.h || comp2.globalData.compSize.h;
            _thisLayerFunction.width = comp2.data.w || comp2.globalData.compSize.w;
            _thisLayerFunction.pixelAspect = 1;
            _thisLayerFunction.frameDuration = 1 / comp2.globalData.frameRate;
            _thisLayerFunction.displayStartTime = 0;
            _thisLayerFunction.numLayers = comp2.layers.length;
            return _thisLayerFunction;
          };
        })();
        function _typeof$2(o3) {
          "@babel/helpers - typeof";
          return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$2(o3);
        }
        function seedRandom(pool, math) {
          var global = this, width2 = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width2, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask2 = width2 - 1, nodecrypto;
          function seedrandom(seed, options2, callback) {
            var key2 = [];
            options2 = options2 === true ? {
              entropy: true
            } : options2 || {};
            var shortseed = mixkey(flatten(options2.entropy ? [seed, tostring(pool)] : seed === null ? autoseed() : seed, 3), key2);
            var arc4 = new ARC4(key2);
            var prng = function prng2() {
              var n2 = arc4.g(chunks), d3 = startdenom, x3 = 0;
              while (n2 < significance) {
                n2 = (n2 + x3) * width2;
                d3 *= width2;
                x3 = arc4.g(1);
              }
              while (n2 >= overflow) {
                n2 /= 2;
                d3 /= 2;
                x3 >>>= 1;
              }
              return (n2 + x3) / d3;
            };
            prng.int32 = function() {
              return arc4.g(4) | 0;
            };
            prng.quick = function() {
              return arc4.g(4) / 4294967296;
            };
            prng["double"] = prng;
            mixkey(tostring(arc4.S), pool);
            return (options2.pass || callback || function(prng2, seed2, is_math_call, state) {
              if (state) {
                if (state.S) {
                  copy(state, arc4);
                }
                prng2.state = function() {
                  return copy(arc4, {});
                };
              }
              if (is_math_call) {
                math[rngname] = prng2;
                return seed2;
              } else return prng2;
            })(prng, shortseed, "global" in options2 ? options2.global : this == math, options2.state);
          }
          math["seed" + rngname] = seedrandom;
          function ARC4(key2) {
            var t3, keylen = key2.length, me = this, i3 = 0, j3 = me.i = me.j = 0, s3 = me.S = [];
            if (!keylen) {
              key2 = [keylen++];
            }
            while (i3 < width2) {
              s3[i3] = i3++;
            }
            for (i3 = 0; i3 < width2; i3++) {
              s3[i3] = s3[j3 = mask2 & j3 + key2[i3 % keylen] + (t3 = s3[i3])];
              s3[j3] = t3;
            }
            me.g = function(count) {
              var t4, r3 = 0, i4 = me.i, j4 = me.j, s4 = me.S;
              while (count--) {
                t4 = s4[i4 = mask2 & i4 + 1];
                r3 = r3 * width2 + s4[mask2 & (s4[i4] = s4[j4 = mask2 & j4 + t4]) + (s4[j4] = t4)];
              }
              me.i = i4;
              me.j = j4;
              return r3;
            };
          }
          function copy(f3, t3) {
            t3.i = f3.i;
            t3.j = f3.j;
            t3.S = f3.S.slice();
            return t3;
          }
          function flatten(obj, depth) {
            var result = [], typ = _typeof$2(obj), prop;
            if (depth && typ == "object") {
              for (prop in obj) {
                try {
                  result.push(flatten(obj[prop], depth - 1));
                } catch (e3) {
                }
              }
            }
            return result.length ? result : typ == "string" ? obj : obj + "\0";
          }
          function mixkey(seed, key2) {
            var stringseed = seed + "", smear, j3 = 0;
            while (j3 < stringseed.length) {
              key2[mask2 & j3] = mask2 & (smear ^= key2[mask2 & j3] * 19) + stringseed.charCodeAt(j3++);
            }
            return tostring(key2);
          }
          function autoseed() {
            try {
              if (nodecrypto) {
                return tostring(nodecrypto.randomBytes(width2));
              }
              var out = new Uint8Array(width2);
              (global.crypto || global.msCrypto).getRandomValues(out);
              return tostring(out);
            } catch (e3) {
              var browser = global.navigator, plugins = browser && browser.plugins;
              return [+/* @__PURE__ */ new Date(), global, plugins, global.screen, tostring(pool)];
            }
          }
          function tostring(a3) {
            return String.fromCharCode.apply(0, a3);
          }
          mixkey(math.random(), pool);
        }
        ;
        function initialize$2(BMMath2) {
          seedRandom([], BMMath2);
        }
        var propTypes = {
          SHAPE: "shape"
        };
        function _typeof$1(o3) {
          "@babel/helpers - typeof";
          return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof$1(o3);
        }
        var ExpressionManager = (function() {
          "use strict";
          var ob = {};
          var Math = BMMath;
          var window = null;
          var document = null;
          var XMLHttpRequest = null;
          var fetch = null;
          var frames = null;
          var _lottieGlobal = {};
          initialize$2(BMMath);
          function resetFrame() {
            _lottieGlobal = {};
          }
          function $bm_isInstanceOfArray(arr) {
            return arr.constructor === Array || arr.constructor === Float32Array;
          }
          function isNumerable(tOfV, v3) {
            return tOfV === "number" || v3 instanceof Number || tOfV === "boolean" || tOfV === "string";
          }
          function $bm_neg(a3) {
            var tOfA = _typeof$1(a3);
            if (tOfA === "number" || a3 instanceof Number || tOfA === "boolean") {
              return -a3;
            }
            if ($bm_isInstanceOfArray(a3)) {
              var i3;
              var lenA = a3.length;
              var retArr = [];
              for (i3 = 0; i3 < lenA; i3 += 1) {
                retArr[i3] = -a3[i3];
              }
              return retArr;
            }
            if (a3.propType) {
              return a3.v;
            }
            return -a3;
          }
          var easeInBez = BezierFactory.getBezierEasing(0.333, 0, 0.833, 0.833, "easeIn").get;
          var easeOutBez = BezierFactory.getBezierEasing(0.167, 0.167, 0.667, 1, "easeOut").get;
          var easeInOutBez = BezierFactory.getBezierEasing(0.33, 0, 0.667, 1, "easeInOut").get;
          function sum(a3, b2) {
            var tOfA = _typeof$1(a3);
            var tOfB = _typeof$1(b2);
            if (isNumerable(tOfA, a3) && isNumerable(tOfB, b2) || tOfA === "string" || tOfB === "string") {
              return a3 + b2;
            }
            if ($bm_isInstanceOfArray(a3) && isNumerable(tOfB, b2)) {
              a3 = a3.slice(0);
              a3[0] += b2;
              return a3;
            }
            if (isNumerable(tOfA, a3) && $bm_isInstanceOfArray(b2)) {
              b2 = b2.slice(0);
              b2[0] = a3 + b2[0];
              return b2;
            }
            if ($bm_isInstanceOfArray(a3) && $bm_isInstanceOfArray(b2)) {
              var i3 = 0;
              var lenA = a3.length;
              var lenB = b2.length;
              var retArr = [];
              while (i3 < lenA || i3 < lenB) {
                if ((typeof a3[i3] === "number" || a3[i3] instanceof Number) && (typeof b2[i3] === "number" || b2[i3] instanceof Number)) {
                  retArr[i3] = a3[i3] + b2[i3];
                } else {
                  retArr[i3] = b2[i3] === void 0 ? a3[i3] : a3[i3] || b2[i3];
                }
                i3 += 1;
              }
              return retArr;
            }
            return 0;
          }
          var add = sum;
          function sub(a3, b2) {
            var tOfA = _typeof$1(a3);
            var tOfB = _typeof$1(b2);
            if (isNumerable(tOfA, a3) && isNumerable(tOfB, b2)) {
              if (tOfA === "string") {
                a3 = parseInt(a3, 10);
              }
              if (tOfB === "string") {
                b2 = parseInt(b2, 10);
              }
              return a3 - b2;
            }
            if ($bm_isInstanceOfArray(a3) && isNumerable(tOfB, b2)) {
              a3 = a3.slice(0);
              a3[0] -= b2;
              return a3;
            }
            if (isNumerable(tOfA, a3) && $bm_isInstanceOfArray(b2)) {
              b2 = b2.slice(0);
              b2[0] = a3 - b2[0];
              return b2;
            }
            if ($bm_isInstanceOfArray(a3) && $bm_isInstanceOfArray(b2)) {
              var i3 = 0;
              var lenA = a3.length;
              var lenB = b2.length;
              var retArr = [];
              while (i3 < lenA || i3 < lenB) {
                if ((typeof a3[i3] === "number" || a3[i3] instanceof Number) && (typeof b2[i3] === "number" || b2[i3] instanceof Number)) {
                  retArr[i3] = a3[i3] - b2[i3];
                } else {
                  retArr[i3] = b2[i3] === void 0 ? a3[i3] : a3[i3] || b2[i3];
                }
                i3 += 1;
              }
              return retArr;
            }
            return 0;
          }
          function mul(a3, b2) {
            var tOfA = _typeof$1(a3);
            var tOfB = _typeof$1(b2);
            var arr;
            if (isNumerable(tOfA, a3) && isNumerable(tOfB, b2)) {
              return a3 * b2;
            }
            var i3;
            var len;
            if ($bm_isInstanceOfArray(a3) && isNumerable(tOfB, b2)) {
              len = a3.length;
              arr = createTypedArray("float32", len);
              for (i3 = 0; i3 < len; i3 += 1) {
                arr[i3] = a3[i3] * b2;
              }
              return arr;
            }
            if (isNumerable(tOfA, a3) && $bm_isInstanceOfArray(b2)) {
              len = b2.length;
              arr = createTypedArray("float32", len);
              for (i3 = 0; i3 < len; i3 += 1) {
                arr[i3] = a3 * b2[i3];
              }
              return arr;
            }
            return 0;
          }
          function div(a3, b2) {
            var tOfA = _typeof$1(a3);
            var tOfB = _typeof$1(b2);
            var arr;
            if (isNumerable(tOfA, a3) && isNumerable(tOfB, b2)) {
              return a3 / b2;
            }
            var i3;
            var len;
            if ($bm_isInstanceOfArray(a3) && isNumerable(tOfB, b2)) {
              len = a3.length;
              arr = createTypedArray("float32", len);
              for (i3 = 0; i3 < len; i3 += 1) {
                arr[i3] = a3[i3] / b2;
              }
              return arr;
            }
            if (isNumerable(tOfA, a3) && $bm_isInstanceOfArray(b2)) {
              len = b2.length;
              arr = createTypedArray("float32", len);
              for (i3 = 0; i3 < len; i3 += 1) {
                arr[i3] = a3 / b2[i3];
              }
              return arr;
            }
            return 0;
          }
          function mod(a3, b2) {
            if (typeof a3 === "string") {
              a3 = parseInt(a3, 10);
            }
            if (typeof b2 === "string") {
              b2 = parseInt(b2, 10);
            }
            return a3 % b2;
          }
          var $bm_sum = sum;
          var $bm_sub = sub;
          var $bm_mul = mul;
          var $bm_div = div;
          var $bm_mod = mod;
          function clamp(num, min, max) {
            if (min > max) {
              var mm = max;
              max = min;
              min = mm;
            }
            return Math.min(Math.max(num, min), max);
          }
          function radiansToDegrees(val2) {
            return val2 / degToRads;
          }
          var radians_to_degrees = radiansToDegrees;
          function degreesToRadians(val2) {
            return val2 * degToRads;
          }
          var degrees_to_radians = radiansToDegrees;
          var helperLengthArray = [0, 0, 0, 0, 0, 0];
          function length(arr1, arr2) {
            if (typeof arr1 === "number" || arr1 instanceof Number) {
              arr2 = arr2 || 0;
              return Math.abs(arr1 - arr2);
            }
            if (!arr2) {
              arr2 = helperLengthArray;
            }
            var i3;
            var len = Math.min(arr1.length, arr2.length);
            var addedLength = 0;
            for (i3 = 0; i3 < len; i3 += 1) {
              addedLength += Math.pow(arr2[i3] - arr1[i3], 2);
            }
            return Math.sqrt(addedLength);
          }
          function normalize(vec) {
            return div(vec, length(vec));
          }
          function rgbToHsl(val2) {
            var r3 = val2[0];
            var g3 = val2[1];
            var b2 = val2[2];
            var max = Math.max(r3, g3, b2);
            var min = Math.min(r3, g3, b2);
            var h3;
            var s3;
            var l3 = (max + min) / 2;
            if (max === min) {
              h3 = 0;
              s3 = 0;
            } else {
              var d3 = max - min;
              s3 = l3 > 0.5 ? d3 / (2 - max - min) : d3 / (max + min);
              switch (max) {
                case r3:
                  h3 = (g3 - b2) / d3 + (g3 < b2 ? 6 : 0);
                  break;
                case g3:
                  h3 = (b2 - r3) / d3 + 2;
                  break;
                case b2:
                  h3 = (r3 - g3) / d3 + 4;
                  break;
                default:
                  break;
              }
              h3 /= 6;
            }
            return [h3, s3, l3, val2[3]];
          }
          function hue2rgb(p3, q3, t3) {
            if (t3 < 0) t3 += 1;
            if (t3 > 1) t3 -= 1;
            if (t3 < 1 / 6) return p3 + (q3 - p3) * 6 * t3;
            if (t3 < 1 / 2) return q3;
            if (t3 < 2 / 3) return p3 + (q3 - p3) * (2 / 3 - t3) * 6;
            return p3;
          }
          function hslToRgb(val2) {
            var h3 = val2[0];
            var s3 = val2[1];
            var l3 = val2[2];
            var r3;
            var g3;
            var b2;
            if (s3 === 0) {
              r3 = l3;
              b2 = l3;
              g3 = l3;
            } else {
              var q3 = l3 < 0.5 ? l3 * (1 + s3) : l3 + s3 - l3 * s3;
              var p3 = 2 * l3 - q3;
              r3 = hue2rgb(p3, q3, h3 + 1 / 3);
              g3 = hue2rgb(p3, q3, h3);
              b2 = hue2rgb(p3, q3, h3 - 1 / 3);
            }
            return [r3, g3, b2, val2[3]];
          }
          function linear(t3, tMin, tMax, value1, value2) {
            if (value1 === void 0 || value2 === void 0) {
              value1 = tMin;
              value2 = tMax;
              tMin = 0;
              tMax = 1;
            }
            if (tMax < tMin) {
              var _tMin = tMax;
              tMax = tMin;
              tMin = _tMin;
            }
            if (t3 <= tMin) {
              return value1;
            }
            if (t3 >= tMax) {
              return value2;
            }
            var perc = tMax === tMin ? 0 : (t3 - tMin) / (tMax - tMin);
            if (!value1.length) {
              return value1 + (value2 - value1) * perc;
            }
            var i3;
            var len = value1.length;
            var arr = createTypedArray("float32", len);
            for (i3 = 0; i3 < len; i3 += 1) {
              arr[i3] = value1[i3] + (value2[i3] - value1[i3]) * perc;
            }
            return arr;
          }
          function random(min, max) {
            if (max === void 0) {
              if (min === void 0) {
                min = 0;
                max = 1;
              } else {
                max = min;
                min = void 0;
              }
            }
            if (max.length) {
              var i3;
              var len = max.length;
              if (!min) {
                min = createTypedArray("float32", len);
              }
              var arr = createTypedArray("float32", len);
              var rnd = BMMath.random();
              for (i3 = 0; i3 < len; i3 += 1) {
                arr[i3] = min[i3] + rnd * (max[i3] - min[i3]);
              }
              return arr;
            }
            if (min === void 0) {
              min = 0;
            }
            var rndm = BMMath.random();
            return min + rndm * (max - min);
          }
          function createPath(points, inTangents, outTangents, closed) {
            var i3;
            var len = points.length;
            var path = shapePool.newElement();
            path.setPathData(!!closed, len);
            var arrPlaceholder = [0, 0];
            var inVertexPoint;
            var outVertexPoint;
            for (i3 = 0; i3 < len; i3 += 1) {
              inVertexPoint = inTangents && inTangents[i3] ? inTangents[i3] : arrPlaceholder;
              outVertexPoint = outTangents && outTangents[i3] ? outTangents[i3] : arrPlaceholder;
              path.setTripleAt(points[i3][0], points[i3][1], outVertexPoint[0] + points[i3][0], outVertexPoint[1] + points[i3][1], inVertexPoint[0] + points[i3][0], inVertexPoint[1] + points[i3][1], i3, true);
            }
            return path;
          }
          function initiateExpression(elem, data, property) {
            function noOp(_value) {
              return _value;
            }
            if (!elem.globalData.renderConfig.runExpressions) {
              return noOp;
            }
            var val = data.x;
            var needsVelocity = /velocity(?![\w\d])/.test(val);
            var _needsRandom = val.indexOf("random") !== -1;
            var elemType = elem.data.ty;
            var transform;
            var $bm_transform;
            var content;
            var effect;
            var thisProperty = property;
            thisProperty._name = elem.data.nm;
            thisProperty.valueAtTime = thisProperty.getValueAtTime;
            Object.defineProperty(thisProperty, "value", {
              get: function get() {
                return thisProperty.v;
              }
            });
            elem.comp.frameDuration = 1 / elem.comp.globalData.frameRate;
            elem.comp.displayStartTime = 0;
            var inPoint = elem.data.ip / elem.comp.globalData.frameRate;
            var outPoint = elem.data.op / elem.comp.globalData.frameRate;
            var width = elem.data.sw ? elem.data.sw : 0;
            var height = elem.data.sh ? elem.data.sh : 0;
            var name = elem.data.nm;
            var loopIn;
            var loop_in;
            var loopOut;
            var loop_out;
            var smooth;
            var toWorld;
            var fromWorld;
            var fromComp;
            var toComp;
            var fromCompToSurface;
            var position;
            var rotation;
            var anchorPoint;
            var scale;
            var thisLayer;
            var thisComp;
            var mask;
            var valueAtTime;
            var velocityAtTime;
            var scoped_bm_rt;
            var expression_function = eval("[function _expression_function(){" + val + ";scoped_bm_rt=$bm_rt}]")[0];
            var numKeys = property.kf ? data.k.length : 0;
            var active = !this.data || this.data.hd !== true;
            var wiggle = (function wiggle2(freq, amp) {
              var iWiggle;
              var j3;
              var lenWiggle = this.pv.length ? this.pv.length : 1;
              var addedAmps = createTypedArray("float32", lenWiggle);
              freq = 5;
              var iterations = Math.floor(time * freq);
              iWiggle = 0;
              j3 = 0;
              while (iWiggle < iterations) {
                for (j3 = 0; j3 < lenWiggle; j3 += 1) {
                  addedAmps[j3] += -amp + amp * 2 * BMMath.random();
                }
                iWiggle += 1;
              }
              var periods = time * freq;
              var perc = periods - Math.floor(periods);
              var arr = createTypedArray("float32", lenWiggle);
              if (lenWiggle > 1) {
                for (j3 = 0; j3 < lenWiggle; j3 += 1) {
                  arr[j3] = this.pv[j3] + addedAmps[j3] + (-amp + amp * 2 * BMMath.random()) * perc;
                }
                return arr;
              }
              return this.pv + addedAmps[0] + (-amp + amp * 2 * BMMath.random()) * perc;
            }).bind(this);
            if (thisProperty.loopIn) {
              loopIn = thisProperty.loopIn.bind(thisProperty);
              loop_in = loopIn;
            }
            if (thisProperty.loopOut) {
              loopOut = thisProperty.loopOut.bind(thisProperty);
              loop_out = loopOut;
            }
            if (thisProperty.smooth) {
              smooth = thisProperty.smooth.bind(thisProperty);
            }
            function loopInDuration(type, duration) {
              return loopIn(type, duration, true);
            }
            function loopOutDuration(type, duration) {
              return loopOut(type, duration, true);
            }
            if (this.getValueAtTime) {
              valueAtTime = this.getValueAtTime.bind(this);
            }
            if (this.getVelocityAtTime) {
              velocityAtTime = this.getVelocityAtTime.bind(this);
            }
            var comp = elem.comp.globalData.projectInterface.bind(elem.comp.globalData.projectInterface);
            function lookAt(elem1, elem2) {
              var fVec = [elem2[0] - elem1[0], elem2[1] - elem1[1], elem2[2] - elem1[2]];
              var pitch = Math.atan2(fVec[0], Math.sqrt(fVec[1] * fVec[1] + fVec[2] * fVec[2])) / degToRads;
              var yaw = -Math.atan2(fVec[1], fVec[2]) / degToRads;
              return [yaw, pitch, 0];
            }
            function easeOut(t3, tMin, tMax, val1, val2) {
              return applyEase(easeOutBez, t3, tMin, tMax, val1, val2);
            }
            function easeIn(t3, tMin, tMax, val1, val2) {
              return applyEase(easeInBez, t3, tMin, tMax, val1, val2);
            }
            function ease(t3, tMin, tMax, val1, val2) {
              return applyEase(easeInOutBez, t3, tMin, tMax, val1, val2);
            }
            function applyEase(fn, t3, tMin, tMax, val1, val2) {
              if (val1 === void 0) {
                val1 = tMin;
                val2 = tMax;
              } else {
                t3 = (t3 - tMin) / (tMax - tMin);
              }
              if (t3 > 1) {
                t3 = 1;
              } else if (t3 < 0) {
                t3 = 0;
              }
              var mult = fn(t3);
              if ($bm_isInstanceOfArray(val1)) {
                var iKey;
                var lenKey = val1.length;
                var arr = createTypedArray("float32", lenKey);
                for (iKey = 0; iKey < lenKey; iKey += 1) {
                  arr[iKey] = (val2[iKey] - val1[iKey]) * mult + val1[iKey];
                }
                return arr;
              }
              return (val2 - val1) * mult + val1;
            }
            function nearestKey(time2) {
              var iKey;
              var lenKey = data.k.length;
              var index2;
              var keyTime;
              if (!data.k.length || typeof data.k[0] === "number") {
                index2 = 0;
                keyTime = 0;
              } else {
                index2 = -1;
                time2 *= elem.comp.globalData.frameRate;
                if (time2 < data.k[0].t) {
                  index2 = 1;
                  keyTime = data.k[0].t;
                } else {
                  for (iKey = 0; iKey < lenKey - 1; iKey += 1) {
                    if (time2 === data.k[iKey].t) {
                      index2 = iKey + 1;
                      keyTime = data.k[iKey].t;
                      break;
                    } else if (time2 > data.k[iKey].t && time2 < data.k[iKey + 1].t) {
                      if (time2 - data.k[iKey].t > data.k[iKey + 1].t - time2) {
                        index2 = iKey + 2;
                        keyTime = data.k[iKey + 1].t;
                      } else {
                        index2 = iKey + 1;
                        keyTime = data.k[iKey].t;
                      }
                      break;
                    }
                  }
                  if (index2 === -1) {
                    index2 = iKey + 1;
                    keyTime = data.k[iKey].t;
                  }
                }
              }
              var obKey = {};
              obKey.index = index2;
              obKey.time = keyTime / elem.comp.globalData.frameRate;
              return obKey;
            }
            function key(ind) {
              var obKey;
              var iKey;
              var lenKey;
              if (!data.k.length || typeof data.k[0] === "number") {
                throw new Error("The property has no keyframe at index " + ind);
              }
              ind -= 1;
              obKey = {
                time: data.k[ind].t / elem.comp.globalData.frameRate,
                value: []
              };
              var arr = Object.prototype.hasOwnProperty.call(data.k[ind], "s") ? data.k[ind].s : data.k[ind - 1].e;
              lenKey = arr.length;
              for (iKey = 0; iKey < lenKey; iKey += 1) {
                obKey[iKey] = arr[iKey];
                obKey.value[iKey] = arr[iKey];
              }
              return obKey;
            }
            function framesToTime(fr, fps) {
              if (!fps) {
                fps = elem.comp.globalData.frameRate;
              }
              return fr / fps;
            }
            function timeToFrames(t3, fps) {
              if (!t3 && t3 !== 0) {
                t3 = time;
              }
              if (!fps) {
                fps = elem.comp.globalData.frameRate;
              }
              return t3 * fps;
            }
            function seedRandom(seed) {
              BMMath.seedrandom(randSeed + seed);
            }
            function sourceRectAtTime() {
              return elem.sourceRectAtTime();
            }
            function substring(init2, end) {
              if (typeof value === "string") {
                if (end === void 0) {
                  return value.substring(init2);
                }
                return value.substring(init2, end);
              }
              return "";
            }
            function substr(init2, end) {
              if (typeof value === "string") {
                if (end === void 0) {
                  return value.substr(init2);
                }
                return value.substr(init2, end);
              }
              return "";
            }
            function posterizeTime(framesPerSecond) {
              time = framesPerSecond === 0 ? 0 : Math.floor(time * framesPerSecond) / framesPerSecond;
              value = valueAtTime(time);
            }
            var time;
            var velocity;
            var value;
            var text;
            var textIndex;
            var textTotal;
            var selectorValue;
            var index = elem.data.ind;
            var hasParent = !!(elem.hierarchy && elem.hierarchy.length);
            var parent;
            var randSeed = Math.floor(Math.random() * 1e6);
            var globalData = elem.globalData;
            function executeExpression(_value) {
              value = _value;
              if (this.frameExpressionId === elem.globalData.frameId && this.propType !== "textSelector") {
                return value;
              }
              if (this.propType === "textSelector") {
                textIndex = this.textIndex;
                textTotal = this.textTotal;
                selectorValue = this.selectorValue;
              }
              if (!thisLayer) {
                text = elem.layerInterface.text;
                thisLayer = elem.layerInterface;
                thisComp = elem.comp.compInterface;
                toWorld = thisLayer.toWorld.bind(thisLayer);
                fromWorld = thisLayer.fromWorld.bind(thisLayer);
                fromComp = thisLayer.fromComp.bind(thisLayer);
                toComp = thisLayer.toComp.bind(thisLayer);
                mask = thisLayer.mask ? thisLayer.mask.bind(thisLayer) : null;
                fromCompToSurface = fromComp;
              }
              if (!transform) {
                transform = elem.layerInterface("ADBE Transform Group");
                $bm_transform = transform;
                if (transform) {
                  anchorPoint = transform.anchorPoint;
                }
              }
              if (elemType === 4 && !content) {
                content = thisLayer("ADBE Root Vectors Group");
              }
              if (!effect) {
                effect = thisLayer(4);
              }
              hasParent = !!(elem.hierarchy && elem.hierarchy.length);
              if (hasParent && !parent) {
                parent = elem.hierarchy[0].layerInterface;
              }
              time = this.comp.renderedFrame / this.comp.globalData.frameRate;
              if (_needsRandom) {
                seedRandom(randSeed + time);
              }
              if (needsVelocity) {
                velocity = velocityAtTime(time);
              }
              expression_function();
              this.frameExpressionId = elem.globalData.frameId;
              scoped_bm_rt = scoped_bm_rt.propType === propTypes.SHAPE ? scoped_bm_rt.v : scoped_bm_rt;
              return scoped_bm_rt;
            }
            executeExpression.__preventDeadCodeRemoval = [$bm_transform, anchorPoint, time, velocity, inPoint, outPoint, width, height, name, loop_in, loop_out, smooth, toComp, fromCompToSurface, toWorld, fromWorld, mask, position, rotation, scale, thisComp, numKeys, active, wiggle, loopInDuration, loopOutDuration, comp, lookAt, easeOut, easeIn, ease, nearestKey, key, text, textIndex, textTotal, selectorValue, framesToTime, timeToFrames, sourceRectAtTime, substring, substr, posterizeTime, index, globalData];
            return executeExpression;
          }
          ob.initiateExpression = initiateExpression;
          ob.__preventDeadCodeRemoval = [window, document, XMLHttpRequest, fetch, frames, $bm_neg, add, $bm_sum, $bm_sub, $bm_mul, $bm_div, $bm_mod, clamp, radians_to_degrees, degreesToRadians, degrees_to_radians, normalize, rgbToHsl, hslToRgb, linear, random, createPath, _lottieGlobal];
          ob.resetFrame = resetFrame;
          return ob;
        })();
        var Expressions = (function() {
          var ob2 = {};
          ob2.initExpressions = initExpressions;
          ob2.resetFrame = ExpressionManager.resetFrame;
          function initExpressions(animation) {
            var stackCount = 0;
            var registers = [];
            function pushExpression() {
              stackCount += 1;
            }
            function popExpression() {
              stackCount -= 1;
              if (stackCount === 0) {
                releaseInstances();
              }
            }
            function registerExpressionProperty(expression) {
              if (registers.indexOf(expression) === -1) {
                registers.push(expression);
              }
            }
            function releaseInstances() {
              var i3;
              var len = registers.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                registers[i3].release();
              }
              registers.length = 0;
            }
            animation.renderer.compInterface = CompExpressionInterface(animation.renderer);
            animation.renderer.globalData.projectInterface.registerComposition(animation.renderer);
            animation.renderer.globalData.pushExpression = pushExpression;
            animation.renderer.globalData.popExpression = popExpression;
            animation.renderer.globalData.registerExpressionProperty = registerExpressionProperty;
          }
          return ob2;
        })();
        var MaskManagerInterface = (function() {
          function MaskInterface(mask2, data2) {
            this._mask = mask2;
            this._data = data2;
          }
          Object.defineProperty(MaskInterface.prototype, "maskPath", {
            get: function get() {
              if (this._mask.prop.k) {
                this._mask.prop.getValue();
              }
              return this._mask.prop;
            }
          });
          Object.defineProperty(MaskInterface.prototype, "maskOpacity", {
            get: function get() {
              if (this._mask.op.k) {
                this._mask.op.getValue();
              }
              return this._mask.op.v * 100;
            }
          });
          var MaskManager = function MaskManager2(maskManager) {
            var _masksInterfaces = createSizedArray(maskManager.viewData.length);
            var i3;
            var len = maskManager.viewData.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              _masksInterfaces[i3] = new MaskInterface(maskManager.viewData[i3], maskManager.masksProperties[i3]);
            }
            var maskFunction = function maskFunction2(name2) {
              i3 = 0;
              while (i3 < len) {
                if (maskManager.masksProperties[i3].nm === name2) {
                  return _masksInterfaces[i3];
                }
                i3 += 1;
              }
              return null;
            };
            return maskFunction;
          };
          return MaskManager;
        })();
        var ExpressionPropertyInterface = /* @__PURE__ */ (function() {
          var defaultUnidimensionalValue = {
            pv: 0,
            v: 0,
            mult: 1
          };
          var defaultMultidimensionalValue = {
            pv: [0, 0, 0],
            v: [0, 0, 0],
            mult: 1
          };
          function completeProperty(expressionValue, property2, type) {
            Object.defineProperty(expressionValue, "velocity", {
              get: function get() {
                return property2.getVelocityAtTime(property2.comp.currentFrame);
              }
            });
            expressionValue.numKeys = property2.keyframes ? property2.keyframes.length : 0;
            expressionValue.key = function(pos) {
              if (!expressionValue.numKeys) {
                return 0;
              }
              var value2 = "";
              if ("s" in property2.keyframes[pos - 1]) {
                value2 = property2.keyframes[pos - 1].s;
              } else if ("e" in property2.keyframes[pos - 2]) {
                value2 = property2.keyframes[pos - 2].e;
              } else {
                value2 = property2.keyframes[pos - 2].s;
              }
              var valueProp = type === "unidimensional" ? new Number(value2) : Object.assign({}, value2);
              valueProp.time = property2.keyframes[pos - 1].t / property2.elem.comp.globalData.frameRate;
              valueProp.value = type === "unidimensional" ? value2[0] : value2;
              return valueProp;
            };
            expressionValue.valueAtTime = property2.getValueAtTime;
            expressionValue.speedAtTime = property2.getSpeedAtTime;
            expressionValue.velocityAtTime = property2.getVelocityAtTime;
            expressionValue.propertyGroup = property2.propertyGroup;
          }
          function UnidimensionalPropertyInterface(property2) {
            if (!property2 || !("pv" in property2)) {
              property2 = defaultUnidimensionalValue;
            }
            var mult = 1 / property2.mult;
            var val2 = property2.pv * mult;
            var expressionValue = new Number(val2);
            expressionValue.value = val2;
            completeProperty(expressionValue, property2, "unidimensional");
            return function() {
              if (property2.k) {
                property2.getValue();
              }
              val2 = property2.v * mult;
              if (expressionValue.value !== val2) {
                expressionValue = new Number(val2);
                expressionValue.value = val2;
                expressionValue[0] = val2;
                completeProperty(expressionValue, property2, "unidimensional");
              }
              return expressionValue;
            };
          }
          function MultidimensionalPropertyInterface(property2) {
            if (!property2 || !("pv" in property2)) {
              property2 = defaultMultidimensionalValue;
            }
            var mult = 1 / property2.mult;
            var len = property2.data && property2.data.l || property2.pv.length;
            var expressionValue = createTypedArray("float32", len);
            var arrValue = createTypedArray("float32", len);
            expressionValue.value = arrValue;
            completeProperty(expressionValue, property2, "multidimensional");
            return function() {
              if (property2.k) {
                property2.getValue();
              }
              for (var i3 = 0; i3 < len; i3 += 1) {
                arrValue[i3] = property2.v[i3] * mult;
                expressionValue[i3] = arrValue[i3];
              }
              return expressionValue;
            };
          }
          function defaultGetter() {
            return defaultUnidimensionalValue;
          }
          return function(property2) {
            if (!property2) {
              return defaultGetter;
            }
            if (property2.propType === "unidimensional") {
              return UnidimensionalPropertyInterface(property2);
            }
            return MultidimensionalPropertyInterface(property2);
          };
        })();
        var TransformExpressionInterface = /* @__PURE__ */ (function() {
          return function(transform2) {
            function _thisFunction(name2) {
              switch (name2) {
                case "scale":
                case "Scale":
                case "ADBE Scale":
                case 6:
                  return _thisFunction.scale;
                case "rotation":
                case "Rotation":
                case "ADBE Rotation":
                case "ADBE Rotate Z":
                case 10:
                  return _thisFunction.rotation;
                case "ADBE Rotate X":
                  return _thisFunction.xRotation;
                case "ADBE Rotate Y":
                  return _thisFunction.yRotation;
                case "position":
                case "Position":
                case "ADBE Position":
                case 2:
                  return _thisFunction.position;
                case "ADBE Position_0":
                  return _thisFunction.xPosition;
                case "ADBE Position_1":
                  return _thisFunction.yPosition;
                case "ADBE Position_2":
                  return _thisFunction.zPosition;
                case "anchorPoint":
                case "AnchorPoint":
                case "Anchor Point":
                case "ADBE AnchorPoint":
                case 1:
                  return _thisFunction.anchorPoint;
                case "opacity":
                case "Opacity":
                case 11:
                  return _thisFunction.opacity;
                default:
                  return null;
              }
            }
            Object.defineProperty(_thisFunction, "rotation", {
              get: ExpressionPropertyInterface(transform2.r || transform2.rz)
            });
            Object.defineProperty(_thisFunction, "zRotation", {
              get: ExpressionPropertyInterface(transform2.rz || transform2.r)
            });
            Object.defineProperty(_thisFunction, "xRotation", {
              get: ExpressionPropertyInterface(transform2.rx)
            });
            Object.defineProperty(_thisFunction, "yRotation", {
              get: ExpressionPropertyInterface(transform2.ry)
            });
            Object.defineProperty(_thisFunction, "scale", {
              get: ExpressionPropertyInterface(transform2.s)
            });
            var _px;
            var _py;
            var _pz;
            var _transformFactory;
            if (transform2.p) {
              _transformFactory = ExpressionPropertyInterface(transform2.p);
            } else {
              _px = ExpressionPropertyInterface(transform2.px);
              _py = ExpressionPropertyInterface(transform2.py);
              if (transform2.pz) {
                _pz = ExpressionPropertyInterface(transform2.pz);
              }
            }
            Object.defineProperty(_thisFunction, "position", {
              get: function get() {
                if (transform2.p) {
                  return _transformFactory();
                }
                return [_px(), _py(), _pz ? _pz() : 0];
              }
            });
            Object.defineProperty(_thisFunction, "xPosition", {
              get: ExpressionPropertyInterface(transform2.px)
            });
            Object.defineProperty(_thisFunction, "yPosition", {
              get: ExpressionPropertyInterface(transform2.py)
            });
            Object.defineProperty(_thisFunction, "zPosition", {
              get: ExpressionPropertyInterface(transform2.pz)
            });
            Object.defineProperty(_thisFunction, "anchorPoint", {
              get: ExpressionPropertyInterface(transform2.a)
            });
            Object.defineProperty(_thisFunction, "opacity", {
              get: ExpressionPropertyInterface(transform2.o)
            });
            Object.defineProperty(_thisFunction, "skew", {
              get: ExpressionPropertyInterface(transform2.sk)
            });
            Object.defineProperty(_thisFunction, "skewAxis", {
              get: ExpressionPropertyInterface(transform2.sa)
            });
            Object.defineProperty(_thisFunction, "orientation", {
              get: ExpressionPropertyInterface(transform2.or)
            });
            return _thisFunction;
          };
        })();
        var LayerExpressionInterface = /* @__PURE__ */ (function() {
          function getMatrix(time2) {
            var toWorldMat = new Matrix();
            if (time2 !== void 0) {
              var propMatrix = this._elem.finalTransform.mProp.getValueAtTime(time2);
              propMatrix.clone(toWorldMat);
            } else {
              var transformMat = this._elem.finalTransform.mProp;
              transformMat.applyToMatrix(toWorldMat);
            }
            return toWorldMat;
          }
          function toWorldVec(arr, time2) {
            var toWorldMat = this.getMatrix(time2);
            toWorldMat.props[12] = 0;
            toWorldMat.props[13] = 0;
            toWorldMat.props[14] = 0;
            return this.applyPoint(toWorldMat, arr);
          }
          function toWorld2(arr, time2) {
            var toWorldMat = this.getMatrix(time2);
            return this.applyPoint(toWorldMat, arr);
          }
          function fromWorldVec(arr, time2) {
            var toWorldMat = this.getMatrix(time2);
            toWorldMat.props[12] = 0;
            toWorldMat.props[13] = 0;
            toWorldMat.props[14] = 0;
            return this.invertPoint(toWorldMat, arr);
          }
          function fromWorld2(arr, time2) {
            var toWorldMat = this.getMatrix(time2);
            return this.invertPoint(toWorldMat, arr);
          }
          function applyPoint(matrix, arr) {
            if (this._elem.hierarchy && this._elem.hierarchy.length) {
              var i3;
              var len = this._elem.hierarchy.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this._elem.hierarchy[i3].finalTransform.mProp.applyToMatrix(matrix);
              }
            }
            return matrix.applyToPointArray(arr[0], arr[1], arr[2] || 0);
          }
          function invertPoint(matrix, arr) {
            if (this._elem.hierarchy && this._elem.hierarchy.length) {
              var i3;
              var len = this._elem.hierarchy.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this._elem.hierarchy[i3].finalTransform.mProp.applyToMatrix(matrix);
              }
            }
            return matrix.inversePoint(arr);
          }
          function fromComp2(arr) {
            var toWorldMat = new Matrix();
            toWorldMat.reset();
            this._elem.finalTransform.mProp.applyToMatrix(toWorldMat);
            if (this._elem.hierarchy && this._elem.hierarchy.length) {
              var i3;
              var len = this._elem.hierarchy.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                this._elem.hierarchy[i3].finalTransform.mProp.applyToMatrix(toWorldMat);
              }
              return toWorldMat.inversePoint(arr);
            }
            return toWorldMat.inversePoint(arr);
          }
          function sampleImage() {
            return [1, 1, 1, 1];
          }
          return function(elem2) {
            var transformInterface;
            function _registerMaskInterface(maskManager) {
              _thisLayerFunction.mask = new MaskManagerInterface(maskManager, elem2);
            }
            function _registerEffectsInterface(effects) {
              _thisLayerFunction.effect = effects;
            }
            function _thisLayerFunction(name2) {
              switch (name2) {
                case "ADBE Root Vectors Group":
                case "Contents":
                case 2:
                  return _thisLayerFunction.shapeInterface;
                case 1:
                case 6:
                case "Transform":
                case "transform":
                case "ADBE Transform Group":
                  return transformInterface;
                case 4:
                case "ADBE Effect Parade":
                case "effects":
                case "Effects":
                  return _thisLayerFunction.effect;
                case "ADBE Text Properties":
                  return _thisLayerFunction.textInterface;
                default:
                  return null;
              }
            }
            _thisLayerFunction.getMatrix = getMatrix;
            _thisLayerFunction.invertPoint = invertPoint;
            _thisLayerFunction.applyPoint = applyPoint;
            _thisLayerFunction.toWorld = toWorld2;
            _thisLayerFunction.toWorldVec = toWorldVec;
            _thisLayerFunction.fromWorld = fromWorld2;
            _thisLayerFunction.fromWorldVec = fromWorldVec;
            _thisLayerFunction.toComp = toWorld2;
            _thisLayerFunction.fromComp = fromComp2;
            _thisLayerFunction.sampleImage = sampleImage;
            _thisLayerFunction.sourceRectAtTime = elem2.sourceRectAtTime.bind(elem2);
            _thisLayerFunction._elem = elem2;
            transformInterface = TransformExpressionInterface(elem2.finalTransform.mProp);
            var anchorPointDescriptor = getDescriptor(transformInterface, "anchorPoint");
            Object.defineProperties(_thisLayerFunction, {
              hasParent: {
                get: function get() {
                  return elem2.hierarchy.length;
                }
              },
              parent: {
                get: function get() {
                  return elem2.hierarchy[0].layerInterface;
                }
              },
              rotation: getDescriptor(transformInterface, "rotation"),
              scale: getDescriptor(transformInterface, "scale"),
              position: getDescriptor(transformInterface, "position"),
              opacity: getDescriptor(transformInterface, "opacity"),
              anchorPoint: anchorPointDescriptor,
              anchor_point: anchorPointDescriptor,
              transform: {
                get: function get() {
                  return transformInterface;
                }
              },
              active: {
                get: function get() {
                  return elem2.isInRange;
                }
              }
            });
            _thisLayerFunction.startTime = elem2.data.st;
            _thisLayerFunction.index = elem2.data.ind;
            _thisLayerFunction.source = elem2.data.refId;
            _thisLayerFunction.height = elem2.data.ty === 0 ? elem2.data.h : 100;
            _thisLayerFunction.width = elem2.data.ty === 0 ? elem2.data.w : 100;
            _thisLayerFunction.inPoint = elem2.data.ip / elem2.comp.globalData.frameRate;
            _thisLayerFunction.outPoint = elem2.data.op / elem2.comp.globalData.frameRate;
            _thisLayerFunction._name = elem2.data.nm;
            _thisLayerFunction.registerMaskInterface = _registerMaskInterface;
            _thisLayerFunction.registerEffectsInterface = _registerEffectsInterface;
            return _thisLayerFunction;
          };
        })();
        var propertyGroupFactory = /* @__PURE__ */ (function() {
          return function(interfaceFunction, parentPropertyGroup) {
            return function(val2) {
              val2 = val2 === void 0 ? 1 : val2;
              if (val2 <= 0) {
                return interfaceFunction;
              }
              return parentPropertyGroup(val2 - 1);
            };
          };
        })();
        var PropertyInterface = /* @__PURE__ */ (function() {
          return function(propertyName, propertyGroup) {
            var interfaceFunction = {
              _name: propertyName
            };
            function _propertyGroup(val2) {
              val2 = val2 === void 0 ? 1 : val2;
              if (val2 <= 0) {
                return interfaceFunction;
              }
              return propertyGroup(val2 - 1);
            }
            return _propertyGroup;
          };
        })();
        var EffectsExpressionInterface = /* @__PURE__ */ (function() {
          var ob2 = {
            createEffectsInterface
          };
          function createEffectsInterface(elem2, propertyGroup) {
            if (elem2.effectsManager) {
              var effectElements = [];
              var effectsData = elem2.data.ef;
              var i3;
              var len = elem2.effectsManager.effectElements.length;
              for (i3 = 0; i3 < len; i3 += 1) {
                effectElements.push(createGroupInterface(effectsData[i3], elem2.effectsManager.effectElements[i3], propertyGroup, elem2));
              }
              var effects = elem2.data.ef || [];
              var groupInterface = function groupInterface2(name2) {
                i3 = 0;
                len = effects.length;
                while (i3 < len) {
                  if (name2 === effects[i3].nm || name2 === effects[i3].mn || name2 === effects[i3].ix) {
                    return effectElements[i3];
                  }
                  i3 += 1;
                }
                return null;
              };
              Object.defineProperty(groupInterface, "numProperties", {
                get: function get() {
                  return effects.length;
                }
              });
              return groupInterface;
            }
            return null;
          }
          function createGroupInterface(data2, elements, propertyGroup, elem2) {
            function groupInterface(name2) {
              var effects = data2.ef;
              var i4 = 0;
              var len2 = effects.length;
              while (i4 < len2) {
                if (name2 === effects[i4].nm || name2 === effects[i4].mn || name2 === effects[i4].ix) {
                  if (effects[i4].ty === 5) {
                    return effectElements[i4];
                  }
                  return effectElements[i4]();
                }
                i4 += 1;
              }
              throw new Error();
            }
            var _propertyGroup = propertyGroupFactory(groupInterface, propertyGroup);
            var effectElements = [];
            var i3;
            var len = data2.ef.length;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (data2.ef[i3].ty === 5) {
                effectElements.push(createGroupInterface(data2.ef[i3], elements.effectElements[i3], elements.effectElements[i3].propertyGroup, elem2));
              } else {
                effectElements.push(createValueInterface(elements.effectElements[i3], data2.ef[i3].ty, elem2, _propertyGroup));
              }
            }
            if (data2.mn === "ADBE Color Control") {
              Object.defineProperty(groupInterface, "color", {
                get: function get() {
                  return effectElements[0]();
                }
              });
            }
            Object.defineProperties(groupInterface, {
              numProperties: {
                get: function get() {
                  return data2.np;
                }
              },
              _name: {
                value: data2.nm
              },
              propertyGroup: {
                value: _propertyGroup
              }
            });
            groupInterface.enabled = data2.en !== 0;
            groupInterface.active = groupInterface.enabled;
            return groupInterface;
          }
          function createValueInterface(element, type, elem2, propertyGroup) {
            var expressionProperty = ExpressionPropertyInterface(element.p);
            function interfaceFunction() {
              if (type === 10) {
                return elem2.comp.compInterface(element.p.v);
              }
              return expressionProperty();
            }
            if (element.p.setGroupProperty) {
              element.p.setGroupProperty(PropertyInterface("", propertyGroup));
            }
            return interfaceFunction;
          }
          return ob2;
        })();
        var ShapePathInterface = /* @__PURE__ */ (function() {
          return function pathInterfaceFactory(shape, view, propertyGroup) {
            var prop = view.sh;
            function interfaceFunction(val2) {
              if (val2 === "Shape" || val2 === "shape" || val2 === "Path" || val2 === "path" || val2 === "ADBE Vector Shape" || val2 === 2) {
                return interfaceFunction.path;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            prop.setGroupProperty(PropertyInterface("Path", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              path: {
                get: function get() {
                  if (prop.k) {
                    prop.getValue();
                  }
                  return prop;
                }
              },
              shape: {
                get: function get() {
                  if (prop.k) {
                    prop.getValue();
                  }
                  return prop;
                }
              },
              _name: {
                value: shape.nm
              },
              ix: {
                value: shape.ix
              },
              propertyIndex: {
                value: shape.ix
              },
              mn: {
                value: shape.mn
              },
              propertyGroup: {
                value: propertyGroup
              }
            });
            return interfaceFunction;
          };
        })();
        var ShapeExpressionInterface = /* @__PURE__ */ (function() {
          function iterateElements(shapes, view, propertyGroup) {
            var arr = [];
            var i3;
            var len = shapes ? shapes.length : 0;
            for (i3 = 0; i3 < len; i3 += 1) {
              if (shapes[i3].ty === "gr") {
                arr.push(groupInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "fl") {
                arr.push(fillInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "st") {
                arr.push(strokeInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "tm") {
                arr.push(trimInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "tr") {
              } else if (shapes[i3].ty === "el") {
                arr.push(ellipseInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "sr") {
                arr.push(starInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "sh") {
                arr.push(ShapePathInterface(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "rc") {
                arr.push(rectInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "rd") {
                arr.push(roundedInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "rp") {
                arr.push(repeaterInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else if (shapes[i3].ty === "gf") {
                arr.push(gradientFillInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              } else {
                arr.push(defaultInterfaceFactory(shapes[i3], view[i3], propertyGroup));
              }
            }
            return arr;
          }
          function contentsInterfaceFactory(shape, view, propertyGroup) {
            var interfaces2;
            var interfaceFunction = function _interfaceFunction(value2) {
              var i3 = 0;
              var len = interfaces2.length;
              while (i3 < len) {
                if (interfaces2[i3]._name === value2 || interfaces2[i3].mn === value2 || interfaces2[i3].propertyIndex === value2 || interfaces2[i3].ix === value2 || interfaces2[i3].ind === value2) {
                  return interfaces2[i3];
                }
                i3 += 1;
              }
              if (typeof value2 === "number") {
                return interfaces2[value2 - 1];
              }
              return null;
            };
            interfaceFunction.propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            interfaces2 = iterateElements(shape.it, view.it, interfaceFunction.propertyGroup);
            interfaceFunction.numProperties = interfaces2.length;
            var transformInterface = transformInterfaceFactory(shape.it[shape.it.length - 1], view.it[view.it.length - 1], interfaceFunction.propertyGroup);
            interfaceFunction.transform = transformInterface;
            interfaceFunction.propertyIndex = shape.cix;
            interfaceFunction._name = shape.nm;
            return interfaceFunction;
          }
          function groupInterfaceFactory(shape, view, propertyGroup) {
            var interfaceFunction = function _interfaceFunction(value2) {
              switch (value2) {
                case "ADBE Vectors Group":
                case "Contents":
                case 2:
                  return interfaceFunction.content;
                // Not necessary for now. Keeping them here in case a new case appears
                // case 'ADBE Vector Transform Group':
                // case 3:
                default:
                  return interfaceFunction.transform;
              }
            };
            interfaceFunction.propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var content2 = contentsInterfaceFactory(shape, view, interfaceFunction.propertyGroup);
            var transformInterface = transformInterfaceFactory(shape.it[shape.it.length - 1], view.it[view.it.length - 1], interfaceFunction.propertyGroup);
            interfaceFunction.content = content2;
            interfaceFunction.transform = transformInterface;
            Object.defineProperty(interfaceFunction, "_name", {
              get: function get() {
                return shape.nm;
              }
            });
            interfaceFunction.numProperties = shape.np;
            interfaceFunction.propertyIndex = shape.ix;
            interfaceFunction.nm = shape.nm;
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function fillInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(val2) {
              if (val2 === "Color" || val2 === "color") {
                return interfaceFunction.color;
              }
              if (val2 === "Opacity" || val2 === "opacity") {
                return interfaceFunction.opacity;
              }
              return null;
            }
            Object.defineProperties(interfaceFunction, {
              color: {
                get: ExpressionPropertyInterface(view.c)
              },
              opacity: {
                get: ExpressionPropertyInterface(view.o)
              },
              _name: {
                value: shape.nm
              },
              mn: {
                value: shape.mn
              }
            });
            view.c.setGroupProperty(PropertyInterface("Color", propertyGroup));
            view.o.setGroupProperty(PropertyInterface("Opacity", propertyGroup));
            return interfaceFunction;
          }
          function gradientFillInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(val2) {
              if (val2 === "Start Point" || val2 === "start point") {
                return interfaceFunction.startPoint;
              }
              if (val2 === "End Point" || val2 === "end point") {
                return interfaceFunction.endPoint;
              }
              if (val2 === "Opacity" || val2 === "opacity") {
                return interfaceFunction.opacity;
              }
              return null;
            }
            Object.defineProperties(interfaceFunction, {
              startPoint: {
                get: ExpressionPropertyInterface(view.s)
              },
              endPoint: {
                get: ExpressionPropertyInterface(view.e)
              },
              opacity: {
                get: ExpressionPropertyInterface(view.o)
              },
              type: {
                get: function get() {
                  return "a";
                }
              },
              _name: {
                value: shape.nm
              },
              mn: {
                value: shape.mn
              }
            });
            view.s.setGroupProperty(PropertyInterface("Start Point", propertyGroup));
            view.e.setGroupProperty(PropertyInterface("End Point", propertyGroup));
            view.o.setGroupProperty(PropertyInterface("Opacity", propertyGroup));
            return interfaceFunction;
          }
          function defaultInterfaceFactory() {
            function interfaceFunction() {
              return null;
            }
            return interfaceFunction;
          }
          function strokeInterfaceFactory(shape, view, propertyGroup) {
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var _dashPropertyGroup = propertyGroupFactory(dashOb, _propertyGroup);
            function addPropertyToDashOb(i4) {
              Object.defineProperty(dashOb, shape.d[i4].nm, {
                get: ExpressionPropertyInterface(view.d.dataProps[i4].p)
              });
            }
            var i3;
            var len = shape.d ? shape.d.length : 0;
            var dashOb = {};
            for (i3 = 0; i3 < len; i3 += 1) {
              addPropertyToDashOb(i3);
              view.d.dataProps[i3].p.setGroupProperty(_dashPropertyGroup);
            }
            function interfaceFunction(val2) {
              if (val2 === "Color" || val2 === "color") {
                return interfaceFunction.color;
              }
              if (val2 === "Opacity" || val2 === "opacity") {
                return interfaceFunction.opacity;
              }
              if (val2 === "Stroke Width" || val2 === "stroke width") {
                return interfaceFunction.strokeWidth;
              }
              return null;
            }
            Object.defineProperties(interfaceFunction, {
              color: {
                get: ExpressionPropertyInterface(view.c)
              },
              opacity: {
                get: ExpressionPropertyInterface(view.o)
              },
              strokeWidth: {
                get: ExpressionPropertyInterface(view.w)
              },
              dash: {
                get: function get() {
                  return dashOb;
                }
              },
              _name: {
                value: shape.nm
              },
              mn: {
                value: shape.mn
              }
            });
            view.c.setGroupProperty(PropertyInterface("Color", _propertyGroup));
            view.o.setGroupProperty(PropertyInterface("Opacity", _propertyGroup));
            view.w.setGroupProperty(PropertyInterface("Stroke Width", _propertyGroup));
            return interfaceFunction;
          }
          function trimInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(val2) {
              if (val2 === shape.e.ix || val2 === "End" || val2 === "end") {
                return interfaceFunction.end;
              }
              if (val2 === shape.s.ix) {
                return interfaceFunction.start;
              }
              if (val2 === shape.o.ix) {
                return interfaceFunction.offset;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            interfaceFunction.propertyIndex = shape.ix;
            view.s.setGroupProperty(PropertyInterface("Start", _propertyGroup));
            view.e.setGroupProperty(PropertyInterface("End", _propertyGroup));
            view.o.setGroupProperty(PropertyInterface("Offset", _propertyGroup));
            interfaceFunction.propertyIndex = shape.ix;
            interfaceFunction.propertyGroup = propertyGroup;
            Object.defineProperties(interfaceFunction, {
              start: {
                get: ExpressionPropertyInterface(view.s)
              },
              end: {
                get: ExpressionPropertyInterface(view.e)
              },
              offset: {
                get: ExpressionPropertyInterface(view.o)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function transformInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.a.ix === value2 || value2 === "Anchor Point") {
                return interfaceFunction.anchorPoint;
              }
              if (shape.o.ix === value2 || value2 === "Opacity") {
                return interfaceFunction.opacity;
              }
              if (shape.p.ix === value2 || value2 === "Position") {
                return interfaceFunction.position;
              }
              if (shape.r.ix === value2 || value2 === "Rotation" || value2 === "ADBE Vector Rotation") {
                return interfaceFunction.rotation;
              }
              if (shape.s.ix === value2 || value2 === "Scale") {
                return interfaceFunction.scale;
              }
              if (shape.sk && shape.sk.ix === value2 || value2 === "Skew") {
                return interfaceFunction.skew;
              }
              if (shape.sa && shape.sa.ix === value2 || value2 === "Skew Axis") {
                return interfaceFunction.skewAxis;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            view.transform.mProps.o.setGroupProperty(PropertyInterface("Opacity", _propertyGroup));
            view.transform.mProps.p.setGroupProperty(PropertyInterface("Position", _propertyGroup));
            view.transform.mProps.a.setGroupProperty(PropertyInterface("Anchor Point", _propertyGroup));
            view.transform.mProps.s.setGroupProperty(PropertyInterface("Scale", _propertyGroup));
            view.transform.mProps.r.setGroupProperty(PropertyInterface("Rotation", _propertyGroup));
            if (view.transform.mProps.sk) {
              view.transform.mProps.sk.setGroupProperty(PropertyInterface("Skew", _propertyGroup));
              view.transform.mProps.sa.setGroupProperty(PropertyInterface("Skew Angle", _propertyGroup));
            }
            view.transform.op.setGroupProperty(PropertyInterface("Opacity", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              opacity: {
                get: ExpressionPropertyInterface(view.transform.mProps.o)
              },
              position: {
                get: ExpressionPropertyInterface(view.transform.mProps.p)
              },
              anchorPoint: {
                get: ExpressionPropertyInterface(view.transform.mProps.a)
              },
              scale: {
                get: ExpressionPropertyInterface(view.transform.mProps.s)
              },
              rotation: {
                get: ExpressionPropertyInterface(view.transform.mProps.r)
              },
              skew: {
                get: ExpressionPropertyInterface(view.transform.mProps.sk)
              },
              skewAxis: {
                get: ExpressionPropertyInterface(view.transform.mProps.sa)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.ty = "tr";
            interfaceFunction.mn = shape.mn;
            interfaceFunction.propertyGroup = propertyGroup;
            return interfaceFunction;
          }
          function ellipseInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.p.ix === value2) {
                return interfaceFunction.position;
              }
              if (shape.s.ix === value2) {
                return interfaceFunction.size;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            interfaceFunction.propertyIndex = shape.ix;
            var prop = view.sh.ty === "tm" ? view.sh.prop : view.sh;
            prop.s.setGroupProperty(PropertyInterface("Size", _propertyGroup));
            prop.p.setGroupProperty(PropertyInterface("Position", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              size: {
                get: ExpressionPropertyInterface(prop.s)
              },
              position: {
                get: ExpressionPropertyInterface(prop.p)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function starInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.p.ix === value2) {
                return interfaceFunction.position;
              }
              if (shape.r.ix === value2) {
                return interfaceFunction.rotation;
              }
              if (shape.pt.ix === value2) {
                return interfaceFunction.points;
              }
              if (shape.or.ix === value2 || value2 === "ADBE Vector Star Outer Radius") {
                return interfaceFunction.outerRadius;
              }
              if (shape.os.ix === value2) {
                return interfaceFunction.outerRoundness;
              }
              if (shape.ir && (shape.ir.ix === value2 || value2 === "ADBE Vector Star Inner Radius")) {
                return interfaceFunction.innerRadius;
              }
              if (shape.is && shape.is.ix === value2) {
                return interfaceFunction.innerRoundness;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var prop = view.sh.ty === "tm" ? view.sh.prop : view.sh;
            interfaceFunction.propertyIndex = shape.ix;
            prop.or.setGroupProperty(PropertyInterface("Outer Radius", _propertyGroup));
            prop.os.setGroupProperty(PropertyInterface("Outer Roundness", _propertyGroup));
            prop.pt.setGroupProperty(PropertyInterface("Points", _propertyGroup));
            prop.p.setGroupProperty(PropertyInterface("Position", _propertyGroup));
            prop.r.setGroupProperty(PropertyInterface("Rotation", _propertyGroup));
            if (shape.ir) {
              prop.ir.setGroupProperty(PropertyInterface("Inner Radius", _propertyGroup));
              prop.is.setGroupProperty(PropertyInterface("Inner Roundness", _propertyGroup));
            }
            Object.defineProperties(interfaceFunction, {
              position: {
                get: ExpressionPropertyInterface(prop.p)
              },
              rotation: {
                get: ExpressionPropertyInterface(prop.r)
              },
              points: {
                get: ExpressionPropertyInterface(prop.pt)
              },
              outerRadius: {
                get: ExpressionPropertyInterface(prop.or)
              },
              outerRoundness: {
                get: ExpressionPropertyInterface(prop.os)
              },
              innerRadius: {
                get: ExpressionPropertyInterface(prop.ir)
              },
              innerRoundness: {
                get: ExpressionPropertyInterface(prop.is)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function rectInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.p.ix === value2) {
                return interfaceFunction.position;
              }
              if (shape.r.ix === value2) {
                return interfaceFunction.roundness;
              }
              if (shape.s.ix === value2 || value2 === "Size" || value2 === "ADBE Vector Rect Size") {
                return interfaceFunction.size;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var prop = view.sh.ty === "tm" ? view.sh.prop : view.sh;
            interfaceFunction.propertyIndex = shape.ix;
            prop.p.setGroupProperty(PropertyInterface("Position", _propertyGroup));
            prop.s.setGroupProperty(PropertyInterface("Size", _propertyGroup));
            prop.r.setGroupProperty(PropertyInterface("Rotation", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              position: {
                get: ExpressionPropertyInterface(prop.p)
              },
              roundness: {
                get: ExpressionPropertyInterface(prop.r)
              },
              size: {
                get: ExpressionPropertyInterface(prop.s)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function roundedInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.r.ix === value2 || value2 === "Round Corners 1") {
                return interfaceFunction.radius;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var prop = view;
            interfaceFunction.propertyIndex = shape.ix;
            prop.rd.setGroupProperty(PropertyInterface("Radius", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              radius: {
                get: ExpressionPropertyInterface(prop.rd)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          function repeaterInterfaceFactory(shape, view, propertyGroup) {
            function interfaceFunction(value2) {
              if (shape.c.ix === value2 || value2 === "Copies") {
                return interfaceFunction.copies;
              }
              if (shape.o.ix === value2 || value2 === "Offset") {
                return interfaceFunction.offset;
              }
              return null;
            }
            var _propertyGroup = propertyGroupFactory(interfaceFunction, propertyGroup);
            var prop = view;
            interfaceFunction.propertyIndex = shape.ix;
            prop.c.setGroupProperty(PropertyInterface("Copies", _propertyGroup));
            prop.o.setGroupProperty(PropertyInterface("Offset", _propertyGroup));
            Object.defineProperties(interfaceFunction, {
              copies: {
                get: ExpressionPropertyInterface(prop.c)
              },
              offset: {
                get: ExpressionPropertyInterface(prop.o)
              },
              _name: {
                value: shape.nm
              }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
          }
          return function(shapes, view, propertyGroup) {
            var interfaces2;
            function _interfaceFunction(value2) {
              if (typeof value2 === "number") {
                value2 = value2 === void 0 ? 1 : value2;
                if (value2 === 0) {
                  return propertyGroup;
                }
                return interfaces2[value2 - 1];
              }
              var i3 = 0;
              var len = interfaces2.length;
              while (i3 < len) {
                if (interfaces2[i3]._name === value2) {
                  return interfaces2[i3];
                }
                i3 += 1;
              }
              return null;
            }
            function parentGroupWrapper() {
              return propertyGroup;
            }
            _interfaceFunction.propertyGroup = propertyGroupFactory(_interfaceFunction, parentGroupWrapper);
            interfaces2 = iterateElements(shapes, view, _interfaceFunction.propertyGroup);
            _interfaceFunction.numProperties = interfaces2.length;
            _interfaceFunction._name = "Contents";
            return _interfaceFunction;
          };
        })();
        var TextExpressionInterface = /* @__PURE__ */ (function() {
          return function(elem2) {
            var _sourceText;
            function _thisLayerFunction(name2) {
              switch (name2) {
                case "ADBE Text Document":
                  return _thisLayerFunction.sourceText;
                default:
                  return null;
              }
            }
            Object.defineProperty(_thisLayerFunction, "sourceText", {
              get: function get() {
                elem2.textProperty.getValue();
                var stringValue = elem2.textProperty.currentData.t;
                if (!_sourceText || stringValue !== _sourceText.value) {
                  _sourceText = new String(stringValue);
                  _sourceText.value = stringValue || new String(stringValue);
                  Object.defineProperty(_sourceText, "style", {
                    get: function get2() {
                      return {
                        fillColor: elem2.textProperty.currentData.fc
                      };
                    }
                  });
                }
                return _sourceText;
              }
            });
            return _thisLayerFunction;
          };
        })();
        function _typeof(o3) {
          "@babel/helpers - typeof";
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o4) {
            return typeof o4;
          } : function(o4) {
            return o4 && "function" == typeof Symbol && o4.constructor === Symbol && o4 !== Symbol.prototype ? "symbol" : typeof o4;
          }, _typeof(o3);
        }
        var FootageInterface = /* @__PURE__ */ (function() {
          var outlineInterfaceFactory = function outlineInterfaceFactory2(elem2) {
            var currentPropertyName = "";
            var currentProperty = elem2.getFootageData();
            function init2() {
              currentPropertyName = "";
              currentProperty = elem2.getFootageData();
              return searchProperty;
            }
            function searchProperty(value2) {
              if (currentProperty[value2]) {
                currentPropertyName = value2;
                currentProperty = currentProperty[value2];
                if (_typeof(currentProperty) === "object") {
                  return searchProperty;
                }
                return currentProperty;
              }
              var propertyNameIndex = value2.indexOf(currentPropertyName);
              if (propertyNameIndex !== -1) {
                var index2 = parseInt(value2.substr(propertyNameIndex + currentPropertyName.length), 10);
                currentProperty = currentProperty[index2];
                if (_typeof(currentProperty) === "object") {
                  return searchProperty;
                }
                return currentProperty;
              }
              return "";
            }
            return init2;
          };
          var dataInterfaceFactory = function dataInterfaceFactory2(elem2) {
            function interfaceFunction(value2) {
              if (value2 === "Outline") {
                return interfaceFunction.outlineInterface();
              }
              return null;
            }
            interfaceFunction._name = "Outline";
            interfaceFunction.outlineInterface = outlineInterfaceFactory(elem2);
            return interfaceFunction;
          };
          return function(elem2) {
            function _interfaceFunction(value2) {
              if (value2 === "Data") {
                return _interfaceFunction.dataInterface;
              }
              return null;
            }
            _interfaceFunction._name = "Data";
            _interfaceFunction.dataInterface = dataInterfaceFactory(elem2);
            return _interfaceFunction;
          };
        })();
        var interfaces = {
          layer: LayerExpressionInterface,
          effects: EffectsExpressionInterface,
          comp: CompExpressionInterface,
          shape: ShapeExpressionInterface,
          text: TextExpressionInterface,
          footage: FootageInterface
        };
        function getInterface(type) {
          return interfaces[type] || null;
        }
        var expressionHelpers = /* @__PURE__ */ (function() {
          function searchExpressions(elem2, data2, prop) {
            if (data2.x) {
              prop.k = true;
              prop.x = true;
              prop.initiateExpression = ExpressionManager.initiateExpression;
              prop.effectsSequence.push(prop.initiateExpression(elem2, data2, prop).bind(prop));
            }
          }
          function getValueAtTime(frameNum) {
            frameNum *= this.elem.globalData.frameRate;
            frameNum -= this.offsetTime;
            if (frameNum !== this._cachingAtTime.lastFrame) {
              this._cachingAtTime.lastIndex = this._cachingAtTime.lastFrame < frameNum ? this._cachingAtTime.lastIndex : 0;
              this._cachingAtTime.value = this.interpolateValue(frameNum, this._cachingAtTime);
              this._cachingAtTime.lastFrame = frameNum;
            }
            return this._cachingAtTime.value;
          }
          function getSpeedAtTime(frameNum) {
            var delta = -0.01;
            var v1 = this.getValueAtTime(frameNum);
            var v22 = this.getValueAtTime(frameNum + delta);
            var speed = 0;
            if (v1.length) {
              var i3;
              for (i3 = 0; i3 < v1.length; i3 += 1) {
                speed += Math.pow(v22[i3] - v1[i3], 2);
              }
              speed = Math.sqrt(speed) * 100;
            } else {
              speed = 0;
            }
            return speed;
          }
          function getVelocityAtTime(frameNum) {
            if (this.vel !== void 0) {
              return this.vel;
            }
            var delta = -1e-3;
            var v1 = this.getValueAtTime(frameNum);
            var v22 = this.getValueAtTime(frameNum + delta);
            var velocity2;
            if (v1.length) {
              velocity2 = createTypedArray("float32", v1.length);
              var i3;
              for (i3 = 0; i3 < v1.length; i3 += 1) {
                velocity2[i3] = (v22[i3] - v1[i3]) / delta;
              }
            } else {
              velocity2 = (v22 - v1) / delta;
            }
            return velocity2;
          }
          function getStaticValueAtTime() {
            return this.pv;
          }
          function setGroupProperty(propertyGroup) {
            this.propertyGroup = propertyGroup;
          }
          return {
            searchExpressions,
            getSpeedAtTime,
            getVelocityAtTime,
            getValueAtTime,
            getStaticValueAtTime,
            setGroupProperty
          };
        })();
        function addPropertyDecorator() {
          function loopOut2(type, duration, durationFlag) {
            if (!this.k || !this.keyframes) {
              return this.pv;
            }
            type = type ? type.toLowerCase() : "";
            var currentFrame = this.comp.renderedFrame;
            var keyframes = this.keyframes;
            var lastKeyFrame = keyframes[keyframes.length - 1].t;
            if (currentFrame <= lastKeyFrame) {
              return this.pv;
            }
            var cycleDuration;
            var firstKeyFrame;
            if (!durationFlag) {
              if (!duration || duration > keyframes.length - 1) {
                duration = keyframes.length - 1;
              }
              firstKeyFrame = keyframes[keyframes.length - 1 - duration].t;
              cycleDuration = lastKeyFrame - firstKeyFrame;
            } else {
              if (!duration) {
                cycleDuration = Math.max(0, lastKeyFrame - this.elem.data.ip);
              } else {
                cycleDuration = Math.abs(lastKeyFrame - this.elem.comp.globalData.frameRate * duration);
              }
              firstKeyFrame = lastKeyFrame - cycleDuration;
            }
            var i3;
            var len;
            var ret;
            if (type === "pingpong") {
              var iterations = Math.floor((currentFrame - firstKeyFrame) / cycleDuration);
              if (iterations % 2 !== 0) {
                return this.getValueAtTime((cycleDuration - (currentFrame - firstKeyFrame) % cycleDuration + firstKeyFrame) / this.comp.globalData.frameRate, 0);
              }
            } else if (type === "offset") {
              var initV = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
              var endV = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
              var current = this.getValueAtTime(((currentFrame - firstKeyFrame) % cycleDuration + firstKeyFrame) / this.comp.globalData.frameRate, 0);
              var repeats = Math.floor((currentFrame - firstKeyFrame) / cycleDuration);
              if (this.pv.length) {
                ret = new Array(initV.length);
                len = ret.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  ret[i3] = (endV[i3] - initV[i3]) * repeats + current[i3];
                }
                return ret;
              }
              return (endV - initV) * repeats + current;
            } else if (type === "continue") {
              var lastValue = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
              var nextLastValue = this.getValueAtTime((lastKeyFrame - 1e-3) / this.comp.globalData.frameRate, 0);
              if (this.pv.length) {
                ret = new Array(lastValue.length);
                len = ret.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  ret[i3] = lastValue[i3] + (lastValue[i3] - nextLastValue[i3]) * ((currentFrame - lastKeyFrame) / this.comp.globalData.frameRate) / 5e-4;
                }
                return ret;
              }
              return lastValue + (lastValue - nextLastValue) * ((currentFrame - lastKeyFrame) / 1e-3);
            }
            return this.getValueAtTime(((currentFrame - firstKeyFrame) % cycleDuration + firstKeyFrame) / this.comp.globalData.frameRate, 0);
          }
          function loopIn2(type, duration, durationFlag) {
            if (!this.k) {
              return this.pv;
            }
            type = type ? type.toLowerCase() : "";
            var currentFrame = this.comp.renderedFrame;
            var keyframes = this.keyframes;
            var firstKeyFrame = keyframes[0].t;
            if (currentFrame >= firstKeyFrame) {
              return this.pv;
            }
            var cycleDuration;
            var lastKeyFrame;
            if (!durationFlag) {
              if (!duration || duration > keyframes.length - 1) {
                duration = keyframes.length - 1;
              }
              lastKeyFrame = keyframes[duration].t;
              cycleDuration = lastKeyFrame - firstKeyFrame;
            } else {
              if (!duration) {
                cycleDuration = Math.max(0, this.elem.data.op - firstKeyFrame);
              } else {
                cycleDuration = Math.abs(this.elem.comp.globalData.frameRate * duration);
              }
              lastKeyFrame = firstKeyFrame + cycleDuration;
            }
            var i3;
            var len;
            var ret;
            if (type === "pingpong") {
              var iterations = Math.floor((firstKeyFrame - currentFrame) / cycleDuration);
              if (iterations % 2 === 0) {
                return this.getValueAtTime(((firstKeyFrame - currentFrame) % cycleDuration + firstKeyFrame) / this.comp.globalData.frameRate, 0);
              }
            } else if (type === "offset") {
              var initV = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
              var endV = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
              var current = this.getValueAtTime((cycleDuration - (firstKeyFrame - currentFrame) % cycleDuration + firstKeyFrame) / this.comp.globalData.frameRate, 0);
              var repeats = Math.floor((firstKeyFrame - currentFrame) / cycleDuration) + 1;
              if (this.pv.length) {
                ret = new Array(initV.length);
                len = ret.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  ret[i3] = current[i3] - (endV[i3] - initV[i3]) * repeats;
                }
                return ret;
              }
              return current - (endV - initV) * repeats;
            } else if (type === "continue") {
              var firstValue = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
              var nextFirstValue = this.getValueAtTime((firstKeyFrame + 1e-3) / this.comp.globalData.frameRate, 0);
              if (this.pv.length) {
                ret = new Array(firstValue.length);
                len = ret.length;
                for (i3 = 0; i3 < len; i3 += 1) {
                  ret[i3] = firstValue[i3] + (firstValue[i3] - nextFirstValue[i3]) * (firstKeyFrame - currentFrame) / 1e-3;
                }
                return ret;
              }
              return firstValue + (firstValue - nextFirstValue) * (firstKeyFrame - currentFrame) / 1e-3;
            }
            return this.getValueAtTime((cycleDuration - ((firstKeyFrame - currentFrame) % cycleDuration + firstKeyFrame)) / this.comp.globalData.frameRate, 0);
          }
          function smooth2(width2, samples) {
            if (!this.k) {
              return this.pv;
            }
            width2 = (width2 || 0.4) * 0.5;
            samples = Math.floor(samples || 5);
            if (samples <= 1) {
              return this.pv;
            }
            var currentTime = this.comp.renderedFrame / this.comp.globalData.frameRate;
            var initFrame2 = currentTime - width2;
            var endFrame = currentTime + width2;
            var sampleFrequency = samples > 1 ? (endFrame - initFrame2) / (samples - 1) : 1;
            var i3 = 0;
            var j3 = 0;
            var value2;
            if (this.pv.length) {
              value2 = createTypedArray("float32", this.pv.length);
            } else {
              value2 = 0;
            }
            var sampleValue;
            while (i3 < samples) {
              sampleValue = this.getValueAtTime(initFrame2 + i3 * sampleFrequency);
              if (this.pv.length) {
                for (j3 = 0; j3 < this.pv.length; j3 += 1) {
                  value2[j3] += sampleValue[j3];
                }
              } else {
                value2 += sampleValue;
              }
              i3 += 1;
            }
            if (this.pv.length) {
              for (j3 = 0; j3 < this.pv.length; j3 += 1) {
                value2[j3] /= samples;
              }
            } else {
              value2 /= samples;
            }
            return value2;
          }
          function getTransformValueAtTime(time2) {
            if (!this._transformCachingAtTime) {
              this._transformCachingAtTime = {
                v: new Matrix()
              };
            }
            var matrix = this._transformCachingAtTime.v;
            matrix.cloneFromProps(this.pre.props);
            if (this.appliedTransformations < 1) {
              var anchor = this.a.getValueAtTime(time2);
              matrix.translate(-anchor[0] * this.a.mult, -anchor[1] * this.a.mult, anchor[2] * this.a.mult);
            }
            if (this.appliedTransformations < 2) {
              var scale2 = this.s.getValueAtTime(time2);
              matrix.scale(scale2[0] * this.s.mult, scale2[1] * this.s.mult, scale2[2] * this.s.mult);
            }
            if (this.sk && this.appliedTransformations < 3) {
              var skew = this.sk.getValueAtTime(time2);
              var skewAxis = this.sa.getValueAtTime(time2);
              matrix.skewFromAxis(-skew * this.sk.mult, skewAxis * this.sa.mult);
            }
            if (this.r && this.appliedTransformations < 4) {
              var rotation2 = this.r.getValueAtTime(time2);
              matrix.rotate(-rotation2 * this.r.mult);
            } else if (!this.r && this.appliedTransformations < 4) {
              var rotationZ = this.rz.getValueAtTime(time2);
              var rotationY = this.ry.getValueAtTime(time2);
              var rotationX = this.rx.getValueAtTime(time2);
              var orientation = this.or.getValueAtTime(time2);
              matrix.rotateZ(-rotationZ * this.rz.mult).rotateY(rotationY * this.ry.mult).rotateX(rotationX * this.rx.mult).rotateZ(-orientation[2] * this.or.mult).rotateY(orientation[1] * this.or.mult).rotateX(orientation[0] * this.or.mult);
            }
            if (this.data.p && this.data.p.s) {
              var positionX = this.px.getValueAtTime(time2);
              var positionY = this.py.getValueAtTime(time2);
              if (this.data.p.z) {
                var positionZ = this.pz.getValueAtTime(time2);
                matrix.translate(positionX * this.px.mult, positionY * this.py.mult, -positionZ * this.pz.mult);
              } else {
                matrix.translate(positionX * this.px.mult, positionY * this.py.mult, 0);
              }
            } else {
              var position2 = this.p.getValueAtTime(time2);
              matrix.translate(position2[0] * this.p.mult, position2[1] * this.p.mult, -position2[2] * this.p.mult);
            }
            return matrix;
          }
          function getTransformStaticValueAtTime() {
            return this.v.clone(new Matrix());
          }
          var getTransformProperty = TransformPropertyFactory.getTransformProperty;
          TransformPropertyFactory.getTransformProperty = function(elem2, data2, container) {
            var prop = getTransformProperty(elem2, data2, container);
            if (prop.dynamicProperties.length) {
              prop.getValueAtTime = getTransformValueAtTime.bind(prop);
            } else {
              prop.getValueAtTime = getTransformStaticValueAtTime.bind(prop);
            }
            prop.setGroupProperty = expressionHelpers.setGroupProperty;
            return prop;
          };
          var propertyGetProp = PropertyFactory.getProp;
          PropertyFactory.getProp = function(elem2, data2, type, mult, container) {
            var prop = propertyGetProp(elem2, data2, type, mult, container);
            if (prop.kf) {
              prop.getValueAtTime = expressionHelpers.getValueAtTime.bind(prop);
            } else {
              prop.getValueAtTime = expressionHelpers.getStaticValueAtTime.bind(prop);
            }
            prop.setGroupProperty = expressionHelpers.setGroupProperty;
            prop.loopOut = loopOut2;
            prop.loopIn = loopIn2;
            prop.smooth = smooth2;
            prop.getVelocityAtTime = expressionHelpers.getVelocityAtTime.bind(prop);
            prop.getSpeedAtTime = expressionHelpers.getSpeedAtTime.bind(prop);
            prop.numKeys = data2.a === 1 ? data2.k.length : 0;
            prop.propertyIndex = data2.ix;
            var value2 = 0;
            if (type !== 0) {
              value2 = createTypedArray("float32", data2.a === 1 ? data2.k[0].s.length : data2.k.length);
            }
            prop._cachingAtTime = {
              lastFrame: initialDefaultFrame,
              lastIndex: 0,
              value: value2
            };
            expressionHelpers.searchExpressions(elem2, data2, prop);
            if (prop.k) {
              container.addDynamicProperty(prop);
            }
            return prop;
          };
          function getShapeValueAtTime(frameNum) {
            if (!this._cachingAtTime) {
              this._cachingAtTime = {
                shapeValue: shapePool.clone(this.pv),
                lastIndex: 0,
                lastTime: initialDefaultFrame
              };
            }
            frameNum *= this.elem.globalData.frameRate;
            frameNum -= this.offsetTime;
            if (frameNum !== this._cachingAtTime.lastTime) {
              this._cachingAtTime.lastIndex = this._cachingAtTime.lastTime < frameNum ? this._caching.lastIndex : 0;
              this._cachingAtTime.lastTime = frameNum;
              this.interpolateShape(frameNum, this._cachingAtTime.shapeValue, this._cachingAtTime);
            }
            return this._cachingAtTime.shapeValue;
          }
          var ShapePropertyConstructorFunction = ShapePropertyFactory.getConstructorFunction();
          var KeyframedShapePropertyConstructorFunction = ShapePropertyFactory.getKeyframedConstructorFunction();
          function ShapeExpressions() {
          }
          ShapeExpressions.prototype = {
            vertices: function vertices(prop, time2) {
              if (this.k) {
                this.getValue();
              }
              var shapePath = this.v;
              if (time2 !== void 0) {
                shapePath = this.getValueAtTime(time2, 0);
              }
              var i3;
              var len = shapePath._length;
              var vertices2 = shapePath[prop];
              var points = shapePath.v;
              var arr = createSizedArray(len);
              for (i3 = 0; i3 < len; i3 += 1) {
                if (prop === "i" || prop === "o") {
                  arr[i3] = [vertices2[i3][0] - points[i3][0], vertices2[i3][1] - points[i3][1]];
                } else {
                  arr[i3] = [vertices2[i3][0], vertices2[i3][1]];
                }
              }
              return arr;
            },
            points: function points(time2) {
              return this.vertices("v", time2);
            },
            inTangents: function inTangents(time2) {
              return this.vertices("i", time2);
            },
            outTangents: function outTangents(time2) {
              return this.vertices("o", time2);
            },
            isClosed: function isClosed() {
              return this.v.c;
            },
            pointOnPath: function pointOnPath(perc, time2) {
              var shapePath = this.v;
              if (time2 !== void 0) {
                shapePath = this.getValueAtTime(time2, 0);
              }
              if (!this._segmentsLength) {
                this._segmentsLength = bez.getSegmentsLength(shapePath);
              }
              var segmentsLength = this._segmentsLength;
              var lengths = segmentsLength.lengths;
              var lengthPos = segmentsLength.totalLength * perc;
              var i3 = 0;
              var len = lengths.length;
              var accumulatedLength = 0;
              var pt;
              while (i3 < len) {
                if (accumulatedLength + lengths[i3].addedLength > lengthPos) {
                  var initIndex = i3;
                  var endIndex = shapePath.c && i3 === len - 1 ? 0 : i3 + 1;
                  var segmentPerc = (lengthPos - accumulatedLength) / lengths[i3].addedLength;
                  pt = bez.getPointInSegment(shapePath.v[initIndex], shapePath.v[endIndex], shapePath.o[initIndex], shapePath.i[endIndex], segmentPerc, lengths[i3]);
                  break;
                } else {
                  accumulatedLength += lengths[i3].addedLength;
                }
                i3 += 1;
              }
              if (!pt) {
                pt = shapePath.c ? [shapePath.v[0][0], shapePath.v[0][1]] : [shapePath.v[shapePath._length - 1][0], shapePath.v[shapePath._length - 1][1]];
              }
              return pt;
            },
            vectorOnPath: function vectorOnPath(perc, time2, vectorType) {
              if (perc == 1) {
                perc = this.v.c;
              } else if (perc == 0) {
                perc = 0.999;
              }
              var pt1 = this.pointOnPath(perc, time2);
              var pt2 = this.pointOnPath(perc + 1e-3, time2);
              var xLength = pt2[0] - pt1[0];
              var yLength = pt2[1] - pt1[1];
              var magnitude = Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2));
              if (magnitude === 0) {
                return [0, 0];
              }
              var unitVector = vectorType === "tangent" ? [xLength / magnitude, yLength / magnitude] : [-yLength / magnitude, xLength / magnitude];
              return unitVector;
            },
            tangentOnPath: function tangentOnPath(perc, time2) {
              return this.vectorOnPath(perc, time2, "tangent");
            },
            normalOnPath: function normalOnPath(perc, time2) {
              return this.vectorOnPath(perc, time2, "normal");
            },
            setGroupProperty: expressionHelpers.setGroupProperty,
            getValueAtTime: expressionHelpers.getStaticValueAtTime
          };
          extendPrototype([ShapeExpressions], ShapePropertyConstructorFunction);
          extendPrototype([ShapeExpressions], KeyframedShapePropertyConstructorFunction);
          KeyframedShapePropertyConstructorFunction.prototype.getValueAtTime = getShapeValueAtTime;
          KeyframedShapePropertyConstructorFunction.prototype.initiateExpression = ExpressionManager.initiateExpression;
          var propertyGetShapeProp = ShapePropertyFactory.getShapeProp;
          ShapePropertyFactory.getShapeProp = function(elem2, data2, type, arr, trims) {
            var prop = propertyGetShapeProp(elem2, data2, type, arr, trims);
            prop.propertyIndex = data2.ix;
            prop.lock = false;
            if (type === 3) {
              expressionHelpers.searchExpressions(elem2, data2.pt, prop);
            } else if (type === 4) {
              expressionHelpers.searchExpressions(elem2, data2.ks, prop);
            }
            if (prop.k) {
              elem2.addDynamicProperty(prop);
            }
            return prop;
          };
        }
        function initialize$1() {
          addPropertyDecorator();
        }
        function addDecorator() {
          function searchExpressions() {
            if (this.data.d.x) {
              this.calculateExpression = ExpressionManager.initiateExpression.bind(this)(this.elem, this.data.d, this);
              this.addEffect(this.getExpressionValue.bind(this));
              return true;
            }
            return null;
          }
          TextProperty.prototype.getExpressionValue = function(currentValue, text2) {
            var newValue = this.calculateExpression(text2);
            if (currentValue.t !== newValue) {
              var newData = {};
              this.copyData(newData, currentValue);
              newData.t = newValue.toString();
              newData.__complete = false;
              return newData;
            }
            return currentValue;
          };
          TextProperty.prototype.searchProperty = function() {
            var isKeyframed = this.searchKeyframes();
            var hasExpressions = this.searchExpressions();
            this.kf = isKeyframed || hasExpressions;
            return this.kf;
          };
          TextProperty.prototype.searchExpressions = searchExpressions;
        }
        function initialize() {
          addDecorator();
        }
        function SVGComposableEffect() {
        }
        SVGComposableEffect.prototype = {
          createMergeNode: function createMergeNode(resultId, ins) {
            var feMerge = createNS("feMerge");
            feMerge.setAttribute("result", resultId);
            var feMergeNode;
            var i3;
            for (i3 = 0; i3 < ins.length; i3 += 1) {
              feMergeNode = createNS("feMergeNode");
              feMergeNode.setAttribute("in", ins[i3]);
              feMerge.appendChild(feMergeNode);
              feMerge.appendChild(feMergeNode);
            }
            return feMerge;
          }
        };
        var linearFilterValue = "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0";
        function SVGTintFilter(filter, filterManager, elem2, id, source) {
          this.filterManager = filterManager;
          var feColorMatrix = createNS("feColorMatrix");
          feColorMatrix.setAttribute("type", "matrix");
          feColorMatrix.setAttribute("color-interpolation-filters", "linearRGB");
          feColorMatrix.setAttribute("values", linearFilterValue + " 1 0");
          this.linearFilter = feColorMatrix;
          feColorMatrix.setAttribute("result", id + "_tint_1");
          filter.appendChild(feColorMatrix);
          feColorMatrix = createNS("feColorMatrix");
          feColorMatrix.setAttribute("type", "matrix");
          feColorMatrix.setAttribute("color-interpolation-filters", "sRGB");
          feColorMatrix.setAttribute("values", "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0");
          feColorMatrix.setAttribute("result", id + "_tint_2");
          filter.appendChild(feColorMatrix);
          this.matrixFilter = feColorMatrix;
          var feMerge = this.createMergeNode(id, [source, id + "_tint_1", id + "_tint_2"]);
          filter.appendChild(feMerge);
        }
        extendPrototype([SVGComposableEffect], SVGTintFilter);
        SVGTintFilter.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            var colorBlack = this.filterManager.effectElements[0].p.v;
            var colorWhite = this.filterManager.effectElements[1].p.v;
            var opacity = this.filterManager.effectElements[2].p.v / 100;
            this.linearFilter.setAttribute("values", linearFilterValue + " " + opacity + " 0");
            this.matrixFilter.setAttribute("values", colorWhite[0] - colorBlack[0] + " 0 0 0 " + colorBlack[0] + " " + (colorWhite[1] - colorBlack[1]) + " 0 0 0 " + colorBlack[1] + " " + (colorWhite[2] - colorBlack[2]) + " 0 0 0 " + colorBlack[2] + " 0 0 0 1 0");
          }
        };
        function SVGFillFilter(filter, filterManager, elem2, id) {
          this.filterManager = filterManager;
          var feColorMatrix = createNS("feColorMatrix");
          feColorMatrix.setAttribute("type", "matrix");
          feColorMatrix.setAttribute("color-interpolation-filters", "sRGB");
          feColorMatrix.setAttribute("values", "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0");
          feColorMatrix.setAttribute("result", id);
          filter.appendChild(feColorMatrix);
          this.matrixFilter = feColorMatrix;
        }
        SVGFillFilter.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            var color = this.filterManager.effectElements[2].p.v;
            var opacity = this.filterManager.effectElements[6].p.v;
            this.matrixFilter.setAttribute("values", "0 0 0 0 " + color[0] + " 0 0 0 0 " + color[1] + " 0 0 0 0 " + color[2] + " 0 0 0 " + opacity + " 0");
          }
        };
        function SVGStrokeEffect(fil, filterManager, elem2) {
          this.initialized = false;
          this.filterManager = filterManager;
          this.elem = elem2;
          this.paths = [];
        }
        SVGStrokeEffect.prototype.initialize = function() {
          var elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
          var path;
          var groupPath;
          var i3;
          var len;
          if (this.filterManager.effectElements[1].p.v === 1) {
            len = this.elem.maskManager.masksProperties.length;
            i3 = 0;
          } else {
            i3 = this.filterManager.effectElements[0].p.v - 1;
            len = i3 + 1;
          }
          groupPath = createNS("g");
          groupPath.setAttribute("fill", "none");
          groupPath.setAttribute("stroke-linecap", "round");
          groupPath.setAttribute("stroke-dashoffset", 1);
          for (i3; i3 < len; i3 += 1) {
            path = createNS("path");
            groupPath.appendChild(path);
            this.paths.push({
              p: path,
              m: i3
            });
          }
          if (this.filterManager.effectElements[10].p.v === 3) {
            var mask2 = createNS("mask");
            var id = createElementID();
            mask2.setAttribute("id", id);
            mask2.setAttribute("mask-type", "alpha");
            mask2.appendChild(groupPath);
            this.elem.globalData.defs.appendChild(mask2);
            var g3 = createNS("g");
            g3.setAttribute("mask", "url(" + getLocationHref() + "#" + id + ")");
            while (elemChildren[0]) {
              g3.appendChild(elemChildren[0]);
            }
            this.elem.layerElement.appendChild(g3);
            this.masker = mask2;
            groupPath.setAttribute("stroke", "#fff");
          } else if (this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2) {
            if (this.filterManager.effectElements[10].p.v === 2) {
              elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
              while (elemChildren.length) {
                this.elem.layerElement.removeChild(elemChildren[0]);
              }
            }
            this.elem.layerElement.appendChild(groupPath);
            this.elem.layerElement.removeAttribute("mask");
            groupPath.setAttribute("stroke", "#fff");
          }
          this.initialized = true;
          this.pathMasker = groupPath;
        };
        SVGStrokeEffect.prototype.renderFrame = function(forceRender) {
          if (!this.initialized) {
            this.initialize();
          }
          var i3;
          var len = this.paths.length;
          var mask2;
          var path;
          for (i3 = 0; i3 < len; i3 += 1) {
            if (this.paths[i3].m !== -1) {
              mask2 = this.elem.maskManager.viewData[this.paths[i3].m];
              path = this.paths[i3].p;
              if (forceRender || this.filterManager._mdf || mask2.prop._mdf) {
                path.setAttribute("d", mask2.lastPath);
              }
              if (forceRender || this.filterManager.effectElements[9].p._mdf || this.filterManager.effectElements[4].p._mdf || this.filterManager.effectElements[7].p._mdf || this.filterManager.effectElements[8].p._mdf || mask2.prop._mdf) {
                var dasharrayValue;
                if (this.filterManager.effectElements[7].p.v !== 0 || this.filterManager.effectElements[8].p.v !== 100) {
                  var s3 = Math.min(this.filterManager.effectElements[7].p.v, this.filterManager.effectElements[8].p.v) * 0.01;
                  var e3 = Math.max(this.filterManager.effectElements[7].p.v, this.filterManager.effectElements[8].p.v) * 0.01;
                  var l3 = path.getTotalLength();
                  dasharrayValue = "0 0 0 " + l3 * s3 + " ";
                  var lineLength = l3 * (e3 - s3);
                  var segment = 1 + this.filterManager.effectElements[4].p.v * 2 * this.filterManager.effectElements[9].p.v * 0.01;
                  var units = Math.floor(lineLength / segment);
                  var j3;
                  for (j3 = 0; j3 < units; j3 += 1) {
                    dasharrayValue += "1 " + this.filterManager.effectElements[4].p.v * 2 * this.filterManager.effectElements[9].p.v * 0.01 + " ";
                  }
                  dasharrayValue += "0 " + l3 * 10 + " 0 0";
                } else {
                  dasharrayValue = "1 " + this.filterManager.effectElements[4].p.v * 2 * this.filterManager.effectElements[9].p.v * 0.01;
                }
                path.setAttribute("stroke-dasharray", dasharrayValue);
              }
            }
          }
          if (forceRender || this.filterManager.effectElements[4].p._mdf) {
            this.pathMasker.setAttribute("stroke-width", this.filterManager.effectElements[4].p.v * 2);
          }
          if (forceRender || this.filterManager.effectElements[6].p._mdf) {
            this.pathMasker.setAttribute("opacity", this.filterManager.effectElements[6].p.v);
          }
          if (this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2) {
            if (forceRender || this.filterManager.effectElements[3].p._mdf) {
              var color = this.filterManager.effectElements[3].p.v;
              this.pathMasker.setAttribute("stroke", "rgb(" + bmFloor(color[0] * 255) + "," + bmFloor(color[1] * 255) + "," + bmFloor(color[2] * 255) + ")");
            }
          }
        };
        function SVGTritoneFilter(filter, filterManager, elem2, id) {
          this.filterManager = filterManager;
          var feColorMatrix = createNS("feColorMatrix");
          feColorMatrix.setAttribute("type", "matrix");
          feColorMatrix.setAttribute("color-interpolation-filters", "linearRGB");
          feColorMatrix.setAttribute("values", "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0");
          filter.appendChild(feColorMatrix);
          var feComponentTransfer = createNS("feComponentTransfer");
          feComponentTransfer.setAttribute("color-interpolation-filters", "sRGB");
          feComponentTransfer.setAttribute("result", id);
          this.matrixFilter = feComponentTransfer;
          var feFuncR = createNS("feFuncR");
          feFuncR.setAttribute("type", "table");
          feComponentTransfer.appendChild(feFuncR);
          this.feFuncR = feFuncR;
          var feFuncG = createNS("feFuncG");
          feFuncG.setAttribute("type", "table");
          feComponentTransfer.appendChild(feFuncG);
          this.feFuncG = feFuncG;
          var feFuncB = createNS("feFuncB");
          feFuncB.setAttribute("type", "table");
          feComponentTransfer.appendChild(feFuncB);
          this.feFuncB = feFuncB;
          filter.appendChild(feComponentTransfer);
        }
        SVGTritoneFilter.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            var color1 = this.filterManager.effectElements[0].p.v;
            var color2 = this.filterManager.effectElements[1].p.v;
            var color3 = this.filterManager.effectElements[2].p.v;
            var tableR = color3[0] + " " + color2[0] + " " + color1[0];
            var tableG = color3[1] + " " + color2[1] + " " + color1[1];
            var tableB = color3[2] + " " + color2[2] + " " + color1[2];
            this.feFuncR.setAttribute("tableValues", tableR);
            this.feFuncG.setAttribute("tableValues", tableG);
            this.feFuncB.setAttribute("tableValues", tableB);
          }
        };
        function SVGProLevelsFilter(filter, filterManager, elem2, id) {
          this.filterManager = filterManager;
          var effectElements = this.filterManager.effectElements;
          var feComponentTransfer = createNS("feComponentTransfer");
          if (effectElements[10].p.k || effectElements[10].p.v !== 0 || effectElements[11].p.k || effectElements[11].p.v !== 1 || effectElements[12].p.k || effectElements[12].p.v !== 1 || effectElements[13].p.k || effectElements[13].p.v !== 0 || effectElements[14].p.k || effectElements[14].p.v !== 1) {
            this.feFuncR = this.createFeFunc("feFuncR", feComponentTransfer);
          }
          if (effectElements[17].p.k || effectElements[17].p.v !== 0 || effectElements[18].p.k || effectElements[18].p.v !== 1 || effectElements[19].p.k || effectElements[19].p.v !== 1 || effectElements[20].p.k || effectElements[20].p.v !== 0 || effectElements[21].p.k || effectElements[21].p.v !== 1) {
            this.feFuncG = this.createFeFunc("feFuncG", feComponentTransfer);
          }
          if (effectElements[24].p.k || effectElements[24].p.v !== 0 || effectElements[25].p.k || effectElements[25].p.v !== 1 || effectElements[26].p.k || effectElements[26].p.v !== 1 || effectElements[27].p.k || effectElements[27].p.v !== 0 || effectElements[28].p.k || effectElements[28].p.v !== 1) {
            this.feFuncB = this.createFeFunc("feFuncB", feComponentTransfer);
          }
          if (effectElements[31].p.k || effectElements[31].p.v !== 0 || effectElements[32].p.k || effectElements[32].p.v !== 1 || effectElements[33].p.k || effectElements[33].p.v !== 1 || effectElements[34].p.k || effectElements[34].p.v !== 0 || effectElements[35].p.k || effectElements[35].p.v !== 1) {
            this.feFuncA = this.createFeFunc("feFuncA", feComponentTransfer);
          }
          if (this.feFuncR || this.feFuncG || this.feFuncB || this.feFuncA) {
            feComponentTransfer.setAttribute("color-interpolation-filters", "sRGB");
            filter.appendChild(feComponentTransfer);
          }
          if (effectElements[3].p.k || effectElements[3].p.v !== 0 || effectElements[4].p.k || effectElements[4].p.v !== 1 || effectElements[5].p.k || effectElements[5].p.v !== 1 || effectElements[6].p.k || effectElements[6].p.v !== 0 || effectElements[7].p.k || effectElements[7].p.v !== 1) {
            feComponentTransfer = createNS("feComponentTransfer");
            feComponentTransfer.setAttribute("color-interpolation-filters", "sRGB");
            feComponentTransfer.setAttribute("result", id);
            filter.appendChild(feComponentTransfer);
            this.feFuncRComposed = this.createFeFunc("feFuncR", feComponentTransfer);
            this.feFuncGComposed = this.createFeFunc("feFuncG", feComponentTransfer);
            this.feFuncBComposed = this.createFeFunc("feFuncB", feComponentTransfer);
          }
        }
        SVGProLevelsFilter.prototype.createFeFunc = function(type, feComponentTransfer) {
          var feFunc = createNS(type);
          feFunc.setAttribute("type", "table");
          feComponentTransfer.appendChild(feFunc);
          return feFunc;
        };
        SVGProLevelsFilter.prototype.getTableValue = function(inputBlack, inputWhite, gamma, outputBlack, outputWhite) {
          var cnt = 0;
          var segments = 256;
          var perc;
          var min = Math.min(inputBlack, inputWhite);
          var max = Math.max(inputBlack, inputWhite);
          var table = Array.call(null, {
            length: segments
          });
          var colorValue;
          var pos = 0;
          var outputDelta = outputWhite - outputBlack;
          var inputDelta = inputWhite - inputBlack;
          while (cnt <= 256) {
            perc = cnt / 256;
            if (perc <= min) {
              colorValue = inputDelta < 0 ? outputWhite : outputBlack;
            } else if (perc >= max) {
              colorValue = inputDelta < 0 ? outputBlack : outputWhite;
            } else {
              colorValue = outputBlack + outputDelta * Math.pow((perc - inputBlack) / inputDelta, 1 / gamma);
            }
            table[pos] = colorValue;
            pos += 1;
            cnt += 256 / (segments - 1);
          }
          return table.join(" ");
        };
        SVGProLevelsFilter.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            var val2;
            var effectElements = this.filterManager.effectElements;
            if (this.feFuncRComposed && (forceRender || effectElements[3].p._mdf || effectElements[4].p._mdf || effectElements[5].p._mdf || effectElements[6].p._mdf || effectElements[7].p._mdf)) {
              val2 = this.getTableValue(effectElements[3].p.v, effectElements[4].p.v, effectElements[5].p.v, effectElements[6].p.v, effectElements[7].p.v);
              this.feFuncRComposed.setAttribute("tableValues", val2);
              this.feFuncGComposed.setAttribute("tableValues", val2);
              this.feFuncBComposed.setAttribute("tableValues", val2);
            }
            if (this.feFuncR && (forceRender || effectElements[10].p._mdf || effectElements[11].p._mdf || effectElements[12].p._mdf || effectElements[13].p._mdf || effectElements[14].p._mdf)) {
              val2 = this.getTableValue(effectElements[10].p.v, effectElements[11].p.v, effectElements[12].p.v, effectElements[13].p.v, effectElements[14].p.v);
              this.feFuncR.setAttribute("tableValues", val2);
            }
            if (this.feFuncG && (forceRender || effectElements[17].p._mdf || effectElements[18].p._mdf || effectElements[19].p._mdf || effectElements[20].p._mdf || effectElements[21].p._mdf)) {
              val2 = this.getTableValue(effectElements[17].p.v, effectElements[18].p.v, effectElements[19].p.v, effectElements[20].p.v, effectElements[21].p.v);
              this.feFuncG.setAttribute("tableValues", val2);
            }
            if (this.feFuncB && (forceRender || effectElements[24].p._mdf || effectElements[25].p._mdf || effectElements[26].p._mdf || effectElements[27].p._mdf || effectElements[28].p._mdf)) {
              val2 = this.getTableValue(effectElements[24].p.v, effectElements[25].p.v, effectElements[26].p.v, effectElements[27].p.v, effectElements[28].p.v);
              this.feFuncB.setAttribute("tableValues", val2);
            }
            if (this.feFuncA && (forceRender || effectElements[31].p._mdf || effectElements[32].p._mdf || effectElements[33].p._mdf || effectElements[34].p._mdf || effectElements[35].p._mdf)) {
              val2 = this.getTableValue(effectElements[31].p.v, effectElements[32].p.v, effectElements[33].p.v, effectElements[34].p.v, effectElements[35].p.v);
              this.feFuncA.setAttribute("tableValues", val2);
            }
          }
        };
        function SVGDropShadowEffect(filter, filterManager, elem2, id, source) {
          var globalFilterSize = filterManager.container.globalData.renderConfig.filterSize;
          var filterSize = filterManager.data.fs || globalFilterSize;
          filter.setAttribute("x", filterSize.x || globalFilterSize.x);
          filter.setAttribute("y", filterSize.y || globalFilterSize.y);
          filter.setAttribute("width", filterSize.width || globalFilterSize.width);
          filter.setAttribute("height", filterSize.height || globalFilterSize.height);
          this.filterManager = filterManager;
          var feGaussianBlur = createNS("feGaussianBlur");
          feGaussianBlur.setAttribute("in", "SourceAlpha");
          feGaussianBlur.setAttribute("result", id + "_drop_shadow_1");
          feGaussianBlur.setAttribute("stdDeviation", "0");
          this.feGaussianBlur = feGaussianBlur;
          filter.appendChild(feGaussianBlur);
          var feOffset = createNS("feOffset");
          feOffset.setAttribute("dx", "25");
          feOffset.setAttribute("dy", "0");
          feOffset.setAttribute("in", id + "_drop_shadow_1");
          feOffset.setAttribute("result", id + "_drop_shadow_2");
          this.feOffset = feOffset;
          filter.appendChild(feOffset);
          var feFlood = createNS("feFlood");
          feFlood.setAttribute("flood-color", "#00ff00");
          feFlood.setAttribute("flood-opacity", "1");
          feFlood.setAttribute("result", id + "_drop_shadow_3");
          this.feFlood = feFlood;
          filter.appendChild(feFlood);
          var feComposite = createNS("feComposite");
          feComposite.setAttribute("in", id + "_drop_shadow_3");
          feComposite.setAttribute("in2", id + "_drop_shadow_2");
          feComposite.setAttribute("operator", "in");
          feComposite.setAttribute("result", id + "_drop_shadow_4");
          filter.appendChild(feComposite);
          var feMerge = this.createMergeNode(id, [id + "_drop_shadow_4", source]);
          filter.appendChild(feMerge);
        }
        extendPrototype([SVGComposableEffect], SVGDropShadowEffect);
        SVGDropShadowEffect.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            if (forceRender || this.filterManager.effectElements[4].p._mdf) {
              this.feGaussianBlur.setAttribute("stdDeviation", this.filterManager.effectElements[4].p.v / 4);
            }
            if (forceRender || this.filterManager.effectElements[0].p._mdf) {
              var col = this.filterManager.effectElements[0].p.v;
              this.feFlood.setAttribute("flood-color", rgbToHex(Math.round(col[0] * 255), Math.round(col[1] * 255), Math.round(col[2] * 255)));
            }
            if (forceRender || this.filterManager.effectElements[1].p._mdf) {
              this.feFlood.setAttribute("flood-opacity", this.filterManager.effectElements[1].p.v / 255);
            }
            if (forceRender || this.filterManager.effectElements[2].p._mdf || this.filterManager.effectElements[3].p._mdf) {
              var distance = this.filterManager.effectElements[3].p.v;
              var angle = (this.filterManager.effectElements[2].p.v - 90) * degToRads;
              var x3 = distance * Math.cos(angle);
              var y3 = distance * Math.sin(angle);
              this.feOffset.setAttribute("dx", x3);
              this.feOffset.setAttribute("dy", y3);
            }
          }
        };
        var _svgMatteSymbols = [];
        function SVGMatte3Effect(filterElem, filterManager, elem2) {
          this.initialized = false;
          this.filterManager = filterManager;
          this.filterElem = filterElem;
          this.elem = elem2;
          elem2.matteElement = createNS("g");
          elem2.matteElement.appendChild(elem2.layerElement);
          elem2.matteElement.appendChild(elem2.transformedElement);
          elem2.baseElement = elem2.matteElement;
        }
        SVGMatte3Effect.prototype.findSymbol = function(mask2) {
          var i3 = 0;
          var len = _svgMatteSymbols.length;
          while (i3 < len) {
            if (_svgMatteSymbols[i3] === mask2) {
              return _svgMatteSymbols[i3];
            }
            i3 += 1;
          }
          return null;
        };
        SVGMatte3Effect.prototype.replaceInParent = function(mask2, symbolId) {
          var parentNode = mask2.layerElement.parentNode;
          if (!parentNode) {
            return;
          }
          var children = parentNode.children;
          var i3 = 0;
          var len = children.length;
          while (i3 < len) {
            if (children[i3] === mask2.layerElement) {
              break;
            }
            i3 += 1;
          }
          var nextChild;
          if (i3 <= len - 2) {
            nextChild = children[i3 + 1];
          }
          var useElem = createNS("use");
          useElem.setAttribute("href", "#" + symbolId);
          if (nextChild) {
            parentNode.insertBefore(useElem, nextChild);
          } else {
            parentNode.appendChild(useElem);
          }
        };
        SVGMatte3Effect.prototype.setElementAsMask = function(elem2, mask2) {
          if (!this.findSymbol(mask2)) {
            var symbolId = createElementID();
            var masker = createNS("mask");
            masker.setAttribute("id", mask2.layerId);
            masker.setAttribute("mask-type", "alpha");
            _svgMatteSymbols.push(mask2);
            var defs = elem2.globalData.defs;
            defs.appendChild(masker);
            var symbol = createNS("symbol");
            symbol.setAttribute("id", symbolId);
            this.replaceInParent(mask2, symbolId);
            symbol.appendChild(mask2.layerElement);
            defs.appendChild(symbol);
            var useElem = createNS("use");
            useElem.setAttribute("href", "#" + symbolId);
            masker.appendChild(useElem);
            mask2.data.hd = false;
            mask2.show();
          }
          elem2.setMatte(mask2.layerId);
        };
        SVGMatte3Effect.prototype.initialize = function() {
          var ind = this.filterManager.effectElements[0].p.v;
          var elements = this.elem.comp.elements;
          var i3 = 0;
          var len = elements.length;
          while (i3 < len) {
            if (elements[i3] && elements[i3].data.ind === ind) {
              this.setElementAsMask(this.elem, elements[i3]);
            }
            i3 += 1;
          }
          this.initialized = true;
        };
        SVGMatte3Effect.prototype.renderFrame = function() {
          if (!this.initialized) {
            this.initialize();
          }
        };
        function SVGGaussianBlurEffect(filter, filterManager, elem2, id) {
          filter.setAttribute("x", "-100%");
          filter.setAttribute("y", "-100%");
          filter.setAttribute("width", "300%");
          filter.setAttribute("height", "300%");
          this.filterManager = filterManager;
          var feGaussianBlur = createNS("feGaussianBlur");
          feGaussianBlur.setAttribute("result", id);
          filter.appendChild(feGaussianBlur);
          this.feGaussianBlur = feGaussianBlur;
        }
        SVGGaussianBlurEffect.prototype.renderFrame = function(forceRender) {
          if (forceRender || this.filterManager._mdf) {
            var kBlurrinessToSigma = 0.3;
            var sigma = this.filterManager.effectElements[0].p.v * kBlurrinessToSigma;
            var dimensions = this.filterManager.effectElements[1].p.v;
            var sigmaX = dimensions == 3 ? 0 : sigma;
            var sigmaY = dimensions == 2 ? 0 : sigma;
            this.feGaussianBlur.setAttribute("stdDeviation", sigmaX + " " + sigmaY);
            var edgeMode = this.filterManager.effectElements[2].p.v == 1 ? "wrap" : "duplicate";
            this.feGaussianBlur.setAttribute("edgeMode", edgeMode);
          }
        };
        function TransformEffect() {
        }
        TransformEffect.prototype.init = function(effectsManager) {
          this.effectsManager = effectsManager;
          this.type = effectTypes.TRANSFORM_EFFECT;
          this.matrix = new Matrix();
          this.opacity = -1;
          this._mdf = false;
          this._opMdf = false;
        };
        TransformEffect.prototype.renderFrame = function(forceFrame) {
          this._opMdf = false;
          this._mdf = false;
          if (forceFrame || this.effectsManager._mdf) {
            var effectElements = this.effectsManager.effectElements;
            var anchor = effectElements[0].p.v;
            var position2 = effectElements[1].p.v;
            var isUniformScale = effectElements[2].p.v === 1;
            var scaleHeight = effectElements[3].p.v;
            var scaleWidth = isUniformScale ? scaleHeight : effectElements[4].p.v;
            var skew = effectElements[5].p.v;
            var skewAxis = effectElements[6].p.v;
            var rotation2 = effectElements[7].p.v;
            this.matrix.reset();
            this.matrix.translate(-anchor[0], -anchor[1], anchor[2]);
            this.matrix.scale(scaleWidth * 0.01, scaleHeight * 0.01, 1);
            this.matrix.rotate(-rotation2 * degToRads);
            this.matrix.skewFromAxis(-skew * degToRads, (skewAxis + 90) * degToRads);
            this.matrix.translate(position2[0], position2[1], 0);
            this._mdf = true;
            if (this.opacity !== effectElements[8].p.v) {
              this.opacity = effectElements[8].p.v;
              this._opMdf = true;
            }
          }
        };
        function SVGTransformEffect(_3, filterManager) {
          this.init(filterManager);
        }
        extendPrototype([TransformEffect], SVGTransformEffect);
        function CVTransformEffect(effectsManager) {
          this.init(effectsManager);
        }
        extendPrototype([TransformEffect], CVTransformEffect);
        registerRenderer("canvas", CanvasRenderer);
        registerRenderer("html", HybridRenderer);
        registerRenderer("svg", SVGRenderer);
        ShapeModifiers.registerModifier("tm", TrimModifier);
        ShapeModifiers.registerModifier("pb", PuckerAndBloatModifier);
        ShapeModifiers.registerModifier("rp", RepeaterModifier);
        ShapeModifiers.registerModifier("rd", RoundCornersModifier);
        ShapeModifiers.registerModifier("zz", ZigZagModifier);
        ShapeModifiers.registerModifier("op", OffsetPathModifier);
        setExpressionsPlugin(Expressions);
        setExpressionInterfaces(getInterface);
        initialize$1();
        initialize();
        registerEffect$1(20, SVGTintFilter, true);
        registerEffect$1(21, SVGFillFilter, true);
        registerEffect$1(22, SVGStrokeEffect, false);
        registerEffect$1(23, SVGTritoneFilter, true);
        registerEffect$1(24, SVGProLevelsFilter, true);
        registerEffect$1(25, SVGDropShadowEffect, true);
        registerEffect$1(28, SVGMatte3Effect, false);
        registerEffect$1(29, SVGGaussianBlurEffect, true);
        registerEffect$1(35, SVGTransformEffect, false);
        registerEffect(35, CVTransformEffect);
        return lottie;
      }));
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
     * Sent to allow native to fire a pixel for UI interactions.
     *
     * @param {import('../types/onboarding.ts').TelemetryEvent} event
     */
    telemetryEvent(event) {
      this.messaging.notify("telemetryEvent", event);
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
    /**
     * Subscribe to config updates pushed by native (e.g. customize step rows).
     * @param {(data: {stepDefinitions?: Record<string, any>, exclude?: string[]}) => void} params
     * @returns {() => void}
     */
    onConfigUpdate(params) {
      return this.messaging.subscribe("onConfigUpdate", params);
    }
    /**
     * Sent when the user wants to enable or disable ad blocking.
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setAdBlocking(params) {
      this.messaging.notify("setAdBlocking", params);
    }
    /**
     * Sent when the user selects their Address Bar Mode preference -- Search only or Search & Duck.ai
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setDuckAiInAddressBar(params) {
      this.messaging.notify("setDuckAiInAddressBar", params);
    }
    /**
     * Sent when the user opts in to installing the Chrome search extension during onboarding.
     * The UI advances immediately without waiting for the install to complete.
     */
    requestChromeExtensionInstall() {
      this.messaging.notify("requestChromeExtensionInstall");
    }
  };

  // ../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var a;
  var s;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l3, u3, t3) {
    var i3, r3, o3, e3 = {};
    for (o3 in u3) "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e3[o3] = u3[o3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
    return x(l3, e3, i3, r3, null);
  }
  function x(n2, t3, i3, r3, o3) {
    var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e3), e3;
  }
  function S(n2) {
    return n2.children;
  }
  function C(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function $(n2, l3) {
    if (null == l3) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u3 = n2.__v, t3 = u3.__e, i3 = [], r3 = [], o3 = m({}, u3);
      o3.__v = u3.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u3, n2.__n, n2.__P.namespaceURI, 32 & u3.__u ? [t3] : null, i3, null == t3 ? $(u3) : t3, !!(32 & u3.__u), r3), o3.__v = u3.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u3.__e = u3.__ = null, o3.__e != t3 && P(o3);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l3) {
      if (null != l3 && null != l3.__e) return n2.__e = n2.__c.base = l3.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l3 = 1; i.length; ) i.length > l3 && i.sort(e), n2 = i.shift(), l3 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l3, u3, t3, i3, r3, o3, e3, f3, c3, a3) {
    var s3, h3, p3, v3, y3, _3, g3 = t3 && t3.__k || w, m3 = l3.length;
    for (f3 = T(u3, l3, g3, f3, m3), s3 = 0; s3 < m3; s3++) null != (p3 = u3.__k[s3]) && (h3 = -1 != p3.__i && g3[p3.__i] || d, p3.__i = s3, _3 = q(n2, p3, h3, i3, r3, o3, e3, f3, c3, a3), v3 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), a3.push(p3.ref, p3.__c || v3, p3)), null == y3 && null != v3 && (y3 = v3), 4 & p3.__u ? (f3 = j(p3, f3, n2), h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _3 ? f3 = _3 : v3 && (f3 = v3.nextSibling), p3.__u &= -7);
    return u3.__e = y3, f3;
  }
  function T(n2, l3, u3, t3, i3) {
    var r3, o3, e3, f3, c3, a3 = u3.length, s3 = a3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f3 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = O(o3, u3, f3, s3)) && (s3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (s3) for (r3 = 0; r3 < a3; r3++) null != (e3 = u3[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = $(e3)), K(e3, e3));
    return t3;
  }
  function j(n2, l3, u3) {
    var t3, i3;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++) t3[i3] && (t3[i3].__ = n2, l3 = j(t3[i3], l3, u3));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !l3.parentNode && (l3 = $(n2)), l3 = u3.insertBefore(n2.__e, l3 || null));
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function O(n2, l3, u3, t3) {
    var i3, r3, o3, e3 = n2.key, f3 = n2.type, c3 = l3[u3], a3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e3 || a3 && e3 == c3.key && f3 == c3.type) return u3;
    if (t3 > (a3 ? 1 : 0)) {
      for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type) return o3;
    }
    return -1;
  }
  function z(n2, l3, u3) {
    "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || _.test(l3) ? u3 : u3 + "px";
  }
  function N(n2, l3, u3, t3, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u3 && l3 in u3 || z(n2.style, l3, "");
      if (u3) for (l3 in u3) t3 && u3[l3] == t3[l3] || z(n2.style, l3, u3[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(s, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3[a] = t3[a] : (u3[a] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
  }
  function V(n2) {
    return function(u3) {
      if (this.l) {
        var t3 = this.l[u3.type + n2];
        if (null == u3[c]) u3[c] = h++;
        else if (u3[c] < t3[a]) return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function q(n2, u3, t3, i3, r3, o3, e3, f3, c3, a3) {
    var s3, h3, p3, v3, y3, d3, _3, k3, x3, M, I2, P2, A3, H2, T3, j3, F = u3.type;
    if (void 0 !== u3.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f3 = u3.__e = t3.__e]), (s3 = l.__b) && s3(u3);
    n: if ("function" == typeof F) {
      h3 = e3.length;
      try {
        if (x3 = u3.props, M = F.prototype && F.prototype.render, I2 = (s3 = F.contextType) && i3[s3.__c], P2 = s3 ? I2 ? I2.props.value : s3.__ : i3, t3.__c ? k3 = (p3 = u3.__c = t3.__c).__ = p3.__E : (M ? u3.__c = p3 = new F(x3, P2) : (u3.__c = p3 = new C(x3, P2), p3.constructor = F, p3.render = Q), I2 && I2.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v3 = p3.__d = true, p3.__h = [], p3._sb = []), M && null == p3.__s && (p3.__s = p3.state), M && null != F.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, F.getDerivedStateFromProps(x3, p3.__s))), y3 = p3.props, d3 = p3.state, p3.__v = u3, v3) M && null == F.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x3 !== y3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x3, P2), u3.__v == t3.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x3, p3.__s, P2)) {
            u3.__v != t3.__v && (p3.props = x3, p3.state = p3.__s, p3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
              n3 && (n3.__ = u3);
            }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e3.push(p3), f3 = $(t3);
            break n;
          }
          null != p3.componentWillUpdate && p3.componentWillUpdate(x3, p3.__s, P2), M && null != p3.componentDidUpdate && p3.__h.push(function() {
            p3.componentDidUpdate(y3, d3, _3);
          });
        }
        if (p3.context = P2, p3.props = x3, p3.__P = n2, p3.__e = false, A3 = l.__r, H2 = 0, M) p3.state = p3.__s, p3.__d = false, A3 && A3(u3), s3 = p3.render(p3.props, p3.state, p3.context), w.push.apply(p3.__h, p3._sb), p3._sb = [];
        else do {
          p3.__d = false, A3 && A3(u3), s3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
        } while (p3.__d && ++H2 < 25);
        p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M && !v3 && null != p3.getSnapshotBeforeUpdate && (_3 = p3.getSnapshotBeforeUpdate(y3, d3)), T3 = null != s3 && s3.type === S && null == s3.key ? E(s3.props.children) : s3, f3 = L(n2, g(T3) ? T3 : [T3], u3, t3, i3, r3, o3, e3, f3, c3, a3), p3.base = u3.__e, u3.__u &= -161, p3.__h.length && e3.push(p3), k3 && (p3.__E = p3.__ = null);
      } catch (n3) {
        if (e3.length = h3, u3.__v = null, c3 || null != o3) {
          if (n3.then) {
            for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; ) f3 = f3.nextSibling;
            null != o3 && (o3[o3.indexOf(f3)] = null), u3.__e = f3;
          } else if (null != o3) for (j3 = o3.length; j3--; ) b(o3[j3]);
        } else u3.__e = t3.__e;
        null == u3.__k && (u3.__k = t3.__k || []), n3.then || B(u3), l.__e(n3, u3, t3);
      }
    } else null == o3 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = G(t3.__e, u3, t3, i3, r3, o3, e3, c3, a3);
    return (s3 = l.diffed) && s3(u3), 128 & u3.__u ? void 0 : f3;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u3, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) J(t3[i3], t3[++i3], t3[++i3]);
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
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
  }
  function G(u3, t3, i3, r3, o3, e3, f3, c3, a3) {
    var s3, h3, p3, v3, y3, w3, _3, m3 = i3.props || d, k3 = t3.props, x3 = t3.type;
    if ("svg" == x3 ? o3 = "http://www.w3.org/2000/svg" : "math" == x3 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (s3 = 0; s3 < e3.length; s3++) if ((y3 = e3[s3]) && "setAttribute" in y3 == !!x3 && (x3 ? y3.localName == x3 : 3 == y3.nodeType)) {
        u3 = y3, e3[s3] = null;
        break;
      }
    }
    if (null == u3) {
      if (null == x3) return document.createTextNode(k3);
      u3 = document.createElementNS(o3, x3, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x3) m3 === k3 || c3 && u3.data == k3 || (u3.data = k3);
    else {
      if (e3 = "textarea" == x3 && null != k3.defaultValue ? null : e3 && n.call(u3.childNodes), !c3 && null != e3) for (m3 = {}, s3 = 0; s3 < u3.attributes.length; s3++) m3[(y3 = u3.attributes[s3]).name] = y3.value;
      for (s3 in m3) y3 = m3[s3], "dangerouslySetInnerHTML" == s3 ? p3 = y3 : "children" == s3 || s3 in k3 || "value" == s3 && "defaultValue" in k3 || "checked" == s3 && "defaultChecked" in k3 || N(u3, s3, null, y3, o3);
      for (s3 in k3) y3 = k3[s3], "children" == s3 ? v3 = y3 : "dangerouslySetInnerHTML" == s3 ? h3 = y3 : "value" == s3 ? w3 = y3 : "checked" == s3 ? _3 = y3 : c3 && "function" != typeof y3 || m3[s3] === y3 || N(u3, s3, y3, m3[s3], o3);
      if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t3.__k = [];
      else if (p3 && (u3.innerHTML = ""), L("template" == t3.type ? u3.content : u3, g(v3) ? v3 : [v3], t3, i3, r3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o3, e3, f3, e3 ? e3[0] : i3.__k && $(i3, 0), c3, a3), null != e3) for (s3 = e3.length; s3--; ) b(e3[s3]);
      c3 && "textarea" != x3 || (s3 = "value", "progress" == x3 && null == w3 ? u3.removeAttribute("value") : null != w3 && (w3 !== u3[s3] || "progress" == x3 && !w3 || "option" == x3 && w3 != m3[s3]) && N(u3, s3, w3, m3[s3], o3), s3 = "checked", null != _3 && _3 != u3[s3] && N(u3, s3, _3, m3[s3], o3));
    }
    return u3;
  }
  function J(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function K(n2, u3, t3) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i3.base = i3.__P = i3.__n = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u3, t3 || "function" != typeof n2.type);
    t3 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function R(u3, t3, i3) {
    var r3, o3, e3, f3;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], q(t3, u3 = (!r3 && i3 || t3).__k = k(S, null, [u3]), o3 || d, d, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f3), D(e3, u3, f3), u3.props.children = null;
  }
  function X(n2) {
    function l3(n3) {
      var u3, t3;
      return this.getChildContext || (u3 = /* @__PURE__ */ new Set(), (t3 = {})[l3.__c] = this, this.getChildContext = function() {
        return t3;
      }, this.componentWillUnmount = function() {
        u3 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value != n4.value && u3.forEach(function(n5) {
          n5.__e = true, A(n5);
        });
      }, this.sub = function(n4) {
        u3.add(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u3 && u3.delete(n4), l4 && l4.call(n4);
        };
      }), n3.children;
    }
    return l3.__c = "__cC" + y++, l3.__ = n2, l3.Provider = l3.__l = (l3.Consumer = function(n3, l4) {
      return n3.children(l4);
    }).contextType = l3, l3;
  }
  n = w.slice, l = { __e: function(n2, l3, u3, t3) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, C.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u3), this.props)), n2 && m(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // pages/onboarding/app/v4/App.module.css
  var App_default = {
    container: "App_container"
  };

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
  var m2 = c2.unmount;
  var p2 = c2.__;
  function s2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
  }
  function d2(n2) {
    return o2 = 1, y2(D2, n2);
  }
  function y2(n2, u3, i3) {
    var o3 = s2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u4 = false, i4 = o3.__c.props !== n3;
        if (o3.__c.__H.__.some(function(n4) {
          if (n4.__N) {
            u4 = true;
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3) {
          var f4 = c3.call(this, n3, t3, r3);
          return u4 ? f4 || i4 : f4;
        }
        return !u4 || i4;
      };
      r2.__f = true;
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
  function h2(n2, u3) {
    var i3 = s2(t2++, 3);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
  }
  function _2(n2, u3) {
    var i3 = s2(t2++, 4);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u3 = s2(t2++, 7);
    return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
  }
  function q2(n2, t3) {
    return o2 = 8, T2(function() {
      return n2;
    }, t3);
  }
  function x2(n2) {
    var u3 = r2.context[n2.__c], i3 = s2(t2++, 9);
    return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
  }
  function g2() {
    var n2 = s2(t2++, 11);
    if (!n2.__) {
      for (var u3 = r2.__v; null !== u3 && !u3.__m && null !== u3.__; ) u3 = u3.__;
      var i3 = u3.__m || (u3.__m = [0, 0]);
      n2.__ = "P" + i3[0] + "-" + i3[1]++;
    }
    return n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) {
      var t3 = n2.__H;
      if (n2.__P && t3) try {
        t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], c2.__e(r3, n2.__v);
      }
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), p2 && p2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u, n3.u = void 0);
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.some(function(n3) {
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
    }, u3 = setTimeout(r3, 35);
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
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // pages/onboarding/app/shared/components/SettingsProvider.js
  var SettingsContext = X(
    /** @type {SettingsContextValue} */
    {}
  );
  function SettingsProvider({ platform, typingEffect = "title", children }) {
    const value2 = T2(() => ({ platform, typingEffect }), [platform, typingEffect]);
    return /* @__PURE__ */ k(SettingsContext.Provider, { value: value2 }, children);
  }
  function usePlatformName() {
    return x2(SettingsContext).platform?.name;
  }
  function useTypingEffect() {
    return x2(SettingsContext).typingEffect;
  }

  // pages/onboarding/app/global.js
  var GlobalContext = X(
    /** @type {GlobalState} */
    {}
  );
  var GlobalDispatch = X(
    /** @type {import("preact/hooks").Dispatch<GlobalEvents>} */
    {}
  );
  function reducer(state, action) {
    if (action.kind === "config-update") {
      let nextStepDefs = state.stepDefinitions;
      if (action.stepDefinitions) {
        nextStepDefs = { ...state.stepDefinitions };
        for (const [key2, value2] of Object.entries(action.stepDefinitions)) {
          if (typeof value2 === "object" && value2 !== null && nextStepDefs[key2]) {
            nextStepDefs[key2] = { ...nextStepDefs[key2], ...value2 };
          } else {
            nextStepDefs[key2] = value2;
          }
        }
      }
      let nextOrder = state.order;
      if (action.exclude) {
        nextOrder = state.order.filter((id) => !action.exclude?.includes(id));
      }
      return {
        ...state,
        stepDefinitions: nextStepDefs,
        order: nextOrder,
        step: nextStepDefs[state.activeStep] ?? state.step
      };
    }
    switch (state.status.kind) {
      case "idle": {
        switch (action.kind) {
          case "update-system-value": {
            return { ...state, status: { kind: "executing", action } };
          }
          case "error-boundary": {
            return { ...state, status: { kind: "fatal", action } };
          }
          case "title-complete": {
            return {
              ...state,
              activeStepVisible: true
            };
          }
          case "advance": {
            const currentPageIndex = state.order.indexOf(state.activeStep);
            const nextPageIndex = currentPageIndex + 1;
            if (nextPageIndex < state.order.length) {
              return {
                ...state,
                activeStep: state.order[nextPageIndex],
                nextStep: state.order[nextPageIndex + 1],
                activeRow: 0,
                activeStepVisible: false,
                exiting: false,
                overlay: null,
                step: state.stepDefinitions[state.order[nextPageIndex]]
              };
            }
            return state;
          }
          case "enqueue-next": {
            return {
              ...state,
              exiting: true
            };
          }
          case "show-overlay": {
            return {
              ...state,
              overlay: action.overlay
            };
          }
          case "dismiss-overlay": {
            return {
              ...state,
              overlay: null
            };
          }
          default:
            return state;
        }
      }
      case "executing": {
        switch (action.kind) {
          case "telemetry":
            return state;
          case "exec-complete": {
            if (state.step.kind === "settings") {
              const currentRow = state.step.rows[state.activeRow];
              const isCurrent = currentRow === action.id;
              const systemValueId = action.id;
              const isAdBlockingSetting = systemValueId === "placebo-ad-blocking" || systemValueId === "aggressive-ad-blocking" || systemValueId === "youtube-ad-blocking";
              const nextOrder = isAdBlockingSetting && action.payload.enabled ? state.order.filter((step) => step !== "duckPlayerSingle") : state.order;
              const nextUIState = isCurrent && action.payload.enabled ? "accepted" : "skipped";
              return {
                ...state,
                status: { kind: "idle" },
                step: {
                  // bump the step (show the next row)
                  ...state.step
                },
                order: nextOrder,
                activeRow: isCurrent ? state.activeRow + 1 : state.activeRow,
                values: {
                  ...state.values,
                  // store the updated value in global state
                  [systemValueId]: action.payload
                },
                UIValues: {
                  ...state.UIValues,
                  // store the UI state, so we know if it was skipped or not
                  [systemValueId]: nextUIState
                }
              };
            }
            if (state.step.kind === "info") {
              return {
                ...state,
                status: { kind: "idle" },
                values: {
                  ...state.values,
                  [action.id]: action.payload
                }
              };
            }
            throw new Error("unimplemented");
          }
          case "exec-error": {
            return {
              ...state,
              status: { kind: "idle", error: action.message }
            };
          }
          default:
            throw new Error("unhandled " + action.kind);
        }
      }
    }
    return state;
  }
  function GlobalProvider({ order, children, stepDefinitions: stepDefinitions2, messaging: messaging2, firstPage = "welcome" }) {
    const [state, dispatch] = y2(reducer, {
      status: { kind: "idle" },
      order,
      stepDefinitions: stepDefinitions2,
      step: stepDefinitions2[firstPage],
      activeStep: firstPage,
      nextStep: order[1],
      activeRow: 0,
      activeStepVisible: false,
      exiting: false,
      overlay: null,
      values: {},
      UIValues: {
        dock: "idle",
        import: "idle",
        "default-browser": "idle",
        bookmarks: "idle",
        "session-restore": "idle",
        "home-shortcut": "idle",
        "placebo-ad-blocking": "idle",
        "aggressive-ad-blocking": "idle",
        "youtube-ad-blocking": "idle",
        "address-bar-mode": "idle",
        "dock-instructions": "idle",
        "chrome-extension-install": "idle"
      }
    });
    const platform = usePlatformName();
    const proxy = q2(
      (msg) => {
        dispatch(msg);
        if (msg.kind === "advance") {
          const currentIndex = state.order.indexOf(state.activeStep);
          const next = state.order[currentIndex + 1] ?? null;
          messaging2.stepCompleted({ id: state.activeStep, next });
          if (next) {
            const nextStepDef = state.stepDefinitions[next];
            if (nextStepDef?.kind === "settings" && nextStepDef.rows[0]) {
              messaging2.telemetryEvent({ attributes: { name: "row_shown", value: nextStepDef.rows[0] } });
            }
          }
        }
        if (msg.kind === "show-overlay" && msg.overlay === "dock-instructions") {
          messaging2.telemetryEvent({ attributes: { name: "dock_instructions_shown" } });
        }
        if (msg.kind === "update-system-value" && !msg.payload.enabled && msg.current) {
          messaging2.telemetryEvent({ attributes: { name: "row_skipped", value: msg.id } });
        }
        if (msg.kind === "telemetry") {
          messaging2.telemetryEvent({ attributes: msg.attributes });
        }
        if (msg.kind === "dismiss-to-settings") {
          messaging2.dismissToSettings();
        }
        if (msg.kind === "dismiss") {
          messaging2.dismissToAddressBar();
        }
        if (msg.kind === "request-chrome-extension") {
          messaging2.requestChromeExtensionInstall();
        }
      },
      [state, messaging2]
    );
    h2(() => {
      const unsubscribe = messaging2.onConfigUpdate((data2) => {
        dispatch({
          kind: "config-update",
          stepDefinitions: data2.stepDefinitions,
          exclude: (
            /** @type {import('./types.js').ConfigUpdateEvent['exclude']} */
            data2.exclude
          )
        });
      });
      return unsubscribe;
    }, [messaging2]);
    h2(() => {
      if (state.status.kind !== "fatal") return;
      const { error } = state.status.action;
      messaging2.reportPageException(error);
    }, [state.status.kind, messaging2]);
    h2(() => {
      if (state.status.kind !== "executing") return;
      if (state.status.action.kind !== "update-system-value") throw new Error("only update-system-value is currently supported");
      const action = state.status.action;
      handleSystemSettingUpdate(action, messaging2, platform).then((payload) => {
        dispatch({
          kind: "exec-complete",
          id: action.id,
          payload
        });
        if (state.step?.kind === "settings") {
          const currentRow = state.step.rows[state.activeRow];
          if (currentRow === action.id) {
            const nextRowId = state.step.rows[state.activeRow + 1];
            if (nextRowId) {
              messaging2.telemetryEvent({ attributes: { name: "row_shown", value: nextRowId } });
            }
          }
        }
      }).catch((e3) => {
        const message = e3?.message || "unknown error";
        dispatch({ kind: "exec-error", id: action.id, message });
      });
    }, [state.status.kind, messaging2]);
    return /* @__PURE__ */ k(GlobalContext.Provider, { value: state }, /* @__PURE__ */ k(GlobalDispatch.Provider, { value: proxy }, children));
  }
  async function handleSystemSettingUpdate(action, messaging2, platform) {
    const { id, payload } = action;
    switch (id) {
      case "bookmarks": {
        messaging2.setBookmarksBar(payload);
        return payload;
      }
      case "session-restore": {
        messaging2.setSessionRestore(payload);
        return payload;
      }
      case "home-shortcut": {
        messaging2.setShowHomeButton(payload);
        return payload;
      }
      case "placebo-ad-blocking":
      case "aggressive-ad-blocking":
      case "youtube-ad-blocking": {
        messaging2.setAdBlocking(payload);
        return payload;
      }
      case "address-bar-mode": {
        messaging2.setDuckAiInAddressBar(payload);
        return payload;
      }
      case "dock": {
        if (payload.enabled) {
          await messaging2.requestDockOptIn();
          return { enabled: true };
        }
        break;
      }
      case "import": {
        if (payload.enabled) {
          if (platform === "macos") {
            return await messaging2.requestImport();
          }
          await messaging2.requestImport();
          return { enabled: true };
        }
        break;
      }
      case "default-browser": {
        if (payload.enabled) {
          await messaging2.requestSetAsDefault();
          return { enabled: true };
        }
        break;
      }
    }
    if ("value" in payload) {
      return { enabled: payload.enabled, value: payload.value };
    }
    return { enabled: payload.enabled };
  }
  function useGlobalState() {
    return x2(GlobalContext);
  }
  function useGlobalDispatch() {
    return x2(GlobalDispatch);
  }

  // shared/hooks/useMediaQuery.js
  function useMediaQuery(query) {
    const [matches, setMatches] = d2(() => window.matchMedia(query).matches);
    h2(() => {
      const mql = window.matchMedia(query);
      setMatches(mql.matches);
      const handler = () => setMatches(mql.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }, [query]);
    return matches;
  }

  // shared/components/EnvironmentProvider.js
  var EnvironmentContext = X({
    isReducedMotion: false,
    isDarkMode: false,
    debugState: false,
    injectName: (
      /** @type {import('../environment').Environment['injectName']} */
      "windows"
    ),
    willThrow: false,
    /** @type {keyof typeof import('../utils').translationsLocales} */
    locale: "en",
    /** @type {import('../environment').Environment['env']} */
    env: "production"
  });
  var THEME_QUERY = "(prefers-color-scheme: dark)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function EnvironmentProvider({
    children,
    debugState,
    env = "production",
    willThrow = false,
    injectName = "windows",
    locale = "en"
  }) {
    const isDarkMode = useMediaQuery(THEME_QUERY);
    const [isReducedMotion, setReducedMotion] = d2(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    h2(() => {
      const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e3) => setter(e3.matches);
      mediaQueryList.addEventListener("change", listener);
      setter(mediaQueryList.matches);
      function setter(value2) {
        document.documentElement.dataset.reducedMotion = String(value2);
        setReducedMotion(value2);
      }
      window.addEventListener("toggle-reduced-motion", () => {
        setter(true);
      });
      return () => mediaQueryList.removeEventListener("change", listener);
    }, []);
    return /* @__PURE__ */ k(
      EnvironmentContext.Provider,
      {
        value: {
          isReducedMotion,
          debugState,
          isDarkMode,
          injectName,
          willThrow,
          env,
          locale
        }
      },
      children
    );
  }
  function UpdateEnvironment({ search }) {
    h2(() => {
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

  // shared/components/ErrorBoundary.js
  var ErrorBoundary = class extends C {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error, info) {
      console.error(error);
      console.log(info);
      let message = error.message;
      if (typeof message !== "string") message = "unknown";
      const composed = this.props.context ? [this.props.context, message].join(" ") : message;
      this.props.didCatch({ error, message: composed, info });
    }
    render() {
      if (this.state.hasError) {
        return this.props.fallback;
      }
      return this.props.children;
    }
  };

  // pages/onboarding/app/shared/components/Stack.module.css
  var Stack_default = {
    stack: "Stack_stack"
  };

  // ../node_modules/@formkit/auto-animate/index.mjs
  var parents = /* @__PURE__ */ new Set();
  var coords = /* @__PURE__ */ new WeakMap();
  var siblings = /* @__PURE__ */ new WeakMap();
  var animations = /* @__PURE__ */ new WeakMap();
  var intersections = /* @__PURE__ */ new WeakMap();
  var mutationObservers = /* @__PURE__ */ new WeakMap();
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
  var handleMutations = (mutations) => {
    const elements = getElements(mutations);
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
  function isOffscreen(el) {
    const rect = el.getBoundingClientRect();
    const vw = (root === null || root === void 0 ? void 0 : root.clientWidth) || 0;
    const vh = (root === null || root === void 0 ? void 0 : root.clientHeight) || 0;
    return rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw;
  }
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
  function updatePos(el, debounce = true) {
    clearTimeout(debounces.get(el));
    const optionsOrPlugin = getOptions(el);
    const delay = debounce ? isPlugin(optionsOrPlugin) ? 500 : optionsOrPlugin.duration : 0;
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
      parents.forEach((parent2) => forEach(parent2, (el) => lowPriority(() => updatePos(el))));
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
  var resize;
  var supportedBrowser = typeof window !== "undefined" && "ResizeObserver" in window;
  if (supportedBrowser) {
    root = document.documentElement;
    new MutationObserver(handleMutations);
    resize = new ResizeObserver(handleResizes);
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      scrollX = window.scrollX;
    });
    resize.observe(root);
  }
  function getElements(mutations) {
    const observedNodes = mutations.reduce((nodes, mutation) => {
      return [
        ...nodes,
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes)
      ];
    }, []);
    const onlyCommentNodesObserved = observedNodes.every((node) => node.nodeName === "#comment");
    if (onlyCommentNodesObserved)
      return false;
    return mutations.reduce((elements, mutation) => {
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
    var _a, _b;
    const isMounted = el.isConnected;
    const preExisting = coords.has(el);
    if (isMounted && siblings.has(el))
      siblings.delete(el);
    if (((_a = animations.get(el)) === null || _a === void 0 ? void 0 : _a.playState) !== "finished") {
      (_b = animations.get(el)) === null || _b === void 0 ? void 0 : _b.cancel();
    }
    if (NEW in el) {
      add2(el);
    } else if (preExisting && isMounted) {
      remain(el);
    } else if (preExisting && !isMounted) {
      remove(el);
    } else {
      add2(el);
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
  function forEach(parent2, ...callbacks) {
    callbacks.forEach((callback) => callback(parent2, options.has(parent2)));
    for (let i3 = 0; i3 < parent2.children.length; i3++) {
      const child = parent2.children.item(i3);
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
    if (isOffscreen(el)) {
      coords.set(el, newCoords);
      observePosition(el);
      return;
    }
    let animation;
    if (!oldCoords)
      return;
    const pluginOrOptions = getOptions(el);
    if (typeof pluginOrOptions !== "function") {
      let deltaLeft = oldCoords.left - newCoords.left;
      let deltaTop = oldCoords.top - newCoords.top;
      const deltaRight = oldCoords.left + oldCoords.width - (newCoords.left + newCoords.width);
      const deltaBottom = oldCoords.top + oldCoords.height - (newCoords.top + newCoords.height);
      if (deltaBottom == 0)
        deltaTop = 0;
      if (deltaRight == 0)
        deltaLeft = 0;
      const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(el, oldCoords, newCoords);
      const start = {
        transform: `translate(${deltaLeft}px, ${deltaTop}px)`
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
    animation.addEventListener("finish", updatePos.bind(null, el, false), {
      once: true
    });
  }
  function add2(el) {
    if (NEW in el)
      delete el[NEW];
    const newCoords = getCoords(el);
    coords.set(el, newCoords);
    const pluginOrOptions = getOptions(el);
    if (!isEnabled(el))
      return;
    if (isOffscreen(el)) {
      observePosition(el);
      return;
    }
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
    animation.addEventListener("finish", updatePos.bind(null, el, false), {
      once: true
    });
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
    const [top, left, width2, height2] = deletePosition(el);
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
      width: `${width2}px`,
      height: `${height2}px`,
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
      ], {
        duration: optionsOrPlugin.duration,
        easing: "ease-out"
      });
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
    animation.addEventListener("finish", () => cleanUp(el, styleReset), {
      once: true
    });
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
    const parent2 = el.parentElement;
    let lastHeight = parent2.clientHeight;
    let lastWidth = parent2.clientWidth;
    const startScroll = performance.now();
    function smoothScroll() {
      requestAnimationFrame(() => {
        if (!isPlugin(optionsOrPlugin)) {
          const deltaY = lastHeight - parent2.clientHeight;
          const deltaX = lastWidth - parent2.clientWidth;
          if (startScroll + optionsOrPlugin.duration > performance.now()) {
            window.scrollTo({
              left: window.scrollX - deltaX,
              top: window.scrollY - deltaY
            });
            lastHeight = parent2.clientHeight;
            lastWidth = parent2.clientWidth;
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
    var _a;
    const oldCoords = coords.get(el);
    const [width2, , height2] = getTransitionSizes(el, oldCoords, getCoords(el));
    let offsetParent = el.parentElement;
    while (offsetParent && (getComputedStyle(offsetParent).position === "static" || offsetParent instanceof HTMLBodyElement)) {
      offsetParent = offsetParent.parentElement;
    }
    if (!offsetParent)
      offsetParent = document.body;
    const parentStyles = getComputedStyle(offsetParent);
    const parentCoords = !animations.has(el) || ((_a = animations.get(el)) === null || _a === void 0 ? void 0 : _a.playState) === "finished" ? getCoords(offsetParent) : coords.get(offsetParent);
    const top = Math.round(oldCoords.top - parentCoords.top) - raw(parentStyles.borderTopWidth);
    const left = Math.round(oldCoords.left - parentCoords.left) - raw(parentStyles.borderLeftWidth);
    return [top, left, width2, height2];
  }
  function autoAnimate(el, config = {}) {
    if (supportedBrowser && resize) {
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
          options.set(el, {
            duration: 250,
            easing: "ease-in-out",
            ...config
          });
        }
        const mo = new MutationObserver(handleMutations);
        mo.observe(el, { childList: true });
        mutationObservers.set(el, mo);
        parents.add(el);
      }
    }
    const controller = Object.freeze({
      parent: el,
      enable: () => {
        enabled.add(el);
      },
      disable: () => {
        enabled.delete(el);
        forEach(el, (node) => {
          const a3 = animations.get(node);
          try {
            a3 === null || a3 === void 0 ? void 0 : a3.cancel();
          } catch {
          }
          animations.delete(node);
          const d3 = debounces.get(node);
          if (d3)
            clearTimeout(d3);
          debounces.delete(node);
          const i3 = intervals.get(node);
          if (i3)
            clearInterval(i3);
          intervals.delete(node);
        });
      },
      isEnabled: () => enabled.has(el),
      destroy: () => {
        enabled.delete(el);
        parents.delete(el);
        options.delete(el);
        const mo = mutationObservers.get(el);
        mo === null || mo === void 0 ? void 0 : mo.disconnect();
        mutationObservers.delete(el);
        forEach(el, (node) => {
          resize === null || resize === void 0 ? void 0 : resize.unobserve(node);
          const a3 = animations.get(node);
          try {
            a3 === null || a3 === void 0 ? void 0 : a3.cancel();
          } catch {
          }
          animations.delete(node);
          const io = intersections.get(node);
          io === null || io === void 0 ? void 0 : io.disconnect();
          intersections.delete(node);
          const i3 = intervals.get(node);
          if (i3)
            clearInterval(i3);
          intervals.delete(node);
          const d3 = debounces.get(node);
          if (d3)
            clearTimeout(d3);
          debounces.delete(node);
          coords.delete(node);
          siblings.delete(node);
        });
      }
    });
    return controller;
  }

  // ../node_modules/@formkit/auto-animate/preact/index.mjs
  function useAutoAnimate(options2) {
    const element = A2(null);
    const [controller, setController] = d2();
    const setEnabled = (enabled2) => {
      if (controller) {
        enabled2 ? controller.enable() : controller.disable();
      }
    };
    h2(() => {
      if (element.current instanceof HTMLElement)
        setController(autoAnimate(element.current, options2 || {}));
    }, []);
    h2(() => {
      return () => {
        var _a;
        (_a = controller === null || controller === void 0 ? void 0 : controller.destroy) === null || _a === void 0 ? void 0 : _a.call(controller);
      };
    }, [controller]);
    return [element, setEnabled];
  }

  // pages/onboarding/app/shared/components/Stack.js
  function Stack({ children, gap = "var(--sp-6)", className = "", animate: animate2 = false, debug = false }) {
    const { isReducedMotion } = useEnv();
    const [parent2] = useAutoAnimate({ duration: isReducedMotion ? 0 : 300 });
    const classNames = [Stack_default.stack, className].filter(Boolean).join(" ");
    return /* @__PURE__ */ k("div", { class: classNames, ref: animate2 ? parent2 : null, "data-debug": String(debug), style: { gap } }, children);
  }
  Stack.gaps = {
    6: "var(--sp-6)",
    4: "var(--sp-4)",
    3: "var(--sp-3)",
    0: "0"
  };

  // pages/onboarding/app/shared/components/Content.module.css
  var Content_default = {
    wrapper: "Content_wrapper",
    indent: "Content_indent"
  };

  // pages/onboarding/app/shared/components/Content.js
  function Content({ children }) {
    return /* @__PURE__ */ k("div", { className: Content_default.indent }, /* @__PURE__ */ k("div", { className: Content_default.wrapper }, children));
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
      note: "Button label prompting user to set DuckDuckGo as their default browser."
    },
    makeDefaultAccept_title: {
      title: "Excellent! I was hoping you\u2019d pick me.",
      note: "Page title shown if a user chose to make DuckDuckGo their default browser."
    },
    taskbar_title: {
      title: "Want me to stick around in the taskbar?",
      note: "Title for a page that asks the user to add the DuckDuckGo browser to their Windows taskbar."
    },
    dock_title: {
      title: "Want me to stick around in the dock?",
      note: "Title for a page that asks the user to add the DuckDuckGo browser to their dock on macOS."
    },
    duckPlayer_title: {
      title: "Drowning in ads on YouTube? Not with Duck Player!",
      note: "Title for a page that shows the benefits of using the Duck Player feature to watch YouTube videos more privately."
    },
    duckPlayer_subtitle: {
      title: "No targeted ads. No targeted recommendations. Just your video.",
      note: "Subtitle for a page that shows the benefits of using the Duck Player feature to watch YouTube videos more privately."
    },
    duckPlayer_v4_title: {
      title: "Drowning in ads on YouTube?{newline}Not with Duck Player!",
      note: "Title for the Duck Player step in v4 onboarding, with a line break after the question."
    },
    duckPlayer_v4_subtitle: {
      title: "No targeted ads. No targeted recommendations.{newline}Just your video.",
      note: "Subtitle for the Duck Player step in v4 onboarding, with a line break before the last sentence."
    },
    duckPlayer_adFree_title: {
      title: "Watch YouTube ad-free!",
      note: "Title for the Duck Player step variant that emphasizes ad-free YouTube viewing."
    },
    duckPlayer_adFree_subtitle: {
      title: "No need for a premium subscription or third-party plugins.{newline}Just your video, without the ads.",
      note: "Subtitle for the Duck Player step variant that emphasizes ad-free YouTube viewing."
    },
    addressBarMode_title: {
      title: "Want easy access to private AI Chat?",
      note: "Title for the Address Bar Mode feature step in onboarding"
    },
    addressBarMode_searchAndDuckAi: {
      title: "Search & Duck.ai",
      note: "Button label for enabling search with Duck.ai in the address bar"
    },
    addressBarMode_searchOnly: {
      title: "Search Only",
      note: "Button label for search only mode in the address bar"
    },
    addressBarMode_footer: {
      title: "AI features are private and optional. You can make changes in <b>Settings > AI Features</b>.",
      note: "Footer text explaining AI features are optional and can be changed in settings. The <b> tag is used to bold the settings path."
    },
    customize_title_v3: {
      title: "Let\u2019s customize a few things\u2026",
      note: "Title for a page that allows the user to customize specific settings in the DuckDuckGo browser."
    },
    customize_subtitle_v3: {
      title: "Set things up just the way you want.",
      note: "Subtitle for a page that allows the user to customize specific settings in the DuckDuckGo browser."
    },
    systemSettings_title_v3: {
      title: "Let\u2019s get you set up!",
      note: "Title for a page that allows the user to customize system settings for the DuckDuckGo browser"
    },
    systemSettings_subtitle_v3: {
      title: "It\u2019s easy to make me your go-to browser.",
      note: "Subtitle for a page that allows the user to customize system settings for the DuckDuckGo browser"
    },
    row_bookmarks_title_v3: {
      title: "Show a bookmarks bar with your favorite sites",
      note: "Heading for a toggle that puts the bookmarks bar withing easy reach of the user."
    },
    "row_session-restore_title_v3": {
      title: "Restore previous websites on startup",
      note: "Heading for a toggle that restores the user's previously open tabs when relaunching the browser."
    },
    "row_home-shortcut_title_v3": {
      title: "Add a shortcut to your homepage in the toolbar",
      note: "Heading for a toggle that adds the user's homepage to the browser toolbar."
    },
    "row_default-browser_title_v3": {
      title: "Make DuckDuckGo your default browser",
      note: "Title for the default browser suggestion, encourages users to make DuckDuckGo their primary browser."
    },
    row_import_title_v3: {
      title: "Import bookmarks and passwords",
      note: "Title for importing user data (bookmarks, passwords) to DuckDuckGo from other browsers."
    },
    row_import_summary_v3: {
      title: "On-device encryption keeps your passwords secure.",
      note: "Explanation of additional security benefits of importing user's passwords into DuckDuckGo."
    },
    row_import_accept_v3: {
      title: "Import Now",
      note: "The text shown in the button to perform the import action."
    },
    row_taskbar_title_v3: {
      title: "Keep DuckDuckGo in your Taskbar",
      note: "Suggests users to keep DuckDuckGo in their taskbar for quick access."
    },
    row_taskbar_summary_v3: {
      title: 'Choose "Yes" when prompted in the bottom right.',
      note: "Instructs the user to add DuckDuckGo to their taskbar by clicking Yes on a dialog screen."
    },
    row_dock_title_v3: {
      title: "Keep DuckDuckGo in your Dock",
      note: "Suggests users to keep DuckDuckGo in their dock for quick access."
    },
    row_dock_summary_v3: {
      title: "Get to DuckDuckGo faster.",
      note: "Instructs the user to add DuckDuckGo to their taskbar by clicking Yes on a dialog screen."
    },
    "row_placebo-ad-blocking_title_v3": {
      title: "Block even more ads",
      note: "Title for the enhanced ad blocking setting."
    },
    "row_aggressive-ad-blocking_title_v3": {
      title: "Block even more ads, including on YouTube",
      note: "Title for the enhanced ad blocking setting."
    },
    "row_ad-blocking_desc_v3": {
      title: "Enhanced ad blocking stops even more ads.",
      note: "Description for the enhanced ad blocking setting."
    },
    "row_ad-blocking_accept_v3": {
      title: "Turn on Enhanced Ad Blocking",
      note: "Button text to enable enhanced ad blocking."
    },
    "row_youtube-ad-blocking_title_v3": {
      title: "Watch YouTube ad-free",
      note: "Title for the YouTube ad blocking setting."
    },
    "row_youtube-ad-blocking_desc_v3": {
      title: "No ads, just your video.",
      note: "Description for the YouTube ad blocking setting."
    },
    "row_youtube-ad-blocking_accept_v3": {
      title: "Block Ads",
      note: "Button text to enable YouTube ad blocking."
    },
    comparison_searchPrivately: {
      title: "Search privately by default",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_blockTrackers: {
      title: "Block 3rd-party trackers",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_blockCookies: {
      title: "Block cookie pop-ups",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_blockAds: {
      title: "Block targeted ads",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_eraseData: {
      title: "Delete browsing data with one button",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_privateYoutube: {
      title: "Play YouTube videos without ads",
      note: "The description of a browser privacy feature in the comparison table."
    },
    comparison_youtubeAdFree: {
      title: "Watch YouTube ad-free",
      note: "The description of a browser privacy feature in the comparison table when ad-blocking is enabled."
    },
    comparison_fullSupport: {
      title: "Significant protection",
      note: "The level of protection offered by a browser on a specific feature in the comparison table."
    },
    comparison_partialSupport: {
      title: "Limited protection",
      note: "The level of protection offered by a browser on a specific feature in the comparison table."
    },
    comparison_notSupported: {
      title: "No protection",
      note: "The level of protection offered by a browser on a specific feature in the comparison table."
    },
    comparison_aiChat: {
      title: "Chat privately with AI chatbots (optional)",
      note: "The description of a browser privacy feature in the comparison table."
    },
    browser_DuckDuckGo: {
      title: "DuckDuckGo",
      note: "Brand name of the DuckDuckGo browser"
    },
    browser_Chrome: {
      title: "Chrome",
      note: "Brand name of the Google Chrome browser"
    },
    browser_Safari: {
      title: "Safari",
      note: "Brand name of the Apple Safari browser"
    },
    welcome_title_v4: {
      title: "Welcome to DuckDuckGo!",
      note: "Page title for the first step in the v4 onboarding process"
    },
    getStarted_title_v4: {
      title: "Hi there.{paragraph}Ready for a faster browser that puts you in control?{paragraph}AI is always optional, and privacy protection is always on.",
      note: "Introductory text when a user starts the v4 onboarding process. `{paragraph}` separates the title from each of the paragraphs that follow it. `{paragraph}` and `{newline}` should not be translated. `{newline}` may be inserted to adjust line placement for visual balance and readability."
    },
    getStartedButton_v4: {
      title: "Start Browser Setup",
      note: "Button label prompting user to start the v4 onboarding process."
    },
    getStartedButtonDefault_v4: {
      title: "Let\u2019s get started!",
      note: "Button label prompting user to start the v4 onboarding process."
    },
    makeDefaultAccept_title_v4: {
      title: "Excellent! Let\u2019s move on.",
      note: "Page title shown if a user chose to make DuckDuckGo their default browser in the v4 onboarding flow."
    },
    "row_dock-instructions_accept": {
      title: "Show Me How",
      note: "Button text that opens the dock instructions overlay."
    },
    dockInstructions_body: {
      title: "Hold control and click the DuckDuckGo app icon, then choose <strong>Options</strong> > <strong>Keep in Dock</strong>.",
      note: "Instruction for adding DuckDuckGo to macOS Dock. The <strong> tags render text in bold."
    },
    getStarted_chromeExtension_label: {
      title: "Also install our Chrome search extension",
      note: "Label for the checkbox on the getStarted step that lets users opt in to installing the DuckDuckGo Chrome search extension."
    },
    getStarted_chromeExtension_tooltip: {
      title: "Set DuckDuckGo as your default search engine in Chrome to search online without being tracked.",
      note: "Tooltip text shown when hovering over the info icon next to the Chrome extension checkbox."
    }
  };

  // shared/translations.js
  function apply(subject, replacements, textLength = 1) {
    if (typeof subject !== "string" || subject.length === 0) return "";
    let out = subject;
    if (replacements) {
      for (let [name2, value2] of Object.entries(replacements)) {
        if (typeof value2 !== "string") value2 = "";
        out = out.replaceAll(`{${name2}}`, value2);
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
  var TranslationContext = X({
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
    return /* @__PURE__ */ k(TranslationContext.Provider, { value: { t: t3 } }, children);
  }
  function Trans({ str, values }) {
    const ref = A2(null);
    const cleanups = A2([]);
    h2(() => {
      if (!ref.current) return;
      const curr = ref.current;
      const cleanupsCurr = cleanups.current;
      Object.entries(values).forEach(([tag, attributes]) => {
        curr.querySelectorAll(tag).forEach((el) => {
          Object.entries(attributes).forEach(([key2, value2]) => {
            if (typeof value2 === "function") {
              el.addEventListener(key2, value2);
              cleanupsCurr.push(() => el.removeEventListener(key2, value2));
            } else {
              el.setAttribute(key2, value2);
            }
          });
        });
      });
      return () => {
        cleanupsCurr.forEach((fn) => fn());
      };
    }, [values, str]);
    return /* @__PURE__ */ k("span", { ref, dangerouslySetInnerHTML: { __html: str } });
  }

  // pages/onboarding/app/types.js
  var EVERY_PAGE_ID = [
    "welcome",
    "getStarted",
    "systemSettings",
    "makeDefaultSingle",
    "duckPlayerSingle",
    "customize",
    "addressBarMode"
  ];
  var ORDER_V4 = ["welcome", "getStarted", "makeDefaultSingle", "systemSettings", "duckPlayerSingle", "customize", "addressBarMode"];
  function useTypedTranslation() {
    return {
      t: x2(TranslationContext).t
    };
  }

  // pages/onboarding/app/shared/components/Fallback.js
  function Fallback() {
    const { t: t3 } = useTypedTranslation();
    return /* @__PURE__ */ k(Content, null, /* @__PURE__ */ k(Stack, null, /* @__PURE__ */ k("h1", null, t3("somethingWentWrong"))));
  }

  // pages/onboarding/app/v4/components/Background.js
  var import_classnames2 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Background.module.css
  var Background_default = {
    background: "Background_background",
    illustration: "Background_illustration",
    rightAligned: "Background_rightAligned",
    slideIn: "Background_slideIn",
    "slide-in": "Background_slide-in",
    slideOut: "Background_slideOut",
    "slide-out": "Background_slide-out",
    "fade-out": "Background_fade-out"
  };

  // pages/onboarding/app/v4/components/DaxBobbingAnimation.js
  var import_classnames = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/DaxBobbingAnimation.module.css
  var DaxBobbingAnimation_default = {
    root: "DaxBobbingAnimation_root",
    slideIn: "DaxBobbingAnimation_slideIn",
    "slide-in": "DaxBobbingAnimation_slide-in",
    slideOut: "DaxBobbingAnimation_slideOut",
    "slide-out": "DaxBobbingAnimation_slide-out"
  };

  // pages/onboarding/app/v4/components/LottieAnimation.js
  var import_lottie_web = __toESM(require_lottie(), 1);
  function LottieAnimation({
    src,
    darkSrc,
    width: width2,
    height: height2,
    loop = false,
    autoplay = true,
    onComplete,
    label,
    class: className,
    animationRef
  }) {
    const { isReducedMotion, isDarkMode } = useEnv();
    const resolvedSrc = darkSrc && isDarkMode ? darkSrc : src;
    const containerRef = A2(
      /** @type {HTMLDivElement | null} */
      null
    );
    const frameRef = A2(
      /** @type {number} */
      0
    );
    h2(() => {
      if (!containerRef.current) return;
      const startFrame = frameRef.current;
      const animation = import_lottie_web.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: autoplay && !isReducedMotion && startFrame === 0,
        path: resolvedSrc
      });
      if (animationRef) {
        animationRef.current = animation;
      }
      animation.addEventListener("DOMLoaded", () => {
        const lastFrame = animation.totalFrames - 1;
        if (isReducedMotion) {
          animation.goToAndStop(lastFrame, true);
        } else if (!autoplay) {
          animation.goToAndStop(0, true);
        } else if (startFrame > 0) {
          const frame = Math.min(startFrame, lastFrame);
          animation.goToAndPlay(frame, true);
        }
      });
      if (onComplete && !loop) {
        animation.addEventListener("complete", onComplete);
      }
      return () => {
        frameRef.current = animation.currentFrame;
        if (animationRef) animationRef.current = null;
        animation.destroy();
      };
    }, [resolvedSrc, loop, onComplete, isReducedMotion, autoplay, animationRef]);
    return /* @__PURE__ */ k(
      "div",
      {
        ref: containerRef,
        class: className,
        role: label ? "img" : "presentation",
        "aria-label": label,
        "aria-hidden": label ? void 0 : "true",
        style: { width: width2 ? `${width2}px` : void 0, height: height2 ? `${height2}px` : void 0 }
      }
    );
  }

  // pages/onboarding/app/v4/components/DaxBobbingAnimation.js
  function DaxBobbingAnimation({ exiting }) {
    return /* @__PURE__ */ k(
      LottieAnimation,
      {
        class: (0, import_classnames.default)(DaxBobbingAnimation_default.root, exiting ? DaxBobbingAnimation_default.slideOut : DaxBobbingAnimation_default.slideIn),
        src: "assets/lottie/v4/dax-bobbing.json",
        loop: true,
        width: 140,
        height: 140
      }
    );
  }

  // pages/onboarding/app/v4/components/Background.js
  var backgroundForStep = {
    welcome: "background-01",
    getStarted: "background-01",
    makeDefaultSingle: "background-01",
    systemSettings: "background-02",
    duckPlayerSingle: "background-02",
    customize: "background-03",
    addressBarMode: "background-04"
  };
  function Illustration({ filename, class: className, rightAligned, onAnimationEnd }) {
    return /* @__PURE__ */ k("picture", { class: (0, import_classnames2.default)(className, rightAligned && Background_default.rightAligned), onAnimationEnd }, /* @__PURE__ */ k("source", { srcset: `assets/img/v4/${filename}-dark.svg`, media: "(prefers-color-scheme: dark)" }), /* @__PURE__ */ k("img", { src: `assets/img/v4/${filename}-light.svg`, alt: "" }));
  }
  function Background() {
    const { activeStep } = x2(GlobalContext);
    const { isReducedMotion } = useEnv();
    const filename = backgroundForStep[activeStep];
    const [prevFilename, setPrevFilename] = d2(filename);
    const [exitingFilename, setExitingFilename] = d2(
      /** @type {string | null} */
      null
    );
    if (prevFilename !== filename) {
      setExitingFilename(isReducedMotion ? null : prevFilename);
      setPrevFilename(filename);
    }
    return /* @__PURE__ */ k("div", { class: Background_default.background }, exitingFilename && /* @__PURE__ */ k(
      Illustration,
      {
        key: exitingFilename,
        filename: exitingFilename,
        rightAligned: exitingFilename === "background-04",
        class: (0, import_classnames2.default)(Background_default.illustration, Background_default.slideOut),
        onAnimationEnd: () => setExitingFilename(null)
      }
    ), /* @__PURE__ */ k(
      Illustration,
      {
        key: filename,
        filename,
        rightAligned: filename === "background-04",
        class: (0, import_classnames2.default)(Background_default.illustration, Background_default.slideIn)
      }
    ), (filename === "background-03" || exitingFilename === "background-03") && /* @__PURE__ */ k(DaxBobbingAnimation, { exiting: exitingFilename === "background-03" }));
  }

  // pages/onboarding/app/v4/components/SingleStep.js
  var import_classnames18 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Bubble.js
  var import_classnames4 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Bubble.module.css
  var Bubble_default = {
    bubble: "Bubble_bubble",
    progressBadge: "Bubble_progressBadge",
    frame: "Bubble_frame",
    container: "Bubble_container",
    content: "Bubble_content",
    fadeOut: "Bubble_fadeOut",
    "fade-out": "Bubble_fade-out",
    fadeIn: "Bubble_fadeIn",
    "fade-in": "Bubble_fade-in",
    deferred: "Bubble_deferred",
    bottomLeftTail: "Bubble_bottomLeftTail",
    active: "Bubble_active",
    rightTail: "Bubble_rightTail"
  };

  // pages/onboarding/app/v4/hooks/useAnimate.js
  function useAnimate() {
    const ref = A2(
      /** @type {T|null} */
      null
    );
    const activeAnimation = A2(
      /** @type {Animation|null} */
      null
    );
    const { isReducedMotion } = useEnv();
    const animate2 = q2(
      async (keyframes, options2) => {
        activeAnimation.current?.cancel();
        if (!ref.current || isReducedMotion) return;
        const animation = ref.current.animate(keyframes, options2);
        activeAnimation.current = animation;
        try {
          await animation.finished;
          if (activeAnimation.current === animation) activeAnimation.current = null;
        } catch {
        }
      },
      [isReducedMotion]
    );
    h2(() => () => activeAnimation.current?.cancel(), []);
    return [ref, animate2];
  }

  // pages/onboarding/app/v4/components/ProgressIndicator.js
  var import_classnames3 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/ProgressIndicator.module.css
  var ProgressIndicator_default = {
    progress: "ProgressIndicator_progress",
    dots: "ProgressIndicator_dots",
    dot: "ProgressIndicator_dot",
    active: "ProgressIndicator_active",
    complete: "ProgressIndicator_complete",
    incomplete: "ProgressIndicator_incomplete",
    text: "ProgressIndicator_text"
  };

  // pages/onboarding/app/v4/components/ProgressIndicator.js
  function ProgressIndicator({ current, total }) {
    return /* @__PURE__ */ k("div", { class: ProgressIndicator_default.progress }, /* @__PURE__ */ k("div", { class: ProgressIndicator_default.dots }, Array.from({ length: total }, (_3, i3) => {
      const step = i3 + 1;
      const isActive = step === current;
      const isComplete = step < current;
      return /* @__PURE__ */ k(
        "span",
        {
          key: i3,
          class: (0, import_classnames3.default)(ProgressIndicator_default.dot, {
            [ProgressIndicator_default.active]: isActive,
            [ProgressIndicator_default.complete]: isComplete,
            [ProgressIndicator_default.incomplete]: !isActive && !isComplete
          })
        }
      );
    })), /* @__PURE__ */ k("span", { class: ProgressIndicator_default.text }, current, " of ", total));
  }

  // pages/onboarding/app/v4/components/Bubble.js
  function Bubble({
    children,
    tail,
    class: className,
    onHeight,
    bounceKey,
    bounceDelay,
    exiting = false,
    onExitComplete,
    progress,
    fadeInDelay,
    fadeInMode = "normal",
    ...props
  }) {
    const { isReducedMotion } = useEnv();
    const containerRef = A2(
      /** @type {HTMLDivElement|null} */
      null
    );
    const contentRef = A2(
      /** @type {HTMLDivElement|null} */
      null
    );
    const isMounted = A2(false);
    const prevBounceKey = A2(bounceKey);
    const [frameRef, animateFrame] = useAnimate();
    const [progressBadgeRef, animateProgressBadge] = useAnimate();
    if (exiting) isMounted.current = true;
    _2(() => {
      const content2 = contentRef.current;
      const frame = frameRef.current;
      if (!content2 || !frame || !onHeight) return;
      const report = () => onHeight(measureHeight(content2, frame));
      report();
      const observer = new ResizeObserver(report);
      observer.observe(content2);
      return () => observer.disconnect();
    }, [onHeight, frameRef]);
    h2(() => {
      if (prevBounceKey.current === bounceKey) return;
      prevBounceKey.current = bounceKey;
      const content2 = contentRef.current;
      const frame = frameRef.current;
      if (!content2 || !frame) return;
      animateFrame(
        [
          { scale: 1, easing: "cubic-bezier(0.17, 0, 0.83, 1)" },
          { scale: 1.07, offset: 0.5, easing: "cubic-bezier(0.17, 0, 0.83, 1)" },
          { scale: 1 }
        ],
        {
          duration: 467,
          // 14 frames at 30fps
          delay: bounceDelay
        }
      );
      const offsetY = 0.035 * measureHeight(content2, frame);
      animateProgressBadge(
        [
          { transform: "translateY(-50%)", easing: "cubic-bezier(0.17, 0, 0.83, 1)" },
          { transform: `translateY(calc(-50% - ${offsetY}px))`, offset: 0.5, easing: "cubic-bezier(0.17, 0, 0.83, 1)" },
          { transform: "translateY(-50%)" }
        ],
        {
          duration: 467,
          delay: bounceDelay
        }
      );
    }, [bounceKey, animateFrame, animateProgressBadge, bounceDelay, frameRef, contentRef, prevBounceKey]);
    const complete = (e3) => {
      if (exiting && e3.target === containerRef.current) {
        onExitComplete?.();
      }
    };
    const containerCallback = (el) => {
      containerRef.current = el;
      if (el && isReducedMotion && exiting) {
        onExitComplete?.();
      }
    };
    return /* @__PURE__ */ k("div", { class: (0, import_classnames4.default)(Bubble_default.bubble, className), ...props }, /* @__PURE__ */ k("div", { ref: frameRef, class: Bubble_default.frame }, /* @__PURE__ */ k(BottomLeftTail, { active: tail === "bottom-left" }), /* @__PURE__ */ k(RightTail, { active: tail === "right" })), progress && /* @__PURE__ */ k("div", { ref: progressBadgeRef, class: Bubble_default.progressBadge }, /* @__PURE__ */ k(ProgressIndicator, { current: progress.current, total: progress.total })), /* @__PURE__ */ k(
      "div",
      {
        ref: containerCallback,
        class: (0, import_classnames4.default)(Bubble_default.container, {
          [Bubble_default.fadeOut]: isMounted.current && exiting,
          [Bubble_default.deferred]: isMounted.current && !exiting && fadeInMode === "deferred",
          [Bubble_default.fadeIn]: isMounted.current && !exiting && fadeInMode === "normal"
        }),
        style: fadeInDelay !== void 0 ? { "--fade-in-delay": `${fadeInDelay}ms` } : void 0,
        onAnimationEnd: complete
      },
      /* @__PURE__ */ k("div", { ref: contentRef, class: Bubble_default.content }, children)
    ));
  }
  function measureHeight(content2, frame) {
    const computed = getComputedStyle(frame);
    return parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth) + content2.offsetHeight;
  }
  function BottomLeftTail({ active: active2 }) {
    const gradientId = g2();
    return /* @__PURE__ */ k("div", { class: Bubble_default.bottomLeftTail, "aria-hidden": "true" }, /* @__PURE__ */ k(
      "svg",
      {
        class: (0, import_classnames4.default)(active2 && Bubble_default.active),
        width: "50",
        height: "34",
        viewBox: "0 0 50 34",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
      },
      /* @__PURE__ */ k(
        "path",
        {
          d: "M49.25 0.75V2.34766H48.7021C45.8666 2.34769 43.7612 3.6682 41.8477 5.68555C39.9707 7.66432 38.175 10.432 36.0186 13.4121C31.6717 19.4191 25.5656 26.7393 13.3682 32.1523C11.8561 32.8234 10.3789 32.4409 9.36523 31.4863C8.34348 30.5241 7.80054 28.9823 8.23926 27.3457C9.05445 24.3053 9.92429 20.9248 10.5938 17.9824C11.2559 15.0722 11.7439 12.5021 11.7568 11.1328C11.7813 8.55523 10.4106 6.3471 8.48633 4.80859C6.56458 3.27217 4.02869 2.34775 1.56152 2.34766H0.75V0.75H49.25Z",
          style: "fill: var(--bubble-bg)",
          stroke: `url(#${gradientId})`,
          "stroke-width": "1.5",
          "stroke-linecap": "round"
        }
      ),
      /* @__PURE__ */ k("defs", null, /* @__PURE__ */ k("linearGradient", { id: gradientId, x1: "25", y1: "1.5979", x2: "25", y2: "1.66431", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ k("stop", { style: "stop-color: var(--bubble-bg)" }), /* @__PURE__ */ k("stop", { offset: "1", style: "stop-color: var(--bubble-border)" })))
    ));
  }
  function RightTail({ active: active2 }) {
    const gradientId = g2();
    return /* @__PURE__ */ k("div", { class: Bubble_default.rightTail, "aria-hidden": "true" }, /* @__PURE__ */ k(
      "svg",
      {
        class: (0, import_classnames4.default)(active2 && Bubble_default.active),
        width: "24",
        height: "40",
        viewBox: "0 0 24 40",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
      },
      /* @__PURE__ */ k(
        "path",
        {
          d: "M0.75 39.2539L0.75 0.751953L2.24707 0.75293L2.24609 0.799805V0.803711C2.24616 2.89033 3.3291 4.79647 4.85352 6.08887C12.7709 12.8013 19.8154 21.9412 23.0869 31.9014C23.2525 32.4055 23.0628 32.8616 22.6436 33.166C22.2105 33.4804 21.5931 33.576 21.0469 33.3096C18.399 32.0168 15.5639 31.075 12.6934 30.4053C7.13278 29.108 2.29702 33.727 2.24316 39.2539L0.75 39.2539Z",
          style: "fill: var(--bubble-bg)",
          stroke: `url(#${gradientId})`,
          "stroke-width": "1.5",
          "stroke-linecap": "round"
        }
      ),
      /* @__PURE__ */ k("defs", null, /* @__PURE__ */ k("linearGradient", { id: gradientId, x1: "1.52344", y1: "26.5039", x2: "1.59056", y2: "26.5039", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ k("stop", { style: "stop-color: var(--bubble-bg)" }), /* @__PURE__ */ k("stop", { offset: "1", style: "stop-color: var(--bubble-border)" })))
    ));
  }

  // pages/onboarding/app/v4/components/Typed.js
  function Typed({ text: text2, onComplete = null, delay = 20, startDelay = 0, ...rest }) {
    const globalState = x2(GlobalContext);
    const { activeStep } = globalState;
    const pre = A2(
      /** @type {string|undefined} */
      void 0
    );
    h2(() => {
      if (activeStep && pre.current) {
        if (text2 === pre.current) {
          onComplete?.();
          return;
        }
      }
      pre.current = text2;
    }, [activeStep, text2]);
    return /* @__PURE__ */ k(TypedInner, { key: text2, text: text2, onComplete, delay, startDelay, ...rest });
  }
  function TypedInner({ text: text2, onComplete, delay, startDelay, ...rest }) {
    const { isReducedMotion } = useEnv();
    const [waiting, setWaiting] = d2(startDelay > 0 && !isReducedMotion);
    const [currentIndex, setCurrentIndex] = d2(0);
    h2(() => {
      if (!waiting) return;
      const timer = setTimeout(() => setWaiting(false), startDelay);
      return () => clearTimeout(timer);
    }, [waiting, startDelay]);
    h2(() => {
      if (waiting) return;
      if (isReducedMotion) {
        setCurrentIndex(text2.length);
        onComplete?.();
        return;
      }
      const controller = new AbortController();
      let enabled2 = true;
      document.body.addEventListener(
        "pointerdown",
        (e3) => {
          let clickedElement = (
            /** @type {HTMLElement|null} */
            e3.target
          );
          let level = 0;
          const maxLevels = 3;
          while (clickedElement && level < maxLevels) {
            if (clickedElement.matches("button")) {
              return;
            }
            clickedElement = clickedElement.parentElement;
            level += 1;
          }
          setCurrentIndex(text2.length);
          enabled2 = false;
        },
        { signal: controller.signal }
      );
      if (currentIndex < text2.length) {
        const timeout = setTimeout(
          () => {
            if (!enabled2) return;
            setCurrentIndex((prevIndex) => prevIndex + 1);
          },
          text2[currentIndex] === "\n" ? delay * 10 : delay
        );
        return () => {
          clearTimeout(timeout);
          controller.abort();
        };
      } else {
        onComplete?.();
        return () => controller.abort();
      }
    }, [currentIndex, delay, text2, waiting]);
    const currentText = text2.slice(0, currentIndex);
    const remainingText = text2.slice(currentIndex);
    return /* @__PURE__ */ k("span", { "aria-label": text2, ...rest }, currentText, remainingText && /* @__PURE__ */ k("span", { style: { visibility: "hidden" }, "aria-hidden": "true" }, remainingText));
  }

  // pages/onboarding/app/v4/components/ComparisonTable.js
  var import_classnames5 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/data/data-comparison-table.js
  var SupportStatus = {
    NOT_SUPPORTED: "notSupported",
    PARTIAL_SUPPORT: "partialSupport",
    FULL_SUPPORT: "fullSupport"
  };
  var tableIconPrefix = "assets/img/steps/v4/";
  var comparisonTableData = (t3, adBlockingEnabled = false) => [
    {
      icon: "vpn.svg",
      title: t3("comparison_searchPrivately"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "duck-ai.svg",
      title: t3("comparison_aiChat"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "shield.svg",
      title: t3("comparison_blockTrackers"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "cookies.svg",
      title: t3("comparison_blockCookies"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "profile-blocker.svg",
      title: t3("comparison_blockAds"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "fire.svg",
      title: t3("comparison_eraseData"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    },
    {
      icon: "duck-player.svg",
      title: adBlockingEnabled ? t3("comparison_youtubeAdFree") : t3("comparison_privateYoutube"),
      statuses: {
        chrome: SupportStatus.NOT_SUPPORTED,
        safari: SupportStatus.NOT_SUPPORTED,
        ddg: SupportStatus.FULL_SUPPORT
      }
    }
  ];

  // pages/onboarding/app/v4/components/ComparisonTable.module.css
  var ComparisonTable_default = {
    table: "ComparisonTable_table",
    rowHeading: "ComparisonTable_rowHeading",
    rowCell: "ComparisonTable_rowCell",
    row: "ComparisonTable_row",
    rowHeadingContents: "ComparisonTable_rowHeadingContents",
    rowIcon: "ComparisonTable_rowIcon",
    status: "ComparisonTable_status",
    notSupported: "ComparisonTable_notSupported",
    partialSupport: "ComparisonTable_partialSupport",
    fullSupport: "ComparisonTable_fullSupport",
    bouncein: "ComparisonTable_bouncein",
    browserIcon: "ComparisonTable_browserIcon",
    browserIconChrome: "ComparisonTable_browserIconChrome",
    browserIconSafari: "ComparisonTable_browserIconSafari",
    browserIconDuckDuckGo: "ComparisonTable_browserIconDuckDuckGo"
  };

  // pages/onboarding/app/v4/components/ComparisonTable.js
  function ComparisonTableColumnHeading({ title }) {
    const iconClass = `browserIcon${title}`;
    return /* @__PURE__ */ k("th", null, /* @__PURE__ */ k("span", { class: (0, import_classnames5.default)(ComparisonTable_default.browserIcon, ComparisonTable_default[iconClass]), "aria-label": title }));
  }
  function ComparisonTableRowHeading({ icon, title }) {
    const path = tableIconPrefix + icon;
    return /* @__PURE__ */ k("th", { scope: "row", class: ComparisonTable_default.rowHeading }, /* @__PURE__ */ k("div", { class: ComparisonTable_default.rowHeadingContents }, /* @__PURE__ */ k("img", { class: ComparisonTable_default.rowIcon, src: path, "aria-hidden": "true" }), title));
  }
  function ComparisonTableCell({ status }) {
    const { t: t3 } = useTypedTranslation();
    const ariaLabel = t3(`comparison_${status}`);
    return /* @__PURE__ */ k("td", { class: ComparisonTable_default.rowCell }, /* @__PURE__ */ k("span", { class: (0, import_classnames5.default)(ComparisonTable_default.status, ComparisonTable_default[status]), "aria-label": ariaLabel }));
  }
  function ComparisonTableRow({ icon, title, statuses, index: index2 }) {
    const { chrome, ddg } = statuses;
    return /* @__PURE__ */ k("tr", { class: ComparisonTable_default.row, style: { "--row-index": index2 } }, /* @__PURE__ */ k(ComparisonTableRowHeading, { icon, title }), /* @__PURE__ */ k(ComparisonTableCell, { status: chrome }), /* @__PURE__ */ k(ComparisonTableCell, { status: ddg }));
  }
  function ComparisonTable() {
    const { t: t3 } = useTypedTranslation();
    const state = useGlobalState();
    const systemSettingsStep = (
      /** @type {import('../../types').SystemSettingsStep|undefined} */
      state.stepDefinitions.systemSettings
    );
    const adBlockingEnabled = systemSettingsStep?.rows?.some((row) => row === "aggressive-ad-blocking" || row === "youtube-ad-blocking") ?? false;
    const tableData = comparisonTableData(t3, adBlockingEnabled);
    return /* @__PURE__ */ k("table", { class: ComparisonTable_default.table }, /* @__PURE__ */ k("thead", null, /* @__PURE__ */ k("tr", null, /* @__PURE__ */ k("th", null), /* @__PURE__ */ k(ComparisonTableColumnHeading, { title: "Chrome" }), /* @__PURE__ */ k(ComparisonTableColumnHeading, { title: "DuckDuckGo" }))), /* @__PURE__ */ k("tbody", null, tableData.map((data2, index2) => /* @__PURE__ */ k(ComparisonTableRow, { key: index2, ...data2, index: index2 }))));
  }

  // pages/onboarding/app/v4/components/Button.js
  var import_classnames6 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Button.module.css
  var Button_default = {
    button: "Button_button",
    primary: "Button_primary",
    secondary: "Button_secondary",
    wide: "Button_wide",
    stretch: "Button_stretch"
  };

  // pages/onboarding/app/v4/components/Button.js
  function Button({ variant = "primary", children, onClick, disabled, size, class: className, buttonRef }) {
    return /* @__PURE__ */ k(
      "button",
      {
        ref: buttonRef,
        type: "button",
        class: (0, import_classnames6.default)(Button_default.button, Button_default[variant], size && Button_default[size], className),
        onClick,
        disabled
      },
      children
    );
  }

  // pages/onboarding/app/v4/components/Container.js
  var import_classnames7 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Container.module.css
  var Container_default = {
    root: "Container_root"
  };

  // pages/onboarding/app/v4/components/Container.js
  function Container({ class: className, children }) {
    return /* @__PURE__ */ k("div", { class: (0, import_classnames7.default)(Container_default.root, className) }, children);
  }

  // pages/onboarding/app/v4/components/Title.js
  var import_classnames8 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/Title.module.css
  var Title_default = {
    title: "Title_title"
  };

  // pages/onboarding/app/v4/components/Title.js
  function Title({ class: className, titleRef, children }) {
    return /* @__PURE__ */ k("h2", { ref: titleRef, class: (0, import_classnames8.default)(Title_default.title, className) }, children);
  }

  // pages/onboarding/app/v4/hooks/usePresence.js
  function usePresence(show, exitConfig) {
    const ref = A2(
      /** @type {T|null} */
      null
    );
    const [mounted, setMounted] = d2(show);
    const activeAnimation = A2(
      /** @type {Animation|null} */
      null
    );
    const exitConfigRef = A2(exitConfig);
    const { isReducedMotion } = useEnv();
    exitConfigRef.current = exitConfig;
    _2(() => {
      if (show) {
        activeAnimation.current?.cancel();
        activeAnimation.current = null;
        const element2 = ref.current;
        if (element2) {
          element2.style.position = "";
          element2.style.left = "";
          element2.style.top = "";
          element2.style.width = "";
          element2.style.height = "";
        }
        setMounted(true);
        return;
      }
      const element = ref.current;
      const config = exitConfigRef.current;
      if (!element) {
        config.onComplete?.();
        setMounted(false);
        return;
      }
      if (isReducedMotion) {
        config.onComplete?.();
        setMounted(false);
        return;
      }
      const rect = element.getBoundingClientRect();
      const offsetParent = element.offsetParent;
      if (!offsetParent || offsetParent === document.body) {
        console.warn("usePresence: element has no positioned ancestor. Add position: relative to a parent element.");
      }
      const parentRect = offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
      element.style.position = "absolute";
      element.style.left = `${rect.left - parentRect.left}px`;
      element.style.top = `${rect.top - parentRect.top}px`;
      element.style.width = `${rect.width}px`;
      element.style.height = `${rect.height}px`;
      const animation = element.animate(config.keyframes, { fill: "forwards", ...config.options });
      activeAnimation.current = animation;
      animation.onfinish = () => {
        activeAnimation.current = null;
        config.onComplete?.();
        setMounted(false);
      };
      return () => {
        animation.cancel();
        activeAnimation.current = null;
      };
    }, [show, isReducedMotion]);
    return [ref, mounted];
  }

  // pages/onboarding/app/v4/hooks/useFlip.js
  function useFlip(options2 = {}) {
    const ref = A2(
      /** @type {T|null} */
      null
    );
    const previousPosition = A2(
      /** @type {{x: number, y: number}|null} */
      null
    );
    const activeAnimation = A2(
      /** @type {Animation|null} */
      null
    );
    const { isReducedMotion } = useEnv();
    const { duration = 300, easing = "cubic-bezier(0.17, 0, 0.34, 1)" } = options2;
    _2(() => {
      const element = ref.current;
      if (!element) return;
      if (activeAnimation.current) return;
      const position2 = measureRelativePosition(element);
      if (previousPosition.current && !isReducedMotion) {
        const deltaX = previousPosition.current.x - position2.x;
        const deltaY = previousPosition.current.y - position2.y;
        if (deltaX || deltaY) {
          const animation = element.animate([{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "none" }], {
            duration,
            easing
          });
          activeAnimation.current = animation;
          animation.onfinish = () => {
            activeAnimation.current = null;
            previousPosition.current = measureRelativePosition(element);
          };
        }
      }
      previousPosition.current = position2;
    });
    h2(() => () => activeAnimation.current?.cancel(), []);
    return ref;
  }
  function measureRelativePosition(element) {
    const offsetParent = element.offsetParent;
    if (!offsetParent || offsetParent === document.body) {
      console.warn("useFlip: element has no positioned ancestor. Add position: relative to a parent element.");
    }
    const elementRect = element.getBoundingClientRect();
    const parentRect = offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: elementRect.left - parentRect.left,
      y: elementRect.top - parentRect.top
    };
  }

  // pages/onboarding/app/v4/components/MakeDefaultContent.js
  var import_classnames9 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/MakeDefaultContent.module.css
  var MakeDefaultContent_default = {
    root: "MakeDefaultContent_root",
    titleContainer: "MakeDefaultContent_titleContainer",
    title: "MakeDefaultContent_title",
    sparkle: "MakeDefaultContent_sparkle",
    hidden: "MakeDefaultContent_hidden",
    content: "MakeDefaultContent_content",
    "stagger-fade-in": "MakeDefaultContent_stagger-fade-in",
    actions: "MakeDefaultContent_actions",
    skipButton: "MakeDefaultContent_skipButton",
    revealable: "MakeDefaultContent_revealable"
  };

  // pages/onboarding/app/v4/components/MakeDefaultContent.js
  var bubbleFadeInDelayOverride = new URLSearchParams(window.location.search).get("bubbleFadeInDelay");
  function MakeDefaultContent({ advance, onTitleComplete, updateSystemValue }) {
    const { t: t3 } = useTypedTranslation();
    const globalState = useGlobalState();
    const hasTypingEffect = !!useTypingEffect();
    const isPending = globalState.status.kind === "executing" && globalState.status.action.kind === "update-system-value" && globalState.status.action.id === "default-browser";
    const showSkipButton = !isPending && globalState.UIValues["default-browser"] === "idle";
    const [showSuccess, setShowSuccess] = d2(false);
    const sparkleRef = A2(null);
    const [titleRef, animateTitle] = useAnimate();
    const [skipButtonRef, skipButtonMounted] = usePresence(showSkipButton, {
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
      options: { duration: 300, easing: "ease-out" }
    });
    const primaryButtonRef = useFlip({ duration: 300, easing: "cubic-bezier(0.17, 0, 0.83, 1)" });
    if (showSuccess && showSkipButton) setShowSuccess(false);
    if (showSkipButton && primaryButtonRef.current) primaryButtonRef.current.style.minWidth = "";
    const enableDefaultBrowser = () => {
      if (primaryButtonRef.current) {
        primaryButtonRef.current.style.minWidth = `${primaryButtonRef.current.offsetWidth}px`;
      }
      updateSystemValue("default-browser", { enabled: true }, true);
      (async () => {
        await animateTitle([{ scale: 1 }, { scale: 1.07 }], {
          duration: 233,
          easing: "cubic-bezier(0.17, 0, 0.83, 1)"
        });
        setShowSuccess(true);
        sparkleRef.current?.goToAndPlay(6, true);
        await animateTitle([{ scale: 1.07 }, { scale: 1 }], {
          duration: 233,
          easing: "cubic-bezier(0.17, 0, 0.83, 1)"
        });
      })();
    };
    const defaultBubbleDelay = 400;
    const defaultOffset = 250;
    const parsedOffset = bubbleFadeInDelayOverride ? Number.parseInt(bubbleFadeInDelayOverride, 10) : defaultOffset;
    const staggerDelay = defaultBubbleDelay + (Number.isNaN(parsedOffset) ? defaultOffset : parsedOffset);
    let titleContent;
    if (showSuccess) {
      titleContent = t3("makeDefaultAccept_title_v4");
    } else if (hasTypingEffect && !globalState.activeStepVisible) {
      titleContent = /* @__PURE__ */ k(
        Typed,
        {
          text: t3("protectionsActivated_title"),
          startDelay: 800,
          onComplete: onTitleComplete
        }
      );
    } else {
      titleContent = t3("protectionsActivated_title");
    }
    return /* @__PURE__ */ k(Container, { class: MakeDefaultContent_default.root }, /* @__PURE__ */ k("div", { class: MakeDefaultContent_default.titleContainer }, /* @__PURE__ */ k(Title, { titleRef, class: MakeDefaultContent_default.title }, titleContent), /* @__PURE__ */ k(
      LottieAnimation,
      {
        src: "assets/lottie/v4/sparkle.json",
        darkSrc: "assets/lottie/v4/sparkle-dark.json",
        class: (0, import_classnames9.default)(MakeDefaultContent_default.sparkle, { [MakeDefaultContent_default.hidden]: !showSuccess }),
        width: 34,
        height: 43,
        autoplay: false,
        animationRef: sparkleRef
      }
    )), /* @__PURE__ */ k(
      "div",
      {
        class: (0, import_classnames9.default)(MakeDefaultContent_default.content, {
          [MakeDefaultContent_default.revealable]: hasTypingEffect,
          [MakeDefaultContent_default.hidden]: hasTypingEffect && !globalState.activeStepVisible
        }),
        style: { "--stagger-delay": `${staggerDelay}ms` }
      },
      /* @__PURE__ */ k(ComparisonTable, null),
      /* @__PURE__ */ k("div", { class: MakeDefaultContent_default.actions }, skipButtonMounted && /* @__PURE__ */ k(Button, { buttonRef: skipButtonRef, class: MakeDefaultContent_default.skipButton, variant: "secondary", onClick: advance }, t3("skipButton")), /* @__PURE__ */ k(Button, { buttonRef: primaryButtonRef, disabled: isPending, onClick: showSkipButton ? enableDefaultBrowser : advance }, showSkipButton ? t3("makeDefaultButton") : t3("nextButton")))
    ));
  }

  // pages/onboarding/app/v4/components/SettingsContent.js
  var import_classnames10 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/shared/components/Icons.module.css
  var Icons_default = {
    bounceIn: "Icons_bounceIn",
    bouncein: "Icons_bouncein",
    slideIn: "Icons_slideIn",
    slidein: "Icons_slidein",
    slideUp: "Icons_slideUp",
    slideup: "Icons_slideup",
    fadeIn: "Icons_fadeIn"
  };

  // pages/onboarding/app/shared/components/Icons.js
  function BounceIn({ children, delay = "none" }) {
    return /* @__PURE__ */ k("div", { className: Icons_default.bounceIn, "data-delay": delay }, children);
  }
  function FadeIn({ children, delay = "none" }) {
    return /* @__PURE__ */ k("div", { className: Icons_default.fadeIn, "data-delay": delay }, children);
  }
  function Launch() {
    return /* @__PURE__ */ k("svg", { width: "17", height: "16", viewBox: "0 0 17 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ k("g", { "clip-path": "url(#clip0_3098_23365)" }, /* @__PURE__ */ k(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12.0465 7.31875C11.269 8.09623 10.0085 8.09623 9.23102 7.31875C8.45354 6.54128 8.45354 5.28074 9.23102 4.50327C10.0085 3.7258 11.269 3.7258 12.0465 4.50327C12.824 5.28074 12.824 6.54128 12.0465 7.31875ZM11.1626 6.43487C10.8733 6.72419 10.4042 6.72419 10.1149 6.43487C9.82558 6.14555 9.82558 5.67647 10.1149 5.38715C10.4042 5.09783 10.8733 5.09783 11.1626 5.38715C11.4519 5.67647 11.4519 6.14555 11.1626 6.43487Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M15.0163 0.357982C10.4268 0.792444 7.29295 2.76331 5.19328 5.43188C5.03761 5.41854 4.88167 5.40999 4.72564 5.40608C3.54981 5.37661 2.36922 5.61098 1.26629 6.0488C0.653083 6.29222 0.543501 7.07682 1.01002 7.54334L2.92009 9.45341C2.86071 9.6032 2.80326 9.75371 2.74768 9.90485C2.61756 10.2587 2.71271 10.6538 2.97932 10.9204L5.62864 13.5698C5.89525 13.8364 6.29037 13.9315 6.64424 13.8014C6.79555 13.7458 6.94624 13.6882 7.0962 13.6288L9.0054 15.538C9.47191 16.0045 10.2565 15.8949 10.4999 15.2817C10.9378 14.1788 11.1721 12.9982 11.1427 11.8224C11.1388 11.6668 11.1302 11.5112 11.117 11.356C13.7857 9.25633 15.7566 6.1224 16.1911 1.53282C16.2296 1.12649 16.256 0.708745 16.2698 0.279297C15.8403 0.293094 15.4226 0.319516 15.0163 0.357982ZM3.9867 10.1601L6.38903 12.5624C8.6807 11.6928 10.7461 10.3775 12.2764 8.46444C13.2183 7.28687 13.9808 5.85389 14.4628 4.10497L12.4441 2.08628C10.6952 2.56825 9.26222 3.33082 8.08465 4.27272C6.17156 5.80296 4.85624 7.86839 3.9867 10.1601ZM2.25561 7.02117C2.84462 6.83216 3.44604 6.71284 4.04467 6.67074L3.29585 8.06141L2.25561 7.02117ZM9.52757 14.2924C9.71658 13.7034 9.8359 13.102 9.878 12.5033L8.48733 13.2522L9.52757 14.2924ZM14.7828 2.65724L13.8919 1.76626C14.2259 1.7093 14.5703 1.6616 14.9253 1.62375C14.8875 1.97878 14.8398 2.32317 14.7828 2.65724Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M4.98318 13.664C5.19417 13.9372 5.14374 14.3297 4.87055 14.5407C3.96675 15.2387 2.81266 15.6173 1.50788 15.7098L0.78927 15.7608L0.840231 15.0422C0.932761 13.7374 1.31133 12.5833 2.00934 11.6795C2.22032 11.4063 2.61283 11.3559 2.88602 11.5669C3.15921 11.7779 3.20963 12.1704 2.99865 12.4436C2.60779 12.9497 2.32977 13.5927 2.18426 14.3658C2.95736 14.2203 3.60041 13.9423 4.1065 13.5514C4.37969 13.3404 4.77219 13.3909 4.98318 13.664Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    )), /* @__PURE__ */ k("defs", null, /* @__PURE__ */ k("clipPath", { id: "clip0_3098_23365" }, /* @__PURE__ */ k("rect", { width: "16", height: "16", fill: "white", transform: "translate(0.5)" }))));
  }

  // shared/components/Switch/Switch.module.css
  var Switch_default = {
    label: "Switch_label",
    input: "Switch_input",
    switch: "Switch_switch"
  };

  // shared/components/Switch/Switch.js
  function Switch({ checked = false, platformName, size, theme, inputProps, ...props }) {
    const { onChecked, onUnchecked, ariaLabel, pending } = props;
    function change(e3) {
      if (e3.target.checked === true) {
        onChecked();
      } else {
        onUnchecked();
      }
    }
    return /* @__PURE__ */ k("label", { class: Switch_default.label, "data-platform-name": platformName, "data-theme": theme, "data-size": size }, /* @__PURE__ */ k(
      "input",
      {
        disabled: pending,
        type: "checkbox",
        role: "switch",
        "aria-label": ariaLabel,
        class: Switch_default.input,
        checked,
        onChange: change,
        ...inputProps
      }
    ), /* @__PURE__ */ k("span", { class: Switch_default.switch, style: "transition-duration: 130ms;transition-delay: 0ms;" }));
  }

  // pages/onboarding/app/v4/components/SettingsContent.module.css
  var SettingsContent_default = {
    rows: "SettingsContent_rows",
    row: "SettingsContent_row",
    rowContent: "SettingsContent_rowContent",
    rowMain: "SettingsContent_rowMain",
    rowIcon: "SettingsContent_rowIcon",
    rowText: "SettingsContent_rowText",
    rowTitle: "SettingsContent_rowTitle",
    rowSubtitle: "SettingsContent_rowSubtitle",
    rowInline: "SettingsContent_rowInline",
    divider: "SettingsContent_divider",
    rowButtons: "SettingsContent_rowButtons",
    actions: "SettingsContent_actions",
    fadeIn: "SettingsContent_fadeIn",
    fadeInDelayed: "SettingsContent_fadeInDelayed"
  };

  // pages/onboarding/app/v4/components/SettingsContent.js
  function SettingsContent({ advance, dismiss, updateSystemValue }) {
    const platform = usePlatformName();
    const { t: t3 } = useTypedTranslation();
    const dispatch = useGlobalDispatch();
    const globalState = useGlobalState();
    const { isReducedMotion } = useEnv();
    if (globalState.step.kind !== "settings") throw new Error("unreachable, for TS benefit");
    const { step, status, order, activeStep } = globalState;
    const isDone = globalState.activeRow >= step.rows.length;
    const isLastStep = order[order.length - 1] === activeStep;
    const isBusy = status.kind === "executing";
    const [exitingIndex, setExitingIndex] = d2(
      /** @type {number | null} */
      null
    );
    const enteringIndex = exitingIndex !== null && exitingIndex + 1 < step.rows.length ? exitingIndex + 1 : null;
    const isAnimating = exitingIndex !== null;
    const rows = step.rows.map((rowId, index2) => {
      return {
        visible: globalState.activeRow >= index2 || enteringIndex === index2,
        current: globalState.activeRow === index2,
        isExiting: exitingIndex === index2,
        isEntering: enteringIndex === index2,
        systemValue: globalState.values[rowId] || null,
        uiValue: globalState.UIValues[rowId],
        pending: isBusy,
        id: rowId,
        data: settingsRowItems[rowId](t3, platform)
      };
    });
    return /* @__PURE__ */ k(Container, null, /* @__PURE__ */ k("div", { class: SettingsContent_default.rows }, rows.filter((item) => item.visible).map((item, index2) => /* @__PURE__ */ k(S, { key: item.id }, index2 > 0 && /* @__PURE__ */ k("div", { class: (0, import_classnames10.default)(SettingsContent_default.divider, item.isEntering && SettingsContent_default.fadeIn) }), /* @__PURE__ */ k(
      SettingListItem,
      {
        dispatch,
        updateSystemValue,
        item,
        onAction: () => {
          if (isReducedMotion) return;
          setExitingIndex(globalState.activeRow);
        },
        onTransitionEnd: () => setExitingIndex(null)
      }
    )))), globalState.status.kind === "idle" && globalState.status.error && /* @__PURE__ */ k("p", null, globalState.status.error), isDone && /* @__PURE__ */ k("div", { class: (0, import_classnames10.default)(SettingsContent_default.actions, isAnimating && SettingsContent_default.fadeInDelayed) }, /* @__PURE__ */ k(Button, { size: "wide", disabled: isBusy, onClick: isLastStep ? dismiss : advance }, isLastStep ? t3("startBrowsing") : t3("nextButton"), isLastStep && /* @__PURE__ */ k(Launch, null))));
  }
  function SettingListItem({ item, dispatch, updateSystemValue, onAction, onTransitionEnd }) {
    const { data: data2, current, isExiting, isEntering, pending } = item;
    const { t: t3 } = useTypedTranslation();
    const [subtitleRef, subtitleMounted] = usePresence(!isExiting, {
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
      options: { duration: 200, easing: "ease-out" }
    });
    const [buttonsRef, buttonsMounted] = usePresence(!isExiting, {
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
      options: { duration: 200, easing: "ease-out" },
      onComplete: onTransitionEnd
    });
    const iconRef = useFlip();
    const handleAction = (enabled2) => {
      if (isExiting || isEntering) return;
      if (data2.id === "dock-instructions" && enabled2) {
        dispatch({ kind: "show-overlay", overlay: "dock-instructions" });
        return;
      }
      if (current) onAction();
      updateSystemValue(data2.id, { enabled: enabled2 }, current);
    };
    const showDetails = current || isExiting || isEntering;
    return /* @__PURE__ */ k("div", { class: (0, import_classnames10.default)(SettingsContent_default.row, isEntering && SettingsContent_default.fadeIn), "data-testid": "ListItem", "data-id": data2.id }, /* @__PURE__ */ k("div", { class: SettingsContent_default.rowContent }, /* @__PURE__ */ k("div", { class: SettingsContent_default.rowMain }, /* @__PURE__ */ k("img", { ref: iconRef, class: SettingsContent_default.rowIcon, src: "assets/img/steps/" + data2.icon, alt: "" }), /* @__PURE__ */ k("div", { class: SettingsContent_default.rowText }, /* @__PURE__ */ k("p", { class: SettingsContent_default.rowTitle }, data2.title), showDetails && data2.secondaryText && subtitleMounted && /* @__PURE__ */ k("p", { ref: subtitleRef, class: SettingsContent_default.rowSubtitle }, data2.secondaryText)), /* @__PURE__ */ k(InlineAction, { item, onAction: handleAction })), showDetails && buttonsMounted && /* @__PURE__ */ k("div", { ref: buttonsRef, class: SettingsContent_default.rowButtons }, /* @__PURE__ */ k(Button, { variant: "secondary", disabled: pending, onClick: () => handleAction(false) }, t3("skipButton")), /* @__PURE__ */ k(Button, { disabled: pending, onClick: () => handleAction(true) }, data2.acceptText))));
  }
  function InlineAction({ item, onAction }) {
    const { isDarkMode } = useEnv();
    const platformName = (
      /** @type {'macos'|'windows'} */
      usePlatformName()
    );
    if (item.uiValue === "idle" || !item.systemValue) return null;
    if (item.uiValue === "accepted" || item.uiValue === "skipped" && item.systemValue.enabled && item.data.kind === "one-time") {
      return /* @__PURE__ */ k("div", { class: SettingsContent_default.rowInline }, /* @__PURE__ */ k(BounceIn, { delay: "normal" }, /* @__PURE__ */ k("img", { src: "assets/img/v4/icons/check-circle.svg", width: "16", height: "16", alt: "Completed Action" })));
    }
    if (item.uiValue === "skipped") {
      return /* @__PURE__ */ k("div", { class: SettingsContent_default.rowInline }, /* @__PURE__ */ k(FadeIn, null, item.data.kind === "one-time" && /* @__PURE__ */ k(Button, { variant: "secondary", disabled: item.pending, onClick: () => onAction(true) }, item.data.acceptTextRecall || item.data.acceptText), item.data.kind === "toggle" && /* @__PURE__ */ k(
        Switch,
        {
          ariaLabel: item.data.acceptText,
          pending: item.pending,
          checked: item.systemValue.enabled,
          onChecked: () => onAction(true),
          onUnchecked: () => onAction(false),
          platformName,
          theme: isDarkMode ? "dark" : "light"
        }
      )));
    }
    throw new Error("unreachable");
  }

  // pages/onboarding/app/v4/components/StepHeader.js
  var import_classnames11 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/StepHeader.module.css
  var StepHeader_default = {
    root: "StepHeader_root",
    title: "StepHeader_title",
    subtitle: "StepHeader_subtitle",
    hidden: "StepHeader_hidden"
  };

  // pages/onboarding/app/v4/components/StepHeader.js
  function StepHeader({ title, subtitle, onTitleComplete }) {
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible } = useGlobalState();
    return /* @__PURE__ */ k("div", { class: StepHeader_default.root }, /* @__PURE__ */ k("h2", { class: StepHeader_default.title }, hasTypingEffect ? /* @__PURE__ */ k(
      Typed,
      {
        text: title,
        startDelay: 800,
        onComplete: onTitleComplete
      }
    ) : title), subtitle && /* @__PURE__ */ k("p", { class: (0, import_classnames11.default)(StepHeader_default.subtitle, { [StepHeader_default.hidden]: hasTypingEffect && !activeStepVisible }) }, subtitle));
  }

  // pages/onboarding/app/v4/components/DuckPlayerContent.js
  var import_classnames12 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/DuckPlayerContent.module.css
  var DuckPlayerContent_default = {
    imageContainer: "DuckPlayerContent_imageContainer",
    sparkle: "DuckPlayerContent_sparkle",
    promoImage: "DuckPlayerContent_promoImage",
    videoContainer: "DuckPlayerContent_videoContainer",
    video: "DuckPlayerContent_video",
    hidden: "DuckPlayerContent_hidden",
    actions: "DuckPlayerContent_actions",
    toggleButton: "DuckPlayerContent_toggleButton",
    nextButton: "DuckPlayerContent_nextButton"
  };

  // pages/onboarding/app/v4/components/DuckPlayerContent.js
  function DuckPlayerContent({ isAdFree, advance }) {
    return isAdFree ? /* @__PURE__ */ k(DuckPlayerAdFree, { advance }) : /* @__PURE__ */ k(DuckPlayerDefault, { advance });
  }
  function DuckPlayerAdFree({ advance }) {
    const { t: t3 } = useTypedTranslation();
    return /* @__PURE__ */ k(Container, null, /* @__PURE__ */ k("div", { class: DuckPlayerContent_default.imageContainer }, /* @__PURE__ */ k("img", { src: "assets/img/v4/duck-player-promo.svg", alt: "", class: DuckPlayerContent_default.promoImage }), /* @__PURE__ */ k(
      LottieAnimation,
      {
        src: "assets/lottie/v4/sparkle.json",
        darkSrc: "assets/lottie/v4/sparkle-dark.json",
        class: DuckPlayerContent_default.sparkle,
        width: 34,
        height: 43
      }
    )), /* @__PURE__ */ k(Button, { variant: "primary", size: "stretch", onClick: advance }, t3("nextButton")));
  }
  function DuckPlayerDefault({ advance }) {
    const { t: t3 } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const dispatch = useGlobalDispatch();
    const videosRef = A2(
      /** @type {Record<DPTarget, HTMLVideoElement | null>} */
      { with: null, without: null }
    );
    const [state, setState] = d2(
      /** @type {DPState} */
      { target: "with", phase: "initial", reverse: false }
    );
    const stateRef = A2(state);
    stateRef.current = state;
    const flip = (target2) => target2 === "with" ? "without" : "with";
    const videoFor = (target2) => videosRef.current[target2];
    const play = async (video) => {
      if (!video) return;
      if (isReducedMotion) {
        if (Number.isFinite(video.duration)) video.currentTime = video.duration;
        return;
      }
      video.currentTime = 0;
      try {
        const frameReady = new Promise((resolve) => video.requestVideoFrameCallback(() => resolve()));
        await video.play();
        await frameReady;
      } catch (error) {
        console.error(error);
      }
    };
    const reset = (video) => {
      if (video) video.currentTime = 0;
    };
    h2(() => {
      const id = setTimeout(
        () => {
          play(videoFor("with"));
          setState((prev) => ({ ...prev, phase: isReducedMotion ? "settled" : "playing" }));
        },
        isReducedMotion ? 0 : 917
      );
      return () => clearTimeout(id);
    }, []);
    const toggle = async () => {
      dispatch({ kind: "telemetry", attributes: { name: "duck_player_toggled" } });
      const { target: target2, phase, reverse } = stateRef.current;
      if (phase === "initial") {
        setState({ target: target2, phase, reverse: !reverse });
      } else if (phase === "playing") {
        if (!reverse) reset(videoFor(flip(target2)));
        setState({ target: target2, phase: "playing", reverse: !reverse });
      } else {
        const next = flip(target2);
        await play(videoFor(next));
        setState({ target: next, phase: isReducedMotion ? "settled" : "playing", reverse: false });
      }
    };
    const end = async () => {
      const { reverse, target: target2 } = stateRef.current;
      if (reverse) {
        const next = flip(target2);
        await play(videoFor(next));
        setState({ target: next, phase: "playing", reverse: false });
      } else {
        setState((prev) => ({ ...prev, phase: "settled" }));
      }
    };
    const toggleLabel = state.reverse ? flip(state.target) : state.target;
    return /* @__PURE__ */ k(Container, null, /* @__PURE__ */ k("div", { class: DuckPlayerContent_default.videoContainer }, /* @__PURE__ */ k(
      "video",
      {
        ref: (el) => {
          videosRef.current.with = el;
        },
        class: (0, import_classnames12.default)(DuckPlayerContent_default.video, { [DuckPlayerContent_default.hidden]: state.target !== "with" }),
        src: "assets/videos/v4/duck-player-enabled.mp4",
        muted: true,
        playsInline: true,
        preload: "auto",
        onEnded: end
      }
    ), /* @__PURE__ */ k(
      "video",
      {
        ref: (el) => {
          videosRef.current.without = el;
        },
        class: (0, import_classnames12.default)(DuckPlayerContent_default.video, { [DuckPlayerContent_default.hidden]: state.target !== "without" }),
        src: "assets/videos/v4/duck-player-disabled.mp4",
        muted: true,
        playsInline: true,
        preload: "auto",
        onEnded: end
      }
    )), /* @__PURE__ */ k("div", { class: DuckPlayerContent_default.actions }, /* @__PURE__ */ k(Button, { variant: "secondary", class: DuckPlayerContent_default.toggleButton, onClick: toggle }, toggleLabel === "with" ? t3("beforeAfter_duckPlayer_hide") : t3("beforeAfter_duckPlayer_show")), /* @__PURE__ */ k(Button, { variant: "primary", class: DuckPlayerContent_default.nextButton, onClick: advance }, t3("nextButton"))));
  }

  // pages/onboarding/app/shared/components/ToggleButton.module.css
  var ToggleButton_default = {
    button: "ToggleButton_button",
    selected: "ToggleButton_selected",
    buttonText: "ToggleButton_buttonText",
    radioButton: "ToggleButton_radioButton",
    radioCircle: "ToggleButton_radioCircle",
    radioCheckmark: "ToggleButton_radioCheckmark",
    radioCircleUnselected: "ToggleButton_radioCircleUnselected"
  };

  // pages/onboarding/app/shared/components/ToggleButton.js
  var RadioButton = {
    Selected: () => /* @__PURE__ */ k("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ k("circle", { cx: "12", cy: "11", r: "10", className: ToggleButton_default.radioCircle }), /* @__PURE__ */ k(
      "path",
      {
        d: "M16.7748 8.21423C17.0707 8.50409 17.0756 8.97894 16.7858 9.27484L12.2916 13.8626C11.507 14.6635 10.2174 14.6635 9.43279 13.8626L7.21423 11.5978C6.92437 11.3019 6.92927 10.8271 7.22516 10.5372C7.52106 10.2473 7.99591 10.2522 8.28577 10.5481L10.5043 12.8129C10.7008 13.0134 11.0236 13.0134 11.2201 12.8129L15.7142 8.22516C16.0041 7.92927 16.479 7.92437 16.7748 8.21423Z",
        className: ToggleButton_default.radioCheckmark
      }
    )),
    Unselected: () => /* @__PURE__ */ k("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ k("circle", { cx: "12", cy: "11", r: "9.25", strokeWidth: "1.5", className: ToggleButton_default.radioCircleUnselected }))
  };
  function ToggleButton({ label, selected, onClick }) {
    return /* @__PURE__ */ k("button", { className: `${ToggleButton_default.button} ${selected ? ToggleButton_default.selected : ""}`, onClick }, /* @__PURE__ */ k("span", { className: ToggleButton_default.buttonText }, label), /* @__PURE__ */ k("span", { className: ToggleButton_default.radioButton }, selected ? /* @__PURE__ */ k(RadioButton.Selected, null) : /* @__PURE__ */ k(RadioButton.Unselected, null)));
  }

  // pages/onboarding/app/v4/components/AddressBarPreview.js
  var import_classnames13 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/AddressBarPreview.module.css
  var AddressBarPreview_default = {
    wrapper: "AddressBarPreview_wrapper",
    image: "AddressBarPreview_image",
    bgOverlay: "AddressBarPreview_bgOverlay",
    bgReduced: "AddressBarPreview_bgReduced",
    borderOverlay: "AddressBarPreview_borderOverlay",
    borderReduced: "AddressBarPreview_borderReduced",
    regularIcon: "AddressBarPreview_regularIcon",
    extendedIcon: "AddressBarPreview_extendedIcon"
  };

  // pages/onboarding/app/v4/components/AddressBarPreview.js
  var ICON_TRANSITION = { transition: "opacity 250ms ease-in-out" };
  function AddressBarPreview({ isReduced, isDarkMode = false }) {
    const colors = isDarkMode ? {
      // Dark mode
      outerBg: "#123269",
      browserChrome: "#1C1C1C",
      browserBorder: "#3D3D3D",
      topBar: "#050505",
      tabsArea: "#282828",
      addressBarBg: "#3D3D3D",
      addressBarBorder: "#3377AD",
      addressBarShadow: "none",
      iconPillOuterBg: "rgba(67, 151, 224, 0.25)",
      iconPillBg: "#4397E0",
      iconPillIcons: "#000",
      iconPillIconsOpacity: "0.84",
      searchIcon: "#4397E0",
      navArrows: "#fff",
      navArrowsOpacity: "0.24",
      dotOpacity: "0.16",
      tabDetailOpacity: "0.09",
      waveOpacity: "0.12"
    } : {
      // Light mode (matches Figma export)
      outerBg: "#4D9DFF",
      browserChrome: "#FAFAFA",
      browserBorder: "#ffffff",
      topBar: "#E0E0E0",
      tabsArea: "#F2F2F2",
      addressBarBg: "#fff",
      addressBarBorder: "#1074CC",
      addressBarShadow: "0 2px 12px rgba(0, 0, 0, 0.12)",
      iconPillOuterBg: "#C9E3FF",
      iconPillBg: "#1074CC",
      iconPillIcons: "#fff",
      iconPillIconsOpacity: "1",
      searchIcon: "#1074CC",
      navArrows: "#000",
      navArrowsOpacity: "0.36",
      dotOpacity: "0.09",
      tabDetailOpacity: "0.09",
      waveOpacity: "0.03"
    };
    return /* @__PURE__ */ k("div", { class: AddressBarPreview_default.wrapper }, /* @__PURE__ */ k("svg", { fill: "none", viewBox: "0 0 432 208", xmlns: "http://www.w3.org/2000/svg", class: AddressBarPreview_default.image }, /* @__PURE__ */ k("defs", null, /* @__PURE__ */ k("clipPath", { id: "clip-main" }, /* @__PURE__ */ k("rect", { width: "432", height: "208", fill: "#fff", rx: "20" }))), /* @__PURE__ */ k("g", { clipPath: "url(#clip-main)" }, /* @__PURE__ */ k("rect", { width: "432", height: "208", fill: colors.outerBg, rx: "20" }), /* @__PURE__ */ k(
      "path",
      {
        fill: colors.browserChrome,
        stroke: colors.browserBorder,
        strokeWidth: "2",
        d: "M392 23C401.389 23 409 30.611 409 40V209H23V40C23 30.611 30.611 23 40 23H392Z"
      }
    ), /* @__PURE__ */ k("path", { fill: colors.topBar, d: "M24 40C24 31.163 31.163 24 40 24H392C400.837 24 408 31.163 408 40V83H24V40Z" }), /* @__PURE__ */ k("g", { opacity: "0.6" }, /* @__PURE__ */ k(
      "path",
      {
        fill: colors.tabsArea,
        d: "M237 47C232.582 47 229 43.418 229 39V34C229 29.582 225.418 26 221 26H147C142.582 26 139 29.582 139 34V39C139 43.418 135.418 47 131 47H128V52H312V47H237Z"
      }
    ), /* @__PURE__ */ k(
      "rect",
      {
        x: "172",
        y: "34",
        width: "45",
        height: "4",
        rx: "2",
        fill: colors.navArrows,
        style: { fillOpacity: colors.tabDetailOpacity }
      }
    ), /* @__PURE__ */ k(
      "rect",
      {
        x: "160",
        y: "33",
        width: "6",
        height: "6",
        rx: "3",
        fill: colors.navArrows,
        style: { fillOpacity: colors.tabDetailOpacity }
      }
    )), /* @__PURE__ */ k(
      "path",
      {
        fill: colors.tabsArea,
        d: "M159 47C154.582 47 151 43.418 151 39V34C151 29.582 147.418 26 143 26H79C74.582 26 71 29.582 71 34V39C71 43.418 67.418 47 63 47H60V52H234V47H159Z"
      }
    ), /* @__PURE__ */ k(
      "rect",
      {
        x: "91",
        y: "34",
        width: "45",
        height: "4",
        rx: "2",
        fill: colors.navArrows,
        style: { fillOpacity: colors.tabDetailOpacity }
      }
    ), /* @__PURE__ */ k(
      "rect",
      {
        x: "79",
        y: "33",
        width: "6",
        height: "6",
        rx: "3",
        fill: colors.navArrows,
        style: { fillOpacity: colors.tabDetailOpacity }
      }
    ), /* @__PURE__ */ k("path", { fill: colors.tabsArea, d: "M24 55C24 50.582 27.582 47 32 47H400C404.418 47 408 50.582 408 55V83H24V55Z" }), /* @__PURE__ */ k(
      "path",
      {
        fill: colors.navArrows,
        style: { fillOpacity: colors.navArrowsOpacity },
        d: "M41.859 60.267C42.042 60.084 42.042 59.787 41.859 59.604C41.676 59.421 41.379 59.421 41.196 59.604L37.213 63.591C36.591 64.213 36.591 65.221 37.213 65.844L41.196 69.83C41.379 70.013 41.676 70.013 41.859 69.83C42.042 69.647 42.042 69.351 41.859 69.167L37.881 65.186H47.531C47.79 65.186 48 64.976 48 64.717C48 64.458 47.79 64.248 47.531 64.248H37.881L41.859 60.267ZM384.75 60.969C384.75 60.71 384.96 60.5 385.219 60.5H394.781C395.04 60.5 395.25 60.71 395.25 60.969C395.25 61.228 395.04 61.438 394.781 61.438H385.219C384.96 61.438 384.75 61.228 384.75 60.969ZM384.75 64.719C384.75 64.46 384.96 64.25 385.219 64.25H394.781C395.04 64.25 395.25 64.46 395.25 64.719C395.25 64.978 395.04 65.188 394.781 65.188H385.219C384.96 65.188 384.75 64.978 384.75 64.719ZM385.219 68C384.96 68 384.75 68.21 384.75 68.469C384.75 68.728 384.96 68.938 385.219 68.938H394.781C395.04 68.938 395.25 68.728 395.25 68.469C395.25 68.21 395.04 68 394.781 68H385.219Z"
      }
    ), /* @__PURE__ */ k("circle", { cx: "36", cy: "36", r: "3", fill: colors.navArrows, style: { fillOpacity: colors.dotOpacity } }), /* @__PURE__ */ k("circle", { cx: "46", cy: "36", r: "3", fill: colors.navArrows, style: { fillOpacity: colors.dotOpacity } }), /* @__PURE__ */ k("circle", { cx: "56", cy: "36", r: "3", fill: colors.navArrows, style: { fillOpacity: colors.dotOpacity } }), /* @__PURE__ */ k(
      "path",
      {
        fill: colors.navArrows,
        style: { fillOpacity: colors.waveOpacity, mixBlendMode: "multiply" },
        d: "M81.31 194.544C41.586 186.057 17.379 187.055 0 189.552V224H432V145.302C374.276 141.807 334.399 169.389 262.523 189.552C192.186 209.283 121.828 203.201 81.31 194.544Z"
      }
    ))), /* @__PURE__ */ k(
      "div",
      {
        class: (0, import_classnames13.default)(AddressBarPreview_default.bgOverlay, isReduced && AddressBarPreview_default.bgReduced),
        style: { backgroundColor: colors.addressBarBg, boxShadow: colors.addressBarShadow }
      }
    ), /* @__PURE__ */ k("div", { class: (0, import_classnames13.default)(AddressBarPreview_default.borderOverlay, isReduced && AddressBarPreview_default.borderReduced), style: { borderColor: colors.addressBarBorder } }), /* @__PURE__ */ k(
      "svg",
      {
        class: AddressBarPreview_default.regularIcon,
        style: { opacity: isReduced ? 1 : 0, ...ICON_TRANSITION },
        viewBox: "0 0 12 12",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
      },
      /* @__PURE__ */ k(
        "path",
        {
          fill: colors.searchIcon,
          d: "M5.25 0a5.25 5.25 0 0 1 4.049 8.592l2.555 2.555.064.078a.502.502 0 0 1-.693.693l-.079-.065-2.554-2.554A5.25 5.25 0 1 1 5.25 0m0 1a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5"
        }
      )
    ), /* @__PURE__ */ k(
      "svg",
      {
        class: AddressBarPreview_default.extendedIcon,
        style: { opacity: isReduced ? 0 : 1, ...ICON_TRANSITION },
        viewBox: "0 0 56 20",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
      },
      /* @__PURE__ */ k("rect", { width: "56", height: "20", rx: "10", fill: colors.iconPillOuterBg }),
      /* @__PURE__ */ k(
        "path",
        {
          fill: colors.iconPillBg,
          d: "M2 10C2 5.582 5.582 2 10 2H20C24.418 2 28 5.582 28 10C28 14.418 24.418 18 20 18H10C5.582 18 2 14.418 2 10Z"
        }
      ),
      /* @__PURE__ */ k(
        "path",
        {
          fill: colors.iconPillIcons,
          style: { fillOpacity: colors.iconPillIconsOpacity },
          d: "M14.25 4C17.149 4 19.5 6.351 19.5 9.25C19.5 10.52 19.049 11.684 18.299 12.592L20.854 15.147L20.918 15.225C21.046 15.419 21.024 15.683 20.854 15.854C20.683 16.024 20.419 16.046 20.225 15.918L20.146 15.854L17.592 13.299C16.684 14.049 15.52 14.5 14.25 14.5C11.351 14.5 9 12.149 9 9.25C9 6.351 11.351 4 14.25 4ZM14.25 5C11.903 5 10 6.903 10 9.25C10 11.597 11.903 13.5 14.25 13.5C16.597 13.5 18.5 11.597 18.5 9.25C18.5 6.903 16.597 5 14.25 5Z"
        }
      ),
      /* @__PURE__ */ k(
        "path",
        {
          fill: colors.iconPillBg,
          d: "M41.785 6.453C41.711 6.157 41.289 6.157 41.215 6.453L41.05 7.111C40.831 7.989 40.145 8.675 39.267 8.894L38.609 9.059C38.312 9.133 38.312 9.555 38.609 9.629L39.267 9.794C40.145 10.013 40.831 10.698 41.05 11.576L41.215 12.234C41.289 12.531 41.711 12.531 41.785 12.234L41.949 11.576C42.169 10.698 42.854 10.013 43.732 9.794L44.39 9.629C44.687 9.555 44.687 9.133 44.39 9.059L43.732 8.894C42.854 8.675 42.169 7.989 41.949 7.111L41.785 6.453Z"
        }
      ),
      /* @__PURE__ */ k(
        "path",
        {
          "fill-rule": "evenodd",
          "clip-rule": "evenodd",
          fill: colors.iconPillBg,
          d: "M36.861 15.95C38.853 15.607 42.343 14.946 43.761 14.295C45.954 13.5 47.5 11.583 47.5 9.344C47.5 6.393 44.814 4 41.5 4C38.186 4 35.5 6.393 35.5 9.344C35.5 10.824 36.176 12.164 37.268 13.132C37.508 13.344 37.553 13.712 37.343 13.954L36.373 15.073C36.042 15.455 36.363 16.035 36.861 15.95ZM43.344 13.386L43.381 13.369L43.42 13.355C45.288 12.678 46.5 11.092 46.5 9.344C46.5 7.051 44.373 5 41.5 5C38.627 5 36.5 7.051 36.5 9.344C36.5 10.507 37.029 11.584 37.932 12.384C38.531 12.915 38.71 13.905 38.099 14.609L37.993 14.731C38.727 14.595 39.532 14.435 40.308 14.262C41.614 13.971 42.743 13.662 43.344 13.386Z"
        }
      )
    ));
  }

  // pages/onboarding/app/v4/components/AddressBarContent.module.css
  var AddressBarContent_default = {
    root: "AddressBarContent_root",
    previewContainer: "AddressBarContent_previewContainer",
    toggleButtons: "AddressBarContent_toggleButtons",
    footer: "AddressBarContent_footer",
    starIcon: "AddressBarContent_starIcon",
    footerText: "AddressBarContent_footerText",
    startButton: "AddressBarContent_startButton"
  };

  // pages/onboarding/app/v4/components/AddressBarContent.js
  function AddressBarContent({ dismiss, updateSystemValue }) {
    const { t: t3 } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const { status } = useGlobalState();
    const [selectedOption, setSelectedOption] = d2(
      /** @type {AddressBarOption} */
      "search-and-duckai"
    );
    const isPending = status.kind === "executing";
    const select = (option) => {
      if (option === selectedOption || isPending) return;
      setSelectedOption(option);
      updateSystemValue("address-bar-mode", { enabled: option === "search-and-duckai" }, true);
    };
    return /* @__PURE__ */ k(Container, { class: AddressBarContent_default.root }, /* @__PURE__ */ k("div", { class: AddressBarContent_default.previewContainer }, /* @__PURE__ */ k(AddressBarPreview, { isReduced: selectedOption === "search-only", isDarkMode })), /* @__PURE__ */ k("div", { class: AddressBarContent_default.toggleButtons }, /* @__PURE__ */ k(
      ToggleButton,
      {
        label: t3("addressBarMode_searchAndDuckAi"),
        selected: selectedOption === "search-and-duckai",
        onClick: () => select("search-and-duckai")
      }
    ), /* @__PURE__ */ k(
      ToggleButton,
      {
        label: t3("addressBarMode_searchOnly"),
        selected: selectedOption === "search-only",
        onClick: () => select("search-only")
      }
    )), /* @__PURE__ */ k("div", { class: AddressBarContent_default.footer }, /* @__PURE__ */ k("img", { src: "assets/img/steps/v4/ai-chat.svg", alt: "", class: AddressBarContent_default.starIcon }), /* @__PURE__ */ k("span", { class: AddressBarContent_default.footerText }, /* @__PURE__ */ k(Trans, { str: t3("addressBarMode_footer"), values: {} }))), /* @__PURE__ */ k(Button, { variant: "primary", size: "wide", class: AddressBarContent_default.startButton, onClick: dismiss }, t3("startBrowsing"), " ", /* @__PURE__ */ k(Launch, null)));
  }

  // pages/onboarding/app/v4/components/WelcomeContent.module.css
  var WelcomeContent_default = {
    root: "WelcomeContent_root",
    title: "WelcomeContent_title",
    "slide-up": "WelcomeContent_slide-up",
    "fade-in-out": "WelcomeContent_fade-in-out",
    logo: "WelcomeContent_logo",
    "scale-down": "WelcomeContent_scale-down",
    "fade-out": "WelcomeContent_fade-out"
  };

  // pages/onboarding/app/v4/components/WelcomeContent.js
  var WELCOME_ANIMATION_MS = 3033;
  function WelcomeContent({ onComplete }) {
    const { isReducedMotion } = useEnv();
    const { t: t3 } = useTypedTranslation();
    const didComplete = A2(false);
    const complete = () => {
      if (!didComplete.current) {
        didComplete.current = true;
        onComplete();
      }
    };
    h2(() => {
      if (!isReducedMotion) return;
      const timer = setTimeout(complete, WELCOME_ANIMATION_MS);
      return () => clearTimeout(timer);
    }, [isReducedMotion]);
    return /* @__PURE__ */ k("div", { class: WelcomeContent_default.root, onAnimationEnd: complete }, /* @__PURE__ */ k(LottieAnimation, { class: WelcomeContent_default.logo, src: "assets/lottie/v4/dax-logo.json", width: 96, height: 96 }), /* @__PURE__ */ k("h1", { class: WelcomeContent_default.title }, t3("welcome_title_v4")));
  }

  // pages/onboarding/app/v4/components/GetStartedContent.js
  var import_classnames14 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/GetStartedContent.module.css
  var GetStartedContent_default = {
    root: "GetStartedContent_root",
    "slide-up": "GetStartedContent_slide-up",
    "fade-in": "GetStartedContent_fade-in",
    text: "GetStartedContent_text",
    title: "GetStartedContent_title",
    body: "GetStartedContent_body",
    hidden: "GetStartedContent_hidden",
    revealable: "GetStartedContent_revealable",
    checkboxRow: "GetStartedContent_checkboxRow",
    checkboxLabel: "GetStartedContent_checkboxLabel",
    checkbox: "GetStartedContent_checkbox",
    checked: "GetStartedContent_checked",
    checkboxInput: "GetStartedContent_checkboxInput",
    checkmark: "GetStartedContent_checkmark",
    checkboxText: "GetStartedContent_checkboxText",
    infoIconWrapper: "GetStartedContent_infoIconWrapper",
    infoIcon: "GetStartedContent_infoIcon",
    tooltip: "GetStartedContent_tooltip"
  };

  // pages/onboarding/app/v4/components/GetStartedContent.js
  function GetStartedContent({ advance, onTitleComplete }) {
    const { t: t3 } = useTypedTranslation();
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible, step } = useGlobalState();
    const dispatch = useGlobalDispatch();
    const [chromeExtensionChecked, setChromeExtensionChecked] = d2(false);
    const showChromeExtension = (
      /** @type {import('../../types').GetStartedStep} */
      step.options?.includes("chrome-extension-install")
    );
    const [title, ...paragraphs] = t3("getStarted_title_v4", { newline: "\n" }).split("{paragraph}");
    const body = paragraphs.join("\n\n");
    function handleAdvance() {
      if (showChromeExtension && chromeExtensionChecked) {
        dispatch({ kind: "request-chrome-extension" });
      }
      advance();
    }
    return /* @__PURE__ */ k(Container, { class: GetStartedContent_default.root }, /* @__PURE__ */ k("div", { class: GetStartedContent_default.text }, /* @__PURE__ */ k(Title, { class: GetStartedContent_default.title }, hasTypingEffect ? /* @__PURE__ */ k(
      Typed,
      {
        text: title,
        startDelay: 800,
        onComplete: onTitleComplete
      }
    ) : title), /* @__PURE__ */ k(
      "p",
      {
        class: (0, import_classnames14.default)(GetStartedContent_default.body, {
          [GetStartedContent_default.revealable]: hasTypingEffect,
          [GetStartedContent_default.hidden]: hasTypingEffect && !activeStepVisible
        })
      },
      body
    )), /* @__PURE__ */ k(
      Button,
      {
        class: (0, import_classnames14.default)({ [GetStartedContent_default.revealable]: hasTypingEffect, [GetStartedContent_default.hidden]: hasTypingEffect && !activeStepVisible }),
        size: "stretch",
        onClick: handleAdvance
      },
      t3(showChromeExtension ? "getStartedButton_v4" : "getStartedButtonDefault_v4")
    ), showChromeExtension && /* @__PURE__ */ k(
      ChromeExtensionCheckbox,
      {
        class: (0, import_classnames14.default)({ [GetStartedContent_default.revealable]: hasTypingEffect, [GetStartedContent_default.hidden]: hasTypingEffect && !activeStepVisible }),
        checked: chromeExtensionChecked,
        onChange: setChromeExtensionChecked,
        label: t3("getStarted_chromeExtension_label"),
        tooltip: t3("getStarted_chromeExtension_tooltip")
      }
    ));
  }
  function ChromeExtensionCheckbox({ checked, onChange, label, tooltip, class: className }) {
    const [showTooltip, setShowTooltip] = d2(false);
    return /* @__PURE__ */ k("div", { class: (0, import_classnames14.default)(GetStartedContent_default.checkboxRow, className) }, /* @__PURE__ */ k("label", { class: GetStartedContent_default.checkboxLabel }, /* @__PURE__ */ k("span", { class: (0, import_classnames14.default)(GetStartedContent_default.checkbox, { [GetStartedContent_default.checked]: checked }) }, /* @__PURE__ */ k(
      "input",
      {
        type: "checkbox",
        class: GetStartedContent_default.checkboxInput,
        checked,
        onChange: (e3) => onChange(
          /** @type {HTMLInputElement} */
          e3.target.checked
        )
      }
    ), checked && /* @__PURE__ */ k("svg", { class: GetStartedContent_default.checkmark, viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ k(
      "path",
      {
        d: "M2.5 6L5 8.5L9.5 3.5",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ))), /* @__PURE__ */ k("span", { class: GetStartedContent_default.checkboxText }, label)), /* @__PURE__ */ k("span", { class: GetStartedContent_default.infoIconWrapper, onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false) }, /* @__PURE__ */ k("span", { class: GetStartedContent_default.infoIcon, "aria-label": "More information" }, /* @__PURE__ */ k("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16" }, /* @__PURE__ */ k("circle", { cx: "8", cy: "8", r: "7", fill: "currentColor" }), /* @__PURE__ */ k(
      "path",
      {
        d: "M7.25 7h1.5v4h-1.5V7ZM8 4.5a.875.875 0 1 1 0 1.75.875.875 0 0 1 0-1.75Z",
        fill: "var(--ds-surface-tertiary, white)"
      }
    ))), showTooltip && /* @__PURE__ */ k("span", { class: GetStartedContent_default.tooltip, role: "tooltip" }, tooltip)));
  }

  // pages/onboarding/app/v4/components/GetStartedAnimation.js
  var import_classnames15 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/GetStartedAnimation.module.css
  var GetStartedAnimation_default = {
    root: "GetStartedAnimation_root",
    fadeOut: "GetStartedAnimation_fadeOut",
    "fade-out": "GetStartedAnimation_fade-out"
  };

  // pages/onboarding/app/v4/components/GetStartedAnimation.js
  function GetStartedAnimation({ class: className }) {
    const { exiting } = useGlobalState();
    return /* @__PURE__ */ k(
      LottieAnimation,
      {
        class: (0, import_classnames15.default)(GetStartedAnimation_default.root, exiting && GetStartedAnimation_default.fadeOut, className),
        src: "assets/lottie/v4/dax-in-spotlight-thumbs-up.json",
        darkSrc: "assets/lottie/v4/dax-in-spotlight-thumbs-up-dark.json",
        width: 274,
        height: 274
      }
    );
  }

  // pages/onboarding/app/v4/components/SystemSettingsAnimation.js
  var import_classnames16 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/SystemSettingsAnimation.module.css
  var SystemSettingsAnimation_default = {
    background: "SystemSettingsAnimation_background",
    foreground: "SystemSettingsAnimation_foreground",
    fadeOut: "SystemSettingsAnimation_fadeOut",
    "fade-out": "SystemSettingsAnimation_fade-out"
  };

  // pages/onboarding/app/v4/components/SystemSettingsAnimation.js
  function SystemSettingsBackground() {
    const { exiting } = x2(GlobalContext);
    return /* @__PURE__ */ k(
      LottieAnimation,
      {
        class: (0, import_classnames16.default)(SystemSettingsAnimation_default.background, exiting && SystemSettingsAnimation_default.fadeOut),
        src: "assets/lottie/v4/dax-in-spotlight-pointing-background.json",
        darkSrc: "assets/lottie/v4/dax-in-spotlight-pointing-background-dark.json",
        width: 170,
        height: 170
      }
    );
  }
  function SystemSettingsForeground() {
    const { exiting } = x2(GlobalContext);
    return /* @__PURE__ */ k(
      LottieAnimation,
      {
        class: (0, import_classnames16.default)(SystemSettingsAnimation_default.foreground, exiting && SystemSettingsAnimation_default.fadeOut),
        src: "assets/lottie/v4/dax-in-spotlight-pointing-foreground.json",
        width: 170,
        height: 170
      }
    );
  }

  // pages/onboarding/app/v4/components/FadeTransition.js
  var import_classnames17 = __toESM(require_classnames(), 1);

  // pages/onboarding/app/v4/components/FadeTransition.module.css
  var FadeTransition_default = {
    fadeOut: "FadeTransition_fadeOut",
    "fade-out": "FadeTransition_fade-out",
    fadeIn: "FadeTransition_fadeIn",
    "fade-in": "FadeTransition_fade-in"
  };

  // pages/onboarding/app/v4/components/FadeTransition.js
  function FadeTransition({ transitionKey, children }) {
    const { isReducedMotion } = useEnv();
    const [snapshot, setSnapshot] = d2({ key: transitionKey, content: children });
    const [phase, setPhase] = d2(
      /** @type {'idle' | 'exiting' | 'entering'} */
      "idle"
    );
    if (transitionKey !== snapshot.key && phase === "idle") {
      if (isReducedMotion) {
        setSnapshot({ key: transitionKey, content: children });
      } else {
        setPhase("exiting");
      }
    }
    const advance = (e3) => {
      if (e3.target !== e3.currentTarget) return;
      if (phase === "exiting") {
        setSnapshot({ key: transitionKey, content: children });
        setPhase("entering");
      } else if (phase === "entering") {
        setPhase("idle");
      }
    };
    return /* @__PURE__ */ k("div", { class: (0, import_classnames17.default)(phase === "exiting" && FadeTransition_default.fadeOut, phase === "entering" && FadeTransition_default.fadeIn), onAnimationEnd: advance }, phase === "idle" ? children : snapshot.content);
  }

  // pages/onboarding/app/v4/components/DockInstructionsContent.module.css
  var DockInstructionsContent_default = {
    video: "DockInstructionsContent_video",
    instruction: "DockInstructionsContent_instruction",
    icon: "DockInstructionsContent_icon",
    instructionText: "DockInstructionsContent_instructionText"
  };

  // pages/onboarding/app/v4/components/DockInstructionsContent.js
  function DockInstructionsContent({ updateSystemValue }) {
    const { t: t3 } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const dispatch = useGlobalDispatch();
    const next = () => {
      dispatch({ kind: "dismiss-overlay" });
      updateSystemValue("dock-instructions", { enabled: true }, true);
    };
    return /* @__PURE__ */ k(Container, null, /* @__PURE__ */ k(
      "video",
      {
        class: DockInstructionsContent_default.video,
        src: "assets/videos/add-to-dock.mp4",
        autoPlay: !isReducedMotion,
        loop: true,
        muted: true,
        playsinline: true,
        width: 384,
        height: 188
      }
    ), /* @__PURE__ */ k("div", { class: DockInstructionsContent_default.instruction }, /* @__PURE__ */ k("img", { src: "assets/img/steps/v4/dock.svg", alt: "", class: DockInstructionsContent_default.icon }), /* @__PURE__ */ k("p", { class: DockInstructionsContent_default.instructionText }, /* @__PURE__ */ k(Trans, { str: t3("dockInstructions_body"), values: {} }))), /* @__PURE__ */ k(Button, { variant: "primary", size: "stretch", onClick: next }, t3("nextButton")));
  }

  // pages/onboarding/app/v4/data/data.js
  var stepsConfig = {
    welcome: ({ advance }) => {
      return {
        content: /* @__PURE__ */ k(WelcomeContent, { onComplete: advance })
      };
    },
    getStarted: ({ enqueueNext, onTitleComplete, isShortViewport, globalState }) => {
      const showChromeExtension = (
        /** @type {import('../../types').GetStartedStep} */
        globalState.step.options?.includes(
          "chrome-extension-install"
        )
      );
      return {
        bottomBubble: {
          content: /* @__PURE__ */ k(GetStartedContent, { advance: enqueueNext, onTitleComplete }),
          tail: isShortViewport ? void 0 : "bottom-left"
        },
        illustration: isShortViewport ? void 0 : {
          foreground: /* @__PURE__ */ k(GetStartedAnimation, null)
        },
        bubbleWidth: showChromeExtension ? "chromeExtension" : "narrow"
      };
    },
    makeDefaultSingle: ({ enqueueNext, onTitleComplete, updateSystemValue }) => {
      return {
        bottomBubble: {
          content: /* @__PURE__ */ k(MakeDefaultContent, { advance: enqueueNext, onTitleComplete, updateSystemValue })
        },
        showProgress: true
      };
    },
    systemSettings: ({ t: t3, globalState, enqueueNext, dismiss, onTitleComplete, updateSystemValue }) => {
      const { overlay, activeStep, activeRow } = globalState;
      return {
        topBubble: {
          content: /* @__PURE__ */ k(
            StepHeader,
            {
              title: t3("systemSettings_title_v3"),
              subtitle: t3("systemSettings_subtitle_v3"),
              onTitleComplete
            }
          ),
          tail: "right"
        },
        bottomBubble: {
          content: /* @__PURE__ */ k(FadeTransition, { transitionKey: overlay ?? "none" }, overlay === "dock-instructions" ? /* @__PURE__ */ k(DockInstructionsContent, { updateSystemValue }) : /* @__PURE__ */ k(SettingsContent, { advance: enqueueNext, dismiss, updateSystemValue }))
        },
        illustration: overlay ? void 0 : {
          background: /* @__PURE__ */ k(SystemSettingsBackground, null),
          foreground: /* @__PURE__ */ k(SystemSettingsForeground, null)
        },
        showProgress: true,
        bounceKey: `${activeStep}-${activeRow}-${overlay ?? "none"}`
      };
    },
    duckPlayerSingle: ({ t: t3, globalState, enqueueNext, onTitleComplete }) => {
      const duckPlayerStep = (
        /** @type {import('../../types').DuckPlayerSingleStep} */
        globalState.stepDefinitions.duckPlayerSingle
      );
      const isAdFree = duckPlayerStep.variant === "ad-free";
      return {
        topBubble: {
          content: /* @__PURE__ */ k(
            StepHeader,
            {
              title: isAdFree ? t3("duckPlayer_adFree_title") : t3("duckPlayer_v4_title", { newline: "\n" }),
              subtitle: isAdFree ? t3("duckPlayer_adFree_subtitle", { newline: " " }) : t3("duckPlayer_v4_subtitle", { newline: "\n" }),
              onTitleComplete
            }
          )
        },
        bottomBubble: { content: /* @__PURE__ */ k(DuckPlayerContent, { isAdFree, advance: enqueueNext }) },
        showProgress: true
      };
    },
    customize: ({ t: t3, globalState, enqueueNext, dismiss, onTitleComplete, updateSystemValue }) => {
      const { activeStep, activeRow } = globalState;
      return {
        topBubble: {
          content: /* @__PURE__ */ k(StepHeader, { title: t3("customize_title_v3"), subtitle: t3("customize_subtitle_v3"), onTitleComplete })
        },
        bottomBubble: { content: /* @__PURE__ */ k(SettingsContent, { advance: enqueueNext, dismiss, updateSystemValue }) },
        showProgress: true,
        bounceKey: `${activeStep}-${activeRow}`
      };
    },
    addressBarMode: ({ t: t3, dismiss, onTitleComplete, updateSystemValue }) => {
      return {
        topBubble: {
          content: /* @__PURE__ */ k(StepHeader, { title: t3("addressBarMode_title"), onTitleComplete })
        },
        bottomBubble: { content: /* @__PURE__ */ k(AddressBarContent, { dismiss, updateSystemValue }) },
        showProgress: true
      };
    }
  };
  var settingsRowItems = {
    "default-browser": (t3) => ({
      id: "default-browser",
      icon: "v3/Browser-Default-Color-24.svg",
      title: t3("row_default-browser_title_v3"),
      kind: "one-time",
      acceptText: t3("row_default-browser_accept")
    }),
    import: (t3) => ({
      id: "import",
      icon: "v4/import.svg",
      title: t3("row_import_title_v3"),
      secondaryText: t3("row_import_summary_v3"),
      kind: "one-time",
      acceptText: t3("row_import_accept_v3"),
      acceptTextRecall: t3("row_import_accept")
    }),
    dock: (t3, platform) => {
      const title = platform === "macos" ? t3("row_dock_title_v3") : t3("row_taskbar_title_v3");
      const acceptText = platform === "macos" ? t3("row_dock_macos_accept") : t3("row_dock_accept");
      const secondaryText = platform === "macos" ? t3("row_dock_summary_v3") : t3("row_taskbar_summary_v3");
      return {
        id: "dock",
        icon: "v4/dock.svg",
        title,
        secondaryText,
        kind: "one-time",
        acceptText
      };
    },
    bookmarks: (t3) => ({
      id: "bookmarks",
      icon: "v4/bookmark.svg",
      title: t3("row_bookmarks_title_v3"),
      kind: "toggle",
      acceptText: t3("row_bookmarks_accept")
    }),
    "session-restore": (t3) => ({
      id: "session-restore",
      icon: "v4/session-restore.svg",
      title: t3("row_session-restore_title_v3"),
      kind: "toggle",
      acceptText: t3("row_session-restore_accept")
    }),
    "home-shortcut": (t3) => ({
      id: "home-shortcut",
      icon: "v4/home.svg",
      title: t3("row_home-shortcut_title_v3"),
      kind: "toggle",
      acceptText: t3("row_home-shortcut_accept")
    }),
    "placebo-ad-blocking": (t3) => ({
      id: "placebo-ad-blocking",
      icon: "v3/Ads-Blocked-Color-24.svg",
      title: t3("row_placebo-ad-blocking_title_v3"),
      secondaryText: t3("row_ad-blocking_desc_v3"),
      kind: "one-time",
      acceptText: t3("row_ad-blocking_accept_v3")
    }),
    "aggressive-ad-blocking": (t3) => ({
      id: "aggressive-ad-blocking",
      icon: "v3/Ads-Blocked-Color-24.svg",
      title: t3("row_aggressive-ad-blocking_title_v3"),
      secondaryText: t3("row_ad-blocking_desc_v3"),
      kind: "one-time",
      acceptText: t3("row_ad-blocking_accept_v3")
    }),
    "youtube-ad-blocking": (t3) => ({
      id: "youtube-ad-blocking",
      icon: "v3/Ads-Blocked-Color-24.svg",
      title: t3("row_youtube-ad-blocking_title_v3"),
      secondaryText: t3("row_youtube-ad-blocking_desc_v3"),
      kind: "one-time",
      acceptText: t3("row_youtube-ad-blocking_accept_v3")
    }),
    "address-bar-mode": (t3) => ({
      id: "address-bar-mode",
      icon: "v3/Ai-Chat-Color-24.svg",
      title: t3("addressBarMode_title"),
      kind: "toggle",
      acceptText: t3("startBrowsing")
    }),
    "dock-instructions": (t3) => ({
      id: "dock-instructions",
      icon: "v4/dock.svg",
      title: t3("row_dock_title_v3"),
      secondaryText: t3("row_dock_summary_v3"),
      kind: "one-time",
      acceptText: t3("row_dock-instructions_accept")
    }),
    "chrome-extension-install": (t3) => ({
      id: "chrome-extension-install",
      icon: "v3/Browser-Default-Color-24.svg",
      title: t3("getStarted_chromeExtension_label"),
      kind: "one-time",
      acceptText: t3("getStarted_chromeExtension_label")
    })
  };
  var stepDefinitions = {
    welcome: {
      id: "welcome",
      kind: "info"
    },
    getStarted: {
      id: "getStarted",
      kind: "info"
    },
    makeDefaultSingle: {
      id: "makeDefaultSingle",
      kind: "settings",
      rows: ["default-browser"]
    },
    systemSettings: {
      id: "systemSettings",
      kind: "settings",
      rows: ["dock", "import"]
    },
    duckPlayerSingle: {
      id: "duckPlayerSingle",
      kind: "info"
    },
    customize: {
      id: "customize",
      kind: "settings",
      rows: ["bookmarks", "session-restore", "home-shortcut"]
    },
    addressBarMode: {
      id: "addressBarMode",
      kind: "info"
    }
  };

  // pages/onboarding/app/v4/hooks/useStepConfig.js
  function calculateProgress(order, activeStep) {
    const progressSteps = order.slice(2);
    return {
      current: progressSteps.indexOf(activeStep) + 1,
      total: progressSteps.length
    };
  }
  function useStepConfig() {
    const globalState = x2(GlobalContext);
    const platformName = usePlatformName() || "macos";
    const isShortViewport = useMediaQuery("(max-height: 549px)");
    const dispatch = x2(GlobalDispatch);
    const { t: t3 } = useTypedTranslation();
    const { order, activeStep } = globalState;
    const progress = calculateProgress(order, activeStep);
    const advance = () => {
      dispatch({ kind: "advance" });
    };
    const enqueueNext = () => dispatch({ kind: "enqueue-next" });
    const dismiss = () => dispatch({ kind: "dismiss" });
    const onTitleComplete = () => dispatch({ kind: "title-complete" });
    const updateSystemValue = (id, payload, current) => dispatch({
      kind: "update-system-value",
      id,
      payload,
      current
    });
    const configParams = {
      t: t3,
      platformName,
      globalState,
      progress,
      advance,
      enqueueNext,
      dismiss,
      onTitleComplete,
      updateSystemValue,
      isShortViewport
    };
    if (!stepsConfig[activeStep]) {
      throw new Error(`Missing step config for ${activeStep}`);
    }
    return {
      ...configParams,
      ...stepsConfig[activeStep](configParams)
    };
  }

  // pages/onboarding/app/v4/components/SingleStep.module.css
  var SingleStep_default = {
    layout: "SingleStep_layout",
    narrow: "SingleStep_narrow",
    chromeExtension: "SingleStep_chromeExtension",
    hasTop: "SingleStep_hasTop",
    hasBottom: "SingleStep_hasBottom",
    topBubble: "SingleStep_topBubble",
    bottomBubble: "SingleStep_bottomBubble",
    illustrationBackground: "SingleStep_illustrationBackground",
    illustrationForeground: "SingleStep_illustrationForeground",
    "scale-up": "SingleStep_scale-up",
    "slide-up": "SingleStep_slide-up",
    "fade-in": "SingleStep_fade-in"
  };

  // pages/onboarding/app/v4/components/SingleStep.js
  var bubbleWidthOverride = new URLSearchParams(window.location.search).get("bubbleWidth");
  var staggeredBottomDelay = (() => {
    const override = new URLSearchParams(window.location.search).get("bubbleFadeInDelay");
    const offset = override ? Number.parseInt(override, 10) : 250;
    return 400 + (Number.isNaN(offset) ? 250 : offset);
  })();
  function SingleStep() {
    const { content: content2, topBubble, bottomBubble, showProgress, progress, bubbleWidth, globalState, bounceKey, illustration, advance } = useStepConfig();
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible } = useGlobalState();
    const [topHeight, setTopHeight] = d2(0);
    const [bottomHeight, setBottomHeight] = d2(0);
    const layoutStyle = {
      "--bubble-top-height": `${topHeight}px`,
      "--bubble-bottom-height": `${bottomHeight}px`
    };
    if (bubbleWidthOverride) {
      layoutStyle["--bubble-width"] = /^\d+$/.test(bubbleWidthOverride) ? `${bubbleWidthOverride}px` : bubbleWidthOverride;
    }
    if (!topBubble && !bottomBubble) {
      return content2 || null;
    }
    let topFadeInMode = (
      /** @type {'normal'|'skip'|'deferred'} */
      "normal"
    );
    let bottomFadeInMode = (
      /** @type {'normal'|'skip'|'deferred'} */
      "normal"
    );
    let bottomFadeInDelay = (
      /** @type {number|undefined} */
      topBubble ? staggeredBottomDelay : void 0
    );
    if (hasTypingEffect) {
      if (topBubble) {
        topFadeInMode = "skip";
        bottomFadeInMode = activeStepVisible ? "normal" : "deferred";
        bottomFadeInDelay = 0;
      } else {
        bottomFadeInMode = "skip";
      }
    }
    return /* @__PURE__ */ k(
      "div",
      {
        class: (0, import_classnames18.default)(SingleStep_default.layout, {
          [SingleStep_default.hasTop]: !!topBubble,
          [SingleStep_default.hasBottom]: !!bottomBubble,
          [SingleStep_default.narrow]: bubbleWidth === "narrow",
          [SingleStep_default.chromeExtension]: bubbleWidth === "chromeExtension"
        }),
        style: layoutStyle
      },
      /* @__PURE__ */ k(
        Bubble,
        {
          class: SingleStep_default.topBubble,
          tail: topBubble?.tail,
          onHeight: setTopHeight,
          bounceKey: bounceKey || globalState.activeStep,
          bounceDelay: 300,
          exiting: globalState.exiting,
          onExitComplete: topBubble ? advance : void 0,
          progress: showProgress && topBubble ? progress : void 0,
          fadeInMode: topFadeInMode
        },
        topBubble?.content
      ),
      illustration?.background && /* @__PURE__ */ k("div", { class: SingleStep_default.illustrationBackground }, illustration.background),
      /* @__PURE__ */ k(
        Bubble,
        {
          class: SingleStep_default.bottomBubble,
          tail: bottomBubble?.tail,
          onHeight: setBottomHeight,
          bounceKey: bounceKey || globalState.activeStep,
          bounceDelay: 167,
          exiting: globalState.exiting,
          onExitComplete: topBubble ? void 0 : advance,
          progress: showProgress && !topBubble ? progress : void 0,
          fadeInMode: bottomFadeInMode,
          fadeInDelay: bottomFadeInDelay
        },
        bottomBubble?.content
      ),
      illustration?.foreground && /* @__PURE__ */ k("div", { class: SingleStep_default.illustrationForeground }, illustration.foreground),
      content2
    );
  }

  // pages/onboarding/app/v4/App.js
  function App({ children }) {
    const { debugState, isDarkMode } = useEnv();
    const platformName = usePlatformName();
    const globalState = useGlobalState();
    const dispatch = useGlobalDispatch();
    const { activeStep, exiting } = globalState;
    const didCatch = ({ error }) => {
      const message = error?.message || "unknown";
      dispatch({ kind: "error-boundary", error: { message, id: activeStep } });
    };
    return /* @__PURE__ */ k("main", { class: isDarkMode ? "theme-dark" : "theme-light", "data-platform-name": platformName || "macos", "data-app-version": "v4" }, /* @__PURE__ */ k(Background, null), debugState && /* @__PURE__ */ k(Debug, { state: globalState }), /* @__PURE__ */ k("div", { class: App_default.container, "data-current": activeStep, "data-exiting": String(exiting) }, /* @__PURE__ */ k(ErrorBoundary, { didCatch, fallback: /* @__PURE__ */ k(Fallback, null) }, /* @__PURE__ */ k(SingleStep, null))), children);
  }
  function Debug(props) {
    const { order, step, exiting, activeStep, nextStep } = props.state;
    const debugData = { order, step, exiting, activeStep, nextStep };
    return /* @__PURE__ */ k("div", { style: { position: "absolute", top: 0, right: 0, overflowY: "scroll", height: "100vh", zIndex: 1e4, pointerEvents: "none" } }, /* @__PURE__ */ k("pre", null, /* @__PURE__ */ k("code", null, JSON.stringify(debugData, null, 2))));
  }

  // pages/onboarding/app/shared/components/SkipLink.js
  function SkipLink() {
    const dispatch = x2(GlobalDispatch);
    const count = A2(0);
    const handler = () => {
      count.current = count.current + 1;
      if (count.current >= 5) {
        dispatch({ kind: "dismiss" });
      }
    };
    return /* @__PURE__ */ k("div", { style: "position: fixed; bottom: 0; left: 0; width: 50px; height: 50px", onClick: handler, "data-testid": "skip" });
  }

  // shared/environment.js
  var Environment = class _Environment {
    /**
     * @param {object} params
     * @param {'app' | 'components'} [params.display] - whether to show the application or component list
     * @param {'production' | 'development'} [params.env] - application environment
     * @param {URLSearchParams} [params.urlParams] - URL params passed into the page
     * @param {ImportMeta['injectName']} [params.injectName] - application platform
     * @param {boolean} [params.willThrow] - whether the application will simulate an error
     * @param {boolean} [params.debugState] - whether to show debugging UI
     * @param {keyof typeof import('./utils').translationsLocales} [params.locale] - for applications strings and numbers formatting
     * @param {number} [params.textLength] - what ratio of text should be used. Set a number higher than 1 to have longer strings for testing
     */
    constructor({
      env = "production",
      urlParams = new URLSearchParams(location.search),
      injectName = "windows",
      willThrow = urlParams.get("willThrow") === "true",
      debugState = urlParams.has("debugState"),
      display = "app",
      locale = "en",
      textLength = 1
    } = {}) {
      this.display = display;
      this.urlParams = urlParams;
      this.injectName = injectName;
      this.willThrow = willThrow;
      this.debugState = debugState;
      this.env = env;
      this.locale = locale;
      this.textLength = textLength;
    }
    /**
     * @param {string|null|undefined} injectName
     * @returns {Environment}
     */
    withInjectName(injectName) {
      if (!injectName) return this;
      if (!isInjectName(injectName)) return this;
      return new _Environment({
        ...this,
        injectName
      });
    }
    /**
     * @param {string|null|undefined} env
     * @returns {Environment}
     */
    withEnv(env) {
      if (!env) return this;
      if (env !== "production" && env !== "development") return this;
      return new _Environment({
        ...this,
        env
      });
    }
    /**
     * @param {string|null|undefined} display
     * @returns {Environment}
     */
    withDisplay(display) {
      if (!display) return this;
      if (display !== "app" && display !== "components") return this;
      return new _Environment({
        ...this,
        display
      });
    }
    /**
     * @param {string|null|undefined} locale
     * @returns {Environment}
     */
    withLocale(locale) {
      if (!locale) return this;
      if (typeof locale !== "string") return this;
      if (locale.length !== 2) return this;
      return new _Environment({
        ...this,
        locale
      });
    }
    /**
     * @param {string|number|null|undefined} length
     * @returns {Environment}
     */
    withTextLength(length2) {
      if (!length2) return this;
      const num = Number(length2);
      if (num >= 1 && num <= 2) {
        return new _Environment({
          ...this,
          textLength: num
        });
      }
      return this;
    }
  };
  function isInjectName(input) {
    const allowed = ["windows", "apple", "integration", "android"];
    return allowed.includes(input);
  }

  // ../messaging/lib/windows.js
  var WindowsMessagingTransport = class {
    /**
     * @param {WindowsMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      this.globals = {
        window,
        JSONparse: window.JSON.parse,
        JSONstringify: window.JSON.stringify,
        Promise: window.Promise,
        Error: window.Error,
        String: window.String
      };
      for (const [methodName, fn] of Object.entries(this.config.methods)) {
        if (typeof fn !== "function") {
          throw new Error("cannot create WindowsMessagingTransport, missing the method: " + methodName);
        }
      }
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
      const data2 = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const notification = WindowsNotification.fromNotification(msg, data2);
      this.config.methods.postMessage(notification);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     * @param {{signal?: AbortSignal}} opts
     * @return {Promise<any>}
     */
    request(msg, opts = {}) {
      const data2 = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const outgoing = WindowsRequestMessage.fromRequest(msg, data2);
      this.config.methods.postMessage(outgoing);
      const comparator = (eventData) => {
        return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.id === msg.id;
      };
      function isMessageResponse(data3) {
        if ("result" in data3) return true;
        if ("error" in data3) return true;
        return false;
      }
      return new this.globals.Promise((resolve, reject) => {
        try {
          this._subscribe(comparator, opts, (value2, unsubscribe) => {
            unsubscribe();
            if (!isMessageResponse(value2)) {
              console.warn("unknown response type", value2);
              return reject(new this.globals.Error("unknown response"));
            }
            if (value2.result) {
              return resolve(value2.result);
            }
            const message = this.globals.String(value2.error?.message || "unknown error");
            reject(new this.globals.Error(message));
          });
        } catch (e3) {
          reject(e3);
        }
      });
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
      const comparator = (eventData) => {
        return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.subscriptionName === msg.subscriptionName;
      };
      const cb = (eventData) => {
        return callback(eventData.params);
      };
      return this._subscribe(comparator, {}, cb);
    }
    /**
     * @typedef {import('../index.js').MessageResponse | import('../index.js').SubscriptionEvent} Incoming
     */
    /**
     * @param {(eventData: any) => boolean} comparator
     * @param {{signal?: AbortSignal}} options
     * @param {(value: Incoming, unsubscribe: (()=>void)) => void} callback
     * @internal
     */
    _subscribe(comparator, options2, callback) {
      if (options2?.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      let teardown;
      const idHandler = (event) => {
        if (this.messagingContext.env === "production") {
          if (event.origin !== null && event.origin !== void 0) {
            console.warn("ignoring because evt.origin is not `null` or `undefined`");
            return;
          }
        }
        if (!event.data) {
          console.warn("data absent from message");
          return;
        }
        if (comparator(event.data)) {
          if (!teardown) throw new Error("unreachable");
          callback(event.data, teardown);
        }
      };
      const abortHandler = () => {
        teardown?.();
        throw new DOMException("Aborted", "AbortError");
      };
      this.config.methods.addEventListener("message", idHandler);
      options2?.signal?.addEventListener("abort", abortHandler);
      teardown = () => {
        this.config.methods.removeEventListener("message", idHandler);
        options2?.signal?.removeEventListener("abort", abortHandler);
      };
      return () => {
        teardown?.();
      };
    }
  };
  var WindowsMessagingConfig = class {
    /**
     * @param {object} params
     * @param {WindowsInteropMethods} params.methods
     * @internal
     */
    constructor(params) {
      this.methods = params.methods;
      this.platform = "windows";
    }
  };
  var WindowsNotification = class {
    /**
     * @param {object} params
     * @param {string} params.Feature
     * @param {string} params.SubFeatureName
     * @param {string} params.Name
     * @param {Record<string, any>} [params.Data]
     * @internal
     */
    constructor(params) {
      this.Feature = params.Feature;
      this.SubFeatureName = params.SubFeatureName;
      this.Name = params.Name;
      this.Data = params.Data;
    }
    /**
     * Helper to convert a {@link NotificationMessage} to a format that Windows can support
     * @param {NotificationMessage} notification
     * @returns {WindowsNotification}
     */
    static fromNotification(notification, data2) {
      const output = {
        Data: data2,
        Feature: notification.context,
        SubFeatureName: notification.featureName,
        Name: notification.method
      };
      return output;
    }
  };
  var WindowsRequestMessage = class {
    /**
     * @param {object} params
     * @param {string} params.Feature
     * @param {string} params.SubFeatureName
     * @param {string} params.Name
     * @param {Record<string, any>} [params.Data]
     * @param {string} [params.Id]
     * @internal
     */
    constructor(params) {
      this.Feature = params.Feature;
      this.SubFeatureName = params.SubFeatureName;
      this.Name = params.Name;
      this.Data = params.Data;
      this.Id = params.Id;
    }
    /**
     * Helper to convert a {@link RequestMessage} to a format that Windows can support
     * @param {RequestMessage} msg
     * @param {Record<string, any>} data
     * @returns {WindowsRequestMessage}
     */
    static fromRequest(msg, data2) {
      const output = {
        Data: data2,
        Feature: msg.context,
        SubFeatureName: msg.featureName,
        Name: msg.method,
        Id: msg.id
      };
      return output;
    }
  };

  // ../messaging/schema.js
  var RequestMessage = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {string} params.id
     * @param {Record<string, any>} [params.params]
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.method = params.method;
      this.id = params.id;
      this.params = params.params;
    }
  };
  var NotificationMessage = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {Record<string, any>} [params.params]
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.method = params.method;
      this.params = params.params;
    }
  };
  var Subscription = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.subscriptionName = params.subscriptionName;
    }
  };
  function isResponseFor(request, data2) {
    if ("result" in data2) {
      return data2.featureName === request.featureName && data2.context === request.context && data2.id === request.id;
    }
    if ("error" in data2) {
      if ("message" in data2.error) {
        return true;
      }
    }
    return false;
  }
  function isSubscriptionEventFor(sub2, data2) {
    if ("subscriptionName" in data2) {
      return data2.featureName === sub2.featureName && data2.context === sub2.context && data2.subscriptionName === sub2.subscriptionName;
    }
    return false;
  }

  // ../injected/src/captured-globals.js
  var Set2 = globalThis.Set;
  var Reflect2 = globalThis.Reflect;
  var customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
  var customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
  var objectDefineProperty = Object.defineProperty;
  var URL2 = globalThis.URL;
  var Proxy2 = globalThis.Proxy;
  var functionToString = Function.prototype.toString;
  var TypeError2 = globalThis.TypeError;
  var Symbol2 = globalThis.Symbol;
  var dispatchEvent = globalThis.dispatchEvent?.bind(globalThis);
  var performanceNow = globalThis.performance?.now?.bind(globalThis.performance) ?? Date.now;
  var addEventListener = globalThis.addEventListener?.bind(globalThis);
  var removeEventListener = globalThis.removeEventListener?.bind(globalThis);
  var CustomEvent2 = globalThis.CustomEvent;
  var Promise2 = globalThis.Promise;
  var String2 = globalThis.String;
  var Map2 = globalThis.Map;
  var Error2 = globalThis.Error;
  var randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  var console2 = globalThis.console;
  var consoleLog = console2.log.bind(console2);
  var consoleWarn = console2.warn.bind(console2);
  var consoleError = console2.error.bind(console2);
  var TextEncoder = globalThis.TextEncoder;
  var TextDecoder = globalThis.TextDecoder;
  var Uint8Array2 = globalThis.Uint8Array;
  var Uint16Array = globalThis.Uint16Array;
  var Uint32Array = globalThis.Uint32Array;
  var JSONparse = JSON.parse;
  var atob = globalThis.atob?.bind(globalThis);
  var DOMException2 = globalThis.DOMException;
  var charCodeAt = globalThis.String.prototype.charCodeAt;
  var ReflectDeleteProperty = Reflect2.deleteProperty.bind(Reflect2);
  var ReflectApply = Reflect2.apply.bind(Reflect2);
  var getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  var generateKey = globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle);
  var exportKey = globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle);
  var importKey = globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle);
  var encrypt = globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle);
  var decrypt = globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle);

  // ../injected/src/navigator-global.js
  function ensureNavigatorDuckDuckGo({ defineProperty = objectDefineProperty } = {}) {
    if (navigator.duckduckgo) {
      return navigator.duckduckgo;
    }
    const target2 = { messageHandlers: {} };
    defineProperty(Navigator.prototype, "duckduckgo", {
      value: target2,
      enumerable: true,
      configurable: false,
      writable: false
    });
    return target2;
  }

  // ../messaging/lib/webkit.js
  var WebkitMessagingTransport = class {
    /**
     * Null-prototype cache so a hostile page that pollutes `Object.prototype`
     * cannot supply a callable from there if `capture` ever misses a handler.
     *
     * Uses the `{ __proto__: null }` literal rather than `Object.create(null)`
     * because the latter is a method dispatch through `globalThis.Object`, which
     * page JS could replace before this class field runs if transport
     * construction is deferred (`Messaging` is lazy on `ContentFeature.messaging`).
     * The `__proto__: null` literal is a syntactic construct, not method
     * dispatch, so it always yields a true null-prototype object.
     * @type {Record<string, { handler: any, postMessage: Function }>}
     */
    capturedWebkitHandlers = (
      /** @type {any} */
      { __proto__: null }
    );
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
    }
    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @returns {*}
     * @throws {MissingHandler}
     * @internal
     */
    wkSend(handler, data2 = {}) {
      const captured = this.capturedWebkitHandlers[handler];
      if (!captured || typeof captured.postMessage !== "function") {
        throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
      }
      return ReflectApply(captured.postMessage, captured.handler, [data2]);
    }
    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data2) {
      const response = await this.wkSend(handler, data2);
      return JSONparse(response || "{}");
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     * @returns {Promise<void>}
     */
    async notify(msg) {
      await this.wkSend(msg.context, msg);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     */
    async request(msg) {
      const data2 = await this.wkSendAndWait(msg.context, msg);
      if (isResponseFor(msg, data2)) {
        if (data2.result) {
          return data2.result || {};
        }
        if (data2.error) {
          throw new Error2(data2.error.message);
        }
      }
      throw new Error2("an unknown error occurred");
    }
    /**
     * Capture the `postMessage` method on each webkit messageHandler so the
     * transport can call them later without re-reading `window.webkit.messageHandlers`.
     * Makes the transport resilient to later removal or replacement of
     * `window.webkit.messageHandlers` (e.g. by privacy hardening that nullifies
     * the namespace for site JS to reduce fingerprinting surface).
     *
     * Stores the handler object and its `postMessage` function as a pair so
     * `wkSend` can dispatch via the captured `ReflectApply` rather than calling
     * `.bind()` here. `.bind` is a method on the page-mutable
     * `Function.prototype` — if transport construction is deferred (`Messaging`
     * is lazy on `ContentFeature.messaging`) page JS could replace
     * `Function.prototype.bind` first and have the cache store an attacker-
     * controlled function. Storing the unbound pair sidesteps that.
     *
     * @param {string[]} handlerNames
     */
    captureWebkitHandlers(handlerNames) {
      const handlers = window.webkit.messageHandlers;
      if (!handlers) throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
      for (const webkitMessageHandlerName of handlerNames) {
        const handler = handlers[webkitMessageHandlerName];
        if (typeof handler?.postMessage === "function") {
          this.capturedWebkitHandlers[webkitMessageHandlerName] = {
            handler,
            postMessage: handler.postMessage
          };
        }
      }
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
      const target2 = ensureNavigatorDuckDuckGo().messageHandlers;
      if (msg.subscriptionName in target2) {
        throw new Error2(`A subscription with the name ${msg.subscriptionName} already exists`);
      }
      objectDefineProperty(target2, msg.subscriptionName, {
        enumerable: false,
        configurable: true,
        writable: false,
        value: (data2) => {
          if (data2 && isSubscriptionEventFor(msg, data2)) {
            callback(data2.params);
          } else {
            console.warn("Received a message that did not match the subscription", data2);
          }
        }
      });
      return () => {
        ReflectDeleteProperty(target2, msg.subscriptionName);
      };
    }
  };
  var WebkitMessagingConfig = class {
    /**
     * @param {object} params
     * @param {string[]} params.webkitMessageHandlerNames
     * @internal
     */
    constructor(params) {
      this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
    }
  };

  // ../messaging/lib/android.js
  var AndroidMessagingTransport = class {
    /**
     * @param {AndroidMessagingConfig} config
     * @param {MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
    }
    /**
     * @param {NotificationMessage} msg
     */
    notify(msg) {
      try {
        this.config.sendMessageThrows?.(JSON.stringify(msg));
      } catch (e3) {
        console.error(".notify failed", e3);
      }
    }
    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request(msg) {
      return new Promise((resolve, reject) => {
        const unsub = this.config.subscribe(msg.id, handler);
        try {
          this.config.sendMessageThrows?.(JSON.stringify(msg));
        } catch (e3) {
          unsub();
          reject(new Error("request failed to send: " + e3.message || "unknown error"));
        }
        function handler(data2) {
          if (isResponseFor(msg, data2)) {
            if (data2.result) {
              resolve(data2.result || {});
              return unsub();
            }
            if (data2.error) {
              reject(new Error(data2.error.message));
              return unsub();
            }
            unsub();
            throw new Error("unreachable: must have `result` or `error` key by this point");
          }
        }
      });
    }
    /**
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
      const unsub = this.config.subscribe(msg.subscriptionName, (data2) => {
        if (isSubscriptionEventFor(msg, data2)) {
          callback(data2.params || {});
        }
      });
      return () => {
        unsub();
      };
    }
  };
  var AndroidMessagingConfig = class {
    /** @type {(json: string, secret: string) => void} */
    _capturedHandler;
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.messageSecret - a secret to ensure that messages are only
     * processed by the correct handler
     * @param {string} params.javascriptInterface - the name of the javascript interface
     * registered on the native side
     * @param {string} params.messageCallback - the name of the callback that the native
     * side will use to send messages back to the javascript side
     */
    constructor(params) {
      this.target = params.target;
      this.debug = params.debug;
      this.javascriptInterface = params.javascriptInterface;
      this.messageSecret = params.messageSecret;
      this.messageCallback = params.messageCallback;
      this.listeners = new globalThis.Map();
      this._captureGlobalHandler();
      this._assignHandlerMethod();
    }
    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: string) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(json) {
      this._capturedHandler(json, this.messageSecret);
    }
    /**
     * A subscription on Android is just a named listener. All messages from
     * android -> are delivered through a single function, and this mapping is used
     * to route the messages to the correct listener.
     *
     * Note: Use this to implement request->response by unsubscribing after the first
     * response.
     *
     * @param {string} id
     * @param {(msg: MessageResponse | SubscriptionEvent) => void} callback
     * @returns {() => void}
     * @internal
     */
    subscribe(id, callback) {
      this.listeners.set(id, callback);
      return () => {
        this.listeners.delete(id);
      };
    }
    /**
     * Accept incoming messages and try to deliver it to a registered listener.
     *
     * This code is defensive to prevent any single handler from affecting another if
     * it throws (producer interference).
     *
     * @param {MessageResponse | SubscriptionEvent} payload
     * @internal
     */
    _dispatch(payload) {
      if (!payload) return this._log("no response");
      if ("id" in payload) {
        if (this.listeners.has(payload.id)) {
          this._tryCatch(() => this.listeners.get(payload.id)?.(payload));
        } else {
          this._log("no listeners for ", payload);
        }
      }
      if ("subscriptionName" in payload) {
        if (this.listeners.has(payload.subscriptionName)) {
          this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload));
        } else {
          this._log("no subscription listeners for ", payload);
        }
      }
    }
    /**
     *
     * @param {(...args: any[]) => any} fn
     * @param {string} [context]
     */
    _tryCatch(fn, context = "none") {
      try {
        return fn();
      } catch (e3) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e3);
        }
      }
    }
    /**
     * @param {...any} args
     */
    _log(...args) {
      if (this.debug) {
        console.log("AndroidMessagingConfig", ...args);
      }
    }
    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
      const { target: target2, javascriptInterface } = this;
      if (Object.prototype.hasOwnProperty.call(target2, javascriptInterface)) {
        this._capturedHandler = target2[javascriptInterface].process.bind(target2[javascriptInterface]);
        delete target2[javascriptInterface];
      } else {
        this._capturedHandler = () => {
          this._log("Android messaging interface not available", javascriptInterface);
        };
      }
    }
    /**
     * Assign the incoming handler method to the global object.
     * This is the method that Android will call to deliver messages.
     */
    _assignHandlerMethod() {
      const responseHandler = (providedSecret, response) => {
        if (providedSecret === this.messageSecret) {
          this._dispatch(response);
        }
      };
      Object.defineProperty(this.target, this.messageCallback, {
        value: responseHandler
      });
    }
  };

  // ../injected/src/utils.js
  var globalObj = typeof window === "undefined" ? globalThis : window;
  var Error3 = globalObj.Error;
  var originalWindowDispatchEvent = typeof window === "undefined" ? null : window.dispatchEvent.bind(window);
  function isBeingFramed() {
    if (globalThis.location && "ancestorOrigins" in globalThis.location) {
      return globalThis.location.ancestorOrigins.length > 0;
    }
    return globalThis.top !== globalThis.window;
  }
  var DDGPromise = globalObj.Promise;
  var DDGReflect = globalObj.Reflect;

  // ../messaging/lib/android-adsjs.js
  var AndroidAdsjsMessagingTransport = class {
    /**
     * @param {AndroidAdsjsMessagingConfig} config
     * @param {MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
    }
    /**
     * @param {NotificationMessage} msg
     */
    notify(msg) {
      try {
        this.config.sendMessageThrows?.(msg);
      } catch (e3) {
        console.error(".notify failed", e3);
      }
    }
    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request(msg) {
      return new Promise((resolve, reject) => {
        const unsub = this.config.subscribe(msg.id, handler);
        try {
          this.config.sendMessageThrows?.(msg);
        } catch (e3) {
          unsub();
          reject(new Error("request failed to send: " + e3.message || "unknown error"));
        }
        function handler(data2) {
          if (isResponseFor(msg, data2)) {
            if (data2.result) {
              resolve(data2.result || {});
              return unsub();
            }
            if (data2.error) {
              reject(new Error(data2.error.message));
              return unsub();
            }
            unsub();
            throw new Error("unreachable: must have `result` or `error` key by this point");
          }
        }
      });
    }
    /**
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
      const unsub = this.config.subscribe(msg.subscriptionName, (data2) => {
        if (isSubscriptionEventFor(msg, data2)) {
          callback(data2.params || {});
        }
      });
      return () => {
        unsub();
      };
    }
  };
  var AndroidAdsjsMessagingConfig = class {
    /** @type {{
     * postMessage: (message: string) => void,
     * addEventListener: (type: string, listener: (event: MessageEvent) => void) => void,
     * } | null} */
    _capturedHandler;
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.objectName - the object name for addWebMessageListener
     */
    constructor(params) {
      this.target = params.target;
      this.debug = params.debug;
      this.objectName = params.objectName;
      this.listeners = new globalThis.Map();
      this._captureGlobalHandler();
      this._setupEventListener();
    }
    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler via postMessage.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: object) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(message) {
      if (!this.objectName) {
        throw new Error("Object name not set for WebMessageListener");
      }
      if (this._capturedHandler && this._capturedHandler.postMessage) {
        this._capturedHandler.postMessage(JSON.stringify(message));
      } else {
        throw new Error("postMessage not available");
      }
    }
    /**
     * A subscription on Android is just a named listener. All messages from
     * android -> are delivered through a single function, and this mapping is used
     * to route the messages to the correct listener.
     *
     * Note: Use this to implement request->response by unsubscribing after the first
     * response.
     *
     * @param {string} id
     * @param {(msg: MessageResponse | SubscriptionEvent) => void} callback
     * @returns {() => void}
     * @internal
     */
    subscribe(id, callback) {
      this.listeners.set(id, callback);
      return () => {
        this.listeners.delete(id);
      };
    }
    /**
     * Accept incoming messages and try to deliver it to a registered listener.
     *
     * This code is defensive to prevent any single handler from affecting another if
     * it throws (producer interference).
     *
     * @param {MessageResponse | SubscriptionEvent} payload
     * @internal
     */
    _dispatch(payload) {
      if (!payload) return this._log("no response");
      if ("id" in payload) {
        if (this.listeners.has(payload.id)) {
          this._tryCatch(() => this.listeners.get(payload.id)?.(payload));
        } else {
          this._log("no listeners for ", payload);
        }
      }
      if ("subscriptionName" in payload) {
        if (this.listeners.has(payload.subscriptionName)) {
          this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload));
        } else {
          this._log("no subscription listeners for ", payload);
        }
      }
    }
    /**
     *
     * @param {(...args: any[]) => any} fn
     * @param {string} [context]
     */
    _tryCatch(fn, context = "none") {
      try {
        return fn();
      } catch (e3) {
        if (this.debug) {
          console.error("AndroidAdsjsMessagingConfig error:", context);
          console.error(e3);
        }
      }
    }
    /**
     * @param {...any} args
     */
    _log(...args) {
      if (this.debug) {
        console.log("AndroidAdsjsMessagingConfig", ...args);
      }
    }
    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
      const { target: target2, objectName } = this;
      if (Object.prototype.hasOwnProperty.call(target2, objectName)) {
        this._capturedHandler = target2[objectName];
        delete target2[objectName];
      } else {
        this._capturedHandler = null;
        this._log("Android adsjs messaging interface not available", objectName);
      }
    }
    /**
     * Set up event listener for incoming messages from the captured handler.
     */
    _setupEventListener() {
      if (!this._capturedHandler || !this._capturedHandler.addEventListener) {
        this._log("No event listener support available");
        return;
      }
      this._capturedHandler.addEventListener("message", (event) => {
        try {
          const data2 = (
            /** @type {MessageEvent} */
            event.data
          );
          if (typeof data2 === "string") {
            const parsedData = JSON.parse(data2);
            this._dispatch(parsedData);
          }
        } catch (e3) {
          this._log("Error processing incoming message:", e3);
        }
      });
    }
    /**
     * Send an initial ping message to the platform to establish communication.
     * This is a fire-and-forget notification that signals the JavaScript side is ready.
     * Only sends in top context (not in frames) and if the messaging interface is available.
     *
     * @param {MessagingContext} messagingContext
     * @returns {boolean} true if ping was sent, false if in frame or interface not ready
     */
    sendInitialPing(messagingContext) {
      if (isBeingFramed()) {
        this._log("Skipping initial ping - running in frame context");
        return false;
      }
      try {
        const message = new RequestMessage({
          id: "initialPing",
          context: messagingContext.context,
          featureName: "messaging",
          method: "initialPing"
        });
        this.sendMessageThrows(message);
        this._log("Initial ping sent successfully");
        return true;
      } catch (e3) {
        this._log("Failed to send initial ping:", e3);
        return false;
      }
    }
  };

  // ../messaging/index.js
  var MessagingContext = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {"production" | "development"} params.env
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.env = params.env;
    }
  };
  var Messaging = class {
    /**
     * @param {MessagingContext} messagingContext
     * @param {MessagingConfig} config
     */
    constructor(messagingContext, config) {
      this.messagingContext = messagingContext;
      this.transport = getTransport(config, this.messagingContext);
    }
    /**
     * Send a 'fire-and-forget' message.
     *
     * @example
     *
     * ```ts
     * const messaging = new Messaging(config)
     * messaging.notify("foo", {bar: "baz"})
     * ```
     * @param {string} name
     * @param {Record<string, any>} [data]
     */
    notify(name2, data2 = {}) {
      try {
        const message = new NotificationMessage({
          context: this.messagingContext.context,
          featureName: this.messagingContext.featureName,
          method: name2,
          params: data2
        });
        const maybeAsyncResult = this.transport.notify(message);
        if (isPromiseLike(maybeAsyncResult)) {
          void handleAsyncNotificationResult(maybeAsyncResult, this.messagingContext.env, name2, data2);
        }
      } catch (e3) {
        logNotificationError(this.messagingContext.env, name2, data2, e3);
      }
    }
    /**
     * Send a request and wait for a response
     * @throws {Error}
     *
     * @example
     * ```
     * const messaging = new Messaging(config)
     * const response = await messaging.request("foo", {bar: "baz"})
     * ```
     *
     * @param {string} name
     * @param {Record<string, any>} [data]
     * @return {Promise<any>}
     */
    request(name2, data2 = {}) {
      const id = globalThis?.crypto?.randomUUID?.() || name2 + ".response";
      const message = new RequestMessage({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        method: name2,
        params: data2,
        id
      });
      return this.transport.request(message);
    }
    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    subscribe(name2, callback) {
      const msg = new Subscription({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        subscriptionName: name2
      });
      return this.transport.subscribe(msg, callback);
    }
  };
  var TestTransportConfig = class {
    /**
     * @param {MessagingTransport} impl
     */
    constructor(impl) {
      this.impl = impl;
    }
  };
  var TestTransport = class {
    /**
     * @param {TestTransportConfig} config
     * @param {MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      this.config = config;
      this.messagingContext = messagingContext;
    }
    notify(msg) {
      return this.config.impl.notify(msg);
    }
    request(msg) {
      return this.config.impl.request(msg);
    }
    subscribe(msg, callback) {
      return this.config.impl.subscribe(msg, callback);
    }
  };
  function getTransport(config, messagingContext) {
    if (config instanceof WebkitMessagingConfig) {
      return new WebkitMessagingTransport(config, messagingContext);
    }
    if (config instanceof WindowsMessagingConfig) {
      return new WindowsMessagingTransport(config, messagingContext);
    }
    if (config instanceof AndroidMessagingConfig) {
      return new AndroidMessagingTransport(config, messagingContext);
    }
    if (config instanceof AndroidAdsjsMessagingConfig) {
      return new AndroidAdsjsMessagingTransport(config, messagingContext);
    }
    if (config instanceof TestTransportConfig) {
      return new TestTransport(config, messagingContext);
    }
    throw new Error("unreachable");
  }
  function isPromiseLike(value2) {
    return value2 !== null && value2 !== void 0 && typeof /** @type {{then?: unknown}} */
    value2.then === "function";
  }
  async function handleAsyncNotificationResult(result, env, name2, data2) {
    try {
      await result;
    } catch (error) {
      logNotificationError(env, name2, data2, error);
    }
  }
  function logNotificationError(env, name2, data2, error) {
    if (env === "development") {
      try {
        console.error("[Messaging] Failed to send notification:", error);
        console.error("[Messaging] Message details:", { name: name2, data: data2 });
      } catch {
      }
    }
  }
  var MissingHandler = class extends Error {
    /**
     * @param {string} message
     * @param {string} handlerName
     */
    constructor(message, handlerName) {
      super(message);
      this.handlerName = handlerName;
    }
  };

  // shared/create-special-page-messaging.js
  function createSpecialPageMessaging(opts) {
    const messageContext = new MessagingContext({
      context: "specialPages",
      featureName: opts.pageName,
      env: opts.env
    });
    try {
      if (opts.injectName === "windows") {
        const opts2 = new WindowsMessagingConfig({
          methods: {
            // @ts-expect-error - not in @types/chrome
            postMessage: globalThis.windowsInteropPostMessage,
            // @ts-expect-error - not in @types/chrome
            addEventListener: globalThis.windowsInteropAddEventListener,
            // @ts-expect-error - not in @types/chrome
            removeEventListener: globalThis.windowsInteropRemoveEventListener
          }
        });
        return new Messaging(messageContext, opts2);
      } else if (opts.injectName === "apple") {
        const opts2 = new WebkitMessagingConfig({
          webkitMessageHandlerNames: ["specialPages"]
        });
        return new Messaging(messageContext, opts2);
      } else if (opts.injectName === "android") {
        const opts2 = new AndroidMessagingConfig({
          messageSecret: "duckduckgo-android-messaging-secret",
          messageCallback: "messageCallback",
          javascriptInterface: messageContext.context,
          target: globalThis,
          debug: true
        });
        return new Messaging(messageContext, opts2);
      }
    } catch (e3) {
      console.error("could not access handlers for %s, falling back to mock interface", opts.injectName);
    }
    const fallback = opts.mockTransport?.() || new TestTransportConfig({
      /**
       * @param {import('@duckduckgo/messaging').NotificationMessage} msg
       */
      notify(msg) {
        console.log(msg);
      },
      /**
       * @param {import('@duckduckgo/messaging').RequestMessage} msg
       */
      request: (msg) => {
        console.log(msg);
        if (msg.method === "initialSetup") {
          return Promise.resolve({
            locale: "en",
            env: opts.env
          });
        }
        return Promise.resolve(null);
      },
      /**
       * @param {import('@duckduckgo/messaging').SubscriptionEvent} msg
       */
      subscribe(msg) {
        console.log(msg);
        return () => {
          console.log("teardown");
        };
      }
    });
    return new Messaging(messageContext, fallback);
  }

  // pages/onboarding/app/settings.js
  var Settings = class _Settings {
    /**
     * @param {object} params
     * @param {{name: 'macos' | 'windows'}} [params.platform]
     * @param {import('./types.js').Step['id'][]} [params.order] - determine the order of screens
     * @param {import('./types.js').Step['id'][]} [params.exclude] - a list of screens to exclude
     * @param {import('./types.js').Step['id']} [params.first] - choose which screen to start on
     * @param {import('./types.js').StepDefinitions} [params.stepDefinitions] - individual data for each step, eg: which rows to show
     * @param {'title'|null} [params.typingEffect] - typing effect variant for titles
     */
    constructor({
      platform = { name: "macos" },
      order = ORDER_V4,
      stepDefinitions: stepDefinitions2 = stepDefinitions,
      first = "welcome",
      exclude = [],
      typingEffect = "title"
    } = {}) {
      this.platform = platform;
      this.order = order;
      this.stepDefinitions = stepDefinitions2;
      this.first = first;
      this.exclude = exclude;
      this.typingEffect = typingEffect;
    }
    withPlatformName(name2) {
      const valid = ["windows", "macos", "ios", "android"];
      if (valid.includes(
        /** @type {any} */
        name2
      )) {
        return new _Settings({
          ...this,
          platform: { name: name2 }
        });
      }
      return this;
    }
    /**
     * @param {string[]|null|undefined} order
     * @return {Settings}
     */
    withOrder(order) {
      if (!order) return this;
      if (Array.isArray(order) && order.length === 0) return this;
      const valid = order.filter((item) => EVERY_PAGE_ID.includes(
        /** @type {any} */
        item
      ));
      const invalid = order.filter((item) => !EVERY_PAGE_ID.includes(
        /** @type {any} */
        item
      ));
      if (invalid.length > 0) {
        console.error("ignoring screen order because of invalid entries:", invalid);
      } else {
        return new _Settings({
          order: (
            /** @type {any} */
            valid
          ),
          stepDefinitions: this.stepDefinitions
        });
      }
      return this;
    }
    /**
     * @param {string[]|null|undefined} exclude
     */
    withExcludedScreens(exclude) {
      if (!exclude) return this;
      if (!Array.isArray(exclude) || exclude.length === 0) return this;
      if (!exclude.every((screen) => (
        /** @type {string[]} */
        this.order.includes(screen)
      ))) return this;
      return new _Settings({
        ...this,
        exclude,
        order: this.order.filter((screen) => !exclude.includes(screen))
      });
    }
    /**
     * @param {string|undefined|null} first
     * @return {Settings}
     */
    withFirst(first) {
      if (!first) return this;
      if (
        /** @type {string[]} */
        this.order.includes(first)
      ) {
        return new _Settings({
          ...this,
          first
        });
      }
      return this;
    }
    /**
     * @param {string|null|undefined} typingEffect
     * @return {Settings}
     */
    withTypingEffect(typingEffect) {
      if (typingEffect === "none") return new _Settings({ ...this, typingEffect: null });
      if (typingEffect === "title") return new _Settings({ ...this, typingEffect: "title" });
      return this;
    }
    /**
     * @param {import('./types.js').StepDefinitions | Record<string, any> | null | undefined} stepDefinitions
     * @return {Settings}
     */
    withStepDefinitions(stepDefinitions2) {
      if (!stepDefinitions2) return this;
      if (!Object.keys(stepDefinitions2)?.length) return this;
      const nextSteps = { ...this.stepDefinitions };
      for (const [key2, value2] of Object.entries(stepDefinitions2 || {})) {
        if (!this.order.includes(
          /** @type {any} */
          key2
        )) {
          continue;
        }
        console.log("KV", key2, value2);
        nextSteps[key2] = { ...nextSteps[key2], ...value2 };
      }
      return new _Settings({
        ...this,
        stepDefinitions: nextSteps
      });
    }
  };

  // shared/call-with-retry.js
  async function callWithRetry(fn, params = {}) {
    const { maxAttempts = 10, intervalMs = 300 } = params;
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return { value: await fn(), attempt };
      } catch (error) {
        if (attempt === maxAttempts) {
          return { error: `Max attempts reached: ${error}` };
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        attempt++;
      }
    }
    return { error: "Unreachable: value not retrieved" };
  }

  // pages/onboarding/src/mock-transport.js
  var url = new URL(window.location.href);
  function mockTransport() {
    if (typeof window !== "undefined" && window.__playwright_01) {
      window.__playwright_01.publishSubscriptionEvent = (evt) => {
        window.__playwright_01?.subscriptions?.get(evt.subscriptionName)?.forEach((cb) => cb(evt.params));
      };
    }
    return new TestTransportConfig({
      notify(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          default: {
            console.warn("unhandled notification", msg);
          }
        }
      },
      request(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          case "init": {
            const stepDefinitions2 = {};
            const adBlocking = url.searchParams.get("adBlocking");
            if (adBlocking === "placebo" || adBlocking === "aggressive" || adBlocking === "youtube") {
              stepDefinitions2.systemSettings = {
                id: "systemSettings",
                kind: "settings",
                rows: ["dock", "import", `${adBlocking}-ad-blocking`]
              };
            }
            const dockVariant = url.searchParams.get("dock");
            if (dockVariant === "instructions") {
              const existing = stepDefinitions2.systemSettings;
              const rows = existing ? [...existing.rows] : ["dock", "import"];
              const dockIndex = rows.indexOf("dock");
              if (dockIndex !== -1) {
                rows[dockIndex] = "dock-instructions";
              }
              stepDefinitions2.systemSettings = {
                id: "systemSettings",
                kind: "settings",
                rows
              };
            }
            const chromeExtension = url.searchParams.get("chromeExtension");
            if (chromeExtension === "true") {
              stepDefinitions2.getStarted = {
                id: "getStarted",
                kind: "info",
                options: ["chrome-extension-install"]
              };
            }
            const duckPlayerVariant = url.searchParams.get("duckPlayer");
            if (duckPlayerVariant === "ad-free") {
              stepDefinitions2.duckPlayerSingle = {
                id: "duckPlayerSingle",
                kind: "info",
                variant: "ad-free"
              };
            }
            return Promise.resolve({
              stepDefinitions: stepDefinitions2,
              exclude: [],
              locale: "en",
              env: "development"
            });
          }
          case "requestImport":
          case "requestSetAsDefault":
          case "requestDockOptIn": {
            return Promise.resolve({
              enabled: true
            });
          }
          default:
            return Promise.resolve(null);
        }
      },
      subscribe(_msg, callback) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        if (!window.__playwright_01) {
          return () => {
          };
        }
        const msg = (
          /** @type {{ method?: string; subscriptionName?: string }} */
          _msg
        );
        const name2 = typeof _msg === "string" ? _msg : msg.subscriptionName ?? msg.method ?? "onConfigUpdate";
        if (!window.__playwright_01.subscriptions) {
          window.__playwright_01.subscriptions = /* @__PURE__ */ new Map();
        }
        if (!window.__playwright_01.subscriptions.has(name2)) {
          window.__playwright_01.subscriptions.set(name2, /* @__PURE__ */ new Set());
        }
        window.__playwright_01.subscriptions.get(name2)?.add(callback);
        return () => {
          window.__playwright_01?.subscriptions?.get(name2)?.delete(callback);
        };
      }
    });
  }

  // pages/onboarding/app/index.js
  var baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv("production");
  var messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: "onboarding",
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration") return null;
      let mock = null;
      mock = mockTransport();
      return mock;
    }
  });
  var onboarding = new OnboardingMessages(messaging, baseEnvironment.injectName);
  window.addEventListener("error", (event) => {
    let message = "unknown error";
    if (event.error?.message) {
      message = event.error.message;
    } else if (event.error) {
      message = String(event.error);
    } else if (event.message) {
      message = event.message;
    }
    onboarding.reportInitException({ message: `[uncaught] ${message}` });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason);
    onboarding.reportInitException({ message: `[unhandledrejection] ${message}` });
  });
  async function init() {
    const result = await callWithRetry(() => onboarding.init());
    if ("error" in result) {
      throw new Error(result.error);
    }
    const init2 = result.value;
    const environment = baseEnvironment.withEnv(init2.env).withLocale(init2.locale).withLocale(baseEnvironment.urlParams.get("locale")).withTextLength(baseEnvironment.urlParams.get("textLength")).withDisplay(baseEnvironment.urlParams.get("display"));
    const strings = environment.locale === "en" ? onboarding_default : await fetch(`./locales/${environment.locale}/onboarding.json`).then((x3) => x3.json()).catch((e3) => {
      console.error("Could not load locale", environment.locale, e3);
      return onboarding_default;
    });
    const settings = new Settings().withPlatformName(baseEnvironment.injectName).withPlatformName(init2.platform?.name).withPlatformName(baseEnvironment.urlParams.get("platform")).withStepDefinitions(init2.stepDefinitions).withExcludedScreens(init2.exclude).withExcludedScreens(environment.urlParams.getAll("exclude")).withFirst(environment.urlParams.get("page")).withTypingEffect(environment.urlParams.get("typingEffect"));
    const root2 = document.querySelector("#app");
    if (!root2) throw new Error("could not render, root element missing");
    if (environment.display === "app") {
      R(
        /* @__PURE__ */ k(EnvironmentProvider, { debugState: environment.debugState, injectName: environment.injectName, willThrow: environment.willThrow }, /* @__PURE__ */ k(UpdateEnvironment, { search: window.location.search }), /* @__PURE__ */ k(TranslationProvider, { translationObject: strings, fallback: onboarding_default, textLength: environment.textLength }, /* @__PURE__ */ k(SettingsProvider, { platform: settings.platform, typingEffect: settings.typingEffect }, /* @__PURE__ */ k(
          GlobalProvider,
          {
            messaging: onboarding,
            order: settings.order,
            stepDefinitions: settings.stepDefinitions,
            firstPage: settings.first
          },
          /* @__PURE__ */ k(App, null, environment.env === "development" && /* @__PURE__ */ k(SkipLink, null))
        )))),
        root2
      );
    }
  }
  init().catch((e3) => {
    console.error(e3);
    const msg = typeof e3?.message === "string" ? e3.message : "unknown init error";
    onboarding.reportInitException({ message: msg });
  });
})();
/*! Bundled license information:

classnames/index.js:
  (*!
  	Copyright (c) 2018 Jed Watson.
  	Licensed under the MIT License (MIT), see
  	http://jedwatson.github.io/classnames
  *)

lottie-web/build/player/lottie.js:
  (*!
   Transformation Matrix v2.0
   (c) Epistemex 2014-2015
   www.epistemex.com
   By Ken Fyrstenberg
   Contributions by leeoniya.
   License: MIT, header required.
   *)
*/
