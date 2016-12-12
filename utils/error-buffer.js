"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var buffer = [];

exports.default = {
  push: function push(err) {
    buffer.push(err);
  },
  drain: function drain() {
    return buffer.splice(0, buffer.length);
  }
};