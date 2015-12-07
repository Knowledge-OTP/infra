/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                replace: true,
                scope: {
                    name: '@'

                },
                link: {
                    pre: function (scope, element, attrs) {
                        element.css('display','block');

                        var name = scope.name;
                        if (!name) {
                            $log.error('svgIcon directive: name attribute was not set');
                            return;
                        }

                        SvgIconSrv.getSvgByName(name).then(function (svg) {
                            element.append(svg);
                        });
                    }
                }
            };
        }
    ]);
})(angular);

