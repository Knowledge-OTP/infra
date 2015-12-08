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

            var revSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            revSrv.getRev = function(practiceName) {
                return _getContentFunc().then(function(data) {
                    var userManifest = data.contentSync.revisionManifest[practiceName];
                    var publicationManifest = data.publication.latestRevisions[practiceName];
                    var newRev;
                    if(angular.isUndefined(publicationManifest)) {
                        return { error: 'Not Found' };
                    }

                    if(!userManifest) {
                        newRev = { rev:  publicationManifest.rev, status: 'new' };
                    } else if(userManifest.rev < publicationManifest.rev) {
                        newRev = { rev:  userManifest.rev, status: 'old' };
                    } else if(userManifest.rev === publicationManifest.rev) {
                        newRev = { rev:  publicationManifest.rev, status: 'same' };
                    } else {
                        newRev = { error: 'failed to get revision!' };
                    }

                    return newRev;

                });
            };

            return revSrv;
        }];


    }

})(angular);
