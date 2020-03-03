import { flow, isString, isFunction, isObject, isArray } from "lodash"

// person@name | toUpperCase()
// person | toUpperCase()
function parseInput(input) {
  const [selectorWithAttrName, ...filters] = input.split("|")
  const [selector, attrName = "textContent"] = selectorWithAttrName.split(
    "@",
    2,
  )
  return {
    selector: selector.trim(),
    attrName: attrName.trim(),
    filters: filters.map((f) => f.trim()),
  }
}

function getAttrOrProp(attrName) {
  return (el) => {
    if (el) {
      if (el.hasAttribute(attrName)) {
        return el.getAttribute(attrName)
      }
      return el[attrName]
    }
    return null
  }
}

function applyFilters(filters) {
  return (value) =>
    filters.reduce((result, filter) => {
      if (result) {
        try {
          return eval(`result.${filter}`)
        } catch (e) {
          throw new Error(`Filter error: ${filter}: ${e}`)
        }
      }
      return null
    }, value)
}

// {
//   value: 'a@href',
//   array: ['a@href'],
//   transform: x('a@href', (href) => href.reverse() ),
//   fn: (el) => el.querySelector('[title]'),
// }
function queryObject(schema) {
  return (el) =>
    Object.keys(schema).reduce((result, propName) => {
      const value = schema[propName]
      if (isFunction(value)) {
        result[propName] = value(el)
      } else {
        result[propName] = query(value)(el)
      }
      return result
    }, {})
}

// x(['a'], (val) => val)
// x(['.thumb-container'], {
//   key: 'a@href',
//   title: '.title@textContent',
//   thumbs: ['img@src | replace("-small", "")'],
// })
//
function queryAll(input, transform) {
  return (doc) => {
    const { selector, attrName, filters } = parseInput(input)
    const results = Array.from(doc.querySelectorAll(selector))
    if (isFunction(transform)) {
      if (input.includes("@")) {
        return results.map(
          flow(
            getAttrOrProp(attrName),
            applyFilters(filters),
            transform,
          ),
        )
      }
      return results.map(transform)
    }

    if (isObject(transform)) {
      return results.map(queryObject(transform))
    }

    return results.map(
      flow(
        getAttrOrProp(attrName),
        applyFilters(filters),
      ),
    )
  }
}

// x('@href')
// x('a@href')
// x('a@href', (href) => href)
function queryOne(input, transform = (val) => val) {
  return (doc) => {
    if (isString(input)) {
      const { selector, attrName, filters } = parseInput(input)

      if (selector) {
        return flow(
          getAttrOrProp(attrName),
          applyFilters(filters),
          transform,
        )(doc.querySelector(selector))
      }

      return flow(
        getAttrOrProp(attrName),
        applyFilters(filters),
        transform,
      )(doc)
    }

    // x({ href : "a@href" })
    // x({ href : "a@href" }, (res) => res.href )
    if (isObject(input)) {
      return flow(
        queryObject(input),
        transform,
      )(doc)
    }

    throw new Error(`Invalid query: ${JSON.stringify(input)}`)
  }
}

export default function query(input, ...opts) {
  // x(["query"], ...)
  if (isArray(input)) {
    if (input.length === 1) {
      return queryAll(...[...input, ...opts])
    }
    throw new Error(`Invalid query: ${JSON.stringify(input)}`)
  }
  // x("div@attr", ...)
  // x("@attr", ...)
  // x({key: "value"}, ...)
  if (isString(input) || isObject(input)) {
    return queryOne(input, ...opts)
  }

  throw new Error(`Invalid query: ${JSON.stringify(input)}`)
}
