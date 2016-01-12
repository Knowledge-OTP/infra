(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q',
        function ($cacheFactory, $q) {
            var getEntityPromMap = {};

            var entityCache = $cacheFactory('entityCache');

            function EntityCommunicator(path, defaultValue, getter, setter) {
                this.path = path;
                this.defaultValue = defaultValue;
                this.getter = getter;
                this.setter = setter;
            }

            EntityCommunicator.prototype.get = function () {
                var path = this.path;
                var entity = entityCache.get(path);
                var getProm;
                var defaultValue = this.defaultValue || {};
                var cacheProm = false;

                if (entity) {
                    getProm = $q.when(entity);
                } else {
                    if (getEntityPromMap[path]) {
                        return getEntityPromMap[path];
                    }
                    cacheProm = true;
                    getProm = this.getter(path).then(function (_entity) {
                        _entity = angular.isUndefined(_entity) ? {} : _entity;
                        entityCache.put(path, _entity);
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

            EntityCommunicator.prototype.set = function (entity) {
                var key = this.path;
                if (angular.isUndefined(entity)) {
                    entity = entityCache.get(key);
                } else {
                    entityCache.put(key, entity);
                }
                return this.setter(this.path, entity);
            };

            function StorageSrv(entityGetter, entitySetter) {
                this.EntityCommunicator = function (path, defaultValues) {
                    return new EntityCommunicator(path, defaultValues, entityGetter, entitySetter);
                };
            }

            return StorageSrv;
        }
    ]);
})(angular);
