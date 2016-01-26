(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        'znk.infra.config',
        'znk.infra.pngSequence',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.general',
        'znk.infra.scroll',
        'znk.infra.content',
        'znk.infra.znkExercise',
        'znk.infra.storage',
        'znk.infra.utility',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', ['znk.infra.config','znk.infra.utility']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general', ['znk.infra.enum']);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.config', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.storage', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.utility', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', ['znk.infra.enum', 'znk.infra.svgIcon', 'znk.infra.scroll'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg',
                    correct: 'components/znkExercise/svg/correct-icon.svg',
                    wrong: 'components/znkExercise/svg/wrong-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function (angular) {

    function ContentSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$injector', function($q, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {

                                    contentData = dataObj;
                                    contentData.updatePublication(function(updatePublication) {
                                        if(updatePublication.key() !== contentData.key) {
                                            contentData.latestRevisions = updatePublication.val();
                                            contentData.key = updatePublication.key();
                                        }
                                    });
                                    return dataObj;
                                });
                            }
                            return $q.when(contentData);
                        },
                        set: function(practiceName, newData) {
                            contentData.revisionManifest[practiceName] = newData;
                            return $q.when({ rev: newData.rev, status: 'update'});
                        }
                    };
                };
            }

            var contentFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            ContentSrv.getRev = function(practiceName, dataObj) {

                if(!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                    return $q.when({ error: 'No Data Found! ', data: dataObj });
                }

                var userManifest = dataObj.revisionManifest[practiceName];
                var publicationManifest = dataObj.latestRevisions[practiceName];
                var newRev;

                if(angular.isUndefined(publicationManifest)) {
                    return $q.when({ error: 'Not Found', data: dataObj });
                }

                if(!userManifest) {
                    newRev = { rev:  publicationManifest.rev, status: 'new' };
                } else if(userManifest.rev < publicationManifest.rev) {
                    newRev = { rev:  userManifest.rev, status: 'old' };
                } else if(userManifest.rev === publicationManifest.rev) {
                    newRev = { rev:  publicationManifest.rev, status: 'same' };
                } else {
                    newRev = { error: 'failed to get revision!', data: dataObj };
                }

                return $q.when(newRev);
            };

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            // { exerciseId: 10, exerciseType: 'drill' }
            ContentSrv.getContent = function(pathObj) {

                if(!pathObj || !pathObj.exerciseType) {
                    return $q.reject({ error: 'Error: getContent require exerciseType!' });
                }

                var path = (pathObj.exerciseId) ? pathObj.exerciseType+pathObj.exerciseId : pathObj.exerciseType;

                return contentDataFunc().get().then(function(dataObj) {

                    return ContentSrv.getRev(path, dataObj).then(function(result) {

                        if(result.error) {
                            return $q.when(result);
                        }

                        if(!dataObj.contentRoot) {
                            return $q.when({ error: 'Error: getContent require contentRoot to be defined in config phase!' });
                        }

                        if(!dataObj.userRoot) {
                            return $q.when({ error: 'Error: getContent require userRoot to be defined in config phase!' });
                        }

                        var contentPath = dataObj.contentRoot+path+'-rev-'+result.rev;

                        var content =  dataObj.create(contentPath);

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        return content.get();

                    });
                });
            };

            ContentSrv.getAllContentIdsByKey = function(key) {
                var arrayOfKeys = [];
                return contentDataFunc().get().then(function(dataObj) {
                    for(var objKey in dataObj.latestRevisions) {
                       if(objKey.indexOf(key) !== -1) {
                           arrayOfKeys.push(objKey);
                       }
                    }
                    return arrayOfKeys;
                });
            };

            return ContentSrv;
        }];
    }

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').service('ContentAvailSrv', [
        '$q', '$parse', 'InfraConfigSrv',
        function ($q, $parse, InfraConfigSrv) {
            var PURCHASED_ALL = 'all';

            function getUserPurchaseData(){
                var StorageService = InfraConfigSrv.getStorageService();
                var purchaseDataPath = StorageService.variables.appUserSpacePath + '/purchase';
                var defValues = {
                    daily: 0,
                    exam: {},
                    tutorial: {},
                    subscription: {}
                };
                return StorageService.get(purchaseDataPath,defValues);
            }

            function getFreeContentData(){
                var StorageService = InfraConfigSrv.getStorageService();
                var freeContentPath = 'freeContent';
                var defValues = {
                    daily: 0,
                    exam: {},
                    tutorial: {}
                };
                return StorageService.get(freeContentPath,defValues);
            }

            function idToKeyInStorage(id){
                return 'id_' + id;
            }

            function _hasSubscription(subscriptionObj){
                return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
            }

            function _baseIsEntityAvail(){
                return $q.all([getUserPurchaseData(),getFreeContentData()]).then(function(res){
                    var purchaseData = res[0];
                    var hasSubscription = _hasSubscription(purchaseData.subscription);
                    if(hasSubscription){
                        return true;
                    }else{
                        return res;
                    }
                });
            }

            function _isExamPurchased(purchaseData,examId){
                var examKeyProp = idToKeyInStorage(examId);
                return !!(purchaseData.exam === PURCHASED_ALL  || purchaseData.exam[examKeyProp]);
            }

            function _isFreeContent(freeContentData,pathArr){
                var fullPath = pathArr.join('.');
                var isFreeGetter = $parse(fullPath);
                return !!isFreeGetter(freeContentData);
            }

            this.hasSubscription = function(){
                return getUserPurchaseData().then(function(purchaseData){
                    return _hasSubscription(purchaseData.subscription);
                });
            };

            this.isDailyAvail = function(dailyOrder){
                if(!angular.isNumber(dailyOrder) || isNaN(dailyOrder)){
                    return $q.reject('daily order should be a number');
                }
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    if(freeContent.daily >= dailyOrder){
                        return true;
                    }

                    if(angular.isString(purchaseData.daily)){
                        return purchaseData.daily === PURCHASED_ALL;
                    }else{
                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    }
                });
            };

            this.isExamAvail = function(examId){
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    var isPurchased = _isExamPurchased(purchaseData,examId);
                    if(isPurchased){
                        return true;
                    }

                    return _isFreeContent(freeContent,['exam',idToKeyInStorage(examId)]);
                });
            };

            this.isSectionAvail = function(examId,sectionId){
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    var examKeyProp = idToKeyInStorage(examId);
                    var sectionKeyProp = idToKeyInStorage(sectionId);

                    var isExamPurchased = _isExamPurchased(purchaseData,examId);
                    if(isExamPurchased ){
                        return true;
                    }

                    return _isFreeContent(freeContent,['exam',examKeyProp,'sections',sectionKeyProp]);
                });
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('AnswerTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['SELECT_ANSWER',0 ,'select answer'],
                ['FREE_TEXT_ANSWER',1 ,'free text answer'],
                ['RATE_ANSWER',3 ,'rate answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL TEST', 0, 'test'],
                ['MINI TEST', 1, 'miniTest']]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.enum').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.enum').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExerciseTimeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['5_MIN', 5, '5 min'],
                ['10_MIN', 10, '10 min'],
                ['15_MIN', 15, '15 min']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExerciseTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'Tutorial'],
                ['PRACTICE', 2, 'Practice'],
                ['GAME', 3, 'Game'],
                ['SECTION', 4, 'Section'],
                ['DRILL', 5, 'Drill']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        READING: 1,
        WRITING: 2,
        LISTENING: 3,
        SPEAKING: 4,
        ENGLISH: 5,
        SCIENCE: 6
    };

    angular.module('znk.infra.enum').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.enum').factory('SubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var SubjectEnum = new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['READING', subjectEnum.READING, 'reading'],
                ['WRITING', subjectEnum.WRITING, 'writing'],
                ['LISTENING', subjectEnum.LISTENING, 'listening'],
                ['SPEAKING', subjectEnum.SPEAKING, 'speaking'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english'],
                ['SCIENCE', subjectEnum.SCIENCE, 'science']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);

'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXERCISE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';


            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId,guid){
                var storage = InfraConfigSrv.getStorageService();
                return {
                    exerciseId: exerciseId,
                    exerciseTypeId: exerciseTypeId,
                    startedTime: storage.variables.currTimeStamp,
                    questionResults: [],
                    guid: guid
                };
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(exerciseResultPath);
            }

            function _getExerciseResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXERCISE_RESULTS_GUIDS_PATH);
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId) {
                var getExamResultProm;
                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum){
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if(!exerciseResultsGuids[exerciseTypeId]){
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        var storage = InfraConfigSrv.getStorageService();


                        var newGuid = UtilitySrv.general.createGuid();

                        var dataToSave = {};

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                        dataToSave[EXERCISE_RESULTS_GUIDS_PATH] = exerciseResultsGuids;

                        var exerciseResultPath = _getExerciseResultPath(newGuid);
                        var initResult = _getInitExerciseResult(exerciseTypeId,exerciseId,newGuid);
                        dataToSave[exerciseResultPath] = initResult;

                        var setProm;
                        if(getExamResultProm){
                            setProm = getExamResultProm.then(function(examResult){
                                if(!examResult.sectionResults){
                                    examResult.sectionResults = {};
                                }
                                examResult.sectionResults[exerciseId] = newGuid;
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            });
                        }

                        return $q.when(setProm).then(function(){
                            return storage.set(dataToSave);
                        }).then(function(res){
                            return res[exerciseResultPath];
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function(result){
                        var initResult = _getInitExerciseResult(exerciseTypeId,exerciseId,resultGuid);
                        if(result.guid !== resultGuid){
                            angular.extend(result,initResult);
                        }else{
                            UtilitySrv.object.extendWithoutOverride(result, initResult);
                        }
                        return result;
                    });
                });
            };

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                var storage = InfraConfigSrv.getStorageService();
                var path = _getExamResultPath(guid);
                return storage.get(path).then(function(examResult){
                    var initResult = _getInitExamResult(examId, guid);
                    if(examResult.guid !== guid){
                        angular.extend(examResult,initResult);
                    }else{
                        UtilitySrv.object.extendWithoutOverride(examResult,initResult);
                    }
                    return examResult;
                });
            }

            function _getInitExamResult(examId, guid){
                return {
                    isComplete: false,
                    startedTime: '%currTimeStamp%',
                    examId: examId,
                    guid: guid,
                    sectionResults:{}
                };
            }

            function _getExamResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXAM_RESULTS_GUIDS_PATH);
            }

            this.getExamResult = function (examId) {
                var storage = InfraConfigSrv.getStorageService();
                return _getExamResultsGuids().then(function (examResultsGuids) {
                    var examResultGuid = examResultsGuids[examId];
                    if (!examResultGuid) {
                        var dataToSave = {};

                        var newExamResultGuid = UtilitySrv.general.createGuid();
                        examResultsGuids[examId] = newExamResultGuid;
                        dataToSave[EXAM_RESULTS_GUIDS_PATH] = examResultsGuids;

                        var examResultPath = _getExamResultPath(newExamResultGuid);
                        var initExamResult = _getInitExamResult(examId, newExamResultGuid);
                        dataToSave[examResultPath] = initExamResult;

                        return storage.set(dataToSave).then(function (res) {
                            return res[examResultPath];
                        });
                    }

                    return _getExamResultByGuid(examResultGuid, examId);
                });
            };
        }
    ]);
})(angular);

