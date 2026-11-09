import { Link } from "react-router-dom";
import LegalLayout from "@/components/landing/legal/LegalLayout";
export default function CookiePolicy() {
 return <LegalLayout title="Cookie Policy" path="/cookie-policy" updated={new Date().toLocaleDateString()} sections={[{"id":"policy-section-1","label":"Introduction"},{"id":"policy-section-2","label":"What Are Cookies?"},{"id":"policy-section-3","label":"How We Use Cookies"},{"id":"policy-section-4","label":"Third-Party Cookies & Services"},{"id":"policy-section-5","label":"Reddit Ads Conversion Tracking"},{"id":"policy-section-6","label":"Managing Your Cookie Preferences"},{"id":"policy-section-7","label":"Data Storage and Retention"},{"id":"policy-section-8","label":"Your Rights and Choices"},{"id":"policy-section-9","label":"Changes to This Policy"},{"id":"policy-section-10","label":"Contact Us"}]}>
<section id="policy-section-1" className="legal-section">
            <div>
              <h2>
                Introduction
              </h2>
            </div>
            <p>
              Welcome to ProxySock! This Cookie Policy explains how we use
              cookies and similar technologies to enhance your experience,
              analyze usage, and deliver relevant advertising. By using our
              site, you agree to the use of cookies as described in this policy.
            </p>
            <div>
              <span>
                Effective Date: {new Date().toLocaleDateString()}
              </span>
            </div>
          </section>
<section id="policy-section-2" className="legal-section">
            <div>
              <h2>
                What Are Cookies?
              </h2>
            </div>
            <p>
              Cookies are small text files that are stored on your device
              (computer, tablet, or mobile) when you visit a website. They help
              us remember your preferences, analyze site traffic, improve your
              experience, and measure the effectiveness of our advertising
              campaigns.
            </p>
          </section>
<section id="policy-section-3" className="legal-section">
            <div>
              <h2>
                How We Use Cookies
              </h2>
            </div>
            <p>
              We use cookies for the following purposes:
            </p>
            <div className="legal-grid">
              <div>
                <div>
                  <div>
                    <h3>
                      Essential Cookies
                    </h3>
                    <p>
                      These are necessary for the website to function properly.
                      They enable core features like page navigation, access to
                      secure areas, user authentication, and maintaining your
                      shopping cart.
                    </p>
                    <div>
                      <span>
                        Cannot be disabled - Required for site functionality
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div>
                    <h3>
                      Analytics Cookies
                    </h3>
                    <p>
                      We use Google Analytics and our own analytics to
                      understand how visitors interact with our site. This helps
                      us improve the design, functionality, and user experience.
                    </p>
                    <div>
                      <span>
                        Services: Google Analytics, Internal Analytics
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div>
                    <h3>
                      Preference Cookies
                    </h3>
                    <p>
                      These remember your preferences (language, theme, region)
                      and settings to personalize your experience on future
                      visits.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div>
                    <h3>
                      Advertising & Marketing Cookies
                    </h3>
                    <p>
                      These cookies are used to deliver relevant advertisements,
                      measure campaign effectiveness, and track conversions from
                      our advertising partners.
                    </p>
                    <div>
                      <h4>
                        Reddit Ads Pixel
                      </h4>
                      <p>
                        Tracks conversions, measures ad performance, and enables
                        retargeting for users who visited from Reddit ads.
                      </p>
                      <div>
                        <span>
                          Page views
                        </span>
                        <span>
                          Purchases
                        </span>
                        <span>
                          Sign-ups
                        </span>
                        <span>
                          Attribution data
                        </span>
                      </div>
                    </div>
                    <div>
                      <span>
                        Can be disabled through browser settings
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
<section id="policy-section-4" className="legal-section">
            <div>
              <h2>
                Third-Party Cookies & Services
              </h2>
            </div>
            <p>
              We work with trusted third-party services that may set their own
              cookies. These services help us provide better functionality and
              measure our marketing effectiveness.
            </p>
            <div className="legal-grid">
              <div>
                <div>
                  <h3>
                    Google Analytics
                  </h3>
                </div>
                <p>
                  Website analytics and user behavior tracking
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Privacy Policy →
                </a>
              </div>
              <div>
                <div>
                  <h3>Reddit Ads</h3>
                </div>
                <p>
                  Conversion tracking and advertising measurement
                </p>
                <a
                  href="https://www.reddit.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Privacy Policy →
                </a>
              </div>
              <div>
                <div>
                  <h3>
                    Live Support Chat
                  </h3>
                </div>
                <p>
                  Customer support chat functionality
                </p>
                <Link
                  to="/contact"
                >
                  Contact Us →
                </Link>
              </div>
              <div>
                <div>
                  <h3>
                    Payment Processors
                  </h3>
                </div>
                <p>
                  Secure payment processing and fraud prevention
                </p>
                <div>
                  <span>
                  </span>
                  <span>
                    PayPal
                  </span>
                  <span>
                    Coinbase
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div>
                <div>
                  <span>!</span>
                </div>
                <p>
                  <strong>Important:</strong> These third-party cookies are
                  governed by their respective privacy policies. We do not have
                  control over these cookies, but we carefully select partners
                  who meet our privacy standards.
                </p>
              </div>
            </div>
          </section>
<section id="policy-section-5" className="legal-section">
            <div>
              <h2>
                Reddit Ads Conversion Tracking
              </h2>
            </div>
            <p>
              We use Reddit's advertising platform to reach potential customers.
              When you visit our site from a Reddit ad, Reddit's conversion
              pixel helps us understand which ads are most effective.
            </p>
            <div className="legal-grid">
              <div>
                <h3>
                  What Reddit Tracking Collects:
                </h3>
                <ul>
                  <li>
                    <span></span>
                    Page visits and user navigation patterns
                  </li>
                  <li>
                    <span></span>
                    Purchase completions and transaction details
                  </li>
                  <li>
                    <span></span>
                    Account sign-ups and registration events
                  </li>
                  <li>
                    <span></span>
                    Contact form submissions and support interactions
                  </li>
                  <li>
                    <span></span>
                    Device information (screen size, browser type)
                  </li>
                  <li>
                    <span></span>
                    Attribution data (how you arrived at our site)
                  </li>
                </ul>
              </div>
              <div>
                <h3>
                  How This Benefits You:
                </h3>
                <ul>
                  <li>
                    <span></span>
                    More relevant ads for services you're interested in
                  </li>
                  <li>
                    <span></span>
                    Optimized website for better user experience
                  </li>
                  <li>
                    <span></span>
                    Better pricing through efficient marketing
                  </li>
                  <li>
                    <span></span>
                    More accurate service recommendations
                  </li>
                </ul>
              </div>
            </div>
          </section>
<section id="policy-section-6" className="legal-section">
            <div>
              <h2>
                Managing Your Cookie Preferences
              </h2>
            </div>
            <div>
              <div>
                <h3>
                  Browser Settings
                </h3>
                <p>
                  You can manage or disable cookies through your browser
                  settings:
                </p>
                <div className="legal-grid">
                  <div>
                    <div>
                      <div>
                        <span>
                          C
                        </span>
                      </div>
                      <h4>
                        Chrome
                      </h4>
                    </div>
                    <p>
                      Settings → Privacy and Security → Cookies and other site
                      data
                    </p>
                  </div>
                  <div>
                    <div>
                      <div>
                        <span>
                          F
                        </span>
                      </div>
                      <h4>
                        Firefox
                      </h4>
                    </div>
                    <p>
                      Options → Privacy & Security → Cookies and Site Data
                    </p>
                  </div>
                  <div>
                    <div>
                      <div>
                        <span>
                          S
                        </span>
                      </div>
                      <h4>
                        Safari
                      </h4>
                    </div>
                    <p>
                      Preferences → Privacy → Manage Website Data
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3>
                  Advertising Opt-Out Options
                </h3>
                <div>
                  <div>
                    <div>
                      <div>
                        <p>
                          Reddit Ads
                        </p>
                        <p>
                          Visit Reddit's{" "}
                          <a
                            href="https://www.reddit.com/settings/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            privacy settings
                          </a>{" "}
                          to opt-out of personalized advertising
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <div>
                        <p>
                          Google Analytics
                        </p>
                        <p>
                          Use the{" "}
                          <a
                            href="https://tools.google.com/dlpage/gaoptout"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Google Analytics Opt-out Browser Add-on
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <div>
                        <p>
                          Industry Opt-out
                        </p>
                        <p>
                          Visit{" "}
                          <a
                            href="https://www.aboutads.info/choices/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            AboutAds.info
                          </a>{" "}
                          for comprehensive advertising opt-out options
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div>
                    <span>!</span>
                  </div>
                  <p>
                    <strong>Note:</strong> Disabling cookies may affect the
                    functionality of our website. Essential cookies cannot be
                    disabled as they are required for core site features like
                    authentication and security.
                  </p>
                </div>
              </div>
            </div>
          </section>
<section id="policy-section-7" className="legal-section">
            <div>
              <h2>
                Data Storage and Retention
              </h2>
            </div>
            <div className="legal-grid">
              <div>
                <h3>
                  Cookie Retention Periods
                </h3>
                <div>
                  <div>
                    <span>
                      Session Cookies
                    </span>
                    <span>
                      Deleted on close
                    </span>
                  </div>
                  <div>
                    <span>
                      Preference Cookies
                    </span>
                    <span>
                      Up to 1 year
                    </span>
                  </div>
                  <div>
                    <span>
                      Analytics Cookies
                    </span>
                    <span>
                      Up to 26 months
                    </span>
                  </div>
                  <div>
                    <span>
                      Advertising Cookies
                    </span>
                    <span>
                      Up to 90 days
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3>
                  Data Processing Location
                </h3>
                <div>
                  <div>
                    <p>
                      Cookie data may be processed in the United States and
                      other countries where our service providers operate. We
                      ensure adequate data protection measures are in place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
<section id="policy-section-8" className="legal-section">
            <div>
              <h2>
                Your Rights and Choices
              </h2>
            </div>
            <div className="legal-grid">
              <div>
                <h3>
                  You Have the Right To:
                </h3>
                <ul>
                  <li>
                    <span></span>
                    Access information about cookies we use
                  </li>
                  <li>
                    <span></span>
                    Opt-out of non-essential cookies
                  </li>
                  <li>
                    <span></span>
                    Request deletion of your data
                  </li>
                  <li>
                    <span></span>
                    Withdraw consent at any time
                  </li>
                  <li>
                    <span></span>
                    File a complaint with data protection authorities
                  </li>
                </ul>
              </div>
              <div>
                <h3>
                  Contact Us About Cookies:
                </h3>
                <div>
                  <div>
                    <div>
                      <span>@</span>
                    </div>
                    <div>
                      <p>
                        Email
                      </p>
                      <a
                        href="mailto:privacy@proxysock.com"
                      >
                        privacy@proxysock.com
                      </a>
                    </div>
                  </div>
                  <div>
                    <div>
                      <p>
                        Support
                      </p>
                      <Link
                        to="/contact"
                      >
                        Contact Form
                      </Link>
                    </div>
                  </div>
                  <div>
                    <div>
                      <p>
                        Live Chat
                      </p>
                      <span>
                        Available 24/7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
<section id="policy-section-9" className="legal-section">
            <div>
              <h2>
                Changes to This Policy
              </h2>
            </div>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in our practices, legal requirements, or service
              offerings. When we make significant changes, we will:
            </p>
            <div>
              <div>
                <span></span>
                <span>
                  Update the "Last Updated" date at the top of this policy
                </span>
              </div>
              <div>
                <span></span>
                <span>
                  Notify active users via email for major changes
                </span>
              </div>
              <div>
                <span></span>
                <span>
                  Display a notification banner on our website
                </span>
              </div>
              <div>
                <span></span>
                <span>
                  Continue to honor your existing privacy preferences
                </span>
              </div>
            </div>
            <div>
              <p>
                We encourage you to review this page periodically for the latest
                information.
              </p>
            </div>
          </section>
<section id="policy-section-10" className="legal-section">
            <div>
              <h2>Contact Us</h2>
            </div>
            <p>
              If you have any questions about our use of cookies, this policy,
              or your privacy rights, please don't hesitate to reach out:
            </p>
            <div className="legal-grid">
              <div>
                <div>
                  <span>📧</span>
                </div>
                <div>
                  <p>
                    Privacy Team
                  </p>
                  <a
                    href="mailto:privacy@proxysock.com"
                  >
                    privacy@proxysock.com
                  </a>
                </div>
              </div>
              <div>
                <div>
                  <span>💬</span>
                </div>
                <div>
                  <p>
                    General Support
                  </p>
                  <Link
                    to="/contact"
                  >
                    Contact us here
                  </Link>
                </div>
              </div>
              <div>
                <div>
                  <span>🕒</span>
                </div>
                <div>
                  <p>
                    Response Time
                  </p>
                  <span>
                    Within 48 hours
                  </span>
                </div>
              </div>
            </div>
          </section>
 </LegalLayout>;
}
