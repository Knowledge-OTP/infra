(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession',
        [
            'ngMaterial',
            'znk.infra.popUp',
            'pascalprecht.translate',
            'znk.infra.auth',
            'znk.infra.userContext',
            'znk.infra.utility',
            'znk.infra.analytics',
            'znk.infra.general',
            'znk.infra.user',
            'znk.infra.svgIcon',
            'znk.infra.mailSender',
            'znk.infra.exerciseUtility',
            'znk.infra.calls',
            'znk.infra.activePanel'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znkSession-english-icon': 'components/znkSession/svg/znkSession-verbal-icon.svg',
                    'znkSession-math-icon': 'components/znkSession/svg/znkSession-math-icon.svg',
                    'znkSession-start-lesson-popup-icon': 'components/znkSession/svg/znkSession-start-lesson-popup-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/sessionBtn.template.html',
            controllerAs: 'vm',
            controller: ["$log", "$scope", "$mdDialog", "SessionSrv", "StudentContextSrv", "PresenceService", function ($log, $scope, $mdDialog, SessionSrv, StudentContextSrv,
                                  PresenceService) {
                'ngInject';

                var vm = this;
                var studentUid = StudentContextSrv.getCurrUid();

                function trackStudentPresenceCB(userId, newStatus) {
                    console.log('newStatus: ',newStatus );
                    vm.isOffline = newStatus === PresenceService.userStatus.OFFLINE;
                }

                this.$onInit = function() {
                    vm.activeSessionGuid = {};
                    vm.isLiveSessionActive = false;
                    vm.endSession = SessionSrv.endSession;
                    vm.isOffline = true;

                    PresenceService.startTrackUserPresence(studentUid, trackStudentPresenceCB.bind(null, studentUid));

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
            }]
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('startSessionModal', {
            bindings: {},
            templateUrl: 'components/znkSession/components/startSessionModal/startSessionModal.template.html',
            controllerAs: 'vm',
            controller: ["$mdDialog", "SessionSrv", function($mdDialog, SessionSrv) {
                'ngInject';

                var vm = this;
                vm.sessionSubjects = SessionSrv.getSessionSubjects();
                vm.closeModal = $mdDialog.cancel;
                vm.startSession = SessionSrv.startSession;

            }]
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').factory('SessionBtnStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['START_BTN', 2, 'start btn'],
                ['ENDED_BTN', 3, 'ended btn']
            ]);
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').factory('SessionsStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ENDED', 0, 'ended Session'],
                ['ACTIVE', 1, 'active Session']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        ENGLISH: 5
    };

    angular.module('znk.infra.znkSession').constant('SessionSubjectEnumConst', subjectEnum);

    angular.module('znk.infra.znkSession').factory('SessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            return new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = ["$rootScope", "$log", "ENV", "AuthService", "InfraConfigSrv", "StudentContextSrv", "TeacherContextSrv", "UtilitySrv", "SessionSubjectEnumConst", "$mdDialog", "SessionsStatusEnum", "$window", "$timeout", "PopUpSrv", "$interval", function($rootScope, $log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, TeacherContextSrv,
                                 UtilitySrv, SessionSubjectEnumConst, $mdDialog, SessionsStatusEnum,
                                 $window, $timeout, PopUpSrv, $interval) {
                'ngInject';

                function getRoundTime() {
                    return Math.floor(Date.now() / 1000) * 1000;
                }
                function sessionInit(sessionSubject) {
                    return {
                        appName: ENV.studentAppName.split('_')[0],
                        sessionGUID: UtilitySrv.general.createGuid(),
                        educatorUID: userAuth.uid,
                        studentUID: StudentContextSrv.getCurrUid(),
                        extendTime: 0,
                        startTime: getRoundTime(),
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

                var activePanelCb;
                var checkDurationInterval;
                var liveSessionDuration;
                var liveSessionsStatus;
                var currLiveSessionsGUID;
                var isSessionAlertShown = false;
                var sessionSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var sessionData = {};

                sessionSrvApi.startSession = function (sessionSubject) {
                    sessionData = sessionInit(sessionSubject);
                    currLiveSessionsGUID = { guid: sessionData.sessionGUID };
                    liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                    checkSessionDuration();
                    saveSession().then(function (res) {
                        activePanelCb(sessionData);
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
                    var activeSessionPath  = isTeacherApp ? getLiveSessionPath('educator') : getLiveSessionPath('student');
                    activeSessionPath += '/active';
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(activeSessionPath);
                    });
                };

                sessionSrvApi.loadLiveSessionData = function () {
                    $log.debug('Load Live Session Data, session GUID: ', currLiveSessionsGUID);
                    globalStorageProm.then(function (globalStorage) {
                        var sessionsPath = getLiveSessionPath('sessions');
                        globalStorage.get(sessionsPath).then(function (currSessionData) {
                            sessionData = currSessionData;
                            $log.debug('loadLiveSessionData, sessionData: ', sessionData);
                             activePanelCb(sessionData);
                        });
                    });
                };

                sessionSrvApi.listenToLiveSessionsStatus = function () {
                    return sessionSrvApi.getLiveSessionGUID().then(function (sessionGUID) {
                        currLiveSessionsGUID = sessionGUID;
                        $rootScope.$watch(function () { return currLiveSessionsGUID; },
                            function (newLiveSessionGUID) {
                                liveSessionsStatus = newLiveSessionGUID.guid ?
                                    SessionsStatusEnum.ACTIVE.enum : SessionsStatusEnum.ENDED.enum;
                                var isSessionData = !(angular.equals(sessionData, {}));
                                if (liveSessionsStatus === SessionsStatusEnum.ACTIVE.enum && !isSessionData) {
                                    sessionSrvApi.loadLiveSessionData();
                                } else {
                                    activePanelCb(sessionData);
                                }
                                if (newLiveSessionGUID.guid && !isTeacherApp) {
                                    $log.debug('There is an active live session');
                                    PopUpSrv.info('You joined a live Session');
                                }
                            }, true);
                    });
                };

                sessionSrvApi.endSession = function () {
                    $log.debug('Live session has ended.');
                    var endTime = getRoundTime();
                    currLiveSessionsGUID = {};
                    sessionData.status = liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                    sessionData.duration = endTime - sessionData.startTime;
                    destroyCheckDurationInterval();
                    activePanelCb(sessionData);
                    updateSession().then(function (res) {
                        $log.debug('Live Session Updated in firebase: ', res);
                        PopUpSrv.info('Live session has ended');
                    }).catch(function (err) {
                        $log.error('Error updating live session to firebase: ', err);
                    });
                };

                sessionSrvApi.registerToCurrUserLiveSessionStateChanges = function (cb) {
                    if (angular.isFunction(cb)) {
                        activePanelCb = cb;
                    }
                };

                return sessionSrvApi;
            }];
        }
    );
})(angular);


