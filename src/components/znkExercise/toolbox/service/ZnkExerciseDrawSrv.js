/**
 * This service serves as a communication tool between znkExerciseDrawContainer and znkExerciseDrawTool
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').service('ZnkExerciseDrawSrv',
        function () {
            //'ngInject';
            
            var self = this;

            /** example of self.canvasContextManager
             *  {
             *      10981: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             },
             *      10982: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             }
             *  } 
             *
             *  the names (such as 'question' or 'answer') are set according to the attribute name 'canvas-name' of znkExerciseDrawContainer directive
             */

            self.canvasContextManager = {};

            // addCanvasToElement function is to be added into this service as well. see znkExerciseDrawContainer directive

        });

})(angular);


