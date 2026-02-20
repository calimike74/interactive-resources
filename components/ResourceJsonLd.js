export function ResourceJsonLd({ resource }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: resource.title,
    description: resource.description,
    educationalLevel: 'A-Level',
    learningResourceType: resource.type,
    teaches: resource.learningObjectives,
    keywords: resource.keywords?.join(', '),
    provider: {
      '@type': 'Organization',
      name: 'A-Level Music Technology Interactive Resources',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