angular.module('znk.infra.znkSession').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkSession/components/sessionBtn/sessionBtn.template.html",
    "<md-button class=\"session-btn\" ng-disabled=\"vm.isOffline\"\n" +
    "           ng-class=\"{'offline': vm.isOffline, 'end-session': vm.isLiveSessionActive}\"\n" +
    "           ng-click=\"!vm.isLiveSessionActive ? vm.showSessionModal() : vm.endSession()\">\n" +
    "    <span ng-if=\"!vm.isLiveSessionActive\">{{'ZNK_SESSION.START_SESSION' | translate}}</span>\n" +
    "    <span ng-if=\"vm.isLiveSessionActive\">{{'ZNK_SESSION.END_SESSION' | translate}}</span>\n" +
    "</md-button>\n" +
    "\n" +
    "");
  $templateCache.put("components/znkSession/components/startSessionModal/startSessionModal.template.html",
    "<div class=\"start-session-modal\">\n" +
    "    <div class=\"base base-border-radius session-container\" translate-namespace=\"ZNK_SESSION\">\n" +
    "        <div class=\"popup-header\">\n" +
    "            <div class=\"top-icon-wrap\">\n" +
    "                <div class=\"top-icon\">\n" +
    "                    <div class=\"round-icon-wrap\">\n" +
    "                        <svg-icon name=\"znkSession-start-lesson-popup-icon\"></svg-icon>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"popup-content\">\n" +
    "            <div class=\"main-title\" translate=\".START_SESSION\"></div>\n" +
    "            <div class=\"sub-title\" translate=\".SESSION_SUBJECT\"></div>\n" +
    "            <div class=\"subjects-btns\">\n" +
    "                <button class=\"subject-icon-wrap\"\n" +
    "                        ng-repeat=\"subject in ::vm.sessionSubjects\"\n" +
    "                        ng-class=\"subject.name\"\n" +
    "                        ng-click=\"vm.startSession(subject); vm.closeModal();\">\n" +
    "                    <svg-icon name={{subject.iconName}}></svg-icon>\n" +
    "                    <span>{{subject.name}}</span>\n" +
    "                </button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkSession/svg/znkSession-english-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xml:space=\"preserve\" x=\"0px\" y=\"0px\"\n" +
    "     viewBox=\"0 0 80 80\" class=\"reading-svg\">\n" +
    "\n" +
    "    <style type=\"text/css\">\n" +
    "        .reading-svg {\n" +
    "        width: 100%;\n" +
    "        height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "\n" +
    "    <g>\n" +
    "        <path d=\"M4.2,11.3c0.3,0,0.5-0.1,0.7-0.1c3.5,0.2,6.9-0.4,10.3-1.5c6.6-2.1,13.1-1,19.6,0.9c3.8,1.1,7.7,1.1,11.5,0\n" +
    "		c7.8-2.3,15.5-3,23.1,0.4c0.5,0.2,1.1,0.2,1.6,0.2c1.8,0,3.6,0,5.5,0c0,17.3,0,34.5,0,51.8c-10,0-20.1,0-30.1,0\n" +
    "		c-0.1,0.8-0.1,1.4-0.2,2.1c-3.6,0-7.2,0-11,0c0-0.6-0.1-1.3-0.2-2.1c-10.3,0-20.5,0-30.9,0C4.2,45.7,4.2,28.6,4.2,11.3z M39.4,60.5\n" +
    "		c0-1.1,0-1.8,0-2.5c0-13.2,0.1-26.4,0.1-39.6c0-4.2,0-4.2-4-5.6c-8.5-2.9-17-3.6-25.3,0.6c-1.2,0.6-1.7,1.3-1.7,2.8\n" +
    "		c0.1,13.9,0,27.9,0,41.8c0,0.6,0,1.2,0,1.9C18.8,57.6,29,56.7,39.4,60.5z M72.2,60c0-0.8,0-1.5,0-2.1c0-12.8,0-25.6,0-38.5\n" +
    "		c0-5.6,0-5.7-5.5-7.5c-8.1-2.8-15.8-1.2-23.4,1.8c-1.4,0.5-1.8,1.3-1.8,2.7c0,14.1,0,28.1,0,42.2c0,0.6,0,1.2,0,2\n" +
    "		C51.7,56.8,61.9,57.6,72.2,60z\"/>\n" +
    "        <path d=\"M33.2,25.1c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C34.2,24.8,33.7,25.1,33.2,25.1z\"/>\n" +
    "        <path d=\"M33.2,33.2c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C34.2,33,33.7,33.2,33.2,33.2z\"/>\n" +
    "        <path d=\"M33.2,41.4c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C34.2,41.1,33.7,41.4,33.2,41.4z\"/>\n" +
    "        <path d=\"M33.2,49.5c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C34.2,49.3,33.7,49.5,33.2,49.5z\"/>\n" +
    "        <path d=\"M66.5,24.7c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C67.6,24.5,67.1,24.7,66.5,24.7z\"/>\n" +
    "        <path d=\"M66.5,32.9c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C67.6,32.6,67.1,32.9,66.5,32.9z\"/>\n" +
    "        <path d=\"M66.5,41c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C67.6,40.7,67.1,41,66.5,41z\"/>\n" +
    "        <path d=\"M66.5,49.2c-0.2,0-0.5-0.1-0.7-0.2c-9.2-5.2-17-0.3-17.3-0.1c-0.7,0.4-1.6,0.3-2.1-0.4\n" +
    "		c-0.5-0.7-0.3-1.6,0.4-2c0.4-0.3,9.5-6.2,20.4-0.1c0.7,0.4,1,1.3,0.6,2C67.6,48.9,67.1,49.2,66.5,49.2z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkSession/svg/znkSession-math-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "     class=\"math-icon-svg\"\n" +
    "	 viewBox=\"-554 409.2 90 83.8\">\n" +
    "\n" +
    "    <style type=\"text/css\">\n" +
    "        .math-icon-svg{\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "\n" +
    "<g>\n" +
    "	<path d=\"M-491.4,447.3c-3,0-6.1,0-9.1,0c-2.9,0-4.7-1.8-4.7-4.7c0-6.1,0-12.1,0-18.2c0-2.9,1.8-4.7,4.7-4.7c6,0,12,0,18,0\n" +
    "		c2.8,0,4.7,1.9,4.7,4.7c0,6.1,0,12.1,0,18.2c0,2.8-1.8,4.6-4.6,4.6C-485.4,447.4-488.4,447.3-491.4,447.3z M-491.4,435.5\n" +
    "		c2.5,0,5,0,7.5,0c1.6,0,2.5-0.8,2.4-2c-0.1-1.5-1.1-1.9-2.4-1.9c-5,0-10.1,0-15.1,0c-1.6,0-2.6,0.8-2.5,2c0.2,1.4,1.1,1.9,2.5,1.9\n" +
    "		C-496.5,435.5-494,435.5-491.4,435.5z\"/>\n" +
    "	<path d=\"M-526.6,447.3c-3,0-6,0-8.9,0c-3,0-4.7-1.8-4.8-4.8c0-6,0-11.9,0-17.9c0-3,1.9-4.8,4.9-4.8c5.9,0,11.8,0,17.7,0\n" +
    "		c3.1,0,4.9,1.8,4.9,4.8c0,6,0,11.9,0,17.9c0,3.1-1.8,4.8-4.9,4.8C-520.6,447.4-523.6,447.3-526.6,447.3z M-526.4,443.5\n" +
    "		c1.3-0.1,2-0.9,2-2.2c0.1-1.5,0.1-3,0-4.5c0-1.1,0.4-1.4,1.4-1.4c1.4,0.1,2.8,0,4.1,0c1.3,0,2.2-0.5,2.2-1.9c0.1-1.3-0.8-2-2.3-2\n" +
    "		c-1.4,0-2.8-0.1-4.1,0c-1.2,0.1-1.6-0.4-1.5-1.6c0.1-1.4,0-2.8,0-4.1c0-1.3-0.6-2.2-1.9-2.2c-1.4,0-2,0.8-2,2.2c0,1.5,0,3,0,4.5\n" +
    "		c0,1-0.3,1.3-1.3,1.3c-1.5,0-3,0-4.5,0c-1.3,0-2.2,0.6-2.2,2c0,1.4,0.9,1.9,2.2,1.9c1.5,0,3,0,4.5,0c1.1,0,1.4,0.4,1.4,1.4\n" +
    "		c-0.1,1.5,0,3,0,4.5C-528.4,442.6-527.8,443.3-526.4,443.5z\"/>\n" +
    "	<path d=\"M-526.5,454.9c3,0,6,0,8.9,0c3,0,4.8,1.8,4.8,4.8c0,6,0,12,0,18c0,2.9-1.8,4.7-4.7,4.7c-6.1,0-12.1,0-18.2,0\n" +
    "		c-2.8,0-4.6-1.9-4.6-4.6c0-6.1,0-12.1,0-18.2c0-2.9,1.8-4.6,4.7-4.7C-532.5,454.8-529.5,454.9-526.5,454.9z M-526.7,471.1\n" +
    "		c1.6,1.7,2.9,3,4.2,4.3c0.9,0.9,1.9,1.2,3,0.3c1-0.8,0.9-1.9-0.2-3.1c-1-1.1-2.1-2.1-3.2-3.2c-0.6-0.6-0.6-1.1,0-1.7\n" +
    "		c1-1,2-1.9,2.9-2.9c1.3-1.3,1.4-2.4,0.4-3.3c-0.9-0.8-2-0.7-3.2,0.5c-1.2,1.3-2.3,2.6-3.8,4.3c-1.5-1.7-2.6-3-3.8-4.2\n" +
    "		c-1.2-1.3-2.4-1.4-3.3-0.5c-1,0.9-0.8,2,0.5,3.3c1.2,1.2,2.4,2.4,3.8,3.8c-1.4,1.4-2.7,2.6-3.9,3.8c-1.2,1.2-1.3,2.3-0.3,3.2\n" +
    "		c0.9,0.9,2,0.8,3.2-0.4C-529.2,473.9-528.1,472.6-526.7,471.1z\"/>\n" +
    "	<path d=\"M-505.2,468.5c0-3,0-6,0-8.9c0-2.9,1.7-4.7,4.7-4.7c6.1,0,12.1,0,18.2,0c2.9,0,4.6,1.8,4.7,4.7c0,6,0,12,0,18\n" +
    "		c0,2.8-1.9,4.7-4.7,4.7c-6.1,0-12.1,0-18.2,0c-2.8,0-4.6-1.8-4.6-4.6C-505.3,474.7-505.2,471.6-505.2,468.5z M-491.4,476\n" +
    "		c2.5,0,5,0,7.5,0c1.3,0,2.3-0.5,2.4-1.9c0.1-1.3-0.8-2.1-2.4-2.1c-5,0-10.1,0-15.1,0c-1.6,0-2.6,0.9-2.5,2.1\n" +
    "		c0.2,1.4,1.1,1.9,2.5,1.9C-496.5,476-494,476-491.4,476z M-491.4,461.2c-2.5,0-5.1,0-7.6,0c-1.6,0-2.6,0.8-2.5,2\n" +
    "		c0.2,1.4,1.1,1.9,2.5,1.9c5,0,10.1,0,15.1,0c1.3,0,2.3-0.4,2.4-1.9c0.1-1.3-0.8-2-2.4-2C-486.4,461.2-488.9,461.2-491.4,461.2z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkSession/svg/znkSession-start-lesson-popup-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 170.1 126.2\" xml:space=\"preserve\" class=\"start-lesson-icon-svg\">\n" +
    "    <style type=\"text/css\">\n" +
    "	.start-lesson-icon-svg {width: 100%; height: auto;}\n" +
    "	.start-lesson-icon-svg .st0{fill:#ffffff;enable-background:new;}\n" +
    "</style>\n" +
    "<g class=\"st0\">\n" +
    "	<path d=\"M63.6,90.4c0,11.8,0,23.6,0,35.8c-21.1,0-42,0-63.2,0c-0.1-1.5-0.3-2.9-0.3-4.4c0-14.7-0.1-29.3,0-44\n" +
    "		c0.1-14.4,6.9-21,21.2-21c8,0,16,0,24,0c7.6,0.1,14.3,2.6,19.7,8.2c4.8,4.9,9.6,9.7,14.5,14.5C83.1,83,87,83,90.7,79.4\n" +
    "		c5.3-5.3,10.5-10.7,15.9-15.9c4.9-4.7,10.4-4.1,14.1,1.1c2.6,3.7,2.2,7.4-0.8,10.5c-8.7,9.2-17.5,18.3-26.5,27.1\n" +
    "		c-5.4,5.2-10.8,5.1-16.4-0.1c-4.2-3.9-7.9-8.5-11.8-12.8C64.6,89.6,64.1,90,63.6,90.4z\"/>\n" +
    "	<path d=\"M161.5,117.4c0-36.7,0-72.4,0-108.4c-25.6,0-51,0-76.8,0c0,17.3,0,34.4,0,51.9c-3.1,0-5.8,0-8.8,0c0-20.1,0-40.2,0-60.6\n" +
    "		c31.4,0,62.6,0,94.2,0c0,41.8,0,83.5,0,125.6c-31.3,0-62.6,0-94.3,0c0-2.7,0-5.3,0-8.5C104.3,117.4,132.7,117.4,161.5,117.4z\"/>\n" +
    "	<path d=\"M6.6,25.3C6.6,11,17.9-0.2,32,0c13.7,0.2,25.1,11.7,25.1,25.4c0,13.9-11.7,25.5-25.6,25.3C17.8,50.6,6.6,39.2,6.6,25.3z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkSession/svg/znkSession-verbal-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\" y=\"0px\" viewBox=\"-586.4 16.3 301.4 213.6\" xml:space=\"preserve\"\n" +
    "    class=\"verbal-icon-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "    .verbal-icon-svg {width: 100%; height: auto;}\n" +
    "    .verbal-icon-svg .st0{fill:none;enable-background:new    ;}\n" +
    "</style>\n" +
    "<path d=\"M-546.8,113.1c0-20.2,0-40.3,0-60.5c0-7.8,0.9-9.1,8.7-8c11.5,1.5,22.9,3.7,34.3,6.1c3.5,0.7,6.8,2.7,10,4.3\n" +
    "	c6.3,3.2,9.2,7.7,9.1,15.5c-0.5,36.6-0.2,73.3-0.2,110c0,8.6-1.3,9.5-9.4,6.7c-15.1-5.2-30.4-8.6-46.5-5.6c-3.6,0.7-5.4-1.1-5.9-4.4\n" +
    "	c-0.2-1.5-0.1-3-0.1-4.5C-546.8,152.7-546.8,132.9-546.8,113.1z M-526.4,142.5c-1.7,0-2.5,0-3.3,0c-3.2,0-6.4,0.2-6.5,4.3\n" +
    "	c-0.1,4.1,3,4.6,6.3,4.5c9.9-0.2,18.9,2.8,27.4,7.8c2.6,1.6,5.1,1.8,6.9-1c1.8-3,0.1-5-2.4-6.5C-507.1,146.2-516.7,143-526.4,142.5z\n" +
    "	 M-529.3,66.9c0.2,0-0.3,0-0.8,0c-3.1,0.2-6.3,0.6-6.1,4.8c0.2,3.9,3.2,4,6.2,4c9.7-0.1,18.6,2.8,26.9,7.7c2.6,1.6,5.4,2.5,7.4-0.7\n" +
    "	c2.1-3.3-0.1-5.2-2.7-6.8C-507.8,70.4-517.8,67.2-529.3,66.9z M-526.6,117.3c-1.8,0-2.6,0-3.5,0c-3.2,0-6.3,0.5-6.2,4.6\n" +
    "	c0.1,3.8,3,4.1,6.1,4.1c9.9,0,18.9,2.8,27.4,7.8c2.8,1.7,5.5,2,7.2-1.2c1.6-3.1-0.4-4.9-2.9-6.4C-507.4,121-517.1,117.7-526.6,117.3\n" +
    "	z M-527.2,92.3c-1.5,0-3-0.1-4.5,0c-2.9,0.2-5.2,1.8-4.4,4.7c0.4,1.6,3.1,3.7,4.7,3.7c10.3,0.1,19.7,2.8,28.5,8\n" +
    "	c2.8,1.6,5.5,2.1,7.3-1.1c1.7-3.1-0.4-5-2.9-6.4C-507.3,95.9-516.8,92.6-527.2,92.3z\"/>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<path d=\"M-391.9,156.9l-20,5c-1.1,0.3-2-0.5-1.7-1.7l5-20c0.4-1.5,2.2-2.3,3.1-1.4l15.1,15.1C-389.6,154.7-390.5,156.5-391.9,156.9\n" +
    "		z\"/>\n" +
    "	<path d=\"M-299.8,34.6l13.9,13.9c1.2,1.2,1.2,3.2,0,4.5l-5.9,5.9c-1.2,1.2-3.2,1.2-4.5,0l-13.9-13.9c-1.2-1.2-1.2-3.2,0-4.5l5.9-5.9\n" +
    "		C-303,33.3-301,33.3-299.8,34.6z\"/>\n" +
    "	<path d=\"M-384.3,150.6l85.5-85.5c1-1,1.2-2.5,0.5-3.2l-15.5-15.5c-0.8-0.8-2.2-0.5-3.2,0.5l-85.5,85.5c-1,1-1.2,2.5-0.5,3.2\n" +
    "		l15.5,15.5C-386.7,151.8-385.3,151.6-384.3,150.6z\"/>\n" +
    "</g>\n" +
    "<g>\n" +
    "	<path d=\"M-355.7,129.9c-0.6,0.6-0.9,1.3-0.9,2.1c0,19.4-0.1,38.8,0.1,58.1c0.1,5.5-1.4,7.1-7.1,7.5c-31.1,2-61.3,8.9-90.6,19.6\n" +
    "		c-3.8,1.4-7,1.5-10.9,0.1c-29.9-10.8-60.7-17.9-92.5-19.8c-4.3-0.3-5.5-1.7-5.5-5.7c0.1-52.7,0.1-105.5,0-158.2\n" +
    "		c0-4.5,1.6-6.1,6-6.1c30.5-0.2,60.1,4,88.6,15.5c4.1,1.7,4.5,4.1,4.5,7.9c-0.1,46.5-0.1,93.1-0.1,139.6c0,1.7-0.5,3.7,0.1,5.1\n" +
    "		c0.9,1.8,2.6,3.3,4,4.9c1.6-1.7,3.5-3.1,4.5-5c0.7-1.3,0.2-3.4,0.2-5.1c0-46.3,0.1-92.6-0.1-138.9c0-4.8,1.3-7,5.9-8.8\n" +
    "		c27.7-11.2,56.5-15,86.1-15.1c5.4,0,6.9,1.9,6.9,7.1c-0.1,9.7-0.2,33.9-0.2,39.7c0,0.8,0.9,1.3,1.5,0.8l21.8-20.9\n" +
    "		c0.7-0.5,1.1-1.3,1.1-2.1c0-11.1-0.9-11.6-13.4-13.1c0-2.8,0.1-5.7,0-8.6c-0.2-7.9-4-12.9-11.9-13.2c-11.7-0.5-23.5-0.2-35.3,0.7\n" +
    "		c-21.9,1.7-42.9,7.2-63.3,15.4c-2.4,1-5.9,0.5-8.4-0.5c-27.3-11.3-55.9-15.6-85.2-16.4c-3.6-0.1-7.3,0.1-10.9,0.6\n" +
    "		c-9.1,1.2-12.8,5.3-13,14.3c-0.1,2.5,0,5,0,7.7c-4.7,0.5-8.6,1-12.6,1.5v181.4c3.6,0.3,7.2,1,10.8,1c28.1,0.1,56.2-0.3,84.2,0.3\n" +
    "		c7.7,0.2,15.5,2.4,22.9,5c6,2.1,11.3,2.9,17.1,0c8.6-4.2,17.7-5.5,27.4-5.3c26.8,0.4,53.6,0.1,80.4,0.1c9.4,0,11.3-1.9,11.4-11.2\n" +
    "		c0-31.6-1.6-68.3-1.7-100.3c0-1.4-1.6-2-2.6-1.1C-341.7,115.3-352.5,126.8-355.7,129.9z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
