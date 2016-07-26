(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            bindings: {
                onClickIcon: '&?'
            },
            controllerAs: 'vm',
            controller: function (CallBtnEnum, CallsSrv, $log) {
                var vm = this;
                var receiverId;

                var isPendingClick = false;

                vm.callBtnEnum = CallBtnEnum;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                }

                function _isStateNotOffline() {
                    return vm.callBtnState !== CallBtnEnum.OFFLINE.enum;
                }

                function _isNoPendingClick() {
                    return !isPendingClick;
                }

                function _clickStatusSetter(clickStatus) {
                    isPendingClick = clickStatus;
                }

                // default btn state
                _changeBtnState(CallBtnEnum.CALL.enum);

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            var btnState = modelValue.btnState;
                            receiverId = modelValue.receiverId;
                            _changeBtnState(btnState);
                        };
                    }
                };

                vm.clickBtn = function() {
                    if (_isStateNotOffline() && _isNoPendingClick()) {
                        _clickStatusSetter(true);

                        CallsSrv.callsStateChanged(receiverId).then(function (data) {
                            _clickStatusSetter(false);
                            $log.debug('callBtn: success in callsStateChanged, data: ', data);
                        }).catch(function (err) {
                            $log.error('callBtn: error in callsStateChanged, err: ' + err);
                        });
                    }
                };
            }
        }
    );
})(angular);

