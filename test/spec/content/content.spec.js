describe('content service', function() {

    beforeEach(module('testUtility'));

    beforeEach(module('znk.infra.content', function(ContentSrvProvider) {
        ContentSrvProvider.setContent(['$q',
            function ($q) {
                var mockData = {
                    revisionManifest: {
                        drill10: {
                            rev:1
                        },
                        drill11: {
                            rev: 1
                        },
                        drill13: {
                            rev: 7
                        },
                        drill14: {
                            rev: 1
                        }
                    },
                    latestRevisions: {
                        drill10: {
                            rev:1
                        },
                        drill11: {
                            rev: 2
                        },
                        drill12: {
                            rev: 2
                        },
                        drill13: {
                            rev: 2
                        },
                        drill14: {
                            rev: 2,
                            takeLatest: true
                        }
                    }
                };

                return $q.when({
                    latestRevisions: mockData.latestRevisions,
                    revisionManifest: mockData.revisionManifest,
                    create: function(path) {
                        return { set: angular.noop, get: function() { return path; } };
                    },
                    contentRoot: 'mockData/content/',
                    userRoot: 'mockData/users/0ef5a913-4a69-4c75/contentSync',
                    key: 'key666'
                });
            }
        ]);
    }));


    var ContentSrv, TestUtilitySrv;

    var actions;

    beforeEach( inject( function(_ContentSrv_, _TestUtilitySrv_){
        ContentSrv = _ContentSrv_;
        TestUtilitySrv = _TestUtilitySrv_;

        actions = TestUtilitySrv.general.convertAllAsyncToSync(ContentSrv);
    }));

    it('make sure this functions exist: getRev, setRev, getContent, getAllContentIdsByKey', function() {
        expect(ContentSrv.getRev).toEqual(jasmine.any(Function));
        expect(ContentSrv.setRev).toEqual(jasmine.any(Function));
        expect(ContentSrv.getContent).toEqual(jasmine.any(Function));
        expect(ContentSrv.getAllContentIdsByKey).toEqual(jasmine.any(Function));
    });

    it('when practice is in both user revisionManifest and latestRevisions and it\'s the same, return that rev', function() {
        expect(actions.getContent({ exerciseId: 10, exerciseType: 'drill' })).toEqual('mockData/content/drill10-rev-1');
    });

    it('when practice is in both user revisionManifest and in latestRevisions and user ' +
        'revisionManifest is lower then latestRevisions then return user revisionManifest rev', function() {
        expect(actions.getContent({ exerciseId: 11, exerciseType: 'drill' })).toEqual('mockData/content/drill11-rev-1');
    });

    it('when practice is only in latestRevisions and not exist in user revisionManifest then return latestRevisions rev', function() {
        expect(actions.getContent({ exerciseId: 12, exerciseType: 'drill' })).toEqual('mockData/content/drill12-rev-2');
    });

    it('when practice is in both user revisionManifest and in latestRevisions and user ' +
        'revisionManifest is higher then latestRevisions (which mean a bug maybe) then return latestRevisions rev', function() {
        expect(actions.getContent({ exerciseId: 13, exerciseType: 'drill' })).toEqual('mockData/content/drill13-rev-2');
    });

    it('when practice is in both user revisionManifest and in latestRevisions and latestRevisions ' +
        'has a takeLatest prop of true then return latestRevisions rev even if user revisionManifest lower then latestRevisions', function() {
        expect(actions.getContent({ exerciseId: 14, exerciseType: 'drill' })).toEqual('mockData/content/drill14-rev-2');
    });
});
