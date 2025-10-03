// src/pages/Legal/PrivacyPolicy.jsx
import React from "react";
import "./PrivacyPolicy.css";

/*
  Tailored Privacy Policy for Joe's Bakery India Private Ltd.
  NOTE: This is informational and does not constitute legal advice.
  Review for compliance with India's Digital Personal Data Protection Act (DPDP 2023), IT Act & any FSSAI / taxation record-keeping obligations.
*/
export default function PrivacyPolicy() {
  const companyName = "Joesbakery India Private Ltd"; // use consistent legal name
  const brandName = "Joe's Bakery";
  const contactEmail = "hello.joesbakery@gmail.com"; // update if different
  const contactAddress = "Bengaluru, Karnataka, India"; // precise locality spelling
  const grievanceOfficer = "Data / Privacy Contact"; // if you appoint a specific officer, replace

  return (
    <div className="legal-page privacy-policy">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated"><strong>Last updated:</strong> {new Date().getFullYear()} </p>

        <p>
          This Privacy Policy explains how {companyName} ("{brandName}", "we", "our", or "us") collects, uses, stores and protects
          the personal information you provide when you interact with our website <strong>www.joesbakery.in</strong>
          (the "Website") and when you submit an order enquiry or contact request (the "Services").
          By using the Website you agree to the practices described here.
        </p>

        <h2>1. What We Collect</h2>
        <p>We do <em>not</em> provide account registration or persistent user profile features at this time. We only collect the minimum information needed to respond to an enquiry or to process an order request you voluntarily submit. This may include:</p>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Mobile / phone number</li>
          <li>Requested product, quantity and any special instructions (e.g. custom message, dietary preference)</li>
          <li>Optional delivery or pickup notes you provide (if relevant to the order)</li>
        </ul>
        <p>
          We may also automatically receive limited technical information (e.g. browser type, approximate location derived from IP, device information) used for security, debugging and improving the Website. We do not currently perform behavioural profiling.
        </p>

  <h2>2. Purpose of Use</h2>
        <p>We use the personal information described above only to:</p>
        <ul>
          <li>Respond to your enquiry or order request</li>
          <li>Prepare, confirm and coordinate your bakery order</li>
          <li>Communicate important updates (availability, clarification, pickup/delivery timing)</li>
          <li>Improve the quality, safety and reliability of our offerings</li>
          <li>Comply with legal, taxation or food safety record-keeping obligations (where applicable)</li>
        </ul>

        <h2>3. Service Territory / Geographic Scope</h2>
        <p>
          We currently accept and fulfil enquiries / orders only within <strong>Bengaluru, Karnataka (India)</strong>. If you
          submit a request from outside this service territory we may decline or respond solely to clarify availability. We
          do not ship products internationally at this time.
        </p>

        <h2>4. Legal Basis (India & Global Visitors)</h2>
        <p>
          Your submission of information is treated as <strong>consent</strong> to use it for the limited purposes stated. Where required by emerging Indian data protection frameworks, we rely on legitimate business interest to fulfil and document your order / enquiry.
        </p>

        <h2>5. Cookies & Tracking</h2>
        <p>
          The Website presently uses only essential technical functionality. If we later implement analytics (e.g. Google Analytics) or advertising cookies, we will update this section and may introduce a consent banner where required.
        </p>

        <h2>6. Sharing & Disclosure</h2>
        <p>We do <strong>not</strong> sell your personal information. We may share limited information only:</p>
        <ul>
          <li>With delivery or logistics partners strictly to fulfil your order (if delivery is requested)</li>
          <li>With service providers that host or securely process Website data (e.g. cloud infrastructure)</li>
          <li>To comply with applicable law, regulation, legal process, or enforceable governmental request</li>
          <li>To investigate fraud, abuse, security incidents or to protect our rights/users</li>
          <li>In a business transfer (merger, acquisition or asset sale) — new entity will honor this Policy or notify you of changes</li>
        </ul>

  <h2>7. Data Storage & Retention</h2>
        <p>
          Information you submit is retained only as long as reasonably necessary to respond to you, execute and document the order (including any legally required retention period for invoices/records) and maintain business continuity. We implement reasonable administrative, technical and physical safeguards; however, no Internet transmission is 100% secure.
        </p>

  <h2>8. International / Cross-Border Handling</h2>
        <p>
          Data may be processed or stored on servers located outside your state or country. We take reasonable steps to ensure any such storage maintains protections consistent with this Policy.
        </p>

  <h2>9. Your Choices & Rights</h2>
        <ul>
          <li>You may decline to submit information; we then may be unable to process the enquiry/order.</li>
          <li>You may request correction or deletion of your information (subject to lawful retention obligations).</li>
          <li>You may withdraw consent by emailing us; we will stop using your data for future communications unless required legally.</li>
        </ul>

  <h2>10. Children's Data</h2>
        <p>The Website is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child provided data, please contact us for deletion.</p>

  <h2>11. Updates to this Policy</h2>
        <p>
          We may revise this Policy periodically. The updated date at the top indicates the latest revision. Material changes may be highlighted on the Website. Continued use after changes constitutes acknowledgement.
        </p>

  <h2>12. Contact & Grievance</h2>
        <p>If you have questions, requests, or grievances about privacy or data handling, contact us:</p>
        <address>
          <strong>{companyName}</strong><br />
          {contactAddress}<br />
          Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a><br />
          Grievance / Privacy Contact: {grievanceOfficer}
        </address>

  <h2>13. Version</h2>
        <p>This is version 1.0 of the {brandName} Privacy Policy.</p>
      </div>
    </div>
  );
}