/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @znk-prefix a comma separated string of prefixes to the attribute values
 *  @znk-suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv', [
        'SubjectEnum', '$interpolate',
        function (SubjectEnum, $interpolate) {
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToAttrDrv,function(subjectId){
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix )(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix )(scope) : undefined;

                            if(angular.isUndefined(subjectId)){
                                return;
                            }
                            watchDestroyer();

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[subjectId];

                            angular.forEach(attrsArray, function(value, key){
                                var attrVal = subjectNameToAdd;

                                if(attrPrefixes.length){
                                    attrVal = (attrPrefixes[key] || attrPrefixes[0])  + '-' + attrVal;
                                }

                                if(attrSuffixes.length){
                                    attrVal += '-' + (attrSuffixes[key] || attrSuffixes[0]);
                                }

                                attrVal = attrVal.replace(/\s+/g,'');   // regex to clear spaces

                                element.attr(value, attrVal);
                            });

                        });
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs:
 *  subject-id-to-class-drv: expression from which subject id will be taken from.
 *  class-suffix: suffix of the added class
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToClassDrv', [
        'SubjectEnum',
        function (SubjectEnum) {
            return {
                priority: 1000,
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToClassDrv,function(subjectId){
                            if(angular.isUndefined(subjectId)){
                                return;
                            }

                            watchDestroyer();
                            var classToAdd;

                            for(var prop in SubjectEnum){
                                if(SubjectEnum[prop].enum === subjectId){
                                    classToAdd = SubjectEnum[prop].val;
                                    if(attrs.classSuffix){
                                        classToAdd += attrs.classSuffix;
                                    }
                                    break;
                                }
                            }

                            element.addClass(classToAdd);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var storageServiceName;
            this.setStorageServiceName = function(_storageServiceName){
                storageServiceName = _storageServiceName;
            };

            this.$get = [
                '$injector', '$log',
                function ($injector, $log) {
                    var InfraConfigSrv = {};

                    InfraConfigSrv.getStorageService = function(){
                        if(!storageServiceName){
                            $log.$debug('InfraConfigSrv: storage service name was not defined');
                            return;
                        }
                        return $injector.get(storageServiceName);
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);

/**
 * Created by Igor on 8/19/2015.
 */
/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence').directive('pngSequence', [
        '$timeout', 'ExpansionSrcSrv', '$window',
        function ($timeout, ExpansionSrcSrv, $window) {
            return {
                restrict: 'E',
                scope:{
                    onEnded: '&',
                    loop: '&',
                    speed:'&',
                    autoPlay: '&',
                    actions: '='
                },
                link: function (scope, element, attrs) {

                    var indexBound;

                    var requestID;

                    function buildComponent(){
                        var startIndex = +attrs.startIndex;
                        var endIndex = +attrs.endIndex;
                        var imageNum;
                        indexBound = endIndex - startIndex;
                        for(var i = startIndex; i < endIndex ; i++){
                            if(i < 100 || i < 10){
                                imageNum = i < 10 ? '00' + i :'0' + i;
                            }else{
                                imageNum = i;
                            }

                            var htmlTemplate = '<div ' +
                                    /* jshint validthis: true */
                                ' style="background-image: url(\'' + ExpansionSrcSrv.getExpansionSrc(attrs.imgData + imageNum + '.png') + '\'); background-size: cover; will-change: opacity; opacity:0; position: absolute; top:0; left:0;"></div>';

                            element.append(htmlTemplate);
                        }
                    }

                    function destroyCurrent(){
                        element.empty();
                    }

                    function PngAnimation() {
                        this.index = 0;
                        this.imagesDomElem = element[0].children;
                        this.lastTimestamp = false;
                    }


                    function animatePlay(timestamp) {
                        /* jshint validthis: true */
                        if(this.index === indexBound-1 && !scope.loop()){
                            $timeout(function(){
                                var children = element.children();
                                angular.element(children[children.length - 1]).css('display', 'none');
                                scope.onEnded();
                            });
                        }else{
                            if(this.lastTimestamp && (timestamp - this.lastTimestamp) < 40) {
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            } else {
                                this.imagesDomElem[this.index].style.opacity   =  0;
                                this.index = (this.index+1) % indexBound;
                                this.imagesDomElem[this.index].style.opacity   =  1;
                                this.lastTimestamp = timestamp;
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            }
                        }

                    }

                    function observeHandler(){
                        destroyCurrent();
                        if(attrs.imgData && angular.isDefined(attrs.startIndex)&& attrs.endIndex){
                            buildComponent();
                            if(scope.autoPlay()){
                                var animateInstance = new PngAnimation();
                                requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                            }
                        }
                    }

                    function watchFn(){
                        return attrs.imgData + '_' + attrs.startIndex + '_' + attrs.endIndex + '_' + attrs.rotate;
                    }
                    scope.$watch(watchFn,observeHandler);

                    scope.actions = scope.actions || {};
                    scope.actions.play = function(){
                        //added in order for the build function to be executed before the play
                        $timeout(function(){
                            var animateInstance = new PngAnimation();
                            requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                        },0,false);
                    };
                    scope.actions.reset = destroyCurrent;

                    scope.$on('$destroy',function(){
                        $window.cancelAnimationFrame(requestID);
                    });
                }
            };
        }
    ]);
})(angular);
'use strict';

(function () {
    angular.module('znk.infra.popUp').factory('PopUpSrv',[
        '$injector', '$q', '$rootScope', '$animate', '$document',
        function ($injector, $q, $rootScope, $animate, $document) {
            var PopUpSrv = {};

            var $body = angular.element($document[0].body);
            var popUpsPlaceHolderElement = angular.element('<div class="znk-popup"></div>');
            $body.append(popUpsPlaceHolderElement);

            var popupInstance,
                popupDefer;

            PopUpSrv.closePopup = function(reject,reason){
                if(!reason){
                    reason = 'closed';
                }
                popUpsPlaceHolderElement.empty();
                if (popupInstance.scope) {
                    popupInstance.scope.$destroy();
                }
                popupDefer[(reject ? 'reject' : 'resolve')](reason);
            };

            PopUpSrv.popup = function popup(wrapperCls,header,body,buttonsArr){
                //kill current popup if exists
                if(popupInstance){
                    PopUpSrv.closePopup();
                }
                var childScope = $rootScope.$new(true);
                childScope.d = {};

                popupDefer = $q.defer();
                popupInstance = {};
                popupInstance.promise = popupDefer.promise;

                var template =
                    '<div class="%wrapperCls%">' +
                        '<div class="znk-popup-wrapper">' +
                            '<div class="znk-popup-header">%header%</div>' +
                            '<div class="znk-popup-body">%body%</div>' +
                            '<div class="znk-popup-buttons">' +
                                '<div ng-repeat="button in ::d.buttons" class="button-wrapper">' +
                                    '<div class="btn" ' +
                                             'ng-click="d.btnClick(button)" ' +
                                             'ng-class="button.type" ' +
                                             'analytics-on="click" ' +
                                             'analytics-event="click-popup-{{button.text}}" ' +
                                             'analytics-category="popup">{{button.text}}' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                wrapperCls = wrapperCls ? ' ' + wrapperCls : '';
                template = template.replace('%wrapperCls%',wrapperCls);

                header = header || '';
                template = template.replace('%header%',header);

                body = body || '';
                template = template.replace('%body%',body);

                if(angular.isDefined(buttonsArr) && !angular.isArray(buttonsArr)){
                    buttonsArr = [buttonsArr];
                }
                childScope.d.buttons = buttonsArr;
                childScope.d.btnClick = function(button){
                    if(button.hasOwnProperty('rejectVal')){
                        childScope.d.close(button.rejectVal,true);
                    }else{
                        childScope.d.close(button.resolveVal);
                    }
                };

                childScope.d.close = function(reason,reject){
                    var animationLeaveProm = $animate.leave($template);
                    animationLeaveProm.then(function(){
                        if(childScope){
                            childScope.$destroy();
                            childScope = null;
                        }
                        popupInstance = null;
                        if (angular.isDefined(popupDefer) && popupDefer !== null) {
                            var action = reject ? 'reject' : 'resolve';
                            reason = reason || 'close';
                            if(popupDefer[action]){
                                popupDefer[action](reason);
                            }
                            popupDefer = null;
                        }
                    });
                };

                var $template = angular.element(template);
                $animate.enter($template,popUpsPlaceHolderElement);
                //was added because injecting $compile dependency causing circular dependency
                var $compile = $injector.get('$compile');
                $compile(popUpsPlaceHolderElement.contents())(childScope);

                return popupInstance;
            };

            function basePopup(wrapperCls,headerIcon,title,content,btnArr){
                wrapperCls = wrapperCls ? wrapperCls + ' base-popup show-hide-animation' : 'base-popup show-hide-animation';

                headerIcon = headerIcon || '';
                var header = '<div class="icon-wrapper"><svg-icon name="%headerIcon%"></svg-icon></div>';
                header = header.replace('%headerIcon%',headerIcon);

                var body = '<div class="title responsive-title">%title%</div><div class="content">%content%</div>';
                title = title || '';
                body = body.replace('%title%',title);
                content = content || '';
                body = body.replace('%content%',content);

                return PopUpSrv.popup(wrapperCls,header,body,btnArr);
            }

            function BaseButton(text,type,resolveVal,rejectVal){
                var btn = {
                    text: text || '',
                    type: type || ''
                };

                if(rejectVal){
                    btn.rejectVal = rejectVal;
                }else{
                    btn.resolveVal = resolveVal;
                }

                return btn;
            }

            PopUpSrv.error = function error(title,content){
                var btn = new BaseButton('OK',null,'ok');
                return basePopup('error-popup','exclamation-mark',title || 'OOOPS...',content,[btn]);
            };


            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle)
                ];
                return basePopup('error-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.success = function success(title,content){
                var btn = new BaseButton('OK',null,'ok');
                return basePopup('success-popup','exclamation-mark',title || '',content,[btn]);
            };

            PopUpSrv.warning = function warning(title,content,acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle)
                ];
                return basePopup('warning-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.isPopupOpen = function(){
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})();

/**
 * attrs:
 *      actions:
 *          animate: function (scrollTo,animationDuration,transition)
 *      scrollOnMouseWheel: whether to scroll on mouse wheel default false
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll').directive('znkScroll', [
        '$log', '$window', '$timeout', '$interpolate',
        function ($log, $window, $timeout, $interpolate) {
            function setElementTranslateX(element,val,isOffset,minVal,maxVal){
                var domElement = angular.isArray(element) ? element[0] : element;
                var newTranslateX = val;
                if(isOffset){
                    var currTransformVal = domElement.style.transform;
                    var currXMatchRegex = currTransformVal.match(/translateX\((.*)px\)/);
                    var currX;
                    if(!angular.isArray(currXMatchRegex ) || currXMatchRegex.length < 2){
                        $log.debug('failed to math transform value');
                        currX = 0;
                    }else{
                        currX = +currXMatchRegex[1];
                    }
                    newTranslateX += currX;
                }
                minVal = angular.isUndefined(minVal) ? -Infinity : minVal;
                maxVal = angular.isUndefined(maxVal) ? Infinity : maxVal;

                newTranslateX = Math.max(newTranslateX,minVal);
                newTranslateX = Math.min(newTranslateX,maxVal);

                var newTransformValue = 'translateX(' + newTranslateX + 'px)';
                setCssPropery(domElement,'transform',newTransformValue);
            }

            function setCssPropery(element,prop,value){
                var domElement = angular.isArray(element) ? element[0] : element;
                if(value === null){
                    domElement.style[prop] = '';
                }else{
                    domElement.style[prop] = value;
                }
            }

            function getElementWidth(element){
                var domElement = angular.isArray(element) ? element[0] : element;

                var domElementStyle  = $window.getComputedStyle(domElement);
                var domElementMarginRight = +domElementStyle.marginRight.replace('px','');
                var domElementMarginLeft = +domElementStyle.marginLeft.replace('px','');
                return domElement .offsetWidth + domElementMarginRight + domElementMarginLeft;
            }

            return {
                restrict: 'E',
                compile: function(element){
                    var domElement = element[0];

                    var currMousePoint;
                    var containerWidth;
                    var childWidth;

                    function mouseMoveEventHandler(evt){
                        $log.debug('mouse move',evt.pageX);
                        var xOffset = evt.pageX - currMousePoint.x;
                        //var yOffset = evt.pageY - currMousePoint.y;

                        currMousePoint.x = evt.pageX;
                        currMousePoint.y = evt.pageY;
                        moveScroll(xOffset,containerWidth,childWidth);
                    }
                    function mouseUpEventHandler(evt){
                        $log.debug('mouse up',evt.pageX);
                        document.removeEventListener('mousemove',mouseMoveEventHandler);
                        document.removeEventListener('mouseup',mouseUpEventHandler);
                        containerWidth = null;
                        childWidth = null;
                        currMousePoint = null;
                    }
                    function mouseDownHandler(evt){
                        $log.debug('mouse down',evt.pageX);

                        var child = domElement.children[0];
                        if(!child){
                            return;
                        }

                        containerWidth = domElement.offsetWidth;
                        childWidth = getElementWidth(child);

                        currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };


                        document.addEventListener('mousemove',mouseMoveEventHandler);

                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }
                    domElement.addEventListener('mousedown',mouseDownHandler);

                    function moveScroll(xOffset, containerWidth, childWidth/*,yOffset*/){
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        var child = domElement.children[0];

                        if(!child.style.transform){
                            setElementTranslateX(child,0,false,false,minTranslateX,maxTranslateX);
                        }

                        setElementTranslateX(child,xOffset,true,minTranslateX,maxTranslateX);
                    }

                    function setScrollPos(scrollX){
                        var containerWidth = domElement.offsetWidth;
                        var child = domElement.children[0];
                        var childWidth = getElementWidth(child);
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        setElementTranslateX(child,scrollX,false,minTranslateX,maxTranslateX);
                    }

                    return {
                        pre: function(scope,element,attrs){
                            var child = domElement.children[0];
                            if(child){
                                setElementTranslateX(child,0);
                            }

                            var scrollOnMouseWheel = $interpolate(attrs.scrollOnMouseWheel || '')(scope) !== 'false';
                            var containerWidth,childWidth;
                            function mouseWheelEventHandler(evt){
                                $log.debug('mouse wheel event',evt);
                                moveScroll(-evt.deltaY, containerWidth, childWidth);
                            }
                            function mouseEnterEventHandler(){
                                $log.debug('mouse enter');
                                containerWidth = domElement.offsetWidth;
                                childWidth = getElementWidth(domElement.children[0]);
                                domElement.addEventListener('mousewheel',mouseWheelEventHandler);
                            }
                            function mouseUpEventHandler(){
                                $log.debug('mouse leave');
                                domElement.removeEventListener('mousewheel',mouseWheelEventHandler);
                            }
                            if(scrollOnMouseWheel){
                                domElement.addEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.addEventListener('mouseleave',mouseUpEventHandler);
                            }

                            if(attrs.actions){
                                if(angular.isUndefined(scope.$eval(attrs.actions))){
                                    scope.$eval(attrs.actions + '={}');
                                }
                                var actions = scope.$eval(attrs.actions);

                                actions.animate = function(scrollTo,transitionDuration,transitionTimingFunction){
                                    if(transitionDuration && transitionTimingFunction){
                                        var transitionPropVal = 'transform ' + transitionDuration + 'ms ' + transitionTimingFunction;
                                        setCssPropery(child,'transition',transitionPropVal);
                                    }
                                    setScrollPos(scrollTo);
                                    //@todo(igor) may be out of sync
                                    $timeout(function(){
                                        setCssPropery(child,'transition',null);
                                    },transitionDuration,false);
                                };
                            }

                            scope.$on('$destroy',function(){
                                document.removeEventListener('mousemove',mouseMoveEventHandler);
                                document.removeEventListener('mouseup',mouseUpEventHandler);
                                domElement.removeEventListener('mousedown',mouseDownHandler);
                                domElement.removeEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.removeEventListener('mouseleave',mouseUpEventHandler);
                                domElement.removeEventListener('mousewheel',mouseWheelEventHandler);
                            });
                        }
                    };

                }
            };
        }
    ]);

})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q', 'StorageSrv',
        function ($log, $q, StorageSrv) {
            function removeIllegalProperties(source){
                if(angular.isArray(source)){
                    source.forEach(function(item){
                        removeIllegalProperties(item);
                    });
                    return;
                }

                if(angular.isObject(source)){
                    var keys = Object.keys(source);
                    keys.forEach(function(key){
                        var value = source[key];

                        if(key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length)){
                            $log.debug('storageFirebaseAdapter: illegal property was deleted before save',key);
                            delete source[key];
                            return;
                        }

                        removeIllegalProperties(value);
                    });
                    return;
                }
            }

            function storageFirebaseAdapter (endPoint){
                var refMap = {};
                var authObj;
                var rootRef = new Firebase(endPoint);
                refMap.rootRef = rootRef;
                rootRef.onAuth(function(newAuthObj){
                    authObj = newAuthObj;
                });

                function getRef(relativePath){
                    var processedRelativePath = processPath(relativePath,authObj);
                    if(!refMap[processedRelativePath]){
                        refMap[processedRelativePath] = refMap.rootRef.child(processedRelativePath);
                    }
                    return refMap[processedRelativePath];
                }

                function get(relativePath){
                    var defer = $q.defer();

                    var ref = getRef(relativePath);
                    ref.once('value',function(dataSnapshot){
                        defer.resolve(dataSnapshot.val());
                    },function(err){
                        $log.debug('storageFirebaseAdapter: failed to retrieve data for the following path',relativePath,err);
                        defer.reject(err);
                    });
                    return defer.promise;
                }

                function set(relativePathOrObject, newValue){
                    var defer = $q.defer();

                    if(angular.isObject(relativePathOrObject)){
                        var valuesToSet ={};
                        angular.forEach(relativePathOrObject,function(value,key){
                            var processedPath = processPath(key, authObj);
                            valuesToSet[processedPath] = angular.copy(value);
                        });
                        removeIllegalProperties(valuesToSet);
                        refMap.rootRef.update(valuesToSet, function(err){
                            if(err){
                                defer.reject(err);
                            }
                            defer.resolve();
                        });
                    }else{
                        var newValueCopy = angular.copy(newValue);
                        removeIllegalProperties(newValueCopy);
                        var ref = getRef(relativePathOrObject);
                        ref.set(newValueCopy,function(err){
                            if(err){
                                $log.debug('storageFirebaseAdapter: failed to set data for the following path',relativePathOrObject,err);
                                defer.reject(err);
                            }else{
                                defer.resolve(newValueCopy);
                            }
                        });
                    }

                    return defer.promise;
                }

                return {
                    get: get,
                    set: set,
                    __refMap: refMap//for testing
                };
            }

            var pathVariables= StorageSrv.variables;

            var regexString = pathVariables.uid.replace(/\$/g,'\\$');
            var UID_REGEX = new RegExp(regexString,'g');
            function processPath(path,authObj) {
                var processedPath = path.replace(UID_REGEX, authObj.uid);
                return processedPath;
            }
            storageFirebaseAdapter.processPath = function (path,authObj) {
                var processedPath = path.replace(UID_REGEX, authObj.uid);
                return processedPath;
            };

            return storageFirebaseAdapter;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q',
        function ($cacheFactory, $q) {
            var getEntityPromMap = {};

            var entityCache = $cacheFactory('entityCache');

            function StorageSrv(entityGetter, entitySetter) {
                this.getter = function(path){
                    return $q.when(entityGetter(path));
                };

                this.setter = function(path, newVal){
                    return $q.when(entitySetter(path,newVal));
                };
            }

            StorageSrv.prototype.get = function(path, defaultValue){
                var self = this;
                var entity = entityCache.get(path);
                var getProm;
                defaultValue = defaultValue || {};
                var cacheProm = false;

                if (entity) {
                    getProm = $q.when(entity);
                } else {
                    if (getEntityPromMap[path]) {
                        return getEntityPromMap[path];
                    }
                    cacheProm = true;
                    getProm = this.getter(path).then(function (_entity) {
                        _entity = angular.isUndefined(_entity) || _entity === null ? {} : _entity;
                        entityCache.put(path, _entity);
                        delete getEntityPromMap[path];
                        return _entity;
                    });
                }
                getProm = getProm.then(function(_entity){
                    var keys = Object.keys(defaultValue);
                    keys.forEach(function(key){
                        if (angular.isUndefined(_entity[key])) {
                            _entity[key] = angular.copy(defaultValue[key]);
                        }
                    });
                    if(angular.isObject(_entity) && !_entity.$save){
                        _entity.$save = self.set.bind(self,path,_entity);
                    }
                    return _entity;
                });

                if (cacheProm) {
                    getEntityPromMap[path] = getProm;
                }

                return getProm;
            };

            StorageSrv.prototype.set = function(pathStrOrObj, newValue){
                var self = this;
                return this.setter(pathStrOrObj, newValue).then(function(){
                    var dataToSaveInCache = {};

                    if(!angular.isObject(pathStrOrObj)){
                        dataToSaveInCache[pathStrOrObj] = newValue;
                    }else{
                        dataToSaveInCache = pathStrOrObj;
                    }

                    angular.forEach(dataToSaveInCache, function(value,path){
                        entityCache.put(path,value);
                        if(angular.isObject(value) && !value.$save){
                            value.$save = self.set.bind(self,path,value);
                        }
                    });

                    return angular.isObject(pathStrOrObj) ? dataToSaveInCache : dataToSaveInCache[pathStrOrObj];
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.variables = StorageSrv.prototype.variables = {
                currTimeStamp: '%currTimeStamp%',
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            function EntityCommunicator(path, defaultValue, storage) {
                this.path = path;
                this.defaultValue = defaultValue;
                this.storage = storage;
            }

            EntityCommunicator.prototype.get = function () {
                return this.storage.get(this.path);
            };

            EntityCommunicator.prototype.set = function (newVal) {
                return this.storage.set(this.path, newVal);
            };

            return StorageSrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'

                },
                link: {
                    pre: function (scope, element) {
                        scope.$watch(function(){
                            return element.attr('name');
                        }, function () {
                            var name = element.attr('name');
                            element.addClass(name);
                            SvgIconSrv.getSvgByName(name).then(function (svg) {
                                element.append(svg);
                            });
                        });
                    }
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [
        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap = {};
            this.registerSvgSources = function (_svgMap) {
                var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
                alreadyRegisteredSvgIconNames.forEach(function(svgIconName){
                    if(!!_svgMap[svgIconName]){
                        console.log('SvgIconSrv: svg icon was already defined before ',svgIconName);
                    }
                });
                angular.extend(svgMap,_svgMap);
                return true;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http',
                function ($templateCache, $q, $http) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').factory('UtilitySrv', [
        function () {
            var UtilitySrv = {};

            //general utility functions
            UtilitySrv.general = {};

            UtilitySrv.general.createGuid = function(){
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                }

                return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
            };

            // object utility function
            UtilitySrv.object = {};

            UtilitySrv.object.extendWithoutOverride = function(dest, src){
                angular.forEach(src, function(val,key){
                    if(!dest.hasOwnProperty(key)){
                        dest[key] = val;
                    }
                });
            };

            return UtilitySrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            var typeToViewMap = {};

            typeToViewMap[AnswerTypeEnum.SELECT_ANSWER.enum] = '<select-answer></select-answer>';
            typeToViewMap[AnswerTypeEnum.FREE_TEXT_ANSWER.enum] = '<select-answer></select-answer>';
            typeToViewMap[AnswerTypeEnum.RATE_ANSWER.enum] = '<rate-answer></rate-answer>';

            return {
                require: ['answerBuilder','^questionBuilder', '^ngModel'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];
                        var ngModelCtrl = ctrls[2];

                        var fnToBindFromQuestionBuilder = ['getViewMode'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

                        answerBuilderCtrl.canUserAnswerBeChanged = function(){
                            var viewMode = questionBuilderCtrl.getViewMode();
                            var isntReviewMode = viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                            var notAnswered = angular.isDefined(ngModelCtrl.$viewValue);
                            var isAnswerWithResultViewMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                            return isntReviewMode && isAnswerWithResultViewMode && notAnswered;
                        };

                        answerBuilderCtrl.question = questionBuilderCtrl.question;

                        var answerType = questionBuilderCtrl.question.answerTypeId;
                        var answerHtml = typeToViewMap[answerType];
                        element.html(answerHtml);
                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);
})(angular);

///**
// * attrs:
// */
//
//(function (angular) {
//    'use strict';
//
//    angular.module('znk.infra.znkExercise').directive('freeTextAnswerDrv', [
//        'ZnkExerciseDrvSrv', 'MediaSrv', 'SubjectEnumConst',
//        function (ZnkExerciseDrvSrv, MediaSrv, SubjectEnumConst) {
//            return {
//                templateUrl: 'scripts/exercise/templates/freeTextAnswerDrv.html',
//                require: ['^simpleQuestion','^ngModel'],
//                scope:{},
//                link: function (scope, element, attrs, ctrls) {
//                    var questionDrvCtrl = ctrls[0];
//                    var ngModelCtrl = scope.ngModelCtrl = ctrls[1];
//
//
//                    scope.d = {
//                        showSolution: questionDrvCtrl.showSolution,
//                        ngModelCtrl: ngModelCtrl,
//                        numOfGridCells: questionDrvCtrl.question.subjectId === SubjectEnumConst.LISTENING ? 2 : 3
//                    };
//
//                    updateCanEdit();
//
//                    function isCorrect(flatAnswer) {
//                        var correctAnswersArr = questionDrvCtrl.question.correctAnswerText.map(function(answer){
//                            return answer.content;
//                        });
//
//                        return correctAnswersArr.indexOf(flatAnswer);
//                    }
//
//                    /**
//                     * Returns the first correct answer, formatted as comma seperated values
//                     * @return {string} correct answers
//                     */
//                    function getFirstCorrectAnswer() {
//                        // '341' -> '3, 4, 1'
//                        if(questionDrvCtrl.question.correctAnswerText[0].content){
//                            return questionDrvCtrl.question.correctAnswerText[0].content.match(/.{1}/g).join(', ');
//                        }else{
//                            console.log('content problem in free text question');
//                        }
//
//                    }
//
//                    function setCorrectnessClass(enableSound){
//
//                        scope.d.currentAnswer = ngModelCtrl.$viewValue && ngModelCtrl.$viewValue.indexOf(', ') === -1 ?  ngModelCtrl.$viewValue.match(/.{1}/g).join(',') : ngModelCtrl.$viewValue;
//                        var viewMode = questionDrvCtrl.getViewMode();
//                        var classToAdd;
//
//                        if((viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && angular.isUndefined(scope.d.answer)) ||
//                            viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum || viewMode === ZnkExerciseDrvSrv.viewModeEnum.mustAnswer.enum){
//                            classToAdd = 'neutral';
//
//                        } else {
//                            if (isCorrect(scope.d.answer) === -1) {
//                                var $questionCorrectAnswer = angular.element(element[0].querySelector('.question-correct-answer'));
//                                $questionCorrectAnswer.empty();
//                                $questionCorrectAnswer.html(getFirstCorrectAnswer());
//
//                                if(angular.isUndefined(scope.d.answer)){
//                                    classToAdd = 'not-answered';
//                                }else{
//                                    classToAdd = 'wrong';
//                                }
//                            } else {
//                                classToAdd = 'correct';
//                            }
//
//                            if (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && enableSound){
//                                if (classToAdd === 'correct'){
//                                    MediaSrv.playCorrectAnswerSound();
//                                }
//                                if (classToAdd === 'wrong'){
//                                    MediaSrv.playWrongAnswerSound();
//                                }
//                            }
//                        }
//
//                        element.addClass(classToAdd);
//                    }
//
//                    function updateCanEdit() {
//                        var viewMode = questionDrvCtrl.getViewMode();
//                        scope.d.disableEdit = (viewMode === ZnkExerciseDrvSrv.viewModeEnum.review.enum ||
//                            (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && scope.d.answer));
//                    }
//
//                    scope.d.save = function(){
//                        ngModelCtrl.$setViewValue(scope.d.answer);
//                        setCorrectnessClass(true);
//                        updateCanEdit();
//                    };
//
//                    ngModelCtrl.$render = function(){
//                        scope.d.answer = ngModelCtrl.$viewValue;
//                        setCorrectnessClass(false);
//                        updateCanEdit();
//                    };
//
//                    scope.$on('exercise:viewModeChanged', function () {
//                        updateCanEdit();
//                        ngModelCtrl.$render();
//                    });
//
//                    scope.$watch('d.answer', function() {
//                        scope.d.save();
//                    });
//                }
//            };
//        }
//    ]);
//})(angular);
//


/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswer', ['ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/rateAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function(){
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId))|| viewMode === REVIEW_MODE){
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }

                    function formatter(answer) {
                        return answer - INDEX_OFFSET;
                    }

                    function parser(index){
                        return index + INDEX_OFFSET;
                    }

                    ngModelCtrl.$formatters.push(formatter);
                    ngModelCtrl.$parsers.push(parser);
                }
            };
        }
    ]);
})(angular);



