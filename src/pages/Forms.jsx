import { useDocumentTitle } from '../hooks';
import { company } from '../data/site';
import EnquiryForm from '../components/EnquiryForm';
import { ContactButtons, PageHero, Section } from '../components/ui';

const Page = ({ title, subtitle, crumb, children }) => {
  useDocumentTitle(title);
  return (<><PageHero title={title} subtitle={subtitle} crumb={crumb} />{children}</>);
};

const base = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'phone', label: 'Mobile number', type: 'tel', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

export function Contact() {
  return (
    <Page title="Contact Us" subtitle="Customer care and online bulk enquiries." crumb="Contact">
      <Section>
        <div className="two-col">
          <div>
            <h3>Get in touch</h3>
            <p><strong>Email</strong><br /><a href={`mailto:${company.email}`}>{company.email}</a></p>
            {company.phone && <p><strong>Phone</strong><br />{company.phone}</p>}
            <p><strong>Manufacturing facilities</strong><br />{company.address}</p>
            <p className="muted">Call/WhatsApp orders available.</p>
            <ContactButtons message="Hello, I would like to enquire about Maida." />
          </div>
          <EnquiryForm kind="contact" subject="Website contact enquiry" fields={[...base, { name: 'message', label: 'Message', type: 'textarea', required: true, full: true }]} submitLabel="Send message" />
        </div>
      </Section>
    </Page>
  );
}

export function DealerEnquiry() {
  return (
    <Page title="Dealer Enquiry" subtitle="Become a Jayakrishna dealer. Approved dealers get dealer prices and order history in their login." crumb="Partners">
      <Section>
        <EnquiryForm
          kind="dealer-enquiry"
          subject="Dealer enquiry"
          fields={[
            ...base,
            { name: 'business', label: 'Business / shop name', required: true },
            { name: 'city', label: 'City / district', required: true },
            { name: 'brand', label: 'Brand of interest', options: ['Kili Brand', 'Lion Brand', 'Both'] },
            { name: 'volume', label: 'Expected monthly volume (kg)' },
            { name: 'message', label: 'Anything else we should know', type: 'textarea', full: true },
          ]}
        />
      </Section>
    </Page>
  );
}

export function SupplierRegistration() {
  return (
    <Page title="Supplier Registration" subtitle="Register to supply to Jayakrishna Flour Mill. Approved suppliers can update rates and upload quotations after login." crumb="Partners">
      <Section>
        <EnquiryForm
          kind="supplier-registration"
          subject="Supplier registration"
          fields={[
            ...base,
            { name: 'company', label: 'Company name', required: true },
            { name: 'gst', label: 'GSTIN' },
            { name: 'supplies', label: 'What do you supply?', required: true },
            { name: 'city', label: 'City / district' },
            { name: 'message', label: 'Additional details', type: 'textarea', full: true },
          ]}
          submitLabel="Submit registration"
        />
      </Section>
    </Page>
  );
}
