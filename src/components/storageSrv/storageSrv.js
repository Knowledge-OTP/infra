(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q',
        function ($cacheFactory, $q) {
            var getEntityPromMap = {};

            var cacheId = 0;

            function StorageSrv(entityGetter, entitySetter) {
                this.getter = function(path){
                    return $q.when(entityGetter(path));
                };

                this.setter = function(path, newVal){
                    return $q.when(entitySetter(path,newVal));
                };

                this.entityCache = $cacheFactory('entityCache' + cacheId);
                cacheId ++;
            }

            StorageSrv.prototype.get = function(path, defaultValue){
                var self = this;
                var entity = this.entityCache.get(path);
                var getProm;
                defaultValue = defaultValue || {};
                var cacheProm = false;

                if (entity) {
                    getProm = $q.when(entity);
                } else {
                    if (getEntityPromMap[path]) {
                        return getEntityPromMap[path];
                    }
                    cacheProm = true;
                    getProm = this.getter(path).then(function (_entity) {
                        if(angular.isUndefined(_entity) || _entity === null ){
                            _entity = {};
                        }

                        if(angular.isObject(_entity)){
                            var initObj = Object.create({
                                $save: function(){
                                    return self.set(path,this);
                                }
                            });
                            _entity  = angular.extend(initObj, _entity); 
                        }

                        self.entityCache.put(path, _entity);
                        delete getEntityPromMap[path];
                        return _entity;
                    });
                }
                getProm = getProm.then(function(_entity){
                    var keys = Object.keys(defaultValue);
                    keys.forEach(function(key){
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
            };

            StorageSrv.prototype.set = function(pathStrOrObj, newValue){
                var self = this;
                return this.setter(pathStrOrObj, newValue).then(function(){
                    var dataToSaveInCache = {};

                    if(!angular.isObject(pathStrOrObj)){
                        dataToSaveInCache[pathStrOrObj] = newValue;
                    }else{
                        dataToSaveInCache = pathStrOrObj;
                    }

                    var cachedDataMap = {};
                    angular.forEach(dataToSaveInCache, function(value,path){
                        var cachedValue;

                        if(angular.isObject(value) && !value.$save){
                            cachedValue = Object.create({
                                $save: function(){
                                    return self.set(path,this);
                                }
                            });
                            angular.forEach(value, function(value, key){
                                cachedValue[key] = value;
                            });
                        }else{
                            cachedValue = value;
                        }
                        cachedDataMap[path] = cachedValue;
                        self.entityCache.put(path,cachedValue);
                    });

                    return angular.isObject(pathStrOrObj) ? cachedDataMap : cachedDataMap[pathStrOrObj];
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.prototype.cleanPathCache = function(path){
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
