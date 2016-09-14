(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        function ($scope, CallsSrv, CallsUiSrv, CallsStatusEnum, $log, CallsErrorSrv, $timeout, $window, ENV) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            var mySound;

            var soundSrc = ENV.mediaEndpoint + '/general/incomingCall.mp3';

            CallsUiSrv.getCalleeName(callsData.callerId).then(function(res){
                $scope.callerName = res;
            });

            var otherUserDecline = false;

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                    switch(newVal.status) {
                        case CallsStatusEnum.DECLINE_CALL.enum:
                            otherUserDecline = true;
                            break;
                    }
                    callsData = newVal;
                }
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

            function playAudio() {
                if ($window.Audio) {
                    try {
                        mySound = new $window.Audio(soundSrc);
                        mySound.addEventListener('ended', function() {
                            this.currentTime = 0;
                            this.play();
                        }, false);
                        mySound.play();
                    } catch(e) {
                        $log.error('IncomingCallModalCtrl: playAudio failed!' +' err: ' + e);
                    }
                } else {
                    $log.error('IncomingCallModalCtrl: audio is not supported!');
                }
            }

            function stopAudio() {
                if ($window.Audio && angular.isDefined(mySound)) {
                    mySound.pause();
                    mySound.currentTime = 0;
                    mySound = new $window.Audio('');
                }
            }

            playAudio();

            function _baseCall(callFn, methodName) {
                 callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _updateBtnStatus(true, methodName);
                    callFn(callsData).then(function () {
                        stopAudio();
                        _updateBtnStatus(false, methodName);
                        CallsUiSrv.closeModal();
                        if (methodName === 'acceptCall' && otherUserDecline) {
                            CallsSrv.declineCall(callsData);
                            otherUserDecline = false;
                        }
                    }).catch(function (err) {
                        _updateBtnStatus(false, methodName);
                        $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                        stopAudio();
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
