(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, TeacherContextSrv,
                                 UtilitySrv, SessionSubjectEnumConst, $mdDialog, ActivePanelSrv, SessionsStatusEnum,
                                 ScreenSharingSrv, $window, $timeout) {
                'ngInject';

                function sessionInit(sessionSubject) {
                    return {
                        appName: ENV.studentAppName.split('_')[0].toUpperCase(),
                        sessionGUID: UtilitySrv.general.createGuid(),
                        educatorUID: userAuth.uid || 'N/A',
                        studentUID: StudentContextSrv.getCurrUid() || 'N/A',
                        extendTime: 0,
                        startTime: Date.now(),
                        duration: null,
                        sessionSubject: sessionSubject.id,
                        status: SessionsStatusEnum.ACTIVE.enum  //(values: 1 = Active, 0 = Ended)
                    };
                }
                function getKeyByValue(obj, value) {
                    for( var prop in obj ) {
                        if( obj.hasOwnProperty( prop ) ) {
                            if( obj[ prop ] === value ) {
                                return prop;
                            }
                        }
                    }
                }
                function minToUnixTimestamp(min) {
                    return min * 60 * 1000;
                }
                function getPath(param) {
                    if (!userAuth) {
                        $log.error('Invalid user');
                        return;
                    }
                    var path;
                    var educatorUID = isTeacherApp ? userAuth.uid : TeacherContextSrv.getCurrUid();
                    var studentUID = isTeacherApp ? 'cb377ddc-6d71-496f-aef5-a357d9afee88' : userAuth.uid;
                    switch (param) {
                        case 'sessions':
                            path = ENV.studentAppName + '/liveSession/' + currLiveSessionsGUID;
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
                    globalStorageProm.then(function (globalStorage) {
                        var studentPath = getPath('student') + '/active';
                        var educatorPath = getPath('educator') + '/active';
                        var sessionPath = getPath('sessions');
                        dataToSave[sessionPath] = sessionData;
                        dataToSave[studentPath] = sessionData.sessionGUID;
                        dataToSave[educatorPath] = sessionData.sessionGUID;
                        globalStorage.update(dataToSave);
                    });
                }
                function updateSession() {
                    $log.debug('updateSession, sessionData: ', sessionData);
                    var dataToSave = {};
                    globalStorageProm.then(function (globalStorage) {
                        var studentPathActive = getPath('student') + '/active';
                        var studentPathArchive = getPath('student') + '/archive';
                        var educatorPathActive = getPath('educator') + '/active';
                        var educatorPathArchive = getPath('educator') + '/archive';
                        var sessionPath = getPath('sessions');
                        dataToSave[sessionPath] = sessionData;
                        dataToSave[studentPathArchive] = sessionData.sessionGUID;
                        dataToSave[educatorPathArchive] = sessionData.sessionGUID;
                        dataToSave[studentPathActive] = false;
                        dataToSave[educatorPathActive] = false;
                        globalStorage.update(dataToSave);
                    });
                }
                function showActivePanel() {
                    console.log('showActivePanel ' );
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.remove('ng-hide');
                    var shareScreenElm = activePanelElm.querySelector('.share-my-screen');
                    $timeout(function () {
                        shareScreenElm.click();
                    });
                }

                var liveSessionsStatus;
                var currLiveSessionsGUID;
                var sessionSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var sessionData = {};

                sessionSrvApi.startSession = function (sessionSubject) {
                    sessionData = sessionInit(sessionSubject);
                    currLiveSessionsGUID = sessionData.sessionGUID;
                    liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;

                    $log.debug('startSession, subject name: ', sessionSubject.name);
                    saveSession();
                    showActivePanel();
                };


                sessionSrvApi.getSessionSubjects = function() {
                    if (!subjects) {
                        subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];
                    }
                    return subjects.map(function (subjectId) {
                        var name = getKeyByValue(SessionSubjectEnumConst, subjectId).toLowerCase();
                        return {
                            id: subjectId,
                            name: name,
                            iconName: 'znkSession-' + name + '-icon'
                        };
                    });
                };

                sessionSrvApi.getLiveSessionGUID = function () {
                    var activeSessionPath  = isTeacherApp ? getPath('educator') : getPath('student');
                    activeSessionPath += '/active';
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(activeSessionPath);
                    });
                };

                sessionSrvApi.loadLiveSessionData = function () {
                    $log.debug('Load Live Session Data, session GUID: ', currLiveSessionsGUID);
                    globalStorageProm.then(function (globalStorage) {
                        var sessionsPath = getPath('sessions');
                        globalStorage.get(sessionsPath).then(function (currSessionData) {
                            sessionData = currSessionData;
                            $log.debug('loadLiveSessionData, sessionData: ', sessionData);
                        });
                    });
                };

                sessionSrvApi.listenToLiveSessionsStatus = function () {
                    return sessionSrvApi.getLiveSessionGUID().then(function (sessionGUID) {
                        currLiveSessionsGUID = sessionGUID;
                        liveSessionsStatus = currLiveSessionsGUID ?
                            SessionsStatusEnum.ACTIVE.enum : SessionsStatusEnum.ENDED.enum;
                        var isSessionData = !(angular.equals(sessionData, {}));
                        if (liveSessionsStatus === SessionsStatusEnum.ACTIVE.enum && !isSessionData) {
                            sessionSrvApi.loadLiveSessionData();
                        }
                        if (currLiveSessionsGUID &&!(angular.equals(currLiveSessionsGUID, {}))) {
                            $log.debug('There is an active session');
                            sessionSrvApi.showLiveSessionModal();
                        } else {
                            $log.debug('There is no active session');
                        }
                    });
                };

                sessionSrvApi.showLiveSessionModal = function () {
                    return $mdDialog.show({
                        controller: 'activeSessionCtrl',
                        templateUrl: 'components/znkSession/modals/templates/activeSession.template.html',
                        disableParentScroll: false,
                        clickOutsideToClose: true,
                        fullscreen: false,
                        controllerAs: 'vm'
                    });
                };

                sessionSrvApi.endSession = function () {
                    $log.debug('sessionData before end', sessionData);
                    var endTime = Date.now();
                    liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                    sessionData.status = SessionsStatusEnum.ENDED.enum;
                    sessionData.duration = endTime - sessionData.startTime;
                    updateSession();
                    $log.debug('sessionData after end', sessionData);
                };

                sessionSrvApi.addExtendTime = function () {
                    sessionData.extendTime += minToUnixTimestamp(ENV.liveSession.sessionExtendTime);
                };


                return sessionSrvApi;
            };
        }
    );
})(angular);

