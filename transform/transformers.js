'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contentTypes = contentTypes;
exports.entries = entries;
exports.webhooks = webhooks;
exports.assets = assets;
exports.locales = locales;

var _object = require('lodash/object');

var _collection = require('lodash/collection');

/**
 * Default transformer methods for each kind of entity.
 *
 * In the case of assets it also changes the asset url to the upload property
 * as the whole upload process needs to be followed again.
 */

function contentTypes(contentType) {
  return contentType;
}

function entries(entry) {
  return entry;
}

function webhooks(webhook) {
  return webhook;
}

function assets(asset) {
  var transformedAsset = (0, _object.omit)(asset, 'sys');
  transformedAsset.sys = (0, _object.pick)(asset.sys, 'id');
  transformedAsset.fields = (0, _object.pick)(asset.fields, 'title', 'description');
  transformedAsset.fields.file = (0, _collection.reduce)(asset.fields.file, function (newFile, file, locale) {
    newFile[locale] = (0, _object.omit)(file, 'url', 'details');
    newFile[locale].upload = 'http:' + file.url;
    return newFile;
  }, {});
  return transformedAsset;
}

function locales(locale, destinationLocales) {
  var transformedLocale = (0, _object.pick)(locale, 'code', 'name', 'contentManagementApi', 'contentDeliveryApi', 'fallback_code', 'optional');
  var destinationLocale = (0, _collection.find)(destinationLocales, { code: locale.code });
  if (destinationLocale) {
    transformedLocale.sys = (0, _object.pick)(destinationLocale.sys, 'id');
  }

  return transformedLocale;
}