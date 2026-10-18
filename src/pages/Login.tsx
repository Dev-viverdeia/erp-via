import { NEGOCIO, tintaLegivel } from "@/config/negocio";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const logoDaCapa = tintaLegivel(NEGOCIO.cores.primaria) === "#FFFFFF" ? NEGOCIO.logos.escuro : NEGOCIO.logos.claro;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-primary text-primary-foreground">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-white/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-md px-12 space-y-8">
          {logoDaCapa ? (
            <img src={logoDaCapa} alt={NEGOCIO.nome} className="h-7 w-auto" />
          ) : (
            <p className="text-xl font-bold font-heading">{NEGOCIO.nome}</p>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-heading leading-tight">
              {NEGOCIO.slogan}
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">{NEGOCIO.descricao}</p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10 bg-background">
        <div className="w-full max-w-md space-y-7 rounded-3xl border border-border/50 bg-card/70 p-6 sm:p-8 shadow-xl shadow-primary/5 backdrop-blur-xl animate-fade-in">
          {/* A marca continua visível também em telas pequenas. */}
          <div className="flex items-center justify-center lg:hidden">
            {NEGOCIO.logos.claro ? (
              <img src={NEGOCIO.logos.claro} alt={NEGOCIO.nome} className="h-5 w-auto dark:hidden" />
            ) : null}
            {NEGOCIO.logos.escuro ? (
              <img src={NEGOCIO.logos.escuro} alt={NEGOCIO.nome} className="h-5 w-auto hidden dark:block" />
            ) : null}
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <p className="text-xl font-semibold text-primary">{NEGOCIO.nome}</p>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground">Bem-vindo de volta</h1>
            <p className="text-xl text-muted-foreground">Entre com seu e-mail e senha</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xl font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 text-xl md:text-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xl font-medium">Senha</Label>
                <Link to="/reset-password" className="inline-flex min-h-11 items-center text-md text-primary hover:underline transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 text-xl md:text-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xl font-semibold cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Entrando…</>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xl text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="inline-flex min-h-11 items-center text-primary font-medium hover:underline transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
