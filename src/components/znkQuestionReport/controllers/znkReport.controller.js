(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport').controller('znkReportCtrl',
        function($log, $mdDialog, $timeout, $http, ENV, AuthService, MailSenderService, reportData) {
            'ngInject';

            var self = this;
            var userAuth = AuthService.getAuth();
            var MAIL_TO_SEND = 'ofir@zinkerz.com';
            var TEMPLATE_KEY = 'reschedule';
            var EMAIL_SUBJECT = 'Report Question';

            self.success = false;
            self.reportData = reportData;
            self.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            self.reportData.email = userAuth.auth.email;
            self.reportData.message = 'Hello Support,\r\n' +
                                        'I\'ve noticed the following error in this question:';

            this.sendFrom = function () {
                if (self.reportForm.$valid) {
                    self.startLoader = true;
                    self.reportData.email = self.reportData.email ? self.reportData.email : userAuth.auth.email;

                    // subject format: ReportQuestion - [App Name]
                    var emailSubject = EMAIL_SUBJECT;
                    emailSubject += ' - ' + self.reportData.app;

                    var ADD_TO_MESSAGE = '\r\n\r\n' + 'App: ' + ENV.firebaseAppScopeName + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'Question ID: ' + self.reportData.id + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'Question QUID: ' + self.reportData.quid + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'Exercise ID: ' + self.reportData.exerciseID + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'Exercise Type ID: ' + self.reportData.exerciseTypeID + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'userEmail: ' + self.reportData.email + ' | ';
                    ADD_TO_MESSAGE += '\r\n' + 'userId: ' + userAuth.auth.uid;

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
        });
})(angular);
