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
                    pre: function (scope, element) {
                        function _appendSvgIcon(name){
                            element.addClass(name);
                            SvgIconSrv.getSvgByName(name).then(function (svg) {
                                element.append(svg);
                            });
                        }

                        function _nameAttrWatchFn(){
                            return element.attr('name');
                        }

                        scope.$watch(_nameAttrWatchFn, function(newName, prevName){
                            element.empty();

                            if(prevName){
                                element.removeClass(prevName);
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

