/**
 * This directive is bound to elements requesting a canvas to cover them
 * since the canvas is positioned as 'absolute', the directive also sets a 'relative' position to relate to the canvas
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawContainer',
        function (ZnkExerciseDrawSrv, $timeout) {
            'ngInject';

            return {
                require: '^questionBuilder',
                link: function (scope, element, attrs, questionBuilderCtrl) {

                    var question = questionBuilderCtrl.question;

                    // make the canvas container relative to this element
                    if (element.css('position') !== 'relative') {
                        element.css('position', 'relative');
                        // sometimes position relative adds an unnecessary scrollbar. hide it
                        element.css('overflow-x', 'hidden');
                    }
                    //temporary solution to the firebase multiple error
                    if (ZnkExerciseDrawSrv.addCanvasToElement) {
                        $timeout(function () {
                            ZnkExerciseDrawSrv.addCanvasToElement(element, question);
                        });
                    }
                }
            };

        });

})(angular);



