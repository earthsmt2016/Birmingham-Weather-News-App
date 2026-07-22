import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginDialogProps {
  open: boolean;
  username: string;
  password: string;
  error: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

const LOGIN_CLASSES = {
  form: "flex flex-col gap-4 mt-2",
  field: "flex flex-col gap-1.5",
  error: "text-sm text-destructive",
} as const;

export function AdminLoginDialog({
  open,
  username,
  password,
  error,
  pending,
  onOpenChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className={LOGIN_CLASSES.form}>
          <div className={LOGIN_CLASSES.field}>
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              autoComplete="username"
              data-testid="input-login-username"
            />
          </div>
          <div className={LOGIN_CLASSES.field}>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              autoComplete="current-password"
              data-testid="input-login-password"
            />
          </div>
          {error && (
            <p className={LOGIN_CLASSES.error} data-testid="text-login-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} data-testid="button-login-submit">
            {pending ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
