/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswer', [

        function () {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/freeTextAnswerDrv.html',
                require: '^ngModel',
                scope:{},
                link: function (scope, element, attrs, ngModelCtrl) {

                    var regex = /(?: |^)\d*\.?\d+(?: |$)|(?: |^)\d*\/?\d+(?: |$)/;

                    scope.clickHandler = function(userAnswer){
                        if(regex.test(userAnswer)){
                            ngModelCtrl.$setViewValue(userAnswer);
                        }
                    }



                }
            };
        }
    ]);
})(angular);

