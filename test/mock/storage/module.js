(function (angular) {
    'use strict';

    var mockStorageServiceName = 'testStorage';

    angular.module('storage.mock', ['znk.infra.config'])
        .config(function(InfraConfigSrvProvider){
            InfraConfigSrvProvider.setStorageServiceName(mockStorageServiceName );
        })
        .service(mockStorageServiceName, function(StorageSrv, $parse){
            var db = {

            };

            function keyInDb(path){
                var pathArr = path.split('/');
                var firstPart = pathArr.shift();
                return pathArr.reduce(function(prevVal,currPart){
                    return prevVal + '["' + currPart + '"]';
                },firstPart);
            }
            function getter(path){
                var key = keyInDb(path);
                return $parse(key)(db);
            }

            function setInDb(key,val){
                var _dbKey = keyInDb(key);
                $parse(_dbKey + '=' + JSON.stringify(val))(db);
            }
            function setter(pathOrObject, newVal){
                var ret;
                if(angular.isObject(pathOrObject)){
                    ret = {};
                    angular.forEach(pathOrObject, function(val,key){
                        setInDb(key,val);
                        ret[key] = angular.copy(val);
                    });
                }else{
                    setInDb(pathOrObject,newVal);
                    ret = newVal;
                }
                return ret;
            }

            var storage = new StorageSrv(getter,setter);
            storage.db = db;
            storage.variables = StorageSrv.variables;

            return storage;
        });
})(angular);
