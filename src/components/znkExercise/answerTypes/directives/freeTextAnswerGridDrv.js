(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerGrid', [
        function () {
            return {
                templateUrl: 'scripts/exercise/templates/freeTextAnswerGridDrv.html',
                restrict: 'E',
                require: 'ngModel',
                scope: {
                    cellsNumGetter: '&cellsNum'
                },
                link: function (scope, element, attrs, ngModelCtrl) {

                    scope.buttonArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                    var numberOfCells = scope.cellsNumGetter() || 3;

                    scope.d = {
                        viewCells: new Array(numberOfCells)
                    };

                    function updateNgModelViewValue() {
                        ngModelCtrl.$setViewValue(angular.copy(scope.d.cells));
                    }

                    scope.onClickNum = function (num) {
                        if (attrs.disabled || scope.d.cells.length >= numberOfCells) {
                            return;
                        }

                        scope.d.cells.push(num);
                        updateNgModelViewValue();
                    };

                    scope.onClickErase = function () {
                        if (attrs.disabled || !scope.d.cells.length) {
                            return;
                        }

                        scope.d.cells.pop();
                        updateNgModelViewValue();
                    };

                    ngModelCtrl.$render = function () {
                        scope.d.cells = angular.isDefined(ngModelCtrl.$viewValue) ? ngModelCtrl.$viewValue : [];
                    };
                }
            };
        }]);
}(angular));
