(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/sessionBtn.template.html',
            controllerAs: 'vm',
            controller: function ($log, $scope, $mdDialog, SessionSrv, StudentContextSrv,
                                  PresenceService, ENV) {
                'ngInject';

                var vm = this;
                var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';

                function trackStudentPresenceCB(userId, newStatus) {
                    vm.isOffline = newStatus === PresenceService.userStatus.OFFLINE;
                }

                this.$onInit = function() {
                    vm.sessionData = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    vm.isOffline = true;

                    if (isTeacher){
                        var studentUid = StudentContextSrv.getCurrUid();
                        PresenceService.startTrackUserPresence(studentUid, trackStudentPresenceCB.bind(null, studentUid));
                    }

                    SessionSrv.loadLiveSessionData().then(function (currSessionData) {
                        vm.sessionData = currSessionData;
                    });

                    $scope.$watch('vm.sessionData', function (newSessionData) {
                        vm.isLiveSessionActive = newSessionData.status;
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
