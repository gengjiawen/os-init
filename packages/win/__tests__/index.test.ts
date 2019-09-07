import { list } from "../libs"

test('packages', () => {
  expect(() => list()).not.toThrow()
})
