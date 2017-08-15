(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats', [
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.znkProgressBar',
        'znk.infra.stats',
        'znk.infra.contentGetters',
        'znk.infra.general',
        'znk.infra.svgIcon',
        'znk.infra.znkTooltip'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            'ngInject';
            var svgMap = {
                'znkCategoryStats-clock-icon': 'components/znkCategoryStats/svg/clock-icon.svg',
                'znkCategoryStats-v-icon': 'components/znkCategoryStats/svg/v-icon.svg',
                'znkCategoryStats-x-icon': 'components/znkCategoryStats/svg/x-icon.svg',
                'znkCategoryStats-total-icon': 'components/znkCategoryStats/svg/total-icon.svg'
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
            templateUrl: 'components/znkCategoryStats/components/znkCategoryStats.template.html',
            controllerAs: 'vm',
            controller: ["StatsSrv", "CategoryService", function (StatsSrv, CategoryService) {
                'ngInject';
                var vm = this;
                var PERCENTAGE = 100;
                var MILLISECOND = 1000;

                this.$onInit = function() {
                    buildUiCategory(vm.categoryId);
                };

                function buildUiCategory(categoryId) {
                    var statsProm = StatsSrv.getStatsByCategoryId(categoryId);
                    vm.category = CategoryService.getCategoryDataSync(categoryId);
                    vm.level1CategoryId = CategoryService.getCategoryLevel1ParentByIdSync(categoryId);

                    statsProm.then(function (categoryStats) {
                        if (!categoryStats){
                            categoryStats = 0;
                        }
                        var extendObj = {};
                        extendObj.progress = getProgress(categoryStats);
                        extendObj.avgTime = getAvgTime(categoryStats);

                        vm.category = angular.extend(vm.category, extendObj);

                        vm.category.specificArray = [{"id":"34","name":"Direct and inverse variation","levelProgress":0,"correct":0,"wrong":1,"totalQuestions":1},{"id":"43","name":"Qualitative Behavior of Functions","levelProgress":43,"correct":3,"wrong":4,"totalQuestions":7},{"id":"46","name":"Ratios and Proportions","levelProgress":25,"correct":2,"wrong":1,"totalQuestions":8},{"id":"50","name":"Mean/Median/Mode","levelProgress":18,"correct":3,"wrong":14,"totalQuestions":17},{"id":"51","name":"Complex Data interpretation","levelProgress":0,"correct":0,"wrong":5,"totalQuestions":6},{"id":"52","name":"Simple Data interpretation","levelProgress":14,"correct":4,"wrong":25,"totalQuestions":29},{"id":"58","name":"Percents","levelProgress":25,"correct":1,"wrong":2,"totalQuestions":4},{"id":"59","name":"Probability","levelProgress":0,"correct":0,"wrong":5,"totalQuestions":5},{"id":"60","name":"Statistical analysis, standard deviation","levelProgress":0,"correct":0,"wrong":3,"totalQuestions":3},{"id":"61","name":"Two-Way Tables","levelProgress":38,"correct":3,"wrong":5,"totalQuestions":8},{"id":"62","name":"Unit Conversion","levelProgress":17,"correct":1,"wrong":4,"totalQuestions":6}];
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

angular.module('znk.infra.znkCategoryStats').run(['$templateCache', function ($templateCache) {
  $templateCache.put("components/znkCategoryStats/components/znkCategoryStats.template.html",
    "<div class=\"znk-category-stats\">\n" +
    "    <div class=\"category-wrapper\"\n" +
    "         subject-id-to-attr-drv=\"vm.level1CategoryId\"\n" +
    "         translate-namespace=\"ZNK_CATEGORY_SUMMARY\">\n" +
    "\n" +
    "        <div class=\"progress-details-wrapper\">\n" +
    "            <div class=\"category-name\">{{vm.category.name}}</div>\n" +
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
    "            <div class=\"stats-footer\">\n" +
    "                <div class=\"average-time-wrapper\">\n" +
    "\n" +
    "                    <svg-icon name=\"znkCategoryStats-clock-icon\"></svg-icon>\n" +
    "                    <span translate=\".AVERAGE_TIME_CATEGORY\" translate-values=\"{avgTime: vm.category.avgTime}\"></span>\n" +
    "                </div>\n" +
    "                <div class=\"show-details\" ng-if=\"vm.category.specificArray\">\n" +
    "                    <md-menu class=\"specific-menu\" md-offset=\"320 -38\">\n" +
    "                        <div ng-click=\"$mdOpenMenu($event)\" class=\"menu-btn\">\n" +
    "                            <div translate=\".SHOW_DETAILS\" class=\"show-details-title\"></div>\n" +
    "                        </div>\n" +
    "                        <md-menu-content class=\"subscore-specific-content\" width=\"4\">\n" +
    "                            <div class=\"icons-wrap\">\n" +
    "                                <div class=\"stat-icon-wrap\">\n" +
    "                                    <svg-icon name=\"znkCategoryStats-v-icon\" class=\"v-icon\"></svg-icon>\n" +
    "                                </div>\n" +
    "                                <div class=\"stat-icon-wrap\">\n" +
    "                                    <svg-icon name=\"znkCategoryStats-x-icon\" class=\"x-icon\"></svg-icon>\n" +
    "                                </div>\n" +
    "                                <div class=\"stat-icon-wrap\">\n" +
    "                                    <svg-icon name=\"znkCategoryStats-total-icon\" class=\"total-icon\"></svg-icon>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <md-menu-item class=\"specific-wrap\" ng-repeat=\"specific in vm.category.specificArray track by $index\">\n" +
    "                                 <!--TODO: https://github.com/angular/material/issues/10041-->\n" +
    "                                <!--<md-tooltip znk-tooltip md-direction=\"top\">{{specific.name}}</md-tooltip>-->\n" +
    "                                <div class=\"specific-name\" ng-class=\"{'highlight': specific.levelProgress < 30}\">\n" +
    "                                    {{specific.name | cutString: 25}}\n" +
    "                                </div>\n" +
    "                                <div class=\"category-data\">\n" +
    "                                    <div class=\"level-progress\" ng-class=\"{'highlight': specific.levelProgress < 30}\">\n" +
    "                                        {{specific.levelProgress}}%\n" +
    "                                    </div>\n" +
    "                                    <div class=\"correct\">\n" +
    "                                        {{specific.correct}}\n" +
    "                                    </div>\n" +
    "                                    <div class=\"wrong\">\n" +
    "                                        {{specific.wrong}}\n" +
    "                                    </div>\n" +
    "                                    <div class=\"unanswered\">\n" +
    "                                        {{specific.totalQuestions}}\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </md-menu-item>\n" +
    "                            <div class=\"triangle-wrap\">\n" +
    "                                <div class=\"triangle\"></div>\n" +
    "                            </div>\n" +
    "                        </md-menu-content>\n" +
    "                    </md-menu>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
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
  $templateCache.put("components/znkCategoryStats/svg/total-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-237.5 335.5 96.5 128.3\">\n" +
    "<style type=\"text/css\" class=\"total-icon\">\n" +
    "	.total-icon .st0{fill:none;enable-background:new    ;}\n" +
    "	.total-icon .st1{fill:none;stroke:#231F20;stroke-width:8;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M-238,330.5\"/>\n" +
    "<polyline class=\"st1\" points=\"-145,339.5 -233.5,339.5 -197.4,400.1 -233.5,459.8 -145,459.8 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkCategoryStats/svg/v-icon.svg",
    "<svg class=\"v-icon-wrapper\" x=\"0px\" y=\"0px\" viewBox=\"0 0 334.5 228.7\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .v-icon-wrapper .st0{\n" +
    "            fill:#ffffff;\n" +
    "            stroke:#ffffff;\n" +
    "            stroke-width:26;\n" +
    "            stroke-linecap:round;\n" +
    "            stroke-linejoin:round;\n" +
    "            stroke-miterlimit:10;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"13\" y1=\"109.9\" x2=\"118.8\" y2=\"215.7\"/>\n" +
    "	<line class=\"st0\" x1=\"118.8\" y1=\"215.7\" x2=\"321.5\" y2=\"13\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkCategoryStats/svg/x-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"-596.6 492.3 133.2 133.5\" class=\"x-icon\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .x-icon .st0{fill:none;}\n" +
    "        .x-icon .st1{fill:none;stroke-width:8;stroke-linecap:round;stroke-miterlimit:10;}\n" +
    "        .x-icon {width: auto; height: auto}\n" +
    "    </style>\n" +
    "    <path class=\"st0\"/>\n" +
    "    <g>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
}]);
