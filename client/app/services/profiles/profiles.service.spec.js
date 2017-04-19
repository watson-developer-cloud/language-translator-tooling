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

describe('Service: Profiles', function () {

  // load the service's module
  beforeEach(module('mtTrainingApp'));

  // instantiate service
  var Profiles,
      deferred,
      projects,
      mockUpdatedProject,
      $httpBackend,
      $interval,
      $q,
      statuses,
      $http,
      $rootScope;

  var access = 'tenant_id';
  var endpoint = '/api/models/' + access + '/';
  var mockBaseModels = [{domain: 'News', source: 'en', target: 'es', model_id: 'enes-news'}];

  var mockCustomModels = [{
    custom_model_id: 'custom.id',
    name: 'custom.name',
    description: 'custom.description',
    domain: 'custom.domain',
    source: 'custom.source',
    target: 'custom.target',
    project: 'project',
    base_model_id: 'custom.base_model_id',
    file_batch_id: '1'
  }];

  var mockNewModel = {
    custom_model_id: 'new.id',
    name: 'new.name',
    description: 'new.description',
    domain: 'new.domain',
    source: 'new.source',
    target: 'new.target',
    project: 'project',
    base_model_id: 'new.base_model_id',
    file_batch_id: '2'
  };

  var newProject = {
    domain: 'news',
    source: 'en',
    target: 'es',
    name: 'new project',
    base_model_id: 'news-enes'
  };

  var mockClone,
      mockTranslation,
      mockTrainingStatus,
      mockTrainedStatus,
      numPolled;

  var mockFile = {
    query: function() {
      deferred = $q.defer();
      return {$promise: deferred.promise};
    }
  };

  // Setup the mock service in an anonymous module.
  beforeEach(module(function ($provide) {
    $provide.value('File', mockFile);
  }));

  beforeEach(inject(function (_Profiles_, _$httpBackend_, _$q_, _$interval_, _statuses_, _$http_, _$rootScope_) {
    Profiles = _Profiles_;
    $httpBackend = _$httpBackend_;
    $interval = _$interval_;
    $q = _$q_;
    statuses = _statuses_;
    $http = _$http_;
    $rootScope = _$rootScope_;

    mockClone = {name: 'cloned_model'};
    mockTranslation = {text: 'text', translation: 'translation'};
    mockTrainingStatus = {status: statuses.training, status_date: new Date()};
    mockTrainedStatus = {status: statuses.trained, status_date: new Date()};
    numPolled = 0;

    spyOn(mockFile, 'query').and.callThrough();
    spyOn(Profiles, 'update').and.callThrough();
    spyOn(Profiles, 'deleteModel').and.callThrough();

    $httpBackend.whenGET(endpoint + 'baseModels')
      .respond(200, mockBaseModels);
    $httpBackend.whenGET(endpoint + 'customModels')
      .respond(200, mockCustomModels);
    $httpBackend.whenPOST(endpoint + 'customModels')
      .respond(200, mockNewModel);
    $httpBackend.whenDELETE(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id)
      .respond(204);
    $httpBackend.whenDELETE(endpoint + 'customModels/' + mockNewModel.custom_model_id)
      .respond(204);
    $httpBackend.whenGET(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/train')
      .respond(200, mockCustomModels[0]);
    $httpBackend.whenPOST(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/translate')
      .respond(200, mockTranslation);
    $httpBackend.whenPOST(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/clone')
      .respond(200, mockClone);
    $httpBackend.whenPUT(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id)
      .respond(200, mockCustomModels[0]);
    $httpBackend.whenGET(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/status')
      .respond(function() {
        if(numPolled === 0) {
          numPolled++;
          return [200, mockTrainingStatus];
        } else {
          return [200, mockTrainedStatus];
        }
      });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('base models', function () {

    it('should load base models', function () {
      var d = mockBaseModels[0].domain;
      var s = mockBaseModels[0].source;
      var t = mockBaseModels[0].target;
      var id = mockBaseModels[0].model_id;

      // get base models for the first time
      Profiles.getBaseModels(access)
        .then(function(baseModels) {
          expect(baseModels[d].domain).toEqual(d);
          expect(baseModels[d].sources[s].source).toEqual(s);
          expect(baseModels[d].sources[s].targets[t].target).toEqual(t);
          expect(baseModels[d].sources[s].targets[t].model_id).toEqual(id);
        });

      $httpBackend.expectGET(endpoint + 'baseModels');
      $httpBackend.flush();

      // get cached base models - no request expected
      Profiles.getBaseModels(access)
        .then(function(baseModels) {
          expect(baseModels[d].domain).toEqual(d);
          expect(baseModels[d].sources[s].source).toEqual(s);
          expect(baseModels[d].sources[s].targets[t].target).toEqual(t);
          expect(baseModels[d].sources[s].targets[t].model_id).toEqual(id);
        });
    });

  });

  describe('Projects:', function () {

    it('should load models into projects', function () {
      // load models for the first time
      Profiles.loadProjects(access)
        .then(function(p) {
          projects = p;
        });

      $httpBackend.expectGET(endpoint + 'customModels');
      $httpBackend.flush();

      expect(projects[mockCustomModels[0].project]).toBeDefined();

      projects = null;

      // load cached models
      Profiles.loadProjects(access)
        .then(function(p) {
          expect(p[mockCustomModels[0].project]).toBeDefined();
        });
    });

    describe('Manipulating projects:', function () {

      beforeEach(function() {
        // load models
        Profiles.loadProjects(access)
          .then(function(p) {
            projects = p;

            mockUpdatedProject = angular.copy(p[mockCustomModels[0].project]);
            mockUpdatedProject.newName = 'updated name';
          });

        Profiles.selectProject(mockCustomModels[0].project);

        $httpBackend.expectGET(endpoint + 'customModels');
        $httpBackend.flush();
      });

      it('should add a project', function () {
        Profiles.addProject(newProject);

        expect(projects[newProject.name]).toBeDefined();
      });

      it('should set new project as current project', function () {
        Profiles.addProject(newProject);

        Profiles.getCurrentProject()
          .then(function(project) {
            expect(project.name).toEqual(newProject.name);
          });
      });

      it('should create empty model when adding a project', function () {
        Profiles.addProject(newProject);

        expect(projects[newProject.name].models).toBeDefined();
        expect(projects[newProject.name].models.length).toEqual(1);
        expect(projects[newProject.name].models[0].name).toEqual('');
        expect(projects[newProject.name].models[0].description).toEqual('');
        expect(projects[newProject.name].models[0].domain).toEqual(newProject.domain);
        expect(projects[newProject.name].models[0].source).toEqual(newProject.source);
        expect(projects[newProject.name].models[0].target).toEqual(newProject.target);
        expect(projects[newProject.name].models[0].base_model_id).toEqual(newProject.base_model_id);
        expect(projects[newProject.name].models[0].status).toEqual(statuses.created);
        expect(projects[newProject.name].models[0].newModel).toEqual(true);
      });

      it('should update all models in a project', function () {
        Profiles.updateProject(mockUpdatedProject, access)
          .then(function() {
            var models = projects[mockUpdatedProject.newName].models;

            for (var i = 0; i < models.length; ++i) {
              expect(Profiles.update).toHaveBeenCalled();
            }
          });

        $httpBackend.expectPUT(endpoint + 'customModels/' + mockUpdatedProject.models[0].custom_model_id);
        $httpBackend.flush();
      });

      it('should update a projects name', function () {
        var oldName = mockCustomModels[0].project;

        Profiles.updateProject(mockUpdatedProject, access)
          .then(function() {
            expect(projects[oldName]).not.toBeDefined();
            expect(projects[mockUpdatedProject.newName]).toBeDefined();
            expect(projects[mockUpdatedProject.newName].name).toEqual(mockUpdatedProject.newName);
          });

        $httpBackend.expectPUT(endpoint + 'customModels/' + mockUpdatedProject.models[0].custom_model_id);
        $httpBackend.flush();
      });

      it('should delete all models in a project', function () {
        var models = projects[mockCustomModels[0].project].models;
        var deletedProject = angular.copy(projects[mockCustomModels[0].project]);

        Profiles.deleteProject(projects[mockCustomModels[0].project], access)
          .then(function() {
            for (var i = 0; i < models.length; ++i) {
              expect(Profiles.deleteModel).toHaveBeenCalledWith(models[i], deletedProject, access);
            }
          });

        for (var i = 0; i < models.length; ++i) {
          $httpBackend.expectDELETE(endpoint + 'customModels/' + models[i].custom_model_id);
        }
        $httpBackend.flush();
      });

      it('should delete a project', function () {
        var projectName = mockCustomModels[0].project;
        var models = projects[projectName].models;

        Profiles.deleteProject(projects[projectName], access)
          .then(function() {
            expect(projects[projectName]).not.toBeDefined();
          });

        for (var i = 0; i < models.length; ++i) {
          $httpBackend.expectDELETE(endpoint + 'customModels/' + models[i].custom_model_id);
        }
        $httpBackend.flush();
      });

      it('should not delete a non-existant project', function () {
        var anotherProject = {name: 'another project'};

        Profiles.deleteProject(anotherProject, access)
          .then(function() {
            expect(Profiles.deleteModel).not.toHaveBeenCalled();
          });
      });

    });

  });

  describe('Models:', function () {

    beforeEach(function () {
      // load models
      Profiles.loadProjects(access)
        .then(function(p) {
          projects = p;
        });
      Profiles.selectProject(mockCustomModels[0].project);

      $httpBackend.expectGET(endpoint + 'customModels');
      $httpBackend.flush();
    });

    it('should create a model', function () {
      var model;
      Profiles.createModel(mockNewModel, access)
        .then(function(newModel) {
          model = newModel;
          expect(newModel.status).toEqual(statuses.created);
          expect(newModel.status_date).toBeDefined();
          expect(newModel.files).toBeDefined();
        });

      $httpBackend.expectPOST(endpoint + 'customModels');
      $httpBackend.flush();

      // check added to customModels
      Profiles.loadProjects(access)
        .then(function(p) {
          expect(p[mockNewModel.project].models.length).toEqual(2);
          expect(p[mockNewModel.project].models).toContain(model);
        });
    });

    // TODO: create a model in a new project

    it('should delete a model', function () {
      Profiles.deleteModel(mockCustomModels[0], access);

      $httpBackend.expectDELETE(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id);
      $httpBackend.flush();

      // check deleted from customModels
      Profiles.loadProjects(access)
        .then(function(projects) {
          expect(projects[mockCustomModels[0].project].models.length).toEqual(0);
          expect(projects[mockCustomModels[0].project].models).not.toContain(mockCustomModels[0]);
        });
    });

    it('should not delete a non-existant model', function () {
      Profiles.deleteModel(mockNewModel, access);

      $httpBackend.expectDELETE(endpoint + 'customModels/' + mockNewModel.custom_model_id);
      $httpBackend.flush();

      // check deleted from customModels
      Profiles.loadProjects(access)
        .then(function(projects) {
          expect(projects[mockCustomModels[0].project].models.length).toEqual(1);
        });
    });

    it('should not attempt to delete an undefined model id', function () {
      var testModel = {
        name: 'new.name',
        description: 'new.description',
        domain: 'new.domain',
        source: 'new.source',
        target: 'new.target',
        project: 'project',
        base_model_id: 'new.base_model_id',
        file_batch_id: '2'
      };
      spyOn($http, 'delete');
      Profiles.deleteModel(testModel, access);
      expect($http.delete).not.toHaveBeenCalled();
    });

    it('should clone a model', function () {
      Profiles.cloneModel(mockCustomModels[0]);

      Profiles.loadProjects(access)
        .then(function(projects) {
          expect(projects[mockCustomModels[0].project].models.length).toEqual(2);
          expect(projects[mockCustomModels[0].project].models[1].unconfirmed).toBeTruthy();
          expect(projects[mockCustomModels[0].project].models[1].status).toEqual(statuses.created);
        });
    });

    it('should increment model name if name already taken', function () {
      Profiles.cloneModel(mockCustomModels[0]);

      Profiles.loadProjects(access)
        .then(function(projects) {
          expect(projects[mockCustomModels[0].project].models.length).toEqual(2);
          expect(projects[mockCustomModels[0].project].models[1].unconfirmed).toBeTruthy();
          expect(projects[mockCustomModels[0].project].models[1].status).toEqual(statuses.created);
          expect(projects[mockCustomModels[0].project].models[1].name).toEqual(mockCustomModels[0].name + '_1');
        });
    });

    it('should confirm a clone', function () {
      var m;
      Profiles.loadProjects(access)
        .then(function(projects) {
          Profiles.cloneModel(mockCustomModels[0])
            .then(function(model) {
              m = model;
              Profiles.confirmClone(model, access)
                .then(function(clonedModel) {
                  expect(projects[mockCustomModels[0].project].models.length).toEqual(2);
                  expect(clonedModel.unconfirmed).toBeUndefined();
                  expect(clonedModel.name).toEqual(mockClone.name);
                });
            });
        });

      $httpBackend.expectPOST(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/clone', m);
      $httpBackend.flush();
    });

    it('should issue alert if cloning an unconfirmed model', function () {

      var cloneModel1 = Profiles.cloneModel(mockCustomModels[0]);
      $rootScope.$apply();

      var cloneModel2 = Profiles.cloneModel(mockCustomModels[0]);
      $rootScope.$apply();

      expect(projects[mockCustomModels[0].project].models.length).toEqual(2);
      // Ensure the 1st clone has worked successfully
      expect(cloneModel1.$$state.status).toEqual(1);
      // Ensure the 2nd clone has been rejected
      expect(cloneModel2.$$state.status).toEqual(2);
    });

    it('should train a model', function () {
      Profiles.train(mockCustomModels[0], access)
        .then(function(model) {
          expect(model).toEqual(mockCustomModels[0]);
        });

      $httpBackend.expectGET(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/train');
      $httpBackend.flush();
    });

    it('should poll a model', function () {
      Profiles.poll(mockCustomModels[0], access)
        .then(function(status) {
          expect(status.status).toEqual(statuses.trained);
        });

      $interval.flush(2000 * 60);
      $httpBackend.flush();
    });

    it('should not poll the same model twice', function () {
      // Start polling model
      Profiles.poll(mockCustomModels[0], access)
        .then(function() {
          expect(Profiles.getPollingModels().length).toBe(1);
        });

      // Poll the same model a second time
      Profiles.poll(mockCustomModels[0], access)
        .then(function() {
          expect(Profiles.getPollingModels().length).toBe(1);
        });

      $interval.flush(2000 * 60);
      $httpBackend.flush();
    });

    it('should translate a model', function () {
      var text = 'text';

      Profiles.translate(mockCustomModels[0], text, access)
        .then(function(translation) {
          expect(translation).toEqual(mockTranslation);
        });

      $httpBackend.expectPOST(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id + '/translate', {text: text});
      $httpBackend.flush();
    });

    it('should update a model', function () {
      var newStatus = 'new status';
      Profiles.update(mockCustomModels[0], newStatus, access)
        .then(function(model) {
          expect(model.custom_model_id).toEqual(mockCustomModels[0].custom_model_id);
        });

      $httpBackend.expectPUT(endpoint + 'customModels/' + mockCustomModels[0].custom_model_id);
      $httpBackend.flush();
    });

  });

});
