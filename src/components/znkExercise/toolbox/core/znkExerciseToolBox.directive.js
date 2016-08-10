/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseToolBox',
        function () {
            'ngInject';

            return {
                templateUrl: 'components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html',
                require: '^znkExercise',
                scope:{
                    settings: '<'
                },
                controllerAs: '$ctrl',
                controller: function(){
                    this.getCurrentQuestion = function(){
                        return this.znkExerciseCtrl.getCurrentQuestion();
                    };

                    this.getZnkExerciseElement = function(){
                        return this.znkExerciseCtrl.getElement();
                    };

                    this.isExerciseReady = function(){
                        return this.znkExerciseCtrl.isExerciseReady();
                    };
                },
                bindToController: true,
                link: function(scope, element, attrs, znkExerciseCtrl){
                    scope.$ctrl.znkExerciseCtrl = znkExerciseCtrl;
                }
            };
        }
    );
})(angular);

