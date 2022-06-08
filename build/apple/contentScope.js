(function () {
    'use strict';

    function getTopLevelURL () {
        try {
            // FROM: https://stackoverflow.com/a/7739035/73479
            // FIX: Better capturing of top level URL so that trackers in embedded documents are not considered first party
            if (window.location !== window.parent.location) {
                return new URL(window.location.href !== 'about:blank' ? document.referrer : window.parent.location.href)
            } else {
                return new URL(window.location.href)
            }
        } catch (error) {
            return new URL(location.href)
        }
    }

    function isUnprotectedDomain (topLevelUrl, featureList) {
        let unprotectedDomain = false;
        const domainParts = topLevelUrl && topLevelUrl.host ? topLevelUrl.host.split('.') : [];

        // walk up the domain to see if it's unprotected
        while (domainParts.length > 1 && !unprotectedDomain) {
            const partialDomain = domainParts.join('.');

            unprotectedDomain = featureList.filter(domain => domain.domain === partialDomain).length > 0;

            domainParts.shift();
        }

        return unprotectedDomain
    }

    function processConfig (data, userList, preferences) {
        const topLevelUrl = getTopLevelURL();
        const allowlisted = userList.filter(domain => domain === topLevelUrl.host).length > 0;
        const enabledFeatures = Object.keys(data.features).filter((featureName) => {
            const feature = data.features[featureName];
            return feature.state === 'enabled' && !isUnprotectedDomain(topLevelUrl, feature.exceptions)
        });
        const isBroken = isUnprotectedDomain(topLevelUrl, data.unprotectedTemporary);
        preferences.site = {
            domain: topLevelUrl.hostname,
            isBroken,
            allowlisted,
            enabledFeatures
        };
        // TODO
        preferences.cookie = {};
        return preferences
    }

    var contentScopeFeatures = (function (exports) {
  'use strict';

  // @ts-nocheck
      const sjcl = (() => {
  /*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
  /*global document, window, escape, unescape, module, require, Uint32Array */

  /**
   * The Stanford Javascript Crypto Library, top-level namespace.
   * @namespace
   */
  var sjcl = {
    /**
     * Symmetric ciphers.
     * @namespace
     */
    cipher: {},

    /**
     * Hash functions.  Right now only SHA256 is implemented.
     * @namespace
     */
    hash: {},

    /**
     * Key exchange functions.  Right now only SRP is implemented.
     * @namespace
     */
    keyexchange: {},
    
    /**
     * Cipher modes of operation.
     * @namespace
     */
    mode: {},

    /**
     * Miscellaneous.  HMAC and PBKDF2.
     * @namespace
     */
    misc: {},
    
    /**
     * Bit array encoders and decoders.
     * @namespace
     *
     * @description
     * The members of this namespace are functions which translate between
     * SJCL's bitArrays and other objects (usually strings).  Because it
     * isn't always clear which direction is encoding and which is decoding,
     * the method names are "fromBits" and "toBits".
     */
    codec: {},
    
    /**
     * Exceptions.
     * @namespace
     */
    exception: {
      /**
       * Ciphertext is corrupt.
       * @constructor
       */
      corrupt: function(message) {
        this.toString = function() { return "CORRUPT: "+this.message; };
        this.message = message;
      },
      
      /**
       * Invalid parameter.
       * @constructor
       */
      invalid: function(message) {
        this.toString = function() { return "INVALID: "+this.message; };
        this.message = message;
      },
      
      /**
       * Bug or missing feature in SJCL.
       * @constructor
       */
      bug: function(message) {
        this.toString = function() { return "BUG: "+this.message; };
        this.message = message;
      },

      /**
       * Something isn't ready.
       * @constructor
       */
      notReady: function(message) {
        this.toString = function() { return "NOT READY: "+this.message; };
        this.message = message;
      }
    }
  };
  /** @fileOverview Arrays of bits, encoded as arrays of Numbers.
   *
   * @author Emily Stark
   * @author Mike Hamburg
   * @author Dan Boneh
   */

  /**
   * Arrays of bits, encoded as arrays of Numbers.
   * @namespace
   * @description
   * <p>
   * These objects are the currency accepted by SJCL's crypto functions.
   * </p>
   *
   * <p>
   * Most of our crypto primitives operate on arrays of 4-byte words internally,
   * but many of them can take arguments that are not a multiple of 4 bytes.
   * This library encodes arrays of bits (whose size need not be a multiple of 8
   * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
   * array of words, 32 bits at a time.  Since the words are double-precision
   * floating point numbers, they fit some extra data.  We use this (in a private,
   * possibly-changing manner) to encode the number of bits actually  present
   * in the last word of the array.
   * </p>
   *
   * <p>
   * Because bitwise ops clear this out-of-band data, these arrays can be passed
   * to ciphers like AES which want arrays of words.
   * </p>
   */
  sjcl.bitArray = {
    /**
     * Array slices in units of bits.
     * @param {bitArray} a The array to slice.
     * @param {Number} bstart The offset to the start of the slice, in bits.
     * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
     * slice until the end of the array.
     * @return {bitArray} The requested slice.
     */
    bitSlice: function (a, bstart, bend) {
      a = sjcl.bitArray._shiftRight(a.slice(bstart/32), 32 - (bstart & 31)).slice(1);
      return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend-bstart);
    },

    /**
     * Extract a number packed into a bit array.
     * @param {bitArray} a The array to slice.
     * @param {Number} bstart The offset to the start of the slice, in bits.
     * @param {Number} blength The length of the number to extract.
     * @return {Number} The requested slice.
     */
    extract: function(a, bstart, blength) {
      // FIXME: this Math.floor is not necessary at all, but for some reason
      // seems to suppress a bug in the Chromium JIT.
      var x, sh = Math.floor((-bstart-blength) & 31);
      if ((bstart + blength - 1 ^ bstart) & -32) {
        // it crosses a boundary
        x = (a[bstart/32|0] << (32 - sh)) ^ (a[bstart/32+1|0] >>> sh);
      } else {
        // within a single word
        x = a[bstart/32|0] >>> sh;
      }
      return x & ((1<<blength) - 1);
    },

    /**
     * Concatenate two bit arrays.
     * @param {bitArray} a1 The first array.
     * @param {bitArray} a2 The second array.
     * @return {bitArray} The concatenation of a1 and a2.
     */
    concat: function (a1, a2) {
      if (a1.length === 0 || a2.length === 0) {
        return a1.concat(a2);
      }
      
      var last = a1[a1.length-1], shift = sjcl.bitArray.getPartial(last);
      if (shift === 32) {
        return a1.concat(a2);
      } else {
        return sjcl.bitArray._shiftRight(a2, shift, last|0, a1.slice(0,a1.length-1));
      }
    },

    /**
     * Find the length of an array of bits.
     * @param {bitArray} a The array.
     * @return {Number} The length of a, in bits.
     */
    bitLength: function (a) {
      var l = a.length, x;
      if (l === 0) { return 0; }
      x = a[l - 1];
      return (l-1) * 32 + sjcl.bitArray.getPartial(x);
    },

    /**
     * Truncate an array.
     * @param {bitArray} a The array.
     * @param {Number} len The length to truncate to, in bits.
     * @return {bitArray} A new array, truncated to len bits.
     */
    clamp: function (a, len) {
      if (a.length * 32 < len) { return a; }
      a = a.slice(0, Math.ceil(len / 32));
      var l = a.length;
      len = len & 31;
      if (l > 0 && len) {
        a[l-1] = sjcl.bitArray.partial(len, a[l-1] & 0x80000000 >> (len-1), 1);
      }
      return a;
    },

    /**
     * Make a partial word for a bit array.
     * @param {Number} len The number of bits in the word.
     * @param {Number} x The bits.
     * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
     * @return {Number} The partial word.
     */
    partial: function (len, x, _end) {
      if (len === 32) { return x; }
      return (_end ? x|0 : x << (32-len)) + len * 0x10000000000;
    },

    /**
     * Get the number of bits used by a partial word.
     * @param {Number} x The partial word.
     * @return {Number} The number of bits used by the partial word.
     */
    getPartial: function (x) {
      return Math.round(x/0x10000000000) || 32;
    },

    /**
     * Compare two arrays for equality in a predictable amount of time.
     * @param {bitArray} a The first array.
     * @param {bitArray} b The second array.
     * @return {boolean} true if a == b; false otherwise.
     */
    equal: function (a, b) {
      if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
        return false;
      }
      var x = 0, i;
      for (i=0; i<a.length; i++) {
        x |= a[i]^b[i];
      }
      return (x === 0);
    },

    /** Shift an array right.
     * @param {bitArray} a The array to shift.
     * @param {Number} shift The number of bits to shift.
     * @param {Number} [carry=0] A byte to carry in
     * @param {bitArray} [out=[]] An array to prepend to the output.
     * @private
     */
    _shiftRight: function (a, shift, carry, out) {
      var i, last2=0, shift2;
      if (out === undefined) { out = []; }
      
      for (; shift >= 32; shift -= 32) {
        out.push(carry);
        carry = 0;
      }
      if (shift === 0) {
        return out.concat(a);
      }
      
      for (i=0; i<a.length; i++) {
        out.push(carry | a[i]>>>shift);
        carry = a[i] << (32-shift);
      }
      last2 = a.length ? a[a.length-1] : 0;
      shift2 = sjcl.bitArray.getPartial(last2);
      out.push(sjcl.bitArray.partial(shift+shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(),1));
      return out;
    },
    
    /** xor a block of 4 words together.
     * @private
     */
    _xor4: function(x,y) {
      return [x[0]^y[0],x[1]^y[1],x[2]^y[2],x[3]^y[3]];
    },

    /** byteswap a word array inplace.
     * (does not handle partial words)
     * @param {sjcl.bitArray} a word array
     * @return {sjcl.bitArray} byteswapped array
     */
    byteswapM: function(a) {
      var i, v, m = 0xff00;
      for (i = 0; i < a.length; ++i) {
        v = a[i];
        a[i] = (v >>> 24) | ((v >>> 8) & m) | ((v & m) << 8) | (v << 24);
      }
      return a;
    }
  };
  /** @fileOverview Bit array codec implementations.
   *
   * @author Emily Stark
   * @author Mike Hamburg
   * @author Dan Boneh
   */

  /**
   * UTF-8 strings
   * @namespace
   */
  sjcl.codec.utf8String = {
    /** Convert from a bitArray to a UTF-8 string. */
    fromBits: function (arr) {
      var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
      for (i=0; i<bl/8; i++) {
        if ((i&3) === 0) {
          tmp = arr[i/4];
        }
        out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
        tmp <<= 8;
      }
      return decodeURIComponent(escape(out));
    },

    /** Convert from a UTF-8 string to a bitArray. */
    toBits: function (str) {
      str = unescape(encodeURIComponent(str));
      var out = [], i, tmp=0;
      for (i=0; i<str.length; i++) {
        tmp = tmp << 8 | str.charCodeAt(i);
        if ((i&3) === 3) {
          out.push(tmp);
          tmp = 0;
        }
      }
      if (i&3) {
        out.push(sjcl.bitArray.partial(8*(i&3), tmp));
      }
      return out;
    }
  };
  /** @fileOverview Bit array codec implementations.
   *
   * @author Emily Stark
   * @author Mike Hamburg
   * @author Dan Boneh
   */

  /**
   * Hexadecimal
   * @namespace
   */
  sjcl.codec.hex = {
    /** Convert from a bitArray to a hex string. */
    fromBits: function (arr) {
      var out = "", i;
      for (i=0; i<arr.length; i++) {
        out += ((arr[i]|0)+0xF00000000000).toString(16).substr(4);
      }
      return out.substr(0, sjcl.bitArray.bitLength(arr)/4);//.replace(/(.{8})/g, "$1 ");
    },
    /** Convert from a hex string to a bitArray. */
    toBits: function (str) {
      var i, out=[], len;
      str = str.replace(/\s|0x/g, "");
      len = str.length;
      str = str + "00000000";
      for (i=0; i<str.length; i+=8) {
        out.push(parseInt(str.substr(i,8),16)^0);
      }
      return sjcl.bitArray.clamp(out, len*4);
    }
  };

  /** @fileOverview Javascript SHA-256 implementation.
   *
   * An older version of this implementation is available in the public
   * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
   * Stanford University 2008-2010 and BSD-licensed for liability
   * reasons.
   *
   * Special thanks to Aldo Cortesi for pointing out several bugs in
   * this code.
   *
   * @author Emily Stark
   * @author Mike Hamburg
   * @author Dan Boneh
   */

  /**
   * Context for a SHA-256 operation in progress.
   * @constructor
   */
  sjcl.hash.sha256 = function (hash) {
    if (!this._key[0]) { this._precompute(); }
    if (hash) {
      this._h = hash._h.slice(0);
      this._buffer = hash._buffer.slice(0);
      this._length = hash._length;
    } else {
      this.reset();
    }
  };

  /**
   * Hash a string or an array of words.
   * @static
   * @param {bitArray|String} data the data to hash.
   * @return {bitArray} The hash value, an array of 16 big-endian words.
   */
  sjcl.hash.sha256.hash = function (data) {
    return (new sjcl.hash.sha256()).update(data).finalize();
  };

  sjcl.hash.sha256.prototype = {
    /**
     * The hash's block size, in bits.
     * @constant
     */
    blockSize: 512,
     
    /**
     * Reset the hash state.
     * @return this
     */
    reset:function () {
      this._h = this._init.slice(0);
      this._buffer = [];
      this._length = 0;
      return this;
    },
    
    /**
     * Input several words to the hash.
     * @param {bitArray|String} data the data to hash.
     * @return this
     */
    update: function (data) {
      if (typeof data === "string") {
        data = sjcl.codec.utf8String.toBits(data);
      }
      var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
          ol = this._length,
          nl = this._length = ol + sjcl.bitArray.bitLength(data);
      if (nl > 9007199254740991){
        throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
      }

      if (typeof Uint32Array !== 'undefined') {
  	var c = new Uint32Array(b);
      	var j = 0;
      	for (i = 512+ol - ((512+ol) & 511); i <= nl; i+= 512) {
        	    this._block(c.subarray(16 * j, 16 * (j+1)));
        	    j += 1;
      	}
      	b.splice(0, 16 * j);
      } else {
  	for (i = 512+ol - ((512+ol) & 511); i <= nl; i+= 512) {
        	    this._block(b.splice(0,16));
        	}
      }
      return this;
    },
    
    /**
     * Complete hashing and output the hash value.
     * @return {bitArray} The hash value, an array of 8 big-endian words.
     */
    finalize:function () {
      var i, b = this._buffer, h = this._h;

      // Round out and push the buffer
      b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1,1)]);
      
      // Round out the buffer to a multiple of 16 words, less the 2 length words.
      for (i = b.length + 2; i & 15; i++) {
        b.push(0);
      }
      
      // append the length
      b.push(Math.floor(this._length / 0x100000000));
      b.push(this._length | 0);

      while (b.length) {
        this._block(b.splice(0,16));
      }

      this.reset();
      return h;
    },

    /**
     * The SHA-256 initialization vector, to be precomputed.
     * @private
     */
    _init:[],
    /*
    _init:[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],
    */
    
    /**
     * The SHA-256 hash key, to be precomputed.
     * @private
     */
    _key:[],
    /*
    _key:
      [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
       0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
       0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
       0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
       0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
       0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
       0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
       0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
    */


    /**
     * Function to precompute _init and _key.
     * @private
     */
    _precompute: function () {
      var i = 0, prime = 2, factor, isPrime;

      function frac(x) { return (x-Math.floor(x)) * 0x100000000 | 0; }

      for (; i<64; prime++) {
        isPrime = true;
        for (factor=2; factor*factor <= prime; factor++) {
          if (prime % factor === 0) {
            isPrime = false;
            break;
          }
        }
        if (isPrime) {
          if (i<8) {
            this._init[i] = frac(Math.pow(prime, 1/2));
          }
          this._key[i] = frac(Math.pow(prime, 1/3));
          i++;
        }
      }
    },
    
    /**
     * Perform one cycle of SHA-256.
     * @param {Uint32Array|bitArray} w one block of words.
     * @private
     */
    _block:function (w) {  
      var i, tmp, a, b,
        h = this._h,
        k = this._key,
        h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3],
        h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];

      /* Rationale for placement of |0 :
       * If a value can overflow is original 32 bits by a factor of more than a few
       * million (2^23 ish), there is a possibility that it might overflow the
       * 53-bit mantissa and lose precision.
       *
       * To avoid this, we clamp back to 32 bits by |'ing with 0 on any value that
       * propagates around the loop, and on the hash state h[].  I don't believe
       * that the clamps on h4 and on h0 are strictly necessary, but it's close
       * (for h4 anyway), and better safe than sorry.
       *
       * The clamps on h[] are necessary for the output to be correct even in the
       * common case and for short inputs.
       */
      for (i=0; i<64; i++) {
        // load up the input word for this round
        if (i<16) {
          tmp = w[i];
        } else {
          a   = w[(i+1 ) & 15];
          b   = w[(i+14) & 15];
          tmp = w[i&15] = ((a>>>7  ^ a>>>18 ^ a>>>3  ^ a<<25 ^ a<<14) + 
                           (b>>>17 ^ b>>>19 ^ b>>>10 ^ b<<15 ^ b<<13) +
                           w[i&15] + w[(i+9) & 15]) | 0;
        }
        
        tmp = (tmp + h7 + (h4>>>6 ^ h4>>>11 ^ h4>>>25 ^ h4<<26 ^ h4<<21 ^ h4<<7) +  (h6 ^ h4&(h5^h6)) + k[i]); // | 0;
        
        // shift register
        h7 = h6; h6 = h5; h5 = h4;
        h4 = h3 + tmp | 0;
        h3 = h2; h2 = h1; h1 = h0;

        h0 = (tmp +  ((h1&h2) ^ (h3&(h1^h2))) + (h1>>>2 ^ h1>>>13 ^ h1>>>22 ^ h1<<30 ^ h1<<19 ^ h1<<10)) | 0;
      }

      h[0] = h[0]+h0 | 0;
      h[1] = h[1]+h1 | 0;
      h[2] = h[2]+h2 | 0;
      h[3] = h[3]+h3 | 0;
      h[4] = h[4]+h4 | 0;
      h[5] = h[5]+h5 | 0;
      h[6] = h[6]+h6 | 0;
      h[7] = h[7]+h7 | 0;
    }
  };


  /** @fileOverview HMAC implementation.
   *
   * @author Emily Stark
   * @author Mike Hamburg
   * @author Dan Boneh
   */

  /** HMAC with the specified hash function.
   * @constructor
   * @param {bitArray} key the key for HMAC.
   * @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
   */
  sjcl.misc.hmac = function (key, Hash) {
    this._hash = Hash = Hash || sjcl.hash.sha256;
    var exKey = [[],[]], i,
        bs = Hash.prototype.blockSize / 32;
    this._baseHash = [new Hash(), new Hash()];

    if (key.length > bs) {
      key = Hash.hash(key);
    }
    
    for (i=0; i<bs; i++) {
      exKey[0][i] = key[i]^0x36363636;
      exKey[1][i] = key[i]^0x5C5C5C5C;
    }
    
    this._baseHash[0].update(exKey[0]);
    this._baseHash[1].update(exKey[1]);
    this._resultHash = new Hash(this._baseHash[0]);
  };

  /** HMAC with the specified hash function.  Also called encrypt since it's a prf.
   * @param {bitArray|String} data The data to mac.
   */
  sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (data) {
    if (!this._updated) {
      this.update(data);
      return this.digest(data);
    } else {
      throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
    }
  };

  sjcl.misc.hmac.prototype.reset = function () {
    this._resultHash = new this._hash(this._baseHash[0]);
    this._updated = false;
  };

  sjcl.misc.hmac.prototype.update = function (data) {
    this._updated = true;
    this._resultHash.update(data);
  };

  sjcl.misc.hmac.prototype.digest = function () {
    var w = this._resultHash.finalize(), result = new (this._hash)(this._baseHash[1]).update(w).finalize();

    this.reset();

    return result;
  };

      return sjcl;
    })();

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var tldts = {};

  Object.defineProperty(tldts, '__esModule', { value: true });

  /**
   * Check if `vhost` is a valid suffix of `hostname` (top-domain)
   *
   * It means that `vhost` needs to be a suffix of `hostname` and we then need to
   * make sure that: either they are equal, or the character preceding `vhost` in
   * `hostname` is a '.' (it should not be a partial label).
   *
   * * hostname = 'not.evil.com' and vhost = 'vil.com'      => not ok
   * * hostname = 'not.evil.com' and vhost = 'evil.com'     => ok
   * * hostname = 'not.evil.com' and vhost = 'not.evil.com' => ok
   */
  function shareSameDomainSuffix(hostname, vhost) {
      if (hostname.endsWith(vhost)) {
          return (hostname.length === vhost.length ||
              hostname[hostname.length - vhost.length - 1] === '.');
      }
      return false;
  }
  /**
   * Given a hostname and its public suffix, extract the general domain.
   */
  function extractDomainWithSuffix(hostname, publicSuffix) {
      // Locate the index of the last '.' in the part of the `hostname` preceding
      // the public suffix.
      //
      // examples:
      //   1. not.evil.co.uk  => evil.co.uk
      //         ^    ^
      //         |    | start of public suffix
      //         | index of the last dot
      //
      //   2. example.co.uk   => example.co.uk
      //     ^       ^
      //     |       | start of public suffix
      //     |
      //     | (-1) no dot found before the public suffix
      const publicSuffixIndex = hostname.length - publicSuffix.length - 2;
      const lastDotBeforeSuffixIndex = hostname.lastIndexOf('.', publicSuffixIndex);
      // No '.' found, then `hostname` is the general domain (no sub-domain)
      if (lastDotBeforeSuffixIndex === -1) {
          return hostname;
      }
      // Extract the part between the last '.'
      return hostname.slice(lastDotBeforeSuffixIndex + 1);
  }
  /**
   * Detects the domain based on rules and upon and a host string
   */
  function getDomain$1(suffix, hostname, options) {
      // Check if `hostname` ends with a member of `validHosts`.
      if (options.validHosts !== null) {
          const validHosts = options.validHosts;
          for (let i = 0; i < validHosts.length; i += 1) {
              const vhost = validHosts[i];
              if ( /*@__INLINE__*/shareSameDomainSuffix(hostname, vhost) === true) {
                  return vhost;
              }
          }
      }
      // If `hostname` is a valid public suffix, then there is no domain to return.
      // Since we already know that `getPublicSuffix` returns a suffix of `hostname`
      // there is no need to perform a string comparison and we only compare the
      // size.
      if (suffix.length === hostname.length) {
          return null;
      }
      // To extract the general domain, we start by identifying the public suffix
      // (if any), then consider the domain to be the public suffix with one added
      // level of depth. (e.g.: if hostname is `not.evil.co.uk` and public suffix:
      // `co.uk`, then we take one more level: `evil`, giving the final result:
      // `evil.co.uk`).
      return /*@__INLINE__*/ extractDomainWithSuffix(hostname, suffix);
  }

  /**
   * Return the part of domain without suffix.
   *
   * Example: for domain 'foo.com', the result would be 'foo'.
   */
  function getDomainWithoutSuffix$1(domain, suffix) {
      // Note: here `domain` and `suffix` cannot have the same length because in
      // this case we set `domain` to `null` instead. It is thus safe to assume
      // that `suffix` is shorter than `domain`.
      return domain.slice(0, -suffix.length - 1);
  }

  /**
   * @param url - URL we want to extract a hostname from.
   * @param urlIsValidHostname - hint from caller; true if `url` is already a valid hostname.
   */
  function extractHostname(url, urlIsValidHostname) {
      let start = 0;
      let end = url.length;
      let hasUpper = false;
      // If url is not already a valid hostname, then try to extract hostname.
      if (urlIsValidHostname === false) {
          // Special handling of data URLs
          if (url.startsWith('data:') === true) {
              return null;
          }
          // Trim leading spaces
          while (start < url.length && url.charCodeAt(start) <= 32) {
              start += 1;
          }
          // Trim trailing spaces
          while (end > start + 1 && url.charCodeAt(end - 1) <= 32) {
              end -= 1;
          }
          // Skip scheme.
          if (url.charCodeAt(start) === 47 /* '/' */ &&
              url.charCodeAt(start + 1) === 47 /* '/' */) {
              start += 2;
          }
          else {
              const indexOfProtocol = url.indexOf(':/', start);
              if (indexOfProtocol !== -1) {
                  // Implement fast-path for common protocols. We expect most protocols
                  // should be one of these 4 and thus we will not need to perform the
                  // more expansive validity check most of the time.
                  const protocolSize = indexOfProtocol - start;
                  const c0 = url.charCodeAt(start);
                  const c1 = url.charCodeAt(start + 1);
                  const c2 = url.charCodeAt(start + 2);
                  const c3 = url.charCodeAt(start + 3);
                  const c4 = url.charCodeAt(start + 4);
                  if (protocolSize === 5 &&
                      c0 === 104 /* 'h' */ &&
                      c1 === 116 /* 't' */ &&
                      c2 === 116 /* 't' */ &&
                      c3 === 112 /* 'p' */ &&
                      c4 === 115 /* 's' */) ;
                  else if (protocolSize === 4 &&
                      c0 === 104 /* 'h' */ &&
                      c1 === 116 /* 't' */ &&
                      c2 === 116 /* 't' */ &&
                      c3 === 112 /* 'p' */) ;
                  else if (protocolSize === 3 &&
                      c0 === 119 /* 'w' */ &&
                      c1 === 115 /* 's' */ &&
                      c2 === 115 /* 's' */) ;
                  else if (protocolSize === 2 &&
                      c0 === 119 /* 'w' */ &&
                      c1 === 115 /* 's' */) ;
                  else {
                      // Check that scheme is valid
                      for (let i = start; i < indexOfProtocol; i += 1) {
                          const lowerCaseCode = url.charCodeAt(i) | 32;
                          if (((lowerCaseCode >= 97 && lowerCaseCode <= 122) || // [a, z]
                              (lowerCaseCode >= 48 && lowerCaseCode <= 57) || // [0, 9]
                              lowerCaseCode === 46 || // '.'
                              lowerCaseCode === 45 || // '-'
                              lowerCaseCode === 43) === false // '+'
                          ) {
                              return null;
                          }
                      }
                  }
                  // Skip 0, 1 or more '/' after ':/'
                  start = indexOfProtocol + 2;
                  while (url.charCodeAt(start) === 47 /* '/' */) {
                      start += 1;
                  }
              }
          }
          // Detect first occurrence of '/', '?' or '#'. We also keep track of the
          // last occurrence of '@', ']' or ':' to speed-up subsequent parsing of
          // (respectively), identifier, ipv6 or port.
          let indexOfIdentifier = -1;
          let indexOfClosingBracket = -1;
          let indexOfPort = -1;
          for (let i = start; i < end; i += 1) {
              const code = url.charCodeAt(i);
              if (code === 35 || // '#'
                  code === 47 || // '/'
                  code === 63 // '?'
              ) {
                  end = i;
                  break;
              }
              else if (code === 64) {
                  // '@'
                  indexOfIdentifier = i;
              }
              else if (code === 93) {
                  // ']'
                  indexOfClosingBracket = i;
              }
              else if (code === 58) {
                  // ':'
                  indexOfPort = i;
              }
              else if (code >= 65 && code <= 90) {
                  hasUpper = true;
              }
          }
          // Detect identifier: '@'
          if (indexOfIdentifier !== -1 &&
              indexOfIdentifier > start &&
              indexOfIdentifier < end) {
              start = indexOfIdentifier + 1;
          }
          // Handle ipv6 addresses
          if (url.charCodeAt(start) === 91 /* '[' */) {
              if (indexOfClosingBracket !== -1) {
                  return url.slice(start + 1, indexOfClosingBracket).toLowerCase();
              }
              return null;
          }
          else if (indexOfPort !== -1 && indexOfPort > start && indexOfPort < end) {
              // Detect port: ':'
              end = indexOfPort;
          }
      }
      // Trim trailing dots
      while (end > start + 1 && url.charCodeAt(end - 1) === 46 /* '.' */) {
          end -= 1;
      }
      const hostname = start !== 0 || end !== url.length ? url.slice(start, end) : url;
      if (hasUpper) {
          return hostname.toLowerCase();
      }
      return hostname;
  }

  /**
   * Check if a hostname is an IP. You should be aware that this only works
   * because `hostname` is already garanteed to be a valid hostname!
   */
  function isProbablyIpv4(hostname) {
      // Cannot be shorted than 1.1.1.1
      if (hostname.length < 7) {
          return false;
      }
      // Cannot be longer than: 255.255.255.255
      if (hostname.length > 15) {
          return false;
      }
      let numberOfDots = 0;
      for (let i = 0; i < hostname.length; i += 1) {
          const code = hostname.charCodeAt(i);
          if (code === 46 /* '.' */) {
              numberOfDots += 1;
          }
          else if (code < 48 /* '0' */ || code > 57 /* '9' */) {
              return false;
          }
      }
      return (numberOfDots === 3 &&
          hostname.charCodeAt(0) !== 46 /* '.' */ &&
          hostname.charCodeAt(hostname.length - 1) !== 46 /* '.' */);
  }
  /**
   * Similar to isProbablyIpv4.
   */
  function isProbablyIpv6(hostname) {
      if (hostname.length < 3) {
          return false;
      }
      let start = hostname[0] === '[' ? 1 : 0;
      let end = hostname.length;
      if (hostname[end - 1] === ']') {
          end -= 1;
      }
      // We only consider the maximum size of a normal IPV6. Note that this will
      // fail on so-called "IPv4 mapped IPv6 addresses" but this is a corner-case
      // and a proper validation library should be used for these.
      if (end - start > 39) {
          return false;
      }
      let hasColon = false;
      for (; start < end; start += 1) {
          const code = hostname.charCodeAt(start);
          if (code === 58 /* ':' */) {
              hasColon = true;
          }
          else if (((code >= 48 && code <= 57) || // 0-9
              (code >= 97 && code <= 102) || // a-f
              (code >= 65 && code <= 90)) === // A-F
              false) {
              return false;
          }
      }
      return hasColon;
  }
  /**
   * Check if `hostname` is *probably* a valid ip addr (either ipv6 or ipv4).
   * This *will not* work on any string. We need `hostname` to be a valid
   * hostname.
   */
  function isIp(hostname) {
      return isProbablyIpv6(hostname) || isProbablyIpv4(hostname);
  }

  /**
   * Implements fast shallow verification of hostnames. This does not perform a
   * struct check on the content of labels (classes of Unicode characters, etc.)
   * but instead check that the structure is valid (number of labels, length of
   * labels, etc.).
   *
   * If you need stricter validation, consider using an external library.
   */
  function isValidAscii(code) {
      return ((code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code > 127);
  }
  /**
   * Check if a hostname string is valid. It's usually a preliminary check before
   * trying to use getDomain or anything else.
   *
   * Beware: it does not check if the TLD exists.
   */
  function isValidHostname (hostname) {
      if (hostname.length > 255) {
          return false;
      }
      if (hostname.length === 0) {
          return false;
      }
      if ( /*@__INLINE__*/isValidAscii(hostname.charCodeAt(0)) === false) {
          return false;
      }
      // Validate hostname according to RFC
      let lastDotIndex = -1;
      let lastCharCode = -1;
      const len = hostname.length;
      for (let i = 0; i < len; i += 1) {
          const code = hostname.charCodeAt(i);
          if (code === 46 /* '.' */) {
              if (
              // Check that previous label is < 63 bytes long (64 = 63 + '.')
              i - lastDotIndex > 64 ||
                  // Check that previous character was not already a '.'
                  lastCharCode === 46 ||
                  // Check that the previous label does not end with a '-' (dash)
                  lastCharCode === 45 ||
                  // Check that the previous label does not end with a '_' (underscore)
                  lastCharCode === 95) {
                  return false;
              }
              lastDotIndex = i;
          }
          else if (( /*@__INLINE__*/isValidAscii(code) || code === 45 || code === 95) ===
              false) {
              // Check if there is a forbidden character in the label
              return false;
          }
          lastCharCode = code;
      }
      return (
      // Check that last label is shorter than 63 chars
      len - lastDotIndex - 1 <= 63 &&
          // Check that the last character is an allowed trailing label character.
          // Since we already checked that the char is a valid hostname character,
          // we only need to check that it's different from '-'.
          lastCharCode !== 45);
  }

  function setDefaultsImpl({ allowIcannDomains = true, allowPrivateDomains = false, detectIp = true, extractHostname = true, mixedInputs = true, validHosts = null, validateHostname = true, }) {
      return {
          allowIcannDomains,
          allowPrivateDomains,
          detectIp,
          extractHostname,
          mixedInputs,
          validHosts,
          validateHostname,
      };
  }
  const DEFAULT_OPTIONS = /*@__INLINE__*/ setDefaultsImpl({});
  function setDefaults(options) {
      if (options === undefined) {
          return DEFAULT_OPTIONS;
      }
      return /*@__INLINE__*/ setDefaultsImpl(options);
  }

  /**
   * Returns the subdomain of a hostname string
   */
  function getSubdomain$1(hostname, domain) {
      // If `hostname` and `domain` are the same, then there is no sub-domain
      if (domain.length === hostname.length) {
          return '';
      }
      return hostname.slice(0, -domain.length - 1);
  }

  /**
   * Implement a factory allowing to plug different implementations of suffix
   * lookup (e.g.: using a trie or the packed hashes datastructures). This is used
   * and exposed in `tldts.ts` and `tldts-experimental.ts` bundle entrypoints.
   */
  function getEmptyResult() {
      return {
          domain: null,
          domainWithoutSuffix: null,
          hostname: null,
          isIcann: null,
          isIp: null,
          isPrivate: null,
          publicSuffix: null,
          subdomain: null,
      };
  }
  function resetResult(result) {
      result.domain = null;
      result.domainWithoutSuffix = null;
      result.hostname = null;
      result.isIcann = null;
      result.isIp = null;
      result.isPrivate = null;
      result.publicSuffix = null;
      result.subdomain = null;
  }
  function parseImpl(url, step, suffixLookup, partialOptions, result) {
      const options = setDefaults(partialOptions);
      // Very fast approximate check to make sure `url` is a string. This is needed
      // because the library will not necessarily be used in a typed setup and
      // values of arbitrary types might be given as argument.
      if (typeof url !== 'string') {
          return result;
      }
      // Extract hostname from `url` only if needed. This can be made optional
      // using `options.extractHostname`. This option will typically be used
      // whenever we are sure the inputs to `parse` are already hostnames and not
      // arbitrary URLs.
      //
      // `mixedInput` allows to specify if we expect a mix of URLs and hostnames
      // as input. If only hostnames are expected then `extractHostname` can be
      // set to `false` to speed-up parsing. If only URLs are expected then
      // `mixedInputs` can be set to `false`. The `mixedInputs` is only a hint
      // and will not change the behavior of the library.
      if (options.extractHostname === false) {
          result.hostname = url;
      }
      else if (options.mixedInputs === true) {
          result.hostname = extractHostname(url, isValidHostname(url));
      }
      else {
          result.hostname = extractHostname(url, false);
      }
      if (step === 0 /* HOSTNAME */ || result.hostname === null) {
          return result;
      }
      // Check if `hostname` is a valid ip address
      if (options.detectIp === true) {
          result.isIp = isIp(result.hostname);
          if (result.isIp === true) {
              return result;
          }
      }
      // Perform optional hostname validation. If hostname is not valid, no need to
      // go further as there will be no valid domain or sub-domain.
      if (options.validateHostname === true &&
          options.extractHostname === true &&
          isValidHostname(result.hostname) === false) {
          result.hostname = null;
          return result;
      }
      // Extract public suffix
      suffixLookup(result.hostname, options, result);
      if (step === 2 /* PUBLIC_SUFFIX */ || result.publicSuffix === null) {
          return result;
      }
      // Extract domain
      result.domain = getDomain$1(result.publicSuffix, result.hostname, options);
      if (step === 3 /* DOMAIN */ || result.domain === null) {
          return result;
      }
      // Extract subdomain
      result.subdomain = getSubdomain$1(result.hostname, result.domain);
      if (step === 4 /* SUB_DOMAIN */) {
          return result;
      }
      // Extract domain without suffix
      result.domainWithoutSuffix = getDomainWithoutSuffix$1(result.domain, result.publicSuffix);
      return result;
  }

  function fastPathLookup (hostname, options, out) {
      // Fast path for very popular suffixes; this allows to by-pass lookup
      // completely as well as any extra allocation or string manipulation.
      if (options.allowPrivateDomains === false && hostname.length > 3) {
          const last = hostname.length - 1;
          const c3 = hostname.charCodeAt(last);
          const c2 = hostname.charCodeAt(last - 1);
          const c1 = hostname.charCodeAt(last - 2);
          const c0 = hostname.charCodeAt(last - 3);
          if (c3 === 109 /* 'm' */ &&
              c2 === 111 /* 'o' */ &&
              c1 === 99 /* 'c' */ &&
              c0 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'com';
              return true;
          }
          else if (c3 === 103 /* 'g' */ &&
              c2 === 114 /* 'r' */ &&
              c1 === 111 /* 'o' */ &&
              c0 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'org';
              return true;
          }
          else if (c3 === 117 /* 'u' */ &&
              c2 === 100 /* 'd' */ &&
              c1 === 101 /* 'e' */ &&
              c0 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'edu';
              return true;
          }
          else if (c3 === 118 /* 'v' */ &&
              c2 === 111 /* 'o' */ &&
              c1 === 103 /* 'g' */ &&
              c0 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'gov';
              return true;
          }
          else if (c3 === 116 /* 't' */ &&
              c2 === 101 /* 'e' */ &&
              c1 === 110 /* 'n' */ &&
              c0 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'net';
              return true;
          }
          else if (c3 === 101 /* 'e' */ &&
              c2 === 100 /* 'd' */ &&
              c1 === 46 /* '.' */) {
              out.isIcann = true;
              out.isPrivate = false;
              out.publicSuffix = 'de';
              return true;
          }
      }
      return false;
  }

  const exceptions$1 = (function () {
      const _0 = { "$": 1, "succ": {} }, _1 = { "$": 0, "succ": { "city": _0 } };
      const exceptions = { "$": 0, "succ": { "ck": { "$": 0, "succ": { "www": _0 } }, "jp": { "$": 0, "succ": { "kawasaki": _1, "kitakyushu": _1, "kobe": _1, "nagoya": _1, "sapporo": _1, "sendai": _1, "yokohama": _1 } } } };
      return exceptions;
  })();
  const rules = (function () {
      const _2 = { "$": 1, "succ": {} }, _3 = { "$": 2, "succ": {} }, _4 = { "$": 1, "succ": { "gov": _2, "com": _2, "org": _2, "net": _2, "edu": _2 } }, _5 = { "$": 0, "succ": { "*": _3 } }, _6 = { "$": 1, "succ": { "blogspot": _3 } }, _7 = { "$": 1, "succ": { "gov": _2 } }, _8 = { "$": 0, "succ": { "*": _2 } }, _9 = { "$": 0, "succ": { "cloud": _3 } }, _10 = { "$": 1, "succ": { "co": _3 } }, _11 = { "$": 2, "succ": { "nodes": _3 } }, _12 = { "$": 0, "succ": { "s3": _3 } }, _13 = { "$": 0, "succ": { "direct": _3 } }, _14 = { "$": 0, "succ": { "dualstack": _12 } }, _15 = { "$": 0, "succ": { "s3": _3, "dualstack": _12, "s3-website": _3 } }, _16 = { "$": 0, "succ": { "apps": _3 } }, _17 = { "$": 0, "succ": { "paas": _3 } }, _18 = { "$": 0, "succ": { "app": _3 } }, _19 = { "$": 2, "succ": { "eu": _3 } }, _20 = { "$": 0, "succ": { "site": _3 } }, _21 = { "$": 0, "succ": { "pages": _3 } }, _22 = { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2 } }, _23 = { "$": 0, "succ": { "j": _3 } }, _24 = { "$": 0, "succ": { "jelastic": _3 } }, _25 = { "$": 0, "succ": { "user": _3 } }, _26 = { "$": 1, "succ": { "ybo": _3 } }, _27 = { "$": 0, "succ": { "cust": _3, "reservd": _3 } }, _28 = { "$": 0, "succ": { "cust": _3 } }, _29 = { "$": 1, "succ": { "gov": _2, "edu": _2, "mil": _2, "com": _2, "org": _2, "net": _2 } }, _30 = { "$": 1, "succ": { "edu": _2, "biz": _2, "net": _2, "org": _2, "gov": _2, "info": _2, "com": _2 } }, _31 = { "$": 1, "succ": { "gov": _2, "blogspot": _3 } }, _32 = { "$": 1, "succ": { "barsy": _3 } }, _33 = { "$": 0, "succ": { "forgot": _3 } }, _34 = { "$": 1, "succ": { "gs": _2 } }, _35 = { "$": 0, "succ": { "nes": _2 } }, _36 = { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _2 } }, _37 = { "$": 1, "succ": { "cc": _2, "lib": _2 } };
      const rules = { "$": 0, "succ": { "ac": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "mil": _2, "org": _2, "drr": _3 } }, "ad": { "$": 1, "succ": { "nom": _2 } }, "ae": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "sch": _2, "ac": _2, "gov": _2, "mil": _2, "blogspot": _3 } }, "aero": { "$": 1, "succ": { "accident-investigation": _2, "accident-prevention": _2, "aerobatic": _2, "aeroclub": _2, "aerodrome": _2, "agents": _2, "aircraft": _2, "airline": _2, "airport": _2, "air-surveillance": _2, "airtraffic": _2, "air-traffic-control": _2, "ambulance": _2, "amusement": _2, "association": _2, "author": _2, "ballooning": _2, "broker": _2, "caa": _2, "cargo": _2, "catering": _2, "certification": _2, "championship": _2, "charter": _2, "civilaviation": _2, "club": _2, "conference": _2, "consultant": _2, "consulting": _2, "control": _2, "council": _2, "crew": _2, "design": _2, "dgca": _2, "educator": _2, "emergency": _2, "engine": _2, "engineer": _2, "entertainment": _2, "equipment": _2, "exchange": _2, "express": _2, "federation": _2, "flight": _2, "fuel": _2, "gliding": _2, "government": _2, "groundhandling": _2, "group": _2, "hanggliding": _2, "homebuilt": _2, "insurance": _2, "journal": _2, "journalist": _2, "leasing": _2, "logistics": _2, "magazine": _2, "maintenance": _2, "media": _2, "microlight": _2, "modelling": _2, "navigation": _2, "parachuting": _2, "paragliding": _2, "passenger-association": _2, "pilot": _2, "press": _2, "production": _2, "recreation": _2, "repbody": _2, "res": _2, "research": _2, "rotorcraft": _2, "safety": _2, "scientist": _2, "services": _2, "show": _2, "skydiving": _2, "software": _2, "student": _2, "trader": _2, "trading": _2, "trainer": _2, "union": _2, "workinggroup": _2, "works": _2 } }, "af": _4, "ag": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "co": _2, "nom": _2 } }, "ai": { "$": 1, "succ": { "off": _2, "com": _2, "net": _2, "org": _2, "uwu": _3 } }, "al": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "blogspot": _3 } }, "am": { "$": 1, "succ": { "co": _2, "com": _2, "commune": _2, "net": _2, "org": _2, "radio": _3, "blogspot": _3, "neko": _3, "nyaa": _3 } }, "ao": { "$": 1, "succ": { "ed": _2, "gv": _2, "og": _2, "co": _2, "pb": _2, "it": _2 } }, "aq": _2, "ar": { "$": 1, "succ": { "bet": _2, "com": _6, "coop": _2, "edu": _2, "gob": _2, "gov": _2, "int": _2, "mil": _2, "musica": _2, "mutual": _2, "net": _2, "org": _2, "senasa": _2, "tur": _2 } }, "arpa": { "$": 1, "succ": { "e164": _2, "in-addr": _2, "ip6": _2, "iris": _2, "uri": _2, "urn": _2 } }, "as": _7, "asia": { "$": 1, "succ": { "cloudns": _3 } }, "at": { "$": 1, "succ": { "ac": { "$": 1, "succ": { "sth": _2 } }, "co": _6, "gv": _2, "or": _2, "funkfeuer": { "$": 0, "succ": { "wien": _3 } }, "futurecms": { "$": 0, "succ": { "*": _3, "ex": _5, "in": _5 } }, "futurehosting": _3, "futuremailing": _3, "ortsinfo": { "$": 0, "succ": { "ex": _5, "kunden": _5 } }, "biz": _3, "info": _3, "priv": _3, "myspreadshop": _3, "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3 } }, "au": { "$": 1, "succ": { "com": { "$": 1, "succ": { "blogspot": _3, "cloudlets": { "$": 0, "succ": { "mel": _3 } }, "myspreadshop": _3 } }, "net": _2, "org": _2, "edu": { "$": 1, "succ": { "act": _2, "catholic": _2, "nsw": { "$": 1, "succ": { "schools": _2 } }, "nt": _2, "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 } }, "gov": { "$": 1, "succ": { "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 } }, "asn": _2, "id": _2, "info": _2, "conf": _2, "oz": _2, "act": _2, "nsw": _2, "nt": _2, "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 } }, "aw": { "$": 1, "succ": { "com": _2 } }, "ax": { "$": 1, "succ": { "be": _3, "cat": _3, "es": _3, "eu": _3, "gg": _3, "mc": _3, "us": _3, "xy": _3 } }, "az": { "$": 1, "succ": { "com": _2, "net": _2, "int": _2, "gov": _2, "org": _2, "edu": _2, "info": _2, "pp": _2, "mil": _2, "name": _2, "pro": _2, "biz": _2 } }, "ba": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "rs": _3, "blogspot": _3 } }, "bb": { "$": 1, "succ": { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "store": _2, "tv": _2 } }, "bd": _8, "be": { "$": 1, "succ": { "ac": _2, "webhosting": _3, "blogspot": _3, "interhostsolutions": _9, "kuleuven": { "$": 0, "succ": { "ezproxy": _3 } }, "myspreadshop": _3, "transurl": _5 } }, "bf": _7, "bg": { "$": 1, "succ": { "0": _2, "1": _2, "2": _2, "3": _2, "4": _2, "5": _2, "6": _2, "7": _2, "8": _2, "9": _2, "a": _2, "b": _2, "c": _2, "d": _2, "e": _2, "f": _2, "g": _2, "h": _2, "i": _2, "j": _2, "k": _2, "l": _2, "m": _2, "n": _2, "o": _2, "p": _2, "q": _2, "r": _2, "s": _2, "t": _2, "u": _2, "v": _2, "w": _2, "x": _2, "y": _2, "z": _2, "blogspot": _3, "barsy": _3 } }, "bh": _4, "bi": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "or": _2, "org": _2 } }, "biz": { "$": 1, "succ": { "cloudns": _3, "jozi": _3, "dyndns": _3, "for-better": _3, "for-more": _3, "for-some": _3, "for-the": _3, "selfip": _3, "webhop": _3, "orx": _3, "mmafan": _3, "myftp": _3, "no-ip": _3, "dscloud": _3 } }, "bj": { "$": 1, "succ": { "asso": _2, "barreau": _2, "gouv": _2, "blogspot": _3 } }, "bm": _4, "bn": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "co": _3 } }, "bo": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "int": _2, "org": _2, "net": _2, "mil": _2, "tv": _2, "web": _2, "academia": _2, "agro": _2, "arte": _2, "blog": _2, "bolivia": _2, "ciencia": _2, "cooperativa": _2, "democracia": _2, "deporte": _2, "ecologia": _2, "economia": _2, "empresa": _2, "indigena": _2, "industria": _2, "info": _2, "medicina": _2, "movimiento": _2, "musica": _2, "natural": _2, "nombre": _2, "noticias": _2, "patria": _2, "politica": _2, "profesional": _2, "plurinacional": _2, "pueblo": _2, "revista": _2, "salud": _2, "tecnologia": _2, "tksat": _2, "transporte": _2, "wiki": _2 } }, "br": { "$": 1, "succ": { "9guacu": _2, "abc": _2, "adm": _2, "adv": _2, "agr": _2, "aju": _2, "am": _2, "anani": _2, "aparecida": _2, "app": _2, "arq": _2, "art": _2, "ato": _2, "b": _2, "barueri": _2, "belem": _2, "bhz": _2, "bib": _2, "bio": _2, "blog": _2, "bmd": _2, "boavista": _2, "bsb": _2, "campinagrande": _2, "campinas": _2, "caxias": _2, "cim": _2, "cng": _2, "cnt": _2, "com": { "$": 1, "succ": { "blogspot": _3, "virtualcloud": { "$": 0, "succ": { "scale": { "$": 0, "succ": { "users": _3 } } } } } }, "contagem": _2, "coop": _2, "coz": _2, "cri": _2, "cuiaba": _2, "curitiba": _2, "def": _2, "des": _2, "det": _2, "dev": _2, "ecn": _2, "eco": _2, "edu": _2, "emp": _2, "enf": _2, "eng": _2, "esp": _2, "etc": _2, "eti": _2, "far": _2, "feira": _2, "flog": _2, "floripa": _2, "fm": _2, "fnd": _2, "fortal": _2, "fot": _2, "foz": _2, "fst": _2, "g12": _2, "geo": _2, "ggf": _2, "goiania": _2, "gov": { "$": 1, "succ": { "ac": _2, "al": _2, "am": _2, "ap": _2, "ba": _2, "ce": _2, "df": _2, "es": _2, "go": _2, "ma": _2, "mg": _2, "ms": _2, "mt": _2, "pa": _2, "pb": _2, "pe": _2, "pi": _2, "pr": _2, "rj": _2, "rn": _2, "ro": _2, "rr": _2, "rs": _2, "sc": _2, "se": _2, "sp": _2, "to": _2 } }, "gru": _2, "imb": _2, "ind": _2, "inf": _2, "jab": _2, "jampa": _2, "jdf": _2, "joinville": _2, "jor": _2, "jus": _2, "leg": { "$": 1, "succ": { "ac": _3, "al": _3, "am": _3, "ap": _3, "ba": _3, "ce": _3, "df": _3, "es": _3, "go": _3, "ma": _3, "mg": _3, "ms": _3, "mt": _3, "pa": _3, "pb": _3, "pe": _3, "pi": _3, "pr": _3, "rj": _3, "rn": _3, "ro": _3, "rr": _3, "rs": _3, "sc": _3, "se": _3, "sp": _3, "to": _3 } }, "lel": _2, "log": _2, "londrina": _2, "macapa": _2, "maceio": _2, "manaus": _2, "maringa": _2, "mat": _2, "med": _2, "mil": _2, "morena": _2, "mp": _2, "mus": _2, "natal": _2, "net": _2, "niteroi": _2, "nom": _8, "not": _2, "ntr": _2, "odo": _2, "ong": _2, "org": _2, "osasco": _2, "palmas": _2, "poa": _2, "ppg": _2, "pro": _2, "psc": _2, "psi": _2, "pvh": _2, "qsl": _2, "radio": _2, "rec": _2, "recife": _2, "rep": _2, "ribeirao": _2, "rio": _2, "riobranco": _2, "riopreto": _2, "salvador": _2, "sampa": _2, "santamaria": _2, "santoandre": _2, "saobernardo": _2, "saogonca": _2, "seg": _2, "sjc": _2, "slg": _2, "slz": _2, "sorocaba": _2, "srv": _2, "taxi": _2, "tc": _2, "tec": _2, "teo": _2, "the": _2, "tmp": _2, "trd": _2, "tur": _2, "tv": _2, "udi": _2, "vet": _2, "vix": _2, "vlog": _2, "wiki": _2, "zlg": _2 } }, "bs": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "we": _3 } }, "bt": _4, "bv": _2, "bw": { "$": 1, "succ": { "co": _2, "org": _2 } }, "by": { "$": 1, "succ": { "gov": _2, "mil": _2, "com": _6, "of": _2, "mycloud": _3, "mediatech": _3 } }, "bz": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "za": _3, "gsj": _3 } }, "ca": { "$": 1, "succ": { "ab": _2, "bc": _2, "mb": _2, "nb": _2, "nf": _2, "nl": _2, "ns": _2, "nt": _2, "nu": _2, "on": _2, "pe": _2, "qc": _2, "sk": _2, "yk": _2, "gc": _2, "barsy": _3, "awdev": _5, "co": _3, "blogspot": _3, "no-ip": _3, "myspreadshop": _3 } }, "cat": _2, "cc": { "$": 1, "succ": { "cloudns": _3, "ftpaccess": _3, "game-server": _3, "myphotos": _3, "scrapping": _3, "twmail": _3, "csx": _3, "fantasyleague": _3, "spawn": { "$": 0, "succ": { "instances": _3 } } } }, "cd": _7, "cf": _6, "cg": _2, "ch": { "$": 1, "succ": { "square7": _3, "blogspot": _3, "flow": { "$": 0, "succ": { "ae": { "$": 0, "succ": { "alp1": _3 } }, "appengine": _3 } }, "linkyard-cloud": _3, "dnsking": _3, "gotdns": _3, "myspreadshop": _3, "firenet": { "$": 0, "succ": { "*": _3, "svc": _5 } }, "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3 } }, "ci": { "$": 1, "succ": { "org": _2, "or": _2, "com": _2, "co": _2, "edu": _2, "ed": _2, "ac": _2, "net": _2, "go": _2, "asso": _2, "xn--aroport-bya": _2, "aéroport": _2, "int": _2, "presse": _2, "md": _2, "gouv": _2, "fin": _3, "nl": _3 } }, "ck": _8, "cl": { "$": 1, "succ": { "co": _2, "gob": _2, "gov": _2, "mil": _2, "blogspot": _3 } }, "cm": { "$": 1, "succ": { "co": _2, "com": _2, "gov": _2, "net": _2 } }, "cn": { "$": 1, "succ": { "ac": _2, "com": { "$": 1, "succ": { "amazonaws": { "$": 0, "succ": { "compute": _5, "eb": { "$": 0, "succ": { "cn-north-1": _3, "cn-northwest-1": _3 } }, "elb": _5, "cn-north-1": _12 } } } }, "edu": _2, "gov": _2, "net": _2, "org": _2, "mil": _2, "xn--55qx5d": _2, "公司": _2, "xn--io0a7i": _2, "网络": _2, "xn--od0alg": _2, "網絡": _2, "ah": _2, "bj": _2, "cq": _2, "fj": _2, "gd": _2, "gs": _2, "gz": _2, "gx": _2, "ha": _2, "hb": _2, "he": _2, "hi": _2, "hl": _2, "hn": _2, "jl": _2, "js": _2, "jx": _2, "ln": _2, "nm": _2, "nx": _2, "qh": _2, "sc": _2, "sd": _2, "sh": _2, "sn": _2, "sx": _2, "tj": _2, "xj": _2, "xz": _2, "yn": _2, "zj": _2, "hk": _2, "mo": _2, "tw": _2, "instantcloud": _3, "quickconnect": _13 } }, "co": { "$": 1, "succ": { "arts": _2, "com": _6, "edu": _2, "firm": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "rec": _2, "web": _2, "carrd": _3, "crd": _3, "otap": _5, "leadpages": _3, "lpages": _3, "mypi": _3, "n4t": _3, "repl": { "$": 2, "succ": { "id": _3 } }, "supabase": _3 } }, "com": { "$": 1, "succ": { "devcdnaccesso": _5, "adobeaemcloud": { "$": 2, "succ": { "dev": _5 } }, "airkitapps": _3, "airkitapps-au": _3, "aivencloud": _3, "kasserver": _3, "amazonaws": { "$": 0, "succ": { "compute": _5, "compute-1": _5, "us-east-1": { "$": 2, "succ": { "dualstack": _12 } }, "elb": _5, "s3": _3, "s3-ap-northeast-1": _3, "s3-ap-northeast-2": _3, "s3-ap-south-1": _3, "s3-ap-southeast-1": _3, "s3-ap-southeast-2": _3, "s3-ca-central-1": _3, "s3-eu-central-1": _3, "s3-eu-west-1": _3, "s3-eu-west-2": _3, "s3-eu-west-3": _3, "s3-external-1": _3, "s3-fips-us-gov-west-1": _3, "s3-sa-east-1": _3, "s3-us-gov-west-1": _3, "s3-us-east-2": _3, "s3-us-west-1": _3, "s3-us-west-2": _3, "ap-northeast-2": _15, "ap-south-1": _15, "ca-central-1": _15, "eu-central-1": _15, "eu-west-2": _15, "eu-west-3": _15, "us-east-2": _15, "ap-northeast-1": _14, "ap-southeast-1": _14, "ap-southeast-2": _14, "eu-west-1": _14, "sa-east-1": _14, "s3-website-us-east-1": _3, "s3-website-us-west-1": _3, "s3-website-us-west-2": _3, "s3-website-ap-northeast-1": _3, "s3-website-ap-southeast-1": _3, "s3-website-ap-southeast-2": _3, "s3-website-eu-west-1": _3, "s3-website-sa-east-1": _3 } }, "elasticbeanstalk": { "$": 2, "succ": { "ap-northeast-1": _3, "ap-northeast-2": _3, "ap-northeast-3": _3, "ap-south-1": _3, "ap-southeast-1": _3, "ap-southeast-2": _3, "ca-central-1": _3, "eu-central-1": _3, "eu-west-1": _3, "eu-west-2": _3, "eu-west-3": _3, "sa-east-1": _3, "us-east-1": _3, "us-east-2": _3, "us-gov-west-1": _3, "us-west-1": _3, "us-west-2": _3 } }, "awsglobalaccelerator": _3, "siiites": _3, "appspacehosted": _3, "appspaceusercontent": _3, "on-aptible": _3, "myasustor": _3, "balena-devices": _3, "betainabox": _3, "boutir": _3, "bplaced": _3, "cafjs": _3, "br": _3, "cn": _3, "de": _3, "eu": _3, "jpn": _3, "mex": _3, "ru": _3, "sa": _3, "uk": _3, "us": _3, "za": _3, "ar": _3, "hu": _3, "kr": _3, "no": _3, "qc": _3, "uy": _3, "africa": _3, "gr": _3, "co": _3, "jdevcloud": _3, "wpdevcloud": _3, "cloudcontrolled": _3, "cloudcontrolapp": _3, "trycloudflare": _3, "customer-oci": { "$": 0, "succ": { "*": _3, "oci": _5, "ocp": _5, "ocs": _5 } }, "dattolocal": _3, "dattorelay": _3, "dattoweb": _3, "mydatto": _3, "builtwithdark": _3, "datadetect": { "$": 0, "succ": { "demo": _3, "instance": _3 } }, "ddns5": _3, "discordsays": _3, "discordsez": _3, "drayddns": _3, "dreamhosters": _3, "mydrobo": _3, "dyndns-at-home": _3, "dyndns-at-work": _3, "dyndns-blog": _3, "dyndns-free": _3, "dyndns-home": _3, "dyndns-ip": _3, "dyndns-mail": _3, "dyndns-office": _3, "dyndns-pics": _3, "dyndns-remote": _3, "dyndns-server": _3, "dyndns-web": _3, "dyndns-wiki": _3, "dyndns-work": _3, "blogdns": _3, "cechire": _3, "dnsalias": _3, "dnsdojo": _3, "doesntexist": _3, "dontexist": _3, "doomdns": _3, "dyn-o-saur": _3, "dynalias": _3, "est-a-la-maison": _3, "est-a-la-masion": _3, "est-le-patron": _3, "est-mon-blogueur": _3, "from-ak": _3, "from-al": _3, "from-ar": _3, "from-ca": _3, "from-ct": _3, "from-dc": _3, "from-de": _3, "from-fl": _3, "from-ga": _3, "from-hi": _3, "from-ia": _3, "from-id": _3, "from-il": _3, "from-in": _3, "from-ks": _3, "from-ky": _3, "from-ma": _3, "from-md": _3, "from-mi": _3, "from-mn": _3, "from-mo": _3, "from-ms": _3, "from-mt": _3, "from-nc": _3, "from-nd": _3, "from-ne": _3, "from-nh": _3, "from-nj": _3, "from-nm": _3, "from-nv": _3, "from-oh": _3, "from-ok": _3, "from-or": _3, "from-pa": _3, "from-pr": _3, "from-ri": _3, "from-sc": _3, "from-sd": _3, "from-tn": _3, "from-tx": _3, "from-ut": _3, "from-va": _3, "from-vt": _3, "from-wa": _3, "from-wi": _3, "from-wv": _3, "from-wy": _3, "getmyip": _3, "gotdns": _3, "hobby-site": _3, "homelinux": _3, "homeunix": _3, "iamallama": _3, "is-a-anarchist": _3, "is-a-blogger": _3, "is-a-bookkeeper": _3, "is-a-bulls-fan": _3, "is-a-caterer": _3, "is-a-chef": _3, "is-a-conservative": _3, "is-a-cpa": _3, "is-a-cubicle-slave": _3, "is-a-democrat": _3, "is-a-designer": _3, "is-a-doctor": _3, "is-a-financialadvisor": _3, "is-a-geek": _3, "is-a-green": _3, "is-a-guru": _3, "is-a-hard-worker": _3, "is-a-hunter": _3, "is-a-landscaper": _3, "is-a-lawyer": _3, "is-a-liberal": _3, "is-a-libertarian": _3, "is-a-llama": _3, "is-a-musician": _3, "is-a-nascarfan": _3, "is-a-nurse": _3, "is-a-painter": _3, "is-a-personaltrainer": _3, "is-a-photographer": _3, "is-a-player": _3, "is-a-republican": _3, "is-a-rockstar": _3, "is-a-socialist": _3, "is-a-student": _3, "is-a-teacher": _3, "is-a-techie": _3, "is-a-therapist": _3, "is-an-accountant": _3, "is-an-actor": _3, "is-an-actress": _3, "is-an-anarchist": _3, "is-an-artist": _3, "is-an-engineer": _3, "is-an-entertainer": _3, "is-certified": _3, "is-gone": _3, "is-into-anime": _3, "is-into-cars": _3, "is-into-cartoons": _3, "is-into-games": _3, "is-leet": _3, "is-not-certified": _3, "is-slick": _3, "is-uberleet": _3, "is-with-theband": _3, "isa-geek": _3, "isa-hockeynut": _3, "issmarterthanyou": _3, "likes-pie": _3, "likescandy": _3, "neat-url": _3, "saves-the-whales": _3, "selfip": _3, "sells-for-less": _3, "sells-for-u": _3, "servebbs": _3, "simple-url": _3, "space-to-rent": _3, "teaches-yoga": _3, "writesthisblog": _3, "digitaloceanspaces": _5, "ddnsfree": _3, "ddnsgeek": _3, "giize": _3, "gleeze": _3, "kozow": _3, "loseyourip": _3, "ooguy": _3, "theworkpc": _3, "mytuleap": _3, "tuleap-partners": _3, "encoreapi": _3, "evennode": { "$": 0, "succ": { "eu-1": _3, "eu-2": _3, "eu-3": _3, "eu-4": _3, "us-1": _3, "us-2": _3, "us-3": _3, "us-4": _3 } }, "onfabrica": _3, "fbsbx": _16, "fastly-terrarium": _3, "fastvps-server": _3, "mydobiss": _3, "firebaseapp": _3, "fldrv": _3, "forgeblocks": _3, "framercanvas": _3, "freebox-os": _3, "freeboxos": _3, "freemyip": _3, "gentapps": _3, "gentlentapis": _3, "githubusercontent": _3, "0emm": _5, "appspot": { "$": 2, "succ": { "r": _5 } }, "codespot": _3, "googleapis": _3, "googlecode": _3, "pagespeedmobilizer": _3, "publishproxy": _3, "withgoogle": _3, "withyoutube": _3, "blogspot": _3, "awsmppl": _3, "herokuapp": _3, "herokussl": _3, "myravendb": _3, "impertrixcdn": _3, "impertrix": _3, "smushcdn": _3, "wphostedmail": _3, "wpmucdn": _3, "pixolino": _3, "amscompute": _3, "clicketcloud": _3, "dopaas": _3, "hidora": _3, "hosted-by-previder": _17, "hosteur": { "$": 0, "succ": { "rag-cloud": _3, "rag-cloud-ch": _3 } }, "ik-server": { "$": 0, "succ": { "jcloud": _3, "jcloud-ver-jpc": _3 } }, "jelastic": { "$": 0, "succ": { "demo": _3 } }, "kilatiron": _3, "massivegrid": _17, "wafaicloud": { "$": 0, "succ": { "jed": _3, "lon": _3, "ryd": _3 } }, "joyent": { "$": 0, "succ": { "cns": _5 } }, "ktistory": _3, "lpusercontent": _3, "lmpm": _18, "linode": { "$": 0, "succ": { "members": _3, "nodebalancer": _5 } }, "linodeobjects": _5, "linodeusercontent": { "$": 0, "succ": { "ip": _3 } }, "barsycenter": _3, "barsyonline": _3, "mazeplay": _3, "miniserver": _3, "meteorapp": _19, "hostedpi": _3, "mythic-beasts": { "$": 0, "succ": { "customer": _3, "caracal": _3, "fentiger": _3, "lynx": _3, "ocelot": _3, "oncilla": _3, "onza": _3, "sphinx": _3, "vs": _3, "x": _3, "yali": _3 } }, "nospamproxy": _9, "4u": _3, "nfshost": _3, "001www": _3, "ddnslive": _3, "myiphost": _3, "blogsyte": _3, "ciscofreak": _3, "damnserver": _3, "ditchyourip": _3, "dnsiskinky": _3, "dynns": _3, "geekgalaxy": _3, "health-carereform": _3, "homesecuritymac": _3, "homesecuritypc": _3, "myactivedirectory": _3, "mysecuritycamera": _3, "net-freaks": _3, "onthewifi": _3, "point2this": _3, "quicksytes": _3, "securitytactics": _3, "serveexchange": _3, "servehumour": _3, "servep2p": _3, "servesarcasm": _3, "stufftoread": _3, "unusualperson": _3, "workisboring": _3, "3utilities": _3, "ddnsking": _3, "myvnc": _3, "servebeer": _3, "servecounterstrike": _3, "serveftp": _3, "servegame": _3, "servehalflife": _3, "servehttp": _3, "serveirc": _3, "servemp3": _3, "servepics": _3, "servequake": _3, "observableusercontent": { "$": 0, "succ": { "static": _3 } }, "orsites": _3, "operaunite": _3, "authgear-staging": _3, "authgearapps": _3, "skygearapp": _3, "outsystemscloud": _3, "ownprovider": _3, "pgfog": _3, "pagefrontapp": _3, "pagexl": _3, "paywhirl": _5, "gotpantheon": _3, "platter-app": _3, "pleskns": _3, "postman-echo": _3, "prgmr": { "$": 0, "succ": { "xen": _3 } }, "pythonanywhere": _19, "qualifioapp": _3, "qbuser": _3, "qa2": _3, "dev-myqnapcloud": _3, "alpha-myqnapcloud": _3, "myqnapcloud": _3, "quipelements": _5, "rackmaze": _3, "rhcloud": _3, "render": _18, "onrender": _3, "code": { "$": 0, "succ": { "builder": _3, "dev-builder": _3, "stg-builder": _3 } }, "logoip": _3, "scrysec": _3, "firewall-gateway": _3, "myshopblocks": _3, "myshopify": _3, "shopitsite": _3, "1kapp": _3, "appchizi": _3, "applinzi": _3, "sinaapp": _3, "vipsinaapp": _3, "bounty-full": { "$": 2, "succ": { "alpha": _3, "beta": _3 } }, "try-snowplow": _3, "stackhero-network": _3, "playstation-cloud": _3, "myspreadshop": _3, "stdlib": { "$": 0, "succ": { "api": _3 } }, "temp-dns": _3, "dsmynas": _3, "familyds": _3, "tb-hosting": _20, "reservd": _3, "thingdustdata": _3, "bloxcms": _3, "townnews-staging": _3, "typeform": { "$": 0, "succ": { "pro": _3 } }, "hk": _3, "vultrobjects": _5, "wafflecell": _3, "reserve-online": _3, "hotelwithflight": _3, "remotewd": _3, "wiardweb": _21, "messwithdns": _3, "woltlab-demo": _3, "wpenginepowered": { "$": 2, "succ": { "js": _3 } }, "wixsite": _3, "xnbay": { "$": 2, "succ": { "u2": _3, "u2-local": _3 } }, "yolasite": _3 } }, "coop": _2, "cr": { "$": 1, "succ": { "ac": _2, "co": _2, "ed": _2, "fi": _2, "go": _2, "or": _2, "sa": _2 } }, "cu": { "$": 1, "succ": { "com": _2, "edu": _2, "org": _2, "net": _2, "gov": _2, "inf": _2 } }, "cv": { "$": 1, "succ": { "com": _2, "edu": _2, "int": _2, "nome": _2, "org": _2, "blogspot": _3 } }, "cw": _22, "cx": { "$": 1, "succ": { "gov": _2, "ath": _3, "info": _3 } }, "cy": { "$": 1, "succ": { "ac": _2, "biz": _2, "com": { "$": 1, "succ": { "blogspot": _3, "scaleforce": _23 } }, "ekloges": _2, "gov": _2, "ltd": _2, "mil": _2, "net": _2, "org": _2, "press": _2, "pro": _2, "tm": _2 } }, "cz": { "$": 1, "succ": { "co": _3, "realm": _3, "e4": _3, "blogspot": _3, "metacentrum": { "$": 0, "succ": { "cloud": _5, "custom": _3 } }, "muni": { "$": 0, "succ": { "cloud": { "$": 0, "succ": { "flt": _3, "usr": _3 } } } } } }, "de": { "$": 1, "succ": { "bplaced": _3, "square7": _3, "com": _3, "cosidns": { "$": 0, "succ": { "dyn": _3 } }, "dynamisches-dns": _3, "dnsupdater": _3, "internet-dns": _3, "l-o-g-i-n": _3, "dnshome": _3, "fuettertdasnetz": _3, "isteingeek": _3, "istmein": _3, "lebtimnetz": _3, "leitungsen": _3, "traeumtgerade": _3, "ddnss": { "$": 2, "succ": { "dyn": _3, "dyndns": _3 } }, "dyndns1": _3, "dyn-ip24": _3, "home-webserver": { "$": 2, "succ": { "dyn": _3 } }, "myhome-server": _3, "frusky": _5, "goip": _3, "blogspot": _3, "xn--gnstigbestellen-zvb": _3, "günstigbestellen": _3, "xn--gnstigliefern-wob": _3, "günstigliefern": _3, "hs-heilbronn": { "$": 0, "succ": { "it": _21 } }, "dyn-berlin": _3, "in-berlin": _3, "in-brb": _3, "in-butter": _3, "in-dsl": _3, "in-vpn": _3, "mein-iserv": _3, "schulserver": _3, "test-iserv": _3, "keymachine": _3, "git-repos": _3, "lcube-server": _3, "svn-repos": _3, "barsy": _3, "logoip": _3, "firewall-gateway": _3, "my-gateway": _3, "my-router": _3, "spdns": _3, "speedpartner": { "$": 0, "succ": { "customer": _3 } }, "myspreadshop": _3, "taifun-dns": _3, "12hp": _3, "2ix": _3, "4lima": _3, "lima-city": _3, "dd-dns": _3, "dray-dns": _3, "draydns": _3, "dyn-vpn": _3, "dynvpn": _3, "mein-vigor": _3, "my-vigor": _3, "my-wan": _3, "syno-ds": _3, "synology-diskstation": _3, "synology-ds": _3, "uberspace": _5, "virtualuser": _3, "virtual-user": _3, "community-pro": _3, "diskussionsbereich": _3 } }, "dj": _2, "dk": { "$": 1, "succ": { "biz": _3, "co": _3, "firm": _3, "reg": _3, "store": _3, "blogspot": _3, "myspreadshop": _3 } }, "dm": _4, "do": { "$": 1, "succ": { "art": _2, "com": _2, "edu": _2, "gob": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "sld": _2, "web": _2 } }, "dz": { "$": 1, "succ": { "art": _2, "asso": _2, "com": _2, "edu": _2, "gov": _2, "org": _2, "net": _2, "pol": _2, "soc": _2, "tm": _2 } }, "ec": { "$": 1, "succ": { "com": _2, "info": _2, "net": _2, "fin": _2, "k12": _2, "med": _2, "pro": _2, "org": _2, "edu": _2, "gov": _2, "gob": _2, "mil": _2, "base": _3, "official": _3 } }, "edu": { "$": 1, "succ": { "rit": { "$": 0, "succ": { "git-pages": _3 } } } }, "ee": { "$": 1, "succ": { "edu": _2, "gov": _2, "riik": _2, "lib": _2, "med": _2, "com": _6, "pri": _2, "aip": _2, "org": _2, "fie": _2 } }, "eg": { "$": 1, "succ": { "com": _6, "edu": _2, "eun": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sci": _2 } }, "er": _8, "es": { "$": 1, "succ": { "com": _6, "nom": _2, "org": _2, "gob": _2, "edu": _2, "myspreadshop": _3 } }, "et": { "$": 1, "succ": { "com": _2, "gov": _2, "org": _2, "edu": _2, "biz": _2, "name": _2, "info": _2, "net": _2 } }, "eu": { "$": 1, "succ": { "airkitapps": _3, "mycd": _3, "cloudns": _3, "dogado": _24, "barsy": _3, "wellbeingzone": _3, "spdns": _3, "transurl": _5, "diskstation": _3 } }, "fi": { "$": 1, "succ": { "aland": _2, "dy": _3, "blogspot": _3, "xn--hkkinen-5wa": _3, "häkkinen": _3, "iki": _3, "cloudplatform": { "$": 0, "succ": { "fi": _3 } }, "datacenter": { "$": 0, "succ": { "demo": _3, "paas": _3 } }, "kapsi": _3, "myspreadshop": _3 } }, "fj": { "$": 1, "succ": { "ac": _2, "biz": _2, "com": _2, "gov": _2, "info": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "pro": _2 } }, "fk": _8, "fm": { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2, "radio": _3 } }, "fo": _2, "fr": { "$": 1, "succ": { "asso": _2, "com": _2, "gouv": _2, "nom": _2, "prd": _2, "tm": _2, "aeroport": _2, "avocat": _2, "avoues": _2, "cci": _2, "chambagri": _2, "chirurgiens-dentistes": _2, "experts-comptables": _2, "geometre-expert": _2, "greta": _2, "huissier-justice": _2, "medecin": _2, "notaires": _2, "pharmacien": _2, "port": _2, "veterinaire": _2, "en-root": _3, "fbx-os": _3, "fbxos": _3, "freebox-os": _3, "freeboxos": _3, "blogspot": _3, "goupile": _3, "on-web": _3, "chirurgiens-dentistes-en-france": _3, "dedibox": _3, "myspreadshop": _3, "ynh": _3 } }, "ga": _2, "gb": _2, "gd": { "$": 1, "succ": { "edu": _2, "gov": _2 } }, "ge": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2, "net": _2, "pvt": _2 } }, "gf": _2, "gg": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "kaas": _3, "cya": _3, "panel": { "$": 2, "succ": { "daemon": _3 } } } }, "gh": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2 } }, "gi": { "$": 1, "succ": { "com": _2, "ltd": _2, "gov": _2, "mod": _2, "edu": _2, "org": _2 } }, "gl": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "net": _2, "org": _2, "biz": _3, "xx": _3 } }, "gm": _2, "gn": { "$": 1, "succ": { "ac": _2, "com": _2, "edu": _2, "gov": _2, "org": _2, "net": _2 } }, "gov": _2, "gp": { "$": 1, "succ": { "com": _2, "net": _2, "mobi": _2, "edu": _2, "org": _2, "asso": _2, "app": _3 } }, "gq": _2, "gr": { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2, "gov": _2, "blogspot": _3 } }, "gs": _2, "gt": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "ind": _2, "mil": _2, "net": _2, "org": _2, "blog": _3, "de": _3, "to": _3 } }, "gu": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "guam": _2, "info": _2, "net": _2, "org": _2, "web": _2 } }, "gw": _2, "gy": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "be": _3 } }, "hk": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "idv": _2, "net": _2, "org": _2, "xn--55qx5d": _2, "公司": _2, "xn--wcvs22d": _2, "教育": _2, "xn--lcvr32d": _2, "敎育": _2, "xn--mxtq1m": _2, "政府": _2, "xn--gmqw5a": _2, "個人": _2, "xn--ciqpn": _2, "个人": _2, "xn--gmq050i": _2, "箇人": _2, "xn--zf0avx": _2, "網络": _2, "xn--io0a7i": _2, "网络": _2, "xn--mk0axi": _2, "组織": _2, "xn--od0alg": _2, "網絡": _2, "xn--od0aq3b": _2, "网絡": _2, "xn--tn0ag": _2, "组织": _2, "xn--uc0atv": _2, "組織": _2, "xn--uc0ay4a": _2, "組织": _2, "blogspot": _3, "secaas": _3, "ltd": _3, "inc": _3 } }, "hm": _2, "hn": { "$": 1, "succ": { "com": _2, "edu": _2, "org": _2, "net": _2, "mil": _2, "gob": _2, "cc": _3 } }, "hr": { "$": 1, "succ": { "iz": _2, "from": _2, "name": _2, "com": _2, "blogspot": _3, "free": _3 } }, "ht": { "$": 1, "succ": { "com": _2, "shop": _2, "firm": _2, "info": _2, "adult": _2, "net": _2, "pro": _2, "org": _2, "med": _2, "art": _2, "coop": _2, "pol": _2, "asso": _2, "edu": _2, "rel": _2, "gouv": _2, "perso": _2 } }, "hu": { "$": 1, "succ": { "2000": _2, "co": _2, "info": _2, "org": _2, "priv": _2, "sport": _2, "tm": _2, "agrar": _2, "bolt": _2, "casino": _2, "city": _2, "erotica": _2, "erotika": _2, "film": _2, "forum": _2, "games": _2, "hotel": _2, "ingatlan": _2, "jogasz": _2, "konyvelo": _2, "lakas": _2, "media": _2, "news": _2, "reklam": _2, "sex": _2, "shop": _2, "suli": _2, "szex": _2, "tozsde": _2, "utazas": _2, "video": _2, "blogspot": _3 } }, "id": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _6, "desa": _2, "go": _2, "mil": _2, "my": { "$": 1, "succ": { "rss": _5 } }, "net": _2, "or": _2, "ponpes": _2, "sch": _2, "web": _2, "flap": _3, "forte": _3 } }, "ie": { "$": 1, "succ": { "gov": _2, "blogspot": _3, "myspreadshop": _3 } }, "il": { "$": 1, "succ": { "ac": _2, "co": { "$": 1, "succ": { "ravpage": _3, "blogspot": _3, "tabitorder": _3 } }, "gov": _2, "idf": _2, "k12": _2, "muni": _2, "net": _2, "org": _2 } }, "im": { "$": 1, "succ": { "ac": _2, "co": { "$": 1, "succ": { "ltd": _2, "plc": _2 } }, "com": _2, "net": _2, "org": _2, "tt": _2, "tv": _2, "ro": _3 } }, "in": { "$": 1, "succ": { "co": _2, "firm": _2, "net": _2, "org": _2, "gen": _2, "ind": _2, "nic": _2, "ac": _2, "edu": _2, "res": _2, "gov": _2, "mil": _2, "web": _3, "cloudns": _3, "blogspot": _3, "barsy": _3, "supabase": _3 } }, "info": { "$": 1, "succ": { "cloudns": _3, "dynamic-dns": _3, "dyndns": _3, "barrel-of-knowledge": _3, "barrell-of-knowledge": _3, "for-our": _3, "groks-the": _3, "groks-this": _3, "here-for-more": _3, "knowsitall": _3, "selfip": _3, "webhop": _3, "barsy": _3, "mayfirst": _3, "forumz": _3, "nsupdate": _3, "dvrcam": _3, "ilovecollege": _3, "no-ip": _3, "dnsupdate": _3, "v-info": _3 } }, "int": { "$": 1, "succ": { "eu": _2 } }, "io": { "$": 1, "succ": { "2038": _3, "com": _2, "apigee": _3, "b-data": _3, "backplaneapp": _3, "banzaicloud": { "$": 0, "succ": { "app": _3, "backyards": _5 } }, "bitbucket": _3, "bluebite": _3, "boxfuse": _3, "browsersafetymark": _3, "bigv": { "$": 0, "succ": { "uk0": _3 } }, "cleverapps": _3, "dappnode": { "$": 0, "succ": { "dyndns": _3 } }, "dedyn": _3, "drud": _3, "definima": _3, "fh-muenster": _3, "shw": _3, "forgerock": { "$": 0, "succ": { "id": _3 } }, "ghost": _3, "github": _3, "gitlab": _3, "lolipop": _3, "hasura-app": _3, "hostyhosting": _3, "moonscale": _5, "beebyte": _17, "beebyteapp": { "$": 0, "succ": { "sekd1": _3 } }, "jele": _3, "unispace": { "$": 0, "succ": { "cloud-fr1": _3 } }, "webthings": _3, "loginline": _3, "barsy": _3, "azurecontainer": _5, "ngrok": _3, "nodeart": { "$": 0, "succ": { "stage": _3 } }, "nid": _3, "pantheonsite": _3, "dyn53": _3, "pstmn": { "$": 2, "succ": { "mock": _3 } }, "protonet": _3, "qoto": _3, "qcx": { "$": 2, "succ": { "sys": _5 } }, "vaporcloud": _3, "vbrplsbx": { "$": 0, "succ": { "g": _3 } }, "on-k3s": _5, "on-rio": _5, "readthedocs": _3, "resindevice": _3, "resinstaging": { "$": 0, "succ": { "devices": _3 } }, "hzc": _3, "sandcats": _3, "shiftcrypto": _3, "shiftedit": _3, "mo-siemens": _3, "musician": _3, "lair": _16, "stolos": _5, "spacekit": _3, "utwente": _3, "s5y": _5, "edugit": _3, "telebit": _3, "thingdust": { "$": 0, "succ": { "dev": _27, "disrec": _27, "prod": _28, "testing": _27 } }, "tickets": _3, "upli": _3, "wedeploy": _3, "editorx": _3, "basicserver": _3, "virtualserver": _3 } }, "iq": _29, "ir": { "$": 1, "succ": { "ac": _2, "co": _2, "gov": _2, "id": _2, "net": _2, "org": _2, "sch": _2, "xn--mgba3a4f16a": _2, "ایران": _2, "xn--mgba3a4fra": _2, "ايران": _2 } }, "is": { "$": 1, "succ": { "net": _2, "com": _2, "edu": _2, "gov": _2, "org": _2, "int": _2, "cupcake": _3, "blogspot": _3 } }, "it": { "$": 1, "succ": { "gov": _2, "edu": _2, "abr": _2, "abruzzo": _2, "aosta-valley": _2, "aostavalley": _2, "bas": _2, "basilicata": _2, "cal": _2, "calabria": _2, "cam": _2, "campania": _2, "emilia-romagna": _2, "emiliaromagna": _2, "emr": _2, "friuli-v-giulia": _2, "friuli-ve-giulia": _2, "friuli-vegiulia": _2, "friuli-venezia-giulia": _2, "friuli-veneziagiulia": _2, "friuli-vgiulia": _2, "friuliv-giulia": _2, "friulive-giulia": _2, "friulivegiulia": _2, "friulivenezia-giulia": _2, "friuliveneziagiulia": _2, "friulivgiulia": _2, "fvg": _2, "laz": _2, "lazio": _2, "lig": _2, "liguria": _2, "lom": _2, "lombardia": _2, "lombardy": _2, "lucania": _2, "mar": _2, "marche": _2, "mol": _2, "molise": _2, "piedmont": _2, "piemonte": _2, "pmn": _2, "pug": _2, "puglia": _2, "sar": _2, "sardegna": _2, "sardinia": _2, "sic": _2, "sicilia": _2, "sicily": _2, "taa": _2, "tos": _2, "toscana": _2, "trentin-sud-tirol": _2, "xn--trentin-sd-tirol-rzb": _2, "trentin-süd-tirol": _2, "trentin-sudtirol": _2, "xn--trentin-sdtirol-7vb": _2, "trentin-südtirol": _2, "trentin-sued-tirol": _2, "trentin-suedtirol": _2, "trentino-a-adige": _2, "trentino-aadige": _2, "trentino-alto-adige": _2, "trentino-altoadige": _2, "trentino-s-tirol": _2, "trentino-stirol": _2, "trentino-sud-tirol": _2, "xn--trentino-sd-tirol-c3b": _2, "trentino-süd-tirol": _2, "trentino-sudtirol": _2, "xn--trentino-sdtirol-szb": _2, "trentino-südtirol": _2, "trentino-sued-tirol": _2, "trentino-suedtirol": _2, "trentino": _2, "trentinoa-adige": _2, "trentinoaadige": _2, "trentinoalto-adige": _2, "trentinoaltoadige": _2, "trentinos-tirol": _2, "trentinostirol": _2, "trentinosud-tirol": _2, "xn--trentinosd-tirol-rzb": _2, "trentinosüd-tirol": _2, "trentinosudtirol": _2, "xn--trentinosdtirol-7vb": _2, "trentinosüdtirol": _2, "trentinosued-tirol": _2, "trentinosuedtirol": _2, "trentinsud-tirol": _2, "xn--trentinsd-tirol-6vb": _2, "trentinsüd-tirol": _2, "trentinsudtirol": _2, "xn--trentinsdtirol-nsb": _2, "trentinsüdtirol": _2, "trentinsued-tirol": _2, "trentinsuedtirol": _2, "tuscany": _2, "umb": _2, "umbria": _2, "val-d-aosta": _2, "val-daosta": _2, "vald-aosta": _2, "valdaosta": _2, "valle-aosta": _2, "valle-d-aosta": _2, "valle-daosta": _2, "valleaosta": _2, "valled-aosta": _2, "valledaosta": _2, "vallee-aoste": _2, "xn--valle-aoste-ebb": _2, "vallée-aoste": _2, "vallee-d-aoste": _2, "xn--valle-d-aoste-ehb": _2, "vallée-d-aoste": _2, "valleeaoste": _2, "xn--valleaoste-e7a": _2, "valléeaoste": _2, "valleedaoste": _2, "xn--valledaoste-ebb": _2, "valléedaoste": _2, "vao": _2, "vda": _2, "ven": _2, "veneto": _2, "ag": _2, "agrigento": _2, "al": _2, "alessandria": _2, "alto-adige": _2, "altoadige": _2, "an": _2, "ancona": _2, "andria-barletta-trani": _2, "andria-trani-barletta": _2, "andriabarlettatrani": _2, "andriatranibarletta": _2, "ao": _2, "aosta": _2, "aoste": _2, "ap": _2, "aq": _2, "aquila": _2, "ar": _2, "arezzo": _2, "ascoli-piceno": _2, "ascolipiceno": _2, "asti": _2, "at": _2, "av": _2, "avellino": _2, "ba": _2, "balsan-sudtirol": _2, "xn--balsan-sdtirol-nsb": _2, "balsan-südtirol": _2, "balsan-suedtirol": _2, "balsan": _2, "bari": _2, "barletta-trani-andria": _2, "barlettatraniandria": _2, "belluno": _2, "benevento": _2, "bergamo": _2, "bg": _2, "bi": _2, "biella": _2, "bl": _2, "bn": _2, "bo": _2, "bologna": _2, "bolzano-altoadige": _2, "bolzano": _2, "bozen-sudtirol": _2, "xn--bozen-sdtirol-2ob": _2, "bozen-südtirol": _2, "bozen-suedtirol": _2, "bozen": _2, "br": _2, "brescia": _2, "brindisi": _2, "bs": _2, "bt": _2, "bulsan-sudtirol": _2, "xn--bulsan-sdtirol-nsb": _2, "bulsan-südtirol": _2, "bulsan-suedtirol": _2, "bulsan": _2, "bz": _2, "ca": _2, "cagliari": _2, "caltanissetta": _2, "campidano-medio": _2, "campidanomedio": _2, "campobasso": _2, "carbonia-iglesias": _2, "carboniaiglesias": _2, "carrara-massa": _2, "carraramassa": _2, "caserta": _2, "catania": _2, "catanzaro": _2, "cb": _2, "ce": _2, "cesena-forli": _2, "xn--cesena-forl-mcb": _2, "cesena-forlì": _2, "cesenaforli": _2, "xn--cesenaforl-i8a": _2, "cesenaforlì": _2, "ch": _2, "chieti": _2, "ci": _2, "cl": _2, "cn": _2, "co": _2, "como": _2, "cosenza": _2, "cr": _2, "cremona": _2, "crotone": _2, "cs": _2, "ct": _2, "cuneo": _2, "cz": _2, "dell-ogliastra": _2, "dellogliastra": _2, "en": _2, "enna": _2, "fc": _2, "fe": _2, "fermo": _2, "ferrara": _2, "fg": _2, "fi": _2, "firenze": _2, "florence": _2, "fm": _2, "foggia": _2, "forli-cesena": _2, "xn--forl-cesena-fcb": _2, "forlì-cesena": _2, "forlicesena": _2, "xn--forlcesena-c8a": _2, "forlìcesena": _2, "fr": _2, "frosinone": _2, "ge": _2, "genoa": _2, "genova": _2, "go": _2, "gorizia": _2, "gr": _2, "grosseto": _2, "iglesias-carbonia": _2, "iglesiascarbonia": _2, "im": _2, "imperia": _2, "is": _2, "isernia": _2, "kr": _2, "la-spezia": _2, "laquila": _2, "laspezia": _2, "latina": _2, "lc": _2, "le": _2, "lecce": _2, "lecco": _2, "li": _2, "livorno": _2, "lo": _2, "lodi": _2, "lt": _2, "lu": _2, "lucca": _2, "macerata": _2, "mantova": _2, "massa-carrara": _2, "massacarrara": _2, "matera": _2, "mb": _2, "mc": _2, "me": _2, "medio-campidano": _2, "mediocampidano": _2, "messina": _2, "mi": _2, "milan": _2, "milano": _2, "mn": _2, "mo": _2, "modena": _2, "monza-brianza": _2, "monza-e-della-brianza": _2, "monza": _2, "monzabrianza": _2, "monzaebrianza": _2, "monzaedellabrianza": _2, "ms": _2, "mt": _2, "na": _2, "naples": _2, "napoli": _2, "no": _2, "novara": _2, "nu": _2, "nuoro": _2, "og": _2, "ogliastra": _2, "olbia-tempio": _2, "olbiatempio": _2, "or": _2, "oristano": _2, "ot": _2, "pa": _2, "padova": _2, "padua": _2, "palermo": _2, "parma": _2, "pavia": _2, "pc": _2, "pd": _2, "pe": _2, "perugia": _2, "pesaro-urbino": _2, "pesarourbino": _2, "pescara": _2, "pg": _2, "pi": _2, "piacenza": _2, "pisa": _2, "pistoia": _2, "pn": _2, "po": _2, "pordenone": _2, "potenza": _2, "pr": _2, "prato": _2, "pt": _2, "pu": _2, "pv": _2, "pz": _2, "ra": _2, "ragusa": _2, "ravenna": _2, "rc": _2, "re": _2, "reggio-calabria": _2, "reggio-emilia": _2, "reggiocalabria": _2, "reggioemilia": _2, "rg": _2, "ri": _2, "rieti": _2, "rimini": _2, "rm": _2, "rn": _2, "ro": _2, "roma": _2, "rome": _2, "rovigo": _2, "sa": _2, "salerno": _2, "sassari": _2, "savona": _2, "si": _2, "siena": _2, "siracusa": _2, "so": _2, "sondrio": _2, "sp": _2, "sr": _2, "ss": _2, "suedtirol": _2, "xn--sdtirol-n2a": _2, "südtirol": _2, "sv": _2, "ta": _2, "taranto": _2, "te": _2, "tempio-olbia": _2, "tempioolbia": _2, "teramo": _2, "terni": _2, "tn": _2, "to": _2, "torino": _2, "tp": _2, "tr": _2, "trani-andria-barletta": _2, "trani-barletta-andria": _2, "traniandriabarletta": _2, "tranibarlettaandria": _2, "trapani": _2, "trento": _2, "treviso": _2, "trieste": _2, "ts": _2, "turin": _2, "tv": _2, "ud": _2, "udine": _2, "urbino-pesaro": _2, "urbinopesaro": _2, "va": _2, "varese": _2, "vb": _2, "vc": _2, "ve": _2, "venezia": _2, "venice": _2, "verbania": _2, "vercelli": _2, "verona": _2, "vi": _2, "vibo-valentia": _2, "vibovalentia": _2, "vicenza": _2, "viterbo": _2, "vr": _2, "vs": _2, "vt": _2, "vv": _2, "blogspot": _3, "neen": { "$": 0, "succ": { "jc": _3 } }, "tim": { "$": 0, "succ": { "open": { "$": 0, "succ": { "jelastic": _9 } } } }, "16-b": _3, "32-b": _3, "64-b": _3, "myspreadshop": _3, "syncloud": _3 } }, "je": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "of": _3 } }, "jm": _8, "jo": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "edu": _2, "sch": _2, "gov": _2, "mil": _2, "name": _2 } }, "jobs": _2, "jp": { "$": 1, "succ": { "ac": _2, "ad": _2, "co": _2, "ed": _2, "go": _2, "gr": _2, "lg": _2, "ne": { "$": 1, "succ": { "aseinet": _25, "gehirn": _3 } }, "or": _2, "aichi": { "$": 1, "succ": { "aisai": _2, "ama": _2, "anjo": _2, "asuke": _2, "chiryu": _2, "chita": _2, "fuso": _2, "gamagori": _2, "handa": _2, "hazu": _2, "hekinan": _2, "higashiura": _2, "ichinomiya": _2, "inazawa": _2, "inuyama": _2, "isshiki": _2, "iwakura": _2, "kanie": _2, "kariya": _2, "kasugai": _2, "kira": _2, "kiyosu": _2, "komaki": _2, "konan": _2, "kota": _2, "mihama": _2, "miyoshi": _2, "nishio": _2, "nisshin": _2, "obu": _2, "oguchi": _2, "oharu": _2, "okazaki": _2, "owariasahi": _2, "seto": _2, "shikatsu": _2, "shinshiro": _2, "shitara": _2, "tahara": _2, "takahama": _2, "tobishima": _2, "toei": _2, "togo": _2, "tokai": _2, "tokoname": _2, "toyoake": _2, "toyohashi": _2, "toyokawa": _2, "toyone": _2, "toyota": _2, "tsushima": _2, "yatomi": _2 } }, "akita": { "$": 1, "succ": { "akita": _2, "daisen": _2, "fujisato": _2, "gojome": _2, "hachirogata": _2, "happou": _2, "higashinaruse": _2, "honjo": _2, "honjyo": _2, "ikawa": _2, "kamikoani": _2, "kamioka": _2, "katagami": _2, "kazuno": _2, "kitaakita": _2, "kosaka": _2, "kyowa": _2, "misato": _2, "mitane": _2, "moriyoshi": _2, "nikaho": _2, "noshiro": _2, "odate": _2, "oga": _2, "ogata": _2, "semboku": _2, "yokote": _2, "yurihonjo": _2 } }, "aomori": { "$": 1, "succ": { "aomori": _2, "gonohe": _2, "hachinohe": _2, "hashikami": _2, "hiranai": _2, "hirosaki": _2, "itayanagi": _2, "kuroishi": _2, "misawa": _2, "mutsu": _2, "nakadomari": _2, "noheji": _2, "oirase": _2, "owani": _2, "rokunohe": _2, "sannohe": _2, "shichinohe": _2, "shingo": _2, "takko": _2, "towada": _2, "tsugaru": _2, "tsuruta": _2 } }, "chiba": { "$": 1, "succ": { "abiko": _2, "asahi": _2, "chonan": _2, "chosei": _2, "choshi": _2, "chuo": _2, "funabashi": _2, "futtsu": _2, "hanamigawa": _2, "ichihara": _2, "ichikawa": _2, "ichinomiya": _2, "inzai": _2, "isumi": _2, "kamagaya": _2, "kamogawa": _2, "kashiwa": _2, "katori": _2, "katsuura": _2, "kimitsu": _2, "kisarazu": _2, "kozaki": _2, "kujukuri": _2, "kyonan": _2, "matsudo": _2, "midori": _2, "mihama": _2, "minamiboso": _2, "mobara": _2, "mutsuzawa": _2, "nagara": _2, "nagareyama": _2, "narashino": _2, "narita": _2, "noda": _2, "oamishirasato": _2, "omigawa": _2, "onjuku": _2, "otaki": _2, "sakae": _2, "sakura": _2, "shimofusa": _2, "shirako": _2, "shiroi": _2, "shisui": _2, "sodegaura": _2, "sosa": _2, "tako": _2, "tateyama": _2, "togane": _2, "tohnosho": _2, "tomisato": _2, "urayasu": _2, "yachimata": _2, "yachiyo": _2, "yokaichiba": _2, "yokoshibahikari": _2, "yotsukaido": _2 } }, "ehime": { "$": 1, "succ": { "ainan": _2, "honai": _2, "ikata": _2, "imabari": _2, "iyo": _2, "kamijima": _2, "kihoku": _2, "kumakogen": _2, "masaki": _2, "matsuno": _2, "matsuyama": _2, "namikata": _2, "niihama": _2, "ozu": _2, "saijo": _2, "seiyo": _2, "shikokuchuo": _2, "tobe": _2, "toon": _2, "uchiko": _2, "uwajima": _2, "yawatahama": _2 } }, "fukui": { "$": 1, "succ": { "echizen": _2, "eiheiji": _2, "fukui": _2, "ikeda": _2, "katsuyama": _2, "mihama": _2, "minamiechizen": _2, "obama": _2, "ohi": _2, "ono": _2, "sabae": _2, "sakai": _2, "takahama": _2, "tsuruga": _2, "wakasa": _2 } }, "fukuoka": { "$": 1, "succ": { "ashiya": _2, "buzen": _2, "chikugo": _2, "chikuho": _2, "chikujo": _2, "chikushino": _2, "chikuzen": _2, "chuo": _2, "dazaifu": _2, "fukuchi": _2, "hakata": _2, "higashi": _2, "hirokawa": _2, "hisayama": _2, "iizuka": _2, "inatsuki": _2, "kaho": _2, "kasuga": _2, "kasuya": _2, "kawara": _2, "keisen": _2, "koga": _2, "kurate": _2, "kurogi": _2, "kurume": _2, "minami": _2, "miyako": _2, "miyama": _2, "miyawaka": _2, "mizumaki": _2, "munakata": _2, "nakagawa": _2, "nakama": _2, "nishi": _2, "nogata": _2, "ogori": _2, "okagaki": _2, "okawa": _2, "oki": _2, "omuta": _2, "onga": _2, "onojo": _2, "oto": _2, "saigawa": _2, "sasaguri": _2, "shingu": _2, "shinyoshitomi": _2, "shonai": _2, "soeda": _2, "sue": _2, "tachiarai": _2, "tagawa": _2, "takata": _2, "toho": _2, "toyotsu": _2, "tsuiki": _2, "ukiha": _2, "umi": _2, "usui": _2, "yamada": _2, "yame": _2, "yanagawa": _2, "yukuhashi": _2 } }, "fukushima": { "$": 1, "succ": { "aizubange": _2, "aizumisato": _2, "aizuwakamatsu": _2, "asakawa": _2, "bandai": _2, "date": _2, "fukushima": _2, "furudono": _2, "futaba": _2, "hanawa": _2, "higashi": _2, "hirata": _2, "hirono": _2, "iitate": _2, "inawashiro": _2, "ishikawa": _2, "iwaki": _2, "izumizaki": _2, "kagamiishi": _2, "kaneyama": _2, "kawamata": _2, "kitakata": _2, "kitashiobara": _2, "koori": _2, "koriyama": _2, "kunimi": _2, "miharu": _2, "mishima": _2, "namie": _2, "nango": _2, "nishiaizu": _2, "nishigo": _2, "okuma": _2, "omotego": _2, "ono": _2, "otama": _2, "samegawa": _2, "shimogo": _2, "shirakawa": _2, "showa": _2, "soma": _2, "sukagawa": _2, "taishin": _2, "tamakawa": _2, "tanagura": _2, "tenei": _2, "yabuki": _2, "yamato": _2, "yamatsuri": _2, "yanaizu": _2, "yugawa": _2 } }, "gifu": { "$": 1, "succ": { "anpachi": _2, "ena": _2, "gifu": _2, "ginan": _2, "godo": _2, "gujo": _2, "hashima": _2, "hichiso": _2, "hida": _2, "higashishirakawa": _2, "ibigawa": _2, "ikeda": _2, "kakamigahara": _2, "kani": _2, "kasahara": _2, "kasamatsu": _2, "kawaue": _2, "kitagata": _2, "mino": _2, "minokamo": _2, "mitake": _2, "mizunami": _2, "motosu": _2, "nakatsugawa": _2, "ogaki": _2, "sakahogi": _2, "seki": _2, "sekigahara": _2, "shirakawa": _2, "tajimi": _2, "takayama": _2, "tarui": _2, "toki": _2, "tomika": _2, "wanouchi": _2, "yamagata": _2, "yaotsu": _2, "yoro": _2 } }, "gunma": { "$": 1, "succ": { "annaka": _2, "chiyoda": _2, "fujioka": _2, "higashiagatsuma": _2, "isesaki": _2, "itakura": _2, "kanna": _2, "kanra": _2, "katashina": _2, "kawaba": _2, "kiryu": _2, "kusatsu": _2, "maebashi": _2, "meiwa": _2, "midori": _2, "minakami": _2, "naganohara": _2, "nakanojo": _2, "nanmoku": _2, "numata": _2, "oizumi": _2, "ora": _2, "ota": _2, "shibukawa": _2, "shimonita": _2, "shinto": _2, "showa": _2, "takasaki": _2, "takayama": _2, "tamamura": _2, "tatebayashi": _2, "tomioka": _2, "tsukiyono": _2, "tsumagoi": _2, "ueno": _2, "yoshioka": _2 } }, "hiroshima": { "$": 1, "succ": { "asaminami": _2, "daiwa": _2, "etajima": _2, "fuchu": _2, "fukuyama": _2, "hatsukaichi": _2, "higashihiroshima": _2, "hongo": _2, "jinsekikogen": _2, "kaita": _2, "kui": _2, "kumano": _2, "kure": _2, "mihara": _2, "miyoshi": _2, "naka": _2, "onomichi": _2, "osakikamijima": _2, "otake": _2, "saka": _2, "sera": _2, "seranishi": _2, "shinichi": _2, "shobara": _2, "takehara": _2 } }, "hokkaido": { "$": 1, "succ": { "abashiri": _2, "abira": _2, "aibetsu": _2, "akabira": _2, "akkeshi": _2, "asahikawa": _2, "ashibetsu": _2, "ashoro": _2, "assabu": _2, "atsuma": _2, "bibai": _2, "biei": _2, "bifuka": _2, "bihoro": _2, "biratori": _2, "chippubetsu": _2, "chitose": _2, "date": _2, "ebetsu": _2, "embetsu": _2, "eniwa": _2, "erimo": _2, "esan": _2, "esashi": _2, "fukagawa": _2, "fukushima": _2, "furano": _2, "furubira": _2, "haboro": _2, "hakodate": _2, "hamatonbetsu": _2, "hidaka": _2, "higashikagura": _2, "higashikawa": _2, "hiroo": _2, "hokuryu": _2, "hokuto": _2, "honbetsu": _2, "horokanai": _2, "horonobe": _2, "ikeda": _2, "imakane": _2, "ishikari": _2, "iwamizawa": _2, "iwanai": _2, "kamifurano": _2, "kamikawa": _2, "kamishihoro": _2, "kamisunagawa": _2, "kamoenai": _2, "kayabe": _2, "kembuchi": _2, "kikonai": _2, "kimobetsu": _2, "kitahiroshima": _2, "kitami": _2, "kiyosato": _2, "koshimizu": _2, "kunneppu": _2, "kuriyama": _2, "kuromatsunai": _2, "kushiro": _2, "kutchan": _2, "kyowa": _2, "mashike": _2, "matsumae": _2, "mikasa": _2, "minamifurano": _2, "mombetsu": _2, "moseushi": _2, "mukawa": _2, "muroran": _2, "naie": _2, "nakagawa": _2, "nakasatsunai": _2, "nakatombetsu": _2, "nanae": _2, "nanporo": _2, "nayoro": _2, "nemuro": _2, "niikappu": _2, "niki": _2, "nishiokoppe": _2, "noboribetsu": _2, "numata": _2, "obihiro": _2, "obira": _2, "oketo": _2, "okoppe": _2, "otaru": _2, "otobe": _2, "otofuke": _2, "otoineppu": _2, "oumu": _2, "ozora": _2, "pippu": _2, "rankoshi": _2, "rebun": _2, "rikubetsu": _2, "rishiri": _2, "rishirifuji": _2, "saroma": _2, "sarufutsu": _2, "shakotan": _2, "shari": _2, "shibecha": _2, "shibetsu": _2, "shikabe": _2, "shikaoi": _2, "shimamaki": _2, "shimizu": _2, "shimokawa": _2, "shinshinotsu": _2, "shintoku": _2, "shiranuka": _2, "shiraoi": _2, "shiriuchi": _2, "sobetsu": _2, "sunagawa": _2, "taiki": _2, "takasu": _2, "takikawa": _2, "takinoue": _2, "teshikaga": _2, "tobetsu": _2, "tohma": _2, "tomakomai": _2, "tomari": _2, "toya": _2, "toyako": _2, "toyotomi": _2, "toyoura": _2, "tsubetsu": _2, "tsukigata": _2, "urakawa": _2, "urausu": _2, "uryu": _2, "utashinai": _2, "wakkanai": _2, "wassamu": _2, "yakumo": _2, "yoichi": _2 } }, "hyogo": { "$": 1, "succ": { "aioi": _2, "akashi": _2, "ako": _2, "amagasaki": _2, "aogaki": _2, "asago": _2, "ashiya": _2, "awaji": _2, "fukusaki": _2, "goshiki": _2, "harima": _2, "himeji": _2, "ichikawa": _2, "inagawa": _2, "itami": _2, "kakogawa": _2, "kamigori": _2, "kamikawa": _2, "kasai": _2, "kasuga": _2, "kawanishi": _2, "miki": _2, "minamiawaji": _2, "nishinomiya": _2, "nishiwaki": _2, "ono": _2, "sanda": _2, "sannan": _2, "sasayama": _2, "sayo": _2, "shingu": _2, "shinonsen": _2, "shiso": _2, "sumoto": _2, "taishi": _2, "taka": _2, "takarazuka": _2, "takasago": _2, "takino": _2, "tamba": _2, "tatsuno": _2, "toyooka": _2, "yabu": _2, "yashiro": _2, "yoka": _2, "yokawa": _2 } }, "ibaraki": { "$": 1, "succ": { "ami": _2, "asahi": _2, "bando": _2, "chikusei": _2, "daigo": _2, "fujishiro": _2, "hitachi": _2, "hitachinaka": _2, "hitachiomiya": _2, "hitachiota": _2, "ibaraki": _2, "ina": _2, "inashiki": _2, "itako": _2, "iwama": _2, "joso": _2, "kamisu": _2, "kasama": _2, "kashima": _2, "kasumigaura": _2, "koga": _2, "miho": _2, "mito": _2, "moriya": _2, "naka": _2, "namegata": _2, "oarai": _2, "ogawa": _2, "omitama": _2, "ryugasaki": _2, "sakai": _2, "sakuragawa": _2, "shimodate": _2, "shimotsuma": _2, "shirosato": _2, "sowa": _2, "suifu": _2, "takahagi": _2, "tamatsukuri": _2, "tokai": _2, "tomobe": _2, "tone": _2, "toride": _2, "tsuchiura": _2, "tsukuba": _2, "uchihara": _2, "ushiku": _2, "yachiyo": _2, "yamagata": _2, "yawara": _2, "yuki": _2 } }, "ishikawa": { "$": 1, "succ": { "anamizu": _2, "hakui": _2, "hakusan": _2, "kaga": _2, "kahoku": _2, "kanazawa": _2, "kawakita": _2, "komatsu": _2, "nakanoto": _2, "nanao": _2, "nomi": _2, "nonoichi": _2, "noto": _2, "shika": _2, "suzu": _2, "tsubata": _2, "tsurugi": _2, "uchinada": _2, "wajima": _2 } }, "iwate": { "$": 1, "succ": { "fudai": _2, "fujisawa": _2, "hanamaki": _2, "hiraizumi": _2, "hirono": _2, "ichinohe": _2, "ichinoseki": _2, "iwaizumi": _2, "iwate": _2, "joboji": _2, "kamaishi": _2, "kanegasaki": _2, "karumai": _2, "kawai": _2, "kitakami": _2, "kuji": _2, "kunohe": _2, "kuzumaki": _2, "miyako": _2, "mizusawa": _2, "morioka": _2, "ninohe": _2, "noda": _2, "ofunato": _2, "oshu": _2, "otsuchi": _2, "rikuzentakata": _2, "shiwa": _2, "shizukuishi": _2, "sumita": _2, "tanohata": _2, "tono": _2, "yahaba": _2, "yamada": _2 } }, "kagawa": { "$": 1, "succ": { "ayagawa": _2, "higashikagawa": _2, "kanonji": _2, "kotohira": _2, "manno": _2, "marugame": _2, "mitoyo": _2, "naoshima": _2, "sanuki": _2, "tadotsu": _2, "takamatsu": _2, "tonosho": _2, "uchinomi": _2, "utazu": _2, "zentsuji": _2 } }, "kagoshima": { "$": 1, "succ": { "akune": _2, "amami": _2, "hioki": _2, "isa": _2, "isen": _2, "izumi": _2, "kagoshima": _2, "kanoya": _2, "kawanabe": _2, "kinko": _2, "kouyama": _2, "makurazaki": _2, "matsumoto": _2, "minamitane": _2, "nakatane": _2, "nishinoomote": _2, "satsumasendai": _2, "soo": _2, "tarumizu": _2, "yusui": _2 } }, "kanagawa": { "$": 1, "succ": { "aikawa": _2, "atsugi": _2, "ayase": _2, "chigasaki": _2, "ebina": _2, "fujisawa": _2, "hadano": _2, "hakone": _2, "hiratsuka": _2, "isehara": _2, "kaisei": _2, "kamakura": _2, "kiyokawa": _2, "matsuda": _2, "minamiashigara": _2, "miura": _2, "nakai": _2, "ninomiya": _2, "odawara": _2, "oi": _2, "oiso": _2, "sagamihara": _2, "samukawa": _2, "tsukui": _2, "yamakita": _2, "yamato": _2, "yokosuka": _2, "yugawara": _2, "zama": _2, "zushi": _2 } }, "kochi": { "$": 1, "succ": { "aki": _2, "geisei": _2, "hidaka": _2, "higashitsuno": _2, "ino": _2, "kagami": _2, "kami": _2, "kitagawa": _2, "kochi": _2, "mihara": _2, "motoyama": _2, "muroto": _2, "nahari": _2, "nakamura": _2, "nankoku": _2, "nishitosa": _2, "niyodogawa": _2, "ochi": _2, "okawa": _2, "otoyo": _2, "otsuki": _2, "sakawa": _2, "sukumo": _2, "susaki": _2, "tosa": _2, "tosashimizu": _2, "toyo": _2, "tsuno": _2, "umaji": _2, "yasuda": _2, "yusuhara": _2 } }, "kumamoto": { "$": 1, "succ": { "amakusa": _2, "arao": _2, "aso": _2, "choyo": _2, "gyokuto": _2, "kamiamakusa": _2, "kikuchi": _2, "kumamoto": _2, "mashiki": _2, "mifune": _2, "minamata": _2, "minamioguni": _2, "nagasu": _2, "nishihara": _2, "oguni": _2, "ozu": _2, "sumoto": _2, "takamori": _2, "uki": _2, "uto": _2, "yamaga": _2, "yamato": _2, "yatsushiro": _2 } }, "kyoto": { "$": 1, "succ": { "ayabe": _2, "fukuchiyama": _2, "higashiyama": _2, "ide": _2, "ine": _2, "joyo": _2, "kameoka": _2, "kamo": _2, "kita": _2, "kizu": _2, "kumiyama": _2, "kyotamba": _2, "kyotanabe": _2, "kyotango": _2, "maizuru": _2, "minami": _2, "minamiyamashiro": _2, "miyazu": _2, "muko": _2, "nagaokakyo": _2, "nakagyo": _2, "nantan": _2, "oyamazaki": _2, "sakyo": _2, "seika": _2, "tanabe": _2, "uji": _2, "ujitawara": _2, "wazuka": _2, "yamashina": _2, "yawata": _2 } }, "mie": { "$": 1, "succ": { "asahi": _2, "inabe": _2, "ise": _2, "kameyama": _2, "kawagoe": _2, "kiho": _2, "kisosaki": _2, "kiwa": _2, "komono": _2, "kumano": _2, "kuwana": _2, "matsusaka": _2, "meiwa": _2, "mihama": _2, "minamiise": _2, "misugi": _2, "miyama": _2, "nabari": _2, "shima": _2, "suzuka": _2, "tado": _2, "taiki": _2, "taki": _2, "tamaki": _2, "toba": _2, "tsu": _2, "udono": _2, "ureshino": _2, "watarai": _2, "yokkaichi": _2 } }, "miyagi": { "$": 1, "succ": { "furukawa": _2, "higashimatsushima": _2, "ishinomaki": _2, "iwanuma": _2, "kakuda": _2, "kami": _2, "kawasaki": _2, "marumori": _2, "matsushima": _2, "minamisanriku": _2, "misato": _2, "murata": _2, "natori": _2, "ogawara": _2, "ohira": _2, "onagawa": _2, "osaki": _2, "rifu": _2, "semine": _2, "shibata": _2, "shichikashuku": _2, "shikama": _2, "shiogama": _2, "shiroishi": _2, "tagajo": _2, "taiwa": _2, "tome": _2, "tomiya": _2, "wakuya": _2, "watari": _2, "yamamoto": _2, "zao": _2 } }, "miyazaki": { "$": 1, "succ": { "aya": _2, "ebino": _2, "gokase": _2, "hyuga": _2, "kadogawa": _2, "kawaminami": _2, "kijo": _2, "kitagawa": _2, "kitakata": _2, "kitaura": _2, "kobayashi": _2, "kunitomi": _2, "kushima": _2, "mimata": _2, "miyakonojo": _2, "miyazaki": _2, "morotsuka": _2, "nichinan": _2, "nishimera": _2, "nobeoka": _2, "saito": _2, "shiiba": _2, "shintomi": _2, "takaharu": _2, "takanabe": _2, "takazaki": _2, "tsuno": _2 } }, "nagano": { "$": 1, "succ": { "achi": _2, "agematsu": _2, "anan": _2, "aoki": _2, "asahi": _2, "azumino": _2, "chikuhoku": _2, "chikuma": _2, "chino": _2, "fujimi": _2, "hakuba": _2, "hara": _2, "hiraya": _2, "iida": _2, "iijima": _2, "iiyama": _2, "iizuna": _2, "ikeda": _2, "ikusaka": _2, "ina": _2, "karuizawa": _2, "kawakami": _2, "kiso": _2, "kisofukushima": _2, "kitaaiki": _2, "komagane": _2, "komoro": _2, "matsukawa": _2, "matsumoto": _2, "miasa": _2, "minamiaiki": _2, "minamimaki": _2, "minamiminowa": _2, "minowa": _2, "miyada": _2, "miyota": _2, "mochizuki": _2, "nagano": _2, "nagawa": _2, "nagiso": _2, "nakagawa": _2, "nakano": _2, "nozawaonsen": _2, "obuse": _2, "ogawa": _2, "okaya": _2, "omachi": _2, "omi": _2, "ookuwa": _2, "ooshika": _2, "otaki": _2, "otari": _2, "sakae": _2, "sakaki": _2, "saku": _2, "sakuho": _2, "shimosuwa": _2, "shinanomachi": _2, "shiojiri": _2, "suwa": _2, "suzaka": _2, "takagi": _2, "takamori": _2, "takayama": _2, "tateshina": _2, "tatsuno": _2, "togakushi": _2, "togura": _2, "tomi": _2, "ueda": _2, "wada": _2, "yamagata": _2, "yamanouchi": _2, "yasaka": _2, "yasuoka": _2 } }, "nagasaki": { "$": 1, "succ": { "chijiwa": _2, "futsu": _2, "goto": _2, "hasami": _2, "hirado": _2, "iki": _2, "isahaya": _2, "kawatana": _2, "kuchinotsu": _2, "matsuura": _2, "nagasaki": _2, "obama": _2, "omura": _2, "oseto": _2, "saikai": _2, "sasebo": _2, "seihi": _2, "shimabara": _2, "shinkamigoto": _2, "togitsu": _2, "tsushima": _2, "unzen": _2 } }, "nara": { "$": 1, "succ": { "ando": _2, "gose": _2, "heguri": _2, "higashiyoshino": _2, "ikaruga": _2, "ikoma": _2, "kamikitayama": _2, "kanmaki": _2, "kashiba": _2, "kashihara": _2, "katsuragi": _2, "kawai": _2, "kawakami": _2, "kawanishi": _2, "koryo": _2, "kurotaki": _2, "mitsue": _2, "miyake": _2, "nara": _2, "nosegawa": _2, "oji": _2, "ouda": _2, "oyodo": _2, "sakurai": _2, "sango": _2, "shimoichi": _2, "shimokitayama": _2, "shinjo": _2, "soni": _2, "takatori": _2, "tawaramoto": _2, "tenkawa": _2, "tenri": _2, "uda": _2, "yamatokoriyama": _2, "yamatotakada": _2, "yamazoe": _2, "yoshino": _2 } }, "niigata": { "$": 1, "succ": { "aga": _2, "agano": _2, "gosen": _2, "itoigawa": _2, "izumozaki": _2, "joetsu": _2, "kamo": _2, "kariwa": _2, "kashiwazaki": _2, "minamiuonuma": _2, "mitsuke": _2, "muika": _2, "murakami": _2, "myoko": _2, "nagaoka": _2, "niigata": _2, "ojiya": _2, "omi": _2, "sado": _2, "sanjo": _2, "seiro": _2, "seirou": _2, "sekikawa": _2, "shibata": _2, "tagami": _2, "tainai": _2, "tochio": _2, "tokamachi": _2, "tsubame": _2, "tsunan": _2, "uonuma": _2, "yahiko": _2, "yoita": _2, "yuzawa": _2 } }, "oita": { "$": 1, "succ": { "beppu": _2, "bungoono": _2, "bungotakada": _2, "hasama": _2, "hiji": _2, "himeshima": _2, "hita": _2, "kamitsue": _2, "kokonoe": _2, "kuju": _2, "kunisaki": _2, "kusu": _2, "oita": _2, "saiki": _2, "taketa": _2, "tsukumi": _2, "usa": _2, "usuki": _2, "yufu": _2 } }, "okayama": { "$": 1, "succ": { "akaiwa": _2, "asakuchi": _2, "bizen": _2, "hayashima": _2, "ibara": _2, "kagamino": _2, "kasaoka": _2, "kibichuo": _2, "kumenan": _2, "kurashiki": _2, "maniwa": _2, "misaki": _2, "nagi": _2, "niimi": _2, "nishiawakura": _2, "okayama": _2, "satosho": _2, "setouchi": _2, "shinjo": _2, "shoo": _2, "soja": _2, "takahashi": _2, "tamano": _2, "tsuyama": _2, "wake": _2, "yakage": _2 } }, "okinawa": { "$": 1, "succ": { "aguni": _2, "ginowan": _2, "ginoza": _2, "gushikami": _2, "haebaru": _2, "higashi": _2, "hirara": _2, "iheya": _2, "ishigaki": _2, "ishikawa": _2, "itoman": _2, "izena": _2, "kadena": _2, "kin": _2, "kitadaito": _2, "kitanakagusuku": _2, "kumejima": _2, "kunigami": _2, "minamidaito": _2, "motobu": _2, "nago": _2, "naha": _2, "nakagusuku": _2, "nakijin": _2, "nanjo": _2, "nishihara": _2, "ogimi": _2, "okinawa": _2, "onna": _2, "shimoji": _2, "taketomi": _2, "tarama": _2, "tokashiki": _2, "tomigusuku": _2, "tonaki": _2, "urasoe": _2, "uruma": _2, "yaese": _2, "yomitan": _2, "yonabaru": _2, "yonaguni": _2, "zamami": _2 } }, "osaka": { "$": 1, "succ": { "abeno": _2, "chihayaakasaka": _2, "chuo": _2, "daito": _2, "fujiidera": _2, "habikino": _2, "hannan": _2, "higashiosaka": _2, "higashisumiyoshi": _2, "higashiyodogawa": _2, "hirakata": _2, "ibaraki": _2, "ikeda": _2, "izumi": _2, "izumiotsu": _2, "izumisano": _2, "kadoma": _2, "kaizuka": _2, "kanan": _2, "kashiwara": _2, "katano": _2, "kawachinagano": _2, "kishiwada": _2, "kita": _2, "kumatori": _2, "matsubara": _2, "minato": _2, "minoh": _2, "misaki": _2, "moriguchi": _2, "neyagawa": _2, "nishi": _2, "nose": _2, "osakasayama": _2, "sakai": _2, "sayama": _2, "sennan": _2, "settsu": _2, "shijonawate": _2, "shimamoto": _2, "suita": _2, "tadaoka": _2, "taishi": _2, "tajiri": _2, "takaishi": _2, "takatsuki": _2, "tondabayashi": _2, "toyonaka": _2, "toyono": _2, "yao": _2 } }, "saga": { "$": 1, "succ": { "ariake": _2, "arita": _2, "fukudomi": _2, "genkai": _2, "hamatama": _2, "hizen": _2, "imari": _2, "kamimine": _2, "kanzaki": _2, "karatsu": _2, "kashima": _2, "kitagata": _2, "kitahata": _2, "kiyama": _2, "kouhoku": _2, "kyuragi": _2, "nishiarita": _2, "ogi": _2, "omachi": _2, "ouchi": _2, "saga": _2, "shiroishi": _2, "taku": _2, "tara": _2, "tosu": _2, "yoshinogari": _2 } }, "saitama": { "$": 1, "succ": { "arakawa": _2, "asaka": _2, "chichibu": _2, "fujimi": _2, "fujimino": _2, "fukaya": _2, "hanno": _2, "hanyu": _2, "hasuda": _2, "hatogaya": _2, "hatoyama": _2, "hidaka": _2, "higashichichibu": _2, "higashimatsuyama": _2, "honjo": _2, "ina": _2, "iruma": _2, "iwatsuki": _2, "kamiizumi": _2, "kamikawa": _2, "kamisato": _2, "kasukabe": _2, "kawagoe": _2, "kawaguchi": _2, "kawajima": _2, "kazo": _2, "kitamoto": _2, "koshigaya": _2, "kounosu": _2, "kuki": _2, "kumagaya": _2, "matsubushi": _2, "minano": _2, "misato": _2, "miyashiro": _2, "miyoshi": _2, "moroyama": _2, "nagatoro": _2, "namegawa": _2, "niiza": _2, "ogano": _2, "ogawa": _2, "ogose": _2, "okegawa": _2, "omiya": _2, "otaki": _2, "ranzan": _2, "ryokami": _2, "saitama": _2, "sakado": _2, "satte": _2, "sayama": _2, "shiki": _2, "shiraoka": _2, "soka": _2, "sugito": _2, "toda": _2, "tokigawa": _2, "tokorozawa": _2, "tsurugashima": _2, "urawa": _2, "warabi": _2, "yashio": _2, "yokoze": _2, "yono": _2, "yorii": _2, "yoshida": _2, "yoshikawa": _2, "yoshimi": _2 } }, "shiga": { "$": 1, "succ": { "aisho": _2, "gamo": _2, "higashiomi": _2, "hikone": _2, "koka": _2, "konan": _2, "kosei": _2, "koto": _2, "kusatsu": _2, "maibara": _2, "moriyama": _2, "nagahama": _2, "nishiazai": _2, "notogawa": _2, "omihachiman": _2, "otsu": _2, "ritto": _2, "ryuoh": _2, "takashima": _2, "takatsuki": _2, "torahime": _2, "toyosato": _2, "yasu": _2 } }, "shimane": { "$": 1, "succ": { "akagi": _2, "ama": _2, "gotsu": _2, "hamada": _2, "higashiizumo": _2, "hikawa": _2, "hikimi": _2, "izumo": _2, "kakinoki": _2, "masuda": _2, "matsue": _2, "misato": _2, "nishinoshima": _2, "ohda": _2, "okinoshima": _2, "okuizumo": _2, "shimane": _2, "tamayu": _2, "tsuwano": _2, "unnan": _2, "yakumo": _2, "yasugi": _2, "yatsuka": _2 } }, "shizuoka": { "$": 1, "succ": { "arai": _2, "atami": _2, "fuji": _2, "fujieda": _2, "fujikawa": _2, "fujinomiya": _2, "fukuroi": _2, "gotemba": _2, "haibara": _2, "hamamatsu": _2, "higashiizu": _2, "ito": _2, "iwata": _2, "izu": _2, "izunokuni": _2, "kakegawa": _2, "kannami": _2, "kawanehon": _2, "kawazu": _2, "kikugawa": _2, "kosai": _2, "makinohara": _2, "matsuzaki": _2, "minamiizu": _2, "mishima": _2, "morimachi": _2, "nishiizu": _2, "numazu": _2, "omaezaki": _2, "shimada": _2, "shimizu": _2, "shimoda": _2, "shizuoka": _2, "susono": _2, "yaizu": _2, "yoshida": _2 } }, "tochigi": { "$": 1, "succ": { "ashikaga": _2, "bato": _2, "haga": _2, "ichikai": _2, "iwafune": _2, "kaminokawa": _2, "kanuma": _2, "karasuyama": _2, "kuroiso": _2, "mashiko": _2, "mibu": _2, "moka": _2, "motegi": _2, "nasu": _2, "nasushiobara": _2, "nikko": _2, "nishikata": _2, "nogi": _2, "ohira": _2, "ohtawara": _2, "oyama": _2, "sakura": _2, "sano": _2, "shimotsuke": _2, "shioya": _2, "takanezawa": _2, "tochigi": _2, "tsuga": _2, "ujiie": _2, "utsunomiya": _2, "yaita": _2 } }, "tokushima": { "$": 1, "succ": { "aizumi": _2, "anan": _2, "ichiba": _2, "itano": _2, "kainan": _2, "komatsushima": _2, "matsushige": _2, "mima": _2, "minami": _2, "miyoshi": _2, "mugi": _2, "nakagawa": _2, "naruto": _2, "sanagochi": _2, "shishikui": _2, "tokushima": _2, "wajiki": _2 } }, "tokyo": { "$": 1, "succ": { "adachi": _2, "akiruno": _2, "akishima": _2, "aogashima": _2, "arakawa": _2, "bunkyo": _2, "chiyoda": _2, "chofu": _2, "chuo": _2, "edogawa": _2, "fuchu": _2, "fussa": _2, "hachijo": _2, "hachioji": _2, "hamura": _2, "higashikurume": _2, "higashimurayama": _2, "higashiyamato": _2, "hino": _2, "hinode": _2, "hinohara": _2, "inagi": _2, "itabashi": _2, "katsushika": _2, "kita": _2, "kiyose": _2, "kodaira": _2, "koganei": _2, "kokubunji": _2, "komae": _2, "koto": _2, "kouzushima": _2, "kunitachi": _2, "machida": _2, "meguro": _2, "minato": _2, "mitaka": _2, "mizuho": _2, "musashimurayama": _2, "musashino": _2, "nakano": _2, "nerima": _2, "ogasawara": _2, "okutama": _2, "ome": _2, "oshima": _2, "ota": _2, "setagaya": _2, "shibuya": _2, "shinagawa": _2, "shinjuku": _2, "suginami": _2, "sumida": _2, "tachikawa": _2, "taito": _2, "tama": _2, "toshima": _2 } }, "tottori": { "$": 1, "succ": { "chizu": _2, "hino": _2, "kawahara": _2, "koge": _2, "kotoura": _2, "misasa": _2, "nanbu": _2, "nichinan": _2, "sakaiminato": _2, "tottori": _2, "wakasa": _2, "yazu": _2, "yonago": _2 } }, "toyama": { "$": 1, "succ": { "asahi": _2, "fuchu": _2, "fukumitsu": _2, "funahashi": _2, "himi": _2, "imizu": _2, "inami": _2, "johana": _2, "kamiichi": _2, "kurobe": _2, "nakaniikawa": _2, "namerikawa": _2, "nanto": _2, "nyuzen": _2, "oyabe": _2, "taira": _2, "takaoka": _2, "tateyama": _2, "toga": _2, "tonami": _2, "toyama": _2, "unazuki": _2, "uozu": _2, "yamada": _2 } }, "wakayama": { "$": 1, "succ": { "arida": _2, "aridagawa": _2, "gobo": _2, "hashimoto": _2, "hidaka": _2, "hirogawa": _2, "inami": _2, "iwade": _2, "kainan": _2, "kamitonda": _2, "katsuragi": _2, "kimino": _2, "kinokawa": _2, "kitayama": _2, "koya": _2, "koza": _2, "kozagawa": _2, "kudoyama": _2, "kushimoto": _2, "mihama": _2, "misato": _2, "nachikatsuura": _2, "shingu": _2, "shirahama": _2, "taiji": _2, "tanabe": _2, "wakayama": _2, "yuasa": _2, "yura": _2 } }, "yamagata": { "$": 1, "succ": { "asahi": _2, "funagata": _2, "higashine": _2, "iide": _2, "kahoku": _2, "kaminoyama": _2, "kaneyama": _2, "kawanishi": _2, "mamurogawa": _2, "mikawa": _2, "murayama": _2, "nagai": _2, "nakayama": _2, "nanyo": _2, "nishikawa": _2, "obanazawa": _2, "oe": _2, "oguni": _2, "ohkura": _2, "oishida": _2, "sagae": _2, "sakata": _2, "sakegawa": _2, "shinjo": _2, "shirataka": _2, "shonai": _2, "takahata": _2, "tendo": _2, "tozawa": _2, "tsuruoka": _2, "yamagata": _2, "yamanobe": _2, "yonezawa": _2, "yuza": _2 } }, "yamaguchi": { "$": 1, "succ": { "abu": _2, "hagi": _2, "hikari": _2, "hofu": _2, "iwakuni": _2, "kudamatsu": _2, "mitou": _2, "nagato": _2, "oshima": _2, "shimonoseki": _2, "shunan": _2, "tabuse": _2, "tokuyama": _2, "toyota": _2, "ube": _2, "yuu": _2 } }, "yamanashi": { "$": 1, "succ": { "chuo": _2, "doshi": _2, "fuefuki": _2, "fujikawa": _2, "fujikawaguchiko": _2, "fujiyoshida": _2, "hayakawa": _2, "hokuto": _2, "ichikawamisato": _2, "kai": _2, "kofu": _2, "koshu": _2, "kosuge": _2, "minami-alps": _2, "minobu": _2, "nakamichi": _2, "nanbu": _2, "narusawa": _2, "nirasaki": _2, "nishikatsura": _2, "oshino": _2, "otsuki": _2, "showa": _2, "tabayama": _2, "tsuru": _2, "uenohara": _2, "yamanakako": _2, "yamanashi": _2 } }, "xn--4pvxs": _2, "栃木": _2, "xn--vgu402c": _2, "愛知": _2, "xn--c3s14m": _2, "愛媛": _2, "xn--f6qx53a": _2, "兵庫": _2, "xn--8pvr4u": _2, "熊本": _2, "xn--uist22h": _2, "茨城": _2, "xn--djrs72d6uy": _2, "北海道": _2, "xn--mkru45i": _2, "千葉": _2, "xn--0trq7p7nn": _2, "和歌山": _2, "xn--8ltr62k": _2, "長崎": _2, "xn--2m4a15e": _2, "長野": _2, "xn--efvn9s": _2, "新潟": _2, "xn--32vp30h": _2, "青森": _2, "xn--4it797k": _2, "静岡": _2, "xn--1lqs71d": _2, "東京": _2, "xn--5rtp49c": _2, "石川": _2, "xn--5js045d": _2, "埼玉": _2, "xn--ehqz56n": _2, "三重": _2, "xn--1lqs03n": _2, "京都": _2, "xn--qqqt11m": _2, "佐賀": _2, "xn--kbrq7o": _2, "大分": _2, "xn--pssu33l": _2, "大阪": _2, "xn--ntsq17g": _2, "奈良": _2, "xn--uisz3g": _2, "宮城": _2, "xn--6btw5a": _2, "宮崎": _2, "xn--1ctwo": _2, "富山": _2, "xn--6orx2r": _2, "山口": _2, "xn--rht61e": _2, "山形": _2, "xn--rht27z": _2, "山梨": _2, "xn--djty4k": _2, "岩手": _2, "xn--nit225k": _2, "岐阜": _2, "xn--rht3d": _2, "岡山": _2, "xn--klty5x": _2, "島根": _2, "xn--kltx9a": _2, "広島": _2, "xn--kltp7d": _2, "徳島": _2, "xn--uuwu58a": _2, "沖縄": _2, "xn--zbx025d": _2, "滋賀": _2, "xn--ntso0iqx3a": _2, "神奈川": _2, "xn--elqq16h": _2, "福井": _2, "xn--4it168d": _2, "福岡": _2, "xn--klt787d": _2, "福島": _2, "xn--rny31h": _2, "秋田": _2, "xn--7t0a264c": _2, "群馬": _2, "xn--5rtq34k": _2, "香川": _2, "xn--k7yn95e": _2, "高知": _2, "xn--tor131o": _2, "鳥取": _2, "xn--d5qv7z876c": _2, "鹿児島": _2, "kawasaki": _8, "kitakyushu": _8, "kobe": _8, "nagoya": _8, "sapporo": _8, "sendai": _8, "yokohama": _8, "buyshop": _3, "fashionstore": _3, "handcrafted": _3, "kawaiishop": _3, "supersale": _3, "theshop": _3, "usercontent": _3, "angry": _3, "babyblue": _3, "babymilk": _3, "backdrop": _3, "bambina": _3, "bitter": _3, "blush": _3, "boo": _3, "boy": _3, "boyfriend": _3, "but": _3, "candypop": _3, "capoo": _3, "catfood": _3, "cheap": _3, "chicappa": _3, "chillout": _3, "chips": _3, "chowder": _3, "chu": _3, "ciao": _3, "cocotte": _3, "coolblog": _3, "cranky": _3, "cutegirl": _3, "daa": _3, "deca": _3, "deci": _3, "digick": _3, "egoism": _3, "fakefur": _3, "fem": _3, "flier": _3, "floppy": _3, "fool": _3, "frenchkiss": _3, "girlfriend": _3, "girly": _3, "gloomy": _3, "gonna": _3, "greater": _3, "hacca": _3, "heavy": _3, "her": _3, "hiho": _3, "hippy": _3, "holy": _3, "hungry": _3, "icurus": _3, "itigo": _3, "jellybean": _3, "kikirara": _3, "kill": _3, "kilo": _3, "kuron": _3, "littlestar": _3, "lolitapunk": _3, "lomo": _3, "lovepop": _3, "lovesick": _3, "main": _3, "mods": _3, "mond": _3, "mongolian": _3, "moo": _3, "namaste": _3, "nikita": _3, "nobushi": _3, "noor": _3, "oops": _3, "parallel": _3, "parasite": _3, "pecori": _3, "peewee": _3, "penne": _3, "pepper": _3, "perma": _3, "pigboat": _3, "pinoko": _3, "punyu": _3, "pupu": _3, "pussycat": _3, "pya": _3, "raindrop": _3, "readymade": _3, "sadist": _3, "schoolbus": _3, "secret": _3, "staba": _3, "stripper": _3, "sub": _3, "sunnyday": _3, "thick": _3, "tonkotsu": _3, "under": _3, "upper": _3, "velvet": _3, "verse": _3, "versus": _3, "vivian": _3, "watson": _3, "weblike": _3, "whitesnow": _3, "zombie": _3, "blogspot": _3 } }, "ke": { "$": 1, "succ": { "ac": _2, "co": _6, "go": _2, "info": _2, "me": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2 } }, "kg": { "$": 1, "succ": { "org": _2, "net": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "blog": _3, "io": _3, "jp": _3, "tv": _3, "uk": _3, "us": _3 } }, "kh": _8, "ki": _30, "km": { "$": 1, "succ": { "org": _2, "nom": _2, "gov": _2, "prd": _2, "tm": _2, "edu": _2, "mil": _2, "ass": _2, "com": _2, "coop": _2, "asso": _2, "presse": _2, "medecin": _2, "notaires": _2, "pharmaciens": _2, "veterinaire": _2, "gouv": _2 } }, "kn": { "$": 1, "succ": { "net": _2, "org": _2, "edu": _2, "gov": _2 } }, "kp": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "rep": _2, "tra": _2 } }, "kr": { "$": 1, "succ": { "ac": _2, "co": _2, "es": _2, "go": _2, "hs": _2, "kg": _2, "mil": _2, "ms": _2, "ne": _2, "or": _2, "pe": _2, "re": _2, "sc": _2, "busan": _2, "chungbuk": _2, "chungnam": _2, "daegu": _2, "daejeon": _2, "gangwon": _2, "gwangju": _2, "gyeongbuk": _2, "gyeonggi": _2, "gyeongnam": _2, "incheon": _2, "jeju": _2, "jeonbuk": _2, "jeonnam": _2, "seoul": _2, "ulsan": _2, "blogspot": _3 } }, "kw": { "$": 1, "succ": { "com": _2, "edu": _2, "emb": _2, "gov": _2, "ind": _2, "net": _2, "org": _2 } }, "ky": _22, "kz": { "$": 1, "succ": { "org": _2, "edu": _2, "net": _2, "gov": _2, "mil": _2, "com": _2, "jcloud": _3, "kazteleport": { "$": 0, "succ": { "upaas": _3 } } } }, "la": { "$": 1, "succ": { "int": _2, "net": _2, "info": _2, "edu": _2, "gov": _2, "per": _2, "com": _2, "org": _2, "bnr": _3, "c": _3 } }, "lb": _4, "lc": { "$": 1, "succ": { "com": _2, "net": _2, "co": _2, "org": _2, "edu": _2, "gov": _2, "oy": _3 } }, "li": { "$": 1, "succ": { "blogspot": _3, "caa": _3 } }, "lk": { "$": 1, "succ": { "gov": _2, "sch": _2, "net": _2, "int": _2, "com": _2, "org": _2, "edu": _2, "ngo": _2, "soc": _2, "web": _2, "ltd": _2, "assn": _2, "grp": _2, "hotel": _2, "ac": _2 } }, "lr": _4, "ls": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "sc": _2, "de": _3 } }, "lt": _31, "lu": _6, "lv": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2, "id": _2, "net": _2, "asn": _2, "conf": _2 } }, "ly": { "$": 1, "succ": { "com": _2, "net": _2, "gov": _2, "plc": _2, "edu": _2, "sch": _2, "med": _2, "org": _2, "id": _2 } }, "ma": { "$": 1, "succ": { "co": _2, "net": _2, "gov": _2, "org": _2, "ac": _2, "press": _2 } }, "mc": { "$": 1, "succ": { "tm": _2, "asso": _2 } }, "md": { "$": 1, "succ": { "blogspot": _3, "at": _3, "de": _3, "jp": _3, "to": _3 } }, "me": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "edu": _2, "ac": _2, "gov": _2, "its": _2, "priv": _2, "c66": _3, "daplie": { "$": 2, "succ": { "localhost": _3 } }, "edgestack": _3, "filegear": _3, "filegear-au": _3, "filegear-de": _3, "filegear-gb": _3, "filegear-ie": _3, "filegear-jp": _3, "filegear-sg": _3, "glitch": _3, "ravendb": _3, "lohmus": _3, "barsy": _3, "mcpe": _3, "mcdir": _3, "soundcast": _3, "tcp4": _3, "brasilia": _3, "ddns": _3, "dnsfor": _3, "hopto": _3, "loginto": _3, "noip": _3, "webhop": _3, "vp4": _3, "diskstation": _3, "dscloud": _3, "i234": _3, "myds": _3, "synology": _3, "tbits": _3, "transip": _20, "wedeploy": _3, "yombo": _3, "nohost": _3 } }, "mg": { "$": 1, "succ": { "org": _2, "nom": _2, "gov": _2, "prd": _2, "tm": _2, "edu": _2, "mil": _2, "com": _2, "co": _2 } }, "mh": _2, "mil": _2, "mk": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "edu": _2, "gov": _2, "inf": _2, "name": _2, "blogspot": _3 } }, "ml": { "$": 1, "succ": { "com": _2, "edu": _2, "gouv": _2, "gov": _2, "net": _2, "org": _2, "presse": _2 } }, "mm": _8, "mn": { "$": 1, "succ": { "gov": _2, "edu": _2, "org": _2, "nyc": _3 } }, "mo": _4, "mobi": { "$": 1, "succ": { "barsy": _3, "dscloud": _3 } }, "mp": { "$": 1, "succ": { "ju": _3 } }, "mq": _2, "mr": _31, "ms": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "lab": _3, "minisite": _3 } }, "mt": { "$": 1, "succ": { "com": _6, "edu": _2, "net": _2, "org": _2 } }, "mu": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "ac": _2, "co": _2, "or": _2 } }, "museum": { "$": 1, "succ": { "academy": _2, "agriculture": _2, "air": _2, "airguard": _2, "alabama": _2, "alaska": _2, "amber": _2, "ambulance": _2, "american": _2, "americana": _2, "americanantiques": _2, "americanart": _2, "amsterdam": _2, "and": _2, "annefrank": _2, "anthro": _2, "anthropology": _2, "antiques": _2, "aquarium": _2, "arboretum": _2, "archaeological": _2, "archaeology": _2, "architecture": _2, "art": _2, "artanddesign": _2, "artcenter": _2, "artdeco": _2, "arteducation": _2, "artgallery": _2, "arts": _2, "artsandcrafts": _2, "asmatart": _2, "assassination": _2, "assisi": _2, "association": _2, "astronomy": _2, "atlanta": _2, "austin": _2, "australia": _2, "automotive": _2, "aviation": _2, "axis": _2, "badajoz": _2, "baghdad": _2, "bahn": _2, "bale": _2, "baltimore": _2, "barcelona": _2, "baseball": _2, "basel": _2, "baths": _2, "bauern": _2, "beauxarts": _2, "beeldengeluid": _2, "bellevue": _2, "bergbau": _2, "berkeley": _2, "berlin": _2, "bern": _2, "bible": _2, "bilbao": _2, "bill": _2, "birdart": _2, "birthplace": _2, "bonn": _2, "boston": _2, "botanical": _2, "botanicalgarden": _2, "botanicgarden": _2, "botany": _2, "brandywinevalley": _2, "brasil": _2, "bristol": _2, "british": _2, "britishcolumbia": _2, "broadcast": _2, "brunel": _2, "brussel": _2, "brussels": _2, "bruxelles": _2, "building": _2, "burghof": _2, "bus": _2, "bushey": _2, "cadaques": _2, "california": _2, "cambridge": _2, "can": _2, "canada": _2, "capebreton": _2, "carrier": _2, "cartoonart": _2, "casadelamoneda": _2, "castle": _2, "castres": _2, "celtic": _2, "center": _2, "chattanooga": _2, "cheltenham": _2, "chesapeakebay": _2, "chicago": _2, "children": _2, "childrens": _2, "childrensgarden": _2, "chiropractic": _2, "chocolate": _2, "christiansburg": _2, "cincinnati": _2, "cinema": _2, "circus": _2, "civilisation": _2, "civilization": _2, "civilwar": _2, "clinton": _2, "clock": _2, "coal": _2, "coastaldefence": _2, "cody": _2, "coldwar": _2, "collection": _2, "colonialwilliamsburg": _2, "coloradoplateau": _2, "columbia": _2, "columbus": _2, "communication": _2, "communications": _2, "community": _2, "computer": _2, "computerhistory": _2, "xn--comunicaes-v6a2o": _2, "comunicações": _2, "contemporary": _2, "contemporaryart": _2, "convent": _2, "copenhagen": _2, "corporation": _2, "xn--correios-e-telecomunicaes-ghc29a": _2, "correios-e-telecomunicações": _2, "corvette": _2, "costume": _2, "countryestate": _2, "county": _2, "crafts": _2, "cranbrook": _2, "creation": _2, "cultural": _2, "culturalcenter": _2, "culture": _2, "cyber": _2, "cymru": _2, "dali": _2, "dallas": _2, "database": _2, "ddr": _2, "decorativearts": _2, "delaware": _2, "delmenhorst": _2, "denmark": _2, "depot": _2, "design": _2, "detroit": _2, "dinosaur": _2, "discovery": _2, "dolls": _2, "donostia": _2, "durham": _2, "eastafrica": _2, "eastcoast": _2, "education": _2, "educational": _2, "egyptian": _2, "eisenbahn": _2, "elburg": _2, "elvendrell": _2, "embroidery": _2, "encyclopedic": _2, "england": _2, "entomology": _2, "environment": _2, "environmentalconservation": _2, "epilepsy": _2, "essex": _2, "estate": _2, "ethnology": _2, "exeter": _2, "exhibition": _2, "family": _2, "farm": _2, "farmequipment": _2, "farmers": _2, "farmstead": _2, "field": _2, "figueres": _2, "filatelia": _2, "film": _2, "fineart": _2, "finearts": _2, "finland": _2, "flanders": _2, "florida": _2, "force": _2, "fortmissoula": _2, "fortworth": _2, "foundation": _2, "francaise": _2, "frankfurt": _2, "franziskaner": _2, "freemasonry": _2, "freiburg": _2, "fribourg": _2, "frog": _2, "fundacio": _2, "furniture": _2, "gallery": _2, "garden": _2, "gateway": _2, "geelvinck": _2, "gemological": _2, "geology": _2, "georgia": _2, "giessen": _2, "glas": _2, "glass": _2, "gorge": _2, "grandrapids": _2, "graz": _2, "guernsey": _2, "halloffame": _2, "hamburg": _2, "handson": _2, "harvestcelebration": _2, "hawaii": _2, "health": _2, "heimatunduhren": _2, "hellas": _2, "helsinki": _2, "hembygdsforbund": _2, "heritage": _2, "histoire": _2, "historical": _2, "historicalsociety": _2, "historichouses": _2, "historisch": _2, "historisches": _2, "history": _2, "historyofscience": _2, "horology": _2, "house": _2, "humanities": _2, "illustration": _2, "imageandsound": _2, "indian": _2, "indiana": _2, "indianapolis": _2, "indianmarket": _2, "intelligence": _2, "interactive": _2, "iraq": _2, "iron": _2, "isleofman": _2, "jamison": _2, "jefferson": _2, "jerusalem": _2, "jewelry": _2, "jewish": _2, "jewishart": _2, "jfk": _2, "journalism": _2, "judaica": _2, "judygarland": _2, "juedisches": _2, "juif": _2, "karate": _2, "karikatur": _2, "kids": _2, "koebenhavn": _2, "koeln": _2, "kunst": _2, "kunstsammlung": _2, "kunstunddesign": _2, "labor": _2, "labour": _2, "lajolla": _2, "lancashire": _2, "landes": _2, "lans": _2, "xn--lns-qla": _2, "läns": _2, "larsson": _2, "lewismiller": _2, "lincoln": _2, "linz": _2, "living": _2, "livinghistory": _2, "localhistory": _2, "london": _2, "losangeles": _2, "louvre": _2, "loyalist": _2, "lucerne": _2, "luxembourg": _2, "luzern": _2, "mad": _2, "madrid": _2, "mallorca": _2, "manchester": _2, "mansion": _2, "mansions": _2, "manx": _2, "marburg": _2, "maritime": _2, "maritimo": _2, "maryland": _2, "marylhurst": _2, "media": _2, "medical": _2, "medizinhistorisches": _2, "meeres": _2, "memorial": _2, "mesaverde": _2, "michigan": _2, "midatlantic": _2, "military": _2, "mill": _2, "miners": _2, "mining": _2, "minnesota": _2, "missile": _2, "missoula": _2, "modern": _2, "moma": _2, "money": _2, "monmouth": _2, "monticello": _2, "montreal": _2, "moscow": _2, "motorcycle": _2, "muenchen": _2, "muenster": _2, "mulhouse": _2, "muncie": _2, "museet": _2, "museumcenter": _2, "museumvereniging": _2, "music": _2, "national": _2, "nationalfirearms": _2, "nationalheritage": _2, "nativeamerican": _2, "naturalhistory": _2, "naturalhistorymuseum": _2, "naturalsciences": _2, "nature": _2, "naturhistorisches": _2, "natuurwetenschappen": _2, "naumburg": _2, "naval": _2, "nebraska": _2, "neues": _2, "newhampshire": _2, "newjersey": _2, "newmexico": _2, "newport": _2, "newspaper": _2, "newyork": _2, "niepce": _2, "norfolk": _2, "north": _2, "nrw": _2, "nyc": _2, "nyny": _2, "oceanographic": _2, "oceanographique": _2, "omaha": _2, "online": _2, "ontario": _2, "openair": _2, "oregon": _2, "oregontrail": _2, "otago": _2, "oxford": _2, "pacific": _2, "paderborn": _2, "palace": _2, "paleo": _2, "palmsprings": _2, "panama": _2, "paris": _2, "pasadena": _2, "pharmacy": _2, "philadelphia": _2, "philadelphiaarea": _2, "philately": _2, "phoenix": _2, "photography": _2, "pilots": _2, "pittsburgh": _2, "planetarium": _2, "plantation": _2, "plants": _2, "plaza": _2, "portal": _2, "portland": _2, "portlligat": _2, "posts-and-telecommunications": _2, "preservation": _2, "presidio": _2, "press": _2, "project": _2, "public": _2, "pubol": _2, "quebec": _2, "railroad": _2, "railway": _2, "research": _2, "resistance": _2, "riodejaneiro": _2, "rochester": _2, "rockart": _2, "roma": _2, "russia": _2, "saintlouis": _2, "salem": _2, "salvadordali": _2, "salzburg": _2, "sandiego": _2, "sanfrancisco": _2, "santabarbara": _2, "santacruz": _2, "santafe": _2, "saskatchewan": _2, "satx": _2, "savannahga": _2, "schlesisches": _2, "schoenbrunn": _2, "schokoladen": _2, "school": _2, "schweiz": _2, "science": _2, "scienceandhistory": _2, "scienceandindustry": _2, "sciencecenter": _2, "sciencecenters": _2, "science-fiction": _2, "sciencehistory": _2, "sciences": _2, "sciencesnaturelles": _2, "scotland": _2, "seaport": _2, "settlement": _2, "settlers": _2, "shell": _2, "sherbrooke": _2, "sibenik": _2, "silk": _2, "ski": _2, "skole": _2, "society": _2, "sologne": _2, "soundandvision": _2, "southcarolina": _2, "southwest": _2, "space": _2, "spy": _2, "square": _2, "stadt": _2, "stalbans": _2, "starnberg": _2, "state": _2, "stateofdelaware": _2, "station": _2, "steam": _2, "steiermark": _2, "stjohn": _2, "stockholm": _2, "stpetersburg": _2, "stuttgart": _2, "suisse": _2, "surgeonshall": _2, "surrey": _2, "svizzera": _2, "sweden": _2, "sydney": _2, "tank": _2, "tcm": _2, "technology": _2, "telekommunikation": _2, "television": _2, "texas": _2, "textile": _2, "theater": _2, "time": _2, "timekeeping": _2, "topology": _2, "torino": _2, "touch": _2, "town": _2, "transport": _2, "tree": _2, "trolley": _2, "trust": _2, "trustee": _2, "uhren": _2, "ulm": _2, "undersea": _2, "university": _2, "usa": _2, "usantiques": _2, "usarts": _2, "uscountryestate": _2, "usculture": _2, "usdecorativearts": _2, "usgarden": _2, "ushistory": _2, "ushuaia": _2, "uslivinghistory": _2, "utah": _2, "uvic": _2, "valley": _2, "vantaa": _2, "versailles": _2, "viking": _2, "village": _2, "virginia": _2, "virtual": _2, "virtuel": _2, "vlaanderen": _2, "volkenkunde": _2, "wales": _2, "wallonie": _2, "war": _2, "washingtondc": _2, "watchandclock": _2, "watch-and-clock": _2, "western": _2, "westfalen": _2, "whaling": _2, "wildlife": _2, "williamsburg": _2, "windmill": _2, "workshop": _2, "york": _2, "yorkshire": _2, "yosemite": _2, "youth": _2, "zoological": _2, "zoology": _2, "xn--9dbhblg6di": _2, "ירושלים": _2, "xn--h1aegh": _2, "иком": _2 } }, "mv": { "$": 1, "succ": { "aero": _2, "biz": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "museum": _2, "name": _2, "net": _2, "org": _2, "pro": _2 } }, "mw": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "int": _2, "museum": _2, "net": _2, "org": _2 } }, "mx": { "$": 1, "succ": { "com": _2, "org": _2, "gob": _2, "edu": _2, "net": _2, "blogspot": _3 } }, "my": { "$": 1, "succ": { "biz": _2, "com": _2, "edu": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "blogspot": _3 } }, "mz": { "$": 1, "succ": { "ac": _2, "adv": _2, "co": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "na": { "$": 1, "succ": { "info": _2, "pro": _2, "name": _2, "school": _2, "or": _2, "dr": _2, "us": _2, "mx": _2, "ca": _2, "in": _2, "cc": _2, "tv": _2, "ws": _2, "mobi": _2, "co": _2, "com": _2, "org": _2 } }, "name": { "$": 1, "succ": { "her": _33, "his": _33 } }, "nc": { "$": 1, "succ": { "asso": _2, "nom": _2 } }, "ne": _2, "net": { "$": 1, "succ": { "adobeaemcloud": _3, "alwaysdata": _3, "cloudfront": _3, "t3l3p0rt": _3, "appudo": _3, "atlassian-dev": { "$": 0, "succ": { "prod": { "$": 0, "succ": { "cdn": _3 } } } }, "myfritz": _3, "onavstack": _3, "shopselect": _3, "blackbaudcdn": _3, "boomla": _3, "bplaced": _3, "square7": _3, "gb": _3, "hu": _3, "jp": _3, "se": _3, "uk": _3, "in": _3, "clickrising": _3, "cloudaccess": _3, "cdn77-ssl": _3, "cdn77": { "$": 0, "succ": { "r": _3 } }, "feste-ip": _3, "knx-server": _3, "static-access": _3, "cryptonomic": _5, "dattolocal": _3, "mydatto": _3, "debian": _3, "bitbridge": _3, "at-band-camp": _3, "blogdns": _3, "broke-it": _3, "buyshouses": _3, "dnsalias": _3, "dnsdojo": _3, "does-it": _3, "dontexist": _3, "dynalias": _3, "dynathome": _3, "endofinternet": _3, "from-az": _3, "from-co": _3, "from-la": _3, "from-ny": _3, "gets-it": _3, "ham-radio-op": _3, "homeftp": _3, "homeip": _3, "homelinux": _3, "homeunix": _3, "in-the-band": _3, "is-a-chef": _3, "is-a-geek": _3, "isa-geek": _3, "kicks-ass": _3, "office-on-the": _3, "podzone": _3, "scrapper-site": _3, "selfip": _3, "sells-it": _3, "servebbs": _3, "serveftp": _3, "thruhere": _3, "webhop": _3, "definima": _3, "casacam": _3, "dynu": _3, "dynv6": _3, "twmail": _3, "ru": _3, "channelsdvr": { "$": 2, "succ": { "u": _3 } }, "fastlylb": { "$": 2, "succ": { "map": _3 } }, "fastly": { "$": 0, "succ": { "freetls": _3, "map": _3, "prod": { "$": 0, "succ": { "a": _3, "global": _3 } }, "ssl": { "$": 0, "succ": { "a": _3, "b": _3, "global": _3 } } } }, "edgeapp": _3, "flynnhosting": _3, "cdn-edges": _3, "heteml": _3, "cloudfunctions": _3, "moonscale": _3, "in-dsl": _3, "in-vpn": _3, "ipifony": _3, "iobb": _3, "cloudjiffy": { "$": 2, "succ": { "fra1-de": _3, "west1-us": _3 } }, "elastx": { "$": 0, "succ": { "jls-sto1": _3, "jls-sto2": _3, "jls-sto3": _3 } }, "faststacks": _3, "massivegrid": { "$": 0, "succ": { "paas": { "$": 0, "succ": { "fr-1": _3, "lon-1": _3, "lon-2": _3, "ny-1": _3, "ny-2": _3, "sg-1": _3 } } } }, "saveincloud": { "$": 0, "succ": { "jelastic": _3, "nordeste-idc": _3 } }, "scaleforce": _23, "tsukaeru": _24, "kinghost": _3, "uni5": _3, "krellian": _3, "barsy": _3, "memset": _3, "azurewebsites": _3, "azure-mobile": _3, "cloudapp": _3, "azurestaticapps": { "$": 2, "succ": { "1": _3, "centralus": _3, "eastasia": _3, "eastus2": _3, "westeurope": _3, "westus2": _3 } }, "dnsup": _3, "hicam": _3, "now-dns": _3, "ownip": _3, "vpndns": _3, "eating-organic": _3, "mydissent": _3, "myeffect": _3, "mymediapc": _3, "mypsx": _3, "mysecuritycamera": _3, "nhlfan": _3, "no-ip": _3, "pgafan": _3, "privatizehealthinsurance": _3, "bounceme": _3, "ddns": _3, "redirectme": _3, "serveblog": _3, "serveminecraft": _3, "sytes": _3, "cloudycluster": _3, "ovh": { "$": 0, "succ": { "webpaas": _5, "hosting": _5 } }, "bar0": _3, "bar1": _3, "bar2": _3, "rackmaze": _3, "schokokeks": _3, "firewall-gateway": _3, "seidat": _3, "senseering": _3, "siteleaf": _3, "vps-host": { "$": 2, "succ": { "jelastic": { "$": 0, "succ": { "atl": _3, "njs": _3, "ric": _3 } } } }, "myspreadshop": _3, "srcf": { "$": 0, "succ": { "soc": _3, "user": _3 } }, "supabase": _3, "dsmynas": _3, "familyds": _3, "tailscale": { "$": 0, "succ": { "beta": _3 } }, "ts": _3, "torproject": { "$": 2, "succ": { "pages": _3 } }, "reserve-online": _3, "community-pro": _3, "meinforum": _3, "yandexcloud": { "$": 2, "succ": { "storage": _3, "website": _3 } }, "za": _3 } }, "nf": { "$": 1, "succ": { "com": _2, "net": _2, "per": _2, "rec": _2, "web": _2, "arts": _2, "firm": _2, "info": _2, "other": _2, "store": _2 } }, "ng": { "$": 1, "succ": { "com": _6, "edu": _2, "gov": _2, "i": _2, "mil": _2, "mobi": _2, "name": _2, "net": _2, "org": _2, "sch": _2, "col": _3, "firm": _3, "gen": _3, "ltd": _3, "ngo": _3 } }, "ni": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gob": _2, "in": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "web": _2 } }, "nl": { "$": 1, "succ": { "co": _3, "hosting-cluster": _3, "blogspot": _3, "gov": _3, "khplay": _3, "myspreadshop": _3, "transurl": _5, "cistron": _3, "demon": _3 } }, "no": { "$": 1, "succ": { "fhs": _2, "vgs": _2, "fylkesbibl": _2, "folkebibl": _2, "museum": _2, "idrett": _2, "priv": _2, "mil": _2, "stat": _2, "dep": _2, "kommune": _2, "herad": _2, "aa": _34, "ah": _34, "bu": _34, "fm": _34, "hl": _34, "hm": _34, "jan-mayen": _34, "mr": _34, "nl": _34, "nt": _34, "of": _34, "ol": _34, "oslo": _34, "rl": _34, "sf": _34, "st": _34, "svalbard": _34, "tm": _34, "tr": _34, "va": _34, "vf": _34, "akrehamn": _2, "xn--krehamn-dxa": _2, "åkrehamn": _2, "algard": _2, "xn--lgrd-poac": _2, "ålgård": _2, "arna": _2, "brumunddal": _2, "bryne": _2, "bronnoysund": _2, "xn--brnnysund-m8ac": _2, "brønnøysund": _2, "drobak": _2, "xn--drbak-wua": _2, "drøbak": _2, "egersund": _2, "fetsund": _2, "floro": _2, "xn--flor-jra": _2, "florø": _2, "fredrikstad": _2, "hokksund": _2, "honefoss": _2, "xn--hnefoss-q1a": _2, "hønefoss": _2, "jessheim": _2, "jorpeland": _2, "xn--jrpeland-54a": _2, "jørpeland": _2, "kirkenes": _2, "kopervik": _2, "krokstadelva": _2, "langevag": _2, "xn--langevg-jxa": _2, "langevåg": _2, "leirvik": _2, "mjondalen": _2, "xn--mjndalen-64a": _2, "mjøndalen": _2, "mo-i-rana": _2, "mosjoen": _2, "xn--mosjen-eya": _2, "mosjøen": _2, "nesoddtangen": _2, "orkanger": _2, "osoyro": _2, "xn--osyro-wua": _2, "osøyro": _2, "raholt": _2, "xn--rholt-mra": _2, "råholt": _2, "sandnessjoen": _2, "xn--sandnessjen-ogb": _2, "sandnessjøen": _2, "skedsmokorset": _2, "slattum": _2, "spjelkavik": _2, "stathelle": _2, "stavern": _2, "stjordalshalsen": _2, "xn--stjrdalshalsen-sqb": _2, "stjørdalshalsen": _2, "tananger": _2, "tranby": _2, "vossevangen": _2, "afjord": _2, "xn--fjord-lra": _2, "åfjord": _2, "agdenes": _2, "al": _2, "xn--l-1fa": _2, "ål": _2, "alesund": _2, "xn--lesund-hua": _2, "ålesund": _2, "alstahaug": _2, "alta": _2, "xn--lt-liac": _2, "áltá": _2, "alaheadju": _2, "xn--laheadju-7ya": _2, "álaheadju": _2, "alvdal": _2, "amli": _2, "xn--mli-tla": _2, "åmli": _2, "amot": _2, "xn--mot-tla": _2, "åmot": _2, "andebu": _2, "andoy": _2, "xn--andy-ira": _2, "andøy": _2, "andasuolo": _2, "ardal": _2, "xn--rdal-poa": _2, "årdal": _2, "aremark": _2, "arendal": _2, "xn--s-1fa": _2, "ås": _2, "aseral": _2, "xn--seral-lra": _2, "åseral": _2, "asker": _2, "askim": _2, "askvoll": _2, "askoy": _2, "xn--asky-ira": _2, "askøy": _2, "asnes": _2, "xn--snes-poa": _2, "åsnes": _2, "audnedaln": _2, "aukra": _2, "aure": _2, "aurland": _2, "aurskog-holand": _2, "xn--aurskog-hland-jnb": _2, "aurskog-høland": _2, "austevoll": _2, "austrheim": _2, "averoy": _2, "xn--avery-yua": _2, "averøy": _2, "balestrand": _2, "ballangen": _2, "balat": _2, "xn--blt-elab": _2, "bálát": _2, "balsfjord": _2, "bahccavuotna": _2, "xn--bhccavuotna-k7a": _2, "báhccavuotna": _2, "bamble": _2, "bardu": _2, "beardu": _2, "beiarn": _2, "bajddar": _2, "xn--bjddar-pta": _2, "bájddar": _2, "baidar": _2, "xn--bidr-5nac": _2, "báidár": _2, "berg": _2, "bergen": _2, "berlevag": _2, "xn--berlevg-jxa": _2, "berlevåg": _2, "bearalvahki": _2, "xn--bearalvhki-y4a": _2, "bearalváhki": _2, "bindal": _2, "birkenes": _2, "bjarkoy": _2, "xn--bjarky-fya": _2, "bjarkøy": _2, "bjerkreim": _2, "bjugn": _2, "bodo": _2, "xn--bod-2na": _2, "bodø": _2, "badaddja": _2, "xn--bdddj-mrabd": _2, "bådåddjå": _2, "budejju": _2, "bokn": _2, "bremanger": _2, "bronnoy": _2, "xn--brnny-wuac": _2, "brønnøy": _2, "bygland": _2, "bykle": _2, "barum": _2, "xn--brum-voa": _2, "bærum": _2, "telemark": { "$": 0, "succ": { "bo": _2, "xn--b-5ga": _2, "bø": _2 } }, "nordland": { "$": 0, "succ": { "bo": _2, "xn--b-5ga": _2, "bø": _2, "heroy": _2, "xn--hery-ira": _2, "herøy": _2 } }, "bievat": _2, "xn--bievt-0qa": _2, "bievát": _2, "bomlo": _2, "xn--bmlo-gra": _2, "bømlo": _2, "batsfjord": _2, "xn--btsfjord-9za": _2, "båtsfjord": _2, "bahcavuotna": _2, "xn--bhcavuotna-s4a": _2, "báhcavuotna": _2, "dovre": _2, "drammen": _2, "drangedal": _2, "dyroy": _2, "xn--dyry-ira": _2, "dyrøy": _2, "donna": _2, "xn--dnna-gra": _2, "dønna": _2, "eid": _2, "eidfjord": _2, "eidsberg": _2, "eidskog": _2, "eidsvoll": _2, "eigersund": _2, "elverum": _2, "enebakk": _2, "engerdal": _2, "etne": _2, "etnedal": _2, "evenes": _2, "evenassi": _2, "xn--eveni-0qa01ga": _2, "evenášši": _2, "evje-og-hornnes": _2, "farsund": _2, "fauske": _2, "fuossko": _2, "fuoisku": _2, "fedje": _2, "fet": _2, "finnoy": _2, "xn--finny-yua": _2, "finnøy": _2, "fitjar": _2, "fjaler": _2, "fjell": _2, "flakstad": _2, "flatanger": _2, "flekkefjord": _2, "flesberg": _2, "flora": _2, "fla": _2, "xn--fl-zia": _2, "flå": _2, "folldal": _2, "forsand": _2, "fosnes": _2, "frei": _2, "frogn": _2, "froland": _2, "frosta": _2, "frana": _2, "xn--frna-woa": _2, "fræna": _2, "froya": _2, "xn--frya-hra": _2, "frøya": _2, "fusa": _2, "fyresdal": _2, "forde": _2, "xn--frde-gra": _2, "førde": _2, "gamvik": _2, "gangaviika": _2, "xn--ggaviika-8ya47h": _2, "gáŋgaviika": _2, "gaular": _2, "gausdal": _2, "gildeskal": _2, "xn--gildeskl-g0a": _2, "gildeskål": _2, "giske": _2, "gjemnes": _2, "gjerdrum": _2, "gjerstad": _2, "gjesdal": _2, "gjovik": _2, "xn--gjvik-wua": _2, "gjøvik": _2, "gloppen": _2, "gol": _2, "gran": _2, "grane": _2, "granvin": _2, "gratangen": _2, "grimstad": _2, "grong": _2, "kraanghke": _2, "xn--kranghke-b0a": _2, "kråanghke": _2, "grue": _2, "gulen": _2, "hadsel": _2, "halden": _2, "halsa": _2, "hamar": _2, "hamaroy": _2, "habmer": _2, "xn--hbmer-xqa": _2, "hábmer": _2, "hapmir": _2, "xn--hpmir-xqa": _2, "hápmir": _2, "hammerfest": _2, "hammarfeasta": _2, "xn--hmmrfeasta-s4ac": _2, "hámmárfeasta": _2, "haram": _2, "hareid": _2, "harstad": _2, "hasvik": _2, "aknoluokta": _2, "xn--koluokta-7ya57h": _2, "ákŋoluokta": _2, "hattfjelldal": _2, "aarborte": _2, "haugesund": _2, "hemne": _2, "hemnes": _2, "hemsedal": _2, "more-og-romsdal": { "$": 0, "succ": { "heroy": _2, "sande": _2 } }, "xn--mre-og-romsdal-qqb": { "$": 0, "succ": { "xn--hery-ira": _2, "sande": _2 } }, "møre-og-romsdal": { "$": 0, "succ": { "herøy": _2, "sande": _2 } }, "hitra": _2, "hjartdal": _2, "hjelmeland": _2, "hobol": _2, "xn--hobl-ira": _2, "hobøl": _2, "hof": _2, "hol": _2, "hole": _2, "holmestrand": _2, "holtalen": _2, "xn--holtlen-hxa": _2, "holtålen": _2, "hornindal": _2, "horten": _2, "hurdal": _2, "hurum": _2, "hvaler": _2, "hyllestad": _2, "hagebostad": _2, "xn--hgebostad-g3a": _2, "hægebostad": _2, "hoyanger": _2, "xn--hyanger-q1a": _2, "høyanger": _2, "hoylandet": _2, "xn--hylandet-54a": _2, "høylandet": _2, "ha": _2, "xn--h-2fa": _2, "hå": _2, "ibestad": _2, "inderoy": _2, "xn--indery-fya": _2, "inderøy": _2, "iveland": _2, "jevnaker": _2, "jondal": _2, "jolster": _2, "xn--jlster-bya": _2, "jølster": _2, "karasjok": _2, "karasjohka": _2, "xn--krjohka-hwab49j": _2, "kárášjohka": _2, "karlsoy": _2, "galsa": _2, "xn--gls-elac": _2, "gálsá": _2, "karmoy": _2, "xn--karmy-yua": _2, "karmøy": _2, "kautokeino": _2, "guovdageaidnu": _2, "klepp": _2, "klabu": _2, "xn--klbu-woa": _2, "klæbu": _2, "kongsberg": _2, "kongsvinger": _2, "kragero": _2, "xn--krager-gya": _2, "kragerø": _2, "kristiansand": _2, "kristiansund": _2, "krodsherad": _2, "xn--krdsherad-m8a": _2, "krødsherad": _2, "kvalsund": _2, "rahkkeravju": _2, "xn--rhkkervju-01af": _2, "ráhkkerávju": _2, "kvam": _2, "kvinesdal": _2, "kvinnherad": _2, "kviteseid": _2, "kvitsoy": _2, "xn--kvitsy-fya": _2, "kvitsøy": _2, "kvafjord": _2, "xn--kvfjord-nxa": _2, "kvæfjord": _2, "giehtavuoatna": _2, "kvanangen": _2, "xn--kvnangen-k0a": _2, "kvænangen": _2, "navuotna": _2, "xn--nvuotna-hwa": _2, "návuotna": _2, "kafjord": _2, "xn--kfjord-iua": _2, "kåfjord": _2, "gaivuotna": _2, "xn--givuotna-8ya": _2, "gáivuotna": _2, "larvik": _2, "lavangen": _2, "lavagis": _2, "loabat": _2, "xn--loabt-0qa": _2, "loabát": _2, "lebesby": _2, "davvesiida": _2, "leikanger": _2, "leirfjord": _2, "leka": _2, "leksvik": _2, "lenvik": _2, "leangaviika": _2, "xn--leagaviika-52b": _2, "leaŋgaviika": _2, "lesja": _2, "levanger": _2, "lier": _2, "lierne": _2, "lillehammer": _2, "lillesand": _2, "lindesnes": _2, "lindas": _2, "xn--linds-pra": _2, "lindås": _2, "lom": _2, "loppa": _2, "lahppi": _2, "xn--lhppi-xqa": _2, "láhppi": _2, "lund": _2, "lunner": _2, "luroy": _2, "xn--lury-ira": _2, "lurøy": _2, "luster": _2, "lyngdal": _2, "lyngen": _2, "ivgu": _2, "lardal": _2, "lerdal": _2, "xn--lrdal-sra": _2, "lærdal": _2, "lodingen": _2, "xn--ldingen-q1a": _2, "lødingen": _2, "lorenskog": _2, "xn--lrenskog-54a": _2, "lørenskog": _2, "loten": _2, "xn--lten-gra": _2, "løten": _2, "malvik": _2, "masoy": _2, "xn--msy-ula0h": _2, "måsøy": _2, "muosat": _2, "xn--muost-0qa": _2, "muosát": _2, "mandal": _2, "marker": _2, "marnardal": _2, "masfjorden": _2, "meland": _2, "meldal": _2, "melhus": _2, "meloy": _2, "xn--mely-ira": _2, "meløy": _2, "meraker": _2, "xn--merker-kua": _2, "meråker": _2, "moareke": _2, "xn--moreke-jua": _2, "moåreke": _2, "midsund": _2, "midtre-gauldal": _2, "modalen": _2, "modum": _2, "molde": _2, "moskenes": _2, "moss": _2, "mosvik": _2, "malselv": _2, "xn--mlselv-iua": _2, "målselv": _2, "malatvuopmi": _2, "xn--mlatvuopmi-s4a": _2, "málatvuopmi": _2, "namdalseid": _2, "aejrie": _2, "namsos": _2, "namsskogan": _2, "naamesjevuemie": _2, "xn--nmesjevuemie-tcba": _2, "nååmesjevuemie": _2, "laakesvuemie": _2, "nannestad": _2, "narvik": _2, "narviika": _2, "naustdal": _2, "nedre-eiker": _2, "akershus": _35, "buskerud": _35, "nesna": _2, "nesodden": _2, "nesseby": _2, "unjarga": _2, "xn--unjrga-rta": _2, "unjárga": _2, "nesset": _2, "nissedal": _2, "nittedal": _2, "nord-aurdal": _2, "nord-fron": _2, "nord-odal": _2, "norddal": _2, "nordkapp": _2, "davvenjarga": _2, "xn--davvenjrga-y4a": _2, "davvenjárga": _2, "nordre-land": _2, "nordreisa": _2, "raisa": _2, "xn--risa-5na": _2, "ráisa": _2, "nore-og-uvdal": _2, "notodden": _2, "naroy": _2, "xn--nry-yla5g": _2, "nærøy": _2, "notteroy": _2, "xn--nttery-byae": _2, "nøtterøy": _2, "odda": _2, "oksnes": _2, "xn--ksnes-uua": _2, "øksnes": _2, "oppdal": _2, "oppegard": _2, "xn--oppegrd-ixa": _2, "oppegård": _2, "orkdal": _2, "orland": _2, "xn--rland-uua": _2, "ørland": _2, "orskog": _2, "xn--rskog-uua": _2, "ørskog": _2, "orsta": _2, "xn--rsta-fra": _2, "ørsta": _2, "hedmark": { "$": 0, "succ": { "os": _2, "valer": _2, "xn--vler-qoa": _2, "våler": _2 } }, "hordaland": { "$": 0, "succ": { "os": _2 } }, "osen": _2, "osteroy": _2, "xn--ostery-fya": _2, "osterøy": _2, "ostre-toten": _2, "xn--stre-toten-zcb": _2, "østre-toten": _2, "overhalla": _2, "ovre-eiker": _2, "xn--vre-eiker-k8a": _2, "øvre-eiker": _2, "oyer": _2, "xn--yer-zna": _2, "øyer": _2, "oygarden": _2, "xn--ygarden-p1a": _2, "øygarden": _2, "oystre-slidre": _2, "xn--ystre-slidre-ujb": _2, "øystre-slidre": _2, "porsanger": _2, "porsangu": _2, "xn--porsgu-sta26f": _2, "porsáŋgu": _2, "porsgrunn": _2, "radoy": _2, "xn--rady-ira": _2, "radøy": _2, "rakkestad": _2, "rana": _2, "ruovat": _2, "randaberg": _2, "rauma": _2, "rendalen": _2, "rennebu": _2, "rennesoy": _2, "xn--rennesy-v1a": _2, "rennesøy": _2, "rindal": _2, "ringebu": _2, "ringerike": _2, "ringsaker": _2, "rissa": _2, "risor": _2, "xn--risr-ira": _2, "risør": _2, "roan": _2, "rollag": _2, "rygge": _2, "ralingen": _2, "xn--rlingen-mxa": _2, "rælingen": _2, "rodoy": _2, "xn--rdy-0nab": _2, "rødøy": _2, "romskog": _2, "xn--rmskog-bya": _2, "rømskog": _2, "roros": _2, "xn--rros-gra": _2, "røros": _2, "rost": _2, "xn--rst-0na": _2, "røst": _2, "royken": _2, "xn--ryken-vua": _2, "røyken": _2, "royrvik": _2, "xn--ryrvik-bya": _2, "røyrvik": _2, "rade": _2, "xn--rde-ula": _2, "råde": _2, "salangen": _2, "siellak": _2, "saltdal": _2, "salat": _2, "xn--slt-elab": _2, "sálát": _2, "xn--slat-5na": _2, "sálat": _2, "samnanger": _2, "vestfold": { "$": 0, "succ": { "sande": _2 } }, "sandefjord": _2, "sandnes": _2, "sandoy": _2, "xn--sandy-yua": _2, "sandøy": _2, "sarpsborg": _2, "sauda": _2, "sauherad": _2, "sel": _2, "selbu": _2, "selje": _2, "seljord": _2, "sigdal": _2, "siljan": _2, "sirdal": _2, "skaun": _2, "skedsmo": _2, "ski": _2, "skien": _2, "skiptvet": _2, "skjervoy": _2, "xn--skjervy-v1a": _2, "skjervøy": _2, "skierva": _2, "xn--skierv-uta": _2, "skiervá": _2, "skjak": _2, "xn--skjk-soa": _2, "skjåk": _2, "skodje": _2, "skanland": _2, "xn--sknland-fxa": _2, "skånland": _2, "skanit": _2, "xn--sknit-yqa": _2, "skánit": _2, "smola": _2, "xn--smla-hra": _2, "smøla": _2, "snillfjord": _2, "snasa": _2, "xn--snsa-roa": _2, "snåsa": _2, "snoasa": _2, "snaase": _2, "xn--snase-nra": _2, "snåase": _2, "sogndal": _2, "sokndal": _2, "sola": _2, "solund": _2, "songdalen": _2, "sortland": _2, "spydeberg": _2, "stange": _2, "stavanger": _2, "steigen": _2, "steinkjer": _2, "stjordal": _2, "xn--stjrdal-s1a": _2, "stjørdal": _2, "stokke": _2, "stor-elvdal": _2, "stord": _2, "stordal": _2, "storfjord": _2, "omasvuotna": _2, "strand": _2, "stranda": _2, "stryn": _2, "sula": _2, "suldal": _2, "sund": _2, "sunndal": _2, "surnadal": _2, "sveio": _2, "svelvik": _2, "sykkylven": _2, "sogne": _2, "xn--sgne-gra": _2, "søgne": _2, "somna": _2, "xn--smna-gra": _2, "sømna": _2, "sondre-land": _2, "xn--sndre-land-0cb": _2, "søndre-land": _2, "sor-aurdal": _2, "xn--sr-aurdal-l8a": _2, "sør-aurdal": _2, "sor-fron": _2, "xn--sr-fron-q1a": _2, "sør-fron": _2, "sor-odal": _2, "xn--sr-odal-q1a": _2, "sør-odal": _2, "sor-varanger": _2, "xn--sr-varanger-ggb": _2, "sør-varanger": _2, "matta-varjjat": _2, "xn--mtta-vrjjat-k7af": _2, "mátta-várjjat": _2, "sorfold": _2, "xn--srfold-bya": _2, "sørfold": _2, "sorreisa": _2, "xn--srreisa-q1a": _2, "sørreisa": _2, "sorum": _2, "xn--srum-gra": _2, "sørum": _2, "tana": _2, "deatnu": _2, "time": _2, "tingvoll": _2, "tinn": _2, "tjeldsund": _2, "dielddanuorri": _2, "tjome": _2, "xn--tjme-hra": _2, "tjøme": _2, "tokke": _2, "tolga": _2, "torsken": _2, "tranoy": _2, "xn--trany-yua": _2, "tranøy": _2, "tromso": _2, "xn--troms-zua": _2, "tromsø": _2, "tromsa": _2, "romsa": _2, "trondheim": _2, "troandin": _2, "trysil": _2, "trana": _2, "xn--trna-woa": _2, "træna": _2, "trogstad": _2, "xn--trgstad-r1a": _2, "trøgstad": _2, "tvedestrand": _2, "tydal": _2, "tynset": _2, "tysfjord": _2, "divtasvuodna": _2, "divttasvuotna": _2, "tysnes": _2, "tysvar": _2, "xn--tysvr-vra": _2, "tysvær": _2, "tonsberg": _2, "xn--tnsberg-q1a": _2, "tønsberg": _2, "ullensaker": _2, "ullensvang": _2, "ulvik": _2, "utsira": _2, "vadso": _2, "xn--vads-jra": _2, "vadsø": _2, "cahcesuolo": _2, "xn--hcesuolo-7ya35b": _2, "čáhcesuolo": _2, "vaksdal": _2, "valle": _2, "vang": _2, "vanylven": _2, "vardo": _2, "xn--vard-jra": _2, "vardø": _2, "varggat": _2, "xn--vrggt-xqad": _2, "várggát": _2, "vefsn": _2, "vaapste": _2, "vega": _2, "vegarshei": _2, "xn--vegrshei-c0a": _2, "vegårshei": _2, "vennesla": _2, "verdal": _2, "verran": _2, "vestby": _2, "vestnes": _2, "vestre-slidre": _2, "vestre-toten": _2, "vestvagoy": _2, "xn--vestvgy-ixa6o": _2, "vestvågøy": _2, "vevelstad": _2, "vik": _2, "vikna": _2, "vindafjord": _2, "volda": _2, "voss": _2, "varoy": _2, "xn--vry-yla5g": _2, "værøy": _2, "vagan": _2, "xn--vgan-qoa": _2, "vågan": _2, "voagat": _2, "vagsoy": _2, "xn--vgsy-qoa0j": _2, "vågsøy": _2, "vaga": _2, "xn--vg-yiab": _2, "vågå": _2, "ostfold": { "$": 0, "succ": { "valer": _2 } }, "xn--stfold-9xa": { "$": 0, "succ": { "xn--vler-qoa": _2 } }, "østfold": { "$": 0, "succ": { "våler": _2 } }, "co": _3, "blogspot": _3, "myspreadshop": _3 } }, "np": _8, "nr": _30, "nu": { "$": 1, "succ": { "merseine": _3, "mine": _3, "shacknet": _3, "enterprisecloud": _3 } }, "nz": { "$": 1, "succ": { "ac": _2, "co": _6, "cri": _2, "geek": _2, "gen": _2, "govt": _2, "health": _2, "iwi": _2, "kiwi": _2, "maori": _2, "mil": _2, "xn--mori-qsa": _2, "māori": _2, "net": _2, "org": _2, "parliament": _2, "school": _2 } }, "om": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "gov": _2, "med": _2, "museum": _2, "net": _2, "org": _2, "pro": _2 } }, "onion": _2, "org": { "$": 1, "succ": { "altervista": _3, "amune": { "$": 0, "succ": { "tele": _3 } }, "pimienta": _3, "poivron": _3, "potager": _3, "sweetpepper": _3, "ae": _3, "us": _3, "certmgr": _3, "cdn77": { "$": 0, "succ": { "c": _3, "rsc": _3 } }, "cdn77-secure": { "$": 0, "succ": { "origin": { "$": 0, "succ": { "ssl": _3 } } } }, "cloudns": _3, "duckdns": _3, "tunk": _3, "dyndns": { "$": 2, "succ": { "go": _3, "home": _3 } }, "blogdns": _3, "blogsite": _3, "boldlygoingnowhere": _3, "dnsalias": _3, "dnsdojo": _3, "doesntexist": _3, "dontexist": _3, "doomdns": _3, "dvrdns": _3, "dynalias": _3, "endofinternet": _3, "endoftheinternet": _3, "from-me": _3, "game-host": _3, "gotdns": _3, "hobby-site": _3, "homedns": _3, "homeftp": _3, "homelinux": _3, "homeunix": _3, "is-a-bruinsfan": _3, "is-a-candidate": _3, "is-a-celticsfan": _3, "is-a-chef": _3, "is-a-geek": _3, "is-a-knight": _3, "is-a-linux-user": _3, "is-a-patsfan": _3, "is-a-soxfan": _3, "is-found": _3, "is-lost": _3, "is-saved": _3, "is-very-bad": _3, "is-very-evil": _3, "is-very-good": _3, "is-very-nice": _3, "is-very-sweet": _3, "isa-geek": _3, "kicks-ass": _3, "misconfused": _3, "podzone": _3, "readmyblog": _3, "selfip": _3, "sellsyourhome": _3, "servebbs": _3, "serveftp": _3, "servegame": _3, "stuff-4-sale": _3, "webhop": _3, "ddnss": _3, "accesscam": _3, "camdvr": _3, "freeddns": _3, "mywire": _3, "webredirect": _3, "eu": { "$": 2, "succ": { "al": _3, "asso": _3, "at": _3, "au": _3, "be": _3, "bg": _3, "ca": _3, "cd": _3, "ch": _3, "cn": _3, "cy": _3, "cz": _3, "de": _3, "dk": _3, "edu": _3, "ee": _3, "es": _3, "fi": _3, "fr": _3, "gr": _3, "hr": _3, "hu": _3, "ie": _3, "il": _3, "in": _3, "int": _3, "is": _3, "it": _3, "jp": _3, "kr": _3, "lt": _3, "lu": _3, "lv": _3, "mc": _3, "me": _3, "mk": _3, "mt": _3, "my": _3, "net": _3, "ng": _3, "nl": _3, "no": _3, "nz": _3, "paris": _3, "pl": _3, "pt": _3, "q-a": _3, "ro": _3, "ru": _3, "se": _3, "si": _3, "sk": _3, "tr": _3, "uk": _3, "us": _3 } }, "twmail": _3, "fedorainfracloud": _3, "fedorapeople": _3, "fedoraproject": { "$": 0, "succ": { "cloud": _3, "os": _18, "stg": { "$": 0, "succ": { "os": _18 } } } }, "freedesktop": _3, "hepforge": _3, "in-dsl": _3, "in-vpn": _3, "js": _3, "barsy": _3, "mayfirst": _3, "mozilla-iot": _3, "bmoattachments": _3, "dynserv": _3, "now-dns": _3, "cable-modem": _3, "collegefan": _3, "couchpotatofries": _3, "mlbfan": _3, "mysecuritycamera": _3, "nflfan": _3, "read-books": _3, "ufcfan": _3, "hopto": _3, "myftp": _3, "no-ip": _3, "zapto": _3, "httpbin": _3, "pubtls": _3, "my-firewall": _3, "myfirewall": _3, "spdns": _3, "small-web": _3, "dsmynas": _3, "familyds": _3, "teckids": _12, "tuxfamily": _3, "diskstation": _3, "hk": _3, "wmflabs": _3, "toolforge": _3, "wmcloud": _3, "za": _3 } }, "pa": { "$": 1, "succ": { "ac": _2, "gob": _2, "com": _2, "org": _2, "sld": _2, "edu": _2, "net": _2, "ing": _2, "abo": _2, "med": _2, "nom": _2 } }, "pe": { "$": 1, "succ": { "edu": _2, "gob": _2, "nom": _2, "mil": _2, "org": _2, "com": _2, "net": _2, "blogspot": _3 } }, "pf": { "$": 1, "succ": { "com": _2, "org": _2, "edu": _2 } }, "pg": _8, "ph": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "ngo": _2, "mil": _2, "i": _2 } }, "pk": { "$": 1, "succ": { "com": _2, "net": _2, "edu": _2, "org": _2, "fam": _2, "biz": _2, "web": _2, "gov": _2, "gob": _2, "gok": _2, "gon": _2, "gop": _2, "gos": _2, "info": _2 } }, "pl": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "aid": _2, "agro": _2, "atm": _2, "auto": _2, "biz": _2, "edu": _2, "gmina": _2, "gsm": _2, "info": _2, "mail": _2, "miasta": _2, "media": _2, "mil": _2, "nieruchomosci": _2, "nom": _2, "pc": _2, "powiat": _2, "priv": _2, "realestate": _2, "rel": _2, "sex": _2, "shop": _2, "sklep": _2, "sos": _2, "szkola": _2, "targi": _2, "tm": _2, "tourism": _2, "travel": _2, "turystyka": _2, "gov": { "$": 1, "succ": { "ap": _2, "ic": _2, "is": _2, "us": _2, "kmpsp": _2, "kppsp": _2, "kwpsp": _2, "psp": _2, "wskr": _2, "kwp": _2, "mw": _2, "ug": _2, "um": _2, "umig": _2, "ugim": _2, "upow": _2, "uw": _2, "starostwo": _2, "pa": _2, "po": _2, "psse": _2, "pup": _2, "rzgw": _2, "sa": _2, "so": _2, "sr": _2, "wsa": _2, "sko": _2, "uzs": _2, "wiih": _2, "winb": _2, "pinb": _2, "wios": _2, "witd": _2, "wzmiuw": _2, "piw": _2, "wiw": _2, "griw": _2, "wif": _2, "oum": _2, "sdn": _2, "zp": _2, "uppo": _2, "mup": _2, "wuoz": _2, "konsulat": _2, "oirm": _2 } }, "augustow": _2, "babia-gora": _2, "bedzin": _2, "beskidy": _2, "bialowieza": _2, "bialystok": _2, "bielawa": _2, "bieszczady": _2, "boleslawiec": _2, "bydgoszcz": _2, "bytom": _2, "cieszyn": _2, "czeladz": _2, "czest": _2, "dlugoleka": _2, "elblag": _2, "elk": _2, "glogow": _2, "gniezno": _2, "gorlice": _2, "grajewo": _2, "ilawa": _2, "jaworzno": _2, "jelenia-gora": _2, "jgora": _2, "kalisz": _2, "kazimierz-dolny": _2, "karpacz": _2, "kartuzy": _2, "kaszuby": _2, "katowice": _2, "kepno": _2, "ketrzyn": _2, "klodzko": _2, "kobierzyce": _2, "kolobrzeg": _2, "konin": _2, "konskowola": _2, "kutno": _2, "lapy": _2, "lebork": _2, "legnica": _2, "lezajsk": _2, "limanowa": _2, "lomza": _2, "lowicz": _2, "lubin": _2, "lukow": _2, "malbork": _2, "malopolska": _2, "mazowsze": _2, "mazury": _2, "mielec": _2, "mielno": _2, "mragowo": _2, "naklo": _2, "nowaruda": _2, "nysa": _2, "olawa": _2, "olecko": _2, "olkusz": _2, "olsztyn": _2, "opoczno": _2, "opole": _2, "ostroda": _2, "ostroleka": _2, "ostrowiec": _2, "ostrowwlkp": _2, "pila": _2, "pisz": _2, "podhale": _2, "podlasie": _2, "polkowice": _2, "pomorze": _2, "pomorskie": _2, "prochowice": _2, "pruszkow": _2, "przeworsk": _2, "pulawy": _2, "radom": _2, "rawa-maz": _2, "rybnik": _2, "rzeszow": _2, "sanok": _2, "sejny": _2, "slask": _2, "slupsk": _2, "sosnowiec": _2, "stalowa-wola": _2, "skoczow": _2, "starachowice": _2, "stargard": _2, "suwalki": _2, "swidnica": _2, "swiebodzin": _2, "swinoujscie": _2, "szczecin": _2, "szczytno": _2, "tarnobrzeg": _2, "tgory": _2, "turek": _2, "tychy": _2, "ustka": _2, "walbrzych": _2, "warmia": _2, "warszawa": _2, "waw": _2, "wegrow": _2, "wielun": _2, "wlocl": _2, "wloclawek": _2, "wodzislaw": _2, "wolomin": _2, "wroclaw": _2, "zachpomor": _2, "zagan": _2, "zarow": _2, "zgora": _2, "zgorzelec": _2, "beep": _3, "ecommerce-shop": _3, "shoparena": _3, "homesklep": _3, "sdscloud": _3, "unicloud": _3, "krasnik": _3, "leczna": _3, "lubartow": _3, "lublin": _3, "poniatowa": _3, "swidnik": _3, "co": _3, "art": _3, "gliwice": _3, "krakow": _3, "poznan": _3, "wroc": _3, "zakopane": _3, "myspreadshop": _3, "gda": _3, "gdansk": _3, "gdynia": _3, "med": _3, "sopot": _3 } }, "pm": { "$": 1, "succ": { "own": _3, "name": _3 } }, "pn": { "$": 1, "succ": { "gov": _2, "co": _2, "org": _2, "edu": _2, "net": _2 } }, "post": _2, "pr": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "isla": _2, "pro": _2, "biz": _2, "info": _2, "name": _2, "est": _2, "prof": _2, "ac": _2 } }, "pro": { "$": 1, "succ": { "aaa": _2, "aca": _2, "acct": _2, "avocat": _2, "bar": _2, "cpa": _2, "eng": _2, "jur": _2, "law": _2, "med": _2, "recht": _2, "cloudns": _3, "dnstrace": { "$": 0, "succ": { "bci": _3 } }, "barsy": _3 } }, "ps": { "$": 1, "succ": { "edu": _2, "gov": _2, "sec": _2, "plo": _2, "com": _2, "org": _2, "net": _2 } }, "pt": { "$": 1, "succ": { "net": _2, "gov": _2, "org": _2, "edu": _2, "int": _2, "publ": _2, "com": _2, "nome": _2, "blogspot": _3 } }, "pw": { "$": 1, "succ": { "co": _2, "ne": _2, "or": _2, "ed": _2, "go": _2, "belau": _2, "cloudns": _3, "x443": _3 } }, "py": { "$": 1, "succ": { "com": _2, "coop": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "qa": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sch": _2, "blogspot": _3 } }, "re": { "$": 1, "succ": { "asso": _2, "com": _2, "nom": _2, "blogspot": _3 } }, "ro": { "$": 1, "succ": { "arts": _2, "com": _2, "firm": _2, "info": _2, "nom": _2, "nt": _2, "org": _2, "rec": _2, "store": _2, "tm": _2, "www": _2, "co": _3, "shop": _3, "blogspot": _3, "barsy": _3 } }, "rs": { "$": 1, "succ": { "ac": _2, "co": _2, "edu": _2, "gov": _2, "in": _2, "org": _2, "brendly": { "$": 0, "succ": { "shop": _3 } }, "blogspot": _3, "ua": _3, "ox": _3 } }, "ru": { "$": 1, "succ": { "ac": _3, "edu": _3, "gov": _3, "int": _3, "mil": _3, "test": _3, "eurodir": _3, "adygeya": _3, "bashkiria": _3, "bir": _3, "cbg": _3, "com": _3, "dagestan": _3, "grozny": _3, "kalmykia": _3, "kustanai": _3, "marine": _3, "mordovia": _3, "msk": _3, "mytis": _3, "nalchik": _3, "nov": _3, "pyatigorsk": _3, "spb": _3, "vladikavkaz": _3, "vladimir": _3, "blogspot": _3, "na4u": _3, "mircloud": _3, "regruhosting": _24, "myjino": { "$": 2, "succ": { "hosting": _5, "landing": _5, "spectrum": _5, "vps": _5 } }, "cldmail": { "$": 0, "succ": { "hb": _3 } }, "mcdir": { "$": 2, "succ": { "vps": _3 } }, "mcpre": _3, "net": _3, "org": _3, "pp": _3, "lk3": _3, "ras": _3 } }, "rw": { "$": 1, "succ": { "ac": _2, "co": _2, "coop": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "sa": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "med": _2, "pub": _2, "edu": _2, "sch": _2 } }, "sb": _4, "sc": _4, "sd": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "med": _2, "tv": _2, "gov": _2, "info": _2 } }, "se": { "$": 1, "succ": { "a": _2, "ac": _2, "b": _2, "bd": _2, "brand": _2, "c": _2, "d": _2, "e": _2, "f": _2, "fh": _2, "fhsk": _2, "fhv": _2, "g": _2, "h": _2, "i": _2, "k": _2, "komforb": _2, "kommunalforbund": _2, "komvux": _2, "l": _2, "lanbib": _2, "m": _2, "n": _2, "naturbruksgymn": _2, "o": _2, "org": _2, "p": _2, "parti": _2, "pp": _2, "press": _2, "r": _2, "s": _2, "t": _2, "tm": _2, "u": _2, "w": _2, "x": _2, "y": _2, "z": _2, "com": _3, "blogspot": _3, "conf": _3, "iopsys": _3, "itcouldbewor": _3, "myspreadshop": _3, "paba": { "$": 0, "succ": { "su": _3 } } } }, "sg": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "per": _2, "blogspot": _3, "enscaled": _3 } }, "sh": { "$": 1, "succ": { "com": _2, "net": _2, "gov": _2, "org": _2, "mil": _2, "bip": _3, "hashbang": _3, "platform": { "$": 0, "succ": { "bc": _3, "ent": _3, "eu": _3, "us": _3 } }, "now": _3, "vxl": _3, "wedeploy": _3 } }, "si": { "$": 1, "succ": { "gitapp": _3, "gitpage": _3, "blogspot": _3 } }, "sj": _2, "sk": _6, "sl": _4, "sm": _2, "sn": { "$": 1, "succ": { "art": _2, "com": _2, "edu": _2, "gouv": _2, "org": _2, "perso": _2, "univ": _2, "blogspot": _3 } }, "so": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "me": _2, "net": _2, "org": _2, "sch": _3 } }, "sr": _2, "ss": { "$": 1, "succ": { "biz": _2, "com": _2, "edu": _2, "gov": _2, "me": _2, "net": _2, "org": _2, "sch": _2 } }, "st": { "$": 1, "succ": { "co": _2, "com": _2, "consulado": _2, "edu": _2, "embaixada": _2, "mil": _2, "net": _2, "org": _2, "principe": _2, "saotome": _2, "store": _2, "noho": _3 } }, "su": { "$": 1, "succ": { "abkhazia": _3, "adygeya": _3, "aktyubinsk": _3, "arkhangelsk": _3, "armenia": _3, "ashgabad": _3, "azerbaijan": _3, "balashov": _3, "bashkiria": _3, "bryansk": _3, "bukhara": _3, "chimkent": _3, "dagestan": _3, "east-kazakhstan": _3, "exnet": _3, "georgia": _3, "grozny": _3, "ivanovo": _3, "jambyl": _3, "kalmykia": _3, "kaluga": _3, "karacol": _3, "karaganda": _3, "karelia": _3, "khakassia": _3, "krasnodar": _3, "kurgan": _3, "kustanai": _3, "lenug": _3, "mangyshlak": _3, "mordovia": _3, "msk": _3, "murmansk": _3, "nalchik": _3, "navoi": _3, "north-kazakhstan": _3, "nov": _3, "obninsk": _3, "penza": _3, "pokrovsk": _3, "sochi": _3, "spb": _3, "tashkent": _3, "termez": _3, "togliatti": _3, "troitsk": _3, "tselinograd": _3, "tula": _3, "tuva": _3, "vladikavkaz": _3, "vladimir": _3, "vologda": _3 } }, "sv": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "org": _2, "red": _2 } }, "sx": _7, "sy": _29, "sz": { "$": 1, "succ": { "co": _2, "ac": _2, "org": _2 } }, "tc": { "$": 1, "succ": { "ch": _3, "me": _3, "we": _3 } }, "td": _6, "tel": _2, "tf": { "$": 1, "succ": { "sch": _3 } }, "tg": _2, "th": { "$": 1, "succ": { "ac": _2, "co": _2, "go": _2, "in": _2, "mi": _2, "net": _2, "or": _2, "online": _3, "shop": _3 } }, "tj": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "go": _2, "gov": _2, "int": _2, "mil": _2, "name": _2, "net": _2, "nic": _2, "org": _2, "test": _2, "web": _2 } }, "tk": _2, "tl": _7, "tm": { "$": 1, "succ": { "com": _2, "co": _2, "org": _2, "net": _2, "nom": _2, "gov": _2, "mil": _2, "edu": _2 } }, "tn": { "$": 1, "succ": { "com": _2, "ens": _2, "fin": _2, "gov": _2, "ind": _2, "info": _2, "intl": _2, "mincom": _2, "nat": _2, "net": _2, "org": _2, "perso": _2, "tourism": _2, "orangecloud": _3 } }, "to": { "$": 1, "succ": { "611": _3, "com": _2, "gov": _2, "net": _2, "org": _2, "edu": _2, "mil": _2, "oya": _3, "rdv": _3, "vpnplus": _3, "quickconnect": _13, "nyan": _3 } }, "tr": { "$": 1, "succ": { "av": _2, "bbs": _2, "bel": _2, "biz": _2, "com": _6, "dr": _2, "edu": _2, "gen": _2, "gov": _2, "info": _2, "mil": _2, "k12": _2, "kep": _2, "name": _2, "net": _2, "org": _2, "pol": _2, "tel": _2, "tsk": _2, "tv": _2, "web": _2, "nc": _7 } }, "tt": { "$": 1, "succ": { "co": _2, "com": _2, "org": _2, "net": _2, "biz": _2, "info": _2, "pro": _2, "int": _2, "coop": _2, "jobs": _2, "mobi": _2, "travel": _2, "museum": _2, "aero": _2, "name": _2, "gov": _2, "edu": _2 } }, "tv": { "$": 1, "succ": { "dyndns": _3, "better-than": _3, "on-the-web": _3, "worse-than": _3 } }, "tw": { "$": 1, "succ": { "edu": _2, "gov": _2, "mil": _2, "com": { "$": 1, "succ": { "mymailer": _3 } }, "net": _2, "org": _2, "idv": _2, "game": _2, "ebiz": _2, "club": _2, "xn--zf0ao64a": _2, "網路": _2, "xn--uc0atv": _2, "組織": _2, "xn--czrw28b": _2, "商業": _2, "url": _3, "blogspot": _3 } }, "tz": { "$": 1, "succ": { "ac": _2, "co": _2, "go": _2, "hotel": _2, "info": _2, "me": _2, "mil": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2, "tv": _2 } }, "ua": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "in": _2, "net": _2, "org": _2, "cherkassy": _2, "cherkasy": _2, "chernigov": _2, "chernihiv": _2, "chernivtsi": _2, "chernovtsy": _2, "ck": _2, "cn": _2, "cr": _2, "crimea": _2, "cv": _2, "dn": _2, "dnepropetrovsk": _2, "dnipropetrovsk": _2, "donetsk": _2, "dp": _2, "if": _2, "ivano-frankivsk": _2, "kh": _2, "kharkiv": _2, "kharkov": _2, "kherson": _2, "khmelnitskiy": _2, "khmelnytskyi": _2, "kiev": _2, "kirovograd": _2, "km": _2, "kr": _2, "krym": _2, "ks": _2, "kv": _2, "kyiv": _2, "lg": _2, "lt": _2, "lugansk": _2, "lutsk": _2, "lv": _2, "lviv": _2, "mk": _2, "mykolaiv": _2, "nikolaev": _2, "od": _2, "odesa": _2, "odessa": _2, "pl": _2, "poltava": _2, "rivne": _2, "rovno": _2, "rv": _2, "sb": _2, "sebastopol": _2, "sevastopol": _2, "sm": _2, "sumy": _2, "te": _2, "ternopil": _2, "uz": _2, "uzhgorod": _2, "vinnica": _2, "vinnytsia": _2, "vn": _2, "volyn": _2, "yalta": _2, "zaporizhzhe": _2, "zaporizhzhia": _2, "zhitomir": _2, "zhytomyr": _2, "zp": _2, "zt": _2, "cc": _3, "inf": _3, "ltd": _3, "cx": _3, "biz": _3, "co": _3, "pp": _3, "v": _3 } }, "ug": { "$": 1, "succ": { "co": _2, "or": _2, "ac": _2, "sc": _2, "go": _2, "ne": _2, "com": _2, "org": _2, "blogspot": _3 } }, "uk": { "$": 1, "succ": { "ac": _2, "co": { "$": 1, "succ": { "bytemark": { "$": 0, "succ": { "dh": _3, "vm": _3 } }, "blogspot": _3, "layershift": _23, "barsy": _3, "barsyonline": _3, "retrosnub": _28, "nh-serv": _3, "no-ip": _3, "wellbeingzone": _3, "adimo": _3, "myspreadshop": _3, "gwiddle": _3 } }, "gov": { "$": 1, "succ": { "campaign": _3, "service": _3, "api": _3, "homeoffice": _3 } }, "ltd": _2, "me": _2, "net": _2, "nhs": _2, "org": { "$": 1, "succ": { "glug": _3, "lug": _3, "lugs": _3, "affinitylottery": _3, "raffleentry": _3, "weeklylottery": _3 } }, "plc": _2, "police": _2, "sch": _8, "conn": _3, "copro": _3, "hosp": _3, "independent-commission": _3, "independent-inquest": _3, "independent-inquiry": _3, "independent-panel": _3, "independent-review": _3, "public-inquiry": _3, "royal-commission": _3, "pymnt": _3, "barsy": _3 } }, "us": { "$": 1, "succ": { "dni": _2, "fed": _2, "isa": _2, "kids": _2, "nsn": _2, "ak": _36, "al": _36, "ar": _36, "as": _36, "az": _36, "ca": _36, "co": _36, "ct": _36, "dc": _36, "de": { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _3 } }, "fl": _36, "ga": _36, "gu": _36, "hi": _37, "ia": _36, "id": _36, "il": _36, "in": _36, "ks": _36, "ky": _36, "la": _36, "ma": { "$": 1, "succ": { "k12": { "$": 1, "succ": { "pvt": _2, "chtr": _2, "paroch": _2 } }, "cc": _2, "lib": _2 } }, "md": _36, "me": _36, "mi": { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _2, "ann-arbor": _2, "cog": _2, "dst": _2, "eaton": _2, "gen": _2, "mus": _2, "tec": _2, "washtenaw": _2 } }, "mn": _36, "mo": _36, "ms": _36, "mt": _36, "nc": _36, "nd": _37, "ne": _36, "nh": _36, "nj": _36, "nm": _36, "nv": _36, "ny": _36, "oh": _36, "ok": _36, "or": _36, "pa": _36, "pr": _36, "ri": _37, "sc": _36, "sd": _37, "tn": _36, "tx": _36, "ut": _36, "vi": _36, "vt": _36, "va": _36, "wa": _36, "wi": _36, "wv": { "$": 1, "succ": { "cc": _2 } }, "wy": _36, "graphox": _3, "cloudns": _3, "drud": _3, "is-by": _3, "land-4-sale": _3, "stuff-4-sale": _3, "enscaled": { "$": 0, "succ": { "phx": _3 } }, "mircloud": _3, "freeddns": _3, "golffan": _3, "noip": _3, "pointto": _3, "platterp": _3 } }, "uy": { "$": 1, "succ": { "com": _6, "edu": _2, "gub": _2, "mil": _2, "net": _2, "org": _2 } }, "uz": { "$": 1, "succ": { "co": _2, "com": _2, "net": _2, "org": _2 } }, "va": _2, "vc": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "mil": _2, "edu": _2, "gv": { "$": 2, "succ": { "d": _3 } }, "0e": _3 } }, "ve": { "$": 1, "succ": { "arts": _2, "bib": _2, "co": _2, "com": _2, "e12": _2, "edu": _2, "firm": _2, "gob": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "rar": _2, "rec": _2, "store": _2, "tec": _2, "web": _2 } }, "vg": { "$": 1, "succ": { "at": _3 } }, "vi": { "$": 1, "succ": { "co": _2, "com": _2, "k12": _2, "net": _2, "org": _2 } }, "vn": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "int": _2, "ac": _2, "biz": _2, "info": _2, "name": _2, "pro": _2, "health": _2, "blogspot": _3 } }, "vu": { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2, "cn": _3, "blog": _3, "dev": _3, "me": _3 } }, "wf": { "$": 1, "succ": { "biz": _3, "sch": _3 } }, "ws": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "advisor": _5, "cloud66": _3, "dyndns": _3, "mypets": _3 } }, "yt": { "$": 1, "succ": { "org": _3 } }, "xn--mgbaam7a8h": _2, "امارات": _2, "xn--y9a3aq": _2, "հայ": _2, "xn--54b7fta0cc": _2, "বাংলা": _2, "xn--90ae": _2, "бг": _2, "xn--mgbcpq6gpa1a": _2, "البحرين": _2, "xn--90ais": _2, "бел": _2, "xn--fiqs8s": _2, "中国": _2, "xn--fiqz9s": _2, "中國": _2, "xn--lgbbat1ad8j": _2, "الجزائر": _2, "xn--wgbh1c": _2, "مصر": _2, "xn--e1a4c": _2, "ею": _2, "xn--qxa6a": _2, "ευ": _2, "xn--mgbah1a3hjkrd": _2, "موريتانيا": _2, "xn--node": _2, "გე": _2, "xn--qxam": _2, "ελ": _2, "xn--j6w193g": { "$": 1, "succ": { "xn--55qx5d": _2, "xn--wcvs22d": _2, "xn--mxtq1m": _2, "xn--gmqw5a": _2, "xn--od0alg": _2, "xn--uc0atv": _2 } }, "香港": { "$": 1, "succ": { "公司": _2, "教育": _2, "政府": _2, "個人": _2, "網絡": _2, "組織": _2 } }, "xn--2scrj9c": _2, "ಭಾರತ": _2, "xn--3hcrj9c": _2, "ଭାରତ": _2, "xn--45br5cyl": _2, "ভাৰত": _2, "xn--h2breg3eve": _2, "भारतम्": _2, "xn--h2brj9c8c": _2, "भारोत": _2, "xn--mgbgu82a": _2, "ڀارت": _2, "xn--rvc1e0am3e": _2, "ഭാരതം": _2, "xn--h2brj9c": _2, "भारत": _2, "xn--mgbbh1a": _2, "بارت": _2, "xn--mgbbh1a71e": _2, "بھارت": _2, "xn--fpcrj9c3d": _2, "భారత్": _2, "xn--gecrj9c": _2, "ભારત": _2, "xn--s9brj9c": _2, "ਭਾਰਤ": _2, "xn--45brj9c": _2, "ভারত": _2, "xn--xkc2dl3a5ee0h": _2, "இந்தியா": _2, "xn--mgba3a4f16a": _2, "ایران": _2, "xn--mgba3a4fra": _2, "ايران": _2, "xn--mgbtx2b": _2, "عراق": _2, "xn--mgbayh7gpa": _2, "الاردن": _2, "xn--3e0b707e": _2, "한국": _2, "xn--80ao21a": _2, "қаз": _2, "xn--q7ce6a": _2, "ລາວ": _2, "xn--fzc2c9e2c": _2, "ලංකා": _2, "xn--xkc2al3hye2a": _2, "இலங்கை": _2, "xn--mgbc0a9azcg": _2, "المغرب": _2, "xn--d1alf": _2, "мкд": _2, "xn--l1acc": _2, "мон": _2, "xn--mix891f": _2, "澳門": _2, "xn--mix082f": _2, "澳门": _2, "xn--mgbx4cd0ab": _2, "مليسيا": _2, "xn--mgb9awbf": _2, "عمان": _2, "xn--mgbai9azgqp6j": _2, "پاکستان": _2, "xn--mgbai9a5eva00b": _2, "پاكستان": _2, "xn--ygbi2ammx": _2, "فلسطين": _2, "xn--90a3ac": { "$": 1, "succ": { "xn--o1ac": _2, "xn--c1avg": _2, "xn--90azh": _2, "xn--d1at": _2, "xn--o1ach": _2, "xn--80au": _2 } }, "срб": { "$": 1, "succ": { "пр": _2, "орг": _2, "обр": _2, "од": _2, "упр": _2, "ак": _2 } }, "xn--p1ai": _2, "рф": _2, "xn--wgbl6a": _2, "قطر": _2, "xn--mgberp4a5d4ar": _2, "السعودية": _2, "xn--mgberp4a5d4a87g": _2, "السعودیة": _2, "xn--mgbqly7c0a67fbc": _2, "السعودیۃ": _2, "xn--mgbqly7cvafr": _2, "السعوديه": _2, "xn--mgbpl2fh": _2, "سودان": _2, "xn--yfro4i67o": _2, "新加坡": _2, "xn--clchc0ea0b2g2a9gcd": _2, "சிங்கப்பூர்": _2, "xn--ogbpf8fl": _2, "سورية": _2, "xn--mgbtf8fl": _2, "سوريا": _2, "xn--o3cw4h": { "$": 1, "succ": { "xn--12c1fe0br": _2, "xn--12co0c3b4eva": _2, "xn--h3cuzk1di": _2, "xn--o3cyx2a": _2, "xn--m3ch0j3a": _2, "xn--12cfi8ixb8l": _2 } }, "ไทย": { "$": 1, "succ": { "ศึกษา": _2, "ธุรกิจ": _2, "รัฐบาล": _2, "ทหาร": _2, "เน็ต": _2, "องค์กร": _2 } }, "xn--pgbs0dh": _2, "تونس": _2, "xn--kpry57d": _2, "台灣": _2, "xn--kprw13d": _2, "台湾": _2, "xn--nnx388a": _2, "臺灣": _2, "xn--j1amh": _2, "укр": _2, "xn--mgb2ddes": _2, "اليمن": _2, "xxx": _2, "ye": _29, "za": { "$": 0, "succ": { "ac": _2, "agric": _2, "alt": _2, "co": _6, "edu": _2, "gov": _2, "grondar": _2, "law": _2, "mil": _2, "net": _2, "ngo": _2, "nic": _2, "nis": _2, "nom": _2, "org": _2, "school": _2, "tm": _2, "web": _2 } }, "zm": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "mil": _2, "net": _2, "org": _2, "sch": _2 } }, "zw": { "$": 1, "succ": { "ac": _2, "co": _2, "gov": _2, "mil": _2, "org": _2 } }, "aaa": _2, "aarp": _2, "abarth": _2, "abb": _2, "abbott": _2, "abbvie": _2, "abc": _2, "able": _2, "abogado": _2, "abudhabi": _2, "academy": { "$": 1, "succ": { "official": _3 } }, "accenture": _2, "accountant": _2, "accountants": _2, "aco": _2, "actor": _2, "adac": _2, "ads": _2, "adult": _2, "aeg": _2, "aetna": _2, "afl": _2, "africa": _2, "agakhan": _2, "agency": _2, "aig": _2, "airbus": _2, "airforce": _2, "airtel": _2, "akdn": _2, "alfaromeo": _2, "alibaba": _2, "alipay": _2, "allfinanz": _2, "allstate": _2, "ally": _2, "alsace": _2, "alstom": _2, "amazon": _2, "americanexpress": _2, "americanfamily": _2, "amex": _2, "amfam": _2, "amica": _2, "amsterdam": _2, "analytics": _2, "android": _2, "anquan": _2, "anz": _2, "aol": _2, "apartments": _2, "app": { "$": 1, "succ": { "beget": _5, "clerk": _3, "clerkstage": _3, "wnext": _3, "platform0": _3, "deta": _3, "ondigitalocean": _3, "encr": _3, "edgecompute": _3, "fireweb": _3, "onflashdrive": _3, "framer": _3, "run": { "$": 2, "succ": { "a": _3 } }, "web": _3, "hasura": _3, "loginline": _3, "netlify": _3, "developer": _5, "noop": _3, "northflank": _5, "telebit": _3, "typedream": _3, "vercel": _3, "bookonline": _3 } }, "apple": _2, "aquarelle": _2, "arab": _2, "aramco": _2, "archi": _2, "army": _2, "art": _2, "arte": _2, "asda": _2, "associates": _2, "athleta": _2, "attorney": _2, "auction": _2, "audi": _2, "audible": _2, "audio": _2, "auspost": _2, "author": _2, "auto": _2, "autos": _2, "avianca": _2, "aws": _2, "axa": _2, "azure": _2, "baby": _2, "baidu": _2, "banamex": _2, "bananarepublic": _2, "band": _2, "bank": _2, "bar": _2, "barcelona": _2, "barclaycard": _2, "barclays": _2, "barefoot": _2, "bargains": _2, "baseball": _2, "basketball": { "$": 1, "succ": { "aus": _3, "nz": _3 } }, "bauhaus": _2, "bayern": _2, "bbc": _2, "bbt": _2, "bbva": _2, "bcg": _2, "bcn": _2, "beats": _2, "beauty": _2, "beer": _2, "bentley": _2, "berlin": _2, "best": _2, "bestbuy": _2, "bet": _2, "bharti": _2, "bible": _2, "bid": _2, "bike": _2, "bing": _2, "bingo": _2, "bio": _2, "black": _2, "blackfriday": _2, "blockbuster": _2, "blog": _2, "bloomberg": _2, "blue": _2, "bms": _2, "bmw": _2, "bnpparibas": _2, "boats": _2, "boehringer": _2, "bofa": _2, "bom": _2, "bond": _2, "boo": _2, "book": _2, "booking": _2, "bosch": _2, "bostik": _2, "boston": _2, "bot": _2, "boutique": _2, "box": _2, "bradesco": _2, "bridgestone": _2, "broadway": _2, "broker": _2, "brother": _2, "brussels": _2, "bugatti": _2, "build": _2, "builders": { "$": 1, "succ": { "cloudsite": _3 } }, "business": _10, "buy": _2, "buzz": _2, "bzh": _2, "cab": _2, "cafe": _2, "cal": _2, "call": _2, "calvinklein": _2, "cam": _2, "camera": _2, "camp": _2, "cancerresearch": _2, "canon": _2, "capetown": _2, "capital": _2, "capitalone": _2, "car": _2, "caravan": _2, "cards": _2, "care": _2, "career": _2, "careers": _2, "cars": _2, "casa": { "$": 1, "succ": { "nabu": { "$": 0, "succ": { "ui": _3 } } } }, "case": _2, "cash": _2, "casino": _2, "catering": _2, "catholic": _2, "cba": _2, "cbn": _2, "cbre": _2, "cbs": _2, "center": _2, "ceo": _2, "cern": _2, "cfa": _2, "cfd": _2, "chanel": _2, "channel": _2, "charity": _2, "chase": _2, "chat": _2, "cheap": _2, "chintai": _2, "christmas": _2, "chrome": _2, "church": _2, "cipriani": _2, "circle": _2, "cisco": _2, "citadel": _2, "citi": _2, "citic": _2, "city": _2, "cityeats": _2, "claims": _2, "cleaning": _2, "click": _2, "clinic": _2, "clinique": _2, "clothing": _2, "cloud": { "$": 1, "succ": { "banzai": _5, "elementor": _3, "encoway": { "$": 0, "succ": { "eu": _3 } }, "statics": _5, "ravendb": _3, "axarnet": { "$": 0, "succ": { "es-1": _3 } }, "diadem": _3, "jelastic": { "$": 0, "succ": { "vip": _3 } }, "jele": _3, "jenv-aruba": { "$": 0, "succ": { "aruba": { "$": 0, "succ": { "eur": { "$": 0, "succ": { "it1": _3 } } } }, "it1": _3 } }, "keliweb": { "$": 2, "succ": { "cs": _3 } }, "oxa": { "$": 2, "succ": { "tn": _3, "uk": _3 } }, "primetel": { "$": 2, "succ": { "uk": _3 } }, "reclaim": { "$": 0, "succ": { "ca": _3, "uk": _3, "us": _3 } }, "trendhosting": { "$": 0, "succ": { "ch": _3, "de": _3 } }, "jotelulu": _3, "kuleuven": _3, "linkyard": _3, "magentosite": _5, "perspecta": _3, "vapor": _3, "on-rancher": _5, "scw": { "$": 0, "succ": { "baremetal": { "$": 0, "succ": { "fr-par-1": _3, "fr-par-2": _3, "nl-ams-1": _3 } }, "fr-par": { "$": 0, "succ": { "fnc": { "$": 2, "succ": { "functions": _3 } }, "k8s": _11, "s3": _3, "s3-website": _3, "whm": _3 } }, "instances": { "$": 0, "succ": { "priv": _3, "pub": _3 } }, "k8s": _3, "nl-ams": { "$": 0, "succ": { "k8s": _11, "s3": _3, "s3-website": _3, "whm": _3 } }, "pl-waw": { "$": 0, "succ": { "k8s": _11, "s3": _3, "s3-website": _3 } }, "scalebook": _3, "smartlabeling": _3 } }, "sensiosite": _5, "trafficplex": _3, "urown": _3, "voorloper": _3 } }, "club": { "$": 1, "succ": { "cloudns": _3, "jele": _3, "barsy": _3, "pony": _3 } }, "clubmed": _2, "coach": _2, "codes": { "$": 1, "succ": { "owo": _5 } }, "coffee": _2, "college": _2, "cologne": _2, "comcast": _2, "commbank": _2, "community": { "$": 1, "succ": { "nog": _3, "ravendb": _3, "myforum": _3 } }, "company": _2, "compare": _2, "computer": _2, "comsec": _2, "condos": _2, "construction": _2, "consulting": _2, "contact": _2, "contractors": _2, "cooking": _2, "cookingchannel": _2, "cool": { "$": 1, "succ": { "elementor": _3, "de": _3 } }, "corsica": _2, "country": _2, "coupon": _2, "coupons": _2, "courses": _2, "cpa": _2, "credit": _2, "creditcard": _2, "creditunion": _2, "cricket": _2, "crown": _2, "crs": _2, "cruise": _2, "cruises": _2, "cuisinella": _2, "cymru": _2, "cyou": _2, "dabur": _2, "dad": _2, "dance": _2, "data": _2, "date": _2, "dating": _2, "datsun": _2, "day": _2, "dclk": _2, "dds": _2, "deal": _2, "dealer": _2, "deals": _2, "degree": _2, "delivery": _2, "dell": _2, "deloitte": _2, "delta": _2, "democrat": _2, "dental": _2, "dentist": _2, "desi": _2, "design": { "$": 1, "succ": { "bss": _3 } }, "dev": { "$": 1, "succ": { "lcl": _5, "lclstage": _5, "stg": _5, "stgstage": _5, "pages": _3, "workers": _3, "curv": _3, "deno": _3, "deno-staging": _3, "deta": _3, "fly": _3, "githubpreview": _3, "gateway": _5, "iserv": _3, "localcert": { "$": 0, "succ": { "user": _5 } }, "loginline": _3, "mediatech": _3, "platter-app": _3, "shiftcrypto": _3, "vercel": _3, "webhare": _5 } }, "dhl": _2, "diamonds": _2, "diet": _2, "digital": { "$": 1, "succ": { "cloudapps": { "$": 2, "succ": { "london": _3 } } } }, "direct": _2, "directory": _2, "discount": _2, "discover": _2, "dish": _2, "diy": _2, "dnp": _2, "docs": _2, "doctor": _2, "dog": _2, "domains": _2, "dot": _2, "download": _2, "drive": _2, "dtv": _2, "dubai": _2, "dunlop": _2, "dupont": _2, "durban": _2, "dvag": _2, "dvr": _2, "earth": { "$": 1, "succ": { "dapps": { "$": 0, "succ": { "*": _3, "bzz": _5 } } } }, "eat": _2, "eco": _2, "edeka": _2, "education": _10, "email": _2, "emerck": _2, "energy": _2, "engineer": _2, "engineering": _2, "enterprises": _2, "epson": _2, "equipment": _2, "ericsson": _2, "erni": _2, "esq": _2, "estate": { "$": 1, "succ": { "compute": _5 } }, "etisalat": _2, "eurovision": _2, "eus": { "$": 1, "succ": { "party": _25 } }, "events": { "$": 1, "succ": { "koobin": _3, "co": _3 } }, "exchange": _2, "expert": _2, "exposed": _2, "express": _2, "extraspace": _2, "fage": _2, "fail": _2, "fairwinds": _2, "faith": _26, "family": _2, "fan": _2, "fans": _2, "farm": { "$": 1, "succ": { "storj": _3 } }, "farmers": _2, "fashion": { "$": 1, "succ": { "of": _3 } }, "fast": _2, "fedex": _2, "feedback": _2, "ferrari": _2, "ferrero": _2, "fiat": _2, "fidelity": _2, "fido": _2, "film": _2, "final": _2, "finance": _2, "financial": _10, "fire": _2, "firestone": _2, "firmdale": _2, "fish": _2, "fishing": _2, "fit": _2, "fitness": _2, "flickr": _2, "flights": _2, "flir": _2, "florist": _2, "flowers": _2, "fly": _2, "foo": _2, "food": _2, "foodnetwork": _2, "football": _2, "ford": _2, "forex": _2, "forsale": _2, "forum": _2, "foundation": _2, "fox": _2, "free": _2, "fresenius": _2, "frl": _2, "frogans": _2, "frontdoor": _2, "frontier": _2, "ftr": _2, "fujitsu": _2, "fun": _2, "fund": _2, "furniture": _2, "futbol": _2, "fyi": _2, "gal": _2, "gallery": _2, "gallo": _2, "gallup": _2, "game": _2, "games": _2, "gap": _2, "garden": _2, "gay": _2, "gbiz": _2, "gdn": { "$": 1, "succ": { "cnpy": _3 } }, "gea": _2, "gent": _2, "genting": _2, "george": _2, "ggee": _2, "gift": _2, "gifts": _2, "gives": _2, "giving": _2, "glass": _2, "gle": _2, "global": _2, "globo": _2, "gmail": _2, "gmbh": _2, "gmo": _2, "gmx": _2, "godaddy": _2, "gold": _2, "goldpoint": _2, "golf": _2, "goo": _2, "goodyear": _2, "goog": { "$": 1, "succ": { "cloud": _3, "translate": _3, "usercontent": _5 } }, "google": _2, "gop": _2, "got": _2, "grainger": _2, "graphics": _2, "gratis": _2, "green": _2, "gripe": _2, "grocery": _2, "group": { "$": 1, "succ": { "discourse": _3 } }, "guardian": _2, "gucci": _2, "guge": _2, "guide": _2, "guitars": _2, "guru": _2, "hair": _2, "hamburg": _2, "hangout": _2, "haus": _2, "hbo": _2, "hdfc": _2, "hdfcbank": _2, "health": { "$": 1, "succ": { "hra": _3 } }, "healthcare": _2, "help": _2, "helsinki": _2, "here": _2, "hermes": _2, "hgtv": _2, "hiphop": _2, "hisamitsu": _2, "hitachi": _2, "hiv": _2, "hkt": _2, "hockey": _2, "holdings": _2, "holiday": _2, "homedepot": _2, "homegoods": _2, "homes": _2, "homesense": _2, "honda": _2, "horse": _2, "hospital": _2, "host": { "$": 1, "succ": { "cloudaccess": _3, "freesite": _3, "fastvps": _3, "myfast": _3, "tempurl": _3, "wpmudev": _3, "jele": _3, "mircloud": _3, "pcloud": _3, "half": _3 } }, "hosting": { "$": 1, "succ": { "opencraft": _3 } }, "hot": _2, "hoteles": _2, "hotels": _2, "hotmail": _2, "house": _2, "how": _2, "hsbc": _2, "hughes": _2, "hyatt": _2, "hyundai": _2, "ibm": _2, "icbc": _2, "ice": _2, "icu": _2, "ieee": _2, "ifm": _2, "ikano": _2, "imamat": _2, "imdb": _2, "immo": _2, "immobilien": _2, "inc": _2, "industries": _2, "infiniti": _2, "ing": _2, "ink": _2, "institute": _2, "insurance": _2, "insure": _2, "international": _2, "intuit": _2, "investments": _2, "ipiranga": _2, "irish": _2, "ismaili": _2, "ist": _2, "istanbul": _2, "itau": _2, "itv": _2, "jaguar": _2, "java": _2, "jcb": _2, "jeep": _2, "jetzt": _2, "jewelry": _2, "jio": _2, "jll": _2, "jmp": _2, "jnj": _2, "joburg": _2, "jot": _2, "joy": _2, "jpmorgan": _2, "jprs": _2, "juegos": _2, "juniper": _2, "kaufen": _2, "kddi": _2, "kerryhotels": _2, "kerrylogistics": _2, "kerryproperties": _2, "kfh": _2, "kia": _2, "kids": _2, "kim": _2, "kinder": _2, "kindle": _2, "kitchen": _2, "kiwi": _2, "koeln": _2, "komatsu": _2, "kosher": _2, "kpmg": _2, "kpn": _2, "krd": { "$": 1, "succ": { "co": _3, "edu": _3 } }, "kred": _2, "kuokgroup": _2, "kyoto": _2, "lacaixa": _2, "lamborghini": _2, "lamer": _2, "lancaster": _2, "lancia": _2, "land": { "$": 1, "succ": { "static": { "$": 2, "succ": { "dev": _3, "sites": _3 } } } }, "landrover": _2, "lanxess": _2, "lasalle": _2, "lat": _2, "latino": _2, "latrobe": _2, "law": _2, "lawyer": _2, "lds": _2, "lease": _2, "leclerc": _2, "lefrak": _2, "legal": _2, "lego": _2, "lexus": _2, "lgbt": _2, "lidl": _2, "life": _2, "lifeinsurance": _2, "lifestyle": _2, "lighting": _2, "like": _2, "lilly": _2, "limited": _2, "limo": _2, "lincoln": _2, "linde": _2, "link": { "$": 1, "succ": { "cyon": _3, "mypep": _3, "dweb": _5 } }, "lipsy": _2, "live": { "$": 1, "succ": { "hlx": _3 } }, "living": _2, "llc": _2, "llp": _2, "loan": _2, "loans": _2, "locker": _2, "locus": _2, "loft": _2, "lol": { "$": 1, "succ": { "omg": _3 } }, "london": { "$": 1, "succ": { "in": _3, "of": _3 } }, "lotte": _2, "lotto": _2, "love": _2, "lpl": _2, "lplfinancial": _2, "ltd": _2, "ltda": _2, "lundbeck": _2, "luxe": _2, "luxury": _2, "macys": _2, "madrid": _2, "maif": _2, "maison": _2, "makeup": _2, "man": _2, "management": { "$": 1, "succ": { "router": _3 } }, "mango": _2, "map": _2, "market": _2, "marketing": { "$": 1, "succ": { "from": _3, "with": _3 } }, "markets": _2, "marriott": _2, "marshalls": _2, "maserati": _2, "mattel": _2, "mba": _2, "mckinsey": _2, "med": _2, "media": _2, "meet": _2, "melbourne": _2, "meme": _2, "memorial": _2, "men": { "$": 1, "succ": { "for": _3, "repair": _3 } }, "menu": _32, "merckmsd": _2, "miami": _2, "microsoft": _2, "mini": _2, "mint": _2, "mit": _2, "mitsubishi": _2, "mlb": _2, "mls": _2, "mma": _2, "mobile": _2, "moda": _2, "moe": _2, "moi": _2, "mom": { "$": 1, "succ": { "and": _3, "for": _3 } }, "monash": _2, "money": _2, "monster": _2, "mormon": _2, "mortgage": _2, "moscow": _2, "moto": _2, "motorcycles": _2, "mov": _2, "movie": _2, "msd": _2, "mtn": _2, "mtr": _2, "music": _2, "mutual": _2, "nab": _2, "nagoya": _2, "natura": _2, "navy": _2, "nba": _2, "nec": _2, "netbank": _2, "netflix": _2, "network": { "$": 1, "succ": { "alces": _5, "co": _3, "arvo": _3, "azimuth": _3, "tlon": _3 } }, "neustar": _2, "new": _2, "news": { "$": 1, "succ": { "noticeable": _3 } }, "next": _2, "nextdirect": _2, "nexus": _2, "nfl": _2, "ngo": _2, "nhk": _2, "nico": _2, "nike": _2, "nikon": _2, "ninja": _2, "nissan": _2, "nissay": _2, "nokia": _2, "northwesternmutual": _2, "norton": _2, "now": _2, "nowruz": _2, "nowtv": _2, "nra": _2, "nrw": _2, "ntt": _2, "nyc": _2, "obi": _2, "observer": _2, "office": _2, "okinawa": _2, "olayan": _2, "olayangroup": _2, "oldnavy": _2, "ollo": _2, "omega": _2, "one": { "$": 1, "succ": { "onred": { "$": 2, "succ": { "staging": _3 } }, "for": _3, "under": _3, "service": _3, "homelink": _3 } }, "ong": _2, "onl": _2, "online": { "$": 1, "succ": { "eero": _3, "eero-stage": _3, "barsy": _3 } }, "ooo": _2, "open": _2, "oracle": _2, "orange": { "$": 1, "succ": { "tech": _3 } }, "organic": _2, "origins": _2, "osaka": _2, "otsuka": _2, "ott": _2, "ovh": { "$": 1, "succ": { "nerdpol": _3 } }, "page": { "$": 1, "succ": { "hlx": _3, "hlx3": _3, "translated": _3, "codeberg": _3, "pdns": _3, "plesk": _3, "prvcy": _3, "rocky": _3, "magnet": _3 } }, "panasonic": _2, "paris": _2, "pars": _2, "partners": _2, "parts": _2, "party": _26, "passagens": _2, "pay": _2, "pccw": _2, "pet": _2, "pfizer": _2, "pharmacy": _2, "phd": _2, "philips": _2, "phone": _2, "photo": _2, "photography": _2, "photos": _2, "physio": _2, "pics": _2, "pictet": _2, "pictures": { "$": 1, "succ": { "1337": _3 } }, "pid": _2, "pin": _2, "ping": _2, "pink": _2, "pioneer": _2, "pizza": _2, "place": _10, "play": _2, "playstation": _2, "plumbing": _2, "plus": _2, "pnc": _2, "pohl": _2, "poker": _2, "politie": _2, "porn": { "$": 1, "succ": { "indie": _3 } }, "pramerica": _2, "praxi": _2, "press": _2, "prime": _2, "prod": _2, "productions": _2, "prof": _2, "progressive": _2, "promo": _2, "properties": _2, "property": _2, "protection": _2, "pru": _2, "prudential": _2, "pub": _32, "pwc": _2, "qpon": _2, "quebec": _2, "quest": _2, "racing": _2, "radio": _2, "read": _2, "realestate": _2, "realtor": _2, "realty": _2, "recipes": _2, "red": _2, "redstone": _2, "redumbrella": _2, "rehab": _2, "reise": _2, "reisen": _2, "reit": _2, "reliance": _2, "ren": _2, "rent": _2, "rentals": _2, "repair": _2, "report": _2, "republican": _2, "rest": _2, "restaurant": _2, "review": _26, "reviews": _2, "rexroth": _2, "rich": _2, "richardli": _2, "ricoh": _2, "ril": _2, "rio": _2, "rip": { "$": 1, "succ": { "clan": _3 } }, "rocher": _2, "rocks": { "$": 1, "succ": { "myddns": _3, "lima-city": _3, "webspace": _3 } }, "rodeo": _2, "rogers": _2, "room": _2, "rsvp": _2, "rugby": _2, "ruhr": _2, "run": { "$": 1, "succ": { "hs": _3, "development": _3, "ravendb": _3, "servers": _3, "build": _5, "code": _5, "database": _5, "migration": _5, "onporter": _3, "repl": _3 } }, "rwe": _2, "ryukyu": _2, "saarland": _2, "safe": _2, "safety": _2, "sakura": _2, "sale": { "$": 1, "succ": { "for": _3 } }, "salon": _2, "samsclub": _2, "samsung": _2, "sandvik": _2, "sandvikcoromant": _2, "sanofi": _2, "sap": _2, "sarl": _2, "sas": _2, "save": _2, "saxo": _2, "sbi": _2, "sbs": _2, "sca": _2, "scb": _2, "schaeffler": _2, "schmidt": _2, "scholarships": _2, "school": _2, "schule": _2, "schwarz": _2, "science": _26, "scot": { "$": 1, "succ": { "edu": _3, "gov": { "$": 2, "succ": { "service": _3 } } } }, "search": _2, "seat": _2, "secure": _2, "security": _2, "seek": _2, "select": _2, "sener": _2, "services": { "$": 1, "succ": { "loginline": _3 } }, "ses": _2, "seven": _2, "sew": _2, "sex": _2, "sexy": _2, "sfr": _2, "shangrila": _2, "sharp": _2, "shaw": _2, "shell": _2, "shia": _2, "shiksha": _2, "shoes": _2, "shop": { "$": 1, "succ": { "base": _3, "hoplix": _3, "barsy": _3 } }, "shopping": _2, "shouji": _2, "show": _2, "showtime": _2, "silk": _2, "sina": _2, "singles": _2, "site": { "$": 1, "succ": { "cloudera": _5, "cyon": _3, "fnwk": _3, "folionetwork": _3, "fastvps": _3, "jele": _3, "lelux": _3, "loginline": _3, "barsy": _3, "mintere": _3, "omniwe": _3, "opensocial": _3, "platformsh": _5, "tst": _5, "byen": _3, "srht": _3, "novecore": _3 } }, "ski": _2, "skin": _2, "sky": _2, "skype": _2, "sling": _2, "smart": _2, "smile": _2, "sncf": _2, "soccer": _2, "social": _2, "softbank": _2, "software": _2, "sohu": _2, "solar": _2, "solutions": { "$": 1, "succ": { "diher": _5 } }, "song": _2, "sony": _2, "soy": _2, "spa": _2, "space": { "$": 1, "succ": { "myfast": _3, "uber": _3, "xs4all": _3 } }, "sport": _2, "spot": _2, "srl": _2, "stada": _2, "staples": _2, "star": _2, "statebank": _2, "statefarm": _2, "stc": _2, "stcgroup": _2, "stockholm": _2, "storage": _2, "store": { "$": 1, "succ": { "sellfy": _3, "shopware": _3, "storebase": _3 } }, "stream": _2, "studio": _2, "study": _2, "style": _2, "sucks": _2, "supplies": _2, "supply": _2, "support": _32, "surf": _2, "surgery": _2, "suzuki": _2, "swatch": _2, "swiss": _2, "sydney": _2, "systems": { "$": 1, "succ": { "knightpoint": _3 } }, "tab": _2, "taipei": _2, "talk": _2, "taobao": _2, "target": _2, "tatamotors": _2, "tatar": _2, "tattoo": _2, "tax": _2, "taxi": _2, "tci": _2, "tdk": _2, "team": { "$": 1, "succ": { "discourse": _3, "jelastic": _3 } }, "tech": _2, "technology": _10, "temasek": _2, "tennis": _2, "teva": _2, "thd": _2, "theater": _2, "theatre": _2, "tiaa": _2, "tickets": _2, "tienda": _2, "tiffany": _2, "tips": _2, "tires": _2, "tirol": _2, "tjmaxx": _2, "tjx": _2, "tkmaxx": _2, "tmall": _2, "today": { "$": 1, "succ": { "prequalifyme": _3 } }, "tokyo": _2, "tools": _2, "top": { "$": 1, "succ": { "now-dns": _3, "ntdll": _3 } }, "toray": _2, "toshiba": _2, "total": _2, "tours": _2, "town": _2, "toyota": _2, "toys": _2, "trade": _26, "trading": _2, "training": _2, "travel": _2, "travelchannel": _2, "travelers": _2, "travelersinsurance": _2, "trust": _2, "trv": _2, "tube": _2, "tui": _2, "tunes": _2, "tushu": _2, "tvs": _2, "ubank": _2, "ubs": _2, "unicom": _2, "university": _2, "uno": _2, "uol": _2, "ups": _2, "vacations": _2, "vana": _2, "vanguard": _2, "vegas": _2, "ventures": _2, "verisign": _2, "versicherung": _2, "vet": _2, "viajes": _2, "video": _2, "vig": _2, "viking": _2, "villas": _2, "vin": _2, "vip": _2, "virgin": _2, "visa": _2, "vision": _2, "viva": _2, "vivo": _2, "vlaanderen": _2, "vodka": _2, "volkswagen": _2, "volvo": _2, "vote": _2, "voting": _2, "voto": _2, "voyage": _2, "vuelos": _2, "wales": _2, "walmart": _2, "walter": _2, "wang": _2, "wanggou": _2, "watch": _2, "watches": _2, "weather": _2, "weatherchannel": _2, "webcam": _2, "weber": _2, "website": _2, "wedding": _2, "weibo": _2, "weir": _2, "whoswho": _2, "wien": _2, "wiki": _2, "williamhill": _2, "win": { "$": 1, "succ": { "that": _3 } }, "windows": _2, "wine": _2, "winners": _2, "wme": _2, "wolterskluwer": _2, "woodside": _2, "work": { "$": 1, "succ": { "from": _3, "to": _3 } }, "works": _2, "world": _2, "wow": _2, "wtc": _2, "wtf": _2, "xbox": _2, "xerox": _2, "xfinity": _2, "xihuan": _2, "xin": _2, "xn--11b4c3d": _2, "कॉम": _2, "xn--1ck2e1b": _2, "セール": _2, "xn--1qqw23a": _2, "佛山": _2, "xn--30rr7y": _2, "慈善": _2, "xn--3bst00m": _2, "集团": _2, "xn--3ds443g": _2, "在线": _2, "xn--3pxu8k": _2, "点看": _2, "xn--42c2d9a": _2, "คอม": _2, "xn--45q11c": _2, "八卦": _2, "xn--4gbrim": _2, "موقع": _2, "xn--55qw42g": _2, "公益": _2, "xn--55qx5d": _2, "公司": _2, "xn--5su34j936bgsg": _2, "香格里拉": _2, "xn--5tzm5g": _2, "网站": _2, "xn--6frz82g": _2, "移动": _2, "xn--6qq986b3xl": _2, "我爱你": _2, "xn--80adxhks": _2, "москва": _2, "xn--80aqecdr1a": _2, "католик": _2, "xn--80asehdb": _2, "онлайн": _2, "xn--80aswg": _2, "сайт": _2, "xn--8y0a063a": _2, "联通": _2, "xn--9dbq2a": _2, "קום": _2, "xn--9et52u": _2, "时尚": _2, "xn--9krt00a": _2, "微博": _2, "xn--b4w605ferd": _2, "淡马锡": _2, "xn--bck1b9a5dre4c": _2, "ファッション": _2, "xn--c1avg": _2, "орг": _2, "xn--c2br7g": _2, "नेट": _2, "xn--cck2b3b": _2, "ストア": _2, "xn--cckwcxetd": _2, "アマゾン": _2, "xn--cg4bki": _2, "삼성": _2, "xn--czr694b": _2, "商标": _2, "xn--czrs0t": _2, "商店": _2, "xn--czru2d": _2, "商城": _2, "xn--d1acj3b": _2, "дети": _2, "xn--eckvdtc9d": _2, "ポイント": _2, "xn--efvy88h": _2, "新闻": _2, "xn--fct429k": _2, "家電": _2, "xn--fhbei": _2, "كوم": _2, "xn--fiq228c5hs": _2, "中文网": _2, "xn--fiq64b": _2, "中信": _2, "xn--fjq720a": _2, "娱乐": _2, "xn--flw351e": _2, "谷歌": _2, "xn--fzys8d69uvgm": _2, "電訊盈科": _2, "xn--g2xx48c": _2, "购物": _2, "xn--gckr3f0f": _2, "クラウド": _2, "xn--gk3at1e": _2, "通販": _2, "xn--hxt814e": _2, "网店": _2, "xn--i1b6b1a6a2e": _2, "संगठन": _2, "xn--imr513n": _2, "餐厅": _2, "xn--io0a7i": _2, "网络": _2, "xn--j1aef": _2, "ком": _2, "xn--jlq480n2rg": _2, "亚马逊": _2, "xn--jlq61u9w7b": _2, "诺基亚": _2, "xn--jvr189m": _2, "食品": _2, "xn--kcrx77d1x4a": _2, "飞利浦": _2, "xn--kput3i": _2, "手机": _2, "xn--mgba3a3ejt": _2, "ارامكو": _2, "xn--mgba7c0bbn0a": _2, "العليان": _2, "xn--mgbaakc7dvf": _2, "اتصالات": _2, "xn--mgbab2bd": _2, "بازار": _2, "xn--mgbca7dzdo": _2, "ابوظبي": _2, "xn--mgbi4ecexp": _2, "كاثوليك": _2, "xn--mgbt3dhd": _2, "همراه": _2, "xn--mk1bu44c": _2, "닷컴": _2, "xn--mxtq1m": _2, "政府": _2, "xn--ngbc5azd": _2, "شبكة": _2, "xn--ngbe9e0a": _2, "بيتك": _2, "xn--ngbrx": _2, "عرب": _2, "xn--nqv7f": _2, "机构": _2, "xn--nqv7fs00ema": _2, "组织机构": _2, "xn--nyqy26a": _2, "健康": _2, "xn--otu796d": _2, "招聘": _2, "xn--p1acf": { "$": 1, "succ": { "xn--90amc": _3, "xn--j1aef": _3, "xn--j1ael8b": _3, "xn--h1ahn": _3, "xn--j1adp": _3, "xn--c1avg": _3, "xn--80aaa0cvac": _3, "xn--h1aliz": _3, "xn--90a1af": _3, "xn--41a": _3 } }, "рус": { "$": 1, "succ": { "биз": _3, "ком": _3, "крым": _3, "мир": _3, "мск": _3, "орг": _3, "самара": _3, "сочи": _3, "спб": _3, "я": _3 } }, "xn--pssy2u": _2, "大拿": _2, "xn--q9jyb4c": _2, "みんな": _2, "xn--qcka1pmc": _2, "グーグル": _2, "xn--rhqv96g": _2, "世界": _2, "xn--rovu88b": _2, "書籍": _2, "xn--ses554g": _2, "网址": _2, "xn--t60b56a": _2, "닷넷": _2, "xn--tckwe": _2, "コム": _2, "xn--tiq49xqyj": _2, "天主教": _2, "xn--unup4y": _2, "游戏": _2, "xn--vermgensberater-ctb": _2, "vermögensberater": _2, "xn--vermgensberatung-pwb": _2, "vermögensberatung": _2, "xn--vhquv": _2, "企业": _2, "xn--vuq861b": _2, "信息": _2, "xn--w4r85el8fhu5dnra": _2, "嘉里大酒店": _2, "xn--w4rs40l": _2, "嘉里": _2, "xn--xhq521b": _2, "广东": _2, "xn--zfr164b": _2, "政务": _2, "xyz": { "$": 1, "succ": { "blogsite": _3, "localzone": _3, "crafting": _3, "zapto": _3, "telebit": _5 } }, "yachts": _2, "yahoo": _2, "yamaxun": _2, "yandex": _2, "yodobashi": _2, "yoga": _2, "yokohama": _2, "you": _2, "youtube": _2, "yun": _2, "zappos": _2, "zara": _2, "zero": _2, "zip": _2, "zone": { "$": 1, "succ": { "cloud66": _3, "hs": _3, "triton": _5, "lima": _3 } }, "zuerich": _2 } };
      return rules;
  })();

  /**
   * Lookup parts of domain in Trie
   */
  function lookupInTrie(parts, trie, index, allowedMask) {
      let result = null;
      let node = trie;
      while (node !== undefined) {
          // We have a match!
          if ((node.$ & allowedMask) !== 0) {
              result = {
                  index: index + 1,
                  isIcann: node.$ === 1 /* ICANN */,
                  isPrivate: node.$ === 2 /* PRIVATE */,
              };
          }
          // No more `parts` to look for
          if (index === -1) {
              break;
          }
          const succ = node.succ;
          node = succ && (succ[parts[index]] || succ['*']);
          index -= 1;
      }
      return result;
  }
  /**
   * Check if `hostname` has a valid public suffix in `trie`.
   */
  function suffixLookup(hostname, options, out) {
      if (fastPathLookup(hostname, options, out) === true) {
          return;
      }
      const hostnameParts = hostname.split('.');
      const allowedMask = (options.allowPrivateDomains === true ? 2 /* PRIVATE */ : 0) |
          (options.allowIcannDomains === true ? 1 /* ICANN */ : 0);
      // Look for exceptions
      const exceptionMatch = lookupInTrie(hostnameParts, exceptions$1, hostnameParts.length - 1, allowedMask);
      if (exceptionMatch !== null) {
          out.isIcann = exceptionMatch.isIcann;
          out.isPrivate = exceptionMatch.isPrivate;
          out.publicSuffix = hostnameParts.slice(exceptionMatch.index + 1).join('.');
          return;
      }
      // Look for a match in rules
      const rulesMatch = lookupInTrie(hostnameParts, rules, hostnameParts.length - 1, allowedMask);
      if (rulesMatch !== null) {
          out.isIcann = rulesMatch.isIcann;
          out.isPrivate = rulesMatch.isPrivate;
          out.publicSuffix = hostnameParts.slice(rulesMatch.index).join('.');
          return;
      }
      // No match found...
      // Prevailing rule is '*' so we consider the top-level domain to be the
      // public suffix of `hostname` (e.g.: 'example.org' => 'org').
      out.isIcann = false;
      out.isPrivate = false;
      out.publicSuffix = hostnameParts[hostnameParts.length - 1];
  }

  // For all methods but 'parse', it does not make sense to allocate an object
  // every single time to only return the value of a specific attribute. To avoid
  // this un-necessary allocation, we use a global object which is re-used.
  const RESULT = getEmptyResult();
  function parse(url, options = {}) {
      return parseImpl(url, 5 /* ALL */, suffixLookup, options, getEmptyResult());
  }
  function getHostname(url, options = {}) {
      /*@__INLINE__*/ resetResult(RESULT);
      return parseImpl(url, 0 /* HOSTNAME */, suffixLookup, options, RESULT).hostname;
  }
  function getPublicSuffix(url, options = {}) {
      /*@__INLINE__*/ resetResult(RESULT);
      return parseImpl(url, 2 /* PUBLIC_SUFFIX */, suffixLookup, options, RESULT)
          .publicSuffix;
  }
  function getDomain(url, options = {}) {
      /*@__INLINE__*/ resetResult(RESULT);
      return parseImpl(url, 3 /* DOMAIN */, suffixLookup, options, RESULT).domain;
  }
  function getSubdomain(url, options = {}) {
      /*@__INLINE__*/ resetResult(RESULT);
      return parseImpl(url, 4 /* SUB_DOMAIN */, suffixLookup, options, RESULT)
          .subdomain;
  }
  function getDomainWithoutSuffix(url, options = {}) {
      /*@__INLINE__*/ resetResult(RESULT);
      return parseImpl(url, 5 /* ALL */, suffixLookup, options, RESULT)
          .domainWithoutSuffix;
  }

  tldts.getDomain = getDomain;
  tldts.getDomainWithoutSuffix = getDomainWithoutSuffix;
  tldts.getHostname = getHostname;
  tldts.getPublicSuffix = getPublicSuffix;
  tldts.getSubdomain = getSubdomain;
  var parse_1 = tldts.parse = parse;

  /* eslint-disable quote-props */
  /* eslint-disable quotes */
  /* eslint-disable indent */
  /* eslint-disable eol-last */
  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-multiple-empty-lines */
      const entities = {
    "cdn77.org": "DataCamp Limited",
    "datacamp.com": "DataCamp Limited",
    "rdocumentation.org": "DataCamp Limited",
    "biologydiscussion.com": "StackPath, LLC",
    "bootstrapcdn.com": "StackPath, LLC",
    "forumfoundry.com": "StackPath, LLC",
    "hwcdn.net": "StackPath, LLC",
    "maxcdn-edge.com": "StackPath, LLC",
    "maxcdn.com": "StackPath, LLC",
    "netdna-cdn.com": "StackPath, LLC",
    "netdna-ssl.com": "StackPath, LLC",
    "netdna.com": "StackPath, LLC",
    "santabanta.com": "StackPath, LLC",
    "stackpathcdn.com": "StackPath, LLC",
    "stackpathdns.com": "StackPath, LLC",
    "vid2play.com": "StackPath, LLC",
    "yibada.com": "StackPath, LLC",
    "1dmp.io": "CleverDATA LLC",
    "1rx.io": "RhythmOne",
    "allmovie.com": "RhythmOne",
    "allmusic.com": "RhythmOne",
    "burstnet.com": "RhythmOne",
    "gwallet.com": "RhythmOne",
    "po.st": "RhythmOne",
    "rhythmone.com": "RhythmOne",
    "sidereel.com": "RhythmOne",
    "yume.com": "RhythmOne",
    "yumenetworks.com": "RhythmOne",
    "fastly-insights.com": "Fastly, Inc.",
    "fastly.com": "Fastly, Inc.",
    "fastly.net": "Fastly, Inc.",
    "fastlylabs.com": "Fastly, Inc.",
    "2020mustang.com": "ICF Technology, Inc",
    "air2s.com": "ICF Technology, Inc",
    "camfapr.com": "ICF Technology, Inc",
    "camonster.com": "ICF Technology, Inc",
    "curvywebcam.com": "ICF Technology, Inc",
    "eroxialive.com": "ICF Technology, Inc",
    "extremetubemate.com": "ICF Technology, Inc",
    "icfcdn.com": "ICF Technology, Inc",
    "jerkmatelive.com": "ICF Technology, Inc",
    "livehotty.com": "ICF Technology, Inc",
    "naiadsystems.com": "ICF Technology, Inc",
    "nsimg.net": "ICF Technology, Inc",
    "outster.com": "ICF Technology, Inc",
    "porntubelivesex.com": "ICF Technology, Inc",
    "primecurveslive.com": "ICF Technology, Inc",
    "sancdn.net": "ICF Technology, Inc",
    "sexad.net": "ICF Technology, Inc",
    "sextracker.com": "ICF Technology, Inc",
    "shesfreakylive.com": "ICF Technology, Inc",
    "solidcams.com": "ICF Technology, Inc",
    "spankwirecams.com": "ICF Technology, Inc",
    "streamate.com": "ICF Technology, Inc",
    "teeniecamgirls.com": "ICF Technology, Inc",
    "wannawatchme.com": "ICF Technology, Inc",
    "xromp.com": "ICF Technology, Inc",
    "xxxcounter.com": "ICF Technology, Inc",
    "youjizzlive.com": "ICF Technology, Inc",
    "0m66lx69dx.com": "Google LLC",
    "1e100cdn.net": "Google LLC",
    "1emn.com": "Google LLC",
    "1enm.com": "Google LLC",
    "2enm.com": "Google LLC",
    "2mdn.net": "Google LLC",
    "8d1f.com": "Google LLC",
    "accurateshooter.net": "Google LLC",
    "adgoogle.net": "Google LLC",
    "admeld.com": "Google LLC",
    "admob.com": "Google LLC",
    "adsense.com": "Google LLC",
    "advertisercommunity.com": "Google LLC",
    "advertiserscommunity.com": "Google LLC",
    "adwords-community.com": "Google LLC",
    "adwordsexpress.com": "Google LLC",
    "ai.google": "Google LLC",
    "alooma.com": "Google LLC",
    "ampproject.net": "Google LLC",
    "ampproject.org": "Google LLC",
    "android.com": "Google LLC",
    "angulardart.org": "Google LLC",
    "anvato.net": "Google LLC",
    "api.ai": "Google LLC",
    "apigee.net": "Google LLC",
    "app-measurement.com": "Google LLC",
    "appbridge.ca": "Google LLC",
    "appbridge.io": "Google LLC",
    "appbridge.it": "Google LLC",
    "appspot.com": "Google LLC",
    "apture.com": "Google LLC",
    "area120.com": "Google LLC",
    "asp-cc.com": "Google LLC",
    "bandpage.com": "Google LLC",
    "baselinestudy.com": "Google LLC",
    "baselinestudy.org": "Google LLC",
    "bazel.build": "Google LLC",
    "beatthatquote.com": "Google LLC",
    "blink.org": "Google LLC",
    "blog.google": "Google LLC",
    "blogblog.com": "Google LLC",
    "blogger.com": "Google LLC",
    "blogspot.com": "Google LLC",
    "brotli.org": "Google LLC",
    "bumpshare.com": "Google LLC",
    "bumptop.ca": "Google LLC",
    "bumptop.com": "Google LLC",
    "bumptop.net": "Google LLC",
    "bumptop.org": "Google LLC",
    "bumptunes.com": "Google LLC",
    "campuslondon.com": "Google LLC",
    "cc-dt.com": "Google LLC",
    "certificate-transparency.org": "Google LLC",
    "chrome.com": "Google LLC",
    "chromecast.com": "Google LLC",
    "chromeexperiments.com": "Google LLC",
    "chromium.org": "Google LLC",
    "cloudburstresearch.com": "Google LLC",
    "cloudfunctions.net": "Google LLC",
    "cloudrobotics.com": "Google LLC",
    "conscrypt.com": "Google LLC",
    "conscrypt.org": "Google LLC",
    "cookiechoices.org": "Google LLC",
    "coova.com": "Google LLC",
    "coova.net": "Google LLC",
    "coova.org": "Google LLC",
    "crashlytics.com": "Google LLC",
    "crr.com": "Google LLC",
    "cs4hs.com": "Google LLC",
    "dartlang.org": "Google LLC",
    "dartpad.dev": "Google LLC",
    "dartsearch.net": "Google LLC",
    "debug.com": "Google LLC",
    "debugproject.com": "Google LLC",
    "design.google": "Google LLC",
    "dialogflow.com": "Google LLC",
    "dmtry.com": "Google LLC",
    "domains.google": "Google LLC",
    "doubleclick.com": "Google LLC",
    "doubleclick.net": "Google LLC",
    "doubleclickusercontent.com": "Google LLC",
    "e0mn.com": "Google LLC",
    "elections.google": "Google LLC",
    "em0n.com": "Google LLC",
    "emn0.com": "Google LLC",
    "environment.google": "Google LLC",
    "episodic.com": "Google LLC",
    "fabric.io": "Google LLC",
    "fastlane.tools": "Google LLC",
    "feedburner.com": "Google LLC",
    "fflick.com": "Google LLC",
    "financeleadsonline.com": "Google LLC",
    "firebase.com": "Google LLC",
    "firebaseapp.com": "Google LLC",
    "firebaseio.com": "Google LLC",
    "flutter.io": "Google LLC",
    "flutterapp.com": "Google LLC",
    "forms.gle": "Google LLC",
    "g-tun.com": "Google LLC",
    "g.co": "Google LLC",
    "gerritcodereview.com": "Google LLC",
    "getbumptop.com": "Google LLC",
    "getmdl.io": "Google LLC",
    "ggpht.cn": "Google LLC",
    "ggpht.com": "Google LLC",
    "gipscorp.com": "Google LLC",
    "gkecnapps.cn": "Google LLC",
    "globaledu.org": "Google LLC",
    "gmail.com": "Google LLC",
    "gmodules.com": "Google LLC",
    "godoc.org": "Google LLC",
    "golang.org": "Google LLC",
    "gonglchuangl.net": "Google LLC",
    "goo.gl": "Google LLC",
    "google-analytics.com": "Google LLC",
    "google.ac": "Google LLC",
    "google.ad": "Google LLC",
    "google.ae": "Google LLC",
    "google.af": "Google LLC",
    "google.ag": "Google LLC",
    "google.ai": "Google LLC",
    "google.al": "Google LLC",
    "google.am": "Google LLC",
    "google.as": "Google LLC",
    "google.at": "Google LLC",
    "google.az": "Google LLC",
    "google.ba": "Google LLC",
    "google.be": "Google LLC",
    "google.berlin": "Google LLC",
    "google.bf": "Google LLC",
    "google.bg": "Google LLC",
    "google.bi": "Google LLC",
    "google.bj": "Google LLC",
    "google.bs": "Google LLC",
    "google.bt": "Google LLC",
    "google.by": "Google LLC",
    "google.ca": "Google LLC",
    "google.cat": "Google LLC",
    "google.cc": "Google LLC",
    "google.cd": "Google LLC",
    "google.cf": "Google LLC",
    "google.cg": "Google LLC",
    "google.ch": "Google LLC",
    "google.ci": "Google LLC",
    "google.cl": "Google LLC",
    "google.cm": "Google LLC",
    "google.cn": "Google LLC",
    "google.co.ao": "Google LLC",
    "google.co.bw": "Google LLC",
    "google.co.ck": "Google LLC",
    "google.co.cr": "Google LLC",
    "google.co.hu": "Google LLC",
    "google.co.id": "Google LLC",
    "google.co.il": "Google LLC",
    "google.co.im": "Google LLC",
    "google.co.in": "Google LLC",
    "google.co.je": "Google LLC",
    "google.co.jp": "Google LLC",
    "google.co.ke": "Google LLC",
    "google.co.kr": "Google LLC",
    "google.co.ls": "Google LLC",
    "google.co.ma": "Google LLC",
    "google.co.mz": "Google LLC",
    "google.co.nz": "Google LLC",
    "google.co.th": "Google LLC",
    "google.co.tz": "Google LLC",
    "google.co.ug": "Google LLC",
    "google.co.uk": "Google LLC",
    "google.co.uz": "Google LLC",
    "google.co.ve": "Google LLC",
    "google.co.vi": "Google LLC",
    "google.co.za": "Google LLC",
    "google.co.zm": "Google LLC",
    "google.co.zw": "Google LLC",
    "google.com": "Google LLC",
    "google.com.af": "Google LLC",
    "google.com.ag": "Google LLC",
    "google.com.ai": "Google LLC",
    "google.com.ar": "Google LLC",
    "google.com.au": "Google LLC",
    "google.com.bd": "Google LLC",
    "google.com.bh": "Google LLC",
    "google.com.bn": "Google LLC",
    "google.com.bo": "Google LLC",
    "google.com.br": "Google LLC",
    "google.com.by": "Google LLC",
    "google.com.bz": "Google LLC",
    "google.com.cn": "Google LLC",
    "google.com.co": "Google LLC",
    "google.com.cu": "Google LLC",
    "google.com.cy": "Google LLC",
    "google.com.do": "Google LLC",
    "google.com.ec": "Google LLC",
    "google.com.eg": "Google LLC",
    "google.com.et": "Google LLC",
    "google.com.fj": "Google LLC",
    "google.com.ge": "Google LLC",
    "google.com.gh": "Google LLC",
    "google.com.gi": "Google LLC",
    "google.com.gr": "Google LLC",
    "google.com.gt": "Google LLC",
    "google.com.hk": "Google LLC",
    "google.com.iq": "Google LLC",
    "google.com.jm": "Google LLC",
    "google.com.jo": "Google LLC",
    "google.com.kh": "Google LLC",
    "google.com.kw": "Google LLC",
    "google.com.lb": "Google LLC",
    "google.com.ly": "Google LLC",
    "google.com.mm": "Google LLC",
    "google.com.mt": "Google LLC",
    "google.com.mx": "Google LLC",
    "google.com.my": "Google LLC",
    "google.com.na": "Google LLC",
    "google.com.nf": "Google LLC",
    "google.com.ng": "Google LLC",
    "google.com.ni": "Google LLC",
    "google.com.np": "Google LLC",
    "google.com.nr": "Google LLC",
    "google.com.om": "Google LLC",
    "google.com.pa": "Google LLC",
    "google.com.pe": "Google LLC",
    "google.com.pg": "Google LLC",
    "google.com.ph": "Google LLC",
    "google.com.pk": "Google LLC",
    "google.com.pl": "Google LLC",
    "google.com.pr": "Google LLC",
    "google.com.py": "Google LLC",
    "google.com.qa": "Google LLC",
    "google.com.sa": "Google LLC",
    "google.com.sb": "Google LLC",
    "google.com.sg": "Google LLC",
    "google.com.sl": "Google LLC",
    "google.com.sv": "Google LLC",
    "google.com.tj": "Google LLC",
    "google.com.tn": "Google LLC",
    "google.com.tr": "Google LLC",
    "google.com.tw": "Google LLC",
    "google.com.ua": "Google LLC",
    "google.com.uy": "Google LLC",
    "google.com.vc": "Google LLC",
    "google.com.ve": "Google LLC",
    "google.com.vn": "Google LLC",
    "google.cv": "Google LLC",
    "google.cz": "Google LLC",
    "google.de": "Google LLC",
    "google.dj": "Google LLC",
    "google.dk": "Google LLC",
    "google.dm": "Google LLC",
    "google.dz": "Google LLC",
    "google.ee": "Google LLC",
    "google.es": "Google LLC",
    "google.eus": "Google LLC",
    "google.fi": "Google LLC",
    "google.fm": "Google LLC",
    "google.fr": "Google LLC",
    "google.frl": "Google LLC",
    "google.ga": "Google LLC",
    "google.gal": "Google LLC",
    "google.ge": "Google LLC",
    "google.gg": "Google LLC",
    "google.gl": "Google LLC",
    "google.gm": "Google LLC",
    "google.gp": "Google LLC",
    "google.gr": "Google LLC",
    "google.gy": "Google LLC",
    "google.hk": "Google LLC",
    "google.hn": "Google LLC",
    "google.hr": "Google LLC",
    "google.ht": "Google LLC",
    "google.hu": "Google LLC",
    "google.ie": "Google LLC",
    "google.im": "Google LLC",
    "google.in": "Google LLC",
    "google.info": "Google LLC",
    "google.iq": "Google LLC",
    "google.ir": "Google LLC",
    "google.is": "Google LLC",
    "google.it": "Google LLC",
    "google.it.ao": "Google LLC",
    "google.je": "Google LLC",
    "google.jo": "Google LLC",
    "google.jobs": "Google LLC",
    "google.jp": "Google LLC",
    "google.kg": "Google LLC",
    "google.ki": "Google LLC",
    "google.kz": "Google LLC",
    "google.la": "Google LLC",
    "google.li": "Google LLC",
    "google.lk": "Google LLC",
    "google.lt": "Google LLC",
    "google.lu": "Google LLC",
    "google.lv": "Google LLC",
    "google.md": "Google LLC",
    "google.me": "Google LLC",
    "google.mg": "Google LLC",
    "google.mk": "Google LLC",
    "google.ml": "Google LLC",
    "google.mn": "Google LLC",
    "google.ms": "Google LLC",
    "google.mu": "Google LLC",
    "google.mv": "Google LLC",
    "google.mw": "Google LLC",
    "google.ne": "Google LLC",
    "google.ne.jp": "Google LLC",
    "google.net": "Google LLC",
    "google.ng": "Google LLC",
    "google.nl": "Google LLC",
    "google.no": "Google LLC",
    "google.nr": "Google LLC",
    "google.nu": "Google LLC",
    "google.off.ai": "Google LLC",
    "google.org": "Google LLC",
    "google.pk": "Google LLC",
    "google.pl": "Google LLC",
    "google.pn": "Google LLC",
    "google.ps": "Google LLC",
    "google.pt": "Google LLC",
    "google.ro": "Google LLC",
    "google.rs": "Google LLC",
    "google.ru": "Google LLC",
    "google.rw": "Google LLC",
    "google.sc": "Google LLC",
    "google.se": "Google LLC",
    "google.sh": "Google LLC",
    "google.si": "Google LLC",
    "google.sk": "Google LLC",
    "google.sm": "Google LLC",
    "google.sn": "Google LLC",
    "google.so": "Google LLC",
    "google.sr": "Google LLC",
    "google.st": "Google LLC",
    "google.td": "Google LLC",
    "google.tel": "Google LLC",
    "google.tg": "Google LLC",
    "google.tk": "Google LLC",
    "google.tl": "Google LLC",
    "google.tm": "Google LLC",
    "google.tn": "Google LLC",
    "google.to": "Google LLC",
    "google.tt": "Google LLC",
    "google.ua": "Google LLC",
    "google.us": "Google LLC",
    "google.uz": "Google LLC",
    "google.ventures": "Google LLC",
    "google.vg": "Google LLC",
    "google.vu": "Google LLC",
    "google.ws": "Google LLC",
    "googleadapis.com": "Google LLC",
    "googleads.com": "Google LLC",
    "googleadservices.com": "Google LLC",
    "googleadsserving.cn": "Google LLC",
    "googleapis.cn": "Google LLC",
    "googleapis.co": "Google LLC",
    "googleapis.com": "Google LLC",
    "googleapps.com": "Google LLC",
    "googleblog.com": "Google LLC",
    "googlecnapps.com": "Google LLC",
    "googlecode.com": "Google LLC",
    "googlecommerce.com": "Google LLC",
    "googlecompare.co.uk": "Google LLC",
    "googledanmark.com": "Google LLC",
    "googledrive.com": "Google LLC",
    "googlefiber.net": "Google LLC",
    "googlefinland.com": "Google LLC",
    "googlegroups.com": "Google LLC",
    "googlemail.com": "Google LLC",
    "googlemaps.com": "Google LLC",
    "googleoptimize.com": "Google LLC",
    "googlephotos.com": "Google LLC",
    "googleplay.com": "Google LLC",
    "googleplus.com": "Google LLC",
    "googlesource.com": "Google LLC",
    "googlesverige.com": "Google LLC",
    "googlesyndication.com": "Google LLC",
    "googletagmanager.com": "Google LLC",
    "googletagservices.com": "Google LLC",
    "googletraveladservices.com": "Google LLC",
    "googleusercontent.cn": "Google LLC",
    "googleusercontent.com": "Google LLC",
    "googleventures.com": "Google LLC",
    "googlevideo.com": "Google LLC",
    "googleweblight.com": "Google LLC",
    "goooglesyndication.com": "Google LLC",
    "grpc.io": "Google LLC",
    "gsrc.io": "Google LLC",
    "gstatic.cn": "Google LLC",
    "gstatic.com": "Google LLC",
    "gstaticcnapps.cn": "Google LLC",
    "gsuite.com": "Google LLC",
    "gvt1.com": "Google LLC",
    "gvt2.com": "Google LLC",
    "hdrplusdata.org": "Google LLC",
    "hindiweb.com": "Google LLC",
    "howtogetmo.co.uk": "Google LLC",
    "html5rocks.com": "Google LLC",
    "hwgo.com": "Google LLC",
    "impermium.com": "Google LLC",
    "invitemedia.com": "Google LLC",
    "itasoftware.com": "Google LLC",
    "j2objc.org": "Google LLC",
    "kaggle.com": "Google LLC",
    "keytransparency.com": "Google LLC",
    "keytransparency.foo": "Google LLC",
    "keytransparency.org": "Google LLC",
    "listentoyoutube.com": "Google LLC",
    "markerly.com": "Google LLC",
    "material.io": "Google LLC",
    "mdialog.com": "Google LLC",
    "meebo.com": "Google LLC",
    "mfg-inspector.com": "Google LLC",
    "mn0e.com": "Google LLC",
    "mobileview.page": "Google LLC",
    "moodstocks.com": "Google LLC",
    "near.by": "Google LLC",
    "nest.com": "Google LLC",
    "oauthz.com": "Google LLC",
    "on.here": "Google LLC",
    "on2.com": "Google LLC",
    "oneworldmanystories.com": "Google LLC",
    "page.link": "Google LLC",
    "pagespeedmobilizer.com": "Google LLC",
    "pageview.mobi": "Google LLC",
    "partylikeits1986.org": "Google LLC",
    "paxlicense.org": "Google LLC",
    "pittpatt.com": "Google LLC",
    "pki.goog": "Google LLC",
    "polymerproject.org": "Google LLC",
    "postini.com": "Google LLC",
    "projectara.com": "Google LLC",
    "projectbaseline.com": "Google LLC",
    "questvisual.com": "Google LLC",
    "quickoffice.com": "Google LLC",
    "quiksee.com": "Google LLC",
    "recaptcha.net": "Google LLC",
    "registry.google": "Google LLC",
    "relaymedia.com": "Google LLC",
    "revolv.com": "Google LLC",
    "ridepenguin.com": "Google LLC",
    "saynow.com": "Google LLC",
    "schemer.com": "Google LLC",
    "screenwisetrends.com": "Google LLC",
    "screenwisetrendspanel.com": "Google LLC",
    "shoppingil.co.il": "Google LLC",
    "snapseed.com": "Google LLC",
    "socratic.org": "Google LLC",
    "solveforx.com": "Google LLC",
    "studywatchbyverily.com": "Google LLC",
    "studywatchbyverily.org": "Google LLC",
    "tensorflow.org": "Google LLC",
    "thecleversense.com": "Google LLC",
    "thinkquarterly.co.uk": "Google LLC",
    "thinkquarterly.com": "Google LLC",
    "translate.goog": "Google LLC",
    "txcloud.net": "Google LLC",
    "txvia.com": "Google LLC",
    "unfiltered.news": "Google LLC",
    "urchin.com": "Google LLC",
    "useplannr.com": "Google LLC",
    "v8project.org": "Google LLC",
    "verily.com": "Google LLC",
    "verilylifesciences.com": "Google LLC",
    "verilystudyhub.com": "Google LLC",
    "verilystudywatch.com": "Google LLC",
    "verilystudywatch.org": "Google LLC",
    "wallet.com": "Google LLC",
    "waymo.com": "Google LLC",
    "waze.com": "Google LLC",
    "web.dev": "Google LLC",
    "webappfieldguide.com": "Google LLC",
    "weltweitwachsen.de": "Google LLC",
    "whatbrowser.org": "Google LLC",
    "widevine.com": "Google LLC",
    "withgoogle.com": "Google LLC",
    "womenwill.com": "Google LLC",
    "womenwill.com.br": "Google LLC",
    "womenwill.id": "Google LLC",
    "womenwill.in": "Google LLC",
    "womenwill.mx": "Google LLC",
    "x.company": "Google LLC",
    "x.team": "Google LLC",
    "xn--9trs65b.com": "Google LLC",
    "youtu.be": "Google LLC",
    "youtube-nocookie.com": "Google LLC",
    "youtube.com": "Google LLC",
    "youtubeeducation.com": "Google LLC",
    "youtubekids.com": "Google LLC",
    "youtubemobilesupport.com": "Google LLC",
    "yt.be": "Google LLC",
    "ytimg.com": "Google LLC",
    "zukunftswerkstatt.de": "Google LLC",
    "2o7.net": "Adobe Inc.",
    "acrobat.com": "Adobe Inc.",
    "acrobatusers.com": "Adobe Inc.",
    "adobe.com": "Adobe Inc.",
    "adobe.io": "Adobe Inc.",
    "adobeccstatic.com": "Adobe Inc.",
    "adobecqms.net": "Adobe Inc.",
    "adobedc.net": "Adobe Inc.",
    "adobedtm.com": "Adobe Inc.",
    "adobejanus.com": "Adobe Inc.",
    "adobelogin.com": "Adobe Inc.",
    "adobesign.com": "Adobe Inc.",
    "adobetag.com": "Adobe Inc.",
    "assetsadobe.com": "Adobe Inc.",
    "assetsadobe2.com": "Adobe Inc.",
    "assetsadobe3.com": "Adobe Inc.",
    "atomz.com": "Adobe Inc.",
    "auditude.com": "Adobe Inc.",
    "behance.net": "Adobe Inc.",
    "bizible.com": "Adobe Inc.",
    "bizibly.com": "Adobe Inc.",
    "businesscatalyst.com": "Adobe Inc.",
    "creativecloud.com": "Adobe Inc.",
    "demdex.net": "Adobe Inc.",
    "echosign.com": "Adobe Inc.",
    "edgefonts.net": "Adobe Inc.",
    "everestads.net": "Adobe Inc.",
    "everestjs.net": "Adobe Inc.",
    "everesttech.net": "Adobe Inc.",
    "fotolia.com": "Adobe Inc.",
    "fotolia.net": "Adobe Inc.",
    "ftcdn.net": "Adobe Inc.",
    "fyre.co": "Adobe Inc.",
    "hitbox.com": "Adobe Inc.",
    "livefyre.com": "Adobe Inc.",
    "marketo.com": "Adobe Inc.",
    "marketo.net": "Adobe Inc.",
    "mktoresp.com": "Adobe Inc.",
    "mktoutil.com": "Adobe Inc.",
    "nedstat.net": "Adobe Inc.",
    "omniture.com": "Adobe Inc.",
    "omtrdc.net": "Adobe Inc.",
    "photoshop.com": "Adobe Inc.",
    "scene7.com": "Adobe Inc.",
    "sitestat.com": "Adobe Inc.",
    "ss-omtrdc.net": "Adobe Inc.",
    "storify.com": "Adobe Inc.",
    "tubemogul.com": "Adobe Inc.",
    "typekit.com": "Adobe Inc.",
    "typekit.net": "Adobe Inc.",
    "worldsecuresystems.com": "Adobe Inc.",
    "33across.com": "33Across, Inc.",
    "tynt.com": "33Across, Inc.",
    "360yield.com": "Improve Digital BV",
    "improvedigital.com": "Improve Digital BV",
    "areyouahuman.com": "Imperva Inc.",
    "distil.us": "Imperva Inc.",
    "distilnetworks.com": "Imperva Inc.",
    "distiltag.com": "Imperva Inc.",
    "incapdns.net": "Imperva Inc.",
    "incapsula.com": "Imperva Inc.",
    "3gl.net": "CatchPoint Systems Inc",
    "3lift.com": "TripleLift",
    "triplelift.com": "TripleLift",
    "4dex.io": "Adagio",
    "adagio.io": "Adagio",
    "4dsply.com": "AdSupply, Inc.",
    "adsupply.com": "AdSupply, Inc.",
    "4strokemedia.com": "4strokemedia",
    "1drv.ms": "Microsoft Corporation",
    "3plearning.com": "Microsoft Corporation",
    "adsymptotic.com": "Microsoft Corporation",
    "afx.ms": "Microsoft Corporation",
    "ageofempires.com": "Microsoft Corporation",
    "aka.ms": "Microsoft Corporation",
    "appcenter.ms": "Microsoft Corporation",
    "asp.net": "Microsoft Corporation",
    "aspnetcdn.com": "Microsoft Corporation",
    "assets-yammer.com": "Microsoft Corporation",
    "atmrum.net": "Microsoft Corporation",
    "azure-api.net": "Microsoft Corporation",
    "azure-dns.com": "Microsoft Corporation",
    "azure-dns.info": "Microsoft Corporation",
    "azure-dns.net": "Microsoft Corporation",
    "azure-dns.org": "Microsoft Corporation",
    "azure.com": "Microsoft Corporation",
    "azure.net": "Microsoft Corporation",
    "azureedge.net": "Microsoft Corporation",
    "azurewebsites.net": "Microsoft Corporation",
    "b2clogin.com": "Microsoft Corporation",
    "beam.pro": "Microsoft Corporation",
    "bing-int.com": "Microsoft Corporation",
    "bing.at": "Microsoft Corporation",
    "bing.ca": "Microsoft Corporation",
    "bing.ch": "Microsoft Corporation",
    "bing.co.at": "Microsoft Corporation",
    "bing.co.id": "Microsoft Corporation",
    "bing.co.in": "Microsoft Corporation",
    "bing.co.jp": "Microsoft Corporation",
    "bing.co.uk": "Microsoft Corporation",
    "bing.co.za": "Microsoft Corporation",
    "bing.com": "Microsoft Corporation",
    "bing.com.ar": "Microsoft Corporation",
    "bing.com.au": "Microsoft Corporation",
    "bing.com.br": "Microsoft Corporation",
    "bing.com.cn": "Microsoft Corporation",
    "bing.com.es": "Microsoft Corporation",
    "bing.com.hk": "Microsoft Corporation",
    "bing.com.mx": "Microsoft Corporation",
    "bing.com.my": "Microsoft Corporation",
    "bing.com.pl": "Microsoft Corporation",
    "bing.com.sa": "Microsoft Corporation",
    "bing.com.tr": "Microsoft Corporation",
    "bing.de": "Microsoft Corporation",
    "bing.es": "Microsoft Corporation",
    "bing.fr": "Microsoft Corporation",
    "bing.gen.tr": "Microsoft Corporation",
    "bing.in": "Microsoft Corporation",
    "bing.it": "Microsoft Corporation",
    "bing.jp": "Microsoft Corporation",
    "bing.net": "Microsoft Corporation",
    "bing.nl": "Microsoft Corporation",
    "bing.no": "Microsoft Corporation",
    "bing.pl": "Microsoft Corporation",
    "bing.ru": "Microsoft Corporation",
    "bing.se": "Microsoft Corporation",
    "bingapis.com": "Microsoft Corporation",
    "bingsandbox.com": "Microsoft Corporation",
    "bizographics.com": "Microsoft Corporation",
    "botframework.com": "Microsoft Corporation",
    "buildmypinnedsite.com": "Microsoft Corporation",
    "carpoint.ca": "Microsoft Corporation",
    "carpoint.com": "Microsoft Corporation",
    "ch9.ms": "Microsoft Corporation",
    "clarity.ms": "Microsoft Corporation",
    "cloudapp.net": "Microsoft Corporation",
    "customsearch.ai": "Microsoft Corporation",
    "detelefoonvanbritt.nl": "Microsoft Corporation",
    "digitaldemocracy.tv": "Microsoft Corporation",
    "digitalwpc.com": "Microsoft Corporation",
    "discovermsn.com": "Microsoft Corporation",
    "doterracertifiedsite.com": "Microsoft Corporation",
    "dynamics.com": "Microsoft Corporation",
    "edgesv.net": "Microsoft Corporation",
    "footprintdns.com": "Microsoft Corporation",
    "forzamotorsport.net": "Microsoft Corporation",
    "gfx.ms": "Microsoft Corporation",
    "gigjam.com": "Microsoft Corporation",
    "gpslab.net": "Microsoft Corporation",
    "groupme.com": "Microsoft Corporation",
    "halocdn.com": "Microsoft Corporation",
    "halowaypoint.com": "Microsoft Corporation",
    "hockeyapp.net": "Microsoft Corporation",
    "hololens.com": "Microsoft Corporation",
    "hotmail.com": "Microsoft Corporation",
    "hotmail.fr": "Microsoft Corporation",
    "hotmail.hu": "Microsoft Corporation",
    "hotmail.it": "Microsoft Corporation",
    "hotmail.jp": "Microsoft Corporation",
    "hotmail.la": "Microsoft Corporation",
    "hotmail.nl": "Microsoft Corporation",
    "hotmail.no": "Microsoft Corporation",
    "hotmail.ph": "Microsoft Corporation",
    "hotmail.pt": "Microsoft Corporation",
    "hotmail.se": "Microsoft Corporation",
    "hotmail.sk": "Microsoft Corporation",
    "howzitmsn.com": "Microsoft Corporation",
    "iis.net": "Microsoft Corporation",
    "imaginecup.pl": "Microsoft Corporation",
    "irbi.de": "Microsoft Corporation",
    "k-msedge.net": "Microsoft Corporation",
    "licdn.com": "Microsoft Corporation",
    "liga-tippgemeinschaft.de": "Microsoft Corporation",
    "linkedin.com": "Microsoft Corporation",
    "linkedinmobileapp.com": "Microsoft Corporation",
    "live-int.com": "Microsoft Corporation",
    "live.co.uk": "Microsoft Corporation",
    "live.com": "Microsoft Corporation",
    "live.com.au": "Microsoft Corporation",
    "live.fr": "Microsoft Corporation",
    "live.jp": "Microsoft Corporation",
    "live.net": "Microsoft Corporation",
    "live.sg": "Microsoft Corporation",
    "livespacevision.com": "Microsoft Corporation",
    "livevz.net": "Microsoft Corporation",
    "lync.com": "Microsoft Corporation",
    "lynda.com": "Microsoft Corporation",
    "messenger.fr": "Microsoft Corporation",
    "microsoft.az": "Microsoft Corporation",
    "microsoft.be": "Microsoft Corporation",
    "microsoft.by": "Microsoft Corporation",
    "microsoft.ca": "Microsoft Corporation",
    "microsoft.cat": "Microsoft Corporation",
    "microsoft.ch": "Microsoft Corporation",
    "microsoft.cl": "Microsoft Corporation",
    "microsoft.com": "Microsoft Corporation",
    "microsoft.cz": "Microsoft Corporation",
    "microsoft.de": "Microsoft Corporation",
    "microsoft.dk": "Microsoft Corporation",
    "microsoft.ee": "Microsoft Corporation",
    "microsoft.es": "Microsoft Corporation",
    "microsoft.eu": "Microsoft Corporation",
    "microsoft.fi": "Microsoft Corporation",
    "microsoft.fr": "Microsoft Corporation",
    "microsoft.ge": "Microsoft Corporation",
    "microsoft.hu": "Microsoft Corporation",
    "microsoft.is": "Microsoft Corporation",
    "microsoft.it": "Microsoft Corporation",
    "microsoft.jp": "Microsoft Corporation",
    "microsoft.lt": "Microsoft Corporation",
    "microsoft.lu": "Microsoft Corporation",
    "microsoft.lv": "Microsoft Corporation",
    "microsoft.md": "Microsoft Corporation",
    "microsoft.pl": "Microsoft Corporation",
    "microsoft.pt": "Microsoft Corporation",
    "microsoft.ro": "Microsoft Corporation",
    "microsoft.rs": "Microsoft Corporation",
    "microsoft.ru": "Microsoft Corporation",
    "microsoft.se": "Microsoft Corporation",
    "microsoft.si": "Microsoft Corporation",
    "microsoft.tv": "Microsoft Corporation",
    "microsoft.ua": "Microsoft Corporation",
    "microsoft.uz": "Microsoft Corporation",
    "microsoft.vn": "Microsoft Corporation",
    "microsoft365.com": "Microsoft Corporation",
    "microsoftadcentre.ca": "Microsoft Corporation",
    "microsoftcloud.com": "Microsoft Corporation",
    "microsoftedge.com": "Microsoft Corporation",
    "microsoftlinc.com": "Microsoft Corporation",
    "microsoftonline-p.com": "Microsoft Corporation",
    "microsoftonline.com": "Microsoft Corporation",
    "microsoftpartnernetwork.com": "Microsoft Corporation",
    "microsoftstore.com": "Microsoft Corporation",
    "microsoftstudios.com": "Microsoft Corporation",
    "microsofttranslator.com": "Microsoft Corporation",
    "mileiq.com": "Microsoft Corporation",
    "mixer.com": "Microsoft Corporation",
    "mono-project.com": "Microsoft Corporation",
    "msauth.net": "Microsoft Corporation",
    "msdn.com": "Microsoft Corporation",
    "msecnd.net": "Microsoft Corporation",
    "msedge.net": "Microsoft Corporation",
    "msftconnecttest.com": "Microsoft Corporation",
    "msn.ae": "Microsoft Corporation",
    "msn.at": "Microsoft Corporation",
    "msn.be": "Microsoft Corporation",
    "msn.ca": "Microsoft Corporation",
    "msn.ch": "Microsoft Corporation",
    "msn.cn": "Microsoft Corporation",
    "msn.co.cr": "Microsoft Corporation",
    "msn.co.id": "Microsoft Corporation",
    "msn.co.il": "Microsoft Corporation",
    "msn.co.in": "Microsoft Corporation",
    "msn.co.jp": "Microsoft Corporation",
    "msn.co.kr": "Microsoft Corporation",
    "msn.co.nz": "Microsoft Corporation",
    "msn.co.th": "Microsoft Corporation",
    "msn.co.uk": "Microsoft Corporation",
    "msn.co.za": "Microsoft Corporation",
    "msn.com": "Microsoft Corporation",
    "msn.com.au": "Microsoft Corporation",
    "msn.com.br": "Microsoft Corporation",
    "msn.com.cn": "Microsoft Corporation",
    "msn.com.gr": "Microsoft Corporation",
    "msn.com.hk": "Microsoft Corporation",
    "msn.com.mx": "Microsoft Corporation",
    "msn.com.my": "Microsoft Corporation",
    "msn.com.sg": "Microsoft Corporation",
    "msn.com.tr": "Microsoft Corporation",
    "msn.com.tw": "Microsoft Corporation",
    "msn.cr": "Microsoft Corporation",
    "msn.de": "Microsoft Corporation",
    "msn.dk": "Microsoft Corporation",
    "msn.es": "Microsoft Corporation",
    "msn.fi": "Microsoft Corporation",
    "msn.fr": "Microsoft Corporation",
    "msn.gr": "Microsoft Corporation",
    "msn.hu": "Microsoft Corporation",
    "msn.ie": "Microsoft Corporation",
    "msn.it": "Microsoft Corporation",
    "msn.jp": "Microsoft Corporation",
    "msn.kz": "Microsoft Corporation",
    "msn.net": "Microsoft Corporation",
    "msn.net.ru": "Microsoft Corporation",
    "msn.nl": "Microsoft Corporation",
    "msn.no": "Microsoft Corporation",
    "msn.pl": "Microsoft Corporation",
    "msn.pt": "Microsoft Corporation",
    "msn.ru": "Microsoft Corporation",
    "msn.se": "Microsoft Corporation",
    "msn.sg": "Microsoft Corporation",
    "msnarabia.com": "Microsoft Corporation",
    "msnautos.com": "Microsoft Corporation",
    "msncricket.com": "Microsoft Corporation",
    "msnlatino.com": "Microsoft Corporation",
    "msnnews.com": "Microsoft Corporation",
    "msnsports.com": "Microsoft Corporation",
    "msnstars.dk": "Microsoft Corporation",
    "msntravel.com": "Microsoft Corporation",
    "msnweather.com": "Microsoft Corporation",
    "msocdn.com": "Microsoft Corporation",
    "nuget.org": "Microsoft Corporation",
    "office.com": "Microsoft Corporation",
    "office.net": "Microsoft Corporation",
    "office365.com": "Microsoft Corporation",
    "officeppe.net": "Microsoft Corporation",
    "onedrive.com": "Microsoft Corporation",
    "onenote.co": "Microsoft Corporation",
    "onenote.co.uk": "Microsoft Corporation",
    "onenote.com": "Microsoft Corporation",
    "onenote.mobi": "Microsoft Corporation",
    "onenote.net": "Microsoft Corporation",
    "onenote.org": "Microsoft Corporation",
    "onestore.ms": "Microsoft Corporation",
    "outlook.at": "Microsoft Corporation",
    "outlook.be": "Microsoft Corporation",
    "outlook.bg": "Microsoft Corporation",
    "outlook.bz": "Microsoft Corporation",
    "outlook.cl": "Microsoft Corporation",
    "outlook.cm": "Microsoft Corporation",
    "outlook.co": "Microsoft Corporation",
    "outlook.co.cr": "Microsoft Corporation",
    "outlook.co.id": "Microsoft Corporation",
    "outlook.co.il": "Microsoft Corporation",
    "outlook.co.nz": "Microsoft Corporation",
    "outlook.co.th": "Microsoft Corporation",
    "outlook.com": "Microsoft Corporation",
    "outlook.com.ar": "Microsoft Corporation",
    "outlook.com.au": "Microsoft Corporation",
    "outlook.com.br": "Microsoft Corporation",
    "outlook.com.es": "Microsoft Corporation",
    "outlook.com.gr": "Microsoft Corporation",
    "outlook.com.hr": "Microsoft Corporation",
    "outlook.com.pe": "Microsoft Corporation",
    "outlook.com.py": "Microsoft Corporation",
    "outlook.com.tr": "Microsoft Corporation",
    "outlook.com.ua": "Microsoft Corporation",
    "outlook.com.vn": "Microsoft Corporation",
    "outlook.cz": "Microsoft Corporation",
    "outlook.de": "Microsoft Corporation",
    "outlook.dk": "Microsoft Corporation",
    "outlook.ec": "Microsoft Corporation",
    "outlook.fr": "Microsoft Corporation",
    "outlook.hn": "Microsoft Corporation",
    "outlook.ht": "Microsoft Corporation",
    "outlook.hu": "Microsoft Corporation",
    "outlook.ie": "Microsoft Corporation",
    "outlook.in": "Microsoft Corporation",
    "outlook.it": "Microsoft Corporation",
    "outlook.jp": "Microsoft Corporation",
    "outlook.kr": "Microsoft Corporation",
    "outlook.la": "Microsoft Corporation",
    "outlook.lv": "Microsoft Corporation",
    "outlook.mx": "Microsoft Corporation",
    "outlook.my": "Microsoft Corporation",
    "outlook.pa": "Microsoft Corporation",
    "outlook.ph": "Microsoft Corporation",
    "outlook.pk": "Microsoft Corporation",
    "outlook.pt": "Microsoft Corporation",
    "outlook.ro": "Microsoft Corporation",
    "outlookmobile.com": "Microsoft Corporation",
    "peer5.com": "Microsoft Corporation",
    "playfabapi.com": "Microsoft Corporation",
    "powerbi.com": "Microsoft Corporation",
    "prodigymsn.com.mx": "Microsoft Corporation",
    "revolution-computing.com": "Microsoft Corporation",
    "revolutionanalytics.com": "Microsoft Corporation",
    "s-microsoft.com": "Microsoft Corporation",
    "s-msft.com": "Microsoft Corporation",
    "s-msn.com": "Microsoft Corporation",
    "seaofthieves.com": "Microsoft Corporation",
    "securitymap.de": "Microsoft Corporation",
    "sharepoint-df.com": "Microsoft Corporation",
    "sharepoint.com": "Microsoft Corporation",
    "sharepoint.de": "Microsoft Corporation",
    "sharepointonline.com": "Microsoft Corporation",
    "sharept.ms": "Microsoft Corporation",
    "skype.com": "Microsoft Corporation",
    "skypeassets.com": "Microsoft Corporation",
    "slideshare.net": "Microsoft Corporation",
    "slidesharecdn.com": "Microsoft Corporation",
    "spoppe.com": "Microsoft Corporation",
    "start.com": "Microsoft Corporation",
    "surface.com": "Microsoft Corporation",
    "svc.ms": "Microsoft Corporation",
    "sway-cdn.com": "Microsoft Corporation",
    "swiftkey.com": "Microsoft Corporation",
    "sysinternals.com": "Microsoft Corporation",
    "t1msn.com.mx": "Microsoft Corporation",
    "trafficmanager.net": "Microsoft Corporation",
    "trouter.io": "Microsoft Corporation",
    "typescriptlang.org": "Microsoft Corporation",
    "video2brain.com": "Microsoft Corporation",
    "virtualearth.net": "Microsoft Corporation",
    "visualstudio.com": "Microsoft Corporation",
    "vsassets.io": "Microsoft Corporation",
    "wbd.ms": "Microsoft Corporation",
    "whiteboard.ms": "Microsoft Corporation",
    "windows.com": "Microsoft Corporation",
    "windows.de": "Microsoft Corporation",
    "windows.net": "Microsoft Corporation",
    "windows.nl": "Microsoft Corporation",
    "windowslive.be": "Microsoft Corporation",
    "windowslive.com.br": "Microsoft Corporation",
    "windowslive.it": "Microsoft Corporation",
    "windowsmarketplace.com": "Microsoft Corporation",
    "windowsphone.com": "Microsoft Corporation",
    "windowssearch-exp.com": "Microsoft Corporation",
    "windowssearch.com": "Microsoft Corporation",
    "windowsupdate.com": "Microsoft Corporation",
    "winhec.com": "Microsoft Corporation",
    "winhec.net": "Microsoft Corporation",
    "wunderlist.com": "Microsoft Corporation",
    "xamarin.com": "Microsoft Corporation",
    "xbox.com": "Microsoft Corporation",
    "xboxemea.com": "Microsoft Corporation",
    "xboxlive.com": "Microsoft Corporation",
    "yupimsn.com": "Microsoft Corporation",
    "6sc.co": "6 Sense Insights Inc.",
    "abmr.net": "Akamai Technologies",
    "akadns.net": "Akamai Technologies",
    "akamai-staging.net": "Akamai Technologies",
    "akamai.com": "Akamai Technologies",
    "akamai.net": "Akamai Technologies",
    "akamaihd-staging.net": "Akamai Technologies",
    "akamaihd.net": "Akamai Technologies",
    "akamaiorigin-staging.net": "Akamai Technologies",
    "akamaiorigin.net": "Akamai Technologies",
    "akamaized-staging.net": "Akamai Technologies",
    "akamaized.net": "Akamai Technologies",
    "akstat.io": "Akamai Technologies",
    "edgekey-staging.net": "Akamai Technologies",
    "edgekey.net": "Akamai Technologies",
    "edgesuite-staging.net": "Akamai Technologies",
    "edgesuite.net": "Akamai Technologies",
    "go-mpulse.net": "Akamai Technologies",
    "gw-ec.com": "Akamai Technologies",
    "securetve.com": "Akamai Technologies",
    "365bywholefoods.com": "Amazon Technologies, Inc.",
    "6pm.com": "Amazon Technologies, Inc.",
    "a.co": "Amazon Technologies, Inc.",
    "a2z.com": "Amazon Technologies, Inc.",
    "aiv-cdn.net": "Amazon Technologies, Inc.",
    "aiv-delivery.net": "Amazon Technologies, Inc.",
    "alexa.com": "Amazon Technologies, Inc.",
    "alexametrics.com": "Amazon Technologies, Inc.",
    "amazon-adsystem.com": "Amazon Technologies, Inc.",
    "amazon.ae": "Amazon Technologies, Inc.",
    "amazon.ca": "Amazon Technologies, Inc.",
    "amazon.cn": "Amazon Technologies, Inc.",
    "amazon.co.jp": "Amazon Technologies, Inc.",
    "amazon.co.uk": "Amazon Technologies, Inc.",
    "amazon.com": "Amazon Technologies, Inc.",
    "amazon.com.au": "Amazon Technologies, Inc.",
    "amazon.com.br": "Amazon Technologies, Inc.",
    "amazon.com.mx": "Amazon Technologies, Inc.",
    "amazon.com.tr": "Amazon Technologies, Inc.",
    "amazon.de": "Amazon Technologies, Inc.",
    "amazon.es": "Amazon Technologies, Inc.",
    "amazon.fr": "Amazon Technologies, Inc.",
    "amazon.in": "Amazon Technologies, Inc.",
    "amazon.it": "Amazon Technologies, Inc.",
    "amazon.jobs": "Amazon Technologies, Inc.",
    "amazon.nl": "Amazon Technologies, Inc.",
    "amazon.sa": "Amazon Technologies, Inc.",
    "amazon.sg": "Amazon Technologies, Inc.",
    "amazon.work": "Amazon Technologies, Inc.",
    "amazonadsystem.com": "Amazon Technologies, Inc.",
    "amazonappservices.com": "Amazon Technologies, Inc.",
    "amazonaws.com": "Amazon Technologies, Inc.",
    "amazonforum.com": "Amazon Technologies, Inc.",
    "amazonpay.com": "Amazon Technologies, Inc.",
    "amazontrust.com": "Amazon Technologies, Inc.",
    "amazonvideo.com": "Amazon Technologies, Inc.",
    "amazonwebservices.com": "Amazon Technologies, Inc.",
    "amz.onl": "Amazon Technologies, Inc.",
    "amzn.asia": "Amazon Technologies, Inc.",
    "amzn.co.uk": "Amazon Technologies, Inc.",
    "amzn.com": "Amazon Technologies, Inc.",
    "amzn.eu": "Amazon Technologies, Inc.",
    "amzn.in": "Amazon Technologies, Inc.",
    "amzn.to": "Amazon Technologies, Inc.",
    "assoc-amazon.co.uk": "Amazon Technologies, Inc.",
    "assoc-amazon.com": "Amazon Technologies, Inc.",
    "assoc-amazon.de": "Amazon Technologies, Inc.",
    "assoc-amazon.jp": "Amazon Technologies, Inc.",
    "associates-amazon.com": "Amazon Technologies, Inc.",
    "audible.ca": "Amazon Technologies, Inc.",
    "audible.co.uk": "Amazon Technologies, Inc.",
    "audible.com": "Amazon Technologies, Inc.",
    "audible.de": "Amazon Technologies, Inc.",
    "awsevents.com": "Amazon Technologies, Inc.",
    "awsstatic.com": "Amazon Technologies, Inc.",
    "boxofficemojo.com": "Amazon Technologies, Inc.",
    "cloudfront.net": "Amazon Technologies, Inc.",
    "dpreview.com": "Amazon Technologies, Inc.",
    "elasticbeanstalk.com": "Amazon Technologies, Inc.",
    "forgecdn.net": "Amazon Technologies, Inc.",
    "goodreads.com": "Amazon Technologies, Inc.",
    "gr-assets.com": "Amazon Technologies, Inc.",
    "graphiq.com": "Amazon Technologies, Inc.",
    "images-amazon.com": "Amazon Technologies, Inc.",
    "imdb.com": "Amazon Technologies, Inc.",
    "img-dpreview.com": "Amazon Technologies, Inc.",
    "jtvnw.net": "Amazon Technologies, Inc.",
    "kindle.com": "Amazon Technologies, Inc.",
    "media-amazon.com": "Amazon Technologies, Inc.",
    "media-imdb.com": "Amazon Technologies, Inc.",
    "mturk.com": "Amazon Technologies, Inc.",
    "payments-amazon.com": "Amazon Technologies, Inc.",
    "peer39.com": "Amazon Technologies, Inc.",
    "peer39.net": "Amazon Technologies, Inc.",
    "prime.com": "Amazon Technologies, Inc.",
    "primevideo.com": "Amazon Technologies, Inc.",
    "ring.com": "Amazon Technologies, Inc.",
    "s3-accelerate.amazon": "Amazon Technologies, Inc.",
    "serving-sys.com": "Amazon Technologies, Inc.",
    "siege-amazon.com": "Amazon Technologies, Inc.",
    "sizmek.com": "Amazon Technologies, Inc.",
    "ssl-images-amazon.com": "Amazon Technologies, Inc.",
    "ttvnw.net": "Amazon Technologies, Inc.",
    "twitch.tv": "Amazon Technologies, Inc.",
    "twitchcdn.net": "Amazon Technologies, Inc.",
    "twitchsvc.net": "Amazon Technologies, Inc.",
    "wfm.com": "Amazon Technologies, Inc.",
    "wholecitiesfoundation.org": "Amazon Technologies, Inc.",
    "wholefoodsmarket.com": "Amazon Technologies, Inc.",
    "wholekidsfoundation.org": "Amazon Technologies, Inc.",
    "wholeplanetfoundation.org": "Amazon Technologies, Inc.",
    "woot.com": "Amazon Technologies, Inc.",
    "z.cn": "Amazon Technologies, Inc.",
    "zappos.com": "Amazon Technologies, Inc.",
    "zapposcouture.com": "Amazon Technologies, Inc.",
    "aamapi.com": "Alliance for Audited Media",
    "aamsitecertifier.com": "Alliance for Audited Media",
    "aax.media": "Acceptable Ads Exchange",
    "aaxads.com": "Acceptable Ads Exchange",
    "aaxdetect.com": "Acceptable Ads Exchange",
    "4jnzhl0d0.com": "Leven Labs, Inc. DBA Admiral",
    "aboardamusement.com": "Leven Labs, Inc. DBA Admiral",
    "absorbingband.com": "Leven Labs, Inc. DBA Admiral",
    "absorbingcorn.com": "Leven Labs, Inc. DBA Admiral",
    "abstractedamount.com": "Leven Labs, Inc. DBA Admiral",
    "abstractedauthority.com": "Leven Labs, Inc. DBA Admiral",
    "acidpigs.com": "Leven Labs, Inc. DBA Admiral",
    "actoramusement.com": "Leven Labs, Inc. DBA Admiral",
    "actuallysnake.com": "Leven Labs, Inc. DBA Admiral",
    "aheadday.com": "Leven Labs, Inc. DBA Admiral",
    "alikeaddition.com": "Leven Labs, Inc. DBA Admiral",
    "aliveachiever.com": "Leven Labs, Inc. DBA Admiral",
    "aloofvest.com": "Leven Labs, Inc. DBA Admiral",
    "ancientact.com": "Leven Labs, Inc. DBA Admiral",
    "annoyedairport.com": "Leven Labs, Inc. DBA Admiral",
    "annoyingacoustics.com": "Leven Labs, Inc. DBA Admiral",
    "aspiringattempt.com": "Leven Labs, Inc. DBA Admiral",
    "audioarctic.com": "Leven Labs, Inc. DBA Admiral",
    "automaticside.com": "Leven Labs, Inc. DBA Admiral",
    "awarealley.com": "Leven Labs, Inc. DBA Admiral",
    "awesomeagreement.com": "Leven Labs, Inc. DBA Admiral",
    "awzbijw.com": "Leven Labs, Inc. DBA Admiral",
    "bagbeam.com": "Leven Labs, Inc. DBA Admiral",
    "bandborder.com": "Leven Labs, Inc. DBA Admiral",
    "basketballbelieve.com": "Leven Labs, Inc. DBA Admiral",
    "bawdybalance.com": "Leven Labs, Inc. DBA Admiral",
    "bedsberry.com": "Leven Labs, Inc. DBA Admiral",
    "begintrain.com": "Leven Labs, Inc. DBA Admiral",
    "bestboundary.com": "Leven Labs, Inc. DBA Admiral",
    "blushingbeast.com": "Leven Labs, Inc. DBA Admiral",
    "boilingcredit.com": "Leven Labs, Inc. DBA Admiral",
    "boredcrown.com": "Leven Labs, Inc. DBA Admiral",
    "breadbalance.com": "Leven Labs, Inc. DBA Admiral",
    "breakfastboat.com": "Leven Labs, Inc. DBA Admiral",
    "bulbbait.com": "Leven Labs, Inc. DBA Admiral",
    "burnbubble.com": "Leven Labs, Inc. DBA Admiral",
    "bustlingbath.com": "Leven Labs, Inc. DBA Admiral",
    "butterbulb.com": "Leven Labs, Inc. DBA Admiral",
    "calculatorstatement.com": "Leven Labs, Inc. DBA Admiral",
    "callousbrake.com": "Leven Labs, Inc. DBA Admiral",
    "calmcactus.com": "Leven Labs, Inc. DBA Admiral",
    "capablecup.com": "Leven Labs, Inc. DBA Admiral",
    "capriciouscorn.com": "Leven Labs, Inc. DBA Admiral",
    "caringcast.com": "Leven Labs, Inc. DBA Admiral",
    "carpentercomparison.com": "Leven Labs, Inc. DBA Admiral",
    "catschickens.com": "Leven Labs, Inc. DBA Admiral",
    "causecherry.com": "Leven Labs, Inc. DBA Admiral",
    "cherriescare.com": "Leven Labs, Inc. DBA Admiral",
    "chickensstation.com": "Leven Labs, Inc. DBA Admiral",
    "childlikeform.com": "Leven Labs, Inc. DBA Admiral",
    "chunkycactus.com": "Leven Labs, Inc. DBA Admiral",
    "cloisteredcord.com": "Leven Labs, Inc. DBA Admiral",
    "closedcows.com": "Leven Labs, Inc. DBA Admiral",
    "colossalclouds.com": "Leven Labs, Inc. DBA Admiral",
    "colossalcoat.com": "Leven Labs, Inc. DBA Admiral",
    "comfortablecheese.com": "Leven Labs, Inc. DBA Admiral",
    "conditioncrush.com": "Leven Labs, Inc. DBA Admiral",
    "consciouscheese.com": "Leven Labs, Inc. DBA Admiral",
    "consciousdirt.com": "Leven Labs, Inc. DBA Admiral",
    "coverapparatus.com": "Leven Labs, Inc. DBA Admiral",
    "crabbychin.com": "Leven Labs, Inc. DBA Admiral",
    "cratecamera.com": "Leven Labs, Inc. DBA Admiral",
    "critictruck.com": "Leven Labs, Inc. DBA Admiral",
    "cubchannel.com": "Leven Labs, Inc. DBA Admiral",
    "curvycry.com": "Leven Labs, Inc. DBA Admiral",
    "cushionpig.com": "Leven Labs, Inc. DBA Admiral",
    "cutechin.com": "Leven Labs, Inc. DBA Admiral",
    "damageddistance.com": "Leven Labs, Inc. DBA Admiral",
    "damdoor.com": "Leven Labs, Inc. DBA Admiral",
    "dampdock.com": "Leven Labs, Inc. DBA Admiral",
    "dapperfloor.com": "Leven Labs, Inc. DBA Admiral",
    "debonairdust.com": "Leven Labs, Inc. DBA Admiral",
    "decisivebase.com": "Leven Labs, Inc. DBA Admiral",
    "decisivedrawer.com": "Leven Labs, Inc. DBA Admiral",
    "decisiveducks.com": "Leven Labs, Inc. DBA Admiral",
    "detailedkitten.com": "Leven Labs, Inc. DBA Admiral",
    "detectdiscovery.com": "Leven Labs, Inc. DBA Admiral",
    "diplomahawaii.com": "Leven Labs, Inc. DBA Admiral",
    "discreetfield.com": "Leven Labs, Inc. DBA Admiral",
    "dk4ywix.com": "Leven Labs, Inc. DBA Admiral",
    "dockdigestion.com": "Leven Labs, Inc. DBA Admiral",
    "dollardelta.com": "Leven Labs, Inc. DBA Admiral",
    "dq95d35.com": "Leven Labs, Inc. DBA Admiral",
    "dramaticdirection.com": "Leven Labs, Inc. DBA Admiral",
    "elasticchange.com": "Leven Labs, Inc. DBA Admiral",
    "energeticladybug.com": "Leven Labs, Inc. DBA Admiral",
    "enormousearth.com": "Leven Labs, Inc. DBA Admiral",
    "enviousshape.com": "Leven Labs, Inc. DBA Admiral",
    "evanescentedge.com": "Leven Labs, Inc. DBA Admiral",
    "fadedsnow.com": "Leven Labs, Inc. DBA Admiral",
    "fadewaves.com": "Leven Labs, Inc. DBA Admiral",
    "fallaciousfifth.com": "Leven Labs, Inc. DBA Admiral",
    "fancyactivity.com": "Leven Labs, Inc. DBA Admiral",
    "farmergoldfish.com": "Leven Labs, Inc. DBA Admiral",
    "farshake.com": "Leven Labs, Inc. DBA Admiral",
    "fastenfather.com": "Leven Labs, Inc. DBA Admiral",
    "fatcoil.com": "Leven Labs, Inc. DBA Admiral",
    "faultycanvas.com": "Leven Labs, Inc. DBA Admiral",
    "fearlessfaucet.com": "Leven Labs, Inc. DBA Admiral",
    "firstfrogs.com": "Leven Labs, Inc. DBA Admiral",
    "flimsycircle.com": "Leven Labs, Inc. DBA Admiral",
    "flimsythought.com": "Leven Labs, Inc. DBA Admiral",
    "frailfruit.com": "Leven Labs, Inc. DBA Admiral",
    "friendwool.com": "Leven Labs, Inc. DBA Admiral",
    "fumblingform.com": "Leven Labs, Inc. DBA Admiral",
    "futuristicfifth.com": "Leven Labs, Inc. DBA Admiral",
    "fuzzybasketball.com": "Leven Labs, Inc. DBA Admiral",
    "gammamaximum.com": "Leven Labs, Inc. DBA Admiral",
    "giraffepiano.com": "Leven Labs, Inc. DBA Admiral",
    "glisteningguide.com": "Leven Labs, Inc. DBA Admiral",
    "gloriousbeef.com": "Leven Labs, Inc. DBA Admiral",
    "gondolagnome.com": "Leven Labs, Inc. DBA Admiral",
    "grayreceipt.com": "Leven Labs, Inc. DBA Admiral",
    "greasysquare.com": "Leven Labs, Inc. DBA Admiral",
    "grouchypush.com": "Leven Labs, Inc. DBA Admiral",
    "guiltlessbasketball.com": "Leven Labs, Inc. DBA Admiral",
    "haltingbadge.com": "Leven Labs, Inc. DBA Admiral",
    "haltinggold.com": "Leven Labs, Inc. DBA Admiral",
    "hammerhearing.com": "Leven Labs, Inc. DBA Admiral",
    "handyfireman.com": "Leven Labs, Inc. DBA Admiral",
    "hearthorn.com": "Leven Labs, Inc. DBA Admiral",
    "historicalbeam.com": "Leven Labs, Inc. DBA Admiral",
    "hocgeese.com": "Leven Labs, Inc. DBA Admiral",
    "hollowafterthought.com": "Leven Labs, Inc. DBA Admiral",
    "honorableland.com": "Leven Labs, Inc. DBA Admiral",
    "horsenectar.com": "Leven Labs, Inc. DBA Admiral",
    "hystericalcloth.com": "Leven Labs, Inc. DBA Admiral",
    "impossibleexpansion.com": "Leven Labs, Inc. DBA Admiral",
    "impulsejewel.com": "Leven Labs, Inc. DBA Admiral",
    "incompetentjoke.com": "Leven Labs, Inc. DBA Admiral",
    "internalsink.com": "Leven Labs, Inc. DBA Admiral",
    "j93557g.com": "Leven Labs, Inc. DBA Admiral",
    "lameletters.com": "Leven Labs, Inc. DBA Admiral",
    "laughablelizards.com": "Leven Labs, Inc. DBA Admiral",
    "livelumber.com": "Leven Labs, Inc. DBA Admiral",
    "livelylaugh.com": "Leven Labs, Inc. DBA Admiral",
    "lorenzourban.com": "Leven Labs, Inc. DBA Admiral",
    "lovelydrum.com": "Leven Labs, Inc. DBA Admiral",
    "lumpylumber.com": "Leven Labs, Inc. DBA Admiral",
    "maddeningpowder.com": "Leven Labs, Inc. DBA Admiral",
    "meatydime.com": "Leven Labs, Inc. DBA Admiral",
    "memorizeneck.com": "Leven Labs, Inc. DBA Admiral",
    "mightyspiders.com": "Leven Labs, Inc. DBA Admiral",
    "mixedreading.com": "Leven Labs, Inc. DBA Admiral",
    "modularmental.com": "Leven Labs, Inc. DBA Admiral",
    "motionlessbag.com": "Leven Labs, Inc. DBA Admiral",
    "movemeal.com": "Leven Labs, Inc. DBA Admiral",
    "nappyattack.com": "Leven Labs, Inc. DBA Admiral",
    "nervoussummer.com": "Leven Labs, Inc. DBA Admiral",
    "nondescriptcrowd.com": "Leven Labs, Inc. DBA Admiral",
    "nondescriptnote.com": "Leven Labs, Inc. DBA Admiral",
    "nostalgicneed.com": "Leven Labs, Inc. DBA Admiral",
    "nuttyorganization.com": "Leven Labs, Inc. DBA Admiral",
    "optimallimit.com": "Leven Labs, Inc. DBA Admiral",
    "outstandingincome.com": "Leven Labs, Inc. DBA Admiral",
    "outstandingsnails.com": "Leven Labs, Inc. DBA Admiral",
    "overconfidentfood.com": "Leven Labs, Inc. DBA Admiral",
    "panickycurtain.com": "Leven Labs, Inc. DBA Admiral",
    "panickypancake.com": "Leven Labs, Inc. DBA Admiral",
    "parchedsofa.com": "Leven Labs, Inc. DBA Admiral",
    "partplanes.com": "Leven Labs, Inc. DBA Admiral",
    "petiteumbrella.com": "Leven Labs, Inc. DBA Admiral",
    "placidperson.com": "Leven Labs, Inc. DBA Admiral",
    "plantdigestion.com": "Leven Labs, Inc. DBA Admiral",
    "pleasantpump.com": "Leven Labs, Inc. DBA Admiral",
    "plotrabbit.com": "Leven Labs, Inc. DBA Admiral",
    "pluckypocket.com": "Leven Labs, Inc. DBA Admiral",
    "possibleboats.com": "Leven Labs, Inc. DBA Admiral",
    "prepareplanes.com": "Leven Labs, Inc. DBA Admiral",
    "pricklydebt.com": "Leven Labs, Inc. DBA Admiral",
    "profusesupport.com": "Leven Labs, Inc. DBA Admiral",
    "puffypurpose.com": "Leven Labs, Inc. DBA Admiral",
    "punyplant.com": "Leven Labs, Inc. DBA Admiral",
    "quietknowledge.com": "Leven Labs, Inc. DBA Admiral",
    "quizzicalzephyr.com": "Leven Labs, Inc. DBA Admiral",
    "rabbitbreath.com": "Leven Labs, Inc. DBA Admiral",
    "rabbitrifle.com": "Leven Labs, Inc. DBA Admiral",
    "railwayreason.com": "Leven Labs, Inc. DBA Admiral",
    "raintwig.com": "Leven Labs, Inc. DBA Admiral",
    "rainyhand.com": "Leven Labs, Inc. DBA Admiral",
    "rainyrule.com": "Leven Labs, Inc. DBA Admiral",
    "rangecake.com": "Leven Labs, Inc. DBA Admiral",
    "raresummer.com": "Leven Labs, Inc. DBA Admiral",
    "readymoon.com": "Leven Labs, Inc. DBA Admiral",
    "rebelsubway.com": "Leven Labs, Inc. DBA Admiral",
    "receptivereaction.com": "Leven Labs, Inc. DBA Admiral",
    "reconditerake.com": "Leven Labs, Inc. DBA Admiral",
    "reconditerespect.com": "Leven Labs, Inc. DBA Admiral",
    "regularplants.com": "Leven Labs, Inc. DBA Admiral",
    "repeatsweater.com": "Leven Labs, Inc. DBA Admiral",
    "replaceroute.com": "Leven Labs, Inc. DBA Admiral",
    "resonantbrush.com": "Leven Labs, Inc. DBA Admiral",
    "resonantrock.com": "Leven Labs, Inc. DBA Admiral",
    "respectrain.com": "Leven Labs, Inc. DBA Admiral",
    "rhetoricalloss.com": "Leven Labs, Inc. DBA Admiral",
    "richstring.com": "Leven Labs, Inc. DBA Admiral",
    "rightfulfall.com": "Leven Labs, Inc. DBA Admiral",
    "roofrelation.com": "Leven Labs, Inc. DBA Admiral",
    "rusticprice.com": "Leven Labs, Inc. DBA Admiral",
    "sablesong.com": "Leven Labs, Inc. DBA Admiral",
    "samestretch.com": "Leven Labs, Inc. DBA Admiral",
    "satisfycork.com": "Leven Labs, Inc. DBA Admiral",
    "savoryorange.com": "Leven Labs, Inc. DBA Admiral",
    "scaredcomfort.com": "Leven Labs, Inc. DBA Admiral",
    "scaredsnake.com": "Leven Labs, Inc. DBA Admiral",
    "scarfsmash.com": "Leven Labs, Inc. DBA Admiral",
    "scatteredstream.com": "Leven Labs, Inc. DBA Admiral",
    "scientificshirt.com": "Leven Labs, Inc. DBA Admiral",
    "scintillatingscissors.com": "Leven Labs, Inc. DBA Admiral",
    "scintillatingsilver.com": "Leven Labs, Inc. DBA Admiral",
    "screechingfurniture.com": "Leven Labs, Inc. DBA Admiral",
    "screechingstove.com": "Leven Labs, Inc. DBA Admiral",
    "seashoresociety.com": "Leven Labs, Inc. DBA Admiral",
    "seatsmoke.com": "Leven Labs, Inc. DBA Admiral",
    "secretturtle.com": "Leven Labs, Inc. DBA Admiral",
    "selectivesummer.com": "Leven Labs, Inc. DBA Admiral",
    "selfishsnake.com": "Leven Labs, Inc. DBA Admiral",
    "shakegoldfish.com": "Leven Labs, Inc. DBA Admiral",
    "shesubscriptions.com": "Leven Labs, Inc. DBA Admiral",
    "shockingship.com": "Leven Labs, Inc. DBA Admiral",
    "shrillspoon.com": "Leven Labs, Inc. DBA Admiral",
    "sicksmash.com": "Leven Labs, Inc. DBA Admiral",
    "sillyscrew.com": "Leven Labs, Inc. DBA Admiral",
    "sincerebuffalo.com": "Leven Labs, Inc. DBA Admiral",
    "sinceresubstance.com": "Leven Labs, Inc. DBA Admiral",
    "singroot.com": "Leven Labs, Inc. DBA Admiral",
    "sixscissors.com": "Leven Labs, Inc. DBA Admiral",
    "skillfuldrop.com": "Leven Labs, Inc. DBA Admiral",
    "smashsurprise.com": "Leven Labs, Inc. DBA Admiral",
    "smoggysnakes.com": "Leven Labs, Inc. DBA Admiral",
    "soggysponge.com": "Leven Labs, Inc. DBA Admiral",
    "somberscarecrow.com": "Leven Labs, Inc. DBA Admiral",
    "sortsail.com": "Leven Labs, Inc. DBA Admiral",
    "sortsummer.com": "Leven Labs, Inc. DBA Admiral",
    "spellsalsa.com": "Leven Labs, Inc. DBA Admiral",
    "spookysleet.com": "Leven Labs, Inc. DBA Admiral",
    "spotlessstamp.com": "Leven Labs, Inc. DBA Admiral",
    "spottednoise.com": "Leven Labs, Inc. DBA Admiral",
    "stakingsmile.com": "Leven Labs, Inc. DBA Admiral",
    "stalesummer.com": "Leven Labs, Inc. DBA Admiral",
    "steadfastseat.com": "Leven Labs, Inc. DBA Admiral",
    "steadfastsound.com": "Leven Labs, Inc. DBA Admiral",
    "steadfastsystem.com": "Leven Labs, Inc. DBA Admiral",
    "steadycopper.com": "Leven Labs, Inc. DBA Admiral",
    "steepsquirrel.com": "Leven Labs, Inc. DBA Admiral",
    "stepplane.com": "Leven Labs, Inc. DBA Admiral",
    "stereoproxy.com": "Leven Labs, Inc. DBA Admiral",
    "stereotypedsugar.com": "Leven Labs, Inc. DBA Admiral",
    "stiffgame.com": "Leven Labs, Inc. DBA Admiral",
    "straightnest.com": "Leven Labs, Inc. DBA Admiral",
    "strangesink.com": "Leven Labs, Inc. DBA Admiral",
    "stretchsister.com": "Leven Labs, Inc. DBA Admiral",
    "strivesidewalk.com": "Leven Labs, Inc. DBA Admiral",
    "stupendoussleet.com": "Leven Labs, Inc. DBA Admiral",
    "stupendoussnow.com": "Leven Labs, Inc. DBA Admiral",
    "sulkycook.com": "Leven Labs, Inc. DBA Admiral",
    "superficialeyes.com": "Leven Labs, Inc. DBA Admiral",
    "superficialspring.com": "Leven Labs, Inc. DBA Admiral",
    "superficialsquare.com": "Leven Labs, Inc. DBA Admiral",
    "swellstocking.com": "Leven Labs, Inc. DBA Admiral",
    "synonymousrule.com": "Leven Labs, Inc. DBA Admiral",
    "tastelesstrees.com": "Leven Labs, Inc. DBA Admiral",
    "teenytinycellar.com": "Leven Labs, Inc. DBA Admiral",
    "teenytinyshirt.com": "Leven Labs, Inc. DBA Admiral",
    "teenytinytongue.com": "Leven Labs, Inc. DBA Admiral",
    "terriblethumb.com": "Leven Labs, Inc. DBA Admiral",
    "thirdrespect.com": "Leven Labs, Inc. DBA Admiral",
    "thomastorch.com": "Leven Labs, Inc. DBA Admiral",
    "threetruck.com": "Leven Labs, Inc. DBA Admiral",
    "ticketaunt.com": "Leven Labs, Inc. DBA Admiral",
    "tiresomethunder.com": "Leven Labs, Inc. DBA Admiral",
    "tremendousplastic.com": "Leven Labs, Inc. DBA Admiral",
    "troubledtail.com": "Leven Labs, Inc. DBA Admiral",
    "typicalairplane.com": "Leven Labs, Inc. DBA Admiral",
    "typicalteeth.com": "Leven Labs, Inc. DBA Admiral",
    "ubiquitousyard.com": "Leven Labs, Inc. DBA Admiral",
    "ultraoranges.com": "Leven Labs, Inc. DBA Admiral",
    "unbecominghall.com": "Leven Labs, Inc. DBA Admiral",
    "uncoveredexpert.com": "Leven Labs, Inc. DBA Admiral",
    "unequalbrake.com": "Leven Labs, Inc. DBA Admiral",
    "uninterestedquarter.com": "Leven Labs, Inc. DBA Admiral",
    "unknowncrate.com": "Leven Labs, Inc. DBA Admiral",
    "untidyrice.com": "Leven Labs, Inc. DBA Admiral",
    "unusedstone.com": "Leven Labs, Inc. DBA Admiral",
    "unwieldyhealth.com": "Leven Labs, Inc. DBA Admiral",
    "venusgloria.com": "Leven Labs, Inc. DBA Admiral",
    "verdantanswer.com": "Leven Labs, Inc. DBA Admiral",
    "voraciousgrip.com": "Leven Labs, Inc. DBA Admiral",
    "warmafterthought.com": "Leven Labs, Inc. DBA Admiral",
    "warmquiver.com": "Leven Labs, Inc. DBA Admiral",
    "wearbasin.com": "Leven Labs, Inc. DBA Admiral",
    "zestycrime.com": "Leven Labs, Inc. DBA Admiral",
    "abtasty.com": "Liwio",
    "accengage.net": "Accengage",
    "notification.group": "Accengage",
    "acdn.no": "Amedia Utvikling AS",
    "api.no": "Amedia Utvikling AS",
    "acexedge.com": "Human Security, Inc.",
    "adlookr.com": "Human Security, Inc.",
    "admathhd.com": "Human Security, Inc.",
    "adnxtr.com": "Human Security, Inc.",
    "adsrvs.com": "Human Security, Inc.",
    "adsximg.com": "Human Security, Inc.",
    "adxyield.com": "Human Security, Inc.",
    "adzmath.com": "Human Security, Inc.",
    "clcktrax.com": "Human Security, Inc.",
    "iaudienc.com": "Human Security, Inc.",
    "imgsynd.com": "Human Security, Inc.",
    "mrmserve.com": "Human Security, Inc.",
    "ninjapd.com": "Human Security, Inc.",
    "pkthop.com": "Human Security, Inc.",
    "pxltgr.com": "Human Security, Inc.",
    "srvmath.com": "Human Security, Inc.",
    "tagsrvcs.com": "Human Security, Inc.",
    "tpctrust.com": "Human Security, Inc.",
    "tworismo.com": "Human Security, Inc.",
    "whiteops.com": "Human Security, Inc.",
    "acint.net": "Poshibalov Evgeny Vasilyevich",
    "accu-chek.com": "Acquia, Inc",
    "acquia-sites.com": "Acquia, Inc",
    "acquia.com": "Acquia, Inc",
    "cityofirvine.org": "Acquia, Inc",
    "e3develop.com": "Acquia, Inc",
    "flydulles.com": "Acquia, Inc",
    "gpb.org": "Acquia, Inc",
    "guterrat.de": "Acquia, Inc",
    "hamilton.ca": "Acquia, Inc",
    "healthtalk.org": "Acquia, Inc",
    "stonybrook.edu": "Acquia, Inc",
    "thebookseller.com": "Acquia, Inc",
    "acuityads.com": "AcuityAds",
    "acuityplatform.com": "AcuityAds",
    "ad-score.com": "Adscore Technologies DMCC",
    "adsco.re": "Adscore Technologies DMCC",
    "adscore.com": "Adscore Technologies DMCC",
    "ad-stir.com": "Yozo, Kaneko",
    "ad4m.at": "advanced STORE GmbH",
    "ad4mat.net": "advanced STORE GmbH",
    "ada.cx": "Ada Support Inc.",
    "ada.support": "Ada Support Inc.",
    "adalyser.com": "OneSoon Ltd",
    "adblade.com": "Congoo, LLC",
    "solvemedia.com": "Congoo, LLC",
    "addthis.com": "Oracle Corporation",
    "addthiscdn.com": "Oracle Corporation",
    "addthisedge.com": "Oracle Corporation",
    "adrsp.net": "Oracle Corporation",
    "atgsvcs.com": "Oracle Corporation",
    "bkrtx.com": "Oracle Corporation",
    "bluekai.com": "Oracle Corporation",
    "bm23.com": "Oracle Corporation",
    "bronto.com": "Oracle Corporation",
    "clearspring.com": "Oracle Corporation",
    "compendium.com": "Oracle Corporation",
    "compendiumblog.com": "Oracle Corporation",
    "custhelp.com": "Oracle Corporation",
    "datalogix.com": "Oracle Corporation",
    "eloqua.com": "Oracle Corporation",
    "en25.com": "Oracle Corporation",
    "estara.com": "Oracle Corporation",
    "grapeshot.co.uk": "Oracle Corporation",
    "homeip.net": "Oracle Corporation",
    "java.com": "Oracle Corporation",
    "java.net": "Oracle Corporation",
    "livelook.com": "Oracle Corporation",
    "maxymiser.net": "Oracle Corporation",
    "moat.com": "Oracle Corporation",
    "moatads.com": "Oracle Corporation",
    "moatpixel.com": "Oracle Corporation",
    "mysql.com": "Oracle Corporation",
    "netbeans.org": "Oracle Corporation",
    "netsuite.com": "Oracle Corporation",
    "nexac.com": "Oracle Corporation",
    "oracle.com": "Oracle Corporation",
    "oraclecloud.com": "Oracle Corporation",
    "oracleimg.com": "Oracle Corporation",
    "oracleinfinity.com": "Oracle Corporation",
    "oracleinfinity.io": "Oracle Corporation",
    "oracleoutsourcing.com": "Oracle Corporation",
    "q-go.net": "Oracle Corporation",
    "responsys.net": "Oracle Corporation",
    "rightnow.com": "Oracle Corporation",
    "rightnowtech.com": "Oracle Corporation",
    "rnengage.com": "Oracle Corporation",
    "univide.com": "Oracle Corporation",
    "virtualbox.org": "Oracle Corporation",
    "addtoany.com": "AddToAny",
    "adelixir.com": "NetElixir, Inc.",
    "netelixir.com": "NetElixir, Inc.",
    "adentifi.com": "AdTheorent Inc",
    "adextrem.com": "ORCHID MEDIA Limited",
    "adform.net": "Adform A/S",
    "adformdsp.net": "Adform A/S",
    "adfox.me": "Yandex LLC",
    "adfox.ru": "Yandex LLC",
    "admetrica.ru": "Yandex LLC",
    "auto.ru": "Yandex LLC",
    "eda.yandex": "Yandex LLC",
    "kinopoisk.ru": "Yandex LLC",
    "loginza.ru": "Yandex LLC",
    "metrika-informer.com": "Yandex LLC",
    "webvisor.org": "Yandex LLC",
    "ya.ru": "Yandex LLC",
    "yandex.by": "Yandex LLC",
    "yandex.com": "Yandex LLC",
    "yandex.com.tr": "Yandex LLC",
    "yandex.net": "Yandex LLC",
    "yandex.ru": "Yandex LLC",
    "yandex.st": "Yandex LLC",
    "yandex.sx": "Yandex LLC",
    "yandex.ua": "Yandex LLC",
    "yastatic.net": "Yandex LLC",
    "ymetrica1.com": "Yandex LLC",
    "adgear.com": "AdGear Technologies Inc.",
    "adgrx.com": "AdGear Technologies Inc.",
    "adhese.com": "Doggybites bvba",
    "adhigh.net": "GetIntent",
    "getintent.com": "GetIntent",
    "adingo.jp": "fluct,Inc.",
    "adclear.net": "Virtual Minds AG",
    "adition.com": "Virtual Minds AG",
    "batch.ba": "Virtual Minds AG",
    "movad.net": "Virtual Minds AG",
    "t4ft.de": "Virtual Minds AG",
    "theadex.com": "Virtual Minds AG",
    "virtualminds.de": "Virtual Minds AG",
    "vm.de": "Virtual Minds AG",
    "yieldlab.com": "Virtual Minds AG",
    "yieldlab.de": "Virtual Minds AG",
    "yieldlab.net": "Virtual Minds AG",
    "adj.st": "Adjust GmbH",
    "adjust.cn": "Adjust GmbH",
    "adjust.com": "Adjust GmbH",
    "adjust.io": "Adjust GmbH",
    "adjust.net.in": "Adjust GmbH",
    "adjust.world": "Adjust GmbH",
    "apptrace.com": "Adjust GmbH",
    "go.link": "Adjust GmbH",
    "adkernel.com": "Adkernel, LLC",
    "adligature.com": "The Bishop Way, Inc.",
    "adlightning.com": "Ad Lightning, Inc.",
    "adloox.com": "Adloox SAS",
    "adloox.io": "Adloox SAS",
    "adlooxtracking.com": "Adloox SAS",
    "admanmedia.com": "ADman Media",
    "a8723.com": "Admedo",
    "adizio.com": "Admedo",
    "admedo.com": "Admedo",
    "admixer.net": "Admixer Technologies",
    "adnami.io": "Adnami ApS",
    "247realmedia.com": "WarnerMedia, LLC",
    "adamruinseverything.com": "WarnerMedia, LLC",
    "adnxs.com": "WarnerMedia, LLC",
    "adultswim.com": "WarnerMedia, LLC",
    "adventuretime.com": "WarnerMedia, LLC",
    "bleacherreport.net": "WarnerMedia, LLC",
    "cartoonnetwork.com": "WarnerMedia, LLC",
    "cartoonnetworkhotel.com": "WarnerMedia, LLC",
    "chasingthecurelive.com": "WarnerMedia, LLC",
    "cnn.com": "WarnerMedia, LLC",
    "cnn.io": "WarnerMedia, LLC",
    "cnnarabic.com": "WarnerMedia, LLC",
    "cnnlabs.com": "WarnerMedia, LLC",
    "cnnmoney.ch": "WarnerMedia, LLC",
    "cnnmoney.com": "WarnerMedia, LLC",
    "cnnmoneystream.com": "WarnerMedia, LLC",
    "cnnphilippines.com": "WarnerMedia, LLC",
    "cnnpolitics.com": "WarnerMedia, LLC",
    "cwtv.com": "WarnerMedia, LLC",
    "dccomics.com": "WarnerMedia, LLC",
    "extratv.com": "WarnerMedia, LLC",
    "fantasticbeasts.com": "WarnerMedia, LLC",
    "filmstruck.com": "WarnerMedia, LLC",
    "getmetohollywood.com": "WarnerMedia, LLC",
    "greatbig.com": "WarnerMedia, LLC",
    "greatbigstory.com": "WarnerMedia, LLC",
    "greatbigstory.se": "WarnerMedia, LLC",
    "heaveninc.com": "WarnerMedia, LLC",
    "hitman.com": "WarnerMedia, LLC",
    "iamthenight.com": "WarnerMedia, LLC",
    "impracticaljokers.com": "WarnerMedia, LLC",
    "impracticaljokersmovie.com": "WarnerMedia, LLC",
    "impracticaljokersthemovie.com": "WarnerMedia, LLC",
    "jokersmovie.com": "WarnerMedia, LLC",
    "ml-attr.com": "WarnerMedia, LLC",
    "ncaa.com": "WarnerMedia, LLC",
    "ngtv.io": "WarnerMedia, LLC",
    "outturner.com": "WarnerMedia, LLC",
    "pga.com": "WarnerMedia, LLC",
    "powerpuffgirls.com": "WarnerMedia, LLC",
    "realmedia.com": "WarnerMedia, LLC",
    "samanthabee.com": "WarnerMedia, LLC",
    "sambee.com": "WarnerMedia, LLC",
    "shaqtoons.com": "WarnerMedia, LLC",
    "stevenuniversethemovie.com": "WarnerMedia, LLC",
    "summercampisland.com": "WarnerMedia, LLC",
    "superstation.com": "WarnerMedia, LLC",
    "tbs.com": "WarnerMedia, LLC",
    "tcm.com": "WarnerMedia, LLC",
    "telepicturestv.com": "WarnerMedia, LLC",
    "thealienist.com": "WarnerMedia, LLC",
    "tmz.com": "WarnerMedia, LLC",
    "tntdrama.com": "WarnerMedia, LLC",
    "toofab.com": "WarnerMedia, LLC",
    "trutv.com": "WarnerMedia, LLC",
    "turner.com": "WarnerMedia, LLC",
    "ugdturner.com": "WarnerMedia, LLC",
    "warnerbros.com": "WarnerMedia, LLC",
    "warnermediafitnation.com": "WarnerMedia, LLC",
    "warnermediagroup.com": "WarnerMedia, LLC",
    "warnermediaready.com": "WarnerMedia, LLC",
    "warnermediasupplierdiversity.com": "WarnerMedia, LLC",
    "wbdtv.com": "WarnerMedia, LLC",
    "wbstudiotour.co.uk": "WarnerMedia, LLC",
    "webarebears.com": "WarnerMedia, LLC",
    "wilfordindustries.com": "WarnerMedia, LLC",
    "wmcdp.io": "WarnerMedia, LLC",
    "yieldoptimizer.com": "WarnerMedia, LLC",
    "adnz.co": "audienzz AG",
    "audienzz.ch": "audienzz AG",
    "danzz.ch": "audienzz AG",
    "nzz-tech.ch": "audienzz AG",
    "nzz.ch": "audienzz AG",
    "static-nzz.ch": "audienzz AG",
    "adotmob.com": "A.Mob SAS",
    "adpartner.pro": "LTD &quot;ADPARTNER&quot;",
    "adpushup.com": "CacheNetworks, LLC",
    "adrecover.com": "CacheNetworks, LLC",
    "ambient-platform.com": "CacheNetworks, LLC",
    "arstechnica.net": "CacheNetworks, LLC",
    "cachefly.com": "CacheNetworks, LLC",
    "cachefly.net": "CacheNetworks, LLC",
    "gsfn.us": "CacheNetworks, LLC",
    "m-pathy.com": "CacheNetworks, LLC",
    "murdoog.com": "CacheNetworks, LLC",
    "od-cdn.com": "CacheNetworks, LLC",
    "sedoparking.com": "CacheNetworks, LLC",
    "smart-digital-solutions.com": "CacheNetworks, LLC",
    "tagcade.com": "CacheNetworks, LLC",
    "yandycdn.com": "CacheNetworks, LLC",
    "adriver.ru": "LLC \"Internest-holding\"",
    "soloway.ru": "LLC \"Internest-holding\"",
    "adroll.com": "AdRoll, Inc.",
    "adrta.com": "Pixalate, Inc.",
    "pixalate.com": "Pixalate, Inc.",
    "ads-twitter.com": "Twitter, Inc.",
    "cms-twdigitalassets.com": "Twitter, Inc.",
    "mopub.com": "Twitter, Inc.",
    "periscope.tv": "Twitter, Inc.",
    "pscp.tv": "Twitter, Inc.",
    "t.co": "Twitter, Inc.",
    "twimg.com": "Twitter, Inc.",
    "twitter.com": "Twitter, Inc.",
    "twitter.fr": "Twitter, Inc.",
    "twittercommunity.com": "Twitter, Inc.",
    "twttr.com": "Twitter, Inc.",
    "twttr.net": "Twitter, Inc.",
    "vine.co": "Twitter, Inc.",
    "ads1-adnow.com": "Mas Capital Group Ltd",
    "ads2-adnow.com": "Mas Capital Group Ltd",
    "ads3-adnow.com": "Mas Capital Group Ltd",
    "lcads.ru": "Mas Capital Group Ltd",
    "adsafeprotected.com": "Integral Ad Science, Inc.",
    "iasds01.com": "Integral Ad Science, Inc.",
    "adscale.de": "Ströer Group",
    "interactivemedia.net": "Ströer Group",
    "m6r.eu": "Ströer Group",
    "stroeerdigitalgroup.de": "Ströer Group",
    "stroeerdigitalmedia.de": "Ströer Group",
    "stroeerdp.de": "Ströer Group",
    "stroeermediabrands.de": "Ströer Group",
    "adspeed.net": "ADSPEED.COM",
    "adsrvr.org": "The Trade Desk Inc",
    "adstanding.com": "AdStanding",
    "atedra.com": "AdStanding",
    "adtarget.com.tr": "AdTarget Medya A.Ş.",
    "adtelligent.com": "Adtelligent Inc.",
    "vertamedia.com": "Adtelligent Inc.",
    "adthrive.com": "AdThrive, LLC",
    "adtlgc.com": "Enreach Solutions Oy",
    "adtng.com": "MindGeek",
    "adultforce.com": "MindGeek",
    "babes.com": "MindGeek",
    "babescontent.com": "MindGeek",
    "brazzers.com": "MindGeek",
    "brazzerscontent.com": "MindGeek",
    "contentabc.com": "MindGeek",
    "czechhunter.com": "MindGeek",
    "digitalplayground.com": "MindGeek",
    "dplaygroundcontent.com": "MindGeek",
    "etahub.com": "MindGeek",
    "fakehub.com": "MindGeek",
    "faketaxi.com": "MindGeek",
    "gaytube.com": "MindGeek",
    "hubtraffic.com": "MindGeek",
    "men.com": "MindGeek",
    "mencontent.com": "MindGeek",
    "modelhub.com": "MindGeek",
    "mofos.com": "MindGeek",
    "mofoscontent.com": "MindGeek",
    "momxxx.com": "MindGeek",
    "phncdn.com": "MindGeek",
    "pornhub.com": "MindGeek",
    "pornhubpremium.com": "MindGeek",
    "pornhubselect.com": "MindGeek",
    "pornmd.com": "MindGeek",
    "rdtcdn.com": "MindGeek",
    "realitykings.com": "MindGeek",
    "realitykingscontent.com": "MindGeek",
    "redtube.com": "MindGeek",
    "redtube.com.br": "MindGeek",
    "seancody.com": "MindGeek",
    "seancodycontent.com": "MindGeek",
    "t8cdn.com": "MindGeek",
    "thumbzilla.com": "MindGeek",
    "trafficjunky.com": "MindGeek",
    "trafficjunky.net": "MindGeek",
    "transangels.com": "MindGeek",
    "tube8.com": "MindGeek",
    "twistys.com": "MindGeek",
    "twistyscontent.com": "MindGeek",
    "xtube.com": "MindGeek",
    "youporn.com": "MindGeek",
    "youporngay.com": "MindGeek",
    "ypncdn.com": "MindGeek",
    "adtr.io": "Adtraction Marketing AB",
    "adtraction.com": "Adtraction Marketing AB",
    "advangelists.com": "Mobiquity Inc.",
    "mobiquity.com": "Mobiquity Inc.",
    "mobiquityinc.com": "Mobiquity Inc.",
    "adventive.com": "Adventive, Inc.",
    "adventori.com": "Adventori",
    "24-7.pet": "Verizon Media",
    "247.vacations": "Verizon Media",
    "5min.com": "Verizon Media",
    "5to1.com": "Verizon Media",
    "aabacosmallbusiness.com": "Verizon Media",
    "ad.com": "Verizon Media",
    "adap.tv": "Verizon Media",
    "adsonar.com": "Verizon Media",
    "adtech.de": "Verizon Media",
    "adtechjp.com": "Verizon Media",
    "adtechus.com": "Verizon Media",
    "advertising.com": "Verizon Media",
    "ahoo.com": "Verizon Media",
    "alephd.com": "Verizon Media",
    "alfrasha.com": "Verizon Media",
    "alltheweb.com": "Verizon Media",
    "altavista.com": "Verizon Media",
    "anyprice.com": "Verizon Media",
    "aol.ca": "Verizon Media",
    "aol.co.uk": "Verizon Media",
    "aol.com": "Verizon Media",
    "aol.de": "Verizon Media",
    "aol.fr": "Verizon Media",
    "aol.jp": "Verizon Media",
    "aolcdn.com": "Verizon Media",
    "aolp.jp": "Verizon Media",
    "aolsearch.com": "Verizon Media",
    "atdn.net": "Verizon Media",
    "athenz.cloud": "Verizon Media",
    "athenz.io": "Verizon Media",
    "athenz.net": "Verizon Media",
    "athenz.org": "Verizon Media",
    "atwola.com": "Verizon Media",
    "autoblog.com": "Verizon Media",
    "autos.parts": "Verizon Media",
    "autos24-7.com": "Verizon Media",
    "baby.guide": "Verizon Media",
    "blogsmithmedia.com": "Verizon Media",
    "bluelithium.com": "Verizon Media",
    "brightroll.com": "Verizon Media",
    "btrll.com": "Verizon Media",
    "buildseries.com": "Verizon Media",
    "cashay.com": "Verizon Media",
    "chowist.com": "Verizon Media",
    "citypedia.com": "Verizon Media",
    "contactnumberyahoosupport.com": "Verizon Media",
    "contactyahoosupport.com": "Verizon Media",
    "contactyahoosupport.us": "Verizon Media",
    "convertro.com": "Verizon Media",
    "couponbear.com": "Verizon Media",
    "diylife.com": "Verizon Media",
    "dvd4arab.com": "Verizon Media",
    "engadget.com": "Verizon Media",
    "enow.com": "Verizon Media",
    "fashion.life": "Verizon Media",
    "fast.rentals": "Verizon Media",
    "find.furniture": "Verizon Media",
    "flurry.com": "Verizon Media",
    "foodbegood.com": "Verizon Media",
    "furniture.deals": "Verizon Media",
    "gamer.site": "Verizon Media",
    "geocities.com": "Verizon Media",
    "glamorbank.com": "Verizon Media",
    "going.com": "Verizon Media",
    "golocal.guru": "Verizon Media",
    "greendaily.com": "Verizon Media",
    "health.zone": "Verizon Media",
    "health247.com": "Verizon Media",
    "homesessive.com": "Verizon Media",
    "hostingprod.com": "Verizon Media",
    "housingwatch.com": "Verizon Media",
    "insurance24-7.com": "Verizon Media",
    "intoautos.com": "Verizon Media",
    "job-sift.com": "Verizon Media",
    "joystiq.com": "Verizon Media",
    "jsyk.com": "Verizon Media",
    "kimo.com": "Verizon Media",
    "kimo.com.tw": "Verizon Media",
    "kitchepedia.com": "Verizon Media",
    "know-legal.com": "Verizon Media",
    "launch.com": "Verizon Media",
    "learn-247.com": "Verizon Media",
    "lexity.com": "Verizon Media",
    "love.com": "Verizon Media",
    "luminate.com": "Verizon Media",
    "luxist.com": "Verizon Media",
    "majdah.com": "Verizon Media",
    "makers.com": "Verizon Media",
    "makersconference.com": "Verizon Media",
    "maktoob.com": "Verizon Media",
    "maktoobblog.com": "Verizon Media",
    "money-a2z.com": "Verizon Media",
    "mqcdn.com": "Verizon Media",
    "mybloglog.com": "Verizon Media",
    "mydaily.com": "Verizon Media",
    "netdeals.com": "Verizon Media",
    "netfind.com": "Verizon Media",
    "netscape.com": "Verizon Media",
    "nexage.com": "Verizon Media",
    "oath.cloud": "Verizon Media",
    "oath.com": "Verizon Media",
    "oathadplatform.com": "Verizon Media",
    "oathadplatforms.com": "Verizon Media",
    "oathssp.com": "Verizon Media",
    "ouroath.com": "Verizon Media",
    "overture.com": "Verizon Media",
    "parentdish.ca": "Verizon Media",
    "pets.world": "Verizon Media",
    "pictela.net": "Verizon Media",
    "pollster.com": "Verizon Media",
    "pulsemgr.com": "Verizon Media",
    "rivals.com": "Verizon Media",
    "rmxads.com": "Verizon Media",
    "rocketmail.com": "Verizon Media",
    "ryot.org": "Verizon Media",
    "ryotlab.com": "Verizon Media",
    "ryotstudio.co.uk": "Verizon Media",
    "ryotstudio.com": "Verizon Media",
    "searchjam.com": "Verizon Media",
    "see-it.live": "Verizon Media",
    "shelterpop.com": "Verizon Media",
    "shopfone.com": "Verizon Media",
    "sport-king.com": "Verizon Media",
    "sport4ever.com": "Verizon Media",
    "sre-perim.com": "Verizon Media",
    "streampad.com": "Verizon Media",
    "stylelist.com": "Verizon Media",
    "tastefullyoffensive.com": "Verizon Media",
    "teamaol.com": "Verizon Media",
    "tech24.deals": "Verizon Media",
    "tech247.co": "Verizon Media",
    "techcrunch.cn": "Verizon Media",
    "techcrunch.com": "Verizon Media",
    "tecnoactual.net": "Verizon Media",
    "thatsfit.ca": "Verizon Media",
    "thegifts.co": "Verizon Media",
    "think24-7.com": "Verizon Media",
    "thisisoath.com": "Verizon Media",
    "travel4arab.com": "Verizon Media",
    "uplynk.com": "Verizon Media",
    "verizonmedia.co.nz": "Verizon Media",
    "verizonmedia.com": "Verizon Media",
    "verizonmedia.com.au": "Verizon Media",
    "videovore.com": "Verizon Media",
    "vidible.tv": "Verizon Media",
    "viral.site": "Verizon Media",
    "vzbuilders.com": "Verizon Media",
    "when.com": "Verizon Media",
    "wmconnect.com": "Verizon Media",
    "wow.com": "Verizon Media",
    "wretch.cc": "Verizon Media",
    "y7mail.com": "Verizon Media",
    "yahoo.bg": "Verizon Media",
    "yahoo.ca": "Verizon Media",
    "yahoo.cn": "Verizon Media",
    "yahoo.co.in": "Verizon Media",
    "yahoo.co.nz": "Verizon Media",
    "yahoo.co.th": "Verizon Media",
    "yahoo.co.uk": "Verizon Media",
    "yahoo.com": "Verizon Media",
    "yahoo.com.ar": "Verizon Media",
    "yahoo.com.au": "Verizon Media",
    "yahoo.com.br": "Verizon Media",
    "yahoo.com.cn": "Verizon Media",
    "yahoo.com.es": "Verizon Media",
    "yahoo.com.hk": "Verizon Media",
    "yahoo.com.mx": "Verizon Media",
    "yahoo.com.my": "Verizon Media",
    "yahoo.com.ph": "Verizon Media",
    "yahoo.com.sg": "Verizon Media",
    "yahoo.com.tw": "Verizon Media",
    "yahoo.com.vn": "Verizon Media",
    "yahoo.de": "Verizon Media",
    "yahoo.ee": "Verizon Media",
    "yahoo.es": "Verizon Media",
    "yahoo.finance": "Verizon Media",
    "yahoo.fr": "Verizon Media",
    "yahoo.hk": "Verizon Media",
    "yahoo.hu": "Verizon Media",
    "yahoo.ie": "Verizon Media",
    "yahoo.in": "Verizon Media",
    "yahoo.it": "Verizon Media",
    "yahoo.mx": "Verizon Media",
    "yahoo.net": "Verizon Media",
    "yahoo.ph": "Verizon Media",
    "yahoo.pt": "Verizon Media",
    "yahoo.sg": "Verizon Media",
    "yahoo.tw": "Verizon Media",
    "yahoo7.com.au": "Verizon Media",
    "yahooapis.com": "Verizon Media",
    "yahoobillboard.com": "Verizon Media",
    "yahoodns.net": "Verizon Media",
    "yahooemailsupport.us": "Verizon Media",
    "yahoofinance.com": "Verizon Media",
    "yahoofs.com": "Verizon Media",
    "yahoohealth.com": "Verizon Media",
    "yahoomail.com": "Verizon Media",
    "yahoomusic.com": "Verizon Media",
    "yahooosupport.com": "Verizon Media",
    "yahoosandbox.com": "Verizon Media",
    "yahoosearch.com": "Verizon Media",
    "yahoosmallbusiness.com": "Verizon Media",
    "yahoosportsbook.com": "Verizon Media",
    "yahoostyle.com": "Verizon Media",
    "yahootechsupportnumber.com": "Verizon Media",
    "ycorpblog.com": "Verizon Media",
    "yho.com": "Verizon Media",
    "yieldmanager.com": "Verizon Media",
    "yieldmanager.net": "Verizon Media",
    "yimg.com": "Verizon Media",
    "ymail.com": "Verizon Media",
    "yqlblog.net": "Verizon Media",
    "ysearchblog.com": "Verizon Media",
    "zenfs.com": "Verizon Media",
    "adthink.com": "AdThink S.A.",
    "advertstream.com": "AdThink S.A.",
    "adxcore.com": "AdThink S.A.",
    "audienceinsights.net": "AdThink S.A.",
    "dcoengine.com": "AdThink S.A.",
    "aeglive.com": "Anschutz Entertainment Group, Inc.",
    "aegpresents.com": "Anschutz Entertainment Group, Inc.",
    "affec.tv": "Affectv",
    "affectv.com": "Affectv",
    "affinity.com": "Affinity",
    "affirm.com": "Affirm Holdings, Inc.",
    "afilio.com.br": "AFILIO",
    "agilone.com": "Agilone Inc.",
    "agkn.com": "Neustar, Inc.",
    "berks.pa.us": "Neustar, Inc.",
    "comal.tx.us": "Neustar, Inc.",
    "contra-costa.ca.us": "Neustar, Inc.",
    "forsyth.nc.us": "Neustar, Inc.",
    "home.neustar": "Neustar, Inc.",
    "neustar.biz": "Neustar, Inc.",
    "neustar.com": "Neustar, Inc.",
    "ultratools.com": "Neustar, Inc.",
    "washington.mn.us": "Neustar, Inc.",
    "advombat.ru": "Aidata",
    "aidata.io": "Aidata",
    "aidata.me": "Aidata",
    "albacross.com": "Albacross Nordic AB",
    "1688.com": "Alibaba Group",
    "9apps.com": "Alibaba Group",
    "9appsinstall.com": "Alibaba Group",
    "9xsecndns.cn": "Alibaba Group",
    "aliapp.org": "Alibaba Group",
    "alibaba-inc.com": "Alibaba Group",
    "alibaba.com": "Alibaba Group",
    "alibabacloud.com": "Alibaba Group",
    "alibabacorp.com": "Alibaba Group",
    "alibabadns.com": "Alibaba Group",
    "alibabagroup.com": "Alibaba Group",
    "alibabausercontent.com": "Alibaba Group",
    "alicdn.com": "Alibaba Group",
    "aliexpress.com": "Alibaba Group",
    "aliexpress.fr": "Alibaba Group",
    "aliexpress.ru": "Alibaba Group",
    "alikunlun.com": "Alibaba Group",
    "alimebot.com": "Alibaba Group",
    "alios.cn": "Alibaba Group",
    "aliyun-inc.com": "Alibaba Group",
    "aliyun.com": "Alibaba Group",
    "aliyuncs.com": "Alibaba Group",
    "amap.com": "Alibaba Group",
    "autonavi.com": "Alibaba Group",
    "cainiao.com": "Alibaba Group",
    "cainiaoyizhan.com": "Alibaba Group",
    "cibntv.net": "Alibaba Group",
    "cnzz.com": "Alibaba Group",
    "daraz.io": "Alibaba Group",
    "ddurl.to": "Alibaba Group",
    "dingtalk.com": "Alibaba Group",
    "effirst.com": "Alibaba Group",
    "ele.me": "Alibaba Group",
    "eleme.cn": "Alibaba Group",
    "elemecdn.com": "Alibaba Group",
    "freshhema.com": "Alibaba Group",
    "greencompute.org": "Alibaba Group",
    "guoguo-app.com": "Alibaba Group",
    "hemaos.com": "Alibaba Group",
    "hichina.com": "Alibaba Group",
    "homestyler.com.cn": "Alibaba Group",
    "itao.com": "Alibaba Group",
    "laifeng.com": "Alibaba Group",
    "lazada.co.id": "Alibaba Group",
    "lazada.co.th": "Alibaba Group",
    "lazada.com": "Alibaba Group",
    "lazada.com.my": "Alibaba Group",
    "lazada.com.ph": "Alibaba Group",
    "lazada.sg": "Alibaba Group",
    "lazada.vn": "Alibaba Group",
    "mmstat.com": "Alibaba Group",
    "paike.com": "Alibaba Group",
    "slatic.net": "Alibaba Group",
    "sm.cn": "Alibaba Group",
    "soku.com": "Alibaba Group",
    "tangping.com": "Alibaba Group",
    "tanx.com": "Alibaba Group",
    "taobao.com": "Alibaba Group",
    "taobao.global": "Alibaba Group",
    "taobao.hk": "Alibaba Group",
    "taobao.org": "Alibaba Group",
    "tbcache.com": "Alibaba Group",
    "tbcdn.cn": "Alibaba Group",
    "tmall.com": "Alibaba Group",
    "tmall.ru": "Alibaba Group",
    "tudou.com": "Alibaba Group",
    "uc.cn": "Alibaba Group",
    "ucweb.com": "Alibaba Group",
    "uczzd.cn": "Alibaba Group",
    "umeng.com": "Alibaba Group",
    "umengcloud.com": "Alibaba Group",
    "umsns.com": "Alibaba Group",
    "umtrack.com": "Alibaba Group",
    "umtrack0.com": "Alibaba Group",
    "umtrack1.com": "Alibaba Group",
    "umtrack2.com": "Alibaba Group",
    "uyunad.com": "Alibaba Group",
    "wpn.com": "Alibaba Group",
    "ykimg.com": "Alibaba Group",
    "youku.com": "Alibaba Group",
    "b-cdn.net": "BunnyCDN",
    "bunnycdn.com": "BunnyCDN",
    "almacr.fi": "Alma Media Oyj",
    "almamedia.fi": "Alma Media Oyj",
    "almamedia.io": "Alma Media Oyj",
    "etuovi.com": "Alma Media Oyj",
    "il.fi": "Alma Media Oyj",
    "ilcdn.fi": "Alma Media Oyj",
    "iltalehti.fi": "Alma Media Oyj",
    "uusisuomi.fi": "Alma Media Oyj",
    "alocdn.com": "TowerData, Inc.",
    "rapleaf.com": "TowerData, Inc.",
    "towerdata.com": "TowerData, Inc.",
    "alphacdn.net": "Verizon",
    "edgecastcdn.net": "Verizon",
    "edgecastdns.net": "Verizon",
    "fios1news.com": "Verizon",
    "verizon.com": "Verizon",
    "verizon.net": "Verizon",
    "verizonwireless.com": "Verizon",
    "vtext.com": "Verizon",
    "vzw.com": "Verizon",
    "amplitude.com": "Amplitude",
    "amung.us": "whos.amung.us Inc",
    "waust.at": "whos.amung.us Inc",
    "analytics-egain.com": "eGain Corporation",
    "egain.cloud": "eGain Corporation",
    "egaincloud.net": "eGain Corporation",
    "andbeyond.media": "Alchemy Advertising Pvt. Ltd.",
    "aniview.com": "ANIVIEW LTD",
    "anyclip.com": "AnyClip Ltd.",
    "apester.com": "Apester Ltd.",
    "apextag.com": "Quantcast Corporation",
    "quantcast.com": "Quantcast Corporation",
    "quantcount.com": "Quantcast Corporation",
    "quantserve.com": "Quantcast Corporation",
    "apicit.net": "KLOIS",
    "apnarm.net.au": "APN NEWSPAPERS PTY LTD",
    "activecampaign.com": "ActiveCampaign, Inc.",
    "activehosted.com": "ActiveCampaign, Inc.",
    "app-us1.com": "ActiveCampaign, Inc.",
    "img-us3.com": "ActiveCampaign, Inc.",
    "trackcmp.net": "ActiveCampaign, Inc.",
    "app.link": "Branch Metrics, Inc.",
    "appipv4.link": "Branch Metrics, Inc.",
    "bnc.lt": "Branch Metrics, Inc.",
    "branch.io": "Branch Metrics, Inc.",
    "hastrk1.com": "Branch Metrics, Inc.",
    "hastrk2.com": "Branch Metrics, Inc.",
    "hastrk3.com": "Branch Metrics, Inc.",
    "impression.link": "Branch Metrics, Inc.",
    "launch1.co": "Branch Metrics, Inc.",
    "mobileapptracking.com": "Branch Metrics, Inc.",
    "test-app.link": "Branch Metrics, Inc.",
    "tlnk.io": "Branch Metrics, Inc.",
    "appboy-images.com": "Braze, Inc.",
    "appboy.com": "Braze, Inc.",
    "appboy.eu": "Braze, Inc.",
    "appboycdn.com": "Braze, Inc.",
    "braze-images.com": "Braze, Inc.",
    "braze.com": "Braze, Inc.",
    "braze.eu": "Braze, Inc.",
    "appdynamics.com": "Cisco Systems, Inc.",
    "cisco.com": "Cisco Systems, Inc.",
    "clamav.net": "Cisco Systems, Inc.",
    "duo.com": "Cisco Systems, Inc.",
    "eum-appdynamics.com": "Cisco Systems, Inc.",
    "jasper.com": "Cisco Systems, Inc.",
    "netacad.com": "Cisco Systems, Inc.",
    "opendns.com": "Cisco Systems, Inc.",
    "static-cisco.com": "Cisco Systems, Inc.",
    "webex.com": "Cisco Systems, Inc.",
    "adnw.xyz": "Appier",
    "aiqua.io": "Appier",
    "appier.com": "Appier",
    "appier.net": "Appier",
    "qgr.ph": "Appier",
    "qgraph.io": "Appier",
    "quantumgraph.com": "Appier",
    "aaplimg.com": "Apple Inc.",
    "apple-dns.net": "Apple Inc.",
    "apple-mapkit.com": "Apple Inc.",
    "apple.com": "Apple Inc.",
    "applecard.apple": "Apple Inc.",
    "applemusic.com": "Apple Inc.",
    "appstore.com": "Apple Inc.",
    "beatsbydre.com": "Apple Inc.",
    "cdn-apple.com": "Apple Inc.",
    "icloud-content.com": "Apple Inc.",
    "icloud.com": "Apple Inc.",
    "itunes.com": "Apple Inc.",
    "me.com": "Apple Inc.",
    "mzstatic.com": "Apple Inc.",
    "shazam.com": "Apple Inc.",
    "shazamid.com": "Apple Inc.",
    "swift.org": "Apple Inc.",
    "webkit.org": "Apple Inc.",
    "apxlv.com": "Cogo Labs",
    "cogocast.com": "Cogo Labs",
    "cogocast.net": "Cogo Labs",
    "arcpublishing.com": "The Washington Post",
    "arcxp.com": "The Washington Post",
    "digitalink.com": "The Washington Post",
    "nile.works": "The Washington Post",
    "posttv.com": "The Washington Post",
    "wapo.com": "The Washington Post",
    "wapodev.com": "The Washington Post",
    "wapostage.com": "The Washington Post",
    "washingtonpost.com": "The Washington Post",
    "washpost.engineering": "The Washington Post",
    "zeustechnology.com": "The Washington Post",
    "arkoselabs.com": "Arkose Labs, Inc.",
    "funcaptcha.co": "Arkose Labs, Inc.",
    "funcaptcha.com": "Arkose Labs, Inc.",
    "funcaptcha.net": "Arkose Labs, Inc.",
    "swipeads.co": "Arkose Labs, Inc.",
    "swipeads.com": "Arkose Labs, Inc.",
    "atemda.com": "Admeta AB",
    "ati-host.net": "AT Internet",
    "aticdn.net": "AT Internet",
    "xiti.com": "AT Internet",
    "att.com": "AT&T Services, Inc.",
    "att.net": "AT&T Services, Inc.",
    "attccc.com": "AT&T Services, Inc.",
    "attinternetservice.com": "AT&T Services, Inc.",
    "attsavings.com": "AT&T Services, Inc.",
    "directvdeals.com": "AT&T Services, Inc.",
    "directvnow.com": "AT&T Services, Inc.",
    "paygonline.com": "AT&T Services, Inc.",
    "attentivemobile.com": "Attentive Mobile",
    "attn.tv": "Attentive Mobile",
    "angelsoflondon.com": "LCN.com Ltd",
    "attraqt.com": "LCN.com Ltd",
    "thequietus.com": "LCN.com Ltd",
    "webtrends-optimize.com": "LCN.com Ltd",
    "audioeye.com": "AudioEye, Inc.",
    "au.com": "KDDI CORPORATION",
    "auone.jp": "KDDI CORPORATION",
    "auswaertiges-amt.de": "Auswärtiges Amt",
    "auth0-extend.com": "Auth0, Inc.",
    "auth0.com": "Auth0, Inc.",
    "jwt.io": "Auth0, Inc.",
    "avanser.com": "Avanser",
    "avct.cloud": "Avocet Systems Ltd.",
    "avocet.io": "Avocet Systems Ltd.",
    "avantlink.com": "Dynamic Web Source, Inc.",
    "avlws.com": "Dynamic Web Source, Inc.",
    "avmws.com": "Dynamic Web Source, Inc.",
    "avplayer.com": "AVPlayer",
    "aweber-static.com": "AWEBER SYSTEMS, INC.",
    "aweber.com": "AWEBER SYSTEMS, INC.",
    "awecr.com": "DOCLER IP S.A R.L.",
    "awempire.com": "DOCLER IP S.A R.L.",
    "awempt.com": "DOCLER IP S.A R.L.",
    "awemwh.com": "DOCLER IP S.A R.L.",
    "awentw.com": "DOCLER IP S.A R.L.",
    "aweproto.com": "DOCLER IP S.A R.L.",
    "aweprt.com": "DOCLER IP S.A R.L.",
    "awept.com": "DOCLER IP S.A R.L.",
    "awestat.com": "DOCLER IP S.A R.L.",
    "awestatic.com": "DOCLER IP S.A R.L.",
    "awestc.com": "DOCLER IP S.A R.L.",
    "crptentry.com": "DOCLER IP S.A R.L.",
    "crptgate.com": "DOCLER IP S.A R.L.",
    "dditscdn.com": "DOCLER IP S.A R.L.",
    "doclercdn.com": "DOCLER IP S.A R.L.",
    "jsmstat.com": "DOCLER IP S.A R.L.",
    "jsmstatic.com": "DOCLER IP S.A R.L.",
    "livejasmin.com": "DOCLER IP S.A R.L.",
    "mptgate.com": "DOCLER IP S.A R.L.",
    "oranum.com": "DOCLER IP S.A R.L.",
    "protoawe.com": "DOCLER IP S.A R.L.",
    "prtawe.com": "DOCLER IP S.A R.L.",
    "ptawe.com": "DOCLER IP S.A R.L.",
    "ayads.co": "Sublime Skinz Labs",
    "b0e8.com": "BrightEdge Technologies Inc.",
    "bc0a.com": "BrightEdge Technologies Inc.",
    "brightedge.com": "BrightEdge Technologies Inc.",
    "71edge.com": "Baidu, Inc.",
    "91.com": "Baidu, Inc.",
    "aipage.cn": "Baidu, Inc.",
    "aipage.com": "Baidu, Inc.",
    "apollo.auto": "Baidu, Inc.",
    "baidu.com": "Baidu, Inc.",
    "baidubce.com": "Baidu, Inc.",
    "baiducontent.com": "Baidu, Inc.",
    "baidupcs.com": "Baidu, Inc.",
    "baidustatic.com": "Baidu, Inc.",
    "baifae.com": "Baidu, Inc.",
    "baifubao.com": "Baidu, Inc.",
    "bcebos.com": "Baidu, Inc.",
    "bcehost.com": "Baidu, Inc.",
    "bdimg.com": "Baidu, Inc.",
    "bdstatic.com": "Baidu, Inc.",
    "bdtjrcv.com": "Baidu, Inc.",
    "chuanke.com": "Baidu, Inc.",
    "dlnel.com": "Baidu, Inc.",
    "dlnel.org": "Baidu, Inc.",
    "duapps.com": "Baidu, Inc.",
    "dwz.cn": "Baidu, Inc.",
    "hao124.com": "Baidu, Inc.",
    "hao222.com": "Baidu, Inc.",
    "iq.com": "Baidu, Inc.",
    "iqiyi.cn": "Baidu, Inc.",
    "iqiyi.com": "Baidu, Inc.",
    "iqiyipic.com": "Baidu, Inc.",
    "mipcdn.com": "Baidu, Inc.",
    "nuomi.com": "Baidu, Inc.",
    "pps.tv": "Baidu, Inc.",
    "ppsimg.com": "Baidu, Inc.",
    "qiyi.com": "Baidu, Inc.",
    "qiyipic.com": "Baidu, Inc.",
    "qy.net": "Baidu, Inc.",
    "smartapps.cn": "Baidu, Inc.",
    "trustgo.com": "Baidu, Inc.",
    "bannerflow.com": "BannerFlow AB",
    "barilliance.com": "Barilliance Systems Ltd.",
    "barilliance.net": "Barilliance Ltd",
    "belco.io": "Forwarder B.V.",
    "betweendigital.com": "SSP Network Ltd",
    "bfmio.com": "Beachfront Media LLC",
    "beeswax.com": "Beeswax",
    "bidr.io": "Beeswax",
    "bidswitch.com": "IPONWEB GmbH",
    "bidswitch.net": "IPONWEB GmbH",
    "iponweb.com": "IPONWEB GmbH",
    "iponweb.net": "IPONWEB GmbH",
    "mfadsrvr.com": "IPONWEB GmbH",
    "perf-serving.com": "IPONWEB GmbH",
    "bidtheatre.com": "BidTheatre AB",
    "bimbolive.com": "BongaCams",
    "bng-ns.com": "BongaCams",
    "bngpt.com": "BongaCams",
    "bongacams.com": "BongaCams",
    "bongacams.dk": "BongaCams",
    "bongacams.org": "BongaCams",
    "bongacams2.com": "BongaCams",
    "bongacash.com": "BongaCams",
    "promo-bc.com": "BongaCams",
    "redcams.su": "BongaCams",
    "webcamsupport.net": "BongaCams",
    "bitporno.com": "RapidMedia Limited",
    "1c-bitrix-cdn.ru": "Bitrix Ltd.",
    "bitrix.info": "Bitrix Ltd.",
    "bitrix.ru": "Bitrix Ltd.",
    "bitrix24.ru": "Bitrix Ltd.",
    "bitsngo.net": "Ray Networks Ltd",
    "bizrate.com": "Synapse Group, Inc.",
    "bizrateinsights.com": "Synapse Group, Inc.",
    "blogherads.com": "BlogHer, Inc.",
    "bluebillywig.com": "Blue Billywig bv",
    "mainroll.com": "Blue Billywig bv",
    "alc.com": "ALC",
    "alcmpn.com": "ALC",
    "bluecava.com": "ALC",
    "idify.com": "ALC",
    "blueconic.com": "BlueConic, Inc.",
    "blueconic.net": "BlueConic, Inc.",
    "bluecore.com": "Bluecore Inc.",
    "bnmla.com": "engageBDR",
    "boldchat.com": "LogMeIn, Inc.",
    "cdngetgo.com": "LogMeIn, Inc.",
    "getgo.com": "LogMeIn, Inc.",
    "gotomeeting.com": "LogMeIn, Inc.",
    "join.me": "LogMeIn, Inc.",
    "lastpass.com": "LogMeIn, Inc.",
    "logme.in": "LogMeIn, Inc.",
    "logmein.com": "LogMeIn, Inc.",
    "logmeininc.com": "LogMeIn, Inc.",
    "nanorep.co": "LogMeIn, Inc.",
    "nanorep.com": "LogMeIn, Inc.",
    "uber-electronics.com": "LogMeIn, Inc.",
    "vpn.net": "LogMeIn, Inc.",
    "bonad.io": "AB Dagens Nyheter",
    "bonnier.news": "AB Dagens Nyheter",
    "cdn-expressen.se": "AB Dagens Nyheter",
    "di.se": "AB Dagens Nyheter",
    "dn-static.se": "AB Dagens Nyheter",
    "dn.se": "AB Dagens Nyheter",
    "expressen.se": "AB Dagens Nyheter",
    "booking.com": "Booking.com B.V.",
    "bstatic.com": "Booking.com B.V.",
    "rcstatic.com": "Booking.com B.V.",
    "rentalcars.com": "Booking.com B.V.",
    "traveljigsaw.com": "Booking.com B.V.",
    "boomtrain.com": "Zeta Global",
    "rezync.com": "Zeta Global",
    "rfihub.com": "Zeta Global",
    "rfihub.net": "Zeta Global",
    "ru4.com": "Zeta Global",
    "zetaglobal.com": "Zeta Global",
    "zetaglobal.net": "Zeta Global",
    "zetazync.com": "Zeta Global",
    "bounceexchange.com": "Bounce Exchange",
    "bouncex.net": "Bounce Exchange",
    "cdnbasket.net": "Bounce Exchange",
    "brainlyads.com": "Next Millennium Media, Inc.",
    "nextmillennium.io": "Next Millennium Media, Inc.",
    "brand-display.com": "Knorex Pte. Ltd.",
    "brandmetrics.com": "Brandmetrics",
    "bloomreach.com": "BloomReach",
    "brcdn.com": "BloomReach",
    "brsrvr.com": "BloomReach",
    "brtstats.com": "BloomReach",
    "brealtime.com": "EMX Digital, LLC",
    "clrstm.com": "EMX Digital, LLC",
    "enginemediaexchange.com": "EMX Digital, LLC",
    "brightcove.co.jp": "Brightcove, Inc.",
    "brightcove.com": "Brightcove, Inc.",
    "brightcove.net": "Brightcove, Inc.",
    "brightcovecdn.com": "Brightcove, Inc.",
    "gallerysites.net": "Brightcove, Inc.",
    "ooyala.com": "Brightcove, Inc.",
    "videoplaza.tv": "Brightcove, Inc.",
    "zencdn.net": "Brightcove, Inc.",
    "brightfunnel.com": "BrightFunnel",
    "brightspotcdn.com": "Perfect Sense Operations",
    "broadstreetads.com": "Broadstreet Ads, Inc",
    "browser-update.org": "Browser Update",
    "btg360.com.br": "Locaweb Serviços de Internet S/A",
    "blockthrough.com": "Blockthrough Inc.",
    "btloader.com": "Blockthrough Inc.",
    "pagefair.com": "Blockthrough Inc.",
    "pagefair.net": "Blockthrough Inc.",
    "upapi.net": "Blockthrough Inc.",
    "uponit.com": "Blockthrough Inc.",
    "videoplayerhub.com": "Blockthrough Inc.",
    "btstatic.com": "TransUnion LLC",
    "confsettings.com": "TransUnion LLC",
    "iesnare.com": "TransUnion LLC",
    "iovation.com": "TransUnion LLC",
    "launchkey.com": "TransUnion LLC",
    "onetag.io": "TransUnion LLC",
    "script.ag": "TransUnion LLC",
    "signal.co": "TransUnion LLC",
    "thebrighttag.com": "TransUnion LLC",
    "transunion.com": "TransUnion LLC",
    "bidtellect.com": "Bidtellect, Inc",
    "bttrack.com": "Bidtellect, Inc",
    "bugsnag.com": "Bugsnag Inc.",
    "buysellads.com": "BuySellAds",
    "buysellads.net": "BuySellAds",
    "carbonads.com": "BuySellAds",
    "carbonads.net": "BuySellAds",
    "servedby-buysellads.com": "BuySellAds",
    "buzzoola.com": "Buzzoola Inc.",
    "byside.com": "BYSIDE - LEAD ACTIVATION, S.A.",
    "amemv.com": "ByteDance Ltd.",
    "bdurl.net": "ByteDance Ltd.",
    "bytecdn.cn": "ByteDance Ltd.",
    "byted.org": "ByteDance Ltd.",
    "bytedance.com": "ByteDance Ltd.",
    "bytedance.net": "ByteDance Ltd.",
    "bytedanceapi.com": "ByteDance Ltd.",
    "bytednsdoc.com": "ByteDance Ltd.",
    "byteimg.com": "ByteDance Ltd.",
    "byteoversea.com": "ByteDance Ltd.",
    "byteoversea.net": "ByteDance Ltd.",
    "bytesfield.com": "ByteDance Ltd.",
    "bytexservice.com": "ByteDance Ltd.",
    "changdunovel.com": "ByteDance Ltd.",
    "ctobsnssdk.com": "ByteDance Ltd.",
    "dcdapp.com": "ByteDance Ltd.",
    "direct.ly": "ByteDance Ltd.",
    "directly.im": "ByteDance Ltd.",
    "douyin.com": "ByteDance Ltd.",
    "douyinact.com": "ByteDance Ltd.",
    "douyinact.net": "ByteDance Ltd.",
    "douyincdn.com": "ByteDance Ltd.",
    "douyinclips.com": "ByteDance Ltd.",
    "douyinmusicclips.com": "ByteDance Ltd.",
    "douyinmusicvideo.com": "ByteDance Ltd.",
    "douyinpic.com": "ByteDance Ltd.",
    "douyinshortvideo.com": "ByteDance Ltd.",
    "douyinstatic.com": "ByteDance Ltd.",
    "douyinvideo.net": "ByteDance Ltd.",
    "dymusictape.com": "ByteDance Ltd.",
    "dymusicvideo.com": "ByteDance Ltd.",
    "dyshortvideo.com": "ByteDance Ltd.",
    "dyvideotape.com": "ByteDance Ltd.",
    "faceu.mobi": "ByteDance Ltd.",
    "honeypomelo.in": "ByteDance Ltd.",
    "ibytedtos.com": "ByteDance Ltd.",
    "ibyteimg.com": "ByteDance Ltd.",
    "iesdouyin.com": "ByteDance Ltd.",
    "iesdouyin.net": "ByteDance Ltd.",
    "ipstatp.com": "ByteDance Ltd.",
    "isnssdk.com": "ByteDance Ltd.",
    "ixigua.com": "ByteDance Ltd.",
    "jinritemai.com": "ByteDance Ltd.",
    "livelycdn.com": "ByteDance Ltd.",
    "miumiu.io": "ByteDance Ltd.",
    "miumiu.lol": "ByteDance Ltd.",
    "musapi.cc": "ByteDance Ltd.",
    "muscdn.com": "ByteDance Ltd.",
    "muscdn.net": "ByteDance Ltd.",
    "muscdn.org": "ByteDance Ltd.",
    "musemuse.cn": "ByteDance Ltd.",
    "muser.me": "ByteDance Ltd.",
    "musical.ly": "ByteDance Ltd.",
    "musicallycdn.com": "ByteDance Ltd.",
    "musinc.io": "ByteDance Ltd.",
    "mymuse.com.cn": "ByteDance Ltd.",
    "oceanengine.com": "ByteDance Ltd.",
    "pangle.io": "ByteDance Ltd.",
    "pangleglobal.com": "ByteDance Ltd.",
    "pangolin-sdk-toutiao.com": "ByteDance Ltd.",
    "pglstatp-toutiao.com": "ByteDance Ltd.",
    "pingpong.ly": "ByteDance Ltd.",
    "pomelo.im": "ByteDance Ltd.",
    "pstatp.com": "ByteDance Ltd.",
    "sgsnssdk.com": "ByteDance Ltd.",
    "snssdk.com": "ByteDance Ltd.",
    "squadapp.im": "ByteDance Ltd.",
    "tiktok.com": "ByteDance Ltd.",
    "tiktokcdn.com": "ByteDance Ltd.",
    "tiktokv.com": "ByteDance Ltd.",
    "tobsnssdk.com": "ByteDance Ltd.",
    "toutiao.com": "ByteDance Ltd.",
    "toutiaoimg.com": "ByteDance Ltd.",
    "ulikecam.com": "ByteDance Ltd.",
    "zhiliaoapp.com": "ByteDance Ltd.",
    "c3tag.com": "C3 Metrics, Inc.",
    "calltracks.com": "Calltracks Limited",
    "casalemedia.com": "Index Exchange, Inc.",
    "indexww.com": "Index Exchange, Inc.",
    "ccgateway.net": "Clicksco FZ",
    "shopsales.us": "Clicksco FZ",
    "cdnvideo.ru": "LLC \"CDN-video\"",
    "center.io": "Avenue 81, Inc.",
    "getdrip.com": "Avenue 81, Inc.",
    "leadpages.io": "Avenue 81, Inc.",
    "leadpages.net": "Avenue 81, Inc.",
    "baynote.net": "Kibo Software, Inc.",
    "certona.net": "Kibo Software, Inc.",
    "mozu.com": "Kibo Software, Inc.",
    "res-x.com": "Kibo Software, Inc.",
    "shopatron.com": "Kibo Software, Inc.",
    "cfjump.com": "Commission Factory Pty Ltd",
    "channel.me": "Channel.me B.V.",
    "channeladvisor.com": "ChannelAdvisor Corporation",
    "searchmarketing.com": "ChannelAdvisor Corporation",
    "where-to-buy.co": "ChannelAdvisor Corporation",
    "baixaki.com.br": "Azion Technologies",
    "chaordicsystems.com": "Azion Technologies",
    "clickjogos.com.br": "Azion Technologies",
    "ibxk.com.br": "Azion Technologies",
    "jusbr.com": "Azion Technologies",
    "livrariasaraiva.com.br": "Azion Technologies",
    "saraiva.com.br": "Azion Technologies",
    "tecmundo.com.br": "Azion Technologies",
    "chartbeat.com": "Chartbeat",
    "chartbeat.net": "Chartbeat",
    "chatango.com": "Chatango LLC.",
    "chatra.io": "Roger Wilco LLC",
    "chaturbate.com": "Chaturbate, LLC",
    "highwebmedia.com": "Chaturbate, LLC",
    "oncam.xxx": "Chaturbate, LLC",
    "charitycommission.gov.uk": "Government Digital Service",
    "service.gov.uk": "Government Digital Service",
    "chimpstatic.com": "Intuit Inc.",
    "ckapis.com": "Intuit Inc.",
    "creditkarma.com": "Intuit Inc.",
    "docstoccdn.com": "Intuit Inc.",
    "eep.io": "Intuit Inc.",
    "intuit.ca": "Intuit Inc.",
    "intuit.com": "Intuit Inc.",
    "intuitcdn.net": "Intuit Inc.",
    "intuitconnect.com": "Intuit Inc.",
    "list-manage.com": "Intuit Inc.",
    "mailchi.mp": "Intuit Inc.",
    "mailchimp.com": "Intuit Inc.",
    "mailchimpapp.com": "Intuit Inc.",
    "mint.com": "Intuit Inc.",
    "payroll.com": "Intuit Inc.",
    "quickbooks.com": "Intuit Inc.",
    "quickbooksonline.com": "Intuit Inc.",
    "tradegecko.com": "Intuit Inc.",
    "turbotax.com": "Intuit Inc.",
    "cint.com": "Cint AB",
    "cintnetworks.com": "Cint AB",
    "civiccomputing.com": "Civic Computing Limited",
    "clearsale.com.br": "ClearSale S.A.",
    "compreeconfie.com.br": "ClearSale S.A.",
    "clickagy.com": "Clickagy",
    "clickcertain.com": "ClickCertain",
    "clicktale.net": "ClickTale Ltd",
    "clinch.co": "Clinch Labs ltd",
    "astrospeak.com": "Times Internet Ltd",
    "clmbtech.com": "Times Internet Ltd",
    "colombiaonline.com": "Times Internet Ltd",
    "economictimes.com": "Times Internet Ltd",
    "etimg.com": "Times Internet Ltd",
    "gaanacdn.com": "Times Internet Ltd",
    "gadgetsnow.com": "Times Internet Ltd",
    "idiva.com": "Times Internet Ltd",
    "iimg.in": "Times Internet Ltd",
    "indiatimes.com": "Times Internet Ltd",
    "indiatimes.in": "Times Internet Ltd",
    "langimg.com": "Times Internet Ltd",
    "magicbricks.com": "Times Internet Ltd",
    "mensxp.com": "Times Internet Ltd",
    "timesinternet.in": "Times Internet Ltd",
    "timesofindia.com": "Times Internet Ltd",
    "timespoints.com": "Times Internet Ltd",
    "toiimg.com": "Times Internet Ltd",
    "zigcdn.com": "Times Internet Ltd",
    "zigwheels.com": "Times Internet Ltd",
    "cloud-iq.com": "Cloud.IQ Limited",
    "cloudiq.com": "Cloud.IQ Limited",
    "cloudaccess.com": "Cloudflare, Inc.",
    "cloudflare-dns.com": "Cloudflare, Inc.",
    "cloudflare.com": "Cloudflare, Inc.",
    "cloudflareinsights.com": "Cloudflare, Inc.",
    "cloudflaressl.com": "Cloudflare, Inc.",
    "cloudflarestream.com": "Cloudflare, Inc.",
    "eager.io": "Cloudflare, Inc.",
    "embedbox.io": "Cloudflare, Inc.",
    "videodelivery.net": "Cloudflare, Inc.",
    "zaraz.com": "Cloudflare, Inc.",
    "zrz.co": "Cloudflare, Inc.",
    "cloudimg.io": "REFLUENCE",
    "ultrafast.io": "REFLUENCE",
    "cloudinary.com": "Cloudinary Ltd",
    "clustrmaps.com": "Data Subsystems Inc",
    "cnt.my": "INTER CITY ADS (MALAYSIA) SDN. BHD",
    "admission.net": "CDK Global, LLC.",
    "cobaltgroup.com": "CDK Global, LLC.",
    "cobrowser.com": "CoBrowser.net B.V.",
    "cognitiv.ai": "Cognitiv Corp.",
    "cognitivlabs.com": "Cognitiv Corp.",
    "coherentpath.com": "Coherent Path, Inc.",
    "cohesionapps.com": "Tagular Analytics, LLC",
    "tagular.com": "Tagular Analytics, LLC",
    "colossusssp.com": "Colossus Media, LLC",
    "comm100.com": "Comm100 Network Corporation",
    "company-target.com": "Demandbase, Inc.",
    "demandbase.com": "Demandbase, Inc.",
    "complex.com": "Complex Media, Inc.",
    "firstwefeast.com": "Complex Media, Inc.",
    "solecollector.com": "Complex Media, Inc.",
    "acmepackingcompany.com": "Vox Media, Inc.",
    "arrowheadpride.com": "Vox Media, Inc.",
    "aseaofblue.com": "Vox Media, Inc.",
    "behindthesteelcurtain.com": "Vox Media, Inc.",
    "bleedinggreennation.com": "Vox Media, Inc.",
    "bloggingtheboys.com": "Vox Media, Inc.",
    "burntorangenation.com": "Vox Media, Inc.",
    "cagesideseats.com": "Vox Media, Inc.",
    "cincyjungle.com": "Vox Media, Inc.",
    "concert.io": "Vox Media, Inc.",
    "curbed.com": "Vox Media, Inc.",
    "dailynorseman.com": "Vox Media, Inc.",
    "eater.com": "Vox Media, Inc.",
    "funnyordie.com": "Vox Media, Inc.",
    "milehighreport.com": "Vox Media, Inc.",
    "mmafighting.com": "Vox Media, Inc.",
    "mmamania.com": "Vox Media, Inc.",
    "patspulpit.com": "Vox Media, Inc.",
    "polygon.com": "Vox Media, Inc.",
    "racked.com": "Vox Media, Inc.",
    "recode.net": "Vox Media, Inc.",
    "sbnation.com": "Vox Media, Inc.",
    "secondcityhockey.com": "Vox Media, Inc.",
    "testudotimes.com": "Vox Media, Inc.",
    "theverge.com": "Vox Media, Inc.",
    "tomahawknation.com": "Vox Media, Inc.",
    "vox-cdn.com": "Vox Media, Inc.",
    "vox.com": "Vox Media, Inc.",
    "voxmedia.com": "Vox Media, Inc.",
    "allure.com": "Conde Nast Publications Inc.",
    "architecturaldigest.com": "Conde Nast Publications Inc.",
    "arstechnica.com": "Conde Nast Publications Inc.",
    "bonappetit.com": "Conde Nast Publications Inc.",
    "brides.com": "Conde Nast Publications Inc.",
    "cntraveler.com": "Conde Nast Publications Inc.",
    "cntraveller.com": "Conde Nast Publications Inc.",
    "conde.io": "Conde Nast Publications Inc.",
    "condecdn.net": "Conde Nast Publications Inc.",
    "condenast.com": "Conde Nast Publications Inc.",
    "condenast.it": "Conde Nast Publications Inc.",
    "condenastdigital.com": "Conde Nast Publications Inc.",
    "condenet.com": "Conde Nast Publications Inc.",
    "epicurious.com": "Conde Nast Publications Inc.",
    "glamour.com": "Conde Nast Publications Inc.",
    "golfdigest.com": "Conde Nast Publications Inc.",
    "gq.com": "Conde Nast Publications Inc.",
    "gqindia.com": "Conde Nast Publications Inc.",
    "lennyletter.com": "Conde Nast Publications Inc.",
    "newyorker.com": "Conde Nast Publications Inc.",
    "pitchfork.com": "Conde Nast Publications Inc.",
    "self.com": "Conde Nast Publications Inc.",
    "tatler.com": "Conde Nast Publications Inc.",
    "teenvogue.com": "Conde Nast Publications Inc.",
    "them.us": "Conde Nast Publications Inc.",
    "vanityfair.com": "Conde Nast Publications Inc.",
    "vanityfair.it": "Conde Nast Publications Inc.",
    "vogue.com": "Conde Nast Publications Inc.",
    "wired.com": "Conde Nast Publications Inc.",
    "wired.it": "Conde Nast Publications Inc.",
    "wmagazine.com": "Conde Nast Publications Inc.",
    "conductrics.com": "Conductrics",
    "connatix.com": "Connatix",
    "connectad.io": "ConnectAd",
    "connectadrealtime.com": "ConnectAd",
    "connecto.io": "ThoughtFabrics Solutions Pvt. Ltd.",
    "consumable.com": "Consumable, Inc.",
    "serverbid.com": "Consumable, Inc.",
    "content-ad.net": "Content.ad",
    "contentpass.net": "Content Pass GmbH",
    "contentsquare.com": "ContentSquare",
    "contentsquare.net": "ContentSquare",
    "contextweb.com": "Pulsepoint, Inc.",
    "conversionruler.com": "Market Ruler, LLC",
    "convertexperiments.com": "Convert Insights Inc",
    "cordial.io": "Bandfarm, Inc.",
    "asperasoft.com": "International Business Machines Corporation",
    "bluemix.net": "International Business Machines Corporation",
    "clearleap.info": "International Business Machines Corporation",
    "cmcore.com": "International Business Machines Corporation",
    "compose.com": "International Business Machines Corporation",
    "coremetrics.com": "International Business Machines Corporation",
    "ibm.com": "International Business Machines Corporation",
    "ibmcloud.com": "International Business Machines Corporation",
    "ibmmainframes.com": "International Business Machines Corporation",
    "imwx.com": "International Business Machines Corporation",
    "intellicast.com": "International Business Machines Corporation",
    "lotus.com": "International Business Machines Corporation",
    "mkt51.net": "International Business Machines Corporation",
    "mkt922.com": "International Business Machines Corporation",
    "mkt932.com": "International Business Machines Corporation",
    "mkt941.com": "International Business Machines Corporation",
    "mybluemix.net": "International Business Machines Corporation",
    "pages01.net": "International Business Machines Corporation",
    "pages02.net": "International Business Machines Corporation",
    "pages03.net": "International Business Machines Corporation",
    "pages04.net": "International Business Machines Corporation",
    "pages05.net": "International Business Machines Corporation",
    "pages06.net": "International Business Machines Corporation",
    "pages07.net": "International Business Machines Corporation",
    "pages08.net": "International Business Machines Corporation",
    "s-bluemix.net": "International Business Machines Corporation",
    "s81c.com": "International Business Machines Corporation",
    "securityintelligence.com": "International Business Machines Corporation",
    "servicearizona.com": "International Business Machines Corporation",
    "splash-screen.net": "International Business Machines Corporation",
    "w-x.co": "International Business Machines Corporation",
    "weather.com": "International Business Machines Corporation",
    "wfxtriggers.com": "International Business Machines Corporation",
    "worldcommunitygrid.org": "International Business Machines Corporation",
    "wsi.com": "International Business Machines Corporation",
    "wunderground.com": "International Business Machines Corporation",
    "wxug.com": "International Business Machines Corporation",
    "coveo.com": "Coveo Solutions Inc.",
    "cpmstar.com": "Tactics Network, LLC",
    "captify.co.uk": "Captify Technologies Ltd.",
    "cpx.to": "Captify Technologies Ltd.",
    "appcloud.com": "Salesforce.com, Inc.",
    "appexchange.com": "Salesforce.com, Inc.",
    "attic.io": "Salesforce.com, Inc.",
    "beyondcore.com": "Salesforce.com, Inc.",
    "brighteroption.com": "Salesforce.com, Inc.",
    "buddymedia.com": "Salesforce.com, Inc.",
    "chatter.com": "Salesforce.com, Inc.",
    "cloudcraze.com": "Salesforce.com, Inc.",
    "cloudforce.com": "Salesforce.com, Inc.",
    "cotweet.com": "Salesforce.com, Inc.",
    "cquotient.com": "Salesforce.com, Inc.",
    "data.com": "Salesforce.com, Inc.",
    "database.com": "Salesforce.com, Inc.",
    "demandware.com": "Salesforce.com, Inc.",
    "demandware.net": "Salesforce.com, Inc.",
    "desk.com": "Salesforce.com, Inc.",
    "documentforce.com": "Salesforce.com, Inc.",
    "dreamforce.com": "Salesforce.com, Inc.",
    "einstein.com": "Salesforce.com, Inc.",
    "exacttarget.com": "Salesforce.com, Inc.",
    "exct.net": "Salesforce.com, Inc.",
    "force.com": "Salesforce.com, Inc.",
    "forceusercontent.com": "Salesforce.com, Inc.",
    "fuelcdn.com": "Salesforce.com, Inc.",
    "govforce.com": "Salesforce.com, Inc.",
    "gravitytank.com": "Salesforce.com, Inc.",
    "heroku.com": "Salesforce.com, Inc.",
    "herokuapp.com": "Salesforce.com, Inc.",
    "herokucdn.com": "Salesforce.com, Inc.",
    "heywire.com": "Salesforce.com, Inc.",
    "igodigital.com": "Salesforce.com, Inc.",
    "krux.com": "Salesforce.com, Inc.",
    "krxd.net": "Salesforce.com, Inc.",
    "lightning.com": "Salesforce.com, Inc.",
    "marketingcloud.com": "Salesforce.com, Inc.",
    "marketingcloudapis.com": "Salesforce.com, Inc.",
    "metamind.io": "Salesforce.com, Inc.",
    "pardot.com": "Salesforce.com, Inc.",
    "quotable.com": "Salesforce.com, Inc.",
    "radian6.com": "Salesforce.com, Inc.",
    "relateiq.com": "Salesforce.com, Inc.",
    "salesforce-communities.com": "Salesforce.com, Inc.",
    "salesforce.com": "Salesforce.com, Inc.",
    "salesforceiq.com": "Salesforce.com, Inc.",
    "salesforceliveagent.com": "Salesforce.com, Inc.",
    "salesforcemarketingcloud.com": "Salesforce.com, Inc.",
    "semver.io": "Salesforce.com, Inc.",
    "sequence.com": "Salesforce.com, Inc.",
    "sfdcstatic.com": "Salesforce.com, Inc.",
    "sforce.com": "Salesforce.com, Inc.",
    "site.com": "Salesforce.com, Inc.",
    "social.com": "Salesforce.com, Inc.",
    "steelbrick.com": "Salesforce.com, Inc.",
    "trailblazer.me": "Salesforce.com, Inc.",
    "twinprime.com": "Salesforce.com, Inc.",
    "visualforce.com": "Salesforce.com, Inc.",
    "weinvoiceit.com": "Salesforce.com, Inc.",
    "crazyegg.com": "Crazy Egg, Inc.",
    "hellobar.com": "Crazy Egg, Inc.",
    "campaignmonitor.com": "Campaign Monitor Pty Ltd",
    "cmail1.com": "Campaign Monitor Pty Ltd",
    "cmail2.com": "Campaign Monitor Pty Ltd",
    "cmail3.com": "Campaign Monitor Pty Ltd",
    "cmail4.com": "Campaign Monitor Pty Ltd",
    "cmail5.com": "Campaign Monitor Pty Ltd",
    "confirmsubscription.com": "Campaign Monitor Pty Ltd",
    "createsend.com": "Campaign Monitor Pty Ltd",
    "createsend1.com": "Campaign Monitor Pty Ltd",
    "createsend2.com": "Campaign Monitor Pty Ltd",
    "createsend3.com": "Campaign Monitor Pty Ltd",
    "createsend4.com": "Campaign Monitor Pty Ltd",
    "createsend5.com": "Campaign Monitor Pty Ltd",
    "csd.io": "Campaign Monitor Pty Ltd",
    "forwardtomyfriend.com": "Campaign Monitor Pty Ltd",
    "getfeedback.com": "Campaign Monitor Pty Ltd",
    "creative-serving.com": "Platform161",
    "p161.net": "Platform161",
    "platform161.com": "Platform161",
    "creativecdn.com": "RTB House S.A.",
    "inventorycdn.com": "RTB House S.A.",
    "crisp.chat": "Crisp IM SARL",
    "criteo.com": "Criteo SA",
    "criteo.net": "Criteo SA",
    "emailretargeting.com": "Criteo SA",
    "hlserve.com": "Criteo SA",
    "manage.com": "Criteo SA",
    "crsspxl.com": "Cross Pixel Media, Inc.",
    "crwdcntrl.net": "Lotame Solutions, Inc.",
    "lotame.com": "Lotame Solutions, Inc.",
    "contentful.com": "Contentful GmbH",
    "ctfassets.net": "Contentful GmbH",
    "ctnsnet.com": "Crimtan Holdings Ltd",
    "barracuda.com": "Barracuda Networks Inc.",
    "cudasvc.com": "Barracuda Networks Inc.",
    "customer.io": "Peaberry Software Inc.",
    "cxense.com": "Piano Software",
    "emediate.dk": "Piano Software",
    "emediate.eu": "Piano Software",
    "npttech.com": "Piano Software",
    "piano.io": "Piano Software",
    "tinypass.com": "Piano Software",
    "d-bi.fr": "DIGITAL BUSINESS INTELLIGENCE",
    "20min.ch": "Tamedia AG",
    "24heures.ch": "Tamedia AG",
    "bernerzeitung.ch": "Tamedia AG",
    "da-services.ch": "Tamedia AG",
    "dasmagazin.ch": "Tamedia AG",
    "derbund.ch": "Tamedia AG",
    "fuw.ch": "Tamedia AG",
    "heute.at": "Tamedia AG",
    "lematin.ch": "Tamedia AG",
    "newsnetz.ch": "Tamedia AG",
    "tagesanzeiger.ch": "Tamedia AG",
    "tamedia.ch": "Tamedia AG",
    "tda.io": "Tamedia AG",
    "tdg.ch": "Tamedia AG",
    "tutti.ch": "Tamedia AG",
    "tutti.li": "Tamedia AG",
    "zsz.ch": "Tamedia AG",
    "dable.io": "Dable",
    "dailymail.co.uk": "Associated Newspapers Limited",
    "dailymailplus.co.uk": "Associated Newspapers Limited",
    "dmgmedia.co.uk": "Associated Newspapers Limited",
    "mailexperiences.co.uk": "Associated Newspapers Limited",
    "mailfinance.co.uk": "Associated Newspapers Limited",
    "mailshop.co.uk": "Associated Newspapers Limited",
    "mailtravel.co.uk": "Associated Newspapers Limited",
    "mailwineclub.co.uk": "Associated Newspapers Limited",
    "metro.co.uk": "Associated Newspapers Limited",
    "mymail.co.uk": "Associated Newspapers Limited",
    "thisismoney.co.uk": "Associated Newspapers Limited",
    "you.co.uk": "Associated Newspapers Limited",
    "dailymotion.com": "Dailymotion SA",
    "dm-event.net": "Dailymotion SA",
    "dmcdn.net": "Dailymotion SA",
    "dmxleo.com": "Dailymotion SA",
    "pxlad.io": "Dailymotion SA",
    "browser-intake-datadoghq.com": "Datadog, Inc.",
    "datadoghq-browser-agent.com": "Datadog, Inc.",
    "datadoghq.com": "Datadog, Inc.",
    "datado.me": "DATADOME",
    "datadome.co": "DATADOME",
    "blackdesertonline.com": "Kakao Corp.",
    "brunch.co.kr": "Kakao Corp.",
    "daum.net": "Kakao Corp.",
    "daumcdn.net": "Kakao Corp.",
    "kakao.co.kr": "Kakao Corp.",
    "kakao.com": "Kakao Corp.",
    "kakaocdn.net": "Kakao Corp.",
    "kakaocorp.com": "Kakao Corp.",
    "kakaofriends.com": "Kakao Corp.",
    "kakaogame.com": "Kakao Corp.",
    "kakaotalk.com": "Kakao Corp.",
    "kgstatic.net": "Kakao Corp.",
    "dazn.com": "DAZN US LLC",
    "daznfeeds.com": "DAZN US LLC",
    "daznservices.com": "DAZN US LLC",
    "dcmn.com": "DCMN GmbH",
    "dcmn.io": "DCMN GmbH",
    "de17a.com": "Delta Projects AB",
    "decibelinsight.net": "Decibel Insight Ltd",
    "deepintent.com": "DeepIntent Inc",
    "dep-x.com": "MKT Media AB",
    "carsort.com": "Snapsort Inc.",
    "cpuboss.com": "Snapsort Inc.",
    "deployads.com": "Snapsort Inc.",
    "gpuboss.com": "Snapsort Inc.",
    "snapsort.com": "Snapsort Inc.",
    "dhresource.com": "Century Fuxuan Software & Technology Development (Beijing) Co. L",
    "dianomi.com": "Dianomi Ltd",
    "digitalocean.com": "DigitalOcean, LLC",
    "digitaloceanspaces.com": "DigitalOcean, LLC",
    "digitaltarget.ru": "LLC \"AmberData\"",
    "dimelochat.com": "dimelo sas",
    "disqus.com": "Disqus, Inc.",
    "disqusads.com": "Disqus, Inc.",
    "disquscdn.com": "Disqus, Inc.",
    "disqusservice.com": "Disqus, Inc.",
    "distributednews.com": "Arial Software LLC",
    "districtm.ca": "District M Inc.",
    "districtm.io": "District M Inc.",
    "districtm.net": "District M Inc.",
    "dotmetrics.net": "Dotmetrics",
    "anrdoezrs.net": "Conversant LLC",
    "awltovhc.com": "Conversant LLC",
    "conversantmedia.com": "Conversant LLC",
    "dotomi.com": "Conversant LLC",
    "dtmpub.com": "Conversant LLC",
    "emjcd.com": "Conversant LLC",
    "fastclick.net": "Conversant LLC",
    "ftjcfx.com": "Conversant LLC",
    "greystripe.com": "Conversant LLC",
    "jdoqocy.com": "Conversant LLC",
    "kqzyfj.com": "Conversant LLC",
    "lduhtrp.net": "Conversant LLC",
    "mediaplex.com": "Conversant LLC",
    "mplxtms.com": "Conversant LLC",
    "qksrv.net": "Conversant LLC",
    "tkqlhce.com": "Conversant LLC",
    "tqlkg.com": "Conversant LLC",
    "yceml.net": "Conversant LLC",
    "doubleverify.com": "DoubleVerify",
    "meetrics.com": "DoubleVerify",
    "meetrics.de": "DoubleVerify",
    "meetrics.net": "DoubleVerify",
    "mxcdn.net": "DoubleVerify",
    "openslate.com": "DoubleVerify",
    "openslatedata.com": "DoubleVerify",
    "research.de.com": "DoubleVerify",
    "auto-swiat.pl": "Ringier Axel Springer Media AG",
    "blikk.hu": "Ringier Axel Springer Media AG",
    "dreamlab.pl": "Ringier Axel Springer Media AG",
    "ewydania.pl": "Ringier Axel Springer Media AG",
    "grupaonet.pl": "Ringier Axel Springer Media AG",
    "komputerswiat.pl": "Ringier Axel Springer Media AG",
    "medonet.pl": "Ringier Axel Springer Media AG",
    "newsweek.pl": "Ringier Axel Springer Media AG",
    "nk.pl": "Ringier Axel Springer Media AG",
    "ocdn.eu": "Ringier Axel Springer Media AG",
    "onet.pl": "Ringier Axel Springer Media AG",
    "pclab.pl": "Ringier Axel Springer Media AG",
    "schweizer-illustrierte.ch": "Ringier Axel Springer Media AG",
    "skapiec.pl": "Ringier Axel Springer Media AG",
    "vod.pl": "Ringier Axel Springer Media AG",
    "zapytaj.com.pl": "Ringier Axel Springer Media AG",
    "zumi.pl": "Ringier Axel Springer Media AG",
    "drift.com": "Drift.com, Inc.",
    "driftt.com": "Drift.com, Inc.",
    "dtscout.com": "DTS Technology",
    "datawrapper.de": "Datawrapper GmbH",
    "dwcdn.net": "Datawrapper GmbH",
    "awin.com": "Awin AG",
    "contentfeed.net": "Awin AG",
    "digitalwindow.com": "Awin AG",
    "dwin1.com": "Awin AG",
    "dwin2.com": "Awin AG",
    "html-links.com": "Awin AG",
    "reussissonsensemble.fr": "Awin AG",
    "successfultogether.co.uk": "Awin AG",
    "webmasterplan.com": "Awin AG",
    "zanox-affiliate.de": "Awin AG",
    "zanox.com": "Awin AG",
    "dynad.net": "UOL",
    "dynamicyield.com": "Dynamic Yield",
    "dynatrace-managed.com": "Dynatrace LLC",
    "dynatrace.com": "Dynatrace LLC",
    "ruxit.com": "Dynatrace LLC",
    "dyntrk.com": "DynAdmic",
    "e-planning.net": "Teroa S.A.",
    "e-planning.video": "Teroa S.A.",
    "easydmp.net": "EMATCH",
    "2dehands.be": "eBay, Inc.",
    "2ememain.be": "eBay, Inc.",
    "about.co.kr": "eBay, Inc.",
    "annuncicdn.it": "eBay, Inc.",
    "auction.co.kr": "eBay, Inc.",
    "automobile.it": "eBay, Inc.",
    "bilbasen.dk": "eBay, Inc.",
    "classistatic.com": "eBay, Inc.",
    "dba.dk": "eBay, Inc.",
    "dbastatic.dk": "eBay, Inc.",
    "ebay-kleinanzeigen.de": "eBay, Inc.",
    "ebay-us.com": "eBay, Inc.",
    "ebay.at": "eBay, Inc.",
    "ebay.be": "eBay, Inc.",
    "ebay.ca": "eBay, Inc.",
    "ebay.ch": "eBay, Inc.",
    "ebay.co.uk": "eBay, Inc.",
    "ebay.com": "eBay, Inc.",
    "ebay.com.au": "eBay, Inc.",
    "ebay.com.hk": "eBay, Inc.",
    "ebay.com.my": "eBay, Inc.",
    "ebay.com.sg": "eBay, Inc.",
    "ebay.de": "eBay, Inc.",
    "ebay.es": "eBay, Inc.",
    "ebay.fr": "eBay, Inc.",
    "ebay.ie": "eBay, Inc.",
    "ebay.it": "eBay, Inc.",
    "ebay.nl": "eBay, Inc.",
    "ebay.ph": "eBay, Inc.",
    "ebay.pl": "eBay, Inc.",
    "ebay.ru": "eBay, Inc.",
    "ebay.se": "eBay, Inc.",
    "ebay.vn": "eBay, Inc.",
    "ebayadservices.com": "eBay, Inc.",
    "ebayc3.com": "eBay, Inc.",
    "ebayimg.com": "eBay, Inc.",
    "ebayinc.com": "eBay, Inc.",
    "ebaymotors.com": "eBay, Inc.",
    "ebayrtm.com": "eBay, Inc.",
    "ebaystatic.com": "eBay, Inc.",
    "ebaystores.com": "eBay, Inc.",
    "gmarket.co.kr": "eBay, Inc.",
    "gumtree.co.za": "eBay, Inc.",
    "gumtree.com.au": "eBay, Inc.",
    "gumtree.pl": "eBay, Inc.",
    "iacstatic.co.kr": "eBay, Inc.",
    "kijiji.ca": "eBay, Inc.",
    "kijiji.it": "eBay, Inc.",
    "shopping.com": "eBay, Inc.",
    "shoppingshadow.com": "eBay, Inc.",
    "terapeak.de": "eBay, Inc.",
    "tweedehands.nl": "eBay, Inc.",
    "vivanuncios.com.mx": "eBay, Inc.",
    "ecal.com": "E-Diary Pty Ltd",
    "eccmp.com": "Cheetah Digital Inc",
    "editmysite.com": "Weebly, Inc.",
    "weebly.com": "Weebly, Inc.",
    "effectivemeasure.net": "Effective Measure International Pty Ltd",
    "surefire.link": "Effective Measure International Pty Ltd",
    "elfsight.com": "Vladimir Fedotov",
    "emsecure.net": "Selligent",
    "slgnt.eu": "Selligent",
    "slgnt.us": "Selligent",
    "emxdgt.com": "Engine USA LLC",
    "ebayadvertising.com": "Ensighten, Inc",
    "ensighten.com": "Ensighten, Inc",
    "levexis.com": "Ensighten, Inc",
    "nc0.co": "Ensighten, Inc",
    "episerver.net": "EPiServer AB",
    "eqads.com": "EQ Works",
    "eqworks.com": "EQ Works",
    "ero-advertising.com": "Interwebvertising B.V.",
    "dealer.com": "Dealer Dot Com Inc",
    "esm1.net": "Dealer Dot Com Inc",
    "1313starwars.de": "The Walt Disney Company",
    "1313sw.de": "The Walt Disney Company",
    "6abc.com": "The Walt Disney Company",
    "abc-studios.com": "The Walt Disney Company",
    "abc.com": "The Walt Disney Company",
    "abc11.com": "The Walt Disney Company",
    "abc13.com": "The Walt Disney Company",
    "abc30.com": "The Walt Disney Company",
    "abc7.com": "The Walt Disney Company",
    "abc7chicago.com": "The Walt Disney Company",
    "abc7news.com": "The Walt Disney Company",
    "abc7ny.com": "The Walt Disney Company",
    "abcnews.com": "The Walt Disney Company",
    "abcotvdev.com": "The Walt Disney Company",
    "abcotvs.com": "The Walt Disney Company",
    "abcotvs.net": "The Walt Disney Company",
    "alllucas.com": "The Walt Disney Company",
    "annihil.us": "The Walt Disney Company",
    "babble.com": "The Walt Disney Company",
    "bamcontent.com": "The Walt Disney Company",
    "bamgrid.com": "The Walt Disney Company",
    "bls-customers.com": "The Walt Disney Company",
    "dilcdn.com": "The Walt Disney Company",
    "disney-plus.net": "The Walt Disney Company",
    "disney.be": "The Walt Disney Company",
    "disney.bg": "The Walt Disney Company",
    "disney.ca": "The Walt Disney Company",
    "disney.ch": "The Walt Disney Company",
    "disney.co.il": "The Walt Disney Company",
    "disney.co.jp": "The Walt Disney Company",
    "disney.co.kr": "The Walt Disney Company",
    "disney.co.th": "The Walt Disney Company",
    "disney.co.uk": "The Walt Disney Company",
    "disney.co.za": "The Walt Disney Company",
    "disney.com": "The Walt Disney Company",
    "disney.com.au": "The Walt Disney Company",
    "disney.com.br": "The Walt Disney Company",
    "disney.com.cn": "The Walt Disney Company",
    "disney.com.hk": "The Walt Disney Company",
    "disney.com.tr": "The Walt Disney Company",
    "disney.com.tw": "The Walt Disney Company",
    "disney.cz": "The Walt Disney Company",
    "disney.de": "The Walt Disney Company",
    "disney.dk": "The Walt Disney Company",
    "disney.es": "The Walt Disney Company",
    "disney.fi": "The Walt Disney Company",
    "disney.fr": "The Walt Disney Company",
    "disney.gr": "The Walt Disney Company",
    "disney.hu": "The Walt Disney Company",
    "disney.id": "The Walt Disney Company",
    "disney.in": "The Walt Disney Company",
    "disney.io": "The Walt Disney Company",
    "disney.it": "The Walt Disney Company",
    "disney.my": "The Walt Disney Company",
    "disney.nl": "The Walt Disney Company",
    "disney.no": "The Walt Disney Company",
    "disney.ph": "The Walt Disney Company",
    "disney.pl": "The Walt Disney Company",
    "disney.pt": "The Walt Disney Company",
    "disney.ro": "The Walt Disney Company",
    "disney.ru": "The Walt Disney Company",
    "disney.se": "The Walt Disney Company",
    "disney.sg": "The Walt Disney Company",
    "disneyadsales.com": "The Walt Disney Company",
    "disneyatoz.com": "The Walt Disney Company",
    "disneyaulani.com": "The Walt Disney Company",
    "disneybaby.com": "The Walt Disney Company",
    "disneycareers.com": "The Walt Disney Company",
    "disneyinternational.com": "The Walt Disney Company",
    "disneyinternational.net": "The Walt Disney Company",
    "disneyinternationalhd.com": "The Walt Disney Company",
    "disneyjunior.com": "The Walt Disney Company",
    "disneylandparis.com": "The Walt Disney Company",
    "disneylatino.com": "The Walt Disney Company",
    "disneylive.com": "The Walt Disney Company",
    "disneyme.com": "The Walt Disney Company",
    "disneynow.com": "The Walt Disney Company",
    "disneyonbroadway.com": "The Walt Disney Company",
    "disneyonice.com": "The Walt Disney Company",
    "disneyonline.com": "The Walt Disney Company",
    "disneyplus.com": "The Walt Disney Company",
    "disneyprivacycenter.com": "The Walt Disney Company",
    "disneysprings.com": "The Walt Disney Company",
    "disneystore.com": "The Walt Disney Company",
    "disneystreaming.com": "The Walt Disney Company",
    "disneytermsofuse.com": "The Walt Disney Company",
    "dlp-media.com": "The Walt Disney Company",
    "dolimg.com": "The Walt Disney Company",
    "dssott.com": "The Walt Disney Company",
    "edgedatg.com": "The Walt Disney Company",
    "espn.co.uk": "The Walt Disney Company",
    "espn.com": "The Walt Disney Company",
    "espn.com.au": "The Walt Disney Company",
    "espn.com.br": "The Walt Disney Company",
    "espn.com.mx": "The Walt Disney Company",
    "espn.in": "The Walt Disney Company",
    "espncdn.com": "The Walt Disney Company",
    "espncricinfo.com": "The Walt Disney Company",
    "espnfc.com": "The Walt Disney Company",
    "espnmediazone.com": "The Walt Disney Company",
    "fftvfe.com": "The Walt Disney Company",
    "findstarwarsrebels.com": "The Walt Disney Company",
    "fivethirtyeight.com": "The Walt Disney Company",
    "fn-pz.com": "The Walt Disney Company",
    "foxplay.com": "The Walt Disney Company",
    "freeform.com": "The Walt Disney Company",
    "fxnetworks.com": "The Walt Disney Company",
    "fxtvfe.com": "The Walt Disney Company",
    "go.com": "The Walt Disney Company",
    "goodmorningamerica.com": "The Walt Disney Company",
    "holonetnews.com": "The Walt Disney Company",
    "hulu.com": "The Walt Disney Company",
    "huluim.com": "The Walt Disney Company",
    "huluqa.com": "The Walt Disney Company",
    "hulustream.com": "The Walt Disney Company",
    "ilm-vancouver.com": "The Walt Disney Company",
    "ilm.com": "The Walt Disney Company",
    "ilmartdepartment.com": "The Walt Disney Company",
    "ilmartdepartment.net": "The Walt Disney Company",
    "ilmartdepartment.org": "The Walt Disney Company",
    "ilmartdept.com": "The Walt Disney Company",
    "ilmartdept.net": "The Walt Disney Company",
    "ilmartdept.org": "The Walt Disney Company",
    "ilmconceptart.com": "The Walt Disney Company",
    "ilmconceptart.net": "The Walt Disney Company",
    "ilmconceptart.org": "The Walt Disney Company",
    "indiana-jones.com": "The Walt Disney Company",
    "indianajones.net": "The Walt Disney Company",
    "indianajones.org": "The Walt Disney Company",
    "indianajonesstore.com": "The Walt Disney Company",
    "indyjones.com": "The Walt Disney Company",
    "jointhejedi.ca": "The Walt Disney Company",
    "jointhejedi.com": "The Walt Disney Company",
    "latamtvfe.com": "The Walt Disney Company",
    "legoindy2game.com": "The Walt Disney Company",
    "livesegmentservice.com": "The Walt Disney Company",
    "livestarwars.com": "The Walt Disney Company",
    "lucasarts.com": "The Walt Disney Company",
    "lucasfilm.com": "The Walt Disney Company",
    "lucasfilms.com": "The Walt Disney Company",
    "lucaslicensing.com": "The Walt Disney Company",
    "marvel.com": "The Walt Disney Company",
    "marvelfe.com": "The Walt Disney Company",
    "marvelkids.com": "The Walt Disney Company",
    "marvelstore.com": "The Walt Disney Company",
    "moviesanywhere.com": "The Walt Disney Company",
    "natgeokids.com": "The Walt Disney Company",
    "nationalgeographic.com": "The Walt Disney Company",
    "nationalgeographic.org": "The Walt Disney Company",
    "ngeo.com": "The Walt Disney Company",
    "ngtvfe.com": "The Walt Disney Company",
    "nic.abc": "The Walt Disney Company",
    "pixar.com": "The Walt Disney Company",
    "playstarwarsuprising.com": "The Walt Disney Company",
    "shopdisney.com": "The Walt Disney Company",
    "shopmarvel.com": "The Walt Disney Company",
    "simpsonsworld.com": "The Walt Disney Company",
    "sith.net": "The Walt Disney Company",
    "skysound.com": "The Walt Disney Company",
    "skywalkersound.com": "The Walt Disney Company",
    "starwars.com": "The Walt Disney Company",
    "starwars.de": "The Walt Disney Company",
    "starwars1313.com.au": "The Walt Disney Company",
    "starwars1313.de": "The Walt Disney Company",
    "starwarsarenaforce.com": "The Walt Disney Company",
    "starwarsarenaforce.net": "The Walt Disney Company",
    "starwarsarenaforce.org": "The Walt Disney Company",
    "starwarsforcearena.net": "The Walt Disney Company",
    "starwarsforcearena.org": "The Walt Disney Company",
    "starwarsgalacticdefense.com": "The Walt Disney Company",
    "starwarskids.com": "The Walt Disney Company",
    "starwarsresistance.com": "The Walt Disney Company",
    "starwarsrots.com": "The Walt Disney Company",
    "sw1313.de": "The Walt Disney Company",
    "swdemolition.com": "The Walt Disney Company",
    "swkids.org": "The Walt Disney Company",
    "theundefeated.com": "The Walt Disney Company",
    "thewaltdisneycompany.com": "The Walt Disney Company",
    "wabcradio.com": "The Walt Disney Company",
    "watchdisneyfe.com": "The Walt Disney Company",
    "wdpromedia.com": "The Walt Disney Company",
    "apps-static.com": "NIC.UA LLC",
    "chatalternative.com": "NIC.UA LLC",
    "esputnik.com": "NIC.UA LLC",
    "tits-guru.com": "NIC.UA LLC",
    "videochatru.com": "NIC.UA LLC",
    "etracker.com": "etracker GmbH",
    "etracker.de": "etracker GmbH",
    "eolcdn.com": "Eulerian Technologies",
    "eulerian.net": "Eulerian Technologies",
    "ew3.io": "Eulerian Technologies",
    "betrad.com": "Crownpeak Technology",
    "crownpeak.com": "Crownpeak Technology",
    "crownpeak.net": "Crownpeak Technology",
    "evidon.com": "Crownpeak Technology",
    "dynsrvazg.com": "ExoClick, S.L.",
    "dynsrvazh.com": "ExoClick, S.L.",
    "dynsrvtbg.com": "ExoClick, S.L.",
    "dynsrvtyu.com": "ExoClick, S.L.",
    "exdynsrv.com": "ExoClick, S.L.",
    "exoclick.com": "ExoClick, S.L.",
    "exosrv.com": "ExoClick, S.L.",
    "notifysrv.com": "ExoClick, S.L.",
    "realsrv.com": "ExoClick, S.L.",
    "wpncdn.com": "ExoClick, S.L.",
    "exelate.com": "The Nielsen Company",
    "exelator.com": "The Nielsen Company",
    "imrworldwide.com": "The Nielsen Company",
    "myvisualiq.net": "The Nielsen Company",
    "nielsen.com": "The Nielsen Company",
    "vdna-assets.com": "The Nielsen Company",
    "visualdna.com": "The Nielsen Company",
    "visualiq.com": "The Nielsen Company",
    "visualiq.de": "The Nielsen Company",
    "visualiq.fr": "The Nielsen Company",
    "exitbee.com": "Exit Bee",
    "expertrec.com": "cloudinfra",
    "exponential.com": "Exponential Interactive Inc.",
    "tribalfusion.com": "Exponential Interactive Inc.",
    "extend.tv": "ZypMedia, Inc.",
    "zyp.tv": "ZypMedia, Inc.",
    "zypmedia.com": "ZypMedia, Inc.",
    "extole.com": "Extole",
    "extole.io": "Extole",
    "eyeota.net": "eyeota Limited",
    "ezodn.com": "Ezoic Inc.",
    "ezoic.com": "Ezoic Inc.",
    "ezoic.net": "Ezoic Inc.",
    "accountkit.com": "Facebook, Inc.",
    "atdmt.com": "Facebook, Inc.",
    "atdmt2.com": "Facebook, Inc.",
    "atlassbx.com": "Facebook, Inc.",
    "atlassolutions.com": "Facebook, Inc.",
    "cdninstagram.com": "Facebook, Inc.",
    "crowdtangle.com": "Facebook, Inc.",
    "facebook.com": "Facebook, Inc.",
    "facebook.net": "Facebook, Inc.",
    "facebookmail.com": "Facebook, Inc.",
    "fb.com": "Facebook, Inc.",
    "fb.gg": "Facebook, Inc.",
    "fb.me": "Facebook, Inc.",
    "fbcdn.net": "Facebook, Inc.",
    "fbsbx.com": "Facebook, Inc.",
    "fbthirdpartypixel.com": "Facebook, Inc.",
    "fbthirdpartypixel.net": "Facebook, Inc.",
    "fbthirdpartypixel.org": "Facebook, Inc.",
    "flow.org": "Facebook, Inc.",
    "flowtype.org": "Facebook, Inc.",
    "graphql.org": "Facebook, Inc.",
    "instagr.am": "Facebook, Inc.",
    "instagr.com": "Facebook, Inc.",
    "instagram.com": "Facebook, Inc.",
    "liverail.com": "Facebook, Inc.",
    "m.me": "Facebook, Inc.",
    "messenger.com": "Facebook, Inc.",
    "oculus.com": "Facebook, Inc.",
    "oculuscdn.com": "Facebook, Inc.",
    "oculusrift.com": "Facebook, Inc.",
    "oculusvr.com": "Facebook, Inc.",
    "onavo.com": "Facebook, Inc.",
    "onavo.net": "Facebook, Inc.",
    "onavo.org": "Facebook, Inc.",
    "onavoinsights.com": "Facebook, Inc.",
    "powersunitedvr.com": "Facebook, Inc.",
    "reactjs.org": "Facebook, Inc.",
    "thefind.com": "Facebook, Inc.",
    "vircado.com": "Facebook, Inc.",
    "wa.me": "Facebook, Inc.",
    "whatsapp.com": "Facebook, Inc.",
    "whatsapp.net": "Facebook, Inc.",
    "wit.ai": "Facebook, Inc.",
    "facil-iti.com": "ITI COMMUNICATION",
    "fanplayr.com": "Fanplayr Inc.",
    "fastg8.com": "FastG8",
    "fg8dgt.com": "FastG8",
    "fifty.io": "Fifty Technology Limited",
    "fiftyt.com": "Fifty Technology Limited",
    "analysis.fi": "AppendAd LTD",
    "firstimpression.io": "AppendAd LTD",
    "fitanalytics.com": "Fit Analytics GmbH",
    "flashtalking.com": "Flashtalking Inc",
    "flipboard.com": "Flipboard, Inc.",
    "flipp.com": "Flipp Corp.",
    "wishabi.ca": "Flipp Corp.",
    "wishabi.com": "Flipp Corp.",
    "wishabi.net": "Flipp Corp.",
    "flowplayer.com": "Flowplayer AB",
    "flowplayer.org": "Flowplayer AB",
    "fomo.com": "Fomo",
    "notifyapp.io": "Fomo",
    "fontawesome.com": "Fonticons Inc",
    "fontawesome.io": "Fonticons Inc",
    "fonticons.com": "Fonticons Inc",
    "fortawesome.com": "Fonticons Inc",
    "symbolset.com": "Fonticons Inc",
    "fonts.com": "Monotype Imaging Inc.",
    "fonts.net": "Monotype Imaging Inc.",
    "linotype.com": "Monotype Imaging Inc.",
    "monotype.com": "Monotype Imaging Inc.",
    "monotypeimaging.com": "Monotype Imaging Inc.",
    "photorank.me": "Monotype Imaging Inc.",
    "centurylink.com": "CenturyLink, Inc.",
    "centurylink.net": "CenturyLink, Inc.",
    "ctl.io": "CenturyLink, Inc.",
    "footprint.net": "CenturyLink, Inc.",
    "irsdn.net": "CenturyLink, Inc.",
    "4seeresults.com": "ForeSee Results, Inc.",
    "foresee.com": "ForeSee Results, Inc.",
    "foreseeresults.com": "ForeSee Results, Inc.",
    "formstack.com": "Formstack",
    "forter.com": "Forter Inc.",
    "21cf.com": "Twenty-First Century Fox, Inc.",
    "24kitchen.nl": "Twenty-First Century Fox, Inc.",
    "alienuniverse.com": "Twenty-First Century Fox, Inc.",
    "apesvr.com": "Twenty-First Century Fox, Inc.",
    "avatar.com": "Twenty-First Century Fox, Inc.",
    "cluesareeverywhere.com": "Twenty-First Century Fox, Inc.",
    "deadpoolcore.com": "Twenty-First Century Fox, Inc.",
    "dearworldlovesimon.com": "Twenty-First Century Fox, Inc.",
    "fox.com": "Twenty-First Century Fox, Inc.",
    "foxconnect.com": "Twenty-First Century Fox, Inc.",
    "foxdcg.com": "Twenty-First Century Fox, Inc.",
    "foxdeportes.com": "Twenty-First Century Fox, Inc.",
    "foxmovies.com": "Twenty-First Century Fox, Inc.",
    "foxplus.com": "Twenty-First Century Fox, Inc.",
    "foxredeem.com": "Twenty-First Century Fox, Inc.",
    "foxsearchlight.com": "Twenty-First Century Fox, Inc.",
    "foxsports.com": "Twenty-First Century Fox, Inc.",
    "foxsportsasia.com": "Twenty-First Century Fox, Inc.",
    "foxsportsgo.com": "Twenty-First Century Fox, Inc.",
    "fssta.com": "Twenty-First Century Fox, Inc.",
    "lovesimontickets.com": "Twenty-First Century Fox, Inc.",
    "planetoftheapes.com": "Twenty-First Century Fox, Inc.",
    "poweredbylovetour.com": "Twenty-First Century Fox, Inc.",
    "redsparrowtickets.com": "Twenty-First Century Fox, Inc.",
    "thepostmovietickets.com": "Twenty-First Century Fox, Inc.",
    "theshapeofwaterthemovie.com": "Twenty-First Century Fox, Inc.",
    "threebillboardsthemovie.com": "Twenty-First Century Fox, Inc.",
    "fqtag.com": "Forensiq",
    "securepaths.com": "Forensiq",
    "freeskreen.com": "SlimCut Media SAS",
    "freshdesk.com": "Freshworks Inc",
    "getadblock.com": "Freshworks Inc",
    "fstrk.net": "24metrics GmbH",
    "fullstory.com": "FullStory",
    "future-hawk-content.co.uk": "Future Plc",
    "futurecdn.net": "Future Plc",
    "getprice.com.au": "Future Plc",
    "myfavouritemagazines.co.uk": "Future Plc",
    "freewheel.tv": "FreeWheel",
    "fwmrm.net": "FreeWheel",
    "stickyadstv.com": "FreeWheel",
    "10best.com": "Gannett Co., Inc.",
    "10bestmedia.com": "Gannett Co., Inc.",
    "app.com": "Gannett Co., Inc.",
    "argusleader.com": "Gannett Co., Inc.",
    "azcentral.com": "Gannett Co., Inc.",
    "bnqt.com": "Gannett Co., Inc.",
    "burlingtonfreepress.com": "Gannett Co., Inc.",
    "caller.com": "Gannett Co., Inc.",
    "cincinnati.com": "Gannett Co., Inc.",
    "citizen-times.com": "Gannett Co., Inc.",
    "clarionledger.com": "Gannett Co., Inc.",
    "coloradoan.com": "Gannett Co., Inc.",
    "commercialappeal.com": "Gannett Co., Inc.",
    "courier-journal.com": "Gannett Co., Inc.",
    "courierpostonline.com": "Gannett Co., Inc.",
    "courierpress.com": "Gannett Co., Inc.",
    "dailyrecord.com": "Gannett Co., Inc.",
    "delawareonline.com": "Gannett Co., Inc.",
    "delmarvanow.com": "Gannett Co., Inc.",
    "democratandchronicle.com": "Gannett Co., Inc.",
    "desertsun.com": "Gannett Co., Inc.",
    "desmoinesregister.com": "Gannett Co., Inc.",
    "detroitnews.com": "Gannett Co., Inc.",
    "dnj.com": "Gannett Co., Inc.",
    "elpasotimes.com": "Gannett Co., Inc.",
    "floridatoday.com": "Gannett Co., Inc.",
    "freep.com": "Gannett Co., Inc.",
    "gannett-cdn.com": "Gannett Co., Inc.",
    "gannett.com": "Gannett Co., Inc.",
    "gannettdigital.com": "Gannett Co., Inc.",
    "gcion.com": "Gannett Co., Inc.",
    "golfweek.com": "Gannett Co., Inc.",
    "greatfallstribune.com": "Gannett Co., Inc.",
    "greenbaypressgazette.com": "Gannett Co., Inc.",
    "greenvilleonline.com": "Gannett Co., Inc.",
    "guampdn.com": "Gannett Co., Inc.",
    "hometownlife.com": "Gannett Co., Inc.",
    "hoopshype.com": "Gannett Co., Inc.",
    "independentmail.com": "Gannett Co., Inc.",
    "indystar.com": "Gannett Co., Inc.",
    "jconline.com": "Gannett Co., Inc.",
    "kitsapsun.com": "Gannett Co., Inc.",
    "knoxnews.com": "Gannett Co., Inc.",
    "lansingstatejournal.com": "Gannett Co., Inc.",
    "lcsun-news.com": "Gannett Co., Inc.",
    "livingstondaily.com": "Gannett Co., Inc.",
    "lohud.com": "Gannett Co., Inc.",
    "mansfieldnewsjournal.com": "Gannett Co., Inc.",
    "mmajunkie.com": "Gannett Co., Inc.",
    "montgomeryadvertiser.com": "Gannett Co., Inc.",
    "mycentraljersey.com": "Gannett Co., Inc.",
    "naplesnews.com": "Gannett Co., Inc.",
    "newarkadvocate.com": "Gannett Co., Inc.",
    "news-leader.com": "Gannett Co., Inc.",
    "news-press.com": "Gannett Co., Inc.",
    "newsleader.com": "Gannett Co., Inc.",
    "northjersey.com": "Gannett Co., Inc.",
    "packersnews.com": "Gannett Co., Inc.",
    "pnj.com": "Gannett Co., Inc.",
    "postcrescent.com": "Gannett Co., Inc.",
    "poughkeepsiejournal.com": "Gannett Co., Inc.",
    "press-citizen.com": "Gannett Co., Inc.",
    "pressconnects.com": "Gannett Co., Inc.",
    "reachlocalservices.com": "Gannett Co., Inc.",
    "redding.com": "Gannett Co., Inc.",
    "rgj.com": "Gannett Co., Inc.",
    "rlets.com": "Gannett Co., Inc.",
    "rtrk.com": "Gannett Co., Inc.",
    "sctimes.com": "Gannett Co., Inc.",
    "shreveporttimes.com": "Gannett Co., Inc.",
    "statesmanjournal.com": "Gannett Co., Inc.",
    "tallahassee.com": "Gannett Co., Inc.",
    "tcpalm.com": "Gannett Co., Inc.",
    "tennessean.com": "Gannett Co., Inc.",
    "theadvertiser.com": "Gannett Co., Inc.",
    "thebiglead.com": "Gannett Co., Inc.",
    "thecalifornian.com": "Gannett Co., Inc.",
    "theleafchronicle.com": "Gannett Co., Inc.",
    "thenewsstar.com": "Gannett Co., Inc.",
    "thespectrum.com": "Gannett Co., Inc.",
    "thetimesherald.com": "Gannett Co., Inc.",
    "usatoday.com": "Gannett Co., Inc.",
    "usatodayhss.com": "Gannett Co., Inc.",
    "vcstar.com": "Gannett Co., Inc.",
    "visaliatimesdelta.com": "Gannett Co., Inc.",
    "wausaudailyherald.com": "Gannett Co., Inc.",
    "ydr.com": "Gannett Co., Inc.",
    "gatedcontent.com": "Esperto Ltd",
    "gcdn.co": "G-Core Innovations S.a.r.l",
    "geetest.com": "Wuhan Jiyi Network Technology Co., Ltd.",
    "geistm.com": "GeistM",
    "gemius.pl": "Gemius S.A.",
    "getblue.io": "getblue",
    "getbread.com": "Bread",
    "candid.io": "FIVEACES INC",
    "getcandid.com": "FIVEACES INC",
    "getclicky.com": "Roxr Software Ltd",
    "getflowbox.com": "cyon GmbH",
    "getrockerbox.com": "Rockerbox, Inc.",
    "rockerbox.com": "Rockerbox, Inc.",
    "getsitecontrol.com": "GetWebCraft Limited",
    "gigya.com": "Gigya Inc",
    "giosg.com": "giosg.com Ltd.",
    "gmossp-sp.jp": "GMO AD Marketing Inc.",
    "reemo-ad.jp": "GMO AD Marketing Inc.",
    "taxel.jp": "GMO AD Marketing Inc.",
    "webtracker.jp": "GMO AD Marketing Inc.",
    "goqubit.com": "QuBit Digital Ltd",
    "qubit.com": "QuBit Digital Ltd",
    "qubitproducts.com": "QuBit Digital Ltd",
    "gr-cdn.com": "GetResponse sp. z o.o.",
    "akismet.com": "Automattic, Inc.",
    "cldup.com": "Automattic, Inc.",
    "cloudup.com": "Automattic, Inc.",
    "crowdsignal.com": "Automattic, Inc.",
    "gravatar.com": "Automattic, Inc.",
    "happy.tools": "Automattic, Inc.",
    "intensedebate.com": "Automattic, Inc.",
    "jetpack.com": "Automattic, Inc.",
    "longreads.com": "Automattic, Inc.",
    "mongoosejs.com": "Automattic, Inc.",
    "polldaddy.com": "Automattic, Inc.",
    "pubmine.com": "Automattic, Inc.",
    "pubpress.net": "Automattic, Inc.",
    "simplenote.com": "Automattic, Inc.",
    "tumblr.com": "Automattic, Inc.",
    "vaultpress.com": "Automattic, Inc.",
    "videopress.com": "Automattic, Inc.",
    "woocommerce.com": "Automattic, Inc.",
    "wordads.co": "Automattic, Inc.",
    "wordpress.com": "Automattic, Inc.",
    "wordpress.tv": "Automattic, Inc.",
    "wp.com": "Automattic, Inc.",
    "wpvip.com": "Automattic, Inc.",
    "groovehq.com": "Groove Networks LLC",
    "genieedmp.com": "Geniee, inc.",
    "genieesspv.jp": "Geniee, inc.",
    "gssp.asia": "Geniee, inc.",
    "gsspat.jp": "Geniee, inc.",
    "gsspcln.jp": "Geniee, inc.",
    "gssprt.jp": "Geniee, inc.",
    "ma-jin.jp": "Geniee, inc.",
    "buysafe.com": "buySAFE Inc",
    "guarantee-cdn.com": "buySAFE Inc",
    "gumgum.com": "GumGum",
    "h-cdn.com": "Hola Networks Ltd.",
    "hola.org": "Hola Networks Ltd.",
    "hawksearch.com": "Hawk Search Inc.",
    "hawksearch.info": "Hawk Search Inc.",
    "berkeleywellness.com": "Remedy Health Media",
    "healthcentral.com": "Remedy Health Media",
    "rmdy.hm": "Remedy Health Media",
    "thebody.com": "Remedy Health Media",
    "heap.io": "Heap",
    "heapanalytics.com": "Heap",
    "hiconversion.com": "HiConversion, Inc.",
    "histats.com": "wisecode s.r.l.",
    "asiawebdirect.com": "Hotels.com",
    "bali-indonesia.com": "Hotels.com",
    "bangkok.com": "Hotels.com",
    "cdn-hotels.com": "Hotels.com",
    "hotels.com": "Hotels.com",
    "hotelsapi.io": "Hotels.com",
    "phuket.com": "Hotels.com",
    "smartstays.com": "Hotels.com",
    "vietnam-guide.com": "Hotels.com",
    "hotjar.com": "Hotjar Ltd",
    "hotjar.io": "Hotjar Ltd",
    "arubanetworks.com": "HP Inc",
    "dxcdynamics.com": "HP Inc",
    "hp.com": "HP Inc",
    "hpconnected.com": "HP Inc",
    "hpe.com": "HP Inc",
    "www8-hp.com": "HP Inc",
    "gettally.com": "HubSpot, Inc.",
    "grader.com": "HubSpot, Inc.",
    "hs-analytics.net": "HubSpot, Inc.",
    "hs-banner.com": "HubSpot, Inc.",
    "hs-scripts.com": "HubSpot, Inc.",
    "hsadspixel.net": "HubSpot, Inc.",
    "hsappstatic.net": "HubSpot, Inc.",
    "hscollectedforms.net": "HubSpot, Inc.",
    "hscta.net": "HubSpot, Inc.",
    "hsforms.com": "HubSpot, Inc.",
    "hsforms.net": "HubSpot, Inc.",
    "hsleadflows.net": "HubSpot, Inc.",
    "hubapi.com": "HubSpot, Inc.",
    "hubspot.com": "HubSpot, Inc.",
    "hubspot.de": "HubSpot, Inc.",
    "hubspot.es": "HubSpot, Inc.",
    "hubspot.fr": "HubSpot, Inc.",
    "hubspot.jp": "HubSpot, Inc.",
    "hubspot.net": "HubSpot, Inc.",
    "hubspotanalytics.com": "HubSpot, Inc.",
    "hubspotcentral.com": "HubSpot, Inc.",
    "hubspotfeedback.com": "HubSpot, Inc.",
    "inbound.com": "HubSpot, Inc.",
    "leadin.com": "HubSpot, Inc.",
    "li.me": "HubSpot, Inc.",
    "minitab.com": "HubSpot, Inc.",
    "readthink.com": "HubSpot, Inc.",
    "thinkgrowth.org": "HubSpot, Inc.",
    "usemessages.com": "HubSpot, Inc.",
    "hsbc.co.uk": "HSBC Holdings plc",
    "hsbc.com": "HSBC Holdings plc",
    "hsbc.com.mx": "HSBC Holdings plc",
    "hsbc.fr": "HSBC Holdings plc",
    "hsbc.uk": "HSBC Holdings plc",
    "member-hsbc-group.com": "HSBC Holdings plc",
    "hybrid.ai": "Hybrid Adtech, Inc.",
    "i-mobile.co.jp": "i-mobile co. LTD",
    "iadvize.com": "iAdvize",
    "ib-ibi.com": "KBM Group LLC",
    "airlinepilotforums.com": "Internet Brands Inc",
    "allaboutcounseling.com": "Internet Brands Inc",
    "alllaw.com": "Internet Brands Inc",
    "autos.com": "Internet Brands Inc",
    "cancerforums.net": "Internet Brands Inc",
    "carsdirect.com": "Internet Brands Inc",
    "criminaldefenselawyer.com": "Internet Brands Inc",
    "disabilitysecrets.com": "Internet Brands Inc",
    "divorcenet.com": "Internet Brands Inc",
    "doityourself.com": "Internet Brands Inc",
    "drivinglaws.org": "Internet Brands Inc",
    "edoctors.com": "Internet Brands Inc",
    "ehealthforum.com": "Internet Brands Inc",
    "findgift.com": "Internet Brands Inc",
    "finweb.com": "Internet Brands Inc",
    "fitday.com": "Internet Brands Inc",
    "fodors.com": "Internet Brands Inc",
    "greencarreports.com": "Internet Brands Inc",
    "hdforums.com": "Internet Brands Inc",
    "healthboards.com": "Internet Brands Inc",
    "hgmsites.net": "Internet Brands Inc",
    "huntingnet.com": "Internet Brands Inc",
    "ibautomotive.com": "Internet Brands Inc",
    "ibclick.stream": "Internet Brands Inc",
    "ibpxl.com": "Internet Brands Inc",
    "ibsrv.net": "Internet Brands Inc",
    "internetbrands.com": "Internet Brands Inc",
    "justmommies.com": "Internet Brands Inc",
    "lawyers.com": "Internet Brands Inc",
    "loan.com": "Internet Brands Inc",
    "martindale.com": "Internet Brands Inc",
    "modelmayhem.com": "Internet Brands Inc",
    "motorauthority.com": "Internet Brands Inc",
    "ngagelive.com": "Internet Brands Inc",
    "nolo.com": "Internet Brands Inc",
    "oldride.com": "Internet Brands Inc",
    "pprune.org": "Internet Brands Inc",
    "quiltingboard.com": "Internet Brands Inc",
    "rctech.net": "Internet Brands Inc",
    "rcuniverse.com": "Internet Brands Inc",
    "soberrecovery.com": "Internet Brands Inc",
    "steves-digicams.com": "Internet Brands Inc",
    "thecarconnection.com": "Internet Brands Inc",
    "thegooddrugsguide.com": "Internet Brands Inc",
    "thehulltruth.com": "Internet Brands Inc",
    "vbulletin.net": "Internet Brands Inc",
    "vetinfo.com": "Internet Brands Inc",
    "wikitravel.org": "Internet Brands Inc",
    "bbelements.com": "Internet Billboard a.s.",
    "ibillboard.com": "Internet Billboard a.s.",
    "id5-sync.com": "ID5 Technology Ltd",
    "idio.co": "idio",
    "iljmp.com": "Awio Web Services LLC",
    "improvedcontactform.com": "Awio Web Services LLC",
    "w3counter.com": "Awio Web Services LLC",
    "forumvi.com": "exotikweb",
    "gta-ru.com": "exotikweb",
    "hitsk.in": "exotikweb",
    "illiweb.com": "exotikweb",
    "imbox.io": "ImBox Sweden AB",
    "firmy.cz": "Seznam.cz, a.s.",
    "im.cz": "Seznam.cz, a.s.",
    "imedia.cz": "Seznam.cz, a.s.",
    "mapy.cz": "Seznam.cz, a.s.",
    "novinky.cz": "Seznam.cz, a.s.",
    "sbazar.cz": "Seznam.cz, a.s.",
    "seznam.cz": "Seznam.cz, a.s.",
    "sport.cz": "Seznam.cz, a.s.",
    "sreality.cz": "Seznam.cz, a.s.",
    "szn.cz": "Seznam.cz, a.s.",
    "imgix.net": "Zebrafish Labs",
    "attachmail.ru": "Mail.Ru Group, OOO",
    "gmru.net": "Mail.Ru Group, OOO",
    "imgsmail.ru": "Mail.Ru Group, OOO",
    "list.ru": "Mail.Ru Group, OOO",
    "lovina.app": "Mail.Ru Group, OOO",
    "mail.ru": "Mail.Ru Group, OOO",
    "mradx.net": "Mail.Ru Group, OOO",
    "my.com": "Mail.Ru Group, OOO",
    "mycdn.me": "Mail.Ru Group, OOO",
    "odnoklassniki.ru": "Mail.Ru Group, OOO",
    "ok.ru": "Mail.Ru Group, OOO",
    "payservice.io": "Mail.Ru Group, OOO",
    "userapi.com": "Mail.Ru Group, OOO",
    "vk-apps.com": "Mail.Ru Group, OOO",
    "vk-cdn.net": "Mail.Ru Group, OOO",
    "vk-portal.net": "Mail.Ru Group, OOO",
    "vk.cc": "Mail.Ru Group, OOO",
    "vk.com": "Mail.Ru Group, OOO",
    "vk.me": "Mail.Ru Group, OOO",
    "vkforms.ru": "Mail.Ru Group, OOO",
    "vkontakte.com": "Mail.Ru Group, OOO",
    "vkontakte.ru": "Mail.Ru Group, OOO",
    "vkpay.app": "Mail.Ru Group, OOO",
    "vkpay.io": "Mail.Ru Group, OOO",
    "vkuser.net": "Mail.Ru Group, OOO",
    "vkuseraudio.com": "Mail.Ru Group, OOO",
    "vkuseraudio.net": "Mail.Ru Group, OOO",
    "vkuserlive.com": "Mail.Ru Group, OOO",
    "vkuserlive.net": "Mail.Ru Group, OOO",
    "vkuservideo.com": "Mail.Ru Group, OOO",
    "vkuservideo.net": "Mail.Ru Group, OOO",
    "youla.ru": "Mail.Ru Group, OOO",
    "impact-ad.jp": "Digital Advertising Consortium Inc.",
    "6noy.net": "Impact",
    "7eer.net": "Impact",
    "8v4lqg.net": "Impact",
    "9zpg.net": "Impact",
    "cfzu.net": "Impact",
    "evyy.net": "Impact",
    "impact.com": "Impact",
    "impactradius-event.com": "Impact",
    "impactradius.com": "Impact",
    "ojrq.net": "Impact",
    "pxf.io": "Impact",
    "r7ls.net": "Impact",
    "ryvx.net": "Impact",
    "sjv.io": "Impact",
    "syuh.net": "Impact",
    "tnu8.net": "Impact",
    "vdvm.net": "Impact",
    "vocq.net": "Impact",
    "vzew.net": "Impact",
    "impressionmonster.com": "Network Gateway Solutions",
    "in-appadvertising.com": "Trion Interactive LLC",
    "increasingly.co": "Increasingly Technologies Limited",
    "increasingly.com": "Increasingly Technologies Limited",
    "indeed.ca": "Indeed, Inc.",
    "indeed.ch": "Indeed, Inc.",
    "indeed.co.in": "Indeed, Inc.",
    "indeed.co.uk": "Indeed, Inc.",
    "indeed.co.za": "Indeed, Inc.",
    "indeed.com": "Indeed, Inc.",
    "indeed.es": "Indeed, Inc.",
    "indeed.fr": "Indeed, Inc.",
    "indeed.jobs": "Indeed, Inc.",
    "indeed.nl": "Indeed, Inc.",
    "americanas.com.br": "EDITORA GLOBO S/A.",
    "assineglobo.com.br": "EDITORA GLOBO S/A.",
    "b2w.io": "EDITORA GLOBO S/A.",
    "infoglobo.com.br": "EDITORA GLOBO S/A.",
    "siteblindado.com": "EDITORA GLOBO S/A.",
    "submarino.com.br": "EDITORA GLOBO S/A.",
    "infolinks.com": "Infolink Media LLC",
    "infusionsoft.app": "Infusion Software",
    "infusionsoft.com": "Infusion Software",
    "inmobi.cn": "InMobi Pte Ltd",
    "inmobi.com": "InMobi Pte Ltd",
    "inmobicdn.net": "InMobi Pte Ltd",
    "inmoment.com": "InMoment, Inc.",
    "innity.net": "Innity Sdn Bhd",
    "innovid.com": "Innovid Media",
    "inq.com": "TouchCommerce, Inc",
    "inside-graph.com": "Michael Browitt",
    "inspectlet.com": "Inspectlet",
    "instana.io": "Instana, Inc.",
    "intentiq.com": "Intent IQ, LLC",
    "gamezone.com": "Intergi Entertainment",
    "intergi.com": "Intergi Entertainment",
    "intergient.com": "Intergi Entertainment",
    "playwire.com": "Intergi Entertainment",
    "investingchannel.com": "InvestingChannel, Inc.",
    "invoca.net": "Invoca",
    "invocacdn.com": "Invoca",
    "ringrevenue.com": "Invoca",
    "ioam.de": "INFOnline GmbH",
    "iocnt.net": "INFOnline GmbH",
    "iper2.com": "iPerceptions Inc.",
    "iperceptions.com": "iPerceptions Inc.",
    "adretail.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "adsearch.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "bryk.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "czateria.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "deccoria.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "ding.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "esporter.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "interia.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "iplsc.com": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "maxmodels.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "opracowania.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "pomponik.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "promocyjni.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "smaker.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "styl.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "swiatseriali.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "tipy.pl": "Grupa Interia.pl Sp. z o.o. sp. k.",
    "ipredictive.com": "Adelphic, Inc.",
    "ispot.tv": "iSpot.tv",
    "iteratehq.com": "Pickaxe LLC",
    "ivcbrasil.org.br": "IVC - INSTITUTO VERIFICADOR DE COMUNICAÇÃO",
    "ivitrack.com": "Ividence",
    "jivox.com": "Jivox Corp",
    "eslint.org": "OpenJS Foundation",
    "jquery.com": "OpenJS Foundation",
    "jquery.org": "OpenJS Foundation",
    "js.foundation": "OpenJS Foundation",
    "nodejs.org": "OpenJS Foundation",
    "openjsf.org": "OpenJS Foundation",
    "jsdelivr.com": "Prospect One",
    "jsdelivr.net": "Prospect One",
    "imguol.com.br": "Universo Online S.A.",
    "jsuol.com.br": "Universo Online S.A.",
    "uol.com.br": "Universo Online S.A.",
    "adxpansion.com": "JuicyAds",
    "juicyads.com": "JuicyAds",
    "justanswer.co.uk": "JustAnswer LLC",
    "justanswer.com": "JustAnswer LLC",
    "justanswer.de": "JustAnswer LLC",
    "justpremium.com": "JustPremium",
    "justpremium.nl": "JustPremium",
    "bitsontherun.com": "LongTail Ad Solutions, Inc.",
    "jwpcdn.com": "LongTail Ad Solutions, Inc.",
    "jwplatform.com": "LongTail Ad Solutions, Inc.",
    "jwplayer.com": "LongTail Ad Solutions, Inc.",
    "jwpltx.com": "LongTail Ad Solutions, Inc.",
    "jwpsrv.com": "LongTail Ad Solutions, Inc.",
    "longtailvideo.com": "LongTail Ad Solutions, Inc.",
    "kaltura.com": "Kaltura Inc",
    "kameleoon.com": "Kameleoon",
    "kameleoon.eu": "Kameleoon",
    "kameleoon.net": "Kameleoon",
    "kampyle.com": "Medallia Inc.",
    "medallia.com": "Medallia Inc.",
    "medallia.eu": "Medallia Inc.",
    "sense360.com": "Medallia Inc.",
    "sense360eng.com": "Medallia Inc.",
    "kargo.com": "Kargo Global, Inc.",
    "k-rauta.fi": "Kesko Oyj",
    "k-ruoka.fi": "Kesko Oyj",
    "k-tunnus.fi": "Kesko Oyj",
    "kesko.fi": "Kesko Oyj",
    "keywee.co": "Keywee",
    "kissmetrics.com": "Space Pencil, Inc.",
    "billpay.at": "Klarna Bank AB",
    "billpay.ch": "Klarna Bank AB",
    "billpay.de": "Klarna Bank AB",
    "billpay.nl": "Klarna Bank AB",
    "klarna.app": "Klarna Bank AB",
    "klarna.at": "Klarna Bank AB",
    "klarna.be": "Klarna Bank AB",
    "klarna.ch": "Klarna Bank AB",
    "klarna.co.nz": "Klarna Bank AB",
    "klarna.co.uk": "Klarna Bank AB",
    "klarna.com": "Klarna Bank AB",
    "klarna.com.au": "Klarna Bank AB",
    "klarna.de": "Klarna Bank AB",
    "klarna.dk": "Klarna Bank AB",
    "klarna.nz": "Klarna Bank AB",
    "klarnacdn.net": "Klarna Bank AB",
    "klarnaevt.com": "Klarna Bank AB",
    "klarnapayments.com": "Klarna Bank AB",
    "klarnaservices.com": "Klarna Bank AB",
    "sofort.com": "Klarna Bank AB",
    "klaviyo.com": "Klaviyo",
    "klevu.com": "Klevu Oy",
    "ab-solute.com": "Kochava",
    "akisinn.info": "Kochava",
    "akisinn.me": "Kochava",
    "appstoremetrics.com": "Kochava",
    "appstoremetrics.mobi": "Kochava",
    "appstoremetrics.net": "Kochava",
    "appstoremetrics.org": "Kochava",
    "ctvanalytics.com": "Kochava",
    "dewrain.life": "Kochava",
    "dewrain.site": "Kochava",
    "dewrain.world": "Kochava",
    "digicenter.com": "Kochava",
    "freeappsanalytics.com": "Kochava",
    "freectvanalytics.com": "Kochava",
    "freegameanalytics.net": "Kochava",
    "freegameanalytics.org": "Kochava",
    "kochava.com": "Kochava",
    "kochava.net": "Kochava",
    "kochava.org": "Kochava",
    "kochavacollective.com": "Kochava",
    "kochavadifference.com": "Kochava",
    "kochavamobilesummit.com": "Kochava",
    "kochavasupport.com": "Kochava",
    "labelmetrics.com": "Kochava",
    "mazzaroth.io": "Kochava",
    "mobilerq.com": "Kochava",
    "pushclix.net": "Kochava",
    "pushclix.org": "Kochava",
    "searchadsmaven.com": "Kochava",
    "smart.link": "Kochava",
    "tvplusmobile.com": "Kochava",
    "vaicore.site": "Kochava",
    "vaicore.store": "Kochava",
    "vaicore.xyz": "Kochava",
    "vlancaa.fun": "Kochava",
    "vlancaa.site": "Kochava",
    "xchng.io": "Kochava",
    "kustomer.com": "Kustomer, Inc.",
    "kustomerapp.com": "Kustomer, Inc.",
    "keycdn.com": "proinity GmbH",
    "kxcdn.com": "proinity GmbH",
    "ladesk.com": "Quality Unit LLC",
    "landbot.io": "HELLO UMI S.L.",
    "leadplace.fr": "LEADPLACE",
    "leadsrx.com": "Sargents, Inc.",
    "comparecards.com": "LENDINGTREE, LLC",
    "lendingtree.com": "LENDINGTREE, LLC",
    "tree.com": "LENDINGTREE, LLC",
    "liadm.com": "LiveIntent Inc.",
    "liveintent.com": "LiveIntent Inc.",
    "digioh.com": "Digioh, LLC",
    "lightboxcdn.com": "Digioh, LLC",
    "lijit.com": "Sovrn Holdings",
    "s-onetag.com": "Sovrn Holdings",
    "sovrn.com": "Sovrn Holdings",
    "sovrnlabs.net": "Sovrn Holdings",
    "viglink.com": "Sovrn Holdings",
    "b612.net": "Naver Corporation",
    "b612kaji.com": "Naver Corporation",
    "blogimg.jp": "Naver Corporation",
    "blogos.com": "Naver Corporation",
    "blogsys.jp": "Naver Corporation",
    "fivecdm.com": "Naver Corporation",
    "jlisting.jp": "Naver Corporation",
    "kajicam.cn": "Naver Corporation",
    "kajicam.com": "Naver Corporation",
    "line-apps-beta.com": "Naver Corporation",
    "line-apps.com": "Naver Corporation",
    "line-cdn.net": "Naver Corporation",
    "line-scdn.net": "Naver Corporation",
    "line.biz": "Naver Corporation",
    "line.me": "Naver Corporation",
    "lineblog.me": "Naver Corporation",
    "linecorp.com": "Naver Corporation",
    "livedoor.com": "Naver Corporation",
    "livedoor.jp": "Naver Corporation",
    "livedoor.net": "Naver Corporation",
    "naver.com": "Naver Corporation",
    "naver.jp": "Naver Corporation",
    "naver.net": "Naver Corporation",
    "pstatic.net": "Naver Corporation",
    "snow.me": "Naver Corporation",
    "snowcam.cn": "Naver Corporation",
    "snowcorp.com": "Naver Corporation",
    "unthem.com": "Naver Corporation",
    "wattpad.com": "Naver Corporation",
    "webtoons.com": "Naver Corporation",
    "yiruikecorp.com": "Naver Corporation",
    "linkconnector.com": "LinkConnector Corporation",
    "dc-storm.com": "Rakuten, Inc.",
    "fril.jp": "Rakuten, Inc.",
    "infoseek.co.jp": "Rakuten, Inc.",
    "jrs5.com": "Rakuten, Inc.",
    "kobo.com": "Rakuten, Inc.",
    "linksynergy.com": "Rakuten, Inc.",
    "mediaforge.com": "Rakuten, Inc.",
    "nxtck.com": "Rakuten, Inc.",
    "r10s.com": "Rakuten, Inc.",
    "r10s.jp": "Rakuten, Inc.",
    "rakuten-card.co.jp": "Rakuten, Inc.",
    "rakuten-static.com": "Rakuten, Inc.",
    "rakuten.co.jp": "Rakuten, Inc.",
    "rakuten.com": "Rakuten, Inc.",
    "rakuten.fr": "Rakuten, Inc.",
    "rakuten.ne.jp": "Rakuten, Inc.",
    "rakutenmarketing.com": "Rakuten, Inc.",
    "rmtag.com": "Rakuten, Inc.",
    "rpaas.net": "Rakuten, Inc.",
    "vb.me": "Rakuten, Inc.",
    "viber.com": "Rakuten, Inc.",
    "vshare.chat": "Rakuten, Inc.",
    "listrak.com": "Listrak",
    "listrakbi.com": "Listrak",
    "lcloud.com": "Lithium Technologies",
    "lithium.com": "Lithium Technologies",
    "litix.io": "Mux, Inc.",
    "mux.com": "Mux, Inc.",
    "mux.io": "Mux, Inc.",
    "pantheonsite.io": "Pantheon Systems, Inc.",
    "botengine.ai": "LiveChat Inc",
    "chat.io": "LiveChat Inc",
    "chatbot.com": "LiveChat Inc",
    "helpdesk.com": "LiveChat Inc",
    "knowledgebase.ai": "LiveChat Inc",
    "livechatinc.com": "LiveChat Inc",
    "livechatinc.net": "LiveChat Inc",
    "livecom.net": "Portalis BV",
    "livehelpnow.net": "LiveHelpNow, Inc",
    "liveperson.com": "LivePerson, Inc",
    "liveperson.net": "LivePerson, Inc",
    "lpsnmedia.net": "LivePerson, Inc",
    "abc27.com": "Nexstar Media Group",
    "cbs17.com": "Nexstar Media Group",
    "channel4000.com": "Nexstar Media Group",
    "fmpub.net": "Nexstar Media Group",
    "foodbuzz.com": "Nexstar Media Group",
    "fox16.com": "Nexstar Media Group",
    "kark.com": "Nexstar Media Group",
    "keloland.com": "Nexstar Media Group",
    "khon2.com": "Nexstar Media Group",
    "klfy.com": "Nexstar Media Group",
    "koin.com": "Nexstar Media Group",
    "kron4.com": "Nexstar Media Group",
    "krqe.com": "Nexstar Media Group",
    "ksn.com": "Nexstar Media Group",
    "kxan.com": "Nexstar Media Group",
    "lakana.com": "Nexstar Media Group",
    "lasvegasnow.com": "Nexstar Media Group",
    "lkqd.net": "Nexstar Media Group",
    "localsyr.com": "Nexstar Media Group",
    "nexstar.tv": "Nexstar Media Group",
    "nwahomepage.com": "Nexstar Media Group",
    "rochesterfirst.com": "Nexstar Media Group",
    "wane.com": "Nexstar Media Group",
    "wate.com": "Nexstar Media Group",
    "wavy.com": "Nexstar Media Group",
    "wdtn.com": "Nexstar Media Group",
    "wfla.com": "Nexstar Media Group",
    "wivb.com": "Nexstar Media Group",
    "wkbn.com": "Nexstar Media Group",
    "wkrg.com": "Nexstar Media Group",
    "wkrn.com": "Nexstar Media Group",
    "wlns.com": "Nexstar Media Group",
    "woodtv.com": "Nexstar Media Group",
    "wpri.com": "Nexstar Media Group",
    "wric.com": "Nexstar Media Group",
    "wsav.com": "Nexstar Media Group",
    "wspa.com": "Nexstar Media Group",
    "wtnh.com": "Nexstar Media Group",
    "wwlp.com": "Nexstar Media Group",
    "yashi.com": "Nexstar Media Group",
    "atkingdom-network.com": "Limelight Networks, Inc.",
    "delvenetworks.com": "Limelight Networks, Inc.",
    "limelight.com": "Limelight Networks, Inc.",
    "lldns.net": "Limelight Networks, Inc.",
    "llnw.com": "Limelight Networks, Inc.",
    "llnw.net": "Limelight Networks, Inc.",
    "llnwd.net": "Limelight Networks, Inc.",
    "llnwi.net": "Limelight Networks, Inc.",
    "mcstatic.com": "Limelight Networks, Inc.",
    "opus-static.com": "Limelight Networks, Inc.",
    "xosnetwork.com": "Limelight Networks, Inc.",
    "clickability.com": "Upland Software Inc.",
    "formalyzer.com": "Upland Software Inc.",
    "leadlander.com": "Upland Software Inc.",
    "localytics.com": "Upland Software Inc.",
    "sf14g.com": "Upland Software Inc.",
    "trackalyzer.com": "Upland Software Inc.",
    "lockerdome.com": "LockerDome, LLC",
    "lockerdomecdn.com": "LockerDome, LLC",
    "dnsstuff.com": "SolarWinds Worldwide, LLC",
    "loggly.com": "SolarWinds Worldwide, LLC",
    "solarwinds.com": "SolarWinds Worldwide, LLC",
    "swcdn.net": "SolarWinds Worldwide, LLC",
    "loop11.com": "Loop11",
    "loopa.com.au": "Signifi Media Pty Ltd",
    "loopa.net.au": "Signifi Media Pty Ltd",
    "signifimedia.com.au": "Signifi Media Pty Ltd",
    "loopme.com": "LoopMe Ltd",
    "loopme.me": "LoopMe Ltd",
    "luckyorange.com": "Lucky Orange LLC",
    "luckyorange.net": "Lucky Orange LLC",
    "lytics.io": "Lytics",
    "m2.ai": "eSell Solutions Ltd. DBA MonetizeMore",
    "magnetmail.net": "Higher Logic",
    "realmagnet.land": "Higher Logic",
    "bigin.com": "ZOHO Corporation",
    "charmalotconference.com": "ZOHO Corporation",
    "classesapp.com": "ZOHO Corporation",
    "cliqtrix.com": "ZOHO Corporation",
    "delugelang.com": "ZOHO Corporation",
    "docscanner.app": "ZOHO Corporation",
    "gozohosocial.com": "ZOHO Corporation",
    "healthpassportonline.com": "ZOHO Corporation",
    "log360cloud.com": "ZOHO Corporation",
    "mailer-zaccounts.com": "ZOHO Corporation",
    "maillist-manage.com": "ZOHO Corporation",
    "maillist-manage.eu": "ZOHO Corporation",
    "manageengine.com": "ZOHO Corporation",
    "mnge.it": "ZOHO Corporation",
    "mobilisten.io": "ZOHO Corporation",
    "notebook.app": "ZOHO Corporation",
    "orchestly.com": "ZOHO Corporation",
    "pagesense.io": "ZOHO Corporation",
    "painpointpitch.com": "ZOHO Corporation",
    "postipo-nonprofit.com": "ZOHO Corporation",
    "postipo-nonprofits.com": "ZOHO Corporation",
    "postipononprofit.com": "ZOHO Corporation",
    "postipononprofits.com": "ZOHO Corporation",
    "salesinbox.com": "ZOHO Corporation",
    "sdpondemand.com": "ZOHO Corporation",
    "sdpondemand.eu": "ZOHO Corporation",
    "site24x7.com": "ZOHO Corporation",
    "site24x7.eu": "ZOHO Corporation",
    "site24x7rum.com": "ZOHO Corporation",
    "site24x7rum.eu": "ZOHO Corporation",
    "site24x7static.com": "ZOHO Corporation",
    "socialjournal.biz": "ZOHO Corporation",
    "sprintsapp.com": "ZOHO Corporation",
    "thezoho.com": "ZOHO Corporation",
    "transmail.com": "ZOHO Corporation",
    "transmail.net": "ZOHO Corporation",
    "transmail.network": "ZOHO Corporation",
    "zconfirmation.com": "ZOHO Corporation",
    "zcrmemailverifier.com": "ZOHO Corporation",
    "zcsend.net": "ZOHO Corporation",
    "ziasearch.com": "ZOHO Corporation",
    "zinvitation.com": "ZOHO Corporation",
    "zoho-inventory.com": "ZOHO Corporation",
    "zoho.ae": "ZOHO Corporation",
    "zoho.com": "ZOHO Corporation",
    "zoho.com.mx": "ZOHO Corporation",
    "zoho.community": "ZOHO Corporation",
    "zoho.eu": "ZOHO Corporation",
    "zoho.in": "ZOHO Corporation",
    "zoho.lat": "ZOHO Corporation",
    "zoho.mx": "ZOHO Corporation",
    "zoho.net": "ZOHO Corporation",
    "zoho.uno": "ZOHO Corporation",
    "zoho1.com": "ZOHO Corporation",
    "zohoaccounts.com": "ZOHO Corporation",
    "zohoanalytics.com": "ZOHO Corporation",
    "zohoappcreator.com": "ZOHO Corporation",
    "zohoassist.com": "ZOHO Corporation",
    "zohobi.com": "ZOHO Corporation",
    "zohobook.com": "ZOHO Corporation",
    "zohobooks.ae": "ZOHO Corporation",
    "zohobooks.com": "ZOHO Corporation",
    "zohocampaigns.com": "ZOHO Corporation",
    "zohocdn.com": "ZOHO Corporation",
    "zohochallenge.com": "ZOHO Corporation",
    "zohocheckout.com": "ZOHO Corporation",
    "zohocliq.com": "ZOHO Corporation",
    "zohocommerce.com": "ZOHO Corporation",
    "zohocompany.com": "ZOHO Corporation",
    "zohoconnect.com": "ZOHO Corporation",
    "zohocreator.com": "ZOHO Corporation",
    "zohocreatorplus.com": "ZOHO Corporation",
    "zohocreatorportal.com": "ZOHO Corporation",
    "zohocrm.com": "ZOHO Corporation",
    "zohodesk.com": "ZOHO Corporation",
    "zohodiscussions.com": "ZOHO Corporation",
    "zohodns.com": "ZOHO Corporation",
    "zohodocs.com": "ZOHO Corporation",
    "zohodomains.com": "ZOHO Corporation",
    "zohoexpense.com": "ZOHO Corporation",
    "zohoexpenses.com": "ZOHO Corporation",
    "zohoforms.com": "ZOHO Corporation",
    "zohogadgets.com": "ZOHO Corporation",
    "zohogst.com": "ZOHO Corporation",
    "zohohelp.com": "ZOHO Corporation",
    "zohohost.com": "ZOHO Corporation",
    "zohohost.eu": "ZOHO Corporation",
    "zohoinsights.com": "ZOHO Corporation",
    "zohoinventory.com": "ZOHO Corporation",
    "zohoinventorymanagement.com": "ZOHO Corporation",
    "zohoinvoice.com": "ZOHO Corporation",
    "zohoiq.com": "ZOHO Corporation",
    "zoholivedesk.com": "ZOHO Corporation",
    "zohom.com": "ZOHO Corporation",
    "zohomail.com": "ZOHO Corporation",
    "zohomarketplace.com": "ZOHO Corporation",
    "zohomeeting.com": "ZOHO Corporation",
    "zohomeetups.com": "ZOHO Corporation",
    "zohomexico.com": "ZOHO Corporation",
    "zohonote.com": "ZOHO Corporation",
    "zohonotes.com": "ZOHO Corporation",
    "zohoorchestly.com": "ZOHO Corporation",
    "zohoordermanagement.com": "ZOHO Corporation",
    "zohoplatform.com": "ZOHO Corporation",
    "zohoplatform.eu": "ZOHO Corporation",
    "zohoportal.com": "ZOHO Corporation",
    "zohoportal.eu": "ZOHO Corporation",
    "zohopreneur.com": "ZOHO Corporation",
    "zohopreneur.in": "ZOHO Corporation",
    "zohopresenter.com": "ZOHO Corporation",
    "zohoprojects.com": "ZOHO Corporation",
    "zohopublic.com": "ZOHO Corporation",
    "zohopublic.eu": "ZOHO Corporation",
    "zohorecruit.com": "ZOHO Corporation",
    "zohoremotely.com": "ZOHO Corporation",
    "zohoreports.com": "ZOHO Corporation",
    "zohoreports.eu": "ZOHO Corporation",
    "zohosalesiq.com": "ZOHO Corporation",
    "zohosheet.com": "ZOHO Corporation",
    "zohoshow.com": "ZOHO Corporation",
    "zohosign.com": "ZOHO Corporation",
    "zohosites.com": "ZOHO Corporation",
    "zohosocial.com": "ZOHO Corporation",
    "zohosprints.com": "ZOHO Corporation",
    "zohostatic.com": "ZOHO Corporation",
    "zohostatic.eu": "ZOHO Corporation",
    "zohostore.com": "ZOHO Corporation",
    "zohosubscription.com": "ZOHO Corporation",
    "zohosubscriptions.com": "ZOHO Corporation",
    "zohosubscriptions.in": "ZOHO Corporation",
    "zohosupport.com": "ZOHO Corporation",
    "zohosurvey.com": "ZOHO Corporation",
    "zohouno.com": "ZOHO Corporation",
    "zohovault.com": "ZOHO Corporation",
    "zohowebstatic.com": "ZOHO Corporation",
    "zohoworkerly.com": "ZOHO Corporation",
    "zohoworkplace.com": "ZOHO Corporation",
    "zohoworkplace.email": "ZOHO Corporation",
    "zohowriter.com": "ZOHO Corporation",
    "mapbox.com": "Mapbox Inc.",
    "calls.net": "Marchex, Inc.",
    "industrybrains.com": "Marchex, Inc.",
    "marchex.io": "Marchex, Inc.",
    "marinsm.com": "Sharpspring Inc",
    "marketingautomation.services": "Sharpspring Inc",
    "mysocialpixel.com": "Sharpspring Inc",
    "perfectaudience.com": "Sharpspring Inc",
    "prfct.co": "Sharpspring Inc",
    "sharpspring.com": "Sharpspring Inc",
    "massrel.io": "Spredfast, Inc",
    "cbtrk.net": "Webtrekk GmbH",
    "mateti.net": "Webtrekk GmbH",
    "wbtrk.net": "Webtrekk GmbH",
    "wcfbc.net": "Webtrekk GmbH",
    "webtrekk.com": "Webtrekk GmbH",
    "webtrekk.net": "Webtrekk GmbH",
    "wt-eu02.net": "Webtrekk GmbH",
    "wt-safetag.com": "Webtrekk GmbH",
    "matheranalytics.com": "Mather Economics",
    "mathtag.com": "MediaMath, Inc.",
    "maxmind.com": "MaxMind Inc.",
    "media.net": "Media.net Advertising FZ-LLC",
    "dstillery.com": "Dstillery Inc.",
    "media6degrees.com": "Dstillery Inc.",
    "dreamsearch.or.kr": "Enliple INC",
    "mediacategory.com": "Enliple INC",
    "mediacorp.sg": "MEDIACORP PTE. LTD.",
    "mediarithmics.com": "mediarithmics SAS",
    "laplacemedia.com": "La Place Media",
    "mediasquare.fr": "La Place Media",
    "mediavine.com": "Mediavine, Inc.",
    "moviefanatic.com": "Mediavine, Inc.",
    "thehollywoodgossip.com": "Mediavine, Inc.",
    "tvfanatic.com": "Mediavine, Inc.",
    "mediawallahscript.com": "MediaWallah LLC",
    "medium.com": "A Medium Corporation",
    "medium.systems": "A Medium Corporation",
    "mention-me.com": "Mention Me Ltd",
    "merklesearch.com": "Merkle Inc",
    "rkdms.com": "Merkle Inc",
    "metaffiliation.com": "c2b s.a.",
    "metricode.com": "Ellipsis Technologies, Inc.",
    "mgid.com": "MGID Inc",
    "micpn.com": "Movable Ink",
    "movableink.com": "Movable Ink",
    "compass-fit.jp": "MicroAd, Inc.",
    "microad.jp": "MicroAd, Inc.",
    "microad.net": "MicroAd, Inc.",
    "microadinc.com": "MicroAd, Inc.",
    "mindbox.ru": "Mindbox Ltd.",
    "minute.ly": "Minute Spoteam Ltd.",
    "snackly.co": "Minute Spoteam Ltd.",
    "12up.com": "Pro Sportority (Israel) Ltd",
    "90min.com": "Pro Sportority (Israel) Ltd",
    "minutemedia.com": "Pro Sportority (Israel) Ltd",
    "minutemediacdn.com": "Pro Sportority (Israel) Ltd",
    "minutemediaservices.com": "Pro Sportority (Israel) Ltd",
    "mm-syringe.com": "Pro Sportority (Israel) Ltd",
    "oo-syringe.com": "Pro Sportority (Israel) Ltd",
    "mixpo.com": "Mixpo Inc.",
    "bombora.com": "Bombora Inc.",
    "ml314.com": "Bombora Inc.",
    "mercadoclics.com": "MercadoLibre Inc.",
    "mercadolibre.com": "MercadoLibre Inc.",
    "mercadolibre.com.ar": "MercadoLibre Inc.",
    "mercadolibre.com.co": "MercadoLibre Inc.",
    "mercadolibre.com.mx": "MercadoLibre Inc.",
    "mercadolivre.com": "MercadoLibre Inc.",
    "mercadolivre.com.br": "MercadoLibre Inc.",
    "mercadopago.com": "MercadoLibre Inc.",
    "mercadopago.com.co": "MercadoLibre Inc.",
    "mercadopago.com.mx": "MercadoLibre Inc.",
    "mlapps.com": "MercadoLibre Inc.",
    "mlstatic.com": "MercadoLibre Inc.",
    "tucarro.com.co": "MercadoLibre Inc.",
    "tumoto.com.co": "MercadoLibre Inc.",
    "mncdn.com": "Medianova Internet Hizmetleri A.S.",
    "moengage.com": "MoEngage, Inc.",
    "monetate.net": "Monetate, Inc.",
    "monsido.com": "Monsido Inc.",
    "monu.delivery": "Monumetric (The Blogger Network, LLC)",
    "mookie1.cn": "Xaxis",
    "mookie1.com": "Xaxis",
    "mouseflow.com": "Mouseflow",
    "acceleration2019.com": "mParticle, Inc",
    "growthpractice.com": "mParticle, Inc",
    "mparticle.com": "mParticle, Inc",
    "opengdpr.org": "mParticle, Inc",
    "mql5.com": "MQL5 Ltd.",
    "mrpfd.com": "MARKET RESOURCE PARTNERS LIMITED",
    "mts.ru": "Mobile TeleSystems Public Joint Stock Company",
    "mixpanel.com": "Mixpanel, Inc.",
    "mxpnl.com": "Mixpanel, Inc.",
    "mxpnl.net": "Mixpanel, Inc.",
    "brand.net": "Valassis Digital",
    "mxptint.net": "Valassis Digital",
    "valassis.com": "Valassis Digital",
    "valassis.eu": "Valassis Digital",
    "valassisdigital.com": "Valassis Digital",
    "mybestpro.com": "WENGO SAS",
    "rdvmedicaux.com": "WENGO SAS",
    "wengo.com": "WENGO SAS",
    "wgcdn.net": "WENGO SAS",
    "myfidevs.io": "MyFinance, Inc.",
    "myfinance.com": "MyFinance, Inc.",
    "myfonts.com": "MyFonts Inc.",
    "myfonts.net": "MyFonts Inc.",
    "nakanohito.jp": "User Local,Inc.",
    "narrative.io": "Narrative I/O, Inc.",
    "gp.org": "3DNA Corp",
    "nationbuilder.com": "3DNA Corp",
    "theleaguesf.org": "3DNA Corp",
    "nativeroll.tv": "Native Media Limited Liability Company",
    "navdmp.com": "Navegg S.A.",
    "nestimg.com": "Lokku Ltd.",
    "netcore.co.in": "Netcore Solutions Pvt Ltd",
    "netcoresmartech.com": "Netcore Solutions Pvt Ltd",
    "apxprogrammatic.com": "IgnitionOne, LLC",
    "ignitionone.com": "IgnitionOne, LLC",
    "netmng.com": "IgnitionOne, LLC",
    "futurestack.com": "New Relic",
    "newrelic.co.jp": "New Relic",
    "newrelic.com": "New Relic",
    "newrelic.de": "New Relic",
    "newrelic.fr": "New Relic",
    "newrelic.jp": "New Relic",
    "newrelic.org": "New Relic",
    "newrelic.us": "New Relic",
    "nr-assets.net": "New Relic",
    "nr-data.net": "New Relic",
    "nr-ext.net": "New Relic",
    "nr-local.net": "New Relic",
    "nr-ops.net": "New Relic",
    "nr-tools.net": "New Relic",
    "opsmatic.com": "New Relic",
    "opsmatic.net": "New Relic",
    "kidspot.com.au": "News Digital Media Pty Limited",
    "news.com.au": "News Digital Media Pty Limited",
    "newscgp.com": "News Limited",
    "newscorpaustralia.com": "News Limited",
    "archives.com": "iArchives Inc.",
    "fold3.com": "iArchives Inc.",
    "newspapers.com": "iArchives Inc.",
    "ecomm-nav.com": "Nextopia Software Corporation",
    "nextopia.net": "Nextopia Software Corporation",
    "nextopiasoftware.com": "Nextopia Software Corporation",
    "ngenix.net": "Limited Liability Company NGENIX",
    "9cdn.net": "Nine Entertainment Co.",
    "9nation.com.au": "Nine Entertainment Co.",
    "9news.com.au": "Nine Entertainment Co.",
    "9now.com.au": "Nine Entertainment Co.",
    "9pickle.com.au": "Nine Entertainment Co.",
    "alluremedia.com.au": "Nine Entertainment Co.",
    "businessinsider.com.au": "Nine Entertainment Co.",
    "ch9.com.au": "Nine Entertainment Co.",
    "challenger-retirement.com.au": "Nine Entertainment Co.",
    "channel9.com.au": "Nine Entertainment Co.",
    "freeviewplus.net.au": "Nine Entertainment Co.",
    "gizmodo.com.au": "Nine Entertainment Co.",
    "kotaku.com.au": "Nine Entertainment Co.",
    "lifehacker.com.au": "Nine Entertainment Co.",
    "mi9.com.au": "Nine Entertainment Co.",
    "mi9cdn.com": "Nine Entertainment Co.",
    "nine.com.au": "Nine Entertainment Co.",
    "nineaccess.com.au": "Nine Entertainment Co.",
    "nineentertainmentco.com.au": "Nine Entertainment Co.",
    "nineforbrands.com.au": "Nine Entertainment Co.",
    "ninemediaroom.com.au": "Nine Entertainment Co.",
    "ninemsn.com.au": "Nine Entertainment Co.",
    "pedestrian.tv": "Nine Entertainment Co.",
    "pedestriangroup.com.au": "Nine Entertainment Co.",
    "popsugar.com.au": "Nine Entertainment Co.",
    "static9.net.au": "Nine Entertainment Co.",
    "yourmovies.com.au": "Nine Entertainment Co.",
    "yourtv.com.au": "Nine Entertainment Co.",
    "nosto.com": "Nosto Solutions Ltd",
    "nowinteract.com": "Now Interact Nordic AB",
    "n.rich": "N.Rich Technologies",
    "nrich.ai": "N.Rich Technologies",
    "adkontekst.pl": "nazwa.pl sp. z o.o.",
    "clickonometrics.pl": "nazwa.pl sp. z o.o.",
    "contentstream.pl": "nazwa.pl sp. z o.o.",
    "directtraffic.pl": "nazwa.pl sp. z o.o.",
    "fooder.pl": "nazwa.pl sp. z o.o.",
    "netsprint.pl": "nazwa.pl sp. z o.o.",
    "nextclick.pl": "nazwa.pl sp. z o.o.",
    "nsaudience.pl": "nazwa.pl sp. z o.o.",
    "nscontext.eu": "nazwa.pl sp. z o.o.",
    "pushit.pl": "nazwa.pl sp. z o.o.",
    "shmbk.pl": "nazwa.pl sp. z o.o.",
    "stream1.pl": "nazwa.pl sp. z o.o.",
    "twohandslab.com": "nazwa.pl sp. z o.o.",
    "nativo.net": "Nativo, Inc",
    "ntv.io": "Nativo, Inc",
    "postrelease.com": "Nativo, Inc",
    "adspyglass.com": "AdSpyglass",
    "o333o.com": "AdSpyglass",
    "oct8ne.com": "See the Same S.L",
    "okta-emea.com": "Okta, Inc.",
    "okta.com": "Okta, Inc.",
    "oktacdn.com": "Okta, Inc.",
    "stormpath.com": "Okta, Inc.",
    "olark.com": "Olark",
    "monstercampaigns.com": "Retyp LLC",
    "omappapi.com": "Retyp LLC",
    "omwpapi.com": "Retyp LLC",
    "opmnstr.com": "Retyp LLC",
    "optinforms.com": "Retyp LLC",
    "optinmonster.com": "Retyp LLC",
    "optmnstr.com": "Retyp LLC",
    "optmstr.com": "Retyp LLC",
    "optnmnstr.com": "Retyp LLC",
    "optnmstr.com": "Retyp LLC",
    "omeda.com": "Omeda Communications",
    "omnisrc.com": "Soundest Limited",
    "adyoulike.com": "Adyoulike",
    "omnitagjs.com": "Adyoulike",
    "ondemand.com": "SAP SE",
    "services.sap": "SAP SE",
    "sybase.com": "SAP SE",
    "oneall.com": "ONEALL SARL",
    "oneallcdn.com": "ONEALL SARL",
    "onecount.net": "GCN Publishing, Inc.",
    "onesignal.com": "OneSignal",
    "os.tc": "OneSignal",
    "onetag-cdn.com": "OneTag Limited",
    "onetag-sys.com": "OneTag Limited",
    "onetag.com": "OneTag Limited",
    "onetag.net": "OneTag Limited",
    "cell.com": "RELX Group",
    "elsevier.com": "RELX Group",
    "elsevier.io": "RELX Group",
    "elsevierhealth.com": "RELX Group",
    "em-consulte.com": "RELX Group",
    "evise.com": "RELX Group",
    "lexisnexis.com": "RELX Group",
    "mendeley.com": "RELX Group",
    "online-metrix.net": "RELX Group",
    "sciencedirect.com": "RELX Group",
    "sciencedirectassets.com": "RELX Group",
    "scopus.com": "RELX Group",
    "ssrn.com": "RELX Group",
    "thelancet.com": "RELX Group",
    "threatmetrix.com": "RELX Group",
    "vitalchek.com": "RELX Group",
    "onmarc.nl": "Arcade ICT B.V.",
    "onthe.io": "IO Technologies Inc.",
    "open-system.fr": "ALLIANCE RESEAUX",
    "opentext.com": "Open Text Corporation",
    "optimost.com": "Open Text Corporation",
    "deliverimp.com": "OpenX Technologies Inc",
    "godengo.com": "OpenX Technologies Inc",
    "jump-time.net": "OpenX Technologies Inc",
    "mezzobit.com": "OpenX Technologies Inc",
    "openx.com": "OpenX Technologies Inc",
    "openx.net": "OpenX Technologies Inc",
    "openx.org": "OpenX Technologies Inc",
    "openxadexchange.com": "OpenX Technologies Inc",
    "pixfuture.net": "OpenX Technologies Inc",
    "pubnation.com": "OpenX Technologies Inc",
    "servedbyopenx.com": "OpenX Technologies Inc",
    "opera.com": "Opera Software AS",
    "operacdn.com": "Opera Software AS",
    "goal.com": "Perform Media Services Ltd",
    "mackolik.com": "Perform Media Services Ltd",
    "matchendirect.fr": "Perform Media Services Ltd",
    "opta.net": "Perform Media Services Ltd",
    "optasports.com": "Perform Media Services Ltd",
    "performfeeds.com": "Perform Media Services Ltd",
    "performgroup.com": "Perform Media Services Ltd",
    "premiumtv.co.uk": "Perform Media Services Ltd",
    "snimg.com": "Perform Media Services Ltd",
    "soccerway.com": "Perform Media Services Ltd",
    "sportingnews.com": "Perform Media Services Ltd",
    "spox.com": "Perform Media Services Ltd",
    "swimg.net": "Perform Media Services Ltd",
    "optad360.io": "Publishers Revenue Optimization Sp. z o.o.",
    "optimicdn.com": "OptimiWay Ltd",
    "optimizely.com": "Optimizely, Inc.",
    "optimonk.com": "WebShop Marketing Kft.",
    "orcinus.ai": "WebShop Marketing Kft.",
    "webshopexperts.com": "WebShop Marketing Kft.",
    "content-recommendation.net": "Outbrain",
    "ligadx.com": "Outbrain",
    "ligatus.com": "Outbrain",
    "outbrain.com": "Outbrain",
    "veeseo.com": "Outbrain",
    "zemanta.com": "Outbrain",
    "inmar.com": "Inmar, Inc.",
    "manualsonline.com": "Inmar, Inc.",
    "owneriq.com": "Inmar, Inc.",
    "owneriq.net": "Inmar, Inc.",
    "ownlocal.com": "OwnLocal.com",
    "p-n.io": "Pushly",
    "paddle.com": "Paddle.com Market Ltd",
    "parastorage.com": "Wix.com, Inc.",
    "wix.com": "Wix.com, Inc.",
    "wixstatic.com": "Wix.com, Inc.",
    "parrable.com": "Parrable, Inc.",
    "parse.ly": "Parsely, Inc.",
    "parsely.com": "Parsely, Inc.",
    "memberful.com": "Patreon, Inc.",
    "patreon.com": "Patreon, Inc.",
    "patreonusercontent.com": "Patreon, Inc.",
    "braintree-api.com": "PayPal, Inc.",
    "braintreegateway.com": "PayPal, Inc.",
    "jetlore.com": "PayPal, Inc.",
    "paypal-apps.com": "PayPal, Inc.",
    "paypal-brasil.com.br": "PayPal, Inc.",
    "paypal-community.com": "PayPal, Inc.",
    "paypal-deutschland.de": "PayPal, Inc.",
    "paypal-forward.com": "PayPal, Inc.",
    "paypal-france.fr": "PayPal, Inc.",
    "paypal-information.com": "PayPal, Inc.",
    "paypal-knowledge-test.com": "PayPal, Inc.",
    "paypal-knowledge.com": "PayPal, Inc.",
    "paypal-latam.com": "PayPal, Inc.",
    "paypal-marketing.pl": "PayPal, Inc.",
    "paypal-mena.com": "PayPal, Inc.",
    "paypal-nakit.com": "PayPal, Inc.",
    "paypal-prepagata.com": "PayPal, Inc.",
    "paypal-prepaid.com": "PayPal, Inc.",
    "paypal.at": "PayPal, Inc.",
    "paypal.be": "PayPal, Inc.",
    "paypal.ca": "PayPal, Inc.",
    "paypal.ch": "PayPal, Inc.",
    "paypal.cl": "PayPal, Inc.",
    "paypal.cn": "PayPal, Inc.",
    "paypal.co": "PayPal, Inc.",
    "paypal.co.id": "PayPal, Inc.",
    "paypal.co.il": "PayPal, Inc.",
    "paypal.co.in": "PayPal, Inc.",
    "paypal.co.kr": "PayPal, Inc.",
    "paypal.co.nz": "PayPal, Inc.",
    "paypal.co.th": "PayPal, Inc.",
    "paypal.co.uk": "PayPal, Inc.",
    "paypal.co.za": "PayPal, Inc.",
    "paypal.com": "PayPal, Inc.",
    "paypal.com.ar": "PayPal, Inc.",
    "paypal.com.au": "PayPal, Inc.",
    "paypal.com.br": "PayPal, Inc.",
    "paypal.com.hk": "PayPal, Inc.",
    "paypal.com.mx": "PayPal, Inc.",
    "paypal.com.my": "PayPal, Inc.",
    "paypal.com.pe": "PayPal, Inc.",
    "paypal.com.pt": "PayPal, Inc.",
    "paypal.com.sa": "PayPal, Inc.",
    "paypal.com.sg": "PayPal, Inc.",
    "paypal.com.tr": "PayPal, Inc.",
    "paypal.com.tw": "PayPal, Inc.",
    "paypal.com.ve": "PayPal, Inc.",
    "paypal.de": "PayPal, Inc.",
    "paypal.dk": "PayPal, Inc.",
    "paypal.es": "PayPal, Inc.",
    "paypal.eu": "PayPal, Inc.",
    "paypal.fi": "PayPal, Inc.",
    "paypal.fr": "PayPal, Inc.",
    "paypal.ie": "PayPal, Inc.",
    "paypal.it": "PayPal, Inc.",
    "paypal.jp": "PayPal, Inc.",
    "paypal.lu": "PayPal, Inc.",
    "paypal.me": "PayPal, Inc.",
    "paypal.nl": "PayPal, Inc.",
    "paypal.no": "PayPal, Inc.",
    "paypal.ph": "PayPal, Inc.",
    "paypal.pl": "PayPal, Inc.",
    "paypal.pt": "PayPal, Inc.",
    "paypal.ru": "PayPal, Inc.",
    "paypal.se": "PayPal, Inc.",
    "paypal.vn": "PayPal, Inc.",
    "paypalbenefits.com": "PayPal, Inc.",
    "paypalobjects.com": "PayPal, Inc.",
    "s-xoom.com": "PayPal, Inc.",
    "thepaypalblog.com": "PayPal, Inc.",
    "venmo.com": "PayPal, Inc.",
    "where.com": "PayPal, Inc.",
    "xoom.com": "PayPal, Inc.",
    "pcapredict.com": "Postcode Anywhere",
    "pcdn.co": "PAGELY, INC",
    "adziff.com": "Ziff Davis LLC",
    "agoramedia.com": "Ziff Davis LLC",
    "askmen.com": "Ziff Davis LLC",
    "bestblackfriday.com": "Ziff Davis LLC",
    "bestgifts.com": "Ziff Davis LLC",
    "blackfriday.co.uk": "Ziff Davis LLC",
    "blackfriday.com": "Ziff Davis LLC",
    "cdnst.net": "Ziff Davis LLC",
    "demandshore.com": "Ziff Davis LLC",
    "everydayhealth.com": "Ziff Davis LLC",
    "formd.com": "Ziff Davis LLC",
    "healthecareers.com": "Ziff Davis LLC",
    "healthecareersqa.com": "Ziff Davis LLC",
    "ign.com": "Ziff Davis LLC",
    "j2global.com": "Ziff Davis LLC",
    "lifescript.com": "Ziff Davis LLC",
    "line2.com": "Ziff Davis LLC",
    "mashable.com": "Ziff Davis LLC",
    "medpagetoday.com": "Ziff Davis LLC",
    "medpagetoday.net": "Ziff Davis LLC",
    "medpagetoday.org": "Ziff Davis LLC",
    "migraineagain.com": "Ziff Davis LLC",
    "mshcdn.com": "Ziff Davis LLC",
    "netshelter.net": "Ziff Davis LLC",
    "nsstatic.com": "Ziff Davis LLC",
    "nsstatic.net": "Ziff Davis LLC",
    "offerscdn.net": "Ziff Davis LLC",
    "ookla.com": "Ziff Davis LLC",
    "pcmag.com": "Ziff Davis LLC",
    "primeinc.org": "Ziff Davis LLC",
    "revenu8.com": "Ziff Davis LLC",
    "speedtest.net": "Ziff Davis LLC",
    "speedtestcustom.com": "Ziff Davis LLC",
    "techbargains.com": "Ziff Davis LLC",
    "toolbox.com": "Ziff Davis LLC",
    "waterfrontmedia.com": "Ziff Davis LLC",
    "whattoexpect.com": "Ziff Davis LLC",
    "zdbb.net": "Ziff Davis LLC",
    "ziffdavis.com": "Ziff Davis LLC",
    "ziffprod.com": "Ziff Davis LLC",
    "ziffprod.net": "Ziff Davis LLC",
    "ziffstatic.com": "Ziff Davis LLC",
    "zifftech.com": "Ziff Davis LLC",
    "pdst.fm": "Podsights",
    "podsights.com": "Podsights",
    "peerius.com": "Peerius Ltd",
    "pendo.io": "Pendo.io, Inc.",
    "perfectmarket.com": "Perfect Market, Inc.",
    "performax.cz": "OSOBNOSTI.cz, s.r.o.",
    "perimeterx.com": "PerimeterX, Inc.",
    "perimeterx.net": "PerimeterX, Inc.",
    "px-cdn.net": "PerimeterX, Inc.",
    "px-client.net": "PerimeterX, Inc.",
    "px-cloud.net": "PerimeterX, Inc.",
    "pxi.pub": "PerimeterX, Inc.",
    "permutive.com": "Permutive, Inc.",
    "personalizer.io": "LimeSpot",
    "picreel.com": "Webfolio Management Inc",
    "pingdom.com": "Pingdom AB",
    "pingdom.net": "Pingdom AB",
    "pin.it": "Pinterest, Inc.",
    "pinimg.com": "Pinterest, Inc.",
    "pinterest.at": "Pinterest, Inc.",
    "pinterest.be": "Pinterest, Inc.",
    "pinterest.ca": "Pinterest, Inc.",
    "pinterest.ch": "Pinterest, Inc.",
    "pinterest.cl": "Pinterest, Inc.",
    "pinterest.co": "Pinterest, Inc.",
    "pinterest.co.at": "Pinterest, Inc.",
    "pinterest.co.in": "Pinterest, Inc.",
    "pinterest.co.kr": "Pinterest, Inc.",
    "pinterest.co.nz": "Pinterest, Inc.",
    "pinterest.co.uk": "Pinterest, Inc.",
    "pinterest.com": "Pinterest, Inc.",
    "pinterest.com.au": "Pinterest, Inc.",
    "pinterest.com.bo": "Pinterest, Inc.",
    "pinterest.com.ec": "Pinterest, Inc.",
    "pinterest.com.mx": "Pinterest, Inc.",
    "pinterest.com.pe": "Pinterest, Inc.",
    "pinterest.com.py": "Pinterest, Inc.",
    "pinterest.com.uy": "Pinterest, Inc.",
    "pinterest.com.vn": "Pinterest, Inc.",
    "pinterest.de": "Pinterest, Inc.",
    "pinterest.dk": "Pinterest, Inc.",
    "pinterest.ec": "Pinterest, Inc.",
    "pinterest.engineering": "Pinterest, Inc.",
    "pinterest.es": "Pinterest, Inc.",
    "pinterest.fr": "Pinterest, Inc.",
    "pinterest.hu": "Pinterest, Inc.",
    "pinterest.id": "Pinterest, Inc.",
    "pinterest.ie": "Pinterest, Inc.",
    "pinterest.in": "Pinterest, Inc.",
    "pinterest.info": "Pinterest, Inc.",
    "pinterest.it": "Pinterest, Inc.",
    "pinterest.jp": "Pinterest, Inc.",
    "pinterest.kr": "Pinterest, Inc.",
    "pinterest.mx": "Pinterest, Inc.",
    "pinterest.nl": "Pinterest, Inc.",
    "pinterest.nz": "Pinterest, Inc.",
    "pinterest.pe": "Pinterest, Inc.",
    "pinterest.ph": "Pinterest, Inc.",
    "pinterest.pt": "Pinterest, Inc.",
    "pinterest.ru": "Pinterest, Inc.",
    "pinterest.se": "Pinterest, Inc.",
    "pinterest.th": "Pinterest, Inc.",
    "pinterest.tw": "Pinterest, Inc.",
    "pinterest.uk": "Pinterest, Inc.",
    "pinterest.vn": "Pinterest, Inc.",
    "pinterestmail.com": "Pinterest, Inc.",
    "arbor.io": "LiveRamp",
    "circulate.com": "LiveRamp",
    "faktor.io": "LiveRamp",
    "liveramp.com": "LiveRamp",
    "pippio.com": "LiveRamp",
    "rlcdn.com": "LiveRamp",
    "piwik.pro": "Piwik PRO Sp. z o.o.",
    "piwikpro.com": "Piwik PRO Sp. z o.o.",
    "playbuzz.com": "Playbuzz LTD",
    "playground.xyz": "PLAYGROUND XYZ",
    "plista.com": "plista GmbH",
    "buonissimo.org": "ItaliaOnLine SpA",
    "iol.it": "ItaliaOnLine SpA",
    "iolam.it": "ItaliaOnLine SpA",
    "libero.it": "ItaliaOnLine SpA",
    "paginebianche.it": "ItaliaOnLine SpA",
    "paginegialle.it": "ItaliaOnLine SpA",
    "plug.it": "ItaliaOnLine SpA",
    "quifinanza.it": "ItaliaOnLine SpA",
    "virgilio.it": "ItaliaOnLine SpA",
    "909c.fr": "Ano Nymous",
    "adala-news.fr": "Ano Nymous",
    "anikawa.fr": "Ano Nymous",
    "boutdegomme.fr": "Ano Nymous",
    "calendriergratuit.fr": "Ano Nymous",
    "cloud-media.fr": "Ano Nymous",
    "coco.fr": "Ano Nymous",
    "dcode.fr": "Ano Nymous",
    "demarchesadministratives.fr": "Ano Nymous",
    "devenir-rentier.fr": "Ano Nymous",
    "e-metsys.fr": "Ano Nymous",
    "egaliteetreconciliation.fr": "Ano Nymous",
    "fiches-auto.fr": "Ano Nymous",
    "general-changelog-team.fr": "Ano Nymous",
    "handbrake.fr": "Ano Nymous",
    "hexdocs.pm": "Ano Nymous",
    "hitek.fr": "Ano Nymous",
    "horairetrain.fr": "Ano Nymous",
    "joursferies.fr": "Ano Nymous",
    "kulturegeek.fr": "Ano Nymous",
    "lairdubois.fr": "Ano Nymous",
    "lemedecin.fr": "Ano Nymous",
    "lesmoutonsenrages.fr": "Ano Nymous",
    "livestats.fr": "Ano Nymous",
    "meteociel.fr": "Ano Nymous",
    "monecole.fr": "Ano Nymous",
    "mybacklink.fr": "Ano Nymous",
    "nealis.fr": "Ano Nymous",
    "oopt.fr": "Ano Nymous",
    "optimalpeople.fr": "Ano Nymous",
    "ownpage.fr": "Ano Nymous",
    "pass-education.fr": "Ano Nymous",
    "playtv.fr": "Ano Nymous",
    "pokepedia.fr": "Ano Nymous",
    "poool.fr": "Ano Nymous",
    "pornovore.fr": "Ano Nymous",
    "sciencepost.fr": "Ano Nymous",
    "stars-actu.fr": "Ano Nymous",
    "superprof.fr": "Ano Nymous",
    "synonymo.fr": "Ano Nymous",
    "turbopix.fr": "Ano Nymous",
    "vladan.fr": "Ano Nymous",
    "wamiz.fr": "Ano Nymous",
    "warashi-asian-pornstars.fr": "Ano Nymous",
    "popads.net": "Tomksoft S.A.",
    "popcash.net": "One Media Ltd",
    "popt.in": "ecpm",
    "porjs.com": "PAID ON RESULTS LTD",
    "postaffiliatepro.com": "Quality Unit, s.r.o.",
    "qualityunit.com": "Quality Unit, s.r.o.",
    "pressidium.com": "TechIO Ltd",
    "pricespider.com": "PriceSpider (NeuIntel, LLC)",
    "an-matome.com": "SecureCore",
    "dvd-rank.com": "SecureCore",
    "jpn.com": "SecureCore",
    "jsdo.it": "SecureCore",
    "primecaster.net": "SecureCore",
    "qlife.jp": "SecureCore",
    "x-lift.jp": "SecureCore",
    "primis.tech": "McCann Disciplines Ltd.",
    "prismic.io": "Prismic.io Inc.",
    "pro-market.net": "Datonics LLC",
    "proofpoint.com": "Proofpoint, Inc.",
    "providesupport.com": "Provide Support LLC",
    "psplugin.com": "Vergic AB",
    "vergic.com": "Vergic AB",
    "proclivitysystems.com": "Proclivity Media, Inc.",
    "pswec.com": "Proclivity Media, Inc.",
    "psyma.com": "Psyma Group AG",
    "ptengine.com": "PTMIND INC.",
    "ptengine.jp": "PTMIND INC.",
    "publift.com": "Publift Pty Ltd",
    "publir.com": "Publir",
    "pubmatic.com": "PubMatic, Inc.",
    "pushcrew.com": "Wingify",
    "visualwebsiteoptimizer.com": "Wingify",
    "vwo.com": "Wingify",
    "wingify.com": "Wingify",
    "pushengage.com": "Ravi Trivedi",
    "pushnami.com": "Pushnami, LLC",
    "pushowl.com": "Shashank Kumar",
    "pushpushgo.com": "PushPushGo Sp. z o. o.",
    "pushwoosh.com": "Arello Mobile",
    "pzz.events": "Kizitos Holding B.V.",
    "pzz.io": "Kizitos Holding B.V.",
    "qualaroo.com": "Qualaroo",
    "qualtrics.com": "Qualtrics, LLC",
    "apacdex.com": "APAC Digital Exchange",
    "quantumdex.io": "APAC Digital Exchange",
    "quantummetric.com": "Quantum Metric Inc.",
    "quora.com": "Quora",
    "quoracdn.net": "Quora",
    "dmm.co.jp": "DMM.com Co.,Ltd",
    "dmm.com": "DMM.com Co.,Ltd",
    "r18.com": "DMM.com Co.,Ltd",
    "r42tag.com": "Relay42 Technology B.V.",
    "r66net.com": "VIDEOSTEP NV",
    "videostep.com": "VIDEOSTEP NV",
    "cheapflights.co.uk": "KAYAK SOFTWARE CORPORATION",
    "cheapflights.com": "KAYAK SOFTWARE CORPORATION",
    "checkfelix.com": "KAYAK SOFTWARE CORPORATION",
    "kayak.co.uk": "KAYAK SOFTWARE CORPORATION",
    "kayak.com": "KAYAK SOFTWARE CORPORATION",
    "kayak.com.co": "KAYAK SOFTWARE CORPORATION",
    "kayak.de": "KAYAK SOFTWARE CORPORATION",
    "kayak.fr": "KAYAK SOFTWARE CORPORATION",
    "momondo.com": "KAYAK SOFTWARE CORPORATION",
    "momondo.de": "KAYAK SOFTWARE CORPORATION",
    "momondo.net": "KAYAK SOFTWARE CORPORATION",
    "r9cdn.net": "KAYAK SOFTWARE CORPORATION",
    "swoodoo.com": "KAYAK SOFTWARE CORPORATION",
    "abbreviationfinder.org": "Rackspace US, Inc.",
    "copyscape.com": "Rackspace US, Inc.",
    "moongiant.com": "Rackspace US, Inc.",
    "rackcdn.com": "Rackspace US, Inc.",
    "rackspace.com": "Rackspace US, Inc.",
    "rackspacecloud.com": "Rackspace US, Inc.",
    "raxcdn.com": "Rackspace US, Inc.",
    "sellhealth.com": "Rackspace US, Inc.",
    "afisha.ru": "Rambler Internet Holding, LLC",
    "championat.com": "Rambler Internet Holding, LLC",
    "dsp-rambler.ru": "Rambler Internet Holding, LLC",
    "ferra.ru": "Rambler Internet Holding, LLC",
    "gazeta.ru": "Rambler Internet Holding, LLC",
    "indicator.ru": "Rambler Internet Holding, LLC",
    "kinoplan.ru": "Rambler Internet Holding, LLC",
    "lenta.ru": "Rambler Internet Holding, LLC",
    "letidor.ru": "Rambler Internet Holding, LLC",
    "livejournal.com": "Rambler Internet Holding, LLC",
    "livejournal.net": "Rambler Internet Holding, LLC",
    "lj.ru": "Rambler Internet Holding, LLC",
    "moslenta.ru": "Rambler Internet Holding, LLC",
    "motor.ru": "Rambler Internet Holding, LLC",
    "okko.tv": "Rambler Internet Holding, LLC",
    "quto.ru": "Rambler Internet Holding, LLC",
    "r0.ru": "Rambler Internet Holding, LLC",
    "rambler-co.ru": "Rambler Internet Holding, LLC",
    "rambler.ru": "Rambler Internet Holding, LLC",
    "rambler.su": "Rambler Internet Holding, LLC",
    "ramblergroup.com": "Rambler Internet Holding, LLC",
    "rco.ru": "Rambler Internet Holding, LLC",
    "rl0.ru": "Rambler Internet Holding, LLC",
    "rnet.plus": "Rambler Internet Holding, LLC",
    "rns.online": "Rambler Internet Holding, LLC",
    "secretmag.ru": "Rambler Internet Holding, LLC",
    "top100.ru": "Rambler Internet Holding, LLC",
    "rating-widget.com": "Rating-Widget, Inc.",
    "abcrender.com": "Functional Software, Inc.",
    "getsentry.com": "Functional Software, Inc.",
    "ravenjs.com": "Functional Software, Inc.",
    "sentry-cdn.com": "Functional Software, Inc.",
    "sentry.io": "Functional Software, Inc.",
    "raygun.io": "Mindscape Limited",
    "realytics.io": "Realytics SAS",
    "realytics.net": "Realytics SAS",
    "reamaze.com": "Lantirn Incorporated",
    "reamaze.io": "Lantirn Incorporated",
    "recruitics.com": "Recruitics LLC",
    "dubsmash.com": "Reddit Inc.",
    "redd.it": "Reddit Inc.",
    "reddit.com": "Reddit Inc.",
    "redditinc.com": "Reddit Inc.",
    "redditmedia.com": "Reddit Inc.",
    "redditstatic.com": "Reddit Inc.",
    "reddituploads.com": "Reddit Inc.",
    "relish.com": "Fexy Media, Inc.",
    "roadfood.com": "Fexy Media, Inc.",
    "seriouseats.com": "Fexy Media, Inc.",
    "simplyrecipes.com": "Fexy Media, Inc.",
    "resetdigital.co": "Reset Digital LLC",
    "reson8.com": "Resonate Networks",
    "resonate.com": "Resonate Networks",
    "resultspage.com": "SLI Systems, Inc",
    "resultsstage.com": "SLI Systems, Inc",
    "sli-r.com": "SLI Systems, Inc",
    "sli-spark.com": "SLI Systems, Inc",
    "sli-systems.com": "SLI Systems, Inc",
    "myretailrocket.com": "Retail Rocket",
    "retailrocket.com": "Retail Rocket",
    "retailrocket.net": "Retail Rocket",
    "retailrocket.ru": "Retail Rocket",
    "revcontent.com": "RevContent, LLC",
    "reviews.io": "Liquid New Media Limited",
    "revjet.com": "RevJet",
    "revlifter.io": "RevLifter Limited",
    "reflektion.com": "Reflektion",
    "rfksrv.com": "Reflektion",
    "richaudience.com": "Rich Audience Technologies",
    "richrelevance.com": "RichRelevance",
    "richrelevance.net": "RichRelevance",
    "defensie.nl": "Rijksoverheid",
    "nederlandwereldwijd.nl": "Rijksoverheid",
    "rijksoverheid.nl": "Rijksoverheid",
    "rovid.nl": "Rijksoverheid",
    "leagueoflegends.com": "Riot Games, Inc.",
    "lolstatic.com": "Riot Games, Inc.",
    "lolusercontent.com": "Riot Games, Inc.",
    "riotgames.com": "Riot Games, Inc.",
    "janrain.com": "Janrain",
    "janrainbackplane.com": "Janrain",
    "janrainsso.com": "Janrain",
    "rpxnow.com": "Janrain",
    "roq.ad": "Roq.ad",
    "rqtrk.eu": "Roq.ad",
    "adex.com": "Propeller Ads",
    "audiencium.com": "Propeller Ads",
    "audmrk.com": "Propeller Ads",
    "jaxvpn.com": "Propeller Ads",
    "notix.co": "Propeller Ads",
    "propeller-tracking.com": "Propeller Ads",
    "propellerads.com": "Propeller Ads",
    "propellerads.net": "Propeller Ads",
    "propellerclick.com": "Propeller Ads",
    "rtmark.net": "Propeller Ads",
    "rtmarks.net": "Propeller Ads",
    "trads.io": "Propeller Ads",
    "c-ovn.jp": "BrainPad Inc.",
    "rtoaster.jp": "BrainPad Inc.",
    "chango.com": "Magnite, Inc.",
    "dpclk.com": "Magnite, Inc.",
    "magnite.com": "Magnite, Inc.",
    "mobsmith.com": "Magnite, Inc.",
    "nearbyad.com": "Magnite, Inc.",
    "rubiconproject.com": "Magnite, Inc.",
    "sharedid.org": "Magnite, Inc.",
    "rutarget.ru": "RuTarget LLC",
    "prisma.fi": "Suomen Osuuskauppojen Keskuskunta",
    "s-cloud.fi": "Suomen Osuuskauppojen Keskuskunta",
    "sok.fi": "Suomen Osuuskauppojen Keskuskunta",
    "yhteishyva.fi": "Suomen Osuuskauppojen Keskuskunta",
    "carnivalmobile.com": "Sailthru, Inc",
    "sail-horizon.com": "Sailthru, Inc",
    "sail-personalize.com": "Sailthru, Inc",
    "sail-track.com": "Sailthru, Inc",
    "sailthru.com": "Sailthru, Inc",
    "sajari.com": "Sajari",
    "salesloft.com": "SalesLoft",
    "salesmanago.pl": "Benhauer sp. z o.o.",
    "rotaban.ru": "LTD Sape",
    "sape.ru": "LTD Sape",
    "sascdn.com": "Smartadserver S.A.S",
    "smartadserver.com": "Smartadserver S.A.S",
    "bitmoji.com": "Snap Inc.",
    "bitstrips.com": "Snap Inc.",
    "sc-cdn.net": "Snap Inc.",
    "sc-jpl.com": "Snap Inc.",
    "sc-prod.net": "Snap Inc.",
    "sc-static.net": "Snap Inc.",
    "snap.com": "Snap Inc.",
    "snapads.com": "Snap Inc.",
    "snapchat.com": "Snap Inc.",
    "snapkit.com": "Snap Inc.",
    "zen.ly": "Snap Inc.",
    "emarsys.com": "Emarsys eMarketing Systems AG",
    "scarabresearch.com": "Emarsys eMarketing Systems AG",
    "scdn.co": "Spotify AB",
    "spotify.com": "Spotify AB",
    "schibsted.com": "Schibsted Products and Technology",
    "scholarlyiq.com": "Scholarly iQ",
    "comscore.com": "comScore, Inc",
    "e.cl": "comScore, Inc",
    "mdotlabs.com": "comScore, Inc",
    "measuread.com": "comScore, Inc",
    "scorecardresearch.com": "comScore, Inc",
    "zqtk.net": "comScore, Inc",
    "ryzeo.com": "EZ Publishing Inc.",
    "screenpopper.com": "EZ Publishing Inc.",
    "datnova.com": "Sirdata",
    "sddan.com": "Sirdata",
    "thirdata.com": "Sirdata",
    "sdiapi.com": "sourcedefense",
    "searchforce.net": "SearchForce Inc.",
    "secure-afterpay.com.au": "Touch Networks Pty Ltd",
    "securedvisit.com": "4Cite Marketing",
    "seedtag.com": "SEEDTAG ADVERTISING S.L.",
    "ckrf1.com": "EMPTY TANK LIMITED",
    "dagfs.com": "EMPTY TANK LIMITED",
    "htdvt.com": "EMPTY TANK LIMITED",
    "sbfsdvc.com": "EMPTY TANK LIMITED",
    "sefsdvc.com": "EMPTY TANK LIMITED",
    "selfpua.com": "EMPTY TANK LIMITED",
    "vfghc.com": "EMPTY TANK LIMITED",
    "yterxv.com": "EMPTY TANK LIMITED",
    "segment.com": "Segment.io, Inc.",
    "segment.io": "Segment.io, Inc.",
    "segmentify.com": "Segmentify Yazilim A.S.",
    "bibliocms.com": "Oracle + Dyn",
    "electrical-engineering-portal.com": "Oracle + Dyn",
    "evolvehq.com": "Oracle + Dyn",
    "hybridcloudspan.com": "Oracle + Dyn",
    "pa-cdn.com": "Oracle + Dyn",
    "pbpython.com": "Oracle + Dyn",
    "penny-arcade.com": "Oracle + Dyn",
    "puppet.com": "Oracle + Dyn",
    "sekindo.com": "Oracle + Dyn",
    "sitecues.com": "Oracle + Dyn",
    "solitr.com": "Oracle + Dyn",
    "songsterr.com": "Oracle + Dyn",
    "thrillcall.com": "Oracle + Dyn",
    "semasio.com": "Semasio GmbH",
    "semasio.net": "Semasio GmbH",
    "sendinblue.com": "Dual Technologies Services",
    "sibautomation.com": "Dual Technologies Services",
    "anandtech.com": "Purch Group, Inc.",
    "laptopmag.com": "Purch Group, Inc.",
    "livescience.com": "Purch Group, Inc.",
    "natoms.com": "Purch Group, Inc.",
    "newsarama.com": "Purch Group, Inc.",
    "purch.com": "Purch Group, Inc.",
    "servebom.com": "Purch Group, Inc.",
    "tomsguide.com": "Purch Group, Inc.",
    "tomsguide.fr": "Purch Group, Inc.",
    "tomshardware.com": "Purch Group, Inc.",
    "tomshardware.fr": "Purch Group, Inc.",
    "toptenreviews.com": "Purch Group, Inc.",
    "activeboard.com": "AdButler",
    "adbutler-fermion.com": "AdButler",
    "adbutler-ikon.com": "AdButler",
    "adbutler-meson.com": "AdButler",
    "adbutler-tachyon.com": "AdButler",
    "servedbyadbutler.com": "AdButler",
    "nobid.com": "Prebid.org",
    "prebid.org": "Prebid.org",
    "servenobid.com": "Prebid.org",
    "shappify.com": "Shappify",
    "shareaholic.com": "Shareaholic Inc",
    "shareaholic.net": "Shareaholic Inc",
    "sharethis.com": "ShareThis, Inc",
    "shareth.ru": "Sharethrough, Inc.",
    "sharethrough.com": "Sharethrough, Inc.",
    "shinobi.jp": "Ninja Tools Inc.",
    "myshopify.com": "Shopify Inc.",
    "shop.app": "Shopify Inc.",
    "shopify.com": "Shopify Inc.",
    "shopifyapps.com": "Shopify Inc.",
    "shopifycdn.com": "Shopify Inc.",
    "shopifycloud.com": "Shopify Inc.",
    "shopifysvc.com": "Shopify Inc.",
    "shopback.net": "ShopBack",
    "retargeter.com.br": "Isaac Ezra",
    "shopconvert.com.br": "Isaac Ezra",
    "shoptarget.com.br": "Isaac Ezra",
    "shopperapproved.com": "Global Marketing Strategies",
    "sift.com": "Sift Science, Inc.",
    "siftscience.com": "Sift Science, Inc.",
    "signifyd.com": "Signifyd Inc.",
    "simpli.fi": "Simplifi Holdings Inc.",
    "singular.net": "Singular Labs, Inc.",
    "sng.link": "Singular Labs, Inc.",
    "sirv.com": "Jake Brumby",
    "siteimprove.com": "Siteimprove A/S",
    "siteimprove.net": "Siteimprove A/S",
    "siteimproveanalytics.com": "Siteimprove A/S",
    "siteimproveanalytics.io": "Siteimprove A/S",
    "adbrite.com": "Centro, Inc.",
    "basis.net": "Centro, Inc.",
    "centro.net": "Centro, Inc.",
    "sitescout.com": "Centro, Inc.",
    "sjsmartcontent.org": "SlickJump Inc.",
    "redirectingat.com": "Skimbit LTD",
    "skimlinks.com": "Skimbit LTD",
    "skimresources.com": "Skimbit LTD",
    "c-ctrip.com": "Trip.com Group Limited",
    "ctrip.com": "Trip.com Group Limited",
    "ctripbiz.com": "Trip.com Group Limited",
    "skyscanner.com": "Trip.com Group Limited",
    "skyscanner.com.au": "Trip.com Group Limited",
    "skyscanner.de": "Trip.com Group Limited",
    "skyscanner.es": "Trip.com Group Limited",
    "skyscanner.fr": "Trip.com Group Limited",
    "skyscanner.it": "Trip.com Group Limited",
    "skyscanner.net": "Trip.com Group Limited",
    "skyscanner.nl": "Trip.com Group Limited",
    "skyscanner.ru": "Trip.com Group Limited",
    "skyscnr.com": "Trip.com Group Limited",
    "trip.com": "Trip.com Group Limited",
    "tripcdn.cn": "Trip.com Group Limited",
    "tripcdn.com": "Trip.com Group Limited",
    "smaato.com": "Smaato Inc.",
    "smaato.net": "Smaato Inc.",
    "dataxpand.com": "Entravision Communications Corporation",
    "entravision.com": "Entravision Communications Corporation",
    "entravisiondigital.com": "Entravision Communications Corporation",
    "entravisionlocalmarketingsolutions.com": "Entravision Communications Corporation",
    "scrollerads.com": "Entravision Communications Corporation",
    "smadex.com": "Entravision Communications Corporation",
    "smartnews-ads.com": "SmartNews, Inc.",
    "smartnews.be": "SmartNews, Inc.",
    "smartnews.com": "SmartNews, Inc.",
    "smct.co": "SMARTER CLICK TECHNOLOGY LTD",
    "smct.io": "SMARTER CLICK TECHNOLOGY LTD",
    "smg.com": "Service Management Group",
    "smi2.ru": "LLC \"SMI2\"",
    "smi2cdn.ru": "LLC \"SMI2\"",
    "sndcdn.com": "SoundCloud Global Limited & Co. KG",
    "soundcloud.com": "SoundCloud Global Limited & Co. KG",
    "stratus.sc": "SoundCloud Global Limited & Co. KG",
    "socdm.com": "Supership Inc",
    "soclminer.com.br": "RM SISTEMAS",
    "solvvy.com": "Solvvy",
    "sonobi.com": "Sonobi, Inc",
    "sooqr.com": "Sooqr",
    "sooqr.nl": "Sooqr",
    "decenthat.com": "Sourcepoint Technologies Inc",
    "sourcepoint.com": "Sourcepoint Technologies Inc",
    "sp-prod.net": "Sourcepoint Technologies Inc",
    "summerhamster.com": "Sourcepoint Technologies Inc",
    "speedcurve.com": "SpeedCurve Limited",
    "spektrix.com": "Spektrix Ltd",
    "sphereup.com": "SphereUp, Inc",
    "spiceworks.com": "Spiceworks, Inc",
    "spiceworksstatic.com": "Spiceworks, Inc",
    "betradar.com": "Sportradar AG",
    "sportradar.com": "Sportradar AG",
    "sportradar.us": "Sportradar AG",
    "sportradarserving.com": "Sportradar AG",
    "slmads.com": "Spacefoot SAS",
    "sportslocalmedia.com": "Spacefoot SAS",
    "openweb.com": "OpenWeb Technologies Ltd.",
    "spot.im": "OpenWeb Technologies Ltd.",
    "spotim.market": "Spot.IM",
    "spotx.tv": "SpotX, Inc.",
    "spotxcdn.com": "SpotX, Inc.",
    "spotxchange.com": "SpotX, Inc.",
    "spreadshirt.net": "sprd.net AG",
    "spreadshirtmedia.com": "sprd.net AG",
    "spreadshirtmedia.net": "sprd.net AG",
    "spreadshirts.net": "sprd.net AG",
    "springserve.com": "SpringServe, LLC",
    "springserve.net": "SpringServe, LLC",
    "squarespace-cdn.com": "Squarespace, Inc",
    "squarespace.com": "Squarespace, Inc",
    "sspinc.io": "Secret Sauce Partners, Inc.",
    "stackadapt.com": "Collective Roll",
    "statcounter.com": "StatCounter",
    "flic.kr": "SmugMug, Inc.",
    "flickr.com": "SmugMug, Inc.",
    "smugmug.com": "SmugMug, Inc.",
    "staticflickr.com": "SmugMug, Inc.",
    "immedia.com.br": "IG PUBLICIDADE E CONTEUDO LTDA",
    "infomoney.com.br": "IG PUBLICIDADE E CONTEUDO LTDA",
    "statig.com.br": "IG PUBLICIDADE E CONTEUDO LTDA",
    "storygize.com": "Storygize",
    "storygize.net": "Storygize",
    "atom-data.io": "ironSource Ltd",
    "ironsrc.mobi": "ironSource Ltd",
    "isprog.com": "ironSource Ltd",
    "lunalabs.io": "ironSource Ltd",
    "risecodes.com": "ironSource Ltd",
    "ssacdn.com": "ironSource Ltd",
    "streamrail.com": "ironSource Ltd",
    "streamrail.net": "ironSource Ltd",
    "supersonic.com": "ironSource Ltd",
    "supersonicads.com": "ironSource Ltd",
    "vidiom.net": "ironSource Ltd",
    "yellowblue.io": "ironSource Ltd",
    "stripe.com": "Stripe, Inc",
    "stripe.network": "Stripe, Inc",
    "subscribers.com": "Arbitrage LLC",
    "sumo.com": "Sumo Group",
    "sundaysky.com": "SundaySky Ltd.",
    "survata.com": "Survata, Inc.",
    "survicate.com": "Survicate Sp. z o.o.",
    "schneevonmorgen.com": "schnee von morgen webTV GmbH",
    "svonm.com": "schnee von morgen webTV GmbH",
    "lifelock.com": "Symantec Corporation",
    "norton.com": "Symantec Corporation",
    "nortoncdn.com": "Symantec Corporation",
    "symantec.com": "Symantec Corporation",
    "symassets.com": "Symantec Corporation",
    "syn-finity.com": "Synthetix Ltd",
    "synthetix-ec1.com": "Synthetix Ltd",
    "synthetix.com": "Synthetix Ltd",
    "t.me": "Telegram Messenger LLP",
    "telegram.me": "Telegram Messenger LLP",
    "telegram.org": "Telegram Messenger LLP",
    "tlgrm.eu": "Telegram Messenger LLP",
    "tlgrm.ru": "Telegram Messenger LLP",
    "admailtiser.com": "Taboola, Inc.",
    "basebanner.com": "Taboola, Inc.",
    "cmbestsrv.com": "Taboola, Inc.",
    "convertmedia.com": "Taboola, Inc.",
    "taboola.com": "Taboola, Inc.",
    "taboolasyndication.com": "Taboola, Inc.",
    "vidfuture.com": "Taboola, Inc.",
    "zorosrv.com": "Taboola, Inc.",
    "airfarewatchdog.com": "TripAdvisor LLC",
    "cruisecritic.com": "TripAdvisor LLC",
    "cruisecritic.net": "TripAdvisor LLC",
    "familyvacationcritic.com": "TripAdvisor LLC",
    "jscache.com": "TripAdvisor LLC",
    "oyster.com": "TripAdvisor LLC",
    "seatguru.com": "TripAdvisor LLC",
    "slimg.com": "TripAdvisor LLC",
    "smarter-js.com": "TripAdvisor LLC",
    "smarter-pops.com": "TripAdvisor LLC",
    "smartertravel.com": "TripAdvisor LLC",
    "smartertravel.net": "TripAdvisor LLC",
    "tacdn.com": "TripAdvisor LLC",
    "tamgrt.com": "TripAdvisor LLC",
    "travelsmarter.net": "TripAdvisor LLC",
    "tripadvisor.at": "TripAdvisor LLC",
    "tripadvisor.be": "TripAdvisor LLC",
    "tripadvisor.ca": "TripAdvisor LLC",
    "tripadvisor.ch": "TripAdvisor LLC",
    "tripadvisor.co.nz": "TripAdvisor LLC",
    "tripadvisor.co.uk": "TripAdvisor LLC",
    "tripadvisor.co.za": "TripAdvisor LLC",
    "tripadvisor.com": "TripAdvisor LLC",
    "tripadvisor.com.au": "TripAdvisor LLC",
    "tripadvisor.com.br": "TripAdvisor LLC",
    "tripadvisor.com.hk": "TripAdvisor LLC",
    "tripadvisor.com.mx": "TripAdvisor LLC",
    "tripadvisor.com.my": "TripAdvisor LLC",
    "tripadvisor.com.ph": "TripAdvisor LLC",
    "tripadvisor.com.sg": "TripAdvisor LLC",
    "tripadvisor.de": "TripAdvisor LLC",
    "tripadvisor.dk": "TripAdvisor LLC",
    "tripadvisor.es": "TripAdvisor LLC",
    "tripadvisor.fi": "TripAdvisor LLC",
    "tripadvisor.fr": "TripAdvisor LLC",
    "tripadvisor.ie": "TripAdvisor LLC",
    "tripadvisor.in": "TripAdvisor LLC",
    "tripadvisor.it": "TripAdvisor LLC",
    "tripadvisor.jp": "TripAdvisor LLC",
    "tripadvisor.nl": "TripAdvisor LLC",
    "tripadvisor.pt": "TripAdvisor LLC",
    "tripadvisor.ru": "TripAdvisor LLC",
    "tripadvisor.se": "TripAdvisor LLC",
    "commander1.com": "Fjord Technologies",
    "tagcommander.com": "Fjord Technologies",
    "talkable.com": "Curebit Inc",
    "tapad.com": "Tapad, Inc.",
    "tappx.com": "Tappcelator Media S.L.",
    "taskanalytics.com": "Task Analytics",
    "calltrackingmetrics.com": "Call Tracking Metrics LLC",
    "tctm.co": "Call Tracking Metrics LLC",
    "ebz.io": "Teads ( Luxenbourg ) SA",
    "teads.tv": "Teads ( Luxenbourg ) SA",
    "tealium.com": "Tealium Inc.",
    "tealiumiq.com": "Tealium Inc.",
    "tiqcdn.com": "Tealium Inc.",
    "syn-api.com": "Synacor, Inc.",
    "syn-cdn.com": "Synacor, Inc.",
    "synacor.com": "Synacor, Inc.",
    "synacormedia.com": "Synacor, Inc.",
    "technorati.com": "Synacor, Inc.",
    "technoratimedia.com": "Synacor, Inc.",
    "zimbra.org": "Synacor, Inc.",
    "computerweekly.com": "TechTarget, Inc.",
    "notebookreview.com": "TechTarget, Inc.",
    "tabletpcreview.com": "TechTarget, Inc.",
    "techtarget.com": "TechTarget, Inc.",
    "ttgtmedia.com": "TechTarget, Inc.",
    "kendostatic.com": "Telerik EAD",
    "nativescript.org": "Telerik EAD",
    "telerik.com": "Telerik EAD",
    "telerikstatic.com": "Telerik EAD",
    "teliacompany.com": "Teliasonera AB",
    "teliasonera.com": "Teliasonera AB",
    "telstra.com": "Telstra Corporation Limited",
    "telstra.com.au": "Telstra Corporation Limited",
    "terminus.services": "Terminus",
    "lookfantastic.com": "The Hut.com Ltd.",
    "myprotein.com": "The Hut.com Ltd.",
    "preloved.co.uk": "The Hut.com Ltd.",
    "thcdn.com": "The Hut.com Ltd.",
    "thehut.net": "The Hut.com Ltd.",
    "themoneytizer.com": "The Moneytizer",
    "tmyzer.com": "The Moneytizer",
    "theplatform.com": "thePlatform for Media",
    "thrtle.com": "Throtle",
    "thunderhead.com": "Thunderhead.com Limited",
    "amgdgt.com": "Amobee, Inc",
    "tidaltv.com": "Amobee, Inc",
    "turn.com": "Amobee, Inc",
    "tidiochat.com": "Tidio Poland Sp. z.o.o.",
    "tiny.cloud": "Ephox Corporation",
    "tmgrup.com.tr": "Turkuvaz Mobil Hizmetler A.Þ",
    "tns-counter.ru": "JSC ADFACT",
    "929nin.com": "Townsquare Media",
    "diffuser.fm": "Townsquare Media",
    "kfyo.com": "Townsquare Media",
    "lonestar1023.com": "Townsquare Media",
    "newstalk1290.com": "Townsquare Media",
    "nj1015.com": "Townsquare Media",
    "townsquare.media": "Townsquare Media",
    "townsquareblogs.com": "Townsquare Media",
    "townsquaremedia.com": "Townsquare Media",
    "ultimateclassicrock.com": "Townsquare Media",
    "trackad.cz": "webgarden s.r.o.",
    "trafficroots.com": "Traffic Roots",
    "abritel.fr": "Expedia Group, Inc.",
    "aluguetemporada.com.br": "Expedia Group, Inc.",
    "bedandbreakfast.com": "Expedia Group, Inc.",
    "bookabach.co.nz": "Expedia Group, Inc.",
    "cheaptickets.com": "Expedia Group, Inc.",
    "eancdn.com": "Expedia Group, Inc.",
    "escapia.com": "Expedia Group, Inc.",
    "expedia.ca": "Expedia Group, Inc.",
    "expedia.co.uk": "Expedia Group, Inc.",
    "expedia.com": "Expedia Group, Inc.",
    "expedia.com.au": "Expedia Group, Inc.",
    "expedia.de": "Expedia Group, Inc.",
    "expedia.fr": "Expedia Group, Inc.",
    "expediapartnercentral.com": "Expedia Group, Inc.",
    "fewo-direkt.de": "Expedia Group, Inc.",
    "flights.com": "Expedia Group, Inc.",
    "homeaway.ae": "Expedia Group, Inc.",
    "homeaway.asia": "Expedia Group, Inc.",
    "homeaway.at": "Expedia Group, Inc.",
    "homeaway.ca": "Expedia Group, Inc.",
    "homeaway.cl": "Expedia Group, Inc.",
    "homeaway.co.in": "Expedia Group, Inc.",
    "homeaway.co.kr": "Expedia Group, Inc.",
    "homeaway.co.th": "Expedia Group, Inc.",
    "homeaway.co.uk": "Expedia Group, Inc.",
    "homeaway.com": "Expedia Group, Inc.",
    "homeaway.com.ar": "Expedia Group, Inc.",
    "homeaway.com.au": "Expedia Group, Inc.",
    "homeaway.com.br": "Expedia Group, Inc.",
    "homeaway.com.cn": "Expedia Group, Inc.",
    "homeaway.com.co": "Expedia Group, Inc.",
    "homeaway.com.mx": "Expedia Group, Inc.",
    "homeaway.com.my": "Expedia Group, Inc.",
    "homeaway.com.pe": "Expedia Group, Inc.",
    "homeaway.com.sg": "Expedia Group, Inc.",
    "homeaway.com.uy": "Expedia Group, Inc.",
    "homeaway.de": "Expedia Group, Inc.",
    "homeaway.dk": "Expedia Group, Inc.",
    "homeaway.ec": "Expedia Group, Inc.",
    "homeaway.es": "Expedia Group, Inc.",
    "homeaway.fi": "Expedia Group, Inc.",
    "homeaway.fr": "Expedia Group, Inc.",
    "homeaway.gr": "Expedia Group, Inc.",
    "homeaway.hk": "Expedia Group, Inc.",
    "homeaway.it": "Expedia Group, Inc.",
    "homeaway.jp": "Expedia Group, Inc.",
    "homeaway.lk": "Expedia Group, Inc.",
    "homeaway.no": "Expedia Group, Inc.",
    "homeaway.pl": "Expedia Group, Inc.",
    "homeaway.ru": "Expedia Group, Inc.",
    "homeaway.se": "Expedia Group, Inc.",
    "homeaway.sg": "Expedia Group, Inc.",
    "homeaway.tw": "Expedia Group, Inc.",
    "homelidays.com": "Expedia Group, Inc.",
    "homelidays.es": "Expedia Group, Inc.",
    "homelidays.fr": "Expedia Group, Inc.",
    "homelidays.it": "Expedia Group, Inc.",
    "instantsoftware.com": "Expedia Group, Inc.",
    "lastminute.com.au": "Expedia Group, Inc.",
    "orbitz.com": "Expedia Group, Inc.",
    "ownersdirect.co.uk": "Expedia Group, Inc.",
    "poweredbygps.com": "Expedia Group, Inc.",
    "rezovation.com": "Expedia Group, Inc.",
    "stayz.com.au": "Expedia Group, Inc.",
    "toprural.cat": "Expedia Group, Inc.",
    "toprural.co.uk": "Expedia Group, Inc.",
    "toprural.com": "Expedia Group, Inc.",
    "toprural.de": "Expedia Group, Inc.",
    "toprural.it": "Expedia Group, Inc.",
    "toprural.nl": "Expedia Group, Inc.",
    "toprural.pt": "Expedia Group, Inc.",
    "travel-assets.com": "Expedia Group, Inc.",
    "travelocity.com": "Expedia Group, Inc.",
    "trvl-media.com": "Expedia Group, Inc.",
    "trvl-px.com": "Expedia Group, Inc.",
    "uciservice.com": "Expedia Group, Inc.",
    "vacationrentals.com": "Expedia Group, Inc.",
    "vrbo.com": "Expedia Group, Inc.",
    "webervations.com": "Expedia Group, Inc.",
    "wotif.com": "Expedia Group, Inc.",
    "treasuredata.com": "Treasure Data, Inc",
    "tremorhub.com": "Telaria",
    "admantx.com": "SSL Corporation",
    "estatesales.net": "SSL Corporation",
    "flightaware.com": "SSL Corporation",
    "onlinemictest.com": "SSL Corporation",
    "ssl.com": "SSL Corporation",
    "trendemon.com": "SSL Corporation",
    "trkn.us": "Claritas LLC",
    "trov.it": "TROVIT",
    "trovit.ca": "TROVIT",
    "trovit.com": "TROVIT",
    "trovit.com.mx": "TROVIT",
    "trovit.fr": "TROVIT",
    "tru.am": "trueAnthem Corp",
    "truconversion.com": "InvoCube Ltd",
    "truefit.com": "True Fit Corporation",
    "truefitcorp.com": "True Fit Corporation",
    "leadid.com": "Lead Intelligence, Inc.",
    "trueleadid.com": "Lead Intelligence, Inc.",
    "truoptik.com": "21 Productions",
    "trustarc.com": "TrustArc Inc.",
    "truste.com": "TrustArc Inc.",
    "trustpilot.com": "Trustpilot A/S",
    "trustpilot.net": "Trustpilot A/S",
    "trustx.org": "DCN",
    "trafficstars.com": "Traffic Stars",
    "tsyndicate.com": "Traffic Stars",
    "dataplusmath.com": "Data Plus Math",
    "tvpixel.com": "Data Plus Math",
    "tvsquared.com": "TVSquared",
    "tweakwise.com": "Tweakwise.com B.V.",
    "typeform.com": "Typeform S.L.",
    "123-reg.co.uk": "123-reg",
    "free-website-hit-counter.com": "123-reg",
    "u5e.com": "123-reg",
    "ubembed.com": "Unbounce",
    "unbounce.com": "Unbounce",
    "uio.no": "Universitetet i Oslo",
    "getsale.io": "SEOPULT LTD",
    "ulogin.ru": "SEOPULT LTD",
    "unbxdapi.com": "Unbxd Software Private Limited",
    "udmserve.net": "Underdog Media LLC",
    "underdog.media": "Underdog Media LLC",
    "undertone.com": "Undertone Networks",
    "npmcdn.com": "unpkg",
    "unpkg.com": "unpkg",
    "unrulymedia.com": "Unruly Group Limited",
    "upsellit.com": "USI Technologies, Inc.",
    "airship.com": "Urban Airship, Inc.",
    "apptimize.com": "Urban Airship, Inc.",
    "urbanairship.com": "Urban Airship, Inc.",
    "usabilla.com": "Usabilla B.V.",
    "audienceproject.com": "AudienceProject",
    "userreport.com": "AudienceProject",
    "uservoice.com": "UserVoice, Inc.",
    "userzoom.com": "User Zoom, Inc.",
    "clan.su": "Compubyte Limited",
    "ucoz.com": "Compubyte Limited",
    "ucoz.net": "Compubyte Limited",
    "ucoz.ru": "Compubyte Limited",
    "usocial.pro": "Compubyte Limited",
    "adlantis.jp": "ValueCommerce Co., Ltd.",
    "imgvc.com": "ValueCommerce Co., Ltd.",
    "storematch.jp": "ValueCommerce Co., Ltd.",
    "valuecommerce.com": "ValueCommerce Co., Ltd.",
    "gdmdigital.com": "Ve Global UK Limited",
    "veinteractive.com": "Ve Global UK Limited",
    "vepxl1.net": "Ve Global UK Limited",
    "venatusmedia.com": "Venatus Media Limited",
    "vntsm.com": "Venatus Media Limited",
    "ad2perf.com": "J S WEB PRODUCTION",
    "moxielinks.com": "J S WEB PRODUCTION",
    "veoxa.com": "J S WEB PRODUCTION",
    "viafoura.co": "Viafoura Inc.",
    "viafoura.com": "Viafoura Inc.",
    "viafoura.net": "Viafoura Inc.",
    "vidazoo.com": "Vidazoo Ltd",
    "scanscout.com": "Tremor Video DSP",
    "tremormedia.com": "Tremor Video DSP",
    "videohub.tv": "Tremor Video DSP",
    "eleconomista.es": "Soluciones Corporativas IP, SL",
    "vidoomy.com": "Soluciones Corporativas IP, SL",
    "vidora.com": "Vidora, Inc.",
    "vidyard.com": "Vidyard",
    "livestream.com": "Vimeo, LLC",
    "vhx.tv": "Vimeo, LLC",
    "vimeo.com": "Vimeo, LLC",
    "vimeo.tv": "Vimeo, LLC",
    "vimeocdn.com": "Vimeo, LLC",
    "vimeopro.com": "Vimeo, LLC",
    "viqeo.tv": "Viqeo LLC.",
    "vizzit.se": "Vizzit International AB",
    "vlaanderen.be": "Ministeries van de Vlaamse Gemeenschap",
    "abc.es": "vocento",
    "diariosur.es": "vocento",
    "diariovasco.com": "vocento",
    "elcomercio.es": "vocento",
    "elcorreo.com": "vocento",
    "hoy.es": "vocento",
    "ideal.es": "vocento",
    "lasprovincias.es": "vocento",
    "laverdad.es": "vocento",
    "vocento.com": "vocento",
    "voicefive.com": "Voicefive, Inc",
    "voxus.com.br": "Voxus Midia Ltda",
    "dataxu.com": "Roku, Inc.",
    "ravm.net": "Roku, Inc.",
    "ravm.tv": "Roku, Inc.",
    "roku.com": "Roku, Inc.",
    "rokulabs.net": "Roku, Inc.",
    "rokutime.com": "Roku, Inc.",
    "w55c.net": "Roku, Inc.",
    "asda.com": "Walmart Inc.",
    "assets-asda.com": "Walmart Inc.",
    "bestprice-registration.com": "Walmart Inc.",
    "bestprice.in": "Walmart Inc.",
    "ekartlogistics.com": "Walmart Inc.",
    "fkapi.net": "Walmart Inc.",
    "fkrt.it": "Walmart Inc.",
    "flipkart.com": "Walmart Inc.",
    "flipkartethics.com": "Walmart Inc.",
    "flixcart.com": "Walmart Inc.",
    "flixcart.net": "Walmart Inc.",
    "holidaybetter.com": "Walmart Inc.",
    "jabong.com": "Walmart Inc.",
    "jassets.com": "Walmart Inc.",
    "massmart.co.za": "Walmart Inc.",
    "moosejaw.com": "Walmart Inc.",
    "mountainsteals.com": "Walmart Inc.",
    "myntapi.com": "Walmart Inc.",
    "myntassets.com": "Walmart Inc.",
    "myntra.com": "Walmart Inc.",
    "myntra360.com": "Walmart Inc.",
    "myntrainfo.com": "Walmart Inc.",
    "phonepe.com": "Walmart Inc.",
    "phonepeethics.com": "Walmart Inc.",
    "samsclub.com": "Walmart Inc.",
    "samsclubresources.com": "Walmart Inc.",
    "seiyu-survey.com": "Walmart Inc.",
    "seiyu.co.jp": "Walmart Inc.",
    "vudu.com": "Walmart Inc.",
    "w-mt.co": "Walmart Inc.",
    "wal-mart.com": "Walmart Inc.",
    "wal-martchina.com": "Walmart Inc.",
    "wal.co": "Walmart Inc.",
    "walmart-jump.com": "Walmart Inc.",
    "walmart.ca": "Walmart Inc.",
    "walmart.com": "Walmart Inc.",
    "walmart.com.cn": "Walmart Inc.",
    "walmart.com.mx": "Walmart Inc.",
    "walmart.org": "Walmart Inc.",
    "walmart.pharmacy": "Walmart Inc.",
    "walmartbrandcenter.com": "Walmart Inc.",
    "walmartcanada.ca": "Walmart Inc.",
    "walmartcareerswithamission.com": "Walmart Inc.",
    "walmartcentroamerica.com": "Walmart Inc.",
    "walmartethics.com": "Walmart Inc.",
    "walmartfoodsafetychina.cn": "Walmart Inc.",
    "walmartfoodsafetychina.com": "Walmart Inc.",
    "walmartgreatforyou.com": "Walmart Inc.",
    "walmartimages.ca": "Walmart Inc.",
    "walmartimages.com": "Walmart Inc.",
    "walmartjapanseiyu.com": "Walmart Inc.",
    "walmartlabs.com": "Walmart Inc.",
    "walmartmedia.com": "Walmart Inc.",
    "walmartmexico.com": "Walmart Inc.",
    "walmartmexicoycam.com": "Walmart Inc.",
    "walmartmoneycard.com": "Walmart Inc.",
    "walmartmuseum.com": "Walmart Inc.",
    "walmartone.com": "Walmart Inc.",
    "walmartplus.com": "Walmart Inc.",
    "walmartrealty.com": "Walmart Inc.",
    "walmartspouseswithamission.com": "Walmart Inc.",
    "walmartsustainabilityhub.com": "Walmart Inc.",
    "wmobjects.com.br": "Walmart Inc.",
    "wmt.co": "Walmart Inc.",
    "wdsvc.net": "Wiland, Inc.",
    "webengage.co": "Webklipper Technologies Pvt Ltd",
    "webengage.com": "Webklipper Technologies Pvt Ltd",
    "webeyez.com": "Blue Capital Markets Limited",
    "webgains.com": "Webgains",
    "webgains.io": "Webgains",
    "weborama.com": "Weborama",
    "weborama.fr": "Weborama",
    "weborama.io": "Weborama",
    "webspectator.com": "Webspectator Corporation",
    "webtrends.com": "WebTrends Inc.",
    "webtrendslive.com": "WebTrends Inc.",
    "wisepops.com": "Benjamin Cahen",
    "wistia.com": "Wistia",
    "wistia.net": "Wistia",
    "witglobal.net": "Würth IT GmbH",
    "acwebconnecting.com": "TMD Swiss AG",
    "wlresources.com": "TMD Swiss AG",
    "wonderpush.com": "WonderPush",
    "woopra.com": "Woopra, Inc.",
    "wootric.com": "Wootric",
    "worldoftulo.com": "Adeprimo AB",
    "adtotal.pl": "Wirtualna Polska",
    "dobreprogramy.pl": "Wirtualna Polska",
    "fotoblogia.pl": "Wirtualna Polska",
    "gadzetomania.pl": "Wirtualna Polska",
    "kafeteria.pl": "Wirtualna Polska",
    "komorkomania.pl": "Wirtualna Polska",
    "money.pl": "Wirtualna Polska",
    "o2.pl": "Wirtualna Polska",
    "open.fm": "Wirtualna Polska",
    "pudelek.pl": "Wirtualna Polska",
    "wp.pl": "Wirtualna Polska",
    "wpimg.pl": "Wirtualna Polska",
    "wsimg.com": "Starfield Technologies, LLC",
    "feedbackeconomy.com": "SurveyMonkey Inc.",
    "research.net": "SurveyMonkey Inc.",
    "smassets.net": "SurveyMonkey Inc.",
    "surveymonkey.ca": "SurveyMonkey Inc.",
    "surveymonkey.com": "SurveyMonkey Inc.",
    "surveymonkey.de": "SurveyMonkey Inc.",
    "surveymonkey.eu": "SurveyMonkey Inc.",
    "surveymonkey.fr": "SurveyMonkey Inc.",
    "surveymonkey.net": "SurveyMonkey Inc.",
    "surveymonkey.nl": "SurveyMonkey Inc.",
    "surveymonkey.ru": "SurveyMonkey Inc.",
    "wufoo.com": "SurveyMonkey Inc.",
    "wurfl.io": "ScientiaMobile, Inc.",
    "wysistat.com": "ID.fr",
    "xg4ken.com": "Kenshoo TLD",
    "emetriq.com": "emetriq GmbH",
    "emetriq.de": "emetriq GmbH",
    "xplosion.de": "emetriq GmbH",
    "teensnow.xxx": "WGCZ a.s.",
    "xvideos-cdn.com": "WGCZ a.s.",
    "xvideos.com": "WGCZ a.s.",
    "y-medialink.com": "Ysance",
    "y-track.com": "Ysance",
    "geocities.jp": "Yahoo Japan Corporation",
    "storage-yahoo.jp": "Yahoo Japan Corporation",
    "yahoo-help.jp": "Yahoo Japan Corporation",
    "yahoo.co.jp": "Yahoo Japan Corporation",
    "yahooapis.jp": "Yahoo Japan Corporation",
    "yimg.jp": "Yahoo Japan Corporation",
    "yjtag.jp": "Yahoo Japan Corporation",
    "yieldify.com": "Yieldify",
    "yieldlove-ad-serving.net": "Yieldlove GmbH",
    "yieldlove.com": "Yieldlove GmbH",
    "yieldmo.com": "YieldMo, Inc.",
    "yotpo.com": "Yotpo Ltd",
    "yottaa.com": "Yottaa Inc",
    "yottaa.net": "Yottaa Inc",
    "trustedsite.com": "PathDefender",
    "ywxi.net": "PathDefender",
    "allakhazam.com": "ZAM Network",
    "lolking.net": "ZAM Network",
    "wowhead.com": "ZAM Network",
    "zam.com": "ZAM Network",
    "zamimg.com": "ZAM Network",
    "outbound.io": "Zendesk, Inc.",
    "zdassets.com": "Zendesk, Inc.",
    "zendesk.com": "Zendesk, Inc.",
    "zendesk.tv": "Zendesk, Inc.",
    "zndsk.com": "Zendesk, Inc.",
    "zopim.com": "Zendesk, Inc.",
    "zopim.io": "Zendesk, Inc.",
    "zeotap.com": "Zeotap GmbH",
    "zipmoney.com.au": "zipMoney Payments Pty Ltd",
    "iglobalstores.com": "iGlobal Stores",
    "zonos.com": "iGlobal Stores",
    "zprk.io": "Near Pte. Ltd.",
    "zimg.jp": "Zucks,Inc.",
    "zucks.net": "Zucks,Inc.",
    "mediavoice.com": "Polar",
    "plrsrvcs.com": "Polar",
    "polarcdn-pentos.com": "Polar",
    "polarcdn-terrax.com": "Polar",
    "polarcdn.com": "Polar",
    "searchanise.com": "Searchanise",
    "webclicks24.com": "webclicks24.com",
    "ihs.com": "Markit Group Limited",
    "ihsmarkit.com": "Markit Group Limited",
    "janes.com": "Markit Group Limited",
    "markitondemand.com": "Markit Group Limited",
    "wallst.com": "Markit Group Limited",
    "wsod.com": "Markit Group Limited",
    "wsodcdn.com": "Markit Group Limited",
    "wsoddata.com": "Markit Group Limited",
    "zoominfo.com": "Zoom Information, Inc.",
    "gov.bc.ca": "Government of the Province of British Columbia",
    "healthlinkbc.ca": "Government of the Province of British Columbia",
    "680news.com": "Rogers Communications Inc.",
    "chatelaine.com": "Rogers Communications Inc.",
    "citynews1130.com": "Rogers Communications Inc.",
    "fido.ca": "Rogers Communications Inc.",
    "macleans.ca": "Rogers Communications Inc.",
    "moneysense.ca": "Rogers Communications Inc.",
    "rogers.com": "Rogers Communications Inc.",
    "rogersdigitalmedia.com": "Rogers Communications Inc.",
    "rogersmedia.com": "Rogers Communications Inc.",
    "sportsnet.ca": "Rogers Communications Inc.",
    "thegrandslamofcurling.com": "Rogers Communications Inc.",
    "theshoppingchannel.com": "Rogers Communications Inc.",
    "todaysparent.com": "Rogers Communications Inc.",
    "rollbar.com": "Rollbar, Inc.",
    "thestar.com": "Toronto Star Newspapers Ltd.",
    "jennair.com": "Whirlpool Corporation",
    "kitchenaid.com": "Whirlpool Corporation",
    "kitchenaid.de": "Whirlpool Corporation",
    "maytag.com": "Whirlpool Corporation",
    "whirlpool.com": "Whirlpool Corporation",
    "adbutter.net": "Gamned SAS",
    "admeira.ch": "Admeira Broadcast AG",
    "admin.ch": "Bundesamt für Informatik und Telekommunikation BIT",
    "ch.ch": "Schweizerische Bundeskanzlei",
    "getback.ch": "adfocus GmbH",
    "guuru.com": "Guuru",
    "1and1.com": "United Internet AG",
    "1and1.fr": "United Internet AG",
    "1und1.de": "United Internet AG",
    "gmx.at": "United Internet AG",
    "gmx.ch": "United Internet AG",
    "gmx.com": "United Internet AG",
    "gmx.fr": "United Internet AG",
    "gmx.net": "United Internet AG",
    "ionos.com": "United Internet AG",
    "log-in-web.de": "United Internet AG",
    "mail.com": "United Internet AG",
    "profiseller.de": "United Internet AG",
    "sedo.com": "United Internet AG",
    "static-1and1.com": "United Internet AG",
    "tifbs.net": "United Internet AG",
    "ui-portal.com": "United Internet AG",
    "ui-portal.de": "United Internet AG",
    "uicdn.com": "United Internet AG",
    "uicdn.net": "United Internet AG",
    "uimserv.net": "United Internet AG",
    "web.de": "United Internet AG",
    "usemax.de": "Emego GmbH",
    "usemaxserver.de": "Emego GmbH",
    "visx.net": "YOC AG",
    "ausgezeichnet.org": "AUBII GmbH",
    "fiduciagad.de": "FIDUCIA & GAD IT AG",
    "meine-bankid.de": "FIDUCIA & GAD IT AG",
    "idealo.com": "Idealo Internet GmbH",
    "idealo.fr": "Idealo Internet GmbH",
    "idealo.net": "Idealo Internet GmbH",
    "bafa.de": "Informationstechnikzentrum Bund (ITZBund)",
    "bamf.de": "Informationstechnikzentrum Bund (ITZBund)",
    "bka.de": "Informationstechnikzentrum Bund (ITZBund)",
    "bmjv.de": "Informationstechnikzentrum Bund (ITZBund)",
    "bund.de": "Informationstechnikzentrum Bund (ITZBund)",
    "destatis.de": "Informationstechnikzentrum Bund (ITZBund)",
    "formulare-bfinv.de": "Informationstechnikzentrum Bund (ITZBund)",
    "itzbund.de": "Informationstechnikzentrum Bund (ITZBund)",
    "zoll.de": "Informationstechnikzentrum Bund (ITZBund)",
    "dynamic-tracking.com": "Dynamic 1001 GmbH",
    "dynamic1001.com": "Dynamic 1001 GmbH",
    "dyntracker.com": "Dynamic 1001 GmbH",
    "media01.eu": "Dynamic 1001 GmbH",
    "nexx.cloud": "nexx.tv GmbH",
    "provenexpert.com": "Expert Systems AG",
    "avm.de": "AVM Computersysteme Vertriebs GmbH",
    "myfritz.net": "AVM Computersysteme Vertriebs GmbH",
    "twiago.com": "twiago GmbH",
    "bern.ch": "SwissSign AG",
    "mailbox.org": "SwissSign AG",
    "swisslos.ch": "SwissSign AG",
    "toppreise.ch": "SwissSign AG",
    "werk21system.de": "SwissSign AG",
    "admo.tv": "Clickon",
    "affilae.com": "AETIUM",
    "elitrack.com": "Elitrack SAS",
    "framasoft.org": "Alexis Kauffmann",
    "leadsmonitor.io": "REEPERF",
    "logbor.com": "Public-Id&Atilde;&copy;es SA",
    "heias.com": "TradeDoubler AB",
    "tradedoubler.com": "TradeDoubler AB",
    "third-party.site": "Test Site for Tracker Blocking",
    "do-not-tracker.org": "EFF Test Trackers",
    "eviltracker.net": "EFF Test Trackers",
    "trackersimulator.org": "EFF Test Trackers"
  };

  /* global cloneInto, exportFunction, false */

  // Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox
  // eslint-disable-next-line no-global-assign
  let globalObj = typeof window === 'undefined' ? globalThis : window;
  let Error$1 = globalObj.Error;

  function getDataKeySync (sessionKey, domainKey, inputData) {
      // eslint-disable-next-line new-cap
      const hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(sessionKey + domainKey), sjcl.hash.sha256);
      return sjcl.codec.hex.fromBits(hmac.encrypt(inputData))
  }

  // linear feedback shift register to find a random approximation
  function nextRandom (v) {
      return Math.abs((v >> 1) | (((v << 62) ^ (v << 61)) & (~(~0 << 63) << 62)))
  }

  const exemptionLists = {};
  function shouldExemptUrl (type, url) {
      for (const regex of exemptionLists[type]) {
          if (regex.test(url)) {
              return true
          }
      }
      return false
  }

  let debug = false;

  function initStringExemptionLists (args) {
      const { stringExemptionLists } = args;
      debug = args.debug;
      for (const type in stringExemptionLists) {
          exemptionLists[type] = [];
          for (const stringExemption of stringExemptionLists[type]) {
              exemptionLists[type].push(new RegExp(stringExemption));
          }
      }
  }

  /**
   * Best guess effort if the document is being framed
   * @returns {boolean} if we infer the document is framed
   */
  function isBeingFramed () {
      if ('ancestorOrigins' in globalThis.location) {
          return globalThis.location.ancestorOrigins.length > 0
      }
      // @ts-ignore types do overlap whilst in DOM context
      return globalThis.top !== globalThis
  }

  /**
   * Best guess effort if the document is third party
   * @returns {boolean} if we infer the document is third party
   */
  function isThirdParty () {
      if (!isBeingFramed()) {
          return false
      }
      return !matchHostname(globalThis.location.hostname, getTabOrigin())
  }

  /**
   * Best guess effort of the tabs origin
   * @returns {string|null} inferred tab origin
   */
  function getTabOrigin () {
      let framingOrigin = null;
      try {
          framingOrigin = globalThis.top.location.href;
      } catch {
          framingOrigin = globalThis.document.referrer;
      }

      // Not supported in Firefox
      if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
          // ancestorOrigins is reverse order, with the last item being the top frame
          framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
      }

      try {
          framingOrigin = new URL(framingOrigin).hostname;
      } catch {
          framingOrigin = null;
      }
      return framingOrigin
  }

  /**
   * Lifted from privacy grade repo. Checks entity data and tries to find an owner for the domain.
   *
   * @param {object} requestData - Object consinting siteUrlSplit which is an array of domain components
   * @returns 
   */
  function findWebsiteOwner (requestData) {
      // find the site owner
      const siteUrlList = Array.from(requestData.siteUrlSplit);

      while (siteUrlList.length > 1) {
          const siteToCheck = siteUrlList.join('.');
          siteUrlList.shift();

          if (entities[siteToCheck]) {
              return entities[siteToCheck]
          }
      }
  }

  /**
   * Tests whether the two URL's belong to the same
   * top level domain.
   */
  function isSameTopLevelDomain (url1, url2) {
      const first = parse_1(url1, { allowPrivateDomains: true });
      const second = parse_1(url2, { allowPrivateDomains: true });

      const firstDomain = first.domain === null ? first.hostname : first.domain;
      const secondDomain = first.domain === null ? second.hostname : second.domain;

      return firstDomain === secondDomain
  }

  /**
   * Returns true if hostname is a subset of exceptionDomain or an exact match.
   * @param {string} hostname
   * @param {string} exceptionDomain
   * @returns {boolean}
   */
  function matchHostname (hostname, exceptionDomain) {
      if (isSameTopLevelDomain(hostname, exceptionDomain)) {
          return true
      }

      const hostnameOwner = findWebsiteOwner({ siteUrlSplit: hostname.split('.') });
      const exceptionOwner = findWebsiteOwner({ siteUrlSplit: exceptionDomain.split('.') });

      return (hostnameOwner && exceptionOwner) ? hostnameOwner === exceptionOwner : false
  }

  const lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/;
  function getStackTraceUrls (stack) {
      const urls = new Set();
      try {
          const errorLines = stack.split('\n');
          // Should cater for Chrome and Firefox stacks, we only care about https? resources.
          for (const line of errorLines) {
              const res = line.match(lineTest);
              if (res) {
                  urls.add(new URL(res[2], location.href));
              }
          }
      } catch (e) {
          // Fall through
      }
      return urls
  }

  function getStackTraceOrigins (stack) {
      const urls = getStackTraceUrls(stack);
      const origins = new Set();
      for (const url of urls) {
          origins.add(url.hostname);
      }
      return origins
  }

  // Checks the stack trace if there are known libraries that are broken.
  function shouldExemptMethod (type) {
      // Short circuit stack tracing if we don't have checks
      if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
          return false
      }
      const stack = getStack();
      const errorFiles = getStackTraceUrls(stack);
      for (const path of errorFiles) {
          if (shouldExemptUrl(type, path.href)) {
              return true
          }
      }
      return false
  }

  // Iterate through the key, passing an item index and a byte to be modified
  function iterateDataKey (key, callback) {
      let item = key.charCodeAt(0);
      for (const i in key) {
          let byte = key.charCodeAt(i);
          for (let j = 8; j >= 0; j--) {
              const res = callback(item, byte);
              // Exit early if callback returns null
              if (res === null) {
                  return
              }

              // find next item to perturb
              item = nextRandom(item);

              // Right shift as we use the least significant bit of it
              byte = byte >> 1;
          }
      }
  }

  function isFeatureBroken (args, feature) {
      return args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature)
  }

  /**
   * For each property defined on the object, update it with the target value.
   */
  function overrideProperty (name, prop) {
      // Don't update if existing value is undefined or null
      if (!(prop.origValue === undefined)) {
          /**
           * When re-defining properties, we bind the overwritten functions to null. This prevents
           * sites from using toString to see if the function has been overwritten
           * without this bind call, a site could run something like
           * `Object.getOwnPropertyDescriptor(Screen.prototype, "availTop").get.toString()` and see
           * the contents of the function. Appending .bind(null) to the function definition will
           * have the same toString call return the default [native code]
           */
          try {
              defineProperty(prop.object, name, {
                  // eslint-disable-next-line no-extra-bind
                  get: (() => prop.targetValue).bind(null)
              });
          } catch (e) {
          }
      }
      return prop.origValue
  }

  function defineProperty (object, propertyName, descriptor) {
      {
          Object.defineProperty(object, propertyName, descriptor);
      }
  }

  function camelcase (dashCaseText) {
      return dashCaseText.replace(/-(.)/g, (match, letter) => {
          return letter.toUpperCase()
      })
  }

  /**
   * @param {string} featureName
   * @param {object} args
   * @param {string} prop
   * @returns {any}
   */
  function getFeatureSetting (featureName, args, prop) {
      const camelFeatureName = camelcase(featureName);
      return args.featureSettings?.[camelFeatureName]?.[prop]
  }

  /**
   * @param {string} featureName
   * @param {object} args
   * @param {string} prop
   * @returns {boolean}
   */
  function getFeatureSettingEnabled (featureName, args, prop) {
      const result = getFeatureSetting(featureName, args, prop);
      return result === 'enabled'
  }

  function getStack () {
      return new Error$1().stack
  }

  /**
   * @template {object} P
   * @typedef {object} ProxyObject<P>
   * @property {(target?: object, thisArg?: P, args?: object) => void} apply
   */

  /**
   * @template [P=object]
   */
  class DDGProxy {
      /**
       * @param {string} featureName
       * @param {P} objectScope
       * @param {string} property
       * @param {ProxyObject<P>} proxyObject
       */
      constructor (featureName, objectScope, property, proxyObject) {
          this.objectScope = objectScope;
          this.property = property;
          this.featureName = featureName;
          this.camelFeatureName = camelcase(this.featureName);
          const outputHandler = (...args) => {
              const isExempt = shouldExemptMethod(this.camelFeatureName);
              if (debug) {
                  postDebugMessage(this.camelFeatureName, {
                      action: isExempt ? 'ignore' : 'restrict',
                      kind: this.property,
                      documentUrl: document.location.href,
                      stack: getStack(),
                      args: JSON.stringify(args[2])
                  });
              }
              // The normal return value
              if (isExempt) {
                  return DDGReflect.apply(...args)
              }
              return proxyObject.apply(...args)
          };
          {
              this._native = objectScope[property];
              const handler = {};
              handler.apply = outputHandler;
              this.internal = new globalObj.Proxy(objectScope[property], handler);
          }
      }

      // Actually apply the proxy to the native property
      overload () {
          {
              this.objectScope[this.property] = this.internal;
          }
      }
  }

  function postDebugMessage (feature, message) {
      if (message.stack) {
          const scriptOrigins = [...getStackTraceOrigins(message.stack)];
          message.scriptOrigins = scriptOrigins;
      }
      globalObj.postMessage({
          action: feature,
          message
      });
  }

  let DDGReflect;
  let DDGPromise;

  // Exports for usage where we have to cross the xray boundary: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
  {
      DDGPromise = globalObj.Promise;
      DDGReflect = globalObj.Reflect;
  }

  function __variableDynamicImportRuntime0__(path) {
     switch (path) {
       case './features/cookie.js': return Promise.resolve().then(function () { return cookie; });
       case './features/fingerprinting-audio.js': return Promise.resolve().then(function () { return fingerprintingAudio; });
       case './features/fingerprinting-battery.js': return Promise.resolve().then(function () { return fingerprintingBattery; });
       case './features/fingerprinting-canvas.js': return Promise.resolve().then(function () { return fingerprintingCanvas; });
       case './features/fingerprinting-hardware.js': return Promise.resolve().then(function () { return fingerprintingHardware; });
       case './features/fingerprinting-screen-size.js': return Promise.resolve().then(function () { return fingerprintingScreenSize; });
       case './features/fingerprinting-temporary-storage.js': return Promise.resolve().then(function () { return fingerprintingTemporaryStorage; });
       case './features/google-rejected.js': return Promise.resolve().then(function () { return googleRejected; });
       case './features/gpc.js': return Promise.resolve().then(function () { return gpc; });
       case './features/navigator-interface.js': return Promise.resolve().then(function () { return navigatorInterface; });
       case './features/referrer.js': return Promise.resolve().then(function () { return referrer; });
       case './features/web-compat.js': return Promise.resolve().then(function () { return webCompat; });
       default: return Promise.reject(new Error("Unknown variable dynamic import: " + path));
     }
   }

  function shouldRun () {
      // don't inject into non-HTML documents (such as XML documents)
      // but do inject into XHTML documents
      if (document instanceof HTMLDocument === false && (
          document instanceof XMLDocument === false ||
          document.createElement('div') instanceof HTMLDivElement === false
      )) {
          return false
      }
      return true
  }

  let initArgs = null;
  const updates = [];
  const features = [];

  async function load$1 () {
      if (!shouldRun()) {
          return
      }
      const featureNames = [
          'webCompat',
          'fingerprintingAudio',
          'fingerprintingBattery',
          'fingerprintingCanvas',
          'cookie',
          'googleRejected',
          'gpc',
          'fingerprintingHardware',
          'referrer',
          'fingerprintingScreenSize',
          'fingerprintingTemporaryStorage',
          'navigatorInterface'
      ];

      for (const featureName of featureNames) {
          const filename = featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase();
          const feature = __variableDynamicImportRuntime0__(`./features/${filename}.js`).then(({ init, load, update }) => {
              if (load) {
                  load();
              }
              return { featureName, init, update }
          });
          features.push(feature);
      }
  }

  async function init$c (args) {
      initArgs = args;
      if (!shouldRun()) {
          return
      }
      initStringExemptionLists(args);
      const resolvedFeatures = await Promise.all(features);
      resolvedFeatures.forEach(({ init, featureName }) => {
          if (!isFeatureBroken(args, featureName)) {
              init(args);
          }
      });
      // Fire off updates that came in faster than the init
      while (updates.length) {
          const update = updates.pop();
          await updateFeaturesInner(update);
      }
  }

  async function update$1 (args) {
      if (!shouldRun()) {
          return
      }
      if (initArgs === null) {
          updates.push(args);
          return
      }
      updateFeaturesInner(args);
  }

  async function updateFeaturesInner (args) {
      const resolvedFeatures = await Promise.all(features);
      resolvedFeatures.forEach(({ update, featureName }) => {
          if (!isFeatureBroken(initArgs, featureName) && update) {
              update(args);
          }
      });
  }

  class Cookie {
      constructor (cookieString) {
          this.parts = cookieString.split(';');
          this.parse();
      }

      parse () {
          const EXTRACT_ATTRIBUTES = new Set(['max-age', 'expires', 'domain']);
          this.attrIdx = {};
          this.parts.forEach((part, index) => {
              const kv = part.split('=', 1);
              const attribute = kv[0].trim();
              const value = part.slice(kv[0].length + 1);
              if (index === 0) {
                  this.name = attribute;
                  this.value = value;
              } else if (EXTRACT_ATTRIBUTES.has(attribute.toLowerCase())) {
                  this[attribute.toLowerCase()] = value;
                  this.attrIdx[attribute.toLowerCase()] = index;
              }
          });
      }

      getExpiry () {
          // @ts-ignore
          if (!this.maxAge && !this.expires) {
              return NaN
          }
          const expiry = this.maxAge
              ? parseInt(this.maxAge)
              // @ts-ignore
              : (new Date(this.expires) - new Date()) / 1000;
          return expiry
      }

      get maxAge () {
          return this['max-age']
      }

      set maxAge (value) {
          if (this.attrIdx['max-age'] > 0) {
              this.parts.splice(this.attrIdx['max-age'], 1, `max-age=${value}`);
          } else {
              this.parts.push(`max-age=${value}`);
          }
          this.parse();
      }

      toString () {
          return this.parts.join(';')
      }
  }

  /* eslint-disable quote-props */
  /* eslint-disable quotes */
  /* eslint-disable indent */
  /* eslint-disable eol-last */
  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-multiple-empty-lines */
      const exceptions = [
    {
      "domain": "nespresso.com",
      "reason": "login issues"
    },
    {
      "domain": "teams.microsoft.com",
      "reason": "broken login: https://github.com/duckduckgo/privacy-configuration/issues/242"
    },
    {
      "domain": "start.me",
      "reason": "broken login: https://github.com/duckduckgo/privacy-configuration/issues/245"
    }
  ];
      const excludedCookieDomains = [
    {
      "domain": "hangouts.google.com",
      "reason": "Site breakage"
    },
    {
      "domain": "docs.google.com",
      "reason": "Site breakage"
    },
    {
      "domain": "accounts.google.com",
      "reason": "SSO which needs cookies for auth"
    },
    {
      "domain": "googleapis.com",
      "reason": "Site breakage"
    },
    {
      "domain": "login.live.com",
      "reason": "SSO which needs cookies for auth"
    },
    {
      "domain": "apis.google.com",
      "reason": "Site breakage"
    },
    {
      "domain": "pay.google.com",
      "reason": "Site breakage"
    },
    {
      "domain": "payments.amazon.com",
      "reason": "Site breakage"
    },
    {
      "domain": "payments.amazon.de",
      "reason": "Site breakage"
    },
    {
      "domain": "atlassian.net",
      "reason": "Site breakage"
    },
    {
      "domain": "atlassian.com",
      "reason": "Site breakage"
    },
    {
      "domain": "paypal.com",
      "reason": "Site breakage"
    },
    {
      "domain": "paypal.com",
      "reason": "site breakage"
    },
    {
      "domain": "salesforce.com",
      "reason": "Site breakage"
    },
    {
      "domain": "salesforceliveagent.com",
      "reason": "Site breakage"
    },
    {
      "domain": "force.com",
      "reason": "Site breakage"
    },
    {
      "domain": "disqus.com",
      "reason": "Site breakage"
    },
    {
      "domain": "spotify.com",
      "reason": "Site breakage"
    },
    {
      "domain": "hangouts.google.com",
      "reason": "site breakage"
    },
    {
      "domain": "docs.google.com",
      "reason": "site breakage"
    },
    {
      "domain": "btsport-utils-prod.akamaized.net",
      "reason": "broken videos"
    }
  ];

  let protectionExempted = true;
  const tabOrigin = getTabOrigin();
  let tabExempted = true;

  if (tabOrigin != null) {
      tabExempted = exceptions.some((exception) => {
          return matchHostname(tabOrigin, exception.domain)
      });
  }
  const frameExempted = excludedCookieDomains.some((exception) => {
      return matchHostname(globalThis.location.hostname, exception.domain)
  });
  protectionExempted = frameExempted || tabExempted;

  // Initial cookie policy pre init
  let cookiePolicy = {
      debug: false,
      isFrame: isBeingFramed(),
      isTracker: false,
      shouldBlock: !protectionExempted,
      shouldBlockTrackerCookie: true,
      shouldBlockNonTrackerCookie: true,
      isThirdParty: isThirdParty(),
      tabRegisteredDomain: tabOrigin,
      policy: {
          threshold: 864000, // 10 days
          maxAge: 864000 // 10 days
      }
  };

  let loadedPolicyResolve;
  // Listen for a message from the content script which will configure the policy for this context
  const trackerHosts = new Set();

  /**
   * @param {'ignore' | 'block' | 'restrict'} action
   * @param {string} reason
   * @param {any} ctx
   */
  function debugHelper (action, reason, ctx) {
      cookiePolicy.debug && postDebugMessage('jscookie', {
          action,
          reason,
          stack: ctx.stack,
          documentUrl: globalThis.document.location.href,
          scriptOrigins: [...ctx.scriptOrigins],
          value: ctx.value
      });
  }

  function shouldBlockTrackingCookie () {
      return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockTrackerCookie && isTrackingCookie()
  }

  function shouldBlockNonTrackingCookie () {
      return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockNonTrackerCookie && isNonTrackingCookie()
  }

  function isTrackingCookie () {
      return cookiePolicy.isFrame && cookiePolicy.isTracker && cookiePolicy.isThirdParty
  }

  function isNonTrackingCookie () {
      return cookiePolicy.isFrame && !cookiePolicy.isTracker && cookiePolicy.isThirdParty
  }

  function load (args) {
      trackerHosts.clear();

      // The cookie policy is injected into every frame immediately so that no cookie will
      // be missed.
      const document = globalThis.document;
      const cookieSetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').set;
      const cookieGetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').get;

      const loadPolicy = new Promise((resolve) => {
          loadedPolicyResolve = resolve;
      });
      // Create the then callback now - this ensures that Promise.prototype.then changes won't break
      // this call.
      const loadPolicyThen = loadPolicy.then.bind(loadPolicy);

      function getCookiePolicy () {
          const stack = getStack();
          const scriptOrigins = getStackTraceOrigins(stack);
          const getCookieContext = {
              stack,
              scriptOrigins,
              value: 'getter'
          };

          if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
              debugHelper('block', '3p frame', getCookieContext);
              return ''
          } else if (isTrackingCookie() || isNonTrackingCookie()) {
              debugHelper('ignore', '3p frame', getCookieContext);
          }
          return cookieGetter.call(document)
      }

      function setCookiePolicy (value) {
          const stack = getStack();
          const scriptOrigins = getStackTraceOrigins(stack);
          const setCookieContext = {
              stack,
              scriptOrigins,
              value
          };

          if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
              debugHelper('block', '3p frame', setCookieContext);
              return
          } else if (isTrackingCookie() || isNonTrackingCookie()) {
              debugHelper('ignore', '3p frame', setCookieContext);
          }
          // call the native document.cookie implementation. This will set the cookie immediately
          // if the value is valid. We will override this set later if the policy dictates that
          // the expiry should be changed.
          cookieSetter.call(document, value);

          try {
              // wait for config before doing same-site tests
              loadPolicyThen(() => {
                  const { shouldBlock, tabRegisteredDomain, policy, isTrackerFrame } = cookiePolicy;

                  if (!tabRegisteredDomain || !shouldBlock) {
                      // no site domain for this site to test against, abort
                      debugHelper('ignore', 'disabled', setCookieContext);
                      return
                  }
                  const sameSiteScript = [...scriptOrigins].every((host) => matchHostname(host, tabRegisteredDomain));
                  if (sameSiteScript) {
                      // cookies set by scripts loaded on the same site as the site are not modified
                      debugHelper('ignore', '1p sameSite', setCookieContext);
                      return
                  }
                  const trackerScript = [...scriptOrigins].some((host) => trackerHosts.has(host));
                  if (!trackerScript && !isTrackerFrame) {
                      debugHelper('ignore', '1p non-tracker', setCookieContext);
                      return
                  }
                  // extract cookie expiry from cookie string
                  const cookie = new Cookie(value);
                  // apply cookie policy
                  if (cookie.getExpiry() > policy.threshold) {
                      // check if the cookie still exists
                      if (document.cookie.split(';').findIndex(kv => kv.trim().startsWith(cookie.parts[0].trim())) !== -1) {
                          cookie.maxAge = policy.maxAge;

                          debugHelper('restrict', 'tracker', scriptOrigins);

                          cookieSetter.apply(document, [cookie.toString()]);
                      } else {
                          debugHelper('ignore', 'dissappeared', setCookieContext);
                      }
                  } else {
                      debugHelper('ignore', 'expiry', setCookieContext);
                  }
              });
          } catch (e) {
              debugHelper('ignore', 'error', setCookieContext);
              // suppress error in cookie override to avoid breakage
              console.warn('Error in cookie override', e);
          }
      }

      defineProperty(document, 'cookie', {
          configurable: true,
          set: setCookiePolicy,
          get: getCookiePolicy
      });
  }

  function init$b (args) {
      args.cookie.debug = args.debug;
      cookiePolicy = args.cookie;

      const featureName = 'cookie';
      cookiePolicy.shouldBlockTrackerCookie = getFeatureSettingEnabled(featureName, args, 'trackerCookie');
      cookiePolicy.shouldBlockNonTrackerCookie = getFeatureSettingEnabled(featureName, args, 'nonTrackerCookie');
      const policy = getFeatureSetting(featureName, args, 'firstPartyTrackerCookiePolicy');
      if (policy) {
          cookiePolicy.policy = policy;
      }

      loadedPolicyResolve();
  }

  function update (args) {
      if (args.trackerDefinition) {
          trackerHosts.add(args.hostname);
      }
  }

  var cookie = /*#__PURE__*/Object.freeze({
    __proto__: null,
    load: load,
    init: init$b,
    update: update
  });

  function init$a (args) {
      const { sessionKey, site } = args;
      const domainKey = site.domain;
      const featureName = 'fingerprinting-audio';

      // In place modify array data to remove fingerprinting
      function transformArrayData (channelData, domainKey, sessionKey, thisArg) {
          let { audioKey } = getCachedResponse(thisArg, args);
          if (!audioKey) {
              let cdSum = 0;
              for (const k in channelData) {
                  cdSum += channelData[k];
              }
              // If the buffer is blank, skip adding data
              if (cdSum === 0) {
                  return
              }
              audioKey = getDataKeySync(sessionKey, domainKey, cdSum);
              setCache(thisArg, args, audioKey);
          }
          iterateDataKey(audioKey, (item, byte) => {
              const itemAudioIndex = item % channelData.length;

              let factor = byte * 0.0000001;
              if (byte ^ 0x1) {
                  factor = 0 - factor;
              }
              channelData[itemAudioIndex] = channelData[itemAudioIndex] + factor;
          });
      }

      const copyFromChannelProxy = new DDGProxy(featureName, AudioBuffer.prototype, 'copyFromChannel', {
          apply (target, thisArg, args) {
              const [source, channelNumber, startInChannel] = args;
              // This is implemented in a different way to canvas purely because calling the function copied the original value, which is not ideal
              if (// If channelNumber is longer than arrayBuffer number of channels then call the default method to throw
                  channelNumber > thisArg.numberOfChannels ||
                  // If startInChannel is longer than the arrayBuffer length then call the default method to throw
                  startInChannel > thisArg.length) {
                  // The normal return value
                  return DDGReflect.apply(target, thisArg, args)
              }
              try {
                  // Call the protected getChannelData we implement, slice from the startInChannel value and assign to the source array
                  thisArg.getChannelData(channelNumber).slice(startInChannel).forEach((val, index) => {
                      source[index] = val;
                  });
              } catch {
                  return DDGReflect.apply(target, thisArg, args)
              }
          }
      });
      copyFromChannelProxy.overload();

      const cacheExpiry = 60;
      const cacheData = new WeakMap();
      function getCachedResponse (thisArg, args) {
          const data = cacheData.get(thisArg);
          const timeNow = Date.now();
          if (data &&
              data.args === JSON.stringify(args) &&
              data.expires > timeNow) {
              data.expires = timeNow + cacheExpiry;
              cacheData.set(thisArg, data);
              return data
          }
          return { audioKey: null }
      }

      function setCache (thisArg, args, audioKey) {
          cacheData.set(thisArg, { args: JSON.stringify(args), expires: Date.now() + cacheExpiry, audioKey });
      }

      const getChannelDataProxy = new DDGProxy(featureName, AudioBuffer.prototype, 'getChannelData', {
          apply (target, thisArg, args) {
              // The normal return value
              const channelData = DDGReflect.apply(target, thisArg, args);
              // Anything we do here should be caught and ignored silently
              try {
                  transformArrayData(channelData, domainKey, sessionKey, thisArg, args);
              } catch {
              }
              return channelData
          }
      });
      getChannelDataProxy.overload();

      const audioMethods = ['getByteTimeDomainData', 'getFloatTimeDomainData', 'getByteFrequencyData', 'getFloatFrequencyData'];
      for (const methodName of audioMethods) {
          const proxy = new DDGProxy(featureName, AnalyserNode.prototype, methodName, {
              apply (target, thisArg, args) {
                  DDGReflect.apply(target, thisArg, args);
                  // Anything we do here should be caught and ignored silently
                  try {
                      transformArrayData(args[0], domainKey, sessionKey, thisArg, args);
                  } catch {
                  }
              }
          });
          proxy.overload();
      }
  }

  var fingerprintingAudio = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$a
  });

  /**
   * Overwrites the Battery API if present in the browser.
   * It will return the values defined in the getBattery function to the client,
   * as well as prevent any script from listening to events.
   */
  function init$9 (args) {
      if (globalThis.navigator.getBattery) {
          const BatteryManager = globalThis.BatteryManager;

          const spoofedValues = {
              charging: true,
              chargingTime: 0,
              dischargingTime: Infinity,
              level: 1
          };
          const eventProperties = ['onchargingchange', 'onchargingtimechange', 'ondischargingtimechange', 'onlevelchange'];

          for (const [prop, val] of Object.entries(spoofedValues)) {
              try {
                  defineProperty(BatteryManager.prototype, prop, { get: () => val });
              } catch (e) { }
          }
          for (const eventProp of eventProperties) {
              try {
                  defineProperty(BatteryManager.prototype, eventProp, { get: () => null });
              } catch (e) { }
          }
      }
  }

  var fingerprintingBattery = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$9
  });

  var alea$1 = {exports: {}};

  (function (module) {
  // A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
  // http://baagoe.com/en/RandomMusings/javascript/
  // https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
  // Original work is under MIT license -

  // Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
  //
  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included in
  // all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  // THE SOFTWARE.



  (function(global, module, define) {

  function Alea(seed) {
    var me = this, mash = Mash();

    me.next = function() {
      var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
      me.s0 = me.s1;
      me.s1 = me.s2;
      return me.s2 = t - (me.c = t | 0);
    };

    // Apply the seeding algorithm from Baagoe.
    me.c = 1;
    me.s0 = mash(' ');
    me.s1 = mash(' ');
    me.s2 = mash(' ');
    me.s0 -= mash(seed);
    if (me.s0 < 0) { me.s0 += 1; }
    me.s1 -= mash(seed);
    if (me.s1 < 0) { me.s1 += 1; }
    me.s2 -= mash(seed);
    if (me.s2 < 0) { me.s2 += 1; }
    mash = null;
  }

  function copy(f, t) {
    t.c = f.c;
    t.s0 = f.s0;
    t.s1 = f.s1;
    t.s2 = f.s2;
    return t;
  }

  function impl(seed, opts) {
    var xg = new Alea(seed),
        state = opts && opts.state,
        prng = xg.next;
    prng.int32 = function() { return (xg.next() * 0x100000000) | 0; };
    prng.double = function() {
      return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    prng.quick = prng;
    if (state) {
      if (typeof(state) == 'object') copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
      data = String(data);
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    return mash;
  }


  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.alea = impl;
  }

  })(
    commonjsGlobal,
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(alea$1));

  var xor128$1 = {exports: {}};

  (function (module) {
  // A Javascript implementaion of the "xor128" prng algorithm by
  // George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

  (function(global, module, define) {

  function XorGen(seed) {
    var me = this, strseed = '';

    me.x = 0;
    me.y = 0;
    me.z = 0;
    me.w = 0;

    // Set up generator function.
    me.next = function() {
      var t = me.x ^ (me.x << 11);
      me.x = me.y;
      me.y = me.z;
      me.z = me.w;
      return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
    };

    if (seed === (seed | 0)) {
      // Integer seed.
      me.x = seed;
    } else {
      // String seed.
      strseed += seed;
    }

    // Mix in string seed, then discard an initial batch of 64 values.
    for (var k = 0; k < strseed.length + 64; k++) {
      me.x ^= strseed.charCodeAt(k) | 0;
      me.next();
    }
  }

  function copy(f, t) {
    t.x = f.x;
    t.y = f.y;
    t.z = f.z;
    t.w = f.w;
    return t;
  }

  function impl(seed, opts) {
    var xg = new XorGen(seed),
        state = opts && opts.state,
        prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    prng.double = function() {
      do {
        var top = xg.next() >>> 11,
            bot = (xg.next() >>> 0) / 0x100000000,
            result = (top + bot) / (1 << 21);
      } while (result === 0);
      return result;
    };
    prng.int32 = xg.next;
    prng.quick = prng;
    if (state) {
      if (typeof(state) == 'object') copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.xor128 = impl;
  }

  })(
    commonjsGlobal,
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(xor128$1));

  var xorwow$1 = {exports: {}};

  (function (module) {
  // A Javascript implementaion of the "xorwow" prng algorithm by
  // George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

  (function(global, module, define) {

  function XorGen(seed) {
    var me = this, strseed = '';

    // Set up generator function.
    me.next = function() {
      var t = (me.x ^ (me.x >>> 2));
      me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
      return (me.d = (me.d + 362437 | 0)) +
         (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
    };

    me.x = 0;
    me.y = 0;
    me.z = 0;
    me.w = 0;
    me.v = 0;

    if (seed === (seed | 0)) {
      // Integer seed.
      me.x = seed;
    } else {
      // String seed.
      strseed += seed;
    }

    // Mix in string seed, then discard an initial batch of 64 values.
    for (var k = 0; k < strseed.length + 64; k++) {
      me.x ^= strseed.charCodeAt(k) | 0;
      if (k == strseed.length) {
        me.d = me.x << 10 ^ me.x >>> 4;
      }
      me.next();
    }
  }

  function copy(f, t) {
    t.x = f.x;
    t.y = f.y;
    t.z = f.z;
    t.w = f.w;
    t.v = f.v;
    t.d = f.d;
    return t;
  }

  function impl(seed, opts) {
    var xg = new XorGen(seed),
        state = opts && opts.state,
        prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    prng.double = function() {
      do {
        var top = xg.next() >>> 11,
            bot = (xg.next() >>> 0) / 0x100000000,
            result = (top + bot) / (1 << 21);
      } while (result === 0);
      return result;
    };
    prng.int32 = xg.next;
    prng.quick = prng;
    if (state) {
      if (typeof(state) == 'object') copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.xorwow = impl;
  }

  })(
    commonjsGlobal,
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(xorwow$1));

  var xorshift7$1 = {exports: {}};

  (function (module) {
  // A Javascript implementaion of the "xorshift7" algorithm by
  // François Panneton and Pierre L'ecuyer:
  // "On the Xorgshift Random Number Generators"
  // http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

  (function(global, module, define) {

  function XorGen(seed) {
    var me = this;

    // Set up generator function.
    me.next = function() {
      // Update xor generator.
      var X = me.x, i = me.i, t, v;
      t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
      t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
      t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
      t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
      t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
      X[i] = v;
      me.i = (i + 1) & 7;
      return v;
    };

    function init(me, seed) {
      var j, X = [];

      if (seed === (seed | 0)) {
        // Seed state array using a 32-bit integer.
        X[0] = seed;
      } else {
        // Seed state using a string.
        seed = '' + seed;
        for (j = 0; j < seed.length; ++j) {
          X[j & 7] = (X[j & 7] << 15) ^
              (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
        }
      }
      // Enforce an array length of 8, not all zeroes.
      while (X.length < 8) X.push(0);
      for (j = 0; j < 8 && X[j] === 0; ++j);
      if (j == 8) X[7] = -1;

      me.x = X;
      me.i = 0;

      // Discard an initial 256 values.
      for (j = 256; j > 0; --j) {
        me.next();
      }
    }

    init(me, seed);
  }

  function copy(f, t) {
    t.x = f.x.slice();
    t.i = f.i;
    return t;
  }

  function impl(seed, opts) {
    if (seed == null) seed = +(new Date);
    var xg = new XorGen(seed),
        state = opts && opts.state,
        prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    prng.double = function() {
      do {
        var top = xg.next() >>> 11,
            bot = (xg.next() >>> 0) / 0x100000000,
            result = (top + bot) / (1 << 21);
      } while (result === 0);
      return result;
    };
    prng.int32 = xg.next;
    prng.quick = prng;
    if (state) {
      if (state.x) copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.xorshift7 = impl;
  }

  })(
    commonjsGlobal,
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(xorshift7$1));

  var xor4096$1 = {exports: {}};

  (function (module) {
  // A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
  //
  // This fast non-cryptographic random number generator is designed for
  // use in Monte-Carlo algorithms. It combines a long-period xorshift
  // generator with a Weyl generator, and it passes all common batteries
  // of stasticial tests for randomness while consuming only a few nanoseconds
  // for each prng generated.  For background on the generator, see Brent's
  // paper: "Some long-period random number generators using shifts and xors."
  // http://arxiv.org/pdf/1004.3115v1.pdf
  //
  // Usage:
  //
  // var xor4096 = require('xor4096');
  // random = xor4096(1);                        // Seed with int32 or string.
  // assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
  // assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
  //
  // For nonzero numeric keys, this impelementation provides a sequence
  // identical to that by Brent's xorgens 3 implementaion in C.  This
  // implementation also provides for initalizing the generator with
  // string seeds, or for saving and restoring the state of the generator.
  //
  // On Chrome, this prng benchmarks about 2.1 times slower than
  // Javascript's built-in Math.random().

  (function(global, module, define) {

  function XorGen(seed) {
    var me = this;

    // Set up generator function.
    me.next = function() {
      var w = me.w,
          X = me.X, i = me.i, t, v;
      // Update Weyl generator.
      me.w = w = (w + 0x61c88647) | 0;
      // Update xor generator.
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      // Update Xor generator array state.
      v = X[i] = v ^ t;
      me.i = i;
      // Result is the combination.
      return (v + (w ^ (w >>> 16))) | 0;
    };

    function init(me, seed) {
      var t, v, i, j, w, X = [], limit = 128;
      if (seed === (seed | 0)) {
        // Numeric seeds initialize v, which is used to generates X.
        v = seed;
        seed = null;
      } else {
        // String seeds are mixed into v and X one character at a time.
        seed = seed + '\0';
        v = 0;
        limit = Math.max(limit, seed.length);
      }
      // Initialize circular array and weyl value.
      for (i = 0, j = -32; j < limit; ++j) {
        // Put the unicode characters into the array, and shuffle them.
        if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
        // After 32 shuffles, take v as the starting w value.
        if (j === 0) w = v;
        v ^= v << 10;
        v ^= v >>> 15;
        v ^= v << 4;
        v ^= v >>> 13;
        if (j >= 0) {
          w = (w + 0x61c88647) | 0;     // Weyl.
          t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
          i = (0 == t) ? i + 1 : 0;     // Count zeroes.
        }
      }
      // We have detected all zeroes; make the key nonzero.
      if (i >= 128) {
        X[(seed && seed.length || 0) & 127] = -1;
      }
      // Run the generator 512 times to further mix the state before using it.
      // Factoring this as a function slows the main generator, so it is just
      // unrolled here.  The weyl generator is not advanced while warming up.
      i = 127;
      for (j = 4 * 128; j > 0; --j) {
        v = X[(i + 34) & 127];
        t = X[i = ((i + 1) & 127)];
        v ^= v << 13;
        t ^= t << 17;
        v ^= v >>> 15;
        t ^= t >>> 12;
        X[i] = v ^ t;
      }
      // Storing state as object members is faster than using closure variables.
      me.w = w;
      me.X = X;
      me.i = i;
    }

    init(me, seed);
  }

  function copy(f, t) {
    t.i = f.i;
    t.w = f.w;
    t.X = f.X.slice();
    return t;
  }
  function impl(seed, opts) {
    if (seed == null) seed = +(new Date);
    var xg = new XorGen(seed),
        state = opts && opts.state,
        prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    prng.double = function() {
      do {
        var top = xg.next() >>> 11,
            bot = (xg.next() >>> 0) / 0x100000000,
            result = (top + bot) / (1 << 21);
      } while (result === 0);
      return result;
    };
    prng.int32 = xg.next;
    prng.quick = prng;
    if (state) {
      if (state.X) copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.xor4096 = impl;
  }

  })(
    commonjsGlobal,                                     // window object or global
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(xor4096$1));

  var tychei$1 = {exports: {}};

  (function (module) {
  // A Javascript implementaion of the "Tyche-i" prng algorithm by
  // Samuel Neves and Filipe Araujo.
  // See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

  (function(global, module, define) {

  function XorGen(seed) {
    var me = this, strseed = '';

    // Set up generator function.
    me.next = function() {
      var b = me.b, c = me.c, d = me.d, a = me.a;
      b = (b << 25) ^ (b >>> 7) ^ c;
      c = (c - d) | 0;
      d = (d << 24) ^ (d >>> 8) ^ a;
      a = (a - b) | 0;
      me.b = b = (b << 20) ^ (b >>> 12) ^ c;
      me.c = c = (c - d) | 0;
      me.d = (d << 16) ^ (c >>> 16) ^ a;
      return me.a = (a - b) | 0;
    };

    /* The following is non-inverted tyche, which has better internal
     * bit diffusion, but which is about 25% slower than tyche-i in JS.
    me.next = function() {
      var a = me.a, b = me.b, c = me.c, d = me.d;
      a = (me.a + me.b | 0) >>> 0;
      d = me.d ^ a; d = d << 16 ^ d >>> 16;
      c = me.c + d | 0;
      b = me.b ^ c; b = b << 12 ^ d >>> 20;
      me.a = a = a + b | 0;
      d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
      me.c = c = c + d | 0;
      b = b ^ c;
      return me.b = (b << 7 ^ b >>> 25);
    }
    */

    me.a = 0;
    me.b = 0;
    me.c = 2654435769 | 0;
    me.d = 1367130551;

    if (seed === Math.floor(seed)) {
      // Integer seed.
      me.a = (seed / 0x100000000) | 0;
      me.b = seed | 0;
    } else {
      // String seed.
      strseed += seed;
    }

    // Mix in string seed, then discard an initial batch of 64 values.
    for (var k = 0; k < strseed.length + 20; k++) {
      me.b ^= strseed.charCodeAt(k) | 0;
      me.next();
    }
  }

  function copy(f, t) {
    t.a = f.a;
    t.b = f.b;
    t.c = f.c;
    t.d = f.d;
    return t;
  }
  function impl(seed, opts) {
    var xg = new XorGen(seed),
        state = opts && opts.state,
        prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    prng.double = function() {
      do {
        var top = xg.next() >>> 11,
            bot = (xg.next() >>> 0) / 0x100000000,
            result = (top + bot) / (1 << 21);
      } while (result === 0);
      return result;
    };
    prng.int32 = xg.next;
    prng.quick = prng;
    if (state) {
      if (typeof(state) == 'object') copy(state, xg);
      prng.state = function() { return copy(xg, {}); };
    }
    return prng;
  }

  if (module && module.exports) {
    module.exports = impl;
  } else if (define && define.amd) {
    define(function() { return impl; });
  } else {
    this.tychei = impl;
  }

  })(
    commonjsGlobal,
    module,    // present in node.js
    (typeof undefined) == 'function'    // present with an AMD loader
  );
  }(tychei$1));

  var seedrandom$1 = {exports: {}};

  /*
  Copyright 2019 David Bau.

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  */

  (function (module) {
  (function (global, pool, math) {
  //
  // The following constants are related to IEEE 754 limits.
  //

  var width = 256,        // each RC4 output is 0 <= x < 256
      chunks = 6,         // at least six RC4 outputs for each double
      digits = 52,        // there are 52 significant digits in a double
      rngname = 'random', // rngname: name for Math.random and Math.seedrandom
      startdenom = math.pow(width, chunks),
      significance = math.pow(2, digits),
      overflow = significance * 2,
      mask = width - 1,
      nodecrypto;         // node.js crypto module, initialized at the bottom.

  //
  // seedrandom()
  // This is the seedrandom function described above.
  //
  function seedrandom(seed, options, callback) {
    var key = [];
    options = (options == true) ? { entropy: true } : (options || {});

    // Flatten the seed string or build one from local entropy if needed.
    var shortseed = mixkey(flatten(
      options.entropy ? [seed, tostring(pool)] :
      (seed == null) ? autoseed() : seed, 3), key);

    // Use the seed to initialize an ARC4 generator.
    var arc4 = new ARC4(key);

    // This function returns a random double in [0, 1) that contains
    // randomness in every bit of the mantissa of the IEEE 754 value.
    var prng = function() {
      var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
          d = startdenom,                 //   and denominator d = 2 ^ 48.
          x = 0;                          //   and no 'extra last byte'.
      while (n < significance) {          // Fill up all significant digits by
        n = (n + x) * width;              //   shifting numerator and
        d *= width;                       //   denominator and generating a
        x = arc4.g(1);                    //   new least-significant-byte.
      }
      while (n >= overflow) {             // To avoid rounding up, before adding
        n /= 2;                           //   last byte, shift everything
        d /= 2;                           //   right using integer math until
        x >>>= 1;                         //   we have exactly the desired bits.
      }
      return (n + x) / d;                 // Form the number within [0, 1).
    };

    prng.int32 = function() { return arc4.g(4) | 0; };
    prng.quick = function() { return arc4.g(4) / 0x100000000; };
    prng.double = prng;

    // Mix the randomness into accumulated entropy.
    mixkey(tostring(arc4.S), pool);

    // Calling convention: what to return as a function of prng, seed, is_math.
    return (options.pass || callback ||
        function(prng, seed, is_math_call, state) {
          if (state) {
            // Load the arc4 state from the given state if it has an S array.
            if (state.S) { copy(state, arc4); }
            // Only provide the .state method if requested via options.state.
            prng.state = function() { return copy(arc4, {}); };
          }

          // If called as a method of Math (Math.seedrandom()), mutate
          // Math.random because that is how seedrandom.js has worked since v1.0.
          if (is_math_call) { math[rngname] = prng; return seed; }

          // Otherwise, it is a newer calling convention, so return the
          // prng directly.
          else return prng;
        })(
    prng,
    shortseed,
    'global' in options ? options.global : (this == math),
    options.state);
  }

  //
  // ARC4
  //
  // An ARC4 implementation.  The constructor takes a key in the form of
  // an array of at most (width) integers that should be 0 <= x < (width).
  //
  // The g(count) method returns a pseudorandom integer that concatenates
  // the next (count) outputs from ARC4.  Its return value is a number x
  // that is in the range 0 <= x < (width ^ count).
  //
  function ARC4(key) {
    var t, keylen = key.length,
        me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

    // The empty key [] is treated as [0].
    if (!keylen) { key = [keylen++]; }

    // Set up S using the standard key scheduling algorithm.
    while (i < width) {
      s[i] = i++;
    }
    for (i = 0; i < width; i++) {
      s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
      s[j] = t;
    }

    // The "g" method returns the next (count) outputs as one number.
    (me.g = function(count) {
      // Using instance members instead of closure state nearly doubles speed.
      var t, r = 0,
          i = me.i, j = me.j, s = me.S;
      while (count--) {
        t = s[i = mask & (i + 1)];
        r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
      }
      me.i = i; me.j = j;
      return r;
      // For robust unpredictability, the function call below automatically
      // discards an initial batch of values.  This is called RC4-drop[256].
      // See http://google.com/search?q=rsa+fluhrer+response&btnI
    })(width);
  }

  //
  // copy()
  // Copies internal state of ARC4 to or from a plain object.
  //
  function copy(f, t) {
    t.i = f.i;
    t.j = f.j;
    t.S = f.S.slice();
    return t;
  }
  //
  // flatten()
  // Converts an object tree to nested arrays of strings.
  //
  function flatten(obj, depth) {
    var result = [], typ = (typeof obj), prop;
    if (depth && typ == 'object') {
      for (prop in obj) {
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
    return (result.length ? result : typ == 'string' ? obj : obj + '\0');
  }

  //
  // mixkey()
  // Mixes a string seed into a key that is an array of integers, and
  // returns a shortened string seed that is equivalent to the result key.
  //
  function mixkey(seed, key) {
    var stringseed = seed + '', smear, j = 0;
    while (j < stringseed.length) {
      key[mask & j] =
        mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
    }
    return tostring(key);
  }

  //
  // autoseed()
  // Returns an object for autoseeding, using window.crypto and Node crypto
  // module if available.
  //
  function autoseed() {
    try {
      var out;
      if (nodecrypto && (out = nodecrypto.randomBytes)) {
        // The use of 'out' to remember randomBytes makes tight minified code.
        out = out(width);
      } else {
        out = new Uint8Array(width);
        (global.crypto || global.msCrypto).getRandomValues(out);
      }
      return tostring(out);
    } catch (e) {
      var browser = global.navigator,
          plugins = browser && browser.plugins;
      return [+new Date, global, plugins, global.screen, tostring(pool)];
    }
  }

  //
  // tostring()
  // Converts an array of charcodes to a string
  //
  function tostring(a) {
    return String.fromCharCode.apply(0, a);
  }

  //
  // When seedrandom.js is loaded, we immediately mix a few bits
  // from the built-in RNG into the entropy pool.  Because we do
  // not want to interfere with deterministic PRNG state later,
  // seedrandom will not call math.random on its own again after
  // initialization.
  //
  mixkey(math.random(), pool);

  //
  // Nodejs and AMD support: export the implementation as a module using
  // either convention.
  //
  if (module.exports) {
    module.exports = seedrandom;
    // When in node.js, try using crypto package for autoseeding.
    try {
      nodecrypto = require('crypto');
    } catch (ex) {}
  } else {
    // When included as a plain script, set up Math.seedrandom global.
    math['seed' + rngname] = seedrandom;
  }


  // End anonymous scope, and pass initial values.
  })(
    // global: `self` in browsers (including strict mode and web workers),
    // otherwise `this` in Node and other environments
    (typeof self !== 'undefined') ? self : commonjsGlobal,
    [],     // pool: entropy pool starts empty
    Math    // math: package containing random, pow, and seedrandom
  );
  }(seedrandom$1));

  // A library of seedable RNGs implemented in Javascript.
  //
  // Usage:
  //
  // var seedrandom = require('seedrandom');
  // var random = seedrandom(1); // or any seed.
  // var x = random();       // 0 <= x < 1.  Every bit is random.
  // var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

  // alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
  // Period: ~2^116
  // Reported to pass all BigCrush tests.
  var alea = alea$1.exports;

  // xor128, a pure xor-shift generator by George Marsaglia.
  // Period: 2^128-1.
  // Reported to fail: MatrixRank and LinearComp.
  var xor128 = xor128$1.exports;

  // xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
  // Period: 2^192-2^32
  // Reported to fail: CollisionOver, SimpPoker, and LinearComp.
  var xorwow = xorwow$1.exports;

  // xorshift7, by François Panneton and Pierre L'ecuyer, takes
  // a different approach: it adds robustness by allowing more shifts
  // than Marsaglia's original three.  It is a 7-shift generator
  // with 256 bits, that passes BigCrush with no systmatic failures.
  // Period 2^256-1.
  // No systematic BigCrush failures reported.
  var xorshift7 = xorshift7$1.exports;

  // xor4096, by Richard Brent, is a 4096-bit xor-shift with a
  // very long period that also adds a Weyl generator. It also passes
  // BigCrush with no systematic failures.  Its long period may
  // be useful if you have many generators and need to avoid
  // collisions.
  // Period: 2^4128-2^32.
  // No systematic BigCrush failures reported.
  var xor4096 = xor4096$1.exports;

  // Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
  // number generator derived from ChaCha, a modern stream cipher.
  // https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
  // Period: ~2^127
  // No systematic BigCrush failures reported.
  var tychei = tychei$1.exports;

  // The original ARC4-based prng included in this library.
  // Period: ~2^1600
  var sr = seedrandom$1.exports;

  sr.alea = alea;
  sr.xor128 = xor128;
  sr.xorwow = xorwow;
  sr.xorshift7 = xorshift7;
  sr.xor4096 = xor4096;
  sr.tychei = tychei;

  var seedrandom = sr;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string} domainKey
   * @param {string} sessionKey
   * @param {any} getImageDataProxy
   * @param {CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext} ctx?
   */
  function computeOffScreenCanvas (canvas, domainKey, sessionKey, getImageDataProxy, ctx) {
      if (!ctx) {
          ctx = canvas.getContext('2d');
      }

      // Make a off-screen canvas and put the data there
      const offScreenCanvas = document.createElement('canvas');
      offScreenCanvas.width = canvas.width;
      offScreenCanvas.height = canvas.height;
      const offScreenCtx = offScreenCanvas.getContext('2d');

      let rasterizedCtx = ctx;
      // If we're not a 2d canvas we need to rasterise first into 2d
      const rasterizeToCanvas = !(ctx instanceof CanvasRenderingContext2D);
      if (rasterizeToCanvas) {
          rasterizedCtx = offScreenCtx;
          offScreenCtx.drawImage(canvas, 0, 0);
      }

      // We *always* compute the random pixels on the complete pixel set, then pass back the subset later
      let imageData = getImageDataProxy._native.apply(rasterizedCtx, [0, 0, canvas.width, canvas.height]);
      imageData = modifyPixelData(imageData, sessionKey, domainKey, canvas.width);

      if (rasterizeToCanvas) {
          clearCanvas(offScreenCtx);
      }

      offScreenCtx.putImageData(imageData, 0, 0);

      return { offScreenCanvas, offScreenCtx }
  }

  /**
   * Clears the pixels from the canvas context
   *
   * @param {CanvasRenderingContext2D} canvasContext
   */
  function clearCanvas (canvasContext) {
      // Save state and clean the pixels from the canvas
      canvasContext.save();
      canvasContext.globalCompositeOperation = 'destination-out';
      canvasContext.fillStyle = 'rgb(255,255,255)';
      canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
      canvasContext.restore();
  }

  /**
   * @param {ImageData} imageData
   * @param {string} sessionKey
   * @param {string} domainKey
   * @param {number} width
   */
  function modifyPixelData (imageData, domainKey, sessionKey, width) {
      const d = imageData.data;
      const length = d.length / 4;
      let checkSum = 0;
      const mappingArray = [];
      for (let i = 0; i < length; i += 4) {
          if (!shouldIgnorePixel(d, i) && !adjacentSame(d, i, width)) {
              mappingArray.push(i);
              checkSum += d[i] + d[i + 1] + d[i + 2] + d[i + 3];
          }
      }

      const windowHash = getDataKeySync(sessionKey, domainKey, checkSum);
      const rng = new seedrandom(windowHash);
      for (let i = 0; i < mappingArray.length; i++) {
          const rand = rng();
          const byte = Math.floor(rand * 10);
          const channel = byte % 3;
          const pixelCanvasIndex = mappingArray[i] + channel;

          d[pixelCanvasIndex] = d[pixelCanvasIndex] ^ (byte & 0x1);
      }

      return imageData
  }

  /**
   * Ignore pixels that have neighbours that are the same
   *
   * @param {Uint8ClampedArray} imageData
   * @param {number} index
   * @param {number} width
   */
  function adjacentSame (imageData, index, width) {
      const widthPixel = width * 4;
      const x = index % widthPixel;
      const maxLength = imageData.length;

      // Pixels not on the right border of the canvas
      if (x < widthPixel) {
          const right = index + 4;
          if (!pixelsSame(imageData, index, right)) {
              return false
          }
          const diagonalRightUp = right - widthPixel;
          if (diagonalRightUp > 0 && !pixelsSame(imageData, index, diagonalRightUp)) {
              return false
          }
          const diagonalRightDown = right + widthPixel;
          if (diagonalRightDown < maxLength && !pixelsSame(imageData, index, diagonalRightDown)) {
              return false
          }
      }

      // Pixels not on the left border of the canvas
      if (x > 0) {
          const left = index - 4;
          if (!pixelsSame(imageData, index, left)) {
              return false
          }
          const diagonalLeftUp = left - widthPixel;
          if (diagonalLeftUp > 0 && !pixelsSame(imageData, index, diagonalLeftUp)) {
              return false
          }
          const diagonalLeftDown = left + widthPixel;
          if (diagonalLeftDown < maxLength && !pixelsSame(imageData, index, diagonalLeftDown)) {
              return false
          }
      }

      const up = index - widthPixel;
      if (up > 0 && !pixelsSame(imageData, index, up)) {
          return false
      }

      const down = index + widthPixel;
      if (down < maxLength && !pixelsSame(imageData, index, down)) {
          return false
      }

      return true
  }

  /**
   * Check that a pixel at index and index2 match all channels
   * @param {Uint8ClampedArray} imageData
   * @param {number} index
   * @param {number} index2
   */
  function pixelsSame (imageData, index, index2) {
      return imageData[index] === imageData[index2] &&
             imageData[index + 1] === imageData[index2 + 1] &&
             imageData[index + 2] === imageData[index2 + 2] &&
             imageData[index + 3] === imageData[index2 + 3]
  }

  /**
   * Returns true if pixel should be ignored
   * @param {Uint8ClampedArray} imageData
   * @param {number} index
   * @returns {boolean}
   */
  function shouldIgnorePixel (imageData, index) {
      // Transparent pixels
      if (imageData[index + 3] === 0) {
          return true
      }
      return false
  }

  function init$8 (args) {
      const { sessionKey, site } = args;
      const domainKey = site.domain;
      const featureName = 'fingerprinting-canvas';
      const supportsWebGl = getFeatureSettingEnabled(featureName, args, 'webGl');

      const unsafeCanvases = new WeakSet();
      const canvasContexts = new WeakMap();
      const canvasCache = new WeakMap();

      /**
       * Clear cache as canvas has changed
       * @param {HTMLCanvasElement} canvas
       */
      function clearCache (canvas) {
          canvasCache.delete(canvas);
      }

      /**
       * @param {HTMLCanvasElement} canvas
       */
      function treatAsUnsafe (canvas) {
          unsafeCanvases.add(canvas);
          clearCache(canvas);
      }

      const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, 'getContext', {
          apply (target, thisArg, args) {
              const context = DDGReflect.apply(target, thisArg, args);
              try {
                  canvasContexts.set(thisArg, context);
              } catch {
              }
              return context
          }
      });
      proxy.overload();

      // Known data methods
      const safeMethods = ['putImageData', 'drawImage'];
      for (const methodName of safeMethods) {
          const safeMethodProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
              apply (target, thisArg, args) {
                  // Don't apply escape hatch for canvases
                  if (methodName === 'drawImage' && args[0] && args[0] instanceof HTMLCanvasElement) {
                      treatAsUnsafe(args[0]);
                  } else {
                      clearCache(thisArg.canvas);
                  }
                  return DDGReflect.apply(target, thisArg, args)
              }
          });
          safeMethodProxy.overload();
      }

      const unsafeMethods = [
          'strokeRect',
          'bezierCurveTo',
          'quadraticCurveTo',
          'arcTo',
          'ellipse',
          'rect',
          'fill',
          'stroke',
          'lineTo',
          'beginPath',
          'closePath',
          'arc',
          'fillText',
          'fillRect',
          'strokeText',
          'createConicGradient',
          'createLinearGradient',
          'createRadialGradient',
          'createPattern'
      ];
      for (const methodName of unsafeMethods) {
          // Some methods are browser specific
          if (methodName in CanvasRenderingContext2D.prototype) {
              const unsafeProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
                  apply (target, thisArg, args) {
                      treatAsUnsafe(thisArg.canvas);
                      return DDGReflect.apply(target, thisArg, args)
                  }
              });
              unsafeProxy.overload();
          }
      }

      if (supportsWebGl) {
          const unsafeGlMethods = [
              'commit',
              'compileShader',
              'shaderSource',
              'attachShader',
              'createProgram',
              'linkProgram',
              'drawElements',
              'drawArrays'
          ];
          const glContexts = [
              WebGL2RenderingContext,
              WebGLRenderingContext
          ];
          for (const context of glContexts) {
              for (const methodName of unsafeGlMethods) {
                  // Some methods are browser specific
                  if (methodName in context.prototype) {
                      const unsafeProxy = new DDGProxy(featureName, context.prototype, methodName, {
                          apply (target, thisArg, args) {
                              treatAsUnsafe(thisArg.canvas);
                              return DDGReflect.apply(target, thisArg, args)
                          }
                      });
                      unsafeProxy.overload();
                  }
              }
          }
      }

      // Using proxies here to swallow calls to toString etc
      const getImageDataProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, 'getImageData', {
          apply (target, thisArg, args) {
              if (!unsafeCanvases.has(thisArg.canvas)) {
                  return DDGReflect.apply(target, thisArg, args)
              }
              // Anything we do here should be caught and ignored silently
              try {
                  const { offScreenCtx } = getCachedOffScreenCanvasOrCompute(thisArg.canvas, domainKey, sessionKey);
                  // Call the original method on the modified off-screen canvas
                  return DDGReflect.apply(target, offScreenCtx, args)
              } catch {
              }

              return DDGReflect.apply(target, thisArg, args)
          }
      });
      getImageDataProxy.overload();

      /**
       * Get cached offscreen if one exists, otherwise compute one
       *
       * @param {HTMLCanvasElement} canvas
       * @param {string} domainKey
       * @param {string} sessionKey
       */
      function getCachedOffScreenCanvasOrCompute (canvas, domainKey, sessionKey) {
          let result;
          if (canvasCache.has(canvas)) {
              result = canvasCache.get(canvas);
          } else {
              const ctx = canvasContexts.get(canvas);
              result = computeOffScreenCanvas(canvas, domainKey, sessionKey, getImageDataProxy, ctx);
              canvasCache.set(canvas, result);
          }
          return result
      }

      const canvasMethods = ['toDataURL', 'toBlob'];
      for (const methodName of canvasMethods) {
          const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, methodName, {
              apply (target, thisArg, args) {
                  // Short circuit for low risk canvas calls
                  if (!unsafeCanvases.has(thisArg)) {
                      return DDGReflect.apply(target, thisArg, args)
                  }
                  try {
                      const { offScreenCanvas } = getCachedOffScreenCanvasOrCompute(thisArg, domainKey, sessionKey);
                      // Call the original method on the modified off-screen canvas
                      return DDGReflect.apply(target, offScreenCanvas, args)
                  } catch {
                      // Something we did caused an exception, fall back to the native
                      return DDGReflect.apply(target, thisArg, args)
                  }
              }
          });
          proxy.overload();
      }
  }

  var fingerprintingCanvas = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$8
  });

  function init$7 (args) {
      const Navigator = globalThis.Navigator;
      const navigator = globalThis.navigator;

      overrideProperty('keyboard', {
          object: Navigator.prototype,
          origValue: navigator.keyboard,
          targetValue: undefined
      });
      overrideProperty('hardwareConcurrency', {
          object: Navigator.prototype,
          origValue: navigator.hardwareConcurrency,
          targetValue: 2
      });
      overrideProperty('deviceMemory', {
          object: Navigator.prototype,
          origValue: navigator.deviceMemory,
          targetValue: 8
      });
  }

  var fingerprintingHardware = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$7
  });

  /**
   * normalize window dimensions, if more than one monitor is in play.
   *  X/Y values are set in the browser based on distance to the main monitor top or left, which
   * can mean second or more monitors have very large or negative values. This function maps a given
   * given coordinate value to the proper place on the main screen.
   */
  function normalizeWindowDimension (value, targetDimension) {
      if (value > targetDimension) {
          return value % targetDimension
      }
      if (value < 0) {
          return targetDimension + value
      }
      return value
  }

  function setWindowPropertyValue (property, value) {
      // Here we don't update the prototype getter because the values are updated dynamically
      try {
          defineProperty(globalThis, property, {
              get: () => value,
              set: () => {},
              configurable: true
          });
      } catch (e) {}
  }

  const origPropertyValues = {};

  /**
   * Fix window dimensions. The extension runs in a different JS context than the
   * page, so we can inject the correct screen values as the window is resized,
   * ensuring that no information is leaked as the dimensions change, but also that the
   * values change correctly for valid use cases.
   */
  function setWindowDimensions () {
      try {
          const window = globalThis;
          const top = globalThis.top;

          const normalizedY = normalizeWindowDimension(window.screenY, window.screen.height);
          const normalizedX = normalizeWindowDimension(window.screenX, window.screen.width);
          if (normalizedY <= origPropertyValues.availTop) {
              setWindowPropertyValue('screenY', 0);
              setWindowPropertyValue('screenTop', 0);
          } else {
              setWindowPropertyValue('screenY', normalizedY);
              setWindowPropertyValue('screenTop', normalizedY);
          }

          if (top.window.outerHeight >= origPropertyValues.availHeight - 1) {
              setWindowPropertyValue('outerHeight', top.window.screen.height);
          } else {
              try {
                  setWindowPropertyValue('outerHeight', top.window.outerHeight);
              } catch (e) {
                  // top not accessible to certain iFrames, so ignore.
              }
          }

          if (normalizedX <= origPropertyValues.availLeft) {
              setWindowPropertyValue('screenX', 0);
              setWindowPropertyValue('screenLeft', 0);
          } else {
              setWindowPropertyValue('screenX', normalizedX);
              setWindowPropertyValue('screenLeft', normalizedX);
          }

          if (top.window.outerWidth >= origPropertyValues.availWidth - 1) {
              setWindowPropertyValue('outerWidth', top.window.screen.width);
          } else {
              try {
                  setWindowPropertyValue('outerWidth', top.window.outerWidth);
              } catch (e) {
                  // top not accessible to certain iFrames, so ignore.
              }
          }
      } catch (e) {
          // in a cross domain iFrame, top.window is not accessible.
      }
  }

  function init$6 (args) {
      const Screen = globalThis.Screen;
      const screen = globalThis.screen;

      origPropertyValues.availTop = overrideProperty('availTop', {
          object: Screen.prototype,
          origValue: screen.availTop,
          targetValue: 0
      });
      origPropertyValues.availLeft = overrideProperty('availLeft', {
          object: Screen.prototype,
          origValue: screen.availLeft,
          targetValue: 0
      });
      origPropertyValues.availWidth = overrideProperty('availWidth', {
          object: Screen.prototype,
          origValue: screen.availWidth,
          targetValue: screen.width
      });
      origPropertyValues.availHeight = overrideProperty('availHeight', {
          object: Screen.prototype,
          origValue: screen.availHeight,
          targetValue: screen.height
      });
      overrideProperty('colorDepth', {
          object: Screen.prototype,
          origValue: screen.colorDepth,
          targetValue: 24
      });
      overrideProperty('pixelDepth', {
          object: Screen.prototype,
          origValue: screen.pixelDepth,
          targetValue: 24
      });

      window.addEventListener('resize', function () {
          setWindowDimensions();
      });
      setWindowDimensions();
  }

  var fingerprintingScreenSize = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$6
  });

  function init$5 () {
      const navigator = globalThis.navigator;
      const Navigator = globalThis.Navigator;

      /**
       * Temporary storage can be used to determine hard disk usage and size.
       * This will limit the max storage to 4GB without completely disabling the
       * feature.
       */
      if (navigator.webkitTemporaryStorage) {
          try {
              const org = navigator.webkitTemporaryStorage.queryUsageAndQuota;
              const tStorage = navigator.webkitTemporaryStorage;
              tStorage.queryUsageAndQuota = function queryUsageAndQuota (callback, err) {
                  const modifiedCallback = function (usedBytes, grantedBytes) {
                      const maxBytesGranted = 4 * 1024 * 1024 * 1024;
                      const spoofedGrantedBytes = Math.min(grantedBytes, maxBytesGranted);
                      callback(usedBytes, spoofedGrantedBytes);
                  };
                  org.call(navigator.webkitTemporaryStorage, modifiedCallback, err);
              };
              defineProperty(Navigator.prototype, 'webkitTemporaryStorage', { get: () => tStorage });
          } catch (e) {}
      }
  }

  var fingerprintingTemporaryStorage = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$5
  });

  function init$4 () {
      try {
          if ('browsingTopics' in Document.prototype) {
              delete Document.prototype.browsingTopics;
          }
          if ('joinAdInterestGroup' in Navigator.prototype) {
              delete Navigator.prototype.joinAdInterestGroup;
          }
          if ('leaveAdInterestGroup' in Navigator.prototype) {
              delete Navigator.prototype.leaveAdInterestGroup;
          }
          if ('updateAdInterestGroups' in Navigator.prototype) {
              delete Navigator.prototype.updateAdInterestGroups;
          }
          if ('runAdAuction' in Navigator.prototype) {
              delete Navigator.prototype.runAdAuction;
          }
          if ('adAuctionComponents' in Navigator.prototype) {
              delete Navigator.prototype.adAuctionComponents;
          }
      } catch {
          // Throw away this exception, it's likely a confict with another extension
      }
  }

  var googleRejected = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$4
  });

  // Set Global Privacy Control property on DOM
  function init$3 (args) {
      try {
          // If GPC on, set DOM property prototype to true if not already true
          if (args.globalPrivacyControlValue) {
              if (navigator.globalPrivacyControl) return
              defineProperty(Navigator.prototype, 'globalPrivacyControl', {
                  get: () => true,
                  configurable: true,
                  enumerable: true
              });
          } else {
              // If GPC off & unsupported by browser, set DOM property prototype to false
              // this may be overwritten by the user agent or other extensions
              if (typeof navigator.globalPrivacyControl !== 'undefined') return
              defineProperty(Navigator.prototype, 'globalPrivacyControl', {
                  get: () => false,
                  configurable: true,
                  enumerable: true
              });
          }
      } catch {
          // Ignore exceptions that could be caused by conflicting with other extensions
      }
  }

  var gpc = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$3
  });

  function init$2 (args) {
      try {
          if (navigator.duckduckgo) {
              return
          }
          if (!args.platform || !args.platform.name) {
              return
          }
          defineProperty(Navigator.prototype, 'duckduckgo', {
              value: {
                  platform: args.platform.name,
                  isDuckDuckGo () {
                      return DDGPromise.resolve(true)
                  }
              },
              enumerable: true,
              configurable: false,
              writable: false
          });
      } catch {
          // todo: Just ignore this exception?
      }
  }

  var navigatorInterface = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$2
  });

  function init$1 (args) {
      // Unfortunately, we only have limited information about the referrer and current frame. A single
      // page may load many requests and sub frames, all with different referrers. Since we
      if (args.referrer && // make sure the referrer was set correctly
          args.referrer.referrer !== undefined && // referrer value will be undefined when it should be unchanged.
          document.referrer && // don't change the value if it isn't set
          document.referrer !== '' && // don't add referrer information
          new URL(document.URL).hostname !== new URL(document.referrer).hostname) { // don't replace the referrer for the current host.
          let trimmedReferer = document.referrer;
          if (new URL(document.referrer).hostname === args.referrer.referrerHost) {
              // make sure the real referrer & replacement referrer match if we're going to replace it
              trimmedReferer = args.referrer.referrer;
          } else {
              // if we don't have a matching referrer, just trim it to origin.
              trimmedReferer = new URL(document.referrer).origin + '/';
          }
          overrideProperty('referrer', {
              object: Document.prototype,
              origValue: document.referrer,
              targetValue: trimmedReferer
          });
      }
  }

  var referrer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init$1
  });

  /**
   * Fixes incorrect sizing value for outerHeight and outerWidth
   */
  function windowSizingFix () {
      window.outerHeight = window.innerHeight;
      window.outerWidth = window.innerWidth;
  }

  /**
   * Add missing navigator.credentials API
   */
  function navigatorCredentialsFix () {
      try {
          const value = {
              get () {
                  return Promise.reject(new Error())
              }
          };
          defineProperty(Navigator.prototype, 'credentials', {
              value,
              configurable: true,
              enumerable: true
          });
      } catch {
          // Ignore exceptions that could be caused by conflicting with other extensions
      }
  }

  function init () {
      windowSizingFix();
      navigatorCredentialsFix();
  }

  var webCompat = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init: init
  });

  exports.init = init$c;
  exports.load = load$1;
  exports.update = update$1;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});


    function init () {
        const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$);
        if (processedConfig.site.allowlisted) {
            return
        }

        contentScopeFeatures.load();

        contentScopeFeatures.init(processedConfig);

        // Not supported:
        // contentScopeFeatures.update(message)
    }

    init();

})();

