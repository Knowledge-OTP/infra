(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: function (CallsSrv, $log) {
                var vm = this;
                var receiverId;

                var isPendingClick = false;

                var BTN_STATUSES = {
                    OFFLINE: 1,
                    CALL: 2,
                    CALLED: 3
                };

                vm.callBtnEnum = BTN_STATUSES;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                }

                function _isStateNotOffline() {
                    return vm.callBtnState !== BTN_STATUSES.OFFLINE;
                }

                function _isNoPendingClick() {
                    return !isPendingClick;
                }

                function _clickStatusSetter(clickStatus) {
                    isPendingClick = clickStatus;
                }

                // default btn state offline
                _changeBtnState(BTN_STATUSES.OFFLINE);

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (angular.isDefined(modelValue.isIdleOrOffline) && modelValue.receiverId) {
                                var curBtnStatus = modelValue.isIdleOrOffline ? BTN_STATUSES.OFFLINE : BTN_STATUSES.CALL;
                                receiverId = modelValue.receiverId;
                                _changeBtnState(curBtnStatus);
                            }
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
                            _clickStatusSetter(false);
                            $log.error('callBtn: error in callsStateChanged, err: ' + err);
                        });
                    }
                };
            }
        }
    );
})(angular);

