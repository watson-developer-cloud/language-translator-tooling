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

var statuses = {
  UNKNOWN : 'UNKNOWN',
  CREATED : 'CREATED',
  FILESLOADED : 'FILESLOADED',
  TRAINING : 'TRAINING',
  TRAINED : 'TRAINED',
  WARNING : 'WARNING'
};

var errorDetails = {
  UNKNOWN : 'UNKNOWN',
  BADFILE : 'BADFILE',
  INSUFFICIENTSEGMENTS : 'INSUFFICIENTSEGMENTS'
};

module.exports.statuses = statuses;
module.exports.errorDetails = errorDetails;

var UNTRAINED_MODELID = 'UNTRAINED';
module.exports.UNTRAINED_MODELID = UNTRAINED_MODELID;
