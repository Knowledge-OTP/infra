(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($rootScope, $log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, TeacherContextSrv,
                         UtilitySrv, SessionSubjectEnumConst, $mdDialog, SessionsStatusEnum,
                         $window, $timeout, PopUpSrv, $interval, $animate, $compile) {
                    'ngInject';

                    function getRoundTime() {
                        return Math.floor(Date.now() / 1000) * 1000;
                    }
                    function sessionInit(sessionSubject) {
                        return {
                            appName: ENV.studentAppName.split('_')[0],
                            sessionGUID: UtilitySrv.general.createGuid(),
                            educatorUID: isTeacher ? userAuth.uid : TeacherContextSrv.getCurrUid(),
                            studentUID: isTeacher ? StudentContextSrv.getCurrUid() : userAuth.uid,
                            extendTime: 0,
                            startTime: getRoundTime(),
                            endTime: null,
                            duration: null,
                            sessionSubject: sessionSubject.id,
                            status: SessionsStatusEnum.ACTIVE.enum  //(values: 1 = Active, 0 = Ended)
                        };
                    }
                    function getLiveSessionPath(param) {
                        if (!userAuth) {
                            $log.error('Invalid user');
                            return;
                        }
                        var path;
                        var educatorUID = isTeacher ? userAuth.uid : TeacherContextSrv.getCurrUid();
                        var studentUID = isTeacher ? StudentContextSrv.getCurrUid() : userAuth.uid;
                        switch (param) {
                            case 'sessions':
                                path = ENV.studentAppName + '/liveSession/' + currSessionGUID.guid;
                                return path;
                            case 'student':
                                path = ENV.studentAppName + '/users/$$uid/liveSession';
                                return path.replace('$$uid', '' + studentUID);
                            case 'educator':
                                path = ENV.dashboardAppName + '/users/$$uid/liveSession';
                                return path.replace('$$uid', '' + educatorUID);
                            default:
                                return;
                        }
                    }
                    function saveSession() {
                        $log.debug('saveSession, sessionData: ', sessionData);
                        var dataToSave = {};
                        return globalStorageProm.then(function (globalStorage) {
                            var studentPath = getLiveSessionPath('student') + '/active';
                            var educatorPath = getLiveSessionPath('educator') + '/active';
                            var sessionPath = getLiveSessionPath('sessions');
                            dataToSave[sessionPath] = sessionData;
                            dataToSave[studentPath] = dataToSave[educatorPath] ={ guid: sessionData.sessionGUID };
                            return globalStorage.update(dataToSave);
                        });
                    }
                    function updateSession() {
                        $log.debug('updateSession, sessionData: ', sessionData);
                        var dataToSave = {};
                        return globalStorageProm.then(function (globalStorage) {
                            var studentPath = getLiveSessionPath('student');
                            var studentPathActive = studentPath + '/active';
                            var studentPathArchive = studentPath + '/archive/' + sessionData.sessionGUID;
                            var educatorPath = getLiveSessionPath('educator');
                            var educatorPathActive = educatorPath + '/active';
                            var educatorPathArchive = educatorPath + '/archive/' + sessionData.sessionGUID;
                            var sessionPath = getLiveSessionPath('sessions');
                            dataToSave[sessionPath] = sessionData;
                            dataToSave[studentPathArchive] = dataToSave[educatorPathArchive] = false;
                            dataToSave[studentPathActive] = dataToSave[educatorPathActive] = { guid: false };
                            return globalStorage.update(dataToSave);
                        });
                    }
                    function checkSessionDuration() {
                        checkDurationInterval = $interval(function () {
                            liveSessionDuration = (getRoundTime() - sessionData.startTime)  / 60000; // convert to minutes
                            var sessionTimeWithExtension = ENV.liveSession.sessionLength + sessionData.extendTime;
                            var EndAlertTimeWithExtension = ENV.liveSession.sessionEndAlertTime + sessionData.extendTime;

                            if (liveSessionDuration >= sessionTimeWithExtension) {
                                sessionSrvApi.endSession();
                            } else if (liveSessionDuration >= EndAlertTimeWithExtension && !isSessionAlertShown) {
                                sessionEndAlert();
                            }

                        }, 60000);
                    }
                    function sessionEndAlert() {
                        var alertPopupTitle = 'Live session will end in ' + ENV.liveSession.sessionEndAlertTime + ' minutes.';
                        var popUpInstance = PopUpSrv.warning(alertPopupTitle, null,'Extend Session Time', 'OK');
                        return popUpInstance.promise.then(function(){
                            sessionData.extendTime += ENV.liveSession.sessionExtendTime;
                            $log.debug('Live session is extend by ' + ENV.liveSession.sessionExtendTime + ' minutes.');
                        },function(){
                            isSessionAlertShown = true;
                            $log.debug('Live session is continued.');
                        });
                    }
                    function destroyCheckDurationInterval() {
                        $interval.cancel(checkDurationInterval);
                    }
                    function loadSessionFrame() {
                        var sessionFrameContainerTemplate =
                            '<div class="frame-container">' +
                                '<div class="square-side top"></div>' +
                                '<div class="square-side right"></div>' +
                                '<div class="square-side bottom"></div>' +
                                '<div class="square-side left"></div>' +
                            '</div>';

                        var sessionFrameContainerElm = angular.element(sessionFrameContainerTemplate);
                        liveSessionFrameElm.append(sessionFrameContainerElm);
                        $animate.enter(sessionFrameContainerElm[0], liveSessionFrameElm[0]);
                        $compile(sessionFrameContainerElm)(childScope);
                    }

                    function clearSessionFrame() {
                        if(childScope){
                            childScope.$destroy();
                        }

                        if(liveSessionFrameElm){
                            var hasContents = !!liveSessionFrameElm.contents().length;
                            if(hasContents){
                                $animate.leave(liveSessionFrameElm.contents());
                            }
                        }
                    }

                    function _init() {
                        var bodyElement = angular.element(document.body);
                        liveSessionFrameElm = angular.element('<div class="live-session-frame"></div>');
                        bodyElement.append(liveSessionFrameElm);
                    }

                    var liveSessionFrameElm;
                    var activePanelCb;
                    var checkDurationInterval;
                    var liveSessionDuration;
                    var liveSessionsStatus;
                    var currSessionGUID;
                    var isSessionAlertShown = false;
                    var sessionSrvApi = {};
                    var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';
                    var userAuth = AuthService.getAuth();
                    var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                    var sessionData = {};
                    var childScope = $rootScope.$new(true);

                    $rootScope.$watch(function () {
                        return sessionData;
                    }, function (newSessionData) {
                        if (newSessionData && !angular.equals(newSessionData, {})) {
                            activePanelCb(newSessionData);
                            if (newSessionData.status === SessionsStatusEnum.ENDED.enum) {
                                PopUpSrv.info('Live session has ended');
                            }
                            if (newSessionData.status === SessionsStatusEnum.ACTIVE.enum && !isTeacher) {
                                $log.debug('There is an active live session');
                                PopUpSrv.info('You joined a live Session');
                            }
                        }
                    }, true);

                    $rootScope.$watch(function () {
                        return currSessionGUID;
                    }, function (newSessionGUID) {
                        if (newSessionGUID && newSessionGUID.guid) {
                            $log.debug('Load Live Session GUID: ', newSessionGUID.guid);
                            liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                        } else {
                            $log.debug('There isn\'t active live session ');
                            liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                        }
                        var isSessionData = !(angular.equals(sessionData, {}));
                        if (liveSessionsStatus && !isSessionData) {
                            sessionSrvApi.loadLiveSessionData().then(function (currSessionData) {
                                sessionData = currSessionData;
                                $log.debug('loadLiveSessionData, sessionData: ', sessionData);
                            });
                        }
                    }, true);

                    sessionSrvApi.startSession = function (sessionSubject) {
                        sessionData = sessionInit(sessionSubject);
                        currSessionGUID = { guid: sessionData.sessionGUID };
                        liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                        checkSessionDuration();
                        loadSessionFrame();
                        saveSession().then(function (res) {
                            $log.debug('Live Session Saved: ', res);
                        }).catch(function (err) {
                            $log.error('Error saving live session to firebase: ', err);
                        });
                    };

                    sessionSrvApi.getSessionSubjects = function() {
                        if (!subjects) {
                            subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];
                        }
                        return subjects.map(function (subjectId) {
                            var name = UtilitySrv.object.getKeyByValue(SessionSubjectEnumConst, subjectId).toLowerCase();
                            return {
                                id: subjectId,
                                name: name,
                                iconName: 'znkSession-' + name + '-icon'
                            };
                        });
                    };

                    sessionSrvApi.getLiveSessionGUID = function () {
                        var activeSessionPath  = isTeacher ? getLiveSessionPath('educator') : getLiveSessionPath('student');
                        activeSessionPath += '/active';
                        return globalStorageProm.then(function (globalStorage) {
                            return globalStorage.getAndBindToServer(activeSessionPath);
                        });
                    };

                    sessionSrvApi.loadLiveSessionData = function () {
                        return globalStorageProm.then(function (globalStorage) {
                            var sessionsPath = getLiveSessionPath('sessions');
                            return globalStorage.getAndBindToServer(sessionsPath);
                        });
                    };

                    sessionSrvApi.listenToLiveSessionsStatus = function () {
                        return sessionSrvApi.getLiveSessionGUID().then(function (sessionGUID) {
                            currSessionGUID = sessionGUID;
                        });
                    };

                    sessionSrvApi.endSession = function () {
                        $log.debug('Live session has ended.');
                        sessionData.endTime = getRoundTime();
                        sessionData.status = liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                        sessionData.duration = sessionData.endTime - sessionData.startTime;
                        destroyCheckDurationInterval();
                        clearSessionFrame();
                        updateSession().then(function (res) {
                            currSessionGUID = { guid: false };
                            $log.debug('Live Session Updated in firebase: ', res);
                        }).catch(function (err) {
                            $log.error('Error updating live session to firebase: ', err);
                        });
                    };

                    sessionSrvApi.registerToCurrUserLiveSessionStateChanges = function (cb) {
                        if (angular.isFunction(cb)) {
                            activePanelCb = cb;
                        }
                    };

                    $timeout(function(){
                        _init();
                    });

                    return sessionSrvApi;
                };
        }
    );
})(angular);