/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('selectAnswer', [
        '$timeout', 'ZnkExerciseViewModeEnum',
        function ($timeout, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/selectAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict:'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();

                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    scope.d.getIndexChar = function(questionIndex){
                        var UPPER_A_ASCII_CODE = 65;
                        return String.fromCharCode(UPPER_A_ASCII_CODE + questionIndex);
                    };

                    function updateAnswersFollowingSelection(viewMode) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {

                            var $answerElem = angular.element($answers[i]);
                            if(!$answerElem || !$answerElem.scope || !$answerElem.scope()){
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                            if (viewMode === MODE_ANSWER_WITH_QUESTION){
                                if (classToAdd === 'correct'){

                                }
                                if (classToAdd === 'wrong'){

                                }
                            }
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateAnswersFollowingSelection();
                        });
                    };
                    //ng model controller render function not triggered in case render function was set
                    // after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });
                }
            };
        }
    ]);
})(angular);



(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerGrid', [
        function () {
            return {
                templateUrl: 'scripts/exercise/templates/freeTextAnswerGridDrv.html',
                restrict: 'E',
                require: 'ngModel',
                scope: {
                    cellsNumGetter: '&cellsNum'
                },
                link: function (scope, element, attrs, ngModelCtrl) {

                    scope.buttonArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                    var numberOfCells = scope.cellsNumGetter() || 3;

                    scope.d = {
                        viewCells: new Array(numberOfCells)
                    };

                    function updateNgModelViewValue() {
                        ngModelCtrl.$setViewValue(angular.copy(scope.d.cells));
                    }

                    scope.onClickNum = function (num) {
                        if (attrs.disabled || scope.d.cells.length >= numberOfCells) {
                            return;
                        }

                        scope.d.cells.push(num);
                        updateNgModelViewValue();
                    };

                    scope.onClickErase = function () {
                        if (attrs.disabled || !scope.d.cells.length) {
                            return;
                        }

                        scope.d.cells.pop();
                        updateNgModelViewValue();
                    };

                    ngModelCtrl.$render = function () {
                        scope.d.cells = angular.isDefined(ngModelCtrl.$viewValue) ? ngModelCtrl.$viewValue : [];
                    };
                }
            };
        }]);
}(angular));

