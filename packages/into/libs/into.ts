import * as fs from 'fs'

export function into(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath)
  }
  process.chdir(filePath)
}
