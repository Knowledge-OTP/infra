(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        'EntityCommunicatorSrv',
        function (EntityCommunicatorSrv) {
            //function processPath(path) {
            //    var processedPath = path.replace(/\$\$uid/, authObj.uid);
            //    return processedPath;
            //}
            //
            //function entityGetter(path) {
            //    var processedPath = processPath(path);
            //    return $firebaseObject(new Firebase(ENV.fbDataEndPoint + processedPath)).$loaded();
            //}
            //
            //function entitySetter(path, newEntity) {
            //    if (newEntity.$save) {
            //        return newEntity.$save();
            //    }
            //    return entityGetter(path).then(function (sourceEntity) {
            //        if (!angular.isObject(newEntity)) {
            //            var fallbackObj = {};
            //            fallbackObj[newEntity] = newEntity;
            //            newEntity = fallbackObj;
            //        }
            //        angular.extend(sourceEntity, newEntity);
            //        return sourceEntity.$save();
            //    });
            //}

            function StorageSrv(entityGetter, entitySetter) {
                //var authObj = $firebaseAuth(new Firebase(ENV.fbDataEndPoint)).$getAuth();

                //var applicationPath = ENV.firebaseAppScopeName;

                this.EntityCommunicator = function (path, defaultValues) {
                    return new EntityCommunicatorSrv(path, defaultValues, entityGetter, entitySetter);
                };

                //this.createGuid = function () {
                //    function s4() {
                //        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                //    }
                //
                //    return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
                //};
                //
                //this.variables = {
                //    uid: '$$uid',
                //    appPath: applicationPath,
                //    appUserSpacePath: applicationPath + '/users/' + authObj.uid
                //};

            }

            return StorageSrv;
        }
    ]);
})(angular);
