(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/sessionBtn.template.html',
            controllerAs: 'vm',
            controller: function ($log, $scope, $mdDialog, SessionSrv, StudentContextSrv,
                                  PresenceService) {
                'ngInject';

                var vm = this;
                var studentUid = StudentContextSrv.getCurrUid();

                function trackStudentPresenceCB(userId, newStatus) {
                    vm.isOffline = newStatus === PresenceService.userStatus.OFFLINE;
                }

                this.$onInit = function() {
                    vm.activeSessionGuid = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    vm.isOffline = true;

                    PresenceService.startTrackUserPresence(studentUid, trackStudentPresenceCB.bind(null, studentUid));

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
                };
            }
        });
})(angular);
