"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn) return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../node_modules/preact/dist/preact.module.js
  function d(n3, l5) {
    for (var u4 in l5) n3[u4] = l5[u4];
    return n3;
  }
  function w(n3) {
    n3 && n3.parentNode && n3.parentNode.removeChild(n3);
  }
  function _(l5, u4, t4) {
    var i5, o4, r4, f4 = {};
    for (r4 in u4) "key" == r4 ? i5 = u4[r4] : "ref" == r4 ? o4 = u4[r4] : f4[r4] = u4[r4];
    if (arguments.length > 2 && (f4.children = arguments.length > 3 ? n.call(arguments, 2) : t4), "function" == typeof l5 && null != l5.defaultProps) for (r4 in l5.defaultProps) void 0 === f4[r4] && (f4[r4] = l5.defaultProps[r4]);
    return g(l5, f4, i5, o4, null);
  }
  function g(n3, t4, i5, o4, r4) {
    var f4 = { type: n3, props: t4, key: i5, ref: o4, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r4 ? ++u : r4, __i: -1, __u: 0 };
    return null == r4 && null != l.vnode && l.vnode(f4), f4;
  }
  function b(n3) {
    return n3.children;
  }
  function k(n3, l5) {
    this.props = n3, this.context = l5;
  }
  function x(n3, l5) {
    if (null == l5) return n3.__ ? x(n3.__, n3.__i + 1) : null;
    for (var u4; l5 < n3.__k.length; l5++) if (null != (u4 = n3.__k[l5]) && null != u4.__e) return u4.__e;
    return "function" == typeof n3.type ? x(n3) : null;
  }
  function C(n3) {
    var l5, u4;
    if (null != (n3 = n3.__) && null != n3.__c) {
      for (n3.__e = n3.__c.base = null, l5 = 0; l5 < n3.__k.length; l5++) if (null != (u4 = n3.__k[l5]) && null != u4.__e) {
        n3.__e = n3.__c.base = u4.__e;
        break;
      }
      return C(n3);
    }
  }
  function S(n3) {
    (!n3.__d && (n3.__d = true) && i.push(n3) && !M.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(M);
  }
  function M() {
    var n3, u4, t4, o4, r4, e4, c4, s5;
    for (i.sort(f); n3 = i.shift(); ) n3.__d && (u4 = i.length, o4 = void 0, e4 = (r4 = (t4 = n3).__v).__e, c4 = [], s5 = [], t4.__P && ((o4 = d({}, r4)).__v = r4.__v + 1, l.vnode && l.vnode(o4), O(t4.__P, o4, r4, t4.__n, t4.__P.namespaceURI, 32 & r4.__u ? [e4] : null, c4, null == e4 ? x(r4) : e4, !!(32 & r4.__u), s5), o4.__v = r4.__v, o4.__.__k[o4.__i] = o4, j(c4, o4, s5), o4.__e != e4 && C(o4)), i.length > u4 && i.sort(f));
    M.__r = 0;
  }
  function P(n3, l5, u4, t4, i5, o4, r4, f4, e4, c4, s5) {
    var a4, p5, y4, d5, w4, _5 = t4 && t4.__k || v, g5 = l5.length;
    for (u4.__d = e4, $(u4, l5, _5), e4 = u4.__d, a4 = 0; a4 < g5; a4++) null != (y4 = u4.__k[a4]) && (p5 = -1 === y4.__i ? h : _5[y4.__i] || h, y4.__i = a4, O(n3, y4, p5, i5, o4, r4, f4, e4, c4, s5), d5 = y4.__e, y4.ref && p5.ref != y4.ref && (p5.ref && N(p5.ref, null, y4), s5.push(y4.ref, y4.__c || d5, y4)), null == w4 && null != d5 && (w4 = d5), 65536 & y4.__u || p5.__k === y4.__k ? e4 = I(y4, e4, n3) : "function" == typeof y4.type && void 0 !== y4.__d ? e4 = y4.__d : d5 && (e4 = d5.nextSibling), y4.__d = void 0, y4.__u &= -196609);
    u4.__d = e4, u4.__e = w4;
  }
  function $(n3, l5, u4) {
    var t4, i5, o4, r4, f4, e4 = l5.length, c4 = u4.length, s5 = c4, a4 = 0;
    for (n3.__k = [], t4 = 0; t4 < e4; t4++) null != (i5 = l5[t4]) && "boolean" != typeof i5 && "function" != typeof i5 ? (r4 = t4 + a4, (i5 = n3.__k[t4] = "string" == typeof i5 || "number" == typeof i5 || "bigint" == typeof i5 || i5.constructor == String ? g(null, i5, null, null, null) : y(i5) ? g(b, { children: i5 }, null, null, null) : void 0 === i5.constructor && i5.__b > 0 ? g(i5.type, i5.props, i5.key, i5.ref ? i5.ref : null, i5.__v) : i5).__ = n3, i5.__b = n3.__b + 1, o4 = null, -1 !== (f4 = i5.__i = L(i5, u4, r4, s5)) && (s5--, (o4 = u4[f4]) && (o4.__u |= 131072)), null == o4 || null === o4.__v ? (-1 == f4 && a4--, "function" != typeof i5.type && (i5.__u |= 65536)) : f4 !== r4 && (f4 == r4 - 1 ? a4-- : f4 == r4 + 1 ? a4++ : (f4 > r4 ? a4-- : a4++, i5.__u |= 65536))) : i5 = n3.__k[t4] = null;
    if (s5) for (t4 = 0; t4 < c4; t4++) null != (o4 = u4[t4]) && 0 == (131072 & o4.__u) && (o4.__e == n3.__d && (n3.__d = x(o4)), V(o4, o4));
  }
  function I(n3, l5, u4) {
    var t4, i5;
    if ("function" == typeof n3.type) {
      for (t4 = n3.__k, i5 = 0; t4 && i5 < t4.length; i5++) t4[i5] && (t4[i5].__ = n3, l5 = I(t4[i5], l5, u4));
      return l5;
    }
    n3.__e != l5 && (l5 && n3.type && !u4.contains(l5) && (l5 = x(n3)), u4.insertBefore(n3.__e, l5 || null), l5 = n3.__e);
    do {
      l5 = l5 && l5.nextSibling;
    } while (null != l5 && 8 === l5.nodeType);
    return l5;
  }
  function H(n3, l5) {
    return l5 = l5 || [], null == n3 || "boolean" == typeof n3 || (y(n3) ? n3.some(function(n4) {
      H(n4, l5);
    }) : l5.push(n3)), l5;
  }
  function L(n3, l5, u4, t4) {
    var i5 = n3.key, o4 = n3.type, r4 = u4 - 1, f4 = u4 + 1, e4 = l5[u4];
    if (null === e4 || e4 && i5 == e4.key && o4 === e4.type && 0 == (131072 & e4.__u)) return u4;
    if (t4 > (null != e4 && 0 == (131072 & e4.__u) ? 1 : 0)) for (; r4 >= 0 || f4 < l5.length; ) {
      if (r4 >= 0) {
        if ((e4 = l5[r4]) && 0 == (131072 & e4.__u) && i5 == e4.key && o4 === e4.type) return r4;
        r4--;
      }
      if (f4 < l5.length) {
        if ((e4 = l5[f4]) && 0 == (131072 & e4.__u) && i5 == e4.key && o4 === e4.type) return f4;
        f4++;
      }
    }
    return -1;
  }
  function T(n3, l5, u4) {
    "-" === l5[0] ? n3.setProperty(l5, null == u4 ? "" : u4) : n3[l5] = null == u4 ? "" : "number" != typeof u4 || p.test(l5) ? u4 : u4 + "px";
  }
  function A(n3, l5, u4, t4, i5) {
    var o4;
    n: if ("style" === l5) if ("string" == typeof u4) n3.style.cssText = u4;
    else {
      if ("string" == typeof t4 && (n3.style.cssText = t4 = ""), t4) for (l5 in t4) u4 && l5 in u4 || T(n3.style, l5, "");
      if (u4) for (l5 in u4) t4 && u4[l5] === t4[l5] || T(n3.style, l5, u4[l5]);
    }
    else if ("o" === l5[0] && "n" === l5[1]) o4 = l5 !== (l5 = l5.replace(/(PointerCapture)$|Capture$/i, "$1")), l5 = l5.toLowerCase() in n3 || "onFocusOut" === l5 || "onFocusIn" === l5 ? l5.toLowerCase().slice(2) : l5.slice(2), n3.l || (n3.l = {}), n3.l[l5 + o4] = u4, u4 ? t4 ? u4.u = t4.u : (u4.u = e, n3.addEventListener(l5, o4 ? s : c, o4)) : n3.removeEventListener(l5, o4 ? s : c, o4);
    else {
      if ("http://www.w3.org/2000/svg" == i5) l5 = l5.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l5 && "height" != l5 && "href" != l5 && "list" != l5 && "form" != l5 && "tabIndex" != l5 && "download" != l5 && "rowSpan" != l5 && "colSpan" != l5 && "role" != l5 && "popover" != l5 && l5 in n3) try {
        n3[l5] = null == u4 ? "" : u4;
        break n;
      } catch (n4) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" !== l5[4] ? n3.removeAttribute(l5) : n3.setAttribute(l5, "popover" == l5 && 1 == u4 ? "" : u4));
    }
  }
  function F(n3) {
    return function(u4) {
      if (this.l) {
        var t4 = this.l[u4.type + n3];
        if (null == u4.t) u4.t = e++;
        else if (u4.t < t4.u) return;
        return t4(l.event ? l.event(u4) : u4);
      }
    };
  }
  function O(n3, u4, t4, i5, o4, r4, f4, e4, c4, s5) {
    var a4, h4, v5, p5, w4, _5, g5, m3, x4, C4, S2, M3, $2, I2, H3, L3, T4 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t4.__u && (c4 = !!(32 & t4.__u), r4 = [e4 = u4.__e = t4.__e]), (a4 = l.__b) && a4(u4);
    n: if ("function" == typeof T4) try {
      if (m3 = u4.props, x4 = "prototype" in T4 && T4.prototype.render, C4 = (a4 = T4.contextType) && i5[a4.__c], S2 = a4 ? C4 ? C4.props.value : a4.__ : i5, t4.__c ? g5 = (h4 = u4.__c = t4.__c).__ = h4.__E : (x4 ? u4.__c = h4 = new T4(m3, S2) : (u4.__c = h4 = new k(m3, S2), h4.constructor = T4, h4.render = q), C4 && C4.sub(h4), h4.props = m3, h4.state || (h4.state = {}), h4.context = S2, h4.__n = i5, v5 = h4.__d = true, h4.__h = [], h4._sb = []), x4 && null == h4.__s && (h4.__s = h4.state), x4 && null != T4.getDerivedStateFromProps && (h4.__s == h4.state && (h4.__s = d({}, h4.__s)), d(h4.__s, T4.getDerivedStateFromProps(m3, h4.__s))), p5 = h4.props, w4 = h4.state, h4.__v = u4, v5) x4 && null == T4.getDerivedStateFromProps && null != h4.componentWillMount && h4.componentWillMount(), x4 && null != h4.componentDidMount && h4.__h.push(h4.componentDidMount);
      else {
        if (x4 && null == T4.getDerivedStateFromProps && m3 !== p5 && null != h4.componentWillReceiveProps && h4.componentWillReceiveProps(m3, S2), !h4.__e && (null != h4.shouldComponentUpdate && false === h4.shouldComponentUpdate(m3, h4.__s, S2) || u4.__v === t4.__v)) {
          for (u4.__v !== t4.__v && (h4.props = m3, h4.state = h4.__s, h4.__d = false), u4.__e = t4.__e, u4.__k = t4.__k, u4.__k.some(function(n4) {
            n4 && (n4.__ = u4);
          }), M3 = 0; M3 < h4._sb.length; M3++) h4.__h.push(h4._sb[M3]);
          h4._sb = [], h4.__h.length && f4.push(h4);
          break n;
        }
        null != h4.componentWillUpdate && h4.componentWillUpdate(m3, h4.__s, S2), x4 && null != h4.componentDidUpdate && h4.__h.push(function() {
          h4.componentDidUpdate(p5, w4, _5);
        });
      }
      if (h4.context = S2, h4.props = m3, h4.__P = n3, h4.__e = false, $2 = l.__r, I2 = 0, x4) {
        for (h4.state = h4.__s, h4.__d = false, $2 && $2(u4), a4 = h4.render(h4.props, h4.state, h4.context), H3 = 0; H3 < h4._sb.length; H3++) h4.__h.push(h4._sb[H3]);
        h4._sb = [];
      } else do {
        h4.__d = false, $2 && $2(u4), a4 = h4.render(h4.props, h4.state, h4.context), h4.state = h4.__s;
      } while (h4.__d && ++I2 < 25);
      h4.state = h4.__s, null != h4.getChildContext && (i5 = d(d({}, i5), h4.getChildContext())), x4 && !v5 && null != h4.getSnapshotBeforeUpdate && (_5 = h4.getSnapshotBeforeUpdate(p5, w4)), P(n3, y(L3 = null != a4 && a4.type === b && null == a4.key ? a4.props.children : a4) ? L3 : [L3], u4, t4, i5, o4, r4, f4, e4, c4, s5), h4.base = u4.__e, u4.__u &= -161, h4.__h.length && f4.push(h4), g5 && (h4.__E = h4.__ = null);
    } catch (n4) {
      if (u4.__v = null, c4 || null != r4) {
        for (u4.__u |= c4 ? 160 : 128; e4 && 8 === e4.nodeType && e4.nextSibling; ) e4 = e4.nextSibling;
        r4[r4.indexOf(e4)] = null, u4.__e = e4;
      } else u4.__e = t4.__e, u4.__k = t4.__k;
      l.__e(n4, u4, t4);
    }
    else null == r4 && u4.__v === t4.__v ? (u4.__k = t4.__k, u4.__e = t4.__e) : u4.__e = z(t4.__e, u4, t4, i5, o4, r4, f4, c4, s5);
    (a4 = l.diffed) && a4(u4);
  }
  function j(n3, u4, t4) {
    u4.__d = void 0;
    for (var i5 = 0; i5 < t4.length; i5++) N(t4[i5], t4[++i5], t4[++i5]);
    l.__c && l.__c(u4, n3), n3.some(function(u5) {
      try {
        n3 = u5.__h, u5.__h = [], n3.some(function(n4) {
          n4.call(u5);
        });
      } catch (n4) {
        l.__e(n4, u5.__v);
      }
    });
  }
  function z(u4, t4, i5, o4, r4, f4, e4, c4, s5) {
    var a4, v5, p5, d5, _5, g5, m3, b3 = i5.props, k3 = t4.props, C4 = t4.type;
    if ("svg" === C4 ? r4 = "http://www.w3.org/2000/svg" : "math" === C4 ? r4 = "http://www.w3.org/1998/Math/MathML" : r4 || (r4 = "http://www.w3.org/1999/xhtml"), null != f4) {
      for (a4 = 0; a4 < f4.length; a4++) if ((_5 = f4[a4]) && "setAttribute" in _5 == !!C4 && (C4 ? _5.localName === C4 : 3 === _5.nodeType)) {
        u4 = _5, f4[a4] = null;
        break;
      }
    }
    if (null == u4) {
      if (null === C4) return document.createTextNode(k3);
      u4 = document.createElementNS(r4, C4, k3.is && k3), c4 && (l.__m && l.__m(t4, f4), c4 = false), f4 = null;
    }
    if (null === C4) b3 === k3 || c4 && u4.data === k3 || (u4.data = k3);
    else {
      if (f4 = f4 && n.call(u4.childNodes), b3 = i5.props || h, !c4 && null != f4) for (b3 = {}, a4 = 0; a4 < u4.attributes.length; a4++) b3[(_5 = u4.attributes[a4]).name] = _5.value;
      for (a4 in b3) if (_5 = b3[a4], "children" == a4) ;
      else if ("dangerouslySetInnerHTML" == a4) p5 = _5;
      else if (!(a4 in k3)) {
        if ("value" == a4 && "defaultValue" in k3 || "checked" == a4 && "defaultChecked" in k3) continue;
        A(u4, a4, null, _5, r4);
      }
      for (a4 in k3) _5 = k3[a4], "children" == a4 ? d5 = _5 : "dangerouslySetInnerHTML" == a4 ? v5 = _5 : "value" == a4 ? g5 = _5 : "checked" == a4 ? m3 = _5 : c4 && "function" != typeof _5 || b3[a4] === _5 || A(u4, a4, _5, b3[a4], r4);
      if (v5) c4 || p5 && (v5.__html === p5.__html || v5.__html === u4.innerHTML) || (u4.innerHTML = v5.__html), t4.__k = [];
      else if (p5 && (u4.innerHTML = ""), P(u4, y(d5) ? d5 : [d5], t4, i5, o4, "foreignObject" === C4 ? "http://www.w3.org/1999/xhtml" : r4, f4, e4, f4 ? f4[0] : i5.__k && x(i5, 0), c4, s5), null != f4) for (a4 = f4.length; a4--; ) w(f4[a4]);
      c4 || (a4 = "value", "progress" === C4 && null == g5 ? u4.removeAttribute("value") : void 0 !== g5 && (g5 !== u4[a4] || "progress" === C4 && !g5 || "option" === C4 && g5 !== b3[a4]) && A(u4, a4, g5, b3[a4], r4), a4 = "checked", void 0 !== m3 && m3 !== u4[a4] && A(u4, a4, m3, b3[a4], r4));
    }
    return u4;
  }
  function N(n3, u4, t4) {
    try {
      if ("function" == typeof n3) {
        var i5 = "function" == typeof n3.__u;
        i5 && n3.__u(), i5 && null == u4 || (n3.__u = n3(u4));
      } else n3.current = u4;
    } catch (n4) {
      l.__e(n4, t4);
    }
  }
  function V(n3, u4, t4) {
    var i5, o4;
    if (l.unmount && l.unmount(n3), (i5 = n3.ref) && (i5.current && i5.current !== n3.__e || N(i5, null, u4)), null != (i5 = n3.__c)) {
      if (i5.componentWillUnmount) try {
        i5.componentWillUnmount();
      } catch (n4) {
        l.__e(n4, u4);
      }
      i5.base = i5.__P = null;
    }
    if (i5 = n3.__k) for (o4 = 0; o4 < i5.length; o4++) i5[o4] && V(i5[o4], u4, t4 || "function" != typeof n3.type);
    t4 || w(n3.__e), n3.__c = n3.__ = n3.__e = n3.__d = void 0;
  }
  function q(n3, l5, u4) {
    return this.constructor(n3, u4);
  }
  function B(u4, t4, i5) {
    var o4, r4, f4, e4;
    l.__ && l.__(u4, t4), r4 = (o4 = "function" == typeof i5) ? null : i5 && i5.__k || t4.__k, f4 = [], e4 = [], O(t4, u4 = (!o4 && i5 || t4).__k = _(b, null, [u4]), r4 || h, h, t4.namespaceURI, !o4 && i5 ? [i5] : r4 ? null : t4.firstChild ? n.call(t4.childNodes) : null, f4, !o4 && i5 ? i5 : r4 ? r4.__e : t4.firstChild, o4, e4), j(f4, u4, e4);
  }
  function G(n3, l5) {
    var u4 = { __c: l5 = "__cC" + a++, __: n3, Consumer: function(n4, l6) {
      return n4.children(l6);
    }, Provider: function(n4) {
      var u5, t4;
      return this.getChildContext || (u5 = /* @__PURE__ */ new Set(), (t4 = {})[l5] = this, this.getChildContext = function() {
        return t4;
      }, this.componentWillUnmount = function() {
        u5 = null;
      }, this.shouldComponentUpdate = function(n5) {
        this.props.value !== n5.value && u5.forEach(function(n6) {
          n6.__e = true, S(n6);
        });
      }, this.sub = function(n5) {
        u5.add(n5);
        var l6 = n5.componentWillUnmount;
        n5.componentWillUnmount = function() {
          u5 && u5.delete(n5), l6 && l6.call(n5);
        };
      }), n4.children;
    } };
    return u4.Provider.__ = u4.Consumer.contextType = u4;
  }
  var n, l, u, t, i, o, r, f, e, c, s, a, h, v, p, y;
  var init_preact_module = __esm({
    "../node_modules/preact/dist/preact.module.js"() {
      h = {};
      v = [];
      p = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
      y = Array.isArray;
      n = v.slice, l = { __e: function(n3, l5, u4, t4) {
        for (var i5, o4, r4; l5 = l5.__; ) if ((i5 = l5.__c) && !i5.__) try {
          if ((o4 = i5.constructor) && null != o4.getDerivedStateFromError && (i5.setState(o4.getDerivedStateFromError(n3)), r4 = i5.__d), null != i5.componentDidCatch && (i5.componentDidCatch(n3, t4 || {}), r4 = i5.__d), r4) return i5.__E = i5;
        } catch (l6) {
          n3 = l6;
        }
        throw n3;
      } }, u = 0, t = function(n3) {
        return null != n3 && null == n3.constructor;
      }, k.prototype.setState = function(n3, l5) {
        var u4;
        u4 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n3 && (n3 = n3(d({}, u4), this.props)), n3 && d(u4, n3), null != n3 && this.__v && (l5 && this._sb.push(l5), S(this));
      }, k.prototype.forceUpdate = function(n3) {
        this.__v && (this.__e = true, n3 && this.__h.push(n3), S(this));
      }, k.prototype.render = b, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = function(n3, l5) {
        return n3.__v.__b - l5.__v.__b;
      }, M.__r = 0, e = 0, c = F(false), s = F(true), a = 0;
    }
  });

  // ../node_modules/classnames/index.js
  var require_classnames = __commonJS({
    "../node_modules/classnames/index.js"(exports, module) {
      (function() {
        "use strict";
        var hasOwn = {}.hasOwnProperty;
        function classNames2() {
          var classes = "";
          for (var i5 = 0; i5 < arguments.length; i5++) {
            var arg = arguments[i5];
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

  // ../node_modules/preact/hooks/dist/hooks.module.js
  function d2(n3, t4) {
    c2.__h && c2.__h(r2, n3, o2 || t4), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n3 >= u4.__.length && u4.__.push({}), u4.__[n3];
  }
  function h2(n3) {
    return o2 = 1, p2(D, n3);
  }
  function p2(n3, u4, i5) {
    var o4 = d2(t2++, 2);
    if (o4.t = n3, !o4.__c && (o4.__ = [i5 ? i5(u4) : D(void 0, u4), function(n4) {
      var t4 = o4.__N ? o4.__N[0] : o4.__[0], r4 = o4.t(t4, n4);
      t4 !== r4 && (o4.__N = [r4, o4.__[1]], o4.__c.setState({}));
    }], o4.__c = r2, !r2.u)) {
      var f4 = function(n4, t4, r4) {
        if (!o4.__c.__H) return true;
        var u5 = o4.__c.__H.__.filter(function(n5) {
          return !!n5.__c;
        });
        if (u5.every(function(n5) {
          return !n5.__N;
        })) return !c4 || c4.call(this, n4, t4, r4);
        var i6 = false;
        return u5.forEach(function(n5) {
          if (n5.__N) {
            var t5 = n5.__[0];
            n5.__ = n5.__N, n5.__N = void 0, t5 !== n5.__[0] && (i6 = true);
          }
        }), !(!i6 && o4.__c.props === n4) && (!c4 || c4.call(this, n4, t4, r4));
      };
      r2.u = true;
      var c4 = r2.shouldComponentUpdate, e4 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n4, t4, r4) {
        if (this.__e) {
          var u5 = c4;
          c4 = void 0, f4(n4, t4, r4), c4 = u5;
        }
        e4 && e4.call(this, n4, t4, r4);
      }, r2.shouldComponentUpdate = f4;
    }
    return o4.__N || o4.__;
  }
  function y2(n3, u4) {
    var i5 = d2(t2++, 3);
    !c2.__s && C2(i5.__H, u4) && (i5.__ = n3, i5.i = u4, r2.__H.__h.push(i5));
  }
  function _2(n3, u4) {
    var i5 = d2(t2++, 4);
    !c2.__s && C2(i5.__H, u4) && (i5.__ = n3, i5.i = u4, r2.__h.push(i5));
  }
  function A2(n3) {
    return o2 = 5, T2(function() {
      return { current: n3 };
    }, []);
  }
  function T2(n3, r4) {
    var u4 = d2(t2++, 7);
    return C2(u4.__H, r4) && (u4.__ = n3(), u4.__H = r4, u4.__h = n3), u4.__;
  }
  function q2(n3, t4) {
    return o2 = 8, T2(function() {
      return n3;
    }, t4);
  }
  function x2(n3) {
    var u4 = r2.context[n3.__c], i5 = d2(t2++, 9);
    return i5.c = n3, u4 ? (null == i5.__ && (i5.__ = true, u4.sub(r2)), u4.props.value) : n3.__;
  }
  function g2() {
    var n3 = d2(t2++, 11);
    if (!n3.__) {
      for (var u4 = r2.__v; null !== u4 && !u4.__m && null !== u4.__; ) u4 = u4.__;
      var i5 = u4.__m || (u4.__m = [0, 0]);
      n3.__ = "P" + i5[0] + "-" + i5[1]++;
    }
    return n3.__;
  }
  function j2() {
    for (var n3; n3 = f2.shift(); ) if (n3.__P && n3.__H) try {
      n3.__H.__h.forEach(z2), n3.__H.__h.forEach(B2), n3.__H.__h = [];
    } catch (t4) {
      n3.__H.__h = [], c2.__e(t4, n3.__v);
    }
  }
  function w2(n3) {
    var t4, r4 = function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t4), setTimeout(n3);
    }, u4 = setTimeout(r4, 100);
    k2 && (t4 = requestAnimationFrame(r4));
  }
  function z2(n3) {
    var t4 = r2, u4 = n3.__c;
    "function" == typeof u4 && (n3.__c = void 0, u4()), r2 = t4;
  }
  function B2(n3) {
    var t4 = r2;
    n3.__c = n3.__(), r2 = t4;
  }
  function C2(n3, t4) {
    return !n3 || n3.length !== t4.length || t4.some(function(t5, r4) {
      return t5 !== n3[r4];
    });
  }
  function D(n3, t4) {
    return "function" == typeof t4 ? t4(n3) : t4;
  }
  var t2, r2, u2, i3, o2, f2, c2, e2, a2, v2, l2, m, s2, k2;
  var init_hooks_module = __esm({
    "../node_modules/preact/hooks/dist/hooks.module.js"() {
      init_preact_module();
      o2 = 0;
      f2 = [];
      c2 = l;
      e2 = c2.__b;
      a2 = c2.__r;
      v2 = c2.diffed;
      l2 = c2.__c;
      m = c2.unmount;
      s2 = c2.__;
      c2.__b = function(n3) {
        r2 = null, e2 && e2(n3);
      }, c2.__ = function(n3, t4) {
        n3 && t4.__k && t4.__k.__m && (n3.__m = t4.__k.__m), s2 && s2(n3, t4);
      }, c2.__r = function(n3) {
        a2 && a2(n3), t2 = 0;
        var i5 = (r2 = n3.__c).__H;
        i5 && (u2 === r2 ? (i5.__h = [], r2.__h = [], i5.__.forEach(function(n4) {
          n4.__N && (n4.__ = n4.__N), n4.i = n4.__N = void 0;
        })) : (i5.__h.forEach(z2), i5.__h.forEach(B2), i5.__h = [], t2 = 0)), u2 = r2;
      }, c2.diffed = function(n3) {
        v2 && v2(n3);
        var t4 = n3.__c;
        t4 && t4.__H && (t4.__H.__h.length && (1 !== f2.push(t4) && i3 === c2.requestAnimationFrame || ((i3 = c2.requestAnimationFrame) || w2)(j2)), t4.__H.__.forEach(function(n4) {
          n4.i && (n4.__H = n4.i), n4.i = void 0;
        })), u2 = r2 = null;
      }, c2.__c = function(n3, t4) {
        t4.some(function(n4) {
          try {
            n4.__h.forEach(z2), n4.__h = n4.__h.filter(function(n5) {
              return !n5.__ || B2(n5);
            });
          } catch (r4) {
            t4.some(function(n5) {
              n5.__h && (n5.__h = []);
            }), t4 = [], c2.__e(r4, n4.__v);
          }
        }), l2 && l2(n3, t4);
      }, c2.unmount = function(n3) {
        m && m(n3);
        var t4, r4 = n3.__c;
        r4 && r4.__H && (r4.__H.__.forEach(function(n4) {
          try {
            z2(n4);
          } catch (n5) {
            t4 = n5;
          }
        }), r4.__H = void 0, t4 && c2.__e(t4, r4.__v));
      };
      k2 = "function" == typeof requestAnimationFrame;
    }
  });

  // pages/new-tab/app/settings.provider.js
  function SettingsProvider({ settings, children }) {
    return /* @__PURE__ */ _(SettingsContext.Provider, { value: { settings } }, children);
  }
  function usePlatformName() {
    return x2(SettingsContext).settings.platform.name;
  }
  function useCustomizerDrawerSettings() {
    return x2(SettingsContext).settings.customizerDrawer;
  }
  var SettingsContext;
  var init_settings_provider = __esm({
    "pages/new-tab/app/settings.provider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      SettingsContext = G(
        /** @type {{settings: import("./settings.js").Settings}} */
        {}
      );
    }
  });

  // ../node_modules/@preact/signals-core/dist/signals-core.module.js
  function t3() {
    if (!(s3 > 1)) {
      var i5, t4 = false;
      while (void 0 !== h3) {
        var r4 = h3;
        h3 = void 0;
        f3++;
        while (void 0 !== r4) {
          var o4 = r4.o;
          r4.o = void 0;
          r4.f &= -3;
          if (!(8 & r4.f) && c3(r4)) try {
            r4.c();
          } catch (r5) {
            if (!t4) {
              i5 = r5;
              t4 = true;
            }
          }
          r4 = o4;
        }
      }
      f3 = 0;
      s3--;
      if (t4) throw i5;
    } else s3--;
  }
  function r3(i5) {
    if (s3 > 0) return i5();
    s3++;
    try {
      return i5();
    } finally {
      t3();
    }
  }
  function e3(i5) {
    if (void 0 !== o3) {
      var t4 = i5.n;
      if (void 0 === t4 || t4.t !== o3) {
        t4 = { i: 0, S: i5, p: o3.s, n: void 0, t: o3, e: void 0, x: void 0, r: t4 };
        if (void 0 !== o3.s) o3.s.n = t4;
        o3.s = t4;
        i5.n = t4;
        if (32 & o3.f) i5.S(t4);
        return t4;
      } else if (-1 === t4.i) {
        t4.i = 0;
        if (void 0 !== t4.n) {
          t4.n.p = t4.p;
          if (void 0 !== t4.p) t4.p.n = t4.n;
          t4.p = o3.s;
          t4.n = void 0;
          o3.s.n = t4;
          o3.s = t4;
        }
        return t4;
      }
    }
  }
  function u3(i5) {
    this.v = i5;
    this.i = 0;
    this.n = void 0;
    this.t = void 0;
  }
  function d3(i5) {
    return new u3(i5);
  }
  function c3(i5) {
    for (var t4 = i5.s; void 0 !== t4; t4 = t4.n) if (t4.S.i !== t4.i || !t4.S.h() || t4.S.i !== t4.i) return true;
    return false;
  }
  function a3(i5) {
    for (var t4 = i5.s; void 0 !== t4; t4 = t4.n) {
      var r4 = t4.S.n;
      if (void 0 !== r4) t4.r = r4;
      t4.S.n = t4;
      t4.i = -1;
      if (void 0 === t4.n) {
        i5.s = t4;
        break;
      }
    }
  }
  function l3(i5) {
    var t4 = i5.s, r4 = void 0;
    while (void 0 !== t4) {
      var o4 = t4.p;
      if (-1 === t4.i) {
        t4.S.U(t4);
        if (void 0 !== o4) o4.n = t4.n;
        if (void 0 !== t4.n) t4.n.p = o4;
      } else r4 = t4;
      t4.S.n = t4.r;
      if (void 0 !== t4.r) t4.r = void 0;
      t4 = o4;
    }
    i5.s = r4;
  }
  function y3(i5) {
    u3.call(this, void 0);
    this.x = i5;
    this.s = void 0;
    this.g = v3 - 1;
    this.f = 4;
  }
  function w3(i5) {
    return new y3(i5);
  }
  function _3(i5) {
    var r4 = i5.u;
    i5.u = void 0;
    if ("function" == typeof r4) {
      s3++;
      var n3 = o3;
      o3 = void 0;
      try {
        r4();
      } catch (t4) {
        i5.f &= -2;
        i5.f |= 8;
        g3(i5);
        throw t4;
      } finally {
        o3 = n3;
        t3();
      }
    }
  }
  function g3(i5) {
    for (var t4 = i5.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
    i5.x = void 0;
    i5.s = void 0;
    _3(i5);
  }
  function p3(i5) {
    if (o3 !== this) throw new Error("Out-of-order effect");
    l3(this);
    o3 = i5;
    this.f &= -2;
    if (8 & this.f) g3(this);
    t3();
  }
  function b2(i5) {
    this.x = i5;
    this.u = void 0;
    this.s = void 0;
    this.o = void 0;
    this.f = 32;
  }
  function E(i5) {
    var t4 = new b2(i5);
    try {
      t4.c();
    } catch (i6) {
      t4.d();
      throw i6;
    }
    return t4.d.bind(t4);
  }
  var i4, o3, h3, s3, f3, v3;
  var init_signals_core_module = __esm({
    "../node_modules/@preact/signals-core/dist/signals-core.module.js"() {
      i4 = Symbol.for("preact-signals");
      o3 = void 0;
      h3 = void 0;
      s3 = 0;
      f3 = 0;
      v3 = 0;
      u3.prototype.brand = i4;
      u3.prototype.h = function() {
        return true;
      };
      u3.prototype.S = function(i5) {
        if (this.t !== i5 && void 0 === i5.e) {
          i5.x = this.t;
          if (void 0 !== this.t) this.t.e = i5;
          this.t = i5;
        }
      };
      u3.prototype.U = function(i5) {
        if (void 0 !== this.t) {
          var t4 = i5.e, r4 = i5.x;
          if (void 0 !== t4) {
            t4.x = r4;
            i5.e = void 0;
          }
          if (void 0 !== r4) {
            r4.e = t4;
            i5.x = void 0;
          }
          if (i5 === this.t) this.t = r4;
        }
      };
      u3.prototype.subscribe = function(i5) {
        var t4 = this;
        return E(function() {
          var r4 = t4.value, n3 = o3;
          o3 = void 0;
          try {
            i5(r4);
          } finally {
            o3 = n3;
          }
        });
      };
      u3.prototype.valueOf = function() {
        return this.value;
      };
      u3.prototype.toString = function() {
        return this.value + "";
      };
      u3.prototype.toJSON = function() {
        return this.value;
      };
      u3.prototype.peek = function() {
        var i5 = o3;
        o3 = void 0;
        try {
          return this.value;
        } finally {
          o3 = i5;
        }
      };
      Object.defineProperty(u3.prototype, "value", { get: function() {
        var i5 = e3(this);
        if (void 0 !== i5) i5.i = this.i;
        return this.v;
      }, set: function(i5) {
        if (i5 !== this.v) {
          if (f3 > 100) throw new Error("Cycle detected");
          this.v = i5;
          this.i++;
          v3++;
          s3++;
          try {
            for (var r4 = this.t; void 0 !== r4; r4 = r4.x) r4.t.N();
          } finally {
            t3();
          }
        }
      } });
      (y3.prototype = new u3()).h = function() {
        this.f &= -3;
        if (1 & this.f) return false;
        if (32 == (36 & this.f)) return true;
        this.f &= -5;
        if (this.g === v3) return true;
        this.g = v3;
        this.f |= 1;
        if (this.i > 0 && !c3(this)) {
          this.f &= -2;
          return true;
        }
        var i5 = o3;
        try {
          a3(this);
          o3 = this;
          var t4 = this.x();
          if (16 & this.f || this.v !== t4 || 0 === this.i) {
            this.v = t4;
            this.f &= -17;
            this.i++;
          }
        } catch (i6) {
          this.v = i6;
          this.f |= 16;
          this.i++;
        }
        o3 = i5;
        l3(this);
        this.f &= -2;
        return true;
      };
      y3.prototype.S = function(i5) {
        if (void 0 === this.t) {
          this.f |= 36;
          for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.S(t4);
        }
        u3.prototype.S.call(this, i5);
      };
      y3.prototype.U = function(i5) {
        if (void 0 !== this.t) {
          u3.prototype.U.call(this, i5);
          if (void 0 === this.t) {
            this.f &= -33;
            for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
          }
        }
      };
      y3.prototype.N = function() {
        if (!(2 & this.f)) {
          this.f |= 6;
          for (var i5 = this.t; void 0 !== i5; i5 = i5.x) i5.t.N();
        }
      };
      Object.defineProperty(y3.prototype, "value", { get: function() {
        if (1 & this.f) throw new Error("Cycle detected");
        var i5 = e3(this);
        this.h();
        if (void 0 !== i5) i5.i = this.i;
        if (16 & this.f) throw this.v;
        return this.v;
      } });
      b2.prototype.c = function() {
        var i5 = this.S();
        try {
          if (8 & this.f) return;
          if (void 0 === this.x) return;
          var t4 = this.x();
          if ("function" == typeof t4) this.u = t4;
        } finally {
          i5();
        }
      };
      b2.prototype.S = function() {
        if (1 & this.f) throw new Error("Cycle detected");
        this.f |= 1;
        this.f &= -9;
        _3(this);
        a3(this);
        s3++;
        var i5 = o3;
        o3 = this;
        return p3.bind(this, i5);
      };
      b2.prototype.N = function() {
        if (!(2 & this.f)) {
          this.f |= 2;
          this.o = h3;
          h3 = this;
        }
      };
      b2.prototype.d = function() {
        this.f |= 8;
        if (!(1 & this.f)) g3(this);
      };
    }
  });

  // ../node_modules/@preact/signals/dist/signals.module.js
  function l4(n3, i5) {
    l[n3] = i5.bind(null, l[n3] || function() {
    });
  }
  function d4(n3) {
    if (s4) s4();
    s4 = n3 && n3.S();
  }
  function p4(n3) {
    var r4 = this, f4 = n3.data, o4 = useSignal(f4);
    o4.value = f4;
    var e4 = T2(function() {
      var n4 = r4.__v;
      while (n4 = n4.__) if (n4.__c) {
        n4.__c.__$f |= 4;
        break;
      }
      r4.__$u.c = function() {
        var n5, t4 = r4.__$u.S(), f5 = e4.value;
        t4();
        if (t(f5) || 3 !== (null == (n5 = r4.base) ? void 0 : n5.nodeType)) {
          r4.__$f |= 1;
          r4.setState({});
        } else r4.base.data = f5;
      };
      return w3(function() {
        var n5 = o4.value.value;
        return 0 === n5 ? 0 : true === n5 ? "" : n5 || "";
      });
    }, []);
    return e4.value;
  }
  function _4(n3, r4, i5, t4) {
    var f4 = r4 in n3 && void 0 === n3.ownerSVGElement, o4 = d3(i5);
    return { o: function(n4, r5) {
      o4.value = n4;
      t4 = r5;
    }, d: E(function() {
      var i6 = o4.value.value;
      if (t4[r4] !== i6) {
        t4[r4] = i6;
        if (f4) n3[r4] = i6;
        else if (i6) n3.setAttribute(r4, i6);
        else n3.removeAttribute(r4);
      }
    }) };
  }
  function useSignal(n3) {
    return T2(function() {
      return d3(n3);
    }, []);
  }
  function useComputed(n3) {
    var r4 = A2(n3);
    r4.current = n3;
    v4.__$f |= 4;
    return T2(function() {
      return w3(function() {
        return r4.current();
      });
    }, []);
  }
  function useSignalEffect(n3) {
    var r4 = A2(n3);
    r4.current = n3;
    y2(function() {
      return E(function() {
        return r4.current();
      });
    }, []);
  }
  var v4, s4;
  var init_signals_module = __esm({
    "../node_modules/@preact/signals/dist/signals.module.js"() {
      init_preact_module();
      init_hooks_module();
      init_signals_core_module();
      init_signals_core_module();
      p4.displayName = "_st";
      Object.defineProperties(u3.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: p4 }, props: { configurable: true, get: function() {
        return { data: this };
      } }, __b: { configurable: true, value: 1 } });
      l4("__b", function(n3, r4) {
        if ("string" == typeof r4.type) {
          var i5, t4 = r4.props;
          for (var f4 in t4) if ("children" !== f4) {
            var o4 = t4[f4];
            if (o4 instanceof u3) {
              if (!i5) r4.__np = i5 = {};
              i5[f4] = o4;
              t4[f4] = o4.peek();
            }
          }
        }
        n3(r4);
      });
      l4("__r", function(n3, r4) {
        d4();
        var i5, t4 = r4.__c;
        if (t4) {
          t4.__$f &= -2;
          if (void 0 === (i5 = t4.__$u)) t4.__$u = i5 = function(n4) {
            var r5;
            E(function() {
              r5 = this;
            });
            r5.c = function() {
              t4.__$f |= 1;
              t4.setState({});
            };
            return r5;
          }();
        }
        v4 = t4;
        d4(i5);
        n3(r4);
      });
      l4("__e", function(n3, r4, i5, t4) {
        d4();
        v4 = void 0;
        n3(r4, i5, t4);
      });
      l4("diffed", function(n3, r4) {
        d4();
        v4 = void 0;
        var i5;
        if ("string" == typeof r4.type && (i5 = r4.__e)) {
          var t4 = r4.__np, f4 = r4.props;
          if (t4) {
            var o4 = i5.U;
            if (o4) for (var e4 in o4) {
              var u4 = o4[e4];
              if (void 0 !== u4 && !(e4 in t4)) {
                u4.d();
                o4[e4] = void 0;
              }
            }
            else i5.U = o4 = {};
            for (var a4 in t4) {
              var c4 = o4[a4], s5 = t4[a4];
              if (void 0 === c4) {
                c4 = _4(i5, a4, s5, f4);
                o4[a4] = c4;
              } else c4.o(s5, f4);
            }
          }
        }
        n3(r4);
      });
      l4("unmount", function(n3, r4) {
        if ("string" == typeof r4.type) {
          var i5 = r4.__e;
          if (i5) {
            var t4 = i5.U;
            if (t4) {
              i5.U = void 0;
              for (var f4 in t4) {
                var o4 = t4[f4];
                if (o4) o4.d();
              }
            }
          }
        } else {
          var e4 = r4.__c;
          if (e4) {
            var u4 = e4.__$u;
            if (u4) {
              e4.__$u = void 0;
              u4.d();
            }
          }
        }
        n3(r4);
      });
      l4("__h", function(n3, r4, i5, t4) {
        if (t4 < 3 || 9 === t4) r4.__$f |= 2;
        n3(r4, i5, t4);
      });
      k.prototype.shouldComponentUpdate = function(n3, r4) {
        var i5 = this.__$u;
        if (!(i5 && void 0 !== i5.s || 4 & this.__$f)) return true;
        if (3 & this.__$f) return true;
        for (var t4 in r4) return true;
        for (var f4 in n3) if ("__source" !== f4 && n3[f4] !== this.props[f4]) return true;
        for (var o4 in this.props) if (!(o4 in n3)) return true;
        return false;
      };
    }
  });

  // pages/new-tab/app/widget-list/widget-config.provider.js
  function WidgetConfigProvider(props) {
    const currentValues = useSignal(props.widgetConfigs);
    E(() => {
      const unsub = props.api.onData((widgetConfig) => {
        currentValues.value = widgetConfig.data;
      });
      return () => unsub();
    });
    function toggle(id) {
      props.api.toggleVisibility(id);
    }
    return /* @__PURE__ */ _(
      WidgetConfigContext.Provider,
      {
        value: {
          // this field is static for the lifespan of the page
          widgets: props.widgets,
          entryPoints: props.entryPoints,
          widgetConfigItems: props.widgetConfigs,
          currentValues,
          toggle
        }
      },
      props.children
    );
  }
  function useVisibility() {
    return x2(WidgetVisibilityContext);
  }
  function WidgetVisibilityProvider(props) {
    const { toggle, currentValues } = x2(WidgetConfigContext);
    const visibility = useComputed(() => {
      const matchingConfig = currentValues.value.find((x4) => x4.id === props.id);
      if (!matchingConfig) throw new Error("unreachable. Must find widget config via id: " + props.id);
      return matchingConfig.visibility;
    });
    return /* @__PURE__ */ _(
      WidgetVisibilityContext.Provider,
      {
        value: {
          visibility,
          id: props.id,
          toggle,
          index: props.index
        }
      },
      props.children
    );
  }
  var WidgetConfigContext, WidgetConfigDispatchContext, WidgetVisibilityContext;
  var init_widget_config_provider = __esm({
    "pages/new-tab/app/widget-list/widget-config.provider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_signals_module();
      WidgetConfigContext = G({
        /** @type {Widgets} */
        widgets: [],
        /** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
        entryPoints: {},
        /**
         * A snapshot of the widget config as received at page load. Use this when you
         * don't need up-to-date values.
         * @type {WidgetConfigItem[]}
         */
        widgetConfigItems: [],
        /**
         * The live version of the data in 'widgetConfigItems' above. This represents the very
         * latest updates and can be subscribed to for reactive updates
         * @type {import("@preact/signals").Signal<WidgetConfigItem[]>}
         */
        currentValues: d3([]),
        /** @type {(id:string) => void} */
        toggle: (_id) => {
        }
      });
      WidgetConfigDispatchContext = G({
        dispatch: null
      });
      WidgetVisibilityContext = G({
        id: (
          /** @type {WidgetConfigItem['id']} */
          ""
        ),
        /** @type {(id: string) => void} */
        toggle: (_id) => {
        },
        /** @type {number} */
        index: -1,
        visibility: d3(
          /** @type {WidgetConfigItem['visibility']} */
          "visible"
        )
      });
    }
  });

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
      const target = Math.ceil(textLength);
      const combined = out.repeat(target);
      return combined.slice(0, targetLen);
    }
    return out;
  }
  var init_translations = __esm({
    "shared/translations.js"() {
      "use strict";
    }
  });

  // shared/components/TranslationsProvider.js
  function TranslationProvider({ children, translationObject, fallback, textLength = 1 }) {
    function t4(inputKey, replacements) {
      const subject = translationObject?.[inputKey]?.title || fallback?.[inputKey]?.title;
      return apply(subject, replacements, textLength);
    }
    return /* @__PURE__ */ _(TranslationContext.Provider, { value: { t: t4 } }, children);
  }
  function Trans({ str, values: values2 }) {
    const ref = A2(null);
    const cleanups = A2([]);
    y2(() => {
      if (!ref.current) return;
      const curr = ref.current;
      const cleanupsCurr = cleanups.current;
      Object.entries(values2).forEach(([tag, attributes]) => {
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
    }, [values2, str]);
    return /* @__PURE__ */ _("span", { ref, dangerouslySetInnerHTML: { __html: str } });
  }
  var TranslationContext;
  var init_TranslationsProvider = __esm({
    "shared/components/TranslationsProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_translations();
      TranslationContext = G({
        /** @type {LocalTranslationFn} */
        t: () => {
          throw new Error("must implement");
        }
      });
    }
  });

  // pages/new-tab/app/types.js
  function useTypedTranslation() {
    return {
      t: x2(TranslationContext).t
    };
  }
  function useTypedTranslationWith(context) {
    return {
      /** @type {any} */
      t: x2(TranslationContext).t
    };
  }
  var MessagingContext, useMessaging, TelemetryContext, useTelemetry, InitialSetupContext, useInitialSetupData;
  var init_types = __esm({
    "pages/new-tab/app/types.js"() {
      "use strict";
      init_hooks_module();
      init_TranslationsProvider();
      init_preact_module();
      MessagingContext = G(
        /** @type {import("../src/index.js").NewTabPage} */
        {}
      );
      useMessaging = () => x2(MessagingContext);
      TelemetryContext = G(
        /** @type {import("./telemetry/telemetry.js").Telemetry} */
        {
          measureFromPageLoad: () => {
          }
        }
      );
      useTelemetry = () => x2(TelemetryContext);
      InitialSetupContext = G(
        /** @type {InitialSetupResponse} */
        {}
      );
      useInitialSetupData = () => x2(InitialSetupContext);
    }
  });

  // pages/new-tab/app/components/Layout.js
  function Centered({ children, ...rest }) {
    return /* @__PURE__ */ _("div", { ...rest, class: "layout-centered" }, children);
  }
  var init_Layout = __esm({
    "pages/new-tab/app/components/Layout.js"() {
      "use strict";
      init_preact_module();
    }
  });

  // pages/new-tab/app/customizer/components/Customizer.module.css
  var Customizer_default;
  var init_Customizer = __esm({
    "pages/new-tab/app/customizer/components/Customizer.module.css"() {
      Customizer_default = {
        root: "Customizer_root",
        lowerRightFixed: "Customizer_lowerRightFixed",
        dropdownMenu: "Customizer_dropdownMenu",
        show: "Customizer_show",
        customizeButton: "Customizer_customizeButton"
      };
    }
  });

  // pages/new-tab/app/components/Icons.module.css
  var Icons_default;
  var init_Icons = __esm({
    "pages/new-tab/app/components/Icons.module.css"() {
      Icons_default = {
        chevronButton: "Icons_chevronButton",
        chevronCircle: "Icons_chevronCircle",
        chevronArrow: "Icons_chevronArrow"
      };
    }
  });

  // pages/new-tab/app/components/Icons.js
  function Chevron() {
    return /* @__PURE__ */ _("svg", { fill: "none", width: "16", height: "16", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M3.293 7.793a1 1 0 0 0 0 1.414l8 8a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0-1.414-1.414L12 15.086 4.707 7.793a1 1 0 0 0-1.414 0Z",
        "clip-rule": "evenodd"
      }
    ));
  }
  function CustomizeIcon() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", class: Icons_default.customize }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M4.5 1C2.567 1 1 2.567 1 4.5C1 6.433 2.567 8 4.5 8C6.17556 8 7.57612 6.82259 7.91946 5.25H14.375C14.7202 5.25 15 4.97018 15 4.625C15 4.27982 14.7202 4 14.375 4H7.96456C7.72194 2.30385 6.26324 1 4.5 1ZM2.25 4.5C2.25 3.25736 3.25736 2.25 4.5 2.25C5.74264 2.25 6.75 3.25736 6.75 4.5C6.75 5.74264 5.74264 6.75 4.5 6.75C3.25736 6.75 2.25 5.74264 2.25 4.5Z",
        fill: "currentColor"
      }
    ), /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M8.03544 12H1.625C1.27982 12 1 11.7202 1 11.375C1 11.0298 1.27982 10.75 1.625 10.75H8.08054C8.42388 9.17741 9.82444 8 11.5 8C13.433 8 15 9.567 15 11.5C15 13.433 13.433 15 11.5 15C9.73676 15 8.27806 13.6961 8.03544 12ZM9.25 11.5C9.25 10.2574 10.2574 9.25 11.5 9.25C12.7426 9.25 13.75 10.2574 13.75 11.5C13.75 12.7426 12.7426 13.75 11.5 13.75C10.2574 13.75 9.25 12.7426 9.25 11.5Z",
        fill: "currentColor"
      }
    ));
  }
  function DuckFoot() {
    return /* @__PURE__ */ _("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16" }, /* @__PURE__ */ _(
      "path",
      {
        "clip-rule": "evenodd",
        fill: "currentColor",
        d: "M6.483.612A2.13 2.13 0 0 1 7.998 0c.56.001 1.115.215 1.512.62.673.685 1.26 1.045 1.852 1.228.594.185 1.31.228 2.311.1a2.175 2.175 0 0 1 1.575.406c.452.34.746.862.75 1.445.033 3.782-.518 6.251-1.714 8.04-1.259 1.882-3.132 2.831-5.045 3.8l-.123.063-.003.001-.125.063a2.206 2.206 0 0 1-1.976 0l-.124-.063-.003-.001-.124-.063c-1.913-.969-3.786-1.918-5.045-3.8C.52 10.05-.031 7.58 0 3.798a1.83 1.83 0 0 1 .75-1.444 2.175 2.175 0 0 1 1.573-.407c1.007.127 1.725.076 2.32-.114.59-.189 1.172-.551 1.839-1.222Zm2.267 1.36v12.233c1.872-.952 3.311-1.741 4.287-3.2.949-1.42 1.493-3.529 1.462-7.194 0-.072-.037-.17-.152-.257a.677.677 0 0 0-.484-.118c-1.126.144-2.075.115-2.945-.155-.77-.239-1.47-.664-2.168-1.309Zm-1.5 12.233V1.955c-.69.635-1.383 1.063-2.15 1.308-.87.278-1.823.317-2.963.174a.677.677 0 0 0-.484.117c-.115.087-.151.186-.152.258-.03 3.664.513 5.774 1.462 7.192.976 1.46 2.415 2.249 4.287 3.201Z"
      }
    ));
  }
  function Shield() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M6.341 1.367c.679-1.375 2.64-1.375 3.318 0l1.366 2.767a.35.35 0 0 0 .264.192l3.054.444c1.517.22 2.123 2.085 1.025 3.155l-2.21 2.155a.35.35 0 0 0-.1.31l.521 3.041c.26 1.512-1.327 2.664-2.684 1.95l-2.732-1.436a.35.35 0 0 0-.326 0l-2.732 1.437c-1.357.713-2.943-.44-2.684-1.95l.522-3.043a.35.35 0 0 0-.1-.31L.631 7.926C-.466 6.855.14 4.99 1.657 4.77l3.055-.444a.35.35 0 0 0 .263-.192l1.366-2.767Zm1.973.664a.35.35 0 0 0-.628 0L6.32 4.798A1.85 1.85 0 0 1 4.927 5.81l-3.054.444a.35.35 0 0 0-.194.597l2.21 2.154a1.85 1.85 0 0 1 .532 1.638L3.9 13.685a.35.35 0 0 0 .508.369l2.732-1.436a1.85 1.85 0 0 1 1.722 0l2.732 1.436a.35.35 0 0 0 .508-.369l-.522-3.042a1.85 1.85 0 0 1 .532-1.638l2.21-2.154a.35.35 0 0 0-.194-.597l-3.054-.444A1.85 1.85 0 0 1 9.68 4.798L8.314 2.031Z",
        fill: "currentColor"
      }
    ));
  }
  function Cross() {
    return /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M11.4419 5.44194C11.686 5.19786 11.686 4.80214 11.4419 4.55806C11.1979 4.31398 10.8021 4.31398 10.5581 4.55806L8 7.11612L5.44194 4.55806C5.19786 4.31398 4.80214 4.31398 4.55806 4.55806C4.31398 4.80214 4.31398 5.19786 4.55806 5.44194L7.11612 8L4.55806 10.5581C4.31398 10.8021 4.31398 11.1979 4.55806 11.4419C4.80214 11.686 5.19786 11.686 5.44194 11.4419L8 8.88388L10.5581 11.4419C10.8021 11.686 11.1979 11.686 11.4419 11.4419C11.686 11.1979 11.686 10.8021 11.4419 10.5581L8.88388 8L11.4419 5.44194Z",
        fill: "currentColor"
      }
    ));
  }
  function CheckColor() {
    return /* @__PURE__ */ _("svg", { fill: "none", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _("path", { fill: "#4CBA3C", d: "M15.5 8a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0" }), /* @__PURE__ */ _(
      "path",
      {
        fill: "#fff",
        "fill-rule": "evenodd",
        d: "M11.844 5.137a.5.5 0 0 1 .019.707l-4.5 4.75a.5.5 0 0 1-.733-.008l-2.5-2.75a.5.5 0 0 1 .74-.672l2.138 2.351 4.129-4.359a.5.5 0 0 1 .707-.019",
        "clip-rule": "evenodd"
      }
    ), /* @__PURE__ */ _(
      "path",
      {
        fill: "#288419",
        "fill-rule": "evenodd",
        d: "M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8",
        "clip-rule": "evenodd"
      }
    ));
  }
  function CircleCheck() {
    return /* @__PURE__ */ _("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _("g", { "clip-path": "url(#clip0_1635_18497)" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM17.5737 9.25013C17.9189 8.86427 17.886 8.27159 17.5001 7.92635C17.1143 7.5811 16.5216 7.61403 16.1764 7.99989L10.5319 14.3084L7.85061 11.0313C7.52274 10.6306 6.9321 10.5716 6.53137 10.8994C6.13064 11.2273 6.07157 11.8179 6.39944 12.2187L9.77444 16.3437C9.94792 16.5557 10.2054 16.6812 10.4793 16.6873C10.7532 16.6933 11.016 16.5793 11.1987 16.3751L17.5737 9.25013Z",
        fill: "currentColor",
        "fill-opacity": "0.6"
      }
    )), /* @__PURE__ */ _("defs", null, /* @__PURE__ */ _("clipPath", { id: "clip0_1635_18497" }, /* @__PURE__ */ _("rect", { width: "24", height: "24", fill: "white" }))));
  }
  function Picker() {
    return /* @__PURE__ */ _("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M20.5588 3.44118C19.3873 2.26961 17.4878 2.26961 16.3162 3.44118L16.1527 3.60466C16.1473 3.61004 16.1418 3.61544 16.1364 3.62087L12.5858 7.17141L11.7071 6.29268C11.3166 5.90216 10.6834 5.90216 10.2929 6.29268C9.90239 6.68321 9.90239 7.31637 10.2929 7.7069L11.1717 8.58568L3.44124 16.3161C2.26967 17.4877 2.26967 19.3872 3.44124 20.5588C4.61281 21.7304 6.51231 21.7304 7.68388 20.5588L15.4143 12.8283L16.2929 13.7069C16.6834 14.0974 17.3166 14.0974 17.7071 13.7069C18.0977 13.3164 18.0977 12.6832 17.7071 12.2927L16.8286 11.4141L20.5588 7.68382C21.7304 6.51225 21.7304 4.61275 20.5588 3.44118ZM12.5859 9.9999L4.85545 17.7304C4.46493 18.1209 4.46493 18.754 4.85545 19.1446C5.24598 19.5351 5.87914 19.5351 6.26967 19.1446L14.0001 11.4141L12.5859 9.9999Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    ));
  }
  function PlusIcon() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M8.25 0.5C8.66421 0.5 9 0.835786 9 1.25V7H14.75C15.1642 7 15.5 7.33579 15.5 7.75C15.5 8.16421 15.1642 8.5 14.75 8.5H9V14.25C9 14.6642 8.66421 15 8.25 15C7.83579 15 7.5 14.6642 7.5 14.25V8.5H1.75C1.33579 8.5 1 8.16421 1 7.75C1 7.33579 1.33579 7 1.75 7H7.5V1.25C7.5 0.835786 7.83579 0.5 8.25 0.5Z",
        fill: "currentColor"
      }
    ));
  }
  function BackChevron() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M10.4419 3.18306C10.686 3.42714 10.686 3.82286 10.4419 4.06694L6.50888 8L10.4419 11.9331C10.686 12.1771 10.686 12.5729 10.4419 12.8169C10.1979 13.061 9.80214 13.061 9.55806 12.8169L5.18306 8.44194C4.93898 8.19786 4.93898 7.80214 5.18306 7.55806L9.55806 3.18306C9.80214 2.93898 10.1979 2.93898 10.4419 3.18306Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    ));
  }
  var init_Icons2 = __esm({
    "pages/new-tab/app/components/Icons.js"() {
      "use strict";
      init_preact_module();
      init_Icons();
    }
  });

  // pages/new-tab/app/customizer/components/VisibilityMenu.module.css
  var VisibilityMenu_default;
  var init_VisibilityMenu = __esm({
    "pages/new-tab/app/customizer/components/VisibilityMenu.module.css"() {
      VisibilityMenu_default = {
        dropdownInner: "VisibilityMenu_dropdownInner",
        list: "VisibilityMenu_list",
        embedded: "VisibilityMenu_embedded",
        menuItemLabel: "VisibilityMenu_menuItemLabel",
        svg: "VisibilityMenu_svg",
        checkbox: "VisibilityMenu_checkbox",
        checkboxIcon: "VisibilityMenu_checkboxIcon"
      };
    }
  });

  // pages/new-tab/app/customizer/components/VisibilityMenu.js
  function VisibilityMenu({ rows, variant = "popover" }) {
    const MENU_ID = g2();
    return /* @__PURE__ */ _("ul", { className: (0, import_classnames.default)(VisibilityMenu_default.list, variant === "embedded" && VisibilityMenu_default.embedded) }, rows.map((row) => {
      return /* @__PURE__ */ _("li", { key: row.id }, /* @__PURE__ */ _("label", { className: VisibilityMenu_default.menuItemLabel, htmlFor: MENU_ID + row.id }, /* @__PURE__ */ _(
        "input",
        {
          type: "checkbox",
          checked: row.visibility === "visible",
          onChange: () => row.toggle?.(row.id),
          id: MENU_ID + row.id,
          class: VisibilityMenu_default.checkbox
        }
      ), /* @__PURE__ */ _("span", { "aria-hidden": true, className: VisibilityMenu_default.checkboxIcon }, row.visibility === "visible" && /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
        "path",
        {
          d: "M3.5 9L6 11.5L12.5 5",
          stroke: "white",
          "stroke-width": "1.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }
      ))), /* @__PURE__ */ _("span", { className: VisibilityMenu_default.svg }, row.icon === "shield" && /* @__PURE__ */ _(DuckFoot, null), row.icon === "star" && /* @__PURE__ */ _(Shield, null)), /* @__PURE__ */ _("span", null, row.title ?? row.id)));
    }));
  }
  function VisibilityMenuPopover({ children }) {
    return /* @__PURE__ */ _("div", { className: VisibilityMenu_default.dropdownInner }, children);
  }
  var import_classnames;
  var init_VisibilityMenu2 = __esm({
    "pages/new-tab/app/customizer/components/VisibilityMenu.js"() {
      "use strict";
      init_preact_module();
      import_classnames = __toESM(require_classnames(), 1);
      init_hooks_module();
      init_Icons2();
      init_VisibilityMenu();
      init_types();
    }
  });

  // pages/new-tab/app/customizer/components/Customizer.js
  function Customizer() {
    const { setIsOpen, buttonRef, dropdownRef, isOpen } = useDropdown();
    const [rowData, setRowData] = h2(
      /** @type {VisibilityRowData[]} */
      []
    );
    const toggleMenu = q2(() => {
      if (isOpen) return setIsOpen(false);
      setRowData(getItems());
      setIsOpen(true);
    }, [isOpen]);
    y2(() => {
      if (!isOpen) return;
      function handler() {
        setRowData(getItems());
      }
      window.addEventListener(Customizer.UPDATE_EVENT, handler);
      return () => {
        window.removeEventListener(Customizer.UPDATE_EVENT, handler);
      };
    }, [isOpen]);
    const MENU_ID = g2();
    const BUTTON_ID = g2();
    return /* @__PURE__ */ _("div", { class: Customizer_default.root, ref: dropdownRef }, /* @__PURE__ */ _(CustomizerButton, { buttonId: BUTTON_ID, menuId: MENU_ID, toggleMenu, buttonRef, isOpen }), /* @__PURE__ */ _("div", { id: MENU_ID, class: (0, import_classnames2.default)(Customizer_default.dropdownMenu, { [Customizer_default.show]: isOpen }), "aria-labelledby": BUTTON_ID }, /* @__PURE__ */ _(VisibilityMenuPopover, null, /* @__PURE__ */ _(VisibilityMenu, { rows: rowData, variant: "popover" }))));
  }
  function getItems() {
    const next = [];
    const detail = {
      register: (incoming) => {
        next.push(incoming);
      }
    };
    const event = new CustomEvent(Customizer.OPEN_EVENT, { detail });
    window.dispatchEvent(event);
    next.sort((a4, b3) => a4.index - b3.index);
    return next;
  }
  function useContextMenu() {
    const messaging2 = useMessaging();
    y2(() => {
      function handler(e4) {
        e4.preventDefault();
        e4.stopImmediatePropagation();
        const items = getItems();
        const simplified = items.filter((x4) => x4.id !== "debug").map((item) => {
          return {
            id: item.id,
            title: item.title
          };
        });
        messaging2.contextMenu({ visibilityMenuItems: simplified });
      }
      document.body.addEventListener("contextmenu", handler);
      return () => {
        document.body.removeEventListener("contextmenu", handler);
      };
    }, [messaging2]);
  }
  function CustomizerButton({ menuId, buttonId, isOpen, toggleMenu, buttonRef }) {
    const { t: t4 } = useTypedTranslation();
    return /* @__PURE__ */ _(
      "button",
      {
        ref: buttonRef,
        className: Customizer_default.customizeButton,
        onClick: toggleMenu,
        "aria-haspopup": "true",
        "aria-expanded": isOpen,
        "aria-controls": menuId,
        id: buttonId
      },
      /* @__PURE__ */ _(CustomizeIcon, null),
      /* @__PURE__ */ _("span", null, t4("ntp_customizer_button"))
    );
  }
  function CustomizerMenuPositionedFixed({ children }) {
    return /* @__PURE__ */ _("div", { class: Customizer_default.lowerRightFixed }, children);
  }
  function useDropdown() {
    const dropdownRef = A2(null);
    const buttonRef = A2(null);
    const [isOpen, setIsOpen] = h2(false);
    y2(() => {
      if (!isOpen) return;
      const handleFocusOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
          setIsOpen(false);
        }
      };
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains?.(event.target)) {
          setIsOpen(false);
        }
      };
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
          buttonRef.current?.focus?.();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("focusin", handleFocusOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("focusin", handleFocusOutside);
      };
    }, [isOpen]);
    return { dropdownRef, buttonRef, isOpen, setIsOpen };
  }
  function useCustomizer({ title, id, icon, toggle, visibility, index }) {
    y2(() => {
      const handler = (e4) => {
        e4.detail.register({ title, id, icon, toggle, visibility, index });
      };
      window.addEventListener(Customizer.OPEN_EVENT, handler);
      return () => window.removeEventListener(Customizer.OPEN_EVENT, handler);
    }, [title, id, icon, toggle, visibility, index]);
    y2(() => {
      window.dispatchEvent(new Event(Customizer.UPDATE_EVENT));
    }, [visibility]);
  }
  var import_classnames2;
  var init_Customizer2 = __esm({
    "pages/new-tab/app/customizer/components/Customizer.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_Customizer();
      init_Icons2();
      import_classnames2 = __toESM(require_classnames(), 1);
      init_types();
      init_VisibilityMenu2();
      Customizer.OPEN_EVENT = "ntp-customizer-open";
      Customizer.UPDATE_EVENT = "ntp-customizer-update";
    }
  });

  // pages/new-tab/app/service.js
  var Service;
  var init_service = __esm({
    "pages/new-tab/app/service.js"() {
      "use strict";
      Service = class {
        eventTarget = new EventTarget();
        DEBOUNCE_TIME_MS = 200;
        /**
         * @param {object} props
         * @param {() => Promise<Data>} [props.initial]
         * @param {(fn: (t: Data) => void) => () => void} [props.subscribe] - optional subscribe
         * @param {(t: Data) => void} [props.persist] - optional persist method
         * @param {(old: Data) => Data} [props.update] - optional updater
         * @param {Data|null} [initial] - optional initial data
         */
        constructor(props, initial) {
          this.impl = props;
          if (initial) {
            this.data = initial;
          } else {
            this.data = null;
          }
        }
        /**
         * @return {Promise<Data>}
         */
        async fetchInitial() {
          if (!this.impl.initial) throw new Error("unreachable");
          const initial = await this.impl.initial();
          this._accept(initial, "initial");
          return (
            /** @type {Data} */
            this.data
          );
        }
        /**
         * This is convenience to prevent the boilerplate of dealing with the
         * eventTarget directly.
         *
         * Consumers pass a callback, which will be invoked with Data and the Source.
         *
         * A function is returned, which can be used to remove the event listener
         *
         * @param {(evt: {data: Data, source: 'manual' | 'subscription'}) => void} cb
         */
        onData(cb) {
          this._setupSubscription();
          const controller = new AbortController();
          this.eventTarget.addEventListener(
            "data",
            (evt) => {
              cb(evt.detail);
            },
            { signal: controller.signal }
          );
          return () => controller.abort();
        }
        /**
         * Remove data subscriptions
         */
        destroy() {
          this.sub?.();
        }
        /**
         * Setup the subscription if one doesn't already exist
         * @private
         */
        _setupSubscription() {
          if (this.sub) return;
          this.sub = this.impl.subscribe?.((data) => {
            this._accept(data, "subscription");
          });
        }
        /**
         * Apply a function over the current state.
         *
         * The change will be broadcast to observers immediately,
         * and then persists after a debounced period.
         *
         * @param {(prev: Data) => Data} updaterFn - the function that returns the next state
         */
        update(updaterFn) {
          if (this.data === null) return;
          const next = updaterFn(this.data);
          if (next) {
            this._accept(next, "manual");
          } else {
            console.warn("could not update");
          }
        }
        /**
         * @param {Data} data
         * @param {'initial' | 'subscription' | 'manual'} source
         * @private
         */
        _accept(data, source) {
          this.data = /** @type {NonNullable<Data>} */
          data;
          if (source === "initial") return;
          this.clearDebounceTimer();
          const dataEvent = new CustomEvent("data", {
            detail: {
              data: this.data,
              source
            }
          });
          this.eventTarget.dispatchEvent(dataEvent);
          if (source === "manual") {
            const time = window.location.search.includes("p2") ? this.DEBOUNCE_TIME_MS * 20.5 : this.DEBOUNCE_TIME_MS;
            this.debounceTimer = setTimeout(() => {
              this.persist();
            }, time);
          }
        }
        /**
         * Clears the debounce timer if it exists, simulating the switchMap behavior.
         */
        clearDebounceTimer() {
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
          }
        }
        /**
         * Persists the current in-memory widget configuration state to the internal data feed.
         */
        persist() {
          if (!this.impl.persist) return;
          if (this.data === null) return;
          this.impl.persist(this.data);
        }
      };
    }
  });

  // pages/new-tab/app/favorites/favorites.service.js
  var FavoritesService;
  var init_favorites_service = __esm({
    "pages/new-tab/app/favorites/favorites.service.js"() {
      "use strict";
      init_service();
      FavoritesService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.ntp = ntp;
          this.dataService = new Service({
            initial: () => ntp.messaging.request("favorites_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("favorites_onDataUpdate", cb)
          });
          this.configService = new Service({
            initial: () => ntp.messaging.request("favorites_getConfig"),
            subscribe: (cb) => ntp.messaging.subscribe("favorites_onConfigUpdate", cb),
            persist: (data) => ntp.messaging.notify("favorites_setConfig", data)
          });
        }
        name() {
          return "FavoritesService";
        }
        /**
         * @returns {Promise<{data: FavoritesData; config: FavoritesConfig}>}
         * @internal
         */
        async getInitial() {
          const p1 = this.configService.fetchInitial();
          const p22 = this.dataService.fetchInitial();
          const [config, data] = await Promise.all([p1, p22]);
          return { config, data };
        }
        /**
         * @internal
         */
        destroy() {
          this.configService.destroy();
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: FavoritesData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @param {(evt: {data: FavoritesConfig, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onConfig(cb) {
          return this.configService.onData(cb);
        }
        /**
         * Update the in-memory data immediate and persist.
         * Any state changes will be broadcast to consumers synchronously
         * @internal
         */
        toggleExpansion() {
          this.configService.update((old) => {
            if (old.expansion === "expanded") {
              return { ...old, expansion: (
                /** @type {const} */
                "collapsed"
              ) };
            } else {
              return { ...old, expansion: (
                /** @type {const} */
                "expanded"
              ) };
            }
          });
        }
        /**
         * @param {FavoritesData} data
         * @param {string} id - entity id to move
         * @param {number} targetIndex - target index
         * @param {number} fromIndex - from index
         * @internal
         */
        setFavoritesOrder(data, id, fromIndex, targetIndex) {
          this.dataService.update((_old) => {
            return data;
          });
          this.ntp.messaging.notify("favorites_move", {
            id,
            targetIndex,
            fromIndex
          });
        }
        /**
         * @param {string} id - entity id
         * @internal
         */
        openContextMenu(id) {
          this.ntp.messaging.notify("favorites_openContextMenu", { id });
        }
        /**
         * @param {string} id - entity id
         * @param {string} url - target url
         * @param {FavoritesOpenAction['target']} target
         * @internal
         */
        openFavorite(id, url4, target) {
          this.ntp.messaging.notify("favorites_open", { id, url: url4, target });
        }
        /**
         * @internal
         */
        add() {
          this.ntp.messaging.notify("favorites_add");
        }
      };
    }
  });

  // pages/new-tab/app/service.hooks.js
  function reducer(state, event) {
    switch (state.status) {
      case "idle": {
        switch (event.kind) {
          case "load-initial": {
            return { ...state, status: (
              /** @type {const} */
              "pending-initial"
            ) };
          }
          default:
            return state;
        }
      }
      case "pending-initial": {
        switch (event.kind) {
          case "initial-data": {
            return {
              ...state,
              status: (
                /** @type {const} */
                "ready"
              ),
              data: event.data,
              config: event.config
            };
          }
          case "error": {
            console.error("error with initial data", event.error);
            return state;
          }
          default:
            return state;
        }
      }
      case "ready": {
        switch (event.kind) {
          case "config": {
            return { ...state, config: event.config };
          }
          case "data": {
            return { ...state, data: event.data };
          }
          case "clear": {
            return { ...state, effect: null };
          }
          default:
            return state;
        }
      }
      default:
        return state;
    }
  }
  function useInitialDataAndConfig({ dispatch, service }) {
    const messaging2 = useMessaging();
    y2(() => {
      if (!service.current) return console.warn("missing service");
      const currentService = service.current;
      async function init2() {
        const { config, data } = await currentService.getInitial();
        if (data) {
          dispatch({ kind: "initial-data", data, config });
        } else {
          dispatch({ kind: "error", error: "missing data from getInitial" });
        }
      }
      dispatch({ kind: "load-initial" });
      init2().catch((e4) => {
        console.error("uncaught error", e4);
        dispatch({ kind: "error", error: e4 });
        messaging2.reportPageException({ message: `${currentService.name()}: failed to fetch initial data+config: ` + e4.message });
      });
      return () => {
        currentService.destroy();
      };
    }, [messaging2]);
  }
  function useInitialData({ dispatch, service }) {
    const messaging2 = useMessaging();
    y2(() => {
      if (!service.current) return console.warn("missing service");
      const currentService = service.current;
      async function init2() {
        const data = await currentService.getInitial();
        if (data) {
          dispatch({ kind: "initial-data", data });
        } else {
          dispatch({ kind: "error", error: "missing data from getInitial" });
        }
      }
      dispatch({ kind: "load-initial" });
      init2().catch((e4) => {
        console.error("uncaught error", e4);
        dispatch({ kind: "error", error: e4 });
        messaging2.reportPageException({ message: `${currentService.name()}: failed to fetch initial data: ` + e4.message });
      });
      return () => {
        currentService.destroy();
      };
    }, []);
  }
  function useDataSubscription({ dispatch, service }) {
    y2(() => {
      if (!service.current) return console.warn("could not access service");
      const unsub = service.current.onData((evt) => {
        dispatch({ kind: "data", data: evt.data });
      });
      return () => {
        unsub();
      };
    }, [service, dispatch]);
  }
  function useConfigSubscription({ dispatch, service }) {
    const toggle = q2(() => {
      service.current?.toggleExpansion();
    }, [service, dispatch]);
    y2(() => {
      if (!service.current) return console.warn("could not access service");
      const unsub2 = service.current.onConfig((data) => {
        dispatch({ kind: "config", config: data.data });
      });
      return () => {
        unsub2();
      };
    }, [service]);
    return { toggle };
  }
  var init_service_hooks = __esm({
    "pages/new-tab/app/service.hooks.js"() {
      "use strict";
      init_hooks_module();
      init_types();
    }
  });

  // pages/new-tab/app/favorites/components/FavoritesProvider.js
  function FavoritesProvider({ children }) {
    const initial = (
      /** @type {State} */
      {
        status: (
          /** @type {const} */
          "idle"
        ),
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService();
    useInitialDataAndConfig({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    const favoritesDidReOrder = q2(
      ({ list: list2, id, fromIndex, targetIndex }) => {
        if (!service.current) return;
        service.current.setFavoritesOrder({ favorites: list2 }, id, fromIndex, targetIndex);
      },
      [service]
    );
    const openContextMenu = q2(
      (id) => {
        if (!service.current) return;
        service.current.openContextMenu(id);
      },
      [service]
    );
    const openFavorite = q2(
      (id, url4, target) => {
        if (!service.current) return;
        service.current.openFavorite(id, url4, target);
      },
      [service]
    );
    const add = q2(() => {
      if (!service.current) return;
      service.current.add();
    }, [service]);
    const onConfigChanged = q2(
      (cb) => {
        if (!service.current) return;
        return service.current.onConfig((event) => {
          if (event.source === "manual") {
            cb(event.data);
          }
        });
      },
      [service]
    );
    return /* @__PURE__ */ _(FavoritesContext.Provider, { value: { state, toggle, favoritesDidReOrder, openFavorite, openContextMenu, add, onConfigChanged } }, /* @__PURE__ */ _(FavoritesDispatchContext.Provider, { value: dispatch }, children));
  }
  function useService() {
    const service = A2(
      /** @type {FavoritesService | null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new FavoritesService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var FavoritesContext, FavoritesDispatchContext;
  var init_FavoritesProvider = __esm({
    "pages/new-tab/app/favorites/components/FavoritesProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_favorites_service();
      init_types();
      init_service_hooks();
      FavoritesContext = G({
        /** @type {import('../../service.hooks.js').State<FavoritesData, FavoritesConfig>} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        toggle: () => {
          throw new Error("must implement");
        },
        /** @type {ReorderFn<Favorite>} */
        favoritesDidReOrder: ({ list: list2, id, fromIndex, targetIndex }) => {
          throw new Error("must implement");
        },
        /** @type {(id: string) => void} */
        openContextMenu: (id) => {
          throw new Error("must implement");
        },
        /** @type {(id: string, url: string, target: OpenTarget) => void} */
        openFavorite: (id, target) => {
          throw new Error("must implement");
        },
        /** @type {() => void} */
        add: () => {
          throw new Error("must implement add");
        },
        /** @type {(cb: (data: FavoritesConfig) => void) => void} */
        onConfigChanged: (cb) => {
        }
      });
      FavoritesDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js
  function _arrayWithHoles(r4) {
    if (Array.isArray(r4)) return r4;
  }
  var init_arrayWithHoles = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
  function _iterableToArrayLimit(r4, l5) {
    var t4 = null == r4 ? null : "undefined" != typeof Symbol && r4[Symbol.iterator] || r4["@@iterator"];
    if (null != t4) {
      var e4, n3, i5, u4, a4 = [], f4 = true, o4 = false;
      try {
        if (i5 = (t4 = t4.call(r4)).next, 0 === l5) {
          if (Object(t4) !== t4) return;
          f4 = false;
        } else for (; !(f4 = (e4 = i5.call(t4)).done) && (a4.push(e4.value), a4.length !== l5); f4 = true) ;
      } catch (r5) {
        o4 = true, n3 = r5;
      } finally {
        try {
          if (!f4 && null != t4["return"] && (u4 = t4["return"](), Object(u4) !== u4)) return;
        } finally {
          if (o4) throw n3;
        }
      }
      return a4;
    }
  }
  var init_iterableToArrayLimit = __esm({
    "../node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
  function _arrayLikeToArray(r4, a4) {
    (null == a4 || a4 > r4.length) && (a4 = r4.length);
    for (var e4 = 0, n3 = Array(a4); e4 < a4; e4++) n3[e4] = r4[e4];
    return n3;
  }
  var init_arrayLikeToArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js
  function _unsupportedIterableToArray(r4, a4) {
    if (r4) {
      if ("string" == typeof r4) return _arrayLikeToArray(r4, a4);
      var t4 = {}.toString.call(r4).slice(8, -1);
      return "Object" === t4 && r4.constructor && (t4 = r4.constructor.name), "Map" === t4 || "Set" === t4 ? Array.from(r4) : "Arguments" === t4 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t4) ? _arrayLikeToArray(r4, a4) : void 0;
    }
  }
  var init_unsupportedIterableToArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js"() {
      init_arrayLikeToArray();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/nonIterableRest.js
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var init_nonIterableRest = __esm({
    "../node_modules/@babel/runtime/helpers/esm/nonIterableRest.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/slicedToArray.js
  function _slicedToArray(r4, e4) {
    return _arrayWithHoles(r4) || _iterableToArrayLimit(r4, e4) || _unsupportedIterableToArray(r4, e4) || _nonIterableRest();
  }
  var init_slicedToArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/slicedToArray.js"() {
      init_arrayWithHoles();
      init_iterableToArrayLimit();
      init_unsupportedIterableToArray();
      init_nonIterableRest();
    }
  });

  // ../node_modules/bind-event-listener/dist/bind.js
  var require_bind = __commonJS({
    "../node_modules/bind-event-listener/dist/bind.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bind = void 0;
      function bind4(target, _a) {
        var type = _a.type, listener = _a.listener, options = _a.options;
        target.addEventListener(type, listener, options);
        return function unbind() {
          target.removeEventListener(type, listener, options);
        };
      }
      exports.bind = bind4;
    }
  });

  // ../node_modules/bind-event-listener/dist/bind-all.js
  var require_bind_all = __commonJS({
    "../node_modules/bind-event-listener/dist/bind-all.js"(exports) {
      "use strict";
      var __assign = exports && exports.__assign || function() {
        __assign = Object.assign || function(t4) {
          for (var s5, i5 = 1, n3 = arguments.length; i5 < n3; i5++) {
            s5 = arguments[i5];
            for (var p5 in s5) if (Object.prototype.hasOwnProperty.call(s5, p5))
              t4[p5] = s5[p5];
          }
          return t4;
        };
        return __assign.apply(this, arguments);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bindAll = void 0;
      var bind_1 = require_bind();
      function toOptions(value) {
        if (typeof value === "undefined") {
          return void 0;
        }
        if (typeof value === "boolean") {
          return {
            capture: value
          };
        }
        return value;
      }
      function getBinding(original, sharedOptions) {
        if (sharedOptions == null) {
          return original;
        }
        var binding = __assign(__assign({}, original), { options: __assign(__assign({}, toOptions(sharedOptions)), toOptions(original.options)) });
        return binding;
      }
      function bindAll5(target, bindings, sharedOptions) {
        var unbinds = bindings.map(function(original) {
          var binding = getBinding(original, sharedOptions);
          return (0, bind_1.bind)(target, binding);
        });
        return function unbindAll() {
          unbinds.forEach(function(unbind) {
            return unbind();
          });
        };
      }
      exports.bindAll = bindAll5;
    }
  });

  // ../node_modules/bind-event-listener/dist/index.js
  var require_dist = __commonJS({
    "../node_modules/bind-event-listener/dist/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bindAll = exports.bind = void 0;
      var bind_1 = require_bind();
      Object.defineProperty(exports, "bind", { enumerable: true, get: function() {
        return bind_1.bind;
      } });
      var bind_all_1 = require_bind_all();
      Object.defineProperty(exports, "bindAll", { enumerable: true, get: function() {
        return bind_all_1.bindAll;
      } });
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/honey-pot-data-attribute.js
  var honeyPotDataAttribute;
  var init_honey_pot_data_attribute = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/honey-pot-data-attribute.js"() {
      honeyPotDataAttribute = "data-pdnd-honey-pot";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/is-honey-pot-element.js
  function isHoneyPotElement(target) {
    return target instanceof Element && target.hasAttribute(honeyPotDataAttribute);
  }
  var init_is_honey_pot_element = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/is-honey-pot-element.js"() {
      init_honey_pot_data_attribute();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/get-element-from-point-without-honey-pot.js
  function getElementFromPointWithoutHoneypot(client) {
    var _document$elementsFro = document.elementsFromPoint(client.x, client.y), _document$elementsFro2 = _slicedToArray(_document$elementsFro, 2), top2 = _document$elementsFro2[0], second = _document$elementsFro2[1];
    if (!top2) {
      return null;
    }
    if (isHoneyPotElement(top2)) {
      return second !== null && second !== void 0 ? second : null;
    }
    return top2;
  }
  var init_get_element_from_point_without_honey_pot = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/get-element-from-point-without-honey-pot.js"() {
      init_slicedToArray();
      init_is_honey_pot_element();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/typeof.js
  function _typeof(o4) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o5) {
      return typeof o5;
    } : function(o5) {
      return o5 && "function" == typeof Symbol && o5.constructor === Symbol && o5 !== Symbol.prototype ? "symbol" : typeof o5;
    }, _typeof(o4);
  }
  var init_typeof = __esm({
    "../node_modules/@babel/runtime/helpers/esm/typeof.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/toPrimitive.js
  function toPrimitive(t4, r4) {
    if ("object" != _typeof(t4) || !t4) return t4;
    var e4 = t4[Symbol.toPrimitive];
    if (void 0 !== e4) {
      var i5 = e4.call(t4, r4 || "default");
      if ("object" != _typeof(i5)) return i5;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r4 ? String : Number)(t4);
  }
  var init_toPrimitive = __esm({
    "../node_modules/@babel/runtime/helpers/esm/toPrimitive.js"() {
      init_typeof();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
  function toPropertyKey(t4) {
    var i5 = toPrimitive(t4, "string");
    return "symbol" == _typeof(i5) ? i5 : i5 + "";
  }
  var init_toPropertyKey = __esm({
    "../node_modules/@babel/runtime/helpers/esm/toPropertyKey.js"() {
      init_typeof();
      init_toPrimitive();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/defineProperty.js
  function _defineProperty(e4, r4, t4) {
    return (r4 = toPropertyKey(r4)) in e4 ? Object.defineProperty(e4, r4, {
      value: t4,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e4[r4] = t4, e4;
  }
  var init_defineProperty = __esm({
    "../node_modules/@babel/runtime/helpers/esm/defineProperty.js"() {
      init_toPropertyKey();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/max-z-index.js
  var maxZIndex;
  var init_max_z_index = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/max-z-index.js"() {
      maxZIndex = 2147483647;
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/make-honey-pot-fix.js
  function ownKeys(e4, r4) {
    var t4 = Object.keys(e4);
    if (Object.getOwnPropertySymbols) {
      var o4 = Object.getOwnPropertySymbols(e4);
      r4 && (o4 = o4.filter(function(r5) {
        return Object.getOwnPropertyDescriptor(e4, r5).enumerable;
      })), t4.push.apply(t4, o4);
    }
    return t4;
  }
  function _objectSpread(e4) {
    for (var r4 = 1; r4 < arguments.length; r4++) {
      var t4 = null != arguments[r4] ? arguments[r4] : {};
      r4 % 2 ? ownKeys(Object(t4), true).forEach(function(r5) {
        _defineProperty(e4, r5, t4[r5]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e4, Object.getOwnPropertyDescriptors(t4)) : ownKeys(Object(t4)).forEach(function(r5) {
        Object.defineProperty(e4, r5, Object.getOwnPropertyDescriptor(t4, r5));
      });
    }
    return e4;
  }
  function floorToClosestPixel(point) {
    return {
      x: Math.floor(point.x),
      y: Math.floor(point.y)
    };
  }
  function pullBackByHalfHoneyPotSize(point) {
    return {
      x: point.x - halfHoneyPotSize,
      y: point.y - halfHoneyPotSize
    };
  }
  function preventGoingBackwardsOffScreen(point) {
    return {
      x: Math.max(point.x, 0),
      y: Math.max(point.y, 0)
    };
  }
  function preventGoingForwardsOffScreen(point) {
    return {
      x: Math.min(point.x, window.innerWidth - honeyPotSize),
      y: Math.min(point.y, window.innerHeight - honeyPotSize)
    };
  }
  function getHoneyPotRectFor(_ref) {
    var client = _ref.client;
    var point = preventGoingForwardsOffScreen(preventGoingBackwardsOffScreen(pullBackByHalfHoneyPotSize(floorToClosestPixel(client))));
    return DOMRect.fromRect({
      x: point.x,
      y: point.y,
      width: honeyPotSize,
      height: honeyPotSize
    });
  }
  function getRectStyles(_ref2) {
    var clientRect = _ref2.clientRect;
    return {
      left: "".concat(clientRect.left, "px"),
      top: "".concat(clientRect.top, "px"),
      width: "".concat(clientRect.width, "px"),
      height: "".concat(clientRect.height, "px")
    };
  }
  function isWithin(_ref3) {
    var client = _ref3.client, clientRect = _ref3.clientRect;
    return (
      // is within horizontal bounds
      client.x >= clientRect.x && client.x <= clientRect.x + clientRect.width && // is within vertical bounds
      client.y >= clientRect.y && client.y <= clientRect.y + clientRect.height
    );
  }
  function mountHoneyPot(_ref4) {
    var initial = _ref4.initial;
    var element = document.createElement("div");
    element.setAttribute(honeyPotDataAttribute, "true");
    var clientRect = getHoneyPotRectFor({
      client: initial
    });
    Object.assign(element.style, _objectSpread(_objectSpread({
      // Setting a background color explicitly to avoid any inherited styles.
      // Looks like this could be `opacity: 0`, but worried that _might_
      // cause the element to be ignored on some platforms.
      // When debugging, set backgroundColor to something like "red".
      backgroundColor: "transparent",
      position: "fixed",
      // Being explicit to avoid inheriting styles
      padding: 0,
      margin: 0,
      boxSizing: "border-box"
    }, getRectStyles({
      clientRect
    })), {}, {
      // We want this element to absorb pointer events,
      // it's kind of the whole point 😉
      pointerEvents: "auto",
      // Want to make sure the honey pot is top of everything else.
      // Don't need to worry about native drag previews, as they will
      // have been rendered (and removed) before the honey pot is rendered
      zIndex: maxZIndex
    }));
    document.body.appendChild(element);
    var unbindPointerMove = (0, import_bind_event_listener.bind)(window, {
      type: "pointermove",
      listener: function listener(event) {
        var client = {
          x: event.clientX,
          y: event.clientY
        };
        clientRect = getHoneyPotRectFor({
          client
        });
        Object.assign(element.style, getRectStyles({
          clientRect
        }));
      },
      // using capture so we are less likely to be impacted by event stopping
      options: {
        capture: true
      }
    });
    return function finish(_ref5) {
      var current = _ref5.current;
      unbindPointerMove();
      if (isWithin({
        client: current,
        clientRect
      })) {
        element.remove();
        return;
      }
      function cleanup() {
        unbindPostDragEvents();
        element.remove();
      }
      var unbindPostDragEvents = (0, import_bind_event_listener.bindAll)(window, [
        {
          type: "pointerdown",
          listener: cleanup
        },
        {
          type: "pointermove",
          listener: cleanup
        },
        {
          type: "focusin",
          listener: cleanup
        },
        {
          type: "focusout",
          listener: cleanup
        },
        // a 'pointerdown' should happen before 'dragstart', but just being super safe
        {
          type: "dragstart",
          listener: cleanup
        },
        // if the user has dragged something out of the window
        // and then is dragging something back into the window
        // the first events we will see are "dragenter" (and then "dragover").
        // So if we see any of these we need to clear the post drag fix.
        {
          type: "dragenter",
          listener: cleanup
        },
        {
          type: "dragover",
          listener: cleanup
        }
        // Not adding a "wheel" event listener, as "wheel" by itself does not
        // resolve the bug.
      ], {
        // Using `capture` so less likely to be impacted by other code stopping events
        capture: true
      });
    };
  }
  function makeHoneyPotFix() {
    var latestPointerMove = null;
    function bindEvents() {
      latestPointerMove = null;
      return (0, import_bind_event_listener.bind)(window, {
        type: "pointermove",
        listener: function listener(event) {
          latestPointerMove = {
            x: event.clientX,
            y: event.clientY
          };
        },
        // listening for pointer move in capture phase
        // so we are less likely to be impacted by events being stopped.
        options: {
          capture: true
        }
      });
    }
    function getOnPostDispatch() {
      var finish = null;
      return function onPostEvent(_ref6) {
        var eventName = _ref6.eventName, payload = _ref6.payload;
        if (eventName === "onDragStart") {
          var _latestPointerMove;
          var input = payload.location.initial.input;
          var initial = (_latestPointerMove = latestPointerMove) !== null && _latestPointerMove !== void 0 ? _latestPointerMove : {
            x: input.clientX,
            y: input.clientY
          };
          finish = mountHoneyPot({
            initial
          });
        }
        if (eventName === "onDrop") {
          var _finish;
          var _input = payload.location.current.input;
          (_finish = finish) === null || _finish === void 0 || _finish({
            current: {
              x: _input.clientX,
              y: _input.clientY
            }
          });
          finish = null;
          latestPointerMove = null;
        }
      };
    }
    return {
      bindEvents,
      getOnPostDispatch
    };
  }
  var import_bind_event_listener, honeyPotSize, halfHoneyPotSize;
  var init_make_honey_pot_fix = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/make-honey-pot-fix.js"() {
      init_defineProperty();
      import_bind_event_listener = __toESM(require_dist());
      init_max_z_index();
      init_honey_pot_data_attribute();
      honeyPotSize = 2;
      halfHoneyPotSize = honeyPotSize / 2;
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js
  function _arrayWithoutHoles(r4) {
    if (Array.isArray(r4)) return _arrayLikeToArray(r4);
  }
  var init_arrayWithoutHoles = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js"() {
      init_arrayLikeToArray();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/iterableToArray.js
  function _iterableToArray(r4) {
    if ("undefined" != typeof Symbol && null != r4[Symbol.iterator] || null != r4["@@iterator"]) return Array.from(r4);
  }
  var init_iterableToArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/iterableToArray.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var init_nonIterableSpread = __esm({
    "../node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/toConsumableArray.js
  function _toConsumableArray(r4) {
    return _arrayWithoutHoles(r4) || _iterableToArray(r4) || _unsupportedIterableToArray(r4) || _nonIterableSpread();
  }
  var init_toConsumableArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/toConsumableArray.js"() {
      init_arrayWithoutHoles();
      init_iterableToArray();
      init_unsupportedIterableToArray();
      init_nonIterableSpread();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/once.js
  function once(fn) {
    var cache = null;
    return function wrapped() {
      if (!cache) {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        var result = fn.apply(this, args);
        cache = {
          result
        };
      }
      return cache.result;
    };
  }
  var init_once = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/once.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-firefox.js
  var isFirefox;
  var init_is_firefox = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-firefox.js"() {
      init_once();
      isFirefox = once(function isFirefox2() {
        if (false) {
          return false;
        }
        return navigator.userAgent.includes("Firefox");
      });
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-safari.js
  var isSafari;
  var init_is_safari = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-safari.js"() {
      init_once();
      isSafari = once(function isSafari2() {
        if (false) {
          return false;
        }
        var _navigator = navigator, userAgent = _navigator.userAgent;
        return userAgent.includes("AppleWebKit") && !userAgent.includes("Chrome");
      });
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/count-events-for-safari.js
  function isEnteringWindowInSafari(_ref) {
    var dragEnter = _ref.dragEnter;
    if (!isSafari()) {
      return false;
    }
    return dragEnter.hasOwnProperty(symbols.isEnteringWindow);
  }
  function isLeavingWindowInSafari(_ref2) {
    var dragLeave = _ref2.dragLeave;
    if (!isSafari()) {
      return false;
    }
    return dragLeave.hasOwnProperty(symbols.isLeavingWindow);
  }
  var import_bind_event_listener2, symbols;
  var init_count_events_for_safari = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/count-events-for-safari.js"() {
      import_bind_event_listener2 = __toESM(require_dist());
      init_is_safari();
      symbols = {
        isLeavingWindow: Symbol("leaving"),
        isEnteringWindow: Symbol("entering")
      };
      (function fixSafari() {
        if (typeof window === "undefined") {
          return;
        }
        if (false) {
          return;
        }
        if (!isSafari()) {
          return;
        }
        function getInitialState() {
          return {
            enterCount: 0,
            isOverWindow: false
          };
        }
        var state = getInitialState();
        function resetState() {
          state = getInitialState();
        }
        (0, import_bind_event_listener2.bindAll)(
          window,
          [{
            type: "dragstart",
            listener: function listener() {
              state.enterCount = 0;
              state.isOverWindow = true;
            }
          }, {
            type: "drop",
            listener: resetState
          }, {
            type: "dragend",
            listener: resetState
          }, {
            type: "dragenter",
            listener: function listener(event) {
              if (!state.isOverWindow && state.enterCount === 0) {
                event[symbols.isEnteringWindow] = true;
              }
              state.isOverWindow = true;
              state.enterCount++;
            }
          }, {
            type: "dragleave",
            listener: function listener(event) {
              state.enterCount--;
              if (state.isOverWindow && state.enterCount === 0) {
                event[symbols.isLeavingWindow] = true;
                state.isOverWindow = false;
              }
            }
          }],
          // using `capture: true` so that adding event listeners
          // in bubble phase will have the correct symbols
          {
            capture: true
          }
        );
      })();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-from-another-window.js
  function isNodeLike(target) {
    return "nodeName" in target;
  }
  function isFromAnotherWindow(eventTarget) {
    return isNodeLike(eventTarget) && eventTarget.ownerDocument !== document;
  }
  var init_is_from_another_window = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-from-another-window.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-leaving-window.js
  function isLeavingWindow(_ref) {
    var dragLeave = _ref.dragLeave;
    var type = dragLeave.type, relatedTarget = dragLeave.relatedTarget;
    if (type !== "dragleave") {
      return false;
    }
    if (isSafari()) {
      return isLeavingWindowInSafari({
        dragLeave
      });
    }
    if (relatedTarget == null) {
      return true;
    }
    if (isFirefox()) {
      return isFromAnotherWindow(relatedTarget);
    }
    return relatedTarget instanceof HTMLIFrameElement;
  }
  var init_is_leaving_window = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-leaving-window.js"() {
      init_is_firefox();
      init_is_safari();
      init_count_events_for_safari();
      init_is_from_another_window();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/detect-broken-drag.js
  function getBindingsForBrokenDrags(_ref) {
    var onDragEnd = _ref.onDragEnd;
    return [
      // ## Detecting drag ending for removed draggables
      //
      // If a draggable element is removed during a drag and the user drops:
      // 1. if over a valid drop target: we get a "drop" event to know the drag is finished
      // 2. if not over a valid drop target (or cancelled): we get nothing
      // The "dragend" event will not fire on the source draggable if it has been
      // removed from the DOM.
      // So we need to figure out if a drag operation has finished by looking at other events
      // We can do this by looking at other events
      // ### First detection: "pointermove" events
      // 1. "pointermove" events cannot fire during a drag and drop operation
      // according to the spec. So if we get a "pointermove" it means that
      // the drag and drop operations has finished. So if we get a "pointermove"
      // we know that the drag is over
      // 2. 🦊😤 Drag and drop operations are _supposed_ to suppress
      // other pointer events. However, firefox will allow a few
      // pointer event to get through after a drag starts.
      // The most I've seen is 3
      {
        type: "pointermove",
        listener: /* @__PURE__ */ function() {
          var callCount = 0;
          return function listener() {
            if (callCount < 20) {
              callCount++;
              return;
            }
            onDragEnd();
          };
        }()
      },
      // ### Second detection: "pointerdown" events
      // If we receive this event then we know that a drag operation has finished
      // and potentially another one is about to start.
      // Note: `pointerdown` fires on all browsers / platforms before "dragstart"
      {
        type: "pointerdown",
        listener: onDragEnd
      }
    ];
  }
  var init_detect_broken_drag = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/detect-broken-drag.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/get-input.js
  function getInput(event) {
    return {
      altKey: event.altKey,
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    };
  }
  var init_get_input = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/get-input.js"() {
    }
  });

  // ../node_modules/raf-schd/dist/raf-schd.esm.js
  var rafSchd, raf_schd_esm_default;
  var init_raf_schd_esm = __esm({
    "../node_modules/raf-schd/dist/raf-schd.esm.js"() {
      rafSchd = function rafSchd2(fn) {
        var lastArgs = [];
        var frameId = null;
        var wrapperFn = function wrapperFn2() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          lastArgs = args;
          if (frameId) {
            return;
          }
          frameId = requestAnimationFrame(function() {
            frameId = null;
            fn.apply(void 0, lastArgs);
          });
        };
        wrapperFn.cancel = function() {
          if (!frameId) {
            return;
          }
          cancelAnimationFrame(frameId);
          frameId = null;
        };
        return wrapperFn;
      };
      raf_schd_esm_default = rafSchd;
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/dispatch-consumer-event.js
  function makeDispatch(_ref) {
    var source = _ref.source, initial = _ref.initial, dispatchEvent = _ref.dispatchEvent;
    var previous = {
      dropTargets: []
    };
    function safeDispatch(args) {
      dispatchEvent(args);
      previous = {
        dropTargets: args.payload.location.current.dropTargets
      };
    }
    var dispatch = {
      start: function start2(_ref2) {
        var nativeSetDragImage = _ref2.nativeSetDragImage;
        var location2 = {
          current: initial,
          previous,
          initial
        };
        safeDispatch({
          eventName: "onGenerateDragPreview",
          payload: {
            source,
            location: location2,
            nativeSetDragImage
          }
        });
        dragStart.schedule(function() {
          safeDispatch({
            eventName: "onDragStart",
            payload: {
              source,
              location: location2
            }
          });
        });
      },
      dragUpdate: function dragUpdate(_ref3) {
        var current = _ref3.current;
        dragStart.flush();
        scheduleOnDrag.cancel();
        safeDispatch({
          eventName: "onDropTargetChange",
          payload: {
            source,
            location: {
              initial,
              previous,
              current
            }
          }
        });
      },
      drag: function drag(_ref4) {
        var current = _ref4.current;
        scheduleOnDrag(function() {
          dragStart.flush();
          var location2 = {
            initial,
            previous,
            current
          };
          safeDispatch({
            eventName: "onDrag",
            payload: {
              source,
              location: location2
            }
          });
        });
      },
      drop: function drop(_ref5) {
        var current = _ref5.current, updatedSourcePayload = _ref5.updatedSourcePayload;
        dragStart.flush();
        scheduleOnDrag.cancel();
        safeDispatch({
          eventName: "onDrop",
          payload: {
            source: updatedSourcePayload !== null && updatedSourcePayload !== void 0 ? updatedSourcePayload : source,
            location: {
              current,
              previous,
              initial
            }
          }
        });
      }
    };
    return dispatch;
  }
  var scheduleOnDrag, dragStart;
  var init_dispatch_consumer_event = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/dispatch-consumer-event.js"() {
      init_raf_schd_esm();
      scheduleOnDrag = raf_schd_esm_default(function(fn) {
        return fn();
      });
      dragStart = /* @__PURE__ */ function() {
        var scheduled = null;
        function schedule(fn) {
          var frameId = requestAnimationFrame(function() {
            scheduled = null;
            fn();
          });
          scheduled = {
            frameId,
            fn
          };
        }
        function flush() {
          if (scheduled) {
            cancelAnimationFrame(scheduled.frameId);
            scheduled.fn();
            scheduled = null;
          }
        }
        return {
          schedule,
          flush
        };
      }();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/lifecycle-manager.js
  function canStart() {
    return !globalState.isActive;
  }
  function getNativeSetDragImage(event) {
    if (event.dataTransfer) {
      return event.dataTransfer.setDragImage.bind(event.dataTransfer);
    }
    return null;
  }
  function hasHierarchyChanged(_ref) {
    var current = _ref.current, next = _ref.next;
    if (current.length !== next.length) {
      return true;
    }
    for (var i5 = 0; i5 < current.length; i5++) {
      if (current[i5].element !== next[i5].element) {
        return true;
      }
    }
    return false;
  }
  function start(_ref2) {
    var event = _ref2.event, dragType = _ref2.dragType, getDropTargetsOver = _ref2.getDropTargetsOver, dispatchEvent = _ref2.dispatchEvent;
    if (!canStart()) {
      return;
    }
    var initial = getStartLocation({
      event,
      dragType,
      getDropTargetsOver
    });
    globalState.isActive = true;
    var state = {
      current: initial
    };
    setDropEffectOnEvent({
      event,
      current: initial.dropTargets
    });
    var dispatch = makeDispatch({
      source: dragType.payload,
      dispatchEvent,
      initial
    });
    function updateState(next) {
      var hasChanged = hasHierarchyChanged({
        current: state.current.dropTargets,
        next: next.dropTargets
      });
      state.current = next;
      if (hasChanged) {
        dispatch.dragUpdate({
          current: state.current
        });
      }
    }
    function onUpdateEvent(event2) {
      var input = getInput(event2);
      var target = isHoneyPotElement(event2.target) ? getElementFromPointWithoutHoneypot({
        x: input.clientX,
        y: input.clientY
      }) : event2.target;
      var nextDropTargets = getDropTargetsOver({
        target,
        input,
        source: dragType.payload,
        current: state.current.dropTargets
      });
      if (nextDropTargets.length) {
        event2.preventDefault();
        setDropEffectOnEvent({
          event: event2,
          current: nextDropTargets
        });
      }
      updateState({
        dropTargets: nextDropTargets,
        input
      });
    }
    function cancel() {
      if (state.current.dropTargets.length) {
        updateState({
          dropTargets: [],
          input: state.current.input
        });
      }
      dispatch.drop({
        current: state.current,
        updatedSourcePayload: null
      });
      finish();
    }
    function finish() {
      globalState.isActive = false;
      unbindEvents();
    }
    var unbindEvents = (0, import_bind_event_listener3.bindAll)(
      window,
      [{
        // 👋 Note: we are repurposing the `dragover` event as our `drag` event
        // this is because firefox does not publish pointer coordinates during
        // a `drag` event, but does for every other type of drag event
        // `dragover` fires on all elements that are being dragged over
        // Because we are binding to `window` - our `dragover` is effectively the same as a `drag`
        // 🦊😤
        type: "dragover",
        listener: function listener(event2) {
          onUpdateEvent(event2);
          dispatch.drag({
            current: state.current
          });
        }
      }, {
        type: "dragenter",
        listener: onUpdateEvent
      }, {
        type: "dragleave",
        listener: function listener(event2) {
          if (!isLeavingWindow({
            dragLeave: event2
          })) {
            return;
          }
          updateState({
            input: state.current.input,
            dropTargets: []
          });
          if (dragType.startedFrom === "external") {
            cancel();
          }
        }
      }, {
        // A "drop" can only happen if the browser allowed the drop
        type: "drop",
        listener: function listener(event2) {
          state.current = {
            dropTargets: state.current.dropTargets,
            input: getInput(event2)
          };
          if (!state.current.dropTargets.length) {
            cancel();
            return;
          }
          event2.preventDefault();
          setDropEffectOnEvent({
            event: event2,
            current: state.current.dropTargets
          });
          dispatch.drop({
            current: state.current,
            // When dropping something native, we need to extract the latest
            // `.items` from the "drop" event as it is now accessible
            updatedSourcePayload: dragType.type === "external" ? dragType.getDropPayload(event2) : null
          });
          finish();
        }
      }, {
        // "dragend" fires when on the drag source (eg a draggable element)
        // when the drag is finished.
        // "dragend" will fire after "drop" (if there was a successful drop)
        // "dragend" does not fire if the draggable source has been removed during the drag
        // or for external drag sources (eg files)
        // This "dragend" listener will not fire if there was a successful drop
        // as we will have already removed the event listener
        type: "dragend",
        listener: function listener(event2) {
          state.current = {
            dropTargets: state.current.dropTargets,
            input: getInput(event2)
          };
          cancel();
        }
      }].concat(_toConsumableArray(getBindingsForBrokenDrags({
        onDragEnd: cancel
      }))),
      // Once we have started a managed drag operation it is important that we see / own all drag events
      // We got one adoption bug pop up where some code was stopping (`event.stopPropagation()`)
      // all "drop" events in the bubble phase on the `document.body`.
      // This meant that we never saw the "drop" event.
      {
        capture: true
      }
    );
    dispatch.start({
      nativeSetDragImage: getNativeSetDragImage(event)
    });
  }
  function setDropEffectOnEvent(_ref3) {
    var _current$;
    var event = _ref3.event, current = _ref3.current;
    var innerMost = (_current$ = current[0]) === null || _current$ === void 0 ? void 0 : _current$.dropEffect;
    if (innerMost != null && event.dataTransfer) {
      event.dataTransfer.dropEffect = innerMost;
    }
  }
  function getStartLocation(_ref4) {
    var event = _ref4.event, dragType = _ref4.dragType, getDropTargetsOver = _ref4.getDropTargetsOver;
    var input = getInput(event);
    if (dragType.startedFrom === "external") {
      return {
        input,
        dropTargets: []
      };
    }
    var dropTargets = getDropTargetsOver({
      input,
      source: dragType.payload,
      target: event.target,
      current: []
    });
    return {
      input,
      dropTargets
    };
  }
  var import_bind_event_listener3, globalState, lifecycle;
  var init_lifecycle_manager = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/lifecycle-manager.js"() {
      init_toConsumableArray();
      import_bind_event_listener3 = __toESM(require_dist());
      init_get_element_from_point_without_honey_pot();
      init_is_honey_pot_element();
      init_is_leaving_window();
      init_detect_broken_drag();
      init_get_input();
      init_dispatch_consumer_event();
      globalState = {
        isActive: false
      };
      lifecycle = {
        canStart,
        start
      };
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/usage-ledger.js
  function registerUsage(_ref) {
    var typeKey = _ref.typeKey, mount3 = _ref.mount;
    var entry = ledger.get(typeKey);
    if (entry) {
      entry.usageCount++;
      return entry;
    }
    var initial = {
      typeKey,
      unmount: mount3(),
      usageCount: 1
    };
    ledger.set(typeKey, initial);
    return initial;
  }
  function register(args) {
    var entry = registerUsage(args);
    return function unregister() {
      entry.usageCount--;
      if (entry.usageCount > 0) {
        return;
      }
      entry.unmount();
      ledger.delete(args.typeKey);
    };
  }
  var ledger;
  var init_usage_ledger = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/usage-ledger.js"() {
      ledger = /* @__PURE__ */ new Map();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/combine.js
  function combine() {
    for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
      fns[_key] = arguments[_key];
    }
    return function cleanup() {
      fns.forEach(function(fn) {
        return fn();
      });
    };
  }
  var init_combine = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/combine.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/add-attribute.js
  function addAttribute(element, _ref) {
    var attribute = _ref.attribute, value = _ref.value;
    element.setAttribute(attribute, value);
    return function() {
      return element.removeAttribute(attribute);
    };
  }
  var init_add_attribute = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/add-attribute.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-drop-target.js
  function ownKeys2(e4, r4) {
    var t4 = Object.keys(e4);
    if (Object.getOwnPropertySymbols) {
      var o4 = Object.getOwnPropertySymbols(e4);
      r4 && (o4 = o4.filter(function(r5) {
        return Object.getOwnPropertyDescriptor(e4, r5).enumerable;
      })), t4.push.apply(t4, o4);
    }
    return t4;
  }
  function _objectSpread2(e4) {
    for (var r4 = 1; r4 < arguments.length; r4++) {
      var t4 = null != arguments[r4] ? arguments[r4] : {};
      r4 % 2 ? ownKeys2(Object(t4), true).forEach(function(r5) {
        _defineProperty(e4, r5, t4[r5]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e4, Object.getOwnPropertyDescriptors(t4)) : ownKeys2(Object(t4)).forEach(function(r5) {
        Object.defineProperty(e4, r5, Object.getOwnPropertyDescriptor(t4, r5));
      });
    }
    return e4;
  }
  function _createForOfIteratorHelper(r4, e4) {
    var t4 = "undefined" != typeof Symbol && r4[Symbol.iterator] || r4["@@iterator"];
    if (!t4) {
      if (Array.isArray(r4) || (t4 = _unsupportedIterableToArray2(r4)) || e4 && r4 && "number" == typeof r4.length) {
        t4 && (r4 = t4);
        var _n = 0, F4 = function F5() {
        };
        return { s: F4, n: function n3() {
          return _n >= r4.length ? { done: true } : { done: false, value: r4[_n++] };
        }, e: function e5(r5) {
          throw r5;
        }, f: F4 };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o4, a4 = true, u4 = false;
    return { s: function s5() {
      t4 = t4.call(r4);
    }, n: function n3() {
      var r5 = t4.next();
      return a4 = r5.done, r5;
    }, e: function e5(r5) {
      u4 = true, o4 = r5;
    }, f: function f4() {
      try {
        a4 || null == t4.return || t4.return();
      } finally {
        if (u4) throw o4;
      }
    } };
  }
  function _unsupportedIterableToArray2(r4, a4) {
    if (r4) {
      if ("string" == typeof r4) return _arrayLikeToArray2(r4, a4);
      var t4 = {}.toString.call(r4).slice(8, -1);
      return "Object" === t4 && r4.constructor && (t4 = r4.constructor.name), "Map" === t4 || "Set" === t4 ? Array.from(r4) : "Arguments" === t4 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t4) ? _arrayLikeToArray2(r4, a4) : void 0;
    }
  }
  function _arrayLikeToArray2(r4, a4) {
    (null == a4 || a4 > r4.length) && (a4 = r4.length);
    for (var e4 = 0, n3 = Array(a4); e4 < a4; e4++) n3[e4] = r4[e4];
    return n3;
  }
  function copyReverse(array) {
    return array.slice(0).reverse();
  }
  function makeDropTarget(_ref) {
    var typeKey = _ref.typeKey, defaultDropEffect = _ref.defaultDropEffect;
    var registry = /* @__PURE__ */ new WeakMap();
    var dropTargetDataAtt = "data-drop-target-for-".concat(typeKey);
    var dropTargetSelector = "[".concat(dropTargetDataAtt, "]");
    function addToRegistry2(args) {
      registry.set(args.element, args);
      return function() {
        return registry.delete(args.element);
      };
    }
    function dropTargetForConsumers(args) {
      if (true) {
        var existing = registry.get(args.element);
        if (existing) {
          console.warn("You have already registered a [".concat(typeKey, "] dropTarget on the same element"), {
            existing,
            proposed: args
          });
        }
        if (args.element instanceof HTMLIFrameElement) {
          console.warn("\n            We recommend not registering <iframe> elements as drop targets\n            as it can result in some strange browser event ordering.\n          ".replace(/\s{2,}/g, " ").trim());
        }
      }
      return combine(addAttribute(args.element, {
        attribute: dropTargetDataAtt,
        value: "true"
      }), addToRegistry2(args));
    }
    function getActualDropTargets(_ref2) {
      var _args$getData, _args$getData2, _args$getDropEffect, _args$getDropEffect2;
      var source = _ref2.source, target = _ref2.target, input = _ref2.input, _ref2$result = _ref2.result, result = _ref2$result === void 0 ? [] : _ref2$result;
      if (target == null) {
        return result;
      }
      if (!(target instanceof Element)) {
        if (target instanceof Node) {
          return getActualDropTargets({
            source,
            target: target.parentElement,
            input,
            result
          });
        }
        return result;
      }
      var closest = target.closest(dropTargetSelector);
      if (closest == null) {
        return result;
      }
      var args = registry.get(closest);
      if (args == null) {
        return result;
      }
      var feedback = {
        input,
        source,
        element: args.element
      };
      if (args.canDrop && !args.canDrop(feedback)) {
        return getActualDropTargets({
          source,
          target: args.element.parentElement,
          input,
          result
        });
      }
      var data = (_args$getData = (_args$getData2 = args.getData) === null || _args$getData2 === void 0 ? void 0 : _args$getData2.call(args, feedback)) !== null && _args$getData !== void 0 ? _args$getData : {};
      var dropEffect = (_args$getDropEffect = (_args$getDropEffect2 = args.getDropEffect) === null || _args$getDropEffect2 === void 0 ? void 0 : _args$getDropEffect2.call(args, feedback)) !== null && _args$getDropEffect !== void 0 ? _args$getDropEffect : defaultDropEffect;
      var record = {
        data,
        element: args.element,
        dropEffect,
        // we are collecting _actual_ drop targets, so these are
        // being applied _not_ due to stickiness
        isActiveDueToStickiness: false
      };
      return getActualDropTargets({
        source,
        target: args.element.parentElement,
        input,
        // Using bubble ordering. Same ordering as `event.getPath()`
        result: [].concat(_toConsumableArray(result), [record])
      });
    }
    function notifyCurrent(_ref3) {
      var eventName = _ref3.eventName, payload = _ref3.payload;
      var _iterator = _createForOfIteratorHelper(payload.location.current.dropTargets), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _entry$eventName;
          var record = _step.value;
          var entry = registry.get(record.element);
          var args = _objectSpread2(_objectSpread2({}, payload), {}, {
            self: record
          });
          entry === null || entry === void 0 || (_entry$eventName = entry[eventName]) === null || _entry$eventName === void 0 || _entry$eventName.call(
            entry,
            // I cannot seem to get the types right here.
            // TS doesn't seem to like that one event can need `nativeSetDragImage`
            // @ts-expect-error
            args
          );
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    var actions = {
      onGenerateDragPreview: notifyCurrent,
      onDrag: notifyCurrent,
      onDragStart: notifyCurrent,
      onDrop: notifyCurrent,
      onDropTargetChange: function onDropTargetChange(_ref4) {
        var payload = _ref4.payload;
        var isCurrent = new Set(payload.location.current.dropTargets.map(function(record2) {
          return record2.element;
        }));
        var visited = /* @__PURE__ */ new Set();
        var _iterator2 = _createForOfIteratorHelper(payload.location.previous.dropTargets), _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
            var _entry$onDropTargetCh;
            var record = _step2.value;
            visited.add(record.element);
            var entry = registry.get(record.element);
            var isOver = isCurrent.has(record.element);
            var args = _objectSpread2(_objectSpread2({}, payload), {}, {
              self: record
            });
            entry === null || entry === void 0 || (_entry$onDropTargetCh = entry.onDropTargetChange) === null || _entry$onDropTargetCh === void 0 || _entry$onDropTargetCh.call(entry, args);
            if (!isOver) {
              var _entry$onDragLeave;
              entry === null || entry === void 0 || (_entry$onDragLeave = entry.onDragLeave) === null || _entry$onDragLeave === void 0 || _entry$onDragLeave.call(entry, args);
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        var _iterator3 = _createForOfIteratorHelper(payload.location.current.dropTargets), _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
            var _entry$onDropTargetCh2, _entry$onDragEnter;
            var _record = _step3.value;
            if (visited.has(_record.element)) {
              continue;
            }
            var _args = _objectSpread2(_objectSpread2({}, payload), {}, {
              self: _record
            });
            var _entry = registry.get(_record.element);
            _entry === null || _entry === void 0 || (_entry$onDropTargetCh2 = _entry.onDropTargetChange) === null || _entry$onDropTargetCh2 === void 0 || _entry$onDropTargetCh2.call(_entry, _args);
            _entry === null || _entry === void 0 || (_entry$onDragEnter = _entry.onDragEnter) === null || _entry$onDragEnter === void 0 || _entry$onDragEnter.call(_entry, _args);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
    };
    function dispatchEvent(args) {
      actions[args.eventName](args);
    }
    function getIsOver(_ref5) {
      var source = _ref5.source, target = _ref5.target, input = _ref5.input, current = _ref5.current;
      var actual = getActualDropTargets({
        source,
        target,
        input
      });
      if (actual.length >= current.length) {
        return actual;
      }
      var lastCaptureOrdered = copyReverse(current);
      var actualCaptureOrdered = copyReverse(actual);
      var resultCaptureOrdered = [];
      for (var index = 0; index < lastCaptureOrdered.length; index++) {
        var _argsForLast$getIsSti;
        var last = lastCaptureOrdered[index];
        var fresh = actualCaptureOrdered[index];
        if (fresh != null) {
          resultCaptureOrdered.push(fresh);
          continue;
        }
        var parent = resultCaptureOrdered[index - 1];
        var lastParent = lastCaptureOrdered[index - 1];
        if ((parent === null || parent === void 0 ? void 0 : parent.element) !== (lastParent === null || lastParent === void 0 ? void 0 : lastParent.element)) {
          break;
        }
        var argsForLast = registry.get(last.element);
        if (!argsForLast) {
          break;
        }
        var feedback = {
          input,
          source,
          element: argsForLast.element
        };
        if (argsForLast.canDrop && !argsForLast.canDrop(feedback)) {
          break;
        }
        if (!((_argsForLast$getIsSti = argsForLast.getIsSticky) !== null && _argsForLast$getIsSti !== void 0 && _argsForLast$getIsSti.call(argsForLast, feedback))) {
          break;
        }
        resultCaptureOrdered.push(_objectSpread2(_objectSpread2({}, last), {}, {
          // making it clear to consumers this drop target is active due to stickiness
          isActiveDueToStickiness: true
        }));
      }
      return copyReverse(resultCaptureOrdered);
    }
    return {
      dropTargetForConsumers,
      getIsOver,
      dispatchEvent
    };
  }
  var init_make_drop_target = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-drop-target.js"() {
      init_defineProperty();
      init_toConsumableArray();
      init_combine();
      init_add_attribute();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-monitor.js
  function _createForOfIteratorHelper2(r4, e4) {
    var t4 = "undefined" != typeof Symbol && r4[Symbol.iterator] || r4["@@iterator"];
    if (!t4) {
      if (Array.isArray(r4) || (t4 = _unsupportedIterableToArray3(r4)) || e4 && r4 && "number" == typeof r4.length) {
        t4 && (r4 = t4);
        var _n = 0, F4 = function F5() {
        };
        return { s: F4, n: function n3() {
          return _n >= r4.length ? { done: true } : { done: false, value: r4[_n++] };
        }, e: function e5(r5) {
          throw r5;
        }, f: F4 };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o4, a4 = true, u4 = false;
    return { s: function s5() {
      t4 = t4.call(r4);
    }, n: function n3() {
      var r5 = t4.next();
      return a4 = r5.done, r5;
    }, e: function e5(r5) {
      u4 = true, o4 = r5;
    }, f: function f4() {
      try {
        a4 || null == t4.return || t4.return();
      } finally {
        if (u4) throw o4;
      }
    } };
  }
  function _unsupportedIterableToArray3(r4, a4) {
    if (r4) {
      if ("string" == typeof r4) return _arrayLikeToArray3(r4, a4);
      var t4 = {}.toString.call(r4).slice(8, -1);
      return "Object" === t4 && r4.constructor && (t4 = r4.constructor.name), "Map" === t4 || "Set" === t4 ? Array.from(r4) : "Arguments" === t4 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t4) ? _arrayLikeToArray3(r4, a4) : void 0;
    }
  }
  function _arrayLikeToArray3(r4, a4) {
    (null == a4 || a4 > r4.length) && (a4 = r4.length);
    for (var e4 = 0, n3 = Array(a4); e4 < a4; e4++) n3[e4] = r4[e4];
    return n3;
  }
  function ownKeys3(e4, r4) {
    var t4 = Object.keys(e4);
    if (Object.getOwnPropertySymbols) {
      var o4 = Object.getOwnPropertySymbols(e4);
      r4 && (o4 = o4.filter(function(r5) {
        return Object.getOwnPropertyDescriptor(e4, r5).enumerable;
      })), t4.push.apply(t4, o4);
    }
    return t4;
  }
  function _objectSpread3(e4) {
    for (var r4 = 1; r4 < arguments.length; r4++) {
      var t4 = null != arguments[r4] ? arguments[r4] : {};
      r4 % 2 ? ownKeys3(Object(t4), true).forEach(function(r5) {
        _defineProperty(e4, r5, t4[r5]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e4, Object.getOwnPropertyDescriptors(t4)) : ownKeys3(Object(t4)).forEach(function(r5) {
        Object.defineProperty(e4, r5, Object.getOwnPropertyDescriptor(t4, r5));
      });
    }
    return e4;
  }
  function makeMonitor() {
    var registry = /* @__PURE__ */ new Set();
    var dragging = null;
    function tryAddToActive(monitor) {
      if (!dragging) {
        return;
      }
      if (!monitor.canMonitor || monitor.canMonitor(dragging.canMonitorArgs)) {
        dragging.active.add(monitor);
      }
    }
    function monitorForConsumers(args) {
      var entry = _objectSpread3({}, args);
      registry.add(entry);
      tryAddToActive(entry);
      return function cleanup() {
        registry.delete(entry);
        if (dragging) {
          dragging.active.delete(entry);
        }
      };
    }
    function dispatchEvent(_ref) {
      var eventName = _ref.eventName, payload = _ref.payload;
      if (eventName === "onGenerateDragPreview") {
        dragging = {
          canMonitorArgs: {
            initial: payload.location.initial,
            source: payload.source
          },
          active: /* @__PURE__ */ new Set()
        };
        var _iterator = _createForOfIteratorHelper2(registry), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var monitor = _step.value;
            tryAddToActive(monitor);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (!dragging) {
        return;
      }
      var active = Array.from(dragging.active);
      for (var _i = 0, _active = active; _i < _active.length; _i++) {
        var _monitor = _active[_i];
        if (dragging.active.has(_monitor)) {
          var _monitor$eventName;
          (_monitor$eventName = _monitor[eventName]) === null || _monitor$eventName === void 0 || _monitor$eventName.call(_monitor, payload);
        }
      }
      if (eventName === "onDrop") {
        dragging.active.clear();
        dragging = null;
      }
    }
    return {
      dispatchEvent,
      monitorForConsumers
    };
  }
  var init_make_monitor = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-monitor.js"() {
      init_defineProperty();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-adapter.js
  function makeAdapter(_ref) {
    var typeKey = _ref.typeKey, mount3 = _ref.mount, dispatchEventToSource2 = _ref.dispatchEventToSource, onPostDispatch = _ref.onPostDispatch, defaultDropEffect = _ref.defaultDropEffect;
    var monitorAPI = makeMonitor();
    var dropTargetAPI = makeDropTarget({
      typeKey,
      defaultDropEffect
    });
    function dispatchEvent(args) {
      dispatchEventToSource2 === null || dispatchEventToSource2 === void 0 || dispatchEventToSource2(args);
      dropTargetAPI.dispatchEvent(args);
      monitorAPI.dispatchEvent(args);
      onPostDispatch === null || onPostDispatch === void 0 || onPostDispatch(args);
    }
    function start2(_ref2) {
      var event = _ref2.event, dragType = _ref2.dragType;
      lifecycle.start({
        event,
        dragType,
        getDropTargetsOver: dropTargetAPI.getIsOver,
        dispatchEvent
      });
    }
    function registerUsage2() {
      function mountAdapter() {
        var api = {
          canStart: lifecycle.canStart,
          start: start2
        };
        return mount3(api);
      }
      return register({
        typeKey,
        mount: mountAdapter
      });
    }
    return {
      registerUsage: registerUsage2,
      dropTarget: dropTargetAPI.dropTargetForConsumers,
      monitor: monitorAPI.monitorForConsumers
    };
  }
  var init_make_adapter = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-adapter.js"() {
      init_lifecycle_manager();
      init_usage_ledger();
      init_make_drop_target();
      init_make_monitor();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/android.js
  var isAndroid, androidFallbackText;
  var init_android = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/android.js"() {
      init_once();
      isAndroid = once(function isAndroid2() {
        return navigator.userAgent.toLocaleLowerCase().includes("android");
      });
      androidFallbackText = "pdnd:android-fallback";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/text-media-type.js
  var textMediaType;
  var init_text_media_type = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/text-media-type.js"() {
      textMediaType = "text/plain";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/url-media-type.js
  var URLMediaType;
  var init_url_media_type = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/url-media-type.js"() {
      URLMediaType = "text/uri-list";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/element-adapter-native-data-key.js
  var elementAdapterNativeDataKey;
  var init_element_adapter_native_data_key = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/element-adapter-native-data-key.js"() {
      elementAdapterNativeDataKey = "application/vnd.pdnd";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/element-adapter.js
  function addToRegistry(args) {
    draggableRegistry.set(args.element, args);
    return function cleanup() {
      draggableRegistry.delete(args.element);
    };
  }
  function draggable(args) {
    if (true) {
      if (args.dragHandle && !args.element.contains(args.dragHandle)) {
        console.warn("Drag handle element must be contained in draggable element", {
          element: args.element,
          dragHandle: args.dragHandle
        });
      }
    }
    if (true) {
      var existing = draggableRegistry.get(args.element);
      if (existing) {
        console.warn("You have already registered a `draggable` on the same element", {
          existing,
          proposed: args
        });
      }
    }
    return combine(
      // making the draggable register the adapter rather than drop targets
      // this is because you *must* have a draggable element to start a drag
      // but you _might_ not have any drop targets immediately
      // (You might create drop targets async)
      adapter.registerUsage(),
      addToRegistry(args),
      addAttribute(args.element, {
        attribute: "draggable",
        value: "true"
      })
    );
  }
  var import_bind_event_listener4, draggableRegistry, honeyPotFix, adapter, dropTargetForElements, monitorForElements;
  var init_element_adapter = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/element-adapter.js"() {
      init_slicedToArray();
      import_bind_event_listener4 = __toESM(require_dist());
      init_get_element_from_point_without_honey_pot();
      init_make_honey_pot_fix();
      init_make_adapter();
      init_combine();
      init_add_attribute();
      init_android();
      init_get_input();
      init_text_media_type();
      init_url_media_type();
      init_element_adapter_native_data_key();
      draggableRegistry = /* @__PURE__ */ new WeakMap();
      honeyPotFix = makeHoneyPotFix();
      adapter = makeAdapter({
        typeKey: "element",
        defaultDropEffect: "move",
        mount: function mount(api) {
          return combine(honeyPotFix.bindEvents(), (0, import_bind_event_listener4.bind)(document, {
            type: "dragstart",
            listener: function listener(event) {
              var _entry$dragHandle, _entry$getInitialData, _entry$getInitialData2, _entry$dragHandle2, _entry$getInitialData3, _entry$getInitialData4;
              if (!api.canStart(event)) {
                return;
              }
              if (event.defaultPrevented) {
                return;
              }
              if (!event.dataTransfer) {
                if (true) {
                  console.warn("\n              It appears as though you have are not testing DragEvents correctly.\n\n              - If you are unit testing, ensure you have polyfilled DragEvent.\n              - If you are browser testing, ensure you are dispatching drag events correctly.\n\n              Please see our testing guides for more information:\n              https://atlassian.design/components/pragmatic-drag-and-drop/core-package/testing\n            ".replace(/ {2}/g, ""));
                }
                return;
              }
              var target = event.target;
              if (!(target instanceof HTMLElement)) {
                return null;
              }
              var entry = draggableRegistry.get(target);
              if (!entry) {
                return null;
              }
              var input = getInput(event);
              var feedback = {
                element: entry.element,
                dragHandle: (_entry$dragHandle = entry.dragHandle) !== null && _entry$dragHandle !== void 0 ? _entry$dragHandle : null,
                input
              };
              if (entry.canDrag && !entry.canDrag(feedback)) {
                event.preventDefault();
                return null;
              }
              if (entry.dragHandle) {
                var over = getElementFromPointWithoutHoneypot({
                  x: input.clientX,
                  y: input.clientY
                });
                if (!entry.dragHandle.contains(over)) {
                  event.preventDefault();
                  return null;
                }
              }
              var nativeData = (_entry$getInitialData = (_entry$getInitialData2 = entry.getInitialDataForExternal) === null || _entry$getInitialData2 === void 0 ? void 0 : _entry$getInitialData2.call(entry, feedback)) !== null && _entry$getInitialData !== void 0 ? _entry$getInitialData : null;
              if (nativeData) {
                for (var _i = 0, _Object$entries = Object.entries(nativeData); _i < _Object$entries.length; _i++) {
                  var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), key = _Object$entries$_i[0], data = _Object$entries$_i[1];
                  event.dataTransfer.setData(key, data !== null && data !== void 0 ? data : "");
                }
              }
              if (isAndroid() && !event.dataTransfer.types.includes(textMediaType) && !event.dataTransfer.types.includes(URLMediaType)) {
                event.dataTransfer.setData(textMediaType, androidFallbackText);
              }
              event.dataTransfer.setData(elementAdapterNativeDataKey, "");
              var payload = {
                element: entry.element,
                dragHandle: (_entry$dragHandle2 = entry.dragHandle) !== null && _entry$dragHandle2 !== void 0 ? _entry$dragHandle2 : null,
                data: (_entry$getInitialData3 = (_entry$getInitialData4 = entry.getInitialData) === null || _entry$getInitialData4 === void 0 ? void 0 : _entry$getInitialData4.call(entry, feedback)) !== null && _entry$getInitialData3 !== void 0 ? _entry$getInitialData3 : {}
              };
              var dragType = {
                type: "element",
                payload,
                startedFrom: "internal"
              };
              api.start({
                event,
                dragType
              });
            }
          }));
        },
        dispatchEventToSource: function dispatchEventToSource(_ref) {
          var _draggableRegistry$ge, _draggableRegistry$ge2;
          var eventName = _ref.eventName, payload = _ref.payload;
          (_draggableRegistry$ge = draggableRegistry.get(payload.source.element)) === null || _draggableRegistry$ge === void 0 || (_draggableRegistry$ge2 = _draggableRegistry$ge[eventName]) === null || _draggableRegistry$ge2 === void 0 || _draggableRegistry$ge2.call(
            _draggableRegistry$ge,
            // I cannot seem to get the types right here.
            // TS doesn't seem to like that one event can need `nativeSetDragImage`
            // @ts-expect-error
            payload
          );
        },
        onPostDispatch: honeyPotFix.getOnPostDispatch()
      });
      dropTargetForElements = adapter.dropTarget;
      monitorForElements = adapter.monitor;
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/adapter.js
  var init_adapter = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/adapter.js"() {
      init_element_adapter();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/closest-edge.js
  function ownKeys4(e4, r4) {
    var t4 = Object.keys(e4);
    if (Object.getOwnPropertySymbols) {
      var o4 = Object.getOwnPropertySymbols(e4);
      r4 && (o4 = o4.filter(function(r5) {
        return Object.getOwnPropertyDescriptor(e4, r5).enumerable;
      })), t4.push.apply(t4, o4);
    }
    return t4;
  }
  function _objectSpread4(e4) {
    for (var r4 = 1; r4 < arguments.length; r4++) {
      var t4 = null != arguments[r4] ? arguments[r4] : {};
      r4 % 2 ? ownKeys4(Object(t4), true).forEach(function(r5) {
        _defineProperty(e4, r5, t4[r5]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e4, Object.getOwnPropertyDescriptors(t4)) : ownKeys4(Object(t4)).forEach(function(r5) {
        Object.defineProperty(e4, r5, Object.getOwnPropertyDescriptor(t4, r5));
      });
    }
    return e4;
  }
  function attachClosestEdge(userData, _ref) {
    var _entries$sort$0$edge, _entries$sort$;
    var element = _ref.element, input = _ref.input, allowedEdges = _ref.allowedEdges;
    var client = {
      x: input.clientX,
      y: input.clientY
    };
    var rect = element.getBoundingClientRect();
    var entries4 = allowedEdges.map(function(edge) {
      return {
        edge,
        value: getDistanceToEdge[edge](rect, client)
      };
    });
    var addClosestEdge = (_entries$sort$0$edge = (_entries$sort$ = entries4.sort(function(a4, b3) {
      return a4.value - b3.value;
    })[0]) === null || _entries$sort$ === void 0 ? void 0 : _entries$sort$.edge) !== null && _entries$sort$0$edge !== void 0 ? _entries$sort$0$edge : null;
    return _objectSpread4(_objectSpread4({}, userData), {}, _defineProperty({}, uniqueKey, addClosestEdge));
  }
  function extractClosestEdge(userData) {
    var _ref2;
    return (_ref2 = userData[uniqueKey]) !== null && _ref2 !== void 0 ? _ref2 : null;
  }
  var getDistanceToEdge, uniqueKey;
  var init_closest_edge = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/closest-edge.js"() {
      init_defineProperty();
      getDistanceToEdge = {
        top: function top(rect, client) {
          return Math.abs(client.y - rect.top);
        },
        right: function right(rect, client) {
          return Math.abs(rect.right - client.x);
        },
        bottom: function bottom(rect, client) {
          return Math.abs(rect.bottom - client.y);
        },
        left: function left(rect, client) {
          return Math.abs(client.x - rect.left);
        }
      };
      uniqueKey = Symbol("closestEdge");
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/reorder.js
  function reorder(_ref) {
    var list2 = _ref.list, startIndex = _ref.startIndex, finishIndex = _ref.finishIndex;
    if (startIndex === -1 || finishIndex === -1) {
      return list2;
    }
    var result = Array.from(list2);
    var _result$splice = result.splice(startIndex, 1), _result$splice2 = _slicedToArray(_result$splice, 1), removed = _result$splice2[0];
    result.splice(finishIndex, 0, removed);
    return result;
  }
  var init_reorder = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/reorder.js"() {
      init_slicedToArray();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/reorder.js
  var init_reorder2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/reorder.js"() {
      init_reorder();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/get-reorder-destination-index.js
  function getReorderDestinationIndex(_ref) {
    var startIndex = _ref.startIndex, closestEdgeOfTarget = _ref.closestEdgeOfTarget, indexOfTarget = _ref.indexOfTarget, axis = _ref.axis;
    if (startIndex === -1 || indexOfTarget === -1) {
      return startIndex;
    }
    if (startIndex === indexOfTarget) {
      return startIndex;
    }
    if (closestEdgeOfTarget == null) {
      return indexOfTarget;
    }
    var isGoingAfter = axis === "vertical" && closestEdgeOfTarget === "bottom" || axis === "horizontal" && closestEdgeOfTarget === "right";
    var isMovingForward = startIndex < indexOfTarget;
    if (isMovingForward) {
      return isGoingAfter ? indexOfTarget : indexOfTarget - 1;
    }
    return isGoingAfter ? indexOfTarget + 1 : indexOfTarget;
  }
  var init_get_reorder_destination_index = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/get-reorder-destination-index.js"() {
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/reorder-with-edge.js
  function reorderWithEdge(_ref) {
    var list2 = _ref.list, startIndex = _ref.startIndex, closestEdgeOfTarget = _ref.closestEdgeOfTarget, indexOfTarget = _ref.indexOfTarget, axis = _ref.axis;
    return reorder({
      list: list2,
      startIndex,
      finishIndex: getReorderDestinationIndex({
        closestEdgeOfTarget,
        startIndex,
        indexOfTarget,
        axis
      })
    });
  }
  var init_reorder_with_edge = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/reorder-with-edge.js"() {
      init_reorder2();
      init_get_reorder_destination_index();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-entering-window.js
  function isEnteringWindow(_ref) {
    var dragEnter = _ref.dragEnter;
    var type = dragEnter.type, relatedTarget = dragEnter.relatedTarget;
    if (type !== "dragenter") {
      return false;
    }
    if (isSafari()) {
      return isEnteringWindowInSafari({
        dragEnter
      });
    }
    if (relatedTarget == null) {
      return true;
    }
    if (isFirefox()) {
      return isFromAnotherWindow(relatedTarget);
    }
    return relatedTarget instanceof HTMLIFrameElement;
  }
  var init_is_entering_window = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-entering-window.js"() {
      init_is_firefox();
      init_is_safari();
      init_count_events_for_safari();
      init_is_from_another_window();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/external-adapter.js
  function isAnAvailableType(_ref) {
    var type = _ref.type, value = _ref.value;
    if (type === elementAdapterNativeDataKey) {
      return false;
    }
    if (type === textMediaType && value === androidFallbackText) {
      return false;
    }
    return true;
  }
  function getAvailableTypes(transfer) {
    return Array.from(transfer.types).filter(function(type) {
      return isAnAvailableType({
        type,
        value: transfer.getData(type)
      });
    });
  }
  function getAvailableItems(dataTransfer) {
    return Array.from(dataTransfer.items).filter(function(item) {
      return item.kind === "file" || isAnAvailableType({
        type: item.type,
        value: dataTransfer.getData(item.type)
      });
    });
  }
  function dropTargetForExternal(args) {
    return adapter2.dropTarget(args);
  }
  function monitorForExternal(args) {
    return adapter2.monitor(args);
  }
  var import_bind_event_listener5, didDragStartLocally, adapter2;
  var init_external_adapter = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/external-adapter.js"() {
      init_toConsumableArray();
      import_bind_event_listener5 = __toESM(require_dist());
      init_make_adapter();
      init_android();
      init_is_entering_window();
      init_detect_broken_drag();
      init_text_media_type();
      init_element_adapter_native_data_key();
      didDragStartLocally = false;
      adapter2 = makeAdapter({
        typeKey: "external",
        // for external drags, we are generally making a copy of something that is being dragged
        defaultDropEffect: "copy",
        mount: function mount2(api) {
          return (0, import_bind_event_listener5.bind)(window, {
            type: "dragenter",
            listener: function listener(event) {
              if (didDragStartLocally) {
                return;
              }
              if (!event.dataTransfer) {
                if (true) {
                  console.warn("\n              It appears as though you have are not testing DragEvents correctly.\n\n              - If you are unit testing, ensure you have polyfilled DragEvent.\n              - If you are browser testing, ensure you are dispatching drag events correctly.\n\n              Please see our testing guides for more information:\n              https://atlassian.design/components/pragmatic-drag-and-drop/core-package/testing\n            ".replace(/ {2}/g, ""));
                }
                return;
              }
              if (!api.canStart(event)) {
                return;
              }
              if (!isEnteringWindow({
                dragEnter: event
              })) {
                return;
              }
              var types = getAvailableTypes(event.dataTransfer);
              if (!types.length) {
                return;
              }
              var locked = {
                types,
                items: [],
                getStringData: function getStringData() {
                  return null;
                }
              };
              api.start({
                event,
                dragType: {
                  type: "external",
                  startedFrom: "external",
                  payload: locked,
                  getDropPayload: function getDropPayload(event2) {
                    if (!event2.dataTransfer) {
                      return locked;
                    }
                    var items = getAvailableItems(event2.dataTransfer);
                    var nativeGetData = event2.dataTransfer.getData.bind(event2.dataTransfer);
                    return {
                      types,
                      items,
                      // return `null` if there is no result, otherwise string
                      getStringData: function getStringData(mediaType) {
                        if (!types.includes(mediaType)) {
                          return null;
                        }
                        var value = nativeGetData(mediaType);
                        if (!isAnAvailableType({
                          type: mediaType,
                          value
                        })) {
                          return null;
                        }
                        return value;
                      }
                    };
                  }
                }
              });
            }
          });
        }
      });
      (function startup() {
        if (typeof window === "undefined") {
          return;
        }
        adapter2.registerUsage();
        var idle = {
          type: "idle"
        };
        var state = idle;
        function clear() {
          if (state.type !== "dragging") {
            return;
          }
          didDragStartLocally = false;
          state.cleanup();
          state = idle;
        }
        function bindEndEvents() {
          return (0, import_bind_event_listener5.bindAll)(
            window,
            [{
              type: "dragend",
              listener: clear
            }].concat(_toConsumableArray(getBindingsForBrokenDrags({
              onDragEnd: clear
            }))),
            // we want to make sure we get all the events,
            // and this helps avoid not seeing events when folks stop
            // them later on the event path
            {
              capture: true
            }
          );
        }
        (0, import_bind_event_listener5.bind)(window, {
          type: "dragstart",
          listener: function listener() {
            if (state.type !== "idle") {
              return;
            }
            didDragStartLocally = true;
            state = {
              type: "dragging",
              cleanup: bindEndEvents()
            };
          },
          // binding in the capture phase so these listeners are called
          // before our listeners in the adapters `mount` function
          options: {
            capture: true
          }
        });
      })();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/external/adapter.js
  var init_adapter2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/external/adapter.js"() {
      init_external_adapter();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/combine.js
  var init_combine2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/combine.js"() {
      init_combine();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/html-media-type.js
  var HTMLMediaType;
  var init_html_media_type = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/html-media-type.js"() {
      HTMLMediaType = "text/html";
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/external/html.js
  function getHTML(_ref2) {
    var source = _ref2.source;
    return source.getStringData(HTMLMediaType);
  }
  var init_html = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/external/html.js"() {
      init_html_media_type();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/external/html.js
  var init_html2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/external/html.js"() {
      init_html();
    }
  });

  // pages/new-tab/app/favorites/constants.js
  var DDG_MIME_TYPE, DDG_FALLBACK_ICON, DDG_DEFAULT_ICON_SIZE;
  var init_constants = __esm({
    "pages/new-tab/app/favorites/constants.js"() {
      "use strict";
      DDG_MIME_TYPE = "application/vnd.duckduckgo.bookmark-by-id";
      DDG_FALLBACK_ICON = "./company-icons/other.svg";
      DDG_DEFAULT_ICON_SIZE = 64;
    }
  });

  // pages/new-tab/app/favorites/components/PragmaticDND.js
  function PragmaticDND({ children, items, itemsDidReOrder }) {
    const [instanceId] = h2(getInstanceId);
    useGridState(items, itemsDidReOrder, instanceId);
    return /* @__PURE__ */ _(InstanceIdContext.Provider, { value: instanceId }, children);
  }
  function useGridState(favorites2, itemsDidReOrder, instanceId) {
    y2(() => {
      return combine(
        monitorForExternal({
          onDrop(payload) {
            const id = idFromPayload(payload);
            if (!id) return;
            const location2 = payload.location;
            const target = location2.current.dropTargets[0];
            if (!target || !target.data || typeof target.data.url !== "string") {
              return console.warn("missing data from target");
            }
            const closestEdgeOfTarget = extractClosestEdge(target.data);
            const destinationSrc = target.data.url;
            let indexOfTarget = favorites2.findIndex((item) => item.url === destinationSrc);
            if (indexOfTarget === -1 && destinationSrc.includes("PLACEHOLDER-URL")) {
              indexOfTarget = favorites2.length;
            }
            const targetIndex = getReorderDestinationIndex({
              closestEdgeOfTarget,
              startIndex: favorites2.length,
              indexOfTarget,
              axis: "horizontal"
            });
            itemsDidReOrder({
              list: favorites2,
              id,
              fromIndex: favorites2.length,
              targetIndex
            });
          }
        }),
        monitorForElements({
          canMonitor({ source }) {
            return source.data.instanceId === instanceId;
          },
          onDrop({ source, location: location2 }) {
            const target = location2.current.dropTargets[0];
            if (!target) {
              return;
            }
            const destinationSrc = target.data.url;
            const startSrc = source.data.url;
            const startId = source.data.id;
            if (typeof startId !== "string") {
              return console.warn("could not access the id");
            }
            if (typeof destinationSrc !== "string") {
              return console.warn("could not access the destinationSrc");
            }
            if (typeof startSrc !== "string") {
              return console.warn("could not access the startSrc");
            }
            const startIndex = favorites2.findIndex((item) => item.url === startSrc);
            let indexOfTarget = favorites2.findIndex((item) => item.url === destinationSrc);
            if (indexOfTarget === -1 && destinationSrc.includes("PLACEHOLDER-URL")) {
              indexOfTarget = favorites2.length;
            }
            const closestEdgeOfTarget = extractClosestEdge(target.data);
            const targetIndex = getReorderDestinationIndex({
              closestEdgeOfTarget,
              startIndex,
              indexOfTarget,
              axis: "horizontal"
            });
            const reorderedList = reorderWithEdge({
              list: favorites2,
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal"
            });
            document.documentElement.dataset.dropped = String(startId);
            setTimeout(() => {
              document.documentElement.dataset.dropped = "";
            }, 0);
            itemsDidReOrder({
              list: reorderedList,
              id: startId,
              fromIndex: startIndex,
              targetIndex
            });
          }
        })
      );
    }, [instanceId, favorites2]);
  }
  function useItemState(url4, id) {
    const instanceId = x2(InstanceIdContext);
    const ref = A2(null);
    const [state, setState] = h2(
      /** @type {DNDState} */
      { type: "idle" }
    );
    y2(() => {
      const el = ref.current;
      if (!el) throw new Error("unreachable");
      return combine(
        draggable({
          element: el,
          getInitialData: () => ({ type: "grid-item", url: url4, id, instanceId }),
          getInitialDataForExternal: () => ({
            "text/plain": url4,
            [DDG_MIME_TYPE]: id
          }),
          onDragStart: () => setState({ type: "dragging" }),
          onDrop: () => setState({ type: "idle" })
        }),
        dropTargetForExternal({
          element: el,
          canDrop: ({ source }) => {
            return source.types.some((type) => type === "text/html");
          },
          getData: ({ input }) => {
            return attachClosestEdge(
              { url: url4, id },
              {
                element: el,
                input,
                allowedEdges: ["left", "right"]
              }
            );
          },
          onDrop: () => {
            setState({ type: "idle" });
          },
          onDragLeave: () => setState({ type: "idle" }),
          onDrag: ({ self }) => {
            const closestEdge = extractClosestEdge(self.data);
            setState((current) => {
              if (current.type === "is-dragging-over" && current.closestEdge === closestEdge) {
                return current;
              }
              return { type: "is-dragging-over", closestEdge };
            });
          }
        }),
        dropTargetForElements({
          element: el,
          getData: ({ input }) => {
            return attachClosestEdge(
              { url: url4, id },
              {
                element: el,
                input,
                allowedEdges: ["left", "right"]
              }
            );
          },
          getIsSticky: () => true,
          canDrop: ({ source }) => {
            return source.data.instanceId === instanceId && source.data.type === "grid-item" && source.data.id !== id;
          },
          onDragEnter: ({ self }) => {
            const closestEdge = extractClosestEdge(self.data);
            setState({ type: "is-dragging-over", closestEdge });
          },
          onDrag({ self }) {
            const closestEdge = extractClosestEdge(self.data);
            setState((current) => {
              if (current.type === "is-dragging-over" && current.closestEdge === closestEdge) {
                return current;
              }
              return { type: "is-dragging-over", closestEdge };
            });
          },
          onDragLeave: () => setState({ type: "idle" }),
          onDrop: () => setState({ type: "idle" })
        })
      );
    }, [instanceId, url4, id]);
    return { ref, state };
  }
  function getInstanceId() {
    return Symbol("instance-id");
  }
  function idFromPayload(payload) {
    const ddg = payload.source.getStringData(DDG_MIME_TYPE);
    if (ddg && ddg.length > 0) return ddg;
    const html = getHTML(payload);
    if (!html) return console.warn(`missing text/html payload + missing ${DDG_MIME_TYPE} mime type`);
    const fragment = document.createRange().createContextualFragment(html);
    const node = fragment.firstElementChild;
    if (!node) return console.warn("missing first element");
    if (node.getAttribute("name") !== DDG_MIME_TYPE) return console.warn(`attribute name was not ${DDG_MIME_TYPE}`);
    const id = node.getAttribute("content");
    if (!id) return console.warn("id missing from `content` attribute");
    return id;
  }
  var InstanceIdContext;
  var init_PragmaticDND = __esm({
    "pages/new-tab/app/favorites/components/PragmaticDND.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_adapter();
      init_closest_edge();
      init_reorder_with_edge();
      init_get_reorder_destination_index();
      init_adapter2();
      init_combine2();
      init_html2();
      init_constants();
      InstanceIdContext = G(getInstanceId());
    }
  });

  // ../node_modules/preact/compat/dist/compat.module.js
  function g4(n3, t4) {
    for (var e4 in n3) if ("__source" !== e4 && !(e4 in t4)) return true;
    for (var r4 in t4) if ("__source" !== r4 && n3[r4] !== t4[r4]) return true;
    return false;
  }
  function E3(n3, t4) {
    this.props = n3, this.context = t4;
  }
  function C3(n3, e4) {
    function r4(n4) {
      var t4 = this.props.ref, r5 = t4 == n4.ref;
      return !r5 && t4 && (t4.call ? t4(null) : t4.current = null), e4 ? !e4(this.props, n4) || !r5 : g4(this.props, n4);
    }
    function u4(e5) {
      return this.shouldComponentUpdate = r4, _(n3, e5);
    }
    return u4.displayName = "Memo(" + (n3.displayName || n3.name) + ")", u4.prototype.isReactComponent = true, u4.__f = true, u4;
  }
  function T3(n3, t4, e4) {
    return n3 && (n3.__c && n3.__c.__H && (n3.__c.__H.__.forEach(function(n4) {
      "function" == typeof n4.__c && n4.__c();
    }), n3.__c.__H = null), null != (n3 = function(n4, t5) {
      for (var e5 in t5) n4[e5] = t5[e5];
      return n4;
    }({}, n3)).__c && (n3.__c.__P === e4 && (n3.__c.__P = t4), n3.__c = null), n3.__k = n3.__k && n3.__k.map(function(n4) {
      return T3(n4, t4, e4);
    })), n3;
  }
  function A3(n3, t4, e4) {
    return n3 && e4 && (n3.__v = null, n3.__k = n3.__k && n3.__k.map(function(n4) {
      return A3(n4, t4, e4);
    }), n3.__c && n3.__c.__P === t4 && (n3.__e && e4.appendChild(n3.__e), n3.__c.__e = true, n3.__c.__P = e4)), n3;
  }
  function D3() {
    this.__u = 0, this.t = null, this.__b = null;
  }
  function L2(n3) {
    var t4 = n3.__.__c;
    return t4 && t4.__a && t4.__a(n3);
  }
  function F3() {
    this.u = null, this.o = null;
  }
  function J() {
  }
  function K() {
    return this.cancelBubble;
  }
  function Q() {
    return this.defaultPrevented;
  }
  var x3, R, N2, M2, U, j3, z3, B3, H2, Z, Y, G2, X, nn, tn, en, rn;
  var init_compat_module = __esm({
    "../node_modules/preact/compat/dist/compat.module.js"() {
      init_preact_module();
      init_preact_module();
      init_hooks_module();
      init_hooks_module();
      (E3.prototype = new k()).isPureReactComponent = true, E3.prototype.shouldComponentUpdate = function(n3, t4) {
        return g4(this.props, n3) || g4(this.state, t4);
      };
      x3 = l.__b;
      l.__b = function(n3) {
        n3.type && n3.type.__f && n3.ref && (n3.props.ref = n3.ref, n3.ref = null), x3 && x3(n3);
      };
      R = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
      N2 = l.__e;
      l.__e = function(n3, t4, e4, r4) {
        if (n3.then) {
          for (var u4, o4 = t4; o4 = o4.__; ) if ((u4 = o4.__c) && u4.__c) return null == t4.__e && (t4.__e = e4.__e, t4.__k = e4.__k), u4.__c(n3, t4);
        }
        N2(n3, t4, e4, r4);
      };
      M2 = l.unmount;
      l.unmount = function(n3) {
        var t4 = n3.__c;
        t4 && t4.__R && t4.__R(), t4 && 32 & n3.__u && (n3.type = null), M2 && M2(n3);
      }, (D3.prototype = new k()).__c = function(n3, t4) {
        var e4 = t4.__c, r4 = this;
        null == r4.t && (r4.t = []), r4.t.push(e4);
        var u4 = L2(r4.__v), o4 = false, i5 = function() {
          o4 || (o4 = true, e4.__R = null, u4 ? u4(c4) : c4());
        };
        e4.__R = i5;
        var c4 = function() {
          if (!--r4.__u) {
            if (r4.state.__a) {
              var n4 = r4.state.__a;
              r4.__v.__k[0] = A3(n4, n4.__c.__P, n4.__c.__O);
            }
            var t5;
            for (r4.setState({ __a: r4.__b = null }); t5 = r4.t.pop(); ) t5.forceUpdate();
          }
        };
        r4.__u++ || 32 & t4.__u || r4.setState({ __a: r4.__b = r4.__v.__k[0] }), n3.then(i5, i5);
      }, D3.prototype.componentWillUnmount = function() {
        this.t = [];
      }, D3.prototype.render = function(n3, e4) {
        if (this.__b) {
          if (this.__v.__k) {
            var r4 = document.createElement("div"), o4 = this.__v.__k[0].__c;
            this.__v.__k[0] = T3(this.__b, r4, o4.__O = o4.__P);
          }
          this.__b = null;
        }
        var i5 = e4.__a && _(b, null, n3.fallback);
        return i5 && (i5.__u &= -33), [_(b, null, e4.__a ? null : n3.children), i5];
      };
      U = function(n3, t4, e4) {
        if (++e4[1] === e4[0] && n3.o.delete(t4), n3.props.revealOrder && ("t" !== n3.props.revealOrder[0] || !n3.o.size)) for (e4 = n3.u; e4; ) {
          for (; e4.length > 3; ) e4.pop()();
          if (e4[1] < e4[0]) break;
          n3.u = e4 = e4[2];
        }
      };
      (F3.prototype = new k()).__a = function(n3) {
        var t4 = this, e4 = L2(t4.__v), r4 = t4.o.get(n3);
        return r4[0]++, function(u4) {
          var o4 = function() {
            t4.props.revealOrder ? (r4.push(u4), U(t4, n3, r4)) : u4();
          };
          e4 ? e4(o4) : o4();
        };
      }, F3.prototype.render = function(n3) {
        this.u = null, this.o = /* @__PURE__ */ new Map();
        var t4 = H(n3.children);
        n3.revealOrder && "b" === n3.revealOrder[0] && t4.reverse();
        for (var e4 = t4.length; e4--; ) this.o.set(t4[e4], this.u = [1, 0, this.u]);
        return n3.children;
      }, F3.prototype.componentDidUpdate = F3.prototype.componentDidMount = function() {
        var n3 = this;
        this.o.forEach(function(t4, e4) {
          U(n3, e4, t4);
        });
      };
      j3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;
      z3 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
      B3 = /^on(Ani|Tra|Tou|BeforeInp|Compo)/;
      H2 = /[A-Z0-9]/g;
      Z = "undefined" != typeof document;
      Y = function(n3) {
        return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n3);
      };
      k.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t4) {
        Object.defineProperty(k.prototype, t4, { configurable: true, get: function() {
          return this["UNSAFE_" + t4];
        }, set: function(n3) {
          Object.defineProperty(this, t4, { configurable: true, writable: true, value: n3 });
        } });
      });
      G2 = l.event;
      l.event = function(n3) {
        return G2 && (n3 = G2(n3)), n3.persist = J, n3.isPropagationStopped = K, n3.isDefaultPrevented = Q, n3.nativeEvent = n3;
      };
      nn = { enumerable: false, configurable: true, get: function() {
        return this.class;
      } };
      tn = l.vnode;
      l.vnode = function(n3) {
        "string" == typeof n3.type && function(n4) {
          var t4 = n4.props, e4 = n4.type, u4 = {}, o4 = -1 === e4.indexOf("-");
          for (var i5 in t4) {
            var c4 = t4[i5];
            if (!("value" === i5 && "defaultValue" in t4 && null == c4 || Z && "children" === i5 && "noscript" === e4 || "class" === i5 || "className" === i5)) {
              var f4 = i5.toLowerCase();
              "defaultValue" === i5 && "value" in t4 && null == t4.value ? i5 = "value" : "download" === i5 && true === c4 ? c4 = "" : "translate" === f4 && "no" === c4 ? c4 = false : "o" === f4[0] && "n" === f4[1] ? "ondoubleclick" === f4 ? i5 = "ondblclick" : "onchange" !== f4 || "input" !== e4 && "textarea" !== e4 || Y(t4.type) ? "onfocus" === f4 ? i5 = "onfocusin" : "onblur" === f4 ? i5 = "onfocusout" : B3.test(i5) && (i5 = f4) : f4 = i5 = "oninput" : o4 && z3.test(i5) ? i5 = i5.replace(H2, "-$&").toLowerCase() : null === c4 && (c4 = void 0), "oninput" === f4 && u4[i5 = f4] && (i5 = "oninputCapture"), u4[i5] = c4;
            }
          }
          "select" == e4 && u4.multiple && Array.isArray(u4.value) && (u4.value = H(t4.children).forEach(function(n5) {
            n5.props.selected = -1 != u4.value.indexOf(n5.props.value);
          })), "select" == e4 && null != u4.defaultValue && (u4.value = H(t4.children).forEach(function(n5) {
            n5.props.selected = u4.multiple ? -1 != u4.defaultValue.indexOf(n5.props.value) : u4.defaultValue == n5.props.value;
          })), t4.class && !t4.className ? (u4.class = t4.class, Object.defineProperty(u4, "className", nn)) : (t4.className && !t4.class || t4.class && t4.className) && (u4.class = u4.className = t4.className), n4.props = u4;
        }(n3), n3.$$typeof = j3, tn && tn(n3);
      };
      en = l.__r;
      l.__r = function(n3) {
        en && en(n3), X = n3.__c;
      };
      rn = l.diffed;
      l.diffed = function(n3) {
        rn && rn(n3);
        var t4 = n3.props, e4 = n3.__e;
        null != e4 && "textarea" === n3.type && "value" in t4 && t4.value !== e4.value && (e4.value = null == t4.value ? "" : t4.value), X = null;
      };
    }
  });

  // pages/new-tab/app/favorites/components/Favorites.module.css
  var Favorites_default;
  var init_Favorites = __esm({
    "pages/new-tab/app/favorites/components/Favorites.module.css"() {
      Favorites_default = {
        root: "Favorites_root",
        noExpansionBtn: "Favorites_noExpansionBtn",
        showhideVisible: "Favorites_showhideVisible",
        showhide: "Favorites_showhide",
        grid: "Favorites_grid",
        gridRow: "Favorites_gridRow"
      };
    }
  });

  // pages/new-tab/app/components/ShowHide.module.css
  var ShowHide_default;
  var init_ShowHide = __esm({
    "pages/new-tab/app/components/ShowHide.module.css"() {
      ShowHide_default = {
        button: "ShowHide_button",
        round: "ShowHide_round",
        iconBlock: "ShowHide_iconBlock",
        withText: "ShowHide_withText"
      };
    }
  });

  // pages/new-tab/app/components/ShowHideButton.jsx
  function ShowHideButton({ text, onClick, buttonAttrs = {}, shape = "none", showText = false }) {
    return /* @__PURE__ */ _(
      "button",
      {
        ...buttonAttrs,
        class: (0, import_classnames3.default)(ShowHide_default.button, shape === "round" && ShowHide_default.round, !!showText && ShowHide_default.withText),
        "aria-label": text,
        onClick
      },
      showText ? /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(Chevron, null), text) : /* @__PURE__ */ _("div", { class: ShowHide_default.iconBlock }, /* @__PURE__ */ _(Chevron, null))
    );
  }
  var import_classnames3;
  var init_ShowHideButton = __esm({
    "pages/new-tab/app/components/ShowHideButton.jsx"() {
      "use strict";
      init_ShowHide();
      import_classnames3 = __toESM(require_classnames(), 1);
      init_Icons2();
      init_preact_module();
    }
  });

  // pages/new-tab/app/dropzone.js
  function useGlobalDropzone() {
    y2(() => {
      let safezones = [];
      const controller = new AbortController();
      window.addEventListener(
        REGISTER_EVENT,
        (e4) => {
          if (isValidEvent(e4)) {
            safezones.push(e4.detail.dropzone);
          }
        },
        { signal: controller.signal }
      );
      window.addEventListener(
        CLEAR_EVENT,
        (e4) => {
          if (isValidEvent(e4)) {
            const match = safezones.findIndex((x4) => x4 === e4.detail.dropzone);
            safezones.splice(match, 1);
          }
        },
        { signal: controller.signal }
      );
      document.addEventListener(
        "dragover",
        (event) => {
          if (!event.target) return;
          const target = (
            /** @type {HTMLElement} */
            event.target
          );
          if (safezones.length > 0) {
            for (const safezone of safezones) {
              if (safezone.contains(target)) return;
            }
          }
          let preventDrop = true;
          if (preventDrop) {
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = "none";
            }
          }
        },
        { signal: controller.signal }
      );
      return () => {
        controller.abort();
        safezones = [];
      };
    }, []);
  }
  function useDropzoneSafeArea() {
    const ref = A2(null);
    y2(() => {
      if (!ref.current) return;
      const evt = new CustomEvent(REGISTER_EVENT, { detail: { dropzone: ref.current } });
      window.dispatchEvent(evt);
      return () => {
        window.dispatchEvent(new CustomEvent(CLEAR_EVENT, { detail: { dropzone: ref.current } }));
      };
    }, []);
    return ref;
  }
  function isValidEvent(input) {
    return "detail" in input && input.detail.dropzone instanceof HTMLElement;
  }
  var REGISTER_EVENT, CLEAR_EVENT;
  var init_dropzone = __esm({
    "pages/new-tab/app/dropzone.js"() {
      "use strict";
      init_hooks_module();
      REGISTER_EVENT = "register-dropzone";
      CLEAR_EVENT = "clear-dropzone";
    }
  });

  // pages/new-tab/app/favorites/components/Tile.module.css
  var Tile_default;
  var init_Tile = __esm({
    "pages/new-tab/app/favorites/components/Tile.module.css"() {
      Tile_default = {
        item: "Tile_item",
        icon: "Tile_icon",
        pulse: "Tile_pulse",
        draggable: "Tile_draggable",
        favicon: "Tile_favicon",
        text: "Tile_text",
        placeholder: "Tile_placeholder",
        plus: "Tile_plus",
        dropper: "Tile_dropper"
      };
    }
  });

  // pages/new-tab/app/favorites/color.js
  function urlToColor(url4) {
    const host = getHost(url4);
    const index = Math.abs(getDJBHash(host) % EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES.length);
    return EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES[index];
  }
  function getDJBHash(str) {
    let hash = 5381;
    for (let i5 = 0; i5 < str.length; i5++) {
      hash = (hash << 5) + hash + str.charCodeAt(i5);
    }
    return hash;
  }
  function getHost(url4) {
    try {
      const urlObj = new URL(url4);
      return urlObj.hostname.replace(/^www\./, "");
    } catch (e4) {
      return "?";
    }
  }
  var EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES;
  var init_color = __esm({
    "pages/new-tab/app/favorites/color.js"() {
      "use strict";
      EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES = [
        "#94B3AF",
        "#727998",
        "#645468",
        "#4D5F7F",
        "#855DB6",
        "#5E5ADB",
        "#678FFF",
        "#6BB4EF",
        "#4A9BAE",
        "#66C4C6",
        "#55D388",
        "#99DB7A",
        "#ECCC7B",
        "#E7A538",
        "#DD6B4C",
        "#D65D62"
      ];
    }
  });

  // pages/new-tab/app/favorites/components/Tile.js
  function Tile_({ url: url4, faviconSrc, faviconMax, index, title, id, dropped }) {
    const { state, ref } = useItemState(url4, id);
    return /* @__PURE__ */ _(
      "a",
      {
        class: Tile_default.item,
        tabindex: 0,
        role: "button",
        href: url4,
        "data-id": id,
        "data-index": index,
        "data-dropped": String(dropped),
        "data-edge": "closestEdge" in state && state.closestEdge,
        ref
      },
      /* @__PURE__ */ _("div", { class: (0, import_classnames4.default)(Tile_default.icon, Tile_default.draggable) }, /* @__PURE__ */ _(ImageLoader, { faviconSrc: faviconSrc || "n/a", faviconMax: faviconMax || DDG_DEFAULT_ICON_SIZE, title, url: url4 })),
      /* @__PURE__ */ _("div", { class: Tile_default.text }, title),
      state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ _("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null
    );
  }
  function ImageLoader({ faviconSrc, faviconMax, title, url: url4 }) {
    const imgError = (e4) => {
      if (!e4.target) return;
      if (!(e4.target instanceof HTMLImageElement)) return;
      if (e4.target.src === e4.target.dataset.fallback) return console.warn("refusing to load same fallback");
      if (e4.target.dataset.didTryFallback) {
        e4.target.dataset.errored = String(true);
        return;
      }
      e4.target.dataset.didTryFallback = String(true);
      e4.target.src = e4.target.dataset.fallback;
    };
    const imgLoaded = (e4) => {
      if (!e4.target) return;
      if (!(e4.target instanceof HTMLImageElement)) return;
      e4.target.dataset.loaded = String(true);
      if (e4.target.src.endsWith("other.svg")) {
        return;
      }
      if (e4.target.dataset.didTryFallback) {
        e4.target.style.background = urlToColor(url4);
      }
    };
    const size = Math.min(faviconMax, DDG_DEFAULT_ICON_SIZE);
    const src = faviconSrc + "?preferredSize=" + size;
    return /* @__PURE__ */ _(
      "img",
      {
        src,
        className: Tile_default.favicon,
        alt: `favicon for ${title}`,
        onLoad: imgLoaded,
        onError: imgError,
        "data-src": faviconSrc,
        "data-fallback": fallbackSrcFor(url4) || DDG_FALLBACK_ICON
      }
    );
  }
  function fallbackSrcFor(url4) {
    if (!url4) return null;
    try {
      const parsed = new URL(url4);
      const char1 = parsed.hostname.match(/[a-z]/i)?.[0];
      if (char1) {
        return `./letters/${char1}.svg`;
      }
    } catch (e4) {
    }
    return null;
  }
  function Placeholder() {
    const id = g2();
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`);
    return /* @__PURE__ */ _("div", { className: Tile_default.item, ref, "data-edge": "closestEdge" in state && state.closestEdge }, /* @__PURE__ */ _("div", { className: (0, import_classnames4.default)(Tile_default.icon, Tile_default.placeholder) }), state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ _("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null);
  }
  function PlusIconWrapper({ onClick }) {
    const id = g2();
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import('../strings.json')} */
      {}
    );
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`);
    return /* @__PURE__ */ _("div", { class: Tile_default.item, ref, "data-edge": "closestEdge" in state && state.closestEdge }, /* @__PURE__ */ _("button", { class: (0, import_classnames4.default)(Tile_default.icon, Tile_default.placeholder, Tile_default.plus), "aria-labelledby": id, onClick }, /* @__PURE__ */ _(PlusIcon, null)), /* @__PURE__ */ _("div", { class: Tile_default.text, id }, t4("favorites_add")), state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ _("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null);
  }
  var import_classnames4, Tile, PlusIconMemo;
  var init_Tile2 = __esm({
    "pages/new-tab/app/favorites/components/Tile.js"() {
      "use strict";
      init_preact_module();
      import_classnames4 = __toESM(require_classnames(), 1);
      init_hooks_module();
      init_compat_module();
      init_Tile();
      init_color();
      init_constants();
      init_PragmaticDND();
      init_types();
      init_Icons2();
      Tile = C3(Tile_);
      PlusIconMemo = C3(PlusIconWrapper);
    }
  });

  // pages/new-tab/app/favorites/components/TileRow.js
  function TileRow_({ topOffset, items, add, dropped }) {
    const fillers = ROW_CAPACITY - items.length;
    return /* @__PURE__ */ _("ul", { className: Favorites_default.gridRow, style: { top: topOffset + "px" } }, items.map((item, index) => {
      return /* @__PURE__ */ _(
        Tile,
        {
          url: item.url,
          faviconSrc: item.favicon?.src,
          faviconMax: item.favicon?.maxAvailableSize,
          title: item.title,
          key: item.id + item.favicon?.src + item.favicon?.maxAvailableSize,
          id: item.id,
          index,
          dropped: dropped === item.id
        }
      );
    }), fillers > 0 && Array.from({ length: fillers }).map((_5, fillerIndex) => {
      if (fillerIndex === 0) {
        return /* @__PURE__ */ _(PlusIconMemo, { key: "placeholder-plus", onClick: add });
      }
      return /* @__PURE__ */ _(Placeholder, { key: `placeholder-${fillerIndex}` });
    }));
  }
  var TileRow;
  var init_TileRow = __esm({
    "pages/new-tab/app/favorites/components/TileRow.js"() {
      "use strict";
      init_Favorites();
      init_Tile2();
      init_preact_module();
      init_compat_module();
      init_Favorites2();
      TileRow = C3(TileRow_);
    }
  });

  // pages/new-tab/app/favorites/components/Favorites.js
  function Favorites({ gridRef, favorites: favorites2, expansion, toggle, openContextMenu, openFavorite, add }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import('../strings.json')} */
      {}
    );
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    const hiddenCount = expansion === "collapsed" ? favorites2.length - ROW_CAPACITY : 0;
    const rowHeight = ITEM_HEIGHT + ROW_GAP;
    const canToggleExpansion = favorites2.length >= ROW_CAPACITY;
    return /* @__PURE__ */ _("div", { class: (0, import_classnames5.default)(Favorites_default.root, !canToggleExpansion && Favorites_default.noExpansionBtn), "data-testid": "FavoritesConfigured" }, /* @__PURE__ */ _(
      VirtualizedGridRows,
      {
        WIDGET_ID,
        favorites: favorites2,
        rowHeight,
        add,
        expansion,
        openFavorite,
        openContextMenu
      }
    ), canToggleExpansion && /* @__PURE__ */ _(
      "div",
      {
        className: (0, import_classnames5.default)({
          [Favorites_default.showhide]: true,
          [Favorites_default.showhideVisible]: canToggleExpansion
        })
      },
      /* @__PURE__ */ _(
        ShowHideButton,
        {
          buttonAttrs: {
            "aria-expanded": expansion === "expanded",
            "aria-pressed": expansion === "expanded",
            "aria-controls": WIDGET_ID,
            id: TOGGLE_ID
          },
          text: expansion === "expanded" ? t4("favorites_show_less") : t4("favorites_show_more", { count: String(hiddenCount) }),
          onClick: toggle
        }
      )
    ));
  }
  function VirtualizedGridRows({ WIDGET_ID, rowHeight, favorites: favorites2, expansion, openFavorite, openContextMenu, add }) {
    const platformName = usePlatformName();
    const rows = T2(() => {
      const chunked = [];
      let inner = [];
      for (let i5 = 0; i5 < favorites2.length; i5++) {
        inner.push(favorites2[i5]);
        if (inner.length === ROW_CAPACITY) {
          chunked.push(inner.slice());
          inner = [];
        }
        if (i5 === favorites2.length - 1) {
          chunked.push(inner.slice());
          inner = [];
        }
      }
      return chunked;
    }, [favorites2]);
    const safeAreaRef = (
      /** @type {import("preact").RefObject<HTMLDivElement>} */
      useDropzoneSafeArea()
    );
    const containerHeight = expansion === "collapsed" || rows.length === 0 ? rowHeight : rows.length * rowHeight;
    return /* @__PURE__ */ _(
      "div",
      {
        className: Favorites_default.grid,
        style: { height: containerHeight + "px" },
        id: WIDGET_ID,
        ref: safeAreaRef,
        onContextMenu: getContextMenuHandler(openContextMenu),
        onClick: getOnClickHandler(openFavorite, platformName)
      },
      rows.length === 0 && /* @__PURE__ */ _(TileRow, { key: "empty-rows", items: [], topOffset: 0, add }),
      rows.length > 0 && /* @__PURE__ */ _(Inner, { rows, safeAreaRef, rowHeight, add })
    );
  }
  function Inner({ rows, safeAreaRef, rowHeight, add }) {
    const { onConfigChanged, state } = x2(FavoritesContext);
    const [expansion, setExpansion] = h2(state.config?.expansion || "collapsed");
    y2(() => {
      return onConfigChanged((config) => {
        if (config.expansion === "expanded") {
          setTimeout(() => {
            setExpansion(config.expansion);
          }, 0);
        } else {
          setExpansion(config.expansion);
        }
      });
    }, [onConfigChanged]);
    const [{ start: start2, end }, setVisibleRange] = h2({ start: 0, end: 1 });
    const gridOffset = A2(0);
    _2(() => {
      const mainScroller = document.querySelector("[data-main-scroller]") || document.documentElement;
      const contentTube = document.querySelector("[data-content-tube]") || document.body;
      if (!mainScroller) return console.warn("cannot find scrolling element");
      if (!contentTube) return console.warn("cannot find content tube");
      function updateGlobals(scrollY) {
        if (!safeAreaRef.current) return;
        const rec = safeAreaRef.current.getBoundingClientRect();
        gridOffset.current = rec.y + scrollY;
      }
      function setVisibleRowsForOffset(scrollY) {
        if (!safeAreaRef.current) return console.warn("cannot access ref");
        if (!gridOffset.current) return console.warn("cannot access ref");
        const offset = gridOffset.current;
        const end2 = scrollY + window.innerHeight - offset;
        let start3;
        if (offset > scrollY) {
          start3 = 0;
        } else {
          start3 = scrollY - offset;
        }
        const startIndex = Math.floor(start3 / rowHeight);
        const endIndex = Math.min(Math.ceil(end2 / rowHeight), rows.length);
        setVisibleRange({ start: startIndex, end: endIndex });
      }
      updateGlobals(mainScroller.scrollTop);
      setVisibleRowsForOffset(mainScroller.scrollTop);
      const controller = new AbortController();
      window.addEventListener(
        "resize",
        () => {
          updateGlobals(mainScroller.scrollTop);
          setVisibleRowsForOffset(mainScroller.scrollTop);
        },
        { signal: controller.signal }
      );
      const resizer = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          updateGlobals(mainScroller.scrollTop);
          setVisibleRowsForOffset(mainScroller.scrollTop);
        });
      });
      resizer.observe(contentTube);
      mainScroller.addEventListener(
        "scroll",
        () => {
          setVisibleRowsForOffset(mainScroller.scrollTop);
        },
        { signal: controller.signal }
      );
      return () => {
        controller.abort();
        resizer.disconnect();
      };
    }, [rows.length]);
    const subsetOfRowsToRender = expansion === "collapsed" ? [rows[0]] : rows.slice(start2, end + 1);
    const dropped = document.documentElement.dataset.dropped;
    return /* @__PURE__ */ _(b, null, subsetOfRowsToRender.map((items, rowIndex) => {
      const topOffset = expansion === "expanded" ? (start2 + rowIndex) * rowHeight : 0;
      const keyed = `-${start2 + rowIndex}-`;
      return /* @__PURE__ */ _(TileRow, { key: keyed, dropped, items, topOffset, add });
    }));
  }
  function getContextMenuHandler(openContextMenu) {
    return (event) => {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      while (target && target !== event.currentTarget) {
        if (typeof target.dataset.id === "string" && "href" in target && typeof target.href === "string") {
          event.preventDefault();
          event.stopImmediatePropagation();
          return openContextMenu(target.dataset.id);
        } else {
          target = target.parentElement;
        }
      }
    };
  }
  function getOnClickHandler(openFavorite, platformName) {
    return (event) => {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      while (target && target !== event.currentTarget) {
        if (typeof target.dataset.id === "string" && "href" in target && typeof target.href === "string") {
          event.preventDefault();
          event.stopImmediatePropagation();
          const isControlClick = platformName === "macos" ? event.metaKey : event.ctrlKey;
          if (isControlClick) {
            return openFavorite(target.dataset.id, target.href, "new-tab");
          } else if (event.shiftKey) {
            return openFavorite(target.dataset.id, target.href, "new-window");
          }
          return openFavorite(target.dataset.id, target.href, "same-tab");
        } else {
          target = target.parentElement;
        }
      }
    };
  }
  var import_classnames5, FavoritesMemo, ROW_CAPACITY, ITEM_HEIGHT, ROW_GAP;
  var init_Favorites2 = __esm({
    "pages/new-tab/app/favorites/components/Favorites.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_compat_module();
      import_classnames5 = __toESM(require_classnames(), 1);
      init_Favorites();
      init_ShowHideButton();
      init_types();
      init_settings_provider();
      init_dropzone();
      init_TileRow();
      init_FavoritesProvider();
      FavoritesMemo = C3(Favorites);
      ROW_CAPACITY = 6;
      ITEM_HEIGHT = 98;
      ROW_GAP = 8;
    }
  });

  // pages/new-tab/app/favorites/components/FavoritesCustomized.js
  function FavoritesConsumer() {
    const { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add } = x2(FavoritesContext);
    const telemetry2 = useTelemetry();
    if (state.status === "ready") {
      telemetry2.measureFromPageLoad("favorites-will-render", "time to favorites");
      return /* @__PURE__ */ _(PragmaticDND, { items: state.data.favorites, itemsDidReOrder: favoritesDidReOrder }, /* @__PURE__ */ _(
        FavoritesMemo,
        {
          favorites: state.data.favorites,
          expansion: state.config.expansion,
          openContextMenu,
          openFavorite,
          add,
          toggle
        }
      ));
    }
    return null;
  }
  function FavoritesCustomized() {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const { id, visibility, toggle, index } = useVisibility();
    const title = t4("favorites_menu_title");
    useCustomizer({ title, id, icon: "star", toggle, visibility: visibility.value, index });
    if (visibility.value === "hidden") {
      return null;
    }
    return /* @__PURE__ */ _(FavoritesProvider, null, /* @__PURE__ */ _(FavoritesConsumer, null));
  }
  var init_FavoritesCustomized = __esm({
    "pages/new-tab/app/favorites/components/FavoritesCustomized.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_widget_config_provider();
      init_Customizer2();
      init_FavoritesProvider();
      init_PragmaticDND();
      init_Favorites2();
    }
  });

  // pages/new-tab/app/entry-points/favorites.js
  var favorites_exports = {};
  __export(favorites_exports, {
    factory: () => factory
  });
  function factory() {
    return /* @__PURE__ */ _(Centered, { "data-entry-point": "favorites" }, /* @__PURE__ */ _(FavoritesCustomized, null));
  }
  var init_favorites = __esm({
    "pages/new-tab/app/entry-points/favorites.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_FavoritesCustomized();
    }
  });

  // shared/components/Button/Button.module.css
  var Button_default;
  var init_Button = __esm({
    "shared/components/Button/Button.module.css"() {
      Button_default = {
        button: "Button_button",
        standard: "Button_standard",
        accent: "Button_accent",
        accentBrand: "Button_accentBrand",
        primary: "Button_primary",
        ghost: "Button_ghost"
      };
    }
  });

  // shared/components/Button/Button.js
  function Button({ variant, className, children, onClick, type = "button" }) {
    return /* @__PURE__ */ _(
      "button",
      {
        className: (0, import_classnames6.default)(Button_default.button, { [Button_default[`${variant}`]]: !!variant }, className),
        type,
        onClick: (
          /**
           * @param {import("preact").JSX.TargetedMouseEvent<EventTarget>} event
           */
          (event) => {
            if (onClick) {
              onClick(event);
            }
          }
        )
      },
      children
    );
  }
  var import_classnames6;
  var init_Button2 = __esm({
    "shared/components/Button/Button.js"() {
      "use strict";
      init_preact_module();
      import_classnames6 = __toESM(require_classnames(), 1);
      init_Button();
    }
  });

  // pages/new-tab/app/components/DismissButton.module.css
  var DismissButton_default;
  var init_DismissButton = __esm({
    "pages/new-tab/app/components/DismissButton.module.css"() {
      DismissButton_default = {
        btn: "DismissButton_btn"
      };
    }
  });

  // pages/new-tab/app/components/DismissButton.jsx
  function DismissButton({ className, onClick }) {
    const { t: t4 } = useTypedTranslation();
    return /* @__PURE__ */ _("button", { class: (0, import_classnames7.default)(DismissButton_default.btn, className), onClick, "aria-label": t4("ntp_dismiss"), "data-testid": "dismissBtn" }, /* @__PURE__ */ _(Cross, null));
  }
  var import_classnames7;
  var init_DismissButton2 = __esm({
    "pages/new-tab/app/components/DismissButton.jsx"() {
      "use strict";
      init_preact_module();
      import_classnames7 = __toESM(require_classnames(), 1);
      init_Icons2();
      init_types();
      init_DismissButton();
    }
  });

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.module.css
  var FreemiumPIRBanner_default;
  var init_FreemiumPIRBanner = __esm({
    "pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.module.css"() {
      FreemiumPIRBanner_default = {
        root: "FreemiumPIRBanner_root",
        icon: "FreemiumPIRBanner_icon",
        "animate-fade": "FreemiumPIRBanner_animate-fade",
        iconBlock: "FreemiumPIRBanner_iconBlock",
        content: "FreemiumPIRBanner_content",
        title: "FreemiumPIRBanner_title",
        description: "FreemiumPIRBanner_description",
        btnBlock: "FreemiumPIRBanner_btnBlock",
        btnRow: "FreemiumPIRBanner_btnRow",
        dismissBtn: "FreemiumPIRBanner_dismissBtn"
      };
    }
  });

  // pages/new-tab/app/freemium-pir-banner/freemiumPIRBanner.service.js
  var FreemiumPIRBannerService;
  var init_freemiumPIRBanner_service = __esm({
    "pages/new-tab/app/freemium-pir-banner/freemiumPIRBanner.service.js"() {
      "use strict";
      init_service();
      FreemiumPIRBannerService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.ntp = ntp;
          this.dataService = new Service({
            initial: () => ntp.messaging.request("freemiumPIRBanner_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("freemiumPIRBanner_onDataUpdate", cb)
          });
        }
        name() {
          return "FreemiumPIRBannerService";
        }
        /**
         * @returns {Promise<FreemiumPIRBannerData>}
         * @internal
         */
        async getInitial() {
          return await this.dataService.fetchInitial();
        }
        /**
         * @internal
         */
        destroy() {
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: FreemiumPIRBannerData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @param {string} id
         * @internal
         */
        dismiss(id) {
          return this.ntp.messaging.notify("freemiumPIRBanner_dismiss", { id });
        }
        /**
         * @param {string} id
         */
        action(id) {
          this.ntp.messaging.notify("freemiumPIRBanner_action", { id });
        }
      };
    }
  });

  // pages/new-tab/app/freemium-pir-banner/FreemiumPIRBannerProvider.js
  function FreemiumPIRBannerProvider(props) {
    const initial = (
      /** @type {State} */
      {
        status: "idle",
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService2();
    useInitialData({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const dismiss = q2(
      (id) => {
        console.log("onDismiss");
        service.current?.dismiss(id);
      },
      [service]
    );
    const action = q2(
      (id) => {
        service.current?.action(id);
      },
      [service]
    );
    return /* @__PURE__ */ _(FreemiumPIRBannerContext.Provider, { value: { state, dismiss, action } }, /* @__PURE__ */ _(FreemiumPIRBannerDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService2() {
    const service = A2(
      /** @type {FreemiumPIRBannerService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new FreemiumPIRBannerService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var FreemiumPIRBannerContext, FreemiumPIRBannerDispatchContext;
  var init_FreemiumPIRBannerProvider = __esm({
    "pages/new-tab/app/freemium-pir-banner/FreemiumPIRBannerProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_freemiumPIRBanner_service();
      init_service_hooks();
      FreemiumPIRBannerContext = G({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {(id: string) => void} */
        dismiss: (id) => {
          throw new Error("must implement dismiss" + id);
        },
        /** @type {(id: string) => void} */
        action: (id) => {
          throw new Error("must implement action" + id);
        }
      });
      FreemiumPIRBannerDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/freemium-pir-banner/freemiumPIRBanner.utils.js
  function convertMarkdownToHTMLForStrongTags(markdown) {
    markdown = escapeXML(markdown);
    const regex = /\*\*(.*?)\*\*/g;
    const result = markdown.replace(regex, "<strong>$1</strong>");
    return result;
  }
  function escapeXML(str) {
    const replacements = {
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
      "<": "&lt;",
      ">": "&gt;",
      "/": "&#x2F;"
    };
    return String(str).replace(/[&"'<>/]/g, (m3) => replacements[m3]);
  }
  var init_freemiumPIRBanner_utils = __esm({
    "pages/new-tab/app/freemium-pir-banner/freemiumPIRBanner.utils.js"() {
      "use strict";
    }
  });

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.js
  function FreemiumPIRBanner({ message, action, dismiss }) {
    const processedMessageDescription = convertMarkdownToHTMLForStrongTags(message.descriptionText);
    return /* @__PURE__ */ _("div", { id: message.id, class: (0, import_classnames8.default)(FreemiumPIRBanner_default.root, FreemiumPIRBanner_default.icon) }, /* @__PURE__ */ _("span", { class: FreemiumPIRBanner_default.iconBlock }, /* @__PURE__ */ _("img", { src: `./icons/Information-Remover-96.svg`, alt: "" })), /* @__PURE__ */ _("div", { class: FreemiumPIRBanner_default.content }, message.titleText && /* @__PURE__ */ _("h2", { class: FreemiumPIRBanner_default.title }, message.titleText), /* @__PURE__ */ _("p", { class: FreemiumPIRBanner_default.description, dangerouslySetInnerHTML: { __html: processedMessageDescription } })), message.messageType === "big_single_action" && message?.actionText && action && /* @__PURE__ */ _("div", { class: FreemiumPIRBanner_default.btnBlock }, /* @__PURE__ */ _(Button, { variant: "standard", onClick: () => action(message.id) }, message.actionText)), message.id && dismiss && /* @__PURE__ */ _(DismissButton, { className: FreemiumPIRBanner_default.dismissBtn, onClick: () => dismiss(message.id) }));
  }
  function FreemiumPIRBannerConsumer() {
    const { state, action, dismiss } = x2(FreemiumPIRBannerContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ _(FreemiumPIRBanner, { message: state.data.content, action, dismiss });
    }
    return null;
  }
  var import_classnames8;
  var init_FreemiumPIRBanner2 = __esm({
    "pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.js"() {
      "use strict";
      import_classnames8 = __toESM(require_classnames(), 1);
      init_preact_module();
      init_Button2();
      init_DismissButton2();
      init_FreemiumPIRBanner();
      init_FreemiumPIRBannerProvider();
      init_hooks_module();
      init_freemiumPIRBanner_utils();
    }
  });

  // pages/new-tab/app/entry-points/freemiumPIRBanner.js
  var freemiumPIRBanner_exports = {};
  __export(freemiumPIRBanner_exports, {
    factory: () => factory2
  });
  function factory2() {
    return /* @__PURE__ */ _(Centered, { "data-entry-point": "freemiumPIRBanner" }, /* @__PURE__ */ _(FreemiumPIRBannerProvider, null, /* @__PURE__ */ _(FreemiumPIRBannerConsumer, null)));
  }
  var init_freemiumPIRBanner = __esm({
    "pages/new-tab/app/entry-points/freemiumPIRBanner.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_FreemiumPIRBanner2();
      init_FreemiumPIRBannerProvider();
    }
  });

  // pages/new-tab/app/next-steps/next-steps.service.js
  var NextStepsService;
  var init_next_steps_service = __esm({
    "pages/new-tab/app/next-steps/next-steps.service.js"() {
      "use strict";
      init_service();
      NextStepsService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.ntp = ntp;
          this.dataService = new Service({
            initial: () => ntp.messaging.request("nextSteps_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("nextSteps_onDataUpdate", cb)
          });
          this.configService = new Service({
            initial: () => ntp.messaging.request("nextSteps_getConfig"),
            subscribe: (cb) => ntp.messaging.subscribe("nextSteps_onConfigUpdate", cb),
            persist: (data) => ntp.messaging.notify("nextSteps_setConfig", data)
          });
        }
        name() {
          return "NextStepsService";
        }
        /**
         * @returns {Promise<{data: NextStepsData; config: NextStepsConfig}>}
         * @internal
         */
        async getInitial() {
          const p1 = this.configService.fetchInitial();
          const p22 = this.dataService.fetchInitial();
          const [config, data] = await Promise.all([p1, p22]);
          return { config, data };
        }
        /**
         * @internal
         */
        destroy() {
          this.configService.destroy();
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: NextStepsData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @param {(evt: {data: NextStepsConfig, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onConfig(cb) {
          return this.configService.onData(cb);
        }
        /**
         * Update the in-memory data immediate and persist.
         * Any state changes will be broadcast to consumers synchronously
         * @internal
         */
        toggleExpansion() {
          this.configService.update((old) => {
            if (old.expansion === "expanded") {
              return { ...old, expansion: (
                /** @type {const} */
                "collapsed"
              ) };
            } else {
              return { ...old, expansion: (
                /** @type {const} */
                "expanded"
              ) };
            }
          });
        }
        /**
         * Dismiss a particular card
         * @param {string} id
         */
        dismiss(id) {
          this.ntp.messaging.notify("nextSteps_dismiss", { id });
        }
        /**
         * Perform a primary action on a card
         * @param {string} id
         */
        action(id) {
          this.ntp.messaging.notify("nextSteps_action", { id });
        }
      };
    }
  });

  // pages/new-tab/app/next-steps/NextStepsProvider.js
  function NextStepsProvider(props) {
    const initial = (
      /** @type {State} */
      {
        status: "idle",
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService3();
    useInitialDataAndConfig({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    const action = q2(
      (id) => {
        service.current?.action(id);
      },
      [service]
    );
    const dismiss = q2(
      (id) => {
        service.current?.dismiss(id);
      },
      [service]
    );
    return /* @__PURE__ */ _(NextStepsContext.Provider, { value: { state, toggle, action, dismiss } }, /* @__PURE__ */ _(NextStepsDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService3() {
    const service = A2(
      /** @type {NextStepsService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new NextStepsService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var NextStepsContext, NextStepsDispatchContext;
  var init_NextStepsProvider = __esm({
    "pages/new-tab/app/next-steps/NextStepsProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_next_steps_service();
      init_service_hooks();
      NextStepsContext = G({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        toggle: () => {
          throw new Error("must implement");
        },
        /** @type {(id: string) => void} */
        dismiss: (_id) => {
          throw new Error("must implement");
        },
        /** @type {(id: string) => void} */
        action: (_id) => {
          throw new Error("must implement");
        }
      });
      NextStepsDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/next-steps/nextsteps.data.js
  var variants, otherText, cardsWithConfirmationText, additionalCardStates;
  var init_nextsteps_data = __esm({
    "pages/new-tab/app/next-steps/nextsteps.data.js"() {
      "use strict";
      variants = {
        /** @param {(translationId: keyof enStrings) => string} t */
        bringStuff: (t4) => ({
          id: "bringStuff",
          icon: "Bring-Stuff",
          title: t4("nextSteps_bringStuff_title"),
          summary: t4("nextSteps_bringStuff_summary"),
          actionText: t4("nextSteps_bringStuff_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        defaultApp: (t4) => ({
          id: "defaultApp",
          icon: "Default-App",
          title: t4("nextSteps_defaultApp_title"),
          summary: t4("nextSteps_defaultApp_summary"),
          actionText: t4("nextSteps_defaultApp_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        blockCookies: (t4) => ({
          id: "blockCookies",
          icon: "Cookie-Pops",
          title: t4("nextSteps_blockCookies_title"),
          summary: t4("nextSteps_blockCookies_summary"),
          actionText: t4("nextSteps_blockCookies_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        emailProtection: (t4) => ({
          id: "emailProtection",
          icon: "Email-Protection",
          title: t4("nextSteps_emailProtection_title"),
          summary: t4("nextSteps_emailProtection_summary"),
          actionText: t4("nextSteps_emailProtection_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        duckplayer: (t4) => ({
          id: "duckplayer",
          icon: "Tube-Clean",
          title: t4("nextSteps_duckPlayer_title"),
          summary: t4("nextSteps_duckPlayer_summary"),
          actionText: t4("nextSteps_duckPlayer_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        addAppToDockMac: (t4) => ({
          id: "addAppToDockMac",
          icon: "Dock-Add-Mac",
          title: t4("nextSteps_addAppDockMac_title"),
          summary: t4("nextSteps_addAppDockMac_summary"),
          actionText: t4("nextSteps_addAppDockMac_actionText"),
          confirmationText: t4("nextSteps_addAppDockMac_confirmationText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        pinAppToTaskbarWindows: (t4) => ({
          id: "pinAppToTaskbarWindows",
          icon: "Dock-Add-Windows",
          title: t4("nextSteps_pinAppToTaskbarWindows_title"),
          summary: t4("nextSteps_pinAppToTaskbarWindows_summary"),
          actionText: t4("nextSteps_pinAppToTaskbarWindows_actionText")
        })
      };
      otherText = {
        /** @param {(translationId: keyof ntpStrings) => string} t */
        showMore: (t4) => t4("ntp_show_more"),
        /** @param {(translationId: keyof ntpStrings) => string} t */
        showLess: (t4) => t4("ntp_show_less"),
        /** @param {(translationId: keyof enStrings) => string} t */
        nextSteps_sectionTitle: (t4) => t4("nextSteps_sectionTitle")
      };
      cardsWithConfirmationText = ["addAppToDockMac"];
      additionalCardStates = {
        hasConfirmationText: (variantId) => cardsWithConfirmationText.includes(variantId)
      };
    }
  });

  // pages/new-tab/app/next-steps/components/NextSteps.module.css
  var NextSteps_default;
  var init_NextSteps = __esm({
    "pages/new-tab/app/next-steps/components/NextSteps.module.css"() {
      NextSteps_default = {
        card: "NextSteps_card",
        icon: "NextSteps_icon",
        title: "NextSteps_title",
        description: "NextSteps_description",
        btn: "NextSteps_btn",
        supressActiveStateForSwitchToConfirmationText: "NextSteps_supressActiveStateForSwitchToConfirmationText",
        confirmation: "NextSteps_confirmation",
        dismissBtn: "NextSteps_dismissBtn",
        cardGroup: "NextSteps_cardGroup",
        showhide: "NextSteps_showhide",
        noExpansionBtn: "NextSteps_noExpansionBtn",
        cardGrid: "NextSteps_cardGrid",
        bubble: "NextSteps_bubble",
        nextStepsCard: "NextSteps_nextStepsCard"
      };
    }
  });

  // pages/new-tab/app/next-steps/components/NextStepsCard.js
  function NextStepsCard({ type, dismiss, action }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const message = variants[type]?.(t4);
    const [showConfirmation, setShowConfirmation] = h2(false);
    const hasConfirmationState = additionalCardStates.hasConfirmationText(type);
    const handleClick = () => {
      if (!hasConfirmationState) {
        return action(message.id);
      }
      action(message.id);
      setShowConfirmation(true);
    };
    return /* @__PURE__ */ _("div", { class: NextSteps_default.card }, /* @__PURE__ */ _("img", { src: `./icons/${message.icon}-128.svg`, alt: "", class: NextSteps_default.icon }), /* @__PURE__ */ _("h3", { class: NextSteps_default.title }, message.title), /* @__PURE__ */ _("p", { class: NextSteps_default.description }, message.summary), hasConfirmationState && !!showConfirmation ? /* @__PURE__ */ _("div", { class: NextSteps_default.confirmation }, /* @__PURE__ */ _(CheckColor, null), /* @__PURE__ */ _("p", null, message.confirmationText)) : /* @__PURE__ */ _(
      "button",
      {
        class: (0, import_classnames9.default)(NextSteps_default.btn, hasConfirmationState && NextSteps_default.supressActiveStateForSwitchToConfirmationText),
        onClick: handleClick
      },
      message.actionText
    ), /* @__PURE__ */ _(DismissButton, { className: NextSteps_default.dismissBtn, onClick: () => dismiss(message.id) }));
  }
  var import_classnames9;
  var init_NextStepsCard = __esm({
    "pages/new-tab/app/next-steps/components/NextStepsCard.js"() {
      "use strict";
      init_preact_module();
      import_classnames9 = __toESM(require_classnames(), 1);
      init_hooks_module();
      init_DismissButton2();
      init_Icons2();
      init_types();
      init_nextsteps_data();
      init_NextSteps();
    }
  });

  // pages/new-tab/app/next-steps/components/NextStepsGroup.js
  function NextStepsCardGroup({ types, expansion, toggle, action, dismiss }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {strings} */
      {}
    );
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    const alwaysShown = types.length > 2 ? types.slice(0, 2) : types;
    return /* @__PURE__ */ _("div", { class: (0, import_classnames10.default)(NextSteps_default.cardGroup, types.length <= 2 && NextSteps_default.noExpansionBtn), id: WIDGET_ID }, /* @__PURE__ */ _(NextStepsBubbleHeader, null), /* @__PURE__ */ _("div", { class: NextSteps_default.cardGrid }, alwaysShown.map((type) => /* @__PURE__ */ _(NextStepsCard, { key: type, type, dismiss, action })), expansion === "expanded" && types.length > 2 && types.slice(2).map((type) => /* @__PURE__ */ _(NextStepsCard, { key: type, type, dismiss, action }))), types.length > 2 && /* @__PURE__ */ _(
      "div",
      {
        className: (0, import_classnames10.default)({
          [NextSteps_default.showhide]: types.length > 2,
          [NextSteps_default.showhideVisible]: types.length > 2
        })
      },
      /* @__PURE__ */ _(
        ShowHideButton,
        {
          buttonAttrs: {
            "aria-expanded": expansion === "expanded",
            "aria-pressed": expansion === "expanded",
            "aria-controls": WIDGET_ID,
            id: TOGGLE_ID
          },
          text: expansion === "expanded" ? otherText.showLess(t4) : otherText.showMore(t4),
          onClick: toggle
        }
      )
    ));
  }
  function NextStepsBubbleHeader() {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {strings} */
      {}
    );
    const text = otherText.nextSteps_sectionTitle(t4);
    return /* @__PURE__ */ _("div", { class: NextSteps_default.bubble }, /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "12", height: "26", viewBox: "0 0 12 26", fill: "none" }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12 0C5.37258 0 0 5.37258 0 12V25.3388C2.56367 22.0873 6.53807 20 11 20H12V0Z",
        fill: "#3969EF"
      }
    )), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("h2", null, text)), /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "10", height: "20", viewBox: "0 0 10 20", fill: "none" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M3.8147e-06 0C1.31322 1.566e-08 2.61358 0.258658 3.82684 0.761205C5.04009 1.26375 6.14249 2.00035 7.07107 2.92893C7.99966 3.85752 8.73625 4.95991 9.2388 6.17317C9.74135 7.38642 10 8.68678 10 10C10 11.3132 9.74135 12.6136 9.2388 13.8268C8.73625 15.0401 7.99966 16.1425 7.07107 17.0711C6.14248 17.9997 5.04009 18.7362 3.82684 19.2388C2.61358 19.7413 1.31322 20 0 20L3.8147e-06 10V0Z",
        fill: "#3969EF"
      }
    )));
  }
  var import_classnames10;
  var init_NextStepsGroup = __esm({
    "pages/new-tab/app/next-steps/components/NextStepsGroup.js"() {
      "use strict";
      init_preact_module();
      import_classnames10 = __toESM(require_classnames(), 1);
      init_hooks_module();
      init_ShowHideButton();
      init_types();
      init_nextsteps_data();
      init_NextSteps();
      init_NextStepsCard();
    }
  });

  // pages/new-tab/app/next-steps/NextSteps.js
  function NextStepsCustomized() {
    return /* @__PURE__ */ _(NextStepsProvider, null, /* @__PURE__ */ _(NextStepsConsumer, null));
  }
  function NextStepsConsumer() {
    const { state, toggle } = x2(NextStepsContext);
    if (state.status === "ready" && state.data.content) {
      const ids = state.data.content.map((x4) => x4.id);
      const { action, dismiss } = x2(NextStepsContext);
      return /* @__PURE__ */ _(NextStepsCardGroup, { types: ids, toggle, expansion: state.config.expansion, action, dismiss });
    }
    return null;
  }
  var init_NextSteps2 = __esm({
    "pages/new-tab/app/next-steps/NextSteps.js"() {
      "use strict";
      init_preact_module();
      init_NextStepsProvider();
      init_hooks_module();
      init_NextStepsGroup();
    }
  });

  // pages/new-tab/app/entry-points/nextSteps.js
  var nextSteps_exports = {};
  __export(nextSteps_exports, {
    factory: () => factory3
  });
  function factory3() {
    return /* @__PURE__ */ _(Centered, { "data-entry-point": "nextSteps" }, /* @__PURE__ */ _(NextStepsCustomized, null));
  }
  var init_nextSteps = __esm({
    "pages/new-tab/app/entry-points/nextSteps.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_NextSteps2();
    }
  });

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.module.css
  var PrivacyStats_default;
  var init_PrivacyStats = __esm({
    "pages/new-tab/app/privacy-stats/components/PrivacyStats.module.css"() {
      PrivacyStats_default = {
        root: "PrivacyStats_root",
        listExpander: "PrivacyStats_listExpander",
        heading: "PrivacyStats_heading",
        subtitle: "PrivacyStats_subtitle",
        headingIcon: "PrivacyStats_headingIcon",
        title: "PrivacyStats_title",
        widgetExpander: "PrivacyStats_widgetExpander",
        uppercase: "PrivacyStats_uppercase",
        list: "PrivacyStats_list",
        entering: "PrivacyStats_entering",
        "fade-in": "PrivacyStats_fade-in",
        entered: "PrivacyStats_entered",
        exiting: "PrivacyStats_exiting",
        "fade-out": "PrivacyStats_fade-out",
        row: "PrivacyStats_row",
        otherTrackersRow: "PrivacyStats_otherTrackersRow",
        company: "PrivacyStats_company",
        icon: "PrivacyStats_icon",
        companyImgIcon: "PrivacyStats_companyImgIcon",
        name: "PrivacyStats_name",
        count: "PrivacyStats_count",
        bar: "PrivacyStats_bar",
        fill: "PrivacyStats_fill"
      };
    }
  });

  // pages/new-tab/app/privacy-stats/privacy-stats.service.js
  var PrivacyStatsService;
  var init_privacy_stats_service = __esm({
    "pages/new-tab/app/privacy-stats/privacy-stats.service.js"() {
      "use strict";
      init_service();
      PrivacyStatsService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.dataService = new Service({
            initial: () => ntp.messaging.request("stats_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("stats_onDataUpdate", cb)
          });
          this.configService = new Service({
            initial: () => ntp.messaging.request("stats_getConfig"),
            subscribe: (cb) => ntp.messaging.subscribe("stats_onConfigUpdate", cb),
            persist: (data) => ntp.messaging.notify("stats_setConfig", data)
          });
        }
        name() {
          return "PrivacyStatsService";
        }
        /**
         * @returns {Promise<{data: PrivacyStatsData; config: StatsConfig}>}
         * @internal
         */
        async getInitial() {
          const p1 = this.configService.fetchInitial();
          const p22 = this.dataService.fetchInitial();
          const [config, data] = await Promise.all([p1, p22]);
          return { config, data };
        }
        /**
         * @internal
         */
        destroy() {
          this.configService.destroy();
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: PrivacyStatsData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @param {(evt: {data: StatsConfig, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onConfig(cb) {
          return this.configService.onData(cb);
        }
        /**
         * Update the in-memory data immediate and persist.
         * Any state changes will be broadcast to consumers synchronously
         * @internal
         */
        toggleExpansion() {
          this.configService.update((old) => {
            if (old.expansion === "expanded") {
              return { ...old, expansion: (
                /** @type {const} */
                "collapsed"
              ) };
            } else {
              return { ...old, expansion: (
                /** @type {const} */
                "expanded"
              ) };
            }
          });
        }
      };
    }
  });

  // pages/new-tab/app/privacy-stats/PrivacyStatsProvider.js
  function PrivacyStatsProvider(props) {
    const initial = (
      /** @type {State} */
      {
        status: "idle",
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService4();
    useInitialDataAndConfig({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    return /* @__PURE__ */ _(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ _(PrivacyStatsDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService4() {
    const service = A2(
      /** @type {PrivacyStatsService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new PrivacyStatsService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var PrivacyStatsContext, PrivacyStatsDispatchContext;
  var init_PrivacyStatsProvider = __esm({
    "pages/new-tab/app/privacy-stats/PrivacyStatsProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_privacy_stats_service();
      init_service_hooks();
      PrivacyStatsContext = G({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        toggle: () => {
          throw new Error("must implement");
        }
      });
      PrivacyStatsDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/utils.js
  function viewTransition(fn) {
    if ("startViewTransition" in document && typeof document.startViewTransition === "function") {
      return document.startViewTransition(fn);
    }
    return fn();
  }
  function noop(named) {
    return () => {
      console.log(named, "noop");
    };
  }
  var init_utils = __esm({
    "pages/new-tab/app/utils.js"() {
      "use strict";
    }
  });

  // pages/new-tab/app/privacy-stats/constants.js
  var DDG_STATS_OTHER_COMPANY_IDENTIFIER;
  var init_constants2 = __esm({
    "pages/new-tab/app/privacy-stats/constants.js"() {
      "use strict";
      DDG_STATS_OTHER_COMPANY_IDENTIFIER = "__other__";
    }
  });

  // pages/new-tab/app/privacy-stats/privacy-stats.utils.js
  function sortStatsForDisplay(stats2) {
    const sorted = stats2.slice().sort((a4, b3) => b3.count - a4.count);
    const other = sorted.findIndex((x4) => x4.displayName === DDG_STATS_OTHER_COMPANY_IDENTIFIER);
    if (other > -1) {
      const popped = sorted.splice(other, 1);
      sorted.push(popped[0]);
    }
    return sorted;
  }
  function displayNameForCompany(companyName) {
    return companyName.replace(/\.[a-z]+$/i, "");
  }
  var init_privacy_stats_utils = __esm({
    "pages/new-tab/app/privacy-stats/privacy-stats.utils.js"() {
      "use strict";
      init_constants2();
    }
  });

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.js
  function PrivacyStats({ expansion, data, toggle, animation = "auto-animate" }) {
    if (animation === "view-transitions") {
      return /* @__PURE__ */ _(WithViewTransitions, { data, expansion, toggle });
    }
    return /* @__PURE__ */ _(PrivacyStatsConfigured, { expansion, data, toggle });
  }
  function WithViewTransitions({ expansion, data, toggle }) {
    const willToggle = q2(() => {
      viewTransition(toggle);
    }, [toggle]);
    return /* @__PURE__ */ _(PrivacyStatsConfigured, { expansion, data, toggle: willToggle });
  }
  function PrivacyStatsConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === "expanded";
    const someCompanies = data.trackerCompanies.length > 0;
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    return /* @__PURE__ */ _("div", { class: PrivacyStats_default.root, ref: parentRef }, /* @__PURE__ */ _(
      Heading,
      {
        trackerCompanies: data.trackerCompanies,
        onToggle: toggle,
        expansion,
        buttonAttrs: {
          "aria-controls": WIDGET_ID,
          id: TOGGLE_ID
        }
      }
    ), expanded && someCompanies && /* @__PURE__ */ _(PrivacyStatsBody, { trackerCompanies: data.trackerCompanies, listAttrs: { id: WIDGET_ID } }));
  }
  function Heading({ expansion, trackerCompanies, onToggle, buttonAttrs = {} }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const [formatter] = h2(() => new Intl.NumberFormat());
    const recent = trackerCompanies.reduce((sum, item) => sum + item.count, 0);
    const none = recent === 0;
    const some = recent > 0;
    const alltime = formatter.format(recent);
    const alltimeTitle = recent === 1 ? t4("stats_countBlockedSingular") : t4("stats_countBlockedPlural", { count: alltime });
    return /* @__PURE__ */ _("div", { className: PrivacyStats_default.heading }, /* @__PURE__ */ _("span", { className: PrivacyStats_default.headingIcon }, /* @__PURE__ */ _("img", { src: "./icons/shield.svg", alt: "Privacy Shield" })), none && /* @__PURE__ */ _("h2", { className: PrivacyStats_default.title }, t4("stats_noRecent")), some && /* @__PURE__ */ _("h2", { className: PrivacyStats_default.title }, alltimeTitle), recent > 0 && /* @__PURE__ */ _("span", { className: PrivacyStats_default.widgetExpander }, /* @__PURE__ */ _(
      ShowHideButton,
      {
        buttonAttrs: {
          ...buttonAttrs,
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded"
        },
        onClick: onToggle,
        text: expansion === "expanded" ? t4("stats_hideLabel") : t4("stats_toggleLabel"),
        shape: "round"
      }
    )), recent === 0 && /* @__PURE__ */ _("p", { className: PrivacyStats_default.subtitle }, t4("stats_noActivity")), recent > 0 && /* @__PURE__ */ _("p", { className: (0, import_classnames11.default)(PrivacyStats_default.subtitle, PrivacyStats_default.uppercase) }, t4("stats_feedCountBlockedPeriod")));
  }
  function PrivacyStatsBody({ trackerCompanies, listAttrs = {} }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const messaging2 = useMessaging();
    const [formatter] = h2(() => new Intl.NumberFormat());
    const defaultRowMax = 5;
    const sorted = sortStatsForDisplay(trackerCompanies);
    const max = sorted[0]?.count ?? 0;
    const [expansion, setExpansion] = h2(
      /** @type {Expansion} */
      "collapsed"
    );
    const toggleListExpansion = () => {
      if (expansion === "collapsed") {
        messaging2.statsShowMore();
      } else {
        messaging2.statsShowLess();
      }
      setExpansion(expansion === "collapsed" ? "expanded" : "collapsed");
    };
    const rows = expansion === "expanded" ? sorted : sorted.slice(0, defaultRowMax);
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("ul", { ...listAttrs, class: PrivacyStats_default.list, "data-testid": "CompanyList" }, rows.map((company) => {
      const percentage = Math.min(company.count * 100 / max, 100);
      const valueOrMin = Math.max(percentage, 10);
      const inlineStyles = {
        width: `${valueOrMin}%`
      };
      const countText = formatter.format(company.count);
      const displayName = displayNameForCompany(company.displayName);
      if (company.displayName === DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
        const otherText2 = t4("stats_otherCount", { count: String(company.count) });
        return /* @__PURE__ */ _("li", { key: company.displayName, class: PrivacyStats_default.otherTrackersRow }, otherText2);
      }
      return /* @__PURE__ */ _("li", { key: company.displayName, class: PrivacyStats_default.row }, /* @__PURE__ */ _("div", { class: PrivacyStats_default.company }, /* @__PURE__ */ _(CompanyIcon, { displayName }), /* @__PURE__ */ _("span", { class: PrivacyStats_default.name }, displayName)), /* @__PURE__ */ _("span", { class: PrivacyStats_default.count }, countText), /* @__PURE__ */ _("span", { class: PrivacyStats_default.bar }), /* @__PURE__ */ _("span", { class: PrivacyStats_default.fill, style: inlineStyles }));
    })), sorted.length > defaultRowMax && /* @__PURE__ */ _("div", { class: PrivacyStats_default.listExpander }, /* @__PURE__ */ _(
      ShowHideButton,
      {
        onClick: toggleListExpansion,
        text: expansion === "collapsed" ? t4("ntp_show_more") : t4("ntp_show_less"),
        showText: true,
        buttonAttrs: {
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded"
        }
      }
    )));
  }
  function PrivacyStatsCustomized() {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const { visibility, id, toggle, index } = useVisibility();
    const title = t4("stats_menuTitle");
    useCustomizer({ title, id, icon: "shield", toggle, visibility: visibility.value, index });
    if (visibility.value === "hidden") {
      return null;
    }
    return /* @__PURE__ */ _(PrivacyStatsProvider, null, /* @__PURE__ */ _(PrivacyStatsConsumer, null));
  }
  function PrivacyStatsConsumer() {
    const { state, toggle } = x2(PrivacyStatsContext);
    if (state.status === "ready") {
      return /* @__PURE__ */ _(PrivacyStats, { expansion: state.config.expansion, animation: state.config.animation?.kind, data: state.data, toggle });
    }
    return null;
  }
  function CompanyIcon({ displayName }) {
    const icon = displayName.toLowerCase().split(".")[0];
    const cleaned = icon.replace(/ /g, "-");
    const firstChar = icon[0];
    return /* @__PURE__ */ _("span", { className: PrivacyStats_default.icon }, icon === DDG_STATS_OTHER_COMPANY_IDENTIFIER && /* @__PURE__ */ _(Other, null), icon !== DDG_STATS_OTHER_COMPANY_IDENTIFIER && /* @__PURE__ */ _(
      "img",
      {
        src: `./company-icons/${cleaned}.svg`,
        alt: icon + " icon",
        className: PrivacyStats_default.companyImgIcon,
        onLoad: (e4) => {
          if (!e4.target) return;
          if (!(e4.target instanceof HTMLImageElement)) return;
          e4.target.dataset.loaded = String(true);
        },
        onError: (e4) => {
          if (!e4.target) return;
          if (!(e4.target instanceof HTMLImageElement)) return;
          if (e4.target.dataset.loadingFallback) {
            e4.target.dataset.errored = String(true);
            return;
          }
          e4.target.dataset.loadingFallback = String(true);
          e4.target.src = `./company-icons/${firstChar}.svg`;
        }
      }
    ));
  }
  function Other() {
    return /* @__PURE__ */ _("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", class: PrivacyStats_default.other }, /* @__PURE__ */ _(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M1 16C1 7.71573 7.71573 1 16 1C24.2843 1 31 7.71573 31 16C31 16.0648 30.9996 16.1295 30.9988 16.1941C30.9996 16.2126 31 16.2313 31 16.25C31 16.284 30.9986 16.3177 30.996 16.3511C30.8094 24.4732 24.1669 31 16 31C7.83308 31 1.19057 24.4732 1.00403 16.3511C1.00136 16.3177 1 16.284 1 16.25C1 16.2313 1.00041 16.2126 1.00123 16.1941C1.00041 16.1295 1 16.0648 1 16ZM3.58907 17.5C4.12835 22.0093 7.06824 25.781 11.0941 27.5006C10.8572 27.0971 10.6399 26.674 10.4426 26.24C9.37903 23.9001 8.69388 20.8489 8.53532 17.5H3.58907ZM8.51564 15H3.53942C3.91376 10.2707 6.92031 6.28219 11.0941 4.49944C10.8572 4.90292 10.6399 5.326 10.4426 5.76003C9.32633 8.21588 8.62691 11.4552 8.51564 15ZM11.0383 17.5C11.1951 20.5456 11.8216 23.2322 12.7185 25.2055C13.8114 27.6098 15.0657 28.5 16 28.5C16.9343 28.5 18.1886 27.6098 19.2815 25.2055C20.1784 23.2322 20.8049 20.5456 20.9617 17.5H11.0383ZM20.983 15H11.017C11.1277 11.7487 11.7728 8.87511 12.7185 6.79454C13.8114 4.39021 15.0657 3.5 16 3.5C16.9343 3.5 18.1886 4.39021 19.2815 6.79454C20.2272 8.87511 20.8723 11.7487 20.983 15ZM23.4647 17.5C23.3061 20.8489 22.621 23.9001 21.5574 26.24C21.3601 26.674 21.1428 27.0971 20.9059 27.5006C24.9318 25.781 27.8717 22.0093 28.4109 17.5H23.4647ZM28.4606 15H23.4844C23.3731 11.4552 22.6737 8.21588 21.5574 5.76003C21.3601 5.326 21.1428 4.90291 20.9059 4.49944C25.0797 6.28219 28.0862 10.2707 28.4606 15Z",
        fill: "currentColor"
      }
    ));
  }
  var import_classnames11;
  var init_PrivacyStats2 = __esm({
    "pages/new-tab/app/privacy-stats/components/PrivacyStats.js"() {
      "use strict";
      init_preact_module();
      import_classnames11 = __toESM(require_classnames(), 1);
      init_PrivacyStats();
      init_types();
      init_hooks_module();
      init_PrivacyStatsProvider();
      init_widget_config_provider();
      init_utils();
      init_ShowHideButton();
      init_Customizer2();
      init_constants2();
      init_privacy_stats_utils();
    }
  });

  // pages/new-tab/app/entry-points/privacyStats.js
  var privacyStats_exports = {};
  __export(privacyStats_exports, {
    factory: () => factory4
  });
  function factory4() {
    return /* @__PURE__ */ _(Centered, { "data-entry-point": "privacyStats" }, /* @__PURE__ */ _(PrivacyStatsCustomized, null));
  }
  var init_privacyStats = __esm({
    "pages/new-tab/app/entry-points/privacyStats.js"() {
      "use strict";
      init_preact_module();
      init_PrivacyStats2();
      init_Layout();
    }
  });

  // pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.module.css
  var RemoteMessagingFramework_default;
  var init_RemoteMessagingFramework = __esm({
    "pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.module.css"() {
      RemoteMessagingFramework_default = {
        root: "RemoteMessagingFramework_root",
        icon: "RemoteMessagingFramework_icon",
        "animate-fade": "RemoteMessagingFramework_animate-fade",
        iconBlock: "RemoteMessagingFramework_iconBlock",
        content: "RemoteMessagingFramework_content",
        title: "RemoteMessagingFramework_title",
        description: "RemoteMessagingFramework_description",
        btnBlock: "RemoteMessagingFramework_btnBlock",
        btnRow: "RemoteMessagingFramework_btnRow",
        dismissBtn: "RemoteMessagingFramework_dismissBtn"
      };
    }
  });

  // pages/new-tab/app/remote-messaging-framework/rmf.service.js
  var RMFService;
  var init_rmf_service = __esm({
    "pages/new-tab/app/remote-messaging-framework/rmf.service.js"() {
      "use strict";
      init_service();
      RMFService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.ntp = ntp;
          this.dataService = new Service({
            initial: () => ntp.messaging.request("rmf_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("rmf_onDataUpdate", cb)
          });
        }
        name() {
          return "RMFService";
        }
        /**
         * @returns {Promise<RMFData>}
         * @internal
         */
        async getInitial() {
          return await this.dataService.fetchInitial();
        }
        /**
         * @internal
         */
        destroy() {
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: RMFData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @param {string} id
         * @internal
         */
        dismiss(id) {
          return this.ntp.messaging.notify("rmf_dismiss", { id });
        }
        /**
         * @param {string} id
         */
        primaryAction(id) {
          this.ntp.messaging.notify("rmf_primaryAction", { id });
        }
        /**
         * @param {string} id
         */
        secondaryAction(id) {
          this.ntp.messaging.notify("rmf_secondaryAction", { id });
        }
      };
    }
  });

  // pages/new-tab/app/remote-messaging-framework/RMFProvider.js
  function RMFProvider(props) {
    const initial = (
      /** @type {State} */
      {
        status: "idle",
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService5();
    useInitialData({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const dismiss = q2(
      (id) => {
        console.log("onDismiss");
        service.current?.dismiss(id);
      },
      [service]
    );
    const primaryAction = q2(
      (id) => {
        service.current?.primaryAction(id);
      },
      [service]
    );
    const secondaryAction = q2(
      (id) => {
        console.log("secondaryAction");
        service.current?.secondaryAction(id);
      },
      [service]
    );
    return /* @__PURE__ */ _(RMFContext.Provider, { value: { state, dismiss, primaryAction, secondaryAction } }, /* @__PURE__ */ _(RMFDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService5() {
    const service = A2(
      /** @type {RMFService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new RMFService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var RMFContext, RMFDispatchContext;
  var init_RMFProvider = __esm({
    "pages/new-tab/app/remote-messaging-framework/RMFProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_rmf_service();
      init_service_hooks();
      RMFContext = G({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {(id: string) => void} */
        dismiss: (id) => {
          throw new Error("must implement dismiss" + id);
        },
        /** @type {(id: string) => void} */
        primaryAction: (id) => {
          throw new Error("must implement primaryAction" + id);
        },
        /** @type {(id: string) => void} */
        secondaryAction: (id) => {
          throw new Error("must implement secondaryAction" + id);
        }
      });
      RMFDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.js
  function RemoteMessagingFramework({ message, primaryAction, secondaryAction, dismiss }) {
    const { id, messageType, titleText, descriptionText } = message;
    const platform = usePlatformName();
    return /* @__PURE__ */ _("div", { id, class: (0, import_classnames12.default)(RemoteMessagingFramework_default.root, messageType !== "small" && message.icon && RemoteMessagingFramework_default.icon) }, messageType !== "small" && message.icon && /* @__PURE__ */ _("span", { class: RemoteMessagingFramework_default.iconBlock }, /* @__PURE__ */ _("img", { src: `./icons/${message.icon}.svg`, alt: "" })), /* @__PURE__ */ _("div", { class: RemoteMessagingFramework_default.content }, /* @__PURE__ */ _("h2", { class: RemoteMessagingFramework_default.title }, titleText), /* @__PURE__ */ _("p", { class: RemoteMessagingFramework_default.description }, descriptionText), messageType === "big_two_action" && /* @__PURE__ */ _("div", { class: RemoteMessagingFramework_default.btnRow }, platform === "windows" ? /* @__PURE__ */ _(b, null, primaryAction && message.primaryActionText.length > 0 && /* @__PURE__ */ _(Button, { variant: "accentBrand", onClick: () => primaryAction(id) }, message.primaryActionText), secondaryAction && message.secondaryActionText.length > 0 && /* @__PURE__ */ _(Button, { variant: "standard", onClick: () => secondaryAction(id) }, message.secondaryActionText)) : /* @__PURE__ */ _(b, null, secondaryAction && message.secondaryActionText.length > 0 && /* @__PURE__ */ _(Button, { variant: "standard", onClick: () => secondaryAction(id) }, message.secondaryActionText), primaryAction && message.primaryActionText.length > 0 && /* @__PURE__ */ _(Button, { variant: "accentBrand", onClick: () => primaryAction(id) }, message.primaryActionText)))), messageType === "big_single_action" && message.primaryActionText && primaryAction && /* @__PURE__ */ _("div", { class: RemoteMessagingFramework_default.btnBlock }, /* @__PURE__ */ _(Button, { variant: "standard", onClick: () => primaryAction(id) }, message.primaryActionText)), /* @__PURE__ */ _(DismissButton, { className: RemoteMessagingFramework_default.dismissBtn, onClick: () => dismiss(id) }));
  }
  function RMFConsumer() {
    const { state, primaryAction, secondaryAction, dismiss } = x2(RMFContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          message: state.data.content,
          primaryAction,
          secondaryAction,
          dismiss
        }
      );
    }
    return null;
  }
  var import_classnames12;
  var init_RemoteMessagingFramework2 = __esm({
    "pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.js"() {
      "use strict";
      init_preact_module();
      import_classnames12 = __toESM(require_classnames(), 1);
      init_RemoteMessagingFramework();
      init_hooks_module();
      init_RMFProvider();
      init_DismissButton2();
      init_Button2();
      init_settings_provider();
    }
  });

  // pages/new-tab/app/entry-points/rmf.js
  var rmf_exports = {};
  __export(rmf_exports, {
    factory: () => factory5
  });
  function factory5() {
    return /* @__PURE__ */ _(Centered, null, /* @__PURE__ */ _(RMFProvider, null, /* @__PURE__ */ _(RMFConsumer, null)));
  }
  var init_rmf = __esm({
    "pages/new-tab/app/entry-points/rmf.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_RemoteMessagingFramework2();
      init_RMFProvider();
    }
  });

  // pages/new-tab/app/update-notification/components/UpdateNotification.module.css
  var UpdateNotification_default;
  var init_UpdateNotification = __esm({
    "pages/new-tab/app/update-notification/components/UpdateNotification.module.css"() {
      UpdateNotification_default = {
        pulled: "UpdateNotification_pulled",
        root: "UpdateNotification_root",
        body: "UpdateNotification_body",
        details: "UpdateNotification_details",
        inlineLink: "UpdateNotification_inlineLink",
        summary: "UpdateNotification_summary",
        detailsContent: "UpdateNotification_detailsContent",
        list: "UpdateNotification_list",
        dismiss: "UpdateNotification_dismiss"
      };
    }
  });

  // pages/new-tab/app/update-notification/update-notification.service.js
  var UpdateNotificationService;
  var init_update_notification_service = __esm({
    "pages/new-tab/app/update-notification/update-notification.service.js"() {
      "use strict";
      init_service();
      UpdateNotificationService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @param {UpdateNotificationData} initial
         * @internal
         */
        constructor(ntp, initial) {
          this.ntp = ntp;
          this.dataService = new Service(
            {
              subscribe: (cb) => ntp.messaging.subscribe("updateNotification_onDataUpdate", cb)
            },
            initial
          );
        }
        /**
         * @internal
         */
        destroy() {
          this.dataService.destroy();
        }
        /**
         * @param {(evt: {data: UpdateNotificationData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        /**
         * @internal
         */
        dismiss() {
          this.ntp.messaging.notify("updateNotification_dismiss");
          this.dataService.update((_old) => {
            return { content: null };
          });
        }
      };
    }
  });

  // pages/new-tab/app/update-notification/UpdateNotificationProvider.js
  function UpdateNotificationProvider(props) {
    const { updateNotification } = useInitialSetupData();
    if (updateNotification === null) {
      return null;
    }
    return /* @__PURE__ */ _(UpdateNotificationWithInitial, { updateNotification }, props.children);
  }
  function UpdateNotificationWithInitial({ updateNotification, children }) {
    const initial = (
      /** @type {State} */
      {
        status: "ready",
        data: updateNotification,
        config: void 0
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const service = useService6(updateNotification);
    useDataSubscription({ dispatch, service });
    const dismiss = q2(() => {
      service.current?.dismiss();
    }, [service]);
    return /* @__PURE__ */ _(UpdateNotificationContext.Provider, { value: { state, dismiss } }, /* @__PURE__ */ _(UpdateNotificationDispatchContext.Provider, { value: dispatch }, children));
  }
  function useService6(initial) {
    const service = A2(
      /** @type {UpdateNotificationService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new UpdateNotificationService(ntp, initial);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp, initial]);
    return service;
  }
  var UpdateNotificationContext, UpdateNotificationDispatchContext;
  var init_UpdateNotificationProvider = __esm({
    "pages/new-tab/app/update-notification/UpdateNotificationProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_update_notification_service();
      init_service_hooks();
      UpdateNotificationContext = G({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        dismiss: () => {
          throw new Error("must implement dismiss");
        }
      });
      UpdateNotificationDispatchContext = G(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/update-notification/components/UpdateNotification.js
  function UpdateNotification({ notes, dismiss, version }) {
    return /* @__PURE__ */ _("div", { class: UpdateNotification_default.root, "data-reset-layout": "true" }, /* @__PURE__ */ _("div", { class: (0, import_classnames13.default)("layout-centered", UpdateNotification_default.body) }, notes.length > 0 ? /* @__PURE__ */ _(WithNotes, { notes, version }) : /* @__PURE__ */ _(WithoutNotes, { version })), /* @__PURE__ */ _(DismissButton, { onClick: dismiss, className: UpdateNotification_default.dismiss }));
  }
  function WithNotes({ notes, version }) {
    const id = g2();
    const ref = A2(
      /** @type {HTMLDetailsElement|null} */
      null
    );
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const inlineLink = /* @__PURE__ */ _(
      Trans,
      {
        str: t4("updateNotification_whats_new"),
        values: {
          a: {
            href: `#${id}`,
            class: UpdateNotification_default.inlineLink,
            click: (e4) => {
              e4.preventDefault();
              if (!ref.current) return;
              ref.current.open = !ref.current.open;
            }
          }
        }
      }
    );
    return /* @__PURE__ */ _("details", { ref }, /* @__PURE__ */ _("summary", { tabIndex: -1, className: UpdateNotification_default.summary }, t4("updateNotification_updated_version", { version }), " ", inlineLink), /* @__PURE__ */ _("div", { id, class: UpdateNotification_default.detailsContent }, /* @__PURE__ */ _("ul", { class: UpdateNotification_default.list }, notes.map((note, index) => {
      let trimmed = note.trim();
      if (trimmed.startsWith("\u2022")) {
        trimmed = trimmed.slice(1).trim();
      }
      return /* @__PURE__ */ _("li", { key: note + index }, trimmed);
    }))));
  }
  function WithoutNotes({ version }) {
    const { t: t4 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    return /* @__PURE__ */ _("p", null, t4("updateNotification_updated_version", { version }));
  }
  function UpdateNotificationConsumer() {
    const { state, dismiss } = x2(UpdateNotificationContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ _(UpdateNotification, { notes: state.data.content.notes, version: state.data.content.version, dismiss });
    }
    return null;
  }
  var import_classnames13;
  var init_UpdateNotification2 = __esm({
    "pages/new-tab/app/update-notification/components/UpdateNotification.js"() {
      "use strict";
      init_preact_module();
      import_classnames13 = __toESM(require_classnames(), 1);
      init_UpdateNotification();
      init_hooks_module();
      init_UpdateNotificationProvider();
      init_types();
      init_TranslationsProvider();
      init_DismissButton2();
    }
  });

  // pages/new-tab/app/entry-points/updateNotification.js
  var updateNotification_exports = {};
  __export(updateNotification_exports, {
    factory: () => factory6
  });
  function factory6() {
    return /* @__PURE__ */ _(UpdateNotificationProvider, null, /* @__PURE__ */ _(UpdateNotificationConsumer, null));
  }
  var init_updateNotification = __esm({
    "pages/new-tab/app/entry-points/updateNotification.js"() {
      "use strict";
      init_preact_module();
      init_UpdateNotification2();
      init_UpdateNotificationProvider();
    }
  });

  // ../node_modules/preact/devtools/dist/devtools.module.js
  init_preact_module();
  var i2;
  null != (i2 = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : void 0) && i2.__PREACT_DEVTOOLS__ && i2.__PREACT_DEVTOOLS__.attachPreact("10.24.3", l, { Fragment: b, Component: k });

  // pages/new-tab/src/index.js
  init_preact_module();

  // pages/new-tab/app/index.js
  init_preact_module();

  // pages/new-tab/app/components/App.js
  init_preact_module();
  var import_classnames19 = __toESM(require_classnames(), 1);

  // pages/new-tab/app/components/App.module.css
  var App_default = {
    tube: "App_tube",
    layout: "App_layout",
    main: "App_main",
    mainScroller: "App_mainScroller",
    content: "App_content",
    aside: "App_aside",
    asideContent: "App_asideContent",
    asideContentInner: "App_asideContentInner",
    asideScroller: "App_asideScroller"
  };

  // pages/new-tab/app/components/App.js
  init_settings_provider();

  // pages/new-tab/app/widget-list/WidgetList.js
  init_preact_module();
  init_widget_config_provider();
  init_hooks_module();
  init_types();

  // shared/components/ErrorBoundary.js
  init_preact_module();
  var ErrorBoundary = class extends k {
    /**
     * @param {{didCatch: (params: {error: Error; info: any}) => void}} props
     */
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
      this.props.didCatch({ error, info });
    }
    render() {
      if (this.state.hasError) {
        return this.props.fallback;
      }
      return this.props.children;
    }
  };

  // shared/components/Fallback/Fallback.jsx
  init_preact_module();

  // shared/components/Fallback/Fallback.module.css
  var Fallback_default = {
    fallback: "Fallback_fallback"
  };

  // shared/components/Fallback/Fallback.jsx
  function Fallback({ showDetails, children }) {
    return /* @__PURE__ */ _("div", { class: Fallback_default.fallback }, /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("p", null, "Something went wrong!"), children, showDetails && /* @__PURE__ */ _("p", null, "Please check logs for a message called ", /* @__PURE__ */ _("code", null, "reportPageException"))));
  }

  // pages/new-tab/app/widget-list/WidgetList.js
  init_Layout();

  // import("../entry-points/**/*.js") in pages/new-tab/app/widget-list/WidgetList.js
  var globImport_entry_points_js = __glob({
    "../entry-points/favorites.js": () => Promise.resolve().then(() => (init_favorites(), favorites_exports)),
    "../entry-points/freemiumPIRBanner.js": () => Promise.resolve().then(() => (init_freemiumPIRBanner(), freemiumPIRBanner_exports)),
    "../entry-points/nextSteps.js": () => Promise.resolve().then(() => (init_nextSteps(), nextSteps_exports)),
    "../entry-points/privacyStats.js": () => Promise.resolve().then(() => (init_privacyStats(), privacyStats_exports)),
    "../entry-points/rmf.js": () => Promise.resolve().then(() => (init_rmf(), rmf_exports)),
    "../entry-points/updateNotification.js": () => Promise.resolve().then(() => (init_updateNotification(), updateNotification_exports))
  });

  // pages/new-tab/app/widget-list/WidgetList.js
  function placeholderWidget(id) {
    return {
      factory: () => {
        return /* @__PURE__ */ _("p", null, "Entry point for ", id, " was not found. This is a bug.");
      }
    };
  }
  async function widgetEntryPoint(id) {
    try {
      const mod = await globImport_entry_points_js(`../entry-points/${id}.js`);
      if (typeof mod.factory !== "function") {
        console.error(`module found for ${id}, but missing 'factory' export`);
        return placeholderWidget(id);
      }
      return mod;
    } catch (e4) {
      console.error(e4);
      return placeholderWidget(id);
    }
  }
  function WidgetList() {
    const { widgets, widgetConfigItems, entryPoints } = x2(WidgetConfigContext);
    const messaging2 = useMessaging();
    const didCatch = (error, id) => {
      const message = error?.message || error?.error || "unknown";
      const composed = `Widget '${id}' threw an exception: ` + message;
      messaging2.reportPageException({ message: composed });
    };
    return /* @__PURE__ */ _(b, null, widgets.map((widget, index) => {
      const isUserConfigurable = widgetConfigItems.find((item) => item.id === widget.id);
      const matchingEntryPoint = entryPoints[widget.id];
      if (!isUserConfigurable) {
        return /* @__PURE__ */ _(ErrorBoundary, { key: widget.id, didCatch: (error) => didCatch(error, widget.id), fallback: null }, matchingEntryPoint.factory?.());
      }
      return /* @__PURE__ */ _(WidgetVisibilityProvider, { key: widget.id, id: widget.id, index }, /* @__PURE__ */ _(
        ErrorBoundary,
        {
          key: widget.id,
          didCatch: (error) => didCatch(error, widget.id),
          fallback: /* @__PURE__ */ _(Centered, null, /* @__PURE__ */ _(Fallback, { showDetails: true }, "Widget id: ", widget.id))
        },
        matchingEntryPoint.factory?.()
      ));
    }));
  }

  // pages/new-tab/app/components/App.js
  init_dropzone();
  init_Customizer2();

  // pages/new-tab/app/components/Drawer.js
  init_hooks_module();
  init_signals_module();

  // shared/components/EnvironmentProvider.js
  init_preact_module();
  init_hooks_module();
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
      const mediaQueryList2 = window.matchMedia(THEME_QUERY);
      const listener = (e4) => setTheme(e4.matches ? "dark" : "light");
      mediaQueryList2.addEventListener("change", listener);
      return () => mediaQueryList2.removeEventListener("change", listener);
    }, []);
    y2(() => {
      const mediaQueryList2 = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e4) => setter(e4.matches);
      mediaQueryList2.addEventListener("change", listener);
      setter(mediaQueryList2.matches);
      function setter(value) {
        document.documentElement.dataset.reducedMotion = String(value);
        setReducedMotion(value);
      }
      window.addEventListener("toggle-reduced-motion", () => {
        setter(true);
      });
      return () => mediaQueryList2.removeEventListener("change", listener);
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

  // pages/new-tab/app/components/Drawer.js
  var CLOSE_DRAWER_EVENT = "close-drawer";
  var TOGGLE_DRAWER_EVENT = "toggle-drawer";
  var OPEN_DRAWER_EVENT = "open-drawer";
  var REQUEST_VISIBILITY_EVENT = "request-visibility";
  function useDrawer() {
    const { isReducedMotion } = useEnv();
    const wrapperRef = A2(
      /** @type {HTMLDivElement|null} */
      null
    );
    const buttonRef = A2(
      /** @type {HTMLButtonElement|null} */
      null
    );
    const buttonId = g2();
    const drawerId = g2();
    const visibility = useSignal(
      /** @type {DrawerVisibility} */
      "hidden"
    );
    const displayChildren = useSignal(false);
    const animating = useSignal(false);
    const hidden = useComputed(() => displayChildren.value === false);
    _2(() => {
      const controller = new AbortController();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const update = (value) => {
        visibility.value = value;
        if (isReducedMotion) {
          displayChildren.value = visibility.value === "visible";
        }
      };
      const close = () => update("hidden");
      const open = () => update("visible");
      const toggle = () => {
        const next = visibility.value === "hidden" ? "visible" : "hidden";
        update(next);
      };
      window.addEventListener(CLOSE_DRAWER_EVENT, close, { signal: controller.signal });
      window.addEventListener(TOGGLE_DRAWER_EVENT, toggle, { signal: controller.signal });
      window.addEventListener(OPEN_DRAWER_EVENT, open, { signal: controller.signal });
      wrapper.addEventListener(
        REQUEST_VISIBILITY_EVENT,
        (e4) => {
          e4.detail.value = visibility.value;
        },
        { signal: controller.signal }
      );
      wrapper?.addEventListener(
        "transitionend",
        (e4) => {
          if (e4.target !== e4.currentTarget) return;
          r3(() => {
            displayChildren.value = visibility.value === "visible";
            animating.value = false;
            if (displayChildren.value === false) {
              buttonRef.current?.focus?.();
            }
          });
        },
        { signal: controller.signal }
      );
      wrapper?.addEventListener(
        "transitionstart",
        (e4) => {
          if (e4.target !== e4.currentTarget) return;
          animating.value = true;
        },
        { signal: controller.signal }
      );
      return () => {
        controller.abort();
      };
    }, [isReducedMotion]);
    return {
      wrapperRef,
      buttonRef,
      visibility,
      displayChildren,
      buttonId,
      drawerId,
      hidden,
      animating
    };
  }
  function useDrawerControls() {
    return {
      toggle: () => {
        window.dispatchEvent(new CustomEvent(TOGGLE_DRAWER_EVENT));
      },
      close: () => {
        window.dispatchEvent(new CustomEvent(CLOSE_DRAWER_EVENT));
      },
      open: () => {
        window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
      }
    };
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawer.js
  init_preact_module();

  // pages/new-tab/app/customizer/components/CustomizerDrawer.module.css
  var CustomizerDrawer_default = {
    root: "CustomizerDrawer_root"
  };

  // pages/new-tab/app/customizer/components/CustomizerDrawer.js
  init_hooks_module();

  // pages/new-tab/app/customizer/CustomizerProvider.js
  init_preact_module();
  init_hooks_module();
  init_signals_module();

  // pages/new-tab/app/customizer/themes.js
  init_signals_module();

  // pages/new-tab/app/components/BackgroundProvider.js
  init_preact_module();

  // pages/new-tab/app/components/BackgroundReceiver.module.css
  var BackgroundReceiver_default = {
    root: "BackgroundReceiver_root"
  };

  // pages/new-tab/app/customizer/values.js
  var values = {
    colors: {
      color01: { hex: "#000000", colorScheme: "dark" },
      color02: { hex: "#342E42", colorScheme: "dark" },
      color03: { hex: "#4D5F7F", colorScheme: "dark" },
      color04: { hex: "#E28499", colorScheme: "light" },
      color05: { hex: "#F7DEE5", colorScheme: "light" },
      color06: { hex: "#D55154", colorScheme: "dark" },
      color07: { hex: "#E5724F", colorScheme: "dark" },
      color08: { hex: "#F3BB44", colorScheme: "light" },
      color09: { hex: "#E9DCCD", colorScheme: "light" },
      color10: { hex: "#5BC787", colorScheme: "light" },
      color11: { hex: "#4594A7", colorScheme: "dark" },
      color12: { hex: "#B5E2CE", colorScheme: "light" },
      color13: { hex: "#E4DEF2", colorScheme: "light" },
      color14: { hex: "#B79ED4", colorScheme: "light" },
      color15: { hex: "#5552AC", colorScheme: "dark" },
      color16: { hex: "#75B9F0", colorScheme: "light" },
      color17: { hex: "#577DE4", colorScheme: "dark" },
      color18: { hex: "#DBDDDF", colorScheme: "light" },
      color19: { hex: "#9A979D", colorScheme: "dark" }
    },
    gradients: {
      gradient01: { path: "gradients/gradient01.svg", fallback: "#f2e5d4", colorScheme: "light" },
      gradient02: { path: "gradients/gradient02.svg", fallback: "#d5bcd1", colorScheme: "light" },
      gradient03: { path: "gradients/gradient03.svg", fallback: "#f4ca78", colorScheme: "light" },
      gradient04: { path: "gradients/gradient04.svg", fallback: "#e6a356", colorScheme: "light" },
      gradient05: { path: "gradients/gradient05.svg", fallback: "#4448ae", colorScheme: "dark" },
      gradient06: { path: "gradients/gradient06.svg", fallback: "#a55778", colorScheme: "dark" },
      gradient07: { path: "gradients/gradient07.svg", fallback: "#222566", colorScheme: "dark" },
      gradient08: { path: "gradients/gradient08.svg", fallback: "#0e0e3d", colorScheme: "dark" }
    },
    userImages: {
      "01": {
        colorScheme: "dark",
        id: "01",
        src: "backgrounds/bg-01.jpg",
        thumb: "backgrounds/bg-01-thumb.jpg"
      },
      "02": {
        colorScheme: "light",
        id: "02",
        src: "backgrounds/bg-02.jpg",
        thumb: "backgrounds/bg-02-thumb.jpg"
      },
      "03": {
        colorScheme: "light",
        id: "03",
        src: "backgrounds/bg-03.jpg",
        thumb: "backgrounds/bg-03-thumb.jpg"
      }
    }
  };

  // pages/new-tab/app/components/BackgroundProvider.js
  init_hooks_module();

  // pages/new-tab/app/customizer/utils.js
  function detectThemeFromHex(backgroundColor) {
    const hex = backgroundColor.replace("#", "");
    const r4 = parseInt(hex.slice(0, 2), 16);
    const g5 = parseInt(hex.slice(2, 4), 16);
    const b3 = parseInt(hex.slice(4, 6), 16);
    const luminance = 0.2126 * r4 + 0.7152 * g5 + 0.0722 * b3;
    return luminance < 128 ? "dark" : "light";
  }

  // pages/new-tab/app/components/BackgroundProvider.js
  function inferSchemeFrom(background, browserTheme, system) {
    const browser = themeFromBrowser(browserTheme, system);
    switch (background.kind) {
      case "default":
        return { bg: browser, browser };
      case "color": {
        const color = values.colors[background.value];
        return { bg: color.colorScheme, browser };
      }
      case "gradient": {
        const gradient = values.gradients[background.value];
        return { bg: gradient.colorScheme, browser };
      }
      case "userImage":
        return { bg: background.value.colorScheme, browser };
      case "hex":
        return { bg: detectThemeFromHex(background.value), browser };
    }
  }
  function themeFromBrowser(browserTheme, system) {
    if (browserTheme === "system") {
      return system;
    }
    return browserTheme;
  }
  function BackgroundConsumer({ browser }) {
    const { data } = x2(CustomizerContext);
    const background = data.value.background;
    switch (background.kind) {
      case "default": {
        return /* @__PURE__ */ _("div", { className: BackgroundReceiver_default.root, "data-testid": "BackgroundConsumer", "data-background-kind": "default", "data-theme": browser });
      }
      case "hex": {
        return /* @__PURE__ */ _(
          "div",
          {
            class: BackgroundReceiver_default.root,
            "data-animate": "true",
            "data-testid": "BackgroundConsumer",
            style: {
              backgroundColor: background.value
            }
          }
        );
      }
      case "color": {
        const color = values.colors[background.value];
        return /* @__PURE__ */ _(
          "div",
          {
            class: BackgroundReceiver_default.root,
            "data-animate": "true",
            "data-background-color": color.hex,
            "data-testid": "BackgroundConsumer",
            style: {
              backgroundColor: color.hex
            }
          }
        );
      }
      case "gradient": {
        const gradient = values.gradients[background.value];
        return /* @__PURE__ */ _(b, { key: "gradient" }, /* @__PURE__ */ _(
          "div",
          {
            class: BackgroundReceiver_default.root,
            "data-animate": "false",
            "data-testid": "BackgroundConsumer",
            style: {
              backgroundColor: gradient.fallback,
              backgroundImage: `url(${gradient.path})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat"
            }
          }
        ), /* @__PURE__ */ _(
          "div",
          {
            class: BackgroundReceiver_default.root,
            "data-animate": "false",
            style: {
              backgroundImage: `url(gradients/grain.png)`,
              backgroundRepeat: "repeat",
              opacity: 0.5,
              mixBlendMode: "soft-light"
            }
          }
        ));
      }
      case "userImage": {
        const img = background.value;
        return /* @__PURE__ */ _(
          "div",
          {
            class: BackgroundReceiver_default.root,
            "data-animate": "true",
            "data-testid": "BackgroundConsumer",
            style: {
              backgroundImage: `url(${img.src})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center center"
            }
          }
        );
      }
      default: {
        console.warn("Unreachable!");
        return /* @__PURE__ */ _("div", { className: BackgroundReceiver_default.root });
      }
    }
  }

  // pages/new-tab/app/customizer/themes.js
  var THEME_QUERY2 = "(prefers-color-scheme: dark)";
  var mediaQueryList = window.matchMedia(THEME_QUERY2);
  function useThemes(data) {
    const mq = useSignal(mediaQueryList.matches ? "dark" : "light");
    useSignalEffect(() => {
      const listener = (e4) => {
        mq.value = e4.matches ? "dark" : "light";
      };
      mediaQueryList.addEventListener("change", listener);
      return () => mediaQueryList.removeEventListener("change", listener);
    });
    const main = useComputed(() => {
      return inferSchemeFrom(data.value.background, data.value.theme, mq.value).bg;
    });
    const browser = useComputed(() => {
      return themeFromBrowser(data.value.theme, mq.value);
    });
    return { main, browser };
  }

  // pages/new-tab/app/customizer/CustomizerProvider.js
  var CustomizerThemesContext = G({
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    main: d3("light"),
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    browser: d3("light")
  });
  var CustomizerContext = G({
    /** @type {import("@preact/signals").Signal<CustomizerData>} */
    data: d3({
      background: { kind: "default" },
      userImages: [],
      userColor: null,
      theme: "system"
    }),
    /** @type {(bg: BackgroundData) => void} */
    select: (bg) => {
    },
    upload: () => {
    },
    /**
     * @type {(theme: ThemeData) => void}
     */
    setTheme: (theme) => {
    },
    /**
     * @type {(id: string) => void}
     */
    deleteImage: (id) => {
    }
  });
  function CustomizerProvider({ service, initialData, children }) {
    const data = useSignal(initialData);
    const { main, browser } = useThemes(data);
    E(() => {
      const unsub = service.onBackground((evt) => {
        data.value = { ...data.value, background: evt.data.background };
      });
      const unsub1 = service.onTheme((evt) => {
        data.value = { ...data.value, theme: evt.data.theme };
      });
      const unsub2 = service.onImages((evt) => {
        data.value = { ...data.value, userImages: evt.data.userImages };
      });
      const unsub3 = service.onColor((evt) => {
        data.value = { ...data.value, userColor: evt.data.userColor };
      });
      return () => {
        unsub();
        unsub1();
        unsub2();
        unsub3();
      };
    });
    const select = q2(
      (bg) => {
        service.setBackground(bg);
      },
      [service]
    );
    const upload = q2(() => {
      service.upload();
    }, [service]);
    const setTheme = q2(
      (theme) => {
        service.setTheme(theme);
      },
      [service]
    );
    const deleteImage = q2(
      (id) => {
        service.deleteImage(id);
      },
      [service]
    );
    return /* @__PURE__ */ _(CustomizerContext.Provider, { value: { data, select, upload, setTheme, deleteImage } }, /* @__PURE__ */ _(CustomizerThemesContext.Provider, { value: { main, browser } }, children));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  init_preact_module();

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.module.css
  var CustomizerDrawerInner_default = {
    root: "CustomizerDrawerInner_root",
    "fade-in": "CustomizerDrawerInner_fade-in",
    header: "CustomizerDrawerInner_header",
    backBtn: "CustomizerDrawerInner_backBtn",
    section: "CustomizerDrawerInner_section",
    sectionBody: "CustomizerDrawerInner_sectionBody",
    sectionTitle: "CustomizerDrawerInner_sectionTitle",
    bgList: "CustomizerDrawerInner_bgList",
    bgListItem: "CustomizerDrawerInner_bgListItem",
    deleteBtn: "CustomizerDrawerInner_deleteBtn",
    bgPanel: "CustomizerDrawerInner_bgPanel",
    bgPanelEmpty: "CustomizerDrawerInner_bgPanelEmpty",
    bgPanelOutlined: "CustomizerDrawerInner_bgPanelOutlined",
    dynamicIconColor: "CustomizerDrawerInner_dynamicIconColor",
    colorInputIcon: "CustomizerDrawerInner_colorInputIcon",
    themeList: "CustomizerDrawerInner_themeList",
    themeItem: "CustomizerDrawerInner_themeItem",
    themeButton: "CustomizerDrawerInner_themeButton"
  };

  // pages/new-tab/app/customizer/components/BackgroundSection.js
  init_preact_module();
  var import_classnames14 = __toESM(require_classnames(), 1);
  init_Icons2();
  init_signals_module();
  init_hooks_module();
  function BackgroundSection({ data, onNav, onUpload, select }) {
    const { browser } = x2(CustomizerThemesContext);
    let displayColor;
    if (data.value.background.kind === "color") {
      displayColor = values.colors[data.value.background.value];
    } else if (data.value.background.kind === "hex") {
      const hex = data.value.background.value;
      displayColor = { hex: data.value.background.value, colorScheme: detectThemeFromHex(hex) };
    } else {
      displayColor = values.colors.color11;
    }
    let gradient;
    if (data.value.background.kind === "gradient") {
      gradient = values.gradients[data.value.background.value];
    } else {
      gradient = values.gradients.gradient02;
    }
    return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.section }, /* @__PURE__ */ _("h3", { class: CustomizerDrawerInner_default.sectionTitle }, "Background"), /* @__PURE__ */ _("ul", { class: (0, import_classnames14.default)(CustomizerDrawerInner_default.sectionBody, CustomizerDrawerInner_default.bgList), role: "radiogroup" }, /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _(
      DefaultPanel,
      {
        checked: data.value.background.kind === "default",
        onClick: () => select({ background: { kind: "default" } })
      }
    )), /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _(
      ColorPanel,
      {
        checked: data.value.background.kind === "color" || data.value.background.kind === "hex",
        color: displayColor,
        onClick: () => onNav("color")
      }
    )), /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _(
      GradientPanel,
      {
        checked: data.value.background.kind === "gradient",
        gradient,
        onClick: () => onNav("gradient")
      }
    )), /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _(
      BackgroundImagePanel,
      {
        checked: data.value.background.kind === "userImage",
        onClick: () => onNav("image"),
        data,
        upload: onUpload,
        browserTheme: browser
      }
    ))));
  }
  function DefaultPanel({ checked, onClick }) {
    const id = g2();
    const { main } = x2(CustomizerThemesContext);
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(
      "button",
      {
        class: (0, import_classnames14.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": main,
        "aria-checked": checked,
        "aria-labelledby": id,
        role: "radio",
        onClick
      },
      checked && /* @__PURE__ */ _(CircleCheck, null)
    ), /* @__PURE__ */ _("span", { id }, "Default"));
  }
  function ColorPanel(props) {
    const id = g2();
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(
      "button",
      {
        class: (0, import_classnames14.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": props.color.colorScheme,
        onClick: props.onClick,
        "aria-checked": props.checked,
        "aria-labelledby": id,
        role: "radio",
        style: { background: props.color.hex }
      },
      props.checked && /* @__PURE__ */ _(CircleCheck, null)
    ), /* @__PURE__ */ _("span", { id }, "Solid Colors"));
  }
  function GradientPanel(props) {
    const id = g2();
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(
      "button",
      {
        onClick: props.onClick,
        class: (0, import_classnames14.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": props.gradient.colorScheme,
        "aria-checked": props.checked,
        "aria-labelledby": id,
        style: {
          background: `url(${props.gradient.path})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center"
        }
      },
      props.checked && /* @__PURE__ */ _(CircleCheck, null)
    ), /* @__PURE__ */ _("span", { id }, "Gradients"));
  }
  function BackgroundImagePanel(props) {
    const id = g2();
    const empty = useComputed(() => props.data.value.userImages.length === 0);
    const selectedImage = useComputed(() => {
      const imageId = props.data.value.background.kind === "userImage" ? props.data.value.background.value : null;
      if (imageId !== null) {
        const match = props.data.value.userImages.find((i5) => i5.id === imageId.id);
        if (match) {
          return match;
        }
      }
      return null;
    });
    const firstImage = useComputed(() => {
      return props.data.value.userImages[0] ?? null;
    });
    const label = empty.value === true ? /* @__PURE__ */ _("span", { id }, "Add Background") : /* @__PURE__ */ _("span", { id }, "My Backgrounds");
    if (empty.value === true) {
      return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(
        "button",
        {
          class: (0, import_classnames14.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty, CustomizerDrawerInner_default.dynamicIconColor),
          "data-color-mode": props.browserTheme,
          "aria-checked": props.checked,
          "aria-labelledby": id,
          role: "radio",
          onClick: props.upload
        },
        /* @__PURE__ */ _(PlusIcon, null)
      ), label);
    }
    const image = selectedImage.value !== null ? selectedImage.value?.thumb : firstImage.value?.thumb;
    const scheme = selectedImage.value !== null ? selectedImage.value?.colorScheme : firstImage.value?.colorScheme;
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(
      "button",
      {
        class: (0, import_classnames14.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": scheme,
        onClick: props.onClick,
        "aria-checked": props.checked,
        "aria-labelledby": id,
        style: {
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }
      },
      props.checked && /* @__PURE__ */ _(CircleCheck, null)
    ), label);
  }

  // pages/new-tab/app/customizer/components/BrowserThemeSection.js
  var import_classnames15 = __toESM(require_classnames(), 1);
  init_preact_module();
  init_signals_module();
  function BrowserThemeSection(props) {
    const current = useComputed(() => props.data.value.theme);
    return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.section }, /* @__PURE__ */ _("h3", { class: CustomizerDrawerInner_default.sectionTitle }, "Browser Theme"), /* @__PURE__ */ _("ul", { class: (0, import_classnames15.default)(CustomizerDrawerInner_default.sectionBody, CustomizerDrawerInner_default.themeList) }, /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.themeItem }, /* @__PURE__ */ _(
      "button",
      {
        class: CustomizerDrawerInner_default.themeButton,
        role: "radio",
        type: "button",
        "aria-checked": current.value === "light",
        tabindex: 0,
        onClick: () => props.setTheme({ theme: "light" })
      },
      /* @__PURE__ */ _("span", { class: "sr-only" }, "Select light theme")
    ), "Light"), /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.themeItem }, /* @__PURE__ */ _(
      "button",
      {
        class: CustomizerDrawerInner_default.themeButton,
        role: "radio",
        type: "button",
        "aria-checked": current.value === "dark",
        tabindex: 0,
        onClick: () => props.setTheme({ theme: "dark" })
      },
      /* @__PURE__ */ _("span", { className: "sr-only" }, "Select dark theme")
    ), "Dark"), /* @__PURE__ */ _("li", { class: CustomizerDrawerInner_default.themeItem }, /* @__PURE__ */ _(
      "button",
      {
        class: CustomizerDrawerInner_default.themeButton,
        role: "radio",
        type: "button",
        "aria-checked": current.value === "system",
        tabindex: 0,
        onClick: () => props.setTheme({ theme: "system" })
      },
      /* @__PURE__ */ _("span", { className: "sr-only" }, "Select system theme")
    ), "System")));
  }

  // pages/new-tab/app/customizer/components/VisibilityMenuSection.js
  init_hooks_module();
  init_Customizer2();
  init_VisibilityMenu2();
  init_preact_module();
  function VisibilityMenuSection() {
    const [rowData, setRowData] = h2(() => {
      const items = (
        /** @type {import("./Customizer.js").VisibilityRowData[]} */
        getItems()
      );
      return items;
    });
    _2(() => {
      function handler() {
        setRowData(getItems());
      }
      window.addEventListener(Customizer.UPDATE_EVENT, handler);
      return () => {
        window.removeEventListener(Customizer.UPDATE_EVENT, handler);
      };
    }, []);
    return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.section }, /* @__PURE__ */ _("h3", { class: CustomizerDrawerInner_default.sectionTitle }, "Sections"), /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.sectionBody }, /* @__PURE__ */ _(VisibilityMenu, { rows: rowData, variant: "embedded" })));
  }

  // pages/new-tab/app/customizer/components/ColorSelection.js
  init_preact_module();
  var import_classnames16 = __toESM(require_classnames(), 1);
  init_Icons2();
  init_signals_module();
  function ColorSelection({ data, select, back }) {
    console.log("    RENDER:ColorSelection?");
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      while (target && target !== event.currentTarget) {
        if (target.getAttribute("role") === "radio") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (target.getAttribute("aria-checked") === "false") {
            if (target.dataset.key) {
              const value = (
                /** @type {PredefinedColor} */
                target.dataset.key
              );
              select({ background: { kind: "color", value } });
            } else {
              console.warn("missing dataset.key");
            }
          } else {
            console.log("ignoring click on selected color");
          }
          break;
        } else {
          target = target.parentElement;
        }
      }
    }
    return /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("button", { type: "button", onClick: back, class: (0, import_classnames16.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ _(BackChevron, null), "Solid Colors"), /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.sectionBody }, /* @__PURE__ */ _("div", { class: (0, import_classnames16.default)(CustomizerDrawerInner_default.bgList), role: "radiogroup", onClick }, /* @__PURE__ */ _(PickerPanel, { data, select }), /* @__PURE__ */ _(ColorGrid, { data }))));
  }
  var entries = Object.entries(values.colors);
  function ColorGrid({ data }) {
    const selected = useComputed(() => data.value.background.kind === "color" && data.value.background.value);
    return /* @__PURE__ */ _(b, null, entries.map(([key, entry]) => {
      return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.bgListItem, key }, /* @__PURE__ */ _(
        "button",
        {
          class: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabindex: 0,
          style: { background: entry.hex },
          role: "radio",
          "aria-checked": key === selected.value,
          "data-key": key
        },
        /* @__PURE__ */ _("span", { class: "sr-only" }, "Select ", key)
      ));
    }));
  }
  function PickerPanel({ data, select }) {
    const hex = useComputed(() => {
      if (data.value.background.kind === "hex") {
        return data.value.background.value;
      }
      if (data.value.userColor?.kind === "hex") {
        return data.value.userColor.value;
      }
      return "#ffffff";
    });
    const hexSelected = useComputed(() => data.value.background.kind === "hex");
    const modeSelected = useComputed(() => detectThemeFromHex(hex.value));
    return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _(
      "button",
      {
        className: (0, import_classnames16.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty),
        type: "button",
        tabIndex: 0,
        style: { background: hex.value },
        role: "radio",
        "aria-checked": hexSelected
      }
    ), /* @__PURE__ */ _(
      "input",
      {
        type: "color",
        tabIndex: -1,
        style: { opacity: 0, inset: 0, position: "absolute", width: "100%", height: "100%" },
        value: hex,
        onChange: (e4) => {
          if (!(e4.target instanceof HTMLInputElement)) return;
          select({ background: { kind: "hex", value: e4.target.value } });
        },
        onClick: (e4) => {
          if (!(e4.target instanceof HTMLInputElement)) return;
          if (data.value.userColor?.value === hex.value) {
            select({ background: { kind: "hex", value: e4.target.value } });
          }
        }
      }
    ), /* @__PURE__ */ _("span", { class: (0, import_classnames16.default)(CustomizerDrawerInner_default.colorInputIcon, CustomizerDrawerInner_default.dynamicIconColor), "data-color-mode": modeSelected }, /* @__PURE__ */ _(Picker, null)));
  }

  // pages/new-tab/app/customizer/components/GradientSelection.js
  init_preact_module();
  var import_classnames17 = __toESM(require_classnames(), 1);
  init_signals_module();
  init_Icons2();
  function GradientSelection({ data, select, back }) {
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      while (target && target !== event.currentTarget) {
        if (target.getAttribute("role") === "radio") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (target.getAttribute("aria-checked") === "false") {
            if (target.dataset.key) {
              const value = (
                /** @type {PredefinedGradient} */
                target.dataset.key
              );
              select({ background: { kind: "gradient", value } });
            } else {
              console.warn("missing dataset.key");
            }
          } else {
            console.log("ignoring click on selected color");
          }
          break;
        } else {
          target = target.parentElement;
        }
      }
    }
    return /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("button", { type: "button", onClick: back, class: (0, import_classnames17.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ _(BackChevron, null), "Gradients"), /* @__PURE__ */ _("div", { className: CustomizerDrawerInner_default.sectionBody, onClick }, /* @__PURE__ */ _(GradientGrid, { data })));
  }
  var entries2 = Object.entries(values.gradients);
  function GradientGrid({ data }) {
    const selected = useComputed(() => data.value.background.kind === "gradient" && data.value.background.value);
    return /* @__PURE__ */ _("ul", { className: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgList) }, entries2.map(([key, entry]) => {
      return /* @__PURE__ */ _("li", { className: CustomizerDrawerInner_default.bgListItem, key }, /* @__PURE__ */ _(
        "button",
        {
          className: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabIndex: 0,
          role: "radio",
          "aria-checked": key === selected.value,
          "data-key": key,
          style: {
            backgroundImage: `url(${entry.path})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
          }
        },
        /* @__PURE__ */ _("span", { className: "sr-only" }, "Select ", key)
      ));
    }));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  init_signals_module();

  // pages/new-tab/app/customizer/components/ImageSelection.js
  init_preact_module();
  var import_classnames18 = __toESM(require_classnames(), 1);
  init_signals_module();
  init_DismissButton2();
  init_Icons2();
  function ImageSelection({ data, select, back, onUpload, deleteImage }) {
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      while (target && target !== event.currentTarget) {
        if (target.getAttribute("role") === "radio") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (target.getAttribute("aria-checked") === "false") {
            if (target.dataset.key) {
              const value = (
                /** @type {string} */
                target.dataset.key
              );
              const match = data.value.userImages.find((i5) => i5.id === value);
              if (match) {
                select({ background: { kind: "userImage", value: match } });
              }
            } else {
              console.warn("missing dataset.key");
            }
          } else {
            console.log("ignoring click on selected color");
          }
          break;
        } else {
          target = target.parentElement;
        }
      }
    }
    return /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("button", { type: "button", onClick: back, class: (0, import_classnames18.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ _(BackChevron, null), "My Backgrounds"), /* @__PURE__ */ _("div", { className: CustomizerDrawerInner_default.sectionBody, onClick }, /* @__PURE__ */ _(ImageGrid, { data, deleteImage, onUpload })));
  }
  function ImageGrid({ data, deleteImage, onUpload }) {
    const selected = useComputed(() => data.value.background.kind === "userImage" && data.value.background.value.id);
    const entries4 = useComputed(() => {
      return data.value.userImages;
    });
    return /* @__PURE__ */ _("ul", { className: (0, import_classnames18.default)(CustomizerDrawerInner_default.bgList) }, entries4.value.map((entry) => {
      return /* @__PURE__ */ _("li", { className: CustomizerDrawerInner_default.bgListItem, key: entry.id }, /* @__PURE__ */ _(
        "button",
        {
          className: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabIndex: 0,
          role: "radio",
          "aria-checked": entry.id === selected.value,
          "data-key": entry.id,
          style: {
            backgroundImage: `url(${entry.thumb})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
          }
        }
      ), /* @__PURE__ */ _(DismissButton, { className: CustomizerDrawerInner_default.deleteBtn, onClick: () => deleteImage(entry.id) }));
    }), /* @__PURE__ */ _("li", { className: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ _("button", { type: "button", onClick: onUpload }, "Add image")));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  function CustomizerDrawerInner({ data, select, onUpload, setTheme, deleteImage }) {
    const { close } = useDrawerControls();
    const state = useSignal("home");
    function onNav(nav) {
      state.value = nav;
    }
    function back() {
      state.value = "home";
    }
    return /* @__PURE__ */ _("div", { class: CustomizerDrawerInner_default.root }, /* @__PURE__ */ _("header", { class: CustomizerDrawerInner_default.header }, /* @__PURE__ */ _("h2", null, "Customize"), /* @__PURE__ */ _("button", { onClick: close }, "Close")), state.value === "home" && /* @__PURE__ */ _(BackgroundSection, { data, onNav, onUpload, select }), state.value === "home" && /* @__PURE__ */ _(BrowserThemeSection, { data, setTheme }), state.value === "home" && /* @__PURE__ */ _(VisibilityMenuSection, null), state.value === "color" && /* @__PURE__ */ _(ColorSelection, { data, select, back }), state.value === "gradient" && /* @__PURE__ */ _(GradientSelection, { data, select, back }), state.value === "image" && /* @__PURE__ */ _(ImageSelection, { data, select, back, onUpload, deleteImage }));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawer.js
  function CustomizerDrawer({ displayChildren }) {
    const { open, close } = useDrawerControls();
    y2(() => {
      const checker = () => {
        const shouldOpen = window.location.hash.startsWith("#/customizer");
        if (shouldOpen) {
          open();
        } else {
          close();
        }
      };
      checker();
      window.addEventListener("hashchange", checker);
      return () => {
        window.removeEventListener("hashchange", checker);
      };
    }, []);
    return /* @__PURE__ */ _("div", { class: CustomizerDrawer_default.root }, displayChildren.value === true && /* @__PURE__ */ _(CustomizerConsumer, null));
  }
  function CustomizerConsumer() {
    const { data, select, upload, setTheme, deleteImage } = x2(CustomizerContext);
    return /* @__PURE__ */ _(CustomizerDrawerInner, { data, select, onUpload: upload, setTheme, deleteImage });
  }

  // pages/new-tab/app/components/App.js
  init_signals_module();
  init_hooks_module();
  function App() {
    const platformName = usePlatformName();
    const customizerDrawer = useCustomizerDrawerSettings();
    const customizerKind = customizerDrawer.state === "enabled" ? "drawer" : "menu";
    useGlobalDropzone();
    useContextMenu();
    const {
      buttonRef,
      wrapperRef,
      visibility,
      displayChildren,
      animating,
      hidden,
      buttonId,
      drawerId
    } = useDrawer();
    const tabIndex = useComputed(() => hidden.value ? -1 : 0);
    const { toggle } = useDrawerControls();
    const { main, browser } = x2(CustomizerThemesContext);
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _(BackgroundConsumer, { browser }), /* @__PURE__ */ _("div", { class: App_default.layout, ref: wrapperRef, "data-animating": animating, "data-drawer-visibility": visibility }, /* @__PURE__ */ _("main", { class: (0, import_classnames19.default)(App_default.main, App_default.mainScroller), "data-main-scroller": true, "data-theme": main }, /* @__PURE__ */ _("div", { class: App_default.content }, /* @__PURE__ */ _("div", { className: App_default.tube, "data-content-tube": true, "data-platform": platformName }, /* @__PURE__ */ _(WidgetList, null))), /* @__PURE__ */ _(CustomizerMenuPositionedFixed, null, customizerKind === "menu" && /* @__PURE__ */ _(Customizer, null), customizerKind === "drawer" && /* @__PURE__ */ _(
      CustomizerButton,
      {
        buttonId,
        menuId: drawerId,
        toggleMenu: toggle,
        buttonRef,
        isOpen: false
      }
    ))), customizerKind === "drawer" && /* @__PURE__ */ _(
      "aside",
      {
        class: (0, import_classnames19.default)(App_default.aside, App_default.asideScroller),
        tabindex: tabIndex,
        "aria-hidden": hidden,
        "data-theme": browser,
        "data-browser-panel": true
      },
      /* @__PURE__ */ _("div", { class: App_default.asideContent }, /* @__PURE__ */ _("div", { class: App_default.asideContentInner }, /* @__PURE__ */ _(CustomizerDrawer, { displayChildren })))
    )));
  }

  // pages/new-tab/app/index.js
  init_settings_provider();
  init_types();
  init_TranslationsProvider();

  // pages/new-tab/app/widget-list/widget-config.service.js
  init_service();
  var WidgetConfigService = class {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed
     * @param {WidgetConfigs} initialConfig
     * @internal
     */
    constructor(ntp, initialConfig) {
      this.service = new Service(
        {
          subscribe: (cb) => ntp.messaging.subscribe("widgets_onConfigUpdated", cb),
          persist: (data) => ntp.messaging.notify("widgets_setConfig", data)
        },
        initialConfig
      );
    }
    /**
     * @param {(evt: {data: WidgetConfigs, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
      return this.service.onData(cb);
    }
    /**
     * Set the visibility of a widget.
     *
     * Note: This will persist
     *
     * @param {string} id - the widget ID to toggle.
     * @internal
     */
    toggleVisibility(id) {
      this.service.update((old) => {
        return old.map((widgetConfigItem) => {
          if (widgetConfigItem.id === id) {
            const alt = widgetConfigItem.visibility === "visible" ? (
              /** @type {const} */
              "hidden"
            ) : (
              /** @type {const} */
              "visible"
            );
            return { ...widgetConfigItem, visibility: alt };
          }
          return widgetConfigItem;
        });
      });
    }
  };

  // pages/new-tab/public/locales/en/new-tab.json
  var new_tab_default = {
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
    ntp_show_less: {
      title: "Show Less",
      note: "Button that reduces the number of items or content displayed."
    },
    ntp_show_more: {
      title: "Show More",
      note: "Button that increases the number of items or content displayed."
    },
    ntp_dismiss: {
      title: "Dismiss",
      note: "Button that closes or hides the current popup or notification."
    },
    ntp_customizer_button: {
      title: "Customize",
      note: "Button opens a menu. The menu allows the user to customize the page, such as showing/hiding sections."
    },
    widgets_visibility_menu_title: {
      title: "Customize New Tab Page",
      note: "Heading text describing that there's a list of toggles for customizing the page layout."
    },
    updateNotification_updated_version: {
      title: "Browser Updated to version {version}.",
      note: "Text to indicate which new version was updated. `{version}` will be formatted like `1.22.0`"
    },
    updateNotification_whats_new: {
      title: "See <a>what's new</a> in this release.",
      note: "The `<a>` tag represents a clickable link, please preserve it."
    },
    updateNotification_dismiss_btn: {
      title: "Dismiss",
      note: "Button label text for an action that removes the widget from the screen."
    },
    stats_menuTitle: {
      title: "Blocked Tracking Attempts",
      note: "Used as a label in a customization menu"
    },
    stats_noActivity: {
      title: "Blocked tracking attempts will appear here. Keep browsing to see how many we block.",
      note: "Placeholder for when we cannot report any blocked trackers yet"
    },
    stats_noRecent: {
      title: "No recent tracking activity",
      note: "Placeholder to indicate that no tracking activity was blocked in the last 7 days"
    },
    stats_countBlockedSingular: {
      title: "1 tracking attempt blocked",
      note: "The main headline indicating that a single tracker was blocked"
    },
    stats_countBlockedPlural: {
      title: "{count} tracking attempts blocked",
      note: "The main headline indicating that more than 1 attempt has been blocked. Eg: '2 tracking attempts blocked'"
    },
    stats_feedCountBlockedSingular: {
      title: "1 attempt blocked by DuckDuckGo in the last 7 days",
      note: "A summary description of how many tracking attempts where blocked, when only one exists."
    },
    stats_feedCountBlockedPeriod: {
      title: "Past 7 days",
      note: "A summary description indicating the time period of the blocked tracking attempts, which is the past 7 days."
    },
    stats_feedCountBlockedPlural: {
      title: "{count} tracking attempts blocked",
      note: "A summary description of how many tracking attempts were blocked by DuckDuckGo in the last 7 days when there is more than one. E.g., '1,028 tracking attempts blocked."
    },
    stats_toggleLabel: {
      title: "Show recent activity",
      note: "The aria-label text for a toggle button that shows the detailed activity feed"
    },
    stats_hideLabel: {
      title: "Hide recent activity",
      note: "The aria-label text for a toggle button that hides the detailed activity feed"
    },
    stats_otherCompanyName: {
      title: "Other",
      note: "A placeholder to represent an aggregated count of entries, not present in the rest of the list. For example, 'Other: 200', which would mean 200 entries excluding the ones already shown"
    },
    stats_otherCount: {
      title: "{count} attempts from other networks",
      note: "An aggregated count of blocked entries not present in the main list. For example, '200 attempts from other networks'"
    },
    nextSteps_sectionTitle: {
      title: "Next Steps",
      note: "Text that goes in the Next Steps bubble above the first card"
    },
    nextSteps_bringStuff_title: {
      title: "Bring Your Stuff",
      note: "Title of the Next Steps card for importing bookmarks and favorites"
    },
    nextSteps_bringStuff_summary: {
      title: "Import bookmarks, favorites, and passwords for a smooth transition from your old browser.",
      note: "Summary of the Next Steps card for importing bookmarks and favorites"
    },
    nextSteps_bringStuff_actionText: {
      title: "Import Now",
      note: "Button text of the Next Steps card for importing bookmarks and favorites"
    },
    nextSteps_defaultApp_title: {
      title: "Set as Default Browser",
      note: "Title of the Next Steps card for making DDG the user's default browser"
    },
    nextSteps_defaultApp_summary: {
      title: "We automatically block trackers as you browse. It\u2019s privacy, simplified.",
      note: "Summary of the Next Steps card for making DDG the user's default browser"
    },
    nextSteps_defaultApp_actionText: {
      title: "Make Default Browser",
      note: "Button text of the Next Steps card for making DDG the user's default browser"
    },
    nextSteps_blockCookies_title: {
      title: "Block Cookie Pop-ups",
      note: "Title of the Next Steps card for blocking cookie pop-ups"
    },
    nextSteps_blockCookies_summary: {
      title: "We need your permission to say no to cookies on your behalf. Easy choice.",
      note: "Summary of the Next Steps card for blocking cookie pop-ups"
    },
    nextSteps_blockCookies_actionText: {
      title: "Block Cookie Pop-ups",
      note: "Button text of the Next Steps card for blocking cookie pop-ups"
    },
    nextSteps_emailProtection_title: {
      title: "Protect Your Inbox",
      note: "Title of the Next Steps card for email protection"
    },
    nextSteps_emailProtection_summary: {
      title: "Generate @duck.com addresses that remove trackers from email and forwards to your inbox.",
      note: "Summary of the Next Steps card for email protection"
    },
    nextSteps_emailProtection_actionText: {
      title: "Get Email Protection",
      note: "Button text of the Next Steps card for email protection"
    },
    nextSteps_duckPlayer_title: {
      title: "YouTube Without Creepy Ads",
      note: "Title of the Next Steps card for adopting DuckPlayer"
    },
    nextSteps_duckPlayer_summary: {
      title: "Enjoy a clean viewing experience without personalized ads.",
      note: "Summary of the Next Steps card for adopting DuckPlayer"
    },
    nextSteps_duckPlayer_actionText: {
      title: "Try DuckPlayer",
      note: "Button text of the Next Steps card for adopting DuckPlayer"
    },
    nextSteps_addAppDockMac_title: {
      title: "Add App to the Dock",
      note: "Title of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_addAppDockMac_summary: {
      title: "Access DuckDuckGo faster by adding it to the Dock.",
      note: "Summary of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_addAppDockMac_actionText: {
      title: "Add to Dock",
      note: "Initial button text of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_addAppDockMac_confirmationText: {
      title: "Added to Dock!",
      note: "Button text after clicking on the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_pinAppToTaskbarWindows_title: {
      title: "Pin App to the Taskbar",
      note: "Title of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_pinAppToTaskbarWindows_summary: {
      title: "Access DuckDuckGo faster by pinning it to the Taskbar.",
      note: "Summary of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_pinAppToTaskbarWindows_actionText: {
      title: "Pin to Taskbar",
      note: "Initial button text of the Next Steps card for adding DDG app to OS dock"
    },
    nextSteps_pinAppToTaskbarWindows_confirmationText: {
      title: "Pinned to Taskbar!",
      note: "Button text after clicking on the Next Steps card for adding DDG app to OS dock"
    },
    favorites_show_less: {
      title: "Show less",
      note: "Button label to display fewer items"
    },
    favorites_show_more: {
      title: "Show more ({count} remaining)",
      note: "Button text to show hidden items. {count} will be replaced with the number of remaining favorite items to show, including the parentheses. Example: 'Show more (18 remaining)'"
    },
    favorites_menu_title: {
      title: "Favorites",
      note: "Used as a label in a customization menu"
    },
    favorites_add: {
      title: "Add Favorite",
      note: "A button that allows a user to add a new 'favorite' bookmark to their existing list"
    }
  };

  // pages/new-tab/app/index.js
  init_widget_config_provider();

  // pages/new-tab/app/settings.js
  var Settings = class _Settings {
    /**
     * @param {object} params
     * @param {{name: ImportMeta['platform']}} [params.platform]
     * @param {{state: 'enabled' | 'disabled'}} [params.customizerDrawer]
     */
    constructor({ platform = { name: "macos" }, customizerDrawer = { state: "disabled" } }) {
      this.platform = platform;
      this.customizerDrawer = customizerDrawer;
    }
    withPlatformName(name) {
      const valid = ["windows", "macos"];
      if (valid.includes(
        /** @type {any} */
        name
      )) {
        return new _Settings({
          ...this,
          platform: { name }
        });
      }
      return this;
    }
    /**
     * @param {keyof import("../types/new-tab.js").NewTabPageSettings} named
     * @param {{state: 'enabled' | 'disabled'} | null | undefined} settings
     * @return {Settings}
     */
    withFeatureState(named, settings) {
      if (!settings) return this;
      const valid = ["customizerDrawer"];
      if (!valid.includes(named)) {
        console.warn(`Excluding invalid feature key ${named}`);
        return this;
      }
      if (settings.state === "enabled" || settings.state === "disabled") {
        return new _Settings({
          ...this,
          [named]: settings
        });
      }
      return this;
    }
  };

  // pages/new-tab/app/components/Components.jsx
  init_preact_module();

  // pages/new-tab/app/customizer/components/Customizer.examples.js
  init_preact_module();
  init_utils();
  init_Customizer2();
  init_VisibilityMenu2();
  init_signals_module();
  var customizerExamples = {
    "customizer.backgroundSection": {
      factory: () => {
        return /* @__PURE__ */ _(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ _(BackgroundSection, { data, onNav: noop("onNav"), onUpload: noop("onUpload"), select });
        });
      }
    },
    "customizer.colorSelection": {
      factory: () => {
        return /* @__PURE__ */ _(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ _(ColorSelection, { data, select, back: noop("back") });
        });
      }
    },
    "customizer.gradientSelection": {
      factory: () => {
        return /* @__PURE__ */ _(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ _(GradientSelection, { data, select, back: noop("back") });
        });
      }
    },
    "customizer.imageSelection": {
      factory: () => {
        return /* @__PURE__ */ _(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ _(
            ImageSelection,
            {
              data,
              select,
              back: noop("back"),
              onUpload: noop("onUpload"),
              deleteImage: noop("deleteImage")
            }
          );
        });
      }
    },
    "customizer-menu": {
      factory: () => /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(CustomizerButton, { isOpen: true })), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _(MaxContent, null, /* @__PURE__ */ _(
        VisibilityMenu,
        {
          rows: [
            {
              id: "favorites",
              title: "Favorites",
              icon: "star",
              toggle: noop("toggle favorites"),
              visibility: "hidden",
              index: 0
            },
            {
              id: "privacyStats",
              title: "Privacy Stats",
              icon: "shield",
              toggle: noop("toggle favorites"),
              visibility: "visible",
              index: 1
            }
          ]
        }
      )))
    }
  };
  function MaxContent({ children }) {
    return /* @__PURE__ */ _("div", { style: { display: "grid", gridTemplateColumns: "max-content" } }, children);
  }
  function Provider({ children }) {
    const data = {
      background: { kind: "hex", value: "#17afa8" },
      theme: "system",
      userImages: [],
      userColor: null
    };
    const dataSignal = useSignal(data);
    function select(bg) {
      dataSignal.value = { ...dataSignal.value, background: bg };
    }
    function showPicker() {
      console.log("no-op");
    }
    return children({ data: dataSignal, select, showPicker });
  }

  // pages/new-tab/app/favorites/components/Favorites.examples.js
  init_preact_module();

  // pages/new-tab/app/favorites/mocks/favorites.data.js
  var favorites = {
    many: {
      // prettier-ignore
      /** @type {Favorite[]} */
      favorites: [
        { id: "id-many-1", url: "https://example.com?id=id-many-1", title: "Amazon", favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 16 } },
        { id: "id-many-2", url: "https://example.com?id=id-many-2", title: "Adform", favicon: null },
        { id: "id-many-3", url: "https://a.example.com?id=id-many-3", title: "Adobe", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-4", url: "https://b.example.com?id=id-many-3", title: "Adobe", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-31", url: "https://b.example.com?id=id-many-4", title: "A Beautiful Mess", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-5", url: "https://222?id=id-many-3", title: "Gmail", favicon: null },
        { id: "id-many-6", url: "https://example.com?id=id-many-5", title: "TikTok", favicon: { src: "./company-icons/bytedance.svg", maxAvailableSize: 16 } },
        { id: "id-many-7", url: "https://example.com?id=id-many-6", title: "DoorDash", favicon: { src: "./company-icons/d.svg", maxAvailableSize: 16 } },
        { id: "id-many-8", url: "https://example.com?id=id-many-7", title: "Facebook", favicon: { src: "./company-icons/facebook.svg", maxAvailableSize: 16 } },
        { id: "id-many-9", url: "https://example.com?id=id-many-8", title: "Beeswax", favicon: { src: "./company-icons/beeswax.svg", maxAvailableSize: 16 } },
        { id: "id-many-10", url: "https://example.com?id=id-many-9", title: "Adobe", favicon: { src: "./company-icons/adobe.svg", maxAvailableSize: 16 } },
        { id: "id-many-11", url: "https://example.com?id=id-many-10", title: "Beeswax", favicon: { src: "./company-icons/beeswax.svg", maxAvailableSize: 16 } },
        { id: "id-many-12", url: "https://example.com?id=id-many-11", title: "Facebook", favicon: { src: "./company-icons/facebook.svg", maxAvailableSize: 16 } },
        { id: "id-many-13", url: "https://example.com?id=id-many-12", title: "Gmail", favicon: { src: "./company-icons/google.svg", maxAvailableSize: 16 } },
        { id: "id-many-14", url: "https://example.com?id=id-many-13", title: "TikTok", favicon: { src: "./company-icons/bytedance.svg", maxAvailableSize: 16 } },
        { id: "id-many-15", url: "https://example.com?id=id-many-14", title: "yeti", favicon: { src: "./company-icons/d.svg", maxAvailableSize: 16 } }
      ]
    },
    two: {
      // prettier-ignore
      /** @type {Favorite[]} */
      favorites: [
        { id: "id-two-1", url: "https://example.com?id=id-two-1", title: "Amazon", favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 32 } },
        { id: "id-two-2", url: "https://example.com?id=id-two-2", title: "Adform", favicon: { src: "./company-icons/adform.svg", maxAvailableSize: 32 } }
      ]
    },
    single: {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-single-1",
          url: "https://example.com?id=id-single-1",
          title: "Amazon",
          favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 32 }
        }
      ]
    },
    none: {
      /** @type {Favorite[]} */
      favorites: []
    },
    "small-icon": {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-small-icon-1",
          url: "https://duckduckgo.com",
          title: "DuckDuckGo",
          favicon: { src: "./icons/favicon@2x.png", maxAvailableSize: 16 }
        }
      ]
    },
    fallbacks: {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-fallbacks-1",
          url: "https://example.com?id=id-many-1",
          title: "Amazon",
          favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 64 }
        },
        { id: "id-fallbacks-2", url: "https://example.com?id=id-many-2", title: "Adform", favicon: null },
        {
          id: "id-fallbacks-3",
          url: "https://a.example.com?id=id-many-3",
          title: "Adobe",
          favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 }
        }
      ]
    }
  };

  // pages/new-tab/app/favorites/mocks/MockFavoritesProvider.js
  init_preact_module();
  init_FavoritesProvider();
  init_hooks_module();
  init_service_hooks();
  var DEFAULT_CONFIG = {
    expansion: "expanded"
  };
  function MockFavoritesProvider({ data = favorites.many, config = DEFAULT_CONFIG, children }) {
    const { isReducedMotion } = useEnv();
    const initial = (
      /** @type {State} */
      {
        status: "ready",
        data,
        config
      }
    );
    const [et] = h2(() => new EventTarget());
    const [state, dispatch] = p2(reducer, initial);
    const toggle = q2(() => {
      if (state.status !== "ready") return;
      const next = state.config.expansion === "expanded" ? (
        /** @type {const} */
        { ...state.config, expansion: "collapsed" }
      ) : (
        /** @type {const} */
        { ...state.config, expansion: "expanded" }
      );
      dispatch({ kind: "config", config: next });
      et.dispatchEvent(new CustomEvent("state-update", { detail: next }));
    }, [state.status, state.config?.expansion, isReducedMotion]);
    const favoritesDidReOrder = q2(({ list: list2 }) => {
      dispatch({ kind: "data", data: { favorites: list2 } });
    }, []);
    const openContextMenu = (...args) => {
      console.log("noop openContextMenu", ...args);
    };
    const openFavorite = (...args) => {
      console.log("noop openFavorite", ...args);
    };
    const add = (...args) => {
      console.log("noop add", ...args);
    };
    const onConfigChanged = q2(
      (cb) => {
        et.addEventListener("state-update", (e4) => {
          cb(e4.detail);
        });
      },
      [et]
    );
    return /* @__PURE__ */ _(FavoritesContext.Provider, { value: { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add, onConfigChanged } }, /* @__PURE__ */ _(FavoritesDispatchContext.Provider, { value: dispatch }, children));
  }

  // pages/new-tab/app/favorites/components/Favorites.examples.js
  init_FavoritesCustomized();
  var favoritesExamples = {
    "favorites.dnd": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.many }, /* @__PURE__ */ _(FavoritesConsumer, null))
    },
    "favorites.few.7": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 7) } }, /* @__PURE__ */ _(FavoritesConsumer, null))
    },
    "favorites.few.7.no-animation": {
      factory: () => /* @__PURE__ */ _(
        MockFavoritesProvider,
        {
          data: { favorites: favorites.many.favorites.slice(0, 7) },
          config: { expansion: "expanded", animation: { kind: "none" } }
        },
        /* @__PURE__ */ _(FavoritesConsumer, null)
      )
    },
    "favorites.few.6": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 6) } }, /* @__PURE__ */ _(FavoritesConsumer, null))
    },
    "favorites.few.12": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 12) } }, /* @__PURE__ */ _(FavoritesConsumer, null))
    },
    "favorites.multi": {
      factory: () => /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.many }, /* @__PURE__ */ _(FavoritesConsumer, null)), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.two }, /* @__PURE__ */ _(FavoritesConsumer, null)), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.single }, /* @__PURE__ */ _(FavoritesConsumer, null)), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.none }, /* @__PURE__ */ _(FavoritesConsumer, null)))
    },
    "favorites.single": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.single }, /* @__PURE__ */ _(FavoritesConsumer, null))
    },
    "favorites.none": {
      factory: () => /* @__PURE__ */ _(MockFavoritesProvider, { data: favorites.none }, /* @__PURE__ */ _(FavoritesConsumer, null))
    }
  };

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.examples.js
  init_preact_module();
  init_utils();
  init_FreemiumPIRBanner2();

  // pages/new-tab/app/freemium-pir-banner/mocks/freemiumPIRBanner.data.js
  var freemiumPIRDataExamples = {
    onboarding: {
      content: {
        messageType: "big_single_action",
        id: "onboarding",
        titleText: "Personal Information Removal",
        descriptionText: "Find out which sites are selling **your info**.",
        actionText: "Free Scan"
      }
    },
    scan_results: {
      content: {
        messageType: "big_single_action",
        id: "scan_results",
        titleText: null,
        descriptionText: "Your free personal information scan found 19 records about you on 3 different sites",
        actionText: "View Results"
      }
    }
  };

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.examples.js
  var freemiumPIRBannerExamples = {
    "freemiumPIR.onboarding": {
      factory: () => /* @__PURE__ */ _(
        FreemiumPIRBanner,
        {
          message: freemiumPIRDataExamples.onboarding.content,
          dismiss: noop("freemiumPIRBanner_dismiss"),
          action: noop("freemiumPIRBanner_action")
        }
      )
    },
    "freemiumPIR.scan_results": {
      factory: () => /* @__PURE__ */ _(
        FreemiumPIRBanner,
        {
          message: freemiumPIRDataExamples.scan_results.content,
          dismiss: noop("freemiumPIRBanner_dismiss"),
          action: noop("freemiumPIRBanner_action")
        }
      )
    }
  };

  // pages/new-tab/app/next-steps/components/NextSteps.examples.js
  init_preact_module();
  init_utils();
  init_NextStepsCard();
  init_NextStepsGroup();
  var nextStepsExamples = {
    "next-steps.cardGroup.all": {
      factory: () => /* @__PURE__ */ _(
        NextStepsCardGroup,
        {
          types: [
            "bringStuff",
            "defaultApp",
            "blockCookies",
            "emailProtection",
            "duckplayer",
            "addAppToDockMac",
            "pinAppToTaskbarWindows"
          ],
          expansion: "collapsed",
          toggle: noop("toggle"),
          dismiss: noop("dismiss"),
          action: noop("action")
        }
      )
    },
    "next-steps.cardGroup.all-expanded": {
      factory: () => /* @__PURE__ */ _(
        NextStepsCardGroup,
        {
          types: [
            "bringStuff",
            "defaultApp",
            "blockCookies",
            "emailProtection",
            "duckplayer",
            "addAppToDockMac",
            "pinAppToTaskbarWindows"
          ],
          expansion: "expanded",
          toggle: noop("toggle"),
          dismiss: noop("dismiss"),
          action: noop("action")
        }
      )
    },
    "next-steps.cardGroup.two": {
      factory: () => /* @__PURE__ */ _(
        NextStepsCardGroup,
        {
          types: ["bringStuff", "defaultApp"],
          expansion: "collapsed",
          toggle: noop("toggle"),
          dismiss: noop("dismiss"),
          action: noop("action")
        }
      )
    },
    "next-steps.cardGroup.one": {
      factory: () => /* @__PURE__ */ _(
        NextStepsCardGroup,
        {
          types: ["bringStuff"],
          expansion: "collapsed",
          toggle: noop("toggle"),
          dismiss: noop("dismiss"),
          action: noop("action")
        }
      )
    }
  };
  var otherNextStepsExamples = {
    "next-steps.bringStuff": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "bringStuff", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.duckplayer": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "duckplayer", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.defaultApp": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "defaultApp", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.emailProtection": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "emailProtection", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.blockCookies": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "blockCookies", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.addAppToDockMac": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "addAppToDockMac", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.pinToTaskbarWindows": {
      factory: () => /* @__PURE__ */ _(NextStepsCard, { type: "pinAppToTaskbarWindows", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.bubble": {
      factory: () => /* @__PURE__ */ _(NextStepsBubbleHeader, null)
    }
  };

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.examples.js
  init_preact_module();
  init_utils();

  // pages/new-tab/app/privacy-stats/mocks/PrivacyStatsMockProvider.js
  init_hooks_module();
  init_preact_module();
  init_PrivacyStatsProvider();

  // pages/new-tab/app/privacy-stats/mocks/stats.js
  init_constants2();
  var stats = {
    few: {
      totalCount: 481113,
      trackerCompanies: [
        {
          displayName: "Facebook",
          count: 310
        },
        {
          displayName: "Google",
          count: 279
        },
        {
          displayName: DDG_STATS_OTHER_COMPANY_IDENTIFIER,
          count: 210
        },
        {
          displayName: "Amazon.com",
          count: 67
        },
        {
          displayName: "Google Ads",
          count: 2
        }
      ]
    },
    single: {
      totalCount: 481113,
      trackerCompanies: [
        {
          displayName: "Google",
          count: 1
        }
      ]
    },
    norecent: {
      totalCount: 481113,
      trackerCompanies: []
    },
    none: {
      totalCount: 0,
      trackerCompanies: []
    },
    willUpdate: {
      totalCount: 481113,
      trackerCompanies: [
        {
          displayName: "Facebook",
          count: 1
        },
        {
          displayName: "Google",
          count: 1
        },
        {
          displayName: DDG_STATS_OTHER_COMPANY_IDENTIFIER,
          count: 1
        },
        {
          displayName: "Amazon.com",
          count: 1
        },
        {
          displayName: "Google Ads",
          count: 1
        }
      ]
    },
    growing: {
      totalCount: 0,
      trackerCompanies: []
    },
    many: {
      totalCount: 890,
      trackerCompanies: [
        { displayName: "Google", count: 153 },
        { displayName: "Microsoft", count: 69 },
        { displayName: "Cloudflare", count: 65 },
        { displayName: "Facebook", count: 61 },
        { displayName: "ByteDance", count: 58 },
        { displayName: "Adobe", count: 38 },
        { displayName: "Magnite", count: 12 },
        { displayName: "PubMatic", count: 10 },
        { displayName: "Index Exchange", count: 10 },
        { displayName: "OpenX", count: 10 },
        { displayName: "Taboola", count: 9 },
        { displayName: "comScore", count: 9 },
        { displayName: "Akamai", count: 8 },
        { displayName: "LiveIntent", count: 7 },
        { displayName: "Criteo", count: 6 },
        { displayName: "Verizon Media", count: 6 },
        { displayName: "TripleLift", count: 5 },
        { displayName: "YieldMo", count: 4 },
        { displayName: "Neustar", count: 4 },
        { displayName: "Oracle", count: 4 },
        { displayName: "WPP", count: 3 },
        { displayName: "Adform", count: 3 },
        { displayName: "The Nielsen Company", count: 3 },
        { displayName: "IPONWEB", count: 3 },
        { displayName: "Kargo", count: 2 },
        { displayName: "__other__", count: 143 },
        { displayName: "Sharethrough", count: 2 },
        { displayName: "GumGum", count: 2 },
        { displayName: "Media.net Advertising", count: 2 },
        { displayName: "Amobee", count: 2 },
        { displayName: "Improve Digital", count: 1 },
        { displayName: "Smartadserver", count: 1 },
        { displayName: "LoopMe", count: 1 },
        { displayName: "Hotjar", count: 1 },
        { displayName: "Amazon.com", count: 1 },
        { displayName: "RTB House", count: 1 },
        { displayName: "Sovrn Holdings", count: 1 },
        { displayName: "Outbrain", count: 1 },
        { displayName: "Conversant", count: 1 },
        { displayName: "The Trade Desk", count: 1 },
        { displayName: "RhythmOne", count: 1 },
        { displayName: "Sonobi", count: 1 },
        { displayName: "New Relic", count: 1 }
      ]
    }
  };

  // pages/new-tab/app/privacy-stats/mocks/PrivacyStatsMockProvider.js
  init_service_hooks();
  function PrivacyStatsMockProvider({
    data = stats.few,
    config = { expansion: "expanded", animation: { kind: "auto-animate" } },
    ticker = false,
    children
  }) {
    const initial = (
      /** @type {import('../PrivacyStatsProvider.js').State} */
      {
        status: "ready",
        data,
        config
      }
    );
    const [state, send] = p2(reducer, initial);
    y2(() => {
      if (!ticker) return;
      if (state.status === "ready") {
        const next = {
          totalCount: state.data.totalCount + 1,
          trackerCompanies: state.data.trackerCompanies.map((company, index) => {
            if (index === 0) return { ...company, count: company.count + 1 };
            return company;
          })
        };
        const time = setTimeout(() => {
          send({ kind: "data", data: next });
        }, 1e3);
        return () => clearTimeout(time);
      }
      return () => {
      };
    }, [state.data?.totalCount, ticker]);
    const toggle = q2(() => {
      if (state.status !== "ready") return console.warn("was not ready");
      if (state.config?.expansion === "expanded") {
        send({ kind: "config", config: { ...state.config, expansion: "collapsed" } });
      } else {
        send({ kind: "config", config: { ...state.config, expansion: "expanded" } });
      }
    }, [state.config?.expansion]);
    return /* @__PURE__ */ _(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ _(PrivacyStatsDispatchContext.Provider, { value: send }, children));
  }

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.examples.js
  init_PrivacyStats2();
  var privacyStatsExamples = {
    "stats.few": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsMockProvider, { ticker: true }, /* @__PURE__ */ _(PrivacyStatsConsumer, null))
    },
    "stats.few.collapsed": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsMockProvider, { config: { expansion: "collapsed" } }, /* @__PURE__ */ _(PrivacyStatsConsumer, null))
    },
    "stats.single": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsMockProvider, { data: stats.single }, /* @__PURE__ */ _(PrivacyStatsConsumer, null))
    },
    "stats.none": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsMockProvider, { data: stats.none }, /* @__PURE__ */ _(PrivacyStatsConsumer, null))
    },
    "stats.norecent": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsMockProvider, { data: stats.norecent }, /* @__PURE__ */ _(PrivacyStatsConsumer, null))
    },
    "stats.list": {
      factory: () => /* @__PURE__ */ _(PrivacyStatsBody, { trackerCompanies: stats.few.trackerCompanies, listAttrs: { id: "example-stats.list" } })
    },
    "stats.heading": {
      factory: () => /* @__PURE__ */ _(Heading, { trackerCompanies: stats.few.trackerCompanies, expansion: "expanded", onToggle: noop("stats.heading onToggle") })
    },
    "stats.heading.none": {
      factory: () => /* @__PURE__ */ _(Heading, { trackerCompanies: stats.none.trackerCompanies, expansion: "expanded", onToggle: noop("stats.heading onToggle") })
    }
  };
  var otherPrivacyStatsExamples = {
    "stats.without-animation": {
      factory: () => /* @__PURE__ */ _(
        PrivacyStatsMockProvider,
        {
          ticker: true,
          config: {
            expansion: "expanded",
            animation: { kind: "none" }
          }
        },
        /* @__PURE__ */ _(PrivacyStatsConsumer, null)
      )
    },
    "stats.with-view-transitions": {
      factory: () => /* @__PURE__ */ _(
        PrivacyStatsMockProvider,
        {
          ticker: true,
          config: {
            expansion: "expanded",
            animation: { kind: "view-transitions" }
          }
        },
        /* @__PURE__ */ _(PrivacyStatsConsumer, null)
      )
    }
  };

  // pages/new-tab/app/remote-messaging-framework/components/RMF.examples.js
  init_preact_module();
  init_utils();
  init_RemoteMessagingFramework2();

  // pages/new-tab/app/remote-messaging-framework/mocks/rmf.data.js
  var rmfDataExamples = {
    small: {
      content: {
        messageType: "small",
        id: "id-small",
        titleText: "Search services limited",
        descriptionText: "Search services are impacted by a Bing outage, results may not be what you expect"
      }
    },
    medium: {
      content: {
        messageType: "medium",
        id: "id-2",
        icon: "DDGAnnounce",
        titleText: "New Search Feature!",
        descriptionText: "DuckDuckGo now offers Instant Answers for quicker access to the information you need."
      }
    },
    big_single_action: {
      content: {
        messageType: "big_single_action",
        id: "id-big-single",
        titleText: "Tell Us Your Thoughts on Privacy Pro",
        descriptionText: "Take our short anonymous survey and share your feedback.",
        icon: "PrivacyPro",
        primaryActionText: "Take Survey"
      }
    },
    big_two_action: {
      content: {
        messageType: "big_two_action",
        id: "id-big-two",
        titleText: "Tell Us Your Thoughts on Privacy Pro",
        descriptionText: "Take our short anonymous survey and share your feedback.",
        icon: "Announce",
        primaryActionText: "Take Survey",
        secondaryActionText: "Remind me"
      }
    },
    big_two_action_overflow: {
      content: {
        id: "big-two-overflow",
        messageType: "big_two_action",
        icon: "CriticalUpdate",
        titleText: "Windows Update Recommended",
        descriptionText: "Support for Windows 10 is ending soon. Update to Windows 11 or newer before July 8, 2024, to keep getting the latest browser updates and improvements.",
        primaryActionText: "How to update Windows",
        secondaryActionText: "Remind me later, but only if I\u2019m actually going to update soon"
      }
    }
  };

  // pages/new-tab/app/remote-messaging-framework/components/RMF.examples.js
  var RMFExamples = {
    "rmf.small": {
      factory: () => /* @__PURE__ */ _(RemoteMessagingFramework, { message: rmfDataExamples.small.content, dismiss: noop("rmf_dismiss") })
    },
    "rmf.medium": {
      factory: () => /* @__PURE__ */ _(RemoteMessagingFramework, { message: rmfDataExamples.medium.content, dismiss: noop("rmf_dismiss") })
    },
    "rmf.big-single-action": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          message: rmfDataExamples.big_single_action.content,
          primaryAction: noop("rmf_primaryAction"),
          dismiss: noop("rmf_dismiss")
        }
      )
    },
    "rmf.big-two-action": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          message: rmfDataExamples.big_two_action.content,
          primaryAction: noop("rmf_primaryAction"),
          secondaryAction: noop("rmf_secondaryAction"),
          dismiss: noop("rmf_dismiss")
        }
      )
    }
  };
  var otherRMFExamples = {
    "rmf.big-two-action-overflow": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          message: rmfDataExamples.big_two_action_overflow.content,
          primaryAction: noop("rmf_primaryAction"),
          secondaryAction: noop("rmf_secondaryAction"),
          dismiss: noop("rmf_dismiss")
        }
      )
    }
  };

  // pages/new-tab/app/update-notification/components/UpdateNotification.examples.js
  init_preact_module();
  init_UpdateNotification2();
  init_utils();
  var updateNotificationExamples = {
    "updateNotification.empty": {
      factory: () => {
        return /* @__PURE__ */ _(UpdateNotification, { notes: [], version: "1.2.3", dismiss: noop("dismiss!") });
      }
    },
    "updateNotification.populated": {
      factory: () => {
        return /* @__PURE__ */ _(UpdateNotification, { notes: ["Bug Fixed and Updates"], version: "1.2.3", dismiss: noop("dismiss!") });
      }
    }
  };

  // pages/new-tab/app/components/Examples.jsx
  var mainExamples = {
    ...favoritesExamples,
    ...freemiumPIRBannerExamples,
    ...nextStepsExamples,
    ...privacyStatsExamples,
    ...RMFExamples
  };
  var otherExamples = {
    ...otherNextStepsExamples,
    ...otherPrivacyStatsExamples,
    ...otherRMFExamples,
    ...customizerExamples,
    ...updateNotificationExamples
  };

  // pages/new-tab/app/components/Components.jsx
  init_signals_module();
  var url = new URL(window.location.href);
  var list = {
    ...mainExamples,
    ...otherExamples
  };
  var entries3 = Object.entries(list);

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

  // pages/new-tab/app/customizer/customizer.service.js
  init_service();
  var CustomizerService = class {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {CustomizerData} initial
     * @internal
     */
    constructor(ntp, initial) {
      this.ntp = ntp;
      this.bgService = new Service(
        {
          subscribe: (cb) => ntp.messaging.subscribe("customizer_onBackgroundUpdate", cb),
          persist: (data) => {
            ntp.messaging.notify("customizer_setBackground", data);
          }
        },
        { background: initial.background }
      );
      this.themeService = new Service(
        {
          subscribe: (cb) => ntp.messaging.subscribe("customizer_onThemeUpdate", cb)
        },
        { theme: initial.theme }
      );
      this.imagesService = new Service(
        {
          subscribe: (cb) => ntp.messaging.subscribe("customizer_onImagesUpdate", cb)
        },
        { userImages: initial.userImages }
      );
      this.colorService = new Service(
        {
          subscribe: (cb) => ntp.messaging.subscribe("customizer_onColorUpdate", cb)
        },
        { userColor: initial.userColor }
      );
    }
    /**
     * @internal
     */
    destroy() {
      this.bgService.destroy();
      this.themeService.destroy();
      this.imagesService.destroy();
      this.colorService.destroy();
    }
    /**
     * @param {(evt: {data: BackgroundData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onBackground(cb) {
      return this.bgService.onData(cb);
    }
    /**
     * @param {(evt: {data: ThemeData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onTheme(cb) {
      return this.themeService.onData(cb);
    }
    /**
     * @param {(evt: {data: UserImageData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onImages(cb) {
      return this.imagesService.onData(cb);
    }
    /**
     * @param {(evt: {data: UserColorData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onColor(cb) {
      return this.colorService.onData(cb);
    }
    /**
     * @param {BackgroundData} bg
     */
    setBackground(bg) {
      this.bgService.update((data) => {
        return bg;
      });
      if (bg.background.kind === "hex") {
        this.colorService.update((_old) => {
          if (bg.background.kind !== "hex") throw new Error("unreachable code path");
          return { userColor: structuredClone(bg.background) };
        });
      }
    }
    /**
     * @param {string} id
     */
    deleteImage(id) {
      this.imagesService.update((data) => {
        return {
          ...data,
          userImages: data.userImages.filter((img) => img.id !== id)
        };
      });
      this.ntp.messaging.notify("customizer_deleteImage", { id });
    }
    /**
     *
     */
    upload() {
      this.ntp.messaging.notify("customizer_upload");
    }
    /**
     * @param {ThemeData} theme
     */
    setTheme(theme) {
      this.themeService.update((_data) => {
        return theme;
      });
      this.ntp.messaging.notify("customizer_setTheme", theme);
    }
  };

  // pages/new-tab/app/index.js
  async function init(root2, messaging2, telemetry2, baseEnvironment2) {
    const result = await callWithRetry(() => messaging2.initialSetup());
    if ("error" in result) {
      throw new Error(result.error);
    }
    const init2 = result.value;
    console.log("INITIAL DATA", init2);
    if (!Array.isArray(init2.widgets)) {
      throw new Error("missing critical initialSetup.widgets array");
    }
    if (!Array.isArray(init2.widgetConfigs)) {
      throw new Error("missing critical initialSetup.widgetConfig array");
    }
    const environment = baseEnvironment2.withEnv(init2.env).withLocale(init2.locale).withLocale(baseEnvironment2.urlParams.get("locale")).withTextLength(baseEnvironment2.urlParams.get("textLength")).withDisplay(baseEnvironment2.urlParams.get("display"));
    const strings = await getStrings(environment);
    const settings = new Settings({}).withPlatformName(baseEnvironment2.injectName).withPlatformName(init2.platform?.name).withPlatformName(baseEnvironment2.urlParams.get("platform")).withFeatureState("customizerDrawer", init2.settings?.customizerDrawer);
    if (!window.__playwright_01) {
      console.log("environment:", environment);
      console.log("settings:", settings);
      console.log("locale:", environment.locale);
    }
    const didCatch = (error) => {
      const message = error?.message || error?.error || "unknown";
      messaging2.reportPageException({ message });
    };
    installGlobalSideEffects(environment, settings);
    if (environment.display === "components") {
      return renderComponents(root2, environment, settings, strings);
    }
    const entryPoints = await resolveEntryPoints(init2.widgets, didCatch);
    const widgetConfigAPI = new WidgetConfigService(messaging2, init2.widgetConfigs);
    const customizerData2 = init2.customizer || {
      userColor: null,
      background: { kind: "default" },
      theme: "system",
      userImages: []
    };
    const customizerApi = new CustomizerService(messaging2, customizerData2);
    B(
      /* @__PURE__ */ _(
        EnvironmentProvider,
        {
          debugState: environment.debugState,
          injectName: environment.injectName,
          willThrow: environment.willThrow,
          env: environment.env
        },
        /* @__PURE__ */ _(ErrorBoundary, { didCatch, fallback: /* @__PURE__ */ _(Fallback, { showDetails: environment.env === "development" }) }, /* @__PURE__ */ _(UpdateEnvironment, { search: window.location.search }), /* @__PURE__ */ _(MessagingContext.Provider, { value: messaging2 }, /* @__PURE__ */ _(InitialSetupContext.Provider, { value: init2 }, /* @__PURE__ */ _(TelemetryContext.Provider, { value: telemetry2 }, /* @__PURE__ */ _(SettingsProvider, { settings }, /* @__PURE__ */ _(TranslationProvider, { translationObject: strings, fallback: new_tab_default, textLength: environment.textLength }, /* @__PURE__ */ _(CustomizerProvider, { service: customizerApi, initialData: customizerData2 }, /* @__PURE__ */ _(
          WidgetConfigProvider,
          {
            api: widgetConfigAPI,
            widgetConfigs: init2.widgetConfigs,
            widgets: init2.widgets,
            entryPoints
          },
          /* @__PURE__ */ _(App, null)
        ))))))))
      ),
      root2
    );
  }
  async function getStrings(environment) {
    return environment.locale === "en" ? new_tab_default : await fetch(`./locales/${environment.locale}/new-tab.json`).then((x4) => x4.json()).catch((e4) => {
      console.error("Could not load locale", environment.locale, e4);
      return new_tab_default;
    });
  }
  function installGlobalSideEffects(environment, settings) {
    document.body.dataset.platformName = settings.platform.name;
    document.body.dataset.display = environment.display;
  }
  async function resolveEntryPoints(widgets, didCatch) {
    try {
      const loaders = widgets.map((widget) => {
        return widgetEntryPoint(widget.id).then((mod) => [widget.id, mod]);
      });
      const entryPoints = await Promise.all(loaders);
      return Object.fromEntries(entryPoints);
    } catch (e4) {
      const error = new Error("Error loading widget entry points:" + e4.message);
      didCatch(error);
      console.error(error);
      return {};
    }
  }
  function renderComponents(root2, environment, settings, strings) {
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
      const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const notification = WindowsNotification.fromNotification(msg, data);
      this.config.methods.postMessage(notification);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     * @param {{signal?: AbortSignal}} opts
     * @return {Promise<any>}
     */
    request(msg, opts = {}) {
      const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const outgoing = WindowsRequestMessage.fromRequest(msg, data);
      this.config.methods.postMessage(outgoing);
      const comparator = (eventData) => {
        return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.id === msg.id;
      };
      function isMessageResponse(data2) {
        if ("result" in data2) return true;
        if ("error" in data2) return true;
        return false;
      }
      return new this.globals.Promise((resolve, reject) => {
        try {
          this._subscribe(comparator, opts, (value, unsubscribe) => {
            unsubscribe();
            if (!isMessageResponse(value)) {
              console.warn("unknown response type", value);
              return reject(new this.globals.Error("unknown response"));
            }
            if (value.result) {
              return resolve(value.result);
            }
            const message = this.globals.String(value.error?.message || "unknown error");
            reject(new this.globals.Error(message));
          });
        } catch (e4) {
          reject(e4);
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
    _subscribe(comparator, options, callback) {
      if (options?.signal?.aborted) {
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
      options?.signal?.addEventListener("abort", abortHandler);
      teardown = () => {
        this.config.methods.removeEventListener("message", idHandler);
        options?.signal?.removeEventListener("abort", abortHandler);
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
    static fromNotification(notification, data) {
      const output = {
        Data: data,
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
    static fromRequest(msg, data) {
      const output = {
        Data: data,
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
  function isResponseFor(request, data) {
    if ("result" in data) {
      return data.featureName === request.featureName && data.context === request.context && data.id === request.id;
    }
    if ("error" in data) {
      if ("message" in data.error) {
        return true;
      }
    }
    return false;
  }
  function isSubscriptionEventFor(sub, data) {
    if ("subscriptionName" in data) {
      return data.featureName === sub.featureName && data.context === sub.context && data.subscriptionName === sub.subscriptionName;
    }
    return false;
  }

  // ../messaging/lib/webkit.js
  var WebkitMessagingTransport = class {
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      this.globals = captureGlobals();
      if (!this.config.hasModernWebkitAPI) {
        this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
      }
    }
    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @internal
     */
    wkSend(handler, data = {}) {
      if (!(handler in this.globals.window.webkit.messageHandlers)) {
        throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
      }
      if (!this.config.hasModernWebkitAPI) {
        const outgoing = {
          ...data,
          messageHandling: {
            ...data.messageHandling,
            secret: this.config.secret
          }
        };
        if (!(handler in this.globals.capturedWebkitHandlers)) {
          throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler);
        } else {
          return this.globals.capturedWebkitHandlers[handler](outgoing);
        }
      }
      return this.globals.window.webkit.messageHandlers[handler].postMessage?.(data);
    }
    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data) {
      if (this.config.hasModernWebkitAPI) {
        const response = await this.wkSend(handler, data);
        return this.globals.JSONparse(response || "{}");
      }
      try {
        const randMethodName = this.createRandMethodName();
        const key = await this.createRandKey();
        const iv = this.createRandIv();
        const { ciphertext, tag } = await new this.globals.Promise((resolve) => {
          this.generateRandomMethod(randMethodName, resolve);
          data.messageHandling = new SecureMessagingParams({
            methodName: randMethodName,
            secret: this.config.secret,
            key: this.globals.Arrayfrom(key),
            iv: this.globals.Arrayfrom(iv)
          });
          this.wkSend(handler, data);
        });
        const cipher = new this.globals.Uint8Array([...ciphertext, ...tag]);
        const decrypted = await this.decrypt(cipher, key, iv);
        return this.globals.JSONparse(decrypted || "{}");
      } catch (e4) {
        if (e4 instanceof MissingHandler) {
          throw e4;
        } else {
          console.error("decryption failed", e4);
          console.error(e4);
          return { error: e4 };
        }
      }
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
      this.wkSend(msg.context, msg);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     */
    async request(msg) {
      const data = await this.wkSendAndWait(msg.context, msg);
      if (isResponseFor(msg, data)) {
        if (data.result) {
          return data.result || {};
        }
        if (data.error) {
          throw new Error(data.error.message);
        }
      }
      throw new Error("an unknown error occurred");
    }
    /**
     * Generate a random method name and adds it to the global scope
     * The native layer will use this method to send the response
     * @param {string | number} randomMethodName
     * @param {Function} callback
     * @internal
     */
    generateRandomMethod(randomMethodName, callback) {
      this.globals.ObjectDefineProperty(this.globals.window, randomMethodName, {
        enumerable: false,
        // configurable, To allow for deletion later
        configurable: true,
        writable: false,
        /**
         * @param {any[]} args
         */
        value: (...args) => {
          callback(...args);
          delete this.globals.window[randomMethodName];
        }
      });
    }
    /**
     * @internal
     * @return {string}
     */
    randomString() {
      return "" + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0];
    }
    /**
     * @internal
     * @return {string}
     */
    createRandMethodName() {
      return "_" + this.randomString();
    }
    /**
     * @type {{name: string, length: number}}
     * @internal
     */
    algoObj = {
      name: "AES-GCM",
      length: 256
    };
    /**
     * @returns {Promise<Uint8Array>}
     * @internal
     */
    async createRandKey() {
      const key = await this.globals.generateKey(this.algoObj, true, ["encrypt", "decrypt"]);
      const exportedKey = await this.globals.exportKey("raw", key);
      return new this.globals.Uint8Array(exportedKey);
    }
    /**
     * @returns {Uint8Array}
     * @internal
     */
    createRandIv() {
      return this.globals.getRandomValues(new this.globals.Uint8Array(12));
    }
    /**
     * @param {BufferSource} ciphertext
     * @param {BufferSource} key
     * @param {Uint8Array} iv
     * @returns {Promise<string>}
     * @internal
     */
    async decrypt(ciphertext, key, iv) {
      const cryptoKey = await this.globals.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
      const algo = {
        name: "AES-GCM",
        iv
      };
      const decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext);
      const dec = new this.globals.TextDecoder();
      return dec.decode(decrypted);
    }
    /**
     * When required (such as on macos 10.x), capture the `postMessage` method on
     * each webkit messageHandler
     *
     * @param {string[]} handlerNames
     */
    captureWebkitHandlers(handlerNames) {
      const handlers = window.webkit.messageHandlers;
      if (!handlers) throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
      for (const webkitMessageHandlerName of handlerNames) {
        if (typeof handlers[webkitMessageHandlerName]?.postMessage === "function") {
          const original = handlers[webkitMessageHandlerName];
          const bound = handlers[webkitMessageHandlerName].postMessage?.bind(original);
          this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
          delete handlers[webkitMessageHandlerName].postMessage;
        }
      }
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
      if (msg.subscriptionName in this.globals.window) {
        throw new this.globals.Error(`A subscription with the name ${msg.subscriptionName} already exists`);
      }
      this.globals.ObjectDefineProperty(this.globals.window, msg.subscriptionName, {
        enumerable: false,
        configurable: true,
        writable: false,
        value: (data) => {
          if (data && isSubscriptionEventFor(msg, data)) {
            callback(data.params);
          } else {
            console.warn("Received a message that did not match the subscription", data);
          }
        }
      });
      return () => {
        this.globals.ReflectDeleteProperty(this.globals.window, msg.subscriptionName);
      };
    }
  };
  var WebkitMessagingConfig = class {
    /**
     * @param {object} params
     * @param {boolean} params.hasModernWebkitAPI
     * @param {string[]} params.webkitMessageHandlerNames
     * @param {string} params.secret
     * @internal
     */
    constructor(params) {
      this.hasModernWebkitAPI = params.hasModernWebkitAPI;
      this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
      this.secret = params.secret;
    }
  };
  var SecureMessagingParams = class {
    /**
     * @param {object} params
     * @param {string} params.methodName
     * @param {string} params.secret
     * @param {number[]} params.key
     * @param {number[]} params.iv
     */
    constructor(params) {
      this.methodName = params.methodName;
      this.secret = params.secret;
      this.key = params.key;
      this.iv = params.iv;
    }
  };
  function captureGlobals() {
    const globals = {
      window,
      getRandomValues: window.crypto.getRandomValues.bind(window.crypto),
      TextEncoder,
      TextDecoder,
      Uint8Array,
      Uint16Array,
      Uint32Array,
      JSONstringify: window.JSON.stringify,
      JSONparse: window.JSON.parse,
      Arrayfrom: window.Array.from,
      Promise: window.Promise,
      Error: window.Error,
      ReflectDeleteProperty: window.Reflect.deleteProperty.bind(window.Reflect),
      ObjectDefineProperty: window.Object.defineProperty,
      addEventListener: window.addEventListener.bind(window),
      /** @type {Record<string, any>} */
      capturedWebkitHandlers: {}
    };
    if (isSecureContext) {
      globals.generateKey = window.crypto.subtle.generateKey.bind(window.crypto.subtle);
      globals.exportKey = window.crypto.subtle.exportKey.bind(window.crypto.subtle);
      globals.importKey = window.crypto.subtle.importKey.bind(window.crypto.subtle);
      globals.encrypt = window.crypto.subtle.encrypt.bind(window.crypto.subtle);
      globals.decrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
    }
    return globals;
  }

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
      } catch (e4) {
        console.error(".notify failed", e4);
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
        } catch (e4) {
          unsub();
          reject(new Error("request failed to send: " + e4.message || "unknown error"));
        }
        function handler(data) {
          if (isResponseFor(msg, data)) {
            if (data.result) {
              resolve(data.result || {});
              return unsub();
            }
            if (data.error) {
              reject(new Error(data.error.message));
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
      const unsub = this.config.subscribe(msg.subscriptionName, (data) => {
        if (isSubscriptionEventFor(msg, data)) {
          callback(data.params || {});
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
      } catch (e4) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e4);
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
      const { target, javascriptInterface } = this;
      if (Object.prototype.hasOwnProperty.call(target, javascriptInterface)) {
        this._capturedHandler = target[javascriptInterface].process.bind(target[javascriptInterface]);
        delete target[javascriptInterface];
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

  // ../messaging/lib/typed-messages.js
  function createTypedMessages(base, messaging2) {
    const asAny = (
      /** @type {any} */
      messaging2
    );
    return (
      /** @type {BaseClass} */
      asAny
    );
  }

  // ../messaging/index.js
  var MessagingContext2 = class {
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
     * @throws {MissingHandler}
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
    notify(name, data = {}) {
      const message = new NotificationMessage({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        method: name,
        params: data
      });
      this.transport.notify(message);
    }
    /**
     * Send a request, and wait for a response
     * @throws {MissingHandler}
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
    request(name, data = {}) {
      const id = globalThis?.crypto?.randomUUID?.() || name + ".response";
      const message = new RequestMessage({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        method: name,
        params: data,
        id
      });
      return this.transport.request(message);
    }
    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    subscribe(name, callback) {
      const msg = new Subscription({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        subscriptionName: name
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
    if (config instanceof TestTransportConfig) {
      return new TestTransport(config, messagingContext);
    }
    throw new Error("unreachable");
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
    const messageContext = new MessagingContext2({
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
          hasModernWebkitAPI: true,
          secret: "",
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
    } catch (e4) {
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
     * @param {string} [params.locale] - for applications strings
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
    withTextLength(length) {
      if (!length) return this;
      const num = Number(length);
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

  // pages/new-tab/app/mock-transport.js
  init_nextsteps_data();

  // pages/new-tab/app/customizer/mocks.js
  var url2 = new URL(window.location.href);

  // pages/new-tab/app/mock-transport.js
  var url3 = new URL(window.location.href);

  // pages/new-tab/app/telemetry/telemetry.js
  var Telemetry = class _Telemetry {
    static EVENT_REQUEST = "TELEMETRY_EVENT_REQUEST";
    static EVENT_RESPONSE = "TELEMETRY_EVENT_RESPONSE";
    static EVENT_SUBSCRIPTION = "TELEMETRY_EVENT_SUBSCRIPTION";
    static EVENT_SUBSCRIPTION_DATA = "TELEMETRY_EVENT_SUBSCRIPTION_DATA";
    static EVENT_NOTIFICATION = "TELEMETRY_EVENT_NOTIFICATION";
    static EVENT_BROADCAST = "TELEMETRY_*";
    eventTarget = new EventTarget();
    /** @type {any[]} */
    eventStore = [];
    storeEnabled = false;
    /**
     * @param now
     */
    constructor(now = Date.now()) {
      this.now = now;
      performance.mark("ddg-telemetry-init");
      this._setupMessagingMarkers();
    }
    _setupMessagingMarkers() {
      this.eventTarget.addEventListener(_Telemetry.EVENT_REQUEST, ({ detail }) => {
        const named = `ddg request ${detail.method} ${detail.timestamp}`;
        performance.mark(named);
        this.broadcast(detail);
      });
      this.eventTarget.addEventListener(_Telemetry.EVENT_RESPONSE, ({ detail }) => {
        const reqNamed = `ddg request ${detail.method} ${detail.timestamp}`;
        const resNamed = `ddg response ${detail.method} ${detail.timestamp}`;
        performance.mark(resNamed);
        performance.measure(reqNamed, reqNamed, resNamed);
        this.broadcast(detail);
      });
      this.eventTarget.addEventListener(_Telemetry.EVENT_SUBSCRIPTION, ({ detail }) => {
        const named = `ddg subscription ${detail.method} ${detail.timestamp}`;
        performance.mark(named);
        this.broadcast(detail);
      });
      this.eventTarget.addEventListener(_Telemetry.EVENT_SUBSCRIPTION_DATA, ({ detail }) => {
        const named = `ddg subscription data ${detail.method} ${detail.timestamp}`;
        performance.mark(named);
        this.broadcast(detail);
      });
      this.eventTarget.addEventListener(_Telemetry.EVENT_NOTIFICATION, ({ detail }) => {
        const named = `ddg notification ${detail.method} ${detail.timestamp}`;
        performance.mark(named);
        this.broadcast(detail);
      });
    }
    broadcast(payload) {
      if (this.eventStore.length >= 50) {
        this.eventStore = [];
      }
      if (this.storeEnabled) {
        this.eventStore.push(structuredClone(payload));
      }
      this.eventTarget.dispatchEvent(new CustomEvent(_Telemetry.EVENT_BROADCAST, { detail: payload }));
    }
    measureFromPageLoad(marker, measure = "measure__" + Date.now()) {
      if (!performance.getEntriesByName(marker).length) {
        performance.mark(marker);
        performance.measure(measure, "ddg-telemetry-init", marker);
      }
    }
  };
  var MessagingObserver = class {
    /** @type {Map<string, number>} */
    observed = /* @__PURE__ */ new Map();
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {EventTarget} eventTarget
     */
    constructor(messaging2, eventTarget) {
      this.messaging = messaging2;
      this.messagingContext = messaging2.messagingContext;
      this.transport = messaging2.transport;
      this.eventTarget = eventTarget;
    }
    /**
     * @param {string} method
     * @param {Record<string, any>} params
     */
    request(method, params) {
      const timestamp = Date.now();
      const json = {
        kind: "request",
        method,
        params,
        timestamp
      };
      this.record(Telemetry.EVENT_REQUEST, json);
      return this.messaging.request(method, params).then((x4) => {
        const resJson = {
          kind: "response",
          method,
          result: x4,
          timestamp
        };
        this.record(Telemetry.EVENT_RESPONSE, resJson);
        return x4;
      });
    }
    /**
     * @param {string} method
     * @param {Record<string, any>} params
     */
    notify(method, params) {
      const json = {
        kind: "notification",
        method,
        params
      };
      this.record(Telemetry.EVENT_NOTIFICATION, json);
      return this.messaging.notify(method, params);
    }
    /**
     * @param method
     * @param callback
     * @return {function(): void}
     */
    subscribe(method, callback) {
      const timestamp = Date.now();
      const json = {
        kind: "subscription",
        method,
        timestamp
      };
      this.record(Telemetry.EVENT_SUBSCRIPTION, json);
      return this.messaging.subscribe(method, (params) => {
        const json2 = {
          kind: "subscription data",
          method,
          timestamp,
          params
        };
        this.record(Telemetry.EVENT_SUBSCRIPTION_DATA, json2);
        callback(params);
      });
    }
    /**
     * @param {string} name
     * @param {Record<string, any>} detail
     */
    record(name, detail) {
      this.eventTarget.dispatchEvent(new CustomEvent(name, { detail }));
    }
  };
  function install(messaging2) {
    const telemetry2 = new Telemetry();
    const observedMessaging = new MessagingObserver(messaging2, telemetry2.eventTarget);
    return { telemetry: telemetry2, messaging: observedMessaging };
  }

  // pages/new-tab/src/index.js
  var NewTabPage = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta['injectName']} injectName
     */
    constructor(messaging2, injectName) {
      this.messaging = createTypedMessages(this, messaging2);
      this.injectName = injectName;
    }
    /**
     * @return {Promise<import('../types/new-tab.ts').InitialSetupResponse>}
     */
    initialSetup() {
      return this.messaging.request("initialSetup");
    }
    /**
     * @param {string} message
     */
    reportInitException(message) {
      this.messaging.notify("reportInitException", { message });
    }
    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException(params) {
      this.messaging.notify("reportPageException", params);
    }
    /**
     * Sent when a right-click occurs, and wasn't intercepted by another widget
     * @param {import('../types/new-tab.ts').ContextMenuNotify} params
     */
    contextMenu(params) {
      this.messaging.notify("contextMenu", params);
    }
    /**
     * @param {import("../types/new-tab.ts").NTPTelemetryEvent} event
     */
    telemetryEvent(event) {
      this.messaging.notify("telemetryEvent", event);
    }
    /**
     * NOTE: temporary workaround, to be replaced with 'telemetryEvent'
     */
    statsShowMore() {
      this.messaging.notify("stats_showMore");
    }
    /**
     * NOTE: temporary workaround, to be replaced with 'telemetryEvent'
     */
    statsShowLess() {
      this.messaging.notify("stats_showLess");
    }
  };
  var baseEnvironment = new Environment().withInjectName("apple").withEnv("production");
  var rawMessaging = createSpecialPageMessaging({
    injectName: "apple",
    env: "production",
    pageName: "newTabPage",
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration") return null;
      let mock = null;
      return mock;
    }
  });
  var { messaging, telemetry } = install(rawMessaging);
  var newTabMessaging = new NewTabPage(messaging, "apple");
  var root = document.querySelector("#app");
  if (!root) {
    document.documentElement.dataset.fatalError = "true";
    B("Fatal: #app missing", document.body);
    throw new Error("Missing #app");
  }
  init(root, newTabMessaging, telemetry, baseEnvironment).catch((e4) => {
    console.error(e4);
    const msg = typeof e4?.message === "string" ? e4.message : "unknown init error";
    newTabMessaging.reportInitException(msg);
    document.documentElement.dataset.fatalError = "true";
    const element = /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("div", { style: "padding: 1rem;" }, /* @__PURE__ */ _("p", null, /* @__PURE__ */ _("strong", null, "A fatal error occurred:")), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _("pre", { style: { whiteSpace: "prewrap", overflow: "auto" } }, /* @__PURE__ */ _("code", null, JSON.stringify({ message: e4.message }, null, 2))), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _("p", null, /* @__PURE__ */ _("strong", null, "Telemetry")), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _("pre", { style: { whiteSpace: "prewrap", overflow: "auto", fontSize: ".8em" } }, /* @__PURE__ */ _("code", null, JSON.stringify(telemetry.eventStore, null, 2)))));
    B(element, document.body);
  });
})();
/*! Bundled license information:

classnames/index.js:
  (*!
  	Copyright (c) 2018 Jed Watson.
  	Licensed under the MIT License (MIT), see
  	http://jedwatson.github.io/classnames
  *)
*/
