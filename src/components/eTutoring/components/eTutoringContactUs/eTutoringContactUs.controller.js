(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringContactUsController',
        function ($mdDialog, UserProfileService, MailSenderService, $timeout, ENV, $log) {
            'ngInject';
            this.formData = {};
            this.showSpinner = true;
            UserProfileService.getProfile().then(function(profile){
                if (angular.isDefined(profile)) {
                    this.formData.name = profile.nickname || undefined;
                    this.formData.email = profile.email || undefined;
                }
            });

            this.sendContactUs = function(authform){
                this.showError = false;

                if (!authform.$invalid) {
                    this.startLoader = true;
                    var appName = ENV.firebaseAppScopeName;
                    var emailsArr = ['support@zinkerz.com'];
                    var message = '' +
                        'A new student contacted you through the live lessons tab' +
                        'App Name: ' + appName + '<br/>' +
                        'Email: ' + this.formData.email;
                    var mailRequest = {
                        subject: 'contact us',
                        message: message,
                        emails: emailsArr,
                        appName: appName,
                        templateKey: 'zoeContactUs'
                    };

                    MailSenderService.postMailRequest(mailRequest).then(function(){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showSuccess = true;
                        });
                    }).catch(function(mailError){
                        this.fillLoader = true;
                        $timeout(function(){
                            this.startLoader = this.fillLoader = false;
                            this.showError = true;
                            $log.error('ETutoringContactUsController:sendContactUs:: error send mail', mailError);
                        });
                    });
                }
            };


            this.closeDialog = function () {
                $mdDialog.cancel();
            };
        });
})(angular);
