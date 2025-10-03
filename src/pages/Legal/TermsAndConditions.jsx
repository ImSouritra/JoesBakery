// src/pages/Legal/TermsAndConditions.jsx
import React from "react";
import "./PrivacyPolicy.css"; // reuse same styling shell

/*
  Terms & Conditions for Joe's Bakery India Private Ltd.
  Tailored to: enquiry workflow, phone confirmation, 50% non‑refundable advance, remaining payment on delivery/pickup,
  no returns/refunds after confirmation except quality refusal before pickup, third‑party delivery partner disclaimer.
  Not legal advice—review with counsel for full compliance (especially consumer protection & FSSAI guidelines).
*/
export default function TermsAndConditions(){
  const brand = "Joe's Bakery";
  const legalName = "Joesbakery India Private Ltd";
  const territory = "Bengaluru, Karnataka, India";
  const contactEmail = "hello.joesbakery@gmail.com";
  const contactPhone = "+91 7003489784"; // adjust if needed

  return (
    <div className="legal-page privacy-policy">{/* reuse same container styles */}
      <div className="legal-container">
        <h1>Terms & Conditions</h1>
        <p className="last-updated"><strong>Last updated:</strong> {new Date().getFullYear()}</p>

        <p>
          These Terms & Conditions ("Terms") govern the browsing of the website <strong>www.joesbakery.in</strong> (the "Website")
          and the submission of product enquiries or custom order requests (collectively the "Order Request") to {legalName}
          ("{brand}", "we", "us", or "our"). By using the Website or submitting an Order Request you agree to these Terms and to our
          <a href="/privacy-policy" style={{marginLeft:4}}>Privacy Policy</a>. If you do not agree, please refrain from using the Website.
        </p>

        <h2>1. Nature of Platform</h2>
        <p>
          The Website presently functions as a catalogue and enquiry facilitation platform. It does not process real‑time online
          payments nor guarantee automatic order acceptance. All orders are manually confirmed via phone / messaging after you
          submit details through the contact / order forms.
        </p>

        <h2>2. Service Territory</h2>
        <p>
          We currently service orders only within <strong>{territory}</strong>. Requests originating outside this territory may be declined or held
          pending feasibility confirmation.
        </p>

        <h2>3. Placing an Order Request</h2>
        <ul>
          <li>You submit desired product(s), quantity, custom notes, date/time preference and contact details.</li>
            <li>Our team will reach out (usually by phone / WhatsApp / email) to verify availability, size, design and delivery or pickup method.</li>
          <li>An order is considered <strong>"Confirmed"</strong> only after you explicitly approve the final price & details and we receive the advance (see Section 4).</li>
        </ul>

        <h2>4. Pricing & Advance Payment</h2>
        <ul>
          <li>All indicative prices are subject to final confirmation based on design complexity, weight, flavour variants, add‑ons and lead time.</li>
          <li>A <strong>50% advance</strong> of the total quoted amount is payable to initiate preparation. This advance is <strong>non‑refundable</strong> once paid (see Section 6 for the limited quality exception).</li>
          <li>The remaining <strong>50% balance</strong> is due upon pickup or immediately prior to dispatch (if third‑party delivery partner is arranged).</li>
          <li>Accepted advance channels: bank transfer / UPI / other methods communicated directly. (We do not process card payments on the Website at this time.)</li>
        </ul>

        <h2>5. Modifications & Cancellations</h2>
        <ul>
          <li>Minor design or inscription changes requested <em>before production starts</em> will be attempted on a best‑effort basis.</li>
          <li>Cancellation after advance receipt forfeits the advance in full because ingredients & production slots are allocated.</li>
          <li>Rescheduling pickup / delivery time is subject to feasibility; additional charges may apply for urgent changes.</li>
        </ul>

        <h2>6. Quality Concern Window</h2>
        <p>
          You (or your designated pickup agent) must visually inspect the product at pickup / handover. If there is a genuine quality or correctness issue (wrong flavour, obvious damage prior to handover, incorrect inscription) you must raise it <strong>immediately on site</strong>. We will attempt appropriate remedial action or partial remake subject to practicality. Once the product leaves our premises the sale is final and <strong>no return / no refund</strong> applies.
        </p>

        <h2>7. Delivery / Third‑Party Logistics Disclaimer</h2>
        <p>
          We do not operate an in‑house delivery fleet. You may:<br />
          (a) Arrange your own pickup (self / friend / event planner) OR<br />
          (b) Instruct a third‑party on‑demand courier (e.g. Dunzo, Porter, Swiggy Genie, etc.).<br />
          Title and risk transfer upon handover to you or the selected courier partner. We are not responsible for delays, mishandling, temperature abuse, improper transport angle, vibrations or melting once the product leaves our control.
        </p>

        <h2>8. Storage & Handling Guidance</h2>
        <p>
          We provide basic handling / storage recommendations (e.g. refrigeration window, serving temperature). Failure to follow these may affect shelf life, texture or food safety; we are not liable for deterioration arising from improper storage.
        </p>

        <h2>9. Allergen & Dietary Disclosure</h2>
        <p>
          Products may contain or come into contact with common allergens including dairy, eggs, nuts, gluten, soy and chocolate derivatives. While reasonable care is taken, cross‑contact cannot be fully eliminated. Inform us of allergies in writing during confirmation; absence of explicit disclosure will be treated as acceptance of standard kitchen practices.
        </p>

        <h2>10. Intellectual Property</h2>
        <p>
          All Website content (images, text, branding, layouts) is owned by or licensed to {legalName}. No reproduction, scraping, resale, or derivative use is permitted without prior written consent. Limited personal, non‑commercial viewing is granted.
        </p>

        <h2>11. Acceptable Use</h2>
        <ul>
          <li>No attempt to disrupt site operation, probe security or inject malicious code.</li>
          <li>No automated scraping or bulk image downloading.</li>
          <li>No portrayal of our works as your own commercial portfolio without permission.</li>
        </ul>

        <h2>12. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, our aggregate liability for any claim relating to an order or the Website is limited to the amount you paid for the specific affected order. In no event are we liable for indirect, incidental, special, consequential or punitive damages (including loss of event value due to late pickup, third‑party courier delay, or aesthetic dissatisfaction when product matches the confirmed brief).
        </p>

        <h2>13. Indemnity</h2>
        <p>You agree to indemnify and hold us harmless from claims or demands arising out of your breach of these Terms, misuse of the Website, or violation of law or third‑party rights.</p>

        <h2>14. Force Majeure</h2>
        <p>We are not responsible for failure or delay due to events beyond reasonable control including floods, fire, extreme weather, strikes, epidemics, utility outages, or platform / hosting outages.</p>

        <h2>15. Changes to Terms</h2>
        <p>We may update these Terms periodically. Material changes will be signposted on the Website. Continued use after effective date constitutes acceptance.</p>

        <h2>16. Governing Law & Jurisdiction</h2>
        <p>These Terms are governed by the laws of India. Courts located in Bengaluru, Karnataka shall have exclusive jurisdiction.</p>

        <h2>17. Communications Consent</h2>
        <p>By submitting an Order Request you consent to us contacting you via phone, SMS, messaging apps or email regarding scheduling, clarification and payment reminders. You may request cessation of promotional messages at any time.</p>

        <h2>18. Contact</h2>
        <address>
          {legalName}<br />
          {territory}<br />
          Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a><br />
          Phone / WhatsApp: {contactPhone}
        </address>

        <p style={{marginTop:'2rem', fontSize:'.85rem', color:'#666'}}>
          NOTE: This document is a simplified Terms & Conditions draft prepared for a boutique bakery and should be reviewed by legal counsel for full compliance with Indian consumer protection and data laws.
        </p>
      </div>
    </div>
  );
}
