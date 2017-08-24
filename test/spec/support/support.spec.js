xdescribe('testing service "SupportSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.support', 'storage.mock', 'testUtility','user.mock', 'env.mock','znk.infra.auth', 'znk.infra.teachers'));

    var _deps = {};
    var supportUrl;

    var resultObject = {
        receiverAppName: 'test_app',
        receiverEmail: 'fake@Email.com',
        receiverName: 'fake@Email.com',
        receiverUid: '123456Fake',
        receiverParentEmail: '',
        receiverParentName: ''
    };

    beforeEach(angular.mock.module(function ($provide) {
        $provide.decorator('AuthService', function ($delegate) {
            $delegate.getAuth = function () {
                return new Promise(resolve => resolve(
                    {
                        uid: '123456Fake',
                        auth: {
                            email: 'fake@Email.com'
                        }
                    }
                ));
            };
            return $delegate;
        });

        $provide.factory("GroupsService", function () {
            return {
                getUserData: function(){
                    return {
                        uid: 'fakeUid',
                        auth:{
                            email:'mockEmail'
                        }
                    };
                } }
        });

    }));

    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'TestUtilitySrv',
            'InfraConfigSrv',
            'SupportSrv',
            '$rootScope',
            'ENV'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.getTeacherStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getTeacherStorage, _deps.InfraConfigSrv)();
        _deps.getStudentStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getStudentStorage, _deps.InfraConfigSrv)();
        supportUrl = _deps.ENV.backendEndpoint + 'invitation/support';
    }));




    it('when student not connected to support connectStudentWithSupport function must send correct data to backend', inject(function($http, _$httpBackend_) {
        var supportDataToBackend;
        var respondFromBackend;
        _$httpBackend_.when('POST', supportUrl)
            .respond(function(method, url, data) {         // the "server" returns the data that was send - now we test it.
                supportDataToBackend = angular.fromJson(data);
                return [200, {respond:'ok'}];
            });

        _deps.SupportSrv.connectStudentWithSupport(function(dataToSend){
             respondFromBackend = angular.fromJson(dataToSend.data);
        });

        _$httpBackend_.flush();
        _deps.$rootScope.$digest();

        expect(supportDataToBackend).toEqual(jasmine.objectContaining(resultObject));
        expect(respondFromBackend.respond).toEqual('ok');
    }));

    it('when teacher not connected to support connectStudentWithSupport function must send correct data to backend', inject(function($http, _$httpBackend_) {
        var supportDataToBackend;
        var respondFromBackend;

        _$httpBackend_.when('POST', supportUrl)
            .respond(function(method, url, data) {         // the "server" returns the data that was send - now we test it.
                supportDataToBackend = angular.fromJson(data);
                return [200, {respond:'ok'}];
            });

        _deps.SupportSrv.connectTeacherWithSupport(function(dataToSend){
            respondFromBackend = angular.fromJson(dataToSend.data);
        });

        _$httpBackend_.flush();

        _deps.$rootScope.$digest();


        expect(supportDataToBackend).toEqual(jasmine.objectContaining(resultObject));
        expect(respondFromBackend.respond).toEqual('ok');
    }));
});
