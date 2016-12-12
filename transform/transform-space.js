'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (space, destinationSpace) {
  // TODO maybe we don't need promises here at all
  var newSpace = (0, _object.omit)(space, 'contentTypes', 'entries', 'assets', 'locales', 'webhooks');
  return _bluebird2.default.reduce(['contentTypes', 'entries', 'assets', 'locales', 'webhooks'], function (newSpace, type) {
    return _bluebird2.default.map(space[type], function (entity) {
      return _bluebird2.default.resolve({
        original: entity,
        transformed: transformers[type](entity, destinationSpace[type])
      });
    }).then(function (entities) {
      newSpace[type] = entities;
      return newSpace;
    });
  }, newSpace);
};

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _object = require('lodash/object');

var _transformers = require('./transformers');

var transformers = _interopRequireWildcard(_transformers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }