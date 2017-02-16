(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters', [
        'znk.infra.config',
        'categories.mock',
        'znk.infra.content',
        'znk.infra.exerciseUtility',
        'znk.infra.enum'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters').factory('BaseExerciseGetterSrv',
        ["ContentSrv", "$log", "$q", "ExerciseTypeEnum", function (ContentSrv, $log, $q, ExerciseTypeEnum) {
            'ngInject';

            function BaseExerciseGetterSrv(exerciseTypeName) {
                this.typeName = exerciseTypeName;
            }

            BaseExerciseGetterSrv.getExerciseByNameAndId = function (exerciseTypeName, exerciseId) {
                var context = {
                    typeName: exerciseTypeName
                };
                return BaseExerciseGetterSrvPrototype.get.call(context, exerciseId);
            };

            BaseExerciseGetterSrv.getExerciseByTypeAndId = function (exerciseTypeId, exerciseId) {
                var exerciseTypeName = ExerciseTypeEnum.getValByEnum(exerciseTypeId).toLowerCase();
                return BaseExerciseGetterSrv.getExerciseByNameAndId(exerciseTypeName, exerciseId);
            };

            var BaseExerciseGetterSrvPrototype = {};

            BaseExerciseGetterSrvPrototype.get = function (exerciseId) {
                var contentData = {
                    exerciseId: exerciseId,
                    exerciseType: this.typeName
                };

                return ContentSrv.getContent(contentData).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrvPrototype.getAll = function () {
                var self = this;
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(self.typeName).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({
                            exerciseType: keyValue
                        }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrv.prototype = BaseExerciseGetterSrvPrototype;

            return BaseExerciseGetterSrv;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    var mockCategoriesServiceName = 'categories';

    angular.module('categories.mock', [])
        .constant(mockCategoriesServiceName, [{
    "id": 9,
    "name": "Math Level 1",
    "shortName": "M1",
    "parentId": null,
    "typeId": 9,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 10,
    "name": "Math Level 2",
    "shortName": "M2",
    "parentId": null,
    "typeId": 9,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 11,
    "name": "Algebra and Functions",
    "shortName": "AF1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 12,
    "name": "Advanced Topics",
    "shortName": "AT1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 13,
    "name": "Data Analysis and Statistics",
    "shortName": "DS1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 14,
    "name": "Geometry and Measurement",
    "shortName": "GM1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 15,
    "name": "Numbers and Operations",
    "shortName": "NO1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 16,
    "name": "Trigonometry",
    "shortName": "TR1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 17,
    "name": "Algebra and Functions",
    "shortName": "AF2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 18,
    "name": "Advanced Topics",
    "shortName": "AT2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 19,
    "name": "Data Analysis and Statistics",
    "shortName": "DS2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 20,
    "name": "Geometry and Measurement",
    "shortName": "GM2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 21,
    "name": "Numbers and Operations",
    "shortName": "NO2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 22,
    "name": "Trigonometry",
    "shortName": "TR2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 23,
    "name": "Exponential Growth and Decay",
    "shortName": "EXGD1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 24,
    "name": "Function Composition",
    "shortName": "FCMP1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 25,
    "name": "Function Domain, Range, and Asymptotes",
    "shortName": "FDAR1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 26,
    "name": "Function Evaluation and Symbol Functions",
    "shortName": "FEVA1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 27,
    "name": "Function Inverses",
    "shortName": "FINV1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 28,
    "name": "Linear Functions",
    "shortName": "FLIN1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 29,
    "name": "Polynomial Functions",
    "shortName": "FPLY1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 30,
    "name": "Qualitative Features of Functions",
    "shortName": "FQLT1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 31,
    "name": "Inequalities and Absolute Value Inequalities",
    "shortName": "INEQ1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 32,
    "name": "Quadratic Functions and Factoring",
    "shortName": "QUAD1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 33,
    "name": "Slopes, Parallel, and Perpendicular",
    "shortName": "SLPS1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 34,
    "name": "Solving Equations",
    "shortName": "SOLV1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 35,
    "name": "Systems of Equations",
    "shortName": "SYSE1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 36,
    "name": "Transformation of Functions and Graphs",
    "shortName": "TRNS1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 37,
    "name": "Complex Numbers",
    "shortName": "CPLX1",
    "parentId": 12,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 38,
    "name": "Logarithms",
    "shortName": "LOGS1",
    "parentId": 12,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 39,
    "name": "Data Analysis",
    "shortName": "DATA1",
    "parentId": 13,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 40,
    "name": "Angles in the Plane and in Polygons",
    "shortName": "ANGL1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 41,
    "name": "Coordinate Geometry with Circles",
    "shortName": "CCIR1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 42,
    "name": "Circles",
    "shortName": "CIRC1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 43,
    "name": "Coordinate Geometry",
    "shortName": "COOR1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 44,
    "name": "Quadrilaterals",
    "shortName": "QDLT1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 45,
    "name": "Similar Triangles",
    "shortName": "SIMT1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 46,
    "name": "Solid Geometry",
    "shortName": "SLID1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 47,
    "name": "Triangles",
    "shortName": "TRIS1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 48,
    "name": "Average",
    "shortName": "AVGS1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 49,
    "name": "Counting",
    "shortName": "CNTG1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 50,
    "name": "English to Math",
    "shortName": "ETOM1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 51,
    "name": "Expression Manipulation",
    "shortName": "EXPM1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 52,
    "name": "Exponents",
    "shortName": "EXPO1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 53,
    "name": "Integer and Number Properties",
    "shortName": "INTP1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 54,
    "name": "Logical Reasoning",
    "shortName": "LOGR1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 55,
    "name": "Percents, Fractions and Probabillity",
    "shortName": "PERC1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 56,
    "name": "Ratio and Proportions",
    "shortName": "RATE1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 57,
    "name": "Sequences and Series",
    "shortName": "SEQS1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 58,
    "name": "Right Triangle Trigonometry and Equivalent Expressions",
    "shortName": "TRIG1",
    "parentId": 16,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 59,
    "name": "Exponential Growth and Decay",
    "shortName": "EXGD2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 60,
    "name": "Function Composition",
    "shortName": "FCMP2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 61,
    "name": "Function Domain, Range and Asymptotes",
    "shortName": "FDAR2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 62,
    "name": "Function Evaluation and Symbol Functions",
    "shortName": "FEVA2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 63,
    "name": "Function Inverses",
    "shortName": "FINV2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 64,
    "name": "Linear Functions",
    "shortName": "FLIN2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 65,
    "name": "Polynomial Functions",
    "shortName": "FPLY2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 66,
    "name": "Qualitative Features of Functions",
    "shortName": "FQLT2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 67,
    "name": "Inequalities and Absolute Value Inequalities",
    "shortName": "INEQ2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 68,
    "name": "Quadratic Functions and Factoring",
    "shortName": "QUAD2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 69,
    "name": "Slopes, Parallel, and Perpendicular",
    "shortName": "SLPS2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 70,
    "name": "Solving Equations",
    "shortName": "SOLV2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 71,
    "name": "Systems of Equations",
    "shortName": "SYSE2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 72,
    "name": "Transformation of Functions and Graphs",
    "shortName": "TRNS2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 73,
    "name": "Complex Numbers",
    "shortName": "CPLX2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 74,
    "name": "Logarithms",
    "shortName": "LOGS2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 75,
    "name": "Matrices",
    "shortName": "MTRX2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 76,
    "name": "Vectors",
    "shortName": "VECT2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": null
}, {
    "id": 77,
    "name": "Parametric Equations",
    "shortName": "PARM2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 78,
    "name": "Statistics and Standard Deviation",
    "shortName": "STAT2",
    "parentId": 19,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 79,
    "name": "Angles in the Plane and in Polygons",
    "shortName": "ANGL2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 80,
    "name": "Circles",
    "shortName": "CIRC2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 81,
    "name": "Conics",
    "shortName": "CNCS2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 82,
    "name": "Coordinate Geometry",
    "shortName": "COOR2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 83,
    "name": "Quadrilaterals",
    "shortName": "QDLT2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": null
}, {
    "id": 84,
    "name": "Solid Geometry",
    "shortName": "SLID2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": null
}, {
    "id": 85,
    "name": "Triangles",
    "shortName": "TRIS2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": null
}, {
    "id": 86,
    "name": "Averages",
    "shortName": "AVGS2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 87,
    "name": "Counting",
    "shortName": "CNTG2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 88,
    "name": "English to Math",
    "shortName": "ETOM2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 89,
    "name": "Expression Manipulation",
    "shortName": "EXPM2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 90,
    "name": "Exponents",
    "shortName": "EXPO2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 91,
    "name": "Integer and Number Properties",
    "shortName": "INTP2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 92,
    "name": "Logical Reasoning",
    "shortName": "LOGR2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 93,
    "name": "Percents, Fractions, and Probabillity",
    "shortName": "PERC2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 94,
    "name": "Ratio and Proportions",
    "shortName": "RATE2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 95,
    "name": "Sequences and Series",
    "shortName": "SEQS2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 96,
    "name": "Trigonometry - Graphing",
    "shortName": "TRGG2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 97,
    "name": "Trigonometry - Right Triangle and Equivalent Expressions",
    "shortName": "TRIG2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 98,
    "name": "Trigonometry - Unit Circle",
    "shortName": "TRUC2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 99,
    "name": "General Test Information",
    "shortName": "TESTG1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 100,
    "name": "General Test Information",
    "shortName": "TESTG2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 101,
    "name": "General Test Information",
    "shortName": "TESTS1",
    "parentId": 99,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": 3
}, {
    "id": 102,
    "name": "General Test Information",
    "shortName": "TESTS2",
    "parentId": 100,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": 3
}]);
})(angular);

'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService',
    ["StorageRevSrv", "$q", "categoryEnum", "$log", "categoriesConstant", function (StorageRevSrv, $q, categoryEnum, $log, categoriesConstant) {
        'ngInject';

        var categoryMapObj;
        var self = this;

        var categoryEnumMap = categoryEnum.getEnumMap();

        self.get = function () {
            return StorageRevSrv.getContent({
                exerciseType: 'category'
            });
        };

        function mapCategories(categories) {
            var categoryMap = {};
            angular.forEach(categories, function (category) {
                categoryMap[category.id] = category;
            });
            categoryMapObj = categoryMap;
            return categoryMapObj;
        }

        self.getCategoryMap = function (sync) {
            var _categoryMapObj;

            if (categoryMapObj) {
                _categoryMapObj = categoryMapObj;
            } else {
                _categoryMapObj = mapCategories(categoriesConstant);
            }

            if (sync) {
                return _categoryMapObj;
            } else {
                return $q.when(_categoryMapObj);
            }
        };

        self.getCategoryDataSync = function (categoryId) {
            var categoryMap = self.getCategoryMap(true);
            return categoryMap[categoryId];
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.categoryName = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.getStatsKeyByCategoryId = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            return categoryEnumMap[category.typeId];
        };

        self.getParentCategorySync = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var parentId;
            if (categoriesMap[categoryId]) {
                parentId = categoriesMap[categoryId].parentId;
            } else {
                $log.error('category id was not found in the categories');
                return null;
            }
            return categoriesMap[parentId];
        };

        self.getParentCategory = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var parentId;
                if (categories[categoryId]) {
                    parentId = categories[categoryId].parentId;
                } else {
                    $log.error('category id was not found in the categories');
                    return null;
                }
                return categories[parentId];
            });
        };

        self.getCategoryLevel1ParentByIdSync = function (categoryId) {
            if (angular.isUndefined(categoryId) || categoryId === null) {
                $log.debug('CategoryService: No category id', categoryId);
                return;
            }
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.SUBJECT.enum === category.typeId) {
                return categoryId;
            }
            return self.getCategoryLevel1ParentByIdSync(category.parentId);
        };

        self.getCategoryLevel1ParentById = function (categoryId) {
            if (angular.isUndefined(categoryId) || categoryId === null) {
                return $q.when(null);
            }
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.SUBJECT.enum === category.typeId) {
                    return $q.when(categoryId);
                }
                return self.getCategoryLevel1ParentById(category.parentId);
            });
        };

        self.getCategoryLevel2ParentSync = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.LEVEL2.enum === category.typeId) {
                return category;
            }
            return self.getCategoryLevel2ParentSync(categoryId);
        };

        self.getCategoryLevel2Parent = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.TEST_SCORE.enum === category.typeId) {
                    return category;
                }
                return self.getCategoryLevel2Parent(category.parentId);
            });
        };

        self.getAllLevelCategoriesSync = function (level) {
            var categoriesMap = self.getCategoryMap(true);
            var levelCategories = {};
            angular.forEach(categoriesMap, function (category) {
                var numLevel = 1;
                var categoryDup = angular.copy(category);
                while (categoryDup.parentId !== null) {
                    categoryDup = categoriesMap[categoryDup.parentId];
                    numLevel++;
                }
                if (numLevel === level) {
                    levelCategories[category.id] = category;
                }
            });
            return levelCategories;
        };

        self.getAllLevelCategories = function (level) {
            return self.getCategoryMap().then(function (categories) {
                var levelCategories = {};
                angular.forEach(categories, function (category) {
                    var numLevel = 1;
                    var catgoryDup = angular.copy(category);
                    while (catgoryDup.parentId !== null) {
                        catgoryDup = categories[catgoryDup.parentId];
                        numLevel++;
                    }
                    if (numLevel === level) {
                        levelCategories[category.id] = category;
                    }
                });
                return levelCategories;
            });
        };

        self.getAllLevel4CategoriesSync = function () {
            var categoriesMap = self.getCategoryMap(true);
            var specificCategories = {};
            angular.forEach(categoriesMap, function (category) {
                if (category.typeId === categoryEnum.LEVEL4.enum) {
                    specificCategories[category.id] = category;
                }
            });
            return specificCategories;
        };

        self.getAllLevel4Categories = (function () {
            var getAllLevel4CategoriessProm;
            return function () {
                if (!getAllLevel4CategoriessProm) {
                    getAllLevel4CategoriessProm = self.getCategoryMap().then(function (categories) {
                        var specificCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.SPECIFIC.enum) {
                                specificCategories[category.id] = category;
                            }
                        });
                        return specificCategories;
                    });
                }
                return getAllLevel4CategoriessProm;
            };
        })();
    }]);

angular.module('znk.infra.contentGetters').run(['$templateCache', function($templateCache) {

}]);
