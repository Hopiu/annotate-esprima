/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** This file is only used to be tested against annotate */
define(function (require, exports, module) {

    'use strict';

    var num1 = 1;
    var greetings = "Hello world";
    var GREETINGS = "Hello world";
    var _GREETINGS = "Hello world";
    
    var variable1, variable2, _variable3, VARIABLE4;
    
    /*
    * educated guess, but no js doc
    */
    function declaration(input) {            
        
        var content = "stuff";
    }

    //* fake jsdoc *
    var expression = function(p1, p2) {
        
        var content = "stuff";
        
    };
    
    /** inline jsDoc */
    function noParams() {
                
        return null;
        
    }


    var _privateStuff = function(p1, p2) {
        var content = "I start with an underscore";
        return content;
    };
    
    
    var myObject = {};
    
    myObject.myFunction = function (param1, param2, param3) {
        
    };
    

    myObject.prototype.myFunction = function (param1, param2) {
    
    };
    
    
    var a = {
        doA: function(param1, param2){
            var content = "stuff";
            
            return content;
        },
        doB: function(param1, param2){
            var content = "stuff";
            
            return content;
        }
    };
    
});