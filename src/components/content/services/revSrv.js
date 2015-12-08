'use strict';

(function (angular) {

    angular.module('znk.infra.content').provider('revSrv', revSrv);

    function revSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$injector', function($q, $injector) {

            var contentFunc;

            var contentDataFunc = _getContentData();

            var revSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            function _getContentData() {
                var contentData;
                return function() {
                     return {
                         get: function() {
                             if(!contentData) {
                                 return _getContentFunc().then(function(dataObj) {
                                     contentData = dataObj;
                                     return dataObj;
                                 });
                             }
                             return $q.when(contentData);
                         },
                         set: function(practiceName, newData) {
                             contentData.revisionManifest[practiceName] = newData;
                             return $q.when({ rev: newData.rev, status: 'update'});
                         }
                     }
                }
            }

            revSrv.getRev = function(practiceName) {
                return contentDataFunc().get().then(function(dataObj) {

                    if(!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                        return { error: 'No Data Found! ', data: dataObj };
                    }

                    var userManifest = dataObj.revisionManifest[practiceName];
                    var publicationManifest = dataObj.latestRevisions[practiceName];
                    var newRev;

                    if(angular.isUndefined(publicationManifest)) {
                        return { error: 'Not Found', data: dataObj };
                    }

                    if(!userManifest) {
                        newRev = { rev:  publicationManifest.rev, status: 'new' };
                    } else if(userManifest.rev < publicationManifest.rev) {
                        newRev = { rev:  userManifest.rev, status: 'old' };
                    } else if(userManifest.rev === publicationManifest.rev) {
                        newRev = { rev:  publicationManifest.rev, status: 'same' };
                    } else {
                        newRev = { error: 'failed to get revision!', data: dataObj };
                    }


                    return newRev;

                });
            };

            revSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            return revSrv;
        }];


    }

})(angular);
