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

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            this.getRev = function(practiceName) {
                //var userManifest = contentObj.userContentSync.revisionManifest[practiceName];
                //var publicationManifest = contentObj.latestPublication.latestRevisions[practiceName];
                //var newRev = (userManifest.rev < publicationManifest.rev) ? userManifest.rev : publicationManifest.rev;
                //
                //return $q.when(newRev);
            };

        }];


    }

})(angular);
