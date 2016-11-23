(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            require: {
                parent: '?^ngModel'
            },
            templateUrl: 'components/znkSession/components/sessionBtn/sessionBtn.template.html',
            controllerAs: 'vm',
            controller: function ($scope, $mdDialog, SessionSrv, SessionBtnStatusEnum) {
                'ngInject';

                var vm = this;
                var receiverId;
                vm.sessionBtnEnum = SessionBtnStatusEnum;

                function _changeBtnState(state) {
                    vm.sessionBtnState = state;
                }

                this.$onInit = function() {
                    vm.activeSessionGuid = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    var ngModelCtrl = vm.parent;

                    SessionSrv.getLiveSessionGUID().then(function (currSessionGuid) {
                        vm.activeSessionGuid = currSessionGuid;
                    });

                    $scope.$watch('vm.activeSessionGuid', function (newLiveSessionGUID) {
                        vm.isLiveSessionActive = newLiveSessionGUID.guid ? true : false;
                    }, true);

                    vm.showSessionModal = function () {
                        $mdDialog.show({
                            template: '<start-session-modal></start-session-modal>',
                            scope: $scope,
                            preserveScope: true,
                            clickOutsideToClose: true
                        });
                    };

                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (modelValue && angular.isDefined(modelValue.isOffline) && modelValue.receiverId) {
                                var curBtnStatus = modelValue.isOffline ? SessionBtnStatusEnum.OFFLINE_BTN.enum : SessionBtnStatusEnum.START_BTN.enum;
                                receiverId = modelValue.receiverId;
                                _changeBtnState(curBtnStatus);
                            }
                        };
                    }

                };
            }
        });
})(angular);
