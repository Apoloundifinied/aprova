import { signIn } from "../actions";
import { configured } from "../../lib/supabase";

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <main className="login">
    <p className="eyebrow">Área do freelancer</p>
    <h1>Entre no Aprova</h1>
    {configured() ? <form className="panel fields" action={signIn}>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      {erro && <p role="alert">Não foi possível entrar. Confira seu e-mail e sua senha.</p>}
      <button type="submit">Entrar</button>
    </form> : <p className="panel">Configure a conexão com o Supabase para acessar o ambiente de desenvolvimento.</p>}
  </main>;
}
