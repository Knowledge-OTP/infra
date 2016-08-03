(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl',
        function (CallsSrv, CallsUiSrv, $log, CallsStatusEnum, $scope, $timeout, CallsErrorSrv) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            var isPendingClick = false;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            CallsUiSrv.getCalleeName().then(function(res){
                $scope.calleeName = res;
            });

            $scope.declineByOther = true;

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
                callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _clickStatusSetter(true);
                    callFn(callsData, params).then(function () {
                        _clickStatusSetter(false);
                        CallsUiSrv.closeModal();
                    }).catch(function (err) {
                        _clickStatusSetter(false);
                        $log.error('OutgoingCallModalCtrl '+ methodName +': err: ' + err);
                        CallsErrorSrv.showErrorModal(err);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall', true);

            this.closeModalAndDisconnect = _baseCall.bind(null, CallsSrv.disconnectCall, 'disconnectCall');
        }
    );
})(angular);
