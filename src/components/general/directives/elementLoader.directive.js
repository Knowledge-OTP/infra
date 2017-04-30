/**
 * attrs -
 *
 *  bg
 *  bgLoader
 *  fontColor
 *  precentage
 *  showLoader
 *  fillLoader
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('elementLoader', function () {
        var directive = {
            restrict: 'EA',
            scope: {
                bg: '=',
                bgLoader: '=',
                fontColor: '=',
                precentage: '=',
                showLoader: '=',
                fillLoader: '='
            },
            link: function (scope, elem) {
                var defaultView = function () {
                    elem[0].className = elem[0].className + ' elem-loader';
                    elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bg + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                    elem[0].style.backgroundSize = '100%';
                    elem[0].style.webkitTransition = 'background-size 20000ms cubic-bezier(0.000, 0.915, 0.000, 0.970)';
                };

                scope.$watch('showLoader', function (newValue) {
                    if (newValue) {
                        elem[0].style.color = scope.fontColor;
                        elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bgLoader + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                        elem[0].style.backgroundSize = '900%';
                    }
                }, true);

                scope.$watch('fillLoader', function (newValue) {
                    if (!!newValue) {
                        elem[0].style.webkitTransition = 'background-size 100ms ';
                        elem[0].style.backgroundSize = '1100%';
                    } else {
                        if (typeof newValue === 'undefined') {
                            return;
                        }
                        defaultView();
                    }
                }, true);

                defaultView();
            }
        };

        return directive;
    });

})(angular);
