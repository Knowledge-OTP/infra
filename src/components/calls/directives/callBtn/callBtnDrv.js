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
            controller: function (CallBtnEnum, CallsSrv) {
                var vm = this;
                var receiverId;

                vm.callBtnEnum = CallBtnEnum;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
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
                    CallsSrv.callsStateChanged(receiverId);
                };
            }
        }
    );
})(angular);

