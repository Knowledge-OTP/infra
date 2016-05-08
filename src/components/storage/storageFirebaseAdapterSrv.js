(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q', 'StorageSrv',
        function ($log, $q, StorageSrv) {
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
                            if(value !== '$save'){
                                $log.error('storageFirebaseAdapter: illegal property was deleted before save',key);
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
                var rootRef = new Firebase(endPoint);
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
                        $log.error('storageFirebaseAdapter: failed to retrieve data for the following path',relativePath,err);
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
                                $log.error('storageFirebaseAdapter: failed to set data for the following path',relativePathOrObject,err);
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
