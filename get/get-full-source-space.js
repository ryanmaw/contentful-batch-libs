'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFullSourceSpace;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MAX_ALLOWED_LIMIT = 1000;
var pageLimit = MAX_ALLOWED_LIMIT;
/**
 * Gets all the content from a space via the management API. This includes
 * content in draft state.
 */
function getFullSourceSpace(_ref) {
  var managementClient = _ref.managementClient,
      deliveryClient = _ref.deliveryClient,
      spaceId = _ref.spaceId,
      skipContentModel = _ref.skipContentModel,
      skipContent = _ref.skipContent,
      skipWebhooks = _ref.skipWebhooks,
      skipRoles = _ref.skipRoles,
      maxAllowedLimit = _ref.maxAllowedLimit;

  pageLimit = maxAllowedLimit || MAX_ALLOWED_LIMIT;
  _npmlog2.default.info('Getting content from source space');

  return managementClient.getSpace(spaceId).then(function (space) {
    return _bluebird2.default.props({
      contentTypes: skipContentModel ? [] : pagedGet(space, 'getContentTypes').then(extractItems),
      entries: skipContent ? [] : pagedGet(deliveryClient || space, 'getEntries').then(extractItems),
      assets: skipContent ? [] : pagedGet(space, 'getAssets').then(extractItems),
      locales: skipContentModel ? [] : pagedGet(space, 'getLocales').then(extractItems),
      webhooks: skipWebhooks ? [] : pagedGet(space, 'getWebhooks').then(extractItems),
      roles: skipRoles ? [] : pagedGet(space, 'getRoles').then(extractItems)
    }).then(function (response) {
      if (response.contentTypes.length !== 0) {
        response.editorInterfaces = getEditorInterfaces(response.contentTypes);
        return _bluebird2.default.props(response);
      }
      response.editorInterfaces = [];
      return response;
    }).then(function (response) {
      response.editorInterfaces = response.editorInterfaces.filter(function (editorInterface) {
        return editorInterface !== null;
      });
      return response;
    });
  }, function (err) {
    _npmlog2.default.error('\nThe destination space was not found. This can happen for multiple reasons:\n- If you haven\'t yet, you should create your space manually.\n- If your destination space is in another organization, and your user from the source space does not have access to it, you\'ll need to specify separate sourceManagementToken and destinationManagementToken\n\nFull error details below.\n');
    throw err;
  });
}
function getEditorInterfaces(contentTypes) {
  var editorInterfacePromises = contentTypes.map(function (contentType) {
    // old contentTypes may not have an editor interface but we'll handle in a later stage
    // but it should not stop getting the data process
    return contentType.getEditorInterface().catch(function () {
      return _bluebird2.default.resolve(null);
    });
  });
  return _bluebird2.default.all(editorInterfacePromises);
}

/**
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 */
function pagedGet(space, method) {
  var skip = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var aggregatedResponse = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  return space[method]({
    skip: skip,
    limit: pageLimit,
    order: 'sys.createdAt'
  }).then(function (response) {
    if (!aggregatedResponse) {
      aggregatedResponse = response;
    } else {
      aggregatedResponse.items = aggregatedResponse.items.concat(response.items);
    }
    if (skip + pageLimit <= response.total) {
      return pagedGet(space, method, skip + pageLimit, aggregatedResponse);
    }
    return aggregatedResponse;
  });
}

function extractItems(response) {
  return response.items;
}