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
                var receiverId;
                var currentUserPresenceStatus;
                var initialUid = StudentContextSrv.getCurrUid();
                function listenToStudentContextChange(prevUid, uid) {
                    receiverId = uid;
                    var currentUserStatus = PresenceService.getCurrentUserStatus(receiverId);
                    currentUserStatus.then(function (res) {
                        currentUserPresenceStatus = res;
                        vm.isOffline = currentUserPresenceStatus === PresenceService.userStatus.OFFLINE;
                    }).catch(function (err) {
                        $log.debug('error caught at listenToStudentContextChange', err);
                    });
                    $log.debug('student context changed: ', receiverId);
                }

                this.$onInit = function() {
                    vm.activeSessionGuid = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    vm.isOffline = true;

                    if (initialUid) {
                        listenToStudentContextChange(null, initialUid);
                    }

                    StudentContextSrv.registerToStudentContextChange(listenToStudentContextChange);

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
