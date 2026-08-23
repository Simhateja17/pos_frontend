import { UsUnavailableModulePage } from './states'

export function UsHardwareView() {
  return <UsUnavailableModulePage title="Hardware Setup" sub="Device pairing is not available in this build" capability="Printer, scanner, cash-drawer, and card-terminal pairing has no backend contract on the International surface." />
}
