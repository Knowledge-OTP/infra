(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats', [
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.znkProgressBar',
        'znk.infra.stats',
        'znk.infra.contentGetters',
        'znk.infra.general',
        'znk.infra.svgIcon'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            'ngInject';
            var svgMap = {
                'znkCategoryStats-clock-icon': 'components/znkCategoryStats/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats')
        .component('znkCategoryStats', {
            bindings: {
                categoryId: '='
            },
            templateUrl: 'components/znkCategoryStats/znkCategoryStats.template.html',
            controllerAs: 'vm',
            controller: ["StatsSrv", "CategoryService", "$q", function (StatsSrv, CategoryService, $q) {
                'ngInject';
                var vm = this;
                var PERCENTAGE = 100;
                var MILLISECOND = 1000;

                buildUiCategory(vm.categoryId);

                function buildUiCategory(categoryId) {
                    var dataPromMap = {};
                    dataPromMap.stats = StatsSrv.getStatsByCategoryId(categoryId);
                    dataPromMap.category = CategoryService.getCategoryData(categoryId);

                    $q.all(dataPromMap).then(function (data) {
                        var userStats = data.stats;
                        var category = data.category;

                        var extendObj = {};
                        extendObj.progress = getProgress(userStats);
                        extendObj.avgTime = getAvgTime(userStats);

                        vm.category = angular.extend(category, extendObj);
                    });
                }

                function getProgress(category) {
                    return category.totalQuestions > 0 ? Math.round(category.correct / category.totalQuestions * PERCENTAGE) : 0;
                }

                function getAvgTime(category) {
                    return category.totalQuestions > 0 ? Math.round(category.totalTime / category.totalQuestions / MILLISECOND) : 0;
                }
            }]
        });
})(angular);

angular.module('znk.infra.znkCategoryStats').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkCategoryStats/svg/clock-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 183 208.5\"\n" +
    "     class=\"clock-icon\">\n" +
    "    <style>\n" +
    "\n" +
    "        .clock-icon {width: 100%; height: auto;}\n" +
    "\n" +
    "        .clock-icon .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 10.5417;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon .st1 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 12.3467;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon .st2 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 11.8313;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon .st3 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 22.9416;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon .st4 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 14;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon .st5 {\n" +
    "        fill: none;\n" +
    "        stroke: #757A83;\n" +
    "        stroke-width: 18;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "\n" +
    "    </style>\n" +
    "    <g>\n" +
    "        <circle class=\"st0\" cx=\"91.5\" cy=\"117\" r=\"86.2\"/>\n" +
    "        <line class=\"st1\" x1=\"92.1\" y1=\"121.5\" x2=\"92.1\" y2=\"61\"/>\n" +
    "        <line class=\"st2\" x1=\"92.1\" y1=\"121.5\" x2=\"131.4\" y2=\"121.5\"/>\n" +
    "        <line class=\"st3\" x1=\"78.2\" y1=\"18.2\" x2=\"104.9\" y2=\"18.2\"/>\n" +
    "        <line class=\"st4\" x1=\"61.4\" y1=\"7\" x2=\"121.7\" y2=\"7\"/>\n" +
    "        <line class=\"st5\" x1=\"156.1\" y1=\"43\" x2=\"171.3\" y2=\"61\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkCategoryStats/znkCategoryStats.template.html",
    "<div class=\"znk-category-stats\">\n" +
    "    <div class=\"category-wrapper\"\n" +
    "         subject-id-to-attr-drv=\"vm.subjectId\"\n" +
    "         translate-namespace=\"ZNK_CATEGORY_SUMMARY\">\n" +
    "\n" +
    "        <div class=\"category-short-name\">{{vm.category.shortName}}</div>\n" +
    "        <div class=\"category-name\">{{vm.category.name}}</div>\n" +
    "\n" +
    "        <div class=\"progress-details-wrapper\">\n" +
    "            <div class=\"level-status-wrapper\">\n" +
    "                <span translate=\".CATEGORY_ACCURACY\" translate-values=\"{categoryProgress: vm.category.progress}\"></span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"subject-progress-wrapper\">\n" +
    "                <znk-progress-bar progress-width=\"{{vm.category.progress}}\"></znk-progress-bar>\n" +
    "                <span class=\"level-white-line line1\"></span>\n" +
    "                <span class=\"level-white-line line2\"></span>\n" +
    "                <span class=\"level-white-line line3\"></span>\n" +
    "                <span class=\"level-white-line line4\"></span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"average-time-wrapper\">\n" +
    "                <svg-icon name=\"znkCategoryStats-clock-icon\"></svg-icon>\n" +
    "                <span translate=\".AVERAGE_TIME_CATEGORY\" translate-values=\"{avgTime: vm.category.avgTime}\"></span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
