(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "AUDIO_CALLS":{
                        "INCOMING_CALL": "Incoming Call",
                        "OUTGOING_CALL": "Outgoing Call",
                        "REJECT": "DECLINE",
                        "ACCEPT": "ACCEPT",
                        "DECLINE": "DECLINE",
                        "OK": "OK",
                        "CANCEL": "Cancel",
                        "NAME_IS_CALLING": "{{callerName}} is calling...",
                        "CALLING_NAME": "Calling {{calleeName}}",
                        "CALLING_DECLINE": "Call is declined",
                        "CALLING_CANCELED": "Call was canceled",
                        "CALLING_ANSWERED": "Call Answered",
                        "CALL_FAILED_HEADER": "Call Failed",
                        "CALL_FAILED_DESC_GENERAL": "A general error occurred, please try again </br> If this persist, please contact us at </br> <a href='https://www.zinkerz.com/contact' target='_blank'>support@zinkerz.com</a>",
                        "CALL_FAILED_DESC_MICROPHONE": "No microphone access </br> Please make sure you allowed the browser </br> access to your microphone",
                        "CALL_FAILED_DESC_ALREADY_ACTIVE": "{{calleeName}} </br> is already in an active call </br> Please try again later"
                    }
                });
            });
})(angular);
