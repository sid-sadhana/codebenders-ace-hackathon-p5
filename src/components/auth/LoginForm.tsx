"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import type { LoginContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const initialState: LoginState = { error: null };

export type PickedUsername = { username: string; at: number } | null;

type LoginFormProps = {
  content: LoginContent;
  next: string | null;
  picked: PickedUsername;
};

export function LoginForm({ content, next, picked }: LoginFormProps) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // A username chosen from the list fills the field and moves to the password.
  useEffect(() => {
    if (!picked || !usernameRef.current || !passwordRef.current) return;
    usernameRef.current.value = picked.username;
    passwordRef.current.value = "";
    passwordRef.current.focus();
  }, [picked]);

  const errorText = state.error ? t(content.errors[state.error]) : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-base">
          {t(content.usernameLabel)}
        </Label>
        <Input
          ref={usernameRef}
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.username}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorText ? "login-error" : undefined}
          className="h-11 text-base md:text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          {t(content.passwordLabel)}
        </Label>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={errorText ? true : undefined}
            aria-describedby={errorText ? "login-error" : undefined}
            className="h-11 pr-12 text-base md:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={t(showPassword ? content.hidePassword : content.showPassword)}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {errorText && (
        <p
          id="login-error"
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {errorText}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full gap-2 text-base sm:w-auto sm:px-6">
        {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {t(pending ? content.submitting : content.submit)}
      </Button>
    </form>
  );
}
