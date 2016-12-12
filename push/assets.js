'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processAssets = processAssets;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _getEntityName = require('./get-entity-name');

var _getEntityName2 = _interopRequireDefault(_getEntityName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function processAssets(assets) {
  return _bluebird2.default.map(assets, function (asset) {
    _npmlog2.default.info('Processing Asset ' + (0, _getEntityName2.default)(asset));
    return asset.processForAllLocales();
  });
}