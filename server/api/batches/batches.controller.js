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
var batches = require('./batches');
var fileStore = require('../../components/fileStore');
var log = require('../../config/log');
var uuid = require('uuid');
var fs = require('fs');
var constants = require('./constants.js');
var batchLimits = constants.batchLimits;
var HTTPStatus = require('http-status');
var BatchError = require('../../components/common').BatchError;
var ltErrors = require('../../components/ltErrors');


exports.getAllBatches = function getAllBatches(req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    batchId: req.params.batchId
  }, "Getting All Batches");
    batches.getAllBatches(tenantId, function(err, batches) {
      if (!err) {
          return res.json(batches);
      } else {
          return next(err);
      }
    });
};

exports.getBatch = function getBatch(req, res, next) {
  var tenantId = req.params.tenantId;
    log.info({
        batchId: req.params.batchId
    }, "Getting a batch");

    batchStore.getBatch(tenantId, req.params.batchId, function(err, body)
    {
     if (!err) {
         log.info({
             batch: body
         }, "Got batch");
         return res.json(body);
        } else {
            log.error(err);
            return next(err);
        }
    });
};

exports.getFile = function getFile(req, res, next) {
  var tenantId = req.params.tenantId;
    log.info({
        fileId: req.params.fileId
    }, "Getting file");

    batches.getFileAsStream(tenantId, req.params.batchId, req.params.fileId, function (fileStream) {
     fileStream.pipe(res);
    } );

};

exports.getFiles = function getFiles(req, res, next) {
  var tenantId = req.params.tenantId;
    log.info({
        batch_id: req.params.batchId
    }, "Getting all files for a batch");
    batches.getFiles(tenantId, req.params.batchId, function(err, files) {
        if (!err) {
            log.info({
                files: files
            }, "Got files");

            return res.json(files);
        } else {
            log.error(err);
            return next(err);
        }
    });
};

exports.addBatch = function addBatch(req, res, next) {
  var tenantId = req.params.tenantId;
    batches.addBatch(tenantId, req.body.batch_id, req.body, function(err, batch) {
      if (!err) {
          res.status(201).send(batch);
      } else {
          return next(err);
      }
   });
};

exports.cloneBatch = function cloneBatch(req, res, next) {
  var tenantId = req.params.tenantId;
  batches.cloneBatch(tenantId, req.params.batchId, req.body.file_batch_id, function(err, batch) {
    if (!err) {
        res.status(201).send(batch);
    } else {
        return next(err);
    }
 });
};

function deleteFileSynchronously(file,fileStatus){
  fs.unlink(file.path, function (err) {
    if (err) {
      log.info('Couldn\'t remove file "' + file.path + '" from file system ' + fileStatus);
    } else {
      log.info('Successfully removed file "' + file.path + '" from file system ' + fileStatus);
    }
  });
}

