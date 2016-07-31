(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        function (CallsSrv, CallsUiSrv, CallsStatusEnum, $log, $scope) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                     callsData = newVal;
                }
            });

            function _baseCall(callFn, methodName, params) {
                callFn(callsData, params).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                });
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall', false);

            this.acceptCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');

            this.closeModal = CallsUiSrv.closeModal;
        }
    );
})(angular);
