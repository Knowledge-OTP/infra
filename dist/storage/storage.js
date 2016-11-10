(function (angular) {
    'use strict';

    angular.module('znk.infra.storage', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('InvitationStorageSrv',
        ["StorageFirebaseAdapter", "ENV", "StorageSrv", "AuthService", function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
        'ngInjedct';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + 'invitations');
            var config = {
                variables: {
                    uid: function () {
                        var auth = AuthService.getAuth();
                        return auth && auth.uid;
                    }
                },
                cacheRules: [/.*/]
            };

            var storage = new StorageSrv(fbAdapter, config);

            storage.getInvitationObject = function (inviteId) {
                return storage.get(inviteId);
            };

            return storage;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('StorageFirebaseAdapter',
        ["$log", "$q", "StorageSrv", "ENV", "$timeout", function ($log, $q, StorageSrv, ENV, $timeout) {
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

            function StorageFirebaseAdapter(endPoint) {
                this.__refMap = {};

                this.__refMap.rootRef = new Firebase(endPoint, ENV.firebaseAppScopeName);

                this.__registeredEvents = {};
            }

            var storageFirebaseAdapterPrototype = {
                getRef: function (relativePath) {
                    if (relativePath === '' || angular.isUndefined(relativePath) || angular.isUndefined(relativePath) || relativePath === null) {
                        return this.__refMap.rootRef;
                    }

                    if (!this.__refMap[relativePath]) {
                        this.__refMap[relativePath] = this.__refMap.rootRef.child(relativePath);
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

                    this.__refMap.rootRef.update(pathsToUpdateCopy, function (err) {
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
                            self.__registeredEvents[type][path].firstOnWasInvoked = true;
                            var newVal = snapshot.val();
                            var key = snapshot.key();
                            self.__invokeEventCb(type, path, [newVal, key]);
                        });
                    } else {
                        if (self.__registeredEvents[type][path].firstOnWasInvoked) {
                            self.get(path).then(function (newVal) {
                                cb(newVal);
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
                    if (!this.__registeredEvents[type] || !this.__registeredEvents[type][path]) {
                        return;
                    }

                    var _firstOnWasInvoked = this.__registeredEvents[type][path].firstOnWasInvoked;

                    if (angular.isUndefined(cb)) {
                        this.__registeredEvents[type][path] = [];
                        this.__registeredEvents[type][path].firstOnWasInvoked = _firstOnWasInvoked;
                        return;
                    }

                    var eventCbArr = this.__registeredEvents[type][path];
                    var newEventCbArr = [];
                    eventCbArr.forEach(function (cb) {
                        if (cb !== cb) {
                            newEventCbArr.push(cb);
                        }
                    });
                    this.__registeredEvents[type][path] = newEventCbArr;
                    this.__registeredEvents[type][path].firstOnWasInvoked = _firstOnWasInvoked;
                }
            };
            StorageFirebaseAdapter.prototype = storageFirebaseAdapterPrototype;

            return StorageFirebaseAdapter;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q', '$log',
        function ($cacheFactory, $q, $log) {
            var getEntityPromMap = {};

            var cacheId = 0;

            /**
             *  adapter - implement the following interface:
             *      - get(path): get path value
             *      - set(path, value): set the value in the path
             *      - update(path, value
             *      - onEvent: curretnly supported events:
             *          value: value was changed
             *      - offEvent
             *
             *  config -
             *      cacheRules - rules which control whether path should be cached, the possible values are:
             *          string - if the path equal to the rule string the it will not be cached.
             *          function - receive the path as argument, if the function return true then the path will not be cached.
             *          regex - if the path matches the regex then it will not be cached.
             *
             *      variables -
             *          uid - function or value which return current uid as straight value or promise
             * */
            function StorageSrv(adapter, config) {
                this.adapter = adapter;

                this.__cache = $cacheFactory('entityCache' + cacheId);

                config = config || {};
                var defaultConfig = {
                    variables: {
                        uid: null
                    },
                    cacheRules: []
                };
                this.__config = angular.extend(defaultConfig, config);

                this.__pathsBindedToServer = {};

                //progress by 1 storage cache id
                cacheId++;
            }

            function _shouldBeCached(path, config) {
                var cacheRules = config.cacheRules;

                for (var i = 0; i < cacheRules.length; i++) {
                    var rule = cacheRules[i];
                    var shouldNotBeCached = false;

                    if (angular.isString(rule)) {
                        shouldNotBeCached = rule === path;
                    }

                    if (angular.isFunction(rule)) {
                        shouldNotBeCached = rule(path);
                    }

                    if (rule instanceof RegExp) {
                        shouldNotBeCached = rule.test(path);
                    }

                    if (shouldNotBeCached) {
                        return false;
                    }
                }
                return true;
            }

            StorageSrv.EVENTS = {
                'VALUE': 'value',
                'CHILD_CHANGED': 'child_changed'
            };

            StorageSrv.prototype.__processPath = function (pathStrOrObj) {
                var config = this.__config;
                function _replaceVariables(path, uid) {
                    var regexString = StorageSrv.variables.uid.replace(/\$/g, '\\$');
                    var UID_REGEX = new RegExp(regexString, 'g');
                    return path.replace(UID_REGEX, uid);
                }

                function _getUid() {
                    var getUid = angular.isFunction(config.variables.uid) ? config.variables.uid() : config.variables.uid;
                    return $q.when(getUid);
                }

                return _getUid().then(function (uid) {
                    if (angular.isUndefined(uid) || uid === null) {
                        $log.debug('StorageSrv: empty uid was received');
                    }

                    if (angular.isString(pathStrOrObj)) {
                        var processedPath = _replaceVariables(pathStrOrObj, uid);
                        return processedPath;
                    }

                    if (angular.isObject(pathStrOrObj)) {
                        var processedPathObj = {};
                        angular.forEach(pathStrOrObj, function (value, pathName) {
                            var processedPath = _replaceVariables(pathName, uid);
                            processedPathObj[processedPath] = value;
                        });

                        return processedPathObj;
                    }
                    $log.error('StorageSrv: failed to process path');

                    return null;
                });
            };

            StorageSrv.prototype.__addDataToCache = function (pathStrOrObj, newValue) {
                var self = this;

                var dataToSaveInCache = {};

                if (angular.isString(pathStrOrObj)) {
                    dataToSaveInCache[pathStrOrObj] = newValue;
                } else {
                    dataToSaveInCache = pathStrOrObj;
                }

                var cachedDataMap = {};
                angular.forEach(dataToSaveInCache, function (value, path) {
                    var cachedValue;

                    if (angular.isObject(value) && !value.$save) {
                        cachedValue = Object.create({
                            $save: function () {
                                return self.update(path, this);
                            },
                            $$path: path
                        });
                        angular.forEach(value, function (value, key) {
                            cachedValue[key] = value;
                        });
                    } else {
                        cachedValue = value;
                    }

                    cachedDataMap[path] = cachedValue;

                    if (_shouldBeCached(path, self.__config)) {
                        self.__cache.put(path, cachedValue);
                    }
                });

                return angular.isObject(pathStrOrObj) ? cachedDataMap : cachedDataMap[pathStrOrObj];
            };

            StorageSrv.prototype.__addPathBindedToServer = function(path){
                this.__pathsBindedToServer[path] = true;
            };

            StorageSrv.prototype.removeServerPathBinding = function(path){
                this.adapter.offEvent(StorageSrv.EVENTS.VALUE, path);
            };

            StorageSrv.prototype.get = function (path, defaultValue) {
                var self = this;

                return this.__processPath(path, self.__config).then(function (processedPath) {
                    var entity = self.__cache.get(processedPath);
                    var getProm;
                    defaultValue = defaultValue || {};
                    var cacheProm = false;

                    if (entity) {
                        getProm = $q.when(entity);
                    } else {
                        if (getEntityPromMap[processedPath]) {
                            return getEntityPromMap[processedPath];
                        }
                        cacheProm = true;
                        getProm = $q.when(self.adapter.get(processedPath)).then(function (_entity) {
                            if (angular.isUndefined(_entity) || _entity === null) {
                                _entity = {};
                            }

                            if (angular.isObject(_entity)) {
                                var initObj = Object.create({
                                    $save: function () {
                                        return self.update(processedPath, this);
                                    },
                                    $$path: processedPath
                                });
                                _entity = angular.extend(initObj, _entity);
                            }

                            if (_shouldBeCached(processedPath, self.__config)) {
                                self.__cache.put(processedPath, _entity);
                            }

                            delete getEntityPromMap[processedPath];

                            return _entity;
                        });
                    }
                    getProm = getProm.then(function (_entity) {
                        var keys = Object.keys(defaultValue);
                        keys.forEach(function (key) {
                            if (angular.isUndefined(_entity[key])) {
                                _entity[key] = angular.copy(defaultValue[key]);
                            }
                        });
                        return _entity;
                    });

                    if (cacheProm) {
                        getEntityPromMap[path] = getProm;
                    }

                    return getProm;
                });
            };

            StorageSrv.prototype.getServerValue = function (path) {
                var self = this;
                return this.__processPath(path, self.__config).then(function (processedPath) {
                    return $q.when(self.adapter.get(processedPath));
                });
            };

            StorageSrv.prototype.getAndBindToServer = function (path) {
                var self = this;

                return this.get(path).then(function (pathValue) {
                    self.adapter.onEvent('value', pathValue.$$path, function (serverValue) {
                        if (typeof serverValue !== 'object'){
                            $log.error('getAndBindToServer Fn support only object value');
                        }

                        angular.extend(pathValue, serverValue);
                    });
                    self.__addPathBindedToServer(path);
                    return pathValue;
                });
            };

            StorageSrv.prototype.set = function (path, newValue) {
                var self = this;

                if (!angular.isString(path)) {
                    var errMSg = 'StorageSrv: path should be a string';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return this.__processPath(path, self.__config).then(function (processedPath) {
                    return $q.when(self.adapter.set(processedPath, newValue)).then(function () {
                        return self.__addDataToCache(processedPath, newValue);
                    });
                });
            };

            StorageSrv.prototype.update = function (pathStrOrObj, newValue) {
                var self = this;

                return this.__processPath(pathStrOrObj, self.__config).then(function (processedPathOrObj) {
                    return $q.when(self.adapter.update(processedPathOrObj, newValue)).then(function () {
                        return self.__addDataToCache(processedPathOrObj, newValue);
                    });
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.prototype.cleanPathCache = function (path) {
                this.__cache.remove(path);
            };

            StorageSrv.prototype.onEvent = function(){
                return this.adapter.onEvent.apply(this.adapter, arguments);
            };

            StorageSrv.prototype.offEvent = function(){
                return this.adapter.offEvent.apply(this.adapter, arguments);
            };

            StorageSrv.variables = {
                currTimeStamp: '%currTimeStamp%',
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            function EntityCommunicator(path, defaultValue, storage) {
                this.path = path;
                this.defaultValue = defaultValue;
                this.storage = storage;
            }

            EntityCommunicator.prototype.get = function () {
                return this.storage.get(this.path);
            };

            EntityCommunicator.prototype.set = function (newVal) {
                return this.storage.set(this.path, newVal);
            };

            return StorageSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.storage').run(['$templateCache', function($templateCache) {

}]);
