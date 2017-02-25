/**
 * This service serves as a communication tool between znkExerciseDrawContainer and znkExerciseDrawTool
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseDrawSrv', function () {
        'ngInject';

        var _isDrawToolEnabledFunc = function () {
            return function () {
                return true;
            };
        };
        this.setDrawToolState = function (isDrawToolEnabledFunc) {
            _isDrawToolEnabledFunc = isDrawToolEnabledFunc;
        };
        this.$get = function ($injector) {
            'ngInject';  // jshint ignore:line

            var ZnkExerciseDrawSrv = {};
            var isDrawToolEnabled = $injector.invoke(_isDrawToolEnabledFunc);
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

            ZnkExerciseDrawSrv.isDrawToolEnabled = isDrawToolEnabled();
            ZnkExerciseDrawSrv.canvasContextManager = {};
            //    ZnkExerciseDrawSrv.addCanvasToElement = angular.noop();
            // addCanvasToElement function is to be added into this service as well. see znkExerciseDrawContainer directive
            return ZnkExerciseDrawSrv;
        };


    });

})(angular);


