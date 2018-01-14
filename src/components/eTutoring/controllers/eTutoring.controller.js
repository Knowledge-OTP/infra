(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringController',
        function ($scope, diagnosticData, $mdDialog, $document, $window, ENV, InvitationService,
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
                        // Sort the exercises by exerciseTypeId. First - Lecture, Second - Tutorial, Third - Practice
                        exercise.sort(function (a, b) {
                            if (a.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum || b.exerciseTypeId === ExerciseTypeEnum.PRACTICE.enum) {
                                return -1;
                            } else if (a.exerciseTypeId === ExerciseTypeEnum.PRACTICE.enum || b.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum) {
                                return 1;
                            } else {
                                return 0;
                            }
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

        });
})(angular);
