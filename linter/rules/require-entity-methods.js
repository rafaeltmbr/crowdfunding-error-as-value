/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that Aggregate Roots and Entities implement required architectural methods.',
    },
    schema: [],
    messages: {
      missingConstructor: "Exported Entity '{{ className }}' must have a protected constructor.",
      missingMake: "Exported Entity '{{ className }}' must implement static make().",
      missingFromSnapshot:
        "Exported Entity '{{ className }}' must implement static fromSnapshot().",
      missingToSnapshot: "Exported Entity '{{ className }}' must implement toSnapshot().",
    },
  },
  create(context) {
    const filename = context.filename

    // Only apply to files in src/domain/entities
    if (!filename.includes('/domain/entities/')) {
      return {}
    }

    return {
      'ExportNamedDeclaration > ClassDeclaration'(node) {
        const className = node.id ? node.id.name : 'AnonymousEntity'

        const methods = node.body.body.filter((element) => element.type === 'MethodDefinition')

        // 1. Check for protected constructor
        const constructor = methods.find((m) => m.kind === 'constructor')
        if (!constructor || constructor.accessibility !== 'protected') {
          context.report({ node, messageId: 'missingConstructor', data: { className } })
        }

        // 2. Check for static make()
        const hasMake = methods.some((m) => m.static === true && m.key.name === 'make')
        if (!hasMake) {
          context.report({ node, messageId: 'missingMake', data: { className } })
        }

        // 3. Check for static fromSnapshot()
        const hasFromSnapshot = methods.some(
          (m) => m.static === true && m.key.name === 'fromSnapshot'
        )
        if (!hasFromSnapshot) {
          context.report({ node, messageId: 'missingFromSnapshot', data: { className } })
        }

        // 4. Check for toSnapshot() instance method
        const hasToSnapshot = methods.some((m) => m.static === false && m.key.name === 'toSnapshot')
        if (!hasToSnapshot) {
          context.report({ node, messageId: 'missingToSnapshot', data: { className } })
        }
      },
    }
  },
}
