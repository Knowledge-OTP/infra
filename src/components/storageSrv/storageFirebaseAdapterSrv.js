(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$firebaseAuth', '$log', '$q', '$window',
        function ($firebaseAuth, $log, $q, $window) {
            function removeIlegalProperties(source){
                if(angular.isArray(source)){
                    source.forEach(function(item){
                        removeIlegalProperties(item);
                    });
                    return;
                }

                if(angular.isObject(source)){
                    var keys = Object.keys(source);
                    keys.forEach(function(key){
                        var value = source[key];

                        if(key[0] === '$' || angular.isDefined(value) || (angular.isArray(source) && !source.length)){
                            delete source[key];
                            return;
                        }

                        removeIlegalProperties(value);
                    });
                    return;
                }
            }

            function storageFirebaseAdapter (endPoint){
                var authObj = $firebaseAuth(new Firebase(endPoint)).$getAuth();

                function get(path){
                    var defer = $q.defer();
                    var processedPath = processPath(path,authObj);
                    var ref = new $window.Firebase(endPoint + '/' + processedPath);
                    ref.once('value',function(dataSnapshot){
                        defer.resolve(dataSnapshot.val());
                    },function(){

                    });
                    //ref.flush();
                    return defer.promise;
                    //return $firebaseObject().$loaded().then(function(res){
                    //    return res;
                    //},function(err){
                    //    $log.debug(err.message);
                    //    return $q.reject(err);
                    //});
                }

                function set(path, newEntity){
                    if (newEntity.$save) {
                        return newEntity.$save();
                    }

                    return get(path).then(function (sourceEntity) {
                        if (!angular.isObject(newEntity)) {
                            var fallbackObj = {};
                            fallbackObj[newEntity] = newEntity;
                            newEntity = fallbackObj;
                        }
                        angular.extend(sourceEntity, newEntity);
                        return sourceEntity.$save();
                    });
                }

                return {
                    get: get,
                    set: set
                };
            }

            storageFirebaseAdapter.variables = {
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            var regexString = storageFirebaseAdapter.variables.uid.replace(/\$/g,'\\$');
            var UID_REGEX = new RegExp(regexString,'g');
            function processPath(path,authObj) {
                var processedPath = path.replace(UID_REGEX, authObj.uid);
                return processedPath;
            }
            storageFirebaseAdapter.processPath = function (path,authObj) {
                var processedPath = path.replace(UID_REGEX, authObj.uid);
                return processedPath;
            };

            return storageFirebaseAdapter;
        }
    ]);
})(angular);
