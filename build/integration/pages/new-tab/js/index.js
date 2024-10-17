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
        var nativeCodeString = "[native code]";
        function classNames() {
          var classes = [];
          for (var i4 = 0; i4 < arguments.length; i4++) {
            var arg = arguments[i4];
            if (!arg)
              continue;
            var argType = typeof arg;
            if (argType === "string" || argType === "number") {
              classes.push(arg);
            } else if (Array.isArray(arg)) {
              if (arg.length) {
                var inner = classNames.apply(null, arg);
                if (inner) {
                  classes.push(inner);
                }
              }
            } else if (argType === "object") {
              if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
                classes.push(arg.toString());
                continue;
              }
              for (var key in arg) {
                if (hasOwn.call(arg, key) && arg[key]) {
                  classes.push(key);
                }
              }
            }
          }
          return classes.join(" ");
        }
        if (typeof module !== "undefined" && module.exports) {
          classNames.default = classNames;
          module.exports = classNames;
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
    for (var u3 in l3)
      n2[u3] = l3[u3];
    return n2;
  }
  function w(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u3, t3) {
    var i4, o3, r3, f3 = {};
    for (r3 in u3)
      "key" == r3 ? i4 = u3[r3] : "ref" == r3 ? o3 = u3[r3] : f3[r3] = u3[r3];
    if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps)
      for (r3 in l3.defaultProps)
        void 0 === f3[r3] && (f3[r3] = l3.defaultProps[r3]);
    return g(l3, f3, i4, o3, null);
  }
  function g(n2, t3, i4, o3, r3) {
    var f3 = { type: n2, props: t3, key: i4, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r3 ? ++u : r3, __i: -1, __u: 0 };
    return null == r3 && null != l.vnode && l.vnode(f3), f3;
  }
  function b(n2) {
    return n2.children;
  }
  function k(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function x(n2, l3) {
    if (null == l3)
      return n2.__ ? x(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e)
        return u3.__e;
    return "function" == typeof n2.type ? x(n2) : null;
  }
  function C(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
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
    for (i.sort(f); n2 = i.shift(); )
      n2.__d && (u3 = i.length, o3 = void 0, e3 = (r3 = (t3 = n2).__v).__e, c3 = [], s3 = [], t3.__P && ((o3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(o3), O(t3.__P, o3, r3, t3.__n, t3.__P.namespaceURI, 32 & r3.__u ? [e3] : null, c3, null == e3 ? x(r3) : e3, !!(32 & r3.__u), s3), o3.__v = r3.__v, o3.__.__k[o3.__i] = o3, j(c3, o3, s3), o3.__e != e3 && C(o3)), i.length > u3 && i.sort(f));
    M.__r = 0;
  }
  function P(n2, l3, u3, t3, i4, o3, r3, f3, e3, c3, s3) {
    var a3, p3, y3, d3, w3, _2 = t3 && t3.__k || v, g3 = l3.length;
    for (u3.__d = e3, $(u3, l3, _2), e3 = u3.__d, a3 = 0; a3 < g3; a3++)
      null != (y3 = u3.__k[a3]) && (p3 = -1 === y3.__i ? h : _2[y3.__i] || h, y3.__i = a3, O(n2, y3, p3, i4, o3, r3, f3, e3, c3, s3), d3 = y3.__e, y3.ref && p3.ref != y3.ref && (p3.ref && N(p3.ref, null, y3), s3.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), 65536 & y3.__u || p3.__k === y3.__k ? e3 = I(y3, e3, n2) : "function" == typeof y3.type && void 0 !== y3.__d ? e3 = y3.__d : d3 && (e3 = d3.nextSibling), y3.__d = void 0, y3.__u &= -196609);
    u3.__d = e3, u3.__e = w3;
  }
  function $(n2, l3, u3) {
    var t3, i4, o3, r3, f3, e3 = l3.length, c3 = u3.length, s3 = c3, a3 = 0;
    for (n2.__k = [], t3 = 0; t3 < e3; t3++)
      null != (i4 = l3[t3]) && "boolean" != typeof i4 && "function" != typeof i4 ? (r3 = t3 + a3, (i4 = n2.__k[t3] = "string" == typeof i4 || "number" == typeof i4 || "bigint" == typeof i4 || i4.constructor == String ? g(null, i4, null, null, null) : y(i4) ? g(b, { children: i4 }, null, null, null) : void 0 === i4.constructor && i4.__b > 0 ? g(i4.type, i4.props, i4.key, i4.ref ? i4.ref : null, i4.__v) : i4).__ = n2, i4.__b = n2.__b + 1, o3 = null, -1 !== (f3 = i4.__i = L(i4, u3, r3, s3)) && (s3--, (o3 = u3[f3]) && (o3.__u |= 131072)), null == o3 || null === o3.__v ? (-1 == f3 && a3--, "function" != typeof i4.type && (i4.__u |= 65536)) : f3 !== r3 && (f3 == r3 - 1 ? a3-- : f3 == r3 + 1 ? a3++ : (f3 > r3 ? a3-- : a3++, i4.__u |= 65536))) : i4 = n2.__k[t3] = null;
    if (s3)
      for (t3 = 0; t3 < c3; t3++)
        null != (o3 = u3[t3]) && 0 == (131072 & o3.__u) && (o3.__e == n2.__d && (n2.__d = x(o3)), V(o3, o3));
  }
  function I(n2, l3, u3) {
    var t3, i4;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i4 = 0; t3 && i4 < t3.length; i4++)
        t3[i4] && (t3[i4].__ = n2, l3 = I(t3[i4], l3, u3));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !u3.contains(l3) && (l3 = x(n2)), u3.insertBefore(n2.__e, l3 || null), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 === l3.nodeType);
    return l3;
  }
  function L(n2, l3, u3, t3) {
    var i4 = n2.key, o3 = n2.type, r3 = u3 - 1, f3 = u3 + 1, e3 = l3[u3];
    if (null === e3 || e3 && i4 == e3.key && o3 === e3.type && 0 == (131072 & e3.__u))
      return u3;
    if (t3 > (null != e3 && 0 == (131072 & e3.__u) ? 1 : 0))
      for (; r3 >= 0 || f3 < l3.length; ) {
        if (r3 >= 0) {
          if ((e3 = l3[r3]) && 0 == (131072 & e3.__u) && i4 == e3.key && o3 === e3.type)
            return r3;
          r3--;
        }
        if (f3 < l3.length) {
          if ((e3 = l3[f3]) && 0 == (131072 & e3.__u) && i4 == e3.key && o3 === e3.type)
            return f3;
          f3++;
        }
      }
    return -1;
  }
  function T(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || p.test(l3) ? u3 : u3 + "px";
  }
  function A(n2, l3, u3, t3, i4) {
    var o3;
    n:
      if ("style" === l3)
        if ("string" == typeof u3)
          n2.style.cssText = u3;
        else {
          if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
            for (l3 in t3)
              u3 && l3 in u3 || T(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              t3 && u3[l3] === t3[l3] || T(n2.style, l3, u3[l3]);
        }
      else if ("o" === l3[0] && "n" === l3[1])
        o3 = l3 !== (l3 = l3.replace(/(PointerCapture)$|Capture$/i, "$1")), l3 = l3.toLowerCase() in n2 || "onFocusOut" === l3 || "onFocusIn" === l3 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = e, n2.addEventListener(l3, o3 ? s : c, o3)) : n2.removeEventListener(l3, o3 ? s : c, o3);
      else {
        if ("http://www.w3.org/2000/svg" == i4)
          l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2)
          try {
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
        if (null == u3.t)
          u3.t = e++;
        else if (u3.t < t3.u)
          return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function O(n2, u3, t3, i4, o3, r3, f3, e3, c3, s3) {
    var a3, h3, v3, p3, w3, _2, g3, m2, x3, C3, S2, M2, $2, I2, H, L2, T3 = u3.type;
    if (void 0 !== u3.constructor)
      return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), r3 = [e3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n:
      if ("function" == typeof T3)
        try {
          if (m2 = u3.props, x3 = "prototype" in T3 && T3.prototype.render, C3 = (a3 = T3.contextType) && i4[a3.__c], S2 = a3 ? C3 ? C3.props.value : a3.__ : i4, t3.__c ? g3 = (h3 = u3.__c = t3.__c).__ = h3.__E : (x3 ? u3.__c = h3 = new T3(m2, S2) : (u3.__c = h3 = new k(m2, S2), h3.constructor = T3, h3.render = q), C3 && C3.sub(h3), h3.props = m2, h3.state || (h3.state = {}), h3.context = S2, h3.__n = i4, v3 = h3.__d = true, h3.__h = [], h3._sb = []), x3 && null == h3.__s && (h3.__s = h3.state), x3 && null != T3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, T3.getDerivedStateFromProps(m2, h3.__s))), p3 = h3.props, w3 = h3.state, h3.__v = u3, v3)
            x3 && null == T3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), x3 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
          else {
            if (x3 && null == T3.getDerivedStateFromProps && m2 !== p3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(m2, S2), !h3.__e && (null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(m2, h3.__s, S2) || u3.__v === t3.__v)) {
              for (u3.__v !== t3.__v && (h3.props = m2, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
                n3 && (n3.__ = u3);
              }), M2 = 0; M2 < h3._sb.length; M2++)
                h3.__h.push(h3._sb[M2]);
              h3._sb = [], h3.__h.length && f3.push(h3);
              break n;
            }
            null != h3.componentWillUpdate && h3.componentWillUpdate(m2, h3.__s, S2), x3 && null != h3.componentDidUpdate && h3.__h.push(function() {
              h3.componentDidUpdate(p3, w3, _2);
            });
          }
          if (h3.context = S2, h3.props = m2, h3.__P = n2, h3.__e = false, $2 = l.__r, I2 = 0, x3) {
            for (h3.state = h3.__s, h3.__d = false, $2 && $2(u3), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++)
              h3.__h.push(h3._sb[H]);
            h3._sb = [];
          } else
            do {
              h3.__d = false, $2 && $2(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
            } while (h3.__d && ++I2 < 25);
          h3.state = h3.__s, null != h3.getChildContext && (i4 = d(d({}, i4), h3.getChildContext())), x3 && !v3 && null != h3.getSnapshotBeforeUpdate && (_2 = h3.getSnapshotBeforeUpdate(p3, w3)), P(n2, y(L2 = null != a3 && a3.type === b && null == a3.key ? a3.props.children : a3) ? L2 : [L2], u3, t3, i4, o3, r3, f3, e3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && f3.push(h3), g3 && (h3.__E = h3.__ = null);
        } catch (n3) {
          if (u3.__v = null, c3 || null != r3) {
            for (u3.__u |= c3 ? 160 : 128; e3 && 8 === e3.nodeType && e3.nextSibling; )
              e3 = e3.nextSibling;
            r3[r3.indexOf(e3)] = null, u3.__e = e3;
          } else
            u3.__e = t3.__e, u3.__k = t3.__k;
          l.__e(n3, u3, t3);
        }
      else
        null == r3 && u3.__v === t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : u3.__e = z(t3.__e, u3, t3, i4, o3, r3, f3, c3, s3);
    (a3 = l.diffed) && a3(u3);
  }
  function j(n2, u3, t3) {
    u3.__d = void 0;
    for (var i4 = 0; i4 < t3.length; i4++)
      N(t3[i4], t3[++i4], t3[++i4]);
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
  function z(u3, t3, i4, o3, r3, f3, e3, c3, s3) {
    var a3, v3, p3, d3, _2, g3, m2, b2 = i4.props, k3 = t3.props, C3 = t3.type;
    if ("svg" === C3 ? r3 = "http://www.w3.org/2000/svg" : "math" === C3 ? r3 = "http://www.w3.org/1998/Math/MathML" : r3 || (r3 = "http://www.w3.org/1999/xhtml"), null != f3) {
      for (a3 = 0; a3 < f3.length; a3++)
        if ((_2 = f3[a3]) && "setAttribute" in _2 == !!C3 && (C3 ? _2.localName === C3 : 3 === _2.nodeType)) {
          u3 = _2, f3[a3] = null;
          break;
        }
    }
    if (null == u3) {
      if (null === C3)
        return document.createTextNode(k3);
      u3 = document.createElementNS(r3, C3, k3.is && k3), c3 && (l.__m && l.__m(t3, f3), c3 = false), f3 = null;
    }
    if (null === C3)
      b2 === k3 || c3 && u3.data === k3 || (u3.data = k3);
    else {
      if (f3 = f3 && n.call(u3.childNodes), b2 = i4.props || h, !c3 && null != f3)
        for (b2 = {}, a3 = 0; a3 < u3.attributes.length; a3++)
          b2[(_2 = u3.attributes[a3]).name] = _2.value;
      for (a3 in b2)
        if (_2 = b2[a3], "children" == a3)
          ;
        else if ("dangerouslySetInnerHTML" == a3)
          p3 = _2;
        else if (!(a3 in k3)) {
          if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3)
            continue;
          A(u3, a3, null, _2, r3);
        }
      for (a3 in k3)
        _2 = k3[a3], "children" == a3 ? d3 = _2 : "dangerouslySetInnerHTML" == a3 ? v3 = _2 : "value" == a3 ? g3 = _2 : "checked" == a3 ? m2 = _2 : c3 && "function" != typeof _2 || b2[a3] === _2 || A(u3, a3, _2, b2[a3], r3);
      if (v3)
        c3 || p3 && (v3.__html === p3.__html || v3.__html === u3.innerHTML) || (u3.innerHTML = v3.__html), t3.__k = [];
      else if (p3 && (u3.innerHTML = ""), P(u3, y(d3) ? d3 : [d3], t3, i4, o3, "foreignObject" === C3 ? "http://www.w3.org/1999/xhtml" : r3, f3, e3, f3 ? f3[0] : i4.__k && x(i4, 0), c3, s3), null != f3)
        for (a3 = f3.length; a3--; )
          w(f3[a3]);
      c3 || (a3 = "value", "progress" === C3 && null == g3 ? u3.removeAttribute("value") : void 0 !== g3 && (g3 !== u3[a3] || "progress" === C3 && !g3 || "option" === C3 && g3 !== b2[a3]) && A(u3, a3, g3, b2[a3], r3), a3 = "checked", void 0 !== m2 && m2 !== u3[a3] && A(u3, a3, m2, b2[a3], r3));
    }
    return u3;
  }
  function N(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i4 = "function" == typeof n2.__u;
        i4 && n2.__u(), i4 && null == u3 || (n2.__u = n2(u3));
      } else
        n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function V(n2, u3, t3) {
    var i4, o3;
    if (l.unmount && l.unmount(n2), (i4 = n2.ref) && (i4.current && i4.current !== n2.__e || N(i4, null, u3)), null != (i4 = n2.__c)) {
      if (i4.componentWillUnmount)
        try {
          i4.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u3);
        }
      i4.base = i4.__P = null;
    }
    if (i4 = n2.__k)
      for (o3 = 0; o3 < i4.length; o3++)
        i4[o3] && V(i4[o3], u3, t3 || "function" != typeof n2.type);
    t3 || w(n2.__e), n2.__c = n2.__ = n2.__e = n2.__d = void 0;
  }
  function q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function B(u3, t3, i4) {
    var o3, r3, f3, e3;
    l.__ && l.__(u3, t3), r3 = (o3 = "function" == typeof i4) ? null : i4 && i4.__k || t3.__k, f3 = [], e3 = [], O(t3, u3 = (!o3 && i4 || t3).__k = _(b, null, [u3]), r3 || h, h, t3.namespaceURI, !o3 && i4 ? [i4] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, f3, !o3 && i4 ? i4 : r3 ? r3.__e : t3.firstChild, o3, e3), j(f3, u3, e3);
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
    for (var i4, o3, r3; l3 = l3.__; )
      if ((i4 = l3.__c) && !i4.__)
        try {
          if ((o3 = i4.constructor) && null != o3.getDerivedStateFromError && (i4.setState(o3.getDerivedStateFromError(n2)), r3 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n2, t3 || {}), r3 = i4.__d), r3)
            return i4.__E = i4;
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

  // ../node_modules/preact/devtools/dist/devtools.module.js
  var i2;
  null != (i2 = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : void 0) && i2.__PREACT_DEVTOOLS__ && i2.__PREACT_DEVTOOLS__.attachPreact("10.24.3", l, { Fragment: b, Component: k });

  // pages/new-tab/app/components/App.module.css
  var App_default = {
    layout: "App_layout"
  };

  // ../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i3;
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
  function p2(n2, u3, i4) {
    var o3 = d2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i4 ? i4(u3) : D(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.u)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H)
          return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        }))
          return !c3 || c3.call(this, n3, t3, r3);
        var i5 = false;
        return u4.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i5 = true);
          }
        }), !(!i5 && o3.__c.props === n3) && (!c3 || c3.call(this, n3, t3, r3));
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
    var i4 = d2(t2++, 3);
    !c2.__s && C2(i4.__H, u3) && (i4.__ = n2, i4.i = u3, r2.__H.__h.push(i4));
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
    var u3 = r2.context[n2.__c], i4 = d2(t2++, 9);
    return i4.c = n2, u3 ? (null == i4.__ && (i4.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
  }
  function g2() {
    var n2 = d2(t2++, 11);
    if (!n2.__) {
      for (var u3 = r2.__v; null !== u3 && !u3.__m && null !== u3.__; )
        u3 = u3.__;
      var i4 = u3.__m || (u3.__m = [0, 0]);
      n2.__ = "P" + i4[0] + "-" + i4[1]++;
    }
    return n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); )
      if (n2.__P && n2.__H)
        try {
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
    var i4 = (r2 = n2.__c).__H;
    i4 && (u2 === r2 ? (i4.__h = [], r2.__h = [], i4.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.i = n3.__N = void 0;
    })) : (i4.__h.forEach(z2), i4.__h.forEach(B2), i4.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i3 === c2.requestAnimationFrame || ((i3 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
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

  // pages/new-tab/app/settings.provider.js
  var SettingsContext = G(
    /** @type {{settings: import("./settings.js").Settings}} */
    {}
  );
  function SettingsProvider({ settings, children }) {
    return /* @__PURE__ */ _(SettingsContext.Provider, { value: { settings } }, children);
  }
  function usePlatformName() {
    return x2(SettingsContext).settings.platform.name;
  }

  // pages/new-tab/app/widget-list/widget-config.provider.js
  var WidgetConfigContext = G({
    /** @type {Widgets} */
    widgets: [],
    /** @type {WidgetConfigItem[]} */
    widgetConfigItems: [],
    /** @type {(id:string) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggle: (_id) => {
    }
  });
  var WidgetConfigDispatchContext = G({
    dispatch: null
  });
  function WidgetConfigProvider(props) {
    const [data, setData] = h2(props.widgetConfigs);
    y2(() => {
      const unsub = props.api.onData((widgetConfig) => {
        setData(widgetConfig.data);
      });
      return () => unsub();
    }, [props.api]);
    function toggle(id) {
      props.api.toggleVisibility(id);
    }
    return /* @__PURE__ */ _(WidgetConfigContext.Provider, { value: {
      // this field is static for the lifespan of the page
      widgets: props.widgets,
      // this will be updated via subscriptions
      widgetConfigItems: data,
      toggle
    } }, props.children);
  }
  var WidgetVisibilityContext = G({
    visibility: (
      /** @type {WidgetConfigItem['visibility']} */
      "visible"
    ),
    id: (
      /** @type {WidgetConfigItem['id']} */
      ""
    ),
    /** @type {(id: string) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggle: (_id) => {
    }
  });
  function useVisibility() {
    return x2(WidgetVisibilityContext);
  }
  function WidgetVisibilityProvider(props) {
    const { toggle } = x2(WidgetConfigContext);
    return /* @__PURE__ */ _(WidgetVisibilityContext.Provider, { value: {
      visibility: props.visibility,
      id: props.id,
      toggle
    } }, /* @__PURE__ */ _("div", { style: { viewTransitionName: `widget-${props.id}` } }, props.children));
  }

  // pages/new-tab/app/privacy-stats/PrivacyStats.js
  var import_classnames = __toESM(require_classnames(), 1);

  // pages/new-tab/app/privacy-stats/PrivacyStats.module.css
  var PrivacyStats_default = {
    root: "PrivacyStats_root",
    collapsed: "PrivacyStats_collapsed",
    expanded: "PrivacyStats_expanded",
    heading: "PrivacyStats_heading",
    headingIcon: "PrivacyStats_headingIcon",
    title: "PrivacyStats_title",
    expander: "PrivacyStats_expander",
    toggle: "PrivacyStats_toggle",
    subtitle: "PrivacyStats_subtitle",
    list: "PrivacyStats_list",
    entering: "PrivacyStats_entering",
    "fade-in": "PrivacyStats_fade-in",
    entered: "PrivacyStats_entered",
    exiting: "PrivacyStats_exiting",
    "fade-out": "PrivacyStats_fade-out",
    row: "PrivacyStats_row",
    company: "PrivacyStats_company",
    icon: "PrivacyStats_icon",
    companyImgIcon: "PrivacyStats_companyImgIcon",
    other: "PrivacyStats_other",
    name: "PrivacyStats_name",
    bar: "PrivacyStats_bar",
    fill: "PrivacyStats_fill",
    count: "PrivacyStats_count"
  };

  // shared/translations.js
  function apply(subject, replacements, textLength = 1) {
    if (typeof subject !== "string" || subject.length === 0)
      return "";
    let out = subject;
    if (replacements) {
      for (let [name, value] of Object.entries(replacements)) {
        if (typeof value !== "string")
          value = "";
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

  // pages/new-tab/src/locales/en/newtab.json
  var newtab_default = {
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
    trackerStatsMenuTitle: {
      title: "Blocked Tracking Attempts",
      note: "Used as a toggle label in a page customization menu"
    },
    trackerStatsNoActivity: {
      title: "Tracking attempts blocked by DuckDuckGo appear here. Keep browsing to see how many we block.",
      note: "Placeholder for when we cannot report any blocked trackers yet"
    },
    trackerStatsNoRecent: {
      title: "No recent tracking activity",
      note: "Placeholder to indicate that nothing was blocked in the last 24 hours"
    },
    trackerStatsCountBlockedSingular: {
      title: "1 tracking attempt blocked",
      note: "The main headline indicating that 1 tracker was blocked"
    },
    trackerStatsCountBlockedPlural: {
      title: "{count} tracking attempts blocked",
      note: "The main headline indicating that more than 1 attempt has been blocked. Eg: '2 tracking attempts blocked'"
    },
    trackerStatsFeedCountBlockedSingular: {
      title: "1 attempt blocked by DuckDuckGo in the last 24 hours",
      note: "A summary description of how many tracking attempts where blocked, when only one exists."
    },
    trackerStatsFeedCountBlockedPlural: {
      title: "{count} attempts blocked by DuckDuckGo in the last 24 hours",
      note: "A summary description of how many tracking attempts where blocked, when there was more than 1. Eg: '1,028 attempts blocked by DuckDuckGo in the last 24 hours'"
    },
    trackerStatsToggleLabel: {
      title: "Show recent activity",
      note: "The aria-label text for a toggle button that shows/hides the detailed feed"
    }
  };

  // pages/new-tab/app/types.js
  function useTypedTranslation() {
    return {
      t: x2(TranslationContext).t
    };
  }
  var MessagingContext = G(
    /** @type {import("../src/js/index.js").NewTabPage} */
    {}
  );
  var useMessaging = () => x2(MessagingContext);

  // pages/new-tab/app/service.js
  var Service = class {
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
      if (!this.impl.initial)
        throw new Error("unreachable");
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
      this.eventTarget.addEventListener("data", (evt) => {
        cb(evt.detail);
      }, { signal: controller.signal });
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
      if (this.sub)
        return;
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
      if (this.data === null)
        return;
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
      if (source === "initial")
        return;
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
      if (!this.impl.persist)
        return;
      if (this.data === null)
        return;
      this.impl.persist(this.data);
    }
  };

  // pages/new-tab/app/privacy-stats/privacy-stats.service.js
  var PrivacyStatsService = class {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
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
  function useInitialData({ dispatch, service }) {
    y2(() => {
      if (!service.current)
        return console.warn("missing service");
      const stats2 = service.current;
      async function init2() {
        const { config, data } = await stats2.getInitial();
        if (data) {
          dispatch({ kind: "initial-data", data, config });
        } else {
          dispatch({ kind: "error", error: "missing data from getInitial" });
        }
      }
      dispatch({ kind: "load-initial" });
      init2().catch((e3) => {
        console.error("uncaught error", e3);
        dispatch({ kind: "error", error: e3 });
      });
      return () => {
        stats2.destroy();
      };
    }, []);
  }
  function useDataSubscription({ dispatch, service }) {
    y2(() => {
      if (!service.current)
        return console.warn("could not access service");
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
      if (!service.current)
        return console.warn("could not access service");
      const unsub2 = service.current.onConfig((data) => {
        dispatch({ kind: "config", config: data.data });
      });
      return () => {
        unsub2();
      };
    }, [service]);
    return { toggle };
  }

  // pages/new-tab/app/privacy-stats/PrivacyStatsProvider.js
  var PrivacyStatsContext = G({
    /** @type {State} */
    state: { status: "idle", data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
      throw new Error("must implement");
    }
  });
  var PrivacyStatsDispatchContext = G(
    /** @type {import("preact/hooks").Dispatch<Events>} */
    {}
  );
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
    const service = useService();
    useInitialData({ dispatch, service });
    useDataSubscription({ dispatch, service });
    const { toggle } = useConfigSubscription({ dispatch, service });
    return /* @__PURE__ */ _(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ _(PrivacyStatsDispatchContext.Provider, { value: dispatch }, props.children));
  }
  function useService() {
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

  // pages/new-tab/app/components/Chevron.js
  function Chevron() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M13.5 10L8 4.5L2.5 10",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ));
  }

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
  if (typeof window !== "undefined") {
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
          for (let i4 = 0; i4 < mutation.target.children.length; i4++) {
            const child = mutation.target.children.item(i4);
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
          for (let i4 = 0; i4 < mutation.removedNodes.length; i4++) {
            const child = mutation.removedNodes[i4];
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
    for (let i4 = 0; i4 < parent.children.length; i4++) {
      const child = parent.children.item(i4);
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

  // pages/new-tab/app/utils.js
  function viewTransition(fn) {
    if ("startViewTransition" in document && typeof document.startViewTransition === "function") {
      return document.startViewTransition(fn);
    }
    return fn();
  }

  // pages/new-tab/app/privacy-stats/PrivacyStats.js
  function PrivacyStats({ expansion, data, toggle, animation = "auto-animate" }) {
    if (animation === "auto-animate") {
      return /* @__PURE__ */ _(WithAutoAnimate, { data, expansion, toggle });
    }
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
  function WithAutoAnimate({ expansion, data, toggle }) {
    const [ref] = useAutoAnimate({ duration: 100 });
    return /* @__PURE__ */ _(PrivacyStatsConfigured, { parentRef: ref, expansion, data, toggle });
  }
  function PrivacyStatsConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === "expanded";
    const someCompanies = data.trackerCompanies.length > 0;
    const WIDGET_ID = g2();
    const TOGGLE_ID = g2();
    return /* @__PURE__ */ _("div", { class: PrivacyStats_default.root, ref: parentRef }, /* @__PURE__ */ _(
      Heading,
      {
        totalCount: data.totalCount,
        trackerCompanies: data.trackerCompanies,
        onToggle: toggle,
        buttonAttrs: {
          "aria-expanded": expansion === "expanded",
          "aria-pressed": expansion === "expanded",
          "aria-controls": WIDGET_ID,
          id: TOGGLE_ID
        }
      }
    ), expanded && someCompanies && /* @__PURE__ */ _(Body, { trackerCompanies: data.trackerCompanies, id: WIDGET_ID }));
  }
  function Heading({ trackerCompanies, totalCount, onToggle, buttonAttrs = {} }) {
    const { t: t3 } = useTypedTranslation();
    const [formatter] = h2(() => new Intl.NumberFormat());
    const recent = trackerCompanies.reduce((sum, item) => sum + item.count, 0);
    const recentTitle = recent === 1 ? t3("trackerStatsFeedCountBlockedSingular") : t3("trackerStatsFeedCountBlockedPlural", { count: formatter.format(recent) });
    const none = totalCount === 0;
    const some = totalCount > 0;
    const alltime = formatter.format(totalCount);
    const alltimeTitle = totalCount === 1 ? t3("trackerStatsCountBlockedSingular") : t3("trackerStatsCountBlockedPlural", { count: alltime });
    return /* @__PURE__ */ _("div", { className: PrivacyStats_default.heading }, /* @__PURE__ */ _("span", { className: PrivacyStats_default.headingIcon }, /* @__PURE__ */ _("img", { src: "./icons/shield.svg", alt: "" })), none && /* @__PURE__ */ _("p", { className: PrivacyStats_default.title }, t3("trackerStatsNoRecent")), some && /* @__PURE__ */ _("p", { className: PrivacyStats_default.title }, alltimeTitle), /* @__PURE__ */ _("span", { className: PrivacyStats_default.expander }, /* @__PURE__ */ _(
      "button",
      {
        ...buttonAttrs,
        type: "button",
        className: PrivacyStats_default.toggle,
        onClick: onToggle,
        "aria-label": t3("trackerStatsToggleLabel"),
        hidden: trackerCompanies.length === 0
      },
      /* @__PURE__ */ _(Chevron, null)
    )), /* @__PURE__ */ _("p", { className: PrivacyStats_default.subtitle }, recent === 0 && t3("trackerStatsNoActivity"), recent > 0 && recentTitle));
  }
  function Body({ trackerCompanies, id }) {
    const max = trackerCompanies[0]?.count ?? 0;
    const [formatter] = h2(() => new Intl.NumberFormat());
    const bodyClasses = (0, import_classnames.default)({
      [PrivacyStats_default.list]: true
    });
    return /* @__PURE__ */ _("ul", { className: bodyClasses, id }, trackerCompanies.map((company) => {
      const percentage = Math.min(company.count * 100 / max, 100);
      const valueOrMin = Math.max(percentage, 10);
      const inlineStyles = {
        width: `${valueOrMin}%`
      };
      const countText = formatter.format(company.count);
      return /* @__PURE__ */ _("li", { key: company.displayName }, /* @__PURE__ */ _("div", { className: PrivacyStats_default.row }, /* @__PURE__ */ _("div", { className: PrivacyStats_default.company }, /* @__PURE__ */ _(CompanyIcon, { company }), /* @__PURE__ */ _("span", { className: PrivacyStats_default.name }, company.displayName)), /* @__PURE__ */ _("span", { className: PrivacyStats_default.count }, countText), /* @__PURE__ */ _("span", { className: PrivacyStats_default.bar }), /* @__PURE__ */ _("span", { className: PrivacyStats_default.fill, style: inlineStyles })));
    }));
  }
  function PrivacyStatsCustomized() {
    const { visibility } = useVisibility();
    if (visibility === "hidden") {
      return null;
    }
    return /* @__PURE__ */ _(PrivacyStatsProvider, null, /* @__PURE__ */ _(PrivacyStatsConsumer, null));
  }
  function PrivacyStatsConsumer() {
    const { state, toggle } = x2(PrivacyStatsContext);
    if (state.status === "ready") {
      return /* @__PURE__ */ _(
        PrivacyStats,
        {
          expansion: state.config.expansion,
          animation: state.config.animation?.kind,
          data: state.data,
          toggle
        }
      );
    }
    return null;
  }
  function CompanyIcon({ company }) {
    const icon = company.displayName.toLowerCase().split(".")[0];
    const cleaned = icon.replace(/ /g, "-");
    const firstChar = icon[0];
    return /* @__PURE__ */ _("span", { className: PrivacyStats_default.icon }, icon === "other" && /* @__PURE__ */ _(Other, null), icon !== "other" && /* @__PURE__ */ _(
      "img",
      {
        src: `./company-icons/${cleaned}.svg`,
        alt: icon + " icon",
        className: PrivacyStats_default.companyImgIcon,
        onLoad: (e3) => {
          if (!e3.target)
            return;
          if (!(e3.target instanceof HTMLImageElement))
            return;
          e3.target.dataset.loaded = String(true);
        },
        onError: (e3) => {
          if (!e3.target)
            return;
          if (!(e3.target instanceof HTMLImageElement))
            return;
          if (e3.target.dataset.loadingFallback) {
            e3.target.dataset.errored = String(true);
            return;
          }
          e3.target.dataset.loadingFallback = String(true);
          e3.target.src = `./company-icons/${firstChar}.svg`;
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

  // pages/new-tab/app/favorites/Favorites.js
  function FavoritesCustomized() {
    const { id, visibility } = useVisibility();
    if (visibility === "hidden") {
      return null;
    }
    return /* @__PURE__ */ _("p", null, "Favourites here... (id: ", /* @__PURE__ */ _("code", null, id), ")");
  }

  // pages/onboarding/app/components/Stack.module.css
  var Stack_default = {
    stack: "Stack_stack"
  };

  // shared/components/EnvironmentProvider.js
  var EnvironmentContext = G({
    isReducedMotion: false,
    isDarkMode: false,
    debugState: false,
    injectName: (
      /** @type {import('../environment').Environment['injectName']} */
      "windows"
    ),
    willThrow: false
  });
  var THEME_QUERY = "(prefers-color-scheme: dark)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function EnvironmentProvider({ children, debugState, willThrow = false, injectName = "windows" }) {
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
    return /* @__PURE__ */ _(EnvironmentContext.Provider, { value: {
      isReducedMotion,
      debugState,
      isDarkMode: theme === "dark",
      injectName,
      willThrow
    } }, children);
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
    3: "var(--sp-3)"
  };

  // pages/new-tab/app/customizer/Customizer.module.css
  var Customizer_default = {
    root: "Customizer_root",
    list: "Customizer_list",
    item: "Customizer_item",
    label: "Customizer_label"
  };

  // pages/new-tab/app/customizer/Customizer.js
  function Customizer() {
    const { widgets, widgetConfigItems, toggle } = x2(WidgetConfigContext);
    return /* @__PURE__ */ _("div", { class: Customizer_default.root }, /* @__PURE__ */ _("ul", { class: Customizer_default.list }, widgets.map((widget) => {
      const matchingConfig = widgetConfigItems.find((item) => item.id === widget.id);
      if (!matchingConfig) {
        console.warn("missing config for widget: ", widget);
        return null;
      }
      return /* @__PURE__ */ _("li", { key: widget.id, class: Customizer_default.item }, /* @__PURE__ */ _("label", { class: Customizer_default.label }, /* @__PURE__ */ _(
        "input",
        {
          type: "checkbox",
          checked: matchingConfig.visibility === "visible",
          onChange: () => toggle(widget.id),
          value: widget.id
        }
      ), /* @__PURE__ */ _("span", null, widget.id)));
    })));
  }

  // pages/new-tab/app/widget-list/WidgetList.js
  var widgetMap = {
    privacyStats: () => /* @__PURE__ */ _(PrivacyStatsCustomized, null),
    favorites: () => /* @__PURE__ */ _(FavoritesCustomized, null)
  };
  function WidgetList() {
    const { widgets, widgetConfigItems } = x2(WidgetConfigContext);
    return /* @__PURE__ */ _(Stack, { gap: "var(--sp-8)" }, widgets.map((widget) => {
      const matchingConfig = widgetConfigItems.find((item) => item.id === widget.id);
      if (!matchingConfig) {
        console.warn("missing config for widget: ", widget);
        return null;
      }
      return /* @__PURE__ */ _(b, { key: widget.id }, /* @__PURE__ */ _(
        WidgetVisibilityProvider,
        {
          visibility: matchingConfig.visibility,
          id: matchingConfig.id
        },
        widgetMap[widget.id]?.()
      ));
    }), /* @__PURE__ */ _(Customizer, null));
  }

  // pages/new-tab/app/components/App.js
  function App({ children }) {
    const platformName = usePlatformName();
    return /* @__PURE__ */ _("div", { className: App_default.layout, "data-platform": platformName }, /* @__PURE__ */ _(WidgetList, null), children);
  }

  // shared/components/Fallback/Fallback.module.css
  var Fallback_default = {
    fallback: "Fallback_fallback"
  };

  // shared/components/Fallback/Fallback.jsx
  function Fallback({ showDetails }) {
    return /* @__PURE__ */ _("div", { class: Fallback_default.fallback }, /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("p", null, "Something went wrong!"), showDetails && /* @__PURE__ */ _("p", null, "Please check logs for a message called ", /* @__PURE__ */ _("code", null, "reportPageException"))));
  }

  // shared/components/ErrorBoundary.js
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

  // pages/new-tab/app/widget-list/widget-config.service.js
  var WidgetConfigService = class {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed
     * @param {WidgetConfigs} initialConfig
     * @internal
     */
    constructor(ntp, initialConfig) {
      this.service = new Service({
        subscribe: (cb) => ntp.messaging.subscribe("widgets_onConfigUpdated", cb),
        persist: (data) => ntp.messaging.notify("widgets_setConfig", data)
      }, initialConfig);
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

  // pages/new-tab/app/settings.js
  var Settings = class _Settings {
    /**
     * @param {object} params
     * @param {{name: ImportMeta['platform']}} [params.platform]
     */
    constructor({
      platform = { name: "macos" }
    }) {
      this.platform = platform;
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
  };

  // pages/new-tab/app/components/Components.module.css
  var Components_default = {
    componentList: "Components_componentList",
    itemInfo: "Components_itemInfo",
    itemLink: "Components_itemLink",
    debugBar: "Components_debugBar",
    buttonRow: "Components_buttonRow",
    "grid-container": "Components_grid-container",
    selectItem: "Components_selectItem",
    item: "Components_item"
  };

  // pages/new-tab/app/privacy-stats/mocks/stats.js
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
          displayName: "Amazon",
          count: 67
        },
        {
          displayName: "Google Ads",
          count: 2
        },
        {
          displayName: "Other",
          count: 210
        }
      ],
      trackerCompaniesPeriod: "last-day"
    },
    single: {
      totalCount: 481113,
      trackerCompanies: [
        {
          displayName: "Google",
          count: 1
        }
      ],
      trackerCompaniesPeriod: "last-day"
    },
    norecent: {
      totalCount: 481113,
      trackerCompanies: [],
      trackerCompaniesPeriod: "last-day"
    },
    none: {
      totalCount: 0,
      trackerCompanies: [],
      trackerCompaniesPeriod: "last-day"
    }
  };

  // pages/new-tab/app/privacy-stats/mocks/PrivacyStatsMockProvider.js
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
      if (!ticker)
        return;
      if (state.status === "ready") {
        const next = {
          totalCount: state.data.totalCount + 1,
          trackerCompanies: state.data.trackerCompanies.map((company, index) => {
            if (index === 0)
              return { ...company, count: company.count + 1 };
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
      if (state.status !== "ready")
        return console.warn("was not ready");
      if (state.config?.expansion === "expanded") {
        send({ kind: "config", config: { ...state.config, expansion: "collapsed" } });
      } else {
        send({ kind: "config", config: { ...state.config, expansion: "expanded" } });
      }
    }, [state.config?.expansion]);
    return /* @__PURE__ */ _(PrivacyStatsContext.Provider, { value: { state, toggle } }, /* @__PURE__ */ _(PrivacyStatsDispatchContext.Provider, { value: send }, children));
  }

  // pages/new-tab/app/components/Examples.jsx
  var mainExamples = {
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
      factory: () => /* @__PURE__ */ _(
        PrivacyStatsMockProvider,
        {
          data: stats.norecent
        },
        /* @__PURE__ */ _(PrivacyStatsConsumer, null)
      )
    },
    "stats.list": {
      factory: () => /* @__PURE__ */ _(Body, { trackerCompanies: stats.few.trackerCompanies, id: "example-stats.list" })
    },
    "stats.heading": {
      factory: () => /* @__PURE__ */ _(Heading, { trackerCompanies: stats.few.trackerCompanies, totalCount: stats.few.totalCount })
    },
    "stats.heading.none": {
      factory: () => /* @__PURE__ */ _(Heading, { trackerCompanies: stats.none.trackerCompanies, totalCount: stats.none.totalCount })
    }
  };
  var otherExamples = {
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

  // pages/new-tab/app/components/Components.jsx
  var url = new URL(window.location.href);
  function Components() {
    const ids = url.searchParams.getAll("id");
    const isolated = url.searchParams.has("isolate");
    const e2e = url.searchParams.has("e2e");
    const entries = Object.entries(mainExamples).concat(Object.entries(otherExamples));
    const entryIds = entries.map(([id]) => id);
    const validIds = ids.filter((id) => entryIds.includes(id));
    const filtered = validIds.length ? validIds.map((id) => (
      /** @type {const} */
      [id, mainExamples[id] || otherExamples[id]]
    )) : entries;
    if (isolated) {
      return /* @__PURE__ */ _(Isolated, { entries: filtered, e2e });
    }
    return /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(DebugBar, { id: ids[0], ids, entries }), /* @__PURE__ */ _(Stage, { entries: (
      /** @type {any} */
      filtered
    ) }));
  }
  function Stage({ entries }) {
    return /* @__PURE__ */ _("div", { class: Components_default.componentList, "data-testid": "stage" }, entries.map(([id, item]) => {
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
      const others = current.filter((x3) => x3 !== id);
      const matching = current.filter((x3) => x3 === id);
      const matchingMinus1 = matching.length === 1 ? [] : matching.slice(0, -1);
      without.searchParams.delete("id");
      for (let string of [...others, ...matchingMinus1]) {
        without.searchParams.append("id", string);
      }
      return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("div", { class: Components_default.itemInfo }, /* @__PURE__ */ _("code", null, id), " ", /* @__PURE__ */ _("a", { href: without.toString(), hidden: current.length === 0 }, "Remove"), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
        "a",
        {
          href: selected.toString(),
          class: Components_default.itemLink,
          title: "show this component only"
        },
        "select"
      ), " ", /* @__PURE__ */ _(
        "a",
        {
          href: next.toString(),
          target: "_blank",
          class: Components_default.itemLink,
          title: "isolate this component"
        },
        "isolate"
      ), " ", /* @__PURE__ */ _(
        "a",
        {
          href: e2e.toString(),
          target: "_blank",
          class: Components_default.itemLink,
          title: "isolate this component"
        },
        "edge-to-edge"
      ))), /* @__PURE__ */ _("div", { className: Components_default.item, key: id }, item.factory()));
    }));
  }
  function Isolated({ entries, e2e }) {
    if (e2e) {
      return /* @__PURE__ */ _("div", null, entries.map(([id, item]) => {
        return /* @__PURE__ */ _(b, { key: id }, item.factory());
      }));
    }
    return /* @__PURE__ */ _("div", { class: Components_default.componentList, "data-testid": "stage" }, entries.map(([id, item], index) => {
      return /* @__PURE__ */ _("div", { key: id + index }, item.factory());
    }));
  }
  function DebugBar({ entries, id, ids }) {
    return /* @__PURE__ */ _("div", { class: Components_default.debugBar, "data-testid": "selector" }, /* @__PURE__ */ _(ExampleSelector, { entries, id }), ids.length > 0 && /* @__PURE__ */ _(Append, { entries, id }), /* @__PURE__ */ _(TextLength, null), /* @__PURE__ */ _(Isolate, null));
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
    return /* @__PURE__ */ _("div", { class: Components_default.buttonRow }, /* @__PURE__ */ _("button", { onClick: onReset, type: "button" }, "Text Length 1x"), /* @__PURE__ */ _("button", { onClick, type: "button" }, "Text Length 1.5x"));
  }
  function Isolate() {
    const next = new URL(url);
    next.searchParams.set("isolate", "true");
    return /* @__PURE__ */ _("div", { class: Components_default.buttonRow }, /* @__PURE__ */ _("a", { href: next.toString(), target: "_blank" }, "Isolate (open in a new tab)"));
  }
  function ExampleSelector({ entries, id }) {
    function onReset() {
      const url3 = new URL(window.location.href);
      url3.searchParams.delete("id");
      window.location.href = url3.toString();
    }
    function onChange(event) {
      if (!event.target)
        return;
      if (!(event.target instanceof HTMLSelectElement))
        return;
      const selectedId = event.target.value;
      if (selectedId) {
        if (selectedId === "none")
          return onReset();
        const url3 = new URL(window.location.href);
        url3.searchParams.set("id", selectedId);
        window.location.href = url3.toString();
      }
    }
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("div", { class: Components_default.buttonRow }, /* @__PURE__ */ _("label", null, "Single:", " ", /* @__PURE__ */ _("select", { value: id || "none", onChange }, /* @__PURE__ */ _("option", { value: "none" }, "Select an example"), entries.map(([id2]) => /* @__PURE__ */ _("option", { key: id2, value: id2 }, id2)))), /* @__PURE__ */ _("button", { onClick: onReset }, "RESET \u{1F501}")));
  }
  function Append({ entries, id }) {
    function onReset() {
      const url3 = new URL(window.location.href);
      url3.searchParams.delete("id");
      window.location.href = url3.toString();
    }
    function onSubmit(event) {
      if (!event.target)
        return;
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const value = data.get("add-id");
      if (typeof value !== "string")
        return;
      const url3 = new URL(window.location.href);
      url3.searchParams.append("id", value);
      window.location.href = url3.toString();
    }
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("form", { class: Components_default.buttonRow, onSubmit }, /* @__PURE__ */ _("label", null, "Append:", " ", /* @__PURE__ */ _("select", { value: "none", name: "add-id" }, /* @__PURE__ */ _("option", { value: "none" }, "Select an example"), entries.map(([id2]) => /* @__PURE__ */ _("option", { key: id2, value: id2 }, id2)))), /* @__PURE__ */ _("button", null, "Confirm")));
  }

  // pages/new-tab/app/index.js
  async function init(messaging2, baseEnvironment2) {
    const init2 = await messaging2.init();
    if (!Array.isArray(init2.widgets)) {
      throw new Error("missing critical initialSetup.widgets array");
    }
    if (!Array.isArray(init2.widgetConfigs)) {
      throw new Error("missing critical initialSetup.widgetConfig array");
    }
    const widgetConfigAPI = new WidgetConfigService(messaging2, init2.widgetConfigs);
    const environment = baseEnvironment2.withEnv(init2.env).withLocale(init2.locale).withLocale(baseEnvironment2.urlParams.get("locale")).withTextLength(baseEnvironment2.urlParams.get("textLength")).withDisplay(baseEnvironment2.urlParams.get("display"));
    console.log("environment:", environment);
    console.log("locale:", environment.locale);
    const strings = environment.locale === "en" ? newtab_default : await fetch(`./locales/${environment.locale}/new-tab.json`).then((x3) => x3.json()).catch((e3) => {
      console.error("Could not load locale", environment.locale, e3);
      return newtab_default;
    });
    const settings = new Settings({}).withPlatformName(baseEnvironment2.injectName).withPlatformName(init2.platform?.name).withPlatformName(baseEnvironment2.urlParams.get("platform"));
    const didCatch = (error) => {
      const message = error?.message || error?.error || "unknown";
      messaging2.reportPageException({ message });
    };
    const root2 = document.querySelector("#app");
    if (!root2)
      throw new Error("could not render, root element missing");
    document.body.dataset.platformName = settings.platform.name;
    if (environment.display === "components") {
      document.body.dataset.display = "components";
      return B(
        /* @__PURE__ */ _(
          EnvironmentProvider,
          {
            debugState: environment.debugState,
            injectName: environment.injectName,
            willThrow: environment.willThrow
          },
          /* @__PURE__ */ _(TranslationProvider, { translationObject: strings, fallback: strings, textLength: environment.textLength }, /* @__PURE__ */ _(Components, null))
        ),
        root2
      );
    }
    B(
      /* @__PURE__ */ _(
        EnvironmentProvider,
        {
          debugState: environment.debugState,
          injectName: environment.injectName,
          willThrow: environment.willThrow
        },
        /* @__PURE__ */ _(ErrorBoundary, { didCatch, fallback: /* @__PURE__ */ _(Fallback, { showDetails: environment.env === "development" }) }, /* @__PURE__ */ _(UpdateEnvironment, { search: window.location.search }), /* @__PURE__ */ _(MessagingContext.Provider, { value: messaging2 }, /* @__PURE__ */ _(SettingsProvider, { settings }, /* @__PURE__ */ _(TranslationProvider, { translationObject: strings, fallback: strings, textLength: environment.textLength }, /* @__PURE__ */ _(WidgetConfigProvider, { api: widgetConfigAPI, widgetConfigs: init2.widgetConfigs, widgets: init2.widgets }, /* @__PURE__ */ _(App, null))))))
      ),
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
        if ("result" in data2)
          return true;
        if ("error" in data2)
          return true;
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
          if (!teardown)
            throw new Error("unreachable");
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
        const {
          ciphertext,
          tag
        } = await new this.globals.Promise((resolve) => {
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
      } catch (e3) {
        if (e3 instanceof MissingHandler) {
          throw e3;
        } else {
          console.error("decryption failed", e3);
          console.error(e3);
          return { error: e3 };
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
      if (!handlers)
        throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
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
      if (!payload)
        return this._log("no response");
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
            postMessage: window.chrome.webview.postMessage,
            // @ts-expect-error - not in @types/chrome
            addEventListener: window.chrome.webview.addEventListener,
            // @ts-expect-error - not in @types/chrome
            removeEventListener: window.chrome.webview.removeEventListener
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      if (!injectName)
        return this;
      if (!isInjectName(injectName))
        return this;
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
      if (!env)
        return this;
      if (env !== "production" && env !== "development")
        return this;
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
      if (!display)
        return this;
      if (display !== "app" && display !== "components")
        return this;
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
      if (!locale)
        return this;
      if (typeof locale !== "string")
        return this;
      if (locale.length !== 2)
        return this;
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
      if (!length)
        return this;
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

  // pages/new-tab/src/js/mock-transport.js
  var VERSION_PREFIX = "__ntp_15__.";
  var url2 = new URL(window.location.href);
  function mockTransport() {
    const channel = new BroadcastChannel("ntp");
    function broadcast(named) {
      setTimeout(() => {
        channel.postMessage({
          change: named
        });
      }, 100);
    }
    function read(name) {
      try {
        const item = localStorage.getItem(VERSION_PREFIX + name);
        if (!item)
          return null;
        return JSON.parse(item);
      } catch (e3) {
        console.error("Failed to parse initialSetup from localStorage", e3);
        return null;
      }
    }
    function write(name, value) {
      try {
        localStorage.setItem(VERSION_PREFIX + name, JSON.stringify(value));
      } catch (e3) {
        console.error("Failed to write", e3);
      }
    }
    return new TestTransportConfig({
      notify(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          case "widgets_setConfig": {
            if (!msg.params)
              throw new Error("unreachable");
            write("widget_config", msg.params);
            broadcast("widget_config");
            return;
          }
          case "stats_setConfig": {
            if (!msg.params)
              throw new Error("unreachable");
            write("stats_config", msg.params);
            broadcast("stats_config");
            return;
          }
          default: {
            console.warn("unhandled notification", msg);
          }
        }
      },
      subscribe(_msg, cb) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const sub = (
          /** @type {any} */
          _msg.subscriptionName
        );
        switch (sub) {
          case "widgets_onConfigUpdated": {
            const controller = new AbortController();
            channel.addEventListener("message", (msg) => {
              if (msg.data.change === "widget_config") {
                const values = read("widget_config");
                if (values) {
                  cb(values);
                }
              }
            }, { signal: controller.signal });
            return () => controller.abort();
          }
          case "stats_onConfigUpdate": {
            const controller = new AbortController();
            channel.addEventListener("message", (msg) => {
              if (msg.data.change === "stats_config") {
                const values = read("stats_config");
                if (values) {
                  cb(values);
                }
              }
            }, { signal: controller.signal });
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
        switch (msg.method) {
          case "stats_getData": {
            return Promise.resolve(stats.few);
          }
          case "stats_getConfig": {
            const defaultConfig = { expansion: "expanded", animation: { kind: "auto-animate" } };
            const fromStorage = read("stats_config") || defaultConfig;
            if (url2.searchParams.get("animation") === "none") {
              fromStorage.animation = { kind: "none" };
            }
            if (url2.searchParams.get("animation") === "view-transitions") {
              fromStorage.animation = { kind: "view-transitions" };
            }
            return Promise.resolve(fromStorage);
          }
          case "initialSetup": {
            const widgetsFromStorage = read("widgets") || [
              { id: "favorites" },
              { id: "privacyStats" }
            ];
            const widgetConfigFromStorage = read("widget_config") || [
              { id: "favorites", visibility: "visible" },
              { id: "privacyStats", visibility: "visible" }
            ];
            const initial = {
              widgets: widgetsFromStorage,
              widgetConfigs: widgetConfigFromStorage,
              platform: { name: "integration" },
              env: "development",
              locale: "en"
            };
            return Promise.resolve(initial);
          }
          default: {
            return Promise.reject(new Error("unhandled request" + msg));
          }
        }
      }
    });
  }

  // pages/new-tab/src/js/index.js
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
     * @return {Promise<import('../../../../types/new-tab.js').InitialSetupResponse>}
     */
    init() {
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
  };
  var baseEnvironment = new Environment().withInjectName("integration").withEnv("production");
  var messaging = createSpecialPageMessaging({
    injectName: "integration",
    env: "production",
    pageName: "newTabPage",
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration")
        return null;
      let mock = null;
      $INTEGRATION:
        mock = mockTransport();
      return mock;
    }
  });
  var newTabMessaging = new NewTabPage(messaging, "integration");
  init(newTabMessaging, baseEnvironment).catch((e3) => {
    console.error(e3);
    const msg = typeof e3?.message === "string" ? e3.message : "unknown init error";
    newTabMessaging.reportInitException(msg);
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
