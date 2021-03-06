// @flow
const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/

export function rewriteStacktrace (e: any, distDir: string): void {
  if (!e || typeof e.stack !== 'string') {
    return
  }

  const lines = e.stack.split('\n')

  const result = lines.map((line) => {
    return rewriteTraceLine(line, distDir)
  })

  e.stack = result.join('\n')
}

function rewriteTraceLine (trace: string, distDir: string): string {
  const m = trace.match(filenameRE)
  if (m == null) {
    return trace
  }
  const filename = m[1]
  const filenameLink = filename.replace(distDir, '/_joy/development').replace(/\\/g, '/')
  trace = trace.replace(filename, filenameLink)
  return trace
}
