'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.publishEntities = publishEntities;
exports.unpublishEntities = unpublishEntities;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _getEntityName = require('./get-entity-name');

var _getEntityName2 = _interopRequireDefault(_getEntityName);

var _errorBuffer = require('../utils/error-buffer');

var _errorBuffer2 = _interopRequireDefault(_errorBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Publish a list of entities.
 * Does not return a rejected promise in the case of an error, pushing it
 * to an error buffer instead.
 */
function publishEntities(entities) {
  return _bluebird2.default.map(entities, function (entity, index) {
    if (!entity || !entity.publish) {
      _npmlog2.default.info('Error While publishing entity: undefined entity at index ' + index);
      return _bluebird2.default.resolve(entity);
    }
    return entity.publish().then(function (entity) {
      _npmlog2.default.info('Published ' + entity.sys.type + ' ' + (0, _getEntityName2.default)(entity));
      return entity;
    }, function (err) {
      _errorBuffer2.default.push(err);
      return entity;
    });
  });
}

/**
 * Unpublish a list of entities.
 * Returns a reject promise if unpublishing fails.
 */
function unpublishEntities(entities) {
  return _bluebird2.default.map(entities, function (entity, index) {
    if (!entity || !entity.unpublish) {
      _npmlog2.default.info('Error While Unpublishing: entity undefined entity at index ' + index);
      return _bluebird2.default.resolve(entity);
    }
    return entity.unpublish().then(function (entity) {
      _npmlog2.default.info('Unpublished ' + entity.sys.type + ' ' + (0, _getEntityName2.default)(entity));
      return entity;
    }, function (err) {
      // In case the entry has already been unpublished
      if (err.name === 'BadRequest') return entity;
      throw err;
    });
  });
}