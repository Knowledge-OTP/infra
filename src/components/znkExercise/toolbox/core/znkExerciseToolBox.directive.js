/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseToolBox',
        function (ZnkExerciseViewModeEnum) {
            'ngInject';

            return {
                templateUrl: 'components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html',
                require: '^znkExercise',
                scope:{
                    settings: '<'
                },
                controllerAs: '$ctrl',
                controller: function($element){
                    'ngInject';// jshint ignore: line

                    this.getCurrentQuestion = function(){
                        return this.znkExerciseCtrl.getCurrentQuestion();
                    };

                    this.getZnkExerciseElement = function(){
                        return $element.parent();
                    };

                    this.isExerciseReady = function(){
                        return this.znkExerciseCtrl.isExerciseReady();
                    };
                },
                bindToController: true,
                link: {
                    pre: function(scope, element, attrs, znkExerciseCtrl){
                        scope.$ctrl.znkExerciseCtrl = znkExerciseCtrl;

                        // hide toolbox when viewing 'diagnostic' page.
                        if (ZnkExerciseViewModeEnum.MUST_ANSWER.enum === znkExerciseCtrl.getViewMode()) {
                            element[0].style.display ="none";
                        }
                    }
                }
            };
        }
    );
})(angular);

