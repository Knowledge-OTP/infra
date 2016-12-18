(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession')
        .component('liveSessionBtn', {
            bindings: {
                student: '='
            },
            templateUrl: 'components/liveSession/components/liveSessionBtn/liveSessionBtn.template.html',
            controllerAs: 'vm',
            controller: function ($log, $scope, $mdDialog, LiveSessionSrv, StudentContextSrv,
                                  PresenceService, ENV, LiveSessionStatusEnum) {
                'ngInject';

                var vm = this;
                var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';

                function trackStudentPresenceCB(userId, newStatus) {
                    vm.isOffline = newStatus === PresenceService.userStatus.OFFLINE;
                }

                this.$onInit = function() {
                    vm.isLiveSessionActive = false;
                    vm.endSession = LiveSessionSrv.endLiveSession;
                    vm.isOffline = true;

                    if (isTeacher){
                        var studentUid = StudentContextSrv.getCurrUid();
                        vm.student = vm.student ? vm.student : { uid: studentUid };
                        PresenceService.startTrackUserPresence(studentUid, trackStudentPresenceCB.bind(null, vm.student.uid));
                    }

                    LiveSessionSrv.registerToActiveLiveSessionDataChanges(liveSessionStateChanged);

                    function liveSessionStateChanged(newLiveSessionData) {
                        vm.isLiveSessionActive = newLiveSessionData &&
                            (newLiveSessionData.status === LiveSessionStatusEnum.CONFIRMED.enum);
                    }

                    vm.showSessionModal = function () {
                        $mdDialog.show({
                            template: '<live-session-subject-modal student="vm.student"></live-session-subject-modal>',
                            scope: $scope,
                            preserveScope: true,
                            clickOutsideToClose: true
                        });
                    };
                };
            }
        });
})(angular);
