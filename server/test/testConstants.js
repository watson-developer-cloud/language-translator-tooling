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
var constants = require('../api/models/constants.js');

var ltUrl ='http://testlt.api.url/language-translator/api';
var cloudantBatchesUrl = 'https://testuser:password@mytest.cloudant.com';

var urlModelsPrefix = '/api/models';
var urlBatchesPrefix = '/api/batches';

var testModel = {
  name: 'MyTestModel',
  description: 'I am a Unit Test model',
  base_model_id: 'com.ibm.mt.models.en-es-news',
  domain: 'news',
  source: 'en',
  target: 'es',
  project: 'UnitTestA',
  custom_model_id: '4df22b61eb978816b59b59fa55905899',
  trained_model_id: 'f7472f0c2aeeb5b4f24159e3c78f0a1d',
  file_batch_id: '4df22b61eb978816b59b59fa55905899BatchId',
  status: constants.statuses.TRAINED,
  status_date: 'NOW',
  metadata: {}
};

var testBadBatchModel = {
  name: 'MyBadBatchTestModel',
  description: 'I am a Unit Test model',
  base_model_id: 'com.ibm.mt.models.en-es-news',
  domain: 'news',
  source: 'en',
  target: 'es',
  project: 'UnitTestA',
  custom_model_id: '4df22b61eb978816b59b59fa55905899',
  trained_model_id: 'f7472f0c2aeeb5b4f24159e3c78f0a1d',
  file_batch_id: 'MYBADBatchId',
  status: constants.statuses.TRAINED,
  status_date: 'NOW',
  metadata: {}
};


var testClonedModel = {
  name: 'MyTestCloneModel',
  description: 'I am a Unit Test cloned model',
  base_model_id: 'com.ibm.mt.models.en-es-news',
  domain: 'news',
  source: 'en',
  target: 'es',
  project: 'UnitTestA',
  custom_model_id: '14e561f8a7675a9a94306648c0c12d5e',
  trained_model_id: constants.untrainedModelId,
  file_batch_id: '14e561f8a7675a9a94306648c0c12d5eBatchId',
  status: constants.statuses.FILESLOADED,
  status_date: 'NOW',
  metadata: {},
  cloned_from: '4df22b61eb978816b59b59fa55905899',
  cloned_date: 'NOW'
};

var testTenantId = 'UNIT_TESTS';
var test_rev = '2-4b1ff45e90756b619a3229cfd7043231';
var test_rev_postUpdate = '3-4b1ff45e90756b619a3229cfd7043231';

var test_batch_rev = '7-9e33399fb57d36eb519f121c184e6ec5';

var file1_uuid="29e00c56-875e-4b8e-ad15-file1";
var file2_uuid="29e00c56-875e-4b8e-ad15-file2";
var file3_uuid="29e00c56-875e-4b8e-ad15-file3";

var checkModel = function(model) {
  if (!(model instanceof Object)) return 'Not an Object';
  if (model.name !== testModel.name) return ' Name should be ' + testModel.name;
  if (model.description !== testModel.description) return ' Description should be ' + testModel.description;
  if (model.base_model_id !== testModel.base_model_id) return ' base_model_id should be ' + testModel.base_model_id;
  if (model.domain !== testModel.domain) return ' domain should be ' + testModel.domain;
  if (model.source !== testModel.source) return ' source language should be ' + testModel.source;
  if (model.target !== testModel.target) return ' target language should be ' + testModel.target;
  if (model.project !== testModel.project) return ' project should be ' + testModel.project;
  if (model.custom_model_id !== testModel.custom_model_id) return ' custom_model_id should be ' + testModel.custom_model_id;
  if (model.trained_model_id !== testModel.trained_model_id) return ' trained_model_id should be ' + testModel.trained_model_id;
  if (model.file_batch_id !== testModel.file_batch_id) return ' file_batch_id should be ' + testModel.file_batch_id;
  if (model.status !== testModel.status) return ' status should be ' + testModel.status;
  if (typeof model.status_date === 'undefined') return ' No status_date defined';
  if (!(model.metadata instanceof Object)) return 'Metadata container not present';
  if (Object.keys(model).length !== 13) throw 'Too many keys for model object returned'
}

module.exports.ltUrl = ltUrl;
module.exports.urlModelsPrefix = urlModelsPrefix;
module.exports.urlBatchesPrefix = urlBatchesPrefix;
module.exports.cloudantBatchesUrl = cloudantBatchesUrl;
module.exports.testTenantId = testTenantId;

module.exports.testModel = testModel;
module.exports.testBadBatchModel = testBadBatchModel;
module.exports.testClonedModel = testClonedModel;
module.exports.checkModel = checkModel;

module.exports.test_rev = test_rev;
module.exports.test_batch_rev = test_batch_rev;
module.exports.file1_uuid = file1_uuid;
module.exports.file2_uuid = file2_uuid;
module.exports.file3_uuid = file3_uuid;
module.exports.test_batch_rev = test_rev_postUpdate
