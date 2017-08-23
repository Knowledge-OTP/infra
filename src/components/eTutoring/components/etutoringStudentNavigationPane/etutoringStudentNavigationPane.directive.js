(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('etutoringStudentNavigationPane', function(UserAssignModuleService, ExerciseStatusEnum, $log, AuthService, ETutoringViewsConst, DueDateSrv,
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

                    AuthService.getAuth().then(authData => {
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
        });
})(angular);
