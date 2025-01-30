"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __glob = (map) => (path) => {
    var fn2 = map[path];
    if (fn2) return fn2();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all2) => {
    for (var name in all2)
      __defProp(target, name, { get: all2[name], enumerable: true });
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
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../node_modules/preact/dist/preact.module.js
  function w(n4, l6) {
    for (var u5 in l6) n4[u5] = l6[u5];
    return n4;
  }
  function _(n4) {
    n4 && n4.parentNode && n4.parentNode.removeChild(n4);
  }
  function g(l6, u5, t5) {
    var i6, r5, o5, e5 = {};
    for (o5 in u5) "key" == o5 ? i6 = u5[o5] : "ref" == o5 ? r5 = u5[o5] : e5[o5] = u5[o5];
    if (arguments.length > 2 && (e5.children = arguments.length > 3 ? n.call(arguments, 2) : t5), "function" == typeof l6 && null != l6.defaultProps) for (o5 in l6.defaultProps) void 0 === e5[o5] && (e5[o5] = l6.defaultProps[o5]);
    return m(l6, e5, i6, r5, null);
  }
  function m(n4, t5, i6, r5, o5) {
    var e5 = { type: n4, props: t5, key: i6, ref: r5, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o5 ? ++u : o5, __i: -1, __u: 0 };
    return null == o5 && null != l.vnode && l.vnode(e5), e5;
  }
  function k(n4) {
    return n4.children;
  }
  function x(n4, l6) {
    this.props = n4, this.context = l6;
  }
  function C(n4, l6) {
    if (null == l6) return n4.__ ? C(n4.__, n4.__i + 1) : null;
    for (var u5; l6 < n4.__k.length; l6++) if (null != (u5 = n4.__k[l6]) && null != u5.__e) return u5.__e;
    return "function" == typeof n4.type ? C(n4) : null;
  }
  function S(n4) {
    var l6, u5;
    if (null != (n4 = n4.__) && null != n4.__c) {
      for (n4.__e = n4.__c.base = null, l6 = 0; l6 < n4.__k.length; l6++) if (null != (u5 = n4.__k[l6]) && null != u5.__e) {
        n4.__e = n4.__c.base = u5.__e;
        break;
      }
      return S(n4);
    }
  }
  function M(n4) {
    (!n4.__d && (n4.__d = true) && i.push(n4) && !P.__r++ || r !== l.debounceRendering) && ((r = l.debounceRendering) || o)(P);
  }
  function P() {
    var n4, u5, t5, r5, o5, f5, c5, s6;
    for (i.sort(e); n4 = i.shift(); ) n4.__d && (u5 = i.length, r5 = void 0, f5 = (o5 = (t5 = n4).__v).__e, c5 = [], s6 = [], t5.__P && ((r5 = w({}, o5)).__v = o5.__v + 1, l.vnode && l.vnode(r5), j(t5.__P, r5, o5, t5.__n, t5.__P.namespaceURI, 32 & o5.__u ? [f5] : null, c5, null == f5 ? C(o5) : f5, !!(32 & o5.__u), s6), r5.__v = o5.__v, r5.__.__k[r5.__i] = r5, z(c5, r5, s6), r5.__e != f5 && S(r5)), i.length > u5 && i.sort(e));
    P.__r = 0;
  }
  function $(n4, l6, u5, t5, i6, r5, o5, e5, f5, c5, s6) {
    var a5, h6, y6, d6, w6, _6, g7 = t5 && t5.__k || v, m5 = l6.length;
    for (f5 = I(u5, l6, g7, f5, m5), a5 = 0; a5 < m5; a5++) null != (y6 = u5.__k[a5]) && (h6 = -1 === y6.__i ? p : g7[y6.__i] || p, y6.__i = a5, _6 = j(n4, y6, h6, i6, r5, o5, e5, f5, c5, s6), d6 = y6.__e, y6.ref && h6.ref != y6.ref && (h6.ref && V(h6.ref, null, y6), s6.push(y6.ref, y6.__c || d6, y6)), null == w6 && null != d6 && (w6 = d6), 4 & y6.__u || h6.__k === y6.__k ? f5 = A(y6, f5, n4) : "function" == typeof y6.type && void 0 !== _6 ? f5 = _6 : d6 && (f5 = d6.nextSibling), y6.__u &= -7);
    return u5.__e = w6, f5;
  }
  function I(n4, l6, u5, t5, i6) {
    var r5, o5, e5, f5, c5, s6 = u5.length, a5 = s6, h6 = 0;
    for (n4.__k = new Array(i6), r5 = 0; r5 < i6; r5++) null != (o5 = l6[r5]) && "boolean" != typeof o5 && "function" != typeof o5 ? (f5 = r5 + h6, (o5 = n4.__k[r5] = "string" == typeof o5 || "number" == typeof o5 || "bigint" == typeof o5 || o5.constructor == String ? m(null, o5, null, null, null) : d(o5) ? m(k, { children: o5 }, null, null, null) : void 0 === o5.constructor && o5.__b > 0 ? m(o5.type, o5.props, o5.key, o5.ref ? o5.ref : null, o5.__v) : o5).__ = n4, o5.__b = n4.__b + 1, e5 = null, -1 !== (c5 = o5.__i = L(o5, u5, f5, a5)) && (a5--, (e5 = u5[c5]) && (e5.__u |= 2)), null == e5 || null === e5.__v ? (-1 == c5 && h6--, "function" != typeof o5.type && (o5.__u |= 4)) : c5 != f5 && (c5 == f5 - 1 ? h6-- : c5 == f5 + 1 ? h6++ : (c5 > f5 ? h6-- : h6++, o5.__u |= 4))) : n4.__k[r5] = null;
    if (a5) for (r5 = 0; r5 < s6; r5++) null != (e5 = u5[r5]) && 0 == (2 & e5.__u) && (e5.__e == t5 && (t5 = C(e5)), q(e5, e5));
    return t5;
  }
  function A(n4, l6, u5) {
    var t5, i6;
    if ("function" == typeof n4.type) {
      for (t5 = n4.__k, i6 = 0; t5 && i6 < t5.length; i6++) t5[i6] && (t5[i6].__ = n4, l6 = A(t5[i6], l6, u5));
      return l6;
    }
    n4.__e != l6 && (l6 && n4.type && !u5.contains(l6) && (l6 = C(n4)), u5.insertBefore(n4.__e, l6 || null), l6 = n4.__e);
    do {
      l6 = l6 && l6.nextSibling;
    } while (null != l6 && 8 == l6.nodeType);
    return l6;
  }
  function H(n4, l6) {
    return l6 = l6 || [], null == n4 || "boolean" == typeof n4 || (d(n4) ? n4.some(function(n5) {
      H(n5, l6);
    }) : l6.push(n4)), l6;
  }
  function L(n4, l6, u5, t5) {
    var i6, r5, o5 = n4.key, e5 = n4.type, f5 = l6[u5];
    if (null === f5 || f5 && o5 == f5.key && e5 === f5.type && 0 == (2 & f5.__u)) return u5;
    if (t5 > (null != f5 && 0 == (2 & f5.__u) ? 1 : 0)) for (i6 = u5 - 1, r5 = u5 + 1; i6 >= 0 || r5 < l6.length; ) {
      if (i6 >= 0) {
        if ((f5 = l6[i6]) && 0 == (2 & f5.__u) && o5 == f5.key && e5 === f5.type) return i6;
        i6--;
      }
      if (r5 < l6.length) {
        if ((f5 = l6[r5]) && 0 == (2 & f5.__u) && o5 == f5.key && e5 === f5.type) return r5;
        r5++;
      }
    }
    return -1;
  }
  function T(n4, l6, u5) {
    "-" == l6[0] ? n4.setProperty(l6, null == u5 ? "" : u5) : n4[l6] = null == u5 ? "" : "number" != typeof u5 || y.test(l6) ? u5 : u5 + "px";
  }
  function F(n4, l6, u5, t5, i6) {
    var r5;
    n: if ("style" == l6) if ("string" == typeof u5) n4.style.cssText = u5;
    else {
      if ("string" == typeof t5 && (n4.style.cssText = t5 = ""), t5) for (l6 in t5) u5 && l6 in u5 || T(n4.style, l6, "");
      if (u5) for (l6 in u5) t5 && u5[l6] === t5[l6] || T(n4.style, l6, u5[l6]);
    }
    else if ("o" == l6[0] && "n" == l6[1]) r5 = l6 != (l6 = l6.replace(f, "$1")), l6 = l6.toLowerCase() in n4 || "onFocusOut" == l6 || "onFocusIn" == l6 ? l6.toLowerCase().slice(2) : l6.slice(2), n4.l || (n4.l = {}), n4.l[l6 + r5] = u5, u5 ? t5 ? u5.u = t5.u : (u5.u = c, n4.addEventListener(l6, r5 ? a : s, r5)) : n4.removeEventListener(l6, r5 ? a : s, r5);
    else {
      if ("http://www.w3.org/2000/svg" == i6) l6 = l6.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l6 && "height" != l6 && "href" != l6 && "list" != l6 && "form" != l6 && "tabIndex" != l6 && "download" != l6 && "rowSpan" != l6 && "colSpan" != l6 && "role" != l6 && "popover" != l6 && l6 in n4) try {
        n4[l6] = null == u5 ? "" : u5;
        break n;
      } catch (n5) {
      }
      "function" == typeof u5 || (null == u5 || false === u5 && "-" != l6[4] ? n4.removeAttribute(l6) : n4.setAttribute(l6, "popover" == l6 && 1 == u5 ? "" : u5));
    }
  }
  function O(n4) {
    return function(u5) {
      if (this.l) {
        var t5 = this.l[u5.type + n4];
        if (null == u5.t) u5.t = c++;
        else if (u5.t < t5.u) return;
        return t5(l.event ? l.event(u5) : u5);
      }
    };
  }
  function j(n4, u5, t5, i6, r5, o5, e5, f5, c5, s6) {
    var a5, h6, p6, v5, y6, g7, m5, b5, C4, S3, M4, P5, I3, A6, H3, L3, T5, F5 = u5.type;
    if (void 0 !== u5.constructor) return null;
    128 & t5.__u && (c5 = !!(32 & t5.__u), o5 = [f5 = u5.__e = t5.__e]), (a5 = l.__b) && a5(u5);
    n: if ("function" == typeof F5) try {
      if (b5 = u5.props, C4 = "prototype" in F5 && F5.prototype.render, S3 = (a5 = F5.contextType) && i6[a5.__c], M4 = a5 ? S3 ? S3.props.value : a5.__ : i6, t5.__c ? m5 = (h6 = u5.__c = t5.__c).__ = h6.__E : (C4 ? u5.__c = h6 = new F5(b5, M4) : (u5.__c = h6 = new x(b5, M4), h6.constructor = F5, h6.render = B), S3 && S3.sub(h6), h6.props = b5, h6.state || (h6.state = {}), h6.context = M4, h6.__n = i6, p6 = h6.__d = true, h6.__h = [], h6._sb = []), C4 && null == h6.__s && (h6.__s = h6.state), C4 && null != F5.getDerivedStateFromProps && (h6.__s == h6.state && (h6.__s = w({}, h6.__s)), w(h6.__s, F5.getDerivedStateFromProps(b5, h6.__s))), v5 = h6.props, y6 = h6.state, h6.__v = u5, p6) C4 && null == F5.getDerivedStateFromProps && null != h6.componentWillMount && h6.componentWillMount(), C4 && null != h6.componentDidMount && h6.__h.push(h6.componentDidMount);
      else {
        if (C4 && null == F5.getDerivedStateFromProps && b5 !== v5 && null != h6.componentWillReceiveProps && h6.componentWillReceiveProps(b5, M4), !h6.__e && (null != h6.shouldComponentUpdate && false === h6.shouldComponentUpdate(b5, h6.__s, M4) || u5.__v == t5.__v)) {
          for (u5.__v != t5.__v && (h6.props = b5, h6.state = h6.__s, h6.__d = false), u5.__e = t5.__e, u5.__k = t5.__k, u5.__k.some(function(n5) {
            n5 && (n5.__ = u5);
          }), P5 = 0; P5 < h6._sb.length; P5++) h6.__h.push(h6._sb[P5]);
          h6._sb = [], h6.__h.length && e5.push(h6);
          break n;
        }
        null != h6.componentWillUpdate && h6.componentWillUpdate(b5, h6.__s, M4), C4 && null != h6.componentDidUpdate && h6.__h.push(function() {
          h6.componentDidUpdate(v5, y6, g7);
        });
      }
      if (h6.context = M4, h6.props = b5, h6.__P = n4, h6.__e = false, I3 = l.__r, A6 = 0, C4) {
        for (h6.state = h6.__s, h6.__d = false, I3 && I3(u5), a5 = h6.render(h6.props, h6.state, h6.context), H3 = 0; H3 < h6._sb.length; H3++) h6.__h.push(h6._sb[H3]);
        h6._sb = [];
      } else do {
        h6.__d = false, I3 && I3(u5), a5 = h6.render(h6.props, h6.state, h6.context), h6.state = h6.__s;
      } while (h6.__d && ++A6 < 25);
      h6.state = h6.__s, null != h6.getChildContext && (i6 = w(w({}, i6), h6.getChildContext())), C4 && !p6 && null != h6.getSnapshotBeforeUpdate && (g7 = h6.getSnapshotBeforeUpdate(v5, y6)), f5 = $(n4, d(L3 = null != a5 && a5.type === k && null == a5.key ? a5.props.children : a5) ? L3 : [L3], u5, t5, i6, r5, o5, e5, f5, c5, s6), h6.base = u5.__e, u5.__u &= -161, h6.__h.length && e5.push(h6), m5 && (h6.__E = h6.__ = null);
    } catch (n5) {
      if (u5.__v = null, c5 || null != o5) if (n5.then) {
        for (u5.__u |= c5 ? 160 : 128; f5 && 8 == f5.nodeType && f5.nextSibling; ) f5 = f5.nextSibling;
        o5[o5.indexOf(f5)] = null, u5.__e = f5;
      } else for (T5 = o5.length; T5--; ) _(o5[T5]);
      else u5.__e = t5.__e, u5.__k = t5.__k;
      l.__e(n5, u5, t5);
    }
    else null == o5 && u5.__v == t5.__v ? (u5.__k = t5.__k, u5.__e = t5.__e) : f5 = u5.__e = N(t5.__e, u5, t5, i6, r5, o5, e5, c5, s6);
    return (a5 = l.diffed) && a5(u5), 128 & u5.__u ? void 0 : f5;
  }
  function z(n4, u5, t5) {
    for (var i6 = 0; i6 < t5.length; i6++) V(t5[i6], t5[++i6], t5[++i6]);
    l.__c && l.__c(u5, n4), n4.some(function(u6) {
      try {
        n4 = u6.__h, u6.__h = [], n4.some(function(n5) {
          n5.call(u6);
        });
      } catch (n5) {
        l.__e(n5, u6.__v);
      }
    });
  }
  function N(u5, t5, i6, r5, o5, e5, f5, c5, s6) {
    var a5, h6, v5, y6, w6, g7, m5, b5 = i6.props, k5 = t5.props, x5 = t5.type;
    if ("svg" == x5 ? o5 = "http://www.w3.org/2000/svg" : "math" == x5 ? o5 = "http://www.w3.org/1998/Math/MathML" : o5 || (o5 = "http://www.w3.org/1999/xhtml"), null != e5) {
      for (a5 = 0; a5 < e5.length; a5++) if ((w6 = e5[a5]) && "setAttribute" in w6 == !!x5 && (x5 ? w6.localName == x5 : 3 == w6.nodeType)) {
        u5 = w6, e5[a5] = null;
        break;
      }
    }
    if (null == u5) {
      if (null == x5) return document.createTextNode(k5);
      u5 = document.createElementNS(o5, x5, k5.is && k5), c5 && (l.__m && l.__m(t5, e5), c5 = false), e5 = null;
    }
    if (null === x5) b5 === k5 || c5 && u5.data === k5 || (u5.data = k5);
    else {
      if (e5 = e5 && n.call(u5.childNodes), b5 = i6.props || p, !c5 && null != e5) for (b5 = {}, a5 = 0; a5 < u5.attributes.length; a5++) b5[(w6 = u5.attributes[a5]).name] = w6.value;
      for (a5 in b5) if (w6 = b5[a5], "children" == a5) ;
      else if ("dangerouslySetInnerHTML" == a5) v5 = w6;
      else if (!(a5 in k5)) {
        if ("value" == a5 && "defaultValue" in k5 || "checked" == a5 && "defaultChecked" in k5) continue;
        F(u5, a5, null, w6, o5);
      }
      for (a5 in k5) w6 = k5[a5], "children" == a5 ? y6 = w6 : "dangerouslySetInnerHTML" == a5 ? h6 = w6 : "value" == a5 ? g7 = w6 : "checked" == a5 ? m5 = w6 : c5 && "function" != typeof w6 || b5[a5] === w6 || F(u5, a5, w6, b5[a5], o5);
      if (h6) c5 || v5 && (h6.__html === v5.__html || h6.__html === u5.innerHTML) || (u5.innerHTML = h6.__html), t5.__k = [];
      else if (v5 && (u5.innerHTML = ""), $(u5, d(y6) ? y6 : [y6], t5, i6, r5, "foreignObject" == x5 ? "http://www.w3.org/1999/xhtml" : o5, e5, f5, e5 ? e5[0] : i6.__k && C(i6, 0), c5, s6), null != e5) for (a5 = e5.length; a5--; ) _(e5[a5]);
      c5 || (a5 = "value", "progress" == x5 && null == g7 ? u5.removeAttribute("value") : void 0 !== g7 && (g7 !== u5[a5] || "progress" == x5 && !g7 || "option" == x5 && g7 !== b5[a5]) && F(u5, a5, g7, b5[a5], o5), a5 = "checked", void 0 !== m5 && m5 !== u5[a5] && F(u5, a5, m5, b5[a5], o5));
    }
    return u5;
  }
  function V(n4, u5, t5) {
    try {
      if ("function" == typeof n4) {
        var i6 = "function" == typeof n4.__u;
        i6 && n4.__u(), i6 && null == u5 || (n4.__u = n4(u5));
      } else n4.current = u5;
    } catch (n5) {
      l.__e(n5, t5);
    }
  }
  function q(n4, u5, t5) {
    var i6, r5;
    if (l.unmount && l.unmount(n4), (i6 = n4.ref) && (i6.current && i6.current !== n4.__e || V(i6, null, u5)), null != (i6 = n4.__c)) {
      if (i6.componentWillUnmount) try {
        i6.componentWillUnmount();
      } catch (n5) {
        l.__e(n5, u5);
      }
      i6.base = i6.__P = null;
    }
    if (i6 = n4.__k) for (r5 = 0; r5 < i6.length; r5++) i6[r5] && q(i6[r5], u5, t5 || "function" != typeof n4.type);
    t5 || _(n4.__e), n4.__c = n4.__ = n4.__e = void 0;
  }
  function B(n4, l6, u5) {
    return this.constructor(n4, u5);
  }
  function D(u5, t5, i6) {
    var r5, o5, e5, f5;
    t5 == document && (t5 = document.documentElement), l.__ && l.__(u5, t5), o5 = (r5 = "function" == typeof i6) ? null : i6 && i6.__k || t5.__k, e5 = [], f5 = [], j(t5, u5 = (!r5 && i6 || t5).__k = g(k, null, [u5]), o5 || p, p, t5.namespaceURI, !r5 && i6 ? [i6] : o5 ? null : t5.firstChild ? n.call(t5.childNodes) : null, e5, !r5 && i6 ? i6 : o5 ? o5.__e : t5.firstChild, r5, f5), z(e5, u5, f5);
  }
  function J(n4, l6) {
    var u5 = { __c: l6 = "__cC" + h++, __: n4, Consumer: function(n5, l7) {
      return n5.children(l7);
    }, Provider: function(n5) {
      var u6, t5;
      return this.getChildContext || (u6 = /* @__PURE__ */ new Set(), (t5 = {})[l6] = this, this.getChildContext = function() {
        return t5;
      }, this.componentWillUnmount = function() {
        u6 = null;
      }, this.shouldComponentUpdate = function(n6) {
        this.props.value !== n6.value && u6.forEach(function(n7) {
          n7.__e = true, M(n7);
        });
      }, this.sub = function(n6) {
        u6.add(n6);
        var l7 = n6.componentWillUnmount;
        n6.componentWillUnmount = function() {
          u6 && u6.delete(n6), l7 && l7.call(n6);
        };
      }), n5.children;
    } };
    return u5.Provider.__ = u5.Consumer.contextType = u5;
  }
  var n, l, u, t, i, r, o, e, f, c, s, a, h, p, v, y, d;
  var init_preact_module = __esm({
    "../node_modules/preact/dist/preact.module.js"() {
      p = {};
      v = [];
      y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
      d = Array.isArray;
      n = v.slice, l = { __e: function(n4, l6, u5, t5) {
        for (var i6, r5, o5; l6 = l6.__; ) if ((i6 = l6.__c) && !i6.__) try {
          if ((r5 = i6.constructor) && null != r5.getDerivedStateFromError && (i6.setState(r5.getDerivedStateFromError(n4)), o5 = i6.__d), null != i6.componentDidCatch && (i6.componentDidCatch(n4, t5 || {}), o5 = i6.__d), o5) return i6.__E = i6;
        } catch (l7) {
          n4 = l7;
        }
        throw n4;
      } }, u = 0, t = function(n4) {
        return null != n4 && null == n4.constructor;
      }, x.prototype.setState = function(n4, l6) {
        var u5;
        u5 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = w({}, this.state), "function" == typeof n4 && (n4 = n4(w({}, u5), this.props)), n4 && w(u5, n4), null != n4 && this.__v && (l6 && this._sb.push(l6), M(this));
      }, x.prototype.forceUpdate = function(n4) {
        this.__v && (this.__e = true, n4 && this.__h.push(n4), M(this));
      }, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n4, l6) {
        return n4.__v.__b - l6.__v.__b;
      }, P.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = O(false), a = O(true), h = 0;
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
          for (var i6 = 0; i6 < arguments.length; i6++) {
            var arg = arguments[i6];
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
  function d2(n4, t5) {
    c2.__h && c2.__h(r2, n4, o2 || t5), o2 = 0;
    var u5 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n4 >= u5.__.length && u5.__.push({}), u5.__[n4];
  }
  function h2(n4) {
    return o2 = 1, p2(D2, n4);
  }
  function p2(n4, u5, i6) {
    var o5 = d2(t2++, 2);
    if (o5.t = n4, !o5.__c && (o5.__ = [i6 ? i6(u5) : D2(void 0, u5), function(n5) {
      var t5 = o5.__N ? o5.__N[0] : o5.__[0], r5 = o5.t(t5, n5);
      t5 !== r5 && (o5.__N = [r5, o5.__[1]], o5.__c.setState({}));
    }], o5.__c = r2, !r2.u)) {
      var f5 = function(n5, t5, r5) {
        if (!o5.__c.__H) return true;
        var u6 = o5.__c.__H.__.filter(function(n6) {
          return !!n6.__c;
        });
        if (u6.every(function(n6) {
          return !n6.__N;
        })) return !c5 || c5.call(this, n5, t5, r5);
        var i7 = o5.__c.props !== n5;
        return u6.forEach(function(n6) {
          if (n6.__N) {
            var t6 = n6.__[0];
            n6.__ = n6.__N, n6.__N = void 0, t6 !== n6.__[0] && (i7 = true);
          }
        }), c5 && c5.call(this, n5, t5, r5) || i7;
      };
      r2.u = true;
      var c5 = r2.shouldComponentUpdate, e5 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n5, t5, r5) {
        if (this.__e) {
          var u6 = c5;
          c5 = void 0, f5(n5, t5, r5), c5 = u6;
        }
        e5 && e5.call(this, n5, t5, r5);
      }, r2.shouldComponentUpdate = f5;
    }
    return o5.__N || o5.__;
  }
  function y2(n4, u5) {
    var i6 = d2(t2++, 3);
    !c2.__s && C2(i6.__H, u5) && (i6.__ = n4, i6.i = u5, r2.__H.__h.push(i6));
  }
  function _2(n4, u5) {
    var i6 = d2(t2++, 4);
    !c2.__s && C2(i6.__H, u5) && (i6.__ = n4, i6.i = u5, r2.__h.push(i6));
  }
  function A2(n4) {
    return o2 = 5, T2(function() {
      return { current: n4 };
    }, []);
  }
  function T2(n4, r5) {
    var u5 = d2(t2++, 7);
    return C2(u5.__H, r5) && (u5.__ = n4(), u5.__H = r5, u5.__h = n4), u5.__;
  }
  function q2(n4, t5) {
    return o2 = 8, T2(function() {
      return n4;
    }, t5);
  }
  function x2(n4) {
    var u5 = r2.context[n4.__c], i6 = d2(t2++, 9);
    return i6.c = n4, u5 ? (null == i6.__ && (i6.__ = true, u5.sub(r2)), u5.props.value) : n4.__;
  }
  function g2() {
    var n4 = d2(t2++, 11);
    if (!n4.__) {
      for (var u5 = r2.__v; null !== u5 && !u5.__m && null !== u5.__; ) u5 = u5.__;
      var i6 = u5.__m || (u5.__m = [0, 0]);
      n4.__ = "P" + i6[0] + "-" + i6[1]++;
    }
    return n4.__;
  }
  function j2() {
    for (var n4; n4 = f2.shift(); ) if (n4.__P && n4.__H) try {
      n4.__H.__h.forEach(z2), n4.__H.__h.forEach(B2), n4.__H.__h = [];
    } catch (t5) {
      n4.__H.__h = [], c2.__e(t5, n4.__v);
    }
  }
  function w2(n4) {
    var t5, r5 = function() {
      clearTimeout(u5), k2 && cancelAnimationFrame(t5), setTimeout(n4);
    }, u5 = setTimeout(r5, 100);
    k2 && (t5 = requestAnimationFrame(r5));
  }
  function z2(n4) {
    var t5 = r2, u5 = n4.__c;
    "function" == typeof u5 && (n4.__c = void 0, u5()), r2 = t5;
  }
  function B2(n4) {
    var t5 = r2;
    n4.__c = n4.__(), r2 = t5;
  }
  function C2(n4, t5) {
    return !n4 || n4.length !== t5.length || t5.some(function(t6, r5) {
      return t6 !== n4[r5];
    });
  }
  function D2(n4, t5) {
    return "function" == typeof t5 ? t5(n4) : t5;
  }
  var t2, r2, u2, i3, o2, f2, c2, e2, a2, v2, l2, m2, s2, k2;
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
      m2 = c2.unmount;
      s2 = c2.__;
      c2.__b = function(n4) {
        r2 = null, e2 && e2(n4);
      }, c2.__ = function(n4, t5) {
        n4 && t5.__k && t5.__k.__m && (n4.__m = t5.__k.__m), s2 && s2(n4, t5);
      }, c2.__r = function(n4) {
        a2 && a2(n4), t2 = 0;
        var i6 = (r2 = n4.__c).__H;
        i6 && (u2 === r2 ? (i6.__h = [], r2.__h = [], i6.__.forEach(function(n5) {
          n5.__N && (n5.__ = n5.__N), n5.i = n5.__N = void 0;
        })) : (i6.__h.forEach(z2), i6.__h.forEach(B2), i6.__h = [], t2 = 0)), u2 = r2;
      }, c2.diffed = function(n4) {
        v2 && v2(n4);
        var t5 = n4.__c;
        t5 && t5.__H && (t5.__H.__h.length && (1 !== f2.push(t5) && i3 === c2.requestAnimationFrame || ((i3 = c2.requestAnimationFrame) || w2)(j2)), t5.__H.__.forEach(function(n5) {
          n5.i && (n5.__H = n5.i), n5.i = void 0;
        })), u2 = r2 = null;
      }, c2.__c = function(n4, t5) {
        t5.some(function(n5) {
          try {
            n5.__h.forEach(z2), n5.__h = n5.__h.filter(function(n6) {
              return !n6.__ || B2(n6);
            });
          } catch (r5) {
            t5.some(function(n6) {
              n6.__h && (n6.__h = []);
            }), t5 = [], c2.__e(r5, n5.__v);
          }
        }), l2 && l2(n4, t5);
      }, c2.unmount = function(n4) {
        m2 && m2(n4);
        var t5, r5 = n4.__c;
        r5 && r5.__H && (r5.__H.__.forEach(function(n5) {
          try {
            z2(n5);
          } catch (n6) {
            t5 = n6;
          }
        }), r5.__H = void 0, t5 && c2.__e(t5, r5.__v));
      };
      k2 = "function" == typeof requestAnimationFrame;
    }
  });

  // pages/new-tab/app/settings.provider.js
  function SettingsProvider({ settings, children }) {
    return /* @__PURE__ */ g(SettingsContext.Provider, { value: { settings } }, children);
  }
  function usePlatformName() {
    return x2(SettingsContext).settings.platform.name;
  }
  function useCustomizerDrawerSettings() {
    return x2(SettingsContext).settings.customizerDrawer;
  }
  function useCustomizerKind() {
    const settings = x2(SettingsContext).settings;
    return settings.customizerDrawer.state === "enabled" ? "drawer" : "menu";
  }
  var SettingsContext;
  var init_settings_provider = __esm({
    "pages/new-tab/app/settings.provider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      SettingsContext = J(
        /** @type {{settings: import("./settings.js").Settings}} */
        {}
      );
    }
  });

  // ../node_modules/@preact/signals-core/dist/signals-core.module.js
  function t3() {
    if (!(s3 > 1)) {
      var i6, t5 = false;
      while (void 0 !== h3) {
        var r5 = h3;
        h3 = void 0;
        f3++;
        while (void 0 !== r5) {
          var o5 = r5.o;
          r5.o = void 0;
          r5.f &= -3;
          if (!(8 & r5.f) && c3(r5)) try {
            r5.c();
          } catch (r6) {
            if (!t5) {
              i6 = r6;
              t5 = true;
            }
          }
          r5 = o5;
        }
      }
      f3 = 0;
      s3--;
      if (t5) throw i6;
    } else s3--;
  }
  function r3(i6) {
    if (s3 > 0) return i6();
    s3++;
    try {
      return i6();
    } finally {
      t3();
    }
  }
  function e3(i6) {
    if (void 0 !== o3) {
      var t5 = i6.n;
      if (void 0 === t5 || t5.t !== o3) {
        t5 = { i: 0, S: i6, p: o3.s, n: void 0, t: o3, e: void 0, x: void 0, r: t5 };
        if (void 0 !== o3.s) o3.s.n = t5;
        o3.s = t5;
        i6.n = t5;
        if (32 & o3.f) i6.S(t5);
        return t5;
      } else if (-1 === t5.i) {
        t5.i = 0;
        if (void 0 !== t5.n) {
          t5.n.p = t5.p;
          if (void 0 !== t5.p) t5.p.n = t5.n;
          t5.p = o3.s;
          t5.n = void 0;
          o3.s.n = t5;
          o3.s = t5;
        }
        return t5;
      }
    }
  }
  function u3(i6) {
    this.v = i6;
    this.i = 0;
    this.n = void 0;
    this.t = void 0;
  }
  function d3(i6) {
    return new u3(i6);
  }
  function c3(i6) {
    for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) if (t5.S.i !== t5.i || !t5.S.h() || t5.S.i !== t5.i) return true;
    return false;
  }
  function a3(i6) {
    for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) {
      var r5 = t5.S.n;
      if (void 0 !== r5) t5.r = r5;
      t5.S.n = t5;
      t5.i = -1;
      if (void 0 === t5.n) {
        i6.s = t5;
        break;
      }
    }
  }
  function l3(i6) {
    var t5 = i6.s, r5 = void 0;
    while (void 0 !== t5) {
      var o5 = t5.p;
      if (-1 === t5.i) {
        t5.S.U(t5);
        if (void 0 !== o5) o5.n = t5.n;
        if (void 0 !== t5.n) t5.n.p = o5;
      } else r5 = t5;
      t5.S.n = t5.r;
      if (void 0 !== t5.r) t5.r = void 0;
      t5 = o5;
    }
    i6.s = r5;
  }
  function y3(i6) {
    u3.call(this, void 0);
    this.x = i6;
    this.s = void 0;
    this.g = v3 - 1;
    this.f = 4;
  }
  function w3(i6) {
    return new y3(i6);
  }
  function _3(i6) {
    var r5 = i6.u;
    i6.u = void 0;
    if ("function" == typeof r5) {
      s3++;
      var n4 = o3;
      o3 = void 0;
      try {
        r5();
      } catch (t5) {
        i6.f &= -2;
        i6.f |= 8;
        g3(i6);
        throw t5;
      } finally {
        o3 = n4;
        t3();
      }
    }
  }
  function g3(i6) {
    for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) t5.S.U(t5);
    i6.x = void 0;
    i6.s = void 0;
    _3(i6);
  }
  function p3(i6) {
    if (o3 !== this) throw new Error("Out-of-order effect");
    l3(this);
    o3 = i6;
    this.f &= -2;
    if (8 & this.f) g3(this);
    t3();
  }
  function b(i6) {
    this.x = i6;
    this.u = void 0;
    this.s = void 0;
    this.o = void 0;
    this.f = 32;
  }
  function E(i6) {
    var t5 = new b(i6);
    try {
      t5.c();
    } catch (i7) {
      t5.d();
      throw i7;
    }
    return t5.d.bind(t5);
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
      u3.prototype.S = function(i6) {
        if (this.t !== i6 && void 0 === i6.e) {
          i6.x = this.t;
          if (void 0 !== this.t) this.t.e = i6;
          this.t = i6;
        }
      };
      u3.prototype.U = function(i6) {
        if (void 0 !== this.t) {
          var t5 = i6.e, r5 = i6.x;
          if (void 0 !== t5) {
            t5.x = r5;
            i6.e = void 0;
          }
          if (void 0 !== r5) {
            r5.e = t5;
            i6.x = void 0;
          }
          if (i6 === this.t) this.t = r5;
        }
      };
      u3.prototype.subscribe = function(i6) {
        var t5 = this;
        return E(function() {
          var r5 = t5.value, n4 = o3;
          o3 = void 0;
          try {
            i6(r5);
          } finally {
            o3 = n4;
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
        var i6 = o3;
        o3 = void 0;
        try {
          return this.value;
        } finally {
          o3 = i6;
        }
      };
      Object.defineProperty(u3.prototype, "value", { get: function() {
        var i6 = e3(this);
        if (void 0 !== i6) i6.i = this.i;
        return this.v;
      }, set: function(i6) {
        if (i6 !== this.v) {
          if (f3 > 100) throw new Error("Cycle detected");
          this.v = i6;
          this.i++;
          v3++;
          s3++;
          try {
            for (var r5 = this.t; void 0 !== r5; r5 = r5.x) r5.t.N();
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
        var i6 = o3;
        try {
          a3(this);
          o3 = this;
          var t5 = this.x();
          if (16 & this.f || this.v !== t5 || 0 === this.i) {
            this.v = t5;
            this.f &= -17;
            this.i++;
          }
        } catch (i7) {
          this.v = i7;
          this.f |= 16;
          this.i++;
        }
        o3 = i6;
        l3(this);
        this.f &= -2;
        return true;
      };
      y3.prototype.S = function(i6) {
        if (void 0 === this.t) {
          this.f |= 36;
          for (var t5 = this.s; void 0 !== t5; t5 = t5.n) t5.S.S(t5);
        }
        u3.prototype.S.call(this, i6);
      };
      y3.prototype.U = function(i6) {
        if (void 0 !== this.t) {
          u3.prototype.U.call(this, i6);
          if (void 0 === this.t) {
            this.f &= -33;
            for (var t5 = this.s; void 0 !== t5; t5 = t5.n) t5.S.U(t5);
          }
        }
      };
      y3.prototype.N = function() {
        if (!(2 & this.f)) {
          this.f |= 6;
          for (var i6 = this.t; void 0 !== i6; i6 = i6.x) i6.t.N();
        }
      };
      Object.defineProperty(y3.prototype, "value", { get: function() {
        if (1 & this.f) throw new Error("Cycle detected");
        var i6 = e3(this);
        this.h();
        if (void 0 !== i6) i6.i = this.i;
        if (16 & this.f) throw this.v;
        return this.v;
      } });
      b.prototype.c = function() {
        var i6 = this.S();
        try {
          if (8 & this.f) return;
          if (void 0 === this.x) return;
          var t5 = this.x();
          if ("function" == typeof t5) this.u = t5;
        } finally {
          i6();
        }
      };
      b.prototype.S = function() {
        if (1 & this.f) throw new Error("Cycle detected");
        this.f |= 1;
        this.f &= -9;
        _3(this);
        a3(this);
        s3++;
        var i6 = o3;
        o3 = this;
        return p3.bind(this, i6);
      };
      b.prototype.N = function() {
        if (!(2 & this.f)) {
          this.f |= 2;
          this.o = h3;
          h3 = this;
        }
      };
      b.prototype.d = function() {
        this.f |= 8;
        if (!(1 & this.f)) g3(this);
      };
    }
  });

  // ../node_modules/@preact/signals/dist/signals.module.js
  function _4(i6, r5) {
    l[i6] = r5.bind(null, l[i6] || function() {
    });
  }
  function m3(i6) {
    if (l4) l4();
    l4 = i6 && i6.S();
  }
  function g4(i6) {
    var n4 = this, f5 = i6.data, o5 = useSignal(f5);
    o5.value = f5;
    var u5 = T2(function() {
      var i7 = n4, t5 = n4.__v;
      while (t5 = t5.__) if (t5.__c) {
        t5.__c.__$f |= 4;
        break;
      }
      var f6 = w3(function() {
        var i8 = o5.value.value;
        return 0 === i8 ? 0 : true === i8 ? "" : i8 || "";
      }), u6 = w3(function() {
        return !t(f6.value);
      }), c6 = E(function() {
        this.N = A3;
        if (u6.value) {
          var n5 = f6.value;
          if (i7.base && 3 === i7.base.nodeType) i7.base.data = n5;
        }
      }), v6 = n4.__$u.d;
      n4.__$u.d = function() {
        c6();
        v6.call(this);
      };
      return [u6, f6];
    }, []), c5 = u5[0], v5 = u5[1];
    return c5.value ? v5.peek() : v5.value;
  }
  function b2(i6, n4, r5, t5) {
    var f5 = n4 in i6 && void 0 === i6.ownerSVGElement, o5 = d3(r5);
    return { o: function(i7, n5) {
      o5.value = i7;
      t5 = n5;
    }, d: E(function() {
      this.N = A3;
      var r6 = o5.value.value;
      if (t5[n4] !== r6) {
        t5[n4] = r6;
        if (f5) i6[n4] = r6;
        else if (r6) i6.setAttribute(n4, r6);
        else i6.removeAttribute(n4);
      }
    }) };
  }
  function useSignal(i6) {
    return T2(function() {
      return d3(i6);
    }, []);
  }
  function useComputed(i6) {
    var n4 = A2(i6);
    n4.current = i6;
    h4.__$f |= 4;
    return T2(function() {
      return w3(function() {
        return n4.current();
      });
    }, []);
  }
  function q3() {
    r3(function() {
      var i6;
      while (i6 = d4.shift()) s4.call(i6);
    });
  }
  function w4() {
    if (1 === d4.push(this)) (l.requestAnimationFrame || y4)(q3);
  }
  function x3() {
    r3(function() {
      var i6;
      while (i6 = p4.shift()) s4.call(i6);
    });
  }
  function A3() {
    if (1 === p4.push(this)) (l.requestAnimationFrame || k3)(x3);
  }
  function useSignalEffect(i6) {
    var n4 = A2(i6);
    n4.current = i6;
    y2(function() {
      return E(function() {
        this.N = w4;
        return n4.current();
      });
    }, []);
  }
  var s4, h4, l4, d4, p4, y4, k3;
  var init_signals_module = __esm({
    "../node_modules/@preact/signals/dist/signals.module.js"() {
      init_preact_module();
      init_hooks_module();
      init_signals_core_module();
      init_signals_core_module();
      d4 = [];
      p4 = [];
      E(function() {
        s4 = this.N;
      })();
      g4.displayName = "_st";
      Object.defineProperties(u3.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: g4 }, props: { configurable: true, get: function() {
        return { data: this };
      } }, __b: { configurable: true, value: 1 } });
      _4("__b", function(i6, n4) {
        if ("string" == typeof n4.type) {
          var r5, t5 = n4.props;
          for (var f5 in t5) if ("children" !== f5) {
            var o5 = t5[f5];
            if (o5 instanceof u3) {
              if (!r5) n4.__np = r5 = {};
              r5[f5] = o5;
              t5[f5] = o5.peek();
            }
          }
        }
        i6(n4);
      });
      _4("__r", function(i6, n4) {
        m3();
        var r5, t5 = n4.__c;
        if (t5) {
          t5.__$f &= -2;
          if (void 0 === (r5 = t5.__$u)) t5.__$u = r5 = function(i7) {
            var n5;
            E(function() {
              n5 = this;
            });
            n5.c = function() {
              t5.__$f |= 1;
              t5.setState({});
            };
            return n5;
          }();
        }
        h4 = t5;
        m3(r5);
        i6(n4);
      });
      _4("__e", function(i6, n4, r5, t5) {
        m3();
        h4 = void 0;
        i6(n4, r5, t5);
      });
      _4("diffed", function(i6, n4) {
        m3();
        h4 = void 0;
        var r5;
        if ("string" == typeof n4.type && (r5 = n4.__e)) {
          var t5 = n4.__np, f5 = n4.props;
          if (t5) {
            var o5 = r5.U;
            if (o5) for (var e5 in o5) {
              var u5 = o5[e5];
              if (void 0 !== u5 && !(e5 in t5)) {
                u5.d();
                o5[e5] = void 0;
              }
            }
            else {
              o5 = {};
              r5.U = o5;
            }
            for (var a5 in t5) {
              var c5 = o5[a5], v5 = t5[a5];
              if (void 0 === c5) {
                c5 = b2(r5, a5, v5, f5);
                o5[a5] = c5;
              } else c5.o(v5, f5);
            }
          }
        }
        i6(n4);
      });
      _4("unmount", function(i6, n4) {
        if ("string" == typeof n4.type) {
          var r5 = n4.__e;
          if (r5) {
            var t5 = r5.U;
            if (t5) {
              r5.U = void 0;
              for (var f5 in t5) {
                var o5 = t5[f5];
                if (o5) o5.d();
              }
            }
          }
        } else {
          var e5 = n4.__c;
          if (e5) {
            var u5 = e5.__$u;
            if (u5) {
              e5.__$u = void 0;
              u5.d();
            }
          }
        }
        i6(n4);
      });
      _4("__h", function(i6, n4, r5, t5) {
        if (t5 < 3 || 9 === t5) n4.__$f |= 2;
        i6(n4, r5, t5);
      });
      x.prototype.shouldComponentUpdate = function(i6, n4) {
        var r5 = this.__$u, t5 = r5 && void 0 !== r5.s;
        for (var f5 in n4) return true;
        if (this.__f || "boolean" == typeof this.u && true === this.u) {
          var o5 = 2 & this.__$f;
          if (!(t5 || o5 || 4 & this.__$f)) return true;
          if (1 & this.__$f) return true;
        } else {
          if (!(t5 || 4 & this.__$f)) return true;
          if (3 & this.__$f) return true;
        }
        for (var e5 in i6) if ("__source" !== e5 && i6[e5] !== this.props[e5]) return true;
        for (var u5 in this.props) if (!(u5 in i6)) return true;
        return false;
      };
      y4 = "undefined" == typeof requestAnimationFrame ? setTimeout : requestAnimationFrame;
      k3 = function(i6) {
        queueMicrotask(function() {
          queueMicrotask(i6);
        });
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
    return /* @__PURE__ */ g(
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
      const matchingConfig = currentValues.value.find((x5) => x5.id === props.id);
      if (!matchingConfig) throw new Error("unreachable. Must find widget config via id: " + props.id);
      return matchingConfig.visibility;
    });
    return /* @__PURE__ */ g(
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
      WidgetConfigContext = J({
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
      WidgetConfigDispatchContext = J({
        dispatch: null
      });
      WidgetVisibilityContext = J({
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
    function t5(inputKey, replacements) {
      const subject = translationObject?.[inputKey]?.title || fallback?.[inputKey]?.title;
      return apply(subject, replacements, textLength);
    }
    return /* @__PURE__ */ g(TranslationContext.Provider, { value: { t: t5 } }, children);
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
        cleanupsCurr.forEach((fn2) => fn2());
      };
    }, [values2, str]);
    return /* @__PURE__ */ g("span", { ref, dangerouslySetInnerHTML: { __html: str } });
  }
  var TranslationContext;
  var init_TranslationsProvider = __esm({
    "shared/components/TranslationsProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_translations();
      TranslationContext = J({
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
      MessagingContext = J(
        /** @type {import("../src/index.js").NewTabPage} */
        {}
      );
      useMessaging = () => x2(MessagingContext);
      TelemetryContext = J(
        /** @type {import("./telemetry/telemetry.js").Telemetry} */
        {
          measureFromPageLoad: () => {
          }
        }
      );
      useTelemetry = () => x2(TelemetryContext);
      InitialSetupContext = J(
        /** @type {InitialSetupResponse} */
        {}
      );
      useInitialSetupData = () => x2(InitialSetupContext);
    }
  });

  // pages/new-tab/app/components/Layout.js
  function Centered({ children, ...rest }) {
    return /* @__PURE__ */ g("div", { ...rest, class: "layout-centered" }, children);
  }
  function VerticalSpace({ children, ...rest }) {
    return /* @__PURE__ */ g("div", { ...rest, class: "vertical-space" }, children);
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
    return /* @__PURE__ */ g("svg", { fill: "none", width: "16", height: "16", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
      "path",
      {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M3.293 7.793a1 1 0 0 0 0 1.414l8 8a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0-1.414-1.414L12 15.086 4.707 7.793a1 1 0 0 0-1.414 0Z",
        "clip-rule": "evenodd"
      }
    ));
  }
  function ChevronSmall() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M3.93057 6.51191C4.20014 6.19741 4.67361 6.16099 4.98811 6.43056L8.00001 9.01219L11.0119 6.43056C11.3264 6.16099 11.7999 6.19741 12.0695 6.51191C12.339 6.8264 12.3026 7.29988 11.9881 7.56944L8.48811 10.5694C8.20724 10.8102 7.79279 10.8102 7.51192 10.5694L4.01192 7.56944C3.69743 7.29988 3.661 6.8264 3.93057 6.51191Z",
        fill: "currentColor"
      }
    ));
  }
  function CustomizeIcon() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", class: Icons_default.customize }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M4.5 1C2.567 1 1 2.567 1 4.5C1 6.433 2.567 8 4.5 8C6.17556 8 7.57612 6.82259 7.91946 5.25H14.375C14.7202 5.25 15 4.97018 15 4.625C15 4.27982 14.7202 4 14.375 4H7.96456C7.72194 2.30385 6.26324 1 4.5 1ZM2.25 4.5C2.25 3.25736 3.25736 2.25 4.5 2.25C5.74264 2.25 6.75 3.25736 6.75 4.5C6.75 5.74264 5.74264 6.75 4.5 6.75C3.25736 6.75 2.25 5.74264 2.25 4.5Z",
        fill: "currentColor"
      }
    ), /* @__PURE__ */ g(
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
    return /* @__PURE__ */ g("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16" }, /* @__PURE__ */ g(
      "path",
      {
        "clip-rule": "evenodd",
        fill: "currentColor",
        d: "M6.483.612A2.13 2.13 0 0 1 7.998 0c.56.001 1.115.215 1.512.62.673.685 1.26 1.045 1.852 1.228.594.185 1.31.228 2.311.1a2.175 2.175 0 0 1 1.575.406c.452.34.746.862.75 1.445.033 3.782-.518 6.251-1.714 8.04-1.259 1.882-3.132 2.831-5.045 3.8l-.123.063-.003.001-.125.063a2.206 2.206 0 0 1-1.976 0l-.124-.063-.003-.001-.124-.063c-1.913-.969-3.786-1.918-5.045-3.8C.52 10.05-.031 7.58 0 3.798a1.83 1.83 0 0 1 .75-1.444 2.175 2.175 0 0 1 1.573-.407c1.007.127 1.725.076 2.32-.114.59-.189 1.172-.551 1.839-1.222Zm2.267 1.36v12.233c1.872-.952 3.311-1.741 4.287-3.2.949-1.42 1.493-3.529 1.462-7.194 0-.072-.037-.17-.152-.257a.677.677 0 0 0-.484-.118c-1.126.144-2.075.115-2.945-.155-.77-.239-1.47-.664-2.168-1.309Zm-1.5 12.233V1.955c-.69.635-1.383 1.063-2.15 1.308-.87.278-1.823.317-2.963.174a.677.677 0 0 0-.484.117c-.115.087-.151.186-.152.258-.03 3.664.513 5.774 1.462 7.192.976 1.46 2.415 2.249 4.287 3.201Z"
      }
    ));
  }
  function Shield() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
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
    return /* @__PURE__ */ g("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ g(
      "path",
      {
        d: "M11.4419 5.44194C11.686 5.19786 11.686 4.80214 11.4419 4.55806C11.1979 4.31398 10.8021 4.31398 10.5581 4.55806L8 7.11612L5.44194 4.55806C5.19786 4.31398 4.80214 4.31398 4.55806 4.55806C4.31398 4.80214 4.31398 5.19786 4.55806 5.44194L7.11612 8L4.55806 10.5581C4.31398 10.8021 4.31398 11.1979 4.55806 11.4419C4.80214 11.686 5.19786 11.686 5.44194 11.4419L8 8.88388L10.5581 11.4419C10.8021 11.686 11.1979 11.686 11.4419 11.4419C11.686 11.1979 11.686 10.8021 11.4419 10.5581L8.88388 8L11.4419 5.44194Z",
        fill: "currentColor"
      }
    ));
  }
  function CheckColor() {
    return /* @__PURE__ */ g("svg", { fill: "none", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g("path", { fill: "#4CBA3C", d: "M15.5 8a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0" }), /* @__PURE__ */ g(
      "path",
      {
        fill: "#fff",
        "fill-rule": "evenodd",
        d: "M11.844 5.137a.5.5 0 0 1 .019.707l-4.5 4.75a.5.5 0 0 1-.733-.008l-2.5-2.75a.5.5 0 0 1 .74-.672l2.138 2.351 4.129-4.359a.5.5 0 0 1 .707-.019",
        "clip-rule": "evenodd"
      }
    ), /* @__PURE__ */ g(
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
    return /* @__PURE__ */ g("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g("g", { "clip-path": "url(#clip0_1635_18497)" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM17.5737 9.25013C17.9189 8.86427 17.886 8.27159 17.5001 7.92635C17.1143 7.5811 16.5216 7.61403 16.1764 7.99989L10.5319 14.3084L7.85061 11.0313C7.52274 10.6306 6.9321 10.5716 6.53137 10.8994C6.13064 11.2273 6.07157 11.8179 6.39944 12.2187L9.77444 16.3437C9.94792 16.5557 10.2054 16.6812 10.4793 16.6873C10.7532 16.6933 11.016 16.5793 11.1987 16.3751L17.5737 9.25013Z",
        fill: "currentColor",
        "fill-opacity": "0.6"
      }
    )), /* @__PURE__ */ g("defs", null, /* @__PURE__ */ g("clipPath", { id: "clip0_1635_18497" }, /* @__PURE__ */ g("rect", { width: "24", height: "24", fill: "white" }))));
  }
  function Picker() {
    return /* @__PURE__ */ g("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
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
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ g(
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
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
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
        menuItemLabelEmbedded: "VisibilityMenu_menuItemLabelEmbedded",
        svg: "VisibilityMenu_svg",
        checkbox: "VisibilityMenu_checkbox",
        checkboxIcon: "VisibilityMenu_checkboxIcon"
      };
    }
  });

  // shared/components/Switch/Switch.module.css
  var Switch_default;
  var init_Switch = __esm({
    "shared/components/Switch/Switch.module.css"() {
      Switch_default = {
        label: "Switch_label",
        input: "Switch_input",
        switch: "Switch_switch"
      };
    }
  });

  // shared/components/Switch/Switch.js
  function Switch({ checked = false, platformName, size, theme, ...props }) {
    const { onChecked, onUnchecked, ariaLabel, pending } = props;
    function change(e5) {
      if (e5.target.checked === true) {
        onChecked();
      } else {
        onUnchecked();
      }
    }
    return /* @__PURE__ */ g("label", { class: Switch_default.label, "data-platform-name": platformName, "data-theme": theme, "data-size": size }, /* @__PURE__ */ g(
      "input",
      {
        disabled: pending,
        type: "checkbox",
        role: "switch",
        "aria-label": ariaLabel,
        class: Switch_default.input,
        checked,
        onChange: change
      }
    ), /* @__PURE__ */ g("span", { class: Switch_default.switch, style: "transition-duration: 130ms;transition-delay: 0ms;" }));
  }
  var init_Switch2 = __esm({
    "shared/components/Switch/Switch.js"() {
      "use strict";
      init_preact_module();
      init_Switch();
    }
  });

  // pages/new-tab/app/components/BackgroundReceiver.module.css
  var BackgroundReceiver_default;
  var init_BackgroundReceiver = __esm({
    "pages/new-tab/app/components/BackgroundReceiver.module.css"() {
      BackgroundReceiver_default = {
        root: "BackgroundReceiver_root",
        "fade-in": "BackgroundReceiver_fade-in"
      };
    }
  });

  // pages/new-tab/app/customizer/values.js
  var values;
  var init_values = __esm({
    "pages/new-tab/app/customizer/values.js"() {
      "use strict";
      values = {
        colors: {
          color01: { hex: "#000000", colorScheme: "dark" },
          color02: { hex: "#342e42", colorScheme: "dark" },
          color03: { hex: "#4d5f7f", colorScheme: "dark" },
          color04: { hex: "#9a979d", colorScheme: "dark" },
          color05: { hex: "#dbdddf", colorScheme: "light" },
          color06: { hex: "#577de4", colorScheme: "dark" },
          color07: { hex: "#75b9f0", colorScheme: "light" },
          color08: { hex: "#5552ac", colorScheme: "dark" },
          color09: { hex: "#b79ed4", colorScheme: "light" },
          color10: { hex: "#e4def2", colorScheme: "light" },
          color11: { hex: "#b5e2ce", colorScheme: "light" },
          color12: { hex: "#5bc787", colorScheme: "light" },
          color13: { hex: "#4594a7", colorScheme: "dark" },
          color14: { hex: "#e9dccd", colorScheme: "light" },
          color15: { hex: "#f3bb44", colorScheme: "light" },
          color16: { hex: "#e5724f", colorScheme: "light" },
          color17: { hex: "#d55154", colorScheme: "dark" },
          color18: { hex: "#f7dee5", colorScheme: "light" },
          color19: { hex: "#e28499", colorScheme: "light" }
        },
        gradients: {
          gradient01: { path: "gradients/gradient01.svg", fallback: "#f2e5d4", colorScheme: "light" },
          gradient02: { path: "gradients/gradient02.svg", fallback: "#d5bcd1", colorScheme: "light" },
          /**
           * Note: the following name `gradient02.01` is used to allow migration for existing macOS users.
           * When switching to the web-based NTP, we introduced an eight gradient to round-out the columns, but
           * the colors in the gradient meant it needed to be wedged in between 02 and 03.
           */
          "gradient02.01": { path: "gradients/gradient02.01.svg", fallback: "#f4ca78", colorScheme: "light" },
          gradient03: { path: "gradients/gradient03.svg", fallback: "#e6a356", colorScheme: "light" },
          gradient04: { path: "gradients/gradient04.svg", fallback: "#4448ae", colorScheme: "dark" },
          gradient05: { path: "gradients/gradient05.svg", fallback: "#a55778", colorScheme: "dark" },
          gradient06: { path: "gradients/gradient06.svg", fallback: "#222566", colorScheme: "dark" },
          gradient07: { path: "gradients/gradient07.svg", fallback: "#0e0e3d", colorScheme: "dark" }
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
    }
  });

  // pages/new-tab/app/customizer/utils.js
  function detectThemeFromHex(backgroundColor) {
    const hex = backgroundColor.replace("#", "");
    const r5 = parseInt(hex.slice(0, 2), 16);
    const g7 = parseInt(hex.slice(2, 4), 16);
    const b5 = parseInt(hex.slice(4, 6), 16);
    const luminance = 0.2126 * r5 + 0.7152 * g7 + 0.0722 * b5;
    return luminance < 128 ? "dark" : "light";
  }
  var init_utils = __esm({
    "pages/new-tab/app/customizer/utils.js"() {
      "use strict";
    }
  });

  // ../node_modules/preact/compat/dist/compat.module.js
  function g5(n4, t5) {
    for (var e5 in t5) n4[e5] = t5[e5];
    return n4;
  }
  function E3(n4, t5) {
    for (var e5 in n4) if ("__source" !== e5 && !(e5 in t5)) return true;
    for (var r5 in t5) if ("__source" !== r5 && n4[r5] !== t5[r5]) return true;
    return false;
  }
  function N2(n4, t5) {
    this.props = n4, this.context = t5;
  }
  function M2(n4, e5) {
    function r5(n5) {
      var t5 = this.props.ref, r6 = t5 == n5.ref;
      return !r6 && t5 && (t5.call ? t5(null) : t5.current = null), e5 ? !e5(this.props, n5) || !r6 : E3(this.props, n5);
    }
    function u5(e6) {
      return this.shouldComponentUpdate = r5, g(n4, e6);
    }
    return u5.displayName = "Memo(" + (n4.displayName || n4.name) + ")", u5.prototype.isReactComponent = true, u5.__f = true, u5;
  }
  function V2(n4, t5, e5) {
    return n4 && (n4.__c && n4.__c.__H && (n4.__c.__H.__.forEach(function(n5) {
      "function" == typeof n5.__c && n5.__c();
    }), n4.__c.__H = null), null != (n4 = g5({}, n4)).__c && (n4.__c.__P === e5 && (n4.__c.__P = t5), n4.__c = null), n4.__k = n4.__k && n4.__k.map(function(n5) {
      return V2(n5, t5, e5);
    })), n4;
  }
  function W(n4, t5, e5) {
    return n4 && e5 && (n4.__v = null, n4.__k = n4.__k && n4.__k.map(function(n5) {
      return W(n5, t5, e5);
    }), n4.__c && n4.__c.__P === t5 && (n4.__e && e5.appendChild(n4.__e), n4.__c.__e = true, n4.__c.__P = e5)), n4;
  }
  function P3() {
    this.__u = 0, this.o = null, this.__b = null;
  }
  function j3(n4) {
    var t5 = n4.__.__c;
    return t5 && t5.__a && t5.__a(n4);
  }
  function z3(n4) {
    var e5, r5, u5;
    function o5(o6) {
      if (e5 || (e5 = n4()).then(function(n5) {
        r5 = n5.default || n5;
      }, function(n5) {
        u5 = n5;
      }), u5) throw u5;
      if (!r5) throw e5;
      return g(r5, o6);
    }
    return o5.displayName = "Lazy", o5.__f = true, o5;
  }
  function B3() {
    this.i = null, this.l = null;
  }
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  var T3, A4, F3, U, H2, q4, G2, J2, K, Q, X, en, cn, ln, fn, an, sn;
  var init_compat_module = __esm({
    "../node_modules/preact/compat/dist/compat.module.js"() {
      init_preact_module();
      init_preact_module();
      init_hooks_module();
      init_hooks_module();
      (N2.prototype = new x()).isPureReactComponent = true, N2.prototype.shouldComponentUpdate = function(n4, t5) {
        return E3(this.props, n4) || E3(this.state, t5);
      };
      T3 = l.__b;
      l.__b = function(n4) {
        n4.type && n4.type.__f && n4.ref && (n4.props.ref = n4.ref, n4.ref = null), T3 && T3(n4);
      };
      A4 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
      F3 = l.__e;
      l.__e = function(n4, t5, e5, r5) {
        if (n4.then) {
          for (var u5, o5 = t5; o5 = o5.__; ) if ((u5 = o5.__c) && u5.__c) return null == t5.__e && (t5.__e = e5.__e, t5.__k = e5.__k), u5.__c(n4, t5);
        }
        F3(n4, t5, e5, r5);
      };
      U = l.unmount;
      l.unmount = function(n4) {
        var t5 = n4.__c;
        t5 && t5.__R && t5.__R(), t5 && 32 & n4.__u && (n4.type = null), U && U(n4);
      }, (P3.prototype = new x()).__c = function(n4, t5) {
        var e5 = t5.__c, r5 = this;
        null == r5.o && (r5.o = []), r5.o.push(e5);
        var u5 = j3(r5.__v), o5 = false, i6 = function() {
          o5 || (o5 = true, e5.__R = null, u5 ? u5(c5) : c5());
        };
        e5.__R = i6;
        var c5 = function() {
          if (!--r5.__u) {
            if (r5.state.__a) {
              var n5 = r5.state.__a;
              r5.__v.__k[0] = W(n5, n5.__c.__P, n5.__c.__O);
            }
            var t6;
            for (r5.setState({ __a: r5.__b = null }); t6 = r5.o.pop(); ) t6.forceUpdate();
          }
        };
        r5.__u++ || 32 & t5.__u || r5.setState({ __a: r5.__b = r5.__v.__k[0] }), n4.then(i6, i6);
      }, P3.prototype.componentWillUnmount = function() {
        this.o = [];
      }, P3.prototype.render = function(n4, e5) {
        if (this.__b) {
          if (this.__v.__k) {
            var r5 = document.createElement("div"), o5 = this.__v.__k[0].__c;
            this.__v.__k[0] = V2(this.__b, r5, o5.__O = o5.__P);
          }
          this.__b = null;
        }
        var i6 = e5.__a && g(k, null, n4.fallback);
        return i6 && (i6.__u &= -33), [g(k, null, e5.__a ? null : n4.children), i6];
      };
      H2 = function(n4, t5, e5) {
        if (++e5[1] === e5[0] && n4.l.delete(t5), n4.props.revealOrder && ("t" !== n4.props.revealOrder[0] || !n4.l.size)) for (e5 = n4.i; e5; ) {
          for (; e5.length > 3; ) e5.pop()();
          if (e5[1] < e5[0]) break;
          n4.i = e5 = e5[2];
        }
      };
      (B3.prototype = new x()).__a = function(n4) {
        var t5 = this, e5 = j3(t5.__v), r5 = t5.l.get(n4);
        return r5[0]++, function(u5) {
          var o5 = function() {
            t5.props.revealOrder ? (r5.push(u5), H2(t5, n4, r5)) : u5();
          };
          e5 ? e5(o5) : o5();
        };
      }, B3.prototype.render = function(n4) {
        this.i = null, this.l = /* @__PURE__ */ new Map();
        var t5 = H(n4.children);
        n4.revealOrder && "b" === n4.revealOrder[0] && t5.reverse();
        for (var e5 = t5.length; e5--; ) this.l.set(t5[e5], this.i = [1, 0, this.i]);
        return n4.children;
      }, B3.prototype.componentDidUpdate = B3.prototype.componentDidMount = function() {
        var n4 = this;
        this.l.forEach(function(t5, e5) {
          H2(n4, e5, t5);
        });
      };
      q4 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;
      G2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
      J2 = /^on(Ani|Tra|Tou|BeforeInp|Compo)/;
      K = /[A-Z0-9]/g;
      Q = "undefined" != typeof document;
      X = function(n4) {
        return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n4);
      };
      x.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t5) {
        Object.defineProperty(x.prototype, t5, { configurable: true, get: function() {
          return this["UNSAFE_" + t5];
        }, set: function(n4) {
          Object.defineProperty(this, t5, { configurable: true, writable: true, value: n4 });
        } });
      });
      en = l.event;
      l.event = function(n4) {
        return en && (n4 = en(n4)), n4.persist = rn, n4.isPropagationStopped = un, n4.isDefaultPrevented = on, n4.nativeEvent = n4;
      };
      ln = { enumerable: false, configurable: true, get: function() {
        return this.class;
      } };
      fn = l.vnode;
      l.vnode = function(n4) {
        "string" == typeof n4.type && function(n5) {
          var t5 = n5.props, e5 = n5.type, u5 = {}, o5 = -1 === e5.indexOf("-");
          for (var i6 in t5) {
            var c5 = t5[i6];
            if (!("value" === i6 && "defaultValue" in t5 && null == c5 || Q && "children" === i6 && "noscript" === e5 || "class" === i6 || "className" === i6)) {
              var l6 = i6.toLowerCase();
              "defaultValue" === i6 && "value" in t5 && null == t5.value ? i6 = "value" : "download" === i6 && true === c5 ? c5 = "" : "translate" === l6 && "no" === c5 ? c5 = false : "o" === l6[0] && "n" === l6[1] ? "ondoubleclick" === l6 ? i6 = "ondblclick" : "onchange" !== l6 || "input" !== e5 && "textarea" !== e5 || X(t5.type) ? "onfocus" === l6 ? i6 = "onfocusin" : "onblur" === l6 ? i6 = "onfocusout" : J2.test(i6) && (i6 = l6) : l6 = i6 = "oninput" : o5 && G2.test(i6) ? i6 = i6.replace(K, "-$&").toLowerCase() : null === c5 && (c5 = void 0), "oninput" === l6 && u5[i6 = l6] && (i6 = "oninputCapture"), u5[i6] = c5;
            }
          }
          "select" == e5 && u5.multiple && Array.isArray(u5.value) && (u5.value = H(t5.children).forEach(function(n6) {
            n6.props.selected = -1 != u5.value.indexOf(n6.props.value);
          })), "select" == e5 && null != u5.defaultValue && (u5.value = H(t5.children).forEach(function(n6) {
            n6.props.selected = u5.multiple ? -1 != u5.defaultValue.indexOf(n6.props.value) : u5.defaultValue == n6.props.value;
          })), t5.class && !t5.className ? (u5.class = t5.class, Object.defineProperty(u5, "className", ln)) : (t5.className && !t5.class || t5.class && t5.className) && (u5.class = u5.className = t5.className), n5.props = u5;
        }(n4), n4.$$typeof = q4, fn && fn(n4);
      };
      an = l.__r;
      l.__r = function(n4) {
        an && an(n4), cn = n4.__c;
      };
      sn = l.diffed;
      l.diffed = function(n4) {
        sn && sn(n4);
        var t5 = n4.props, e5 = n4.__e;
        null != e5 && "textarea" === n4.type && "value" in t5 && t5.value !== e5.value && (e5.value = null == t5.value ? "" : t5.value), cn = null;
      };
    }
  });

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
    useSignalEffect(() => {
      const background2 = data.value.background;
      document.body.dataset.backgroundKind = background2.kind;
      let nextBodyBackground = "";
      if (background2.kind === "gradient") {
        const gradient = values.gradients[background2.value];
        nextBodyBackground = gradient.fallback;
      }
      if (background2.kind === "color") {
        const color = values.colors[background2.value];
        nextBodyBackground = color.hex;
      }
      if (background2.kind === "hex") {
        nextBodyBackground = background2.value;
      }
      if (background2.kind === "userImage") {
        const isDark = background2.value.colorScheme === "dark";
        nextBodyBackground = isDark ? "var(--default-dark-bg)" : "var(--default-light-bg)";
      }
      if (background2.kind === "default") {
        nextBodyBackground = browser.value === "dark" ? "var(--default-dark-bg)" : "var(--default-light-bg)";
      }
      document.body.style.setProperty("background-color", nextBodyBackground);
      if (!document.body.dataset.animateBackground) {
        requestAnimationFrame(() => {
          document.body.dataset.animateBackground = "true";
        });
      }
    });
    switch (background.kind) {
      case "color":
      case "default":
      case "hex": {
        return null;
      }
      case "userImage": {
        const img = background.value;
        return /* @__PURE__ */ g(ImageCrossFade, { src: img.src });
      }
      case "gradient": {
        const gradient = values.gradients[background.value];
        return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(ImageCrossFade, { src: gradient.path }), /* @__PURE__ */ g(
          "div",
          {
            className: BackgroundReceiver_default.root,
            style: {
              backgroundImage: `url(gradients/grain.png)`,
              backgroundRepeat: "repeat",
              opacity: 0.5,
              mixBlendMode: "soft-light"
            }
          }
        ));
      }
      default: {
        console.warn("Unreachable!");
        return null;
      }
    }
  }
  function ImageCrossFade_({ src }) {
    const [state, setState] = h2({
      /** @type {ImgState} */
      value: states.idle,
      current: src,
      next: src
    });
    y2(() => {
      let img = new Image();
      let cancelled = false;
      setState((prev) => {
        const nextState = prev.value === states.idle ? states.loadingFirst : states.loading;
        return { ...prev, value: nextState };
      });
      let handler = () => {
        if (cancelled) return;
        setState((prev) => {
          if (prev.value === states.loading) {
            return { ...prev, value: states.fading, next: src };
          }
          return prev;
        });
      };
      img.addEventListener("load", handler);
      img.src = src;
      return () => {
        cancelled = true;
        if (img && handler) {
          img.removeEventListener("load", handler);
          img = void 0;
          handler = void 0;
        }
      };
    }, [src]);
    switch (state.value) {
      case states.settled:
      case states.loadingFirst:
        return /* @__PURE__ */ g("img", { class: BackgroundReceiver_default.root, "data-state": state.value, src: state.current, alt: "" });
      case states.loading:
      case states.fading:
        return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("img", { class: BackgroundReceiver_default.root, "data-state": state.value, src: state.current, alt: "" }), /* @__PURE__ */ g(
          "img",
          {
            class: BackgroundReceiver_default.root,
            "data-state": state.value,
            src: state.next,
            onLoad: (e5) => {
              const elem = (
                /** @type {HTMLImageElement} */
                e5.target
              );
              elem.style.opacity = "0";
              const anim = elem.animate([{ opacity: "0" }, { opacity: "1" }], {
                duration: 250,
                iterations: 1,
                fill: "both"
              });
              anim.onfinish = () => {
                setState((prev) => {
                  return { ...prev, value: states.settled, current: prev.next, next: prev.next };
                });
              };
            }
          }
        ));
      default:
        return null;
    }
  }
  var states, ImageCrossFade;
  var init_BackgroundProvider = __esm({
    "pages/new-tab/app/components/BackgroundProvider.js"() {
      "use strict";
      init_preact_module();
      init_BackgroundReceiver();
      init_values();
      init_hooks_module();
      init_CustomizerProvider();
      init_utils();
      init_signals_module();
      init_compat_module();
      states = {
        idle: "idle",
        loadingFirst: "loadingFirst",
        loading: "loading",
        fading: "fading",
        settled: "settled"
      };
      ImageCrossFade = M2(ImageCrossFade_);
    }
  });

  // pages/new-tab/app/customizer/themes.js
  function useThemes(data) {
    const mq = useSignal(mediaQueryList.matches ? "dark" : "light");
    useSignalEffect(() => {
      const listener = (e5) => {
        mq.value = e5.matches ? "dark" : "light";
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
  var THEME_QUERY, mediaQueryList;
  var init_themes = __esm({
    "pages/new-tab/app/customizer/themes.js"() {
      "use strict";
      init_signals_module();
      init_BackgroundProvider();
      THEME_QUERY = "(prefers-color-scheme: dark)";
      mediaQueryList = window.matchMedia(THEME_QUERY);
    }
  });

  // pages/new-tab/app/customizer/CustomizerProvider.js
  function CustomizerProvider({ service, initialData, children }) {
    const data = useSignal(initialData);
    const { main, browser } = useThemes(data);
    useSignalEffect(() => {
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
    const customizerContextMenu = q2((params) => service.contextMenu(params), [service]);
    return /* @__PURE__ */ g(CustomizerContext.Provider, { value: { data, select, upload, setTheme, deleteImage, customizerContextMenu } }, /* @__PURE__ */ g(CustomizerThemesContext.Provider, { value: { main, browser } }, children));
  }
  var CustomizerThemesContext, CustomizerContext;
  var init_CustomizerProvider = __esm({
    "pages/new-tab/app/customizer/CustomizerProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_signals_module();
      init_themes();
      CustomizerThemesContext = J({
        /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
        main: d3("light"),
        /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
        browser: d3("light")
      });
      CustomizerContext = J({
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
        },
        /**
         * @param {UserImageContextMenu} params
         */
        customizerContextMenu: (params) => {
        }
      });
    }
  });

  // pages/new-tab/app/customizer/components/VisibilityMenu.js
  function VisibilityMenu({ rows }) {
    const MENU_ID = g2();
    return /* @__PURE__ */ g("ul", { className: (0, import_classnames.default)(VisibilityMenu_default.list) }, rows.map((row) => {
      return /* @__PURE__ */ g("li", { key: row.id }, /* @__PURE__ */ g("label", { className: VisibilityMenu_default.menuItemLabel, htmlFor: MENU_ID + row.id }, /* @__PURE__ */ g(
        "input",
        {
          type: "checkbox",
          checked: row.visibility === "visible",
          onChange: () => row.toggle?.(row.id),
          id: MENU_ID + row.id,
          class: VisibilityMenu_default.checkbox
        }
      ), /* @__PURE__ */ g("span", { "aria-hidden": true, className: VisibilityMenu_default.checkboxIcon }, row.visibility === "visible" && /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
        "path",
        {
          d: "M3.5 9L6 11.5L12.5 5",
          stroke: "white",
          "stroke-width": "1.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }
      ))), /* @__PURE__ */ g("span", { className: VisibilityMenu_default.svg }, row.icon === "shield" && /* @__PURE__ */ g(DuckFoot, null), row.icon === "star" && /* @__PURE__ */ g(Shield, null)), /* @__PURE__ */ g("span", null, row.title ?? row.id)));
    }));
  }
  function EmbeddedVisibilityMenu({ rows }) {
    const platformName = usePlatformName();
    const { browser } = x2(CustomizerThemesContext);
    return /* @__PURE__ */ g("ul", { className: (0, import_classnames.default)(VisibilityMenu_default.list, VisibilityMenu_default.embedded) }, rows.map((row) => {
      return /* @__PURE__ */ g("li", { key: row.id }, /* @__PURE__ */ g("div", { class: (0, import_classnames.default)(VisibilityMenu_default.menuItemLabel, VisibilityMenu_default.menuItemLabelEmbedded) }, /* @__PURE__ */ g("span", { className: VisibilityMenu_default.svg }, row.icon === "shield" && /* @__PURE__ */ g(DuckFoot, null), row.icon === "star" && /* @__PURE__ */ g(Shield, null)), /* @__PURE__ */ g("span", null, row.title ?? row.id), /* @__PURE__ */ g(
        Switch,
        {
          theme: browser.value,
          platformName,
          checked: row.visibility === "visible",
          size: "medium",
          onChecked: () => row.toggle?.(row.id),
          onUnchecked: () => row.toggle?.(row.id),
          ariaLabel: `Toggle ${row.title}`,
          pending: false
        }
      )));
    }));
  }
  function VisibilityMenuPopover({ children }) {
    return /* @__PURE__ */ g("div", { className: VisibilityMenu_default.dropdownInner }, children);
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
      init_Switch2();
      init_settings_provider();
      init_CustomizerProvider();
    }
  });

  // pages/new-tab/app/customizer/components/CustomizerMenu.js
  function CustomizerMenu() {
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
      window.addEventListener(CustomizerMenu.UPDATE_EVENT, handler);
      return () => {
        window.removeEventListener(CustomizerMenu.UPDATE_EVENT, handler);
      };
    }, [isOpen]);
    const MENU_ID = g2();
    const BUTTON_ID = g2();
    return /* @__PURE__ */ g("div", { class: Customizer_default.root, ref: dropdownRef }, /* @__PURE__ */ g(
      CustomizerButton,
      {
        buttonId: BUTTON_ID,
        menuId: MENU_ID,
        toggleMenu,
        buttonRef,
        isOpen,
        kind: "menu"
      }
    ), /* @__PURE__ */ g("div", { id: MENU_ID, class: (0, import_classnames2.default)(Customizer_default.dropdownMenu, { [Customizer_default.show]: isOpen }), "aria-labelledby": BUTTON_ID }, /* @__PURE__ */ g(VisibilityMenuPopover, null, /* @__PURE__ */ g(VisibilityMenu, { rows: rowData }))));
  }
  function getItems() {
    const next = [];
    const detail = {
      register: (incoming) => {
        next.push(incoming);
      }
    };
    const event = new CustomEvent(CustomizerMenu.OPEN_EVENT, { detail });
    window.dispatchEvent(event);
    next.sort((a5, b5) => a5.index - b5.index);
    return next;
  }
  function useContextMenu() {
    const messaging2 = useMessaging();
    y2(() => {
      function handler(e5) {
        e5.preventDefault();
        e5.stopImmediatePropagation();
        const items = getItems();
        const simplified = items.filter((x5) => x5.id !== "debug").map((item) => {
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
  function CustomizerButton({ menuId, buttonId, isOpen, toggleMenu, buttonRef, kind }) {
    const { t: t5 } = useTypedTranslation();
    return /* @__PURE__ */ g(
      "button",
      {
        ref: buttonRef,
        class: Customizer_default.customizeButton,
        onClick: toggleMenu,
        "aria-haspopup": "true",
        "aria-expanded": isOpen,
        "aria-controls": menuId,
        "data-kind": kind,
        id: buttonId
      },
      /* @__PURE__ */ g(CustomizeIcon, null),
      /* @__PURE__ */ g("span", null, t5("ntp_customizer_button"))
    );
  }
  function CustomizerMenuPositionedFixed({ children }) {
    return /* @__PURE__ */ g("div", { class: Customizer_default.lowerRightFixed }, children);
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
      const handler = (e5) => {
        e5.detail.register({ title, id, icon, toggle, visibility, index });
      };
      window.addEventListener(CustomizerMenu.OPEN_EVENT, handler);
      return () => window.removeEventListener(CustomizerMenu.OPEN_EVENT, handler);
    }, [title, id, icon, toggle, visibility, index]);
    y2(() => {
      window.dispatchEvent(new Event(CustomizerMenu.UPDATE_EVENT));
    }, [visibility]);
  }
  var import_classnames2;
  var init_CustomizerMenu = __esm({
    "pages/new-tab/app/customizer/components/CustomizerMenu.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_Customizer();
      init_Icons2();
      import_classnames2 = __toESM(require_classnames(), 1);
      init_types();
      init_VisibilityMenu2();
      CustomizerMenu.OPEN_EVENT = "ntp-customizer-open";
      CustomizerMenu.UPDATE_EVENT = "ntp-customizer-update";
    }
  });

  // shared/components/EnvironmentProvider.js
  function EnvironmentProvider({ children, debugState, env = "production", willThrow = false, injectName = "windows" }) {
    const [theme, setTheme] = h2(window.matchMedia(THEME_QUERY2).matches ? "dark" : "light");
    const [isReducedMotion, setReducedMotion] = h2(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    y2(() => {
      const mediaQueryList2 = window.matchMedia(THEME_QUERY2);
      const listener = (e5) => setTheme(e5.matches ? "dark" : "light");
      mediaQueryList2.addEventListener("change", listener);
      return () => mediaQueryList2.removeEventListener("change", listener);
    }, []);
    y2(() => {
      const mediaQueryList2 = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e5) => setter(e5.matches);
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
    return /* @__PURE__ */ g(
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
  var EnvironmentContext, THEME_QUERY2, REDUCED_MOTION_QUERY;
  var init_EnvironmentProvider = __esm({
    "shared/components/EnvironmentProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      EnvironmentContext = J({
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
      THEME_QUERY2 = "(prefers-color-scheme: dark)";
      REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
    }
  });

  // pages/new-tab/app/activity/components/Activity.module.css
  var Activity_default;
  var init_Activity = __esm({
    "pages/new-tab/app/activity/components/Activity.module.css"() {
      Activity_default = {
        root: "Activity_root",
        listExpander: "Activity_listExpander",
        activity: "Activity_activity",
        anim: "Activity_anim",
        item: "Activity_item",
        burning: "Activity_burning",
        heading: "Activity_heading",
        favicon: "Activity_favicon",
        title: "Activity_title",
        controls: "Activity_controls",
        icon: "Activity_icon",
        controlIcon: "Activity_controlIcon",
        disableWhenBusy: "Activity_disableWhenBusy",
        body: "Activity_body",
        otherIcon: "Activity_otherIcon",
        companiesIconRow: "Activity_companiesIconRow",
        companiesIcons: "Activity_companiesIcons",
        companiesText: "Activity_companiesText",
        history: "Activity_history",
        historyItem: "Activity_historyItem",
        historyLink: "Activity_historyLink",
        time: "Activity_time",
        historyBtn: "Activity_historyBtn",
        activityHeading: "Activity_activityHeading"
      };
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
        _broadcast = true;
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
         * @return {Promise<Data>}
         */
        async triggerFetch() {
          if (!this.impl.initial) throw new Error("unreachable");
          const next = await this.impl.initial();
          this._accept(next, "trigger-fetch");
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
        disableBroadcast() {
          this._broadcast = false;
        }
        enableBroadcast() {
          this._broadcast = true;
        }
        flush() {
          if (this.data) this._accept(this.data, "manual");
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
         * @param {'initial' | 'subscription' | 'manual' | 'trigger-fetch'} source
         * @private
         */
        _accept(data, source) {
          this.data = /** @type {NonNullable<Data>} */
          data;
          if (source === "initial") return;
          this.clearDebounceTimer();
          if (!this._broadcast) return console.warn("not broadcasting");
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

  // pages/new-tab/app/activity/activity.service.js
  var ActivityService;
  var init_activity_service = __esm({
    "pages/new-tab/app/activity/activity.service.js"() {
      "use strict";
      init_service();
      ActivityService = class {
        /**
         * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
         * @internal
         */
        constructor(ntp) {
          this.ntp = ntp;
          this.dataService = new Service({
            initial: () => ntp.messaging.request("activity_getData"),
            subscribe: (cb) => ntp.messaging.subscribe("activity_onDataUpdate", cb)
          });
          this.configService = new Service({
            initial: () => ntp.messaging.request("activity_getConfig"),
            subscribe: (cb) => ntp.messaging.subscribe("activity_onConfigUpdate", cb),
            persist: (data) => ntp.messaging.notify("activity_setConfig", data)
          });
          this.burns = new EventTarget();
          this.burnUnsub = this.ntp.messaging.subscribe("activity_onBurnComplete", () => {
            this.burns?.dispatchEvent(new CustomEvent("activity_onBurnComplete"));
          });
        }
        name() {
          return "ActivityService";
        }
        /**
         * @returns {Promise<{data: ActivityData; config: ActivityConfig}>}
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
          this.burnUnsub();
          this.burns = null;
        }
        /**
         * @param {(evt: {data: ActivityData, source: 'manual' | 'subscription'}) => void} cb
         * @internal
         */
        onData(cb) {
          return this.dataService.onData(cb);
        }
        triggerDataFetch() {
          return this.dataService.triggerFetch();
        }
        /**
         * @param {(evt: {data: ActivityConfig, source: 'manual' | 'subscription'}) => void} cb
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
         * @param {string} url
         */
        addFavorite(url5) {
          this.dataService.update((old) => {
            return {
              ...old,
              activity: old.activity.map((item) => {
                if (item.url === url5) return { ...item, favorite: true };
                return item;
              })
            };
          });
          this.ntp.messaging.notify("activity_addFavorite", { url: url5 });
        }
        /**
         * @param {string} url
         */
        removeFavorite(url5) {
          this.dataService.update((old) => {
            return {
              ...old,
              activity: old.activity.map((item) => {
                if (item.url === url5) return { ...item, favorite: false };
                return item;
              })
            };
          });
          this.ntp.messaging.notify("activity_removeFavorite", { url: url5 });
        }
        /**
         * @param {string} url
         * @return {Promise<import('../../types/new-tab.js').ConfirmBurnResponse>}
         */
        confirmBurn(url5) {
          return this.ntp.messaging.request("activity_confirmBurn", { url: url5 });
        }
        /**
         * @param {string} url
         */
        remove(url5) {
          this.dataService.update((old) => {
            return {
              ...old,
              activity: old.activity.filter((item) => {
                return item.url !== url5;
              })
            };
          });
          this.ntp.messaging.notify("activity_removeItem", { url: url5 });
        }
        /**
         * @param {string} url
         * @param {import('../../types/new-tab.js').OpenTarget} target
         */
        openUrl(url5, target) {
          this.ntp.messaging.notify("activity_open", { url: url5, target });
        }
        onBurnComplete(cb) {
          if (!this.burns) throw new Error("unreachable");
          this.burns.addEventListener("activity_onBurnComplete", cb);
          return () => {
            if (!this.burns) throw new Error("unreachable");
            this.burns.removeEventListener("activity_onBurnComplete", cb);
          };
        }
        enableBroadcast() {
          this.dataService.enableBroadcast();
          this.dataService.flush();
        }
        disableBroadcast() {
          this.dataService.disableBroadcast();
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
      init2().catch((e5) => {
        console.error("uncaught error", e5);
        dispatch({ kind: "error", error: e5 });
        messaging2.reportPageException({ message: `${currentService.name()}: failed to fetch initial data+config: ` + e5.message });
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
      init2().catch((e5) => {
        console.error("uncaught error", e5);
        dispatch({ kind: "error", error: e5 });
        messaging2.reportPageException({ message: `${currentService.name()}: failed to fetch initial data: ` + e5.message });
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

  // pages/new-tab/app/utils.js
  function viewTransition(fn2) {
    if ("startViewTransition" in document && typeof document.startViewTransition === "function") {
      return document.startViewTransition(fn2);
    }
    return fn2();
  }
  function noop(named) {
    return () => {
      console.log(named, "noop");
    };
  }
  function eventToTarget(event, platformName) {
    const isControlClick = platformName === "macos" ? event.metaKey : event.ctrlKey;
    if (isControlClick) {
      return "new-tab";
    } else if (event.shiftKey || event.button === 1) {
      return "new-window";
    }
    return "same-tab";
  }
  function useDocumentVisibility() {
    const initial = document.visibilityState;
    const [documentVisibility, setDocumentVisibility] = h2(
      /** @type {Document['visibilityState']} */
      initial
    );
    y2(() => {
      const handleVisibilityChange = () => {
        setDocumentVisibility(document.visibilityState);
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, []);
    return documentVisibility;
  }
  function useOnMiddleClick(ref, handler) {
    y2(() => {
      const element = ref.current;
      if (!element) return;
      const handleAuxClick = (event) => event.button === 1 && handler(event);
      element.addEventListener("auxclick", handleAuxClick);
      return () => {
        element.removeEventListener("auxclick", handleAuxClick);
      };
    }, [ref, handler]);
  }
  var init_utils2 = __esm({
    "pages/new-tab/app/utils.js"() {
      "use strict";
      init_hooks_module();
    }
  });

  // pages/new-tab/app/activity/constants.js
  var ACTION_ADD_FAVORITE, ACTION_REMOVE_FAVORITE, ACTION_BURN, ACTION_REMOVE;
  var init_constants = __esm({
    "pages/new-tab/app/activity/constants.js"() {
      "use strict";
      ACTION_ADD_FAVORITE = "add-favorite";
      ACTION_REMOVE_FAVORITE = "remove-favorite";
      ACTION_BURN = "burn";
      ACTION_REMOVE = "remove";
    }
  });

  // pages/new-tab/app/favorites/constants.js
  var DDG_MIME_TYPE, DDG_FALLBACK_ICON, DDG_FALLBACK_ICON_DARK, DDG_DEFAULT_ICON_SIZE;
  var init_constants2 = __esm({
    "pages/new-tab/app/favorites/constants.js"() {
      "use strict";
      DDG_MIME_TYPE = "application/vnd.duckduckgo.bookmark-by-id";
      DDG_FALLBACK_ICON = "./company-icons/other.svg";
      DDG_FALLBACK_ICON_DARK = "./company-icons/other-dark.svg";
      DDG_DEFAULT_ICON_SIZE = 64;
    }
  });

  // pages/new-tab/app/activity/ActivityProvider.js
  function ActivityProvider(props) {
    const initial = (
      /** @type {State} */
      {
        status: "idle",
        data: null,
        config: null
      }
    );
    const [state, dispatch] = p2(reducer, initial);
    const platformName = usePlatformName();
    const service = useService();
    useInitialDataAndConfig({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    function didClick_(event) {
      const target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      if (!target) return;
      if (!service.current) return;
      const anchor = (
        /** @type {HTMLAnchorElement|null} */
        target.closest("a[href][data-url]")
      );
      if (anchor) {
        const url5 = anchor.dataset.url;
        if (!url5) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const openTarget = eventToTarget(event, platformName);
        service.current.openUrl(url5, openTarget);
      } else {
        const button = (
          /** @type {HTMLButtonElement|null} */
          target.closest("button[value][data-action]")
        );
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const action = button.dataset.action;
        const value = button.value;
        if (!action) return console.warn('expected clicked button to have data-action="<value>"');
        if (typeof value !== "string") return console.warn("expected clicked button to have a value");
        if (action === ACTION_ADD_FAVORITE) {
          service.current.addFavorite(button.value);
        } else if (action === ACTION_REMOVE_FAVORITE) {
          service.current.removeFavorite(button.value);
        } else if (action === ACTION_BURN) {
        } else if (action === ACTION_REMOVE) {
          service.current.remove(button.value);
        } else {
          console.warn("unhandled action:", action);
        }
      }
    }
    const didClick = q2(didClick_, []);
    return /* @__PURE__ */ g(ActivityContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ g(ActivityServiceContext.Provider, { value: service.current }, /* @__PURE__ */ g(ActivityApiContext.Provider, { value: { didClick } }, props.children)));
  }
  function normalizeItems(prev, data) {
    return {
      favorites: Object.fromEntries(
        data.activity.map((x5) => {
          return [x5.url, x5.favorite];
        })
      ),
      items: Object.fromEntries(
        data.activity.map((x5) => {
          const next = {
            etldPlusOne: x5.etldPlusOne,
            title: x5.title,
            url: x5.url,
            faviconMax: x5.favicon?.maxAvailableSize ?? DDG_DEFAULT_ICON_SIZE,
            favoriteSrc: x5.favicon?.src,
            trackersFound: x5.trackersFound
          };
          const differs = shallowDiffers(next, prev.items[x5.url] || {});
          return [x5.url, differs ? next : prev.items[x5.url] || {}];
        })
      ),
      history: Object.fromEntries(
        data.activity.map((x5) => {
          const differs = shallowDiffers(x5.history, prev.history[x5.url] || []);
          return [x5.url, differs ? [...x5.history] : prev.history[x5.url] || []];
        })
      ),
      trackingStatus: Object.fromEntries(
        data.activity.map((x5) => {
          const prevItem = prev.trackingStatus[x5.url] || {
            totalCount: 0,
            trackerCompanies: []
          };
          const differs = shallowDiffers(x5.trackingStatus.trackerCompanies, prevItem.trackerCompanies);
          if (prevItem.totalCount !== x5.trackingStatus.totalCount || differs) {
            const next = {
              totalCount: x5.trackingStatus.totalCount,
              trackerCompanies: [...x5.trackingStatus.trackerCompanies]
            };
            return [x5.url, next];
          }
          return [x5.url, prevItem];
        })
      )
    };
  }
  function normalizeKeys(prev, data) {
    const keys = data.activity.map((x5) => x5.url);
    const next = shallowDiffers(prev, keys) ? keys : prev.available;
    return {
      available: next,
      max: keys.length
    };
  }
  function shallowDiffers(a5, b5) {
    for (const i6 in a5) if (i6 !== "__source" && !(i6 in b5)) return true;
    for (const i6 in b5) if (i6 !== "__source" && a5[i6] !== b5[i6]) return true;
    return false;
  }
  function SignalStateProvider({ children }) {
    const { state } = x2(ActivityContext);
    const service = x2(ActivityServiceContext);
    if (state.status !== "ready") throw new Error("must have ready status here");
    if (!service) throw new Error("must have service here");
    const keys = useSignal(normalizeKeys({ available: [], max: 0 }, state.data));
    const activity = useSignal(
      normalizeItems(
        {
          items: {},
          history: {},
          trackingStatus: {},
          favorites: {}
        },
        state.data
      )
    );
    useSignalEffect(() => {
      if (!service) return console.warn("could not access service");
      const unsub = service.onData((evt) => {
        r3(() => {
          keys.value = normalizeKeys(keys.value, evt.data);
          activity.value = normalizeItems(activity.value, evt.data);
        });
      });
      const handler = () => {
        if (document.visibilityState === "visible") {
          console.log("will fetch");
          service.triggerDataFetch().catch((e5) => console.error("trigger fetch errored", e5));
        }
      };
      (() => {
        if (window.__playwright_01) {
          window.__trigger_document_visibilty__ = handler;
        }
      })();
      document.addEventListener("visibilitychange", handler);
      return () => {
        unsub();
        document.removeEventListener("visibilitychange", handler);
      };
    });
    return /* @__PURE__ */ g(SignalStateContext.Provider, { value: { activity, keys } }, children);
  }
  function useService() {
    const service = A2(
      /** @type {ActivityService|null} */
      null
    );
    const ntp = useMessaging();
    y2(() => {
      const stats2 = new ActivityService(ntp);
      service.current = stats2;
      return () => {
        stats2.destroy();
      };
    }, [ntp]);
    return service;
  }
  var ActivityContext, ActivityServiceContext, ActivityApiContext, SignalStateContext;
  var init_ActivityProvider = __esm({
    "pages/new-tab/app/activity/ActivityProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_activity_service();
      init_service_hooks();
      init_utils2();
      init_settings_provider();
      init_constants();
      init_signals_module();
      init_constants2();
      ActivityContext = J({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        toggle: () => {
          throw new Error("must implement");
        }
      });
      ActivityServiceContext = J(
        /** @type {ActivityService|null} */
        {}
      );
      ActivityApiContext = J({
        /**
         * @type {(evt: MouseEvent) => void} event
         */
        didClick(event) {
        }
      });
      SignalStateContext = J({
        activity: d3(
          /** @type {NormalizedActivity} */
          {}
        ),
        keys: d3(
          /** @type {{available: string[]; max: number}} */
          { available: [], max: 0 }
        )
      });
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
        headingIcon: "PrivacyStats_headingIcon",
        heart02: "PrivacyStats_heart02",
        heart01: "PrivacyStats_heart01",
        title: "PrivacyStats_title",
        widgetExpander: "PrivacyStats_widgetExpander",
        subtitle: "PrivacyStats_subtitle",
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
    const service = useService2();
    useInitialDataAndConfig({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    return /* @__PURE__ */ g(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ g(PrivacyStatsDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService2() {
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
      PrivacyStatsContext = J({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        toggle: () => {
          throw new Error("must implement");
        }
      });
      PrivacyStatsDispatchContext = J(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
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
    return /* @__PURE__ */ g(
      "button",
      {
        ...buttonAttrs,
        class: (0, import_classnames3.default)(ShowHide_default.button, shape === "round" && ShowHide_default.round, !!showText && ShowHide_default.withText),
        "aria-label": text,
        onClick
      },
      showText ? /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(Chevron, null), text) : /* @__PURE__ */ g("div", { class: ShowHide_default.iconBlock }, /* @__PURE__ */ g(Chevron, null))
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

  // pages/new-tab/app/privacy-stats/constants.js
  var DDG_STATS_OTHER_COMPANY_IDENTIFIER;
  var init_constants3 = __esm({
    "pages/new-tab/app/privacy-stats/constants.js"() {
      "use strict";
      DDG_STATS_OTHER_COMPANY_IDENTIFIER = "__other__";
    }
  });

  // pages/new-tab/app/privacy-stats/privacy-stats.utils.js
  function sortStatsForDisplay(stats2) {
    const sorted = stats2.slice().sort((a5, b5) => b5.count - a5.count);
    const other = sorted.findIndex((x5) => x5.displayName === DDG_STATS_OTHER_COMPANY_IDENTIFIER);
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
      init_constants3();
    }
  });

  // pages/new-tab/app/components/CompanyIcon.module.css
  var CompanyIcon_default;
  var init_CompanyIcon = __esm({
    "pages/new-tab/app/components/CompanyIcon.module.css"() {
      CompanyIcon_default = {
        icon: "CompanyIcon_icon",
        companyImgIcon: "CompanyIcon_companyImgIcon"
      };
    }
  });

  // pages/new-tab/app/components/CompanyIcon.js
  function CompanyIcon({ displayName }) {
    const icon = displayName.toLowerCase().split(".")[0];
    const cleaned = icon.replace(/[^a-z ]/g, "").replace(/ /g, "-");
    const id = cleaned in mappings ? mappings[cleaned] : cleaned;
    const firstChar = id[0];
    const [state, setState] = h2(
      /** @type {State} */
      states2.loading
    );
    const src = state === "loading" || state === "loaded" ? `./company-icons/${id}.svg` : state === "loadingFallback" || state === "loadedFallback" ? `./company-icons/${firstChar}.svg` : null;
    if (src === null || icon === DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
      return /* @__PURE__ */ g("span", { className: CompanyIcon_default.icon }, /* @__PURE__ */ g(Other, null));
    }
    return /* @__PURE__ */ g("span", { className: CompanyIcon_default.icon, title: displayName }, /* @__PURE__ */ g(
      "img",
      {
        src,
        alt: "",
        class: CompanyIcon_default.companyImgIcon,
        "data-loaded": state === states2.loaded || state === states2.loadedFallback,
        onLoad: () => setState((prev) => prev === states2.loading ? states2.loaded : states2.loadedFallback),
        onError: () => {
          setState((prev) => {
            if (prev === states2.loading) return states2.loadingFallback;
            return states2.errored;
          });
        }
      }
    ));
  }
  function Other() {
    return /* @__PURE__ */ g("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M1 16C1 7.71573 7.71573 1 16 1C24.2843 1 31 7.71573 31 16C31 16.0648 30.9996 16.1295 30.9988 16.1941C30.9996 16.2126 31 16.2313 31 16.25C31 16.284 30.9986 16.3177 30.996 16.3511C30.8094 24.4732 24.1669 31 16 31C7.83308 31 1.19057 24.4732 1.00403 16.3511C1.00136 16.3177 1 16.284 1 16.25C1 16.2313 1.00041 16.2126 1.00123 16.1941C1.00041 16.1295 1 16.0648 1 16ZM3.58907 17.5C4.12835 22.0093 7.06824 25.781 11.0941 27.5006C10.8572 27.0971 10.6399 26.674 10.4426 26.24C9.37903 23.9001 8.69388 20.8489 8.53532 17.5H3.58907ZM8.51564 15H3.53942C3.91376 10.2707 6.92031 6.28219 11.0941 4.49944C10.8572 4.90292 10.6399 5.326 10.4426 5.76003C9.32633 8.21588 8.62691 11.4552 8.51564 15ZM11.0383 17.5C11.1951 20.5456 11.8216 23.2322 12.7185 25.2055C13.8114 27.6098 15.0657 28.5 16 28.5C16.9343 28.5 18.1886 27.6098 19.2815 25.2055C20.1784 23.2322 20.8049 20.5456 20.9617 17.5H11.0383ZM20.983 15H11.017C11.1277 11.7487 11.7728 8.87511 12.7185 6.79454C13.8114 4.39021 15.0657 3.5 16 3.5C16.9343 3.5 18.1886 4.39021 19.2815 6.79454C20.2272 8.87511 20.8723 11.7487 20.983 15ZM23.4647 17.5C23.3061 20.8489 22.621 23.9001 21.5574 26.24C21.3601 26.674 21.1428 27.0971 20.9059 27.5006C24.9318 25.781 27.8717 22.0093 28.4109 17.5H23.4647ZM28.4606 15H23.4844C23.3731 11.4552 22.6737 8.21588 21.5574 5.76003C21.3601 5.326 21.1428 4.90291 20.9059 4.49944C25.0797 6.28219 28.0862 10.2707 28.4606 15Z",
        fill: "currentColor"
      }
    ));
  }
  var mappings, states2;
  var init_CompanyIcon2 = __esm({
    "pages/new-tab/app/components/CompanyIcon.js"() {
      "use strict";
      init_CompanyIcon();
      init_constants3();
      init_preact_module();
      init_hooks_module();
      mappings = {
        "google-analytics-google": "google-analytics",
        "google-ads-google": "google-ads"
      };
      states2 = /** @type {const} */
      {
        loading: "loading",
        loaded: "loaded",
        loadingFallback: "loadingFallback",
        loadedFallback: "loadedFallback",
        errored: "errored"
      };
    }
  });

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.js
  function PrivacyStats({ expansion, data, toggle, animation = "auto-animate" }) {
    if (animation === "view-transitions") {
      return /* @__PURE__ */ g(WithViewTransitions, { data, expansion, toggle });
    }
    return /* @__PURE__ */ g(PrivacyStatsConfigured, { expansion, data, toggle });
  }
  function WithViewTransitions({ expansion, data, toggle }) {
    const willToggle = q2(() => {
      viewTransition(toggle);
    }, [toggle]);
    return /* @__PURE__ */ g(PrivacyStatsConfigured, { expansion, data, toggle: willToggle });
  }
  function PrivacyStatsConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === "expanded";
    const { hasNamedCompanies, recent } = T2(() => {
      let recent2 = 0;
      let hasNamedCompanies2 = false;
      for (let i6 = 0; i6 < data.trackerCompanies.length; i6++) {
        recent2 += data.trackerCompanies[i6].count;
        if (!hasNamedCompanies2 && data.trackerCompanies[i6].displayName !== DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
          hasNamedCompanies2 = true;
        }
      }
      return { hasNamedCompanies: hasNamedCompanies2, recent: recent2 };
    }, [data.trackerCompanies]);
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    return /* @__PURE__ */ g("div", { class: PrivacyStats_default.root, ref: parentRef }, /* @__PURE__ */ g(
      Heading,
      {
        recent,
        onToggle: toggle,
        expansion,
        canExpand: hasNamedCompanies,
        buttonAttrs: {
          "aria-controls": WIDGET_ID,
          id: TOGGLE_ID
        }
      }
    ), hasNamedCompanies && expanded && /* @__PURE__ */ g(PrivacyStatsBody, { trackerCompanies: data.trackerCompanies, listAttrs: { id: WIDGET_ID } }));
  }
  function Heading({ expansion, canExpand, recent, onToggle, buttonAttrs = {} }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {Strings} */
      {}
    );
    const [formatter] = h2(() => new Intl.NumberFormat());
    const none = recent === 0;
    const some = recent > 0;
    const alltime = formatter.format(recent);
    const alltimeTitle = recent === 1 ? t5("stats_countBlockedSingular") : t5("stats_countBlockedPlural", { count: alltime });
    return /* @__PURE__ */ g("div", { className: PrivacyStats_default.heading }, /* @__PURE__ */ g("span", { className: PrivacyStats_default.headingIcon }, /* @__PURE__ */ g("img", { src: "./icons/shield.svg", alt: "Privacy Shield" })), none && /* @__PURE__ */ g("h2", { className: PrivacyStats_default.title }, t5("stats_noRecent")), some && /* @__PURE__ */ g("h2", { className: PrivacyStats_default.title }, alltimeTitle), canExpand && /* @__PURE__ */ g("span", { className: PrivacyStats_default.widgetExpander }, /* @__PURE__ */ g(
      ShowHideButton,
      {
        buttonAttrs: {
          ...buttonAttrs,
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded"
        },
        onClick: onToggle,
        text: expansion === "expanded" ? t5("stats_hideLabel") : t5("stats_toggleLabel"),
        shape: "round"
      }
    )), recent === 0 && /* @__PURE__ */ g("p", { className: PrivacyStats_default.subtitle }, t5("stats_noActivity")), recent > 0 && /* @__PURE__ */ g("p", { className: (0, import_classnames4.default)(PrivacyStats_default.subtitle, PrivacyStats_default.uppercase) }, t5("stats_feedCountBlockedPeriod")));
  }
  function ActivityHeading({ expansion, canExpand, itemCount, trackerCount, onToggle, className, buttonAttrs = {} }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {Strings} */
      {}
    );
    const [formatter] = h2(() => new Intl.NumberFormat());
    const none = itemCount === 0;
    const someItems = itemCount > 0;
    const trackerCountFormatted = formatter.format(trackerCount);
    const allTimeString = trackerCount === 1 ? t5("stats_countBlockedSingular") : t5("stats_countBlockedPlural", { count: trackerCountFormatted });
    return /* @__PURE__ */ g("div", { className: (0, import_classnames4.default)(PrivacyStats_default.heading, className), "data-testid": "ActivityHeading" }, /* @__PURE__ */ g("span", { className: PrivacyStats_default.headingIcon }, /* @__PURE__ */ g("img", { src: "./icons/shield.svg", alt: "Privacy Shield" })), none && /* @__PURE__ */ g("h2", { className: PrivacyStats_default.title }, t5("activity_noRecent_title")), someItems && /* @__PURE__ */ g("h2", { className: PrivacyStats_default.title }, allTimeString), canExpand && /* @__PURE__ */ g("span", { className: PrivacyStats_default.widgetExpander }, /* @__PURE__ */ g(
      ShowHideButton,
      {
        buttonAttrs: {
          ...buttonAttrs,
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded"
        },
        onClick: onToggle,
        text: expansion === "expanded" ? t5("stats_hideLabel") : t5("stats_toggleLabel"),
        shape: "round"
      }
    )), itemCount === 0 && /* @__PURE__ */ g("p", { className: PrivacyStats_default.subtitle }, t5("activity_noRecent_subtitle")), itemCount > 0 && /* @__PURE__ */ g("p", { className: (0, import_classnames4.default)(PrivacyStats_default.subtitle, PrivacyStats_default.uppercase) }, t5("stats_feedCountBlockedPeriod")));
  }
  function PrivacyStatsBody({ trackerCompanies, listAttrs = {} }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {Strings} */
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
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("ul", { ...listAttrs, class: PrivacyStats_default.list, "data-testid": "CompanyList" }, rows.map((company) => {
      const percentage = Math.min(company.count * 100 / max, 100);
      const valueOrMin = Math.max(percentage, 10);
      const inlineStyles = {
        width: `${valueOrMin}%`
      };
      const countText = formatter.format(company.count);
      const displayName = displayNameForCompany(company.displayName);
      if (company.displayName === DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
        const otherText2 = t5("stats_otherCount", { count: String(company.count) });
        return /* @__PURE__ */ g("li", { key: company.displayName, class: PrivacyStats_default.otherTrackersRow }, otherText2);
      }
      return /* @__PURE__ */ g("li", { key: company.displayName, class: PrivacyStats_default.row }, /* @__PURE__ */ g("div", { class: PrivacyStats_default.company }, /* @__PURE__ */ g(CompanyIcon, { displayName }), /* @__PURE__ */ g("span", { class: PrivacyStats_default.name }, displayName)), /* @__PURE__ */ g("span", { class: PrivacyStats_default.count }, countText), /* @__PURE__ */ g("span", { class: PrivacyStats_default.bar }), /* @__PURE__ */ g("span", { class: PrivacyStats_default.fill, style: inlineStyles }));
    })), sorted.length > defaultRowMax && /* @__PURE__ */ g("div", { class: PrivacyStats_default.listExpander }, /* @__PURE__ */ g(
      ShowHideButton,
      {
        onClick: toggleListExpansion,
        text: expansion === "collapsed" ? t5("ntp_show_more") : t5("ntp_show_less"),
        showText: true,
        buttonAttrs: {
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded"
        }
      }
    )));
  }
  function PrivacyStatsCustomized() {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {Strings} */
      {}
    );
    const drawer = useCustomizerDrawerSettings();
    const sectionTitle = drawer.state === "enabled" ? t5("stats_menuTitle_v2") : t5("stats_menuTitle");
    const { visibility, id, toggle, index } = useVisibility();
    useCustomizer({ title: sectionTitle, id, icon: "shield", toggle, visibility: visibility.value, index });
    if (visibility.value === "hidden") {
      return null;
    }
    return /* @__PURE__ */ g(PrivacyStatsProvider, null, /* @__PURE__ */ g(PrivacyStatsConsumer, null));
  }
  function PrivacyStatsConsumer() {
    const { state, toggle } = x2(PrivacyStatsContext);
    if (state.status === "ready") {
      return /* @__PURE__ */ g(PrivacyStats, { expansion: state.config.expansion, animation: state.config.animation?.kind, data: state.data, toggle });
    }
    return null;
  }
  var import_classnames4;
  var init_PrivacyStats2 = __esm({
    "pages/new-tab/app/privacy-stats/components/PrivacyStats.js"() {
      "use strict";
      init_preact_module();
      import_classnames4 = __toESM(require_classnames(), 1);
      init_PrivacyStats();
      init_types();
      init_hooks_module();
      init_PrivacyStatsProvider();
      init_widget_config_provider();
      init_utils2();
      init_ShowHideButton();
      init_CustomizerMenu();
      init_constants3();
      init_privacy_stats_utils();
      init_settings_provider();
      init_CompanyIcon2();
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
        preview: "Tile_preview",
        draggable: "Tile_draggable",
        favicon: "Tile_favicon",
        faviconLarge: "Tile_faviconLarge",
        faviconSmall: "Tile_faviconSmall",
        faviconText: "Tile_faviconText",
        text: "Tile_text",
        placeholder: "Tile_placeholder",
        plus: "Tile_plus",
        dropper: "Tile_dropper"
      };
    }
  });

  // pages/new-tab/app/favorites/getColorForString.js
  function getArrayIndex(str, arrayLength) {
    const utf8Encoder = new TextEncoder();
    const bytes = utf8Encoder.encode(str);
    let hash = BigInt(5381);
    for (const byte of bytes) {
      hash = (hash << BigInt(5)) + hash + BigInt(byte);
      hash = BigInt.asIntN(64, hash);
    }
    const index = hash % BigInt(arrayLength);
    return Number(index < 0 ? -index : index);
  }
  function urlToColor(url5) {
    if (typeof url5 !== "string") return null;
    if (urlToColorCache.has(url5)) {
      return urlToColorCache.get(url5);
    }
    const index = getArrayIndex(url5, EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES.length);
    const color = EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES[index];
    urlToColorCache.set(url5, color);
    return color;
  }
  var EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES, urlToColorCache;
  var init_getColorForString = __esm({
    "pages/new-tab/app/favorites/getColorForString.js"() {
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
      urlToColorCache = /* @__PURE__ */ new Map();
    }
  });

  // pages/new-tab/app/components/ImageWithState.js
  function ImageWithState({ faviconSrc, faviconMax, title, etldPlusOne, theme, displayKind }) {
    const size = Math.min(faviconMax, DDG_DEFAULT_ICON_SIZE);
    const sizeClass = displayKind === "favorite-tile" ? Tile_default.faviconLarge : Tile_default.faviconSmall;
    const imgsrc = faviconSrc ? faviconSrc + "?preferredSize=" + size : null;
    const initialState = (() => {
      if (imgsrc) return states3.loading_favicon_src;
      if (etldPlusOne) return states3.using_fallback_text;
      return states3.loading_fallback_img;
    })();
    const [state, setState] = h2(
      /** @type {ImgState} */
      initialState
    );
    switch (state) {
      /**
       * These are the happy paths, where we are loading the favicon source and it does not 404
       */
      case states3.loading_favicon_src:
      case states3.did_load_favicon_src: {
        if (!imgsrc) {
          console.warn("unreachable - must have imgsrc here");
          return null;
        }
        return /* @__PURE__ */ g(
          "img",
          {
            src: imgsrc,
            class: (0, import_classnames5.default)(Tile_default.favicon, sizeClass),
            alt: "",
            "data-state": state,
            onLoad: () => setState(states3.did_load_favicon_src),
            onError: () => {
              if (etldPlusOne) {
                setState(states3.using_fallback_text);
              } else {
                setState(states3.loading_fallback_img);
              }
            }
          }
        );
      }
      /**
       * A fallback can be applied when the `etldPlusOne` is there. For example,
       * if `etldPlusOne = 'example.com'`, we can display `Ex` and use the domain name
       * to select a background color.
       */
      case states3.using_fallback_text: {
        if (!etldPlusOne) {
          console.warn("unreachable - must have etld+1 here");
          return null;
        }
        let style;
        const fallbackColor = urlToColor(etldPlusOne);
        if (fallbackColor) {
          style = { background: fallbackColor };
        }
        const chars = etldPlusOne.slice(0, 2);
        return /* @__PURE__ */ g("div", { class: (0, import_classnames5.default)(Tile_default.favicon, sizeClass, Tile_default.faviconText), style, "data-state": state }, /* @__PURE__ */ g("span", null, chars[0]), /* @__PURE__ */ g("span", null, chars[1]));
      }
      /**
       * If we get here, we couldn't load the favicon source OR the fallback text
       * So, we default to a globe icon
       */
      case states3.loading_fallback_img:
      case states3.did_load_fallback_img: {
        return /* @__PURE__ */ g(
          "img",
          {
            src: theme === "light" ? DDG_FALLBACK_ICON : DDG_FALLBACK_ICON_DARK,
            class: (0, import_classnames5.default)(Tile_default.favicon, sizeClass),
            alt: "",
            "data-state": state,
            onLoad: () => setState(states3.did_load_fallback_img),
            onError: () => setState(states3.fallback_img_failed)
          }
        );
      }
      default:
        return null;
    }
  }
  var import_classnames5, states3;
  var init_ImageWithState = __esm({
    "pages/new-tab/app/components/ImageWithState.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_constants2();
      init_Tile();
      init_getColorForString();
      import_classnames5 = __toESM(require_classnames(), 1);
      states3 = /** @type {Record<ImgState, ImgState>} */
      {
        loading_favicon_src: "loading_favicon_src",
        did_load_favicon_src: "did_load_favicon_src",
        loading_fallback_img: "loading_fallback_img",
        did_load_fallback_img: "did_load_fallback_img",
        fallback_img_failed: "fallback_img_failed",
        using_fallback_text: "using_fallback_text"
      };
    }
  });

  // pages/new-tab/app/components/icons/Star.js
  function Star() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g("g", { "clip-path": "url(#clip0_22408_13762)" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M6.45094 1.23706C7.08238 -0.0497198 8.9167 -0.0497265 9.54814 1.23706L10.9707 4.13602C11.0397 4.27659 11.1735 4.37414 11.3284 4.39678L14.5197 4.86316C15.9315 5.06949 16.4967 6.80298 15.4779 7.80183L13.1606 10.0735C13.0494 10.1825 12.9987 10.3391 13.0249 10.4926L13.5708 13.6939C13.8114 15.1044 12.329 16.1776 11.0641 15.5088L8.22157 14.0058C8.08266 13.9324 7.91642 13.9324 7.77751 14.0058L4.93501 15.5088C3.67009 16.1776 2.1877 15.1044 2.42824 13.6939L2.97417 10.4926C3.00034 10.3391 2.94964 10.1825 2.83846 10.0735L0.521231 7.80183C-0.497628 6.80298 0.0675747 5.06949 1.47939 4.86316L4.67065 4.39678C4.82559 4.37414 4.95941 4.27659 5.02839 4.13602L6.45094 1.23706ZM8.42597 1.78772C8.25209 1.43339 7.74699 1.43339 7.57311 1.78772L6.15056 4.68669C5.90006 5.19717 5.41407 5.55141 4.85141 5.63364L1.66014 6.10003C1.27139 6.15684 1.11575 6.63418 1.39631 6.90922L3.71353 9.18094C4.11729 9.57677 4.30143 10.1453 4.20638 10.7027L3.66045 13.904C3.59422 14.2924 4.00241 14.5879 4.35072 14.4038L7.19322 12.9008C7.69768 12.6341 8.3014 12.6341 8.80586 12.9008L11.6484 14.4038C11.9967 14.5879 12.4049 14.2924 12.3386 13.904L11.7927 10.7027C11.6977 10.1453 11.8818 9.57677 12.2856 9.18094L14.6028 6.90922C14.8833 6.63418 14.7277 6.15684 14.3389 6.10003L11.1477 5.63364C10.585 5.55141 10.099 5.19717 9.84852 4.68669L8.42597 1.78772Z",
        fill: "currentColor"
      }
    )), /* @__PURE__ */ g("defs", null, /* @__PURE__ */ g("clipPath", { id: "clip0_22408_13762" }, /* @__PURE__ */ g("rect", { width: "16", height: "16", fill: "white" }))));
  }
  function StarFilled() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M6.34112 1.36682C7.01973 -0.00818121 8.98044 -0.00817835 9.65904 1.36683L11.025 4.13454C11.076 4.23784 11.1745 4.30944 11.2885 4.32601L14.3429 4.76983C15.8603 4.99032 16.4662 6.85507 15.3682 7.92536L13.158 10.0797C13.0755 10.1601 13.0379 10.276 13.0574 10.3895L13.5791 13.4315C13.8383 14.9428 12.2521 16.0953 10.8948 15.3818L8.16295 13.9455C8.06099 13.8919 7.93918 13.8919 7.83721 13.9455L5.10531 15.3818C3.7481 16.0953 2.16185 14.9428 2.42106 13.4315L2.9428 10.3895C2.96227 10.276 2.92463 10.1601 2.84214 10.0797L0.631989 7.92536C-0.466019 6.85507 0.139879 4.99032 1.65728 4.76983L4.71164 4.32601C4.82564 4.30944 4.92419 4.23784 4.97517 4.13454L6.34112 1.36682Z",
        fill: "currentColor"
      }
    ));
  }
  var init_Star = __esm({
    "pages/new-tab/app/components/icons/Star.js"() {
      "use strict";
      init_preact_module();
    }
  });

  // pages/new-tab/app/components/icons/Fire.js
  function Fire() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ g(
      "path",
      {
        d: "M6.51 15.53C5.52169 15.1832 4.62813 14.6102 3.90063 13.8566C3.17314 13.1031 2.63187 12.1899 2.32 11.19C2.00656 10.2021 1.95796 9.14927 2.17908 8.1367C2.4002 7.12413 2.88327 6.18736 3.58 5.42005C3.55086 5.89155 3.62952 6.36349 3.81 6.80005C4.02338 7.25295 4.32218 7.6604 4.69 8.00005C4.69 8.00005 4.12 6.49005 5.5 4.00005C6.05366 3.11404 6.78294 2.35083 7.64287 1.75747C8.50281 1.16412 9.47517 0.7532 10.5 0.550049C9.98683 1.37608 9.80801 2.36673 10 3.32005C10.3 4.32005 10.79 4.86005 11.34 6.32005C11.6531 7.02128 11.81 7.78217 11.8 8.55005C11.8924 8.00549 12.0785 7.48106 12.35 7.00005C12.8052 6.23481 13.5122 5.65154 14.35 5.35005C13.9622 6.24354 13.8041 7.21983 13.89 8.19005C14.13 9.57207 14.0024 10.9929 13.52 12.31C13.1426 13.1433 12.5797 13.8792 11.8743 14.4616C11.1689 15.0439 10.3396 15.4573 9.45 15.67C10.0363 15.44 10.5353 15.0313 10.8763 14.5018C11.2173 13.9723 11.383 13.349 11.35 12.72C11.2519 11.9769 10.8983 11.2911 10.35 10.78C10 12.67 9 12.89 9 12.89C9.38734 12.0753 9.6277 11.1985 9.71 10.3C9.76437 9.73167 9.71007 9.15813 9.55 8.61005C9.35788 7.62829 8.80485 6.75416 8 6.16005C8.05802 6.68407 8.01002 7.21441 7.85883 7.7195C7.70765 8.22458 7.45639 8.69408 7.12 9.10005C6.31 10.36 4.94 11.29 5 13.17C5.02619 13.6604 5.17907 14.1356 5.44372 14.5492C5.70838 14.9628 6.07576 15.3008 6.51 15.53Z",
        fill: "currentColor"
      }
    ));
  }
  var init_Fire = __esm({
    "pages/new-tab/app/components/icons/Fire.js"() {
      "use strict";
      init_preact_module();
    }
  });

  // pages/new-tab/app/activity/components/ActivityItem.js
  function Controls({ canBurn, url: url5, title }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const { activity } = x2(SignalStateContext);
    const favorite = useComputed(() => activity.value.favorites[url5]);
    const favoriteTitle = favorite.value ? t5("activity_favoriteRemove", { domain: title }) : t5("activity_favoriteAdd", { domain: title });
    const secondaryTitle = canBurn ? t5("activity_burn", { domain: title }) : t5("activity_itemRemove", { domain: title });
    return /* @__PURE__ */ g("div", { className: Activity_default.controls }, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames6.default)(Activity_default.icon, Activity_default.controlIcon, Activity_default.disableWhenBusy),
        title: favoriteTitle,
        "data-action": favorite.value ? ACTION_REMOVE_FAVORITE : ACTION_ADD_FAVORITE,
        "data-title": title,
        value: url5,
        type: "button"
      },
      favorite.value ? /* @__PURE__ */ g(StarFilled, null) : /* @__PURE__ */ g(Star, null)
    ), /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames6.default)(Activity_default.icon, Activity_default.controlIcon, Activity_default.disableWhenBusy),
        title: secondaryTitle,
        "data-action": canBurn ? ACTION_BURN : ACTION_REMOVE,
        value: url5,
        type: "button"
      },
      canBurn ? /* @__PURE__ */ g(Fire, null) : /* @__PURE__ */ g(Cross, null)
    ));
  }
  var import_classnames6, ActivityItem;
  var init_ActivityItem = __esm({
    "pages/new-tab/app/activity/components/ActivityItem.js"() {
      "use strict";
      init_preact_module();
      init_types();
      import_classnames6 = __toESM(require_classnames(), 1);
      init_Activity();
      init_ImageWithState();
      init_constants();
      init_Star();
      init_Fire();
      init_Icons2();
      init_hooks_module();
      init_compat_module();
      init_signals_module();
      init_ActivityProvider();
      ActivityItem = M2(
        /**
         * @param {object} props
         * @param {boolean} props.canBurn
         * @param {"visible"|"hidden"} props.documentVisibility
         * @param {import("preact").ComponentChild} props.children
         * @param {string} props.title
         * @param {string} props.url
         * @param {string|null|undefined} props.favoriteSrc
         * @param {number} props.faviconMax
         * @param {string} props.etldPlusOne
         */
        function ActivityItem2({ canBurn, documentVisibility, title, url: url5, favoriteSrc, faviconMax, etldPlusOne, children }) {
          return /* @__PURE__ */ g("li", { key: url5, class: (0, import_classnames6.default)(Activity_default.item), "data-testid": "ActivityItem" }, /* @__PURE__ */ g("div", { class: Activity_default.heading }, /* @__PURE__ */ g("a", { class: Activity_default.title, href: url5, "data-url": url5 }, /* @__PURE__ */ g("span", { className: Activity_default.favicon, "data-url": url5 }, documentVisibility === "visible" && /* @__PURE__ */ g(
            ImageWithState,
            {
              faviconSrc: favoriteSrc,
              faviconMax,
              title,
              etldPlusOne,
              theme: "light",
              displayKind: "history-favicon"
            }
          )), title), /* @__PURE__ */ g(Controls, { canBurn, url: url5, title })), /* @__PURE__ */ g("div", { class: Activity_default.body }, children));
        }
      );
    }
  });

  // pages/new-tab/app/activity/BurnProvider.js
  function BurnProvider({ children }) {
    const burning = useSignal(
      /** @type {string[]} */
      []
    );
    const exiting = useSignal(
      /** @type {string[]} */
      []
    );
    const { didClick: originalDidClick } = x2(ActivityApiContext);
    const service = x2(ActivityServiceContext);
    const { isReducedMotion } = useEnv();
    async function didClick(e5) {
      const button = (
        /** @type {HTMLButtonElement|null} */
        e5.target?.closest(`button[value][data-action="${ACTION_BURN}"]`)
      );
      if (!button) return originalDidClick(e5);
      if (!service) throw new Error("unreachable");
      e5.preventDefault();
      e5.stopImmediatePropagation();
      if (burning.value.length > 0 || exiting.value.length > 0) return console.warn("ignoring additional burn");
      const value = button.value;
      const response = await service?.confirmBurn(value);
      if (response && response.action === "none") return console.log("action: none");
      service.disableBroadcast();
      burning.value = burning.value.concat(value);
      const feSignals = any(reducedMotion(isReducedMotion), animationExit(), didChangeDocumentVisibility());
      const nativeSignal = didCompleteNatively(service);
      const required = all(feSignals, nativeSignal);
      const withTimer = any(required, timer(3e3));
      await toPromise(withTimer);
      r3(() => {
        exiting.value = [];
        burning.value = [];
      });
      service?.enableBroadcast();
    }
    y2(() => {
      const handler = (e5) => {
        if (e5.detail.url) {
          r3(() => {
            burning.value = burning.value.filter((x5) => x5 !== e5.detail.url);
            exiting.value = exiting.value.concat(e5.detail.url);
            console.log("[done-burning]", e5.detail.url, e5.detail.reason);
            console.log(" \u2570 [exiting]", exiting.value);
            console.log(" \u2570 [burning]", burning.value);
          });
        }
      };
      window.addEventListener("done-burning", handler);
      return () => {
        window.removeEventListener("done-burning", handler);
      };
    }, [burning, exiting]);
    return /* @__PURE__ */ g(ActivityBurningSignalContext.Provider, { value: { burning, exiting } }, /* @__PURE__ */ g(ActivityApiContext.Provider, { value: { didClick } }, children));
  }
  function toPromise(fn2) {
    return new Promise((resolve) => {
      const cleanup = fn2({
        next: (v5) => {
          resolve(v5);
          cleanup();
        }
      });
    });
  }
  function reducedMotion(isReducedMotion) {
    console.log("+[reducedMotion] setup");
    return (subject) => {
      if (isReducedMotion) {
        console.log("  .next() [reducedMotion] setup");
        subject.next();
      }
    };
  }
  function animationExit() {
    return (subject) => {
      console.log("+[didExit] setup");
      const handler = () => {
        console.log("  .next() -> [didExit]");
        subject.next();
      };
      window.addEventListener("done-exiting", handler, { once: true });
      return () => {
        console.log("-[didExit] teardown");
        window.removeEventListener("done-exiting", handler);
      };
    };
  }
  function timer(ms) {
    return (subject) => {
      console.log("+[timer] setup");
      const int = setTimeout(() => {
        console.log("  .next() -> [timer]");
        return subject.next();
      }, ms);
      return () => {
        console.log("-[timer] teardown");
        clearTimeout(int);
      };
    };
  }
  function didCompleteNatively(service) {
    return (subject) => {
      console.log("+[didCompleteNatively] setup");
      const unsub = service?.onBurnComplete(() => {
        console.log("  .next() -> [didCompleteNatively] ");
        subject.next();
      });
      return () => {
        console.log("-[didCompleteNatively] teardown");
        unsub();
      };
    };
  }
  function didChangeDocumentVisibility() {
    return (subject) => {
      console.log("+[didChangeVisibility] setup");
      const handler = () => {
        console.log("  .next() -> [didChangeVisibility] resolve ");
        return subject.next(document.visibilityState);
      };
      document.addEventListener("visibilitychange", handler, { once: true });
      return () => {
        console.log("-[didChangeVisibility] teardown");
        window.removeEventListener("visibilitychange", handler);
      };
    };
  }
  function any(...fns) {
    return (subject) => {
      const jobs = fns.map((factory8) => {
        const subject2 = {
          /** @type {any} */
          next: void 0
        };
        const promise = new Promise((resolve) => subject2.next = resolve);
        const cleanup = factory8(subject2);
        return {
          promise,
          cleanup
        };
      });
      Promise.any(jobs.map((x5) => x5.promise)).then((d6) => subject.next(d6)).catch(console.error);
      return () => {
        for (const job of jobs) {
          job.cleanup?.();
        }
      };
    };
  }
  function all(...fns) {
    return (subject) => {
      const jobs = fns.map((factory8) => {
        const subject2 = {
          /** @type {any} */
          next: void 0
        };
        const promise = new Promise((resolve) => subject2.next = resolve);
        const cleanup = factory8(subject2);
        return {
          promise,
          cleanup
        };
      });
      Promise.all(jobs.map((x5) => x5.promise)).then((d6) => subject.next(d6)).catch(console.error);
      return () => {
        for (const job of jobs) {
          job.cleanup?.();
        }
      };
    };
  }
  var ActivityBurningSignalContext;
  var init_BurnProvider = __esm({
    "pages/new-tab/app/activity/BurnProvider.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_ActivityProvider();
      init_constants();
      init_signals_module();
      init_EnvironmentProvider();
      ActivityBurningSignalContext = J({
        /** @type {import("@preact/signals").Signal<string[]>} */
        burning: d3([]),
        /** @type {import("@preact/signals").Signal<string[]>} */
        exiting: d3([])
      });
    }
  });

  // ../node_modules/@lottielab/lottie-player/dist/esm/web.mjs
  function t4(t5) {
    return t5 && t5.__esModule && Object.prototype.hasOwnProperty.call(t5, "default") ? t5.default : t5;
  }
  function o4(t5, e5, i6) {
    var s6, a5, r5, n4;
    return null == t5 ? e5 : null == e5 ? t5 : "number" == typeof t5 ? "number" != typeof e5 ? i6 > 0.5 ? e5 : t5 : (1 - i6) * t5 + i6 * e5 : Array.isArray(t5) || t5 instanceof Float32Array ? Array.isArray(e5) || e5 instanceof Float32Array ? t5.map((t6, s7) => {
      var a6;
      return o4(t6, null !== (a6 = e5[s7]) && void 0 !== a6 ? a6 : t6, i6);
    }) : i6 > 0.5 ? e5 : t5 : "i" in t5 && "v" in t5 && "o" in t5 && "object" == typeof e5 && "i" in e5 && "v" in e5 && "o" in e5 ? { closed: t5.closed && e5.closed, i: o4(t5.i, e5.i, i6), o: o4(t5.o, e5.o, i6), v: o4(t5.v, e5.v, i6), length: Math.max(null !== (s6 = t5.length) && void 0 !== s6 ? s6 : 0, null !== (a5 = e5.length) && void 0 !== a5 ? a5 : 0), _length: Math.max(null !== (r5 = t5._length) && void 0 !== r5 ? r5 : 0, null !== (n4 = e5._length) && void 0 !== n4 ? n4 : 0) } : i6 > 0.5 ? e5 : t5;
  }
  function d5(t5) {
    return t5 ? t5.fr : 100;
  }
  function m4(t5) {
    switch (t5.event) {
      case "finish":
        return "finish";
      case "click":
      case "mouseDown":
      case "mouseUp":
      case "mouseEnter":
      case "mouseLeave":
        return t5.target ? `${t5.event}:${t5.target}` : t5.event;
      case "custom":
        return "custom:" + t5.name;
    }
  }
  function u4(t5) {
    throw new Error(`Unexpected ${t5.name} at position ${t5.position}.`);
  }
  function v4(t5) {
    const e5 = function(t6) {
      const e6 = /^\s*$/, i7 = t6.split(/([+\-*/^(),?:!]|<=|>=|==|>(?!=)|<(?!=)|\|\||&&|\s+)/g);
      i7.push("end of input");
      let s7 = 0;
      const a5 = [];
      for (const t7 of i7) {
        if (!g6.some((e7) => {
          var i8;
          if ((null !== (i8 = e7.detect) && void 0 !== i8 ? i8 : (t8) => t8 == e7.name)(t7)) return a5.push(Object.assign(Object.assign({}, e7), { value: t7, position: s7 })), true;
        }) && !e6.test(t7)) throw new Error(`Invalid token ${t7} at position ${s7}`);
        s7 += t7.length;
      }
      return a5;
    }(t5);
    let i6 = 0;
    const s6 = { peek: () => e5[i6], pop: () => e5[i6++], parse: (t6) => {
      let e6 = s6.pop();
      e6.nud || u4(e6);
      let i7 = e6.nud(s6, e6);
      for (; s6.peek().lbp > t6; ) e6 = s6.pop(), e6.led || u4(e6), i7 = e6.led(s6, i7, e6);
      return i7;
    } };
    return s6.parse(0);
  }
  function b4(t5) {
    throw new Error(`Symbol ${t5} is not defined and not a built in symbol.`);
  }
  function _5(t5, e5) {
    var i6, s6;
    switch (t5.type) {
      case 0:
        return t5.value;
      case 1: {
        const s7 = t5.name, a5 = null !== (i6 = e5[s7]) && void 0 !== i6 ? i6 : y5[s7];
        if (null == a5 && b4(s7), "boolean" != typeof a5 && "number" != typeof a5) throw new Error(`Symbol ${s7} is a function and must be used in a function call.`);
        return a5;
      }
      case 2: {
        const i7 = _5(t5.operand, e5);
        return function(t6, e6) {
          switch (t6) {
            case "+":
              return +e6;
            case "-":
              return -e6;
            case "!":
              return !e6;
          }
        }(t5.operator, i7);
      }
      case 3: {
        const i7 = _5(t5.left, e5), s7 = _5(t5.right, e5);
        return function(t6, e6, i8) {
          switch (t6) {
            case "+":
              return e6 + i8;
            case "-":
              return e6 - i8;
            case "*":
              return e6 * i8;
            case "/":
              return e6 / i8;
            case "^":
              return Math.pow(e6, i8);
            case "<":
              return e6 < i8;
            case "<=":
              return e6 <= i8;
            case ">":
              return e6 > i8;
            case ">=":
              return e6 >= i8;
            case "==":
              return e6 == i8;
            case "&&":
              return e6 && i8;
            case "||":
              return e6 || i8;
          }
        }(t5.operator, i7, s7);
      }
      case 4: {
        const i7 = _5(t5.condition, e5);
        return _5(i7 ? t5.thenBranch : t5.elseBranch, e5);
      }
      case 5: {
        const i7 = t5.name, a5 = null !== (s6 = e5[i7]) && void 0 !== s6 ? s6 : y5[i7];
        if (null == a5 && b4(i7), "function" != typeof a5) throw new Error(`Symbol ${i7} has value ${a5} and is not callable.`);
        if (a5.length != t5.operands.length) throw new Error(`Expected ${a5.length} operands for ${i7}, received ${t5.operands.length}`);
        const r5 = t5.operands.map((t6) => _5(t6, e5));
        return a5.apply(null, r5);
      }
    }
  }
  function w5(t5, e5) {
    const i6 = Object.assign({}, t5);
    for (const t6 in e5) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(t6)) continue;
      const s6 = e5[t6];
      "object" == typeof s6 && "x" in s6 && "y" in s6 && "number" == typeof s6.x && "number" == typeof s6.y ? (i6[t6 + ".x"] = s6.x, i6[t6 + ".y"] = s6.y) : i6[t6] = "number" == typeof s6 || "boolean" == typeof s6 ? s6 : 0;
    }
    return i6;
  }
  function S2(t5, e5) {
    return function(t6, e6) {
      return function(t7, e7) {
        return t7.reduce((t8, i6, s6) => ({ x: t8.x + e7[s6] * i6.x, y: t8.y + e7[s6] * i6.y }), { x: 0, y: 0 });
      }(function(t7) {
        return [t7.start, t7.controlPoint1, t7.controlPoint2, t7.end];
      }(t6), [Math.pow(1 - e6, 3), 3 * Math.pow(1 - e6, 2) * e6, 3 * (1 - e6) * Math.pow(e6, 2), Math.pow(e6, 3)]);
    }(function(t6) {
      return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, controlPoint1: t6.o, controlPoint2: t6.i };
    }(t5), e5).y;
  }
  function A5(t5, e5) {
    try {
      const i6 = v4(t5);
      return (t6) => {
        try {
          return +_5(i6, t6);
        } catch (t7) {
          return e5;
        }
      };
    } catch (t6) {
      return () => e5;
    }
  }
  function D3(t5) {
    var e5;
    const i6 = new f4();
    i6.segment = t5.segment, i6.loop = null === (e5 = t5.loop) || void 0 === e5 || e5, t5.direction && (i6.direction = "forward" === t5.direction ? 1 : -1);
    const s6 = { driver: i6 };
    return "number" == typeof t5.speed ? i6.speed = t5.speed : "string" == typeof t5.speed && (s6.speedControl = A5(t5.speed, 1)), t5.playhead && (s6.playheadControl = A5(t5.playhead, 0)), s6;
  }
  function C3(t5, e5, i6, s6, a5, r5) {
    var n4, o5;
    const h6 = t5.playback, l6 = Object.assign(Object.assign({}, a5), { time: s6, "time.diff": i6, playhead: h6.driver.timeInSegment, "playhead.progress": h6.driver.durationOfSegment > 0 ? h6.driver.timeInSegment / h6.driver.durationOfSegment : 0, "playhead.abs": h6.driver.currentTime });
    h6.speedControl && (h6.driver.speed = h6.speedControl(a5));
    const p6 = h6.driver.advance(e5, i6, r5);
    h6.playheadControl && (p6.time = h6.playheadControl(l6) * h6.driver.durationOfSegment + (null !== (o5 = null === (n4 = h6.driver.segment) || void 0 === n4 ? void 0 : n4[0]) && void 0 !== o5 ? o5 : 0));
    const d6 = function(t6, e6, i7) {
      var s7, a6;
      if (!t6.morphing) return;
      const r6 = null !== (a6 = null === (s7 = t6.def.morphing) || void 0 === s7 ? void 0 : s7.timeRemap) && void 0 !== a6 ? a6 : "proportional";
      let n5;
      const o6 = e6.morphs ? e6.morphs[e6.morphs.length - 1].time : e6.time;
      switch (r6) {
        case "proportional":
          n5 = P4(o6, t6.def.segment, t6.morphing.other.def.segment);
          break;
        case "wrap":
          n5 = T4(o6, t6.def.segment, t6.morphing.other.def.segment);
          break;
        case "clamp":
          n5 = E4(o6, t6.def.segment, t6.morphing.other.def.segment);
          break;
        default:
          return void console.warn(`[@lottielab/lottie-player:interactive] Unknown timeRemap: ${r6}`);
      }
      return { time: n5, strength: "number" == typeof t6.morphing.strength ? t6.morphing.strength : t6.morphing.strength(i7) };
    }(t5, p6, a5);
    return d6 && (p6.morphs = [d6]), p6;
  }
  function P4(t5, e5, i6, s6 = 1) {
    const a5 = e5[1] - e5[0], r5 = i6[1] - i6[0];
    let n4 = a5 > 0 ? (t5 - e5[0]) / a5 : 0;
    return n4 = Math.min(1, Math.max(0, n4)) * s6, i6[0] + n4 * r5;
  }
  function T4(t5, e5, i6) {
    const s6 = i6[1] - i6[0], a5 = t5 - e5[0], r5 = i6[0] + (s6 > 0 ? a5 % (i6[1] - i6[0]) : 0);
    return Math.min(i6[1], Math.max(i6[0], r5));
  }
  function E4(t5, e5, i6) {
    const s6 = t5 - e5[0] + i6[0];
    return Math.min(i6[1], Math.max(i6[0], s6));
  }
  function F4(t5, e5, i6, s6, a5, r5 = true, n4 = 8) {
    var o5;
    let h6 = e5.next ? C3(e5.next, t5, i6, s6, a5) : t5;
    if (e5 && e5.def.duration) {
      let l6;
      l6 = "state" === e5.prev.type ? C3(e5.prev, t5, i6, s6, a5) : F4(t5, e5.prev, i6, s6, a5, false, n4 - 1), r5 && (e5.progress += i6 / e5.def.duration), e5.progress = Math.min(1, e5.progress);
      let p6 = e5.progress;
      if (e5.def.easing && (p6 = S2(e5.def.easing, p6)), 1 === p6) h6 = Object.assign(Object.assign({}, l6), { morphs: t5.morphs, time: h6.time });
      else if (n4 > 0) {
        const e6 = h6.time;
        h6 = Object.assign({}, l6), h6.morphs = (null !== (o5 = h6.morphs) && void 0 !== o5 ? o5 : []).concat([{ time: e6, strength: p6 }]), t5.morphs && t5.morphs.length > 0 && (h6.morphs = [...t5.morphs, { time: h6.time, strength: 1 - h6.morphs[0].strength }], h6.time = t5.time);
      } else h6 = Object.assign(Object.assign({}, l6), { time: p6 > 0.5 ? h6.time : l6.time });
    } else e5.def.duration || console.warn("[@lottielab/lottie-player:interactive] Transition duration of 0/unset is not expected here");
    return h6;
  }
  function I2(t5, e5, i6) {
    return Math.min(Math.max(t5, e5), i6);
  }
  function z4(t5) {
    console.warn("[@lottielab/lottie-player/web]", "string" == typeof t5 ? new Error(t5) : t5);
  }
  var e4, i5, s5, a4, r4, n3, h5, l5, p5, f4, c4, g6, y5, k4, x4, M3, L2, O2, R, V3, N3, j4;
  var init_web = __esm({
    "../node_modules/@lottielab/lottie-player/dist/esm/web.mjs"() {
      i5 = { exports: {} };
      e4 = i5.exports, "undefined" != typeof navigator && (i5.exports = function() {
        var t5 = "http://www.w3.org/2000/svg", i6 = "", s6 = false, a5 = -999999, r5 = function(t6) {
          s6 = !!t6;
        }, n4 = function() {
          return s6;
        }, o5 = function(t6) {
          i6 = t6;
        }, h6 = function() {
          return i6;
        };
        function l6(t6) {
          return document.createElement(t6);
        }
        function p6(t6, e5) {
          var i7, s7, a6 = t6.length;
          for (i7 = 0; i7 < a6; i7 += 1) for (var r6 in s7 = t6[i7].prototype) Object.prototype.hasOwnProperty.call(s7, r6) && (e5.prototype[r6] = s7[r6]);
        }
        function d6(t6) {
          function e5() {
          }
          return e5.prototype = t6, e5;
        }
        var f5 = function() {
          function t6(t7) {
            this.audios = [], this.audioFactory = t7, this._volume = 1, this._isMuted = false;
          }
          return t6.prototype = { addAudio: function(t7) {
            this.audios.push(t7);
          }, pause: function() {
            var t7, e5 = this.audios.length;
            for (t7 = 0; t7 < e5; t7 += 1) this.audios[t7].pause();
          }, resume: function() {
            var t7, e5 = this.audios.length;
            for (t7 = 0; t7 < e5; t7 += 1) this.audios[t7].resume();
          }, setRate: function(t7) {
            var e5, i7 = this.audios.length;
            for (e5 = 0; e5 < i7; e5 += 1) this.audios[e5].setRate(t7);
          }, createAudio: function(t7) {
            return this.audioFactory ? this.audioFactory(t7) : window.Howl ? new window.Howl({ src: [t7] }) : { isPlaying: false, play: function() {
              this.isPlaying = true;
            }, seek: function() {
              this.isPlaying = false;
            }, playing: function() {
            }, rate: function() {
            }, setVolume: function() {
            } };
          }, setAudioFactory: function(t7) {
            this.audioFactory = t7;
          }, setVolume: function(t7) {
            this._volume = t7, this._updateVolume();
          }, mute: function() {
            this._isMuted = true, this._updateVolume();
          }, unmute: function() {
            this._isMuted = false, this._updateVolume();
          }, getVolume: function() {
            return this._volume;
          }, _updateVolume: function() {
            var t7, e5 = this.audios.length;
            for (t7 = 0; t7 < e5; t7 += 1) this.audios[t7].volume(this._volume * (this._isMuted ? 0 : 1));
          } }, function() {
            return new t6();
          };
        }(), m5 = /* @__PURE__ */ function() {
          function t6(t7, e6) {
            var i7, s7 = 0, a6 = [];
            switch (t7) {
              case "int16":
              case "uint8c":
                i7 = 1;
                break;
              default:
                i7 = 1.1;
            }
            for (s7 = 0; s7 < e6; s7 += 1) a6.push(i7);
            return a6;
          }
          function e5(e6, i7) {
            return "float32" === e6 ? new Float32Array(i7) : "int16" === e6 ? new Int16Array(i7) : "uint8c" === e6 ? new Uint8ClampedArray(i7) : t6(e6, i7);
          }
          return "function" == typeof Uint8ClampedArray && "function" == typeof Float32Array ? e5 : t6;
        }();
        function c5(t6) {
          return Array.apply(null, { length: t6 });
        }
        var u5 = true, g7 = null, v5 = "", y6 = /^((?!chrome|android).)*safari/i.test(navigator.userAgent), b5 = Math.pow, _6 = Math.sqrt, k5 = Math.floor, w6 = Math.min, S3 = 150, A6 = Math.PI / 180, D4 = 0.5519;
        function C4(t6, e5, i7, s7) {
          this.type = t6, this.currentTime = e5, this.totalTime = i7, this.direction = s7 < 0 ? -1 : 1;
        }
        function P5(t6, e5) {
          this.type = t6, this.direction = e5 < 0 ? -1 : 1;
        }
        function T5(t6, e5, i7, s7) {
          this.type = t6, this.currentLoop = i7, this.totalLoops = e5, this.direction = s7 < 0 ? -1 : 1;
        }
        function E5(t6, e5, i7) {
          this.type = t6, this.firstFrame = e5, this.totalFrames = i7;
        }
        function F5(t6, e5) {
          this.type = t6, this.target = e5;
        }
        function x5(t6, e5) {
          this.type = "renderFrameError", this.nativeError = t6, this.currentTime = e5;
        }
        function M4(t6) {
          this.type = "configError", this.nativeError = t6;
        }
        var I3, L3 = (I3 = 0, function() {
          return v5 + "__lottie_element_" + (I3 += 1);
        });
        function O3(t6, e5, i7) {
          var s7, a6, r6, n5, o6, h7, l7, p7;
          switch (h7 = i7 * (1 - e5), l7 = i7 * (1 - (o6 = 6 * t6 - (n5 = Math.floor(6 * t6))) * e5), p7 = i7 * (1 - (1 - o6) * e5), n5 % 6) {
            case 0:
              s7 = i7, a6 = p7, r6 = h7;
              break;
            case 1:
              s7 = l7, a6 = i7, r6 = h7;
              break;
            case 2:
              s7 = h7, a6 = i7, r6 = p7;
              break;
            case 3:
              s7 = h7, a6 = l7, r6 = i7;
              break;
            case 4:
              s7 = p7, a6 = h7, r6 = i7;
              break;
            case 5:
              s7 = i7, a6 = h7, r6 = l7;
          }
          return [s7, a6, r6];
        }
        function R2(t6, e5, i7) {
          var s7, a6 = Math.max(t6, e5, i7), r6 = Math.min(t6, e5, i7), n5 = a6 - r6, o6 = 0 === a6 ? 0 : n5 / a6, h7 = a6 / 255;
          switch (a6) {
            case r6:
              s7 = 0;
              break;
            case t6:
              s7 = e5 - i7 + n5 * (e5 < i7 ? 6 : 0), s7 /= 6 * n5;
              break;
            case e5:
              s7 = i7 - t6 + 2 * n5, s7 /= 6 * n5;
              break;
            case i7:
              s7 = t6 - e5 + 4 * n5, s7 /= 6 * n5;
          }
          return [s7, o6, h7];
        }
        function V4(t6, e5) {
          var i7 = R2(255 * t6[0], 255 * t6[1], 255 * t6[2]);
          return i7[1] += e5, i7[1] > 1 ? i7[1] = 1 : i7[1] <= 0 && (i7[1] = 0), O3(i7[0], i7[1], i7[2]);
        }
        function N4(t6, e5) {
          var i7 = R2(255 * t6[0], 255 * t6[1], 255 * t6[2]);
          return i7[2] += e5, i7[2] > 1 ? i7[2] = 1 : i7[2] < 0 && (i7[2] = 0), O3(i7[0], i7[1], i7[2]);
        }
        function z5(t6, e5) {
          var i7 = R2(255 * t6[0], 255 * t6[1], 255 * t6[2]);
          return i7[0] += e5 / 360, i7[0] > 1 ? i7[0] -= 1 : i7[0] < 0 && (i7[0] += 1), O3(i7[0], i7[1], i7[2]);
        }
        var j5 = function() {
          var t6, e5, i7 = [];
          for (t6 = 0; t6 < 256; t6 += 1) e5 = t6.toString(16), i7[t6] = 1 === e5.length ? "0" + e5 : e5;
          return function(t7, e6, s7) {
            return t7 < 0 && (t7 = 0), e6 < 0 && (e6 = 0), s7 < 0 && (s7 = 0), "#" + i7[t7] + i7[e6] + i7[s7];
          };
        }(), B4 = function(t6) {
          u5 = !!t6;
        }, q5 = function() {
          return u5;
        }, W2 = function(t6) {
          g7 = t6;
        }, $2 = function() {
          return g7;
        }, H3 = function(t6) {
          S3 = t6;
        }, G3 = function() {
          return S3;
        }, X2 = function(t6) {
          v5 = t6;
        };
        function U2(e5) {
          return document.createElementNS(t5, e5);
        }
        function Y(t6) {
          return Y = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t7) {
            return typeof t7;
          } : function(t7) {
            return t7 && "function" == typeof Symbol && t7.constructor === Symbol && t7 !== Symbol.prototype ? "symbol" : typeof t7;
          }, Y(t6);
        }
        var Z = /* @__PURE__ */ function() {
          var t6, e5, i7 = 1, s7 = [], a6 = { onmessage: function() {
          }, postMessage: function(e6) {
            t6({ data: e6 });
          } }, r6 = { postMessage: function(t7) {
            a6.onmessage({ data: t7 });
          } };
          function o6(e6) {
            if (window.Worker && window.Blob && n4()) {
              var i8 = new Blob(["var _workerSelf = self; self.onmessage = ", e6.toString()], { type: "text/javascript" }), s8 = URL.createObjectURL(i8);
              return new Worker(s8);
            }
            return t6 = e6, a6;
          }
          function h7() {
            e5 || ((e5 = o6(function(t7) {
              function e6() {
                function t8(e8, i10) {
                  var n6, o8, h9, l9, p9, d9, f8 = e8.length;
                  for (o8 = 0; o8 < f8; o8 += 1) if ("ks" in (n6 = e8[o8]) && !n6.completed) {
                    if (n6.completed = true, n6.hasMask) {
                      var m7 = n6.masksProperties;
                      for (l9 = m7.length, h9 = 0; h9 < l9; h9 += 1) if (m7[h9].pt.k.i) r7(m7[h9].pt.k);
                      else for (d9 = m7[h9].pt.k.length, p9 = 0; p9 < d9; p9 += 1) m7[h9].pt.k[p9].s && r7(m7[h9].pt.k[p9].s[0]), m7[h9].pt.k[p9].e && r7(m7[h9].pt.k[p9].e[0]);
                    }
                    0 === n6.ty ? (n6.layers = s8(n6.refId, i10), t8(n6.layers, i10)) : 4 === n6.ty ? a7(n6.shapes) : 5 === n6.ty && c6(n6);
                  }
                }
                function e7(e8, i10) {
                  if (e8) {
                    var a8 = 0, r8 = e8.length;
                    for (a8 = 0; a8 < r8; a8 += 1) 1 === e8[a8].t && (e8[a8].data.layers = s8(e8[a8].data.refId, i10), t8(e8[a8].data.layers, i10));
                  }
                }
                function i9(t9, e8) {
                  for (var i10 = 0, s9 = e8.length; i10 < s9; ) {
                    if (e8[i10].id === t9) return e8[i10];
                    i10 += 1;
                  }
                  return null;
                }
                function s8(t9, e8) {
                  var s9 = i9(t9, e8);
                  return s9 ? s9.layers.__used ? JSON.parse(JSON.stringify(s9.layers)) : (s9.layers.__used = true, s9.layers) : null;
                }
                function a7(t9) {
                  var e8, i10, s9;
                  for (e8 = t9.length - 1; e8 >= 0; e8 -= 1) if ("sh" === t9[e8].ty) if (t9[e8].ks.k.i) r7(t9[e8].ks.k);
                  else for (s9 = t9[e8].ks.k.length, i10 = 0; i10 < s9; i10 += 1) t9[e8].ks.k[i10].s && r7(t9[e8].ks.k[i10].s[0]), t9[e8].ks.k[i10].e && r7(t9[e8].ks.k[i10].e[0]);
                  else "gr" === t9[e8].ty && a7(t9[e8].it);
                }
                function r7(t9) {
                  var e8, i10 = t9.i.length;
                  for (e8 = 0; e8 < i10; e8 += 1) t9.i[e8][0] += t9.v[e8][0], t9.i[e8][1] += t9.v[e8][1], t9.o[e8][0] += t9.v[e8][0], t9.o[e8][1] += t9.v[e8][1];
                }
                function n5(t9, e8) {
                  var i10 = e8 ? e8.split(".") : [100, 100, 100];
                  return t9[0] > i10[0] || !(i10[0] > t9[0]) && (t9[1] > i10[1] || !(i10[1] > t9[1]) && (t9[2] > i10[2] || !(i10[2] > t9[2]) && null));
                }
                var o7, h8 = /* @__PURE__ */ function() {
                  var t9 = [4, 4, 14];
                  function e8(t10) {
                    var e9 = t10.t.d;
                    t10.t.d = { k: [{ s: e9, t: 0 }] };
                  }
                  function i10(t10) {
                    var i11, s9 = t10.length;
                    for (i11 = 0; i11 < s9; i11 += 1) 5 === t10[i11].ty && e8(t10[i11]);
                  }
                  return function(e9) {
                    if (n5(t9, e9.v) && (i10(e9.layers), e9.assets)) {
                      var s9, a8 = e9.assets.length;
                      for (s9 = 0; s9 < a8; s9 += 1) e9.assets[s9].layers && i10(e9.assets[s9].layers);
                    }
                  };
                }(), l8 = (o7 = [4, 7, 99], function(t9) {
                  if (t9.chars && !n5(o7, t9.v)) {
                    var e8, i10 = t9.chars.length;
                    for (e8 = 0; e8 < i10; e8 += 1) {
                      var s9 = t9.chars[e8];
                      s9.data && s9.data.shapes && (a7(s9.data.shapes), s9.data.ip = 0, s9.data.op = 99999, s9.data.st = 0, s9.data.sr = 1, s9.data.ks = { p: { k: [0, 0], a: 0 }, s: { k: [100, 100], a: 0 }, a: { k: [0, 0], a: 0 }, r: { k: 0, a: 0 }, o: { k: 100, a: 0 } }, t9.chars[e8].t || (s9.data.shapes.push({ ty: "no" }), s9.data.shapes[0].it.push({ p: { k: [0, 0], a: 0 }, s: { k: [100, 100], a: 0 }, a: { k: [0, 0], a: 0 }, r: { k: 0, a: 0 }, o: { k: 100, a: 0 }, sk: { k: 0, a: 0 }, sa: { k: 0, a: 0 }, ty: "tr" })));
                    }
                  }
                }), p8 = /* @__PURE__ */ function() {
                  var t9 = [5, 7, 15];
                  function e8(t10) {
                    var e9 = t10.t.p;
                    "number" == typeof e9.a && (e9.a = { a: 0, k: e9.a }), "number" == typeof e9.p && (e9.p = { a: 0, k: e9.p }), "number" == typeof e9.r && (e9.r = { a: 0, k: e9.r });
                  }
                  function i10(t10) {
                    var i11, s9 = t10.length;
                    for (i11 = 0; i11 < s9; i11 += 1) 5 === t10[i11].ty && e8(t10[i11]);
                  }
                  return function(e9) {
                    if (n5(t9, e9.v) && (i10(e9.layers), e9.assets)) {
                      var s9, a8 = e9.assets.length;
                      for (s9 = 0; s9 < a8; s9 += 1) e9.assets[s9].layers && i10(e9.assets[s9].layers);
                    }
                  };
                }(), d8 = /* @__PURE__ */ function() {
                  var t9 = [4, 1, 9];
                  function e8(t10) {
                    var i11, s9, a8, r8 = t10.length;
                    for (i11 = 0; i11 < r8; i11 += 1) if ("gr" === t10[i11].ty) e8(t10[i11].it);
                    else if ("fl" === t10[i11].ty || "st" === t10[i11].ty) if (t10[i11].c.k && t10[i11].c.k[0].i) for (a8 = t10[i11].c.k.length, s9 = 0; s9 < a8; s9 += 1) t10[i11].c.k[s9].s && (t10[i11].c.k[s9].s[0] /= 255, t10[i11].c.k[s9].s[1] /= 255, t10[i11].c.k[s9].s[2] /= 255, t10[i11].c.k[s9].s[3] /= 255), t10[i11].c.k[s9].e && (t10[i11].c.k[s9].e[0] /= 255, t10[i11].c.k[s9].e[1] /= 255, t10[i11].c.k[s9].e[2] /= 255, t10[i11].c.k[s9].e[3] /= 255);
                    else t10[i11].c.k[0] /= 255, t10[i11].c.k[1] /= 255, t10[i11].c.k[2] /= 255, t10[i11].c.k[3] /= 255;
                  }
                  function i10(t10) {
                    var i11, s9 = t10.length;
                    for (i11 = 0; i11 < s9; i11 += 1) 4 === t10[i11].ty && e8(t10[i11].shapes);
                  }
                  return function(e9) {
                    if (n5(t9, e9.v) && (i10(e9.layers), e9.assets)) {
                      var s9, a8 = e9.assets.length;
                      for (s9 = 0; s9 < a8; s9 += 1) e9.assets[s9].layers && i10(e9.assets[s9].layers);
                    }
                  };
                }(), f7 = /* @__PURE__ */ function() {
                  var t9 = [4, 4, 18];
                  function e8(t10) {
                    var i11, s9, a8;
                    for (i11 = t10.length - 1; i11 >= 0; i11 -= 1) if ("sh" === t10[i11].ty) if (t10[i11].ks.k.i) t10[i11].ks.k.c = t10[i11].closed;
                    else for (a8 = t10[i11].ks.k.length, s9 = 0; s9 < a8; s9 += 1) t10[i11].ks.k[s9].s && (t10[i11].ks.k[s9].s[0].c = t10[i11].closed), t10[i11].ks.k[s9].e && (t10[i11].ks.k[s9].e[0].c = t10[i11].closed);
                    else "gr" === t10[i11].ty && e8(t10[i11].it);
                  }
                  function i10(t10) {
                    var i11, s9, a8, r8, n6, o8, h9 = t10.length;
                    for (s9 = 0; s9 < h9; s9 += 1) {
                      if ((i11 = t10[s9]).hasMask) {
                        var l9 = i11.masksProperties;
                        for (r8 = l9.length, a8 = 0; a8 < r8; a8 += 1) if (l9[a8].pt.k.i) l9[a8].pt.k.c = l9[a8].cl;
                        else for (o8 = l9[a8].pt.k.length, n6 = 0; n6 < o8; n6 += 1) l9[a8].pt.k[n6].s && (l9[a8].pt.k[n6].s[0].c = l9[a8].cl), l9[a8].pt.k[n6].e && (l9[a8].pt.k[n6].e[0].c = l9[a8].cl);
                      }
                      4 === i11.ty && e8(i11.shapes);
                    }
                  }
                  return function(e9) {
                    if (n5(t9, e9.v) && (i10(e9.layers), e9.assets)) {
                      var s9, a8 = e9.assets.length;
                      for (s9 = 0; s9 < a8; s9 += 1) e9.assets[s9].layers && i10(e9.assets[s9].layers);
                    }
                  };
                }();
                function m6(i10) {
                  i10.__complete || (d8(i10), h8(i10), l8(i10), p8(i10), f7(i10), t8(i10.layers, i10.assets), e7(i10.chars, i10.assets), i10.__complete = true);
                }
                function c6(t9) {
                  0 === t9.t.a.length && t9.t.p;
                }
                var u6 = {};
                return u6.completeData = m6, u6.checkColors = d8, u6.checkChars = l8, u6.checkPathProperties = p8, u6.checkShapes = f7, u6.completeLayers = t8, u6;
              }
              if (r6.dataManager || (r6.dataManager = e6()), r6.assetLoader || (r6.assetLoader = /* @__PURE__ */ function() {
                function t8(t9) {
                  var e8 = t9.getResponseHeader("content-type");
                  return e8 && "json" === t9.responseType && -1 !== e8.indexOf("json") || t9.response && "object" === Y(t9.response) ? t9.response : t9.response && "string" == typeof t9.response ? JSON.parse(t9.response) : t9.responseText ? JSON.parse(t9.responseText) : null;
                }
                function e7(e8, i9, s8, a7) {
                  var r7, n5 = new XMLHttpRequest();
                  try {
                    n5.responseType = "json";
                  } catch (t9) {
                  }
                  n5.onreadystatechange = function() {
                    if (4 === n5.readyState) if (200 === n5.status) r7 = t8(n5), s8(r7);
                    else try {
                      r7 = t8(n5), s8(r7);
                    } catch (t9) {
                      a7 && a7(t9);
                    }
                  };
                  try {
                    n5.open(["G", "E", "T"].join(""), e8, true);
                  } catch (t9) {
                    n5.open(["G", "E", "T"].join(""), i9 + "/" + e8, true);
                  }
                  n5.send();
                }
                return { load: e7 };
              }()), "loadAnimation" === t7.data.type) r6.assetLoader.load(t7.data.path, t7.data.fullPath, function(e7) {
                r6.dataManager.completeData(e7), r6.postMessage({ id: t7.data.id, payload: e7, status: "success" });
              }, function() {
                r6.postMessage({ id: t7.data.id, status: "error" });
              });
              else if ("complete" === t7.data.type) {
                var i8 = t7.data.animation;
                r6.dataManager.completeData(i8), r6.postMessage({ id: t7.data.id, payload: i8, status: "success" });
              } else "loadData" === t7.data.type && r6.assetLoader.load(t7.data.path, t7.data.fullPath, function(e7) {
                r6.postMessage({ id: t7.data.id, payload: e7, status: "success" });
              }, function() {
                r6.postMessage({ id: t7.data.id, status: "error" });
              });
            })).onmessage = function(t7) {
              var e6 = t7.data, i8 = e6.id, a7 = s7[i8];
              s7[i8] = null, "success" === e6.status ? a7.onComplete(e6.payload) : a7.onError && a7.onError();
            });
          }
          function l7(t7, e6) {
            var a7 = "processId_" + (i7 += 1);
            return s7[a7] = { onComplete: t7, onError: e6 }, a7;
          }
          function p7(t7, i8, s8) {
            h7();
            var a7 = l7(i8, s8);
            e5.postMessage({ type: "loadAnimation", path: t7, fullPath: window.location.origin + window.location.pathname, id: a7 });
          }
          function d7(t7, i8, s8) {
            h7();
            var a7 = l7(i8, s8);
            e5.postMessage({ type: "loadData", path: t7, fullPath: window.location.origin + window.location.pathname, id: a7 });
          }
          function f6(t7, i8, s8) {
            h7();
            var a7 = l7(i8, s8);
            e5.postMessage({ type: "complete", animation: t7, id: a7 });
          }
          return { loadAnimation: p7, loadData: d7, completeAnimation: f6 };
        }(), J3 = function() {
          var t6 = function() {
            var t7 = l6("canvas");
            t7.width = 1, t7.height = 1;
            var e6 = t7.getContext("2d");
            return e6.fillStyle = "rgba(0,0,0,0)", e6.fillRect(0, 0, 1, 1), t7;
          }();
          function e5() {
            this.loadedAssets += 1, this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages && this.imagesLoadedCb && this.imagesLoadedCb(null);
          }
          function i7() {
            this.loadedFootagesCount += 1, this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages && this.imagesLoadedCb && this.imagesLoadedCb(null);
          }
          function s7(t7, e6, i8) {
            var s8 = "";
            if (t7.e) s8 = t7.p;
            else if (e6) {
              var a7 = t7.p;
              -1 !== a7.indexOf("images/") && (a7 = a7.split("/")[1]), s8 = e6 + a7;
            } else s8 = i8, s8 += t7.u ? t7.u : "", s8 += t7.p;
            return s8;
          }
          function a6(t7) {
            var e6 = 0, i8 = setInterval((function() {
              (t7.getBBox().width || e6 > 500) && (this._imageLoaded(), clearInterval(i8)), e6 += 1;
            }).bind(this), 50);
          }
          function r6(e6) {
            var i8 = s7(e6, this.assetsPath, this.path), a7 = U2("image");
            y6 ? this.testImageLoaded(a7) : a7.addEventListener("load", this._imageLoaded, false), a7.addEventListener("error", (function() {
              r7.img = t6, this._imageLoaded();
            }).bind(this), false), a7.setAttributeNS("http://www.w3.org/1999/xlink", "href", i8), this._elementHelper.append ? this._elementHelper.append(a7) : this._elementHelper.appendChild(a7);
            var r7 = { img: a7, assetData: e6 };
            return r7;
          }
          function n5(e6) {
            var i8 = s7(e6, this.assetsPath, this.path), a7 = l6("img");
            a7.crossOrigin = "anonymous", a7.addEventListener("load", this._imageLoaded, false), a7.addEventListener("error", (function() {
              r7.img = t6, this._imageLoaded();
            }).bind(this), false), a7.src = i8;
            var r7 = { img: a7, assetData: e6 };
            return r7;
          }
          function o6(t7) {
            var e6 = { assetData: t7 }, i8 = s7(t7, this.assetsPath, this.path);
            return Z.loadData(i8, (function(t8) {
              e6.img = t8, this._footageLoaded();
            }).bind(this), (function() {
              e6.img = {}, this._footageLoaded();
            }).bind(this)), e6;
          }
          function h7(t7, e6) {
            var i8;
            this.imagesLoadedCb = e6;
            var s8 = t7.length;
            for (i8 = 0; i8 < s8; i8 += 1) t7[i8].layers || (t7[i8].t && "seq" !== t7[i8].t ? 3 === t7[i8].t && (this.totalFootages += 1, this.images.push(this.createFootageData(t7[i8]))) : (this.totalImages += 1, this.images.push(this._createImageData(t7[i8]))));
          }
          function p7(t7) {
            this.path = t7 || "";
          }
          function d7(t7) {
            this.assetsPath = t7 || "";
          }
          function f6(t7) {
            for (var e6 = 0, i8 = this.images.length; e6 < i8; ) {
              if (this.images[e6].assetData === t7) return this.images[e6].img;
              e6 += 1;
            }
            return null;
          }
          function m6() {
            this.imagesLoadedCb = null, this.images.length = 0;
          }
          function c6() {
            return this.totalImages === this.loadedAssets;
          }
          function u6() {
            return this.totalFootages === this.loadedFootagesCount;
          }
          function g8(t7, e6) {
            "svg" === t7 ? (this._elementHelper = e6, this._createImageData = this.createImageData.bind(this)) : this._createImageData = this.createImgData.bind(this);
          }
          function v6() {
            this._imageLoaded = e5.bind(this), this._footageLoaded = i7.bind(this), this.testImageLoaded = a6.bind(this), this.createFootageData = o6.bind(this), this.assetsPath = "", this.path = "", this.totalImages = 0, this.totalFootages = 0, this.loadedAssets = 0, this.loadedFootagesCount = 0, this.imagesLoadedCb = null, this.images = [];
          }
          return v6.prototype = { loadAssets: h7, setAssetsPath: d7, setPath: p7, loadedImages: c6, loadedFootages: u6, destroy: m6, getAsset: f6, createImgData: n5, createImageData: r6, imageLoaded: e5, footageLoaded: i7, setCacheType: g8 }, v6;
        }();
        function K2() {
        }
        K2.prototype = { triggerEvent: function(t6, e5) {
          if (this._cbs[t6]) for (var i7 = this._cbs[t6], s7 = 0; s7 < i7.length; s7 += 1) i7[s7](e5);
        }, addEventListener: function(t6, e5) {
          return this._cbs[t6] || (this._cbs[t6] = []), this._cbs[t6].push(e5), (function() {
            this.removeEventListener(t6, e5);
          }).bind(this);
        }, removeEventListener: function(t6, e5) {
          if (e5) {
            if (this._cbs[t6]) {
              for (var i7 = 0, s7 = this._cbs[t6].length; i7 < s7; ) this._cbs[t6][i7] === e5 && (this._cbs[t6].splice(i7, 1), i7 -= 1, s7 -= 1), i7 += 1;
              this._cbs[t6].length || (this._cbs[t6] = null);
            }
          } else this._cbs[t6] = null;
        } };
        var Q2 = /* @__PURE__ */ function() {
          function t6(t7) {
            for (var e5, i7 = t7.split("\r\n"), s7 = {}, a6 = 0, r6 = 0; r6 < i7.length; r6 += 1) 2 === (e5 = i7[r6].split(":")).length && (s7[e5[0]] = e5[1].trim(), a6 += 1);
            if (0 === a6) throw new Error();
            return s7;
          }
          return function(e5) {
            for (var i7 = [], s7 = 0; s7 < e5.length; s7 += 1) {
              var a6 = e5[s7], r6 = { time: a6.tm, duration: a6.dr };
              try {
                r6.payload = JSON.parse(e5[s7].cm);
              } catch (i8) {
                try {
                  r6.payload = t6(e5[s7].cm);
                } catch (t7) {
                  r6.payload = { name: e5[s7].cm };
                }
              }
              i7.push(r6);
            }
            return i7;
          };
        }(), tt = /* @__PURE__ */ function() {
          function t6(t7) {
            this.compositions.push(t7);
          }
          return function() {
            function e5(t7) {
              for (var e6 = 0, i7 = this.compositions.length; e6 < i7; ) {
                if (this.compositions[e6].data && this.compositions[e6].data.nm === t7) return this.compositions[e6].prepareFrame && this.compositions[e6].data.xt && this.compositions[e6].prepareFrame(this.currentFrame), this.compositions[e6].compInterface;
                e6 += 1;
              }
              return null;
            }
            return e5.compositions = [], e5.currentFrame = 0, e5.registerComposition = t6, e5;
          };
        }(), et = {}, it = function(t6, e5) {
          et[t6] = e5;
        };
        function st(t6) {
          return et[t6];
        }
        function at() {
          if (et.canvas) return "canvas";
          for (var t6 in et) if (et[t6]) return t6;
          return "";
        }
        function rt(t6) {
          return rt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t7) {
            return typeof t7;
          } : function(t7) {
            return t7 && "function" == typeof Symbol && t7.constructor === Symbol && t7 !== Symbol.prototype ? "symbol" : typeof t7;
          }, rt(t6);
        }
        var nt = function() {
          this._cbs = [], this.name = "", this.path = "", this.isLoaded = false, this.currentFrame = 0, this.currentRawFrame = 0, this.firstFrame = 0, this.totalFrames = 0, this.frameRate = 0, this.frameMult = 0, this.playSpeed = 1, this.playDirection = 1, this.playCount = 0, this.animationData = {}, this.assets = [], this.isPaused = true, this.autoplay = false, this.loop = true, this.renderer = null, this.animationID = L3(), this.assetsPath = "", this.timeCompleted = 0, this.segmentPos = 0, this.isSubframeEnabled = q5(), this.segments = [], this._idle = true, this._completedLoop = false, this.projectInterface = tt(), this.imagePreloader = new J3(), this.audioController = f5(), this.markers = [], this.configAnimation = this.configAnimation.bind(this), this.onSetupError = this.onSetupError.bind(this), this.onSegmentComplete = this.onSegmentComplete.bind(this), this.drawnFrameEvent = new C4("drawnFrame", 0, 0, 0), this.expressionsPlugin = $2();
        };
        p6([K2], nt), nt.prototype.setParams = function(t6) {
          (t6.wrapper || t6.container) && (this.wrapper = t6.wrapper || t6.container);
          var e5 = "svg";
          t6.animType ? e5 = t6.animType : t6.renderer && (e5 = t6.renderer);
          var i7 = st(e5);
          this.renderer = new i7(this, t6.rendererSettings), this.imagePreloader.setCacheType(e5, this.renderer.globalData.defs), this.renderer.setProjectInterface(this.projectInterface), this.animType = e5, "" === t6.loop || null === t6.loop || void 0 === t6.loop || true === t6.loop ? this.loop = true : false === t6.loop ? this.loop = false : this.loop = parseInt(t6.loop, 10), this.autoplay = !("autoplay" in t6) || t6.autoplay, this.name = t6.name ? t6.name : "", this.autoloadSegments = !Object.prototype.hasOwnProperty.call(t6, "autoloadSegments") || t6.autoloadSegments, this.assetsPath = t6.assetsPath, this.initialSegment = t6.initialSegment, t6.audioFactory && this.audioController.setAudioFactory(t6.audioFactory), t6.animationData ? this.setupAnimation(t6.animationData) : t6.path && (-1 !== t6.path.lastIndexOf("\\") ? this.path = t6.path.substr(0, t6.path.lastIndexOf("\\") + 1) : this.path = t6.path.substr(0, t6.path.lastIndexOf("/") + 1), this.fileName = t6.path.substr(t6.path.lastIndexOf("/") + 1), this.fileName = this.fileName.substr(0, this.fileName.lastIndexOf(".json")), Z.loadAnimation(t6.path, this.configAnimation, this.onSetupError));
        }, nt.prototype.onSetupError = function() {
          this.trigger("data_failed");
        }, nt.prototype.setupAnimation = function(t6) {
          Z.completeAnimation(t6, this.configAnimation);
        }, nt.prototype.setData = function(t6, e5) {
          e5 && "object" !== rt(e5) && (e5 = JSON.parse(e5));
          var i7 = { wrapper: t6, animationData: e5 }, s7 = t6.attributes;
          i7.path = s7.getNamedItem("data-animation-path") ? s7.getNamedItem("data-animation-path").value : s7.getNamedItem("data-bm-path") ? s7.getNamedItem("data-bm-path").value : s7.getNamedItem("bm-path") ? s7.getNamedItem("bm-path").value : "", i7.animType = s7.getNamedItem("data-anim-type") ? s7.getNamedItem("data-anim-type").value : s7.getNamedItem("data-bm-type") ? s7.getNamedItem("data-bm-type").value : s7.getNamedItem("bm-type") ? s7.getNamedItem("bm-type").value : s7.getNamedItem("data-bm-renderer") ? s7.getNamedItem("data-bm-renderer").value : s7.getNamedItem("bm-renderer") ? s7.getNamedItem("bm-renderer").value : at() || "canvas";
          var a6 = s7.getNamedItem("data-anim-loop") ? s7.getNamedItem("data-anim-loop").value : s7.getNamedItem("data-bm-loop") ? s7.getNamedItem("data-bm-loop").value : s7.getNamedItem("bm-loop") ? s7.getNamedItem("bm-loop").value : "";
          "false" === a6 ? i7.loop = false : "true" === a6 ? i7.loop = true : "" !== a6 && (i7.loop = parseInt(a6, 10));
          var r6 = s7.getNamedItem("data-anim-autoplay") ? s7.getNamedItem("data-anim-autoplay").value : s7.getNamedItem("data-bm-autoplay") ? s7.getNamedItem("data-bm-autoplay").value : !s7.getNamedItem("bm-autoplay") || s7.getNamedItem("bm-autoplay").value;
          i7.autoplay = "false" !== r6, i7.name = s7.getNamedItem("data-name") ? s7.getNamedItem("data-name").value : s7.getNamedItem("data-bm-name") ? s7.getNamedItem("data-bm-name").value : s7.getNamedItem("bm-name") ? s7.getNamedItem("bm-name").value : "", "false" === (s7.getNamedItem("data-anim-prerender") ? s7.getNamedItem("data-anim-prerender").value : s7.getNamedItem("data-bm-prerender") ? s7.getNamedItem("data-bm-prerender").value : s7.getNamedItem("bm-prerender") ? s7.getNamedItem("bm-prerender").value : "") && (i7.prerender = false), i7.path ? this.setParams(i7) : this.trigger("destroy");
        }, nt.prototype.includeLayers = function(t6) {
          t6.op > this.animationData.op && (this.animationData.op = t6.op, this.totalFrames = Math.floor(t6.op - this.animationData.ip));
          var e5, i7, s7 = this.animationData.layers, a6 = s7.length, r6 = t6.layers, n5 = r6.length;
          for (i7 = 0; i7 < n5; i7 += 1) for (e5 = 0; e5 < a6; ) {
            if (s7[e5].id === r6[i7].id) {
              s7[e5] = r6[i7];
              break;
            }
            e5 += 1;
          }
          if ((t6.chars || t6.fonts) && (this.renderer.globalData.fontManager.addChars(t6.chars), this.renderer.globalData.fontManager.addFonts(t6.fonts, this.renderer.globalData.defs)), t6.assets) for (a6 = t6.assets.length, e5 = 0; e5 < a6; e5 += 1) this.animationData.assets.push(t6.assets[e5]);
          this.animationData.__complete = false, Z.completeAnimation(this.animationData, this.onSegmentComplete);
        }, nt.prototype.onSegmentComplete = function(t6) {
          this.animationData = t6;
          var e5 = $2();
          e5 && e5.initExpressions(this), this.loadNextSegment();
        }, nt.prototype.loadNextSegment = function() {
          var t6 = this.animationData.segments;
          if (!t6 || 0 === t6.length || !this.autoloadSegments) return this.trigger("data_ready"), void (this.timeCompleted = this.totalFrames);
          var e5 = t6.shift();
          this.timeCompleted = e5.time * this.frameRate;
          var i7 = this.path + this.fileName + "_" + this.segmentPos + ".json";
          this.segmentPos += 1, Z.loadData(i7, this.includeLayers.bind(this), (function() {
            this.trigger("data_failed");
          }).bind(this));
        }, nt.prototype.loadSegments = function() {
          this.animationData.segments || (this.timeCompleted = this.totalFrames), this.loadNextSegment();
        }, nt.prototype.imagesLoaded = function() {
          this.trigger("loaded_images"), this.checkLoaded();
        }, nt.prototype.preloadImages = function() {
          this.imagePreloader.setAssetsPath(this.assetsPath), this.imagePreloader.setPath(this.path), this.imagePreloader.loadAssets(this.animationData.assets, this.imagesLoaded.bind(this));
        }, nt.prototype.configAnimation = function(t6) {
          if (this.renderer) try {
            this.animationData = t6, this.initialSegment ? (this.totalFrames = Math.floor(this.initialSegment[1] - this.initialSegment[0]), this.firstFrame = Math.round(this.initialSegment[0])) : (this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip), this.firstFrame = Math.round(this.animationData.ip)), this.renderer.configAnimation(t6), t6.assets || (t6.assets = []), this.assets = this.animationData.assets, this.frameRate = this.animationData.fr, this.frameMult = this.animationData.fr / 1e3, this.renderer.searchExtraCompositions(t6.assets), this.markers = Q2(t6.markers || []), this.trigger("config_ready"), this.preloadImages(), this.loadSegments(), this.updaFrameModifier(), this.waitForFontsLoaded(), this.isPaused && this.audioController.pause();
          } catch (t7) {
            this.triggerConfigError(t7);
          }
        }, nt.prototype.waitForFontsLoaded = function() {
          this.renderer && (this.renderer.globalData.fontManager.isLoaded ? this.checkLoaded() : setTimeout(this.waitForFontsLoaded.bind(this), 20));
        }, nt.prototype.checkLoaded = function() {
          if (!this.isLoaded && this.renderer.globalData.fontManager.isLoaded && (this.imagePreloader.loadedImages() || "canvas" !== this.renderer.rendererType) && this.imagePreloader.loadedFootages()) {
            this.isLoaded = true;
            var t6 = $2();
            t6 && t6.initExpressions(this), this.renderer.initItems(), setTimeout((function() {
              this.trigger("DOMLoaded");
            }).bind(this), 0), this.gotoFrame(), this.autoplay && this.play();
          }
        }, nt.prototype.resize = function(t6, e5) {
          var i7 = "number" == typeof t6 ? t6 : void 0, s7 = "number" == typeof e5 ? e5 : void 0;
          this.renderer.updateContainerSize(i7, s7);
        }, nt.prototype.setSubframe = function(t6) {
          this.isSubframeEnabled = !!t6;
        }, nt.prototype.gotoFrame = function() {
          this.currentFrame = this.isSubframeEnabled ? this.currentRawFrame : ~~this.currentRawFrame, this.timeCompleted !== this.totalFrames && this.currentFrame > this.timeCompleted && (this.currentFrame = this.timeCompleted), this.trigger("enterFrame"), this.renderFrame(), this.trigger("drawnFrame");
        }, nt.prototype.renderFrame = function() {
          if (false !== this.isLoaded && this.renderer) try {
            this.expressionsPlugin && this.expressionsPlugin.resetFrame(), this.renderer.renderFrame(this.currentFrame + this.firstFrame);
          } catch (t6) {
            this.triggerRenderFrameError(t6);
          }
        }, nt.prototype.play = function(t6) {
          t6 && this.name !== t6 || true === this.isPaused && (this.isPaused = false, this.trigger("_play"), this.audioController.resume(), this._idle && (this._idle = false, this.trigger("_active")));
        }, nt.prototype.pause = function(t6) {
          t6 && this.name !== t6 || false === this.isPaused && (this.isPaused = true, this.trigger("_pause"), this._idle = true, this.trigger("_idle"), this.audioController.pause());
        }, nt.prototype.togglePause = function(t6) {
          t6 && this.name !== t6 || (true === this.isPaused ? this.play() : this.pause());
        }, nt.prototype.stop = function(t6) {
          t6 && this.name !== t6 || (this.pause(), this.playCount = 0, this._completedLoop = false, this.setCurrentRawFrameValue(0));
        }, nt.prototype.getMarkerData = function(t6) {
          for (var e5, i7 = 0; i7 < this.markers.length; i7 += 1) if ((e5 = this.markers[i7]).payload && e5.payload.name === t6) return e5;
          return null;
        }, nt.prototype.goToAndStop = function(t6, e5, i7) {
          if (!i7 || this.name === i7) {
            var s7 = Number(t6);
            if (isNaN(s7)) {
              var a6 = this.getMarkerData(t6);
              a6 && this.goToAndStop(a6.time, true);
            } else e5 ? this.setCurrentRawFrameValue(t6) : this.setCurrentRawFrameValue(t6 * this.frameModifier);
            this.pause();
          }
        }, nt.prototype.goToAndPlay = function(t6, e5, i7) {
          if (!i7 || this.name === i7) {
            var s7 = Number(t6);
            if (isNaN(s7)) {
              var a6 = this.getMarkerData(t6);
              a6 && (a6.duration ? this.playSegments([a6.time, a6.time + a6.duration], true) : this.goToAndStop(a6.time, true));
            } else this.goToAndStop(s7, e5, i7);
            this.play();
          }
        }, nt.prototype.advanceTime = function(t6) {
          if (true !== this.isPaused && false !== this.isLoaded) {
            var e5 = this.currentRawFrame + t6 * this.frameModifier, i7 = false;
            e5 >= this.totalFrames - 1 && this.frameModifier > 0 ? this.loop && this.playCount !== this.loop ? e5 >= this.totalFrames ? (this.playCount += 1, this.checkSegments(e5 % this.totalFrames) || (this.setCurrentRawFrameValue(e5 % this.totalFrames), this._completedLoop = true, this.trigger("loopComplete"))) : this.setCurrentRawFrameValue(e5) : this.checkSegments(e5 > this.totalFrames ? e5 % this.totalFrames : 0) || (i7 = true, e5 = this.totalFrames - 1) : e5 < 0 ? this.checkSegments(e5 % this.totalFrames) || (!this.loop || this.playCount-- <= 0 && true !== this.loop ? (i7 = true, e5 = 0) : (this.setCurrentRawFrameValue(this.totalFrames + e5 % this.totalFrames), this._completedLoop ? this.trigger("loopComplete") : this._completedLoop = true)) : this.setCurrentRawFrameValue(e5), i7 && (this.setCurrentRawFrameValue(e5), this.pause(), this.trigger("complete"));
          }
        }, nt.prototype.adjustSegment = function(t6, e5) {
          this.playCount = 0, t6[1] < t6[0] ? (this.frameModifier > 0 && (this.playSpeed < 0 ? this.setSpeed(-this.playSpeed) : this.setDirection(-1)), this.totalFrames = t6[0] - t6[1], this.timeCompleted = this.totalFrames, this.firstFrame = t6[1], this.setCurrentRawFrameValue(this.totalFrames - 1e-3 - e5)) : t6[1] > t6[0] && (this.frameModifier < 0 && (this.playSpeed < 0 ? this.setSpeed(-this.playSpeed) : this.setDirection(1)), this.totalFrames = t6[1] - t6[0], this.timeCompleted = this.totalFrames, this.firstFrame = t6[0], this.setCurrentRawFrameValue(1e-3 + e5)), this.trigger("segmentStart");
        }, nt.prototype.setSegment = function(t6, e5) {
          var i7 = -1;
          this.isPaused && (this.currentRawFrame + this.firstFrame < t6 ? i7 = t6 : this.currentRawFrame + this.firstFrame > e5 && (i7 = e5 - t6)), this.firstFrame = t6, this.totalFrames = e5 - t6, this.timeCompleted = this.totalFrames, -1 !== i7 && this.goToAndStop(i7, true);
        }, nt.prototype.playSegments = function(t6, e5) {
          if (e5 && (this.segments.length = 0), "object" === rt(t6[0])) {
            var i7, s7 = t6.length;
            for (i7 = 0; i7 < s7; i7 += 1) this.segments.push(t6[i7]);
          } else this.segments.push(t6);
          this.segments.length && e5 && this.adjustSegment(this.segments.shift(), 0), this.isPaused && this.play();
        }, nt.prototype.resetSegments = function(t6) {
          this.segments.length = 0, this.segments.push([this.animationData.ip, this.animationData.op]), t6 && this.checkSegments(0);
        }, nt.prototype.checkSegments = function(t6) {
          return !!this.segments.length && (this.adjustSegment(this.segments.shift(), t6), true);
        }, nt.prototype.destroy = function(t6) {
          t6 && this.name !== t6 || !this.renderer || (this.renderer.destroy(), this.imagePreloader.destroy(), this.trigger("destroy"), this._cbs = null, this.onEnterFrame = null, this.onLoopComplete = null, this.onComplete = null, this.onSegmentStart = null, this.onDestroy = null, this.renderer = null, this.expressionsPlugin = null, this.imagePreloader = null, this.projectInterface = null);
        }, nt.prototype.setCurrentRawFrameValue = function(t6) {
          this.currentRawFrame = t6, this.gotoFrame();
        }, nt.prototype.setSpeed = function(t6) {
          this.playSpeed = t6, this.updaFrameModifier();
        }, nt.prototype.setDirection = function(t6) {
          this.playDirection = t6 < 0 ? -1 : 1, this.updaFrameModifier();
        }, nt.prototype.setLoop = function(t6) {
          this.loop = t6;
        }, nt.prototype.setVolume = function(t6, e5) {
          e5 && this.name !== e5 || this.audioController.setVolume(t6);
        }, nt.prototype.getVolume = function() {
          return this.audioController.getVolume();
        }, nt.prototype.mute = function(t6) {
          t6 && this.name !== t6 || this.audioController.mute();
        }, nt.prototype.unmute = function(t6) {
          t6 && this.name !== t6 || this.audioController.unmute();
        }, nt.prototype.updaFrameModifier = function() {
          this.frameModifier = this.frameMult * this.playSpeed * this.playDirection, this.audioController.setRate(this.playSpeed * this.playDirection);
        }, nt.prototype.getPath = function() {
          return this.path;
        }, nt.prototype.getAssetsPath = function(t6) {
          var e5 = "";
          if (t6.e) e5 = t6.p;
          else if (this.assetsPath) {
            var i7 = t6.p;
            -1 !== i7.indexOf("images/") && (i7 = i7.split("/")[1]), e5 = this.assetsPath + i7;
          } else e5 = this.path, e5 += t6.u ? t6.u : "", e5 += t6.p;
          return e5;
        }, nt.prototype.getAssetData = function(t6) {
          for (var e5 = 0, i7 = this.assets.length; e5 < i7; ) {
            if (t6 === this.assets[e5].id) return this.assets[e5];
            e5 += 1;
          }
          return null;
        }, nt.prototype.hide = function() {
          this.renderer.hide();
        }, nt.prototype.show = function() {
          this.renderer.show();
        }, nt.prototype.getDuration = function(t6) {
          return t6 ? this.totalFrames : this.totalFrames / this.frameRate;
        }, nt.prototype.updateDocumentData = function(t6, e5, i7) {
          try {
            this.renderer.getElementByPath(t6).updateDocumentData(e5, i7);
          } catch (t7) {
          }
        }, nt.prototype.trigger = function(t6) {
          if (this._cbs && this._cbs[t6]) switch (t6) {
            case "enterFrame":
              this.triggerEvent(t6, new C4(t6, this.currentFrame, this.totalFrames, this.frameModifier));
              break;
            case "drawnFrame":
              this.drawnFrameEvent.currentTime = this.currentFrame, this.drawnFrameEvent.totalTime = this.totalFrames, this.drawnFrameEvent.direction = this.frameModifier, this.triggerEvent(t6, this.drawnFrameEvent);
              break;
            case "loopComplete":
              this.triggerEvent(t6, new T5(t6, this.loop, this.playCount, this.frameMult));
              break;
            case "complete":
              this.triggerEvent(t6, new P5(t6, this.frameMult));
              break;
            case "segmentStart":
              this.triggerEvent(t6, new E5(t6, this.firstFrame, this.totalFrames));
              break;
            case "destroy":
              this.triggerEvent(t6, new F5(t6, this));
              break;
            default:
              this.triggerEvent(t6);
          }
          "enterFrame" === t6 && this.onEnterFrame && this.onEnterFrame.call(this, new C4(t6, this.currentFrame, this.totalFrames, this.frameMult)), "loopComplete" === t6 && this.onLoopComplete && this.onLoopComplete.call(this, new T5(t6, this.loop, this.playCount, this.frameMult)), "complete" === t6 && this.onComplete && this.onComplete.call(this, new P5(t6, this.frameMult)), "segmentStart" === t6 && this.onSegmentStart && this.onSegmentStart.call(this, new E5(t6, this.firstFrame, this.totalFrames)), "destroy" === t6 && this.onDestroy && this.onDestroy.call(this, new F5(t6, this));
        }, nt.prototype.triggerRenderFrameError = function(t6) {
          var e5 = new x5(t6, this.currentFrame);
          this.triggerEvent("error", e5), this.onError && this.onError.call(this, e5);
        }, nt.prototype.triggerConfigError = function(t6) {
          var e5 = new M4(t6, this.currentFrame);
          this.triggerEvent("error", e5), this.onError && this.onError.call(this, e5);
        };
        var ot = function() {
          var t6 = {}, e5 = [], i7 = 0, s7 = 0, a6 = 0, r6 = true, n5 = false;
          function o6(t7) {
            for (var i8 = 0, a7 = t7.target; i8 < s7; ) e5[i8].animation === a7 && (e5.splice(i8, 1), i8 -= 1, s7 -= 1, a7.isPaused || f6()), i8 += 1;
          }
          function h7(t7, i8) {
            if (!t7) return null;
            for (var a7 = 0; a7 < s7; ) {
              if (e5[a7].elem === t7 && null !== e5[a7].elem) return e5[a7].animation;
              a7 += 1;
            }
            var r7 = new nt();
            return m6(r7, t7), r7.setData(t7, i8), r7;
          }
          function p7() {
            var t7, i8 = e5.length, s8 = [];
            for (t7 = 0; t7 < i8; t7 += 1) s8.push(e5[t7].animation);
            return s8;
          }
          function d7() {
            a6 += 1, P6();
          }
          function f6() {
            a6 -= 1;
          }
          function m6(t7, i8) {
            t7.addEventListener("destroy", o6), t7.addEventListener("_active", d7), t7.addEventListener("_idle", f6), e5.push({ elem: i8, animation: t7 }), s7 += 1;
          }
          function c6(t7) {
            var e6 = new nt();
            return m6(e6, null), e6.setParams(t7), e6;
          }
          function u6(t7, i8) {
            var a7;
            for (a7 = 0; a7 < s7; a7 += 1) e5[a7].animation.setSpeed(t7, i8);
          }
          function g8(t7, i8) {
            var a7;
            for (a7 = 0; a7 < s7; a7 += 1) e5[a7].animation.setDirection(t7, i8);
          }
          function v6(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.play(t7);
          }
          function y7(t7) {
            var o7, h8 = t7 - i7;
            for (o7 = 0; o7 < s7; o7 += 1) e5[o7].animation.advanceTime(h8);
            i7 = t7, a6 && !n5 ? window.requestAnimationFrame(y7) : r6 = true;
          }
          function b6(t7) {
            i7 = t7, window.requestAnimationFrame(y7);
          }
          function _7(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.pause(t7);
          }
          function k6(t7, i8, a7) {
            var r7;
            for (r7 = 0; r7 < s7; r7 += 1) e5[r7].animation.goToAndStop(t7, i8, a7);
          }
          function w7(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.stop(t7);
          }
          function S4(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.togglePause(t7);
          }
          function A7(t7) {
            var i8;
            for (i8 = s7 - 1; i8 >= 0; i8 -= 1) e5[i8].animation.destroy(t7);
          }
          function D5(t7, e6, i8) {
            var s8, a7 = [].concat([].slice.call(document.getElementsByClassName("lottie")), [].slice.call(document.getElementsByClassName("bodymovin"))), r7 = a7.length;
            for (s8 = 0; s8 < r7; s8 += 1) i8 && a7[s8].setAttribute("data-bm-type", i8), h7(a7[s8], t7);
            if (e6 && 0 === r7) {
              i8 || (i8 = "svg");
              var n6 = document.getElementsByTagName("body")[0];
              n6.innerText = "";
              var o7 = l6("div");
              o7.style.width = "100%", o7.style.height = "100%", o7.setAttribute("data-bm-type", i8), n6.appendChild(o7), h7(o7, t7);
            }
          }
          function C5() {
            var t7;
            for (t7 = 0; t7 < s7; t7 += 1) e5[t7].animation.resize();
          }
          function P6() {
            !n5 && a6 && r6 && (window.requestAnimationFrame(b6), r6 = false);
          }
          function T6() {
            n5 = true;
          }
          function E6() {
            n5 = false, P6();
          }
          function F6(t7, i8) {
            var a7;
            for (a7 = 0; a7 < s7; a7 += 1) e5[a7].animation.setVolume(t7, i8);
          }
          function x6(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.mute(t7);
          }
          function M5(t7) {
            var i8;
            for (i8 = 0; i8 < s7; i8 += 1) e5[i8].animation.unmute(t7);
          }
          return t6.registerAnimation = h7, t6.loadAnimation = c6, t6.setSpeed = u6, t6.setDirection = g8, t6.play = v6, t6.pause = _7, t6.stop = w7, t6.togglePause = S4, t6.searchAnimations = D5, t6.resize = C5, t6.goToAndStop = k6, t6.destroy = A7, t6.freeze = T6, t6.unfreeze = E6, t6.setVolume = F6, t6.mute = x6, t6.unmute = M5, t6.getRegisteredAnimations = p7, t6;
        }(), ht = function() {
          var t6 = {};
          t6.getBezierEasing = i7;
          var e5 = {};
          function i7(t7, i8, s8, a7, r7) {
            var n6 = r7 || ("bez_" + t7 + "_" + i8 + "_" + s8 + "_" + a7).replace(/\./g, "p");
            if (e5[n6]) return e5[n6];
            var o7 = new v6([t7, i8, s8, a7]);
            return e5[n6] = o7, o7;
          }
          var s7 = 4, a6 = 1e-3, r6 = 1e-7, n5 = 10, o6 = 11, h7 = 1 / (o6 - 1), l7 = "function" == typeof Float32Array;
          function p7(t7, e6) {
            return 1 - 3 * e6 + 3 * t7;
          }
          function d7(t7, e6) {
            return 3 * e6 - 6 * t7;
          }
          function f6(t7) {
            return 3 * t7;
          }
          function m6(t7, e6, i8) {
            return ((p7(e6, i8) * t7 + d7(e6, i8)) * t7 + f6(e6)) * t7;
          }
          function c6(t7, e6, i8) {
            return 3 * p7(e6, i8) * t7 * t7 + 2 * d7(e6, i8) * t7 + f6(e6);
          }
          function u6(t7, e6, i8, s8, a7) {
            var o7, h8, l8 = 0;
            do {
              (o7 = m6(h8 = e6 + (i8 - e6) / 2, s8, a7) - t7) > 0 ? i8 = h8 : e6 = h8;
            } while (Math.abs(o7) > r6 && ++l8 < n5);
            return h8;
          }
          function g8(t7, e6, i8, a7) {
            for (var r7 = 0; r7 < s7; ++r7) {
              var n6 = c6(e6, i8, a7);
              if (0 === n6) return e6;
              e6 -= (m6(e6, i8, a7) - t7) / n6;
            }
            return e6;
          }
          function v6(t7) {
            this._p = t7, this._mSampleValues = l7 ? new Float32Array(o6) : new Array(o6), this._precomputed = false, this.get = this.get.bind(this);
          }
          return v6.prototype = { get: function(t7) {
            var e6 = this._p[0], i8 = this._p[1], s8 = this._p[2], a7 = this._p[3];
            return this._precomputed || this._precompute(), e6 === i8 && s8 === a7 ? t7 : 0 === t7 ? 0 : 1 === t7 ? 1 : m6(this._getTForX(t7), i8, a7);
          }, _precompute: function() {
            var t7 = this._p[0], e6 = this._p[1], i8 = this._p[2], s8 = this._p[3];
            this._precomputed = true, t7 === e6 && i8 === s8 || this._calcSampleValues();
          }, _calcSampleValues: function() {
            for (var t7 = this._p[0], e6 = this._p[2], i8 = 0; i8 < o6; ++i8) this._mSampleValues[i8] = m6(i8 * h7, t7, e6);
          }, _getTForX: function(t7) {
            for (var e6 = this._p[0], i8 = this._p[2], s8 = this._mSampleValues, r7 = 0, n6 = 1, l8 = o6 - 1; n6 !== l8 && s8[n6] <= t7; ++n6) r7 += h7;
            var p8 = r7 + (t7 - s8[--n6]) / (s8[n6 + 1] - s8[n6]) * h7, d8 = c6(p8, e6, i8);
            return d8 >= a6 ? g8(t7, p8, e6, i8) : 0 === d8 ? p8 : u6(t7, r7, r7 + h7, e6, i8);
          } }, t6;
        }(), lt = /* @__PURE__ */ function() {
          function t6(t7) {
            return t7.concat(c5(t7.length));
          }
          return { double: t6 };
        }(), pt = function(t6, e5, i7) {
          var s7 = 0, a6 = t6, r6 = c5(a6);
          function n5() {
            return s7 ? r6[s7 -= 1] : e5();
          }
          function o6(t7) {
            s7 === a6 && (r6 = lt.double(r6), a6 *= 2), i7 && i7(t7), r6[s7] = t7, s7 += 1;
          }
          return { newElement: n5, release: o6 };
        }, dt = function() {
          function t6() {
            return { addedLength: 0, percents: m5("float32", G3()), lengths: m5("float32", G3()) };
          }
          return pt(8, t6);
        }(), ft = function() {
          function t6() {
            return { lengths: [], totalLength: 0 };
          }
          function e5(t7) {
            var e6, i7 = t7.lengths.length;
            for (e6 = 0; e6 < i7; e6 += 1) dt.release(t7.lengths[e6]);
            t7.lengths.length = 0;
          }
          return pt(8, t6, e5);
        }();
        function mt() {
          var t6 = Math;
          function e5(t7, e6, i8, s8, a7, r7) {
            var n6 = t7 * s8 + e6 * a7 + i8 * r7 - a7 * s8 - r7 * t7 - i8 * e6;
            return n6 > -1e-3 && n6 < 1e-3;
          }
          function i7(i8, s8, a7, r7, n6, o7, h8, l8, p8) {
            if (0 === a7 && 0 === o7 && 0 === p8) return e5(i8, s8, r7, n6, h8, l8);
            var d8, f7 = t6.sqrt(t6.pow(r7 - i8, 2) + t6.pow(n6 - s8, 2) + t6.pow(o7 - a7, 2)), m6 = t6.sqrt(t6.pow(h8 - i8, 2) + t6.pow(l8 - s8, 2) + t6.pow(p8 - a7, 2)), c6 = t6.sqrt(t6.pow(h8 - r7, 2) + t6.pow(l8 - n6, 2) + t6.pow(p8 - o7, 2));
            return (d8 = f7 > m6 ? f7 > c6 ? f7 - m6 - c6 : c6 - m6 - f7 : c6 > m6 ? c6 - m6 - f7 : m6 - f7 - c6) > -1e-4 && d8 < 1e-4;
          }
          var s7 = function(t7, e6, i8, s8) {
            var a7, r7, n6, o7, h8, l8, p8 = G3(), d8 = 0, f7 = [], m6 = [], c6 = dt.newElement();
            for (n6 = i8.length, a7 = 0; a7 < p8; a7 += 1) {
              for (h8 = a7 / (p8 - 1), l8 = 0, r7 = 0; r7 < n6; r7 += 1) o7 = b5(1 - h8, 3) * t7[r7] + 3 * b5(1 - h8, 2) * h8 * i8[r7] + 3 * (1 - h8) * b5(h8, 2) * s8[r7] + b5(h8, 3) * e6[r7], f7[r7] = o7, null !== m6[r7] && (l8 += b5(f7[r7] - m6[r7], 2)), m6[r7] = f7[r7];
              l8 && (d8 += l8 = _6(l8)), c6.percents[a7] = h8, c6.lengths[a7] = d8;
            }
            return c6.addedLength = d8, c6;
          };
          function a6(t7) {
            var e6, i8 = ft.newElement(), a7 = t7.c, r7 = t7.v, n6 = t7.o, o7 = t7.i, h8 = t7._length, l8 = i8.lengths, p8 = 0;
            for (e6 = 0; e6 < h8 - 1; e6 += 1) l8[e6] = s7(r7[e6], r7[e6 + 1], n6[e6], o7[e6 + 1]), p8 += l8[e6].addedLength;
            return a7 && h8 && (l8[e6] = s7(r7[e6], r7[0], n6[e6], o7[0]), p8 += l8[e6].addedLength), i8.totalLength = p8, i8;
          }
          function r6(t7) {
            this.segmentLength = 0, this.points = new Array(t7);
          }
          function n5(t7, e6) {
            this.partialLength = t7, this.point = e6;
          }
          var o6, h7 = (o6 = {}, function(t7, i8, s8, a7) {
            var h8 = (t7[0] + "_" + t7[1] + "_" + i8[0] + "_" + i8[1] + "_" + s8[0] + "_" + s8[1] + "_" + a7[0] + "_" + a7[1]).replace(/\./g, "p");
            if (!o6[h8]) {
              var l8, p8, d8, f7, m6, u6, g8, v6 = G3(), y7 = 0, k6 = null;
              2 === t7.length && (t7[0] !== i8[0] || t7[1] !== i8[1]) && e5(t7[0], t7[1], i8[0], i8[1], t7[0] + s8[0], t7[1] + s8[1]) && e5(t7[0], t7[1], i8[0], i8[1], i8[0] + a7[0], i8[1] + a7[1]) && (v6 = 2);
              var w7 = new r6(v6);
              for (d8 = s8.length, l8 = 0; l8 < v6; l8 += 1) {
                for (g8 = c5(d8), m6 = l8 / (v6 - 1), u6 = 0, p8 = 0; p8 < d8; p8 += 1) f7 = b5(1 - m6, 3) * t7[p8] + 3 * b5(1 - m6, 2) * m6 * (t7[p8] + s8[p8]) + 3 * (1 - m6) * b5(m6, 2) * (i8[p8] + a7[p8]) + b5(m6, 3) * i8[p8], g8[p8] = f7, null !== k6 && (u6 += b5(g8[p8] - k6[p8], 2));
                y7 += u6 = _6(u6), w7.points[l8] = new n5(u6, g8), k6 = g8;
              }
              w7.segmentLength = y7, o6[h8] = w7;
            }
            return o6[h8];
          });
          function l7(t7, e6) {
            var i8 = e6.percents, s8 = e6.lengths, a7 = i8.length, r7 = k5((a7 - 1) * t7), n6 = t7 * e6.addedLength, o7 = 0;
            if (r7 === a7 - 1 || 0 === r7 || n6 === s8[r7]) return i8[r7];
            for (var h8 = s8[r7] > n6 ? -1 : 1, l8 = true; l8; ) if (s8[r7] <= n6 && s8[r7 + 1] > n6 ? (o7 = (n6 - s8[r7]) / (s8[r7 + 1] - s8[r7]), l8 = false) : r7 += h8, r7 < 0 || r7 >= a7 - 1) {
              if (r7 === a7 - 1) return i8[r7];
              l8 = false;
            }
            return i8[r7] + (i8[r7 + 1] - i8[r7]) * o7;
          }
          function p7(e6, i8, s8, a7, r7, n6) {
            var o7 = l7(r7, n6), h8 = 1 - o7;
            return [t6.round(1e3 * (h8 * h8 * h8 * e6[0] + (o7 * h8 * h8 + h8 * o7 * h8 + h8 * h8 * o7) * s8[0] + (o7 * o7 * h8 + h8 * o7 * o7 + o7 * h8 * o7) * a7[0] + o7 * o7 * o7 * i8[0])) / 1e3, t6.round(1e3 * (h8 * h8 * h8 * e6[1] + (o7 * h8 * h8 + h8 * o7 * h8 + h8 * h8 * o7) * s8[1] + (o7 * o7 * h8 + h8 * o7 * o7 + o7 * h8 * o7) * a7[1] + o7 * o7 * o7 * i8[1])) / 1e3];
          }
          var d7 = m5("float32", 8);
          function f6(e6, i8, s8, a7, r7, n6, o7) {
            r7 < 0 ? r7 = 0 : r7 > 1 && (r7 = 1);
            var h8, p8 = l7(r7, o7), f7 = l7(n6 = n6 > 1 ? 1 : n6, o7), m6 = e6.length, c6 = 1 - p8, u6 = 1 - f7, g8 = c6 * c6 * c6, v6 = p8 * c6 * c6 * 3, y7 = p8 * p8 * c6 * 3, b6 = p8 * p8 * p8, _7 = c6 * c6 * u6, k6 = p8 * c6 * u6 + c6 * p8 * u6 + c6 * c6 * f7, w7 = p8 * p8 * u6 + c6 * p8 * f7 + p8 * c6 * f7, S4 = p8 * p8 * f7, A7 = c6 * u6 * u6, D5 = p8 * u6 * u6 + c6 * f7 * u6 + c6 * u6 * f7, C5 = p8 * f7 * u6 + c6 * f7 * f7 + p8 * u6 * f7, P6 = p8 * f7 * f7, T6 = u6 * u6 * u6, E6 = f7 * u6 * u6 + u6 * f7 * u6 + u6 * u6 * f7, F6 = f7 * f7 * u6 + u6 * f7 * f7 + f7 * u6 * f7, x6 = f7 * f7 * f7;
            for (h8 = 0; h8 < m6; h8 += 1) d7[4 * h8] = t6.round(1e3 * (g8 * e6[h8] + v6 * s8[h8] + y7 * a7[h8] + b6 * i8[h8])) / 1e3, d7[4 * h8 + 1] = t6.round(1e3 * (_7 * e6[h8] + k6 * s8[h8] + w7 * a7[h8] + S4 * i8[h8])) / 1e3, d7[4 * h8 + 2] = t6.round(1e3 * (A7 * e6[h8] + D5 * s8[h8] + C5 * a7[h8] + P6 * i8[h8])) / 1e3, d7[4 * h8 + 3] = t6.round(1e3 * (T6 * e6[h8] + E6 * s8[h8] + F6 * a7[h8] + x6 * i8[h8])) / 1e3;
            return d7;
          }
          return { getSegmentsLength: a6, getNewSegment: f6, getPointInSegment: p7, buildBezierData: h7, pointOnLine2D: e5, pointOnLine3D: i7 };
        }
        var ct = mt();
        function ut(t6) {
          return bt(t6) || yt(t6) || vt(t6) || gt();
        }
        function gt() {
          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        function vt(t6, e5) {
          if (t6) {
            if ("string" == typeof t6) return _t(t6, e5);
            var i7 = Object.prototype.toString.call(t6).slice(8, -1);
            return "Object" === i7 && t6.constructor && (i7 = t6.constructor.name), "Map" === i7 || "Set" === i7 ? Array.from(t6) : "Arguments" === i7 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i7) ? _t(t6, e5) : void 0;
          }
        }
        function yt(t6) {
          if ("undefined" != typeof Symbol && null != t6[Symbol.iterator] || null != t6["@@iterator"]) return Array.from(t6);
        }
        function bt(t6) {
          if (Array.isArray(t6)) return _t(t6);
        }
        function _t(t6, e5) {
          (null == e5 || e5 > t6.length) && (e5 = t6.length);
          for (var i7 = 0, s7 = new Array(e5); i7 < e5; i7++) s7[i7] = t6[i7];
          return s7;
        }
        function kt(t6, e5, i7) {
          return t6 * (1 - i7) + e5 * i7;
        }
        function wt(t6, e5, i7) {
          return [kt(t6[0], e5[0], i7), kt(t6[1], e5[1], i7)];
        }
        function St(t6, e5) {
          return t6.map(function(t7, i7) {
            return t7 + (e5[i7] || 0);
          });
        }
        function At(t6, e5) {
          return t6.map(function(t7, i7) {
            return t7 - (e5[i7] || 0);
          });
        }
        function Dt(t6) {
          var e5 = Math.hypot.apply(Math, ut(t6));
          return e5 > Number.EPSILON ? t6.map(function(t7) {
            return t7 / e5;
          }) : t6;
        }
        function Ct(t6, e5, i7, s7, a6) {
          var r6 = [t6, St(t6, e5), St(s7, i7), s7], n5 = Pt(r6, a6), o6 = Pt(n5, a6), h7 = At(o6[1], o6[0]), l7 = Math.hypot.apply(Math, ut(h7));
          if (l7 > Number.EPSILON) return h7.map(function(t7) {
            return t7 / l7;
          });
          var p7 = At(n5[2], n5[0]), d7 = Math.hypot.apply(Math, ut(p7));
          if (d7 > Number.EPSILON) return p7.map(function(t7) {
            return t7 / d7;
          });
          var f6 = At(n5[1], n5[0]), m6 = Math.hypot.apply(Math, ut(f6));
          return m6 > Number.EPSILON ? f6.map(function(t7) {
            return t7 / m6;
          }) : Dt(At(r6[3], r6[0]));
        }
        function Pt(t6, e5) {
          for (var i7 = [], s7 = 0; s7 < t6.length - 1; s7 += 1) i7.push(wt(t6[s7], t6[s7 + 1], e5));
          return i7;
        }
        var Tt = a5, Et = Math.abs;
        function Ft(t6, e5) {
          var i7, s7 = this.offsetTime;
          "multidimensional" === this.propType && (i7 = m5("float32", this.pv.length));
          for (var a6, r6, n5, o6, h7, l7, p7, d7, f6, c6 = e5.lastIndex, u6 = c6, g8 = this.keyframes.length - 1, v6 = true; v6; ) {
            if (a6 = this.keyframes[u6], r6 = this.keyframes[u6 + 1], u6 === g8 - 1 && t6 >= r6.t - s7) {
              a6.h && (a6 = r6), c6 = 0;
              break;
            }
            if (r6.t - s7 > t6) {
              c6 = u6;
              break;
            }
            u6 < g8 - 1 ? u6 += 1 : (c6 = 0, v6 = false);
          }
          n5 = this.keyframesMetadata[u6] || {};
          var y7, b6 = r6.t - s7, _7 = a6.t - s7;
          if (a6.to) {
            n5.bezierData || (n5.bezierData = ct.buildBezierData(a6.s, r6.s || a6.e, a6.to, a6.ti));
            var k6 = n5.bezierData;
            if (t6 >= b6 || t6 < _7) {
              var w7 = t6 >= b6 ? k6.points.length - 1 : 0;
              for (h7 = k6.points[w7].point.length, o6 = 0; o6 < h7; o6 += 1) i7[o6] = k6.points[w7].point[o6];
            } else {
              n5.__fnct ? f6 = n5.__fnct : (f6 = ht.getBezierEasing(a6.o.x, a6.o.y, a6.i.x, a6.i.y, a6.n).get, n5.__fnct = f6), l7 = f6((t6 - _7) / (b6 - _7));
              var S4 = a6.s, A7 = r6.s || a6.e;
              if (l7 > 1) for (var D5 = Ct(a6.s, a6.to, a6.ti, r6.s || a6.e, 1), C5 = k6.segmentLength * (l7 - 1), P6 = 0; P6 < A7.length; P6 += 1) i7[P6] = A7[P6] + D5[P6] * C5;
              else if (l7 < 0) for (var T6 = Ct(a6.s, a6.to, a6.ti, r6.s || a6.e, 0), E6 = k6.segmentLength * l7, F6 = 0; F6 < S4.length; F6 += 1) i7[F6] = S4[F6] + T6[F6] * E6;
              else {
                var x6, M5 = k6.segmentLength * l7, I4 = e5.lastFrame < t6 && e5._lastKeyframeIndex === u6 ? e5._lastAddedLength : 0;
                for (d7 = e5.lastFrame < t6 && e5._lastKeyframeIndex === u6 ? e5._lastPoint : 0, v6 = true, p7 = k6.points.length; v6; ) {
                  if (I4 += k6.points[d7].partialLength, 0 === M5 || 0 === l7 || d7 === k6.points.length - 1) {
                    for (h7 = k6.points[d7].point.length, o6 = 0; o6 < h7; o6 += 1) i7[o6] = k6.points[d7].point[o6];
                    break;
                  }
                  if (M5 >= I4 && M5 < I4 + k6.points[d7 + 1].partialLength) {
                    for (x6 = (M5 - I4) / k6.points[d7 + 1].partialLength, h7 = k6.points[d7].point.length, o6 = 0; o6 < h7; o6 += 1) i7[o6] = k6.points[d7].point[o6] + (k6.points[d7 + 1].point[o6] - k6.points[d7].point[o6]) * x6;
                    break;
                  }
                  d7 < p7 - 1 ? d7 += 1 : v6 = false;
                }
                e5._lastPoint = d7, e5._lastAddedLength = I4 - k6.points[d7].partialLength, e5._lastKeyframeIndex = u6;
              }
            }
          } else {
            var L4, O4, R3, V5, N5;
            if (g8 = a6.s.length, y7 = r6.s || a6.e, this.sh && 1 !== a6.h) t6 >= b6 ? (i7[0] = y7[0], i7[1] = y7[1], i7[2] = y7[2]) : t6 <= _7 ? (i7[0] = a6.s[0], i7[1] = a6.s[1], i7[2] = a6.s[2]) : Mt(i7, xt(It(a6.s), It(y7), (t6 - _7) / (b6 - _7)));
            else for (u6 = 0; u6 < g8; u6 += 1) 1 !== a6.h && (t6 >= b6 ? l7 = 1 : t6 < _7 ? l7 = 0 : (a6.o.x.constructor === Array ? (n5.__fnct || (n5.__fnct = []), n5.__fnct[u6] ? f6 = n5.__fnct[u6] : (L4 = void 0 === a6.o.x[u6] ? a6.o.x[0] : a6.o.x[u6], O4 = void 0 === a6.o.y[u6] ? a6.o.y[0] : a6.o.y[u6], R3 = void 0 === a6.i.x[u6] ? a6.i.x[0] : a6.i.x[u6], V5 = void 0 === a6.i.y[u6] ? a6.i.y[0] : a6.i.y[u6], f6 = ht.getBezierEasing(L4, O4, R3, V5).get, n5.__fnct[u6] = f6)) : n5.__fnct ? f6 = n5.__fnct : (L4 = a6.o.x, O4 = a6.o.y, R3 = a6.i.x, V5 = a6.i.y, f6 = ht.getBezierEasing(L4, O4, R3, V5).get, a6.keyframeMetadata = f6), l7 = f6((t6 - _7) / (b6 - _7)))), y7 = r6.s || a6.e, N5 = 1 === a6.h ? a6.s[u6] : a6.s[u6] + (y7[u6] - a6.s[u6]) * l7, "multidimensional" === this.propType ? i7[u6] = N5 : i7 = N5;
          }
          return e5.lastIndex = c6, i7;
        }
        function xt(t6, e5, i7) {
          var s7, a6, r6, n5, o6, h7 = [], l7 = t6[0], p7 = t6[1], d7 = t6[2], f6 = t6[3], m6 = e5[0], c6 = e5[1], u6 = e5[2], g8 = e5[3];
          return (a6 = l7 * m6 + p7 * c6 + d7 * u6 + f6 * g8) < 0 && (a6 = -a6, m6 = -m6, c6 = -c6, u6 = -u6, g8 = -g8), 1 - a6 > 1e-6 ? (s7 = Math.acos(a6), r6 = Math.sin(s7), n5 = Math.sin((1 - i7) * s7) / r6, o6 = Math.sin(i7 * s7) / r6) : (n5 = 1 - i7, o6 = i7), h7[0] = n5 * l7 + o6 * m6, h7[1] = n5 * p7 + o6 * c6, h7[2] = n5 * d7 + o6 * u6, h7[3] = n5 * f6 + o6 * g8, h7;
        }
        function Mt(t6, e5) {
          var i7 = e5[0], s7 = e5[1], a6 = e5[2], r6 = e5[3], n5 = Math.atan2(2 * s7 * r6 - 2 * i7 * a6, 1 - 2 * s7 * s7 - 2 * a6 * a6), o6 = Math.asin(2 * i7 * s7 + 2 * a6 * r6), h7 = Math.atan2(2 * i7 * r6 - 2 * s7 * a6, 1 - 2 * i7 * i7 - 2 * a6 * a6);
          t6[0] = n5 / A6, t6[1] = o6 / A6, t6[2] = h7 / A6;
        }
        function It(t6) {
          var e5 = t6[0] * A6, i7 = t6[1] * A6, s7 = t6[2] * A6, a6 = Math.cos(e5 / 2), r6 = Math.cos(i7 / 2), n5 = Math.cos(s7 / 2), o6 = Math.sin(e5 / 2), h7 = Math.sin(i7 / 2), l7 = Math.sin(s7 / 2);
          return [o6 * h7 * n5 + a6 * r6 * l7, o6 * r6 * n5 + a6 * h7 * l7, a6 * h7 * n5 - o6 * r6 * l7, a6 * r6 * n5 - o6 * h7 * l7];
        }
        function Lt() {
          var t6 = this.comp.renderedFrame - this.offsetTime, e5 = this.keyframes[0].t - this.offsetTime, i7 = this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
          if (!(t6 === this._caching.lastFrame || this._caching.lastFrame !== Tt && (this._caching.lastFrame >= i7 && t6 >= i7 || this._caching.lastFrame < e5 && t6 < e5))) {
            this._caching.lastFrame >= t6 && (this._caching._lastKeyframeIndex = -1, this._caching.lastIndex = 0);
            var s7 = this.interpolateValue(t6, this._caching);
            this.pv = s7;
          }
          return this._caching.lastFrame = t6, this.pv;
        }
        function Ot(t6) {
          var e5;
          if ("unidimensional" === this.propType) e5 = t6 * this.mult, Et(this.v - e5) > 1e-5 && (this.v = e5, this._mdf = true);
          else for (var i7 = 0, s7 = this.v.length; i7 < s7; ) e5 = t6[i7] * this.mult, Et(this.v[i7] - e5) > 1e-5 && (this.v[i7] = e5, this._mdf = true), i7 += 1;
        }
        function Rt() {
          if (this.elem.globalData.frameId !== this.frameId && this.effectsSequence.length) if (this.lock) this.setVValue(this.pv);
          else {
            var t6;
            this.lock = true, this._mdf = this._isFirstFrame;
            var e5 = this.effectsSequence.length, i7 = this.kf ? this.pv : this.data.k;
            for (t6 = 0; t6 < e5; t6 += 1) i7 = this.effectsSequence[t6](i7);
            this.setVValue(i7), this._isFirstFrame = false, this.lock = false, this.frameId = this.elem.globalData.frameId;
          }
        }
        function Vt(t6) {
          this.effectsSequence.push(t6), this.container.addDynamicProperty(this);
        }
        function Nt(t6, e5, i7, s7) {
          this.propType = "unidimensional", this.mult = i7 || 1, this.data = e5, this.v = i7 ? e5.k * i7 : e5.k, this.pv = e5.k, this._mdf = false, this.elem = t6, this.container = s7, this.comp = t6.comp, this.k = false, this.kf = false, this.vel = 0, this.effectsSequence = [], this._isFirstFrame = true, this.getValue = Rt, this.setVValue = Ot, this.addEffect = Vt;
        }
        function zt(t6, e5, i7, s7) {
          var a6;
          this.propType = "multidimensional", this.mult = i7 || 1, this.data = e5, this._mdf = false, this.elem = t6, this.container = s7, this.comp = t6.comp, this.k = false, this.kf = false, this.frameId = -1;
          var r6 = e5.k.length;
          for (this.v = m5("float32", r6), this.pv = m5("float32", r6), this.vel = m5("float32", r6), a6 = 0; a6 < r6; a6 += 1) this.v[a6] = e5.k[a6] * this.mult, this.pv[a6] = e5.k[a6];
          this._isFirstFrame = true, this.effectsSequence = [], this.getValue = Rt, this.setVValue = Ot, this.addEffect = Vt;
        }
        function jt(t6, e5, i7, s7) {
          this.propType = "unidimensional", this.keyframes = e5.k, this.keyframesMetadata = [], this.offsetTime = t6.data.st, this.frameId = -1, this._caching = { lastFrame: Tt, lastIndex: 0, value: 0, _lastKeyframeIndex: -1 }, this.k = true, this.kf = true, this.data = e5, this.mult = i7 || 1, this.elem = t6, this.container = s7, this.comp = t6.comp, this.v = Tt, this.pv = Tt, this._isFirstFrame = true, this.getValue = Rt, this.setVValue = Ot, this.interpolateValue = Ft, this.effectsSequence = [Lt.bind(this)], this.addEffect = Vt;
        }
        function Bt(t6, e5, i7, s7) {
          var a6;
          this.propType = "multidimensional";
          var r6, n5, o6, h7, l7 = e5.k.length;
          for (a6 = 0; a6 < l7 - 1; a6 += 1) e5.k[a6].to && e5.k[a6].s && e5.k[a6 + 1] && e5.k[a6 + 1].s && (r6 = e5.k[a6].s, n5 = e5.k[a6 + 1].s, o6 = e5.k[a6].to, h7 = e5.k[a6].ti, (2 === r6.length && (r6[0] !== n5[0] || r6[1] !== n5[1]) && ct.pointOnLine2D(r6[0], r6[1], n5[0], n5[1], r6[0] + o6[0], r6[1] + o6[1]) && ct.pointOnLine2D(r6[0], r6[1], n5[0], n5[1], n5[0] + h7[0], n5[1] + h7[1]) || 3 === r6.length && (r6[0] !== n5[0] || r6[1] !== n5[1] || r6[2] !== n5[2]) && ct.pointOnLine3D(r6[0], r6[1], r6[2], n5[0], n5[1], n5[2], r6[0] + o6[0], r6[1] + o6[1], r6[2] + o6[2]) && ct.pointOnLine3D(r6[0], r6[1], r6[2], n5[0], n5[1], n5[2], n5[0] + h7[0], n5[1] + h7[1], n5[2] + h7[2])) && (e5.k[a6].to = null, e5.k[a6].ti = null), r6[0] === n5[0] && r6[1] === n5[1] && 0 === o6[0] && 0 === o6[1] && 0 === h7[0] && 0 === h7[1] && (2 === r6.length || r6[2] === n5[2] && 0 === o6[2] && 0 === h7[2]) && (e5.k[a6].to = null, e5.k[a6].ti = null));
          this.effectsSequence = [Lt.bind(this)], this.data = e5, this.keyframes = e5.k, this.keyframesMetadata = [], this.offsetTime = t6.data.st, this.k = true, this.kf = true, this._isFirstFrame = true, this.mult = i7 || 1, this.elem = t6, this.container = s7, this.comp = t6.comp, this.getValue = Rt, this.setVValue = Ot, this.interpolateValue = Ft, this.frameId = -1;
          var p7 = e5.k[0].s.length;
          for (this.v = m5("float32", p7), this.pv = m5("float32", p7), a6 = 0; a6 < p7; a6 += 1) this.v[a6] = Tt, this.pv[a6] = Tt;
          this._caching = { lastFrame: Tt, lastIndex: 0, value: m5("float32", p7) }, this.addEffect = Vt;
        }
        var qt = /* @__PURE__ */ function() {
          function t6(t7, e5, i7, s7, a6) {
            var r6;
            if (e5.sid && (e5 = t7.globalData.slotManager.getProp(e5)), e5.k.length) if ("number" == typeof e5.k[0]) r6 = new zt(t7, e5, s7, a6);
            else switch (i7) {
              case 0:
                r6 = new jt(t7, e5, s7, a6);
                break;
              case 1:
                r6 = new Bt(t7, e5, s7, a6);
            }
            else r6 = new Nt(t7, e5, s7, a6);
            return r6.effectsSequence.length && a6.addDynamicProperty(r6), r6;
          }
          return { getProp: t6 };
        }();
        function Wt() {
        }
        Wt.prototype = { addDynamicProperty: function(t6) {
          -1 === this.dynamicProperties.indexOf(t6) && (this.dynamicProperties.push(t6), this.container.addDynamicProperty(this), this._isAnimated = true);
        }, iterateDynamicProperties: function() {
          var t6;
          this._mdf = false;
          var e5 = this.dynamicProperties.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.dynamicProperties[t6].getValue(), this.dynamicProperties[t6]._mdf && (this._mdf = true);
        }, initDynamicPropertyContainer: function(t6) {
          this.container = t6, this.dynamicProperties = [], this._mdf = false, this._isAnimated = false;
        } };
        var $t = function() {
          function t6() {
            return m5("float32", 2);
          }
          return pt(8, t6);
        }();
        function Ht() {
          this.c = false, this._length = 0, this._maxLength = 8, this.v = c5(this._maxLength), this.o = c5(this._maxLength), this.i = c5(this._maxLength);
        }
        Ht.prototype.setPathData = function(t6, e5) {
          this.c = t6, this.setLength(e5);
          for (var i7 = 0; i7 < e5; ) this.v[i7] = $t.newElement(), this.o[i7] = $t.newElement(), this.i[i7] = $t.newElement(), i7 += 1;
        }, Ht.prototype.setLength = function(t6) {
          for (; this._maxLength < t6; ) this.doubleArrayLength();
          this._length = t6;
        }, Ht.prototype.doubleArrayLength = function() {
          this.v = this.v.concat(c5(this._maxLength)), this.i = this.i.concat(c5(this._maxLength)), this.o = this.o.concat(c5(this._maxLength)), this._maxLength *= 2;
        }, Ht.prototype.setXYAt = function(t6, e5, i7, s7, a6) {
          var r6;
          switch (this._length = Math.max(this._length, s7 + 1), this._length >= this._maxLength && this.doubleArrayLength(), i7) {
            case "v":
              r6 = this.v;
              break;
            case "i":
              r6 = this.i;
              break;
            case "o":
              r6 = this.o;
              break;
            default:
              r6 = [];
          }
          (!r6[s7] || r6[s7] && !a6) && (r6[s7] = $t.newElement()), r6[s7][0] = t6, r6[s7][1] = e5;
        }, Ht.prototype.setTripleAt = function(t6, e5, i7, s7, a6, r6, n5, o6) {
          this.setXYAt(t6, e5, "v", n5, o6), this.setXYAt(i7, s7, "o", n5, o6), this.setXYAt(a6, r6, "i", n5, o6);
        }, Ht.prototype.reverse = function() {
          var t6 = new Ht();
          t6.setPathData(this.c, this._length);
          var e5 = this.v, i7 = this.o, s7 = this.i, a6 = 0;
          this.c && (t6.setTripleAt(e5[0][0], e5[0][1], s7[0][0], s7[0][1], i7[0][0], i7[0][1], 0, false), a6 = 1);
          var r6, n5 = this._length - 1, o6 = this._length;
          for (r6 = a6; r6 < o6; r6 += 1) t6.setTripleAt(e5[n5][0], e5[n5][1], s7[n5][0], s7[n5][1], i7[n5][0], i7[n5][1], r6, false), n5 -= 1;
          return t6;
        }, Ht.prototype.length = function() {
          return this._length;
        };
        var Gt = function() {
          function t6() {
            return new Ht();
          }
          function e5(t7) {
            var e6, i8 = t7._length;
            for (e6 = 0; e6 < i8; e6 += 1) $t.release(t7.v[e6]), $t.release(t7.i[e6]), $t.release(t7.o[e6]), t7.v[e6] = null, t7.i[e6] = null, t7.o[e6] = null;
            t7._length = 0, t7.c = false;
          }
          function i7(t7) {
            var e6, i8 = s7.newElement(), a6 = void 0 === t7._length ? t7.v.length : t7._length;
            for (i8.setLength(a6), i8.c = t7.c, e6 = 0; e6 < a6; e6 += 1) i8.setTripleAt(t7.v[e6][0], t7.v[e6][1], t7.o[e6][0], t7.o[e6][1], t7.i[e6][0], t7.i[e6][1], e6);
            return i8;
          }
          var s7 = pt(4, t6, e5);
          return s7.clone = i7, s7;
        }();
        function Xt() {
          this._length = 0, this._maxLength = 4, this.shapes = c5(this._maxLength);
        }
        Xt.prototype.addShape = function(t6) {
          this._length === this._maxLength && (this.shapes = this.shapes.concat(c5(this._maxLength)), this._maxLength *= 2), this.shapes[this._length] = t6, this._length += 1;
        }, Xt.prototype.releaseShapes = function() {
          var t6;
          for (t6 = 0; t6 < this._length; t6 += 1) Gt.release(this.shapes[t6]);
          this._length = 0;
        };
        var Ut = function() {
          var t6 = { newShapeCollection: a6, release: r6 }, e5 = 0, i7 = 4, s7 = c5(i7);
          function a6() {
            return e5 ? s7[e5 -= 1] : new Xt();
          }
          function r6(t7) {
            var a7, r7 = t7._length;
            for (a7 = 0; a7 < r7; a7 += 1) Gt.release(t7.shapes[a7]);
            t7._length = 0, e5 === i7 && (s7 = lt.double(s7), i7 *= 2), s7[e5] = t7, e5 += 1;
          }
          return t6;
        }(), Yt = function() {
          var t6 = -999999;
          function e5(t7, e6, i8) {
            var s8, a7, r7, n6, o7, h8, l8, p7, d8, f7 = i8.lastIndex, m7 = this.keyframes;
            if (t7 < m7[0].t - this.offsetTime) s8 = m7[0].s[0], r7 = true, f7 = 0;
            else if (t7 >= m7[m7.length - 1].t - this.offsetTime) s8 = m7[m7.length - 1].s ? m7[m7.length - 1].s[0] : m7[m7.length - 2].e[0], r7 = true;
            else {
              for (var c7, u7, g9, v7 = f7, y7 = m7.length - 1, b6 = true; b6 && (c7 = m7[v7], !((u7 = m7[v7 + 1]).t - this.offsetTime > t7)); ) v7 < y7 - 1 ? v7 += 1 : b6 = false;
              if (g9 = this.keyframesMetadata[v7] || {}, f7 = v7, !(r7 = 1 === c7.h)) {
                if (t7 >= u7.t - this.offsetTime) p7 = 1;
                else if (t7 < c7.t - this.offsetTime) p7 = 0;
                else {
                  var _7;
                  g9.__fnct ? _7 = g9.__fnct : (_7 = ht.getBezierEasing(c7.o.x, c7.o.y, c7.i.x, c7.i.y).get, g9.__fnct = _7), p7 = _7((t7 - (c7.t - this.offsetTime)) / (u7.t - this.offsetTime - (c7.t - this.offsetTime)));
                }
                a7 = u7.s ? u7.s[0] : c7.e[0];
              }
              s8 = c7.s[0];
            }
            for (h8 = e6._length, l8 = s8.i[0].length, i8.lastIndex = f7, n6 = 0; n6 < h8; n6 += 1) for (o7 = 0; o7 < l8; o7 += 1) d8 = r7 ? s8.i[n6][o7] : s8.i[n6][o7] + (a7.i[n6][o7] - s8.i[n6][o7]) * p7, e6.i[n6][o7] = d8, d8 = r7 ? s8.o[n6][o7] : s8.o[n6][o7] + (a7.o[n6][o7] - s8.o[n6][o7]) * p7, e6.o[n6][o7] = d8, d8 = r7 ? s8.v[n6][o7] : s8.v[n6][o7] + (a7.v[n6][o7] - s8.v[n6][o7]) * p7, e6.v[n6][o7] = d8;
          }
          function i7() {
            var e6 = this.comp.renderedFrame - this.offsetTime, i8 = this.keyframes[0].t - this.offsetTime, s8 = this.keyframes[this.keyframes.length - 1].t - this.offsetTime, a7 = this._caching.lastFrame;
            return a7 !== t6 && (a7 < i8 && e6 < i8 || a7 > s8 && e6 > s8) || (this._caching.lastIndex = a7 < e6 ? this._caching.lastIndex : 0, this.interpolateShape(e6, this.pv, this._caching)), this._caching.lastFrame = e6, this.pv;
          }
          function s7() {
            this.paths = this.localShapeCollection;
          }
          function a6(t7, e6) {
            if (t7._length !== e6._length || t7.c !== e6.c) return false;
            var i8, s8 = t7._length;
            for (i8 = 0; i8 < s8; i8 += 1) if (t7.v[i8][0] !== e6.v[i8][0] || t7.v[i8][1] !== e6.v[i8][1] || t7.o[i8][0] !== e6.o[i8][0] || t7.o[i8][1] !== e6.o[i8][1] || t7.i[i8][0] !== e6.i[i8][0] || t7.i[i8][1] !== e6.i[i8][1]) return false;
            return true;
          }
          function r6(t7) {
            a6(this.v, t7) || (this.v = Gt.clone(t7), this.localShapeCollection.releaseShapes(), this.localShapeCollection.addShape(this.v), this._mdf = true, this.paths = this.localShapeCollection);
          }
          function n5() {
            if (this.elem.globalData.frameId !== this.frameId) if (this.effectsSequence.length) if (this.lock) this.setVValue(this.pv);
            else {
              var t7, e6;
              this.lock = true, this._mdf = false, t7 = this.kf ? this.pv : this.data.ks ? this.data.ks.k : this.data.pt.k;
              var i8 = this.effectsSequence.length;
              for (e6 = 0; e6 < i8; e6 += 1) t7 = this.effectsSequence[e6](t7);
              this.setVValue(t7), this.lock = false, this.frameId = this.elem.globalData.frameId;
            }
            else this._mdf = false;
          }
          function o6(t7, e6, i8) {
            this.propType = "shape", this.comp = t7.comp, this.container = t7, this.elem = t7, this.data = e6, this.k = false, this.kf = false, this._mdf = false;
            var a7 = 3 === i8 ? e6.pt.k : e6.ks.k;
            this.v = Gt.clone(a7), this.pv = Gt.clone(this.v), this.localShapeCollection = Ut.newShapeCollection(), this.paths = this.localShapeCollection, this.paths.addShape(this.v), this.reset = s7, this.effectsSequence = [];
          }
          function h7(t7) {
            this.effectsSequence.push(t7), this.container.addDynamicProperty(this);
          }
          function l7(e6, a7, r7) {
            this.propType = "shape", this.comp = e6.comp, this.elem = e6, this.container = e6, this.offsetTime = e6.data.st, this.keyframes = 3 === r7 ? a7.pt.k : a7.ks.k, this.keyframesMetadata = [], this.k = true, this.kf = true;
            var n6 = this.keyframes[0].s[0].i.length;
            this.v = Gt.newElement(), this.v.setPathData(this.keyframes[0].s[0].c, n6), this.pv = Gt.clone(this.v), this.localShapeCollection = Ut.newShapeCollection(), this.paths = this.localShapeCollection, this.paths.addShape(this.v), this.lastFrame = t6, this.reset = s7, this._caching = { lastFrame: t6, lastIndex: 0 }, this.effectsSequence = [i7.bind(this)];
          }
          o6.prototype.interpolateShape = e5, o6.prototype.getValue = n5, o6.prototype.setVValue = r6, o6.prototype.addEffect = h7, l7.prototype.getValue = n5, l7.prototype.interpolateShape = e5, l7.prototype.setVValue = r6, l7.prototype.addEffect = h7;
          var d7 = function() {
            var t7 = D4;
            function e6(t8, e7) {
              this.v = Gt.newElement(), this.v.setPathData(true, 4), this.localShapeCollection = Ut.newShapeCollection(), this.paths = this.localShapeCollection, this.localShapeCollection.addShape(this.v), this.d = e7.d, this.elem = t8, this.comp = t8.comp, this.frameId = -1, this.initDynamicPropertyContainer(t8), this.p = qt.getProp(t8, e7.p, 1, 0, this), this.s = qt.getProp(t8, e7.s, 1, 0, this), this.dynamicProperties.length ? this.k = true : (this.k = false, this.convertEllToPath());
            }
            return e6.prototype = { reset: s7, getValue: function() {
              this.elem.globalData.frameId !== this.frameId && (this.frameId = this.elem.globalData.frameId, this.iterateDynamicProperties(), this._mdf && this.convertEllToPath());
            }, convertEllToPath: function() {
              var e7 = this.p.v[0], i8 = this.p.v[1], s8 = this.s.v[0] / 2, a7 = this.s.v[1] / 2, r7 = 3 !== this.d, n6 = this.v;
              n6.v[0][0] = e7, n6.v[0][1] = i8 - a7, n6.v[1][0] = r7 ? e7 + s8 : e7 - s8, n6.v[1][1] = i8, n6.v[2][0] = e7, n6.v[2][1] = i8 + a7, n6.v[3][0] = r7 ? e7 - s8 : e7 + s8, n6.v[3][1] = i8, n6.i[0][0] = r7 ? e7 - s8 * t7 : e7 + s8 * t7, n6.i[0][1] = i8 - a7, n6.i[1][0] = r7 ? e7 + s8 : e7 - s8, n6.i[1][1] = i8 - a7 * t7, n6.i[2][0] = r7 ? e7 + s8 * t7 : e7 - s8 * t7, n6.i[2][1] = i8 + a7, n6.i[3][0] = r7 ? e7 - s8 : e7 + s8, n6.i[3][1] = i8 + a7 * t7, n6.o[0][0] = r7 ? e7 + s8 * t7 : e7 - s8 * t7, n6.o[0][1] = i8 - a7, n6.o[1][0] = r7 ? e7 + s8 : e7 - s8, n6.o[1][1] = i8 + a7 * t7, n6.o[2][0] = r7 ? e7 - s8 * t7 : e7 + s8 * t7, n6.o[2][1] = i8 + a7, n6.o[3][0] = r7 ? e7 - s8 : e7 + s8, n6.o[3][1] = i8 - a7 * t7;
            } }, p6([Wt], e6), e6;
          }(), f6 = function() {
            function t7(t8, e6) {
              this.v = Gt.newElement(), this.v.setPathData(true, 0), this.elem = t8, this.comp = t8.comp, this.data = e6, this.frameId = -1, this.d = e6.d, this.initDynamicPropertyContainer(t8), 1 === e6.sy ? (this.ir = qt.getProp(t8, e6.ir, 0, 0, this), this.is = qt.getProp(t8, e6.is, 0, 0.01, this), this.convertToPath = this.convertStarToPath) : this.convertToPath = this.convertPolygonToPath, this.pt = qt.getProp(t8, e6.pt, 0, 0, this), this.p = qt.getProp(t8, e6.p, 1, 0, this), this.r = qt.getProp(t8, e6.r, 0, A6, this), this.or = qt.getProp(t8, e6.or, 0, 0, this), this.os = qt.getProp(t8, e6.os, 0, 0.01, this), this.localShapeCollection = Ut.newShapeCollection(), this.localShapeCollection.addShape(this.v), this.paths = this.localShapeCollection, this.dynamicProperties.length ? this.k = true : (this.k = false, this.convertToPath());
            }
            return t7.prototype = { reset: s7, getValue: function() {
              this.elem.globalData.frameId !== this.frameId && (this.frameId = this.elem.globalData.frameId, this.iterateDynamicProperties(), this._mdf && this.convertToPath());
            }, convertStarToPath: function() {
              var t8, e6, i8, s8, a7 = 2 * Math.floor(this.pt.v), r7 = 2 * Math.PI / a7, n6 = true, o7 = this.or.v, h8 = this.ir.v, l8 = this.os.v, p7 = this.is.v, d8 = 2 * Math.PI * o7 / (2 * a7), f7 = 2 * Math.PI * h8 / (2 * a7), m7 = -Math.PI / 2;
              m7 += this.r.v;
              var c7 = 3 === this.data.d ? -1 : 1;
              for (this.v._length = 0, t8 = 0; t8 < a7; t8 += 1) {
                i8 = n6 ? l8 : p7, s8 = n6 ? d8 : f7;
                var u7 = (e6 = n6 ? o7 : h8) * Math.cos(m7), g9 = e6 * Math.sin(m7), v7 = 0 === u7 && 0 === g9 ? 0 : g9 / Math.sqrt(u7 * u7 + g9 * g9), y7 = 0 === u7 && 0 === g9 ? 0 : -u7 / Math.sqrt(u7 * u7 + g9 * g9);
                u7 += +this.p.v[0], g9 += +this.p.v[1], this.v.setTripleAt(u7, g9, u7 - v7 * s8 * i8 * c7, g9 - y7 * s8 * i8 * c7, u7 + v7 * s8 * i8 * c7, g9 + y7 * s8 * i8 * c7, t8, true), n6 = !n6, m7 += r7 * c7;
              }
            }, convertPolygonToPath: function() {
              var t8, e6 = Math.floor(this.pt.v), i8 = 2 * Math.PI / e6, s8 = this.or.v, a7 = this.os.v, r7 = 2 * Math.PI * s8 / (4 * e6), n6 = 0.5 * -Math.PI, o7 = 3 === this.data.d ? -1 : 1;
              for (n6 += this.r.v, this.v._length = 0, t8 = 0; t8 < e6; t8 += 1) {
                var h8 = s8 * Math.cos(n6), l8 = s8 * Math.sin(n6), p7 = 0 === h8 && 0 === l8 ? 0 : l8 / Math.sqrt(h8 * h8 + l8 * l8), d8 = 0 === h8 && 0 === l8 ? 0 : -h8 / Math.sqrt(h8 * h8 + l8 * l8);
                h8 += +this.p.v[0], l8 += +this.p.v[1], this.v.setTripleAt(h8, l8, h8 - p7 * r7 * a7 * o7, l8 - d8 * r7 * a7 * o7, h8 + p7 * r7 * a7 * o7, l8 + d8 * r7 * a7 * o7, t8, true), n6 += i8 * o7;
              }
              this.paths.length = 0, this.paths[0] = this.v;
            } }, p6([Wt], t7), t7;
          }(), m6 = function() {
            function t7(t8, e6) {
              this.v = Gt.newElement(), this.v.c = true, this.localShapeCollection = Ut.newShapeCollection(), this.localShapeCollection.addShape(this.v), this.paths = this.localShapeCollection, this.elem = t8, this.comp = t8.comp, this.frameId = -1, this.d = e6.d, this.initDynamicPropertyContainer(t8), this.p = qt.getProp(t8, e6.p, 1, 0, this), this.s = qt.getProp(t8, e6.s, 1, 0, this), this.r = qt.getProp(t8, e6.r, 0, 0, this), this.dynamicProperties.length ? this.k = true : (this.k = false, this.convertRectToPath());
            }
            return t7.prototype = { convertRectToPath: function() {
              var t8 = this.p.v[0], e6 = this.p.v[1], i8 = this.s.v[0] / 2, s8 = this.s.v[1] / 2, a7 = w6(i8, s8, this.r.v), r7 = a7 * (1 - D4);
              this.v._length = 0, 2 === this.d || 1 === this.d ? (this.v.setTripleAt(t8 + i8, e6 - s8 + a7, t8 + i8, e6 - s8 + a7, t8 + i8, e6 - s8 + r7, 0, true), this.v.setTripleAt(t8 + i8, e6 + s8 - a7, t8 + i8, e6 + s8 - r7, t8 + i8, e6 + s8 - a7, 1, true), 0 !== a7 ? (this.v.setTripleAt(t8 + i8 - a7, e6 + s8, t8 + i8 - a7, e6 + s8, t8 + i8 - r7, e6 + s8, 2, true), this.v.setTripleAt(t8 - i8 + a7, e6 + s8, t8 - i8 + r7, e6 + s8, t8 - i8 + a7, e6 + s8, 3, true), this.v.setTripleAt(t8 - i8, e6 + s8 - a7, t8 - i8, e6 + s8 - a7, t8 - i8, e6 + s8 - r7, 4, true), this.v.setTripleAt(t8 - i8, e6 - s8 + a7, t8 - i8, e6 - s8 + r7, t8 - i8, e6 - s8 + a7, 5, true), this.v.setTripleAt(t8 - i8 + a7, e6 - s8, t8 - i8 + a7, e6 - s8, t8 - i8 + r7, e6 - s8, 6, true), this.v.setTripleAt(t8 + i8 - a7, e6 - s8, t8 + i8 - r7, e6 - s8, t8 + i8 - a7, e6 - s8, 7, true)) : (this.v.setTripleAt(t8 - i8, e6 + s8, t8 - i8 + r7, e6 + s8, t8 - i8, e6 + s8, 2), this.v.setTripleAt(t8 - i8, e6 - s8, t8 - i8, e6 - s8 + r7, t8 - i8, e6 - s8, 3))) : (this.v.setTripleAt(t8 + i8, e6 - s8 + a7, t8 + i8, e6 - s8 + r7, t8 + i8, e6 - s8 + a7, 0, true), 0 !== a7 ? (this.v.setTripleAt(t8 + i8 - a7, e6 - s8, t8 + i8 - a7, e6 - s8, t8 + i8 - r7, e6 - s8, 1, true), this.v.setTripleAt(t8 - i8 + a7, e6 - s8, t8 - i8 + r7, e6 - s8, t8 - i8 + a7, e6 - s8, 2, true), this.v.setTripleAt(t8 - i8, e6 - s8 + a7, t8 - i8, e6 - s8 + a7, t8 - i8, e6 - s8 + r7, 3, true), this.v.setTripleAt(t8 - i8, e6 + s8 - a7, t8 - i8, e6 + s8 - r7, t8 - i8, e6 + s8 - a7, 4, true), this.v.setTripleAt(t8 - i8 + a7, e6 + s8, t8 - i8 + a7, e6 + s8, t8 - i8 + r7, e6 + s8, 5, true), this.v.setTripleAt(t8 + i8 - a7, e6 + s8, t8 + i8 - r7, e6 + s8, t8 + i8 - a7, e6 + s8, 6, true), this.v.setTripleAt(t8 + i8, e6 + s8 - a7, t8 + i8, e6 + s8 - a7, t8 + i8, e6 + s8 - r7, 7, true)) : (this.v.setTripleAt(t8 - i8, e6 - s8, t8 - i8 + r7, e6 - s8, t8 - i8, e6 - s8, 1, true), this.v.setTripleAt(t8 - i8, e6 + s8, t8 - i8, e6 + s8 - r7, t8 - i8, e6 + s8, 2, true), this.v.setTripleAt(t8 + i8, e6 + s8, t8 + i8 - r7, e6 + s8, t8 + i8, e6 + s8, 3, true)));
            }, getValue: function() {
              this.elem.globalData.frameId !== this.frameId && (this.frameId = this.elem.globalData.frameId, this.iterateDynamicProperties(), this._mdf && this.convertRectToPath());
            }, reset: s7 }, p6([Wt], t7), t7;
          }();
          function c6(t7, e6, i8) {
            var s8;
            return 3 === i8 || 4 === i8 ? s8 = (3 === i8 ? e6.pt : e6.ks).k.length ? new l7(t7, e6, i8) : new o6(t7, e6, i8) : 5 === i8 ? s8 = new m6(t7, e6) : 6 === i8 ? s8 = new d7(t7, e6) : 7 === i8 && (s8 = new f6(t7, e6)), s8.k && t7.addDynamicProperty(s8), s8;
          }
          function u6() {
            return o6;
          }
          function g8() {
            return l7;
          }
          var v6 = {};
          return v6.getShapeProp = c6, v6.getConstructorFunction = u6, v6.getKeyframedConstructorFunction = g8, v6;
        }(), Zt = /* @__PURE__ */ function() {
          var t6 = Math.cos, e5 = Math.sin, i7 = Math.tan, s7 = Math.round;
          function a6() {
            return this.props[0] = 1, this.props[1] = 0, this.props[2] = 0, this.props[3] = 0, this.props[4] = 0, this.props[5] = 1, this.props[6] = 0, this.props[7] = 0, this.props[8] = 0, this.props[9] = 0, this.props[10] = 1, this.props[11] = 0, this.props[12] = 0, this.props[13] = 0, this.props[14] = 0, this.props[15] = 1, this;
          }
          function r6(i8) {
            if (0 === i8) return this;
            var s8 = t6(i8), a7 = e5(i8);
            return this._t(s8, -a7, 0, 0, a7, s8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function n5(i8) {
            if (0 === i8) return this;
            var s8 = t6(i8), a7 = e5(i8);
            return this._t(1, 0, 0, 0, 0, s8, -a7, 0, 0, a7, s8, 0, 0, 0, 0, 1);
          }
          function o6(i8) {
            if (0 === i8) return this;
            var s8 = t6(i8), a7 = e5(i8);
            return this._t(s8, 0, a7, 0, 0, 1, 0, 0, -a7, 0, s8, 0, 0, 0, 0, 1);
          }
          function h7(i8) {
            if (0 === i8) return this;
            var s8 = t6(i8), a7 = e5(i8);
            return this._t(s8, -a7, 0, 0, a7, s8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function l7(t7, e6) {
            return this._t(1, e6, t7, 1, 0, 0);
          }
          function p7(t7, e6) {
            return this.shear(i7(t7), i7(e6));
          }
          function d7(s8, a7) {
            var r7 = t6(a7), n6 = e5(a7);
            return this._t(r7, n6, 0, 0, -n6, r7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)._t(1, 0, 0, 0, i7(s8), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)._t(r7, -n6, 0, 0, n6, r7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          }
          function f6(t7, e6, i8) {
            return i8 || 0 === i8 || (i8 = 1), 1 === t7 && 1 === e6 && 1 === i8 ? this : this._t(t7, 0, 0, 0, 0, e6, 0, 0, 0, 0, i8, 0, 0, 0, 0, 1);
          }
          function c6(t7, e6, i8, s8, a7, r7, n6, o7, h8, l8, p8, d8, f7, m6, c7, u7) {
            return this.props[0] = t7, this.props[1] = e6, this.props[2] = i8, this.props[3] = s8, this.props[4] = a7, this.props[5] = r7, this.props[6] = n6, this.props[7] = o7, this.props[8] = h8, this.props[9] = l8, this.props[10] = p8, this.props[11] = d8, this.props[12] = f7, this.props[13] = m6, this.props[14] = c7, this.props[15] = u7, this;
          }
          function u6(t7, e6, i8) {
            return i8 = i8 || 0, 0 !== t7 || 0 !== e6 || 0 !== i8 ? this._t(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t7, e6, i8, 1) : this;
          }
          function g8(t7, e6, i8, s8, a7, r7, n6, o7, h8, l8, p8, d8, f7, m6, c7, u7) {
            var g9 = this.props;
            if (1 === t7 && 0 === e6 && 0 === i8 && 0 === s8 && 0 === a7 && 1 === r7 && 0 === n6 && 0 === o7 && 0 === h8 && 0 === l8 && 1 === p8 && 0 === d8) return g9[12] = g9[12] * t7 + g9[15] * f7, g9[13] = g9[13] * r7 + g9[15] * m6, g9[14] = g9[14] * p8 + g9[15] * c7, g9[15] *= u7, this._identityCalculated = false, this;
            var v7 = g9[0], y8 = g9[1], b7 = g9[2], _8 = g9[3], k7 = g9[4], w8 = g9[5], S5 = g9[6], A8 = g9[7], D6 = g9[8], C6 = g9[9], P7 = g9[10], T7 = g9[11], E7 = g9[12], F7 = g9[13], x7 = g9[14], M6 = g9[15];
            return g9[0] = v7 * t7 + y8 * a7 + b7 * h8 + _8 * f7, g9[1] = v7 * e6 + y8 * r7 + b7 * l8 + _8 * m6, g9[2] = v7 * i8 + y8 * n6 + b7 * p8 + _8 * c7, g9[3] = v7 * s8 + y8 * o7 + b7 * d8 + _8 * u7, g9[4] = k7 * t7 + w8 * a7 + S5 * h8 + A8 * f7, g9[5] = k7 * e6 + w8 * r7 + S5 * l8 + A8 * m6, g9[6] = k7 * i8 + w8 * n6 + S5 * p8 + A8 * c7, g9[7] = k7 * s8 + w8 * o7 + S5 * d8 + A8 * u7, g9[8] = D6 * t7 + C6 * a7 + P7 * h8 + T7 * f7, g9[9] = D6 * e6 + C6 * r7 + P7 * l8 + T7 * m6, g9[10] = D6 * i8 + C6 * n6 + P7 * p8 + T7 * c7, g9[11] = D6 * s8 + C6 * o7 + P7 * d8 + T7 * u7, g9[12] = E7 * t7 + F7 * a7 + x7 * h8 + M6 * f7, g9[13] = E7 * e6 + F7 * r7 + x7 * l8 + M6 * m6, g9[14] = E7 * i8 + F7 * n6 + x7 * p8 + M6 * c7, g9[15] = E7 * s8 + F7 * o7 + x7 * d8 + M6 * u7, this._identityCalculated = false, this;
          }
          function v6(t7) {
            var e6 = t7.props;
            return this.transform(e6[0], e6[1], e6[2], e6[3], e6[4], e6[5], e6[6], e6[7], e6[8], e6[9], e6[10], e6[11], e6[12], e6[13], e6[14], e6[15]);
          }
          function y7() {
            return this._identityCalculated || (this._identity = !(1 !== this.props[0] || 0 !== this.props[1] || 0 !== this.props[2] || 0 !== this.props[3] || 0 !== this.props[4] || 1 !== this.props[5] || 0 !== this.props[6] || 0 !== this.props[7] || 0 !== this.props[8] || 0 !== this.props[9] || 1 !== this.props[10] || 0 !== this.props[11] || 0 !== this.props[12] || 0 !== this.props[13] || 0 !== this.props[14] || 1 !== this.props[15]), this._identityCalculated = true), this._identity;
          }
          function b6(t7) {
            for (var e6 = 0; e6 < 16; ) {
              if (t7.props[e6] !== this.props[e6]) return false;
              e6 += 1;
            }
            return true;
          }
          function _7(t7) {
            var e6;
            for (e6 = 0; e6 < 16; e6 += 1) t7.props[e6] = this.props[e6];
            return t7;
          }
          function k6(t7) {
            var e6;
            for (e6 = 0; e6 < 16; e6 += 1) this.props[e6] = t7[e6];
          }
          function w7(t7, e6, i8) {
            return { x: t7 * this.props[0] + e6 * this.props[4] + i8 * this.props[8] + this.props[12], y: t7 * this.props[1] + e6 * this.props[5] + i8 * this.props[9] + this.props[13], z: t7 * this.props[2] + e6 * this.props[6] + i8 * this.props[10] + this.props[14] };
          }
          function S4(t7, e6, i8) {
            return t7 * this.props[0] + e6 * this.props[4] + i8 * this.props[8] + this.props[12];
          }
          function A7(t7, e6, i8) {
            return t7 * this.props[1] + e6 * this.props[5] + i8 * this.props[9] + this.props[13];
          }
          function D5(t7, e6, i8) {
            return t7 * this.props[2] + e6 * this.props[6] + i8 * this.props[10] + this.props[14];
          }
          function C5() {
            var t7 = this.props[0] * this.props[5] - this.props[1] * this.props[4], e6 = this.props[5] / t7, i8 = -this.props[1] / t7, s8 = -this.props[4] / t7, a7 = this.props[0] / t7, r7 = (this.props[4] * this.props[13] - this.props[5] * this.props[12]) / t7, n6 = -(this.props[0] * this.props[13] - this.props[1] * this.props[12]) / t7, o7 = new Zt();
            return o7.props[0] = e6, o7.props[1] = i8, o7.props[4] = s8, o7.props[5] = a7, o7.props[12] = r7, o7.props[13] = n6, o7;
          }
          function P6(t7) {
            return this.getInverseMatrix().applyToPointArray(t7[0], t7[1], t7[2] || 0);
          }
          function T6(t7) {
            var e6, i8 = t7.length, s8 = [];
            for (e6 = 0; e6 < i8; e6 += 1) s8[e6] = P6(t7[e6]);
            return s8;
          }
          function E6(t7, e6, i8) {
            var s8 = m5("float32", 6);
            if (this.isIdentity()) s8[0] = t7[0], s8[1] = t7[1], s8[2] = e6[0], s8[3] = e6[1], s8[4] = i8[0], s8[5] = i8[1];
            else {
              var a7 = this.props[0], r7 = this.props[1], n6 = this.props[4], o7 = this.props[5], h8 = this.props[12], l8 = this.props[13];
              s8[0] = t7[0] * a7 + t7[1] * n6 + h8, s8[1] = t7[0] * r7 + t7[1] * o7 + l8, s8[2] = e6[0] * a7 + e6[1] * n6 + h8, s8[3] = e6[0] * r7 + e6[1] * o7 + l8, s8[4] = i8[0] * a7 + i8[1] * n6 + h8, s8[5] = i8[0] * r7 + i8[1] * o7 + l8;
            }
            return s8;
          }
          function F6(t7, e6, i8) {
            return this.isIdentity() ? [t7, e6, i8] : [t7 * this.props[0] + e6 * this.props[4] + i8 * this.props[8] + this.props[12], t7 * this.props[1] + e6 * this.props[5] + i8 * this.props[9] + this.props[13], t7 * this.props[2] + e6 * this.props[6] + i8 * this.props[10] + this.props[14]];
          }
          function x6(t7, e6) {
            if (this.isIdentity()) return t7 + "," + e6;
            var i8 = this.props;
            return Math.round(100 * (t7 * i8[0] + e6 * i8[4] + i8[12])) / 100 + "," + Math.round(100 * (t7 * i8[1] + e6 * i8[5] + i8[13])) / 100;
          }
          function M5() {
            for (var t7 = 0, e6 = this.props, i8 = "matrix3d(", a7 = 1e4; t7 < 16; ) i8 += s7(e6[t7] * a7) / a7, i8 += 15 === t7 ? ")" : ",", t7 += 1;
            return i8;
          }
          function I4(t7) {
            var e6 = 1e4;
            return t7 < 1e-6 && t7 > 0 || t7 > -1e-6 && t7 < 0 ? s7(t7 * e6) / e6 : t7;
          }
          function L4() {
            var t7 = this.props;
            return "matrix(" + I4(t7[0]) + "," + I4(t7[1]) + "," + I4(t7[4]) + "," + I4(t7[5]) + "," + I4(t7[12]) + "," + I4(t7[13]) + ")";
          }
          return function() {
            this.reset = a6, this.rotate = r6, this.rotateX = n5, this.rotateY = o6, this.rotateZ = h7, this.skew = p7, this.skewFromAxis = d7, this.shear = l7, this.scale = f6, this.setTransform = c6, this.translate = u6, this.transform = g8, this.multiply = v6, this.applyToPoint = w7, this.applyToX = S4, this.applyToY = A7, this.applyToZ = D5, this.applyToPointArray = F6, this.applyToTriplePoints = E6, this.applyToPointStringified = x6, this.toCSS = M5, this.to2dCSS = L4, this.clone = _7, this.cloneFromProps = k6, this.equals = b6, this.inversePoints = T6, this.inversePoint = P6, this.getInverseMatrix = C5, this._t = this.transform, this.isIdentity = y7, this._identity = true, this._identityCalculated = false, this.props = m5("float32", 16), this.reset();
          };
        }();
        function Jt(t6) {
          return Jt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t7) {
            return typeof t7;
          } : function(t7) {
            return t7 && "function" == typeof Symbol && t7.constructor === Symbol && t7 !== Symbol.prototype ? "symbol" : typeof t7;
          }, Jt(t6);
        }
        var Kt = {};
        function Qt(t6) {
          o5(t6);
        }
        function te() {
          ot.searchAnimations();
        }
        function ee(t6) {
          B4(t6);
        }
        function ie(t6) {
          X2(t6);
        }
        function se(t6) {
          return ot.loadAnimation(t6);
        }
        function ae(t6) {
          if ("string" == typeof t6) switch (t6) {
            case "high":
              H3(200);
              break;
            default:
            case "medium":
              H3(50);
              break;
            case "low":
              H3(10);
          }
          else !isNaN(t6) && t6 > 1 && H3(t6);
        }
        function re() {
          return "undefined" != typeof navigator;
        }
        function ne(t6, e5) {
          "expressions" === t6 && W2(e5);
        }
        function oe(t6) {
          switch (t6) {
            case "propertyFactory":
              return qt;
            case "shapePropertyFactory":
              return Yt;
            case "matrix":
              return Zt;
            default:
              return null;
          }
        }
        function he() {
          "complete" === document.readyState && (clearInterval(ce), te());
        }
        function le(t6) {
          for (var e5 = pe.split("&"), i7 = 0; i7 < e5.length; i7 += 1) {
            var s7 = e5[i7].split("=");
            if (decodeURIComponent(s7[0]) == t6) return decodeURIComponent(s7[1]);
          }
          return null;
        }
        Kt.play = ot.play, Kt.pause = ot.pause, Kt.setLocationHref = Qt, Kt.togglePause = ot.togglePause, Kt.setSpeed = ot.setSpeed, Kt.setDirection = ot.setDirection, Kt.stop = ot.stop, Kt.searchAnimations = te, Kt.registerAnimation = ot.registerAnimation, Kt.loadAnimation = se, Kt.setSubframeRendering = ee, Kt.resize = ot.resize, Kt.goToAndStop = ot.goToAndStop, Kt.destroy = ot.destroy, Kt.setQuality = ae, Kt.inBrowser = re, Kt.installPlugin = ne, Kt.freeze = ot.freeze, Kt.unfreeze = ot.unfreeze, Kt.setVolume = ot.setVolume, Kt.mute = ot.mute, Kt.unmute = ot.unmute, Kt.getRegisteredAnimations = ot.getRegisteredAnimations, Kt.useWebWorker = r5, Kt.setIDPrefix = ie, Kt.__getFactory = oe, Kt.version = "5.12.2";
        var pe = "", de = document.getElementsByTagName("script"), fe = de.length - 1, me = de[fe] || { src: "" };
        pe = me.src ? me.src.replace(/^[^\?]+\??/, "") : "", le("renderer");
        var ce = setInterval(he, 100);
        try {
          "object" !== Jt(e4) && (window.bodymovin = Kt);
        } catch (t6) {
        }
        function ue(t6) {
          for (var e5 = t6.fStyle ? t6.fStyle.split(" ") : [], i7 = "normal", s7 = "normal", a6 = e5.length, r6 = 0; r6 < a6; r6 += 1) switch (e5[r6].toLowerCase()) {
            case "italic":
              s7 = "italic";
              break;
            case "bold":
              i7 = "700";
              break;
            case "black":
              i7 = "900";
              break;
            case "medium":
              i7 = "500";
              break;
            case "regular":
            case "normal":
              i7 = "400";
              break;
            case "light":
            case "thin":
              i7 = "200";
          }
          return { style: s7, weight: t6.fWeight || i7 };
        }
        var ge = function() {
          var t6 = 5e3, e5 = { w: 0, size: 0, shapes: [], data: { shapes: [] } }, i7 = [];
          i7 = i7.concat([2304, 2305, 2306, 2307, 2362, 2363, 2364, 2364, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373, 2374, 2375, 2376, 2377, 2378, 2379, 2380, 2381, 2382, 2383, 2387, 2388, 2389, 2390, 2391, 2402, 2403]);
          var s7 = 127988, a6 = 917631, r6 = 917601, n5 = 917626, o6 = 65039, h7 = 8205, p7 = 127462, d7 = 127487, f6 = ["d83cdffb", "d83cdffc", "d83cdffd", "d83cdffe", "d83cdfff"];
          function m6(t7) {
            var e6, i8 = t7.split(","), s8 = i8.length, a7 = [];
            for (e6 = 0; e6 < s8; e6 += 1) "sans-serif" !== i8[e6] && "monospace" !== i8[e6] && a7.push(i8[e6]);
            return a7.join(",");
          }
          function c6(t7, e6) {
            var i8 = l6("span");
            i8.setAttribute("aria-hidden", true), i8.style.fontFamily = e6;
            var s8 = l6("span");
            s8.innerText = "giItT1WQy@!-/#", i8.style.position = "absolute", i8.style.left = "-10000px", i8.style.top = "-10000px", i8.style.fontSize = "300px", i8.style.fontVariant = "normal", i8.style.fontStyle = "normal", i8.style.fontWeight = "normal", i8.style.letterSpacing = "0", i8.appendChild(s8), document.body.appendChild(i8);
            var a7 = s8.offsetWidth;
            return s8.style.fontFamily = m6(t7) + ", " + e6, { node: s8, w: a7, parent: i8 };
          }
          function u6() {
            var e6, i8, s8, a7 = this.fonts.length, r7 = a7;
            for (e6 = 0; e6 < a7; e6 += 1) this.fonts[e6].loaded ? r7 -= 1 : "n" === this.fonts[e6].fOrigin || 0 === this.fonts[e6].origin ? this.fonts[e6].loaded = true : (i8 = this.fonts[e6].monoCase.node, s8 = this.fonts[e6].monoCase.w, i8.offsetWidth !== s8 ? (r7 -= 1, this.fonts[e6].loaded = true) : (i8 = this.fonts[e6].sansCase.node, s8 = this.fonts[e6].sansCase.w, i8.offsetWidth !== s8 && (r7 -= 1, this.fonts[e6].loaded = true)), this.fonts[e6].loaded && (this.fonts[e6].sansCase.parent.parentNode.removeChild(this.fonts[e6].sansCase.parent), this.fonts[e6].monoCase.parent.parentNode.removeChild(this.fonts[e6].monoCase.parent)));
            0 !== r7 && Date.now() - this.initTime < t6 ? setTimeout(this.checkLoadedFontsBinded, 20) : setTimeout(this.setIsLoadedBinded, 10);
          }
          function g8(t7, e6) {
            var i8, s8 = document.body && e6 ? "svg" : "canvas", a7 = ue(t7);
            if ("svg" === s8) {
              var r7 = U2("text");
              r7.style.fontSize = "100px", r7.setAttribute("font-family", t7.fFamily), r7.setAttribute("font-style", a7.style), r7.setAttribute("font-weight", a7.weight), r7.textContent = "1", t7.fClass ? (r7.style.fontFamily = "inherit", r7.setAttribute("class", t7.fClass)) : r7.style.fontFamily = t7.fFamily, e6.appendChild(r7), i8 = r7;
            } else {
              var n6 = new OffscreenCanvas(500, 500).getContext("2d");
              n6.font = a7.style + " " + a7.weight + " 100px " + t7.fFamily, i8 = n6;
            }
            function o7(t8) {
              return "svg" === s8 ? (i8.textContent = t8, i8.getComputedTextLength()) : i8.measureText(t8).width;
            }
            return { measureText: o7 };
          }
          function v6(t7, e6) {
            if (t7) {
              if (this.chars) return this.isLoaded = true, void (this.fonts = t7.list);
              if (!document.body) return this.isLoaded = true, t7.list.forEach(function(t8) {
                t8.helper = g8(t8), t8.cache = {};
              }), void (this.fonts = t7.list);
              var i8, s8 = t7.list, a7 = s8.length, r7 = a7;
              for (i8 = 0; i8 < a7; i8 += 1) {
                var n6, o7, h8 = true;
                if (s8[i8].loaded = false, s8[i8].monoCase = c6(s8[i8].fFamily, "monospace"), s8[i8].sansCase = c6(s8[i8].fFamily, "sans-serif"), s8[i8].fPath) {
                  if ("p" === s8[i8].fOrigin || 3 === s8[i8].origin) {
                    if ((n6 = document.querySelectorAll('style[f-forigin="p"][f-family="' + s8[i8].fFamily + '"], style[f-origin="3"][f-family="' + s8[i8].fFamily + '"]')).length > 0 && (h8 = false), h8) {
                      var p8 = l6("style");
                      p8.setAttribute("f-forigin", s8[i8].fOrigin), p8.setAttribute("f-origin", s8[i8].origin), p8.setAttribute("f-family", s8[i8].fFamily), p8.type = "text/css", p8.innerText = "@font-face {font-family: " + s8[i8].fFamily + "; font-style: normal; src: url('" + s8[i8].fPath + "');}", e6.appendChild(p8);
                    }
                  } else if ("g" === s8[i8].fOrigin || 1 === s8[i8].origin) {
                    for (n6 = document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]'), o7 = 0; o7 < n6.length; o7 += 1) -1 !== n6[o7].href.indexOf(s8[i8].fPath) && (h8 = false);
                    if (h8) {
                      var d8 = l6("link");
                      d8.setAttribute("f-forigin", s8[i8].fOrigin), d8.setAttribute("f-origin", s8[i8].origin), d8.type = "text/css", d8.rel = "stylesheet", d8.href = s8[i8].fPath, document.body.appendChild(d8);
                    }
                  } else if ("t" === s8[i8].fOrigin || 2 === s8[i8].origin) {
                    for (n6 = document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]'), o7 = 0; o7 < n6.length; o7 += 1) s8[i8].fPath === n6[o7].src && (h8 = false);
                    if (h8) {
                      var f7 = l6("link");
                      f7.setAttribute("f-forigin", s8[i8].fOrigin), f7.setAttribute("f-origin", s8[i8].origin), f7.setAttribute("rel", "stylesheet"), f7.setAttribute("href", s8[i8].fPath), e6.appendChild(f7);
                    }
                  }
                } else s8[i8].loaded = true, r7 -= 1;
                s8[i8].helper = g8(s8[i8], e6), s8[i8].cache = {}, this.fonts.push(s8[i8]);
              }
              0 === r7 ? this.isLoaded = true : setTimeout(this.checkLoadedFonts.bind(this), 100);
            } else this.isLoaded = true;
          }
          function y7(t7) {
            if (t7) {
              var e6;
              this.chars || (this.chars = []);
              var i8, s8, a7 = t7.length, r7 = this.chars.length;
              for (e6 = 0; e6 < a7; e6 += 1) {
                for (i8 = 0, s8 = false; i8 < r7; ) this.chars[i8].style === t7[e6].style && this.chars[i8].fFamily === t7[e6].fFamily && this.chars[i8].ch === t7[e6].ch && (s8 = true), i8 += 1;
                s8 || (this.chars.push(t7[e6]), r7 += 1);
              }
            }
          }
          function b6(t7, i8, s8) {
            for (var a7 = 0, r7 = this.chars.length; a7 < r7; ) {
              if (this.chars[a7].ch === t7 && this.chars[a7].style === i8 && this.chars[a7].fFamily === s8) return this.chars[a7];
              a7 += 1;
            }
            return ("string" == typeof t7 && 13 !== t7.charCodeAt(0) || !t7) && console && console.warn && !this._warned && (this._warned = true, console.warn("Missing character from exported characters list: ", t7, i8, s8)), e5;
          }
          function _7(t7, e6, i8) {
            var s8 = this.getFontByName(e6), a7 = t7;
            if (!s8.cache[a7]) {
              var r7 = s8.helper;
              if (" " === t7) {
                var n6 = r7.measureText("|" + t7 + "|"), o7 = r7.measureText("||");
                s8.cache[a7] = (n6 - o7) / 100;
              } else s8.cache[a7] = r7.measureText(t7) / 100;
            }
            return s8.cache[a7] * i8;
          }
          function k6(t7) {
            for (var e6 = 0, i8 = this.fonts.length; e6 < i8; ) {
              if (this.fonts[e6].fName === t7) return this.fonts[e6];
              e6 += 1;
            }
            return this.fonts[0];
          }
          function w7(t7) {
            var e6 = 0, i8 = t7.charCodeAt(0);
            if (i8 >= 55296 && i8 <= 56319) {
              var s8 = t7.charCodeAt(1);
              s8 >= 56320 && s8 <= 57343 && (e6 = 1024 * (i8 - 55296) + s8 - 56320 + 65536);
            }
            return e6;
          }
          function S4(t7, e6) {
            var i8 = t7.toString(16) + e6.toString(16);
            return -1 !== f6.indexOf(i8);
          }
          function A7(t7) {
            return t7 === h7;
          }
          function D5(t7) {
            return t7 === o6;
          }
          function C5(t7) {
            var e6 = w7(t7);
            return e6 >= p7 && e6 <= d7;
          }
          function P6(t7) {
            return C5(t7.substr(0, 2)) && C5(t7.substr(2, 2));
          }
          function T6(t7) {
            return -1 !== i7.indexOf(t7);
          }
          function E6(t7, e6) {
            var i8 = w7(t7.substr(e6, 2));
            if (i8 !== s7) return false;
            var o7 = 0;
            for (e6 += 2; o7 < 5; ) {
              if ((i8 = w7(t7.substr(e6, 2))) < r6 || i8 > n5) return false;
              o7 += 1, e6 += 2;
            }
            return w7(t7.substr(e6, 2)) === a6;
          }
          function F6() {
            this.isLoaded = true;
          }
          var x6 = function() {
            this.fonts = [], this.chars = null, this.typekitLoaded = 0, this.isLoaded = false, this._warned = false, this.initTime = Date.now(), this.setIsLoadedBinded = this.setIsLoaded.bind(this), this.checkLoadedFontsBinded = this.checkLoadedFonts.bind(this);
          };
          x6.isModifier = S4, x6.isZeroWidthJoiner = A7, x6.isFlagEmoji = P6, x6.isRegionalCode = C5, x6.isCombinedCharacter = T6, x6.isRegionalFlag = E6, x6.isVariationSelector = D5, x6.BLACK_FLAG_CODE_POINT = s7;
          var M5 = { addChars: y7, addFonts: v6, getCharData: b6, getFontByName: k6, measureText: _7, checkLoadedFonts: u6, setIsLoaded: F6 };
          return x6.prototype = M5, x6;
        }();
        function ve(t6) {
          this.animationData = t6;
        }
        function ye(t6) {
          return new ve(t6);
        }
        function be() {
        }
        ve.prototype.getProp = function(t6) {
          return this.animationData.slots && this.animationData.slots[t6.sid] ? Object.assign(t6, this.animationData.slots[t6.sid].p) : t6;
        }, be.prototype = { initRenderable: function() {
          this.isInRange = false, this.hidden = false, this.isTransparent = false, this.renderableComponents = [];
        }, addRenderableComponent: function(t6) {
          -1 === this.renderableComponents.indexOf(t6) && this.renderableComponents.push(t6);
        }, removeRenderableComponent: function(t6) {
          -1 !== this.renderableComponents.indexOf(t6) && this.renderableComponents.splice(this.renderableComponents.indexOf(t6), 1);
        }, prepareRenderableFrame: function(t6) {
          this.checkLayerLimits(t6);
        }, checkTransparency: function() {
          this.finalTransform.mProp.o.v <= 0 ? !this.isTransparent && this.globalData.renderConfig.hideOnTransparent && (this.isTransparent = true, this.hide()) : this.isTransparent && (this.isTransparent = false, this.show());
        }, checkLayerLimits: function(t6) {
          this.data.ip - this.data.st <= t6 && this.data.op - this.data.st > t6 ? true !== this.isInRange && (this.globalData._mdf = true, this._mdf = true, this.isInRange = true, this.show()) : false !== this.isInRange && (this.globalData._mdf = true, this.isInRange = false, this.hide());
        }, renderRenderable: function() {
          var t6, e5 = this.renderableComponents.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.renderableComponents[t6].renderFrame(this._isFirstFrame);
        }, sourceRectAtTime: function() {
          return { top: 0, left: 0, width: 100, height: 100 };
        }, getLayerSize: function() {
          return 5 === this.data.ty ? { w: this.data.textData.width, h: this.data.textData.height } : { w: this.data.width, h: this.data.height };
        } };
        var _e, ke = (_e = { 0: "source-over", 1: "multiply", 2: "screen", 3: "overlay", 4: "darken", 5: "lighten", 6: "color-dodge", 7: "color-burn", 8: "hard-light", 9: "soft-light", 10: "difference", 11: "exclusion", 12: "hue", 13: "saturation", 14: "color", 15: "luminosity" }, function(t6) {
          return _e[t6] || "";
        });
        function we(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 0, 0, i7);
        }
        function Se(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 0, 0, i7);
        }
        function Ae(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 1, 0, i7);
        }
        function De(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 1, 0, i7);
        }
        function Ce(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 0, 0, i7);
        }
        function Pe(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 0, 0, i7);
        }
        function Te(t6, e5, i7) {
          this.p = qt.getProp(e5, t6.v, 0, 0, i7);
        }
        function Ee() {
          this.p = {};
        }
        function Fe(t6, e5) {
          var i7, s7 = t6.ef || [];
          this.effectElements = [];
          var a6, r6 = s7.length;
          for (i7 = 0; i7 < r6; i7 += 1) a6 = new xe(s7[i7], e5), this.effectElements.push(a6);
        }
        function xe(t6, e5) {
          this.init(t6, e5);
        }
        function Me() {
        }
        function Ie() {
        }
        function Le(t6, e5, i7) {
          this.initFrame(), this.initRenderable(), this.assetData = e5.getAssetData(t6.refId), this.footageData = e5.imageLoader.getAsset(this.assetData), this.initBaseData(t6, e5, i7);
        }
        function Oe(t6, e5, i7) {
          this.initFrame(), this.initRenderable(), this.assetData = e5.getAssetData(t6.refId), this.initBaseData(t6, e5, i7), this._isPlaying = false, this._canPlay = false;
          var s7 = this.globalData.getAssetsPath(this.assetData);
          this.audio = this.globalData.audioController.createAudio(s7), this._currentTime = 0, this.globalData.audioController.addAudio(this), this._volumeMultiplier = 1, this._volume = 1, this._previousVolume = null, this.tm = t6.tm ? qt.getProp(this, t6.tm, 0, e5.frameRate, this) : { _placeholder: true }, this.lv = qt.getProp(this, t6.au && t6.au.lv ? t6.au.lv : { k: [100] }, 1, 0.01, this);
        }
        function Re() {
        }
        p6([Wt], xe), xe.prototype.getValue = xe.prototype.iterateDynamicProperties, xe.prototype.init = function(t6, e5) {
          var i7;
          this.data = t6, this.effectElements = [], this.initDynamicPropertyContainer(e5);
          var s7, a6 = this.data.ef.length, r6 = this.data.ef;
          for (i7 = 0; i7 < a6; i7 += 1) {
            switch (s7 = null, r6[i7].ty) {
              case 0:
                s7 = new we(r6[i7], e5, this);
                break;
              case 1:
                s7 = new Se(r6[i7], e5, this);
                break;
              case 2:
                s7 = new Ae(r6[i7], e5, this);
                break;
              case 3:
                s7 = new De(r6[i7], e5, this);
                break;
              case 4:
              case 7:
                s7 = new Te(r6[i7], e5, this);
                break;
              case 10:
                s7 = new Ce(r6[i7], e5, this);
                break;
              case 11:
                s7 = new Pe(r6[i7], e5, this);
                break;
              case 5:
                s7 = new Fe(r6[i7], e5);
                break;
              default:
                s7 = new Ee(r6[i7]);
            }
            s7 && this.effectElements.push(s7);
          }
        }, Me.prototype = { checkMasks: function() {
          if (!this.data.hasMask) return false;
          for (var t6 = 0, e5 = this.data.masksProperties.length; t6 < e5; ) {
            if ("n" !== this.data.masksProperties[t6].mode && false !== this.data.masksProperties[t6].cl) return true;
            t6 += 1;
          }
          return false;
        }, initExpressions: function() {
        }, setBlendMode: function() {
          var t6 = ke(this.data.bm);
          (this.baseElement || this.layerElement).style["mix-blend-mode"] = t6;
        }, initBaseData: function(t6, e5, i7) {
          this.globalData = e5, this.comp = i7, this.data = t6, this.layerId = L3(), this.data.sr || (this.data.sr = 1), this.effectsManager = new Fe(this.data, this, this.dynamicProperties);
        }, getType: function() {
          return this.type;
        }, sourceRectAtTime: function() {
        } }, Ie.prototype = { initFrame: function() {
          this._isFirstFrame = false, this.dynamicProperties = [], this._mdf = false;
        }, prepareProperties: function(t6, e5) {
          var i7, s7 = this.dynamicProperties.length;
          for (i7 = 0; i7 < s7; i7 += 1) (e5 || this._isParent && "transform" === this.dynamicProperties[i7].propType) && (this.dynamicProperties[i7].getValue(), this.dynamicProperties[i7]._mdf && (this.globalData._mdf = true, this._mdf = true));
        }, addDynamicProperty: function(t6) {
          -1 === this.dynamicProperties.indexOf(t6) && this.dynamicProperties.push(t6);
        } }, Le.prototype.prepareFrame = function() {
        }, p6([be, Me, Ie], Le), Le.prototype.getBaseElement = function() {
          return null;
        }, Le.prototype.renderFrame = function() {
        }, Le.prototype.destroy = function() {
        }, Le.prototype.initExpressions = function() {
        }, Le.prototype.getFootageData = function() {
          return this.footageData;
        }, Oe.prototype.prepareFrame = function(t6) {
          if (this.prepareRenderableFrame(t6, true), this.prepareProperties(t6, true), this.tm._placeholder) this._currentTime = t6 / this.data.sr;
          else {
            var e5 = this.tm.v;
            this._currentTime = e5;
          }
          this._volume = this.lv.v[0];
          var i7 = this._volume * this._volumeMultiplier;
          this._previousVolume !== i7 && (this._previousVolume = i7, this.audio.volume(i7));
        }, p6([be, Me, Ie], Oe), Oe.prototype.renderFrame = function() {
          this.isInRange && this._canPlay && (this._isPlaying ? (!this.audio.playing() || Math.abs(this._currentTime / this.globalData.frameRate - this.audio.seek()) > 0.1) && this.audio.seek(this._currentTime / this.globalData.frameRate) : (this.audio.play(), this.audio.seek(this._currentTime / this.globalData.frameRate), this._isPlaying = true));
        }, Oe.prototype.show = function() {
        }, Oe.prototype.hide = function() {
          this.audio.pause(), this._isPlaying = false;
        }, Oe.prototype.pause = function() {
          this.audio.pause(), this._isPlaying = false, this._canPlay = false;
        }, Oe.prototype.resume = function() {
          this._canPlay = true;
        }, Oe.prototype.setRate = function(t6) {
          this.audio.rate(t6);
        }, Oe.prototype.volume = function(t6) {
          this._volumeMultiplier = t6, this._previousVolume = t6 * this._volume, this.audio.volume(this._previousVolume);
        }, Oe.prototype.getBaseElement = function() {
          return null;
        }, Oe.prototype.destroy = function() {
        }, Oe.prototype.sourceRectAtTime = function() {
        }, Oe.prototype.initExpressions = function() {
        }, Re.prototype.checkLayers = function(t6) {
          var e5, i7, s7 = this.layers.length;
          for (this.completeLayers = true, e5 = s7 - 1; e5 >= 0; e5 -= 1) this.elements[e5] || (i7 = this.layers[e5]).ip - i7.st <= t6 - this.layers[e5].st && i7.op - i7.st > t6 - this.layers[e5].st && this.buildItem(e5), this.completeLayers = !!this.elements[e5] && this.completeLayers;
          this.checkPendingElements();
        }, Re.prototype.createItem = function(t6) {
          switch (t6.ty) {
            case 2:
              return this.createImage(t6);
            case 0:
              return this.createComp(t6);
            case 1:
              return this.createSolid(t6);
            case 3:
            default:
              return this.createNull(t6);
            case 4:
              return this.createShape(t6);
            case 5:
              return this.createText(t6);
            case 6:
              return this.createAudio(t6);
            case 13:
              return this.createCamera(t6);
            case 15:
              return this.createFootage(t6);
          }
        }, Re.prototype.createCamera = function() {
          throw new Error("You're using a 3d camera. Try the html renderer.");
        }, Re.prototype.createAudio = function(t6) {
          return new Oe(t6, this.globalData, this);
        }, Re.prototype.createFootage = function(t6) {
          return new Le(t6, this.globalData, this);
        }, Re.prototype.buildAllItems = function() {
          var t6, e5 = this.layers.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.buildItem(t6);
          this.checkPendingElements();
        }, Re.prototype.includeLayers = function(t6) {
          var e5;
          this.completeLayers = false;
          var i7, s7 = t6.length, a6 = this.layers.length;
          for (e5 = 0; e5 < s7; e5 += 1) for (i7 = 0; i7 < a6; ) {
            if (this.layers[i7].id === t6[e5].id) {
              this.layers[i7] = t6[e5];
              break;
            }
            i7 += 1;
          }
        }, Re.prototype.setProjectInterface = function(t6) {
          this.globalData.projectInterface = t6;
        }, Re.prototype.initItems = function() {
          this.globalData.progressiveLoad || this.buildAllItems();
        }, Re.prototype.buildElementParenting = function(t6, e5, i7) {
          for (var s7 = this.elements, a6 = this.layers, r6 = 0, n5 = a6.length; r6 < n5; ) a6[r6].ind == e5 && (s7[r6] && true !== s7[r6] ? (i7.push(s7[r6]), s7[r6].setAsParent(), void 0 !== a6[r6].parent ? this.buildElementParenting(t6, a6[r6].parent, i7) : t6.setHierarchy(i7)) : (this.buildItem(r6), this.addPendingElement(t6))), r6 += 1;
        }, Re.prototype.addPendingElement = function(t6) {
          this.pendingElements.push(t6);
        }, Re.prototype.searchExtraCompositions = function(t6) {
          var e5, i7 = t6.length;
          for (e5 = 0; e5 < i7; e5 += 1) if (t6[e5].xt) {
            var s7 = this.createComp(t6[e5]);
            s7.initExpressions(), this.globalData.projectInterface.registerComposition(s7);
          }
        }, Re.prototype.getElementById = function(t6) {
          var e5, i7 = this.elements.length;
          for (e5 = 0; e5 < i7; e5 += 1) if (this.elements[e5].data.ind === t6) return this.elements[e5];
          return null;
        }, Re.prototype.getElementByPath = function(t6) {
          var e5, i7 = t6.shift();
          if ("number" == typeof i7) e5 = this.elements[i7];
          else {
            var s7, a6 = this.elements.length;
            for (s7 = 0; s7 < a6; s7 += 1) if (this.elements[s7].data.nm === i7) {
              e5 = this.elements[s7];
              break;
            }
          }
          return 0 === t6.length ? e5 : e5.getElementByPath(t6);
        }, Re.prototype.setupGlobalData = function(t6, e5) {
          this.globalData.fontManager = new ge(), this.globalData.slotManager = ye(t6), this.globalData.fontManager.addChars(t6.chars), this.globalData.fontManager.addFonts(t6.fonts, e5), this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem), this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem), this.globalData.imageLoader = this.animationItem.imagePreloader, this.globalData.audioController = this.animationItem.audioController, this.globalData.frameId = 0, this.globalData.frameRate = t6.fr, this.globalData.nm = t6.nm, this.globalData.compSize = { w: t6.w, h: t6.h };
        };
        var Ve = function() {
          var t6 = [0, 0];
          function e5(t7) {
            var e6 = this._mdf;
            this.iterateDynamicProperties(), this._mdf = this._mdf || e6, this.a && t7.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]), this.s && t7.scale(this.s.v[0], this.s.v[1], this.s.v[2]), this.sk && t7.skewFromAxis(-this.sk.v, this.sa.v), this.r ? t7.rotate(-this.r.v) : t7.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]), this.data.p.s ? this.data.p.z ? t7.translate(this.px.v, this.py.v, -this.pz.v) : t7.translate(this.px.v, this.py.v, 0) : t7.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
          }
          function i7(e6) {
            if (this.elem.globalData.frameId !== this.frameId) {
              if (this._isDirty && (this.precalculateMatrix(), this._isDirty = false), this.iterateDynamicProperties(), this._mdf || e6) {
                var i8;
                if (this.v.cloneFromProps(this.pre.props), this.appliedTransformations < 1 && this.v.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]), this.appliedTransformations < 2 && this.v.scale(this.s.v[0], this.s.v[1], this.s.v[2]), this.sk && this.appliedTransformations < 3 && this.v.skewFromAxis(-this.sk.v, this.sa.v), this.r && this.appliedTransformations < 4 ? this.v.rotate(-this.r.v) : !this.r && this.appliedTransformations < 4 && this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]), this.autoOriented) {
                  var s8, a7;
                  if (i8 = this.elem.globalData.frameRate, this.p && this.p.keyframes && this.p.getValueAtTime) this.p._caching.lastFrame + this.p.offsetTime <= this.p.keyframes[0].t ? (s8 = this.p.getValueAtTime((this.p.keyframes[0].t + 0.01) / i8, 0), a7 = this.p.getValueAtTime(this.p.keyframes[0].t / i8, 0)) : this.p._caching.lastFrame + this.p.offsetTime >= this.p.keyframes[this.p.keyframes.length - 1].t ? (s8 = this.p.getValueAtTime(this.p.keyframes[this.p.keyframes.length - 1].t / i8, 0), a7 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t - 0.05) / i8, 0)) : (s8 = this.p.pv, a7 = this.p.getValueAtTime((this.p._caching.lastFrame + this.p.offsetTime - 0.01) / i8, this.p.offsetTime));
                  else if (this.px && this.px.keyframes && this.py.keyframes && this.px.getValueAtTime && this.py.getValueAtTime) {
                    s8 = [], a7 = [];
                    var r7 = this.px, n6 = this.py;
                    r7._caching.lastFrame + r7.offsetTime <= r7.keyframes[0].t ? (s8[0] = r7.getValueAtTime((r7.keyframes[0].t + 0.01) / i8, 0), s8[1] = n6.getValueAtTime((n6.keyframes[0].t + 0.01) / i8, 0), a7[0] = r7.getValueAtTime(r7.keyframes[0].t / i8, 0), a7[1] = n6.getValueAtTime(n6.keyframes[0].t / i8, 0)) : r7._caching.lastFrame + r7.offsetTime >= r7.keyframes[r7.keyframes.length - 1].t ? (s8[0] = r7.getValueAtTime(r7.keyframes[r7.keyframes.length - 1].t / i8, 0), s8[1] = n6.getValueAtTime(n6.keyframes[n6.keyframes.length - 1].t / i8, 0), a7[0] = r7.getValueAtTime((r7.keyframes[r7.keyframes.length - 1].t - 0.01) / i8, 0), a7[1] = n6.getValueAtTime((n6.keyframes[n6.keyframes.length - 1].t - 0.01) / i8, 0)) : (s8 = [r7.pv, n6.pv], a7[0] = r7.getValueAtTime((r7._caching.lastFrame + r7.offsetTime - 0.01) / i8, r7.offsetTime), a7[1] = n6.getValueAtTime((n6._caching.lastFrame + n6.offsetTime - 0.01) / i8, n6.offsetTime));
                  } else s8 = a7 = t6;
                  this.v.rotate(-Math.atan2(s8[1] - a7[1], s8[0] - a7[0]));
                }
                this.data.p && this.data.p.s ? this.data.p.z ? this.v.translate(this.px.v, this.py.v, -this.pz.v) : this.v.translate(this.px.v, this.py.v, 0) : this.v.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
              }
              this.frameId = this.elem.globalData.frameId;
            }
          }
          function s7() {
            if (this.appliedTransformations = 0, this.pre.reset(), !this.a.effectsSequence.length && (this.pre.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]), this.appliedTransformations = 1, !this.s.effectsSequence.length)) {
              if (this.pre.scale(this.s.v[0], this.s.v[1], this.s.v[2]), this.appliedTransformations = 2, this.sk) {
                if (this.sk.effectsSequence.length || this.sa.effectsSequence.length) return;
                this.pre.skewFromAxis(-this.sk.v, this.sa.v), this.appliedTransformations = 3;
              }
              this.r ? this.r.effectsSequence.length || (this.pre.rotate(-this.r.v), this.appliedTransformations = 4) : this.rz.effectsSequence.length || this.ry.effectsSequence.length || this.rx.effectsSequence.length || this.or.effectsSequence.length || (this.pre.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]), this.appliedTransformations = 4);
            }
          }
          function a6() {
          }
          function r6(t7) {
            this._addDynamicProperty(t7), this.elem.addDynamicProperty(t7), this._isDirty = true;
          }
          function n5(t7, e6, i8) {
            if (this.elem = t7, this.frameId = -1, this.propType = "transform", this.data = e6, this.v = new Zt(), this.pre = new Zt(), this.appliedTransformations = 0, this.initDynamicPropertyContainer(i8 || t7), e6.p && e6.p.s ? (this.px = qt.getProp(t7, e6.p.x, 0, 0, this), this.py = qt.getProp(t7, e6.p.y, 0, 0, this), e6.p.z && (this.pz = qt.getProp(t7, e6.p.z, 0, 0, this))) : this.p = qt.getProp(t7, e6.p || { k: [0, 0, 0] }, 1, 0, this), e6.rx) {
              if (this.rx = qt.getProp(t7, e6.rx, 0, A6, this), this.ry = qt.getProp(t7, e6.ry, 0, A6, this), this.rz = qt.getProp(t7, e6.rz, 0, A6, this), e6.or.k[0].ti) {
                var s8, a7 = e6.or.k.length;
                for (s8 = 0; s8 < a7; s8 += 1) e6.or.k[s8].to = null, e6.or.k[s8].ti = null;
              }
              this.or = qt.getProp(t7, e6.or, 1, A6, this), this.or.sh = true;
            } else this.r = qt.getProp(t7, e6.r || { k: 0 }, 0, A6, this);
            e6.sk && (this.sk = qt.getProp(t7, e6.sk, 0, A6, this), this.sa = qt.getProp(t7, e6.sa, 0, A6, this)), this.a = qt.getProp(t7, e6.a || { k: [0, 0, 0] }, 1, 0, this), this.s = qt.getProp(t7, e6.s || { k: [100, 100, 100] }, 1, 0.01, this), e6.o ? this.o = qt.getProp(t7, e6.o, 0, 0.01, t7) : this.o = { _mdf: false, v: 1 }, this._isDirty = true, this.dynamicProperties.length || this.getValue(true);
          }
          function o6(t7, e6, i8) {
            return new n5(t7, e6, i8);
          }
          return n5.prototype = { applyToMatrix: e5, getValue: i7, precalculateMatrix: s7, autoOrient: a6 }, p6([Wt], n5), n5.prototype.addDynamicProperty = r6, n5.prototype._addDynamicProperty = Wt.prototype.addDynamicProperty, { getTransformProperty: o6 };
        }(), Ne = { TRANSFORM_EFFECT: "transformEFfect" };
        function ze() {
        }
        function je(t6, e5, i7) {
          this.data = t6, this.element = e5, this.globalData = i7, this.storedData = [], this.masksProperties = this.data.masksProperties || [], this.maskElement = null;
          var s7, a6, r6 = this.globalData.defs, n5 = this.masksProperties ? this.masksProperties.length : 0;
          this.viewData = c5(n5), this.solidPath = "";
          var o6, l7, p7, d7, f6, m6, u6 = this.masksProperties, g8 = 0, v6 = [], y7 = L3(), b6 = "clipPath", _7 = "clip-path";
          for (s7 = 0; s7 < n5; s7 += 1) if (("a" !== u6[s7].mode && "n" !== u6[s7].mode || u6[s7].inv || 100 !== u6[s7].o.k || u6[s7].o.x) && (b6 = "mask", _7 = "mask"), "s" !== u6[s7].mode && "i" !== u6[s7].mode || 0 !== g8 ? p7 = null : ((p7 = U2("rect")).setAttribute("fill", "#ffffff"), p7.setAttribute("width", this.element.comp.data.w || 0), p7.setAttribute("height", this.element.comp.data.h || 0), v6.push(p7)), a6 = U2("path"), "n" === u6[s7].mode) this.viewData[s7] = { op: qt.getProp(this.element, u6[s7].o, 0, 0.01, this.element), prop: Yt.getShapeProp(this.element, u6[s7], 3), elem: a6, lastPath: "" }, r6.appendChild(a6);
          else {
            var k6;
            if (g8 += 1, a6.setAttribute("fill", "s" === u6[s7].mode ? "#000000" : "#ffffff"), a6.setAttribute("clip-rule", "nonzero"), 0 !== u6[s7].x.k ? (b6 = "mask", _7 = "mask", m6 = qt.getProp(this.element, u6[s7].x, 0, null, this.element), k6 = L3(), (d7 = U2("filter")).setAttribute("id", k6), (f6 = U2("feMorphology")).setAttribute("operator", "erode"), f6.setAttribute("in", "SourceGraphic"), f6.setAttribute("radius", "0"), d7.appendChild(f6), r6.appendChild(d7), a6.setAttribute("stroke", "s" === u6[s7].mode ? "#000000" : "#ffffff")) : (f6 = null, m6 = null), this.storedData[s7] = { elem: a6, x: m6, expan: f6, lastPath: "", lastOperator: "", filterId: k6, lastRadius: 0 }, "i" === u6[s7].mode) {
              l7 = v6.length;
              var w7 = U2("g");
              for (o6 = 0; o6 < l7; o6 += 1) w7.appendChild(v6[o6]);
              var S4 = U2("mask");
              S4.setAttribute("mask-type", "alpha"), S4.setAttribute("id", y7 + "_" + g8), S4.appendChild(a6), r6.appendChild(S4), w7.setAttribute("mask", "url(" + h6() + "#" + y7 + "_" + g8 + ")"), v6.length = 0, v6.push(w7);
            } else v6.push(a6);
            u6[s7].inv && !this.solidPath && (this.solidPath = this.createLayerSolidPath()), this.viewData[s7] = { elem: a6, lastPath: "", op: qt.getProp(this.element, u6[s7].o, 0, 0.01, this.element), prop: Yt.getShapeProp(this.element, u6[s7], 3), invRect: p7 }, this.viewData[s7].prop.k || this.drawPath(u6[s7], this.viewData[s7].prop.v, this.viewData[s7]);
          }
          for (this.maskElement = U2(b6), n5 = v6.length, s7 = 0; s7 < n5; s7 += 1) this.maskElement.appendChild(v6[s7]);
          g8 > 0 && (this.maskElement.setAttribute("id", y7), this.element.maskedElement.setAttribute(_7, "url(" + h6() + "#" + y7 + ")"), r6.appendChild(this.maskElement)), this.viewData.length && this.element.addRenderableComponent(this);
        }
        ze.prototype = { initTransform: function() {
          var t6 = new Zt();
          this.finalTransform = { mProp: this.data.ks ? Ve.getTransformProperty(this, this.data.ks, this) : { o: 0 }, _matMdf: false, _localMatMdf: false, _opMdf: false, mat: t6, localMat: t6, localOpacity: 1 }, this.data.ao && (this.finalTransform.mProp.autoOriented = true), this.data.ty;
        }, renderTransform: function() {
          if (this.finalTransform._opMdf = this.finalTransform.mProp.o._mdf || this._isFirstFrame, this.finalTransform._matMdf = this.finalTransform.mProp._mdf || this._isFirstFrame, this.hierarchy) {
            var t6, e5 = this.finalTransform.mat, i7 = 0, s7 = this.hierarchy.length;
            if (!this.finalTransform._matMdf) for (; i7 < s7; ) {
              if (this.hierarchy[i7].finalTransform.mProp._mdf) {
                this.finalTransform._matMdf = true;
                break;
              }
              i7 += 1;
            }
            if (this.finalTransform._matMdf) for (t6 = this.finalTransform.mProp.v.props, e5.cloneFromProps(t6), i7 = 0; i7 < s7; i7 += 1) e5.multiply(this.hierarchy[i7].finalTransform.mProp.v);
          }
          this.localTransforms && !this.finalTransform._matMdf || (this.finalTransform._localMatMdf = this.finalTransform._matMdf), this.finalTransform._opMdf && (this.finalTransform.localOpacity = this.finalTransform.mProp.o.v);
        }, renderLocalTransform: function() {
          if (this.localTransforms) {
            var t6 = 0, e5 = this.localTransforms.length;
            if (this.finalTransform._localMatMdf = this.finalTransform._matMdf, !this.finalTransform._localMatMdf || !this.finalTransform._opMdf) for (; t6 < e5; ) this.localTransforms[t6]._mdf && (this.finalTransform._localMatMdf = true), this.localTransforms[t6]._opMdf && !this.finalTransform._opMdf && (this.finalTransform.localOpacity = this.finalTransform.mProp.o.v, this.finalTransform._opMdf = true), t6 += 1;
            if (this.finalTransform._localMatMdf) {
              var i7 = this.finalTransform.localMat;
              for (this.localTransforms[0].matrix.clone(i7), t6 = 1; t6 < e5; t6 += 1) {
                var s7 = this.localTransforms[t6].matrix;
                i7.multiply(s7);
              }
              i7.multiply(this.finalTransform.mat);
            }
            if (this.finalTransform._opMdf) {
              var a6 = this.finalTransform.localOpacity;
              for (t6 = 0; t6 < e5; t6 += 1) a6 *= 0.01 * this.localTransforms[t6].opacity;
              this.finalTransform.localOpacity = a6;
            }
          }
        }, searchEffectTransforms: function() {
          if (this.renderableEffectsManager) {
            var t6 = this.renderableEffectsManager.getEffects(Ne.TRANSFORM_EFFECT);
            if (t6.length) {
              this.localTransforms = [], this.finalTransform.localMat = new Zt();
              var e5 = 0, i7 = t6.length;
              for (e5 = 0; e5 < i7; e5 += 1) this.localTransforms.push(t6[e5]);
            }
          }
        }, globalToLocal: function(t6) {
          var e5 = [];
          e5.push(this.finalTransform);
          for (var i7, s7 = true, a6 = this.comp; s7; ) a6.finalTransform ? (a6.data.hasMask && e5.splice(0, 0, a6.finalTransform), a6 = a6.comp) : s7 = false;
          var r6, n5 = e5.length;
          for (i7 = 0; i7 < n5; i7 += 1) r6 = e5[i7].mat.applyToPointArray(0, 0, 0), t6 = [t6[0] - r6[0], t6[1] - r6[1], 0];
          return t6;
        }, mHelper: new Zt() }, je.prototype.getMaskProperty = function(t6) {
          return this.viewData[t6].prop;
        }, je.prototype.renderFrame = function(t6) {
          var e5, i7 = this.element.finalTransform.mat, s7 = this.masksProperties.length;
          for (e5 = 0; e5 < s7; e5 += 1) if ((this.viewData[e5].prop._mdf || t6) && this.drawPath(this.masksProperties[e5], this.viewData[e5].prop.v, this.viewData[e5]), (this.viewData[e5].op._mdf || t6) && this.viewData[e5].elem.setAttribute("fill-opacity", this.viewData[e5].op.v), "n" !== this.masksProperties[e5].mode && (this.viewData[e5].invRect && (this.element.finalTransform.mProp._mdf || t6) && this.viewData[e5].invRect.setAttribute("transform", i7.getInverseMatrix().to2dCSS()), this.storedData[e5].x && (this.storedData[e5].x._mdf || t6))) {
            var a6 = this.storedData[e5].expan;
            this.storedData[e5].x.v < 0 ? ("erode" !== this.storedData[e5].lastOperator && (this.storedData[e5].lastOperator = "erode", this.storedData[e5].elem.setAttribute("filter", "url(" + h6() + "#" + this.storedData[e5].filterId + ")")), a6.setAttribute("radius", -this.storedData[e5].x.v)) : ("dilate" !== this.storedData[e5].lastOperator && (this.storedData[e5].lastOperator = "dilate", this.storedData[e5].elem.setAttribute("filter", null)), this.storedData[e5].elem.setAttribute("stroke-width", 2 * this.storedData[e5].x.v));
          }
        }, je.prototype.getMaskelement = function() {
          return this.maskElement;
        }, je.prototype.createLayerSolidPath = function() {
          var t6 = "M0,0 ";
          return t6 += " h" + this.globalData.compSize.w, t6 += " v" + this.globalData.compSize.h, t6 += " h-" + this.globalData.compSize.w, t6 += " v-" + this.globalData.compSize.h + " ";
        }, je.prototype.drawPath = function(t6, e5, i7) {
          var s7, a6, r6 = " M" + e5.v[0][0] + "," + e5.v[0][1];
          for (a6 = e5._length, s7 = 1; s7 < a6; s7 += 1) r6 += " C" + e5.o[s7 - 1][0] + "," + e5.o[s7 - 1][1] + " " + e5.i[s7][0] + "," + e5.i[s7][1] + " " + e5.v[s7][0] + "," + e5.v[s7][1];
          if (e5.c && a6 > 1 && (r6 += " C" + e5.o[s7 - 1][0] + "," + e5.o[s7 - 1][1] + " " + e5.i[0][0] + "," + e5.i[0][1] + " " + e5.v[0][0] + "," + e5.v[0][1]), i7.lastPath !== r6) {
            var n5 = "";
            i7.elem && (e5.c && (n5 = t6.inv ? this.solidPath + r6 : r6), i7.elem.setAttribute("d", n5)), i7.lastPath = r6;
          }
        }, je.prototype.destroy = function() {
          this.element = null, this.globalData = null, this.maskElement = null, this.data = null, this.masksProperties = null;
        };
        var Be, qe = function() {
          var t6 = {};
          function e5(t7, e6) {
            var i8 = U2("filter");
            return i8.setAttribute("id", t7), true !== e6 && (i8.setAttribute("filterUnits", "objectBoundingBox"), i8.setAttribute("x", "0%"), i8.setAttribute("y", "0%"), i8.setAttribute("width", "100%"), i8.setAttribute("height", "100%")), i8;
          }
          function i7() {
            var t7 = U2("feColorMatrix");
            return t7.setAttribute("type", "matrix"), t7.setAttribute("color-interpolation-filters", "sRGB"), t7.setAttribute("values", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1"), t7;
          }
          return t6.createFilter = e5, t6.createAlphaToLuminanceFilter = i7, t6;
        }(), We = (Be = { maskType: true, svgLumaHidden: true, offscreenCanvas: "undefined" != typeof OffscreenCanvas }, (/MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) && (Be.maskType = false), /firefox/i.test(navigator.userAgent) && (Be.svgLumaHidden = false), Be), $e = {}, He = "filter_result_";
        function Ge(t6) {
          var e5, i7, s7 = "SourceGraphic", a6 = t6.data.ef ? t6.data.ef.length : 0, r6 = L3(), n5 = qe.createFilter(r6, true), o6 = 0;
          for (this.filters = [], e5 = 0; e5 < a6; e5 += 1) {
            i7 = null;
            var l7 = t6.data.ef[e5].ty;
            $e[l7] && (i7 = new (0, $e[l7].effect)(n5, t6.effectsManager.effectElements[e5], t6, He + o6, s7), s7 = He + o6, $e[l7].countsAsEffect && (o6 += 1)), i7 && this.filters.push(i7);
          }
          o6 && (t6.globalData.defs.appendChild(n5), t6.layerElement.setAttribute("filter", "url(" + h6() + "#" + r6 + ")")), this.filters.length && t6.addRenderableComponent(this);
        }
        function Xe(t6, e5, i7) {
          $e[t6] = { effect: e5, countsAsEffect: i7 };
        }
        function Ue() {
        }
        function Ye() {
        }
        function Ze() {
        }
        function Je(t6, e5, i7) {
          this.assetData = e5.getAssetData(t6.refId), this.assetData && this.assetData.sid && (this.assetData = e5.slotManager.getProp(this.assetData)), this.initElement(t6, e5, i7), this.sourceRect = { top: 0, left: 0, width: this.assetData.w, height: this.assetData.h };
        }
        function Ke(t6, e5) {
          this.elem = t6, this.pos = e5;
        }
        function Qe() {
        }
        Ge.prototype.renderFrame = function(t6) {
          var e5, i7 = this.filters.length;
          for (e5 = 0; e5 < i7; e5 += 1) this.filters[e5].renderFrame(t6);
        }, Ge.prototype.getEffects = function(t6) {
          var e5, i7 = this.filters.length, s7 = [];
          for (e5 = 0; e5 < i7; e5 += 1) this.filters[e5].type === t6 && s7.push(this.filters[e5]);
          return s7;
        }, Ue.prototype = { initRendererElement: function() {
          this.layerElement = U2("g");
        }, createContainerElements: function() {
          this.matteElement = U2("g"), this.transformedElement = this.layerElement, this.maskedElement = this.layerElement, this._sizeChanged = false;
          var t6 = null;
          if (this.data.td) {
            this.matteMasks = {};
            var e5 = U2("g");
            e5.setAttribute("id", this.layerId), e5.appendChild(this.layerElement), t6 = e5, this.globalData.defs.appendChild(e5);
          } else this.data.tt ? (this.matteElement.appendChild(this.layerElement), t6 = this.matteElement, this.baseElement = this.matteElement) : this.baseElement = this.layerElement;
          if (this.data.ln && this.layerElement.setAttribute("id", this.data.ln), this.data.cl && this.layerElement.setAttribute("class", this.data.cl), 0 === this.data.ty && !this.data.hd) {
            var i7 = U2("clipPath"), s7 = U2("path");
            s7.setAttribute("d", "M0,0 L" + this.data.w + ",0 L" + this.data.w + "," + this.data.h + " L0," + this.data.h + "z");
            var a6 = L3();
            if (i7.setAttribute("id", a6), i7.appendChild(s7), this.globalData.defs.appendChild(i7), this.checkMasks()) {
              var r6 = U2("g");
              r6.setAttribute("clip-path", "url(" + h6() + "#" + a6 + ")"), r6.appendChild(this.layerElement), this.transformedElement = r6, t6 ? t6.appendChild(this.transformedElement) : this.baseElement = this.transformedElement;
            } else this.layerElement.setAttribute("clip-path", "url(" + h6() + "#" + a6 + ")");
          }
          0 !== this.data.bm && this.setBlendMode();
        }, renderElement: function() {
          this.finalTransform._localMatMdf && this.transformedElement.setAttribute("transform", this.finalTransform.localMat.to2dCSS()), this.finalTransform._opMdf && this.transformedElement.setAttribute("opacity", this.finalTransform.localOpacity);
        }, destroyBaseElement: function() {
          this.layerElement = null, this.matteElement = null, this.maskManager.destroy();
        }, getBaseElement: function() {
          return this.data.hd ? null : this.baseElement;
        }, createRenderableComponents: function() {
          this.maskManager = new je(this.data, this, this.globalData), this.renderableEffectsManager = new Ge(this), this.searchEffectTransforms();
        }, getMatte: function(t6) {
          if (this.matteMasks || (this.matteMasks = {}), !this.matteMasks[t6]) {
            var e5, i7, s7, a6, r6 = this.layerId + "_" + t6;
            if (1 === t6 || 3 === t6) {
              var n5 = U2("mask");
              n5.setAttribute("id", r6), n5.setAttribute("mask-type", 3 === t6 ? "luminance" : "alpha"), (s7 = U2("use")).setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId), n5.appendChild(s7), this.globalData.defs.appendChild(n5), We.maskType || 1 !== t6 || (n5.setAttribute("mask-type", "luminance"), e5 = L3(), i7 = qe.createFilter(e5), this.globalData.defs.appendChild(i7), i7.appendChild(qe.createAlphaToLuminanceFilter()), (a6 = U2("g")).appendChild(s7), n5.appendChild(a6), a6.setAttribute("filter", "url(" + h6() + "#" + e5 + ")"));
            } else if (2 === t6) {
              var o6 = U2("mask");
              o6.setAttribute("id", r6), o6.setAttribute("mask-type", "alpha");
              var l7 = U2("g");
              o6.appendChild(l7), e5 = L3(), i7 = qe.createFilter(e5);
              var p7 = U2("feComponentTransfer");
              p7.setAttribute("in", "SourceGraphic"), i7.appendChild(p7);
              var d7 = U2("feFuncA");
              d7.setAttribute("type", "table"), d7.setAttribute("tableValues", "1.0 0.0"), p7.appendChild(d7), this.globalData.defs.appendChild(i7);
              var f6 = U2("rect");
              f6.setAttribute("width", this.comp.data.w), f6.setAttribute("height", this.comp.data.h), f6.setAttribute("x", "0"), f6.setAttribute("y", "0"), f6.setAttribute("fill", "#ffffff"), f6.setAttribute("opacity", "0"), l7.setAttribute("filter", "url(" + h6() + "#" + e5 + ")"), l7.appendChild(f6), (s7 = U2("use")).setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + this.layerId), l7.appendChild(s7), We.maskType || (o6.setAttribute("mask-type", "luminance"), i7.appendChild(qe.createAlphaToLuminanceFilter()), a6 = U2("g"), l7.appendChild(f6), a6.appendChild(this.layerElement), l7.appendChild(a6)), this.globalData.defs.appendChild(o6);
            }
            this.matteMasks[t6] = r6;
          }
          return this.matteMasks[t6];
        }, setMatte: function(t6) {
          this.matteElement && this.matteElement.setAttribute("mask", "url(" + h6() + "#" + t6 + ")");
        } }, Ye.prototype = { initHierarchy: function() {
          this.hierarchy = [], this._isParent = false, this.checkParenting();
        }, setHierarchy: function(t6) {
          this.hierarchy = t6;
        }, setAsParent: function() {
          this._isParent = true;
        }, checkParenting: function() {
          void 0 !== this.data.parent && this.comp.buildElementParenting(this, this.data.parent, []);
        } }, p6([be, d6({ initElement: function(t6, e5, i7) {
          this.initFrame(), this.initBaseData(t6, e5, i7), this.initTransform(t6, e5, i7), this.initHierarchy(), this.initRenderable(), this.initRendererElement(), this.createContainerElements(), this.createRenderableComponents(), this.createContent(), this.hide();
        }, hide: function() {
          this.hidden || this.isInRange && !this.isTransparent || ((this.baseElement || this.layerElement).style.display = "none", this.hidden = true);
        }, show: function() {
          this.isInRange && !this.isTransparent && (this.data.hd || ((this.baseElement || this.layerElement).style.display = "block"), this.hidden = false, this._isFirstFrame = true);
        }, renderFrame: function() {
          this.data.hd || this.hidden || (this.renderTransform(), this.renderRenderable(), this.renderLocalTransform(), this.renderElement(), this.renderInnerContent(), this._isFirstFrame && (this._isFirstFrame = false));
        }, renderInnerContent: function() {
        }, prepareFrame: function(t6) {
          this._mdf = false, this.prepareRenderableFrame(t6), this.prepareProperties(t6, this.isInRange), this.checkTransparency();
        }, destroy: function() {
          this.innerElem = null, this.destroyBaseElement();
        } })], Ze), p6([Me, ze, Ue, Ye, Ie, Ze], Je), Je.prototype.createContent = function() {
          var t6 = this.globalData.getAssetsPath(this.assetData);
          this.innerElem = U2("image"), this.innerElem.setAttribute("width", this.assetData.w + "px"), this.innerElem.setAttribute("height", this.assetData.h + "px"), this.innerElem.setAttribute("preserveAspectRatio", this.assetData.pr || this.globalData.renderConfig.imagePreserveAspectRatio), this.innerElem.setAttributeNS("http://www.w3.org/1999/xlink", "href", t6), this.layerElement.appendChild(this.innerElem);
        }, Je.prototype.sourceRectAtTime = function() {
          return this.sourceRect;
        }, Qe.prototype = { addShapeToModifiers: function(t6) {
          var e5, i7 = this.shapeModifiers.length;
          for (e5 = 0; e5 < i7; e5 += 1) this.shapeModifiers[e5].addShape(t6);
        }, isShapeInAnimatedModifiers: function(t6) {
          for (var e5 = 0, i7 = this.shapeModifiers.length; e5 < i7; ) if (this.shapeModifiers[e5].isAnimatedWithShape(t6)) return true;
          return false;
        }, renderModifiers: function() {
          if (this.shapeModifiers.length) {
            var t6, e5 = this.shapes.length;
            for (t6 = 0; t6 < e5; t6 += 1) this.shapes[t6].sh.reset();
            for (t6 = (e5 = this.shapeModifiers.length) - 1; t6 >= 0 && !this.shapeModifiers[t6].processShapes(this._isFirstFrame); t6 -= 1) ;
          }
        }, searchProcessedElement: function(t6) {
          for (var e5 = this.processedElements, i7 = 0, s7 = e5.length; i7 < s7; ) {
            if (e5[i7].elem === t6) return e5[i7].pos;
            i7 += 1;
          }
          return 0;
        }, addProcessedElement: function(t6, e5) {
          for (var i7 = this.processedElements, s7 = i7.length; s7; ) if (i7[s7 -= 1].elem === t6) return void (i7[s7].pos = e5);
          i7.push(new Ke(t6, e5));
        }, prepareFrame: function(t6) {
          this.prepareRenderableFrame(t6), this.prepareProperties(t6, this.isInRange);
        } };
        var ti = function() {
          var t6 = {}, e5 = {};
          function i7(t7, i8) {
            e5[t7] || (e5[t7] = i8);
          }
          function s7(t7, i8, s8) {
            return new e5[t7](i8, s8);
          }
          return t6.registerModifier = i7, t6.getModifier = s7, t6;
        }();
        function ei() {
        }
        ei.prototype.initModifierProperties = function() {
        }, ei.prototype.addShapeToModifier = function() {
        }, ei.prototype.addShape = function(t6) {
          if (!this.closed) {
            t6.sh.container.addDynamicProperty(t6.sh);
            var e5 = { shape: t6.sh, data: t6, localShapeCollection: Ut.newShapeCollection() };
            this.shapes.push(e5), this.addShapeToModifier(e5), this._isAnimated && t6.setAsAnimated();
          }
        }, ei.prototype.init = function(t6, e5) {
          this.shapes = [], this.elem = t6, this.initDynamicPropertyContainer(t6), this.initModifierProperties(t6, e5), this.frameId = a5, this.closed = false, this.k = false, this.dynamicProperties.length ? this.k = true : this.getValue(true);
        }, ei.prototype.processKeys = function() {
          this.elem.globalData.frameId !== this.frameId && (this.frameId = this.elem.globalData.frameId, this.iterateDynamicProperties());
        }, p6([Wt], ei);
        var ii = { 1: "butt", 2: "round", 3: "square" }, si = { 1: "miter", 2: "round", 3: "bevel" };
        function ai(t6, e5, i7) {
          this.caches = [], this.styles = [], this.transformers = t6, this.lStr = "", this.sh = i7, this.lvl = e5, this._isAnimated = !!i7.k;
          for (var s7 = 0, a6 = t6.length; s7 < a6; ) {
            if (t6[s7].mProps.dynamicProperties.length) {
              this._isAnimated = true;
              break;
            }
            s7 += 1;
          }
        }
        function ri(t6, e5) {
          this.data = t6, this.type = t6.ty, this.d = "", this.lvl = e5, this._mdf = false, this.closed = true === t6.hd, this.pElem = U2("path"), this.msElem = null;
        }
        function ni(t6, e5, i7, s7) {
          var a6;
          this.elem = t6, this.frameId = -1, this.dataProps = c5(e5.length), this.renderer = i7, this.k = false, this.dashStr = "", this.dashArray = m5("float32", e5.length ? e5.length - 1 : 0), this.dashoffset = m5("float32", 1), this.initDynamicPropertyContainer(s7);
          var r6, n5 = e5.length || 0;
          for (a6 = 0; a6 < n5; a6 += 1) r6 = qt.getProp(t6, e5[a6].v, 0, 0, this), this.k = r6.k || this.k, this.dataProps[a6] = { n: e5[a6].n, p: r6 };
          this.k || this.getValue(true), this._isAnimated = this.k;
        }
        function oi(t6, e5, i7) {
          this.initDynamicPropertyContainer(t6), this.getValue = this.iterateDynamicProperties, this.o = qt.getProp(t6, e5.o, 0, 0.01, this), this.w = qt.getProp(t6, e5.w, 0, null, this), this.d = new ni(t6, e5.d || {}, "svg", this), this.c = qt.getProp(t6, e5.c, 1, 255, this), this.style = i7, this._isAnimated = !!this._isAnimated;
        }
        function hi(t6, e5, i7) {
          this.initDynamicPropertyContainer(t6), this.getValue = this.iterateDynamicProperties, this.o = qt.getProp(t6, e5.o, 0, 0.01, this), this.c = qt.getProp(t6, e5.c, 1, 255, this), this.style = i7;
        }
        function li(t6, e5, i7) {
          this.initDynamicPropertyContainer(t6), this.getValue = this.iterateDynamicProperties, this.style = i7;
        }
        function pi(t6, e5, i7) {
          this.data = e5, this.c = m5("uint8c", 4 * e5.p);
          var s7 = e5.k.k[0].s ? e5.k.k[0].s.length - 4 * e5.p : e5.k.k.length - 4 * e5.p;
          this.o = m5("float32", s7), this._cmdf = false, this._omdf = false, this._collapsable = this.checkCollapsable(), this._hasOpacity = s7, this.initDynamicPropertyContainer(i7), this.prop = qt.getProp(t6, e5.k, 1, null, this), this.k = this.prop.k, this.getValue(true);
        }
        function di(t6, e5, i7) {
          this.initDynamicPropertyContainer(t6), this.getValue = this.iterateDynamicProperties, this.initGradientData(t6, e5, i7);
        }
        function fi(t6, e5, i7) {
          this.initDynamicPropertyContainer(t6), this.getValue = this.iterateDynamicProperties, this.w = qt.getProp(t6, e5.w, 0, null, this), this.d = new ni(t6, e5.d || {}, "svg", this), this.initGradientData(t6, e5, i7), this._isAnimated = !!this._isAnimated;
        }
        function mi() {
          this.it = [], this.prevViewData = [], this.gr = U2("g");
        }
        function ci(t6, e5, i7) {
          this.transform = { mProps: t6, op: e5, container: i7 }, this.elements = [], this._isAnimated = this.transform.mProps.dynamicProperties.length || this.transform.op.effectsSequence.length;
        }
        ai.prototype.setAsAnimated = function() {
          this._isAnimated = true;
        }, ri.prototype.reset = function() {
          this.d = "", this._mdf = false;
        }, ni.prototype.getValue = function(t6) {
          if ((this.elem.globalData.frameId !== this.frameId || t6) && (this.frameId = this.elem.globalData.frameId, this.iterateDynamicProperties(), this._mdf = this._mdf || t6, this._mdf)) {
            var e5 = 0, i7 = this.dataProps.length;
            for ("svg" === this.renderer && (this.dashStr = ""), e5 = 0; e5 < i7; e5 += 1) "o" !== this.dataProps[e5].n ? "svg" === this.renderer ? this.dashStr += " " + this.dataProps[e5].p.v : this.dashArray[e5] = this.dataProps[e5].p.v : this.dashoffset[0] = this.dataProps[e5].p.v;
          }
        }, p6([Wt], ni), p6([Wt], oi), p6([Wt], hi), p6([Wt], li), pi.prototype.comparePoints = function(t6, e5) {
          for (var i7 = 0, s7 = this.o.length / 2; i7 < s7; ) {
            if (Math.abs(t6[4 * i7] - t6[4 * e5 + 2 * i7]) > 0.01) return false;
            i7 += 1;
          }
          return true;
        }, pi.prototype.checkCollapsable = function() {
          if (this.o.length / 2 != this.c.length / 4) return false;
          if (this.data.k.k[0].s) for (var t6 = 0, e5 = this.data.k.k.length; t6 < e5; ) {
            if (!this.comparePoints(this.data.k.k[t6].s, this.data.p)) return false;
            t6 += 1;
          }
          else if (!this.comparePoints(this.data.k.k, this.data.p)) return false;
          return true;
        }, pi.prototype.getValue = function(t6) {
          if (this.prop.getValue(), this._mdf = false, this._cmdf = false, this._omdf = false, this.prop._mdf || t6) {
            var e5, i7, s7, a6 = 4 * this.data.p;
            for (e5 = 0; e5 < a6; e5 += 1) i7 = e5 % 4 == 0 ? 100 : 255, s7 = Math.round(this.prop.v[e5] * i7), this.c[e5] !== s7 && (this.c[e5] = s7, this._cmdf = !t6);
            if (this.o.length) for (a6 = this.prop.v.length, e5 = 4 * this.data.p; e5 < a6; e5 += 1) i7 = e5 % 2 == 0 ? 100 : 1, s7 = e5 % 2 == 0 ? Math.round(100 * this.prop.v[e5]) : this.prop.v[e5], this.o[e5 - 4 * this.data.p] !== s7 && (this.o[e5 - 4 * this.data.p] = s7, this._omdf = !t6);
            this._mdf = !t6;
          }
        }, p6([Wt], pi), di.prototype.initGradientData = function(t6, e5, i7) {
          this.o = qt.getProp(t6, e5.o, 0, 0.01, this), this.s = qt.getProp(t6, e5.s, 1, null, this), this.e = qt.getProp(t6, e5.e, 1, null, this), this.h = qt.getProp(t6, e5.h || { k: 0 }, 0, 0.01, this), this.a = qt.getProp(t6, e5.a || { k: 0 }, 0, A6, this), this.g = new pi(t6, e5.g, this), this.style = i7, this.stops = [], this.setGradientData(i7.pElem, e5), this.setGradientOpacity(e5, i7), this._isAnimated = !!this._isAnimated;
        }, di.prototype.setGradientData = function(t6, e5) {
          var i7 = L3(), s7 = U2(1 === e5.t ? "linearGradient" : "radialGradient");
          s7.setAttribute("id", i7), s7.setAttribute("spreadMethod", "pad"), s7.setAttribute("gradientUnits", "userSpaceOnUse");
          var a6, r6, n5, o6 = [];
          for (n5 = 4 * e5.g.p, r6 = 0; r6 < n5; r6 += 4) a6 = U2("stop"), s7.appendChild(a6), o6.push(a6);
          t6.setAttribute("gf" === e5.ty ? "fill" : "stroke", "url(" + h6() + "#" + i7 + ")"), this.gf = s7, this.cst = o6;
        }, di.prototype.setGradientOpacity = function(t6, e5) {
          if (this.g._hasOpacity && !this.g._collapsable) {
            var i7, s7, a6, r6 = U2("mask"), n5 = U2("path");
            r6.appendChild(n5);
            var o6 = L3(), l7 = L3();
            r6.setAttribute("id", l7);
            var p7 = U2(1 === t6.t ? "linearGradient" : "radialGradient");
            p7.setAttribute("id", o6), p7.setAttribute("spreadMethod", "pad"), p7.setAttribute("gradientUnits", "userSpaceOnUse"), a6 = t6.g.k.k[0].s ? t6.g.k.k[0].s.length : t6.g.k.k.length;
            var d7 = this.stops;
            for (s7 = 4 * t6.g.p; s7 < a6; s7 += 2) (i7 = U2("stop")).setAttribute("stop-color", "rgb(255,255,255)"), p7.appendChild(i7), d7.push(i7);
            n5.setAttribute("gf" === t6.ty ? "fill" : "stroke", "url(" + h6() + "#" + o6 + ")"), "gs" === t6.ty && (n5.setAttribute("stroke-linecap", ii[t6.lc || 2]), n5.setAttribute("stroke-linejoin", si[t6.lj || 2]), 1 === t6.lj && n5.setAttribute("stroke-miterlimit", t6.ml)), this.of = p7, this.ms = r6, this.ost = d7, this.maskId = l7, e5.msElem = n5;
          }
        }, p6([Wt], di), p6([di, Wt], fi);
        var ui = function(t6, e5, i7, s7) {
          if (0 === e5) return "";
          var a6, r6 = t6.o, n5 = t6.i, o6 = t6.v, h7 = " M" + s7.applyToPointStringified(o6[0][0], o6[0][1]);
          for (a6 = 1; a6 < e5; a6 += 1) h7 += " C" + s7.applyToPointStringified(r6[a6 - 1][0], r6[a6 - 1][1]) + " " + s7.applyToPointStringified(n5[a6][0], n5[a6][1]) + " " + s7.applyToPointStringified(o6[a6][0], o6[a6][1]);
          return i7 && e5 && (h7 += " C" + s7.applyToPointStringified(r6[a6 - 1][0], r6[a6 - 1][1]) + " " + s7.applyToPointStringified(n5[0][0], n5[0][1]) + " " + s7.applyToPointStringified(o6[0][0], o6[0][1]), h7 += "z"), h7;
        }, gi = function() {
          var t6 = new Zt(), e5 = new Zt();
          function i7(t7) {
            switch (t7.ty) {
              case "fl":
                return n5;
              case "gf":
                return h7;
              case "gs":
                return o6;
              case "st":
                return l7;
              case "sh":
              case "el":
              case "rc":
              case "sr":
                return r6;
              case "tr":
                return s7;
              case "no":
                return a6;
              default:
                return null;
            }
          }
          function s7(t7, e6, i8) {
            (i8 || e6.transform.op._mdf) && e6.transform.container.setAttribute("opacity", e6.transform.op.v), (i8 || e6.transform.mProps._mdf) && e6.transform.container.setAttribute("transform", e6.transform.mProps.v.to2dCSS());
          }
          function a6() {
          }
          function r6(i8, s8, a7) {
            var r7, n6, o7, h8, l8, p7, d7, f6, m6, c6, u6 = s8.styles.length, g8 = s8.lvl;
            for (p7 = 0; p7 < u6; p7 += 1) {
              if (h8 = s8.sh._mdf || a7, s8.styles[p7].lvl < g8) {
                for (f6 = e5.reset(), m6 = g8 - s8.styles[p7].lvl, c6 = s8.transformers.length - 1; !h8 && m6 > 0; ) h8 = s8.transformers[c6].mProps._mdf || h8, m6 -= 1, c6 -= 1;
                if (h8) for (m6 = g8 - s8.styles[p7].lvl, c6 = s8.transformers.length - 1; m6 > 0; ) f6.multiply(s8.transformers[c6].mProps.v), m6 -= 1, c6 -= 1;
              } else f6 = t6;
              if (n6 = (d7 = s8.sh.paths)._length, h8) {
                for (o7 = "", r7 = 0; r7 < n6; r7 += 1) (l8 = d7.shapes[r7]) && l8._length && (o7 += ui(l8, l8._length, l8.c, f6));
                s8.caches[p7] = o7;
              } else o7 = s8.caches[p7];
              s8.styles[p7].d += true === i8.hd ? "" : o7, s8.styles[p7]._mdf = h8 || s8.styles[p7]._mdf;
            }
          }
          function n5(t7, e6, i8) {
            var s8 = e6.style;
            (e6.c._mdf || i8) && s8.pElem.setAttribute("fill", "rgb(" + k5(e6.c.v[0]) + "," + k5(e6.c.v[1]) + "," + k5(e6.c.v[2]) + ")"), (e6.o._mdf || i8) && s8.pElem.setAttribute("fill-opacity", e6.o.v);
          }
          function o6(t7, e6, i8) {
            h7(t7, e6, i8), l7(t7, e6, i8);
          }
          function h7(t7, e6, i8) {
            var s8, a7, r7, n6, o7, h8 = e6.gf, l8 = e6.g._hasOpacity, p7 = e6.s.v, d7 = e6.e.v;
            if (e6.o._mdf || i8) {
              var f6 = "gf" === t7.ty ? "fill-opacity" : "stroke-opacity";
              e6.style.pElem.setAttribute(f6, e6.o.v);
            }
            if (e6.s._mdf || i8) {
              var m6 = 1 === t7.t ? "x1" : "cx", c6 = "x1" === m6 ? "y1" : "cy";
              h8.setAttribute(m6, p7[0]), h8.setAttribute(c6, p7[1]), l8 && !e6.g._collapsable && (e6.of.setAttribute(m6, p7[0]), e6.of.setAttribute(c6, p7[1]));
            }
            if (e6.g._cmdf || i8) {
              s8 = e6.cst;
              var u6 = e6.g.c;
              for (r7 = s8.length, a7 = 0; a7 < r7; a7 += 1) (n6 = s8[a7]).setAttribute("offset", u6[4 * a7] + "%"), n6.setAttribute("stop-color", "rgb(" + u6[4 * a7 + 1] + "," + u6[4 * a7 + 2] + "," + u6[4 * a7 + 3] + ")");
            }
            if (l8 && (e6.g._omdf || i8)) {
              var g8 = e6.g.o;
              for (r7 = (s8 = e6.g._collapsable ? e6.cst : e6.ost).length, a7 = 0; a7 < r7; a7 += 1) n6 = s8[a7], e6.g._collapsable || n6.setAttribute("offset", g8[2 * a7] + "%"), n6.setAttribute("stop-opacity", g8[2 * a7 + 1]);
            }
            if (1 === t7.t) (e6.e._mdf || i8) && (h8.setAttribute("x2", d7[0]), h8.setAttribute("y2", d7[1]), l8 && !e6.g._collapsable && (e6.of.setAttribute("x2", d7[0]), e6.of.setAttribute("y2", d7[1])));
            else if ((e6.s._mdf || e6.e._mdf || i8) && (o7 = Math.sqrt(Math.pow(p7[0] - d7[0], 2) + Math.pow(p7[1] - d7[1], 2)), h8.setAttribute("r", o7), l8 && !e6.g._collapsable && e6.of.setAttribute("r", o7)), e6.s._mdf || e6.e._mdf || e6.h._mdf || e6.a._mdf || i8) {
              o7 || (o7 = Math.sqrt(Math.pow(p7[0] - d7[0], 2) + Math.pow(p7[1] - d7[1], 2)));
              var v6 = Math.atan2(d7[1] - p7[1], d7[0] - p7[0]), y7 = e6.h.v;
              y7 >= 1 ? y7 = 0.99 : y7 <= -1 && (y7 = -0.99);
              var b6 = o7 * y7, _7 = Math.cos(v6 + e6.a.v) * b6 + p7[0], k6 = Math.sin(v6 + e6.a.v) * b6 + p7[1];
              h8.setAttribute("fx", _7), h8.setAttribute("fy", k6), l8 && !e6.g._collapsable && (e6.of.setAttribute("fx", _7), e6.of.setAttribute("fy", k6));
            }
          }
          function l7(t7, e6, i8) {
            var s8 = e6.style, a7 = e6.d;
            a7 && (a7._mdf || i8) && a7.dashStr && (s8.pElem.setAttribute("stroke-dasharray", a7.dashStr), s8.pElem.setAttribute("stroke-dashoffset", a7.dashoffset[0])), e6.c && (e6.c._mdf || i8) && s8.pElem.setAttribute("stroke", "rgb(" + k5(e6.c.v[0]) + "," + k5(e6.c.v[1]) + "," + k5(e6.c.v[2]) + ")"), (e6.o._mdf || i8) && s8.pElem.setAttribute("stroke-opacity", e6.o.v), (e6.w._mdf || i8) && (s8.pElem.setAttribute("stroke-width", e6.w.v), s8.msElem && s8.msElem.setAttribute("stroke-width", e6.w.v));
          }
          return { createRenderFunction: i7 };
        }();
        function vi(t6, e5, i7) {
          this.shapes = [], this.shapesData = t6.shapes, this.stylesList = [], this.shapeModifiers = [], this.itemsData = [], this.processedElements = [], this.animatedContents = [], this.initElement(t6, e5, i7), this.prevViewData = [];
        }
        function yi(t6, e5, i7, s7, a6, r6) {
          this.o = t6, this.sw = e5, this.sc = i7, this.fc = s7, this.m = a6, this.p = r6, this._mdf = { o: true, sw: !!e5, sc: !!i7, fc: !!s7, m: true, p: true };
        }
        function bi(t6, e5) {
          this._frameId = a5, this.pv = "", this.v = "", this.kf = false, this._isFirstFrame = true, this._mdf = false, e5.d && e5.d.sid && (e5.d = t6.globalData.slotManager.getProp(e5.d)), this.data = e5, this.elem = t6, this.comp = this.elem.comp, this.keysIndex = 0, this.canResize = false, this.minimumFontSize = 1, this.effectsSequence = [], this.currentData = { ascent: 0, boxWidth: this.defaultBoxWidth, f: "", fStyle: "", fWeight: "", fc: "", j: "", justifyOffset: "", l: [], lh: 0, lineWidths: [], ls: "", of: "", s: "", sc: "", sw: 0, t: 0, tr: 0, sz: 0, ps: null, fillColorAnim: false, strokeColorAnim: false, strokeWidthAnim: false, yOffset: 0, finalSize: 0, finalText: [], finalLineHeight: 0, __complete: false }, this.copyData(this.currentData, this.data.d.k[0].s), this.searchProperty() || this.completeTextData(this.currentData);
        }
        p6([Me, ze, Ue, Qe, Ye, Ie, Ze], vi), vi.prototype.initSecondaryElement = function() {
        }, vi.prototype.identityMatrix = new Zt(), vi.prototype.buildExpressionInterface = function() {
        }, vi.prototype.createContent = function() {
          this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true), this.filterUniqueShapes();
        }, vi.prototype.filterUniqueShapes = function() {
          var t6, e5, i7, s7, a6 = this.shapes.length, r6 = this.stylesList.length, n5 = [], o6 = false;
          for (i7 = 0; i7 < r6; i7 += 1) {
            for (s7 = this.stylesList[i7], o6 = false, n5.length = 0, t6 = 0; t6 < a6; t6 += 1) -1 !== (e5 = this.shapes[t6]).styles.indexOf(s7) && (n5.push(e5), o6 = e5._isAnimated || o6);
            n5.length > 1 && o6 && this.setShapesAsAnimated(n5);
          }
        }, vi.prototype.setShapesAsAnimated = function(t6) {
          var e5, i7 = t6.length;
          for (e5 = 0; e5 < i7; e5 += 1) t6[e5].setAsAnimated();
        }, vi.prototype.createStyleElement = function(t6, e5) {
          var i7, s7 = new ri(t6, e5), a6 = s7.pElem;
          return "st" === t6.ty ? i7 = new oi(this, t6, s7) : "fl" === t6.ty ? i7 = new hi(this, t6, s7) : "gf" === t6.ty || "gs" === t6.ty ? (i7 = new ("gf" === t6.ty ? di : fi)(this, t6, s7), this.globalData.defs.appendChild(i7.gf), i7.maskId && (this.globalData.defs.appendChild(i7.ms), this.globalData.defs.appendChild(i7.of), a6.setAttribute("mask", "url(" + h6() + "#" + i7.maskId + ")"))) : "no" === t6.ty && (i7 = new li(this, t6, s7)), "st" !== t6.ty && "gs" !== t6.ty || (a6.setAttribute("stroke-linecap", ii[t6.lc || 2]), a6.setAttribute("stroke-linejoin", si[t6.lj || 2]), a6.setAttribute("fill-opacity", "0"), 1 === t6.lj && a6.setAttribute("stroke-miterlimit", t6.ml)), 2 === t6.r && a6.setAttribute("fill-rule", "evenodd"), t6.ln && a6.setAttribute("id", t6.ln), t6.cl && a6.setAttribute("class", t6.cl), t6.bm && (a6.style["mix-blend-mode"] = ke(t6.bm)), this.stylesList.push(s7), this.addToAnimatedContents(t6, i7), i7;
        }, vi.prototype.createGroupElement = function(t6) {
          var e5 = new mi();
          return t6.ln && e5.gr.setAttribute("id", t6.ln), t6.cl && e5.gr.setAttribute("class", t6.cl), t6.bm && (e5.gr.style["mix-blend-mode"] = ke(t6.bm)), e5;
        }, vi.prototype.createTransformElement = function(t6, e5) {
          var i7 = Ve.getTransformProperty(this, t6, this), s7 = new ci(i7, i7.o, e5);
          return this.addToAnimatedContents(t6, s7), s7;
        }, vi.prototype.createShapeElement = function(t6, e5, i7) {
          var s7 = 4;
          "rc" === t6.ty ? s7 = 5 : "el" === t6.ty ? s7 = 6 : "sr" === t6.ty && (s7 = 7);
          var a6 = new ai(e5, i7, Yt.getShapeProp(this, t6, s7, this));
          return this.shapes.push(a6), this.addShapeToModifiers(a6), this.addToAnimatedContents(t6, a6), a6;
        }, vi.prototype.addToAnimatedContents = function(t6, e5) {
          for (var i7 = 0, s7 = this.animatedContents.length; i7 < s7; ) {
            if (this.animatedContents[i7].element === e5) return;
            i7 += 1;
          }
          this.animatedContents.push({ fn: gi.createRenderFunction(t6), element: e5, data: t6 });
        }, vi.prototype.setElementStyles = function(t6) {
          var e5, i7 = t6.styles, s7 = this.stylesList.length;
          for (e5 = 0; e5 < s7; e5 += 1) -1 !== i7.indexOf(this.stylesList[e5]) || this.stylesList[e5].closed || i7.push(this.stylesList[e5]);
        }, vi.prototype.reloadShapes = function() {
          var t6;
          this._isFirstFrame = true;
          var e5 = this.itemsData.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.prevViewData[t6] = this.itemsData[t6];
          for (this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true), this.filterUniqueShapes(), e5 = this.dynamicProperties.length, t6 = 0; t6 < e5; t6 += 1) this.dynamicProperties[t6].getValue();
          this.renderModifiers();
        }, vi.prototype.searchShapes = function(t6, e5, i7, s7, a6, r6, n5) {
          var o6, h7, l7, p7, d7, f6, m6 = [].concat(r6), c6 = t6.length - 1, u6 = [], g8 = [];
          for (o6 = c6; o6 >= 0; o6 -= 1) {
            if ((f6 = this.searchProcessedElement(t6[o6])) ? e5[o6] = i7[f6 - 1] : t6[o6]._render = n5, "fl" === t6[o6].ty || "st" === t6[o6].ty || "gf" === t6[o6].ty || "gs" === t6[o6].ty || "no" === t6[o6].ty) f6 ? e5[o6].style.closed = t6[o6].hd : e5[o6] = this.createStyleElement(t6[o6], a6), t6[o6]._render && e5[o6].style.pElem.parentNode !== s7 && s7.appendChild(e5[o6].style.pElem), u6.push(e5[o6].style);
            else if ("gr" === t6[o6].ty) {
              if (f6) for (l7 = e5[o6].it.length, h7 = 0; h7 < l7; h7 += 1) e5[o6].prevViewData[h7] = e5[o6].it[h7];
              else e5[o6] = this.createGroupElement(t6[o6]);
              this.searchShapes(t6[o6].it, e5[o6].it, e5[o6].prevViewData, e5[o6].gr, a6 + 1, m6, n5), t6[o6]._render && e5[o6].gr.parentNode !== s7 && s7.appendChild(e5[o6].gr);
            } else "tr" === t6[o6].ty ? (f6 || (e5[o6] = this.createTransformElement(t6[o6], s7)), p7 = e5[o6].transform, m6.push(p7)) : "sh" === t6[o6].ty || "rc" === t6[o6].ty || "el" === t6[o6].ty || "sr" === t6[o6].ty ? (f6 || (e5[o6] = this.createShapeElement(t6[o6], m6, a6)), this.setElementStyles(e5[o6])) : "tm" === t6[o6].ty || "rd" === t6[o6].ty || "ms" === t6[o6].ty || "pb" === t6[o6].ty || "zz" === t6[o6].ty || "op" === t6[o6].ty ? (f6 ? (d7 = e5[o6]).closed = false : ((d7 = ti.getModifier(t6[o6].ty)).init(this, t6[o6]), e5[o6] = d7, this.shapeModifiers.push(d7)), g8.push(d7)) : "rp" === t6[o6].ty && (f6 ? (d7 = e5[o6]).closed = true : (d7 = ti.getModifier(t6[o6].ty), e5[o6] = d7, d7.init(this, t6, o6, e5), this.shapeModifiers.push(d7), n5 = false), g8.push(d7));
            this.addProcessedElement(t6[o6], o6 + 1);
          }
          for (c6 = u6.length, o6 = 0; o6 < c6; o6 += 1) u6[o6].closed = true;
          for (c6 = g8.length, o6 = 0; o6 < c6; o6 += 1) g8[o6].closed = true;
        }, vi.prototype.renderInnerContent = function() {
          var t6;
          this.renderModifiers();
          var e5 = this.stylesList.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.stylesList[t6].reset();
          for (this.renderShape(), t6 = 0; t6 < e5; t6 += 1) (this.stylesList[t6]._mdf || this._isFirstFrame) && (this.stylesList[t6].msElem && (this.stylesList[t6].msElem.setAttribute("d", this.stylesList[t6].d), this.stylesList[t6].d = "M0 0" + this.stylesList[t6].d), this.stylesList[t6].pElem.setAttribute("d", this.stylesList[t6].d || "M0 0"));
        }, vi.prototype.renderShape = function() {
          var t6, e5, i7 = this.animatedContents.length;
          for (t6 = 0; t6 < i7; t6 += 1) e5 = this.animatedContents[t6], (this._isFirstFrame || e5.element._isAnimated) && true !== e5.data && e5.fn(e5.data, e5.element, this._isFirstFrame);
        }, vi.prototype.destroy = function() {
          this.destroyBaseElement(), this.shapesData = null, this.itemsData = null;
        }, yi.prototype.update = function(t6, e5, i7, s7, a6, r6) {
          this._mdf.o = false, this._mdf.sw = false, this._mdf.sc = false, this._mdf.fc = false, this._mdf.m = false, this._mdf.p = false;
          var n5 = false;
          return this.o !== t6 && (this.o = t6, this._mdf.o = true, n5 = true), this.sw !== e5 && (this.sw = e5, this._mdf.sw = true, n5 = true), this.sc !== i7 && (this.sc = i7, this._mdf.sc = true, n5 = true), this.fc !== s7 && (this.fc = s7, this._mdf.fc = true, n5 = true), this.m !== a6 && (this.m = a6, this._mdf.m = true, n5 = true), !r6.length || this.p[0] === r6[0] && this.p[1] === r6[1] && this.p[4] === r6[4] && this.p[5] === r6[5] && this.p[12] === r6[12] && this.p[13] === r6[13] || (this.p = r6, this._mdf.p = true, n5 = true), n5;
        }, bi.prototype.defaultBoxWidth = [0, 0], bi.prototype.copyData = function(t6, e5) {
          for (var i7 in e5) Object.prototype.hasOwnProperty.call(e5, i7) && (t6[i7] = e5[i7]);
          return t6;
        }, bi.prototype.setCurrentData = function(t6) {
          t6.__complete || this.completeTextData(t6), this.currentData = t6, this.currentData.boxWidth = this.currentData.boxWidth || this.defaultBoxWidth, this._mdf = true;
        }, bi.prototype.searchProperty = function() {
          return this.searchKeyframes();
        }, bi.prototype.searchKeyframes = function() {
          return this.kf = this.data.d.k.length > 1, this.kf && this.addEffect(this.getKeyframeValue.bind(this)), this.kf;
        }, bi.prototype.addEffect = function(t6) {
          this.effectsSequence.push(t6), this.elem.addDynamicProperty(this);
        }, bi.prototype.getValue = function(t6) {
          if (this.elem.globalData.frameId !== this.frameId && this.effectsSequence.length || t6) {
            this.currentData.t = this.data.d.k[this.keysIndex].s.t;
            var e5 = this.currentData, i7 = this.keysIndex;
            if (this.lock) this.setCurrentData(this.currentData);
            else {
              var s7;
              this.lock = true, this._mdf = false;
              var a6 = this.effectsSequence.length, r6 = t6 || this.data.d.k[this.keysIndex].s;
              for (s7 = 0; s7 < a6; s7 += 1) r6 = i7 !== this.keysIndex ? this.effectsSequence[s7](r6, r6.t) : this.effectsSequence[s7](this.currentData, r6.t);
              e5 !== r6 && this.setCurrentData(r6), this.v = this.currentData, this.pv = this.v, this.lock = false, this.frameId = this.elem.globalData.frameId;
            }
          }
        }, bi.prototype.getKeyframeValue = function() {
          for (var t6 = this.data.d.k, e5 = this.elem.comp.renderedFrame, i7 = 0, s7 = t6.length; i7 <= s7 - 1 && !(i7 === s7 - 1 || t6[i7 + 1].t > e5); ) i7 += 1;
          return this.keysIndex !== i7 && (this.keysIndex = i7), this.data.d.k[this.keysIndex].s;
        }, bi.prototype.buildFinalText = function(t6) {
          for (var e5, i7, s7 = [], a6 = 0, r6 = t6.length, n5 = false, o6 = false, h7 = ""; a6 < r6; ) n5 = o6, o6 = false, e5 = t6.charCodeAt(a6), h7 = t6.charAt(a6), ge.isCombinedCharacter(e5) ? n5 = true : e5 >= 55296 && e5 <= 56319 ? ge.isRegionalFlag(t6, a6) ? h7 = t6.substr(a6, 14) : (i7 = t6.charCodeAt(a6 + 1)) >= 56320 && i7 <= 57343 && (ge.isModifier(e5, i7) ? (h7 = t6.substr(a6, 2), n5 = true) : h7 = ge.isFlagEmoji(t6.substr(a6, 4)) ? t6.substr(a6, 4) : t6.substr(a6, 2)) : e5 > 56319 ? (i7 = t6.charCodeAt(a6 + 1), ge.isVariationSelector(e5) && (n5 = true)) : ge.isZeroWidthJoiner(e5) && (n5 = true, o6 = true), n5 ? (s7[s7.length - 1] += h7, n5 = false) : s7.push(h7), a6 += h7.length;
          return s7;
        }, bi.prototype.completeTextData = function(t6) {
          t6.__complete = true;
          var e5, i7, s7, a6, r6, n5, o6, h7 = this.elem.globalData.fontManager, l7 = this.data, p7 = [], d7 = 0, f6 = l7.m.g, m6 = 0, c6 = 0, u6 = 0, g8 = [], v6 = 0, y7 = 0, b6 = h7.getFontByName(t6.f), _7 = 0, k6 = ue(b6);
          t6.fWeight = k6.weight, t6.fStyle = k6.style, t6.finalSize = t6.s, t6.finalText = this.buildFinalText(t6.t), i7 = t6.finalText.length, t6.finalLineHeight = t6.lh;
          var w7, S4 = t6.tr / 1e3 * t6.finalSize;
          if (t6.sz) for (var A7, D5, C5 = true, P6 = t6.sz[0], T6 = t6.sz[1]; C5; ) {
            A7 = 0, v6 = 0, i7 = (D5 = this.buildFinalText(t6.t)).length, S4 = t6.tr / 1e3 * t6.finalSize;
            var E6 = -1;
            for (e5 = 0; e5 < i7; e5 += 1) w7 = D5[e5].charCodeAt(0), s7 = false, " " === D5[e5] ? E6 = e5 : 13 !== w7 && 3 !== w7 || (v6 = 0, s7 = true, A7 += t6.finalLineHeight || 1.2 * t6.finalSize), h7.chars ? (o6 = h7.getCharData(D5[e5], b6.fStyle, b6.fFamily), _7 = s7 ? 0 : o6.w * t6.finalSize / 100) : _7 = h7.measureText(D5[e5], t6.f, t6.finalSize), v6 + _7 > P6 && " " !== D5[e5] ? (-1 === E6 ? i7 += 1 : e5 = E6, A7 += t6.finalLineHeight || 1.2 * t6.finalSize, D5.splice(e5, E6 === e5 ? 1 : 0, "\r"), E6 = -1, v6 = 0) : (v6 += _7, v6 += S4);
            A7 += b6.ascent * t6.finalSize / 100, this.canResize && t6.finalSize > this.minimumFontSize && T6 < A7 ? (t6.finalSize -= 1, t6.finalLineHeight = t6.finalSize * t6.lh / t6.s) : (t6.finalText = D5, i7 = t6.finalText.length, C5 = false);
          }
          v6 = -S4, _7 = 0;
          var F6, x6 = 0;
          for (e5 = 0; e5 < i7; e5 += 1) if (s7 = false, 13 === (w7 = (F6 = t6.finalText[e5]).charCodeAt(0)) || 3 === w7 ? (x6 = 0, g8.push(v6), y7 = v6 > y7 ? v6 : y7, v6 = -2 * S4, a6 = "", s7 = true, u6 += 1) : a6 = F6, h7.chars ? (o6 = h7.getCharData(F6, b6.fStyle, h7.getFontByName(t6.f).fFamily), _7 = s7 ? 0 : o6.w * t6.finalSize / 100) : _7 = h7.measureText(a6, t6.f, t6.finalSize), " " === F6 ? x6 += _7 + S4 : (v6 += _7 + S4 + x6, x6 = 0), p7.push({ l: _7, an: _7, add: m6, n: s7, anIndexes: [], val: a6, line: u6, animatorJustifyOffset: 0 }), 2 == f6) {
            if (m6 += _7, "" === a6 || " " === a6 || e5 === i7 - 1) {
              for ("" !== a6 && " " !== a6 || (m6 -= _7); c6 <= e5; ) p7[c6].an = m6, p7[c6].ind = d7, p7[c6].extra = _7, c6 += 1;
              d7 += 1, m6 = 0;
            }
          } else if (3 == f6) {
            if (m6 += _7, "" === a6 || e5 === i7 - 1) {
              for ("" === a6 && (m6 -= _7); c6 <= e5; ) p7[c6].an = m6, p7[c6].ind = d7, p7[c6].extra = _7, c6 += 1;
              m6 = 0, d7 += 1;
            }
          } else p7[d7].ind = d7, p7[d7].extra = 0, d7 += 1;
          if (t6.l = p7, y7 = v6 > y7 ? v6 : y7, g8.push(v6), t6.sz) t6.boxWidth = t6.sz[0], t6.justifyOffset = 0;
          else switch (t6.boxWidth = y7, t6.j) {
            case 1:
              t6.justifyOffset = -t6.boxWidth;
              break;
            case 2:
              t6.justifyOffset = -t6.boxWidth / 2;
              break;
            default:
              t6.justifyOffset = 0;
          }
          t6.lineWidths = g8;
          var M5, I4, L4, O4, R3 = l7.a;
          n5 = R3.length;
          var V5 = [];
          for (r6 = 0; r6 < n5; r6 += 1) {
            for ((M5 = R3[r6]).a.sc && (t6.strokeColorAnim = true), M5.a.sw && (t6.strokeWidthAnim = true), (M5.a.fc || M5.a.fh || M5.a.fs || M5.a.fb) && (t6.fillColorAnim = true), O4 = 0, L4 = M5.s.b, e5 = 0; e5 < i7; e5 += 1) (I4 = p7[e5]).anIndexes[r6] = O4, (1 == L4 && "" !== I4.val || 2 == L4 && "" !== I4.val && " " !== I4.val || 3 == L4 && (I4.n || " " == I4.val || e5 == i7 - 1) || 4 == L4 && (I4.n || e5 == i7 - 1)) && (1 === M5.s.rn && V5.push(O4), O4 += 1);
            l7.a[r6].s.totalChars = O4;
            var N5, z6 = -1;
            if (1 === M5.s.rn) for (e5 = 0; e5 < i7; e5 += 1) z6 != (I4 = p7[e5]).anIndexes[r6] && (z6 = I4.anIndexes[r6], N5 = V5.splice(Math.floor(Math.random() * V5.length), 1)[0]), I4.anIndexes[r6] = N5;
          }
          t6.yOffset = t6.finalLineHeight || 1.2 * t6.finalSize, t6.ls = t6.ls || 0, t6.ascent = b6.ascent * t6.finalSize / 100;
        }, bi.prototype.updateDocumentData = function(t6, e5) {
          e5 = void 0 === e5 ? this.keysIndex : e5;
          var i7 = this.copyData({}, this.data.d.k[e5].s);
          i7 = this.copyData(i7, t6), this.data.d.k[e5].s = i7, this.recalculate(e5), this.setCurrentData(i7), this.elem.addDynamicProperty(this);
        }, bi.prototype.recalculate = function(t6) {
          var e5 = this.data.d.k[t6].s;
          e5.__complete = false, this.keysIndex = 0, this._isFirstFrame = true, this.getValue(e5);
        }, bi.prototype.canResizeFont = function(t6) {
          this.canResize = t6, this.recalculate(this.keysIndex), this.elem.addDynamicProperty(this);
        }, bi.prototype.setMinimumFontSize = function(t6) {
          this.minimumFontSize = Math.floor(t6) || 1, this.recalculate(this.keysIndex), this.elem.addDynamicProperty(this);
        };
        var _i = function() {
          var t6 = Math.max, e5 = Math.min, i7 = Math.floor;
          function s7(t7, e6) {
            this._currentTextLength = -1, this.k = false, this.data = e6, this.elem = t7, this.comp = t7.comp, this.finalS = 0, this.finalE = 0, this.initDynamicPropertyContainer(t7), this.s = qt.getProp(t7, e6.s || { k: 0 }, 0, 0, this), this.e = "e" in e6 ? qt.getProp(t7, e6.e, 0, 0, this) : { v: 100 }, this.o = qt.getProp(t7, e6.o || { k: 0 }, 0, 0, this), this.xe = qt.getProp(t7, e6.xe || { k: 0 }, 0, 0, this), this.ne = qt.getProp(t7, e6.ne || { k: 0 }, 0, 0, this), this.sm = qt.getProp(t7, e6.sm || { k: 100 }, 0, 0, this), this.a = qt.getProp(t7, e6.a, 0, 0.01, this), this.dynamicProperties.length || this.getValue();
          }
          function a6(t7, e6, i8) {
            return new s7(t7, e6);
          }
          return s7.prototype = { getMult: function(s8) {
            this._currentTextLength !== this.elem.textProperty.currentData.l.length && this.getValue();
            var a7 = 0, r6 = 0, n5 = 1, o6 = 1;
            this.ne.v > 0 ? a7 = this.ne.v / 100 : r6 = -this.ne.v / 100, this.xe.v > 0 ? n5 = 1 - this.xe.v / 100 : o6 = 1 + this.xe.v / 100;
            var h7 = ht.getBezierEasing(a7, r6, n5, o6).get, l7 = 0, p7 = this.finalS, d7 = this.finalE, f6 = this.data.sh;
            if (2 === f6) l7 = h7(l7 = d7 === p7 ? s8 >= d7 ? 1 : 0 : t6(0, e5(0.5 / (d7 - p7) + (s8 - p7) / (d7 - p7), 1)));
            else if (3 === f6) l7 = h7(l7 = d7 === p7 ? s8 >= d7 ? 0 : 1 : 1 - t6(0, e5(0.5 / (d7 - p7) + (s8 - p7) / (d7 - p7), 1)));
            else if (4 === f6) d7 === p7 ? l7 = 0 : (l7 = t6(0, e5(0.5 / (d7 - p7) + (s8 - p7) / (d7 - p7), 1))) < 0.5 ? l7 *= 2 : l7 = 1 - 2 * (l7 - 0.5), l7 = h7(l7);
            else if (5 === f6) {
              if (d7 === p7) l7 = 0;
              else {
                var m6 = d7 - p7, c6 = -m6 / 2 + (s8 = e5(t6(0, s8 + 0.5 - p7), d7 - p7)), u6 = m6 / 2;
                l7 = Math.sqrt(1 - c6 * c6 / (u6 * u6));
              }
              l7 = h7(l7);
            } else 6 === f6 ? (d7 === p7 ? l7 = 0 : (s8 = e5(t6(0, s8 + 0.5 - p7), d7 - p7), l7 = (1 + Math.cos(Math.PI + 2 * Math.PI * s8 / (d7 - p7))) / 2), l7 = h7(l7)) : (s8 >= i7(p7) && (l7 = t6(0, e5(s8 - p7 < 0 ? e5(d7, 1) - (p7 - s8) : d7 - s8, 1))), l7 = h7(l7));
            if (100 !== this.sm.v) {
              var g8 = 0.01 * this.sm.v;
              0 === g8 && (g8 = 1e-8);
              var v6 = 0.5 - 0.5 * g8;
              l7 < v6 ? l7 = 0 : (l7 = (l7 - v6) / g8) > 1 && (l7 = 1);
            }
            return l7 * this.a.v;
          }, getValue: function(t7) {
            this.iterateDynamicProperties(), this._mdf = t7 || this._mdf, this._currentTextLength = this.elem.textProperty.currentData.l.length || 0, t7 && 2 === this.data.r && (this.e.v = this._currentTextLength);
            var e6 = 2 === this.data.r ? 1 : 100 / this.data.totalChars, i8 = this.o.v / e6, s8 = this.s.v / e6 + i8, a7 = this.e.v / e6 + i8;
            if (s8 > a7) {
              var r6 = s8;
              s8 = a7, a7 = r6;
            }
            this.finalS = s8, this.finalE = a7;
          } }, p6([Wt], s7), { getTextSelectorProp: a6 };
        }();
        function ki(t6, e5, i7) {
          var s7 = { propType: false }, a6 = qt.getProp, r6 = e5.a;
          this.a = { r: r6.r ? a6(t6, r6.r, 0, A6, i7) : s7, rx: r6.rx ? a6(t6, r6.rx, 0, A6, i7) : s7, ry: r6.ry ? a6(t6, r6.ry, 0, A6, i7) : s7, sk: r6.sk ? a6(t6, r6.sk, 0, A6, i7) : s7, sa: r6.sa ? a6(t6, r6.sa, 0, A6, i7) : s7, s: r6.s ? a6(t6, r6.s, 1, 0.01, i7) : s7, a: r6.a ? a6(t6, r6.a, 1, 0, i7) : s7, o: r6.o ? a6(t6, r6.o, 0, 0.01, i7) : s7, p: r6.p ? a6(t6, r6.p, 1, 0, i7) : s7, sw: r6.sw ? a6(t6, r6.sw, 0, 0, i7) : s7, sc: r6.sc ? a6(t6, r6.sc, 1, 0, i7) : s7, fc: r6.fc ? a6(t6, r6.fc, 1, 0, i7) : s7, fh: r6.fh ? a6(t6, r6.fh, 0, 0, i7) : s7, fs: r6.fs ? a6(t6, r6.fs, 0, 0.01, i7) : s7, fb: r6.fb ? a6(t6, r6.fb, 0, 0.01, i7) : s7, t: r6.t ? a6(t6, r6.t, 0, 0, i7) : s7 }, this.s = _i.getTextSelectorProp(t6, e5.s, i7), this.s.t = e5.s.t;
        }
        function wi(t6, e5, i7) {
          this._isFirstFrame = true, this._hasMaskedPath = false, this._frameId = -1, this._textData = t6, this._renderType = e5, this._elem = i7, this._animatorsData = c5(this._textData.a.length), this._pathData = {}, this._moreOptions = { alignment: {} }, this.renderedLetters = [], this.lettersChangedFlag = false, this.initDynamicPropertyContainer(i7);
        }
        function Si() {
        }
        wi.prototype.searchProperties = function() {
          var t6, e5, i7 = this._textData.a.length, s7 = qt.getProp;
          for (t6 = 0; t6 < i7; t6 += 1) e5 = this._textData.a[t6], this._animatorsData[t6] = new ki(this._elem, e5, this);
          this._textData.p && "m" in this._textData.p ? (this._pathData = { a: s7(this._elem, this._textData.p.a, 0, 0, this), f: s7(this._elem, this._textData.p.f, 0, 0, this), l: s7(this._elem, this._textData.p.l, 0, 0, this), r: s7(this._elem, this._textData.p.r, 0, 0, this), p: s7(this._elem, this._textData.p.p, 0, 0, this), m: this._elem.maskManager.getMaskProperty(this._textData.p.m) }, this._hasMaskedPath = true) : this._hasMaskedPath = false, this._moreOptions.alignment = s7(this._elem, this._textData.m.a, 1, 0, this);
        }, wi.prototype.getMeasures = function(t6, e5) {
          if (this.lettersChangedFlag = e5, this._mdf || this._isFirstFrame || e5 || this._hasMaskedPath && this._pathData.m._mdf) {
            this._isFirstFrame = false;
            var i7, s7, a6, r6, n5, o6, h7, l7, p7, d7, f6, m6, c6, u6, g8, v6, y7, b6, _7, k6 = this._moreOptions.alignment.v, w7 = this._animatorsData, S4 = this._textData, A7 = this.mHelper, D5 = this._renderType, C5 = this.renderedLetters.length, P6 = t6.l;
            if (this._hasMaskedPath) {
              if (_7 = this._pathData.m, !this._pathData.n || this._pathData._mdf) {
                var T6, E6 = _7.v;
                for (this._pathData.r.v && (E6 = E6.reverse()), n5 = { tLength: 0, segments: [] }, r6 = E6._length - 1, v6 = 0, a6 = 0; a6 < r6; a6 += 1) T6 = ct.buildBezierData(E6.v[a6], E6.v[a6 + 1], [E6.o[a6][0] - E6.v[a6][0], E6.o[a6][1] - E6.v[a6][1]], [E6.i[a6 + 1][0] - E6.v[a6 + 1][0], E6.i[a6 + 1][1] - E6.v[a6 + 1][1]]), n5.tLength += T6.segmentLength, n5.segments.push(T6), v6 += T6.segmentLength;
                a6 = r6, _7.v.c && (T6 = ct.buildBezierData(E6.v[a6], E6.v[0], [E6.o[a6][0] - E6.v[a6][0], E6.o[a6][1] - E6.v[a6][1]], [E6.i[0][0] - E6.v[0][0], E6.i[0][1] - E6.v[0][1]]), n5.tLength += T6.segmentLength, n5.segments.push(T6), v6 += T6.segmentLength), this._pathData.pi = n5;
              }
              if (n5 = this._pathData.pi, o6 = this._pathData.f.v, f6 = 0, d7 = 1, l7 = 0, p7 = true, u6 = n5.segments, o6 < 0 && _7.v.c) for (n5.tLength < Math.abs(o6) && (o6 = -Math.abs(o6) % n5.tLength), d7 = (c6 = u6[f6 = u6.length - 1].points).length - 1; o6 < 0; ) o6 += c6[d7].partialLength, (d7 -= 1) < 0 && (d7 = (c6 = u6[f6 -= 1].points).length - 1);
              m6 = (c6 = u6[f6].points)[d7 - 1], g8 = (h7 = c6[d7]).partialLength;
            }
            r6 = P6.length, i7 = 0, s7 = 0;
            var F6, x6, M5, I4, L4, O4 = 1.2 * t6.finalSize * 0.714, R3 = true;
            M5 = w7.length;
            var j6, B5, q6, W3, $3, H4, G4, X3, U3, Y2, Z2, J4, K3 = -1, Q3 = o6, tt2 = f6, et2 = d7, it2 = -1, st2 = "", at2 = this.defaultPropsArray;
            if (2 === t6.j || 1 === t6.j) {
              var rt2 = 0, nt2 = 0, ot2 = 2 === t6.j ? -0.5 : -1, ht2 = 0, lt2 = true;
              for (a6 = 0; a6 < r6; a6 += 1) if (P6[a6].n) {
                for (rt2 && (rt2 += nt2); ht2 < a6; ) P6[ht2].animatorJustifyOffset = rt2, ht2 += 1;
                rt2 = 0, lt2 = true;
              } else {
                for (x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).t.propType && (lt2 && 2 === t6.j && (nt2 += F6.t.v * ot2), (L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars)).length ? rt2 += F6.t.v * L4[0] * ot2 : rt2 += F6.t.v * L4 * ot2);
                lt2 = false;
              }
              for (rt2 && (rt2 += nt2); ht2 < a6; ) P6[ht2].animatorJustifyOffset = rt2, ht2 += 1;
            }
            for (a6 = 0; a6 < r6; a6 += 1) {
              if (A7.reset(), W3 = 1, P6[a6].n) i7 = 0, s7 += t6.yOffset, s7 += R3 ? 1 : 0, o6 = Q3, R3 = false, this._hasMaskedPath && (d7 = et2, m6 = (c6 = u6[f6 = tt2].points)[d7 - 1], g8 = (h7 = c6[d7]).partialLength, l7 = 0), st2 = "", Z2 = "", U3 = "", J4 = "", at2 = this.defaultPropsArray;
              else {
                if (this._hasMaskedPath) {
                  if (it2 !== P6[a6].line) {
                    switch (t6.j) {
                      case 1:
                        o6 += v6 - t6.lineWidths[P6[a6].line];
                        break;
                      case 2:
                        o6 += (v6 - t6.lineWidths[P6[a6].line]) / 2;
                    }
                    it2 = P6[a6].line;
                  }
                  K3 !== P6[a6].ind && (P6[K3] && (o6 += P6[K3].extra), o6 += P6[a6].an / 2, K3 = P6[a6].ind), o6 += k6[0] * P6[a6].an * 5e-3;
                  var pt2 = 0;
                  for (x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).p.propType && ((L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars)).length ? pt2 += F6.p.v[0] * L4[0] : pt2 += F6.p.v[0] * L4), F6.a.propType && ((L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars)).length ? pt2 += F6.a.v[0] * L4[0] : pt2 += F6.a.v[0] * L4);
                  for (p7 = true, this._pathData.a.v && (o6 = 0.5 * P6[0].an + (v6 - this._pathData.f.v - 0.5 * P6[0].an - 0.5 * P6[P6.length - 1].an) * K3 / (r6 - 1), o6 += this._pathData.f.v); p7; ) l7 + g8 >= o6 + pt2 || !c6 ? (y7 = (o6 + pt2 - l7) / h7.partialLength, B5 = m6.point[0] + (h7.point[0] - m6.point[0]) * y7, q6 = m6.point[1] + (h7.point[1] - m6.point[1]) * y7, A7.translate(-k6[0] * P6[a6].an * 5e-3, -k6[1] * O4 * 0.01), p7 = false) : c6 && (l7 += h7.partialLength, (d7 += 1) >= c6.length && (d7 = 0, u6[f6 += 1] ? c6 = u6[f6].points : _7.v.c ? (d7 = 0, c6 = u6[f6 = 0].points) : (l7 -= h7.partialLength, c6 = null)), c6 && (m6 = h7, g8 = (h7 = c6[d7]).partialLength));
                  j6 = P6[a6].an / 2 - P6[a6].add, A7.translate(-j6, 0, 0);
                } else j6 = P6[a6].an / 2 - P6[a6].add, A7.translate(-j6, 0, 0), A7.translate(-k6[0] * P6[a6].an * 5e-3, -k6[1] * O4 * 0.01, 0);
                for (x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).t.propType && (L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars), 0 === i7 && 0 === t6.j || (this._hasMaskedPath ? L4.length ? o6 += F6.t.v * L4[0] : o6 += F6.t.v * L4 : L4.length ? i7 += F6.t.v * L4[0] : i7 += F6.t.v * L4));
                for (t6.strokeWidthAnim && (H4 = t6.sw || 0), t6.strokeColorAnim && ($3 = t6.sc ? [t6.sc[0], t6.sc[1], t6.sc[2]] : [0, 0, 0]), t6.fillColorAnim && t6.fc && (G4 = [t6.fc[0], t6.fc[1], t6.fc[2]]), x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).a.propType && ((L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars)).length ? A7.translate(-F6.a.v[0] * L4[0], -F6.a.v[1] * L4[1], F6.a.v[2] * L4[2]) : A7.translate(-F6.a.v[0] * L4, -F6.a.v[1] * L4, F6.a.v[2] * L4));
                for (x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).s.propType && ((L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars)).length ? A7.scale(1 + (F6.s.v[0] - 1) * L4[0], 1 + (F6.s.v[1] - 1) * L4[1], 1) : A7.scale(1 + (F6.s.v[0] - 1) * L4, 1 + (F6.s.v[1] - 1) * L4, 1));
                for (x6 = 0; x6 < M5; x6 += 1) {
                  if (F6 = w7[x6].a, L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars), F6.sk.propType && (L4.length ? A7.skewFromAxis(-F6.sk.v * L4[0], F6.sa.v * L4[1]) : A7.skewFromAxis(-F6.sk.v * L4, F6.sa.v * L4)), F6.r.propType && (L4.length ? A7.rotateZ(-F6.r.v * L4[2]) : A7.rotateZ(-F6.r.v * L4)), F6.ry.propType && (L4.length ? A7.rotateY(F6.ry.v * L4[1]) : A7.rotateY(F6.ry.v * L4)), F6.rx.propType && (L4.length ? A7.rotateX(F6.rx.v * L4[0]) : A7.rotateX(F6.rx.v * L4)), F6.o.propType && (L4.length ? W3 += (F6.o.v * L4[0] - W3) * L4[0] : W3 += (F6.o.v * L4 - W3) * L4), t6.strokeWidthAnim && F6.sw.propType && (L4.length ? H4 += F6.sw.v * L4[0] : H4 += F6.sw.v * L4), t6.strokeColorAnim && F6.sc.propType) for (X3 = 0; X3 < 3; X3 += 1) L4.length ? $3[X3] += (F6.sc.v[X3] - $3[X3]) * L4[0] : $3[X3] += (F6.sc.v[X3] - $3[X3]) * L4;
                  if (t6.fillColorAnim && t6.fc) {
                    if (F6.fc.propType) for (X3 = 0; X3 < 3; X3 += 1) L4.length ? G4[X3] += (F6.fc.v[X3] - G4[X3]) * L4[0] : G4[X3] += (F6.fc.v[X3] - G4[X3]) * L4;
                    F6.fh.propType && (G4 = L4.length ? z5(G4, F6.fh.v * L4[0]) : z5(G4, F6.fh.v * L4)), F6.fs.propType && (G4 = L4.length ? V4(G4, F6.fs.v * L4[0]) : V4(G4, F6.fs.v * L4)), F6.fb.propType && (G4 = L4.length ? N4(G4, F6.fb.v * L4[0]) : N4(G4, F6.fb.v * L4));
                  }
                }
                for (x6 = 0; x6 < M5; x6 += 1) (F6 = w7[x6].a).p.propType && (L4 = w7[x6].s.getMult(P6[a6].anIndexes[x6], S4.a[x6].s.totalChars), this._hasMaskedPath ? L4.length ? A7.translate(0, F6.p.v[1] * L4[0], -F6.p.v[2] * L4[1]) : A7.translate(0, F6.p.v[1] * L4, -F6.p.v[2] * L4) : L4.length ? A7.translate(F6.p.v[0] * L4[0], F6.p.v[1] * L4[1], -F6.p.v[2] * L4[2]) : A7.translate(F6.p.v[0] * L4, F6.p.v[1] * L4, -F6.p.v[2] * L4));
                if (t6.strokeWidthAnim && (U3 = H4 < 0 ? 0 : H4), t6.strokeColorAnim && (Y2 = "rgb(" + Math.round(255 * $3[0]) + "," + Math.round(255 * $3[1]) + "," + Math.round(255 * $3[2]) + ")"), t6.fillColorAnim && t6.fc && (Z2 = "rgb(" + Math.round(255 * G4[0]) + "," + Math.round(255 * G4[1]) + "," + Math.round(255 * G4[2]) + ")"), this._hasMaskedPath) {
                  if (A7.translate(0, -t6.ls), A7.translate(0, k6[1] * O4 * 0.01 + s7, 0), this._pathData.p.v) {
                    b6 = (h7.point[1] - m6.point[1]) / (h7.point[0] - m6.point[0]);
                    var dt2 = 180 * Math.atan(b6) / Math.PI;
                    h7.point[0] < m6.point[0] && (dt2 += 180), A7.rotate(-dt2 * Math.PI / 180);
                  }
                  A7.translate(B5, q6, 0), o6 -= k6[0] * P6[a6].an * 5e-3, P6[a6 + 1] && K3 !== P6[a6 + 1].ind && (o6 += P6[a6].an / 2, o6 += 1e-3 * t6.tr * t6.finalSize);
                } else {
                  switch (A7.translate(i7, s7, 0), t6.ps && A7.translate(t6.ps[0], t6.ps[1] + t6.ascent, 0), t6.j) {
                    case 1:
                      A7.translate(P6[a6].animatorJustifyOffset + t6.justifyOffset + (t6.boxWidth - t6.lineWidths[P6[a6].line]), 0, 0);
                      break;
                    case 2:
                      A7.translate(P6[a6].animatorJustifyOffset + t6.justifyOffset + (t6.boxWidth - t6.lineWidths[P6[a6].line]) / 2, 0, 0);
                  }
                  A7.translate(0, -t6.ls), A7.translate(j6, 0, 0), A7.translate(k6[0] * P6[a6].an * 5e-3, k6[1] * O4 * 0.01, 0), i7 += P6[a6].l + 1e-3 * t6.tr * t6.finalSize;
                }
                "html" === D5 ? st2 = A7.toCSS() : "svg" === D5 ? st2 = A7.to2dCSS() : at2 = [A7.props[0], A7.props[1], A7.props[2], A7.props[3], A7.props[4], A7.props[5], A7.props[6], A7.props[7], A7.props[8], A7.props[9], A7.props[10], A7.props[11], A7.props[12], A7.props[13], A7.props[14], A7.props[15]], J4 = W3;
              }
              C5 <= a6 ? (I4 = new yi(J4, U3, Y2, Z2, st2, at2), this.renderedLetters.push(I4), C5 += 1, this.lettersChangedFlag = true) : (I4 = this.renderedLetters[a6], this.lettersChangedFlag = I4.update(J4, U3, Y2, Z2, st2, at2) || this.lettersChangedFlag);
            }
          }
        }, wi.prototype.getValue = function() {
          this._elem.globalData.frameId !== this._frameId && (this._frameId = this._elem.globalData.frameId, this.iterateDynamicProperties());
        }, wi.prototype.mHelper = new Zt(), wi.prototype.defaultPropsArray = [], p6([Wt], wi), Si.prototype.initElement = function(t6, e5, i7) {
          this.lettersChangedFlag = true, this.initFrame(), this.initBaseData(t6, e5, i7), this.textProperty = new bi(this, t6.t, this.dynamicProperties), this.textAnimator = new wi(t6.t, this.renderType, this), this.initTransform(t6, e5, i7), this.initHierarchy(), this.initRenderable(), this.initRendererElement(), this.createContainerElements(), this.createRenderableComponents(), this.createContent(), this.hide(), this.textAnimator.searchProperties(this.dynamicProperties);
        }, Si.prototype.prepareFrame = function(t6) {
          this._mdf = false, this.prepareRenderableFrame(t6), this.prepareProperties(t6, this.isInRange);
        }, Si.prototype.createPathShape = function(t6, e5) {
          var i7, s7, a6 = e5.length, r6 = "";
          for (i7 = 0; i7 < a6; i7 += 1) "sh" === e5[i7].ty && (s7 = e5[i7].ks.k, r6 += ui(s7, s7.i.length, true, t6));
          return r6;
        }, Si.prototype.updateDocumentData = function(t6, e5) {
          this.textProperty.updateDocumentData(t6, e5);
        }, Si.prototype.canResizeFont = function(t6) {
          this.textProperty.canResizeFont(t6);
        }, Si.prototype.setMinimumFontSize = function(t6) {
          this.textProperty.setMinimumFontSize(t6);
        }, Si.prototype.applyTextPropertiesToMatrix = function(t6, e5, i7, s7, a6) {
          switch (t6.ps && e5.translate(t6.ps[0], t6.ps[1] + t6.ascent, 0), e5.translate(0, -t6.ls, 0), t6.j) {
            case 1:
              e5.translate(t6.justifyOffset + (t6.boxWidth - t6.lineWidths[i7]), 0, 0);
              break;
            case 2:
              e5.translate(t6.justifyOffset + (t6.boxWidth - t6.lineWidths[i7]) / 2, 0, 0);
          }
          e5.translate(s7, a6, 0);
        }, Si.prototype.buildColor = function(t6) {
          return "rgb(" + Math.round(255 * t6[0]) + "," + Math.round(255 * t6[1]) + "," + Math.round(255 * t6[2]) + ")";
        }, Si.prototype.emptyProp = new yi(), Si.prototype.destroy = function() {
        }, Si.prototype.validateText = function() {
          (this.textProperty._mdf || this.textProperty._isFirstFrame) && (this.buildNewText(), this.textProperty._isFirstFrame = false, this.textProperty._mdf = false);
        };
        var Ai = { shapes: [] };
        function Di(t6, e5, i7) {
          this.textSpans = [], this.renderType = "svg", this.initElement(t6, e5, i7);
        }
        function Ci(t6, e5, i7) {
          this.initElement(t6, e5, i7);
        }
        function Pi(t6, e5, i7) {
          this.initFrame(), this.initBaseData(t6, e5, i7), this.initFrame(), this.initTransform(t6, e5, i7), this.initHierarchy();
        }
        function Ti() {
        }
        function Ei() {
        }
        function Fi(t6, e5, i7) {
          this.layers = t6.layers, this.supports3d = true, this.completeLayers = false, this.pendingElements = [], this.elements = this.layers ? c5(this.layers.length) : [], this.initElement(t6, e5, i7), this.tm = t6.tm ? qt.getProp(this, t6.tm, 0, e5.frameRate, this) : { _placeholder: true };
        }
        function xi(t6, e5) {
          this.animationItem = t6, this.layers = null, this.renderedFrame = -1, this.svgElement = U2("svg");
          var i7 = "";
          if (e5 && e5.title) {
            var s7 = U2("title"), a6 = L3();
            s7.setAttribute("id", a6), s7.textContent = e5.title, this.svgElement.appendChild(s7), i7 += a6;
          }
          if (e5 && e5.description) {
            var r6 = U2("desc"), n5 = L3();
            r6.setAttribute("id", n5), r6.textContent = e5.description, this.svgElement.appendChild(r6), i7 += " " + n5;
          }
          i7 && this.svgElement.setAttribute("aria-labelledby", i7);
          var o6 = U2("defs");
          this.svgElement.appendChild(o6);
          var h7 = U2("g");
          this.svgElement.appendChild(h7), this.layerElement = h7, this.renderConfig = { preserveAspectRatio: e5 && e5.preserveAspectRatio || "xMidYMid meet", imagePreserveAspectRatio: e5 && e5.imagePreserveAspectRatio || "xMidYMid slice", contentVisibility: e5 && e5.contentVisibility || "visible", progressiveLoad: e5 && e5.progressiveLoad || false, hideOnTransparent: !(e5 && false === e5.hideOnTransparent), viewBoxOnly: e5 && e5.viewBoxOnly || false, viewBoxSize: e5 && e5.viewBoxSize || false, className: e5 && e5.className || "", id: e5 && e5.id || "", focusable: e5 && e5.focusable, filterSize: { width: e5 && e5.filterSize && e5.filterSize.width || "100%", height: e5 && e5.filterSize && e5.filterSize.height || "100%", x: e5 && e5.filterSize && e5.filterSize.x || "0%", y: e5 && e5.filterSize && e5.filterSize.y || "0%" }, width: e5 && e5.width, height: e5 && e5.height, runExpressions: !e5 || void 0 === e5.runExpressions || e5.runExpressions }, this.globalData = { _mdf: false, frameNum: -1, defs: o6, renderConfig: this.renderConfig }, this.elements = [], this.pendingElements = [], this.destroyed = false, this.rendererType = "svg";
        }
        function Mi() {
        }
        function Ii() {
        }
        function Li(t6, e5, i7, s7, a6) {
          var r6 = e5.container.globalData.renderConfig.filterSize, n5 = e5.data.fs || r6;
          t6.setAttribute("x", n5.x || r6.x), t6.setAttribute("y", n5.y || r6.y), t6.setAttribute("width", n5.width || r6.width), t6.setAttribute("height", n5.height || r6.height), this.filterManager = e5;
          var o6 = U2("feGaussianBlur");
          o6.setAttribute("in", "SourceAlpha"), o6.setAttribute("result", s7 + "_drop_shadow_1"), o6.setAttribute("stdDeviation", "0"), this.feGaussianBlur = o6, t6.appendChild(o6);
          var h7 = U2("feOffset");
          h7.setAttribute("dx", "25"), h7.setAttribute("dy", "0"), h7.setAttribute("in", s7 + "_drop_shadow_1"), h7.setAttribute("result", s7 + "_drop_shadow_2"), this.feOffset = h7, t6.appendChild(h7);
          var l7 = U2("feFlood");
          l7.setAttribute("flood-color", "#00ff00"), l7.setAttribute("flood-opacity", "1"), l7.setAttribute("result", s7 + "_drop_shadow_3"), this.feFlood = l7, t6.appendChild(l7);
          var p7 = U2("feComposite");
          p7.setAttribute("in", s7 + "_drop_shadow_3"), p7.setAttribute("in2", s7 + "_drop_shadow_2"), p7.setAttribute("operator", "in"), p7.setAttribute("result", s7 + "_drop_shadow_4"), t6.appendChild(p7);
          var d7 = this.createMergeNode(s7, [s7 + "_drop_shadow_4", a6]);
          t6.appendChild(d7);
        }
        function Oi(t6, e5, i7, s7) {
          t6.setAttribute("x", "-100%"), t6.setAttribute("y", "-100%"), t6.setAttribute("width", "300%"), t6.setAttribute("height", "300%"), this.filterManager = e5;
          var a6 = U2("feGaussianBlur");
          a6.setAttribute("result", s7), t6.appendChild(a6), this.feGaussianBlur = a6;
        }
        return p6([Me, ze, Ue, Ye, Ie, Ze, Si], Di), Di.prototype.createContent = function() {
          this.data.singleShape && !this.globalData.fontManager.chars && (this.textContainer = U2("text"));
        }, Di.prototype.buildTextContents = function(t6) {
          for (var e5 = 0, i7 = t6.length, s7 = [], a6 = ""; e5 < i7; ) t6[e5] === String.fromCharCode(13) || t6[e5] === String.fromCharCode(3) ? (s7.push(a6), a6 = "") : a6 += t6[e5], e5 += 1;
          return s7.push(a6), s7;
        }, Di.prototype.buildShapeData = function(t6, e5) {
          if (t6.shapes && t6.shapes.length) {
            var i7 = t6.shapes[0];
            if (i7.it) {
              var s7 = i7.it[i7.it.length - 1];
              s7.s && (s7.s.k[0] = e5, s7.s.k[1] = e5);
            }
          }
          return t6;
        }, Di.prototype.buildNewText = function() {
          var t6, e5;
          this.addDynamicProperty(this);
          var i7 = this.textProperty.currentData;
          this.renderedLetters = c5(i7 ? i7.l.length : 0), i7.fc ? this.layerElement.setAttribute("fill", this.buildColor(i7.fc)) : this.layerElement.setAttribute("fill", "rgba(0,0,0,0)"), i7.sc && (this.layerElement.setAttribute("stroke", this.buildColor(i7.sc)), this.layerElement.setAttribute("stroke-width", i7.sw)), this.layerElement.setAttribute("font-size", i7.finalSize);
          var s7 = this.globalData.fontManager.getFontByName(i7.f);
          if (s7.fClass) this.layerElement.setAttribute("class", s7.fClass);
          else {
            this.layerElement.setAttribute("font-family", s7.fFamily);
            var a6 = i7.fWeight, r6 = i7.fStyle;
            this.layerElement.setAttribute("font-style", r6), this.layerElement.setAttribute("font-weight", a6);
          }
          this.layerElement.setAttribute("aria-label", i7.t);
          var n5, o6 = i7.l || [], h7 = !!this.globalData.fontManager.chars;
          e5 = o6.length;
          var l7 = this.mHelper, p7 = "", d7 = this.data.singleShape, f6 = 0, m6 = 0, u6 = true, g8 = 1e-3 * i7.tr * i7.finalSize;
          if (!d7 || h7 || i7.sz) {
            var v6, y7 = this.textSpans.length;
            for (t6 = 0; t6 < e5; t6 += 1) {
              if (this.textSpans[t6] || (this.textSpans[t6] = { span: null, childSpan: null, glyph: null }), !h7 || !d7 || 0 === t6) {
                if (n5 = y7 > t6 ? this.textSpans[t6].span : U2(h7 ? "g" : "text"), y7 <= t6) {
                  if (n5.setAttribute("stroke-linecap", "butt"), n5.setAttribute("stroke-linejoin", "round"), n5.setAttribute("stroke-miterlimit", "4"), this.textSpans[t6].span = n5, h7) {
                    var b6 = U2("g");
                    n5.appendChild(b6), this.textSpans[t6].childSpan = b6;
                  }
                  this.textSpans[t6].span = n5, this.layerElement.appendChild(n5);
                }
                n5.style.display = "inherit";
              }
              if (l7.reset(), d7 && (o6[t6].n && (f6 = -g8, m6 += i7.yOffset, m6 += u6 ? 1 : 0, u6 = false), this.applyTextPropertiesToMatrix(i7, l7, o6[t6].line, f6, m6), f6 += o6[t6].l || 0, f6 += g8), h7) {
                var _7;
                if (1 === (v6 = this.globalData.fontManager.getCharData(i7.finalText[t6], s7.fStyle, this.globalData.fontManager.getFontByName(i7.f).fFamily)).t) _7 = new Fi(v6.data, this.globalData, this);
                else {
                  var k6 = Ai;
                  v6.data && v6.data.shapes && (k6 = this.buildShapeData(v6.data, i7.finalSize)), _7 = new vi(k6, this.globalData, this);
                }
                if (this.textSpans[t6].glyph) {
                  var w7 = this.textSpans[t6].glyph;
                  this.textSpans[t6].childSpan.removeChild(w7.layerElement), w7.destroy();
                }
                this.textSpans[t6].glyph = _7, _7._debug = true, _7.prepareFrame(0), _7.renderFrame(), this.textSpans[t6].childSpan.appendChild(_7.layerElement), 1 === v6.t && this.textSpans[t6].childSpan.setAttribute("transform", "scale(" + i7.finalSize / 100 + "," + i7.finalSize / 100 + ")");
              } else d7 && n5.setAttribute("transform", "translate(" + l7.props[12] + "," + l7.props[13] + ")"), n5.textContent = o6[t6].val, n5.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
            }
            d7 && n5 && n5.setAttribute("d", p7);
          } else {
            var S4 = this.textContainer, A7 = "start";
            switch (i7.j) {
              case 1:
                A7 = "end";
                break;
              case 2:
                A7 = "middle";
                break;
              default:
                A7 = "start";
            }
            S4.setAttribute("text-anchor", A7), S4.setAttribute("letter-spacing", g8);
            var D5 = this.buildTextContents(i7.finalText);
            for (e5 = D5.length, m6 = i7.ps ? i7.ps[1] + i7.ascent : 0, t6 = 0; t6 < e5; t6 += 1) (n5 = this.textSpans[t6].span || U2("tspan")).textContent = D5[t6], n5.setAttribute("x", 0), n5.setAttribute("y", m6), n5.style.display = "inherit", S4.appendChild(n5), this.textSpans[t6] || (this.textSpans[t6] = { span: null, glyph: null }), this.textSpans[t6].span = n5, m6 += i7.finalLineHeight;
            this.layerElement.appendChild(S4);
          }
          for (; t6 < this.textSpans.length; ) this.textSpans[t6].span.style.display = "none", t6 += 1;
          this._sizeChanged = true;
        }, Di.prototype.sourceRectAtTime = function() {
          if (this.prepareFrame(this.comp.renderedFrame - this.data.st), this.renderInnerContent(), this._sizeChanged) {
            this._sizeChanged = false;
            var t6 = this.layerElement.getBBox();
            this.bbox = { top: t6.y, left: t6.x, width: t6.width, height: t6.height };
          }
          return this.bbox;
        }, Di.prototype.getValue = function() {
          var t6, e5, i7 = this.textSpans.length;
          for (this.renderedFrame = this.comp.renderedFrame, t6 = 0; t6 < i7; t6 += 1) (e5 = this.textSpans[t6].glyph) && (e5.prepareFrame(this.comp.renderedFrame - this.data.st), e5._mdf && (this._mdf = true));
        }, Di.prototype.renderInnerContent = function() {
          if (this.validateText(), (!this.data.singleShape || this._mdf) && (this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag), this.lettersChangedFlag || this.textAnimator.lettersChangedFlag)) {
            var t6, e5;
            this._sizeChanged = true;
            var i7, s7, a6, r6 = this.textAnimator.renderedLetters, n5 = this.textProperty.currentData.l;
            for (e5 = n5.length, t6 = 0; t6 < e5; t6 += 1) n5[t6].n || (i7 = r6[t6], s7 = this.textSpans[t6].span, (a6 = this.textSpans[t6].glyph) && a6.renderFrame(), i7._mdf.m && s7.setAttribute("transform", i7.m), i7._mdf.o && s7.setAttribute("opacity", i7.o), i7._mdf.sw && s7.setAttribute("stroke-width", i7.sw), i7._mdf.sc && s7.setAttribute("stroke", i7.sc), i7._mdf.fc && s7.setAttribute("fill", i7.fc));
          }
        }, p6([Je], Ci), Ci.prototype.createContent = function() {
          var t6 = U2("rect");
          t6.setAttribute("width", this.data.sw), t6.setAttribute("height", this.data.sh), t6.setAttribute("fill", this.data.sc), this.layerElement.appendChild(t6);
        }, Pi.prototype.prepareFrame = function(t6) {
          this.prepareProperties(t6, true);
        }, Pi.prototype.renderFrame = function() {
        }, Pi.prototype.getBaseElement = function() {
          return null;
        }, Pi.prototype.destroy = function() {
        }, Pi.prototype.sourceRectAtTime = function() {
        }, Pi.prototype.hide = function() {
        }, p6([Me, ze, Ye, Ie], Pi), p6([Re], Ti), Ti.prototype.createNull = function(t6) {
          return new Pi(t6, this.globalData, this);
        }, Ti.prototype.createShape = function(t6) {
          return new vi(t6, this.globalData, this);
        }, Ti.prototype.createText = function(t6) {
          return new Di(t6, this.globalData, this);
        }, Ti.prototype.createImage = function(t6) {
          return new Je(t6, this.globalData, this);
        }, Ti.prototype.createSolid = function(t6) {
          return new Ci(t6, this.globalData, this);
        }, Ti.prototype.configAnimation = function(t6) {
          this.svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg"), this.svgElement.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink"), this.renderConfig.viewBoxSize ? this.svgElement.setAttribute("viewBox", this.renderConfig.viewBoxSize) : this.svgElement.setAttribute("viewBox", "0 0 " + t6.w + " " + t6.h), this.renderConfig.viewBoxOnly || (this.svgElement.setAttribute("width", t6.w), this.svgElement.setAttribute("height", t6.h), this.svgElement.style.width = "100%", this.svgElement.style.height = "100%", this.svgElement.style.transform = "translate3d(0,0,0)", this.svgElement.style.contentVisibility = this.renderConfig.contentVisibility), this.renderConfig.width && this.svgElement.setAttribute("width", this.renderConfig.width), this.renderConfig.height && this.svgElement.setAttribute("height", this.renderConfig.height), this.renderConfig.className && this.svgElement.setAttribute("class", this.renderConfig.className), this.renderConfig.id && this.svgElement.setAttribute("id", this.renderConfig.id), void 0 !== this.renderConfig.focusable && this.svgElement.setAttribute("focusable", this.renderConfig.focusable), this.svgElement.setAttribute("preserveAspectRatio", this.renderConfig.preserveAspectRatio), this.animationItem.wrapper.appendChild(this.svgElement);
          var e5 = this.globalData.defs;
          this.setupGlobalData(t6, e5), this.globalData.progressiveLoad = this.renderConfig.progressiveLoad, this.data = t6;
          var i7 = U2("clipPath"), s7 = U2("rect");
          s7.setAttribute("width", t6.w), s7.setAttribute("height", t6.h), s7.setAttribute("x", 0), s7.setAttribute("y", 0);
          var a6 = L3();
          i7.setAttribute("id", a6), i7.appendChild(s7), this.layerElement.setAttribute("clip-path", "url(" + h6() + "#" + a6 + ")"), e5.appendChild(i7), this.layers = t6.layers, this.elements = c5(t6.layers.length);
        }, Ti.prototype.destroy = function() {
          var t6;
          this.animationItem.wrapper && (this.animationItem.wrapper.innerText = ""), this.layerElement = null, this.globalData.defs = null;
          var e5 = this.layers ? this.layers.length : 0;
          for (t6 = 0; t6 < e5; t6 += 1) this.elements[t6] && this.elements[t6].destroy && this.elements[t6].destroy();
          this.elements.length = 0, this.destroyed = true, this.animationItem = null;
        }, Ti.prototype.updateContainerSize = function() {
        }, Ti.prototype.findIndexByInd = function(t6) {
          var e5 = 0, i7 = this.layers.length;
          for (e5 = 0; e5 < i7; e5 += 1) if (this.layers[e5].ind === t6) return e5;
          return -1;
        }, Ti.prototype.buildItem = function(t6) {
          var e5 = this.elements;
          if (!e5[t6] && 99 !== this.layers[t6].ty) {
            e5[t6] = true;
            var i7 = this.createItem(this.layers[t6]);
            if (e5[t6] = i7, $2() && (0 === this.layers[t6].ty && this.globalData.projectInterface.registerComposition(i7), i7.initExpressions()), this.appendElementInPos(i7, t6), this.layers[t6].tt) {
              var s7 = "tp" in this.layers[t6] ? this.findIndexByInd(this.layers[t6].tp) : t6 - 1;
              if (-1 === s7) return;
              if (this.elements[s7] && true !== this.elements[s7]) {
                var a6 = e5[s7].getMatte(this.layers[t6].tt);
                i7.setMatte(a6);
              } else this.buildItem(s7), this.addPendingElement(i7);
            }
          }
        }, Ti.prototype.checkPendingElements = function() {
          for (; this.pendingElements.length; ) {
            var t6 = this.pendingElements.pop();
            if (t6.checkParenting(), t6.data.tt) for (var e5 = 0, i7 = this.elements.length; e5 < i7; ) {
              if (this.elements[e5] === t6) {
                var s7 = "tp" in t6.data ? this.findIndexByInd(t6.data.tp) : e5 - 1, a6 = this.elements[s7].getMatte(this.layers[e5].tt);
                t6.setMatte(a6);
                break;
              }
              e5 += 1;
            }
          }
        }, Ti.prototype.renderFrame = function(t6) {
          if (this.renderedFrame !== t6 && !this.destroyed) {
            var e5;
            null === t6 ? t6 = this.renderedFrame : this.renderedFrame = t6, this.globalData.frameNum = t6, this.globalData.frameId += 1, this.globalData.projectInterface.currentFrame = t6, this.globalData._mdf = false;
            var i7 = this.layers.length;
            for (this.completeLayers || this.checkLayers(t6), e5 = i7 - 1; e5 >= 0; e5 -= 1) (this.completeLayers || this.elements[e5]) && this.elements[e5].prepareFrame(t6 - this.layers[e5].st);
            if (this.globalData._mdf) for (e5 = 0; e5 < i7; e5 += 1) (this.completeLayers || this.elements[e5]) && this.elements[e5].renderFrame();
          }
        }, Ti.prototype.appendElementInPos = function(t6, e5) {
          var i7 = t6.getBaseElement();
          if (i7) {
            for (var s7, a6 = 0; a6 < e5; ) this.elements[a6] && true !== this.elements[a6] && this.elements[a6].getBaseElement() && (s7 = this.elements[a6].getBaseElement()), a6 += 1;
            s7 ? this.layerElement.insertBefore(i7, s7) : this.layerElement.appendChild(i7);
          }
        }, Ti.prototype.hide = function() {
          this.layerElement.style.display = "none";
        }, Ti.prototype.show = function() {
          this.layerElement.style.display = "block";
        }, p6([Me, ze, Ye, Ie, Ze], Ei), Ei.prototype.initElement = function(t6, e5, i7) {
          this.initFrame(), this.initBaseData(t6, e5, i7), this.initTransform(t6, e5, i7), this.initRenderable(), this.initHierarchy(), this.initRendererElement(), this.createContainerElements(), this.createRenderableComponents(), !this.data.xt && e5.progressiveLoad || this.buildAllItems(), this.hide();
        }, Ei.prototype.prepareFrame = function(t6) {
          if (this._mdf = false, this.prepareRenderableFrame(t6), this.prepareProperties(t6, this.isInRange), this.isInRange || this.data.xt) {
            if (this.tm._placeholder) this.renderedFrame = t6 / this.data.sr;
            else {
              var e5 = this.tm.v;
              e5 === this.data.op && (e5 = this.data.op - 1), this.renderedFrame = e5;
            }
            var i7, s7 = this.elements.length;
            for (this.completeLayers || this.checkLayers(this.renderedFrame), i7 = s7 - 1; i7 >= 0; i7 -= 1) (this.completeLayers || this.elements[i7]) && (this.elements[i7].prepareFrame(this.renderedFrame - this.layers[i7].st), this.elements[i7]._mdf && (this._mdf = true));
          }
        }, Ei.prototype.renderInnerContent = function() {
          var t6, e5 = this.layers.length;
          for (t6 = 0; t6 < e5; t6 += 1) (this.completeLayers || this.elements[t6]) && this.elements[t6].renderFrame();
        }, Ei.prototype.setElements = function(t6) {
          this.elements = t6;
        }, Ei.prototype.getElements = function() {
          return this.elements;
        }, Ei.prototype.destroyElements = function() {
          var t6, e5 = this.layers.length;
          for (t6 = 0; t6 < e5; t6 += 1) this.elements[t6] && this.elements[t6].destroy();
        }, Ei.prototype.destroy = function() {
          this.destroyElements(), this.destroyBaseElement();
        }, p6([Ti, Ei, Ue], Fi), Fi.prototype.createComp = function(t6) {
          return new Fi(t6, this.globalData, this);
        }, p6([Ti], xi), xi.prototype.createComp = function(t6) {
          return new Fi(t6, this.globalData, this);
        }, p6([ei], Mi), Mi.prototype.initModifierProperties = function(t6, e5) {
          this.s = qt.getProp(t6, e5.s, 0, 0.01, this), this.e = qt.getProp(t6, e5.e, 0, 0.01, this), this.o = qt.getProp(t6, e5.o, 0, 0, this), this.sValue = 0, this.eValue = 0, this.getValue = this.processKeys, this.m = e5.m, this._isAnimated = !!this.s.effectsSequence.length || !!this.e.effectsSequence.length || !!this.o.effectsSequence.length;
        }, Mi.prototype.addShapeToModifier = function(t6) {
          t6.pathsData = [];
        }, Mi.prototype.calculateShapeEdges = function(t6, e5, i7, s7, a6) {
          var r6 = [];
          e5 <= 1 ? r6.push({ s: t6, e: e5 }) : t6 >= 1 ? r6.push({ s: t6 - 1, e: e5 - 1 }) : (r6.push({ s: t6, e: 1 }), r6.push({ s: 0, e: e5 - 1 }));
          var n5, o6, h7 = [], l7 = r6.length;
          for (n5 = 0; n5 < l7; n5 += 1) {
            var p7, d7;
            (o6 = r6[n5]).e * a6 < s7 || o6.s * a6 > s7 + i7 || (p7 = o6.s * a6 <= s7 ? 0 : (o6.s * a6 - s7) / i7, d7 = o6.e * a6 >= s7 + i7 ? 1 : (o6.e * a6 - s7) / i7, h7.push([p7, d7]));
          }
          return h7.length || h7.push([0, 0]), h7;
        }, Mi.prototype.releasePathsData = function(t6) {
          var e5, i7 = t6.length;
          for (e5 = 0; e5 < i7; e5 += 1) ft.release(t6[e5]);
          return t6.length = 0, t6;
        }, Mi.prototype.processShapes = function(t6) {
          var e5, i7, s7, a6;
          if (this._mdf || t6) {
            var r6 = this.o.v % 360 / 360;
            if (r6 < 0 && (r6 += 1), (e5 = this.s.v > 1 ? 1 + r6 : this.s.v < 0 ? 0 + r6 : this.s.v + r6) > (i7 = this.e.v > 1 ? 1 + r6 : this.e.v < 0 ? 0 + r6 : this.e.v + r6)) {
              var n5 = e5;
              e5 = i7, i7 = n5;
            }
            e5 = 1e-4 * Math.round(1e4 * e5), i7 = 1e-4 * Math.round(1e4 * i7), this.sValue = e5, this.eValue = i7;
          } else e5 = this.sValue, i7 = this.eValue;
          var o6, h7, l7, p7, d7, f6 = this.shapes.length, m6 = 0;
          if (i7 === e5) for (a6 = 0; a6 < f6; a6 += 1) this.shapes[a6].localShapeCollection.releaseShapes(), this.shapes[a6].shape._mdf = true, this.shapes[a6].shape.paths = this.shapes[a6].localShapeCollection, this._mdf && (this.shapes[a6].pathsData.length = 0);
          else if (1 === i7 && 0 === e5 || 0 === i7 && 1 === e5) {
            if (this._mdf) for (a6 = 0; a6 < f6; a6 += 1) this.shapes[a6].pathsData.length = 0, this.shapes[a6].shape._mdf = true;
          } else {
            var c6, u6, g8 = [];
            for (a6 = 0; a6 < f6; a6 += 1) if ((c6 = this.shapes[a6]).shape._mdf || this._mdf || t6 || 2 === this.m) {
              if (h7 = (s7 = c6.shape.paths)._length, d7 = 0, !c6.shape._mdf && c6.pathsData.length) d7 = c6.totalShapeLength;
              else {
                for (l7 = this.releasePathsData(c6.pathsData), o6 = 0; o6 < h7; o6 += 1) p7 = ct.getSegmentsLength(s7.shapes[o6]), l7.push(p7), d7 += p7.totalLength;
                c6.totalShapeLength = d7, c6.pathsData = l7;
              }
              m6 += d7, c6.shape._mdf = true;
            } else c6.shape.paths = c6.localShapeCollection;
            var v6, y7 = e5, b6 = i7, _7 = 0;
            for (a6 = f6 - 1; a6 >= 0; a6 -= 1) if ((c6 = this.shapes[a6]).shape._mdf) {
              for ((u6 = c6.localShapeCollection).releaseShapes(), 2 === this.m && f6 > 1 ? (v6 = this.calculateShapeEdges(e5, i7, c6.totalShapeLength, _7, m6), _7 += c6.totalShapeLength) : v6 = [[y7, b6]], h7 = v6.length, o6 = 0; o6 < h7; o6 += 1) {
                y7 = v6[o6][0], b6 = v6[o6][1], g8.length = 0, b6 <= 1 ? g8.push({ s: c6.totalShapeLength * y7, e: c6.totalShapeLength * b6 }) : y7 >= 1 ? g8.push({ s: c6.totalShapeLength * (y7 - 1), e: c6.totalShapeLength * (b6 - 1) }) : (g8.push({ s: c6.totalShapeLength * y7, e: c6.totalShapeLength }), g8.push({ s: 0, e: c6.totalShapeLength * (b6 - 1) }));
                var k6 = this.addShapes(c6, g8[0]);
                if (g8[0].s !== g8[0].e) {
                  if (g8.length > 1) if (c6.shape.paths.shapes[c6.shape.paths._length - 1].c) {
                    var w7 = k6.pop();
                    this.addPaths(k6, u6), k6 = this.addShapes(c6, g8[1], w7);
                  } else this.addPaths(k6, u6), k6 = this.addShapes(c6, g8[1]);
                  this.addPaths(k6, u6);
                }
              }
              c6.shape.paths = u6;
            }
          }
        }, Mi.prototype.addPaths = function(t6, e5) {
          var i7, s7 = t6.length;
          for (i7 = 0; i7 < s7; i7 += 1) e5.addShape(t6[i7]);
        }, Mi.prototype.addSegment = function(t6, e5, i7, s7, a6, r6, n5) {
          a6.setXYAt(e5[0], e5[1], "o", r6), a6.setXYAt(i7[0], i7[1], "i", r6 + 1), n5 && a6.setXYAt(t6[0], t6[1], "v", r6), a6.setXYAt(s7[0], s7[1], "v", r6 + 1);
        }, Mi.prototype.addSegmentFromArray = function(t6, e5, i7, s7) {
          e5.setXYAt(t6[1], t6[5], "o", i7), e5.setXYAt(t6[2], t6[6], "i", i7 + 1), s7 && e5.setXYAt(t6[0], t6[4], "v", i7), e5.setXYAt(t6[3], t6[7], "v", i7 + 1);
        }, Mi.prototype.addShapes = function(t6, e5, i7) {
          var s7, a6, r6, n5, o6, h7, l7, p7, d7 = t6.pathsData, f6 = t6.shape.paths.shapes, m6 = t6.shape.paths._length, c6 = 0, u6 = [], g8 = true;
          for (i7 ? (o6 = i7._length, p7 = i7._length) : (i7 = Gt.newElement(), o6 = 0, p7 = 0), u6.push(i7), s7 = 0; s7 < m6; s7 += 1) {
            for (h7 = d7[s7].lengths, i7.c = f6[s7].c, r6 = f6[s7].c ? h7.length : h7.length + 1, a6 = 1; a6 < r6; a6 += 1) if (c6 + (n5 = h7[a6 - 1]).addedLength < e5.s) c6 += n5.addedLength, i7.c = false;
            else {
              if (c6 > e5.e) {
                i7.c = false;
                break;
              }
              e5.s <= c6 && e5.e >= c6 + n5.addedLength ? (this.addSegment(f6[s7].v[a6 - 1], f6[s7].o[a6 - 1], f6[s7].i[a6], f6[s7].v[a6], i7, o6, g8), g8 = false) : (l7 = ct.getNewSegment(f6[s7].v[a6 - 1], f6[s7].v[a6], f6[s7].o[a6 - 1], f6[s7].i[a6], (e5.s - c6) / n5.addedLength, (e5.e - c6) / n5.addedLength, h7[a6 - 1]), this.addSegmentFromArray(l7, i7, o6, g8), g8 = false, i7.c = false), c6 += n5.addedLength, o6 += 1;
            }
            if (f6[s7].c && h7.length) {
              if (n5 = h7[a6 - 1], c6 <= e5.e) {
                var v6 = h7[a6 - 1].addedLength;
                e5.s <= c6 && e5.e >= c6 + v6 ? (this.addSegment(f6[s7].v[a6 - 1], f6[s7].o[a6 - 1], f6[s7].i[0], f6[s7].v[0], i7, o6, g8), g8 = false) : (l7 = ct.getNewSegment(f6[s7].v[a6 - 1], f6[s7].v[0], f6[s7].o[a6 - 1], f6[s7].i[0], (e5.s - c6) / v6, (e5.e - c6) / v6, h7[a6 - 1]), this.addSegmentFromArray(l7, i7, o6, g8), g8 = false, i7.c = false);
              } else i7.c = false;
              c6 += n5.addedLength, o6 += 1;
            }
            if (i7._length && (i7.setXYAt(i7.v[p7][0], i7.v[p7][1], "i", p7), i7.setXYAt(i7.v[i7._length - 1][0], i7.v[i7._length - 1][1], "o", i7._length - 1)), c6 > e5.e) break;
            s7 < m6 - 1 && (i7 = Gt.newElement(), g8 = true, u6.push(i7), o6 = 0);
          }
          return u6;
        }, Ii.prototype = { createMergeNode: function(t6, e5) {
          var i7, s7, a6 = U2("feMerge");
          for (a6.setAttribute("result", t6), s7 = 0; s7 < e5.length; s7 += 1) (i7 = U2("feMergeNode")).setAttribute("in", e5[s7]), a6.appendChild(i7), a6.appendChild(i7);
          return a6;
        } }, p6([Ii], Li), Li.prototype.renderFrame = function(t6) {
          if (t6 || this.filterManager._mdf) {
            if ((t6 || this.filterManager.effectElements[4].p._mdf) && this.feGaussianBlur.setAttribute("stdDeviation", this.filterManager.effectElements[4].p.v / 4), t6 || this.filterManager.effectElements[0].p._mdf) {
              var e5 = this.filterManager.effectElements[0].p.v;
              this.feFlood.setAttribute("flood-color", j5(Math.round(255 * e5[0]), Math.round(255 * e5[1]), Math.round(255 * e5[2])));
            }
            if ((t6 || this.filterManager.effectElements[1].p._mdf) && this.feFlood.setAttribute("flood-opacity", this.filterManager.effectElements[1].p.v / 255), t6 || this.filterManager.effectElements[2].p._mdf || this.filterManager.effectElements[3].p._mdf) {
              var i7 = this.filterManager.effectElements[3].p.v, s7 = (this.filterManager.effectElements[2].p.v - 90) * A6, a6 = i7 * Math.cos(s7), r6 = i7 * Math.sin(s7);
              this.feOffset.setAttribute("dx", a6), this.feOffset.setAttribute("dy", r6);
            }
          }
        }, Oi.prototype.renderFrame = function(t6) {
          if (t6 || this.filterManager._mdf) {
            var e5 = 0.3, i7 = this.filterManager.effectElements[0].p.v * e5, s7 = this.filterManager.effectElements[1].p.v, a6 = 3 == s7 ? 0 : i7, r6 = 2 == s7 ? 0 : i7;
            this.feGaussianBlur.setAttribute("stdDeviation", a6 + " " + r6);
            var n5 = 1 == this.filterManager.effectElements[2].p.v ? "wrap" : "duplicate";
            this.feGaussianBlur.setAttribute("edgeMode", n5);
          }
        }, it("svg", xi), ti.registerModifier("tm", Mi), Xe(25, Li, true), Xe(29, Oi, true), Kt;
      }());
      s5 = t4(i5.exports);
      a4 = [/^https?:\/\/(.*[^.]\.)?lottielab\.com$/];
      r4 = { v: "5.7.5", fr: 100, ip: 0, op: 300, w: 300, h: 225, nm: "Comp 1", ddd: 0, assets: [], layers: [], markers: [] };
      n3 = class {
        constructor(t5, e5, i6) {
          this.root = t5, this.initialize(e5, i6);
        }
        _initWithAnimation(t5, e5, i6) {
          this._animation = s5.loadAnimation({ container: e5, renderer: "svg", autoplay: false, animationData: t5, rendererSettings: { preserveAspectRatio: i6 } });
        }
        initialize(t5, e5) {
          this.destroy();
          const i6 = document.createElement("div");
          if (i6.style.width = "100%", i6.style.height = "100%", "string" == typeof t5) {
            if (this.loadingSrc === t5) return Promise.resolve();
            this.loadingSrc = t5;
            const s6 = new XMLHttpRequest();
            s6.open("GET", t5, true);
            try {
              a4.some((e6) => new URL(t5).origin.match(e6)) && s6.setRequestHeader("X-Lottie-Player", "@lottielab/lottie-player 1.1.3");
            } catch (t6) {
            }
            return new Promise((a5, r5) => {
              s6.onload = () => {
                if (this.loadingSrc !== t5) return a5();
                try {
                  if (200 === s6.status) {
                    if (!s6.response) return r5(new Error(`Failed to load Lottie file ${t5}: Empty response`));
                    const n4 = JSON.parse(s6.response);
                    return this._initWithAnimation(n4, i6, e5), this.root.innerHTML = "", this.root.appendChild(i6), a5();
                  }
                  {
                    let e6 = s6.responseText;
                    return e6.length > 300 && (e6 = e6.slice(0, 300) + "... (truncated)"), r5(new Error(`Failed to load Lottie file ${t5}: HTTP ${s6.status} ${s6.statusText}
Response:
${e6}`));
                  }
                } catch (e6) {
                  return e6.message && (e6.message = `Failed to load Lottie file ${t5}: ${e6.message}`), r5(e6);
                } finally {
                  this.loadingSrc = void 0;
                }
              }, s6.onerror = () => {
                this.loadingSrc = void 0, r5(new Error(`Failed to load Lottie file ${t5}: Network error`));
              }, s6.send();
            });
          }
          return this._initWithAnimation(null != t5 ? t5 : r4, i6, e5), this.root.innerHTML = "", this.root.appendChild(i6), this.loadingSrc = void 0, Promise.resolve();
        }
        get frameRate() {
          return this._animation ? this._animation.frameRate : 0;
        }
        get duration() {
          return this._animation ? this._animation.getDuration(false) : 0;
        }
        get durationFrames() {
          return this._animation ? this._animation.getDuration(true) : 0;
        }
        get animation() {
          return this._animation;
        }
        get animationData() {
          var t5;
          const e5 = null === (t5 = this._animation) || void 0 === t5 ? void 0 : t5.animationData;
          if (e5 !== r4) return e5;
        }
        renderFrame(t5) {
          const e5 = Math.max(0, Math.min(this.durationFrames - 1e-6, t5 * this.frameRate));
          this._animation.goToAndStop(e5, true);
        }
        get currentTime() {
          return this._animation.currentFrame / this.frameRate;
        }
        get currentFrame() {
          return this._animation.currentFrame;
        }
        destroy() {
          this._animation && this._animation.destroy(), this.root.innerHTML = "";
        }
      };
      h5 = class {
        constructor(t5) {
          var e5;
          this.ops = [], this.lottie = t5;
          const i6 = t5.renderer, s6 = /* @__PURE__ */ new WeakSet();
          (null !== (e5 = null == i6 ? void 0 : i6.elements) && void 0 !== e5 ? e5 : []).forEach((t6) => this.attach(t6, s6));
        }
        attachToProp(t5) {
          var e5;
          const i6 = this, s6 = t5;
          if (!(null === (e5 = t5.effectsSequence) || void 0 === e5 ? void 0 : e5.length)) return;
          const a5 = [];
          for (let e6 = 0; e6 < 8; e6++) a5[e6] = { _caching: structuredClone(t5._caching), propType: s6.propType, offsetTime: s6.offsetTime, keyframes: s6.keyframes, keyframesMetadata: s6.keyframesMetadata, sh: s6.sh, pv: structuredClone(s6.pv) };
          t5.addEffect(function(e6) {
            const r5 = i6.ops.slice(-8);
            t5.interpolateShape && null == e6 && (e6 = structuredClone(s6.pv));
            for (let n4 = 0; n4 < r5.length; n4++) {
              const h6 = r5[n4], l6 = a5[n4];
              !l6._caching && t5._caching && (l6._caching = structuredClone(t5._caching)), !l6.keyframes && s6.keyframes && (l6.keyframes = s6.keyframes), !l6.keyframesMetadata && s6.keyframesMetadata && (l6.keyframesMetadata = s6.keyframesMetadata);
              const p6 = Math.min(Math.max(Math.round(h6.time * i6.lottie.frameRate), 0), i6.lottie.getDuration(true) - 1e-5);
              try {
                let i7;
                l6.offsetTime = t5.offsetTime, t5.interpolateValue ? (l6._caching.lastFrame >= p6 && (l6._caching._lastKeyframeIndex = -1, l6._caching.lastIndex = 0), i7 = t5.interpolateValue.call(l6, p6, l6._caching), l6.pv = i7) : t5.interpolateShape ? (l6._caching.lastIndex = l6._caching.lastFrame < p6 ? l6._caching.lastIndex : 0, t5.interpolateShape.call(l6, p6, l6.pv, l6._caching), i7 = l6.pv) : i7 = 0, l6._caching.lastFrame = p6, e6 = o4(e6, i7, h6.strength);
              } catch (t6) {
                console.warn("[@lottielab/lottie-player:morph]", t6);
              }
            }
            return e6;
          });
        }
        attach(t5, e5 = /* @__PURE__ */ new WeakSet()) {
          if (!e5.has(t5) && "object" == typeof t5 && null != t5) if (e5.add(t5), t5.interpolateShape || t5.interpolateValue || t5.addEffect || t5.effectsSequence) this.attachToProp(t5);
          else for (const i6 of Object.values(t5)) this.attach(i6, e5);
        }
        detach() {
        }
      };
      l5 = class {
        constructor() {
          this.listeners = [];
        }
        addListener(t5) {
          this.listeners.push(t5);
        }
        removeListener(t5) {
          this.listeners = this.listeners.filter((e5) => e5 !== t5);
        }
        hasListeners() {
          return this.listeners.length > 0;
        }
        removeAllListeners() {
          this.listeners = [];
        }
        emit(t5) {
          for (const e5 of this.listeners) e5(t5);
        }
      };
      p5 = class {
        constructor(t5, e5, i6, s6) {
          this.animationFrame = void 0, this.onFrameBound = this.onFrame.bind(this), this.timeMultiplier = 1, this.timeEvent = new l5(), this.renderer = new n3(t5, e5, s6), this._state = { time: 0, lottie: this.renderer.animationData }, i6 && (this.animationFrame = requestAnimationFrame(this.onFrameBound), this.driver = i6);
        }
        initialize(t5, e5) {
          return this.renderer.initialize(t5, e5).then(() => {
            void 0 === this.animationFrame && (this.animationFrame = requestAnimationFrame(this.onFrameBound)), this.advanceToNow(), this._state.lottie = this.renderer.animationData, this.refresh();
          }).catch((t6) => {
            this._state.lottie = void 0;
          });
        }
        get state() {
          return this._state;
        }
        refresh() {
          var t5;
          null === (t5 = this.morphing) || void 0 === t5 || t5.detach(), this.morphing = void 0, this.setState(this.state);
        }
        setState(t5) {
          var e5, i6, s6, a5;
          const r5 = this._state.time !== t5.time;
          if (this._state = t5, r5 && this.renderer.renderFrame(t5.time), t5.morphs) {
            if (!this.morphing && this.renderer.animation && (this.morphing = new h5(this.renderer.animation)), this.morphing) {
              const s7 = this.morphing.ops.length !== t5.morphs.length || this.morphing.ops.some((e6, i7) => {
                const s8 = t5.morphs[i7];
                return !s8 || e6.time !== s8.time || e6.strength !== s8.strength;
              });
              this.morphing.ops = t5.morphs, s7 && (null === (i6 = null === (e5 = this.renderer.animation) || void 0 === e5 ? void 0 : e5.renderer) || void 0 === i6 || i6.renderFrame(null));
            }
          } else this.morphing && this.morphing.ops.length > 0 && (this.morphing.ops = [], null === (a5 = null === (s6 = this.renderer.animation) || void 0 === s6 ? void 0 : s6.renderer) || void 0 === a5 || a5.renderFrame(null));
        }
        set state(t5) {
          if (this.driver) throw new Error("Cannot set state directly when using a driver");
          this.setState(t5);
        }
        get driver() {
          return this._driver;
        }
        set driver(t5) {
          this.prevClock = void 0, void 0 === this.animationFrame && t5 ? this.animationFrame = requestAnimationFrame(this.onFrameBound) : void 0 === this.animationFrame || t5 || (cancelAnimationFrame(this.animationFrame), this.animationFrame = void 0), this._driver = t5, (null == t5 ? void 0 : t5.advance) && this.setState(t5.advance(this._state, 0));
        }
        get clock() {
          if (void 0 === this.prevTime) return 0;
          const t5 = this.prevTime, e5 = (null === performance || void 0 === performance ? void 0 : performance.now()) || (/* @__PURE__ */ new Date()).getTime();
          return (t5 + (e5 - (this.prevRealTime || e5))) / 1e3;
        }
        get duration() {
          return this.renderer.duration;
        }
        get durationInFrames() {
          return this.renderer.durationFrames;
        }
        get frameRate() {
          return this.renderer.frameRate;
        }
        get animation() {
          return this.renderer.animation;
        }
        get animationData() {
          return this.renderer.animationData;
        }
        get currentTime() {
          return this.renderer.currentTime;
        }
        get currentFrame() {
          return this.renderer.currentFrame;
        }
        advanceToNow() {
          var t5;
          const e5 = this.clock, i6 = void 0 !== this.prevClock ? e5 - this.prevClock : 0;
          if ((null === (t5 = this.driver) || void 0 === t5 ? void 0 : t5.advance) && i6 > 0) {
            this._state.lottie = this.renderer.animationData;
            const t6 = i6 * this.timeMultiplier;
            this.setState(this.driver.advance(this._state, i6 * this.timeMultiplier)), this.timeEvent.emit({ playhead: this.currentTime, clock: this.clock, elapsed: t6 }), this.renderer.renderFrame(this._state.time);
          }
          this.prevClock = e5;
        }
        destroy() {
          var t5;
          this.animationFrame && (cancelAnimationFrame(this.animationFrame), this.animationFrame = void 0), null === (t5 = this.morphing) || void 0 === t5 || t5.detach(), this.renderer.destroy();
        }
        onFrame(t5) {
          this.prevTime = t5, this.prevRealTime = (null === performance || void 0 === performance ? void 0 : performance.now()) || (/* @__PURE__ */ new Date()).getTime(), this.advanceToNow(), this.animationFrame = requestAnimationFrame(this.onFrameBound);
        }
      };
      f4 = class {
        constructor() {
          this.playing = true, this.time = 0, this.speed = 1, this.direction = 1, this._loop = true, this._loopsRemaining = 1 / 0, this.loopEvent = new l5(), this.finishEvent = new l5();
        }
        get effectiveSegment() {
          var t5;
          return this.segment ? this.segment : [0, null !== (t5 = this._duration) && void 0 !== t5 ? t5 : 0];
        }
        globalTimeToSegmentTime(t5) {
          const [e5, i6] = this.effectiveSegment;
          return Math.min(Math.max(t5 - e5, 0), i6 - e5);
        }
        segmentTimeToGlobalTime(t5) {
          const [e5] = this.effectiveSegment;
          return e5 + t5;
        }
        advance(t5, e5, i6) {
          const { lottie: s6 } = t5;
          if (this._fps = d5(s6), this._duration = function(t6) {
            return t6 ? (t6.op - t6.ip) / d5(t6) : 0;
          }(s6), !this.playing) return { time: this.time, lottie: s6 };
          const a5 = this.globalTimeToSegmentTime(this.time);
          let r5;
          r5 = a5 + e5 * this.speed * this.direction;
          const n4 = [];
          if (this.durationOfSegment > 0) {
            const t6 = Math.abs(Math.floor(r5 / this.durationOfSegment)), e6 = this.durationOfSegment - a5;
            for (let i7 = 0; i7 < t6; i7++) {
              this._loopsRemaining--;
              const t7 = e6 + i7 * this.durationOfSegment;
              if (!(this._loopsRemaining > 0)) {
                n4.push({ type: "finish", relativeTime: t7 }), r5 = Math.max(0, Math.min(r5, this.durationOfSegment)), this._loopsRemaining = 0, this.playing = false;
                break;
              }
              n4.push({ type: "loop", relativeTime: t7 }), r5 >= this.durationOfSegment ? r5 -= this.durationOfSegment : r5 += this.durationOfSegment;
            }
          } else r5 = 0, n4.push({ type: "loop", relativeTime: 0 });
          const o5 = this.segmentTimeToGlobalTime(r5);
          if (this.time = o5, n4.length > 0) {
            null != i6 && i6.push(...n4);
            for (const t6 of n4) "loop" === t6.type ? this.loopEvent.emit(void 0) : "finish" === t6.type && this.finishEvent.emit(void 0);
          }
          return { time: o5, lottie: s6 };
        }
        play() {
          this.playing = true;
        }
        pause() {
          this.playing = false;
        }
        stop() {
          this.playing = false, this.seek(0), this.loop = this._loop;
        }
        seek(t5) {
          this.time = t5;
        }
        seekToFrame(t5) {
          this.time = t5 / this.frameRate;
        }
        loopBetween(t5, e5) {
          this.segment = [t5, e5];
        }
        loopBetweenFrames(t5, e5) {
          this.segment = [t5 / this.frameRate, e5 / this.frameRate];
        }
        get loop() {
          return this._loop;
        }
        set loop(t5) {
          this._loop = t5, this._loopsRemaining = "number" == typeof t5 ? t5 : t5 ? 1 / 0 : 1;
        }
        get currentTime() {
          return this.time;
        }
        get currentFrame() {
          return this.time * this.frameRate;
        }
        get timeInSegment() {
          return this.globalTimeToSegmentTime(this.time);
        }
        set timeInSegment(t5) {
          this.time = this.segmentTimeToGlobalTime(t5);
        }
        get frameInSegment() {
          return this.timeInSegment * this.frameRate;
        }
        get frameRate() {
          var t5;
          return null !== (t5 = this._fps) && void 0 !== t5 ? t5 : 100;
        }
        get duration() {
          var t5;
          return null !== (t5 = this._duration) && void 0 !== t5 ? t5 : 0;
        }
        get durationFrames() {
          return this.duration * this.frameRate;
        }
        get durationOfSegment() {
          const [t5, e5] = this.effectiveSegment;
          return e5 - t5;
        }
        get animation() {
          throw new Error("This is just a driver and implements ILottie for clarity; you shouldn't directly call this function");
        }
        get animationData() {
          throw new Error("This is just a driver and implements ILottie for clarity; you shouldn't directly call this function");
        }
        toInteractive() {
          throw new Error("This is just a driver and implements ILottie for clarity; you shouldn't directly call this function");
        }
        toPlayback() {
        }
        on(t5, e5) {
          throw new Error("This is just a driver and implements ILottie for clarity; you shouldn't directly call this function");
        }
        off(t5, e5) {
          throw new Error("This is just a driver and implements ILottie for clarity; you shouldn't directly call this function");
        }
      };
      c4 = Object.freeze({ __proto__: null, eventToString: m4 });
      g6 = (() => {
        const t5 = [{ name: "number", lbp: 2, detect: (t6) => /^([1-9]\d*|0)(\.\d*)?$/.test(t6), nud: (t6, e6) => ({ type: 0, value: parseFloat(e6.value) }) }, { name: "identifier", lbp: 2, detect: (t6) => /^[_a-zA-Z][_a-zA-Z0-9]*(\.[a-zA-Z]+)*$/.test(t6), nud: (t6, e6) => ({ type: 1, name: e6.value }) }, { name: "^", lbp: 9, led: (t6, e6) => ({ type: 3, operator: "^", left: e6, right: t6.parse(8) }) }, { name: "!", lbp: 10, nud: (t6) => ({ type: 2, operator: "!", operand: t6.parse(10) }) }, { name: "conditional-operator", detect: (t6) => "?" == t6, lbp: 3, led: (t6, e6) => {
          const i6 = t6.parse(2), s6 = t6.pop();
          ":" != s6.name && u4(s6);
          return { type: 4, condition: e6, thenBranch: i6, elseBranch: t6.parse(2) };
        } }, { name: "(", lbp: 11, nud: (t6) => {
          const e6 = t6.parse(1), i6 = t6.pop();
          return ")" != i6.name && u4(i6), e6;
        }, led: (t6, e6, i6) => {
          1 != e6.type && u4(i6);
          const s6 = [];
          if (")" == t6.peek().name) t6.pop();
          else for (; ; ) {
            s6.push(t6.parse(1));
            const e7 = t6.pop();
            if (")" == e7.name) break;
            "," != e7.name && u4(e7);
          }
          return { type: 5, name: e6.name, operands: s6 };
        } }, { name: "end of input", lbp: 0 }];
        for (const e6 of ["+", "-"]) t5.push({ name: e6, lbp: 7, nud: (t6) => ({ type: 2, operator: e6, operand: t6.parse(7) }), led: (t6, i6) => ({ type: 3, operator: e6, left: i6, right: t6.parse(7) }) });
        const e5 = [["*", 8], ["/", 8], ["<", 6], ["<=", 6], [">", 6], [">=", 6], ["==", 6], ["&&", 5], ["||", 4]];
        for (const [i6, s6] of e5) t5.push({ name: i6, lbp: s6, led: (t6, e6) => ({ type: 3, operator: i6, left: e6, right: t6.parse(s6) }) });
        for (const e6 of [",", ")", ":"]) t5.push({ name: e6, lbp: 1 });
        return t5;
      })();
      y5 = Math;
      k4 = { time: 0, "time.diff": 0, playhead: 0, "playhead.progress": 0, "playhead.abs": 0, "mouse.x": 0, "mouse.y": 0, "mouse.progress.x": 0, "mouse.progress.y": 0, "mouse.abs.x": 0, "mouse.abs.y": 0, "mouse.buttons.left": false, "mouse.buttons.right": false, "mouse.buttons.middle": false };
      x4 = class {
        constructor(t5) {
          this.builtinVariables = Object.assign({}, k4), this.userVariables = {}, this.variables = {}, this.clock = 0, this.transitionStartEvent = new l5(), this.transitionEndEvent = new l5(), this._definition = t5;
          const e5 = t5.states[t5.initialState];
          if (!e5) throw new Error(`Initial state ${t5.initialState} does not exist`);
          this.enterState(e5);
        }
        setupMorphingForCurrentState(t5) {
          (null == t5 ? void 0 : t5.force) && (this.state.morphing = void 0);
          const e5 = this.state.def;
          if (e5.morphing && !this.state.morphing) {
            const t6 = this._definition.states[e5.morphing.otherState];
            t6 ? this.state.morphing = { other: { type: "state", def: t6, playback: D3(t6) }, strength: "number" == typeof e5.morphing.strength ? e5.morphing.strength : A5(e5.morphing.strength, 0) } : console.warn(`[@lottielab/lottie-player:interactivity] State '${e5.morphing.otherState}' to morph with does not exist`);
          } else !e5.morphing && this.state.morphing && (this.state.morphing = void 0);
        }
        enterState(t5) {
          const e5 = D3(t5);
          this.state = { type: "state", def: t5, playback: e5, remainingDuration: t5.duration }, this.setupMorphingForCurrentState({ force: true });
        }
        getCurrentState() {
          return this.state;
        }
        goToState(t5, e5) {
          const i6 = this.state, s6 = i6.def.segment;
          this.transition && this.transitionEndEvent.emit({ from: this.transition.from, to: this.state.def, transition: this.transition.def });
          const a5 = this.state.playback.driver.time;
          this.enterState(t5), e5 = null != e5 ? e5 : { startAt: "start" }, this.transitionStartEvent.emit({ from: i6.def, to: t5, transition: e5 });
          const r5 = t5.segment;
          switch (null == e5 ? void 0 : e5.startAt) {
            case "start":
            case void 0:
              this.state.playback.driver.time = r5[0];
              break;
            case "end":
              this.state.playback.driver.time = r5[1];
              break;
            case "proportional":
              this.state.playback.driver.time = P4(a5, s6, r5);
              break;
            case "wrap":
              this.state.playback.driver.time = T4(a5, s6, r5);
              break;
            case "clamp":
              this.state.playback.driver.time = E4(a5, s6, r5);
              break;
            default:
              console.warn(`[@lottielab/lottie-player:interactive] Unknown startAt value in ttransition: ${e5.startAt}`);
          }
          if (e5.duration) {
            const t6 = this.transition ? Object.assign(Object.assign({}, this.transition), { next: i6 }) : i6;
            this.transition = { type: "transition", prev: t6, progress: 0, def: e5, from: i6.def };
          } else this.transition = void 0, this.transitionEndEvent.emit({ from: i6.def, to: t5, transition: e5 });
        }
        get definition() {
          return this._definition;
        }
        set definition(t5) {
          var e5;
          const i6 = null === (e5 = Object.entries(this._definition.states).find(([t6, e6]) => e6 === this.state.def)) || void 0 === e5 ? void 0 : e5[0];
          if (this._definition = t5, i6 && this._definition.states[i6]) this.enterState(t5.states[i6]);
          else {
            if (!t5.states[t5.initialState]) throw this.enterState({ segment: [0, 0], loop: false, speed: 1, direction: "forward" }), new Error(`Initial state ${t5.initialState} does not exist`);
            const e6 = this.state.playback.driver.time;
            this.enterState(t5.states[t5.initialState]), this.state.playback.driver.time = e6, this.transition = void 0;
          }
        }
        updateVariables(t5) {
          this.builtinVariables = Object.assign(Object.assign({}, this.builtinVariables), t5), this.variables = w5(this.builtinVariables, this.userVariables);
        }
        setUserVariables(t5) {
          this.userVariables = t5, this.variables = w5(this.builtinVariables, this.userVariables);
        }
        handle(t5) {
          var e5;
          const i6 = null === (e5 = this.state.def.on) || void 0 === e5 ? void 0 : e5[m4(t5)];
          if (!i6) return;
          const s6 = this._definition.states[i6.goTo];
          s6 ? this.goToState(s6, i6) : console.warn(`[@lottielab/lottie-player:interactive] State ${i6.goTo} does not exist`);
        }
        getEffectiveState(t5) {
          return "state" === t5.type || t5.progress < 1 ? t5 : t5.next ? t5.next : this.state;
        }
        applyTransition(t5, e5, i6) {
          let s6 = t5;
          return this.transition && (s6 = F4(t5, this.transition, e5, i6, this.variables), this.transition.progress >= 1 ? (this.transitionEndEvent.emit({ from: this.transition.from, to: this.state.def, transition: this.transition.def }), this.transition = void 0) : this.transition.prev = this.getEffectiveState(this.transition.prev)), s6;
        }
        advance(t5, e5) {
          let i6 = Object.assign({}, t5);
          const s6 = this.clock += e5;
          this.setupMorphingForCurrentState();
          const a5 = [];
          if (void 0 === this.state.remainingDuration) i6 = C3(this.state, Object.assign(Object.assign({}, t5), { morphs: void 0 }), e5, s6, this.variables, a5);
          else {
            const r5 = this.state.remainingDuration;
            if (r5 > 0) {
              const n4 = Math.min(r5, e5);
              this.state.remainingDuration -= n4, i6 = C3(this.state, Object.assign(Object.assign({}, t5), { morphs: void 0 }), n4, s6, this.variables, a5), this.state.remainingDuration <= 0 && (this.state.remainingDuration = 0, this.handle({ event: "finish" }));
            }
          }
          for (const t6 of a5) "finish" === t6.type && this.handle({ event: "finish" });
          return i6 = this.applyTransition(i6, e5, s6), i6;
        }
        get currentTime() {
          return this.state.playback.playheadControl ? this.state.playback.playheadControl(this.variables) : this.state.playback.driver.currentTime;
        }
        get currentFrame() {
          return this.currentTime / this.state.playback.driver.frameRate;
        }
      };
      M3 = "ll-enclosing-rect";
      L2 = class {
        attachContinuousListeners(t5) {
          const e5 = (e6) => {
            var i7;
            const s7 = t5.getBoundingClientRect();
            null === (i7 = this.handler) || void 0 === i7 || i7.updateVariables({ "mouse.x": e6.clientX - s7.left, "mouse.y": e6.clientY - s7.top, "mouse.abs.x": e6.clientX, "mouse.abs.y": e6.clientY, "mouse.progress.x": I2((e6.clientX - s7.left) / s7.width, 0, 1), "mouse.progress.y": I2((e6.clientY - s7.top) / s7.height, 0, 1) });
          };
          window.addEventListener("mousemove", e5), this.disposers.push(() => window.removeEventListener("mousemove", e5));
          const i6 = (t6) => {
            var e6;
            null === (e6 = this.handler) || void 0 === e6 || e6.updateVariables({ "mouse.buttons.left": 0 != (1 & t6.buttons), "mouse.buttons.right": 0 != (2 & t6.buttons), "mouse.buttons.middle": 0 != (4 & t6.buttons) });
          };
          window.addEventListener("mousedown", i6), this.disposers.push(() => window.removeEventListener("mousedown", i6));
          const s6 = () => {
            var t6;
            null === (t6 = this.handler) || void 0 === t6 || t6.updateVariables({ "mouse.buttons.left": false, "mouse.buttons.right": false, "mouse.buttons.middle": false });
          };
          window.addEventListener("mouseup", s6), this.disposers.push(() => window.removeEventListener("mouseup", s6));
        }
        attachListener(t5, e5, i6) {
          let s6;
          switch (i6) {
            case "click":
              s6 = "click";
              break;
            case "mouseEnter":
              s6 = "mouseenter";
              break;
            case "mouseLeave":
              s6 = "mouseleave";
              break;
            case "mouseDown":
              s6 = "mousedown";
              break;
            case "mouseUp":
              s6 = "mouseup";
              break;
            default:
              throw new Error("InteractiveEventDispatcher: not a DOM event: " + i6);
          }
          const a5 = (t6) => {
            var s7, a6;
            e5 === M3 ? null === (s7 = this.handler) || void 0 === s7 || s7.handle({ event: i6 }) : null === (a6 = this.handler) || void 0 === a6 || a6.handle({ event: i6, target: null != e5 ? e5 : void 0 });
          };
          t5.addEventListener(s6, a5), this.disposers.push(() => {
            t5.removeEventListener(s6, a5);
          });
        }
        constructor(t5, e5 = []) {
          var i6, s6;
          this.container = t5, this.disposers = [], this.currentClickableClassNames = [];
          const a5 = t5.querySelector("svg"), r5 = null !== (s6 = null === (i6 = null == a5 ? void 0 : a5.getAttribute("viewBox")) || void 0 === i6 ? void 0 : i6.split(" ").map((t6) => parseFloat(t6))) && void 0 !== s6 ? s6 : [1200, 900], n4 = null == a5 ? void 0 : a5.querySelector("svg > g"), o5 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          [["x", "0"], ["y", "0"], ["width", r5[2].toString()], ["height", r5[3].toString()], ["fill", "transparent"], ["pointer-events", "bounding-box"], ["class", M3]].forEach(([t6, e6]) => {
            o5.setAttribute(t6, e6);
          }), null == n4 || n4.insertBefore(o5, n4.firstChild), this.disposers.push(() => o5.remove());
          const h6 = /* @__PURE__ */ new Set();
          for (const t6 of [M3].concat(e5)) {
            h6.has(t6) && console.warn(`[@lottielab/lottie-player:interactive] Duplicate class name ${t6} in reactivity event dispatcher`), h6.add(t6);
            const e6 = t6 === M3 ? n4 : this.container.querySelector(`.${t6}`);
            if (e6) for (const i7 of ["click", "mouseDown", "mouseUp", "mouseEnter", "mouseLeave"]) this.attachListener(e6, t6, i7);
            else console.warn(`[@lottielab/lottie-player:interactive] Could not find element with class name ${t6}`);
          }
          this.attachContinuousListeners(o5);
        }
        setClickableClassNames(t5) {
          const e5 = (t6, e6) => {
            const i6 = "full" === t6 ? this.container : this.container.querySelector(`.${t6}`);
            i6 && (i6.style.cursor = e6);
          };
          this.currentClickableClassNames.forEach((t6) => e5(t6, "initial")), this.currentClickableClassNames = t5, t5.forEach((t6) => e5(t6, "pointer"));
        }
        destroy() {
          this.setClickableClassNames([]), this.disposers.forEach((t5) => t5());
        }
      };
      !function(t5) {
        t5.Linear = { i: { x: 0.75, y: 0.75 }, o: { x: 0.25, y: 0.25 } }, t5.Natural = { o: { x: 0.4, y: 0 }, i: { x: 0.8, y: 1 } }, t5.BounceIn = { o: { x: 0.8, y: 0 }, i: { x: 0.5, y: 1.5 } }, t5.BounceOut = { o: { x: 0.5, y: -0.5 }, i: { x: 0.2, y: 1 } }, t5.Accelerate = { o: { x: 0.42, y: 0 }, i: { x: 1, y: 1 } }, t5.SlowDown = { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 } };
      }(O2 || (O2 = {}));
      R = class {
        constructor(t5) {
          this.onUpdate = t5, this.variables = {};
        }
        set(t5, e5) {
          this.variables[t5] = e5, this.onUpdate(this.variables);
        }
        get(t5) {
          return this.variables[t5];
        }
        delete(t5) {
          delete this.variables[t5], this.onUpdate(this.variables);
        }
        clear() {
          this.variables = {}, this.onUpdate(this.variables);
        }
      };
      V3 = class {
        constructor(t5, e5) {
          this._transitionStartEvent = new l5(), this._transitionEndEvent = new l5(), this._userProvidedDefinition = { set: false }, this._rootElement = t5, this._lottie = e5;
          const i6 = this.effectiveDefinition();
          this._driver = new x4(i6), this._dispatcher = new L2(this._rootElement, this.getObservedClassNames(i6)), this._dispatcher.setClickableClassNames(this.getClickableClassNames()), this._dispatcher.handler = this._driver;
          this._driver.transitionStartEvent.addListener((t6) => {
            this._transitionStartEvent.emit(this.translateTransitionEvent(t6)), this._dispatcher.setClickableClassNames(this.getClickableClassNames());
          }), this._driver.transitionEndEvent.addListener((t6) => this._transitionEndEvent.emit(this.translateTransitionEvent(t6))), this.inputs = new R((t6) => this._driver.setUserVariables(t6));
        }
        get definition() {
          var t5, e5;
          return this._userProvidedDefinition.set ? this._userProvidedDefinition.value : null === (e5 = null === (t5 = this._lottie) || void 0 === t5 ? void 0 : t5.metadata) || void 0 === e5 ? void 0 : e5.lottielabInteractivity;
        }
        set definition(t5) {
          this._userProvidedDefinition = { set: true, value: t5 }, this.updateReactivity();
        }
        get state() {
          const t5 = this._driver.getCurrentState().def, e5 = this.lookupStateName(t5);
          return Object.assign(Object.assign({}, t5), { name: null != e5 ? e5 : "<custom>" });
        }
        set state(t5) {
          this._driver.goToState(this.findState(t5));
        }
        goToState(t5, e5) {
          this._driver.goToState(this.findState(t5), e5);
        }
        hasUserProvidedDefinition() {
          return this._userProvidedDefinition.set;
        }
        resetDefinition() {
          this._userProvidedDefinition = { set: false }, this.updateReactivity();
        }
        on(t5, e5) {
          switch (t5) {
            case "transitionstart":
              this._transitionStartEvent.addListener(e5);
              break;
            case "transitionend":
              this._transitionEndEvent.addListener(e5);
          }
        }
        off(t5, e5) {
          switch (t5) {
            case "transitionstart":
              this._transitionStartEvent.removeListener(e5);
              break;
            case "transitionend":
              this._transitionEndEvent.removeListener(e5);
          }
        }
        trigger(t5) {
          this._driver.handle({ event: "custom", name: t5 });
        }
        _destroy() {
          var t5;
          null === (t5 = this._dispatcher) || void 0 === t5 || t5.destroy();
        }
        _getDriver() {
          return this._driver;
        }
        translateTransitionEvent(t5) {
          var e5, i6;
          return { from: Object.assign(Object.assign({}, t5.from), { name: null !== (e5 = this.lookupStateName(t5.from)) && void 0 !== e5 ? e5 : "<custom>" }), to: Object.assign(Object.assign({}, t5.to), { name: null !== (i6 = this.lookupStateName(t5.to)) && void 0 !== i6 ? i6 : "<custom>" }), transition: t5.transition };
        }
        effectiveDefinition() {
          var t5;
          const e5 = this._lottie ? this._lottie.op / this._lottie.fr : 0;
          return null !== (t5 = this.definition) && void 0 !== t5 ? t5 : { __version: "v1", initialState: "default", states: { default: { segment: [0, e5] } } };
        }
        lookupStateName(t5) {
          var e5;
          return null === (e5 = Object.entries(this.effectiveDefinition().states).find(([e6, i6]) => i6 === t5)) || void 0 === e5 ? void 0 : e5[0];
        }
        findState(t5) {
          let e5;
          if (e5 = "string" == typeof t5 ? this.effectiveDefinition().states[t5] : t5, !t5) throw new Error(`State ${t5} not found`);
          return e5;
        }
        getObservedClassNames(t5) {
          return t5 ? [...new Set(Object.values(t5.states).flatMap((t6) => {
            var e5;
            return Object.keys(null !== (e5 = t6.on) && void 0 !== e5 ? e5 : {});
          }).flatMap((t6) => {
            const [e5, i6] = t6.split(":");
            return "custom" !== e5 && i6 ? [i6] : [];
          }))] : [];
        }
        getClickableClassNames() {
          var t5;
          return [...new Set(Object.keys(null !== (t5 = this.state.on) && void 0 !== t5 ? t5 : {}).flatMap((t6) => {
            const [e5, i6] = t6.split(":");
            return ["click", "mouseDown", "mouseUp"].includes(e5) ? i6 ? [i6] : ["full"] : [];
          }))];
        }
        updateReactivity() {
          var t5;
          const e5 = this.effectiveDefinition();
          this._driver.definition = e5, null === (t5 = this._dispatcher) || void 0 === t5 || t5.destroy(), this._dispatcher = new L2(this._rootElement, this.getObservedClassNames(e5)), this._dispatcher.handler = this._driver;
        }
      };
      N3 = class {
        constructor(t5, e5, i6, s6) {
          this.timeEvent = new l5(), this.timeEventListener = (t6) => {
            "playback" === this._impl.type ? this.timeEvent.emit(t6) : this.timeEvent.emit(Object.assign(Object.assign({}, t6), { playhead: this.currentTime }));
          }, this.root = t5, this._renderer = new p5(t5, e5, void 0, s6);
          const a5 = new f4();
          i6 ? a5.play() : a5.pause(), this._impl = { type: "playback", driver: a5 }, this._renderer.driver = a5, this.initialize(e5, i6, s6);
        }
        initialize(t5, e5, i6) {
          return this._renderer.timeEvent.removeListener(this.timeEventListener), this._renderer.initialize(t5, i6).then(() => {
            var t6, i7, s6;
            if (this._renderer.timeEvent.addListener(this.timeEventListener), (null === (t6 = this.interactivity) || void 0 === t6 ? void 0 : t6.hasUserProvidedDefinition()) || function(t7) {
              var e6, i8;
              return !!(null === (e6 = null == t7 ? void 0 : t7.metadata) || void 0 === e6 ? void 0 : e6.lottielabInteractivity) && "v1" === (null === (i8 = null == t7 ? void 0 : t7.metadata) || void 0 === i8 ? void 0 : i8.lottielabInteractivity.__version);
            }(this._renderer.animationData)) {
              const t7 = null === (i7 = this.interactivity) || void 0 === i7 ? void 0 : i7.hasUserProvidedDefinition(), e6 = null === (s6 = this.interactivity) || void 0 === s6 ? void 0 : s6.definition;
              this.destroyImpl(), this.createInteractiveImpl(), t7 && (this.interactivity.definition = e6);
            } else this.interactivity && this.toPlayback();
            e5 ? this.play() : this.pause();
          });
        }
        destroyImpl() {
          "interactive" === this._impl.type && this._impl.interactivity._destroy();
        }
        createPlaybackImpl() {
          this._impl = { type: "playback", driver: new f4() }, this._renderer.driver = this._impl.driver, this._updateTimeMultiplier();
        }
        createInteractiveImpl() {
          this._impl = { type: "interactive", interactivity: new V3(this.root, this._renderer.animationData), playback: { direction: 1, speed: 1, playing: true } }, this._renderer.driver = this._impl.interactivity._getDriver(), this._updateTimeMultiplier();
        }
        toInteractive() {
          "interactive" !== this._impl.type && (this.destroyImpl(), this.createInteractiveImpl());
        }
        toPlayback() {
          "playback" !== this._impl.type && (this.destroyImpl(), this.createPlaybackImpl());
        }
        destroy() {
          this.destroyImpl(), this._renderer.timeEvent.removeListener(this.timeEventListener), this._renderer.destroy(), this.root.innerHTML = "";
        }
        get interactivity() {
          return "interactive" === this._impl.type ? this._impl.interactivity : void 0;
        }
        _updateTimeMultiplier() {
          "playback" === this._impl.type ? this._renderer.timeMultiplier = 1 : this._impl.playback.playing ? this._renderer.timeMultiplier = this._impl.playback.speed * this._impl.playback.direction : this._renderer.timeMultiplier = 0;
        }
        play() {
          "playback" === this._impl.type ? this._impl.driver.play() : (this._impl.playback.playing = true, this._updateTimeMultiplier());
        }
        stop() {
          "playback" === this._impl.type ? this._impl.driver.stop() : this.pause();
        }
        pause() {
          "playback" === this._impl.type ? this._impl.driver.pause() : (this._impl.playback.playing = false, this._updateTimeMultiplier());
        }
        seek(t5) {
          "playback" === this._impl.type ? (this._impl.driver.seek(t5), this._renderer.advanceToNow()) : console.warn("[@lottielab/lottie-player] Cannot seek an interactive Lottie");
        }
        seekToFrame(t5) {
          "playback" === this._impl.type ? (this._impl.driver.seekToFrame(t5), this._renderer.advanceToNow()) : console.warn("[@lottielab/lottie-player] Cannot seek an interactive Lottie");
        }
        loopBetween(t5, e5) {
          "playback" === this._impl.type ? this._impl.driver.loopBetween(t5, e5) : console.warn("[@lottielab/lottie-player] Cannot loop an interactive Lottie");
        }
        loopBetweenFrames(t5, e5) {
          "playback" === this._impl.type ? this._impl.driver.loopBetweenFrames(t5, e5) : console.warn("[@lottielab/lottie-player] Cannot loop an interactive Lottie");
        }
        on(t5, e5) {
          switch (t5) {
            case "loop":
              if ("interactive" === this._impl.type) throw new Error("Cannot listen to 'loop' event on an interactive Lottie");
              this._impl.driver.loopEvent.addListener(e5);
              break;
            case "finish":
              if ("interactive" === this._impl.type) throw new Error("Cannot listen to 'finish' event on an interactive Lottie");
              this._impl.driver.finishEvent.addListener(e5);
            case "time":
              this.timeEvent.addListener(e5);
          }
        }
        off(t5, e5) {
          switch (t5) {
            case "time":
              this.timeEvent.removeListener(e5);
              break;
            case "loop":
              if ("interactive" === this._impl.type) return;
              this._impl.driver.loopEvent.removeListener(e5);
              break;
            case "finish":
              if ("interactive" === this._impl.type) return;
              this._impl.driver.finishEvent.removeListener(e5);
          }
        }
        get playing() {
          return "playback" === this._impl.type ? this._impl.driver.playing : this._impl.playback.playing;
        }
        set playing(t5) {
          "playback" === this._impl.type ? this._impl.driver.playing = t5 : (this._impl.playback.playing = t5, this._updateTimeMultiplier());
        }
        get loop() {
          return "playback" === this._impl.type && this._impl.driver.loop;
        }
        set loop(t5) {
          "playback" === this._impl.type ? this._impl.driver.loop = t5 : console.warn("[@lottielab/lottie-player] Cannot set loop on an interactive Lottie");
        }
        get currentTime() {
          switch (this._impl.type) {
            case "playback":
              return this._impl.driver.currentTime;
            case "interactive":
              return this._impl.interactivity._getDriver().currentTime;
          }
        }
        set currentTime(t5) {
          this.seek(t5);
        }
        get currentFrame() {
          switch (this._impl.type) {
            case "playback":
              return this._impl.driver.currentFrame;
            case "interactive":
              return this._impl.interactivity._getDriver().currentFrame;
          }
        }
        set currentFrame(t5) {
          this.seekToFrame(t5);
        }
        get frameRate() {
          return this._renderer.frameRate;
        }
        get duration() {
          return this._renderer.duration;
        }
        get durationFrames() {
          return this._renderer.durationInFrames;
        }
        get direction() {
          return "playback" === this._impl.type ? this._impl.driver.direction : this._impl.playback.direction;
        }
        set direction(t5) {
          "playback" === this._impl.type ? this._impl.driver.direction = t5 : (this._impl.playback.direction = t5, this._updateTimeMultiplier());
        }
        get speed() {
          return "playback" === this._impl.type ? this._impl.driver.speed : this._impl.playback.speed;
        }
        set speed(t5) {
          "playback" === this._impl.type ? this._impl.driver.speed = t5 : (this._impl.playback.speed = t5, this._updateTimeMultiplier());
        }
        get animation() {
          return this._renderer.animation;
        }
        get animationData() {
          return this._renderer.animationData;
        }
      };
      j4 = class extends HTMLElement {
        static get observedAttributes() {
          return ["src", "loop", "speed", "direction", "preserveAspectRatio"];
        }
        constructor() {
          super(), this.loadEvent = new CustomEvent("load", { bubbles: true, cancelable: false }), this.attachShadow({ mode: "open" });
          const t5 = document.createElement("style"), e5 = document.createElement("div");
          e5.style.width = "100%", e5.style.height = "100%", this.shadowRoot.appendChild(t5), this.shadowRoot.appendChild(e5), this.lottie = new N3(e5), this.updateStyles();
        }
        updateStyles() {
          const [t5, e5] = this.intrinsicSize;
          this.shadowRoot.querySelector("style").textContent = `
      :host { display: inline-block; width: ${t5}px; height: ${e5}px; }
    `;
        }
        get intrinsicSize() {
          return this.lottie.animationData ? [this.lottie.animationData.w, this.lottie.animationData.h] : [300, 225];
        }
        attributeChangedCallback(t5, e5, i6) {
          var s6;
          if (e5 !== i6) switch (t5) {
            case "src":
              try {
                this.lottie.initialize(i6, !("false" === this.getAttribute("autoplay")), null !== (s6 = this.getAttribute("preserveAspectRatio")) && void 0 !== s6 ? s6 : void 0).then(() => this.dispatchEvent(this.loadEvent)).catch((t7) => {
                  z4(t7), this.dispatchEvent(new CustomEvent("error", { bubbles: true, cancelable: false, detail: t7 }));
                }).finally(() => this.updateStyles());
              } catch (t7) {
                z4(t7), this.dispatchEvent(new CustomEvent("error", { bubbles: true, cancelable: false, detail: t7 }));
              }
              break;
            case "loop":
              this.lottie.loop = this.convertLoopAttribute(i6);
              break;
            case "direction":
              this.lottie.direction = this.convertDirectionAttribute(i6);
              break;
            case "speed":
              const t6 = parseFloat(i6);
              isNaN(t6) ? (z4(`Invalid speed value: ${i6}`), this.lottie.speed = 1) : this.lottie.speed = parseFloat(i6);
          }
        }
        convertLoopAttribute(t5) {
          switch (t5) {
            case "true":
            case "":
              return true;
            case "false":
              return false;
            default:
              const e5 = +t5;
              return isNaN(e5) ? (z4(`Invalid loop value: ${t5}`), true) : e5 < 0 ? (z4(`Invalid loop value (negative): ${t5}`), true) : (Math.floor(e5) !== e5 && z4(`Non-integer loop values are not supported: ${t5}`), Math.round(e5));
          }
        }
        convertDirectionAttribute(t5) {
          if (["normal", "forwards"].includes(t5)) return 1;
          if (["reverse", "backwards"].includes(t5)) return -1;
          const e5 = +t5;
          return isNaN(e5) ? (z4(`Invalid direction value: ${t5}`), 1) : 1 === e5 || -1 === e5 ? e5 : (z4(`Invalid direction value: ${t5}`), 1);
        }
        disconnectedCallback() {
          this.lottie.destroy();
        }
        play() {
          this.lottie.play();
        }
        stop() {
          this.lottie.stop();
        }
        pause() {
          this.lottie.pause();
        }
        seek(t5) {
          this.lottie.seek(t5);
        }
        seekToFrame(t5) {
          this.lottie.seekToFrame(t5);
        }
        loopBetween(t5, e5) {
          this.lottie.loopBetween(1e3 * t5, 1e3 * e5);
        }
        loopBetweenFrames(t5, e5) {
          this.lottie.loopBetweenFrames(t5, e5);
        }
        toInteractive() {
          this.lottie.toInteractive();
        }
        toPlayback() {
          this.lottie.toPlayback();
        }
        on(t5, e5) {
          switch (t5) {
            case "time":
            case "loop":
            case "finish":
              this.lottie.on(t5, e5);
          }
        }
        off(t5, e5) {
          this.lottie.off(t5, e5);
        }
        get playing() {
          return this.lottie.playing;
        }
        set playing(t5) {
          this.lottie.playing = t5;
        }
        get loop() {
          return this.lottie.loop;
        }
        set loop(t5) {
          this.lottie.loop = t5;
        }
        get currentTime() {
          return this.lottie.currentTime;
        }
        set currentTime(t5) {
          this.lottie.currentTime = t5;
        }
        get currentFrame() {
          return this.lottie.currentFrame;
        }
        set currentFrame(t5) {
          this.lottie.currentFrame = t5;
        }
        get frameRate() {
          return this.lottie.frameRate;
        }
        get duration() {
          return this.lottie.duration;
        }
        get durationFrames() {
          return this.lottie.durationFrames;
        }
        get direction() {
          return this.lottie.direction;
        }
        set direction(t5) {
          this.lottie.direction = t5;
        }
        get speed() {
          return this.lottie.speed;
        }
        set speed(t5) {
          this.lottie.speed = t5;
        }
        get animation() {
          return this.lottie.animation;
        }
        get animationData() {
          return this.lottie.animationData;
        }
        get interactivity() {
          return this.lottie.interactivity;
        }
      };
      "undefined" == typeof window || window.customElements.get("lottie-player") || window.customElements.define("lottie-player", j4);
    }
  });

  // pages/new-tab/app/activity/components/BurnAnimation.js
  var BurnAnimation_exports = {};
  __export(BurnAnimation_exports, {
    BurnAnimation: () => BurnAnimation
  });
  function BurnAnimation({ url: url5 }) {
    const ref = A2(
      /** @type {Lottie} */
      null
    );
    y2(() => {
      if (!ref.current) return;
      const curr = (
        /** @type {import("@lottielab/lottie-player/web").default} */
        ref.current
      );
      let finished = false;
      const int = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("done-burning", { detail: { url: url5, reason: "timeout occurred" } }));
        curr.stop();
        finished = true;
      }, 1200);
      return () => {
        clearTimeout(int);
        if (!finished) {
          window.dispatchEvent(new CustomEvent("done-burning", { detail: { url: url5, reason: "unmount occurred" } }));
        }
      };
    }, [url5]);
    return /* @__PURE__ */ g("lottie-player", { src: "burn.json", ref, duration: "1s" });
  }
  var init_BurnAnimation = __esm({
    "pages/new-tab/app/activity/components/BurnAnimation.js"() {
      "use strict";
      init_preact_module();
      init_web();
      init_hooks_module();
    }
  });

  // pages/new-tab/app/activity/components/ActivityItemAnimationWrapper.js
  function ActivityItemAnimationWrapper({ children, url: url5 }) {
    const ref = A2(
      /** @type {HTMLDivElement|null} */
      null
    );
    const { exiting, burning } = x2(ActivityBurningSignalContext);
    const isBurning = useComputed(() => burning.value.some((x5) => x5 === url5));
    const isExiting = useComputed(() => exiting.value.some((x5) => x5 === url5));
    _2(() => {
      let canceled = false;
      let sent = false;
      if (isBurning.value && ref.current) {
        const element = ref.current;
        element.style.height = element.scrollHeight + "px";
      } else if (isExiting.value && ref.current) {
        const element = ref.current;
        const anim = element.animate([{ height: element.style.height }, { height: "0px" }], {
          duration: 200,
          iterations: 1,
          fill: "both",
          easing: "ease-in-out"
        });
        const handler = (e5) => {
          if (canceled) return;
          if (sent) return;
          sent = true;
          anim.removeEventListener("finish", handler);
          window.dispatchEvent(
            new CustomEvent("done-exiting", {
              detail: {
                url: url5,
                reason: "animation completed"
              }
            })
          );
        };
        anim.addEventListener("finish", handler, { once: true });
        document.addEventListener("visibilitychange", handler, { once: true });
        return () => {
          anim.removeEventListener("finish", handler);
          document.removeEventListener("visibilitychange", handler);
        };
      }
      return () => {
        canceled = true;
      };
    }, [isBurning.value, isExiting.value, url5]);
    return /* @__PURE__ */ g("div", { class: (0, import_classnames7.default)(Activity_default.anim, isBurning.value && Activity_default.burning), ref }, !isExiting.value && children, !isExiting.value && isBurning.value && /* @__PURE__ */ g(P3, { fallback: null }, /* @__PURE__ */ g(BurnAnimationLazy, { url: url5 })));
  }
  var import_classnames7, BurnAnimationLazy;
  var init_ActivityItemAnimationWrapper = __esm({
    "pages/new-tab/app/activity/components/ActivityItemAnimationWrapper.js"() {
      "use strict";
      init_hooks_module();
      init_BurnProvider();
      init_signals_module();
      import_classnames7 = __toESM(require_classnames(), 1);
      init_Activity();
      init_compat_module();
      init_preact_module();
      BurnAnimationLazy = z3(() => Promise.resolve().then(() => (init_BurnAnimation(), BurnAnimation_exports)).then((x5) => x5.BurnAnimation));
    }
  });

  // pages/new-tab/app/activity/components/Activity.js
  function ActivityConfigured({ expansion, toggle }) {
    const platformName = usePlatformName();
    const expanded = expansion === "expanded";
    const { activity } = x2(SignalStateContext);
    const count = useComputed(() => {
      return Object.values(activity.value.trackingStatus).reduce((acc, item) => {
        return acc + item.totalCount;
      }, 0);
    });
    const itemCount = useComputed(() => {
      return Object.keys(activity.value.items).length;
    });
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    const canBurn = platformName === "macos";
    return /* @__PURE__ */ g("div", { class: Activity_default.root }, /* @__PURE__ */ g(
      ActivityHeading,
      {
        className: Activity_default.activityHeading,
        trackerCount: count.value,
        itemCount: itemCount.value,
        onToggle: toggle,
        expansion,
        canExpand: itemCount.value > 0,
        buttonAttrs: {
          "aria-controls": WIDGET_ID,
          id: TOGGLE_ID
        }
      }
    ), itemCount.value > 0 && expanded && /* @__PURE__ */ g(ActivityBody, { canBurn }));
  }
  function ActivityBody({ canBurn }) {
    const { didClick } = x2(ActivityApiContext);
    const ref = A2(
      /** @type {HTMLUListElement|null} */
      null
    );
    useOnMiddleClick(ref, didClick);
    const documentVisibility = useDocumentVisibility();
    const { isReducedMotion } = useEnv();
    const { keys } = x2(SignalStateContext);
    const { burning, exiting } = x2(ActivityBurningSignalContext);
    const busy = useComputed(() => burning.value.length > 0 || exiting.value.length > 0);
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("ul", { class: Activity_default.activity, ref, onClick: didClick, "data-busy": busy }, keys.value.available.map((id, index) => {
      if (canBurn && !isReducedMotion) return /* @__PURE__ */ g(BurnableItem, { id, key: id, documentVisibility });
      return /* @__PURE__ */ g(RemovableItem, { id, key: id, canBurn, documentVisibility });
    })));
  }
  function TrackerStatus({ id, trackersFound }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const { activity } = x2(SignalStateContext);
    const status = useComputed(() => activity.value.trackingStatus[id]);
    const other = status.value.trackerCompanies.slice(DDG_MAX_TRACKER_ICONS);
    const companyIconsMax = other.length === 0 ? DDG_MAX_TRACKER_ICONS : DDG_MAX_TRACKER_ICONS - 1;
    const icons = status.value.trackerCompanies.slice(0, companyIconsMax).map((item, index) => {
      return /* @__PURE__ */ g(CompanyIcon, { displayName: item.displayName, key: item });
    });
    const otherIcon = other.length > 0 ? /* @__PURE__ */ g("span", { title: other.map((item) => item.displayName).join("\n"), class: Activity_default.otherIcon }, "+", other.length) : null;
    if (status.value.totalCount === 0) {
      if (trackersFound) return /* @__PURE__ */ g("p", null, t5("activity_no_trackers_blocked"));
      return /* @__PURE__ */ g("p", null, t5("activity_no_trackers"));
    }
    return /* @__PURE__ */ g("div", { class: Activity_default.companiesIconRow, "data-testid": "TrackerStatus" }, /* @__PURE__ */ g("div", { class: Activity_default.companiesIcons }, icons, otherIcon), /* @__PURE__ */ g("div", { class: Activity_default.companiesText }, /* @__PURE__ */ g(Trans, { str: t5("activity_countBlockedPlural", { count: String(status.value.totalCount) }), values: {} })));
  }
  function HistoryItems({ id }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const { activity } = x2(SignalStateContext);
    const history = useComputed(() => activity.value.history[id]);
    const [expansion, setExpansion] = h2(
      /** @type {Expansion} */
      "collapsed"
    );
    const max = Math.min(history.value.length, MAX_SHOW_AMOUNT);
    const min = Math.min(MIN_SHOW_AMOUNT, max);
    const current = expansion === "collapsed" ? min : max;
    const hasMore = current < max;
    const hasLess = current > min;
    const hiddenCount = max - current;
    const showButton = hasMore || hasLess;
    function onClick(event) {
      const btn = event.target?.closest("button[data-action]");
      if (btn?.dataset.action === "hide") {
        setExpansion("collapsed");
      } else if (btn?.dataset.action === "show") {
        setExpansion("expanded");
      }
    }
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("ul", { class: Activity_default.history, onClick }, history.value.slice(0, current).map((item, index) => {
      const isLast = index === current - 1;
      return /* @__PURE__ */ g("li", { class: Activity_default.historyItem, key: item.url + item.title }, /* @__PURE__ */ g("a", { href: item.url, class: Activity_default.historyLink, title: item.url, "data-url": item.url }, item.title), /* @__PURE__ */ g("small", { class: Activity_default.time }, item.relativeTime), isLast && showButton && /* @__PURE__ */ g(
        "button",
        {
          "data-action": hasMore && isLast ? "show" : "hide",
          class: Activity_default.historyBtn,
          "aria-label": hasMore && isLast ? t5("activity_show_more_history", { count: String(hiddenCount) }) : t5("activity_show_less_history")
        },
        /* @__PURE__ */ g(ChevronSmall, null)
      ));
    })));
  }
  function ActivityCustomized() {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const platformName = usePlatformName();
    const sectionTitle = t5("activity_menuTitle");
    const { visibility, id, toggle, index } = useVisibility();
    useCustomizer({ title: sectionTitle, id, icon: "shield", toggle, visibility: visibility.value, index });
    if (visibility.value === "hidden") {
      return null;
    }
    return /* @__PURE__ */ g(ActivityProvider, null, platformName === "macos" && /* @__PURE__ */ g(BurnProvider, null, /* @__PURE__ */ g(ActivityConsumer, null)), platformName === "windows" && /* @__PURE__ */ g(ActivityConsumer, null));
  }
  function ActivityConsumer() {
    const { state, toggle } = x2(ActivityContext);
    if (state.status === "ready") {
      return /* @__PURE__ */ g(SignalStateProvider, null, /* @__PURE__ */ g(ActivityConfigured, { expansion: state.config.expansion, toggle }));
    }
    return null;
  }
  var BurnableItem, RemovableItem, DDG_MAX_TRACKER_ICONS, MIN_SHOW_AMOUNT, MAX_SHOW_AMOUNT;
  var init_Activity2 = __esm({
    "pages/new-tab/app/activity/components/Activity.js"() {
      "use strict";
      init_preact_module();
      init_Activity();
      init_hooks_module();
      init_compat_module();
      init_ActivityProvider();
      init_types();
      init_widget_config_provider();
      init_utils2();
      init_CustomizerMenu();
      init_settings_provider();
      init_PrivacyStats2();
      init_Icons2();
      init_CompanyIcon2();
      init_TranslationsProvider();
      init_ActivityItem();
      init_BurnProvider();
      init_EnvironmentProvider();
      init_signals_module();
      init_ActivityItemAnimationWrapper();
      BurnableItem = M2(
        /**
         * @param {object} props
         * @param {string} props.id
         * @param {'visible' | 'hidden'} props.documentVisibility
         */
        function BurnableItem2({ id, documentVisibility }) {
          const { activity } = x2(SignalStateContext);
          const item = useComputed(() => activity.value.items[id]);
          return /* @__PURE__ */ g(ActivityItemAnimationWrapper, { url: id }, /* @__PURE__ */ g(
            ActivityItem,
            {
              title: item.value.title,
              url: id,
              favoriteSrc: item.value.favoriteSrc,
              faviconMax: item.value.faviconMax,
              etldPlusOne: item.value.etldPlusOne,
              canBurn: true,
              documentVisibility
            },
            /* @__PURE__ */ g(TrackerStatus, { id, trackersFound: item.value.trackersFound }),
            /* @__PURE__ */ g(HistoryItems, { id })
          ));
        }
      );
      RemovableItem = M2(
        /**
         * @param {object} props
         * @param {string} props.id
         * @param {boolean} props.canBurn
         * @param {"visible" | "hidden"} props.documentVisibility
         */
        function RemovableItem2({ id, canBurn, documentVisibility }) {
          const { activity } = x2(SignalStateContext);
          const item = useComputed(() => activity.value.items[id]);
          return /* @__PURE__ */ g(
            ActivityItem,
            {
              title: item.value.title,
              url: id,
              favoriteSrc: item.value.favoriteSrc,
              faviconMax: item.value.faviconMax,
              etldPlusOne: item.value.etldPlusOne,
              canBurn,
              documentVisibility
            },
            /* @__PURE__ */ g(TrackerStatus, { id, trackersFound: item.value.trackersFound }),
            /* @__PURE__ */ g(HistoryItems, { id })
          );
        }
      );
      DDG_MAX_TRACKER_ICONS = 3;
      MIN_SHOW_AMOUNT = 2;
      MAX_SHOW_AMOUNT = 10;
    }
  });

  // pages/new-tab/app/entry-points/activity.js
  var activity_exports = {};
  __export(activity_exports, {
    factory: () => factory
  });
  function factory() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "activity" }, /* @__PURE__ */ g(ActivityCustomized, null));
  }
  var init_activity = __esm({
    "pages/new-tab/app/entry-points/activity.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_Activity2();
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
        openFavorite(id, url5, target) {
          this.ntp.messaging.notify("favorites_open", { id, url: url5, target });
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
    const service = useService3();
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
      (id, url5, target) => {
        if (!service.current) return;
        service.current.openFavorite(id, url5, target);
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
          cb(event.data);
        });
      },
      [service]
    );
    return /* @__PURE__ */ g(FavoritesContext.Provider, { value: { state, toggle, favoritesDidReOrder, openFavorite, openContextMenu, add, onConfigChanged } }, /* @__PURE__ */ g(FavoritesDispatchContext.Provider, { value: dispatch }, children));
  }
  function useService3() {
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
      FavoritesContext = J({
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
      FavoritesDispatchContext = J(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js
  function _arrayWithHoles(r5) {
    if (Array.isArray(r5)) return r5;
  }
  var init_arrayWithHoles = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
  function _iterableToArrayLimit(r5, l6) {
    var t5 = null == r5 ? null : "undefined" != typeof Symbol && r5[Symbol.iterator] || r5["@@iterator"];
    if (null != t5) {
      var e5, n4, i6, u5, a5 = [], f5 = true, o5 = false;
      try {
        if (i6 = (t5 = t5.call(r5)).next, 0 === l6) {
          if (Object(t5) !== t5) return;
          f5 = false;
        } else for (; !(f5 = (e5 = i6.call(t5)).done) && (a5.push(e5.value), a5.length !== l6); f5 = true) ;
      } catch (r6) {
        o5 = true, n4 = r6;
      } finally {
        try {
          if (!f5 && null != t5["return"] && (u5 = t5["return"](), Object(u5) !== u5)) return;
        } finally {
          if (o5) throw n4;
        }
      }
      return a5;
    }
  }
  var init_iterableToArrayLimit = __esm({
    "../node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
  function _arrayLikeToArray(r5, a5) {
    (null == a5 || a5 > r5.length) && (a5 = r5.length);
    for (var e5 = 0, n4 = Array(a5); e5 < a5; e5++) n4[e5] = r5[e5];
    return n4;
  }
  var init_arrayLikeToArray = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js
  function _unsupportedIterableToArray(r5, a5) {
    if (r5) {
      if ("string" == typeof r5) return _arrayLikeToArray(r5, a5);
      var t5 = {}.toString.call(r5).slice(8, -1);
      return "Object" === t5 && r5.constructor && (t5 = r5.constructor.name), "Map" === t5 || "Set" === t5 ? Array.from(r5) : "Arguments" === t5 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t5) ? _arrayLikeToArray(r5, a5) : void 0;
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
  function _slicedToArray(r5, e5) {
    return _arrayWithHoles(r5) || _iterableToArrayLimit(r5, e5) || _unsupportedIterableToArray(r5, e5) || _nonIterableRest();
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
        __assign = Object.assign || function(t5) {
          for (var s6, i6 = 1, n4 = arguments.length; i6 < n4; i6++) {
            s6 = arguments[i6];
            for (var p6 in s6) if (Object.prototype.hasOwnProperty.call(s6, p6))
              t5[p6] = s6[p6];
          }
          return t5;
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
  function _typeof(o5) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o6) {
      return typeof o6;
    } : function(o6) {
      return o6 && "function" == typeof Symbol && o6.constructor === Symbol && o6 !== Symbol.prototype ? "symbol" : typeof o6;
    }, _typeof(o5);
  }
  var init_typeof = __esm({
    "../node_modules/@babel/runtime/helpers/esm/typeof.js"() {
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/toPrimitive.js
  function toPrimitive(t5, r5) {
    if ("object" != _typeof(t5) || !t5) return t5;
    var e5 = t5[Symbol.toPrimitive];
    if (void 0 !== e5) {
      var i6 = e5.call(t5, r5 || "default");
      if ("object" != _typeof(i6)) return i6;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r5 ? String : Number)(t5);
  }
  var init_toPrimitive = __esm({
    "../node_modules/@babel/runtime/helpers/esm/toPrimitive.js"() {
      init_typeof();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
  function toPropertyKey(t5) {
    var i6 = toPrimitive(t5, "string");
    return "symbol" == _typeof(i6) ? i6 : i6 + "";
  }
  var init_toPropertyKey = __esm({
    "../node_modules/@babel/runtime/helpers/esm/toPropertyKey.js"() {
      init_typeof();
      init_toPrimitive();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/defineProperty.js
  function _defineProperty(e5, r5, t5) {
    return (r5 = toPropertyKey(r5)) in e5 ? Object.defineProperty(e5, r5, {
      value: t5,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e5[r5] = t5, e5;
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
  function ownKeys(e5, r5) {
    var t5 = Object.keys(e5);
    if (Object.getOwnPropertySymbols) {
      var o5 = Object.getOwnPropertySymbols(e5);
      r5 && (o5 = o5.filter(function(r6) {
        return Object.getOwnPropertyDescriptor(e5, r6).enumerable;
      })), t5.push.apply(t5, o5);
    }
    return t5;
  }
  function _objectSpread(e5) {
    for (var r5 = 1; r5 < arguments.length; r5++) {
      var t5 = null != arguments[r5] ? arguments[r5] : {};
      r5 % 2 ? ownKeys(Object(t5), true).forEach(function(r6) {
        _defineProperty(e5, r6, t5[r6]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e5, Object.getOwnPropertyDescriptors(t5)) : ownKeys(Object(t5)).forEach(function(r6) {
        Object.defineProperty(e5, r6, Object.getOwnPropertyDescriptor(t5, r6));
      });
    }
    return e5;
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
  function _arrayWithoutHoles(r5) {
    if (Array.isArray(r5)) return _arrayLikeToArray(r5);
  }
  var init_arrayWithoutHoles = __esm({
    "../node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js"() {
      init_arrayLikeToArray();
    }
  });

  // ../node_modules/@babel/runtime/helpers/esm/iterableToArray.js
  function _iterableToArray(r5) {
    if ("undefined" != typeof Symbol && null != r5[Symbol.iterator] || null != r5["@@iterator"]) return Array.from(r5);
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
  function _toConsumableArray(r5) {
    return _arrayWithoutHoles(r5) || _iterableToArray(r5) || _unsupportedIterableToArray(r5) || _nonIterableSpread();
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
  function once(fn2) {
    var cache = null;
    return function wrapped() {
      if (!cache) {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        var result = fn2.apply(this, args);
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
      rafSchd = function rafSchd2(fn2) {
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
            fn2.apply(void 0, lastArgs);
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
      scheduleOnDrag = raf_schd_esm_default(function(fn2) {
        return fn2();
      });
      dragStart = /* @__PURE__ */ function() {
        var scheduled = null;
        function schedule(fn2) {
          var frameId = requestAnimationFrame(function() {
            scheduled = null;
            fn2();
          });
          scheduled = {
            frameId,
            fn: fn2
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
    for (var i6 = 0; i6 < current.length; i6++) {
      if (current[i6].element !== next[i6].element) {
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
      fns.forEach(function(fn2) {
        return fn2();
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
  function ownKeys2(e5, r5) {
    var t5 = Object.keys(e5);
    if (Object.getOwnPropertySymbols) {
      var o5 = Object.getOwnPropertySymbols(e5);
      r5 && (o5 = o5.filter(function(r6) {
        return Object.getOwnPropertyDescriptor(e5, r6).enumerable;
      })), t5.push.apply(t5, o5);
    }
    return t5;
  }
  function _objectSpread2(e5) {
    for (var r5 = 1; r5 < arguments.length; r5++) {
      var t5 = null != arguments[r5] ? arguments[r5] : {};
      r5 % 2 ? ownKeys2(Object(t5), true).forEach(function(r6) {
        _defineProperty(e5, r6, t5[r6]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e5, Object.getOwnPropertyDescriptors(t5)) : ownKeys2(Object(t5)).forEach(function(r6) {
        Object.defineProperty(e5, r6, Object.getOwnPropertyDescriptor(t5, r6));
      });
    }
    return e5;
  }
  function _createForOfIteratorHelper(r5, e5) {
    var t5 = "undefined" != typeof Symbol && r5[Symbol.iterator] || r5["@@iterator"];
    if (!t5) {
      if (Array.isArray(r5) || (t5 = _unsupportedIterableToArray2(r5)) || e5 && r5 && "number" == typeof r5.length) {
        t5 && (r5 = t5);
        var _n = 0, F5 = function F6() {
        };
        return { s: F5, n: function n4() {
          return _n >= r5.length ? { done: true } : { done: false, value: r5[_n++] };
        }, e: function e6(r6) {
          throw r6;
        }, f: F5 };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o5, a5 = true, u5 = false;
    return { s: function s6() {
      t5 = t5.call(r5);
    }, n: function n4() {
      var r6 = t5.next();
      return a5 = r6.done, r6;
    }, e: function e6(r6) {
      u5 = true, o5 = r6;
    }, f: function f5() {
      try {
        a5 || null == t5.return || t5.return();
      } finally {
        if (u5) throw o5;
      }
    } };
  }
  function _unsupportedIterableToArray2(r5, a5) {
    if (r5) {
      if ("string" == typeof r5) return _arrayLikeToArray2(r5, a5);
      var t5 = {}.toString.call(r5).slice(8, -1);
      return "Object" === t5 && r5.constructor && (t5 = r5.constructor.name), "Map" === t5 || "Set" === t5 ? Array.from(r5) : "Arguments" === t5 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t5) ? _arrayLikeToArray2(r5, a5) : void 0;
    }
  }
  function _arrayLikeToArray2(r5, a5) {
    (null == a5 || a5 > r5.length) && (a5 = r5.length);
    for (var e5 = 0, n4 = Array(a5); e5 < a5; e5++) n4[e5] = r5[e5];
    return n4;
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
  function _createForOfIteratorHelper2(r5, e5) {
    var t5 = "undefined" != typeof Symbol && r5[Symbol.iterator] || r5["@@iterator"];
    if (!t5) {
      if (Array.isArray(r5) || (t5 = _unsupportedIterableToArray3(r5)) || e5 && r5 && "number" == typeof r5.length) {
        t5 && (r5 = t5);
        var _n = 0, F5 = function F6() {
        };
        return { s: F5, n: function n4() {
          return _n >= r5.length ? { done: true } : { done: false, value: r5[_n++] };
        }, e: function e6(r6) {
          throw r6;
        }, f: F5 };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o5, a5 = true, u5 = false;
    return { s: function s6() {
      t5 = t5.call(r5);
    }, n: function n4() {
      var r6 = t5.next();
      return a5 = r6.done, r6;
    }, e: function e6(r6) {
      u5 = true, o5 = r6;
    }, f: function f5() {
      try {
        a5 || null == t5.return || t5.return();
      } finally {
        if (u5) throw o5;
      }
    } };
  }
  function _unsupportedIterableToArray3(r5, a5) {
    if (r5) {
      if ("string" == typeof r5) return _arrayLikeToArray3(r5, a5);
      var t5 = {}.toString.call(r5).slice(8, -1);
      return "Object" === t5 && r5.constructor && (t5 = r5.constructor.name), "Map" === t5 || "Set" === t5 ? Array.from(r5) : "Arguments" === t5 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t5) ? _arrayLikeToArray3(r5, a5) : void 0;
    }
  }
  function _arrayLikeToArray3(r5, a5) {
    (null == a5 || a5 > r5.length) && (a5 = r5.length);
    for (var e5 = 0, n4 = Array(a5); e5 < a5; e5++) n4[e5] = r5[e5];
    return n4;
  }
  function ownKeys3(e5, r5) {
    var t5 = Object.keys(e5);
    if (Object.getOwnPropertySymbols) {
      var o5 = Object.getOwnPropertySymbols(e5);
      r5 && (o5 = o5.filter(function(r6) {
        return Object.getOwnPropertyDescriptor(e5, r6).enumerable;
      })), t5.push.apply(t5, o5);
    }
    return t5;
  }
  function _objectSpread3(e5) {
    for (var r5 = 1; r5 < arguments.length; r5++) {
      var t5 = null != arguments[r5] ? arguments[r5] : {};
      r5 % 2 ? ownKeys3(Object(t5), true).forEach(function(r6) {
        _defineProperty(e5, r6, t5[r6]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e5, Object.getOwnPropertyDescriptors(t5)) : ownKeys3(Object(t5)).forEach(function(r6) {
        Object.defineProperty(e5, r6, Object.getOwnPropertyDescriptor(t5, r6));
      });
    }
    return e5;
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
  function ownKeys4(e5, r5) {
    var t5 = Object.keys(e5);
    if (Object.getOwnPropertySymbols) {
      var o5 = Object.getOwnPropertySymbols(e5);
      r5 && (o5 = o5.filter(function(r6) {
        return Object.getOwnPropertyDescriptor(e5, r6).enumerable;
      })), t5.push.apply(t5, o5);
    }
    return t5;
  }
  function _objectSpread4(e5) {
    for (var r5 = 1; r5 < arguments.length; r5++) {
      var t5 = null != arguments[r5] ? arguments[r5] : {};
      r5 % 2 ? ownKeys4(Object(t5), true).forEach(function(r6) {
        _defineProperty(e5, r6, t5[r6]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e5, Object.getOwnPropertyDescriptors(t5)) : ownKeys4(Object(t5)).forEach(function(r6) {
        Object.defineProperty(e5, r6, Object.getOwnPropertyDescriptor(t5, r6));
      });
    }
    return e5;
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
    var addClosestEdge = (_entries$sort$0$edge = (_entries$sort$ = entries4.sort(function(a5, b5) {
      return a5.value - b5.value;
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

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/element/custom-native-drag-preview/set-custom-native-drag-preview.js
  function defaultOffset() {
    return {
      x: 0,
      y: 0
    };
  }
  function setCustomNativeDragPreview(_ref) {
    var render = _ref.render, nativeSetDragImage = _ref.nativeSetDragImage, _ref$getOffset = _ref.getOffset, getOffset = _ref$getOffset === void 0 ? defaultOffset : _ref$getOffset;
    var container = document.createElement("div");
    Object.assign(container.style, {
      // Ensuring we don't cause reflow when adding the element to the page
      // Using `position:fixed` rather than `position:absolute` so we are
      // positioned on the current viewport.
      // `position:fixed` also creates a new stacking context, so we don't need to do that here
      position: "fixed",
      // According to `mdn`, the element can be offscreen:
      // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setDragImage#imgelement
      //
      // However, that  information does not appear in the specs:
      // https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-setdragimage-dev
      //
      // If the element is _completely_ offscreen, Safari@17.1 will cancel the drag
      top: 0,
      left: 0,
      // Using maximum possible z-index so that this element will always be on top
      // https://stackoverflow.com/questions/491052/minimum-and-maximum-value-of-z-index
      // Did not use `layers` in `@atlaskit/theme` because:
      // 1. This element is not a 'layer' in the conventional sense, as this element
      //    is only created for a single frame for the browser to take a photo of it,
      //    and then it is destroyed
      // 2. Did not want to add a dependency onto `@atlaskit/theme`
      // 3. Want to always be on top of product UI which might have higher z-index's
      zIndex: maxZIndex,
      // Avoiding any additional events caused by the new element (being super safe)
      pointerEvents: "none"
    });
    document.body.append(container);
    var unmount = render({
      container
    });
    queueMicrotask(function() {
      var previewOffset = getOffset({
        container
      });
      if (isSafari()) {
        var rect = container.getBoundingClientRect();
        if (rect.width === 0) {
          return;
        }
        container.style.left = "-".concat(rect.width - 1e-4, "px");
      }
      nativeSetDragImage === null || nativeSetDragImage === void 0 || nativeSetDragImage(container, previewOffset.x, previewOffset.y);
    });
    function cleanup() {
      unbindMonitor();
      unmount === null || unmount === void 0 || unmount();
      document.body.removeChild(container);
    }
    var unbindMonitor = monitorForElements({
      // Remove portal in the dragstart event so that the user will never see it
      onDragStart: cleanup,
      // Backup: remove portal when the drop finishes (this would be an error case)
      onDrop: cleanup
    });
  }
  var init_set_custom_native_drag_preview = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/element/custom-native-drag-preview/set-custom-native-drag-preview.js"() {
      init_element_adapter();
      init_is_safari();
      init_max_z_index();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/set-custom-native-drag-preview.js
  var init_set_custom_native_drag_preview2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/set-custom-native-drag-preview.js"() {
      init_set_custom_native_drag_preview();
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/element/custom-native-drag-preview/center-under-pointer.js
  var centerUnderPointer;
  var init_center_under_pointer = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/element/custom-native-drag-preview/center-under-pointer.js"() {
      centerUnderPointer = function centerUnderPointer2(_ref) {
        var container = _ref.container;
        var rect = container.getBoundingClientRect();
        return {
          x: rect.width / 2,
          y: rect.height / 2
        };
      };
    }
  });

  // ../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/center-under-pointer.js
  var init_center_under_pointer2 = __esm({
    "../node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/center-under-pointer.js"() {
      init_center_under_pointer();
    }
  });

  // pages/new-tab/app/favorites/components/PragmaticDND.js
  function PragmaticDND({ children, items, itemsDidReOrder }) {
    const [instanceId] = h2(getInstanceId);
    useGridState(items, itemsDidReOrder, instanceId);
    return /* @__PURE__ */ g(InstanceIdContext.Provider, { value: instanceId }, children);
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
            const destinationId = target.data.id;
            const startId = source.data.id;
            if (typeof startId !== "string") {
              return console.warn("could not access startId");
            }
            if (typeof destinationSrc !== "string") {
              return console.warn("could not access the destinationSrc");
            }
            const startIndex = favorites2.findIndex((item) => item.id === startId);
            let indexOfTarget = favorites2.findIndex((item) => item.id === destinationId);
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
  function useItemState(url5, id, opts) {
    const instanceId = x2(InstanceIdContext);
    const ref = A2(null);
    const [state, setState] = h2(
      /** @type {DNDState} */
      { type: "idle" }
    );
    y2(() => {
      const el = ref.current;
      if (!el) throw new Error("unreachable");
      let draggableCleanup = () => {
      };
      if (opts.kind === "draggable") {
        draggableCleanup = draggable({
          element: el,
          getInitialData: () => ({ type: "grid-item", url: url5, id, instanceId }),
          getInitialDataForExternal: () => ({
            "text/plain": url5,
            [DDG_MIME_TYPE]: id
          }),
          onDragStart: () => setState({ type: "dragging" }),
          onDrop: () => setState({ type: "idle" }),
          onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
            setCustomNativeDragPreview({
              getOffset: ({ container }) => centerUnderPointer({ container }),
              render: ({ container }) => {
                const clone = (
                  /** @type {HTMLElement} */
                  source.element.cloneNode(true)
                );
                const outer = document.createElement("div");
                outer.classList.add(opts.class ?? "");
                outer.dataset.theme = opts.theme;
                outer.appendChild(clone);
                container.appendChild(outer);
                return () => {
                  container.removeChild(outer);
                };
              },
              nativeSetDragImage
            });
          }
        });
      }
      return combine(
        draggableCleanup,
        dropTargetForExternal({
          element: el,
          canDrop: ({ source }) => {
            return source.types.some((type) => type === "text/html");
          },
          getData: ({ input }) => {
            return attachClosestEdge(
              { url: url5, id },
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
          onDrag: ({ self: self2 }) => {
            const closestEdge = extractClosestEdge(self2.data);
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
              { url: url5, id },
              {
                element: el,
                input,
                allowedEdges: ["left", "right"]
              }
            );
          },
          getIsSticky: () => false,
          canDrop: ({ source }) => {
            return source.data.instanceId === instanceId && source.data.type === "grid-item" && source.data.id !== id;
          },
          onDragEnter: ({ self: self2 }) => {
            const closestEdge = extractClosestEdge(self2.data);
            setState({ type: "is-dragging-over", closestEdge });
          },
          onDrag({ self: self2 }) {
            const closestEdge = extractClosestEdge(self2.data);
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
    }, [instanceId, url5, id, opts.kind, opts.class, opts.theme]);
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
      init_constants2();
      init_set_custom_native_drag_preview2();
      init_center_under_pointer2();
      InstanceIdContext = J(getInstanceId());
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

  // pages/new-tab/app/dropzone.js
  function useGlobalDropzone() {
    y2(() => {
      let safezones = [];
      const controller = new AbortController();
      window.addEventListener(
        REGISTER_EVENT,
        (e5) => {
          if (isValidEvent(e5)) {
            safezones.push(e5.detail.dropzone);
          }
        },
        { signal: controller.signal }
      );
      window.addEventListener(
        CLEAR_EVENT,
        (e5) => {
          if (isValidEvent(e5)) {
            const match = safezones.findIndex((x5) => x5 === e5.detail.dropzone);
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
          $INTEGRATION: (() => {
            if (window.__playwright_01) {
              preventDrop = false;
            }
          })();
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

  // pages/new-tab/app/favorites/components/Tile.js
  function Placeholder() {
    const id = g2();
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`, { kind: "target" });
    return /* @__PURE__ */ g("div", { class: Tile_default.item, ref, "data-edge": "closestEdge" in state && state.closestEdge }, /* @__PURE__ */ g("div", { class: (0, import_classnames8.default)(Tile_default.icon, Tile_default.placeholder) }, "\xA0"), state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ g("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null);
  }
  function PlusIconWrapper({ onClick }) {
    const id = g2();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import('../strings.json')} */
      {}
    );
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`, { kind: "target" });
    return /* @__PURE__ */ g("div", { class: Tile_default.item, ref, "data-edge": "closestEdge" in state && state.closestEdge }, /* @__PURE__ */ g("button", { class: (0, import_classnames8.default)(Tile_default.icon, Tile_default.plus, Tile_default.draggable), "aria-labelledby": id, onClick }, /* @__PURE__ */ g(PlusIcon, null)), /* @__PURE__ */ g("div", { class: Tile_default.text, id }, t5("favorites_add")), state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ g("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null);
  }
  var import_classnames8, Tile, PlusIconMemo;
  var init_Tile2 = __esm({
    "pages/new-tab/app/favorites/components/Tile.js"() {
      "use strict";
      init_preact_module();
      import_classnames8 = __toESM(require_classnames(), 1);
      init_hooks_module();
      init_compat_module();
      init_Tile();
      init_constants2();
      init_PragmaticDND();
      init_types();
      init_Icons2();
      init_ImageWithState();
      Tile = M2(
        /**
         * @param {object} props
         * @param {Favorite['url']} props.url
         * @param {Favorite['etldPlusOne']} props.etldPlusOne
         * @param {Favorite['id']} props.id
         * @param {Favorite['title']} props.title
         * @param {string|null|undefined} props.faviconSrc
         * @param {number|null|undefined} props.faviconMax
         * @param {Document['visibilityState']} props.visibility - whether this item is actually visible on screen, or not
         * @param {"dark"|"light"} props.theme
         * @param {number} props.index
         * @param {boolean} props.animateItems
         */
        function Tile2({ url: url5, etldPlusOne, faviconSrc, faviconMax, theme, index, title, id, visibility, animateItems }) {
          const { state, ref } = useItemState(url5, id, {
            kind: "draggable",
            class: Tile_default.preview,
            theme
          });
          const tileId = g2();
          return /* @__PURE__ */ g(
            "a",
            {
              class: Tile_default.item,
              tabindex: 0,
              href: url5,
              "data-id": id,
              "data-index": index,
              "data-edge": "closestEdge" in state && state.closestEdge,
              "aria-labelledby": tileId,
              style: animateItems ? { viewTransitionName: `Tile-${id}` } : void 0,
              ref
            },
            /* @__PURE__ */ g("div", { class: (0, import_classnames8.default)(Tile_default.icon, Tile_default.draggable) }, visibility === "visible" && /* @__PURE__ */ g(
              ImageWithState,
              {
                faviconSrc,
                faviconMax: faviconMax || DDG_DEFAULT_ICON_SIZE,
                title,
                theme,
                etldPlusOne,
                displayKind: "favorite-tile"
              }
            )),
            /* @__PURE__ */ g("div", { class: Tile_default.text, id: tileId }, title),
            state.type === "is-dragging-over" && state.closestEdge ? /* @__PURE__ */ g("div", { class: Tile_default.dropper, "data-edge": state.closestEdge }) : null
          );
        }
      );
      PlusIconMemo = M2(PlusIconWrapper);
    }
  });

  // pages/new-tab/app/favorites/components/TileRow.js
  var TileRow;
  var init_TileRow = __esm({
    "pages/new-tab/app/favorites/components/TileRow.js"() {
      "use strict";
      init_Favorites();
      init_Tile2();
      init_preact_module();
      init_compat_module();
      init_Favorites2();
      init_hooks_module();
      TileRow = M2(
        /**
         * Represents a row of tiles with optional placeholders to fill empty spaces in the first row.
         * @param {object} props - An object containing parameters for the TileRow_ function.
         * @param {number} props.topOffset - The top offset position of the row (relative to the container)
         * @param {Favorite[]} props.items - An array of favorites to be displayed as tiles in the row.
         * @param {Document['visibilityState']} props.visibility - whether this item is actually visible
         * @param {() => void} props.add - A function to be called when a new item is added to the row.
         */
        function TileRow2({ topOffset, items, add, visibility }) {
          const fillers = ROW_CAPACITY - items.length;
          const { theme, animateItems } = x2(FavoritesThemeContext);
          return /* @__PURE__ */ g("ul", { className: Favorites_default.gridRow, style: { transform: `translateY(${topOffset}px)` } }, items.map((item, index) => {
            return /* @__PURE__ */ g(
              Tile,
              {
                url: item.url,
                etldPlusOne: item.etldPlusOne,
                faviconSrc: item.favicon?.src,
                faviconMax: item.favicon?.maxAvailableSize,
                title: item.title,
                key: item.id + item.favicon?.src + item.favicon?.maxAvailableSize + visibility,
                id: item.id,
                index,
                visibility,
                theme,
                animateItems: animateItems.value
              }
            );
          }), fillers > 0 && Array.from({ length: fillers }).map((_6, fillerIndex) => {
            if (fillerIndex === 0) {
              return /* @__PURE__ */ g(PlusIconMemo, { key: `placeholder-plus-${items.length}`, onClick: add });
            }
            return /* @__PURE__ */ g(Placeholder, { key: `placeholder-${items.length}` });
          }));
        }
      );
    }
  });

  // pages/new-tab/app/favorites/components/Favorites.js
  function Favorites({ gridRef, favorites: favorites2, expansion, toggle, openContextMenu, openFavorite, add, canAnimateItems }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import('../strings.json')} */
      {}
    );
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    const hiddenCount = expansion === "collapsed" ? favorites2.length - ROW_CAPACITY : 0;
    const rowHeight = ITEM_HEIGHT + ROW_GAP;
    const canToggleExpansion = favorites2.length >= ROW_CAPACITY;
    const { data } = x2(CustomizerContext);
    const { main } = x2(CustomizerThemesContext);
    const kind = useComputed(() => data.value.background.kind);
    const animateItems = useComputed(() => {
      return canAnimateItems && kind.value !== "userImage";
    });
    return /* @__PURE__ */ g(FavoritesThemeContext.Provider, { value: { theme: main.value, animateItems } }, /* @__PURE__ */ g(
      "div",
      {
        class: (0, import_classnames9.default)(Favorites_default.root, !canToggleExpansion && Favorites_default.noExpansionBtn),
        "data-testid": "FavoritesConfigured",
        "data-background-kind": kind
      },
      /* @__PURE__ */ g(
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
      ),
      canToggleExpansion && /* @__PURE__ */ g(
        "div",
        {
          className: (0, import_classnames9.default)({
            [Favorites_default.showhide]: true,
            [Favorites_default.showhideVisible]: canToggleExpansion
          })
        },
        /* @__PURE__ */ g(
          ShowHideButton,
          {
            buttonAttrs: {
              "aria-expanded": expansion === "expanded",
              "aria-pressed": expansion === "expanded",
              "aria-controls": WIDGET_ID,
              id: TOGGLE_ID
            },
            text: expansion === "expanded" ? t5("favorites_show_less") : t5("favorites_show_more", { count: String(hiddenCount) }),
            onClick: toggle
          }
        )
      )
    ));
  }
  function VirtualizedGridRows({ WIDGET_ID, rowHeight, favorites: favorites2, expansion, openFavorite, openContextMenu, add }) {
    const platformName = usePlatformName();
    const rows = T2(() => {
      const chunked = [];
      let inner = [];
      for (let i6 = 0; i6 < favorites2.length; i6++) {
        inner.push(favorites2[i6]);
        if (inner.length === ROW_CAPACITY) {
          chunked.push(inner.slice());
          inner = [];
        }
        if (i6 === favorites2.length - 1) {
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
    const clickHandler = getOnClickHandler(openFavorite, platformName);
    useOnMiddleClick(safeAreaRef, clickHandler);
    return /* @__PURE__ */ g(
      "div",
      {
        className: Favorites_default.grid,
        style: { height: containerHeight + "px" },
        id: WIDGET_ID,
        ref: safeAreaRef,
        onContextMenu: getContextMenuHandler(openContextMenu),
        onClick: clickHandler
      },
      rows.length === 0 && /* @__PURE__ */ g(TileRow, { key: "empty-rows", items: [], topOffset: 0, add, visibility: "visible" }),
      rows.length > 0 && /* @__PURE__ */ g(Inner, { rows, safeAreaRef, rowHeight, add })
    );
  }
  function Inner({ rows, safeAreaRef, rowHeight, add }) {
    const { onConfigChanged, state } = x2(FavoritesContext);
    const [expansion, setExpansion] = h2(state.config?.expansion || "collapsed");
    const documentVisibility = useDocumentVisibility();
    const { start: start2, end } = useVisibleRows(rows, rowHeight, safeAreaRef);
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
    const subsetOfRowsToRender = expansion === "collapsed" ? [rows[0]] : rows.slice(start2, end + 1);
    return /* @__PURE__ */ g(k, null, subsetOfRowsToRender.map((items, rowIndex) => {
      const topOffset = expansion === "expanded" ? (start2 + rowIndex) * rowHeight : 0;
      const keyed = `-${start2 + rowIndex}-`;
      return /* @__PURE__ */ g(TileRow, { key: keyed, items, topOffset, add, visibility: documentVisibility });
    }));
  }
  function useVisibleRows(rows, rowHeight, safeAreaRef) {
    const [{ start: start2, end }, setVisibleRange] = h2({ start: 0, end: 1 });
    const gridOffsetRef = A2(0);
    const mainScrollerRef = A2(
      /** @type {Element|null} */
      null
    );
    const contentTubeRef = A2(
      /** @type {Element|null} */
      null
    );
    function updateGlobals() {
      if (!safeAreaRef.current) return;
      const rec = safeAreaRef.current.getBoundingClientRect();
      gridOffsetRef.current = rec.y + mainScrollerRef.current?.scrollTop;
    }
    function setVisibleRowsForOffset() {
      if (!safeAreaRef.current) return console.warn("cannot access ref");
      const scrollY = mainScrollerRef.current?.scrollTop ?? 0;
      const offset = gridOffsetRef.current;
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
    _2(() => {
      mainScrollerRef.current = document.querySelector("[data-main-scroller]") || document.documentElement;
      contentTubeRef.current = document.querySelector("[data-content-tube]") || document.body;
      if (!contentTubeRef.current || !mainScrollerRef.current) console.warn("missing elements");
      updateGlobals();
      setVisibleRowsForOffset();
      const controller = new AbortController();
      mainScrollerRef.current?.addEventListener("scroll", setVisibleRowsForOffset, { signal: controller.signal });
      return () => {
        controller.abort();
      };
    }, [rows.length]);
    y2(() => {
      let lastWindowHeight = window.innerHeight;
      function handler() {
        if (lastWindowHeight === window.innerHeight) return;
        lastWindowHeight = window.innerHeight;
        updateGlobals();
        setVisibleRowsForOffset();
      }
      window.addEventListener("resize", handler);
      return () => {
        return window.removeEventListener("resize", handler);
      };
    }, []);
    y2(() => {
      if (!contentTubeRef.current) return console.warn("cannot find content tube");
      let lastHeight;
      let debounceTimer;
      const resizer = new ResizeObserver((entries4) => {
        const first = entries4[0];
        if (!first || !first.contentRect) return;
        if (first.contentRect.height !== lastHeight) {
          lastHeight = first.contentRect.height;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            updateGlobals();
            setVisibleRowsForOffset();
          }, 50);
        }
      });
      resizer.observe(contentTubeRef.current);
      return () => {
        resizer.disconnect();
        clearTimeout(debounceTimer);
      };
    }, []);
    return { start: start2, end };
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
      const target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      if (!target) return;
      const anchor = (
        /** @type {HTMLAnchorElement|null} */
        target.closest("a[href][data-id]")
      );
      if (anchor && anchor.dataset.id) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const openTarget = eventToTarget(event, platformName);
        return openFavorite(anchor.dataset.id, anchor.href, openTarget);
      }
    };
  }
  var import_classnames9, FavoritesMemo, ROW_CAPACITY, ITEM_HEIGHT, ROW_GAP, FavoritesThemeContext;
  var init_Favorites2 = __esm({
    "pages/new-tab/app/favorites/components/Favorites.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_compat_module();
      import_classnames9 = __toESM(require_classnames(), 1);
      init_Favorites();
      init_ShowHideButton();
      init_types();
      init_settings_provider();
      init_dropzone();
      init_TileRow();
      init_FavoritesProvider();
      init_CustomizerProvider();
      init_signals_module();
      init_utils2();
      FavoritesMemo = M2(Favorites);
      ROW_CAPACITY = 6;
      ITEM_HEIGHT = 96;
      ROW_GAP = 8;
      FavoritesThemeContext = J({
        theme: (
          /** @type {"light"|"dark"} */
          "light"
        ),
        animateItems: d3(false)
      });
    }
  });

  // pages/new-tab/app/favorites/components/FavoritesCustomized.js
  function FavoritesConsumer() {
    const { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add } = x2(FavoritesContext);
    const telemetry2 = useTelemetry();
    const { data: backgroundData } = x2(CustomizerContext);
    function didReorder(data) {
      const background = backgroundData.value.background;
      const supportsViewTransitions = state.config?.animation?.kind === "view-transitions" && background.kind !== "userImage";
      if (supportsViewTransitions) {
        viewTransition(() => {
          favoritesDidReOrder(data);
        });
      } else {
        favoritesDidReOrder(data);
      }
    }
    if (state.status === "ready") {
      telemetry2.measureFromPageLoad("favorites-will-render", "time to favorites");
      return /* @__PURE__ */ g(PragmaticDND, { items: state.data.favorites, itemsDidReOrder: didReorder }, /* @__PURE__ */ g(
        FavoritesMemo,
        {
          favorites: state.data.favorites,
          expansion: state.config.expansion,
          canAnimateItems: state.config?.animation?.kind === "view-transitions",
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
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const { id, visibility, toggle, index } = useVisibility();
    const title = t5("favorites_menu_title");
    useCustomizer({ title, id, icon: "star", toggle, visibility: visibility.value, index });
    if (visibility.value === "hidden") {
      return null;
    }
    return /* @__PURE__ */ g(FavoritesProvider, null, /* @__PURE__ */ g(FavoritesConsumer, null));
  }
  var init_FavoritesCustomized = __esm({
    "pages/new-tab/app/favorites/components/FavoritesCustomized.js"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_types();
      init_widget_config_provider();
      init_CustomizerMenu();
      init_FavoritesProvider();
      init_PragmaticDND();
      init_Favorites2();
      init_utils2();
      init_CustomizerProvider();
    }
  });

  // pages/new-tab/app/entry-points/favorites.js
  var favorites_exports = {};
  __export(favorites_exports, {
    factory: () => factory2
  });
  function factory2() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "favorites" }, /* @__PURE__ */ g(FavoritesCustomized, null));
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
    return /* @__PURE__ */ g(
      "button",
      {
        className: (0, import_classnames10.default)(Button_default.button, { [Button_default[`${variant}`]]: !!variant }, className),
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
  var import_classnames10;
  var init_Button2 = __esm({
    "shared/components/Button/Button.js"() {
      "use strict";
      init_preact_module();
      import_classnames10 = __toESM(require_classnames(), 1);
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
  function DismissButton({ className, onClick, buttonProps = {} }) {
    const { t: t5 } = useTypedTranslation();
    return /* @__PURE__ */ g("button", { class: (0, import_classnames11.default)(DismissButton_default.btn, className), onClick, "aria-label": t5("ntp_dismiss"), "data-testid": "dismissBtn", ...buttonProps }, /* @__PURE__ */ g(Cross, null));
  }
  var import_classnames11;
  var init_DismissButton2 = __esm({
    "pages/new-tab/app/components/DismissButton.jsx"() {
      "use strict";
      init_preact_module();
      import_classnames11 = __toESM(require_classnames(), 1);
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
    const service = useService4();
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
    return /* @__PURE__ */ g(FreemiumPIRBannerContext.Provider, { value: { state, dismiss, action } }, /* @__PURE__ */ g(FreemiumPIRBannerDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService4() {
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
      FreemiumPIRBannerContext = J({
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
      FreemiumPIRBannerDispatchContext = J(
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
    return String(str).replace(/[&"'<>/]/g, (m5) => replacements[m5]);
  }
  var init_freemiumPIRBanner_utils = __esm({
    "pages/new-tab/app/freemium-pir-banner/freemiumPIRBanner.utils.js"() {
      "use strict";
    }
  });

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.js
  function FreemiumPIRBanner({ message, action, dismiss }) {
    const processedMessageDescription = convertMarkdownToHTMLForStrongTags(message.descriptionText);
    return /* @__PURE__ */ g("div", { id: message.id, class: (0, import_classnames12.default)(FreemiumPIRBanner_default.root, FreemiumPIRBanner_default.icon) }, /* @__PURE__ */ g("span", { class: FreemiumPIRBanner_default.iconBlock }, /* @__PURE__ */ g("img", { src: `./icons/Information-Remover-96.svg`, alt: "" })), /* @__PURE__ */ g("div", { class: FreemiumPIRBanner_default.content }, message.titleText && /* @__PURE__ */ g("h2", { class: FreemiumPIRBanner_default.title }, message.titleText), /* @__PURE__ */ g("p", { class: FreemiumPIRBanner_default.description, dangerouslySetInnerHTML: { __html: processedMessageDescription } })), message.messageType === "big_single_action" && message?.actionText && action && /* @__PURE__ */ g("div", { class: FreemiumPIRBanner_default.btnBlock }, /* @__PURE__ */ g(Button, { variant: "standard", onClick: () => action(message.id) }, message.actionText)), message.id && dismiss && /* @__PURE__ */ g(DismissButton, { className: FreemiumPIRBanner_default.dismissBtn, onClick: () => dismiss(message.id) }));
  }
  function FreemiumPIRBannerConsumer() {
    const { state, action, dismiss } = x2(FreemiumPIRBannerContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ g(FreemiumPIRBanner, { message: state.data.content, action, dismiss });
    }
    return null;
  }
  var import_classnames12;
  var init_FreemiumPIRBanner2 = __esm({
    "pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.js"() {
      "use strict";
      import_classnames12 = __toESM(require_classnames(), 1);
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
    factory: () => factory3
  });
  function factory3() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "freemiumPIRBanner" }, /* @__PURE__ */ g(FreemiumPIRBannerProvider, null, /* @__PURE__ */ g(FreemiumPIRBannerConsumer, null)));
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
    const service = useService5();
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
    return /* @__PURE__ */ g(NextStepsContext.Provider, { value: { state, toggle, action, dismiss } }, /* @__PURE__ */ g(NextStepsDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService5() {
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
      NextStepsContext = J({
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
      NextStepsDispatchContext = J(
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
        bringStuff: (t5) => ({
          id: "bringStuff",
          icon: "Bring-Stuff",
          title: t5("nextSteps_bringStuff_title"),
          summary: t5("nextSteps_bringStuff_summary"),
          actionText: t5("nextSteps_bringStuff_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        defaultApp: (t5) => ({
          id: "defaultApp",
          icon: "Default-App",
          title: t5("nextSteps_defaultApp_title"),
          summary: t5("nextSteps_defaultApp_summary"),
          actionText: t5("nextSteps_defaultApp_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        blockCookies: (t5) => ({
          id: "blockCookies",
          icon: "Cookie-Pops",
          title: t5("nextSteps_blockCookies_title"),
          summary: t5("nextSteps_blockCookies_summary"),
          actionText: t5("nextSteps_blockCookies_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        emailProtection: (t5) => ({
          id: "emailProtection",
          icon: "Email-Protection",
          title: t5("nextSteps_emailProtection_title"),
          summary: t5("nextSteps_emailProtection_summary"),
          actionText: t5("nextSteps_emailProtection_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        duckplayer: (t5) => ({
          id: "duckplayer",
          icon: "Tube-Clean",
          title: t5("nextSteps_duckPlayer_title"),
          summary: t5("nextSteps_duckPlayer_summary"),
          actionText: t5("nextSteps_duckPlayer_actionText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        addAppToDockMac: (t5) => ({
          id: "addAppToDockMac",
          icon: "Dock-Add-Mac",
          title: t5("nextSteps_addAppDockMac_title"),
          summary: t5("nextSteps_addAppDockMac_summary"),
          actionText: t5("nextSteps_addAppDockMac_actionText"),
          confirmationText: t5("nextSteps_addAppDockMac_confirmationText")
        }),
        /** @param {(translationId: keyof enStrings) => string} t */
        pinAppToTaskbarWindows: (t5) => ({
          id: "pinAppToTaskbarWindows",
          icon: "Dock-Add-Windows",
          title: t5("nextSteps_pinAppToTaskbarWindows_title"),
          summary: t5("nextSteps_pinAppToTaskbarWindows_summary"),
          actionText: t5("nextSteps_pinAppToTaskbarWindows_actionText")
        })
      };
      otherText = {
        /** @param {(translationId: keyof ntpStrings) => string} t */
        showMore: (t5) => t5("ntp_show_more"),
        /** @param {(translationId: keyof ntpStrings) => string} t */
        showLess: (t5) => t5("ntp_show_less"),
        /** @param {(translationId: keyof enStrings) => string} t */
        nextSteps_sectionTitle: (t5) => t5("nextSteps_sectionTitle")
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
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const message = variants[type]?.(t5);
    const [showConfirmation, setShowConfirmation] = h2(false);
    const hasConfirmationState = additionalCardStates.hasConfirmationText(type);
    const handleClick = () => {
      if (!hasConfirmationState) {
        return action(message.id);
      }
      action(message.id);
      setShowConfirmation(true);
    };
    return /* @__PURE__ */ g("div", { class: NextSteps_default.card }, /* @__PURE__ */ g("img", { src: `./icons/${message.icon}-128.svg`, alt: "", class: NextSteps_default.icon }), /* @__PURE__ */ g("h3", { class: NextSteps_default.title }, message.title), /* @__PURE__ */ g("p", { class: NextSteps_default.description }, message.summary), hasConfirmationState && !!showConfirmation ? /* @__PURE__ */ g("div", { class: NextSteps_default.confirmation }, /* @__PURE__ */ g(CheckColor, null), /* @__PURE__ */ g("p", null, message.confirmationText)) : /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames13.default)(NextSteps_default.btn, hasConfirmationState && NextSteps_default.supressActiveStateForSwitchToConfirmationText),
        onClick: handleClick
      },
      message.actionText
    ), /* @__PURE__ */ g(DismissButton, { className: NextSteps_default.dismissBtn, onClick: () => dismiss(message.id) }));
  }
  var import_classnames13;
  var init_NextStepsCard = __esm({
    "pages/new-tab/app/next-steps/components/NextStepsCard.js"() {
      "use strict";
      init_preact_module();
      import_classnames13 = __toESM(require_classnames(), 1);
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
    const { t: t5 } = useTypedTranslationWith(
      /** @type {strings} */
      {}
    );
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    const alwaysShown = types.length > 2 ? types.slice(0, 2) : types;
    return /* @__PURE__ */ g("div", { class: (0, import_classnames14.default)(NextSteps_default.cardGroup, types.length <= 2 && NextSteps_default.noExpansionBtn), id: WIDGET_ID }, /* @__PURE__ */ g(NextStepsBubbleHeader, null), /* @__PURE__ */ g("div", { class: NextSteps_default.cardGrid }, alwaysShown.map((type) => /* @__PURE__ */ g(NextStepsCard, { key: type, type, dismiss, action })), expansion === "expanded" && types.length > 2 && types.slice(2).map((type) => /* @__PURE__ */ g(NextStepsCard, { key: type, type, dismiss, action }))), types.length > 2 && /* @__PURE__ */ g(
      "div",
      {
        className: (0, import_classnames14.default)({
          [NextSteps_default.showhide]: types.length > 2,
          [NextSteps_default.showhideVisible]: types.length > 2
        })
      },
      /* @__PURE__ */ g(
        ShowHideButton,
        {
          buttonAttrs: {
            "aria-expanded": expansion === "expanded",
            "aria-pressed": expansion === "expanded",
            "aria-controls": WIDGET_ID,
            id: TOGGLE_ID
          },
          text: expansion === "expanded" ? otherText.showLess(t5) : otherText.showMore(t5),
          onClick: toggle
        }
      )
    ));
  }
  function NextStepsBubbleHeader() {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {strings} */
      {}
    );
    const text = otherText.nextSteps_sectionTitle(t5);
    return /* @__PURE__ */ g("div", { class: NextSteps_default.bubble }, /* @__PURE__ */ g("svg", { xmlns: "http://www.w3.org/2000/svg", width: "12", height: "26", viewBox: "0 0 12 26", fill: "none" }, /* @__PURE__ */ g(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12 0C5.37258 0 0 5.37258 0 12V25.3388C2.56367 22.0873 6.53807 20 11 20H12V0Z",
        fill: "#3969EF"
      }
    )), /* @__PURE__ */ g("div", null, /* @__PURE__ */ g("h2", null, text)), /* @__PURE__ */ g("svg", { xmlns: "http://www.w3.org/2000/svg", width: "10", height: "20", viewBox: "0 0 10 20", fill: "none" }, /* @__PURE__ */ g(
      "path",
      {
        d: "M3.8147e-06 0C1.31322 1.566e-08 2.61358 0.258658 3.82684 0.761205C5.04009 1.26375 6.14249 2.00035 7.07107 2.92893C7.99966 3.85752 8.73625 4.95991 9.2388 6.17317C9.74135 7.38642 10 8.68678 10 10C10 11.3132 9.74135 12.6136 9.2388 13.8268C8.73625 15.0401 7.99966 16.1425 7.07107 17.0711C6.14248 17.9997 5.04009 18.7362 3.82684 19.2388C2.61358 19.7413 1.31322 20 0 20L3.8147e-06 10V0Z",
        fill: "#3969EF"
      }
    )));
  }
  var import_classnames14;
  var init_NextStepsGroup = __esm({
    "pages/new-tab/app/next-steps/components/NextStepsGroup.js"() {
      "use strict";
      init_preact_module();
      import_classnames14 = __toESM(require_classnames(), 1);
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
    return /* @__PURE__ */ g(NextStepsProvider, null, /* @__PURE__ */ g(NextStepsConsumer, null));
  }
  function NextStepsConsumer() {
    const { state, toggle } = x2(NextStepsContext);
    if (state.status === "ready" && state.data.content) {
      const ids = state.data.content.map((x5) => x5.id);
      const { action, dismiss } = x2(NextStepsContext);
      return /* @__PURE__ */ g(NextStepsCardGroup, { types: ids, toggle, expansion: state.config.expansion, action, dismiss });
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
    factory: () => factory4
  });
  function factory4() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "nextSteps" }, /* @__PURE__ */ g(NextStepsCustomized, null));
  }
  var init_nextSteps = __esm({
    "pages/new-tab/app/entry-points/nextSteps.js"() {
      "use strict";
      init_preact_module();
      init_Layout();
      init_NextSteps2();
    }
  });

  // pages/new-tab/app/entry-points/privacyStats.js
  var privacyStats_exports = {};
  __export(privacyStats_exports, {
    factory: () => factory5
  });
  function factory5() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "privacyStats" }, /* @__PURE__ */ g(PrivacyStatsCustomized, null));
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
    const service = useService6();
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
    return /* @__PURE__ */ g(RMFContext.Provider, { value: { state, dismiss, primaryAction, secondaryAction } }, /* @__PURE__ */ g(RMFDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService6() {
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
      RMFContext = J({
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
      RMFDispatchContext = J(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.js
  function RemoteMessagingFramework({ message, primaryAction, secondaryAction, dismiss }) {
    const { id, messageType, titleText, descriptionText } = message;
    const platform = usePlatformName();
    return /* @__PURE__ */ g("div", { id, class: (0, import_classnames15.default)(RemoteMessagingFramework_default.root, messageType !== "small" && message.icon && RemoteMessagingFramework_default.icon) }, messageType !== "small" && message.icon && /* @__PURE__ */ g("span", { class: RemoteMessagingFramework_default.iconBlock }, /* @__PURE__ */ g("img", { src: `./icons/${message.icon}.svg`, alt: "" })), /* @__PURE__ */ g("div", { class: RemoteMessagingFramework_default.content }, /* @__PURE__ */ g("h2", { class: RemoteMessagingFramework_default.title }, titleText), /* @__PURE__ */ g("p", { class: RemoteMessagingFramework_default.description }, descriptionText), messageType === "big_two_action" && /* @__PURE__ */ g("div", { class: RemoteMessagingFramework_default.btnRow }, platform === "windows" ? /* @__PURE__ */ g(k, null, primaryAction && message.primaryActionText.length > 0 && /* @__PURE__ */ g(Button, { variant: "accentBrand", onClick: () => primaryAction(id) }, message.primaryActionText), secondaryAction && message.secondaryActionText.length > 0 && /* @__PURE__ */ g(Button, { variant: "standard", onClick: () => secondaryAction(id) }, message.secondaryActionText)) : /* @__PURE__ */ g(k, null, secondaryAction && message.secondaryActionText.length > 0 && /* @__PURE__ */ g(Button, { variant: "standard", onClick: () => secondaryAction(id) }, message.secondaryActionText), primaryAction && message.primaryActionText.length > 0 && /* @__PURE__ */ g(Button, { variant: "accentBrand", onClick: () => primaryAction(id) }, message.primaryActionText)))), messageType === "big_single_action" && message.primaryActionText && primaryAction && /* @__PURE__ */ g("div", { class: RemoteMessagingFramework_default.btnBlock }, /* @__PURE__ */ g(Button, { variant: "standard", onClick: () => primaryAction(id) }, message.primaryActionText)), /* @__PURE__ */ g(DismissButton, { className: RemoteMessagingFramework_default.dismissBtn, onClick: () => dismiss(id) }));
  }
  function RMFConsumer() {
    const { state, primaryAction, secondaryAction, dismiss } = x2(RMFContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ g(
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
  var import_classnames15;
  var init_RemoteMessagingFramework2 = __esm({
    "pages/new-tab/app/remote-messaging-framework/components/RemoteMessagingFramework.js"() {
      "use strict";
      init_preact_module();
      import_classnames15 = __toESM(require_classnames(), 1);
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
    factory: () => factory6
  });
  function factory6() {
    return /* @__PURE__ */ g(Centered, { "data-entry-point": "rmf" }, /* @__PURE__ */ g(RMFProvider, null, /* @__PURE__ */ g(RMFConsumer, null)));
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
        title: "UpdateNotification_title",
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
    return /* @__PURE__ */ g(UpdateNotificationWithInitial, { updateNotification }, props.children);
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
    const service = useService7(updateNotification);
    useDataSubscription({ dispatch, service });
    const dismiss = q2(() => {
      service.current?.dismiss();
    }, [service]);
    return /* @__PURE__ */ g(UpdateNotificationContext.Provider, { value: { state, dismiss } }, /* @__PURE__ */ g(UpdateNotificationDispatchContext.Provider, { value: dispatch }, children));
  }
  function useService7(initial) {
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
      UpdateNotificationContext = J({
        /** @type {State} */
        state: { status: "idle", data: null, config: null },
        /** @type {() => void} */
        dismiss: () => {
          throw new Error("must implement dismiss");
        }
      });
      UpdateNotificationDispatchContext = J(
        /** @type {import("preact/hooks").Dispatch<Events>} */
        {}
      );
    }
  });

  // pages/new-tab/app/update-notification/components/UpdateNotification.js
  function UpdateNotification({ notes, dismiss, version }) {
    return /* @__PURE__ */ g("div", { class: UpdateNotification_default.root, "data-reset-layout": "true" }, /* @__PURE__ */ g("div", { class: (0, import_classnames16.default)("layout-centered", UpdateNotification_default.body) }, notes.length > 0 ? /* @__PURE__ */ g(WithNotes, { notes, version }) : /* @__PURE__ */ g(WithoutNotes, { version })), /* @__PURE__ */ g(DismissButton, { onClick: dismiss, className: UpdateNotification_default.dismiss }));
  }
  function WithNotes({ notes, version }) {
    const id = g2();
    const ref = A2(
      /** @type {HTMLDetailsElement|null} */
      null
    );
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    const inlineLink = /* @__PURE__ */ g(
      Trans,
      {
        str: t5("updateNotification_whats_new"),
        values: {
          a: {
            href: `#${id}`,
            class: UpdateNotification_default.inlineLink,
            click: (e5) => {
              e5.preventDefault();
              if (!ref.current) return;
              ref.current.open = !ref.current.open;
            }
          }
        }
      }
    );
    const chunks = [{ title: "", notes: [] }];
    let index = 0;
    for (const note of notes) {
      const trimmed = note.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("\u2022")) {
        const bullet = trimmed.slice(1).trim();
        chunks[index].notes.push(bullet);
      } else {
        chunks.push({ title: trimmed, notes: [] });
        index += 1;
      }
    }
    return /* @__PURE__ */ g("details", { ref }, /* @__PURE__ */ g("summary", { tabIndex: -1, className: UpdateNotification_default.summary }, t5("updateNotification_updated_version", { version }), " ", inlineLink), /* @__PURE__ */ g("div", { id, class: UpdateNotification_default.detailsContent }, chunks.map((chunk, index2) => {
      return /* @__PURE__ */ g(k, { key: chunk.title + index2 }, chunk.title && /* @__PURE__ */ g("p", { class: UpdateNotification_default.title }, chunk.title), /* @__PURE__ */ g("ul", { class: UpdateNotification_default.list }, chunk.notes.map((note, index3) => {
        return /* @__PURE__ */ g("li", { key: note + index3 }, note);
      })));
    })));
  }
  function WithoutNotes({ version }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {import("../strings.json")} */
      {}
    );
    return /* @__PURE__ */ g("p", null, t5("updateNotification_updated_version", { version }));
  }
  function UpdateNotificationConsumer() {
    const { state, dismiss } = x2(UpdateNotificationContext);
    if (state.status === "ready" && state.data.content) {
      return /* @__PURE__ */ g(UpdateNotification, { notes: state.data.content.notes, version: state.data.content.version, dismiss });
    }
    return null;
  }
  var import_classnames16;
  var init_UpdateNotification2 = __esm({
    "pages/new-tab/app/update-notification/components/UpdateNotification.js"() {
      "use strict";
      init_preact_module();
      import_classnames16 = __toESM(require_classnames(), 1);
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
    factory: () => factory7
  });
  function factory7() {
    return /* @__PURE__ */ g("div", { "data-entry-point": "updateNotification" }, /* @__PURE__ */ g(UpdateNotificationProvider, null, /* @__PURE__ */ g(UpdateNotificationConsumer, null)));
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
  null != (i2 = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : void 0) && i2.__PREACT_DEVTOOLS__ && i2.__PREACT_DEVTOOLS__.attachPreact("10.25.4", l, { Fragment: k, Component: x });

  // pages/new-tab/src/index.js
  init_preact_module();

  // pages/new-tab/app/index.js
  init_preact_module();

  // pages/new-tab/app/components/App.js
  init_preact_module();
  var import_classnames25 = __toESM(require_classnames(), 1);

  // pages/new-tab/app/components/App.module.css
  var App_default = {
    tube: "App_tube",
    layout: "App_layout",
    main: "App_main",
    themeContext: "App_themeContext",
    mainLayout: "App_mainLayout",
    mainScroller: "App_mainScroller",
    content: "App_content",
    aside: "App_aside",
    asideLayout: "App_asideLayout",
    asideContent: "App_asideContent",
    asideScroller: "App_asideScroller",
    paddedError: "App_paddedError",
    paddedErrorRecovery: "App_paddedErrorRecovery"
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
  var ErrorBoundary = class extends x {
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

  // pages/new-tab/app/widget-list/WidgetList.js
  init_Layout();

  // pages/new-tab/app/InlineErrorBoundary.js
  init_preact_module();
  init_types();
  var INLINE_ERROR = "A problem occurred with this feature. DuckDuckGo was notified";
  function InlineErrorBoundary({ children, format, context, fallback }) {
    const messaging2 = useMessaging();
    const didCatch = (message) => {
      const formatted = format?.(message) || message;
      messaging2.reportPageException({ message: formatted });
    };
    const fallbackElement = fallback?.(INLINE_ERROR) || /* @__PURE__ */ g("p", null, INLINE_ERROR);
    return /* @__PURE__ */ g(ErrorBoundary, { context, didCatch: ({ message }) => didCatch(message), fallback: fallbackElement }, children);
  }

  // pages/new-tab/app/telemetry/Debug.js
  init_preact_module();
  init_hooks_module();
  init_types();
  init_CustomizerMenu();

  // pages/new-tab/app/telemetry/telemetry.js
  var _Telemetry = class _Telemetry {
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
  __publicField(_Telemetry, "EVENT_REQUEST", "TELEMETRY_EVENT_REQUEST");
  __publicField(_Telemetry, "EVENT_RESPONSE", "TELEMETRY_EVENT_RESPONSE");
  __publicField(_Telemetry, "EVENT_SUBSCRIPTION", "TELEMETRY_EVENT_SUBSCRIPTION");
  __publicField(_Telemetry, "EVENT_SUBSCRIPTION_DATA", "TELEMETRY_EVENT_SUBSCRIPTION_DATA");
  __publicField(_Telemetry, "EVENT_NOTIFICATION", "TELEMETRY_EVENT_NOTIFICATION");
  __publicField(_Telemetry, "EVENT_BROADCAST", "TELEMETRY_*");
  var Telemetry = _Telemetry;
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
      return this.messaging.request(method, params).then((x5) => {
        const resJson = {
          kind: "response",
          method,
          result: x5,
          timestamp
        };
        this.record(Telemetry.EVENT_RESPONSE, resJson);
        return x5;
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

  // pages/new-tab/app/telemetry/Debug.js
  function DebugCustomized({ index, isOpenInitially = false }) {
    const [isOpen, setOpen] = h2(isOpenInitially);
    const telemetry2 = useTelemetry();
    useCustomizer({
      title: "\u{1F41E} Debug",
      id: "debug",
      icon: "shield",
      visibility: isOpen ? "visible" : "hidden",
      toggle: (_id) => setOpen((prev) => !prev),
      index
    });
    return /* @__PURE__ */ g("div", null, /* @__PURE__ */ g(Debug, { telemetry: telemetry2, isOpen }));
  }
  function Debug({ telemetry: telemetry2, isOpen }) {
    const textRef = A2(null);
    useEvents(textRef, telemetry2);
    return /* @__PURE__ */ g("div", { hidden: !isOpen }, /* @__PURE__ */ g("textarea", { style: { width: "100%" }, rows: 20, ref: textRef }));
  }
  function useEvents(ref, telemetry2) {
    y2(() => {
      if (!ref.current) return;
      const elem = ref.current;
      const pre = "```json\n";
      const post = "\n```\n";
      function handle({ detail }) {
        elem.value += pre + JSON.stringify(detail, null, 2) + post;
      }
      for (const beforeElement of telemetry2.eventStore) {
        elem.value += pre + JSON.stringify(beforeElement, null, 2) + post;
      }
      telemetry2.eventStore = [];
      telemetry2.storeEnabled = false;
      telemetry2.eventTarget.addEventListener(Telemetry.EVENT_BROADCAST, handle);
      return () => {
        telemetry2.eventTarget.removeEventListener(Telemetry.EVENT_BROADCAST, handle);
        telemetry2.storeEnabled = true;
      };
    }, [ref, telemetry2]);
  }

  // pages/new-tab/app/widget-list/WidgetList.js
  init_EnvironmentProvider();

  // import("../entry-points/**/*.js") in pages/new-tab/app/widget-list/WidgetList.js
  var globImport_entry_points_js = __glob({
    "../entry-points/activity.js": () => Promise.resolve().then(() => (init_activity(), activity_exports)),
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
        return null;
      }
    };
  }
  async function widgetEntryPoint(id, didCatch) {
    try {
      const mod = await globImport_entry_points_js(`../entry-points/${id}.js`);
      if (typeof mod.factory !== "function") {
        console.error(`module found for ${id}, but missing 'factory' export`);
        return placeholderWidget(id);
      }
      return mod;
    } catch (e5) {
      console.error(e5);
      didCatch(e5.toString());
      return placeholderWidget(id);
    }
  }
  function WidgetList() {
    const { widgets, widgetConfigItems, entryPoints } = x2(WidgetConfigContext);
    const messaging2 = useMessaging();
    const { env } = useEnv();
    const didCatch = (message, id) => {
      const composed = `Widget '${id}' threw an exception: ` + message;
      messaging2.reportPageException({ message: composed });
    };
    return /* @__PURE__ */ g(k, null, widgets.map((widget, index) => {
      const isUserConfigurable = widgetConfigItems.find((item) => item.id === widget.id);
      const matchingEntryPoint = entryPoints[widget.id];
      if (!isUserConfigurable) {
        return /* @__PURE__ */ g(ErrorBoundary, { key: widget.id, didCatch: ({ message }) => didCatch(message, widget.id), fallback: null }, /* @__PURE__ */ g(WidgetLoader, { fn: matchingEntryPoint.factory }));
      }
      return /* @__PURE__ */ g(WidgetVisibilityProvider, { key: widget.id, id: widget.id, index }, /* @__PURE__ */ g(
        ErrorBoundary,
        {
          key: widget.id,
          didCatch: ({ message }) => didCatch(message, widget.id),
          fallback: /* @__PURE__ */ g(Centered, { "data-entry-point": widget.id }, /* @__PURE__ */ g(VerticalSpace, null, /* @__PURE__ */ g("p", null, INLINE_ERROR), /* @__PURE__ */ g("p", null, "Widget ID: ", widget.id)))
        },
        /* @__PURE__ */ g(WidgetLoader, { fn: matchingEntryPoint.factory })
      ));
    }), env === "development" && /* @__PURE__ */ g(Centered, { "data-entry-point": "debug" }, /* @__PURE__ */ g(DebugCustomized, { index: widgets.length, isOpenInitially: false })));
  }
  function WidgetLoader({ fn: fn2 }) {
    const result = fn2?.();
    return result;
  }

  // pages/new-tab/app/components/App.js
  init_dropzone();
  init_CustomizerMenu();

  // pages/new-tab/app/components/Drawer.js
  init_hooks_module();
  init_signals_module();
  init_EnvironmentProvider();
  init_types();
  var CLOSE_DRAWER_EVENT = "close-drawer";
  var TOGGLE_DRAWER_EVENT = "toggle-drawer";
  var OPEN_DRAWER_EVENT = "open-drawer";
  function useDrawer(initial) {
    const { isReducedMotion } = useEnv();
    const asideRef = A2(
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
      const aside = asideRef.current;
      if (!aside) return;
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
      aside?.addEventListener(
        "transitionend",
        (e5) => {
          if (e5.target !== e5.currentTarget) return;
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
      aside?.addEventListener(
        "transitionstart",
        (e5) => {
          if (e5.target !== e5.currentTarget) return;
          r3(() => {
            animating.value = true;
            displayChildren.value = true;
          });
        },
        { signal: controller.signal }
      );
      return () => {
        controller.abort();
      };
    }, [isReducedMotion, initial]);
    const ntp = useMessaging();
    y2(() => {
      if (initial === "visible") {
        _open();
      }
      return ntp.messaging.subscribe("customizer_autoOpen", () => {
        _open();
      });
    }, [initial, ntp]);
    return {
      buttonRef,
      visibility,
      displayChildren,
      buttonId,
      drawerId,
      hidden,
      animating,
      asideRef
    };
  }
  function _toggle() {
    window.dispatchEvent(new CustomEvent(TOGGLE_DRAWER_EVENT));
  }
  function _open() {
    window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
  }
  function _close() {
    window.dispatchEvent(new CustomEvent(CLOSE_DRAWER_EVENT));
  }
  function useDrawerControls() {
    return {
      toggle: _toggle,
      close: _close,
      open: _open
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
  init_CustomizerProvider();

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  init_preact_module();
  var import_classnames24 = __toESM(require_classnames(), 1);

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.module.css
  var CustomizerDrawerInner_default = {
    root: "CustomizerDrawerInner_root",
    "fade-in": "CustomizerDrawerInner_fade-in",
    sections: "CustomizerDrawerInner_sections",
    header: "CustomizerDrawerInner_header",
    internal: "CustomizerDrawerInner_internal",
    closeBtn: "CustomizerDrawerInner_closeBtn",
    backBtn: "CustomizerDrawerInner_backBtn",
    section: "CustomizerDrawerInner_section",
    borderedSection: "CustomizerDrawerInner_borderedSection",
    sectionBody: "CustomizerDrawerInner_sectionBody",
    sectionTitle: "CustomizerDrawerInner_sectionTitle",
    bgList: "CustomizerDrawerInner_bgList",
    bgListItem: "CustomizerDrawerInner_bgListItem",
    deleteBtn: "CustomizerDrawerInner_deleteBtn",
    bgPanel: "CustomizerDrawerInner_bgPanel",
    bgPanelEmpty: "CustomizerDrawerInner_bgPanelEmpty",
    dynamicIconColor: "CustomizerDrawerInner_dynamicIconColor",
    dynamicPickerIconColor: "CustomizerDrawerInner_dynamicPickerIconColor",
    colorInputIcon: "CustomizerDrawerInner_colorInputIcon",
    colwrap: "CustomizerDrawerInner_colwrap",
    cols: "CustomizerDrawerInner_cols",
    col1: "CustomizerDrawerInner_col1",
    col2: "CustomizerDrawerInner_col2",
    col: "CustomizerDrawerInner_col",
    settingsLink: "CustomizerDrawerInner_settingsLink"
  };

  // pages/new-tab/app/customizer/components/BackgroundSection.js
  init_preact_module();
  var import_classnames17 = __toESM(require_classnames(), 1);
  init_values();
  init_Icons2();
  init_signals_module();
  init_hooks_module();
  init_CustomizerProvider();
  init_utils();
  init_types();
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
    return /* @__PURE__ */ g("ul", { class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgList), role: "radiogroup" }, /* @__PURE__ */ g("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ g(
      DefaultPanel,
      {
        checked: data.value.background.kind === "default",
        onClick: () => select({ background: { kind: "default" } })
      }
    )), /* @__PURE__ */ g("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ g(
      ColorPanel,
      {
        checked: data.value.background.kind === "color" || data.value.background.kind === "hex",
        color: displayColor,
        onClick: () => onNav("color")
      }
    )), /* @__PURE__ */ g("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ g(GradientPanel, { checked: data.value.background.kind === "gradient", gradient, onClick: () => onNav("gradient") })), /* @__PURE__ */ g("li", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ g(
      BackgroundImagePanel,
      {
        checked: data.value.background.kind === "userImage",
        onClick: () => onNav("image"),
        data,
        upload: onUpload,
        browserTheme: browser
      }
    )));
  }
  function DefaultPanel({ checked, onClick }) {
    const id = g2();
    const { main } = x2(CustomizerThemesContext);
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": main,
        "aria-checked": checked,
        "aria-labelledby": id,
        role: "radio",
        onClick,
        tabindex: checked ? -1 : 0
      },
      checked && /* @__PURE__ */ g(CircleCheck, null)
    ), /* @__PURE__ */ g("span", { id }, t5("customizer_background_selection_default")));
  }
  function ColorPanel(props) {
    const id = g2();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": props.color.colorScheme,
        onClick: props.onClick,
        "aria-checked": props.checked,
        tabindex: props.checked ? -1 : 0,
        "aria-labelledby": id,
        role: "radio",
        style: { background: props.color.hex }
      },
      props.checked && /* @__PURE__ */ g(CircleCheck, null)
    ), /* @__PURE__ */ g("span", { id }, t5("customizer_background_selection_color")));
  }
  function GradientPanel(props) {
    const id = g2();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(
      "button",
      {
        onClick: props.onClick,
        class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
        "data-color-mode": props.gradient.colorScheme,
        "aria-checked": props.checked,
        tabindex: props.checked ? -1 : 0,
        "aria-labelledby": id,
        style: {
          background: `url(${props.gradient.path})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center"
        }
      },
      props.checked && /* @__PURE__ */ g(CircleCheck, null)
    ), /* @__PURE__ */ g("span", { id }, t5("customizer_background_selection_gradient")));
  }
  function BackgroundImagePanel(props) {
    const id = g2();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const empty = useComputed(() => props.data.value.userImages.length === 0);
    const selectedImage = useComputed(() => {
      const imageId = props.data.value.background.kind === "userImage" ? props.data.value.background.value : null;
      if (imageId !== null) {
        const match = props.data.value.userImages.find((i6) => i6.id === imageId.id);
        if (match) {
          return match;
        }
      }
      return null;
    });
    const firstImage = useComputed(() => {
      return props.data.value.userImages[0] ?? null;
    });
    const label = empty.value === true ? /* @__PURE__ */ g("span", { id }, t5("customizer_background_selection_image_add")) : /* @__PURE__ */ g("span", { id }, t5("customizer_background_selection_image_existing"));
    if (empty.value === true) {
      return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(
        "button",
        {
          class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty, CustomizerDrawerInner_default.dynamicIconColor),
          "data-color-mode": props.browserTheme,
          "aria-checked": props.checked,
          "aria-labelledby": id,
          role: "radio",
          onClick: props.upload
        },
        /* @__PURE__ */ g(PlusIcon, null)
      ), label);
    }
    const image = selectedImage.value !== null ? selectedImage.value?.thumb : firstImage.value?.thumb;
    const scheme = selectedImage.value !== null ? selectedImage.value?.colorScheme : firstImage.value?.colorScheme;
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames17.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.dynamicIconColor),
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
      props.checked && /* @__PURE__ */ g(CircleCheck, null)
    ), label);
  }

  // pages/new-tab/app/customizer/components/BrowserThemeSection.module.css
  var BrowserThemeSection_default = {
    themeList: "BrowserThemeSection_themeList",
    themeItem: "BrowserThemeSection_themeItem",
    themeButton: "BrowserThemeSection_themeButton",
    themeButtonLight: "BrowserThemeSection_themeButtonLight",
    themeButtonDark: "BrowserThemeSection_themeButtonDark",
    themeButtonSystem: "BrowserThemeSection_themeButtonSystem"
  };

  // pages/new-tab/app/customizer/components/BrowserThemeSection.js
  var import_classnames18 = __toESM(require_classnames(), 1);
  init_preact_module();
  init_signals_module();
  init_types();
  function BrowserThemeSection(props) {
    const current = useComputed(() => props.data.value.theme);
    const { t: t5 } = useTypedTranslationWith(
      /** @type {strings} */
      {}
    );
    return /* @__PURE__ */ g("ul", { class: BrowserThemeSection_default.themeList }, /* @__PURE__ */ g("li", { class: BrowserThemeSection_default.themeItem }, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames18.default)(BrowserThemeSection_default.themeButton, BrowserThemeSection_default.themeButtonLight),
        role: "radio",
        type: "button",
        "aria-checked": current.value === "light",
        tabindex: current.value === "light" ? -1 : 0,
        onClick: () => props.setTheme({ theme: "light" })
      },
      /* @__PURE__ */ g("span", { class: "sr-only" }, t5("customizer_browser_theme_label", { type: "light" }))
    ), t5("customizer_browser_theme_light")), /* @__PURE__ */ g("li", { class: BrowserThemeSection_default.themeItem }, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames18.default)(BrowserThemeSection_default.themeButton, BrowserThemeSection_default.themeButtonDark),
        role: "radio",
        type: "button",
        "aria-checked": current.value === "dark",
        tabindex: current.value === "dark" ? -1 : 0,
        onClick: () => props.setTheme({ theme: "dark" })
      },
      /* @__PURE__ */ g("span", { class: "sr-only" }, t5("customizer_browser_theme_label", { type: "dark" }))
    ), t5("customizer_browser_theme_dark")), /* @__PURE__ */ g("li", { class: BrowserThemeSection_default.themeItem }, /* @__PURE__ */ g(
      "button",
      {
        class: (0, import_classnames18.default)(BrowserThemeSection_default.themeButton, BrowserThemeSection_default.themeButtonSystem),
        role: "radio",
        type: "button",
        "aria-checked": current.value === "system",
        tabindex: current.value === "system" ? -1 : 0,
        onClick: () => props.setTheme({ theme: "system" })
      },
      /* @__PURE__ */ g("span", { class: "sr-only" }, t5("customizer_browser_theme_label", { type: "system" }))
    ), t5("customizer_browser_theme_system")));
  }

  // pages/new-tab/app/customizer/components/VisibilityMenuSection.js
  init_hooks_module();
  init_CustomizerMenu();
  init_VisibilityMenu2();
  init_preact_module();
  function VisibilityMenuSection() {
    const [rowData, setRowData] = h2(() => {
      const items = (
        /** @type {import("./CustomizerMenu.js").VisibilityRowData[]} */
        getItems()
      );
      return items;
    });
    _2(() => {
      function handler() {
        setRowData(getItems());
      }
      window.addEventListener(CustomizerMenu.UPDATE_EVENT, handler);
      return () => {
        window.removeEventListener(CustomizerMenu.UPDATE_EVENT, handler);
      };
    }, []);
    return /* @__PURE__ */ g(EmbeddedVisibilityMenu, { rows: rowData });
  }

  // pages/new-tab/app/customizer/components/ColorSelection.js
  init_preact_module();
  var import_classnames19 = __toESM(require_classnames(), 1);
  init_values();
  init_Icons2();
  init_signals_module();
  init_utils();
  init_types();
  function ColorSelection({ data, select, back }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      const selector = `[role="radio"][aria-checked="false"][data-value]`;
      if (!target?.matches(selector)) {
        target = /** @type {HTMLElement|null} */
        target?.closest(selector);
      }
      if (!target) return;
      const value = (
        /** @type {PredefinedColor} */
        target.dataset.value
      );
      if (!(value in values.colors)) return console.warn("could not select color", value);
      select({ background: { kind: "color", value } });
    }
    return /* @__PURE__ */ g("div", null, /* @__PURE__ */ g("button", { type: "button", onClick: back, class: (0, import_classnames19.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ g(BackChevron, null), t5("customizer_background_selection_color")), /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.sectionBody }, /* @__PURE__ */ g(InlineErrorBoundary, { format: (message) => `Customizer section 'ColorGrid' threw an exception: ` + message }, /* @__PURE__ */ g("div", { class: (0, import_classnames19.default)(CustomizerDrawerInner_default.bgList), role: "radiogroup", onClick }, /* @__PURE__ */ g(PickerPanel, { data, select }), /* @__PURE__ */ g(ColorGrid, { data })))));
  }
  var entries = Object.keys(values.colors);
  function ColorGrid({ data }) {
    const selected = useComputed(() => data.value.background.kind === "color" && data.value.background.value);
    return /* @__PURE__ */ g(k, null, entries.map((key) => {
      const entry = values.colors[key];
      return /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.bgListItem, key }, /* @__PURE__ */ g(
        "button",
        {
          class: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabindex: 0,
          style: { background: entry.hex },
          role: "radio",
          "aria-checked": key === selected.value,
          "data-value": key
        },
        /* @__PURE__ */ g("span", { class: "sr-only" }, "Select ", key)
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
    return /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.bgListItem }, /* @__PURE__ */ g(
      "button",
      {
        className: (0, import_classnames19.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty),
        type: "button",
        tabIndex: 0,
        style: { background: hex.value },
        role: "radio",
        "aria-checked": hexSelected
      }
    ), /* @__PURE__ */ g(
      "input",
      {
        type: "color",
        tabIndex: -1,
        style: { opacity: 0, inset: 0, position: "absolute", width: "100%", height: "100%" },
        value: hex,
        onChange: (e5) => {
          if (!(e5.target instanceof HTMLInputElement)) return;
          select({ background: { kind: "hex", value: e5.target.value } });
        },
        onClick: (e5) => {
          if (!(e5.target instanceof HTMLInputElement)) return;
          if (data.value.userColor?.value === hex.value) {
            select({ background: { kind: "hex", value: e5.target.value } });
          }
        }
      }
    ), /* @__PURE__ */ g("span", { class: (0, import_classnames19.default)(CustomizerDrawerInner_default.colorInputIcon, CustomizerDrawerInner_default.dynamicPickerIconColor), "data-color-mode": modeSelected }, /* @__PURE__ */ g(Picker, null)));
  }

  // pages/new-tab/app/customizer/components/GradientSelection.js
  init_preact_module();
  var import_classnames20 = __toESM(require_classnames(), 1);
  init_values();
  init_signals_module();
  init_Icons2();
  init_types();
  function GradientSelection({ data, select, back }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      const selector = `[role="radio"][aria-checked="false"][data-value]`;
      if (!target?.matches(selector)) {
        target = /** @type {HTMLElement|null} */
        target?.closest(selector);
      }
      if (!target) return;
      const value = (
        /** @type {PredefinedGradient} */
        target.dataset.value
      );
      if (!(value in values.gradients)) return console.warn("could not select gradient", value);
      select({ background: { kind: "gradient", value } });
    }
    return /* @__PURE__ */ g("div", null, /* @__PURE__ */ g("button", { type: "button", onClick: back, class: (0, import_classnames20.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ g(BackChevron, null), t5("customizer_background_selection_gradient")), /* @__PURE__ */ g("div", { className: CustomizerDrawerInner_default.sectionBody, onClick }, /* @__PURE__ */ g(InlineErrorBoundary, { format: (message) => `Customizer section 'GradientSelection' threw an exception: ` + message }, /* @__PURE__ */ g(GradientGrid, { data }))));
  }
  var entries2 = Object.keys(values.gradients);
  function GradientGrid({ data }) {
    const selected = useComputed(() => data.value.background.kind === "gradient" && data.value.background.value);
    return /* @__PURE__ */ g("ul", { className: (0, import_classnames20.default)(CustomizerDrawerInner_default.bgList) }, entries2.map((key) => {
      const entry = values.gradients[key];
      return /* @__PURE__ */ g("li", { className: CustomizerDrawerInner_default.bgListItem, key }, /* @__PURE__ */ g(
        "button",
        {
          className: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabIndex: 0,
          role: "radio",
          "aria-checked": key === selected.value,
          "data-value": key,
          style: {
            backgroundColor: entry.fallback,
            backgroundImage: `url(${entry.path})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
          }
        },
        /* @__PURE__ */ g("span", { className: "sr-only" }, "Select ", key)
      ));
    }));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  init_signals_module();

  // pages/new-tab/app/customizer/components/ImageSelection.js
  init_preact_module();
  var import_classnames21 = __toESM(require_classnames(), 1);
  init_signals_module();
  init_DismissButton2();
  init_Icons2();
  init_hooks_module();
  init_CustomizerProvider();
  init_types();
  function ImageSelection({ data, select, back, onUpload, deleteImage, customizerContextMenu }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    function onClick(event) {
      let target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      const selector = `[role="radio"][aria-checked="false"][data-id]`;
      if (!target?.matches(selector)) {
        target = /** @type {HTMLElement|null} */
        target?.closest(selector);
      }
      if (!target) return;
      const value = (
        /** @type {string} */
        target.dataset.id
      );
      const match = data.value.userImages.find((i6) => i6.id === value);
      if (!match) return console.warn("could not find matching image", value);
      select({ background: { kind: "userImage", value: match } });
    }
    function onContextMenu(event) {
      const target = (
        /** @type {HTMLElement|null} */
        event.target
      );
      if (!(target instanceof HTMLElement)) return;
      const id = target.closest("button")?.dataset.id;
      if (typeof id === "string") {
        event.preventDefault();
        event.stopImmediatePropagation();
        customizerContextMenu({ id, target: "userImage" });
      }
    }
    return /* @__PURE__ */ g("div", { onContextMenu }, /* @__PURE__ */ g("button", { type: "button", onClick: back, class: (0, import_classnames21.default)(CustomizerDrawerInner_default.backBtn, CustomizerDrawerInner_default.sectionTitle) }, /* @__PURE__ */ g(BackChevron, null), t5("customizer_background_selection_image_existing")), /* @__PURE__ */ g("div", { className: CustomizerDrawerInner_default.sectionBody, onClick }, /* @__PURE__ */ g(InlineErrorBoundary, { format: (message) => `Customizer section 'ImageSelection' threw an exception: ` + message }, /* @__PURE__ */ g(ImageGrid, { data, deleteImage, onUpload }))), /* @__PURE__ */ g("div", { className: CustomizerDrawerInner_default.sectionBody }, /* @__PURE__ */ g("p", null, t5("customizer_image_privacy"))));
  }
  function ImageGrid({ data, deleteImage, onUpload }) {
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    const { browser } = x2(CustomizerThemesContext);
    const selected = useComputed(() => data.value.background.kind === "userImage" && data.value.background.value.id);
    const entries4 = useComputed(() => {
      return data.value.userImages;
    });
    const max = 8;
    const diff = max - entries4.value.length;
    const placeholders = new Array(diff).fill(null);
    return /* @__PURE__ */ g("ul", { className: (0, import_classnames21.default)(CustomizerDrawerInner_default.bgList) }, entries4.value.map((entry, index) => {
      $INTEGRATION: (() => {
        if (entry.id === "__will_throw__") throw new Error("Simulated error");
      })();
      return /* @__PURE__ */ g("li", { className: CustomizerDrawerInner_default.bgListItem, key: entry.id }, /* @__PURE__ */ g(
        "button",
        {
          className: CustomizerDrawerInner_default.bgPanel,
          type: "button",
          tabIndex: 0,
          role: "radio",
          "aria-checked": entry.id === selected.value,
          "data-id": entry.id,
          style: {
            backgroundImage: `url(${entry.thumb})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
          }
        },
        /* @__PURE__ */ g("span", { class: "sr-only" }, t5("customizer_image_select", { number: String(index + 1) }))
      ), /* @__PURE__ */ g(
        DismissButton,
        {
          className: CustomizerDrawerInner_default.deleteBtn,
          onClick: () => deleteImage(entry.id),
          buttonProps: {
            "data-color-mode": String(entry.colorScheme),
            "aria-label": t5("customizer_image_delete", { number: String(index + 1) })
          }
        }
      ));
    }), placeholders.map((_6, index) => {
      return /* @__PURE__ */ g("li", { className: CustomizerDrawerInner_default.bgListItem, key: `placeholder-${diff}-${index}` }, /* @__PURE__ */ g(
        "button",
        {
          type: "button",
          onClick: onUpload,
          class: (0, import_classnames21.default)(CustomizerDrawerInner_default.bgPanel, CustomizerDrawerInner_default.bgPanelEmpty, CustomizerDrawerInner_default.dynamicIconColor),
          "data-color-mode": browser
        },
        /* @__PURE__ */ g(PlusIcon, null),
        /* @__PURE__ */ g("span", { class: "sr-only" }, t5("customizer_background_selection_image_add"))
      ));
    }));
  }

  // pages/new-tab/app/customizer/components/CustomizerSection.js
  init_preact_module();
  var import_classnames22 = __toESM(require_classnames(), 1);
  function CustomizerSection({ title, children }) {
    return /* @__PURE__ */ g("div", { className: CustomizerDrawerInner_default.section }, title === null && children, title !== null && /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("h3", { className: CustomizerDrawerInner_default.sectionTitle }, title), /* @__PURE__ */ g("div", { className: CustomizerDrawerInner_default.sectionBody }, children)));
  }
  function BorderedSection({ children }) {
    return /* @__PURE__ */ g("div", { class: (0, import_classnames22.default)(CustomizerDrawerInner_default.section, CustomizerDrawerInner_default.borderedSection) }, children);
  }

  // pages/new-tab/app/customizer/components/SettingsLink.js
  var import_classnames23 = __toESM(require_classnames(), 1);
  init_preact_module();
  init_types();

  // pages/new-tab/app/components/icons/Open.js
  init_preact_module();
  function Open() {
    return /* @__PURE__ */ g("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ g(
      "path",
      {
        d: "M4.125 2.25C3.08947 2.25 2.25 3.08947 2.25 4.125V11.875C2.25 12.9105 3.08947 13.75 4.125 13.75H11.875C12.9105 13.75 13.75 12.9105 13.75 11.875V8.765C13.75 8.41982 14.0298 8.14 14.375 8.14C14.7202 8.14 15 8.41982 15 8.765V11.875C15 13.6009 13.6009 15 11.875 15H4.125C2.39911 15 1 13.6009 1 11.875V4.125C1 2.39911 2.39911 1 4.125 1H7.235C7.58018 1 7.86 1.27982 7.86 1.625C7.86 1.97018 7.58018 2.25 7.235 2.25H4.125Z",
        fill: "currentColor"
      }
    ), /* @__PURE__ */ g(
      "path",
      {
        d: "M10.25 1.625C10.25 1.27982 10.5298 1 10.875 1H14.375C14.7202 1 15 1.27982 15 1.625V5.125C15 5.47018 14.7202 5.75 14.375 5.75C14.0298 5.75 13.75 5.47018 13.75 5.125V3.13388L9.06694 7.81694C8.82286 8.06102 8.42714 8.06102 8.18306 7.81694C7.93898 7.57286 7.93898 7.17714 8.18306 6.93306L12.8661 2.25H10.875C10.5298 2.25 10.25 1.97018 10.25 1.625Z",
        fill: "currentColor"
      }
    ));
  }

  // pages/new-tab/app/customizer/components/SettingsLink.js
  function SettingsLink() {
    const messaging2 = useMessaging();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    function onClick(e5) {
      e5.preventDefault();
      messaging2.open({ target: "settings" });
    }
    return /* @__PURE__ */ g("a", { href: "duck://settings", class: (0, import_classnames23.default)(CustomizerDrawerInner_default.settingsLink), onClick }, /* @__PURE__ */ g("span", null, t5("customizer_settings_link")), /* @__PURE__ */ g(Open, null));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawerInner.js
  init_DismissButton2();
  init_types();
  function CustomizerDrawerInner({ data, select, onUpload, setTheme, deleteImage, customizerContextMenu }) {
    const { close } = useDrawerControls();
    const { t: t5 } = useTypedTranslationWith(
      /** @type {enStrings} */
      {}
    );
    return /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.root }, /* @__PURE__ */ g("header", { class: (0, import_classnames24.default)(CustomizerDrawerInner_default.header, CustomizerDrawerInner_default.internal) }, /* @__PURE__ */ g("h2", null, t5("customizer_drawer_title")), /* @__PURE__ */ g(
      DismissButton,
      {
        onClick: close,
        className: CustomizerDrawerInner_default.closeBtn,
        buttonProps: {
          "aria-label": "Close"
        }
      }
    )), /* @__PURE__ */ g(
      InlineErrorBoundary,
      {
        format: (message) => `CustomizerDrawerInner threw an exception: ${message}`,
        fallback: (message) => /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.internal }, /* @__PURE__ */ g("p", null, message))
      },
      /* @__PURE__ */ g(
        TwoCol,
        {
          left: ({ push }) => /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.sections }, /* @__PURE__ */ g(CustomizerSection, { title: t5("customizer_section_title_background") }, /* @__PURE__ */ g(BackgroundSection, { data, onNav: push, onUpload, select })), /* @__PURE__ */ g(CustomizerSection, { title: t5("customizer_section_title_theme") }, /* @__PURE__ */ g(BrowserThemeSection, { data, setTheme })), /* @__PURE__ */ g(CustomizerSection, { title: t5("customizer_section_title_sections") }, /* @__PURE__ */ g(VisibilityMenuSection, null)), /* @__PURE__ */ g(BorderedSection, null, /* @__PURE__ */ g(SettingsLink, null))),
          right: ({ id, pop }) => /* @__PURE__ */ g(k, null, id === "color" && /* @__PURE__ */ g(ColorSelection, { data, select, back: pop }), id === "gradient" && /* @__PURE__ */ g(GradientSelection, { data, select, back: pop }), id === "image" && /* @__PURE__ */ g(
            ImageSelection,
            {
              data,
              select,
              back: pop,
              onUpload,
              deleteImage,
              customizerContextMenu
            }
          ))
        }
      )
    ));
  }
  function TwoCol({ left: left2, right: right2 }) {
    const visibleScreen = useSignal("home");
    const renderedScreen = useSignal("home");
    const col1 = useSignal(true);
    function push(id) {
      visibleScreen.value = id;
      requestAnimationFrame(() => {
        renderedScreen.value = id;
      });
    }
    function pop() {
      r3(() => {
        col1.value = true;
        visibleScreen.value = "home";
      });
    }
    function transitionEnded() {
      if (visibleScreen.value !== "home") {
        col1.value = false;
      }
      renderedScreen.value = visibleScreen.value;
    }
    return /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.colwrap }, /* @__PURE__ */ g("div", { class: CustomizerDrawerInner_default.cols, "data-sub": visibleScreen, onTransitionEnd: transitionEnded }, /* @__PURE__ */ g("div", { class: (0, import_classnames24.default)(CustomizerDrawerInner_default.col, CustomizerDrawerInner_default.col1) }, col1.value && left2({ push })), /* @__PURE__ */ g("div", { class: (0, import_classnames24.default)(CustomizerDrawerInner_default.col, CustomizerDrawerInner_default.col2) }, renderedScreen.value !== "home" && right2({ id: renderedScreen.value, pop }))));
  }

  // pages/new-tab/app/customizer/components/CustomizerDrawer.js
  function CustomizerDrawer({ displayChildren }) {
    return /* @__PURE__ */ g("div", { class: CustomizerDrawer_default.root }, displayChildren.value === true && /* @__PURE__ */ g(CustomizerConsumer, null));
  }
  function CustomizerConsumer() {
    const { data, select, upload, setTheme, deleteImage, customizerContextMenu } = x2(CustomizerContext);
    return /* @__PURE__ */ g(
      CustomizerDrawerInner,
      {
        data,
        select,
        onUpload: upload,
        setTheme,
        deleteImage,
        customizerContextMenu
      }
    );
  }

  // pages/new-tab/app/components/App.js
  init_BackgroundProvider();
  init_signals_module();
  init_CustomizerProvider();
  init_hooks_module();
  function App() {
    const platformName = usePlatformName();
    const customizerDrawer = useCustomizerDrawerSettings();
    const customizerKind = useCustomizerKind();
    useGlobalDropzone();
    useContextMenu();
    const {
      buttonRef,
      asideRef,
      visibility,
      displayChildren,
      animating,
      hidden,
      buttonId,
      drawerId
    } = useDrawer(customizerDrawer.autoOpen ? "visible" : "hidden");
    const tabIndex = useComputed(() => hidden.value ? -1 : 0);
    const isOpen = useComputed(() => hidden.value === false);
    const { toggle } = useDrawerControls();
    const { main, browser } = x2(CustomizerThemesContext);
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(BackgroundConsumer, { browser }), /* @__PURE__ */ g("div", { class: App_default.layout, "data-animating": animating, "data-drawer-visibility": visibility }, /* @__PURE__ */ g("main", { class: (0, import_classnames25.default)(App_default.main, App_default.mainLayout, App_default.mainScroller), "data-main-scroller": true, "data-theme": main }, /* @__PURE__ */ g("div", { class: App_default.content }, /* @__PURE__ */ g("div", { className: App_default.tube, "data-content-tube": true, "data-platform": platformName }, /* @__PURE__ */ g(WidgetList, null)))), /* @__PURE__ */ g("div", { class: App_default.themeContext, "data-theme": main }, /* @__PURE__ */ g(CustomizerMenuPositionedFixed, null, customizerKind === "menu" && /* @__PURE__ */ g(CustomizerMenu, null), customizerKind === "drawer" && /* @__PURE__ */ g(
      CustomizerButton,
      {
        buttonId,
        menuId: drawerId,
        toggleMenu: toggle,
        buttonRef,
        isOpen,
        kind: "drawer"
      }
    ))), customizerKind === "drawer" && /* @__PURE__ */ g(
      "aside",
      {
        class: (0, import_classnames25.default)(App_default.aside, App_default.asideLayout, App_default.asideScroller),
        tabindex: tabIndex,
        "aria-hidden": hidden,
        "data-theme": browser,
        "data-browser-panel": true,
        ref: asideRef
      },
      /* @__PURE__ */ g("div", { class: App_default.asideContent }, /* @__PURE__ */ g(
        InlineErrorBoundary,
        {
          context: "Customizer Drawer",
          fallback: (message) => /* @__PURE__ */ g("div", { class: App_default.paddedError }, /* @__PURE__ */ g("p", null, message))
        },
        /* @__PURE__ */ g(CustomizerDrawer, { displayChildren })
      ))
    )));
  }
  function AppLevelErrorBoundaryFallback({ children }) {
    return /* @__PURE__ */ g("div", { class: App_default.paddedError }, /* @__PURE__ */ g("p", null, children), /* @__PURE__ */ g("div", { class: App_default.paddedErrorRecovery }, "You can try to ", /* @__PURE__ */ g("button", { onClick: () => location.reload() }, "Reload this page")));
  }

  // pages/new-tab/app/index.js
  init_EnvironmentProvider();
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
    stats_menuTitle_v2: {
      title: "Protection Stats",
      note: "Used as a label in a customization menu"
    },
    stats_noActivity: {
      title: "DuckDuckGo blocks tracking attempts as you browse. Visit a few sites to see how many we block!",
      note: "Placeholder for when we cannot report any blocked trackers yet"
    },
    stats_noRecent: {
      title: "Tracking protections active",
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
    },
    customizer_image_privacy: {
      title: "Images are stored on your device so DuckDuckGo can\u2019t see or access them.",
      note: "Shown near a button that allows a user to upload an image to be used as a background."
    },
    customizer_drawer_title: {
      title: "Customize",
      note: "Title in a slide-out drawer that contains options for customizing the browser."
    },
    customizer_section_title_background: {
      title: "Background",
      note: "Section title displayed in the UI for customizing the background."
    },
    customizer_section_title_theme: {
      title: "Browser Theme",
      note: "Section title for a section where users can customize the browser theme. (for example, 'light' or 'dark')"
    },
    customizer_section_title_sections: {
      title: "Sections",
      note: "Section title for a list of toggles for showing/hiding certain sections of the page."
    },
    customizer_browser_theme_light: {
      title: "Light",
      note: "The label for a button that sets the browser theme to 'light' mode"
    },
    customizer_browser_theme_dark: {
      title: "Dark",
      note: "The label for a button that sets the browser theme to 'dark' mode"
    },
    customizer_browser_theme_system: {
      title: "System",
      note: "The label for a button that sets the browser theme to 'system', which matches the operating system setting"
    },
    customizer_browser_theme_label: {
      title: "Select {type} theme",
      note: "The label text on a button, for assistive technologies (like screen readers). {type} will be replace with 'light', 'dark' or 'system'"
    },
    customizer_settings_link: {
      title: "Go to Settings",
      note: "The label text on a link that opens the Settings"
    },
    customizer_background_selection_default: {
      title: "Default",
      note: "Label text below a button that selects a 'default' background"
    },
    customizer_background_selection_color: {
      title: "Solid Colors",
      note: "Label text below a button that allows a color background"
    },
    customizer_background_selection_gradient: {
      title: "Gradients",
      note: "Label text below a button that allows a gradient background"
    },
    customizer_background_selection_image_add: {
      title: "Add Background",
      note: "Label text shown on a button that allows an image to be uploaded"
    },
    customizer_background_selection_image_existing: {
      title: "My Backgrounds",
      note: "Label text shown on a button navigates to list of existing background (that the user previously uploaded)"
    },
    customizer_image_select: {
      title: "Select image {number}",
      note: "Label text on a button, for assistive technologies (like screen readers). {number} will be replaced with a numeric reference of 1-8, eg: 'Select image 1'"
    },
    customizer_image_delete: {
      title: "Delete image {number}",
      note: "Label text on a button that deletes an image. {number} will be replaced with a numeric reference of 1-8, eg: 'Delete image 1'"
    },
    activity_noRecent_title: {
      title: "No recent browsing activity",
      note: "Placeholder to indicate that no browsing activity was seen in the last 7 days"
    },
    activity_noRecent_subtitle: {
      title: "Recently visited sites will appear here. Keep browsing to see how many trackers we block.",
      note: "Shown in the place a list of browsing history entries will be displayed."
    },
    activity_no_trackers: {
      title: "No trackers found",
      note: "Placeholder message indicating that no trackers are detected"
    },
    activity_no_trackers_blocked: {
      title: "No trackers blocked",
      note: "Placeholder message indicating that no trackers are blocked"
    },
    activity_countBlockedPlural: {
      title: "<b>{count}</b> tracking attempts blocked",
      note: "The main headline indicating that more than 1 attempt has been blocked. Eg: '2 tracking attempts blocked'"
    },
    activity_favoriteAdd: {
      title: "Add {domain} to favorites",
      note: "Button label, allows the user to add the specified domain to their favorites"
    },
    activity_favoriteRemove: {
      title: "Remove {domain} from favorites",
      note: "Button label, allows the user to remove the specified domain from their favorites"
    },
    activity_itemRemove: {
      title: "Remove {domain} from history",
      note: "Button label for clearing browsing history for a given domain."
    },
    activity_burn: {
      title: "Clear browsing history and data for {domain}",
      note: "Button label for clearing browsing history and data exclusively for the specified domain"
    },
    activity_menuTitle: {
      title: "Recent Activity",
      note: "Used as a label in a customization menu"
    },
    activity_show_more_history: {
      title: "Show {count} more",
      note: "Button label that expands the list of browsing history with the specified count of additional items. Example: 'Show 5 more'"
    },
    activity_show_less_history: {
      title: "Hide additional",
      note: "Button label that hides the expanded browsing history items."
    }
  };

  // pages/new-tab/app/index.js
  init_widget_config_provider();

  // pages/new-tab/app/settings.js
  var Settings = class _Settings {
    /**
     * @param {object} params
     * @param {{name: 'macos' | 'windows'}} [params.platform]
     * @param {{state: 'enabled' | 'disabled', autoOpen: boolean}} [params.customizerDrawer]
     */
    constructor({ platform = { name: "macos" }, customizerDrawer = { state: "disabled", autoOpen: false } }) {
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

  // pages/new-tab/app/components/Components.module.css
  var Components_default = {
    main: "Components_main",
    contentTube: "Components_contentTube",
    componentList: "Components_componentList",
    itemInfo: "Components_itemInfo",
    itemLinks: "Components_itemLinks",
    itemLink: "Components_itemLink",
    debugBar: "Components_debugBar",
    buttonRow: "Components_buttonRow",
    "grid-container": "Components_grid-container",
    item: "Components_item"
  };

  // pages/new-tab/app/customizer/components/Customizer.examples.js
  init_preact_module();
  init_utils2();
  init_CustomizerMenu();
  init_VisibilityMenu2();
  init_signals_module();
  var customizerExamples = {
    "customizer.backgroundSection": {
      factory: () => {
        return /* @__PURE__ */ g(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ g(BackgroundSection, { data, onNav: noop("onNav"), onUpload: noop("onUpload"), select });
        });
      }
    },
    "customizer.colorSelection": {
      factory: () => {
        return /* @__PURE__ */ g(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ g(ColorSelection, { data, select, back: noop("back") });
        });
      }
    },
    "customizer.gradientSelection": {
      factory: () => {
        return /* @__PURE__ */ g(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ g(GradientSelection, { data, select, back: noop("back") });
        });
      }
    },
    "customizer.imageSelection": {
      factory: () => {
        return /* @__PURE__ */ g(Provider, null, ({ data, select }) => {
          return /* @__PURE__ */ g(
            ImageSelection,
            {
              data,
              select,
              back: noop("back"),
              onUpload: noop("onUpload"),
              deleteImage: noop("deleteImage"),
              customizerContextMenu: noop("customizerContextMenu")
            }
          );
        });
      }
    },
    "customizer-menu": {
      factory: () => /* @__PURE__ */ g(MaxContent, null, /* @__PURE__ */ g(CustomizerButton, { isOpen: true, kind: "menu" }), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g(
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
      ), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g("div", { style: "width: 206px; border: 1px dotted black" }, /* @__PURE__ */ g(
        EmbeddedVisibilityMenu,
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
    return /* @__PURE__ */ g("div", { style: { display: "grid", gridTemplateColumns: "max-content" } }, children);
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
        { id: "id-many-1", etldPlusOne: "example.com", url: "https://example.com?id=id-many-1", title: "Amazon", favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 16 } },
        { id: "id-many-2", etldPlusOne: "adform.com", url: "https://adform.com?id=id-many-2", title: "Adform", favicon: null },
        { id: "id-many-3", etldPlusOne: "adobe.com", url: "https://adobe.com?id=id-many-3", title: "Adobe", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-4", etldPlusOne: "adobe.com", url: "https://b.adobe.com?id=id-many-3", title: "Adobe sub", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-31", etldPlusOne: "example.com", url: "https://b.example.com?id=id-many-4", title: "A Beautiful Mess", favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 } },
        { id: "id-many-5", etldPlusOne: "google.com", url: "https://mail.google.com?id=id-many-3", title: "Gmail", favicon: null },
        { id: "id-many-6", etldPlusOne: "example.com", url: "https://example.com?id=id-many-5", title: "TikTok", favicon: { src: "./company-icons/bytedance.svg", maxAvailableSize: 16 } },
        { id: "id-many-7", etldPlusOne: "doordash.com", url: "https://doordash.com?id=id-many-6", title: "DoorDash", favicon: null },
        { id: "id-many-8", etldPlusOne: "example.com", url: "https://example.com?id=id-many-7", title: "Facebook", favicon: { src: "./company-icons/facebook.svg", maxAvailableSize: 16 } },
        { id: "id-many-9", etldPlusOne: "example.com", url: "https://example.com?id=id-many-8", title: "Beeswax", favicon: { src: "./company-icons/beeswax.svg", maxAvailableSize: 16 } },
        { id: "id-many-10", etldPlusOne: "example.com", url: "https://example.com?id=id-many-9", title: "Adobe", favicon: { src: "./company-icons/adobe.svg", maxAvailableSize: 16 } },
        { id: "id-many-11", etldPlusOne: "example.com", url: "https://example.com?id=id-many-10", title: "Beeswax", favicon: { src: "./company-icons/beeswax.svg", maxAvailableSize: 16 } },
        { id: "id-many-12", etldPlusOne: "example.com", url: "https://example.com?id=id-many-11", title: "Facebook", favicon: { src: "./company-icons/facebook.svg", maxAvailableSize: 16 } },
        { id: "id-many-13", etldPlusOne: "example.com", url: "https://example.com?id=id-many-12", title: "Gmail", favicon: { src: "./company-icons/google.svg", maxAvailableSize: 64 } },
        { id: "id-many-14", etldPlusOne: "example.com", url: "https://example.com?id=id-many-13", title: "TikTok", favicon: { src: "./company-icons/bytedance.svg", maxAvailableSize: 16 } },
        { id: "id-many-15", etldPlusOne: "example.com", url: "https://example.com?id=id-many-14", title: "yeti", favicon: null }
      ]
    },
    single: {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-single-1",
          url: "https://example.com?id=id-single-1",
          etldPlusOne: "example.com",
          title: "Amazon",
          favicon: { src: "./company-icons/amazon.svg", maxAvailableSize: 32 }
        }
      ]
    },
    none: {
      /** @type {Favorite[]} */
      favorites: []
    },
    titles: {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-titles-1",
          url: "https://duckduckgo.com",
          etldPlusOne: "google.com",
          title: "accounts.google.com",
          favicon: null
        }
      ]
    },
    "small-icon": {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-small-icon-1",
          url: "https://duckduckgo.com",
          etldPlusOne: "duckduckgo.com",
          title: "DuckDuckGo",
          favicon: { src: "./icons/favicon@2x.png", maxAvailableSize: 16 }
        }
      ]
    },
    fallbacks: {
      /** @type {Favorite[]} */
      favorites: [
        {
          id: "id-fallbacks-3",
          url: "https://adobe.com?id=id-many-3",
          etldPlusOne: "adobe.com",
          title: "404 favicon.src",
          favicon: { src: "./this-does-note-exist", maxAvailableSize: 16 }
        },
        {
          id: "id-fallbacks-4",
          url: "https://revoked.badssl.com",
          etldPlusOne: "badssl.com",
          title: "missing favicon + subdomain",
          favicon: null
        },
        {
          id: "id-fallbacks-5",
          url: "https://wikipedia.com",
          etldPlusOne: "wikipedia.com",
          title: "missing favicon",
          favicon: null
        },
        {
          id: "id-fallbacks-6",
          url: "https://wikipedia.com",
          etldPlusOne: null,
          title: "missing etld+1",
          favicon: null
        }
      ]
    }
  };
  function gen(count = 1e3) {
    const max = Math.min(count, 1e3);
    const icons = [
      "33across.svg",
      "a.svg",
      "acuityads.svg",
      "adform.svg",
      "adjust.svg",
      "adobe.svg",
      "akamai.svg",
      "amazon.svg",
      "amplitude.svg",
      "appsflyer.svg",
      "automattic.svg",
      "b.svg",
      "beeswax.svg",
      "bidtellect.svg",
      "branch-metrics.svg",
      "braze.svg",
      "bugsnag.svg",
      "bytedance.svg",
      "c.svg",
      "chartbeat.svg",
      "cloudflare.svg",
      "cognitiv.svg",
      "comscore.svg",
      "crimtan-holdings.svg",
      "criteo.svg",
      "d.svg",
      "deepintent.svg",
      "e.svg",
      "exoclick.svg",
      "eyeota.svg",
      "f.svg",
      "facebook.svg",
      "g.svg",
      "google.svg",
      "google-ads.svg",
      "google-analytics.svg",
      "gumgum.svg",
      "h.svg",
      "hotjar.svg",
      "i.svg",
      "id5.svg",
      "improve-digital.svg",
      "index-exchange.svg",
      "inmar.svg",
      "instagram.svg",
      "intent-iq.svg",
      "iponweb.svg",
      "j.svg",
      "k.svg",
      "kargo.svg",
      "kochava.svg",
      "l.svg",
      "line.svg",
      "linkedin.svg",
      "liveintent.svg",
      "liveramp.svg",
      "loopme-ltd.svg",
      "lotame-solutions.svg",
      "m.svg",
      "magnite.svg",
      "mediamath.svg",
      "medianet-advertising.svg",
      "mediavine.svg",
      "merkle.svg",
      "microsoft.svg",
      "mixpanel.svg",
      "n.svg",
      "narrative.svg",
      "nativo.svg",
      "neustar.svg",
      "new-relic.svg",
      "o.svg",
      "onetrust.svg",
      "openjs-foundation.svg",
      "openx.svg",
      "opera-software.svg",
      "oracle.svg",
      "other.svg",
      "outbrain.svg",
      "p.svg",
      "pinterest.svg",
      "prospect-one.svg",
      "pubmatic.svg",
      "pulsepoint.svg",
      "q.svg",
      "quantcast.svg",
      "r.svg",
      "rhythmone.svg",
      "roku.svg",
      "rtb-house.svg",
      "rubicon.svg",
      "s.svg",
      "salesforce.svg",
      "semasio.svg",
      "sharethrough.svg",
      "simplifi-holdings.svg",
      "smaato.svg",
      "snap.svg",
      "sonobi.svg",
      "sovrn-holdings.svg",
      "spotx.svg",
      "supership.svg",
      "synacor.svg",
      "t.svg",
      "taboola.svg",
      "tapad.svg",
      "teads.svg",
      "the-nielsen-company.svg",
      "the-trade-desk.svg",
      "triplelift.svg",
      "twitter.svg",
      "u.svg",
      "unruly-group.svg",
      "urban-airship.svg",
      "v.svg",
      "verizon-media.svg",
      "w.svg",
      "warnermedia.svg",
      "wpp.svg",
      "x.svg",
      "xaxis.svg",
      "y.svg",
      "yahoo-japan.svg",
      "yandex.svg",
      "yieldmo.svg",
      "youtube.svg",
      "z.svg",
      "zeotap.svg",
      "zeta-global.svg"
    ];
    return {
      favorites: Array.from({ length: max }).map((_6, index) => {
        const randomFavicon = icons[index];
        const joined = `./company-icons/${randomFavicon}`;
        const alpha = "abcdefghijklmnopqrstuvwxyz";
        const out = {
          id: `id-many-${index}`,
          url: `https://${alpha[index % 7]}.example.com?id=${index}`,
          etldPlusOne: `example.com`,
          title: `Example ${index + 1}`,
          favicon: { src: joined, maxAvailableSize: 64 }
        };
        return out;
      })
    };
  }

  // pages/new-tab/app/favorites/mocks/MockFavoritesProvider.js
  init_preact_module();
  init_FavoritesProvider();
  init_hooks_module();
  init_EnvironmentProvider();
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
        et.addEventListener("state-update", (e5) => {
          cb(e5.detail);
        });
      },
      [et]
    );
    return /* @__PURE__ */ g(FavoritesContext.Provider, { value: { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add, onConfigChanged } }, /* @__PURE__ */ g(FavoritesDispatchContext.Provider, { value: dispatch }, children));
  }

  // pages/new-tab/app/favorites/components/Favorites.examples.js
  init_FavoritesCustomized();
  var favoritesExamples = {
    "favorites.dnd": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.many }, /* @__PURE__ */ g(FavoritesConsumer, null))
    },
    "favorites.few.7": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 7) } }, /* @__PURE__ */ g(FavoritesConsumer, null))
    },
    "favorites.few.7.no-animation": {
      factory: () => /* @__PURE__ */ g(
        MockFavoritesProvider,
        {
          data: { favorites: favorites.many.favorites.slice(0, 7) },
          config: { expansion: "expanded", animation: { kind: "none" } }
        },
        /* @__PURE__ */ g(FavoritesConsumer, null)
      )
    },
    "favorites.few.6": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 6) } }, /* @__PURE__ */ g(FavoritesConsumer, null))
    },
    "favorites.few.12": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: { favorites: favorites.many.favorites.slice(0, 12) } }, /* @__PURE__ */ g(FavoritesConsumer, null))
    },
    "favorites.multi": {
      factory: () => /* @__PURE__ */ g("div", null, /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.many }, /* @__PURE__ */ g(FavoritesConsumer, null)), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.single }, /* @__PURE__ */ g(FavoritesConsumer, null)), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.none }, /* @__PURE__ */ g(FavoritesConsumer, null)))
    },
    "favorites.single": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.single }, /* @__PURE__ */ g(FavoritesConsumer, null))
    },
    "favorites.none": {
      factory: () => /* @__PURE__ */ g(MockFavoritesProvider, { data: favorites.none }, /* @__PURE__ */ g(FavoritesConsumer, null))
    }
  };

  // pages/new-tab/app/freemium-pir-banner/components/FreemiumPIRBanner.examples.js
  init_preact_module();
  init_utils2();
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
      factory: () => /* @__PURE__ */ g(
        FreemiumPIRBanner,
        {
          message: freemiumPIRDataExamples.onboarding.content,
          dismiss: noop("freemiumPIRBanner_dismiss"),
          action: noop("freemiumPIRBanner_action")
        }
      )
    },
    "freemiumPIR.scan_results": {
      factory: () => /* @__PURE__ */ g(
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
  init_utils2();
  init_NextStepsCard();
  init_NextStepsGroup();
  var nextStepsExamples = {
    "next-steps.cardGroup.all": {
      factory: () => /* @__PURE__ */ g(
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
      factory: () => /* @__PURE__ */ g(
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
      factory: () => /* @__PURE__ */ g(
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
      factory: () => /* @__PURE__ */ g(
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
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "bringStuff", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.duckplayer": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "duckplayer", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.defaultApp": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "defaultApp", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.emailProtection": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "emailProtection", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.blockCookies": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "blockCookies", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.addAppToDockMac": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "addAppToDockMac", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.pinToTaskbarWindows": {
      factory: () => /* @__PURE__ */ g(NextStepsCard, { type: "pinAppToTaskbarWindows", dismiss: noop("dismiss"), action: noop("action") })
    },
    "next-steps.bubble": {
      factory: () => /* @__PURE__ */ g(NextStepsBubbleHeader, null)
    }
  };

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.examples.js
  init_preact_module();

  // pages/new-tab/app/privacy-stats/mocks/PrivacyStatsMockProvider.js
  init_hooks_module();
  init_preact_module();
  init_PrivacyStatsProvider();

  // pages/new-tab/app/privacy-stats/mocks/stats.js
  init_constants3();
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
    onlyother: {
      totalCount: 2,
      trackerCompanies: [
        {
          displayName: DDG_STATS_OTHER_COMPANY_IDENTIFIER,
          count: 2
        }
      ]
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
    return /* @__PURE__ */ g(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ g(PrivacyStatsDispatchContext.Provider, { value: send }, children));
  }

  // pages/new-tab/app/privacy-stats/components/PrivacyStats.examples.js
  init_PrivacyStats2();
  var privacyStatsExamples = {
    "stats.few": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsMockProvider, { ticker: true }, /* @__PURE__ */ g(PrivacyStatsConsumer, null))
    },
    "stats.few.collapsed": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsMockProvider, { config: { expansion: "collapsed" } }, /* @__PURE__ */ g(PrivacyStatsConsumer, null))
    },
    "stats.single": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsMockProvider, { data: stats.single }, /* @__PURE__ */ g(PrivacyStatsConsumer, null))
    },
    "stats.none": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsMockProvider, { data: stats.none }, /* @__PURE__ */ g(PrivacyStatsConsumer, null))
    },
    "stats.norecent": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsMockProvider, { data: stats.norecent }, /* @__PURE__ */ g(PrivacyStatsConsumer, null))
    },
    "stats.list": {
      factory: () => /* @__PURE__ */ g(PrivacyStatsBody, { trackerCompanies: stats.few.trackerCompanies, listAttrs: { id: "example-stats.list" } })
    }
  };
  var otherPrivacyStatsExamples = {
    "stats.without-animation": {
      factory: () => /* @__PURE__ */ g(
        PrivacyStatsMockProvider,
        {
          ticker: true,
          config: {
            expansion: "expanded",
            animation: { kind: "none" }
          }
        },
        /* @__PURE__ */ g(PrivacyStatsConsumer, null)
      )
    },
    "stats.with-view-transitions": {
      factory: () => /* @__PURE__ */ g(
        PrivacyStatsMockProvider,
        {
          ticker: true,
          config: {
            expansion: "expanded",
            animation: { kind: "view-transitions" }
          }
        },
        /* @__PURE__ */ g(PrivacyStatsConsumer, null)
      )
    }
  };

  // pages/new-tab/app/remote-messaging-framework/components/RMF.examples.js
  init_preact_module();
  init_utils2();
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
      factory: () => /* @__PURE__ */ g(RemoteMessagingFramework, { message: rmfDataExamples.small.content, dismiss: noop("rmf_dismiss") })
    },
    "rmf.medium": {
      factory: () => /* @__PURE__ */ g(RemoteMessagingFramework, { message: rmfDataExamples.medium.content, dismiss: noop("rmf_dismiss") })
    },
    "rmf.big-single-action": {
      factory: () => /* @__PURE__ */ g(
        RemoteMessagingFramework,
        {
          message: rmfDataExamples.big_single_action.content,
          primaryAction: noop("rmf_primaryAction"),
          dismiss: noop("rmf_dismiss")
        }
      )
    },
    "rmf.big-two-action": {
      factory: () => /* @__PURE__ */ g(
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
      factory: () => /* @__PURE__ */ g(
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
  init_utils2();
  var updateNotificationExamples = {
    "updateNotification.empty": {
      factory: () => {
        return /* @__PURE__ */ g(UpdateNotification, { notes: [], version: "1.2.3", dismiss: noop("dismiss!") });
      }
    },
    "updateNotification.populated": {
      factory: () => {
        return /* @__PURE__ */ g(UpdateNotification, { notes: ["Bug Fixed and Updates"], version: "1.2.3", dismiss: noop("dismiss!") });
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
  init_themes();
  init_signals_module();
  init_BackgroundProvider();
  init_CustomizerProvider();
  var url = new URL(window.location.href);
  var list = {
    ...mainExamples,
    ...otherExamples
  };
  var entries3 = Object.entries(list);
  function Components() {
    const ids = url.searchParams.getAll("id");
    const isolated = url.searchParams.has("isolate");
    const e2e = url.searchParams.has("e2e");
    const entryIds = entries3.map(([id]) => id);
    const validIds = ids.filter((id) => entryIds.includes(id));
    const filtered = validIds.length ? validIds.map((id) => (
      /** @type {const} */
      [id, list[id]]
    )) : entries3;
    const data = {
      background: { kind: "default" },
      userImages: [],
      theme: "system",
      userColor: null
    };
    const dataSignal = useSignal(data);
    const { main, browser } = useThemes(dataSignal);
    return /* @__PURE__ */ g(CustomizerThemesContext.Provider, { value: { main, browser } }, /* @__PURE__ */ g("div", { class: Components_default.main, "data-main-scroller": true, "data-theme": main }, /* @__PURE__ */ g(BackgroundConsumer, { browser }), /* @__PURE__ */ g("div", { "data-content-tube": true, class: Components_default.contentTube }, isolated && /* @__PURE__ */ g(Isolated, { entries: filtered, e2e }), !isolated && /* @__PURE__ */ g(k, null, /* @__PURE__ */ g(DebugBar, { id: ids[0], ids, entries: entries3 }), /* @__PURE__ */ g(Stage, { entries: (
      /** @type {any} */
      filtered
    ) })))));
  }
  function Stage({ entries: entries4 }) {
    return /* @__PURE__ */ g("div", { class: Components_default.componentList, "data-testid": "stage" }, entries4.map(([id, item]) => {
      const next = new URL(url);
      next.searchParams.set("isolate", "true");
      next.searchParams.set("id", id);
      const selected = new URL(url);
      selected.searchParams.set("id", id);
      const e2e = new URL(url);
      e2e.searchParams.set("isolate", "true");
      e2e.searchParams.set("id", id);
      e2e.searchParams.set("e2e", "true");
      const without = new URL(url);
      const current = without.searchParams.getAll("id");
      const others = current.filter((x5) => x5 !== id);
      const matching = current.filter((x5) => x5 === id);
      const matchingMinus1 = matching.length === 1 ? [] : matching.slice(0, -1);
      without.searchParams.delete("id");
      for (let string of [...others, ...matchingMinus1]) {
        without.searchParams.append("id", string);
      }
      return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("div", { class: Components_default.itemInfo }, /* @__PURE__ */ g("div", { class: Components_default.itemLinks }, /* @__PURE__ */ g("code", null, id), /* @__PURE__ */ g("a", { href: next.toString(), target: "_blank", title: "open in new tab" }, "Open \u{1F517}"), " ", /* @__PURE__ */ g("a", { href: without.toString(), hidden: current.length === 0 }, "Remove")), /* @__PURE__ */ g("div", { class: Components_default.itemLinks }, /* @__PURE__ */ g("a", { href: selected.toString(), class: Components_default.itemLink, title: "show this component only" }, "select"), " ", /* @__PURE__ */ g("a", { href: next.toString(), target: "_blank", class: Components_default.itemLink, title: "isolate this component" }, "isolate"), " ", /* @__PURE__ */ g("a", { href: e2e.toString(), target: "_blank", class: Components_default.itemLink, title: "isolate this component" }, "edge-to-edge"))), /* @__PURE__ */ g("div", { className: Components_default.item, key: id }, item.factory()));
    }));
  }
  function Isolated({ entries: entries4, e2e }) {
    if (e2e) {
      return /* @__PURE__ */ g("div", null, entries4.map(([id, item]) => {
        return /* @__PURE__ */ g(k, { key: id }, item.factory());
      }));
    }
    return /* @__PURE__ */ g("div", { class: Components_default.componentList, "data-testid": "stage" }, entries4.map(([id, item], index) => {
      return /* @__PURE__ */ g("div", { key: id + index }, item.factory());
    }));
  }
  function DebugBar({ entries: entries4, id, ids }) {
    return /* @__PURE__ */ g("div", { class: Components_default.debugBar, "data-testid": "selector" }, /* @__PURE__ */ g(ExampleSelector, { entries: entries4, id }), ids.length > 0 && /* @__PURE__ */ g(Append, { entries: entries4, id }), /* @__PURE__ */ g(TextLength, null), /* @__PURE__ */ g(Isolate, null));
  }
  function TextLength() {
    function onClick() {
      url.searchParams.set("textLength", "1.5");
      window.location.href = url.toString();
    }
    function onReset() {
      url.searchParams.delete("textLength");
      window.location.href = url.toString();
    }
    return /* @__PURE__ */ g("div", { class: Components_default.buttonRow }, /* @__PURE__ */ g("button", { onClick: onReset, type: "button" }, "Text Length 1x"), /* @__PURE__ */ g("button", { onClick, type: "button" }, "Text Length 1.5x"));
  }
  function Isolate() {
    const next = new URL(url);
    next.searchParams.set("isolate", "true");
    return /* @__PURE__ */ g("div", { class: Components_default.buttonRow }, /* @__PURE__ */ g("a", { href: next.toString(), target: "_blank" }, "Isolate (open in a new tab)"));
  }
  function ExampleSelector({ entries: entries4, id }) {
    function onReset() {
      const url5 = new URL(window.location.href);
      url5.searchParams.delete("id");
      window.location.href = url5.toString();
    }
    function onChange(event) {
      if (!event.target) return;
      if (!(event.target instanceof HTMLSelectElement)) return;
      const selectedId = event.target.value;
      if (selectedId) {
        if (selectedId === "none") return onReset();
        const url5 = new URL(window.location.href);
        url5.searchParams.set("id", selectedId);
        window.location.href = url5.toString();
      }
    }
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("div", { class: Components_default.buttonRow }, /* @__PURE__ */ g("label", null, "Single:", " ", /* @__PURE__ */ g("select", { value: id || "none", onChange }, /* @__PURE__ */ g("option", { value: "none" }, "Select an example"), entries4.map(([id2]) => /* @__PURE__ */ g("option", { key: id2, value: id2 }, id2)))), /* @__PURE__ */ g("button", { onClick: onReset }, "RESET \u{1F501}")));
  }
  function Append({ entries: entries4, id }) {
    function onReset() {
      const url5 = new URL(window.location.href);
      url5.searchParams.delete("id");
      window.location.href = url5.toString();
    }
    function onSubmit(event) {
      if (!event.target) return;
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const value = data.get("add-id");
      if (typeof value !== "string") return;
      const url5 = new URL(window.location.href);
      url5.searchParams.append("id", value);
      window.location.href = url5.toString();
    }
    return /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("form", { class: Components_default.buttonRow, onSubmit }, /* @__PURE__ */ g("label", null, "Append:", " ", /* @__PURE__ */ g("select", { value: "none", name: "add-id" }, /* @__PURE__ */ g("option", { value: "none" }, "Select an example"), entries4.map(([id2]) => /* @__PURE__ */ g("option", { key: id2, value: id2 }, id2)))), /* @__PURE__ */ g("button", null, "Confirm")));
  }

  // shared/call-with-retry.js
  async function callWithRetry(fn2, params = {}) {
    const { maxAttempts = 10, intervalMs = 300 } = params;
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return { value: await fn2(), attempt };
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

  // pages/new-tab/app/index.js
  init_CustomizerProvider();

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
    /**
     * @param {import('../../types/new-tab.js').UserImageContextMenu} params
     */
    contextMenu(params) {
      this.ntp.messaging.notify("customizer_contextMenu", params);
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
    const didCatch = (message) => {
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
    D(
      /* @__PURE__ */ g(
        EnvironmentProvider,
        {
          debugState: environment.debugState,
          injectName: environment.injectName,
          willThrow: environment.willThrow,
          env: environment.env
        },
        /* @__PURE__ */ g(
          InlineErrorBoundary,
          {
            context: "App entry point",
            fallback: (message) => /* @__PURE__ */ g(AppLevelErrorBoundaryFallback, null, message)
          },
          /* @__PURE__ */ g(UpdateEnvironment, { search: window.location.search }),
          /* @__PURE__ */ g(MessagingContext.Provider, { value: messaging2 }, /* @__PURE__ */ g(InitialSetupContext.Provider, { value: init2 }, /* @__PURE__ */ g(TelemetryContext.Provider, { value: telemetry2 }, /* @__PURE__ */ g(SettingsProvider, { settings }, /* @__PURE__ */ g(TranslationProvider, { translationObject: strings, fallback: new_tab_default, textLength: environment.textLength }, /* @__PURE__ */ g(CustomizerProvider, { service: customizerApi, initialData: customizerData2 }, /* @__PURE__ */ g(
            WidgetConfigProvider,
            {
              api: widgetConfigAPI,
              widgetConfigs: init2.widgetConfigs,
              widgets: init2.widgets,
              entryPoints
            },
            /* @__PURE__ */ g(App, null)
          )))))))
        )
      ),
      root2
    );
  }
  async function getStrings(environment) {
    return environment.locale === "en" ? new_tab_default : await fetch(`./locales/${environment.locale}/new-tab.json`).then((x5) => x5.json()).catch((e5) => {
      console.error("Could not load locale", environment.locale, e5);
      return new_tab_default;
    });
  }
  function installGlobalSideEffects(environment, settings) {
    document.body.dataset.platformName = settings.platform.name;
    document.body.dataset.display = environment.display;
    document.body.dataset.animation = environment.urlParams.get("animation") || "";
  }
  async function resolveEntryPoints(widgets, didCatch) {
    try {
      const loaders = widgets.map((widget) => {
        return widgetEntryPoint(widget.id, didCatch).then((mod) => [widget.id, mod]);
      });
      const entryPoints = await Promise.all(loaders);
      return Object.fromEntries(entryPoints);
    } catch (e5) {
      const error = new Error("Error loading widget entry points:" + e5.message);
      didCatch(error.message);
      console.error(error);
      return {};
    }
  }
  function renderComponents(root2, environment, settings, strings) {
    $INTEGRATION: D(
      /* @__PURE__ */ g(EnvironmentProvider, { debugState: environment.debugState, injectName: environment.injectName, willThrow: environment.willThrow }, /* @__PURE__ */ g(SettingsProvider, { settings }, /* @__PURE__ */ g(TranslationProvider, { translationObject: strings, fallback: new_tab_default, textLength: environment.textLength }, /* @__PURE__ */ g(Components, null)))),
      root2
    );
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
      for (const [methodName, fn2] of Object.entries(this.config.methods)) {
        if (typeof fn2 !== "function") {
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
        } catch (e5) {
          reject(e5);
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
      } catch (e5) {
        if (e5 instanceof MissingHandler) {
          throw e5;
        } else {
          console.error("decryption failed", e5);
          console.error(e5);
          return { error: e5 };
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
      } catch (e5) {
        console.error(".notify failed", e5);
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
        } catch (e5) {
          unsub();
          reject(new Error("request failed to send: " + e5.message || "unknown error"));
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
    _tryCatch(fn2, context = "none") {
      try {
        return fn2();
      } catch (e5) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e5);
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
    } catch (e5) {
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

  // pages/new-tab/app/update-notification/mocks/update-notification.data.js
  var updateNotificationExamples2 = {
    empty: {
      content: {
        version: "1.65.0",
        notes: []
      }
    },
    populated: {
      content: {
        // prettier-ignore
        notes: [
          "\u2022 Bug fixes and improvements",
          "Optimized performance for faster load times"
        ],
        version: "1.91"
      }
    },
    multipleSections: {
      content: {
        // prettier-ignore
        notes: [
          `\u2022 We're excited to introduce a new browsing feature - Fire Windows. These special windows work the same way as normal windows, except they isolate your activity from other browsing data and self-destruct when closed. This means you can use a Fire Window to browse without saving local history or to sign into a site with a different account. You can open a new Fire Window anytime from the Fire Button menu.`,
          `\u2022 Try the new bookmark management view that opens in a tab for more robust bookmark organization.`,
          `For Privacy Pro subscribers`,
          `\u2022 VPN notifications are now available to help communicate VPN status.`,
          `\u2022 Some apps aren't compatible with VPNs. You can now exclude these apps to use them while connected to the VPN.`,
          `\u2022 Visit https://duckduckgo.com/pro for more information.`
        ],
        version: "0.98.4"
      }
    }
  };

  // pages/new-tab/app/mock-transport.js
  init_nextsteps_data();

  // pages/new-tab/app/customizer/mocks.js
  init_values();
  var url2 = new URL(window.location.href);
  function customizerMockTransport() {
    let channel;
    if (typeof globalThis.BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("ntp_customizer");
    }
    const subscriptions = /* @__PURE__ */ new Map();
    function broadcastHere(named, data) {
      setTimeout(() => {
        channel?.postMessage({
          subscriptionName: named,
          params: data
        });
      }, 100);
    }
    channel?.addEventListener("message", (msg) => {
      if (msg.data.subscriptionName) {
        const cb = subscriptions.get(msg.data.subscriptionName);
        if (!cb) return console.warn(`missing subscription for ${msg.data.subscriptionName}`);
        cb(msg.data.params);
      }
    });
    return new TestTransportConfig({
      notify(_msg) {
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          case "customizer_setTheme": {
            broadcastHere("customizer_onThemeUpdate", msg.params);
            return;
          }
          case "customizer_setBackground": {
            broadcastHere("customizer_onBackgroundUpdate", msg.params);
            if (msg.params.background.kind === "hex") {
              const userColorData = { userColor: msg.params.background };
              broadcastHere("customizer_onColorUpdate", userColorData);
            }
            return;
          }
          default: {
            console.warn("unhandled customizer notification", msg);
          }
        }
      },
      subscribe(_msg, cb) {
        const sub = (
          /** @type {any} */
          _msg.subscriptionName
        );
        switch (sub) {
          case "customizer_onColorUpdate":
          case "customizer_onThemeUpdate":
          case "customizer_onBackgroundUpdate":
          case "customizer_onImagesUpdate": {
            subscriptions.set(sub, cb);
            console.log("did add sub", sub);
            return () => {
              console.log("-- did remove sub", sub);
              return subscriptions.delete(sub);
            };
          }
        }
        return () => {
        };
      },
      // eslint-ignore-next-line require-await
      request(_msg) {
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          default: {
            return Promise.reject(new Error("unhandled request" + msg));
          }
        }
      }
    });
  }
  function customizerData() {
    const customizer = {
      userImages: [],
      userColor: null,
      theme: "system",
      background: { kind: "default" }
    };
    if (url2.searchParams.has("background")) {
      const value = url2.searchParams.get("background");
      if (value && value in values.colors) {
        customizer.background = {
          kind: "color",
          value: (
            /** @type {import('../../types/new-tab').PredefinedColor} */
            value
          )
        };
      } else if (value && value in values.gradients) {
        customizer.background = {
          kind: "gradient",
          value: (
            /** @type {import('../../types/new-tab').PredefinedGradient} */
            value
          )
        };
      } else if (value && value.startsWith("hex:")) {
        const hex = value.slice(4);
        if (hex.length === 6 || hex.length === 8) {
          customizer.background = {
            kind: "hex",
            value: `#${hex.slice(0, 6)}`
          };
        } else {
          console.warn("invalid hex values");
        }
      } else if (value && value.startsWith("userImage:")) {
        const image = value.slice(10);
        if (image in values.userImages) {
          customizer.background = {
            kind: "userImage",
            value: values.userImages[image]
          };
        } else {
          console.warn("unknown user image");
        }
      } else if (value && value === "default") {
        customizer.background = { kind: "default" };
      }
    }
    if (url2.searchParams.has("userImages")) {
      customizer.userImages = [values.userImages["01"], values.userImages["02"], values.userImages["03"]];
      if (url2.searchParams.get("willThrowPageException") === "userImages") {
        customizer.userImages[0] = {
          ...customizer.userImages[0],
          id: "__will_throw__"
        };
      }
    }
    if (url2.searchParams.has("userColor")) {
      const hex = `#` + url2.searchParams.get("userColor");
      customizer.userColor = { kind: "hex", value: hex };
    }
    if (url2.searchParams.has("theme")) {
      const value = url2.searchParams.get("theme");
      if (value === "light" || value === "dark" || value === "system") {
        customizer.theme = value;
      }
    }
    return customizer;
  }

  // pages/new-tab/app/activity/mocks/activity.mocks.js
  var activityMocks = {
    empty: {
      activity: []
    },
    onlyTopLevel: {
      activity: [
        {
          favicon: { src: "selco-icon.png" },
          url: "https://example.com",
          title: "example.com",
          etldPlusOne: "example.com",
          favorite: false,
          trackersFound: false,
          trackingStatus: {
            trackerCompanies: [],
            totalCount: 0
          },
          history: []
        }
      ]
    },
    few: {
      activity: [
        {
          favicon: { src: "selco-icon.png" },
          url: "https://example.com",
          title: "example.com",
          etldPlusOne: "example.com",
          favorite: false,
          trackersFound: true,
          trackingStatus: {
            trackerCompanies: [{ displayName: "Google" }, { displayName: "Facebook" }, { displayName: "Amazon" }],
            totalCount: 56
          },
          history: [
            {
              title: "/bathrooms/toilets",
              url: "https://example.com/bathrooms/toilets",
              relativeTime: "Just now"
            },
            {
              title: "/kitchen/sinks",
              url: "https://example.com/kitchen/sinks",
              relativeTime: "50 mins ago"
            },
            {
              title: "/gardening/tools",
              url: "https://example.com/gardening/tools",
              relativeTime: "18 hrs ago"
            },
            {
              title: "/lighting/fixtures",
              url: "https://example.com/lighting/fixtures",
              relativeTime: "1 day ago"
            }
          ]
        },
        {
          favicon: { src: "youtube-icon.png" },
          url: "https://fireproof.youtube.com",
          title: "youtube.com",
          etldPlusOne: "youtube.com",
          favorite: true,
          trackersFound: true,
          trackingStatus: {
            trackerCompanies: [
              { displayName: "Google" },
              { displayName: "Facebook" },
              { displayName: "Amazon" },
              { displayName: "Twitter" }
            ],
            totalCount: 89
          },
          history: [
            {
              title: "Great Video on YouTube",
              url: "https://youtube.com/watch?v=123",
              relativeTime: "3 days ago"
            }
          ]
        },
        {
          favicon: { src: "amazon-icon.png" },
          url: "https://amazon.com",
          title: "amazon.com",
          etldPlusOne: "amazon.com",
          favorite: false,
          trackersFound: true,
          trackingStatus: {
            trackerCompanies: [{ displayName: "Adobe Analytics" }, { displayName: "Facebook" }],
            totalCount: 12
          },
          history: [
            {
              title: "Electronics Store",
              url: "https://amazon.com/electronics",
              relativeTime: "1 day ago"
            }
          ]
        },
        {
          favicon: { src: "twitter-icon.png" },
          url: "https://twitter.com",
          title: "twitter.com",
          etldPlusOne: "twitter.com",
          favorite: false,
          trackersFound: true,
          trackingStatus: {
            trackerCompanies: [],
            totalCount: 0
          },
          history: [
            {
              title: "Trending Topics",
              url: "https://twitter.com/explore",
              relativeTime: "2 days ago"
            }
          ]
        },
        {
          favicon: { src: "linkedin-icon.png" },
          url: "https://linkedin.com",
          title: "app.linkedin.com",
          etldPlusOne: "linkedin.com",
          favorite: false,
          trackersFound: false,
          trackingStatus: {
            trackerCompanies: [],
            totalCount: 0
          },
          history: [
            {
              title: "Profile Page",
              url: "https://linkedin.com/in/user-profile",
              relativeTime: "2 hrs ago"
            }
          ]
        }
      ]
    }
  };

  // pages/new-tab/app/activity/mocks/activity.mock-transport.js
  var url3 = typeof window !== "undefined" ? new URL(window.location.href) : new URL("https://example.com");
  function activityMockTransport() {
    let dataset = structuredClone(activityMocks.few);
    if (url3.searchParams.has("activity")) {
      const key = url3.searchParams.get("activity");
      if (key && key in activityMocks) {
        console.log("setting dataset to", key, activityMocks[key]);
        dataset = structuredClone(activityMocks[key]);
      }
    }
    const subs = /* @__PURE__ */ new Map();
    return new TestTransportConfig({
      notify(_msg) {
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
      subscribe(_msg, cb) {
        const sub = (
          /** @type {any} */
          _msg.subscriptionName
        );
        if (sub === "activity_onBurnComplete") {
          subs.set("activity_onBurnComplete", cb);
          return () => {
            subs.delete("activity_onBurnComplete");
          };
        }
        if (sub === "activity_onDataUpdate") {
          subs.set("activity_onDataUpdate", cb);
        }
        if (sub === "activity_onDataUpdate" && url3.searchParams.has("flood")) {
          let count = 0;
          const int = setInterval(() => {
            if (count === 10) return clearInterval(int);
            if (count < 5) {
              dataset.activity.push({
                url: `https://${count}.example.com`,
                etldPlusOne: "example.com",
                favicon: null,
                history: [],
                favorite: false,
                trackersFound: false,
                trackingStatus: { trackerCompanies: [], totalCount: 0 },
                title: "example.com"
              });
            } else {
              dataset.activity.pop();
            }
            count += 1;
            cb(dataset);
          }, 1e3);
          return () => {
          };
        }
        if (sub === "activity_onDataUpdate" && url3.searchParams.has("nested")) {
          let count = 0;
          const int = setInterval(() => {
            if (count === 10) return clearInterval(int);
            dataset.activity[1].history.push({
              url: `https://${count}.example.com`,
              title: "example.com",
              relativeTime: "just now"
            });
            count += 1;
            cb(dataset);
          }, 500);
          return () => {
          };
        }
        console.warn("unhandled sub", sub);
        return () => {
        };
      },
      // eslint-ignore-next-line require-await
      request(_msg) {
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          case "activity_confirmBurn": {
            const url5 = msg.params.url;
            let response = { action: "burn" };
            if (!window.__playwright_01) {
              const fireproof = url5.startsWith("https://fireproof.");
              if (fireproof) {
                if (!confirm("are you sure?")) {
                  response = { action: "none" };
                }
              }
            }
            if (response.action === "burn" && !window.__playwright_01) {
              setTimeout(() => {
                const cb = subs.get("activity_onDataUpdate");
                console.log("will send updated data after 500ms", url5);
                const next = activityMocks.few.activity.filter((x5) => x5.url !== url5);
                cb?.({ activity: next });
              }, 500);
              setTimeout(() => {
                const cb = subs.get("activity_onBurnComplete");
                console.log("will send updated data after 600ms", url5);
                cb?.();
              }, 600);
            }
            return Promise.resolve(response);
          }
          case "activity_getData":
            return Promise.resolve(dataset);
          case "activity_getConfig": {
            const config = {
              expansion: "expanded"
            };
            return Promise.resolve(config);
          }
          default: {
            return Promise.reject(new Error("unhandled request" + msg));
          }
        }
      }
    });
  }

  // pages/new-tab/app/mock-transport.js
  var VERSION_PREFIX = "__ntp_30__.";
  var url4 = new URL(window.location.href);
  function mockTransport() {
    let channel;
    if (typeof globalThis.BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("ntp");
    }
    const subscriptions = /* @__PURE__ */ new Map();
    if ("__playwright_01" in window) {
      window.__playwright_01.publishSubscriptionEvent = (evt) => {
        const matchingCallback = subscriptions.get(evt.subscriptionName);
        if (!matchingCallback) return console.error("no matching callback for subscription", evt);
        matchingCallback(evt.params);
      };
    }
    function broadcast(named) {
      setTimeout(() => {
        channel?.postMessage({
          change: named
        });
      }, 100);
    }
    function read(name) {
      try {
        if (url4.searchParams.has("skip-read")) {
          console.warn("not reading from localstorage, because skip-read was in the search");
          return null;
        }
        const item = localStorage.getItem(VERSION_PREFIX + name);
        if (!item) return null;
        return JSON.parse(item);
      } catch (e5) {
        console.error("Failed to parse initialSetup from localStorage", e5);
        return null;
      }
    }
    function write(name, value) {
      try {
        if (url4.searchParams.has("skip-write")) {
          console.warn("not writing to localstorage, because skip-write was in the search");
          return;
        }
        localStorage.setItem(VERSION_PREFIX + name, JSON.stringify(value));
      } catch (e5) {
        console.error("Failed to write", e5);
      }
    }
    const rmfSubscriptions = /* @__PURE__ */ new Map();
    const freemiumPIRBannerSubscriptions = /* @__PURE__ */ new Map();
    function clearRmf() {
      const listeners = rmfSubscriptions.get("rmf_onDataUpdate") || [];
      const message = { content: void 0 };
      for (const listener of listeners) {
        listener(message);
      }
    }
    const transports = {
      customizer: customizerMockTransport(),
      activity: activityMockTransport()
    };
    return new TestTransportConfig({
      notify(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        const [namespace] = msg.method.split("_");
        if (namespace in transports) {
          transports[namespace]?.impl.notify(_msg);
          return;
        }
        switch (msg.method) {
          case "widgets_setConfig": {
            if (!msg.params) throw new Error("unreachable");
            write("widget_config", msg.params);
            broadcast("widget_config");
            return;
          }
          case "stats_setConfig": {
            if (!msg.params) throw new Error("unreachable");
            const { animation, ...rest } = msg.params;
            write("stats_config", rest);
            broadcast("stats_config");
            return;
          }
          case "rmf_primaryAction": {
            console.log("ignoring rmf_primaryAction", msg.params);
            clearRmf();
            return;
          }
          case "rmf_secondaryAction": {
            console.log("ignoring rmf_secondaryAction", msg.params);
            clearRmf();
            return;
          }
          case "rmf_dismiss": {
            console.log("ignoring rmf_dismiss", msg.params);
            return;
          }
          case "freemiumPIRBanner_action": {
            console.log("ignoring freemiumPIRBanner_action", msg.params);
            return;
          }
          case "freemiumPIRBanner_dismiss": {
            console.log("ignoring freemiumPIRBanner_dismiss", msg.params);
            return;
          }
          case "favorites_setConfig": {
            if (!msg.params) throw new Error("unreachable");
            const { animation, ...rest } = msg.params;
            write("favorites_config", rest);
            broadcast("favorites_config");
            return;
          }
          case "favorites_move": {
            if (!msg.params) throw new Error("unreachable");
            const { id, targetIndex } = msg.params;
            const data = read("favorites_data");
            if (Array.isArray(data?.favorites)) {
              const favorites2 = reorderArray(data.favorites, id, targetIndex);
              write("favorites_data", { favorites: favorites2 });
              broadcast("favorites_data");
            }
            return;
          }
          case "favorites_openContextMenu": {
            if (!msg.params) throw new Error("unreachable");
            console.log("mock: ignoring favorites_openContextMenu", msg.params);
            return;
          }
          case "favorites_add": {
            console.log("mock: ignoring favorites_add");
            return;
          }
          default: {
            console.warn("unhandled notification", msg);
          }
        }
      },
      subscribe(_msg, cb) {
        const sub = (
          /** @type {any} */
          _msg.subscriptionName
        );
        if ("__playwright_01" in window) {
          window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
          subscriptions.set(sub, cb);
          return () => {
            subscriptions.delete(sub);
          };
        }
        const [namespace] = sub.split("_");
        if (namespace in transports) {
          return transports[namespace]?.impl.subscribe(_msg, cb);
        }
        switch (sub) {
          case "widgets_onConfigUpdated": {
            const controller = new AbortController();
            channel?.addEventListener(
              "message",
              (msg) => {
                if (msg.data.change === "widget_config") {
                  const values2 = read("widget_config");
                  if (values2) {
                    cb(values2);
                  }
                }
              },
              { signal: controller.signal }
            );
            return () => controller.abort();
          }
          case "stats_onConfigUpdate": {
            const controller = new AbortController();
            channel?.addEventListener(
              "message",
              (msg) => {
                if (msg.data.change === "stats_config") {
                  const values2 = read("stats_config");
                  if (values2) {
                    cb(values2);
                  }
                }
              },
              { signal: controller.signal }
            );
            return () => controller.abort();
          }
          case "freemiumPIRBanner_onDataUpdate": {
            const prev = freemiumPIRBannerSubscriptions.get("freemiumPIRBanner_onDataUpdate") || [];
            const next = [...prev];
            next.push(cb);
            freemiumPIRBannerSubscriptions.set("freemiumPIRBanner_onDataUpdate", next);
            const freemiumPIRBannerParam = url4.searchParams.get("pir");
            if (freemiumPIRBannerParam !== null && freemiumPIRBannerParam in freemiumPIRDataExamples) {
              const message = freemiumPIRDataExamples[freemiumPIRBannerParam];
              cb(message);
            }
            return () => {
            };
          }
          case "rmf_onDataUpdate": {
            const prev = rmfSubscriptions.get("rmf_onDataUpdate") || [];
            const next = [...prev];
            next.push(cb);
            rmfSubscriptions.set("rmf_onDataUpdate", next);
            const delay = url4.searchParams.get("rmf-delay");
            const rmfParam = url4.searchParams.get("rmf");
            if (delay !== null && rmfParam !== null && rmfParam in rmfDataExamples) {
              const ms = parseInt(delay, 10);
              const timeout = setTimeout(() => {
                const message = rmfDataExamples[rmfParam];
                cb(message);
              }, ms);
              return () => clearTimeout(timeout);
            }
            return () => {
            };
          }
          case "updateNotification_onDataUpdate": {
            const update = url4.searchParams.get("update-notification");
            const delay = url4.searchParams.get("update-notification-delay");
            if (update && delay && update in updateNotificationExamples2) {
              const ms = parseInt(delay, 10);
              const timeout = setTimeout(() => {
                const message = updateNotificationExamples2[update];
                cb(message);
              }, ms);
              return () => clearTimeout(timeout);
            }
            return () => {
            };
          }
          case "favorites_onDataUpdate": {
            const controller = new AbortController();
            channel?.addEventListener(
              "message",
              (msg) => {
                if (msg.data.change === "favorites_data") {
                  const values2 = read("favorites_data");
                  if (values2) {
                    cb(values2);
                  }
                }
              },
              { signal: controller.signal }
            );
            return () => controller.abort();
          }
          case "stats_onDataUpdate": {
            const statsVariant = url4.searchParams.get("stats");
            const count = url4.searchParams.get("stats-update-count");
            const updateMaxCount = parseInt(count || "0");
            if (updateMaxCount === 0) return () => {
            };
            if (statsVariant === "willUpdate") {
              let inc = 1;
              const max = Math.min(updateMaxCount, 10);
              const int = setInterval(() => {
                if (inc === max) return clearInterval(int);
                const next = {
                  ...stats.willUpdate,
                  trackerCompanies: stats.willUpdate.trackerCompanies.map((x5, index) => {
                    return {
                      ...x5,
                      count: x5.count + inc * index
                    };
                  })
                };
                cb(next);
                inc++;
              }, 500);
              return () => {
                clearInterval(int);
              };
            } else if (statsVariant === "growing") {
              const list2 = stats.many.trackerCompanies;
              let index = 0;
              const max = Math.min(updateMaxCount, list2.length);
              const int = setInterval(() => {
                if (index === max) return clearInterval(int);
                console.log({ index, max });
                cb({
                  trackerCompanies: list2.slice(0, index + 1)
                });
                index++;
              }, 200);
              return () => {
              };
            } else {
              console.log(statsVariant);
              return () => {
              };
            }
          }
          case "favorites_onConfigUpdate": {
            const controller = new AbortController();
            channel?.addEventListener(
              "message",
              (msg) => {
                if (msg.data.change === "favorites_config") {
                  const values2 = read("favorites_config");
                  if (values2) {
                    cb(values2);
                  }
                }
              },
              { signal: controller.signal }
            );
            return () => controller.abort();
          }
        }
        return () => {
        };
      },
      // eslint-ignore-next-line require-await
      request(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        const [namespace] = msg.method.split("_");
        if (namespace in transports) {
          return transports[namespace]?.impl.request(_msg);
        }
        switch (msg.method) {
          case "stats_getData": {
            const statsVariant = url4.searchParams.get("stats");
            if (statsVariant && statsVariant in stats) {
              return Promise.resolve(stats[statsVariant]);
            }
            return Promise.resolve(stats.few);
          }
          case "stats_getConfig": {
            const defaultConfig = { expansion: "expanded", animation: { kind: "auto-animate" } };
            const fromStorage = read("stats_config") || defaultConfig;
            if (url4.searchParams.get("animation") === "none") {
              fromStorage.animation = { kind: "none" };
            }
            if (url4.searchParams.get("animation") === "view-transitions") {
              fromStorage.animation = { kind: "view-transitions" };
            }
            return Promise.resolve(fromStorage);
          }
          case "nextSteps_getConfig": {
            const config = { expansion: "collapsed" };
            return Promise.resolve(config);
          }
          case "nextSteps_getData": {
            let data = { content: null };
            const ids = url4.searchParams.getAll("next-steps");
            if (ids.length) {
              data = {
                content: ids.filter((id) => {
                  if (!(id in variants)) {
                    console.warn(`${id} missing in nextSteps data`);
                    return false;
                  }
                  return true;
                }).map((id) => {
                  return { id: (
                    /** @type {any} */
                    id
                  ) };
                })
              };
            }
            return Promise.resolve(data);
          }
          case "rmf_getData": {
            let message = { content: void 0 };
            const rmfParam = url4.searchParams.get("rmf");
            const delayed = url4.searchParams.has("rmf-delay");
            if (delayed) return Promise.resolve(message);
            if (rmfParam && rmfParam in rmfDataExamples) {
              message = rmfDataExamples[rmfParam];
            }
            return Promise.resolve(message);
          }
          case "freemiumPIRBanner_getData": {
            let freemiumPIRBannerMessage = { content: null };
            const freemiumPIRBannerParam = url4.searchParams.get("pir");
            if (freemiumPIRBannerParam && freemiumPIRBannerParam in freemiumPIRDataExamples) {
              freemiumPIRBannerMessage = freemiumPIRDataExamples[freemiumPIRBannerParam];
            }
            return Promise.resolve(freemiumPIRBannerMessage);
          }
          case "favorites_getData": {
            const param = url4.searchParams.get("favorites");
            let data;
            if (param && param in favorites) {
              data = favorites[param];
            } else {
              data = param ? gen(Number(url4.searchParams.get("favorites"))) : read("favorites_data") || favorites.many;
            }
            write("favorites_data", data);
            return Promise.resolve(data);
          }
          case "favorites_getConfig": {
            const defaultConfig = { expansion: "collapsed", animation: { kind: "none" } };
            const fromStorage = read("favorites_config") || defaultConfig;
            if (url4.searchParams.get("favorites.animation") === "view-transitions") {
              fromStorage.animation = { kind: "view-transitions" };
            }
            return Promise.resolve(fromStorage);
          }
          case "initialSetup": {
            const widgetsFromStorage = read("widgets") || [
              { id: "updateNotification" },
              { id: "rmf" },
              { id: "freemiumPIRBanner" },
              { id: "nextSteps" },
              { id: "favorites" }
            ];
            const widgetConfigFromStorage = read("widget_config") || [{ id: "favorites", visibility: "visible" }];
            let updateNotification = { content: null };
            const isDelayed = url4.searchParams.has("update-notification-delay");
            if (!isDelayed && url4.searchParams.has("update-notification")) {
              const value = url4.searchParams.get("update-notification");
              if (value && value in updateNotificationExamples2) {
                updateNotification = updateNotificationExamples2[value];
              }
            }
            const initial = {
              widgets: widgetsFromStorage,
              widgetConfigs: widgetConfigFromStorage,
              platform: { name: "integration" },
              env: "development",
              locale: "en",
              updateNotification
            };
            const feed = url4.searchParams.get("feed") || "stats";
            if (feed === "stats" || feed === "both") {
              widgetsFromStorage.push({ id: "privacyStats" });
              widgetConfigFromStorage.push({ id: "privacyStats", visibility: "visible" });
            }
            if (feed === "activity" || feed === "both") {
              widgetsFromStorage.push({ id: "activity" });
              widgetConfigFromStorage.push({ id: "activity", visibility: "visible" });
            }
            const settings = {};
            if (url4.searchParams.get("customizerDrawer") === "enabled") {
              settings.customizerDrawer = { state: "enabled" };
              if (url4.searchParams.get("autoOpen") === "true") {
                settings.customizerDrawer.autoOpen = true;
              }
              initial.customizer = customizerData();
            }
            initial.settings = settings;
            return Promise.resolve(initial);
          }
          default: {
            return Promise.reject(new Error("unhandled request" + msg));
          }
        }
      }
    });
  }
  function reorderArray(array, id, toIndex) {
    const fromIndex = array.findIndex((item) => item.id === id);
    const element = array.splice(fromIndex, 1)[0];
    array.splice(toIndex, 0, element);
    return array;
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
      if (!params || !("message" in params) || typeof params.message !== "string") {
        console.trace("reportPageException INCORRECT params", params);
        return this.messaging.notify("reportPageException", { message: "an unknown error was reported" });
      }
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
     * Sent when a right-click occurs, and wasn't intercepted by another widget
     * @param {import('../types/new-tab.ts').OpenAction} params
     */
    open(params) {
      this.messaging.notify("open", params);
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
  var baseEnvironment = new Environment().withInjectName("integration").withEnv("production");
  var rawMessaging = createSpecialPageMessaging({
    injectName: "integration",
    env: "production",
    pageName: "newTabPage",
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration") return null;
      let mock = null;
      $INTEGRATION: mock = mockTransport();
      return mock;
    }
  });
  var { messaging, telemetry } = install(rawMessaging);
  var newTabMessaging = new NewTabPage(messaging, "integration");
  var root = document.querySelector("#app");
  if (!root) {
    document.documentElement.dataset.fatalError = "true";
    D("Fatal: #app missing", document.body);
    throw new Error("Missing #app");
  }
  init(root, newTabMessaging, telemetry, baseEnvironment).catch((e5) => {
    console.error(e5);
    const msg = typeof e5?.message === "string" ? e5.message : "unknown init error";
    newTabMessaging.reportInitException(msg);
    document.documentElement.dataset.fatalError = "true";
    const element = /* @__PURE__ */ g(k, null, /* @__PURE__ */ g("div", { style: "padding: 1rem;" }, /* @__PURE__ */ g("p", null, /* @__PURE__ */ g("strong", null, "A fatal error occurred:")), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g("pre", { style: { whiteSpace: "prewrap", overflow: "auto" } }, /* @__PURE__ */ g("code", null, JSON.stringify({ message: e5.message }, null, 2))), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g("p", null, /* @__PURE__ */ g("strong", null, "Telemetry")), /* @__PURE__ */ g("br", null), /* @__PURE__ */ g("pre", { style: { whiteSpace: "prewrap", overflow: "auto", fontSize: ".8em" } }, /* @__PURE__ */ g("code", null, JSON.stringify(telemetry.eventStore, null, 2)))));
    D(element, document.body);
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
