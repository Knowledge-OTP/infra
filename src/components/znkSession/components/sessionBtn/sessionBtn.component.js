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
                    var sessionGUID = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    vm.isOffline = true;

                    if (isTeacher){
                        var studentUid = StudentContextSrv.getCurrUid();
                        PresenceService.startTrackUserPresence(studentUid, trackStudentPresenceCB.bind(null, studentUid));
                    }

                    SessionSrv.getLiveSessionGUID().then(function (currSessionGUID) {
                        sessionGUID = currSessionGUID;
                    });

                    $rootScope.$watch(function () {
                        return sessionGUID;
                    }, function (newSessionGUID) {
                        vm.isLiveSessionActive = newSessionGUID && newSessionGUID.guid ? true : false;
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
