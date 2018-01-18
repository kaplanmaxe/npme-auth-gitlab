'use strict';

var defaultMsg = {
  500: 'Unknown error',
  401: 'Unauthorized',
  404: 'Not found'
};

var forCode = exports.forCode = function forCode(code, msg) {
  code = code || 500;
  var error = Error(msg || defaultMsg[code]);
  error.statusCode = code;
  return error;
};

exports.defer = function defer(cb, code, msg) {
  process.nextTick(function () {
    cb(forCode(code, msg));
  });
};