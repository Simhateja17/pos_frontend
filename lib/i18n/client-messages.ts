/**
 * Telugu for messages raised OUTSIDE React (the API client), keyed by the
 * exact English text. The API client has no hook access, so it asks
 * `localizeMessage()` at throw time, which reads the language cookie.
 *
 * Unknown text (for example a backend-supplied reason) is returned unchanged.
 */
import { LOCALE_COOKIE, parseLocale } from './locale'

const TE: Record<string, string> = {
  'Your session has expired. Sign in again to continue.': 'మీ సెషన్ ముగిసింది. కొనసాగడానికి మళ్లీ సైన్ ఇన్ చేయండి.',
  'Your account cannot access this store context.': 'మీ అకౌంట్‌కు ఈ స్టోర్ యాక్సెస్ లేదు.',
  'Your account cannot access this dashboard.': 'మీ అకౌంట్‌కు ఈ డాష్‌బోర్డ్ యాక్సెస్ లేదు.',
  'Your account cannot access these store records.': 'మీ అకౌంట్‌కు ఈ స్టోర్ రికార్డుల యాక్సెస్ లేదు.',
  'This register requires a staff PIN.': 'ఈ రిజిస్టర్‌కు సిబ్బంది PIN అవసరం.',
  'We could not reach the store context. Check your connection and retry.': 'స్టోర్ వివరాలు అందుకోలేకపోయాం. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.',
  'We could not reach subscription status. Check your connection and retry.': 'సబ్‌స్క్రిప్షన్ స్థితి అందుకోలేకపోయాం. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.',
  'We could not reach store records. Check your connection and retry.': 'స్టోర్ రికార్డులు అందుకోలేకపోయాం. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.',
  'We could not reach notifications. Check your connection and retry.': 'నోటిఫికేషన్లు అందుకోలేకపోయాం. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.',
  'We could not reach current store data. Check your connection and retry.': 'ప్రస్తుత స్టోర్ డేటా అందుకోలేకపోయాం. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.',
  'That store could not be saved. Please retry.': 'ఆ స్టోర్ సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'Your import history is unavailable right now. Please retry.': 'మీ ఇంపోర్ట్ చరిత్ర ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Your catalog is unavailable right now. Please retry.': 'మీ క్యాటలాగ్ ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Transfer destinations are unavailable right now. Please retry.': 'బదిలీ గమ్యస్థానాలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'The suppression list is unavailable right now. Please retry.': 'బ్లాక్ చేసిన ఈమెయిల్ జాబితా ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The sale could not be completed right now. Please retry.': 'అమ్మకం ప్రస్తుతం పూర్తి కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'The receipt could not be sent right now. Please retry.': 'రసీదు ప్రస్తుతం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'The manual forecast status is unavailable right now. Please retry.': 'మాన్యువల్ అంచనా స్థితి ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The manual forecast could not be queued. Please retry.': 'మాన్యువల్ అంచనా ప్రారంభం కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'The manual forecast comparison is unavailable right now. Please retry.': 'మాన్యువల్ అంచనా పోలిక ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The list of reports is unavailable right now. Please retry.': 'రిపోర్టుల జాబితా ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The latest manual forecast is unavailable right now. Please retry.': 'తాజా మాన్యువల్ అంచనా ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The email send log is unavailable right now. Please retry.': 'ఈమెయిల్ పంపిన చరిత్ర ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The GST invoice for this sale is unavailable right now. Please retry.': 'ఈ అమ్మకం GST ఇన్వాయిస్ ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'The GST invoice could not be created right now. Please retry.': 'GST ఇన్వాయిస్ ప్రస్తుతం తయారు కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That transfer receipt could not be saved. Please retry.': 'బదిలీ స్వీకరణ సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That supplier link could not be updated. Please retry.': 'సరఫరాదారు లింక్ అప్‌డేట్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That supplier link could not be removed. Please retry.': 'సరఫరాదారు లింక్ తీసివేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'That supplier is unavailable right now. Please retry.': 'ఆ సరఫరాదారు వివరాలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'That supplier could not be updated. Please retry.': 'సరఫరాదారు అప్‌డేట్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That supplier could not be saved. Please retry.': 'సరఫరాదారు సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That supplier could not be linked to this product. Please retry.': 'ఈ ప్రొడక్ట్‌కు సరఫరాదారుని జత చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'That stock transfer could not be sent. Please retry.': 'స్టాక్ బదిలీ పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'That sale is unavailable right now. Please retry.': 'ఆ అమ్మకం వివరాలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'That report could not be run. Please retry.': 'ఆ రిపోర్ట్ రన్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That purchase order could not be updated. Please retry.': 'కొనుగోలు ఆర్డర్ అప్‌డేట్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That purchase order could not be created. Please retry.': 'కొనుగోలు ఆర్డర్ తయారు కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That import could not be applied. Nothing was changed. Please retry.': 'ఇంపోర్ట్ వర్తించలేదు. ఏమీ మారలేదు. మళ్లీ ప్రయత్నించండి.',
  'That goods receipt could not be recorded. Please retry.': 'సరుకు స్వీకరణ నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'That file could not be read. Check it is a CSV or Excel export and retry.': 'ఆ ఫైల్ చదవలేకపోయాం. అది CSV లేదా Excel ఫైల్ అని చూసి మళ్లీ ప్రయత్నించండి.',
  'That address could not be suppressed. Please retry.': 'ఆ ఈమెయిల్‌ను బ్లాక్ చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'That address could not be allowed again. Please retry.': 'ఆ ఈమెయిల్‌ను మళ్లీ అనుమతించలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'That GST document is unavailable right now. Please retry.': 'ఆ GST పత్రం ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Suppliers for this product are unavailable right now. Please retry.': 'ఈ ప్రొడక్ట్ సరఫరాదారులు ప్రస్తుతం అందుబాటులో లేరు. మళ్లీ ప్రయత్నించండి.',
  'Supplier records are unavailable right now. Please retry.': 'సరఫరాదారుల రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Subscription status is unavailable right now. Please retry.': 'సబ్‌స్క్రిప్షన్ స్థితి ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Store records are unavailable right now. Please retry.': 'స్టోర్ రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Store context is unavailable right now. Please retry.': 'ప్రస్తుతం స్టోర్ వివరాలు అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Stock transfers are unavailable right now. Please retry.': 'స్టాక్ బదిలీలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Shift records are unavailable right now. Please retry.': 'షిఫ్ట్ రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Sales-tax settings could not be saved right now. Please retry.': 'సేల్స్ టాక్స్ సెట్టింగ్స్ ప్రస్తుతం సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'Sales-tax settings are unavailable right now. Please retry.': 'సేల్స్ టాక్స్ సెట్టింగ్స్ ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Sales records are unavailable right now. Please retry.': 'అమ్మకాల రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Reorder suggestions could not be recalculated. Please retry.': 'రీఆర్డర్ సూచనలు మళ్లీ లెక్కించలేకపోయాం. మళ్లీ ప్రయత్నించండి.',
  'Reorder suggestions are unavailable right now. Please retry.': 'రీఆర్డర్ సూచనలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Purchase orders are unavailable right now. Please retry.': 'కొనుగోలు ఆర్డర్లు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Products for this supplier are unavailable right now. Please retry.': 'ఈ సరఫరాదారు ప్రొడక్ట్‌లు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Product lookup is unavailable right now. Please retry.': 'ప్రొడక్ట్ వెతుకులాట ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Payment records are unavailable right now. Please retry.': 'చెల్లింపు రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Notifications are unavailable right now. Please retry.': 'నోటిఫికేషన్లు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Low-stock records are unavailable right now. Please retry.': 'తక్కువ స్టాక్ రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'GST documents are unavailable right now. Please retry.': 'GST పత్రాలు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Customer records are unavailable right now. Please retry.': 'కస్టమర్ రికార్డులు ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'Customer lookup is unavailable right now. Please retry.': 'కస్టమర్ వెతుకులాట ప్రస్తుతం అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Current store data is unavailable right now. Please retry.': 'ప్రస్తుత స్టోర్ డేటా అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.',
  'Credit notes for this invoice are unavailable right now. Please retry.': 'ఈ ఇన్వాయిస్ క్రెడిట్ నోట్స్ ప్రస్తుతం అందుబాటులో లేవు. మళ్లీ ప్రయత్నించండి.',
  'A suggested mapping is unavailable right now. Map the columns yourself, or retry.': 'సూచించిన కాలమ్ మ్యాపింగ్ ప్రస్తుతం అందుబాటులో లేదు. కాలమ్‌లను మీరే మ్యాప్ చేయండి, లేదా మళ్లీ ప్రయత్నించండి.',
}

/** The viewer's chosen language, read from the cookie (English outside a browser). */
export function currentLocale() {
  if (typeof document === 'undefined') return 'en' as const
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  return parseLocale(match?.[1])
}

/**
 * Only the India edition is translated. The US edition shares this client, so
 * a Telugu cookie left over from /app must not leak into /us/dashboard.
 */
export function localizeMessage(message: string): string {
  if (currentLocale() !== 'te') return message
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/us')) return message
  return TE[message] ?? message
}
