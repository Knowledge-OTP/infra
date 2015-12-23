/**
 * attrs:
 *  prev-question
 *  next-question
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    questionsGetter: '&questions'
                },
                require: ['znkExerciseBtnSection', '^znkExercise'],
                controllerAs: 'vm',
                controller: [
                    '$scope',
                    function ($scope) {
                        this.prevQuestion = function () {
                            $scope.prevQuestion();
                        };

                        this.nextQuestion = function () {
                            $scope.nextQuestion();
                        };
                    }
                ],
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: function (scope, element, attrs, ctrls) {
                    var znkExerciseDrvCtrl = ctrls[1];
                    var questions = znkExerciseDrvCtrl.getQuestions();

                    scope.$parent.$watch(attrs.activeSlide, function(newVal){
                        if((newVal && newVal === (questions.length -1 )) || znkExerciseDrvCtrl.isLastUnansweredQuestion()){
                            scope.vm.showDoneButton = true;
                        }else{
                            scope.vm.showDoneButton = false;
                        }
                    });

                    scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                        if(znkExerciseDrvCtrl.isLastUnansweredQuestion()){
                            scope.vm.showDoneButton = true;
                        }
                    });
                }
            };
        }
    ]);
})(angular);

