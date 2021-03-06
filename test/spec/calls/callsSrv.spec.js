describe('testing service "CallsSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.calls', 'htmlTemplates', 'storage.mock', 'testUtility', 'user.mock', 'env.mock'));

    var _deps = {};
    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'CallsSrv',
            'UserProfileService',
            'CallsStatusEnum',
            'InfraConfigSrv',
            'TestUtilitySrv',
            'UtilitySrv',
            'ENV'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.CallsSrv = _deps.TestUtilitySrv.general.convertAllAsyncToSync(_deps.CallsSrv);

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
    }));

    xit('given when click on call button should save data to root calls', function () {
        var callsDataGuid = '123456789-data-guid';

        var callerId = _deps.UserProfileService.__currUserId;
        var receiverId = '11223344';

        _deps.CallsSrv.callsStateChanged(receiverId);

        var expectedRootCalls = {
            guid: {
                callerId: callerId,
                receiverId: receiverId,
                status: _deps.CallsStatusEnum.PENDING_CALL.enum,
                guid: callsDataGuid
            }
        };
        expect(_deps.GlobalStorage.adapter.__db.calls).toEqual(jasmine.objectContaining(expectedRootCalls));
    });

});
