(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported', []);
})(angular);

/**
 * Device Not Supported
 * This directive hides all content on the page and shows a message and an image
 * Parameters:
 * title
 * subtitle
 * image src to display
 * by default the message will show when the screen width is 1024px or below, this can be overridden by css at the application level
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported').directive('deviceNotSupported', ['ENV',
        function (ENV) {
            return {
                templateUrl: 'components/deviceNotSupported/deviceNotSupported.template.html',
                restrict: 'E',
                scope: {
                    title: '@',
                    subTitle: '@',
                    imageSrc: '@'
                },
                link: function (scope, element, attrs) {
                    if (ENV.debug) {
                        angular.element(element[0]).addClass('disabled');
                    } else {
                        scope.title = attrs.title;
                        scope.subTitle = attrs.subTitle;
                        scope.imageSrc = attrs.imageSrc;

                        scope.styleObj = {
                            'background-image' : 'url(' + scope.imageSrc + ')'
                        };
                    }
                }
            };
        }
    ]);
})(angular);

angular.module('znk.infra.deviceNotSupported').run(['$templateCache', function ($templateCache) {
  $templateCache.put("components/deviceNotSupported/directives/deviceNotSupported.template.html",
    "<div class=\"device-not-supported-inner\">\n" +
    "    <h1>{{title}}</h1>\n" +
    "    <h2>{{subTitle}}</h2>\n" +
    "    <div class=\"image-container\"\n" +
    "         ng-style=\"styleObj\">\n" +
    "        <img ng-src=\"{{imageSrc}}\" alt=\"hidden\">\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
