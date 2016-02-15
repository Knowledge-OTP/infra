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
        'znk.infra.contentAvail',
        'znk.infra.popUp',
        'znk.infra.estimatedScore',
        'znk.infra.stats',
        'znk.infra.znkTimeline'
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

    angular.module('znk.infra.estimatedScore', ['znk.infra.config','znk.infra.znkExercise'])
        .run([
            'EstimatedScoreEventsHandlerSrv',
            function(EstimatedScoreEventsHandlerSrv){
                EstimatedScoreEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', ['znk.infra.config','znk.infra.utility']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general', ['znk.infra.enum', 'znk.infra.svgIcon'])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

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

    angular.module('znk.infra.stats', ['znk.infra.enum','znk.infra.znkExercise'])
        .run([
            'StatsEventsHandlerSrv',
            function(StatsEventsHandlerSrv){
                StatsEventsHandlerSrv.init();
            }
        ]);
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

(function (angular) {
    'use strict';
    var svgMap = {
        drill: 'components/znkTimeline/svg/icons/timeline-drills-icon.svg' ,
        game: 'components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg' ,
        tutorial: 'components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg' ,
        section: 'components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg',
        practice: 'components/znkTimeline/svg/icons/timeline-test-icon.svg'
    };
    angular.module('znk.infra.znkTimeline', ['znk.infra.svgIcon', 'znk.infra.enum'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }])
        .constant('timelineImages', svgMap);

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
                ['MINI TEST', 1, 'miniTest'],
                ['DIAGNOSTIC', 2, 'diagnostic']
            ]);
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

    var exerciseTypeConst = {
        TUTORIAL: 1,
        PRACTICE: 2,
        GAME: 3,
        SECTION: 4,
        DRILL: 5
    };

    angular.module('znk.infra.enum')
        .constant('exerciseTypeConst', exerciseTypeConst)
        .factory('ExerciseTypeEnum', [
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

    angular.module('znk.infra.enum').factory('QuestionFormatEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var QuestionFormatEnum = new EnumSrv.BaseEnum([
                ['TEXT',1,'text'],
                ['AUDIO',2, 'audio'],
                ['TEXT_AUDIO', 3, 'text audio'],
                ['PROSE_SUMMARY', 4, 'prose Summary'],
                ['FILL_IN_TABLE', 5, 'fill in a table'],
                ['CONNECTING_CONTENT', 6, 'connecting content'],
                ['INDEPENDENT', 7, 'independent'],
                ['STANDARD', 8, 'standard']
            ]);

            return QuestionFormatEnum;
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

            BaseEnum.prototype.getValByEnum = function getValByEnum(id) {
                var enumsObj = this;
                var val;
                for (var prop in enumsObj) {
                  if (enumsObj.hasOwnProperty(prop)) {
                      var enumObj = enumsObj[prop];
                      if (enumObj.enum === id) {
                          val = enumObj.val;
                          break;
                      }
                  }
                }
                return val;
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

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv', function EstimatedScoreEventsHandler() {
        function pointsMap(correctWithinAllowedTimeFrame, correctAfterAllowedTimeFrame, wrongWithinAllowedTimeFrame, wrongAfterAllowedTimeFrame) {
            var ret = {};

            if (angular.isDefined(correctWithinAllowedTimeFrame)) {
                ret.correctWithin = correctWithinAllowedTimeFrame;
            }

            if (angular.isDefined(correctAfterAllowedTimeFrame)) {
                ret.correctAfter = correctAfterAllowedTimeFrame;
            }

            if (angular.isDefined(wrongWithinAllowedTimeFrame)) {
                ret.wrongWithin = wrongWithinAllowedTimeFrame;
            }

            if (angular.isDefined(wrongAfterAllowedTimeFrame)) {
                ret.wrongAfter = wrongAfterAllowedTimeFrame;
            }

            ret.unanswered = 0;

            return ret;
        }

        var diagnosticScoring = {};
        this.setDiagnosticScoring = function (diagnosticScoringData) {
            var keys = Object.keys(diagnosticScoringData);
            keys.forEach(function(questionDifficulty){
                var scoringDataArr = diagnosticScoringData[questionDifficulty];
                diagnosticScoring[questionDifficulty] = pointsMap.apply(this,scoringDataArr);
            });
        };

        var exercisesRawScoring = {};
        this.setExerciseRawPoints = function(exerciseType,scoringData){
            exercisesRawScoring[exerciseType] = pointsMap.apply(this,scoringData);
        };

        var allowedTimeForExercisesMap;
        this.setAllowedTimeForExercises = function(_allowedTimeForExercisesMap){
            allowedTimeForExercisesMap = _allowedTimeForExercisesMap;
        };

        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum','ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum,ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log) {
                if(angular.equals({},diagnosticScoring)){
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if(angular.equals({},exercisesRawScoring)){
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if(!allowedTimeForExercisesMap){
                    $log.error('EstimatedScoreEventsHandlerSrv: allowedTimeForExercisesMap was not set !!!');
                }

                var EstimatedScoreEventsHandlerSrv = {};

                var childScope = $rootScope.$new(true);

                function _basePointsGetter(pointsMap, answerStatus, withinAllowTime) {
                    var key;
                    if (answerStatus === ExerciseAnswerStatusEnum.unanswered.enum) {
                        key = 'unanswered';
                    } else {
                        key = answerStatus === ExerciseAnswerStatusEnum.correct.enum ? 'correct' : 'wrong';
                        key += withinAllowTime ? 'Within' : 'After';
                    }
                    return pointsMap[key];
                }

                function _getDiagnosticQuestionPoints(question, result) {
                    var pointsMap = diagnosticScoring[question.difficulty];
                    var answerStatus = result.isAnsweredCorrectly ? ExerciseAnswerStatusEnum.correct.enum : ExerciseAnswerStatusEnum.wrong.enum;
                    return _basePointsGetter(pointsMap, answerStatus, true);
                }

                function diagnosticSectionCompleteHandler(section, sectionResult) {
                    var score = 0;

                    var questions = section.questions;
                    for (var i in sectionResult.questionResults) {
                        var question = questions[i];
                        var result = sectionResult.questionResults[i];
                        score += _getDiagnosticQuestionPoints(question, result);
                    }
                    EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id);
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var isAnsweredWithinAllowedTime;
                    var answerStatus;

                    //answered after allowed time
                    if (angular.isDefined(result.answerAfterTime)) {
                        isAnsweredWithinAllowedTime = false;
                        answerStatus = result.answerAfterTime;
                    } else {//answered within allowed time
                        isAnsweredWithinAllowedTime = true;
                        answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);
                    }

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, isAnsweredWithinAllowedTime);
                }

                function calculateRawScore(exerciseType, exerciseResult, allowedTime) {
                    if(!exercisesRawScoring[exerciseType]){
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: '+ exerciseType);
                    }

                    var questionResults = exerciseResult.questionResults;

                    var rawPoints = {
                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                        earned: 0
                    };

                    var allowedTimeForExercise = angular.isDefined(allowedTime) ? allowedTime : allowedTimeForExercisesMap[exerciseType];
                    if(angular.isUndefined(allowedTimeForExercise)){
                        $log.error('EstimatedScoreEventsHandlerSrv: allowed time missing for the following exercise type: ' + exerciseType);
                    }
                    var withinAllowedTime = allowedTimeForExercise >= exerciseResult.duration;
                    questionResults.forEach(function (result) {
                        rawPoints.earned += _getQuestionRawPoints(exerciseType, result, withinAllowedTime);
                    });
                    return rawPoints;
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                    if (isDiagnostic) {
                        diagnosticSectionCompleteHandler(section, sectionResult);
                    }
                    var rawScore = calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult, section.time);
                    EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id, isDiagnostic);
                });

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    var rawScore = calculateRawScore(exerciseType, exerciseResult);
                    EstimatedScoreSrv.addRawScore(rawScore, exerciseType, exercise.subjectId, exercise.id);
                }

                var exercisesHandledByBaseExerciseFinishHandler = [
                    {
                        name: exerciseEventsConst.drill.FINISH,
                        type: ExerciseTypeEnum.DRILL.enum
                    },
                    {
                        name: exerciseEventsConst.tutorial.FINISH,
                        type: ExerciseTypeEnum.TUTORIAL.enum
                    },
                    {
                        name: exerciseEventsConst.game.FINISH,
                        type: ExerciseTypeEnum.GAME.enum
                    }
                ];

                exercisesHandledByBaseExerciseFinishHandler.forEach(function (evt) {
                    childScope.$on(evt.name, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, evt.type));
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv', [
        'SubjectEnum', 'InfraConfigSrv',
        function (SubjectEnum, InfraConfigSrv) {
            var EstimatedScoreHelperSrv = this;

            var StorageSrv = InfraConfigSrv.getStorageService();

            var ESTIMATE_SCORE_PATH = StorageSrv.variables.appUserSpacePath + '/estimatedScore';

            function _SetSubjectInitialVal(obj,initValue){
                var subjectKeys = Object.keys(SubjectEnum);
                for(var i in subjectKeys){
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                if(!EstimatedScoreHelperSrv.getEstimatedScoreData.prom){
                    EstimatedScoreHelperSrv.getEstimatedScoreData.prom = StorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
                        var defaultValues = {
                            estimatedScores: {},
                            sectionsRawScores:{},
                            exercisesRawScores: {},
                            processedExercises: []
                        };

                        _SetSubjectInitialVal(defaultValues.estimatedScores,[]);
                        _SetSubjectInitialVal(defaultValues.sectionsRawScores,[]);
                        var rawScoreInitialObject = {
                            total: 0,
                            earned: 0
                        };
                        _SetSubjectInitialVal(defaultValues.exercisesRawScores,rawScoreInitialObject);

                        angular.forEach(defaultValues, function(defaultVal, defaultValKey){
                            if(angular.isUndefined(estimatedScore[defaultValKey])){
                                estimatedScore[defaultValKey] = defaultVal ;
                            }

                            if(estimatedScore[defaultValKey] !== defaultVal && angular.isObject(defaultVal)){
                                var currVal = estimatedScore[defaultValKey];
                                angular.forEach(defaultVal, function(innerDefaultVal, innerDefaultValueKey){
                                    if(angular.isUndefined(currVal[innerDefaultValueKey])){
                                        currVal[innerDefaultValueKey] = innerDefaultVal;
                                    }
                                });
                            }
                        });

                        return estimatedScore;
                    });
                }
                return EstimatedScoreHelperSrv.getEstimatedScoreData.prom;
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                return StorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
            };
        }
    ]);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreSrv',function(){

        var subjectsRawScoreEdges;
        this.setSubjectsRawScoreEdges = function(_subjectsRawScoreEdges){
            subjectsRawScoreEdges = _subjectsRawScoreEdges;
        };

        var rawScoreToScoreFnGetter;
        this.setRawScoreToRealScoreFn = function(_rawScoreToScoreFnGetter){
            rawScoreToScoreFnGetter = _rawScoreToScoreFnGetter;
        };

        var minDiagnosticScore;
        var maxDiagnosticScore;
        this.setMinMaxDiagnosticScore = function(minScore, maxScore){
            minDiagnosticScore = minScore;
            maxDiagnosticScore = maxScore;
        };

        this.$get = [
            'EstimatedScoreHelperSrv', 'ExerciseTypeEnum', '$injector', '$q', 'SubjectEnum', '$log',
            function (EstimatedScoreHelperSrv, ExerciseTypeEnum, $injector, $q, SubjectEnum, $log) {
                if(!subjectsRawScoreEdges){
                    $log.error('EstimatedScoreSrv: subjectsRawScoreEdges was not set');
                }

                if(!rawScoreToScoreFnGetter){
                    $log.error('EstimatedScoreSrv: rawScoreToScoreFnGetter was not set !!!');
                }

                var EstimatedScoreSrv = {};

                function _baseGetter(key, subjectId) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScore) {
                        if (angular.isUndefined(subjectId)) {
                            return estimatedScore[key];
                        }
                        return estimatedScore[key][subjectId];
                    });
                }

                function _calculateNormalizedRawScore(sectionSubjectRawScores, exerciseSubjectRawScore, subjectId) {
                    var sectionsWithWeightTotalPoints = 0;
                    var sectionsWithWeightEarnedPoints = 0;
                    var sectionsTotalPoints = 0;
                    sectionSubjectRawScores.forEach(function (sectionRawScore, index) {
                        sectionsTotalPoints += sectionRawScore.total;
                        var multiBy = +index + 1;
                        sectionsWithWeightTotalPoints += sectionRawScore.total * multiBy;
                        sectionsWithWeightEarnedPoints += sectionRawScore.earned * multiBy;
                    });
                    var combinedSectionRawScore = {
                        total: sectionsTotalPoints,
                        earned: sectionsTotalPoints * sectionsWithWeightEarnedPoints / sectionsWithWeightTotalPoints
                    };
                    var rawScore = (2 / 3) * combinedSectionRawScore.earned + (1 / 3) * exerciseSubjectRawScore.earned;
                    var maxRawScore = (2 / 3) * combinedSectionRawScore.total + (1 / 3) * exerciseSubjectRawScore.total;
                    var subjectRawScoreEdges = subjectsRawScoreEdges[subjectId];
                    if(angular.isUndefined(subjectRawScoreEdges)){
                        $log.error('EstimatedScoreSrv: subjectRawScoreEdges was not defined for the following subject: ' + subjectId);
                    }
                    var normalizedScore = subjectRawScoreEdges.max * rawScore / maxRawScore;
                    return Math.max(normalizedScore, subjectRawScoreEdges.min);//verify result is higher than min
                }

                function _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore, addLimitToNewEstimatedScore) {
                    return _getScoreByRawScore(subjectId, normalizedRawScore).then(function (newEstimatedScore) {
                        if (!currEstimatedScore) {
                            return newEstimatedScore;
                        }

                        if (addLimitToNewEstimatedScore && Math.abs(newEstimatedScore - currEstimatedScore) > (newEstimatedScore * 0.05)) {
                            return currEstimatedScore + (newEstimatedScore - currEstimatedScore > 0 ? 1 : -1) * newEstimatedScore * 0.05;
                        }
                        return +newEstimatedScore.toFixed(2);
                    });
                }

                function _isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId) {
                    var exerciseKey = exerciseType + '_' + exerciseId;
                    if (estimatedScoreData.processedExercises.indexOf(exerciseKey) !== -1) {
                        return true;
                    }
                    estimatedScoreData.processedExercises.push(exerciseKey);
                }

                var _getScoreByRawScore = (function (){
                    var rawScoreToScoreFn = $injector.invoke(rawScoreToScoreFnGetter);
                    return function(subjectId, normalizedRawScore){
                        return $q.when(rawScoreToScoreFn(subjectId,normalizedRawScore));
                    };
                })();

                EstimatedScoreSrv.getEstimatedScores = _baseGetter.bind(this, 'estimatedScores');

                EstimatedScoreSrv.getSectionsRawScores = _baseGetter.bind(this, 'sectionsRawScores');

                EstimatedScoreSrv.getExercisesRawScore = _baseGetter.bind(this, 'exercisesRawScores');

                EstimatedScoreSrv.getLatestEstimatedScore = function(subjectId){
                    return _baseGetter('estimatedScores',subjectId).then(function(allScoresOrScoreForSubject){
                        if(angular.isDefined(subjectId)){
                            if(!allScoresOrScoreForSubject.length){
                                return {};
                            }
                            return allScoresOrScoreForSubject[allScoresOrScoreForSubject.length - 1];
                        }
                        var latestScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject,function(scoresForSubject,subjectId){
                            latestScoresPerSubject[subjectId] = scoresForSubject.length ? scoresForSubject[scoresForSubject.length -1] : {};
                        });
                        return latestScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.setDiagnosticSectionScore = function (score, exerciseType, subjectId, exerciseId) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                        //score was already set
                        if (estimatedScoreData.estimatedScores[subjectId].length) {
                            return $q.reject('Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId);
                        }

                        score = Math.max(minDiagnosticScore, Math.min(maxDiagnosticScore, score));
                        estimatedScoreData.estimatedScores[subjectId].push({
                            exerciseType: exerciseType,
                            exerciseId: exerciseId,
                            score: score,
                            time: Date.now()
                        });
                        return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData).then(function () {
                            return estimatedScoreData.estimatedScores[subjectId][estimatedScoreData.estimatedScores[subjectId].length - 1];
                        });
                    });
                };

                EstimatedScoreSrv.addRawScore = function (rawScore, exerciseType, subjectId, exerciseId, isDiagnostic) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                        if (_isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId)) {
                            return $q.reject('Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId);
                        }
                        if (exerciseType === ExerciseTypeEnum.SECTION.enum) {
                            var sectionSubjectRowScores = estimatedScoreData.sectionsRawScores[subjectId];
                            var newSectionSubjectRawScore = {
                                exerciseType: exerciseType,
                                exerciseId: exerciseId,
                                time: Date.now()
                            };
                            angular.extend(newSectionSubjectRawScore, rawScore);
                            sectionSubjectRowScores.push(newSectionSubjectRawScore);
                        } else {
                            var exerciseSubjectRawScore = estimatedScoreData.exercisesRawScores[subjectId];
                            exerciseSubjectRawScore.exerciseType = exerciseType;
                            exerciseSubjectRawScore.exerciseId = exerciseId;
                            exerciseSubjectRawScore.time = Date.now();
                            exerciseSubjectRawScore.total += rawScore.total;
                            exerciseSubjectRawScore.earned += rawScore.earned;
                        }

                        if (!isDiagnostic) {
                            var normalizedRawScore = _calculateNormalizedRawScore(estimatedScoreData.sectionsRawScores[subjectId], estimatedScoreData.exercisesRawScores[subjectId], subjectId);
                            var estimatedScoresForSpecificSubject = estimatedScoreData.estimatedScores[subjectId];
                            var currEstimatedScore = estimatedScoresForSpecificSubject[estimatedScoresForSpecificSubject.length - 1] || {};
                            return _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore.score, exerciseType !== ExerciseTypeEnum.SECTION.enum).then(function (newEstimatedScore) {
                                estimatedScoreData.estimatedScores[subjectId].push({
                                    exerciseType: exerciseType,
                                    exerciseId: exerciseId,
                                    score: newEstimatedScore,
                                    time: Date.now()
                                });
                                return estimatedScoreData;
                            });
                        }
                        return estimatedScoreData;
                    }).then(function (estimatedScoreData) {
                        return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData);
                    });
                };

                return EstimatedScoreSrv;
            }];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv', 'ExerciseStatusEnum',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv, ExerciseStatusEnum) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXERCISE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';


            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';

            var EXERCISES_STATUS_PATH = StorageSrv.variables.appUserSpacePath + '/exercisesStatus';

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

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum) {
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
                            initResult.examId = examId;
                            setProm = getExamResultProm.then(function(examResult){
                                if(!examResult.sectionResults){
                                    examResult.sectionResults = {};
                                }
                                if(examSectionsNum && !examResult.examSectionsNum) {
                                    examResult.examSectionsNum = examSectionsNum;
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
                }).then(function(exerciseResult){
                    exerciseResult.$save = exerciseSaveFn;
                    return exerciseResult;
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

            function exerciseSaveFn(){
                /* jshint validthis: true */
                var exerciseResult = this;
                var getExercisesStatusDataProm = _getExercisesStatusData();
                var dataToSave = {};

                var totalTimeSpentOnQuestions = exerciseResult.questionResults.reduce(function(previousValue, currResult) {
                    return previousValue + (currResult.timeSpent || 0);
                },0);

                exerciseResult.duration = totalTimeSpentOnQuestions;

                var numOfAnsweredQuestions = exerciseResult.questionResults.length;
                exerciseResult.avgTimePerQuestion = numOfAnsweredQuestions ? Math.round(totalTimeSpentOnQuestions / numOfAnsweredQuestions) : 0;
                var exerciseResultPath = _getExerciseResultPath(exerciseResult.guid);

                dataToSave[exerciseResultPath] = exerciseResult;

                return getExercisesStatusDataProm.then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseResult.exerciseTypeId]){
                        exercisesStatusData[exerciseResult.exerciseTypeId] = {};
                    }

                    var exerciseNewStatus = exerciseResult.isComplete ?
                        ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                    exercisesStatusData[exerciseResult.exerciseTypeId][exerciseResult.exerciseId] = new ExerciseStatus(exerciseNewStatus);
                    dataToSave[EXERCISES_STATUS_PATH] = exercisesStatusData;

                    var checkIfALlSectionsDoneProm = $q.when();
                    if(exerciseNewStatus === ExerciseStatusEnum.COMPLETED.enum && exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        checkIfALlSectionsDoneProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function(examResult) {
                            if(areAllSectionCompleted(examResult,exercisesStatusData)){
                                examResult.isComplete = true;
                                examResult.endedTime = StorageSrv.variables.currTimeStamp;
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return checkIfALlSectionsDoneProm.then(function() {
                        var storage = InfraConfigSrv.getStorageService();
                        storage.set(dataToSave);

                        return exerciseResult;
                    });

                });
            }

            function areAllSectionCompleted(examResult, exercisesStatusData) {
                var sectionExercisesStatus = exercisesStatusData[ExerciseTypeEnum.SECTION.enum];
                var sectionResultsToArr = Object.keys(examResult.sectionResults);

                if(sectionResultsToArr.length !== +examResult.examSectionsNum) {
                    return false;
                }

                for(var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var isSectionComplete = sectionExercisesStatus[sectionId].status === ExerciseStatusEnum.COMPLETED.enum;
                    if(!isSectionComplete){
                        return false;
                    }
                }

                return true;
            }

            function _getExercisesStatusData(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXERCISES_STATUS_PATH);
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

            this.getExerciseStatus = function(exerciseType, exerciseId){
                return _getExercisesStatusData().then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseType] || !exercisesStatusData[exerciseType][exerciseId]){
                        return new ExerciseStatus(ExerciseStatusEnum.NEW.enum);
                    }
                    return exercisesStatusData[exerciseType][exerciseId];
                });
            };

            function ExerciseStatus(status){
                this.status = status;
            }
        }
    ]);
})(angular);

