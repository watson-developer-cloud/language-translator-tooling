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
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, complexity: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var instance = proxyquire('./instance', {
  './log' : {
    info : sinon.spy(),
    error : sinon.spy(),
    warn : sinon.spy(),
    debug : sinon.spy()
  }
});

var should = chai.should();
chai.use(sinonChai);

function createCloudantError (message, statusCode) {
  var error = new Error();
  error.message = message;
  error.statusCode = statusCode;
  return error;
}

function getDesignName (name) {
  return '_design/' + name;
}

describe('./instance', function () {

  var dbname = 'test';

  var errorMsg = 'test-generated';

  var exampleView, createdExampleView, exampleViewUpdate, exampleHandler, exampleHandlerUpdate,
      createdExampleHandler, exampleList, exampleListUpdate, createdExampleList, exampleIndex,
      exampleIndexUpdate, createdExampleIndex, exampleSearch, exampleSearchUpdate, createdExampleSearch,
      namelessIndex, createdNamelessIndex, exampleViewDesign, exampleViewDesignUpdate,
      exampleHandlerDesign, exampleHandlerDesignUpdate, exampleListDesign,
      exampleListDesignUpdate, exampleSearchDesign, exampleSearchDesignUpdate,exampleIndexDesign,
      exampleIndexDesignUpdate, namelessIndexDesign;



  beforeEach(function () {

    exampleView = {
      views : {
        exampleView : {
          version : 1,
          map : function (doc) {
            emit(doc.key, doc.value); // jshint ignore:line
          },
          reduce : '_count'
        }
      }
    };

    createdExampleView = {
      '_id' : '_design/exampleView',
      '_rev' : '1-1',
      'views' : {
        'exampleView' : {
          'version' : 1,
          'map' : 'function (doc) {\nemit(doc.key, doc.value);\n}',
          'reduce' : '_count'
        }
      }
    }

    exampleViewUpdate = {
      views : {
        exampleView : {
          version : 2,
          map : function (doc) {
            emit(doc.key, doc.value); // jshint ignore:line
          },
          reduce : '_sum'
        }
      }
    };

    exampleHandler = {
      updates : {
        version : 1,
        exampleHandler : function (doc, req) {
          doc.example = 'foo';
          return [doc, 'Hello world'];
        }
      }
    };

    exampleHandlerUpdate = {
      updates : {
        version : 2,
        exampleHandler : function (doc, req) {
          doc.example = 'bar';
          return [doc, 'Hello world'];
        }
      }
    };

    createdExampleHandler = {
      '_id' : '_design/exampleHandler',
      '_rev' : '1-1',
      'updates' : {
        'version' : 1,
        'exampleHandler' : 'function (doc, req) {\ndoc.example = \'foo\';\nreturn [doc, \'Hello world\'];\n}'
      }
    }

    exampleList = {
      lists : {
        version : 1,
        exampleList : function (head, req) {
          return 'Hello world';
        }
      }
    };

    exampleListUpdate = {
      lists : {
        version : 2,
        exampleList : function (head, req) {
          return 'Hello world!!!!';
        }
      }
    };

    createdExampleList = {
      '_id' : '_design/exampleList',
      '_rev' : '1-1',
      'lists' : {
        'version' : 1,
        'exampleList' : 'function (doc, req) {\nreturn \'Hello world\';\n}'
      }
    }

    exampleSearch = {
      indexes : {
        exampleIndex : {
          version : 1,
          analyzer : {
            name : 'perfield',
            default : 'standard',
            fields : {
              tenant : 'keyword'
            }
          },
          index : function (doc) {
            if (doc.schema === 'foo') {
              index('default', doc.name);
              index('name', doc.name, { store : 'yes' });
            }
          }
        }
      }
    };

    createdExampleSearch = {
      '_id' : '_design/exampleSearch',
      '_rev' : '1-1',
      indexes : {
        exampleIndex : {
          version : 1,
          analyzer : {
            name : 'perfield',
            default : 'standard',
            fields : {
              tenant : 'keyword'
            }
          },
          index : 'function (doc) {\nif (doc.schema === \'foo\') {\nindex(\'default\', doc.name);\nindex(\'name\', doc.name, { store : \'yes\' });\n}\n}'
        }
      }
    };

    exampleSearchUpdate = {
      indexes : {
        exampleIndex : {
          version : 2,
          analyzer : {
            name : 'perfield',
            default : 'standard',
            fields : {
              tenant : 'keyword'
            }
          },
          index : function (doc) {
            if (doc.schema === 'bar') {
              index('default', doc.name);
              index('name', doc.name, { store : 'yes' });
            }
          }
        }
      }
    };

    exampleIndex = {
      name : 'exampleIndex',
      version : 1,
      index : {
        fields : [{
          name : 'asc'
        }]
      }
    };

    exampleIndexUpdate = {
      name : 'exampleIndex',
      version : 2,
      index : {
        fields : [{
          name : 'asc',
          description : 'asc'
        }]
      }
    };

    createdExampleIndex = {
      '_id' : '_design/exampleIndex',
      '_rev' : '1-1',
      'language' : 'query',
      'views' : {
        'exampleIndex' : {
          'map' : {
            'fields' : {
              'name' : 'asc'
            }
          },
          'reduce' : '_count',
          'options' : {
            'def' : {
              'fields' : [
                'name'
              ]
            },
            'w' : 2
          },
          'version' : 1
        }
      }
    }

    namelessIndex = {
      ddoc : 'nameless',
      index : {
        fields : [{
          name : 'asc'
        }]
      }
    };

    createdNamelessIndex = {
      '_id' : '_design/nameless',
      '_rev' : '1-1',
      'language' : 'query',
      'views' : {
        'nameless-index-0' : {
          'map' : {
            'fields' : {
              'name' : 'asc'
            }
          },
          'reduce' : '_count',
          'options' : {
            'def' : {
              'fields' : [
                'name'
              ]
            },
            'w' : 2
          }
        }
      }
    }


    exampleViewDesign = {
      name : 'exampleView',
      ddocs : [exampleView]
    };

    exampleViewDesignUpdate = {
      name : 'exampleView',
      ddocs : [exampleViewUpdate]
    };

    exampleHandlerDesign = {
      name : 'exampleHandler',
      ddocs : [exampleHandler]
    };

    exampleHandlerDesignUpdate = {
      name : 'exampleHandler',
      ddocs : [exampleHandlerUpdate]
    };

    exampleListDesign = {
      name : 'exampleList',
      ddocs : [exampleList]
    };

    exampleListDesignUpdate = {
      name : 'exampleList',
      ddocs : [exampleListUpdate]
    };

    exampleSearchDesign = {
      name : 'exampleSearch',
      ddocs : [exampleSearch]
    };

    exampleSearchDesignUpdate = {
      name : 'exampleSearch',
      ddocs : [exampleSearchUpdate]
    };

    exampleIndexDesign = {
      name : 'exampleIndex',
      indexes : [exampleIndex]
    };

    exampleIndexDesignUpdate = {
      name : 'exampleIndex',
      indexes : [exampleIndexUpdate]
    };

    namelessIndexDesign = {
      name : 'nameless',
      indexes : [namelessIndex]
    };

    this.logMock = {
      info : sinon.spy(),
      error : sinon.spy(),
      warn : sinon.spy(),
      debug : sinon.spy()
    };


    this.instanceMock = {
      insert : sinon.stub(),
      destroy : sinon.stub(),
      get : sinon.stub(),
      list : sinon.stub(),
      bulk : sinon.stub()
    };

    var instanceIndexSpy = sinon.stub();
    var instanceIndexDelSpy = sinon.stub();
    instanceIndexSpy.del = instanceIndexDelSpy;
    this.instanceMock.index = instanceIndexSpy;

    this.dbMock = {
      create : sinon.stub(),
      destroy : sinon.stub(),
      get : sinon.stub(),
      list : sinon.stub(),
      use : sinon.stub()
    };

    this.driverMock = {
      db : this.dbMock
    };

    this.dbMock.use.returns(this.instanceMock);
  });

  describe('#getDatabaseAndCreateIfNecessary()', function () {

    describe('#database exists', function () {

      describe('#success', function () {

        beforeEach( function () {
          this.dbMock.get.callsArgWith(1, null, {});
        });

        function verifyInvocation (database) {
          should.exist(database);
          this.dbMock.use.should.have.been.called;
          this.dbMock.get.should.have.been.called;
          database.should.equal(this.instanceMock);
        }

        it('should get valid db reference', function (done) {
          instance(this.driverMock, dbname, function (err, db) {
            should.not.exist(err);
            verifyInvocation.call(this, db);
            done();
          }.bind(this));

        });
      });

      describe('#error', function () {

        beforeEach( function () {
          this.dbMock.get.callsArgWith(1, null, null);
        });

        function verifyFailureInvocation (database) {
          should.not.exist(database);
          this.dbMock.get.should.have.been.called;
          this.dbMock.use.should.not.have.been.called;
        }

        it('should return error if no db info retrieved', function (done) {
          instance(this.driverMock, dbname, function (err, db) {
            should.exist(err);
            verifyFailureInvocation.call(this, db);
            done();
          }.bind(this));

        });

      });
    });

    describe('#create database', function () {

      beforeEach( function () {
        this.dbMock.create.callsArg(1);
      });

      describe('#success', function () {

        function verifyInvocation (database) {
          should.exist(database);
          this.dbMock.use.should.have.been.called;
          this.dbMock.get.should.have.been.called;
          database.should.equal(this.instanceMock);
        }

        beforeEach( function () {
          this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.NOT_FOUND));
        });

        it('should get valid db reference without providing any designs', function (done) {
          instance(this.driverMock, dbname, function (err, db) {
            should.not.exist(err);
            verifyInvocation.call(this, db);
            done();
          }.bind(this));

        });


        describe('#create indexes and views', function () {

          beforeEach( function () {
            // Complexity here arises because we want to mock out an initial
            // call failing but subsequent calls (with different params)
            // succeeding
            this.invocationMap = {};
            this.instanceMock.get = function (name, callback) {
              if (!this.invocationMap[name]) {
                this.invocationMap[name] = 1;
                return callback(createCloudantError(errorMsg, 404));
              } else {
                this.invocationMap[name]++;
                switch (name) {
                  case createdExampleView._id:
                    callback(null, createdExampleView);
                    break;
                  case createdExampleHandler._id:
                    callback(null, createdExampleHandler);
                    break;
                  case createdExampleList._id:
                    callback(null, createdExampleList);
                    break;
                  case createdExampleSearch._id:
                    callback(null, createdExampleSearch);
                    break;
                  case createdExampleIndex._id:
                    callback(null, createdExampleIndex);
                    break;
                  case createdNamelessIndex._id:
                    callback(null, createdNamelessIndex);
                    break;
                  default:
                    callback(createCloudantError(errorMsg, 404));
                }
              }
            }.bind(this);

            this.dbMock.use.returns(this.instanceMock);
          });

          describe('#success', function () {

            beforeEach( function () {
              this.instanceMock.insert.callsArgWith(2, null, {
                ok : true,
                id : createdExampleView._id,
                rev : createdExampleView._rev
              });

              this.instanceMock.index = function (index, callback) {
                should.exist(index);
                index.should.have.property('name');

                // Based on actual Cloudant behavior
                var result = {
                  result : 'created',
                  id : getDesignName(index.ddoc),
                  name : index.name
                };
                return callback(null, result);
              };

              this.instanceMock.index.del = sinon.stub();

              this.instanceMock.index.del.callsArgWith(1, null, {ok : true});

              this.indexSpy = sinon.spy(this.instanceMock, 'index');

              this.dbMock.use.returns(this.instanceMock);
            });

            it('should create db and apply views', function (done) {
              instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                this.instanceMock.insert.should.have.been.calledWith(exampleView, getDesignName(exampleViewDesign.name), sinon.match.func);
                this.indexSpy.should.not.have.been.called;
                done();
              }.bind(this));

            });

            it('should update view when it has a more recent version', function (done) {
              this.invocationMap[createdExampleView._id] = 1;
              var expected = createdExampleView;
              instance(this.driverMock, dbname, exampleViewDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleViewDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should update view when existing has no declared version', function (done) {
              var expected = createdExampleView;
              var existingVersion = createdExampleView.views.exampleView.version;
              delete createdExampleView.views.exampleView.version;

              this.invocationMap[createdExampleView._id] = 1;
              instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleViewDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should create view when design doc exists but has no views attribute', function (done) {
              delete createdExampleView.views;

              this.invocationMap[createdExampleView._id] = 1;
              var expected = createdExampleView;
              instance(this.driverMock, dbname, exampleViewDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleViewDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should not update view when version has not changed', function (done) {
              this.invocationMap[createdExampleView._id] = 1;
              instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should create db and apply handlers', function (done) {
              instance(this.driverMock, dbname, exampleHandlerDesign, function (err, db) {
                this.instanceMock.insert.should.have.been.calledWith(exampleHandler, getDesignName(exampleHandlerDesign.name), sinon.match.func);
                this.indexSpy.should.not.have.been.called;
                done();
              }.bind(this));

            });

            it('should update handler when it has a more recent version', function (done) {
              this.invocationMap[createdExampleHandler._id] = 1;
              var expected = createdExampleHandler;
              instance(this.driverMock, dbname, exampleHandlerDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleHandlerDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should not update handler when version has not changed', function (done) {
              this.invocationMap[createdExampleHandler._id] = 1;
              instance(this.driverMock, dbname, exampleHandlerDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should create db and apply lists', function (done) {
              instance(this.driverMock, dbname, exampleListDesign, function (err, db) {
                this.instanceMock.insert.should.have.been.calledWith(exampleList, getDesignName(exampleListDesign.name), sinon.match.func);
                this.indexSpy.should.not.have.been.called;
                done();
              }.bind(this));

            });

            it('should update list when it has a more recent version', function (done) {
              this.invocationMap[createdExampleList._id] = 1;
              var expected = createdExampleList;
              instance(this.driverMock, dbname, exampleListDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleListDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should not update list when version has not changed', function (done) {
              this.invocationMap[createdExampleList._id] = 1;
              instance(this.driverMock, dbname, exampleListDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should create db and apply search indexes', function (done) {
              instance(this.driverMock, dbname, exampleSearchDesign, function (err, db) {
                this.instanceMock.insert.should.have.been.calledWith(exampleSearch, getDesignName(exampleSearchDesign.name), sinon.match.func);
                this.indexSpy.should.not.have.been.called;
                done();
              }.bind(this));

            });

            it('should update search index when it has a more recent version', function (done) {
              this.invocationMap[createdExampleSearch._id] = 1;
              var expected = createdExampleSearch;
              instance(this.driverMock, dbname, exampleSearchDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleSearchDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should update search index when existing has no declared version', function (done) {
              var expected = createdExampleSearch;
              var existingVersion = createdExampleSearch.indexes.exampleIndex.version;
              delete createdExampleSearch.indexes.exampleIndex.version;

              this.invocationMap[createdExampleSearch._id] = 1;
              instance(this.driverMock, dbname, exampleSearchDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleSearchDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should create search index when design doc has no indexes attribute', function (done) {
              delete createdExampleSearch.indexes;

              this.invocationMap[createdExampleSearch._id] = 1;
              var expected = createdExampleSearch;
              instance(this.driverMock, dbname, exampleSearchDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleSearchDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should not update search index when version has not changed', function (done) {
              this.invocationMap[createdExampleSearch._id] = 1;
              instance(this.driverMock, dbname, exampleSearchDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should create db and apply indexes', function (done) {
              instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(createdExampleIndex, createdExampleIndex._id, sinon.match.func);
                this.indexSpy.should.have.been.calledWith(exampleIndex, sinon.match.func);
                done();
              }.bind(this));

            });

            it('should create db and apply index with a generated name when one is not provided', function (done) {
              instance(this.driverMock, dbname, namelessIndexDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                this.indexSpy.should.have.been.calledWith(namelessIndex, sinon.match.func);
                done();
              }.bind(this));

            });

            it('should update index when it has a more recent version', function (done) {
              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.indexSpy.should.have.been.calledWith(exampleIndexUpdate, sinon.match.func);
                this.instanceMock.insert.should.have.been.calledWith(createdExampleIndex, createdExampleIndex._id, sinon.match.func);
                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                done();
              }.bind(this));
            });

            it('should not update index when version has not changed', function (done) {
              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.indexSpy.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should not update index when version information not present', function (done) {
              delete createdExampleIndex.views.version;
              delete exampleIndex.version;
              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.indexSpy.should.not.have.been.called;
                this.instanceMock.index.del.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should only create db when designs not provided', function (done) {
              instance(this.driverMock, dbname, function (err, db) {
                should.not.exist(err);
                verifyInvocation.call(this, db);
                this.indexSpy.should.not.have.been.called;
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

          });

          describe('#error', function () {

            function verifyInvocationFailure (database) {
              should.not.exist(database);
              this.dbMock.use.should.have.been.called;
              this.dbMock.get.should.have.been.called;
            }

            beforeEach( function () {

              this.instanceMock.insert.callsArgWith(2, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

              this.instanceMock.index = sinon.stub();
              this.instanceMock.index.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

              this.instanceMock.index.del = sinon.stub();

              this.instanceMock.index.del.callsArgWith(1, null, {ok : true});

              this.dbMock.use.returns(this.instanceMock);

            });

            it('should pass back error if view creation fails', function (done) {
              instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(exampleView, getDesignName(exampleViewDesign.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should pass back error if view check fails', function (done) {

              var getSpy = sinon.stub(this.instanceMock, 'get')
              getSpy.callsArgWith(1, createCloudantError(errorMsg, 500));

              instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.insert.should.not.have.been.called;
                this.instanceMock.get.restore();
                done();
              }.bind(this));
            });

            it('should pass back error if view update fails', function (done) {
              this.invocationMap[createdExampleView._id] = 1;
              var expected = createdExampleView;
              instance(this.driverMock, dbname, exampleViewDesignUpdate, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleViewDesignUpdate.name), sinon.match.func);
                done();
              }.bind(this));
            });

            it('should pass back error if index creation fails', function (done) {
              instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.should.have.been.calledWith(exampleIndex, sinon.match.func);
                done();
              }.bind(this));
            });

            it('should pass back error if index check fails', function (done) {

              var getSpy = sinon.stub(this.instanceMock, 'get')
              getSpy.callsArgWith(1, createCloudantError(errorMsg, 500));

              instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should pass back error if index update fails during index creation', function (done) {
              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                this.instanceMock.index.should.have.been.calledWith(exampleIndexUpdate, sinon.match.func);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

            it('should pass back error if index update fails during index retrieval', function (done) {

              var getSpy = sinon.stub(this.instanceMock, 'get');
              getSpy.onCall(0).callsArgWith(1, null, createdExampleIndex);
              getSpy.onCall(1).callsArgWith(1, createCloudantError(errorMsg, 500));

              this.instanceMock.index.callsArgWith(1, null, {
                result : 'created',
                id : getDesignName(exampleIndexUpdate.ddoc),
                name : exampleIndexUpdate.name
              });

              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                this.instanceMock.index.should.have.been.calledWith(exampleIndexUpdate, sinon.match.func);
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });


            it('should pass back error if index update fails during index versioning update', function (done) {

              var getSpy = sinon.stub(this.instanceMock, 'get');
              getSpy.callsArgWith(1, null, createdExampleIndex);

              this.instanceMock.index.callsArgWith(1, null, {
                result : 'created',
                id : getDesignName(exampleIndexUpdate.ddoc),
                name : exampleIndexUpdate.name
              });

              this.instanceMock.insert.callsArgWith(2, createCloudantError(errorMsg, 500));

              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                this.instanceMock.index.should.have.been.calledWith(exampleIndexUpdate, sinon.match.func);
                this.instanceMock.insert.should.have.been.called;
                done();
              }.bind(this));
            });


            it('should pass back error if index update fails during index deletion', function (done) {

              var getSpy = sinon.stub(this.instanceMock, 'get');
              getSpy.callsArgWith(1, null, createdExampleIndex);

              this.instanceMock.index.del.callsArgWith(1, createCloudantError(errorMsg, 500));

              this.invocationMap[createdExampleIndex._id] = 1;
              instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                should.exist(err);
                verifyInvocationFailure.call(this, db);
                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                this.instanceMock.index.should.not.have.been.called;
                this.instanceMock.insert.should.not.have.been.called;
                done();
              }.bind(this));
            });

          });

        });

      });

      describe('#error', function () {

        function verifyInvocationFailure (database) {
          should.not.exist(database);
          this.dbMock.use.should.not.have.been.called;
          this.dbMock.get.should.have.been.called;
        }

        beforeEach( function () {
          this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.NOT_FOUND));

          this.dbMock.create.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));
        });

        it('should pass back error if initial db get fails', function (done) {
          this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

          instance(this.driverMock, dbname, function (err, db) {
            should.exist(err);
            verifyInvocationFailure.call(this, db);
            this.dbMock.create.should.not.have.been.called;
            done();
          }.bind(this));
        });

        it('should pass back error if db create fails', function (done) {

          instance(this.driverMock, dbname, function (err, db) {
            should.exist(err);
            verifyInvocationFailure.call(this, db);
            this.dbMock.create.should.have.been.called;
            done();
          }.bind(this));
        });

        it('should throw error if no callback provided', function () {
          this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

          (function () {
            instance(this.driverMock, dbname)
          }.bind(this)).should.throw(errorMsg);

        });

      });

    });

  });
});
