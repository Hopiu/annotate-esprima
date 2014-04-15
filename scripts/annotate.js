/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(['exports', 'underscore', 'lib/esprima-master/esprima'], function (exports, _, esprima) {

    /**
     * From esmorph.js
     * @param {type} object to run visitor on
     * @param {type} visitor Description
     * @param {type} path Description
     */
    function traverse(object, visitor, path) {
        var key, child;

        if (typeof path === 'undefined') {
            path = [];
        }

        visitor.call(null, object, path);
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                if (typeof child === 'object' && child !== null) {
                    traverse(child, visitor, [object].concat(path));
                }
            }
        }
    }

    /**
     * From esmorph.js
     * Find a return statement within a function which is the exit for
     * the said function. If there is no such explicit exit, a null
     * will be returned instead.
     * @param {object} functionNode The node that should be inspected for a return statement
     */
    function findExit(functionNode) {
        var exit = null;

        function isFunction(node) {
            return node.type && node.range &&
                (node.type === esprima.Syntax.FunctionDeclaration ||
                node.type === esprima.Syntax.FunctionExpression);
        }

        traverse(functionNode, function (node, path) {
            var i, parent;
            if (node.type === esprima.Syntax.ReturnStatement) {
                for (i = 0; i < path.length; ++i) {
                    parent = path[i];
                    if (isFunction(parent)) {
                        if (parent.range === functionNode.range) {
                            exit = node;
                        }
                        break;
                    }
                }
            }
        });

        return exit;
    }

    /**
     * Add node.loc.start.column spaces to get the same indentation as the node
     * @param {type} node The node you want to get the indentation for
     */
    function getIndentation(node) {
        return Array(node.loc.start.column).join(' ');
    }

    function buildJsDoc(node, indentation) {
        var jsDoc = "";
        switch (node.type) {
        case esprima.Syntax.Literal:
            jsDoc += "\n" + indentation + " * @type {" + typeof node.value + "}";
            break;
        case esprima.Syntax.FunctionExpression:
            jsDoc += "\n" + indentation + " * @type {function}";
            _.forEach(node.params, function (v, key) {
                jsDoc += getParamString(v, indentation);
            });
            jsDoc += getReturnString(node, indentation);
            break;
        case esprima.Syntax.ObjectExpression:
            jsDoc += "\n" + indentation + " * @type {object}";
            break;
        default:
            break;
        }
        return jsDoc;
    }

    /**
     * Returns the jsDoc string representation for a parameter of a function
     * @param {type} param The parameter you want to get the jsDoc representation for
     */
    function getParamString(param, indentation) {
        return "\n" + indentation + " * @param {Type} Description";
    }

    /**
     * Try to find a return statement to a function, if it finds one, return the corresponding jsDoc string
     * @param {type} node The node from which you want to find the return value.
     */
    function getReturnString(node, indentation) {
        var returnStatement = findExit(node);
        //Todo: find the tpye of the returned argument, as it is, it's always an object
        return (_.isObject(returnStatement) ? "\n" + indentation + " * @return {" + typeof returnStatement.argument + "} Description" : "");
    }

    /**
     * Annotate ExpressionStatement
     * @param {type} node Description
     * @param {type} parent Description
     */
    exports.ExpressionStatement = function (node, parent) {
        var indentation = getIndentation(node);
        var jsDoc = "\n" + indentation + "/**";

        switch (node.expression.type) {
        case esprima.Syntax.Literal:
        case esprima.Syntax.CallExpression:
            return;
        case esprima.Syntax.AssignmentExpression:
            if (node.expression.left.property.name === node.expression.left.property.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";
            jsDoc += buildJsDoc(node.expression.right, indentation);
        }

        jsDoc += "\n" + indentation + " **/\n" + indentation;
        return jsDoc;
    };

    /**
     * Annotate VariableDeclaration
     * @param {type} node Description
     * @param {type} parent Description
     * @returns {type} Description
     */
    exports.VariableDeclaration = function (node, parent) {
        // Add node.loc.start.column spaces to get the same indentation as the node
        var indentation = getIndentation(node);
        var jsDoc = "\n" + indentation + "/**";

        // Add each declaration
        _.forEach(node.declarations, function (value, key) {
            jsDoc += "\n" + indentation + " * @name " + value.id.name; //Todo: remove this line, as jsDoc will check the name at generation time

            // check if variable is uppercase, if so, it's a constant
            if (value.id.name === value.id.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";

            // check the type with which the variable is initialized
            if (value.init !== null) {
                jsDoc += buildJsDoc(value.init, indentation);
            }

            // check if first character is an underline, if so it's a private variable
            if (value.id.name.charAt(0) === '_') jsDoc += "\n" + indentation + " * @private";
        });
        jsDoc += "\n" + indentation + " **/\n" + indentation;
        return jsDoc;
    };

    /**
     * Annotate FunctionDeclaration
     * @param {type} node Description
     * @param {type} parent Description
     */
    exports.FunctionDeclaration = function (node, parent) {
        var indentation = getIndentation(node);
        var jsDoc = "\n" + indentation + "/**";
        jsDoc += "\n" + indentation + " * @name " + node.id.name;

        // Add each parameter
        _.forEach(node.params, function (value, key) {
            jsDoc += getParamString(value, indentation);
        });
        jsDoc += getReturnString(node, indentation);
        jsDoc += "\n" + indentation + " **/\n" + indentation;

        return jsDoc;
    };

    /**
     * Annotate Properties
     * @param {type} node Description
     * @param {type} parent Description
     */
    exports.Property = function (node, parent) {
        var indentation = getIndentation(node);
        var jsDoc = "\n" + indentation + "/**";
        jsDoc += "\n" + indentation + " * @name " + node.key.name;

        // check if variable is uppercase, if so, it's a constant
        if (node.key.name === node.key.name.toUpperCase()) jsDoc += "\n" + indentation + " * @const";

        // check the type with which the variable is initialized
        if (node.value !== null) {
            jsDoc += buildJsDoc(node.value, indentation);
        }

        // check if first character is an underline, if so it's a private variable
        if (node.key.name.charAt(0) === '_') jsDoc += "\n" + indentation + " * @private";

        jsDoc += "\n" + indentation + " **/\n" + indentation;

        return jsDoc;
    };
});