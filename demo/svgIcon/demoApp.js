(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.svgIcon'])
        .config(function(SvgIconSrvProvider){
            var svgMap = {
                'checkmark': 'checkmark-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        })
        .run(function($timeout){
            $timeout(function(){
                var vIconDomElem = document.querySelector('.checkmark3');
                vIconDomElem.setAttribute('name', 'checkmark');
            },1000);
        });
})(angular);
