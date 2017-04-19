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

module.exports = {

  duplicateModelName : '1',
  UserNotAuthenticated :'2',
  UserNotAuthorized :'3',
  NoTenantSpecified : '4',
  unKnownLTError : '100',
  badLTResponse : '101',
  hostNotFound : '200',
  connectionReset : '201',
  connectionUnauthorized : '202',
  unknownTrainingErrorMessage : '203',
  glossaryCustomizationUnavailable : '204',
  badUrl : '205',
  badTrainingFileType : '206',
  badModelName : '207',
  badBaseModelId : '208',
  maxModelCustomizationsReached : '209',
  trainedModelNotFound : '210',
  wrongLTPlan : '211',
  duplicateFileUploaded : '212',
  fileSizeLimitExceeded : '213',
  batchSizeLimitExceeded : '214',
  forcedGlossaryFileSizeLimitExceeded : '215',
  forcedGlossaryTotalSizeLimitExceeded : '216'
};
