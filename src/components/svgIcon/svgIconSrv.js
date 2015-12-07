(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [

        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap;
            this.registerSvgSources = function (_svgMap) {
                svgMap = _svgMap;
            };

            this.$get = [
                '$templateCache', '$q', '$http',
                function ($templateCache, $q, $http) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];
                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }
                        return $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            return res.data;
                        });
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);
