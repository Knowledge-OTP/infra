(function (angular) {
    'use strict';

    angular.module('znk.infra.auth')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "AUTH_HELPER": {
                        "DEFAULT_ERROR_MESSAGE": "An error has occurred, please try again later.",
                        "FACEBOOK_ERROR": "An error has occurred with facebook, please try again later.",
                        "EMAIL_EXIST": "Email already exists. Try a different email address.",
                        "INVALID_EMAIL": "Invalid email address.",
                        "NO_INTERNET_CONNECTION_ERR": "No internet connection. Please try again later.",
                        "EMAIL_NOT_EXIST": "We don’t recognize that email. Did you use another one to sign up?",
                        "INCORRECT_EMAIL_AND_PASSWORD_COMBINATION": "Incorrect email and password combination."
                    }
                });
            });
    })(angular);