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

var controller = require('./reconcile.controller');
var rest = require('../../config/rest');

var ENDPOINTS = {
  'status' : '/:tenantId/status',
  'reconcile' : '/:tenantId/reconcile',
  'reconcileCustomModel' : '/:tenantId/reconcile/:customModelID'
};

var router = express.Router();

router.use(ENDPOINTS.status, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.reconcile, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.reconcileCustomModel, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());

router.get(ENDPOINTS.status, controller.status);
router.get(ENDPOINTS.reconcile, controller.reconcile);
router.get(ENDPOINTS.reconcileCustomModel, controller.reconcileCustomModel);

module.exports = router;
