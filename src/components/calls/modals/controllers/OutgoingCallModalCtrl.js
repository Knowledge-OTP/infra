(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl',
        function (CallsSrv, CallsUiSrv, $log, CallsStatusEnum, $scope, $timeout) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            $scope.calleeName = CallsUiSrv.getCalleeName();

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                     switch(newVal.status) {
                         case CallsStatusEnum.ACTIVE_CALL.enum:
                             $timeout(function() {
                                 CallsUiSrv.closeModal();
                             }, 2000);
                             break;
                     }
                    callsData = newVal;
                }
            });

            function _baseCall(callFn, methodName, params) {
                callFn(callsData, params).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('OutgoingCallModalCtrl '+ methodName +': err: ' + err);
                });
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall', true);

            this.closeModalAndDisconnect = _baseCall.bind(null, CallsSrv.disconnectCall, 'disconnectCall');
        }
    );
})(angular);
