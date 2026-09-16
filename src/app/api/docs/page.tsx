"use client";

import React, { useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";

export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically load Swagger UI bundle
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle loaded globally
      if (window.SwaggerUIBundle) {
        // @ts-expect-error SwaggerUIBundle loaded globally
        window.SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            // @ts-expect-error SwaggerUIBundle loaded globally
            window.SwaggerUIBundle.presets.apis,
            // @ts-expect-error SwaggerUIBundle loaded globally
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <AppLayout>
      <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between pb-space-4 border-b border-outline-variant/30 mb-space-4">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary font-bold">
              OpenAPI & Swagger Documentation
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Interactive contract-first API explorer for all 16 modules of Going Merry HMS.
            </p>
          </div>
          <a
            href="/api/openapi.json"
            target="_blank"
            className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary font-label-md flex items-center gap-2 transition-colors border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Raw openapi.json</span>
          </a>
        </div>
        <div id="swagger-ui" className="min-h-[600px]" />
      </div>
    </AppLayout>
  );
}
