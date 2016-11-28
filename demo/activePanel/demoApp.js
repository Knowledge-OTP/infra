(function (angular) {
    'use strict';

    var isTeacher = localStorage.getItem('isTeacher');
    var receiverId = 'c47f4f57-521c-4832-b505-c0093737ceff';

    angular.module('demo', [
        'demoEnv',
        'znk.infra.activePanel',
        'znk.infra.calls'
    ])
    .config(function (PresenceServiceProvider, znkAnalyticsSrvProvider, CallsUiSrvProvider) {

        PresenceServiceProvider.setAuthServiceName('AuthService');

        znkAnalyticsSrvProvider.setEventsHandler(function () {
            return {
                eventTrack: angular.noop,
                timeTrack: angular.noop,
                pageTrack: angular.noop,
                setUsername: angular.noop,
                setUserProperties: angular.noop
            };
        });

        var newFunc = function ($q) {
            'ngInject';
            return function () {
                return $q.when('ofir');

            }
        };
        CallsUiSrvProvider.setCalleeNameFnGetter(newFunc);
    })
    .decorator('StudentContextSrv', function ($delegate) {
        'ngInject';

        $delegate.getCurrUid = function () {
            return 'c47f4f57-521c-4832-b505-c0093737ceff';
        };
        return $delegate;
    })
    .run(function ($rootScope, ActivePanelSrv, PresenceService) {
        'ngInject';
        ActivePanelSrv.loadActivePanel();

        $rootScope.d = {
            states: {
                NONE: 0,
                LIVE_SESSION: 1
            },
            shareScreenBtnsEnable: true,
            isTeacher: isTeacher,
            presenceStatusMap: PresenceService.userStatus,
            viewOtherUserScreen: function () {
                var userData = {
                    isTeacher: !$scope.d.isTeacher,
                    uid: receiverId
                };
                $log.debug('viewOtherUserScreen: ', userData);
                ScreenSharingSrv.viewOtherUserScreen(userData);
            },
            shareMyScreen: function () {
                var userData = {
                    isTeacher: !$scope.d.isTeacher,
                    uid: receiverId
                };
                $log.debug('shareMyScreen: ', userData);
                ScreenSharingSrv.shareMyScreen(userData);
            }
        };
    })
        .controller('demoCtrl', function ($rootScope, $window) {
            var vm = this;

            vm.showActivePanel = function () {
                var activePanelElm = $window.document.querySelector('.active-panel');
                activePanelElm.classList.remove('ng-hide');
                $rootScope.d.currStatus = 1;
                $rootScope.d.calleeName = 'Student';
                $rootScope.d.callBtnModel = {
                    isOffline: false,
                    receiverId: receiverId
                };
            }
        });
})(angular);
