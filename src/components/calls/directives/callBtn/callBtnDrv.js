(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            bindings: {},
            controllerAs: 'vm',
            controller: function (CallBtnEnum) {
                var vm = this;

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
                            _changeBtnState(ngModelCtrl.$modelValue);
                        };
                    }
                };

                vm.clickBtn = function() {

                };
            }
        }
    );
})(angular);

