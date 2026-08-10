"use client";

import "@/app/landing.css";
import { useState } from "react";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

const INFO = [
  ["mail", '<path d="M3.5 6.5h17v11a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M4 7l8 6.4L20 7"/>', "Email", "hello@Ambel.in"],
  ["phone", '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.36 10.4 10.4 0 0 0 3.3.53 1.5 1.5 0 0 1 1.5 1.5V20.5A1.5 1.5 0 0 1 20.2 22 17.5 17.5 0 0 1 2.5 4.3 1.5 1.5 0 0 1 4 2.8h3.3a1.5 1.5 0 0 1 1.5 1.5 10.4 10.4 0 0 0 .53 3.3 1.5 1.5 0 0 1-.36 1.5z"/>', "Phone", "+91 80 4718 2600"],
  ["pin", '<path d="M12 21.5s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="9.5" r="2.4"/>', "Office", "Koramangala, Bengaluru 560034"],
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.5 6.5h17v11a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" /><path d="M4 7l8 6.4L20 7" /></svg>
          Contact us
        </div>
        <h1>Let&apos;s talk about<br /><em>your store.</em></h1>
        <p>Questions about pricing, a demo request, or feedback on the product? Our team usually replies within one business day.</p>
      </section>

      <section className="content-section">
        <div className="contact-grid">
          <div>
            {INFO.map(([, icon, label, value]) => (
              <div className="contact-info-item" key={label}>
                <div className="ico"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: icon }} /></div>
                <div>
                  <h4>{label}</h4>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            {submitted ? (
              <div className="feat-card" style={{ padding: 32 }}>
                <div className="feat-h">Thanks, message sent.</div>
                <p className="feat-p">We&apos;ve received your note and will get back to you within one business day.</p>
              </div>
            ) : (
              <form
                className="contact-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <input type="text" placeholder="Your name" required />
                <input type="email" placeholder="Work email" required />
                <input type="text" placeholder="Store name (optional)" />
                <textarea placeholder="How can we help?" rows={5} required />
                <button className="btn-primary" style={{ height: 46, alignSelf: "flex-start", padding: "0 24px" }} type="submit">
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
