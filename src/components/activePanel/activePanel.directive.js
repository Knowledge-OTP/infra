
(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .directive('activePanel',
            function ($timeout, $window, $q, $interval, $filter, $log, CallsUiSrv, ScreenSharingSrv,
                         PresenceService, StudentContextSrv, TeacherContextSrv, ENV,
                         $translate, SessionSrv, SessionsStatusEnum, toggleAutoCallEnum, LiveSessionStatusEnum,
                         LiveSessionSrv) {
                'ngInject';
                return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {},
                link: function(scope, element) {
                    var receiverId,
                        isOffline,
                        durationToDisplay,
                        timerInterval,
                        liveSessionStatus = 0,
                        liveSessionDuration = 0,
                        timerSecondInterval = 1000,
                        activePanelVisibleClassName = 'activePanel-visible',
                        isStudent = ENV.appContext.toLowerCase() === 'student',
                        isTeacher = ENV.appContext.toLowerCase() === 'dashboard';

                    var bodyDomElem = angular.element($window.document.body);

                    var translateNamespace = 'ACTIVE_PANEL';

                    $translate([
                        translateNamespace + '.' + 'SHOW_STUDENT_SCREEN',
                        translateNamespace + '.' + 'SHOW_TEACHER_SCREEN',
                        translateNamespace + '.' + 'SHARE_MY_SCREEN'
                    ]).then(function (translation) {
                        scope.d.translatedStrings = {
                            SHOW_STUDENT_SCREEN: translation[translateNamespace + '.' + 'SHOW_STUDENT_SCREEN'],
                            SHOW_TEACHER_SCREEN: translation[translateNamespace + '.' + 'SHOW_TEACHER_SCREEN'],
                            SHARE_MY_SCREEN: translation[translateNamespace + '.' + 'SHARE_MY_SCREEN']
                        };
                    }).catch(function (err) {
                        $log.debug('Could not fetch translation', err);
                    });

                    var listenToStudentOrTeacherContextChange = function (prevUid, uid) {
                        receiverId = uid;
                        var currentUserStatus = PresenceService.getCurrentUserStatus(receiverId);
                        var CalleeName = CallsUiSrv.getCalleeName(receiverId);
                        var promsArr = [
                            currentUserStatus,
                            CalleeName
                        ];
                        $q.all(promsArr).then(function (res) {
                            scope.d.currentUserPresenceStatus = res[0];
                            isOffline = scope.d.currentUserPresenceStatus === PresenceService.userStatus.OFFLINE;
                            scope.d.calleeName = (res[1]) ? (res[1]) : '';
                            scope.d.callBtnModel = {
                                isOffline: isOffline,
                                receiverId: uid,
                                toggleAutoCall: toggleAutoCallEnum.DISABLE.enum
                            };
                        }).catch(function (err) {
                            $log.debug('error caught at listenToStudentOrTeacherContextChange', err);
                        });
                        $log.debug('student or teacher context changed: ', receiverId);
                    };

                    if (isTeacher) {
                        StudentContextSrv.registerToStudentContextChange(listenToStudentOrTeacherContextChange);
                    } else if (isStudent) {
                        TeacherContextSrv.registerToTeacherContextChange(listenToStudentOrTeacherContextChange);
                    } else {
                        $log.error('appContext is not compatible with this component: ', ENV.appContext);
                    }

                    scope.d = {
                        states: {
                            NONE: 0,
                            LIVE_SESSION: 1
                        },
                        toggleAutoCall: {},
                        shareScreenBtnsEnable: true,
                        isTeacher: isTeacher,
                        presenceStatusMap: PresenceService.userStatus,
                        viewOtherUserScreen: function () {
                            var userData = {
                                isTeacher: !scope.d.isTeacher,
                                uid: receiverId
                            };
                            $log.debug('viewOtherUserScreen: ', userData);
                            ScreenSharingSrv.viewOtherUserScreen(userData);
                        },
                        shareMyScreen: function () {
                            var userData = {
                                isTeacher: !scope.d.isTeacher,
                                uid: receiverId
                            };
                            $log.debug('shareMyScreen: ', userData);
                            ScreenSharingSrv.shareMyScreen(userData);
                        }
                    };

                    function startTimer() {
                        $log.debug('call timer started');
                        timerInterval = $interval(function () {
                            liveSessionDuration += timerSecondInterval;
                            durationToDisplay = $filter('formatDuration')(liveSessionDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.live-session-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    }

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        liveSessionDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });

                    function endScreenSharing(){
                        // ScreenSharingUiSrv.endScreenSharing();
                        $timeout(function () {
                            $window.document.querySelector('.close-icon-wrapper').click();
                        });
                    }

                    function updateStatus() {
                        scope.d.currStatus = liveSessionStatus;
                        $log.debug('ActivePanel d.currStatus: ', scope.d.currStatus);

                        switch (scope.d.currStatus) {
                            case scope.d.states.NONE :
                                $log.debug('ActivePanel State: NONE');
                                bodyDomElem.removeClass(activePanelVisibleClassName);
                                destroyTimer();
                                scope.d.callBtnModel.toggleAutoCall = toggleAutoCallEnum.DISABLE.enum;
                                scope.d.callBtnModel = angular.copy(scope.d.callBtnModel);
                                endScreenSharing();
                                SessionSrv.clearSessionFrame();
                                break;
                            case scope.d.states.LIVE_SESSION :
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                startTimer();
                                SessionSrv.loadSessionFrame();
                                scope.d.callBtnModel.toggleAutoCall = toggleAutoCallEnum.ACTIVATE.enum;
                                scope.d.callBtnModel = angular.copy(scope.d.callBtnModel);
                                $log.debug('ActivePanel State: LIVE_SESSION');
                                break;
                            default :
                                $log.error('currStatus is in an unknown state', scope.d.currStatus);
                        }
                    }

                    function getRoundTime() {
                        return Math.floor(Date.now() / 1000) * 1000;
                    }

                    // Listen to status changes in Live session
                    function listenToLiveSessionStatus(sessionData) {
                        if (sessionData) {
                            if (sessionData.status === SessionsStatusEnum.ACTIVE.enum) {
                                liveSessionStatus = scope.d.states.LIVE_SESSION;
                                liveSessionDuration = getRoundTime() - sessionData.startTime;
                            } else {
                                liveSessionStatus = scope.d.states.NONE;
                            }
                            updateStatus();
                        }
                    }

                    function listenToLiveSessionStatus2(liveSessionState) {
                        if (liveSessionState) {
                            if (liveSessionState === LiveSessionStatusEnum.CONFIRMED.enum) {
                                liveSessionStatus = scope.d.states.LIVE_SESSION;
                                // liveSessionDuration = getRoundTime() - sessionData.startTime;
                            } else {
                                liveSessionStatus = scope.d.states.NONE;
                            }
                            updateStatus();
                        }
                    }

                    SessionSrv.registerToCurrUserLiveSessionStateChanges(listenToLiveSessionStatus);

                    LiveSessionSrv.registerToCurrUserLiveSessionStateChanges(listenToLiveSessionStatus2);
                }
            };
        });
})(angular);
