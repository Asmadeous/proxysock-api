import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";
import 'https://deno.land/x/dotenv@v3.2.0/load.ts';
/**PROVISIONING WORKER EDGE FUNCTION - UPDATED

Key Changes:

Canada proxy bypass: Skip proxy ordering for Canadian customers

Email templates use Guacamole URLs instead of direct ports

Credentials: username = hostname, password = instance password

No port numbers in customer emails
 */
const CONFIG = {
  PUBLIC_IP: '155.94.236.209',
  RDP_DOMAIN: 'rdp.proxysock.com',
  VPS_DOMAIN: 'ssh.proxysock.com',
  TIMEOUT_MS: 300000,
  RETRY_DELAY_MS: 5 * 60 * 1000,
  PASSWORD_LENGTH: 16,
  ORDER_PROCESSING_DELAY_MS: 60 * 1000,
  VM_ID_RANGES: {
    RDP: {
      min: 10000,
      max: 19999
    },
    VPS: {
      min: 20000,
      max: 29999
    }
  },
  PROXY: {
    DEFAULT_PERIOD: 1,
    DEFAULT_PROTOCOL: 'http',
    DEFAULT_COUNTRY: 'us',
    FALLBACK_HIERARCHY: [
      {
        type: 'static-residential',
        productId: '105',
        endpoint: 'products/static-residential'
      },
      {
        type: 'premium-isp',
        productId: '84',
        endpoint: 'products/premium-isp'
      },
      {
        type: 'isp',
        productId: '57',
        endpoint: 'products/isp'
      },
      {
        type: 'datacenter',
        productId: '10',
        endpoint: 'products/datacenter'
      }
    ],
    VPS_ONLY_HIERARCHY: [
      {
        type: 'datacenter',
        productId: '10',
        endpoint: 'products/datacenter'
      }
    ]
  }
};
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANSIBLE_SERVER_URL',
  'ANSIBLE_API_KEY',
  'CALLBACK_URL',
  'PROXY_SUPPORT_EMAIL',
  'MY_PROXY_API_CLIENT_NAME',
  'MY_PROXY_API_CLIENT_SECRET',
  'API_USER_ID'
];
const TEMPLATE_MAPPING = {
  'windows-server-2022-rdp': 'windows-rdp',
  'ubuntu-desktop-rdp': 'ubuntu-desktop-rdp',
  'fedora-desktop-rdp': 'fedora-desktop-rdp',
  'ubuntu-server-vps': 'ubuntu-server-vps',
  'debian-server-vps': 'debian-server-vps',
  'rocky-server-vps': 'rocky-server-vps',
  'alma-server-vps': 'alma-server-vps',
  'windows-server-2022-vps': 'windows-server-2022'
};
const VALID_TEMPLATES = Object.keys(TEMPLATE_MAPPING);
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter((envVar) => !Deno.env.get(envVar));
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
validateEnvironment();
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const smtp = {
  host: Deno.env.get("SMTP_HOST"),
  port: Deno.env.get("SMTP_PORT"),
  username: Deno.env.get("SMTP_USERNAME"),
  password: Deno.env.get("SMTP_PASSWORD"),
  fromEmail: Deno.env.get("SMTP_FROM_EMAIL")
};
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  for(let i = 4; i < CONFIG.PASSWORD_LENGTH; i++){
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
function getVMTypeFromId(vmId, vmInfo = {}) {
  try {
    const id = parseInt(vmId, 10);
    if (isNaN(id)) {
      if (vmInfo?.vm_type && [
        'rdp',
        'vps'
      ].includes(vmInfo.vm_type.toLowerCase())) {
        return vmInfo.vm_type.toLowerCase();
      }
      throw new Error(`Invalid VM ID: ${vmId}`);
    }
    if (id >= CONFIG.VM_ID_RANGES.RDP.min && id <= CONFIG.VM_ID_RANGES.RDP.max) {
      return 'rdp';
    }
    if (id >= CONFIG.VM_ID_RANGES.VPS.min && id <= CONFIG.VM_ID_RANGES.VPS.max) {
      return 'vps';
    }
    if (vmInfo?.vm_type && [
      'rdp',
      'vps'
    ].includes(vmInfo.vm_type.toLowerCase())) {
      return vmInfo.vm_type.toLowerCase();
    }
    throw new Error(`VM ID ${vmId} out of valid ranges and no valid vm_type in vm_info`);
  } catch (error) {
    logEvent({
      component: 'callback',
      action: 'vm_type_error',
      level: 'error',
      message: `Failed to determine VM type: ${error.message}`,
      metadata: {
        vmId,
        vmInfo
      }
    });
    return null;
  }
}
function getTableNames(vmType) {
  return {
    instance: `${vmType}_instances`,
    order: `${vmType}_orders`
  };
}
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    }
  });
}
async function logEvent(entry) {
  const logData = {
    component: entry.component,
    action: entry.action,
    level: entry.level,
    message: entry.message,
    metadata: entry.metadata || {},
    user_id: entry.user_id || null,
    vm_id: entry.vm_id || null,
    order_id: entry.order_id || null,
    created_at: new Date().toISOString()
  };
  console.log(`[${entry.level.toUpperCase()}] ${entry.component}:${entry.action} - ${entry.message}`, entry.metadata);
  try {
    await supabase.from('system_logs').insert(logData);
  } catch (error) {
    console.error('Failed to log event to database:', error);
  }
}
class MyProxyAPIClient {
  constructor(){
    this.baseUrl = 'https://reseller.myproxyapi.com/api/v1';
    this.clientName = Deno.env.get('MY_PROXY_API_CLIENT_NAME');
    this.clientSecret = Deno.env.get('MY_PROXY_API_CLIENT_SECRET');
    this.userId = Deno.env.get('API_USER_ID');
    if (!this.clientName || !this.clientSecret || !this.userId) {
      throw new Error('MyProxyAPI credentials not configured. Required: MY_PROXY_API_CLIENT_NAME, MY_PROXY_API_CLIENT_SECRET, API_USER_ID');
    }
  }
  async getBearerToken() {
    await logEvent({
      component: 'proxy_api',
      action: 'requesting_fresh_token',
      level: 'debug',
      message: 'Requesting fresh Bearer token from MyProxyAPI',
      metadata: {}
    });
    const response = await fetch(`${this.baseUrl}/getToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.clientName,
        secret: this.clientSecret
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Token fetch failed: ${result.message || 'Unknown error'}`);
    }
    const token = result.data?.token;
    if (!token) {
      throw new Error(`Token not found in response. Response structure: ${JSON.stringify(Object.keys(result))}`);
    }
    await logEvent({
      component: 'proxy_api',
      action: 'token_fetched',
      level: 'info',
      message: 'Successfully fetched fresh MyProxyAPI Bearer token',
      metadata: {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...'
      }
    });
    return token;
  }
  async checkCountryAvailability(proxyType, country) {
    try {
      if (!country) {
        await logEvent({
          component: 'proxy_api',
          action: 'invalid_country',
          level: 'warn',
          message: `Country parameter is null or undefined for ${proxyType.type}`,
          metadata: {
            proxyType: proxyType.type,
            country
          }
        });
        return false;
      }
      const countryUpper = country.toUpperCase();
      const endpoint = proxyType.endpoint.startsWith('/') ? proxyType.endpoint : `/${proxyType.endpoint}`;
      const response = await this.makeRequest(endpoint);
      if (!response.data || !Array.isArray(response.data) || !response.data[0]?.isp) {
        await logEvent({
          component: 'proxy_api',
          action: 'invalid_response_format',
          level: 'warn',
          message: `Invalid response format for ${proxyType.type}`,
          metadata: {
            proxyType: proxyType.type,
            country,
            responseKeys: response ? Object.keys(response) : []
          }
        });
        return false;
      }
      const availableCountries = response.data[0].isp.flatMap((isp) => Object.keys(isp.locations)).map((c) => c.toUpperCase());
      const isAvailable = availableCountries.includes(countryUpper);
      await logEvent({
        component: 'proxy_api',
        action: 'availability_checked',
        level: 'info',
        message: `Country availability checked for ${proxyType.type}`,
        metadata: {
          proxyType: proxyType.type,
          country,
          available: isAvailable,
          availableCountries
        }
      });
      return isAvailable;
    } catch (error) {
      await logEvent({
        component: 'proxy_api',
        action: 'availability_check_failed',
        level: 'warn',
        message: `Failed to check country availability for ${proxyType.type}: ${error.message}`,
        metadata: {
          proxyType: proxyType.type,
          country,
          error: error.message
        }
      });
      return false;
    }
  }
  async getCityLocationId(proxyType, country) {
    try {
      const endpoint = proxyType.endpoint.startsWith('/') ? proxyType.endpoint : `/${proxyType.endpoint}`;
      const response = await this.makeRequest(endpoint);
      if (!response.data || !Array.isArray(response.data) || !response.data[0]?.isp) {
        throw new Error(`Invalid response format for ${proxyType.type}`);
      }
      const countryUpper = country.toUpperCase();
      const cities = response.data[0].isp.flatMap((isp) => isp.locations[countryUpper]?.cities || []).filter((city) => city.ips_available > 0);
      if (!cities.length) {
        throw new Error(`No cities with available IPs found for ${countryUpper} in ${proxyType.type}`);
      }
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      return randomCity.id;
    } catch (error) {
      await logEvent({
        component: 'proxy_api',
        action: 'city_fetch_failed',
        level: 'error',
        message: `Failed to fetch city location ID for ${proxyType.type} in ${country}: ${error.message}`,
        metadata: {
          proxyType: proxyType.type,
          country,
          error: error.message
        }
      });
      throw error;
    }
  }
  async placeOrder(jobId, productId, period, protocol, locationId, whitelistedIp) {
    const body = {
      user_id: parseInt(this.userId),
      product: parseInt(productId),
      period: parseInt(period),
      protocol,
      locations: locationId.toString(),
      whitelist_ip: whitelistedIp
    };
    const response = await this.makeRequest('/products/place-order', 'POST', body);
    await logEvent({
      component: 'proxy_api',
      action: 'order_placed',
      level: 'info',
      message: `Successfully placed order for job ${jobId}`,
      metadata: {
        jobId,
        productId,
        locationId,
        whitelistedIp
      }
    });
    return response.data;
  }
  async fetchOrderDetails(orderId) {
    await logEvent({
      component: 'proxy_api',
      action: 'waiting_for_order_processing',
      level: 'info',
      message: `Waiting ${CONFIG.ORDER_PROCESSING_DELAY_MS / 1000} seconds for order ${orderId} to be processed by MyProxyAPI`,
      metadata: {
        orderId,
        delayMs: CONFIG.ORDER_PROCESSING_DELAY_MS
      }
    });
    await new Promise((resolve) => setTimeout(resolve, CONFIG.ORDER_PROCESSING_DELAY_MS));
    const response = await this.makeRequest(`/orders/view/${orderId}`);
    await logEvent({
      component: 'proxy_api',
      action: 'order_details_fetched',
      level: 'info',
      message: `Successfully fetched order details for ${orderId}`,
      metadata: {
        orderId,
        hasData: !!response.data,
        orderStatus: response.data?.[0]?.order?.subscription_status || 'unknown'
      }
    });
    return response.data[0];
  }
  async makeRequest(endpoint, method = 'GET', body = null) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const token = await this.getBearerToken();
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    await logEvent({
      component: 'proxy_api',
      action: 'making_request',
      level: 'debug',
      message: `Making ${method} request to ${normalizedEndpoint}`,
      metadata: {
        url,
        method,
        hasBody: !!body,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
      }
    });
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      await logEvent({
        component: 'proxy_api',
        action: 'parse_error',
        level: 'error',
        message: 'Failed to parse API response',
        metadata: {
          endpoint: normalizedEndpoint,
          responseStatus: response.status,
          responseText: responseText.substring(0, 500)
        }
      });
      throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 100)}`);
    }
    if (!response.ok) {
      await logEvent({
        component: 'proxy_api',
        action: 'request_failed',
        level: 'error',
        message: `API request failed with status ${response.status}`,
        metadata: {
          endpoint: normalizedEndpoint,
          status: response.status,
          errorMessage: data.message || data.error,
          responseData: data
        }
      });
      throw new Error(`API request failed: ${data.message || data.error || response.statusText || 'Unknown error'}`);
    }
    return data;
  }
}
class EmailService {
  constructor(){
    this.isConfigured = smtp.host && smtp.port && smtp.username && smtp.password && smtp.fromEmail;
  }
  async send(userId, to, subject, html) {
    if (!this.isConfigured) {
      await this.logSkipped(userId, to, subject, html);
      return;
    }
    const client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: parseInt(smtp.port, 10),
        tls: smtp.port === "465",
        auth: {
          username: smtp.username,
          password: smtp.password
        }
      }
    });
    try {
      await client.send({
        from: smtp.fromEmail,
        to,
        subject,
        content: "text/html",
        html
      });
      await this.logSuccess(userId, to, subject, html);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      await this.logFailure(userId, to, subject, html, error.message);
      console.error("Email send error:", error);
    } finally{
      try {
        await client.close();
      } catch (closeErr) {
        console.error("Error closing SMTP client:", closeErr);
      }
    }
  }
  async logSuccess(userId, to, subject, content) {
    await supabase.from("emails").insert({
      user_id: userId,
      to,
      subject,
      content,
      status: "sent",
      created_at: new Date().toISOString()
    });
  }
  async logFailure(userId, to, subject, content, errorMessage) {
    await supabase.from("emails").insert({
      user_id: userId,
      to,
      subject,
      content,
      status: "failed",
      error_message: errorMessage,
      created_at: new Date().toISOString()
    });
  }
  async logSkipped(userId, to, subject, content) {
    console.warn("SMTP not configured, skipping email send");
    await supabase.from("emails").insert({
      user_id: userId,
      to,
      subject,
      content,
      status: "skipped",
      error_message: "SMTP not configured",
      created_at: new Date().toISOString()
    });
  }
}
class EmailTemplates {
  static generateRDPReadyEmail(instance, order, callbackData) {
    const hostname = instance.hostname || `vm-${instance.vm_id}`;
    const connectionString = 'rdp.proxysock.com/guacamole';
    const { isResidential, isUnmanaged, hasProxyConfig, proxyCredentials } = this.getEmailData(instance, order, callbackData);
    const isCanada = order.country && (order.country.toLowerCase() === 'ca' || order.country.toLowerCase() === 'canada');
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
  Your RDP Instance is Ready!
</h2>

  <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
    <h3 style="margin-top: 0; color: #721c24;"> RDP Successfully Provisioned</h3>
    <p style="margin: 5px 0;"><strong>Hostname:</strong> ${hostname}</p>
    <p style="margin: 5px 0;"><strong>Operating System:</strong> ${instance.os_template}</p>
    <p style="margin: 5px 0;"><strong>Service Type:</strong> ${order.service_type}</p>
    <p style="margin: 5px 0;"><strong>CPU:</strong> ${instance.cpu_cores} vCPU</p>
    <p style="margin: 5px 0;"><strong>RAM:</strong> ${instance.ram_gb} GB</p>
    <p style="margin: 5px 0;"><strong>Storage:</strong> ${instance.storage_gb} GB SSD</p>
    <p style="margin: 5px 0;"><strong>Management Type:</strong> ${order.management_type}</p>
    <p style="margin: 5px 0;"><strong>Location:</strong> ${order.country ? order.country.toUpperCase() : 'US'}</p>
    ${isCanada ? `<p style="margin: 5px 0; color: #28a745; font-weight: bold;"> Location: Canada (Local Direct Connection - No Proxy)</p>` : ''}
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #007cba;"> Guacamole Connection Details</h3>
    
<div style="background-color: #e9ecef; padding: 10px; border-radius: 3px; margin: 10px 0;">
  <p style="margin: 5px 0;">
    <strong>Access URL:</strong> 
    <a href="https://${connectionString}" style="color: #0066cc; text-decoration: none;">
      https://${connectionString}
    </a>
  </p>
  
  <p style="margin: 5px 0;"><strong>Username:</strong> ${hostname}</p>
  <p style="margin: 5px 0;"><strong>Password:</strong> ${instance.rdp_password || callbackData.credentials?.rdp_password || 'N/A'}</p>
  
  <p style="margin: 10px 0 5px 0; font-size: 13px; color: #666;">
    <em>Simply log in with your credentials above. No port number needed - Guacamole handles everything!</em>
  </p>
  
  ${isCanada ? `
    <div style="margin: 10px 0 0 0; padding: 10px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 3px;">
      <p style="margin: 0; font-size: 13px; color: #155724;">
        <strong> Fast Direct Connection:</strong> Your instance is hosted in Canada with direct local access. 
        You'll experience optimal speed and performance with no proxy overhead!
      </p>
    </div>
  ` : ''}
</div>  </div>

  ${this.generateProxySection(isResidential, hasProxyConfig, isUnmanaged, callbackData, order, proxyCredentials)}  <div style="text-align: center; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">Order ID: ${order.id} | VM ID: ${instance.vm_id}${instance.proxy_order_id ? ` | Proxy Order: ${instance.proxy_order_id}` : ''}</p>
  </div>
</div>`;
  }
  static generateVPSReadyEmail(instance, order, callbackData) {
    const hostname = instance.hostname || `vm-${instance.vm_id}`;
    const connectionString = 'ssh.proxysock.com/guacamole';
    const { isResidential, isUnmanaged, hasProxyConfig, proxyCredentials } = this.getEmailData(instance, order, callbackData);
    const isCanada = order.country && (order.country.toLowerCase() === 'ca' || order.country.toLowerCase() === 'canada');
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
     Your VPS is Ready!
  </h2>
  
  <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin-top: 0; color: #155724;"> VPS Successfully Provisioned</h3>
    <p style="margin: 5px 0;"><strong>Hostname:</strong> ${hostname}</p>
    <p style="margin: 5px 0;"><strong>Operating System:</strong> ${instance.os_template}</p>
    <p style="margin: 5px 0;"><strong>CPU:</strong> ${instance.cpu_cores} vCPU</p>
    <p style="margin: 5px 0;"><strong>RAM:</strong> ${instance.ram_gb} GB</p>
    <p style="margin: 5px 0;"><strong>Storage:</strong> ${instance.storage_gb} GB SSD</p>
    <p style="margin: 5px 0;"><strong>Management Type:</strong> ${order.management_type}</p>
    <p style="margin: 5px 0;"><strong>Location:</strong> ${order.country ? order.country.toUpperCase() : 'US'}</p>
    ${isCanada ? `<p style="margin: 5px 0; color: #28a745; font-weight: bold;"> Location: Canada (Local Direct Connection - No Proxy)</p>` : ''}
    ${isResidential ? `<p style="margin: 5px 0;"><strong>Service Type:</strong> Residential</p>` : ''}
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #007cba;"> Guacamole Connection Details</h3>
    
<div style="background-color: #e9ecef; padding: 10px; border-radius: 3px; font-family: monospace; margin: 10px 0;">
  <p style="margin: 5px 0;">
    <strong>Access URL:</strong> 
    <a href="https://${connectionString}" style="color: #0066cc; text-decoration: none;">
      https://${connectionString}
    </a>
  </p>
  
  <p style="margin: 5px 0;"><strong>Username:</strong> ${hostname}</p>
  <p style="margin: 5px 0;"><strong>Password:</strong> ${instance.root_password || callbackData.credentials?.password || 'N/A'}</p>
  
  <p style="margin: 10px 0 5px 0; font-size: 13px; color: #666;">
    <em>Simply log in with your credentials above. No port number needed - Guacamole handles everything!</em>
  </p>
  
  ${isCanada ? `
    <div style="margin: 10px 0 0 0; padding: 10px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 3px;">
      <p style="margin: 0; font-size: 13px; color: #155724;">
        <strong> Fast Direct Connection:</strong> Your instance is hosted in Canada with direct local access. 
        You'll experience optimal speed and performance with no proxy overhead!
      </p>
    </div>
  ` : ''}
</div>  </div>

  ${this.generateProxySection(isResidential, hasProxyConfig, isUnmanaged, callbackData, order, proxyCredentials)}  <div style="text-align: center; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">Order ID: ${order.id} | VM ID: ${instance.vm_id}${instance.proxy_order_id ? ` | Proxy Order: ${instance.proxy_order_id}` : ''}</p>
  </div>
</div>`;
  }
  static getEmailData(instance, order, callbackData) {
    return {
      isResidential: order.service_type === 'residential',
      isUnmanaged: order.management_type === 'unmanaged',
      hasProxyConfig: callbackData.proxy_config || instance.proxy_order_id,
      proxyCredentials: instance.proxy_credentials || callbackData.proxy_config || {}
    };
  }
  static generateProxySection(isResidential, hasProxyConfig, isUnmanaged, callbackData, order, proxyCredentials) {
    const isCanada = order.country && (order.country.toLowerCase() === 'ca' || order.country.toLowerCase() === 'canada');
    if (!isResidential || isCanada) return '';
    const isProxyPending = callbackData.proxy_config?.status === 'pending';
    if (isProxyPending) {
      return `<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
<h3 style="margin-top: 0; color: #856404;"> Proxy Configuration in Progress</h3>
<div style="background-color: #fefefe; padding: 10px; border-radius: 3px; margin: 10px 0;">
<p style="margin: 5px 0;"><strong>Status:</strong> Configuration in progress</p>
<p style="margin: 5px 0;"><strong>Expected Setup Time:</strong> 15-30 minutes</p>
<p style="margin: 5px 0;"><strong>Location:</strong> ${order.country ? order.country.toUpperCase() : 'US'}</p>
</div>
<p style="margin: 10px 0; font-size: 14px; color: #856404;"><strong>Note:</strong> Your proxy is being configured and will be available shortly. You'll receive updated connection details once setup is complete.</p>
</div>`;
    }
    if (hasProxyConfig || isResidential) {
      if (!isUnmanaged) return '';
      const proxyDetails = `<div style="background-color: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; border-left: 3px solid #ffc107;"><strong> Manual Configuration Required:</strong><br>Your instance includes proxy access, but since you chose "Unmanaged" service, you'll need to configure it manually.</div><div style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace;"><p style="margin: 2px 0;"><strong>Proxy IP:</strong> ${proxyCredentials.proxy_ip || 'Check your proxy dashboard'}</p><p style="margin: 2px 0;"><strong>Proxy Port:</strong> ${proxyCredentials.proxy_port || '8080'}</p><p style="margin: 2px 0;"><strong>Protocol:</strong> ${proxyCredentials.protocol || 'HTTP/HTTPS'}</p><p style="margin: 2px 0;"><strong>Username:</strong> ${proxyCredentials.proxy_username || 'Check your proxy dashboard'}</p><p style="margin: 2px 0;"><strong>Password:</strong> ${proxyCredentials.proxy_password || 'Check your proxy dashboard'}</p><p style="margin: 2px 0;"><strong>Location:</strong> ${order.country ? order.country.toUpperCase() : 'US'}</p></div>`;
      return `<div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;"><h3 style="margin-top: 0; color: #0066cc;"> Proxy Access</h3>${proxyDetails}</div>`;
    }
    return '';
  }
  static generateSupportNotificationEmail(jobId, orderData, vmType, userEmail) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;"> Manual Proxy Configuration Required</h2><div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;"><h3 style="margin-top: 0; color: #721c24;"> Automatic Proxy Setup Failed</h3><p style="margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p><p style="margin: 5px 0;"><strong>Instance ID:</strong> ${jobId}</p><p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderData.order_id}</p><p style="margin: 5px 0;"><strong>VM Type:</strong> ${vmType.toUpperCase()}</p><p style="margin: 5px 0;"><strong>User Email:</strong> ${userEmail}</p><p style="margin: 5px 0;"><strong>Target Country:</strong> ${orderData.country || 'US'}</p><p style="margin: 5px 0;"><strong>Service Type:</strong> Residential</p><p style="margin: 5px 0;"><strong>Management Type:</strong> ${orderData.management_type}</p><p style="margin: 5px 0;"><strong>Server IP (Whitelisted):</strong> ${CONFIG.PUBLIC_IP}</p></div><div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;"><h3 style="margin-top: 0; color: #856404;"> Required Actions</h3><ol style="margin: 10px 0; padding-left: 20px;"><li>Order proxy manually for country: <strong>${orderData.country || 'US'}</strong></li><li>Whitelist server IP: <strong>${CONFIG.PUBLIC_IP}</strong></li><li>Configure proxy on the provisioned ${vmType.toUpperCase()} (Instance: ${jobId})</li><li>Send updated connection details to user</li><li>Update proxy_order_id in database</li></ol></div><div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;"><h3 style="margin-top: 0; color: #0066cc;"> Additional Information</h3><p style="margin: 5px 0;">The VM has been successfully provisioned and user has been notified that proxy configuration is in progress.</p><p style="margin: 5px 0;">User expects proxy to be ready within 15-30 minutes.</p><p style="margin: 5px 0;"><strong>Important:</strong> Ensure server IP ${CONFIG.PUBLIC_IP} is whitelisted in the proxy order.</p><p style="margin: 5px 0;"><strong>Instance Reference:</strong> Use Instance ID ${jobId} for tracking this specific VM.</p></div><div style="text-align: center; margin: 30px 0;"><p style="color: #666; font-size: 14px;">Timestamp: ${new Date().toISOString()}</p></div></div>`;
  }
}
class JobLockService {
  static async acquire(jobId) {
    try {
      const { data: currentJob, error: checkError } = await supabase.from('provisioning_jobs').select('id, status, started_at').eq('id', jobId).single();
      if (checkError || !currentJob) {
        await logEvent({
          component: 'job_lock',
          action: checkError ? 'check_failed' : 'job_not_found',
          level: 'error',
          message: `Job ${jobId} ${checkError ? 'check failed' : 'not found'}`,
          metadata: {
            jobId,
            error: checkError?.message
          }
        });
        return false;
      }
      if (currentJob.status !== 'pending') {
        await logEvent({
          component: 'job_lock',
          action: 'invalid_status',
          level: 'warn',
          message: `Job ${jobId} is in ${currentJob.status} state`,
          metadata: {
            jobId,
            currentStatus: currentJob.status
          }
        });
        return false;
      }
      const { data: updatedJob, error: updateError } = await supabase.from('provisioning_jobs').update({
        status: 'processing',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', jobId).eq('status', 'pending').select('id').single();
      if (updateError || !updatedJob) {
        await logEvent({
          component: 'job_lock',
          action: updateError ? 'update_failed' : 'race_condition',
          level: 'error',
          message: `Failed to acquire lock for job ${jobId}`,
          metadata: {
            jobId,
            error: updateError?.message
          }
        });
        return false;
      }
      await logEvent({
        component: 'job_lock',
        action: 'acquired',
        level: 'info',
        message: `Successfully acquired lock for job ${jobId}`,
        metadata: {
          jobId
        }
      });
      return true;
    } catch (error) {
      await logEvent({
        component: 'job_lock',
        action: 'exception',
        level: 'error',
        message: `Exception acquiring lock for ${jobId}: ${error.message}`,
        metadata: {
          jobId,
          error: error.message
        }
      });
      return false;
    }
  }
}
class ProxyService {
  constructor(){
    this.client = new MyProxyAPIClient();
    this.emailService = new EmailService();
  }
  async setupProxyForOrder(jobId, orderData, userEmail, clientIp, vmType) {
    if (orderData.service_type !== 'residential') return null;
    const targetCountry = orderData.country || CONFIG.PROXY.DEFAULT_COUNTRY;
    if (targetCountry.toLowerCase() === 'ca' || targetCountry.toLowerCase() === 'canada') {
      await logEvent({
        component: 'proxy_service',
        action: 'canada_bypass',
        level: 'info',
        message: `Skipping proxy setup for Canadian customer`,
        metadata: {
          jobId,
          targetCountry
        }
      });
      return null;
    }
    await logEvent({
      component: 'proxy_service',
      action: 'setup_started',
      level: 'info',
      message: `Starting proxy setup for country: ${targetCountry}`,
      metadata: {
        jobId,
        targetCountry,
        serviceType: orderData.service_type,
        clientIp
      }
    });
    const hierarchy = vmType === 'vps' ? CONFIG.PROXY.VPS_ONLY_HIERARCHY : CONFIG.PROXY.FALLBACK_HIERARCHY;
    for (const proxyType of hierarchy){
      try {
        const result = await this.tryProxyType(jobId, orderData, targetCountry, proxyType, CONFIG.PUBLIC_IP);
        if (result.proxyOrderId) {
          await logEvent({
            component: 'proxy_service',
            action: 'setup_success',
            level: 'info',
            message: `Successfully configured ${proxyType.type} proxy for ${targetCountry}`,
            metadata: {
              jobId,
              proxyType: proxyType.type,
              proxyOrderId: result.proxyOrderId,
              whitelistedIp: CONFIG.PUBLIC_IP
            }
          });
          return result;
        }
      } catch (error) {
        await logEvent({
          component: 'proxy_service',
          action: 'type_failed',
          level: 'warn',
          message: `Proxy type ${proxyType.type} failed for ${targetCountry}: ${error.message}`,
          metadata: {
            jobId,
            proxyType: proxyType.type,
            country: targetCountry,
            error: error.message,
            whitelistedIp: CONFIG.PUBLIC_IP
          }
        });
        continue;
      }
    }
    await this.setupManualProxyConfiguration(jobId, orderData, userEmail, CONFIG.PUBLIC_IP, vmType);
    return {
      proxyConfig: {
        enabled: orderData.management_type === 'managed',
        status: 'pending',
        proxy_ip: 'pending',
        proxy_port: '8080',
        proxy_username: 'pending',
        proxy_password: 'pending',
        protocol: CONFIG.PROXY.DEFAULT_PROTOCOL,
        country: targetCountry,
        setup_mode: 'manual'
      },
      proxyOrderId: null
    };
  }
  async tryProxyType(jobId, orderData, country, proxyType, whitelistedIp) {
    const isAvailable = await this.client.checkCountryAvailability(proxyType, country);
    if (!isAvailable) {
      throw new Error(`Country ${country} not available for ${proxyType.type}`);
    }
    const locationId = await this.client.getCityLocationId(proxyType, country);
    const proxyOrder = await this.client.placeOrder(jobId, proxyType.productId, CONFIG.PROXY.DEFAULT_PERIOD, CONFIG.PROXY.DEFAULT_PROTOCOL, locationId, whitelistedIp);
    const orderDetails = await this.client.fetchOrderDetails(proxyOrder.order_id);
    const [proxyIp, proxyPort] = orderDetails.ips[0]?.split(':')?.slice(0, 2) || [
      'pending',
      '8080'
    ];
    const proxyConfig = {
      enabled: orderData.management_type === 'managed',
      status: 'active',
      proxy_ip: proxyIp,
      proxy_port: proxyPort,
      proxy_username: orderDetails.config?.auth_user_pass?.username || 'pending',
      proxy_password: orderDetails.config?.auth_user_pass?.password || 'pending',
      protocol: CONFIG.PROXY.DEFAULT_PROTOCOL,
      country: country,
      setup_mode: orderData.management_type === 'managed' ? 'automated' : 'manual'
    };
    return {
      proxyConfig,
      proxyOrderId: proxyOrder.order_id
    };
  }
  async setupManualProxyConfiguration(jobId, orderData, userEmail, whitelistedIp, vmType) {
    const supportEmailContent = EmailTemplates.generateSupportNotificationEmail(jobId, orderData, vmType, userEmail);
    await this.emailService.send(null, Deno.env.get('PROXY_SUPPORT_EMAIL'), ` Manual Proxy Configuration Required - Job ${jobId}`, supportEmailContent);
    await logEvent({
      component: 'proxy_service',
      action: 'manual_setup_initiated',
      level: 'info',
      message: `Initiated manual proxy setup for job ${jobId} with whitelisted IP`,
      metadata: {
        jobId,
        country: orderData.country || CONFIG.PROXY.DEFAULT_COUNTRY,
        supportNotified: true,
        whitelistedIp
      }
    });
  }
}
class InstanceService {
  static async getOrCreate(jobType, jobId, jobData, clientIp) {
    const vmType = jobType === 'vps_provision' ? 'vps' : 'rdp';
    const { instance: instanceTable } = getTableNames(vmType);
    if (!jobData.order_id || jobData.order_id === 'undefined' || !jobData.user_id || jobData.user_id === 'undefined') {
      throw new Error(`Invalid jobData: missing or invalid order_id (${jobData.order_id}) or user_id (${jobData.user_id})`);
    }
    const { data: existing, error: checkError } = await supabase.from(instanceTable).select('*').eq('id', jobId).single();
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing instance: ${checkError.message}`);
    }
    if (existing) {
      await this.resetIfFailed(vmType, existing);
      return existing;
    }
    return await this.create(vmType, jobId, jobData, clientIp);
  }
  static async resetIfFailed(vmType, instance) {
    if (instance.status === 'error' || instance.status === 'failed') {
      const { instance: instanceTable } = getTableNames(vmType);
      await supabase.from(instanceTable).update({
        status: 'creating',
        error_message: null,
        updated_at: new Date().toISOString()
      }).eq('id', instance.id);
    }
  }
  static async create(vmType, jobId, jobData, clientIp) {
    const { instance: instanceTable } = getTableNames(vmType);
    const cleanOrderId = jobData.order_id && jobData.order_id !== 'undefined' ? jobData.order_id : null;
    const cleanUserId = jobData.user_id && jobData.user_id !== 'undefined' ? jobData.user_id : null;
    if (!cleanOrderId || !cleanUserId) {
      throw new Error(`Invalid UUID fields: order_id=${cleanOrderId}, user_id=${cleanUserId}`);
    }
    const baseData = {
      id: jobId,
      [`${vmType}_order_id`]: cleanOrderId,
      user_id: cleanUserId,
      vm_id: null,
      node: 'local',
      status: 'creating',
      cpu_cores: jobData.cpu_cores || 1,
      ram_gb: jobData.ram_gb || 1,
      storage_gb: jobData.storage_gb || 10,
      hostname: jobData.hostname || `${vmType}-${jobId.slice(-8)}`,
      os_template: jobData.os_template,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      proxmox_public_ip: CONFIG.PUBLIC_IP
    };
    const instanceData = vmType === 'vps' ? {
      ...baseData,
      root_password: generateSecurePassword()
    } : {
      ...baseData,
      rdp_username: jobData.rdp_username || 'rdpuser',
      rdp_password: jobData.rdp_password || generateSecurePassword(),
      rdp_port: jobData.rdp_port || 3389,
      concurrent_users: jobData.concurrent_users || 1,
      service_type: jobData.service_type || 'standard'
    };
    const { error } = await supabase.from(instanceTable).insert(instanceData);
    if (error) {
      throw new Error(`Instance creation failed: ${error.message}`);
    }
    return instanceData;
  }
}
class NotificationService {
  constructor(){
    this.emailService = new EmailService();
  }
  async sendVMReadyEmail(vmType, instance, order, callbackData) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);
      if (userError || !userData?.user?.email) {
        console.error('Failed to fetch user email:', userError);
        return;
      }
      const template = vmType === 'vps' ? EmailTemplates.generateVPSReadyEmail(instance, order, callbackData) : EmailTemplates.generateRDPReadyEmail(instance, order, callbackData);
      const subject = ` Your ${vmType.toUpperCase()} ${vmType === 'vps' ? 'is' : 'Instance is'} Ready - Connection Details Inside`;
      await this.emailService.send(order.user_id, userData.user.email, subject, template);
      await logEvent({
        component: 'notification',
        action: 'ready_email_sent',
        level: 'info',
        message: `${vmType.toUpperCase()} ready email sent`,
        metadata: {
          instanceId: instance.id,
          userEmail: userData.user.email,
          serviceType: order.service_type,
          management_type: order.management_type,
          proxyOrderId: instance.proxy_order_id
        },
        user_id: order.user_id,
        vm_id: instance.vm_id,
        order_id: order.id
      });
    } catch (error) {
      await logEvent({
        component: 'notification',
        action: 'ready_email_failed',
        level: 'error',
        message: `Failed to send ${vmType} ready email: ${error.message}`,
        metadata: {
          instanceId: instance.id,
          error: error.message
        }
      });
    }
  }
}
class ProvisioningService {
  constructor(){
    this.proxyService = new ProxyService();
    this.notificationService = new NotificationService();
  }
  async processJob(job, clientIp) {
    const { id: job_id, job_type, data: jobData } = job;
    await logEvent({
      component: 'provision',
      action: 'job_data_validation',
      level: 'debug',
      message: `Validating job data for ${job_id}`,
      metadata: {
        jobId: job_id,
        jobType: job_type,
        jobData: {
          order_id: jobData.order_id,
          user_id: jobData.user_id,
          os_template: jobData.os_template,
          cpu_cores: jobData.cpu_cores,
          ram_gb: jobData.ram_gb,
          storage_gb: jobData.storage_gb,
          hostname: jobData.hostname,
          client_ip: clientIp
        }
      }
    });
    if (!jobData.order_id || jobData.order_id === 'undefined') {
      throw new Error(`Invalid job data: order_id is missing or undefined (received: ${jobData.order_id})`);
    }
    if (!jobData.user_id || jobData.user_id === 'undefined') {
      throw new Error(`Invalid job data: user_id is missing or undefined (received: ${jobData.user_id})`);
    }
    if (!VALID_TEMPLATES.includes(jobData.os_template)) {
      throw new Error(`Invalid os_template: ${jobData.os_template}`);
    }
    const vmType = job_type === 'vps_provision' ? 'vps' : 'rdp';
    const orderTable = job_type === 'vps_provision' ? 'vps_orders' : 'rdp_orders';
    const { data: orderData, error: orderError } = await supabase.from(orderTable).select('country, service_type, management_type').eq('id', jobData.order_id).single();
    if (orderError) {
      console.warn(`Failed to fetch order data: ${orderError.message}`);
    }
    const ansibleData = {
      ...jobData,
      job_id,
      vm_type: jobData.type || (job_type === 'vps_provision' ? 'vps' : 'rdp'),
      os_template: TEMPLATE_MAPPING[jobData.os_template] || jobData.os_template,
      callback_url: Deno.env.get('CALLBACK_URL')
    };
    const instance = await InstanceService.getOrCreate(job_type, job_id, jobData, clientIp);
    ansibleData.instance_id = instance.id;
    if (job_type === 'vps_provision') {
      ansibleData.root_password = instance.root_password;
    } else {
      ansibleData.rdp_username = instance.rdp_username;
      ansibleData.rdp_password = instance.rdp_password;
    }
    let userEmail = null;
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(jobData.user_id);
      userEmail = userData?.user?.email;
    } catch (error) {
      console.warn('Failed to get user email for proxy notifications:', error);
    }
    const proxyResult = await this.proxyService.setupProxyForOrder(job_id, orderData || {}, userEmail, clientIp, vmType);
    if (proxyResult) {
      ansibleData.proxy_config = proxyResult.proxyConfig;
      if (proxyResult.proxyOrderId) {
        const proxyCredentials = {
          proxy_ip: proxyResult.proxyConfig.proxy_ip,
          proxy_port: proxyResult.proxyConfig.proxy_port,
          proxy_username: proxyResult.proxyConfig.proxy_username,
          proxy_password: proxyResult.proxyConfig.proxy_password,
          protocol: proxyResult.proxyConfig.protocol,
          country: proxyResult.proxyConfig.country
        };
        await supabase.from(getTableNames(vmType).instance).update({
          proxy_order_id: proxyResult.proxyOrderId,
          proxy_credentials: proxyCredentials,
          updated_at: new Date().toISOString()
        }).eq('id', instance.id);
        await supabase.from(orderTable).update({
          proxy_order_id: proxyResult.proxyOrderId,
          updated_at: new Date().toISOString()
        }).eq('id', jobData.order_id);
      }
    }
    const ansibleResult = await this.callAnsible(ansibleData, job_id);
    if (ansibleResult.status === 'success' && ansibleResult.vm_id) {
      await this.processSuccess(job, ansibleResult, instance.id);
    }
    return ansibleResult;
  }
  async callAnsible(data, jobId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
    try {
      const response = await fetch(`${Deno.env.get('ANSIBLE_SERVER_URL')}/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('ANSIBLE_API_KEY')}`
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      const contentType = response.headers.get('Content-Type') || '';
      const rawBody = await response.text();
      if (!contentType.includes('application/json')) {
        throw new Error(`Ansible server returned non-JSON Content-Type: ${contentType}`);
      }
      const result = JSON.parse(rawBody);
      if (!response.ok) {
        throw new Error(result.error || `Ansible server returned ${response.status}: ${response.statusText}`);
      }
      await logEvent({
        component: 'ansible',
        action: 'provision_request_sent',
        level: 'info',
        message: `Successfully sent provision request to Ansible for job ${jobId}`,
        metadata: {
          jobId,
          ansibleResponse: result
        }
      });
      return result;
    } finally{
      clearTimeout(timeoutId);
    }
  }
  async processSuccess(job, ansibleResult, instanceId) {
    const vmType = job.job_type === 'vps_provision' ? 'vps' : 'rdp';
    const { instance: instanceTable, order: orderTable } = getTableNames(vmType);
    const instanceUpdateData = {
      vm_id: ansibleResult.vm_id,
      status: vmType === 'vps' ? 'running' : 'active',
      ip_address: ansibleResult.ip_address,
      vm_external_port: ansibleResult.external_port,
      connection_info: ansibleResult.connection,
      provisioned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (vmType === 'vps') {
      instanceUpdateData.root_password = ansibleResult.credentials?.password;
    } else {
      instanceUpdateData.rdp_username = ansibleResult.credentials?.username;
      instanceUpdateData.rdp_password = ansibleResult.credentials?.password;
    }
    const { data: updatedInstance, error: instanceError } = await supabase.from(instanceTable).update(instanceUpdateData).eq('id', instanceId).select('*').single();
    if (instanceError) {
      throw new Error(`Failed to update instance: ${instanceError.message}`);
    }
    const orderUpdateData = {
      vm_id: ansibleResult.vm_id,
      status: vmType === 'vps' ? 'running' : 'active',
      activated_at: new Date().toISOString(),
      ip_address: ansibleResult.ip_address,
      vm_external_port: ansibleResult.external_port,
      updated_at: new Date().toISOString()
    };
    const { data: order, error: orderError } = await supabase.from(orderTable).select('*').eq('id', job.data.order_id).single();
    if (!orderError && order) {
      await supabase.from(orderTable).update(orderUpdateData).eq('id', order.id);
      await this.notificationService.sendVMReadyEmail(vmType, updatedInstance, order, ansibleResult);
    }
    await supabase.from('provisioning_jobs').update({
      status: 'completed',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }).eq('id', job.id);
    await logEvent({
      component: 'provision',
      action: 'provision_completed',
      level: 'info',
      message: `Successfully completed provisioning for job ${job.id}`,
      metadata: {
        jobId: job.id,
        vmId: ansibleResult.vm_id,
        instanceId
      }
    });
  }
  async handleFailure(job, error) {
    const retryCount = (job.retry_count || 0) + 1;
    const maxRetries = job.max_retries || 3;
    const nextRetryAt = retryCount < maxRetries ? new Date(Date.now() + CONFIG.RETRY_DELAY_MS).toISOString() : null;
    const errorMessage = error.name === 'AbortError' ? 'Ansible request timed out after 5 minutes' : error.message;
    await supabase.from('provisioning_jobs').update({
      status: retryCount < maxRetries ? 'pending' : 'failed',
      error_message: `Ansible provisioning failed: ${errorMessage}`,
      retry_count: retryCount,
      max_retries: maxRetries,
      next_retry_at: nextRetryAt,
      updated_at: new Date().toISOString(),
      completed_at: retryCount >= maxRetries ? new Date().toISOString() : null
    }).eq('id', job.id);
    await logEvent({
      component: 'provision',
      action: 'provision_failed',
      level: 'error',
      message: `Provisioning failed for job ${job.id}: ${errorMessage}`,
      metadata: {
        jobId: job.id,
        retryCount,
        maxRetries,
        error: errorMessage
      }
    });
    return {
      retryCount,
      maxRetries,
      nextRetryAt,
      errorMessage
    };
  }
}
class CallbackService {
  constructor(){
    this.notificationService = new NotificationService();
  }
  async processCallback(callbackData) {
    const { type, vm_id, status, job_id, message, connection_details, credentials, error, vm_info } = callbackData;
    if (!type || !vm_id || !status || !job_id) {
      throw new Error('Callback data must include type, vm_id, status, and job_id');
    }
    const vmType = getVMTypeFromId(vm_id, vm_info);
    if (!vmType || ![
      'rdp',
      'vps'
    ].includes(vmType)) {
      await logEvent({
        component: 'callback',
        action: 'invalid_vm_type',
        level: 'error',
        message: `Invalid or undetermined VM type for vm_id ${vm_id}`,
        metadata: {
          vmId: vm_id,
          vmInfo: vm_info
        }
      });
      throw new Error(`Invalid VM type for vm_id ${vm_id}`);
    }
    const { instance: instanceTable, order: orderTable } = getTableNames(vmType);
    const { data: instance, error: instanceError } = await supabase.from(instanceTable).select('*').eq('id', job_id).single();
    if (instanceError || !instance) {
      throw new Error(`Instance not found for job_id ${job_id}: ${instanceError?.message || 'No instance'}`);
    }
    const instanceUpdateData = {
      vm_id: parseInt(vm_id, 10),
      status: status === 'success' ? vmType === 'vps' ? 'running' : 'active' : status,
      updated_at: new Date().toISOString()
    };
    if (status === 'success') {
      instanceUpdateData.ip_address = connection_details?.connection_string || connection_details?.external_ip;
      instanceUpdateData.vm_external_port = connection_details?.external_port;
      instanceUpdateData.connection_info = connection_details?.connection_string;
      instanceUpdateData.provisioned_at = new Date().toISOString();
      if (vmType === 'vps') {
        instanceUpdateData.root_password = credentials?.password || credentials?.root_password;
      } else {
        instanceUpdateData.rdp_username = credentials?.rdp_username || credentials?.username;
        instanceUpdateData.rdp_password = credentials?.rdp_password || credentials?.password;
      }
    } else if (status === 'failed') {
      instanceUpdateData.status = 'failed';
      instanceUpdateData.error_message = error || message || 'Provisioning failed';
      instanceUpdateData.failed_at = new Date().toISOString();
    }
    const { data: updatedInstance, error: updateError } = await supabase.from(instanceTable).update(instanceUpdateData).eq('id', job_id).select('*').single();
    if (updateError) {
      throw new Error(`Failed to update instance: ${updateError.message}`);
    }
    const orderUpdateData = {
      vm_id: parseInt(vm_id, 10),
      status: status === 'success' ? vmType === 'vps' ? 'running' : 'active' : 'failed',
      updated_at: new Date().toISOString()
    };
    if (status === 'success') {
      orderUpdateData.activated_at = new Date().toISOString();
      orderUpdateData.ip_address = connection_details?.connection_string || connection_details?.external_ip;
      orderUpdateData.vm_external_port = connection_details?.external_port;
    } else if (status === 'failed') {
      orderUpdateData.error_message = error || message || 'Provisioning failed';
    }
    const { data: order, error: orderError } = await supabase.from(orderTable).select('*').eq('id', updatedInstance[`${vmType}_order_id`]).single();
    if (!orderError && order) {
      await supabase.from(orderTable).update(orderUpdateData).eq('id', order.id);
      if (status === 'success') {
        const normalizedCallbackData = {
          ip_address: connection_details?.external_ip,
          external_port: connection_details?.external_port,
          connection: connection_details?.connection_string,
          credentials,
          proxy_config: instance.proxy_order_id ? {
            status: 'pending',
            ...instance.proxy_credentials
          } : null,
          whitelist_ip: instance.whitelist_ip
        };
        await this.notificationService.sendVMReadyEmail(vmType, updatedInstance, order, normalizedCallbackData);
      }
    }
    await supabase.from('provisioning_jobs').update({
      status: status === 'success' ? 'completed' : 'failed',
      error_message: status === 'failed' ? error || message : null,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }).eq('id', job_id);
    await logEvent({
      component: 'callback',
      action: 'processed',
      level: 'info',
      message: `Successfully processed callback for job ${job_id}: ${status}`,
      metadata: {
        jobId: job_id,
        vmId: vm_id,
        status,
        vmType,
        whitelistIp: instance.whitelist_ip
      }
    });
    return {
      jobId: job_id,
      status: 'ok'
    };
  }
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  const url = new URL(req.url);
  const path = url.pathname.toLowerCase().replace(/\/+$/, '');
  await logEvent({
    component: 'edge_function',
    action: 'request_received',
    level: 'debug',
    message: `Received request for path: ${path}`,
    metadata: {
      method: req.method,
      url: req.url,
      path
    }
  });
  try {
    if ((path === '/callback' || path === '/provisioning-worker/callback') && req.method === 'POST') {
      const contentType = req.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        return createResponse({
          error: `Expected Content-Type: application/json, received: ${contentType}`
        }, 400);
      }
      const callbackData = await req.json();
      console.log('[DEBUG] Callback request body:', JSON.stringify(callbackData, null, 2));
      const callbackService = new CallbackService();
      const result = await callbackService.processCallback(callbackData);
      return createResponse({
        message: `Callback processed for job ${result.jobId}`,
        status: result.status
      });
    }
    if (req.method !== 'POST') {
      return createResponse({
        error: 'Method not allowed'
      }, 405);
    }
    const body = await req.json();
    console.log('[DEBUG] Raw request body:', JSON.stringify(body, null, 2));
    if (!body.job_id) {
      return createResponse({
        error: 'Invalid request format. Expected { job_id: string }'
      }, 400);
    }
    const { job_id } = body;
    const { data: job, error: jobError } = await supabase.from('provisioning_jobs').select('id, job_type, status, data, retry_count, max_retries, started_at, error_message').eq('id', job_id).single();
    if (jobError || !job) {
      await logEvent({
        component: 'job',
        action: 'not_found',
        level: 'error',
        message: `Provisioning job ${job_id} not found`,
        metadata: {
          jobId: job_id,
          error: jobError?.message
        }
      });
      return createResponse({
        error: `Provisioning job ${job_id} not found`
      }, 404);
    }
    const clientIp = job.data.client_ip || null;
    await logEvent({
      component: 'job',
      action: 'job_retrieved',
      level: 'debug',
      message: `Retrieved job ${job_id} with data`,
      metadata: {
        jobId: job_id,
        jobType: job.job_type,
        jobStatus: job.status,
        hasJobData: !!job.data,
        jobDataKeys: job.data ? Object.keys(job.data) : [],
        orderIdType: typeof job.data?.order_id,
        orderIdValue: job.data?.order_id,
        userIdType: typeof job.data?.user_id,
        userIdValue: job.data?.user_id,
        clientIp
      }
    });
    if (job.status === 'completed' || job.status === 'failed') {
      return createResponse({
        message: `Job status: ${job.status}`,
        job_id,
        status: job.status,
        job_type: job.job_type,
        error_message: job.error_message
      });
    }
    const locked = await JobLockService.acquire(job_id);
    if (!locked) {
      return createResponse({
        error: `Job ${job_id} is already processing or not pending`
      }, 409);
    }
    if (job.job_type === 'vps_provision' || job.job_type === 'rdp_provision') {
      const provisioningService = new ProvisioningService();
      try {
        const result = await provisioningService.processJob(job, clientIp);
        return createResponse({
          message: 'Job provisioning started successfully',
          job_id,
          ansible_response: result
        });
      } catch (error) {
        const failureResult = await provisioningService.handleFailure(job, error);
        return createResponse({
          error: `Ansible provisioning failed: ${failureResult.errorMessage}`,
          retry_count: failureResult.retryCount,
          max_retries: failureResult.maxRetries,
          next_retry_at: failureResult.nextRetryAt
        }, error.name === 'AbortError' ? 504 : 500);
      }
    }
    return createResponse({
      error: `Invalid job type: ${job.job_type}`
    }, 400);
  } catch (error) {
    await logEvent({
      component: 'edge_function',
      action: 'request_failed',
      level: 'error',
      message: `Request processing failed: ${error.message}`,
      metadata: {
        error: error.message,
        path
      }
    });
    return createResponse({
      error: `Server error: ${error.message}`
    }, 500);
  }
});