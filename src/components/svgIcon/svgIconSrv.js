(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [
        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap = {};
            this.registerSvgSources = function (_svgMap) {
                var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
                alreadyRegisteredSvgIconNames.forEach(function(svgIconName){
                    if(!!_svgMap[svgIconName]){
                        console.log('SvgIconSrv: svg icon was already defined before ',svgIconName);
                    }
                });
                angular.extend(svgMap,_svgMap);
                return true;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http',
                function ($templateCache, $q, $http) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);
