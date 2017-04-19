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

angular.module('mtTrainingApp').service("Alerts", function() {
    var listeners = [];
    var alerts = [];
    return {
        subscribe: function(callback) {
            listeners.push(callback);
        },
        publish: function(alert) {
            if(!alert) return;
            var now = new Date();
            alert.id = now.getTime();
            alerts.push(alert);
            angular.forEach(listeners, function(value, key) {
                value(alert);
            });
        },
        count: function() {
            return alerts.length;
        },
        getAll: function() {
            return alerts;
        },
        removeAlert: function(alert) {
            for(var i=0; i<alerts.length; i++) {
                if(alert.id == alerts[i].id && alert.message == alerts[i].message) {
                    alerts.splice(i, 1);
                    break;
                }
            }
        },
        clear: function() {
            alerts = [];
        }
    };
});
