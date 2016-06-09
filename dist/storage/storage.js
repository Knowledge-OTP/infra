(function (angular) {
    'use strict';

    angular.module('znk.infra.storage', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q', 'StorageSrv', 'ENV',
        function ($log, $q, StorageSrv, ENV) {
            function processValuesToSet(source){
                if(angular.isArray(source)){
                    source.forEach(function(item, index){
                        if(angular.isUndefined(item)){
                            source[index] = null;
                        }
                        processValuesToSet(item);
                    });
                    return;
                }

                if(angular.isObject(source)){
                    var keys = Object.keys(source);
                    keys.forEach(function(key){
                        var value = source[key];

                        if(key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length) || (value !== value)){//value !== value return true if it equals to NaN
                            if(key !== '$save'){
                                $log.debug('storageFirebaseAdapter: illegal property was deleted before save ' + key);
                            }
                            delete source[key];
                            return;
                        }

                        if(angular.isString(value)){
                            source[key] = processValue(value);
                        }

                        processValuesToSet(value);
                    });
                    return;
                }
            }

            function storageFirebaseAdapter (endPoint){
                var refMap = {};
                var authObj;
                var rootRef = new Firebase(endPoint, ENV.firebaseAppScopeName);
                refMap.rootRef = rootRef;
                rootRef.onAuth(function(newAuthObj){
                    authObj = newAuthObj;
                });

                function getRef(relativePath){
                    if(!refMap[relativePath]){
                        refMap[relativePath] = refMap.rootRef.child(relativePath);
                    }
                    return refMap[relativePath];
                }

                function get(relativePath){
                    var defer = $q.defer();

                    var ref = getRef(relativePath);
                    ref.once('value',function(dataSnapshot){
                        defer.resolve(dataSnapshot.val());
                    },function(err){
                        $log.error('storageFirebaseAdapter: failed to retrieve data for the following path ' + relativePath + ' ' + err);
                        defer.reject(err);
                    });
                    return defer.promise;
                }

                function set(relativePathOrObject, newValue){
                    var defer = $q.defer();

                    if(angular.isObject(relativePathOrObject)){
                        var valuesToSet ={};
                        angular.forEach(relativePathOrObject,function(value,path){
                            valuesToSet[path] = angular.copy(value);
                        });
                        processValuesToSet(valuesToSet);
                        refMap.rootRef.update(valuesToSet, function(err){
                            if(err){
                                defer.reject(err);
                            }
                            defer.resolve();
                        });
                    }else{
                        var newValueCopy = angular.copy(newValue);
                        processValuesToSet(newValueCopy);
                        var ref = getRef(relativePathOrObject);
                        ref.set(newValueCopy,function(err){
                            if(err){
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + relativePathOrObject + ' ' + err);
                                defer.reject(err);
                            }else{
                                defer.resolve(newValueCopy);
                            }
                        });
                    }

                    return defer.promise;
                }

                return {
                    get: get,
                    set: set,
                    __refMap: refMap//for testing
                };
            }

            function processValue(value){
                if(value === StorageSrv.variables.currTimeStamp){
                    return Firebase.ServerValue.TIMESTAMP;
                }
                return value;
            }

            return storageFirebaseAdapter;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q', '$log',
        function ($cacheFactory, $q, $log) {
            var getEntityPromMap = {};

            var cacheId = 0;

            /**
             *  entityGetter -
             *  entitySetter -
             *  config-
             *      cacheRules - rules which control whether path should be cached, the possible values are:
             *          string - if the path equal to the rule string the it will not be cached.
             *          function - receive the path as argument, if the function return true then the path will not be cached.
             *          regex - if the path matches the regex then it will not be cached.
             *      variables -
             *          uid - function or value which return current uid as straight value or promise
             * */
            function StorageSrv(entityGetter, entitySetter, config) {
                this.getter = function (path) {
                    return $q.when(entityGetter(path));
                };

                this.setter = function (path, newVal) {
                    return $q.when(entitySetter(path, newVal));
                };

                this.entityCache = $cacheFactory('entityCache' + cacheId);

                config = config || {};
                var defaultConfig = {
                    variables: {
                        uid: null
                    },
                    cacheRules: []
                };
                this.config = angular.extend(defaultConfig, config);

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

            function _getUid(config) {
                var getUid = angular.isFunction(config.variables.uid) ? config.variables.uid() : config.variables.uid;
                return $q.when(getUid);
            }

            function _processPath(pathStrOrObj, config) {
                return _getUid(config).then(function (uid) {
                    function _replaceVariables(path){
                        var regexString = StorageSrv.variables.uid.replace(/\$/g, '\\$');
                        var UID_REGEX = new RegExp(regexString, 'g');
                        return path.replace(UID_REGEX, uid);
                    }

                    if (angular.isUndefined(uid) || uid === null) {
                        $log.debug('StorageSrv: empty uid was received');
                    }

                    if(angular.isString(pathStrOrObj)){
                        var processedPath = _replaceVariables(pathStrOrObj);
                        return processedPath;
                    }

                    if(angular.isObject(pathStrOrObj)){
                        var processedPathObj = {};
                        angular.forEach(pathStrOrObj, function(value, pathName){
                            var processedPath = _replaceVariables(pathName);
                            processedPathObj[processedPath] = value;
                        });

                        return processedPathObj;
                    }
                    $log.error('StorageSrv: failed to process path');
                });
            }

            StorageSrv.prototype.get = function (path, defaultValue) {
                var self = this;

                return _processPath(path, self.config).then(function (processedPath) {
                    var entity = self.entityCache.get(processedPath);
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
                        getProm = self.getter(processedPath).then(function (_entity) {
                            if (angular.isUndefined(_entity) || _entity === null) {
                                _entity = {};
                            }

                            if (angular.isObject(_entity)) {
                                var initObj = Object.create({
                                    $save: function () {
                                        return self.set(processedPath, this);
                                    }
                                });
                                _entity = angular.extend(initObj, _entity);
                            }

                            if (_shouldBeCached(processedPath, self.config)) {
                                self.entityCache.put(processedPath, _entity);
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

            StorageSrv.prototype.getServerValue = function(path){
                var self = this;
                return _processPath(path, self.config).then(function (processedPath) {
                    return self.getter(processedPath);
                });
            };

            StorageSrv.prototype.set = function (pathStrOrObj, newValue) {
                var self = this;

                return _processPath(pathStrOrObj, self.config).then(function (processedPathOrObj) {
                    return self.setter(processedPathOrObj, newValue).then(function () {
                        var dataToSaveInCache = {};

                        if (!angular.isObject(processedPathOrObj)) {
                            dataToSaveInCache[processedPathOrObj] = newValue;
                        } else {
                            dataToSaveInCache = processedPathOrObj;
                        }

                        var cachedDataMap = {};
                        angular.forEach(dataToSaveInCache, function (value, path) {
                            var cachedValue;

                            if (angular.isObject(value) && !value.$save) {
                                cachedValue = Object.create({
                                    $save: function () {
                                        return self.set(path, this);
                                    }
                                });
                                angular.forEach(value, function (value, key) {
                                    cachedValue[key] = value;
                                });
                            } else {
                                cachedValue = value;
                            }

                            cachedDataMap[path] = cachedValue;

                            if (_shouldBeCached(path, self.config)) {
                                self.entityCache.put(path, cachedValue);
                            }
                        });

                        return angular.isObject(processedPathOrObj) ? cachedDataMap : cachedDataMap[processedPathOrObj];
                    });
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.prototype.cleanPathCache = function (path) {
                this.entityCache.remove(path);
            };

            StorageSrv.variables = StorageSrv.prototype.variables = {
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
