/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that Result types are handled and not ignored.',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      floatingResult: 'Results must be handled. Do not ignore the returned Result.',
    },
    schema: [],
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    const checker = services?.program?.getTypeChecker();

    if (!services || !checker || !services.esTreeNodeToTSNodeMap) {
      return {};
    }

    function isResultType(type) {
      const typeName = checker.typeToString(type);
      
      // Heuristic check for Result, Success, or Failure types
      if (typeName.match(/(^|\.)(Result|Success|Failure)(<.*>|$)/)) {
        return true;
      }

      // Handle Promises
      if (typeName.startsWith('Promise<')) {
        // This is a bit simplified, but for a custom rule in a controlled project it's often enough.
        // A more robust way would be to get the type argument of the Promise.
        const innerTypeMatch = typeName.match(/^Promise<(.*)>$/);
        if (innerTypeMatch && (innerTypeMatch[1].includes('Result') || innerTypeMatch[1].includes('Success') || innerTypeMatch[1].includes('Failure'))) {
          return true;
        }
      }

      // If it's a union type, check its parts
      if (type.isUnion()) {
        return type.types.some(t => isResultType(t));
      }

      return false;
    }

    return {
      ExpressionStatement(node) {
        const expression = node.expression;

        if (expression.type !== 'CallExpression' && expression.type !== 'AwaitExpression') {
          return;
        }

        const tsNode = services.esTreeNodeToTSNodeMap.get(expression);
        const type = checker.getTypeAtLocation(tsNode);

        if (isResultType(type)) {
          context.report({
            node: expression,
            messageId: 'floatingResult',
          });
        }
      },
    };
  },
};
