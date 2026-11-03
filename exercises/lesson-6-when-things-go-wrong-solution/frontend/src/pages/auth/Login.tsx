import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router";
import * as z from "zod";

import { useAuth, type AuthUser } from "../../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

const inputClass =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

/**
 * The login page is the one screen allowed to talk to the backend without a
 * token — it is where tokens come from.
 *
 * Note what it does NOT do: it does not decide whether you are allowed
 * anywhere. It hands the token to the auth context and leaves.
 */
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // `protectedLoader` puts where-they-were-going in the URL, so we can send
  // them back there instead of dumping everyone on the same page.
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "/expenses";
  // This error comes back from the server, so react-hook-form cannot know
  // about it — it validates the form before the request is ever made.
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Login failed");
      }

      login(body.token, body.user as AuthUser);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">Log in</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className={inputClass}
            {...register("email")}
          />
          {errors.email && (
            <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            {...register("password")}
          />
          {errors.password && (
            <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
          )}
        </div>

        {serverError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-400"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-xs text-slate-500">
        Demo accounts: <code className="text-slate-700">john.doe@example.com</code> …{" "}
        <code className="text-slate-700">soufiane.doe@example.com</code>, password{" "}
        <code className="text-slate-700">topsecret</code>.
      </p>
    </div>
  );
}

export default Login;
