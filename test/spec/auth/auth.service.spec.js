/* eslint no-undef: 0 */
xdescribe('testing service "AuthService":', function () {
    beforeEach(angular.mock.module('actWebLogin', 'pascalprecht.translate', 'actShared'));

    beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {});
    }));

    beforeEach(angular.mock.module('firebase', function ($provide) {
        $provide.service('$firebaseAuth', function ($q) {
            return function () {
                return {
                    $createUser: function $createUser() {
                        var defer = $q.defer();
                        return defer.promise;
                    },
                    $unauth: angular.noop
                };
            };
        });

        $provide.service('EstimatedScoreHelperSrv', function () {
            return {};
        });

        $provide.service('EstimatedScoreSrv', function () {
            return {};
        });
    }));

    var AuthService, $timeout;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            AuthService = $injector.get('AuthService');
            $timeout = $injector.get('$timeout');
        }]));

    it('when invoking saveRegistration function then logout should be invoked', function () {
        spyOn(AuthService, 'logout');
        AuthService.saveRegistration({});
        expect(AuthService.logout).toHaveBeenCalled();
    });

    it('when invoking saveRegistration function and no response returned after 15 seconds then the return promise should be rejected', function () {
        var wasRejected;
        AuthService.saveRegistration({}).then(angular.noop, function () {
            wasRejected = true;
        });
        $timeout.flush(15000);
        expect(wasRejected).toBe(true);
    });

    xit('Test login user', function () {
        MockFirebase.override();

        var loginUser = {
            email: 'publisher@zinkerz.com',
            password: 'publisher123'
        };
        var ref = AuthService.ref();
        ref.authWithPassword(loginUser);

        ref.onAuth(function (authData) {
            ref.flush();
            expect(authData.uid).toBe(5);
        });
    });
});
