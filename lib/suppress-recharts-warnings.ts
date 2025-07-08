// Suppress unnecessary Recharts ResponsiveContainer warnings
// These warnings occur when Recharts detects computed dimensions
// even though we're using ResponsiveContainer correctly

if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    if (
      typeof message === 'string' &&
      message.includes('The width') &&
      message.includes('and height') &&
      message.includes('are both fixed numbers') &&
      message.includes('ResponsiveContainer')
    ) {
      // Suppress this specific warning
      return
    }
    originalWarn.apply(console, args)
  }
}