/**
 * evaluates content , then it appended it to the DOM , and finally it compiles it with scope which was created out of the directive scope.
 * attrs-
 *  compile-drv: expression which be evaluated and then appended to the dom.
 *  bind-once: angular expression which evaluated by the scope , if it true then the watcher will be killed after the first time content was added to the dom
 */

'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('compile', [
        '$compile','$animate',
        function($compile,$animate) {
            return {
            link: function(scope,element,attrs){
                var _childScope;

                var watchDestroyer = scope.$watch(attrs.compile,function(newVal){
                    if(_childScope){
                        _childScope.$destroy();
                        _childScope = null;
                    }

                    $animate.leave(element.children());
                    element.empty();

                    if(typeof newVal === 'undefined'){
                        return;
                    }

                    if(scope.$eval(attrs.bindOnce)){
                        watchDestroyer();
                    }

                    if(typeof newVal !== 'string'){
                        if(newVal === null){
                            newVal = '';
                        }
                        newVal = '' + newVal;
                    }

                    var _htmlStrRegex = /^<(\w+)( .*|)>(.|\n)*(<\/\1>|)$/;
                    /**
                     * check if html string , if true create jq lite element of it and append with animation otherwise just append to the dom
                     */
                    if(_htmlStrRegex.test(newVal)){
                        _childScope = scope.$new();
                        var $content = angular.element(newVal);
                        $animate.enter($content,element);
                        $compile(element.children())(_childScope);
                    }else{
                        element.append(newVal);
                    }
                });
            }
        };
    }]);
})(angular);

