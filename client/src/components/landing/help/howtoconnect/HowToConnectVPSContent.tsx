import { motion } from "framer-motion";
import {
  CodeBracketIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ServerIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { CodeBlock } from "./CodeBlock";

export const HowToConnectVPSContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl sm:text-3xl font-manrope-bold text-foreground mb-4 flex items-center">
          <ServerIcon className="h-8 w-8 text-primary mr-4" />
          Virtual Private Server (VPS) Management
        </h2>
        <p className="text-muted-foreground text-lg">
          Complete guide to accessing and managing your Linux/Windows VPS
          servers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SSH Connection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <CodeBracketIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                SSH Connection
              </h3>
              <p className="text-muted-foreground text-sm">
                Linux VPS terminal access
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <CodeBracketIcon className="h-5 w-5 text-green-500 mr-2" />
                Command Line (Mac/Linux)
              </h4>
              <CodeBlock
                code={`# Basic SSH connection
ssh username@your_vps_ip

# SSH with custom port
ssh -p 2222 username@your_vps_ip

# SSH with private key
ssh -i /path/to/private_key username@your_vps_ip`}
                language="bash"
                title="SSH Connection Commands"
              />
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
              <h4 className="font-manrope-semibold text-foreground mb-3">
                Windows SSH Clients:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong className="text-foreground">PuTTY</strong> - Free, lightweight SSH client
                </li>
                <li>
                  • <strong className="text-foreground">Windows Terminal</strong> - Built-in SSH support
                </li>
                <li>
                  • <strong className="text-foreground">MobaXterm</strong> - Enhanced terminal with X11
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* File Transfer */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <DocumentTextIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                File Transfer
              </h3>
              <p className="text-muted-foreground text-sm">
                SCP and SFTP file management
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4">
                SCP (Secure Copy):
              </h4>
              <CodeBlock
                code={`# Upload file to VPS
scp local_file.txt username@vps_ip:/remote/path/

# Download file from VPS
scp username@vps_ip:/remote/file.txt /local/path/

# Upload directory recursively
scp -r local_directory/ username@vps_ip:/remote/path/`}
                language="bash"
                title="SCP File Transfer"
              />
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6">
              <h4 className="font-manrope-semibold text-foreground mb-3">
                SFTP Clients:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong className="text-foreground">FileZilla</strong> - Free FTP/SFTP client
                </li>
                <li>
                  • <strong className="text-foreground">WinSCP</strong> - Windows SFTP/SCP client
                </li>
                <li>
                  • <strong className="text-foreground">Cyberduck</strong> - Mac/Windows FTP client
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Server Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 lg:col-span-2"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <Cog6ToothIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                Server Management & Control Panels
              </h3>
              <p className="text-muted-foreground text-sm">
                Essential commands and web-based management
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Essential Commands */}
            <div className="space-y-6">
              <div className="bg-card/50 rounded-xl p-6 border border-border">
                <h4 className="font-manrope-semibold text-foreground mb-4">
                  Essential Commands:
                </h4>
                <CodeBlock
                  code={`# System information
uname -a
df -h
free -h
top

# Package management (Ubuntu/Debian)
sudo apt update
sudo apt upgrade
sudo apt install package_name

# Service management
sudo systemctl start service_name
sudo systemctl stop service_name
sudo systemctl restart service_name
sudo systemctl status service_name`}
                  language="bash"
                  title="Server Management Commands"
                />
              </div>
            </div>

            {/* Control Panels */}
            <div className="space-y-6">
              <div className="bg-card/50 rounded-xl p-6 border border-border">
                <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-purple-500 mr-2" />
                  Web Control Panels
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <strong className="text-foreground">cPanel/WHM</strong> - Industry standard
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <strong className="text-foreground">Plesk</strong> - User-friendly management
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <strong className="text-foreground">Webmin</strong> - Free web administration
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <strong className="text-foreground">ISPConfig</strong> - Open source hosting panel
                  </li>
                </ul>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                <h5 className="font-manrope-semibold text-foreground mb-2">
                  Webmin Installation:
                </h5>
                <CodeBlock
                  code={`wget -qO - http://www.webmin.com/jcameron-key.asc | sudo apt-key add -
echo "deb http://download.webmin.com/download/repository sarge contrib" | sudo tee /etc/apt/sources.list.d/webmin.list
sudo apt update && sudo apt install webmin

# Access: https://your_vps_ip:10000`}
                  language="bash"
                  title="Webmin Setup"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
