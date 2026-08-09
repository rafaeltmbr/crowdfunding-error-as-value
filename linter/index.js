import noFloatingResult from './rules/no-floating-result.js'
import requireVoOverrides from './rules/require-vo-overrides.js'
import requireEntityMethods from './rules/require-entity-methods.js'

const plugin = {
  rules: {
    'no-floating-result': noFloatingResult,
    'require-vo-overrides': requireVoOverrides,
    'require-entity-methods': requireEntityMethods,
  },
}

export default plugin
