(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "REPORT_POPUP": {
                        "REPORT_QUESTION": "Report Question",
                        "REQUIRED_FIELD" : "This field is required.",
                        "CORRECT_EMAIL"  : "Please enter a valid email address",
                        "EMAIL"          : "Your email address",
                        "PLACEHOLDER"    : "Add your comments or suggestions...",
                        "MESSAGE"        : "Hello Support,\r\nI've noticed the following error in this question:\r\n",
                        "SEND"           : "Send",
                        "SUB_TITLE"      : "Found a mistake in the question? Les us know.",
                        "THANKS"         : "Thank you!",
                        "OPINION"        : "We will improve this question.",
                        "DONE"           : "Done",
                        "USER_EMAIL"     : "email: {{userEmail}}",
                        "USER_ID"        : "uid: {{userId}}"
                    }
                });
            });
})(angular);
