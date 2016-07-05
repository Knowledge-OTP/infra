(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function(isDisbaled){
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = function(){
                // 'ngInject';

                var UserSessionSrv = {};

                UserSessionSrv.isLastSessionRecordDisabled = function(){
                    return isLastSessionRecordDisabled;
                };

                return UserSessionSrv;
            };
        }
    );
})(angular);
