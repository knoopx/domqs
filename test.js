import assert from "assert"

import { JSDOM } from "jsdom"

import q from "."

const {
  window: { document },
} = new JSDOM(`
<items>
  <car color="red" />
  <car color="blue" />
  <number value="2" />
  <person>John Doe</person>
</item>
`)

const EXAMPLES = [
  [q(["car@color"]), ["red", "blue"]],
  [q(["car"], { color: "@color" }), [{ color: "red" }, { color: "blue" }]],
  [q("person"), "John Doe"],
  [q("number@value", parseInt), 2],
  [
    q(["number"], {
      value: q("@value", (x) => x - 1),
    }),
    [{ value: 1 }],
  ],
  [q("car@color | toUpperCase()"), "RED"],
  [q("person | toUpperCase()"), "JOHN DOE"],
]

describe("EXAMPLES", () => {
  EXAMPLES.forEach(([input, output]) => {
    it(`${JSON.stringify(output)}`, () => {
      assert.deepEqual(input(document), output)
    })
  })
})
