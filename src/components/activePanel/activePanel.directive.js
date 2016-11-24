'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel')
        .directive('activePanel', function ($q, $interval, $filter, $log, CallsUiSrv, ScreenSharingSrv,
                                            PresenceService, StudentContextSrv, TeacherContextSrv, ENV, $document,
                                            $translate, SessionSrv, SessionsStatusEnum, toggleAutoCallEnum) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {},
                link: function(scope, element) {
                    var receiverId,
                        isOffline,
                        isTeacher,
                        durationToDisplay,
                        timerInterval,
                        liveSessionStatus = 0,
                        liveSessionDuration = 0,
                        timerSecondInterval = 1000,
                        activePanelVisibleClassName = 'activePanel-visible';

                    var bodyDomElem = angular.element($document).find('body');

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
                        var CalleeName = CallsUiSrv.getCalleeName(uid);
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
                                receiverId: uid
                            };
                        }).catch(function (err) {
                            $log.debug('error caught at listenToStudentOrTeacherContextChange', err);
                        });
                        $log.debug('student or teacher context changed: ', receiverId);
                    };

                    var initialUid = StudentContextSrv.getCurrUid();
                    if (initialUid) {
                        listenToStudentOrTeacherContextChange(null, initialUid);
                    }

                    if (ENV.appContext.toLowerCase() === 'dashboard') {
                        isTeacher = true;
                        StudentContextSrv.registerToStudentContextChange(listenToStudentOrTeacherContextChange);
                    } else if (ENV.appContext.toLowerCase() === 'student') {
                        isTeacher = false;
                        TeacherContextSrv.registerToTeacherContextChange(listenToStudentOrTeacherContextChange);
                    } else {
                        $log.error('appContext is not compatible with this component: ', ENV.appContext);
                    }

                    scope.d = {
                        states: {
                            NONE: 0,
                            LIVE_SESSION: 1
                        },
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
                                break;
                            case scope.d.states.LIVE_SESSION :
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                startTimer();
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
                                liveSessionStatus = 0;
                            }
                            updateStatus();
                        }
                    }

                    SessionSrv.registerToCurrUserLiveSessionStateChanges(listenToLiveSessionStatus);

                }
            };
        });
})(angular);
