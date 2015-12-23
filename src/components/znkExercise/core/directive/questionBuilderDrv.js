/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout',
        function ($compile, QuestionTypesSrv, $timeout) {
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

                        questionBuilderCtrl.getViewMode = znkExerciseCtrl.getViewMode;
                        questionBuilderCtrl.questionChangeResolver = znkExerciseCtrl.questionChangeResolver.bind(znkExerciseCtrl);
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];
                        var questionHtmlTemplate = QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question);
                        element.append(questionHtmlTemplate);
                        var childScope = scope.$new(true);
                        $compile(element.contents())(childScope);

                        //after 2 digests at max the question should be randered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionReady(questionBuilderCtrl.question.__questionStatus.index);
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

