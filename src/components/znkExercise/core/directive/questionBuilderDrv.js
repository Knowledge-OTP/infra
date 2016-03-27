/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout', 'ZnkExerciseUtilitySrv',
        function ($compile, QuestionTypesSrv, $timeout, ZnkExerciseUtilitySrv) {
            return {
                restrict: 'E',
                require: ['questionBuilder', '^znkExercise'],
                scope: {
                    questionGetter: '&question'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.question = $scope.questionGetter();
                    }
                ],
                link: {
                    pre: function pre(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var functionsToBind = ['getViewMode','addQuestionChangeResolver','removeQuestionChangeResolver', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(questionBuilderCtrl, znkExerciseCtrl,functionsToBind);
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question).then(function(result){
                            var questionHtmlTemplate = result;
                            element.append(questionHtmlTemplate);
                            var childScope = scope.$new(true);
                            $compile(element.contents())(childScope);
                        });

                        //after 2 digests at max the question should be rendered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionBuilderReady(questionBuilderCtrl.question.__questionStatus.index);
                            });
                        },0,false);

                        scope.$on('$destroy', function(){
                            $timeout.cancel(innerTimeout);
                        });
                    }
                }
            };
        }
    ]);
})(angular);

