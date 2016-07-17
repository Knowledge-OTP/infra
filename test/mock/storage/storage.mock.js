(function (angular) {
    'use strict';

    angular.module('storage.mock', ['znk.infra.config', 'znk.infra.storage'])
        .config(function(InfraConfigSrvProvider){
            var globalStorage;
            function globalStorageGetter(StorageSrv, $$testAdapter){
                if(!globalStorage){
                    var config = {
                        variables:{
                            uid: '$$$$uid'
                        },
                        cacheRules: /.*/
                    };
                    globalStorage = new StorageSrv(new $$testAdapter(),config);
                }

                return globalStorage;
            }

            var studentStorage;
            function studentStorageGetter(StorageSrv, $$testAdapter){
                if(!studentStorage){
                    var config = {
                        variables:{
                            uid: '$$$$uid'
                        }
                    };
                    studentStorage = new StorageSrv(new $$testAdapter(),config);
                }

                return studentStorage;
            }

            InfraConfigSrvProvider.setStorages(
                globalStorageGetter,
                studentStorageGetter
            );
        })
        .service('$$testAdapter', function($q, StorageSrv, $parse){
            function $$testAdapter(){
                function keyInDb(path){
                    var pathArr = path.split('/');
                    var firstPart = pathArr.shift();
                    return pathArr.reduce(function(prevVal,currPart){
                        return prevVal + '["' + currPart + '"]';
                    },firstPart);
                }

                function setInDb(key,val){
                    var _dbKey = keyInDb(key);
                    $parse(_dbKey + '=' + JSON.stringify(val))(adapter.__db);
                }

                function updateInDb(key,val){
                    var _dbKey = keyInDb(key);
                    var valueInDb = $parse(_dbKey)(adapter.__db);

                    if(!valueInDb){
                        setInDb(key, val);
                    }else{
                        angular.extend(valueInDb, val);
                    }

                }

                var adapter = {
                    __db: {},
                    get: function (path) {
                        var key = keyInDb(path);
                        return $q.when($parse(key)(this.__db));
                    },
                    set: function (path, newValue) {
                        var self = this;

                        setInDb(path,newValue);

                        return this.get(path).then(function (pathValue) {
                            var valueEventsCbs = self.__getEventTypeCbs(StorageSrv.EVENTS.VALUE, path);
                            valueEventsCbs.forEach(function (cb) {
                                cb(pathValue);
                            });
                        });
                    },
                    update: function (pathOrPathToValMap, newValue) {
                        var pathToValMap = {};
                        if (!angular.isObject(pathOrPathToValMap)) {
                            pathToValMap[pathOrPathToValMap] = newValue;
                        }else{
                            pathToValMap = pathOrPathToValMap;
                        }

                        angular.forEach(pathToValMap, function (value, path) {
                            updateInDb(path,value);
                        });

                        return $q.when(angular.isString(pathOrPathToValMap) ? newValue : pathOrPathToValMap);
                    },
                    onEvent: function (type, path, cb) {
                        if (!this.__registeredEvents[type]) {
                            this.__registeredEvents[type] = {};
                        }

                        if (!this.__registeredEvents[type][path]) {
                            this.__registeredEvents[type][path] = [];
                        }

                        this.__registeredEvents[type][path].push(cb);
                    },
                    __getEventTypeCbs: function (type, path) {
                        if (!this.__registeredEvents || !this.__registeredEvents[type] || !this.__registeredEvents[type][path]) {
                            return [];
                        }

                        return this.__registeredEvents[type][path];
                    },
                    offEvent: function (type, path, cb) {

                    },
                    __registeredEvents: {}
                };

                setInDb(StorageSrv.variables.appUserSpacePath,{});

                return adapter;
            }

            return $$testAdapter;
        });
})(angular);
