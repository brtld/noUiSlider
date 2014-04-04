/**@preserve
$.Link (part of noUiSlider) - WTFPL */

/*jslint browser: true */
/*jslint sub: true */
/*jslint white: true */

// ==ClosureCompiler==
// @externs_url http://refreshless.com/externs/jquery-1.8.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// ==/ClosureCompiler==

(function( $ ){

	'use strict';

	// Throw an error if formatting options are incompatible.
	function throwEqualError( F, a, b ) {
		if ( (F[a] || F[b]) && (F[a] === F[b]) ) {
			throwError("(Link) '"+a+"' can't match '"+b+"'.'");
		}
	}

	// Test in an object is an instance of jQuery or Zepto.
	function isInstance ( a ) {
		return a instanceof $ || ( $['zepto'] && $['zepto']['isZ'](a) );
	}

var
/** @const */ Formatting = [
/*  0 */  'decimals'
/*  1 */ ,'mark'
/*  2 */ ,'thousand'
/*  3 */ ,'prefix'
/*  4 */ ,'postfix'
/*  5 */ ,'encoder'
/*  6 */ ,'decoder'
/*  7 */ ,'negative'
/*  8 */ ,'negativeBefore'
/*  9 */ ,'to'
/* 10 */ ,'from'
	],
/** @const */ FormatDefaults = [
/*  0 */  2
/*  1 */ ,'.'
/*  2 */ ,''
/*  3 */ ,''
/*  4 */ ,''
/*  5 */ ,function(a){ return a; }
/*  6 */ ,function(a){ return a; }
/*  7 */ ,'-'
/*  8 */ ,''
/*  9 */ ,function(a){ return a; }
/* 10 */ ,function(a){ return a; }
	];


	/** @constructor */
	function Format( options ){

		// If no settings where provided, the defaults will be loaded.
		if ( options === undefined ){
			options = {};
		}

		if ( typeof options !== 'object' ){
			throwError("(Format) 'format' option must be an object.");
		}

		var settings = {};

		// Copy all values into a new object.
		$(Formatting).each(function(i, val){

			if ( options[val] === undefined ){

				settings[val] = FormatDefaults[i];

			// When we aren't loading defaults, validate the entry.
			} else if ( (typeof options[val]) === (typeof FormatDefaults[i]) ) {

				// Support for up to 7 decimals.
				// More can't be guaranteed due to floating point issues.
				if ( val === 'decimals' ){
					if ( options[val] < 0 || options[val] > 7 ){
						throwError("(Format) 'format.decimals' option must be between 0 and 7.");
					}
				}

				settings[val] = options[val];

			// If the value isn't valid, emit an error.
			} else {
				throwError("(Format) 'format."+val+"' must be a " + typeof FormatDefaults[i] + ".");
			}
		});

		// Some values can't be extracted from a
		// string if certain combinations are present.
		throwEqualError(settings, 'mark', 'thousand');
		throwEqualError(settings, 'prefix', 'negative');
		throwEqualError(settings, 'prefix', 'negativeBefore');

		this.settings = settings;
	}

	// Shorthand for internal value get
	Format.prototype.v = function ( a ) {
		return this.settings[a];
	};

	Format.prototype.to = function ( number ) {

		function reverse ( a ) {
			return a.split('').reverse().join('');
		}

		number = this.v('encoder')( number );

		var negative = '', preNegative = '', base = '', mark = '';

		if ( number < 0 ) {
			negative = this.v('negative');
			preNegative = this.v('negativeBefore');
		}

		// Round to proper decimal count
		number = Math.abs(number).toFixed( this.v('decimals') ).toString();
		number = number.split('.');

		// Rounding away decimals might cause a value of -0
		// when using very small ranges. Remove those cases.
		if ( parseFloat(number) === 0 ) {
			number[0] = '0';
		}

		// Group numbers in sets of three.
		if ( this.v('thousand') ) {
			base = reverse(number[0]).match(/.{1,3}/g);
			base = reverse(base.join(reverse( this.v('thousand') )));
		} else {
			base = number[0];
		}

		// Ignore the decimal separator if decimals are set to 0.
		if ( this.v('mark') && number.length > 1 ) {
			mark = this.v('mark') + number[1];
		}

		// Return the finalized formatted number.
		return this.v('to')(preNegative +
			this.v('prefix') +
			negative +
			base +
			mark +
			this.v('postfix'));
	};

	Format.prototype.from = function ( input ) {

		function esc(s){
			return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
		}

		var isNeg;
		// The set request might want to ignore this handle.
		// Test for 'undefined' too, as a two-handle slider
		// can still be set with an integer.
		if( input === null || input === undefined ) {
			return false;
		}

		// Remove formatting and set period for float parsing.
		input = input.toString();

		// Replace the preNegative indicator.
		isNeg = input.replace(new RegExp('^' + esc( this.v('negativeBefore') )), '');

		// Check if the value changed by removing the negativeBefore symbol.
		if( input !== isNeg ) {
			input = isNeg;
			isNeg = '-';
		} else {
			isNeg = '';
		}

		// If prefix is set and the number is actually prefixed.
		input = input.replace(new RegExp('^'+esc( this.v('prefix') )), '');

		// Only replace if a negative sign is set.
		if ( this.v['negative'] ) {

			// Reset isNeg to prevent double '-' insertion.
			isNeg = '';

			// Reset the negative sign to '-'
			input = input.replace(new RegExp('^'+esc( this.v('negative') )), '-');
		}

		// Clean the input string
		input = input
		// If postfix is set and the number is postfixed.
			.replace( new RegExp(esc( this.v('postfix') ) + '$'), '')
		// Remove the separator every three digits.
			.replace( new RegExp(esc( this.v('thousand') ), 'g'), '')
		// Set the decimal separator back to period.
			.replace( this.v('mark'), '.');

		// Run the user defined decoder. Returns input by default.
		input = this.v('decoder')( parseFloat( isNeg + input ) );

		// Ignore invalid input
		if (isNaN( input )) {
			return false;
		}

		return this.v('from')(input);
	};


/** @expose */
/** @constructor */
	function Link ( entry, update ) {

		if ( typeof entry !== "object" ) {
			$.error("(Link) Initialize with an object.");
		}

		// Make sure Link isn't called as a function, in which case
		// the 'this' scope would be the window.
		return new Link.prototype.init( entry['target']||function(){}, entry['method'], entry['format']||{}, update );
	}

	// Initialisor
	Link.prototype.init = function ( target, method, format, update ) {

		// In IE < 9, .bind() isn't available, need this link in .change().
	var that = this;

		// Write all formatting to this object.
		// No validation needed, as we'll merge these with the parent
		// format options first.
		this.formatting = format;

		// Store the update option.
		this.update = !update;

	var
		// Find the type of this link.
		isTooltip = ( typeof target === 'string' && target.indexOf('-tooltip-') === 0 ),
		isHidden = ( typeof target === 'string' && target.indexOf('-') !== 0 ),
		isMethod = ( typeof target === 'function' ),
		is$ = ( isInstance(target) ),
		isInput = ( is$ && target.is('input, select, textarea') ),
		methodIsFunction = ( is$ && typeof method === 'function' ),
		methodIsName = ( is$ && typeof method === 'string' && target[method] );

		// If target is a string, a new hidden input will be created.
		if ( isTooltip ) {

			// By default, use the 'html' method.
			this.method = method || 'html';

			// Use jQuery to create the element
			this.el = $( target.replace('-tooltip-', '') || '<div/>' )[0];

			return;
		}

		// If the string doesn't begin with '-', which is reserved, add a new hidden input.
		if ( isHidden ) {

			this.method = 'val';

			this.el = document.createElement('input');
			this.el.name = target;
			this.el.type = 'hidden';

			return;
		}

		// The target can also be a function, which will be called.
		if ( isMethod ) {
			this.target = false;
			this.method = target;
			return;
		}

		// If the target is and $ element.
		if ( is$ ) {

			// The method must exist on the element.
			if ( method && ( methodIsFunction || methodIsName ) ) {
				this.target = target;
				this.method = method;
				return;
			}

			// If a jQuery/Zepto input element is provided, but no method is set,
			// the element can assume it needs to respond to 'change'...
			if ( !method && isInput ) {

				// Default to .val if this is an input element.
				this.method = 'val';
				this.target = target;

				// Set the slider to a new value on change.
				this.target.on('change', function( e ){

					// Returns null array.
					function at(a,b,c){
						return [c?a:b, c?b:a];
					}

					var output = at(null, $(e.target).val(), that.N);

					that.obj.val(output, { 'link': that });
				});

				return;
			}

			// ... or not.
			if ( !method && !isInput ) {

				// Default arbitrarily to 'html'.
				this.method = 'html';
				this.target = target;

				return;
			}
		}

		throw new RangeError("Link: Invalid Link.");
	}

	// Provides external items with the slider value.
	Link.prototype.write = function ( value, handle, slider, update ) {

		// Don't synchronize this Link.
		if ( this.update && update === false ) {
			return;
		}

		this.actual = value;

		// Format values for display.
		value = this.format( value );

		// Store the numerical value.
		this.saved = value;

		// Branch between serialization to a function or an object.
		if ( typeof this.method === 'function' ) {
			// When target is undefined, the target was a function.
			// In that case, provided the slider as the calling scope.
			// Use [0] to get the DOM element, not the $ instance.
			this.method.call( this.target[0] || slider[0], value, handle, slider );
		} else {
			this.target[ this.method ]( value, handle, slider );
		}
	};

	// Set formatting options.
	Link.prototype.setFormatting = function ( options ) {
		this.formatting = new Format( $.extend({}, options, this.formatting ));
	};

	// Link.prototype.setScope = function ( scope ) {
		// this.scope = scope;
	// }

	Link.prototype.setObject = function ( obj ) {
		this.obj = obj;
	}

	Link.prototype.setIndex = function ( index ) {
		this.N = index;
	}

	// Parses slider value to user defined display.
	Link.prototype.format = function ( a ) {
		return this.formatting.to(a);
	};

	// Converts a formatted value back to a real number.
	Link.prototype.getValue = function ( a ) {
		return this.formatting.from(a);
	};

	// We can now test for Link.init to be an instance of Link.
	Link.prototype.init.prototype = Link.prototype;

	/** @expose */
	$.Link = Link;

}( window['jQuery'] || window['Zepto'] ));