'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('markup', [
        '$window',
        function ($window) {
            var _isMobile = false;//MobileSrv.isMobile();
            var MAX_IMAGE_WIDTH = 275;
            var dummyElem = angular.element('<P/>');
            return {
                replace: true,
                restrict: 'E',
                link: function (scope, element, attrs) {

                    var toDomElement = function domElement(markup) {
                        dummyElem.append(markup);
                        return dummyElem.contents();
                    };

                    var imageStyle = function imageStyle(image){
                        var _style = {
                            width: '',
                            height: ''
                        };

                        if(image.style.width){
                            var _height = image.style.height;
                            var _width = image.style.width;

                            _height = _height.replace('px','');
                            _width = _width.replace('px','');

                            if(!isNaN(_width)){
                                _width = parseInt(_width);

                                while(_width > MAX_IMAGE_WIDTH){
                                    _width = _width * 0.90;
                                    _height = _height * 0.90;
                                }
                                _style.width = _width + 'px';
                                _style.height = _height + 'px';
                            }
                        }
                        return _style;
                    };

                    var resizeImages = function resizeImages(domElement){
                        var style;

                        for(var i=0; i<domElement.length; i++ ){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'img')
                            {
                                if(domElement[i].style.width){
                                    style = imageStyle(domElement[i]);
                                    domElement[i].style.width = style.width;
                                    domElement[i].style.height = style.height;
                                }
                            }
                            else{
                                var _images = angular.element(domElement[i]).find('img');
                                if(_images.length){
                                    for(var x=0; x<_images.length; x++){
                                        if(_images[x].style.width){
                                            style = imageStyle(_images[x]);
                                            _images[x].style.width = style.width;
                                            _images[x].style.height = style.height;
                                        }
                                    }
                                }
                            }
                        }

                        return domElement;
                    };

                    var removeLeftMargin = function removeLeftMargin(domElement){

                        for(var i=0; i<domElement.length; i++){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'p')
                            {
                                if(!domElement[i].style) {
                                    break;
                                }

                                var marginLeft = domElement[i].style.marginLeft;
                                marginLeft = marginLeft ?  marginLeft.replace('px','') : marginLeft;

                                if(marginLeft && !isNaN(marginLeft))
                                {
                                    domElement[i].style.marginLeft = 0;
                                }
                            }
                        }

                        return domElement;
                    };

                    var watchDestroyer = scope.$watch(attrs.content,function(newVal){
                        if(!!newVal){

                            if(_isMobile){
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.05);
                            }
                            else{
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.25);
                            }

                            var _domElements = toDomElement(newVal);
                            if(_domElements) {
                                var _newDomElements = resizeImages(_domElements);

                                //remove left margin from <p> tag
                                _newDomElements = removeLeftMargin(_newDomElements);

                                element.append(_newDomElements);
                            }

                            watchDestroyer();
                        }
                    });
                }
            };
        }
    ]);
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('arrayToStringFmtr', [
        function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    function parser(val){
                        if(!val || !val.length){
                            return undefined;
                        }
                        return val.join('');
                    }
                    ngModelCtrl.$parsers.push(parser);

                    function formatter(val){
                        if (!val || !val.length) {
                            return [];
                        }
                        return val.match(/.{1}/g);
                    }
                    ngModelCtrl.$formatters.push(formatter);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var ZnkExerciseEvents = {
        BOOKMARK: 'znk exercise:bookmark',
        QUESTION_ANSWERED: 'znk exercise:question answered',
        READY: 'znk exercise: exercise ready',
        QUESTION_CHANGED: 'znk exercise: question changed',
        QUESTIONS_NUM_CHANGED: 'znk exercise: questions num changed'
    };
    angular.module('znk.infra.znkExercise').constant('ZnkExerciseEvents', ZnkExerciseEvents);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout', 'ZnkExerciseUtilitySrv',
        function ($compile, QuestionTypesSrv, $timeout, ZnkExerciseUtilitySrv) {
            return {
                restrict: 'E',
                require: ['questionBuilder', '^znkExercise'],
                scope: {
                    questionGetter: '&question'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.question = $scope.questionGetter();
                    }
                ],
                link: {
                    pre: function pre(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var functionsToBind = ['getViewMode','addQuestionChangeResolver','removeQuestionChangeResolver'];
                        ZnkExerciseUtilitySrv.bindFunctions(questionBuilderCtrl, znkExerciseCtrl,functionsToBind);
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];
                        var questionHtmlTemplate = QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question);
                        element.append(questionHtmlTemplate);
                        var childScope = scope.$new(true);
                        $compile(element.contents())(childScope);

                        //after 2 digests at max the question should be randered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionReady(questionBuilderCtrl.question.__questionStatus.index);
                            });
                        },0,false);

                        scope.$on('$destroy', function(){
                            $timeout.cancel(innerTimeout);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *      disableSwipe
 *      questions
 *      onQuestionAnswered
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionsCarousel', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum) {
            return {
                templateUrl: function(){
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'questionSwiperDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'questionSwiperMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                require: 'ngModel',
                scope:{
                    questionsGetter: '&questions',
                    onQuestionAnswered: '&'

                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    scope.vm = {};

                    ngModelCtrl.$render = function(){
                        scope.vm.currSlideIndex = ngModelCtrl.$viewValue;
                    };

                    scope.vm.SlideChanged = function(){
                        ngModelCtrl.$setViewValue(scope.vm.currSlideIndex);
                    };


                    attrs.$observe('slideDirection',function(newSlideDirection){
                        var slideDirection = +newSlideDirection;
                        if(!scope.vm.swiperActions || isNaN(slideDirection)){
                            return;
                        }

                        switch (slideDirection){
                            case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                scope.vm.swiperActions.lockSwipes();
                                break;
                            case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                scope.vm.swiperActions.unlockSwipeToPrev();
                                scope.vm.swiperActions.lockSwipeToNext();
                                break;
                            case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                scope.vm.swiperActions.lockSwipeToPrev();
                                scope.vm.swiperActions.unlockSwipeToNext();
                                break;
                            default:
                                scope.vm.swiperActions.unlockSwipes();
                        }
                    });

                    scope.$watch('questionsGetter().length',function(newNum){
                        var notBindedQuestions = scope.questionsGetter();
                        if(newNum && !scope.vm.questions){
                            scope.vm.questions = notBindedQuestions;
                            return;
                        }
                        scope.vm.questions = notBindedQuestions;
                        scope.vm.swiperActions.updateFollowingSlideAddition();
                    });
                    //hack since the template url is loaded asynchronously the pre and post link not working well
                    scope.$watch('vm.swiperActions',function(actions){
                        if(!angular.isObject(actions)){
                            return;
                        }
                        actions.enableKeyboardControl();
                    });
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *  prev-question
 *  next-question
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions'
                },
                require: '^znkExercise',
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        scope.vm = {};

                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _setDoneBtnDisplayStatus(currIndex){
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            getQuestionsProm.then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                                if ((currIndex && currIndex === (questions.length - 1 )) || znkExerciseDrvCtrl.isLastUnansweredQuestion()) {
                                    scope.vm.showDoneButton = true;
                                } else {
                                    scope.vm.showDoneButton = false;
                                }
                            });
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        init();


                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _setDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            if (znkExerciseDrvCtrl.isLastUnansweredQuestion()) {
                                scope.vm.showDoneButton = true;
                            }
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _setDoneBtnDisplayStatus(currIndex);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *
 *  actions:
 *      updateContainerSize
 *      lockSwipes
 *      lockSwipeToPrev
 *      lockSwipeToNext
 *      unlockSwipes
 *      unlockSwipeToPrev
 *      unlockSwipeToNext
 *      enableKeyboardControl
 *      disableKeyboardControl
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiperTemplate.html',
                replace: true,
                restrict: 'E',
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer = $q.defer();
                    var swiperInstanceProm = defer.promise;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            var fnToBindFromSwiper = [
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes', 'unlockSwipeToPrev',
                                'unlockSwipeToNext' ,'disableKeyboardControl', 'enableKeyboardControl'
                            ];
                            fnToBindFromSwiper.forEach(function(fnName){
                                actions[fnName] = function(){
                                    var fnArgs = arguments;
                                    swiperInstanceProm.then(function(swiperInstance){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(swiperInstance){
                            swiperInstance.on('onSlideChangeEnd',function(_swipeInstance){
                                ngModelCtrl.$setViewValue(_swipeInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            swiperInstanceProm.then(function(swiperInstance){
                                swiperInstance.destroy();
                            });
                        });
                    }

                    function postLink(scope,element){
                        $timeout(function(){
                            defer.resolve(new Swiper(element[0]));
                        },0,false);
                    }

                    return {
                        pre: preLink,
                        post: postLink
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        var questionTypeGetterFn = angular.noop;
        this.setQuestionTypeGetter = function(typeGetterFn){
            questionTypeGetterFn = typeGetterFn;
        };

        this.$get = [
            '$log',
            function ($log) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    var questionTypeId = questionTypeGetterFn(question);
                    if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                        $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                    }
                    return questionTypeToHtmlTemplateMap[questionTypeId];
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSrv', [
        /*'ZnkModalSrv',*/ 'EnumSrv', '$window', 'PlatformEnum',
        function (/*ZnkModalSrv, */EnumSrv, $window, PlatformEnum) {
            var ZnkExerciseSrv = {};

            var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
            ZnkExerciseSrv.getPlatform = function(){
                return platform;
            };

            ZnkExerciseSrv.openExerciseToolBoxModal = function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
                //var modalOptions = {
                //    templateUrl: 'scripts/exercise/templates/znkExerciseToolBoxModal.html',
                //    hideBackdrop: true,
                //    ctrl: 'ZnkExerciseToolBoxModalCtrl',
                //    ctrlAs: 'toolBoxCtrl',
                //    dontCentralize: true,
                //    wrapperClass: 'znk-exercise-toolbox ' + toolBoxModalSettings.wrapperCls,
                //    resolve: {
                //        Settings: toolBoxModalSettings
                //    }
                //};
                //return ZnkModalSrv.modal(modalOptions);
            };

            ZnkExerciseSrv.toolBoxTools = {
                BLACKBOARD: 'blackboard',
                MARKER: 'mar',
                CALCULATOR: 'cal',
                BOOKMARK: 'bookmark',
                SHOW_PAGER: 'show pager'
            };

            return ZnkExerciseSrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *  questions: questions array
 *
 *  ngModel: results array
 *
 *  settings:
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 *      initSlideIndex
 *      toolBoxWrapperClass
 *      initSlideDirection
 *      initForceDoneBtnDisplay: null-default behaviour(default value), false-done button will be hidden, true-done button will be dispalyed
 *      initPagerDisplay: true- displayed(default value), false- hidden
 *
 *  actions:
 *      setSlideIndex
 *      getCurrentIndex
 *      finishExercise
 *      setSlideDirection
 *      forceDoneBtnDisplay
 *      pagerDisplay: function, if true provided than pager will be displayed other it will be hidden.
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercise', [
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log', 'ZnkExerciseViewModeEnum', 'ZnkExerciseSlideDirectionEnum', '$timeout', 'ZnkExerciseUtilitySrv',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log, ZnkExerciseViewModeEnum, ZnkExerciseSlideDirectionEnum, $timeout, ZnkExerciseUtilitySrv) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExerciseDrv.html',
                restrict: 'E',
                transclude: true,
                controllerAs: 'vm',
                require: ['znkExercise', 'ngModel'],
                scope: {
                    questionsGetter: '&questions',
                    settings: '=?',
                    actions: '=?'
                },
                controller: 'ZnkExerciseDrvCtrl',
                compile: function (element) {
                    var platform = ZnkExerciseSrv.getPlatform();
                    if (!platform) {
                        $log.$error('znkExercise directive: undefined platform received.');
                    }
                    var PlatformEnumMap = PlatformEnum.getEnumMap();
                    element.addClass(PlatformEnumMap[platform]);

                    return {
                        pre: function (scope, element, attrs, ctrls) {
                            var defaultSettings = {
                                onDone: angular.noop,
                                onQuestionAnswered: angular.noop,
                                viewMode: ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                                onSlideChange: angular.noop,
                                initSlideDirection: ZnkExerciseSlideDirectionEnum.ALL.enum,
                                initForceDoneBtnDisplay: null,
                                initPagerDisplay: true
                            };
                            scope.settings = angular.extend(defaultSettings, scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            function questionChangeResolverForSlideDirection(requiredIndex, currIndex){
                                var currSlideDirection = scope.vm.slideDirection;
                                switch (currSlideDirection){
                                    case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                        return $q.reject();
                                    case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                        return currIndex > requiredIndex ? true : $q.reject(false);
                                    case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                        return currIndex < requiredIndex ? true : $q.reject(false);
                                    default:
                                        return true;
                                }
                            }
                            znkExerciseDrvCtrl.addQuestionChangeResolver(questionChangeResolverForSlideDirection);

                            scope.vm.answeredCount = 0;

                            znkExerciseDrvCtrl.setCurrentIndex(scope.settings.initSlideIndex || 0);
                            /**
                             *  ACTIONS
                             * */
                            scope.actions = scope.actions || {};

                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                znkExerciseDrvCtrl.setCurrentIndex(index);
                            };

                            scope.actions.getCurrentIndex = function () {
                                return znkExerciseDrvCtrl.getCurrentIndex();
                            };

                            scope.actions.finishExercise = function () {
                                updateTimeSpentOnQuestion();
                            };

                            scope.actions.setSlideDirection = function(newSlideDirection){
                                if(angular.isDefined(newSlideDirection)){
                                    var isRightDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.RIGHT.enum;
                                    var isLeftDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.LEFT.enum;
                                    var isAllDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.ALL.enum;
                                    var DIRECTION_CLASS_PREFIX = 'direction';

                                    var rightDirectionClass =DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.RIGHT.val;
                                    if(isRightDirection || isAllDirection){
                                        element.addClass(rightDirectionClass);
                                    }else{
                                        element.removeClass(rightDirectionClass);
                                    }

                                    var leftDirectionClass=DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.LEFT.val;
                                    if(isLeftDirection || isAllDirection){
                                        element.addClass(leftDirectionClass);
                                    }else{
                                        element.removeClass(leftDirectionClass);
                                    }

                                    scope.vm.slideDirection = newSlideDirection;
                                }
                            };

                            scope.actions.forceDoneBtnDisplay = function(display){
                                if(display === true){
                                    element.addClass('done-btn-show');
                                }else{
                                    element.removeClass('done-btn-show');
                                }

                                if(display === false){
                                    element.addClass('done-btn-hide');
                                }else{
                                    element.removeClass('done-btn-hide');
                                }
                            };

                            scope.actions.pagerDisplay = function(display){
                                scope.vm.showPager = !!display;
                            };

                            /**
                             *  ACTIONS END
                             * */

                            /**
                             *  RENDER AND SET VIEW VALUE
                             * */
                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.vm.questionsWithAnswers = allQuestionWithAnswersArr;
                                znkExerciseDrvCtrl.setExerciseAsReady();
                            }

                            ngModelCtrl.$render = function () {
                                render(ngModelCtrl.$viewValue);
                            };

                            function setViewValue() {
                                ngModelCtrl.$setViewValue(angular.copy(scope.vm.questionsWithAnswers));
                            }
                            /**
                             *  RENDER AND SET VIEW VALUE END
                             * */

                            function getCurrentQuestion() {
                                return allQuestionWithAnswersArr[scope.vm.currentSlide];
                            }

                            /**
                             *  TOOL BOX MODAL
                             * */
                            var toolboxModalSettings = {
                                toolsToHide: scope.settings.toolsToHide,
                                wrapperCls: scope.settings.toolBoxWrapperClass || ''
                            };
                            toolboxModalSettings.events = {
                                onToolOpened: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BLACKBOARD, currQuestion.__questionStatus.blackboardData || {});
                                            if (isMobile) {
                                                scope.vm.hidePager = true;
                                            }
                                            break;
                                    }
                                },
                                onToolClosed: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            currQuestion.__questionStatus.blackboardData = evt.value;
                                            if (isMobile) {
                                                scope.vm.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function (evt) {
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.vm.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);
                            /**
                             *  TOOL BOX MODAL END
                             * */

                            /**
                             *  FORMATTER & PARSER
                             * */
                            questionAnswersToOneObjectfmtr.formatter = function (answers) {
                                if (!answers) {
                                    answers = [];
                                }

                                var answersMap = {};
                                answers.forEach(function (answer) {
                                    if (answer && angular.isDefined(answer.questionId)) {
                                        answersMap[answer.questionId] = answer;
                                    }
                                });

                                var questions = scope.questionsGetter() || [];

                                var questionsWithAnswers = questions.map(function (question, index) {
                                    var questionCopy = angular.copy(question);
                                    var answer = answersMap[questionCopy.id] || {};

                                    questionCopy.__questionStatus = {
                                        index: index
                                    };
                                    for (var prop in answer) {
                                        questionCopy.__questionStatus[prop] = answer[prop];
                                    }

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.vm.answeredCount  = 0;

                                var results = ngModelCtrl.$modelValue || [];

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = {
                                        questionId: questionWithAnswer.id
                                    };

                                    var propsToCopyFromQuestionStatus = ['blackboardData', 'timeSpent', 'bookmark', 'userAnswer', 'isAnsweredCorrectly', 'audioEnded'];
                                    propsToCopyFromQuestionStatus.forEach(function (propName) {
                                        var value = questionWithAnswer.__questionStatus[propName];
                                        if (angular.isDefined(value)) {
                                            answer[propName] = value;
                                        }
                                    });

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.vm.answeredCount ++;
                                    }

                                    results[index] = answer;
                                });

                                return results;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);
                            /**
                             *  FORMATTER & PARSER END
                             * */

                            scope.vm.questionAnswered = function () {
                                if (scope.settings.viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    updateTimeSpentOnQuestion();
                                    var currQuestion = getCurrentQuestion();
                                    var userAnswer = currQuestion.__questionStatus.userAnswer;

                                    currQuestion.__questionStatus.isAnsweredCorrectly = ZnkExerciseUtilitySrv.isAnswerCorrect(currQuestion,userAnswer);
                                }
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, getCurrentQuestion());
                                //skip 1 digest cycle before triggering question answered
                                $timeout(function(){
                                    scope.settings.onQuestionAnswered(scope.vm.currentSlide);
                                });
                            };

                            scope.vm.bookmarkCurrentQuestion = function () {
                                var currQuestion = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK, currQuestion);
                                setViewValue();
                            };

                            function updateTimeSpentOnQuestion(questionNum) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.vm.currentSlide;
                                if (scope.settings.viewMode === ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    return;
                                }

                                if (!updateTimeSpentOnQuestion.lastTimeStamp) {
                                    updateTimeSpentOnQuestion.lastTimeStamp = Date.now();
                                    return;
                                }
                                var currTime = Date.now();
                                var timePassed = currTime - updateTimeSpentOnQuestion.lastTimeStamp;
                                updateTimeSpentOnQuestion.lastTimeStamp = currTime;
                                var question = scope.vm.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;
                                setViewValue();
                            }

                            /**
                             *  INIT
                             * */
                            scope.actions.setSlideDirection(scope.settings.initSlideDirection);
                            scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);
                            scope.actions.pagerDisplay(scope.settings.initPagerDisplay);
                            /**
                             *  INIT END
                             * */

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    var currQuestion = getCurrentQuestion();
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!currQuestion.__questionStatus.bookmark);
                                }
                                //added since the sliders current was not changed yet
                                $timeout(function(){
                                    var currentIndex = znkExerciseDrvCtrl.getCurrentIndex();
                                    scope.settings.onSlideChange(currentIndex);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value,prevValue);
                                },0,false);
                                //var url = $location.url() + '/' + scope.vm.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            scope.$watch('vm.questionsWithAnswers.length',function(newNum,oldNum){
                                scope.$broadcast(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED,newNum,oldNum);
                            });

                            scope.$on('$destroy', function () {
                                if (toolBoxModalInstance) {
                                    toolBoxModalInstance.close();
                                }
                            });
                        }
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents', '$log',
        function ($scope, $q, ZnkExerciseEvents, $log) {
            var self = this;
            var exerciseReadyDefer = $q.defer();
            var isExerciseReady = false;

            self.setExerciseAsReady = function(){
                if(isExerciseReady){
                    return;
                }
                isExerciseReady = true;
                exerciseReadyDefer.resolve(isExerciseReady);
            };

            self.isExerciseReady = function(){
                return isExerciseReady ;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            var changeQuestionResolvers = [];
            self.addQuestionChangeResolver = function(resolver){
                changeQuestionResolvers.push(resolver);
            };

            self.removeQuestionChangeResolver = function(resolver){
                var newChangeQuestionResolvers = [];
                changeQuestionResolvers.forEach(function(resolverItem){
                    if(resolverItem !== resolver){
                        newChangeQuestionResolvers.push(resolverItem);
                    }
                });
                changeQuestionResolvers = newChangeQuestionResolvers;
            };

            self.getCurrentIndex = function () {
                return $scope.vm.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    var currIndex = self.getCurrentIndex();
                    return canChangeQuestion(newQuestionIndex, currIndex).then(function () {
                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        $scope.vm.currentSlide = newQuestionIndex;
                        return $scope.vm.currentSlide;
                    });
                }else{
                    $log.debug('ZnkExerciseDrv: setCurrentIndex was invoked with undefined newQuestionIndex parameter');
                }
                return $q.when($scope.vm.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionReady = function () {
                if (!self.__exerciseReady) {
                    self.__exerciseReady = true;
                    $scope.$broadcast(ZnkExerciseEvents.READY);
                    exerciseReadyDefer.resolve(true);
                    if ($scope.settings.onExerciseReady) {
                        $scope.settings.onExerciseReady();
                    }
                }
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.vm.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.vm.questionsWithAnswers || []).length;
                var unansweredNum = 0;
                for(var i=0; i<questionsNum; i++){
                    if(!isQuestionAnswered(i)){
                        unansweredNum++;
                        if(unansweredNum === 2){
                            return false;
                        }
                    }
                }
                return unansweredNum === 1;
            };

            self.getQuestions = function(){
                return exerciseReadyDefer.promise.then(function(){
                    return $scope.vm.questionsWithAnswers;
                });
            };

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.vm.questionsWithAnswers ? $scope.vm.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }

            function canChangeQuestion(requiredIndex, currIndex){
                var promArr = [];
                changeQuestionResolvers.forEach(function(resolver){
                    var getResolverResult = $q.when(angular.isFunction(resolver ) ? resolver(requiredIndex, currIndex) : resolver);
                    promArr.push(getResolverResult);
                });
                return $q.all(promArr);
            }
        }]);
})(angular);

