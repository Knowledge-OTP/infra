(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('StorageFirebaseAdapter',
        function ($log, $q, StorageSrv, ENV, $timeout) {
            'ngInject';

            function processValue(value) {
                if (value === StorageSrv.variables.currTimeStamp) {
                    return Firebase.ServerValue.TIMESTAMP;
                }
                return value;
            }

            function processValuesToSet(source) {
                if (angular.isArray(source)) {
                    source.forEach(function (item, index) {
                        if (angular.isUndefined(item)) {
                            source[index] = null;
                        }
                        processValuesToSet(item);
                    });
                }

                if (angular.isObject(source)) {
                    var keys = Object.keys(source);
                    keys.forEach(function (key) {
                        var value = source[key];

                        if (key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length) || (value !== value)) { //value !== value return true if it equals to NaN
                            if (key !== '$save') {
                                $log.debug('storageFirebaseAdapter: illegal property was deleted before save ' + key);
                            }
                            delete source[key];
                            return;
                        }

                        if (angular.isString(value)) {
                            source[key] = processValue(value);
                        }

                        processValuesToSet(value);
                    });
                }
            }

            function StorageFirebaseAdapter() {
                this.__refMap = {};

                this.__refMap.rootRef = initializeFireBase(); //new Firebase(endPoint, ENV.firebaseAppScopeName);

                this.__registeredEvents = {};
            }

            function initializeFireBase(){
                var config = {
                    apiKey: ENV.firebase_apiKey,
                    authDomain:  ENV.firebase_projectId + ".firebaseapp.com",
                    databaseURL: ENV.fbDataEndPoint,
                    projectId: ENV.firebase_projectId,
                    storageBucket: ENV.firebase_projectId + ".appspot.com",
                    messagingSenderId: ENV.messagingSenderId
            };
                return window.firebase.initializeApp(config);
            }

            var storageFirebaseAdapterPrototype = {
                getRef: function (relativePath) {
                    if (relativePath === '' || angular.isUndefined(relativePath) || angular.isUndefined(relativePath) || relativePath === null) {
                        return this.__refMap.rootRef;
                    }

                    if (!this.__refMap[relativePath]) {
                        this.__refMap[relativePath] = this.__refMap.rootRef.database().child(relativePath);
                    }

                    return this.__refMap[relativePath];
                },
                get: function (relativePath) {
                    var defer = $q.defer();

                    var ref = this.getRef(relativePath);
                    ref.once('value', function (dataSnapshot) {
                        defer.resolve(dataSnapshot.val());
                    }, function (err) {
                        $log.error('storageFirebaseAdapter: failed to retrieve data for the following path ' + relativePath + ' ' + err);
                        defer.reject(err);
                    });

                    return defer.promise;
                },
                update: function (relativePathOrObject, newValue) {
                    var pathsToUpdate = {};

                    if (!angular.isObject(relativePathOrObject)) {
                        pathsToUpdate[relativePathOrObject] = newValue;
                    } else {
                        pathsToUpdate = relativePathOrObject;
                    }

                    var pathsToUpdateCopy = angular.copy(pathsToUpdate);

                    processValuesToSet(pathsToUpdateCopy);

                    var defer = $q.defer();

                    this.__refMap.rootRef.database().update(pathsToUpdateCopy, function (err) {
                        if (err) {
                            if (angular.isObject(pathsToUpdateCopy)) {
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + JSON.stringify(pathsToUpdateCopy) + ' ' + err);
                            } else {
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + pathsToUpdateCopy + ' ' + err);
                            }
                            return defer.reject(err);
                        }
                        defer.resolve(angular.isString(relativePathOrObject) ? newValue : relativePathOrObject);
                    });

                    return defer.promise;
                },
                set: function (relativePath, newValue) {
                    var newValueCopy = angular.copy(newValue);

                    processValuesToSet(newValueCopy);

                    var ref = this.getRef(relativePath);
                    return ref.set(newValueCopy);
                },
                onEvent: function (type, path, cb) {
                    var self = this;

                    if (!this.__registeredEvents[type]) {
                        this.__registeredEvents[type] = {};
                    }

                    if (!this.__registeredEvents[type][path]) {
                        this.__registeredEvents[type][path] = [];

                        var ref = this.getRef(path);
                        ref.on(type, function (snapshot) {
                            if (!self.__registeredEvents[type][path]) { self.__registeredEvents[type][path] = []; }
                            self.__registeredEvents[type][path].firstOnWasInvoked = true;
                            var newVal = snapshot.val();
                            var key = snapshot.key();
                            self.__invokeEventCb(type, path, [newVal, key]);
                        });
                    } else {
                        if (self.__registeredEvents[type][path].firstOnWasInvoked) {
                            self.get(path).then(function (newVal) {
                                if (angular.isDefined(newVal) && newVal !== null && type === 'child_added') {
                                    var keys = Object.keys(newVal);
                                    angular.forEach(keys, function (key) {
                                        cb(newVal[key], key);
                                    });
                                } else {
                                    cb(newVal, path);
                                }
                            });
                        }
                    }

                    var evtCbArr = this.__registeredEvents[type][path];
                    evtCbArr.push(cb);
                },
                __invokeEventCb: function (type, path, argArr) {
                    if (!this.__registeredEvents[type] || !this.__registeredEvents[type][path]) {
                        return;
                    }

                    var eventCbArr = this.__registeredEvents[type][path];
                    //fb event so we out of angular
                    $timeout(function () {
                        eventCbArr.forEach(function (cb) {
                            cb.apply(null, argArr);
                        });
                    });
                },
                offEvent: function (type, path, cb) {
                    if (!this.__registeredEvents[type] || !this.__registeredEvents[type][path] || angular.isUndefined(cb)) {
                        if(angular.isUndefined(cb)){
                            $log.debug('storageFirebaseAdapter: offEvent called without callback');
                        }
                        return;
                    }

                    var _firstOnWasInvoked = this.__registeredEvents[type][path].firstOnWasInvoked;

                    var eventCbArr = this.__registeredEvents[type][path];
                    var newEventCbArr = [];
                    eventCbArr.forEach(function (_cb) {
                        if (cb !== _cb) {
                            newEventCbArr.push(_cb);
                        }
                    });

                    if(newEventCbArr.length > 0){
                        this.__registeredEvents[type][path] = newEventCbArr;
                        this.__registeredEvents[type][path].firstOnWasInvoked = _firstOnWasInvoked;
                    } else {
                        delete this.__registeredEvents[type][path];
                    }
                }
            };
            StorageFirebaseAdapter.prototype = storageFirebaseAdapterPrototype;

            return StorageFirebaseAdapter;
        });
})(angular);
