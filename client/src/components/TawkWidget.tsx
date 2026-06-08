import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// Replace these with actual Tawk Property ID and Widget ID from env or config
const TAWK_PROPERTY_ID = import.meta.env.VITE_TAWK_PROPERTY_ID || "YOUR_PROPERTY_ID";
const TAWK_WIDGET_ID = import.meta.env.VITE_TAWK_WIDGET_ID || "default";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: any;
  }
}

export default function TawkWidget() {
  const { user, isAuthenticated } = useAuth();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    
    // Setup Tawk object
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Inject Tawk.to script
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    
    if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
    } else {
        document.head.appendChild(s1);
    }
    
    scriptLoaded.current = true;
  }, []);

  useEffect(() => {
    const setTawkVisitor = async () => {
      if (isAuthenticated && window.Tawk_API) {
        try {
          // Note: using the /web namespace where our controller is defined
          const apiUrl = API_URL.replace('/api/v1', '/web/api'); 
          const res = await fetch(`${apiUrl}/tawk/secure_hash`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });
          const data = await res.json();
          
          if (res.ok && data.hash) {
            window.Tawk_API.setAttributes({
              name: data.name,
              email: data.email,
              hash: data.hash
            }, function (error: any) {
               if (error) console.error("Tawk Set Attributes Error:", error);
            });
          }
        } catch (err) {
          console.error("Failed to set Tawk visitor:", err);
        }
      }
    };

    if (window.Tawk_API) {
       if (window.Tawk_API.loaded) {
           setTawkVisitor();
       } else {
           window.Tawk_API.onLoad = function() {
               setTawkVisitor();
           };
       }
    }
  }, [isAuthenticated, user]);

  return null;
}
