(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                        "ZNK_CHAT":{
                            "MY_CHAT": "MY CHATS",
                            "SUPPORT": "Support",
                            "PLACEHOLDER": "Type..."
                        }
                    }
                );
            });
})(angular);
