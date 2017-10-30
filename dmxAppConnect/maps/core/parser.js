(function() {

    var cache = {};

    var OPERATORS = {
        '{': 'L_CURLY',
        '}': 'R_CURLY',
        '(': 'L_PAREN',
        ')': 'R_PAREN',
        '[': 'L_BRACKET',
        ']': 'R_BRACKET',
        '.': 'PERIOD',
        ',': 'COMMA',
        //';': 'SEMI', // Multiple statements are not supported
        ':': 'COLON',
        '?': 'QUESTION',
        // Arithmetic operators
        '+': 'ADDICTIVE',
        '-': 'ADDICTIVE',
        '*': 'MULTIPLICATIVE',
        '/': 'MULTIPLICATIVE',
        '%': 'MULTIPLICATIVE',
        // Comparison operators
        '===': 'EQUALITY',
        '!==': 'EQUALITY',
        '==': 'EQUALITY',
        '!=': 'EQUALITY',
        '<': 'RELATIONAL',
        '>': 'RELATIONAL',
        '<=': 'RELATIONAL',
        '>=': 'RELATIONAL',
        'in': 'RELATIONAL',
        // Logical operators
        '&&': 'LOGICAL_AND',
        '||': 'LOGICAL_OR',
        '!': 'LOGICAL_NOT',
        // Bitwise operators
        '&': 'BITWISE_AND',
        '|': 'BITWISE_OR',
        '^': 'BITWISE_XOR',
        '~': 'BITWISE_NOT',
        '<<': 'BITWISE_SHIFT',
        '>>': 'BITWISE_SHIFT',
        '>>>': 'BITWISE_SHIFT'
    };

    var ESCAPE = {
        'n': '\n',
        'f': '\f',
        'r': '\r',
        't': '\t',
        'v': '\v',
        "'": "'",
        '"': '"',
        '`': '`'
    };

    var EXPRESSIONS = {
        'in': function(a, b) { return a() in b(); },
        '?': function(a, b, c) { return a() ? b() : c(); },
        '+': function(a, b) { a = a(); b = b(); return a == null ? b : b == null ? a : a + b; },
        '-': function(a, b) { return a() - b(); },
        '*': function(a, b) { return a() * b(); },
        '/': function(a, b) { return a() / b(); },
        '%': function(a, b) { return a() % b(); },
        '===': function(a, b) { return a() === b(); },
        '!==': function(a, b) { return a() !== b(); },
        '==': function(a, b) { return a() == b(); },
        '!=': function(a, b) { return a() != b(); },
        '<': function(a, b) { return a() < b(); },
        '>': function(a, b) { return a() > b(); },
        '<=': function(a, b) { return a() <= b(); },
        '>=': function(a, b) { return a() >= b(); },
        '&&': function(a, b) { return a() && b(); },
        '||': function(a, b) { return a() || b(); },
        '&': function(a, b) { return a() & b(); },
        '|': function(a, b) { return a() | b(); },
        '^': function(a, b) { return a() ^ b(); },
        '<<': function(a, b) { return a() << b(); },
        '>>': function(a, b) { return a() >> b(); },
        '>>>': function(a, b) { return a() >>> b(); },
        '~': function(a) { return ~a(); },
        '!': function(a) { return !a(); }
    };

    var RESERVED = {
        //'JSON': function() { return function() { return JSON; }},
        //'Math': function() { return function() { return Math; }},
        'this': function(scope) { return function() { return scope.data; }; },
        //'global': function(scope) { return function() { return scope.global.data; }},
        'undefined': function() { return function() { return undefined; }; },
        'null': function() { return function() { return null; }; },
        'true': function() { return function() { return true; }; },
        'false': function() { return function() { return false; }; }
    };

    var ZERO = function() { return 0; };

    dmx.lexer = function(exp) {
        if (cache[exp]) {
            return cache[exp];
        }

        var tokens = [], token, name, start, index = 0, op = true, ch, ch2, ch3;

        while (index < exp.length) {
            start = index;

            ch = read();

    		if (isQuote(ch) && op) {
    			name = 'STRING';
    			token = readString(ch);
    			op = false;
    		}
    		else if ((isDigid(ch) || (is('.') && peek() && isDigid(peek()))) && op) {
    			name = 'NUMBER';
    			token = readNumber();
    			op = false;
    		}
    		else if (isAlpha(ch) && op) {
    			name = 'IDENT';
    			token = readIdent();
    			if (is('(')) {
    				name = 'METHOD';
    			}
    			op = false;
    		}
    		else if (is('/') && op && testRegexp()) {
    			name = 'REGEXP';
    			token = readRegexp();
    			op = false;
    		}
    		else if ( isWhitespace(ch) ) {
    			// WHITESPACE (SKIP)
    			index++;
    			continue;
    		}
    		else if ((ch3 = read(3)) && OPERATORS[ch3]) {
    			name = OPERATORS[ch3];
    			token = ch3;
    			op = true;
    			index += 3;
    		}
    		else if ((ch2 = read(2)) && OPERATORS[ch2]) {
    			name = OPERATORS[ch2];
    			token = ch2;
    			op = true;
    			index += 2;
    		}
    		else if (OPERATORS[ch]) {
    			name = OPERATORS[ch];
    			token = ch;
    			op = true;
    			index++;
    		}
    		else {
    			// ERROR
    			throw Error("Lexer Error: Unexpected token '" + ch + "' at column " + index + " in expression [" + exp + "]");
    		}

    		tokens.push({
    			name : name,
    			index: start,
    			value: token
    		});
        }

        cache[exp] = tokens;

        return tokens;

        function read(n) {
    		return (n > 1) ? exp.substr(index, n) : exp[index];
    	}

    	function peek(n) {
    		n = n || 1;
    		return index + n < exp.length ? exp[index + n] : false;
    	}

    	function is(chars) {
    		return chars.indexOf(ch) != -1;
    	}

    	function isQuote(ch) {
    		return ch == '"' || ch == "'" || ch == '`';
    	}

    	function isDigid(ch) {
    		return ch >= '0' && ch <= '9';
    	}

    	function isAlpha(ch) {
    		return (ch >= 'a' && ch <= 'z') ||
    		       (ch >= 'A' && ch <= 'Z') ||
    		        ch == '_' || ch == '$';
    	}

    	function isAlphaNum(ch) {
    		return isAlpha(ch) || isDigid(ch);
    	}

    	function isWhitespace(ch) {
    		return ch == ' ' || ch == '\r' || ch == '\t' || ch == '\n' || ch == '\v' || ch == '\u00A0';
    	}

    	function isExpOperator(ch) {
    		return ch == '-' || ch == '+' || isDigid(ch);
    	}

    	function readString(quote) {
    		var string = '', escape = false;

    		index++;

    		while (index < exp.length) {
    			ch = read();

    			// was previous an escape character
    			if ( escape ) {
    				// unicode escape
    				if (ch == 'u') {
    					index++;
    					var hex = read(4);
    					if (hex.match(/[\da-f]{4}/i)) {
    						throw Error('Invalid unicode escape');
    					}
    					string += String.fromCharCode(parseInt(hex, 16));
    					index += 3;
    				}
    				else {
    					var rep = ESCAPE[ch];
    					string += rep ? rep : ch;
    				}

    				escape = false;
    			}
    			else if (ch == '\\') {
    				// escape character
    				escape = true;
    			}
    			else if (ch == quote) {
    				// end of string
    				index++;
    				return string;
    			}
    			else {
    				string += ch;
    			}

    			index++;
    		}

    		throw Error('Unterminated quote');
    	}

    	function readNumber() {
    		var number = '', exponent = false;

    		while (index < exp.length) {
    			ch = read();

    			if (is('.') && peek() && isDigid(peek()) || isDigid(ch)) {
    				number += ch;
    			}
    			else {
    				var next = peek();

    				if (is('eE') && isExpOperator(next)) {
    					number += 'e';
    					exponent = true;
    				}
    				else if (isExpOperator(ch) && next && isDigid(next) && exponent) {
    					number += ch;
    					exponent = false;
    				}
    				else if (isExpOperator(ch) && (!next || !isDigid(next)) && exponent) {
    					throw Error('Invalid exponent');
    				}
    				else {
    					break;
    				}
    			}

    			index++;
    		}

    		return +number;
    	}

    	function readIdent() {
    		var ident = '';

    		while (index < exp.length) {
    			ch = read();

    			if (isAlphaNum(ch)) {
    				ident += ch;
    			}
    			else {
    				break;
    			}

    			index++;
    		}

    		return ident;
    	}

    	function readRegexp() {
    		var regexp = '', modifiers = '', escape = false;

    		index++;

    		while (index < exp.length) {
    			ch = read();

    			// was previous an escape character
    			if (escape) {
    				escape = false;
    			}
    			else if (ch == '\\') {
    				// escape character
    				escape = true;
    			}
    			else if (ch == '/') {
    				// end of regexp
    				index++;

    				while ('ign'.indexOf(ch = read()) != -1) {
    					modifiers += ch;
    					index++;
    				}

    				return regexp + '%%%' + modifiers;
    			}

    			regexp += ch;
    			index++;
    		}

    		throw Error('Unterminated regexp');
    	}

    	function testRegexp() {
    		var idx = index, ok = true;

    		try {
    			readRegexp();
    		} catch (e) {
    			ok = false;
    		}

    		// reset our index and ch
    		index = idx;
    		ch = '/';

    		return ok;
    	}
    };

    dmx.parse = function(exp, scope) {
        scope = scope || dmx.app;

        // check templates
        if (dmx.reExpression.test(exp)) {
            if (exp.substr(0, 2) == '{{' && exp.substr(-2) == '}}' && exp.indexOf('{{', 2) == -1) {
                return dmx.parse(exp.substring(2, exp.length - 2), scope);
            }

            return exp.replace(dmx.reExpressionReplace, function(token, exp) {
                var value = dmx.parse(exp, scope);
                return value == null ? '' : value;
            });
        }

        var tokens = dmx.lexer(exp).slice(0), context;

        return doParse();

        function read() {
    		if (tokens.length === 0) {
    			throw Error('Unexpected end of expression: ' + exp);
    		}

    		return tokens[0];
    	}

    	function peek(e) {
    		if (tokens.length > 0) {
    			var token = tokens[0];

    			if (!e || token.name == e) {
    				return token;
    			}
    		}

    		return false;
    	}

    	function expect(e) {
    		var token = peek(e);

    		if (token) {
    			tokens.shift();
    			return token;
    		}

    		return false;
    	}

    	function consume(e) {
    		if (!expect(e)) {
    			throw Error('Unexpected token, expecting [' + e + ']. expression: ' + exp);
    		}
    	}

    	function fn(exp) {
    		var args = Array.prototype.slice.call(arguments, 1);

    		return function() {
    			if (EXPRESSIONS.hasOwnProperty(exp)) {
    				return EXPRESSIONS[exp].apply(scope, args);
    			} else {
    				return exp;
    			}
    		};
    	}

    	function doParse() {
    		var a = [];

    		while (true) {
    			if (tokens.length > 0 && !(peek('R_PAREN') || peek('R_BRACKET'))) {
    				a.push(expression());
    			}

    			return (a.length == 1 ?
    				a[0] : b)();
    		}

    		function b() {
    			var value;

    			for (var i = 0; i < a.length; i++) {
    				var e = a[i];
    				if (e) { value = e(); }
    			}

    			return value;
    		}
    	}

    	function expression() {
    		return conditional();
    	}

    	function conditional() {
    		var left = logicalOr(), middle, token;

    		if ((token = expect('QUESTION'))) {
    			middle = conditional();

    			if ((token = expect('COLON'))) {
    				return fn('?', left, middle, conditional());
    			} else {
    				throw Error('Parse Error');
    			}
    		} else {
    			return left;
    		}
    	}

    	function logicalOr() {
    		var left = logicalAnd(), token;

    		while (true) {
    			if ((token = expect('LOGICAL_OR'))) {
    				left = fn(token.value, left, logicalAnd());
    			} else {
    				return left;
    			}
    		}
    	}

    	function logicalAnd() {
    		var left = bitwiseOr(), token;

    		if ((token = expect('LOGICAL_AND'))) {
    			left = fn(token.value, left, logicalAnd());
    		}

    		return left;
    	}

    	function bitwiseOr() {
    		var left = bitwiseXor(), token;

    		if ((token = expect('BITWISE_OR'))) {
    			left = fn(token.value, left, bitwiseXor());
    		}

    		return left;
    	}

    	function bitwiseXor() {
    		var left = bitwiseAnd(), token;

    		if ((token = expect('BITWISE_XOR'))) {
    			left = fn(token.value, left, bitwiseAnd());
    		}

    		return left;
    	}

    	function bitwiseAnd() {
    		var left = equality(), token;

    		if ((token = expect('BITWISE_AND'))) {
    			left = fn(token.value, left, bitwiseAnd());
    		}

    		return left;
    	}

    	function equality() {
    		var left = relational(), token;

    		if ((token = expect('EQUALITY'))) {
    			left = fn(token.value, left, equality());
    		}

    		return left;
    	}

    	function relational() {
    		var left = bitwiseShift(), token;

    		if ((token = expect('RELATIONAL'))) {
    			left = fn(token.value, left, relational());
    		}

    		return left;
    	}

    	// bitwise shift here

    	function bitwiseShift() {
    		var left = addictive(), token;

    		while ((token = expect('BITWISE_SHIFT'))) {
    			left = fn(token.value, left, addictive());
    		}

    		return left;
    	}

    	function addictive() {
    		var left = multiplicative(), token;

    		while ((token = expect('ADDICTIVE'))) {
    			left = fn(token.value, left, multiplicative());
    		}

    		return left;
    	}

    	function multiplicative() {
    		var left = unary(), token;

    		while ((token = expect('MULTIPLICATIVE'))) {
    			left = fn(token.value, left, unary());
    		}

    		return left;
    	}

    	function unary() {
    		var token;

    		if ((token = expect('ADDICTIVE'))) {
    			if (token.value == '+') {
    				return primary();
    			} else {
    				return fn(token.value, ZERO, unary());
    			}
    		} else if ((token = expect('LOGICAL_NOT'))) {
    			return fn(token.value, unary());
    		} else {
    			return primary();
    		}
    	}

    	function primary() {
    		var value, next;

    		if (expect('L_PAREN')) {
    			value = expression();
    			consume('R_PAREN');
            } else if (expect('L_CURLY')) {
                var obj = {};

                if (read().name != 'R_CURLY') {
                    do {
                        var key = expect().value;
                        consume('COLON');
                        obj[key] = expression()();
                    } while (expect('COMMA'))
                }

                value = fn(obj);

    			consume('R_CURLY');
    		} else if (expect('L_BRACKET')) {
                var arr = [];

        		if (read().name != 'R_BRACKET') {
        			do {
        				arr.push(expression()());
        			} while (expect('COMMA'));
        		}

                value = fn(arr);

        		consume('R_BRACKET');
    		} else if (expect('PERIOD')) {
    			value = peek() ? objectMember(fn(scope.data)) : fn(scope.data);
    		} else {
    			var token = expect();

    			if (token === false) {
    				throw Error('Not a primary expression');
    			}

    			if (token.name == 'IDENT') {
    				value = RESERVED.hasOwnProperty(token.value) ?
    					RESERVED[token.value](scope) :
    					function() { return scope.get(token.value); };
    			} else if (token.name == 'METHOD') {
                    value = fn(dmx.__formatters.global[token.value] || function() {
    					if (window.warn) console.warn('Formatter ' + token.value + ' doesn\'t exist');
    					return undefined;
                    });
    			} else if (token.name == 'REGEXP') {
    				value = function() {
    					var re = token.value.split('%%%');
    					return new RegExp(re[0], re[1]);
    				};
    			} else {
    				value = function() { return token.value; };
    			}
    		}

    		while ((next = expect('L_PAREN') || expect('L_BRACKET') || expect('PERIOD'))) {
    			if (next.value == '(') {
    				value = functionCall(value, context);
    			} else if (next.value == '[') {
    				context = value;
    				value = objectIndex(value);
    			} else if (next.value == '.') {
    				context = value;
    				value = objectMember(value);
    			} else {
    				throw Error('Parse Error');
    			}
    		}

    		context = null;

    		return value;
    	}

    	function functionCall(func, ctx) {
    		var argsFn = [];

    		if (read().name != 'R_PAREN') {
    			do {
    				argsFn.push(expression());
    			} while (expect('COMMA'));
    		}

    		consume('R_PAREN');

    		return function() {
    			var args = []; //[ctx()];

                if (ctx) {
                    args.push(ctx());
                }

    			for (var i = 0; i < argsFn.length; i++) {
    				args.push(argsFn[i]());
    			}

    			var fnPtr = func() || dmx.noop;

    			return fnPtr.apply(scope, args);
    		};
    	}

    	function objectIndex(object) {
    		var indexFn = expression();

    		consume('R_BRACKET');

    		return function() {
    			var o = object(),
    				i = indexFn();

    			if (typeof o != 'object' || o == null) return undefined;

    			return o[i];
    		};
    	}

    	function objectMember(object) {
    		var token = expect();

    		return function() {
    			var o = object();

    			//if (typeof o == 'undefined') return undefined;

    			if (token.name == 'METHOD') {
                    //if (o == null) return o;
                    var type = typeof o;
                    //if (Array.isArray(o)) type = 'array';
                    if (type == 'object') {
                        type = Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
                    }
    				return type == 'object' && typeof o['__' + token.value] == 'function'
    					? o['__' + token.value]
    					: dmx.__formatters[type] && dmx.__formatters[type][token.value] || function() {
        					if (o != null && console.warn) console.warn('Formatter ' + token.value + ' doesn\'t exist for type ' + type);
        					return undefined;
        				};
    			}

    			return o && o.hasOwnProperty(token.value) ? o[token.value] : undefined;
    		};
    	}
    };

})();
