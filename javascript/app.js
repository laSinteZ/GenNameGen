/**
 * Created by Vyacheslav on 27-Sep-16.
 */
var genetic = Genetic.create();

//More fitness = better
genetic.optimize = Genetic.Optimize.Maximize;

genetic.select1 = Genetic.Select1.RandomLinearRank;
genetic.select2 = Genetic.Select2.FittestRandom;


genetic.seed = function () {

    function randomString(len) {
        var text = "";
        var charset = "aeiourkgsctzndpmbh";
        for (var i = 0; i < len; i++)
            text += charset.charAt(Math.floor(Math.random() * charset.length));

        return text;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // create random strings that are equal in length to solution
    return randomString(getRandomInt(3, 8));
};

genetic.mutate = function (entity) {

    function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
    }

    // chromosomal drift
    var i = Math.floor(Math.random() * entity.length);
    return replaceAt(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)));
};


genetic.crossover = function (mother, father) {

    // two-point crossover
    var len = mother.length;
    var ca = Math.floor(Math.random() * len);
    var cb = Math.floor(Math.random() * len);
    if (ca > cb) {
        var tmp = cb;
        cb = ca;
        ca = tmp;
    }

    var son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
    var daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);

    return [son, daughter];
};

//Fitness function. Basically, we add bonuses for good solutions and penalize bad ones
genetic.fitness = function (entity) {

    console.log(this.userData["goodEndingBonus"]);
    var goodEndingBonus = this.userData["goodEndingBonus"] || 300;
    var duplicatePenalty = this.userData["duplicatePenalty"] || 15;
    var goodComboBonus = this.userData["goodComboBonus"] || 30;
    var letterBonus = this.userData["letterBonus"] || 5;
    var badLetterPenalty = this.userData["badLetterPenalty"] || 30;
    var badComboPenalty = this.userData["badComboPenalty"] || 30;


    var goodComboAmount = 0;

    var fitness = 100 + letterBonus * entity.length;
    var goodEndings = ['ro', 'ta', 'ichi', 'kazu', 'ko', 'mi', 'ka', 'na'];
    var goodCombos = ['sh', 'ch', 'ts', 'ya', 'yu', 'yo', 'ai'];
    var badCombos = ['ca', 'cu', 'co', 'ce', 'ci', 'pu'];
    var badLetters = ['l', 'f', 'j', 'v'];

    function goodEndingBonuser(entity) {
        for (var i = 0; i < goodEndings.length; i++) {
            if (entity.endsWith(goodEndings[i])) fitness = fitness + goodEndingBonus;
        }
    }

    //Vowels: aeiou
    function isVowel(char) {
        return (char === 'a' || char === 'e' || char === 'i' || char === 'o' || char === 'u');
    }

    //Function, which decreases fitness of entities with double vowel or consonant
    function duplicatesSlayer(a, b) {
        if (isVowel(a) == isVowel(b)) fitness = fitness - duplicatePenalty;
    };

    function badLetterSlayer(entity) {
        for (var j = 0; j < entity.length; j++) {
            for (var i = 0; i < badLetters.length; i++) {
                if (entity[j] == badLetters[i])
                    fitness = fitness - badLetterPenalty;
            }
        }
    };

    function goodComboBonuser(a, b) {
        for (var i = 0; i < goodCombos.length; i++) {
            if (((a + '' + b) == goodCombos[i]) && (goodComboAmount < 2))
                fitness = fitness + goodComboBonus;
            goodComboAmount++;
        }
    };

    function badComboSlayer(a, b) {
        for (var i = 0; i < badCombos.length; i++) {
            if ((a + '' + b) == badCombos[i])
                fitness = fitness - badComboPenalty;
            goodComboAmount++;
        }
    };

    function bonuserAndPunisher(entity) {
        for (var i = 1; i < entity.length; i++) {
            duplicatesSlayer(entity[i - 1], entity[i]);
            goodComboBonuser(entity[i - 1], entity[i]);
            badComboSlayer(entity[i - 1], entity[i]);
        }
    }

    goodEndingBonuser(entity);
    bonuserAndPunisher(entity);
    badLetterSlayer(entity);

    return fitness;
};

genetic.generation = function (pop, generation, stats) {
    // stop running once we've reached the solution
    return this.fitness(pop[0].entity) < this.userData["requiredFitness"];
};



genetic.notification = function(pop, generation, stats, isFinished) {


    var value = pop[0].entity;
    this.last = this.last||value;

    //Skip similar results
    if (pop != 0 && value == this.last)
        return;



    var buf = "";
    buf += "<tr>";
    buf += "<td>" + generation + "</td>";
    buf += "<td>" + pop[0].fitness.toPrecision(5) + "</td>";
    buf += "<td>" + pop[0].entity + "</td>";
    buf += "</tr>";
    $("#results tbody").prepend(buf);

    this.last = value;
};


$(document).ready(function () {
    $("#solve").click(function () {

        $("#results tbody").html("");

        var config = {
            "iterations": 2000
            , "size": 250
            , "crossover": $("#crossRate").val()-0
            , "mutation": $("#mutRate").val()-0
            , "skip": 20
        };

        var userData = {
            "requiredFitness": $("#requiredFitness").val()-0,

            "goodEndingBonus": $("#goodEndingBonus").val()-0,
            "goodComboBonus": $("#goodComboBonus").val()-0,
            "duplicatePenalty": $("#duplicatePenalty").val()-0,
            "letterBonus": $("#letterBonus").val()-0,
            "badLetterPenalty": $("#badLetterPenalty").val()-0,
            "badComboPenalty": $("#badComboPenalty").val()-0

        };

        genetic.evolve(config, userData);
    });
});