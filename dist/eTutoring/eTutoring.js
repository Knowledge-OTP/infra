(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring',[
        'znk.infra.contentGetters'
    ]);
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
            var self = this;
            this.formData = {};
            this.showSpinner = true;
            UserProfileService.getProfile().bind(this).then(function(profile){
                if (angular.isDefined(profile)) {
                    self.formData.name = profile.nickname || undefined;
                    self.formData.email = profile.email || undefined;
                }
            });

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

                    MailSenderService.postMailRequest(mailRequest).bind(this).then(function(){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showSuccess = true;
                        });
                    }).catch(function(mailError){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showError = true;
                            $log.error('ETutoringContactUsController:sendContactUs:: error send mail', mailError);
                        });
                    });
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
                        ETutoringService.getIconNameByCategoryId(scope.exercise.categoryId).then(function (className) {
                            scope.assignmentIconName = className;
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

    angular.module('znk.infra.eTutoring')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'etutoring-exercise-icon': 'components/eTutoring/svg/etutoring-exercise-icon.svg',
                'etutoring-slides-icon': 'components/eTutoring/svg/etutoring-slides-icon.svg',
                'etutoring-calendar-icon': 'components/eTutoring/svg/etutoring-calendar-icon.svg',
                'etutoring-close-icon': 'components/eTutoring/svg/etutoring-close-popup.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
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
        .provider('ETutoringService', function () {

            var getIconNameByCategoryIdWrapper, appName;

            this.setGetIconNameByCategoryId = function (fn) {
                getIconNameByCategoryIdWrapper = fn;
            };

            this.setAppName = function(_appName){
                appName = _appName;
            };

            this.$get = ["$injector", "$log", "$q", function ($injector, $log, $q) {
                var ETutoringService = {};

                ETutoringService.getIconNameByCategoryId = function (categoryId) {
                    if(angular.isUndefined(getIconNameByCategoryIdWrapper)){
                        $log.error('ETutoringService: getIconNameByCategoryIdWrapper was not set up in config phase!');
                        return $q.when();
                    } else {
                        var getIconNameByCategoryId = $injector.invoke(getIconNameByCategoryIdWrapper);
                        return getIconNameByCategoryId(categoryId);
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
  $templateCache.put("components/eTutoring/components/etutoringActionBar/etutoringActionBar.template.html",
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
  $templateCache.put("components/eTutoring/components/eTutoringContactUs/eTutoringContactUs.template.html",
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
  $templateCache.put("components/eTutoring/components/etutoringStudentNavigationPane/etutoringStudentNavigationPane.template.html",
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
    "                    <div class=\"subject-name\">{{subjectsMap[assignContent.subjectId].val }}</div>\n" +
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
  $templateCache.put("components/eTutoring/components/moduleExerciseItem/moduleExerciseItem.template.html",
    "<button translate-namespace=\"MODULE_EXERCISE_ITEM_DRV\"\n" +
    "     class=\"module-part\"\n" +
    "     ng-click=\"go(module, exercise)\"\n" +
    "     ng-disabled=\"exercise.isLessonSummary && !module.enableLessonSummaryEx\"\n" +
    "     ng-class=\"{'is-lecture': (exerciseTypeId===exerciseTypeEnum.LECTURE.enum) ||\n" +
    "                (!module.moduleSummary[exerciseTypeId][exerciseId]),\n" +
    "                'in-progress': module.moduleSummary[exerciseTypeId][exerciseId].status===exerciseStatusEnum.ACTIVE.enum,\n" +
    "                'completed': module.moduleSummary[exerciseTypeId][exerciseId].status===exerciseStatusEnum.COMPLETED.enum}\">\n" +
    "\n" +
    "    <div class=\"icon-wrap\" >\n" +
    "            <svg-icon name=\"etutoring-exercise-icon\" class=\"svg-icon-wrap\"\n" +
    "                      ng-if=\"exerciseTypeId!==exerciseTypeEnum.LECTURE.enum && activeViewObj.view === ETutoringViewsConst.LESSON\">\n" +
    "            </svg-icon>\n" +
    "            <svg-icon name=\"etutoring-slides-icon\" class=\"svg-icon-wrap\"\n" +
    "                      ng-if=\"exerciseTypeId===exerciseTypeEnum.LECTURE.enum &&  activeViewObj.view === ETutoringViewsConst.LESSON\"\">\n" +
    "            </svg-icon>\n" +
    "            <svg-icon name=\"{{assignmentIconName}}\"\n" +
    "                      class=\"svg-icon-wrap\"\n" +
    "                      ng-class=\"::{'math-no-calc': !exercise.calculator && exercise.subjectId === subjectEnum.MATH.enum && assignmentIconName}\"\n" +
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
  $templateCache.put("components/eTutoring/components/moduleExercisePane/homeworkPane.template.html",
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
  $templateCache.put("components/eTutoring/components/moduleExercisePane/lessonsPane.template.html",
    "<div class=\"lesson-container\" ng-switch=\"showLoading\" translate-namespace=\"MODULE_EXERCISE_PANE_DRV\">\n" +
    "    <div ng-switch-when=\"false\" ng-if=\"hasModule\" class=\"module-container\">\n" +
    "        <div class=\"module-name\">{{module.name}}</div>\n" +
    "        <div class=\"subject-icon\">\n" +
    "            <svg-icon name=\"{{svgIcon}}\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"subject-name\">{{subjectEnumMap[module.subjectId]}}</div>\n" +
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
  $templateCache.put("components/eTutoring/svg/etutoring-calendar-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" class=\"calendar-icon\"\n" +
    "     viewBox=\"0 0 176.3 200\">\n" +
    "    <style>\n" +
    "        .calendar-icon{\n" +
    "        enable-background:new 0 0 176.3 200;\n" +
    "        width:35px;\n" +
    "        height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "    <g id=\"XMLID_40_\">\n" +
    "        <path id=\"XMLID_138_\" d=\"M164.1,200c-50.7,0-101.3,0-152,0C3.1,196-0.1,189.1,0,179.3c0.3-36.5,0.1-73,0.1-109.5c0-1.9,0-3.8,0-5.6\n" +
    "		c59,0,117.3,0,176,0c0,2,0,3.8,0,5.6c0,36.5-0.2,73,0.1,109.5C176.4,189.1,173.2,196,164.1,200z M163.9,156.3\n" +
    "		c-10.8,0-21.1,0-31.4,0c0,10.7,0,21.1,0,31.4c10.6,0,20.9,0,31.4,0C163.9,177.2,163.9,166.9,163.9,156.3z M123.9,156.2\n" +
    "		c-10.8,0-21.1,0-31.5,0c0,10.6,0,21,0,31.4c10.7,0,21.1,0,31.5,0C123.9,177,123.9,166.7,123.9,156.2z M52.4,187.7\n" +
    "		c10.8,0,21.1,0,31.5,0c0-10.6,0-21,0-31.4c-10.7,0-21.1,0-31.5,0C52.4,166.9,52.4,177.2,52.4,187.7z M12.5,156.2\n" +
    "		c0,10.7,0,21.1,0,31.4c10.7,0,21.1,0,31.4,0c0-10.6,0-20.9,0-31.4C33.4,156.2,23.1,156.2,12.5,156.2z M163.8,147.7\n" +
    "		c0-10.8,0-21.1,0-31.4c-10.7,0-21.1,0-31.4,0c0,10.7,0,20.9,0,31.4C142.9,147.7,153.2,147.7,163.8,147.7z M123.9,147.7\n" +
    "		c0-10.8,0-21.1,0-31.5c-10.6,0-21,0-31.4,0c0,10.7,0,21.1,0,31.5C103.1,147.7,113.4,147.7,123.9,147.7z M52.4,147.6\n" +
    "		c10.8,0,21.2,0,31.4,0c0-10.7,0-21.1,0-31.4c-10.7,0-20.9,0-31.4,0C52.4,126.7,52.4,137,52.4,147.6z M43.9,116.3\n" +
    "		c-10.7,0-21.1,0-31.4,0c0,10.7,0,21.1,0,31.4c10.6,0,20.9,0,31.4,0C43.9,137.2,43.9,127,43.9,116.3z M132.5,76.1\n" +
    "		c0,10.9,0,21.3,0,31.5c10.7,0,20.9,0,31.3,0c0-10.6,0-21,0-31.5C153.3,76.1,143,76.1,132.5,76.1z M92.5,76.2c0,10.8,0,21.1,0,31.4\n" +
    "		c10.7,0,21.1,0,31.4,0c0-10.7,0-20.9,0-31.4C113.4,76.2,103.1,76.2,92.5,76.2z M83.9,76.3c-10.8,0-21.1,0-31.4,0\n" +
    "		c0,10.7,0,21.1,0,31.4c10.6,0,20.9,0,31.4,0C83.9,97.2,83.9,86.9,83.9,76.3z M43.9,76.3c-10.8,0-21.2,0-31.4,0\n" +
    "		c0,10.7,0,21.1,0,31.4c10.7,0,20.9,0,31.4,0C43.9,97.1,43.9,86.9,43.9,76.3z\"/>\n" +
    "        <path id=\"XMLID_119_\" d=\"M176.1,55.8c-58.9,0-117.1,0-175.7,0c0-6.4-0.6-12.7,0.2-18.9c1-7.6,7.6-12.7,15.5-12.9\n" +
    "		c4.3-0.1,8.7,0,13,0c4.1,0,8.3,0,13,0c0-5.8-0.1-11.2,0-16.6c0.1-4.7,2.5-7.7,6.2-7.3c4.3,0.4,5.8,3.2,5.8,7.3\n" +
    "		c-0.1,5.3,0,10.6,0,16.3c22.6,0,45,0,68,0c0-5.4,0.1-10.8,0-16.3c-0.1-4.1,1.4-6.9,5.8-7.3c3.7-0.4,6.2,2.6,6.2,7.3\n" +
    "		c0.1,5.3,0,10.6,0,16.6c7.8,0,15.4,0,23,0c12.9,0,19,6.1,19,18.9C176.1,47,176.1,51.1,176.1,55.8z M122.2,29.9\n" +
    "		c-5.7,4.3-7.2,9.1-5.1,14.4c2,5.2,7.3,8.3,12.7,7.6c5.2-0.7,9.5-4.9,10.3-10.1c0.8-4.9-1.5-9.2-5.9-11.2c0,3.1,0.1,6.1,0,9\n" +
    "		c-0.1,3.7-2.1,6.1-5.8,6.2c-4,0.1-6-2.4-6.1-6.3C122.1,36.6,122.2,33.6,122.2,29.9z M42.2,29.9c-5.7,4.3-7.2,9-5.2,14.3\n" +
    "		c2,5.2,7.2,8.3,12.7,7.6c5.2-0.7,9.5-4.9,10.4-10.1c0.8-4.8-1.4-9.2-5.9-11.2c0,3.3,0.2,6.4,0,9.5c-0.2,3.4-2.3,5.6-5.7,5.7\n" +
    "		c-3.7,0.1-5.9-2.1-6.1-5.8C42,36.9,42.2,33.8,42.2,29.9z\"/>\n" +
    "    </g>\n" +
    "</svg>");
  $templateCache.put("components/eTutoring/svg/etutoring-close-popup.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\" class=\"close-popup\">\n" +
    "    <style>\n" +
    "        .close-popup{\n" +
    "        width:15px;\n" +
    "        height:15px;\n" +
    "        }\n" +
    "    </style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/etutoring-exercise-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\"  x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-830.8 420 117.6 141\" xml:space=\"preserve\" class=\"etutoring-exercise-icon\">\n" +
    "<style type=\"text/css\">\n" +
    "	.etutoring-exercise-icon {width: 100%; height: auto}\n" +
    "	.etutoring-exercise-icon .st0{fill:#231F20;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-723.5,561h-97c-5.7,0-10.3-4.6-10.3-10.3V430.3c0-5.7,4.6-10.3,10.3-10.3h97c5.7,0,10.3,4.6,10.3,10.3v120.5\n" +
    "		C-713.2,556.4-717.8,561-723.5,561z M-820.5,424c-3.5,0-6.3,2.8-6.3,6.3v120.4c0,3.5,2.8,6.3,6.3,6.3h97c3.4,0,6.3-2.8,6.3-6.2\n" +
    "		V430.3c0-3.5-2.8-6.3-6.3-6.3H-820.5z\"/>\n" +
    "	<path class=\"st0\" d=\"M-797.9,536.9c-0.2,0-0.4,0-0.6-0.1l-6-3.2l-5.9,3.2c-0.4,0.2-1,0.2-1.4-0.1c-0.4-0.3-0.6-0.8-0.5-1.3l1.1-6.7\n" +
    "		l-4.8-4.6c-0.4-0.3-0.5-0.9-0.3-1.3s0.6-0.8,1-0.9l6.6-1l3-6.1c0.2-0.4,0.7-0.7,1.2-0.7s0.9,0.3,1.2,0.7l3,6.1l6.7,1\n" +
    "		c0.5,0.1,0.9,0.4,1,0.9c0.1,0.5,0,1-0.3,1.3l-4.9,4.6l1.2,6.7c0.1,0.5-0.1,1-0.5,1.3C-797.4,536.8-797.6,536.9-797.9,536.9z\n" +
    "		 M-804.5,530.8c0.2,0,0.4,0,0.6,0.1l4.3,2.3l-0.8-4.8c-0.1-0.4,0.1-0.9,0.4-1.2l3.5-3.3l-4.8-0.7c-0.4-0.1-0.8-0.3-1-0.7l-2.1-4.4\n" +
    "		l-2.1,4.4c-0.2,0.4-0.5,0.6-1,0.7l-4.7,0.7l3.4,3.3c0.3,0.3,0.4,0.7,0.4,1.1l-0.8,4.8l4.2-2.3\n" +
    "		C-804.9,530.9-804.7,530.8-804.5,530.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-778.7,536.9c-0.3,0-0.5-0.1-0.8-0.2c-0.4-0.3-0.6-0.8-0.5-1.3l1.2-6.7l-4.8-4.6c-0.4-0.3-0.5-0.9-0.3-1.3\n" +
    "		s0.6-0.8,1-0.9l6.6-1l3-6.1c0.2-0.4,0.7-0.7,1.2-0.7s0.9,0.3,1.2,0.7l3,6.1l6.6,1c0.5,0.1,0.9,0.4,1,0.9s0,1-0.3,1.3l-4.8,4.6\n" +
    "		l1.2,6.7c0.1,0.5-0.1,1-0.5,1.3s-0.9,0.3-1.4,0.1l-6-3.2l-6,3.2C-778.3,536.8-778.5,536.9-778.7,536.9z M-772.1,530.8\n" +
    "		c0.2,0,0.4,0,0.6,0.1l4.3,2.3l-0.8-4.8c-0.1-0.4,0.1-0.9,0.4-1.2l3.4-3.3l-4.7-0.7c-0.4-0.1-0.8-0.3-1-0.7l-2.1-4.4l-2.1,4.4\n" +
    "		c-0.2,0.4-0.5,0.6-1,0.7l-4.7,0.7l3.4,3.3c0.3,0.3,0.5,0.7,0.4,1.2l-0.8,4.8l4.3-2.3C-772.5,530.9-772.3,530.8-772.1,530.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-746.3,536.9c-0.3,0-0.5-0.1-0.8-0.2c-0.4-0.3-0.6-0.8-0.5-1.3l1.1-6.7l-4.8-4.6c-0.4-0.3-0.5-0.9-0.3-1.3\n" +
    "		c0.1-0.5,0.6-0.8,1-0.9l6.7-1l3-6.1c0.2-0.4,0.7-0.7,1.2-0.7c0,0,0,0,0,0c0.5,0,0.9,0.3,1.2,0.7l2.9,6.1l6.7,1\n" +
    "		c0.5,0.1,0.9,0.4,1,0.9c0.1,0.5,0,1-0.3,1.3l-4.8,4.6l1.1,6.7c0.1,0.5-0.1,1-0.5,1.3c-0.4,0.3-0.9,0.3-1.4,0.1l-5.9-3.2l-6,3.2\n" +
    "		C-745.9,536.8-746.1,536.9-746.3,536.9z M-747.6,524l3.4,3.3c0.3,0.3,0.4,0.7,0.4,1.1l-0.8,4.8l4.3-2.3c0.4-0.2,0.8-0.2,1.2,0\n" +
    "		l4.2,2.3l-0.8-4.8c-0.1-0.4,0.1-0.8,0.4-1.1l3.4-3.3l-4.8-0.7c-0.4-0.1-0.8-0.3-1-0.7l-2.1-4.3l-2.1,4.3c-0.2,0.4-0.5,0.6-1,0.7\n" +
    "		L-747.6,524z\"/>\n" +
    "	<path class=\"st0\" d=\"M-730.2,446.5h-85.9c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3h85.9c0.7,0,1.3,0.6,1.3,1.3\n" +
    "		S-729.5,446.5-730.2,446.5z\"/>\n" +
    "	<path class=\"st0\" d=\"M-730.2,467.8h-85.9c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3h85.9c0.7,0,1.3,0.6,1.3,1.3\n" +
    "		S-729.5,467.8-730.2,467.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-739.3,488.9H-807c-0.6,0-1.1-0.5-1.1-1.1s0.5-1.1,1.1-1.1h67.7c0.6,0,1.1,0.5,1.1,1.1\n" +
    "		S-738.7,488.9-739.3,488.9z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/eTutoring/svg/etutoring-slides-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-821.7 301.5 118.4 104.3\" xml:space=\"preserve\" class=\"etutoring-slides-icon\">\n" +
    "<style type=\"text/css\">\n" +
    "	.etutoring-slides-icon {width: 100%; height: auto}\n" +
    "	.etutoring-slides-icon .st0{fill:#231F20;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M-714.1,364.5h-96.7c-6,0-10.9-4.9-10.9-10.9v-41.3c0-6,4.9-10.9,10.9-10.9h96.7c6,0,10.9,4.9,10.9,10.9v41.3\n" +
    "	C-703.3,359.7-708.1,364.5-714.1,364.5z M-810.8,305.5c-3.8,0-6.9,3.1-6.9,6.9v41.3c0,3.8,3.1,6.9,6.9,6.9h96.7\n" +
    "	c3.8,0,6.9-3.1,6.9-6.9v-41.3c0-3.8-3.1-6.9-6.9-6.9H-810.8z\"/>\n" +
    "<path class=\"st0\" d=\"M-705.3,372.5h-114.4c-1.1,0-2-0.9-2-2s0.9-2,2-2h114.4c1.1,0,2,0.9,2,2S-704.2,372.5-705.3,372.5z\"/>\n" +
    "<path class=\"st0\" d=\"M-791.6,405.7c-0.3,0-0.7-0.1-1-0.3c-1-0.6-1.3-1.8-0.7-2.7l19.5-33.2c0.6-1,1.8-1.3,2.7-0.7\n" +
    "	c1,0.6,1.3,1.8,0.7,2.7l-19.5,33.2C-790.2,405.4-790.9,405.7-791.6,405.7z\"/>\n" +
    "<path class=\"st0\" d=\"M-734.3,405.7c-0.7,0-1.3-0.3-1.7-0.9l-21-33.2c-0.6-0.9-0.3-2.2,0.6-2.8c0.9-0.6,2.2-0.3,2.8,0.6l21,33.2\n" +
    "	c0.6,0.9,0.3,2.2-0.6,2.8C-733.5,405.6-733.9,405.7-734.3,405.7z\"/>\n" +
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
