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

var batchStore = require('../../components/batchStore');
var log = require('../../config/log');
var fileStore = require('../../components/fileStore');
var HTTPStatus = require('http-status');
var promise = require('bluebird');

exports.getAllBatches = function getAllBatches(tenantId, callback) {
  batchStore.getAllBatches(tenantId, callback);
};

exports.addBatch = function addBatch(tenantId, batch_id, batch, callback) {
  batchStore.addBatch(tenantId, batch, batch_id, callback);
};

exports.getFiles = function getFiles(tenantId, batchId, callback) {
  log.info({
    batch_id: batchId
  }, "Getting all files for a batch");

  batchStore.getBatch(tenantId, batchId, function (err, batch) {
    if (!err) {
      log.info({
        files: batch.batch
      }, "Got files");

      callback(null, batch.batch);
    } else {
      log.error(err);
      callback(err);
    }

  })
};

exports.getFileAsStream = function getFile(tenantId, batchId, uuid, callback) {
  log.info({
    file_id: uuid
  }, "Getting file");
  fileStore.getFileAsStream(tenantId, uuid, callback);
}

exports.getFile = function getFile(tenantId, batchId, uuid, callback) {
  log.info({
    file_id: uuid
  }, "Getting file");
  fileStore.getFile(tenantId, uuid, callback);
};

exports.deleteFileByUUID = function deleteFileByUUID(tenantId, uuid, whilstDeletingBatch, callback) {
  log.info({
    uuid: uuid
  }, "Deleting file by uuid");

  batchStore.countFileUse(tenantId, uuid,
    function (err, count) {

      if (((count === 0) && !whilstDeletingBatch) || ((count === 1) && whilstDeletingBatch)) {
        fileStore.deleteFile(tenantId, uuid, function (err, body) {
          if (err) {
            log.error(err);
            callback({err: err, tenantId: tenantId, fileUUID: uuid, deleted: 'failed'});
          } else {
            log.info({
              uuid: uuid
            }, "Deleted file");
            callback(null, {tenantId: tenantId, fileUUID: uuid, deleted: 'yes'});
          }
        });
      } else {
        log.info('Skipping deleting file its in use elsewhere');
        callback(null, {tenantId: tenantId, fileUUID: uuid, deleted: 'no'});
      }
    });
};

exports.deleteBatch = function deleteBatch(tenantId, batchId, callback) {
  log.info({
    batch_id: batchId
  }, "Deleting batch");

  batchStore.getBatch(tenantId, batchId, function (err, body) {
      // get revision of latest doc
      if (!err) {
        log.info({
          batch: body.batch
        }, "Got latest revision of batch");
        var error = false;

        log.info(body.batch.length + " files to be deleted");
        var arrayofFileDeletionPromises = [];

        for (var i = 0; i < body.batch.length && !error; ++i) {
          var uuid = body.batch[i].uuid;
          log.info({
            uuid: body.batch[i].uuid
          }, "Attempting to delete file");
          arrayofFileDeletionPromises.push(promise.promisify(exports.deleteFileByUUID)(tenantId, uuid, true));
        }

        promise.settle(arrayofFileDeletionPromises).then(function (deleteFilesResults) {
          if (deleteFilesResults && (deleteFilesResults.length > 0)) {
            deleteFilesResults.forEach(function (deleteFileResult) {
              if (deleteFileResult._settledValue.deleted === 'failed') {
                error = true;
              }
            });
          }
          if (!error) {
            log.info("All file deletions handled successfully");
            // destroy doc with revision set
            var deleteBatchPromise = promise.promisify(batchStore.deleteBatch);
            deleteBatchPromise(tenantId, batchId, body._rev).then(function (deleteBatchPromiseResult) {
              log.info({deleteBatchPromiseResult:deleteBatchPromiseResult}, ' batch deleted');
              callback(null, deleteBatchPromiseResult);
            })
              .catch(function (e) {
              log.error(e);
                callback(e, null);
              });
          } else {
            // TODO: Revert deleted files?
            callback({tenantId: tenantId, batchId: batchId, deleted: 'no'});
          }
        });
      }
      else {
        log.error(err);
        callback(err);
      }
    }
  );
};

exports.cloneBatch = function cloneBatch(tenantId, origBatchId, cloneBatchId, callback) {
  log.info({
    batch_id: origBatchId
  }, "Cloning batch");

  batchStore.getBatch(tenantId, origBatchId, function (err, body) {
    if (!err) {
      log.info({
        batch_id: origBatchId
      }, "Got batch");

      delete body._id;
      delete body._rev;
      body.batch_id = cloneBatchId;

      log.info({
        file_batch_id: cloneBatchId
      }, "Creating clone");

      batchStore.addBatch(tenantId, body, cloneBatchId, callback);
    } else {
      log.info(err);
      callback(err);
    }
  });
};

exports.deleteFile = function deleteFile(tenantId, batchId, fileName, callback) {

  // get batch
  batchStore.getBatch(tenantId, batchId, function (err, body) {
    if (!err) {
      log.info({
        batch: body
      }, "Got batch");

      // find file in batch
      var index = -1;
      for (var i = 0; i < body.batch.length; ++i) {
        if (body.batch[i].file_name === fileName) {
          index = i;
          break;
        }
      }

      if (index > -1) {
        log.info("Found file in batch");

        // remove file from batch
        var uuid = body.batch[i].uuid;
        body.batch.splice(index, 1);

        // upload new batch
        batchStore.updateBatch(tenantId, body, body._id, function (err, body) {
          if (!err) {
            log.info({
              batch: body
            }, "Removed file from batch");

            log.info("Deleting file from Object Store");

            // delete file from object store
            exports.deleteFileByUUID(tenantId, uuid, false, function (uuiderr, body) {
              if (uuiderr) {
                var error = uuiderr;
              }

              body.batchID = batchId;

              if (uuiderr) {
                log.error(uuiderr);
                callback(uuiderr);
              } else {
                log.info("Deleted file from Object Store");
                callback(null, body);
              }
            });
          } else {
            log.error(err);
            callback(err);
          }
        });
      } else {
        var error = new Error("File not found in batch");
        error.statusCode = 404;
        log.error(error);
        callback(error);
      }
    } else {
      log.error(err);
      callback(err);
    }
  });
};
