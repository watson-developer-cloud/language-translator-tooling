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

var log = require('../../config/log');
var testConstants = require('../testConstants');
var testModel = testConstants.testModel;
var testClonedModel = testConstants.testClonedModel;
var PassThrough = require('stream').PassThrough;

module.exports.createBatch = function createBatch(tenantId, createOptions) {
    if (createOptions.batch_id === testModel.file_batch_id) {
        return testModel.file_batch_id;
    }
}

module.exports.getFilesForBatch = function getFilesForBatch(tenantId, batchId) {

    if (tenantId === 'UNIT_TESTS' && batchId === 'MYBADBatchId') {
        var err = {
            message: 'missing',
            stack: 'Error: missing\n    at Request._callback (/home/vcap/app/node_modules/nano/lib/nano.js:234:15)\n    at Request.self.callback (/home/vcap/app/node_modules/nano/node_modules/request/request.js:354:22)\n    at Request.emit (events.js:98:17)\n    at Request.<anonymous> (/home/vcap/app/node_modules/nano/node_modules/request/request.js:1207:14)\n    at Request.emit (events.js:117:20)\n    at IncomingMessage.<anonymous> (/home/vcap/app/node_modules/nano/node_modules/request/request.js:1153:12)\n    at IncomingMessage.emit (events.js:117:20)\n    at _stream_readable.js:944:16\n    at process._tickCallback (node.js:448:13)',
            name: 'Error',
            error: 'not_found',
            reason: 'missing',
            scope: 'couch',
            statusCode: 404,
            errid: 'non_200',
            description: 'couch returned 404'
        }
        log.error({
            Error: err
        }, 'FileServicError');
        throw Error('BatchService service query failed', err)
    }
    else if (tenantId === 'UNIT_TESTS' && batchId === '4df22b61eb978816b59b59fa55905899BatchId') {
     var file1Stream = new PassThrough();
     file1Stream.write('I am the contents of glossary file with uuid ' + testConstants.file1_uuid)    // the string you want
     file1Stream.end();
     var file2Stream = new PassThrough();
     file2Stream.write('I am the contents of parallel corpus file with uuid ' + testConstants.file2_uuid)    // the string you want
     file2Stream.end();
     var file3Stream = new PassThrough();
     file3Stream.write('I am the contents of monolingual corpus file with uuid ' + testConstants.file3_uuid)    // the string you want
     file3Stream.end();

       return [{
         file_name: "file1.tmx",
         uuid: testConstants.file1_uuid,
         last_modified: '2015-10-26T21:26:44.743Z',
         // training_file_option: 'forced_glossary',
         stream : file1Stream
       }, {
         file_name: "file2.tmx",
         uuid: testConstants.file2_uuid,
         last_modified: '2015-10-26T21:26:44.743Z',
         training_file_option: 'parallel_corpus',
         stream : file2Stream
       }, {
         file_name: "file3.tmx",
         uuid: testConstants.file3_uuid,
         last_modified: '2015-10-26T21:26:44.743Z',
         training_file_option: 'monolingual_corpus',
         stream : file3Stream
       }]
    }
    else {
      console.log('Not Mocked a response for batchid = ' + batchId + ' tenantid = ' + tenantId);
    }

}

module.exports.deleteBatch = function deleteBatch(tenantId, batchId) {
  if (tenantId === 'UNIT_TESTS' && batchId === '4df22b61eb978816b59b59fa55905899BatchId') {
    return;
  }
  else {
    console.log('Not Mocked a response for deleting batchid = ' + batchId + ' tenantid = ' + tenantId);
  }
}

exports.cloneBatch = function cloneBatch(tenantId, origBatchId, cloneOptions) {
  var cloned_batch;
  if (tenantId === 'UNIT_TESTS' && origBatchId === '4df22b61eb978816b59b59fa55905899BatchId' && cloneOptions.batch_id ==='14e561f8a7675a9a94306648c0c12d5eBatchId') {
   cloned_batch = {_id:testClonedModel.file_batch_id,
   _rev:'1-f1b588123d36dff8528ca2e72e129d77',
   tenant_id:testConstants.testTenantId,
   batch_id:testClonedModel.file_batch_id,
   batch:[{file_name:'file1.tmx',
   uuid: testConstants.file1_uuid,
   last_modified: '2015-10-26T21:26:44.743Z'},
      {file_name:'file2.tmx',             uuid: testConstants.file2_uuid,
               last_modified: '2015-10-26T21:26:44.743Z',
               training_file_option: 'parallel_corpus'},
   {file_name:'file3.tmx',         uuid: testConstants.file3_uuid,
            last_modified: '2015-10-26T21:26:44.743Z',
            training_file_option: 'monolingual_corpus'}

]};
   return cloned_batch;
  }
  else if (tenantId === 'UNIT_TESTS' && origBatchId === '4df22b61eb978816b59b59fa55905899BatchIdCREATED' && cloneOptions.batch_id ==='14e561f8a7675a9a94306648c0c12d5eBatchId') {

    var cloned_batch2 = {_id:testClonedModel.file_batch_id,
    _rev:'1-f1b588123d36dff8528ca2e72e129d77',
    tenant_id:testConstants.testTenantId,
    batch_id:testClonedModel.file_batch_id,
    batch:[]};
    return cloned_batch2;
  }
  else {
    console.log('Not Mocked a response for cloning batchid = ' + origBatchId + ' tenantid = ' + tenantId + ' to clonebatchid ' + cloneOptions.batch_id);
  }
}
