(function (angular) {
    'use strict';

    angular.module('testUtility').controller('answerBuilderCtrl.mock', [
        'ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            this.question = {
                id: 1,
                answerTypeId: 0,
                correctAnswerId: 1,
                answers: [
                    {
                        id: 1,
                        content: '<span>answer1</span>'
                    },
                    {
                        id: 2,
                        content: '<span>answer2</span>'
                    },
                    {
                        id: 3,
                        content: '<span>answer3</span>'
                    }
                ],
                __questionStatus:{
                    index: 0
                }
            };
            this.getCurrentIndex = function() {
                return 0;
            }

            this.getViewMode = function(){
                return ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
            };
        }
    ]);
})(angular);