exports.addFile = function addFile (req, res, next) {
  var tenantId = req.params.tenantId;
  var option = JSON.parse(req.body.data).option;

  log.info({
    batch_id : req.params.batchId,
    file : req.file,
    option : option
  }, "Adding a new file");

  // get batch
  batchStore.getBatch(tenantId, req.params.batchId, function (err, body) {
    if (!err) {
      log.info({
        batch : body
      }, "Got batch");

      var file = req.file;
      if (file) {
        var file_name = file.originalname;

        // check for duplicate file
        log.info("Checking for duplicate files...");
        var duplicateFound=false;
        for (var i = 0; i < body.batch.length; ++i) {
          if (body.batch[i].file_name === file_name) {
            duplicateFound = true;
          }
        }
        if (duplicateFound) {
          err = new BatchError('Duplicate file uploaded', ltErrors.duplicateFileUploaded, {
            fileName : file_name
          }, HTTPStatus.CONFLICT);

          deleteFileSynchronously(file,'that was a duplicate file');
          return next(err);
        }

        //calculate the total size of all files and the total size of forced glossary files in the batch at this point.
        var totalBatchSize = 0;
        var totalForcedGlossarySize = 0;
        body.batch.forEach(function (batchFile) {
          totalBatchSize += batchFile.file_size;
          if(batchFile.training_file_option==='forced_glossary'){
            totalForcedGlossarySize += batchFile.file_size;
          }
        });

        log.info('Checking forced glossary does not break forced glossary single file size limit...');
        if ((option === 'forced_glossary') && (file.size > batchLimits.UPLOADED_FORCED_GLOSSARY_INDIVIDUAL_SIZE)) {
          err = new BatchError('Forced glossary file size limit exceeded. Uploaded file size is: ' + file.size + '. Forced glossary file size limit is: ' + batchLimits.UPLOADED_FORCED_GLOSSARY_INDIVIDUAL_SIZE + '.', ltErrors.forcedGlossaryFileSizeLimitExceeded, {
            fileName : file_name,
            fileSize : file.size,
            forcedGlossaryFileSizeLimit : batchLimits.UPLOADED_FORCED_GLOSSARY_INDIVIDUAL_SIZE
          }, HTTPStatus.REQUEST_ENTITY_TOO_LARGE);
          deleteFileSynchronously(file, 'that exceeded single file size limit');
          return next(err);
        }

        log.info('Checking forced glossary does not break forced glossary total file size limit...');
        if ((option === 'forced_glossary') && ((file.size + totalForcedGlossarySize) > batchLimits.UPLOADED_FORCED_GLOSSARY_TOTAL_SIZE)) {
          err = new BatchError('Forced glossary total size limit exceeded. Uploaded file size is: ' + file.size + ' and current total forced glossary size is: ' + totalForcedGlossarySize + '. This would create a total forced glossary size of: ' + totalForcedGlossarySize + file.size + '. Forced glossary total size limit is: ' + batchLimits.UPLOADED_FORCED_GLOSSARY_TOTAL_SIZE + '.', ltErrors.forcedGlossaryTotalSizeLimitExceeded, {
            fileName : file_name,
            fileSize : file.size,
            currentForcedGlossarySize : totalBatchSize,
            forcedGlossaryTotalSizeLimit : batchLimits.UPLOADED_FORCED_GLOSSARY_TOTAL_SIZE
          }, HTTPStatus.REQUEST_ENTITY_TOO_LARGE);
          deleteFileSynchronously(file, 'that exceeded single file size limit');
          return next(err);
        }

        // check file isn't larger than a single file limit
        log.info('Checking file does not break single file size limit...');
        if (file.size > batchLimits.UPLOADED_FILE_SIZE) {
          err = new BatchError('Single file size limited exceeded. Uploaded file size is: ' + file.size + '. File size limit is: ' + batchLimits.UPLOADED_FILE_SIZE + '.', ltErrors.fileSizeLimitExceeded, {
            fileName : file_name,
            fileSize : file.size,
            fileSizeLimit : batchLimits.UPLOADED_FILE_SIZE
          }, HTTPStatus.REQUEST_ENTITY_TOO_LARGE);
          deleteFileSynchronously(file,'that exceeded single file size limit');
          return next(err);
        }

        // check file doesn't break overall batch size limit
        log.info('Checking file does not break batch size limit...');
        if ((totalBatchSize + file.size) > batchLimits.BATCH_SIZE) {
          err = new BatchError('Batch size limit exceeded. Uploaded file size is: ' + file.size + ' and current batch size is: ' + totalBatchSize + '. This would create a batch size of: ' + totalBatchSize + file.size + '. Batch size limit is: ' + batchLimits.BATCH_SIZE + '.', ltErrors.batchSizeLimitExceeded, {
            fileName : file_name,
            fileSize : file.size,
            currentBatchSize : totalBatchSize,
            batchSizeLimit : batchLimits.BATCH_SIZE
          }, HTTPStatus.REQUEST_ENTITY_TOO_LARGE);
          deleteFileSynchronously(file,'that exceeded batch size limit');
          return next(err);
        }


        // create file obj with UUID
        var file_obj = {
          file_name : file_name,
          file_size : file.size,
          uuid : uuid.v4(),
          last_modified : new Date(),
          training_file_option : option
        };

        log.info({
          file : file_obj
        }, "Adding file with UUID to batch");

        // add file and UUID to batch
        body.batch.push(file_obj);

        batchStore.updateBatch(tenantId, body, body._id, function (err, body) {
          if (!err) {
            log.info({
              batch : body
            }, "Updated batch");

            // add file to object store
            log.info("Uploading file to Object Store");
            fileStore.storeFile(tenantId, file_obj.uuid, file.path, function (err, body) {
              if (err) {
                log.error(err);
                return next(err);
                // TODO: remove file name from batch
              } else {
                fs.unlink(file.path, function (err) {
                  if (err) {
                    // Could not remove file from file system
                    log.info("Successfully uploaded file to Object Store but couldn't remove from file system");
                  } else {
                    log.info("Successfully uploaded file to Object Store");
                    return res.sendStatus(200);
                  }
                })
              }
            });
          } else {
            log.error(err);
            return next(err);
          }
        });
      } else {
        err = new Error("No files uploaded");
        log.error(err);
        return next(err);
      }
    } else {
      log.error(err);
      return next(err);
    }
  });
};

exports.deleteBatch = function deleteBatch(req, res, next) {
  var tenantId = req.params.tenantId;
    batches.deleteBatch(tenantId, req.params.batchId, function(err, batches) {
      if (!err) {
          return res.sendStatus(204);
      } else {
         return next(err);
      }
    });
  };

exports.deleteFile = function deleteFile(req, res, next) {
  var tenantId = req.params.tenantId;
    log.info({
        fileId: req.params.fileId
    }, "Deleting file");
    batches.deleteFile(tenantId, req.params.batchId, req.params.fileId, function(err,result) {
     if (!err) {
         return res.sendStatus(204);
     } else {
        return next(err);
     }
    });

   };
