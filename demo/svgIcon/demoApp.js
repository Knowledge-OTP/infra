(function (angular) {
    'use strict';

    angular.module('demoApp', ['svgIcon'])
        .config(function(SvgIconSrvProvider){
            var svgMap = {
                'checkmark': 'checkmark-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);