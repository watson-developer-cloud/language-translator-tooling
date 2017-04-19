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

var express = require('express');

var controller = require('./models.controller');
var rest = require('../../config/rest');

var ENDPOINTS = {
  'baseModels' : '/:tenantId/baseModels',
  'customModels' : '/:tenantId/customModels',
  'customModel' : '/:tenantId/customModels/:customModelId',
  'trainModel' : '/:tenantId/customModels/:customModelId/train',
  'cloneModel' : '/:tenantId/customModels/:customModelId/clone',
  'resetTraining' : '/:tenantId/customModels/:customModelId/resetTraining',
  'statusOfModel' : '/:tenantId/customModels/:customModelId/status',
  'trainingLog' : '/:tenantId/customModels/:customModelId/trainingLog',
  'translate' : '/:tenantId/customModels/:customModelId/translate'
};

var router = express.Router();

router.use(ENDPOINTS.baseModels, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.customModels, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.customModel, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.trainModel, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.cloneModel, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.resetTraining, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.statusOfModel, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.trainingLog, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.translate, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());

router.get(ENDPOINTS.baseModels, controller.getBaseModels);
router.get(ENDPOINTS.customModels, controller.getAllCustomModels);
router.get(ENDPOINTS.trainModel, controller.trainCustomModel);
router.get(ENDPOINTS.resetTraining, controller.resetTraining);
router.get(ENDPOINTS.statusOfModel, controller.getCustomModelStatus);
router.get(ENDPOINTS.trainingLog, controller.getCustomModelTrainingLog);

router.post(ENDPOINTS.customModels, controller.createCustomModel);
router.post(ENDPOINTS.cloneModel, controller.cloneCustomModel);
router.post(ENDPOINTS.translate, controller.translate);

router.put(ENDPOINTS.customModel, controller.updateCustomModel);

router.delete(ENDPOINTS.customModel, controller.deleteCustomModel);

module.exports = router;
