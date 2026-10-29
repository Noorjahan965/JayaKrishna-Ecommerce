import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks';
import { company } from '../data/site';
import { PageHero, Section } from '../components/ui';
import { NotFound } from './Info';

// TODO(client): the legal text has not been supplied. Put the approved wording in `body`.
// Do not publish generic legal text without the client / their lawyer signing it off.
const POLICIES = {
  terms: { title: 'Terms & Conditions', body: null },
  privacy: { title: 'Privacy Policy', body: null },
  returns: { title: 'Return Policy', body: null },
};

export default function Policy() {
  const { slug } = useParams();
  const policy = POLICIES[slug];
  useDocumentTitle(policy?.title);
  if (!policy) return <NotFound />;
  return (
    <>
      <PageHero title={policy.title} crumb="Policies" />
      <Section>
        <div className="prose">
          {policy.body || (
            <p>
              This policy is being finalised and will be published here shortly. For any question in the meantime, please write to{' '}
              <a href={`mailto:${company.email}`}>{company.email}</a>.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
