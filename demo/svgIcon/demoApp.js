(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.svgIcon'])
        .config(function(SvgIconSrvProvider){
            var svgMap = {
                'checkmark': 'checkmark-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);