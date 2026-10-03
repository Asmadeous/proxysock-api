const coreValues = [
  { title: "Security First", description: "Privacy and security shape how we approach our platform, customer accounts and service access." },
  { title: "Performance Excellence", description: "We focus on dependable connections and practical infrastructure that supports the work you need to do." },
  { title: "Customer Success", description: "Useful guides, clear service information and accessible support help you get from choosing a service to putting it to work." },
  { title: "Innovation", description: "We keep improving our platform and service experience around the ways people build, work and connect online." },
];

export const CoreValues = () => (
  <section id="our-values" className="about-principles about-section" aria-labelledby="about-values-title">
    <div><p className="proxy-eyebrow">What we stand for</p><h2 id="about-values-title">Our core values.<br /><em>Built into how we work.</em></h2><p className="about-principles-intro">The principles behind our technology, our decisions and the experience we want every customer to have.</p></div>
    <div className="about-principle-list">{coreValues.map((value) => <article key={value.title}><h3>{value.title}</h3><p>{value.description}</p></article>)}</div>
  </section>
);
