'use strict';

(function (angular) {

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

    function ContentSrv() {

        var setContentFuncRef;
        var setRevisionGetterRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.setRevisionGetter = function(func) {
            setRevisionGetterRef = func;
        };

        this.$get = ['$q', '$injector', function($q, $injector) {

            var contentFunc;
            var revisionGetterFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }


            function _getRevisionGetterFunc(){
                if (!revisionGetterFunc){
                    revisionGetterFunc = $injector.invoke(setRevisionGetterRef);
                }
                return revisionGetterFunc;
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

            ContentSrv.getRev = function(practiceName) {
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

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            ContentSrv.getContent = function(path) {

                if(!path) {
                    return $q.when({ error: 'Error: getContent require path!' });
                }

                var getterHandler = _getRevisionGetterFunc();

                return revSrv.getRev(path).then(function(result) {

                    if(result.status === 'new') {
                        revSrv.setRev(path, result.rev);
                    }

                    if(!getterHandler.root) {
                        getterHandler.root = '';
                    }

                    var content =  getterHandler.service[getterHandler.method](getterHandler.root+path+'-rev-'+result.rev);

                    return content[getterHandler.getter]();

                });
            };

            return ContentSrv;
        }];


    }

})(angular);
