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

describe('Controller: ProjectsCtrl', function () {

  // load the controller's module
  beforeEach(module('mtTrainingApp'));

  var ProjectsCtrl,
      $scope,
      $location,
      $q,
      $modal,
      $rootScope,
      deferredBaseModels,
      deferredProjects,
      deferred,
      mockProjects,
      mockNewProject,
      modalOptions;

  var access = 'tenant_id';

  var mockModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
        this.confirmCallBack = confirmCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function(item) {
      //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
      this.result.confirmCallBack(item);
    },
    dismiss: function(type) {
      //The user clicked cancel on the modal dialog, call the stored cancel callback
      this.result.cancelCallback(type);
    }
  };

  var deleteOptions = {
    animation: true,
    templateUrl: 'app/modals/delete/delete.html',
    windowTemplateUrl: 'app/modals/main-template.html',
    controller: 'deleteCtrl',
    // size: 'sm',
    resolve: {
      deleted: jasmine.any(Function),
      objectType: jasmine.any(Function)
    }
  };

  var mockBaseModels = {
    news: {
      domain: 'news',
      sources: {
        en: {
          source: 'en',
          targets: {
            es: {
              model_id: 'com.ibm.mt.models.en-es-news',
              target: 'es'
            },
            fr: {
              model_id: 'com.ibm.mt.models.en-fr-news',
              target: 'fr'
            }
          }
        },
        es: {
          source: 'es',
          targets: {
            en: {
              model_id: 'com.ibm.mt.models.es-en-news',
              target: 'en'
            },
            fr: {
              model_id: 'com.ibm.mt.models.es-fr-news',
              target: 'fr'
            }
          }
        }
      }
    },
    patent: {
      domain: 'patent',
      sources: {
        fr: {
          source: 'fr',
          targets: {
            es: {
              model_id: 'com.ibm.mt.models.fr-es-patent',
              target: 'es'
            },
            en: {
              model_id: 'com.ibm.mt.models.fr-en-patent',
              target: 'en'
            }
          }
        }
      }
    }
  };

  var sortOpts = [
    {name:'Date', field: 'models', child: 'status_date'},
    {name:'Name', field: 'name'}
  ];

  var mockProfiles = {
      getBaseModels: function() {
        deferredBaseModels = $q.defer();
        return deferredBaseModels.promise;
      },
      selectProject: function() {
      },
      getCurrentProject: function() {
      },
      loadProjects: function() {
        deferredProjects = $q.defer();
        return deferredProjects.promise;
      },
      addProject: function() {
      },
      deleteProject: function() {
      },
      updateProject: function() {
        deferred = $q.defer();
        return deferred.promise;
      }
    };

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$rootScope_, _$location_, _$q_, _$modal_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $location = _$location_;
    $q = _$q_;
    $modal = _$modal_;

    spyOn(mockProfiles, 'getBaseModels').and.callThrough();
    spyOn(mockProfiles, 'selectProject').and.callThrough();
    spyOn(mockProfiles, 'getCurrentProject').and.callThrough();
    spyOn(mockProfiles, 'loadProjects').and.callThrough();
    spyOn(mockProfiles, 'addProject').and.callThrough();
    spyOn(mockProfiles, 'deleteProject').and.callThrough();
    spyOn(mockProfiles, 'updateProject').and.callThrough();

    spyOn($modal, 'open').and.callFake(function(options) {
      modalOptions = options;
      return mockModal;
    });

    ProjectsCtrl = $controller('ProjectsCtrl', {
      $scope: $scope,
      $location: $location,
      $q: $q,
      Profiles: mockProfiles,
      access: access
    });
  }));

  beforeEach(function() {
    mockProjects = {
      mockProject: {
        name: 'mockProject',
        domain: 'patent',
        model_id: 'com.ibm.mt.models.zh-en-patent',
        source: 'zh',
        target: 'en',
        models: [{
          base_model_id: 'com.ibm.mt.models.zh-en-patent',
          custom_model_id: '2c80fa477af198d55d746f8b6e3b0be7',
          description: '',
          domain: 'patent',
          file_batch_id: '2c80fa477af198d55d746f8b6e3b0be7BatchId',
          name: 'mockModel',
          project: 'mockProject',
          source: 'zh',
          status: 'CREATED',
          status_date: '2015-08-07T08:53:48.754Z',
          target: 'en',
          trained_model_id: 'UNTRAINED'
        }]
      },
      mockProjectTwo: {
        name: 'mockProjectTwo',
        domain: 'news',
        model_id: 'com.ibm.mt.models.es-en-news',
        source: 'es',
        target: 'en',
        models: [{
          base_model_id: 'com.ibm.mt.models.es-en-news',
          custom_model_id: '2c80fa477af198d55d746f8b6e3b0be8',
          description: '',
          domain: 'news',
          file_batch_id: '2c80fa477af198d55d746f8b6e3b0be7BatchId',
          name: 'mockModelTwo',
          project: 'mockProjectTwo',
          source: 'es',
          status: 'CREATED',
          status_date: '2015-08-07T08:53:48.754Z',
          target: 'en',
          trained_model_id: 'UNTRAINED'
        }]
      }
    };

    deferredProjects.resolve(mockProjects);
    deferredBaseModels.resolve(mockBaseModels);
    $rootScope.$apply();
  });

  /**
   * SETUP
   * - Load models/projects
   * - Load base models
   * - Filtering
   * - Sorting
   */

  describe('Setup projects:', function() {

    it('should load projects', function () {
      expect($scope.projects).toEqual(mockProjects);
    });

    it('should load base models', function () {
      expect($scope.baseModels).toEqual(mockBaseModels);
    });

    it('should sort projects by date', function () {
      $scope.sortBy(sortOpts[0]);
      expect($scope.sortOption).toEqual(sortOpts[0]);
    });

    it('should sort projects by name', function () {
      $scope.sortBy(sortOpts[1]);
      expect($scope.sortOption).toEqual(sortOpts[1]);
    });

    it('should check if projects are empty', function () {
      expect($scope.isProjectsEmpty()).toEqual(false);
    });

    it('should check if projects are empty', function () {
      $scope.projects = {};
      expect($scope.isProjectsEmpty()).toEqual(true);
    });

    it('should set up newProject', function() {
      expect($scope.newProject.domain).toBeDefined();
      expect($scope.newProject.source).toBeDefined();
      expect($scope.newProject.target).toBeDefined();
      expect($scope.newProject.base_model_id).toBeDefined();
    });

  });

  /**
   * ADD NEW PROJECT
   * - Add project
   * - Change location
   * - New project has all required properties
   * - Update source & target
   */

  describe('Adding new projects:', function() {

    beforeEach(function() {
      mockNewProject = {
        name: 'mockNewProject',
        domain: 'patent',
        base_model_id: 'com.ibm.mt.models.fr-es-patent',
        source: 'fr',
        target: 'es'
      };
    });

    it('should add a new project', function() {
      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).toHaveBeenCalled();
    });

    it('should change the location', function() {
      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect($location.url()).toBe('/models');
    });

    it('should not add a duplicate project', function() {
      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockProjects.mockProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with default panel settings', function() {
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with no name', function() {
      delete mockNewProject.name;

      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with no domain', function() {
      delete mockNewProject.domain;

      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with no source', function() {
      delete mockNewProject.source;

      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with no target', function() {
      delete mockNewProject.target;

      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

    it('should not add a new project with no base_model_id', function() {
      delete mockNewProject.base_model_id;

      $scope.newProjectPanel = mockNewProject;
      $scope.newProject = mockNewProject;
      $scope.addProject();

      expect(mockProfiles.addProject).not.toHaveBeenCalled();
    });

  });

  /**
   * UPDATE PROJECT
   * - Change name
   * - Unique name
   * - Delete project
   */

  describe('Updating projects:', function() {

    it('should leave edit mode after updating project', function() {
      $scope.startEdit($scope.projects.mockProject);
      $scope.projects.mockProject.newName = 'something else';
      $scope.applyChanges($scope.projects.mockProject);

      expect(mockProfiles.updateProject).toHaveBeenCalledWith($scope.projects.mockProject, access);
      deferred.resolve();
      $rootScope.$apply();

      expect($scope.projects.mockProject.editing).not.toBeDefined();
    });

    it('should not update if projects name has not changed', function() {
      $scope.startEdit($scope.projects.mockProject);
      $scope.applyChanges($scope.projects.mockProject);

      expect(mockProfiles.updateProject).not.toHaveBeenCalled();
      expect($scope.projects.mockProject.editing).not.toBeDefined();
    });

    it('should not update a projects name if the name already exists', function() {
      $scope.startEdit($scope.projects.mockProject);
      $scope.projects.mockProject.newName = 'mockProjectTwo';
      $scope.applyChanges($scope.projects.mockProject);

      expect(mockProfiles.updateProject).not.toHaveBeenCalled();
      expect($scope.projects.mockProject.editing).toBeDefined();
    });

    it('should dismiss deleting a project', function () {
      $scope.deleteProject($scope.projects.mockProject);

      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);

      $scope.modalInstance.dismiss();
      expect($scope.modalInstance).toBeUndefined();
    });

    it('should delete a project', function () {
      $scope.deleteProject($scope.projects.mockProject);
      expect($scope.modalInstance).toEqual(mockModal);
      expect($modal.open).toHaveBeenCalledWith(deleteOptions);
      expect(modalOptions.resolve.deleted()).toEqual($scope.projects.mockProject);

      $scope.modalInstance.close($scope.projects.mockProject);

      deferred.resolve();
      $rootScope.$apply();

      expect(mockProfiles.deleteProject).toHaveBeenCalledWith($scope.projects.mockProject, access);
    });

  });

});
