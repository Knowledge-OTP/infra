(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/znkSession.template.html',
            controllerAs: 'vm',
            controller: function ($scope, $mdDialog, SessionSrv) {
                'ngInject';

                var vm = this;

                this.$onInit = function() {
                    vm.activeSessionGuid = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;

                    SessionSrv.getLiveSessionGUID().then(function (currSessionGuid) {
                        vm.activeSessionGuid = currSessionGuid;
                    });

                    $scope.$watch('vm.activeSessionGuid', function (newLiveSessionGUID) {
                        vm.isLiveSessionActive = newLiveSessionGUID.guid ? true : false;
                    }, true);

                    vm.showSessionModal = function () {
                        $mdDialog.show({
                            controller: 'startSessionCtrl',
                            controllerAs: 'vm',
                            templateUrl: 'components/znkSession/modals/templates/startSession.template.html',
                            clickOutsideToClose: true
                        });
                    };
                };
            }
        });
})(angular);
