(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport',
        [
            'ngMaterial',
            'znk.infra.popUp',
            'pascalprecht.translate',
            'znk.infra.auth',
            'znk.infra.analytics',
            'znk.infra.general',
            'znk.infra.user',
            'znk.infra.svgIcon',
            'znk.infra.mailSender'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'close-popup': 'components/znkQuestionReport/svg/close-popup.svg',
                    'report-question-icon': 'components/znkQuestionReport/svg/report-question-icon.svg',
                    'completed-v-report-icon': 'components/znkQuestionReport/svg/completed-v-report.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .component('znkQuestionReport', {
            bindings: {
                reportData: '='
            },
            template: '<svg-icon class="report-btn" name="report-question-icon" title="{{\'REPORT_POPUP.REPORT_QUESTION\' | translate}}" ng-click="vm.showReportDialog()"></svg-icon>',
            controllerAs: 'vm',
            controller: ["$mdDialog", "$translatePartialLoader", function ($mdDialog, $translatePartialLoader) {
                'ngInject';
                var vm = this;

                $translatePartialLoader.addPart('znkQuestionReport');

                vm.showReportDialog = function () {
                    $mdDialog.show({
                        locals:{ reportData: vm.reportData },
                        controller: 'znkReportCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkQuestionReport/templates/znkReport.template.html',
                        clickOutsideToClose: true
                    });
                };
            }]
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport').controller('znkReportCtrl',
        ["$log", "$mdDialog", "$timeout", "$http", "ENV", "AuthService", "MailSenderService", "reportData", function($log, $mdDialog, $timeout, $http, ENV, AuthService, MailSenderService, reportData) {
            'ngInject';

            var self = this;
            var userAuth = AuthService.getAuth();
            var MAIL_TO_SEND = 'ofir@zinkerz.com';
            var TEMPLATE_KEY = 'reportQuestion';
            var EMAIL_SUBJECT = 'Report Question';

            self.success = false;
            self.reportData = reportData;
            self.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            self.reportData.email = userAuth.auth.email;
            self.reportData.message = 'Hello Support,\r\n' +
                                        'I\'ve noticed the following error in this question:\r\n';

            this.sendFrom = function () {
                if (self.reportForm.$valid) {
                    self.startLoader = true;
                    self.reportData.email = self.reportData.email ? self.reportData.email : userAuth.auth.email;

                    // subject format: ReportQuestion - [App Name]
                    var emailSubject = EMAIL_SUBJECT;
                    emailSubject += ' - ' + self.reportData.app;

                    var ADD_TO_MESSAGE = '<br><br>' + 'App: ' + ENV.firebaseAppScopeName + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question ID: ' + self.reportData.id + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question QUID: ' + self.reportData.quid + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise ID: ' + self.reportData.parentId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise Type ID: ' + self.reportData.parentTypeId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userEmail: ' + self.reportData.email + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userId: ' + userAuth.auth.uid;

                    var message = self.reportData.message + ADD_TO_MESSAGE;

                    var dataToSend = {
                        emails: [MAIL_TO_SEND],
                        message: message,
                        subject: emailSubject,
                        appName: ENV.firebaseAppScopeName,
                        templateKey: TEMPLATE_KEY
                    };

                    MailSenderService.postMailRequest(dataToSend).then(function (res) {
                        self.fillLoader = true;
                        $timeout(function () {
                            self.startLoader = self.fillLoader = false;
                        }, 100);

                        if (res.data.success) {
                            self.success = true;
                        }
                    }, function (message) {
                        $log.error(message);

                        self.fillLoader = true;
                        $timeout(function () {
                            self.startLoader = self.fillLoader = false;
                        }, 100);
                    });
                }
            };
            this.cancel = function () {
                $mdDialog.cancel();
            };
        }]);
})(angular);

