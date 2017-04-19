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
/*eslint-env node */

/**
 * Database connection helper for Cloudant.
 *
 *  Creates a client object to use to interact with a Cloudant store.
 *
 *
 * @module ibmwatson-common-storage/lib/cloudant
 * @author Andy Stoneberg
 */

// core dependencies
var util = require('util');
// external dependencies
var _ = require('lodash');
var async = require('async');
var httpstatus = require('http-status');
var makeArray = require('make-array');

// local dependencies
var log = require('../../config/log');

var DESIGN_PREFIX = '_design/';

function handleError (err, description, callback) {
  log.error({err : err}, description );

  if (callback) {
    return callback(err);
  }

  throw err;
}

function createView (dbconn, name, ddoc, callback) {
  log.debug('Design document [%s] does not exist - creating...', name);
  dbconn.insert(ddoc, name, function insertCallback (createError, result) {
    if (createError) {
      return handleError(createError, util.format('Error in creating design document [%s]', name), callback);
    }

    log.debug({result : result}, 'Created design document');
    callback(null, result);
  });
}

function isEligibleForUpdate (current, proposed) {
  return ( (current && current.version && (current.version < proposed.version)) ||
          ( ((!current) || (!current.version)) && proposed.version) );
}

function handleObjectDefinition (property, definition, existing) {
  if (definition[property]) {
    existing[property] = existing[property] || {};
    Object.keys(definition[property]).forEach(function checkForUpdate (name) {
      var proposed = definition[property][name];
      var current = existing[property][name];
      if (isEligibleForUpdate(current, proposed)) {
        existing[property][name] = proposed;
        existing.modified = true;
      }
    });
  }
}

function handleViewDefinition (definition, existing) {
  handleObjectDefinition('views', definition, existing);
}

function handleIndexDefinition (definition, existing) {
  handleObjectDefinition('indexes', definition, existing);
}

function handleAttributeDefinition (property, definition, existing) {
  if (definition[property]) {
    var current = existing[property];
    var proposed = definition[property];
    if (isEligibleForUpdate(current, proposed)) {
      existing[property] = proposed;
      existing.modified = true;
    }
  }
}

function handleUpdateDefinition (definition, existing) {
  handleAttributeDefinition('updates', definition, existing);
}

function handleListDefinition (definition, existing) {
  handleAttributeDefinition('lists', definition, existing);
}

function updateView (dbconn, ddoc, existing, callback) {

  handleViewDefinition(ddoc, existing);

  handleIndexDefinition(ddoc, existing);

  handleUpdateDefinition(ddoc, existing);

  handleListDefinition(ddoc, existing);

  if (existing.modified) {
    delete existing.modified;
    dbconn.insert(existing, existing._id, function updateCallback (updateError, result) {
      if (updateError) {
        return handleError(updateError, util.format('Error in updating design document [%s]', existing._id), callback);
      }

      log.debug({result : result}, 'Updated design document');
      callback(null, result);
    });
  } else {
    log.debug('%s: all views are up-to-date', existing._id);
    callback(null, existing)
  }
}

/**
 * handleView()
 *
 *  Creates the specified view in the event it does not exist.
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {String} name - name of the design document for the view
 * @param {Object} ddoc - design document of the view
 * @param {Function} callback - called after error or when view has been created/retrieved
 * @returns {void}
 */
function handleView (dbconn, name, ddoc, callback) {
  var designName = DESIGN_PREFIX + name;
  dbconn.get(designName, function getCallback (existError, existResult) {
    if (!existError) {
      log.debug('Retrieved design document [%s]', designName);
      updateView(dbconn, ddoc, existResult, callback);
    } else if (existError.statusCode === httpstatus.NOT_FOUND) {
      return createView(dbconn, designName, ddoc, callback);
    } else {
      handleError(existError, util.format('Error retrieving design document [%s]', designName), callback);
    }
  });
}

function createIndex (dbconn, index, callback) {
  var indexName = index.name;
  log.debug('Index [%s] does not exist - creating...', indexName);
  var version = index.version;
  delete index.version;
  async.waterfall([
    function initializeIndex (next) {
      dbconn.index(index, function indexCallback (indexError, indexResult) {
        if (indexError) {
          handleError(indexError, util.format('Error creating index [%s]', indexName), next);
        } else {
          log.debug({result : indexResult}, 'Created index');
          next(null, indexResult);
        }
      });
    },
    function getIndex (createdresult, next) {
      if (version) {
        dbconn.get(createdresult.id, function getCallback (getError, getResult) {
          if (getError) {
            handleError(getError, util.format('Error retrieving index for versioning [%s]', indexName), next);
          } else {
            next(null, getResult);
          }
        });
      } else {
        next(null, null);
      }
    },
    function updateIndexWithVersion (createdindex, next) {
      if (createdindex) {
        createdindex.views[indexName].version = version;
        dbconn.insert(createdindex, createdindex._id, function versionCallback (versionError, versionResult) {
          if (versionError) {
            handleError(versionError, util.format('Error versioning index [%s]', indexName), next);
          } else {
            log.debug('Index versioned [%s:%d]', indexName, version);
            next(null, versionResult);
          }
        });
      } else {
        next();
      }
    }
  ], callback);
}

function updateIndex (dbconn, index, existingDesign, callback) {
  var modified = false;

  var current = existingDesign.views[index.name];
  if ( isEligibleForUpdate (current, index) ) {
    async.series([
      function deleteCurrentIndex (next) {
        var spec = {
          ddoc : index.ddoc,
          name : index.name
        };
        dbconn.index.del(spec, function deleteCallback (deleteError, deleteResult) {
          if (deleteError) {
            handleError(deleteError, util.format('Error updating index [%s]', index.name), callback);
          } else {
            log.debug('Index removed for update [%s:%s]', index.ddoc, index.name);
            next();
          }
        });
      },
      function createUpdatedIndex (next) {
        createIndex(dbconn, index, next);
      }
    ], callback);

  } else {
    if (index.version) {
      log.debug('%s is up-to-date [version: %d]', index.name, index.version);
    }
    callback(null, current);
  }
}

