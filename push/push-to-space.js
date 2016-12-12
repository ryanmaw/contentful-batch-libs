'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

exports.default = function (_ref) {
  var sourceContent = _ref.sourceContent,
      _ref$destinationConte = _ref.destinationContent,
      destinationContent = _ref$destinationConte === undefined ? {} : _ref$destinationConte,
      managementClient = _ref.managementClient,
      spaceId = _ref.spaceId,
      prePublishDelay = _ref.prePublishDelay,
      contentModelOnly = _ref.contentModelOnly,
      skipContentModel = _ref.skipContentModel,
      skipLocales = _ref.skipLocales,
      skipContentPublishing = _ref.skipContentPublishing,
      assetProcessDelay = _ref.assetProcessDelay;

  if (contentModelOnly && skipContentModel) {
    throw new Error('contentModelOnly and skipContentModel cannot be used together');
  }

  if (skipLocales && !contentModelOnly) {
    throw new Error('skipLocales can only be used together with contentModelOnly');
  }

  (0, _object.defaults)(sourceContent, DEFAULT_CONTENT_STRUCTURE);
  (0, _object.defaults)(destinationContent, DEFAULT_CONTENT_STRUCTURE);

  _npmlog2.default.info('Pushing content to destination space');

  return managementClient.getSpace(spaceId).then(function (space) {
    var result = _bluebird2.default.resolve();

    // Unpublish and delete Entries and Assets
    if (!contentModelOnly) {
      result = result.then((0, _partial2.default)(publishing.unpublishEntities, sourceContent.deletedEntries)).delay(prePublishDelay).then((0, _partial2.default)(deletion.deleteEntities, sourceContent.deletedEntries)).then((0, _partial2.default)(publishing.unpublishEntities, sourceContent.deletedAssets)).delay(prePublishDelay).then((0, _partial2.default)(deletion.deleteEntities, sourceContent.deletedAssets));
    }

    // Unpublish and delete Locales and Content Types
    // Create and publish new Locales and Content Types
    if (!skipContentModel) {
      if (!skipLocales) {
        result = result.then((0, _partial2.default)(deletion.deleteEntities, sourceContent.deletedLocales));
      }

      result = result.then((0, _partial2.default)(publishing.unpublishEntities, sourceContent.deletedContentTypes)).delay(prePublishDelay).then((0, _partial2.default)(deletion.deleteEntities, sourceContent.deletedContentTypes));

      if (!skipLocales) {
        result = result.then((0, _partial2.default)(creation.createEntities, { space: space, type: 'Locale' }, sourceContent.locales, destinationContent.locales));
      }
      result = result.then((0, _partial2.default)(creation.createEntities, { space: space, type: 'ContentType' }, sourceContent.contentTypes, destinationContent.contentTypes)).delay(prePublishDelay).then((0, _partial2.default)(publishing.publishEntities)).then(function (contentTypes) {
        var contentTypesWithEditorInterface = contentTypes.map(function (contentType) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            var _loop = function _loop() {
              var editorInterface = _step.value;

              if (editorInterface.sys.contentType.sys.id === contentType.sys.id) {
                return {
                  v: space.getEditorInterfaceForContentType(contentType.sys.id).then(function (ctEditorInterface) {
                    ctEditorInterface.controls = editorInterface.controls;
                    return ctEditorInterface.update();
                  })
                };
              }
            };

            for (var _iterator = (0, _getIterator3.default)(sourceContent.editorInterfaces), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _ret = _loop();

              if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          return _bluebird2.default.resolve();
        });
        return _bluebird2.default.all(contentTypesWithEditorInterface);
      });
    }

    // Create and publish Assets and Entries
    if (!contentModelOnly) {
      result = result.then((0, _partial2.default)(creation.createEntities, { space: space, type: 'Webhook' }, sourceContent.webhooks, destinationContent.webhooks)).delay(prePublishDelay);

      result = result.then((0, _partial2.default)(creation.createEntities, { space: space, type: 'Asset' }, sourceContent.assets, destinationContent.assets)).delay(prePublishDelay).then(function (assetsToProcess) {
        if (assetProcessDelay) {
          return _bluebird2.default.map(assetsToProcess, function (asset) {
            return assets.processAssets([asset]).delay(assetProcessDelay).then(function (processedAssets) {
              return processedAssets[0];
            });
          });
        } else {
          return assets.processAssets(assetsToProcess);
        }
      }).delay(prePublishDelay).then(function (entities) {
        return skipContentPublishing ? _bluebird2.default.resolve([]) : publishing.publishEntities(entities);
      }).then((0, _partial2.default)(creation.createEntries, { space: space, skipContentModel: skipContentModel }, sourceContent.entries, destinationContent.entries)).delay(prePublishDelay).then(function (entities) {
        return skipContentPublishing ? _bluebird2.default.resolve([]) : publishing.publishEntities(entities);
      });
    }

    return result;
  });
};

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _partial = require('lodash/partial');

var _partial2 = _interopRequireDefault(_partial);

var _object = require('lodash/object');

var _creation = require('./creation');

var creation = _interopRequireWildcard(_creation);

var _publishing = require('./publishing');

var publishing = _interopRequireWildcard(_publishing);

var _assets = require('./assets');

var assets = _interopRequireWildcard(_assets);

var _deletion = require('./deletion');

var deletion = _interopRequireWildcard(_deletion);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_CONTENT_STRUCTURE = {
  entries: [],
  assets: [],
  contentTypes: [],
  locales: [],
  deletedEntries: [],
  deletedAssets: [],
  deletedContentTypes: [],
  deletedLocales: [],
  webhooks: [],
  editorInterfaces: []
  // roles: []
};

/**
 * Pushes all changes, including deletions, to a given space. Handles (un)publishing
 * as well as delays after creation and before publishing.
 *
 * Creates everything in the right order so that a content type for a given entry
 * is there when entry creation for that content type is attempted.
 *
 * Allows only content model or only content pushing.
 *
 * Options:
 * - sourceContent: see DEFAULT_CONTENT_STRUCTURE
 * - destinationContent: see DEFAULT_CONTENT_STRUCTURE
 * - managementClient: preconfigured management API client
 * - spaceId: ID of space content is being copied to
 * - prePublishDelay: milliseconds wait before publishing
 * - assetProcessDelay: milliseconds wait inbetween each asset puslish
 * - contentModelOnly: synchronizes only content types and locales
 * - skipLocales: skips locales when synchronizing the content model
 * - skipContentModel: synchronizes only entries and assets
 * - skipContentPublishing: create content but don't publish it
 */