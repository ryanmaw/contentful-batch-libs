'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createClients;

var _contentful = require('contentful');

var contentful = _interopRequireWildcard(_contentful);

var _contentfulManagement = require('contentful-management');

var contentfulManagement = _interopRequireWildcard(_contentfulManagement);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Generates object with delivery and management clients for both
 * source and destination spaces, as well as the space ids being used
 *
 * opts:
 * - sourceSpace
 * - sourceDeliveryToken
 * - sourceManagementToken
 * - destinationSpace
 * - destinationDeliveryToken
 * - destinationManagementToken
 */
function createClients(opts) {
  var clients = {};

  clients.source = {
    spaceId: opts.sourceSpace
  };
  var rateLimit = opts.rateLimit || 6;
  var rateLimitPeriod = opts.rateLimitPeriod || 1000;

  if (opts.sourceDeliveryToken) {
    clients.source.delivery = contentful.createClient({
      space: opts.sourceSpace,
      accessToken: opts.sourceDeliveryToken,
      host: opts.deliveryHost,
      port: opts.deliveryPort,
      rateLimit: rateLimit,
      rateLimitPeriod: rateLimitPeriod,
      insecure: opts.deliveryInsecure
    });
  }

  if (opts.sourceManagementToken) {
    clients.source.management = contentfulManagement.createClient({
      accessToken: opts.sourceManagementToken,
      host: opts.managementHost,
      port: opts.managementPort,
      rateLimit: rateLimit,
      rateLimitPeriod: rateLimitPeriod,
      insecure: opts.managementInsecure
    });
  }

  if (opts.destinationSpace) {
    clients.destination = {
      spaceId: opts.destinationSpace,
      management: contentfulManagement.createClient({
        accessToken: opts.destinationManagementToken,
        host: opts.managementHost,
        port: opts.managementPort,
        insecure: opts.managementInsecure
      })
    };
  }

  return clients;
}