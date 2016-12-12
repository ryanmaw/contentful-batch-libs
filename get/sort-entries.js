'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sortEntries;

var _collection = require('lodash/collection');

var _object = require('lodash/object');

var _o = _interopRequireWildcard(_object);

var _array = require('lodash/array');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Given a list of entries, this function reorders them so that entries which
 * are linked from other entries always come first in the order. This ensures
 * that when we publish entries, we are not publishing entries which contain
 * links to other entries which haven't been published yet.
 */
function sortEntries(entries) {
  var linkedEntries = getLinkedEntries(entries);

  var mergedLinkedEntries = mergeSort(linkedEntries, function (a) {
    var hli = hasLinkedIndexesInFront(a);
    if (hli) return -1;
    if (!hli) return 1;
    if (!hasLinkedIndexes(a)) return -1;
  });

  return (0, _collection.map)(mergedLinkedEntries, function (linkInfo) {
    return entries[linkInfo.index];
  });

  function hasLinkedIndexesInFront(item) {
    if (hasLinkedIndexes(item)) {
      return (0, _collection.some)(item.linkIndexes, function (index) {
        return index > item.index;
      });
    }
  }

  function hasLinkedIndexes(item) {
    return item.linkIndexes.length > 0;
  }
}

function getLinkedEntries(entries) {
  return (0, _collection.map)(entries, function (entry) {
    var entryIndex = entries.indexOf(entry);

    var rawLinks = (0, _collection.map)(entry.fields, function (field) {
      field = _o.values(field)[0];
      if (isEntryLink(field)) {
        return getFieldEntriesIndex(field, entries);
      } else if (isEntityArray(field) && isEntryLink(field[0])) {
        return (0, _collection.map)(field, function (item) {
          return getFieldEntriesIndex(item, entries);
        });
      }
    });

    return {
      index: entryIndex,
      linkIndexes: (0, _collection.filter)((0, _array.flatten)(rawLinks), function (index) {
        return index >= 0;
      })
    };
  });
}

function getFieldEntriesIndex(field, entries) {
  var id = _o.get(field, 'sys.id');
  return entries.findIndex(function (entry) {
    return entry.sys.id === id;
  });
}

function isEntryLink(item) {
  return _o.get(item, 'sys.type') === 'Entry' || _o.get(item, 'sys.linkType') === 'Entry';
}

function isEntityArray(item) {
  return Array.isArray(item) && item.length > 0 && _o.has(item[0], 'sys');
}

/**
 * From https://github.com/millermedeiros/amd-utils/blob/master/src/array/sort.js
 * MIT Licensed
 * Merge sort (http://en.wikipedia.org/wiki/Merge_sort)
 * @version 0.1.0 (2012/05/23)
 */
function mergeSort(arr, compareFn) {
  if (arr.length < 2) return arr;

  if (compareFn == null) compareFn = defaultCompare;

  var mid = ~~(arr.length / 2);
  var left = mergeSort(arr.slice(0, mid), compareFn);
  var right = mergeSort(arr.slice(mid, arr.length), compareFn);

  return merge(left, right, compareFn);
}

function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function merge(left, right, compareFn) {
  var result = [];

  while (left.length && right.length) {
    if (compareFn(left[0], right[0]) <= 0) {
      // if 0 it should preserve same order (stable)
      result.push(left.shift());
    } else {
      result.push(right.shift());
    }
  }

  if (left.length) result.push.apply(result, left);
  if (right.length) result.push.apply(result, right);

  return result;
}