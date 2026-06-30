import React, { useState } from "react";
import { environmentConfig } from "../../config/environment";
import { LOCAL_ENTRY_POINTS } from "../../constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Validates the referrer URL synchronously
 * Returns true if the referrer matches the allowed referrer domain
 * Bypasses check for localhost:3000 and localhost:3001 (local development)
 */
function validateReferrer(): boolean {
  const allowedReferrerDomain = environmentConfig.allowedReferrerDomain;

  // Bypass check for localhost development
  const currentOrigin = window.location.origin;
  if (LOCAL_ENTRY_POINTS.includes(currentOrigin)) {
    return true;
  }

  // Get the referrer from document.referrer
  const referrer = document.referrer;

  // Validate the referrer
  if (referrer && referrer === allowedReferrerDomain) {
    return true;
  }

  // No referrer or referrer doesn't match
  return false;
}

/**
 * ProtectedRoute component that validates the referrer URL
 * Only allows access if the initial request came from the allowed referrer domain
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isValidated] = useState(() => validateReferrer());
  const allowedReferrerDomain = environmentConfig.allowedReferrerDomain;

  // Access denied
  if (!isValidated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h1 style={{ color: "#d32f2f", marginBottom: "20px" }}>
            Access Denied
          </h1>
          <p style={{ color: "#666", marginBottom: "10px" }}>
            This application is not accessible from your referrer.
          </p>
          <p style={{ color: "#999", fontSize: "14px" }}>
            You must access this application from {allowedReferrerDomain}
          </p>
        </div>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
};

export default ProtectedRoute;