/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {},
                link: {
                    pre: function (scope, element, attrs, ctrls) {
                        var ngModelCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var currViewMode = znkExerciseCtrl.getViewMode();

                        var domElement = element[0];

                        scope.d = {};

                        scope.d.tap = function (newIndex) {
                            znkExerciseCtrl.setCurrentIndex(newIndex);
                        };

                        function setPagerItemBookmarkStatus(index,status){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if(status){
                                pagerItemElement.addClass('bookmark');
                            }else{
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClass(index,question){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);

                            if(angular.isUndefined(question.__questionStatus.userAnswer)){
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if(currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum){
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if(question.__questionStatus.isAnsweredCorrectly){
                                pagerItemElement.addClass('correct');
                            }else{
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        scope.$on(ZnkExerciseEvents.BOOKMARK,function(evt,question){
                            setPagerItemBookmarkStatus(question.__questionStatus.index,question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED,function(evt,question){
                            setPagerItemAnswerClass(question.__questionStatus.index,question);
                        });

                        var isInitialized;
                        function init(){
                            isInitialized = true;
                            //wait for the pager items to be rendered
                            $timeout(function () {
                                ngModelCtrl.$render = function () {
                                    var currentSlide = +ngModelCtrl.$viewValue;
                                    if (isNaN(currentSlide)) {
                                        return;
                                    }
                                    //added in order to prevent the swipe lag
                                    $timeout(function () {
                                        var i;
                                        var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
                                        for (i in $pagerItemWithCurrentClass) {
                                            $pagerItemWithCurrentClass.eq(i).removeClass('current');
                                        }
                                        var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
                                        var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
                                        currentSlideDom.addClass('current');

                                        for(i in scope.questions){
                                            var question = scope.questions[i];
                                            setPagerItemBookmarkStatus(i,question .__questionStatus.bookmark);
                                            setPagerItemAnswerClass(i,question);
                                        }
                                    });
                                };
                                //render is not invoked for the first time
                                ngModelCtrl.$render();
                            },false);
                        }

                        scope.$parent.$watch(attrs.questions, function pagerQuestionsArrWatcher(questionsArr) {
                            if (questionsArr) {
                                scope.questions = questionsArr;

                                if(!isInitialized){
                                    init();
                                }
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


'use strict';

(function () {

    angular.module('znk.infra.znkExercise').directive('blackboardDrv', [
        'GoBackHardwareSrv',
        function (GoBackHardwareSrv) {

            return {
                restric: 'EA',
                scope: {
                    drawingData: '=',
                    actions: '&',
                    close: '&'
                },
                replace: true,
                templateUrl: 'scripts/exercise/templates/blackboardDrv.html',
                link: function (scope, elem) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    function activatePen() {
                        scope.d.activeDrawMode = drawModes.pen;
                    }

                    function activateEraser() {
                        scope.d.activeDrawMode = drawModes.eraser;
                    }

                    function clearCanvas() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        scope.drawingData.dataUrl = null;
                    }

                    var actions = scope.actions() || {};
                    angular.extend(actions, {
                        activatePen: activatePen,
                        activateEraser: activateEraser,
                        clear: clearCanvas
                    });

                    var drawModes = {
                        pen: 1,
                        eraser: 2
                    };

                    scope.d = {
                        drawModes: drawModes,
                        activeDrawMode: drawModes.pen
                    };

                    var _lastX,
                        _lastY;

                    var canvas = elem.find('canvas')[0];
                    canvas.width = elem[0].offsetWidth;
                    canvas.height = elem[0].offsetHeight;

                    var ctx = canvas.getContext('2d');

                    function serialize(canvas) {
                        return canvas.toDataURL();
                    }
                    function deserialize(data, canvas) {
                        var img = new Image();
                        img.onload = function() {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext('2d').drawImage(img, 0, 0);
                        };

                        img.src = data;
                    }

                    if (scope.drawingData.dataUrl) {
                        deserialize(scope.drawingData.dataUrl, canvas);
                    }

                    function onTouchStart(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        _lastX = e.targetTouches[0].pageX;
                        _lastY = e.targetTouches[0].pageY;

                        draw(_lastX + 1, _lastY + 1);
                    }

                    function onTouchMove(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var curX = e.targetTouches[0].pageX;
                        var curY = e.targetTouches[0].pageY;

                        draw(curX, curY);

                        _lastX = curX;
                        _lastY = curY;
                    }

                    function onTouchEnd(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        scope.drawingData = scope.drawingData || {};
                        scope.drawingData.dataUrl = serialize(canvas);
                    }

                    function draw(x, y) {
                        ctx.beginPath();
                        if (scope.d.activeDrawMode === drawModes.pen) {
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineWidth = 4;
                            ctx.moveTo(_lastX, _lastY);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                        } else if (scope.d.activeDrawMode === drawModes.eraser) {
                            ctx.globalCompositeOperation = 'destination-out';
                            ctx.arc(_lastX, _lastY, 16, 0, Math.PI * 2, false);
                            ctx.fill();
                        }
                    }

                    canvas.addEventListener('touchstart', onTouchStart);
                    canvas.addEventListener('touchmove', onTouchMove);
                    canvas.addEventListener('touchend', onTouchEnd);

                    scope.$on('$destroy', function () {
                        canvas.removeEventListener('touchstart', onTouchStart);
                        canvas.removeEventListener('touchmove', onTouchMove);
                        canvas.removeEventListener('touchend', onTouchEnd);
                    });
                }
            };
        }]);
})();

'use strict';

/*globals math */
(function(angular) {

    angular.module('znk.infra.znkExercise').directive('calculator', [
        'GoBackHardwareSrv',
        function(GoBackHardwareSrv) {
            var cos = math.cos;
            var sin = math.sin;
            var tan = math.tan;

            return {
                scope :{
                    calcTop: '=',
                    close: '&'
                },
                link: function (scope) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    math.cos = function (x) {
                        return cos(math.unit(x, scope.trigunits));
                    };

                    math.sin = function (x) {
                        return sin(math.unit(x, scope.trigunits));
                    };

                    math.tan = function (x) {
                        return tan(math.unit(x, scope.trigunits));
                    };
                    scope.onClickAns = function () {
                        if (scope.result !== 'ERR') {
                            scope.expression =  scope.result;
                        }
                    };
                    scope.onClickNum = function (n) {
                        scope.expression += String(n);
                    };

                    scope.onClickAdd = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }

                        scope.expression += ' + ';
                    };

                    scope.onClickSubtract = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' - ';
                    };

                    scope.onClickMultiply = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' * ';
                    };

                    scope.onClickDivide = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' / ';
                    };

                    scope.onClickClear = function () {
                        scope.expression = '';
                        scope.result = 0;
                    };

                    scope.onClickDot = function () {
                        scope.expression += '.';
                    };

                    scope.onClickPi = function () {
                        scope.expression += ' pi ';
                    };

                    scope.onClickE = function () {
                        scope.expression += ' e ';
                    };

                    scope.onClickRad = function () {
                        scope.trigunits = 'rad';
                    };

                    scope.onClickDeg = function () {
                        scope.trigunits = 'deg';
                    };

                    scope.onClickSin = function () {
                        scope.expression += ' sin(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCos = function () {
                        scope.expression += ' cos(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickTan = function () {
                        scope.expression += ' tan(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickSqr = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^2 ';
                    };

                    scope.onClickPowThree = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^3 ';
                    };

                    scope.onClickPow = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^ ';
                    };

                    scope.onClickSqrt = function () {
                        scope.expression += ' sqrt(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickInv = function () {
                        scope.expression += ' inv(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickAbs = function () {
                        scope.expression += ' abs(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickFact = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += '! ';
                    };

                    scope.onClickLog = function () {
                        scope.expression += ' log(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickLn = function () {
                        scope.expression += ' ln(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickOpenParen = function () {
                        scope.expression += '(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCloseParen = function () {
                        scope.expression += ')';
                    };

                    scope.onClickUndo = function () {
                       scope.expression = scope.expression.trimRight();
                       scope.expression = scope.expression.substring(0, scope.expression.length - 1);
                    };

                    scope.onClickEqual = function () {
                        var exp = scope.expression.
                            replace('log', 'log10').
                            replace('ln', 'log');
                        try {
                            scope.result = math.round(math.eval(exp), 5);
                        } catch (err) {
                            try {
                                // best effort in case of missing one paren
                                exp += ')';
                                scope.result = math.round ( math.eval ( exp ), 5 );
                            } catch (err) {
                                scope.result = 'ERR';
                            }
                        }
                        scope.expression = '';
                    };

                    scope.onClickMPlus = function () {
                        scope.mem += scope.result;
                    };

                    scope.onClickMc = function () {
                        scope.mem = 0;
                    };

                    scope.onClickMR = function () {
                        scope.expression += scope.mem;
                    };

                    scope.hasMemory = function () {
                        return scope.mem > 0;
                    };

                    var init = function init () {
                        scope.result = 0;
                        scope.expression = '';
                        scope.mem = 0;
                        scope.trigunits = 'rad';
                    };
                    init();
                },
                templateUrl: 'scripts/exercise/templates/calculator.html'
            };
    }]);

}(angular));


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseToolBoxModalCtrl', [
        '$scope', 'ZnkExerciseDrvSrv', 'Settings',
        function ($scope, ZnkExerciseDrvSrv, Settings) {
            Settings.actions = Settings.actions || {};
            Settings.events = Settings.events || {};
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;

            $scope.d = {
                blackboardTool: {
                    actions: {},
                    value: {}
                },
                bookmarkTool: {},
                showPagerTool: {},
                tools: ZnkExerciseDrvSrv.toolBoxTools,
                toolsStatus: {},
                toolsToHide: Settings.toolsToHide
            };

            Settings.actions.setToolValue = function (tool, value) {
                switch (tool) {
                    case $scope.d.tools.BOOKMARK:
                        $scope.d.bookmarkTool.value = value;
                        break;
                    case $scope.d.tools.BLACKBOARD:
                        $scope.d.blackboardTool.value = value;
                        break;
                }
            };

            $scope.d.openTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                Settings.events.onToolOpened(eventObj);
                $scope.d.toolsStatus[tool] = true;
            };

            $scope.d.closeTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                switch (tool) {
                    case $scope.d.tools.BLACKBOARD:
                        eventObj.value = $scope.d.blackboardTool.value;
                        break;
                    case $scope.d.tools.BOOKMARK:
                        eventObj.value = $scope.d.bookmarkTool.value;
                }
                Settings.events.onToolClosed(eventObj);
                $scope.d.toolsStatus[tool] = false;
            };

            function triggerToolValueChangedEvent(tool, newStatus) {
                var eventObj = {
                    tool: tool,
                    value: newStatus
                };
                if(Settings.events.onToolValueChanged){
                    Settings.events.onToolValueChanged(eventObj);
                }
            }

            $scope.d.reverseBookmarkValue = function () {
                $scope.d.bookmarkTool.value = !$scope.d.bookmarkTool.value;
                triggerToolValueChangedEvent($scope.d.tools.BOOKMARK, $scope.d.bookmarkTool.value);
            };

            $scope.d.activateBlackboardPencil = function(){
                if(!$scope.d[$scope.d.tools.BLACKBOARD]){
                    $scope.d.openTool($scope.d.tools.BLACKBOARD);
                }

                $scope.d.blackboardTool.pencilActivated = true;
                if ($scope.d.blackboardTool.actions.activatePen) {
                    $scope.d.blackboardTool.actions.activatePen();
                }
            };

            $scope.d.activateBlackboardEraser = function(){
                $scope.d.blackboardTool.pencilActivated = false;
                if ($scope.d.blackboardTool.actions.activateEraser) {
                    $scope.d.blackboardTool.actions.activateEraser();
                }
            };

            $scope.d.reverseShowPagerValue = function(){
                $scope.d.showPagerTool.value = !$scope.d.showPagerTool.value;
                triggerToolValueChangedEvent($scope.d.tools.SHOW_PAGER, $scope.d.showPagerTool.value);
            };

            $scope.d.onCalcClick = function(){
                if($scope.d.toolsStatus.hasOwnProperty($scope.d.tools.CALCULATOR)){
                    $scope.d.closeTool($scope.d.tools.CALCULATOR);
                }else{
                    $scope.d.openTool($scope.d.tools.CALCULATOR);
                }
            };
        }
    ]);
})(angular);

