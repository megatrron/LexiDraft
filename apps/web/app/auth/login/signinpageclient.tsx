// app/auth/login/SignInPageClient.tsx
"use client";
import React from "react";
import { signIn } from "next-auth/react";

interface Provider {
  id: string;
  name: string;
}

interface SignInPageClientProps {
  providers: Record<string, Provider> | null;
}

export default function SignInPageClient({ providers }: SignInPageClientProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 sm:px-6 lg:px-8 selection:bg-zinc-200">
      
      {/* Central Login Card */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm mb-6">
            {/* Simple placeholder for a LexiDraft Logo (e.g., a pen or text icon) */}
            <span className="text-white text-2xl font-serif italic">L</span>
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Welcome to LexiDraft
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to your AI-powered workspace
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {providers &&
            Object.values(providers).map((provider) => {
              
              // --------------------------------------------------
              // CREDENTIALS FORM DESIGN
              // --------------------------------------------------
              if (provider.id === "credentials") {
                return (
                  <div key="credentials" className="space-y-6 mt-6">
                    
                    {/* Minimalist Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-zinc-400">or continue with email</span>
                      </div>
                    </div>

                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get("email");
                        const password = formData.get("password");
                        const name = formData.get("name");

                        await signIn("credentials", {
                          redirect: true,
                          email,
                          password,
                          name,
                          callbackUrl: "/dashboard",
                        });
                      }}
                    >
                      <div className="space-y-3">
                        <input
                          className="w-full appearance-none rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors sm:text-sm"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                        />
                        <input
                          className="w-full appearance-none rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors sm:text-sm"
                          name="name"
                          type="text"
                          placeholder="Your Name"
                          required
                        />
                        <input
                          className="w-full appearance-none rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors sm:text-sm"
                          name="password"
                          type="password"
                          placeholder="Password"
                          required
                        />
                      </div>
                      
                      <button
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
                        type="submit"
                      >
                        Sign In
                      </button>
                    </form>
                  </div>
                );
              }

              // --------------------------------------------------
              // GOOGLE OAUTH BUTTON DESIGN
              // --------------------------------------------------
              return (
                <div key={provider.name}>
                  <button
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-zinc-200 rounded-xl shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-100 transition-colors"
                    onClick={() => {
                      signIn("google", {
                        callbackUrl: "/dashboard",
                      });
                    }}
                  >
                    {/* SVG Google Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with {provider.name}
                  </button>
                </div>
              );
            })}
        </div>

        {/* <p className="mt-8 text-center text-xs text-zinc-500">
          By continuing, you agree to LexiDraft's Terms of Service and Privacy Policy.
        </p> */}

      </div>
    </div>
  );
}