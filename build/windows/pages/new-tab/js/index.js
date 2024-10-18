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

  // pages/new-tab/app/remote-messaging-framework/RemoteMessagingFramework.js
  var import_classnames2 = __toESM(require_classnames(), 1);

  // pages/new-tab/app/remote-messaging-framework/RemoteMessagingFramework.module.css
  var RemoteMessagingFramework_default = {
    root: "RemoteMessagingFramework_root",
    icon: "RemoteMessagingFramework_icon",
    iconBlock: "RemoteMessagingFramework_iconBlock",
    content: "RemoteMessagingFramework_content",
    title: "RemoteMessagingFramework_title",
    btn: "RemoteMessagingFramework_btn",
    primary: "RemoteMessagingFramework_primary",
    secondary: "RemoteMessagingFramework_secondary"
  };

  // pages/new-tab/app/remote-messaging-framework/MessageIcons.js
  function MessageIcons(props) {
    const { name } = props;
    return /* @__PURE__ */ _(b, null, name === "Announce" && /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "48", height: "48", viewBox: "0 0 48 48", fill: "none" }, /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M19 28.5V31.8648C19 33.5005 19.9958 34.9713 21.5144 35.5787C24.1419 36.6297 27 34.6947 27 31.8648V28.9857H29V31.8648C29 36.1096 24.7128 39.0122 20.7717 37.4357C18.4937 36.5245 17 34.3183 17 31.8648V28.5H19Z", fill: "#557FF3" }), /* @__PURE__ */ _("path", { d: "M36.5 11.5L9.5 19V28L36.5 35.5V11.5Z", fill: "#8FABF9" }), /* @__PURE__ */ _("path", { d: "M36.5 27L9.5 25V28L36.5 35.5V27Z", fill: "#7295F6" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M36.977 15.2856C37.0954 15.825 36.7541 16.3583 36.2146 16.4767L15.7146 20.9767C15.1752 21.0951 14.6419 20.7538 14.5235 20.2144C14.4051 19.6749 14.7464 19.1416 15.2858 19.0232L35.7858 14.5232C36.3252 14.4048 36.8585 14.7461 36.977 15.2856Z", fill: "#ADC2FC" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M40.25 24C40.25 23.5858 40.5858 23.25 41 23.25H44C44.4142 23.25 44.75 23.5858 44.75 24C44.75 24.4142 44.4142 24.75 44 24.75H41C40.5858 24.75 40.25 24.4142 40.25 24Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M39.3506 19.3751C39.1435 19.0164 39.2664 18.5577 39.6251 18.3506L42.2232 16.8506C42.5819 16.6435 43.0406 16.7664 43.2477 17.1251C43.4548 17.4838 43.3319 17.9425 42.9732 18.1496L40.3751 19.6496C40.0164 19.8567 39.5577 19.7338 39.3506 19.3751Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M39.3506 28.6251C39.5577 28.2664 40.0164 28.1435 40.3751 28.3506L42.9732 29.8506C43.3319 30.0577 43.4548 30.5164 43.2477 30.8751C43.0406 31.2338 42.5819 31.3567 42.2232 31.1496L39.6251 29.6496C39.2664 29.4425 39.1435 28.9838 39.3506 28.6251Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { d: "M35 11.5C35 10.6716 35.6716 10 36.5 10C37.3284 10 38 10.6716 38 11.5V35.5C38 36.3284 37.3284 37 36.5 37C35.6716 37 35 36.3284 35 35.5V11.5Z", fill: "#3969EF" }), /* @__PURE__ */ _("path", { d: "M8 19C8 18.1716 8.67157 17.5 9.5 17.5C10.3284 17.5 11 18.1716 11 19V28C11 28.8284 10.3284 29.5 9.5 29.5C8.67157 29.5 8 28.8284 8 28V19Z", fill: "#3969EF" })), name === "AppUpdate" && /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "48", height: "48", viewBox: "0 0 48 48", fill: "none" }, /* @__PURE__ */ _("path", { d: "M25 39C33.2843 39 40 32.2843 40 24C40 15.7157 33.2843 9 25 9C16.7157 9 10 15.7157 10 24C10 32.2843 16.7157 39 25 39Z", fill: "#399F29" }), /* @__PURE__ */ _("path", { d: "M23 9H25V39H23V9Z", fill: "#399F29" }), /* @__PURE__ */ _("path", { d: "M23 39C31.2843 39 38 32.2843 38 24C38 15.7157 31.2843 9 23 9C14.7157 9 8 15.7157 8 24C8 32.2843 14.7157 39 23 39Z", fill: "#4CBA3C" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M25.3389 18.8067C22.6654 17.4255 19.3882 18.4284 17.8588 21.1608L17.8531 21.1668C17.3471 22.0676 17.0999 23.0465 17.0711 24.0193C17.0596 24.5358 16.7434 24.9802 16.2662 25.1123L14.3631 25.6348C14.0296 25.7249 13.7019 25.4786 13.6674 25.1183C13.4892 23.1726 13.8686 21.1548 14.8863 19.3412C17.3873 14.8792 22.7862 13.3058 27.1041 15.708C27.2995 15.8161 27.541 15.75 27.6503 15.5518L28.3919 14.2247C28.5759 13.9004 29.0416 13.9664 29.1336 14.3327L30.4215 19.5093C30.479 19.7315 30.3525 19.9657 30.1341 20.0258L25.1952 21.377C24.8445 21.4731 24.557 21.0767 24.741 20.7524L25.4999 19.4012C25.6149 19.1911 25.5459 18.9148 25.3389 18.8067ZM20.2104 29.2678C22.9868 30.649 26.39 29.6462 27.9782 26.9137L27.9842 26.9077C28.5096 26.0069 28.7664 25.028 28.7962 24.0552C28.8082 23.5387 29.1366 23.0943 29.6321 22.9622L31.6084 22.4397C31.9547 22.3497 32.295 22.5959 32.3309 22.9562C32.5159 24.9019 32.1219 26.9197 31.0651 28.7333C28.4678 33.1953 22.8614 34.7687 18.3774 32.3666C18.1744 32.2585 17.9236 32.3245 17.8102 32.5227L17.04 33.8499C16.8489 34.1742 16.3653 34.1081 16.2698 33.7418L14.9323 28.5652C14.8726 28.343 15.004 28.1088 15.2309 28.0487L20.3597 26.6975C20.7239 26.6015 21.0224 26.9978 20.8313 27.3221L20.0432 28.6733C19.9238 28.8835 19.9955 29.1597 20.2104 29.2678Z", fill: "white" })), name === "CriticalUpdate" && /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "48", height: "48", viewBox: "0 0 48 48", fill: "none" }, /* @__PURE__ */ _("path", { d: "M34.3532 25.565C29.3703 26.1337 25.4998 30.3648 25.4998 35.4999C25.4998 36.8807 24.3805 38 22.9997 38H14.4312C11.0068 38 8.83727 34.3271 10.4901 31.328L21.0585 12.1513C21.5331 11.2902 22.2193 10.6679 22.9998 10.2846V9.82495H24.8743C26.4585 9.78177 28.0623 10.5572 28.9408 12.1513L35.3579 23.7953C35.7802 24.5615 35.2225 25.4657 34.3532 25.565Z", fill: "#E2A412" }), /* @__PURE__ */ _("path", { d: "M34.3344 25.5671C29.3606 26.1444 25.4998 30.3713 25.4998 35.4999C25.4998 36.8807 24.3805 38 22.9997 38H12.4312C9.00682 38 6.83727 34.3271 8.4901 31.328L19.0585 12.1513C20.7692 9.04724 25.2301 9.04724 26.9408 12.1513L34.3344 25.5671Z", fill: "#F9BE1A" }), /* @__PURE__ */ _("path", { d: "M35.5 43.5C39.9183 43.5 43.5 39.9183 43.5 35.5C43.5 31.0817 39.9183 27.5 35.5 27.5C31.0817 27.5 27.5 31.0817 27.5 35.5C27.5 39.9183 31.0817 43.5 35.5 43.5Z", fill: "#4CBA3C" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M36.7474 32.7303C35.3216 31.9936 33.5737 32.5285 32.758 33.9858L32.755 33.989C32.4851 34.4694 32.3533 34.9915 32.3379 35.5104C32.3318 35.7858 32.1631 36.0228 31.9086 36.0933L30.8936 36.3719C30.7158 36.42 30.541 36.2887 30.5226 36.0965C30.4276 35.0588 30.6299 33.9826 31.1727 33.0153C32.5066 30.6356 35.386 29.7965 37.6888 31.0776C37.7931 31.1353 37.9219 31.1001 37.9801 30.9944L38.3757 30.2865C38.4738 30.1136 38.7222 30.1488 38.7713 30.3442L39.4581 33.105C39.4888 33.2235 39.4214 33.3484 39.3048 33.3805L36.6708 34.1011C36.4837 34.1524 36.3304 33.941 36.4285 33.768L36.8333 33.0474C36.8946 32.9353 36.8578 32.7879 36.7474 32.7303ZM34.0122 38.3096C35.4929 39.0462 37.308 38.5113 38.1551 37.054L38.1582 37.0508C38.4385 36.5704 38.5754 36.0483 38.5913 35.5295C38.5977 35.254 38.7728 35.017 39.0371 34.9466L40.0912 34.6679C40.2758 34.6199 40.4574 34.7512 40.4765 34.9434C40.5752 35.9811 40.365 37.0572 39.8014 38.0245C38.4162 40.4042 35.4261 41.2434 33.0346 39.9622C32.9263 39.9046 32.7926 39.9398 32.7321 40.0455L32.3213 40.7533C32.2194 40.9263 31.9615 40.891 31.9105 40.6957L31.1972 37.9348C31.1654 37.8163 31.2355 37.6914 31.3565 37.6594L34.0918 36.9387C34.2861 36.8875 34.4453 37.0989 34.3434 37.2718L33.9231 37.9925C33.8594 38.1046 33.8976 38.2519 34.0122 38.3096Z", fill: "white" }), /* @__PURE__ */ _("path", { d: "M46.2507 29.5C46.3994 29.5 46.5481 29.56 46.6618 29.677C46.8892 29.9109 46.8892 30.2919 46.6618 30.5258L45.4956 31.7256C45.2682 31.9596 44.898 31.9596 44.6706 31.7256C44.4431 31.4917 44.4431 31.1107 44.6706 30.8768L45.8367 29.677C45.9505 29.56 46.0991 29.5 46.2478 29.5H46.2507Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { d: "M45.6676 34.8991H47.4169C47.7376 34.8991 48 35.1691 48 35.499C48 35.829 47.7376 36.0989 47.4169 36.0989H45.6676C45.3469 36.0989 45.0845 35.829 45.0845 35.499C45.0845 35.1691 45.3469 34.8991 45.6676 34.8991Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { d: "M44.6765 39.2759C44.7902 39.1589 44.9389 39.0989 45.0876 39.0989H45.0905C45.2392 39.0989 45.3879 39.1589 45.5016 39.2759L46.6678 40.4757C46.8952 40.7096 46.8952 41.0906 46.6678 41.3245C46.4403 41.5585 46.0701 41.5585 45.8427 41.3245L44.6765 40.1247C44.4491 39.8908 44.4491 39.5098 44.6765 39.2759Z", fill: "#CCCCCC" }), /* @__PURE__ */ _("path", { d: "M23 34C24.1046 34 25 33.1046 25 32C25 30.8954 24.1046 30 23 30C21.8954 30 21 30.8954 21 32C21 33.1046 21.8954 34 23 34Z", fill: "#92540C" }), /* @__PURE__ */ _("path", { d: "M22.5637 16C21.7108 16 21.0295 16.7103 21.065 17.5624L21.44 26.5624C21.4735 27.3659 22.1346 28 22.9387 28H23.0611C23.8653 28 24.5264 27.3659 24.5598 26.5624L24.9348 17.5624C24.9704 16.7103 24.2891 16 23.4361 16H22.5637Z", fill: "#92540C" })), name === "DDGAnnounce" && /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "48", height: "48", viewBox: "0 0 48 48", fill: "none" }, /* @__PURE__ */ _("rect", { x: "8", y: "8", width: "32", height: "32", rx: "16", fill: "#DE5833" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M27.6052 38.3435C26.933 37.0366 26.2903 35.8342 25.8913 35.0388C24.8308 32.9152 23.7649 29.9212 24.2497 27.9903C24.338 27.6395 23.2508 14.9993 22.4822 14.5922C21.6279 14.1369 20.5768 13.4148 19.6154 13.2541C19.1276 13.176 18.488 13.213 17.988 13.2803C17.8992 13.2923 17.8955 13.452 17.9804 13.4808C18.3087 13.592 18.7072 13.7851 18.9421 14.077C18.9866 14.1323 18.9269 14.2192 18.856 14.2218C18.6346 14.23 18.2329 14.3228 17.703 14.773C17.6417 14.825 17.6926 14.9217 17.7715 14.9061C18.9104 14.6808 20.0736 14.7918 20.7591 15.4149C20.8036 15.4553 20.7803 15.5278 20.7223 15.5436C14.7736 17.1602 15.9512 22.3349 17.5348 28.6852C19.027 34.6686 19.7347 37.0285 19.82 37.3087C19.8257 37.3275 19.8362 37.342 19.8535 37.3514C21.0795 38.0243 27.5263 38.4328 27.2529 37.6624L27.6052 38.3435Z", fill: "#DDDDDD" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M38.75 24C38.75 32.1462 32.1462 38.75 24 38.75C15.8538 38.75 9.25 32.1462 9.25 24C9.25 15.8538 15.8538 9.25 24 9.25C32.1462 9.25 38.75 15.8538 38.75 24ZM20.5608 37.0398C20.1134 35.6496 18.9707 31.9777 17.8859 27.5312C17.8485 27.3776 17.811 27.2246 17.7738 27.0724L17.7728 27.0686C16.411 21.506 15.2986 16.9627 21.3949 15.5354C21.4507 15.5223 21.4779 15.4557 21.441 15.4119C20.7416 14.5821 19.4312 14.3102 17.7744 14.8818C17.7064 14.9052 17.6474 14.8367 17.6896 14.7785C18.0145 14.3307 18.6494 13.9863 18.9629 13.8354C19.0277 13.8042 19.0237 13.7093 18.9551 13.6878C18.7501 13.6237 18.401 13.5254 18.0083 13.4621C17.9154 13.4471 17.907 13.2879 18.0003 13.2753C20.3492 12.9593 22.802 13.6645 24.0329 15.215C24.0445 15.2296 24.0612 15.2398 24.0794 15.2437C28.5867 16.2116 28.9095 23.3367 28.3902 23.6612C28.2879 23.7252 27.9598 23.6885 27.5271 23.6401C25.7733 23.4439 22.3004 23.0553 25.1667 28.3971C25.195 28.4498 25.1575 28.5197 25.0984 28.5289C23.506 28.7764 25.5552 33.7922 27.0719 37.1309C33.0379 35.7407 37.4824 30.3894 37.4824 24C37.4824 16.5539 31.4461 10.5176 24 10.5176C16.5539 10.5176 10.5176 16.5539 10.5176 24C10.5176 30.2575 14.7806 35.5194 20.5608 37.0398Z", fill: "white" }), /* @__PURE__ */ _("path", { d: "M29.0913 30.703C28.7482 30.544 27.4288 31.4902 26.5532 32.2165C26.3702 31.9575 26.0251 31.7693 25.2467 31.9047C24.5655 32.0231 24.1894 32.1874 24.0216 32.4706C22.9463 32.0629 21.1374 31.4337 20.7003 32.0414C20.2226 32.7056 20.8197 35.8476 21.4542 36.2556C21.7855 36.4686 23.37 35.4501 24.1974 34.7478C24.3309 34.9359 24.5458 35.0435 24.9877 35.0333C25.6559 35.0178 26.7397 34.8623 26.9079 34.5511C26.9181 34.5322 26.9269 34.5098 26.9344 34.4844C27.7849 34.8022 29.2817 35.1386 29.6161 35.0884C30.4875 34.9575 29.4947 30.8899 29.0913 30.703Z", fill: "#3CA82B" }), /* @__PURE__ */ _("path", { d: "M26.6335 32.3093C26.6696 32.3736 26.6986 32.4415 26.7233 32.5105C26.8445 32.8496 27.042 33.9283 26.8926 34.1947C26.7433 34.4612 25.7731 34.5898 25.1745 34.6002C24.576 34.6105 24.4413 34.3916 24.32 34.0525C24.2231 33.7813 24.1753 33.1435 24.1765 32.7783C24.1519 32.2367 24.3498 32.0462 25.2646 31.8982C25.9415 31.7887 26.2994 31.9161 26.506 32.1341C27.467 31.4168 29.0705 30.4046 29.2269 30.5896C30.0068 31.512 30.1053 33.7079 29.9365 34.5914C29.8813 34.8802 27.2991 34.3052 27.2991 33.9938C27.2991 32.7004 26.9635 32.3456 26.6335 32.3093Z", fill: "#4CBA3C" }), /* @__PURE__ */ _("path", { d: "M20.9771 31.9054C21.1886 31.5707 22.9036 31.9869 23.8451 32.4059C23.8451 32.4059 23.6516 33.2824 23.9596 34.315C24.0497 34.617 21.7937 35.9614 21.4992 35.7301C21.1589 35.4628 20.5326 32.6089 20.9771 31.9054Z", fill: "#4CBA3C" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M21.8077 25.1063C21.9465 24.5029 22.5929 23.3659 24.9011 23.3935C26.0681 23.3887 27.5176 23.393 28.4786 23.2839C29.907 23.1216 30.9672 22.7761 31.6737 22.5068C32.6729 22.1256 33.0275 22.2106 33.1518 22.4387C33.2884 22.6893 33.1274 23.1221 32.7783 23.5205C32.1114 24.2814 30.9126 24.8711 28.7952 25.0461C26.6779 25.2211 25.2751 24.6531 24.6713 25.5778C24.4109 25.9766 24.6122 26.9166 26.6598 27.2126C29.4268 27.6119 31.6992 26.7314 31.98 27.2632C32.2608 27.795 30.6434 28.8769 27.8719 28.8996C25.1005 28.9222 23.3694 27.9292 22.7556 27.4356C21.9767 26.8094 21.6282 25.8961 21.8077 25.1063Z", fill: "#FFCC33" }), /* @__PURE__ */ _("g", { opacity: "0.8" }, /* @__PURE__ */ _("path", { d: "M25.3372 18.5086C25.4918 18.2554 25.8346 18.0601 26.3956 18.0601C26.9565 18.0601 27.2205 18.2833 27.4032 18.5322C27.4403 18.5829 27.384 18.6425 27.3264 18.6175C27.3125 18.6115 27.2985 18.6054 27.2842 18.5992C27.079 18.5096 26.8271 18.3995 26.3956 18.3934C25.934 18.3868 25.6429 18.5024 25.4597 18.6021C25.3979 18.6356 25.3006 18.5686 25.3372 18.5086Z", fill: "#14307E" }), /* @__PURE__ */ _("path", { d: "M19.0214 18.8324C19.5661 18.6048 19.9942 18.6342 20.2969 18.7058C20.3606 18.7209 20.4049 18.6523 20.3539 18.6112C20.119 18.4217 19.5933 18.1865 18.9076 18.4422C18.2959 18.6703 18.0076 19.1441 18.0059 19.4557C18.0055 19.5291 18.1565 19.5354 18.1956 19.4732C18.3012 19.3053 18.4767 19.0601 19.0214 18.8324Z", fill: "#14307E" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M26.8721 21.9714C26.3905 21.9714 25.9999 21.5819 25.9999 21.1024C25.9999 20.623 26.3905 20.2334 26.8721 20.2334C27.3537 20.2334 27.7443 20.623 27.7443 21.1024C27.7443 21.5819 27.3537 21.9714 26.8721 21.9714ZM27.4864 20.8145C27.4864 20.6904 27.3847 20.5898 27.2605 20.5898C27.1364 20.5898 27.0358 20.6904 27.0347 20.8145C27.0347 20.9387 27.1364 21.0393 27.2605 21.0393C27.3858 21.0393 27.4864 20.9387 27.4864 20.8145Z", fill: "#14307E" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M21.0933 21.7038C21.0933 22.2635 20.6385 22.7173 20.0766 22.7173C19.5159 22.7173 19.06 22.2635 19.06 21.7038C19.06 21.1441 19.5159 20.6904 20.0766 20.6904C20.6374 20.6904 21.0933 21.1441 21.0933 21.7038ZM20.7936 21.3678C20.7936 21.2233 20.6759 21.1056 20.5304 21.1056C20.3859 21.1056 20.2682 21.2223 20.2671 21.3678C20.2671 21.5123 20.3848 21.63 20.5304 21.63C20.6759 21.63 20.7936 21.5123 20.7936 21.3678Z", fill: "#14307E" }))), name === "PrivacyPro" && /* @__PURE__ */ _("svg", { xmlns: "http://www.w3.org/2000/svg", width: "48", height: "48", viewBox: "0 0 48 48", fill: "none" }, /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M27.629 9.23049C26.8 8.34395 25.7498 7.99321 24.4999 8.0001C21.2503 7.99324 21.7126 8.46165 21.0003 9.21477C19.73 10.5579 19.4795 11.283 18.3526 11.661C17.22 12.0408 15.9189 12.7539 14 12.5C11.8615 12.2171 9.02112 11.9033 9.00175 14.2896C8.94035 21.8556 10.4937 28.0976 12.7723 31.6739C15.296 35.6347 17.8011 37.6973 21.2503 39.5324C22.422 40.1559 25.4632 40.1559 26.6348 39.5323C30.084 37.6972 34.2058 35.6346 36.7294 31.6739C39.0081 28.0976 40.0589 23.1568 39.9975 15.5905C39.9781 13.2022 38.0998 11.8892 35.5646 11.8892C35.2955 11.8892 34.3346 11.8361 33.9988 11.8603C33.696 11.8821 33.9083 12.0335 33.6341 12.0349C32.6677 12.0396 31.8684 11.9194 31.1599 11.6889C30.0308 11.3214 28.9118 10.6022 27.629 9.23049Z", fill: "#C18010" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M25.8311 9.237C24.3178 7.59213 21.6746 7.58847 20.1552 9.22129C18.9056 10.5641 17.8147 11.2891 16.7062 11.6669C15.5921 12.0467 14.2457 12.1488 12.3581 11.895C10.2546 11.6121 8.02155 13.2104 8.0025 15.5962C7.9421 23.1605 8.97575 28.1002 11.2172 31.6756C13.6996 35.6356 17.7541 37.6977 21.147 39.5325C22.2995 40.1559 23.7006 40.1558 24.8532 39.5324C28.246 37.6977 32.3004 35.6356 34.7828 31.6756C37.0243 28.1001 38.0579 23.1603 37.9975 15.5957C37.9784 13.2078 35.742 11.6094 33.6371 11.8951C31.7607 12.1498 30.4182 12.0633 29.3044 11.6949C28.1937 11.3275 27.0929 10.6084 25.8311 9.237Z", fill: "#FFCC33" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M25.8311 9.237C24.3178 7.59213 21.6746 7.58847 20.1552 9.22129C18.9056 10.5641 17.8147 11.2891 16.7062 11.6669C15.5921 12.0467 14.2457 12.1488 12.3581 11.895C10.2546 11.6121 8.02155 13.2104 8.0025 15.5962C7.9421 23.1605 8.97575 28.1002 11.2172 31.6756C13.6996 35.6356 17.7541 37.6977 21.147 39.5325C22.2995 40.1559 23.7006 40.1558 24.8532 39.5324C28.246 37.6977 32.3004 35.6356 34.7828 31.6756C37.0243 28.1001 38.0579 23.1603 37.9975 15.5957C37.9784 13.2078 35.742 11.6094 33.6371 11.8951C31.7607 12.1498 30.4182 12.0633 29.3044 11.6949C28.1937 11.3275 27.0929 10.6084 25.8311 9.237Z", fill: "#FFD65C" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M23.063 39.9995C22.4036 40.0101 21.742 39.8544 21.1468 39.5325C20.9942 39.45 20.8403 39.367 20.6853 39.2834C17.3924 37.5084 13.5878 35.4575 11.217 31.6756C8.97559 28.1002 7.94194 23.1605 8.00234 15.5962C8.02138 13.2104 10.2544 11.6121 12.3579 11.895C14.2455 12.1488 15.592 12.0467 16.7061 11.6669C17.8146 11.2891 18.9054 10.5641 20.155 9.22129C20.9125 8.40729 21.9492 8 22.986 8C23.0718 8 23.1576 8.00279 23.2432 8.00836C23.1999 8.24461 22.2612 13.4877 22.2612 23.7377C22.2612 31.3487 22.7787 37.3033 23.063 39.9995Z", fill: "#FFDE7A" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M22.3363 37.3335L22.3361 37.3334C22.2395 37.2811 22.1429 37.229 22.0465 37.1769C18.6189 35.325 15.3476 33.5576 13.3354 30.3478C11.4696 27.3715 10.4434 23.0044 10.5024 15.6162C10.5054 15.2466 10.6669 14.9331 10.9655 14.6929C11.2889 14.4328 11.6941 14.3282 12.0249 14.3727C14.1505 14.6585 15.9152 14.5779 17.5129 14.0332C19.1172 13.4863 20.5415 12.476 21.9854 10.9244C22.5139 10.3564 23.4662 10.3589 23.9913 10.9297C25.457 12.5228 26.9015 13.5333 28.5193 14.0684C30.1176 14.5971 31.8746 14.6573 33.9733 14.3724C34.3043 14.3275 34.71 14.4318 35.0338 14.6919C35.3329 14.9321 35.4946 15.2458 35.4976 15.6157C35.5566 23.0042 34.5305 27.3714 32.6646 30.3478C30.6524 33.5577 27.3808 35.3252 23.9531 37.1771C23.8569 37.2291 23.7605 37.2812 23.664 37.3333L23.6637 37.3335C23.2533 37.5555 22.7467 37.5555 22.3363 37.3335ZM24.8532 39.5324C23.7006 40.1558 22.2995 40.1559 21.147 39.5325C20.9944 39.45 20.8405 39.367 20.6854 39.2834C17.3926 37.5084 13.588 35.4575 11.2172 31.6756C8.97575 28.1002 7.9421 23.1605 8.0025 15.5962C8.02155 13.2104 10.2546 11.6121 12.3581 11.895C14.2457 12.1488 15.5921 12.0467 16.7062 11.6669C17.8147 11.2891 18.9056 10.5641 20.1552 9.22129C21.6746 7.58847 24.3178 7.59213 25.8311 9.237C27.0929 10.6084 28.1937 11.3275 29.3044 11.6949C30.4182 12.0633 31.7607 12.1498 33.6371 11.8951C35.742 11.6094 37.9784 13.2078 37.9975 15.5957C38.0579 23.1603 37.0243 28.1001 34.7828 31.6756C32.412 35.4577 28.6071 37.5086 25.3142 39.2836C25.1594 39.3671 25.0056 39.45 24.8532 39.5324Z", fill: "#E2A412" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M23.1069 39.9985C22.4331 40.0169 21.7553 39.8616 21.1469 39.5325C20.9946 39.4501 20.841 39.3673 20.6863 39.2839L20.6854 39.2834C17.3926 37.5084 13.5879 35.4575 11.2171 31.6756C8.9757 28.1002 7.94205 23.1605 8.00245 15.5962C8.0215 13.2104 10.2545 11.6121 12.3581 11.895C14.2456 12.1488 15.5921 12.0467 16.7062 11.6669C17.8147 11.2891 18.9056 10.5641 20.1551 9.22129C20.9126 8.40729 21.9493 8 22.9862 8C23.072 8 23.1579 8.00279 23.2437 8.00838C23.2311 8.09934 23.1185 8.93031 22.9845 10.5C22.6164 10.5003 22.2484 10.6417 21.9853 10.9244C20.5414 12.476 19.1171 13.4863 17.5128 14.0332C15.9152 14.5779 14.1505 14.6585 12.0249 14.3727C11.6941 14.3282 11.2888 14.4328 10.9655 14.6929C10.6668 14.9331 10.5053 15.2466 10.5024 15.6162C10.4434 23.0044 11.4695 27.3715 13.3353 30.3478C15.3475 33.5576 18.6188 35.325 22.0464 37.1769L22.0464 37.1769L22.3361 37.3334L22.3363 37.3335C22.52 37.4329 22.7229 37.4878 22.9279 37.4982C22.9926 38.5066 23.0549 39.3475 23.1069 39.9985Z", fill: "#F9BE1A" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M30 23.75C30 24.7165 29.2165 25.5 28.25 25.5L17.25 25.5C16.2835 25.5 15.5 24.7165 15.5 23.75C15.5 22.7835 16.2835 22 17.25 22L28.25 22C29.2165 22 30 22.7835 30 23.75Z", fill: "#F9BE1A" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M22.75 16.5C23.7165 16.5 24.5 17.2835 24.5 18.25V29.25C24.5 30.2165 23.7165 31 22.75 31C21.7835 31 21 30.2165 21 29.25V18.25C21 17.2835 21.7835 16.5 22.75 16.5Z", fill: "#F9BE1A" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M22.75 16.5C23.7165 16.5 24.5 17.2835 24.5 18.25V22H28.25C29.2165 22 30 22.7835 30 23.75C30 24.7165 29.2165 25.5 28.25 25.5H24.5V29.25C24.5 30.2165 23.7165 31 22.75 31C21.7835 31 21 30.2165 21 29.25V18.25C21 17.2835 21.7835 16.5 22.75 16.5Z", fill: "#E2A412" }), /* @__PURE__ */ _("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M22.6392 30.9967C21.7243 30.9395 21 30.1794 21 29.2501V25.5001H17.25C16.2836 25.5001 15.5001 24.7166 15.5001 23.7501C15.5001 22.7836 16.2836 22.0001 17.25 22.0001H21V18.2501C21 17.3226 21.7215 16.5637 22.6339 16.5039C22.5543 18.4727 22.4998 20.8048 22.4998 23.5001C22.4998 26.2544 22.5567 28.7811 22.6392 30.9967Z", fill: "#F9BE1A" })));
  }

  // pages/new-tab/app/remote-messaging-framework/RemoteMessagingFramework.js
  function RemoteMessagingFramework(props) {
    const { id, messageType, titleText, descriptionText, icon, primaryActionText = "", primaryAction, secondaryActionText = "", secondaryAction } = props;
    const handlePrimaryClick = () => {
      primaryAction();
    };
    const handleSecondaryClick = () => {
      secondaryAction();
    };
    return /* @__PURE__ */ _(b, null, /* @__PURE__ */ _("p", null, messageType), /* @__PURE__ */ _("div", { id, class: (0, import_classnames2.default)(RemoteMessagingFramework_default.root, icon && RemoteMessagingFramework_default.icon) }, icon && /* @__PURE__ */ _("span", { class: RemoteMessagingFramework_default.iconBlock }, /* @__PURE__ */ _(MessageIcons, { name: icon })), /* @__PURE__ */ _("div", { class: RemoteMessagingFramework_default.content }, /* @__PURE__ */ _("p", { class: RemoteMessagingFramework_default.title }, titleText), /* @__PURE__ */ _("p", null, descriptionText), messageType === "big_two_action" && /* @__PURE__ */ _("div", { className: "buttonRow" }, primaryActionText.length && /* @__PURE__ */ _("button", { class: (0, import_classnames2.default)(RemoteMessagingFramework_default.btn, RemoteMessagingFramework_default.primary), onClick: handlePrimaryClick }, primaryActionText), secondaryActionText.length > 0 && /* @__PURE__ */ _("button", { class: (0, import_classnames2.default)(RemoteMessagingFramework_default.btn, RemoteMessagingFramework_default.secondary), onClick: handleSecondaryClick }, secondaryActionText))), messageType === "big_single_action" && primaryActionText && primaryAction && /* @__PURE__ */ _("button", { class: (0, import_classnames2.default)(RemoteMessagingFramework_default.btn), onClick: handlePrimaryClick }, primaryActionText)));
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
    },
    "rmf-small": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          messageType: "small",
          titleText: "Small title",
          descriptionText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
        }
      )
    },
    "rmf-medium": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          messageType: "medium",
          icon: "Announce",
          titleText: "Medium title",
          descriptionText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
        }
      )
    },
    "rmf-big-single-action": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          messageType: "big_single_action",
          icon: "AppUpdate",
          titleText: "Big one button title",
          descriptionText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus.",
          primaryActionText: "Take Survey",
          primaryAction: () => {
          }
        }
      )
    },
    "rmf-big-two-action": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          messageType: "big_two_action",
          icon: "CriticalUpdate",
          titleText: "Big 2 buttons title",
          descriptionText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus.",
          primaryActionText: "Take Survey",
          primaryAction: () => {
          },
          secondaryActionText: "Remind Me Later",
          secondaryAction: () => {
          }
        }
      )
    },
    "rmf-big-two-action-overflow": {
      factory: () => /* @__PURE__ */ _(
        RemoteMessagingFramework,
        {
          messageType: "big_two_action",
          icon: "DDGAnnounce",
          titleText: "Big 2 buttons with long titles",
          descriptionText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus.",
          primaryActionText: "How to update Windows with every step fully explained",
          primaryAction: () => {
          },
          secondaryActionText: "Remind me later, but only if I\u2019m actually going to update soon",
          secondaryAction: () => {
          }
        }
      )
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
  var url2 = new URL(window.location.href);

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
  var baseEnvironment = new Environment().withInjectName("windows").withEnv("production");
  var messaging = createSpecialPageMessaging({
    injectName: "windows",
    env: "production",
    pageName: "newTabPage",
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration")
        return null;
      let mock = null;
      return mock;
    }
  });
  var newTabMessaging = new NewTabPage(messaging, "windows");
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
