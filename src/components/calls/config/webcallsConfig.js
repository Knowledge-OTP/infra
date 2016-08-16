// (function (angular) {
//     'use strict';
//
//     angular.module('znk.infra.calls')
//         .config(function (WebcallSrvProvider, ENV) {
//             'ngInject';
//             WebcallSrvProvider.setCallCred({
//                 username: ENV.plivoUsername,
//                 password: ENV.plivoPassword
//             });
//         });
// })(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider) {
            'ngInject';
            // TODO: revert this file before pushing!
            WebcallSrvProvider.setCallCred({
                username: 'devUsrZinkerz160726161534',
                password: 'zinkerz$9999'
            });
        });
})(angular);
