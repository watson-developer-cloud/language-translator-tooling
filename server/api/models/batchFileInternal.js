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

var promise = require('bluebird');
var batches = require('../batches/batches');
var log = require('../../config/log');

/**
  Calls the batchFile service to create a batch, createOptions object contains property batch_id
  Returns a Promise function which will return the id of the batch created

*/
module.exports.createBatch = function createBatch(tenantId, createOptions) {
    batches.addBatch(tenantId, createOptions.batch_id, createOptions, function(err, batch) {
        if (!err) {
            log.info('returning ', batch);
            return createOptions.batch_id;
        } else {
            log.error(err);
            throw Error('BatchService service query failed', err)
        }
    });
}

/**
  Calls the batchFile service using the provided tenant Id and batch ID to get the list of files
  Returns a Promise function which will return the list of files as a JSON Array
  Assumes sensible batchId and tenantId as parameters.

*/
module.exports.getFilesForBatch = function getFilesForBatch(tenantId, batchId) {
    log.trace({
        tenant_id: tenantId,
        batchId: batchId,
    }, 'Getting files for the batch ');
    return promise.promisify(batches.getFiles)(tenantId, batchId)
    .then( function(files) {
            var result = files;
            log.debug({
                files: result
            }, ' files for the batch ');
            return promise.map(result, function(file) {
                log.info({
                    file: file
                }, 'i');
                return getFileContentsForBatch(tenantId, batchId, file).then(function(content) {
                 // content.pipe(process.stdout);
                 file.stream = content;
                    return file;
                });
            })
    });
}

/**
  Calls the batchFile service using the provided tenant Id and batch ID and file ID to get the contents  of  a file
  Returns a Promise function which will return the contenst of the file
  Assumes sensible batchId and tenantId and fileId as parameters.

*/
function getFileContentsForBatch(tenantId, batchId, file) {
    log.trace({
        tenant_id: tenantId,
        batchId: batchId,
        uuid: file.uuid
    }, 'Getting file contents for the batch file ');
    return promise.promisify(batches.getFileAsStream)(tenantId, batchId, file.uuid);

}


/**
  Calls the batchFile service to delete the provided batchId
  Returns a Promise function

*/
module.exports.deleteBatch = function deleteBatch(tenantId, batchId) {
  log.info('Deleting batch ', batchId);
    return promise.promisify(batches.deleteBatch)(tenantId, batchId);
}

/**
  Calls the batchFile service to clone the provided batch id
  Returns a Promise function which will return the batch JSON object for the clone

*/
module.exports.cloneBatch = function cloneBatch(tenantId, origBatchId, cloneOptions) {
  log.info('Cloning batch ', origBatchId, ' to ', cloneOptions);
  return promise.promisify(batches.cloneBatch)(tenantId, origBatchId, cloneOptions.batch_id)
  .then(function(cloned_batch) {
      log.info('cloned batch ', origBatchId, ' to ', cloneOptions);
      return cloned_batch;
  });
}
