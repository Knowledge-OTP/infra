(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring',[
        'znk.infra.contentGetters'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'homework-icon': 'components/eTutoring/svg/homework-icon.svg',
                    'english-topic-icon': 'components/eTutoring/svg/english-topic-icon.svg',
                    'math-topic-icon': 'components/eTutoring/svg/math-topic-icon.svg',
                    'etutoring-slides-icon': 'components/eTutoring/svg/etutoring-slides-icon.svg',
                    'etutoring-exercise-icon': 'components/eTutoring/svg/etutoring-exercise-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

(function (angular) {
    'use strict';

    diagnosticData.$inject = ["WorkoutsDiagnosticFlow"];
    exerciseData.$inject = ["$stateParams", "ExerciseParentEnum", "$state"];
    angular.module('znk.infra.eTutoring')
        .config(["$stateProvider", function ($stateProvider) {
            'ngInject';
            $stateProvider
                .state('app.eTutoring', {
                    url: '/etutoring/?moduleId/?viewId',
                    templateUrl: 'components/eTutoring/templates/eTutoring.template.html',
                    controller: 'ETutoringController',
                    controllerAs: 'vm',
                    reloadOnSearch: false,
                    resolve: {
                        diagnosticData: diagnosticData
                    }
                })
                .state('app.eTutoringWorkout', {
                    url: '/etutoring?exerciseId/?exerciseTypeId/?moduleId/?exerciseParentId/?assignContentType/?examId/?moduleResultGuid/?viewId',
                    templateUrl: 'components/eTutoring/templates/eTutoringWorkout.template.html',
                    controller: 'ETutoringWorkoutController',
                    controllerAs: 'vm',
                    resolve: {
                        exerciseData: exerciseData
                    }
                });
        }]);

    function diagnosticData(WorkoutsDiagnosticFlow) {
        'ngInject';
        return WorkoutsDiagnosticFlow.getDiagnostic().then(function (result) {
            return (result.isComplete) ? result.isComplete : false;
        });
    }

    function exerciseData($stateParams, ExerciseParentEnum, $state) {
        'ngInject';

        var exerciseId = angular.isDefined($stateParams.exerciseId) ? +$stateParams.exerciseId : 1;
        var exerciseTypeId = angular.isDefined($stateParams.exerciseTypeId) ? +$stateParams.exerciseTypeId : 1;
        var assignContentType = angular.isDefined($stateParams.assignContentType) ? +$stateParams.assignContentType : 1;
        var moduleId = $stateParams.moduleId;
        var moduleResultGuid = $stateParams.moduleResultGuid;
        var viewId = $stateParams.viewId;
        return {
            exerciseId: exerciseId,
            exerciseTypeId: exerciseTypeId,
            assignContentType: assignContentType,
            exerciseParentId: moduleId,
            moduleResultGuid: moduleResultGuid,
            exerciseParentTypeId: ExerciseParentEnum.MODULE.enum,
            examId: +$stateParams.examId,
            exitAction: function () {
                $state.go('app.eTutoring', {moduleId: moduleId, viewId: viewId});
            }
        };
    }

})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').constant('ETutoringViewsConst', {
        LESSON: 1,
        PRACTICE: 2
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringController',
        ["$scope", "diagnosticData", "$mdDialog", "$document", "$window", "ENV", "InvitationService", "ExerciseTypeEnum", "ETutoringViewsConst", "$stateParams", "$location", "ETutoringService", function ($scope, diagnosticData, $mdDialog, $document, $window, ENV, InvitationService,
                  ExerciseTypeEnum, ETutoringViewsConst, $stateParams, $location, ETutoringService) {
            'ngInject';

            var self = this;
            var bodyElement;
            var SCRIPT_SRC = 'https://calendly.com/assets/external/widget.js';

            self.teachers = null;
            $scope.diagnosticData = diagnosticData;
            $scope.activeViewObj = {
                view: +$stateParams.viewId || ETutoringViewsConst.LESSON
            };
            if (angular.isDefined($stateParams.viewId)) {
                $location.search('viewId', null);
            }

            $scope.hasTeacher = false;

            $scope.appName = ETutoringService.getAppName();

            self.showContactUs = function () {
                bodyElement = $document.find('body').eq(0);

                $mdDialog.show({
                    controller: 'ETutoringContactUsController',
                    controllerAs: 'vm',
                    templateUrl: 'components/eTutoring/components/eTutoringContactUs/eTutoringContactUs.template.html',
                    clickOutsideToClose: false,
                    onComplete: function (scope) {
                        var script = $window.document.createElement('script');
                        script.type = 'text/javascript';
                        script.onload = function () {
                            scope.vm.showSpinner = false;
                        };
                        script.src = SCRIPT_SRC;
                        bodyElement.append(script);
                    },
                    onRemoving: function () {
                        var calendlyScript = $window.document.querySelector('script[src="' + SCRIPT_SRC + '"]');
                        var calendlyScriptElement = angular.element(calendlyScript);
                        calendlyScriptElement.remove();
                    },
                    escapeToClose: false
                });
            };

            self.onModuleChange = function (newModule) {
                if (angular.isUndefined(newModule) || angular.equals(newModule, {})) {
                    self.currentModule = undefined;
                    self.showLoading = false;
                    return;
                }
                if (angular.isDefined(newModule) && !newModule) {
                    self.showLoading = true;
                    return;
                }
                self.currentModule = newModule;
                self.showLoading = false;

                if (self.currentModule && angular.isArray(self.currentModule.exercises)) {
                    var countCompleted = 0;
                    self.currentModule.enableLessonSummaryEx = false;
                    angular.forEach(self.currentModule.exercises, function (exercise) {
                        var exR = self.currentModule.exerciseResults;
                        if (exercise.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum ||
                            exercise.isLessonSummary ||
                            (exR && exR[exercise.exerciseTypeId] &&
                            exR[exercise.exerciseTypeId][exercise.exerciseId] &&
                            exR[exercise.exerciseTypeId][exercise.exerciseId].isComplete)) {
                            countCompleted++;
                        }
                        self.currentModule.enableLessonSummaryEx = countCompleted === self.currentModule.exercises.length;
                    });


                    self.currentModule.exercises = groupBy(self.currentModule.exercises, 'order');
                    angular.forEach(self.currentModule.exercises, function (exercise) {
                        exercise.sort(function compareLessonSummary(a, b) {
                            if (a.hasOwnProperty('isLessonSummary') && !b.hasOwnProperty('isLessonSummary')) {
                                return 1;
                            }
                            if (!a.hasOwnProperty('isLessonSummary') && b.hasOwnProperty('isLessonSummary')) {
                                return -1;
                            }
                            return 0;
                        });
                    });
                }
            };

            function hasTeacher(teachers) {
                if (angular.isUndefined(teachers)) {
                    return false;
                }
                var teacherskeys = Object.keys(teachers);
                for (var i = 0; i < teacherskeys.length; i++) {
                    if (teachers[teacherskeys[i]].senderEmail !== ENV.supportEmail && teachers[teacherskeys[i]].zinkerzTeacher) {
                        return true;
                    }
                }
                return false;
            }

            function myTeachersCB(teachers) {
                self.teachers = teachers;
                $scope.hasTeacher = hasTeacher(self.teachers);
            }

            function groupBy(arr, property) {
                return arr.reduce(function (memo, x) {
                    if (!memo[x[property]]) {
                        memo[x[property]] = [];
                    }
                    memo[x[property]].push(x);
                    return memo;
                }, {});
            }

            $scope.$on('$destroy', function () {
                InvitationService.offListenerCB(InvitationService.listeners.USER_TEACHERS, myTeachersCB);
            });

            InvitationService.registerListenerCB(InvitationService.listeners.USER_TEACHERS, myTeachersCB);

        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringWorkoutController',
        ["exerciseData", function (exerciseData) {
            'ngInject';
            this.completeExerciseDetails = {
                exerciseId: exerciseData.exerciseId,
                exerciseTypeId: exerciseData.exerciseTypeId,
                exerciseParentId: exerciseData.exerciseParentId,
                exerciseParentTypeId: exerciseData.exerciseParentTypeId,
                moduleResultGuid: exerciseData.moduleResultGuid,
                assignContentType: exerciseData.assignContentType,
                examId: exerciseData.examId
            };

            this.completeExerciseSettings = {
                exitAction: exerciseData.exitAction
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('etutoringActionBar',
            ["InvitationService", "PresenceService", "$timeout", "ScreenSharingSrv", "TeacherContextSrv", "$log", "$q", "CallsEventsSrv", "CallsStatusEnum", "UserScreenSharingStateEnum", "UserProfileService", "ENV", function (InvitationService, PresenceService, $timeout, ScreenSharingSrv, TeacherContextSrv, $log,
                      $q, CallsEventsSrv, CallsStatusEnum, UserScreenSharingStateEnum, UserProfileService, ENV) {
                'ngInject';
                return {
                    templateUrl: 'components/eTutoring/components/etutoringActionBar/etutoringActionBar.template.html',
                    restrict: 'E',
                    scope: {},
                    link: function (scope) {
                        scope.expandIcon = 'expand_more';
                        scope.userStatus = PresenceService.userStatus;
                        scope.callBtnModel = {};
                        scope.callStatus = 0;
                        scope.screenShareStatus = 0;
                        scope.lockTeacherSelection = false;

                        scope.changeSelectIcon = function () {
                            scope.expandIcon = 'expand_less';
                        };

                        scope.selectTeacher = function (teacher) {
                            if (teacher) {
                                TeacherContextSrv.setCurrentUid(teacher.senderUid);
                                scope.currentTeacher = teacher;
                                setBtnModelForCurrentTeacher(teacher);
                                $log.debug('teacher uid: ', teacher.senderUid);
                            } else {
                                TeacherContextSrv.setCurrentUid('');
                                $log.debug('teacher uid is not defined: ', teacher);
                            }
                        };

                        scope.$watchCollection('myTeachers', function (newVal) {
                            if (angular.isUndefined(newVal)) {
                                return;
                            }
                            if (!angular.equals(scope.myTeachers, {})) {
                                var teachersKeys = Object.keys(scope.myTeachers);
                                var currentTeacherId = TeacherContextSrv.getCurrUid();
                                var foundTeacher = false;

                                if (angular.isDefined(currentTeacherId) && currentTeacherId !== null) {
                                    angular.forEach(teachersKeys, function (key) {
                                        if (scope.myTeachers[key].senderUid === currentTeacherId) {
                                            foundTeacher = true;
                                            scope.selectTeacher(scope.myTeachers[key]);
                                        }
                                    });
                                }
                                if (!foundTeacher) {
                                    angular.forEach(teachersKeys, function (key) {
                                        if (scope.myTeachers[key].senderEmail !== ENV.supportEmail) {
                                            scope.selectTeacher(scope.myTeachers[key]);
                                        }
                                    });
                                }
                                startTrackTeachersPresence();
                            }
                        });

                        scope.$on('$destroy', function () {
                            stopTrackTeachersPresence();
                        });

                        scope.$on('$mdMenuClose', function () {
                            scope.expandIcon = 'expand_more';
                        });

                        function startTrackTeachersPresence() {
                            angular.forEach(scope.myTeachers, function (teacher) {
                                PresenceService.startTrackUserPresence(teacher.senderUid, trackUserPresenceCB.bind(null, teacher.senderUid));
                            });
                        }

                        function stopTrackTeachersPresence() {
                            angular.forEach(scope.myTeachers, function (teacher) {
                                PresenceService.stopTrackUserPresence(teacher.senderUid);
                            });
                        }

                        function trackUserPresenceCB(userId, newStatus) {
                            $timeout(function () {
                                angular.forEach(scope.myTeachers, function (teacher) {
                                    if (teacher.senderUid === userId) {
                                        teacher.presence = newStatus;
                                    }
                                    setBtnModelForCurrentTeacher(teacher);
                                });
                            });
                        }

                        function setBtnModelForCurrentTeacher(teacher) {
                            if (scope.currentTeacher.senderUid === teacher.senderUid) {
                                scope.callBtnModel = {
                                    isOffline: teacher.presence === PresenceService.userStatus.OFFLINE,
                                    receiverId: teacher.senderUid
                                };
                            }
                        }

                        function actionBarMyTeachersCB(teachers) {
                            scope.myTeachers = teachers;
                        }

                        scope.showTeacherScreen = function () {
                            if (scope.currentTeacher) {
                                var teacherData = {
                                    isTeacher: true,
                                    uid: scope.currentTeacher.senderUid
                                };
                                ScreenSharingSrv.viewOtherUserScreen(teacherData);
                            }
                        };

                        scope.shareMyScreen = function () {
                            if (scope.currentTeacher) {
                                var teacherData = {
                                    isTeacher: true,
                                    uid: scope.currentTeacher.senderUid
                                };
                                ScreenSharingSrv.shareMyScreen(teacherData);
                            }
                        };

                        function switchTeacherWhenInActiveCallOrScreenShare(evtName, callsData) {
                            var getIncomingDataProm;
                            var incomingTeacherUid;
                            if (scope.callStatus + scope.screenShareStatus === 0) {
                                return;
                            }
                            UserProfileService.getCurrUserId().then(function (userId) {
                                if (evtName === 'calls') {
                                    if (callsData.callerId === userId) {
                                        incomingTeacherUid = callsData.receiverId;
                                    } else if (callsData.receiverId === userId) {
                                        incomingTeacherUid = callsData.callerId;
                                    }
                                    getIncomingDataProm = $q.when(incomingTeacherUid);
                                } else if (evtName === 'screen') {
                                    getIncomingDataProm = ScreenSharingSrv.getActiveScreenSharingData()
                                        .then(function (activeScreenSharingData) {
                                            if (angular.isObject(activeScreenSharingData) && activeScreenSharingData !== null) {
                                                if (activeScreenSharingData.viewerId === userId) {
                                                    incomingTeacherUid = activeScreenSharingData.sharerId;
                                                } else if (activeScreenSharingData.sharerId === userId) {
                                                    incomingTeacherUid = activeScreenSharingData.viewerId;
                                                }
                                            }
                                        });
                                }
                                getIncomingDataProm.then(function () {
                                    var teacherObj = false;
                                    for (var prop in scope.myTeachers) {
                                        if (scope.myTeachers.hasOwnProperty(prop)) {
                                            var curTeacher = scope.myTeachers[prop];
                                            if (curTeacher.senderUid === incomingTeacherUid) {
                                                teacherObj = curTeacher;
                                                break;
                                            }
                                        }
                                    }
                                    if (teacherObj) {
                                        scope.selectTeacher(teacherObj);
                                    }
                                });
                            });
                        }

                        function updateLockTeacher() {
                            scope.lockTeacherSelection = (scope.callStatus + scope.screenShareStatus);
                        }

                        function listenToCallsStatus(callsData) {
                            scope.callStatus = 0;
                            if (callsData) {
                                if (callsData.status === CallsStatusEnum.ACTIVE_CALL.enum) {
                                    scope.callStatus = 1;
                                }
                                switchTeacherWhenInActiveCallOrScreenShare('calls', callsData);
                                updateLockTeacher();
                            }
                        }

                        function listenToScreenShareStatus(screenSharingData) {
                            scope.screenShareStatus = 0;
                            if (screenSharingData) {
                                if (screenSharingData !== UserScreenSharingStateEnum.NONE.enum) {
                                    scope.screenShareStatus = 1;
                                }
                                switchTeacherWhenInActiveCallOrScreenShare('screen');
                                updateLockTeacher();
                            }
                        }

                        ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(listenToScreenShareStatus);

                        CallsEventsSrv.registerToCurrUserCallStateChanges(listenToCallsStatus);

                        InvitationService.registerListenerCB(InvitationService.listeners.USER_TEACHERS, actionBarMyTeachersCB);
                    }
                };
            }]);
})(angular);



(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringContactUsController',
        ["$mdDialog", "UserProfileService", "MailSenderService", "$timeout", "ENV", "$log", function ($mdDialog, UserProfileService, MailSenderService, $timeout, ENV, $log) {
            'ngInject';
            this.formData = {};
            this.showSpinner = true;
            UserProfileService.getProfile().then(function(profile){
                if (angular.isDefined(profile)) {
                    this.formData.name = profile.nickname || undefined;
                    this.formData.email = profile.email || undefined;
                }
            }.bind(this));

            this.sendContactUs = function(authform){
                this.showError = false;

                if (!authform.$invalid) {
                    this.startLoader = true;
                    var appName = ENV.firebaseAppScopeName;
                    var emailsArr = ['support@zinkerz.com'];
                    var message = '' +
                        'A new student contacted you through the live lessons tab' +
                        'App Name: ' + appName + '<br/>' +
                        'Email: ' + this.formData.email;
                    var mailRequest = {
                        subject: 'contact us',
                        message: message,
                        emails: emailsArr,
                        appName: appName,
                        templateKey: 'zoeContactUs'
                    };

                    MailSenderService.postMailRequest(mailRequest).then(function(){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showSuccess = true;
                        });
                    }.bind(this)).catch(function(mailError){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showError = true;
                            $log.error('ETutoringContactUsController:sendContactUs:: error send mail', mailError);
                        });
                    }.bind(this));
                }
            };


            this.closeDialog = function () {
                $mdDialog.cancel();
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('etutoringStudentNavigationPane', ["UserAssignModuleService", "ExerciseStatusEnum", "$log", "AuthService", "ETutoringViewsConst", "DueDateSrv", "SubjectEnum", "$stateParams", "$location", "StudentContextSrv", "AssignContentEnum", "UtilitySrv", "$translate", function(UserAssignModuleService, ExerciseStatusEnum, $log, AuthService, ETutoringViewsConst, DueDateSrv,
                                           SubjectEnum, $stateParams, $location, StudentContextSrv, AssignContentEnum, UtilitySrv, $translate) {
            'ngInject';

            return {
                scope: {
                    activeViewObj: '='
                },
                restrict: 'E',
                require: 'ngModel',
                templateUrl: 'components/eTutoring/components/etutoringStudentNavigationPane/etutoringStudentNavigationPane.template.html',
                link: function (scope, element, attrs, ngModel) {
                    scope.showLoading = true;
                    scope.exerciseStatusEnum = ExerciseStatusEnum;
                    scope.subjectsMap = {};
                    scope.overlayTextObj = {};

                    var noLessonsTitle = 'E_TUTORING_NAVIGATION_PANE.NO_LESSONS_ASSIGNED';
                    var noPracticesTitle = 'E_TUTORING_NAVIGATION_PANE.NO_HW_ASSIGNED';

                    $translate([noLessonsTitle, noPracticesTitle]).then(function (res) {
                        scope.overlayTextObj[ETutoringViewsConst.LESSON] = res[noLessonsTitle];
                        scope.overlayTextObj[ETutoringViewsConst.PRACTICE] = res[noPracticesTitle];
                    });

                    var authData = AuthService.getAuth();
                    if (authData) {
                        scope.userId = authData.uid;
                        StudentContextSrv.setCurrentUid(scope.userId);

                        scope.ETutoringViewsConst = ETutoringViewsConst;
                        scope.dueDateUtility = DueDateSrv;

                        UserAssignModuleService.registerExternalOnValueCB(scope.userId, AssignContentEnum.LESSON.enum, getAssignModulesCB, getAssignModulesCB);
                        UserAssignModuleService.registerExternalOnValueCB(scope.userId, AssignContentEnum.PRACTICE.enum, getAssignHomeworkCB, getAssignHomeworkCB);
                    } else {
                        $log.debug('etutoringStudentNavigationPaneDirective:: no user id');
                    }

                    angular.forEach(SubjectEnum.getEnumArr(), function (subject) {
                        scope.subjectsMap[subject.enum] = subject;
                    });

                    scope.updateModel = function (module) {
                        scope.currentModule = module;
                        ngModel.$setViewValue(module);
                    };

                    scope.changeView = function (view) {
                        scope.activeViewObj.view = view;
                        switch (view) {
                            case ETutoringViewsConst.LESSON:
                                if(!scope.assignedModules){
                                    return;
                                }
                                scope.assignContentArr = scope.assignedModules;
                                scope.updateModel(scope.assignContentArr[0]);
                                break;
                            case ETutoringViewsConst.PRACTICE:
                                if(!scope.assignedHomework){
                                    return;
                                }
                                scope.assignContentArr = scope.assignedHomework;
                                scope.updateModel(scope.assignContentArr[0]);
                                break;
                            default :
                                break;
                        }
                    };

                    scope.$on('$destroy', function () {
                        if (scope.userId) {
                            UserAssignModuleService.offExternalOnValue(scope.userId, getAssignModulesCB, getAssignModulesCB);
                            UserAssignModuleService.offExternalOnValue(scope.userId, getAssignHomeworkCB, getAssignHomeworkCB);
                        }
                    });

                    function getAssignModulesCB(userAssignModules) {
                        $log.debug('navigationPaneDirective::modules,' + userAssignModules);
                        scope.showLoading = true;
                        scope.assignedModules = UtilitySrv.object.convertToArray(userAssignModules);
                        scope.assignedModules.sort(UtilitySrv.array.sortByField('assignDate'));
                        scope.showLoading = false;

                        if (scope.activeViewObj.view === ETutoringViewsConst.LESSON) {
                            scope.assignContentArr = scope.assignedModules;
                            setSelectedModule();
                        }
                    }

                    function getAssignHomeworkCB(userAssignHomework) {
                        $log.debug('navigationPaneDirective::hw,' + userAssignHomework);
                        scope.showLoading = true;
                        scope.assignedHomework = UtilitySrv.object.convertToArray(userAssignHomework);
                        scope.assignedHomework.sort(UtilitySrv.array.sortByField('assignDate'));
                        scope.showLoading = false;

                        if (scope.activeViewObj.view === ETutoringViewsConst.PRACTICE) {
                            scope.assignContentArr = scope.assignedHomework;
                            setSelectedModule();
                        }
                    }

                    function setSelectedModule() {
                        var selectedAssignModel = {};

                        if (angular.isDefined($stateParams.moduleId)) {
                            var paramModuleId = scope.activeViewObj.view === ETutoringViewsConst.PRACTICE ? $stateParams.moduleId : +$stateParams.moduleId;
                            angular.forEach(scope.assignContentArr, function (module) {
                                if (module.moduleId === paramModuleId) {
                                    selectedAssignModel = module;
                                    $location.search('moduleId', null);
                                }
                            });
                        } else if (angular.equals(scope.assignContentArr, [])) {
                            selectedAssignModel = {};
                        } else if (!scope.currentModule || angular.equals(scope.currentModule, {})) {
                            selectedAssignModel = scope.assignContentArr[0];
                        } else {
                            angular.forEach(scope.assignContentArr, function (module) {
                                if (module.moduleId === scope.currentModule.moduleId) {
                                    selectedAssignModel = module;
                                }
                            });
                        }
                        scope.updateModel(selectedAssignModel);
                    }
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('moduleExerciseItem', ["$state", "ExerciseStatusEnum", "ExerciseTypeEnum", "SubjectEnum", "ETutoringService", "ETutoringViewsConst", function($state, ExerciseStatusEnum, ExerciseTypeEnum, SubjectEnum, ETutoringService, ETutoringViewsConst) {
            'ngInject';
            return {
                scope: {
                    exercise: '=',
                    module: '=',
                    eTutoringView: '&',
                    assignContentType: '&',
                    activeViewObj: '='
                },
                restrict: 'E',
                templateUrl: 'components/eTutoring/components/moduleExerciseItem/moduleExerciseItem.template.html',
                link: function (scope) {
                    scope.exerciseStatusEnum = ExerciseStatusEnum;
                    scope.exerciseTypeEnum = ExerciseTypeEnum;
                    scope.subjectEnum = SubjectEnum;
                    scope.ETutoringViewsConst = ETutoringViewsConst;

                    if (scope.activeViewObj.view === ETutoringViewsConst.PRACTICE) {
                        scope.exerciseParentId = scope.module.guid;
                        ETutoringService.getSubjectDataByExercise(scope.exercise).then(function (subjectData) {
                            scope.subjectIcon = subjectData.iconName;
                            scope.svgWrapperClassName = subjectData.className;
                            scope.subjectId = subjectData.subjectId;
                        });
                    }

                    scope.exerciseTypeId = scope.exercise.exerciseTypeId;
                    scope.exerciseId = scope.exercise.exerciseId;
                    scope.itemsCount = scope.exercise.itemsCount;

                    scope.go = function (module) {
                        $state.go('app.eTutoringWorkout', {
                            exerciseId: scope.exercise.exerciseId,
                            exerciseTypeId: scope.exercise.exerciseTypeId,
                            moduleId: module.moduleId,
                            moduleResultGuid: module.guid,
                            exerciseParentId: scope.exercise.exerciseParentId,
                            assignContentType: scope.assignContentType(),
                            examId: scope.exercise.examId,
                            viewId: scope.activeViewObj.view
                        });
                    };
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('moduleExercisePane', ["SubjectEnum", "ExerciseTypeEnum", "AssignContentEnum", "ETutoringViewsConst", "$log", "LiveSessionSubjectEnum", "DueDateSrv", "ExerciseStatusEnum", function(SubjectEnum, ExerciseTypeEnum, AssignContentEnum, ETutoringViewsConst, $log,
                                           LiveSessionSubjectEnum, DueDateSrv, ExerciseStatusEnum) {
            'ngInject';
            return {
                scope: {
                    showLoading: '=',
                    module: '=',
                    activeViewObj: '='
                },
                restrict: 'E',
                template: '<div ng-include="templateName" class="ng-include-module-exercise-pane"> </div>',
                link: function (scope) {
                    var templatesPath = 'components/eTutoring/components/moduleExercisePane/';
                    scope.subjectEnumMap = SubjectEnum.getEnumMap();
                    scope.subjectEnum = SubjectEnum;
                    scope.exerciseTypeEnum = ExerciseTypeEnum;
                    scope.exerciseStatusEnum = ExerciseStatusEnum;
                    scope.assignContentEnum = AssignContentEnum;
                    scope.eTutoringViewsConst = ETutoringViewsConst;
                    scope.LiveSessionSubjectEnum = LiveSessionSubjectEnum;
                    scope.dueDateUtility = DueDateSrv;
                    scope.hasModule = false;

                    if (scope.activeViewObj.view) {
                        _setTemplateNameByView(scope.activeViewObj.view);
                    }

                    function _setTemplateNameByView(view) {
                        var templateName;
                        switch (view) {
                            case AssignContentEnum.LESSON.enum:
                                templateName = 'lessonsPane.template.html';
                                scope.svgIcon = angular.isDefined(scope.module) ? SubjectEnum.getValByEnum(scope.module.subjectId) + '-icon' : '';
                                break;
                            case AssignContentEnum.PRACTICE.enum:
                                templateName = 'homeworkPane.template.html';
                                scope.svgIcon = angular.isDefined(scope.module) ? LiveSessionSubjectEnum.getValByEnum(scope.module.topicId) + '-topic-icon' : '';
                                break;
                            default:
                                break;
                        }
                        scope.hasModule = angular.isDefined(scope.module) && (!angular.equals(scope.module, {}));
                        scope.templateName = templatesPath + templateName;
                    }

                    scope.$watch('activeViewObj.view', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            _setTemplateNameByView(newVal);
                        }
                    });

                    scope.$watch('module', function (newVal, oldVal) {
                        $log.debug('moduleExercisePaneDirective', newVal);
                        if (newVal !== oldVal) {
                            _setTemplateNameByView(scope.activeViewObj.view);
                        }
                    });
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .provider('ETutoringService', function () {

            var getSubjectDataByExerciseWrapper, appName;

            this.setGetSubjectDataByExercise = function (fn) {
                getSubjectDataByExerciseWrapper = fn;
            };

            this.setAppName = function(_appName){
                appName = _appName;
            };

            this.$get = ["$injector", "$log", "$q", function ($injector, $log, $q) {
                var ETutoringService = {};

                ETutoringService.getSubjectDataByExercise = function (exercise) {
                    if(angular.isUndefined(getSubjectDataByExerciseWrapper)){
                        $log.error('ETutoringService: getSubjectDataByExercise was not set up in config phase!');
                        return $q.when();
                    } else {
                        var getSubjectDataByExercise = $injector.invoke(getSubjectDataByExerciseWrapper);
                        return getSubjectDataByExercise(exercise);
                    }
                };

                ETutoringService.getAppName = function(){
                    return appName;
                };

                return ETutoringService;
            }];
        });
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .service('LectureSrv', ["StorageRevSrv", function (StorageRevSrv) {
            'ngInject';

            function _getContentFromStorage(data) {
                return StorageRevSrv.getContent(data);
            }

            this.getLecture = function getLecture(_exerciseId) {
                return _getContentFromStorage({
                    exerciseId: _exerciseId, exerciseType: 'lecture'
                });
            };
        }]);
})(angular);

angular.module('znk.infra.eTutoring').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/eTutoring/directives/etutoringActionBar/etutoringActionBar.template.html",
    "<div class=\"e-tutor-bar base-border-radius base-box-shadow\" translate-namespace=\"E_TUTORING_ACTION_BAR\">\n" +
    "    <div class=\"teacher-select-wrap\" ng-if=\"myTeachers\">\n" +
    "        <div class=\"online-indicator-wrap\">\n" +
    "            <div class=\"online-indicator\"\n" +
    "                 ng-class=\"{'offline': currentTeacher.presence === userStatus.OFFLINE,\n" +
    "                                'online': currentTeacher.presence === userStatus.ONLINE,\n" +
    "                                'idle': currentTeacher.presence === userStatus.IDLE}\"></div>\n" +
    "        </div>\n" +
    "        <md-menu md-offset=\"-49 70\" class=\"teachers-menu\">\n" +
    "            <md-button\n" +
    "                aria-label=\"{{currentTeacher.senderName}}\"\n" +
    "                class=\"md-icon-button teacher-open-modal-btn\"\n" +
    "                ng-click=\"$mdOpenMenu($event);changeSelectIcon();\"\n" +
    "                ng-disabled=\"lockTeacherSelection\">\n" +
    "                <div class=\"teacher-details\">\n" +
    "                    <div class=\"teacher-name\">{{currentTeacher.senderName}}</div>\n" +
    "                    <div class=\"teacher-subject\">{{currentTeacher.zinkerzTeacherSubject}}</div>\n" +
    "                </div>\n" +
    "                <md-icon class=\"material-icons expand-arrow\">{{expandIcon}}</md-icon>\n" +
    "            </md-button>\n" +
    "            <md-menu-content class=\"md-menu-content-teacher-select\">\n" +
    "                <md-list>\n" +
    "                    <md-list-item class=\"teacher-list-item\" ng-repeat=\"teacher in myTeachers\"\n" +
    "                                  ng-click=\"selectTeacher(teacher)\">\n" +
    "                        <div class=\"online-indicator-wrap\">\n" +
    "                            <div class=\"online-indicator\"\n" +
    "                                 ng-class=\"{\n" +
    "                                    'offline': teacher.presence === userStatus.OFFLINE,\n" +
    "                                    'online': teacher.presence === userStatus.ONLINE,\n" +
    "                                    'idle': teacher.presence === userStatus.IDLE\n" +
    "                                }\"></div>\n" +
    "                        </div>\n" +
    "                        <div class=\"teacher-details\">\n" +
    "                            <div class=\"teacher-name\">{{::teacher.senderName}}</div>\n" +
    "                            <div class=\"teacher-subject\">{{::teacher.zinkerzTeacherSubject}}</div>\n" +
    "                        </div>\n" +
    "                    </md-list-item>\n" +
    "                </md-list>\n" +
    "            </md-menu-content>\n" +
    "        </md-menu>\n" +
    "    </div>\n" +
    "    <div class=\"share-btn-wrap\">\n" +
    "        <md-button class=\"primary share-btn\"\n" +
    "                   aria-label=\"{{'E_TUTORING_ACTION_BAR.SHOW_TEACHER_SCREEN' | translate}}\"\n" +
    "                   ng-click=\"showTeacherScreen()\"\n" +
    "                   ng-disabled=\"currentTeacher.presence === userStatus.OFFLINE\">\n" +
    "            <span translate=\".SHOW_TEACHER_SCREEN\"></span>\n" +
    "        </md-button>\n" +
    "        <md-button class=\"warn share-btn\"\n" +
    "                   aria-label=\"{{'E_TUTORING_ACTION_BAR.SHARE_MY_SCREEN' | translate}}\"\n" +
    "                   ng-click=\"shareMyScreen()\"\n" +
    "                   ng-disabled=\"currentTeacher.presence === userStatus.OFFLINE\">\n" +
    "            <span translate=\".SHARE_MY_SCREEN\"></span>\n" +
    "        </md-button>\n" +
    "        <div class=\"separator\"></div>\n" +
    "        <call-btn\n" +
    "            ng-model=\"callBtnModel\">\n" +
    "        </call-btn>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/eTutoring/directives/eTutoringContactUs/eTutoringContactUs.template.html",
    "<md-dialog ng-cloak class=\"e-tutoring-contact-us-modal\" translate-namespace=\"E_TUTORING_CONTACT_US\">\n" +
    "    <md-toolbar>\n" +
    "        <div class=\"close-popup-wrap\" ng-click=\"vm.closeDialog()\">\n" +
    "            <svg-icon name=\"etutoring-close-icon\"></svg-icon>\n" +
    "        </div>\n" +
    "    </md-toolbar>\n" +
    "    <md-dialog-content ng-switch=\"!!vm.showSuccess\">\n" +
    "\n" +
    "        <md-progress-circular ng-if=\"vm.showSpinner\" class=\"md-accent spinner\" md-mode=\"indeterminate\" md-diameter=\"70\"></md-progress-circular>\n" +
    "        <div class=\"calendly-inline-widget\" data-url=\"https://calendly.com/zinkerz-zoe/consultation-with-zinkerz\"></div>\n" +
    "    </md-dialog-content>\n" +
    "    <div class=\"top-icon-wrap\">\n" +
    "        <div class=\"top-icon\">\n" +
    "            <div class=\"round-icon-wrap\">\n" +
    "                <svg-icon name=\"etutoring-calendar-icon\"></svg-icon>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</md-dialog>\n" +
    "");
  $templateCache.put("components/eTutoring/directives/etutoringStudentNavigationPane/etutoringStudentNavigationPane.template.html",
    "<div class=\"etutoring-student-navigation-pane\"\n" +
    "     ng-class=\"{'no-lessons-assigned': !assignContentArr.length, 'lessons-pane': activeViewObj.view === ETutoringViewsConst.LESSON, 'practice-pane': activeViewObj.view === ETutoringViewsConst.PRACTICE}\"\n" +
    "     translate-namespace=\"E_TUTORING_NAVIGATION_PANE\">\n" +
    "    <div class=\"navigation-header\">\n" +
    "        <div class=\"lessons-button\"\n" +
    "             ng-click=\"changeView(ETutoringViewsConst.LESSON)\"\n" +
    "             ng-class=\"{'inactive': activeViewObj.view === ETutoringViewsConst.PRACTICE}\">\n" +
    "            <div class=\"title\" translate=\".LESSONS\"></div>\n" +
    "        </div>\n" +
    "        <div class=\"practice-button\"\n" +
    "             ng-click=\"changeView(ETutoringViewsConst.PRACTICE)\"\n" +
    "             ng-class=\"{'inactive': activeViewObj.view === ETutoringViewsConst.LESSON}\">\n" +
    "            <div class=\"title\" translate=\".PRACTICE\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"search-wrap\">\n" +
    "            <div class=\"znk-input-group\">\n" +
    "                <input type=\"search\"\n" +
    "                       ng-model=\"vm.searchTerm\"\n" +
    "                       placeholder=\"{{'E_TUTORING_NAVIGATION_PANE.SEARCH' | translate}}\">\n" +
    "                <span class=\"clear-search\"\n" +
    "                      ng-if=\"vm.searchTerm\"\n" +
    "                      ng-click=\"vm.searchTerm = ''\">\n" +
    "                <svg-icon class=\"close-icon\" name=\"app-close-popup\"></svg-icon>\n" +
    "            </span>\n" +
    "            <svg-icon name=\"search-icon\" class=\"search-icon\"></svg-icon>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"modules-wrap\" ng-switch=\"showLoading\">\n" +
    "        <div class=\"modules-container\" ng-switch-when=\"false\" ng-switch=\"activeViewObj.view\">\n" +
    "            <div class=\"module-item\"\n" +
    "                 ng-repeat=\"assignContent in assignContentArr | filter: { name: vm.searchTerm } track by $index\"\n" +
    "                 title=\"{{assignContent.name}}\"\n" +
    "                 aria-label=\"{{assignContent.name}}\"\n" +
    "                 ng-click=\"updateModel(assignContent);\"\n" +
    "                 ng-class=\"{ 'active':  assignContent.moduleId===currentModule.moduleId,\n" +
    "                            'completed': assignContent.moduleSummary.overAll.status===exerciseStatusEnum.COMPLETED.enum,\n" +
    "                            'pass-due-date': assignContent.moduleSummary.overAll.status !== exerciseStatusEnum.COMPLETED.enum &&\n" +
    "                            activeViewObj.view === ETutoringViewsConst.PRACTICE &&\n" +
    "                             dueDateUtility.isDueDatePass(assignContent.assignDate + dueDateUtility.SEVEN_DAYS_IN_MS).passDue}\">\n" +
    "\n" +
    "                <div class=\"icon-wrapper\" >\n" +
    "                    <div ng-if=\"activeViewObj.view===ETutoringViewsConst.LESSON\" class=\"flex-center\" >\n" +
    "                        <svg-icon\n" +
    "                            subject-id-to-attr-drv=\"assignContent.subjectId\"\n" +
    "                            context-attr=\"name\"\n" +
    "                            suffix=\"icon\">\n" +
    "                        </svg-icon>\n" +
    "                    </div>\n" +
    "                    <div ng-if=\"activeViewObj.view===ETutoringViewsConst.PRACTICE\" class=\"flex-center homework-practice-icon\">\n" +
    "                        <svg-icon name=\"homework-icon\"></svg-icon>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"module-details\">\n" +
    "                    <div class=\"module-name\">{{assignContent.name | cutString: 25}}</div>\n" +
    "                    <div class=\"subject-name\" translate=\"SUBJECTS.{{assignContent.subjectId}}\"></div>\n" +
    "                    <span class=\"assigned-date\">{{assignContent.assignDate | date : 'MMM d'}}</span>\n" +
    "                    <span class=\"due-date\"\n" +
    "                          translate=\"{{dueDateUtility.isDueDatePass(assignContent.assignDate + dueDateUtility.SEVEN_DAYS_IN_MS).passDue ? '.OVERDUE' : '.DUE_IN'}}\"\n" +
    "                          translate-values=\"{ days: {{'dueDateUtility.isDueDatePass(assignContent.assignDate + dueDateUtility.SEVEN_DAYS_IN_MS).dateDiff'}} }\"\n" +
    "                          ng-if=\"activeViewObj.view === ETutoringViewsConst.PRACTICE\">\n" +
    "\n" +
    "                    </span>\n" +
    "                </div>\n" +
    "                <div class=\"module-status\">\n" +
    "                    <div class=\"flex-center\" ng-switch=\"assignContent.moduleSummary.overAll.status\">\n" +
    "                        <div ng-switch-when=\"0\" class=\"pill\" translate=\".NEW\"></div>\n" +
    "                        <div ng-switch-when=\"1\" class=\"in-progress\" translate=\".IN_PROGRESS\"></div>\n" +
    "                        <svg-icon ng-switch-when=\"2\" name=\"v-icon\"></svg-icon>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"navigation-overlay\" ng-switch-when=\"false\" ng-if=\"!assignContentArr.length\">\n" +
    "            <span>{{ overlayTextObj[activeViewObj.view] }}</span>\n" +
    "        </div>\n" +
    "        <div class=\"navigation-overlay\" ng-switch-when=\"true\">\n" +
    "            <span translate=\".PROCESSING_OVERLAY\"></span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/eTutoring/directives/moduleExerciseItem/moduleExerciseItem.template.html",
    "<button translate-namespace=\"MODULE_EXERCISE_ITEM_DRV\"\n" +
    "     class=\"module-part\"\n" +
    "     ng-click=\"go(module, exercise)\"\n" +
    "     ng-disabled=\"exercise.isLessonSummary && !module.enableLessonSummaryEx\"\n" +
    "     ng-class=\"{'is-lecture': (exerciseTypeId===exerciseTypeEnum.LECTURE.enum) ||\n" +
    "                (!module.moduleSummary[exerciseTypeId][exerciseId]),\n" +
    "                'in-progress': module.moduleSummary[exerciseTypeId][exerciseId].status===exerciseStatusEnum.ACTIVE.enum,\n" +
    "                'completed': module.moduleSummary[exerciseTypeId][exerciseId].status===exerciseStatusEnum.COMPLETED.enum}\">\n" +
    "\n" +
    "    <div class=\"icon-wrap\"  >\n" +
    "            <svg-icon name=\"etutoring-exercise-icon\" class=\"svg-icon-wrap\"\n" +
    "                      ng-if=\"exerciseTypeId!==exerciseTypeEnum.LECTURE.enum && activeViewObj.view === ETutoringViewsConst.LESSON\">\n" +
    "            </svg-icon>\n" +
    "            <svg-icon name=\"etutoring-slides-icon\" class=\"svg-icon-wrap\"\n" +
    "                      ng-if=\"exerciseTypeId===exerciseTypeEnum.LECTURE.enum &&  activeViewObj.view === ETutoringViewsConst.LESSON\"\">\n" +
    "            </svg-icon>\n" +
    "            <svg-icon name=\"{{subjectIcon}}\"\n" +
    "                      subject-id-to-attr-drv=\"subjectId\"\n" +
    "                      ng-class=\"svgWrapperClass\"\n" +
    "                      class=\"svg-icon-wrap\"\n" +
    "                      ng-if=\"eTutoringView() === ETutoringViewsConst.PRACTICE\">\n" +
    "            </svg-icon>\n" +
    "    </div>\n" +
    "    <div class=\"exercise-name-wrap\">\n" +
    "        <div class=\"exercise-name\">{{exercise.liveLessonName ? exercise.liveLessonName : exercise.name ?\n" +
    "            exercise.name : exercise.exerciseTypeId===exerciseTypeEnum.LECTURE.enum ?\n" +
    "            'MODULE_EXERCISE_ITEM_DRV.OVERVIEW' : 'MODULE_EXERCISE_ITEM_DRV.EXERCISE' | translate | cutString:40}}\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"children-count-wrap\">\n" +
    "        <div class=\"children-count\">\n" +
    "            <div class=\"count-content\">\n" +
    "                <span class=\"count\">{{itemsCount}}</span>\n" +
    "                <span translate=\".QUESTIONS\" ng-if=\"exerciseTypeId!==exerciseTypeEnum.LECTURE.enum\"></span>\n" +
    "                <span translate=\".SLIDES\" ng-if=\"exerciseTypeId===exerciseTypeEnum.LECTURE.enum\"></span>\n" +
    "            </div>\n" +
    "            <div class=\"tooltip\">\n" +
    "                <svg-icon name=\"locked-icon\" class=\"locked-icon tooltip\"\n" +
    "                          ng-if=\"exercise.isLessonSummary && !module.enableLessonSummaryEx\"\n" +
    "                          title=\"{{'MODULE_EXERCISE_ITEM_DRV.UNLOCK_EXERSICE' | translate}}\">\n" +
    "                </svg-icon>\n" +
    "                <!-- start tooltip -->\n" +
    "                <span>\n" +
    "		            <b></b>\n" +
    "		            {{'MODULE_EXERCISE_ITEM_DRV.UNLOCK_EXERSICE' | translate}}\n" +
    "	           </span>\n" +
    "                <!-- end tooltip -->\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"questions-progress\">\n" +
    "            <div class=\"total-question\">\n" +
    "                <span>{{itemsCount}}</span>\n" +
    "                <span translate=\".QUESTIONS\"></span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"progress-wrap\">\n" +
    "                <znk-progress-bar\n" +
    "                    show-progress-value=\"true\"\n" +
    "                    progress-value=\"{{module.exerciseResults[exerciseTypeId][exerciseId].totalAnsweredNum}}\"\n" +
    "                    progress-width=\"{{(module.exerciseResults[exerciseTypeId][exerciseId].totalAnsweredNum/itemsCount)*100}}\">\n" +
    "                </znk-progress-bar>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"completed-exercise-summary\" >\n" +
    "\n" +
    "            <div class=\"completed-questions-stat\">\n" +
    "                <div class=\"stat correct\">\n" +
    "                    {{module.exerciseResults[exerciseTypeId][exerciseId].correctAnswersNum}}\n" +
    "                </div>\n" +
    "                <div class=\"stat wrong\">\n" +
    "                    {{module.exerciseResults[exerciseTypeId][exerciseId].wrongAnswersNum}}\n" +
    "                </div>\n" +
    "                <div class=\"stat unanswered\">\n" +
    "                    {{module.exerciseResults[exerciseTypeId][exerciseId].skippedAnswersNum}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"completed-time\">\n" +
    "                {{(module.exerciseResults[exerciseTypeId][exerciseId].duration || 0) | formatTimeDuration: 'mm'}}\n" +
    "                <span translate=\".MIN\"></span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</button>\n" +
    "");
  $templateCache.put("components/eTutoring/directives/moduleExercisePane/homeworkPane.template.html",
    "<div class=\"lesson-container homework-container\" ng-switch=\"showLoading\" translate-namespace=\"MODULE_EXERCISE_PANE_DRV\">\n" +
    "    <div ng-switch-when=\"false\" ng-if=\"hasModule\" class=\"module-container\">\n" +
    "        <div class=\"assignment-title-wrapper\"\n" +
    "             ng-class=\"{'pass-due-date': dueDateUtility.isDueDatePass(module.assignDate + dueDateUtility.SEVEN_DAYS_IN_MS).passDue &&\n" +
    "                                         module.moduleSummary.overAll.status !== exerciseStatusEnum.COMPLETED.enum }\">\n" +
    "            <div class=\"overdue-assignment-title\"\n" +
    "                 translate-values=\"{numOfDays:  dueDateUtility.isDueDatePass(module.assignDate + dueDateUtility.SEVEN_DAYS_IN_MS).dateDiff}\"\n" +
    "                 translate=\".OVERDUE_ASSIGNMENT\">\n" +
    "            </div>\n" +
    "            <div class=\"module-name\">{{module.name}}</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"topic-icon\">\n" +
    "            <svg-icon name=\"{{svgIcon}}\"></svg-icon>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"topic-name\">{{LiveSessionSubjectEnum.getEnumMap()[module.topicId]}}</div>\n" +
    "        <div class=\"exercises-box base-border-radius\" ng-switch on=\"module.contentAssign\">\n" +
    "            <div ng-switch-when=\"false\" class=\"content-not-assigned\">\n" +
    "                <div translate=\".NOT_YET_ASSIGNED\"></div>\n" +
    "                <small translate=\".WILL_BE_ABLE_TO_VIEW_ONE_TEACHER_ASSIGNS\"></small>\n" +
    "            </div>\n" +
    "            <div ng-switch-when=\"true\" class=\"homework-exercises-container\">\n" +
    "                <div class=\"exercise-item-wrap\" ng-repeat=\"exercise in module.exercises\">\n" +
    "                    <div class=\"exercise-item\" ng-repeat=\"item in exercise\">\n" +
    "                        <module-exercise-item\n" +
    "                            e-tutoring-view=\"eTutoringViewsConst.PRACTICE\"\n" +
    "                            active-view-obj=\"activeViewObj\"\n" +
    "                            assign-content-type=\"assignContentEnum.PRACTICE.enum\"\n" +
    "                            module=\"module\"\n" +
    "                            exercise=\"item\">\n" +
    "                        </module-exercise-item>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"false\" ng-if=\"!hasModule\" class=\"wrapper-overlay\">\n" +
    "        <span translate=\".NO_HW_ASSIGNED\"></span>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"true\" class=\"wrapper-overlay\">\n" +
    "        <span translate=\".PROCESSING_OVERLAY\"></span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/eTutoring/directives/moduleExercisePane/lessonsPane.template.html",
    "<div class=\"lesson-container\" ng-switch=\"showLoading\" translate-namespace=\"MODULE_EXERCISE_PANE_DRV\">\n" +
    "    <div ng-switch-when=\"false\" ng-if=\"hasModule\" class=\"module-container\">\n" +
    "        <div class=\"module-name\">{{module.name}}</div>\n" +
    "        <div class=\"subject-icon\">\n" +
    "            <svg-icon name=\"{{svgIcon}}\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"subject-name\" translate=\"SUBJECTS.{{module.subjectId}}\"></div>\n" +
    "        <div class=\"separator\"></div>\n" +
    "        <div class=\"module-desc\">{{module.desc}}</div>\n" +
    "        <div class=\"exercises-box base-border-radius\" ng-switch on=\"module.contentAssign\">\n" +
    "            <div ng-switch-when=\"false\" class=\"content-not-assigned\">\n" +
    "                <div translate=\".NOT_YET_ASSIGNED\"></div>\n" +
    "                <small translate=\".WILL_BE_ABLE_TO_VIEW_ONE_TEACHER_ASSIGNS\"></small>\n" +
    "            </div>\n" +
    "            <div ng-switch-when=\"true\" class=\"lesson-exercises-container\">\n" +
    "                <div class=\"exercise-item-wrap\" ng-repeat=\"exercise in module.exercises\">\n" +
    "                    <div class=\"exercise-item\" ng-repeat=\"item in exercise\">\n" +
    "                        <module-exercise-item\n" +
    "                            assign-content-type=\"assignContentEnum.LESSON.enum\"\n" +
    "                            active-view-obj=\"activeViewObj\"\n" +
    "                            module=\"module\"\n" +
    "                            exercise=\"item\">\n" +
    "                        </module-exercise-item>\n" +
    "                    </div>\n" +
    "                    <div class=\"divider\"></div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"false\" ng-if=\"!hasModule\" class=\"wrapper-overlay\">\n" +
    "        <span translate=\".NO_LESSONS_ASSIGNED\"></span>\n" +
    "        <span class=\"sub\" translate=\".NO_LESSONS_ASSIGNED_SUBTEXT\"></span>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"true\" class=\"wrapper-overlay\">\n" +
    "        <span translate=\".PROCESSING_OVERLAY\"></span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/english-topic-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    viewBox=\"0 0 80 80\" class=\"english-icon-topic-svg\">\n" +
    "\n" +
    "    <style type=\"text/css\">\n" +
    "        .reading-icon-svg {\n" +
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
  $templateCache.put("components/eTutoring/svg/etutoring-exercise-icon.svg",
    "<svg\n" +
    "    version=\"1.1\"\n" +
    "    id=\"Layer_8\"\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"etutoring-exercise-icon\"\n" +
    "    viewBox=\"0 0 680.8 427.5\"\n" +
    "    style=\"enable-background:new 0 0 680.8 427.5;\"\n" +
    "    xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "    .etutoring-exercise-icon .st0{fill:none;stroke:#000000;stroke-width:5;stroke-miterlimit:10;}\n" +
    "	.etutoring-exercise-icon .st1{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M495.6,425H180.5c-29.5,0-53.7-24.1-53.7-53.7V56.2c0-29.5,24.1-53.7,53.7-53.7h315.2\n" +
    "	c29.5,0,53.7,24.1,53.7,53.7v315.2C549.3,400.9,525.2,425,495.6,425z\"/>\n" +
    "<path class=\"st0\" d=\"M155.7,414.2H63.9c-33.8,0-61.4-27.6-61.4-61.4V77.5C2.5,43.7,30.1,16,63.9,16h84.3\"/>\n" +
    "<path class=\"st0\" d=\"M525.1,414.2h91.8c33.8,0,61.4-27.6,61.4-61.4V77.5c0-33.8-27.6-61.4-61.4-61.4h-84.3\"/>\n" +
    "<path class=\"st1\" d=\"M296.1,158.3c0,0,66-56.7,95,5c25.5,54.2-30.7,73.4-51,78.4c-4.1,1-6.9,4.7-6.7,8.9c0.2,6.5,0.5,15.8,0.3,21.5\"\n" +
    "	/>\n" +
    "<circle cx=\"333.7\" cy=\"319.4\" r=\"7.1\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/etutoring-slides-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_8\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 466.5 427.5\" style=\"enable-background:new 0 0 466.5 427.5;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#000000;stroke-width:5;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M410.4,425H148.7c-29.5,0-53.7-24.1-53.7-53.7V109.6C95,80.1,119.1,56,148.7,56h261.7\n" +
    "	c29.5,0,53.7,24.1,53.7,53.7v261.7C464,400.9,439.9,425,410.4,425z\"/>\n" +
    "<path class=\"st0\" d=\"M95,371.6H56.2c-29.5,0-53.7-24.1-53.7-53.7V56.2c0-29.5,24.1-53.7,53.7-53.7h261.7c29.5,0,53.7,24.1,53.7,53.7\n" +
    "	\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/homework-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 153.7 147.9\" style=\"enable-background:new 0 0 153.7 147.9;\" xml:space=\"preserve\">\n" +
    "<g>\n" +
    "	<path d=\"M16.1,147.9c0-2.4,0-4.5,0-6.7c0-23.8,0.1-47.6-0.1-71.4c0-3.1,0.9-5.1,3.5-7c18.1-13.1,36-26.3,53.9-39.7\n" +
    "		c2.9-2.1,4.6-1.9,7.3,0.1c17.9,13.4,35.9,26.5,53.8,39.8c1.5,1.1,3.2,3.3,3.2,4.9c0.2,26.5,0.1,52.9,0.1,79.8c-14,0-27.7,0-42,0\n" +
    "		c0-15,0-30,0-45.3c-12.7,0-24.8,0-37.5,0c0,15.1,0,30.1,0,45.5C44.1,147.9,30.5,147.9,16.1,147.9z\"/>\n" +
    "	<path d=\"M76.9,0c15.7,11.5,30.9,22.7,46.8,34.4c0.3-2.8,0.5-5,0.7-7.7c1.6-0.1,3.2-0.1,4.7-0.3c3.1-0.4,5,0.7,4.3,4.1\n" +
    "		c-1.9,8.9,2.4,14.3,9.7,18.4c3.6,2,6.7,4.9,10.5,7.6c-1.7,2.5-3.4,4.9-5.3,7.6c-9.7-7.1-19.2-14.1-28.7-21.1\n" +
    "		c-13-9.6-26.1-19.1-38.9-28.8c-2.9-2.2-4.8-2-7.7,0.1C51.8,30.2,30.4,45.8,9.1,61.5C8.1,62.3,7,63,5.5,64c-1.8-2.5-3.6-4.8-5.5-7.4\n" +
    "		C25.7,37.7,51.2,19,76.9,0z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/math-topic-icon.svg",
    "<svg x=\"0px\" y=\"0px\"\n" +
    "     class=\"math-icon-svg\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     viewBox=\"-554 409.2 90 83.8\">\n" +
    "\n" +
    "    <style type=\"text/css\">\n" +
    "        .math-icon-svg{\n" +
    "        width: 100%;\n" +
    "        height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "\n" +
    "    <g>\n" +
    "        <path d=\"M-491.4,447.3c-3,0-6.1,0-9.1,0c-2.9,0-4.7-1.8-4.7-4.7c0-6.1,0-12.1,0-18.2c0-2.9,1.8-4.7,4.7-4.7c6,0,12,0,18,0\n" +
    "		c2.8,0,4.7,1.9,4.7,4.7c0,6.1,0,12.1,0,18.2c0,2.8-1.8,4.6-4.6,4.6C-485.4,447.4-488.4,447.3-491.4,447.3z M-491.4,435.5\n" +
    "		c2.5,0,5,0,7.5,0c1.6,0,2.5-0.8,2.4-2c-0.1-1.5-1.1-1.9-2.4-1.9c-5,0-10.1,0-15.1,0c-1.6,0-2.6,0.8-2.5,2c0.2,1.4,1.1,1.9,2.5,1.9\n" +
    "		C-496.5,435.5-494,435.5-491.4,435.5z\"/>\n" +
    "        <path d=\"M-526.6,447.3c-3,0-6,0-8.9,0c-3,0-4.7-1.8-4.8-4.8c0-6,0-11.9,0-17.9c0-3,1.9-4.8,4.9-4.8c5.9,0,11.8,0,17.7,0\n" +
    "		c3.1,0,4.9,1.8,4.9,4.8c0,6,0,11.9,0,17.9c0,3.1-1.8,4.8-4.9,4.8C-520.6,447.4-523.6,447.3-526.6,447.3z M-526.4,443.5\n" +
    "		c1.3-0.1,2-0.9,2-2.2c0.1-1.5,0.1-3,0-4.5c0-1.1,0.4-1.4,1.4-1.4c1.4,0.1,2.8,0,4.1,0c1.3,0,2.2-0.5,2.2-1.9c0.1-1.3-0.8-2-2.3-2\n" +
    "		c-1.4,0-2.8-0.1-4.1,0c-1.2,0.1-1.6-0.4-1.5-1.6c0.1-1.4,0-2.8,0-4.1c0-1.3-0.6-2.2-1.9-2.2c-1.4,0-2,0.8-2,2.2c0,1.5,0,3,0,4.5\n" +
    "		c0,1-0.3,1.3-1.3,1.3c-1.5,0-3,0-4.5,0c-1.3,0-2.2,0.6-2.2,2c0,1.4,0.9,1.9,2.2,1.9c1.5,0,3,0,4.5,0c1.1,0,1.4,0.4,1.4,1.4\n" +
    "		c-0.1,1.5,0,3,0,4.5C-528.4,442.6-527.8,443.3-526.4,443.5z\"/>\n" +
    "        <path d=\"M-526.5,454.9c3,0,6,0,8.9,0c3,0,4.8,1.8,4.8,4.8c0,6,0,12,0,18c0,2.9-1.8,4.7-4.7,4.7c-6.1,0-12.1,0-18.2,0\n" +
    "		c-2.8,0-4.6-1.9-4.6-4.6c0-6.1,0-12.1,0-18.2c0-2.9,1.8-4.6,4.7-4.7C-532.5,454.8-529.5,454.9-526.5,454.9z M-526.7,471.1\n" +
    "		c1.6,1.7,2.9,3,4.2,4.3c0.9,0.9,1.9,1.2,3,0.3c1-0.8,0.9-1.9-0.2-3.1c-1-1.1-2.1-2.1-3.2-3.2c-0.6-0.6-0.6-1.1,0-1.7\n" +
    "		c1-1,2-1.9,2.9-2.9c1.3-1.3,1.4-2.4,0.4-3.3c-0.9-0.8-2-0.7-3.2,0.5c-1.2,1.3-2.3,2.6-3.8,4.3c-1.5-1.7-2.6-3-3.8-4.2\n" +
    "		c-1.2-1.3-2.4-1.4-3.3-0.5c-1,0.9-0.8,2,0.5,3.3c1.2,1.2,2.4,2.4,3.8,3.8c-1.4,1.4-2.7,2.6-3.9,3.8c-1.2,1.2-1.3,2.3-0.3,3.2\n" +
    "		c0.9,0.9,2,0.8,3.2-0.4C-529.2,473.9-528.1,472.6-526.7,471.1z\"/>\n" +
    "        <path d=\"M-505.2,468.5c0-3,0-6,0-8.9c0-2.9,1.7-4.7,4.7-4.7c6.1,0,12.1,0,18.2,0c2.9,0,4.6,1.8,4.7,4.7c0,6,0,12,0,18\n" +
    "		c0,2.8-1.9,4.7-4.7,4.7c-6.1,0-12.1,0-18.2,0c-2.8,0-4.6-1.8-4.6-4.6C-505.3,474.7-505.2,471.6-505.2,468.5z M-491.4,476\n" +
    "		c2.5,0,5,0,7.5,0c1.3,0,2.3-0.5,2.4-1.9c0.1-1.3-0.8-2.1-2.4-2.1c-5,0-10.1,0-15.1,0c-1.6,0-2.6,0.9-2.5,2.1\n" +
    "		c0.2,1.4,1.1,1.9,2.5,1.9C-496.5,476-494,476-491.4,476z M-491.4,461.2c-2.5,0-5.1,0-7.6,0c-1.6,0-2.6,0.8-2.5,2\n" +
    "		c0.2,1.4,1.1,1.9,2.5,1.9c5,0,10.1,0,15.1,0c1.3,0,2.3-0.4,2.4-1.9c0.1-1.3-0.8-2-2.4-2C-486.4,461.2-488.9,461.2-491.4,461.2z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/templates/eTutoring.template.html",
    "<section class=\"e-tutoring-section\" translate-namespace=\"E_TUTORING\" ng-switch=\"diagnosticData && hasTeacher\">\n" +
    "    <div ng-switch-when=\"false\" class=\"app-e-tutoring-overlay no-teachers-overlay\">\n" +
    "        <div class=\"msg-wrap\">\n" +
    "            <div class=\"big-title\" translate=\".NO_TEACHER_TITLE\"  translate-values=\"{appName: appName}\"></div>\n" +
    "            <div ng-show=\"!diagnosticData\" class=\"app-e-tutoring-overlay ng-hide\">\n" +
    "                <span class=\"msg\" translate=\"E_TUTORING.COMPLETE_DIAGNOSTIC_FIRST\"></span>\n" +
    "            </div>\n" +
    "            <div class=\"sub-title\" ng-if=\"diagnosticData && !hasTeacher\">\n" +
    "                <div translate=\".NO_TEACHER_SUBTITLE_1\"></div>\n" +
    "                <div translate=\".NO_TEACHER_SUBTITLE_2\" translate-values=\"{appName: appName}\"></div>\n" +
    "            </div>\n" +
    "            <div class=\"btn-wrap\">\n" +
    "                <button class=\"md-button md success\" translate=\".SCHEDULE\" ng-click=\"vm.showContactUs()\"></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div ng-switch-default class=\"app-e-tutoring\" layout=\"row\" flex=\"grow\"\n" +
    "         ng-class=\"{'blurred-overlay': !diagnosticData || !hasTeacher}\">\n" +
    "        <div class=\"e-tutoring-main-container\">\n" +
    "            <div class=\"navigation-pane base-border-radius base-box-shadow\">\n" +
    "                <etutoring-student-navigation-pane\n" +
    "                    ng-model=\"vm.currentModule\"\n" +
    "                    active-view-obj=\"activeViewObj\"\n" +
    "                    ng-change=\"vm.onModuleChange(vm.currentModule)\">\n" +
    "                </etutoring-student-navigation-pane>\n" +
    "            </div>\n" +
    "            <div class=\"app-e-tutoring-container base-border-radius base-box-shadow\">\n" +
    "                <module-exercise-pane\n" +
    "                    active-view-obj=\"activeViewObj\"\n" +
    "                    show-loading=\"vm.showLoading\"\n" +
    "                    module=\"vm.currentModule\">\n" +
    "                </module-exercise-pane>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</section>\n" +
    "");
  $templateCache.put("components/eTutoring/templates/eTutoringWorkout.template.html",
    "<div class=\"exercise-container base-border-radius\">\n" +
    "    <complete-exercise exercise-details=\"vm.completeExerciseDetails\"\n" +
    "                       settings=\"vm.completeExerciseSettings\">\n" +
    "    </complete-exercise>\n" +
    "</div>\n" +
    "");
}]);
