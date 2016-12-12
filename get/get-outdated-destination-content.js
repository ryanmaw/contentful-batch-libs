'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getOutdatedDestinationContent;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BATCH_CHAR_LIMIT = 1990;

/**
 * Gets content from a space which will have content copied to it, based on a
 * collection of existing content.
 *
 * Only the supplied entry/asset IDs will be retrieved. All contentTypes
 * and Locales will be retrieved.
 */
function getOutdatedDestinationContent(_ref) {
  var managementClient = _ref.managementClient,
      spaceId = _ref.spaceId,
      _ref$entryIds = _ref.entryIds,
      entryIds = _ref$entryIds === undefined ? [] : _ref$entryIds,
      _ref$assetIds = _ref.assetIds,
      assetIds = _ref$assetIds === undefined ? [] : _ref$assetIds,
      _ref$webhookIds = _ref.webhookIds,
      webhookIds = _ref$webhookIds === undefined ? [] : _ref$webhookIds,
      skipContentModel = _ref.skipContentModel,
      skipContent = _ref.skipContent;

  _npmlog2.default.info('Checking if destination space already has any content and retrieving it');

  return managementClient.getSpace(spaceId).then(function (space) {
    return _bluebird2.default.props({
      contentTypes: skipContentModel ? _bluebird2.default.resolve([]) : space.getContentTypes().then(extractItems),
      entries: skipContent ? _bluebird2.default.resolve([]) : batchedIdQuery(space, 'getEntries', entryIds),
      assets: skipContent ? _bluebird2.default.resolve([]) : batchedIdQuery(space, 'getAssets', assetIds),
      locales: skipContentModel ? _bluebird2.default.resolve([]) : space.getLocales().then(extractItems),
      webhooks: []
    });
  }, function (err) {
    _npmlog2.default.error('\nThe destination space was not found. This can happen for multiple reasons:\n- If you haven\'t yet, you should create your space manually.\n- If your destination space is in another organization, and your user from the source space does not have access to it, you\'ll need to specify separate sourceManagementToken and destinationManagementToken\n\nFull error details below.\n');
    throw err;
  });
}

function batchedIdQuery(space, method, ids) {
  return _bluebird2.default.reduce(getIdBatches(ids), function (fullResponse, batch) {
    return space[method]({ 'sys.id[in]': batch }).then(function (response) {
      fullResponse = fullResponse.concat(response.items);
      return fullResponse;
    });
  }, []);
}

function extractItems(response) {
  return response.items;
}

function getIdBatches(ids) {
  var batches = [];
  var currentBatch = '';
  while (ids.length > 0) {
    var id = ids.splice(0, 1);
    currentBatch += id;
    if (currentBatch.length > BATCH_CHAR_LIMIT || ids.length === 0) {
      batches.push(currentBatch);
      currentBatch = '';
    } else {
      currentBatch += ',';
    }
  }
  return batches;
}