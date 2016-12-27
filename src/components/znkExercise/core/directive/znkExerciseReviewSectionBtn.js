(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseReviewBtnSection',
        function (ZnkExerciseViewModeEnum, $q, ZnkExerciseEvents, znkSessionDataSrv, ExerciseReviewStatusEnum) {
            'ngInject';
            return {
                restrict: 'E',
                scope: {
                    onReview: '&',
                    settings: '<'
                },
                require: '^znkExercise',
                templateUrl: "components/znkExercise/core/template/znkExerciseReviewSectionBtnTemplate.html",
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        var liveSessionGuidProm = znkSessionDataSrv.isActiveLiveSession();
                        var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                        var getCurrentQuestionIndexProm = znkExerciseDrvCtrl.getCurrentIndex();
                        var viewMode = znkExerciseDrvCtrl.getViewMode();
                        var exerciseReviewStatus = scope.settings.exerciseReviewStatus;

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            $q.all([
                                liveSessionGuidProm,
                                getQuestionsProm,
                                getCurrentQuestionIndexProm
                            ]).then(function (res) {
                                var isInLiveSession = !angular.equals(res[0], {});
                                var questionsArr = res[1];
                                var currIndex = res[2];
                                currIndex = newIndex ? newIndex : currIndex;
                                var maxQuestionNum = questionsArr.length - 1;
                                var isLastQuestion = maxQuestionNum === currIndex ? true : false;

                                function _isReviewMode() {
                                    return viewMode === ZnkExerciseViewModeEnum.REVIEW.enum;
                                }

                                function _determineIfShowButton () {
                                    return isInLiveSession && isLastQuestion && exerciseReviewStatus === ExerciseReviewStatusEnum.NO.enum || (_isReviewMode() && isLastQuestion && exerciseReviewStatus === ExerciseReviewStatusEnum.NO.enum);
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