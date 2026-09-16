import { NEGOCIO } from "@/config/negocio";
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[#080808] text-white">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-md px-12 space-y-8">
          {NEGOCIO.logos.escuro ? (
            <img src={NEGOCIO.logos.escuro} alt={NEGOCIO.nome} className="h-7 w-auto" />
          ) : (
            <p className="text-xl font-bold font-heading">{NEGOCIO.nome}</p>
          )}

          <div className="space-y-4">
            <h2 className="text-3xl font-bold font-heading leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-accent">
              {NEGOCIO.slogan}
            </h2>
            <p className="text-white/60 leading-relaxed">{NEGOCIO.descricao}</p>
          </div>

          <div className="flex gap-6 pt-4">
            {[
              { label: "Uptime", value: "99.9%" },
              { label: "Empresas", value: "150+" },
              { label: "Transacoes/mes", value: "50k+" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-xl font-bold font-heading text-primary">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden">
            {NEGOCIO.logos.claro ? (
              <img src={NEGOCIO.logos.claro} alt={NEGOCIO.nome} className="h-5 w-auto dark:hidden" />
            ) : null}
            {NEGOCIO.logos.escuro ? (
              <img src={NEGOCIO.logos.escuro} alt={NEGOCIO.nome} className="h-5 w-auto hidden dark:block" />
            ) : (
              <p className="text-lg font-bold font-heading">{NEGOCIO.nome}</p>
            )}
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold font-heading text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link to="/reset-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Esqueceu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Nao tem conta?{" "}
            <Link to="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
