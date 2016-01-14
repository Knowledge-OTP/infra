(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q',
        function ($log, $q) {
            function removeIllegalProperties(source){
                if(angular.isArray(source)){
                    source.forEach(function(item){
                        removeIllegalProperties(item);
                    });
                    return;
                }

                if(angular.isObject(source)){
                    var keys = Object.keys(source);
                    keys.forEach(function(key){
                        var value = source[key];

                        if(key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length)){
                            $log.debug('storageFirebaseAdapter: illegal property was deleted before save',key);
                            delete source[key];
                            return;
                        }

                        removeIllegalProperties(value);
                    });
                    return;
                }
            }

            function storageFirebaseAdapter (endPoint){
                var refMap = {};
                var authObj;
                var rootRef = new Firebase(endPoint);
                refMap.rootRef = rootRef;
                rootRef.onAuth(function(newAuthObj){
                    authObj = newAuthObj;
                });

                function getRef(relativePath){
                    var processedRelativePath = processPath(relativePath,authObj);
                    if(!refMap[processedRelativePath]){
                        refMap[processedRelativePath] = refMap.rootRef.child(processedRelativePath);
                    }
                    return refMap[processedRelativePath];
                }

                function get(relativePath){
                    var defer = $q.defer();

                    var ref = getRef(relativePath);
                    ref.once('value',function(dataSnapshot){
                        defer.resolve(dataSnapshot.val());
                    },function(err){
                        $log.debug('storageFirebaseAdapter: failed to retrieve data for the following path',relativePath,err);
                        defer.reject(err);
                    });
                    return defer.promise;
                }

                function set(relativePath, newValue){
                    var defer = $q.defer();
                    var newValueCopy = angular.copy(newValue);
                    removeIllegalProperties(newValueCopy);
                    var ref = getRef(relativePath);
                    ref.set(newValueCopy,function(err){
                        if(err){
                            $log.debug('storageFirebaseAdapter: failed to set data for the following path',relativePath,err);
                            defer.reject(err);
                        }else{
                            defer.resolve(newValueCopy);
                        }
                    });

                    return defer.promise;
                }

                return {
                    get: get,
                    set: set,
                    __refMap: refMap//for testing
                };
            }

            var pathVariables= {
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            var regexString = pathVariables.uid.replace(/\$/g,'\\$');
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
