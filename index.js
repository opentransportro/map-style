var path = require("path");
var forEach = require("lodash/forEach");
var includes = require("lodash/includes");
var merge = require("lodash/merge");
var mergeWith = require("lodash/mergeWith");
var cloneDeep = require("lodash/cloneDeep");

var BASE_STYLE = require("./hsl-gl-map-v9-base-style.json");
var ADDON_ROUTES_STYLE = require("./hsl-gl-map-v9-routes-addon.json");
var OVERLAY_STYLE = require("./hsl-gl-map-v9-overlay-style.json");
var ADDON_ICONS_STYLE = require("./hsl-gl-map-v9-icons-addon.json");
var ADDON_DRIVER_INSTRUCTIONS_STYLE = require("./hsl-gl-map-v9-driver-instructions-addon.json");
var ADDON_STOPS_STYLE = require("./hsl-gl-map-v9-stops-addon.json");
var ADDON_CITYBIKES_STYLE = require("./hsl-gl-map-v9-citybikes-addon.json")
var DEFAULT_LANGUAGE = "fi";

var replaceableValues = {
	LABEL_NAME: { default: "{name}" },
	SOURCES_URL: { default: "api.digitransit.fi/map/v1/" },
	GLYPHS_URL: { default:"http://localhost:8000/" },
};

function trimLanguage(lang) {
	return lang ===  DEFAULT_LANGUAGE ? "" : "_" + lang;
}

function findLayerById(layers, id) {
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id === id) {
			return i;
		}
	}
	return layers.length
}

/**
 * Creates values that replace the defaults in the base style
 * @param  {Object} options 				Received options that are used to create replacements
 * @param  {String|Array} options.lang 		Language, or array of languages to display on text labels
 * @return {Object}         				Replacement values that are used to modify the base style
 */
function getReplacements(options) {
	var replacements = {}
	if (options && options.lang) {
		var replacement;
		if (typeof(options.lang) == "string") {
			replacement = "{name" + trimLanguage(options.lang) + "}";
		} else {
			replacement = options.lang.reduce(function(prev, cur, index) {
				var separator = "   ";
				if (index === 0) separator = "";
				return prev + separator + "{name" + trimLanguage(cur) + "}";
			}, "")
		}
		replacements.LABEL_NAME = {
			replacement : replacement,
		};
	}
	if (options && options.sourcesUrl) {
		replacements.SOURCES_URL = { replacement : options.sourcesUrl };
	}
	if (options && options.glyphsUrl) replacements.GLYPHS_URL = { replacement : options.glyphsUrl };

	return replacements;
}

/**
 * Returns the extension styles that are used to extend the original style
 * @param  {Array} extensions  Received extensions that are used to determine the extension styles
 * @return {Array]}            List of extension styles
 */
function getExtensions(extensions) {
	var exts = [];
	if (includes(extensions, "routes")) {
		exts.push(ADDON_ROUTES_STYLE);
	}
	if (includes(extensions, "noText") === false) {
		exts.push(OVERLAY_STYLE);
	}
	if (includes(extensions, "icons")) {
		exts.push(ADDON_ICONS_STYLE);
	}
	if (includes(extensions, "driver_instructions")) {
		exts.push(ADDON_DRIVER_INSTRUCTIONS_STYLE);
	}
	if (includes(extensions, "stops")) {
		exts.push(ADDON_STOPS_STYLE);
	}
	if (includes(extensions, "citybikes")) {
		exts.push(ADDON_CITYBIKES_STYLE);
	}
	return exts;
}

/**
 * Replaces certain values in the basestyle, based on received options
 * @param  {Object} options 	Determines what values to replace
 * @return {Object}        		Modified style
 */
function replaceInStyle(style, options) {
	var values = merge(replaceableValues, getReplacements(options));
	var replacedStyle = JSON.stringify(style);

	forEach(values, function(value) {
		if (value.replacement) {
			var replaceableRegexp = new RegExp(value.default, "g");
			replacedStyle = replacedStyle.replace(replaceableRegexp, value.replacement);
		}
	})
	return JSON.parse(replacedStyle);
}

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

/**
 * Extends style with certain objects (e.g. layers, sources), based on received options
 * @param  {Object} style   	Style that is extended
 * @param  {Object} options 	Determines what extensions to add
 * @return {Object}         	Extended style
 */
function extendStyle(style, options) {
	if( !options ) {
		options = { extensions: [] };
	}

	if( !options.extensions ) {
		options.extensions = [];
	}

	var extensions = getExtensions(options.extensions);
	var extendedStyle = cloneDeep(style);

	forEach(extensions, function(extension) {
		extendedStyle = mergeWith(extendedStyle, extension, customizer);
	});

	return extendedStyle;
}

module.exports = {
	/**
	 * Generates a GL Map Style object based on received options
	 * @param  {Object} options Options used to generate the style object
	 * @return {Object}         Generated style object
	 */
	generateStyle: function(options) {
		var extendedStyle = extendStyle(BASE_STYLE, options);
		var replacedStyle = replaceInStyle(extendedStyle, options);

		return replacedStyle;
	}
}
