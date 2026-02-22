import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";

interface SocialContactSectionProps {
  handleSocialClick: (platform: string) => void;
}

export const SocialContactSection = ({
  handleSocialClick,
}: SocialContactSectionProps) => {
  return (
    <div className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-2xl font-manrope-bold font-bold text-foreground mb-8">
            Connect With Us
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://x.com/cybertwts"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick("twitter")}
              className="flex items-center px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1DA1F2]/90 transition-all duration-200 min-w-[200px] justify-center font-manrope-semibold"
            >
              <FontAwesomeIcon icon={faTwitter} className="h-5 w-5 mr-3" />
              Follow on Twitter
            </a>
            <a
              href="https://t.me/Proxy_sock5"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick("telegram")}
              className="flex items-center px-6 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0088cc]/90 transition-all duration-200 min-w-[200px] justify-center font-manrope-semibold"
            >
              <FontAwesomeIcon icon={faTelegram} className="h-5 w-5 mr-3" />
              Join Telegram
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
