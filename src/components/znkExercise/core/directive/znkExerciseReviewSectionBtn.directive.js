(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseReviewBtnSection',
        function ($q, ZnkExerciseEvents, znkSessionDataSrv, ExerciseReviewStatusEnum, ENV) {
            'ngInject';
            return {
                restrict: 'E',
                scope: {
                    onReview: '&',
                    settings: '<'
                },
                require: '^znkExercise',
                templateUrl: "components/znkExercise/core/template/znkExerciseReviewSectionBtn.template.html",
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        var liveSessionGuidProm = znkSessionDataSrv.isActiveLiveSession();
                        var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                        var getCurrentQuestionIndexProm = znkExerciseDrvCtrl.getCurrentIndex();
                        var exerciseReviewStatus = scope.settings.exerciseReviewStatus;
                        var isExerciseComplete = scope.settings.isComplete;
                        var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';


                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            $q.all([
                                liveSessionGuidProm,
                                getQuestionsProm,
                                getCurrentQuestionIndexProm
                            ]).then(function (res) {
                                var isInLiveSession = res[0];
                                var questionsArr = res[1];
                                var currIndex = res[2];
                                currIndex = newIndex ? newIndex : currIndex;
                                var maxQuestionNum = questionsArr.length - 1;
                                var isLastQuestion = maxQuestionNum === currIndex ? true : false;

                                function _determineIfShowButton () {
                                    return isInLiveSession && isExerciseComplete && isTeacherApp && isLastQuestion &&
                                    exerciseReviewStatus !== ExerciseReviewStatusEnum.YES.enum && exerciseReviewStatus !== ExerciseReviewStatusEnum.DONE_TOGETHER.enum;
                                }

                                scope.showBtn = _determineIfShowButton();
                            });
                        });
                    }
                }
            };
        }
    );
})(angular);