/**
 * attrs:
 *  mobile-temp=
 *  desktop-temp=
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('templateByPlatform', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, PlatformEnum, $log) {
            return {
                templateUrl: function(element, attrs){
                    var templateUrl;
                    var prefix = attrs.prefix || '';
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform){
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl = attrs.desktopTemp;
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl = attrs.mobileTemp;
                            break;
                    }
                    if(!templateUrl){
                        $log.error('templateByPlatform directive: template was not defined for platform');
                    }
                    return prefix + '/' + templateUrl;
                },
                restrict: 'E'
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('PlatformEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MOBILE', 1, 'mobile'],
                ['DESKTOP', 2, 'desktop']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSlideDirectionEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['ALL', 2, 'all'],
                ['RIGHT', 3, 'right'],
                ['LEFT', 4, 'left']
            ])
            ;
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseViewModeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['ANSWER_WITH_RESULT', 1, 'answer with result'],
                ['ONLY_ANSWER', 2, 'answer only'],
                ['REVIEW', 3, 'review'],
                ['MUST_ANSWER', 4, 'must answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', ['AnswerTypeEnum',
        function (AnswerTypeEnum) {
            var ZnkExerciseUtilitySrv = {};
            //@todo(igor) move to utility service
            ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                functionToCopy.forEach(function(fnName){
                    dest[fnName] = src[fnName].bind(src);
                });
            };

            var answersIdsMap;
            ZnkExerciseUtilitySrv.isAnswerCorrect = function isAnswerCorrect(question, userAnswer) {
                var isCorrect, answer;
                switch (question.answerTypeId) {
                    case AnswerTypeEnum.SELECT_ANSWER.enum:
                        answer = '' + userAnswer;
                        isCorrect = ('' + question.correctAnswerId) === answer;
                        break;
                    case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                        answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.content;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                    case AnswerTypeEnum.RATE_ANSWER.enum:
                        answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.id;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                }

                return !!isCorrect;
            };
            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);

angular.module('znk.infra').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkExercise/answerTypes/templates/rateAnswerDrv.html",
    "<div class=\"rate-answer-wrapper\">\n" +
    "\n" +
    "    <div class=\"checkbox-items-wrapper\" >\n" +
    "\n" +
    "        <div class=\"item-repeater\" ng-repeat=\"item in ::d.itemsArray track by $index\">\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{ ::($index + 2)}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/answerTypes/templates/selectAnswerDrv.html",
    "<div ng-repeat=\"answer in ::d.answers track by answer.id\" class=\"answer\" ng-click=\"d.click(answer)\">\n" +
    "    <div class=\"content-wrapper\">\n" +
    "        <div class=\"answer-index-wrapper\">\n" +
    "            <span class=\"index-char\">{{::d.getIndexChar($index)}}</span>\n" +
    "        </div>\n" +
    "        <markup content=\"answer.content\" type=\"md\" class=\"content\"></markup>\n" +
    "        <svg-icon class=\"correct-icon-drv\" name=\"correct\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"wrong\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/btnSectionDesktopTemplate.html",
    "<div class=\"btn-container left-container ng-hide\" ng-show=\"!!vm.currentQuestionIndex\">\n" +
    "    <button ng-click=\"vm.prevQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"btn-container right-container ng-hide\"\n" +
    "     ng-show=\"vm.maxQuestionIndex !== vm.currentQuestionIndex\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<button class=\"done-btn ng-hide\" ng-show=\"vm.showDoneButton\" ng-click=\"onDone()\">DONE</button>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/btnSectionMobileTemplate.html",
    "<div ng-class=\"{ 'next-disabled' : settings.slideDirection === d.slideDirections.NONE ||  settings.slideDirection === d.slideDirections.RIGHT }\">\n" +
    "    <div class=\"bookmark-icon-container only-tablet\"\n" +
    "         ng-class=\"vm.questionsWithAnswers[vm.currentSlide].__questionStatus.bookmark ? 'bookmark-active-icon' : 'bookmark-icon'\"\n" +
    "         ng-click=\"vm.bookmarkCurrentQuestion()\"\n" +
    "         ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "         analytics-on=\"click\"\n" +
    "         analytics-event=\"click-bookmark-question\"\n" +
    "         analytics-category=\"exercise\"></div>\n" +
    "    <ng-switch\n" +
    "            on=\"vm.currentSlide !== vm.questionsWithAnswers.length - 1 && vm.answeredCount !== vm.questionsWithAnswers.length\"\n" +
    "            ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "            class=\"ng-hide\"\n" +
    "            ng-click=\"d.next()\">\n" +
    "        <button ng-switch-when=\"true\"\n" +
    "                class=\"btn next\">\n" +
    "            <div class=\"only-tablet\"\n" +
    "                 analytics-on=\"click\"\n" +
    "                 analytics-event=\"click-next\"\n" +
    "                 analytics-category=\"exercise\">\n" +
    "                <span>NEXT</span>\n" +
    "                <i class=\"question-arrow-right-icon\"></i>\n" +
    "            </div>\n" +
    "        </button>\n" +
    "        <button ng-switch-when=\"false\"\n" +
    "                class=\"btn finish\">\n" +
    "            <div analytics-on=\"click\"\n" +
    "                 analytics-event=\"click-finish\"\n" +
    "                 analytics-category=\"exercise\">DONE\n" +
    "            </div>\n" +
    "        </button>\n" +
    "    </ng-switch>\n" +
    "    <button class=\"btn sum ng-hide\"\n" +
    "            ng-click=\"settings.onSummary()\"\n" +
    "            ng-show=\"settings.viewMode === d.reviewModeId\"\n" +
    "            analytics-on=\"click\"\n" +
    "            analytics-event=\"click-summary\"\n" +
    "            analytics-category=\"exercise\">SUMMARY\n" +
    "    </button>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperDesktopTemplate.html",
    "<znk-swiper class=\"znk-carousel\"\n" +
    "            ng-model=\"vm.currSlideIndex\"\n" +
    "            actions=\"vm.swiperActions\"\n" +
    "            ng-change=\"vm.SlideChanged()\"\n" +
    "            disable-swipe=\"{{vm.isLocked}}\">\n" +
    "    <div class=\"swiper-slide\"\n" +
    "        ng-repeat=\"question in vm.questions\">\n" +
    "        <question-builder question=\"question\"\n" +
    "                          ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                          ng-change=\"onQuestionAnswered(question)\">\n" +
    "        </question-builder>\n" +
    "    </div>\n" +
    "</znk-swiper>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperMobileTemplate.html",
    "<ion-slide-box znk-slide=\"settings.slideDirection\" class=\"znk-carousel\"\n" +
    "               show-pager=\"false\"\n" +
    "               active-slide=\"vm.currentSlide\">\n" +
    "    <question-builder slide-repeat-drv=\"question in vm.questionsWithAnswers\"\n" +
    "                      question=\"question\"\n" +
    "                      ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                      ng-change=\"vm.questionAnswered(question)\">\n" +
    "    </question-builder>\n" +
    "</ion-slide-box>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExerciseDrv.html",
    "<div ng-transclude></div>\n" +
    "<questions-carousel class=\"znk-carousel-container\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    disable-swipe=\"{{vm.slideDirection !== 2}}\"\n" +
    "                    ng-model=\"vm.currentSlide\"\n" +
    "                    on-question-answered=\"vm.questionAnswered()\"\n" +
    "                    slide-direction=\"{{vm.slideDirection}}\">\n" +
    "</questions-carousel>\n" +
    "<znk-exercise-btn-section class=\"btn-section\"\n" +
    "                          prev-question=\"vm.setCurrentIndexByOffset(-1)\"\n" +
    "                          next-question=\"vm.setCurrentIndexByOffset(1)\"\n" +
    "                          on-done=\"settings.onDone()\">\n" +
    "</znk-exercise-btn-section>\n" +
    "<znk-exercise-pager class=\"ng-hide\"\n" +
    "                    ng-show=\"vm.showPager\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    ng-model=\"vm.currentSlide\">\n" +
    "</znk-exercise-pager>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExercisePagerDrv.html",
    "<znk-scroll>\n" +
    "    <div class=\"pager-items-wrapper\">\n" +
    "        <div class=\"pager-item\"\n" +
    "             ng-repeat=\"question in questions track by question.id\"\n" +
    "             question-status=\"question.__questionStatus\"\n" +
    "             question=\"question\"\n" +
    "             ng-click=\"d.tap($index)\">\n" +
    "            <div class=\"question-bookmark-icon\"></div>\n" +
    "            <div class=\"question-status-indicator\">\n" +
    "                <div class=\"index\">{{::$index + 1}}</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</znk-scroll>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkSwiperTemplate.html",
    "<div class=\"swiper-container\">\n" +
    "    <!-- Additional required wrapper -->\n" +
    "    <div class=\"swiper-wrapper\" ng-transclude>\n" +
    "        <!-- Slides -->\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/popUp/svg/exclamation-mark-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-556.8 363.3 50.8 197.2\" style=\"enable-background:new -556.8 363.3 50.8 197.2;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.exclamation-mark-icon .st0 {\n" +
    "        fill: none;\n" +
    "        enable-background: new;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path d=\"M-505.9,401.6c-0.4,19.5-5.2,38.2-8.7,57.1c-2.8,15.5-4.7,31.2-6.7,46.8c-0.3,2.6-1.1,4-3.7,4.3c-1.5,0.2-2.9,0.6-4.4,0.7\n" +
    "		c-9.2,0.7-9.6,0.4-10.7-8.7c-3.4-29.6-8-58.9-14.6-87.9c-2.3-10.1-3.2-20.4-0.5-30.7c3.7-14.1,17.2-22.3,31.5-19.3\n" +
    "		c9.2,1.9,14.7,8.8,16.2,20.9C-506.7,390.3-506.4,396-505.9,401.6z\"/>\n" +
    "	<path d=\"M-528.9,525.7c10.9,0,16.8,5.3,16.9,15.2c0.1,11-9.3,19.7-21.4,19.6c-8.8,0-14.7-7-14.7-17.7\n" +
    "		C-548.2,530.9-542.4,525.7-528.9,525.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/chevron-icon.svg",
    "<svg x=\"0px\" y=\"0px\" viewBox=\"0 0 143.5 65.5\">\n" +
    "    <polyline class=\"st0\" points=\"6,6 71.7,59.5 137.5,6 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/correct-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\" style=\"enable-background:new 0 0 188.5 129;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#231F20;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/wrong-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\" style=\"enable-background:new 0 0 126.5 126.5;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#231F20;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
