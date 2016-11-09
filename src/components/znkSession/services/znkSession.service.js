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
                                 $window, $timeout) {
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
                    var studentUID = isTeacherApp ? StudentContextSrv.getCurrUid() : userAuth.uid;
                    switch (param) {
                        case 'sessions':
                            path = ENV.studentAppName + '/liveSession/' + currLiveSessionsGUID.guid;
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
                        dataToSave[educatorPath] = { guid: sessionData.sessionGUID };
                        globalStorage.update(dataToSave);
                    });
                }
                function updateSession() {
                    $log.debug('updateSession, sessionData: ', sessionData);
                    var dataToSave = {};
                    globalStorageProm.then(function (globalStorage) {
                        var studentPathActive = getPath('student') + '/active';
                        var studentPathArchive = getPath('student') + '/archive/' + sessionData.sessionGUID;
                        var educatorPathActive = getPath('educator') + '/active';
                        var educatorPathArchive = getPath('educator') + '/archive/' + sessionData.sessionGUID;
                        var sessionPath = getPath('sessions');
                        dataToSave[sessionPath] = sessionData;
                        dataToSave[studentPathArchive] = false;
                        dataToSave[educatorPathArchive] = false;
                        dataToSave[studentPathActive] = { guid: false };
                        dataToSave[educatorPathActive] = { guid: false };
                        globalStorage.update(dataToSave);
                    });
                }
                function handleCall() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.remove('ng-hide');
                    var callBtnElm = activePanelElm.querySelector('call-btn');
                    $timeout(function () {
                        callBtnElm.click();
                    });
                }

                function showActivePanel() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.remove('ng-hide');
                }
                function hideActivePanel() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.add('ng-hide');
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
                    currLiveSessionsGUID = { guid: sessionData.sessionGUID};
                    liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                    saveSession();
                    showActivePanel();
                    handleCall();
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
                            showActivePanel();
                        });
                    });
                };

                sessionSrvApi.listenToLiveSessionsStatus = function () {
                    return sessionSrvApi.getLiveSessionGUID().then(function (sessionGUID) {
                        currLiveSessionsGUID = sessionGUID;
                        liveSessionsStatus = currLiveSessionsGUID.guid ?
                            SessionsStatusEnum.ACTIVE.enum : SessionsStatusEnum.ENDED.enum;
                        var isSessionData = !(angular.equals(sessionData, {}));
                        if (liveSessionsStatus === SessionsStatusEnum.ACTIVE.enum && !isSessionData) {
                            sessionSrvApi.loadLiveSessionData();
                        }
                        if (currLiveSessionsGUID.guid) {
                            $log.debug('There is an active session');
                            sessionSrvApi.showLiveSessionModal();
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
                    var endTime = Date.now();
                    liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                    sessionData.status = SessionsStatusEnum.ENDED.enum;
                    sessionData.duration = endTime - sessionData.startTime;
                    handleCall();
                    hideActivePanel();
                    updateSession();
                };

                sessionSrvApi.addExtendTime = function () {
                    sessionData.extendTime += minToUnixTimestamp(ENV.liveSession.sessionExtendTime);
                };


                return sessionSrvApi;
            };
        }
    );
})(angular);

