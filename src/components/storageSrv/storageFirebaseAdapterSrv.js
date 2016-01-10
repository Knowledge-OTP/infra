(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageFirebaseAdapterSrv', [
        '$firebaseAuth', '$firebaseObject',
        function ($firebaseAuth, $firebaseObject) {
            function StorageFirebaseAdapterSrv (endPoint){
                this.endPoint = endPoint;
                this.authObj = $firebaseAuth(new Firebase(endPoint)).$getAuth();
            }

            StorageFirebaseAdapterSrv.variables = {
                uid: '$$uid'
            };

            var regexString = StorageFirebaseAdapterSrv.variables.uid.replace(/\$/g,'\\$');
            var UID_REGEX = new RegExp(regexString,'g');
            function processPath(path,authObj) {
                var processedPath = path.replace(UID_REGEX, authObj.uid);
                return processedPath;
            }

            StorageFirebaseAdapterSrv.prototype.get = function(path){
                var processedPath = processPath(path,this.authObj);
                return $firebaseObject(new Firebase(this.endPoint + '/' + processedPath)).$loaded();
            };

            StorageFirebaseAdapterSrv.prototype.set = function(path, newEntity){
                if (newEntity.$save) {
                    return newEntity.$save();
                }

                return this.get(path).then(function (sourceEntity) {
                    if (!angular.isObject(newEntity)) {
                        var fallbackObj = {};
                        fallbackObj[newEntity] = newEntity;
                        newEntity = fallbackObj;
                    }
                    angular.extend(sourceEntity, newEntity);
                    return sourceEntity.$save();
                });
            };

            return StorageFirebaseAdapterSrv;
        }
    ]);
})(angular);
