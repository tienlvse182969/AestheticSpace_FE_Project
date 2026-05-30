import { useEffect, useRef, useState } from "react";
import { Text } from "@chakra-ui/react";
import { Loader2 } from "lucide-react";
import googleLogo from "../../assets/google_logo_icon.png";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string;
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface Props {
  label: string;
  onCredential: (idToken: string) => Promise<void>;
  onError: () => void;
}

export function GoogleAuthButton({ label, onCredential, onError }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const overlayRef              = useRef<HTMLDivElement>(null);
  const wrapperRef              = useRef<HTMLDivElement>(null);
  const initialized             = useRef(false);
  const credentialCb            = useRef(onCredential);
  const errorCb                 = useRef(onError);

  useEffect(() => { credentialCb.current = onCredential; }, [onCredential]);
  useEffect(() => { errorCb.current     = onError;       }, [onError]);

  useEffect(() => {
    if (initialized.current) return;

    const tryInit = () => {
      if (!window.google?.accounts?.id) return false;
      if (!overlayRef.current || !wrapperRef.current) return false;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) return false;

      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: async (response) => {
          setLoading(true);
          try {
            await credentialCb.current(response.credential);
          } catch {
            errorCb.current();
          } finally {
            setLoading(false);
          }
        },
      });

      // Render Google's button into the transparent overlay div.
      // It captures clicks and handles credential flow without COOP issues.
      window.google.accounts.id.renderButton(overlayRef.current, {
        type:  "standard",
        theme: "outline",
        size:  "large",
        width: wrapperRef.current.offsetWidth || 340,
        text:  "continue_with",
      });

      return true;
    };

    if (tryInit()) return;

    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", width: "100%", height: "44px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Custom visual button (pointer-events off — overlay handles clicks) ── */}
      <div
        style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            10,
          borderRadius:   "6px",
          border:         "1px solid rgba(200,205,215,0.55)",
          background:     hovered ? "rgba(235,238,245,0.98)" : "rgba(245,247,250,0.97)",
          transition:     "background 0.2s",
          pointerEvents:  "none",
          opacity:        loading ? 0.65 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "auth-spin 0.75s linear infinite", color: "#555" }} />
        ) : (
          <>
            <img
              src={googleLogo}
              alt=""
              style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }}
            />
            <Text style={{
              fontSize:      "0.875rem",
              color:         "#3c4043",
              fontFamily:    "'HarmonyOS Sans', sans-serif",
              fontWeight:    500,
              letterSpacing: "0.01em",
            }}>
              {label}
            </Text>
          </>
        )}
      </div>

      {/* ── Transparent overlay: Google's rendered button captures the click ── */}
      <div
        ref={overlayRef}
        style={{
          position:      "absolute",
          inset:         0,
          overflow:      "hidden",
          opacity:       0.001,      // invisible but clickable
          zIndex:        1,
          pointerEvents: loading ? "none" : "auto",
        }}
      />
    </div>
  );
}
