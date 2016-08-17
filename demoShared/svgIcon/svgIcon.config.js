'use strict';

angular.module('demo')
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'math-icon': 'svgIcon/math-icon.svg',
                'verbal-icon': 'svgIcon/verbal-icon.svg',
                'essay-icon': 'svgIcon/essay-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }
    ]);
