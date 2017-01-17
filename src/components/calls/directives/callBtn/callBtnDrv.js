(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: function (CallsSrv, CallsBtnSrv, CallsErrorSrv, CallsBtnStatusEnum, $log, $scope, CALL_UPDATE,
                                  toggleAutoCallEnum, ENV) {
                var vm = this;
                var receiverId;
                var isPendingClick = false;
                var autoCallStatusEnum = toggleAutoCallEnum;
                var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';
                var isOffline;

                vm.callBtnEnum = CallsBtnStatusEnum;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                }

                function _isNoPendingClick() {
                    return !isPendingClick;
                }

                function _clickStatusSetter(clickStatus) {
                    isPendingClick = clickStatus;
                }

                function _initializeBtnStatus(receiverId) {
                    return CallsBtnSrv.initializeBtnStatus(receiverId).then(function (status) {
                        if (isOffline) {
                            _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);
                        } else if (status) {
                            _changeBtnState(status);
                        }

                        return status;
                    });
                }

                $scope.$on(CALL_UPDATE, function (e, callsData) {
                    if (callsData.status) {
                        CallsBtnSrv.updateBtnStatus(receiverId, callsData).then(function (status) {
                            if (isOffline) {
                                _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);
                            } else if (status) {
                                _changeBtnState(status);
                            }
                        });
                    }
                });

                // default btn state offline
                _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (modelValue && angular.isDefined(modelValue.isOffline) && modelValue.receiverId) {
                                isOffline = modelValue.isOffline;
                                var curBtnStatus = isOffline ? CallsBtnStatusEnum.OFFLINE_BTN.enum : CallsBtnStatusEnum.CALL_BTN.enum;
                                receiverId = modelValue.receiverId;
                                hangCall(modelValue.isOffline);
                                _changeBtnState(curBtnStatus);
                                if (curBtnStatus !== CallsBtnStatusEnum.OFFLINE_BTN.enum) {
                                    _initializeBtnStatus(receiverId).then(function(status) {
                                        if (angular.isDefined(modelValue.toggleAutoCall) && isTeacher) {
                                            var isInActiveCall = status === CallsBtnStatusEnum.CALLED_BTN.enum;
                                            switch (modelValue.toggleAutoCall) {
                                                case autoCallStatusEnum.ACTIVATE.enum:
                                                    if (!isInActiveCall) {
                                                        vm.clickBtn();
                                                    }
                                                    break;
                                                case autoCallStatusEnum.DISABLE.enum:
                                                    if (isInActiveCall) {
                                                        vm.clickBtn();
                                                    }
                                                    break;
                                            }
                                        }
                                    });
                                }
                            }
                        };
                    }
                };

                function hangCall(isOffline) {
                    if (isOffline && vm.callBtnState === CallsBtnStatusEnum.CALLED_BTN.enum) {
                        CallsSrv.disconnectCall();
                        _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);
                    }
                }

                vm.clickBtn = function() {
                    if (!isOffline && _isNoPendingClick()) {
                        _clickStatusSetter(true);

                        CallsSrv.callsStateChanged(receiverId).then(function (data) {
                            _clickStatusSetter(false);
                            $log.debug('callBtn: success in callsStateChanged, data: ', data);
                        }).catch(function (err) {
                            _clickStatusSetter(false);
                            $log.error('callBtn: error in callsStateChanged, err: ' + err);
                            CallsErrorSrv.showErrorModal(err);
                        });
                    }
                };
            }
        }
    );
})(angular);

