"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getEntityName;
function getEntityName(entity) {
  return entity.name || entity.sys.id;
}