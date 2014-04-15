/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, require, document*/

require.config({
    paths: {
        underscore: 'lib/underscore-min',
    },
    shim: {
        "underscore": {
            exports: "_"
        }
    }
});

require(["lib/esprima-master/esprima", "lib/estraverse-master/estraverse", "annotate", "text!testDummy.js", "underscore"], function (esprima, estraverse, annotate, testDummy, _) {
    // get the ast
    var ast = esprima.parse(testDummy, {
        tolerant: true,
        attachComment: true,
        loc: true,
        range: true
    });
    
    var outputLength = 0;
    var output = testDummy;
    
    // set some imaginary cursor position
    var cursor = {
        line: 6,
        column: 43
    };
    
    document.getElementById("input").innerHTML = testDummy;
    
    // traverse the ast
    estraverse.traverse(ast, {
        enter: enter,
        //leave: leave
    });
    
    document.getElementById("output").innerHTML = output;

    function enter(node, parent) {
        // Check if node is annotatable and if so, call it's anotation function
        var jsDoc;
        if (isAnnotatable(node)) {
            // Create jsDoc annotation
            jsDoc = annotate[node.type](node, parent);
            
            // Check if there is already a jsdoc annotation for this annnotatable
            var jsDocCommentExists = false;
            _.forEach(node.leadingComments, function(value, key){
                if(value.type === "Block" && value.value.charAt(0) === "*"){
                    // jsDoc comment
                    jsDocCommentExists = true;
                }
            });
            
            // Insert jsDoc into output variable
            if(_.isString(jsDoc) && !jsDocCommentExists){
                output = output.substr(0, node.range[0]+outputLength) + jsDoc + output.substr(node.range[0]+outputLength);
                outputLength += jsDoc.length;
            }
        }
    }

    /*function leave(node, parent) {
        //console.log(node.id);
    };*/

    
    /**
     * Description 
     * @param {object} Check if node is annotatable
     */ 
    function isAnnotatable(node) {
        // Annotatable elements
        var ANNOTATABLES = [
                esprima.Syntax.ExpressionStatement,
                esprima.Syntax.VariableDeclaration,
                esprima.Syntax.FunctionDeclaration,
                esprima.Syntax.Property
            ]; // That's it for the timebeeing
        if (ANNOTATABLES.indexOf(node.type) != -1) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Compare two positions
     * @param {type} a first position
     * @param {type} b second position
     */
    function positionAGreaterB(a, b) {
        if (a.line > b.line) {
            return true;
        } else if (a.line === b.line && a.column > b.column) {
            return true;
        } else {
            return false;
        }
    }
});