/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @prefix a comma separated string of prefixes to the attribute values
 *  @suffix a comma separated string of suffixes to the attribute values
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
                                value = value.replace(/\s+/g,'');   // regex to clear spaces

                                if (value === 'class') {
                                    element.addClass(attrVal);
                                } else {
                                    element.attr(value, attrVal);
                                }
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


/**
 * attrs -
 *      ng-model
 *      play
 *      type:
 *          1: timer with displayed time.
 *          2: timer with round progress bar
 *      config:
 *          countDown
 *          format: defaulted to mm:ss
 *          only for type 2:
 *              stroke
 *              bgcolor
 *              color
 *              radius
 *              max
 *              clockwise
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('timer', [
        '$interval',
        function ($interval) {
            var timerTypes = {
                'REGULAR': 1,
                'ROUND_PROGRESSBAR': 2
            };

            return {
                scope: {
                    play: '&',
                    typeGetter: '&?type',
                    configGetter: '&?config'
                },
                require: '?ngModel',
                replace: true,
                templateUrl: 'components/general/templates/timerDrv.html',
                link: function link(scope, element, attrs, ngModelCtrl) {
                    var domElement = element[0];

                    scope.ngModelCtrl = ngModelCtrl;

                    function padNum(num){
                        if(('' + Math.abs(+num)).length < 2){
                            return (num < 0 ? '-' : '') + '0' + Math.abs(+num);
                        }else{
                            return num;
                        }
                    }

                    function getDisplayedTime(currentTime,format){
                        var totalSeconds = currentTime / 1000;
                        var seconds = Math.floor(totalSeconds % 60);
                        var minutes = Math.floor(Math.abs(totalSeconds) / 60) * (totalSeconds < 0 ? -1 : 1);
                        var paddedSeconds = padNum(seconds);
                        var paddedMinutes = padNum(minutes);

                        return format
                            .replace('tss',totalSeconds)
                            .replace('ss',paddedSeconds)
                            .replace('mm',paddedMinutes);

                    }

                    function updateTime(currentTime) {
                        var displayedTime = getDisplayedTime(currentTime,scope.config.format);
                        var timeDisplayDomElem;
                        switch(scope.type){
                            case 1:
                                timeDisplayDomElem = domElement.querySelector('.timer-view');
                                break;
                            case 2:
                                timeDisplayDomElem = domElement.querySelector('.timer-display');
                                break;
                        }
                        if(timeDisplayDomElem){
                            timeDisplayDomElem.innerText = displayedTime;
                        }
                    }

                    var intervalHandler;
                    var INTERVAL_TIME = 1000;

                    scope.type = scope.typeGetter() || 1;
                    scope.config = scope.configGetter() || {};
                    var configDefaults = {
                        format: 'mm:ss'
                    };
                    scope.config = angular.extend(configDefaults, scope.config);

                    switch (scope.type) {
                        case timerTypes.ROUND_PROGRESSBAR:
                        {
                            var roundProgressBarConfigDefults = {
                                stroke: 3,
                                bgcolor: '#0a9bad',
                                color: '#e1e1e1'
                            };
                            scope.config = angular.extend(roundProgressBarConfigDefults, scope.config);
                            scope.config.radius = scope.config.radius || Math.floor(element[0].offsetHeight / 2) || 45;
                            break;
                        }
                    }

                    function tick() {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        currentTime += scope.config.countDown ? -INTERVAL_TIME : INTERVAL_TIME;
                        updateTime(currentTime);
                        ngModelCtrl.$setViewValue(currentTime);
                    }

                    ngModelCtrl.$render = function () {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        updateTime(currentTime);
                    };

                    scope.$watch('play()', function (play) {
                        if (intervalHandler) {
                            $interval.cancel(intervalHandler);
                        }

                        if (play) {
                            intervalHandler = $interval(tick, INTERVAL_TIME, 0, false);
                        }
                    });

                    scope.$on('$destroy', function () {
                        $interval.cancel(intervalHandler);
                    });
                }
            };
        }]);

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
                            $log.debug('InfraConfigSrv: storage service name was not defined');
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

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        '$rootScope','exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'SubjectEnum', 'QuestionFormatEnum',
        function ($rootScope, exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, SubjectEnum, QuestionFormatEnum) {
            var StatsEventsHandlerSrv = {};

            var childScope = $rootScope.$new(true);

            function _eventHandler(exerciseType, evt, exercise, results){
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function(isRecorded){
                    if(isRecorded){
                        return;
                    }

                    var newStats  = {};

                    results.questionResults.forEach(function(result,index){
                        var question = exercise.questions[index];
                        var categoryId = question.categoryId;

                        //if writing question then only standard format should be recorded
                        if(question.subjectId === SubjectEnum.WRITING.enum && question.questionFormatId !== QuestionFormatEnum.STANDARD.enum){
                            return;
                        }

                        if(isNaN(+categoryId) || categoryId === null){
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ',question.id,categoryId);
                            return;
                        }

                        if(!newStats[categoryId]){
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if(angular.isUndefined(result.userAnswer)){
                            newStat.unanswered++;
                        }else if(result.isAnsweredCorrectly){
                            newStat.correct++;
                        }else{
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            }

            var eventsToRegister = [];
            var exerciseTypeEnumArr = ExerciseTypeEnum.getEnumArr();
            exerciseTypeEnumArr.forEach(function(enumObj){
                var exerciseNameLowerCase = enumObj.val.toLowerCase();
                eventsToRegister.push({
                    evt: exerciseEventsConst[exerciseNameLowerCase].FINISH,
                    exerciseType: enumObj.enum
                });
            });

            eventsToRegister.forEach(function(evtConfig){
                childScope.$on(evtConfig.evt,_eventHandler.bind(StatsEventsHandlerSrv,evtConfig.exerciseType));
            });
            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsQuerySrv', [
        function () {
            var StatsQuerySrv = {};

            return StatsQuerySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').provider('StatsSrv', function () {
        var getCategoryLookup;
        this.setCategoryLookup = function (_getCategoryLookup) {
            getCategoryLookup = _getCategoryLookup;
        };

        this.$get = [
            'InfraConfigSrv', '$q', 'SubjectEnum', '$log', '$injector',
            function (InfraConfigSrv, $q, SubjectEnum, $log, $injector) {
                if (!getCategoryLookup) {
                    $log.error('StatsSrv: getCategoryLookup was not set !!!!');
                }

                var StorageSrv = InfraConfigSrv.getStorageService();
                var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

                var StatsSrv = {};

                function _getCategoryLookup() {
                    return $injector.invoke(getCategoryLookup);
                }

                function BaseStats(id, addInitOffset) {
                    if (angular.isDefined(id)) {
                        this.id = +id;
                    }

                    var totalQuestions;
                    var correct;
                    var unanswered;
                    var wrong;
                    var totalTime;


                    if (addInitOffset) {
                        totalQuestions = 5;
                        correct = 1;
                        unanswered = 0;
                        wrong = 4;
                        totalTime = 0;
                    } else {
                        totalQuestions = 0;
                        correct = 0;
                        unanswered = 0;
                        wrong = 0;
                        totalTime = 0;
                    }

                    this.totalQuestions = totalQuestions;
                    this.correct = correct;
                    this.unanswered = unanswered;
                    this.wrong = wrong;
                    this.totalTime = totalTime;
                }

                function getStats() {
                    var defaults = {
                        processedExercises:{}
                    };
                    return StorageSrv.get(STATS_PATH, defaults);
                }

                function setStats(newStats) {
                    return StorageSrv.set(STATS_PATH, newStats);
                }

                //function _baseStatsGetter(name) {
                //    return getStats().then(function (dailyPersonalization) {
                //        return dailyPersonalization[name + 'Stats'];
                //    });
                //}
                //
                //function _getCategoryWeakness(category) {
                //    if (!category.totalQuestions) {
                //        return -Infinity;
                //    }
                //    return (category.totalQuestions - category.correct) / (category.totalQuestions);
                //}
                //
                //function _getSpecificCategoryWeakness(specificCategory) {
                //    if (!specificCategory.totalQuestions) {
                //        return -Infinity;
                //    }
                //    return (specificCategory.totalQuestions - specificCategory.correct) / (specificCategory.totalQuestions);
                //}

                function _baseStatsUpdater(currStat, newStat) {
                    currStat.totalQuestions += newStat.totalQuestions;
                    currStat.correct += newStat.correct;
                    currStat.unanswered += newStat.unanswered;
                    currStat.wrong += newStat.wrong;
                    currStat.totalTime += newStat.totalTime;
                }

                function _getParentCategoryId(lookUp, categoryId) {
                    return lookUp[categoryId] ? lookUp[categoryId].parentId : lookUp[categoryId];
                }

                //function _weakestSpecificCategory(specificCategoriesForGeneralCategory, allSpecificCategory, specificCategoryDataArr, subjectId, generalCategoryId) {
                //    specificCategoriesForGeneralCategory.forEach(function (specificCategoryId) {
                //        var optionalSpecificCategoryData = allSpecificCategory[specificCategoryId];
                //        if (!optionalSpecificCategoryData) {
                //            optionalSpecificCategoryData = new BaseStats(specificCategoryId, subjectId, generalCategoryId);
                //        }
                //        specificCategoryDataArr.push(optionalSpecificCategoryData);
                //    });
                //}
                //
                //function _weakestGeneralCategory(gcForSubject, allGeneralCategory, generalCategoryDataArr, subjectId) {
                //    gcForSubject.forEach(function (generalCategoryId) {
                //        var optionalGeneralCategoryData = allGeneralCategory[generalCategoryId];
                //        if (!optionalGeneralCategoryData) {
                //            optionalGeneralCategoryData = new BaseStats(generalCategoryId, subjectId);
                //        }
                //        generalCategoryDataArr.push(optionalGeneralCategoryData);
                //    });
                //}

                function _getLevelKey(level) {
                    return 'level' + level + 'Categories';
                }

                function _getCategoryKey(categoryId){
                    return 'id_' + categoryId;
                }

                function _getProcessedExerciseKey(exerciseType, exerciseId){
                    return exerciseType + '_' + exerciseId;
                }

                StatsSrv.getStats = getStats;

                StatsSrv.BaseStats = BaseStats;

                StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                    var getCategoryLookupProm = _getCategoryLookup();
                    var getStatsProm = getStats();
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return $q.all([getCategoryLookupProm, getStatsProm]).then(function (res) {
                        var categoryLookUp = res[0];
                        var stats = res[1];

                        var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                        if(isExerciseRecorded){
                            return;
                        }

                        angular.forEach(newStats, function (newStat, categoryId) {
                            var categoriesToUpdate = [];
                            var categoryIdToAdd = +categoryId;
                            while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                                categoriesToUpdate.unshift(categoryIdToAdd);
                                categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                            }

                            categoriesToUpdate.forEach(function (categoryId, index) {
                                var level = index + 1;
                                var levelKey = _getLevelKey(level);
                                var levelStats = stats[levelKey];
                                if (!levelStats) {
                                    levelStats = {};

                                    stats[levelKey] = levelStats;
                                }

                                var categoryKey = _getCategoryKey(categoryId);
                                var categoryStats = levelStats[categoryKey];
                                if(!categoryStats){
                                    categoryStats = new BaseStats(categoryId,true);

                                    var parentsIds = categoriesToUpdate.slice(0,index);
                                    if(parentsIds.length){
                                        parentsIds.reverse();//parent ids order should be from the bottom to the top
                                        categoryStats.parentsIds = parentsIds;
                                    }

                                    levelStats[categoryKey] = categoryStats;
                                }

                                _baseStatsUpdater(categoryStats,newStat);
                            });
                        });
                        stats.processedExercises[processedExerciseKey] = true;
                        return setStats(stats);
                    });

                };

                StatsSrv.isExerciseStatsRecorded = function(exerciseType, exerciseId){
                    return StatsSrv.getStats().then(function(stats){
                        var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                        return !!stats.processedExercises[processedExerciseKey];
                    });
                };
                //StatsSrv.getGeneralCategoryStats = function () {
                //    return _baseStatsGetter('generalCategory');
                //};

                //StatsSrv.getSpecificCategoryStats = function () {
                //    return _baseStatsGetter('specificCategory');
                //};

                //StatsSrv.getWeakestGeneralCategory = function (optionalGeneralCategories) {
                //    return StatsSrv.getGeneralCategoryStats().then(function (allGeneralCategoryStats) {
                //        var optionalGeneralCategoryDataArr = [];
                //        for (var subjectId in optionalGeneralCategories) {
                //            var optionalGeneralCategoriesForSubject = optionalGeneralCategories[subjectId];
                //            _weakestGeneralCategory(optionalGeneralCategoriesForSubject, allGeneralCategoryStats, optionalGeneralCategoryDataArr, subjectId);
                //        }
                //        optionalGeneralCategoryDataArr.sort(function (generalCategory1, generalCategory2) {
                //            return _getCategoryWeakness(generalCategory2) - _getCategoryWeakness(generalCategory1);
                //        });
                //        $log.debug('weakest general categories array', JSON.stringify(optionalGeneralCategoryDataArr));
                //        return optionalGeneralCategoryDataArr[0];
                //    });
                //};

                //StatsSrv.getWeakestSpecificCategory = function (optionalSpecificCategories) {
                //    $log.debug('calculating weakest specific category for exercise type ', JSON.stringify(optionalSpecificCategories));
                //    return StatsSrv.getSpecificCategoryStats().then(function (allSpecificCategoryStats) {
                //        var optionalSpecificCategoryDataArr = [];
                //        for (var subjectId in optionalSpecificCategories) {
                //            var optionalSpecificCategoriesForSubject = optionalSpecificCategories[subjectId];
                //            for (var generalCategoryId in optionalSpecificCategoriesForSubject) {
                //                var optionalSpecificCategoriesForGeneralCategory = optionalSpecificCategoriesForSubject[generalCategoryId];
                //                _weakestSpecificCategory(optionalSpecificCategoriesForGeneralCategory, allSpecificCategoryStats, optionalSpecificCategoryDataArr, subjectId, generalCategoryId);
                //            }
                //        }
                //        optionalSpecificCategoryDataArr.sort(function (specificCategory1, specificCategory2) {
                //            return _getSpecificCategoryWeakness(specificCategory2) - _getSpecificCategoryWeakness(specificCategory1);
                //        });
                //        $log.debug('weakest specific categories array', JSON.stringify(optionalSpecificCategoryDataArr));
                //        return optionalSpecificCategoryDataArr[0];
                //    });
                //};

                StatsSrv.getPerformanceData = function () {
                    return StatsSrv.getStats().then(function (stats) {
                        var subjectsStats = stats.subjectStats;
                        var generalCategoriesStats = stats.generalCategoryStats;

                        var performanceData = {};

                        var generalCategoriesBySubject = {};
                        var generalCategoryStatsKeys = Object.keys(generalCategoriesStats);
                        var weakestGeneralCategoryBySubject = {};
                        generalCategoryStatsKeys.forEach(function (key) {
                            var generalCategoryStats = generalCategoriesStats[key];

                            if (!generalCategoryStats) {
                                $log.error('StatsSrv: getPerformanceData: null general category stat was received for the following key: ', key);
                                return;
                            }

                            if (!generalCategoriesBySubject[generalCategoryStats.subjectId]) {
                                generalCategoriesBySubject[generalCategoryStats.subjectId] = [];
                            }
                            var processedGeneralCategory = {
                                id: generalCategoryStats.id,
                                levelProgress: generalCategoryStats.totalQuestions ? Math.round(generalCategoryStats.correct / generalCategoryStats.totalQuestions * 100) : 0,
                                avgTime: generalCategoryStats.totalTime ? Math.round(generalCategoryStats.totalTime / generalCategoryStats.totalQuestions / 1000) : 0,
                                answeredQuestions: generalCategoryStats.totalQuestions
                            };
                            generalCategoriesBySubject[generalCategoryStats.subjectId].push(processedGeneralCategory);

                            var weakestGeneralCategoryForSubject = weakestGeneralCategoryBySubject[generalCategoryStats.subjectId];
                            if (!weakestGeneralCategoryForSubject || (weakestGeneralCategoryForSubject.successRate > processedGeneralCategory.levelProgress)) {
                                weakestGeneralCategoryBySubject[generalCategoryStats.subjectId] = {
                                    id: processedGeneralCategory.id,
                                    successRate: processedGeneralCategory.levelProgress
                                };
                            }
                        });

                        SubjectEnum.getEnumArr().forEach(function (subject) {
                            var subjectId = subject.enum;

                            var performanceDataForSubject = performanceData[subjectId] = {};

                            performanceDataForSubject.category = generalCategoriesBySubject[subjectId];
                            performanceDataForSubject.weakestCategory = weakestGeneralCategoryBySubject[subjectId];

                            var subjectStats = subjectsStats[subjectId];
                            if (subjectStats) {
                                performanceDataForSubject.overall = {
                                    value: subjectStats.totalQuestions ? Math.round(subjectStats.correct / subjectStats.totalQuestions * 100) : 0,
                                    avgTime: subjectStats.totalTime ? Math.round(subjectStats.totalTime / subjectStats.totalQuestions / 1000) : 0
                                };
                            }

                        });

                        return performanceData;
                    });
                };

                return StatsSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q', 'StorageSrv',
        function ($log, $q, StorageSrv) {
            function processValuesToSet(source){
                if(angular.isArray(source)){
                    source.forEach(function(item, index){
                        if(angular.isUndefined(item)){
                            source[index] = null;
                        }
                        processValuesToSet(item);
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

                        if(angular.isString(value)){
                            source[key] = processValue(value);
                        }

                        processValuesToSet(value);
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
                        processValuesToSet(valuesToSet);
                        refMap.rootRef.update(valuesToSet, function(err){
                            if(err){
                                defer.reject(err);
                            }
                            defer.resolve();
                        });
                    }else{
                        var newValueCopy = angular.copy(newValue);
                        processValuesToSet(newValueCopy);
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

            function processValue(value){
                if(value === StorageSrv.variables.currTimeStamp){
                    return Firebase.ServerValue.TIMESTAMP;
                }
                return value;
            }

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

            //array utility srv
            UtilitySrv.array = {};

            UtilitySrv.array.convertToMap = function(arr, keyProp){
                if(angular.isUndefined(keyProp)){
                    keyProp = 'id';
                }
                var map = {};
                arr.forEach(function(item){
                    map[item[keyProp]] = item;
                });
                return map;
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
        '$timeout', 'ZnkExerciseViewModeEnum', 'ZnkExerciseAnswersSrv',
        function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv) {
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

                    scope.d.getIndexChar = function(answerIndex){
                        return ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex,answerBuilder.question);
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

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseAnswersSrv', function () {
        this.config = {
            selectAnswer:{}
        };

        var selectAnswer = {};

        this.config.selectAnswer.setAnswerIndexFormatter = function(fn){
            selectAnswer.answerIndexFormatter = fn;
        };

        this.$get = [
            function () {
                var ZnkExerciseAnswersSrv = {
                    selectAnswer: {}
                };

                ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex = function(answerIndex){
                    var formattedAnswerIndex;

                    if(selectAnswer.answerIndexFormatter){
                        formattedAnswerIndex = selectAnswer.answerIndexFormatter.apply(this,arguments);
                    }

                    if(angular.isUndefined(formattedAnswerIndex)){
                        var UPPER_A_ASCII_CODE = 65;
                        formattedAnswerIndex  = String.fromCharCode(UPPER_A_ASCII_CODE + answerIndex);
                    }

                    return formattedAnswerIndex;
                };

                return ZnkExerciseAnswersSrv;
            }
        ];
    });
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
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum) {
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
                        var viewMode = znkExerciseDrvCtrl.getViewMode();

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

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keydown',keyboardClickCB);

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keydown',keyboardClickCB);
                        });

                        var currentQuestionAnsweredWatchFn;
                        if(viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }
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
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes',
                                'unlockSwipeToPrev', 'unlockSwipeToNext'
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
                                var showPager = !!display;
                                if(showPager){
                                    element.addClass('pager-displayed');
                                }else{
                                    element.removeClass('pager-displayed');
                                }
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
                                    var currQuestion = getCurrentQuestion();
                                    var userAnswer = currQuestion.__questionStatus.userAnswer;
                                    currQuestion.__questionStatus.isAnsweredCorrectly = ZnkExerciseUtilitySrv.isAnswerCorrect(currQuestion,userAnswer);

                                    updateTimeSpentOnQuestion();
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
                            if(scope.settings.initForceDoneBtnDisplay === null){
                                if(scope.settings.viewMode === ZnkExerciseViewModeEnum.REVIEW.enum){
                                    scope.actions.forceDoneBtnDisplay(false);
                                }else{
                                    scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);
                                }
                            }else{
                                scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);
                            }
                            scope.actions.pagerDisplay(scope.settings.initPagerDisplay);
                            /**
                             *  INIT END
                             * */

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                var currQuestion = getCurrentQuestion();

                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!currQuestion.__questionStatus.bookmark);
                                }
                                //added since the sliders current was not changed yet
                                $timeout(function(){
                                    scope.settings.onSlideChange(currQuestion, value);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value ,prevValue ,currQuestion);
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

(function (angular) {
    'use strict';

    var exerciseEventsConst = {};

    exerciseEventsConst.tutorial = {
        FINISH: 'tutorial:finish'
    };

    exerciseEventsConst.drill = {
        FINISH: 'drill:finish'
    };

    exerciseEventsConst.practice = {
        FINISH: 'practice:finish'
    };

    exerciseEventsConst.game = {
        FINISH: 'game:finish'
    };

    exerciseEventsConst.section = {
        FINISH: 'section:finish'
    };

    exerciseEventsConst.daily = {
        STATUS_CHANGED: 'daily:status'
    };

    exerciseEventsConst.exam = {
        COMPLETE: 'exam:complete'
    };

    angular.module('znk.infra.znkExercise').constant('exerciseEventsConst', exerciseEventsConst);
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

    var exerciseAnswerStatusConst = {
        unanswered: 0,
        correct: 1,
        wrong: 2
    };
    angular.module('znk.infra.znkExercise').constant('exerciseAnswerStatusConst', exerciseAnswerStatusConst);

    angular.module('znk.infra.znkExercise').factory('ExerciseAnswerStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            var ExerciseAnswerStatusEnum = new EnumSrv.BaseEnum([
                ['unanswered', exerciseAnswerStatusConst.unanswered, 'unanswered'],
                ['correct', exerciseAnswerStatusConst.correct, 'correct'],
                ['wrong', exerciseAnswerStatusConst.wrong, 'wrong']
            ]);

            ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum = function(answer) {
                switch (answer) {
                    case true:
                        return ExerciseAnswerStatusEnum.correct.enum;
                    case false:
                        return ExerciseAnswerStatusEnum.wrong.enum;
                    default :
                        return ExerciseAnswerStatusEnum.unanswered.enum;
                }
            };

            return ExerciseAnswerStatusEnum;
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

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', ['AnswerTypeEnum', '$log',
        function (AnswerTypeEnum, $log) {
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

            ZnkExerciseUtilitySrv.setQuestionsGroupData = function (questions, groupData) {
                var groupDataMap = {};

                angular.forEach(groupData, function (group) {
                    groupDataMap[group.id] = group;
                });

                angular.forEach(questions, function (question) {
                    if (!groupDataMap[question.groupDataId]) {
                        $log.debug('Group data is missing for the following question id ' + question.id);
                    }

                    question.groupData = groupDataMap[question.groupDataId] || {};
                });
            };

            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').directive('znkTimeline',['$window', '$templateCache', function($window, $templateCache) {
        var directive = {
            restrict: 'A',
            scope: {
                timelineData: '=',
                timelineSettings: '='
            },
            link: function (scope, element) {

                var settings = angular.extend({
                    width: $window.innerWidth,
                    height: $window.innerHeight
                }, scope.timelineSettings || {});

                var dataObj;

                var canvasElem = element[0];

                var ctx = canvasElem.getContext('2d');

                var lastLine;

                var nextFlag = false;

                scope.$watch('timelineData', function(val, oldVal) {
                    if(angular.isDefined(val)) {
                        if(val !== oldVal) {
                            ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
                            start(val);
                        } else {
                            start(val);
                        }
                    }
                });

                function start(timelineData) {

                    dataObj = {
                        lastLine: [],
                        biggestScore : {score:0}
                    };

                    lastLine = void(0);

                    if(settings.type === 'multi') {
                        var distance = settings.distance * (timelineData.data.length + 2);
                        settings.width = (distance < $window.innerWidth) ? $window.innerWidth : distance;
                    }

                    if(settings.isMax) {
                        settings.max = 0;
                        angular.forEach(timelineData.data, function(value) {
                            if(value.score > settings.max) {
                                settings.max = value.score;
                            }
                        });
                    }

                    canvasElem.width = settings.width * 2;
                    canvasElem.height = settings.height * 2;

                    canvasElem.style.width = settings.width+'px';
                    canvasElem.style.height = settings.height+'px';

                    ctx.scale(2,2);

                    if(settings.lineWidth) {
                        ctx.lineWidth = settings.lineWidth;
                    }

                    if(angular.isDefined(timelineData.id) && settings.colors && angular.isArray(settings.colors)) {
                        ctx.strokeStyle = settings.colors[timelineData.id];
                        ctx.fillStyle = settings.colors[timelineData.id];
                    }

                    ctx.beginPath();

                    createPath({
                        moveTo: {
                            x: 0,
                            y: settings.height - 2
                        },
                        lineTo: {
                            x: settings.distance,
                            y: settings.height - 2
                        }
                    }, true);

                    angular.forEach(timelineData.data, function(value, index) {

                        var height =  Math.abs((settings.height - settings.subPoint) - ((value.score - settings.min) / (settings.max - settings.min) * (settings.height - (settings.subPoint * 2)) ));
                        var currentDistance = (index + 2) * settings.distance;
                        var isLast = index === (timelineData.data.length - 1);

                        createPath({
                            moveTo: {
                                x: lastLine.lineTo.x,
                                y: lastLine.lineTo.y
                            },
                            lineTo: {
                                x: currentDistance,
                                y: height

                            },
                            exerciseType: value.exerciseType,
                            exerciseId: value.exerciseId,
                            score: value.score
                        }, false, isLast);

                        if(value.score > dataObj.biggestScore.score) {
                            dataObj.biggestScore = { score: value.score, lastLineTo: lastLine.lineTo };
                        }

                    });

                    if(settings.numbers && angular.isObject(settings.numbers)) {

                        setTimeout(function() {

                            ctx.font = settings.numbers.font;
                            ctx.fillStyle = settings.numbers.fillStyle;

                            ctx.fillText(settings.min, 15, settings.height - 10);
                            ctx.fillText(parseInt(dataObj.biggestScore.score), 15, dataObj.biggestScore.lastLineTo.y || settings.subPoint);

                        });

                    }

                    if(settings.onFinish && angular.isFunction(settings.onFinish)) {
                        settings.onFinish({data: dataObj, ctx : ctx, canvasElem : canvasElem});
                    }

                }

                function createPath(data, ignoreAfterPath, isLast) {

                    var arc = 10;
                    var img = 20;

                    if(angular.isDefined(settings.isMobile) && !settings.isMobile) {
                        arc = 15;
                        img = 25;
                    }

                    var subLocation = img / 2;
                    var imgBig;

                    lastLine = data;
                    dataObj.lastLine.push(lastLine);

                    /* create line */
                    ctx.moveTo(data.moveTo.x, data.moveTo.y);
                    ctx.lineTo(data.lineTo.x, data.lineTo.y);
                    ctx.stroke();

                    if(dataObj.summeryScore && !nextFlag) {
                        dataObj.summeryScore.next = data.lineTo;
                        nextFlag = true;
                    }

                    if(settings.isSummery) {
                        if(settings.isSummery === data.exerciseId) {
                            dataObj.summeryScore = { score: data.score, lineTo: data.lineTo,
                                prev: dataObj.lastLine[dataObj.lastLine.length - 2] };
                            arc = arc * 2;
                            img = img + 15;
                            subLocation = img / 2;
                            imgBig = true;
                        }
                    } else if(isLast) {
                        arc = arc * 2;
                        img = img + 15;
                        subLocation = img / 2;
                        imgBig = true;
                    }


                    if(!ignoreAfterPath) {
                        /* create circle */
                        ctx.beginPath();
                        ctx.arc(data.lineTo.x, data.lineTo.y, arc, 0, 2 * Math.PI, false);
                        ctx.fill();

                        if((isLast && !settings.isSummery) || (settings.isSummery === data.exerciseId)) {
                            ctx.beginPath();
                            ctx.arc(data.lineTo.x, data.lineTo.y, arc + 4, 0, 2 * Math.PI, false);
                            ctx.stroke();
                        }

                        /* create svg icons */
                        var imageObj = new Image();
                        var src;
                        var locationImgY = data.lineTo.y - subLocation;
                        var locationImgX = data.lineTo.x - subLocation;

                        if(dataObj.lastLine.length === 2 && data.exerciseType === 4) {
                            src = settings.images[data.exerciseType].icon;
                            img = (imgBig) ? img : 15;
                            if(angular.isDefined(settings.isMobile) && !settings.isMobile) {
                                img = (imgBig) ? img : 20;
                            }
                            locationImgY  = locationImgY + 2;
                            locationImgX  = locationImgX + 2;
                        } else if(dataObj.lastLine.length > 2 && data.exerciseType === 4) {
                            src = settings.images[2].icon;
                        } else {
                            src = settings.images[data.exerciseType].icon;
                        }

                        var svg = $templateCache.get(src);
                        var mySrc = 'data:image/svg+xml;base64,'+$window.btoa(svg);

                        imageObj.onload = function() {
                            ctx.drawImage(imageObj, locationImgX, locationImgY, img, img);
                        };

                        imageObj.src = mySrc;
                    }

                }

            }
        };

        return directive;
    }]);

})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkTimeline').service('TimelineSrv',['ExerciseTypeEnum', 'timelineImages', function(ExerciseTypeEnum, timelineImages) {

        this.getImages = function() {
            var imgObj = {};

            imgObj[ExerciseTypeEnum.TUTORIAL.enum] = {icon: timelineImages.tutorial};
            imgObj[ExerciseTypeEnum.PRACTICE.enum] = {icon: timelineImages.practice};
            imgObj[ExerciseTypeEnum.GAME.enum] = {icon: timelineImages.game};
            imgObj[ExerciseTypeEnum.SECTION.enum] = {icon: timelineImages.section};
            imgObj[ExerciseTypeEnum.DRILL.enum] = {icon: timelineImages.drill};

            return imgObj;
        };

    }]);
})(angular);


