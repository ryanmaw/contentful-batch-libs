'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.createEntities = createEntities;
exports.createEntries = createEntries;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _function = require('lodash/function');

var _collection = require('lodash/collection');

var _object = require('lodash/object');

var _getEntityName = require('./get-entity-name');

var _getEntityName2 = _interopRequireDefault(_getEntityName);

var _errorBuffer = require('../utils/error-buffer');

var _errorBuffer2 = _interopRequireDefault(_errorBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a list of entities
 * Applies to all entities except Entries, as the CMA API for those is slightly different
 * See handleCreationErrors for details on what errors reject the promise or not.
 */
function createEntities(context, entities, destinationEntities) {
  return _bluebird2.default.map(entities, function (entity) {
    var destinationEntity = getDestinationEntityForSourceEntity(destinationEntities, entity.transformed);
    var promise = destinationEntity ? updateDestinationWithSourceData(destinationEntity, entity.transformed) : createInDestination(context, entity.transformed);
    return promise.then((0, _function.partial)(creationSuccessNotifier, destinationEntity ? 'update' : 'create'), (0, _function.partial)(handleCreationErrors, entity));
  });
}

/**
 * Creates a list of entries
 */
function createEntries(context, entries, destinationEntries) {
  return _bluebird2.default.map(entries, function (entry) {
    return createEntry(entry, context.space, context.skipContentModel, destinationEntries);
  }).then(function (entries) {
    return entries.filter(function (entry) {
      return entry;
    });
  });
}

function createEntry(entry, space, skipContentModel, destinationEntries) {
  var contentTypeId = entry.original.sys.contentType.sys.id;
  var destinationEntity = getDestinationEntityForSourceEntity(destinationEntries, entry.transformed);
  var promise = destinationEntity ? updateDestinationWithSourceData(destinationEntity, entry.transformed) : createEntryInDestination(space, contentTypeId, entry.transformed);
  return promise.then((0, _function.partial)(creationSuccessNotifier, destinationEntity ? 'update' : 'create'), (0, _function.partial)(handleEntryCreationErrors, entry, space, skipContentModel, destinationEntries));
}

function updateDestinationWithSourceData(destinationEntity, sourceEntity) {
  var plainData = getPlainData(sourceEntity);
  (0, _object.assign)(destinationEntity, plainData);
  return destinationEntity.update();
}

function createInDestination(context, sourceEntity) {
  var id = (0, _object.get)(sourceEntity, 'sys.id');
  var plainData = getPlainData(sourceEntity);
  return id ? context.space['create' + context.type + 'WithId'](id, plainData) : context.space['create' + context.type](plainData);
}

function createEntryInDestination(space, contentTypeId, sourceEntity) {
  var id = sourceEntity.sys.id;
  var plainData = getPlainData(sourceEntity);
  return space.createEntryWithId(contentTypeId, id, plainData);
}

/**
 * Handles entity creation errors.
 * If the error is a VersionMismatch the error is thrown and a message is returned
 * instructing the user on what this situation probably means.
 */
function handleCreationErrors(entity, err) {
  // Handle the case where a locale already exists and skip it
  if ((0, _object.get)(err, 'error.sys.id') === 'ValidationFailed') {
    var errors = (0, _object.get)(err, 'error.details.errors');
    if (errors && errors.length > 0 && errors[0].name === 'taken') {
      return entity;
    }
  }
  if ((0, _object.get)(err, 'error.sys.id') === 'VersionMismatch') {
    _npmlog2.default.error('Content update error:');
    _npmlog2.default.error('Error', err.error);
    _npmlog2.default.error('Request', err.request);
    _npmlog2.default.error('\nThis probably means you are synchronizing over a space with previously existing\ncontent, or that you don\'t have the sync token for the last sync you performed\nto this space.\n    ');
  }
  throw err;
}

/**
 * Handles entry creation errors.
 * If a field doesn't exist, it means it has been removed from the content types
 * In that case, the field is removed from the entry, and creation is attempted again.
 */
function handleEntryCreationErrors(entry, space, skipContentModel, destinationEntries, err) {
  if (skipContentModel && err.name === 'UnknownField') {
    entry.transformed.fields = cleanupUnknownFields(entry.transformed.fields, err.error.details.errors);
    return createEntry(entry, space, skipContentModel, destinationEntries);
  }
  err.originalEntry = entry.original;
  err.transformedEntry = entry.transformed;
  err.contentModelWasSkipped = skipContentModel;
  _errorBuffer2.default.push(err);
  // No need to pass this entry down to publishing if it wasn't created
  return null;
}

function cleanupUnknownFields(fields, errors) {
  return (0, _object.omitBy)(fields, function (field, fieldId) {
    return (0, _collection.find)(errors, function (error) {
      var _error$path = (0, _slicedToArray3.default)(error.path, 2),
          errorFieldId = _error$path[1];

      return error.name === 'unknown' && errorFieldId === fieldId;
    });
  });
}

function getDestinationEntityForSourceEntity(destinationEntities, sourceEntity) {
  return (0, _collection.find)(destinationEntities, {
    sys: { id: (0, _object.get)(sourceEntity, 'sys.id', null) }
  });
}

function creationSuccessNotifier(method, createdEntity) {
  var verb = method[0].toUpperCase() + method.substr(1, method.length) + 'd';
  _npmlog2.default.info(verb + ' ' + createdEntity.sys.type + ' ' + (0, _getEntityName2.default)(createdEntity));
  return createdEntity;
}

function getPlainData(entity) {
  var data = entity.toPlainObject ? entity.toPlainObject() : entity;
  return (0, _object.omit)(data, 'sys');
}