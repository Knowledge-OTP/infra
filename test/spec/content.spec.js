describe('content service', function() {

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
                        }
                    }
                };

                function updatePublicationCb(cb) {
                    cb({ key: function() {  return 'key666'; }, val: function() {return {
                        drill10: {
                            rev:1
                        },
                        drill11: {
                            rev: 2
                        },
                        drill12: {
                            rev: 2
                        }
                    }} });
                }

                return $q.when({
                    latestRevisions: mockData.latestRevisions,
                    revisionManifest: mockData.revisionManifest,
                    create: function(path) {
                        return { set: angular.noop, get: function() { return { value: 666 } } };
                    },
                    updatePublication: updatePublicationCb,
                    contentRoot: 'mockData/content/',
                    userRoot: 'mockData/users/0ef5a913-4a69-4c75/contentSync',
                    key: 'key666'
                });
            }
        ]);
    }));


    var ContentSrv;

    beforeEach( inject( function(_ContentSrv_){
        ContentSrv = _ContentSrv_;
    }));

    it('make sure this functions exist: getRev, setRev, getContent', function() {
        expect(ContentSrv.getRev).toEqual(jasmine.any(Function));
        expect(ContentSrv.setRev).toEqual(jasmine.any(Function));
        expect(ContentSrv.getContent).toEqual(jasmine.any(Function));
    });


});