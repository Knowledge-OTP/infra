(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/znkSession.template.html',
            controllerAs: 'vm',
            controller: function ($scope, $log, $mdDialog, SessionSrv) {
                'ngInject';
                var vm = this;

                var activeSessionGuid;
                vm.isLiveSessionActive = false;
                vm.endSession = SessionSrv.endSession;

                SessionSrv.getLiveSessionGUID().then(function (currSessionGuid) {
                    activeSessionGuid = currSessionGuid;
                });

                $scope.$watch(function () {
                    return activeSessionGuid;
                }, function (newLiveSessionGUID) {
                    vm.isLiveSessionActive = newLiveSessionGUID ? true : false;
                });

                vm.showSessionModal = function () {
                    $mdDialog.show({
                        controller: 'startSessionCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkSession/modals/templates/startSession.template.html',
                        clickOutsideToClose: true
                    });
                };
            }
        });
})(angular);