angular.module('znk.infra').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/general/templates/timerDrv.html",
    "<div ng-switch=\"type\" class=\"timer-drv\">\n" +
    "    <div ng-switch-when=\"1\" class=\"timer-type1\">\n" +
    "        <svg-icon class=\"icon-wrapper\" name=\"clock-icon\"></svg-icon>\n" +
    "        <div class=\"timer-view\"></div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"2\" class=\"timer-type2\">\n" +
    "        <div class=\"timer-display-wrapper\">\n" +
    "            <span class=\"timer-display\"></span>\n" +
    "        </div>\n" +
    "        <div round-progress\n" +
    "             current=\"ngModelCtrl.$viewValue\"\n" +
    "             max=\"config.max\"\n" +
    "             color=\"{{config.color}}\"\n" +
    "             bgcolor=\"{{config.bgcolor}}\"\n" +
    "             stroke=\"{{config.stroke}}\"\n" +
    "             radius=\"{{config.radius}}\"\n" +
    "             clockwise=\"config.clockwise\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
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
    "     ng-show=\"vm.maxQuestionIndex !== vm.currentQuestionIndex\"\n" +
    "     ng-class=\"{'question-answered': vm.isCurrentQuestionAnswered}\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"done-btn-wrap\">\n" +
    "    <button class=\"done-btn ng-hide\"\n" +
    "            ng-show=\"vm.showDoneButton\"\n" +
    "            ng-click=\"onDone()\">DONE\n" +
    "    </button>\n" +
    "</div>\n" +
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
  $templateCache.put("components/general/svg/clock-icon.svg",
    "<svg version=\"1.1\" class=\"clock-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 183 208.5\">\n" +
    "    <style>\n" +
    "        .clock-icon-svg .st0 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 10.5417;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st1 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 12.3467;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st2 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 11.8313;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st3 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 22.9416;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st4 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 14;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st5 {\n" +
    "            fill: none;\n" +
    "            stroke: #757A83;\n" +
    "            stroke-width: 18;\n" +
    "            stroke-linejoin: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "\n" +
    "    </style>\n" +
    "    <g>\n" +
    "        <circle class=\"st0\" cx=\"91.5\" cy=\"117\" r=\"86.2\"/>\n" +
    "        <line class=\"st1\" x1=\"92.1\" y1=\"121.5\" x2=\"92.1\" y2=\"61\"/>\n" +
    "        <line class=\"st2\" x1=\"92.1\" y1=\"121.5\" x2=\"131.4\" y2=\"121.5\"/>\n" +
    "        <line class=\"st3\" x1=\"78.2\" y1=\"18.2\" x2=\"104.9\" y2=\"18.2\"/>\n" +
    "        <line class=\"st4\" x1=\"61.4\" y1=\"7\" x2=\"121.7\" y2=\"7\"/>\n" +
    "        <line class=\"st5\" x1=\"156.1\" y1=\"43\" x2=\"171.3\" y2=\"61\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
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
  $templateCache.put("components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\">\n" +
    "	 <style type=\"text/css\">\n" +
    "     	.st0{fill:#fff;}\n" +
    "     </style>\n" +
    "<g id=\"kUxrE9.tif\">\n" +
    "	<g>\n" +
    "		<path class=\"st0\" id=\"XMLID_93_\" d=\"M-140.1,287c0.6-1.1,1.7-1.7,2.9-1.4c1.3,0.3,2,1.1,2.3,2.3c1.1,4,2.1,8,3.2,12c2.4,9.3,4.9,18.5,7.3,27.8\n" +
    "			c0.1,0.3,0.2,0.6,0.2,0.9c0.3,1.7-0.6,3-2.1,3.3c-1.4,0.3-2.8-0.5-3.3-2.1c-1-3.6-2-7.3-2.9-10.9c-2.5-9.5-5-19-7.6-28.6\n" +
    "			C-140.1,290-140.8,288.3-140.1,287z\"/>\n" +
    "		<path class=\"st0\" id=\"XMLID_92_\" d=\"M-89.6,289.1c-1,6.8-2.9,13-10,16c-3.2,1.4-6.5,1.6-9.9,0.9c-2-0.4-4-0.7-6-0.6c-4.2,0.3-7.1,2.7-9,6.4\n" +
    "			c-0.3,0.5-0.5,1.1-0.9,2c-0.3-1-0.5-1.7-0.8-2.5c-2-7-3.9-14.1-5.9-21.2c-0.3-1-0.1-1.7,0.5-2.4c4.5-6,11-7.4,17.5-3.6\n" +
    "			c3.4,2,6.7,4.2,10.2,6.1c1.9,1,3.9,1.9,5.9,2.4c3.2,0.9,5.9,0,7.9-2.6C-90,289.7-89.8,289.4-89.6,289.1z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-drills-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "    .all > * { fill: #fff; }\n" +
    "	.st0{clip-path:url(#SVGID_2_);}\n" +
    "	.st1{clip-path:url(#SVGID_4_);}\n" +
    "</style>\n" +
    "<g id=\"XMLID_93_\" class=\"all\">\n" +
    "	<path id=\"XMLID_105_\" d=\"M-105.3,308.4h-18.6c-0.6,0-1-0.4-1-1c0-0.6,0.4-1,1-1h18.6c0.6,0,1,0.4,1,1S-104.8,308.4-105.3,308.4z\"/>\n" +
    "	<g id=\"XMLID_100_\">\n" +
    "		<path id=\"XMLID_104_\" d=\"M-128.2,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2v17.8\n" +
    "			C-126.2,317-127.1,317.9-128.2,317.9z\"/>\n" +
    "		<path id=\"XMLID_103_\" d=\"M-132.7,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-131.5,313.1-132,313.7-132.7,313.7z\"/>\n" +
    "		<g id=\"XMLID_101_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_1_\" x=\"-140\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_2_\">\n" +
    "							<use xlink:href=\"#SVGID_1_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_99_\" class=\"st0\" d=\"M-134,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-132.6,308.3-133.2,308.9-134,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_94_\">\n" +
    "		<path id=\"XMLID_98_\" d=\"M-101.3,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2s2,0.9,2,2v17.8C-99.3,317-100.2,317.9-101.3,317.9z\n" +
    "			\"/>\n" +
    "		<path id=\"XMLID_97_\" d=\"M-96.8,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-95.5,313.1-96.1,313.7-96.8,313.7z\"/>\n" +
    "		<g id=\"XMLID_95_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_3_\" x=\"-94.3\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_4_\">\n" +
    "							<use xlink:href=\"#SVGID_3_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_107_\" class=\"st1\" d=\"M-94,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-92.7,308.3-93.3,308.9-94,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-105 277 60 60\" style=\"enable-background:new -105 277 60 60;\" xml:space=\"preserve\">\n" +
    "	 	 <style type=\"text/css\">\n" +
    "          	.st0{fill:#fff;}\n" +
    "          </style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-75,332c-11.5,0-21-9.4-21-21c0-11.5,9.4-21,21-21s21,9.4,21,21S-63.5,332-75,332z M-75,292.7c-10.1,0-18.4,8.2-18.4,18.4\n" +
    "		s8.2,18.4,18.4,18.4s18.4-8.2,18.4-18.4S-64.9,292.7-75,292.7z\"/>\n" +
    "	<circle class=\"st0\" cx=\"-74.8\" cy=\"312\" r=\"2.3\"/>\n" +
    "	<path class=\"st0\" d=\"M-74.1,308.1h-1c-0.2,0-0.4-0.1-0.4-0.2v-10.6c0-0.1,0.2-0.2,0.4-0.2h1c0.2,0,0.4,0.1,0.4,0.2v10.6\n" +
    "		C-73.7,307.9-73.9,308.1-74.1,308.1z\"/>\n" +
    "	<path class=\"st0\" d=\"M-71,310.8l-0.6-1c-0.1-0.2-0.1-0.4,0-0.5l4.4-2.6c0.1-0.1,0.4,0,0.5,0.2l0.6,1c0.1,0.2,0.1,0.4,0,0.5l-4.4,2.6\n" +
    "		C-70.6,311.1-70.8,311-71,310.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-76.9,285.8v1.8c0,1.2,0.9,2.1,2.1,2.1c1.2,0,2.1-0.9,2.1-2.1v-1.8H-76.9z\"/>\n" +
    "	<path class=\"st0\" d=\"M-68.5,283.2c0,0.7-0.5,1.2-1.2,1.2h-9.7c-0.7,0-1.2-0.5-1.2-1.2l0,0c0-0.7,0.5-1.2,1.2-1.2h9.7\n" +
    "		C-69,282-68.5,282.5-68.5,283.2L-68.5,283.2z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-test-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-111 277 60 60\" style=\"enable-background:new -111 277 60 60;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-62.9,332h-36.2c-1.5,0-2.8-1.2-2.8-2.8v-44.5c0-1.5,1.2-2.8,2.8-2.8h36.2c1.5,0,2.8,1.2,2.8,2.8v44.5\n" +
    "		C-60.1,330.8-61.4,332-62.9,332z M-99.1,283.6c-0.6,0-1.2,0.5-1.2,1.2v44.5c0,0.6,0.5,1.2,1.2,1.2h36.2c0.6,0,1.2-0.5,1.2-1.2\n" +
    "		v-44.5c0-0.6-0.5-1.2-1.2-1.2H-99.1L-99.1,283.6z\"/>\n" +
    "	<g id=\"XMLID_312_\">\n" +
    "		<circle id=\"XMLID_199_\" class=\"st0\" cx=\"-95\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_198_\" class=\"st0\" cx=\"-92.5\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_197_\" class=\"st0\" cx=\"-89.9\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_196_\" class=\"st0\" cx=\"-95\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_195_\" class=\"st0\" cx=\"-92.5\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_194_\" class=\"st0\" cx=\"-90\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_193_\" class=\"st0\" cx=\"-95\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_192_\" class=\"st0\" cx=\"-92.5\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_191_\" class=\"st0\" cx=\"-89.9\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_302_\">\n" +
    "		<circle id=\"XMLID_190_\" class=\"st0\" cx=\"-83.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_189_\" class=\"st0\" cx=\"-81.1\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_188_\" class=\"st0\" cx=\"-78.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_187_\" class=\"st0\" cx=\"-83.7\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_186_\" class=\"st0\" cx=\"-81.1\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_185_\" class=\"st0\" cx=\"-78.6\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_184_\" class=\"st0\" cx=\"-83.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_183_\" class=\"st0\" cx=\"-81.1\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_182_\" class=\"st0\" cx=\"-78.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_292_\">\n" +
    "		<circle id=\"XMLID_181_\" class=\"st0\" cx=\"-72.3\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_180_\" class=\"st0\" cx=\"-69.8\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_179_\" class=\"st0\" cx=\"-67.2\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_178_\" class=\"st0\" cx=\"-72.3\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_177_\" class=\"st0\" cx=\"-69.8\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_176_\" class=\"st0\" cx=\"-67.2\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_175_\" class=\"st0\" cx=\"-72.3\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_174_\" class=\"st0\" cx=\"-69.8\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_173_\" class=\"st0\" cx=\"-67.2\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_282_\">\n" +
    "		<circle id=\"XMLID_172_\" class=\"st0\" cx=\"-94.9\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_171_\" class=\"st0\" cx=\"-92.3\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_170_\" class=\"st0\" cx=\"-89.8\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_169_\" class=\"st0\" cx=\"-94.9\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_168_\" class=\"st0\" cx=\"-92.4\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_167_\" class=\"st0\" cx=\"-89.8\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_166_\" class=\"st0\" cx=\"-94.9\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_165_\" class=\"st0\" cx=\"-92.3\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_164_\" class=\"st0\" cx=\"-89.8\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_272_\">\n" +
    "		<circle id=\"XMLID_163_\" class=\"st0\" cx=\"-83.5\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_162_\" class=\"st0\" cx=\"-81\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_161_\" class=\"st0\" cx=\"-78.4\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_160_\" class=\"st0\" cx=\"-83.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_159_\" class=\"st0\" cx=\"-81\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_158_\" class=\"st0\" cx=\"-78.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_157_\" class=\"st0\" cx=\"-83.5\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_156_\" class=\"st0\" cx=\"-81\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_155_\" class=\"st0\" cx=\"-78.4\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_262_\">\n" +
    "		<circle id=\"XMLID_154_\" class=\"st0\" cx=\"-72.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_153_\" class=\"st0\" cx=\"-69.6\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_152_\" class=\"st0\" cx=\"-67.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_151_\" class=\"st0\" cx=\"-72.2\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_150_\" class=\"st0\" cx=\"-69.6\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_149_\" class=\"st0\" cx=\"-67.1\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_148_\" class=\"st0\" cx=\"-72.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_147_\" class=\"st0\" cx=\"-69.6\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_146_\" class=\"st0\" cx=\"-67.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_252_\">\n" +
    "		<circle id=\"XMLID_145_\" class=\"st0\" cx=\"-94.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_144_\" class=\"st0\" cx=\"-92.2\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_143_\" class=\"st0\" cx=\"-89.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_142_\" class=\"st0\" cx=\"-94.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_141_\" class=\"st0\" cx=\"-92.3\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_140_\" class=\"st0\" cx=\"-89.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_139_\" class=\"st0\" cx=\"-94.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_138_\" class=\"st0\" cx=\"-92.2\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_137_\" class=\"st0\" cx=\"-89.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_242_\">\n" +
    "		<circle id=\"XMLID_136_\" class=\"st0\" cx=\"-83.4\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_135_\" class=\"st0\" cx=\"-80.9\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_134_\" class=\"st0\" cx=\"-78.3\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_133_\" class=\"st0\" cx=\"-83.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_132_\" class=\"st0\" cx=\"-80.9\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_131_\" class=\"st0\" cx=\"-78.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_130_\" class=\"st0\" cx=\"-83.4\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_129_\" class=\"st0\" cx=\"-80.9\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_128_\" class=\"st0\" cx=\"-78.3\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_232_\">\n" +
    "		<circle id=\"XMLID_127_\" class=\"st0\" cx=\"-72\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_126_\" class=\"st0\" cx=\"-69.5\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_125_\" class=\"st0\" cx=\"-67\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_124_\" class=\"st0\" cx=\"-72\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_123_\" class=\"st0\" cx=\"-69.6\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_122_\" class=\"st0\" cx=\"-67\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_121_\" class=\"st0\" cx=\"-72\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_120_\" class=\"st0\" cx=\"-69.5\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_119_\" class=\"st0\" cx=\"-67\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_222_\">\n" +
    "		<circle id=\"XMLID_118_\" class=\"st0\" cx=\"-94.5\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_117_\" class=\"st0\" cx=\"-91.9\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_116_\" class=\"st0\" cx=\"-89.4\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_115_\" class=\"st0\" cx=\"-94.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_114_\" class=\"st0\" cx=\"-92\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_113_\" class=\"st0\" cx=\"-89.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_112_\" class=\"st0\" cx=\"-94.5\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_111_\" class=\"st0\" cx=\"-91.9\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_110_\" class=\"st0\" cx=\"-89.4\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_212_\">\n" +
    "		<circle id=\"XMLID_109_\" class=\"st0\" cx=\"-83.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_108_\" class=\"st0\" cx=\"-80.6\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_107_\" class=\"st0\" cx=\"-78.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_106_\" class=\"st0\" cx=\"-83.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_105_\" class=\"st0\" cx=\"-80.6\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_104_\" class=\"st0\" cx=\"-78.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_103_\" class=\"st0\" cx=\"-83.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_102_\" class=\"st0\" cx=\"-80.6\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_101_\" class=\"st0\" cx=\"-78.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_202_\">\n" +
    "		<circle id=\"XMLID_100_\" class=\"st0\" cx=\"-71.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_99_\" class=\"st0\" cx=\"-69.2\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_98_\" class=\"st0\" cx=\"-66.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_97_\" class=\"st0\" cx=\"-71.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_96_\" class=\"st0\" cx=\"-69.3\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_95_\" class=\"st0\" cx=\"-66.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_94_\" class=\"st0\" cx=\"-71.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_93_\" class=\"st0\" cx=\"-69.2\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_92_\" class=\"st0\" cx=\"-66.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g id=\"XMLID_203_\">\n" +
    "	<path id=\"XMLID_209_\" class=\"st0\" d=\"M-115.2,285.5\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_207_\" d=\"M-123.6,319c-0.1,0-0.2,0-0.4,0c-0.8-0.2-1.3-1-1.1-1.8c0,0,0.9-4.1-1.7-7.4c-2.2-2.8-4.7-6.6-4.7-11.4\n" +
    "		c0-9,7.3-16.4,16.4-16.4s16.4,7.3,16.4,16.4c0,4.8-2.5,8.6-4.7,11.4c-2.6,3.3-1.7,7.4-1.7,7.4c0.2,0.8-0.3,1.6-1.1,1.8\n" +
    "		c-0.8,0.2-1.6-0.3-1.8-1.1c0-0.2-1.2-5.5,2.2-9.9c2-2.6,4-5.7,4-9.6c0-7.4-6-13.4-13.4-13.4c-7.4,0-13.4,6-13.4,13.4\n" +
    "		c0,3.9,2,7,4,9.6c3.5,4.5,2.3,9.7,2.2,9.9C-122.3,318.6-122.9,319-123.6,319z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_206_\" d=\"M-107.5,322.4h-15.1c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h15.1c0.5,0,1,0.5,1,1\n" +
    "		C-106.5,322-106.9,322.4-107.5,322.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_205_\" d=\"M-107,325.4H-123c-0.5,0-1-0.5-1-1s0.5-1,1-1h16.1c0.5,0,1,0.5,1,1C-106,325-106.4,325.4-107,325.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_210_\" d=\"M-109,328.5h-12.5c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h12.5c0.5,0,1,0.5,1,1C-108,328-108.4,328.5-109,328.5\n" +
    "		z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_204_\" d=\"M-111.1,329.7c-0.3,1.6-1.8,2.3-4.1,2.3s-3.6-0.8-4.1-2.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
