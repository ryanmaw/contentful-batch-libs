'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var deliveryClient = _ref.deliveryClient,
      managementClient = _ref.managementClient,
      sourceSpaceId = _ref.sourceSpaceId,
      nextSyncTokenFile = _ref.nextSyncTokenFile,
      syncFromScratch = _ref.syncFromScratch,
      _ref$skipContentModel = _ref.skipContentModel,
      skipContentModel = _ref$skipContentModel === undefined ? false : _ref$skipContentModel,
      _ref$skipContent = _ref.skipContent,
      skipContent = _ref$skipContent === undefined ? false : _ref$skipContent;

  return generateSyncConfig(nextSyncTokenFile, syncFromScratch)
  // get entries and assets
  .then(function (syncConfig) {
    _npmlog2.default.info('Getting content from source space via the sync api');

    if (!skipContent) {
      syncConfig.resolveLinks = false;
      return deliveryClient.sync(syncConfig).then(function (response) {
        return {
          entries: (0, _sortEntries2.default)(response.entries),
          assets: response.assets,
          webhooks: [],
          deletedEntries: response.deletedEntries,
          deletedAssets: response.deletedAssets,
          nextSyncToken: response.nextSyncToken,
          isInitialSync: !!syncConfig.initial
        };
      });
    } else {
      return {
        entries: [],
        assets: [],
        webhooks: [],
        deletedEntries: [],
        deletedAssets: []
      };
    }
  })
  // get content types
  .then(function (response) {
    if (!skipContentModel) {
      return managementClient.getSpace(sourceSpaceId).then(function (space) {
        return space.getContentTypes().then(function (contentTypes) {
          response.contentTypes = contentTypes.items;
          return response;
        });
      });
    } else {
      response.contentTypes = [];
      return response;
    }
  })
  // get locales
  .then(function (response) {
    if (!skipContentModel) {
      return deliveryClient.getSpace().then(function (space) {
        response.locales = space.locales;
        return response;
      });
    } else {
      response.locales = [];
      return response;
    }
  });
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _sortEntries = require('./sort-entries');

var _sortEntries2 = _interopRequireDefault(_sortEntries);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function generateSyncConfig(nextSyncTokenFile, syncFromScratch) {
  return _fs2.default.readFileAsync(nextSyncTokenFile, 'utf-8').then(function (nextSyncToken) {
    return nextSyncToken && !syncFromScratch ? { nextSyncToken: nextSyncToken } : { initial: true };
  }, function () {
    return { initial: true };
  });
}

/**
 * Gets all existing content types, locales, entries and assets, from a space
 * intended to be used as a source to be copied somewhere else or manipulated.
 *
 * For entries and assets it uses the sync API, so it can get only the entities
 * which were changed, created or deleted since the last sync, based on a sync token
 *
 * Entries are sorted so that entries which are linked to by other entries come
 * first in the list. This is so that if those entries are copied somewhere else,
 * there are no link reference errors when creating and publishing new entries.
 */