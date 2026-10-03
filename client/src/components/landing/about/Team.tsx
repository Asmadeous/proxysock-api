import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const teamMembers = [
  {
    name: "Engineering Team",
    role: "Infrastructure & Development",
    description:
      "Our skilled engineers ensure robust, scalable infrastructure and cutting-edge solutions.",
    initials: "ET",
  },
  {
    name: "Security Team",
    role: "Cybersecurity & Privacy",
    description:
      "Dedicated professionals focused on maintaining the highest security standards.",
    initials: "ST",
  },
  {
    name: "Support Team",
    role: "Customer Success",
    description:
      "24/7 support specialists committed to providing exceptional customer service.",
    initials: "ST",
  },
  {
    name: "Operations Team",
    role: "Network Management",
    description:
      "Experts managing our global network infrastructure for optimal performance.",
    initials: "OT",
  },
];

export const Team = () => (
  <section id="our-team" className="about-section about-team" aria-labelledby="about-team-title">
    <div className="about-section-heading">
      <div><p className="proxy-eyebrow">The people behind ProxySock</p><h2 id="about-team-title">Our team.<br /><em>Your connections, supported.</em></h2></div>
      <p>Engineering, security, support and operations. Different responsibilities, working toward a better experience for you.</p>
    </div>
    <div className="about-team-grid">
      {teamMembers.map((member) => (
        <article key={member.name}>
          <div className="about-team-monogram" aria-hidden="true">{member.initials}</div>
          <h3>{member.name}</h3><span>{member.role}</span><p>{member.description}</p>
        </article>
      ))}
    </div>
    <Link to="/contact" className="proxy-text-link">Get in touch with our team <ArrowUpRight size={16} aria-hidden="true" /></Link>
  </section>
);
