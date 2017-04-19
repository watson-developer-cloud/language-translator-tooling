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
var bodyParser = require('body-parser');
var multer  = require('multer');

var controller = require('./batches.controller');
var rest = require('../../config/rest');

var ENDPOINTS = {
 'batches': '/:tenantId',
 'batch': '/:tenantId/:batchId',
 'clone': '/:tenantId/:batchId/clone',
 'files': '/:tenantId/:batchId/files',
 'file': '/:tenantId/:batchId/files/:fileId'
}

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(multer({ dest: 'uploads/'} ).single('file'));

router.use(ENDPOINTS.batches, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.batch, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.clone, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.files, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());
router.use(ENDPOINTS.file, rest.ensureAuthenticated, rest.ensureAuthorizedForTenant());


router.get(ENDPOINTS.batches, controller.getAllBatches);
router.get(ENDPOINTS.batch, controller.getBatch);
router.get(ENDPOINTS.files, controller.getFiles);
router.get(ENDPOINTS.file, controller.getFile);

router.post(ENDPOINTS.batches, controller.addBatch);
router.post(ENDPOINTS.clone, controller.cloneBatch);
router.post(ENDPOINTS.files, controller.addFile);

router.delete(ENDPOINTS.batch, controller.deleteBatch);
router.delete(ENDPOINTS.file, controller.deleteFile);

module.exports = router;