angular.module('znk.infra.znkQuestionReport').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkQuestionReport/svg/close-popup.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-596.6 492.3 133.2 133.5\" xml:space=\"preserve\" class=\"close-pop-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "	.close-pop-svg {width: 100%; height: auto;}\n" +
    "	.close-pop-svg .st0{fill:none;enable-background:new    ;}\n" +
    "	.close-pop-svg .st1{fill:none;stroke:#ffffff;stroke-width:8;stroke-linecap:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/completed-v-report.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-1040 834.9 220.4 220.4\" xml:space=\"preserve\" class=\"completed-v-feedback-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "	.completed-v-feedback-svg {width: 100%; height: auto;}\n" +
    "	.completed-v-feedback-svg .st0{fill:none;enable-background:new    ;}\n" +
    "	.completed-v-feedback-svg .st1{fill:#CACBCC;}\n" +
    "	.completed-v-feedback-svg .st2{display:none;fill:none;}\n" +
    "	.completed-v-feedback-svg .st3{fill:#D1D2D2;}\n" +
    "	.completed-v-feedback-svg .st4{fill:none;stroke:#FFFFFF;stroke-width:11.9321;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M-401,402.7\"/>\n" +
    "<circle class=\"st1\" cx=\"-929.8\" cy=\"945.1\" r=\"110.2\"/>\n" +
    "<circle class=\"st2\" cx=\"-929.8\" cy=\"945.1\" r=\"110.2\"/>\n" +
    "<path class=\"st3\" d=\"M-860.2,895.8l40,38.1c-5.6-55.6-52.6-99-109.6-99c-60.9,0-110.2,49.3-110.2,110.2\n" +
    "	c0,60.9,49.3,110.2,110.2,110.2c11.6,0,22.8-1.8,33.3-5.1l-61.2-58.3L-860.2,895.8z\"/>\n" +
    "<polyline class=\"st4\" points=\"-996.3,944.8 -951.8,989.3 -863.3,900.8 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/report-flag.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\"\n" +
    "	 class=\"flag-svg\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .flag-svg .st0 {\n" +
    "            fill: #ffffff;\n" +
    "            stroke-width: 5;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "        .flag-svg {\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"kUxrE9.tif\">\n" +
    "	<g>\n" +
    "		<path class=\"st0\" id=\"XMLID_93_\" d=\"M-140.1,287c0.6-1.1,1.7-1.7,2.9-1.4c1.3,0.3,2,1.1,2.3,2.3c1.1,4,2.1,8,3.2,12c2.4,9.3,4.9,18.5,7.3,27.8\n" +
    "			c0.1,0.3,0.2,0.6,0.2,0.9c0.3,1.7-0.6,3-2.1,3.3c-1.4,0.3-2.8-0.5-3.3-2.1c-1-3.6-2-7.3-2.9-10.9c-2.5-9.5-5-19-7.6-28.6\n" +
    "			C-140.1,290-140.8,288.3-140.1,287M-89.6,289.1c-1,6.8-2.9,13-10,16c-3.2,1.4-6.5,1.6-9.9,0.9c-2-0.4-4-0.7-6-0.6c-4.2,0.3-7.1,2.7-9,6.4\n" +
    "			c-0.3,0.5-0.5,1.1-0.9,2c-0.3-1-0.5-1.7-0.8-2.5c-2-7-3.9-14.1-5.9-21.2c-0.3-1-0.1-1.7,0.5-2.4c4.5-6,11-7.4,17.5-3.6\n" +
    "			c3.4,2,6.7,4.2,10.2,6.1c1.9,1,3.9,1.9,5.9,2.4c3.2,0.9,5.9,0,7.9-2.6C-90,289.7-89.8,289.4-89.6,289.1z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/report-question-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 141.3 179.7\" class=\"report-question-icon\">\n" +
    "	    <style type=\"text/css\">\n" +
    "        .report-question-icon {\n" +
    "            fill: #ffffff;\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"_x33_UU5wB.tif\">\n" +
    "	<g>\n" +
    "		<path d=\"M141.3,68.7c0,0.7,0,1.3,0,2c-6.7,12.2-18,17.3-31,18.9c-10.5,1.3-21.2,1.6-31.7,3.2c-9.7,1.5-18.4,5.5-24.3,14.1\n" +
    "			c-1.8,2.6-2,4.8-0.5,7.7c8,16.3,15.7,32.6,23.6,49c4.2,8.8,3.8,10.4-3.9,16.1c-2.3,0-4.7,0-7,0c-1.8-2.7-3.8-5.3-5.2-8.3\n" +
    "			c-9.8-20-19.4-40.1-29.1-60.1C21.8,90.4,11.7,69.4,1.6,48.5c-1.8-3.7-2.6-8,0.6-10.6c2.5-2.1,6.6-3,9.9-2.9\n" +
    "			c2.2,0.1,4.3,2.9,6.5,4.6c8.9-11.4,14.8-15.2,28.2-17.5c5.9-1,11.9-0.9,17.9-1.4c16.6-1.3,33.1-2.9,42.7-20.7\n" +
    "			c3.3,6.8,6.4,13,9.4,19.2C124.9,35.7,133.1,52.2,141.3,68.7z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/templates/znkReport.template.html",
    "<div class=\"report-dialog\">\n" +
    "    <md-dialog class=\"base base-border-radius report-container\" translate-namespace=\"REPORT_POPUP\">\n" +
    "        <div class=\"top-icon-wrap\">\n" +
    "            <div class=\"top-icon\">\n" +
    "                <div class=\"round-icon-wrap\">\n" +
    "                    <svg-icon name=\"report-question-icon\"></svg-icon>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"popup-header\">\n" +
    "            <div class=\"close-popup-wrap\" ng-click=\"vm.cancel();\">\n" +
    "                <svg-icon name=\"close-popup\"></svg-icon>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <md-dialog-content>\n" +
    "            <div class=\"report-inner\">\n" +
    "                <div class=\"main-title\" translate=\".REPORT_QUESTION\"></div>\n" +
    "                <ng-switch on=\"vm.success\">\n" +
    "                    <section ng-switch-when=\"false\">\n" +
    "                        <div class=\"sub-title\" translate=\".SUB_TITLE\"></div>\n" +
    "                        <form novalidate name=\"vm.reportForm\" class=\"base-form\" ng-submit=\"vm.sendFrom();\">\n" +
    "\n" +
    "							<textarea\n" +
    "                                    required\n" +
    "                                    name=\"messageFeedback\"\n" +
    "                                    ng-model=\"vm.reportData.message\"\n" +
    "                                    placeholder=\"{{'REPORT_POPUP.MESSAGE' | translate}}\">\n" +
    "                            </textarea>\n" +
    "\n" +
    "                            <label\n" +
    "                                    ng-class=\"{'hidden': !(vm.reportForm.messageFeedback.$invalid && vm.reportForm.$submitted) }\"\n" +
    "                                    translate=\".REQUIRED_FIELD\">\n" +
    "                            </label>\n" +
    "\n" +
    "                            <input\n" +
    "                                    required\n" +
    "                                    type=\"email\"\n" +
    "                                    name=\"emailFeedback\"\n" +
    "                                    placeholder=\"{{'REPORT_POPUP.EMAIL' | translate}}\"\n" +
    "                                    ng-model=\"vm.reportData.email\"\n" +
    "                                    ng-minlength=\"5\"\n" +
    "                                    ng-maxlength=\"254\">\n" +
    "\n" +
    "                            <label\n" +
    "                                    ng-class=\"{'hidden': !(vm.reportForm.emailFeedback.$invalid && vm.reportForm.$submitted) }\"\n" +
    "                                    translate=\".CORRECT_EMAIL\">\n" +
    "                            </label>\n" +
    "\n" +
    "                            <button\n" +
    "                                    class=\"md-button success success-green drop-shadow\"\n" +
    "                                    element-loader\n" +
    "                                    fill-loader=\"vm.fillLoader\"\n" +
    "                                    show-loader=\"vm.startLoader\"\n" +
    "                                    bg-loader=\"'#72ab40'\"\n" +
    "                                    precentage=\"50\"\n" +
    "                                    font-color=\"'#FFFFFF'\"\n" +
    "                                    bg=\"'#87ca4d'\">\n" +
    "                                <span translate=\".SEND\"></span>\n" +
    "                            </button>\n" +
    "                            <!--<div class=\"user-details-border\"></div>-->\n" +
    "                            <!--<div class=\"user-email\" ng-if=\"vm.userEmail\" translate=\".USER_EMAIL\"-->\n" +
    "                                 <!--translate-values=\"{userEmail: vm.userEmail}\"></div>-->\n" +
    "                            <!--<div class=\"user-id\" ng-if=\"vm.userId\" translate=\".USER_ID\"-->\n" +
    "                                 <!--translate-values=\"{userId: vm.userId}\"></div>-->\n" +
    "                        </form>\n" +
    "                    </section>\n" +
    "                    <section ng-switch-default class=\"success-report\">\n" +
    "                        <svg-icon name=\"completed-v-report-icon\"></svg-icon>\n" +
    "                        <div class=\"success-msg\">\n" +
    "                            <div translate=\".THANKS\"></div>\n" +
    "                            <div translate=\".OPINION\"></div>\n" +
    "                        </div>\n" +
    "                        <md-button\n" +
    "                                class=\"success success-green drop-shadow\"\n" +
    "                                ng-click=\"vm.cancel();\">\n" +
    "                            <span translate=\".DONE\"></span>\n" +
    "                        </md-button>\n" +
    "                    </section>\n" +
    "                </ng-switch>\n" +
    "            </div>\n" +
    "        </md-dialog-content>\n" +
    "    </md-dialog>\n" +
    "</div>\n" +
    "");
}]);
