(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: function ($translate, CallsSrv, CallsBtnSrv, CallsErrorSrv, CallsBtnStatusEnum, $log, $scope, CALL_UPDATE,
                                  toggleAutoCallEnum, ENV) {
                var vm = this;
                var receiverId;
                var isPendingClick = false;
                var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';
                var isOffline;

                vm.callBtnEnum = CallsBtnStatusEnum;

                var translateNamespace = 'AUDIO_CALLS';

                var loadTranslations = $translate([
                    translateNamespace + '.' + 'CALL_STUDENT',
                    translateNamespace + '.' + 'CALL_TEACHER',
                    translateNamespace + '.' + 'END_CALL',
                    translateNamespace + '.' + 'OFFLINE'
                ]);

                function _changeTooltipTranslation(state) {
                    return loadTranslations.then(function (translation) {
                        var translatedStrings = {
                            CALL_STUDENT: translation[translateNamespace + '.' + 'CALL_STUDENT'],
                            CALL_TEACHER: translation[translateNamespace + '.' + 'CALL_TEACHER'],
                            END_CALL: translation[translateNamespace + '.' + 'END_CALL'],
                            OFFLINE: translation[translateNamespace + '.' + 'OFFLINE']
                        };
                        switch(state) {
                            case CallsBtnStatusEnum.OFFLINE_BTN.enum:
                                return translatedStrings.OFFLINE;
                            case CallsBtnStatusEnum.CALL_BTN.enum:
                                return isTeacher? translatedStrings.CALL_STUDENT : translatedStrings.CALL_TEACHER;
                            case CallsBtnStatusEnum.CALLED_BTN.enum:
                                return translatedStrings.END_CALL;
                        }
                    }).catch(function (err) {
                        $log.debug('Could not fetch translation', err);
                    });
                }

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                    _changeTooltipTranslation(state).then(function (tooltipText) {
                        vm.tooltipTranslate = tooltipText;
                    });

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
                                    _initializeBtnStatus(receiverId);
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

