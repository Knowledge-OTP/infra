/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'
                },
                link: {
                    pre: function (scope, element, attrs) {
                        function _appendSvgIcon(name){
                            element.addClass(name);
                            SvgIconSrv.getSvgByName(name).then(function (svg) {
                                element.append(svg);
                            });
                        }
                        attrs.$observe('name', function(newName, prevName){
                            element.empty();

                            if(prevName){
                                element.removeClass(name);
                            }

                            if(newName){
                                _appendSvgIcon(newName);
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);

