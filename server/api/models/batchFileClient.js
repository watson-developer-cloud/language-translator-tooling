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
var request = promise.promisifyAll(require('request'));
var log = require('../../config/log');
var env = require('../../config/environment');
// var util = require('./util');
var constants = require('./constants');
// var fileStorageUrl = util.getFileStorageApiUrl() + constants.urlPrefix;
// var fileStorageUrl = util.getFileStorageApiUrl();
var fileStorageUrl = env.fileStorageServiceUrl;
// module.exports.fileStorageUrl = fileStorageUrl;
var queryString = require('querystring');

/**
  Calls the batchFile service using the provided tenant Id and batch ID and file ID to get the contents  of  a file
  Returns a Promise function which will return the contenst of the file
  Assumes sensible batchId and tenantId and fileId as parameters.

*/
function getFileContentsForBatch(tenantId, batchId, file) {
  var options = {
    url: fileStorageUrl + '/batches/' + batchId + '/files/' + file.uuid
      // url: fileStorageUrl + '/' + tenantId + '/batches/' + batchId + '/files'
  }
  log.trace({
    tenant_id: tenantId,
    batchId: batchId,
    uuid: file.uuid,
    url: options.url
  }, 'Getting file contents for the batch file ');
  return request.getAsync(options).spread(function(response, body) {
    if (response.statusCode === 200) {
      log.info({
        contents: body
      }, 'Contents Received ');
      return body;

    } else {
      log.error({
        statusCode: response.statusCode
      }, 'FileServicError');
      throw Error('BatchService service query failed', response)
    }
  });
}



/**
  Calls the batchFile service using the provided tenant Id and batch ID to get the list of files
  Returns a Promise function which will return the list of files as a JSON Array
  Assumes sensible batchId and tenantId as parameters.

*/
module.exports.getFilesForBatch = function getFilesForBatch(tenantId, batchId) {
  var options = {
    url: fileStorageUrl + '/batches/' + batchId + '/files'
      // url: fileStorageUrl + '/' + tenantId + '/batches/' + batchId + '/files'
  }
  log.trace({
    tenant_id: tenantId,
    batchId: batchId,
    url: options.url
  }, 'Getting files for the batch ');
  return request.getAsync(options).spread(function(response, body) {
    if (response.statusCode === 200) {
      try {
        var result = JSON.parse(body);
        log.debug({
          files: result
        }, ' files for the batch ');
        return promise.map(result, function(file) {
          log.info({file:file}, 'i');
          return getFileContentsForBatch(tenantId, batchId, file).then(function(content) {
            file.contents = content;
            return file;
          });
        })
      } catch (e) {
        throw {
          name: 'FileServiceError',
          message: 'Couldn\'t parse response ' + body
        };
      }
    } else {
      log.error({
        statusCode: response.statusCode
      }, 'FileServicError');
      throw Error('BatchService service query failed', response)
    }
  });
}

/**
  Calls the batchFile service to create a batch, createOptions object contains property batch_id
  Returns a Promise function which will return the id of the batch created

*/
module.exports.createBatch = function createBatch(tenantId, createOptions) {
  log.info('Creating batch ', createOptions, ' at ', fileStorageUrl + '/batches');
  var batch = queryString.stringify(createOptions);

  var options = {
    url: fileStorageUrl + '/batches',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': batch.length
    },
    body: batch
  }
  return request.postAsync(options).spread(function(response, body) {
    if (response.statusCode === 201) {
      log.info('returning ', JSON.parse(body));
      return createOptions.batch_id;
    } else {
      log.error('BatchService should be 200 but is ', response.statusCode);
      throw Error('BatchService service query failed', response)
    }
  });
}


/**
  Calls the batchFile service to delete the provided batchId
  Returns a Promise function

*/
module.exports.deleteBatch = function deleteBatch(tenantId, batchId) {
  log.info('Deleting batch ', batchId, ' from ', fileStorageUrl);
  var options = {
    url: fileStorageUrl + '/batches/' + batchId
  }
  return request.delAsync(options).spread(function(response, body) {
    if (response.statusCode === 204) {
      log.info('deleted batch ', batchId);
      return;
    } else {
      log.error('BatchService should be 204 but is ', response.statusCode);
      throw Error('BatchService service query failed', response)
    }
  });
}

/**
  Calls the batchFile service to clone the provided batch id
  Returns a Promise function which will return the list of models as a JSON Array

*/
module.exports.cloneBatch = function cloneBatch(tenantId, origBatchId, cloneOptions) {
  log.info('Cloning batch ', origBatchId, ' to ', cloneOptions, ' from ', fileStorageUrl);
  var cloneData = queryString.stringify(cloneOptions);
  var options = {
    url: fileStorageUrl + '/batches/' + origBatchId + '/clone',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': cloneData.length
    },
    body: cloneData
  }

  return request.postAsync(options).spread(function(response, body) {
    if (response.statusCode === 201) {
      log.info('cloned batch ', origBatchId, ' to ', cloneOptions);
      return cloneOptions.file_batch_id;
    } else {
      log.error('BatchService should be 201 but is ', response.statusCode);
      throw Error('coreapi service query failed', response)
    }
  });
}
