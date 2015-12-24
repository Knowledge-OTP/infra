(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents',
        function ($scope, $q, ZnkExerciseEvents) {
            var self = this;
            var exerciseReadyDefer = $q.defer();
            var isExerciseReady = false;

            self.setExerciseAsReady = function(){
                if(isExerciseReady){
                    return;
                }
                isExerciseReady = true;
                exerciseReadyDefer.resolve(isExerciseReady);
            };

            self.isExerciseReady = function(){
                return isExerciseReady ;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            //set resolver which control when to go to next question (if at all) when click on next button
            self.questionChangeResolver = (function () {
                var onNextResolver;
                return function (_onNextResolver) {
                    if (angular.isDefined(_onNextResolver)) {
                        onNextResolver = _onNextResolver;
                    }
                    return $q.when(onNextResolver);
                };
            })();

            self.getCurrentIndex = function () {
                return $scope.d.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    return self.questionChangeResolver().then(function () {
                        $scope.d.currentSlide = newQuestionIndex;
                        return $scope.d.currentSlide;
                    });
                }
                return $q.when($scope.d.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                //minimum index limit
                newCurrIndex = Math.max(0, newCurrIndex);
                //max index limit
                var questions = $scope.questionsGetter() || [];
                newCurrIndex = Math.min(newCurrIndex, questions.length - 1);

                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionReady = function () {
                if (!self.__exerciseReady) {
                    self.__exerciseReady = true;
                    $scope.$broadcast(ZnkExerciseEvents.READY);
                    exerciseReadyDefer.resolve(true);
                    if ($scope.settings.onExerciseReady) {
                        $scope.settings.onExerciseReady();
                    }
                }
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.d.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.d.questionsWithAnswers || []).length;
                var unansweredNum = 0;
                for(var i=0; i<questionsNum; i++){
                    if(!isQuestionAnswered(i)){
                        unansweredNum++;
                        if(unansweredNum === 2){
                            return false;
                        }
                    }
                }
                return unansweredNum === 1;
            };

            self.getQuestions = function(){
                return exerciseReadyDefer.promise.then(function(){
                    return $scope.d.questionsWithAnswers;
                });
            };

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.d.questionsWithAnswers ? $scope.d.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }
        }]);
})(angular);