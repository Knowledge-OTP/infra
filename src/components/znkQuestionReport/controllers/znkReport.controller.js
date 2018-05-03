(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport').controller('znkReportCtrl',
        function($log, $mdDialog, $timeout, $http, $translate, ENV, AuthService, MailSenderService, reportData) {
            'ngInject';

            var self = this;
            var userAuth;
            self.reportData = reportData;
            self.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            AuthService.getAuth().then(authData => {
                userAuth = authData;
                self.reportData.email = authData.email;
            });
            var MAIL_TO_SEND = 'support@zinkerz.com';
            var TEMPLATE_KEY = 'zinkerz-report-question';
            var EMAIL_SUBJECT = $translate('REPORT_POPUP.REPORT_QUESTION');
            var emailMessagePromise = $translate('REPORT_POPUP.MESSAGE');

            self.success = false;
            emailMessagePromise.then(function (message) {
                self.reportData.message = message;
            });

            $timeout(function () {
                document.getElementById('report-textarea').focus();
            });

            this.stopBubbling = function (e) {
                if (e.stopPropagation) { e.stopPropagation(); }
                if (e.cancelBubble !== null) { e.cancelBubble = true; }
            };

            this.sendFrom = function () {
                if (self.reportForm.$valid) {
                    self.startLoader = true;
                    self.reportData.email = self.reportData.email ?
                        self.reportData.email : userAuth.email || 'N/A';

                    // subject format: ReportQuestion - [App Name]
                    var emailSubject = EMAIL_SUBJECT;
                    emailSubject += ' - ' + self.reportData.app;

                    var ADD_TO_MESSAGE = '<br><br>' + 'App: ' + ENV.firebaseAppScopeName + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question ID: ' + self.reportData.id + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question QUID: ' + self.reportData.quid + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise ID: ' + self.reportData.parentId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise Type ID: ' + self.reportData.parentTypeId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userEmail: ' + self.reportData.email + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userId: ' + userAuth.uid;

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

                        if (res.data) {
                            self.success = true;
                        } else {
                            $log.error('Error sending mail');
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
        });
})(angular);
