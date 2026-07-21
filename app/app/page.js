import Script from "next/script";
import { BODY } from "../bodyMarkup";

// The original prototype is a self-contained vanilla-JS app: it renders all of
// its UI by injecting HTML strings into the DOM and wires interactions through
// global functions referenced by inline on* handlers. To keep behaviour 1:1 we
// render the exact static shell markup, then load the original combined script.
export default function AppPage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
      <Script src="/couture.js" strategy="afterInteractive" />
    </>
  );
}
