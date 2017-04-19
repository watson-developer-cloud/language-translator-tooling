/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

var log = require('../config/log');

//base Error is function Error(msg,id) {}
//Base LTError
function LTError (message, errorCode, inserts) {
  Error.call(this, message);
  this.name = this.constructor.name;
  this.message = message;
  this.errorCode = errorCode;
  this.inserts = inserts;
  //stack held as .stack
  Error.captureStackTrace(this, this.constructor);
}
LTError.prototype = Object.create(Error.prototype);
LTError.prototype.constructor = LTError;
module.exports.LTError = LTError;

//****LT Tooling Errors
function LTToolingError (message, errorCode, inserts, httpStatusCode) {
  LTError.call(this, message, errorCode, inserts);
  this.name = this.constructor.name;
  this.httpStatusCode = httpStatusCode;
  log.error(this);
}
LTToolingError.prototype = Object.create(LTError.prototype);
LTToolingError.prototype.constructor = LTToolingError;
module.exports.LTToolingError = LTToolingError;

//****LT Service Component Errors
function LTServiceError (message, errorCode, inserts, httpStatusCode) {
  LTError.call(this, message, errorCode, inserts);
  this.name = this.constructor.name;
  this.httpStatusCode = httpStatusCode;
  log.error(this);
}
LTServiceError.prototype = Object.create(LTError.prototype);
LTServiceError.prototype.constructor = LTServiceError;
module.exports.LTServiceError = LTServiceError;

//****BatchStore Component Errors
function BatchError (message, errorCode, inserts, httpStatusCode) {
  LTError.call(this, message, errorCode, inserts);
  this.name = this.constructor.name;
  this.httpStatusCode = httpStatusCode;
  log.error(this);
}
BatchError.prototype = Object.create(LTError.prototype);
BatchError.prototype.constructor = BatchError;
module.exports.BatchError = BatchError;

//Any very specific Errors we can consume and handle
function LtDuplicateDetectedError (message, errorCode, inserts, httpStatusCode) {
  LTError.call(this, message, errorCode, inserts);
  this.name = this.constructor.name;
  this.httpStatusCode = httpStatusCode;
  log.error(this);
}
LtDuplicateDetectedError.prototype = Object.create(LTError.prototype);
LtDuplicateDetectedError.prototype.constructor = LtDuplicateDetectedError;
module.exports.LtDuplicateDetectedError = LtDuplicateDetectedError;

//batch error descendants
function BatchNotFoundError (message, errorCode, inserts, httpStatusCode) {
  BatchError.call(this, message, errorCode, inserts, httpStatusCode);
  this.name = this.constructor.name;
}
BatchNotFoundError.prototype = Object.create(BatchError.prototype);
BatchNotFoundError.prototype.constructor = BatchNotFoundError;
module.exports.BatchNotFoundError = BatchNotFoundError;

