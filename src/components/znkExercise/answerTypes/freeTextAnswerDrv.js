/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerDrv', [
        'ZnkExerciseDrvSrv', 'MediaSrv', 'SubjectEnumConst',
        function (ZnkExerciseDrvSrv, MediaSrv, SubjectEnumConst) {
            return {
                templateUrl: 'scripts/exercise/templates/freeTextAnswerDrv.html',
                require: ['^simpleQuestion','^ngModel'],
                scope:{},
                link: function (scope, element, attrs, ctrls) {
                    var questionDrvCtrl = ctrls[0];
                    var ngModelCtrl = scope.ngModelCtrl = ctrls[1];


                    scope.d = {
                        showSolution: questionDrvCtrl.showSolution,
                        ngModelCtrl: ngModelCtrl,
                        numOfGridCells: questionDrvCtrl.question.subjectId === SubjectEnumConst.LISTENING ? 2 : 3
                    };

                    updateCanEdit();

                    function isCorrect(flatAnswer) {
                        var correctAnswersArr = questionDrvCtrl.question.correctAnswerText.map(function(answer){
                            return answer.content;
                        });

                        return correctAnswersArr.indexOf(flatAnswer);
                    }

                    /**
                     * Returns the first correct answer, formatted as comma seperated values
                     * @return {string} correct answers
                     */
                    function getFirstCorrectAnswer() {
                        // '341' -> '3, 4, 1'
                        if(questionDrvCtrl.question.correctAnswerText[0].content){
                            return questionDrvCtrl.question.correctAnswerText[0].content.match(/.{1}/g).join(', ');
                        }else{
                            console.log('content problem in free text question');
                        }

                    }

                    function setCorrectnessClass(enableSound){

                        scope.d.currentAnswer = ngModelCtrl.$viewValue && ngModelCtrl.$viewValue.indexOf(', ') === -1 ?  ngModelCtrl.$viewValue.match(/.{1}/g).join(',') : ngModelCtrl.$viewValue;
                        var viewMode = questionDrvCtrl.getViewMode();
                        var classToAdd;

                        if((viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && angular.isUndefined(scope.d.answer)) ||
                            viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum || viewMode === ZnkExerciseDrvSrv.viewModeEnum.mustAnswer.enum){
                            classToAdd = 'neutral';

                        } else {
                            if (isCorrect(scope.d.answer) === -1) {
                                var $questionCorrectAnswer = angular.element(element[0].querySelector('.question-correct-answer'));
                                $questionCorrectAnswer.empty();
                                $questionCorrectAnswer.html(getFirstCorrectAnswer());

                                if(angular.isUndefined(scope.d.answer)){
                                    classToAdd = 'not-answered';
                                }else{
                                    classToAdd = 'wrong';
                                }
                            } else {
                                classToAdd = 'correct';
                            }

                            if (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && enableSound){
                                if (classToAdd === 'correct'){
                                    MediaSrv.playCorrectAnswerSound();
                                }
                                if (classToAdd === 'wrong'){
                                    MediaSrv.playWrongAnswerSound();
                                }
                            }
                        }

                        element.addClass(classToAdd);
                    }

                    function updateCanEdit() {
                        var viewMode = questionDrvCtrl.getViewMode();
                        scope.d.disableEdit = (viewMode === ZnkExerciseDrvSrv.viewModeEnum.review.enum ||
                            (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && scope.d.answer));
                    }

                    scope.d.save = function(){
                        ngModelCtrl.$setViewValue(scope.d.answer);
                        setCorrectnessClass(true);
                        updateCanEdit();
                    };

                    ngModelCtrl.$render = function(){
                        scope.d.answer = ngModelCtrl.$viewValue;
                        setCorrectnessClass(false);
                        updateCanEdit();
                    };

                    scope.$on('exercise:viewModeChanged', function () {
                        updateCanEdit();
                        ngModelCtrl.$render();
                    });

                    scope.$watch('d.answer', function() {
                        scope.d.save();
                    });
                }
            };
        }
    ]);
})(angular);

