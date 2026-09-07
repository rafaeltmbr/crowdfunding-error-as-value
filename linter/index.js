import noFloatingResult from './rules/no-floating-result.js'
import requireVoOverrides from './rules/require-vo-overrides.js'
import requireEntityMethods from './rules/require-entity-methods.js'
import enforceBarrelImports from './rules/enforce-barrel-imports.js'

const plugin = {
  rules: {
    'no-floating-result': noFloatingResult,
    'require-vo-overrides': requireVoOverrides,
    'require-entity-methods': requireEntityMethods,
    'enforce-barrel-imports': enforceBarrelImports,
  },
}

export default plugin
