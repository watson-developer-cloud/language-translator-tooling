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

var commonCloudant = require('../common-cloudant');
var log = require('../../config/log');
var promise = require('bluebird');
var batchStoreDB;
var db_name = 'mt_files';
var HTTPStatus = require('http-status');
var dbdesigns = require('./db/designs');
var common = require('../../components/common');

function setupDB(callback) {

  promise.promisify(commonCloudant)(db_name, dbdesigns)
    .then(promise.promisifyAll)
    .then(function (dbHandle) {
      batchStoreDB = dbHandle;
      callback(null, dbHandle);
    })
}
module.exports.setupDB = setupDB;

exports.getAllBatches = function getAllBatches(tenantId, callback) {
  log.info({tenantId: tenantId}, 'Getting all batches for tenant');
  batchStoreDB.view('batches', 'byTenant',
    {
      key: [tenantId]
    },
    function (err, body) {
      if (!err) {
        var result = [];
        log.info('Found batches ', body);
        body.rows.forEach(function (row) {
          result.push(row.value);
        });
        callback(null, result);
      } else {
        log.error(err);
        callback(err);
      }
    })
};

exports.addBatch = function addBatch(tenantId, batch, batch_id, callback) {
  if (!batch.batch) {
    batch.batch = [];
  }
  batch.tenant_id = tenantId;
  log.info({
    batch_id: batch_id
  }, "Creating a new batch");

  batchStoreDB.insert(batch, batch_id, function (err, body) {
    if (!err) {
      log.info({
        batch: body
      }, "Created a new batch");
      callback(null, body);
    } else {
      log.error(err);
      callback(err);
    }
  });
};

function updateBatch(tenantId, batch, batch_id, callback) {
  if (!batch.batch) {
    batch.batch = [];
  }
  log.info({
    batch: batch
  }, "Updated batch");
  batch.tenant_id = tenantId;

  batchStoreDB.insert(batch, batch_id, function (err, body) {
    if (!err) {
      log.info({
        batch: body
      }, "Updated batch");
      callback(null, body);
    } else {
      log.error(err);
      callback(err);
    }
  });
}
module.exports.updateBatch = updateBatch;

exports.getBatch = function getBatch (tenantId, batchId, callback) {
  log.info({
    batch_id : batchId
  }, 'Getting batch');

  batchStoreDB.view('batches', 'byTenantId',
    {key : [tenantId, batchId]},
    function (err, body, headers) {
      if (!err) {
        if (headers.statusCode === HTTPStatus.OK) {
          if (body.rows.length < 1) {
            log.error({batchId : batchId}, 'Batch not found ');
            callback(new common.BatchNotFoundError('BatchNotFound', null, null, HTTPStatus.NOT_FOUND));
          }
          else {
            log.info('Found batch details :', body);
            callback(null, body.rows[0].value);
          }
        } else {
          log.error('files db response code is not ' + HTTPStatus.OK + ', it is ', headers.statusCode);
          var mynewerr = new Error('batch query failed', body);
          callback(mynewerr);
        }
      } else {
        log.error(err);
        callback(err);
      }
    });

};

exports.getBatchSize = function getBatchSize (tenantId, batchId, callback) {
  log.info({
    batch_id : batchId
  }, 'Getting batch');

  batchStoreDB.view('batches', 'batchSize',
    {key : [tenantId, batchId]},
    function (err, body, headers) {
      if (!err) {
        if (headers.statusCode === HTTPStatus.OK) {
          if (body.rows.length < 1) {
            log.error({batchId : batchId}, 'Batch not found ');
            callback(new common.BatchNotFoundError('BatchNotFound', null, null, HTTPStatus.NOT_FOUND));
          }
          else {
            log.info('Found batch size :', body);
            callback(null, body.rows[0].value);
          }
        } else {
          log.error('files db response code is not ' + HTTPStatus.OK + ', it is ', headers.statusCode);
          var mynewerr = new Error('batch size query failed', body);
          callback(mynewerr);
        }
      } else {
        log.error(err);
        callback(err);
      }
    });
};

exports.deleteBatch = function deleteBatch(tenantId, batchId, rev, callback) {
  log.info({
    batch_id: batchId
  }, "Deleting batch");

  batchStoreDB.destroy(batchId, rev, function (err, body) {
    if (!err) {
      log.info({
        batch_id: batchId,
        rev: body._rev
      }, "Deleted batch");
      callback(null, {tenantId: tenantId, batchId: batchId, deleted: 'yes'});
    } else {
      log.error(err);
      callback({err: err, tenantId: tenantId, batchId: batchId, deleted: 'yes'});
    }
  });
};

exports.countFileUse = function countFileUse(tenantId, uuid, callback) {
  batchStoreDB.view('files', 'countFileUse',
    {key: [tenantId, uuid]},
    function (err, body, headers) {
      if (!err) {
        if (body.rows.length === 0) {
          callback(null, 0);
        }
        else {
          callback(null, body.rows[0].value);
        }
      } else {
        log.error(err);
        callback(err);
      }

    });
};
