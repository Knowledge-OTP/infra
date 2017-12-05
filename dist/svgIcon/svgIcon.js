(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon',
        ["$log", "SvgIconSrv", function ($log, SvgIconSrv) {
            'ngInject';
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
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', function () {
        'ngInject';
        var defaultConfig = {};
        this.setConfig = function (_config) {
            angular.extend(defaultConfig, _config);
        };

        var svgMap = {};
        this.registerSvgSources = function (_svgMap) {
            var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
            alreadyRegisteredSvgIconNames.forEach(function (svgIconName) {
                if (!!_svgMap[svgIconName]) {
                    console.error('SvgIconSrv: svg icon was already defined before ', svgIconName);
                }
            });
            angular.extend(svgMap, _svgMap);
            return true;
        };

        var getSvgPromMap = {};

        this.$get = ["$templateCache", "$q", "$http", "$log", function ($templateCache, $q, $http, $log) {
                var SvgIconSrv = {};

                SvgIconSrv.getSvgByName = function (name) {
                    var src = svgMap[name];

                    if (!src) {
                        $log.error('SvgIconSrv: src is missing for the following name: ' + name);
                        return $q.reject('no source was found');
                    }

                    if (getSvgPromMap[src]) {
                        return getSvgPromMap[src];
                    }

                    var fromCache = $templateCache.get(src);
                    if (fromCache) {
                        return $q.when(fromCache);
                    }

                    var getSvgProm = $http.get(src).then(function (res) {
                        $templateCache.put(src, res.data);
                        delete getSvgPromMap[src];
                        return res.data;
                    });
                    getSvgPromMap[src] = getSvgProm;

                    return getSvgProm;
                };

                return SvgIconSrv;
            }];
    });
})(angular);

angular.module('znk.infra.svgIcon').run(['$templateCache', function ($templateCache) {

}]);
