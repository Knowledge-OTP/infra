(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        function ($scope, CallsSrv, CallsUiSrv, CallsStatusEnum, $log, CallsErrorSrv, $timeout) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            CallsUiSrv.getCalleeName(callsData.receiverId, callsData.callerId).then(function(res){
                $scope.callerName = res;
            });

            var isPendingClick = false;

            $scope.declineByOther = true;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            function _fillLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    if (bool === true) {
                        $timeout(function() {
                            self.fillLoader = bool;
                        }, 2500);
                    } else {
                        self.fillLoader = bool;
                    }
                }
            }

            function _startLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    self.startLoader = bool;
                }
            }

            function _updateBtnStatus(bool, methodName) {
                _clickStatusSetter(bool);
                _startLoader(bool, methodName);
                _fillLoader(bool, methodName);
            }

            function _baseCall(callFn, methodName) {
                 callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _updateBtnStatus(true, methodName);
                    callFn(callsData).then(function () {
                        _updateBtnStatus(false, methodName);
                        CallsUiSrv.closeModal();
                    }).catch(function (err) {
                        _updateBtnStatus(false, methodName);
                        $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                        CallsErrorSrv.showErrorModal(err);
                        CallsSrv.declineCall(callsData);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.acceptCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');

            this.closeModal = CallsUiSrv.closeModal;
        }
    );
})(angular);