/**
 * handleIndex()
 *
 *  Creates the specified index in the event it does not exist.
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {Object} name - name of the design document to store the index
 * @param {Object} index - design document of the index
 * @param {Function} callback - called after error or when index has been created/retrieved
 * @returns {void}
 */
function handleIndex (dbconn, name, index, callback) {
  var indexDesignName = DESIGN_PREFIX + name;
  index.ddoc = name;
  dbconn.get(indexDesignName, function getCallback (existError, existResult) {
    if (!existError) {
      log.debug('Retrieved index design [%s]', indexDesignName);
      updateIndex(dbconn, index, existResult, callback);
    } else if (existError.statusCode === httpstatus.NOT_FOUND) {
      createIndex(dbconn, index, callback);
    } else {
      handleError(existError, util.format('Error retrieving index design [%s]', indexDesignName), callback);
    }
  });
}

/**
 * applyDesignDocs()
 *
 *  Creates tasks to be consumed by async.series for view creation.
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {String} designName - name of the design document
 * @param {Object[]} views - definitions of views to create on database
 * @returns {void}
 */
function getViewTasks (dbconn, designName, views) {
  return makeArray(views).map(function createViewTasks (doc) {
    return function getViewTask (callback) {
      handleView(dbconn, designName, doc, callback);
    };
  });
}

/**
 * getIndexTasks()
 *
 *  Creates tasks to be consumed by async.series for index creation.
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {String} designName - name of the design document
 * @param {Object[]} indexes - definitions of indexes to create on database
 * @returns {void}
 */
function getIndexTasks (dbconn, designName, indexes) {
  return makeArray(indexes).map(function createIndexTasks (index, pos) {
    return function getIndexTask (callback) {
      if (!index.name) {
        index.name = designName + '-index-' + pos;
      }
      handleIndex(dbconn, designName, index, callback);
    };
  });
}

/**
 * getDatabaseTasks()
 *
 *  Creates tasks to be consumed by async.series for creation of views and indexes.
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {Object[]} designs - definitions of views/indexes to create on database
 * @returns {void}
 */
function getDatabaseTasks (dbconn, designs) {
  return designs.map(function createDatabaseTasks (custom) {
    return function getDatabaseTask (callback) {
      var designName = custom.name;
      log.debug('Processing design [%s]', designName);

      var designDocTasks = getViewTasks(dbconn, designName, custom.ddocs);
      var indexTasks = getIndexTasks(dbconn, designName, custom.indexes);

      async.series(designDocTasks.concat(indexTasks), function asyncCallback (designTaskErr, designTaskResults) {
        if (designTaskErr) {
          callback(designTaskErr);
        } else {
          callback(null, designTaskResults);
        }
      });
    };

  });
}

/**
 * applyDesignDocs()
 *
 *  Creates the specified views and indexes in the database
 *
 * @param {Object} dbconn - connection object for a specific Cloudant database
 * @param {Object[]} designs - definitions of indexes/views to create on database if it doesn't exist (optional)
 * @param {String} callback - called after error or when all design docs are done processing
 * @returns {void}
 */
function applyDesignDocs (dbconn, designs, callback) {
  var designArray = makeArray(designs);

  if (designArray.length === 0) {
    return callback(null, dbconn);
  }

  async.series(getDatabaseTasks(dbconn, designArray), function asyncCallback (dbTaskErr) {
    if (dbTaskErr) {
      return handleError(dbTaskErr, 'Error occurred during database customization', callback);
    }

    return callback(null, dbconn);
  });
}

/**
 * createDatabase()
 *
 *  Creates the database along with any specified design docs.
 *
 * @param {Object} driver - cloudant connection object
 * @param {String} dbname - name of database
 * @param {Object[]} designs - definitions of indexes/views to create on database if it doesn't exist (optional)
 * @param {String} callback - called when error encountered or db created/retrieved
 * @returns {void}
 */
function createDatabase (driver, dbname, designs, callback) {
  async.waterfall([
    function createDatabase (next) {
      driver.db.create(dbname, function createCallback (dbCreateError) {
        if (dbCreateError) {
          return handleError(dbCreateError, 'Error in creating database', next);
        }

        return next(null, driver.db.use(dbname), designs);
      });
    },
    applyDesignDocs
  ], callback);
}

/**
 * get()
 *
 *  Create the database if it does not exist along with any specified design docs.
 *
 * @param {Object} driver - cloudant connection object
 * @param {String} dbname - name of database
 * @param {Object[]} designs - definitions of indexes/views to create on database if it doesn't exist
 * @param {String} callback - called when error encountered or db created/retrieved
 * @returns {void}
 */
module.exports = function getDatabaseAndCreateIfNecessary (driver, dbname, designs, callback) {

  if (_.isFunction(designs)) {
    callback = designs;
    designs = [];
  }

  driver.db.get(dbname, function getCallback (dbCheckErr, dbInfo) {
    if (dbCheckErr) {
      if (dbCheckErr.statusCode === httpstatus.NOT_FOUND) {
        return createDatabase(driver, dbname, designs, callback);
      }

      return handleError(dbCheckErr, util.format('Unable to get database [%s]', dbname), callback);
    }

    if (dbInfo) {
      log.debug('Retrieved database reference: %s', dbname);
      return applyDesignDocs(driver.db.use(dbname), designs, callback);
    }

    return callback(new Error('Failed to retrieve DB info'));

  });
};
