(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar', [
        'znk.infra.svgIcon',
        'pascalprecht.translate'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {};
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar').directive('znkProgressBar',
        function () {
        'ngInject';
            return {
                templateUrl: 'components/znkProgressBar/znkProgressBar.template.html',
                scope: {
                    progressWidth: '@',
                    progressValue: '@',
                    showProgressValue: '@',
                    showProgressBubble: '&'
                }
            };
        }
    );
})(angular);


angular.module('znk.infra.znkProgressBar').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkProgressBar/znkProgressBar.template.html",
    "<div ng-if=\"::showProgressBubble()\" class=\"progress-bubble-wrapper\" ng-style=\"{left: progressWidth + '%'}\">\n" +
    "    <div class=\"progress-percentage\">\n" +
    "        <div>{{progressWidth}}%\n" +
    "            <div translate=\"ZNK_PROGRESS_BAR.ACCURACY\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"progress-bubble\">\n" +
    "        <div class=\"down-triangle gray-triangle\"></div>\n" +
    "        <div class=\"down-triangle\"></div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"progress-wrap\">\n" +
    "    <div class=\"progress\" ng-style=\"{width: progressWidth + '%'}\"></div>\n" +
    "    <div class=\"answer-count ng-hide\" ng-show=\"{{::showProgressValue}}\">\n" +
    "        {{progressValue}}\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
