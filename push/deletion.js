'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteEntities = deleteEntities;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _getEntityName = require('./get-entity-name');

var _getEntityName2 = _interopRequireDefault(_getEntityName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Deletes a list of entities, which should've been previously unpublished.
 */
function deleteEntities(entities) {
  return _bluebird2.default.map(entities, function (entity, index) {
    if (!entity || !entity.delete) {
      _npmlog2.default.info('Error While deleting entity: undefined entity at index ' + index);
      return _bluebird2.default.resolve(entity);
    }
    return entity.delete().then(function () {
      _npmlog2.default.info('Deleted ' + entity.sys.type + ' ' + (0, _getEntityName2.default)(entity));
      return entity;
    }, function (err) {
      if (err.name === 'DefaultLocaleNotDeletable') {
        return entity;
      } else {
        throw err;
      }
    });
  });
}