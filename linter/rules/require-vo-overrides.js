/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that Specialized Value Objects override make() and validate()',
    },
    schema: [], // no options
    messages: {
      missingMake: "Specialized Value Object '{{ className }}' must override static make().",
      missingValidate:
        "Specialized Value Object '{{ className }}' must override static validate().",
    },
  },
  create(context) {
    const baseValueObjects = ['Name', 'Money', 'Id', 'Email']

    return {
      ClassDeclaration(node) {
        if (!node.superClass || node.superClass.type !== 'Identifier') {
          return
        }

        const superClassName = node.superClass.name
        if (!baseValueObjects.includes(superClassName)) {
          return
        }

        const className = node.id ? node.id.name : 'AnonymousClass'

        // Find make and validate methods
        const methods = node.body.body.filter((element) => element.type === 'MethodDefinition')

        const hasMake = methods.some(
          (m) => m.static === true && m.key.type === 'Identifier' && m.key.name === 'make'
        )
        const hasValidate = methods.some(
          (m) => m.static === true && m.key.type === 'Identifier' && m.key.name === 'validate'
        )

        if (!hasMake) {
          context.report({
            node,
            messageId: 'missingMake',
            data: { className },
          })
        }

        if (!hasValidate) {
          context.report({
            node,
            messageId: 'missingValidate',
            data: { className },
          })
        }
      },
    }
  },
}
